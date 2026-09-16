import type { IncomingMessage, ServerResponse } from "node:http";
import type { MeterSource } from "./meter-source.js";
import { PowerHistoryNotConfiguredError } from "./meter-source.js";
import {
  loadPowerHistory,
  PowerHistoryUnavailableError,
  PowerHistoryUpstreamError,
  type PowerHistoryResponse,
} from "./power-history-service.js";

export type HistoryLoader = (source: MeterSource, start: string, end: string) => Promise<PowerHistoryResponse>;
export type HistoryNow = () => Date;

class InvalidHistoryQueryError extends Error {}
class InvalidPublicHistoryWindowError extends Error {}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

const errors = {
  INVALID_HISTORY_QUERY: { code: "INVALID_HISTORY_QUERY", message: "De historyquery is ongeldig" },
  INVALID_HISTORY_WINDOW: { code: "INVALID_HISTORY_WINDOW", message: "Het historyvenster is ongeldig" },
  HISTORY_UNAVAILABLE: { code: "HISTORY_UNAVAILABLE", message: "Vermogenshistory is niet beschikbaar" },
  HISTORY_NOT_CONFIGURED: { code: "HISTORY_NOT_CONFIGURED", message: "Vermogenshistory is niet geconfigureerd" },
  HISTORY_UPSTREAM_ERROR: { code: "HISTORY_UPSTREAM_ERROR", message: "Vermogenshistory kon niet worden opgehaald" },
  HISTORY_INTERNAL_ERROR: { code: "HISTORY_INTERNAL_ERROR", message: "Vermogenshistory kon niet worden verwerkt" },
} as const;

const send = (response: ServerResponse, status: number, value: unknown) => {
  response.writeHead(status, headers);
  response.end(JSON.stringify(value));
};

const parseWindow = (url: URL, now: Date) => {
  const starts = url.searchParams.getAll("start");
  const ends = url.searchParams.getAll("end");
  if (starts.length !== 1 || ends.length !== 1 || starts[0]?.trim() === "" || ends[0]?.trim() === "") {
    throw new InvalidHistoryQueryError();
  }
  const startMs = Date.parse(starts[0]!);
  const endMs = Date.parse(ends[0]!);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) throw new InvalidHistoryQueryError();
  if (endMs <= startMs || endMs - startMs > 25 * 60 * 60 * 1_000 || endMs > now.getTime()) {
    throw new InvalidPublicHistoryWindowError();
  }
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
  };
};

const serve = async (
  request: IncomingMessage,
  response: ServerResponse,
  source: MeterSource,
  loader: HistoryLoader,
  now: HistoryNow,
) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const window = parseWindow(url, now());
    send(response, 200, await loader(source, window.start, window.end));
  } catch (error) {
    if (error instanceof InvalidHistoryQueryError) return send(response, 400, { error: errors.INVALID_HISTORY_QUERY });
    if (error instanceof InvalidPublicHistoryWindowError) return send(response, 400, { error: errors.INVALID_HISTORY_WINDOW });
    if (error instanceof PowerHistoryUnavailableError) return send(response, 503, { error: errors.HISTORY_UNAVAILABLE });
    if (error instanceof PowerHistoryNotConfiguredError) return send(response, 503, { error: errors.HISTORY_NOT_CONFIGURED });
    if (error instanceof PowerHistoryUpstreamError) return send(response, 502, { error: errors.HISTORY_UPSTREAM_ERROR });
    return send(response, 500, { error: errors.HISTORY_INTERNAL_ERROR });
  }
};

export const handlePowerHistoryRequest = (
  request: IncomingMessage,
  response: ServerResponse,
  source: MeterSource,
  loader: HistoryLoader = loadPowerHistory,
  now: HistoryNow = () => new Date(),
): boolean => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname !== "/api/history/power") return false;
  if (request.method !== "GET") {
    send(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Methode niet toegestaan" } });
    return true;
  }
  void serve(request, response, source, loader, now);
  return true;
};
