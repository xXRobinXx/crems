import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidBridgePortError,
  parseBridgeListenConfig,
} from "../src/listen-config.js";

test("gebruikt voor ontbrekende en lege waarden exact de veilige default", () => {
  for (const rawPort of [undefined, "", "   \t\r\n"]) {
    assert.deepEqual(parseBridgeListenConfig(rawPort), {
      host: "127.0.0.1",
      port: 8787,
    });
  }
});

test("accepteert uitsluitend getrimde decimale integers binnen het volledige poortbereik", () => {
  assert.deepEqual(parseBridgeListenConfig("1"), {
    host: "127.0.0.1",
    port: 1,
  });
  assert.deepEqual(parseBridgeListenConfig("  12345  "), {
    host: "127.0.0.1",
    port: 12_345,
  });
  assert.deepEqual(parseBridgeListenConfig("65535"), {
    host: "127.0.0.1",
    port: 65_535,
  });
});

test("luistert alleen expliciet op alle interfaces voor een container", () => {
  assert.deepEqual(parseBridgeListenConfig("8099", "0.0.0.0"), { host: "0.0.0.0", port: 8099 });
  assert.deepEqual(parseBridgeListenConfig("8099", "example.com"), { host: "127.0.0.1", port: 8099 });
});

test("weigert alle ongeldige expliciete waarden met één vaste veilige foutcode", () => {
  const invalidValues = [
    "0",
    "-1",
    "65536",
    "1.5",
    "1e3",
    "+1",
    "port1",
    "1port",
    "NaN",
    "Infinity",
    "-Infinity",
  ];

  for (const rawPort of invalidValues) {
    assert.throws(
      () => parseBridgeListenConfig(rawPort),
      (error: unknown) => {
        assert.ok(error instanceof InvalidBridgePortError);
        assert.equal(error.code, "INVALID_BRIDGE_PORT");
        assert.equal(error.message, "Bridgepoort is ongeldig");
        assert.equal(error.message.includes(rawPort), false);
        return true;
      },
    );
  }
});
