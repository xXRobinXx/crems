export type BatteryIntervalObservation = Readonly<{start:string;end:string;sourceImportKwh:number;sourceExportKwh:number;netImportBeforeKwh:number;netExportBeforeKwh:number;chargedKwh:number;dischargedKwh:number;netImportAfterKwh:number;netExportAfterKwh:number;startStoredKwh:number;endStoredKwh:number;conversionLossKwh:number;resetLossKwh:number;gap:boolean;estimated:boolean}>;
export type BatterySimulationConfig = Readonly<{ capacityKwh: number; maxPowerKw: number; roundTripEfficiency: number; importRateEurKwh?: number; exportRateEurKwh?: number; gapPolicy?: "reject" | "reset";onInterval?:(interval:BatteryIntervalObservation)=>void }>;
export type BatteryFlowInterval = Readonly<{ start: string; end: string; importKwh: number; exportKwh: number; priceEurMwh?: number;estimated?:boolean }>;
export type BatterySimulationResult = Readonly<{ shiftedKwh: number; chargedFromExportKwh: number; avoidedImportKwh: number; remainingExportKwh: number; equivalentCycles: number; endingStoredKwh:number; lossesKwh:number; estimatedEnergyComponentEur?: number; avoidedImportWholesaleValueEur?:number; foregoneExportWholesaleValueEur?:number; wholesaleTimeShiftValueEur?:number }>;

const finitePositive = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0;
const finiteNonNegative = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;

export const createBatterySimulator = (config: BatterySimulationConfig) => {
  if (!finitePositive(config.capacityKwh) || !finitePositive(config.maxPowerKw) || !finitePositive(config.roundTripEfficiency) || config.roundTripEfficiency > 1 || (config.importRateEurKwh !== undefined && !finiteNonNegative(config.importRateEurKwh)) || (config.exportRateEurKwh !== undefined && !finiteNonNegative(config.exportRateEurKwh))) return undefined;
  const factor = Math.sqrt(config.roundTripEfficiency); let storedKwh = 0, chargedFromExportKwh = 0, avoidedImportKwh = 0, remainingExportKwh = 0, avoidedImportWholesaleValueEur=0,foregoneExportWholesaleValueEur=0,missingPrice=false, previousEnd:number|undefined, pending: BatteryFlowInterval | undefined, failed = false, finished = false, finalResult: BatterySimulationResult | undefined;
  const process = (flow: BatteryFlowInterval) => {
    const start = Date.parse(flow.start), end = Date.parse(flow.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start !== 900_000 || !finiteNonNegative(flow.importKwh) || !finiteNonNegative(flow.exportKwh)) { failed = true; return; }
    const startStoredKwh=storedKwh;let resetLossKwh=0;const gap=previousEnd!==undefined&&start>previousEnd;
    if(previousEnd!==undefined&&start!==previousEnd){
      if(config.gapPolicy==="reset"&&start>previousEnd){resetLossKwh=storedKwh;storedKwh=0;}
      else{failed=true;return;}
    }
    previousEnd = end;
    const netImport = Math.max(0, flow.importKwh - flow.exportKwh), netExport = Math.max(0, flow.exportKwh - flow.importKwh), quarterPowerLimitKwh = config.maxPowerKw * 0.25;
    const chargeInputKwh = Math.min(netExport, quarterPowerLimitKwh, (config.capacityKwh - storedKwh) / factor);
    storedKwh += chargeInputKwh * factor; chargedFromExportKwh += chargeInputKwh; remainingExportKwh += netExport - chargeInputKwh;
    const dischargeOutputKwh = Math.min(netImport, quarterPowerLimitKwh, storedKwh * factor);
    storedKwh -= dischargeOutputKwh / factor; avoidedImportKwh += dischargeOutputKwh;
    if(flow.priceEurMwh===undefined)missingPrice=true;else if(!Number.isFinite(flow.priceEurMwh)){failed=true;return;}else{foregoneExportWholesaleValueEur+=chargeInputKwh*flow.priceEurMwh/1000;avoidedImportWholesaleValueEur+=dischargeOutputKwh*flow.priceEurMwh/1000;}
    config.onInterval?.({start:flow.start,end:flow.end,sourceImportKwh:flow.importKwh,sourceExportKwh:flow.exportKwh,netImportBeforeKwh:netImport,netExportBeforeKwh:netExport,chargedKwh:chargeInputKwh,dischargedKwh:dischargeOutputKwh,netImportAfterKwh:netImport-dischargeOutputKwh,netExportAfterKwh:netExport-chargeInputKwh,startStoredKwh,endStoredKwh:storedKwh,conversionLossKwh:chargeInputKwh*(1-factor)+dischargeOutputKwh*(1/factor-1),resetLossKwh,gap,estimated:flow.estimated===true});
  };
  return { push(flow: BatteryFlowInterval) { if (failed || finished) return; const start = Date.parse(flow.start), end = Date.parse(flow.end); if (!Number.isFinite(start) || !Number.isFinite(end) || end - start !== 900_000 || !finiteNonNegative(flow.importKwh) || !finiteNonNegative(flow.exportKwh)) { failed = true; return; } if (!pending) { pending = { ...flow }; return; } const pendingStart = Date.parse(pending.start); if (start < pendingStart) { failed = true; return; } if (start === pendingStart) { if (flow.end !== pending.end||flow.priceEurMwh!==pending.priceEurMwh) { failed = true; return; } pending = { ...pending, importKwh: pending.importKwh + flow.importKwh, exportKwh: pending.exportKwh + flow.exportKwh, estimated: pending.estimated === true || flow.estimated === true }; return; } process(pending); pending = { ...flow }; }, finish(): BatterySimulationResult | undefined { if (finished) return finalResult; finished = true; if (pending) process(pending); pending = undefined; if (failed) return undefined; const wholesale=missingPrice?{}:{avoidedImportWholesaleValueEur,foregoneExportWholesaleValueEur,wholesaleTimeShiftValueEur:avoidedImportWholesaleValueEur-foregoneExportWholesaleValueEur};const lossesKwh=Math.max(0,chargedFromExportKwh-avoidedImportKwh-storedKwh);const result: BatterySimulationResult = { shiftedKwh: avoidedImportKwh, chargedFromExportKwh, avoidedImportKwh, remainingExportKwh, equivalentCycles: avoidedImportKwh / config.capacityKwh,endingStoredKwh:storedKwh,lossesKwh,...wholesale };
  finalResult = config.importRateEurKwh !== undefined && config.exportRateEurKwh !== undefined ? { ...result, estimatedEnergyComponentEur: avoidedImportKwh * config.importRateEurKwh - chargedFromExportKwh * config.exportRateEurKwh } : result;
  return finalResult; } };
};

export const simulateBatteryFromGridFlows = (flows: ReadonlyArray<BatteryFlowInterval>, config: BatterySimulationConfig): BatterySimulationResult | undefined => {
  const simulator = createBatterySimulator(config); if (!simulator) return undefined; for (const flow of flows) simulator.push(flow); return simulator.finish();
};
