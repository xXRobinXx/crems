import type { IncomingMessage, ServerResponse } from "node:http";
import type { LocalContractCatalog } from "@crems/core/local-contract-catalog";
import { supplierArchiveCatalog } from "./supplier-catalog-data.js";

/** Checked against the supplier's October card, pages 1–2, on 2026-10-04.
 * No upstream network request or user-specific data is needed at runtime.
 * Design reference: renaudallard/homeassistant_be_electricity_prices (BSD-2-Clause).
 * Independent implementation: no Python supplier code is included here.
 */
const catalog: LocalContractCatalog = {
  ...supplierArchiveCatalog,
  cards: [{
    id: "energyvision-gs3jv-flanders-2026-10",
    supplier: "EnergyVision", name: "Goedkope stroom 3 jaar vast", region: "Flanders",
    tariff: "fixed", contractMonths: 36, publicationMonth: "2026-10", checkedOn: "2026-10-04",
    sourceUrl: "https://www.energyvision.be/sites/default/files/inline-files/EV-1026-GS3JV-nl.pdf",
    sourceSha256: "efd74f20dade8597b4ee7eaff1244d72ac9915c59f0e6797cafdd6d65bca94ad",
    vatPercent: 6, annualFeeEur: 75, importDayCtKwh: 13.57, importNightCtKwh: 13.57,
    injection: { kind: "monthly-indexed", indicativeCtKwh: 3.27, minimumCtKwh: 1, formula: "0,6 × Belpex-SPP-M − 15 EUR/MWh; maandminimum 1 ct/kWh" },
  }, ...supplierArchiveCatalog.cards.filter(card => card.id !== "energyvision-energyvision_fixed_3y-flanders-2026-10")],
};

export const handleLocalContractCatalogRequest = (request: IncomingMessage, response: ServerResponse): boolean => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/contracts/local") return false;
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (request.method !== "GET") {
    response.writeHead(405, { ...headers, Allow: "GET" }); response.end(JSON.stringify({ error: "method_not_allowed" })); return true;
  }
  if (url.search) { response.writeHead(400, headers); response.end(JSON.stringify({ error: "query_not_allowed" })); return true; }
  response.writeHead(200, headers); response.end(JSON.stringify(catalog)); return true;
};
