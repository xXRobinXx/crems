import type { BatteryCapacity } from "./battery-comparison.ts";

/**
 * A value shown as a starting point in the financial form. These are editable
 * Belgian market guidelines, not a user's contract and never an automatic
 * confirmation for the financial calculation.
 */
export type BelgianFinancialGuideline = Readonly<{
  value: number;
  unit: "ct/kWh" | "years" | "percent" | "EUR";
  label: string;
  sourceLabel: string;
  sourceKind: "guideline";
}>;

export type Belgian2026FinancialDefaults = Readonly<{
  referenceYear: 2026;
  market: "Belgium";
  importRateCtKwh: BelgianFinancialGuideline;
  exportRateCtKwh: BelgianFinancialGuideline;
  lifeYears: BelgianFinancialGuideline;
  annualDegradationPercent: BelgianFinancialGuideline;
  discountRatePercent: BelgianFinancialGuideline;
  investmentsEur: Readonly<Record<BatteryCapacity, BelgianFinancialGuideline>>;
}>;

const guideline = (
  value: number,
  unit: BelgianFinancialGuideline["unit"],
  label: string,
  sourceLabel: string,
): BelgianFinancialGuideline => Object.freeze({ value, unit, label, sourceLabel, sourceKind: "guideline" as const });

const investmentSource = "Belgische markt-richtwaarde 2026 voor batterij inclusief installatie en btw; vervang door een echte offerte.";

/**
 * Editable starting values for a Belgian 2026 energy-component scenario.
 *
 * These defaults deliberately carry their provenance and are not a contract
 * assertion. The UI must still require explicit confirmation and valid
 * contract/offerte coverage before calling compareBatteryCandidates().
 */
export const BELGIAN_2026_FINANCIAL_DEFAULTS: Belgian2026FinancialDefaults = Object.freeze({
  referenceYear: 2026,
  market: "Belgium",
  importRateCtKwh: guideline(
    37.3,
    "ct/kWh",
    "Gemiddelde afnameprijs België (richtwaarde)",
    "Belgische huishoudelijke markt-richtwaarde 2026; controleer je contract en btw inbegrepen.",
  ),
  exportRateCtKwh: guideline(
    6,
    "ct/kWh",
    "Gemiddelde injectievergoeding België (richtwaarde)",
    "Belgische markt-richtwaarde 2026; controleer de injectievergoeding van je leverancier.",
  ),
  lifeYears: guideline(
    15,
    "years",
    "Verwachte levensduur batterij (richtwaarde)",
    "Technische markt-richtwaarde 2026; controleer garantie en offerte.",
  ),
  annualDegradationPercent: guideline(
    2.5,
    "percent",
    "Jaarlijkse degradatie (richtwaarde)",
    "Technische markt-richtwaarde 2026; controleer de degradatiegarantie van de batterij.",
  ),
  discountRatePercent: guideline(
    4,
    "percent",
    "Discontovoet (richtwaarde)",
    "Rekenkundige richtwaarde 2026 voor scenariovergelijking; pas aan volgens je eigen financiële keuze.",
  ),
  investmentsEur: Object.freeze({
    3: guideline(3500, "EUR", "Investering 3 kWh (richtwaarde)", investmentSource),
    5: guideline(4500, "EUR", "Investering 5 kWh (richtwaarde)", investmentSource),
    7: guideline(5500, "EUR", "Investering 7 kWh (richtwaarde)", investmentSource),
    10: guideline(6500, "EUR", "Investering 10 kWh (richtwaarde)", investmentSource),
    13: guideline(8000, "EUR", "Investering 13 kWh (richtwaarde)", investmentSource),
  }),
});

/** Plain values for filling editable form controls. */
export const belgian2026FinancialValues = (): Readonly<{
  importRateCtKwh: number;
  exportRateCtKwh: number;
  lifeYears: number;
  annualDegradationPercent: number;
  discountRatePercent: number;
  investmentsEur: Readonly<Record<BatteryCapacity, number>>;
}> => ({
  importRateCtKwh: BELGIAN_2026_FINANCIAL_DEFAULTS.importRateCtKwh.value,
  exportRateCtKwh: BELGIAN_2026_FINANCIAL_DEFAULTS.exportRateCtKwh.value,
  lifeYears: BELGIAN_2026_FINANCIAL_DEFAULTS.lifeYears.value,
  annualDegradationPercent: BELGIAN_2026_FINANCIAL_DEFAULTS.annualDegradationPercent.value,
  discountRatePercent: BELGIAN_2026_FINANCIAL_DEFAULTS.discountRatePercent.value,
  investmentsEur: Object.freeze({
    3: BELGIAN_2026_FINANCIAL_DEFAULTS.investmentsEur[3].value,
    5: BELGIAN_2026_FINANCIAL_DEFAULTS.investmentsEur[5].value,
    7: BELGIAN_2026_FINANCIAL_DEFAULTS.investmentsEur[7].value,
    10: BELGIAN_2026_FINANCIAL_DEFAULTS.investmentsEur[10].value,
    13: BELGIAN_2026_FINANCIAL_DEFAULTS.investmentsEur[13].value,
  }),
});
