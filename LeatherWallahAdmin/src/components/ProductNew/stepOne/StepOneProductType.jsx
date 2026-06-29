/**
 * StepOneProductType — Phase F (A2c) product-type machinery + custom_fields.
 *
 * Owned state (all lifted from StepOne so handleDataPost can include them):
 *   - product_type: "simple" | "variable" | "digital" | "combo" | "preorder" | "subscription"
 *   - download_url, license_key      (digital)
 *   - bundle_items [{ product_id, quantity }]  (combo)
 *   - available_from                  (preorder, ISO string)
 *   - billing_interval                (subscription, monthly|yearly)
 *   - custom_fields [{ label, value, icon_key? }]
 *
 * Collapsible like StepOneAdvanced so it doesn't crowd the form for simple shops.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import { FaPlus, FaTrash, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { BASE_URL } from "../../../utils/baseURL";

const TYPE_OPTIONS = [
  { value: "simple", label: "Simple (default)" },
  { value: "variable", label: "Variable (uses variations matrix)" },
  { value: "digital", label: "Digital (download/license)" },
  { value: "combo", label: "Combo / Bundle" },
  { value: "preorder", label: "Pre-order" },
  { value: "subscription", label: "Subscription" },
];

const BILLING_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const EMPTY_BUNDLE = { product_id: "", quantity: 1 };
const EMPTY_CUSTOM = { label: "", value: "", icon_key: "" };

const toLocalDatetime = (isoOrDate) => {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const StepOneProductType = ({
  productType,
  setProductType,
  downloadUrl,
  setDownloadUrl,
  licenseKey,
  setLicenseKey,
  bundleItems,
  setBundleItems,
  availableFrom,
  setAvailableFrom,
  billingInterval,
  setBillingInterval,
  customFields,
  setCustomFields,
}) => {
  const [open, setOpen] = useState(false);

  // Auto-open if anything beyond the default is set.
  useEffect(() => {
    const has =
      (productType && productType !== "simple") ||
      downloadUrl ||
      licenseKey ||
      (Array.isArray(bundleItems) && bundleItems.length) ||
      availableFrom ||
      billingInterval ||
      (Array.isArray(customFields) && customFields.length);
    if (has) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Product list (only fetched once the section is open, only used for combo).
  const { data: productsResp = {}, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/v1/product/dashboard?limit=500&searchTerm="],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/product/dashboard?page=1&limit=500&searchTerm=`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
    enabled: open && productType === "combo",
  });

  const productOptions = useMemo(
    () =>
      (productsResp?.data || []).map((p) => ({
        value: p._id,
        label: p.product_name + (p.product_sku ? ` — ${p.product_sku}` : ""),
      })),
    [productsResp],
  );

  // ── bundle helpers ────────────────────────────────────────────────────
  const addBundle = () =>
    setBundleItems([...(bundleItems || []), { ...EMPTY_BUNDLE }]);
  const updateBundle = (i, k, v) =>
    setBundleItems(
      (bundleItems || []).map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );
  const removeBundle = (i) =>
    setBundleItems((bundleItems || []).filter((_, idx) => idx !== i));

  // ── custom_fields helpers ────────────────────────────────────────────
  const addCustom = () =>
    setCustomFields([...(customFields || []), { ...EMPTY_CUSTOM }]);
  const updateCustom = (i, k, v) =>
    setCustomFields(
      (customFields || []).map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );
  const removeCustom = (i) =>
    setCustomFields((customFields || []).filter((_, idx) => idx !== i));

  const isDigital = productType === "digital";
  const isCombo = productType === "combo";
  const isPreorder = productType === "preorder";
  const isSubscription = productType === "subscription";

  return (
    <section className="shadow-md bg-gray-50 rounded-lg p-4 sm:p-6 md:p-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-textColor">
          Product Type & Custom Fields
        </h1>
        <span className="text-gray-500">
          {open ? <FaChevronDown size={18} /> : <FaChevronRight size={18} />}
        </span>
      </button>
      <p className="text-xs text-gray-500 mt-1">
        Optional. Phase F advanced — default <code>simple</code> covers most shops.
      </p>

      {open && (
        <div className="mt-6 space-y-8">
          {/* ── Product type ─────────────────────────────────────── */}
          <div>
            <label className="font-medium text-sm">Product type</label>
            <select
              value={productType || "simple"}
              onChange={(e) => setProductType(e.target.value)}
              className="block w-full md:max-w-md p-2.5 mt-2 bg-white border border-gray-300 rounded-lg"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Drives storefront + checkout behaviour. <code>variable</code> uses the
              variation matrix below; the rest expose extra fields here.
            </p>
          </div>

          {/* ── Digital ──────────────────────────────────────────── */}
          {isDigital && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <h2 className="md:col-span-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Digital
              </h2>
              <div>
                <label className="font-medium text-sm">Download URL</label>
                <input
                  type="url"
                  value={downloadUrl || ""}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://files.example.com/asset.zip"
                  className="block w-full p-2.5 mt-2 bg-white border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-medium text-sm">License key</label>
                <input
                  type="text"
                  value={licenseKey || ""}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="(optional)"
                  className="block w-full p-2.5 mt-2 bg-white border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* ── Combo / Bundle ───────────────────────────────────── */}
          {isCombo && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Bundle items
                </h2>
                <button
                  type="button"
                  onClick={addBundle}
                  className="px-3 py-1.5 text-xs bg-primaryColor text-white rounded-lg hover:bg-blue-500 flex items-center gap-1.5"
                >
                  <FaPlus size={10} /> Add item
                </button>
              </div>

              {(!bundleItems || bundleItems.length === 0) && (
                <p className="text-xs text-gray-400 italic">
                  No bundle items yet.
                </p>
              )}

              <div className="space-y-2">
                {(bundleItems || []).map((r, i) => {
                  const selected = productOptions.find(
                    (o) => o.value === r.product_id,
                  );
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
                          isLoading={productsLoading}
                          options={productOptions}
                          value={selected || null}
                          onChange={(opt) =>
                            updateBundle(i, "product_id", opt?.value || "")
                          }
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
                          onChange={(e) =>
                            updateBundle(i, "quantity", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeBundle(i)}
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
                Each bundle item is one child product + how many of it the combo
                ships. Storefront/checkout treatment is BE-deferred — fields ready
                for the next phase.
              </p>
            </div>
          )}

          {/* ── Pre-order ────────────────────────────────────────── */}
          {isPreorder && (
            <div className="border-t pt-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Pre-order
              </h2>
              <div className="md:max-w-md">
                <label className="font-medium text-sm">Available from</label>
                <input
                  type="datetime-local"
                  value={toLocalDatetime(availableFrom)}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="block w-full p-2.5 mt-2 bg-white border border-gray-300 rounded-lg"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Earliest date orders ship — storefront can show countdown.
                </p>
              </div>
            </div>
          )}

          {/* ── Subscription ─────────────────────────────────────── */}
          {isSubscription && (
            <div className="border-t pt-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Subscription
              </h2>
              <div className="md:max-w-md">
                <label className="font-medium text-sm">Billing interval</label>
                <select
                  value={billingInterval || ""}
                  onChange={(e) => setBillingInterval(e.target.value)}
                  className="block w-full p-2.5 mt-2 bg-white border border-gray-300 rounded-lg"
                >
                  <option value="">(pick one)</option>
                  {BILLING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Custom fields ────────────────────────────────────── */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Custom spec rows
                </h2>
                <p className="text-[11px] text-gray-400">
                  Free-form rows shown on PDP beyond the attribute spec table.
                </p>
              </div>
              <button
                type="button"
                onClick={addCustom}
                className="px-3 py-1.5 text-xs bg-primaryColor text-white rounded-lg hover:bg-blue-500 flex items-center gap-1.5"
              >
                <FaPlus size={10} /> Add row
              </button>
            </div>

            {(!customFields || customFields.length === 0) && (
              <p className="text-xs text-gray-400 italic">
                No custom rows yet.
              </p>
            )}

            <div className="space-y-2">
              {(customFields || []).map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded border border-gray-200"
                >
                  <div className="col-span-4">
                    <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                      Label
                    </label>
                    <input
                      type="text"
                      value={r.label}
                      onChange={(e) => updateCustom(i, "label", e.target.value)}
                      placeholder="e.g. Origin"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                      Value
                    </label>
                    <input
                      type="text"
                      value={r.value}
                      onChange={(e) => updateCustom(i, "value", e.target.value)}
                      placeholder="e.g. Rajshahi"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-medium text-gray-600 mb-1 block">
                      Icon key
                    </label>
                    <input
                      type="text"
                      value={r.icon_key || ""}
                      onChange={(e) =>
                        updateCustom(i, "icon_key", e.target.value)
                      }
                      placeholder="lu:MapPin"
                      className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeCustom(i)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Remove"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              <code>icon_key</code> is optional — uses the curated IconPicker
              registry (same as PDP icons). Empty = no icon.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default StepOneProductType;
