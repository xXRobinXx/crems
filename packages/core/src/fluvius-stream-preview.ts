import type { FluviusInterval, FluviusReason } from "./fluvius-quarter-hour.js";

const FLUVIUS_HEADERS = ["Van (datum)", "Van (tijdstip)", "Tot (datum)", "Tot (tijdstip)", "EAN-code", "Meter", "Metertype", "Register", "Volume", "Eenheid", "Validatiestatus", "Omschrijving"] as const;
const MAX_ROWS = 250_000;
const MAX_RECORD_CHARS = 64 * 1024;

class StreamError extends Error { readonly code: string; constructor(code: string, message: string) { super(message); this.code = code; } }
class CsvParseError extends StreamError {}
class FluviusSchemaError extends StreamError { constructor() { super("INVALID_FLUVIUS_SCHEMA", "Fluvius-schema is ongeldig"); } }

export type FluviusStreamSummary = {
  validCount: number; skippedCount: number; reasons: Record<FluviusReason, number>;
  measuredCount: number; estimatedCount: number; noConsumptionCount: number;
  gapCount: number; duplicateCount: number; overlapCount: number; integrityReliable: boolean; unorderedCount: number;
  importKwh: number; exportKwh: number; measuredImportKwh: number; estimatedImportKwh: number; measuredExportKwh: number; estimatedExportKwh: number;
  period: { start: string; end: string } | null; first: FluviusInterval | null; last: FluviusInterval | null;
  skippedRows: Record<FluviusReason, number[]>; truncatedCount: number; retainedIntervalCount: number; retainedCandidateCount: number;
};

const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const localKey = (date: Date) => { const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value])); return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`; };
const instants = (date: string, time: string) => {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) return [];
  const [day, month, year] = date.split("-").map(Number); const [hour, minute, second = 0] = time.split(":").map(Number);
  if (hour! > 23 || minute! > 59 || second > 59) return [];
  const expected = `${date} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  const center = Date.UTC(year!, month! - 1, day!, hour!, minute!, second);
  return [2, 1].map((offset) => center - offset * 3_600_000).filter((value) => localKey(new Date(value)) === expected);
};

const registers: Record<string, ["import" | "export", "day" | "night"]> = { "Afname Dag": ["import", "day"], "Afname Nacht": ["import", "night"], "Injectie Dag": ["export", "day"], "Injectie Nacht": ["export", "night"] };
const qualities: Record<string, FluviusInterval["quality"]> = { Uitgelezen: "measured", Geschat: "estimated", "Geen verbruik": "noConsumption" };
const newReasons = (): Record<FluviusReason, number> => ({ INVALID_DATE_TIME: 0, INVALID_INTERVAL: 0, INVALID_VALUE: 0, INVALID_UNIT: 0, INVALID_REGISTER: 0, INVALID_STATUS: 0 });

export const createFluviusRowScanner = (accept: (row: string[]) => void) => {
  let row: string[] = [], field = "", quoted = false, pendingQuote = false, pendingCr = false, first = true, recordChars = 0;
  const grow = (value: string) => { recordChars += value.length; if (recordChars > MAX_RECORD_CHARS) throw new CsvParseError("RECORD_TOO_LARGE", "CSV-record is te groot"); };
  const append = (value: string) => { field += value; if (field.length > MAX_RECORD_CHARS) throw new CsvParseError("FIELD_TOO_LARGE", "CSV-veld is te groot"); };
  const finishField = () => { row.push(field); field = ""; };
  const finishRow = () => { finishField(); accept(row); row = []; recordChars = 0; };
  const character = (value: string) => {
    if (first) { first = false; if (value === "\uFEFF") return; }
    if (pendingCr) { pendingCr = false; if (value === "\n") return; }
    if (pendingQuote) { pendingQuote = false; if (value === '"') { grow(value); append(value); return; } quoted = false; }
    if (value === '"') { grow(value); if (quoted) pendingQuote = true; else if (!field) quoted = true; else append(value); return; }
    if (!quoted && value === ";") { grow(value); finishField(); return; }
    if (!quoted && value === "\r") { finishRow(); pendingCr = true; return; }
    if (!quoted && value === "\n") { finishRow(); return; }
    grow(value); append(value);
  };
  return { push(chunk: string) { for (const value of chunk) character(value); }, finish() { if (pendingQuote) { pendingQuote = false; quoted = false; } if (quoted) throw new CsvParseError("UNCLOSED_QUOTE", "CSV bevat een niet-afgesloten quote"); if (field || row.length) finishRow(); } };
};

type StreamState = { previous?: FluviusInterval; previousLocal?: string; fallbackDate?: string; ordered: boolean };

export const createFluviusPreviewAnalyzer = (options: { onInterval?: (interval: FluviusInterval) => void } = {}) => {
  let header = true, rowNumber = 1, finished = false, validCount = 0, skippedCount = 0, first: FluviusInterval | null = null, last: FluviusInterval | null = null;
  let gapCount = 0, duplicateCount = 0, overlapCount = 0, unorderedCount = 0, measuredCount = 0, estimatedCount = 0, noConsumptionCount = 0;
  let importKwh = 0, exportKwh = 0, measuredImportKwh = 0, estimatedImportKwh = 0, measuredExportKwh = 0, estimatedExportKwh = 0, truncatedCount = 0;
  const reasons = newReasons(); const skippedRows: Record<FluviusReason, number[]> = { INVALID_DATE_TIME: [], INVALID_INTERVAL: [], INVALID_VALUE: [], INVALID_UNIT: [], INVALID_REGISTER: [], INVALID_STATUS: [] }; const streams = new Map<string, StreamState>();
  const skip = (reason: FluviusReason) => { skippedCount += 1; reasons[reason] += 1; if (skippedRows[reason].length < 20) skippedRows[reason].push(rowNumber); else truncatedCount += 1; };
  const scanner = createFluviusRowScanner((values) => {
    rowNumber += 1; if (rowNumber > MAX_ROWS + 1) throw new CsvParseError("ROW_LIMIT_EXCEEDED", "CSV bevat te veel rijen");
    if (header) { header = false; const headers = values.map((value) => value.trim()); if (headers.length !== FLUVIUS_HEADERS.length || headers.some((value, index) => value !== FLUVIUS_HEADERS[index])) throw new FluviusSchemaError(); return; }
    if (values.length === 1 && values[0] === "") return;
    if (values.length !== FLUVIUS_HEADERS.length) throw new CsvParseError(values.length < FLUVIUS_HEADERS.length ? "TOO_FEW_FIELDS" : "TOO_MANY_FIELDS", "CSV-rij heeft een ongeldig aantal velden");
    const register = registers[values[7]!.trim()]; if (!register) { skip("INVALID_REGISTER"); return; }
    const startCandidates = instants(values[0]!, values[1]!); const endCandidates = instants(values[2]!, values[3]!); if (!startCandidates.length || !endCandidates.length) { skip("INVALID_DATE_TIME"); return; }
    const key = `${register[0]}:${register[1]}`; const state = streams.get(key) ?? { ordered: true }; const startLocal = `${values[0]} ${values[1]}`;
    if (startCandidates.length === 2 && state.previousLocal && startLocal < state.previousLocal) state.fallbackDate = values[0]!;
    const start = startCandidates.length === 2 && state.fallbackDate === values[0] ? startCandidates[1]! : startCandidates[0]!; const end = endCandidates.find((candidate) => candidate > start) ?? endCandidates.at(-1)!;
    if (end - start !== 900_000) { skip("INVALID_INTERVAL"); return; }
    if (values[9]!.trim() !== "kWh") { skip("INVALID_UNIT"); return; }
    const quality = qualities[values[10]!.trim()]; if (!quality) { skip("INVALID_STATUS"); return; }
    const raw = values[8]!.trim(); const energy = quality === "noConsumption" && !raw ? 0 : /^\d+(?:,\d+)?$/.test(raw) ? Number(raw.replace(",", ".")) : Number.NaN; if (!Number.isFinite(energy) || energy < 0) { skip("INVALID_VALUE"); return; }
    const item: FluviusInterval = { start: new Date(start).toISOString(), end: new Date(end).toISOString(), direction: register[0], register: register[1], energyKwh: energy, quality };
    if (state.previous) { if (Date.parse(item.start) < Date.parse(state.previous.start)) { state.ordered = false; unorderedCount += 1; } if (state.ordered) { const delta = Date.parse(item.start) - Date.parse(state.previous.end); if (delta > 0) gapCount += 1; else if (delta < 0) overlapCount += 1; if (item.start === state.previous.start && item.end === state.previous.end) duplicateCount += 1; } }
    state.previous = item; state.previousLocal = startLocal; streams.set(key, state); options.onInterval?.(item); validCount += 1; if (!first || item.start < first.start) first = item; if (!last || item.start > last.start) last = item;
    if (quality === "measured") measuredCount += 1; else if (quality === "estimated") estimatedCount += 1; else noConsumptionCount += 1;
    if (item.direction === "import") { importKwh += energy; if (quality === "measured") measuredImportKwh += energy; if (quality === "estimated") estimatedImportKwh += energy; } else { exportKwh += energy; if (quality === "measured") measuredExportKwh += energy; if (quality === "estimated") estimatedExportKwh += energy; }
  });
  return {
    push(chunk: string) { if (finished) throw new Error("ANALYZER_FINISHED"); scanner.push(chunk); },
    finish(): FluviusStreamSummary { if (finished) throw new Error("ANALYZER_FINISHED"); finished = true; scanner.finish(); if (header) throw new CsvParseError("EMPTY_INPUT", "CSV-invoer is leeg"); return { validCount, skippedCount, reasons, measuredCount, estimatedCount, noConsumptionCount, gapCount, duplicateCount, overlapCount, integrityReliable: [...streams.values()].every((state) => state.ordered), unorderedCount, importKwh, exportKwh, measuredImportKwh, estimatedImportKwh, measuredExportKwh, estimatedExportKwh, period: first && last ? { start: first.start, end: last.end } : null, first, last, skippedRows, truncatedCount, retainedIntervalCount: streams.size, retainedCandidateCount: 0 }; },
  };
};

export const analyzeFluviusPreview = (text: string): FluviusStreamSummary => { const analyzer = createFluviusPreviewAnalyzer(); analyzer.push(text); return analyzer.finish(); };
