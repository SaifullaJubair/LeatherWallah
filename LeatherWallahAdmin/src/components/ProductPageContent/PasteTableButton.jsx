import { useState } from "react";
import { FaClipboardList, FaTimes } from "react-icons/fa";
import { parsePastedTable } from "../../utils/parsePastedTable";

// Reusable "paste a table" shortcut for any label/value repeater. Admin pastes
// a block copied from ChatGPT / Excel / Sheets / a markdown table; we parse it
// into [{label, value}] rows and hand them back via onAppend / onReplace so the
// caller maps them into its own row shape. Additive — the manual "Add" button
// stays; this is just a faster bulk path.
//
// Props:
//   onAppend(rows)   add parsed rows to the end of the existing list
//   onReplace(rows)  replace the whole list with parsed rows
//   label            optional button text override
const PasteTableButton = ({ onAppend, onReplace, label = "টেবিল পেস্ট করুন" }) => {
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
      >
        <FaClipboardList size={12} /> {label}
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 border border-purple-200 bg-purple-50/40 rounded space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-800">
          ChatGPT / Excel / Sheets থেকে টেবিল পেস্ট করো
        </span>
        <button
          type="button"
          onClick={reset}
          className="text-gray-400 hover:text-gray-600"
          title="বন্ধ করো"
        >
          <FaTimes size={13} />
        </button>
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={
          "প্রতি লাইনে label ও value।\nTab / কোলন / | / কমা — যেকোনো separator চলবে।\nউদাহরণ:\nক্যালোরি\t৫২ kcal\nপ্রোটিন: ০.৩ গ্রাম\nফাইবার | ২.৪ গ্রাম"
        }
        className="form-input w-full text-xs font-mono"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {count > 0 ? `${count}টি রো পাওয়া গেছে` : "এখনো কিছু পেস্ট করা হয়নি"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!count}
            onClick={() => handle("append")}
            className="text-xs px-2.5 py-1 bg-blueColor-50 text-blueColor-600 rounded hover:bg-blueColor-100 disabled:opacity-40"
          >
            যোগ করো (নিচে)
          </button>
          <button
            type="button"
            disabled={!count}
            onClick={() => handle("replace")}
            className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 disabled:opacity-40"
          >
            প্রতিস্থাপন
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasteTableButton;
