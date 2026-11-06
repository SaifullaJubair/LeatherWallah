// EditOrderLineModal — admin order-line edit (2026-11-06).
//
// Business flow: admin calls to confirm a pending COD order; customer wants a
// different size/qty. Previously the only option was cancel + ask the
// customer to reorder (customer usually doesn't bother). This lets admin
// change the variation and/or quantity on a NOT-YET-COURIER order in place.
//
// Two-step save: first call hits the backend, which prices the new
// variation/qty and tells us whether the price changed. If it did, we show a
// confirmation ("tell the customer") before the admin walks away thinking
// it's done — the backend has ALREADY applied the change by the time this
// modal gets a response (single PATCH, no separate "confirm" request), so the
// second step here is purely informational, not a second API call.
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiX, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { BASE_URL } from "../../utils/baseURL";

const EditOrderLineModal = ({ order, line, onClose, onSuccess }) => {
  const [variations, setVariations] = useState(null);
  const [loadingVariations, setLoadingVariations] = useState(true);
  const [variationId, setVariationId] = useState(
    line?.variation_id?._id || "",
  );
  const [quantity, setQuantity] = useState(line?.product_quantity || 1);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // set after a successful save, for the price-changed notice

  const productId = line?.product_id?._id;
  const isVariationProduct = !!line?.variation_id;

  useEffect(() => {
    if (!isVariationProduct || !productId) {
      setLoadingVariations(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/variation/by-product-for-order/${productId}`,
          { credentials: "include" },
        );
        const data = await res.json();
        setVariations(data?.data || []);
      } catch {
        toast.error("Failed to load variations");
        setVariations([]);
      } finally {
        setLoadingVariations(false);
      }
    })();
  }, [productId, isVariationProduct]);

  const handleSave = async () => {
    if (isVariationProduct && !variationId) {
      toast.error("Please select a variation");
      return;
    }
    if (!quantity || quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const body = { product_quantity: Number(quantity) };
    if (isVariationProduct) body.variation_id = variationId;

    try {
      setSaving(true);
      const res = await fetch(
        `${BASE_URL}/order/admin/${order._id}/line/${line._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "Update failed");

      if (data?.data?.price_changed) {
        // Already saved — this is a notice, not a confirm step.
        setResult(data.data);
      } else {
        toast.success("Order line updated");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Price-changed notice — shown AFTER the save already succeeded.
  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center gap-2 px-5 py-4 border-b bg-amber-50">
            <FiAlertTriangle className="text-amber-500" size={18} />
            <h3 className="font-semibold text-gray-800">Price Changed</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-600">
              The order was updated. The new variation's price is different
              from before — please call the customer and let them know.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Old unit price</span>
              <span className="font-semibold text-gray-700">
                ৳{result.old_unit_price}
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-sm">
              <span className="text-amber-700">New unit price</span>
              <span className="font-bold text-amber-800">
                ৳{result.new_unit_price}
              </span>
            </div>
          </div>
          <div className="flex justify-end px-5 py-4 border-t bg-gray-50 rounded-b-lg">
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition flex items-center gap-1.5"
            >
              <FiCheckCircle size={14} />
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-800">Edit Order Item</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {line?.product_id?.product_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {isVariationProduct && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Variation (size / color)
              </label>
              {loadingVariations ? (
                <p className="text-xs text-gray-400">Loading variations…</p>
              ) : (
                <select
                  value={variationId}
                  onChange={(e) => setVariationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>
                    -- Select --
                  </option>
                  {variations?.map((v) => (
                    <option
                      key={v._id}
                      value={v._id}
                      disabled={v.variation_quantity <= 0}
                    >
                      {v.variation_name}{" "}
                      {v.variation_quantity <= 0
                        ? "(out of stock)"
                        : `(${v.variation_quantity} in stock)`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-3 py-2">
            ⚠️ Only allowed before this order is sent to a courier. Stock is
            moved immediately: the old item is restocked, the new one is
            deducted.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loadingVariations}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderLineModal;
