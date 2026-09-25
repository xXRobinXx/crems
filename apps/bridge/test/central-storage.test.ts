import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CentralStorage, StorageCorruptError, validateCentralResult } from "../src/central-storage.js";
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

const financialBattery = () => {
  const assumptions = {
    confirmed: true as const, importRateCtKwh: 30, exportRateCtKwh: 4, lifeYears: 15,
    annualDegradationPercent: 2, discountRatePercent: 3,
    investmentsEur: { 3: 1_000, 5: 2_000, 7: 3_000, 10: 4_000, 13: 5_000 },
    contractName: "Testcontract", contractType: "fixed" as const,
    effectiveStart: profile.period.start, effectiveEnd: profile.period.end,
    quoteSource: "Testofferte", quoteDate: "2026-01-02", warrantyYears: 10, pricesIncludeVat: true as const,
  };
  const years = (Date.parse(profile.period.end) - Date.parse(profile.period.start)) / (365.2425 * 86_400_000);
  const rounded = (value: number) => Math.round(value * 100) / 100;
  const scenario = (annualSaving: number, investment: number, annualFactor: 0.8 | 1 | 1.2) => {
    const degradation = 1 - assumptions.annualDegradationPercent / 100;
    const discount = 1 + assumptions.discountRatePercent / 100;
    const cashflows = Array.from({ length: assumptions.lifeYears }, (_, index) => rounded(annualSaving * annualFactor * degradation ** index));
    let cumulative = -investment, npv = -investment, paybackYears: number | null = null;
    cashflows.forEach((cashflow, index) => {
      const before = cumulative; cumulative += cashflow; npv += cashflow / discount ** (index + 1);
      if (paybackYears === null && before < 0 && cumulative >= 0 && cashflow > 0) paybackYears = rounded(index + (-before / cashflow));
    });
    return { annualFactor, cashflowsEur: cashflows, npvEur: rounded(npv), paybackYears };
  };
  const results = battery.technical.map((technicalItem) => {
    const annualEnergySavingEur = rounded((technicalItem.shiftedKwh * assumptions.importRateCtKwh / 100 - technicalItem.chargedFromExportKwh * assumptions.exportRateCtKwh / 100) / years);
    const investmentEur = assumptions.investmentsEur[technicalItem.capacityKwh as keyof typeof assumptions.investmentsEur];
    const unrounded = (technicalItem.shiftedKwh * assumptions.importRateCtKwh / 100 - technicalItem.chargedFromExportKwh * assumptions.exportRateCtKwh / 100) / years;
    return { capacityKwh: technicalItem.capacityKwh, investmentEur, annualEnergySavingEur, low: scenario(unrounded, investmentEur, .8), base: scenario(unrounded, investmentEur, 1), high: scenario(unrounded, investmentEur, 1.2) };
  });
  return { ...battery, financial: { assumptions, results, recommendedCapacityKwh: null } };
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

test("central storage recomputes financial snapshots and requires eligible quality", () => {
  const valid = financialBattery();
  assert.equal(validateCentralResult("battery-report", valid), true);
  assert.equal(validateCentralResult("battery-report", { ...valid, financial: { ...valid.financial, results: valid.financial.results.map((item, index) => index === 0 ? { ...item, annualEnergySavingEur: item.annualEnergySavingEur + 1 } : item) } }), false);
  assert.equal(validateCentralResult("battery-report", { ...valid, financial: { ...valid.financial, results: valid.financial.results.map((item, index) => index === 0 ? { ...item, base: { ...item.base, npvEur: item.base.npvEur + 1 } } : item) } }), false);
  assert.equal(validateCentralResult("battery-report", { ...valid, financial: { ...valid.financial, recommendedCapacityKwh: 3 } }), false);
  assert.equal(validateCentralResult("battery-report", { ...valid, quality: { ...valid.quality, gapCount: 1 } }), false);
  assert.equal(validateCentralResult("battery-report", { ...valid, financial: { ...valid.financial, assumptions: { ...valid.financial.assumptions, effectiveStart: "2025-01-02T00:00:00Z" } } }), false);
  assert.equal(validateCentralResult("battery-report", { ...valid, financial: { ...valid.financial, assumptions: { ...valid.financial.assumptions, investmentsEur: { ...valid.financial.assumptions.investmentsEur, personalData: "unexpected" } } } }), false);
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

test("corrupt storage remains untouched and blocks reads, writes, and deletes", async () => {
  const directory = await temporaryDirectory();
  try {
    const file = join(directory, "results.json");
    await writeFile(file, "not-json", "utf8");
    const storage = new CentralStorage(directory);
    await assert.rejects(storage.get("energy-profile"), StorageCorruptError);
    await assert.rejects(storage.put("energy-profile", profile), StorageCorruptError);
    await assert.rejects(storage.remove("energy-profile"), StorageCorruptError);
    assert.equal(await readFile(file, "utf8"), "not-json");
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
