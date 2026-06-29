import { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { parsePastedGrid } from "../../utils/parsePastedGrid";

// Multi-column size-guide grid editor (niche-agnostic). Admin defines the
// column headers (Size / EU / UK / CM, or Size / Chest / Waist / Length, …),
// then fills rows whose cells line up with those columns. A "paste grid" button
// turns a ChatGPT markdown table / Excel copy into the grid in one shot.
//
// Props:
//   columns      string[]                    — header cells
//   rows         string[][]                  — each row's cells (aligned to columns)
//   onChange({ columns, rows })              — single change callback
const MAX_COLS = 8;
const MAX_ROWS = 30;

export default function SizeGuideEditor({ columns = [], rows = [], onChange }) {
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
      toast.info(`সর্বোচ্চ ${MAX_COLS} কলাম`);
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
      toast.info(`সর্বোচ্চ ${MAX_ROWS} সারি`);
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

  const applyPaste = (mode) => {
    const parsed = parsePastedGrid(pasteText);
    if (!parsed.columns.length && !parsed.rows.length) {
      toast.error("টেবিল পড়া গেল না — ChatGPT/Excel থেকে কপি করে দিন");
      return;
    }
    if (mode === "replace") {
      emit(parsed.columns.slice(0, MAX_COLS), parsed.rows.slice(0, MAX_ROWS));
    } else {
      // append: keep existing columns, append rows fitted to current width.
      const width = columns.length || parsed.columns.length;
      const cols = columns.length ? columns : parsed.columns.slice(0, MAX_COLS);
      const merged = [
        ...rows,
        ...parsed.rows.map((r) => fitRow(r, width)),
      ].slice(0, MAX_ROWS);
      emit(cols, merged);
    }
    setPasteText("");
    setPasteOpen(false);
    toast.success("সাইজ চার্ট বসানো হয়েছে");
  };

  const hasGrid = columns.length > 0 || rows.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">
          সাইজ চার্ট (কলাম + সারি)
        </label>
        <button
          type="button"
          onClick={() => setPasteOpen((v) => !v)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          📋 টেবিল পেস্ট করুন
        </button>
      </div>
      <p className="text-xs text-gray-400">
        আগে কলামের নাম দিন (যেমন Size / EU / UK / CM বা Size / বুক / কোমর / লম্বা),
        তারপর সারি যোগ করুন। খালি রাখলে PDP-তে দেখাবে না।
      </p>

      {pasteOpen && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder={"ChatGPT/Excel থেকে টেবিল কপি করে এখানে পেস্ট করুন…\n| Size | EU | UK | CM |\n| M | 40 | 6 | 25 |"}
            className="form-input w-full text-xs font-mono"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPaste("replace")}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              প্রতিস্থাপন করুন
            </button>
            <button
              type="button"
              onClick={() => applyPaste("append")}
              className="rounded border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700"
            >
              সারি যোগ করুন
            </button>
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="flex flex-wrap items-center gap-2">
        {columns.map((c, ci) => (
          <div key={ci} className="flex items-center gap-1">
            <input
              value={c}
              onChange={(e) => setColumn(ci, e.target.value)}
              placeholder={`কলাম ${ci + 1}`}
              className="form-input w-28 text-xs font-semibold"
            />
            <button
              type="button"
              onClick={() => removeColumn(ci)}
              className="text-red-500 hover:text-red-700"
              title="কলাম মুছুন"
            >
              <FaTrash size={11} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addColumn}
          className="inline-flex items-center gap-1 rounded border border-dashed border-gray-300 px-2.5 py-1.5 text-xs text-gray-600 hover:border-gray-400"
        >
          <FaPlus size={10} /> কলাম
        </button>
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
                title="সারি মুছুন"
              >
                <FaTrash size={11} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            <FaPlus size={10} /> সারি যোগ করুন
          </button>
        </div>
      )}
    </div>
  );
}
