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
- [x] Verify product SEO fields (folded into S3b at Layer 3 start)
- [x] BE tsc EXIT 0
- [x] Commit + push BE v2 (`8873f56`)
- [x] Workspace audit memo pushed (`ce0a7e0`)

## Layer 2 — Admin ✅ COMPLETE (session 20, BE v2 `318de36` + Admin v2 `2851d17` + `7aca4d3`)
- [x] A3 attribute value DnD reorder (@dnd-kit/sortable installed)
- [x] A4 variation badge admin UI (VariationBadgeCell + IconPicker)
- [x] M24 admin form re-enable parent picker (with impact-preview confirm)
- [x] A2 product table list — operational dashboard + 5 column modals (Price / Stock / Images / Video / Variations) + buying-price 👁 reveal + qty migration ran clean
- [x] B2 admin — 409 dialog with sample deep-links
- [x] B1 admin — customer Type column + guest/registered filter
- [x] Vite build EXIT 0 + manual test
- [x] Commit + push Admin v2

## Layer 3 — FE ✅ COMPLETE (session 21 + 23)
- [x] S1 cart→checkout rename (URL + title + redirect) — FE `a685a2d`
- [x] M9 SKU display on PDP
- [x] M16 filter URL → PDP query forward
- [x] M14 per-variant gallery auto-switch
- [x] S2 PDP media audit + fixes + M28 currency replace in PDP price files
- [x] M28 FE utility built (currency.js); per-component replace folded into S2/S4/S5/S6/S8 cards
- [x] A4 FE badge render in VariationPicker (theme primary color)
- [x] S6 user dashboard audit + ADD addresses screen — BE `886eeda` + FE `40f761e`
- [x] S7 order tracking audit + fix
- [x] S8 order history audit + fix
- [x] S3a SEO global audit + sitemap + robots + JSON-LD
- [x] S3b Product-level SEO wiring (Next metadata reads from product fields)
- [x] S4+S5 bundle: Meta Pixel + CAPI + TikTok Pixel + TikTok CAPI + GTM + GA4 + Clarity + Google Search Console verification — Phase 1 SHIPPED session 23 (11 commits: 1A security + 1B event quality + 1C optional email). Owner live test deferred — plan at `.claude/work/analytics-s4-s5/OWNER_TEST_PLAN.md`
- [x] B1 FE side — checkout/post-order/set-password/anon-history polish per audit memo
- [x] Next build OK
- [x] Commit + push FE v2 (`a685a2d`)

## Day 6 — Deploy (PENDING — owner-triggered)
- [ ] Owner full end-to-end smoke (4 deferred test backlog items at top of [[current-status-handoff]])
- [ ] BE v2 → main → push (Coolify deploys)
- [ ] Admin v2 → main → push (Coolify deploys)
- [ ] FE v2 → main → push (Coolify deploys)
- [ ] Tick role permissions: supplier_* + payment_withdraw_* + payment_method_* (M2/M3) + setting_secrets_update (Phase 1A — owner/superadmin only)
- [ ] Admin → Site Settings → Analytics tab → real Meta/TikTok pixel IDs + CAPI tokens
- [ ] PROD DB migration scripts: `scripts/normalize-user-phones.ts` + `scripts/zero-product-qty-when-variation.ts`

## STATUS — Sprint 100% complete (code), waiting on owner deploy

All 22 sprint items shipped on `v2` across BE/Admin/FE. Post-sprint follow-ups
also shipped (Group A PDP polish + Group B serial: Items 8 / 10 / 11α). Item 9
parked to [[admin-2-rebuild-backlog]] per owner decision.

See [[current-status-handoff]] for the full session-by-session ledger and the
4 deferred owner-test backlog items.
