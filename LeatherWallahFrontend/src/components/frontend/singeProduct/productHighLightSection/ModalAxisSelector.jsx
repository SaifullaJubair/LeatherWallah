"use client";
// Phase C — overflow / search modal for variation axes.
// Used when an axis has more values than the inline cap (8 mobile / 16 desktop)
// AND for the `dropdown` display_type's typeahead search.
//
// CM7 + CM8 + CM9 + CM10: name-only locale-aware search, ESC/click-outside
// close, body scroll-lock, focus-trap on input, OOS chips greyed + clickable,
// aria-label on every chip.

import { useEffect, useMemo, useRef, useState } from "react";
import { RxCross1 } from "react-icons/rx";

const isHex = (v) => typeof v === "string" && /^#?[A-Fa-f0-9]{3,8}$/.test(v.trim());

const ModalAxisSelector = ({
  open,
  onClose,
  axis,                  // { attribute_name, display_type, attribute_values: [...] }
  selectedValueId,
  availabilityMap,
  onSelect,              // (valueObj) => void  (also closes modal)
}) => {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const overlayRef = useRef(null);

  // Reset query whenever modal opens; lock body scroll while open; ESC close;
  // initial focus to the search input.
  useEffect(() => {
    if (!open) return;
    setQ("");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    // Focus after the modal mounts.
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const list = axis?.attribute_values || [];
    const needle = q.trim().toLocaleLowerCase();
    if (!needle) return list;
    return list.filter((v) =>
      (v?.attribute_value_name || "")
        .toString()
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [q, axis]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        // click-outside close (only when the overlay itself is the target,
        // so clicks inside the panel don't bubble-close).
        if (e.target === overlayRef.current) onClose?.();
      }}
      className="fixed inset-0 z-[1000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Choose ${axis?.attribute_name || ""}`}
    >
      <div className="bg-white w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">
            Choose {axis?.attribute_name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-gray-100"
          >
            <RxCross1 size={16} />
          </button>
        </div>
        <div className="p-3 border-b border-gray-100">
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${axis?.attribute_name || ""}…`}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-primary"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-8">
              No matches.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-1.5">
              {filtered.map((v) => {
                const avail = availabilityMap?.get(String(v._id)) || {};
                const inStock = avail.hasInStock !== false;
                const selected = String(selectedValueId) === String(v._id);
                const code = v?.attribute_value_code;
                const hex = isHex(code);
                return (
                  <li key={String(v._id)}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect?.(v);
                      }}
                      aria-label={v?.attribute_value_name}
                      aria-pressed={selected}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition
                        ${selected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/40"}
                        ${!inStock ? "opacity-50" : ""}`}
                    >
                      {hex ? (
                        <span
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: code }}
                        />
                      ) : null}
                      <span className="flex-1 text-sm text-gray-800">
                        {v?.attribute_value_name}
                      </span>
                      {!inStock && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          Out of stock
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalAxisSelector;
