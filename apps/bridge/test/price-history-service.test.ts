import assert from "node:assert/strict";
import test from "node:test";
import { HomeAssistantSource } from "../src/meter-source.ts";
import { loadPriceHistory, PriceHistoryUpstreamError } from "../src/price-history-service.ts";
import { InvalidPriceHistoryUnitError } from "../src/price-history.ts";

const start = "2026-10-24T22:00:00.000Z";
const end = "2026-10-25T23:00:00.000Z";
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

test("vandaag gebruikt gepubliceerde raw_today-prijzen tot lokale middernacht", async () => {
  const original = globalThis.fetch; const calls: string[] = [];
  globalThis.fetch = (async (input) => { const url = String(input); calls.push(url); return calls.length === 1
    ? json([{ entity_id: "sensor.price", state: "0", attributes: { unit_of_measurement: "EUR/kWh", raw_today: [{ start, value: 0 }, { start: "2026-10-25T02:30:00+01:00", value: -0.1 }] } }])
    : json([]); }) as typeof fetch;
  try {
    const result = await loadPriceHistory(new HomeAssistantSource("http://ha", "secret", { currentPrice: "sensor.price" }), "today", start, end);
    assert.deepEqual(result.points, [{ timestamp: start, priceCtKwh: 0 }, { timestamp: "2026-10-25T01:30:00.000Z", priceCtKwh: -10 }]);
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = original; }
});

test("morgen gebruikt één states snapshot, nul historycalls en echte raw_tomorrow", async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = (async () => { calls += 1; return json([{ entity_id: "sensor.tomorrow", state: "0", attributes: { unit_of_measurement: "€/kWh", raw_tomorrow: [
    { start, value: 0 }, { start: "2026-10-25T02:30:00+02:00", value: -0.2 }, { start: "2026-10-25T02:30:00+01:00", value: 0.3 }, { start: end, value: 9 },
  ] } }]); }) as typeof fetch;
  try {
    const result = await loadPriceHistory(new HomeAssistantSource("http://ha", "secret", { tomorrowPrice: "sensor.tomorrow" }), "tomorrow", start, end);
    assert.equal(calls, 1); assert.deepEqual(result.points.map(point => point.priceCtKwh), [0, -20, 30]); assert.equal(result.quality, "incomplete");
  } finally { globalThis.fetch = original; }
});

test("ontbrekende of lege morgenpublicatie is notPublished", async () => {
  for (const attributes of [{ unit_of_measurement: "EUR/kWh" }, { unit_of_measurement: "EUR/kWh", raw_tomorrow: [] }]) {
    const original = globalThis.fetch; globalThis.fetch = (async () => json([{ entity_id: "sensor.tomorrow", state: "0", attributes }])) as typeof fetch;
    try { assert.deepEqual(await loadPriceHistory(new HomeAssistantSource("http://ha", "x", { tomorrowPrice: "sensor.tomorrow" }), "tomorrow", start, end), { day: "tomorrow", start, end, quality: "notPublished", points: [] }); }
    finally { globalThis.fetch = original; }
  }
});

test("exact middernacht vandaag is veilig leeg zonder fetch", async () => {
  const original = globalThis.fetch; let calls = 0; globalThis.fetch = (async () => { calls += 1; throw new Error(); }) as typeof fetch;
  try { assert.deepEqual(await loadPriceHistory(new HomeAssistantSource("http://ha", "x", { currentPrice: "sensor.price" }), "today", start, start), { day: "today", start, end: start, quality: "incomplete", points: [] }); assert.equal(calls, 0); }
  finally { globalThis.fetch = original; }
});

test("ongeldige unit wordt ook bij ontbrekende morgenpublicatie geweigerd", async () => {
  const original = globalThis.fetch; globalThis.fetch = (async () => json([{ entity_id: "sensor.tomorrow", state: "0", attributes: {} }])) as typeof fetch;
  try { await assert.rejects(loadPriceHistory(new HomeAssistantSource("http://ha", "x", { tomorrowPrice: "sensor.tomorrow" }), "tomorrow", start, end), InvalidPriceHistoryUnitError); }
  finally { globalThis.fetch = original; }
});

test("malformed raw_tomorrow wordt veilige upstreamfout", async () => {
  const original = globalThis.fetch; globalThis.fetch = (async () => json([{ entity_id: "sensor.tomorrow", state: "0", attributes: { unit_of_measurement: "EUR/kWh", raw_tomorrow: "secret" } }])) as typeof fetch;
  try { await assert.rejects(loadPriceHistory(new HomeAssistantSource("http://ha", "token", { tomorrowPrice: "sensor.tomorrow" }), "tomorrow", start, end), PriceHistoryUpstreamError); }
  finally { globalThis.fetch = original; }
});
