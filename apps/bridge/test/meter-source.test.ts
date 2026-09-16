import assert from "node:assert/strict";
import test from "node:test";

import { HomeAssistantSource, normalizePowerInWatts } from "../src/meter-source.ts";

const powerState = (state: string, unit: string | undefined = "W") => ({
  entity_id: "sensor.test_power",
  state,
  attributes: unit === undefined ? {} : { unit_of_measurement: unit },
});

const withFetchStub = async (stub: typeof fetch, run: () => Promise<void>) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
};

test("normaliseert watt, kilowatt, negatieve waarden en decimale watt", () => {
  assert.equal(normalizePowerInWatts(powerState("250", "W")), 250);
  assert.equal(normalizePowerInWatts(powerState("0.25", "kW")), 250);
  assert.equal(normalizePowerInWatts(powerState("-0.25", "kW")), -250);
  assert.equal(normalizePowerInWatts(powerState("249.6", "W")), 250);
});

test("behoudt een echte nulmeting als geldige 0 W", () => {
  assert.equal(normalizePowerInWatts(powerState("0", "W")), 0);
});

test("verwerkt W en kW hoofdletterongevoelig en met omliggende spaties", () => {
  assert.equal(normalizePowerInWatts(powerState("0.25", " kW ")), 250);
  assert.equal(normalizePowerInWatts(powerState("250", " w ")), 250);
});

test("gebruikt W als compatibele default voor een ontbrekende of lege eenheid", () => {
  assert.equal(normalizePowerInWatts(powerState("250", undefined)), 250);
  assert.equal(normalizePowerInWatts(powerState("250", "   ")), 250);
});

test("weigert expliciete onbekende vermogenseenheden", () => {
  assert.equal(normalizePowerInWatts(powerState("1", "MW")), undefined);
  assert.equal(normalizePowerInWatts(powerState("250", "VA")), undefined);
});

test("weigert ontbrekende en ongeldige Home Assistant-states", () => {
  for (const state of ["unknown", "unavailable", "none", "", "   ", "niet-numeriek"]) {
    assert.equal(normalizePowerInWatts(powerState(state)), undefined, state);
  }
  assert.equal(normalizePowerInWatts(undefined), undefined);
});

test("HomeAssistantSource werpt wanneer import en export geen geldige vermogenswaarde hebben", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify([
    powerState("unavailable"),
    { ...powerState("unknown"), entity_id: "sensor.export_power" },
  ]), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;

  try {
    const source = new HomeAssistantSource("http://home-assistant.invalid", "test-token", {
      importPower: "sensor.test_power",
      exportPower: "sensor.export_power",
    });

    await assert.rejects(source.read(), {
      message: "Geen P1-vermogenssensoren automatisch gevonden",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("vraagt exact /api/states read-only op met de vereiste headers", async () => {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchStub = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  await withFetchStub(fetchStub, async () => {
    for (const baseUrl of ["http://home-assistant.invalid", "http://home-assistant.invalid/"]) {
      const source = new HomeAssistantSource(baseUrl, "fake-test-token");
      await assert.rejects(source.read(), {
        message: "Geen P1-vermogenssensoren automatisch gevonden",
      });
    }
  });

  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.input, "http://home-assistant.invalid/api/states");
    assert.equal(call.init?.method, "GET");
    assert.deepEqual(call.init?.headers, {
      Authorization: "Bearer fake-test-token",
      "Content-Type": "application/json",
    });
  }
});

test("meldt HTTP 401 en 500 deterministisch zonder het token te lekken", async () => {
  for (const status of [401, 500]) {
    const fetchStub = (async () => new Response(null, { status })) as typeof fetch;
    await withFetchStub(fetchStub, async () => {
      const source = new HomeAssistantSource("http://home-assistant.invalid", "fake-test-token");
      await assert.rejects(source.read(), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, `Home Assistant API antwoordde met ${status}`);
        assert.equal(error.message.includes("fake-test-token"), false);
        return true;
      });
    });
  }
});

test("handelt een fetch-rejectie af zonder een gemeten reading te maken", async () => {
  const networkError = new Error("Gesimuleerde netwerkfout");
  const fetchStub = (async () => { throw networkError; }) as typeof fetch;

  await withFetchStub(fetchStub, async () => {
    const source = new HomeAssistantSource("http://home-assistant.invalid", "fake-test-token");
    await assert.rejects(source.read(), (error: unknown) => {
      assert.equal(error, networkError);
      assert.equal(String(error).includes("fake-test-token"), false);
      return true;
    });
  });
});
