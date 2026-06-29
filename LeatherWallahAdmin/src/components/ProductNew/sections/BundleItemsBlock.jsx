import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import { FaPlus, FaTrash } from "react-icons/fa";
import { BASE_URL } from "../../../utils/baseURL";

// Combo / bundle items table. Each row references an EXISTING product
// (product_id) + a quantity. Shown only in UpdateProduct mode — Add page
// blocks Combo since a brand-new product can't reference itself.

const EMPTY = { product_id: "", quantity: 1 };

const BundleItemsBlock = ({ bundleItems, setBundleItems, currentProductId }) => {
  const { data: resp = {}, isLoading } = useQuery({
    queryKey: ["/api/v1/product/dashboard?limit=500&for=bundle"],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/product/dashboard?page=1&limit=500&searchTerm=`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });

  const productOptions = useMemo(
    () =>
      (resp?.data || [])
        // exclude self — a combo can't bundle itself
        .filter((p) => p._id !== currentProductId)
        .map((p) => ({
          value: p._id,
          label: p.product_name + (p.product_sku ? ` — ${p.product_sku}` : ""),
        })),
    [resp, currentProductId],
  );

  const add = () => setBundleItems([...(bundleItems || []), { ...EMPTY }]);
  const update = (i, k, v) =>
    setBundleItems(
      (bundleItems || []).map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );
  const remove = (i) =>
    setBundleItems((bundleItems || []).filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">Bundle items</p>
          <p className="text-[11px] text-gray-400">
            Each row = one child product + how many ship with this combo.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 text-xs bg-primaryColor text-white rounded-lg hover:bg-blue-500 flex items-center gap-1.5"
        >
          <FaPlus size={10} /> Add item
        </button>
      </div>

      {(!bundleItems || bundleItems.length === 0) && (
        <p className="text-xs text-gray-400 italic">No bundle items yet.</p>
      )}

      <div className="space-y-2">
        {(bundleItems || []).map((r, i) => {
          const selected = productOptions.find((o) => o.value === r.product_id);
          return (
            <div
              key={i}
              className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded border border-gray-200"
            >
              <div className="col-span-8">
                <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                  Product
                </label>
                <Select
                  isLoading={isLoading}
                  options={productOptions}
                  value={selected || null}
                  onChange={(opt) => update(i, "product_id", opt?.value || "")}
                  placeholder="Search product…"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </div>
              <div className="col-span-3">
                <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={r.quantity}
                  onChange={(e) => update(i, "quantity", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
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
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 mt-2">
        💡 Need a product that&apos;s not in the list? Add it first from{" "}
        <strong>Products → Add</strong>, then return here to bundle it.
      </p>
    </div>
  );
};

export default BundleItemsBlock;
