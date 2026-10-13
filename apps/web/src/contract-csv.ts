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

export type ContractCsvIndication=Readonly<{totals:ContractCsvTotals;days:number;estimatedCount:number;gapCount:number;duplicateCount:number;overlapCount:number;skippedCount:number}>;
/** A scenario based on recorded volumes, never a repair of missing or overlapping intervals. */
export const contractCsvIndication=(preview:CsvPreview|undefined):ContractCsvIndication|undefined=>{
  if(!preview||preview.status!=="success"||!preview.period||!preview.integrityReliable||contractCsvTotals(preview))return;
  const days=(Date.parse(preview.period.end)-Date.parse(preview.period.start))/86400000;
  if(!Number.isFinite(days)||days<90||days>3660)return;
  if(Object.values(preview.registerCoverage).some(coverage=>!coverage||!Number.isFinite(Date.parse(coverage.start))||!Number.isFinite(Date.parse(coverage.end))||Date.parse(coverage.end)-Date.parse(coverage.start)<90*86400000))return;
  if([preview.estimatedCount,preview.gapCount,preview.duplicateCount,preview.overlapCount,preview.skippedCount].some(value=>!Number.isInteger(value)||value<0))return;
  if(Object.values(preview.registerKwh).some(value=>!Number.isFinite(value)||value<0))return;
  const factor=365.2425/days;
  const totals={annualDayKwh:preview.registerKwh.importDay*factor,annualNightKwh:preview.registerKwh.importNight*factor,annualInjectionDayKwh:preview.registerKwh.exportDay*factor,annualInjectionNightKwh:preview.registerKwh.exportNight*factor,period:preview.period,importKwh:preview.importKwh,exportKwh:preview.exportKwh};
  if([totals.annualDayKwh,totals.annualNightKwh,totals.annualInjectionDayKwh,totals.annualInjectionNightKwh].some(value=>value>100000))return;
  return {totals,days,estimatedCount:preview.estimatedCount,gapCount:preview.gapCount,duplicateCount:preview.duplicateCount,overlapCount:preview.overlapCount,skippedCount:preview.skippedCount};
};
