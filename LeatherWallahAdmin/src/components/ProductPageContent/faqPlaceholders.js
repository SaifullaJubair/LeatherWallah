// Shared helpers for FAQ template placeholders.
//
// Placeholders let one template serve many products: a template writes
// {{product_name}} / {{warranty}} etc., and when it's copied onto a specific
// product those tokens are filled from that product's data.
//
// Keys are NICHE-NEUTRAL and DB-driven: beyond a few universal core fields
// (product_name / price / weight), every entry in the product's custom_fields
// (spec sheet) and nutrition rows becomes a placeholder keyed by the English
// slug of its label. So a cosmetics clone with a "Skin Type" spec automatically
// gets {{skin_type}} — no food-specific keys baked in.

// English slug: lowercase, ASCII alnum runs joined by underscore. Returns ""
// for a purely non-ASCII (e.g. Bangla) label, which then yields no placeholder.
export const slugifyPlaceholderKey = (label) =>
  String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// Build the { key: value } map a product exposes to placeholder filling.
// `extras` carries the page-content form's live values (shelf_life / origin
// from the nutrition tab) so editing them reflects immediately.
export const buildProductPlaceholderContext = (product, extras = {}) => {
  const ctx = {
    // Universal core — present for every niche.
    product_name: product?.product_name,
    price: product?.product_price,
    weight: product?.unit,
    ...extras,
  };
  // Spec sheet (custom_fields) → slugged placeholders.
  (Array.isArray(product?.custom_fields) ? product.custom_fields : []).forEach(
    (f) => {
      const key = slugifyPlaceholderKey(f?.label);
      if (key && f?.value != null && f.value !== "") ctx[key] = f.value;
    },
  );
  // Nutrition rows → slugged placeholders too.
  (Array.isArray(product?.nutrition?.rows) ? product.nutrition.rows : []).forEach(
    (r) => {
      const key = slugifyPlaceholderKey(r?.label);
      if (key && r?.value != null && r.value !== "") ctx[key] = r.value;
    },
  );
  return ctx;
};

// The list of placeholder keys to show as a hint, given a context map.
export const placeholderHintKeys = (ctx) =>
  Object.keys(ctx || {}).filter((k) => ctx[k] != null && ctx[k] !== "");
