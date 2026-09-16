import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateFlatIntervalCosts,
  calculateFlatIntervalCost,
  InvalidFlatRateError,
  InvalidFlatVolumeError,
  MissingFlatRateError,
} from "../src/index.ts";

test("aggregeert meerdere intervallen naar de exacte publieke breakdown", () => {
  const intervals = [
    { importKwh: 1, exportKwh: 0.5 },
    { importKwh: 2, exportKwh: 1.5 },
    { importKwh: 0.5, exportKwh: 0 },
  ];
  const contract = { importPriceEurKwh: 0.5, exportPriceEurKwh: 0.25 };
  const result = aggregateFlatIntervalCosts(intervals, contract);

  assert.deepEqual(result, {
    intervalCount: 3,
    totalImportKwh: 3.5,
    totalExportKwh: 2,
    importCostEur: 1.75,
    exportCreditEur: 0.5,
    netEnergyEur: 1.25,
  });
  assert.equal(
    result.netEnergyEur,
    intervals.reduce((total, interval) => total + calculateFlatIntervalCost(interval, contract), 0),
  );
});

test("rapporteert exportcredit afzonderlijk en kan een negatieve netto energiekost opleveren", () => {
  assert.deepEqual(aggregateFlatIntervalCosts([
    { importKwh: 0, exportKwh: 2 },
    { importKwh: 1, exportKwh: 2 },
  ], { importPriceEurKwh: 0.5, exportPriceEurKwh: 0.25 }), {
    intervalCount: 2,
    totalImportKwh: 1,
    totalExportKwh: 4,
    importCostEur: 0.5,
    exportCreditEur: 1,
    netEnergyEur: -0.5,
  });
});

test("levert voor een lege lijst zes expliciete nulwaarden zonder tarieven", () => {
  assert.deepEqual(aggregateFlatIntervalCosts([], {}), {
    intervalCount: 0,
    totalImportKwh: 0,
    totalExportKwh: 0,
    importCostEur: 0,
    exportCreditEur: 0,
    netEnergyEur: 0,
  });
});

test("vereist geen tarief voor een richting die in alle intervallen nulvolume heeft", () => {
  assert.deepEqual(aggregateFlatIntervalCosts([
    { importKwh: 1, exportKwh: 0 },
    { importKwh: 2, exportKwh: 0 },
  ], { importPriceEurKwh: 0.25 }), {
    intervalCount: 2,
    totalImportKwh: 3,
    totalExportKwh: 0,
    importCostEur: 0.75,
    exportCreditEur: 0,
    netEnergyEur: 0.75,
  });
});

test("propageert bestaande validatiefouten van het eerste ongeldige interval", () => {
  assert.throws(() => aggregateFlatIntervalCosts([
    { importKwh: 1, exportKwh: 0 },
    { importKwh: 0, exportKwh: -1 },
    { importKwh: Number.NaN, exportKwh: 0 },
  ], { importPriceEurKwh: 0.25 }), (error: unknown) => {
    assert.ok(error instanceof InvalidFlatVolumeError);
    assert.equal(error.code, "INVALID_EXPORT_VOLUME");
    return true;
  });

  assert.throws(() => aggregateFlatIntervalCosts([
    { importKwh: 1, exportKwh: 0 },
  ], {}), MissingFlatRateError);
  assert.throws(() => aggregateFlatIntervalCosts([
    { importKwh: 1, exportKwh: 0 },
  ], { importPriceEurKwh: Number.POSITIVE_INFINITY }), InvalidFlatRateError);
});

test("muteert de invoerarray en intervalobjecten niet", () => {
  const intervals = Object.freeze([
    Object.freeze({ importKwh: 1, exportKwh: 0.5 }),
    Object.freeze({ importKwh: 2, exportKwh: 1 }),
  ]);
  const before = intervals.map((interval) => ({ ...interval }));

  aggregateFlatIntervalCosts(intervals, { importPriceEurKwh: 0.5, exportPriceEurKwh: 0.25 });

  assert.deepEqual(intervals, before);
});
