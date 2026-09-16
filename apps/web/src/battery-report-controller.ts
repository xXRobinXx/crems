import {createBatterySimulator,type BatterySimulationResult} from "@crems/core/battery-simulation";
import {createFluviusPreviewAnalyzer} from "@crems/core/fluvius-stream-preview";
import type {CsvPreview} from "./csv-preview";
import type {BelpexHistory} from "./belpex-history";
import type {BatteryTechnicalSnapshot} from "./local-battery-analysis";
import {createBatteryDailyCollector,type BatteryDay,type BatteryDayDetail} from "./battery-daily-report.ts";

export type BatteryRunInput=Readonly<{file:{size:number;stream():ReadableStream<Uint8Array>};preview:Extract<CsvPreview,{status:"success"}>}>;
export type BatteryRunState={status:"idle"}|{status:"running";progress:number}|{status:"success";technical:readonly BatteryTechnicalSnapshot[];priceSource?:string;missingPriceCount:number;daily?:BatteryDay[];detail?:BatteryDayDetail}|{status:"error";code:"FILE_TOO_LARGE"|"INVALID_PERIOD"|"NO_INTERVALS"|"INVALID_TIMELINE"|"LOCAL_READ_ERROR"};
type Options={loadPrices:(start:string,end:string,signal:AbortSignal)=>Promise<BelpexHistory|undefined>;publish:(state:BatteryRunState)=>void;yieldControl?:()=>Promise<void>};
const sizes=[3,5,7,10,13] as const;
export const createBatteryReportController=({loadPrices,publish,yieldControl=()=>new Promise(resolve=>setTimeout(resolve,0))}:Options)=>{
  type Job={abort:AbortController;reader?:ReadableStreamDefaultReader<Uint8Array>;readerClosed:boolean;completed:boolean;closing?:Promise<void>};
  let sequence=0,active:Job|undefined,disposed=false;
  const close=(job:Job)=>{if(!job.closing)job.closing=(async()=>{if(job.reader&&!job.readerClosed){job.readerClosed=true;if(!job.completed){try{await job.reader.cancel();}catch{}}try{job.reader.releaseLock();}catch{}}})();return job.closing;};
  const cancel=()=>{sequence++;const job=active;active=undefined;if(job){job.abort.abort();void close(job);}if(!disposed)publish({status:"idle"});};
  const run=async(input:BatteryRunInput,selection:{day?:string;skipPrices?:boolean}={})=>{cancel();if(disposed)return;const own=++sequence,job:Job={abort:new AbortController(),readerClosed:false,completed:false};active=job;publish({status:"running",progress:0});
    if(input.file.size>20*1024*1024){if(own===sequence)publish({status:"error",code:"FILE_TOO_LARGE"});active=undefined;return;}
    const period=input.preview.period;if(!period){if(own===sequence)publish({status:"error",code:"INVALID_PERIOD"});active=undefined;return;}
    try{const prices=selection.skipPrices?undefined:await loadPrices(period.start,period.end,job.abort.signal);if(own!==sequence||job.abort.signal.aborted)return;const priceMap=new Map<number,number>();if(prices)for(const point of prices.points){const start=Date.parse(point.start);for(let offset=0;offset<point.resolutionMinutes;offset+=15)priceMap.set(start+offset*60_000,point.priceEurMwh);}const lookup=(start:string)=>priceMap.get(Date.parse(start));let missingPriceCount=0;
      const collector=createBatteryDailyCollector(selection.day);
      const simulators=sizes.map(capacityKwh=>({capacityKwh,powerKw:capacityKwh/2,simulator:createBatterySimulator({capacityKwh,maxPowerKw:capacityKwh/2,roundTripEfficiency:.9,gapPolicy:"reset",onInterval:p=>collector.observe(capacityKwh,p)})!}));
      const analyzer=createFluviusPreviewAnalyzer({onInterval:item=>{const priceEurMwh=lookup(item.start);if(priceEurMwh===undefined)missingPriceCount++;for(const candidate of simulators)candidate.simulator.push({start:item.start,end:item.end,importKwh:item.direction==="import"?item.energyKwh:0,exportKwh:item.direction==="export"?item.energyKwh:0,priceEurMwh,estimated:item.quality==="estimated"});}});
      job.reader=input.file.stream().getReader();const decoder=new TextDecoder();let bytes=0;
      while(true){const chunk=await job.reader.read();if(chunk.done)break;if(own!==sequence)return;bytes+=chunk.value.byteLength;analyzer.push(decoder.decode(chunk.value,{stream:true}));publish({status:"running",progress:input.file.size?Math.min(99,Math.round(bytes/input.file.size*100)):0});await yieldControl();if(own!==sequence)return;}
      analyzer.push(decoder.decode());const preview=analyzer.finish();if(own!==sequence)return;if(preview.validCount===0){publish({status:"error",code:"NO_INTERVALS"});return;}
      const technical=simulators.map(({capacityKwh,powerKw,simulator})=>{const result=simulator.finish();return result?toSnapshot(capacityKwh,powerKw,result):undefined;});if(technical.some(x=>!x)){publish({status:"error",code:"INVALID_TIMELINE"});return;}
      const collected=collector.finish();job.completed=true;publish({status:"success",technical:technical as BatteryTechnicalSnapshot[],...(prices?{priceSource:prices.source}:{}),missingPriceCount,daily:collected.daily,...(collected.detail?{detail:collected.detail}:{})});
    }catch{if(own===sequence&&!job.abort.signal.aborted)publish({status:"error",code:"LOCAL_READ_ERROR"});}finally{if(active===job)active=undefined;await close(job);}
  };
  const dispose=()=>{disposed=true;cancel();};return{run,cancel,dispose};
};
const toSnapshot=(capacityKwh:3|5|7|10|13,powerKw:number,r:BatterySimulationResult):BatteryTechnicalSnapshot=>({capacityKwh,powerKw,shiftedKwh:r.shiftedKwh,chargedFromExportKwh:r.chargedFromExportKwh,endingStoredKwh:r.endingStoredKwh,lossesKwh:r.lossesKwh,equivalentCycles:r.equivalentCycles,...(r.wholesaleTimeShiftValueEur===undefined?{}:{wholesaleTimeShiftValueEur:r.wholesaleTimeShiftValueEur})});

export const createConfirmationController=<T extends Record<string,unknown>>(initial:T,publish:(draft:T,confirmed:boolean)=>void)=>{let draft={...initial},confirmed=false;return{change<K extends keyof T>(key:K,value:T[K]){draft={...draft,[key]:value};confirmed=false;publish({...draft},false);},confirm(){confirmed=true;publish({...draft},true);},snapshot(){return{draft:{...draft},confirmed};}};};
export const resolveFinancialSnapshot=<T>(stored:T|undefined,calculate:()=>T)=>stored===undefined?calculate():stored;
