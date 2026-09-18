import assert from "node:assert/strict";
import test from "node:test";
import { createCentralResultsClient, CentralResultsError } from "../src/central-results-client.ts";
import type { LocalBatteryReport } from "../src/local-battery-analysis.ts";
import type { LocalEnergyProfile } from "../src/local-energy-profile.ts";

const profile: LocalEnergyProfile = {
  version: 2, savedAt: "2026-09-17T00:00:00.000Z",
  period: { start: "2026-01-01T00:00:00.000Z", end: "2026-01-02T00:00:00.000Z" },
  measuredImportKwh: 3, estimatedImportKwh: 1, measuredExportKwh: 2, estimatedExportKwh: 0,
  measuredCount: 4, estimatedCount: 1, noConsumptionCount: 0,
  integrityReliable: true, gapCount: 0, duplicateCount: 0, overlapCount: 0,
};

const battery: LocalBatteryReport = {
  version: 3, savedAt: "2026-09-17T00:00:00.000Z",
  quality: { period: profile.period, integrityReliable: true, estimatedCount: 0, gapCount: 0, duplicateCount: 0, overlapCount: 0 },
  technical: [3, 5, 7, 10, 13].map((capacityKwh) => ({
    capacityKwh: capacityKwh as 3 | 5 | 7 | 10 | 13, powerKw: capacityKwh / 2,
    shiftedKwh: 0, chargedFromExportKwh: 0, endingStoredKwh: 0, lossesKwh: 0, equivalentCycles: 0,
  })),
};

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

test("GET, PUT en DELETE gebruiken de centrale result-endpoints", async () => {
  const calls: Array<{ url: string; method: string; body?: string }> = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(input), method: init?.method ?? "GET", ...(init?.body ? { body: String(init.body) } : {}) };
    calls.push(call);
    if (call.method === "GET") return json({ result: profile });
    if (call.method === "PUT") return json(profile);
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  const client = createCentralResultsClient({ baseUrl: "http://pi.test/", fetchImpl });

  assert.deepEqual(await client.getEnergyProfile(), profile);
  assert.deepEqual(await client.saveEnergyProfile(profile), profile);
  await client.removeEnergyProfile();
  assert.deepEqual(calls.map((call) => [call.method, call.url]), [
    ["GET", "http://pi.test/api/results/energy-profile"],
    ["PUT", "http://pi.test/api/results/energy-profile"],
    ["DELETE", "http://pi.test/api/results/energy-profile"],
  ]);
  assert.deepEqual(JSON.parse(calls[1]!.body!), profile);
});

test("batterijrapport wordt strikt gevalideerd bij ophalen en bewaren", async () => {
  let body = "";
  const client = createCentralResultsClient({ fetchImpl: (async (_input, init) => {
    body = String(init?.body ?? "");
    return json(battery);
  }) as typeof fetch });
  assert.deepEqual(await client.getBatteryReport(), battery);
  assert.deepEqual(await client.saveBatteryReport(battery), battery);
  assert.deepEqual(JSON.parse(body), battery);
});

test("404 betekent leeg resultaat; DELETE op een lege installatie is veilig", async () => {
  const methods: string[] = [];
  const client = createCentralResultsClient({ fetchImpl: (async (_input, init) => {
    methods.push(init?.method ?? "GET");
    return new Response(null, { status: 404 });
  }) as typeof fetch });
  assert.equal(await client.getEnergyProfile(), undefined);
  await client.removeBatteryReport();
  assert.deepEqual(methods, ["GET", "DELETE"]);
});

test("een 200-resultaat met null wordt als lege centrale opslag behandeld", async () => {
  const client = createCentralResultsClient({ fetchImpl: (async () => json({ result: null })) as typeof fetch });
  assert.equal(await client.getEnergyProfile(), undefined);
});

test("ongeldige antwoorden en netwerkfouten geven veilige domeinfouten", async () => {
  const invalid = createCentralResultsClient({ fetchImpl: (async () => json({ version: 2 })) as typeof fetch });
  await assert.rejects(() => invalid.getEnergyProfile(), (error: unknown) => error instanceof CentralResultsError && error.code === "invalid");

  const failing = createCentralResultsClient({ fetchImpl: (async () => { throw new Error("secret token must not escape"); }) as typeof fetch });
  await assert.rejects(() => failing.getEnergyProfile(), (error: unknown) => error instanceof CentralResultsError && error.code === "network" && error.message === "De Raspberry Pi is momenteel niet bereikbaar.");
});

test("ongeldig opslaan stopt vóór de netwerkwrite", async () => {
  let calls = 0;
  const client = createCentralResultsClient({ fetchImpl: (async () => { calls++; return json(profile); }) as typeof fetch });
  await assert.rejects(() => client.saveEnergyProfile({ ...profile, measuredImportKwh: -1 }), (error: unknown) => error instanceof CentralResultsError && error.code === "invalid");
  assert.equal(calls, 0);
});
