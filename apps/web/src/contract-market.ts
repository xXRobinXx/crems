export type ContractMarketInput = Readonly<{
  postalCode: string;
  region: "Flanders" | "Wallonia" | "Brussels";
  annualDayKwh: number;
  annualNightKwh: number;
  annualInjectionDayKwh: number;
  annualInjectionNightKwh: number;
  tariff: "f" | "i" | "no";
  householdSize: number;
  directDebit: boolean;
}>;

export type ContractMarketResult = Readonly<{
  source: string;
  retrievedAt: string;
  region: string;
  comparison: { products: unknown[] };
}>;

export type ContractMarketState = { status: "idle" } | { status: "loading" } | { status: "success"; data: ContractMarketResult } | { status: "error"; message: string };

export const validateContractMarketResult = (value: unknown): value is ContractMarketResult => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  if (typeof result.source !== "string" || typeof result.retrievedAt !== "string" || !Number.isFinite(Date.parse(result.retrievedAt)) || !["Flanders", "Wallonia", "Brussels"].includes(String(result.region))) return false;
  const comparison = result.comparison;
  if (!comparison || typeof comparison !== "object" || !Array.isArray((comparison as Record<string, unknown>).products) || (comparison as { products: unknown[] }).products.length > 250) return false;
  return (comparison as { products: unknown[] }).products.every(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const product = item as Record<string, unknown>;
    const validPrice = (price: unknown) => typeof price === "number" && Number.isFinite(price) && price >= 0 && price <= 5_000_000;
    if (typeof product.id !== "string" || typeof product.name !== "string" || typeof product.supplier !== "string" || !validPrice(product.annualPriceEur)) return false;
    if (product.promoAnnualPriceEur !== undefined && !validPrice(product.promoAnnualPriceEur)) return false;
    if (!Array.isArray(product.contractMonths) || product.contractMonths.some(month => typeof month !== "string" || !/^\d{1,3}$/.test(month))) return false;
    if (product.detailsUrl !== undefined) { try { if (new URL(String(product.detailsUrl)).protocol !== "https:") return false; } catch { return false; } }
    return true;
  });
};

export const regionForPostalCode = (postalCode: string): ContractMarketInput["region"] | undefined => {
  if (!/^\d{4}$/.test(postalCode)) return undefined;
  const code = Number(postalCode);
  if (code < 1000 || code > 9992) return undefined;
  if (code >= 1000 && code <= 1210) return "Brussels";
  if ((code >= 1300 && code <= 1499) || (code >= 4000 && code <= 7999)) return "Wallonia";
  return "Flanders";
};

export const isValidContractMarketInput = (input: ContractMarketInput) => Boolean(
  regionForPostalCode(input.postalCode) === input.region &&
  [input.annualDayKwh, input.annualNightKwh, input.annualInjectionDayKwh, input.annualInjectionNightKwh].every(value => Number.isFinite(value) && value >= 0 && value <= 100_000) &&
  input.annualDayKwh + input.annualNightKwh > 0 &&
  Number.isInteger(input.householdSize) && input.householdSize >= 1 && input.householdSize <= 20,
);

export const createContractMarketClient = (fetcher: typeof fetch = fetch) => ({
  async compare(input: ContractMarketInput, signal?: AbortSignal): Promise<ContractMarketResult> {
    const response = await fetcher("api/contracts/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => undefined);
      const error = body && typeof body === "object" && "error" in body ? (body as { error?: { code?: string } }).error?.code : undefined;
      throw new Error(error === "CONTRACTS_NOT_CONFIGURED" ? "De contract-API is nog niet geconfigureerd." : "Aanbiedingen konden niet worden opgehaald. Probeer later opnieuw.");
    }
    const data: unknown = await response.json();
    if (!validateContractMarketResult(data)) throw new Error("De ontvangen vergelijkingsgegevens zijn ongeldig.");
    return data as ContractMarketResult;
  },
});
