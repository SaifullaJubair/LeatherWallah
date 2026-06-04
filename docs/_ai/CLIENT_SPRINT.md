# Client Sprint — FruitSnacks (6 days)

**Created:** 2026-06-04 (Session 19)
**Goal:** Ship 22 remaining items in 6 days, deploy clean to main, then clone repo for common e-commerce template.

**Approach:** Hybrid — per-feature contract lock UPFRONT (this doc), then horizontal sweep (BE-all → Admin-all → FE-all). Owner's reasoning: vertical per-feature 3-app work risks later features re-breaking earlier ones; horizontal sweep = stable layer + less rework.

**Branch:** All on `v2` in BE/Admin/FE. **NO partial deploys.** Single main merge at end of 6 days, owner-explicit only.

---

## 🔒 Decisions LOCKED (2026-06-04, post edge-audit)

After consolidated edge-audit on all BE-layer items, owner approved 3 critical decisions + clarified anonymous checkout must remain working.

| # | Decision | Why |
|---|---|---|
| **D1** | Multi-product cart shipping = **per-line-additive** | Each product contributes own shipping; sum to final. Matches Shopify behavior. Clearer cart line notes. |
| **D2** | Zone-detection axis = **`billing_state`** (FE convention = division) | FE detects `division === "Dhaka"`; BE field swap is legacy (line 285-286 user_division ← billing_city). DO NOT fix the swap (breaks legacy data) — read `billing_state` in recompute. |
| **D3** | **Kill auto-password-set in `/login` path** | Security hole: any phone + any password silently sets password if account has none. Replace with OTP-gated set-password only. |
| **CRITICAL** | **Anonymous checkout MUST keep working** | FB ads → cart → checkout → order place WITHOUT login. `findOrCreateUser` flow stays intact. D3 only patches the `/login` endpoint hole, NOT the order placement flow. |

**M28 status (already shipped):** currency_name field + 3 helpers + Admin tri-field form + FE `formatCurrency` utility live on v2 (BE `4be57b2`, Admin `5fcd528`, FE `aa86cee`). FE search-replace deferred to natural FE-layer touches.

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

**Why:** [coupon.model.ts](FruitSnacksBackend/src/app/coupon/coupon.model.ts) has `coupon_start_date` + `coupon_end_date` (String). `order.recompute.ts` already validates coupon active status + per-user usage. Edge-audit found `recompute.ts:248-255` already has date window check (shipped earlier). The gap is `findACoupon` controller (lines 51-104) — checks `coupon_available` + `coupon_status` but NEVER checks dates. Cart UI claims coupon valid → user proceeds → server recompute strips it → bad UX.

**Audit amendment 2026-06-04:** Real scope = `findACoupon` controller, not recompute (already done).

**Contract — BE:**
- In `coupon.controllers.ts findACoupon`, add date check matching recompute:
  ```ts
  const now = new Date();
  const start = result?.coupon_start_date ? new Date(result.coupon_start_date) : null;
  const end = result?.coupon_end_date ? new Date(result.coupon_end_date) : null;
  // Match recompute's end-of-day grace: end_date is inclusive
  if (start && now < start) throw new ApiError(400, "Coupon not yet active");
  if (end && now > new Date(end.getTime() + 86400000)) throw new ApiError(400, "Coupon expired");
  ```
- Cart-side claim and server-side recompute now agree on the same valid window.

**Contract — Admin:** no change (date inputs save correctly)

**Contract — FE:** no change (existing error toast handles new error message)

**Acceptance:**
- Apply expired coupon → "Coupon expired" at cart UI (not just at checkout submit)
- Apply future-dated coupon → "Coupon not yet active"
- Apply valid in-range coupon → discount applies (unchanged)
- Recompute path also rejects expired (already done — verify still works)

**Files:**
- BE: `coupon/coupon.controllers.ts` (findACoupon)

**Effort:** S (30min — small one-controller patch)

---

#### **M20 — Shipping cost server recompute + per-product delivery rules** 🟠 P1

**Why:** `order.recompute.ts:18-20` explicit comment: *"Shipping cost is NOT recomputed here... we keep the client's shipping_cost for now."* Tampered client can send shipping_cost = 0. PLUS owner wants per-product delivery rules (not just global settings).

**Owner-locked scope (2026-06-04):**
- Global free-delivery setting → keep working (already in settings)
- **NEW: per-product delivery override** — each product can have:
  - **delivery_mode** enum: `inherit` (default — use settings) | `free` (always free for this product) | `flat` (override with fixed amount) | `qty_threshold` (free after N units)
  - **delivery_flat_amount** (number) — used when mode=flat
  - **delivery_free_after_qty** (number) — used when mode=qty_threshold (e.g. 3 means: 3rd+ unit = free shipping for this line)

**Audit amendments 2026-06-04 (D1 + D2):**
- **Strategy = per-line-additive** (D1). Each product contributes own shipping; sum to final.
- **Zone axis = `requestData.billing_state`** (D2 — FE convention = division name). DO NOT fix the known BE field-name swap in user-doc write (line 285-286 user_division ← billing_city) — legacy data risk.
- **Global free-delivery rule applies ONLY to `inherit` lines.** Lines with explicit override (free/flat/qty_threshold) bypass the global min_order rule.
- **Customer-group shipping = YAGNI**, add TODO comment in helper.
- **Per-line formula:**
  - `free` → line shipping = 0
  - `flat` → line shipping = `product.delivery_flat_amount`
  - `qty_threshold` → if `line.qty >= product.delivery_free_after_qty` → 0; else line shipping = `zone_charge / N_inherit_lines`
  - `inherit` → line shipping = `zone_charge / N_inherit_lines` (split evenly across all inherit lines so they share, not multiply)
- Final `shipping_cost = Σ per-line costs`. If global `free_delivery_enabled + min_order` rule matches → set inherit-line shipping = 0; override lines unchanged.

**Contract — BE:**
- Add fields to `product.model.ts` + `product.interface.ts`:
  ```ts
  delivery_mode?: "inherit" | "free" | "flat" | "qty_threshold"; // default "inherit"
  delivery_flat_amount?: number;
  delivery_free_after_qty?: number;
  ```
- Build `recomputeShippingCost(requestData, lines, settings)` helper in order.recompute.ts:
  ```ts
  // 1. Detect zone from billing_state (D2 lock)
  const isInsideDhaka = String(requestData?.billing_state || "").trim().toLowerCase() === "dhaka";
  const zoneCharge = isInsideDhaka
    ? Number(settings?.inside_dhaka_shipping_charge) || 0
    : Number(settings?.outside_dhaka_shipping_charge) || 0;

  // 2. Split lines into inherit vs override
  const inheritLines = lines.filter(l => !l.product.delivery_mode || l.product.delivery_mode === "inherit");
  const overrideLines = lines.filter(l => l.product.delivery_mode && l.product.delivery_mode !== "inherit");

  // 3. Global free-delivery rule applies ONLY to inherit lines
  const inheritSubtotal = inheritLines.reduce((s, l) => s + l.product_grand_total_price, 0);
  const globalFreeApplies = settings?.free_delivery_enabled && (
    settings?.free_delivery_type === "always" ||
    (settings?.free_delivery_type === "min_order" && inheritSubtotal >= (settings?.free_delivery_min_amount || 0))
  );

  // 4. Per-line costs
  const perInheritShare = inheritLines.length > 0 && !globalFreeApplies
    ? Math.round(zoneCharge / inheritLines.length)
    : 0;
  let total = 0;
  for (const line of inheritLines) total += perInheritShare;
  for (const line of overrideLines) {
    const mode = line.product.delivery_mode;
    if (mode === "free") total += 0;
    else if (mode === "flat") total += Number(line.product.delivery_flat_amount) || 0;
    else if (mode === "qty_threshold") {
      const threshold = Number(line.product.delivery_free_after_qty) || 0;
      total += (threshold > 0 && line.product_quantity >= threshold) ? 0 : (inheritLines.length > 0 ? perInheritShare : zoneCharge);
    }
  }
  // TODO (post-sprint): per-customer-group shipping interaction
  return total;
  ```
- Wire into `recomputeOrderTotals` — replace `const shipping_cost = Number(requestData?.shipping_cost) || 0;` (line 292) with helper call.
- Server overrides `shipping_cost` regardless of client value.

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

**Open questions for impl day:** Resolved by audit decisions D1+D2 — see "Decisions LOCKED" section.

**Files:**
- BE: `product/product.model.ts`, `product/product.interface.ts`, `order/order.recompute.ts`
- Admin: `ProductForm.jsx` (new Delivery section)
- FE: cart drawer / checkout (per-line shipping note + total update)

**Effort:** M (4-7h)

---

#### **B2 — Attribute delete edge case** 🟡 P2

**Why:** Admin deletes attribute that's used in some product's `product_attributes[]` and variation `combination[]`. Today silently orphans the references (commented-out check in `attribute.controllers.ts:345-349`).

**Audit amendments 2026-06-04:**
- Existing `getAttributeUsageCount` endpoint already runs the exact `countDocuments({"product_attributes.attribute_id": id})` query. Don't duplicate — extract shared helper.
- Block delete (sprint card spec OK)
- Return useful 409 with count + sample product IDs so admin can act.

**Contract — BE:**
- Extract helper in `attribute.services.ts`:
  ```ts
  export const countProductsUsingAttribute = async (id: string): Promise<{ count: number; sample_ids: string[] }> => {
    const count = await ProductModel.countDocuments({ "product_attributes.attribute_id": id });
    const sample = count > 0
      ? await ProductModel.find({ "product_attributes.attribute_id": id })
          .select("_id").limit(10).lean()
      : [];
    return { count, sample_ids: sample.map(p => String(p._id)) };
  };
  ```
- Refactor `getAttributeUsageCount` to use it (reduce drift).
- In `deleteAAttributeInfo` controller, run guard BEFORE delete:
  ```ts
  const usage = await countProductsUsingAttribute(_id);
  if (usage.count > 0) {
    throw new ApiError(409, `Used by ${usage.count} product(s). Remove from products first.`);
    // Optionally include sample_ids in response data for "view products" link
  }
  ```

**Contract — Admin:** Update delete confirmation flow — when 409 returns with sample_ids, show "View products using this" link before requiring delete.

**Contract — FE:** no change

**Acceptance:**
- Try delete used attribute → 409 with count message
- Try delete unused attribute → success
- `getAttributeUsageCount` endpoint still works for the "this change affects N products" warning
- Race condition (admin A deletes while admin B saves product) — acceptable for single-shop scale; documented

**Files:**
- BE: `attribute/attribute.services.ts` (new helper), `attribute/attribute.controllers.ts` (use helper in both places)
- Admin: `Attribute` delete confirmation dialog (show count + sample link)

**Effort:** S (1-2h)

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

**Audit amendments 2026-06-04 — P0 finding PRE-locked + protected scope:**

**🚨 P0 SECURITY HOLE (D3 — owner approved kill):**
[user.controllers.ts:130-142](FruitSnacksBackend/src/app/user/user.controllers.ts#L130-L142) — `postLogUser` silently sets password on first login if `user_password` is empty. Any attacker who knows victim's phone can call `/login` with ANY password and own the account. No OTP, no verification.

**Fix:** Remove auto-set block in `postLogUser`. Replace with:
```ts
if (!findUser.user_password) {
  throw new ApiError(400, "Account exists but no password set. Use 'Forgot Password' to set via OTP.");
}
```
Frontend `LoginForm.jsx` handles the error by redirecting to `/forget-password` or showing "Set Password via OTP" link.

**🛡️ ANONYMOUS CHECKOUT PROTECTED:**
- `findOrCreateUser` in order.controller.ts (lines 69-133) creates `user_type: "guest"` accounts with empty password — **THIS STAYS**.
- FB ads → cart → checkout → place order WITHOUT login → still works exactly as today.
- D3 only patches the `/login` endpoint hole, NOT the order placement flow.

**Phone normalization:** [order.controller.ts:83](FruitSnacksBackend/src/app/order/order.controller.ts#L83) uses raw `customer_phone` for lookup. Two formats ("01711-123456" vs "+8801711123456") = duplicate accounts. Memo proposes E.164 normalization helper + backfill script.

**Anonymous-order SMS:** Today `sendOrderSMS_GuestUnverified` only confirms order. Memo proposes adding "Set password to track future orders" CTA link in guest SMS.

**FE three SetPassword pages (LoginForm + SetPassword + SetPasswordModal + AccountModal) all hit same `/setNewPassword` endpoint — OK shared contract.**

**Contract — BE:**
- **Kill auto-password-set in `postLogUser`** (D3 fix)
- **Phone normalization helper** in `utils/phone.ts`: `normalizeBd(phone)` → E.164. Apply in `findOrCreateUser` + login lookup + signup lookup + checkUserPhone
- **Anonymous-order SMS extension** — `sendOrderSMS_GuestUnverified` includes optional "Set password" link (FE deep-link to `/set-password?phone=X`)
- Backfill script `scripts/normalize-user-phones.ts` (one-time, idempotent)

**Contract — Admin:**
- Customer list: add "Type" column showing `user_type` (guest / registered) + `has_password` flag
- Filter: "Show only guest" / "Show only registered"

**Contract — Admin:** depends on findings (e.g. customer list filter for "guest" vs "registered" status)

**Contract — FE:**
- **`LoginForm.jsx`** — catch the new "no password set" error → redirect to `/forget-password?phone=X` automatically, OR show inline "Set Password via OTP" CTA
- **Post-order success page** — for guest orders, add prominent "Set a password to track this and future orders" CTA → `/set-password?phone=X` (deep-link prefilled)
- **`/set-password`** page already exists — verify it works for first-time set (not just forgot flow)
- **Anonymous-order history visibility** — same phone re-orders later, both as guest → after registration sees both orders (linked by phone)

**Acceptance:**
- Anonymous FB-ads buyer: cart → checkout → place order → SMS arrives → order in DB with `user_type: "guest"` ✓ (unchanged behavior)
- Same buyer returns later, tries `/login` with phone + random password → 400 "Set password via OTP" → redirect to OTP flow
- OTP flow → password set → login → sees prior anonymous orders in `/orders`
- Old security hole closed: attacker with victim's phone cannot silently own account via `/login`
- Phone in any format (01711..., +8801711..., 8801711...) → normalized → no duplicates
- Audit memo at `.claude/work/client-sprint/B1-anon-flow-audit.md` documents all findings + alternatives owner considered

**Effort:** L (6-10h — BIGGEST single item; spills across Days 5-6)

**Files:**
- BE: `user/user.controllers.ts` (kill auto-set + add error path), `order/order.controller.ts` (phone normalize in findOrCreateUser), NEW `utils/phone.ts`, `utils/send.order.sms.ts` (CTA link), NEW `scripts/normalize-user-phones.ts`
- Admin: customer list filter + Type column
- FE: `LoginForm.jsx`, post-order success page, verify `set-password/page.jsx` first-time flow

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

**Audit amendments 2026-06-04:**
- Field name `variation_badge_icon_key` confirmed consistent with existing IconPicker convention.
- Cap badge text length at 20 chars (Bangla text overflows otherwise).
- IconPicker for badge: existing curated set is line-art (Lucide). Document that line-art may render weakly on colored background; owner can pick from theme-friendly subset later.

**Contract — Admin:**
- In `StepOneVariationTable.jsx` matrix table: new "Badge" column
- Cell: text input (badge_text, `maxLength={20}`) + small IconPicker trigger (badge_icon_key)
- Helper text: "Short label (max 20 chars)"
- Reuse existing IconPicker component
- Submit: FormData append per-row `variation_details[i][variation_badge_text]`, `_icon_key`

**Contract — FE:**
- In PDP `VariationPicker.jsx`: per-chip, if badge_text → render small badge above/corner of chip
- Use `DynamicIcon` for badge_icon_key
- Badge style: small rounded pill with icon + text, **bg = theme primary**, text = contrasting (white/dark per primary lightness), `truncate` class on overflow

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

**Audit amendments 2026-06-04 (CRITICAL — affects products too):**
- **Cycle prevention required.** Reject `newParentId === thisCategoryId` AND any case where `newParentId` is a descendant of `thisCategoryId` (`CategoryModel.exists({ _id: newParentId, category_path: thisCategoryId })`).
- **Products carry `category_path[]` snapshot** ([product.model.ts:78-83](FruitSnacksBackend/src/app/product/product.model.ts#L78-L83)) — re-parent MUST cascade to products too, or storefront subtree filter breaks.
- **Transaction is mandatory** — categories + descendants + products updated in one session via `bulkWrite`.
- **`category_serial` collision** when moved into new sibling list → auto-assign `serial = max(siblings) + 1` for moved node.

**Contract — BE:**
- `category.services.ts` updateCategoryServices: if `parent_id` changed:
  1. **Cycle guards** — reject self-parent + descendant-parent moves
  2. Recompute new `category_path[]` + `depth` for this node from new parent
  3. Find all descendants (`category_path: thisId`)
  4. For each descendant, build new path (replace old ancestor chain with new)
  5. Find all products attached to this category OR any descendant — update their `category_path[]` snapshot
  6. Auto-assign new `category_serial = max(siblings.serial) + 1`
  7. All writes in single mongoose transaction (bulkWrite for descendants + products)
- Pseudo-code:
  ```ts
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1. Cycle guards
    if (String(newParentId) === String(thisId)) throw new ApiError(400, "Cannot make self parent");
    if (newParentId) {
      const isDescendant = await CategoryModel.exists({ _id: newParentId, category_path: thisId });
      if (isDescendant) throw new ApiError(400, "Cannot move under own descendant");
    }
    // 2. Resolve new position
    const newPos = await resolveTreePosition(newParentId);
    // 3. Auto-serial in new sibling list
    const maxSerial = await CategoryModel.findOne({ parent_id: newPos.parent_id }).sort({ category_serial: -1 }).select("category_serial").lean();
    const newSerial = (maxSerial?.category_serial || 0) + 1;
    // 4. Update this node
    await CategoryModel.findByIdAndUpdate(thisId, { ...data, parent_id: newPos.parent_id, depth: newPos.depth, category_path: newPos.category_path, category_serial: newSerial }, { session });
    // 5. Cascade to descendants
    const descendants = await CategoryModel.find({ category_path: thisId }, null, { session });
    const descOps = descendants.map(d => {
      const oldIdx = d.category_path.findIndex(id => String(id) === String(thisId));
      const newPath = [...newPos.category_path, thisId, ...d.category_path.slice(oldIdx + 1)];
      return { updateOne: { filter: { _id: d._id }, update: { category_path: newPath, depth: newPath.length } } };
    });
    if (descOps.length) await CategoryModel.bulkWrite(descOps, { session });
    // 6. Cascade to products
    const affectedIds = [thisId, ...descendants.map(d => d._id)];
    const products = await ProductModel.find({ category_id: { $in: affectedIds } }, null, { session });
    const newPathByCat = new Map([[String(thisId), [...newPos.category_path, thisId]], ...descendants.map(d => {
      const oldIdx = d.category_path.findIndex(id => String(id) === String(thisId));
      const newPath = [...newPos.category_path, thisId, ...d.category_path.slice(oldIdx + 1)];
      return [String(d._id), [...newPath, d._id]];
    })]);
    const prodOps = products.map(p => ({ updateOne: { filter: { _id: p._id }, update: { category_path: newPathByCat.get(String(p.category_id)) } } }));
    if (prodOps.length) await ProductModel.bulkWrite(prodOps, { session });
    await session.commitTransaction();
  } catch (err) { await session.abortTransaction(); throw err; }
  finally { session.endSession(); }
  ```

**Contract — Admin:**
- In `CategoryTree` / Category edit form: re-enable "Move to another parent" picker
- Parent picker: CategoryTreePicker (excludes self + descendants — FE-side hint; server still validates)
- Confirmation modal: "Moving this category will also move N child categories and update N products. Continue?"

**Contract — FE:** no change (storefront reads current path; refreshed naturally)

**Acceptance:**
- Move category C from root to under A → C's path = [A], depth = 1, serial = max(A's children) + 1
- Move C2 (child of C) along → C2 path = [A, C], depth = 2
- Move products attached to C or C2 → their `category_path[]` updated
- Move to self → 400
- Move to own descendant → 400
- Transaction failure → all writes rolled back

**Files:**
- BE: `category/category.services.ts` (rewrite updateCategoryServices + cycle helpers)
- Admin: `CategoryTree` component(s), category edit form (re-enable parent picker)

**Effort:** M-L (5-7h — biggest BE-layer item with transaction logic)

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
- ✅ M20: per-product delivery rules added (4 modes) + per-line-additive (D1) + billing_state axis (D2)
- ✅ M28: dynamic symbol + name + code (no hardcoded)
- ✅ B1 P0 security hole: kill auto-password-set in /login (D3); anonymous checkout protected

Still open (resolve at impl-time):
1. **A2:** Exact product table columns — owner picks at A2 start (after I show current vs proposed)
2. **S3b:** Verify product seo_* fields exist; if missing, scope grows
3. **S6 addresses:** Add to `user.addresses[]` (recommended simpler) vs new collection — at impl start

---

## 📂 Per-feature scratch notes

If any item needs deeper notes during implementation, create `.claude/work/client-sprint/<item>.md` (e.g. `B1-anon-flow-audit.md` for the audit memo).

## 🔗 Related docs (audit work paused, plans intact)
- [PRODUCTION_AUDIT_PLAN.md](PRODUCTION_AUDIT_PLAN.md) — master 3-stage audit (resume post-clone)
- [audit/BACKEND_SECURITY_AUDIT.md](audit/BACKEND_SECURITY_AUDIT.md) — 1.5a checklist (paused)
- [audit/findings/](audit/findings/) — F001-F006 cards + F003b/F004 deferred plans
- [MASTER_BACKEND_ROADMAP.md](MASTER_BACKEND_ROADMAP.md) — Phases A-E shipped
