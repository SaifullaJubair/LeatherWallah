import { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import IconPicker from "../common/IconPicker/IconPicker";

// Reusable repeater for arrays of {icon_url, icon_key, text}
// Used for: short_features, process_steps, use_cases
//
// Each row offers TWO ways to set an icon:
//   1. IconPicker — pick a curated icon (saved as icon_key, e.g. "lu:Leaf")
//   2. File upload — custom SVG/PNG (saved as icon_url)
// icon_url (custom upload) takes priority over icon_key at render time, so
// uploading clears any picked key and vice-versa to avoid ambiguity.
// maxLen — optional per-row character cap on the text input (0 = no cap). Keeps
// PDP cards from breaking when an admin pastes a paragraph into a one-line item.
const IconTextRepeater = ({ value = [], onChange, label, max = 4, helper, maxLen = 0 }) => {
  const [uploading, setUploading] = useState(false);

  const addRow = () => {
    if (value.length >= max) {
      toast.info(`Max ${max} items allowed`);
      return;
    }
    onChange([...value, { icon_url: "", icon_key: "", text: "" }]);
  };

  const updateRow = (i, patch) => {
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  };

  const removeRow = (i) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const handleIconUpload = async (i, file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${BASE_URL}/image_upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (data?.success && data?.data) {
        // Custom upload wins — clear any picked curated icon.
        updateRow(i, {
          icon_url: data.data.Location,
          icon_key: "",
        });
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">
          {label}{" "}
          <span className="text-xs font-normal text-gray-400">
            (max {max})
          </span>
        </label>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blueColor-50 text-blueColor-600 rounded hover:bg-blueColor-100"
        >
          <FaPlus /> Add
        </button>
      </div>
      {helper && <p className="text-xs text-gray-400 -mt-1">{helper}</p>}
      {value.length === 0 ? (
        <p className="text-xs text-gray-400 italic">কিছু যোগ করা হয়নি।</p>
      ) : (
        value.map((row, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 bg-white border rounded"
          >
            {/* Icon picker — choose a curated icon. Picking clears any custom upload. */}
            <IconPicker
              value={row.icon_key || null}
              uploadUrl={row.icon_url || undefined}
              onChange={(key) => updateRow(i, { icon_key: key || "", icon_url: "" })}
            />

            {/* Custom upload (SVG/PNG) — alternative to the picker */}
            <label
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded border cursor-pointer flex-shrink-0 ${
                uploading
                  ? "opacity-50 cursor-wait"
                  : "text-gray-600 border-gray-200 hover:border-blueColor-400 hover:text-blueColor-600"
              }`}
              title="Upload a custom SVG/PNG instead"
            >
              <FiUpload size={12} /> Upload
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleIconUpload(i, e.target.files?.[0])}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {row.icon_url && (
              <button
                type="button"
                onClick={() => updateRow(i, { icon_url: "" })}
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                title="Remove uploaded icon"
              >
                <FiX size={14} />
              </button>
            )}

            <div className="flex-1 relative">
              <input
                type="text"
                value={row.text}
                onChange={(e) => updateRow(i, { text: e.target.value })}
                placeholder="Text"
                maxLength={maxLen || undefined}
                className="form-input w-full"
              />
              {maxLen > 0 && (
                <span
                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none tabular-nums ${
                    maxLen - (row.text || "").length <= 5
                      ? "text-amber-500 font-semibold"
                      : "text-gray-300"
                  }`}
                >
                  {maxLen - (row.text || "").length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 flex-shrink-0"
            >
              <FaTrash />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default IconTextRepeater;
