import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiChevronRight } from "react-icons/fi";
import { RxCross1 } from "react-icons/rx";
import { BASE_URL } from "../../utils/baseURL";

// Single-leaf category picker for the nested tree (Phase 0.6).
// Reads /category/tree and lets the admin drill down column-by-column
// (ZatiqEasy / macOS-Finder style). Selecting any node fixes that node as the
// chosen leaf — products can be assigned at ANY depth, not only at the deepest.
// Emits the chosen node's _id + the breadcrumb names back via onChange.
//
// Props:
//   value          — current chosen category _id (string) | "" | null
//   onChange       — (node | null) => void; node = the picked category doc or
//                    null when cleared. The parent reads .{_id, category_name,
//                    category_path} off it.
//   placeholder    — text shown before any pick (defaults to "Select category")

// Phase D Bug #6 — `includeInactive` lets the product form show inactive
// categories greyed-out (with toast warning) instead of hiding them. Public
// callers omit the prop and get the active-only tree.
const CategoryTreePicker = ({
  value,
  onChange,
  placeholder = "Select category",
  includeInactive = false,
}) => {
  const { data: treeRes = {}, isLoading } = useQuery({
    queryKey: [`/api/v1/category/tree?includeInactive=${includeInactive}`],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/category/tree?includeInactive=${includeInactive}`,
        { credentials: "include" },
      );
      return res.json();
    },
  });

  const tree = treeRes?.data ?? [];

  // Flatten the tree once so we can look any node up by _id (for value-prefill
  // and to render the breadcrumb chip without walking the tree each render).
  const byId = useMemo(() => {
    const map = new Map();
    const walk = (nodes, ancestors) => {
      for (const n of nodes) {
        map.set(String(n._id), { node: n, ancestors });
        if (n.children?.length) walk(n.children, [...ancestors, n]);
      }
    };
    walk(tree, []);
    return map;
  }, [tree]);

  const [open, setOpen] = useState(false);
  // `cols` = the list of selected nodes that define each visible drill column.
  // [] → showing roots; [A] → showing roots + A's children; [A, B] → + B's children.
  const [cols, setCols] = useState([]);

  // Sync drill columns when the externally-controlled value changes (e.g. on
  // edit-product form load).
  useEffect(() => {
    if (!value) {
      setCols([]);
      return;
    }
    const found = byId.get(String(value));
    if (found) setCols([...found.ancestors, found.node]);
  }, [value, byId]);

  const chosen = value ? byId.get(String(value))?.node : null;
  const chosenPath = value
    ? [...(byId.get(String(value))?.ancestors ?? []), chosen].filter(Boolean)
    : [];

  const handlePick = (level, node) => {
    // Pick this node as the active leaf AND show its children (if any) as the
    // next column. Admin can keep drilling, OR press "Use this" to commit.
    const next = [...cols.slice(0, level), node];
    setCols(next);
    onChange?.(node);
  };

  const handleClear = () => {
    setCols([]);
    onChange?.(null);
  };

  // Columns to render: roots first, then each chosen node's children.
  const columns = [
    { level: 0, nodes: tree },
    ...cols
      .map((n, i) => ({ level: i + 1, nodes: n.children ?? [] }))
      .filter((c) => c.nodes.length > 0),
  ];

  return (
    <div className="relative">
      {/* Trigger / breadcrumb chip */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-2.5 border border-gray-300 rounded-lg bg-white flex items-center gap-1 flex-wrap min-h-[42px]"
      >
        {chosenPath.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          chosenPath.map((n, i) => (
            <span key={n._id} className="flex items-center gap-1">
              {i > 0 && <FiChevronRight size={14} className="text-gray-400" />}
              <span className="text-gray-800">{n.category_name}</span>
            </span>
          ))
        )}
        {chosenPath.length > 0 && (
          <span
            role="button"
            tabIndex={-1}
            className="ml-auto text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          >
            <RxCross1 size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-3xl">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="flex max-h-72 overflow-x-auto divide-x divide-gray-100">
              {columns.map((col, idx) => {
                const activeAtThisLevel = cols[idx]?._id;
                return (
                  <div
                    key={idx}
                    className="min-w-[180px] max-w-[220px] overflow-y-auto"
                  >
                    {col.nodes.map((n) => {
                      const hasKids = (n.children?.length ?? 0) > 0;
                      const isActive = String(activeAtThisLevel) === String(n._id);
                      const isInactive = n.category_status === "in-active";
                      return (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => handlePick(idx, n)}
                          title={
                            isInactive
                              ? "এই category inactive — product publish হবে না, draft হিসেবে save হবে"
                              : undefined
                          }
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${
                            isActive ? "bg-primaryColor/10 text-primaryColor" : "text-gray-700"
                          } ${isInactive ? "text-gray-400 italic" : ""}`}
                        >
                          <span className="truncate">
                            {n.category_name}
                            {isInactive && (
                              <span className="ml-1 text-[10px] text-red-400">
                                (inactive)
                              </span>
                            )}
                          </span>
                          {hasKids && <FiChevronRight size={14} className="opacity-60" />}
                        </button>
                      );
                    })}
                    {col.nodes.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">No sub-categories</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2 p-2 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm px-3 py-1 rounded hover:bg-gray-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={!chosen}
              className="text-sm px-3 py-1 rounded bg-primaryColor text-white disabled:opacity-50"
            >
              Use this
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTreePicker;
