# Item 11 — Pricing Resolver: Audit + Plan

**Goal:** Complete the deferred offer / coupon / combo layers in `resolveProductPrice` so that admin-configured discounts actually flow through to the storefront, cart, and order placement.

**Audit date:** 2026-06-05

---

## 1. Current state — what's DONE

### Backend resolver — [FruitSnacksBackend/src/app/product/product.price.resolver.ts](FruitSnacksBackend/src/app/product/product.price.resolver.ts)

| Layer | Status | Where applied |
|-------|--------|---------------|
| Base product price + discount | ✅ Done | Inside resolver |
| Variation (legacy absolute + new delta) | ✅ Done | Inside resolver |
| Flash sale (fixed + percent) | ✅ Done | Inside resolver |
| **Tier pricing** (qty-based) | ✅ Done | `order.recompute.ts:265-276` (NOT inside resolver — inline in recompute) |
| **Customer-group pricing** (wholesale/vip) | ✅ Done | `order.recompute.ts:281-287` (inline in recompute) |
| **Campaign** (fixed + percent) | ✅ Done | `order.recompute.ts:291-306` (inline in recompute, not resolver) |
| **Coupon** (fixed + percent, order-level) | ✅ Done | `order.recompute.ts:344-389` (with per-person + total-available + max-amount caps) |
| **Loyalty redeem** | ✅ Done | `order.recompute.ts:408-444` |
| **VAT** (per-line override / settings) | ✅ Done | `order.recompute.ts:450-463` |
| **Advance payment** | ✅ Done | `order.recompute.ts:473-503` |
| **Shipping recompute** | ✅ Done | `recomputeShippingCost` (per-line-additive, zone-aware, free-rule) |
| Resolver stub: `campaign` | ⚠️ Accepted but ignored | resolver line 28-32 |
| Resolver stub: `coupon` | ⚠️ Accepted but ignored | resolver line 28-32 |
| Resolver stub: `offer` | ⚠️ Accepted but ignored | resolver line 28-32 |
| Resolver stub: `comboPack` | ⚠️ Accepted but ignored | resolver line 28-32 |

### Frontend storefront price — [FruitSnacksFrontend/src/utils/helper.js](FruitSnacksFrontend/src/utils/helper.js)

| Layer | Status |
|-------|--------|
| `productPrice()` flash sale | ✅ Done |
| `productPrice()` campaign | ✅ Done |
| `productPrice()` variation | ✅ Done |
| `productPrice()` base + discount | ✅ Done |
| **`productPrice()` offer** | ❌ NOT in `productPrice()` — only in [Offer.jsx/ProductTable.jsx](FruitSnacksFrontend/src/components/frontend/offer/) |
| `useCartCalculations()` coupon (fixed/percent, all/specific) | ✅ Done |
| **`useCartCalculations()` coupon BOGO** | ❌ Schema exists, no cart application |
| **`useCartCalculations()` offer** | ❌ Offer is "buy this exact combo as a special order" — separate flow via `offerorders`, NOT cart |
| **Combo product (`product_type: "combo"` + `bundle_items[]`)** | ❌ Schema exists, no resolver / cart logic |

---

## 2. What's NOT done — the actual gaps

### Gap A — Offer is a separate "deal" entity, NOT integrated into normal cart

**Current architecture:**

- `offers` collection holds curated multi-product bundles (`offer_products[]` with per-product `offer_discount_price` + `offer_discount_type`).
- Frontend `/offer/:id` page renders the bundle; checkout goes to `offerorders` collection (separate from regular `orders`).
- Storefront PDP / cart has ZERO awareness of offers — a product can be in an active offer at 30% off, but visiting its normal PDP shows the regular price.

**Why this matters for resale:**

A "fruit snacks 3-pack at 20% off" should be discoverable from the individual product PDPs (so customers buying just one snack see the upsell). Right now there's no link.

**Two design choices:**

- **A1.** Keep offers as separate flow (current) — just surface a banner on PDP "Also in this bundle: → buy 3-pack at 20% off" (link to `/offer/:id`).
- **A2.** Make offer discounts also apply to normal cart — if customer adds all 3 offer products to regular cart, automatically apply offer pricing.

A2 is harder (cart needs offer-detection logic, can mix with coupons, etc.) but more aligned with "pricing resolver" goal. A1 is just a UI surfacing task — not a pricing resolver completion.

### Gap B — Coupon BOGO layer NOT applied

Schema fields `bogo_buy_qty`, `bogo_get_qty`, `bogo_get_discount_pct` exist on coupon (added Phase E). Admin can author "buy 2 get 1 free" rule. Cart / recompute ignores it — only `fixed` and `percent` types are honored.

**Owner decision needed:** Implement BOGO application in cart + recompute? Or defer/remove the schema fields?

### Gap C — Combo product (`product_type: "combo"` + `bundle_items`) NOT priced

Schema fields exist on product. Admin can mark a product as combo and list `bundle_items: [{ product_id, quantity }]`. There's NO logic to:

- Compute combo price from its bundle (sum of components × component qty × maybe a combo discount %)
- Validate combo stock (each component must have stock)
- Decrement bundle component stock on order
- Display combo on PDP with component breakdown

This is a **fully new feature**, not a stub completion. Combo schema is more of an aspiration than a real "stub to wire up."

### Gap D — Resolver doesn't know about anything beyond base+variation+flash

The "resolver stubs" naming is misleading. The resolver intentionally only handles **pure unit price** that's deterministic from product + variation + flash. Campaign / coupon / offer / loyalty / VAT / shipping all need order-level / customer-level context that doesn't belong in `resolveProductPrice`.

Looking at `order.recompute.ts`, it's already doing the right thing — the resolver gives the unit price, then recompute applies the layer cake (campaign → tier → group → coupon → loyalty → VAT → shipping) with proper sequencing.

**So the question becomes:** what does "complete the stubs" actually mean? Three interpretations:

1. **Interpretation X** (literal): Move campaign/coupon/offer math INTO the resolver. → Bad idea, breaks separation of concerns + adds DB lookups to a sync function.
2. **Interpretation Y** (FE parity): Mirror the recompute's layers to the FE `productPrice` so PDP & cart show the same price the server computes. → Partial: campaign + flash + variation are already mirrored. Coupon stays cart-total only. Tier/group/loyalty are checkout-only. Offer is missing entirely.
3. **Interpretation Z** (build missing features): Actually implement offer-on-PDP, BOGO, combo. → Real feature work, not "stub completion."

---

## 3. Scope recommendation — what to actually build

After auditing, I think the original Item 11 estimate (6-8h "offer/coupon/combo stubs") was based on Interpretation X, which is wrong. The correct breakdown is:

### Option α — Honest "what's actually missing" pass (~3-4h)

1. **A1**: PDP "this product is also in N offers" banner (~1h)
2. **D5**: Document the resolver layer split (PR description / inline comments) so future devs know "resolver = unit price only; order context layers live in recompute" (~30min)
3. **R1**: Remove the misleading `campaign / coupon / offer / comboPack` keys from `ResolvePriceOptions` since they're never used (~30min)
4. **R2**: Build a tiny `applyCartLayers(unitPrice, ctx)` helper that mirrors `order.recompute.ts`'s campaign + coupon application so cart can show the SAME number recompute will produce at checkout. Eliminates the storefront/server price mismatch risk. (~2h)

### Option β — BOGO completion (~4h on top of α)

1. Implement BOGO cart-side: detect 2+1 / 3+1 etc. in `useCartCalculations`, render free/half-price item explicitly so customer sees the benefit (~2h)
2. Implement BOGO recompute-side: same math, server-trusted (~1h)
3. Admin UX: BOGO coupon create form already exists? Verify + add help text (~1h)

### Option γ — Combo product (~10-12h, NEW FEATURE)

1. Schema validation: bundle_items must reference active products, sum-of-components math (~2h)
2. Combo PDP renders component list with "X + Y + Z" view + optional combo discount % (~3h)
3. Cart adds combo as single line BUT stock decrement hits each component (~3h)
4. Recompute combo unit price = sum of component prices × component qty × (1 - combo_discount_pct/100) (~2h)
5. Order display + invoice rendering for combo items (~2h)

### Option δ — Offer-in-normal-cart (Gap A2) (~8h, BIG)

Same as α + cart-side offer detection + offer pricing application + conflict handling with coupons. Hardest because offers and coupons can collide.

---

## 4. Risk + dependency analysis

### Layer ordering (CRITICAL — these MUST execute in the right sequence in recompute)

Owner-locked precedence from existing code:
```
1. Base price (product or variation)
2. Flash sale (if active) — beats variation discount
3. Tier price (if qty meets threshold) — best-price-wins
4. Customer-group price (wholesale / vip) — best-price-wins
5. Campaign (if product in campaign) — overrides base
6. Coupon (cart-level, fixed or percent, with caps) — applied to sub_total
7. Loyalty redeem (clamped by balance + max%) — folded into discount
8. VAT (per-line override or settings, on net after discount)
9. Shipping (per-line-additive, zone-aware)
```

**Where BOGO would slot in:** Step 6.5 — after fixed/percent coupon discount, BOGO computes "N items get free/discount" and adds to `discount_amount`. **Risk:** BOGO + percent coupon stacking can produce nonsense (free item + 50% off everything → does the free item also count toward percent?). Need owner rule.

**Where offer-on-cart (A2) would slot in:** Step 5.5 — BEFORE coupon. Detect "cart contains exact offer combo" → swap those line prices to offer prices. Then coupon applies to discounted sub_total. **Risk:** Offer + campaign collision — what if offer products also have active campaigns? Owner rule needed (offer wins, campaign wins, or stack?).

**Where combo (γ) would slot in:** Step 3.5 — combo is its own product, so its price replaces base, tier, group. Flash/campaign/coupon can still apply on top. **Risk:** Component stock — if buyer adds combo + adds one component separately, do we double-decrement? Need owner rule.

### Anonymous-checkout constraint (from memory)

> "client ashlo fb ads dehek tahke without login buy korte chaite korte dite hobe aita kintu change korona"

Coupon BOGO + customer-group + loyalty all need a customer_id. Anonymous flow currently skips them (recompute handles guards). Anything we add MUST keep working when `customer_id` is undefined.

---

## 5. Owner decisions needed

### D1 — Which option(s) to build this session?

- **α** alone = honest cleanup + cart/recompute parity (~3-4h) — RECOMMENDED. Closes the actual gap without inventing scope.
- **α + β** = above + BOGO completion (~7-8h)
- **α + γ** = above + Combo (~13-16h)
- **α + δ** = above + Offer-in-cart (~11-12h)
- **All four** = ~25-30h, multi-session

### D2 — If β: what's the BOGO + coupon stacking rule?

- **B-a.** BOGO and percent/fixed coupons are MUTUALLY EXCLUSIVE — buyer picks one — RECOMMENDED (Daraz / Amazon behavior)
- **B-b.** BOGO applies first, then percent off remaining
- **B-c.** Both stack independently

### D3 — If γ: combo stock rule?

- **C-a.** Combo product has its own `product_quantity` (admin sets) — stock validated against this, component stock NOT touched on combo order — simpler
- **C-b.** Combo has NO own qty; sells until any component runs out; order decrements each component — accurate but complex
- **C-c.** Defer combo entirely — schema fields are aspirational

### D4 — Resolver naming cleanup?

The `ResolvePriceOptions.campaign / coupon / offer / comboPack` stubs (resolver line 28-32) are accepted but ignored — misleading. Remove?

- **R-yes.** Remove the unused option keys, clean up comments — RECOMMENDED
- **R-no.** Keep for future-proofing (current "stub" framing)

### D5 — Offer-on-PDP banner (gap A1)?

Standalone tiny addition — shows "এই product টা N টা offer-এ আছে: → bundle deal দেখুন" on PDP.

- **A1-yes.** Build it (1h, low risk) — RECOMMENDED
- **A1-no.** Skip; offer page handles discovery already

---

## 6. Proposed minimal plan — Option α + R1 + A1 + D5 (RECOMMENDED)

### Phase 1 — Cleanup (1h)

1. Resolver: drop unused `campaign / coupon / offer / comboPack` keys from `ResolvePriceOptions` interface
2. Update resolver doc-comment to clearly state "unit price ONLY; order context layers live in `order.recompute.ts`"
3. Update Backend CLAUDE.md if it discusses the resolver

### Phase 2 — FE cart/recompute parity helper (~2h)

1. Create [FruitSnacksFrontend/src/utils/applyCartLayers.js](FruitSnacksFrontend/src/utils/applyCartLayers.js) — mirrors `order.recompute.ts`:
   - Takes: array of `{ product, variation, quantity, campaign_id }`, optional `coupon`, optional `customerGroup`
   - Returns: `{ lines: [...], sub_total, discount_amount, grand_total }` (same shape as recompute response)
2. Refactor `useCartCalculations` to delegate to `applyCartLayers` for consistency
3. Document: "FE shows this, BE recompute is authoritative — they should always match"

### Phase 3 — Offer-on-PDP discoverability banner (~1h)

1. Backend already exposes offers via [product.controllers.ts:1983](FruitSnacksBackend/src/app/product/product.controllers.ts#L1983) — verify endpoint + response shape
2. New PDP component: `<OfferDiscoveryBanner productId={...} />` — fetches "active offers containing this product"
3. Renders: "এই product অংশ এই offer-এ: [Title] — [discount %] off → bundle deal দেখুন" → link to `/offer/:id`
4. Mount in `[FruitSnacksFrontend/src/components/frontend/themedProduct/theme/ProductThemedSections.jsx](FruitSnacksFrontend/src/components/frontend/themedProduct/theme/ProductThemedSections.jsx)` between Benefits and Nutrition

### Phase 4 — Test + commit (~30min)

1. Build BE / Admin / FE
2. Test: regular product PDP shows price = cart price = recompute price
3. Test: product in active offer shows discovery banner; click → offer page
4. Test: anonymous checkout still works (no customer_id path)
5. Commit on `v2` branches (no push)

### Total: ~4.5h, low risk, closes actual gaps without inventing features

---

## 7. Edge cases noted for whatever we build

- **Negative final price** — already clamped to 0 (`if (unit_final < 0) unit_final = 0;`)
- **Anonymous (no customer_id)** — tier / group / loyalty all skip; coupon per-person check skips
- **Inactive variation** — flash sale lookup uses product_id, not variation — safe
- **Expired flash sale during checkout** — flash lookup runs at recompute time; if expired between page load and checkout, price will fall back to base — owner needs to decide if this should be flagged to user or silently applied (recommend silent — Amazon behavior)
- **Campaign deactivated mid-checkout** — recompute will skip it; price reverts to base; user sees their checkout price went UP → bad UX
- **Coupon with `coupon_available: 0`** — already guards (`usageOk = false`)
- **Coupon `coupon_use_per_person` exhausted** — already guards
- **VAT applied to loyalty-redeemed amount** — already handled via proportional split

---

## 8. Next step

**Awaiting owner pick on D1-D5 above before any code.**
