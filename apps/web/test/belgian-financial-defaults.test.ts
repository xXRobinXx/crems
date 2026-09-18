import assert from "node:assert/strict";
import test from "node:test";
import { BATTERY_CAPACITIES } from "../src/battery-comparison.ts";
import { BELGIAN_2026_FINANCIAL_DEFAULTS, belgian2026FinancialValues } from "../src/belgian-financial-defaults.ts";

test("Belgische 2026-richtwaarden bevatten herleidbare labels en de vijf batterijgroottes", () => {
  const defaults = BELGIAN_2026_FINANCIAL_DEFAULTS;
  assert.equal(defaults.referenceYear, 2026);
  assert.equal(defaults.market, "Belgium");
  assert.equal(defaults.importRateCtKwh.value, 37.3);
  assert.equal(defaults.exportRateCtKwh.value, 6);
  assert.equal(defaults.lifeYears.value, 15);
  assert.equal(defaults.annualDegradationPercent.value, 2.5);
  assert.equal(defaults.discountRatePercent.value, 4);
  for (const item of [defaults.importRateCtKwh, defaults.exportRateCtKwh, defaults.lifeYears, defaults.annualDegradationPercent, defaults.discountRatePercent]) {
    assert.equal(item.sourceKind, "guideline");
    assert.ok(item.label.includes("richtwaarde"));
    assert.ok(item.sourceLabel.length > 20);
  }
  assert.deepEqual(Object.keys(defaults.investmentsEur).map(Number), BATTERY_CAPACITIES);
  assert.deepEqual(BATTERY_CAPACITIES.map((capacity) => defaults.investmentsEur[capacity].value), [3500, 4500, 5500, 6500, 8000]);
  for (const capacity of BATTERY_CAPACITIES) assert.equal(defaults.investmentsEur[capacity].sourceKind, "guideline");
});

test("formulierwaarden zijn platte, invulbare kopieën en wijzigen de richtwaarden niet", () => {
  const values = belgian2026FinancialValues();
  assert.deepEqual(values, {
    importRateCtKwh: 37.3,
    exportRateCtKwh: 6,
    lifeYears: 15,
    annualDegradationPercent: 2.5,
    discountRatePercent: 4,
    investmentsEur: { 3: 3500, 5: 4500, 7: 5500, 10: 6500, 13: 8000 },
  });
  assert.notEqual(values.investmentsEur, BELGIAN_2026_FINANCIAL_DEFAULTS.investmentsEur);
  assert.equal(BELGIAN_2026_FINANCIAL_DEFAULTS.importRateCtKwh.value, 37.3);
});

test("richtwaarden doen zelf geen netwerkverzoek", () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => { calls += 1; throw new Error("unexpected network request"); }) as typeof fetch;
  try {
    belgian2026FinancialValues();
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
