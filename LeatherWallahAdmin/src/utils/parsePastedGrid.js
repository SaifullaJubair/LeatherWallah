// parsePastedGrid — turns a block of pasted text (ChatGPT markdown table, Excel /
// Google Sheets copy, or aligned plain text) into a { columns, rows } grid for
// the multi-column Size Guide editor. Unlike parsePastedTable (which makes 2-col
// label/value pairs), this splits each line into ALL its cells.
//
// Separator auto-detect PER BLOCK (one separator for the whole paste so columns
// line up), priority: Tab → pipe (markdown) → 2+ spaces → comma.
//
// The first non-divider line becomes `columns` (headers); the rest are `rows`.
// Rows are padded / truncated to the header count so the grid is never ragged.

const NBSP = / /g;

// A markdown separator row like |---|:--:|---| — only dashes/colons/pipes/space.
const isMarkdownDivider = (line) =>
  /^[\s|:-]+$/.test(line) && line.includes("-");

const stripEdgePipes = (line) =>
  line.replace(/^\s*\|/, "").replace(/\|\s*$/, "");

// Decide the column separator for the whole block from the first data line.
// Returns a splitter function (string) => string[].
const pickSplitter = (sampleLine) => {
  if (sampleLine.includes("\t")) return (l) => l.split("\t");
  if (sampleLine.includes("|")) return (l) => stripEdgePipes(l).split("|");
  if (/\s{2,}/.test(sampleLine)) return (l) => l.split(/\s{2,}/);
  if (sampleLine.includes(",")) return (l) => l.split(",");
  // Single column — whole line is one cell.
  return (l) => [l];
};

/**
 * @param {string} text raw pasted block
 * @returns {{ columns: string[], rows: string[][] }}
 */
export function parsePastedGrid(text) {
  if (!text || typeof text !== "string") return { columns: [], rows: [] };

  // Clean + drop blank / markdown-divider lines up front.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(NBSP, " ").trim())
    .filter((l) => l && !isMarkdownDivider(l));

  if (!lines.length) return { columns: [], rows: [] };

  const split = pickSplitter(lines[0]);
  const cellRows = lines.map((l) =>
    split(stripEdgePipes(l)).map((c) => c.trim()),
  );

  // First line = headers. Trim trailing empty headers (a markdown table's edge
  // pipes can produce a stray empty cell).
  let columns = cellRows[0].slice();
  while (columns.length && !columns[columns.length - 1]) columns.pop();
  const width = columns.length || cellRows.reduce((m, r) => Math.max(m, r.length), 0);
  columns = columns.slice(0, width);
  while (columns.length < width) columns.push("");

  // Remaining lines = data rows, padded / truncated to `width`, empties dropped.
  const rows = cellRows
    .slice(1)
    .map((r) => {
      const out = r.slice(0, width);
      while (out.length < width) out.push("");
      return out;
    })
    .filter((r) => r.some((c) => c));

  return { columns, rows };
}

export default parsePastedGrid;
