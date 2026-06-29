import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { FiPlus } from "react-icons/fi";
import StepOneVariationTable from "./StepOneVariationTable";
import { BASE_URL } from "../../../utils/baseURL";
import { LoaderOverlay } from "../../common/loader/LoderOverley";
import { generateSlug } from "../../../utils/generateSlug";
import ToggleSwitch from "../sections/ToggleSwitch";
import UpdateAttribute from "../../Attribute/UpdateAttribute";
import AddAttribute from "../../Attribute/AddAttribute";
import { AuthContext } from "../../../context/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import SortableValueChips from "./SortableValueChips";

// Phase 2 unified attribute block.
//
// Strict structure inside, tick-and-fill outside:
// 1. Admin picks attributes from a multi-select (no typing — values come from
//    the `attributes` collection).
// 2. For each picked attribute, admin ticks which values apply. Inline "+ Add"
//    PATCHes the attribute on the backend so a new value can be created without
//    leaving the form.
// 3. A per-attribute "Variation axis?" toggle decides which attributes also
//    drive variation combinations (others are spec-only — filter+PDP table only).
//
// Emits THREE shapes on dataToSubmit (single object) so the parent StepOne can
// hand them straight to the backend:
//   - product_attributes[] {attribute_id, value_ids[]}      (Phase-1 model)
//   - variant_axes[]      {attribute_id, is_mandatory:true} (Phase-1 model)
//   - attributes_details[] {attribute_name, attribute_values[]} (legacy snapshot)
//
// The variation combination matrix at the bottom is auto-generated from the
// variant_axes only — spec-only attributes do NOT multiply combinations.

const StepOneVariation = ({
  inputValueData,
  setFormData,
  selectedAttributes,
  setSelectedAttributes,
  selectedAttributeValues,
  setSelectedAttributeValues,
  dataToSubmit,
  setDataToSubmit,
  // Media pool from the parent ProductForm (passed straight through to
  // StepOneVariationTable so each row's "Choose image" modal can reference
  // the product's main_image + other_images without re-uploading).
  mainImage,
  otherImages,
  // Axis toggle map — LIFTED to ProductForm so update-mode can rehydrate from
  // initialData.variant_axes before this component mounts. Falls back to a
  // local state when parent doesn't provide it (add-mode default behaviour).
  axisById: axisByIdProp,
  setAxisById: setAxisByIdProp,
  // Optional JSX slot rendered AFTER the attribute block but BEFORE the matrix
  // — ProductForm uses this to inject the "Variation base price / discount /
  // buying" trio in the visual flow attribute → values → axis → base → matrix.
  basePriceSlot = null,
  // Used by matrix table to seed new rows AND live-propagate to existing rows
  // when the admin edits the product-level base field.
  baseBuyingPrice = "",
  baseDiscountPrice = "",
  // Update-mode rehydration: { attribute_id: boolean } map of saved
  // show_in_filter values. Applied ONCE when present so the toggles reflect
  // what's in the DB.
  initialShowInFilterById = null,
  // Phase 0.5 follow-up — notify parent (ProductForm) when any picked
  // attribute is inactive. Mirrors the inactive cat/brand pattern so the
  // sticky Publish button can disable for the same reason.
  onInactiveAttributeChange = null,
}) => {
  // Lifted-or-local pattern: if parent passes the pair, use them; else manage
  // ourselves (legacy / standalone usage).
  const [axisByIdLocal, setAxisByIdLocal] = useState({});
  const axisById = axisByIdProp ?? axisByIdLocal;
  const setAxisById = setAxisByIdProp ?? setAxisByIdLocal;

  // Batch 2 E6 — per-attribute "Show in filter sidebar?" override. Keyed by
  // attribute_id. Default true (every attribute is filterable unless owner
  // explicitly turns it off). Stored in dataToSubmit.product_attributes[].
  const [showInFilterById, setShowInFilterById] = useState({});
  const showInFilterHydratedRef = useRef(false);
  useEffect(() => {
    if (showInFilterHydratedRef.current) return;
    if (initialShowInFilterById && Object.keys(initialShowInFilterById).length > 0) {
      setShowInFilterById(initialShowInFilterById);
      showInFilterHydratedRef.current = true;
    }
  }, [initialShowInFilterById]);
  const toggleShowInFilter = (attributeId) => {
    setShowInFilterById((prev) => ({
      ...prev,
      [attributeId]: prev[attributeId] === false ? true : false,
    }));
  };

  // Inline "+ Add value" — opens the FULL UpdateAttribute modal so the admin
  // gets all-in-one: add new values, edit existing names / hex codes, toggle
  // status, delete unused ones. (Previously a separate mini-modal existed for
  // quick-add; consolidated since the full editor covers everything.)
  const [editAttrFor, setEditAttrFor] = useState(null);
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  // Phase E — "+ Create attribute" modal (reuses AddAttribute). On success the
  // EM1 callback hands us the created doc; we inject it directly into
  // selectedAttributes (with axis=on, like a normal pick) so the admin can
  // immediately tick values without waiting for a refetch.
  const [showCreateAttrModal, setShowCreateAttrModal] = useState(false);
  const handleAttributeCreated = (newAttr) => {
    if (!newAttr?._id) return;
    // Refresh the attribute pool too (so the multi-select option list updates).
    queryClient.invalidateQueries({ queryKey: ["/api/v1/attribute"] });
    if (selectedAttributes?.some((a) => a?._id === newAttr._id)) return;
    setSelectedAttributes([...(selectedAttributes || []), newAttr]);
    setSelectedAttributeValues([...(selectedAttributeValues || []), []]);
    setAxisById((prev) => ({ ...prev, [newAttr._id]: true }));
    toast.success(`"${newAttr.attribute_name}" added — pick values to continue.`, {
      autoClose: 2000,
    });
  };

  // Phase E — per-attribute inline "+ Add value" mini-form state. Keyed by
  // attribute_id so multiple rows can each have their own open-state.
  const [addValueOpenId, setAddValueOpenId] = useState(null);
  const [addValueName, setAddValueName] = useState("");
  const [addValueHex, setAddValueHex] = useState("");
  const [addValueWeight, setAddValueWeight] = useState("");
  const [addValueSaving, setAddValueSaving] = useState(false);

  const closeAddValueInline = () => {
    setAddValueOpenId(null);
    setAddValueName("");
    setAddValueHex("");
    setAddValueWeight("");
  };

  // EM4 + EM8 — fetch fresh attribute, dedupe-check name, PATCH combined list.
  const submitAddValueInline = async (attr) => {
    const trimmedName = addValueName.trim();
    if (!trimmedName) {
      toast.error("Value name দিতে হবে।", { autoClose: 1500 });
      return;
    }
    // EM8: client-side duplicate check against the attribute we already have.
    const lower = trimmedName.toLocaleLowerCase();
    const localDuplicate = (attr?.attribute_values || []).some(
      (v) =>
        (v?.attribute_value_name || "").trim().toLocaleLowerCase() === lower,
    );
    if (localDuplicate) {
      toast.error(`"${trimmedName}" এই attribute-এ already আছে।`, {
        autoClose: 2000,
      });
      return;
    }
    setAddValueSaving(true);
    try {
      // EM4: refetch the live attribute so we don't overwrite parallel edits.
      const liveRes = await fetch(`${BASE_URL}/attribute`, {
        credentials: "include",
      });
      const liveJson = await liveRes.json();
      const live = (liveJson?.data || []).find((a) => a?._id === attr._id);
      if (!live) {
        toast.error("Attribute আর available নেই।", { autoClose: 2000 });
        setAddValueSaving(false);
        return;
      }
      // Recheck duplicate against the FRESH list (covers race with other admin).
      const serverDuplicate = (live.attribute_values || []).some(
        (v) =>
          (v?.attribute_value_name || "").trim().toLocaleLowerCase() === lower,
      );
      if (serverDuplicate) {
        toast.error(`"${trimmedName}" এই attribute-এ already আছে।`, {
          autoClose: 2000,
        });
        setAddValueSaving(false);
        return;
      }

      const newValue = {
        attribute_value_name: trimmedName,
        attribute_value_slug: generateSlug(trimmedName),
        attribute_value_code: addValueHex.trim() || "",
        attribute_value_status: "active",
      };
      if (attr?.tracks_weight && addValueWeight !== "") {
        newValue.weight_grams_value = Number(addValueWeight);
      }
      const combined = [...(live.attribute_values || []), newValue];

      const payload = {
        _id: attr._id,
        attribute_name: live.attribute_name,
        attribute_slug: live.attribute_slug,
        attribute_status: live.attribute_status,
        display_type: live.display_type,
        tracks_weight: live.tracks_weight,
        attribute_updated_by: user?._id,
        attribute_values: combined,
      };
      const res = await fetch(`${BASE_URL}/attribute`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result?.statusCode !== 200 || !result?.success) {
        toast.error(result?.message || "Add value failed", { autoClose: 2000 });
        setAddValueSaving(false);
        return;
      }
      toast.success(`Value "${trimmedName}" added.`, { autoClose: 1500 });
      // Refresh attribute pool; React Query will re-render the select+rows
      // with the new value visible.
      await queryClient.invalidateQueries({ queryKey: ["/api/v1/attribute"] });
      const refreshed = await refetch();
      const updatedPool = refreshed?.data?.data || [];
      const updatedAttr = updatedPool.find((a) => a?._id === attr._id);
      if (updatedAttr) {
        // Refresh local selectedAttribute entry (so the value tick list shows
        // the new value as a pick option) and auto-check the new value.
        const idx = selectedAttributes.findIndex((a) => a?._id === attr._id);
        if (idx >= 0) {
          const nextAttrs = [...selectedAttributes];
          nextAttrs[idx] = updatedAttr;
          setSelectedAttributes(nextAttrs);
          const addedValue = (updatedAttr.attribute_values || []).find(
            (v) =>
              (v?.attribute_value_name || "").trim().toLocaleLowerCase() ===
              lower,
          );
          if (addedValue) {
            const nextValues = [...selectedAttributeValues];
            nextValues[idx] = [...(nextValues[idx] || []), addedValue];
            setSelectedAttributeValues(nextValues);
          }
        }
      }
      closeAddValueInline();
    } catch (e) {
      toast.error(e?.message || "Network error", { autoClose: 2000 });
    } finally {
      setAddValueSaving(false);
    }
  };

  const { data: attributesRes = {}, isLoading, refetch } = useQuery({
    queryKey: ["/api/v1/attribute"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/attribute`, { credentials: "include" });
      return res.json();
    },
  });

  const attributes = attributesRes?.data ?? [];

  // attribute multi-select change — preserve already-ticked values when an
  // attribute is re-picked. NEW attributes default to axis=ON because the
  // user already chose product_type=variable, so they almost always want the
  // matrix. Admin can still toggle OFF for spec-only attributes.
  const handleAttributeChange = (selectedOptions) => {
    const next = selectedOptions || [];
    const previousIds = new Set((selectedAttributes || []).map((a) => a?._id));
    const nextValues = next.map((attr) => {
      const existing = selectedAttributes?.findIndex(
        (a) => a?._id === attr?._id,
      );
      return existing >= 0 ? selectedAttributeValues[existing] : [];
    });
    setSelectedAttributes(next);
    setSelectedAttributeValues(nextValues);
    // Auto-enable axis for any newly-added attribute.
    setAxisById((prev) => {
      const updated = { ...prev };
      next.forEach((attr) => {
        if (!previousIds.has(attr?._id) && updated[attr?._id] === undefined) {
          updated[attr?._id] = true;
        }
      });
      return updated;
    });
    // Phase 0.5 follow-up — toast when an inactive attribute was just added.
    next.forEach((attr) => {
      if (
        !previousIds.has(attr?._id) &&
        attr?.attribute_status === "in-active"
      ) {
        toast.warn(
          `Attribute "${attr.attribute_name}" inactive — Publish disabled, only Save as Draft কাজ করবে।`,
          { autoClose: 4000 },
        );
      }
    });
  };

  const handleValueChange = (index, selectedOptions) => {
    const next = [...selectedAttributeValues];
    next[index] = selectedOptions || [];
    setSelectedAttributeValues(next);
  };

  const toggleAxis = async (attributeId) => {
    const currentlyOn = !!axisById[attributeId];
    // Warn before turning OFF if a matrix already exists — turning off this
    // axis will collapse the row set and any data on rows that no longer
    // match will be lost. (Existing variation row data IS preserved by the
    // matching-key reuse logic; admin still deserves a heads-up.)
    if (currentlyOn && (inputValueData || []).length > 1) {
      const onCount = Object.values(axisById).filter(Boolean).length;
      if (onCount > 1) {
        const confirm = await Swal.fire({
          title: "Turn this off?",
          html:
            "This will <strong>remove</strong> some rows from the variation table.<br/>" +
            "Any data in the removed rows will be <strong>lost</strong>.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, turn off",
          cancelButtonText: "No, keep on",
        });
        if (!confirm.isConfirmed) return;
      }
    }
    // IMPORTANT: only flip axisById. selectedAttributeValues stays intact so
    // the attribute remains a spec-only entry (still saved into product_attributes
    // + attributes_details, still appears on PDP spec table + filter sidebar).
    setAxisById((prev) => ({ ...prev, [attributeId]: !prev[attributeId] }));
  };

  // Don't show already-picked attributes in the picker.
  const availableOptions = useMemo(() => {
    const taken = new Set(selectedAttributes?.map((a) => a?._id));
    return attributes.filter((a) => !taken.has(a?._id));
  }, [attributes, selectedAttributes]);

  // (Inline mini "+Add value" handler removed — the UI now uses the full
  // UpdateAttribute modal which does the PATCH itself.)


  // ── Build dataToSubmit whenever selection or axis toggles change ─────────
  useEffect(() => {
    const product_attributes = selectedAttributes.map((attr, i) => ({
      attribute_id: attr?._id,
      value_ids: (selectedAttributeValues[i] || []).map((v) => v?._id),
      // Default true unless the owner explicitly turned this attribute OFF
      // for the storefront filter sidebar. (Backend schema default also true.)
      show_in_filter: showInFilterById[attr?._id] !== false,
    }));

    const variant_axes = selectedAttributes
      .filter((attr) => axisById[attr?._id])
      .map((attr) => ({ attribute_id: attr?._id, is_mandatory: true }));

    // Legacy free-text snapshot for backward-compat (admin search/list etc.).
    // Phase 0 fix — emit `attribute_id` (NOT `_id`, which Mongoose autogens for
    // subdocs and overwrites on save). PDP picker matches variant_axes against
    // this field.
    const attributes_details = selectedAttributes.map((attr, i) => ({
      attribute_id: attr?._id,
      attribute_name: attr?.attribute_name,
      attribute_values: selectedAttributeValues[i] || [],
    }));

    setDataToSubmit({
      product_attributes,
      variant_axes,
      attributes_details,
    });
  }, [selectedAttributes, selectedAttributeValues, axisById, showInFilterById, setDataToSubmit]);

  // Phase 0.5 follow-up — bubble inactive-attribute state up to ProductForm so
  // the sticky Publish button can disable for the same reason inactive
  // category/brand does. List the offending names for the tooltip.
  useEffect(() => {
    if (!onInactiveAttributeChange) return;
    const inactiveNames = (selectedAttributes || [])
      .filter((a) => a?.attribute_status === "in-active")
      .map((a) => a?.attribute_name);
    onInactiveAttributeChange(inactiveNames);
  }, [selectedAttributes, onInactiveAttributeChange]);

  if (isLoading) return <LoaderOverlay />;

  // The variation table needs ONLY the variant-axis attributes (so spec-only
  // attrs don't multiply combinations). Pass the legacy attributes_details
  // shape it already understands — but filtered to axes only.
  // Phase 0 — match on attribute_id (was _id before; Mongoose subdoc autogen
  // _id is unrelated to the source attribute, and Phase 0 stopped emitting it).
  const axisOnlyForMatrix = (dataToSubmit?.attributes_details || []).filter(
    (a) => axisById[a.attribute_id],
  );

  // Phase 0.5 V2 — predict combination count (Cartesian product over
  // variant_axes only). If any axis has 0 values picked yet, treat as 0 to
  // avoid scaring the admin before they finish typing.
  const predictedVariationCount = axisOnlyForMatrix.reduce((acc, row) => {
    const n = row?.attribute_values?.length || 0;
    return n > 0 ? acc * n : 0;
  }, axisOnlyForMatrix.length > 0 ? 1 : 0);
  // 500 = backend hard cap. Path A (2026-06-01) batched the per-row barcode
  // + SKU collision checks into single bulk DB queries and switched to
  // insertMany + parallel S3 uploads, so 500 rows now fits in the Mongo
  // transaction window with headroom.
  const exceedsVariationCap = predictedVariationCount > 500;

  // Phase A — build a map of attribute_value._id → weight_grams_value across
  // every selected attribute that is BOTH (a) a variant axis AND (b) flagged
  // tracks_weight. The matrix table sums these per row (across the row's
  // combination) to auto-fill variation_weight_grams for NEW rows.
  // value_id can repeat across attributes (rare) so we key the map with the
  // value id directly — last write wins, fine because a single value can't
  // belong to two attributes anyway.
  const weightAxisAttributes = (selectedAttributes || []).filter(
    (a) => a?.tracks_weight && axisById[a?._id],
  );
  const valueIdToWeightGrams = {};
  for (const attr of weightAxisAttributes) {
    for (const v of attr.attribute_values || []) {
      if (typeof v?.weight_grams_value === "number") {
        valueIdToWeightGrams[String(v._id)] = v.weight_grams_value;
      }
    }
  }
  const weightAxisNames = weightAxisAttributes.map((a) => a?.attribute_name);

  // Phase A MOD #5 — warn when 2+ axes both have tracks_weight=true. The
  // matrix sums them, which is intentional (size + add-on), but unusual —
  // surface it so admin knows what to expect.
  const multiWeightAxisWarning = weightAxisAttributes.length >= 2;

  return (
    <div>
      <section className="max-w-4xl mx-auto shadow-md bg-gray-50  px-2 py-4 sm:py-6 rounded-lg  sm:px-6  mb-10 ">
        <p className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
          Attributes &amp; Variation
        </p>

        {/* Attribute picker — multi-keep-open so admin doesn't have to reopen
            the dropdown for every pick. blurInputOnSelect=false keeps the
            input focused. */}
        <div className="flex items-center gap-3 flex-wrap ">
          <p className="font-semibold text-gray-700">Attribute</p>
          <div className="flex-1">
            <Select
              id="attribute_id"
              name="attribute_id"
              required
              aria-label="Pick attributes"
              options={availableOptions}
              getOptionLabel={(x) => x?.attribute_name}
              getOptionValue={(x) => x?._id}
              isClearable
              isMulti
              closeMenuOnSelect={false}
              blurInputOnSelect={false}
              hideSelectedOptions={false}
              onChange={handleAttributeChange}
              value={selectedAttributes}
              // Phase 0.5 follow-up — mark inactive attributes visually so
              // admin doesn't pick them by mistake (still selectable for
              // draft saves, mirrors cat/brand pattern).
              formatOptionLabel={(x) =>
                x?.attribute_status === "in-active" ? (
                  <span className="text-gray-400 italic">
                    {x?.attribute_name}{" "}
                    <span className="text-[10px] text-red-400">(inactive)</span>
                  </span>
                ) : (
                  x?.attribute_name
                )
              }
            />
          </div>
          {/* Phase E — "+ Create attribute" inline shortcut. Opens the full
              AddAttribute modal; on success the new attribute is injected into
              selectedAttributes via the EM1 onCreated callback. */}
          {user?.role_id?.attribute_post && (
            <button
              type="button"
              onClick={() => setShowCreateAttrModal(true)}
              className="px-3 py-2 bg-primaryColor hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1"
            >
              <FiPlus size={14} /> Create
            </button>
          )}
        </div>

        <p className="text-gray-600 text-sm mt-4">
          Tick the values that apply, and turn on the toggle for the attributes
          that should also create variations (price/stock per combination).
          Others stay as spec-only (shown on the PDP table + filter sidebar).
        </p>

        <div className="space-y-6 mt-4">
          {selectedAttributes?.length > 0 &&
            selectedAttributes?.map((attr, index) => {
              const isAxis = !!axisById[attr?._id];
              return (
                <div
                  key={attr?._id}
                  className={`bg-white rounded border p-3 ${
                    isAxis ? "border-primaryColor/40" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-semibold ${
                          attr?.attribute_status === "in-active"
                            ? "text-gray-400 italic"
                            : "text-gray-700"
                        }`}
                      >
                        {attr?.attribute_name}
                      </p>
                      {attr?.attribute_status === "in-active" && (
                        <span
                          className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                          title="Inactive attribute — Publish disabled, only Save as Draft কাজ করবে।"
                        >
                          Inactive
                        </span>
                      )}
                      {!isAxis && (
                        <span
                          className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full"
                          title="Spec-only — shows on PDP spec table + filter sidebar, no separate variations"
                        >
                          Spec-only
                        </span>
                      )}
                      {isAxis && (
                        <span
                          className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full"
                          title="Variation axis — each value creates its own purchasable variation"
                        >
                          Axis
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setAddValueOpenId((cur) =>
                            cur === attr?._id ? null : attr?._id,
                          )
                        }
                        className="text-sm text-primaryColor hover:opacity-80 flex items-center gap-1"
                        title="Quick-add a new value to this attribute"
                      >
                        <FiPlus /> Add value
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditAttrFor(attr)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                        title="Edit existing values (rename / hex / status / delete)"
                      >
                        Edit
                      </button>
                      <ToggleSwitch
                        checked={isAxis}
                        onChange={() => toggleAxis(attr?._id)}
                        label="Variation axis"
                        size="sm"
                      />
                      <ToggleSwitch
                        checked={showInFilterById[attr?._id] !== false}
                        onChange={() => toggleShowInFilter(attr?._id)}
                        label="Show in filter"
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Phase E — inline add-value mini-form. Hex / weight inputs
                      render conditionally based on parent attribute's display_type
                      and tracks_weight flag. */}
                  {addValueOpenId === attr?._id && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                      <div className="flex flex-wrap gap-2 items-start">
                        <input
                          type="text"
                          autoFocus
                          value={addValueName}
                          onChange={(e) => setAddValueName(e.target.value)}
                          placeholder="Value name (e.g. XXL / নীল)"
                          className="flex-1 min-w-[160px] px-3 py-1.5 border border-gray-300 rounded text-sm"
                          disabled={addValueSaving}
                        />
                        {attr?.display_type === "swatch" && (
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={/^#[0-9a-fA-F]{6}$/.test(addValueHex) ? addValueHex : "#000000"}
                              onChange={(e) => setAddValueHex(e.target.value)}
                              className="w-9 h-9 p-0.5 border border-gray-300 rounded cursor-pointer"
                              disabled={addValueSaving}
                              title="Pick color"
                            />
                            <input
                              type="text"
                              value={addValueHex}
                              onChange={(e) => setAddValueHex(e.target.value)}
                              placeholder="#ff0000"
                              className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                              disabled={addValueSaving}
                            />
                          </div>
                        )}
                        {attr?.tracks_weight && (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={addValueWeight}
                            onChange={(e) => setAddValueWeight(e.target.value)}
                            placeholder="Grams"
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded text-sm"
                            disabled={addValueSaving}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => submitAddValueInline(attr)}
                          disabled={addValueSaving}
                          className="px-3 py-1.5 bg-primaryColor hover:bg-blue-500 text-white rounded text-sm disabled:opacity-50"
                        >
                          {addValueSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={closeAddValueInline}
                          disabled={addValueSaving}
                          className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded text-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-2">
                        Display style: <strong>{attr?.display_type || "button"}</strong>
                        {attr?.tracks_weight && " · Weight tracked"}
                        {" · "}New value will auto-tick for this product.
                      </p>
                    </div>
                  )}

                  <Select
                    aria-label={`${attr?.attribute_name} values`}
                    options={attr?.attribute_values || []}
                    getOptionLabel={(x) => x?.attribute_value_name}
                    getOptionValue={(x) => x?._id}
                    isClearable
                    isMulti
                    closeMenuOnSelect={false}
                    blurInputOnSelect={false}
                    hideSelectedOptions={false}
                    onChange={(opts) => handleValueChange(index, opts)}
                    value={selectedAttributeValues[index]}
                    // Render an hex-color swatch beside the value name when the
                    // attribute is colour-like (any value carries a hex code).
                    formatOptionLabel={(v) => (
                      <span className="inline-flex items-center gap-2">
                        {v?.attribute_value_code && (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: v.attribute_value_code }}
                            title={v.attribute_value_code}
                          />
                        )}
                        <span>{v?.attribute_value_name}</span>
                        {v?.attribute_value_code && (
                          <span className="text-[10px] text-gray-400 ml-1">
                            {v.attribute_value_code}
                          </span>
                        )}
                      </span>
                    )}
                  />

                  {/* A3 — DnD reorder strip. Customer-facing display order =
                      this array order (PDP picker + filter sidebar). Drag to
                      reorder, click ✕ to remove. Mirrors the Select picks. */}
                  {(selectedAttributeValues[index] || []).length >= 2 && (
                    <SortableValueChips
                      values={selectedAttributeValues[index]}
                      onReorder={(reordered) =>
                        handleValueChange(index, reordered)
                      }
                      onRemove={(valueId) =>
                        handleValueChange(
                          index,
                          (selectedAttributeValues[index] || []).filter(
                            (v) => v?._id !== valueId,
                          ),
                        )
                      }
                    />
                  )}
                </div>
              );
            })}
        </div>

        {/* Inline "Add value" — full UpdateAttribute modal so admin can
            add NEW values, edit existing names / hex codes, toggle status,
            delete unused ones. On save, the attribute query is refetched so
            the new values appear immediately in the dropdown. */}
        {editAttrFor && (
          <UpdateAttribute
            setOpenAttributeUpdateModal={() => setEditAttrFor(null)}
            attributeUpdateValue={editAttrFor}
            refetch={refetch}
            user={user}
            title={`Add / Update Values: ${editAttrFor?.attribute_name || ""}`}
          />
        )}

        {/* Phase E — "+ Create attribute" modal (reuses AddAttribute). */}
        {showCreateAttrModal && (
          <AddAttribute
            setAddAttributeModal={setShowCreateAttrModal}
            user={user}
            onCreated={handleAttributeCreated}
          />
        )}

      </section>

      {/* Base price card injected by ProductForm — sits between attribute
          block and the matrix so the flow reads top-to-bottom:
          attribute → values → axis → base prices → matrix. */}
      {basePriceSlot}

      {/* Phase 0.5 V2 — surface the predicted combination count before the
          admin tries to save. 100 is the backend hard cap; above it the save
          will be rejected, so warn early. */}
      {axisOnlyForMatrix.length > 0 && predictedVariationCount > 0 && (
        <div
          className={`mb-3 rounded-md border px-4 py-3 text-sm ${
            exceedsVariationCap
              ? "bg-red-50 border-red-200 text-red-700"
              : predictedVariationCount > 50
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          <strong>Variations: {predictedVariationCount}</strong>
          {exceedsVariationCap && (
            <>
              {" "}
              — limit হলো <strong>500</strong>। Save করলে backend reject
              করবে। কম values পছন্দ করুন বা কোনো axis OFF করুন।
            </>
          )}
          {!exceedsVariationCap && predictedVariationCount > 300 && (
            <> — অনেক variations, save 30-60 sec নিতে পারে। অপেক্ষা করুন।</>
          )}
        </div>
      )}

      {/* Phase A MOD #5 — multi-weight-axis warning. Not a blocker; just
          surfaces the sum behavior so admin knows what to expect. */}
      {axisOnlyForMatrix.length > 0 && multiWeightAxisWarning && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ <strong>{weightAxisAttributes.length}টা axis ({weightAxisNames.join(", ")})</strong>{" "}
          এ weight tracking চালু — variation weight হবে এদের <strong>sum</strong>
          (যেমন size + add-on)। Per row override করতে পারবেন matrix-এ।
        </div>
      )}

      {/* Variation combination matrix — only over the variant_axes. */}
      {axisOnlyForMatrix.length > 0 && (
        <StepOneVariationTable
          data={axisOnlyForMatrix}
          inputValueData={inputValueData}
          setFormData={setFormData}
          mainImage={mainImage}
          otherImages={otherImages}
          baseBuyingPrice={baseBuyingPrice}
          baseDiscountPrice={baseDiscountPrice}
          // Phase A — value_id → grams map for matrix auto-fill on NEW rows.
          // Empty {} when no axis has tracks_weight=true → matrix hides the
          // Weight column entirely.
          valueWeightMap={valueIdToWeightGrams}
          weightAxisNames={weightAxisNames}
        />
      )}
    </div>
  );
};

export default StepOneVariation;
