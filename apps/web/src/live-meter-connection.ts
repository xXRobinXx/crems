import type { LiveMeterReading } from "@crems/core";

export type MeterConnection = "connecting" | "live" | "reconnecting" | "offline";
type Stream = Pick<EventSource, "onmessage" | "onerror" | "close">;
type Options = {
  stream: () => Stream;
  fetch: (url: string, options: { signal: AbortSignal }) => Promise<{ ok: boolean; text(): Promise<string> }>;
  parse: (data: string) => LiveMeterReading | undefined;
  reading: (value: LiveMeterReading) => void;
  connection: (value: MeterConnection) => void;
  now?: () => number;
  interval?: typeof setInterval;
  clearInterval?: typeof clearInterval;
  timeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
};

export const startMeterConnection = (options: Options) => {
  const now = options.now ?? Date.now;
  const timeout = options.timeout ?? setTimeout;
  const clearTimeoutFn = options.clearTimeout ?? clearTimeout;
  const started = now();
  let stopped = false, streamHealthy = false;
  let lastAccepted: number | undefined, lastTimestamp = -Infinity, lastPoll = -Infinity;
  let pending: AbortController | undefined;
  let pendingDeadline: ReturnType<typeof setTimeout> | undefined;
  let state: MeterConnection = "connecting";
  const setState = (next: MeterConnection) => { if (!stopped && next !== state) { state = next; options.connection(next); } };
  options.connection(state);
  const accept = (data: string) => {
    const value = options.parse(data);
    if (!value || stopped) return false;
    const timestamp = Date.parse(value.timestamp), age = now() - timestamp;
    if (age > 10_000 || age < -30_000 || timestamp < lastTimestamp) return false;
    lastTimestamp = timestamp; lastAccepted = now();
    options.reading(value); setState("live");
    return true;
  };
  const poll = async () => {
    if (stopped || pending) return;
    lastPoll = now();
    const request = new AbortController(); pending = request;
    const deadline = timeout(() => request.abort(), 4_000);
    pendingDeadline = deadline;
    try {
      const response = await options.fetch("api/current", { signal: request.signal });
      const text = response.ok ? await response.text() : "";
      if (stopped || request.signal.aborted) return;
      if (!accept(text) && (lastAccepted === undefined || now() - lastTimestamp > 10_000)) setState(now() - started < 10_000 ? "connecting" : "offline");
    } catch {
      if (!stopped && (lastAccepted === undefined || now() - lastTimestamp > 10_000)) setState(now() - started < 10_000 ? "connecting" : "offline");
    } finally { clearTimeoutFn(deadline); if (pending === request) { pending = undefined; pendingDeadline = undefined; } }
  };
  let events: Stream | undefined;
  try {
    events = options.stream();
    events.onmessage = (event) => { if (accept(event.data)) streamHealthy = true; };
    events.onerror = () => { if (stopped) return; streamHealthy = false; setState(lastAccepted === undefined ? "connecting" : "reconnecting"); void poll(); };
  } catch { streamHealthy = false; }
  void poll();
  const timer = (options.interval ?? setInterval)(() => {
    if (stopped) return;
    if (lastAccepted === undefined || now() - lastTimestamp > 10_000 || now() - lastAccepted > 10_000) {
      streamHealthy = false;
      if (now() - started >= 10_000) setState(lastAccepted === undefined ? "offline" : "reconnecting");
    }
    if (!streamHealthy && now() - lastPoll >= 5_000) void poll();
  }, 1_000);
  return () => { stopped = true; events?.close(); pending?.abort(); if (pendingDeadline !== undefined) clearTimeoutFn(pendingDeadline); (options.clearInterval ?? clearInterval)(timer); };
};
