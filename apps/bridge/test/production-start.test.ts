import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import test from "node:test";

const bridgeDirectory = fileURLToPath(new URL("..", import.meta.url));
const bridgeManifestPath = fileURLToPath(new URL("../package.json", import.meta.url));
const rootManifestPath = fileURLToPath(new URL("../../../package.json", import.meta.url));
const builtServerPath = fileURLToPath(new URL("../dist/server.js", import.meta.url));
const repositoryRoot = resolve(bridgeDirectory, "../..");
const webDist = resolve(repositoryRoot, "apps/web/dist");

const builtAssets = (directory = webDist) => {
  const html = readFileSync(resolve(directory, "index.html"), "utf8");
  const js = html.match(/src="(assets\/app-[a-f0-9]{16}\.js)"/)?.[1];
  const css = html.match(/href="(assets\/app-[a-f0-9]{16}\.css)"/)?.[1];
  assert.ok(js, "HTML references a hashed production script");
  assert.ok(css, "HTML references hashed production styles");
  return { html, js, css };
};

const readManifest = (path: string) => JSON.parse(readFileSync(path, "utf8")) as {
  scripts?: Record<string, string>;
};

test("legt exact het build-first productie-startpunt in beide manifests vast", () => {
  const bridgeManifest = readManifest(bridgeManifestPath);
  const rootManifest = readManifest(rootManifestPath);

  assert.equal(bridgeManifest.scripts?.start, "node dist/server.js");
  assert.equal(bridgeManifest.scripts?.pretest, "pnpm build");
  assert.equal(rootManifest.scripts?.["start:bridge"], "pnpm --filter @crems/bridge start");
  assert.equal(existsSync(builtServerPath), true);
});

test("sluit lokale rapporten en geheimen uit de Docker-buildcontext en image", () => {
  const dockerignore = readFileSync(resolve(repositoryRoot, ".dockerignore"), "utf8");
  const gitignore = readFileSync(resolve(repositoryRoot, ".gitignore"), "utf8");
  const dockerfile = readFileSync(resolve(repositoryRoot, "apps/home-assistant-addon/crems/Dockerfile"), "utf8");
  assert.match(dockerignore, /^apps\/bridge\/data\/runtime\/$/m);
  assert.match(dockerignore, /^\*\*\/\.env$/m);
  assert.match(gitignore, /^apps\/bridge\/data\/runtime\/$/m);
  assert.match(dockerfile, /COPY --from=build \/src\/apps\/bridge\/data\/belpex-day-ahead-[^ ]+ \.\/data\/belpex-day-ahead-[^\s]+/);
  assert.match(dockerfile, /CREMS_REQUIRE_INGRESS_PEER=true/);
  assert.doesNotMatch(dockerfile, /COPY --from=build \/src\/apps\/bridge\/data\s/);
});

test("publiceert de Raspberry Pi-app uitsluitend via geauthenticeerde Home Assistant Ingress", () => {
  const rootConfig = readFileSync(resolve(repositoryRoot, "crems/config.yaml"), "utf8");
  const addonConfig = readFileSync(resolve(repositoryRoot, "apps/home-assistant-addon/crems/config.yaml"), "utf8");
  for (const config of [rootConfig, addonConfig]) {
    assert.match(config, /^ingress: true$/m);
    assert.match(config, /^ingress_port: 8099$/m);
    assert.doesNotMatch(config, /^ports:$/m);
    assert.doesNotMatch(config, /^webui:/m);
  }
  const server = readFileSync(resolve(repositoryRoot, "apps/bridge/src/server.ts"), "utf8");
  assert.match(server, /isHomeAssistantIngressPeer\(request\.socket\.remoteAddress\)/);
  assert.doesNotMatch(server, /Access-Control-Allow-Origin/);
  const normalizeRequest = server.indexOf("request.url = `${url.pathname}${url.search}`");
  assert.notEqual(normalizeRequest, -1);
  for (const dispatch of ["handleHealthRequest", "handlePriceHistoryRequest", "handleBelpexHistoryRequest", "handleCentralStorageRequest"]) {
    assert.ok(normalizeRequest < server.indexOf(`${dispatch}(request`), `${dispatch} moet de genormaliseerde Ingress-route ontvangen`);
  }
  for (const route of ["central-storage-route.ts", "bridge-route-prelude.ts", "health.ts", "power-history-route.ts", "price-history-route.ts", "belpex-history-route.ts"]) {
    assert.doesNotMatch(readFileSync(resolve(repositoryRoot, "apps/bridge/src", route), "utf8"), /Access-Control-Allow-Origin/);
  }
});

test("productieassets hebben echte inhoudshashes, relatieve Ingress-links en geen sourcemaps", () => {
  const { html, js, css } = builtAssets();
  assert.doesNotMatch(html, /(?:src|href)="\/assets\//);
  assert.deepEqual(readdirSync(resolve(webDist, "assets")).sort(), [js, css].map(path => path.slice("assets/".length)).sort());
  for (const path of [js, css]) {
    const bytes = readFileSync(resolve(webDist, path));
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    assert.ok(path.includes(`-${hash}.`), "filename describes the exact served bytes");
    assert.doesNotMatch(bytes.toString(), /sourceMappingURL=/);
    const base = new URL("https://home-assistant.test/api/hassio_ingress/test-session/");
    assert.ok(new URL(path, base).pathname.startsWith(base.pathname));
  }
});

test("productiebouw minificeert en vervangt alleen de hash van gewijzigde inhoud; dev houdt vaste namen", async () => {
  const { buildWeb } = await import("../../web/scripts/build.mjs");
  const directory = await mkdtemp(resolve(tmpdir(), "crems-build-test-"));
  try {
    await mkdir(resolve(directory, "src"));
    await writeFile(resolve(directory, "index.html"), '<html><head></head><body><script type="module" src="/src/main.tsx"></script></body></html>');
    await writeFile(resolve(directory, "src/main.tsx"), 'import "./style.css"; /* remove this build comment */ console.log("first-content");');
    await writeFile(resolve(directory, "src/style.css"), '/* remove this style comment */ .example { color: red; padding: 10px 10px 10px 10px; }');
    await buildWeb(directory, false);
    const developmentJsBytes = (await readFile(resolve(directory, "dist/assets/app.js"))).length;
    const developmentCssBytes = (await readFile(resolve(directory, "dist/assets/app.css"))).length;
    assert.ok(existsSync(resolve(directory, "dist/assets/app.js.map")));
    assert.match(await readFile(resolve(directory, "dist/index.html"), "utf8"), /src="assets\/app\.js"/);
    await buildWeb(directory);
    const first = builtAssets(resolve(directory, "dist"));
    assert.ok((await readFile(resolve(directory, "dist", first.js))).length < developmentJsBytes);
    assert.ok((await readFile(resolve(directory, "dist", first.css))).length < developmentCssBytes);
    assert.equal(readdirSync(resolve(directory, "dist/assets")).some(name => name.endsWith(".map")), false);
    await buildWeb(directory);
    assert.deepEqual(builtAssets(resolve(directory, "dist")), first, "same content keeps both cache keys");
    await writeFile(resolve(directory, "src/main.tsx"), 'import "./style.css"; console.log("second-content");');
    await buildWeb(directory);
    const second = builtAssets(resolve(directory, "dist"));
    assert.notEqual(second.js, first.js);
    assert.equal(second.css, first.css);
    assert.equal(existsSync(resolve(directory, "dist", first.js)), false, "old build artifacts are removed");
    await writeFile(resolve(directory, "src/style.css"), '.example { color: blue; padding: 20px; }');
    await buildWeb(directory);
    const third = builtAssets(resolve(directory, "dist"));
    assert.notEqual(third.css, second.css);
    assert.equal(third.js, second.js);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("echte productie-HTTP responses cachen uitsluitend bestaande gehashte assets immutable, ook via Ingress", { timeout: 20_000 }, async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "crems-http-cache-"));
  let child: ReturnType<typeof spawn> | undefined;
  try {
    // Isolate startup from the developer's .env, saved reports, and actual meter source.
    await cp(resolve(bridgeDirectory, "dist"), resolve(directory, "bridge"), { recursive: true });
    await cp(webDist, resolve(directory, "web"), { recursive: true });
    await mkdir(resolve(directory, "data"));
    await writeFile(resolve(directory, "package.json"), '{"type":"module"}');
    await writeFile(resolve(directory, "data/belpex-day-ahead-2021-09-01_2026-08-31.csv"), "start_utc,resolution_minutes,price_eur_mwh\n2026-01-01T00:00:00Z,15,10\n");
    await writeFile(resolve(directory, "web/assets/legacy.js"), 'console.log("legacy")');
    await writeFile(resolve(directory, "web/assets/unknown.txt"), "synthetic");
    const reservation = createServer();
    await new Promise<void>((resolve, reject) => { reservation.once("error", reject); reservation.listen(0, "127.0.0.1", resolve); });
    const address = reservation.address();
    assert.ok(address && typeof address === "object");
    const port = address.port;
    await new Promise<void>((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
    child = spawn(process.execPath, [resolve(directory, "bridge/server.js")], {
      cwd: directory, windowsHide: true,
      env: { SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, CREMS_BRIDGE_HOST: "127.0.0.1", CREMS_BRIDGE_PORT: String(port), CREMS_WEB_ROOT: resolve(directory, "web"), CREMS_DATA_DIR: resolve(directory, "runtime") },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const running = child;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("isolated bridge startup timed out")), 8_000);
      running.once("error", error => { clearTimeout(timeout); reject(error); });
      running.once("exit", code => { clearTimeout(timeout); reject(new Error(`isolated bridge exited: ${code}`)); });
      running.stdout!.on("data", chunk => { if (String(chunk).includes("CREMS Bridge active")) { clearTimeout(timeout); resolve(); } });
    });
    const origin = `http://127.0.0.1:${port}`;
    const { js, css } = builtAssets();
    for (const prefix of ["/", "/api/hassio_ingress/test-session/"]) {
      for (const asset of [js, css]) {
        for (const method of ["GET", "HEAD"]) {
          const response = await fetch(`${origin}${prefix}${asset}`, { method });
          assert.equal(response.status, 200);
          assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
          const body = Buffer.from(await response.arrayBuffer());
          if (method === "GET") assert.deepEqual(body, readFileSync(resolve(webDist, asset)));
          else assert.equal(body.length, 0);
        }
      }
      for (const path of ["", "index.html", "assets/legacy.js", "assets/unknown.txt", "assets/app-0000000000000000.js", "assets/app.js.map", "api/current", "api/health", "api/history/price?day=invalid", "api/history/power", "api/results/energy-profile", "api/results/battery-report"]) {
        const response = await fetch(`${origin}${prefix}${path}`);
        assert.equal(response.headers.get("cache-control"), "no-store", path);
        await response.arrayBuffer();
      }
      for (const method of ["PUT", "DELETE", "OPTIONS"]) {
        const response = await fetch(`${origin}${prefix}api/results/energy-profile`, { method, ...(method === "PUT" ? { body: "{}", headers: { "Content-Type": "application/json" } } : {}) });
        assert.equal(response.headers.get("cache-control"), "no-store", method);
        await response.arrayBuffer();
      }
      const controller = new AbortController();
      const stream = await fetch(`${origin}${prefix}api/stream`, { signal: controller.signal });
      assert.equal(stream.headers.get("cache-control"), "no-store");
      assert.match(stream.headers.get("content-type") ?? "", /text\/event-stream/);
      const reader = stream.body!.getReader();
      assert.match(new TextDecoder().decode((await reader.read()).value), /^data: /);
      await reader.cancel(); controller.abort();
      const archive = await fetch(`${origin}${prefix}api/history/belpex?start=2026-01-01T00:00:00Z&end=2026-01-01T00:15:00Z`);
      assert.equal(archive.headers.get("cache-control"), "public, max-age=86400", "existing static archive cache remains unchanged");
      await archive.arrayBuffer();
    }
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise<void>(resolve => child!.once("exit", () => resolve()));
      child.kill(); await stopped;
    }
    await rm(directory, { recursive: true, force: true });
  }
});

test("Ingress-productieserver weigert echte HTTP-verzoeken van andere peers vóór assets en opslag", { timeout: 20_000 }, async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "crems-peer-test-"));
  let child: ReturnType<typeof spawn> | undefined;
  try {
    await cp(resolve(bridgeDirectory, "dist"), resolve(directory, "bridge"), { recursive: true });
    await mkdir(resolve(directory, "data"));
    await writeFile(resolve(directory, "package.json"), '{"type":"module"}');
    await writeFile(resolve(directory, "data/belpex-day-ahead-2021-09-01_2026-08-31.csv"), "start_utc,resolution_minutes,price_eur_mwh\n2026-01-01T00:00:00Z,15,10\n");
    const reservation = createServer();
    await new Promise<void>((resolve, reject) => { reservation.once("error", reject); reservation.listen(0, "127.0.0.1", resolve); });
    const address = reservation.address();
    assert.ok(address && typeof address === "object");
    await new Promise<void>((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
    child = spawn(process.execPath, [resolve(directory, "bridge/server.js")], {
      cwd: directory, windowsHide: true,
      env: { SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, CREMS_BRIDGE_HOST: "127.0.0.1", CREMS_BRIDGE_PORT: String(address.port), CREMS_REQUIRE_INGRESS_PEER: "true", CREMS_DATA_DIR: resolve(directory, "runtime") },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const running = child;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("peer test startup timed out")), 8_000);
      running.once("error", error => { clearTimeout(timeout); reject(error); });
      running.once("exit", code => { clearTimeout(timeout); reject(new Error(`peer test exited: ${code}`)); });
      running.stdout!.on("data", chunk => { if (String(chunk).includes("CREMS Bridge active")) { clearTimeout(timeout); resolve(); } });
    });
    for (const prefix of ["/", "/api/hassio_ingress/test-session/"]) {
      for (const [method, path] of [["GET", ""], ["GET", "assets/app.js"], ["GET", "api/current"], ["GET", "api/stream"], ["PUT", "api/results/energy-profile"], ["DELETE", "api/results/battery-report"]]) {
        const response = await fetch(`http://127.0.0.1:${address.port}${prefix}${path}`, { method, headers: { "X-Forwarded-For": "172.30.32.2", "Origin": "https://untrusted.test" }, ...(method === "PUT" ? { body: "{}" } : {}) });
        assert.equal(response.status, 403, `${method} ${prefix}${path}`);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(response.headers.get("access-control-allow-origin"), null);
        assert.deepEqual(await response.json(), { error: "ingress_only" });
      }
    }
    assert.equal(existsSync(resolve(directory, "runtime/energy-profile.json")), false);
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise<void>(resolve => child!.once("exit", () => resolve()));
      child.kill(); await stopped;
    }
    await rm(directory, { recursive: true, force: true });
  }
});

test("meterpolling laat trage HA-opvragen niet overlappen en herstelt na een mislukte opvraag", { timeout: 20_000 }, async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "crems-meter-poll-"));
  let child: ReturnType<typeof spawn> | undefined;
  let active = 0, maximum = 0, calls = 0;
  const completions: number[] = [];
  const upstream = createServer((request, response) => {
    assert.equal(request.url, "/api/states");
    assert.equal(request.headers.authorization, "Bearer synthetic-local-test");
    const id = ++calls;
    active += 1; maximum = Math.max(maximum, active);
    setTimeout(() => {
      active -= 1; completions.push(id);
      if (id === 2) { response.writeHead(503).end(); return; }
      response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify([
        { entity_id: "sensor.import_power", state: String(id * 100), attributes: { unit_of_measurement: "W" } },
        { entity_id: "sensor.export_power", state: "0", attributes: { unit_of_measurement: "W" } },
      ]));
    }, id === 1 ? 2_500 : 50);
  });
  await new Promise<void>((resolve, reject) => { upstream.once("error", reject); upstream.listen(0, "127.0.0.1", resolve); });
  const upstreamAddress = upstream.address(); assert.ok(upstreamAddress && typeof upstreamAddress === "object");
  try {
    await cp(resolve(bridgeDirectory, "dist"), resolve(directory, "bridge"), { recursive: true });
    await mkdir(resolve(directory, "data"));
    await writeFile(resolve(directory, "package.json"), '{"type":"module"}');
    await writeFile(resolve(directory, "data/belpex-day-ahead-2021-09-01_2026-08-31.csv"), "start_utc,resolution_minutes,price_eur_mwh\n2026-01-01T00:00:00Z,15,10\n");
    const reservation = createServer();
    await new Promise<void>((resolve, reject) => { reservation.once("error", reject); reservation.listen(0, "127.0.0.1", resolve); });
    const address = reservation.address(); assert.ok(address && typeof address === "object");
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    child = spawn(process.execPath, [resolve(directory, "bridge/server.js")], {
      cwd: directory, windowsHide: true,
      env: { SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, CREMS_BRIDGE_HOST: "127.0.0.1", CREMS_BRIDGE_PORT: String(address.port), CREMS_DATA_DIR: resolve(directory, "runtime"), HASS_URL: `http://127.0.0.1:${upstreamAddress.port}`, HASS_TOKEN: "synthetic-local-test", HASS_IMPORT_POWER_ENTITY: "sensor.import_power", HASS_EXPORT_POWER_ENTITY: "sensor.export_power" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const running = child;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("meter test startup timed out")), 8_000);
      running.once("error", error => { clearTimeout(timeout); reject(error); });
      running.once("exit", code => { clearTimeout(timeout); reject(new Error(`meter test exited: ${code}`)); });
      running.stdout!.on("data", chunk => { if (String(chunk).includes("CREMS Bridge active")) { clearTimeout(timeout); resolve(); } });
    });
    const deadline = Date.now() + 6_200;
    const measured: number[] = [];
    let failedAfterMeasured = false, recovered = false;
    while (Date.now() < deadline) {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/current`);
      const reading = await response.json() as { quality: string; importPowerW: number };
      if (reading.quality === "measured") {
        if (failedAfterMeasured) recovered = true;
        if (measured.at(-1) !== reading.importPowerW) measured.push(reading.importPowerW);
      } else if (measured.length) failedAfterMeasured = true;
      await new Promise<void>((resolve) => setTimeout(resolve, 60));
    }
    assert.equal(maximum, 1, "there is at most one upstream meter request");
    assert.ok(calls >= 3, "polling continues after the failed second request");
    assert.deepEqual(completions, [...completions].sort((a, b) => a - b));
    assert.ok(measured.length >= 2);
    assert.deepEqual(measured, [...measured].sort((a, b) => a - b), "older responses never overwrite newer readings");
    assert.equal(failedAfterMeasured, true);
    assert.equal(recovered, true);
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise<void>(resolve => child!.once("exit", () => resolve())); child.kill(); await stopped;
    }
    upstream.closeAllConnections();
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});

test("houdt addonversies en ARM64-releaseworkflow synchroon", () => {
  const rootConfig = readFileSync(resolve(repositoryRoot, "crems/config.yaml"), "utf8");
  const addonConfig = readFileSync(resolve(repositoryRoot, "apps/home-assistant-addon/crems/config.yaml"), "utf8");
  const addonStart = readFileSync(resolve(repositoryRoot, "apps/home-assistant-addon/crems/run.mjs"), "utf8");
  const workflow = readFileSync(resolve(repositoryRoot, ".github/workflows/home-assistant-image.yml"), "utf8");
  const version = (config: string) => config.match(/^version: "([0-9]+\.[0-9]+\.[0-9]+)"$/m)?.[1];
  assert.equal(version(rootConfig), "0.1.15");
  assert.equal(version(addonConfig), version(rootConfig));
  assert.match(workflow, /platforms: linux\/arm64/);
  assert.match(workflow, /ghcr\.io\/xxrobinxx\/crems-energy:\$\{\{ steps\.version\.outputs\.value \}\}/);
  assert.match(workflow, /ghcr\.io\/xxrobinxx\/crems-energy:latest/);
  assert.match(workflow, /INPUT_VERSION/);
  assert.doesNotMatch(workflow, /crems-energy:0\.1\.[0-8]/);
  for (const config of [rootConfig, addonConfig]) {
    assert.match(config, /econtract_public_key: ""/);
    assert.match(config, /econtract_private_key: ""/);
    assert.match(config, /econtract_affiliate_id: ""/);
    assert.match(config, /econtract_public_key: password\?/);
    assert.match(config, /econtract_private_key: password\?/);
  }
  assert.match(addonStart, /econtract_public_key: "CREMS_ECONTRACT_PUBLIC_KEY"/);
  assert.match(addonStart, /econtract_private_key: "CREMS_ECONTRACT_PRIVATE_KEY"/);
  assert.match(addonStart, /econtract_affiliate_id: "CREMS_ECONTRACT_AFFILIATE_ID"/);
  assert.match(addonStart, /typeof value === "string" && value\.trim\(\)\) process\.env\[variable\] = value\.trim\(\)/);
});

test("gebouwde bridge stopt begrensd en veilig vóór startup bij een ongeldige poort", () => {
  assert.equal(existsSync(builtServerPath), true);
  const syntheticInvalidPort = "synthetic-invalid-port";
  const result = spawnSync(process.execPath, [builtServerPath], {
    cwd: bridgeDirectory,
    env: { CREMS_BRIDGE_PORT: syntheticInvalidPort },
    encoding: "utf8",
    timeout: 3_000,
    windowsHide: true,
  });
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.notEqual(result.status, 0);
  assert.match(output, /InvalidBridgePortError: Bridgepoort is ongeldig/);
  assert.equal(output.includes(syntheticInvalidPort), false);
  for (const forbidden of ["HASS_TOKEN", "HASS_URL", "HASS_IMPORT_POWER_ENTITY", "process.env"]) {
    assert.equal(output.includes(forbidden), false);
  }
});
