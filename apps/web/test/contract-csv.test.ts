import assert from "node:assert/strict";
import test from "node:test";
import { contractCsvTotals,applyContractCsvTotals } from "../src/contract-csv.ts";
import type { CsvPreview } from "../src/csv-preview.ts";
import type { ContractMarketInput } from "../src/contract-market.ts";

const coverage={start:"2025-01-01T00:00:00.000Z",end:"2025-12-31T23:45:00.000Z",count:10};
const preview=(changes:Partial<Extract<CsvPreview,{status:"success"}>>={}):CsvPreview=>({status:"success",delimiter:";",validCount:40,skippedCount:0,period:{start:"2025-01-01T00:00:00.000Z",end:"2025-12-31T23:45:00.000Z"},importKwh:1500,exportKwh:300,measuredImportKwh:1500,estimatedImportKwh:0,measuredExportKwh:300,estimatedExportKwh:0,registerKwh:{importDay:1000,importNight:500,exportDay:200,exportNight:100},registerCoverage:{importDay:coverage,importNight:coverage,exportDay:coverage,exportNight:coverage},measuredCount:40,estimatedCount:0,noConsumptionCount:0,gapCount:0,duplicateCount:0,overlapCount:0,integrityReliable:true,reasons:{INVALID_DATE_TIME:0,INVALID_INTERVAL:0,INVALID_VALUE:0,INVALID_UNIT:0,INVALID_REGISTER:0,INVALID_STATUS:0},first:null,last:null,...changes});

test("aanvaardt uitsluitend een volledig jaar betrouwbare CSV en splitst registers",()=>{
  const totals=contractCsvTotals(preview());assert.deepEqual([totals?.annualDayKwh,totals?.annualNightKwh,totals?.annualInjectionDayKwh,totals?.annualInjectionNightKwh],[1000,500,200,100]);
  assert.equal(totals?.importKwh,1500);assert.equal(totals?.exportKwh,300);
});
test("weigert korte, geschatte, onvolledige en onbetrouwbare meetperioden",()=>{
  assert.equal(contractCsvTotals(preview({period:{start:"2025-01-01T00:00:00.000Z",end:"2025-06-30T23:45:00.000Z"}})),undefined);
  assert.equal(contractCsvTotals(preview({estimatedCount:1})),undefined);
  assert.equal(contractCsvTotals(preview({gapCount:1})),undefined);
  assert.equal(contractCsvTotals(preview({skippedCount:1})),undefined);
  assert.equal(contractCsvTotals(preview({integrityReliable:false})),undefined);
  assert.equal(contractCsvTotals(preview({registerCoverage:{importDay:coverage,importNight:null,exportDay:coverage,exportNight:coverage}})),undefined);
  assert.equal(contractCsvTotals(preview({registerCoverage:{...{importDay:coverage,importNight:coverage,exportDay:coverage,exportNight:coverage},importDay:{...coverage,start:"2025-01-02T00:00:00.000Z"}}})),undefined);
});
test("vult alleen de vier jaarvolumes en behoudt overige vergelijkingsinvoer",()=>{
  const initial:ContractMarketInput={postalCode:"1000",region:"Brussels",annualDayKwh:0,annualNightKwh:0,annualInjectionDayKwh:0,annualInjectionNightKwh:0,tariff:"f",householdSize:3,directDebit:true};
  assert.deepEqual(applyContractCsvTotals(initial,contractCsvTotals(preview())!),{...initial,annualDayKwh:1000,annualNightKwh:500,annualInjectionDayKwh:200,annualInjectionNightKwh:100});
});
