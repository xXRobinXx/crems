export type CsvDelimiter = "," | ";";

export type CsvParseErrorCode =
  | "EMPTY_INPUT"
  | "EMPTY_HEADER"
  | "DUPLICATE_HEADER"
  | "TOO_FEW_FIELDS"
  | "TOO_MANY_FIELDS"
  | "UNCLOSED_QUOTE";

export class CsvParseError extends Error {
  readonly name = "CsvParseError";
  readonly code: CsvParseErrorCode;

  constructor(code: CsvParseErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type ParsedCsv = {
  delimiter: CsvDelimiter;
  headers: string[];
  rows: string[][];
};

const detectDelimiter = (text: string): CsvDelimiter => {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') index += 1;
      else inQuotes = !inQuotes;
    } else if (!inQuotes && (character === "\r" || character === "\n")) {
      break;
    } else if (!inQuotes && character === ",") {
      commas += 1;
    } else if (!inQuotes && character === ";") {
      semicolons += 1;
    }
  }

  return semicolons > commas ? ";" : ",";
};

const parseRows = (text: string, delimiter: CsvDelimiter): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const finishField = () => {
    row.push(field);
    field = "";
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (inQuotes) {
        inQuotes = false;
      } else if (field === "") {
        inQuotes = true;
      } else {
        field += character;
      }
    } else if (!inQuotes && character === delimiter) {
      finishField();
    } else if (!inQuotes && (character === "\r" || character === "\n")) {
      finishRow();
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new CsvParseError("UNCLOSED_QUOTE", "CSV bevat een niet-afgesloten quote");
  finishRow();
  while (rows.length > 1 && rows.at(-1)?.length === 1 && rows.at(-1)?.[0] === "") rows.pop();
  return rows;
};

export const parseCsv = (input: string): ParsedCsv => {
  const text = input.startsWith("\uFEFF") ? input.slice(1) : input;
  if (text.trim() === "") throw new CsvParseError("EMPTY_INPUT", "CSV-invoer is leeg");

  const delimiter = detectDelimiter(text);
  const [headerRow = [], ...rows] = parseRows(text, delimiter);
  const headers = headerRow.map((header) => header.trim());
  if (headers.some((header) => header === "")) {
    throw new CsvParseError("EMPTY_HEADER", "CSV bevat een lege headernaam");
  }
  if (new Set(headers).size !== headers.length) {
    throw new CsvParseError("DUPLICATE_HEADER", "CSV bevat een dubbele headernaam");
  }

  rows.forEach((row, index) => {
    if (row.length < headers.length) {
      throw new CsvParseError("TOO_FEW_FIELDS", `CSV-rij ${index + 2} bevat te weinig velden`);
    }
    if (row.length > headers.length) {
      throw new CsvParseError("TOO_MANY_FIELDS", `CSV-rij ${index + 2} bevat te veel velden`);
    }
  });

  return { delimiter, headers, rows };
};
