import { useEffect, useState } from "react";
import { FiX, FiCopy, FiPrinter } from "react-icons/fi";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../utils/baseURL";
import PrintLabel from "../common/printLabel/PrintLabel";

// A2 — Variations Modal.
//
// One-stop quick-edit grid for a product's variations. Each cell is inline
// editable; we save on blur via PATCH /variation/:id (whitelisted partial
// update). The full attribute-axis editor still lives in the product update
// page — this modal is for fast operational tweaks (price/stock/active/SKU/
// barcode/weight/badge), not structural changes (axes, attribute_id,
// combination).
//
// Per-row save (not bulk) so a failed row doesn't poison the others.
//
// Barcodes live per variation, and this is the only screen that lists them.
// The product edit page renders "— variation-only —" for a variable product's
// barcode and then offers no way to reach the variations' codes, and the
// existing PrintLabel component was only wired into the order detail page — so
// you could print a label for something already sold, but never for stock
// sitting in the warehouse. Each row now prints its own label.
const EditableCell = ({ value, onSave, type = "text", className = "" }) => {
  const [draft, setDraft] = useState(value ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);
  const commit = async () => {
    const next = type === "number" ? Number(draft) || 0 : draft;
    if (next === value) return;
    setBusy(true);
    try {
      await onSave(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <input
      type={type}
      value={draft}
      disabled={busy}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
      }}
      className={`px-2 py-1 border rounded text-sm w-full ${
        busy ? "bg-gray-100" : ""
      } ${className}`}
    />
  );
};

// SKU and barcode are auto-generated (SKU from the product slug + variation;
// barcode is a unique number stamped at save time). Read-only here so an
// accidental edit can't desync them from printed labels / inventory. Owners
// can still set a custom SKU on the full product edit page if they truly need
// to override it.
const CodeDisplay = ({ value, label }) => {
  const shown = value || "—";
  const copy = () => {
    if (!value) return;
    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success(`${label} copied`, { autoClose: 700 }))
      .catch(() => {});
  };
  return (
    <div className="flex items-center gap-1">
      <span
        className="px-2 py-1 text-xs font-mono bg-gray-50 border rounded w-full truncate"
        title={shown}
      >
        {shown}
      </span>
      <button
        type="button"
        onClick={copy}
        disabled={!value}
        title={`Copy ${label}`}
        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
      >
        <FiCopy size={13} />
      </button>
    </div>
  );
};

const ProductVariationsModal = ({ product, onClose, onSaved }) => {
  // The variation whose sticker label is being printed, in the shape PrintLabel
  // expects. The ids let it lazily render + cache the barcode image, since
  // variations save with only the barcode NUMBER.
  const [labelLine, setLabelLine] = useState(null);

  const { data: detail, refetch } = useQuery({
    queryKey: [`/api/v1/product/dashboard/${product._id}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/dashboard/${product._id}`, {
        credentials: "include",
      });
      return res.json();
    },
  });

  const variations = detail?.data?.variations || [];

  const saveField = async (variation_id, field, value) => {
    try {
      const res = await fetch(`${BASE_URL}/variation/${variation_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data?.statusCode === 200 && data?.success) {
        toast.success("Saved", { autoClose: 700 });
        refetch();
        onSaved?.();
      } else {
        toast.error(data?.message || "Save failed", { autoClose: 1500 });
        refetch();
      }
    } catch {
      toast.error("Network error", { autoClose: 1500 });
    }
  };

  const totalStock = variations.reduce(
    (s, v) => s + (Number(v.variation_quantity) || 0),
    0,
  );
  const activeCount = variations.filter((v) => v.is_active !== false).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              Variations — {product?.product_name}
            </h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {variations.length} variations · {activeCount} active · Total
              stock {totalStock}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          {variations.length === 0 ? (
            <div className="text-sm text-gray-400 italic">
              No variations on this product. Add them via the full product edit
              page.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 w-48">Variation</th>
                    <th className="p-2">Image</th>
                    <th className="p-2 w-24">Price</th>
                    <th className="p-2 w-24">Discount</th>
                    <th className="p-2 w-20">Stock</th>
                    <th className="p-2 w-20">Alert</th>
                    <th className="p-2 w-32">SKU</th>
                    <th className="p-2 w-36">Barcode</th>
                    <th className="p-2 w-24">Weight (g)</th>
                    <th className="p-2 w-32">Badge</th>
                    <th className="p-2 w-16">Active</th>
                    <th className="p-2 w-16">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {variations.map((v) => {
                    const img =
                      v?.variation_images?.[0] || v?.variation_image || "";
                    const low =
                      v?.variation_alert_quantity > 0 &&
                      v?.variation_quantity <= v.variation_alert_quantity;
                    return (
                      <tr
                        key={v._id}
                        className={`border-t ${
                          v.is_active === false ? "bg-gray-50 opacity-70" : ""
                        }`}
                      >
                        <td className="p-2">
                          <EditableCell
                            value={v.variation_name}
                            onSave={(val) =>
                              saveField(v._id, "variation_name", val)
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="w-12 h-12 object-cover rounded mx-auto"
                            />
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-2">
                          <EditableCell
                            value={v.variation_price}
                            type="number"
                            onSave={(val) =>
                              saveField(v._id, "variation_price", val)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <EditableCell
                            value={v.variation_discount_price}
                            type="number"
                            onSave={(val) =>
                              saveField(v._id, "variation_discount_price", val)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <EditableCell
                            value={v.variation_quantity}
                            type="number"
                            className={low ? "border-red-400 bg-red-50" : ""}
                            onSave={(val) =>
                              saveField(v._id, "variation_quantity", val)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <EditableCell
                            value={v.variation_alert_quantity}
                            type="number"
                            onSave={(val) =>
                              saveField(v._id, "variation_alert_quantity", val)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <CodeDisplay value={v.variation_sku} label="SKU" />
                        </td>
                        <td className="p-2">
                          <CodeDisplay
                            value={v.variation_barcode}
                            label="Barcode"
                          />
                        </td>
                        <td className="p-2">
                          <EditableCell
                            value={v.variation_weight_grams}
                            type="number"
                            onSave={(val) =>
                              saveField(v._id, "variation_weight_grams", val)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <EditableCell
                            value={v.variation_badge_text}
                            onSave={(val) =>
                              saveField(v._id, "variation_badge_text", val)
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={v.is_active !== false}
                            onChange={(e) =>
                              saveField(v._id, "is_active", e.target.checked)
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            disabled={!v.variation_barcode}
                            onClick={() =>
                              setLabelLine({
                                product_id: product._id,
                                variation_id: v._id,
                                product_name: product.product_name,
                                variation_name: v.variation_name,
                                product_sku: product.product_sku,
                                variation_sku: v.variation_sku,
                                barcode: product.barcode,
                                barcode_image: product.barcode_image,
                                variation_barcode: v.variation_barcode,
                                variation_barcode_image:
                                  v.variation_barcode_image,
                              })
                            }
                            title={
                              v.variation_barcode
                                ? "Print sticker label"
                                : "No barcode on this variation"
                            }
                            className="p-1.5 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <FiPrinter size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-3">
            Per-cell save on blur or Enter. SKU and barcode are auto-generated
            and read-only — use <FiCopy size={11} className="inline -mt-0.5" />{" "}
            to copy one, or <FiPrinter size={11} className="inline -mt-0.5" />{" "}
            to print that variation&apos;s sticker label. To add/remove
            variations or change attribute axes, use the full product edit page.
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded"
          >
            Done
          </button>
        </div>
      </div>

      {/* Sits above this modal (z-[60] vs z-50) and takes over printing. */}
      {labelLine && (
        <PrintLabel line={labelLine} onClose={() => setLabelLine(null)} />
      )}
    </div>
  );
};

export default ProductVariationsModal;
