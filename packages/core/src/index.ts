export type DataQuality = "measured" | "estimated" | "incomplete";

export interface LiveMeterReading {
  timestamp: string;
  importPowerW: number;
  exportPowerW: number;
  importEnergyKwh: number;
  exportEnergyKwh: number;
  voltageV?: number;
  currentPriceEurKwh?: number;
  nextPriceEurKwh?: number;
  quality: DataQuality;
  source: "p1" | "simulator" | "home-assistant";
}

export interface QuarterInterval {
  start: string;
  end: string;
  importKwh: number;
  exportKwh: number;
  averagePowerW: number;
  maximumPowerW: number;
  sampleCount: number;
  quality: DataQuality;
}

export type ContractType = "fixed" | "variable" | "dynamic" | "time-of-use";

export interface EnergyContract {
  id: string;
  supplier: string;
  product: string;
  type: ContractType;
  region: "flanders" | "wallonia" | "brussels";
  validFrom: string;
  validUntil?: string;
  fixedFeeEurYear: number;
  importPriceEurKwh?: number;
  exportPriceEurKwh?: number;
  sourceLabel: string;
}

export interface CostBreakdown {
  energyEur: number;
  networkEur: number;
  taxesEur: number;
  fixedEur: number;
  capacityEur: number;
  injectionCreditEur: number;
  totalEur: number;
}

export type MissingFlatRateErrorCode = "MISSING_IMPORT_RATE" | "MISSING_EXPORT_RATE";

export class MissingFlatRateError extends Error {
  readonly name = "MissingFlatRateError";
  readonly code: MissingFlatRateErrorCode;

  constructor(code: MissingFlatRateErrorCode) {
    super(code === "MISSING_IMPORT_RATE" ? "Importtarief ontbreekt" : "Exporttarief ontbreekt");
    this.code = code;
  }
}

export type InvalidFlatVolumeErrorCode = "INVALID_IMPORT_VOLUME" | "INVALID_EXPORT_VOLUME";

export class InvalidFlatVolumeError extends Error {
  readonly name = "InvalidFlatVolumeError";
  readonly code: InvalidFlatVolumeErrorCode;

  constructor(code: InvalidFlatVolumeErrorCode) {
    super(code === "INVALID_IMPORT_VOLUME" ? "Importvolume is ongeldig" : "Exportvolume is ongeldig");
    this.code = code;
  }
}

export type InvalidFlatRateErrorCode = "INVALID_IMPORT_RATE" | "INVALID_EXPORT_RATE";

export class InvalidFlatRateError extends Error {
  readonly name = "InvalidFlatRateError";
  readonly code: InvalidFlatRateErrorCode;

  constructor(code: InvalidFlatRateErrorCode) {
    super(code === "INVALID_IMPORT_RATE" ? "Importtarief is ongeldig" : "Exporttarief is ongeldig");
    this.code = code;
  }
}

export const calculateFlatIntervalCost = (
  interval: Pick<QuarterInterval, "importKwh" | "exportKwh">,
  contract: Pick<EnergyContract, "importPriceEurKwh" | "exportPriceEurKwh">,
) => {
  if (!Number.isFinite(interval.importKwh) || interval.importKwh < 0) {
    throw new InvalidFlatVolumeError("INVALID_IMPORT_VOLUME");
  }
  if (!Number.isFinite(interval.exportKwh) || interval.exportKwh < 0) {
    throw new InvalidFlatVolumeError("INVALID_EXPORT_VOLUME");
  }
  if (interval.importKwh > 0 && contract.importPriceEurKwh === undefined) {
    throw new MissingFlatRateError("MISSING_IMPORT_RATE");
  }
  if (interval.importKwh > 0 && !Number.isFinite(contract.importPriceEurKwh)) {
    throw new InvalidFlatRateError("INVALID_IMPORT_RATE");
  }
  if (interval.exportKwh > 0 && contract.exportPriceEurKwh === undefined) {
    throw new MissingFlatRateError("MISSING_EXPORT_RATE");
  }
  if (interval.exportKwh > 0 && !Number.isFinite(contract.exportPriceEurKwh)) {
    throw new InvalidFlatRateError("INVALID_EXPORT_RATE");
  }
  const importCost = interval.importKwh === 0
    ? 0
    : interval.importKwh * (contract.importPriceEurKwh ?? 0);
  const exportCredit = interval.exportKwh === 0
    ? 0
    : interval.exportKwh * (contract.exportPriceEurKwh ?? 0);
  return importCost - exportCredit;
};

export interface FlatEnergyCostAggregation {
  intervalCount: number;
  totalImportKwh: number;
  totalExportKwh: number;
  importCostEur: number;
  exportCreditEur: number;
  netEnergyEur: number;
}

export const aggregateFlatIntervalCosts = (
  intervals: ReadonlyArray<Readonly<Pick<QuarterInterval, "importKwh" | "exportKwh">>>,
  contract: Pick<EnergyContract, "importPriceEurKwh" | "exportPriceEurKwh">,
): FlatEnergyCostAggregation => {
  let totalImportKwh = 0;
  let totalExportKwh = 0;

  for (const interval of intervals) {
    calculateFlatIntervalCost(interval, contract);
    totalImportKwh += interval.importKwh;
    totalExportKwh += interval.exportKwh;
  }

  const importCostEur = totalImportKwh === 0
    ? 0
    : totalImportKwh * (contract.importPriceEurKwh ?? 0);
  const exportCreditEur = totalExportKwh === 0
    ? 0
    : totalExportKwh * (contract.exportPriceEurKwh ?? 0);

  return {
    intervalCount: intervals.length,
    totalImportKwh,
    totalExportKwh,
    importCostEur,
    exportCreditEur,
    netEnergyEur: importCostEur - exportCreditEur,
  };
};

export type FlatContractComparisonInput = Readonly<Pick<
  EnergyContract,
  "id" | "sourceLabel" | "importPriceEurKwh" | "exportPriceEurKwh"
>>;

export interface FlatContractCostResult {
  id: string;
  sourceLabel: string;
  aggregation: FlatEnergyCostAggregation;
}

export type FlatContractComparisonWinner = "current" | "candidate" | "equal";

export interface FlatContractComparison {
  current: FlatContractCostResult;
  candidate: FlatContractCostResult;
  candidateMinusCurrentEur: number;
  winner: FlatContractComparisonWinner;
}

export const compareFlatContracts = (
  intervals: ReadonlyArray<Readonly<Pick<QuarterInterval, "importKwh" | "exportKwh">>>,
  currentContract: FlatContractComparisonInput,
  candidateContract: FlatContractComparisonInput,
): FlatContractComparison => {
  const currentAggregation = aggregateFlatIntervalCosts(intervals, currentContract);
  const candidateAggregation = aggregateFlatIntervalCosts(intervals, candidateContract);
  const candidateMinusCurrentEur = candidateAggregation.netEnergyEur - currentAggregation.netEnergyEur;

  return {
    current: {
      id: currentContract.id,
      sourceLabel: currentContract.sourceLabel,
      aggregation: currentAggregation,
    },
    candidate: {
      id: candidateContract.id,
      sourceLabel: candidateContract.sourceLabel,
      aggregation: candidateAggregation,
    },
    candidateMinusCurrentEur,
    winner: candidateMinusCurrentEur < 0
      ? "candidate"
      : candidateMinusCurrentEur > 0
        ? "current"
        : "equal",
  };
};

export type ProfileFlatContractInput = Readonly<{name:string;type:"fixed"|"variable";validFrom:string;validUntil:string;importRateCtKwh:number;exportRateCtKwh:number}>;
export type FlatProfileInput = Readonly<{period:{start:string;end:string};measuredImportKwh:number;estimatedImportKwh:number;measuredExportKwh:number;estimatedExportKwh:number}>;
export type ProfileContractCost = Readonly<{name:string;type:"fixed"|"variable";measured:{importKwh:number;exportKwh:number;importCostEur:number;exportCreditEur:number;netEnergyEur:number};estimated:{importKwh:number;exportKwh:number;importCostEur:number;exportCreditEur:number;netEnergyEur:number};totalEnergyEur:number}>;
export type ProfileFlatContractComparison = Readonly<{current:ProfileContractCost;candidate:ProfileContractCost;candidateMinusCurrentEur:number;winner:"current"|"candidate"|"equal"}>;
const validProfileVolume=(value:number)=>Number.isFinite(value)&&value>=0;
const covers=(contract:ProfileFlatContractInput,profile:FlatProfileInput)=>Number.isFinite(Date.parse(contract.validFrom))&&Number.isFinite(Date.parse(contract.validUntil))&&Date.parse(contract.validUntil)>Date.parse(contract.validFrom)&&Date.parse(contract.validFrom)<=Date.parse(profile.period.start)&&Date.parse(contract.validUntil)>=Date.parse(profile.period.end);
const validProfileContract=(contract:ProfileFlatContractInput,profile:FlatProfileInput)=>contract.name.trim()!==""&&(contract.type==="fixed"||contract.type==="variable")&&Number.isFinite(contract.importRateCtKwh)&&contract.importRateCtKwh>=0&&Number.isFinite(contract.exportRateCtKwh)&&contract.exportRateCtKwh>=0&&covers(contract,profile);
const profileCost=(profile:FlatProfileInput,contract:ProfileFlatContractInput):ProfileContractCost=>{const rates={importPriceEurKwh:contract.importRateCtKwh/100,exportPriceEurKwh:contract.exportRateCtKwh/100};const part=(importKwh:number,exportKwh:number)=>{const aggregation=aggregateFlatIntervalCosts([{importKwh,exportKwh}],rates);return{importKwh,exportKwh,importCostEur:aggregation.importCostEur,exportCreditEur:aggregation.exportCreditEur,netEnergyEur:aggregation.netEnergyEur};};const measured=part(profile.measuredImportKwh,profile.measuredExportKwh),estimated=part(profile.estimatedImportKwh,profile.estimatedExportKwh);return{name:contract.name,type:contract.type,measured,estimated,totalEnergyEur:measured.netEnergyEur+estimated.netEnergyEur};};
export const compareProfileFlatContracts=(profile:FlatProfileInput,current:ProfileFlatContractInput,candidate:ProfileFlatContractInput):ProfileFlatContractComparison|undefined=>{const start=Date.parse(profile.period.start),end=Date.parse(profile.period.end);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||![profile.measuredImportKwh,profile.estimatedImportKwh,profile.measuredExportKwh,profile.estimatedExportKwh].every(validProfileVolume)||!validProfileContract(current,profile)||!validProfileContract(candidate,profile))return;const currentCost=profileCost(profile,current),candidateCost=profileCost(profile,candidate),difference=candidateCost.totalEnergyEur-currentCost.totalEnergyEur;return{current:currentCost,candidate:candidateCost,candidateMinusCurrentEur:difference,winner:difference<0?"candidate":difference>0?"current":"equal"};};
