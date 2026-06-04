# Client Sprint TODO

**Sprint doc (source of truth):** [docs/_ai/CLIENT_SPRINT.md](../../../docs/_ai/CLIENT_SPRINT.md)
**Approach:** Horizontal sweep (BE-all → Admin-all → FE-all)
**Scope tweaks 2026-06-04:** M20 + per-product delivery rules; M28 + currency_name; B1 BE+FE both; S3 + product SEO field wiring; S4+S5 bundled with Search Console; S6 + addresses CRUD; A4 theme-primary color (no field)

## Layer 1 — BE ✅ COMPLETE (session 19, BE v2 `8873f56`)
- [x] M28 BE+Admin+util — currency_name field + 3 helpers + 3-field Admin form with tri-preview + formatCurrency() utility (FE search-replace folded into FE-layer cards)
- [x] M18 Coupon date validation on findACoupon (matches recompute's end-of-day grace)
- [x] M20 Shipping recompute + per-product delivery rules (per-line-additive, billing_state axis, 4 modes)
- [x] B2 Attribute delete 409 + shared countProductsUsingAttribute helper + sample_ids in response
- [x] A4 BE — variation_badge_icon_key field on variation model/interface
- [x] M24 BE — category re-parent with cycle guards + mongoose transaction + descendant cascade + product.category_path[] cascade + auto-serial in new sibling list
- [x] B1 BE — D3 security fix (kill auto-password-set in /login) + utils/phone.ts + dual-lookup in 3 sites + scripts/normalize-user-phones.ts backfill + full audit memo at .claude/work/client-sprint/B1-anon-flow-audit.md
- [ ] Verify product SEO fields (S3b prerequisite — defer to Layer 3 start)
- [x] BE tsc EXIT 0
- [x] Commit + push BE v2 (`8873f56`)
- [x] Workspace audit memo pushed (`ce0a7e0`)

## Layer 2 — Admin
- [ ] A3 attribute value DnD reorder (install @dnd-kit/sortable)
- [ ] A4 variation badge admin UI (VariationBadgeCell + IconPicker)
- [ ] M24 admin form re-enable parent picker
- [ ] A2 product table list — propose columns to owner, build
- [ ] Vite build EXIT 0 + manual test
- [ ] Commit + push Admin v2

## Layer 3 — FE
- [ ] S1 cart→checkout rename (URL + title + redirect)
- [ ] M9 SKU display on PDP
- [ ] M16 filter URL → PDP query forward
- [ ] M14 per-variant gallery auto-switch
- [ ] S2 PDP media audit + fixes + M28 currency replace in PDP price files
- [x] M28 FE utility built (currency.js); per-component replace folded into S2/S4/S5/S6/S8 cards
- [ ] A4 FE badge render in VariationPicker (theme primary color)
- [ ] S6 user dashboard audit + ADD addresses screen
- [ ] S7 order tracking audit + fix
- [ ] S8 order history audit + fix
- [ ] S3a SEO global audit + sitemap + robots + JSON-LD
- [ ] S3b Product-level SEO wiring (Next metadata reads from product fields)
- [ ] S4+S5 bundle: Meta Pixel + CAPI + TikTok Pixel + TikTok CAPI + GTM + GA4 + Clarity + Google Search Console verification
- [ ] B1 FE side — checkout/post-order/set-password/anon-history polish per audit memo
- [ ] Next build OK + owner smoke test
- [ ] Commit + push FE v2

## Day 6 — Deploy
- [ ] Owner full end-to-end smoke
- [ ] BE v2 → main → push (Coolify deploys)
- [ ] Admin v2 → main → push (Coolify deploys)
- [ ] FE v2 → main → push (Coolify deploys)
- [ ] Tick role permissions for M2/M3 new flags

## NEXT — Resume here (session 20)

**Start Layer 2 — Admin work.** All BE contracts are LOCKED on v2 (`8873f56`),
so the admin layer can build against stable APIs without re-coordination.

Recommended Layer 2 order:
1. **A4 admin** — VariationBadgeCell in StepOneVariationTable (text input maxLength 20 + IconPicker). Backend field `variation_badge_icon_key` already added.
2. **A3 admin** — install `@dnd-kit/sortable`, drag-reorder attribute value chips in StepOneVariation. Backend = none (array order is already source of truth).
3. **M24 admin** — re-enable parent picker in category edit form. Add confirmation modal "Moving this will also move N children + N products". Backend cascade ready.
4. **B2 admin** — handle 409 with sample_ids in attribute delete confirmation (show count + sample links).
5. **A2 admin** — propose new product list columns to owner, then build. Likely include: thumbnail/SKU/name/category/stock/price/variations count/sold_count/last updated.
6. **B1 admin** — customer list filter for guest/registered + Type column.

Layer 2 done → Vite build EXIT 0 → batch commit Admin v2 → Layer 3 FE.

Settings reminder: owner must tick supplier_* + payment_withdraw_* + payment_method_* permission flags on owner-role doc post-deploy (M2/M3 from Phase 0).
