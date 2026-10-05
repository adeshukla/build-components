// Translation review (D94): one spreadsheet per language for a native speaker to check, and back again.
//
//   node scripts/translation-sheets.mjs export   writes docs/translations-review/<language>.csv
//   node scripts/translation-sheets.mjs import   copies every filled-in "Corrected" cell into lib/dictionary.ts
//
// The sheets open in Excel, Numbers or Google Sheets (UTF-8 with a byte-order mark, so Arabic, Hindi and
// Chinese show as they should). A reviewer only fills in Corrected (and Comment if they like).
import fs from "node:fs";
import path from "node:path";

const dictionaryFile = "lib/dictionary.ts";
const folder = "docs/translations-review";
const names = { es: "Spanish", fr: "French", de: "German", pt: "Portuguese", ar: "Arabic", he: "Hebrew", hi: "Hindi", ja: "Japanese", zh: "Chinese" };
const header = ["English", "Translation now", "Where it is used", "Note", "Corrected", "Comment"];

/** The dictionary's lines: `  "English": {"es": "…", …},` (as scratchpad/add_tr.py writes them). */
function readDictionary() {
  const lines = fs.readFileSync(dictionaryFile, "utf8").split("\n");
  const entries = new Map();
  for (const line of lines) {
    const match = /^ {2}("(?:[^"\\]|\\.)*"): (\{.*\}),\r?$/.exec(line);
    if (match) entries.set(JSON.parse(match[1]), JSON.parse(match[2]));
  }
  return { lines, entries };
}

/** Which parts say each English phrase: every Words default in the schemas. */
function usage() {
  const used = new Map();
  for (const slug of fs.readdirSync("registry")) {
    const lines = fs.readFileSync(path.join("registry", slug, "schema.ts"), "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!line.includes('group: "Words"')) return;
      for (const candidate of lines.slice(i, i + 6)) {
        const match = /default: ("(?:[^"\\]|\\.)*")/.exec(candidate);
        if (!match) continue;
        const english = JSON.parse(match[1]);
        used.set(english, [...(used.get(english) ?? []), slug]);
        break;
      }
    });
  }
  return used;
}

const cell = (text) => (/[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

/** A small CSV reader: quoted fields, doubled quotes and new lines inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") row.push(field), (field = "");
    else if (char === "\n") row.push(field.replace(/\r$/, "")), rows.push(row), (row = []), (field = "");
    else field += char;
  }
  if (field || row.length) row.push(field), rows.push(row);
  return rows;
}

const mode = process.argv[2];
const { lines, entries } = readDictionary();

if (mode === "export") {
  const used = usage();
  fs.mkdirSync(folder, { recursive: true });
  for (const [code, name] of Object.entries(names)) {
    const rows = [...entries].map(([english, translated]) => {
      const blanks = english.match(/\{\w+\}/g);
      const note = blanks ? `Keep ${[...new Set(blanks)].join(" ")} exactly as written: it is filled in on the page.` : "";
      return [english, translated[code], [...new Set(used.get(english) ?? [])].join(", "), note, "", ""];
    });
    const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\n");
    fs.writeFileSync(path.join(folder, `${name.toLowerCase()}.csv`), `﻿${csv}\n`);
  }
  console.log(`${entries.size} phrases in ${Object.keys(names).length} sheets, in ${folder}/`);
} else if (mode === "import") {
  let changed = 0;
  const problems = [];
  for (const [code, name] of Object.entries(names)) {
    const file = path.join(folder, `${name.toLowerCase()}.csv`);
    if (!fs.existsSync(file)) continue;
    const [, ...rows] = parseCsv(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
    for (const [english, , , , corrected] of rows) {
      if (!english || !corrected?.trim()) continue;
      const entry = entries.get(english);
      if (!entry) {
        problems.push(`${name}: no longer in the dictionary: ${english}`);
        continue;
      }
      // A correction that drops or renames a blank would break the part on the page.
      const blanks = (text) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort().join(" ");
      if (blanks(corrected) !== blanks(english)) {
        problems.push(`${name}: "${corrected}" must keep ${blanks(english) || "no blanks"}`);
        continue;
      }
      if (entry[code] !== corrected.trim()) (entry[code] = corrected.trim()), changed++;
    }
  }
  const out = lines.map((line) => {
    const match = /^ {2}("(?:[^"\\]|\\.)*"): (\{.*\}),(\r?)$/.exec(line);
    if (!match) return line;
    // Written as scratchpad/add_tr.py writes it: {"es": "…", "fr": "…"}.
    const entry = Object.entries(entries.get(JSON.parse(match[1]))).map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`);
    return `  ${match[1]}: {${entry.join(", ")}},${match[3]}`;
  });
  fs.writeFileSync(dictionaryFile, out.join("\n"));
  console.log(`${changed} translations corrected.${problems.length ? `\nNot taken:\n  ${problems.join("\n  ")}` : ""}`);
} else {
  console.log("node scripts/translation-sheets.mjs export | import");
}
