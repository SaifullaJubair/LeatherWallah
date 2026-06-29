import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaTimes, FaSave } from "react-icons/fa";
import { BASE_URL } from "../../utils/baseURL";
import {
  useGetFaqTemplateTopics,
  useGetFaqPlaceholderKeys,
} from "../../hooks/useGetFaqTemplate";
import useGetCategory from "../../hooks/useGetCategory";

// Topic suggestions come entirely from the DB (distinct topics already in use).
// Fresh installs get a starter set from the backend bootstrap seed — no
// hardcoded list here, so the suggestions stay fully data-driven / niche-neutral.
// Placeholder chips (core + catalog spec/nutrition keys) are fetched live from
// /product/faq-placeholder-keys and rendered as clickable insert buttons below.

const FaqTemplateModal = ({ open, onClose, initial = null, refetch }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      question: initial?.question || "",
      answer: initial?.answer || "",
      category: initial?.category || "general",
      is_active: initial?.is_active ?? true,
    },
  });

  // Selected product-category ids (scope). Kept in local state, not RHF, because
  // it's a multi-select set rather than a single input.
  const [categoryIds, setCategoryIds] = useState([]);

  // Track which text field was focused last + a ref to each, so a chip inserts
  // {{token}} at the caret of the field the admin was editing. Defaults to
  // the answer (where placeholders are most common).
  const questionRef = useRef(null);
  const answerRef = useRef(null);
  const [activeField, setActiveField] = useState("answer");

  const { data: topicsRes } = useGetFaqTemplateTopics();
  const { data: categoryRes } = useGetCategory();
  const { data: phRes } = useGetFaqPlaceholderKeys();

  // Placeholder chips: universal core + distinct catalog keys.
  const placeholderChips = useMemo(() => {
    const core = phRes?.data?.core || ["product_name", "price", "weight"];
    const fromProducts = phRes?.data?.fromProducts || [];
    return { core, fromProducts };
  }, [phRes]);

  // Insert {{key}} at the caret of the active field, then refocus it.
  const insertPlaceholder = (key) => {
    const token = `{{${key}}}`;
    const fieldName = activeField;
    const el = fieldName === "question" ? questionRef.current : answerRef.current;
    const current = getValues(fieldName) || "";
    if (!el) {
      setValue(fieldName, current + token, { shouldDirty: true });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setValue(fieldName, next, { shouldDirty: true });
    // Restore caret just after the inserted token.
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Datalist suggestions = distinct topics already in the DB.
  const topicOptions = useMemo(
    () => (Array.isArray(topicsRes?.data) ? topicsRes.data : []),
    [topicsRes],
  );

  // Build a proper parent→child ordering from the flat list. The API returns
  // categories in serial order (parents and children interleaved), so a plain
  // depth-sort would indent children but scatter them away from their parent.
  // Here we walk the tree depth-first from each root so every child sits
  // directly under its parent, with `depth` driving the indentation.
  const categories = useMemo(() => {
    const list = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
    const byParent = new Map(); // parentId|"root" → children[]
    list.forEach((c) => {
      const key = c?.parent_id ? String(c.parent_id) : "root";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(c);
    });
    // Stable serial/name order among siblings.
    for (const arr of byParent.values()) {
      arr.sort(
        (a, b) =>
          (a?.category_serial ?? 0) - (b?.category_serial ?? 0) ||
          String(a?.category_name || "").localeCompare(
            String(b?.category_name || ""),
          ),
      );
    }
    const ordered = [];
    const seen = new Set(); // cycle / dead-parent guard
    const walk = (key, depth) => {
      const children = byParent.get(key) || [];
      for (const c of children) {
        const id = String(c._id);
        if (seen.has(id)) continue;
        seen.add(id);
        ordered.push({ ...c, _treeDepth: depth });
        walk(id, depth + 1);
      }
    };
    walk("root", 0);
    // Orphans (parent_id points to a missing/filtered category) — append at
    // root depth so they're never silently dropped.
    list.forEach((c) => {
      if (!seen.has(String(c._id))) ordered.push({ ...c, _treeDepth: 0 });
    });
    return ordered;
  }, [categoryRes]);

  // Re-sync the form every time the modal OPENS (not just when `initial`
  // changes). For create-mode `initial` stays null between opens, so without
  // keying on `open` the previous draft would linger. Resetting on open clears
  // a create form and reloads an edit target's values.
  useEffect(() => {
    if (!open) return;
    reset({
      question: initial?.question || "",
      answer: initial?.answer || "",
      category: initial?.category || "general",
      is_active: initial?.is_active ?? true,
    });
    setCategoryIds(
      Array.isArray(initial?.category_ids)
        ? initial.category_ids.map((c) =>
            typeof c === "object" ? String(c._id) : String(c),
          )
        : [],
    );
    setActiveField("answer");
  }, [open, initial, reset]);

  if (!open) return null;

  const toggleCategory = (id) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSubmit = async (form) => {
    const url = initial?._id
      ? `${BASE_URL}/faq-template/${initial._id}`
      : `${BASE_URL}/faq-template`;
    const method = initial?._id ? "PATCH" : "POST";
    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category_ids: categoryIds }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(initial ? "Template updated" : "Template created");
        refetch();
        // A new/edited topic should appear in every topic filter immediately,
        // and a freshly referenced spec could change placeholder chips — so
        // invalidate those cached queries instead of waiting them out.
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/faq-template/topics"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/product/faq-placeholder-keys"],
        });
        onClose();
      } else {
        toast.error(data?.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">
            {initial ? "Edit FAQ Template" : "Add FAQ Template"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          {/* Topic — free text with datalist suggestions */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Topic <span className="text-gray-400">(label, free text)</span>
            </label>
            <input
              list="faq-topic-options"
              {...register("category")}
              className="form-input"
              placeholder="e.g. shelf_life, storage, skin_type…"
            />
            <datalist id="faq-topic-options">
              {topicOptions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* Product-category scope — optional multi-select */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Show for product categories{" "}
              <span className="text-gray-400">(empty = all products)</span>
            </label>
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
              {categories.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No categories.</p>
              ) : (
                categories.map((c) => {
                  const id = String(c._id);
                  const depth = c?._treeDepth ?? 0;
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1"
                      style={{ paddingLeft: `${depth * 18 + 4}px` }}
                    >
                      {/* Tree guide for nested rows so the hierarchy reads at a
                          glance even without lines. */}
                      {depth > 0 && (
                        <span className="text-gray-300 select-none">└</span>
                      )}
                      <input
                        type="checkbox"
                        checked={categoryIds.includes(id)}
                        onChange={() => toggleCategory(id)}
                      />
                      <span>{c.category_name}</span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Tagging a parent category also suggests this template for its
              sub-categories.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Question</label>
            {(() => {
              const { ref, ...rest } = register("question", { required: true });
              return (
                <input
                  type="text"
                  {...rest}
                  ref={(el) => {
                    ref(el);
                    questionRef.current = el;
                  }}
                  onFocus={() => setActiveField("question")}
                  className="form-input"
                  placeholder="{{product_name}} কতদিন ভালো থাকে?"
                />
              );
            })()}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Answer</label>
            {(() => {
              const { ref, ...rest } = register("answer", { required: true });
              return (
                <textarea
                  {...rest}
                  ref={(el) => {
                    ref(el);
                    answerRef.current = el;
                  }}
                  onFocus={() => setActiveField("answer")}
                  rows={4}
                  className="form-input"
                  placeholder="সঠিকভাবে রাখলে {{product_name}} {{shelf_life}} পর্যন্ত ভালো।"
                />
              );
            })()}
          </div>

          {/* Clickable placeholder chips — insert {{token}} at the caret of the
              last-focused field. Core keys are universal; the rest are distinct
              spec/nutrition labels across the catalog, so they stay niche-neutral
              and grow as the merchant's products do. */}
          <div className="rounded border bg-gray-50 p-2">
            <p className="text-[11px] font-medium text-gray-600 mb-1.5">
              Insert placeholder{" "}
              <span className="font-normal text-gray-400">
                (click to add to the {activeField}; filled per product)
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {placeholderChips.core.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => insertPlaceholder(k)}
                  className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-blueColor-300 bg-white text-blueColor-700 hover:bg-blueColor-50"
                  title="Core placeholder (every product)"
                >
                  {`{{${k}}}`}
                </button>
              ))}
              {placeholderChips.fromProducts.map((item) => {
                // Back-compat: tolerate the old string[] shape too.
                const key = typeof item === "string" ? item : item.key;
                const label = typeof item === "string" ? "" : item.label;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => insertPlaceholder(key)}
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded border bg-white text-gray-700 hover:bg-gray-100"
                    title={
                      label
                        ? `Spec / nutrition field: "${label}"`
                        : "From a product's spec / nutrition field"
                    }
                  >
                    {`{{${key}}}`}
                    {label && label.toLowerCase() !== key && (
                      <span className="ml-1 font-sans text-gray-400">
                        ({label})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Filled from each product when the template is added. If a product
              lacks a value, that FAQ is hidden on its page.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("is_active")} />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blueColor-600 text-white hover:bg-blueColor-700 rounded"
            >
              <FaSave /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaqTemplateModal;
