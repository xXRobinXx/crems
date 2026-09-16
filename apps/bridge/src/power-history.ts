import { normalizePowerInWatts } from "./meter-source.js";

export class InvalidHistoryWindowError extends Error {
  readonly name = "InvalidHistoryWindowError";
  readonly code = "INVALID_HISTORY_WINDOW" as const;

  constructor() {
    super("Historiekvenster is ongeldig");
  }
}

export class InvalidHistoryUnitError extends Error {
  readonly name = "InvalidHistoryUnitError";
  readonly code = "INVALID_HISTORY_UNIT" as const;

  constructor() {
    super("Historiekeenheid is ongeldig");
  }
}

export interface PowerHistoryPoint {
  timestamp: string;
  powerW: number;
}

export interface NormalizePowerHistoryInput {
  records: ReadonlyArray<unknown>;
  unit: string;
  start: string;
  end: string;
}

export interface NormalizePowerHistoryResult {
  points: PowerHistoryPoint[];
  invalidCount: number;
  outsideWindowCount: number;
  duplicateCount: number;
}

type RawHistoryRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawHistoryRecord | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as RawHistoryRecord
    : undefined;

const parseTimestamp = (value: unknown): number | undefined => {
  if (typeof value !== "string") return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const normalizePowerHistory = (
  input: Readonly<NormalizePowerHistoryInput>,
): NormalizePowerHistoryResult => {
  const startMs = parseTimestamp(input.start);
  const endMs = parseTimestamp(input.end);
  if (startMs === undefined || endMs === undefined || startMs > endMs) {
    throw new InvalidHistoryWindowError();
  }

  const normalizedUnit = typeof input.unit === "string" ? input.unit.trim().toLowerCase() : "";
  if (normalizedUnit !== "w" && normalizedUnit !== "kw") {
    throw new InvalidHistoryUnitError();
  }

  let invalidCount = 0;
  let outsideWindowCount = 0;
  let duplicateCount = 0;
  const pointsByTimestamp = new Map<number, PowerHistoryPoint>();

  for (const value of input.records) {
    const record = asRecord(value);
    if (!record || typeof record.state !== "string") {
      invalidCount += 1;
      continue;
    }

    const rawTimestamp = Object.hasOwn(record, "last_changed")
      ? record.last_changed
      : record.last_updated;
    const timestampMs = parseTimestamp(rawTimestamp);
    const powerW = normalizePowerInWatts({
      entity_id: "",
      state: record.state,
      attributes: { unit_of_measurement: input.unit },
    });
    if (timestampMs === undefined || powerW === undefined) {
      invalidCount += 1;
      continue;
    }

    if (timestampMs < startMs || timestampMs > endMs) {
      outsideWindowCount += 1;
      continue;
    }

    if (pointsByTimestamp.has(timestampMs)) duplicateCount += 1;
    pointsByTimestamp.set(timestampMs, {
      timestamp: new Date(timestampMs).toISOString(),
      powerW,
    });
  }

  return {
    points: [...pointsByTimestamp.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, point]) => point),
    invalidCount,
    outsideWindowCount,
    duplicateCount,
  };
};
