import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import {
  handleHealthRequest,
  InvalidHealthClientCountError,
  mapHealthResponse,
} from "../src/health.js";

test("maakt exact de veilige Home Assistant-healthresponse", () => {
  const result = mapHealthResponse({
    source: "home-assistant",
    clients: 3,
  });

  assert.deepEqual(result, {
    status: "ok",
    source: "home-assistant",
    configured: true,
    simulation: false,
    clients: 3,
  });
  assert.deepEqual(Object.keys(result), [
    "status",
    "source",
    "configured",
    "simulation",
    "clients",
  ]);
});

test("maakt exact de veilige simulatie-healthresponse", () => {
  assert.deepEqual(mapHealthResponse({
    source: "simulated-p1",
    clients: 0,
  }), {
    status: "ok",
    source: "simulated-p1",
    configured: false,
    simulation: true,
    clients: 0,
  });
});

test("redigeert iedere fout tot degraded zonder foutdetails", () => {
  const syntheticSecret = "synthetic internal failure with token and entity";
  const result = mapHealthResponse({
    source: "home-assistant",
    hasError: Boolean(syntheticSecret),
    clients: 1,
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, "degraded");
  assert.equal(serialized.includes(syntheticSecret), false);
  for (const forbidden of ["error", "token", "entity", "timestamp", "url", "meter"]) {
    assert.equal(Object.hasOwn(result, forbidden), false);
  }
  assert.equal(Object.keys(result).length, 5);
});

test("weigert negatieve en niet-eindige clientaantallen met één vaste foutcode", () => {
  for (const clients of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(
      () => mapHealthResponse({ source: "home-assistant", clients }),
      (error: unknown) => {
        assert.ok(error instanceof InvalidHealthClientCountError);
        assert.equal(error.code, "INVALID_HEALTH_CLIENT_COUNT");
        return true;
      },
    );
  }
});

test("serveert health lokaal alleen via GET met de bestaande veilige headers", async () => {
  const server = createServer((request, response) => {
    if (!handleHealthRequest(request, response, {
      source: "home-assistant",
      hasError: true,
      clients: 2,
    })) {
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
    const endpoint = `http://127.0.0.1:${address.port}/api/health`;

    const getResponse = await fetch(endpoint, { method: "GET" });
    assert.equal(getResponse.status, 200);
    assert.equal(getResponse.headers.get("content-type"), "application/json");
    assert.equal(getResponse.headers.get("cache-control"), "no-store");
    assert.equal(getResponse.headers.get("access-control-allow-origin"), "*");
    assert.equal(getResponse.headers.get("access-control-allow-headers"), "Content-Type");
    assert.deepEqual(await getResponse.json(), {
      status: "degraded",
      source: "home-assistant",
      configured: true,
      simulation: false,
      clients: 2,
    });

    const postResponse = await fetch(endpoint, { method: "POST" });
    assert.equal(postResponse.status, 405);
    assert.notEqual(postResponse.status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
