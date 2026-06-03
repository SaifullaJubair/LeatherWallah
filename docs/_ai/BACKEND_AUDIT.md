# Backend Audit — Making FruitSnacks a Production-Grade, Resellable E-Commerce Backbone

**Date:** 2026-05-24
**Goal:** Audit the whole backend (catalog, variations, pricing, filter, cart/wishlist, auth, order, settings) and lay out the structural changes needed so this codebase can be **cloned and resold to any kind of store** — single-product shops, fruit/grocery, apparel (Color × Size), electronics like StarTech (RAM × Storage × Color), Daraz-style catalogs — with a **dynamic filter system** and a **flexible variation + pricing engine**.

> **Scope clarification (important):** "Multi-client" here means **resellable** — one clone = one store (single deployment per client). It does **NOT** mean multi-tenant (many stores in one DB). So we do **NOT** need `store_id` on every model. We need **flexibility** so each clone fits its store type without code edits. (The audit agents flagged "multi-tenant" gaps — those are intentionally out of scope; ignore `store_id`/tenant recommendations.)

This doc is the source of truth for the backend hardening effort. Nothing here is implemented yet — it's the plan. Owner has approved structural / "main bone" changes if needed.

---

## TL;DR — Verdict

The backend is a **solid single-store engine** but was shaped around a simple weight-based product (fruit). The CRISM module pattern is clean and consistent. To be a top-notch resellable backbone, the **biggest gap is the variation system** (can't do multi-attribute matrix variations), followed by **pricing being computed on the frontend instead of the backend**, a **half-dynamic filter**, **no wishlist**, and **no server-side order-total validation**.

Severity legend: 🔴 must-fix (blocks resale to common store types) · 🟡 should-fix (quality/robustness) · 🟢 nice-to-have.

---

## 1. Variation System — 🔴 THE biggest structural gap

**Today:** `variations` collection has a flat `variation_name: string` (e.g. "500g") with its own price/stock/image/sku/weight. Product has `attributes_details[]` (embedded attribute name + value strings) but it is **NOT linked** to the variations collection. No combination→variation mapping.

**File evidence:**
- `variation.model.ts:7-9` — `variation_name` is a free-form string, no attribute refs.
- `product.model.ts:105-121` — `attributes_details` is denormalized strings, never consumed when creating variations.
- `product.controllers.ts` create loop saves variations from request body as-is; no combo validation/dedup.

**What works:** single product (no variation); single-axis variation if admin manually names them ("500g", "1kg").

**What breaks:** true **matrix variations** — Color × Size = 6 SKUs, each with own price/stock/image. Can't define axes, can't auto-generate combos, can't validate completeness, can't filter variations by attribute value. This blocks apparel, electronics, and most marketplace products.

**Recommended structural change (the "main bone"):**
- Give each variation a structured `attributes: [{ attribute_id, attribute_name, value_id, value_name, value_code }]` (the combination it represents) **in addition to** the display name.
- Product gets `variation_attributes: [attribute_id]` — which axes this product varies on (0 = simple product, 1 = single-axis, 2+ = matrix).
- Admin flow: pick attribute(s) → system generates the combo matrix → admin fills price/stock/image/SKU per combo (StarTech/Daraz style).
- Keep the current flat `variation_name` as a derived label (auto from value names) so old data + the themed PDP keep working.
- Storefront can then build a real variant picker (select Color → Size narrows) and filter by attribute value.

**Migration:** DB is fresh (no prod data) — we can change the variation schema directly and re-seed. Low risk.

---

## 2. Pricing Engine — 🔴 no single source of truth (computed on frontend)

**Today:** final price (base → discount_price → variation → campaign → flash → coupon) is computed in **`FruitSnacksFrontend/src/utils/helper.js`** (`productPrice`, `singleProductPrice`). The backend `GET /:product_slug` does **not** apply campaign (the campaign block is **commented out**, `product.services.ts:87-114`) and returns raw fields. "Flash sale" is referenced in the frontend priority chain but **has no backend model/service at all**.

**Why it's a problem for resale:**
- Any new client (mobile app, different frontend, marketplace integration) must re-implement the whole price priority — error-prone, drifts.
- Filter results and cart don't apply campaign pricing (price shown can differ from cart).
- Order totals are sent by the frontend and **not validated server-side** (`order.controller.ts` trusts `grand_total_amount`) — a real fraud/abuse risk.

**Recommended structural change:**
- Build a **backend price-resolver service** — one function that, given a product (+ variation, + active campaign/flash/offer), returns `{ base, discount_price, final_price, source, badge }`. Single source of truth.
- Apply it in: single product endpoint, dashboard list, filter results, cart, and order creation (recompute & verify totals server-side; reject mismatches).
- Add a real **flash sale** module (or a `flash_sale` block on campaign) so the priority chain (flash > campaign > discount_price > base) actually exists in the backend.
- Frontend `helper.js` then just displays backend-resolved numbers.

---

## 3. Filter System — 🟡 half-dynamic, needs to be fully attribute-driven

**Today:** `productFilter` supports category/brand/price/specification filtering, and the spec filter IS built dynamically via `$expr` (`product.filter.services.ts:424-463`). BUT: brands and specs are fetched **globally** (`BrandModel.find({})`, `AttributeModel.find({})`), not scoped to the active category; price range uses raw `product_price` (ignores discounts/variations); stock filter hardcoded; **attribute-based** facets (Color/Size) aren't wired because variations aren't attribute-linked (see #1).

**Recommended:**
- Once variations are attribute-linked (#1), the sidebar filters should **auto-discover** the attributes present in the current category's products → any store gets working facets with zero code change.
- Scope brand/spec facets to the active category/sub-category.
- Compute price-range from the **resolved final price** (after discount), not raw `product_price`.
- Make stock/availability filter configurable.

---

## 4. Wishlist — 🔴 missing backend entirely

**Today:** wishlist is **frontend localStorage only**. Grep found no backend module — only a `pageSeo` key named "wishlist". Users lose wishlist across devices/logout; a logged-in storefront expects server sync.

**Recommended:** add a small `wishlist` module (CRISM): `{ user_id, items: [{ product_id, variation_id, added_at }] }` + GET/POST/DELETE (user-token protected) + a `/sync` like cart. Low effort, high value, expected by any modern store.

---

## 5. Order — 🟡 totals trusted from client, currency hardcoded

**Today:** orderProducts snapshots product+variation+prices (good). But `grand_total_amount` etc. come from the frontend with **no server recompute** (`order.controller.ts`), and currency is **hardcoded `"BDT"`** (`order.controller.ts:260,381`) even though `setting` has `currency_symbol`/`currency_code` that go unused. No stock decrement/reservation on order.

**Recommended:**
- Recompute totals server-side using the price-resolver (#2); reject if client total mismatches.
- Read currency from `setting` (so a non-BD clone just changes the setting).
- Decrement stock (product/variation `quantity`) inside the order transaction; optional low-stock guard.

---

## 6b. Category model — 🔴 rigid 3-fixed-collection; should be self-referencing infinite tree

**Today:** three separate collections — `categories`, `subcategories` (parent = category), `childcategories` (parent = sub). Exactly 3 levels, hardcoded; each level is its own module + API + admin page. And **`product.category_id` is `required: true`** (`product.model.ts:57`) — you CANNOT upload a product without a category.

**Better pattern (owner likes ZatiqEasy's approach — confirmed good):** a SINGLE self-referencing `category` collection with `parent_id` (nullable; null = top level) → **infinite-depth nested tree** (adjacency list). One collection, one module, recursive. Their API returns nested `sub_categories[]` recursively (Home & Lifestyle → Anti Mosquito Net → Mosharir Net → White…, any depth).

**Why it's better for a multi-client backbone:**
- Fruit store needs 1 level; StarTech needs 4 (Laptop→Gaming→ASUS→ROG) — same code handles both.
- Collapses 3 modules → 1 (far less code, less drift).
- **Category-optional products** (small sellers with 5 items don't need categories) — like ZatiqEasy/Shopify/Woo.

**Recommended structural change (DB fresh → safe):**
- New `category`: `{ name, slug, parent_id (nullable, ref self), serial, status, image, banner, description }`.
- `product.category_id` → optional, points to any node (leaf or not).
- Build a recursive tree endpoint (like ZatiqEasy's nested response) + breadcrumb resolver.
- Touches: product schema, productFilter, admin (3 pages → 1 tree UI), frontend nav, banner aggregation.
- Migration: re-seed (no prod data).

> This supersedes the lighter "hierarchy validation" note in #6 below — doing the self-referencing refactor solves the integrity problem too (a child literally has one parent_id).

## 6. Catalog hierarchy & attributes — 🟡 flexible but unguarded

**Today:** category required, sub/child optional (good — single-level stores work). But no integrity check that a child_category actually belongs to the product's sub_category; attributes are category-optional but never enforced. `product.services.ts:~4214` has a populate bug: `specifications.specification_id` populated with `model: "attributes"` (should be `"specifications"`).

**Recommended:**
- Light validation: if child set, it must belong to the chosen sub (and sub to category).
- Fix the specification populate model bug.
- Decide attribute scoping (global vs category) and make it consistent with the new variation system (#1).

---

## 7. Auth / RBAC — 🟡 works but brittle (~100 boolean flags)

**Today:** role = ~100 flat boolean flags (`category_post`, `product_update`, …). Functional for single-store multi-admin, but adding any module means editing role.interface + role.model + admin permissionData + sidebar/page checks (easy to miss one — "flag drift"). Storefront user JWT carries only `user_phone` (not a stable id) and has a 365-day expiry.

**Recommended (optional, not blocking):**
- Consider a resource×action permission map (e.g. `{ product: ["create","update"] }`) to kill flag drift — but this is a refactor, schedule separately.
- Put `user_id` in the user JWT; shorten expiry; verify OTP expiry on all paths.

---

## 8. Smaller findings (🟢 / cleanup)

- Product UPDATE controller doesn't include `attributes_details` in its rebuild → editing a product can leave attributes stale (we already fixed page-content via a separate `/product/page-content` endpoint; the full-edit path still rebuilds — see [[product-update-route-is-full-rebuild]]).
- `theme_overrides` still in product schema but unused (we removed the per-product color override UI — [[color-picker-defaults-black-trap]]).
- Coupon has no min-order-value check and no backend date-range validation (relies on status toggle).
- Offer module = quantity bulk discount only (no true bundle/BOGO/combo). If a client needs combos, that's a new feature.

---

## Recommended build order (phases)

**Phase A — Variation engine (🔴 foundational, unblocks everything):**
attribute-linked variations + product variation axes + admin matrix builder + storefront variant picker. Re-seed demo.

**Phase B — Backend price-resolver (🔴):**
single source of truth; flash-sale module; apply in product/filter/cart/order; server-side order-total validation; currency from settings.

**Phase C — Dynamic filter (🟡):**
auto-discover attribute facets per category (depends on A); price range from resolved price.

**Phase D — Wishlist module (🔴 but small):**
backend collection + endpoints + sync.

**Phase E — Order hardening (🟡):**
stock decrement in txn, currency from settings (overlaps B).

**Phase F — Catalog integrity + bug fixes (🟡):**
hierarchy validation, specification populate bug, attribute scoping decision.

**Phase G — RBAC refactor (🟡, optional):**
resource×action permissions; JWT/user-id/expiry hardening.

> Suggested order: **A → B → C** as one big block (catalog/pricing/filter all interlock), then **D**, **E**, then **F/G** as polish. A is the keystone — most other improvements depend on attribute-linked variations.

---

---

# Part 2 — Payment, Order Fulfillment, Auth Security, Supplier (added 2026-05-24)

> Same scope: BD-focused **resellable** (one clone per client), NOT multi-country/multi-tenant. The audit agents flagged multi-country/courier-abstraction gaps — those are out of scope unless a client specifically needs another country. Below keeps only what matters for a BD resellable backbone.

## 9. Payment — 🔴 COD-only, no online gateway, no payment fields

**Today:** the system is **100% Cash-on-Delivery**. Confirmed: no SSLCommerz / bKash / Nagad / Stripe / card integration anywhere. The `order` model has **no payment fields at all** — no `payment_method`, `payment_status`, `transaction_id`, `paid_at`, `advance_payment`. Order is created `pending` and the full `grand_total_amount` is pushed to the courier as COD (`pathao.service.ts` `amount_to_collect`, `steadfast.service.ts` `cod_amount`).

**Why it matters for resale:** most BD stores now want at least **bKash/Nagad**, many want **SSLCommerz** (cards + all MFS) or **advance payment** for high-value/COD-risky orders. A resellable backbone should support both COD and online.

**Recommended structural change:**
- Add to order: `payment_method` (`cod` | `bkash` | `nagad` | `sslcommerz` | …), `payment_status` (`unpaid` | `paid` | `failed` | `partial`), `transaction_id`, `paid_amount`, `advance_amount`.
- Add a **pluggable payment-provider layer** (start with SSLCommerz, which itself covers cards + bKash + Nagad + Rocket via one integration — best bang for BD) with an init → redirect → IPN/callback → verify flow. Order moves to courier only after `paid`/`advance` (or immediately for COD).
- Support **advance (partial) payment** — common BD pattern: pay X% online, rest COD.
- This pairs with the price-resolver (#2): backend computes the amount, payment provider charges it, no client-trusted totals.

## 10. Order totals — 🟡 validated but not recomputed

**Today:** `order.validate.ts` checks the client-sent `sub_total/discount/shipping/grand_total` are internally consistent, but does **not recompute** them from product prices server-side — it trusts the frontend's per-line prices. With the backend price-resolver (#2) we should recompute every line + totals server-side and reject mismatches (real abuse protection). Also decrement stock inside the order transaction (no stock movement happens today).

## 11. Courier — 🟢 fine for BD, keep (note coupling)

Pathao + Steadfast are integrated and BD-appropriate (Pathao city/zone enums, `+88` phone normalize, webhooks). For a BD resellable backbone this is **acceptable as-is** — just note that `pathao_city_id/zone_id` are `required` on every order even when using Steadfast (minor; could relax). Courier abstraction for other countries is out of scope unless a specific client needs it.

## 12. SMS / OTP — 🟡 hardcoded BulkSMS, ignores settings config

**Today:** OTP + order SMS go through **BulkSMS BD hardcoded** in `middlewares/send.otp.phone.ts` and `utils/send.order.sms.ts` (hardcoded `bulksmsbd.net`, message text, `+88` formatting). Meanwhile `setting` HAS `sms_provider_name/api_key/api_secret/sms_sender_id/sms_enabled` fields that are **never read** — the code always uses `.env`. So the admin "SMS settings" screen is currently cosmetic.

**Recommended:** make the SMS sender read from `setting` (with `.env` fallback) so a clone can swap credentials/sender-id without code edits; keep BulkSMS as the default provider (fine for BD). A light provider-interface (BulkSMS now, others later) is nice-to-have.

## 13. Auth security — 🟡 several hardening items

Findings (file:line):
- **JWT carries only the phone**, not a stable `user_id`/`admin_id` (`user.controllers.ts:135`, `admin.controllers.ts:137`). Phone is mutable → token not pinned. Put `_id` in the token.
- **365-day token expiry** for both user + admin — far too long. Shorten (e.g. 7–30d) and/or add refresh tokens.
- **OTP stored plaintext** (`user.model.ts:21`) + **4-digit** + **no rate limit** → brute-forceable, SMS-abuse possible. Add per-phone OTP rate limit + attempt cap; consider hashing.
- **No admin password-reset flow** — a locked-out admin needs another admin to reset. Add a reset path.
- **No token revocation** — a disabled admin's token works until expiry. (lower priority for single-store.)
- Bcrypt rounds = 10 (acceptable). Cookies `httpOnly/secure/sameSite=none` (good).

These are 🟡 (single-store, BD) — not blocking, but for a backbone you'll "be proud of" they're worth doing in an **Auth Hardening** phase.

## 14. Supplier — 🟡 contact-list only, no purchase/stock-in

**Today:** `supplier` stores only name/phone/address/status. There is **no purchase-order, stock-in/receiving, or supplier cost tracking** — inventory only ever *decreases* (and currently not even that, see #10/#5). For a store that buys inventory (electronics/grocery/retail), a real backbone usually has: purchase orders, stock-in receipts (which *increase* `quantity`), and cost price per batch. Decide per client; design as a separate **Inventory/Purchasing** feature if needed.

---

# Updated build-order (incorporating Part 2)

Keystone block first, then commerce hardening:

- **A — Variation engine** (🔴 attribute-linked variations + matrix builder) — keystone
- **B — Price-resolver** (🔴 backend single source of truth + flash + server-side order totals + currency from settings)
- **C — Dynamic filter** (🟡 attribute facets, depends on A)
- **D — Wishlist** (🔴 small backend module)
- **E — Payment** (🔴 order payment fields + SSLCommerz/bKash/Nagad + advance payment) — pairs with B
- **F — Order hardening** (🟡 server-side total recompute + stock decrement in txn) — overlaps B/E
- **G — SMS from settings** (🟡 read provider config from `setting`)
- **H — Auth hardening** (🟡 JWT user_id, shorter expiry, OTP rate-limit, admin password reset)
- **I — Catalog integrity + bug fixes** (🟡 hierarchy validation, specification populate bug)
- **J — Inventory/Purchasing** (🟢 only if a client needs stock-in/PO)
- **K — RBAC refactor** (🟢 optional, resource×action)

Order: **A→B→C** (interlocked) → **D** → **E→F** (commerce/payment) → **G,H,I** (hardening polish) → J/K as needed.

---

## What's already good (keep)

- Clean CRISM module pattern, consistent across 37 modules.
- 3-level category is optional-friendly (single-level stores work).
- Variation already has per-variant price/stock/image/SKU/weight/badge fields.
- Coupon is fairly robust (fixed/percent, per-user + total limits, product/customer specific, max cap).
- Settings already externalizes a lot (shipping, free-delivery, SMS, courier keys, analytics toggles) — currency/region just need to be *used*.
- Slug history (SEO 301), theme system, page-content system all solid.
