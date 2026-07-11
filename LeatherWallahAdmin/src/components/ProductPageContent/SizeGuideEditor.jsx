import { useState } from "react";
import { FaPlus, FaTrash, FaClipboardList, FaTimes, FaRetweet } from "react-icons/fa";
import { toast } from "react-toastify";
import { parsePastedGrid } from "../../utils/parsePastedGrid";
import ExampleButton from "./ExampleButton";

// Multi-column size-guide grid editor (niche-agnostic). Admin defines the
// column headers (Size / EU / UK / CM, or Size / Chest / Waist / Length, …),
// then fills rows whose cells line up with those columns. A "paste grid" button
// turns a ChatGPT markdown table / Excel copy into the grid in one shot.
//
// The paste panel is a MODAL, matching PasteTableButton / PasteListButton. It
// used to be an inline block that pushed the grid down and carried its own
// button styling, so this section looked like it belonged to a different app.
// It keeps its own parser (parsePastedGrid) because this is a 2-D grid — the
// other two produce label/value pairs and single-column lists respectively.
//
// Props:
//   columns      string[]                    — header cells
//   rows         string[][]                  — each row's cells (aligned to columns)
//   onChange({ columns, rows })              — single change callback
const MAX_COLS = 8;
const MAX_ROWS = 30;

export default function SizeGuideEditor({
  columns = [],
  rows = [],
  onChange,
  example,
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const emit = (nextCols, nextRows) =>
    onChange({ columns: nextCols, rows: nextRows });

  // Keep every row's width equal to the column count.
  const fitRow = (row, width) => {
    const out = (row || []).slice(0, width);
    while (out.length < width) out.push("");
    return out;
  };

  const addColumn = () => {
    if (columns.length >= MAX_COLS) {
      toast.info(`Max ${MAX_COLS} columns`);
      return;
    }
    const nextCols = [...columns, ""];
    emit(
      nextCols,
      rows.map((r) => fitRow(r, nextCols.length)),
    );
  };

  const removeColumn = (ci) => {
    const nextCols = columns.filter((_, i) => i !== ci);
    emit(
      nextCols,
      rows.map((r) => r.filter((_, i) => i !== ci)),
    );
  };

  const setColumn = (ci, val) =>
    emit(
      columns.map((c, i) => (i === ci ? val : c)),
      rows,
    );

  const addRow = () => {
    if (rows.length >= MAX_ROWS) {
      toast.info(`Max ${MAX_ROWS} rows`);
      return;
    }
    const width = Math.max(columns.length, 1);
    emit(columns, [...rows, new Array(width).fill("")]);
  };

  const removeRow = (ri) =>
    emit(
      columns,
      rows.filter((_, i) => i !== ri),
    );

  const setCell = (ri, ci, val) =>
    emit(
      columns,
      rows.map((r, i) =>
        i === ri ? r.map((c, j) => (j === ci ? val : c)) : r,
      ),
    );

  // Live preview of what the paste would produce, so the counts below the box
  // (and the caps) are honest before the admin commits.
  const preview = pasteOpen ? parsePastedGrid(pasteText) : { columns: [], rows: [] };
  const canApply = preview.columns.length > 0 || preview.rows.length > 0;

  const closePaste = () => {
    setPasteText("");
    setPasteOpen(false);
  };

  const applyPaste = (mode) => {
    if (!canApply) {
      toast.error("Could not read a table — copy one from ChatGPT / Excel");
      return;
    }
    if (mode === "replace") {
      emit(preview.columns.slice(0, MAX_COLS), preview.rows.slice(0, MAX_ROWS));
    } else {
      // append: keep existing columns, append rows fitted to current width.
      const width = columns.length || preview.columns.length;
      const cols = columns.length ? columns : preview.columns.slice(0, MAX_COLS);
      const merged = [
        ...rows,
        ...preview.rows.map((r) => fitRow(r, width)),
      ].slice(0, MAX_ROWS);
      emit(cols, merged);
    }
    closePaste();
    toast.success("Size chart applied");
  };

  const hasGrid = columns.length > 0 || rows.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">
          Size chart{" "}
          <span className="text-xs font-normal text-gray-400">
            ({columns.length} columns · {rows.length} rows)
          </span>
        </label>
        <div className="flex items-center gap-2">
          {example && (
            <ExampleButton
              title="Size chart"
              prompt={example.prompt}
              sample={example.sample}
              note={example.note}
            />
          )}
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
          >
            <FaClipboardList size={12} /> Paste table
          </button>
          <button
            type="button"
            onClick={addColumn}
            disabled={columns.length >= MAX_COLS}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaPlus size={10} /> Add column
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Name the columns first (e.g. Size / EU / UK / CM), then add rows. Leave
        empty and the section is hidden on the PDP.
      </p>

      {/* Column headers */}
      <div className="flex flex-wrap items-center gap-2">
        {columns.map((c, ci) => (
          <div key={ci} className="flex items-center gap-1">
            <input
              value={c}
              onChange={(e) => setColumn(ci, e.target.value)}
              placeholder={`Column ${ci + 1}`}
              className="form-input w-28 text-xs font-semibold"
            />
            <button
              type="button"
              onClick={() => removeColumn(ci)}
              className="text-red-500 hover:text-red-700"
              title="Remove column"
            >
              <FaTrash size={11} />
            </button>
          </div>
        ))}
        {columns.length === 0 && (
          <p className="text-xs text-gray-400 italic">
            No columns yet — add one, or paste a table.
          </p>
        )}
      </div>

      {/* Rows */}
      {hasGrid && columns.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, ri) => (
            <div key={ri} className="flex items-center gap-2">
              {columns.map((_, ci) => (
                <input
                  key={ci}
                  value={row[ci] ?? ""}
                  onChange={(e) => setCell(ri, ci, e.target.value)}
                  className="form-input w-28 text-xs"
                />
              ))}
              <button
                type="button"
                onClick={() => removeRow(ri)}
                className="text-red-500 hover:text-red-700"
                title="Remove row"
              >
                <FaTrash size={11} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= MAX_ROWS}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaPlus size={10} /> Add row
          </button>
        </div>
      )}

      {pasteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closePaste}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-800">
                Paste a size chart from ChatGPT / Excel / Sheets
              </h3>
              <button
                type="button"
                onClick={closePaste}
                className="text-gray-400 hover:text-gray-700"
                title="Close"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <textarea
                autoFocus
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={8}
                placeholder={
                  "First line = the column headers, then one line per row.\nTab / pipe / comma — any separator works.\n\nExample:\n| Size | EU | UK | CM |\n| M    | 41 | 7  | 26 |\n| L    | 42 | 8  | 27 |"
                }
                className="form-input w-full text-xs font-mono"
              />
              {!canApply ? (
                <p className="text-xs text-gray-400">Nothing pasted yet</p>
              ) : (
                <p className="text-xs">
                  <span className="text-green-600 font-medium">
                    {preview.columns.length} column
                    {preview.columns.length === 1 ? "" : "s"} ·{" "}
                    {preview.rows.length} row
                    {preview.rows.length === 1 ? "" : "s"} detected
                  </span>
                  {(preview.columns.length > MAX_COLS ||
                    preview.rows.length > MAX_ROWS) && (
                    <span className="text-amber-600 font-medium">
                      {" "}
                      — capped at {MAX_COLS} columns / {MAX_ROWS} rows
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={closePaste}
                className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canApply}
                onClick={() => applyPaste("replace")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaRetweet size={12} /> Replace chart
              </button>
              <button
                type="button"
                disabled={!canApply}
                onClick={() => applyPaste("append")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blueColor-600 rounded hover:bg-blueColor-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaPlus size={11} /> Add rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
