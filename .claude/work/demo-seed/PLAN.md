# Demo Data Seed + Clear — PLAN

**Created:** 2026-06-15 (session 43)
**Goal:** `seed:demo` populates a fresh DB with a believable FOOD-shop demo so a client sees a
presentable shop at handover; later removed via Admin "Clear demo data" button.

## Locked decisions
- Each seeded doc carries `is_demo:true` (reviews reuse existing `is_seeded`).
- Demo images uploaded ONCE to S3 under **niche-folder** `demo/food/` (programmatic uploadToSpaces).
- Runs on today's fresh production fruitsnacks DB AND reusable for future clients.
- Food preset now; `DEMO_NICHE = "food"` key in ONE place → future `demo/fashion/` etc.
- Cleanup = `is_demo` flag + one-click Admin "Clear demo data" (Site Settings section).
- **Clear KEEPS themes** (client may want Apple Red/Green) and **KEEPS S3 demo images**
  (shared across clients per niche; clear removes DB docs only).
- Images: Claude downloads free Unsplash food shots → uploads to S3 demo/food/ → seeds URLs.

## Edge-audit absorbed (the important ones)
1. Re-run guard: skip if `is_demo` product exists; `--force` = clear+reseed.
2. `clearDemoData()` written FIRST; seed uses it as rollback on partial failure.
3. Clear deletes by `is_demo`/`is_seeded` flag ONLY, never by name/slug match.
4. Clear reviews by flag (catches orphans even if client manually deleted some demo products).
5. `is_demo` default:false, STRIPPED from admin update payloads (never settable via form).
6. Seed aborts if no super-admin (publisher_id needed → run bootstrap first).
7. Image-first → all S3 ok → DB insert → any fail → auto clearDemoData() rollback.
8. Variation combination built from REAL seeded attribute _ids (not hardcoded).
9. Clear order: products first (theme counter hook), then keep theme.
10. S3 demo images NOT deleted on clear (shared/reusable).

## Phases
- **P1 schema:** `is_demo` on product/category/attribute/banner/slider (+theme for marking only).
  Strip from controller payloads.
- **P2 data:** `src/seeds/demo/food.ts` — categories(nested) + attributes(+values) + banner +
  slider + ~6 products (some w/ variation, some without) + page-content + ~10 seeded reviews.
- **P3 images:** `uploadToSpaces(file, prefix?)` optional prefix; idempotent S3 (skip if key exists).
- **P4 seed script:** `seed:demo` (+`--force`); guards; image-first; auto-rollback.
- **P5 clear:** `clearDemoData()` service + `DELETE /demo/clear` + RBAC `demo_data_clear`
  (role.interface+model+permissionData+bootstrap) + Admin Settings "Demo Data" section w/
  count preview + double-confirm.
- **P6 run:** bootstrap → seed:demo on today's prod fruitsnacks DB.

## Files (expected)
BE: ~6 model+interface, src/seeds/demo/food.ts, src/seeds/demo/index.ts (niche dispatch),
src/scripts/seed-demo.ts, src/app/demo/* (clear controller/route/service), helpers/image.upload.ts
(prefix param), role.interface.ts, role.model.ts, package.json script.
Admin: SettingPage Demo Data section + Clear button, permissionData.js, demo clear API hook.
FE: none (demo renders like real data).

## IMPLEMENTATION STATUS — session 43 (2026-06-15)
P1–P5 + Admin UI DONE + /test PASS. P6 (run on prod) PENDING owner go-ahead.

Files written:
- BE schema: is_demo on product/category/attribute/banner/slider (+ theme = label-only),
  all 6 interfaces. Stripped from create/update payloads via NEW helpers/stripDemoFlag.ts
  (wired into product/category/attribute/banner/slider controllers).
- BE image: helpers/image.upload.ts — uploadToSpaces(file, keyPrefix?) + NEW objectExists() +
  uploadBufferToSpaces(). NEW src/seeds/demo/image.ts (resolveDemoImage, DEMO_NICHE="food",
  demo/food/ prefix, idempotent via objectExists).
- BE data: NEW src/seeds/demo/food.ts (2 root + 4 child categories, 1 weight-tracking
  attribute "pack-size" w/ 3 values, 2 banners, 2 sliders, 6 products [2 variation +
  4 simple] w/ benefits/use_cases/nutrition/faqs, seeded reviews, 1 demo theme).
- BE seed: NEW src/scripts/seed-demo.ts (npm run seed:demo [-- --force]). Guards: super-admin
  required, re-run skip, slug-collision abort, image-first, auto-rollback via clearDemoData.
- BE clear: NEW src/app/demo/{services,controllers,routes}.ts — GET /demo/count + DELETE
  /demo/clear, RBAC demo_data_clear. Flag-only delete; products via deleteProductServices
  (cascade variations+S3); reviews by is_seeded; KEEPS themes + S3 demo images.
- BE RBAC: demo_data_clear in role.interface+model (bootstrap auto-grants super-admin).
- Admin: NEW DemoDataSettings.jsx (count + double-confirm "CLEAR" type-to-clear), wired into
  SettingS switch (case "demo-data") + SettingPage Store group (perm-gated tab) + permissionData.js.

Verified: BE tsc 0, Admin vite 0, BE boots clean, variation combination shape matches
frontend variantAxisAttributes() (real attribute-value ids).

## P6 — DONE (2026-06-15)
dev→main merged (BE 532499e, Admin 27761c), Coolify auto-deployed. Ran
`node dist/scripts/seed-demo.js` inside the new BE container (Node v22.11, fetch OK).
Seeded prod fruitsnacks DB: 6 cats, 1 attr, 2 banner/slider, 6 products
(2 variation + 4 simple, full page-content + OG + short_features), 18 reviews,
1 theme (3 floats). Verified live: banners + variation PDP + theme floats + OG meta
all render on fruitsnacksbd.com. WhatsApp OG works on the live domain (localhost can't).

## ✅ FEATURE COMPLETE. Client removes demo anytime: Admin → Settings → Demo Data → Clear.
