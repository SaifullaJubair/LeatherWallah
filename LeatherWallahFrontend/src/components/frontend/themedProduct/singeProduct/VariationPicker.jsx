"use client";
// VariationPicker — one attribute's chip row for the themed PDP.
// Bundles 4 backlog items from session 14:
//   C9  — Pre-click OOS visual cue (faded chip + toast on click, click still
//         allowed so existing graceful-fallback in handleSelectVariation runs)
//   C10 — Viewport-driven visible cap (8 mobile / 14 tablet / 20 desktop) +
//         "+N more" trigger that opens OverflowValuesModal
//   C11 — display_type === "dropdown" → native <select> branch
//   C12 — display_type === "swatch" with invalid/missing hex → falls back to
//         button-style chip with full label (instead of broken color square)
//
// Logic-side invariants preserved from the previous inline picker in
// SingleProduct.jsx (lines 837-923 before this extraction):
//   - handleSelectVariation, URL sync, findVariation untouched (passed in)
//   - aria-label + title for accessibility (C14 session 14)
//   - matchedVar?.variation_badge_text rendered under button chips
//   - Selected chip gets brand-primary border + scale highlight
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { isHexColor, wouldComboBeInStock } from "@/utils/helper";
import OverflowValuesModal from "./OverflowValuesModal";
import DynamicIcon from "@/lib/icons/DynamicIcon";

// Viewport breakpoints align with Tailwind defaults:
//   default      → mobile (< 768px) → 8 chips
//   md (768px+)  → tablet           → 14 chips
//   lg (1024px+) → desktop          → 20 chips
const CAPS = { mobile: 8, tablet: 14, desktop: 20 };

const useVisibleCap = () => {
  const [cap, setCap] = useState(CAPS.desktop); // SSR-safe default
  useEffect(() => {
    if (typeof window === "undefined") return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 768px)");
    const update = () => {
      if (desktop.matches) setCap(CAPS.desktop);
      else if (tablet.matches) setCap(CAPS.tablet);
      else setCap(CAPS.mobile);
    };
    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);
  return cap;
};

// Decide which branch to render for a value.
//   "swatch" + valid hex   → color-circle swatch
//   "swatch" + no hex      → button (full label) — C12
//   "button"               → button (full label)
//   "dropdown"             → caller renders native <select>; per-value branch unused
//   anything else (legacy) → infer from value's hex code, same as old inline picker
const resolveBranch = (displayType, valueCode) => {
  if (displayType === "swatch") {
    return isHexColor(valueCode) ? "swatch" : "button";
  }
  if (displayType === "button") return "button";
  if (displayType === "dropdown") return "dropdown";
  // legacy / unset — back-compat with old data
  return isHexColor(valueCode) ? "swatch" : "button";
};

const VariationPicker = ({
  product,
  attribute,
  selectedVariations,
  findVariation,
  handleSelectVariation,
}) => {
  const visibleCap = useVisibleCap();
  const [modalOpen, setModalOpen] = useState(false);

  // A value is only offered if it appears in the combination[] of at least one
  // ACTIVE variation. A variation the owner disabled (is_active:false) — like a
  // size they stopped stocking — should disappear entirely, not show as a
  // permanently "out of stock" chip (that conflates "disabled" with "sold out").
  // Falls back to showing all values when the product has no variations array
  // (defensive — shouldn't happen for is_variation products).
  const allValues = useMemo(() => {
    const values = attribute?.attribute_values || [];
    const variations = product?.variations;
    if (!Array.isArray(variations) || variations.length === 0) return values;
    const activeValueIds = new Set();
    for (const v of variations) {
      if (v?.is_active === false) continue;
      (v?.combination || []).forEach((id) => activeValueIds.add(String(id)));
    }
    return values.filter((val) => activeValueIds.has(String(val?._id)));
  }, [attribute?.attribute_values, product?.variations]);

  const selectedValue = selectedVariations?.[attribute?.attribute_name];

  // Pin the currently-selected value first so it's never hidden behind +more.
  // Then fill the rest in original order until visibleCap is reached.
  const { visibleValues, overflowValues } = useMemo(() => {
    if (allValues.length <= visibleCap) {
      return { visibleValues: allValues, overflowValues: [] };
    }
    const selectedId = selectedValue?._id ? String(selectedValue._id) : null;
    const visible = [];
    const overflow = [];
    // Add selected first if present
    if (selectedId) {
      const selObj = allValues.find((v) => String(v._id) === selectedId);
      if (selObj) visible.push(selObj);
    }
    // Then fill rest in order, skipping the already-added selected
    for (const v of allValues) {
      if (selectedId && String(v._id) === selectedId) continue;
      if (visible.length < visibleCap) visible.push(v);
      else overflow.push(v);
    }
    return { visibleValues: visible, overflowValues: overflow };
  }, [allValues, visibleCap, selectedValue?._id]);

  // If every value on this axis belonged only to disabled variations, there's
  // nothing buyable to show — render nothing rather than an empty header row.
  if (allValues.length === 0) return null;

  // Dropdown branch — single <select>, no per-value loop. Overflow values are
  // still all reachable inside the select; the +more button below opens the
  // modal for a searchable alternative experience.
  const isDropdown = attribute?.display_type === "dropdown";

  // Shared handler — runs OOS toast (deduped) when click leads to dead combo,
  // then delegates to caller's handleSelectVariation which does URL sync +
  // graceful fallback.
  const onPickValue = (val) => {
    const inStock = wouldComboBeInStock(
      product,
      selectedVariations,
      attribute?.attribute_name,
      val,
    );
    if (!inStock) {
      toast.error("Out of stock", {
        toastId: "oos-warn",
        autoClose: 2000,
      });
    }
    handleSelectVariation(val, attribute?.attribute_name);
  };

  // ---- Per-value chip renderer (reused by main grid + modal) ----
  const renderChip = (val) => {
    const selected =
      selectedValue?.attribute_value_name === val?.attribute_value_name;
    const branch = resolveBranch(
      attribute?.display_type,
      val?.attribute_value_code,
    );
    const inStock = wouldComboBeInStock(
      product,
      selectedVariations,
      attribute?.attribute_name,
      val,
    );
    const oosTitle = !inStock
      ? `${val?.attribute_value_name} — Out of stock`
      : val?.attribute_value_name;
    const ariaLabel = `${attribute?.attribute_name}: ${val?.attribute_value_name}${
      !inStock ? " (out of stock)" : ""
    }`;

    if (branch === "swatch") {
      return (
        <button
          key={val?._id}
          type="button"
          title={oosTitle}
          aria-label={ariaLabel}
          onClick={() => onPickValue(val)}
          className={`relative w-9 h-9 rounded-full border-2 transition-all ${
            selected ? "scale-110" : "hover:scale-105"
          } ${!inStock ? "opacity-50" : ""}`}
          style={{
            backgroundColor: val?.attribute_value_code,
            borderColor: selected ? "var(--brand-primary)" : "#e5e7eb",
            boxShadow: selected ? "0 0 0 2px var(--brand-primary)" : "none",
          }}
        >
          {/* Diagonal slash overlay for OOS swatches — text strikethrough
              doesn't work on a circle, so an SVG line gives the same signal. */}
          {!inStock && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 36 36"
              aria-hidden="true"
            >
              <line
                x1="4"
                y1="32"
                x2="32"
                y2="4"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      );
    }

    // button branch (also used for swatch-no-hex fallback — C12)
    const matchedVar = findVariation(null, {
      ...selectedVariations,
      [attribute?.attribute_name]: val,
    });
    return (
      <button
        key={val?._id}
        type="button"
        title={oosTitle}
        aria-label={ariaLabel}
        onClick={() => onPickValue(val)}
        className={`relative px-4 py-2 text-sm font-semibold border-2 transition-all min-w-[64px] ${
          !inStock ? "opacity-50 line-through" : ""
        }`}
        style={{
          borderRadius: "var(--button-radius, 8px)",
          borderColor: selected ? "var(--brand-primary)" : "#e5e7eb",
          background: selected ? "var(--brand-primary)" : "#fff",
          color: selected ? "var(--button-text, #fff)" : "var(--body-color)",
        }}
      >
        {val?.attribute_value_name}
        {(matchedVar?.variation_badge_text ||
          matchedVar?.variation_badge_icon_key) && (
          <span
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center gap-1 whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-[9px] font-bold leading-none shadow-md"
            style={{
              // Floating pill above the chip (apple-theme mockup "সেরা প্যাক").
              // -top-4 lifts it off the chip so there's a visible gap; the
              // accent-color border + shadow-md make it read as a separate
              // floating tag even when the chip itself is the primary color
              // (selected state). Theme-primary bg + white text + accent ring.
              background: "var(--brand-primary)",
              color: "var(--button-text, #fff)",
              borderColor: "var(--accent-color, #fff)",
            }}
          >
            {/* A4 (2026-06-04) — variation badge icon from IconPicker. Renders
                alongside text; either or both may be set. */}
            {matchedVar?.variation_badge_icon_key && (
              <DynamicIcon
                name={matchedVar.variation_badge_icon_key}
                size={9}
              />
            )}
            {matchedVar?.variation_badge_text}
          </span>
        )}
      </button>
    );
  };

  // ---- Dropdown branch — entire attribute is one <select> ----
  if (isDropdown) {
    return (
      <div className="space-y-2">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--heading-color)" }}
        >
          Select {attribute?.attribute_name}
        </p>
        <select
          aria-label={`${attribute?.attribute_name} select`}
          value={selectedValue?._id ? String(selectedValue._id) : ""}
          onChange={(e) => {
            const picked = allValues.find(
              (v) => String(v._id) === e.target.value,
            );
            if (picked) onPickValue(picked);
          }}
          className="w-auto min-w-[160px] max-w-xs px-3 py-2 border-2 text-sm font-semibold bg-white focus:outline-none focus:ring-1"
          style={{
            borderRadius: "var(--button-radius, 8px)",
            borderColor: "var(--brand-primary)",
            color: "var(--body-color)",
          }}
        >
          <option value="" disabled>
            -- Select --
          </option>
          {allValues.map((v) => {
            const inStock = wouldComboBeInStock(
              product,
              selectedVariations,
              attribute?.attribute_name,
              v,
            );
            return (
              <option key={v._id} value={String(v._id)}>
                {v.attribute_value_name}
                {!inStock ? " — Out of stock" : ""}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  // ---- Swatch / button branch — chip grid + overflow ----
  return (
    <div className="space-y-2">
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--heading-color)" }}
      >
        Select {attribute?.attribute_name}
      </p>
      {/* pt-4 reserves room for the floating "-top-4" badge pill so it
          doesn't collide with the "Select …" label above. gap-y so wrapped
          rows also leave room for each row's floating badge. */}
      <div className="flex flex-wrap gap-x-2.5 gap-y-4 items-center pt-4">
        {visibleValues.map((val) => renderChip(val))}
        {overflowValues.length > 0 && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold border-2 border-dashed transition-all hover:scale-105"
            style={{
              borderRadius: "var(--button-radius, 8px)",
              borderColor: "var(--brand-primary)",
              color: "var(--brand-primary)",
              background: "transparent",
            }}
            aria-label={`See ${overflowValues.length} more ${attribute?.attribute_name}`}
          >
            +{overflowValues.length} more
          </button>
        )}
      </div>
      {modalOpen && (
        <OverflowValuesModal
          attribute={attribute}
          values={allValues}
          renderChip={renderChip}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default VariationPicker;
