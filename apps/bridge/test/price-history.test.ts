import assert from "node:assert/strict";
import test from "node:test";
import { InvalidPriceHistoryUnitError, InvalidPriceHistoryWindowError, normalizePriceHistory } from "../src/price-history.ts";

const window = { start: "2026-10-25T00:00:00+02:00", end: "2026-10-26T00:00:00+01:00" };

test("normaliseert beide expliciete units naar ct/kWh met nul en negatieve prijzen", () => {
  for (const unit of [" EUR/kWh ", " €/KWH "]) {
    assert.deepEqual(normalizePriceHistory({ unit, ...window, records: [
      { state: "0", last_changed: window.start },
      { state: "-0.125", last_changed: "2026-10-25T02:30:00+01:00" },
    ] }).points, [
      { timestamp: "2026-10-24T22:00:00.000Z", priceCtKwh: 0 },
      { timestamp: "2026-10-25T01:30:00.000Z", priceCtKwh: -12.5 },
    ]);
  }
});

test("gebruikt last_changed primair, last_updated alleen als veld ontbreekt", () => {
  const result = normalizePriceHistory({ unit: "EUR/kWh", ...window, records: [
    { state: "1", last_updated: "2026-10-25T00:30:00+02:00" },
    { state: "2", last_changed: "ongeldig", last_updated: "2026-10-25T01:00:00+02:00" },
  ] });
  assert.equal(result.points.length, 1); assert.equal(result.invalidCount, 1);
});

test("start is inclusief en eind exclusief; tellingen zijn exclusief; laatste geldige duplicate wint", () => {
  const result = normalizePriceHistory({ unit: "€/kWh", ...window, records: [
    { state: "1", last_changed: window.end },
    { state: "2", last_changed: window.start },
    { state: "3", last_changed: window.start },
    { state: "unavailable", last_changed: window.start },
    { state: "4", last_changed: "2026-10-26T00:00:01+01:00" },
  ] });
  assert.deepEqual(result, { points: [
    { timestamp: "2026-10-24T22:00:00.000Z", priceCtKwh: 300 },
  ], invalidCount: 1, outsideWindowCount: 2, duplicateCount: 1 });
});

test("leeg en all-invalid zijn veilig leeg zonder bronvelden", () => {
  const empty = normalizePriceHistory({ unit: "EUR/kWh", ...window, records: [] });
  assert.deepEqual(empty, { points: [], invalidCount: 0, outsideWindowCount: 0, duplicateCount: 0 });
  const invalid = normalizePriceHistory({ unit: "EUR/kWh", ...window, records: [{ state: "", attributes: { secret: true } }, null] });
  assert.deepEqual(invalid, { points: [], invalidCount: 2, outsideWindowCount: 0, duplicateCount: 0 });
  assert.deepEqual(Object.keys(invalid), ["points", "invalidCount", "outsideWindowCount", "duplicateCount"]);
});

test("valideert venster vóór unit met vaste veilige fouten", () => {
  assert.throws(() => normalizePriceHistory({ records: [], unit: "", start: "bad", end: "bad" }), (error) => error instanceof InvalidPriceHistoryWindowError && error.code === "INVALID_PRICE_HISTORY_WINDOW");
  for (const unit of ["", "ct/kWh", "W"]) assert.throws(() => normalizePriceHistory({ records: [], unit, ...window }), (error) => error instanceof InvalidPriceHistoryUnitError && error.code === "INVALID_PRICE_HISTORY_UNIT");
  assert.throws(() => normalizePriceHistory({ records: [], unit: "EUR/kWh", start: window.start, end: window.start }), InvalidPriceHistoryWindowError);
});

test("muteert diep bevroren input niet", () => {
  const record = Object.freeze({ state: "0.4", last_changed: window.start, attributes: Object.freeze({ entity_id: "verborgen" }) });
  const records = Object.freeze([record]);
  normalizePriceHistory(Object.freeze({ records, unit: "EUR/kWh", ...window }));
  assert.equal(record.state, "0.4");
});
