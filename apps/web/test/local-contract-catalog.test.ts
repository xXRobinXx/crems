import assert from "node:assert/strict";
import test from "node:test";
import { loadLocalContractCatalog } from "../src/local-contract-catalog.ts";

test("catalog loader sends only a relative GET, no postcode, usage, body or provider request", async () => {
  const controller = new AbortController(); let calls = 0;
  const catalog = await loadLocalContractCatalog(controller.signal, async (url, init) => {
    calls++; assert.equal(url, "api/contracts/local"); assert.equal(init?.method, "GET");
    assert.equal(init?.body, undefined); assert.equal(init?.signal, controller.signal);
    assert.deepEqual(init?.headers, { Accept: "application/json" });
    return new Response(JSON.stringify({ schemaVersion: 1, cards: [] }));
  });
  assert.equal(calls, 1); assert.equal(catalog.cards.length, 0);
  assert.equal(new URL("api/contracts/local", "https://ha.example/api/hassio_ingress/session/").pathname, "/api/hassio_ingress/session/api/contracts/local");
});

test("unavailable, malformed or excessive local catalog gets a safe error rather than invented offers", async () => {
  for (const response of [new Response("upstream secret", { status: 503 }), new Response("bad json"), new Response('{"schemaVersion":1,"cards":[{}]}'), new Response("x".repeat(1_000_001))]) {
    await assert.rejects(loadLocalContractCatalog(undefined, async () => response), /lokale tariefkaarten/);
  }
});

test("transport en afgebroken response verbergen technische foutdetails; abort blijft herkenbaar",async()=>{
  const failure=new TypeError("Failed to fetch sensitive upstream detail");
  await assert.rejects(loadLocalContractCatalog(undefined,async()=>{throw failure;}),error=>error instanceof Error&&error.message==="De lokale tariefkaarten konden niet worden geladen. Controleer je verbinding en probeer opnieuw.");
  const response=new Response("unused");response.text=async()=>{throw failure;};
  await assert.rejects(loadLocalContractCatalog(undefined,async()=>response),/Controleer je verbinding/);
  const controller=new AbortController();controller.abort();const aborted=new DOMException("aborted","AbortError");
  await assert.rejects(loadLocalContractCatalog(controller.signal,async()=>{throw aborted;}),error=>error===aborted);
});
