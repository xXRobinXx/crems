import assert from "node:assert/strict";
import test from "node:test";
import { createPowerHistoryController } from "../src/power-history-controller.ts";
import type { PowerHistoryState } from "../src/power-history.ts";
import { loadPowerHistory } from "../src/power-history.ts";
import { selectBrusselsDayWindow } from "../src/day-window.ts";

const body = (start: string, end: string) => ({ start, end, quality: "measured", import: { points: [] }, export: { points: [] } });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const setup = (now = "2026-08-28T10:00:00.000Z") => {
  const states: PowerHistoryState[] = [];
  const calls: Array<{ url: string; signal: AbortSignal }> = [];
  const timers: Array<() => void> = [];
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

test("alleen vandaag plant en gebruikt de geïnjecteerde 30s refresh", () => {
  const s = setup(); s.controller.update(true, "today");
  assert.equal(s.timers.length, 1); assert.equal(s.calls.length, 1); s.timers[0](); assert.equal(s.calls.length, 2);
  s.controller.update(true, "yesterday"); assert.equal(s.timers.length, 1); assert.equal(s.calls.length, 3);
});

test("selectiewissel abort oude request en negeert stale resolve en reject", async () => {
  const s = setup(); s.controller.update(true, "today"); const old = s.calls[0]; const staleResolve = s.resolve;
  s.controller.update(true, "tomorrow"); assert.equal(old.signal.aborted, true); staleResolve(); await flush(); assert.equal(s.states.at(-1)?.status, "future");
  const r = setup(); r.controller.update(true, "today"); const staleReject = r.reject; r.controller.update(true, "tomorrow"); staleReject(); await flush(); assert.equal(r.states.at(-1)?.status, "future");
});
