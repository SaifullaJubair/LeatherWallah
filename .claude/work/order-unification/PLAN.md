# Order System Unification + Future-Ready Schema — PLAN

**Created:** 2026-06-11
**Status:** PLANNING (edge-audit pending before code)
**Owner goal:** এক unified order flow যাতে regular / flash sale / campaign / offer-bundle / custom product / pre-order / subscription / gift / wholesale — সব order type **একই collection, একই admin page, একই status system** দিয়ে handle হয়। Schema future-ready কিন্তু over-engineered না।

---

## 0. Current State (verified by reading code)

| Order type | কোথায় যায় | Status |
|-----------|-----------|--------|
| Regular product | `orders` + `orderproducts` | ✅ unified flow |
| Campaign product | `orders` + `orderproducts` (line-level `campaign_id`) | ✅ ALREADY unified |
| Flash sale | `orders` (price resolver flash>campaign>variation>base) | ✅ ALREADY unified |
| **Offer / bundle** | **`offerorders` collection (SEPARATE)** | ❌ NOT unified — the only outlier |
| POS / admin | `orders` (`order_source: "admin"`) | ✅ unified |

**Key finding:** শুধু **offer/bundle** আলাদা collection এ। Campaign + flash sale ইতিমধ্যে regular order এই যায়। তাই unification = মূলত **offerorders → orders merge**।

**Status work already done this session (committed-pending):**
- `order_status` enum এ `on_hold`, `confirmed`, `completed` added (BE interface+model+controller)
- SMS fires on `confirmed` (admin order-confirm)
- Admin OrderTable dropdown + color maps + FE Stepper + all status-display color maps updated
- ⚠️ `offerOrder` এর enum এখনো পুরোনো (6 status) — merge এর সময় এটা irrelevant হয়ে যাবে

---

## 1. Scope decision — 3 phases

### Phase A — Future-ready schema fields (LOW risk, additive only)
এখনই `orders` + `orderproducts` schema তে optional fields add করব। **কোনো logic wire করব না** — শুধু slot reserve। Existing docs এ `null`/default থাকবে, কোনো migration লাগবে না।

**Why now:** field পরে add করা cheap, কিন্তু field টা **কোথায় কোথায় wire করতে হবে সেটা ভুলে যাওয়া** ব্যয়বহুল। Schema তে রাখলে future feature এর সময় শুধু wire করতে হবে, schema touch করতে হবে না।

### Phase B — Offer/bundle merge into orders (MEDIUM-HIGH risk)
`offerorders` collection বাদ → offer order এখন `orders` এ যাবে `order_type: "offer"` + `offer_id` দিয়ে। `offerorders` module delete। Admin OfferOrderListTable + FE OfferHistory + offer invoice → regular order UI তে merge।

### Phase C — Deferred builds (আলাদা sprint, এখন না)
custom product / pre-order / subscription / digital / wholesale এর actual feature build। Phase A schema slot গুলো এখানে wire হবে।

---

## 2. Phase A — Schema fields to add

### 2a. `orders` collection — new OPTIONAL fields

```ts
// ── Order classification ──────────────────────────────────────────
order_type?: "regular" | "offer" | "campaign" | "flash_sale"
           | "pre_order" | "subscription" | "wholesale" | "gift" | "custom";
           // default "regular". Primary nature of the order.
           // NOT a tag-array — single value keeps admin filter simple.
           // Multiple natures (gift + custom) handled via the flag booleans below.

// ── Promotion references (already have coupon_id; add the rest) ────
offer_id?: ObjectId;        // → offers (Phase B uses this)
flash_sale_id?: ObjectId;   // → flash_sales (future module)
subscription_id?: ObjectId; // → subscriptions (future module)
// campaign_id lives on order_products line-level already — leave it there

// ── Currency (future multi-currency / multi-client resale) ────────
currency?: string;          // default "BDT"
exchange_rate?: number;     // default 1 — base-currency multiplier

// ── Gift ──────────────────────────────────────────────────────────
is_gift?: boolean;
gift_message?: string;
gift_wrap_charge?: number;
gift_recipient_name?: string;

// ── Pre-order ──────────────────────────────────────────────────────
is_pre_order?: boolean;
expected_delivery_date?: string;
pre_order_deposit?: number;

// ── Subscription ───────────────────────────────────────────────────
subscription_interval?: "weekly" | "monthly" | "quarterly";
subscription_cycle?: number;
next_renewal_date?: string;

// ── Wholesale / B2B ────────────────────────────────────────────────
is_wholesale?: boolean;
company_name?: string;
company_address?: string;
wholesale_note?: string;

// ── Audit / ops (HIGH VALUE, wire in Phase A itself — see 2c) ──────
cancel_reason?: string;     // why cancelled (admin/customer)
return_reason?: string;     // why returned
internal_note?: string;     // admin-only note, customer never sees
fraud_status?: "low" | "medium" | "high" | "blocked";
fraud_checked?: boolean;
```

> NOTE: many payment/courier/loyalty/POS fields **already exist** on the order model (verified). Don't re-add: `payment_method`, `payment_status`, `paid_amount`, `advance_amount`, `transaction_id`, `vat_amount`, `loyalty_redeem_*`, `admin_created_by`, `admin_manual_discount`, `manual_discount_reason`, `payment_method_note`, all courier fields, `stock_restored`, `meta_purchase_sent`, `tiktok_purchase_sent`, `order_source`.

### 2b. `orderproducts` collection — new OPTIONAL fields

```ts
// ── Display snapshot (freeze name/image at placement) ─────────────
product_name_snapshot?: string;   // survives product rename/delete
product_image_snapshot?: string;  // survives image change/delete
// (SKU/barcode snapshot already exist)

// ── Discount provenance (which layer gave the price) ──────────────
discount_source?: "offer" | "campaign" | "flash_sale" | "coupon" | "manual" | "none";

// ── Per-line customization (cake text, jewelry engraving, dress size note) ──
customization_note?: string;
customization_charge?: number;    // extra cost added to this line
customization_files?: string[];   // S3 URLs of reference images

// ── Per-line tax ───────────────────────────────────────────────────
vat_rate?: number;
vat_amount?: number;

// ── Digital product (course, ebook) — future ──────────────────────
is_digital?: boolean;
download_url?: string;
download_expires_at?: string;
download_count?: number;
```

### 2c. Phase A WIRING (only these 5 — small, high-value)

Schema-only fields (gift/pre-order/subscription/wholesale/digital/customization) get **NO wiring** in Phase A — pure slots.

These 5 DO get wired now because they're cheap + immediately useful:

| Field | Wire where |
|-------|-----------|
| `order_type` | order POST: default `"regular"`; offer POST (Phase B): `"offer"`. Admin order list: filter chip + column badge. |
| `currency` | order POST: read from `settings.currency_symbol`/`currency_code`, default `"BDT"`. Admin/FE invoice: show. |
| `cancel_reason` | updateOrder controller: accept when `order_status==="cancel"`. Admin order detail: text input on cancel. |
| `return_reason` | same, for `return`. |
| `internal_note` | updateOrder: accept. Admin order detail: textarea (admin-only). |
| `product_name_snapshot` / `product_image_snapshot` | order POST line-create: snapshot from product/variation at placement. Admin/FE order detail: prefer snapshot over live populate. |

---

## 3. Phase B — Offer/bundle merge

### 3a. Backend
1. **Offer order POST → regular order flow.** Change FE `ProductTable.jsx` to POST `/order` (not `/offer_order`) with:
   - `order_type: "offer"`, `offer_id`
   - `offer_products[]` mapped into the standard `order_products[]` line shape (offer_product_id→product_id, offer_product_price→product_unit_final_price, etc.)
2. **Price authority:** offer price must flow through the BE recompute/resolver. Add an `offer` branch to `order.recompute.ts` (currently handles campaign + flash + variation + base). Offer discount (fixed/percent on line) applied → `discount_source: "offer"`.
3. **Delete `offerOrder` module** (interface, model, service, controller, routes) once nothing references it.
4. **Migration:** existing `offerorders` docs — DB is fresh (dev), drop collection. For a future client with live offerorders, write a one-time copy script (note in plan, don't build now).
5. **Remove offer_order routes** from `routes.ts`. **Keep `offer_order_show`/`offer_order_update` permission flags?** → repurpose: offer orders now gated by `order_show`/`order_update`. Remove the offer_order_* flags from role model/interface + permissionData.js (or leave as dead — decide in audit).

### 3b. Admin
- Delete `OfferOrderListTable.jsx` + its page/route/sidebar entry.
- Offer orders appear in the main Orders list, distinguishable by `order_type: "offer"` badge + filter chip.
- Order detail (`ViewAllOrderInfo`) already shows order_products — offer lines render the same way (after merge the line shape is identical).

### 3c. Frontend
- Delete `OfferHistory.jsx` → offer orders show in `PurchaseHistory.jsx` (already reads order_status; just needs the offer orders to be in `orders`).
- Delete `OfferOrdersInvoice.jsx` → use regular `OrderInvoice.jsx`.
- Update `offer-orders/[userId]/[offerId]/page.jsx` + `Dashboard.jsx` offer references.
- Update `robots.js` + `pageSeo.js` offer-order references.

---

## 4. Files touched (Phase A + B)

### Phase A (schema + 5 wirings)
- BE: `order.interface.ts`, `order.model.ts`, `order.controller.ts` (postOrder snapshot + currency + updateOrder cancel/return/internal), `orderProduct.interface.ts`, `orderProduct.model.ts`
- Admin: `ViewAllOrderInfo.jsx` (cancel/return reason input + internal note + order_type badge), `OrderTable.jsx` / `OrderPage.jsx` (order_type filter)
- FE: `OrderInvoice.jsx` + `MyOrderTracking.jsx` (currency, snapshot name/image), `PurchaseHistory.jsx` (snapshot)

### Phase B (merge)
- BE: `ProductTable.jsx`(FE) repoint, `order.recompute.ts` offer branch, `routes.ts`, delete `offerOrder/*`, `role.model.ts`/`role.interface.ts`, dashboard controller offer refs
- Admin: delete OfferOrderList page+table+route+sidebar, `permissionData.js`
- FE: delete OfferHistory + OfferOrdersInvoice, update Dashboard + offer-orders page + robots + pageSeo

---

## 5. Open questions for owner (resolve in/after audit)

1. **Phase B এখন করব নাকি শুধু Phase A?** Phase A low-risk additive; Phase B touches 3 apps + deletes a module.
2. **`order_type` single-value enough?** নাকি gift+custom একসাথে দরকার → flag booleans (is_gift/is_pre_order/is_wholesale) already cover combos. Recommend: `order_type` = primary + flags = secondary. (Already in plan.)
3. **offer_order_* permission flags** — remove বা repurpose?
4. **Snapshot strategy** — `product_name_snapshot` add now (recommended for order-history integrity) নাকি keep live-populate?

---

---

## 6. EDGE-AUDIT RESULTS (2026-06-11) — inline + fresh-context `plan-edge-auditor`

### 🚨 BLOCKERS (Phase B only — Phase A is clean)

**B1 — Offer price = 100% client-fabricated, no server authority.**
recompute.ts এ offer branch নেই; offerOrder.controller `recompute` call করেই না — client যা পাঠায় তাই DB তে লেখে। Offer discount `offers.offer_products[].offer_discount_price/type` এ, product এ না। Merge করলে recompute full price ধরবে, offer discount উধাও।
→ **Fix:** recompute এ offer branch — `order_type:"offer"`+`offer_id` order-level; line standard shape। recompute এ: offer doc fetch → active + date-window verify → প্রতি line এর product `offer.offer_products[]` এ খুঁজে discount apply। Client price overwrite, trust না।

**B2 — Guest offer checkout আজও ভাঙা, merge এও ভাঙবে।**
`ProductTable.jsx:229` fetch এ `credentials:"include"` নেই; `:195` `customer_id:userInfo?.data?._id` পাঠায়; `customer_id` required (both schemas)। Guest = undefined → fail। Regular guest path `postOrder` এ `need_user_create:true`+`customer_name`+`customer_phone` লাগে — offer form এ এগুলো নেই।
→ **Fix:** merged offer checkout এ `customer_name` + `need_user_create:true` (guest) + `credentials:"include"`; অথবা offer page login-gated।

**B3 — Stock double-decrement / skip।**
offerOrder.controller:66-103 নিজে `$inc product_quantity` করে (unguarded, no maintain_stock, no sold_count) — OLD pattern। Merge এ regular `decrementStockForLines`+`bumpSoldCounts` চলবে। কিন্তু offer line `offer_product_quantity`, recompute line `product_quantity` — mapping ভুল হলে stock skip।
→ **Fix:** offer recompute branch এ `offer_product_quantity → product_quantity` explicit map। পুরোনো offer decrement মুছে ফেলা (module delete এ যায়)।

### ⚠️ HIGH

- **H1 — `order_type` filter `getDashboardOrder` এ wire করতে হবে** (controller:766-817 এ destructure এ নেই; count query ও ignore করবে → pagination ভাঙবে)। Phase A wiring এ যোগ।
- **H2 — Snapshot back-compat:** পুরোনো order এ `product_name_snapshot=null` → সব consumer এ `snapshot || populate` fallback বাধ্যতামূলক।
- **H3 — `internal_note`/`cancel_reason`/`return_reason` শুধু admin-gated PATCH (`verifyToken("order_update")`) দিয়ে।** updateOrder পুরো body blind-write করে (no allowlist) — public/user route থেকে যেন set না হয় তা verify। (order.routes.ts PATCH `/` already `verifyToken("order_update")` — confirmed safe; field-level আলাদা guard লাগে না কিন্তু FE user-route এ এই field পাঠাবে না।)
- **H4 — offer_order menu + permissionData ইতিমধ্যে commented out** (SideNavBar:502, permissionData:86-98)। Flags role.model/interface এ dead পড়ে আছে + route এখনো `verifyToken("offer_order_show")`। → flags remove; role migration note: `offer_order_show:true` role → `order_show:true` set।
- **H5 — old offer invoice URL 404।** `OfferHistory:91` → `/offer-orders/${userId}/${item._id}`। Phase B এ route delete হলে bookmark/cache 404। → Next.js redirect `/offer-orders/[userId]/[offerId]` → unified invoice route।

### 🟡 MEDIUM

- **M1 — `product_total_amount` (offer pre-discount total) `orders` এ নেই → data loss।** offer invoice "original price" দেখালে ভাঙবে। → হয় `pre_discount_total` field add (Phase A), নয় admin/FE invoice এ rely না করা verify।
- **M2 — offer date-window server-validate** (recompute coupon:348-355 প্যাটার্ন): `offer_status==="active"` AND `now ∈ [start,end]`। নইলে expired offer replay → discount।
- **M3 — `flash_sale_id` order-level REDUNDANT — DROP।** flash sale recompute এ per-line resolved (`findActiveFlashForProduct`); order-level setter নেই, চিরকাল null। দরকার হলে `orderproducts` line এ।
- **M4 — `vat_rate`/`vat_amount` orderproducts এ:** recompute `vat_pct` দেয় কিন্তু `OrderProductModel.create` (controller:266-292) লেখে না। Field add করলে controller এ write ও Phase A তেই wire — নইলে চিরকাল null।
- **M5 — `order_type` mixed-cart semantics:** order-level, campaign/flash line-level। Mixed cart = `"regular"`। enum থেকে `"campaign"`/`"flash_sale"` DROP (redundant)। Clean enum: `regular|offer|pre_order|subscription|wholesale|gift|custom`।

### 💡 NICE-TO-HAVE
- N1 — `discount_source:"offer"` Phase B order-detail এ set করলে admin offer line চিনতে পারবে (Phase C deferred হলেও offer এর জন্য এখন set করা সহজ)।
- N2 — `order_type` → `orderSearchableField` array এ যোগ (admin search "offer" টাইপ করলে পায়)।
- N3 — `OfferOrdersInvoice.jsx:223` এ hardcoded `www.ecommerce.com` — Phase B এ regular invoice দিয়ে replace করলে এমনিতেই যাবে; note রাখা।

### ✅ Auditor confirmed plan correct on:
campaign+flash already unified; offer_order flags removal-candidate; product_total_amount not re-added; SKU/barcode snapshot already exist (not re-added); old 8-char invoice gen deleted correctly.

---

## 7. REVISED SCOPE (post-audit)

**Phase A (do FIRST — clean, no BLOCKERs):**
- Schema slots add (orders + orderproducts) — MINUS `flash_sale_id` (M3 drop), enum cleaned (M5)
- Wire 5: `order_type`(+getDashboardOrder filter H1, +searchable N2), `cancel_reason`/`return_reason`/`internal_note` (admin PATCH only H3), name/image snapshot (+fallback H2)
- `currency` → slot-only (inline audit H5: don't wire display, FE keeps settings-symbol)
- `vat_rate`/`vat_amount` orderproducts: add + wire write in controller (M4)
- `product_name_snapshot`/`product_image_snapshot`: add + write at placement + all consumers fallback

**Phase B (offer merge — needs BLOCKER fixes B1/B2/B3 designed-in):**
- recompute offer branch (B1 + M2 date-window)
- offer checkout guest support + credentials (B2)
- stock mapping (B3)
- delete offerOrder module + role flags (H4 + migration note)
- Next.js redirect (H5)
- `pre_discount_total` decision (M1)
- admin/FE offer UI merge into regular

**Phase C — deferred builds** (custom/pre-order/subscription/digital/wholesale actual features wire the slots).

---

## NEXT SESSION START HERE
→ Audit DONE. Owner approval pending on: (1) Phase A only এখন নাকি A+B একসাথে? (2) M1 `pre_discount_total` add করব? (3) currency slot-only ঠিক আছে? → তারপর Phase A code। `/test` after implementation.
