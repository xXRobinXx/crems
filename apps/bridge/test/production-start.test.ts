import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import test from "node:test";

const bridgeDirectory = fileURLToPath(new URL("..", import.meta.url));
const bridgeManifestPath = fileURLToPath(new URL("../package.json", import.meta.url));
const rootManifestPath = fileURLToPath(new URL("../../../package.json", import.meta.url));
const builtServerPath = fileURLToPath(new URL("../dist/server.js", import.meta.url));
const repositoryRoot = resolve(bridgeDirectory, "../..");

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

test("produceert relatief gekoppelde assets zodat Home Assistant Ingress de geneste URL behoudt", () => {
  const html = readFileSync(resolve(repositoryRoot, "apps/web/dist/index.html"), "utf8");
  assert.match(html, /src="assets\/app\.js"/);
  assert.match(html, /href="assets\/app\.css"/);
  assert.doesNotMatch(html, /(?:src|href)="\/assets\//);
});

test("houdt addonversies en ARM64-releaseworkflow synchroon", () => {
  const rootConfig = readFileSync(resolve(repositoryRoot, "crems/config.yaml"), "utf8");
  const addonConfig = readFileSync(resolve(repositoryRoot, "apps/home-assistant-addon/crems/config.yaml"), "utf8");
  const workflow = readFileSync(resolve(repositoryRoot, ".github/workflows/home-assistant-image.yml"), "utf8");
  const version = (config: string) => config.match(/^version: "([0-9]+\.[0-9]+\.[0-9]+)"$/m)?.[1];
  assert.equal(version(rootConfig), "0.1.10");
  assert.equal(version(addonConfig), version(rootConfig));
  assert.match(workflow, /platforms: linux\/arm64/);
  assert.match(workflow, /ghcr\.io\/xxrobinxx\/crems-energy:\$\{\{ steps\.version\.outputs\.value \}\}/);
  assert.match(workflow, /ghcr\.io\/xxrobinxx\/crems-energy:latest/);
  assert.match(workflow, /INPUT_VERSION/);
  assert.doesNotMatch(workflow, /crems-energy:0\.1\.[0-8]/);
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
