import assert from "node:assert/strict";import test from "node:test";import {compareLocalProfileContracts,type FlatContractDraft} from "../src/profile-contract-comparison.ts";
const profile={version:2 as const,savedAt:"2026-01-01T00:00:00Z",period:{start:"2025-01-01T00:00:00Z",end:"2025-12-31T22:00:00Z"},measuredImportKwh:1000,estimatedImportKwh:100,measuredExportKwh:200,estimatedExportKwh:20,measuredCount:4000,estimatedCount:400,noConsumptionCount:0,integrityReliable:true,gapCount:0,duplicateCount:0,overlapCount:0};
const current:FlatContractDraft={name:"Huidig",type:"fixed",validFrom:"2025-01-01",validUntil:"2025-12-31",importRateCtKwh:"30,0",exportRateCtKwh:"5"};
test("vergelijkt uitsluitend het bewaarde profiel met expliciete tarieven",()=>{const result=compareLocalProfileContracts(profile,current,{...current,name:"Kandidaat",type:"variable",importRateCtKwh:"25"});assert.equal(result?.winner,"candidate");assert.equal(result?.current.estimated.importKwh,100);});
test("geen profiel dynamic invalid of onvoldoende datadekking geeft geen resultaat",()=>{assert.equal(compareLocalProfileContracts(undefined,current,current),undefined);assert.equal(compareLocalProfileContracts(profile,{...current,type:"dynamic"},current),undefined);assert.equal(compareLocalProfileContracts(profile,{...current,importRateCtKwh:"abc"},current),undefined);assert.equal(compareLocalProfileContracts(profile,{...current,validFrom:"2025-01-02"},current),undefined);});

test("Belgische contractstart dekt lokale middernacht en einddatum accepteert geen volgend dagkwartier",()=>{
  const source={...profile,period:{start:"2025-03-24T23:00:00Z",end:"2025-03-25T22:45:00Z"}};
  const draft={...current,validFrom:"2025-03-25",validUntil:"2025-03-25"};
  assert.ok(compareLocalProfileContracts(source,draft,draft));
  assert.equal(compareLocalProfileContracts({...source,period:{...source.period,end:"2025-03-25T23:00:00Z"}},draft,draft),undefined);
  assert.equal(compareLocalProfileContracts({...source,period:{...source.period,end:"2025-03-25T23:15:00Z"}},draft,draft),undefined);
  assert.equal(compareLocalProfileContracts(source,{...draft,validFrom:"2025-02-31"},draft),undefined);
});
