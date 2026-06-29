import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaSave } from "react-icons/fa";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

// Themed-PDP "আজকের বিশেষ অফার" banner with a live countdown. Drives
// setting.offer_enabled / offer_text / offer_end_at. The storefront hides the
// banner when disabled or once offer_end_at has passed.

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in LOCAL time.
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const OfferBannerSettings = ({ getInitialCurrencyData, refetch }) => {
  const settingId = getInitialCurrencyData?._id;
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");
  const [endAt, setEndAt] = useState(""); // datetime-local string
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(!!getInitialCurrencyData?.offer_enabled);
    setText(getInitialCurrencyData?.offer_text || "");
    setEndAt(toLocalInput(getInitialCurrencyData?.offer_end_at));
  }, [getInitialCurrencyData]);

  const handleSave = async () => {
    if (!settingId) {
      toast.error("Site setting record not initialised yet. Save other settings first.");
      return;
    }
    if (enabled && !endAt) {
      toast.warn("Offer চালু করতে শেষ সময় (End date/time) দিতে হবে।");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: settingId,
          offer_enabled: enabled,
          offer_text: text.trim(),
          // datetime-local is local time → store as ISO (UTC)
          offer_end_at: endAt ? new Date(endAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Offer banner saved");
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
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Special Offer Banner</h3>
        <p className="text-xs text-gray-500">
          Product page এর নিচে &quot;আজকের বিশেষ অফার&quot; banner — live countdown সহ।
          সময় শেষ হলে বা বন্ধ থাকলে banner দেখাবে না।
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Offer banner চালু করো
        </label>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Offer Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="২ টি কিনলে ১ টি ফ্রি"
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            End date &amp; time (countdown এই সময় পর্যন্ত চলবে)
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="form-input w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            তোমার local সময় অনুযায়ী দাও — countdown ক্রেতার ব্রাউজারে এই সময় পর্যন্ত
            গুনবে।
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6 max-w-xl">
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

export default OfferBannerSettings;
