import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import test from "node:test";

import { handleBridgeRoutePrelude } from "../src/bridge-route-prelude.js";
import {
  HomeAssistantSource,
  PowerHistoryNotConfiguredError,
  SimulatedP1Source,
} from "../src/meter-source.js";
import { handlePowerHistoryRequest } from "../src/power-history-route.js";
import {
  loadPowerHistory,
  PowerHistoryUnavailableError,
  PowerHistoryUpstreamError,
  type PowerHistoryResponse,
} from "../src/power-history-service.js";

const emptyResult = {
  points: [],
  invalidCount: 0,
  outsideWindowCount: 0,
  duplicateCount: 0,
};

const responseFor = (start: string, end: string): PowerHistoryResponse => ({
  start,
  end,
  quality: "incomplete",
  import: emptyResult,
  export: emptyResult,
});

const withRouteServer = async (
  loader: Parameters<typeof handlePowerHistoryRequest>[3],
  run: (port: number) => Promise<void>,
  now = () => new Date("2026-12-31T00:00:00.000Z"),
) => {
  const source = new SimulatedP1Source();
  const server = createServer((request, response) => {
    if (!handlePowerHistoryRequest(request, response, source, loader, now)) {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    await run(address.port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
};

const requestJson = (port: number, path: string, method = "GET") =>
  new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: unknown }>((resolve, reject) => {
    const request = httpRequest({ hostname: "127.0.0.1", port, path, method }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({
        status: response.statusCode ?? 0,
        headers: response.headers,
        body: body === "" ? undefined : JSON.parse(body),
      }));
    });
    request.once("error", reject);
    request.end();
  });

test("weigert ontbrekende lege dubbele en ongeldige querywaarden vóór de loader", async () => {
  let loaderCalls = 0;
  await withRouteServer(async (_source, start, end) => {
    loaderCalls += 1;
    return responseFor(start, end);
  }, async (port) => {
    const invalidPaths = [
      "/api/history/power",
      "/api/history/power?start=&end=2026-01-02T10%3A00%3A00Z",
      "/api/history/power?start=2026-01-02T09%3A00%3A00Z",
      "/api/history/power?start=invalid&end=2026-01-02T10%3A00%3A00Z",
      "/api/history/power?start=2026-01-02T09%3A00%3A00Z&start=2026-01-02T09%3A30%3A00Z&end=2026-01-02T10%3A00%3A00Z",
      "/api/history/power?start=2026-01-02T09%3A00%3A00Z&end=2026-01-02T10%3A00%3A00Z&end=2026-01-02T11%3A00%3A00Z",
    ];
    for (const path of invalidPaths) {
      const response = await requestJson(port, path);
      assert.equal(response.status, 400);
      assert.equal(response.headers["content-type"], "application/json");
      assert.equal(response.headers["cache-control"], "no-store");
      assert.equal(response.headers["access-control-allow-origin"], "*");
      assert.deepEqual(response.body, {
        error: { code: "INVALID_HISTORY_QUERY", message: "De historyquery is ongeldig" },
      });
    }
  });
  assert.equal(loaderCalls, 0);
});

test("begrensd venster is positief en accepteert normale 24 uur met canonieke offsetoutput", async () => {
  const calls: Array<{ start: string; end: string }> = [];
  await withRouteServer(async (_source, start, end) => {
    calls.push({ start, end });
    return responseFor(start, end);
  }, async (port) => {
    for (const path of [
      "/api/history/power?start=2026-01-02T10%3A00%3A00Z&end=2026-01-02T10%3A00%3A00Z",
      "/api/history/power?start=2026-01-02T11%3A00%3A00Z&end=2026-01-02T10%3A00%3A00Z",
      "/api/history/power?start=2026-01-01T08%3A59%3A59Z&end=2026-01-02T10%3A00%3A00Z",
    ]) {
      const response = await requestJson(port, path);
      assert.equal(response.status, 400);
      assert.deepEqual(response.body, {
        error: { code: "INVALID_HISTORY_WINDOW", message: "Het historyvenster is ongeldig" },
      });
    }

    const valid = await requestJson(
      port,
      "/api/history/power?start=2026-01-01T11%3A00%3A00%2B01%3A00&end=2026-01-02T11%3A00%3A00%2B01%3A00",
    );
    assert.equal(valid.status, 200);
    assert.equal(valid.headers["content-type"], "application/json");
    assert.equal(valid.headers["cache-control"], "no-store");
    assert.equal(valid.headers["access-control-allow-origin"], "*");
    assert.deepEqual(valid.body, responseFor("2026-01-01T10:00:00.000Z", "2026-01-02T10:00:00.000Z"));
  });
  assert.deepEqual(calls, [{
    start: "2026-01-01T10:00:00.000Z",
    end: "2026-01-02T10:00:00.000Z",
  }]);
});

test("accepteert exact 25 uur maar weigert ieder langer venster", async () => {
  const calls: Array<{ start: string; end: string }> = [];
  await withRouteServer(async (_source, start, end) => {
    calls.push({ start, end });
    return responseFor(start, end);
  }, async (port) => {
    const accepted = await requestJson(port, "/api/history/power?start=2026-10-24T22%3A00%3A00Z&end=2026-10-25T23%3A00%3A00Z");
    assert.equal(accepted.status, 200);
    const rejected = await requestJson(port, "/api/history/power?start=2026-10-24T21%3A59%3A59Z&end=2026-10-25T23%3A00%3A00Z");
    assert.equal(rejected.status, 400);
    assert.deepEqual(rejected.body, {
      error: { code: "INVALID_HISTORY_WINDOW", message: "Het historyvenster is ongeldig" },
    });
  });
  assert.equal(calls.length, 1);
});

test("accepteert end gelijk aan now en weigert toekomst vóór de loader", async () => {
  const fixedNow = new Date("2026-08-28T12:00:00.000Z");
  let loaderCalls = 0;
  await withRouteServer(async (_source, start, end) => {
    loaderCalls += 1;
    return responseFor(start, end);
  }, async (port) => {
    const accepted = await requestJson(port, "/api/history/power?start=2026-08-28T11%3A00%3A00Z&end=2026-08-28T12%3A00%3A00Z");
    assert.equal(accepted.status, 200);
    const future = await requestJson(port, "/api/history/power?start=2026-08-28T11%3A00%3A00Z&end=2026-08-28T12%3A00%3A00.001Z");
    assert.equal(future.status, 400);
    assert.deepEqual(future.body, {
      error: { code: "INVALID_HISTORY_WINDOW", message: "Het historyvenster is ongeldig" },
    });
  }, () => fixedNow);
  assert.equal(loaderCalls, 1);
});

test("route accepteert alleen GET en behoudt veilige JSON no-store en CORS-headers", async () => {
  await withRouteServer(async (_source, start, end) => responseFor(start, end), async (port) => {
    const response = await requestJson(
      port,
      "/api/history/power?start=2026-01-02T09%3A00%3A00Z&end=2026-01-02T10%3A00%3A00Z",
      "POST",
    );
    assert.equal(response.status, 405);
    assert.equal(response.headers["content-type"], "application/json");
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal(response.headers["access-control-allow-origin"], "*");
    assert.equal(response.headers["access-control-allow-headers"], "Content-Type");
  });
});

test("productiecompositie geeft history-OPTIONS 405 maar behoudt overige OPTIONS als 204", async () => {
  const source = new SimulatedP1Source();
  const server = createServer((request, response) => {
    if (!handleBridgeRoutePrelude(request, response, source)) {
      response.writeHead(418).end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const history = await requestJson(address.port, "/api/history/power", "OPTIONS");
    assert.equal(history.status, 405);
    assert.deepEqual(history.body, {
      error: { code: "METHOD_NOT_ALLOWED", message: "Methode niet toegestaan" },
    });
    const current = await requestJson(address.port, "/api/current", "OPTIONS");
    assert.equal(current.status, 204);
    assert.equal(current.body, undefined);
    assert.equal(current.headers["access-control-allow-origin"], "*");
    assert.equal(current.headers["access-control-allow-headers"], "Content-Type");
    assert.equal(current.headers["cache-control"], "no-store");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("simulatie is unavailable zonder Home Assistant- of historyaanroep", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("fetch must not run");
  }) as typeof fetch;
  try {
    await assert.rejects(
      loadPowerHistory(new SimulatedP1Source(), "2026-01-02T09:00:00.000Z", "2026-01-02T10:00:00.000Z"),
      PowerHistoryUnavailableError,
    );
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Home Assistant gebruikt één states-GET en exact twee read-only historycalls", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: URL; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    if (url.pathname === "/api/states") {
      return new Response(JSON.stringify([
        { entity_id: "sensor.synthetic_import", state: "0", attributes: { unit_of_measurement: " W " } },
        { entity_id: "sensor.synthetic_export", state: "0", attributes: { unit_of_measurement: "kW" } },
      ]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const entity = url.searchParams.get("filter_entity_id");
    const records = entity === "sensor.synthetic_import"
      ? [{ state: "125.4", last_changed: "2026-01-02T09:15:00Z", secret: "hidden" }]
      : [{ state: "0.25", last_changed: "2026-01-02T09:30:00Z", entity_id: "hidden" }];
    return new Response(JSON.stringify([records]), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  try {
    const source = new HomeAssistantSource("http://home-assistant.test", "fake-token", {
      importPower: "sensor.synthetic_import",
      exportPower: "sensor.synthetic_export",
    });
    const result = await loadPowerHistory(source, "2026-01-02T09:00:00.000Z", "2026-01-02T10:00:00.000Z");

    assert.deepEqual(result, {
      start: "2026-01-02T09:00:00.000Z",
      end: "2026-01-02T10:00:00.000Z",
      quality: "measured",
      import: { points: [{ timestamp: "2026-01-02T09:15:00.000Z", powerW: 125 }], invalidCount: 0, outsideWindowCount: 0, duplicateCount: 0 },
      export: { points: [{ timestamp: "2026-01-02T09:30:00.000Z", powerW: 250 }], invalidCount: 0, outsideWindowCount: 0, duplicateCount: 0 },
    });
    assert.equal(JSON.stringify(result).includes("sensor."), false);
    assert.equal(JSON.stringify(result).includes("hidden"), false);
    assert.equal(calls.length, 3);
    assert.equal(calls.filter(({ url }) => url.pathname === "/api/states").length, 1);
    const histories = calls.filter(({ url }) => url.pathname.startsWith("/api/history/period/"));
    assert.deepEqual(histories.map(({ url }) => url.searchParams.get("filter_entity_id")).sort(), [
      "sensor.synthetic_export",
      "sensor.synthetic_import",
    ]);
    for (const call of calls) {
      assert.equal(call.init?.method, "GET");
      assert.deepEqual(call.init?.headers, {
        Authorization: "Bearer fake-token",
        "Content-Type": "application/json",
      });
    }
    for (const { url } of histories) {
      assert.equal(decodeURIComponent(url.pathname), "/api/history/period/2026-01-02T09:00:00.000Z");
      assert.equal(url.searchParams.get("end_time"), "2026-01-02T10:00:00.000Z");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ontbrekende meervoudige of ongeldige kanaalconfiguratie stopt na één states-call", async () => {
  const cases = [
    {
      entities: { importPower: "sensor.import", exportPower: "sensor.missing" },
      states: [{ entity_id: "sensor.import", state: "0", attributes: { unit_of_measurement: "W" } }],
    },
    {
      entities: { importPower: "sensor.import,sensor.other", exportPower: "sensor.export" },
      states: [
        { entity_id: "sensor.import", state: "0", attributes: { unit_of_measurement: "W" } },
        { entity_id: "sensor.export", state: "0", attributes: { unit_of_measurement: "W" } },
      ],
    },
    {
      entities: { importPower: "sensor.import", exportPower: "sensor.export" },
      states: [
        { entity_id: "sensor.import", state: "0", attributes: { unit_of_measurement: "VA" } },
        { entity_id: "sensor.export", state: "0", attributes: { unit_of_measurement: "W" } },
      ],
    },
  ];

  for (const fixture of cases) {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify(fixture.states), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
    try {
      const source = new HomeAssistantSource("http://home-assistant.test", "fake-token", fixture.entities);
      await assert.rejects(
        loadPowerHistory(source, "2026-01-02T09:00:00.000Z", "2026-01-02T10:00:00.000Z"),
        PowerHistoryNotConfiguredError,
      );
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
});

test("lege geldige history blijft 200-semantiek met incomplete kwaliteit", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input) => {
    const url = new URL(String(input));
    return url.pathname === "/api/states"
      ? new Response(JSON.stringify([
        { entity_id: "sensor.import", state: "0", attributes: { unit_of_measurement: "W" } },
        { entity_id: "sensor.export", state: "0", attributes: { unit_of_measurement: "W" } },
      ]), { status: 200 })
      : new Response("[[]]", { status: 200 });
  }) as typeof fetch;
  try {
    const result = await loadPowerHistory(
      new HomeAssistantSource("http://home-assistant.test", "fake-token", { importPower: "sensor.import", exportPower: "sensor.export" }),
      "2026-01-02T09:00:00.000Z",
      "2026-01-02T10:00:00.000Z",
    );
    assert.equal(result.quality, "incomplete");
    assert.deepEqual(result.import, emptyResult);
    assert.deepEqual(result.export, emptyResult);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Home Assistant HTTP- en fetchfouten worden veilige upstreamfouten", async () => {
  for (const failure of [
    async () => new Response("synthetic upstream body", { status: 500 }),
    async () => { throw new Error("synthetic fetch detail"); },
  ]) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = failure as typeof fetch;
    try {
      await assert.rejects(
        loadPowerHistory(
          new HomeAssistantSource("http://home-assistant.test", "fake-token", {
            importPower: "sensor.import",
            exportPower: "sensor.export",
          }),
          "2026-01-02T09:00:00.000Z",
          "2026-01-02T10:00:00.000Z",
        ),
        (error: unknown) => {
          assert.ok(error instanceof PowerHistoryUpstreamError);
          assert.equal(error.code, "HISTORY_UPSTREAM_ERROR");
          assert.equal(error.message, "Vermogenshistory kon niet worden opgehaald");
          assert.equal(error.message.includes("synthetic"), false);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
});

test("historyfalen na geslaagde states-resolutie wordt veilig upstream gemapt", async () => {
  for (const historyFailure of ["http", "fetch"] as const) {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async (input) => {
      calls += 1;
      const url = new URL(String(input));
      if (url.pathname === "/api/states") {
        return new Response(JSON.stringify([
          { entity_id: "sensor.import", state: "0", attributes: { unit_of_measurement: "W" } },
          { entity_id: "sensor.export", state: "0", attributes: { unit_of_measurement: "W" } },
        ]), { status: 200 });
      }
      if (historyFailure === "fetch") throw new Error("synthetic history fetch detail");
      return new Response("synthetic history upstream body", { status: 500 });
    }) as typeof fetch;
    try {
      await assert.rejects(
        loadPowerHistory(
          new HomeAssistantSource("http://home-assistant.test", "fake-token", {
            importPower: "sensor.import",
            exportPower: "sensor.export",
          }),
          "2026-01-02T09:00:00.000Z",
          "2026-01-02T10:00:00.000Z",
        ),
        (error: unknown) => {
          assert.ok(error instanceof PowerHistoryUpstreamError);
          assert.equal(error.code, "HISTORY_UPSTREAM_ERROR");
          assert.equal(error.message, "Vermogenshistory kon niet worden opgehaald");
          assert.equal(error.message.includes("synthetic"), false);
          return true;
        },
      );
      assert.equal(calls, 3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
});

test("publieke foutmapping is exact en redigeert upstream en interne details", async () => {
  const syntheticSecret = "synthetic upstream token entity url stack";
  const cases = [
    { error: new PowerHistoryUnavailableError(), status: 503, code: "HISTORY_UNAVAILABLE", message: "Vermogenshistory is niet beschikbaar" },
    { error: new PowerHistoryNotConfiguredError(), status: 503, code: "HISTORY_NOT_CONFIGURED", message: "Vermogenshistory is niet geconfigureerd" },
    { error: new PowerHistoryUpstreamError(), status: 502, code: "HISTORY_UPSTREAM_ERROR", message: "Vermogenshistory kon niet worden opgehaald" },
    { error: new Error(syntheticSecret), status: 500, code: "HISTORY_INTERNAL_ERROR", message: "Vermogenshistory kon niet worden verwerkt" },
  ];
  for (const fixture of cases) {
    await withRouteServer(async () => { throw fixture.error; }, async (port) => {
      const response = await requestJson(port, "/api/history/power?start=2026-01-02T09%3A00%3A00Z&end=2026-01-02T10%3A00%3A00Z");
      assert.equal(response.status, fixture.status);
      assert.deepEqual(response.body, { error: { code: fixture.code, message: fixture.message } });
      assert.equal(JSON.stringify(response.body).includes(syntheticSecret), false);
    });
  }
});
