import type { IncomingMessage, ServerResponse } from "node:http";
import { CentralStorage, StorageCorruptError, StorageValidationError, type CentralResultKey } from "./central-storage.js";

const headers = { "Cache-Control": "no-store" };
const keyForPath = (path: string): CentralResultKey | undefined => path === "/api/results/energy-profile" ? "energy-profile" : path === "/api/results/battery-report" ? "battery-report" : undefined;
const send = (response: ServerResponse, status: number, value: unknown) => { response.writeHead(status, { ...headers, "Content-Type": "application/json" }); response.end(JSON.stringify(value)); };
const readBody = (request: IncomingMessage, limit = 4 * 1024 * 1024): Promise<string> => new Promise((resolve, reject) => {
  let body = "";
  let size = 0;
  const declaredLength = Number(request.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > limit) { request.pause(); reject(new Error("body_too_large")); return; }
  request.setEncoding("utf8");
  request.on("data", (chunk: string) => {
    size += Buffer.byteLength(chunk, "utf8");
    if (size > limit) { body = ""; request.pause(); reject(new Error("body_too_large")); return; }
    body += chunk;
  });
  request.on("end", () => resolve(body));
  request.on("error", reject);
});

export const handleCentralStorageRequest = (request: IncomingMessage, response: ServerResponse, storage: CentralStorage): boolean => {
  const key = keyForPath(new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname);
  if (!key) return false;
  if (request.method === "OPTIONS") { response.writeHead(204, headers); response.end(); return true; }
  const storageError = (error: unknown) => error instanceof StorageCorruptError ? "storage_recovery_required" : "storage_unavailable";
  if (request.method === "GET") { void storage.get(key).then((value) => send(response, 200, { result: value ?? null })).catch((error) => send(response, 500, { error: storageError(error) })); return true; }
  if (request.method === "DELETE") { void storage.remove(key).then(() => send(response, 204, {})).catch((error) => send(response, 500, { error: storageError(error) })); return true; }
  if (request.method !== "PUT") { send(response, 405, { error: "method_not_allowed" }); return true; }
  void readBody(request).then((body) => {
    let value: unknown;
    try { value = JSON.parse(body); } catch { send(response, 400, { error: "invalid_json" }); return; }
    return storage.put(key, value).then(() => send(response, 204, {})).catch((error) => send(response, error instanceof StorageValidationError ? 400 : 500, { error: error instanceof StorageValidationError ? "invalid_result" : storageError(error) }));
  }).catch((error) => {
    const oversized = error?.message === "body_too_large";
    if (oversized) response.once("finish", () => request.destroy());
    send(response, oversized ? 413 : 400, { error: oversized ? "body_too_large" : "invalid_body" });
  });
  return true;
};
