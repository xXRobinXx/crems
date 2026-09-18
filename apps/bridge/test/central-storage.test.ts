import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CentralStorage, validateCentralResult } from "../src/central-storage.js";
import { handleCentralStorageRequest } from "../src/central-storage-route.js";

const profile = {
  version: 2, savedAt: "2026-09-17T10:00:00.000Z", period: { start: "2025-01-01T00:00:00Z", end: "2026-01-01T00:00:00Z" },
  measuredImportKwh: 100, estimatedImportKwh: 0, measuredExportKwh: 50, estimatedExportKwh: 0,
  measuredCount: 35040, estimatedCount: 0, noConsumptionCount: 2, integrityReliable: true, gapCount: 0, duplicateCount: 0, overlapCount: 0,
};
const battery = {
  version: 3, savedAt: "2026-09-17T10:00:00.000Z", quality: { period: profile.period, integrityReliable: true, estimatedCount: 0, gapCount: 0, duplicateCount: 0, overlapCount: 0 },
  technical: [3, 5, 7, 10, 13].map((capacityKwh) => ({ capacityKwh, powerKw: capacityKwh / 2, shiftedKwh: 1, chargedFromExportKwh: 1, endingStoredKwh: 0, lossesKwh: 0, equivalentCycles: 1 })),
};

const temporaryDirectory = async () => mkdtemp(join(tmpdir(), "crems-central-storage-"));

test("central storage validates allowlists and rejects raw fields", async () => {
  assert.equal(validateCentralResult("energy-profile", profile), true);
  assert.equal(validateCentralResult("energy-profile", { ...profile, csv: "raw" }), false);
  assert.equal(validateCentralResult("battery-report", battery), true);
  assert.equal(validateCentralResult("battery-report", { ...battery, intervals: [] }), false);
  const directory = await temporaryDirectory();
  try {
    const storage = new CentralStorage(directory);
    await assert.rejects(storage.put("energy-profile", { ...profile, token: "secret" }), /invalid_result/);
    assert.equal(await storage.get("energy-profile"), undefined);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("central storage writes atomically and preserves concurrent result types", async () => {
  const directory = await temporaryDirectory();
  try {
    const storage = new CentralStorage(directory);
    await Promise.all([storage.put("energy-profile", profile), storage.put("battery-report", battery)]);
    assert.deepEqual(await storage.get("energy-profile"), profile);
    assert.deepEqual(await storage.get("battery-report"), battery);
    const raw = JSON.parse(await readFile(join(directory, "results.json"), "utf8"));
    assert.deepEqual(Object.keys(raw).sort(), ["battery-report", "energy-profile"]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("corrupt storage is treated as empty and explicit delete removes one result", async () => {
  const directory = await temporaryDirectory();
  try {
    await writeFile(join(directory, "results.json"), "not-json", "utf8");
    const storage = new CentralStorage(directory);
    assert.equal(await storage.get("energy-profile"), undefined);
    await storage.put("energy-profile", profile);
    await storage.put("battery-report", battery);
    await storage.remove("energy-profile");
    assert.equal(await storage.get("energy-profile"), undefined);
    assert.deepEqual(await storage.get("battery-report"), battery);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

const startRouteServer = async (storage: CentralStorage) => {
  const server = createServer((request, response) => { if (!handleCentralStorageRequest(request, response, storage)) { response.statusCode = 404; response.end(); } });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { server, port: address.port };
};
const call = (port: number, path: string, method: string, body?: unknown) => new Promise<{ status: number; json: any }>((resolve, reject) => {
  const request = httpRequest({ hostname: "127.0.0.1", port, path, method, headers: body === undefined ? undefined : { "content-type": "application/json" } }, (response) => {
    let text = ""; response.setEncoding("utf8"); response.on("data", (chunk) => { text += chunk; }); response.on("end", () => resolve({ status: response.statusCode ?? 0, json: text ? JSON.parse(text) : undefined }));
  });
  request.on("error", reject); if (body !== undefined) request.end(JSON.stringify(body)); else request.end();
});

test("central result endpoints get, put and delete allowlisted snapshots", async () => {
  const directory = await temporaryDirectory();
  const { server, port } = await startRouteServer(new CentralStorage(directory));
  try {
    assert.deepEqual(await call(port, "/api/results/energy-profile", "GET"), { status: 200, json: { result: null } });
    assert.equal((await call(port, "/api/results/energy-profile", "PUT", profile)).status, 204);
    assert.deepEqual(await call(port, "/api/results/energy-profile", "GET"), { status: 200, json: { result: profile } });
    assert.equal((await call(port, "/api/results/energy-profile", "PUT", { ...profile, csv: "secret" })).status, 400);
    assert.equal((await call(port, "/api/results/energy-profile", "DELETE")).status, 204);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
});
