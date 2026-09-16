import assert from "node:assert/strict";import {readFile} from "node:fs/promises";import test from "node:test";import {createBatteryReportController,createConfirmationController,resolveFinancialSnapshot} from "../src/battery-report-controller.ts";
import {createFluviusPreviewAnalyzer} from "@crems/core/fluvius-stream-preview";
import {mapCsvPreview} from "../src/csv-preview.ts";
import {loadBatteryStorageState,saveBatteryReport,removeBatteryStorage,BATTERY_REPORT_KEY} from "../src/local-battery-analysis.ts";
import {compareBatteryCandidates} from "../src/battery-comparison.ts";
const header="Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving";
const csv=`${header}\n01-01-2025;00:00:00;01-01-2025;00:15:00;;;synthetisch;Injectie Dag;1,0;kWh;Uitgelezen;\n`;
const analyze=(text:string)=>{const analyzer=createFluviusPreviewAnalyzer();analyzer.push(text);const result=mapCsvPreview({ok:true,analyzed:analyzer.finish()});assert.equal(result.status,"success");if(result.status!=="success")throw Error("invalid fixture");return result;};
const preview=analyze(csv);
const file=(text=csv)=>({size:text.length,stream:()=>new Blob([text]).stream()});
test("technische run publiceert zonder opslagdependency en geeft fetch een signal",async()=>{const states:any[]=[];let signal:AbortSignal|undefined;const c=createBatteryReportController({publish:s=>states.push(s),loadPrices:async(_a,_b,s)=>{signal=s;return undefined;},yieldControl:async()=>{}});await c.run({file:file(),preview});assert.ok(signal);assert.equal(states.at(-1).status,"success");assert.equal(states.at(-1).missingPriceCount,1);assert.equal(states.at(-1).technical.length,5);});
test("trage A kan snelle B niet overschrijven en abort zijn fetch",async()=>{const states:any[]=[];let resolveA:(v:undefined)=>void=()=>{};let signalA:AbortSignal|undefined;let calls=0;const c=createBatteryReportController({publish:s=>states.push(s),loadPrices:(_a,_b,s)=>{calls++;if(calls===1){signalA=s;return new Promise(r=>resolveA=r);}return Promise.resolve(undefined);},yieldControl:async()=>{}});const a=c.run({file:file(),preview});await Promise.resolve();await c.run({file:file(),preview});resolveA(undefined);await a;assert.equal(signalA?.aborted,true);assert.equal(states.at(-1).status,"success");});
test("cancel annuleert en sluit actieve stream exact eenmaal",async()=>{let cancels=0;let releases=0;let signal:AbortSignal|undefined;let unblock:()=>void=()=>{};const stream={getReader:()=>({read:()=>new Promise<{done:true;value?:undefined}>(r=>unblock=()=>r({done:true})),cancel:async()=>{cancels++;unblock();},releaseLock:()=>{releases++;}})} as unknown as ReadableStream<Uint8Array>;const c=createBatteryReportController({publish:()=>{},loadPrices:async(_a,_b,s)=>{signal=s;return undefined;}});const running=c.run({file:{size:1,stream:()=>stream},preview});await Promise.resolve();await Promise.resolve();c.cancel();await running;assert.equal(signal?.aborted,true);assert.equal(cancels,1);assert.equal(releases,1);});
test("ieder financieel veld trekt bevestiging in",()=>{const events:any[]=[];const c=createConfirmationController({name:"",vat:false,amount:""},(draft,confirmed)=>events.push({draft,confirmed}));for(const [key,value] of [["name","x"],["vat",true],["amount","1"]] as const){c.confirm();c.change(key,value as never);assert.equal(c.snapshot().confirmed,false);assert.equal(events.at(-1).confirmed,false);}});
test("simulatiestart doet geen profiel- of batterijwrite",async()=>{const source=await readFile(new URL("../src/App.tsx",import.meta.url),"utf8");const start=source.slice(source.indexOf("const openBatterySimulation"),source.indexOf("const saveProfile"));assert.doesNotMatch(start,/saveProfile|setItem|saveBatteryReport|saveLocalEnergyProfile/);});
test("opgeslagen financieel snapshot slaat herberekening volledig over",()=>{let calls=0;const stored={snapshot:true};assert.equal(resolveFinancialSnapshot(stored,()=>{calls++;return stored;}),stored);assert.equal(calls,0);resolveFinancialSnapshot(undefined,()=>{calls++;return stored;});assert.equal(calls,1);});



test("UI bevat het volledige read-only financiële snapshot",async()=>{const source=await readFile(new URL("../src/App.tsx",import.meta.url),"utf8");for(const label of ["Volledig financieel batterijrapport","Contractperiode","Offerte","Tarieven","Rekenhorizon","Investering incl. btw","Jaarlijkse energiebesparing","NPV laag / basis / hoog","Terugverdientijd laag / basis / hoog","geen volledige factuur"])assert.match(source,new RegExp(label.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&"),"i"));});

export const createBatteryYearFixture=()=>{
  const formatter=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Brussels",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
  const local=(time:number)=>{const p=Object.fromEntries(formatter.formatToParts(time).map(x=>[x.type,x.value]));return {stamp:`${p.day}-${p.month}-${p.year};${p.hour}:${p.minute}:${p.second}`,hour:Number(p.hour)};};
  const start=Date.parse("2024-12-31T23:00:00Z"),end=Date.parse("2025-12-31T23:00:00Z");
  const rows=[header];let from=local(start);
  for(let time=start;time<end;time+=900_000){const to=local(time+900_000),sun=from.hour>=11&&from.hour<16;for(const [register,volume] of [["Afname Dag",sun?"0,0":"0,35"],["Injectie Dag",sun?"0,45":"0,0"]])rows.push(`${from.stamp};${to.stamp};;;synthetisch;${register};${volume};kWh;Uitgelezen;`);from=to;}
  return rows.join("\n")+"\n";
};

test("echt synthetisch jaar: controle→run zonder prijzen→technisch bewaren→financieel aanvullen→refresh→verwijderen",async()=>{
  const text=createBatteryYearFixture(),checked=analyze(text);
  assert.equal(checked.validCount,365*96*2);assert.equal(checked.gapCount,0);assert.equal(checked.duplicateCount,0);assert.equal(checked.overlapCount,0);assert.equal(checked.integrityReliable,true);
  const quality={period:checked.period!,integrityReliable:checked.integrityReliable,estimatedCount:checked.estimatedCount,gapCount:checked.gapCount,duplicateCount:checked.duplicateCount,overlapCount:checked.overlapCount};
  const data=new Map<string,string>();let writes=0,reads=0,fetches=0;const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{writes++;data.set(k,v);},removeItem:(k:string)=>void data.delete(k)};
  let result:any;const controller=createBatteryReportController({publish:s=>result=s,loadPrices:async()=>{fetches++;return undefined;},yieldControl:async()=>{}});
  await controller.run({file:{size:text.length,stream:()=>{reads++;return new Blob([text]).stream();}},preview:checked});
  assert.equal(result.status,"success");assert.equal(writes,0);assert.ok(result.technical.every((x:any)=>!Object.hasOwn(x,"wholesaleTimeShiftValueEur")));
  const technicalReport={version:3 as const,savedAt:"2026-09-10T00:00:00Z",quality,technical:result.technical,daily:result.daily};
  assert.equal(saveBatteryReport(storage,technicalReport),true);assert.equal(writes,1);assert.deepEqual(loadBatteryStorageState(storage),{status:"current",report:technicalReport});
  const assumptions={confirmed:true as const,contractName:"Synthetisch contract",contractType:"fixed" as const,effectiveStart:"2024-12-31",effectiveEnd:"2026-01-01",quoteSource:"Synthetische offerte",quoteDate:"2026-01-01",warrantyYears:10,pricesIncludeVat:true as const,importRateCtKwh:30,exportRateCtKwh:4,lifeYears:15,annualDegradationPercent:2,discountRatePercent:3,investmentsEur:{3:3000,5:5000,7:7000,10:10000,13:13000}};
  const computed=compareBatteryCandidates(quality,result.technical,assumptions);assert.equal(computed.status,"financial");if(computed.status!=="financial")return;
  const report={...technicalReport,financial:{assumptions,results:computed.candidates,recommendedCapacityKwh:computed.recommendedCapacityKwh}};
  assert.equal(saveBatteryReport(storage,report),true);assert.equal(writes,2);controller.dispose();
  const before={reads,fetches,writes};assert.deepEqual(loadBatteryStorageState(storage),{status:"current",report});assert.deepEqual({reads,fetches,writes},before);
  assert.doesNotMatch(data.get(BATTERY_REPORT_KEY)!,/EAN|meter|csv|fileName|chunks|intervals|synthetisch;|token/i);
  assert.equal(removeBatteryStorage(storage),true);assert.deepEqual(loadBatteryStorageState(storage),{status:"empty"});
});

test("lees- en parserfouten annuleren en releasen de reader eenmaal; een nieuwe run blijft mogelijk",async()=>{
  for(const mode of ["read","parse"]){let cancels=0,releases=0;const states:any[]=[];const controller=createBatteryReportController({publish:s=>states.push(s),loadPrices:async()=>undefined,yieldControl:async()=>{}});
    const stream={getReader:()=>({read:async()=>{if(mode==="read")throw Error("read failed");return {done:false,value:new TextEncoder().encode("wrong;headers\n")};},cancel:async()=>{cancels++;},releaseLock:()=>{releases++;}})} as unknown as ReadableStream<Uint8Array>;
    await controller.run({file:{size:14,stream:()=>stream},preview});assert.equal(states.at(-1).status,"error");assert.equal(cancels,1);assert.equal(releases,1);
    controller.cancel();assert.equal(cancels,1);await controller.run({file:file(),preview});assert.equal(states.at(-1).status,"success");controller.dispose();assert.equal(releases,1);
  }
});

test("20 MiB-grens weigert vóór stream en dispose stopt late resultaten",async()=>{
  let streams=0;const states:any[]=[];let complete:(v:undefined)=>void=()=>{};
  const controller=createBatteryReportController({publish:s=>states.push(s),loadPrices:()=>new Promise(r=>complete=r)});
  await controller.run({file:{size:20*1024*1024+1,stream:()=>{streams++;return file().stream();}},preview});assert.equal(streams,0);assert.equal(states.at(-1).code,"FILE_TOO_LARGE");
  const running=controller.run({file:file(),preview});controller.dispose();const count=states.length;complete(undefined);await running;assert.equal(states.length,count);await controller.run({file:file(),preview});assert.equal(states.length,count);
});
