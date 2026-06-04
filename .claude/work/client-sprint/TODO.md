# Client Sprint TODO

**Sprint doc (source of truth):** [docs/_ai/CLIENT_SPRINT.md](../../../docs/_ai/CLIENT_SPRINT.md)
**Approach:** Horizontal sweep (BE-all → Admin-all → FE-all)
**Scope tweaks 2026-06-04:** M20 + per-product delivery rules; M28 + currency_name; B1 BE+FE both; S3 + product SEO field wiring; S4+S5 bundled with Search Console; S6 + addresses CRUD; A4 theme-primary color (no field)

## Layer 1 — BE
- [x] M28 BE+Admin+util — `currency_name` field + 3 helpers + 3-field Admin form with tri-preview + `formatCurrency()` utility in FE (search-replace deferred to natural FE-layer touches: analytics → S4/S5, order pages → S6/S8, PDP price → S2)
- [ ] M18 Coupon date-range server validation
- [ ] M20 Shipping cost server recompute + per-product delivery rules (4 modes)
- [ ] B2 Attribute delete edge case (409 if used)
- [ ] A4 BE bits — add `variation_badge_icon_key` field
- [ ] M24 BE bits — updateCategoryServices recompute path + descendants
- [ ] B1 BE side — anonymous→register flow audit memo
- [ ] Verify product SEO fields (S3b prerequisite)
- [ ] BE tsc EXIT 0 + smoke test
- [ ] Commit + push BE v2

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

## NEXT — Resume here
**Owner approves sprint doc → start Layer 1 BE with M28 (Currency).**
