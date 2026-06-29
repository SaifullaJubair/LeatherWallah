// parsePastedTable — turns a block of pasted text (from ChatGPT, Excel, Google
// Sheets, or a markdown table) into [{ label, value }] rows so the admin doesn't
// have to type label/value pairs one cell at a time.
//
// Separator auto-detect, per line, in this priority:
//   Tab → " | " (markdown/pipe) → " : " (colon) → 2+ spaces → comma
// We split each line into AT MOST two parts (label + the rest as value), so a
// value that itself contains the separator (e.g. "52 kcal, per 100g") survives
// intact. One-column lines become { label, value: "" }.

// Header rows we skip when they're the FIRST line (so a pasted table's header
// doesn't become a data row). Compared case-insensitively, trimmed.
const HEADER_PAIRS = [
  ["label", "value"],
  ["name", "value"],
  ["name", "amount"],
  ["nutrient", "amount"],
  ["nutrient", "value"],
  ["নাম", "মান"],
  ["উপাদান", "পরিমাণ"],
  ["পুষ্টি উপাদান", "পরিমাণ"],
];

// Strip a markdown table's leading/trailing pipes so "| a | b |" → "a | b".
const stripEdgePipes = (line) => line.replace(/^\s*\|/, "").replace(/\|\s*$/, "");

// Is this a markdown separator row like |---|:--:|---| ? (only dashes/colons/
// pipes/spaces). Such rows carry no data and must be dropped.
const isMarkdownDivider = (line) => /^[\s|:-]+$/.test(line) && line.includes("-");

// Split one already-trimmed line into [label, value] using the first separator
// found (by priority). Returns null if the line is empty/structural.
const splitLine = (rawLine) => {
  let line = rawLine.replace(/ /g, " ").trim(); // NBSP → space
  if (!line) return null;
  if (isMarkdownDivider(line)) return null;

  line = stripEdgePipes(line).trim();
  if (!line) return null;

  // Tab (Excel/Sheets) — split on the first tab only.
  if (line.includes("\t")) {
    const i = line.indexOf("\t");
    return [line.slice(0, i).trim(), line.slice(i + 1).replace(/\t/g, " ").trim()];
  }
  // Pipe (markdown). Split on first pipe; collapse any remaining pipes in value.
  if (line.includes("|")) {
    const i = line.indexOf("|");
    return [line.slice(0, i).trim(), line.slice(i + 1).replace(/\|/g, " ").trim()];
  }
  // Colon — require a space after so URLs / times (12:30) aren't mis-split.
  const colon = line.search(/:\s/);
  if (colon !== -1) {
    return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
  }
  // Two-or-more spaces (aligned plain-text columns).
  const multiSpace = line.search(/\s{2,}/);
  if (multiSpace !== -1) {
    const after = line.slice(multiSpace).replace(/^\s+/, "");
    return [line.slice(0, multiSpace).trim(), after.trim()];
  }
  // Single comma fallback.
  if (line.includes(",")) {
    const i = line.indexOf(",");
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }
  // No separator → one-column row.
  return [line, ""];
};

const looksLikeHeader = (label, value) => {
  const l = (label || "").trim().toLowerCase();
  const v = (value || "").trim().toLowerCase();
  return HEADER_PAIRS.some(([hl, hv]) => l === hl && v === hv);
};

/**
 * @param {string} text raw pasted block
 * @returns {{label: string, value: string}[]}
 */
export function parsePastedTable(text) {
  if (!text || typeof text !== "string") return [];
  const lines = text.split(/\r?\n/);
  const rows = [];
  lines.forEach((raw, idx) => {
    const parts = splitLine(raw);
    if (!parts) return;
    const [label, value] = parts;
    if (!label && !value) return;
    // Drop a header row only if it's the very first parsed row.
    if (rows.length === 0 && idx === 0 && looksLikeHeader(label, value)) return;
    rows.push({ label, value });
  });
  return rows;
}

export default parsePastedTable;
