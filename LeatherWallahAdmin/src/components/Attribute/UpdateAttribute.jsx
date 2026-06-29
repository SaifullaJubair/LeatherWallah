import { useForm } from "react-hook-form";
import { generateSlug } from "../../utils/generateSlug";
import { RxCross1 } from "react-icons/rx";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";

// Phase A — strict CSS-valid hex (matches storefront isHexColor). Loose
// match was accepting "123456" which storefront silently rejected. 2026-06-02.
const HEX_RE = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
const looksLikeHex = (s) =>
  typeof s === "string" && s.length > 0 && HEX_RE.test(s.trim());

const DISPLAY_TYPE_OPTIONS = [
  {
    value: "button",
    label: "Button — pill chips (text)",
    hint: "Default for Size, Material, etc. Most attributes use this.",
  },
  {
    value: "swatch",
    label: "Swatch — color circles (needs hex)",
    hint: "For Color attribute. Each value needs a hex code (#RRGGBB).",
  },
  {
    value: "dropdown",
    label: "Dropdown — searchable select (long lists)",
    hint: "Best for Storage / Capacity / Length with many values.",
  },
];

const UpdateAttribute = ({
  setOpenAttributeUpdateModal,
  attributeUpdateValue,
  refetch,
  user,
  // Optional override — caller can show a context-aware heading (e.g. when
  // embedded inside the Add Product form, this is "Add / Update Values: Size"
  // rather than the generic "Update Attribute" used on /attribute page).
  title,
}) => {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);

  // Phase A — prefill display_type + tracks_weight from the existing doc.
  // Default to "button" + false so a legacy doc that never had these fields
  // doesn't end up with undefined controlled-input warnings.
  const [displayType, setDisplayType] = useState(
    attributeUpdateValue?.display_type || "button",
  );
  const [tracksWeight, setTracksWeight] = useState(
    !!attributeUpdateValue?.tracks_weight,
  );

  // Phase A MOD #8 — fetch count of products using this attribute so we can
  // warn before owner saves a structural change. Defaults to null until the
  // fetch completes so the warning doesn't flash falsely on mount.
  const [usageCount, setUsageCount] = useState(null);
  useEffect(() => {
    const id = attributeUpdateValue?._id;
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/attribute/usage/${id}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!cancelled && json?.success) {
          setUsageCount(json?.data?.count ?? 0);
        }
      } catch {
        /* non-fatal — just suppresses the warning */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attributeUpdateValue?._id]);

  // SINGLE STATE FOR OLD + NEW VALUES — Phase A adds weight_grams_value.
  const [attributeValues, setAttributeValues] = useState(
    attributeUpdateValue?.attribute_values?.map((item) => ({
      id: item._id || crypto.randomUUID(),
      _id: item._id, // backend id
      attribute_value_name: item.attribute_value_name || "",
      attribute_value_code: item.attribute_value_code || "",
      attribute_value_status: item.attribute_value_status || "active",
      weight_grams_value:
        item.weight_grams_value === 0 || item.weight_grams_value
          ? String(item.weight_grams_value)
          : "",
    })) || [],
  );

  // ADD NEW VALUE
  const handleAddField = () => {
    setAttributeValues((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        attribute_value_name: "",
        attribute_value_code: "",
        attribute_value_status: "active",
        weight_grams_value: "",
      },
    ]);
  };

  // DELETE VALUE
  const handleDeleteField = (id) => {
    if (attributeValues.length === 1) return;
    setAttributeValues((prev) => prev.filter((item) => item.id !== id));
  };

  // EDIT VALUE
  const handleChange = (id, name, value) => {
    setAttributeValues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [name]: value } : item)),
    );
  };

  // TOGGLE ACTIVE / INACTIVE
  const handleToggleStatus = (id) => {
    setAttributeValues((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              attribute_value_status:
                item.attribute_value_status === "active"
                  ? "in-active"
                  : "active",
            }
          : item,
      ),
    );
  };

  // SUBMIT
  const handleDataPost = async (data) => {
    // Phase 0.5 V1 — trim every value and surface what's getting dropped so
    // the admin doesn't silently lose a row they thought they typed.
    const trimmed = attributeValues.map((item) => ({
      ...item,
      attribute_value_name: (item.attribute_value_name || "").trim(),
    }));
    const kept = trimmed.filter((v) => v.attribute_value_name !== "");
    if (kept.length === 0) {
      toast.error("কমপক্ষে একটা attribute value-এর name দিতে হবে।", {
        autoClose: 3000,
      });
      return;
    }
    const dropped = trimmed.length - kept.length;
    if (dropped > 0) {
      toast.warn(`${dropped} টা empty row বাদ দেওয়া হয়েছে।`, {
        autoClose: 2500,
      });
    }

    // Phase A MOD #11 — swatch save guards (2026-06-02 owner feedback):
    // INVALID hex blocks save (inline red error already shown under input);
    // MISSING hex shows SweetAlert confirm with named list.
    if (displayType === "swatch") {
      const invalidHex = kept.filter(
        (v) =>
          v.attribute_value_code &&
          v.attribute_value_code.trim() !== "" &&
          !looksLikeHex(v.attribute_value_code),
      );
      if (invalidHex.length > 0) {
        toast.error(
          `Fix the invalid color code${invalidHex.length > 1 ? "s" : ""} before saving (must be #RRGGBB or #RGB).`,
          { autoClose: 3500 },
        );
        return;
      }
      const missingHex = kept.filter(
        (v) => !v.attribute_value_code || v.attribute_value_code.trim() === "",
      );
      if (missingHex.length > 0) {
        const names = missingHex
          .map((v) => `<strong>${v.attribute_value_name}</strong>`)
          .join(", ");
        const confirm = await Swal.fire({
          title: `${missingHex.length} value${missingHex.length > 1 ? "s" : ""} missing a color code`,
          html: `
            <p>These values have no color code — they will render as grey circles on the storefront:</p>
            <p style="margin-top:10px;font-size:15px;">${names}</p>
            <p style="margin-top:14px;">Save anyway, or go back and add the codes?</p>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Save anyway",
          cancelButtonText: "Go back",
        });
        if (!confirm.isConfirmed) return;
      }
    }

    setLoading(true);

    try {
      // Phase 0.5 V1 — trim attribute_name; fall back to existing value if
      // admin didn't touch the input. Empty after trim is rejected.
      const rawName =
        data?.attribute_name ?? attributeUpdateValue?.attribute_name ?? "";
      const trimmedName = String(rawName).trim();
      if (!trimmedName) {
        toast.error("Attribute name দিতে হবে।", { autoClose: 3000 });
        setLoading(false);
        return;
      }

      const sendData = {
        _id: attributeUpdateValue?._id,
        attribute_updated_by: user?._id,

        attribute_name: trimmedName,
        attribute_slug: generateSlug(trimmedName),

        attribute_status:
          data?.attribute_status || attributeUpdateValue?.attribute_status,

        // Phase A additions.
        display_type: displayType,
        tracks_weight: tracksWeight,

        attribute_values: kept.map((item) => {
          const out = {
            _id: item._id,
            attribute_value_name: item.attribute_value_name,
            attribute_value_code: item.attribute_value_code,
            attribute_value_slug: generateSlug(item.attribute_value_name),
            attribute_value_status: item.attribute_value_status,
          };
          // Only emit weight_grams_value when tracks_weight is on AND admin
          // typed something. Empty → omit (backend defaults null).
          if (
            tracksWeight &&
            item.weight_grams_value !== "" &&
            item.weight_grams_value !== undefined
          ) {
            out.weight_grams_value = Number(item.weight_grams_value);
          }
          return out;
        }),
      };

      const response = await fetch(`${BASE_URL}/attribute`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });

      const result = await response.json();

      if (result?.success) {
        toast.success(result?.message || "Updated successfully");
        refetch();
        setOpenAttributeUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeHint =
    DISPLAY_TYPE_OPTIONS.find((o) => o.value === displayType)?.hint || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[550px] lg:w-[720px] rounded-lg shadow-xl p-6 max-h-[95vh] overflow-y-auto relative">
        {/* HEADER */}
        <h3 className="text-2xl font-bold mb-4">
          {title || "Update Attribute"}
        </h3>
        <button
          className="absolute right-3 top-3"
          onClick={() => setOpenAttributeUpdateModal(false)}
        >
          <RxCross1 size={20} />
        </button>

        {/* Phase A MOD #8 — usage warning. Renders only when count > 0. */}
        {usageCount !== null && usageCount > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded text-sm text-amber-900">
            ⚠️ এই attribute <strong>{usageCount}</strong> টা product-এ
            ব্যবহার হচ্ছে। display style / weight tracking change করলে ওই
            products-এর PDP rendering ও variation matrix-এ effect পড়তে পারে।
          </div>
        )}

        <form onSubmit={handleSubmit(handleDataPost)}>
          {/* NAME */}
          <label className="text-xs font-medium">Attribute Name</label>
          <input
            {...register("attribute_name")}
            defaultValue={attributeUpdateValue?.attribute_name}
            className="w-full border-2 p-2 rounded mt-1"
          />

          {/* STATUS */}
          <label className="text-xs font-medium mt-3 block">
            Attribute Status
          </label>
          <select
            {...register("attribute_status")}
            defaultValue={attributeUpdateValue?.attribute_status}
            className="w-full border-2 p-2 rounded mt-1"
          >
            <option value="active">Active</option>
            <option value="in-active">In-Active</option>
          </select>

          {/* Phase A — Display Style */}
          <label className="text-xs font-medium mt-3 block">
            Display Style
          </label>
          <select
            value={displayType}
            onChange={(e) => {
              const v = e.target.value;
              setDisplayType(v);
              if (v === "swatch" && tracksWeight) setTracksWeight(false);
            }}
            className="w-full border-2 p-2 rounded mt-1"
          >
            {DISPLAY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {activeHint && (
            <p className="mt-1 text-[11px] text-gray-500">{activeHint}</p>
          )}

          {/* Phase A — Weight tracking checkbox. Hidden for swatch
              (color attributes never carry weight). 2026-06-02. */}
          {displayType !== "swatch" && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tracksWeight}
                onChange={(e) => {
                  // Phase E audit Fix #2 — confirm before unchecking when
                  // existing values have saved weights, since save will drop
                  // every weight_grams_value from this attribute.
                  if (!e.target.checked && tracksWeight) {
                    const hasSavedWeights = (
                      attributeUpdateValue?.attribute_values || []
                    ).some(
                      (v) =>
                        typeof v?.weight_grams_value === "number" &&
                        v.weight_grams_value > 0,
                    );
                    if (hasSavedWeights) {
                      const ok = window.confirm(
                        "Tracks weight uncheck করলে এই attribute-এর সব value-এর saved gram value clear হয়ে যাবে। আপনি কি sure?",
                      );
                      if (!ok) return;
                    }
                  }
                  setTracksWeight(e.target.checked);
                }}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">
                  Enable weight tracking for variations
                </div>
                <div className="text-[11px] text-gray-700 mt-0.5">
                  ভ্যারিয়েশনের জন্য ওজন ট্র্যাকিং চালু করুন
                </div>
                {/* MOD #12 — hint */}
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Weight tracking auto-fills the variation matrix only when
                  this attribute is used as a variation axis on a product.
                  For spec-only attributes, weight values are informational.
                </p>
              </div>
            </label>
          </div>
          )}

          {/* VALUES header */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleAddField}
              className="flex items-center gap-2 border px-3 py-2 rounded hover:bg-blue-50"
            >
              <FaPlus size={14} /> Add Value
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {attributeValues.map((item) => (
              <div
                key={item.id}
                className="flex gap-2 items-center flex-wrap"
              >
                {/* NAME */}
                <input
                  value={item.attribute_value_name}
                  onChange={(e) =>
                    handleChange(
                      item.id,
                      "attribute_value_name",
                      e.target.value,
                    )
                  }
                  placeholder="Value Name"
                  className="flex-1 min-w-[160px] border-2 p-2 rounded"
                />

                {/* HEX + COLOR — Phase A: only for swatch. Inline red error
                    under the hex input when admin typed something invalid. */}
                {displayType === "swatch" &&
                  (() => {
                    const code = item.attribute_value_code;
                    const hexInvalid =
                      typeof code === "string" &&
                      code.trim() !== "" &&
                      !looksLikeHex(code);
                    return (
                      <div className="flex gap-2 items-start">
                        <div className="flex flex-col">
                          <input
                            value={code}
                            onChange={(e) =>
                              handleChange(
                                item.id,
                                "attribute_value_code",
                                e.target.value,
                              )
                            }
                            className={`w-32 p-2 rounded border-2 ${
                              hexInvalid
                                ? "border-red-500"
                                : "border-gray-200"
                            }`}
                            placeholder="#RRGGBB"
                            aria-invalid={hexInvalid}
                          />
                          {hexInvalid && (
                            <span className="text-[11px] text-red-600 mt-0.5">
                              Invalid — must be #RRGGBB or #RGB
                            </span>
                          )}
                        </div>
                        <input
                          type="color"
                          value={
                            looksLikeHex(code) ? code : "#ffffff"
                          }
                          onChange={(e) =>
                            handleChange(
                              item.id,
                              "attribute_value_code",
                              e.target.value,
                            )
                          }
                          className="w-10 h-10 cursor-pointer shrink-0"
                        />
                      </div>
                    );
                  })()}

                {/* WEIGHT — Phase A: only when tracks_weight */}
                {tracksWeight && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.weight_grams_value}
                      onChange={(e) =>
                        handleChange(
                          item.id,
                          "weight_grams_value",
                          e.target.value,
                        )
                      }
                      placeholder="Weight"
                      className="w-24 border-2 p-2 rounded"
                    />
                    <span className="text-xs text-gray-500">g</span>
                  </div>
                )}

                {/* TOGGLE STATUS */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item.id)}
                  className={`px-2 text-nowrap text-sm py-1 capitalize rounded font-semibold ${
                    item.attribute_value_status === "active"
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {item.attribute_value_status}
                </button>

                {/* DELETE */}
                <button
                  type="button"
                  onClick={() => handleDeleteField(item.id)}
                  disabled={attributeValues.length === 1}
                  className="p-2 border rounded hover:bg-red-50 disabled:opacity-40"
                >
                  <RiDeleteBin6Line />
                </button>
              </div>
            ))}
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setOpenAttributeUpdateModal(false)}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            {loading ? (
              <MiniSpinner />
            ) : (
              <button className="bg-primaryColor text-white px-6 py-2 rounded">
                Update
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateAttribute;
