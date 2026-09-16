import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const bridgeDirectory = fileURLToPath(new URL("..", import.meta.url));
const bridgeManifestPath = fileURLToPath(new URL("../package.json", import.meta.url));
const rootManifestPath = fileURLToPath(new URL("../../../package.json", import.meta.url));
const builtServerPath = fileURLToPath(new URL("../dist/server.js", import.meta.url));

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
