import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaTrash, FaListUl, FaArrowLeft } from "react-icons/fa";
import RichTextEditor from "../common/RichTextEditor/RichTextEditor";
import IconPicker from "../common/IconPicker/IconPicker";
import CustomFieldsBlock from "../ProductNew/sections/CustomFieldsBlock";
import { BASE_URL } from "../../utils/baseURL";
import { useGetThemes } from "../../hooks/useGetTheme";
import IconTextRepeater from "./IconTextRepeater";
import PasteTableButton from "./PasteTableButton";
import FaqPickerModal from "./FaqPickerModal";
import { buildProductPlaceholderContext } from "./faqPlaceholders";
import VariationWeightEditor from "./VariationWeightEditor";
import { gramsToDisplay, displayToGrams } from "./variationWeight";
import PageContentLayout, { PageContentActions } from "./PageContentLayout";
import ProductFloatingTab from "./ProductFloatingTab";
import SizeGuideEditor from "./SizeGuideEditor";
import { PAGE_CONTENT_SECTIONS } from "./pageContentMeta";

const EMPTY_OVERRIDES = { hidden_ids: [], replacements: [], extras: [] };

// Stamp a stable client-side _localId onto each extra so the deferred-upload map
// can key off it (DB rows arrive without one). Idempotent.
const withLocalIds = (ov) => {
  const o = ov || EMPTY_OVERRIDES;
  return {
    hidden_ids: o.hidden_ids || [],
    replacements: o.replacements || [],
    extras: (o.extras || []).map((e) => ({
      ...e,
      _localId: e._localId || crypto.randomUUID(),
    })),
  };
};

const ProductPageContentForm = ({ product, refetch }) => {
  const [submitting, setSubmitting] = useState(false);
  const [faqPickerOpen, setFaqPickerOpen] = useState(false);

  // Active tab is driven by the URL (?tab=hero) so a reload / back-button keeps
  // the same section instead of snapping back to the first. Falls back to the
  // first section when the param is missing or unknown.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTab = PAGE_CONTENT_SECTIONS.some((s) => s.id === tabFromUrl)
    ? tabFromUrl
    : PAGE_CONTENT_SECTIONS[0].id;
  const activeTab = validTab;
  const setActiveTab = (id) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", id);
        return next;
      },
      { replace: true },
    );
  };

  // Theme list for picker dropdown
  const { data: themesData } = useGetThemes({
    page: 1,
    limit: 100,
    status: "active",
  });
  const activeThemes = themesData?.data || [];

  const defaults = useMemo(
    () => ({
      theme_id: product?.theme_id?._id || product?.theme_id || "",
      short_description: product?.short_description || "",
      badge_text: product?.badge_text || "",
      hero_corner_badge: product?.hero_corner_badge || "",
      video_title: product?.video_title || "",
      video_link: product?.video_link || "",
      og_title: product?.og_title || "",
      og_description: product?.og_description || "",
      og_image: product?.og_image || "",
      og_image_key: product?.og_image_key || "",
      benefits_side_image: product?.benefits_side_image || "",
      benefits_side_image_key: product?.benefits_side_image_key || "",
      use_cases_side_image: product?.use_cases_side_image || "",
      use_cases_side_image_key: product?.use_cases_side_image_key || "",
      faq_side_image: product?.faq_side_image || "",
      faq_side_image_key: product?.faq_side_image_key || "",
      // Side-image visibility toggles. Legacy products have no flag → default ON
      // (mirrors the storefront `!== false` gate).
      benefits_side_image_show: product?.benefits_side_image_show !== false,
      use_cases_side_image_show: product?.use_cases_side_image_show !== false,
      faq_side_image_show: product?.faq_side_image_show !== false,
      size_guide_title: product?.size_guide_title || "",
      size_guide_note: product?.size_guide_note || "",
      nutrition_per_serving: product?.nutrition?.per_serving || "",
    }),
    [product],
  );

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  // The theme <select> options load async (useGetThemes). If reset() ran before
  // the options existed, the native select snapped to empty and never re-synced
  // even though the saved theme_id is valid. Re-apply the saved id once the
  // options are present so the dropdown shows the real assigned theme. We set it
  // unconditionally (not gated on watch()) so it survives a later reset().
  useEffect(() => {
    const savedId = product?.theme_id?._id || product?.theme_id || "";
    if (!savedId || activeThemes.length === 0) return;
    const inList = activeThemes.some((t) => String(t._id) === String(savedId));
    if (inList) {
      setValue("theme_id", String(savedId), { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThemes, product]);

  const [shortFeatures, setShortFeatures] = useState(product?.short_features || []);
  const [processSteps, setProcessSteps] = useState(product?.process_steps || []);
  // benefits: now {text, icon_url?, icon_key?} rows (was a "\n" textarea).
  // Back-compat: legacy string[] rows are mapped to {text} so old products load.
  const [benefits, setBenefits] = useState(
    (product?.benefits || []).map((b) =>
      typeof b === "string" ? { text: b } : b,
    ),
  );
  const [useCases, setUseCases] = useState(product?.use_cases || []);
  const [faqs, setFaqs] = useState(product?.faqs || []);
  // Description (rich text) + custom spec rows — also editable from the product
  // basic-info form; same DB fields, last save wins (AB-5).
  const [description, setDescription] = useState(product?.description || "");
  const [customFields, setCustomFields] = useState(product?.custom_fields || []);

  // Free-form nutrition: a nutrient table (rows) + info tiles (with optional icon).
  const [nutritionRows, setNutritionRows] = useState(product?.nutrition?.rows || []);
  const [nutritionTiles, setNutritionTiles] = useState(
    product?.nutrition?.info_tiles || [],
  );
  // Size guide grid — dynamic columns (admin-defined headers) + rows of cells
  // aligned to those columns. Niche-agnostic: shoes use EU/UK/CM, shirts use
  // chest/waist/length, etc. Kept as local state (not RHF fields) like the other
  // repeaters, then folded into the page-content payload on submit.
  const [sizeGuideColumns, setSizeGuideColumns] = useState(
    product?.size_guide_columns || [],
  );
  const [sizeGuideRows, setSizeGuideRows] = useState(
    product?.size_guide_rows || [],
  );
  const [floatingImages, setFloatingImages] = useState(product?.floating_images || []);
  // Section-anchored override layer over the assigned theme's floating assets.
  const [floatingOverrides, setFloatingOverrides] = useState(
    withLocalIds(product?.floating_overrides),
  );
  // ── Variation rows (weight + PDP badge) ────────────────────────────────────
  // Variations live in their own collection, so unlike every other section here
  // they can't ride along on PATCH /product/page-content (that route runs a
  // strict PAGE_CONTENT_FIELDS allow-list). We fetch them, hold them as normal
  // controlled state like the other repeaters, and save them alongside the
  // page content via PATCH /variation/bulk.
  const [variations, setVariations] = useState([]);
  const [variationsLoading, setVariationsLoading] = useState(true);
  // Snapshot of what the server gave us, keyed by _id. Diffed on save so an
  // admin who merely opens this tab doesn't rewrite rows they never touched.
  const variationBaselineRef = useRef({});

  const loadVariations = async (productId) => {
    if (!productId) return;
    setVariationsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/variation/by-product/${productId}`, {
        credentials: "include",
      });
      const data = await res.json();
      const baseline = {};
      const list = (data?.data || []).map((v) => {
        const d = gramsToDisplay(v.variation_weight_grams);
        baseline[v._id] = {
          variation_weight_grams: v.variation_weight_grams ?? null,
          variation_badge_text: v.variation_badge_text ?? null,
          variation_badge_icon_key: v.variation_badge_icon_key ?? null,
        };
        return { ...v, _wValue: d.value, _wUnit: d.unit };
      });
      variationBaselineRef.current = baseline;
      setVariations(list);
    } catch {
      toast.error("Failed to load variations");
    } finally {
      setVariationsLoading(false);
    }
  };

  useEffect(() => {
    loadVariations(product?._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  // Rows whose editable fields actually differ from what the server sent.
  const dirtyVariationRows = () => {
    const out = [];
    for (const v of variations) {
      const base = variationBaselineRef.current[v._id];
      if (!base) continue;
      const next = {
        variation_weight_grams: displayToGrams(v._wValue, v._wUnit),
        variation_badge_text: (v.variation_badge_text || "").trim() || null,
        variation_badge_icon_key: v.variation_badge_icon_key || null,
      };
      const changed =
        next.variation_weight_grams !== base.variation_weight_grams ||
        next.variation_badge_text !== base.variation_badge_text ||
        next.variation_badge_icon_key !== base.variation_badge_icon_key;
      if (changed) out.push({ _id: v._id, ...next });
    }
    return out;
  };

  // Pending floating-image uploads, deferred until "Save Changes".
  // Picking a file no longer hits S3 immediately (that left orphaned uploads when
  // the admin never saved). Instead the raw File lives here (key → File) and is
  // uploaded once, inside onSubmit, just before the PATCH. Key convention:
  //   "repl_<themeAssetId>"  — Panel A theme-asset replacement
  //   "extra_<localId>"      — Panel B product-only extra (stable uuid, NOT index)
  const [pendingFloatUploads, setPendingFloatUploads] = useState({});
  // Revoke any outstanding blob previews on unmount (admin navigates away with
  // unsaved file picks) so object URLs don't leak. Ref keeps the latest map
  // without re-running the effect on every pick.
  const pendingRef = useRef(pendingFloatUploads);
  pendingRef.current = pendingFloatUploads;
  useEffect(
    () => () => {
      Object.values(pendingRef.current).forEach((f) => {
        if (f?._previewUrl) URL.revokeObjectURL(f._previewUrl);
      });
    },
    [],
  );
  useEffect(() => {
    setNutritionRows(product?.nutrition?.rows || []);
    setNutritionTiles(product?.nutrition?.info_tiles || []);
    setFloatingImages(product?.floating_images || []);
    setFloatingOverrides(withLocalIds(product?.floating_overrides));
    setPendingFloatUploads({});
    setDescription(product?.description || "");
    setCustomFields(product?.custom_fields || []);
  }, [product]);

  // Generic uploader — pushes file to S3 then writes the URL + key into the
  // two given RHF fields. Used by OG image and the per-section side images.
  const uploadToFields = async (file, urlField, keyField, label = "Image") => {
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${BASE_URL}/image_upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (data?.success && data?.data) {
        setValue(urlField, data.data.Location, { shouldDirty: true });
        setValue(keyField, data.data.Key, { shouldDirty: true });
        toast.success(`${label} uploaded`);
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload error");
    }
  };
  const handleOgUpload = (file) =>
    uploadToFields(file, "og_image", "og_image_key", "OG image");

  // Raw S3 uploader — returns { asset_url, asset_key } or throws. Used to flush
  // the deferred floating-image uploads at Save time.
  const uploadFloatFile = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`${BASE_URL}/image_upload`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = await res.json();
    if (data?.success && data?.data) {
      return { asset_url: data.data.Location, asset_key: data.data.Key };
    }
    throw new Error(data?.message || "Image upload failed");
  };

  // Placeholder context for FAQ template fill — pulls from product + form state
  // Niche-neutral, DB-driven placeholder map: universal core fields + every
  // custom_field (spec) and nutrition row of THIS product, keyed by English
  // slug. shelf_life / origin come from the live nutrition-tab form values as
  // back-compat extras (so they still work even when not in custom_fields).
  const faqContext = buildProductPlaceholderContext(product, {
    shelf_life: watch("nutrition.shelf_life"),
    origin: watch("nutrition.origin"),
  });

  // This product's full category lineage (leaf + every ancestor) as id strings.
  // The FAQ picker uses this to surface templates scoped to any of these
  // categories — so a template tagged to a parent suggests for this product too.
  const productCategoryIds = [
    product?.category_id?._id || product?.category_id,
    ...(Array.isArray(product?.category_path) ? product.category_path : []),
  ]
    .filter(Boolean)
    .map((c) => (typeof c === "object" ? String(c._id) : String(c)));

  // Resolve the floating assets the product inherits from its CURRENTLY SELECTED
  // theme (live — follows the theme dropdown). Prefer the freshly-fetched active
  // theme list; fall back to the product's populated theme_id object.
  const selectedThemeId = watch("theme_id");
  const selectedTheme =
    activeThemes.find((t) => String(t._id) === String(selectedThemeId)) ||
    (product?.theme_id && typeof product.theme_id === "object" ? product.theme_id : null);
  const inheritedFloatingAssets = Array.isArray(selectedTheme?.floating_assets)
    ? selectedTheme.floating_assets
    : [];

  const addFaq = () =>
    setFaqs((prev) =>
      prev.length >= 12 ? prev : [...prev, { question: "", answer: "" }],
    );
  const updateFaq = (i, patch) =>
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const removeFaq = (i) => setFaqs((prev) => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (form) => {
    setSubmitting(true);
    try {
      // ── Flush deferred floating-image uploads FIRST ──────────────────────
      // Picking a file only stored a blob preview + the raw File (in
      // pendingFloatUploads). Upload them all now; if ANY upload fails we abort
      // the whole save (no PATCH) so we never persist half the rows. Resolved
      // URLs are written onto copies of the replacement/extra rows below.
      let resolvedReplacements = (floatingOverrides.replacements || []).map((r) => ({
        ...r,
      }));
      let resolvedExtras = (floatingOverrides.extras || []).map((e) => ({ ...e }));
      const pendingKeys = Object.keys(pendingFloatUploads);
      if (pendingKeys.length) {
        try {
          const uploaded = await Promise.all(
            pendingKeys.map(async (key) => ({
              key,
              ...(await uploadFloatFile(pendingFloatUploads[key])),
            })),
          );
          for (const u of uploaded) {
            if (u.key.startsWith("repl_")) {
              const themeAssetId = u.key.slice(5);
              const row = resolvedReplacements.find(
                (r) => r.theme_asset_id === themeAssetId,
              );
              if (row) {
                row.asset_url = u.asset_url;
                row.asset_key = u.asset_key;
              } else {
                resolvedReplacements.push({
                  theme_asset_id: themeAssetId,
                  asset_url: u.asset_url,
                  asset_key: u.asset_key,
                });
              }
            } else if (u.key.startsWith("extra_")) {
              const localId = u.key.slice(6);
              const row = resolvedExtras.find((e) => e._localId === localId);
              if (row) {
                row.asset_url = u.asset_url;
                row.asset_key = u.asset_key;
              }
            }
          }
        } catch (err) {
          toast.error(err.message || "Floating image upload failed — not saved");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        _id: product._id,
        theme_id: form.theme_id || null,
        description,
        // Drop rows missing label/value here too (backend also normalizes).
        custom_fields: (customFields || []).filter(
          (r) => (r?.label || "").trim() && (r?.value || "").trim(),
        ),
        short_description: form.short_description,
        badge_text: form.badge_text,
        hero_corner_badge: form.hero_corner_badge,
        video_title: form.video_title,
        video_link: form.video_link,
        // benefits: {text, icon_url?, icon_key?} rows; drop empty-text rows
        // (backend also normalizes/filters).
        benefits: (benefits || [])
          .map((b) => ({
            text: (b?.text || "").trim(),
            icon_url: b?.icon_url || undefined,
            icon_key: b?.icon_key || undefined,
          }))
          .filter((b) => b.text),
        short_features: shortFeatures,
        process_steps: processSteps,
        use_cases: useCases,
        faqs,
        floating_images: floatingImages.filter((f) => f.asset_url),
        // Section-anchored override layer. Drop empty extras (no image yet) so
        // we never persist half-filled rows. Strip local-only UI fields
        // (_localId / _previewUrl / _pendingKey) that exist purely for the
        // deferred-upload + blob-preview flow.
        floating_overrides: {
          hidden_ids: floatingOverrides.hidden_ids || [],
          replacements: resolvedReplacements
            .filter((r) => r.theme_asset_id && r.asset_url)
            .map(({ _previewUrl, _pendingKey, ...r }) => r),
          extras: resolvedExtras
            .filter((e) => e.asset_url)
            .map(({ _localId, _previewUrl, _pendingKey, ...e }) => e),
        },
        nutrition: {
          per_serving: form.nutrition_per_serving || "",
          rows: nutritionRows
            .map((r) => ({ label: (r.label || "").trim(), value: (r.value || "").trim() }))
            .filter((r) => r.label || r.value),
          info_tiles: nutritionTiles
            .map((t) => ({
              label: (t.label || "").trim(),
              value: (t.value || "").trim(),
              icon_key: t.icon_key || "",
            }))
            .filter((t) => t.label || t.value),
        },
        og_image: form.og_image,
        og_image_key: form.og_image_key,
        og_title: form.og_title,
        og_description: form.og_description,
        benefits_side_image: form.benefits_side_image,
        benefits_side_image_key: form.benefits_side_image_key,
        use_cases_side_image: form.use_cases_side_image,
        use_cases_side_image_key: form.use_cases_side_image_key,
        faq_side_image: form.faq_side_image,
        faq_side_image_key: form.faq_side_image_key,
        benefits_side_image_show: form.benefits_side_image_show,
        use_cases_side_image_show: form.use_cases_side_image_show,
        faq_side_image_show: form.faq_side_image_show,
        size_guide_title: form.size_guide_title,
        size_guide_note: form.size_guide_note,
        // Send columns first so the backend can pad rows to the column count.
        size_guide_columns: sizeGuideColumns.map((c) => String(c ?? "").trim()),
        size_guide_rows: sizeGuideRows.map((r) =>
          (Array.isArray(r) ? r : []).map((c) => String(c ?? "").trim()),
        ),
      };

      // ── Variation rows go first ─────────────────────────────────────────────
      // Same reasoning as the floating-image uploads above: do the part that can
      // fail on its own terms BEFORE the page-content PATCH, and abort the whole
      // save if it fails. Otherwise the content persists, the variations don't,
      // and the admin is told "saved". Only changed rows are sent (a 409 here
      // means another admin deleted a variation while this form was open).
      const dirtyRows = dirtyVariationRows();
      if (dirtyRows.length) {
        let vRes;
        let vData;
        try {
          vRes = await fetch(`${BASE_URL}/variation/bulk`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variations: dirtyRows }),
          });
          // A 413 (body too large) is answered by Express with HTML, so guard
          // the parse rather than letting res.json() throw an opaque error.
          vData = await vRes.json();
        } catch {
          toast.error("Variation save failed — nothing was saved");
          setSubmitting(false);
          return;
        }
        if (!vData?.success) {
          toast.error(vData?.message || "Variation save failed — nothing was saved");
          // 409 = a variation was deleted elsewhere while this form was open.
          // The backend wrote nothing, but our table is stale — resync it so the
          // admin sees reality before retrying.
          if (vRes.status === 409) loadVariations(product?._id);
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch(`${BASE_URL}/product/page-content`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Page content updated");
        // Pending uploads are now persisted; release blob previews + clear the
        // map so a second Save doesn't re-upload the same files (double orphan).
        Object.values(pendingFloatUploads).forEach((f) => {
          if (f?._previewUrl) URL.revokeObjectURL(f._previewUrl);
        });
        setPendingFloatUploads({});
        // Re-seed from the server so the table (and the dirty baseline) reflect
        // what was actually persisted; `refetch` only reloads the product doc.
        if (dirtyRows.length) loadVariations(product?._id);
        refetch?.();
      } else {
        toast.error(data?.message || "Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // Context object used by sidebar completeness badges. `watch()` triggers a
  // re-render on form changes so badges update live.
  const watched = watch();
  const completenessCtx = {
    form: watched,
    shortFeatures,
    processSteps,
    useCases,
    faqs,
    nutritionRows,
    nutritionTiles,
    sizeGuideRows,
    floatingImages,
    floatingOverrides,
    description,
    customFields,
    benefits,
    product,
  };

  return (
    <form
      id="page-content-form"
      onSubmit={handleSubmit(onSubmit)}
      // Fill the page wrapper (which is now a full-height flex cell) and let the
      // body scroll internally — no hardcoded viewport math needed.
      className="flex flex-col h-full min-h-0"
    >
      {/* Sticky header: title + Back + Save/Open-live. The Save button submits
          this form by id (it sits in the header, outside the scroll area), so
          the admin never scrolls the whole page to save. */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 mb-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-800 truncate">
            Page Content: {product?.product_name}
          </h1>
          <p className="text-sm text-gray-500">
            Theme, hero, benefits, FAQ, nutrition, OG meta এবং variation weight এখান থেকে edit করো।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageContentActions
            livePath={
              product?.product_slug ? `/products/${product.product_slug}` : null
            }
            saving={submitting}
            formId="page-content-form"
          />
          <Link
            to="/product/product-list"
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            <FaArrowLeft /> Back
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0">
      <PageContentLayout
        sections={PAGE_CONTENT_SECTIONS}
        ctx={completenessCtx}
        active={activeTab}
        onChange={setActiveTab}
      >
        {/* All sections stay mounted (just hidden) so RHF input state and
            unsaved changes are preserved when switching tabs. */}

        <TabPane id="theme" active={activeTab}>
          <Card>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select {...register("theme_id")} className="form-input">
              <option value="">— Select theme —</option>
              {/* If the product's saved theme isn't in the active list (it was
                  deactivated, or the list is still loading), surface it as its
                  own option so the dropdown shows the real assigned value
                  instead of falling back to "Select theme". */}
              {(() => {
                const savedId =
                  product?.theme_id?._id || product?.theme_id || "";
                const inList = activeThemes.some(
                  (t) => String(t._id) === String(savedId),
                );
                if (savedId && !inList) {
                  const savedName =
                    product?.theme_id?.theme_name || "Assigned theme";
                  const savedFor = product?.theme_id?.theme_for
                    ? ` (${product.theme_id.theme_for})`
                    : "";
                  return (
                    <option value={savedId}>
                      {savedName}
                      {savedFor} — inactive
                    </option>
                  );
                }
                return null;
              })()}
              {activeThemes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.theme_name} ({t.theme_for})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Active theme গুলো দেখাচ্ছে। আলাদা color দরকার হলে{" "}
              <Link to="/theme/create" className="text-blueColor-600 hover:underline">
                নতুন theme তৈরি করো
              </Link>{" "}
              — তারপর এখানে assign করো।
            </p>
          </Card>
        </TabPane>

        <TabPane id="description" active={activeTab}>
          <Card>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Product Description
            </label>
            <p className="text-xs text-gray-400 mb-2">
              পণ্যের মূল বিবরণ (rich text)। এটা product edit form-এর Description-এর
              সাথে একই — যেখান থেকেই শেষবার সেভ হবে সেটাই দেখাবে।
            </p>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter product description"
            />
          </Card>
        </TabPane>

        <TabPane id="custom_spec" active={activeTab}>
          <Card>
            <p className="text-xs text-gray-400 mb-3">
              Advanced — Custom Spec rows (label / value / optional icon)। PDP-তে
              বিবরণের পাশে spec টেবিল হিসেবে দেখায়। এটাও product edit form-এর
              একই block — শেষ সেভ জেতে।
            </p>
            <CustomFieldsBlock
              customFields={customFields}
              setCustomFields={setCustomFields}
            />
          </Card>
        </TabPane>

        <TabPane id="hero" active={activeTab}>
          <Card>
            <div className="grid md:grid-cols-3 gap-4">
              <FieldBlock
                label="Badge Text"
                hint="নাম/দামের পাশে ছোট badge"
              >
                <div className="relative">
                  <input
                    {...register("badge_text")}
                    className="form-input pr-8"
                    placeholder="প্রিমিয়াম কোয়ালিটি"
                    maxLength={20}
                  />
                  <CharCounter value={watch("badge_text")} max={20} />
                </div>
              </FieldBlock>
              <FieldBlock
                label="Hero Corner Badge"
                hint="Hero ছবির কোণায় ভেসে থাকা badge"
              >
                <div className="relative">
                  <input
                    {...register("hero_corner_badge")}
                    className="form-input pr-8"
                    placeholder="নতুন / বেস্ট সেলার"
                    maxLength={20}
                  />
                  <CharCounter value={watch("hero_corner_badge")} max={20} />
                </div>
              </FieldBlock>
              <FieldBlock
                label="Short Description / Tagline"
                hint="হিরো-র নিচে এক লাইনের পরিচিতি"
              >
                <div className="relative">
                  <input
                    {...register("short_description")}
                    className="form-input pr-10"
                    placeholder="স্বাস্থ্যকর স্ন্যাকস, প্রতিদিনের এনার্জি"
                    maxLength={160}
                  />
                  <CharCounter value={watch("short_description")} max={160} />
                </div>
              </FieldBlock>
            </div>

            <div className="mt-5">
              <IconTextRepeater
                value={shortFeatures}
                onChange={setShortFeatures}
                label="Short Features (hero icons row)"
                helper="No Sugar, No Preservative, Rich in Fiber, Kids Friendly"
                max={4}
                maxLen={30}
              />
            </div>
          </Card>
        </TabPane>

        <TabPane id="video" active={activeTab}>
          <Card>
            <FieldBlock
              label="Video Section Title"
              hint="খালি রাখলে product নাম দিয়ে default heading দেখাবে"
            >
              <input
                {...register("video_title")}
                className="form-input"
                placeholder="দেখুন কিভাবে তৈরি হয়"
              />
            </FieldBlock>

            <div className="mt-4">
              <FieldBlock
                label="YouTube / Vimeo Link"
                hint="ভিডিও লিংক পেস্ট করো — PDP-তে embed হয়ে দেখাবে। ফাইল আপলোড করতে product edit form ব্যবহার করো।"
              >
                <input
                  {...register("video_link")}
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </FieldBlock>
            </div>

            <div className="mt-5">
              <IconTextRepeater
                value={processSteps}
                onChange={setProcessSteps}
                label="Process Steps (how it's made)"
                helper="তাজা ফল থেকে তৈরি / পানি বিয়োজন প্রসেস / পুষ্টিগুণ অক্ষুন্ন থাকে / পরীক্ষিত ও প্রাকৃতিক"
                max={4}
                maxLen={60}
              />
              <p className="text-xs text-amber-600 mt-2">
                ⓘ Video না থাকলে এই section frontend-এ দেখাবে না (heading + steps সবই lukano)।
              </p>
            </div>
          </Card>
        </TabPane>

        <TabPane id="benefits" active={activeTab}>
          <Card>
            <IconTextRepeater
              value={benefits}
              onChange={setBenefits}
              label="Benefits (উপকারিতা)"
              helper="প্রতিটি উপকারিতা ১-২ লাইনে রাখো — বিস্তারিত লেখা Description-এ দাও। icon না দিলে ডিফল্ট টিক দেখাবে।"
              max={6}
              maxLen={90}
            />

            <SideImageField
              label="Side Image (ডান পাশে যে ছবি দেখাবে)"
              hint="খালি রাখলে product-এর main image ব্যবহার হবে।"
              url={watch("benefits_side_image")}
              showValue={watch("benefits_side_image_show")}
              onToggle={(v) =>
                setValue("benefits_side_image_show", v, { shouldDirty: true })
              }
              onUpload={(file) =>
                uploadToFields(
                  file,
                  "benefits_side_image",
                  "benefits_side_image_key",
                  "Benefits image",
                )
              }
              onClear={() => {
                setValue("benefits_side_image", "", { shouldDirty: true });
                setValue("benefits_side_image_key", "", { shouldDirty: true });
              }}
            />
          </Card>
        </TabPane>

        <TabPane id="use_cases" active={activeTab}>
          <Card>
            <IconTextRepeater
              value={useCases}
              onChange={setUseCases}
              label="Use cases"
              helper="অফিস স্ন্যাকস / স্কুল টিফিন / জিম-পরবর্তী / ভ্রমণ"
              max={6}
              maxLen={70}
            />

            <SideImageField
              label="Side Image (ডান পাশে যে ছবি দেখাবে)"
              hint="খালি রাখলে product-এর main image ব্যবহার হবে।"
              url={watch("use_cases_side_image")}
              showValue={watch("use_cases_side_image_show")}
              onToggle={(v) =>
                setValue("use_cases_side_image_show", v, { shouldDirty: true })
              }
              onUpload={(file) =>
                uploadToFields(
                  file,
                  "use_cases_side_image",
                  "use_cases_side_image_key",
                  "Use cases image",
                )
              }
              onClear={() => {
                setValue("use_cases_side_image", "", { shouldDirty: true });
                setValue("use_cases_side_image_key", "", { shouldDirty: true });
              }}
            />
          </Card>
        </TabPane>

        <TabPane id="size_guide" active={activeTab}>
          <Card>
            <p className="text-xs text-gray-500 mb-3">
              সাইজ চার্ট / ফিট গাইড — যেকোনো niche-এ (জুতা / জামা / আংটি …)। কলামের
              নাম নিজে দিন, ChatGPT/Excel থেকে টেবিল পেস্টও করতে পারেন। খালি রাখলে
              PDP-তে দেখাবে না। (Add Product-এ আপলোড করা size-chart ছবিটিও PDP-তে
              আলাদাভাবে দেখায়।)
            </p>
            <div className="mb-4 max-w-sm">
              <FieldBlock label="Title" hint="section heading (যেমন: সাইজ চার্ট / Fit Guide)">
                <input
                  {...register("size_guide_title")}
                  className="form-input"
                  placeholder="যেমন: সাইজ চার্ট"
                />
              </FieldBlock>
            </div>

            <SizeGuideEditor
              columns={sizeGuideColumns}
              rows={sizeGuideRows}
              onChange={({ columns, rows }) => {
                setSizeGuideColumns(columns);
                setSizeGuideRows(rows);
              }}
            />

            <div className="mt-5 max-w-xl">
              <FieldBlock
                label="মাপ নির্দেশিকা (note)"
                hint="কীভাবে মাপবেন — table-এর নিচে দেখাবে (optional)"
              >
                <textarea
                  {...register("size_guide_note")}
                  rows={2}
                  className="form-input"
                  placeholder="যেমন: পা মাটিতে রেখে গোড়ালি থেকে বুড়ো আঙুল পর্যন্ত মাপুন (CM-এ)"
                />
              </FieldBlock>
            </div>
          </Card>
        </TabPane>

        <TabPane id="nutrition" active={activeTab}>
          <Card>
            <p className="text-xs text-gray-500 mb-3">
              পুষ্টি টেবিল + ইনফো টাইল — যা খুশি label/value যোগ করো। দুটোই খালি থাকলে
              section দেখাবে না।
            </p>
            <div className="mb-5 max-w-sm">
              <FieldBlock label="Per Serving" hint="heading-এর পাশে দেখাবে (e.g. প্রতি ১০০g)">
                <input
                  {...register("nutrition_per_serving")}
                  className="form-input"
                  placeholder="যেমন: প্রতি ১০০g"
                />
              </FieldBlock>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <LabelValueRepeater
                title="Nutrient Rows (টেবিল)"
                helper="ক্যালরি / প্রোটিন / ফাইবার ... (label + value)"
                value={nutritionRows}
                onChange={setNutritionRows}
                max={12}
                labelLen={30}
                valueLen={30}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Info Tiles{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (icon + label + value)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <PasteTableButton
                      onAppend={(rows) =>
                        setNutritionTiles((p) => [
                          ...p,
                          ...rows.map((r) => ({ icon_key: "", ...r })),
                        ])
                      }
                      onReplace={(rows) =>
                        setNutritionTiles(
                          rows.map((r) => ({ icon_key: "", ...r })),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNutritionTiles((p) =>
                          p.length >= 6
                            ? p
                            : [...p, { icon_key: "", label: "", value: "" }],
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blueColor-50 text-blueColor-600 rounded hover:bg-blueColor-100"
                    >
                      <FaPlus /> Add
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 -mt-1">
                  উপাদান / শেলফ লাইফ / দেশ — ডান পাশের tile।
                </p>
                {nutritionTiles.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">কিছু যোগ করা হয়নি।</p>
                ) : (
                  nutritionTiles.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-white border rounded"
                    >
                      <IconPicker
                        value={t.icon_key || null}
                        onChange={(key) =>
                          setNutritionTiles((p) =>
                            p.map((row, idx) =>
                              idx === i ? { ...row, icon_key: key || "" } : row,
                            ),
                          )
                        }
                      />
                      <div className="flex-1 space-y-1">
                        <div className="relative">
                          <input
                            type="text"
                            value={t.label || ""}
                            onChange={(e) =>
                              setNutritionTiles((p) =>
                                p.map((row, idx) =>
                                  idx === i ? { ...row, label: e.target.value } : row,
                                ),
                              )
                            }
                            placeholder="Label (যেমন: শেলফ লাইফ)"
                            maxLength={30}
                            className="form-input w-full pr-7"
                          />
                          <CharCounter value={t.label} max={30} />
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={t.value || ""}
                            onChange={(e) =>
                              setNutritionTiles((p) =>
                                p.map((row, idx) =>
                                  idx === i ? { ...row, value: e.target.value } : row,
                                ),
                              )
                            }
                            placeholder="Value (যেমন: ৬ মাস)"
                            maxLength={40}
                            className="form-input w-full pr-7"
                          />
                          <CharCounter value={t.value} max={40} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setNutritionTiles((p) => p.filter((_, idx) => idx !== i))
                        }
                        className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 flex-shrink-0"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </TabPane>

        <TabPane id="brand_promise" active={activeTab}>
          <Card>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🤝</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  আমাদের প্রতিশ্রুতি (Brand Promise)
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  এই section সব product-এর PDP-তে একই ভাবে দেখায় (পুষ্টি তথ্যের
                  ডান পাশে) — তাই এটা একটা <strong>common / site-wide</strong> setting,
                  per-product নয়। এখান থেকে edit হয় না; নিচের বাটনে গিয়ে একবার সেট
                  করলে সব product-এ প্রযোজ্য হবে।
                </p>
                <Link
                  to="/trust-point"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blueColor-600 text-white rounded text-sm font-semibold hover:bg-blueColor-700"
                >
                  Brand Promise সম্পাদনা করো →
                </Link>
                <p className="text-[11px] text-amber-600 mt-3">
                  ⓘ unsaved Page Content পরিবর্তন থাকলে আগে Save করে নিও — অন্য পেজে
                  গেলে হারিয়ে যেতে পারে।
                </p>
              </div>
            </div>
          </Card>
        </TabPane>

        <TabPane id="faqs" active={activeTab}>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">
                Product page এ যে প্রশ্নোত্তর দেখাবে।
              </p>
              <button
                type="button"
                onClick={() => setFaqPickerOpen(true)}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
              >
                <FaListUl /> Pick from Templates
              </button>
            </div>
            <div className="space-y-2">
              {faqs.length === 0 && (
                <p className="text-xs text-gray-400 italic">কোনো FAQ যোগ করা হয়নি।</p>
              )}
              {faqs.map((f, i) => (
                <div key={i} className="p-2 bg-white border rounded space-y-2">
                  <div className="relative">
                    <input
                      value={f.question}
                      onChange={(e) => updateFaq(i, { question: e.target.value })}
                      placeholder="Question"
                      maxLength={120}
                      className="form-input pr-10"
                    />
                    <CharCounter value={f.question} max={120} />
                  </div>
                  <div>
                    <textarea
                      value={f.answer}
                      onChange={(e) => updateFaq(i, { answer: e.target.value })}
                      placeholder="Answer"
                      rows={2}
                      maxLength={400}
                      className="form-input"
                    />
                    <CharCounter value={f.answer} max={400} block />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    <FaTrash className="inline mr-1" /> Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-blueColor-50 text-blueColor-600 rounded hover:bg-blueColor-100"
              >
                <FaPlus /> Add FAQ manually
              </button>
            </div>

            <SideImageField
              label="Side Image (FAQ-এর ডান পাশে যে ছবি দেখাবে)"
              hint="খালি রাখলে product-এর first other image / main image ব্যবহার হবে।"
              url={watch("faq_side_image")}
              showValue={watch("faq_side_image_show")}
              onToggle={(v) =>
                setValue("faq_side_image_show", v, { shouldDirty: true })
              }
              onUpload={(file) =>
                uploadToFields(
                  file,
                  "faq_side_image",
                  "faq_side_image_key",
                  "FAQ image",
                )
              }
              onClear={() => {
                setValue("faq_side_image", "", { shouldDirty: true });
                setValue("faq_side_image_key", "", { shouldDirty: true });
              }}
            />
          </Card>
        </TabPane>

        <TabPane id="floating" active={activeTab}>
          <Card>
            <p className="text-xs text-gray-500 mb-3">
              Floating fruit ছবি এখন <strong>section অনুযায়ী</strong> বসে। theme থেকে
              আসা global floating গুলো এখানে hide / replace করা যায়, আর এই product-এর
              জন্য বাড়তি floating যোগ করা যায়।
            </p>
            <ProductFloatingTab
              themeAssets={inheritedFloatingAssets}
              value={floatingOverrides}
              onChange={setFloatingOverrides}
              pendingUploads={pendingFloatUploads}
              onPendingChange={setPendingFloatUploads}
            />
          </Card>
        </TabPane>

        <TabPane id="variations" active={activeTab}>
          <Card>
            <p className="text-xs text-gray-500 mb-3">
              প্রতিটি variation এর জন্য weight (Pathao courier weight calc এ ব্যবহার হবে) + অপশনাল badge text।
            </p>
            <VariationWeightEditor
              value={variations}
              onChange={setVariations}
              loading={variationsLoading}
            />
          </Card>
        </TabPane>

        <TabPane id="og" active={activeTab}>
          <Card>
            <div className="grid md:grid-cols-2 gap-4">
              <FieldBlock label="OG Title" hint="খালি রাখলে meta_title ব্যবহার হবে">
                <input
                  {...register("og_title")}
                  className="form-input"
                  placeholder="(default: meta_title)"
                />
              </FieldBlock>
              <FieldBlock
                label="OG Description"
                hint="খালি রাখলে meta_description ব্যবহার হবে"
              >
                <input
                  {...register("og_description")}
                  className="form-input"
                  placeholder="(default: meta_description)"
                />
              </FieldBlock>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">OG Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleOgUpload(e.target.files?.[0])}
                  className="form-input"
                />
                {watch("og_image") && (
                  <img
                    src={watch("og_image")}
                    alt="OG"
                    className="mt-2 w-32 h-32 object-cover rounded border"
                  />
                )}
              </div>
            </div>
          </Card>
        </TabPane>
      </PageContentLayout>
      </div>

      <FaqPickerModal
        open={faqPickerOpen}
        onClose={() => setFaqPickerOpen(false)}
        productCtx={faqContext}
        productCategoryIds={productCategoryIds}
        onPick={(faq) => {
          setFaqs((prev) => [...prev, faq]);
          setFaqPickerOpen(false);
          toast.success("FAQ added — edit if needed before saving");
        }}
      />
    </form>
  );
};

// One tab body. Stays mounted (CSS-hidden when inactive) so RHF/local state
// survives tab switches.
const TabPane = ({ id, active, children }) => (
  <div className={id === active ? "" : "hidden"}>{children}</div>
);

// Plain content card — replaces the old Section wrapper now that PageContentLayout
// already provides the heading and grouping.
const Card = ({ children }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-5">{children}</div>
);

// Reusable label + helper-text + input wrapper for short form fields.
const FieldBlock = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-medium mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

// Remaining-characters countdown (160 → 159 → …). Turns amber in the last 5.
// Place inside a relative-positioned wrapper, or pass `block` for under-field.
const CharCounter = ({ value, max, block = false }) => {
  if (!max) return null;
  const left = max - (value || "").length;
  const warn = left <= 5;
  if (block) {
    return (
      <span
        className={`block text-right text-[10px] mt-0.5 tabular-nums ${
          warn ? "text-amber-500 font-semibold" : "text-gray-300"
        }`}
      >
        {left}
      </span>
    );
  }
  return (
    <span
      className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none tabular-nums ${
        warn ? "text-amber-500 font-semibold" : "text-gray-300"
      }`}
    >
      {left}
    </span>
  );
};

// Side-accent image uploader (used in Benefits + Use Cases tabs). Shows the
// current image with a thumbnail, lets admin replace or clear it; on clear the
// storefront falls back to product.main_image.
const SideImageField = ({
  label,
  hint,
  url,
  onUpload,
  onClear,
  showValue,
  onToggle,
}) => {
  // `showValue` undefined (legacy product, no flag saved) is treated as ON, to
  // mirror the storefront `!== false` gate. When OFF, no image (incl. the
  // main_image fallback) renders on the PDP.
  const isOn = showValue !== false;
  return (
  <div className="mt-5 pt-5 border-t border-gray-100">
    {onToggle && (
      <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isOn}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-xs font-medium">
          PDP-তে এই section-এ পাশের ছবি দেখাও
        </span>
      </label>
    )}
    <label className="block text-xs font-medium mb-1">{label}</label>
    {onToggle && !isOn && (
      <p className="text-[11px] text-amber-600 mb-1">
        ছবি বন্ধ — PDP-তে এই section-এ কোনো পাশের ছবি দেখাবে না (main image fallback সহ)।
      </p>
    )}
    <div
      className={`flex items-start gap-3 ${isOn ? "" : "opacity-50 pointer-events-none"}`}
    >
      {url ? (
        <img
          src={url}
          alt=""
          className="w-20 h-20 object-cover rounded border bg-white"
        />
      ) : (
        <div className="w-20 h-20 rounded border bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
          main_image
          <br />
          fallback
        </div>
      )}
      <div className="flex-1 space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files?.[0])}
          className="form-input text-xs"
        />
        {url && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-600 hover:underline"
          >
            <FaTrash className="inline mr-1" size={10} /> Remove (use main image)
          </button>
        )}
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  </div>
  );
};

// Simple label+value repeater (no icon). Used for the nutrient table rows.
// max caps the row count; labelLen/valueLen cap each field so a pasted
// paragraph can't blow out the PDP table.
const LabelValueRepeater = ({
  title,
  helper,
  value = [],
  onChange,
  max = 0,
  labelLen = 0,
  valueLen = 0,
}) => {
  const add = () => {
    if (max && value.length >= max) {
      toast.info(`Max ${max} rows allowed`);
      return;
    }
    onChange([...value, { label: "", value: "" }]);
  };
  const update = (i, patch) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  // Honour the row cap on paste too (trim overflow rows).
  const capRows = (rows) => (max ? rows.slice(0, max) : rows);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">{title}</label>
        <div className="flex items-center gap-2">
          <PasteTableButton
            onAppend={(rows) => onChange(capRows([...value, ...rows]))}
            onReplace={(rows) => onChange(capRows(rows))}
          />
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blueColor-50 text-blueColor-600 rounded hover:bg-blueColor-100"
          >
            <FaPlus /> Add
          </button>
        </div>
      </div>
      {helper && <p className="text-xs text-gray-400 -mt-1">{helper}</p>}
      {value.length === 0 ? (
        <p className="text-xs text-gray-400 italic">কিছু যোগ করা হয়নি।</p>
      ) : (
        value.map((row, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-white border rounded">
            <div className="relative flex-1">
              <input
                type="text"
                value={row.label || ""}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label (যেমন: ক্যালরি)"
                maxLength={labelLen || undefined}
                className="form-input w-full pr-7"
              />
              <CharCounter value={row.label} max={labelLen} />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={row.value || ""}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="Value (যেমন: ৩১০ kcal)"
                maxLength={valueLen || undefined}
                className="form-input w-full pr-7"
              />
              <CharCounter value={row.value} max={valueLen} />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 flex-shrink-0"
            >
              <FaTrash />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default ProductPageContentForm;
