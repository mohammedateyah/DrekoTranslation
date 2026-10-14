const path = require("node:path");

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const CSV_TEXT_COLUMNS = new Set(["text", "value", "source", "english", "en"]);
const CSV_KEY_COLUMNS = new Set(["key", "id", "name", "identifier"]);

function tokenizeCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        field += character;
      }
    } else if (closedQuote && character !== "," && character !== "\n" && character !== "\r") {
      throw new Error("MALFORMED_CSV");
    } else if (character === '"') {
      if (field.length !== 0 || closedQuote) throw new Error("MALFORMED_CSV");
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
      closedQuote = false;
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      closedQuote = false;
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("MALFORMED_CSV");
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function escapeCsvField(value) {
  const field = String(value);
  return /[",\r\n]/u.test(field) ? `"${field.replace(/"/gu, '""')}"` : field;
}

function parseJsonString(source, start) {
  if (source[start] !== '"') throw new Error("INVALID_JSON");
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
    } else if (source[index] === '"') {
      try {
        return { value: JSON.parse(source.slice(start, index + 1)), end: index + 1 };
      } catch {
        throw new Error("INVALID_JSON");
      }
    }
  }
  throw new Error("INVALID_JSON");
}

function parseJson(source) {
  const normalized = source.replace(/^\uFEFF/u, "");
  let document;
  try {
    document = JSON.parse(normalized);
  } catch {
    throw new Error("INVALID_JSON");
  }
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new Error("UNSUPPORTED_JSON_SCHEMA");
  }
  const entries = Object.entries(document);
  if (!entries.length || entries.some(([, value]) => typeof value !== "string")) {
    throw new Error("UNSUPPORTED_JSON_SCHEMA");
  }

  let index = 0;
  const skipWhitespace = () => {
    while (/\s/u.test(normalized[index] || "")) index += 1;
  };
  skipWhitespace();
  if (normalized[index] !== "{") throw new Error("UNSUPPORTED_JSON_SCHEMA");
  index += 1;
  skipWhitespace();
  const identifiers = new Set();
  while (normalized[index] !== "}") {
    const parsedKey = parseJsonString(normalized, index);
    if (identifiers.has(parsedKey.value)) throw new Error("DUPLICATE_LOCALIZATION_KEY");
    identifiers.add(parsedKey.value);
    index = parsedKey.end;
    skipWhitespace();
    if (normalized[index] !== ":") throw new Error("INVALID_JSON");
    index += 1;
    skipWhitespace();
    const parsedValue = parseJsonString(normalized, index);
    index = parsedValue.end;
    skipWhitespace();
    if (normalized[index] === ",") {
      index += 1;
      skipWhitespace();
      continue;
    }
    if (normalized[index] !== "}") throw new Error("INVALID_JSON");
  }
  index += 1;
  skipWhitespace();
  if (index !== normalized.length) throw new Error("INVALID_JSON");

  return { document, entries: entries.map(([id, text]) => ({ id, text })) };
}

function parseCsv(source) {
  const rows = tokenizeCsv(source);
  if (rows.length < 2) throw new Error("UNSUPPORTED_CSV_SCHEMA");
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error("AMBIGUOUS_CSV_HEADER");
  const keyIndex = headers.findIndex((header) => CSV_KEY_COLUMNS.has(header));
  const textIndex = headers.findIndex((header) => CSV_TEXT_COLUMNS.has(header));
  if (keyIndex < 0 || textIndex < 0 || keyIndex === textIndex) {
    throw new Error("UNSUPPORTED_CSV_SCHEMA");
  }
  const entries = [];
  const identifiers = new Set();
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.length !== headers.length) throw new Error("MALFORMED_CSV");
    const text = row[textIndex];
    if (text.length) {
      const id = row[keyIndex];
      if (!id || identifiers.has(id)) throw new Error("DUPLICATE_OR_EMPTY_LOCALIZATION_KEY");
      identifiers.add(id);
      entries.push({ id, text });
    }
  }
  if (!entries.length) throw new Error("NO_TRANSLATABLE_ENTRIES");
  return { rows, keyIndex, textIndex, entries };
}

function parseLocalizationFile(filePath, contents) {
  if (typeof filePath !== "string" || !Buffer.isBuffer(contents) ||
      contents.length === 0 || contents.length > MAX_SOURCE_BYTES) {
    throw new Error("SOURCE_SIZE_LIMIT");
  }
  const extension = path.extname(filePath).toLowerCase();
  const hasBom = contents.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]));
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(contents);
  } catch {
    throw new Error("INVALID_TEXT_ENCODING");
  }
  const base = {
    fileName: path.basename(filePath),
    extension,
    hasBom,
    newline: source.includes("\r\n") ? "\r\n" : "\n",
    trailingNewline: /\r?\n$/u.test(source)
  };
  if (extension === ".json") {
    const parsed = parseJson(source);
    const indentMatch = /\n([ \t]+)"/u.exec(source);
    return { ...base, format: "json", indent: indentMatch ? indentMatch[1] : "  ", ...parsed };
  }
  if (extension === ".csv") {
    const parsed = parseCsv(source.replace(/^\uFEFF/u, ""));
    return { ...base, format: "csv", ...parsed };
  }
  throw new Error("UNSUPPORTED_FILE_FORMAT");
}

function buildLocalizationFile(adapter, translations) {
  if (!adapter || !Array.isArray(adapter.entries) ||
      !translations || typeof translations !== "object") {
    throw new Error("INVALID_LOCALIZATION_DATA");
  }
  for (const entry of adapter.entries) {
    if (typeof translations[entry.id] !== "string") {
      throw new Error("MISSING_TRANSLATION");
    }
  }

  let output;
  if (adapter.format === "json") {
    const document = { ...adapter.document };
    for (const entry of adapter.entries) document[entry.id] = translations[entry.id];
    output = JSON.stringify(document, null, adapter.indent).replace(/\n/gu, adapter.newline);
  } else if (adapter.format === "csv") {
    const rows = adapter.rows.map((row) => [...row]);
    const textIndex = adapter.textIndex;
    const rowIndexes = new Map();
    for (let index = 1; index < rows.length; index += 1) {
      rowIndexes.set(rows[index][adapter.keyIndex], index);
    }
    for (const entry of adapter.entries) {
      const index = rowIndexes.get(entry.id);
      if (index === undefined || rows[index][textIndex] !== entry.text) {
        throw new Error("LOCALIZATION_SOURCE_CHANGED");
      }
      rows[index][textIndex] = translations[entry.id];
    }
    output = rows.map((row) => row.map(escapeCsvField).join(",")).join(adapter.newline);
  } else {
    throw new Error("UNSUPPORTED_FILE_FORMAT");
  }
  if (adapter.trailingNewline) output += adapter.newline;
  return Buffer.from(`${adapter.hasBom ? "\uFEFF" : ""}${output}`, "utf8");
}

module.exports = {
  MAX_SOURCE_BYTES,
  buildLocalizationFile,
  parseLocalizationFile,
  tokenizeCsv
};
