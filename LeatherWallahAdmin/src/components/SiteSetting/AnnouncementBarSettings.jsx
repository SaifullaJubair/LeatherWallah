import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { FiUpload, FiX } from "react-icons/fi";
import { BASE_URL } from "../../utils/baseURL";
import IconPicker from "../common/IconPicker/IconPicker";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

// Top-of-page rolling banner (3 items in design, but admin can add up to 5)
const MAX_ITEMS = 5;

const AnnouncementBarSettings = ({ getInitialCurrencyData, refetch }) => {
  const settingId = getInitialCurrencyData?._id;
  const initial = getInitialCurrencyData?.announcement_bar || [];
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    setItems(getInitialCurrencyData?.announcement_bar || []);
  }, [getInitialCurrencyData]);

  const addItem = () => {
    if (items.length >= MAX_ITEMS) {
      toast.info(`Max ${MAX_ITEMS} items`);
      return;
    }
    setItems((prev) => [...prev, { text: "", icon_key: "", icon_url: "" }]);
  };
  const updateItem = (i, patch) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  // Custom SVG/PNG upload for one item; uploading clears any picked icon_key.
  const handleIconUpload = async (i, file) => {
    if (!file) return;
    setUploadingIdx(i);
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
        updateItem(i, { icon_url: data.data.Location, icon_key: "" });
      } else toast.error("Upload failed");
    } catch {
      toast.error("Upload error");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSave = async () => {
    if (!settingId) {
      toast.error("Site setting record not initialised yet. Save other settings first.");
      return;
    }
    const cleaned = items
      .map((it) => ({
        text: (it.text || "").trim(),
        icon: (it.icon || "").trim(), // preserve any legacy emoji
        icon_key: it.icon_key || "",
        icon_url: it.icon_url || "",
      }))
      .filter((it) => it.text);

    setSaving(true);
    try {
      // PATCH, not POST: setting.routes.ts only registers GET and PATCH on
      // "/". A POST matched no route at all, so every save answered
      // 404 "API Not Found" and the bar stayed empty on the storefront.
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: settingId, announcement_bar: cleaned }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Announcement bar saved");
        refetch?.();
      } else toast.error(data?.message || "Save failed");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Top Announcement Bar</h3>
          <p className="text-xs text-gray-500">
            Site এর top এ ৩-৫ টা rolling text যোগ করো (e.g. সারা বাংলাদেশে ফ্রি ডেলিভারি)।
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blueColor-50 text-blueColor-600 rounded text-sm hover:bg-blueColor-100"
        >
          <FaPlus /> Add
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">কিছু যোগ করা হয়নি।</p>
        ) : (
          items.map((it, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-white border rounded"
            >
              {/* Curated icon (optional) — picking clears any custom upload */}
              <IconPicker
                value={it.icon_key || null}
                uploadUrl={it.icon_url || undefined}
                onChange={(key) => updateItem(i, { icon_key: key || "", icon_url: "" })}
              />

              {/* Custom SVG/PNG upload — alternative to the picker */}
              <label
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded border cursor-pointer flex-shrink-0 ${
                  uploadingIdx === i
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
                  disabled={uploadingIdx === i}
                />
              </label>
              {it.icon_url && (
                <button
                  type="button"
                  onClick={() => updateItem(i, { icon_url: "" })}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                  title="Remove uploaded icon"
                >
                  <FiX size={14} />
                </button>
              )}

              <input
                type="text"
                value={it.text || ""}
                onChange={(e) => updateItem(i, { text: e.target.value })}
                placeholder="Announcement text"
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 flex-shrink-0"
              >
                <FaTrash />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 disabled:opacity-60"
        >
          {saving ? <MiniSpinner /> : <FaSave />} Save
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBarSettings;
