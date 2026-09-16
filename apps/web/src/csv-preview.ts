import { CsvParseError, type ParsedCsv } from "@crems/core/csv";
import { FluviusSchemaError, mapFluviusQuarterHours, type FluviusInterval, type FluviusReason } from "@crems/core/fluvius-quarter-hour";
import type { FluviusStreamSummary } from "@crems/core/fluvius-stream-preview";

type SafeInterval = Pick<FluviusInterval, "start"|"end"|"direction"|"energyKwh"|"quality">;

export type CsvPreview =
  | { status: "success"; delimiter: ParsedCsv["delimiter"]; validCount: number; skippedCount: number; period: { start: string; end: string } | null; importKwh: number; exportKwh: number; measuredImportKwh:number;estimatedImportKwh:number;measuredExportKwh:number;estimatedExportKwh:number; measuredCount: number; estimatedCount: number; noConsumptionCount: number; gapCount: number; duplicateCount: number; overlapCount: number; integrityReliable: boolean; reasons: Record<FluviusReason,number>; first: SafeInterval|null; last: SafeInterval|null }
  | { status: "error"; code: string; message: string };

export type CsvPreviewOutcome =
  | { ok: true; parsed: ParsedCsv }
  | { ok: true; analyzed: FluviusStreamSummary }
  | { ok: false; error: unknown }
  | { ok: false; code: "FILE_TOO_LARGE" };

const parseErrorMessages: Record<string, string> = {
  EMPTY_INPUT: "Het bestand bevat geen CSV-gegevens.",
  EMPTY_HEADER: "Minstens één kolom heeft geen naam.",
  DUPLICATE_HEADER: "Minstens twee kolommen hebben dezelfde naam.",
  TOO_FEW_FIELDS: "Een rij bevat minder velden dan de header.",
  TOO_MANY_FIELDS: "Een rij bevat meer velden dan de header.",
  UNCLOSED_QUOTE: "Een tekstveld heeft geen afsluitend aanhalingsteken.",
  FIELD_TOO_LARGE: "Een veld in dit bestand is te groot om lokaal veilig te verwerken.",
  RECORD_TOO_LARGE: "Een rij in dit bestand is te groot om lokaal veilig te verwerken.",
  ROW_LIMIT_EXCEEDED: "Dit bestand bevat te veel rijen om lokaal veilig te verwerken.",
};

export const mapCsvPreview = (outcome: CsvPreviewOutcome): CsvPreview => {
  if (outcome.ok) {
    let mapped;
    try { mapped = "analyzed" in outcome ? outcome.analyzed : mapFluviusQuarterHours(outcome.parsed); }
    catch (error) { if (error instanceof FluviusSchemaError || (typeof error==="object"&&error!==null&&"code" in error&&(error as {code?:unknown}).code==="INVALID_FLUVIUS_SCHEMA")) return { status:"error",code:"INVALID_FLUVIUS_SCHEMA",message:"Dit bestand heeft niet het bewezen Fluvius-schema." }; throw error; }
    const safe=(interval:FluviusInterval|undefined):SafeInterval|null=>interval?{start:interval.start,end:interval.end,direction:interval.direction,energyKwh:interval.energyKwh,quality:interval.quality}:null;
    return {
      status: "success",
      delimiter: ";",
      validCount:"validCount" in mapped?mapped.validCount:mapped.intervals.length,skippedCount:mapped.skippedCount,
      period:"period" in mapped?mapped.period:mapped.intervals.length?{start:mapped.intervals[0]!.start,end:mapped.intervals.at(-1)!.end}:null,
      importKwh:mapped.importKwh,exportKwh:mapped.exportKwh,measuredCount:mapped.measuredCount,estimatedCount:mapped.estimatedCount,noConsumptionCount:mapped.noConsumptionCount,
      measuredImportKwh:mapped.measuredImportKwh,estimatedImportKwh:mapped.estimatedImportKwh,measuredExportKwh:mapped.measuredExportKwh,estimatedExportKwh:mapped.estimatedExportKwh,
      gapCount:mapped.gapCount,duplicateCount:mapped.duplicateCount,overlapCount:mapped.overlapCount,integrityReliable:"integrityReliable" in mapped ? mapped.integrityReliable : true,reasons:{...mapped.reasons},first:"first" in mapped?safe(mapped.first??undefined):safe(mapped.intervals[0]),last:"last" in mapped?safe(mapped.last??undefined):safe(mapped.intervals.at(-1)),
    };
  }
  if ("code" in outcome) {
    return {
      status: "error",
      code: outcome.code,
      message: "Dit bestand is groter dan 20 MiB en kan niet lokaal worden gecontroleerd.",
    };
  }
  if (outcome.error instanceof CsvParseError) {
    return {
      status: "error",
      code: outcome.error.code,
    message: parseErrorMessages[outcome.error.code] ?? "Dit CSV-bestand kan niet lokaal veilig worden verwerkt.",
    };
  }
  if(typeof outcome.error==="object"&&outcome.error!==null&&"code" in outcome.error){const code=String((outcome.error as {code:unknown}).code);if(code in parseErrorMessages)return{status:"error",code,message:parseErrorMessages[code]!};}
  return {
    status: "error",
    code: "LOCAL_READ_ERROR",
    message: "We konden dit bestand lokaal niet lezen. Probeer het opnieuw.",
  };
};
