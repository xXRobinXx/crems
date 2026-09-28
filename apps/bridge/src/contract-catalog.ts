import { createHmac, randomBytes } from "node:crypto";

const API_ORIGIN = "https://api.econtract.be";
const MAX_BYTES = 2_000_000;
const REGIONS = new Set(["Flanders", "Wallonia", "Brussels"]);

export type ContractCompareInput = Readonly<{
  postalCode: string; region: "Flanders" | "Wallonia" | "Brussels";
  annualDayKwh: number; annualNightKwh: number; annualInjectionDayKwh: number; annualInjectionNightKwh: number;
  tariff: "f" | "i" | "no"; householdSize: number; directDebit: boolean;
}>;
export class ContractCatalogConfigurationError extends Error {}
export class ContractCatalogUpstreamError extends Error {}
export class ContractCatalogInputError extends Error {}
export type ContractCatalogConfig = Readonly<{ publicKey: string; privateKey: string; affiliateId: string }>;
export type ContractCatalogFetch = typeof fetch;

const regionByPostalCode = (postalCode: string): ContractCompareInput["region"] => {
  const code = Number(postalCode);
  if (code < 1000 || code > 9992) throw new ContractCatalogInputError();
  if (code >= 1000 && code <= 1210) return "Brussels";
  if ((code >= 1300 && code <= 1499) || (code >= 4000 && code <= 7999)) return "Wallonia";
  return "Flanders";
};

export const validateContractCompareInput = (value: unknown): ContractCompareInput => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContractCatalogInputError();
  const input = value as Record<string, unknown>;
  const allowed = new Set(["postalCode", "region", "annualDayKwh", "annualNightKwh", "annualInjectionDayKwh", "annualInjectionNightKwh", "tariff", "householdSize", "directDebit"]);
  if (Object.keys(input).some(key => !allowed.has(key)) || Object.keys(input).length !== allowed.size) throw new ContractCatalogInputError();
  const postalCode = typeof input.postalCode === "string" ? input.postalCode.trim() : "";
  if (!/^\d{4}$/.test(postalCode) || typeof input.region !== "string" || !REGIONS.has(input.region) || regionByPostalCode(postalCode) !== input.region) throw new ContractCatalogInputError();
  const numeric = [input.annualDayKwh, input.annualNightKwh, input.annualInjectionDayKwh, input.annualInjectionNightKwh, input.householdSize];
  if (numeric.some(item => typeof item !== "number" || !Number.isFinite(item))) throw new ContractCatalogInputError();
  const [annualDayKwh = Number.NaN, annualNightKwh = Number.NaN, annualInjectionDayKwh = Number.NaN, annualInjectionNightKwh = Number.NaN, householdSize = Number.NaN] = numeric as number[];
  if (annualDayKwh < 0 || annualDayKwh > 100_000 || annualNightKwh < 0 || annualNightKwh > 100_000 || annualInjectionDayKwh < 0 || annualInjectionDayKwh > 100_000 || annualInjectionNightKwh < 0 || annualInjectionNightKwh > 100_000 || !Number.isInteger(householdSize) || householdSize < 1 || householdSize > 20) throw new ContractCatalogInputError();
  if (!( ["f", "i", "no"] as unknown[]).includes(input.tariff) || typeof input.directDebit !== "boolean") throw new ContractCatalogInputError();
  return { postalCode, region: input.region as ContractCompareInput["region"], annualDayKwh, annualNightKwh, annualInjectionDayKwh, annualInjectionNightKwh, tariff: input.tariff as ContractCompareInput["tariff"], householdSize, directDebit: input.directDebit };
};

const signedParams = (config: ContractCatalogConfig, params: URLSearchParams, now: number, nonce: string) => {
  const timestamp = String(Math.floor(now / 1000));
  const apiKey = createHmac("sha1", `${config.privateKey}${timestamp}${nonce}`).update(config.publicKey).digest("hex");
  params.set("key", config.publicKey); params.set("timestamp", timestamp); params.set("nonce", nonce); params.set("apikey", apiKey);
  return params;
};

const readBoundedJson = async (response: Response): Promise<unknown> => {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BYTES) throw new ContractCatalogUpstreamError();
  if (!response.body) throw new ContractCatalogUpstreamError();
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new ContractCatalogUpstreamError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))); } catch { throw new ContractCatalogUpstreamError(); }
};

const stringValue = (value: unknown, max = 500): string | undefined => typeof value === "string" && value.length <= max ? value : undefined;
const numberValue = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined;
const normalizeProduct = (value: unknown, requireAnnualPrice = true, pricingOverride?: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  const text = item.texts && typeof item.texts === "object" ? item.texts as Record<string, unknown> : {};
  const supplier = item.supplier && typeof item.supplier === "object" ? item.supplier as Record<string, unknown> : {};
  const priceValue = pricingOverride ?? item.pricing;
  const pricing = priceValue && typeof priceValue === "object" ? priceValue as Record<string, unknown> : {};
  const yearly = pricing.yearly && typeof pricing.yearly === "object" ? pricing.yearly as Record<string, unknown> : {};
  const availability = item.availability && typeof item.availability === "object" ? item.availability as Record<string, unknown> : {};
  const specifications = item.specifications && typeof item.specifications === "object" ? item.specifications as Record<string, unknown> : {};
  const links = item.links && typeof item.links === "object" ? item.links as Record<string, unknown> : {};
  const regularPrice = numberValue(yearly.price); const promotionPrice = numberValue(yearly.promo_price);
  const link = stringValue(links.clickout, 2000);
  let safeLink: string | undefined;
  if (link) { try { const url = new URL(link); if (url.protocol === "https:") safeLink = url.toString(); } catch { /* invalid provider link omitted */ } }
  const lastUpdated = stringValue(item.last_update, 40);
  const tariffInfo = specifications.tariff_type && typeof specifications.tariff_type === "object" ? specifications.tariff_type as Record<string, unknown> : {};
  const tariffType = stringValue(tariffInfo.value, 100);
  const statusValue = item.status;
  const productStatus = statusValue === 1 || statusValue === "1" || statusValue === "active" ? "active" : statusValue === 0 || statusValue === "0" || statusValue === "inactive" ? "inactive" : statusValue === 2 || statusValue === "2" || statusValue === "archived" ? "archived" : undefined;
  const periods = Array.isArray(item.contract_periods) ? item.contract_periods.map(value => String(value)).filter(value => /^\d{1,3}$/.test(value)).slice(0, 12) : [];
  const name = stringValue(text.name) ?? stringValue(text.title); const provider = stringValue(supplier.name); const id = stringValue(item.product_id, 100);
  if (!name || !provider || !id || (requireAnnualPrice && (regularPrice === undefined || regularPrice < 0 || regularPrice > 5_000_000)) || (regularPrice !== undefined && (regularPrice < 0 || regularPrice > 5_000_000)) || (promotionPrice !== undefined && (promotionPrice < 0 || promotionPrice > 5_000_000))) return undefined;
  return { id, name, supplier: provider, ...(regularPrice !== undefined ? { annualPriceEur: Math.round(regularPrice * 100) / 100 } : {}), ...(promotionPrice !== undefined ? { promoAnnualPriceEur: Math.round(promotionPrice * 100) / 100 } : {}), ...(lastUpdated && Number.isFinite(Date.parse(lastUpdated)) ? { lastUpdated } : {}), ...(tariffType ? { tariffType } : {}), ...(productStatus ? { status: productStatus } : {}), contractMonths: periods, availability: { flanders: availability.flanders === true, wallonia: availability.wallonia === true, brussels: availability.brussels === true }, ...(safeLink ? { detailsUrl: safeLink } : {}) };
};

const normalizeCompare = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContractCatalogUpstreamError();
  const root = value as Record<string, unknown>; const items = root.results;
  if (!Array.isArray(items) || items.length > 250) throw new ContractCatalogUpstreamError();
  return { products: items.map(entry => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
    const result = entry as Record<string, unknown>;
    return normalizeProduct(result.product, true, result.pricing);
  }).filter(Boolean) };
};

export const createContractCatalogClient = (config: ContractCatalogConfig, fetcher: ContractCatalogFetch = fetch, clock: () => number = Date.now, nonceFactory: () => string = () => randomBytes(16).toString("hex"), timeoutMs = 8_000) => {
  if ([config.publicKey, config.privateKey, config.affiliateId].some(value => typeof value !== "string" || value.trim().length === 0 || value.length > 512)) throw new ContractCatalogConfigurationError();
  const call = async (resource: "products" | "compare", params: URLSearchParams) => {
    const url = new URL(`/${resource}.json`, API_ORIGIN); url.search = signedParams(config, params, clock(), nonceFactory()).toString();
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
    try { const response = await fetcher(url, { method: "GET", signal: controller.signal, redirect: "error" }); if (!response.ok) throw new ContractCatalogUpstreamError(); return await readBoundedJson(response); }
    catch { throw new ContractCatalogUpstreamError(); } finally { clearTimeout(timer); }
  };
  return {
    async products(region: ContractCompareInput["region"]) {
      if (!REGIONS.has(region)) throw new ContractCatalogInputError();
      const params = new URLSearchParams({ cat: "electricity", lang: "nl", sg: "consumer", "detaillevel[0]": "texts", "detaillevel[1]": "supplier", "detaillevel[2]": "availability", "detaillevel[3]": "contract_periods", limit: "500" });
      const raw = await call("products", params); const items = Array.isArray(raw) ? raw : raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>).products : undefined;
      if (!Array.isArray(items) || items.length > 500) throw new ContractCatalogUpstreamError();
      return { source: "Aanbieders.be / e-Contract", retrievedAt: new Date(clock()).toISOString(), region, products: items.map(item => normalizeProduct(item, false)).filter((product): product is NonNullable<typeof product> => Boolean(product && product.availability[region.toLowerCase() as "flanders" | "wallonia" | "brussels"])) };
    },
    async compare(inputValue: unknown) {
      const input = validateContractCompareInput(inputValue);
      const params = new URLSearchParams({ a: config.affiliateId, cat: "electricity", lang: "nl", sg: "consumer", zip: input.postalCode, du: String(Math.round(input.annualDayKwh)), nu: String(Math.round(input.annualNightKwh)), t: input.tariff, f: String(input.householdSize), d: input.directDebit ? "1" : "0", "detaillevel[]": "texts", "detaillevel[1]": "supplier", "detaillevel[2]": "availability", "detaillevel[3]": "pricing", "detaillevel[4]": "specifications", "detaillevel[5]": "contract_periods", "detaillevel[6]": "links", has_solar: input.annualInjectionDayKwh + input.annualInjectionNightKwh > 0 ? "1" : "0", solar_calculation_type: "injection", solar_injection_day: String(Math.round(input.annualInjectionDayKwh)), solar_injection_night: String(Math.round(input.annualInjectionNightKwh)) });
      const raw = await call("compare", params);
      return { source: "Aanbieders.be / e-Contract", retrievedAt: new Date(clock()).toISOString(), region: input.region, comparison: normalizeCompare(raw) };
    },
  };
};
