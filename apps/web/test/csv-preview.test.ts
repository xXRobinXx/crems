import assert from "node:assert/strict";
import test from "node:test";

import { CsvParseError } from "@crems/core/csv";
import { mapCsvPreview } from "../src/csv-preview.ts";
import { FLUVIUS_HEADERS } from "@crems/core/fluvius-quarter-hour";

test("maakt uitsluitend veilige structuurmetadata voor een geslaagde preview", () => {
  const preview = mapCsvPreview({
    ok: true,
    parsed: {
      delimiter: ";",
      headers: [...FLUVIUS_HEADERS],
      rows: [["01-08-2026","00:00","01-08-2026","00:15","verborgen","verborgen","synthetisch","Afname Dag","0,125","kWh","Uitgelezen","verborgen"]],
    },
  });
  assert.equal(preview.status,"success");
  if(preview.status!=="success")return;
  assert.equal(preview.validCount,1);assert.equal(preview.importKwh,.125);assert.equal("fileName" in preview,false);assert.equal(JSON.stringify(preview).includes("verborgen"),false);
});

test("maakt een veilige bekende parsefout met stabiele code", () => {
  const preview = mapCsvPreview({
    ok: false,
    error: new CsvParseError("EMPTY_HEADER", "interne parsermelding"),
  });
  assert.deepEqual(preview, {
    status: "error",
    code: "EMPTY_HEADER",
    message: "Minstens één kolom heeft geen naam.",
  });
});

test("verbergt details van een onbekende lokale leesfout", () => {
  const preview = mapCsvPreview({
    ok: false,
    error: new Error("interne stack of bestandsinhoud"),
  });
  assert.deepEqual(preview, {
    status: "error",
    code: "LOCAL_READ_ERROR",
    message: "We konden dit bestand lokaal niet lezen. Probeer het opnieuw.",
  });
});
test("mapt stream-parsercodes via dezelfde veilige allowlist",()=>{assert.deepEqual(mapCsvPreview({ok:false,error:{code:"UNCLOSED_QUOTE",secret:"verborgen"}}),{status:"error",code:"UNCLOSED_QUOTE",message:"Een tekstveld heeft geen afsluitend aanhalingsteken."});});
