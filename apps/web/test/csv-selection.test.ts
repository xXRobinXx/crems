import assert from "node:assert/strict";
import test from "node:test";

import {
  createCsvSelectionController,
  MAX_LOCAL_CSV_BYTES,
  type CsvSelectionState,
  type LocalCsvFile,
} from "../src/csv-selection.ts";
import { createFluviusPreviewAnalyzer } from "@crems/core/fluvius-stream-preview";
import { mapCsvPreview } from "../src/csv-preview.ts";
import { FLUVIUS_HEADERS } from "@crems/core/fluvius-quarter-hour";

const validCsv = `${FLUVIUS_HEADERS.join(";")}\n01-08-2026;00:00;01-08-2026;00:15;;;synthetisch;Afname Dag;0,125;kWh;Uitgelezen;`;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const fileWithText = (_name: string, size: number, text: () => Promise<string>): LocalCsvFile => ({ size, text });
const createController = (publish: (state: CsvSelectionState) => void) =>
  createCsvSelectionController(publish, { createAnalyzer: createFluviusPreviewAnalyzer, map: mapCsvPreview, yieldControl:async()=>undefined });

test("leest exact 20 MiB maar weigert één byte meer vóór text", async () => {
  let allowedTextCalls = 0;
  let oversizedTextCalls = 0;
  const states: CsvSelectionState[] = [];
  const controller = createController((state) => states.push(state));

  await controller.select(fileWithText("grens.csv", MAX_LOCAL_CSV_BYTES, async () => {
    allowedTextCalls += 1;
    return validCsv;
  }));
  assert.equal(allowedTextCalls, 1);
  assert.equal(states.at(-1)?.preview?.status, "success");

  await controller.select(fileWithText("te-groot.csv", MAX_LOCAL_CSV_BYTES + 1, async () => {
    oversizedTextCalls += 1;
    return "mag,niet\ngelezen,worden";
  }));
  assert.equal(oversizedTextCalls, 0);
  assert.deepEqual(states.at(-1), {
    preview: {
      status: "error",
      code: "FILE_TOO_LARGE",
      message: "Dit bestand is groter dan 20 MiB en kan niet lokaal worden gecontroleerd.",
    },progress:null,
  });
});

test("wist de vorige preview onmiddellijk tijdens een nieuwe pending selectie", async () => {
  const pending = deferred<string>();
  const states: CsvSelectionState[] = [];
  const controller = createController((state) => states.push(state));

  await controller.select(fileWithText("vorig.csv", 100, async () => validCsv));
  assert.equal(states.at(-1)?.preview?.status, "success");
  const selection = controller.select(fileWithText("nieuw.csv", 100, () => pending.promise));
  assert.equal(states.at(-1)?.preview,null);assert.equal(states.at(-1)?.progress?.phase,"reading");
  pending.resolve(validCsv);
  await selection;
});

test("een oud succes overschrijft een nieuwer succes niet", async () => {
  const oldRead = deferred<string>();
  const newRead = deferred<string>();
  const states: CsvSelectionState[] = [];
  const controller = createController((state) => states.push(state));

  const oldSelection = controller.select(fileWithText("oud.csv", 100, () => oldRead.promise));
  const newSelection = controller.select(fileWithText("nieuw.csv", 100, () => newRead.promise));
  newRead.resolve(validCsv);
  await newSelection;
  const stateAfterNewSuccess = states.at(-1);
  oldRead.resolve(validCsv);
  await oldSelection;

  assert.deepEqual(states.at(-1), stateAfterNewSuccess);
});

test("een oude fout overschrijft een nieuwer succes niet", async () => {
  const oldRead = deferred<string>();
  const newRead = deferred<string>();
  const states: CsvSelectionState[] = [];
  const controller = createController((state) => states.push(state));

  const oldSelection = controller.select(fileWithText("oud.csv", 100, () => oldRead.promise));
  const newSelection = controller.select(fileWithText("nieuw.csv", 100, () => newRead.promise));
  newRead.resolve(validCsv);
  await newSelection;
  const stateAfterNewSuccess = states.at(-1);
  oldRead.reject(new Error("oude interne leesfout"));
  await oldSelection;

  assert.deepEqual(states.at(-1), stateAfterNewSuccess);
});

test("een lege selectie wist alles en maakt een pending read ongeldig", async () => {
  const pending = deferred<string>();
  const states: CsvSelectionState[] = [];
  const controller = createController((state) => states.push(state));

  const oldSelection = controller.select(fileWithText("pending.csv", 100, () => pending.promise));
  await controller.select(undefined);
  assert.deepEqual(states.at(-1), { preview: null,progress:null });
  pending.resolve("Oud,Kop\noude,data");
  await oldSelection;

  assert.deepEqual(states.at(-1), { preview: null,progress:null });
});

test("dispose wist preview en voorkomt dat een pending selectie terugkeert",async()=>{const pending=deferred<string>();const states:CsvSelectionState[]=[];const controller=createController(state=>states.push(state));const selection=controller.select(fileWithText("verborgen.csv",100,()=>pending.promise));controller.dispose();assert.deepEqual(states.at(-1),{preview:null,progress:null});pending.resolve(validCsv);await selection;assert.deepEqual(states.at(-1),{preview:null,progress:null});});
test("stream decodeert chunks, yieldt vóór en tijdens finalizing",async()=>{const bytes=new TextEncoder().encode(validCsv);const chunks=[bytes.slice(0,17),bytes.slice(17,61),bytes.slice(61)];let yields=0;const states:CsvSelectionState[]=[];const controller=createCsvSelectionController(state=>states.push(state),{createAnalyzer:createFluviusPreviewAnalyzer,map:mapCsvPreview,yieldControl:async()=>{yields+=1;}});await controller.select({size:bytes.length,stream:()=>new ReadableStream({start(target){for(const chunk of chunks)target.enqueue(chunk);target.close();}})});assert.equal(yields,chunks.length+1);assert.ok(states.some(state=>state.progress?.phase==="finalizing"));assert.equal(states.at(-1)?.preview?.status,"success");assert.equal(states.filter(state=>state.progress?.phase==="reading").at(-1)?.progress?.bytesRead,bytes.length);});
