import { useState } from "react";
import { FiX, FiEye, FiEyeOff, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";

// A2 — Price Modal.
//
// Owner-locked UX:
//   - Buying price is sensitive cost data. Masked by default (••••••).
//   - Owner clicks 👁 → SweetAlert confirms "really show?" → reveals in
//     local state only.
//   - On modal close OR page reload, the masked state resets. Edit input
//     still accepts a new value while masked (write-only).
//
// All writes go through /product/quick (whitelisted partial update) — never
// the full-rebuild route. Tier prices are an array; we replace it entirely.
//
// Variation products: these fields are NOT what the customer pays. The
// storefront reads the selected variation's price and only falls back to the
// product-level one when no variation is usable. The list's price cell now
// routes variation products to the variations modal instead, but the modal can
// still be reached (e.g. every variation deactivated), so say so plainly rather
// than let the admin edit a number that changes nothing on the PDP.
const ProductPriceModal = ({ product, onClose, onSaved }) => {
  const isVariation = !!product?.is_variation;
  const [busy, setBusy] = useState(false);
  const [sellingPrice, setSellingPrice] = useState(
    product?.product_price ?? "",
  );
  const [discountPrice, setDiscountPrice] = useState(
    product?.product_discount_price ?? "",
  );
  const [buyingPrice, setBuyingPrice] = useState(
    product?.product_buying_price ?? "",
  );
  const [buyingRevealed, setBuyingRevealed] = useState(false);
  const [unit, setUnit] = useState(product?.unit || "");
  const [tierPrices, setTierPrices] = useState(
    Array.isArray(product?.tier_prices) ? product.tier_prices : [],
  );

  const handleRevealBuying = async () => {
    if (buyingRevealed) {
      setBuyingRevealed(false);
      return;
    }
    const r = await Swal.fire({
      title: "Show buying price?",
      text: "This is sensitive cost data. Make sure no one's looking over your shoulder before revealing.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reveal",
      confirmButtonColor: "#d33",
    });
    if (r.isConfirmed) setBuyingRevealed(true);
  };

  const addTier = () => {
    setTierPrices([...tierPrices, { min_qty: 0, price: 0 }]);
  };
  const updateTier = (idx, field, value) => {
    const copy = [...tierPrices];
    copy[idx] = { ...copy[idx], [field]: Number(value) || 0 };
    setTierPrices(copy);
  };
  const removeTier = (idx) => {
    setTierPrices(tierPrices.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    // Light validation
    // "0" is neither blank nor NaN, so the old check let it straight through and
    // the product's list price became 0 — which reads as free everywhere it is
    // shown, and drops the product out of the storefront's price filter.
    const price = Number(sellingPrice);
    if (sellingPrice === "" || !Number.isFinite(price) || price <= 0) {
      toast.error("Selling price must be greater than 0", { autoClose: 2000 });
      return;
    }
    // A discount at or above the price is not a discount — it would strike
    // through a number equal to (or lower than) what the buyer actually pays.
    const discount = discountPrice === "" ? 0 : Number(discountPrice);
    if (!Number.isFinite(discount) || discount < 0) {
      toast.error("Discount price must be 0 or more", { autoClose: 2000 });
      return;
    }
    if (discount > 0 && discount >= price) {
      toast.error("Discount price must be less than the selling price", {
        autoClose: 2500,
      });
      return;
    }
    setBusy(true);
    try {
      const body = {
        _id: product._id,
        product_price: price,
        product_discount_price: discount,
        unit: unit || "",
        tier_prices: tierPrices
          .filter((t) => t.min_qty > 0 && t.price > 0)
          .sort((a, b) => a.min_qty - b.min_qty),
      };
      if (buyingPrice !== "" && !isNaN(Number(buyingPrice))) {
        body.product_buying_price = Number(buyingPrice);
      }
      const res = await fetch(`${BASE_URL}/product/quick`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.statusCode === 200 && data?.success) {
        toast.success("Price updated", { autoClose: 1200 });
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Price — {product?.product_name}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isVariation && (
            <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <strong>This product has variations.</strong> Customers pay the
              selected variation&apos;s price, not the one below. These fields
              are only a fallback for when no variation is available. Edit the
              real prices from the <strong>Variants</strong> column.
            </div>
          )}

          {/* Selling */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Discount Price
            </label>
            <input
              type="number"
              min="0"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
            <div className="text-xs text-gray-500 mt-0.5">
              Crossed-out price shown on the storefront. Leave 0 for no
              discount.
            </div>
          </div>

          {/* Buying — masked by default */}
          <div>
            <label className="text-sm font-medium mb-1 flex items-center gap-2">
              Buying Price{" "}
              <span className="text-[10px] uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                cost
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type={buyingRevealed ? "number" : "password"}
                min="0"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(e.target.value)}
                placeholder={buyingRevealed ? "0" : "••••••"}
                className="flex-1 px-3 py-1.5 border rounded text-sm"
              />
              <button
                type="button"
                onClick={handleRevealBuying}
                title={buyingRevealed ? "Hide" : "Reveal"}
                className="p-2 border rounded text-gray-600 hover:bg-gray-50"
              >
                {buyingRevealed ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Sensitive — auto-masked on page reload. Internal use only.
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. piece, kg, pack"
              className="w-full px-3 py-1.5 border rounded text-sm"
            />
          </div>

          {/* Tier pricing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Tier Pricing (bulk discounts)
              </label>
              <button
                type="button"
                onClick={addTier}
                className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-500"
              >
                <FiPlus size={12} /> Add tier
              </button>
            </div>
            {tierPrices.length === 0 ? (
              <div className="text-xs text-gray-400 italic">
                No tier prices. Customers pay the selling price regardless of
                quantity.
              </div>
            ) : (
              <div className="space-y-2">
                {tierPrices.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500">
                        Min quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={t.min_qty}
                        onChange={(e) =>
                          updateTier(i, "min_qty", e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500">
                        Price each
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={t.price}
                        onChange={(e) =>
                          updateTier(i, "price", e.target.value)
                        }
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="text-red-500 hover:text-red-600 mt-3"
                      title="Remove tier"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPriceModal;
