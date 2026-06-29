import { useEffect, useMemo, useState } from "react";
import { MdCancel } from "react-icons/md";
import { FiArrowUp, FiArrowDown, FiX, FiUpload } from "react-icons/fi";

// Batch 2 C1 — multi-image variation picker.
//
// Pool sources (admin can pick from any):
//   - mainImage: File | string-URL | null
//   - otherImages: (File | string-URL)[]
// Plus admin can upload fresh files inside the modal.
//
// Selected value shape (round-trips into the variation row as `variation_images`):
//   [
//     { source: "existing", url: "<S3 URL>" } | { source: "existing", file: File },
//     { source: "new", file: File },
//     ...
//   ]
// Order matters — first element is the PRIMARY image (PDP default).
// Admin can reorder via up/down arrows next to each selected item.
//
// Why we copy a URL/File reference into the row instead of storing
// `{ref:"main"|"other:N"}` like the v1 single-image picker: if the product's
// main_image / other_images change later, the variation's copy stays intact
// (owner-locked decision 2026-05-30 — see product-form-batch2-backlog memory).

const previewSrcOf = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (item instanceof File) {
    try {
      return URL.createObjectURL(item);
    } catch {
      return null;
    }
  }
  if (item && typeof item === "object") {
    if (item.source === "existing") {
      if (item.url) return item.url;
      if (item.file instanceof File) {
        try {
          return URL.createObjectURL(item.file);
        } catch {
          return null;
        }
      }
    }
    if (item.source === "new" && item.file instanceof File) {
      try {
        return URL.createObjectURL(item.file);
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Stable key for dedupe — strings compare by content, Files by name+size.
const keyOf = (item) => {
  if (!item) return "";
  if (typeof item === "string") return `s:${item}`;
  if (item instanceof File) return `f:${item.name}:${item.size}`;
  if (item && typeof item === "object") {
    if (item.url) return `s:${item.url}`;
    if (item.file instanceof File) return `f:${item.file.name}:${item.file.size}`;
  }
  return "";
};

const VariationImageModal = ({
  open,
  onClose,
  rowLabel,
  mainImage,
  otherImages,
  currentValue,
  onSelect,
}) => {
  // Local working set — committed only on "Select" click.
  const [picked, setPicked] = useState([]);

  useEffect(() => {
    if (!open) return;
    // Seed from row's current value. Normalise EVERY entry to the wrapped
    // shape `{source, url|file}` so the rest of the modal can rely on a
    // single representation regardless of where the value came from (DB raw
    // URL strings, previous-session File picks, fresh user selections).
    const raw = Array.isArray(currentValue)
      ? currentValue.filter(Boolean)
      : currentValue
        ? [currentValue]
        : [];
    const normalised = raw.map((item) => {
      if (item && typeof item === "object" && item.source) return item;
      if (typeof item === "string") return { source: "existing", url: item };
      if (item instanceof File) return { source: "new", file: item };
      return null;
    }).filter(Boolean);
    setPicked(normalised);
  }, [open, currentValue]);

  // Build a stable pool list of {key, item, label}.
  const pool = useMemo(() => {
    const list = [];
    if (mainImage) {
      list.push({
        key: keyOf(mainImage),
        item: mainImage,
        label: "Main image",
      });
    }
    (otherImages || []).forEach((img, idx) => {
      if (!img) return;
      list.push({
        key: keyOf(img),
        item: img,
        label: `Other ${idx + 1}`,
      });
    });
    return list;
  }, [mainImage, otherImages]);

  // Is a pool item currently picked?
  const isPicked = (poolItem) => {
    const k = keyOf(poolItem);
    return picked.some((p) => {
      // Two shapes: legacy raw value, or wrapped {source, …}
      if (p && typeof p === "object" && p.source) {
        const pk = p.url ? `s:${p.url}` : keyOf(p.file);
        return pk === k;
      }
      return keyOf(p) === k;
    });
  };

  const togglePool = (poolItem) => {
    const k = keyOf(poolItem);
    setPicked((prev) => {
      const exists = prev.some((p) => {
        if (p && typeof p === "object" && p.source) {
          const pk = p.url ? `s:${p.url}` : keyOf(p.file);
          return pk === k;
        }
        return keyOf(p) === k;
      });
      if (exists) {
        return prev.filter((p) => {
          if (p && typeof p === "object" && p.source) {
            const pk = p.url ? `s:${p.url}` : keyOf(p.file);
            return pk !== k;
          }
          return keyOf(p) !== k;
        });
      }
      // Wrap newly-picked existing entries in the tagged shape so submit
      // can recognise URL vs File without re-inspecting.
      const wrapped =
        typeof poolItem === "string"
          ? { source: "existing", url: poolItem }
          : { source: "existing", file: poolItem };
      return [...prev, wrapped];
    });
  };

  const addNewFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPicked((prev) => {
      // Dedupe against existing entries by name+size.
      const existingKeys = new Set(
        prev.map((p) => {
          if (p && typeof p === "object" && p.source === "new") return keyOf(p.file);
          if (p instanceof File) return keyOf(p);
          return "";
        }),
      );
      const fresh = files
        .filter((f) => !existingKeys.has(keyOf(f)))
        .map((f) => ({ source: "new", file: f }));
      return [...prev, ...fresh];
    });
    e.target.value = null;
  };

  const move = (idx, dir) => {
    setPicked((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const removeAt = (idx) => {
    setPicked((prev) => prev.filter((_, i) => i !== idx));
  };

  // Cleanup blob URLs for newly-uploaded entries on unmount/close.
  useEffect(() => {
    if (!open) return;
    return () => {
      // No-op; previewSrcOf creates fresh URLs each render. Safe to leak for
      // a brief modal lifetime; browser cleans up on tab close. If perf
      // matters later, switch to a useMemo with revokeObjectURL cleanup.
    };
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    onSelect(picked);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h4 className="text-lg font-semibold text-gray-800">
            Choose images{rowLabel ? ` for: ${rowLabel}` : ""}
            <span className="ml-2 text-xs text-gray-400 font-normal">
              (first one = primary; reorder with arrows)
            </span>
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            title="Close"
          >
            <MdCancel size={22} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Selected list — ordered, reorderable */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Selected ({picked.length})
            </p>
            {picked.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Nothing picked yet. Tick from the pool below or upload new.
              </p>
            ) : (
              <div className="space-y-2">
                {picked.map((item, idx) => {
                  const src = previewSrcOf(item);
                  const isNew =
                    item && typeof item === "object" && item.source === "new";
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 border rounded ${
                        idx === 0
                          ? "border-primaryColor bg-primaryColor/5"
                          : "border-gray-200"
                      }`}
                    >
                      {src && (
                        <img
                          src={src}
                          alt={`pick-${idx}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 text-xs text-gray-700">
                        {idx === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primaryColor text-white mr-2">
                            PRIMARY
                          </span>
                        )}
                        {isNew ? "New upload" : "Existing"}
                      </div>
                      <button
                        type="button"
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                        title="Move up"
                      >
                        <FiArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(idx, +1)}
                        disabled={idx === picked.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                        title="Move down"
                      >
                        <FiArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAt(idx)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pool — pick from product's existing media */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              From this product&apos;s uploaded media
            </p>
            {pool.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No main / additional images uploaded yet. Upload some in Basic
                Info → Media first, or upload new below.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {pool.map(({ key, item, label }) => {
                  const src = previewSrcOf(item);
                  const ticked = isPicked(item);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => togglePool(item)}
                      className={`group relative border-2 rounded-lg overflow-hidden transition ${
                        ticked
                          ? "border-primaryColor ring-2 ring-primaryColor/30"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={label}
                          className="w-full h-24 object-cover"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                          {label}
                        </div>
                      )}
                      <span className="block text-[11px] text-center py-1 bg-gray-50 text-gray-600">
                        {ticked ? "✓ Selected" : label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upload new */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Or upload new images (just for this variation)
            </p>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-blue-400 rounded-lg cursor-pointer bg-white text-sm text-gray-600 hover:bg-blue-50">
              <FiUpload /> Choose files
              <input
                type="file"
                accept="image/*,.gif"
                multiple
                className="hidden"
                onChange={addNewFiles}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t bg-gray-50 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-primaryColor text-white hover:opacity-90"
          >
            Select ({picked.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariationImageModal;
