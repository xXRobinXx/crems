import assert from "node:assert/strict";
import test from "node:test";
import { createPriceHistoryLoader, parsePriceHistoryResponse, type PriceHistoryData, type PriceHistoryState } from "../src/price-history.ts";
import { createPriceHistoryController } from "../src/price-history-controller.ts";
import { priceIntervals, scalePriceHistory, spotPriceAt } from "../src/price-chart.ts";

const base: PriceHistoryData = { day: "today", start: "2026-08-28T00:00:00.000Z", end: "2026-08-29T00:00:00.000Z", quality: "measured", points: [
  { timestamp: "2026-08-28T01:00:00.000Z", priceCtKwh: 0 }, { timestamp: "2026-08-28T02:00:00.000Z", priceCtKwh: -5 }, { timestamp: "2026-08-28T03:00:00.000Z", priceCtKwh: 10 },
] };

test("prijsresponses coalescen en hergebruiken alleen gevalideerde dagdata", async () => {
  let clock = Date.parse("2026-08-28T12:00:00.000Z");
  const load = createPriceHistoryLoader(() => clock);
  let fetches = 0;
  let resolveFetch!: (value: Response) => void;
  const request = (() => { fetches += 1; return new Promise<Response>(resolve => { resolveFetch = resolve; }); }) as typeof fetch;
  const first = load("today", new AbortController().signal, request);
  const second = load("today", new AbortController().signal, request);
  assert.equal(fetches, 1);
  resolveFetch(new Response(JSON.stringify(base), { status: 200 }));
  assert.deepEqual(await first, base);
  assert.deepEqual(await second, base);
  assert.deepEqual(await load("today", new AbortController().signal, request), base);
  assert.equal(fetches, 1);
  clock += 60_001;
  const expired = (async () => { fetches += 1; return new Response(JSON.stringify(base), { status: 200 }); }) as typeof fetch;
  assert.deepEqual(await load("today", new AbortController().signal, expired), base);
  assert.equal(fetches, 2);
  await load("tomorrow", new AbortController().signal, (async () => { fetches += 1; return new Response(JSON.stringify({ ...base, day: "tomorrow" }), { status: 200 }); }) as typeof fetch);
  assert.equal(fetches, 3);
  clock = Date.parse("2026-08-28T22:01:00.000Z");
  await load("today", new AbortController().signal, expired);
  assert.equal(fetches, 4);
});

test("afgebroken caller breekt geen gedeelde prijsopvraag voor andere caller", async () => {
  const load = createPriceHistoryLoader();
  let resolveFetch!: (value: Response) => void;
  let fetchSignal: AbortSignal | undefined;
  const request = ((_input: RequestInfo | URL, init?: RequestInit) => { fetchSignal = init?.signal as AbortSignal; return new Promise<Response>(resolve => { resolveFetch = resolve; }); }) as typeof fetch;
  const aborted = new AbortController();
  const first = load("today", aborted.signal, request);
  const second = load("today", new AbortController().signal, request);
  aborted.abort();
  await assert.rejects(first, { name: "AbortError" });
  assert.equal(fetchSignal?.aborted, false);
  resolveFetch(new Response(JSON.stringify(base), { status: 200 }));
  assert.deepEqual(await second, base);
});

test("mislukte of ongeldige prijsopvraag wordt niet gecachet", async () => {
  const load = createPriceHistoryLoader();
  let fetches = 0;
  const failing = (async () => { fetches += 1; return new Response("{}", { status: 502 }); }) as typeof fetch;
  await assert.rejects(load("today", new AbortController().signal, failing));
  await assert.rejects(load("today", new AbortController().signal, failing));
  assert.equal(fetches, 2);
});

test("cache bewaart alle 96 kwartierwaarden zonder extra responsebytes bij hergebruik", async () => {
  const load = createPriceHistoryLoader();
  const start = Date.parse("2026-08-28T00:00:00.000Z");
  const data: PriceHistoryData = { day: "today", start: new Date(start).toISOString(), end: new Date(start + 86_400_000).toISOString(), quality: "measured", points: Array.from({ length: 96 }, (_, index) => ({ timestamp: new Date(start + index * 900_000).toISOString(), end: new Date(start + (index + 1) * 900_000).toISOString(), priceCtKwh: index / 10 })) };
  const body = JSON.stringify(data);
  const bytes = new TextEncoder().encode(body).byteLength;
  let fetches = 0;
  let transferredBytes = 0;
  const request = (async () => { fetches += 1; transferredBytes += bytes; return new Response(body, { status: 200 }); }) as typeof fetch;
  const first = await load("today", new AbortController().signal, request);
  const second = await load("today", new AbortController().signal, request);
  assert.equal(first.points.length, 96);
  assert.deepEqual(second, first);
  assert.equal(fetches, 1);
  assert.equal(transferredBytes, bytes);
});

test("parser bewaart alleen allowlistvelden en geldige nul/negatieve prijzen", () => {
  assert.deepEqual(parsePriceHistoryResponse({ ...base, token: "secret", points: base.points.map(point => ({ ...point, raw: true })) }), base);
  assert.equal(parsePriceHistoryResponse({ ...base, points: [{ timestamp: base.start, priceCtKwh: Number.NaN }] }), undefined);
  assert.equal(parsePriceHistoryResponse({ ...base, day: "later" }), undefined);
  assert.equal(parsePriceHistoryResponse({ ...base, quality: "notPublished", points: base.points }), undefined);
  assert.deepEqual(parsePriceHistoryResponse({ ...base, quality: "notPublished", points: [] })?.points, []);
  const direct = { ...base, source: "Energy-Charts.info · Bundesnetzagentur | SMARD.de", points: [{ timestamp: base.start, priceCtKwh: -0.5, end: "2026-08-28T00:15:00.000Z" }] };
  assert.deepEqual(parsePriceHistoryResponse(direct), direct);
  assert.equal(parsePriceHistoryResponse({ ...direct, source: "onbekende bron" }), undefined);
});

test("prijsschaal maakt begrensde uurintervallen en behoudt negatieve nul", () => {
  const chart = scalePriceHistory(base);
  assert.match(chart.path, /^M36\.25,/); assert.match(chart.path, /L72\.50,[\d.]+ L72\.50,/); assert.match(chart.path, /L145\.00,[\d.]+$/);
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

test("na effect-opruiming start dezelfde dag opnieuw, zoals bij React StrictMode", async () => {
  const s = setup();
  s.controller.update(true, "today");
  const first = s.calls[0]!;
  s.controller.dispose();
  assert.equal(first.signal.aborted, true);
  s.controller.update(true, "today");
  assert.equal(s.calls.length, 2);
  s.calls[1]!.resolve(base);
  await flush();
  assert.equal(s.states.at(-1)?.status, "success");
});

test("sensorjitter en kort eerste interval vormen een verbonden traplijn", () => {
  const timestamps = ["2026-08-28T00:00:00.000Z", "2026-08-28T00:09:17.935Z", "2026-08-28T01:09:17.850Z", "2026-08-28T02:09:18.100Z"];
  const data = {...base, day: "yesterday" as const, points: timestamps.map((timestamp,index)=>({timestamp,priceCtKwh:index-1}))};
  const chart=scalePriceHistory(data);
  assert.equal(chart.path.split("M").length-1,1);
  assert.deepEqual(chart.intervals.slice(0,3).map(p=>p.end),timestamps.slice(1));
  assert.equal(chart.intervals.at(-1)!.end,"2026-08-28T03:09:18.100Z");
  assert.equal(chart.points.length,0);
  assert.equal(chart.min,-1);assert.equal(chart.lowest,-1);
});

test("lange gaten blijven leeg, jittertolerantie is begrensd en één punt blijft een punt",()=>{
  const data={...base,day:"yesterday" as const,points:[0,1,2,5].map(hour=>({timestamp:`2026-08-28T0${hour}:00:00.000Z`,priceCtKwh:hour}))};
  const chart=scalePriceHistory(data);
  assert.equal(chart.intervals[2]!.end,"2026-08-28T03:00:00.000Z");
  assert.equal(chart.path.split("M").length-1,2);
  const single=scalePriceHistory({...data,points:data.points.slice(0,1)});
  assert.equal(single.path,"");assert.equal(single.points.length,1);assert.equal(single.intervals[0]!.inferred,false);
  const irregular=scalePriceHistory({...data,points:[0,3610,7220].map(seconds=>({timestamp:new Date(Date.parse(base.start)+seconds*1000).toISOString(),priceCtKwh:0}))});
  assert.equal(irregular.path,"");assert.equal(irregular.points.length,3);
});

test("vandaag stopt uiterlijk nu en laatste interval loopt maximaal één cadence",()=>{
  const data={...base,points:[0,1,2].map(hour=>({timestamp:`2026-08-28T0${hour}:00:00.000Z`,priceCtKwh:0}))};
  assert.equal(priceIntervals(data,Date.parse("2026-08-28T02:20:00Z")).at(-1)!.end,"2026-08-28T02:20:00.000Z");
  assert.equal(priceIntervals(data,Date.parse("2026-08-28T10:00:00Z")).at(-1)!.end,"2026-08-28T03:00:00.000Z");
});

test("gepubliceerde prijzen van vandaag blijven zichtbaar tot lokale middernacht",()=>{
  const start="2026-09-25T00:00:00.000Z",end="2026-09-26T00:00:00.000Z";
  const data={...base,start,end,points:Array.from({length:24},(_,hour)=>({timestamp:new Date(Date.parse(start)+hour*3_600_000).toISOString(),priceCtKwh:hour-12}))};
  const noon=Date.parse("2026-09-25T12:30:00.000Z");
  const chart=scalePriceHistory(data,data,noon);
  assert.equal(chart.intervals.at(-1)!.end,end);
  assert.equal(chart.path.split("M").length-1,1);
  assert.match(chart.path,/L870\.00,[\d.]+$/);
  assert.equal(spotPriceAt(data,Date.parse("2026-09-25T12:30:00.000Z"),noon),0);
  assert.equal(spotPriceAt(data,Date.parse("2026-09-25T13:00:00.000Z"),noon),1);
  assert.equal(spotPriceAt(data,Date.parse(end),noon),undefined);
});

test("volledige morgenkwartieren en DST dagen vullen precies het gepubliceerde venster",()=>{
  for(const hours of [23,24,25]){
    const start=hours===23?"2026-03-28T23:00:00.000Z":"2026-10-24T22:00:00.000Z";
    const end=new Date(Date.parse(start)+hours*3600000).toISOString();
    const data={...base,day:"tomorrow" as const,start,end,points:Array.from({length:hours*4},(_,i)=>({timestamp:new Date(Date.parse(start)+i*900000).toISOString(),priceCtKwh:i%3-1}))};
    const chart=scalePriceHistory(data,data,Date.parse(start)-86400000);
    assert.equal(chart.intervals.at(-1)!.end,end);
    assert.equal(chart.path.split("M").length-1,1);
    assert.match(chart.path,/L870\.00,[\d.]+$/);
    assert.equal(chart.points.length,0);assert.equal(chart.lowest,-1);assert.equal(chart.highest,1);
  }
});

test("bron-eindtijden worden gevalideerd en historische duur wint van cadence",()=>{
 const data={...base,day:"yesterday" as const,points:[{timestamp:"2026-08-28T00:00:00.000Z",priceCtKwh:0,end:"2026-08-28T03:00:00.000Z"},{timestamp:"2026-08-28T03:00:00.000Z",priceCtKwh:-1,end:"2026-08-28T04:00:00.000Z"},{timestamp:"2026-08-28T06:00:00.000Z",priceCtKwh:2,end:base.end}]};
 assert.deepEqual(parsePriceHistoryResponse({...data,points:data.points.map(p=>({...p,raw:"discard"}))}),data);
 const chart=scalePriceHistory(data);assert.equal(chart.path.split("M").length-1,2);assert.equal(chart.points.length,0);assert.ok(chart.intervals.every(p=>!p.inferred));assert.equal(chart.intervals[0]!.end,data.points[0]!.end);
 for(const end of [null,"bad",data.points[0]!.timestamp,"2026-08-30T00:00:00Z","2026-08-28T04:00:00Z"])assert.equal(parsePriceHistoryResponse({...data,points:[{...data.points[0],end},...data.points.slice(1)]}),undefined);
 assert.equal(parsePriceHistoryResponse({...data,points:[data.points[0],data.points[0]]}),undefined);
});
