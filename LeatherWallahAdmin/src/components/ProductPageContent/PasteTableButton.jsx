import { useState } from "react";
import { FaClipboardList, FaTimes, FaPlus, FaRetweet } from "react-icons/fa";
import { parsePastedTable } from "../../utils/parsePastedTable";

// Reusable "paste a table" shortcut for any label/value repeater. Admin pastes
// a block copied from ChatGPT / Excel / Sheets / a markdown table; we parse it
// into [{label, value}] rows and hand them back via onAppend / onReplace so the
// caller maps them into its own row shape. Additive — the manual "Add" button
// stays; this is just a faster bulk path.
//
// The panel is a MODAL, not an inline block. Every caller mounts this inside a
// narrow `flex items-center gap-2` toolbar next to an "Add row" button, so an
// inline panel got squeezed into that flex cell and spilled over the layout.
// A modal is not part of the toolbar's flow, so it renders the same width no
// matter which toolbar opened it.
//
// Props:
//   onAppend(rows)   add parsed rows to the end of the existing list
//   onReplace(rows)  replace the whole list with parsed rows
//   label            optional button text override
const PasteTableButton = ({ onAppend, onReplace, label = "Paste table" }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const parsed = open ? parsePastedTable(text) : [];
  const count = parsed.length;

  const reset = () => {
    setText("");
    setOpen(false);
  };

  const handle = (mode) => {
    if (!count) return;
    if (mode === "append") onAppend?.(parsed);
    else onReplace?.(parsed);
    reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
      >
        <FaClipboardList size={12} /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={reset}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-800">
                Paste a table from ChatGPT / Excel / Sheets
              </h3>
              <button
                type="button"
                onClick={reset}
                className="text-gray-400 hover:text-gray-700"
                title="Close"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={
                  "One label and value per line.\nTab / colon / | / comma — any separator works.\n\nExample:\nUpper Material\tFull-grain leather\nConstruction: Goodyear welted\nOutsole | Rubber (anti-slip)"
                }
                className="form-input w-full text-xs font-mono"
              />
              <p
                className={`text-xs ${
                  count > 0 ? "text-green-600 font-medium" : "text-gray-400"
                }`}
              >
                {count > 0
                  ? `${count} row${count > 1 ? "s" : ""} detected`
                  : "Nothing pasted yet"}
              </p>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={reset}
                className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!count}
                onClick={() => handle("replace")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaRetweet size={12} /> Replace all
              </button>
              <button
                type="button"
                disabled={!count}
                onClick={() => handle("append")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blueColor-600 rounded hover:bg-blueColor-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaPlus size={11} /> Add to list
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PasteTableButton;
