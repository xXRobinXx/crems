import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { ContractCatalogInputError, ContractCatalogUpstreamError, createContractCatalogClient, validateContractCompareInput } from "../src/contract-catalog.ts";
import { handleContractCatalogRequest } from "../src/contract-catalog-route.ts";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const config = { publicKey: "public-test", privateKey: "private-test", affiliateId: "affiliate-test" };
const valid = { postalCode: "1000", region: "Brussels", annualDayKwh: 1800, annualNightKwh: 1200, annualInjectionDayKwh: 200, annualInjectionNightKwh: 100, tariff: "i", householdSize: 2, directDebit: true };
const product = { product_id: "42", status: 1, texts: { name: "Groen contract" }, supplier: { name: "Energie BV" }, specifications: { tariff_type: { value: "Variabel tarief" } }, availability: { brussels: true }, contract_periods: ["12"], last_update: "2026-09-28 10:00:00" };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("signed compare uses documented consumer fields and hides affiliate from public result", async () => {
  let requestUrl!: URL;
  const client = createContractCatalogClient(config, async input => { requestUrl = new URL(String(input)); return response({ results: [{ ranking: 1, product, pricing: { yearly: { price: 900, promo_price: 850 } } }] }); }, () => 1_750_000_000_000, () => "unique-nonce");
  const result = await client.compare(valid);
  const expected = createHmac("sha1", "private-test1750000000unique-nonce").update("public-test").digest("hex");
  assert.equal(requestUrl.origin, "https://api.econtract.be"); assert.equal(requestUrl.pathname, "/compare.json");
  assert.equal(requestUrl.searchParams.get("zip"), "1000"); assert.equal(requestUrl.searchParams.get("du"), "1800"); assert.equal(requestUrl.searchParams.get("nu"), "1200"); assert.equal(requestUrl.searchParams.get("solar_injection_day"), "200"); assert.equal(requestUrl.searchParams.get("solar_injection_night"), "100"); assert.equal(requestUrl.searchParams.get("a"), "affiliate-test");
  assert.equal(requestUrl.searchParams.get("key"), "public-test"); assert.equal(requestUrl.searchParams.get("apikey"), expected); assert.equal(requestUrl.searchParams.get("nonce"), "unique-nonce");
  assert.deepEqual(result.comparison.products[0], { id: "42", name: "Groen contract", supplier: "Energie BV", annualPriceEur: 900, promoAnnualPriceEur: 850, lastUpdated: "2026-09-28 10:00:00", tariffType: "Variabel tarief", status: "active", contractMonths: ["12"], availability: { flanders: false, wallonia: false, brussels: true } }); assert.equal(JSON.stringify(result).includes("private-test"), false);
});

test("products request is restricted to fixed consumer electricity endpoint and region", async () => {
  let requestUrl!: URL;
  const client = createContractCatalogClient(config, async input => { requestUrl = new URL(String(input)); return response([product]); }, () => 1_750_000_000, () => "nonce");
  const result = await client.products("Brussels");
  assert.equal(result.source, "Aanbieders.be / e-Contract"); assert.deepEqual(result.products[0], { id: "42", name: "Groen contract", supplier: "Energie BV", lastUpdated: "2026-09-28 10:00:00", tariffType: "Variabel tarief", status: "active", contractMonths: ["12"], availability: { flanders: false, wallonia: false, brussels: true } });
  assert.equal(requestUrl.searchParams.get("cat"), "electricity"); assert.equal(requestUrl.searchParams.get("sg"), "consumer"); assert.equal(requestUrl.searchParams.get("key"), "public-test"); assert.equal(requestUrl.searchParams.get("detaillevel[3]"), "contract_periods");
});

test("input validation rejects unknown fields, malformed postcode and unrealistic volumes", () => {
  for (const invalid of [{ ...valid, token: "x" }, { ...valid, postalCode: "12345" }, { ...valid, postalCode: "0000" }, { ...valid, annualDayKwh: 100001 }, { ...valid, householdSize: 0 }, { ...valid, directDebit: "yes" }]) assert.throws(() => validateContractCompareInput(invalid), ContractCatalogInputError);
});

test("upstream failures, oversized responses and malformed payloads are sanitized", async () => {
  const upstreamFailure = createContractCatalogClient(config, async () => new Response("secret token", { status: 403 }));
  await assert.rejects(upstreamFailure.compare(valid), ContractCatalogUpstreamError);
  const oversized = createContractCatalogClient(config, async () => new Response("[]", { headers: { "Content-Length": "2000001" } }));
  await assert.rejects(oversized.products("Brussels"), ContractCatalogUpstreamError);
  const malformed = createContractCatalogClient(config, async () => response({ unexpected: [] }));
  await assert.rejects(malformed.compare(valid), ContractCatalogUpstreamError);
  const timeout = createContractCatalogClient(config, (_input, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("timed out")), { once: true })), Date.now, () => "nonce", 5);
  await assert.rejects(timeout.products("Brussels"), ContractCatalogUpstreamError);
});

const makeRequest = (url: string, method = "GET", body = "", peer = "local") => {
  const listeners: Record<string, (value?: Buffer) => void> = {};
  const req = { url, method, headers: { host: "localhost", "content-type": "application/json" }, socket: { remoteAddress: peer }, on(event: string, listener: (value?: Buffer) => void) { listeners[event] = listener; if (event === "end") queueMicrotask(() => { if (body) listeners.data?.(Buffer.from(body)); listener(); }); return req; }, destroy() { return req; } };
  return req as unknown as IncomingMessage;
};
const makeResponse = () => { let done!: () => void; const finished = new Promise<void>(resolve => { done = resolve; }); const headers: Record<string, string> = {}; const value = { status: 0, body: "", headersSent: false, destroyed: false, writeHead(status: number, values: Record<string, string> = {}) { value.status = status; value.headersSent = true; Object.assign(headers, values); }, getHeader(name: string) { return headers[name.toLowerCase()] ?? headers[name]; }, end(body: string) { value.body = body; done(); } }; return { value: value as unknown as ServerResponse & typeof value, finished }; };

test("HTTP route rejects bad input before upstream and returns fixed privacy-safe errors", async () => {
  let calls = 0;
  const invalid = makeResponse(); handleContractCatalogRequest(makeRequest("/api/contracts/compare", "POST", JSON.stringify({ ...valid, extra: "secret" })), invalid.value, () => { calls += 1; return createContractCatalogClient(config, async () => { throw Error("should not call upstream"); }); }); await invalid.finished;
  assert.equal(invalid.value.status, 400); assert.equal(calls, 0); assert.equal(invalid.value.body.includes("secret"), false);
  const unavailable = makeResponse(); handleContractCatalogRequest(makeRequest("/api/contracts/compare", "POST", JSON.stringify(valid)), unavailable.value, () => ({ compare: async () => { throw new ContractCatalogUpstreamError("private-key token"); }, products: async () => ({}) }) as never); await unavailable.finished;
  assert.equal(unavailable.value.status, 502); assert.equal(unavailable.value.body.includes("private-key"), false);
});

test("empty optional credentials produce a safe no-store 503 without provider requests", async () => {
  let upstreamCalls = 0;
  const emptyClient = () => createContractCatalogClient({ publicKey: "", privateKey: "", affiliateId: "" }, async () => { upstreamCalls += 1; throw new Error("must not be called"); });
  const compare = makeResponse();
  handleContractCatalogRequest(makeRequest("/api/contracts/compare", "POST", JSON.stringify(valid), `unconfigured-compare-${Date.now()}`), compare.value, emptyClient);
  await compare.finished;
  assert.equal(compare.value.status, 503);
  assert.deepEqual(JSON.parse(compare.value.body), { error: { code: "CONTRACTS_NOT_CONFIGURED", message: "De contract-API is nog niet geconfigureerd" } });
  assert.equal(compare.value.getHeader("Cache-Control"), "no-store");

  const products = makeResponse();
  handleContractCatalogRequest(makeRequest("/api/contracts/products?region=Brussels", "GET", "", `unconfigured-products-${Date.now()}`), products.value, emptyClient);
  await products.finished;
  assert.equal(products.value.status, 503);
  assert.equal(products.value.getHeader("Cache-Control"), "no-store");
  assert.equal(upstreamCalls, 0);
});

test("compare route limits each peer to six requests per minute", async () => {
  const peer = `rate-${Date.now()}-${Math.random()}`; const client = { compare: async () => ({ ok: true }), products: async () => ({}) } as never; const now = new Date("2026-09-28T10:00:00Z");
  for (let i = 0; i < 6; i += 1) { const res = makeResponse(); handleContractCatalogRequest(makeRequest("/api/contracts/compare", "POST", JSON.stringify(valid), peer), res.value, () => client, () => now); await res.finished; assert.equal(res.value.status, 200); }
  const limited = makeResponse(); handleContractCatalogRequest(makeRequest("/api/contracts/compare", "POST", JSON.stringify(valid), peer), limited.value, () => client, () => now); await limited.finished;
  assert.equal(limited.value.status, 429); assert.match(limited.value.body, /RATE_LIMITED/);
  const expired = makeResponse(); handleContractCatalogRequest(makeRequest("/api/contracts/compare", "POST", JSON.stringify(valid), peer), expired.value, () => client, () => new Date(now.getTime() + 60_001)); await expired.finished; assert.equal(expired.value.status, 200);
});

test("real HTTP route sends 413 and closes an oversized streaming body before upstream", async () => {
  let upstreamCalls = 0;
  const server = createServer((req, res) => { handleContractCatalogRequest(req, res, () => { upstreamCalls += 1; return { compare: async () => ({}) , products: async () => ({}) } as never; }); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); assert.ok(address && typeof address === "object");
  try {
    const oversizedBody = JSON.stringify(valid) + " ".repeat(9_000);
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(oversizedBody.slice(0, 4_000))); controller.enqueue(new TextEncoder().encode(oversizedBody.slice(4_000))); controller.close(); } });
    const result = await fetch(`http://127.0.0.1:${address.port}/api/contracts/compare`, { method: "POST", headers: { "Content-Type": "application/json" }, body, duplex: "half" } as RequestInit);
    assert.equal(result.status, 413); assert.deepEqual(await result.json(), { error: { code: "REQUEST_TOO_LARGE", message: "Invoer is te groot" } }); assert.equal(upstreamCalls, 0);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
