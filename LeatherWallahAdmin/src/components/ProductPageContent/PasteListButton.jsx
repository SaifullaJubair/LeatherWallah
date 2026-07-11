import { useState } from "react";
import { FaClipboardList, FaTimes, FaPlus, FaRetweet } from "react-icons/fa";

// "Paste a list" shortcut for the ONE-COLUMN repeaters (benefits, use cases,
// short features, process steps). One line = one item.
//
// Deliberately NOT PasteTableButton: that one runs parsePastedTable(), which
// splits every line on the first tab / pipe / colon / comma into a label+value
// pair. These rows have no label+value — just `text` — so a benefit like
// "Slim everyday carry, ages well" would be chopped in half at the comma.
// Here the line IS the item; nothing is split.
//
// Props:
//   onAppend(texts)   append these strings as new rows
//   onReplace(texts)  replace the whole list with them
//   max               row cap of the target repeater (parsed rows are clamped
//                     to what will actually fit, and we say so)
//   current           how many rows the repeater already has
const PasteListButton = ({ onAppend, onReplace, max = 0, current = 0 }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  // One line = one item. Strip common list bullets/numbering an admin may paste
  // straight out of ChatGPT ("- foo", "• foo", "1. foo").
  const parsed = open
    ? text
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*(?:[-*•·–]|\d+[.)])\s+/, "").trim())
        .filter(Boolean)
    : [];

  const count = parsed.length;
  const roomLeft = max ? Math.max(0, max - current) : count;
  const appendKept = max ? Math.min(count, roomLeft) : count;
  const replaceKept = max ? Math.min(count, max) : count;

  const reset = () => {
    setText("");
    setOpen(false);
  };

  const handle = (mode) => {
    if (!count) return;
    if (mode === "append") onAppend?.(parsed.slice(0, appendKept));
    else onReplace?.(parsed.slice(0, replaceKept));
    reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
      >
        <FaClipboardList size={12} /> Paste list
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
                Paste a list — one item per line
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
                  "One item per line. Bullets and numbering are stripped.\n\nExample:\nPremium full-grain leather that ages beautifully\nGoodyear-welt construction for years of durability\nCushioned leather insole for all-day comfort"
                }
                className="form-input w-full text-xs"
              />

              {count === 0 ? (
                <p className="text-xs text-gray-400">Nothing pasted yet</p>
              ) : (
                <p className="text-xs">
                  <span className="text-green-600 font-medium">
                    {count} item{count > 1 ? "s" : ""} detected
                  </span>
                  {max > 0 && (
                    <span className="text-gray-500">
                      {" "}
                      · this section holds {max}, {current} already used
                      {count > roomLeft && (
                        <span className="text-amber-600 font-medium">
                          {" "}
                          — “Add” will keep the first {appendKept}
                          {appendKept === 0 ? " (full)" : ""}
                        </span>
                      )}
                    </span>
                  )}
                </p>
              )}
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
                {max > 0 && count > replaceKept ? ` (${replaceKept})` : ""}
              </button>
              <button
                type="button"
                disabled={!count || appendKept === 0}
                onClick={() => handle("append")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blueColor-600 rounded hover:bg-blueColor-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaPlus size={11} /> Add to list
                {max > 0 && count > appendKept ? ` (${appendKept})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PasteListButton;
