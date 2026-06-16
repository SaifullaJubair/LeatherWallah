# Boutique Home Page — PLAN

> ## ✅ SHIPPED + LIVE (2026-06-16, session 44)
> Deployed to fruitsnacksbd.com — FE `e3b16b0`, Admin `a39070d`, BE `4c39b97` (dev→main).
> Boutique preset (Hero Spotlight + Product Features + Story Band) live + enabled on prod.
> First FE Coolify build wedged (stalled, not slow) → killed + requeued via artisan, rebuilt clean.
> Prod `home_section_array` restored to FULL 18 sections (boutique 7 ON, rest off) so Admin can
> toggle Flash Sale/Promo etc. Memory: `boutique-home-preset`. Plan below kept for reference.

**Created:** 2026-06-16
**Goal:** A premium, animated, "storytelling" home layout that looks great with only
5-8 products (a boutique food brand), instead of the marketplace grid that needs 100s
of products to not look empty. Direction = **Warm Premium** (graza energy + aesop class):
appetite + trust + calm. Big imagery, alternating image↔text, scroll-reveal animation,
buy CTA on every block.

## Design direction (locked)
- Warm palette already in the demo theme (orange #E8590C + green #2F9E44).
- Big appetizing imagery, large Bangla typography, generous whitespace.
- Framer Motion `whileInView` scroll-reveal (already on v12; NO GSAP needed).
- Respect `prefers-reduced-motion` (kill animations) — same rule as PDP floats.
- **Commerce stays first-class:** Add to Cart + Wishlist on hero + every feature row +
  the grid. Variation product → opens existing QuickViewModal (variation picker);
  simple product → direct add to cart. REUSE existing cart/wishlist logic — no new
  cart code.

## How it plugs into the EXISTING system (no rewrite)
The home is already a section registry: `home_section_array` (DB) → `SectionRenderer.jsx`
map → component, ordered + toggleable from Admin → Settings → Home Layout. We ADD new
section ids; the marketplace sections stay (a high-catalog client just toggles between
them). Each new section id needs 4 touch-points:
1. FE component under `src/components/frontend/home/<section>/`
2. `SectionRenderer.jsx` SECTION_COMPONENTS map entry
3. BE `HOME_SECTION_DEFAULTS` entry (setting.services.ts) — default order/enabled
4. Admin `HomeLayoutTab.jsx` label + any config fields

## New sections (3)
### S1 — `hero_spotlight` (replaces/augments the banner hero for boutique)
Full-width hero featuring ONE star product. Big image (subtle float/parallax),
animated headline + short_description + badge, price, **Add to Cart / Wishlist**, and a
"বিস্তারিত দেখুন" → PDP. Star product chosen by admin (a `home_spotlight_product_slug`
setting) OR fallback = first trending/bestseller.
- Data: reuse product detail shape (name, main_image, short_description, badge_text,
  price/discount, is_variation → QuickView).

### S2 — `product_features` (the core boutique block — alternating rows)
For a curated list of products (admin picks N slugs, or fallback = trending), render
ONE big row per product, image side alternating left/right. Each row shows:
- product image (scroll-reveal)
- name + short_description
- **benefits** (page-content) as check-list, **nutrition** info_tiles as animated chips
  (the page-content the owner already fills surfaces HERE — fills the page with detail)
- **Add to Cart / Wishlist** + "বিস্তারিত"
- Curated via a new setting `home_feature_product_slugs` (array, admin-ordered);
  fallback = first 4 trending if unset.

### S3 — `story_band` (brand story / why-us)
A wide editorial band: heading + paragraph + 3-4 trust points (icon + label), big
side image, scroll-reveal. Content from settings (reuse existing `brand_story_*` fields
if present; else new `home_story_*`). This is the "calm/trust" beat between product rows.

(Reviews carousel + Newsletter already exist as sections — reused at the end.)

## Default boutique order (when a client wants this layout)
hero_spotlight(1) → story_band(2) → product_features(3) → reviews_carousel(4) →
newsletter(5). Marketplace sections shipped disabled-by-default in this preset but still
toggleable.

## Settings added (DB, admin-editable)
- `home_spotlight_product_slug` (string) — S1 star product
- `home_feature_product_slugs` (string[] / CSV) — S2 curated list (ordered)
- `home_story_heading`, `home_story_text`, `home_story_image`/`_key`,
  `home_story_points[]` (icon_key + label) — S3 (only if brand_story_* insufficient)
- (re-use existing brand_story_* if they already cover S3 — check before adding)

## Files (expected)
FE: 3 new section folders + components; SectionRenderer map; reuse AddToCart/Wishlist/
QuickViewModal/helper.js price; a small `useInViewReveal` Framer helper.
BE: setting.interface + model (new fields) + HOME_SECTION_DEFAULTS (3 ids) + public
/setting already returns them.
Admin: HomeLayoutTab (3 new section labels + config: spotlight picker, feature multi-
picker, story fields) — product pickers reuse the existing async product search.

## Owner decisions (LOCKED 2026-06-16)
1. **Keep the current banner/slider hero.** hero_spotlight sits BELOW it, not a replacement.
2. **No new product picker — REUSE the existing `trending_product` flag.** The products the
   admin already ticks as trending are the ones that feature in S1 spotlight + S2 feature
   rows. (S1 spotlight = first trending product; S2 = the trending list, admin-ordered by
   existing means.) → drops the `home_spotlight_product_slug` + `home_feature_product_slugs`
   settings entirely. Less new code, owner controls it the way they already do.
3. **⭐ DO NOT touch / delete the current home page.** The existing marketplace sections stay
   exactly as-is. The boutique layout is PURELY ADDITIVE: 3 new sections added to the registry.
   Two presets coexist, both just toggles in `home_section_array`:
   - **Boutique preset** (few products) — hero_spotlight + product_features + story_band on.
   - **Marketplace preset** (many products) — the existing grid sections on. THIS is what a
     high-catalog future client gets. Switching = toggling sections in Admin → Home Layout,
     ZERO code change. The old home page survives as a deliverable preset.

## Revised settings (smaller now)
- DROP `home_spotlight_product_slug` + `home_feature_product_slugs` (using trending flag).
- S3 story_band: reuse existing `brand_story_*` settings if they cover heading/text/image/
  points; only add `home_story_*` fields for anything missing (check brand_story first).
- So in many cases: only the 3 new HOME_SECTION_DEFAULTS ids + maybe a couple story fields.

## EDGE-AUDIT DONE (2026-06-16) — findings absorbed

Verified facts: `home_section_array`+`SectionRenderer` registry exists · Framer Motion v12 (no
GSAP) · `brand_story_*` settings exist (title/text/image/cta) · `useGetTrendingProducts()` hits
`/product/trending_product` · `ProductCard.jsx` = canonical card (addToCart dispatch +
localStorage wishlist + QuickView) · `cartSlice.addToCart` = real action.

### BLOCKERS (resolved in plan)
- **B1 wishlist is two systems** (ProductCard=localStorage, SingleProduct=remote; remote module
  incomplete per F-10). → Boutique REUSES `ProductCard`'s localStorage wishlist. No new wishlist.
- **B2 variation add-to-cart** can't direct-add (no variant chosen). → CTA: simple product =
  direct `addToCart`; variation product = open existing QuickViewModal. Same as ProductCard.

### HIGH (resolved in plan)
- **H1** `prefers-reduced-motion` → kill Framer animations (same rule as PDP floats).
- **H2** no trending products (fresh client / demo cleared) → each boutique section AUTO-HIDES
  when its product list is empty (no broken empty hero).
- **H3** SSR/localStorage hydration → boutique sections are `"use client"` like existing ones.
- **⭐ H4 (the real one) — VERIFIED: `/product/trending_product` is SLIM.** Returns only
  name/slug/image/price/variations/rating. **benefits / nutrition / use_cases / short_description
  / badge_text / discount_price are MISSING.** Feature rows NEED those (that's the whole point).
  → **FIX (path 1, chosen): enrich the trending aggregation `$project`** (product.services.ts
  ~line 908) to also emit `short_description, benefits, nutrition, use_cases, badge_text,
  product_discount_price`. One endpoint change → all boutique sections get details in one fetch,
  NO N+1. Existing TrendingSlider ignores the extra fields (slightly larger payload only).

### MEDIUM (resolved in plan)
- **M1** mobile: alternating rows always stack image-on-top (never reverse-stacked).
- **M2** many trending (20+): cap feature rows to first N (e.g. 6); rest fall to a compact grid.
- **M3** Admin HomeLayoutTab: clear labels for the 3 new section toggles.

## FINAL build order
1. **BE** — enrich `findTrendingProductServices` `$project` (H4). tsc verify.
2. **BE** — `HOME_SECTION_DEFAULTS` + 3 ids (`hero_spotlight`, `product_features`, `story_band`);
   story_band reuses `brand_story_*` (+ maybe `home_story_points[]` for trust pills only).
3. **FE** — 3 section components (Framer `whileInView` + reduced-motion + auto-hide-if-empty +
   mobile stack); reuse ProductCard cart/wishlist/QuickView; `useGetTrendingProducts` data.
4. **FE** — register in `SectionRenderer` map.
5. **Admin** — HomeLayoutTab labels/config (story fields; product source = trending flag, so no
   picker). 
6. `/test` (cross-app build verify + traces) → owner live test.

Old marketplace home stays 100% intact (additive). Boutique = preset = just enabled section ids.

## IMPLEMENTATION STATUS (2026-06-16) — code done, builds green

Files:
- **BE**: `findTrendingProductServices` $project enriched (short_description, badge_text,
  benefits, use_cases, nutrition) — also applied to findBrandMatchProductServices (identical
  block, harmless bonus). `HOME_SECTION_DEFAULTS` += hero_spotlight/product_features/story_band
  (enabled:false, order 16-18). tsc EXIT 0.
- **FE**: new `home/boutique/reveal.jsx` (Framer whileInView + reduced-motion) +
  `useBoutiqueProductActions.jsx` (localStorage wishlist + simple→addToCart / variation→QuickView,
  matches ProductCard). 3 sections: `heroSpotlight/HeroSpotlight.jsx` (first trending product, big
  hero, auto-hide if none), `productFeatures/ProductFeatures.jsx` (rows 1..6 alternating, benefits
  checklist + nutrition tiles, mobile image-first), `storyBand/StoryBand.jsx` (brand_story_*
  animated). Registered in SectionRenderer map. Next build "Compiled successfully".
- **Admin**: HomeLayoutTab SECTION_LABELS + L9_DEFAULTS += 3 boutique sections (disabled). vite 0.

Data source = trending flag (products[0] = spotlight, [1..6] = feature rows). story_band reuses
brand_story_* (trust points stay the separate trust_strip section — not duplicated).

Edge-audit absorbed: B1 localStorage wishlist · B2 variation→QuickView · H1 reduced-motion ·
H2 auto-hide when empty · H3 client component + mount-hydrate wishlist · H4 trending enrich ·
M1 mobile stack · M2 cap 6 rows.

## COMMITTED (2026-06-16) — owner visually approved on local
Commits (all `dev`, pushed): BE `4c39b97`, Admin `a39070d`, FE `9783f04`.

Owner feedback absorbed after first render: image aspect → square; variation pack-size chips
(price swaps on select); animated Swiper carousel (added `gallery_images` so variation products
get the full image list too); ✦ divider + bigger gap between rows; sections wrapped in <Contain>
(max-w-[1800px], aligns with navbar). "আমাদের গল্প" confirmed dynamic (brand_story_*).

Boutique PRESET (what to enable when switching a client to boutique — order):
banner(server) → hero_spotlight → product_features → story_band → category_wise_strip →
reviews_carousel → site_faq → newsletter. DISABLE the grid strips (trending_products,
bestsellers, new_arrivals, offers_block, feature_categories, trust_strip, brand_story[dup],
promo_banner). All via Admin → Settings → Home Layout — zero code change.

## POLISH PASS (2026-06-16, FE `b1ea67d`) — ui-ux-pro-max audit, owner approved
New `boutique/bits.jsx`: SectionHeading, GlowBlob (ambient, reduced-motion), MotionButton
(press spring), WaveDivider. Applied: hero eyebrow "★ আজকের বিশেষ পণ্য" (fixes the
disconnected-first-product feel) + glow + image float; product_features section heading +
alternating row bg (rhythm) + chip/CTA press scale; story_band eyebrow + bigger copy + 4 trust
pills + glow; tabular-nums prices. Banner rounded-3xl + Contain + rounded-full CTA + bigger type
(matches boutique soft style; marketplace banner also improved, structure unchanged). All
animations respect prefers-reduced-motion.

## REMAINING / NOTES
- NOT deployed to prod yet (still `dev`; merge dev→main when owner says deploy).
- Demo limitation (not a bug): variation chips swap PRICE but not IMAGE because demo variations
  have no per-variation image; if a real client sets variation images, chip→image swap works.
- Owner had "aro kichu bolbo" — more feedback expected before deploy.
