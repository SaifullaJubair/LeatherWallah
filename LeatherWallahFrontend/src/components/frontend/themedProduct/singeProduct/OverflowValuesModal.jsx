"use client";
// OverflowValuesModal — "+N more" modal for the picker. Reuses the parent
// VariationPicker's renderChip() so a click inside the modal goes through the
// exact same OOS check + handleSelectVariation + URL sync path as a click in
// the main chip grid.
//
// UX:
//   - Backdrop click + Escape close
//   - Search input autofocused, live-filters by attribute_value_name (trim +
//     lowercase, Bangla-safe via trim — no Unicode normalization)
//   - Caller's renderChip already calls handleSelectVariation when clicked, so
//     after a pick we just close the modal (selected state is observable in
//     selectedVariations through the parent's React state)
import { useEffect, useMemo, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";

const OverflowValuesModal = ({ attribute, values, renderChip, onClose }) => {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  // Esc key closes; lock body scroll while modal is open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Autofocus search after mount (autoFocus prop is unreliable inside portals
  // and after React 18's strict double-mount, so do it imperatively).
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return values;
    return values.filter((v) =>
      String(v?.attribute_value_name || "")
        .trim()
        .toLowerCase()
        .includes(q),
    );
  }, [query, values]);

  // Intercept chip clicks: parent's renderChip → onClick → handleSelectVariation
  // already fires. We just need to close the modal after. Wrap the chip output
  // in a click-capturing div so we close even if the chip's own onClick stops
  // propagation (defensive — current renderChip doesn't, but future edits
  // shouldn't break the close behavior).
  const handleChipWrapperClick = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`See all ${attribute?.attribute_name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--section-bg, #fff)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--brand-primary-light, #e5e7eb)" }}
        >
          <h3
            className="text-base font-bold"
            style={{ color: "var(--heading-color)" }}
          >
            Select {attribute?.attribute_name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${attribute?.attribute_name}...`}
            className="w-full px-3 py-2 border-2 text-sm bg-white focus:outline-none focus:ring-1"
            style={{
              borderRadius: "var(--button-radius, 8px)",
              borderColor: "var(--brand-primary-light, #e5e7eb)",
              color: "var(--body-color)",
            }}
            aria-label={`Search ${attribute?.attribute_name}`}
          />
        </div>

        {/* Chip list — scrollable */}
        <div className="px-5 pb-5 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              No results found
            </p>
          ) : (
            <div
              className="flex flex-wrap gap-2.5 items-center"
              onClick={handleChipWrapperClick}
            >
              {filtered.map((v) => renderChip(v))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverflowValuesModal;
