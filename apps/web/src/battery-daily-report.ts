import type {BatteryIntervalObservation} from "@crems/core/battery-simulation";
import {BATTERY_CAPACITIES,type BatteryCapacity} from "./battery-comparison.ts";
import {fullBrusselsDayWindow} from "./day-window.ts";

export const MAX_BATTERY_DAYS=4000;
export const MAX_BATTERY_DAY_INTERVALS=100;
export const energyFields=["sourceImportKwh","sourceExportKwh","netImportBeforeKwh","netExportBeforeKwh","chargedKwh","dischargedKwh","netImportAfterKwh","netExportAfterKwh","conversionLossKwh","resetLossKwh"] as const;
export type DailyBatteryEnergy=Record<typeof energyFields[number],number>&{capacityKwh:BatteryCapacity;startStoredKwh:number;endStoredKwh:number};
export type BatteryDay={day:string;first:string;last:string;count:number;estimatedCount:number;gapCount:number;candidates:DailyBatteryEnergy[]};
export type BatteryDayDetail={day:string;candidates:{capacityKwh:BatteryCapacity;points:BatteryIntervalObservation[]}[]};
const dateFormat=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Brussels",year:"numeric",month:"2-digit",day:"2-digit"});
export const batteryLocalDay=(instant:string)=>dateFormat.format(new Date(instant));
export const batteryDayWindow=(day:string)=>fullBrusselsDayWindow("today",new Date(`${day}T12:00:00Z`));
export const adjacentBatteryDay=(day:string,delta:number)=>new Date(Date.parse(`${day}T12:00:00Z`)+delta*86400000).toISOString().slice(0,10);
export const expectedBatteryIntervals=(day:string)=>{const w=batteryDayWindow(day);return(Date.parse(w.end)-Date.parse(w.start))/900000;};
export const selectBatteryDay=(days:readonly BatteryDay[],day:string,capacity:BatteryCapacity)=>{const selected=days.find(d=>d.day===day);return {selected,energy:selected?.candidates.find(c=>c.capacityKwh===capacity)};};

export const createBatteryDailyCollector=(requestedDay?:string)=>{
  const days:BatteryDay[]=[];const index=new Map<string,BatteryDay>();const limits=new Map<string,number>();let detail:BatteryDayDetail|undefined;
  return {
    observe(capacityKwh:BatteryCapacity,p:BatteryIntervalObservation){
      const day=batteryLocalDay(p.start);let aggregate=index.get(day);
      if(!aggregate){if(days.length>=MAX_BATTERY_DAYS)throw Error("DAY_LIMIT");aggregate={day,first:p.start,last:p.end,count:0,estimatedCount:0,gapCount:0,candidates:[]};days.push(aggregate);index.set(day,aggregate);limits.set(day,expectedBatteryIntervals(day));}
      if(capacityKwh===BATTERY_CAPACITIES[0]){aggregate.count++;aggregate.estimatedCount+=Number(p.estimated);aggregate.gapCount+=Number(p.gap);aggregate.last=p.end;if(aggregate.count>limits.get(day)!)throw Error("DAY_INTERVAL_LIMIT");}
      let energy=aggregate.candidates.find(c=>c.capacityKwh===capacityKwh);
      if(!energy){energy={capacityKwh,startStoredKwh:p.startStoredKwh,endStoredKwh:p.endStoredKwh,...Object.fromEntries(energyFields.map(k=>[k,0]))} as DailyBatteryEnergy;aggregate.candidates.push(energy);}
      for(const key of energyFields)energy[key]+=p[key];energy.endStoredKwh=p.endStoredKwh;
      if(day===(requestedDay??days[0]!.day)){
        detail??={day,candidates:[]};let candidate=detail.candidates.find(c=>c.capacityKwh===capacityKwh);if(!candidate){candidate={capacityKwh,points:[]};detail.candidates.push(candidate);}
        if(candidate.points.length>=MAX_BATTERY_DAY_INTERVALS)throw Error("DETAIL_LIMIT");candidate.points.push({...p});
      }
    },
    finish(){return {daily:days,detail};},
  };
};

const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:readonly string[])=>Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const nonneg=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=0;
const close=(a:number,b:number)=>Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
type TechnicalTotals={capacityKwh:number;shiftedKwh:number;chargedFromExportKwh:number;lossesKwh:number;endingStoredKwh:number};
export const validateBatteryDays=(value:unknown,technical:readonly TechnicalTotals[],period:{start:string;end:string}):value is BatteryDay[]=>{
  if(!Array.isArray(value)||!value.length||value.length>MAX_BATTERY_DAYS)return false;
  const totals=BATTERY_CAPACITIES.map(()=>({charged:0,discharged:0,loss:0,end:0}));let previous="",previousEnd:number|undefined;
  for(const unknownDay of value){
    if(!object(unknownDay)||!exact(unknownDay,["day","first","last","count","estimatedCount","gapCount","candidates"]))return false;
    const d=unknownDay as unknown as BatteryDay;
    if(typeof d.day!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(d.day)||!Number.isFinite(Date.parse(`${d.day}T12:00:00Z`))||new Date(`${d.day}T12:00:00Z`).toISOString().slice(0,10)!==d.day||d.day<=previous)return false;
    if(typeof d.first!=="string"||typeof d.last!=="string"||!Number.isFinite(Date.parse(d.first))||!Number.isFinite(Date.parse(d.last))||Date.parse(d.first)>=Date.parse(d.last)||Date.parse(d.first)<Date.parse(period.start)||Date.parse(d.last)>Date.parse(period.end)||batteryLocalDay(d.first)!==d.day||batteryLocalDay(new Date(Date.parse(d.last)-1).toISOString())!==d.day)return false;
    if(![d.count,d.estimatedCount,d.gapCount].every(x=>Number.isInteger(x)&&nonneg(x))||d.count<1||d.count>expectedBatteryIntervals(d.day)||d.estimatedCount>d.count||d.gapCount>d.count||d.count*900000>Date.parse(d.last)-Date.parse(d.first)||!Array.isArray(d.candidates)||d.candidates.length!==5)return false;
    if((d.count*900000<Date.parse(d.last)-Date.parse(d.first)||(previousEnd!==undefined&&Date.parse(d.first)>previousEnd))&&d.gapCount===0)return false;
    for(let i=0;i<5;i++){
      const c=d.candidates[i];if(!object(c)||!exact(c,["capacityKwh","startStoredKwh","endStoredKwh",...energyFields])||c.capacityKwh!==BATTERY_CAPACITIES[i]||![c.startStoredKwh,c.endStoredKwh,...energyFields.map(k=>c[k])].every(nonneg))return false;
      const e=c as DailyBatteryEnergy,t=totals[i]!;
      const factor=Math.sqrt(.9);if(!close(e.conversionLossKwh,e.chargedKwh*(1-factor)+e.dischargedKwh*(1/factor-1))||(e.resetLossKwh>1e-7&&d.gapCount===0))return false;
      if(e.startStoredKwh>e.capacityKwh+1e-7||e.endStoredKwh>e.capacityKwh+1e-7||!close(e.startStoredKwh,t.end)||!close(e.startStoredKwh+e.chargedKwh-e.dischargedKwh-e.conversionLossKwh-e.resetLossKwh,e.endStoredKwh)||!close(e.netImportBeforeKwh-e.dischargedKwh,e.netImportAfterKwh)||!close(e.netExportBeforeKwh-e.chargedKwh,e.netExportAfterKwh)||e.netImportBeforeKwh>e.sourceImportKwh+1e-7||e.netExportBeforeKwh>e.sourceExportKwh+1e-7||!close(e.sourceImportKwh-e.sourceExportKwh,e.netImportBeforeKwh-e.netExportBeforeKwh))return false;
      if(i&&["sourceImportKwh","sourceExportKwh","netImportBeforeKwh","netExportBeforeKwh"].some(k=>!close(e[k as keyof DailyBatteryEnergy],d.candidates[0]![k as keyof DailyBatteryEnergy])))return false;
      t.charged+=e.chargedKwh;t.discharged+=e.dischargedKwh;t.loss+=e.conversionLossKwh+e.resetLossKwh;t.end=e.endStoredKwh;
    }
    previous=d.day;previousEnd=Date.parse(d.last);
  }
  return totals.every((t,i)=>technical[i]?.capacityKwh===BATTERY_CAPACITIES[i]&&close(t.charged,technical[i]!.chargedFromExportKwh)&&close(t.discharged,technical[i]!.shiftedKwh)&&close(t.loss,technical[i]!.lossesKwh)&&close(t.end,technical[i]!.endingStoredKwh));
};
