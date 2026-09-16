import type { DataQuality } from "@crems/core";
import {
  HomeAssistantSource,
  PowerHistoryNotConfiguredError,
  type MeterSource,
} from "./meter-source.js";
import { normalizePowerHistory, type NormalizePowerHistoryResult } from "./power-history.js";

export class PowerHistoryUnavailableError extends Error {
  readonly name = "PowerHistoryUnavailableError";
  readonly code = "HISTORY_UNAVAILABLE" as const;

  constructor() {
    super("Vermogenshistory is niet beschikbaar");
  }
}

export class PowerHistoryUpstreamError extends Error {
  readonly name = "PowerHistoryUpstreamError";
  readonly code = "HISTORY_UPSTREAM_ERROR" as const;

  constructor() {
    super("Vermogenshistory kon niet worden opgehaald");
  }
}

export interface PowerHistoryResponse {
  start: string;
  end: string;
  quality: DataQuality;
  import: NormalizePowerHistoryResult;
  export: NormalizePowerHistoryResult;
}

export const loadPowerHistory = async (
  source: MeterSource,
  start: string,
  end: string,
): Promise<PowerHistoryResponse> => {
  if (!(source instanceof HomeAssistantSource)) throw new PowerHistoryUnavailableError();

  let channels;
  try {
    channels = await source.resolvePowerHistoryChannels();
  } catch (error) {
    if (error instanceof PowerHistoryNotConfiguredError) throw error;
    throw new PowerHistoryUpstreamError();
  }

  let importRecords;
  let exportRecords;
  try {
    [importRecords, exportRecords] = await Promise.all([
      source.history(channels.import.entityId, start, end),
      source.history(channels.export.entityId, start, end),
    ]);
  } catch {
    throw new PowerHistoryUpstreamError();
  }

  const importResult = normalizePowerHistory({
    records: importRecords,
    unit: channels.import.unit,
    start,
    end,
  });
  const exportResult = normalizePowerHistory({
    records: exportRecords,
    unit: channels.export.unit,
    start,
    end,
  });

  return {
    start,
    end,
    quality: importResult.points.length > 0 && exportResult.points.length > 0
      ? "measured"
      : "incomplete",
    import: importResult,
    export: exportResult,
  };
};
