export type HistoryPoint = { timestamp: string; powerW: number };
export type PowerHistoryData = {
  start: string;
  end: string;
  quality: "measured" | "incomplete";
  import: HistoryPoint[];
  export: HistoryPoint[];
};

export type PowerHistoryState =
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "empty" }
  | { status: "future" }
  | { status: "error" }
  | { status: "success"; data: PowerHistoryData; refreshError?: boolean };

const parseIso = (value: unknown) => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
};

const parsePoints = (value: unknown, startMs: number, endMs: number): HistoryPoint[] | undefined => {
  if (!value || typeof value !== "object" || !Array.isArray((value as { points?: unknown }).points)) return undefined;
  const result: HistoryPoint[] = [];
  for (const raw of (value as { points: unknown[] }).points) {
    if (!raw || typeof raw !== "object") return undefined;
    const point = raw as { timestamp?: unknown; powerW?: unknown };
    const timestamp = parseIso(point.timestamp);
    if (!timestamp || typeof point.powerW !== "number" || !Number.isFinite(point.powerW)) return undefined;
    const time = Date.parse(timestamp);
    if (time < startMs || time > endMs) return undefined;
    result.push({ timestamp, powerW: point.powerW });
  }
  return result.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
};

export const parsePowerHistoryResponse = (raw: unknown): PowerHistoryData | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const start = parseIso(value.start);
  const end = parseIso(value.end);
  if (!start || !end || Date.parse(end) <= Date.parse(start)) return undefined;
  if (value.quality !== "measured" && value.quality !== "incomplete") return undefined;
  const importPoints = parsePoints(value.import, Date.parse(start), Date.parse(end));
  const exportPoints = parsePoints(value.export, Date.parse(start), Date.parse(end));
  if (!importPoints || !exportPoints) return undefined;
  return { start, end, quality: value.quality, import: importPoints, export: exportPoints };
};

export type PowerHistoryWindow = { start: string; end: string };

export const loadPowerHistory = async (window: PowerHistoryWindow, signal: AbortSignal, request: typeof fetch = fetch) => {
  const query = new URLSearchParams(window);
  const response = await request(`/api/history/power?${query.toString()}`, { method: "GET", signal });
  if (!response.ok) throw new Error("HISTORY_REQUEST_FAILED");
  const parsed = parsePowerHistoryResponse(await response.json());
  if (!parsed) throw new Error("INVALID_HISTORY_RESPONSE");
  return parsed;
};
