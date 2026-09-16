import assert from "node:assert/strict";
import test from "node:test";
import { parsePriceHistoryResponse, type PriceHistoryData, type PriceHistoryState } from "../src/price-history.ts";
import { createPriceHistoryController } from "../src/price-history-controller.ts";
import { scalePriceHistory } from "../src/price-chart.ts";

const base: PriceHistoryData = { day: "today", start: "2026-08-28T00:00:00.000Z", end: "2026-08-29T00:00:00.000Z", quality: "measured", points: [
  { timestamp: "2026-08-28T01:00:00.000Z", priceCtKwh: 0 }, { timestamp: "2026-08-28T02:00:00.000Z", priceCtKwh: -5 }, { timestamp: "2026-08-28T03:00:00.000Z", priceCtKwh: 10 },
] };

test("parser bewaart alleen allowlistvelden en geldige nul/negatieve prijzen", () => {
  assert.deepEqual(parsePriceHistoryResponse({ ...base, token: "secret", points: base.points.map(point => ({ ...point, raw: true })) }), base);
  assert.equal(parsePriceHistoryResponse({ ...base, points: [{ timestamp: base.start, priceCtKwh: Number.NaN }] }), undefined);
  assert.equal(parsePriceHistoryResponse({ ...base, day: "later" }), undefined);
  assert.equal(parsePriceHistoryResponse({ ...base, quality: "notPublished", points: base.points }), undefined);
  assert.deepEqual(parsePriceHistoryResponse({ ...base, quality: "notPublished", points: [] })?.points, []);
});

test("prijsschaal maakt hourly steps, behoudt negatieve nul en stopt op laatste x", () => {
  const chart = scalePriceHistory(base);
  assert.match(chart.path, /^M36\.25,/); assert.match(chart.path, /L72\.50,[\d.]+ L72\.50,/); assert.match(chart.path, /L108\.75,[\d.]+$/);
  assert.equal(chart.path.includes("870.00"), false); assert.equal(chart.min, -5); assert.equal(chart.max, 10);
  const empty = scalePriceHistory({ ...base, points: [] }); assert.equal(empty.path, ""); assert.equal(Number.isFinite(empty.zeroY), true);
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const setup = () => {
  const states: PriceHistoryState[] = []; const calls: Array<{ day: string; signal: AbortSignal; resolve: (data: PriceHistoryData) => void; reject: () => void }> = []; const timers: Array<() => void> = []; const cleared = new Set<number>();
  const load = (day: "yesterday" | "today" | "tomorrow", signal: AbortSignal) => new Promise<PriceHistoryData>((resolve, reject) => calls.push({ day, signal, resolve, reject: () => reject(new Error("safe")) }));
  const controller = createPriceHistoryController(state => states.push(state), { request: fetch, load, setInterval: callback => { const id = timers.length + 1; timers.push(() => { if (!cleared.has(id)) callback(); }); return id as never; }, clearInterval: timer => cleared.add(timer as number) });
  return { states, calls, timers, controller };
};

test("gisteren eenmaal; vandaag en morgen krijgen geïnjecteerde 10min refresh", () => {
  const s = setup(); s.controller.update(true, "yesterday"); assert.equal(s.calls.length, 1); assert.equal(s.timers.length, 0);
  s.controller.update(true, "today"); assert.equal(s.calls.length, 2); assert.equal(s.timers.length, 1); s.timers[0](); assert.equal(s.calls.length, 3);
  s.controller.update(true, "tomorrow"); assert.equal(s.calls.length, 4); assert.equal(s.timers.length, 2); s.timers[1](); assert.equal(s.calls.length, 5);
});

test("selectiewissel abort en negeert stale resolve/reject; unavailable doet nul fetch", async () => {
  const s = setup(); s.controller.update(false, "today"); assert.equal(s.calls.length, 0); assert.equal(s.states.at(-1)?.status, "unavailable");
  s.controller.update(true, "today"); const old = s.calls[0]!; s.controller.update(true, "tomorrow"); assert.equal(old.signal.aborted, true); old.resolve(base); await flush(); assert.equal(s.states.at(-1)?.status, "loading");
  const current = s.calls[1]!; s.controller.update(true, "yesterday"); current.reject(); await flush(); assert.equal(s.states.at(-1)?.status, "loading");
});

test("backgroundfout bewaart laatst geldige prijs met waarschuwing", async () => {
  const s = setup(); s.controller.update(true, "today"); s.calls[0]!.resolve(base); await flush(); s.timers[0](); s.calls[1]!.reject(); await flush();
  assert.deepEqual(s.states.at(-1), { status: "success", data: base, refreshError: true });
});

test("pauzeert verborgen polling en ververst onmiddellijk bij terugkeer", () => {
  const s = setup(); s.controller.update(true, "today"); assert.equal(s.timers.length, 1);
  s.controller.setVisibility(false); s.timers[0]!(); assert.equal(s.calls.length, 1);
  s.controller.setVisibility(true); assert.equal(s.calls.length, 2); assert.equal(s.timers.length, 2);
});

test("gisteren blijft één fetch en een initieel verborgen tabblad wacht op zichtbaarheid", () => {
  const yesterday = setup(); yesterday.controller.update(true, "yesterday"); yesterday.controller.setVisibility(false); yesterday.controller.setVisibility(true); assert.equal(yesterday.calls.length, 1);
  const hidden = setup(); hidden.controller.setVisibility(false); hidden.controller.update(true, "today"); assert.equal(hidden.calls.length, 0); hidden.controller.setVisibility(true); assert.equal(hidden.calls.length, 1);
});
