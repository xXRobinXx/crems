import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { handleLocalContractCatalogRequest } from "../src/local-contract-catalog.ts";
import { validateLocalContractCatalog } from "../../../packages/core/src/local-contract-catalog.ts";

test("public catalog GET needs no credentials, receives no usage, and has no storage or upstream side effects", async () => {
  const server = createServer((req, res) => {
    if (!handleLocalContractCatalogRequest(req, res)) { res.writeHead(404); res.end(); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw Error("No address");
  const url = `http://127.0.0.1:${address.port}/api/contracts/local`;
  try {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    const data = await response.json(); assert.equal(validateLocalContractCatalog(data), true);
    assert.equal(data.schemaVersion, 2);
    assert.equal(data.cards.length, 207);
    assert.equal(data.suppliers.length, 18);
    assert.ok(data.suppliers.some((s: {name:string;currentCards:number})=>s.name==='DATS 24'&&s.currentCards===0));
    assert.ok(data.cards.some((c: {supplier:string;publicationMonth:string})=>c.supplier==='Ecopower'&&c.publicationMonth==='2026-09'));
    assert.ok(data.cards.some((c: {region:string})=>c.region==='Brussels'));
    assert.ok(data.cards.some((c: {region:string})=>c.region==='Wallonia'));
    assert.ok(data.cards.every((c: {name:string})=>!c.name.includes(' pro ')));
    const card = data.cards[0];
    assert.equal(card.region, "Flanders"); assert.equal(card.publicationMonth, "2026-10");
    assert.equal(card.importDayCtKwh, 13.57); assert.equal(card.annualFeeEur, 75);
    assert.equal(card.injection.kind, "monthly-indexed"); assert.equal(card.injection.indicativeCtKwh, 3.27);
    assert.equal(card.sourceSha256, "efd74f20dade8597b4ee7eaff1244d72ac9915c59f0e6797cafdd6d65bca94ad");
    for (const method of ["POST", "PUT", "DELETE", "HEAD"]) assert.equal((await fetch(url, { method })).status, 405);
    assert.equal((await fetch(`${url}?postalCode=1000`)).status, 400);
    assert.equal((await fetch(`${url}/other`)).status, 404);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
