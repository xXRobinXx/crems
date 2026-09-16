import type { IncomingMessage, ServerResponse } from "node:http";
import type { MeterSource } from "./meter-source.js";
import {
  handlePowerHistoryRequest,
  type HistoryLoader,
} from "./power-history-route.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export const handleBridgeRoutePrelude = (
  request: IncomingMessage,
  response: ServerResponse,
  source: MeterSource,
  historyLoader?: HistoryLoader,
): boolean => {
  if (handlePowerHistoryRequest(request, response, source, historyLoader)) return true;
  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders);
    response.end();
    return true;
  }
  return false;
};
