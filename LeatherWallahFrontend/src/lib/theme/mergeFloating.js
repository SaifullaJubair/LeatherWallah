// mergeFloating — resolves the FINAL list of floating assets for a product PDP
// by layering the per-product override (floating_overrides) over the assigned
// theme's floating_assets[].
//
// Inputs:
//   themeAssets — array from product.theme_id.floating_assets (each has a
//     stable `id`, set by the floating migration / theme save hook).
//   overrides   — product.floating_overrides:
//       { hidden_ids: string[],
//         replacements: [{ theme_asset_id, asset_url, asset_key }],
//         extras: [ <full floating-asset shape> ] }
//
// Output: a flat array of floating-asset objects in the exact shape
//   FloatingAssets.jsx consumes (section/position/align/animation_*/size/
//   opacity/hide_on_mobile/asset_url). Order: inherited theme assets first
//   (so their slots stay stable), then product-only extras.
//
// Edge-cases handled:
//   - DEAD-REF GUARD: a hidden_id / replacement.theme_asset_id that no longer
//     matches any theme asset (theme swapped A→B, or asset deleted) is simply
//     ignored — never crashes, never leaves a ghost.
//   - REPLACE = same slot, new image: only asset_url/asset_key change; section/
//     position/align/animation all stay the theme's.
//   - HIDE wins over REPLACE for the same id (defensive — admin shouldn't set
//     both, but if they do, hidden takes precedence).
//   - Missing/empty inputs → returns [] (or just extras / just theme).

export function mergeFloating(themeAssets, overrides) {
  const theme = Array.isArray(themeAssets) ? themeAssets : [];
  const ov = overrides || {};
  const hidden = new Set(
    Array.isArray(ov.hidden_ids) ? ov.hidden_ids.filter(Boolean) : [],
  );
  const replacements = Array.isArray(ov.replacements) ? ov.replacements : [];
  const extras = Array.isArray(ov.extras) ? ov.extras : [];

  // Index replacements by the theme asset id they target.
  const replaceById = new Map();
  for (const r of replacements) {
    if (r && r.theme_asset_id && r.asset_url) {
      replaceById.set(r.theme_asset_id, r);
    }
  }

  const out = [];

  // 1) Inherited theme assets — minus hidden, with replacements applied.
  for (const a of theme) {
    if (!a || !a.asset_url) continue;
    const id = a.id;
    // hide wins
    if (id && hidden.has(id)) continue;
    const repl = id ? replaceById.get(id) : null;
    out.push({
      ...a,
      // Replacement only swaps the image; everything else stays the theme's.
      asset_url: repl ? repl.asset_url : a.asset_url,
      asset_key: repl ? repl.asset_key : a.asset_key,
      // mark provenance for the admin preview (harmless on storefront).
      _source: repl ? "replaced" : "theme",
    });
  }

  // 2) Product-only extras (always shown for this product).
  for (const e of extras) {
    if (!e || !e.asset_url) continue;
    out.push({ ...e, _source: "product" });
  }

  return out;
}

export default mergeFloating;
