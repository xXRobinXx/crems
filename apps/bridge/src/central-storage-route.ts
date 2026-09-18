import type { IncomingMessage, ServerResponse } from "node:http";
import { CentralStorage, StorageValidationError, type CentralResultKey } from "./central-storage.js";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" };
const keyForPath = (path: string): CentralResultKey | undefined => path === "/api/results/energy-profile" ? "energy-profile" : path === "/api/results/battery-report" ? "battery-report" : undefined;
const send = (response: ServerResponse, status: number, value: unknown) => { response.writeHead(status, { ...headers, "Content-Type": "application/json" }); response.end(JSON.stringify(value)); };
const readBody = (request: IncomingMessage, limit = 4 * 1024 * 1024): Promise<string> => new Promise((resolve, reject) => {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk: string) => { body += chunk; if (Buffer.byteLength(body, "utf8") > limit) { request.destroy(); reject(new Error("body_too_large")); } });
  request.on("end", () => resolve(body));
  request.on("error", reject);
});

export const handleCentralStorageRequest = (request: IncomingMessage, response: ServerResponse, storage: CentralStorage): boolean => {
  const key = keyForPath(new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname);
  if (!key) return false;
  if (request.method === "OPTIONS") { response.writeHead(204, headers); response.end(); return true; }
  if (request.method === "GET") { void storage.get(key).then((value) => send(response, 200, { result: value ?? null })).catch(() => send(response, 500, { error: "storage_unavailable" })); return true; }
  if (request.method === "DELETE") { void storage.remove(key).then(() => send(response, 204, {})).catch(() => send(response, 500, { error: "storage_unavailable" })); return true; }
  if (request.method !== "PUT") { send(response, 405, { error: "method_not_allowed" }); return true; }
  void readBody(request).then((body) => {
    let value: unknown;
    try { value = JSON.parse(body); } catch { send(response, 400, { error: "invalid_json" }); return; }
    return storage.put(key, value).then(() => send(response, 204, {})).catch((error) => send(response, error instanceof StorageValidationError ? 400 : 500, { error: error instanceof StorageValidationError ? "invalid_result" : "storage_unavailable" }));
  }).catch((error) => send(response, error?.message === "body_too_large" ? 413 : 400, { error: error?.message === "body_too_large" ? "body_too_large" : "invalid_body" }));
  return true;
};
