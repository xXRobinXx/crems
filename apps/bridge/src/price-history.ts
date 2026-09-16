export class InvalidPriceHistoryWindowError extends Error {
  readonly name = "InvalidPriceHistoryWindowError";
  readonly code = "INVALID_PRICE_HISTORY_WINDOW" as const;
  constructor() { super("Prijsvenster is ongeldig"); }
}

export class InvalidPriceHistoryUnitError extends Error {
  readonly name = "InvalidPriceHistoryUnitError";
  readonly code = "INVALID_PRICE_HISTORY_UNIT" as const;
  constructor() { super("Prijseenheid is ongeldig"); }
}

export const validatePriceHistoryUnit = (value: unknown): "eur/kwh" | "€/kwh" => {
  const unit = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (unit !== "eur/kwh" && unit !== "€/kwh") throw new InvalidPriceHistoryUnitError();
  return unit;
};

export interface NormalizePriceHistoryInput {
  records: ReadonlyArray<unknown>;
  unit: string;
  start: string;
  end: string;
}

export interface NormalizePriceHistoryResult {
  points: Array<{ timestamp: string; priceCtKwh: number }>;
  invalidCount: number;
  outsideWindowCount: number;
  duplicateCount: number;
}

const recordOf = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

const instant = (value: unknown): number | undefined => {
  if (typeof value !== "string") return undefined;
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : undefined;
};

export const normalizePriceHistory = (input: Readonly<NormalizePriceHistoryInput>): NormalizePriceHistoryResult => {
  const start = instant(input.start);
  const end = instant(input.end);
  if (start === undefined || end === undefined || start >= end) throw new InvalidPriceHistoryWindowError();

  validatePriceHistoryUnit(input.unit);

  let invalidCount = 0;
  let outsideWindowCount = 0;
  let duplicateCount = 0;
  const byTimestamp = new Map<number, { timestamp: string; priceCtKwh: number }>();

  for (const value of input.records) {
    const record = recordOf(value);
    const timestamp = record && instant(Object.hasOwn(record, "last_changed") ? record.last_changed : record.last_updated);
    const rawState = record?.state;
    const price = typeof rawState === "string" && rawState.trim() !== "" ? Number(rawState) : Number.NaN;
    if (timestamp === undefined || !Number.isFinite(price)) { invalidCount += 1; continue; }
    if (timestamp < start || timestamp >= end) { outsideWindowCount += 1; continue; }
    if (byTimestamp.has(timestamp)) duplicateCount += 1;
    byTimestamp.set(timestamp, { timestamp: new Date(timestamp).toISOString(), priceCtKwh: price * 100 });
  }

  return {
    points: [...byTimestamp.entries()].sort(([a], [b]) => a - b).map(([, point]) => point),
    invalidCount,
    outsideWindowCount,
    duplicateCount,
  };
};
