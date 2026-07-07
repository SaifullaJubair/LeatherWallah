import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

/**
 * ColorPopover — swatch picker for text colour AND highlight (via `mode`).
 * Ported from the Sams-360 contract editor.
 *  - grid of common colours + a Clear (×) + a native "Custom" colour picker
 *  - closes on outside-click / Escape
 *  - active colour shows as a bar under the trigger
 */
const DEFAULT_TEXT_COLORS = [
  "#000000", "#374151", "#6b7280", "#9ca3af",
  "#6B1A1F", "#C9A227", "#ef4444", "#f97316", // brand burgundy + gold first
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6",
];

const DEFAULT_HIGHLIGHT_COLORS = [
  "#fef3c7", "#fde68a", "#fcd34d",
  "#bbf7d0", "#bae6fd", "#c7d2fe",
  "#fbcfe8", "#fecaca", "#e5e7eb",
];

export default function ColorPopover({
  mode = "text", // "text" | "highlight"
  currentColor,
  isActive = false,
  onSelect,
  onClear,
  trigger,
  title,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const swatches =
    mode === "highlight" ? DEFAULT_HIGHLIGHT_COLORS : DEFAULT_TEXT_COLORS;

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handlePick = (color) => { onSelect?.(color); setOpen(false); };
  const handleClear = () => { onClear?.(); setOpen(false); };

  return (
    <div ref={rootRef} className="rte-color-pop">
      <button
        type="button"
        title={title}
        className={`rte-btn${isActive ? " is-active" : ""}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative" }}
      >
        {trigger}
        <span
          className="rte-color-bar"
          style={{ background: currentColor || "transparent" }}
        />
      </button>

      {open && (
        <div className="rte-color-menu">
          <div className="rte-color-grid">
            {swatches.map((c) => {
              const selected =
                currentColor && currentColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(c)}
                  className={`rte-swatch${selected ? " is-selected" : ""}`}
                  style={{ background: c }}
                />
              );
            })}
          </div>
          <div className="rte-color-actions">
            <button
              type="button"
              className="rte-color-action"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
            >
              <FiX size={12} /> Clear
            </button>
            <label className="rte-color-action" title="Custom colour">
              <span className="rte-color-wheel" />
              Custom
              <input
                type="color"
                value={currentColor || "#000000"}
                onChange={(e) => handlePick(e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
