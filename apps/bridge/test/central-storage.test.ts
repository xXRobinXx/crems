import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { CentralStorage, StorageCorruptError, StorageValidationError, validateCentralResult } from "../src/central-storage.js";
import { handleCentralStorageRequest } from "../src/central-storage-route.js";
import { createBatterySimulator, type BatteryFlowInterval } from "@crems/core/battery-simulation";
import { createBatteryDailyCollector, batteryDayWindow } from "../../web/src/battery-daily-report.ts";
import { validateBatteryReport } from "../../web/src/local-battery-analysis.ts";

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

const reportFromFlows = (flows: BatteryFlowInterval[]) => {
  const collector = createBatteryDailyCollector();
  const candidates = [3, 5, 7, 10, 13].map((capacityKwh) => {
    const simulator = createBatterySimulator({ capacityKwh, maxPowerKw: capacityKwh / 2, roundTripEfficiency: .9, gapPolicy: "reset", onInterval: (point) => collector.observe(capacityKwh as 3 | 5 | 7 | 10 | 13, point) });
    assert.ok(simulator);
    return { capacityKwh, simulator };
  });
  for (const flow of flows) for (const candidate of candidates) candidate.simulator.push(flow);
  const technical = candidates.map(({ capacityKwh, simulator }) => {
    const result = simulator.finish(); assert.ok(result);
    return { capacityKwh, powerKw: capacityKwh / 2, shiftedKwh: result.shiftedKwh, chargedFromExportKwh: result.chargedFromExportKwh, endingStoredKwh: result.endingStoredKwh, lossesKwh: result.lossesKwh, equivalentCycles: result.equivalentCycles };
  });
  const daily = collector.finish().daily;
  return { ...battery, quality: { ...battery.quality, period: { start: flows[0]!.start, end: flows.at(-1)!.end }, gapCount: daily.reduce((sum, day) => sum + day.gapCount, 0) }, technical, daily };
};

test("central daily validation agrees with browser reports across DST, midnight, and gaps", () => {
  for (const [day, count] of [["2025-03-30", 92], ["2025-10-26", 100]] as const) {
    const window = batteryDayWindow(day);
    const flows = Array.from({ length: count }, (_, index) => ({ start: new Date(Date.parse(window.start) + index * 900_000).toISOString(), end: new Date(Date.parse(window.start) + (index + 1) * 900_000).toISOString(), importKwh: index % 2 ? 1 : 0, exportKwh: index % 2 ? 0 : 1 }));
    const report = reportFromFlows(flows);
    assert.equal(report.daily[0]!.count, count);
    assert.equal(validateBatteryReport(report), true);
    assert.equal(validateCentralResult("battery-report", report), true);
  }
  const starts = ["2025-01-01T22:45:00Z", "2025-01-01T23:00:00Z", "2025-01-01T23:15:00Z", "2025-01-03T12:00:00Z"];
  const report = reportFromFlows(starts.map((start, index) => ({ start, end: new Date(Date.parse(start) + 900_000).toISOString(), importKwh: index % 2 ? 1 : 0, exportKwh: index % 2 ? 0 : 1 })));
  assert.equal(validateBatteryReport(report), true);
  assert.equal(validateCentralResult("battery-report", report), true);
  const changes: ((report: any) => void)[] = [
    (r) => { r.daily[0].day = "2025-99-99"; },
    (r) => { r.daily[0].day = "2025-02-30"; },
    (r) => { r.daily[0].day = "2025-01-02"; },
    (r) => { r.daily[0].estimatedCount = r.daily[0].count + 1; },
    (r) => { r.daily[0].gapCount = r.daily[0].count + 1; },
    (r) => { r.daily[0].count += 1; },
    (r) => { r.daily[2].gapCount = 0; },
    (r) => { r.daily[0].candidates[0].startStoredKwh += .1; },
    (r) => { r.daily[0].candidates[0].conversionLossKwh += .1; r.technical[0].lossesKwh += .1; },
    (r) => { r.daily[0].candidates[0].sourceImportKwh += .1; },
    (r) => { const c = r.daily[0].candidates[1]; c.sourceImportKwh += .1; c.netImportBeforeKwh += .1; c.netImportAfterKwh += .1; },
  ];
  for (const change of changes) {
    const broken = structuredClone(report); change(broken);
    assert.equal(validateBatteryReport(broken), false);
    assert.equal(validateCentralResult("battery-report", broken), false);
  }
});

test("central financial validation rejects the same oversized text and altered rounded amounts as the browser", () => {
  const report = financialBattery();
  assert.equal(validateBatteryReport(report), true);
  const changes: ((report: any) => void)[] = [
    (r) => { r.financial.assumptions.contractName = "x".repeat(201); },
    (r) => { r.financial.assumptions.quoteSource = "x" + " ".repeat(200); },
    (r) => { r.financial.results[0].base.npvEur += .0000001; },
    (r) => { r.financial.results[0].base.cashflowsEur[0] += .00000000001; },
  ];
  for (const change of changes) {
    const broken = structuredClone(report); change(broken);
    assert.equal(validateBatteryReport(broken), false);
    assert.equal(validateCentralResult("battery-report", broken), false);
  }
});

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

test("malformed technical entries and financial scenarios return false without throwing", () => {
  for (const malformed of [null, undefined, true, 12, "unexpected", [], {}]) {
    for (let index = 0; index < battery.technical.length; index += 1) {
      const technical = battery.technical.map((item, i) => i === index ? malformed : item);
      assert.equal(validateCentralResult("battery-report", { ...battery, technical }), false);
    }
    const financial = financialBattery();
    for (let index = 0; index < financial.financial.results.length; index += 1) {
      const results = financial.financial.results.map((item, i) => i === index ? malformed : item);
      assert.equal(validateCentralResult("battery-report", { ...financial, financial: { ...financial.financial, results } }), false);
      for (const scenario of ["low", "base", "high"]) {
        const results = financial.financial.results.map((item, i) => i === index ? { ...item, [scenario]: malformed } : item);
        assert.equal(validateCentralResult("battery-report", { ...financial, financial: { ...financial.financial, results } }), false);
      }
    }
  }
});

test("malformed stored battery structure preserves bytes and requires recovery", async () => {
  const directory = await temporaryDirectory();
  const storage = new CentralStorage(directory);
  try {
    const invalidFinancial = financialBattery();
    const brokenReports = [
      { ...battery, technical: [null, null, null, null, null] },
      { ...invalidFinancial, financial: { ...invalidFinancial.financial, results: invalidFinancial.financial.results.map((item) => ({ ...item, base: null })) } },
    ];
    for (const broken of brokenReports) {
      const raw = JSON.stringify({ "energy-profile": profile, "battery-report": broken });
      await writeFile(join(directory, "results.json"), raw, "utf8");
      await assert.rejects(storage.get("battery-report"), StorageCorruptError);
      await assert.rejects(storage.put("energy-profile", profile), StorageCorruptError);
      await assert.rejects(storage.remove("battery-report"), StorageCorruptError);
      assert.equal(await readFile(join(directory, "results.json"), "utf8"), raw);
    }
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

test("combined storage size is checked before a valid new snapshot can make existing data unreadable", async () => {
  const directory = await temporaryDirectory();
  const storage = new CentralStorage(directory);
  const large = { ...battery, savedAt: "September 17 2026" };
  const targetBytes = 4 * 1024 * 1024 - 32;
  large.savedAt += " ".repeat(targetBytes - Buffer.byteLength(JSON.stringify(large), "utf8"));
  assert.equal(Buffer.byteLength(JSON.stringify(large), "utf8"), targetBytes);
  assert.equal(validateCentralResult("battery-report", large), true);
  await storage.put("battery-report", large);
  const original = await readFile(join(directory, "results.json"));
  const { server, port } = await startRouteServer(storage);
  try {
    await assert.rejects(storage.put("energy-profile", profile), StorageValidationError);
    assert.deepEqual(await call(port, "/api/results/energy-profile", "PUT", profile), { status: 400, json: { error: "invalid_result" } });
    assert.equal(Buffer.compare(await readFile(join(directory, "results.json")), original), 0);
    assert.equal((await storage.get("battery-report") as { savedAt: string }).savedAt.length, large.savedAt.length);
    assert.equal(await storage.get("energy-profile"), undefined);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
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

test("malformed battery payload gets 400 while structurally corrupt disk gets recovery error", async () => {
  const directory = await temporaryDirectory();
  const { server, port } = await startRouteServer(new CentralStorage(directory));
  try {
    const malformed = { ...battery, technical: [null, null, null, null, null] };
    assert.deepEqual(await call(port, "/api/results/battery-report", "PUT", malformed), { status: 400, json: { error: "invalid_result" } });
    const raw = JSON.stringify({ "battery-report": malformed });
    await writeFile(join(directory, "results.json"), raw, "utf8");
    for (const method of ["GET", "DELETE"]) {
      assert.deepEqual(await call(port, "/api/results/battery-report", method), { status: 500, json: { error: "storage_recovery_required" } });
    }
    assert.equal(await readFile(join(directory, "results.json"), "utf8"), raw);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
});

test("oversized central PUT returns 413 for declared and streaming bodies without changing saved data", async () => {
  const directory = await temporaryDirectory();
  const storage = new CentralStorage(directory);
  await storage.put("energy-profile", profile);
  const original = await readFile(join(directory, "results.json"), "utf8");
  const { server, port } = await startRouteServer(storage);
  try {
    for (const declared of [true, false]) {
      const result = await new Promise<{ status: number; json: unknown; cache: string | undefined; cors: string | undefined }>((resolve, reject) => {
        const request = httpRequest({ hostname: "127.0.0.1", port, path: "/api/results/energy-profile", method: "PUT", headers: { "Content-Type": "application/json", ...(declared ? { "Content-Length": String(4 * 1024 * 1024 + 1) } : { "Transfer-Encoding": "chunked" }) } }, (response) => {
          let text = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => { text += chunk; });
          response.on("end", () => resolve({ status: response.statusCode ?? 0, json: JSON.parse(text), cache: response.headers["cache-control"], cors: response.headers["access-control-allow-origin"] as string | undefined }));
        });
        request.setTimeout(5_000, () => request.destroy(new Error("oversized response timeout")));
        request.on("error", reject);
        request.end(declared ? "x" : "x".repeat(4 * 1024 * 1024 + 1));
      });
      assert.deepEqual(result, { status: 413, json: { error: "body_too_large" }, cache: "no-store", cors: undefined });
      assert.equal(await readFile(join(directory, "results.json"), "utf8"), original);
    }
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
});
