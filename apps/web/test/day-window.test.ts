import assert from "node:assert/strict";
import test from "node:test";

import { fullBrusselsDayWindow, selectBrusselsDayWindow } from "../src/day-window.ts";

test("maakt op een normale dag een lokaal kalenderdagvenster van 24 uur", () => {
  const result = selectBrusselsDayWindow("yesterday", new Date("2026-02-12T12:00:00Z"));
  assert.deepEqual(result, {
    selection: "yesterday",
    label: "Gisteren",
    dateLabel: "11 februari 2026",
    state: "ready",
    window: { start: "2026-02-10T23:00:00.000Z", end: "2026-02-11T23:00:00.000Z" },
  });
});

test("zomertijdstart maakt de lokale vorige kalenderdag exact 23 uur", () => {
  const result = selectBrusselsDayWindow("yesterday", new Date("2026-03-30T10:00:00Z"));
  assert.deepEqual(result.window, {
    start: "2026-03-28T23:00:00.000Z",
    end: "2026-03-29T22:00:00.000Z",
  });
  assert.equal(Date.parse(result.window!.end) - Date.parse(result.window!.start), 23 * 60 * 60 * 1_000);
});

test("wintertijdstart maakt de lokale vorige kalenderdag exact 25 uur", () => {
  const result = selectBrusselsDayWindow("yesterday", new Date("2026-10-26T11:00:00Z"));
  assert.deepEqual(result.window, {
    start: "2026-10-24T22:00:00.000Z",
    end: "2026-10-25T23:00:00.000Z",
  });
  assert.equal(Date.parse(result.window!.end) - Date.parse(result.window!.start), 25 * 60 * 60 * 1_000);
});

test("bepaalt rond UTC-middernacht de kalenderdatum in Europe Brussels", () => {
  const result = selectBrusselsDayWindow("today", new Date("2026-08-27T22:05:00Z"));
  assert.equal(result.dateLabel, "28 augustus 2026");
  assert.equal(result.window?.start, "2026-08-27T22:00:00.000Z");
});

test("vandaag eindigt exact op de geïnjecteerde now", () => {
  const now = new Date("2026-08-28T13:47:12.345Z");
  const result = selectBrusselsDayWindow("today", now);
  assert.equal(result.label, "Vandaag");
  assert.equal(result.window?.end, now.toISOString());
});

test("de grafiek voor vandaag houdt altijd het volledige Brusselse kalenderdagvenster", () => {
  const display = fullBrusselsDayWindow("today", new Date("2026-08-28T13:47:12.345Z"));
  assert.deepEqual(display, { start: "2026-08-27T22:00:00.000Z", end: "2026-08-28T22:00:00.000Z" });
});

test("exact lokale middernacht is empty en maakt geen fetchvenster", () => {
  assert.deepEqual(selectBrusselsDayWindow("today", new Date("2026-08-28T22:00:00.000Z")), {
    selection: "today",
    label: "Vandaag",
    dateLabel: "29 augustus 2026",
    state: "empty",
    window: null,
  });
});

test("vandaag start correct op de zomertijd-overgangsdag", () => {
  const now = new Date("2026-03-29T10:00:00.000Z");
  assert.deepEqual(selectBrusselsDayWindow("today", now).window, {
    start: "2026-03-28T23:00:00.000Z",
    end: now.toISOString(),
  });
});

test("vandaag start correct op de wintertijd-overgangsdag", () => {
  const now = new Date("2026-10-25T10:00:00.000Z");
  assert.deepEqual(selectBrusselsDayWindow("today", now).window, {
    start: "2026-10-24T22:00:00.000Z",
    end: now.toISOString(),
  });
});

test("morgen is een future state zonder fetchvenster", () => {
  assert.deepEqual(selectBrusselsDayWindow("tomorrow", new Date("2026-08-28T13:00:00Z")), {
    selection: "tomorrow",
    label: "Morgen",
    dateLabel: "29 augustus 2026",
    state: "future",
    window: null,
  });
});
