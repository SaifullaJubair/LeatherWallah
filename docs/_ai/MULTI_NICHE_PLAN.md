# Multi-Niche Commerce Platform — Master Plan

**Created:** 2026-06-13
**Status:** VISION / BLUEPRINT — not started. First-client (food) delivery comes first.
**Owner goal:** Sell customized-looking shops to clients across niches (fashion, food,
electronics, cosmetics, lifestyle…) from ONE codebase. Clone-per-client now → SaaS later.
Client never knows it's a prebuilt common engine.

> **Research-validated.** This blueprint mirrors how Shopify + Astra (WordPress) actually
> do it: a stable engine + swappable presets (logic) + swappable themes (design) +
> niche-aware demo import. Sources cited inline. The key finding: **successful platforms
> ship niche shops by importing a preset, never by forking code.**

---

## 1. Strategy (the "why")

- **Now — clone-per-client.** Each client = its own deployment + its own DB, defined by a
  config/preset, NOT by code edits. One canonical codebase; bugs fixed in one place.
- **Later — SaaS.** When per-deploy ops pain (≈100+ clients) justifies it, flip to
  multi-tenant. The preset/config layer built now BECOMES the tenant-config layer, so the
  migration is cheap. (See [SAAS_FUTURE_PLAN.md](SAAS_FUTURE_PLAN.md).)
- **Why not alternatives (research):** per-niche repos = N-way bug patching (legacy
  anti-pattern); multi-tenant from day one = 2–3× cost for a need you don't have at <20
  clients; composable/microservices = premature for a 1–3 dev team. Keep the monolithic
  Next + Express + Mongo engine; invest in the **preset layer**, which is where multi-niche
  value actually lives.

---

## 2. Core architecture — TWO orthogonal axes

The whole trick. Logic and look are SEPARATE, independently selectable.

```
AXIS 1 — NICHE PRESET  (LOGIC: what sections/fields/filters exist)
   food | fashion | electronics | cosmetics | lifestyle | generic
   = { pdp_section_array, active_fields, filters, home_section_array, demo content }

AXIS 2 — DESIGN THEME  (LOOK: colors / fonts / floating / layout style)
   fashion-1 (modern), fashion-2 (bold-dark), fashion-3 (elegant) ...
   = { colors, typography, button_style, floating_assets, hero variant }
```

**Golden rule (Shopify-enforced):** switching a DESIGN theme must NOT change business
logic — "only presentational settings update." So a client can pick **"Food logic +
dark-green design"** or **"Fashion logic + fashion-2 look"** independently.

**Why the split matters:** to make `fashion-2` you reuse the fashion *logic* preset and
only add a new *look*. Three fashion variants = 1 logic preset + 3 designs, NOT 3× the
feature code. A logic fix propagates to all variants of that niche.

What we already have for each axis:
- **Design (Axis 2):** ✅ `themes` collection (color/font/floating/button) + per-product
  theming + `home_section_array` drag-drop reorder (Sprint 3 Track D).
- **Niche logic (Axis 1):** 🔴 does not exist yet — today PDP sections are effectively
  hardcoded to the food layout. This is the main thing to build.

---

## 3. Business types — coverage + readiness (honest)

Engine readiness today (variation + cart + checkout + courier + COD is shared by ALL):

| Niche | Ready now | The gap to "sellable" |
|-------|-----------|------------------------|
| 🟢 **Food / Dry snacks / Organic** | ~95% | just a theme (current client = this) |
| 🟢 **Fashion / Clothing** | ~95% | size_chart ✅ exists + renders; spec-table render (see §11 gap) |
| 🟢 **Electronics / Mobile / Gadget** | ~90% | spec-table render; warranty field |
| 🟢 **Cosmetics / Beauty / Perfume** | ~90% | theme + ingredients/expiry |
| 🟢 **Lifestyle (bag/watch/shoe)** | ~90% | theme (this codebase's origin) |
| 🟡 **Cake / Bakery** | ~60% | order-time customization form (Phase C) |
| 🟡 **Customize / Gift** | ~60% | same — customization input + checkout pass |
| 🔴 **Grocery (kg/gram)** | ~50% | weight-based price UI |
| 🔴 **Course / Digital** | ~30% | download flow (signed URL, Phase A slots exist) |
| 🔴 **Service / Booking** | ~10% | time-slot system (not built) |

**Sell first (engine already strong):** food, fashion, electronics, cosmetics, lifestyle —
all variation-heavy, theme + small tweaks away. **Defer (engine work needed):** cake/
customize, grocery-kg, course, booking.

---

## 4. PDP system — section registry + data-gated rendering

Research's #1 recommended pattern (Shopify JSON-template + conditional-metafield model),
and we already use it on the HOME page (`home_section_array`). Extend the SAME pattern to
the PDP.

**Today (problem):** `ProductThemedSections.jsx` renders a FIXED order of food-specific
sections (Video → Benefits/UseCases → Nutrition → Description → Reviews → FAQ → OfferBanner).
Sections self-hide when data is empty, but the list + order + labels are hardcoded food.

**Target:**
1. **Section registry** — `name → React component` map (nutrition, spec-table, size-chart,
   benefits, gallery, customization-form, faq, reviews, video, related…).
2. **Per-niche `pdp_section_array`** (like `home_section_array`) — which sections, what
   order, per niche preset.
3. **Data-gate** — each section auto-hides if the product/category lacks its data
   (already the behavior; keep it).
4. **New generic blocks to add:**
   - **Spec-table block** — renders `product.custom_fields` (label/value). Currently SAVED
     in admin but NEVER rendered on the storefront (§11 gap). One block serves
     electronics specs, jewelry details, fashion material — any key-value, any niche.
   - **Customization-form block** — for cake/custom (text message, date, photo upload).
     Writes to the Phase-A slots `customization_note / customization_charge /
     customization_files[]`. (Build in Phase C.)

This means a fashion PDP shows size-chart + spec, a food PDP shows nutrition — same
codebase, the niche preset's section array + the product's data decide.

> ⚠️ **Floating-images debt to absorb when this lands:** the section-anchored
> floating system (theme `floating_assets[].section` + product
> `floating_overrides`, shipped under NEXT_PHASES item 4) anchors floats to a
> **hardcoded food section enum** (hero/order/benefits/use_cases/nutrition/
> reviews/faq/any) in BOTH backend schemas (theme.model + product.model) AND the
> admin dropdowns (ThemeFloatingManager.jsx, ProductFloatingTab.jsx) AND
> FloatingAssets.jsx section filter. When `pdp_section_array` becomes the source
> of truth, the floating section list must be **derived from the active niche's
> section registry** instead — otherwise a fashion PDP can't anchor a float to
> its size-chart/spec section. Owner explicitly accepted this rework at build
> time (chose "Section-anchored — food-only now").

---

## 5. Field/section → niche mapping

Which content blocks each niche turns on (✅ on, 🟡 optional, ❌ off):

| Block / field | food | fashion | electronics | cosmetics | lifestyle |
|---------------|:----:|:-------:|:-----------:|:---------:|:---------:|
| nutrition | ✅ | ❌ | ❌ | ❌ | ❌ |
| ingredients | ✅ | ❌ | ❌ | ✅ | ❌ |
| benefits / use-cases | ✅ | 🟡 | 🟡 | ✅ | 🟡 |
| size-chart (image) | ❌ | ✅ | ❌ | ❌ | 🟡 |
| spec-table (custom_fields) | 🟡 | ✅ | ✅ | 🟡 | ✅ |
| warranty | ❌ | ❌ | ✅ | ❌ | 🟡 |
| variation swatch (size/color) | ❌ | ✅ | ✅ | ✅ | ✅ |
| weight-based price | 🟡 | ❌ | ❌ | ❌ | ❌ |
| expiry date | ✅ | ❌ | ❌ | ✅ | ❌ |
| customization-form | ❌ | ❌ | ❌ | ❌ | ❌ (cake/custom only) |

(Filters mirror this: fashion = size/color/brand/price; food = weight/organic/price;
electronics = brand/spec/price.)

---

## 6. Per-client config (DB) — clone-now, SaaS-ready

Store each client's profile as a STRUCTURED block (not scattered across the 206-field
settings monolith — see [SETTINGS_ARCH_DEBT.md](SETTINGS_ARCH_DEBT.md)). Prefer ONE preset
bundle over dozens of independent booleans the client must set (research: "config hell").

```
client config (in settings or a small new collection):
  niche_preset:      "fashion"            // Axis 1 (logic)
  theme_preset:      "fashion-2"          // Axis 2 (design)
  enabled_features:  ["wishlist","loyalty","reviews","abandoned_cart", ...]
  plan_tier:         "basic" | "premium"  // for future SaaS billing
```

This is just DB fields now (no central panel). In the future SaaS phase, the Platform
Admin reads exactly these fields — that's the "write SaaS-ready" payoff.

---

## 7. Bootstrap-preset = the agency demo importer

The single highest-leverage, cheapest-to-build lever. Astra "Starter Templates" (millions
of users) is the proof: one engine + a library of niche demos, one-click imports demo
content + layout + settings, then you just swap branding.

**We already have `npm run bootstrap`** (seeds super-admin + role + settings + pageSeo on
a fresh DB). Make it niche-aware:

```
npm run bootstrap -- --preset=fashion
   → seeds: fashion home_section_array + fashion pdp_section_array
            + active fashion fields/filters + fashion theme preset
            + fashion DEMO products & copy (see §8)
npm run bootstrap -- --preset=food      (the current client's setup, bundled as a preset)
```

Workflow: build each niche shop ONCE → snapshot it as a seedable preset → every future
client of that niche starts 90% done. You only swap logo, products, domain, `.env`.

---

## 8. Per-niche demo content (realistic — option 1b)

Two purposes: **(a)** powers the agency DEMO SITES (see §10), **(b)** seeds a new client's
shop so it looks finished on day one. Realistic (not Lorem) because it sells better.

Each preset ships a demo pack:

```
fashion-preset demo:
  - 6–8 demo products: shirt, panjabi, saree, kurti, shoe, bag — each with
    size + color variation, a size-chart image, a spec-table (Material/Fit/Origin)
  - home: hero banner, category grid, "Trending", "New Arrival", lookbook strip
  - filters: size, color, brand, price
  - theme: modern fashion palette + heading/body font
  - banner/slider demo copy (neutral, brand-swappable)

food-preset demo:
  - 6–8 dry-fruit/snack products with nutrition + benefits + use-cases filled
  - home: hero, flash-sale, nutrition-highlight, top-selling/new-arrival strips
  - filters: weight, organic, price
  - theme: fresh green palette

electronics-preset demo:
  - phones/gadgets with spec-table (RAM/Storage/Battery), warranty, brand filter
cosmetics-preset demo:
  - skincare/makeup with ingredients, shade variation, expiry
lifestyle-preset demo:
  - bags/watches/shoes with variation + spec
```

> NOTE: demo product images + copy are CONTENT work (owner + Claude produce them per
> niche). Keep copy brand-neutral so it reads fine before the client swaps their branding.
> Demo media can live in a dedicated S3 folder reused across all demo sites.

---

## 9. Agency operations — central panel? (NOTE, per owner)

> **Decision (owner): no central agency admin panel now.** In clone-per-client mode each
> client is a separate deployment + separate DB, so one panel literally can't reach them
> all (connecting every client DB to one panel = a security nightmare). Track clients with
> a **spreadsheet** (Client | Niche | Preset | Theme | Domain | Deploy date | Features on |
> Plan | Payment) + the `bootstrap --preset` script. This is what small WordPress/Shopify
> agencies do up to ~15–20 clients (they use ops tools like ManageWP, not a custom panel).
>
> A central **Platform Admin** (all shops, plans, feature-flags, billing in one place)
> becomes a CORE requirement only in the **SaaS phase** (≈100+ clients, one DB scoped by
> `shop_id`). Build it then, as part of SaaS — it will read the per-client config from §6.

---

## 10. Agency demo sites (NOTE, per owner)

> Keep a LIVE demo per niche to show prospects ("this is what your fashion shop looks
> like"): e.g. `fashion-demo.<agency>.com`, `food-demo.<agency>.com`, etc. Each is just a
> clone bootstrapped with its niche preset (§7) + demo content (§8), left running. This is
> the agency's sales asset — a prospect sees a finished niche shop, not a generic template.

---

## 11. What exists vs gaps (honest inventory)

**✅ Already built (reuse, don't rebuild):**
- Variation engine (attribute → value → combination matrix table) + swatch hex
- `size_chart` (schema + admin image upload + PDP ChartModal popup) — fashion-ready
- `custom_fields` spec repeater (schema + admin form)
- Per-product theming (color/font/floating) + `themes` collection
- `home_section_array` drag-drop section reorder (the registry pattern to copy)
- `bootstrap` script (the demo-importer foundation)
- Phase-A order slots: `customization_note/charge/files[]`, `is_digital/download_*`,
  `is_pre_order`, `subscription_*`, `is_wholesale` (future niches)

**🔴 Gaps to build (in order):**
1. **`custom_fields` PDP render** — saved in admin but shown NOWHERE on storefront. Build a
   generic **spec-table block**. Smallest, highest-value win; boosts fashion/electronics/
   jewelry/lifestyle at once. (~1–2h)
2. **PDP section registry + `pdp_section_array`** — extend the home pattern to PDP so
   section list/order/visibility is config-driven per niche.
3. **Niche preset structure** — the Axis-1 bundle (sections + fields + filters per niche).
4. **`bootstrap --preset=<niche>`** + per-niche demo packs (§7–8).
5. **Customization-form block + checkout pass** (cake/custom) — Phase C, deferred.

---

## 12. Build order (phased, profit-first, anti-premature-abstraction)

Research rule: **don't abstract until you've built 2 niches concretely.** Build food and
fashion as concrete shops FIRST, then extract the shared registry/preset.

```
Step 0  (NOW)   → deliver the food client (engine ready)
Step 1   ✅ DONE → spec-table PDP block (gap #1) — DONE (FE daf31c3): custom_fields
                  now render as a 2-column description + spec table below the hero
                  (DescriptionCard.jsx + ProductThemedSections wiring)
Step 1b  ✅ DONE → FAQ templates niche-ready (BE ba7161a / Admin 9c1f10c): category
                  enum → free-text topic (any niche coins its own); + optional
                  category_ids[] scope so the page-content picker SUGGESTS templates
                  for a product's category lineage (parent tags cascade). Reusable
                  category-scoped content = a multi-niche building block.
Step 2          → build FASHION concretely: size-chart + spec render, fashion home layout,
                  fashion filters/theme. Don't generalize yet.
Step 3          → with food + fashion concrete, EXTRACT the shared pattern:
                  PDP section registry + pdp_section_array + niche-preset structure (§4, §6)
Step 4          → bootstrap --preset (food + fashion) + demo packs (§7–8) + demo sites (§10)
Step 5          → fashion-2 / fashion-3 designs (cheap — logic reused) + electronics +
                  cosmetics + lifestyle presets
Step 6 (later)  → cake/customize order-flow (Phase C) — premium-priced niche
Step 7 (100+)   → SaaS migration; preset/config layer becomes tenant config; add Platform
                  Admin (§9)
```

---

## 13. Anti-patterns — do NOT (research)

- ❌ **Per-niche / per-client repos** — N-way bug patching. Never fork.
- ❌ **Multi-tenant SaaS now** — 2–3× cost for a need you don't have under ~20 clients.
- ❌ **Composable/microservices "for SaaS-readiness"** — SaaS-ready = the preset layer, NOT
  decomposing the Express backend. Keep the monolithic API.
- ❌ **Premature abstraction** — build food + fashion concrete before generalizing (extract
  on the 3rd repetition, not the 1st).
- ❌ **Config hell** — group config by domain (pdp/home/filters/theme) and ship **preset
  bundles**, not dozens of independent toggles the client sets one by one.
- ❌ **Everything-for-everyone PDP** — a single PDP with `switch(niche)` conditionals rots.
  Use the registry+data pattern so each niche's sections are independent opt-in modules.
- ✅ **Genuinely unique client need** (bespoke B2B quote, configurator) → ship as a
  per-client module/block so it can't destabilize other shops.

---

## NEXT
→ Owner reviews this plan. Then (after food-client delivery) start at Step 1
(spec-table PDP block) — the smallest concrete win — before any abstraction.
