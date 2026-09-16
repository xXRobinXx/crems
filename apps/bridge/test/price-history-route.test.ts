import assert from "node:assert/strict";
import test from "node:test";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handlePriceHistoryRequest } from "../src/price-history-route.ts";
import { PriceHistoryUpstreamError } from "../src/price-history-service.ts";
import { SimulatedP1Source } from "../src/meter-source.ts";

const request = (url: string, method = "GET") => ({ url, method, headers: { host: "localhost" } }) as IncomingMessage;
const response = () => { let done!: () => void; const finished = new Promise<void>(resolve => { done = resolve; }); const value = { status: 0, body: "", writeHead(status: number) { value.status = status; }, end(body: string) { value.body = body; done(); } }; return { value: value as unknown as ServerResponse & typeof value, finished }; };

test("route gebruikt één kloksnapshot en levert canoniek 25-uurs wintervenster", async () => {
  const res = response(); let clocks = 0; let loads = 0;
  handlePriceHistoryRequest(request("/api/history/price?day=yesterday"), res.value, new SimulatedP1Source(), async (_source, day, start, end) => { loads += 1; assert.equal(day, "yesterday"); assert.equal(Date.parse(end) - Date.parse(start), 25 * 3_600_000); return { day, start, end, quality: "measured", points: [] }; }, () => { clocks += 1; return new Date("2026-10-26T10:00:00+01:00"); });
  await res.finished; assert.equal(clocks, 1); assert.equal(loads, 1); assert.equal(res.value.status, 200); assert.deepEqual(Object.keys(JSON.parse(res.value.body)), ["day", "start", "end", "quality", "points"]);
});

test("weigert methode en ongeldige of dubbele query vóór loader", async () => {
  for (const [url, method, status] of [["/api/history/price?day=today", "POST", 405], ["/api/history/price", "GET", 400], ["/api/history/price?day=today&day=tomorrow", "GET", 400], ["/api/history/price?day=today&secret=x", "GET", 400]] as const) {
    const res = response(); let loads = 0; handlePriceHistoryRequest(request(url, method), res.value, new SimulatedP1Source(), async () => { loads += 1; throw new Error(); }); await res.finished;
    assert.equal(res.value.status, status); assert.equal(loads, 0); assert.equal(res.value.body.includes("secret"), false);
  }
});

test("upstreamdetails lekken niet in vaste foutresponse", async () => {
  const res = response(); handlePriceHistoryRequest(request("/api/history/price?day=tomorrow"), res.value, new SimulatedP1Source(), async () => { throw new PriceHistoryUpstreamError("token entity raw timestamp"); }, () => new Date("2026-08-28T12:00:00Z"));
  await res.finished; assert.equal(res.value.status, 502); assert.deepEqual(JSON.parse(res.value.body), { error: { code: "PRICE_UPSTREAM_ERROR", message: "Prijshistory kon niet worden opgehaald" } });
});

test("exact lokale Brusselse middernacht vraagt het nieuwe volledige dagvenster", async () => {
  const res = response(); let loads = 0;
  handlePriceHistoryRequest(request("/api/history/price?day=today"), res.value, new SimulatedP1Source(), async (_source, day, start, end) => { loads += 1; assert.equal(Date.parse(end) - Date.parse(start), 24 * 3_600_000); return { day, start, end, quality: "incomplete", points: [] }; }, () => new Date("2026-08-27T22:00:00.000Z"));
  await res.finished; assert.equal(res.value.status, 200); assert.equal(loads, 1); assert.equal(JSON.parse(res.value.body).quality, "incomplete");
});
