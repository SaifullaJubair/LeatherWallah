# LW → FruitSnacks → ecommerce-core — port plan

**Written 2026-07-11, before any code.** Owner's rule: plan + edge audit first.

## The three repos and why this is delicate

| Repo | Branch | State |
|---|---|---|
| `LeatherWallah/` | `main` | Today's work. Source of truth for this port. |
| `FruitSnacks-port/` | `main` | **CLIENT IS LIVE.** Fresh clone. Coolify auto-deploys on push. |
| `FruitSnacks/FruitSnacksBackend` | `v2-dev` | New engine. **12 ahead / 5 behind `main`.** |
| `ecommerce-core/` | — | New FE+AD. Backend will be the moved `v2-dev`. |

**The hazard the owner already flagged, and I confirmed:** `v2-dev` carries
`c5f95d0` (response envelope) and `8806ecb` (auth cookies), which rewrite
`sendResponse.ts`, `global.error.handler.ts` and `auth.tokens.ts` — files every
`/api/v1` route depends on. Pushing `v2-dev` to `main` would change the shape of
every response on the client's live site AND lose the 5 fixes `main` has that
`v2-dev` does not (including **two cost-price leaks**).

**Good news, measured:** `main`'s 5 commits touch `product/*`, `variation/*`,
`demo.services`, `backfill-theme-usage`. `v2-dev`'s 12 touch `/api/v2/*`,
`sendResponse`, `auth.tokens`, `global.error.handler`. The **only overlap is
`package.json`**. So step 3's `git pull origin main` should be near-clean.

## Owner's decisions

- Port **everything** except the theme/theme-preview work — those were already
  FruitSnacks-flavoured (`3e10d85`, `2a8d587`, `c32ee50` — leather palettes,
  Oxford sample product). FS keeps its fruit ones.
- FS's courier/SMS creds belong to the **same owner** as Artisan Leather, so
  moving them to the DB is a convenience there, not a security fix. Deleting the
  old env vars is optional.
- Client has not really started using FS yet → DB-driven switch is safe to land.

## Order (owner's, and I agree)

1. **LW → `FruitSnacks-port` (main)** — port, verify, push. Client gets it.
2. **`v2-dev` ← `git pull origin main`** — resolve `package.json`, verify.
3. **Move `v2-dev` → `ecommerce-core`**, new repo, new remote.
4. **Delete `FruitSnacks/`**, and LW's 11 stale env vars.

---

## STEP 1 — what to port into FruitSnacks-port

Measured against FS, not assumed. `git diff --name-only d1bd731..HEAD` on LW,
minus the theme work.

### 1A. Backend — security + credentials (HIGHEST RISK, do first)

| File | FS state | What lands |
|---|---|---|
| `src/app/order/courier.config.ts` | **absent** | new — `getPathaoConfig` / `getSteadfastConfig` / `getWebhookSecrets`, **no env fallback** |
| `src/app/order/pathao.service.ts` | 73 lines differ | env → config; **token cache keyed on creds**; sandbox base URL |
| `src/app/order/steadfast.service.ts` | 42 lines differ | env → config; **headers built per call** (were module-load) |
| `src/app/order/webhook/pathao.webhook.controller.ts` | 70 lines differ | **raw-body HMAC** + fail-closed + timingSafeEqual |
| `src/app/order/webhook/webhook.controller.ts` | 50 lines differ | Steadfast **fail-closed** + timingSafeEqual |
| `src/app/setting/setting.model.ts` | 15 lines differ | +`pathao_store_id`, `pathao_sandbox`, `pathao_webhook_secret`, `steadfast_webhook_secret` |
| `src/app/setting/setting.interface.ts` | 5 lines differ | same fields |
| `src/app/setting/setting.services.ts` | 75 lines differ | secret-strip list + `getSmsConfig` / `getEmailConfig` **no env fallback** |
| `src/index.ts` | 27 lines differ | `express.json({ verify })` → `req.rawBody` for `/api/v1/webhook/*` |

### 1B. Admin — Courier tab + Page Content editor

| File | FS state |
|---|---|
| `SiteSetting/CourierSettings.jsx` | **absent** — new tab |
| `SiteSetting/SettingS.jsx` (9) · `pages/SettingPage/SettingPage.jsx` (9) | wire the tab; hide Feature Cards |
| `SiteSetting/AnnouncementBarSettings.jsx` (5) · `OfferBannerSettings.jsx` (4) | **POST → PATCH** (saves were 404'ing) |
| `SiteSetting/HomeLayoutTab.jsx` (15) | hide the dead Topbar card |
| `ProductPageContent/ExampleButton.jsx` · `PasteListButton.jsx` · `sectionExamples.js` | **absent** — new |
| `ProductPageContent/IconTextRepeater.jsx` (83) · `PasteTableButton.jsx` (131) · `SizeGuideEditor.jsx` (224) · `ProductPageContentForm.jsx` (168) | paste modals, caps, Example wiring |
| `ProductPageContent/PageContentLayout.jsx` (8) | **"Open live page" 404 fix** + button design |
| `ProductPageContent/pageContentMeta.js` (15) · `ProductFloatingTab.jsx` (7) | labels |
| `ProductNew/sections/CustomFieldsBlock.jsx` (41) | Icon→Label→Value order, Example |
| `ProductNew/stepOne/StepOneProductType.jsx` (4) | placeholders |
| `pages/ProductPage/ProductUpdatePage/ProductUpdatePage.jsx` (4) | **regression fix** — missing `credentials` → empty form |

### 1C. Frontend

| File | FS state |
|---|---|
| `themedProduct/theme/sections/NutritionSection.jsx` (93) | **trust grid invented promises** (3 in → 5 out), index-picked icons |
| `themedProduct/theme/sections/OfferBanner.jsx` (58) | drop hardcoded perks, 2-col |

### ❌ NOT ported (owner's call)

- `Theme/palettePresets.js`, `Theme/ThemeForm.jsx`, `Theme/ThemeFloatingManager.jsx`
- `app/theme-preview/page.js`
- `ProductNew/sections/sectionInfoContent.jsx` — **leather examples**, FS keeps fruit
- Anything whose diff is only Bangla↔English copy or leather↔fruit wording

⚠️ **But `sectionInfoContent.jsx` (66) and `pageContentMeta.js` (15) mix copy
changes with real ones.** Must be split by hand, not copied.

---

## EDGE AUDIT — step 1

### ✅ CHECKED — B1, B2, H1 all clear (2026-07-11)

**B1 — RESOLVED.** FS's `setting.model.ts` already has `pathao_enabled`,
`steadfast_enabled` and the base courier creds, exactly like LW did before today.
Only the 4 new fields need adding (`pathao_store_id`, `pathao_sandbox`,
`pathao_webhook_secret`, `steadfast_webhook_secret`). Same edit as LW.

**B2 — RESOLVED.** FS's `SETTING_SECRET_FIELDS` is byte-identical to LW's
pre-today list (11 entries, same order, same trailing comment about
`chat_livechat_embed_code`). So appending LW's 5 new entries is a clean addition,
not a merge.

**H1 — RESOLVED.** FS has `setting_secrets_update` in `role.interface.ts` AND in
the admin's `permissionData.js`, and `/setting/secrets` is already routed. The
Courier tab's permission gate will work as-is.

### 🔴 REMAINING BLOCKERS

**B3. Deploying the courier change turns FS's courier OFF.** No env fallback +
empty DB = "not configured". The client's live Pathao/Steadfast **stops working
until they fill the Courier tab**. Owner says the client is not really running
yet — **confirm before pushing.** If any real orders exist, this must be staged:
seed the DB from the current env values first, THEN deploy.

**B4. `index.ts` diff is 27 lines.** LW's has CORS/env changes FS may not want.
Port ONLY the `express.json({ verify })` hook, not the whole file.

**B5. Response envelope.** FS `main` still uses the old `sendResponse`. LW's code
does too, so this should be fine — but the webhook controllers return raw
`res.status().json()` in places. Verify they still compile against FS's shared
helpers.

### 🟠 HIGH

**H1. FS admin may lack `setting_secrets_update`.** The Courier tab is gated on
it. If FS's role model has no such flag, the tab renders the "no permission"
state for everyone. **Check `role.interface.ts` + `permissionData.js`.**

**H2. `PasteTableButton` is shared.** LW rewrote it as a modal. FS's
`CustomFieldsBlock` and `ProductPageContentForm` both mount it — porting the
modal without porting both callers leaves a broken toolbar.

**H3. Bangla vs English.** LW converted a lot of copy to English. FS is a Bangla
shop. **Do not port the copy changes** — only the structural ones. This is the
single biggest source of accidental damage in this port.

### 🟡 MEDIUM

**M1. FS's `.env` has the same owner's creds** → after the DB switch they are
dead weight but harmless. Optional cleanup.

**M2. `demo.services.ts` / `backfill-theme-usage.ts`** already ported to FS
earlier (they came FROM FS). Skip.

---

## Verification per step

**Step 1:** backend `tsc --noEmit`; admin + frontend `npm run build`; then on a
running FS backend: courier config throws with a clear message when unconfigured;
`getSmsConfig()` returns null with the old env key still present; webhook returns
401 without a secret. Push only after all green.

**Step 2:** `git pull origin main` on `v2-dev`; resolve `package.json`; `tsc`;
confirm the 5 fixes are present (`git log --oneline | grep -E "bb1977f|9f24f3d"`).

**Step 3:** move with `.git` intact so history survives; `git remote set-url`;
rename `v2-dev` → `main` on the new remote.

**Step 4:** delete `FruitSnacks/`; remove LW's 11 stale env vars from Coolify.

---

## PROGRESS

### ✅ STEP 1 DONE — pushed 2026-07-11

All three FS repos pushed to `main`; Coolify deploying (backend first).

| Repo | Commit |
|---|---|
| `FruitSnacksBackend` | `03d576e` |
| `FruitSnacksAdmin` | `cb41be6` |
| `FruitSnacksFrontend` | `f59ba0a` |

**Audit: 21/21 items landed.** Backend `tsc` clean, admin + frontend build clean.
The 5 core backend files are byte-identical to LW; the 3 that differ do so only
in comment punctuation (em-dash vs hyphen) and the `fromName` brand default.

**B3 confirmed before pushing:** FS production has **zero orders** and both
couriers disabled — nothing was mid-flight, so the no-fallback switch is safe.

**H3 handled.** FS's own copy preserved throughout:
- `label: "Nutrition"` **kept** — FS is a food shop, so nutrition is real. (LW
  renamed it "Product Details" because a shoe shop has none.)
- Bangla helper text kept; worked examples are calories / shelf-life / pack sizes.
- Theme palettes + theme-preview **not** ported (owner's call — FS keeps fruit).
- Buttons and field labels are English (owner: "where English is better, English").

**Caught my own miss:** the HomeLayoutTab Topbar card was in the plan but I
skipped it first pass. Verified it is dead in FS too (0 frontend readers,
TopNavbar commented out of the layout) and hid it.

### ✅ STEP 1 — COMPLETE (final sweep 2026-07-11)

Re-checked **every one of LW's 65 changed files** against FS rather than trusting
the plan. 63 were already correct. Two were missing, both from `497e9dc`
(Banner) — a commit made **after** this plan was written, so it never entered
the port list:

| Missing | Effect on FS | Fixed |
|---|---|---|
| `image.upload.ts` — avif/heic accept | admin uploads an iPhone `.heic` or a Chrome `.avif` → **"Unsupported file type"** | `86e0d79` |
| `internalPath.js` + `BannerItem.jsx` | admin types `fruitsnacksbd.com/x` → banner CTA **404s** | `02daa78` |

Worse than "missing": the banner fix was landed **half-way** in FS — the four
admin files (AddBanner / UpdateBanner / BannerPage / SideNavBar) had gone over
in the first pass, but the backend and frontend halves they depend on had not.

`image.upload.ts` could NOT be copied wholesale — LW's S3 key prefix is
`leather-wallah-images/`, FS's is `fruit_snacks_images/`. Patched by hand.

Deliberately still divergent (verified, not gaps): `sectionExamples.js` (food),
`palettePresets.js` + `theme-preview` (owner's call), `sectionInfoContent.jsx`.

**Lesson:** the port list was a snapshot. Any commit made after the plan is
written is invisible to it — diff the whole range, not the plan.

### ⏸️ STEP 2 — DEFERRED (owner, 2026-07-11)

Do **not** pull into `v2-dev` yet. The client has more bugs / change requests
coming for FS, some of which will need backend work — so FS `main` is going to
move again. Pulling now would just mean resolving the same `index.ts` conflict
twice. Wait until the client's round is done, then pull once.

When it does happen: `cd FruitSnacks/FruitSnacksBackend` (branch `v2-dev`) →
`git pull origin main`.

Expected: near-clean. Measured earlier — `main`'s 5 commits touch `product/*`,
`variation/*`, `demo.services`, `backfill-theme-usage`; `v2-dev`'s 12 touch
`/api/v2/*`, `sendResponse`, `auth.tokens`, `global.error.handler`. **Only
`package.json` overlaps.** But `main` now also carries `03d576e` (courier/SMS),
which touches `setting.services.ts`, `index.ts` and `app/order/*` — `v2-dev`'s
`c5f95d0` rewrote `sendResponse.ts` and `index.ts`, so **expect a conflict in
`index.ts`**. Keep both: v2's envelope wiring AND the `express.json({ verify })`
hook (the Pathao webhook needs `req.rawBody`).

Then STEP 3 (move to `ecommerce-core`, new repo) and STEP 4 (delete
`FruitSnacks/`, remove LW's 11 stale env vars).

⚠️ **Never push `v2-dev` to FS `main`** — it would rewrite every `/api/v1`
response shape on the client's live site.
