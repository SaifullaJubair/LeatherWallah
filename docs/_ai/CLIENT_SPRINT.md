# Client Sprint — FruitSnacks (6 days)

**Created:** 2026-06-04 (Session 19)
**Goal:** Ship 22 remaining items in 6 days, deploy clean to main, then clone repo for common e-commerce template.

**Approach:** Hybrid — per-feature contract lock UPFRONT (this doc), then horizontal sweep (BE-all → Admin-all → FE-all). Owner's reasoning: vertical per-feature 3-app work risks later features re-breaking earlier ones; horizontal sweep = stable layer + less rework.

**Branch:** All on `v2` in BE/Admin/FE. **NO partial deploys.** Single main merge at end of 6 days, owner-explicit only.

---

## ✅ Already shipped this session

**Phase 0 critical bugs** (BE v2 `6a2eb5a` + Admin v2 `0f9fdcd`):
- M1 role.routes permission flag remap
- M2 supplier permission flags (BE + Admin permissionData)
- M3 paymentWithdraw + payment_method routes auth
- M4 false positive (no action)

**Stage 1.5a security quick wins** (BE v2 `f43ff0b`, `1d3f373`):
- F001/F002/F003/F005/F006 + rate-limit tune

---

## 🎯 22 remaining items — contracts locked

### Bucket 1 — BACKEND (6 items)

---

#### **M28 — Currency from settings everywhere (dynamic symbol)** 🟢 small

**Why:** Clone-buyer in any country needs to change currency from Admin Settings, NOT code edit. Today most strings hardcode "৳" or "BDT". Owner wants BD-friendly default ("৳" / "টাকা") but EVERYTHING reads from settings dynamically.

**Owner-locked scope (2026-06-04):**
- **NO manual typing of "৳" / "BDT" anywhere in code.** All from settings.
- Display: settings provide `currency_symbol` ("৳"), `currency_code` ("BDT"), and optionally `currency_name` ("টাকা") for Bangla number display ("৫০০ টাকা")
- Default Bangladesh values, but owner of any clone can change to any locale

**BE state (verified):**
- `setting.currency_code` + `setting.currency_symbol` fields exist
- `getCurrencyCode()` helper at [setting.services.ts:13](FruitSnacksBackend/src/app/setting/setting.services.ts)
- Already used: `sslcommerz.gateway.ts`, `productFeed.controllers.ts`
- Hardcoded fallback "BDT" in 2 places (acceptable as last-resort fallback)

**Contract — BE:**
- ADD to setting.interface + setting.model: `currency_name?: string` (e.g. "টাকা" / "Taka" / "Dollar")
- Add helper `getCurrencySymbol()` mirror of `getCurrencyCode`
- Audit + fix all hardcoded "BDT" / "৳" in non-fallback spots (SMS templates, email templates, order receipts)

**Contract — Admin:**
- Settings page → Currency section:
  - Symbol input (default "৳")
  - Code input (default "BDT")
  - **NEW: Name input** (default "টাকা") — for spelled-out display
  - Live preview row: "Example: 500 ৳ / BDT 500 / 500 টাকা"

**Contract — FE:**
- New utility `src/utils/currency.js`:
  ```js
  formatCurrency(amount, mode = "symbol")
  // "symbol" → "৳500" / "$500"
  // "name"   → "500 টাকা" / "500 Taka"
  // "code"   → "BDT 500" / "USD 500"
  ```
- Reads from SettingProvider context (no prop drilling)
- Replace every hardcoded `"৳"` / `"BDT"` across components
- PDP, cart, checkout, order confirmation, user dashboard order list, search results, listings — all use `formatCurrency()`

**Acceptance:**
- Owner sets symbol="$" / code="USD" / name="Dollar" → every price re-renders accordingly
- Bangla "টাকা" display works for spelled-out contexts (e.g. order confirmation paragraph)
- `grep "৳"` in FE non-utility code → 0 matches
- BE SMS/email templates show new currency

**Files:**
- BE: `setting/setting.interface.ts`, `setting/setting.model.ts`, `setting/setting.services.ts`
- Admin: SiteSettings page (Currency section + preview)
- FE: NEW `src/utils/currency.js`, search-replace across `~50+ files`

**Effort:** S-M (3-5h)

---

#### **M18 — Coupon date-range server-side validation** 🟠 P1

**Why:** [coupon.model.ts](FruitSnacksBackend/src/app/coupon/coupon.model.ts) has `coupon_start_date` + `coupon_end_date` (String). `order.recompute.ts` validates coupon active status + per-user usage, but not date range. Expired coupon still apply.

**Contract — BE:**
- In `order.recompute.ts` (or wherever coupon discount applied), add:
  ```ts
  const today = new Date().toISOString().split("T")[0];
  if (coupon.coupon_start_date > today) throw new ApiError(400, "Coupon not yet active");
  if (coupon.coupon_end_date < today) throw new ApiError(400, "Coupon expired");
  ```
- Same check in any standalone coupon-validate endpoint (e.g., `/coupon/check`)

**Contract — Admin:** no change (existing date inputs save correctly per coupon.model)

**Contract — FE:** no change (server now rejects, FE just shows error toast)

**Acceptance:**
- Apply expired coupon at checkout → server rejects with "Coupon expired"
- Apply future-dated coupon → "Coupon not yet active"
- Apply valid in-range coupon → discount applies (unchanged path)

**Files:**
- BE: `order/order.recompute.ts`, `coupon/coupon.controllers.ts` (if check endpoint exists)

**Effort:** S (1h)

---

#### **M20 — Shipping cost server recompute + per-product delivery rules** 🟠 P1

**Why:** `order.recompute.ts:18-20` explicit comment: *"Shipping cost is NOT recomputed here... we keep the client's shipping_cost for now."* Tampered client can send shipping_cost = 0. PLUS owner wants per-product delivery rules (not just global settings).

**Owner-locked scope (2026-06-04):**
- Global free-delivery setting → keep working (already in settings)
- **NEW: per-product delivery override** — each product can have:
  - **delivery_mode** enum: `inherit` (default — use settings) | `free` (always free for this product) | `flat` (override with fixed amount) | `qty_threshold` (free after N units)
  - **delivery_flat_amount** (number) — used when mode=flat
  - **delivery_free_after_qty** (number) — used when mode=qty_threshold (e.g. 3 means: 3rd+ unit = free shipping for this line)

**Contract — BE:**
- Add fields to `product.model.ts` + `product.interface.ts`:
  ```ts
  delivery_mode?: "inherit" | "free" | "flat" | "qty_threshold"; // default "inherit"
  delivery_flat_amount?: number;
  delivery_free_after_qty?: number;
  ```
- Build `recomputeShippingCost(order, lines)` helper in order.recompute.ts:
  1. Compute base zone charge from settings (inside vs outside Dhaka by `order.shipping_address.district`)
  2. Apply global free-delivery rules (always / min_order)
  3. For each line, check product.delivery_mode:
     - `inherit` → contributes to global rule
     - `free` → that line contributes 0 to shipping
     - `flat` → that line contributes `delivery_flat_amount` (replaces zone share for that line)
     - `qty_threshold` → if `line.qty >= delivery_free_after_qty` → 0 for that line, else normal
  4. Strategy decision: per-order final shipping = max(per-line contributions) for simple shops; or sum if line-additive. **Need owner decision at impl start** (see open question).
- Server overrides `shipping_cost` regardless of client value

**Contract — Admin:**
- Product form: new "Delivery" section (collapsible, after pricing):
  - Mode dropdown: Inherit (default) / Always Free / Flat Charge / Free After N units
  - Flat amount input (visible only when mode=flat)
  - Threshold qty input (visible only when mode=qty_threshold)
- Default = Inherit so existing products unaffected

**Contract — FE:**
- Cart/checkout shipping line shows server-recomputed value
- Per-line note on cart drawer if product has special delivery: "Free shipping" / "Flat 60৳ shipping" / "Free after 3+"
- Read settings.currency_symbol for display

**Acceptance:**
- Tampered shipping_cost=0 → server recomputes
- Product with delivery_mode=free → shipping line shows free for that product
- Product with delivery_free_after_qty=3 → cart qty 2 = normal charge; qty 3+ = free
- Product with delivery_mode=flat=60 → shipping 60 for that product

**Open questions for impl day:**
1. Multi-product cart with mixed delivery rules — sum or max? Owner picks.
2. District detection — read `order.shipping_address.district` shape now.

**Files:**
- BE: `product/product.model.ts`, `product/product.interface.ts`, `order/order.recompute.ts`
- Admin: `ProductForm.jsx` (new Delivery section)
- FE: cart drawer / checkout (per-line shipping note + total update)

**Effort:** M (4-7h)

---

#### **B2 — Attribute delete edge case** 🟡 P2

**Why:** Admin deletes attribute that's used in some product's `product_attributes[]` and variation `combination[]`. Today silently orphans the references.

**Contract — BE:**
- In `attribute.services.ts` deleteAttributeServices: BEFORE delete:
  ```ts
  const used = await ProductModel.exists({ "product_attributes.attribute_id": id });
  if (used) throw new ApiError(409, "Attribute is used by N products. Remove from products first.");
  ```
- Optional: query count + return in error message ("Used by 12 products")

**Contract — Admin:** Show error toast properly; no UI change needed

**Contract — FE:** no change

**Acceptance:**
- Try delete used attribute → 409 with count
- Delete unused attribute → success (unchanged)

**Files:**
- BE: `attribute/attribute.services.ts`

**Effort:** S (1h)

---

#### **B1 — Anonymous → register flow full audit (BE + FE both)** 🟠 LARGEST item

**Why:** Owner: "amader site a order korar por oi number diye auto accoute create hoye jai password set korte hoy" — verify the whole flow ACROSS backend + frontend, document market-deviation for owner decision.

**Owner-locked scope (2026-06-04):** Audit BOTH backend AND frontend, full flow. Not just BE.

**Investigation — Backend:**
1. Read `order.controller.ts` postOrder + postSingleOrder — how is user created if phone doesn't exist?
2. Read `user.controllers.ts` postUser + login + forgetPassword + setNewPassword — what's the password-set flow?
3. User model — `user_status` enum values, OTP fields, password default?
4. Notification — is set-password SMS/email sent automatically on anon-order?
5. Order linkage — is order.user_id set on auto-created user? Order ownership query works?

**Investigation — Frontend:**
1. Anonymous checkout form fields (phone, name, address, email?)
2. Post-order success page — does it tell the user "we created an account, set your password"?
3. Set-password page — exists? Discoverable? Via OTP? Via link?
4. Login form — flow when user comes back with same phone but no password set yet?
5. User dashboard — anonymous-order history visibility (same phone re-orders later → sees old orders?)

**Compare to market patterns:**
- Shopify guest checkout (no account at all, email-only confirmation)
- Daraz BD (phone-OTP auto-account, force password later)
- Amazon (separate guest vs registered, no auto-link)

**Contract — BE:**
- ⚠️ Cannot lock upfront; audit first.
- Document findings in `.claude/work/client-sprint/B1-anon-flow-audit.md`
- Propose 2-3 alternatives if deviates from market norm
- Owner picks → write fix (may touch user.controllers, order.controllers, notification)

**Contract — Admin:** depends on findings (e.g. customer list filter for "guest" vs "registered" status)

**Contract — FE:** depends on findings (likely set-password page polish, post-order CTA improvements, anonymous-order history visibility)

**Acceptance:**
- Audit memo written with: current flow diagram, gaps vs market, 2-3 fix alternatives, recommendation
- Owner picks
- Fix applied (BE + FE coordinated)
- End-to-end test: anonymous → place order → notification → set password → login → see order

**Effort:** L (6-10h — BIGGEST single item; will spill across Days 5-6)

**Files:** TBD after audit (likely BE: user/order controllers + Notification; FE: checkout page, post-order page, set-password page, dashboard)

---

#### **Misc backend bits** for A3/A4/M24 (planned in Bucket 2 cards but BE work flagged here)

- **A3** Variation attribute-value reorder → likely NO BE change (`product_attributes[i].value_ids[]` array order is source of truth; admin save preserves order)
- **A4** Variation badge → field `variation_badge_text` ALREADY EXISTS in [variation.model.ts:86](FruitSnacksBackend/src/app/variation/variation.model.ts). ADD: `variation_badge_icon_key` (curated IconPicker key)
- **M24** Category re-parent → `updateCategoryServices` rewrite to recompute `category_path[]` + `depth` on parent_id change, cascade to descendants

---

### Bucket 2 — ADMIN (4 items)

---

#### **A3 — Variation attribute-value drag-reorder**

**Why:** Owner: "frontend a show hose Color: red, white, blue; ami admin show korate chai blue, red, white kmnne korbo just reorder"

**Contract — BE:** Verify — `product_attributes[i].value_ids[]` array order saved as-is. No BE change.

**Contract — Admin:**
- In `StepOneVariation.jsx`: per-attribute React Select chip list
- Add drag handle on each selected chip (`@dnd-kit/sortable`)
- Drag reorders local state → on save, FormData append maintains array order
- Visual feedback: ghost during drag, snap to drop slot

**Contract — FE:** Verify PDP variation picker iterates `value_ids[]` in array order (no sort). Likely already correct.

**Acceptance:**
- Admin product edit → Color attribute → drag "Blue" before "Red" → save → reload edit page shows new order → storefront PDP shows new order

**Files:**
- Admin: `StepOneVariation.jsx` (add dnd-kit)
- Verify: `singeProduct/VariationPicker.jsx` reads array order

**Effort:** M (3-4h)

---

#### **A4 — Variation badge per-variation (Best Seller / Popular / etc)**

**Why:** Owner referenced apple-theme asset — badges like "Top Pick" / "Premium" / "Limited" per variation on PDP.

**Owner-locked scope (2026-06-04):** badge color = theme primary ALWAYS (no per-badge color field). Keeps PDP visually cohesive with theme.

**Contract — BE:**
- `variation_badge_text` already exists (string)
- ADD: `variation_badge_icon_key` (string — curated IconPicker key like "lu:Crown")
- **NO `variation_badge_color` field** — render uses active theme's primary color

**Contract — Admin:**
- In `StepOneVariationTable.jsx` matrix table: new "Badge" column
- Cell: text input (badge_text) + small IconPicker trigger (badge_icon_key)
- Reuse existing IconPicker component
- Submit: FormData append per-row `variation_details[i][variation_badge_text]`, `_icon_key`

**Contract — FE:**
- In PDP `VariationPicker.jsx`: per-chip, if badge_text → render small badge above/corner of chip
- Use `DynamicIcon` for badge_icon_key
- Badge style: small rounded pill with icon + text, **bg = theme primary**, text = contrasting (white/dark per primary lightness)

**Acceptance:**
- Admin: set "Top Pick" + Crown icon on Red variation → save
- Storefront PDP: Red swatch shows badge "🏆 Top Pick" colored in theme primary
- Other variations no badge → render normally

**Files:**
- BE: `variation/variation.interface.ts`, `variation/variation.model.ts`, possibly product.controllers.ts (variation_details parsing)
- Admin: `StepOneVariationTable.jsx`, `VariationBadgeCell.jsx` (new component)
- FE: `themedProduct/singeProduct/VariationPicker.jsx` (badge render)

**Effort:** M (4-6h)

---

#### **A2 — Product table list better data display**

**Why:** Owner: "product er table list ta aro valo vabe data dekhano"

**Contract — Admin only:**
- Read current `ProductPage` / `ProductTable.jsx` to see what columns exist
- Propose enhanced columns:
  - Thumbnail + Name + SKU
  - Category breadcrumb
  - Stock (with low-stock indicator)
  - Price (with discount badge)
  - Status (active/inactive/draft)
  - Variations count + expandable rows
  - Sold count + view count
  - Last updated
- Filters: status, category, low-stock, no-image
- Improved search across name + SKU + barcode

**Contract — BE:** Verify `findAllDashboardProduct` returns all needed fields; if missing fields needed, extend service

**Contract — FE:** no change

**Acceptance:**
- Product list shows owner-approved better columns
- Sort + filter work
- Mobile-friendly

**Open question:** Owner needs to confirm exact columns. **DEFER to implementation day — show current list, propose new, owner picks.**

**Files:**
- Admin: `ProductPage/ProductPage.jsx`, `Product/ProductTable.jsx`

**Effort:** M (4-6h depending on owner-picked scope)

---

#### **M24 — Category re-parent enable**

**Why:** Per existing roadmap: "category edit form has move-to-another-parent DISABLED because updateCategoryServices doesn't recompute category_path". Owner has to delete + recreate to move.

**Contract — BE:**
- `category.services.ts` updateCategoryServices: if `parent_id` changed:
  1. Recompute new `category_path[]` from new parent
  2. Recompute new `depth`
  3. Find all descendants (categories where current cat is in their path)
  4. Update each descendant's path + depth to reflect new ancestor chain
- Wrap in mongoose transaction (multi-doc update)

**Contract — Admin:**
- In `CategoryTree` / Category edit form: re-enable "Move to another parent" picker
- Parent picker: CategoryTreePicker (excludes self + descendants)
- Confirmation modal: "Moving this category will also move N child categories. Continue?"

**Contract — FE:** no change (storefront reads current path)

**Acceptance:**
- Move category C from root to under A → C's path = [A, C], depth = 2
- Move C2 (child of C) along with it → C2 path = [A, C, C2], depth = 3
- Move to descendant of itself → blocked with error

**Files:**
- BE: `category/category.services.ts`, `category/category.model.ts` (if helper added)
- Admin: `CategoryTree` component(s), category edit form

**Effort:** M (4-6h)

---

### Bucket 3 — STOREFRONT (10 items)

---

#### **S1 — `/cart` page convert to checkout (URL + title)**

**Why:** Owner: "cart checkout page a convert hobe — agei bolcilam just name change and title"

**Owner-locked scope (2026-06-04):**
- Keep the existing `/cart` page (it already does order/checkout flow)
- Rename URL `/cart` → `/checkout`
- Page `<title>` "Cart" → "Checkout"
- The other `/checkout` folder — investigate, likely either old stub OR will be merged/deleted

**Contract — FE only:**
- Investigate `/checkout` folder content first; if it's a stub/empty/duplicate → delete
- Move cart page contents to checkout route
- Cart drawer / Add-to-cart button navigation → `/checkout`
- Update page title to "Checkout"
- Update every internal `<Link href="/cart">` → `/checkout`
- Add 301 redirect `/cart` → `/checkout` in `next.config.mjs` (preserves old links + bookmarks)

**Acceptance:**
- Click cart → URL is `/checkout`, page title is "Checkout"
- Old `/cart` URL → 301 to `/checkout`
- No broken internal links
- Page content and flow unchanged from old `/cart`

**Files:**
- FE: `app/(frontend)/cart/`, `app/(frontend)/checkout/`, `next.config.mjs`, all `<Link>` callsites referencing `/cart`

**Effort:** XS (1-2h)

---

#### **S2 — PDP image/video flow audit + fix**

**Why:** Owner: "product image, others iamge, product video , variations iamge, and v.videos agula kivabe pdp page a dekhasse ta akbar followup kore check dea"

**Audit-only first; fix what's broken; note big missing as TODO.**

**Audit tasks:**
- PDP renders product.main_image as hero ✓?
- PDP renders product.other_images[] as gallery thumbs ✓?
- PDP renders product.main_video ✓?
- PDP renders product.video_link (YouTube) ✓?
- PDP renders variation.variation_image (legacy) ✓?
- PDP renders variation.variation_images[] (multi-image gallery) ✓?
- PDP renders variation.variation_video ✓?
- On variation pick, do gallery + video switch to that variation's media?

**Contract — FE:** Fix broken; note missing big features for backlog

**Acceptance:**
- All 7 media types shown correctly on PDP
- Variation pick swaps gallery+video to that variation's media (overlaps M14)

**Files:** TBD after audit
**Effort:** M (3-5h)

---

#### **M9 — PDP SKU display**

**Why:** Owner mentioned SKU phase 2 deferred items; PDP SKU display is small + high-clarity.

**BE state:** `variation_sku` field exists and `findAProductDetailsServices` no longer excludes it (verified in [sku-barcode-qr-plan memory]).

**Contract — FE only:**
- In PDP, below price, render small grey text: `SKU: {selectedVariation?.variation_sku || product.product_sku}`
- If no variation selected, show product-level SKU
- Hide if SKU empty

**Acceptance:** Visible SKU on PDP, updates when variation changes

**Files:**
- FE: `themedProduct/singeProduct/SingleProduct.jsx` (price section)

**Effort:** S (30min)

---

#### **M14 — Per-variant gallery auto-switch**

**Why:** When customer picks Color = Blue → PDP image gallery instantly shows Blue variation's images (variation_images[]). Currently gallery stays on product.main_image.

**Contract — FE only:**
- In PDP gallery component: read `selectedVariation?.variation_images || []`
- If non-empty → use these as gallery slides
- If empty → fall back to product.main_image + other_images
- Same for video: `selectedVariation?.variation_video || product.main_video`
- Smooth transition (framer-motion fade)

**Acceptance:**
- Pick Red → see Red's images
- Pick Blue → gallery switches to Blue's images
- No selection → product images

**Files:**
- FE: `themedProduct/singeProduct/SingleProduct.jsx` + Gallery component

**Effort:** M (3-4h)

---

#### **M16 — Filter URL → PDP variation pre-select**

**Why:** Listing `/category/snacks?color=red` → click product → PDP opens with `?color=red` → Red pre-selected. F1 (URL pattern shipped) already handles PDP-side parse; we need listing-side to forward query params on product click.

**Contract — FE only:**
- In product card component (listing pages): when wrapping `<Link>` around product, preserve current query string in href
- `<Link href={`/products/${slug}${searchParams ? '?' + searchParams.toString() : ''}`}>`

**Acceptance:**
- Listing `?color=red` → click → PDP URL `?color=red` → Red swatch selected

**Files:**
- FE: ProductCard component(s) used in listings

**Effort:** S (1-2h)

---

#### **S3 — SEO audit + fix + PROPER product-level SEO wiring** 🟠

**Why:** Owner: "product page a seo er field ase product add korar time a seo field gula valo kre nite hobe and pdp r frontend a kivabe ogula valo kore use korte hoy proper use korte hobe, product er meta and seo and tag use kora hoy nai frontend a"

**Owner-locked scope (2026-06-04):** TWO sub-items bundled:
- **S3a — Global SEO audit + fix** (site-wide tags + sitemap + robots)
- **S3b — Product-level SEO field wiring** (PDP uses per-product SEO that admin sets)

**S3b — Product SEO field investigation:**
- Verify product model has SEO fields: `seo_title`, `seo_description`, `seo_keywords`, `og_title`, `og_description`, `og_image`, `meta_tags[]`
- Verify admin product form / page-content form has inputs for these (might be in page-content form per [docs])
- Verify PDP reads these → builds Next.js `metadata` correctly:
  - `<title>` = product.seo_title || product.product_name
  - `<meta description>` = product.seo_description || product.short_description
  - `og:title`, `og:description`, `og:image` from product.og_*
  - `<meta name="keywords">` = product.seo_keywords
- Verify JSON-LD Product schema includes: name, image, sku, brand, offers (price, availability, currency)

**S3a — Global SEO audit checklist per route:**
- Homepage: `<title>`, description, OG, Organization JSON-LD, sitemap entry
- Category/listing: page-specific title/desc (from PageSeo module), BreadcrumbList JSON-LD
- PDP: per-product (S3b), Product JSON-LD, BreadcrumbList
- Static pages (about, policies): title/desc from settings
- Canonical URL on every page
- robots.txt accessible + correct
- sitemap.xml generated + product/category/static URLs included
- Twitter Card tags

**Contract — BE:**
- Verify product seo_* fields exist (may need to add `meta_tags[]` if not present)
- Sitemap generation endpoint: verify it exists or add

**Contract — Admin:**
- Product form / Page Content form → SEO section with all fields + helper text + character counter
- Live preview of how it appears in Google SERP

**Contract — FE:**
- Per-page `generateMetadata()` reads from API
- PDP metadata uses product SEO fields with sane fallbacks
- JSON-LD components for Product / Organization / BreadcrumbList
- robots.js + sitemap.js in Next.js app router (verify exists, fix if broken)

**Acceptance:**
- Google Rich Results Test passes for PDP
- View page source → all meta tags present from DB-driven values
- Set product.seo_title in Admin → reload PDP → `<title>` updated
- robots.txt + sitemap.xml accessible
- Search Console (S4/S5 ties in) sees pages

**Files:**
- BE: verify product seo fields; sitemap endpoint
- Admin: product form SEO section (likely needs polish)
- FE: per-page `generateMetadata()`, JSON-LD components, robots.js, sitemap.js

**Effort:** L (6-9h — S3a + S3b combined)

---

#### **S4 + S5 — Analytics bundle audit + fix** 🟠

**Why:** Owner: "s4, s5 aksathei audit koiro metapixel, capi, tiktok pixel, gtm, ga4, google search console, clarity" — bundled audit, 7 platforms total.

**Owner-locked scope (2026-06-04):** ONE bundled audit session covering all 7. Layer 3 (FE) end.

**Platforms to verify:**
1. **Meta Pixel** (client-side)
2. **Meta CAPI** (server-side via BE `/meta-pixel/event` endpoint)
3. **TikTok Pixel** (client-side)
4. **TikTok CAPI** (server-side if wired)
5. **GTM** (Google Tag Manager — container loaded, tags firing)
6. **GA4** (via GTM or direct)
7. **Google Search Console** (verification meta tag in `<head>`)
8. **Microsoft Clarity** (script loaded, session recording)

**Per platform check:**
- Script/tag loaded? With correct ID from settings (not hardcoded)?
- PageView fires? (every navigation)
- E-commerce funnel events fire?

**Standard funnel events to verify (across applicable platforms):**

| Stage | Meta | TikTok | GA4 |
|---|---|---|---|
| Page view | PageView | Pageview | page_view |
| Product browse | ViewContent | ViewContent | view_item |
| Add to cart | AddToCart | AddToCart | add_to_cart |
| Begin checkout | InitiateCheckout | InitiateCheckout | begin_checkout |
| Purchase | Purchase | PlaceAnOrder | purchase |

**Search Console verification:** Meta tag `<meta name="google-site-verification" content="..."/>` from settings

**Contract — FE:**
- Pixel/tag utility loads scripts with IDs from `settings.meta_pixel_id`, `settings.gtm_id`, `settings.ga4_id`, `settings.clarity_id`, `settings.tiktok_pixel_id`, `settings.google_verification`
- Each settings field reads via SettingProvider context (no hardcoded IDs)
- Each enabled toggle from settings respected (`meta_pixel_enabled` etc — already in settings interface)
- Fire events at correct funnel stages

**Contract — BE:**
- Verify Meta CAPI endpoint fires from `postOrder` + `postSingleOrder` (server-side Purchase event with event_id matching client for deduplication)
- Verify TikTok CAPI similarly

**Contract — Admin:**
- Settings page: ensure all 8 ID inputs + enabled toggles exposed
- ADD if missing: `google_verification` field, `tiktok_pixel_id`, `clarity_id`, etc.

**Acceptance:**
- Facebook Pixel Helper extension → all 5 Meta events visible
- Events Manager → CAPI events arrive + dedupe with pixel
- TikTok Pixel Helper → events visible
- GA4 DebugView → events visible
- GTM Preview Mode → tags firing
- Search Console → ownership verified
- Clarity dashboard → live session shows up

**Files:**
- FE: pixel/analytics utility (one file likely `src/utils/pixel.js` or per-platform files), page event triggers (PDP, AddToCart button, Checkout page, Order success page)
- BE: `metaPixel/`, `tiktokPixel/` controllers — verify CAPI calls fire
- Admin: Site Settings analytics section (verify all fields present)

**Effort:** L (6-8h — biggest FE audit; 7 platforms)

---

#### **S6 — User dashboard audit + fix + missing screens**

**Why:** Owner: "User dashboard a addresses name to kichu nai" — current dashboard is incomplete; some standard screens missing.

**Owner-locked scope (2026-06-04):** Audit AND fix missing screens. Includes addresses management.

**Audit tasks:**
- What screens currently exist? (`/profile`, `/orders`, `/wishlist`?)
- Map each → backend endpoint it reads → verify works
- What's MISSING from standard e-com user dashboard?

**Standard screens to ensure:**
- **Profile** — name, phone, email edit
- **Addresses** ⚠️ owner-flagged MISSING — list of saved shipping addresses + add/edit/delete + set-default
  - Backend: verify user model has `addresses[]` or separate address collection
  - If missing entirely → ADD (small CRUD)
- **Order history** (covered by S8 — separate item)
- **Order tracking** (covered by S7 — separate item)
- **Wishlist** — backend Phase G shipped; verify FE
- **Wallet** — Phase E shipped backend `wallet_transactions`; FE display history
- **Loyalty points** — Phase G shipped; FE display

**Contract — BE:**
- If addresses missing: add `addresses` to user model OR new address module (recommend: `user.addresses[]` embedded — simpler for single-shop scale)
- Endpoint: `POST/PATCH/DELETE /user/address`

**Contract — Admin:** no change (admin sees orders, not dashboard)

**Contract — FE:**
- Build/fix sidebar nav: Profile, Addresses, Orders, Tracking, Wishlist, Wallet, Loyalty
- Build/fix Addresses screen: list, add, edit, delete, set-default
- Default address auto-fills at checkout

**Acceptance:**
- All 7 screens accessible from sidebar
- Addresses CRUD works end-to-end
- Default address auto-fills checkout form

**Files:**
- BE (if needed): `user/user.model.ts`, `user/user.controllers.ts`
- FE: `app/(user-profile)/` dashboard layout + new addresses page

**Effort:** M-L (5-8h — addresses CRUD is biggest piece)

---

#### **S7 — Order tracking audit + fix**

**Audit:** `/order-tracking` or similar route; backend `getOrderTrackingInfo` endpoint exists.

**Effort:** S (1-2h)

---

#### **S8 — Order history audit + fix**

**Audit:** User dashboard order list — display correctness, pagination, filters.

**Effort:** S (1-2h)

---

### Bucket 4 — CROSS-CUTTING (1 item)

---

#### **X1 — Product update round-trip test**

**Why:** Owner: "product update korle or variation update korle price gula variation gula shob thik thak show hoy na kina check dea specification variation shob thiak thak kaj kore kina"

**Test plan (after BE/Admin work mostly done):**
1. Create new product with 2 variations (2 attributes × 2 values = 4 combinations)
2. Edit price → reload edit page → verify price persisted correctly
3. Edit one variation's price → save → check PDP → verify shown
4. Add new variation value → save → check matrix expanded → check PDP swatch added
5. Remove variation value → save → check matrix shrunk → check PDP
6. Change attribute order via A3 → save → check PDP order
7. Set badge via A4 → save → check PDP badge shown
8. Set product page-content → save → check PDP theme/floating-images etc.
9. Delete a product → check S3 cleanup (already known cascade works per Phase 2 product-form-batch2)

**Acceptance:** All scenarios round-trip correctly; bugs found → file inline + fix

**Owner has 4 test products ready** — use those.

**Effort:** M (4-6h — 80% testing, 20% bug-fix as found)

---

## 📊 Effort grand total (revised after owner's 2026-06-04 scope locks)

| Bucket | Items | Estimated hours |
|---|---|---|
| Backend (M28, M18, M20+per-product-delivery, B2, B1 BE side, A4/M24 BE bits) | 5 cards | 14-26h |
| Admin (A2, A3, A4, M24) | 4 | 14-22h |
| Storefront (S1, S2, M9, M14, M16, S3a+b, S4+S5 bundle, S6+addresses, S7, S8, B1 FE side) | 10 | 28-48h |
| Cross-cutting (X1) | 1 | 4-6h |
| **TOTAL** | **20 cards** | **60-102h** |

⚠️ **Scope grew** with owner's 2026-06-04 clarifications:
- M20 added per-product delivery rules (4 modes)
- M28 added `currency_name` field + Bangla number context
- B1 expanded to BE + FE both
- S3 added explicit S3b product-level SEO wiring
- S4+S5 added Google Search Console + bundled to one big audit
- S6 added explicit addresses CRUD (was missing entirely)

6 days × your variable capacity. Aggressive end of range = tight; if any one item blows up (B1 surprises, S3b product seo fields missing) → may slip Day 7. Owner will decide cut-or-extend at day 4 checkpoint.

**Risk items (could blow up):**
- B1 anonymous flow (BE+FE audit + market memo + fix)
- S3a+S3b SEO bundle (per-page metadata + product seo wiring + sitemap + JSON-LD)
- S4+S5 analytics (7 platforms)
- S6 dashboard + addresses CRUD (if addresses missing entirely on BE)

---

## 🚀 Implementation sweep order (HORIZONTAL)

### Layer 1 — BE (Days 1-2)

Order within BE:
1. **M28 Currency** — small + unblocks FE hardcoded fixes later
2. **M18 Coupon date** — 1-hour real bug
3. **M20 Shipping recompute** — security
4. **B2 Attribute delete** — small edge case
5. **A4 BE bits** — add `variation_badge_icon_key` + maybe `_color`
6. **M24 BE bits** — updateCategoryServices recompute path + descendants
7. **B1 Anonymous flow audit** — read flow, write memo, propose, await owner pick, fix

After BE done: API smoke test via curl/Postman on every changed endpoint. BE tsc EXIT 0. Commit + push BE v2.

### Layer 2 — Admin (Days 3-4)

1. **A3 attribute value DnD reorder** — `@dnd-kit/sortable` install + StepOneVariation
2. **A4 badge admin UI** — VariationBadgeCell in matrix table + IconPicker
3. **M24 admin** — re-enable parent picker + confirmation modal
4. **A2 product table** — owner-approved column set + filters

After Admin done: Vite build EXIT 0. Manual click-test each admin screen. Commit + push Admin v2.

### Layer 3 — FE (Days 5-6)

1. **S1 cart→checkout rename** — quick warmup
2. **M9 SKU display** — 30-min
3. **M16 query forward** — small
4. **M14 per-variant gallery** — medium
5. **S2 PDP media audit** — overlaps with M14 work
6. **M28 FE** — formatCurrency utility + replace hardcoded
7. **A4 FE badge render** — VariationPicker badge layer
8. **S6 dashboard / S7 tracking / S8 history** — audit + fix
9. **S3 SEO** — page-by-page metadata
10. **S4 Meta Pixel / S5 GTM-GA4-Clarity-TikTok** — funnel events

After FE done: Next build EXIT 0. Owner end-to-end smoke test. Commit + push FE v2.

### Day 6 final — DEPLOY

Owner runs full anonymous→register→order→admin→tracking flow. If green:
- BE v2 → main → push (Coolify deploys BE)
- Admin v2 → main → push (Coolify deploys Admin)
- FE v2 → main → push (Coolify deploys FE)
- Live verify each domain
- Tick admin role permission checkboxes for M2/M3 12 new flags

---

## 🧪 Test cadence

- **Per item:** Inline test by Claude (tsc + smoke)
- **Per layer end:** Batch test by owner (2-3 hour live session)
- **Per heavy item:** Same-day owner test (e.g. B1 audit + fix)
- **Day 6:** Full end-to-end smoke before deploy

---

## ⚠️ Open questions to resolve at implementation start (NOT now)

Owner-resolved 2026-06-04 (no longer open):
- ✅ S1: rename `/cart` → `/checkout` (URL + title only; delete duplicate folder if stub)
- ✅ A4: badge color = theme primary always (no per-badge color)
- ✅ M20: per-product delivery rules added (4 modes)
- ✅ M28: dynamic symbol + name + code (no hardcoded)

Still open (resolve at impl-time):
1. **A2:** Exact product table columns — owner picks at A2 start (after I show current vs proposed)
2. **M20:** District detection from address — verify shape at impl time
3. **M20:** Multi-product cart shipping strategy — sum vs max
4. **S3b:** Verify product seo_* fields exist; if missing, scope grows
5. **S6 addresses:** Add to `user.addresses[]` (recommended simpler) vs new collection — at impl start

---

## 📂 Per-feature scratch notes

If any item needs deeper notes during implementation, create `.claude/work/client-sprint/<item>.md` (e.g. `B1-anon-flow-audit.md` for the audit memo).

## 🔗 Related docs (audit work paused, plans intact)
- [PRODUCTION_AUDIT_PLAN.md](PRODUCTION_AUDIT_PLAN.md) — master 3-stage audit (resume post-clone)
- [audit/BACKEND_SECURITY_AUDIT.md](audit/BACKEND_SECURITY_AUDIT.md) — 1.5a checklist (paused)
- [audit/findings/](audit/findings/) — F001-F006 cards + F003b/F004 deferred plans
- [MASTER_BACKEND_ROADMAP.md](MASTER_BACKEND_ROADMAP.md) — Phases A-E shipped
