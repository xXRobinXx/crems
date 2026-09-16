import type { IncomingMessage, ServerResponse } from "node:http";

export const INVALID_HEALTH_CLIENT_COUNT = "INVALID_HEALTH_CLIENT_COUNT" as const;

export class InvalidHealthClientCountError extends Error {
  readonly name = "InvalidHealthClientCountError";
  readonly code = INVALID_HEALTH_CLIENT_COUNT;

  constructor() {
    super("Health client count is invalid");
  }
}

export interface HealthResponseInput {
  source: string;
  hasError?: boolean;
  clients: number;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  source: string;
  configured: boolean;
  simulation: boolean;
  clients: number;
}

export const mapHealthResponse = (input: Readonly<HealthResponseInput>): HealthResponse => {
  if (!Number.isFinite(input.clients) || input.clients < 0) {
    throw new InvalidHealthClientCountError();
  }

  return {
    status: input.hasError ? "degraded" : "ok",
    source: input.source,
    configured: input.source === "home-assistant",
    simulation: input.source === "simulated-p1",
    clients: input.clients,
  };
};

const healthHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

export const handleHealthRequest = (
  request: IncomingMessage,
  response: ServerResponse,
  input: Readonly<HealthResponseInput>,
): boolean => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname !== "/api/health") return false;

  if (request.method !== "GET") {
    response.writeHead(405, healthHeaders);
    response.end(JSON.stringify({ error: "method_not_allowed" }));
    return true;
  }

  response.writeHead(200, healthHeaders);
  response.end(JSON.stringify(mapHealthResponse(input)));
  return true;
};
