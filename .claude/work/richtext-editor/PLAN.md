# Reusable Rich-Text Editor (Tiptap) — PLAN

**Goal:** A single reusable `<RichTextEditor>` component (admin) with a Docs-like
toolbar (headings, bold/italic/underline/strike, text color, font size, lists,
alignment, link, **table**, image). Copy-paste from Word/Google-Docs must land
with accurate formatting. Whatever is saved must render **identically on the PDP**
(and other public pages). Replaces `react-quill-new` gradually.

**Decisions (owner, 2026-07-07):**
- Package = **Tiptap** (headless, ProseMirror → best paste fidelity + full styling control).
- Rollout = **gradual** — wire product description first, verify against PDP, then migrate the other places one by one.
- Backend schema **unchanged** — description stays an HTML string. Tiptap I/O is HTML.
- **Image in description = DISABLED.** No inline/base64/S3 image in the description
  editor — the product Media section already has its own image uploader. Keeps
  the description HTML (and DB) light. (Resolves edge HIGH-4.)
- **Legacy Quill content = deferred.** Fresh DB / few products; if old `ql-*`
  content drifts on the PDP we fix it later, not a launch blocker. (edge HIGH-3
  CSS-shim is optional/later.)

## Where the editor is used today (react-quill-new) — 11 files
- ProductNew/ProductForm.jsx (NEW unified add/edit) ← **START HERE**
- ProductNew/stepThree/StepThree.jsx (old multi-step)
- Product/UpdateProduct/UpdateStepThree/UpdateStepThree.jsx
- ProductPageContent/ProductPageContentForm.jsx
- Offers/AddOffers.jsx, Offers/UpdateOffer.jsx
- Campaign/AddCampaign/AddCampaign.jsx, Campaign/UpdateCampaignModal.jsx
- SiteSetting/SiteSetting/Policies.jsx
- (PrintableInvoice.jsx renders HTML; App.jsx imports css)

## Where the HTML renders on the frontend (must match the editor look) — 9+ places
- PDP normal: singeProduct/productDescription/ProductDescription.jsx (`prose prose-sm` + dangerouslySetInnerHTML)
- PDP themed: themedProduct/singeProduct/productDescription/ProductDescription.jsx
- themedProduct/theme/DescriptionCard.jsx
- offer/offerProduct/OfferProduct.jsx
- 7 policy pages: FooterSection/{AboutUs,PrivacyPolicy,RefundPolicy,ReturnPolicy,CancelPolicy,Shipping,TermsCondition}.jsx

## ⚠️ Edge-audit findings (BEFORE coding)

**BLOCKER-1 — `prose` isn't actually wired.** `@tailwindcss/typography` is NOT
installed on the frontend and `tailwind.config.js` has no typography plugin. So
the PDP's `prose prose-sm` classes are (mostly) no-ops today — headings/lists/
tables in the saved HTML render flat. This is a root cause of "editor ≠ PDP".
→ Do NOT rely on `prose`. Ship a hand-written **shared `richtext.css`** that
styles h1-h3, ul/ol, table, blockquote, links, colors, font-sizes, alignment.
Import it in BOTH the editor and every render site.

**BLOCKER-2 — one CSS, many render sites.** The description HTML shows in 9+
public components. A shared stylesheet (scoped by a wrapper class, e.g.
`.rt-content`) must wrap every `dangerouslySetInnerHTML` so all sites match the
editor. Wrapping the editor's editable area in the same `.rt-content` class =
true WYSIWYG.

**HIGH-3 — legacy Quill HTML.** Existing descriptions were written by Quill and
may carry `ql-align-center`, `ql-indent-*` classes Tiptap won't emit. Options:
(a) add a few CSS shims for `ql-*` in richtext.css so old content still renders,
(b) accept minor drift. Verify on a real existing product before rollout.

**HIGH-4 — image handling.** Quill inlined images as base64 (bloats the HTML/DB).
Decide Tiptap image policy: allow only URL/none for description, OR wire the
existing S3 upload. Base64 in description is a known smell — prefer S3 or disable
inline images in description (media has its own uploader).

**MEDIUM-5 — sanitisation.** `dangerouslySetInnerHTML` + paste-from-web = XSS
surface (admin-authored, lower risk, but tables/links from paste can carry junk).
Tiptap sanitises on input to its schema, which helps. Confirm no `<script>`/style
survives round-trip.

**MEDIUM-6 — SSR.** Tiptap editor is client-only (admin is a Vite SPA, fine).
The frontend only *renders* HTML (no editor), so no SSR issue there.

**LOW-7 — bundle size.** Tiptap + table + color + image extensions add weight to
the admin bundle. Admin is an internal SPA, acceptable; lazy-load the editor
component if the product form feels heavy.

## Phased plan

### Phase 1 — Foundation
1. `npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-*` (color, text-style,
   font-size, underline, link, image, text-align, table + table-row/header/cell).
2. Build `src/components/common/RichTextEditor/RichTextEditor.jsx` (+ `Toolbar.jsx`).
   Props: `value`(html), `onChange`(html), `placeholder`, `minHeight`, `preset`
   ('full' | 'basic'). Editable area wrapped in `.rt-content`.
3. `src/components/common/RichTextEditor/richtext.css` — the shared prose rules,
   scoped under `.rt-content`.

### Phase 2 — Wire product description + verify PDP parity
4. Replace the ReactQuill in ProductForm.jsx with `<RichTextEditor>`.
5. Copy `richtext.css` (or a shared build) into the frontend; wrap PDP
   ProductDescription's render div in `.rt-content` and import the css.
6. VERIFY (Playwright): author a description with heading + colored text + table
   + list in admin → screenshot editor → save → open PDP → screenshot → compare.
   Paste from Google Docs → confirm formatting survives.

### Phase 3 — Gradual rollout
7. Migrate the remaining 10 admin sites one at a time (StepThree, UpdateStepThree,
   ProductPageContent, Offers×2, Campaign×2, Policies), wrapping each matching
   render site in `.rt-content`. Test after each.

## Verification gates
- Build passes (admin `npm run build`, frontend `npm run build`).
- Editor look === PDP look (side-by-side screenshots).
- Old Quill descriptions still render acceptably.
- Paste-from-Docs fidelity confirmed.
- No `<script>` survives round-trip.

## NEXT SESSION START HERE
→ Phase 1 not started yet. Begin with install + RichTextEditor scaffold.
Owner rule: show locally (Playwright) → owner confirms → then push. Verify dev
build compiles before pushing (curl :3001 admin, :3005 frontend).
