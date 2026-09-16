import { createServer, type ServerResponse } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { LiveMeterReading } from "@crems/core";
import { handleBridgeRoutePrelude } from "./bridge-route-prelude.js";
import { handleHealthRequest } from "./health.js";
import { parseBridgeListenConfig } from "./listen-config.js";
import type { HomeAssistantEntities } from "./meter-source.js";
import { createMeterSource } from "./source-factory.js";
import { handlePriceHistoryRequest } from "./price-history-route.js";
import { loadBelpexArchive } from "./belpex-history.js";
import { handleBelpexHistoryRequest } from "./belpex-history-route.js";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const localEnv: Record<string, string> = {};
try { loadEnvFile(envPath); } catch { /* Eerste start zonder lokale configuratie. */ }
try {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^([^#=\s]+)=(.*)$/.exec(line);
    if (match) { localEnv[match[1]!] = match[2]!; if (!process.env[match[1]!]?.trim()) process.env[match[1]!] = match[2]!; }
  }
} catch { /* Lokale configuratie blijft optioneel. */ }
const setting = (name: string) => process.env[name]?.trim() || localEnv[name]?.trim();

const listenConfig = parseBridgeListenConfig(setting("CREMS_BRIDGE_PORT"), setting("CREMS_BRIDGE_HOST"));
const webRoot = setting("CREMS_WEB_ROOT");
const pricePlannerEntity = setting("HASS_TOMORROW_PRICE_ENTITY");
const configuredEntities: HomeAssistantEntities = {
  importPower: setting("HASS_IMPORT_POWER_ENTITY"),
  exportPower: setting("HASS_EXPORT_POWER_ENTITY"),
  importEnergy: setting("HASS_IMPORT_ENERGY_ENTITY"),
  exportEnergy: setting("HASS_EXPORT_ENERGY_ENTITY"),
  voltage: setting("HASS_VOLTAGE_ENTITY"),
  currentPrice: setting("HASS_CURRENT_PRICE_ENTITY"),
  nextPrice: setting("HASS_NEXT_PRICE_ENTITY"),
  tomorrowPrice: pricePlannerEntity,
};
const source = createMeterSource({
  homeAssistantUrl: setting("HASS_URL"),
  homeAssistantToken: setting("HASS_TOKEN"),
  entities: configuredEntities,
});
const belpexArchive=loadBelpexArchive();
const clients = new Set<ServerResponse>();
let latest: LiveMeterReading = source.name === "home-assistant" ? {
  timestamp: new Date().toISOString(), importPowerW: 0, exportPowerW: 0,
  importEnergyKwh: 0, exportEnergyKwh: 0, quality: "incomplete", source: "home-assistant",
} : await source.read();
let lastError: string | undefined;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const json = (response: ServerResponse, status: number, value: unknown) => {
  response.writeHead(status, { ...headers, "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (handleBridgeRoutePrelude(request, response, source)) return;
  if (handleHealthRequest(request, response, {
    source: source.name,
    hasError: lastError !== undefined,
    clients: clients.size,
  })) return;
  if (handlePriceHistoryRequest(request, response, source)) return;
  if (handleBelpexHistoryRequest(request,response,belpexArchive)) return;
  if (url.pathname === "/api/current") return json(response, 200, latest);
  if (url.pathname === "/api/stream") {
    response.writeHead(200, {
      ...headers,
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    });
    response.write(`data: ${JSON.stringify(latest)}\n\n`);
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }
  if (webRoot && (request.method === "GET" || request.method === "HEAD")) {
    const safePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const root = resolve(webRoot);
    let file = resolve(root, safePath);
    const relativePath = relative(root, file);
    if (relativePath.startsWith("..") || resolve(root, relativePath) !== file) return json(response, 404, { error: "not_found" });
    if (!existsSync(file) || statSync(file).isDirectory()) file = resolve(root, "index.html");
    const contentTypes: Record<string, string> = {
      ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml", ".png": "image/png",
    };
    response.writeHead(200, { "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream" });
    if (request.method === "HEAD") return response.end();
    return createReadStream(file).pipe(response);
  }
  return json(response, 404, { error: "not_found" });
});

setInterval(async () => {
  try {
    latest = await source.read();
    lastError = undefined;
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Onbekende meetfout";
    latest = { ...latest, timestamp: new Date().toISOString(), quality: "incomplete" };
  }
  const event = `data: ${JSON.stringify(latest)}\n\n`;
  for (const client of clients) client.write(event);
}, 1_000);

server.listen(listenConfig.port, listenConfig.host, () => {
  console.log(`CREMS Bridge active on http://${listenConfig.host}:${listenConfig.port} · day-price=${configuredEntities.tomorrowPrice ? "configured" : "missing"}`);
});
