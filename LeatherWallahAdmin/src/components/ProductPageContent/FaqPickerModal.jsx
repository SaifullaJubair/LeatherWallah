import { useMemo, useState } from "react";
import { FaTimes, FaPlus, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  useGetFaqTemplates,
  useGetFaqTemplateTopics,
} from "../../hooks/useGetFaqTemplate";
import useDebounced from "../../hooks/useDebounced";
import { placeholderHintKeys } from "./faqPlaceholders";

// Tokens still unresolved after filling — these have no value on this product.
const unresolvedTokens = (text) => {
  const out = [];
  String(text || "").replace(/\{\{([^}]+)\}\}/g, (_, k) => {
    out.push(k.trim());
    return _;
  });
  return out;
};

// Replace {{placeholders}} with current product form values.
// Anything missing stays as-is so admin can edit before saving. The key match
// is trimmed + case-insensitive and allows spaces, so {{Skin Type}} resolves to
// the same context entry as {{skin_type}}.
const normKey = (k) =>
  String(k || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const fillPlaceholders = (text, productCtx = {}) => {
  if (!text) return text;
  // Pre-normalise the context keys once for case/space-insensitive lookup.
  const normMap = {};
  Object.keys(productCtx || {}).forEach((k) => {
    normMap[normKey(k)] = productCtx[k];
  });
  return text.replace(/\{\{([^}]+)\}\}/g, (full, rawKey) => {
    const v = normMap[normKey(rawKey)];
    return v !== undefined && v !== null && v !== "" ? String(v) : full;
  });
};

// A template is "suggested" for this product when it has no category scope
// (global) OR its category_ids intersect the product's category lineage.
const isSuggested = (tpl, productCategoryIds) => {
  const ids = Array.isArray(tpl?.category_ids) ? tpl.category_ids : [];
  if (ids.length === 0) return true; // global template
  const set = new Set(productCategoryIds || []);
  return ids.some((c) => set.has(typeof c === "object" ? String(c._id) : String(c)));
};

const FaqPickerModal = ({
  open,
  onClose,
  onPick,
  productCtx,
  productCategoryIds = [],
}) => {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [showAll, setShowAll] = useState(false);
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 300 });

  const { data, isLoading } = useGetFaqTemplates({
    page: 1,
    limit: 100,
    is_active: true,
    category: topic || undefined,
    search: debouncedSearch || undefined,
  });
  const { data: topicsRes } = useGetFaqTemplateTopics();

  const templates = useMemo(() => data?.data || [], [data]);

  const topicOptions = useMemo(
    () => (Array.isArray(topicsRes?.data) ? topicsRes.data : []),
    [topicsRes],
  );

  // Split into suggested (for this product) vs other.
  const { suggested, other } = useMemo(() => {
    const sug = [];
    const oth = [];
    templates.forEach((t) => {
      (isSuggested(t, productCategoryIds) ? sug : oth).push(t);
    });
    return { suggested: sug, other: oth };
  }, [templates, productCategoryIds]);

  // Placeholder keys this product can fill (for the hint bar).
  const availableKeys = useMemo(
    () => placeholderHintKeys(productCtx),
    [productCtx],
  );

  if (!open) return null;

  const handlePick = (t) => {
    const question = fillPlaceholders(t.question, productCtx);
    const answer = fillPlaceholders(t.answer, productCtx);
    // Warn (but still add) if any token couldn't be filled for this product.
    const missing = [
      ...new Set([...unresolvedTokens(question), ...unresolvedTokens(answer)]),
    ];
    if (missing.length) {
      toast.warn(
        `Added, but ${missing
          .map((m) => `{{${m}}}`)
          .join(", ")} has no value on this product — edit it, or it will be hidden on the page.`,
        { autoClose: 5000 },
      );
    }
    onPick({ question, answer });
  };

  const renderCard = (t) => {
    const q = fillPlaceholders(t.question, productCtx);
    const a = fillPlaceholders(t.answer, productCtx);
    const missing = [
      ...new Set([...unresolvedTokens(q), ...unresolvedTokens(a)]),
    ];
    return (
      <div
        key={t._id}
        className={`flex items-start gap-3 p-3 border rounded hover:bg-gray-50 ${
          missing.length ? "border-amber-300 bg-amber-50/40" : ""
        }`}
      >
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
              {t.category}
            </span>
            {missing.length > 0 && (
              <span
                className="inline-flex items-center gap-1 text-amber-600"
                title={`No value on this product: ${missing
                  .map((m) => `{{${m}}}`)
                  .join(", ")}`}
              >
                <FaExclamationTriangle size={10} />
                {missing.length} unfilled
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-800">{q}</p>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a}</p>
        </div>
        <button
          type="button"
          onClick={() => handlePick(t)}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 flex-shrink-0"
        >
          <FaPlus /> Add
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Pick from FAQ Templates</h3>
            <p className="text-xs text-gray-500">
              Click "Add" to insert; placeholders are auto-filled from current
              product form.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>

        <div className="p-3 border-b flex gap-2">
          <input
            type="text"
            placeholder="Search question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input flex-1"
          />
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="form-input max-w-[160px]"
          >
            <option value="">All topics</option>
            {topicOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Placeholders THIS product can fill — derived from its core fields +
            spec (custom_fields) + nutrition rows. Shows admin exactly what
            {{tokens}} will resolve for this product. */}
        {availableKeys.length > 0 && (
          <div className="px-3 py-2 border-b bg-gray-50 text-[11px] text-gray-500">
            <span className="font-medium text-gray-600">
              Placeholders for this product:{" "}
            </span>
            {availableKeys.map((k) => (
              <code
                key={k}
                className="inline-block bg-white border rounded px-1 mr-1 mb-1 text-gray-700"
              >
                {`{{${k}}}`}
              </code>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
          {!isLoading && templates.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              কোনো template মেলেনি।
            </p>
          )}

          {/* Suggested for this product */}
          {suggested.length > 0 && (
            <>
              <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                ✨ Suggested for this product
                <span className="font-normal text-gray-400">
                  ({suggested.length})
                </span>
              </p>
              {suggested.map(renderCard)}
            </>
          )}

          {/* Other templates — folded unless toggled (or nothing suggested) */}
          {other.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                {showAll ? "▾" : "▸"} Other templates ({other.length})
              </button>
              {(showAll || suggested.length === 0) && (
                <div className="space-y-2 mt-2">{other.map(renderCard)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaqPickerModal;
