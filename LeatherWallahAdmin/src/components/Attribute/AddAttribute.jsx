import { useForm } from "react-hook-form";
import { generateSlug } from "../../utils/generateSlug";
import { RxCross1 } from "react-icons/rx";
import { FaPlus } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useState } from "react";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";

// Phase A — frontend storefront uses strict `/^#([0-9A-F]{3}){1,2}$/i`
// (CSS-valid hex: must start with #, exactly 3 or 6 hex chars). Admin
// validation MUST match — previously this was loose and accepted
// "123456" (no #) which the storefront then silently rejected. 2026-06-02.
const HEX_RE = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
const looksLikeHex = (s) =>
  typeof s === "string" && s.length > 0 && HEX_RE.test(s.trim());

// Phase A display_type choices — must mirror backend enum.
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

// Phase E — optional `onCreated(attribute)` callback. When invoked from inside
// ProductForm via the "+ Create attribute" button, parent uses the returned doc
// to inject the new attribute into selectedAttributes without a refetch race.
// `refetch` stays optional so existing call sites (Attribute page) keep working.
const AddAttribute = ({ setAddAttributeModal, refetch, user, onCreated }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);

  // Phase A — display_type + tracks_weight live in their own state so we can
  // conditionally render the hex / weight inputs per value row.
  const [displayType, setDisplayType] = useState("button");
  const [tracksWeight, setTracksWeight] = useState(false);

  // ✅ unique id added (VERY important)
  const [attributeValues, setAttributeValues] = useState([
    {
      id: crypto.randomUUID(),
      attribute_value_name: "",
      attribute_value_code: "",
      weight_grams_value: "",
    },
  ]);

  // ADD FIELD
  const handleAddAttributeValueField = () => {
    setAttributeValues((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        attribute_value_name: "",
        attribute_value_code: "",
        weight_grams_value: "",
      },
    ]);
  };

  // DELETE SPECIFIC FIELD
  const handleRemoveAttributeValueField = (id) => {
    if (attributeValues.length === 1) return;
    setAttributeValues((prev) => prev.filter((item) => item.id !== id));
  };

  // HANDLE CHANGE
  const handleAttributeValueChange = (id, event) => {
    const { name, value } = event.target;
    setAttributeValues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [name]: value } : item)),
    );
  };

  // SUBMIT
  const handleDataPost = async (data) => {
    // Phase 0.5 V1 — trim attribute_name + every value name; reject if any
    // is empty. Backend also validates but catching here saves the round trip.
    const trimmedName = (data?.attribute_name || "").trim();
    if (!trimmedName) {
      toast.error("Attribute name দিতে হবে।", { autoClose: 3000 });
      return;
    }
    const trimmed = attributeValues.map((item) => ({
      ...item,
      attribute_value_name: (item.attribute_value_name || "").trim(),
    }));
    const emptyIdx = trimmed.findIndex((v) => !v.attribute_value_name);
    if (emptyIdx !== -1) {
      toast.error(
        `Value #${emptyIdx + 1} is empty — প্রতিটা attribute value-এর name দিতে হবে।`,
        { autoClose: 3000 },
      );
      return;
    }

    // Phase A MOD #11 — swatch save guards (2026-06-02 owner feedback):
    //   1. INVALID hex (typed but wrong format like "123456") → block save
    //      with an inline-style toast, since the inline red error under each
    //      bad input already tells the admin which row to fix.
    //   2. MISSING hex (input left blank) → SweetAlert confirm, names listed
    //      inline so admin can decide whether to ship grey circles or go back.
    if (displayType === "swatch") {
      const invalidHex = trimmed.filter(
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
      const missingHex = trimmed.filter(
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
      const sendData = {
        attribute_publisher_id: user?._id,
        attribute_name: trimmedName,
        attribute_slug: generateSlug(trimmedName),
        attribute_status: data?.attribute_status,

        // Phase A additions.
        display_type: displayType,
        tracks_weight: tracksWeight,

        attribute_values: trimmed.map((item) => {
          const out = {
            attribute_value_name: item.attribute_value_name,
            attribute_value_code: item.attribute_value_code,
            attribute_value_slug: generateSlug(item.attribute_value_name),
          };
          // Only send weight_grams_value when tracks_weight is on AND the
          // admin actually typed something. Empty string → omit so backend
          // null-default kicks in cleanly.
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
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });

      const result = await response.json();

      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Attribute created successfully", {
          autoClose: 1000,
        });
        // EM1 — surface the newly-created doc to parent (ProductForm) so it
        // can inject directly. Fallback to refetch if no callback wired.
        if (typeof onCreated === "function" && result?.data) {
          onCreated(result.data);
        } else if (typeof refetch === "function") {
          refetch();
        }
        setAddAttributeModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      toast.error(error?.message, { autoClose: 1000 });
    } finally {
      setLoading(false);
    }
  };

  // Active display_type hint for the chosen option.
  const activeHint =
    DISPLAY_TYPE_OPTIONS.find((o) => o.value === displayType)?.hint || "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:w-[600px] p-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* HEADER */}
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-[26px] font-bold text-gray-800">
            Create Attribute
          </h3>

          <button
            type="button"
            className="p-1 rounded-full hover:bg-gray-100 absolute right-3 top-3"
            onClick={() => setAddAttributeModal(false)}
          >
            <RxCross1 size={20} />
          </button>
        </div>

        <hr className="mt-2 mb-6" />

        <form onSubmit={handleSubmit(handleDataPost)}>
          {/* ATTRIBUTE NAME */}
          <label className="block text-xs font-medium text-gray-700">
            Attribute Name <span className="text-red-600">*</span>
          </label>
          <input
            {...register("attribute_name", {
              required: "Attribute name is required",
            })}
            type="text"
            placeholder="Attribute Name"
            className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
          />
          {errors.attribute_name && (
            <p className="text-red-600">{errors.attribute_name.message}</p>
          )}

          {/* STATUS */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700">
              Attribute Status <span className="text-red-600">*</span>
            </label>
            <select
              {...register("attribute_status", {
                required: "Attribute Status is required",
              })}
              className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
            >
              <option value="active">Active</option>
              <option value="in-active">In-Active</option>
            </select>
          </div>

          {/* Phase A — Display Style */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700">
              Display Style
            </label>
            <select
              value={displayType}
              onChange={(e) => {
                const v = e.target.value;
                setDisplayType(v);
                // Swatch attributes never carry weight — auto-clear so the
                // hidden checkbox's stale `true` state doesn't sneak into save.
                if (v === "swatch" && tracksWeight) setTracksWeight(false);
              }}
              className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
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
          </div>

          {/* Phase A — Weight tracking checkbox. Hidden for swatch (color
              attributes never carry weight). Auto-clears the flag if a previous
              non-swatch selection had it on. 2026-06-02 owner feedback. */}
          {displayType !== "swatch" && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tracksWeight}
                onChange={(e) => setTracksWeight(e.target.checked)}
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

          {/* ADD VALUE BUTTON */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAddAttributeValueField}
              type="button"
              className="border px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
              <FaPlus size={14} />
              Add Value
            </button>
          </div>

          {/* ATTRIBUTE VALUES */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Attributes Values
            </label>

            {attributeValues.map((attribute) => (
              <div
                key={attribute.id}
                className="py-2 flex gap-2 items-center flex-wrap"
              >
                {/* NAME */}
                <input
                  name="attribute_value_name"
                  required
                  type="text"
                  value={attribute.attribute_value_name}
                  onChange={(e) => handleAttributeValueChange(attribute.id, e)}
                  placeholder="Value Name"
                  className="flex-1 min-w-[140px] rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />

                {/* HEX + COLOR — Phase A: only visible for swatch.
                    Inline red error appears under the hex input when admin
                    has typed something but it's not a valid CSS hex. */}
                {displayType === "swatch" &&
                  (() => {
                    const code = attribute.attribute_value_code;
                    const hexInvalid =
                      typeof code === "string" &&
                      code.trim() !== "" &&
                      !looksLikeHex(code);
                    return (
                      <div className="flex gap-2 items-start">
                        <div className="flex flex-col">
                          <input
                            name="attribute_value_code"
                            type="text"
                            value={code}
                            onChange={(e) =>
                              handleAttributeValueChange(attribute.id, e)
                            }
                            placeholder="#RRGGBB"
                            className={`w-28 rounded-md shadow-sm sm:text-sm p-2 border-2 ${
                              hexInvalid
                                ? "border-red-500"
                                : "border-gray-200"
                            }`}
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
                            handleAttributeValueChange(attribute.id, {
                              target: {
                                name: "attribute_value_code",
                                value: e.target.value,
                              },
                            })
                          }
                          className="w-10 h-10 cursor-pointer border rounded shrink-0"
                        />
                      </div>
                    );
                  })()}

                {/* WEIGHT — Phase A: only visible when tracks_weight=true */}
                {tracksWeight && (
                  <div className="flex items-center gap-1">
                    <input
                      name="weight_grams_value"
                      type="number"
                      min="0"
                      step="any"
                      value={attribute.weight_grams_value}
                      onChange={(e) =>
                        handleAttributeValueChange(attribute.id, e)
                      }
                      placeholder="Weight"
                      className="w-24 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                    />
                    <span className="text-xs text-gray-500">g</span>
                  </div>
                )}

                {/* DELETE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleRemoveAttributeValueField(attribute.id)}
                  disabled={attributeValues.length === 1}
                  className="p-2 rounded border hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RiDeleteBin6Line size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-6 mt-6 justify-end">
            <button
              type="button"
              className="px-10 py-2 border rounded hover:bg-gray-100"
              onClick={() => setAddAttributeModal(false)}
            >
              Cancel
            </button>

            {loading ? (
              <div className="px-10 py-2 flex items-center justify-center bg-primaryColor text-white rounded">
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2 bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                type="submit"
              >
                Create
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAttribute;
