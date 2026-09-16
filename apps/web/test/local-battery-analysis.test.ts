import assert from "node:assert/strict";import test from "node:test";
import {BATTERY_ANALYSIS_KEY,BATTERY_REPORT_KEY,convertLegacyReport,getBrowserStorage,loadBatteryStorageState,removeBatteryStorage,saveBatteryReport,type LocalBatteryReport} from "../src/local-battery-analysis.ts";
import {compareBatteryCandidates} from "../src/battery-comparison.ts";
const assumptions={confirmed:true as const,contractName:"Contract",contractType:"fixed" as const,effectiveStart:"2025-01-01",effectiveEnd:"2026-01-02",quoteSource:"Offerte",quoteDate:"2026-01-02",warrantyYears:10,pricesIncludeVat:true as const,importRateCtKwh:30,exportRateCtKwh:4,lifeYears:15,annualDegradationPercent:2,discountRatePercent:3,investmentsEur:{3:3000,5:5000,7:7000,10:10000,13:13000}};
const technical=([3,5,7,10,13] as const).map(capacityKwh=>({capacityKwh,powerKw:capacityKwh/2,shiftedKwh:100,chargedFromExportKwh:120,endingStoredKwh:2,lossesKwh:18,equivalentCycles:20}));
const quality={period:{start:"2025-01-01T00:00:00Z",end:"2026-01-02T00:00:00Z"},integrityReliable:true,estimatedCount:0,gapCount:0,duplicateCount:0,overlapCount:0};
const computed=compareBatteryCandidates(quality,technical,assumptions);if(computed.status!=="financial")throw Error("invalid fixture");const results=computed.candidates;
const report:LocalBatteryReport={version:3,savedAt:"2026-09-07T10:00:00Z",quality,technical,financial:{assumptions,results,recommendedCapacityKwh:computed.recommendedCapacityKwh}};
const memory=()=>{const data=new Map<string,string>();return{data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>void data.set(k,v),removeItem:(k:string)=>void data.delete(k)}};
test("schrijft expliciet exact één allowlisted v3 en laadt structureel identiek",()=>{const s=memory();let writes=0;const storage={...s,setItem:(k:string,v:string)=>{writes++;s.setItem(k,v);}};assert.equal(saveBatteryReport(storage,report),true);assert.equal(writes,1);assert.deepEqual(loadBatteryStorageState(s),{status:"current",report});assert.doesNotMatch(s.data.get(BATTERY_REPORT_KEY)!,/csv|chunks|intervals|EAN|meter|file|token/i);});
test("weigert extra velden en houdt opslagfout veilig",()=>{assert.equal(saveBatteryReport({setItem(){throw Error("blocked");}},report),false);assert.equal(saveBatteryReport({setItem(){throw Error("must not write");}},{...report,token:"x"} as never),false);});
test("laadt veilige v2 als legacy zonder write of delete en converteert alleen expliciet",()=>{const s=memory();s.data.set(BATTERY_ANALYSIS_KEY,JSON.stringify({version:2,savedAt:"2026-01-01Z",period:report.quality.period,...report.quality,comparisons:technical}));const before=new Map(s.data);const state=loadBatteryStorageState(s);assert.equal(state.status,"legacy");assert.deepEqual(s.data,before);if(state.status==="legacy")assert.equal(saveBatteryReport(s,convertLegacyReport(state.report,"2026-09-07T10:00:00Z")),true);assert.ok(s.data.has(BATTERY_ANALYSIS_KEY));assert.ok(s.data.has(BATTERY_REPORT_KEY));});
test("corrupt v1 v2 en v3 onthouden exact hun sleutel tot expliciete verwijdering",()=>{for(const key of ["crems.battery-analysis.v1",BATTERY_ANALYSIS_KEY,BATTERY_REPORT_KEY]){const s=memory();s.data.set(key,"bad");assert.deepEqual(loadBatteryStorageState(s),{status:"corrupt",key});assert.ok(s.data.has(key));assert.equal(removeBatteryStorage(s,key),true);assert.deepEqual(loadBatteryStorageState(s),{status:"empty"});}});
test("accepteert technisch en financieel met of zonder prijsbron zonder undefined keys",()=>{for(const financial of [undefined,report.financial])for(const priceSource of [undefined,"Elexys"]){const base={...report};delete (base as any).financial;const candidate:any={...base};if(financial)candidate.financial=financial;if(priceSource)candidate.priceSource=priceSource;assert.equal(saveBatteryReport(memory(),candidate),true);assert.equal(Object.prototype.hasOwnProperty.call(candidate,"priceSource"),priceSource!==undefined);assert.equal(Object.prototype.hasOwnProperty.call(candidate,"financial"),financial!==undefined);}});
test("save en load weigeren kwaliteit grenzen dekking en iedere gemuteerde financiële uitkomst",()=>{const mutate=(change:(first:any)=>void)=>{const copy=structuredClone(report) as any;change(copy.financial.results[0]);return copy;};const invalid:any[]=[{...report,quality:{...report.quality,estimatedCount:1}},{...report,financial:{...report.financial!,assumptions:{...assumptions,lifeYears:31}}},{...report,financial:{...report.financial!,assumptions:{...assumptions,effectiveStart:"2025-01-02"}}},mutate(x=>x.annualEnergySavingEur+=1),mutate(x=>x.low.cashflowsEur[0]+=1),mutate(x=>x.base.npvEur+=1),mutate(x=>x.high.paybackYears=1),mutate(x=>x.low.annualFactor=1.2),mutate(x=>x.investmentEur+=1),{...report,financial:{...report.financial!,recommendedCapacityKwh:5}},{...report,technical:report.technical.map((x,i)=>i===0?{...x,chargedFromExportKwh:x.chargedFromExportKwh+1}:x)}];for(const candidate of invalid){assert.equal(saveBatteryReport({setItem(){throw Error("write forbidden");}},candidate),false);const s=memory();s.data.set(BATTERY_REPORT_KEY,JSON.stringify(candidate));assert.deepEqual(loadBatteryStorageState(s),{status:"corrupt",key:BATTERY_REPORT_KEY});assert.ok(s.data.has(BATTERY_REPORT_KEY));}});

test("onvolledige legacykwaliteit blijft onzeker en ongeldige metadata wordt geweigerd",()=>{
  for(const version of [1,2]){
    const key=`crems.battery-analysis.v${version}`;
    const old={version,period:quality.period,comparisons:technical,integrityReliable:true};
    const s=memory();s.data.set(key,JSON.stringify(old));const state=loadBatteryStorageState(s);
    assert.equal(state.status,"legacy");if(state.status!=="legacy")return;
    assert.equal(state.report.quality.integrityReliable,false);
    assert.equal(saveBatteryReport(s,convertLegacyReport(state.report,report.savedAt)),true);
    assert.equal(compareBatteryCandidates(state.report.quality,state.report.technical,assumptions).status,"ineligible");
    for(const extra of [{estimatedCount:.5},{gapCount:-1},{duplicateCount:null},{integrityReliable:"yes"},{priceSource:"x".repeat(101)}]){
      const bad=memory();bad.data.set(key,JSON.stringify({...old,...extra}));assert.deepEqual(loadBatteryStorageState(bad),{status:"corrupt",key});
    }
  }
});

test("opslaggetter, getItem en mislukte verwijdering behouden veilige state",()=>{
  assert.equal(getBrowserStorage({get localStorage(){throw Error("blocked");}}),undefined);
  assert.deepEqual(loadBatteryStorageState(undefined),{status:"unavailable"});
  assert.deepEqual(loadBatteryStorageState({getItem(){throw Error("blocked");}}),{status:"unavailable"});
  const s=memory();assert.equal(saveBatteryReport(s,report),true);
  assert.equal(removeBatteryStorage({...s,removeItem(){throw Error("blocked");}}),false);
  assert.deepEqual(loadBatteryStorageState(s),{status:"current",report});
});

test("legacy met volledige tellingen maar aangevuld energievolume blijft financieel geblokkeerd",()=>{
  const s=memory();s.data.set(BATTERY_ANALYSIS_KEY,JSON.stringify({version:2,...quality,comparisons:technical.map(({chargedFromExportKwh,...rest})=>rest)}));
  const state=loadBatteryStorageState(s);assert.equal(state.status,"legacy");if(state.status!=="legacy")return;
  assert.equal(state.report.quality.integrityReliable,false);assert.equal(compareBatteryCandidates(state.report.quality,state.report.technical,assumptions).status,"ineligible");
});
