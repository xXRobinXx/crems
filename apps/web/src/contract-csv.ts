import type { CsvPreview } from "./csv-preview";
import type { ContractMarketInput } from "./contract-market";

export type ContractCsvTotals=Readonly<{annualDayKwh:number;annualNightKwh:number;annualInjectionDayKwh:number;annualInjectionNightKwh:number;period:{start:string;end:string};importKwh:number;exportKwh:number}>;
export const contractCsvTotals=(preview:CsvPreview|undefined):ContractCsvTotals|undefined=>{
  if(!preview||preview.status!=="success"||!preview.period||!preview.integrityReliable||preview.skippedCount||preview.estimatedCount||preview.gapCount||preview.overlapCount||preview.duplicateCount)return;
  const duration=Date.parse(preview.period.end)-Date.parse(preview.period.start);
  if(!Number.isFinite(duration)||duration<364*24*60*60*1000||duration>367*24*60*60*1000)return;
  const registerPeriods=Object.values(preview.registerCoverage);if(registerPeriods.some(period=>!period||Date.parse(period.end)-Date.parse(period.start)<364*24*60*60*1000||Math.abs(Date.parse(period.start)-Date.parse(preview.period!.start))>15*60*1000||Math.abs(Date.parse(period.end)-(Date.parse(preview.period!.end)+15*60*1000))>15*60*1000))return;
  return {annualDayKwh:preview.registerKwh.importDay,annualNightKwh:preview.registerKwh.importNight,annualInjectionDayKwh:preview.registerKwh.exportDay,annualInjectionNightKwh:preview.registerKwh.exportNight,period:preview.period,importKwh:preview.registerKwh.importDay+preview.registerKwh.importNight,exportKwh:preview.registerKwh.exportDay+preview.registerKwh.exportNight};
};
// Only the explicit form handoff rounds accumulated floating-point residue.
// Keep the checked source totals and manually entered volumes unchanged.
const formKwh=(value:number)=>Number(value.toFixed(6));
export const applyContractCsvTotals=(input:ContractMarketInput,totals:ContractCsvTotals):ContractMarketInput=>({...input,annualDayKwh:formKwh(totals.annualDayKwh),annualNightKwh:formKwh(totals.annualNightKwh),annualInjectionDayKwh:formKwh(totals.annualInjectionDayKwh),annualInjectionNightKwh:formKwh(totals.annualInjectionNightKwh)});
