import { useState } from "react";
import { FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";

// Analytics Seed Modal — admin sets baseline sold_count + view_count.
// Real orders/views accumulate on top once the store is live.
const ProductAnalyticsSeedModal = ({ product, onClose, onSaved }) => {
  const [busy, setBusy] = useState(false);
  const [soldCount, setSoldCount] = useState(product?.sold_count ?? 0);
  const [viewCount, setViewCount] = useState(product?.view_count ?? 0);

  const handleSave = async () => {
    const sold = Number(soldCount);
    const view = Number(viewCount);
    if (isNaN(sold) || sold < 0) {
      toast.error("Sold count must be ≥ 0", { autoClose: 1500 });
      return;
    }
    if (isNaN(view) || view < 0) {
      toast.error("View count must be ≥ 0", { autoClose: 1500 });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/product/quick`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ _id: product._id, sold_count: sold, view_count: view }),
      });
      const data = await res.json();
      if (data?.statusCode === 200 && data?.success) {
        toast.success("Analytics seed updated", { autoClose: 1200 });
        onSaved?.();
        onClose?.();
      } else {
        toast.error(data?.message || "Update failed", { autoClose: 1500 });
      }
    } catch {
      toast.error("Network error", { autoClose: 1500 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold truncate pr-4">
            Analytics Seed — {product?.product_name}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded shrink-0">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-500">
            Set a baseline number that shows until real data overtakes it. Real orders
            and page views accumulate <em>on top</em> of these seed values.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">
              Sold count <span className="text-xs text-gray-400">(বিক্রি সংখ্যা)</span>
            </label>
            <input
              type="number"
              min="0"
              value={soldCount}
              onChange={(e) => setSoldCount(e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              View count <span className="text-xs text-gray-400">(ভিজিট সংখ্যা)</span>
            </label>
            <input
              type="number"
              min="0"
              value={viewCount}
              onChange={(e) => setViewCount(e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm"
              placeholder="0"
            />
          </div>

          <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-700">
            ⚠️ This overwrites the current values. Each change is logged in the audit trail
            (product_count_history collection). Dashboard analytics always reads real order data only.
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="bg-primaryColor text-white text-sm px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save Seed Data"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalyticsSeedModal;
