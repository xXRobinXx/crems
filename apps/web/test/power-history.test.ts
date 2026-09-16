import assert from "node:assert/strict";
import test from "node:test";

import { parsePowerHistoryResponse, type PowerHistoryData } from "../src/power-history.ts";
import { powerAxisTicks, scalePowerHistory } from "../src/power-chart.ts";

const base: PowerHistoryData = {
  start: "2026-08-26T12:00:00.000Z",
  end: "2026-08-27T12:00:00.000Z",
  quality: "measured",
  import: [
    { timestamp: "2026-08-26T12:00:00.000Z", powerW: 0 },
    { timestamp: "2026-08-27T12:00:00.000Z", powerW: 500 },
  ],
  export: [{ timestamp: "2026-08-27T00:00:00.000Z", powerW: 250 }],
};

test("schaalt echte nul-, negatieve en eindpunten zonder NaN of Infinity", () => {
  const chart = scalePowerHistory(base);
  assert.match(chart.importPaths[0], /^M0\.00,/);
  assert.match(chart.importPaths[0], /L870\.00,[\d.]+ L870\.00,/);
  assert.match(chart.exportPaths[0], /^M435\.00,/);
  const exportY = Number(chart.exportPaths[0].split(",")[1]);
  assert.ok(exportY > chart.zeroY, "injectie hoort visueel onder de nullijn");
  assert.equal(JSON.stringify(chart).includes("NaN"), false);
  assert.equal(JSON.stringify(chart).includes("Infinity"), false);
});

test("een gedeeltelijke dag behoudt een volledig 24-uursframe zonder toekomstige verbruikspunten", () => {
  const partial = { ...base, start: "2026-08-28T22:00:00.000Z", end: "2026-08-29T12:00:00.000Z", import: [{ timestamp: "2026-08-28T22:00:00.000Z", powerW: 100 }, { timestamp: "2026-08-29T12:00:00.000Z", powerW: 300 }], export: [] };
  const chart = scalePowerHistory(partial, { start: partial.start, end: "2026-08-29T22:00:00.000Z" });
  assert.match(chart.importPaths[0]!, /L507\.50,[\d.]+ L507\.50,/);
  assert.doesNotMatch(chart.importPaths[0]!, /870\.00/);
});

test("maakt een leesbare watt-kW-linkeras met injectie onder nul", () => {
  const ticks = powerAxisTicks({ min: -2_000, max: 4_000 });
  assert.deepEqual(ticks.map(tick => tick.y), [20, 67.5, 115, 162.5, 210]);
  assert.equal(ticks[0]?.label, "4 kW");
  assert.equal(ticks.at(-1)?.label, "−2 kW");
  assert.equal(ticks.some(tick => tick.valueW < 0), true);
});

test("tekent geen verzonnen lijn voor een lege richting en ondersteunt één nulpunt", () => {
  const chart = scalePowerHistory({ ...base, import: [], export: [{ timestamp: base.start, powerW: 0 }] });
  assert.deepEqual(chart.importPaths, []);
  assert.deepEqual(chart.exportPaths, []);
});

test("verbergt nutteloze injectienullen vóór en na de actieve injectieperiode", () => {
  const chart = scalePowerHistory({
    ...base,
    import: [],
    export: [
      { timestamp: base.start, powerW: 0 },
      { timestamp: "2026-08-26T18:00:00.000Z", powerW: 120 },
      { timestamp: "2026-08-26T19:00:00.000Z", powerW: 0 },
      { timestamp: "2026-08-26T20:00:00.000Z", powerW: 80 },
      { timestamp: base.end, powerW: 0 },
    ],
  });
  assert.match(chart.exportPaths[0], /^M217\.50,/);
  assert.doesNotMatch(chart.exportPaths[0], /870\.00/);
});

test("bewaart alleen veilige velden en weigert toekomstpunten na het response-einde", () => {
  const safe = parsePowerHistoryResponse({
    ...base,
    secret: "wordt verwijderd",
    import: { points: base.import, raw: "wordt verwijderd" },
    export: { points: base.export },
  });
  assert.deepEqual(safe, base);
  assert.equal(parsePowerHistoryResponse({
    ...base,
    import: { points: [{ timestamp: "2026-08-28T12:00:00.000Z", powerW: 1 }] },
    export: { points: [] },
  }), undefined);
});
