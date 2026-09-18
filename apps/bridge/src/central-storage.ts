import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type CentralResultKey = "energy-profile" | "battery-report";
const CAPACITIES = [3, 5, 7, 10, 13] as const;
const ENERGY_FIELDS = ["sourceImportKwh", "sourceExportKwh", "netImportBeforeKwh", "netExportBeforeKwh", "chargedKwh", "dischargedKwh", "netImportAfterKwh", "netExportAfterKwh", "conversionLossKwh", "resetLossKwh"] as const;
const ENERGY_KEYS = ["version", "savedAt", "period", "measuredImportKwh", "estimatedImportKwh", "measuredExportKwh", "estimatedExportKwh", "measuredCount", "estimatedCount", "noConsumptionCount", "integrityReliable", "gapCount", "duplicateCount", "overlapCount"];
const BATTERY_KEYS = ["version", "savedAt", "quality", "technical", "priceSource", "financial", "daily"];
const MAX_RESULTS_BYTES = 4 * 1024 * 1024;
type AnyObject = Record<string, any>;

const object = (value: unknown): value is AnyObject => !!value && typeof value === "object" && !Array.isArray(value);
const exact = (value: AnyObject, keys: readonly string[]) => Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const nonNegative = (value: unknown): value is number => finite(value) && value >= 0;
const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
const validPeriod = (value: unknown) => object(value) && exact(value, ["start", "end"]) && date(value.start) && date(value.end) && Date.parse(value.end) > Date.parse(value.start);

const validEnergyProfile = (value: unknown) => {
  const v = value as AnyObject;
  if (!object(value) || !exact(v, ENERGY_KEYS) || v.version !== 2 || !date(v.savedAt) || !validPeriod(v.period)) return false;
  return ["measuredImportKwh", "estimatedImportKwh", "measuredExportKwh", "estimatedExportKwh"].every((key) => nonNegative(v[key])) &&
    ["measuredCount", "estimatedCount", "noConsumptionCount", "gapCount", "duplicateCount", "overlapCount"].every((key) => Number.isInteger(v[key]) && nonNegative(v[key])) && typeof v.integrityReliable === "boolean";
};

const validQuality = (value: unknown) => {
  const v = value as AnyObject;
  return object(value) && exact(v, ["period", "integrityReliable", "estimatedCount", "gapCount", "duplicateCount", "overlapCount"]) && validPeriod(v.period) && typeof v.integrityReliable === "boolean" && [v.estimatedCount, v.gapCount, v.duplicateCount, v.overlapCount].every((item) => Number.isInteger(item) && nonNegative(item));
};

const validTechnical = (value: unknown) => Array.isArray(value) && value.length === 5 && value.every((item, index) => {
  const v = item as AnyObject;
  const optional = v.wholesaleTimeShiftValueEur === undefined ? [] : ["wholesaleTimeShiftValueEur"];
  return object(item) && exact(v, ["capacityKwh", "powerKw", "shiftedKwh", "chargedFromExportKwh", "endingStoredKwh", "lossesKwh", "equivalentCycles", ...optional]) && v.capacityKwh === CAPACITIES[index] && v.powerKw === v.capacityKwh / 2 && [v.shiftedKwh, v.chargedFromExportKwh, v.endingStoredKwh, v.lossesKwh, v.equivalentCycles].every(nonNegative) && (v.wholesaleTimeShiftValueEur === undefined || finite(v.wholesaleTimeShiftValueEur));
});

const validDaily = (value: unknown, quality: AnyObject, technical: any[]) => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4_000 || !Array.isArray(technical)) return false;
  let previous = "";
  const totals = CAPACITIES.map(() => ({ charged: 0, discharged: 0, loss: 0, end: 0 }));
  for (const item of value) {
    const day = item as AnyObject;
    if (!object(item) || !exact(day, ["day", "first", "last", "count", "estimatedCount", "gapCount", "candidates"]) || typeof day.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.day) || day.day <= previous || !date(day.first) || !date(day.last) || Date.parse(day.first) >= Date.parse(day.last) || Date.parse(day.first) < Date.parse(quality.period.start) || Date.parse(day.last) > Date.parse(quality.period.end) || !Number.isInteger(day.count) || day.count < 1 || day.count > 100 || !Number.isInteger(day.estimatedCount) || !Number.isInteger(day.gapCount) || day.estimatedCount < 0 || day.gapCount < 0 || !Array.isArray(day.candidates) || day.candidates.length !== 5) return false;
    for (let index = 0; index < 5; index += 1) {
      const candidate = day.candidates[index] as AnyObject;
      if (!object(candidate) || !exact(candidate, ["capacityKwh", "startStoredKwh", "endStoredKwh", ...ENERGY_FIELDS]) || candidate.capacityKwh !== CAPACITIES[index] || ![candidate.startStoredKwh, candidate.endStoredKwh, ...ENERGY_FIELDS.map((field) => candidate[field])].every(nonNegative) || candidate.startStoredKwh > candidate.capacityKwh || candidate.endStoredKwh > candidate.capacityKwh) return false;
      totals[index]!.charged += candidate.chargedKwh;
      totals[index]!.discharged += candidate.dischargedKwh;
      totals[index]!.loss += candidate.conversionLossKwh + candidate.resetLossKwh;
      totals[index]!.end = candidate.endStoredKwh;
    }
    previous = day.day;
  }
  return totals.every((total, index) => {
    const technicalItem = technical[index] as AnyObject;
    const close = (a: number, b: unknown) => typeof b === "number" && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
    return close(total.charged, technicalItem.chargedFromExportKwh) && close(total.discharged, technicalItem.shiftedKwh) && close(total.loss, technicalItem.lossesKwh) && close(total.end, technicalItem.endingStoredKwh);
  });
};

const validFinancial = (value: unknown, quality: AnyObject, technical: any[]) => {
  const v = value as AnyObject;
  if (!object(value) || !exact(v, ["assumptions", "results", "recommendedCapacityKwh"]) || !object(v.assumptions) || !Array.isArray(v.results) || v.results.length !== 5) return false;
  const a = v.assumptions as AnyObject;
  if (!exact(a, ["confirmed", "importRateCtKwh", "exportRateCtKwh", "lifeYears", "annualDegradationPercent", "discountRatePercent", "investmentsEur", "contractName", "contractType", "effectiveStart", "effectiveEnd", "quoteSource", "quoteDate", "warrantyYears", "pricesIncludeVat"]) || a.confirmed !== true || a.pricesIncludeVat !== true || typeof a.contractName !== "string" || a.contractName.trim() === "" || typeof a.quoteSource !== "string" || a.quoteSource.trim() === "" || (a.contractType !== "fixed" && a.contractType !== "variable") || !date(a.effectiveStart) || !date(a.effectiveEnd) || Date.parse(a.effectiveEnd) <= Date.parse(a.effectiveStart) || !date(a.quoteDate) || !Number.isInteger(a.lifeYears) || a.lifeYears < 1 || a.lifeYears > 30 || !Number.isInteger(a.warrantyYears) || a.warrantyYears < 1 || a.warrantyYears > 30 || ![a.importRateCtKwh, a.exportRateCtKwh, a.annualDegradationPercent, a.discountRatePercent].every(nonNegative) || a.annualDegradationPercent >= 100 || a.discountRatePercent >= 100 || !object(a.investmentsEur) || !CAPACITIES.every((capacity) => nonNegative(a.investmentsEur[String(capacity)]) && a.investmentsEur[String(capacity)] > 0)) return false;
  return validQuality(quality) && Array.isArray(technical) && v.results.every((item: unknown, index: number) => {
    const result = item as AnyObject;
    if (!object(item) || !exact(result, ["capacityKwh", "investmentEur", "annualEnergySavingEur", "low", "base", "high"]) || result.capacityKwh !== CAPACITIES[index] || result.investmentEur !== a.investmentsEur[String(result.capacityKwh)] || !finite(result.annualEnergySavingEur)) return false;
    return [result.low, result.base, result.high].every((scenario: unknown) => {
      const s = scenario as AnyObject;
      return object(scenario) && exact(s, ["annualFactor", "cashflowsEur", "npvEur", "paybackYears"]) && [0.8, 1, 1.2].includes(s.annualFactor) && Array.isArray(s.cashflowsEur) && s.cashflowsEur.length === a.lifeYears && s.cashflowsEur.every(finite) && finite(s.npvEur) && (s.paybackYears === null || nonNegative(s.paybackYears));
    });
  }) && (v.recommendedCapacityKwh === null || CAPACITIES.includes(v.recommendedCapacityKwh));
};

export const validateCentralResult = (key: CentralResultKey, value: unknown): boolean => {
  if (key === "energy-profile") return validEnergyProfile(value);
  const v = value as AnyObject;
  if (!object(value) || !exact(v, BATTERY_KEYS.filter((field) => v[field] !== undefined)) || v.version !== 3 || !date(v.savedAt) || !validQuality(v.quality) || !validTechnical(v.technical)) return false;
  if (v.priceSource !== undefined && (typeof v.priceSource !== "string" || v.priceSource.length > 100)) return false;
  if (v.financial !== undefined && !validFinancial(v.financial, v.quality, v.technical)) return false;
  return v.daily === undefined || validDaily(v.daily, v.quality, v.technical);
};

type StoredResults = Partial<Record<CentralResultKey, unknown>>;
export class CentralStorage {
  private queue: Promise<void> = Promise.resolve();
  private readonly file: string;
  constructor(private readonly directory: string) { this.file = join(directory, "results.json"); }
  async get(key: CentralResultKey) { return (await this.read())[key]; }
  async put(key: CentralResultKey, value: unknown) {
    if (!validateCentralResult(key, value)) throw new StorageValidationError();
    return this.serialized(async () => { const current = await this.read(); current[key] = value; await this.write(current); });
  }
  async remove(key: CentralResultKey) { return this.serialized(async () => { const current = await this.read(); delete current[key]; await this.write(current); }); }
  private serialized(operation: () => Promise<void>) { const next = this.queue.then(operation, operation); this.queue = next.catch(() => undefined); return next; }
  private async read(): Promise<StoredResults> {
    try {
      const raw = await readFile(this.file, "utf8");
      if (Buffer.byteLength(raw, "utf8") > MAX_RESULTS_BYTES) return {};
      const value: unknown = JSON.parse(raw); if (!object(value)) return {};
      const result: StoredResults = {};
      if (value["energy-profile"] !== undefined && validateCentralResult("energy-profile", value["energy-profile"])) result["energy-profile"] = value["energy-profile"];
      if (value["battery-report"] !== undefined && validateCentralResult("battery-report", value["battery-report"])) result["battery-report"] = value["battery-report"];
      return result;
    } catch { return {}; }
  }
  private async write(value: StoredResults) {
    await mkdir(this.directory, { recursive: true });
    const temporary = `${this.file}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
    await writeFile(temporary, JSON.stringify(value), { encoding: "utf8", mode: 0o600 });
    await rename(temporary, this.file);
  }
}
export class StorageValidationError extends Error { constructor() { super("invalid_result"); this.name = "StorageValidationError"; } }
