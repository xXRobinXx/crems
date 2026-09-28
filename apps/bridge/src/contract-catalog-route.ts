import type { IncomingMessage, ServerResponse } from "node:http";
import { ContractCatalogConfigurationError, ContractCatalogInputError, ContractCatalogUpstreamError, createContractCatalogClient, validateContractCompareInput } from "./contract-catalog.js";

type Client = ReturnType<typeof createContractCatalogClient>;
const HEADERS = { "Cache-Control": "no-store", "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" };
const response = (res: ServerResponse, status: number, body: unknown) => { res.writeHead(status, HEADERS); res.end(JSON.stringify(body)); };
const safeError = (res: ServerResponse, status: number, code: string, message: string) => response(res, status, { error: { code, message } });
const compareRequests = new Map<string, number[]>();
const rateLimited = (request: IncomingMessage, now: number) => {
  const peer = request.socket?.remoteAddress ?? "local";
  const active = (compareRequests.get(peer) ?? []).filter(timestamp => now - timestamp < 60_000);
  if (active.length >= 6) { compareRequests.set(peer, active); return true; }
  if (compareRequests.size > 16) compareRequests.clear();
  active.push(now); compareRequests.set(peer, active); return false;
};

export const handleContractCatalogRequest = (request: IncomingMessage, res: ServerResponse, clientFactory: () => Client, now: () => Date = () => new Date()): boolean => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname !== "/api/contracts/products" && url.pathname !== "/api/contracts/compare") return false;
  const compare = url.pathname.endsWith("/compare");
  if (request.method !== (compare ? "POST" : "GET")) { safeError(res, 405, "METHOD_NOT_ALLOWED", "Methode niet toegestaan"); return true; }
  if (rateLimited(request, now().getTime())) { safeError(res, 429, "RATE_LIMITED", "Te veel aanvragen; probeer binnen een minuut opnieuw"); return true; }
  if (!compare) {
    const region = url.searchParams.get("region");
    if (url.searchParams.size !== 1 || !["Flanders", "Wallonia", "Brussels"].includes(region ?? "")) { safeError(res, 400, "INVALID_INPUT", "Regio ontbreekt of is ongeldig"); return true; }
    void (async () => {
      try { const result = await clientFactory().products(region as "Flanders" | "Wallonia" | "Brussels"); response(res, 200, result); }
      catch (error) { sendFailure(res, error); }
    })();
    return true;
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] ?? "")) { safeError(res, 415, "UNSUPPORTED_MEDIA_TYPE", "Verstuur JSON-invoer"); return true; }
  const chunks: Buffer[] = []; let size = 0; let rejected = false;
  const rejectLargeBody = () => {
    if (rejected) return;
    rejected = true;
    request.pause();
    res.once("finish", () => request.destroy());
    safeError(res, 413, "REQUEST_TOO_LARGE", "Invoer is te groot");
  };
  const declaredLength = Number(request.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > 8_192) { rejectLargeBody(); return true; }
  request.on("data", chunk => {
    if (rejected) return;
    size += Buffer.byteLength(chunk);
    if (size > 8_192) { rejectLargeBody(); return; }
    chunks.push(Buffer.from(chunk));
  });
  request.on("end", () => {
    if (rejected) return;
    void (async () => {
      let body: unknown;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { return safeError(res, 400, "INVALID_INPUT", "Ongeldige invoer"); }
      try { const input = validateContractCompareInput(body); const result = await clientFactory().compare(input); response(res, 200, result); }
      catch (error) { sendFailure(res, error); }
    })();
  });
  return true;
};

const sendFailure = (res: ServerResponse, error: unknown) => {
  if (res.headersSent || res.destroyed) return;
  if (error instanceof ContractCatalogConfigurationError) return safeError(res, 503, "CONTRACTS_NOT_CONFIGURED", "De contract-API is nog niet geconfigureerd");
  if (error instanceof ContractCatalogInputError) return safeError(res, 400, "INVALID_INPUT", "Controleer de vergelijkingsgegevens");
  if (error instanceof ContractCatalogUpstreamError) return safeError(res, 502, "CONTRACTS_UNAVAILABLE", "Contractaanbiedingen zijn tijdelijk niet beschikbaar");
  return safeError(res, 502, "CONTRACTS_UNAVAILABLE", "Contractaanbiedingen zijn tijdelijk niet beschikbaar");
};
