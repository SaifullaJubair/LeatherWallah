import { useEffect, useRef, useState } from "react";
import { FaTable } from "react-icons/fa";

/**
 * TablePicker — click the table icon to open a grid; hover to choose the size,
 * click to insert. Ported from the Sams-360 contract editor.
 * `onInsert(rows, cols)` runs the actual insertTable command in the caller.
 */
const MAX_ROWS = 8;
const MAX_COLS = 10;

export default function TablePicker({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (r, c) => { onInsert?.(r, c); setOpen(false); setHover({ r: 0, c: 0 }); };

  const grid = [];
  for (let r = 1; r <= MAX_ROWS; r++) {
    for (let c = 1; c <= MAX_COLS; c++) {
      const on = r <= hover.r && c <= hover.c;
      grid.push(
        <button
          key={`${r}-${c}`}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setHover({ r, c })}
          onClick={() => pick(r, c)}
          className={`rte-tp-cell${on ? " on" : ""}`}
        />
      );
    }
  }

  return (
    <div ref={rootRef} className="rte-color-pop">
      <button
        type="button"
        title="Insert table"
        className="rte-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        <FaTable />
      </button>
      {open && (
        <div className="rte-color-menu" onMouseLeave={() => setHover({ r: 0, c: 0 })}>
          <div
            className="rte-tp-grid"
            style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 16px)` }}
          >
            {grid}
          </div>
          <div className="rte-tp-label">
            {hover.r && hover.c ? `${hover.r} × ${hover.c}` : "Pick size"}
          </div>
        </div>
      )}
    </div>
  );
}
