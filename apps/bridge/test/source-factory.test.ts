import assert from "node:assert/strict";
import test from "node:test";

import { HomeAssistantSource } from "../src/meter-source.ts";
import { createMeterSource, type MeterSourceConfiguration } from "../src/source-factory.ts";

test("selecteert Home Assistant en trimt URL en token vóór constructie", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl: RequestInfo | URL | undefined;
  let requestedAuthorization: string | undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = input;
    requestedAuthorization = (init?.headers as Record<string, string> | undefined)?.Authorization;
    return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  try {
    const source = createMeterSource({
      homeAssistantUrl: "  http://home-assistant.invalid/  ",
      homeAssistantToken: "  fake-test-token  ",
    });

    assert.equal(source.name, "home-assistant");
    await assert.rejects(source.read(), {
      message: "Geen P1-vermogenssensoren automatisch gevonden",
    });
    assert.equal(requestedUrl, "http://home-assistant.invalid/api/states");
    assert.equal(requestedAuthorization, "Bearer fake-test-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("selecteert simulatie voor ontbrekende, lege en whitespace-configuratie", () => {
  const incompleteConfigurations: MeterSourceConfiguration[] = [
    {},
    { homeAssistantToken: "fake-test-token" },
    { homeAssistantUrl: "http://home-assistant.invalid" },
    { homeAssistantUrl: "", homeAssistantToken: "fake-test-token" },
    { homeAssistantUrl: "   ", homeAssistantToken: "fake-test-token" },
    { homeAssistantUrl: "http://home-assistant.invalid", homeAssistantToken: "" },
    { homeAssistantUrl: "http://home-assistant.invalid", homeAssistantToken: "   " },
  ];

  for (const configuration of incompleteConfigurations) {
    assert.equal(createMeterSource(configuration).name, "simulated-p1");
  }
});

test("behoudt de geconfigureerde entitymapping zonder netwerkcall", () => {
  const entities = {
    importPower: "sensor.import_power",
    exportPower: "sensor.export_power",
    importEnergy: "sensor.import_energy",
    exportEnergy: "sensor.export_energy",
    voltage: "sensor.voltage",
    currentPrice: "sensor.current_price",
    nextPrice: "sensor.next_price",
  };
  const source = createMeterSource({
    homeAssistantUrl: "http://home-assistant.invalid",
    homeAssistantToken: "fake-test-token",
    entities,
  });

  assert.ok(source instanceof HomeAssistantSource);
  assert.deepEqual(source.detectedEntities, entities);
});
