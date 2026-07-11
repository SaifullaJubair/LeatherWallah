import { FaPlus, FaTrash } from "react-icons/fa";
import IconPicker from "../../common/IconPicker/IconPicker";
import PasteTableButton from "../../ProductPageContent/PasteTableButton";
import ExampleButton from "../../ProductPageContent/ExampleButton";

// Free-form spec rows for the PDP (label + value + optional icon).
// Icon is picked via the curated IconPicker (saves an icon_key string like
// "lu:MapPin") — same registry used everywhere else (PageContent IconText
// rows, theme builder).

const EMPTY = { label: "", value: "", icon_key: "" };

const MAX_ROWS = 12;
const LABEL_LEN = 30;
const VALUE_LEN = 60;

// Remaining-chars countdown (amber in last 5). Sits in a relative wrapper.
const Counter = ({ value, max }) => {
  if (!max) return null;
  const left = max - (value || "").length;
  return (
    <span
      className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none tabular-nums ${
        left <= 5 ? "text-amber-500 font-semibold" : "text-gray-300"
      }`}
    >
      {left}
    </span>
  );
};

// `example` — optional { prompt, sample[], note }. When given, an "Example"
// button appears beside Paste / Add with a worked sample and a copyable ChatGPT
// prompt for this product. Omitted on the Add Product form (no product name to
// build a prompt around yet), so the button simply doesn't render there.
const CustomFieldsBlock = ({ customFields, setCustomFields, example }) => {
  const capRows = (rows) => rows.slice(0, MAX_ROWS);
  const add = () => {
    if ((customFields || []).length >= MAX_ROWS) return;
    setCustomFields([...(customFields || []), { ...EMPTY }]);
  };
  const update = (i, k, v) =>
    setCustomFields(
      (customFields || []).map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );
  const remove = (i) =>
    setCustomFields((customFields || []).filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">Custom spec rows</p>
          <p className="text-[11px] text-gray-400">
            Free-form rows shown on the PDP beyond the attribute spec table.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {example && (
            <ExampleButton
              title="Custom spec rows"
              prompt={example.prompt}
              sample={example.sample}
              note={example.note}
            />
          )}
          <PasteTableButton
            onAppend={(rows) =>
              setCustomFields(
                capRows([
                  ...(customFields || []),
                  ...rows.map((r) => ({ ...EMPTY, ...r })),
                ]),
              )
            }
            onReplace={(rows) =>
              setCustomFields(capRows(rows.map((r) => ({ ...EMPTY, ...r }))))
            }
          />
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-blueColor-600 text-white rounded hover:bg-blueColor-700"
          >
            <FaPlus size={10} /> Add row
          </button>
        </div>
      </div>

      {(!customFields || customFields.length === 0) && (
        <p className="text-xs text-gray-400 italic">No custom rows yet.</p>
      )}

      <div className="space-y-2">
        {(customFields || []).map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-3 items-start bg-white p-3 rounded border border-gray-200"
          >
            {/* Icon first, then Label, then Value — the order the row reads on
                the PDP, and the order every repeater in Page Content uses. */}
            <div className="col-span-2">
              <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                Icon
              </label>
              <IconPicker
                value={r.icon_key || null}
                onChange={(key) => update(i, "icon_key", key || "")}
              />
            </div>
            <div className="col-span-4">
              <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                Label
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={r.label}
                  onChange={(e) => update(i, "label", e.target.value)}
                  placeholder="e.g. Upper Material"
                  maxLength={LABEL_LEN}
                  className="w-full p-2 pr-7 border border-gray-300 rounded text-sm"
                />
                <Counter value={r.label} max={LABEL_LEN} />
              </div>
            </div>
            <div className="col-span-5">
              <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                Value
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={r.value}
                  onChange={(e) => update(i, "value", e.target.value)}
                  placeholder="e.g. Full-grain leather"
                  maxLength={VALUE_LEN}
                  className="w-full p-2 pr-7 border border-gray-300 rounded text-sm"
                />
                <Counter value={r.value} max={VALUE_LEN} />
              </div>
            </div>
            <div className="col-span-1 flex items-center justify-end pt-6">
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Remove"
              >
                <FaTrash size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        Icon optional — empty = no icon, just text. Same icon registry as PDP /
        Page Content rows.
      </p>
    </div>
  );
};

export default CustomFieldsBlock;
