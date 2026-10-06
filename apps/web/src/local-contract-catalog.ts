import { validateLocalContractCatalog, type LocalContractCatalog } from "@crems/core/local-contract-catalog";

export const loadLocalContractCatalog = async (signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<LocalContractCatalog> => {
  const response = await fetcher("api/contracts/local", { method: "GET", headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error("De lokale tariefkaarten konden niet worden geladen. Probeer opnieuw.");
  // The read-only endpoint is bounded; reject an unexpectedly large response.
  const body = await response.text();
  if (body.length > 1_000_000) throw new Error("De lokale tariefkaarten zijn ongeldig.");
  let data: unknown;
  try { data = JSON.parse(body); } catch { throw new Error("De lokale tariefkaarten zijn ongeldig."); }
  if (!validateLocalContractCatalog(data)) throw new Error("De lokale tariefkaarten zijn ongeldig.");
  return data;
};
