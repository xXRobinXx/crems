import {compareBatteryCandidates,type BatteryCapacity, type CandidateFinancialResult, type FinancialAssumptions } from "./battery-comparison.ts";
import {validateBatteryDays,type BatteryDay} from "./battery-daily-report.ts";
export const BATTERY_REPORT_KEY="crems.battery-analysis.v3";export const BATTERY_ANALYSIS_KEY="crems.battery-analysis.v2";export const LEGACY_BATTERY_KEYS=["crems.battery-analysis.v1",BATTERY_ANALYSIS_KEY] as const;
export type BatteryTechnicalSnapshot=Readonly<{capacityKwh:BatteryCapacity;powerKw:number;shiftedKwh:number;chargedFromExportKwh:number;endingStoredKwh:number;lossesKwh:number;equivalentCycles:number;wholesaleTimeShiftValueEur?:number}>;
export type BatteryQualitySnapshot=Readonly<{period:{start:string;end:string};integrityReliable:boolean;estimatedCount:number;gapCount:number;duplicateCount:number;overlapCount:number}>;
export type BatteryFinancialSnapshot=Readonly<{assumptions:FinancialAssumptions;results:readonly CandidateFinancialResult[];recommendedCapacityKwh:BatteryCapacity|null}>;
export type LocalBatteryReport=Readonly<{version:3;savedAt:string;quality:BatteryQualitySnapshot;priceSource?:string;technical:readonly BatteryTechnicalSnapshot[];financial?:BatteryFinancialSnapshot;daily?:BatteryDay[]}>;
export type LegacyBatteryReport=Readonly<{key:string;version:1|2;technical:readonly BatteryTechnicalSnapshot[];quality:BatteryQualitySnapshot;priceSource?:string}>;
export type BatteryStorageState={status:"empty"}|{status:"current";report:LocalBatteryReport}|{status:"legacy";report:LegacyBatteryReport}|{status:"corrupt";key:string}|{status:"unavailable"};
export const getBrowserStorage=(host:{readonly localStorage:Storage}|undefined):Storage|undefined=>{try{return host?.localStorage;}catch{return undefined;}};
type Read=Pick<Storage,"getItem">;type Write=Pick<Storage,"setItem">;type Remove=Pick<Storage,"removeItem">;const capacities=[3,5,7,10,13] as const;
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);const finite=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v);const nonneg=(v:unknown):v is number=>finite(v)&&v>=0;const exact=(v:Record<string,unknown>,keys:readonly string[])=>Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const period=(v:unknown):v is {start:string;end:string}=>obj(v)&&exact(v,["start","end"])&&typeof v.start==="string"&&typeof v.end==="string"&&Number.isFinite(Date.parse(v.start))&&Number.isFinite(Date.parse(v.end))&&Date.parse(v.end)>Date.parse(v.start);
const quality=(v:unknown):v is BatteryQualitySnapshot=>obj(v)&&exact(v,["period","integrityReliable","estimatedCount","gapCount","duplicateCount","overlapCount"])&&period(v.period)&&typeof v.integrityReliable==="boolean"&&[v.estimatedCount,v.gapCount,v.duplicateCount,v.overlapCount].every(x=>Number.isInteger(x)&&nonneg(x));
const tech=(v:unknown,i:number):v is BatteryTechnicalSnapshot=>{if(!obj(v))return false;const capacity=v.capacityKwh;return exact(v,["capacityKwh","powerKw","shiftedKwh","chargedFromExportKwh","endingStoredKwh","lossesKwh","equivalentCycles",...(v.wholesaleTimeShiftValueEur===undefined?[]:["wholesaleTimeShiftValueEur"])])&&capacity===capacities[i]&&typeof capacity==="number"&&v.powerKw===capacity/2&&[v.shiftedKwh,v.chargedFromExportKwh,v.endingStoredKwh,v.lossesKwh,v.equivalentCycles].every(nonneg)&&(v.wholesaleTimeShiftValueEur===undefined||finite(v.wholesaleTimeShiftValueEur));};
const techs=(v:unknown):v is readonly BatteryTechnicalSnapshot[]=>Array.isArray(v)&&v.length===5&&v.every(tech);
const assumptions=(v:unknown):v is FinancialAssumptions=>{if(!obj(v)||!obj(v.investmentsEur))return false;const investments=v.investmentsEur,life=v.lifeYears,warranty=v.warrantyYears,degradation=v.annualDegradationPercent,discount=v.discountRatePercent;return exact(v,["confirmed","importRateCtKwh","exportRateCtKwh","lifeYears","annualDegradationPercent","discountRatePercent","investmentsEur","contractName","contractType","effectiveStart","effectiveEnd","quoteSource","quoteDate","warrantyYears","pricesIncludeVat"])&&v.confirmed===true&&v.pricesIncludeVat===true&&typeof v.contractName==="string"&&v.contractName.trim()!==""&&v.contractName.length<=200&&typeof v.quoteSource==="string"&&v.quoteSource.trim()!==""&&v.quoteSource.length<=200&&(v.contractType==="fixed"||v.contractType==="variable")&&typeof v.effectiveStart==="string"&&typeof v.effectiveEnd==="string"&&typeof v.quoteDate==="string"&&[v.effectiveStart,v.effectiveEnd,v.quoteDate].every(x=>Number.isFinite(Date.parse(x)))&&Date.parse(v.effectiveEnd)>Date.parse(v.effectiveStart)&&[v.importRateCtKwh,v.exportRateCtKwh,degradation,discount].every(nonneg)&&typeof degradation==="number"&&degradation<100&&typeof discount==="number"&&discount<100&&typeof life==="number"&&Number.isInteger(life)&&typeof warranty==="number"&&Number.isInteger(warranty)&&life>0&&life<=30&&warranty>0&&warranty<=30&&exact(investments,capacities.map(String))&&capacities.every(c=>nonneg(investments[c])&&investments[c]>0);};
const scenario=(v:unknown)=>obj(v)&&exact(v,["annualFactor","cashflowsEur","npvEur","paybackYears"])&&(v.annualFactor===.8||v.annualFactor===1||v.annualFactor===1.2)&&Array.isArray(v.cashflowsEur)&&v.cashflowsEur.every(finite)&&finite(v.npvEur)&&(v.paybackYears===null||nonneg(v.paybackYears));
const result=(v:unknown,i:number)=>obj(v)&&exact(v,["capacityKwh","investmentEur","annualEnergySavingEur","low","base","high"])&&v.capacityKwh===capacities[i]&&nonneg(v.investmentEur)&&finite(v.annualEnergySavingEur)&&scenario(v.low)&&scenario(v.base)&&scenario(v.high);
// The v3 validation rules stay fixed when future calculation versions change.
// Check the saved amounts in place; never replace the saved scenario or run the current engine on load.
const v3AmountsMatch=(r:CandidateFinancialResult,t:BatteryTechnicalSnapshot,a:FinancialAssumptions,q:BatteryQualitySnapshot)=>{
  const cents=(n:number)=>Math.round(n*100)/100;
  const years=(Date.parse(q.period.end)-Date.parse(q.period.start))/(365.2425*86_400_000);
  const annual=(t.shiftedKwh*a.importRateCtKwh/100-t.chargedFromExportKwh*a.exportRateCtKwh/100)/years;
  if(r.annualEnergySavingEur!==cents(annual))return false;
  return [r.low,r.base,r.high].every(s=>{
    let npv=-r.investmentEur,balance=-r.investmentEur,payback:number|null=null;
    for(let year=0;year<s.cashflowsEur.length;year++){
      const flow=s.cashflowsEur[year]!;
      if(flow!==cents(annual*s.annualFactor*(1-a.annualDegradationPercent/100)**year))return false;
      const before=balance;balance+=flow;npv+=flow/(1+a.discountRatePercent/100)**(year+1);
      if(payback===null&&before<0&&balance>=0&&flow>0)payback=cents(year+(-before/flow));
    }
    return s.npvEur===cents(npv)&&s.paybackYears===payback;
  });
};
const financial=(v:unknown,q:BatteryQualitySnapshot,t:readonly BatteryTechnicalSnapshot[]):v is BatteryFinancialSnapshot=>{
  if(!obj(v)||!exact(v,["assumptions","results","recommendedCapacityKwh"])||!assumptions(v.assumptions)||!Array.isArray(v.results)||v.results.length!==5||!v.results.every(result))return false;
  const a=v.assumptions,r=v.results as CandidateFinancialResult[];
  if(!q.integrityReliable||q.estimatedCount!==0||q.gapCount!==0||q.duplicateCount!==0||q.overlapCount!==0||Date.parse(q.period.end)-Date.parse(q.period.start)<365*86_400_000||Date.parse(a.effectiveStart)>Date.parse(q.period.start)||Date.parse(a.effectiveEnd)<Date.parse(q.period.end))return false;
  if(r.some((x,i)=>x.investmentEur!==a.investmentsEur[capacities[i]!]||x.low.annualFactor!==.8||x.base.annualFactor!==1||x.high.annualFactor!==1.2||[x.low,x.base,x.high].some(s=>s.cashflowsEur.length!==a.lifeYears||(s.paybackYears!==null&&s.paybackYears>a.lifeYears))))return false;
  const best=[...r].sort((x,y)=>y.base.npvEur-x.base.npvEur||x.capacityKwh-y.capacityKwh)[0]!;
  return v.recommendedCapacityKwh===(best.base.npvEur>0?best.capacityKwh:null)&&r.every((x,i)=>v3AmountsMatch(x,t[i]!,a,q));
};
export const validateBatteryReport=(v:unknown):v is LocalBatteryReport=>obj(v)&&exact(v,["version","savedAt","quality","technical",...(v.priceSource===undefined?[]:["priceSource"]),...(v.financial===undefined?[]:["financial"]),...(v.daily===undefined?[]:["daily"])])&&v.version===3&&typeof v.savedAt==="string"&&Number.isFinite(Date.parse(v.savedAt))&&quality(v.quality)&&techs(v.technical)&&(v.priceSource===undefined||(typeof v.priceSource==="string"&&v.priceSource.length<=100))&&(v.financial===undefined||financial(v.financial,v.quality,v.technical))&&(v.daily===undefined||validateBatteryDays(v.daily,v.technical,v.quality.period));
const legacy=(key:string,v:unknown):LegacyBatteryReport|undefined=>{
  if(!obj(v)||(v.version!==1&&v.version!==2)||!period(v.period)||!Array.isArray(v.comparisons))return;
  const counts=["estimatedCount","gapCount","duplicateCount","overlapCount"] as const;
  if((v.integrityReliable!==undefined&&typeof v.integrityReliable!=="boolean")||counts.some(k=>v[k]!==undefined&&(!Number.isInteger(v[k])||!nonneg(v[k])))||(v.priceSource!==undefined&&(typeof v.priceSource!=="string"||v.priceSource.length>100)))return;
  const complete=counts.every(k=>v[k]!==undefined)&&v.integrityReliable!==undefined&&v.comparisons.every(x=>obj(x)&&["chargedFromExportKwh","endingStoredKwh","lossesKwh"].every(k=>x[k]!==undefined));
  const q={period:v.period,integrityReliable:complete&&v.integrityReliable===true,estimatedCount:(v.estimatedCount??0) as number,gapCount:(v.gapCount??0) as number,duplicateCount:(v.duplicateCount??0) as number,overlapCount:(v.overlapCount??0) as number};
  const t=v.comparisons.map(x=>{if(!obj(x))return x;const base={capacityKwh:x.capacityKwh,powerKw:x.powerKw,shiftedKwh:x.shiftedKwh,chargedFromExportKwh:x.chargedFromExportKwh===undefined?x.shiftedKwh:x.chargedFromExportKwh,endingStoredKwh:x.endingStoredKwh===undefined?0:x.endingStoredKwh,lossesKwh:x.lossesKwh===undefined?0:x.lossesKwh,equivalentCycles:x.equivalentCycles};return x.wholesaleTimeShiftValueEur===undefined?base:{...base,wholesaleTimeShiftValueEur:x.wholesaleTimeShiftValueEur};});
  if(!quality(q)||!techs(t))return;
  return{key,version:v.version,quality:q,technical:t,...(typeof v.priceSource==="string"?{priceSource:v.priceSource}:{})};
};
export const loadBatteryStorageState=(s:Read|undefined):BatteryStorageState=>{
  if(!s)return{status:"unavailable"};
  for(const key of [BATTERY_REPORT_KEY,...LEGACY_BATTERY_KEYS]){
    let raw:string|null;try{raw=s.getItem(key);}catch{return{status:"unavailable"};}
    if(raw===null)continue;
    try{const value:unknown=JSON.parse(raw);if(key===BATTERY_REPORT_KEY)return validateBatteryReport(value)?{status:"current",report:value}:{status:"corrupt",key};const report=legacy(key,value);return report?{status:"legacy",report}:{status:"corrupt",key};}catch{return{status:"corrupt",key};}
  }
  return{status:"empty"};
};
export const saveBatteryReport=(s:Write|undefined,r:LocalBatteryReport)=>{
  if(!s||!validateBatteryReport(r))return false;
  if(r.financial){const computed=compareBatteryCandidates(r.quality,r.technical,r.financial.assumptions);if(computed.status!=="financial"||JSON.stringify(r.financial.results)!==JSON.stringify(computed.candidates)||r.financial.recommendedCapacityKwh!==computed.recommendedCapacityKwh)return false;}
  try{s.setItem(BATTERY_REPORT_KEY,JSON.stringify(r));return true;}catch{return false;}
};
export const removeBatteryStorage=(s:Remove|undefined,key=BATTERY_REPORT_KEY)=>{try{if(!s)return false;s.removeItem(key);return true;}catch{return false;}};
export const convertLegacyReport=(r:LegacyBatteryReport,savedAt:string):LocalBatteryReport=>r.priceSource===undefined?{version:3,savedAt,quality:r.quality,technical:r.technical}:{version:3,savedAt,quality:r.quality,priceSource:r.priceSource,technical:r.technical};
export type LocalBatteryAnalysis=LocalBatteryReport;export const loadLocalBatteryAnalysis=(s:Read)=>{const state=loadBatteryStorageState(s);return state.status==="current"?state.report:undefined;};export const saveLocalBatteryAnalysis=saveBatteryReport;export const removeLocalBatteryAnalysis=removeBatteryStorage;
