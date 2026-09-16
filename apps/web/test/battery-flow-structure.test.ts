import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {build} from "esbuild";
import {fileURLToPath} from "node:url";
import {createFluviusPreviewAnalyzer} from "@crems/core/fluvius-stream-preview";
import {mapCsvPreview} from "../src/csv-preview.ts";
import {compareBatteryCandidates} from "../src/battery-comparison.ts";
import {createBatterySimulator} from "@crems/core/battery-simulation";
import {createBatteryDailyCollector} from "../src/battery-daily-report.ts";

const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

test("batterij is alleen bereikbaar via een succesvol gecontroleerd tijdelijk bestand", () => {
  assert.doesNotMatch(source, />Batterij<\/button>/);
  assert.match(source, /csvPreview\?\.status !== "success"/);
  assert.match(source, /setBatteryInput\(\{ file: selectedCsvFile, preview: csvPreview \}\)/);
  assert.match(source, /if\(!input\)return <section/);
});

test("oude batterij-economics route kan niet terugkeren",()=>{assert.doesNotMatch(source,/BATTERY_MARKET_ASSUMPTIONS|calculateBatteryEconomics|richtprijs/);});

test("de planner houdt hooks stabiel en toont geen inert offerteveld", () => {
  const planner = source.slice(source.indexOf("function BatteryPlanner"), source.indexOf("function EnergyReportPage"));
  assert.ok(planner.indexOf("useState") < planner.indexOf("if(!input)return"));
  assert.doesNotMatch(planner, /Offerteprijs|setCost|\bcost\b/);
});

// Exercise the actual component functions and handlers without a DOM or browser.
// The small hook host also replays effect setup/cleanup/setup as StrictMode does.
const bundled=await build({entryPoints:[fileURLToPath(new URL("../src/App.tsx",import.meta.url))],bundle:true,write:false,format:"esm",platform:"node",logLevel:"silent",plugins:[{name:"component-runtime",setup(b){
  b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},args=>({path:args.path,namespace:"hooks"}));
  b.onLoad({filter:/.*/,namespace:"hooks"},args=>({contents:args.path==="react"?'export const useState=(...a)=>globalThis.__batteryHooks.useState(...a); export const useRef=(...a)=>globalThis.__batteryHooks.useRef(...a); export const useMemo=(...a)=>globalThis.__batteryHooks.useMemo(...a); export const useEffect=(...a)=>globalThis.__batteryHooks.useEffect(...a);':'export const Fragment="fragment"; export const jsx=(type,props,key)=>({type,props,key}); export const jsxs=jsx;'}));
  b.onResolve({filter:/^\.\/use-(live-meter|power-history|price-history)$/},args=>({path:args.path,namespace:"live"}));
  b.onLoad({filter:/.*/,namespace:"live"},()=>({contents:'export const useLiveMeter=()=>({connected:false,reading:{source:"simulator",timestamp:"2026-01-01T00:00:00Z",importPowerW:0,exportPowerW:0}}); export const usePowerHistory=()=>({}); export const usePriceHistory=()=>({});'}));
  b.onLoad({filter:/App\.tsx$/},()=>({contents:source+'\nexport {BatteryPlanner,ReleaseBatteryResult,BatteryDailyReport}; export {loadBatteryStorageState} from "./local-battery-analysis";',loader:"tsx"}));
  b.onLoad({filter:/battery-comparison\.ts$/},async args=>({contents:(await readFile(args.path,"utf8")).replace('  const reasons = batteryEligibility(quality);','  globalThis.__batteryComparisonCalls=(globalThis.__batteryComparisonCalls??0)+1;\n  const reasons = batteryEligibility(quality);'),loader:"ts"}));
}}]});
const app=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0]!.text).toString("base64")}`);
const globals=globalThis as any;
const host=(component:any)=>{
  const slots:any[]=[];let index=0;const pending:any[]=[];
  const same=(a:any[],b:any[])=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
  const hooks={
    useState(initial:any){const i=index++;if(!slots[i])slots[i]={value:typeof initial==="function"?initial():initial};return[slots[i].value,(value:any)=>{slots[i].value=typeof value==="function"?value(slots[i].value):value;}];},
    useRef(initial:any){const i=index++;return(slots[i]??={current:initial});},
    useMemo(create:any,deps:any[]){const i=index++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={value:create(),deps};return slots[i].value;},
    useEffect(setup:any,deps:any[]){const i=index++;if(!slots[i]||!same(slots[i].deps,deps)){const before=slots[i];slots[i]={setup,deps,cleanup:before?.cleanup};pending.push(slots[i]);}}
  };
  return {render(props:any={}){index=0;globals.__batteryHooks=hooks;return component(props);},flush(){for(const effect of pending.splice(0)){effect.cleanup?.();effect.cleanup=effect.setup();}},replay(){for(const s of slots)if(s?.setup)s.cleanup?.();for(const s of slots)if(s?.setup)s.cleanup=s.setup();},dispose(){for(const s of slots)if(s?.setup)s.cleanup?.();}};
};
const nodes=(node:any):any[]=>Array.isArray(node)?node.flatMap(nodes):node&&typeof node==="object"?[node,...nodes(node.props?.children)]:[];
const chartNodes=(tree:any)=>nodes(tree).flatMap(n=>typeof n.type==="function"&&n.type.name==="IntervalChart"?nodes(n.type(n.props)):[]);
const chartCount=(tree:any)=>[...nodes(tree),...chartNodes(tree)].filter(n=>n.type==="svg").length;
const text=(node:any):string=>Array.isArray(node)?node.map(text).join(""):node&&typeof node==="object"?text(node.props?.children):node==null||typeof node==="boolean"?"":String(node);
const find=(tree:any,predicate:(n:any)=>boolean)=>{const node=nodes(tree).find(predicate);assert.ok(node,"expected UI element");return node;};
const button=(tree:any,label:string)=>find(tree,n=>n.type==="button"&&text(n)===label);
const waitFor=async(check:()=>boolean)=>{for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,1));}assert.fail("component did not settle");};
test("lege navigatie legt voorwaarden zichtbaar uit en blokkeert activatie zonder focus te verwijderen",()=>{
  globals.window={localStorage:{getItem:()=>null}};
  const h=host(app.App);
  try {
    for(const label of ["2. Rapport","3. Batterij","4. Contract"]){
      const tree=h.render(), target=button(tree,label);
      assert.equal(target.props["aria-disabled"],true);
      assert.equal(target.props.disabled,undefined);
      const explanation=find(tree,n=>n.props?.id===target.props["aria-describedby"]);
      assert.match(text(explanation),/bij Data/);
      target.props.onClick();
      assert.equal(button(h.render(),"Overzicht").props["aria-current"],"page");
    }
    button(h.render(),"1. Data").props.onClick();
    assert.equal(button(h.render(),"1. Data").props["aria-current"],"page");
  }finally{h.dispose();delete globals.window;}
});
const quality={period:{start:"2025-01-01T00:00:00Z",end:"2026-01-02T00:00:00Z"},integrityReliable:true,estimatedCount:0,gapCount:0,duplicateCount:0,overlapCount:0};
const technical=([3,5,7,10,13] as const).map(capacityKwh=>({capacityKwh,powerKw:capacityKwh/2,shiftedKwh:100,chargedFromExportKwh:120,endingStoredKwh:2,lossesKwh:18,equivalentCycles:100/capacityKwh}));
const assumptions={confirmed:true as const,contractName:"Synthetisch",contractType:"fixed" as const,effectiveStart:"2025-01-01",effectiveEnd:"2026-01-02",quoteSource:"Synthetisch",quoteDate:"2026-01-02",warrantyYears:10,pricesIncludeVat:true as const,importRateCtKwh:30,exportRateCtKwh:4,lifeYears:15,annualDegradationPercent:2,discountRatePercent:3,investmentsEur:{3:3000,5:5000,7:7000,10:10000,13:13000}};
const compared=compareBatteryCandidates(quality,technical,assumptions);if(compared.status!=="financial")throw Error("fixture");
const saved={version:3,savedAt:"2026-09-10T00:00:00Z",quality,technical,financial:{assumptions,results:compared.candidates,recommendedCapacityKwh:compared.recommendedCapacityKwh}};
const storage=()=>{const data=new Map<string,string>([["crems.battery-analysis.v3",JSON.stringify(saved)]]);return{data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>void data.set(k,v),removeItem:(k:string)=>void data.delete(k)};};
const csv="Van (datum);Van (tijdstip);Tot (datum);Tot (tijdstip);EAN-code;Meter;Metertype;Register;Volume;Eenheid;Validatiestatus;Omschrijving\n01-06-2026;00:00:00;01-06-2026;00:15:00;;;synthetisch;Injectie Dag;1,0;kWh;Uitgelezen;\n";
const analyzer=createFluviusPreviewAnalyzer();analyzer.push(csv);const checked=mapCsvPreview({ok:true,analyzed:analyzer.finish()});

test("Planner effectherstart werkt; nieuw bestand erft geen oude kwaliteit of financiële bevestiging",async()=>{
  const originalFetch=globalThis.fetch;let reads=0,fetches=0;const s=storage();globals.window={localStorage:s};globalThis.fetch=async()=>{fetches++;return {ok:false} as Response;};
  const input={file:{size:csv.length,stream:()=>{reads++;return new Blob([csv]).stream();}},preview:checked};let report:any;
  const h=host(app.BatteryPlanner),props={input,saved,onSaved:(r:any)=>report=r,onForget:()=>{},onOpenImport:()=>{}};
  try{h.render(props);h.flush();h.replay();let tree:any;await waitFor(()=>{tree=h.render(props);return nodes(tree).some(n=>n.type===app.ReleaseBatteryResult);});const result=find(tree,n=>n.type===app.ReleaseBatteryResult);
    assert.deepEqual(result.props.quality.period,checked.status==="success"?checked.period:null);assert.equal(result.props.savedFinancial,undefined);assert.equal(result.props.isSaved,false);
    const daily=find(tree,n=>n.type===app.BatteryDailyReport);assert.ok(daily.props.initialDetail);daily.props.onReleaseInitialDetail();tree=h.render(props);assert.equal(find(tree,n=>n.type===app.BatteryDailyReport).props.initialDetail,undefined);assert.ok(find(tree,n=>n.type===app.BatteryDailyReport).props.days.length);
    assert.deepEqual(JSON.parse(s.data.get("crems.battery-analysis.v3")!),saved);assert.equal(result.props.onSave(),true);assert.equal(report.financial,undefined);assert.notDeepEqual(report.quality,saved.quality);
    const before={reads,fetches};const reopened={...props,input:undefined,saved:report};h.render(reopened);h.flush();h.render(reopened);assert.deepEqual({reads,fetches},before);
  }finally{h.dispose();globalThis.fetch=originalFetch;delete globals.window;}
});

test("App bewaart rapport, wist tijdelijke invoer en behoudt rapport bij verwijderfout",async()=>{
  const s=storage();globals.window={localStorage:s};const h=host(app.App);
  try{let tree=h.render();button(tree,"3. Batterij").props.onClick();tree=h.render();let planner=find(tree,n=>n.type===app.BatteryPlanner);
    s.removeItem=()=>{throw Error("blocked");};planner.props.onForget();tree=h.render();assert.ok(nodes(tree).some(n=>n.type===app.BatteryPlanner&&n.props.saved));assert.match(text(tree),/Verwijderen lukte niet/);
    button(tree,"1. Data").props.onClick();tree=h.render();button(tree,"Gebruik nieuw CSV-bestand").props.onClick();tree=h.render();find(tree,n=>n.type==="input"&&n.props.type==="file").props.onChange({target:{files:[{size:csv.length,stream:()=>new Blob([csv]).stream()}]}});
    await waitFor(()=>{tree=h.render();return nodes(tree).some(n=>n.type==="button"&&text(n)==="Bekijk batterijpotentieel");});button(tree,"Bekijk batterijpotentieel").props.onClick();tree=h.render();planner=find(tree,n=>n.type===app.BatteryPlanner);assert.ok(planner.props.input);assert.equal(planner.props.saved,undefined);
    planner.props.onSaved(saved);tree=h.render();planner=find(tree,n=>n.type===app.BatteryPlanner);assert.equal(planner.props.input,undefined);assert.deepEqual(planner.props.saved,saved);
    button(tree,"Overzicht").props.onClick();tree=h.render();button(tree,"3. Batterij").props.onClick();tree=h.render();assert.equal(find(tree,n=>n.type===app.BatteryPlanner).props.input,undefined);
  }finally{h.dispose();delete globals.window;}
});

test("technisch bewaard rapport kan na bevestiging expliciet financieel worden aangevuld",()=>{
  const h=host(app.ReleaseBatteryResult);let savedFinancial:any;const props={comparisons:technical.map(t=>({capacityKwh:t.capacityKwh,powerKw:t.powerKw,result:t})),quality,isSaved:true,onSave:(v:any)=>{savedFinancial=v;return true;}};
  let tree=h.render(props);
  const values=["Synthetisch","2025-01-01","2026-01-02","Synthetisch","2026-01-02","10","30","4","15","2","3","3000","5000","7000","10000","13000"];
  const fields=nodes(find(tree,n=>n.props?.["aria-label"]==="Financiële context")).filter(n=>n.type==="input"&&n.props.type!=="checkbox");assert.equal(fields.length,values.length);fields.forEach((field,i)=>field.props.onChange({target:{value:values[i]}}));
  tree=h.render(props);const checks=nodes(tree).filter(n=>n.type==="input"&&n.props.type==="checkbox");checks.forEach(check=>check.props.onChange({target:{checked:true}}));tree=h.render(props);
  button(tree,"Bewaar volledig batterijrapport").props.onClick();assert.deepEqual(savedFinancial,saved.financial);
  find(find(tree,n=>n.props?.["aria-label"]==="Financiële context"),n=>n.type==="input"&&n.props.type==="date").props.onChange({target:{value:"2025-02-01"}});tree=h.render(props);assert.equal(nodes(tree).filter(n=>n.type==="input"&&n.props.type==="checkbox").at(-1).props.checked,false);
  assert.equal(nodes(tree).some(n=>n.type==="button"&&text(n)==="Bewaar volledig batterijrapport"),false);h.dispose();
});

test("opgeslagen financieel rapport laadt en rendert zonder actuele vergelijkingsmotor",()=>{
  const s=storage();globals.__batteryComparisonCalls=0;assert.deepEqual(app.loadBatteryStorageState(s),{status:"current",report:saved});const h=host(app.ReleaseBatteryResult);
  h.render({comparisons:technical.map(t=>({capacityKwh:t.capacityKwh,powerKw:t.powerKw,result:t})),quality,isSaved:true,savedFinancial:saved.financial,onSave:()=>false});assert.equal(globals.__batteryComparisonCalls,0);h.dispose();
});

test("App toont veilige opslagfout en zichtbare legacy-migratiefout",()=>{
  globals.window={get localStorage(){throw Error("blocked");}};let h=host(app.App);let tree=h.render();button(tree,"3. Batterij").props.onClick();tree=h.render();assert.match(text(tree),/Lokale opslag is niet beschikbaar/);h.dispose();
  const s=storage();s.data.clear();s.data.set("crems.battery-analysis.v1",JSON.stringify({version:1,period:quality.period,comparisons:technical}));s.setItem=()=>{throw Error("blocked");};globals.window={localStorage:s};h=host(app.App);tree=h.render();button(tree,"3. Batterij").props.onClick();tree=h.render();button(tree,"Bewaar als nieuw technisch rapport").props.onClick();tree=h.render();assert.match(text(tree),/Omzetten lukte niet/);assert.match(text(tree),/onvolledig of onzeker/);assert.ok(s.data.has("crems.battery-analysis.v1"));h.dispose();delete globals.window;
});

test("dagrapportfilters wijzigen KPI's, tijdgrafieken en vergelijking; lege dagen blijven leeg",()=>{
  const collector=createBatteryDailyCollector();const sims=[3,5,7,10,13].map(capacityKwh=>createBatterySimulator({capacityKwh,maxPowerKw:capacityKwh/2,roundTripEfficiency:.9,gapPolicy:"reset",onInterval:p=>collector.observe(capacityKwh as any,p)})!);
  for(const [start,importKwh,exportKwh] of [["2025-01-01T12:00:00Z",0,2],["2025-01-01T12:15:00Z",2,0],["2025-01-03T12:00:00Z",3,0]] as const)for(const sim of sims)sim.push({start,end:new Date(Date.parse(start)+900000).toISOString(),importKwh,exportKwh});sims.forEach(sim=>sim.finish());
  let released=0;const {daily,detail}=collector.finish(),h=host(app.BatteryDailyReport),props={days:daily,initialDetail:detail,onChooseSource:()=>{},onReleaseInitialDetail:()=>{released++;props.initialDetail=undefined;}};let tree=h.render(props);
  const kpi=(view:any,label:string)=>text(find(find(view,n=>n.props?.className==="daily-kpis"),n=>n.type==="article"&&text(n).startsWith(label)));
  assert.match(kpi(tree,"Batterij ontladen"),/0,34/);assert.equal(chartCount(tree),6);assert.match(text(tree),/92|100|96/);
  find(tree,n=>n.type==="select").props.onChange({target:{value:"5"}});tree=h.render(props);assert.match(kpi(tree,"Batterij ontladen"),/0,56/);assert.match(text(tree),/2025-01-01 · 5 kWh/);
  find(tree,n=>n.props?.["aria-label"]==="Volgende dag").props.onClick();tree=h.render(props);assert.equal(released,1);assert.equal(props.initialDetail,undefined);assert.match(text(tree),/Geen brondata voor deze dag/);assert.equal(nodes(tree).some(n=>n.props?.className==="daily-kpis"),false);
  find(tree,n=>n.type==="input"&&n.props.type==="date").props.onChange({target:{value:"2025-01-03"}});tree=h.render(props);assert.match(kpi(tree,"Bronafname"),/3 kWh/);assert.match(text(tree),/Kies CSV voor dagdetail/);
  const nextDays=daily.map(d=>({...d,day:d.day.replace("2025","2026")}));tree=h.render({...props,days:nextDays,initialDetail:undefined});assert.match(text(tree),/2026-01-01 · 5 kWh/);h.dispose();
});

test("dagrapport zonder dagdata toont een werkende herinleesactie; bewaard detail start pas expliciet",async()=>{
  let chosen=0;const old=host(app.BatteryDailyReport);let tree=old.render({onChooseSource:()=>chosen++});button(tree,"Kies CSV voor dagrapport").props.onClick();assert.equal(chosen,1);old.dispose();
  const header=csv.slice(0,csv.indexOf("\n"));const raw=`${header}\n01-06-2026;23:45:00;02-06-2026;00:00:00;;;synthetisch;Injectie Dag;1,0;kWh;Uitgelezen;\n02-06-2026;00:00:00;02-06-2026;00:15:00;;;synthetisch;Afname Dag;1,0;kWh;Uitgelezen;\n`;
  const a=createFluviusPreviewAnalyzer();a.push(raw);const preview=mapCsvPreview({ok:true,analyzed:a.finish()});let reads=0;const input={file:{size:raw.length,stream:()=>{reads++;return new Blob([raw]).stream();}},preview};
  const collector=createBatteryDailyCollector();for(const c of [3,5,7,10,13]){const sim=createBatterySimulator({capacityKwh:c,maxPowerKw:c/2,roundTripEfficiency:.9,gapPolicy:"reset",onInterval:p=>collector.observe(c as any,p)})!;sim.push({start:"2026-06-01T21:45:00Z",end:"2026-06-01T22:00:00Z",importKwh:0,exportKwh:1});sim.push({start:"2026-06-01T22:00:00Z",end:"2026-06-01T22:15:00Z",importKwh:1,exportKwh:0});sim.finish();}
  const h=host(app.BatteryDailyReport),props={days:collector.finish().daily,source:input,onChooseSource:()=>{}};tree=h.render(props);h.flush();assert.equal(reads,0);button(tree,"Toon kwartierdetail").props.onClick();tree=h.render(props);h.flush();await waitFor(()=>{tree=h.render(props);return chartCount(tree)===6;});assert.equal(reads,1);
  find(tree,n=>n.props?.["aria-label"]==="Volgende dag").props.onClick();tree=h.render(props);h.flush();await waitFor(()=>{tree=h.render(props);return chartCount(tree)===6;});assert.equal(reads,2);assert.match(text(tree),/0,34/);h.dispose();
});

test("samenvatting toont vorige-capaciteitsdelta en onzekere legacyfallback eerlijk",()=>{
  const varied=[13,3,10,5,7].map(capacityKwh=>({capacityKwh,powerKw:capacityKwh/2,result:{...technical[0],shiftedKwh:({3:120.5,5:175.75,7:190,10:190,13:185} as any)[capacityKwh]}}));const h=host(app.ReleaseBatteryResult);let tree=h.render({comparisons:varied,quality,isSaved:false,onSave:()=>false});
  assert.match(text(tree),/55,25 kWh extra vermeden netafname t.o.v. 3 kWh/);assert.match(text(tree),/-5 kWh extra vermeden netafname t.o.v. 10 kWh/);assert.match(text(tree),/Referentie: 0 kWh batterij/);assert.match(text(tree),/meetperiode, niet omgerekend naar een jaaropbrengst/);
  const legacy=technical.map(t=>({capacityKwh:t.capacityKwh,powerKw:t.powerKw,result:{...t,chargedFromExportKwh:t.shiftedKwh,endingStoredKwh:0,lossesKwh:0}}));tree=h.render({comparisons:legacy,quality:{...quality,gapCount:1496},isSaved:true,onSave:()=>false});assert.match(text(tree),/Niet bevestigd/);assert.doesNotMatch(text(tree),/gebruikt 90% rondrendement/);h.dispose();
});
test("capaciteitsgrafiek filtert inclusieve dagen, herstelt volledig en laat financieel snapshot ongewijzigd",()=>{
  const daily=["2025-01-01","2025-01-03","2025-01-04"].map((day,index)=>({day,first:`${day}T00:00:00Z`,last:`${day}T23:00:00Z`,count:index===1?80:96,estimatedCount:index===1?1:0,gapCount:index===1?1:0,candidates:technical.map(t=>({...t,dischargedKwh:(index+1)*t.capacityKwh}))}));
  const comparisons=technical.map(t=>({capacityKwh:t.capacityKwh,powerKw:t.powerKw,result:{...t,shiftedKwh:6*t.capacityKwh}}));
  const props={comparisons,daily,quality:{...quality,period:{start:"2024-12-31T23:00:00Z",end:"2025-01-04T23:00:00Z"}},isSaved:true,savedFinancial:saved.financial,onSave:()=>false};
  const before=JSON.stringify(props),h=host(app.ReleaseBatteryResult);let tree=h.render(props);
  const filter=(view:any)=>find(view,n=>n.props?.["aria-label"]==="Periode van capaciteitsgrafiek");
  const dates=(view:any)=>nodes(filter(view)).filter(n=>n.type==="input");
  const barValues=(view:any)=>nodes(find(view,n=>n.props?.className==="battery-bars")).filter(n=>n.type==="span").map(text);
  const financialText=text(find(tree,n=>n.props?.["aria-label"]==="Volledig financieel batterijrapport"));
  assert.deepEqual(dates(tree).map(n=>n.props.value),["2025-01-01","2025-01-04"]);assert.deepEqual(barValues(tree),["0 kWh","18 kWh","30 kWh","42 kWh","60 kWh","78 kWh"]);
  dates(tree)[0].props.onChange({target:{value:"2025-01-03"}});tree=h.render(props);assert.deepEqual(barValues(tree),["0 kWh","15 kWh","25 kWh","35 kWh","50 kWh","65 kWh"]);assert.match(text(tree),/2025-01-03 tot en met 2025-01-04/);assert.match(text(tree),/1 onvolledige dagen/);
  dates(tree)[1].props.onChange({target:{value:"2025-01-03"}});tree=h.render(props);assert.deepEqual(barValues(tree),["0 kWh","6 kWh","10 kWh","14 kWh","20 kWh","26 kWh"]);assert.equal(text(find(tree,n=>n.props?.["aria-label"]==="Volledig financieel batterijrapport")),financialText);
  button(tree,"Volledige periode").props.onClick();tree=h.render(props);assert.deepEqual(barValues(tree),["0 kWh","18 kWh","30 kWh","42 kWh","60 kWh","78 kWh"]);assert.equal(JSON.stringify(props),before);assert.match(text(tree),/3 van 4 kalenderdagen met brondata/);
  dates(tree)[0].props.onChange({target:{value:"2025-01-04"}});tree=h.render(props);dates(tree)[1].props.onChange({target:{value:"2025-01-01"}});tree=h.render(props);assert.ok(nodes(tree).some(n=>n.props?.role==="alert"));assert.equal(nodes(tree).some(n=>n.props?.className==="battery-bars"),false);
  dates(tree)[0].props.onChange({target:{value:""}});tree=h.render(props);assert.ok(nodes(tree).some(n=>n.props?.role==="alert"));assert.equal(nodes(tree).some(n=>n.props?.className==="battery-bars"),false);
  button(tree,"Volledige periode").props.onClick();tree=h.render(props);dates(tree)[0].props.onChange({target:{value:"2025-01-02"}});tree=h.render(props);dates(tree)[1].props.onChange({target:{value:"2025-01-02"}});tree=h.render(props);assert.match(text(tree),/Geen brondata in de gekozen periode/);assert.equal(nodes(tree).some(n=>n.props?.className==="battery-bars"),false);h.dispose();
});

test("periodefilter zonder dagdata behoudt bestaande totalen en biedt echt herinlezen",()=>{
  let choices=0;const h=host(app.ReleaseBatteryResult);const tree=h.render({comparisons:technical.map(t=>({capacityKwh:t.capacityKwh,powerKw:t.powerKw,result:t})),quality,isSaved:true,onSave:()=>false,onChooseSource:()=>choices++});
  const filter=find(tree,n=>n.props?.["aria-label"]==="Periode van capaciteitsgrafiek");assert.ok(nodes(filter).filter(n=>n.type==="input").every(n=>n.props.disabled));assert.match(text(tree),/Dit rapport bevat geen dagdata/);assert.match(text(find(tree,n=>n.props?.className==="battery-bars")),/100 kWh/);button(tree,"Kies CSV voor periodefilter").props.onClick();assert.equal(choices,1);h.dispose();
});
