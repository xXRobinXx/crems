export const BATTERY_CAPACITIES = [3, 5, 7, 10, 13] as const;
export type BatteryCapacity = typeof BATTERY_CAPACITIES[number];

export type BatteryTechnicalCandidate = Readonly<{
  capacityKwh: BatteryCapacity;
  powerKw: number;
  shiftedKwh: number;
  chargedFromExportKwh: number;
}>;

export type BatteryProfileQuality = Readonly<{
  period: { start: string; end: string };
  integrityReliable: boolean;
  estimatedCount: number;
  gapCount: number;
  duplicateCount: number;
  overlapCount: number;
}>;

export type FinancialAssumptions = Readonly<{
  confirmed: true;
  importRateCtKwh: number;
  exportRateCtKwh: number;
  lifeYears: number;
  annualDegradationPercent: number;
  discountRatePercent: number;
  investmentsEur: Readonly<Record<BatteryCapacity, number>>;
  contractName: string;
  contractType: "fixed" | "variable" | "dynamic";
  effectiveStart: string;
  effectiveEnd: string;
  quoteSource: string;
  quoteDate: string;
  warrantyYears: number;
  pricesIncludeVat: true;
}>; 

export type EligibilityReason = "UNRELIABLE_ORDER" | "ESTIMATED_DATA" | "DATA_GAPS" | "DUPLICATE_DATA" | "OVERLAPPING_DATA" | "LESS_THAN_12_MONTHS";
export type FinancialScenario = Readonly<{ annualFactor: 0.8 | 1 | 1.2; cashflowsEur: readonly number[]; npvEur: number; paybackYears: number | null }>;
export type CandidateFinancialResult = Readonly<{ capacityKwh: BatteryCapacity; investmentEur: number; annualEnergySavingEur: number; low: FinancialScenario; base: FinancialScenario; high: FinancialScenario }>;

const finiteNonNegative = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const rounded = (value: number) => Math.round(value * 100) / 100;

export const batteryEligibility = (quality: BatteryProfileQuality): readonly EligibilityReason[] => {
  const reasons: EligibilityReason[] = [];
  const start = Date.parse(quality.period.start), end = Date.parse(quality.period.end);
  if (!quality.integrityReliable) reasons.push("UNRELIABLE_ORDER");
  if (!Number.isInteger(quality.estimatedCount) || quality.estimatedCount !== 0) reasons.push("ESTIMATED_DATA");
  if (!Number.isInteger(quality.gapCount) || quality.gapCount !== 0) reasons.push("DATA_GAPS");
  if (!Number.isInteger(quality.duplicateCount) || quality.duplicateCount !== 0) reasons.push("DUPLICATE_DATA");
  if (!Number.isInteger(quality.overlapCount) || quality.overlapCount !== 0) reasons.push("OVERLAPPING_DATA");
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 365 * 86_400_000) reasons.push("LESS_THAN_12_MONTHS");
  return reasons;
};

const assumptionsValid = (value: FinancialAssumptions) =>
  value.confirmed === true && finiteNonNegative(value.importRateCtKwh) && finiteNonNegative(value.exportRateCtKwh) &&
  Number.isInteger(value.lifeYears) && value.lifeYears > 0 && value.lifeYears <= 30 &&
  finiteNonNegative(value.annualDegradationPercent) && value.annualDegradationPercent < 100 &&
  finiteNonNegative(value.discountRatePercent) && value.discountRatePercent < 100 &&
  value.contractName.trim().length > 0 && ["fixed","variable"].includes(value.contractType) &&
  Number.isFinite(Date.parse(value.effectiveStart)) && Number.isFinite(Date.parse(value.effectiveEnd)) && Date.parse(value.effectiveEnd) > Date.parse(value.effectiveStart) &&
  value.quoteSource.trim().length > 0 && Number.isFinite(Date.parse(value.quoteDate)) && Number.isInteger(value.warrantyYears) && value.warrantyYears > 0 && value.warrantyYears <= 30 && value.pricesIncludeVat === true &&
  BATTERY_CAPACITIES.every(capacity => finiteNonNegative(value.investmentsEur[capacity]) && value.investmentsEur[capacity] > 0);

const scenario = (annualSaving: number, investment: number, lifeYears: number, degradationPercent: number, discountPercent: number, annualFactor: 0.8 | 1 | 1.2): FinancialScenario => {
  const degradation = 1 - degradationPercent / 100, discount = 1 + discountPercent / 100;
  const cashflows = Array.from({ length: lifeYears }, (_, year) => rounded(annualSaving * annualFactor * degradation ** year));
  let cumulative = -investment, paybackYears: number | null = null, npv = -investment;
  cashflows.forEach((cashflow, index) => {
    const before = cumulative; cumulative += cashflow; npv += cashflow / discount ** (index + 1);
    if (paybackYears === null && before < 0 && cumulative >= 0 && cashflow > 0) paybackYears = rounded(index + (-before / cashflow));
  });
  return { annualFactor, cashflowsEur: cashflows, npvEur: rounded(npv), paybackYears };
};

export const compareBatteryCandidates = (quality: BatteryProfileQuality, candidates: readonly BatteryTechnicalCandidate[], assumptions?: FinancialAssumptions) => {
  const reasons = batteryEligibility(quality);
  if (reasons.length) return { status: "ineligible" as const, reasons };
  if (candidates.length !== BATTERY_CAPACITIES.length || candidates.some((candidate, index) => candidate.capacityKwh !== BATTERY_CAPACITIES[index] || !finiteNonNegative(candidate.powerKw) || candidate.powerKw <= 0 || !finiteNonNegative(candidate.shiftedKwh) || !finiteNonNegative(candidate.chargedFromExportKwh))) return { status: "invalid" as const };
  if (!assumptions || !assumptionsValid(assumptions) || Date.parse(assumptions.effectiveStart) > Date.parse(quality.period.start) || Date.parse(assumptions.effectiveEnd) < Date.parse(quality.period.end)) return { status: "technical" as const, candidates };
  const years = (Date.parse(quality.period.end) - Date.parse(quality.period.start)) / (365.2425 * 86_400_000);
  const financial: CandidateFinancialResult[] = candidates.map(candidate => {
    const annualEnergySavingEur = (candidate.shiftedKwh * assumptions.importRateCtKwh / 100 - candidate.chargedFromExportKwh * assumptions.exportRateCtKwh / 100) / years;
    const investment = assumptions.investmentsEur[candidate.capacityKwh];
    return { capacityKwh: candidate.capacityKwh, investmentEur: investment, annualEnergySavingEur: rounded(annualEnergySavingEur), low: scenario(annualEnergySavingEur, investment, assumptions.lifeYears, assumptions.annualDegradationPercent, assumptions.discountRatePercent, .8), base: scenario(annualEnergySavingEur, investment, assumptions.lifeYears, assumptions.annualDegradationPercent, assumptions.discountRatePercent, 1), high: scenario(annualEnergySavingEur, investment, assumptions.lifeYears, assumptions.annualDegradationPercent, assumptions.discountRatePercent, 1.2) };
  });
  const ranked = [...financial].sort((a, b) => b.base.npvEur - a.base.npvEur || a.capacityKwh - b.capacityKwh);
  return { status: "financial" as const, candidates: financial, recommendedCapacityKwh: ranked[0]!.base.npvEur > 0 ? ranked[0]!.capacityKwh : null };
};

export const createBatteryComparisonController = (publish: (result: ReturnType<typeof compareBatteryCandidates>) => void) => ({
  evaluate(quality: BatteryProfileQuality, candidates: readonly BatteryTechnicalCandidate[], assumptions?: FinancialAssumptions) { const result = compareBatteryCandidates(quality, candidates, assumptions); publish(result); return result; },
});
