import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { isHomeAssistantIngressPeer, stripHomeAssistantIngressPrefix } from "../src/ingress.ts";
import { handleHealthRequest } from "../src/health.ts";

test("normaliseert Home Assistant Ingress-paden voor app, API en assets", () => {
  const prefix = "/api/hassio_ingress/session-token";
  assert.equal(stripHomeAssistantIngressPrefix(`${prefix}/`).pathname, "/");
  assert.equal(stripHomeAssistantIngressPrefix(`${prefix}/assets/app.js`).pathname, "/assets/app.js");
  const api = stripHomeAssistantIngressPrefix(`${prefix}/api/history/price?day=today`);
  assert.equal(api.pathname, "/api/history/price");
  assert.equal(api.search, "?day=today");
  assert.equal(stripHomeAssistantIngressPrefix("/api/current").pathname, "/api/current");
});

test("vertrouwt alleen de gedocumenteerde Supervisor Ingress-peer", () => {
  assert.equal(isHomeAssistantIngressPeer("172.30.32.2"), true);
  assert.equal(isHomeAssistantIngressPeer("::ffff:172.30.32.2"), true);
  for (const peer of [undefined, "127.0.0.1", "172.30.32.3", "::1"]) assert.equal(isHomeAssistantIngressPeer(peer), false);
});

test("een genest Ingress-API-pad bereikt de routehandler na padnormalisatie", async () => {
  const server = createServer((request, response) => {
    const url = stripHomeAssistantIngressPrefix(request.url ?? "/", request.headers.host);
    request.url = `${url.pathname}${url.search}`;
    if (!handleHealthRequest(request, response, { source: "home-assistant", clients: 0 })) response.writeHead(404).end();
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/hassio_ingress/test-session/api/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { status: string }).status, "ok");
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
