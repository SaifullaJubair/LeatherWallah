# Next Phases — Roadmap (captured 2026-05-24)

Owner-provided backlog for upcoming sessions. **Do these phase-by-phase, one at a
time.** This doc is the source of truth for what's planned next; tick items as
done and link the relevant commit/PR. Nothing here is started yet — it's a
breakdown for planning only.

> Context: the themed PDP at `/products/[slug]` is largely dynamic now (icon
> picker, trust points, hero badges, video title, offer countdown, footer name).
> See [PDP_SECTION_AUDIT.md](PDP_SECTION_AUDIT.md) for what's already done.

---

## Group 1 — PDP polish (finish the product page)

### 1. Nutrition info tiles → fully dynamic, "add more" style
Today: the 4 right-side info tiles (উপাদান / শেলফ লাইফ / সংরক্ষণ পদ্ধতি / দেশ তৈরি)
have **static labels** + a mix of API/fallback values; some are hard-mapped or
faked from `certifications`.
**Want:** a flexible repeater — admin clicks "Add more", types **any label +
any value**, submit. Fully free-form (like a key-value list), not fixed fields.
- Schema: replace fixed `nutrition.origin/shelf_life/...`-driven tiles with an
  array e.g. `nutrition.info_tiles: [{ label, value, icon_key? }]` (keep old
  fields readable for back-compat / migration).
- Admin: repeater UI in Page Content (label + value + optional IconPicker).
- Frontend: render the array; drop the static fallback labels + the faked
  "সংরক্ষণ পদ্ধতি" / certifications-derived "দেশ তৈরি" tiles.

### 2. Nutrition nutrient ROWS → also fully dynamic
Today: nutrient rows (ক্যালরি, প্রোটিন, ফাইবার…) use **static Bangla labels** +
API values keyed by fixed field names.
**Want:** same free-form approach — admin adds any nutrient label + value. So #1
and #2 together = the whole Nutrition section becomes "add rows / add tiles,
type label+value, submit". Fully flexible.
- Decide: one combined flexible model for the section, or two arrays (rows +
  tiles). Likely `nutrition.rows: [{label, value}]` + `nutrition.info_tiles[]`.

### 3. Description / "পণ্য সম্পর্কে" section — redesign + reposition
Today: rich-text `product.description` rendered as a full-width white card under
a "পণ্য সম্পর্কে" heading. Admin uses a text editor (unknown how much they'll
write). Current full-section treatment looks weak/empty for short content.
**Want:** improve the design, possibly **move it to a better place** on the page
(not its own full bleak section). Needs a design pass — handle gracefully for
both short and long content.

---

## Group 2 — Floating images (NEW concept) ⚠️ NEEDS OWNER SKETCH
### 4. Floating image placement — full rethink
Today: `theme.floating_assets[]` (fruit images) placed left/right per section
with auto-distribute fallback.
**Owner has a new concept** and will provide a **hand-drawn sketch**. Full
detailed discussion required before any work. **BLOCKED on sketch + discussion.**
→ Open question Q1 below.

---

## Group 3 — Safety / structure

### 5. Keep the OLD single-product page alive as a separate route
Today: old design already preserved at `/products-original/[slug]` (backup made
in an earlier session). Owner wants to **make sure the old design + full code
stays working** on its own page "for now — reason to be explained later."
- Action: verify `/products-original/[slug]` still renders correctly end-to-end
  and isn't broken by any of the themed-PDP refactors. Don't delete.
→ Open question Q2 (is products-original enough, or a fresh dedicated route?).

---

## Group 4 — Admin UX (theming + product authoring)

### 6. Admin "Add New Product Theme" / theme create page → much friendlier
Make theme creation **easy to visualize**: live section previews while picking
colors, add colors visually, and **provide color-palette suggestions** (pull
good UI/UX palette ideas from online references and offer them as presets).
- Theme create/update form redesign + preset palettes + live preview.

### 7. Theme preview page — improve
The `/theme/preview/:id` page needs an update (show the theme applied to a
realistic PDP mock, all sections, so admin sees the full effect).

### 12. Page-Content editor — more visual & user-friendly
The product Page Content form should be easier to visualize/use (section-by-
section, clearer grouping, maybe live preview). Pairs with #6/#7.

---

## Group 5 — Catalog correctness (data integrity)

### 8. Category / Sub-category / Attribute — full check vs product
Verify the 3-level category hierarchy + attributes flow correctly to/from the
product (create, edit, display). Fix any mismatches.

### 9. Product CREATE flow — friendlier + better variation system
- Make the multi-step create flow more user-friendly.
- Improve the **variation system**, including **weight-per-variation** handling
  (ties into the Pathao courier weight calc — `variation_weight_grams`).

### 10. Product UPDATE flow — make everything work
On edit, ensure ALL features round-trip correctly: specifications, attributes,
variations, filters. Filter must work properly.
> Note: themed page-content already saves via `PATCH /product/page-content`
> (see [[product-update-route-is-full-rebuild]] memory). The FULL product edit
> form (`PATCH /product`, multipart) is the one to harden here.

### 11. Product PRICING — manage all price types correctly
Make sure pricing resolves correctly across: campaign, coupon, offer, combo,
regular price, discount price — and their priority/interaction. (Frontend
`helper.js` already has a discount-priority chain: flash > campaign > variation
> base — verify it covers all the above and matches admin inputs.)

---

## Group 6 — Storefront beyond PDP

### Home page redesign
After the above, redesign the frontend **home page** (currently still has
leftover leather-template sections/copy). Match the new fruit-snacks themed look.

---

## Open questions (resolve before starting the relevant phase)
- **Q1 (item 4):** Owner to provide the floating-image placement sketch; full
  discussion needed before any code.
- **Q2 (item 5):** Is `/products-original/[slug]` the intended "keep old page"
  route, or does the owner want a fresh separate route? And the "reason" for
  keeping it (mentioned, to be explained).
- **Q3 (items 1+2):** Confirm the Nutrition model — one flexible section, or
  separate `rows[]` + `info_tiles[]` arrays. Keep old fixed fields for migration?

## Suggested ordering (proposal, owner to confirm each session)
PDP polish first (1→2→3), since the page is nearly done. Then catalog
correctness (8→9→10→11) as a block (they're related and high-value). Admin UX
(6→7→12) can interleave. Floating images (4) when the sketch is ready. Home
redesign last. Item 5 (verify old page) is a quick safety check, do anytime.
