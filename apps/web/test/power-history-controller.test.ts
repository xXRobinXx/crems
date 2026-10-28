import assert from "node:assert/strict";
import test from "node:test";
import { createPowerHistoryController } from "../src/power-history-controller.ts";
import type { PowerHistoryState } from "../src/power-history.ts";
import { loadPowerHistory } from "../src/power-history.ts";
import { selectBrusselsDayWindow } from "../src/day-window.ts";

const body = (start: string, end: string) => ({ start, end, quality: "measured", import: { points: [] }, export: { points: [] } });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const recoverySetup = () => {
  let now = "2026-10-14T21:59:30Z";
  const states: PowerHistoryState[] = [];
  const intervals = new Map<number, () => void>();
  const deadlines = new Map<number, () => void>();
  let id = 0;
  const requests: Array<{ window: { start: string; end: string }; signal: AbortSignal; resolve: () => void; reject: () => void }> = [];
  const controller = createPowerHistoryController(state => states.push(state), {
    now: () => new Date(now), request: fetch, selectWindow: selectBrusselsDayWindow,
    setInterval: (fn, ms) => { assert.equal(ms, 30_000); intervals.set(++id, fn); return id as never; },
    clearInterval: timer => { intervals.delete(timer as unknown as number); },
    setTimeout: (fn, ms) => { assert.equal(ms, 10_000); deadlines.set(++id, fn); return id as never; },
    clearTimeout: timer => { deadlines.delete(timer as unknown as number); },
    load: (window, signal) => new Promise((resolve, reject) => requests.push({ window, signal,
      resolve: () => resolve({ ...window, quality: "measured", import: [], export: [] }),
      reject: () => reject(new Error("temporary")),
    })),
  });
  return { controller, states, requests, intervals, deadlines, setNow: (value: string) => { now = value; },
    tick: () => { for (const fn of [...intervals.values()]) fn(); },
    expire: () => { for (const [key, fn] of [...deadlines]) { deadlines.delete(key); fn(); } },
  };
};

test("reeds ingeplande refreshcallback blijft stil na dispose of selectiewissel", async () => {
  for (const dispose of [true, false]) {
    const s = recoverySetup(); s.controller.update(true, "today");
    const queued = [...s.intervals.values()][0];
    if (dispose) s.controller.dispose(); else s.controller.update(true, "tomorrow");
    const count = s.states.length;
    queued();
    assert.equal(s.requests.length, 1);
    assert.equal(s.deadlines.size, 0);
    assert.equal(s.states.length, count);
    s.requests[0].resolve(); await flush(); s.controller.dispose();
  }
});

test("gisteren herstelt na fout en stopt retries na succes", async () => {
  const s = recoverySetup(); s.controller.update(true, "yesterday");
  s.requests[0].reject(); await flush(); assert.equal(s.states.at(-1)?.status, "error");
  s.tick(); assert.equal(s.requests.length, 2); s.requests[1].resolve(); await flush();
  assert.equal(s.states.at(-1)?.status, "success"); assert.equal(s.intervals.size, 0); assert.equal(s.deadlines.size, 0);
  s.tick(); assert.equal(s.requests.length, 2); s.controller.dispose();
});

test("gisteren stopt na maximaal drie automatische retries", async () => {
  const s = recoverySetup(); s.controller.update(true, "yesterday");
  for (let i = 0; i < 4; i++) { s.requests[i].reject(); await flush(); s.tick(); }
  assert.equal(s.requests.length, 4); assert.equal(s.intervals.size, 0); assert.equal(s.deadlines.size, 0);
  s.controller.dispose();
});

test("expliciete retry herlaadt dezelfde dag en reset uitgeput automatisch budget", async () => {
  const s = recoverySetup(); s.controller.update(true, "yesterday");
  for (let i = 0; i < 4; i++) { s.requests[i].reject(); await flush(); s.tick(); }
  s.controller.update(true, "yesterday", true);
  assert.equal(s.requests.length, 5); assert.equal(s.states.at(-1)?.status, "loading");
  s.requests[4].reject(); await flush(); s.tick(); assert.equal(s.requests.length, 6);
  s.requests[5].resolve(); await flush(); assert.equal(s.states.at(-1)?.status, "success");
  assert.equal(s.intervals.size, 0); assert.equal(s.deadlines.size, 0); s.controller.dispose();
});

test("deadline abort hangende request; late succes genegeerd en cleanup stopt herstel", async () => {
  const s = recoverySetup(); s.controller.update(true, "yesterday");
  s.expire(); assert.equal(s.requests[0].signal.aborted, true); assert.equal(s.states.at(-1)?.status, "error");
  s.tick(); assert.equal(s.requests.length, 2); s.requests[0].resolve(); await flush();
  assert.equal(s.states.at(-1)?.status, "loading"); assert.equal(s.deadlines.size, 1);
  s.controller.dispose(); assert.equal(s.requests[1].signal.aborted, true);
  assert.equal(s.intervals.size, 0); assert.equal(s.deadlines.size, 0);
  const count = s.states.length; s.requests[1].reject(); await flush(); assert.equal(s.states.length, count);
});

test("refreshfout behoudt dezelfde dag maar wist data na Brussels middernacht", async () => {
  const s = recoverySetup(); s.controller.update(true, "today"); s.requests[0].resolve(); await flush();
  s.tick(); s.requests[1].reject(); await flush();
  assert.equal(s.states.at(-1)?.status, "success");
  assert.equal((s.states.at(-1) as { refreshError?: boolean }).refreshError, true);
  s.setNow("2026-10-14T22:01:00Z"); s.tick(); assert.equal(s.states.at(-1)?.status, "loading");
  s.requests[2].reject(); await flush(); assert.equal(s.states.at(-1)?.status, "error"); s.controller.dispose();
});

test("succes uit vorige dag dat na middernacht aankomt wordt verworpen", async () => {
  const s = recoverySetup(); s.controller.update(true, "today"); s.setNow("2026-10-14T22:01:00Z");
  s.requests[0].resolve(); await flush(); assert.equal(s.states.at(-1)?.status, "loading");
  s.tick(); assert.equal(s.requests[1].window.start, "2026-10-14T22:00:00.000Z");
  s.requests[1].resolve(); await flush(); assert.equal(s.states.at(-1)?.status, "success"); s.controller.dispose();
});

test("gisteren herlaadt het juiste venster als succes middernacht kruist", async () => {
  const s = recoverySetup(); s.controller.update(true, "yesterday");
  s.setNow("2026-10-14T22:01:00Z"); s.requests[0].resolve(); await flush();
  assert.equal(s.requests.length, 2);
  assert.equal(s.requests[1].window.start, "2026-10-13T22:00:00.000Z");
  s.requests[1].resolve(); await flush();
  assert.equal(s.states.at(-1)?.status, "success");
  assert.equal(s.intervals.size, 0); assert.equal(s.deadlines.size, 0); s.controller.dispose();
});
const setup = (now = "2026-08-28T10:00:00.000Z") => {
  const states: PowerHistoryState[] = [];
  const calls: Array<{ url: string; signal: AbortSignal }> = [];
  const timers: Array<() => void> = [];
  const deadlines = new Map<number, () => void>();
  let timerId = 0;
  let resolveRequest: ((response: Response) => void) | undefined;
  let rejectRequest: ((error: Error) => void) | undefined;
  const request = ((url: string, init?: RequestInit) => {
    calls.push({ url, signal: init!.signal as AbortSignal });
    return new Promise<Response>((resolve, reject) => { resolveRequest = resolve; rejectRequest = reject; });
  }) as typeof fetch;
  const controller = createPowerHistoryController(state => states.push(state), {
    now: () => new Date(now), request,
    setInterval: callback => { timers.push(callback); return 1 as never; },
    clearInterval: () => undefined,
    setTimeout: (callback, milliseconds) => { assert.equal(milliseconds, 10_000); deadlines.set(++timerId, callback); return timerId as never; },
    clearTimeout: id => { deadlines.delete(id as unknown as number); },
    selectWindow: selectBrusselsDayWindow,
    load: loadPowerHistory,
  });
  return { states, calls, timers, controller, resolve: () => resolveRequest!(new Response(JSON.stringify(body(new URL(calls.at(-1)!.url, "http://x").searchParams.get("start")!, new URL(calls.at(-1)!.url, "http://x").searchParams.get("end")!)), { status: 200, headers: { "content-type": "application/json" } })), reject: () => rejectRequest!(new Error("no")) };
};

test("gisteren vraagt exact eenmaal; morgen wist data en vraagt niets", async () => {
  const s = setup(); s.controller.update(true, "yesterday"); assert.equal(s.calls.length, 1);
  s.resolve(); await flush(); assert.equal(s.states.at(-1)?.status, "success");
  s.controller.update(true, "tomorrow");
  assert.equal(s.calls.length, 1); assert.equal(s.states.at(-1)?.status, "future"); assert.equal(s.calls[0].signal.aborted, true);
});

test("exact middernacht is empty zonder request", () => {
  const s = setup("2026-08-27T22:00:00.000Z"); s.controller.update(true, "today");
  assert.equal(s.calls.length, 0); assert.equal(s.states.at(-1)?.status, "empty");
});

test("vandaag refresh overlapt niet met een lopende aanvraag", async () => {
  const s = setup(); s.controller.update(true, "today");
  assert.equal(s.timers.length, 1); assert.equal(s.calls.length, 1); s.timers[0](); assert.equal(s.calls.length, 1);
  s.resolve(); await flush(); s.timers[0](); assert.equal(s.calls.length, 2);
  s.controller.update(true, "yesterday"); assert.equal(s.timers.length, 1); assert.equal(s.calls.length, 3);
});

test("selectiewissel abort oude request en negeert stale resolve en reject", async () => {
  const s = setup(); s.controller.update(true, "today"); const old = s.calls[0]; const staleResolve = s.resolve;
  s.controller.update(true, "tomorrow"); assert.equal(old.signal.aborted, true); staleResolve(); await flush(); assert.equal(s.states.at(-1)?.status, "future");
  const r = setup(); r.controller.update(true, "today"); const staleReject = r.reject; r.controller.update(true, "tomorrow"); staleReject(); await flush(); assert.equal(r.states.at(-1)?.status, "future");
});

test("na effect-opruiming herstart dezelfde dag onder React StrictMode", async () => {
  const s = setup();
  s.controller.update(true, "today");
  const first = s.calls[0]!;
  s.controller.dispose();
  assert.equal(first.signal.aborted, true);
  s.controller.update(true, "today");
  assert.equal(s.calls.length, 2);
  s.resolve();
  await flush();
  assert.equal(s.states.at(-1)?.status, "success");
});
