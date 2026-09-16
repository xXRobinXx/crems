import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateFlatIntervalCost,
  InvalidFlatRateError,
  InvalidFlatVolumeError,
  MissingFlatRateError,
  type InvalidFlatRateErrorCode,
  type InvalidFlatVolumeErrorCode,
  type MissingFlatRateErrorCode,
} from "../src/index.ts";

const assertMissingRate = (
  interval: { importKwh: number; exportKwh: number },
  contract: { importPriceEurKwh?: number; exportPriceEurKwh?: number },
  code: MissingFlatRateErrorCode,
) => {
  assert.throws(() => calculateFlatIntervalCost(interval, contract), (error: unknown) => {
    assert.ok(error instanceof MissingFlatRateError);
    assert.equal(error.code, code);
    return true;
  });
};

const assertInvalidVolume = (
  interval: { importKwh: number; exportKwh: number },
  contract: { importPriceEurKwh?: number; exportPriceEurKwh?: number },
  code: InvalidFlatVolumeErrorCode,
) => {
  assert.throws(() => calculateFlatIntervalCost(interval, contract), (error: unknown) => {
    assert.ok(error instanceof InvalidFlatVolumeError);
    assert.equal(error.code, code);
    return true;
  });
};

const assertInvalidRate = (
  interval: { importKwh: number; exportKwh: number },
  contract: { importPriceEurKwh?: number; exportPriceEurKwh?: number },
  code: InvalidFlatRateErrorCode,
) => {
  assert.throws(() => calculateFlatIntervalCost(interval, contract), (error: unknown) => {
    assert.ok(error instanceof InvalidFlatRateError);
    assert.equal(error.code, code);
    return true;
  });
};

test("alleen import geeft een positieve kost met een expliciet importtarief", () => {
  const cost = calculateFlatIntervalCost(
    { importKwh: 2, exportKwh: 0 },
    { importPriceEurKwh: 0.25, exportPriceEurKwh: 0.125 },
  );

  assert.equal(cost, 0.5);
  assert.ok(cost > 0);
});

test("alleen export geeft een negatieve kost met een expliciet exporttarief", () => {
  const cost = calculateFlatIntervalCost(
    { importKwh: 0, exportKwh: 4 },
    { importPriceEurKwh: 0.25, exportPriceEurKwh: 0.125 },
  );

  assert.equal(cost, -0.5);
  assert.ok(cost < 0);
});

test("gecombineerde import en export volgen exact importkost min injectievergoeding", () => {
  const cost = calculateFlatIntervalCost(
    { importKwh: 1.5, exportKwh: 2 },
    { importPriceEurKwh: 0.5, exportPriceEurKwh: 0.125 },
  );

  assert.equal(cost, 0.5);
});

test("positief importvolume zonder importtarief werpt MISSING_IMPORT_RATE", () => {
  assertMissingRate(
    { importKwh: 1, exportKwh: 0 },
    { exportPriceEurKwh: 0.1 },
    "MISSING_IMPORT_RATE",
  );
});

test("positief exportvolume zonder exporttarief werpt MISSING_EXPORT_RATE", () => {
  assertMissingRate(
    { importKwh: 0, exportKwh: 1 },
    { importPriceEurKwh: 0.3 },
    "MISSING_EXPORT_RATE",
  );
});

test("rapporteert deterministisch eerst MISSING_IMPORT_RATE wanneer beide tarieven ontbreken", () => {
  assertMissingRate(
    { importKwh: 1, exportKwh: 1 },
    {},
    "MISSING_IMPORT_RATE",
  );
});

test("behandelt expliciete nultarieven als geldige tarieven", () => {
  const cost = calculateFlatIntervalCost(
    { importKwh: 2, exportKwh: 3 },
    { importPriceEurKwh: 0, exportPriceEurKwh: 0 },
  );

  assert.equal(cost, 0);
});

test("vereist geen ontbrekend tarief voor een richting met exact nul volume", () => {
  assert.equal(calculateFlatIntervalCost(
    { importKwh: 0, exportKwh: 2 },
    { exportPriceEurKwh: 0.1 },
  ), -0.2);
  assert.equal(calculateFlatIntervalCost(
    { importKwh: 2, exportKwh: 0 },
    { importPriceEurKwh: 0.25 },
  ), 0.5);
  assert.equal(calculateFlatIntervalCost(
    { importKwh: 0, exportKwh: 0 },
    {},
  ), 0);
});

test("weigert negatieve en niet-eindige importvolumes met INVALID_IMPORT_VOLUME", () => {
  for (const importKwh of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertInvalidVolume(
      { importKwh, exportKwh: 0 },
      { importPriceEurKwh: 0.25, exportPriceEurKwh: 0.1 },
      "INVALID_IMPORT_VOLUME",
    );
  }
});

test("weigert negatieve en niet-eindige exportvolumes met INVALID_EXPORT_VOLUME", () => {
  for (const exportKwh of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertInvalidVolume(
      { importKwh: 0, exportKwh },
      { importPriceEurKwh: 0.25, exportPriceEurKwh: 0.1 },
      "INVALID_EXPORT_VOLUME",
    );
  }
});

test("rapporteert deterministisch eerst INVALID_IMPORT_VOLUME wanneer beide volumes ongeldig zijn", () => {
  assertInvalidVolume(
    { importKwh: Number.NaN, exportKwh: Number.POSITIVE_INFINITY },
    { importPriceEurKwh: 0.25, exportPriceEurKwh: 0.1 },
    "INVALID_IMPORT_VOLUME",
  );
});

test("valideert een ongeldig importvolume vóór ontbrekende tarieven", () => {
  assertInvalidVolume(
    { importKwh: -1, exportKwh: 1 },
    {},
    "INVALID_IMPORT_VOLUME",
  );
});

test("blijft aanwezige negatieve tarieven volgens de bestaande formule berekenen", () => {
  assert.equal(calculateFlatIntervalCost(
    { importKwh: 2, exportKwh: 2 },
    { importPriceEurKwh: -0.5, exportPriceEurKwh: -0.25 },
  ), -0.5);
});

test("weigert niet-eindige gebruikte importtarieven met INVALID_IMPORT_RATE", () => {
  for (const importPriceEurKwh of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertInvalidRate(
      { importKwh: 1, exportKwh: 0 },
      { importPriceEurKwh, exportPriceEurKwh: 0.1 },
      "INVALID_IMPORT_RATE",
    );
  }
});

test("weigert niet-eindige gebruikte exporttarieven met INVALID_EXPORT_RATE", () => {
  for (const exportPriceEurKwh of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertInvalidRate(
      { importKwh: 0, exportKwh: 1 },
      { importPriceEurKwh: 0.25, exportPriceEurKwh },
      "INVALID_EXPORT_RATE",
    );
  }
});

test("rapporteert deterministisch eerst INVALID_IMPORT_RATE wanneer beide gebruikte tarieven ongeldig zijn", () => {
  assertInvalidRate(
    { importKwh: 1, exportKwh: 1 },
    { importPriceEurKwh: Number.NaN, exportPriceEurKwh: Number.POSITIVE_INFINITY },
    "INVALID_IMPORT_RATE",
  );
});

test("rapporteert een volume-error vóór een invalid-rate-error", () => {
  assertInvalidVolume(
    { importKwh: Number.NaN, exportKwh: 0 },
    { importPriceEurKwh: Number.POSITIVE_INFINITY },
    "INVALID_IMPORT_VOLUME",
  );
});

test("negeert een niet-eindig tarief voor een richting met exact nul volume", () => {
  assert.equal(calculateFlatIntervalCost(
    { importKwh: 0, exportKwh: 2 },
    { importPriceEurKwh: Number.NaN, exportPriceEurKwh: 0.1 },
  ), -0.2);
  assert.equal(calculateFlatIntervalCost(
    { importKwh: 2, exportKwh: 0 },
    { importPriceEurKwh: 0.25, exportPriceEurKwh: Number.POSITIVE_INFINITY },
  ), 0.5);
});
