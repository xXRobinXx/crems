/** Public tariff-card facts. Personal usage never forms part of the catalog. */
export type ContractRegion = "Flanders" | "Wallonia" | "Brussels";
export type LocalContractCard = Readonly<{
  id: string; supplier: string; name: string; region: ContractRegion;
  tariff: "fixed" | "variable" | "dynamic" | "tou" | "spot_monthly"; contractMonths: number;
  publicationMonth: string; checkedOn: string; sourceUrl: string; sourceSha256: string;
  vatPercent: number | null; annualFeeEur: number; importDayCtKwh: number | null; importNightCtKwh: number | null;
  importSingleCtKwh?: number | null;
  priceBasis?: "fixed" | "published-variable" | "interval-required";
  formula?: string; verification?: "community-extracted"; archiveUrl?: string; conditions?: string;
  injection: Readonly<{ kind: "monthly-indexed" | "fixed" | "indexed" | "unavailable"; indicativeCtKwh: number | null; minimumCtKwh: number | null; formula: string }>;
}>;
export type LocalContractCatalog = Readonly<{ schemaVersion: 1 | 2; cards: readonly LocalContractCard[]; suppliers?: readonly Readonly<{id:string;name:string;currentCards:number;note:string}>[]; archiveRevision?: string; publicationMonth?: string }>;
export type LocalContractVolumes = Readonly<{
  annualDayKwh: number; annualNightKwh: number;
  annualInjectionDayKwh: number; annualInjectionNightKwh: number;
}>;
export type LocalCardStatus = "current" | "expired" | "future";

const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const number = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const date = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const sourceUrl = (value: unknown) => {
  if (!text(value, 2000)) return false;
  try { const url = new URL(value as string); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
};

export const validateLocalContractCard = (value: unknown): value is LocalContractCard => {
  if (!object(value) || !text(value.id, 120) || !text(value.supplier, 120) || !text(value.name, 200)) return false;
  const archived = value.verification === "community-extracted";
  if (!["Flanders", "Wallonia", "Brussels"].includes(String(value.region)) || !["fixed","variable","dynamic","tou","spot_monthly"].includes(String(value.tariff))) return false;
  if (!archived && value.tariff !== "fixed") return false;
  if (!number(value.contractMonths, archived ? 0 : 1, 120) || !Number.isInteger(value.contractMonths)) return false;
  if (typeof value.publicationMonth !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(value.publicationMonth) || !date(value.checkedOn)) return false;
  if (!sourceUrl(value.sourceUrl) || typeof value.sourceSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sourceSha256)) return false;
  if (!(number(value.vatPercent, 0, 100)||(archived&&value.vatPercent===null)) || !number(value.annualFeeEur, 0, 10_000)) return false;
  const rate=(n:unknown)=>number(n,archived&&value.tariff!=='fixed'?-1000:0,1000)||(archived&&n===null);
  if (!rate(value.importDayCtKwh)||!rate(value.importNightCtKwh)) return false;
  if (archived && (!sourceUrl(value.archiveUrl)||!text(value.conditions,500)||!text(value.formula,500)||!rate(value.importSingleCtKwh)||value.priceBasis!==(value.tariff==='fixed'?'fixed':value.tariff==='variable'?'published-variable':'interval-required'))) return false;
  const injection = value.injection;
  return object(injection) && (archived?['indexed','fixed','unavailable'].includes(String(injection.kind)):injection.kind === "monthly-indexed") && (number(injection.indicativeCtKwh,-1000,1000)||(archived&&injection.indicativeCtKwh===null)) && (number(injection.minimumCtKwh,-1000,1000)||(archived&&injection.minimumCtKwh===null)) && text(injection.formula, 300);
};

export const validateLocalContractCatalog = (value: unknown): value is LocalContractCatalog => {
  if (!object(value) || (value.schemaVersion!==1&&value.schemaVersion!==2) || !Array.isArray(value.cards) || value.cards.length > (value.schemaVersion===1?50:500)) return false;
  if (value.schemaVersion===2 && (typeof value.archiveRevision!=='string'||!/^[a-f0-9]{40}$/.test(value.archiveRevision)||typeof value.publicationMonth!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value.publicationMonth)||!Array.isArray(value.suppliers)||value.suppliers.length>30||!value.suppliers.every(s=>object(s)&&text(s.id,120)&&text(s.name,120)&&number(s.currentCards,0,500)&&Number.isInteger(s.currentCards)&&text(s.note,500))||new Set(value.suppliers.map(s=>s.id)).size!==value.suppliers.length))return false;
  if (!value.cards.every(validateLocalContractCard)) return false;
  const cards=value.cards;
  if (value.schemaVersion===1 && value.cards.some(card=>card.verification!==undefined))return false;
  if (value.schemaVersion===2) {
    const suppliers=value.suppliers as {id:string;name:string;currentCards:number}[];
    if(new Set(suppliers.map(s=>s.name)).size!==suppliers.length||cards.some(card=>!suppliers.some(s=>s.name===card.supplier))||suppliers.some(s=>s.currentCards!==cards.filter(card=>card.supplier===s.name&&card.publicationMonth===value.publicationMonth).length))return false;
  }
  return new Set(value.cards.map(card => card.id)).size === value.cards.length;
};

export const localCardStatus = (card: LocalContractCard, now: Date): LocalCardStatus => {
  if (!validateLocalContractCard(card) || !Number.isFinite(now.getTime())) throw new Error("Invalid catalog date or card");
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit" }).formatToParts(now);
  const month = `${parts.find(part => part.type === "year")!.value}-${parts.find(part => part.type === "month")!.value}`;
  return month === card.publicationMonth ? "current" : month > card.publicationMonth ? "expired" : "future";
};

export const estimateLocalContract = (card: LocalContractCard, region: ContractRegion, volumes: LocalContractVolumes, now: Date) => {
  if (!validateLocalContractCard(card) || card.region !== region || localCardStatus(card, now) !== "current") return undefined;
  if (!['fixed','variable'].includes(card.tariff)||card.importDayCtKwh===null||card.importNightCtKwh===null||card.vatPercent===null) return undefined;
  if (![volumes.annualDayKwh, volumes.annualNightKwh, volumes.annualInjectionDayKwh, volumes.annualInjectionNightKwh].every(value => number(value, 0, 100_000))) return undefined;
  if (volumes.annualDayKwh + volumes.annualNightKwh <= 0) return undefined;
  const importEnergyEur = Math.round((volumes.annualDayKwh * card.importDayCtKwh + volumes.annualNightKwh * card.importNightCtKwh)) / 100;
  // The printed injection figure is indicative, not a fixed rate for a year.
  const hasInjection = volumes.annualInjectionDayKwh + volumes.annualInjectionNightKwh > 0;
  return {
    importEnergyEur,
    annualFeeEur: card.annualFeeEur,
    importAndFeeEur: Math.round((importEnergyEur + card.annualFeeEur) * 100) / 100,
    injectionCreditEur: hasInjection ? null : 0,
    scope: "import-energy-and-supplier-fee" as const,
    priceBasis: card.tariff === 'variable' ? 'published-variable-scenario' as const : 'fixed' as const,
  };
};
