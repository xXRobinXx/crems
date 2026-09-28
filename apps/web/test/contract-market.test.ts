import assert from "node:assert/strict";
import test from "node:test";
import { createContractMarketClient, isValidContractMarketInput, regionForPostalCode, validateContractMarketResult, type ContractMarketInput } from "../src/contract-market.ts";

const input: ContractMarketInput = { postalCode: "1000", region: "Brussels", annualDayKwh: 1000, annualNightKwh: 800, annualInjectionDayKwh: 120, annualInjectionNightKwh: 80, tariff: "f", householdSize: 2, directDebit: false };

test("market client only sends the explicit compare request and handles sanitized errors", async () => {
  let calls = 0; let body = ""; let url = "";
  const client = createContractMarketClient(async (inputUrl, init) => { calls += 1; url = String(inputUrl); body = String(init?.body); return new Response(JSON.stringify({ source: "Aanbieders.be / e-Contract", retrievedAt: "2026-09-28T10:00:00.000Z", region: "Brussels", comparison: { products: [] } })); });
  assert.equal(calls, 0);
  const result = await client.compare(input);
  assert.equal(calls, 1); assert.equal(url, "api/contracts/compare"); assert.deepEqual(JSON.parse(body), input); assert.equal(result.comparison.products.length, 0);
  const failing = createContractMarketClient(async () => new Response(JSON.stringify({ error: { code: "CONTRACTS_NOT_CONFIGURED", message: "secret" } }), { status: 503 }));
  await assert.rejects(failing.compare(input), /nog niet geconfigureerd/);
});

test("postcode determines region and invalid volumes cannot be submitted", () => {
  assert.equal(regionForPostalCode("1000"), "Brussels"); assert.equal(regionForPostalCode("1300"), "Wallonia"); assert.equal(regionForPostalCode("9000"), "Flanders"); assert.equal(regionForPostalCode("12"), undefined); assert.equal(regionForPostalCode("0000"), undefined); assert.equal(regionForPostalCode("9999"), undefined);
  assert.equal(isValidContractMarketInput(input), true);
  assert.equal(isValidContractMarketInput({ ...input, annualDayKwh: -1 }), false);
  assert.equal(isValidContractMarketInput({ ...input, annualNightKwh: 100001 }), false);
  assert.equal(isValidContractMarketInput({ ...input, annualInjectionDayKwh: -1 }), false);
  assert.equal(isValidContractMarketInput({ ...input, region: "Flanders" }), false);
  assert.equal(isValidContractMarketInput({ ...input, householdSize: 1.5 }), false);
});

test("market result validation rejects malformed offers before the view renders them", async () => {
  const client = createContractMarketClient(async () => new Response(JSON.stringify({ source: "x", retrievedAt: "2026-09-28T10:00:00Z", region: "Brussels", comparison: { products: [{}] } })));
  assert.equal(validateContractMarketResult({ source: "x", retrievedAt: "2026-09-28T10:00:00Z", region: "Brussels", comparison: { products: [{}] } }), false);
  await assert.rejects(client.compare(input), /gegevens zijn ongeldig/);
});

test("relative bridge URL retains a nested Home Assistant Ingress base", () => {
  const base = "http://ha.local/api/hassio_ingress/session/";
  assert.equal(new URL("api/contracts/compare", base).pathname, "/api/hassio_ingress/session/api/contracts/compare");
});
