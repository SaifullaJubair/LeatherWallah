import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaSave } from "react-icons/fa";
import { BASE_URL } from "../../utils/baseURL";
import IconPicker from "../common/IconPicker/IconPicker";

// Convert grams to display value + unit
const gramsToDisplay = (g) => {
  if (g === null || g === undefined || g === "") return { value: "", unit: "g" };
  if (g >= 1000) {
    const v = g / 1000;
    return { value: Number.isInteger(v) ? String(v) : v.toFixed(2), unit: "kg" };
  }
  return { value: String(g), unit: "g" };
};

const displayToGrams = (value, unit) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return unit === "kg" ? Math.round(n * 1000) : Math.round(n);
};

const VariationWeightEditor = ({ productId }) => {
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/variation/by-product/${productId}`, {
        credentials: "include",
      });
      const data = await res.json();
      const list = (data?.data || []).map((v) => {
        const d = gramsToDisplay(v.variation_weight_grams);
        return {
          ...v,
          _wValue: d.value,
          _wUnit: d.unit,
        };
      });
      setVariations(list);
    } catch {
      toast.error("Failed to load variations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const updateLocal = (id, patch) =>
    setVariations((prev) => prev.map((v) => (v._id === id ? { ...v, ...patch } : v)));

  const save = async (v) => {
    setSavingId(v._id);
    const grams = displayToGrams(v._wValue, v._wUnit);
    try {
      const res = await fetch(`${BASE_URL}/variation/${v._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variation_weight_grams: grams,
          variation_badge_text: v.variation_badge_text || null,
          variation_badge_icon_key: v.variation_badge_icon_key || null,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(`${v.variation_name}: saved`);
      } else toast.error(data?.message || "Failed");
    } catch {
      toast.error("Network error");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading variations...</p>;
  if (!variations.length) {
    return (
      <p className="text-sm text-gray-500 italic">
        এই product এ কোনো variation নেই।
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Variation</th>
            <th className="px-3 py-2 text-left">Weight</th>
            <th className="px-3 py-2 text-left">Badge Text</th>
            <th className="px-3 py-2 text-left">Badge Icon</th>
            <th className="px-3 py-2 text-left">Price</th>
            <th className="px-3 py-2 text-left">Stock</th>
            <th className="px-3 py-2 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {variations.map((v) => (
            <tr key={v._id} className="border-t">
              <td className="px-3 py-2 font-medium">{v.variation_name}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={v._wValue}
                    onChange={(e) => updateLocal(v._id, { _wValue: e.target.value })}
                    className="form-input w-24"
                    placeholder="0"
                  />
                  <select
                    value={v._wUnit}
                    onChange={(e) => updateLocal(v._id, { _wUnit: e.target.value })}
                    className="form-input w-16"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  maxLength={20}
                  value={v.variation_badge_text || ""}
                  onChange={(e) =>
                    updateLocal(v._id, { variation_badge_text: e.target.value })
                  }
                  placeholder="সেরা প্যাক / জনপ্রিয় (optional)"
                  className="form-input"
                />
              </td>
              <td className="px-3 py-2">
                <IconPicker
                  value={v.variation_badge_icon_key || null}
                  onChange={(k) =>
                    updateLocal(v._id, { variation_badge_icon_key: k || null })
                  }
                />
              </td>
              <td className="px-3 py-2 text-gray-700">
                ৳{v.variation_discount_price || v.variation_price}
              </td>
              <td className="px-3 py-2 text-gray-700">{v.variation_quantity}</td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => save(v)}
                  disabled={savingId === v._id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                >
                  <FaSave /> {savingId === v._id ? "..." : "Save"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">
        Weight DB-তে সবসময় <strong>grams</strong> এ save হয়। UI তে kg ব্যবহার করলে auto convert হবে।
        Pathao courier এ এই weight সরাসরি ব্যবহার হবে (1kg = 1000g)।
      </p>
    </div>
  );
};

export default VariationWeightEditor;
