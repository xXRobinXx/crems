import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mobiele KPI-kaarten gebruiken twee kolommen en smal scherm valt terug naar één", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /@media\(max-width:520px\)\{\.metrics\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(css, /@media\(max-width:359px\)\{\.metrics\{grid-template-columns:1fr\}\}/);
  assert.match(css, /\.metrics article\{min-width:0;padding:12px\}/);
});

test("bridge status blijft zichtbaar en nav behoudt minimaal 44px touch targets", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.status\{display:block;flex:1 1 100%;font-size:13px;overflow-wrap:anywhere\}/);
  assert.match(css, /nav>button,nav \.nav-step button\{min-height:44px\}/);
});