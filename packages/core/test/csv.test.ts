import assert from "node:assert/strict";
import test from "node:test";

import { CsvParseError, parseCsv, type CsvParseErrorCode } from "../src/csv.ts";

const assertParseError = (input: string, code: CsvParseErrorCode) => {
  assert.throws(() => parseCsv(input), (error: unknown) => {
    assert.ok(error instanceof CsvParseError);
    assert.equal(error.code, code);
    return true;
  });
};

test("normaliseert BOM puntkomma CRLF en komma LF naar dezelfde structuur", () => {
  const semicolon = parseCsv("\uFEFF Naam ; Waarde \r\nalpha;001\r\nbeta;002\r\n");
  const comma = parseCsv(" Naam , Waarde \nalpha,001\nbeta,002\n");

  assert.equal(semicolon.delimiter, ";");
  assert.equal(comma.delimiter, ",");
  assert.deepEqual(semicolon.headers, ["Naam", "Waarde"]);
  assert.deepEqual(comma.headers, semicolon.headers);
  assert.deepEqual(comma.rows, semicolon.rows);
});

test("behoudt een delimiter in quotes en decodeert een escaped dubbele quote", () => {
  const parsed = parseCsv('label,note\n"alpha,beta","Hij zei ""hoi"""');

  assert.deepEqual(parsed.rows, [["alpha,beta", 'Hij zei "hoi"']]);
});

test("trimt alleen headers en converteert of trimt veldwaarden niet", () => {
  const parsed = parseCsv(' Code , Omschrijving \n" 001 ",  tekst  ');

  assert.deepEqual(parsed.headers, ["Code", "Omschrijving"]);
  assert.deepEqual(parsed.rows, [[" 001 ", "  tekst  "]]);
});

test("rapporteert lege en whitespace-invoer met EMPTY_INPUT", () => {
  assertParseError("", "EMPTY_INPUT");
  assertParseError(" \r\n\t", "EMPTY_INPUT");
});

test("rapporteert een lege headernaam met EMPTY_HEADER", () => {
  assertParseError("naam,  \nalpha,001", "EMPTY_HEADER");
});

test("rapporteert een dubbele getrimde headernaam met DUPLICATE_HEADER", () => {
  assertParseError("naam, naam \nalpha,001", "DUPLICATE_HEADER");
});

test("onderscheidt dataregels met te weinig en te veel velden", () => {
  assertParseError("a,b\nwaarde", "TOO_FEW_FIELDS");
  assertParseError("a,b\nwaarde,extra,teveel", "TOO_MANY_FIELDS");
});

test("negeert trailing lege regels maar behoudt een lege waarde in een echte rij", () => {
  const parsed = parseCsv("a,b\nwaarde,\n\n");

  assert.deepEqual(parsed.rows, [["waarde", ""]]);
});
