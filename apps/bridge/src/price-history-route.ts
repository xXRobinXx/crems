import type { IncomingMessage, ServerResponse } from "node:http";
import { InvalidPriceHistoryUnitError } from "./price-history.js";
import { priceDayWindow } from "./price-day-window.js";
import { loadPriceHistory, PriceHistoryUnavailableError, PriceHistoryUpstreamError, type PriceDay, type PriceHistoryResponse } from "./price-history-service.js";
import { PowerHistoryNotConfiguredError, type MeterSource } from "./meter-source.js";

type Loader = (source: MeterSource, day: PriceDay, start: string, end: string) => Promise<PriceHistoryResponse>;
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store", "Content-Type": "application/json" };
const messages = {
  INVALID_PRICE_QUERY: "De prijsquery is ongeldig", PRICE_NOT_CONFIGURED: "Prijshistory is niet geconfigureerd",
  PRICE_UNAVAILABLE: "Prijshistory is niet beschikbaar", PRICE_UPSTREAM_ERROR: "Prijshistory kon niet worden opgehaald",
  PRICE_INTERNAL_ERROR: "Prijshistory kon niet worden verwerkt",
} as const;
const send = (response: ServerResponse, status: number, code: keyof typeof messages | undefined, body?: unknown) => { response.writeHead(status, headers); response.end(JSON.stringify(code ? { error: { code, message: messages[code] } } : body)); };

export const handlePriceHistoryRequest = (request: IncomingMessage, response: ServerResponse, source: MeterSource, loader: Loader = loadPriceHistory, now = () => new Date()): boolean => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname !== "/api/history/price") return false;
  if (request.method !== "GET") { send(response, 405, undefined, { error: { code: "METHOD_NOT_ALLOWED", message: "Methode niet toegestaan" } }); return true; }
  const values = url.searchParams.getAll("day"); const day = values[0] as PriceDay;
  if (values.length !== 1 || !["yesterday", "today", "tomorrow"].includes(day) || [...url.searchParams.keys()].some(key => key !== "day")) { send(response, 400, "INVALID_PRICE_QUERY"); return true; }
  const snapshot = now();
  void (async () => {
    try { const window = priceDayWindow(day, snapshot); send(response, 200, undefined, await loader(source, day, window.start, window.end)); }
    catch (error) {
      if (error instanceof PowerHistoryNotConfiguredError || error instanceof InvalidPriceHistoryUnitError) return send(response, 503, "PRICE_NOT_CONFIGURED");
      if (error instanceof PriceHistoryUnavailableError) return send(response, 503, "PRICE_UNAVAILABLE");
      if (error instanceof PriceHistoryUpstreamError) return send(response, 502, "PRICE_UPSTREAM_ERROR");
      return send(response, 500, "PRICE_INTERNAL_ERROR");
    }
  })();
  return true;
};
