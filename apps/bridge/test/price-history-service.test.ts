import assert from "node:assert/strict";
import test from "node:test";
import { HomeAssistantSource } from "../src/meter-source.ts";
import { loadPriceHistory, PriceHistoryUpstreamError } from "../src/price-history-service.ts";
import { InvalidPriceHistoryUnitError } from "../src/price-history.ts";

const start = "2026-10-24T22:00:00.000Z";
const end = "2026-10-25T23:00:00.000Z";
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

test("herhaalde live meterupdates behouden de ingestelde morgenprijsbron", async () => {
  const original = globalThis.fetch; const calls: string[] = [];
  const tomorrow = { entity_id: "sensor.tomorrow", state: "0", attributes: { unit_of_measurement: "EUR/kWh", raw_tomorrow: [{ start, value: 0 }, { start: "2026-10-25T00:00:00.000Z", value: -0.2 }] } };
  globalThis.fetch = (async (input) => {
    calls.push(String(input));
    const path = new URL(String(input)).pathname;
    if (path === "/api/states/sensor.tomorrow") return json(tomorrow);
    assert.equal(path, "/api/states");
    return json([
      { entity_id: "sensor.import", state: "125", attributes: { unit_of_measurement: "W", device_class: "power" } },
      { entity_id: "sensor.export", state: "0", attributes: { unit_of_measurement: "W", device_class: "power" } },
      tomorrow,
    ]);
  }) as typeof fetch;
  try {
    const source = new HomeAssistantSource("http://ha", "synthetic-token", { importPower: "sensor.import", exportPower: "sensor.export", tomorrowPrice: "sensor.tomorrow" });
    for (let index = 0; index < 3; index += 1) await source.read();
    const result = await loadPriceHistory(source, "tomorrow", start, end);
    assert.deepEqual(result.points, [{ timestamp: start, priceCtKwh: 0 }, { timestamp: "2026-10-25T00:00:00.000Z", priceCtKwh: -20 }]);
    assert.equal(result.quality, "measured");
    assert.equal(source.detectedEntities.tomorrowPrice, "sensor.tomorrow");
    assert.equal(calls.length, 4);
    assert.deepEqual(calls.map(url => new URL(url).pathname), ["/api/states", "/api/states", "/api/states", "/api/states/sensor.tomorrow"]);
  } finally { globalThis.fetch = original; }
});

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

test("gisteren gebruikt history ook als de huidige sensor raw_tomorrow bevat", async () => {
  const original = globalThis.fetch; const calls: string[] = [];
  const from = "2026-09-21T22:00:00.000Z", to = "2026-09-22T22:00:00.000Z";
  globalThis.fetch = (async (input) => {
    const url = String(input); calls.push(url);
    return url.includes("/api/history/")
      ? json([[{ last_changed: from, state: "0.15" }]])
      : json({ entity_id: "sensor.price", state: "0.2", attributes: { unit_of_measurement: "EUR/kWh", raw_tomorrow: [{ start: from, value: 0.99 }] } });
  }) as typeof fetch;
  try {
    const result = await loadPriceHistory(new HomeAssistantSource("http://ha", "synthetic-token", { currentPrice: "sensor.price" }), "yesterday", from, to);
    assert.deepEqual(result.points, [{ timestamp: from, priceCtKwh: 15, end: to }]);
    assert.equal(calls.length, 2);
    assert.ok(calls[1]?.includes("/api/history/"));
  } finally { globalThis.fetch = original; }
});

test("vandaag gebruikt de gepubliceerde dagreeks van de morgenprijssensor", async () => {
  const original = globalThis.fetch; const calls: string[] = [];
  const from = "2026-09-24T22:00:00.000Z", to = "2026-09-25T22:00:00.000Z";
  globalThis.fetch = (async (input) => {
    const url = String(input); calls.push(url);
    if (url.endsWith("/api/states/sensor.planner")) return json({ entity_id: "sensor.planner", state: "0", attributes: { unit_of_measurement: "EUR/kWh", raw_today: [
      { start: from, value: 0.1 }, { start: "2026-09-25T21:00:00.000Z", value: -0.02 },
    ] } });
    throw new Error("historie of huidige-uursensor mag niet worden gelezen");
  }) as typeof fetch;
  try {
    const source = new HomeAssistantSource("http://ha", "synthetic-token", { currentPrice: "sensor.current", tomorrowPrice: "sensor.planner" });
    const result = await loadPriceHistory(source, "today", from, to);
    assert.deepEqual(result.points, [{ timestamp: from, priceCtKwh: 10 }, { timestamp: "2026-09-25T21:00:00.000Z", priceCtKwh: -2 }]);
    assert.equal(result.quality, "measured");
    assert.equal(calls.length, 1);
  } finally { globalThis.fetch = original; }
});

test("gisteren gebruikt history van dezelfde spotprijssensor als vandaag en morgen", async () => {
  const original = globalThis.fetch; const calls: string[] = [];
  const from = "2026-09-22T22:00:00.000Z", to = "2026-09-23T22:00:00.000Z";
  globalThis.fetch = (async (input) => {
    const url = String(input); calls.push(url);
    if (url.endsWith("/api/states/sensor.planner")) return json({ entity_id: "sensor.planner", state: "0.1", attributes: { unit_of_measurement: "EUR/kWh", raw_today: [{ start: to, value: 0.2 }] } });
    if (url.includes("/api/history/") && new URL(url).searchParams.get("filter_entity_id") === "sensor.planner") return json([[{ last_changed: from, state: "0.05" }]]);
    throw new Error("andere prijssensor mag niet worden gelezen");
  }) as typeof fetch;
  try {
    const source = new HomeAssistantSource("http://ha", "synthetic-token", { currentPrice: "sensor.current", tomorrowPrice: "sensor.planner" });
    const result = await loadPriceHistory(source, "yesterday", from, to);
    assert.deepEqual(result.points, [{ timestamp: from, priceCtKwh: 5, end: to }]);
    assert.equal(calls.length, 2);
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

test("historystatus blijft geldig tot volgende wijziging en stopt bij unavailable",async()=>{
  const original=globalThis.fetch; const calls:string[]=[];
  const from="2026-09-01T00:00:00.000Z",to="2026-09-02T00:00:00.000Z";
  globalThis.fetch=(async(input)=>{calls.push(String(input));return String(input).includes('/history/')?json([[{last_changed:from,state:"0"},{last_changed:"2026-09-01T03:00:00Z",state:"unavailable"},{last_changed:"2026-09-01T05:00:00Z",state:"-0.1"}]]):json({entity_id:"sensor.price",state:"0",attributes:{unit_of_measurement:"EUR/kWh"}})}) as typeof fetch;
  try{
    const result=await loadPriceHistory(new HomeAssistantSource("http://ha","test",{currentPrice:"sensor.price"}),"today",from,to,Date.parse("2026-09-01T06:30:00Z"));
    assert.deepEqual(result.points,[{timestamp:from,priceCtKwh:0,end:"2026-09-01T03:00:00.000Z"},{timestamp:"2026-09-01T05:00:00.000Z",priceCtKwh:-10,end:"2026-09-01T06:30:00.000Z"}]);
    assert.equal(result.quality,"incomplete");
    assert.equal(calls.length,2);
    assert.equal(new URL(calls[1]!).searchParams.get("end_time"),"2026-09-01T06:30:00.000Z");
  }finally{globalThis.fetch=original;}
});
