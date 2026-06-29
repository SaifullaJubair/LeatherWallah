import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../utils/baseURL";

// A2 — Stock Modal.
//
// Two branches:
//   - Simple product: edit product_quantity + product_alert_quantity via
//     /product/quick (whitelisted partial update).
//   - Variation product: fetches /product/dashboard/:id to get the variation
//     list, then per-row edits via PATCH /variation/:id (existing endpoint).
//     The Variations Modal also writes there; this modal is a stock-focused
//     subset for fast inventory updates.
//
// Owner rule (locked): variation sum IS truth. Simple product_quantity is
// hidden entirely when is_variation = true.
const ProductStockModal = ({ product, onClose, onSaved }) => {
  const isVariation = !!product?.is_variation;
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState(product?.product_quantity ?? 0);
  const [alertQty, setAlertQty] = useState(product?.product_alert_quantity ?? 0);

  // Variation branch
  const [variationRows, setVariationRows] = useState([]);
  const { data: detail, refetch } = useQuery({
    queryKey: [`/api/v1/product/dashboard/${product._id}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/dashboard/${product._id}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: isVariation,
  });

  useEffect(() => {
    if (detail?.data?.variations) {
      setVariationRows(
        detail.data.variations.map((v) => ({
          _id: v._id,
          variation_name: v.variation_name,
          variation_quantity: v.variation_quantity ?? 0,
          variation_alert_quantity: v.variation_alert_quantity ?? 0,
          is_active: v.is_active !== false,
        })),
      );
    }
  }, [detail]);

  const handleSimpleSave = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/product/quick`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          _id: product._id,
          product_quantity: Number(qty) || 0,
          product_alert_quantity: Number(alertQty) || 0,
        }),
      });
      const data = await res.json();
      if (data?.statusCode === 200 && data?.success) {
        toast.success("Stock updated", { autoClose: 1200 });
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

  const updateVarRow = (idx, field, value) => {
    const copy = [...variationRows];
    copy[idx] = { ...copy[idx], [field]: value };
    setVariationRows(copy);
  };

  const handleVariationSave = async () => {
    setBusy(true);
    let okCount = 0;
    let failCount = 0;
    for (const row of variationRows) {
      try {
        const res = await fetch(`${BASE_URL}/variation/${row._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            variation_quantity: Number(row.variation_quantity) || 0,
            variation_alert_quantity: Number(row.variation_alert_quantity) || 0,
            is_active: !!row.is_active,
          }),
        });
        const data = await res.json();
        if (data?.statusCode === 200 && data?.success) okCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setBusy(false);
    if (failCount === 0) {
      toast.success(`${okCount} variations updated`, { autoClose: 1500 });
      refetch();
      onSaved?.();
      onClose?.();
    } else {
      toast.error(
        `${okCount} succeeded, ${failCount} failed — refresh and retry`,
        { autoClose: 2500 },
      );
      refetch();
    }
  };

  const stockTotal = isVariation
    ? variationRows.reduce(
        (s, r) => s + (Number(r.variation_quantity) || 0),
        0,
      )
    : Number(qty) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Stock — {product?.product_name}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          {isVariation ? (
            <>
              <div className="text-sm text-gray-600 mb-3">
                This product has variations — edit each variation's stock
                below. The product-level <code>product_quantity</code> field is
                ignored (variation sum is authoritative).
              </div>
              {variationRows.length === 0 ? (
                <div className="text-sm text-gray-400 italic">
                  Loading variations…
                </div>
              ) : (
                <div className="overflow-x-auto border rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Variation</th>
                        <th className="p-2">Stock</th>
                        <th className="p-2">Alert qty</th>
                        <th className="p-2">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variationRows.map((r, i) => {
                        const low =
                          r.variation_alert_quantity > 0 &&
                          r.variation_quantity <= r.variation_alert_quantity;
                        return (
                          <tr key={r._id} className="border-t">
                            <td className="p-2">{r.variation_name}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={r.variation_quantity}
                                onChange={(e) =>
                                  updateVarRow(
                                    i,
                                    "variation_quantity",
                                    e.target.value,
                                  )
                                }
                                className={`w-24 px-2 py-1 border rounded ${
                                  low ? "border-red-400 bg-red-50" : ""
                                }`}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={r.variation_alert_quantity}
                                onChange={(e) =>
                                  updateVarRow(
                                    i,
                                    "variation_alert_quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-24 px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={r.is_active}
                                onChange={(e) =>
                                  updateVarRow(i, "is_active", e.target.checked)
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Stock quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Alert quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={alertQty}
                  onChange={(e) => setAlertQty(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded text-sm"
                />
                <div className="text-xs text-gray-500 mt-0.5">
                  Row turns red in the product list when stock ≤ alert.
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 mt-3 border-t pt-2">
            Total stock:{" "}
            <span className="font-semibold">{stockTotal}</span> units
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
            onClick={isVariation ? handleVariationSave : handleSimpleSave}
            className="bg-primaryColor text-white text-sm px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductStockModal;
