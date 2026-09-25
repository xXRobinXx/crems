import assert from "node:assert/strict";
import test from "node:test";
import { createDirectSpotPriceLoader, parseDirectSpotPrices } from "../src/direct-spot-price.ts";
import { priceDayWindow } from "../src/price-day-window.ts";
import { PriceHistoryUpstreamError } from "../src/price-history-service.ts";

const now = new Date("2026-09-24T10:00:00.000Z");
const windows = ["yesterday", "today", "tomorrow"].map(day => priceDayWindow(day as "yesterday" | "today" | "tomorrow", now));
const rows = windows.flatMap(({ start, end }) => Array.from({ length: (Date.parse(end) - Date.parse(start)) / 900_000 }, (_, index) => ({
  timestamp: new Date(Date.parse(start) + index * 900_000).toISOString(),
  values: { day_ahead_price: index === 1 ? -5 : index === 2 ? 0 : 50 },
})));
const payload = (data: unknown = rows) => ({ schema_version: "2.0", endpoint: "price", bidding_zone: "BE", timezone: "Europe/Brussels", unit: "EUR / MWh", interval_minutes: 15, license: "CC BY 4.0 (creativecommons.org/licenses/by/4.0) from Bundesnetzagentur | SMARD.de", data });

test("één openbare BE-opvraag voedt drie volledige dagen en cachet herhaalde requests", async () => {
  const urls: string[] = [];
  const request = (async (input: RequestInfo | URL) => { urls.push(String(input)); return new Response(JSON.stringify(payload()), { status: 200 }); }) as typeof fetch;
  const load = createDirectSpotPriceLoader(request);
  for (const [index, day] of (["yesterday", "today", "tomorrow"] as const).entries()) {
    const window = windows[index]!;
    const result = await load(day, window.start, window.end, now);
    assert.equal(result.quality, "measured");
    assert.equal(result.points.length, 96);
    assert.equal(result.points[0]!.timestamp, window.start);
    assert.equal(result.points.at(-1)!.end, window.end);
    assert.equal(result.points[1]!.priceCtKwh, -0.5);
    assert.equal(result.points[2]!.priceCtKwh, 0);
    assert.match(result.source!, /Energy-Charts.info/);
  }
  assert.equal(urls.length, 1);
  const url = new URL(urls[0]!);
  assert.equal(url.hostname, "api.energy-charts.info");
  assert.equal(url.searchParams.get("bzn"), "BE");
  assert.equal(url.searchParams.get("start"), "2026-09-23");
  assert.equal(url.searchParams.get("end"), "2026-09-25");
});

test("niet-gepubliceerde morgenprijzen blijven leeg en ontbrekend kwartier wordt onvolledig", async () => {
  const load = createDirectSpotPriceLoader((async () => new Response(JSON.stringify(payload(rows.slice(0, 192).filter((_, index) => index !== 8))), { status: 200 })) as typeof fetch);
  const yesterday = await load("yesterday", windows[0]!.start, windows[0]!.end, now);
  const tomorrow = await load("tomorrow", windows[2]!.start, windows[2]!.end, now);
  assert.equal(yesterday.quality, "incomplete");
  assert.equal(yesterday.points.length, 95);
  assert.deepEqual(tomorrow.points, []);
  assert.equal(tomorrow.quality, "notPublished");
});

test("winter- en zomertijd volgen absolute kwartieren zonder dubbel lokaal uur te verliezen", () => {
  for (const snapshot of [new Date("2026-03-29T12:00:00Z"), new Date("2026-10-25T12:00:00Z")]) {
    const window = priceDayWindow("today", snapshot);
    const count = (Date.parse(window.end) - Date.parse(window.start)) / 900_000;
    assert.ok(count === 92 || count === 100);
    const data = Array.from({ length: count }, (_, index) => ({ timestamp: new Date(Date.parse(window.start) + index * 900_000).toISOString(), values: { day_ahead_price: index } }));
    const result = parseDirectSpotPrices(payload(data), window.start, window.end);
    assert.equal(result.points.length, count);
    assert.equal(result.points.at(-1)!.end, window.end);
  }
});

test("ongeldige unit, zone en licentie worden geweigerd zonder schijnprijzen", () => {
  for (const change of [{ unit: "EUR/kWh" }, { bidding_zone: "NL" }, { license: "private use only" }]) {
    assert.throws(() => parseDirectSpotPrices({ ...payload(), ...change }, windows[0]!.start, windows[2]!.end), PriceHistoryUpstreamError);
  }
});
