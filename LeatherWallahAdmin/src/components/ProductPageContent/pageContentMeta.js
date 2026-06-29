// Section metadata for the Page Content editor sidebar.
// Each entry: { id, label (BN), hint (one-line where it shows on PDP),
// isComplete(formContext) → boolean }.
//
// `formContext` is { form, shortFeatures, processSteps, useCases, faqs,
//   nutritionRows, nutritionTiles, product } — passed in from the editor so
// these helpers stay framework-agnostic.

const has = (v) => typeof v === "string" && v.trim().length > 0;

// Section order follows the PDP top-to-bottom flow so the sidebar reads the
// same way the page renders: Theme (global) → Hero → Description → Spec →
// Video → Benefits → Use Cases → Nutrition → FAQs → Floating → Variations → OG.
export const PAGE_CONTENT_SECTIONS = [
  {
    id: "theme",
    label: "Theme",
    hint: "পুরো PDP-র রং/ফন্ট",
    isComplete: ({ form }) => !!form?.theme_id,
  },
  {
    id: "hero",
    label: "Hero",
    hint: "ছবির পাশের badge, tagline, icon row",
    isComplete: ({ form, shortFeatures }) =>
      has(form?.short_description) ||
      has(form?.badge_text) ||
      has(form?.hero_corner_badge) ||
      (shortFeatures?.length || 0) > 0,
  },
  {
    id: "description",
    label: "Description",
    hint: "পণ্যের মূল বিবরণ (rich text)",
    // Quill returns "<p><br></p>" for empty — strip tags before checking.
    isComplete: ({ description }) =>
      has(String(description || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")),
  },
  {
    id: "custom_spec",
    label: "Custom Spec",
    hint: "label/value spec rows",
    isComplete: ({ customFields }) =>
      (customFields || []).some(
        (r) => (r?.label || "").trim() && (r?.value || "").trim(),
      ),
  },
  {
    id: "video",
    label: "Video",
    hint: "Video heading + process steps",
    isComplete: ({ form, processSteps, product }) =>
      has(form?.video_title) ||
      (processSteps?.length || 0) > 0 ||
      has(product?.main_video),
  },
  {
    id: "benefits",
    label: "Benefits",
    hint: "উপকারিতা checklist",
    // benefits is now an array of { text, icon_url?, icon_key? } (was a
    // "\n"-joined textarea). Count any row with non-empty text. Back-compat:
    // legacy string rows still count.
    isComplete: ({ benefits }) =>
      (benefits || []).some((b) =>
        typeof b === "string" ? b.trim().length > 0 : has(b?.text),
      ),
  },
  {
    id: "use_cases",
    label: "Use Cases",
    hint: "কোথায় ব্যবহার করবেন",
    isComplete: ({ useCases }) => (useCases?.length || 0) > 0,
  },
  {
    id: "size_guide",
    label: "Size Guide",
    hint: "সাইজ চার্ট / ফিট গাইড (যেকোনো niche)",
    // Complete when the grid has at least one row, or an add-product size_chart
    // image exists (that image renders on the PDP too).
    isComplete: ({ sizeGuideRows, product }) =>
      (sizeGuideRows?.length || 0) > 0 || has(product?.size_chart),
  },
  {
    id: "nutrition",
    label: "Nutrition",
    hint: "পুষ্টি table + info tiles",
    isComplete: ({ nutritionRows, nutritionTiles }) =>
      (nutritionRows?.length || 0) > 0 || (nutritionTiles?.length || 0) > 0,
  },
  {
    id: "brand_promise",
    label: "Brand Promise",
    hint: "আমাদের প্রতিশ্রুতি (সব product-এ common)",
    // Site-wide module (trustPoint), edited on its own /trust-point page — this
    // tab is just an info + shortcut. Always neutral (no per-product complete).
    isComplete: () => false,
  },
  {
    id: "faqs",
    label: "FAQs",
    hint: "প্রশ্নোত্তর",
    isComplete: ({ faqs }) => (faqs?.length || 0) > 0,
  },
  {
    id: "floating",
    label: "Floating Images",
    hint: "section অনুযায়ী ভাসমান fruit ছবি",
    isComplete: ({ floatingOverrides, floatingImages }) =>
      (floatingOverrides?.extras?.length || 0) > 0 ||
      (floatingOverrides?.replacements?.length || 0) > 0 ||
      (floatingOverrides?.hidden_ids?.length || 0) > 0 ||
      // legacy back-compat: old full-page floats still count as "done"
      (floatingImages?.length || 0) > 0,
  },
  {
    id: "variations",
    label: "Variations",
    hint: "প্রতি variation-এর weight + badge",
    // Weight/badge are saved via the section's own per-row endpoint (not this
    // form's onSubmit), so we can't measure "filled" from form state. Instead
    // gate on whether the product HAS variations at all — a variation product
    // shows ✓, a simple (no-variation) product stays neutral.
    isComplete: ({ product }) => product?.is_variation === true,
  },
  {
    id: "og",
    label: "Social / OG",
    hint: "share preview (title, image)",
    isComplete: ({ form }) =>
      has(form?.og_title) || has(form?.og_description) || has(form?.og_image),
  },
];
