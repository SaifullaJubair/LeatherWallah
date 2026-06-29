import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useGetTrustPoints } from "../../hooks/useGetTrustPoints";
import IconPicker from "../../components/common/IconPicker/IconPicker";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { BASE_URL } from "../../utils/baseURL";

// "আমাদের প্রতিশ্রুতি" — a single site-wide brand-promise list shown on every
// themed product page (NutritionSection). Edited as a whole and saved via PUT.
const TrustPointPage = () => {
  const { data, isLoading, refetch } = useGetTrustPoints();
  const [points, setPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    if (data?.data?.points) setPoints(data.data.points);
  }, [data]);

  const addRow = () => {
    if (points.length >= 6) {
      toast.info("সর্বোচ্চ ৬টি প্রতিশ্রুতি দেখানো হয়।");
      return;
    }
    setPoints((p) => [...p, { icon_key: "", icon_url: "", title: "", subtitle: "" }]);
  };

  const updateRow = (i, patch) =>
    setPoints((p) => p.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const removeRow = (i) => setPoints((p) => p.filter((_, idx) => idx !== i));

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
      const result = await res.json();
      if (result?.success && result?.data) {
        // custom upload wins — clear any picked curated icon
        updateRow(i, { icon_url: result.data.Location, icon_key: "" });
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/trust-point`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      const result = await res.json();
      if (result?.success) {
        toast.success("Brand promise updated");
        refetch();
      } else {
        toast.error(result?.message || "Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Brand Promise — আমাদের প্রতিশ্রুতি
          </h1>
          <p className="text-sm text-gray-500">
            প্রতিটি themed product page এর &quot;আমাদের প্রতিশ্রুতি&quot; section এ
            এই tile গুলো দেখাবে। সর্বোচ্চ ৬টি।
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 disabled:opacity-60 text-sm"
        >
          {saving ? <MiniSpinner /> : <FaSave />} Save
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height={64} />
            ))}
          </div>
        ) : points.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            কোনো প্রতিশ্রুতি যোগ করা হয়নি। নিচের বাটন দিয়ে যোগ করুন।
          </p>
        ) : (
          points.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 p-3 border rounded-lg bg-gray-50"
            >
              {/* Icon picker — pick a curated icon (clears any custom upload) */}
              <IconPicker
                value={row.icon_key || null}
                uploadUrl={row.icon_url || undefined}
                onChange={(key) =>
                  updateRow(i, { icon_key: key || "", icon_url: "" })
                }
              />

              {/* Custom upload (SVG/PNG) — alternative to the picker */}
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

              <input
                type="text"
                value={row.title || ""}
                onChange={(e) => updateRow(i, { title: e.target.value })}
                placeholder="Title (যেমন: ১০০% নিরাপদ)"
                className="form-input flex-1 min-w-[160px]"
              />
              <input
                type="text"
                value={row.subtitle || ""}
                onChange={(e) => updateRow(i, { subtitle: e.target.value })}
                placeholder="Subtitle (optional)"
                className="form-input flex-1 min-w-[160px]"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="px-2 py-2 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 flex-shrink-0"
              >
                <FaTrash />
              </button>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-2 text-xs px-3 py-2 bg-blueColor-50 text-blueColor-600 rounded hover:bg-blueColor-100"
        >
          <FaPlus /> Add Promise
        </button>
      </div>
    </div>
  );
};

export default TrustPointPage;
