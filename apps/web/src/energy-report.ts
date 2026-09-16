import type { LocalEnergyProfile } from "./local-energy-profile";

export type EnergyReport = Readonly<{
  elapsedHours: number;
  import: Readonly<{ measuredKwh: number; estimatedKwh: number; totalKwh: number; estimatedPercent: number | null }>;
  export: Readonly<{ measuredKwh: number; estimatedKwh: number; totalKwh: number; estimatedPercent: number | null }>;
  balance: Readonly<{ direction: "netImport" | "netExport" | "balanced"; magnitudeKwh: number }>;
  averagePer24Hours: Readonly<{ importKwh: number; exportKwh: number }>;
  gridFlowShares: Readonly<{ importPercent: number | null; exportPercent: number | null }>;
  intervalQuality: Readonly<{ totalCount: number; measured: Readonly<{ count: number; percent: number }>; estimated: Readonly<{ count: number; percent: number }>; noConsumption: Readonly<{ count: number; percent: number }> }>;
  dataIntegrity: Readonly<{reliable:boolean|null;gapCount:number|null;duplicateCount:number|null;overlapCount:number|null}>;
}>;

const rounded = (value: number) => Math.round(value * 100) / 100;

export const createEnergyReport = (profile: LocalEnergyProfile): EnergyReport | undefined => {
  const durationMs = Date.parse(profile.period.end) - Date.parse(profile.period.start);
  if (!Number.isFinite(durationMs) || durationMs <= 0) return undefined;
  const elapsedHours = durationMs / 3_600_000;
  const totalImportKwh = profile.measuredImportKwh + profile.estimatedImportKwh;
  const totalExportKwh = profile.measuredExportKwh + profile.estimatedExportKwh;
  const qualityCount = profile.measuredCount + profile.estimatedCount + profile.noConsumptionCount;
  if (![elapsedHours, totalImportKwh, totalExportKwh, qualityCount].every(Number.isFinite) || qualityCount < 0) return undefined;
  const signedBalance = totalImportKwh - totalExportKwh;
  const direction = Math.abs(signedBalance) < 1e-9 ? "balanced" : signedBalance > 0 ? "netImport" : "netExport";
  const grossGridKwh = totalImportKwh + totalExportKwh;
  const split = (measuredKwh: number, estimatedKwh: number) => ({ measuredKwh, estimatedKwh, totalKwh: rounded(measuredKwh + estimatedKwh), estimatedPercent: measuredKwh + estimatedKwh === 0 ? null : rounded(estimatedKwh / (measuredKwh + estimatedKwh) * 100) });
  const share = (count: number, isLast = false) => qualityCount === 0 ? 0 : isLast ? rounded(100 - profile.measuredCount / qualityCount * 100 - profile.estimatedCount / qualityCount * 100) : rounded(count / qualityCount * 100);
  return { elapsedHours: rounded(elapsedHours), import: split(profile.measuredImportKwh, profile.estimatedImportKwh), export: split(profile.measuredExportKwh, profile.estimatedExportKwh), balance: { direction, magnitudeKwh: rounded(Math.abs(signedBalance)) }, averagePer24Hours: { importKwh: rounded(totalImportKwh / elapsedHours * 24), exportKwh: rounded(totalExportKwh / elapsedHours * 24) }, gridFlowShares: { importPercent: grossGridKwh === 0 ? null : rounded(totalImportKwh / grossGridKwh * 100), exportPercent: grossGridKwh === 0 ? null : rounded(totalExportKwh / grossGridKwh * 100) }, intervalQuality: { totalCount: qualityCount, measured: { count: profile.measuredCount, percent: share(profile.measuredCount) }, estimated: { count: profile.estimatedCount, percent: share(profile.estimatedCount) }, noConsumption: { count: profile.noConsumptionCount, percent: share(profile.noConsumptionCount, true) } },dataIntegrity:{reliable:profile.integrityReliable,gapCount:profile.gapCount,duplicateCount:profile.duplicateCount,overlapCount:profile.overlapCount} };
};
