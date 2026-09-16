import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidHistoryUnitError,
  InvalidHistoryWindowError,
  normalizePowerHistory,
} from "../src/power-history.js";

const window = {
  start: "2026-01-02T10:00:00Z",
  end: "2026-01-02T11:00:00Z",
};

test("normaliseert W en getrimde kW exact volgens de live vermogenssemantiek", () => {
  assert.deepEqual(normalizePowerHistory({
    records: [
      { state: "249.6", last_changed: "2026-01-02T10:00:00Z" },
      { state: "0", last_changed: "2026-01-02T10:15:00Z" },
      { state: "-249.6", last_changed: "2026-01-02T10:30:00Z" },
    ],
    unit: "W",
    ...window,
  }), {
    points: [
      { timestamp: "2026-01-02T10:00:00.000Z", powerW: 250 },
      { timestamp: "2026-01-02T10:15:00.000Z", powerW: 0 },
      { timestamp: "2026-01-02T10:30:00.000Z", powerW: -250 },
    ],
    invalidCount: 0,
    outsideWindowCount: 0,
    duplicateCount: 0,
  });

  assert.deepEqual(normalizePowerHistory({
    records: [{ state: " 0.25 ", last_changed: "2026-01-02T10:00:00Z" }],
    unit: " kW ",
    ...window,
  }).points, [{ timestamp: "2026-01-02T10:00:00.000Z", powerW: 250 }]);
});

test("telt alle ongeldige recordvormen states en timestamps uitsluitend als invalid", () => {
  const invalidRecords: unknown[] = [
    null,
    "not-an-object",
    [],
    {},
    { state: 1, last_changed: "2026-01-02T10:00:00Z" },
    ...["unknown", "unavailable", "none", "", "   ", "not-numeric", "NaN", "Infinity", "-Infinity"]
      .map((state) => ({ state, last_changed: "2026-01-02T10:00:00Z" })),
    { state: "1" },
    { state: "1", last_changed: 123 },
    { state: "1", last_changed: "not-a-timestamp" },
    {
      state: "1",
      last_changed: "not-a-timestamp",
      last_updated: "2026-01-02T10:00:00Z",
    },
  ];
  const result = normalizePowerHistory({ records: invalidRecords, unit: "W", ...window });

  assert.deepEqual(result, {
    points: [],
    invalidCount: invalidRecords.length,
    outsideWindowCount: 0,
    duplicateCount: 0,
  });
  assert.equal(JSON.stringify(result).includes("not-a-timestamp"), false);
  assert.equal(result.points.length + result.invalidCount + result.outsideWindowCount + result.duplicateCount, invalidRecords.length);
});

test("gebruikt last_changed primair en last_updated alleen wanneer last_changed ontbreekt", () => {
  const result = normalizePowerHistory({
    records: [
      {
        state: "100",
        last_changed: "2026-01-02T10:15:00+00:00",
        last_updated: "2026-01-02T10:45:00Z",
      },
      { state: "200", last_updated: "2026-01-02T10:30:00+00:00" },
    ],
    unit: "W",
    ...window,
  });

  assert.deepEqual(result.points, [
    { timestamp: "2026-01-02T10:15:00.000Z", powerW: 100 },
    { timestamp: "2026-01-02T10:30:00.000Z", powerW: 200 },
  ]);
});

test("houdt inclusieve offsetgrenzen en telt alleen echte buitenvensterpunten", () => {
  const result = normalizePowerHistory({
    records: [
      { state: "1", last_changed: "2026-01-02T10:59:59+01:00" },
      { state: "2", last_changed: "2026-01-02T11:00:00+01:00" },
      { state: "3", last_changed: "2026-01-02T11:30:00+01:00" },
      { state: "4", last_changed: "2026-01-02T12:00:00+01:00" },
      { state: "5", last_changed: "2026-01-02T12:00:01+01:00" },
    ],
    unit: "W",
    start: "2026-01-02T11:00:00+01:00",
    end: "2026-01-02T12:00:00+01:00",
  });

  assert.deepEqual(result.points, [
    { timestamp: "2026-01-02T10:00:00.000Z", powerW: 2 },
    { timestamp: "2026-01-02T10:30:00.000Z", powerW: 3 },
    { timestamp: "2026-01-02T11:00:00.000Z", powerW: 4 },
  ]);
  assert.equal(result.outsideWindowCount, 2);
});

test("sorteert chronologisch en behoudt bij duplicaten het laatste geldige bronrecord", () => {
  const records = [
    { state: "300", last_changed: "2026-01-02T10:30:00Z" },
    { state: "100", last_changed: "2026-01-02T10:00:00Z" },
    { state: "200", last_changed: "2026-01-02T11:00:00+01:00" },
    { state: "250", last_changed: "2026-01-02T10:00:00.000Z" },
    { state: "invalid", last_changed: "2026-01-02T10:00:00Z" },
  ];
  const result = normalizePowerHistory({ records, unit: "W", ...window });

  assert.deepEqual(result, {
    points: [
      { timestamp: "2026-01-02T10:00:00.000Z", powerW: 250 },
      { timestamp: "2026-01-02T10:30:00.000Z", powerW: 300 },
    ],
    invalidCount: 1,
    outsideWindowCount: 0,
    duplicateCount: 2,
  });
  assert.equal(result.points.length + result.invalidCount + result.outsideWindowCount + result.duplicateCount, records.length);
});

test("levert voor een lege reeks expliciete nulwaarden zonder fout", () => {
  assert.deepEqual(normalizePowerHistory({ records: [], unit: "W", ...window }), {
    points: [],
    invalidCount: 0,
    outsideWindowCount: 0,
    duplicateCount: 0,
  });
});

test("valideert venster vóór eenheid met stabiele veilige fouten", () => {
  for (const invalidWindow of [
    { start: "invalid-start", end: window.end },
    { start: window.start, end: "invalid-end" },
    { start: window.end, end: window.start },
  ]) {
    assert.throws(
      () => normalizePowerHistory({ records: [], unit: "invalid-unit", ...invalidWindow }),
      (error: unknown) => {
        assert.ok(error instanceof InvalidHistoryWindowError);
        assert.equal(error.code, "INVALID_HISTORY_WINDOW");
        assert.equal(error.message, "Historiekvenster is ongeldig");
        assert.equal(error.message.includes(invalidWindow.start), false);
        return true;
      },
    );
  }

  for (const unit of ["", "   ", "MW", "VA"]) {
    assert.throws(
      () => normalizePowerHistory({ records: [], unit, ...window }),
      (error: unknown) => {
        assert.ok(error instanceof InvalidHistoryUnitError);
        assert.equal(error.code, "INVALID_HISTORY_UNIT");
        assert.equal(error.message, "Historiekeenheid is ongeldig");
        if (unit.trim() !== "") assert.equal(error.message.includes(unit), false);
        return true;
      },
    );
  }
});

test("muteert frozen invoerarray en records niet", () => {
  const records = Object.freeze([
    Object.freeze({ state: "100", last_changed: "2026-01-02T10:00:00Z" }),
    Object.freeze({ state: "200", last_updated: "2026-01-02T10:15:00Z" }),
  ]);
  const before = records.map((record) => ({ ...record }));

  normalizePowerHistory({ records, unit: "W", ...window });

  assert.deepEqual(records, before);
});
