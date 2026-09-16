import assert from "node:assert/strict";
import test from "node:test";
import { HomeAssistantSource } from "../src/meter-source.js";

const token = "fake-history-token";

const createSource = () => new HomeAssistantSource("http://home-assistant.test/", token);

const withFetchStub = async (stub: typeof fetch, run: () => Promise<void>) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
};

test("history requests one encoded entity and time window and returns the first series", async () => {
  const start = "2026-01-02T03:04:05+01:00";
  const end = "2026-01-02T04:04:05+01:00";
  const entityId = "sensor.synthetic_power_1";
  const state1 = { state: "100", last_changed: start };
  const state2 = { state: "200", last_changed: end };
  let callCount = 0;

  await withFetchStub(
    (async (input, init) => {
      callCount += 1;
      const url = new URL(String(input));
      assert.equal(init?.method, "GET");
      assert.deepEqual(init?.headers, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      assert.equal(decodeURIComponent(url.pathname), `/api/history/period/${start}`);
      assert.equal(url.searchParams.get("end_time"), end);
      assert.deepEqual(url.searchParams.getAll("filter_entity_id"), [entityId]);
      assert.equal(url.searchParams.get("minimal_response"), "");
      assert.equal(url.searchParams.get("no_attributes"), "");
      assert.equal([...url.searchParams].length, 4);
      return new Response(JSON.stringify([[state1, state2]]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch,
    async () => {
      assert.deepEqual(await createSource().history(entityId, start, end), [state1, state2]);
    },
  );
  assert.equal(callCount, 1);
});

test("history treats both valid empty response shapes as an empty series", async () => {
  for (const payload of [[], [[]]]) {
    await withFetchStub(
      (async () => new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch,
      async () => {
        assert.deepEqual(await createSource().history(
          "sensor.synthetic_power",
          "2026-01-02T03:00:00Z",
          "2026-01-02T04:00:00Z",
        ), []);
      },
    );
  }
});

test("history reports 401 and 500 without exposing the token", async () => {
  for (const status of [401, 500]) {
    await withFetchStub(
      (async () => new Response("synthetic failure", { status })) as typeof fetch,
      async () => {
        await assert.rejects(
          createSource().history("sensor.synthetic_power", "2026-01-02T03:00:00Z", "2026-01-02T04:00:00Z"),
          (error: Error) => {
            assert.equal(error.message, `Home Assistant API antwoordde met ${status}`);
            assert.equal(error.message.includes(token), false);
            return true;
          },
        );
      },
    );
  }
});

test("history preserves fetch rejection semantics without exposing the token", async () => {
  const rejection = new Error("synthetic fetch rejection");
  await withFetchStub(
    (async () => { throw rejection; }) as typeof fetch,
    async () => {
      await assert.rejects(
        createSource().history("sensor.synthetic_power", "2026-01-02T03:00:00Z", "2026-01-02T04:00:00Z"),
        (error: Error) => {
          assert.equal(error, rejection);
          assert.equal(error.message.includes(token), false);
          return true;
        },
      );
    },
  );
});
