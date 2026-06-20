# Admin Panel — Live-Site Bugs (owner-found 2026-06-20)

Owner manually tested the LIVE admin panel and found these. **Not yet fixed — tickets only.**
Investigated/located by Claude (read-only); fix in a future session. Branch: app repos → `dev`.

---

## AB-1 — Attribute "eye" (view) modal shows wrong/empty data for non-color attributes
**Severity:** HIGH (admin can't inspect what they created)
**Where:** `FruitSnacksAdmin/src/components/Attribute/viewAttributeValue/ViewAttributeValue.jsx`
**Symptom:** After creating an attribute, clicking the eye button in the attribute table doesn't show data matching the current data structure. For a **weight** attribute, nothing shows at all.
**Root cause (located):** The view only renders `attribute_value_name` + `attribute_value_code` (treated as a color hex swatch, lines ~83, 94–127). It's color-attribute-shaped. Non-color attributes (weight etc.) — whose values may live in a different field shape / have `variation_weight_grams`-style data — aren't rendered → blank.
**Fix direction:** Make the view render generically: show value name + status + any code/unit/extra fields for ALL attribute types, not just color. Reconcile with the real attribute_values structure (check `attribute.model.ts` + how weight values are stored). Color swatch should be conditional (it already checks `attribute_name === "color"` at line 12 — extend that to a proper per-type renderer).

## AB-2 — Theme preview doesn't load on the live site
**Severity:** HIGH (owner can't preview a theme before assigning)
**Where:** Admin `src/pages/ThemePage/ThemePreviewPage.jsx` → opens FE route `FruitSnacksFrontend/src/app/theme-preview/page.js`
**Symptom:** Theme preview doesn't render — the live-site URL doesn't load / looks like an error (URL not present / 404-ish).
**Fix direction:** Verify the preview URL the admin builds matches the FE route that actually exists (`/theme-preview`). Check: (a) is `theme-preview/page.js` deployed & reachable on the live FE domain? (b) does it read the theme id/params the admin passes? (c) CORS/credentials if it fetches the theme. Likely a URL/route mismatch or the preview page expects data it isn't getting. **Reproduce on live first** (note: local may differ from deployed).

## AB-3 — Can't add a floating image while CREATING a theme (only after, in edit)
**Severity:** MEDIUM (clunky UX, not blocking)
**Where:** `FruitSnacksAdmin/src/components/Theme/ThemeFloatingManager.jsx` (line 15: *"Only available in UPDATE mode — needs a saved theme _id to attach assets to"*)
**Symptom:** On first theme create, no floating-image add. You must create the theme, then re-open it in edit to add floating images.
**Root cause (located):** Floating assets are attached via `POST /theme/:themeId/floating-asset` — needs a saved theme `_id`, which doesn't exist until after create. So the manager is gated to update mode by design.
**Fix direction:** Either (a) buffer floating images in create-form state (like the product form's `pendingFloatUploads` pattern — File + blob preview held client-side, uploaded right after the theme is created in the same submit), or (b) accept the 2-step flow but make it obvious (show a hint "save the theme first, then add floating images"). Option (a) matches the deferred-upload pattern already used for product floating overrides.

## AB-4 — Can't add MULTIPLE floating images at once
**Severity:** MEDIUM (tedious for many floats)
**Where:** `ThemeFloatingManager.jsx` (single POST per asset, ~line 95)
**Symptom:** No "+ / add more" to queue multiple floating images; must add one at a time.
**Fix direction:** Allow selecting/queuing multiple files (multi-file input or repeatable rows like the Custom Spec "Add row" UI) and upload them in a batch. Pairs naturally with the AB-3 buffered-create approach. (Note: section enum is still hardcoded "food" — MULTI-NICHE debt, line 17.)

## AB-5 — "Advanced — Custom Spec Rows" should be a rich-text page-content block, not just label/value rows
**Severity:** LOW/MEDIUM (feature request / consistency)
**Where:** `FruitSnacksAdmin/src/components/ProductNew/sections/CustomFieldsBlock.jsx` (current: Label / Value / optional Icon rows — see owner screenshot)
**Owner's point:** Custom Spec Rows is effectively page content too. It should be addable in **Page Content** alongside the product description, **with a rich-text editor** (like the description), not only as flat label/value rows.
**Fix direction:** Decide scope — (a) move/duplicate the Custom Spec editor into the Page Content tab, and/or (b) add a rich-text "value" option per row, or a free rich-text custom block. This overlaps the spec-table / custom_fields rendering already on the PDP (`DescriptionCard.jsx`). Confirm where it should live (Page Content tab) + whether rich-text per-row or a separate block. **Needs an owner scope decision before building.**

---

## Status
**ALL 5 FIXED in code on `dev` (session 50, 2026-06-20). BE tsc 0 / Admin Vite 0. Owner test + deploy pending.**

- **AB-1 DONE** — `ViewAttributeValue.jsx` rewritten: per-type "Value" cell (color swatch / weight `weight_grams_value` g / code|slug fallback) + Slug column + Display Type & Tracks Weight badges + empty-state. Verified `GET /attribute` returns the needed fields (only `-__v` stripped).
- **AB-2 DONE (code)** — new shared `src/utils/frontendUrl.js`: no more silent localhost fallback on a deployed admin → returns null + shows a "set VITE_FRONTEND_URL" hint instead. `ThemePreviewPage.jsx` + `ThemeForm.jsx` both use it (de-duplicated). ⚠️ **Owner deploy step (the real live fix): set `VITE_FRONTEND_URL=https://fruitsnacksbd.com` on the Admin container in Coolify + rebuild** (Vite inlines env at build time).
- **AB-3 DONE** — `ThemeFloatingManager.jsx` now has a buffer mode (no themeId): floats queue client-side and `ThemeForm.onSubmit` uploads them right after create (mirrors product `pendingFloatUploads`). Create-mode no longer shows the "save first" placeholder.
- **AB-4 DONE** — multi-file picker; each picked file becomes its own queue row (shared default meta, individually editable + removable); update-mode uploads the whole queue in a batch.
- **AB-5 DONE** — Description (rich text) + Custom Spec block now ALSO live in the Page Content editor (new "Description" + "Custom Spec" tabs), reusing the basic-info `CustomFieldsBlock` + ReactQuill. Backend `PAGE_CONTENT_FIELDS` += `description`, `custom_fields` (with the same trim/filter normalize as full-create). Same DB fields as the product form → last save wins (owner's chosen behaviour).

**Still to do (owner):** browser test on `dev`, then deploy; AB-2 needs the Coolify env var + Admin rebuild.
