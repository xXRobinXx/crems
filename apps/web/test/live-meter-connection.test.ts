import assert from "node:assert/strict";
import test from "node:test";
import { startMeterConnection, type MeterConnection } from "../src/live-meter-connection.ts";
import { parseLiveMeterEvent } from "../src/use-live-meter.ts";

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const harness = () => {
  let time = Date.parse("2026-10-13T18:00:00Z"), next = 0;
  const timers = new Map<number, { fn: () => void; at: number; repeat: number }>();
  const schedule = (fn: () => void, delay: number, repeat = 0) => { const id = ++next; timers.set(id, { fn, at: time + delay, repeat }); return id; };
  const states: MeterConnection[] = [], readings: any[] = [], requests: { url: string; signal: AbortSignal }[] = [];
  const stream = { onmessage: null as any, onerror: null as any, closed: false, close() { this.closed = true; } };
  const sample = (overrides = {}) => JSON.stringify({ timestamp: new Date(time).toISOString(), importPowerW: 100, exportPowerW: 0, importEnergyKwh: 10, exportEnergyKwh: 2, source: "home-assistant", quality: "measured", ...overrides });
  let response: () => Promise<{ ok: boolean; text(): Promise<string> }> = async () => ({ ok: true, text: async () => sample() });
  const stop = startMeterConnection({ stream: () => stream, fetch: (url, options) => { requests.push({ url, signal: options.signal }); return response(); },
    parse: parseLiveMeterEvent, reading: value => readings.push(value), connection: value => states.push(value), now: () => time,
    interval: ((fn: () => void, delay: number) => schedule(fn, delay, delay)) as any, clearInterval: ((id: number) => timers.delete(id)) as any,
    timeout: ((fn: () => void, delay: number) => schedule(fn, delay)) as any, clearTimeout: ((id: number) => timers.delete(id)) as any });
  const advance = async (ms: number) => {
    const end = time + ms;
    while (true) {
      const entries = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at);
      if (!entries.length) break;
      const [id, timer] = entries[0]!; time = timer.at;
      if (timer.repeat) timer.at += timer.repeat; else timers.delete(id);
      timer.fn(); await flush();
    }
    time = end; await flush();
  };
  return { states, readings, requests, stream, sample, stop, advance, timers, setResponse: (fn: typeof response) => { response = fn; } };
};

test("REST starts immediately and remains live when SSE cannot deliver messages", async () => {
  const h = harness(); assert.deepEqual(h.states, ["connecting"]); await flush();
  assert.equal(h.states.at(-1), "live"); assert.equal(h.readings[0].source, "home-assistant");
  await h.advance(15_000); assert.equal(h.states.at(-1), "live"); assert.equal(h.requests.length, 4);
  assert.ok(h.requests.every(r => r.url === "api/current")); h.stop(); assert.equal(h.timers.size, 0);
});

test("healthy SSE avoids polling; transport failure recovers with current reading", async () => {
  const h = harness(); await flush();
  for (let i = 0; i < 6; i++) { h.stream.onmessage({ data: h.sample() }); await h.advance(2_000); }
  assert.equal(h.requests.length, 1);
  h.stream.onerror(); assert.equal(h.states.at(-1), "reconnecting"); await flush();
  assert.equal(h.states.at(-1), "live"); assert.equal(h.requests.length, 2); h.stop();
});

test("silent stream triggers fallback and invalid or stale values never restore live", async () => {
  const h = harness(); await flush(); h.stream.onmessage({ data: h.sample() });
  h.setResponse(async () => ({ ok: true, text: async () => h.sample({ timestamp: "2020-01-01T00:00:00Z" }) }));
  await h.advance(11_000); assert.notEqual(h.states.at(-1), "live");
  const before = h.readings.length;
  h.stream.onmessage({ data: "{broken" }); h.stream.onmessage({ data: h.sample({ importPowerW: "100" }) });
  h.stream.onmessage({ data: h.sample({ timestamp: "2030-01-01T00:00:00Z" }) });
  assert.equal(h.readings.length, before);
  h.setResponse(async () => ({ ok: true, text: async () => h.sample() }));
  await h.advance(5_000); assert.equal(h.states.at(-1), "live"); h.stop();
});

test("failed current endpoint remains disconnected and retries without throwing", async () => {
  const h = harness(); await flush(); h.setResponse(async () => { throw Error("network"); });
  h.stream.onerror(); await flush(); await h.advance(16_000); assert.notEqual(h.states.at(-1), "live");
  h.setResponse(async () => ({ ok: false, text: async () => h.sample() }));
  await h.advance(5_000); assert.notEqual(h.states.at(-1), "live"); h.stop();
});

test("slow requests never overlap, abort on deadline and late responses cannot overwrite newer SSE", async () => {
  const h = harness(); await flush(); let resolve: any;
  h.setResponse(() => new Promise(r => { resolve = r; })); h.stream.onerror();
  const pending = h.requests.at(-1)!; await h.advance(10_000);
  assert.equal(pending.signal.aborted, true); assert.equal(h.requests.length, 2);
  h.stream.onmessage({ data: h.sample({ importPowerW: 999 }) }); await flush();
  resolve({ ok: true, text: async () => h.sample({ importPowerW: 111 }) }); await flush();
  assert.equal(h.readings.at(-1).importPowerW, 999);
  h.stream.onerror(); const newest = h.requests.at(-1)!; h.stop();
  assert.equal(newest.signal.aborted, true); assert.equal(h.stream.closed, true); assert.equal(h.timers.size, 0);
  const count = h.readings.length; resolve({ ok: true, text: async () => h.sample() }); await flush();
  h.stream.onmessage({ data: h.sample() }); await h.advance(20_000); assert.equal(h.readings.length, count);
});

test("duplicate old timestamps expire even if repeatedly received", async () => {
  const h = harness(); await flush(); const old = h.sample();
  h.setResponse(async () => ({ ok: true, text: async () => old }));
  for (let i = 0; i < 6; i++) { h.stream.onmessage({ data: old }); await h.advance(2_000); }
  assert.notEqual(h.states.at(-1), "live"); h.stop();
});
