import assert from "node:assert/strict";
import test from "node:test";
import {createBatterySimulator,type BatteryFlowInterval} from "@crems/core/battery-simulation";
import {BATTERY_CAPACITIES} from "../src/battery-comparison.ts";
import {createBatteryDailyCollector,batteryDayWindow,expectedBatteryIntervals,selectBatteryDay,validateBatteryDays} from "../src/battery-daily-report.ts";
import {saveBatteryReport,loadBatteryStorageState,BATTERY_REPORT_KEY} from "../src/local-battery-analysis.ts";

const build=(flows:BatteryFlowInterval[],day?:string)=>{
  const collector=createBatteryDailyCollector(day);
  const technical=BATTERY_CAPACITIES.map(capacityKwh=>{const sim=createBatterySimulator({capacityKwh,maxPowerKw:capacityKwh/2,roundTripEfficiency:.9,gapPolicy:"reset",onInterval:p=>collector.observe(capacityKwh,p)})!;return{capacityKwh,sim};});
  // Same scheduling as the streaming controller: every candidate observes each source interval.
  for(const flow of flows)for(const s of technical)s.sim.push(flow);
  const snapshots=technical.map(({capacityKwh,sim})=>{const r=sim.finish()!;return{capacityKwh,powerKw:capacityKwh/2,shiftedKwh:r.shiftedKwh,chargedFromExportKwh:r.chargedFromExportKwh,endingStoredKwh:r.endingStoredKwh,lossesKwh:r.lossesKwh,equivalentCycles:r.equivalentCycles};});
  return{...collector.finish(),technical:snapshots};
};
const f=(start:string,importKwh:number,exportKwh:number):BatteryFlowInterval=>({start,end:new Date(Date.parse(start)+900000).toISOString(),importKwh,exportKwh});
const flows=[f("2025-01-01T22:45:00Z",0,1),f("2025-01-01T23:00:00Z",1,0),f("2025-01-01T23:15:00Z",0,1),f("2025-01-03T12:00:00Z",1,0)];

test("dagbalans bewaart nachtelijke lading, gatverlies en expliciet gekozen dagdetail",()=>{
  const result=build(flows,"2025-01-02");assert.deepEqual(result.daily.map(d=>d.day),["2025-01-01","2025-01-02","2025-01-03"]);
  assert.equal(result.detail?.day,"2025-01-02");assert.equal(result.detail?.candidates[0]?.points.length,2);
  const first=result.daily[0]!.candidates[0]!,next=result.daily[1]!.candidates[0]!,last=result.daily[2]!.candidates[0]!;
  assert.equal(next.startStoredKwh,first.endStoredKwh);assert.ok(Math.abs(next.dischargedKwh-.3375)<1e-12);assert.equal(last.resetLossKwh,next.endStoredKwh);assert.equal(result.daily[2]!.gapCount,1);
  assert.equal(result.detail?.candidates[0]?.points[0]?.startStoredKwh,first.endStoredKwh);
  assert.equal(validateBatteryDays(result.daily,result.technical,{start:flows[0]!.start,end:flows.at(-1)!.end}),true);
  assert.equal(selectBatteryDay(result.daily,"2025-01-02",5).energy?.capacityKwh,5);assert.equal(selectBatteryDay(result.daily,"2025-01-04",3).selected,undefined);
});

test("Brusselse zomer- en winterdag bevatten exact 92 en 100 kwartieren; detail blijft begrensd",()=>{
  for(const [day,count] of [["2025-03-30",92],["2025-10-26",100]] as const){const window=batteryDayWindow(day);assert.equal(expectedBatteryIntervals(day),count);
    const input=Array.from({length:count},(_,i)=>f(new Date(Date.parse(window.start)+i*900000).toISOString(),i%2?1:0,i%2?0:1));const result=build(input,day);
    assert.equal(result.daily.length,1);assert.equal(result.daily[0]?.count,count);assert.equal(result.daily[0]?.gapCount,0);assert.equal(result.detail?.candidates[4]?.points.length,count);assert.equal(validateBatteryDays(result.daily,result.technical,window),true);
  }
});

test("opslag bewaart uitsluitend dagaggregaten en weigert corrupte balans of verborgen kwartierdata",()=>{
  const r=build(flows),quality={period:{start:flows[0]!.start,end:flows.at(-1)!.end},integrityReliable:true,estimatedCount:0,gapCount:1,duplicateCount:0,overlapCount:0};
  const report={version:3 as const,savedAt:"2026-09-12T00:00:00Z",quality,technical:r.technical,daily:r.daily};const data=new Map<string,string>();let writes=0;const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{writes++;data.set(k,v);}};
  assert.equal(saveBatteryReport(storage,report),true);assert.equal(writes,1);assert.deepEqual(loadBatteryStorageState(storage),{status:"current",report});assert.doesNotMatch(data.get(BATTERY_REPORT_KEY)!,/points|EAN|fileName|token/);
  const changes=[(x:any)=>x.daily[0].candidates[0].chargedKwh++, (x:any)=>x.daily[0].points=[],(x:any)=>x.daily[2].gapCount=0,(x:any)=>{const c=x.daily[2].candidates[0];c.conversionLossKwh+=c.resetLossKwh;c.resetLossKwh=0;},(x:any)=>x.daily[0].candidates[0].endStoredKwh++, (x:any)=>x.daily[0].count=101];
  for(const change of changes){const copy=structuredClone(report);change(copy);assert.equal(saveBatteryReport(storage,copy),false);data.set(BATTERY_REPORT_KEY,JSON.stringify(copy));assert.deepEqual(loadBatteryStorageState(storage),{status:"corrupt",key:BATTERY_REPORT_KEY});}
  const {daily,...older}=report;data.set(BATTERY_REPORT_KEY,JSON.stringify(older));assert.deepEqual(loadBatteryStorageState(storage),{status:"current",report:older});
});

test("geschatte richtingen combineren eenmaal en daglimiet weigert meer dan 4000 dagen",()=>{
  const result=build([f("2025-01-01T12:00:00Z",1,0),{...f("2025-01-01T12:00:00Z",0,2),estimated:true}]);assert.equal(result.daily[0]?.estimatedCount,1);assert.equal(result.daily[0]?.count,1);assert.equal(result.daily[0]?.candidates[0]?.sourceImportKwh,1);assert.equal(result.daily[0]?.candidates[0]?.sourceExportKwh,2);
  const collector=createBatteryDailyCollector(),point=result.detail!.candidates[0]!.points[0]!;
  for(let i=0;i<4000;i++){const start=new Date(Date.parse("2000-01-01T12:00:00Z")+i*86400000).toISOString();collector.observe(3,{...point,start,end:new Date(Date.parse(start)+900000).toISOString()});}
  assert.throws(()=>collector.observe(3,{...point,start:"2030-01-01T12:00:00Z",end:"2030-01-01T12:15:00Z"}),/DAY_LIMIT/);
});
