import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateFlatIntervalCosts,
  compareFlatContracts,
  InvalidFlatRateError,
  InvalidFlatVolumeError,
  MissingFlatRateError,
} from "../src/index.ts";

const intervals = [
  { importKwh: 1, exportKwh: 0.5 },
  { importKwh: 2, exportKwh: 1 },
];

const current = {
  id: "synthetic-current",
  sourceLabel: "Synthetic current source",
  importPriceEurKwh: 0.5,
  exportPriceEurKwh: 0.25,
};

const candidate = {
  id: "synthetic-candidate",
  sourceLabel: "Synthetic candidate source",
  importPriceEurKwh: 0.25,
  exportPriceEurKwh: 0.25,
};

test("vergelijkt beide contracten over exact dezelfde intervallen met transparante metadata", () => {
  const result = compareFlatContracts(intervals, current, candidate);

  assert.deepEqual(result.current, {
    id: current.id,
    sourceLabel: current.sourceLabel,
    aggregation: aggregateFlatIntervalCosts(intervals, current),
  });
  assert.deepEqual(result.candidate, {
    id: candidate.id,
    sourceLabel: candidate.sourceLabel,
    aggregation: aggregateFlatIntervalCosts(intervals, candidate),
  });
  assert.equal(
    result.candidateMinusCurrentEur,
    result.candidate.aggregation.netEnergyEur - result.current.aggregation.netEnergyEur,
  );
  assert.equal(result.candidateMinusCurrentEur, -0.75);
  assert.equal(result.winner, "candidate");
});

test("wijst current aan wanneer de kandidaat duurder is", () => {
  const result = compareFlatContracts(intervals, candidate, current);

  assert.equal(result.candidateMinusCurrentEur, 0.75);
  assert.equal(result.winner, "current");
});

test("rapporteert equal bij een exact gelijk nettoresultaat", () => {
  const equalCandidate = {
    id: "synthetic-equal",
    sourceLabel: "Synthetic equal source",
    importPriceEurKwh: current.importPriceEurKwh,
    exportPriceEurKwh: current.exportPriceEurKwh,
  };
  const result = compareFlatContracts(intervals, current, equalCandidate);

  assert.equal(result.candidateMinusCurrentEur, 0);
  assert.equal(result.winner, "equal");
  assert.equal(result.candidate.id, equalCandidate.id);
  assert.equal(result.candidate.sourceLabel, equalCandidate.sourceLabel);
});

test("levert twee bestaande nulaggregaties en equal voor een lege intervallijst", () => {
  const currentWithoutRates = { id: "empty-current", sourceLabel: "Empty current source" };
  const candidateWithoutRates = { id: "empty-candidate", sourceLabel: "Empty candidate source" };
  const zeroAggregation = aggregateFlatIntervalCosts([], {});

  assert.deepEqual(compareFlatContracts([], currentWithoutRates, candidateWithoutRates), {
    current: {
      id: currentWithoutRates.id,
      sourceLabel: currentWithoutRates.sourceLabel,
      aggregation: zeroAggregation,
    },
    candidate: {
      id: candidateWithoutRates.id,
      sourceLabel: candidateWithoutRates.sourceLabel,
      aggregation: zeroAggregation,
    },
    candidateMinusCurrentEur: 0,
    winner: "equal",
  });
});

test("propageert bestaande fouten en berekent current deterministisch eerst", () => {
  assert.throws(
    () => compareFlatContracts(
      [{ importKwh: 1, exportKwh: 0 }],
      { id: "current", sourceLabel: "Current" },
      { id: "candidate", sourceLabel: "Candidate", importPriceEurKwh: Number.NaN },
    ),
    (error: unknown) => {
      assert.ok(error instanceof MissingFlatRateError);
      assert.equal(error.code, "MISSING_IMPORT_RATE");
      return true;
    },
  );

  assert.throws(
    () => compareFlatContracts(
      [{ importKwh: -1, exportKwh: 0 }],
      current,
      candidate,
    ),
    (error: unknown) => {
      assert.ok(error instanceof InvalidFlatVolumeError);
      assert.equal(error.code, "INVALID_IMPORT_VOLUME");
      return true;
    },
  );

  assert.throws(
    () => compareFlatContracts(
      [{ importKwh: 1, exportKwh: 0 }],
      current,
      { ...candidate, importPriceEurKwh: Number.POSITIVE_INFINITY },
    ),
    (error: unknown) => {
      assert.ok(error instanceof InvalidFlatRateError);
      assert.equal(error.code, "INVALID_IMPORT_RATE");
      return true;
    },
  );
});

test("muteert frozen intervallen en contractobjecten niet", () => {
  const frozenIntervals = Object.freeze([
    Object.freeze({ importKwh: 1, exportKwh: 0.5 }),
    Object.freeze({ importKwh: 2, exportKwh: 1 }),
  ]);
  const frozenCurrent = Object.freeze({ ...current });
  const frozenCandidate = Object.freeze({ ...candidate });
  const intervalsBefore = frozenIntervals.map((interval) => ({ ...interval }));
  const currentBefore = { ...frozenCurrent };
  const candidateBefore = { ...frozenCandidate };

  compareFlatContracts(frozenIntervals, frozenCurrent, frozenCandidate);

  assert.deepEqual(frozenIntervals, intervalsBefore);
  assert.deepEqual(frozenCurrent, currentBefore);
  assert.deepEqual(frozenCandidate, candidateBefore);
});
