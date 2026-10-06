import assert from "node:assert/strict";
import test from "node:test";
import { estimateLocalContract, localCardStatus, validateLocalContractCatalog, type LocalContractCard } from "../src/local-contract-catalog.ts";

const card: LocalContractCard = {
  id: "synthetic-fixed", supplier: "Synthetic", name: "Synthetic card", region: "Flanders", tariff: "fixed", contractMonths: 36,
  publicationMonth: "2026-10", checkedOn: "2026-10-04", sourceUrl: "https://example.com/card.pdf", sourceSha256: "a".repeat(64),
  vatPercent: 6, annualFeeEur: 75, importDayCtKwh: 13.57, importNightCtKwh: 13.57,
  injection: { kind: "monthly-indexed", indicativeCtKwh: 3.27, minimumCtKwh: 1, formula: "Synthetic monthly index" },
};
const now = new Date("2026-10-04T12:00:00Z");
const archived:LocalContractCard={...card,id:'synthetic-archive',verification:'community-extracted',archiveUrl:'https://github.com/example/archive/blob/'+ 'a'.repeat(40)+'/card.json',conditions:'Synthetic conditions',formula:'Synthetic monthly formula',contractMonths:0,importSingleCtKwh:13.57,priceBasis:'fixed',injection:{kind:'unavailable',indicativeCtKwh:null,minimumCtKwh:null,formula:'No injection data'}};
const volumes = { annualDayKwh: 1000, annualNightKwh: 2500, annualInjectionDayKwh: 100, annualInjectionNightKwh: 50 };

test("fixed import plus fee is reproducible without turning an indicative injection price into annual credit", () => {
  const result = estimateLocalContract(card, "Flanders", volumes, now)!;
  assert.equal(result.importEnergyEur, 474.95);
  assert.equal(result.importAndFeeEur, 549.95);
  assert.equal(result.injectionCreditEur, null);
  assert.equal(estimateLocalContract(card, "Flanders", { ...volumes, annualInjectionDayKwh: 0, annualInjectionNightKwh: 0 }, now)!.injectionCreditEur, 0);
});

test("offer month uses Brussels calendar boundaries, not a 36-month contract lifetime", () => {
  assert.equal(localCardStatus(card, new Date("2026-09-30T21:59:59Z")), "future");
  assert.equal(localCardStatus(card, new Date("2026-09-30T22:00:00Z")), "current");
  assert.equal(localCardStatus(card, new Date("2026-10-31T23:00:00Z")), "expired");
  assert.equal(estimateLocalContract(card, "Flanders", volumes, new Date("2026-11-01T12:00:00Z")), undefined);
  assert.equal(estimateLocalContract(card, "Flanders", volumes, new Date("2026-09-01T12:00:00Z")), undefined);
});

test("missing, invalid or unsupported regional volumes never produce a zero-price comparison", () => {
  assert.equal(estimateLocalContract(card, "Brussels", volumes, now), undefined);
  for (const value of [Number.NaN, Infinity, -1, 100_001, undefined]) {
    assert.equal(estimateLocalContract(card, "Flanders", { ...volumes, annualNightKwh: value as number }, now), undefined);
  }
  assert.equal(estimateLocalContract(card, "Flanders", { ...volumes, annualDayKwh: 0, annualNightKwh: 0 }, now), undefined);
});

test("catalog validates provenance, units, dates, required prices, duplicates and bounds", () => {
  assert.equal(validateLocalContractCatalog({ schemaVersion: 1, cards: [card] }), true);
  for (const mutation of [
    { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "https://user:secret@example.com/card" }, { sourceSha256: "missing" },
    { publicationMonth: "2026-13" }, { checkedOn: "2026-02-30" }, { importDayCtKwh: undefined },
    { annualFeeEur: Number.NaN }, { tariff: "dynamic" }, { injection: null }, { contractMonths: 1.5 },
  ]) assert.equal(validateLocalContractCatalog({ schemaVersion: 1, cards: [{ ...card, ...mutation }] }), false);
  assert.equal(validateLocalContractCatalog({ schemaVersion: 1, cards: [card, card] }), false);
  assert.equal(validateLocalContractCatalog({ schemaVersion: 1, cards: Array(51).fill(card) }), false);
  assert.equal(validateLocalContractCatalog({ schemaVersion: 2, cards: [] }), false);
});

test('variable figures are labelled scenarios; dynamic, time-slot, missing price and unknown VAT never yield an annual price',()=>{
 const variable={...archived,tariff:'variable' as const,priceBasis:'published-variable' as const};
 assert.equal(estimateLocalContract(variable,'Flanders',volumes,now)?.priceBasis,'published-variable-scenario');
 assert.equal(estimateLocalContract(variable,'Flanders',volumes,now)?.importAndFeeEur,549.95);
 for(const tariff of ['dynamic','tou','spot_monthly'] as const)assert.equal(estimateLocalContract({...archived,tariff,priceBasis:'interval-required',importDayCtKwh:null,importNightCtKwh:null},'Flanders',volumes,now),undefined);
 assert.equal(estimateLocalContract({...archived,vatPercent:null},'Flanders',volumes,now),undefined);
 assert.equal(estimateLocalContract({...archived,importDayCtKwh:null},'Flanders',volumes,now),undefined);
});

test('expanded catalog requires unique and consistent supplier coverage with pinned provenance',()=>{
 const catalog={schemaVersion:2,cards:[archived],suppliers:[{id:'synthetic',name:'Synthetic',currentCards:1,note:'Synthetic coverage'}],publicationMonth:'2026-10',archiveRevision:'a'.repeat(40)};
 assert.equal(validateLocalContractCatalog(catalog),true);
 for(const mutation of [{archiveRevision:'main'},{suppliers:[]},{suppliers:[{...catalog.suppliers[0],currentCards:0}]},{suppliers:[...catalog.suppliers,...catalog.suppliers]},{schemaVersion:'2'}])assert.equal(validateLocalContractCatalog({...catalog,...mutation}),false);
 assert.equal(validateLocalContractCatalog({...catalog,cards:[{...archived,tariff:'dynamic'}]}),false);
});
