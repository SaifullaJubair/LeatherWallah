# Platform Architecture — Master Plan (ecommerce-core)

**Created:** 2026-06-24
**Status:** VISION / BLUEPRINT — agreed in a long owner+Claude design session. Not started.
**Supersedes / absorbs:** [MULTI_NICHE_PLAN.md](MULTI_NICHE_PLAN.md) (Axis 1/2 + build order — still valid, this doc extends it with density, OWNER layer, landing tier, hosting, repo strategy).
**Sub-docs (deep, security-critical, separately edge-audited):**
- [OWNER_FEATURE_FLAG.md](OWNER_FEATURE_FLAG.md) — the OWNER role + feature-flag layer + plan_tier (Sections C, D, T).
- [PERMISSION_OVERHAUL.md](PERMISSION_OVERHAUL.md) — permission registry single-source rewrite (Section M).

> **What this is.** The owner sells *customised-looking* shops to many clients (food, fashion,
> shoes, electronics, cosmetics, customize, single-product landing pages…) from **ONE engine**.
> Client never knows it's a shared engine. This doc is the agreed architecture to get there
> without fork-hell, premature abstraction, or config-hell. Every point below came from a real
> design discussion — nothing is padding. Where a point needs its own deep treatment it has a
> sub-doc; where it needs an edge-audit before coding, that's flagged inline.

> ### 📚 Doc map — read in THIS order (avoid confusion with older plans)
> **THIS doc is the authoritative V2/platform plan (2026-06-24).** Older `_ai` plans are earlier,
> narrower captures — useful for detail, but **where they conflict, THIS master wins.** They now
> carry a banner pointing here.
> ```
> 1. PLATFORM_ARCHITECTURE.md   ← YOU ARE HERE. The platform vision. Read first.
> 2. OWNER_FEATURE_FLAG.md      ← deep: OWNER role + feature-flag + plan_tier (edge-audited)
> 3. PERMISSION_OVERHAUL.md     ← deep: permission registry rewrite (edge-audited)
>
> Still-valid DETAIL references (not conflicting, just narrower):
>    MULTI_NICHE_PLAN.md          — Axis 1/2 origin, niche→block map, floating-debt
>    HOME_DESIGN_BRIEF / _V2.md   — concrete home design variants (proof skins are real)
>    SETTINGS_ARCH_DEBT.md        — settings 206-field split (client-config home)
>
> SUPERSEDED on big decisions (banner-flagged; read master for the current call):
>    PROJECT_STRATEGY_V1_V2.md    — older V1→V2 sequence
>    FRONTEND_V2_PLAN.md          — assumed FE separate; master says FE+Admin MERGE
>    ADMIN_PANEL_V2_PLAN.md       — assumed standalone Vite SPA; master says merge into Next
>    SAAS_FUTURE_PLAN.md          — master says landing tier = FIRST SaaS
>
> Unrelated (current bug-fix / audit work, NOT this plan): CLONE_NOW_FIXES, NEXT_PHASES,
>    *_DEEP_AUDIT_FINDINGS, BACKEND_AUDIT, MASTER_BACKEND_ROADMAP, CLIENT_SPRINT*, PRICE_FLOW.
> ```

---

## 0. The engine vs the client (read this first)

The single most important mental model — everything else hangs off it:

```
ecommerce-core  = THE ENGINE (this repo, after rename). All development lives here:
                  V2, multi-niche, skins, tokens, OWNER layer, permission rewrite.
                  NO client is "live" on the engine itself.

per-client      = a CLONE of the engine at a stable release, with its own deploy + DB +
                  branding + config. food client, fashion client, etc. are clones.
                  A clone is FROZEN at a release; it pulls engine updates in a controlled way.
```

- ❌ **Never** fork the engine per client (N-way bug patching — the cardinal sin).
- ✅ **One** engine repo; each client = a clone at a release tag.
- 🔑 The engine is **branding-free**; a clone gets the client's brand at deploy time.

> ⚠️ **Today's reality:** this repo is named `FruitSnacks` (a client name) and the food client is
> **LIVE** on it. So engine and client are currently fused. Section U covers the one-time,
> careful split (rename → engine; food deploy frozen on a tag).

---

## 1. The three orthogonal axes (the core trick)

A shop's identity = three INDEPENDENT switches. Mixing them up is the #1 mistake.

```
AXIS 1 — NICHE (logic)      → WHAT sections/fields/filters/features exist
   food | fashion | electronics | cosmetics | lifestyle | landing | generic
   = { pdp_section_array, active_fields, filters, home_section_array, enabled_features, demo }

AXIS 2 — DESIGN SKIN (look) → HOW it looks: full layout/hero/card/section arrangement
   fashion-1 (minimal), fashion-2 (editorial), fashion-3 (bold-dark) …
   = a LAYOUT pack: which section components, what hero, what card style, motion

AXIS 3 — DENSITY (scale)    → HOW MANY products → drives layout family
   500 products → marketplace (filter + grid)
   5–20         → boutique (curated gallery, big cards, story)
   1            → landing page (single page, no shop journey)  ← extreme end
```

**Golden rule (Shopify-enforced):** switching the DESIGN SKIN must NOT change business LOGIC.
A client picks "Fashion logic + fashion-2 look + boutique density" — three independent choices.

**Why the split pays off:** 3 fashion looks = 1 logic preset + 3 skins, NOT 3× the feature code.
A logic fix propagates to all looks of that niche.

> **Axis 3 was missing from MULTI_NICHE_PLAN** — the owner identified it. Density is not "fewer
> products" cosmetically; it changes the *route structure* (a landing page has no /shop at all).

### Design "skin" has TWO levels (important nuance)

```
Level 1 — Theme settings (✅ EXISTS: themes collection)
   colors, fonts*, button, floating  → same layout, different paint
   = "orange food" vs "green food"

Level 2 — Layout skin / design pack (🟡 PARTIAL: boutique home preset exists)
   whole different hero, card, section arrangement, animation
   = fashion-1 vs fashion-2 vs fashion-3
   = HOME_DESIGN_BRIEF V1 vs V2 is the proof this is real
```

What the owner means by "একই niche-এর কয়েকটা design" = **Level 2 (layout skin)**, which the
current `themes` collection (color/font only) does NOT do. The boutique home preset
(`SectionRenderer.jsx` + `home/boutique/*`) is the first Level-2 brick, but only on home — not PDP.

---

## 2. Customization model — preset, not config-hell

```
client  → picks a SKIN PRESET (a pre-tuned bundle of all tokens)   ← default path
OWNER/advanced → fine-tunes individual design tokens on top         ← override path
```

- ❌ **Config-hell:** don't give the client 30 raw toggles (font, aspect, radius, density,
  motion…). They'll pick an ugly combination and blame you.
- ✅ **Preset = a sane combination.** "Editorial Fashion" = {portrait card, serif font, soft
  corner, rich motion}. Client picks one, gets a coherent look.
- ✅ **Override is OWNER/advanced only**, not the default surface.

Agreed split of WHO controls WHAT:
- **colors / font** → client may self-serve (low risk, they want it).
- **layout skin (boutique↔marketplace)** → OWNER-locked (big decision; paid-upgrade lever;
  protects your design).
- **individual section toggles** → client may, but not the skin's core sections.

---

## 3. Design tokens — everything DB-driven (preset sets them; OWNER can override)

The whole presentation layer = a token set, applied as CSS variables (like `--brand-primary`
already is). One DB change → whole shop changes. This is the "design tokens" pattern (Shopify
Theme Settings / Tailwind theme / Figma tokens).

| Token | Status | Notes / trap |
|-------|--------|--------------|
| colors | ✅ exists | themes collection |
| home_section_array | ✅ exists | toggle + drag reorder (the registry pattern to copy) |
| button_style | 🟡 partial | wired partially |
| **fonts** (heading/body/bangla) | 🔴 add | **Next/font is build-time → NOT arbitrary fonts; a curated whitelist dropdown.** HOME_DESIGN_BRIEF already lists pairs (Fraunces/Tenor Sans). |
| **card_aspect** (1:1 / 3:4 / 4:5 / 9:16) | 🔴 add | electronics=1:1+contain, fashion=3:4+cover |
| **image_fit** (cover/contain) | 🔴 add | jewelry/electronics need contain (no crop) |
| **grid_columns** (2–6) | 🔴 add | currently hardcoded `lg:grid-cols-4/5/6` scattered |
| **corner_radius** (sharp/soft/round) | 🔴 add | HOME_DESIGN_BRIEF: never 0px sharp, never rounded-full on cards |
| **density** (compact/comfortable/spacious) | 🔴 add | gap/padding rhythm |
| **motion_level** (none/subtle/rich) | 🔴 add | + respect `prefers-reduced-motion` |
| **pdp_section_array** | 🔴 add | THE main missing piece — PDP is hardcoded food today |

### ⚠️ Tailwind / Next traps (must remember — burned us mentally already)

```
TRAP 1 — Tailwind dynamic class does NOT work:
   `grid-cols-${n}`, `aspect-[${r}]` → Tailwind purges unseen classes at build → CSS missing.
   FIX: explicit class MAP or safelist. e.g.
      const GRID = { 3:"lg:grid-cols-3", 4:"lg:grid-cols-4", 5:"lg:grid-cols-5", 6:"lg:grid-cols-6" }
      const ASPECT = { "1:1":"aspect-square", "3:4":"aspect-[3/4]", "4:5":"aspect-[4/5]", "9:16":"aspect-[9/16]" }
   The full literal strings MUST appear in source for Tailwind to keep them.

TRAP 2 — Next/font is build-time:
   Can't load an arbitrary Google font at runtime. Curate ~10–15 fonts, expose as a dropdown.
```

---

## 4. Performance — dynamic import is MANDATORY at scale (owner-flagged)

Today `SectionRenderer.jsx` STATIC-imports ~14 section components — fine now. But:

```
Future: food 5 skins + fashion 3 + shoes 4 + electronics 3 = ~15 skins × ~8–10 components
   = 120–150 components ALL in the bundle
   = a boutique client's browser downloads marketplace + fashion + electronics code it never runs
   = huge dead code = slow first load
```

**Fix — `next/dynamic` (lazy load):**
```js
const HeroSpotlight = dynamic(() => import("./heroSpotlight/HeroSpotlight"));
```
Next splits each skin/section into its own chunk; a client downloads ONLY its enabled skin's
chunk. This is how Shopify keeps 100+ themes fast — each shop loads only its theme.

- **Not "do it now"** — it's "do it when building the skin-registry (Step 3)". The registry
  ("DB says which skin → load that chunk") naturally demands dynamic import. Bundle it into
  that work; don't do it twice.
- 🔑 **Hard rule:** > 3 skins ⇒ static imports are forbidden; registry must use `next/dynamic`.

---

## 5. PDP section registry — extend the home pattern (the main build)

Today `ProductThemedSections.jsx` renders a FIXED food order (Video → Benefits/UseCases →
SizeGuide → Nutrition → … FAQ → Offer). Sections self-hide on empty data (good), but the
list/order/labels are hardcoded food.

**Target — copy the home `home_section_array` pattern to PDP:**
1. **Section registry** — `name → component` map (nutrition, spec-table, size-guide, benefits,
   gallery, customization-form, faq, reviews, video, related…). Several already exist.
2. **`pdp_section_array`** per niche preset — which sections, what order.
3. **Data-gate** — each section auto-hides if the product lacks its data (keep current behavior).

So a fashion PDP shows size-chart + spec; a food PDP shows nutrition — same code, the niche
preset's array + the product's data decide.

> ⚠️ **Floating-images debt to absorb here:** the section-anchored floating system anchors to a
> **hardcoded food section enum** (theme.model + product.model + 2 admin dropdowns +
> FloatingAssets.jsx). When `pdp_section_array` becomes source of truth, that enum must be
> **derived from the active niche's section registry**. Grep `MULTI-NICHE-DEBT` for the 5 sites.
> (Detail in MULTI_NICHE_PLAN §4.)

---

## 6. Niche → block mapping (which blocks each niche turns on)

| Block / field | food | fashion | electronics | cosmetics | lifestyle | landing |
|---------------|:----:|:-------:|:-----------:|:---------:|:---------:|:-------:|
| nutrition | ✅ | ❌ | ❌ | ❌ | ❌ | 🟡 |
| ingredients | ✅ | ❌ | ❌ | ✅ | ❌ | 🟡 |
| benefits / use-cases | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ |
| size-guide (table) ✅DONE | ❌ | ✅ | ❌ | ❌ | 🟡 | 🟡 |
| size-chart (image) ✅exists | ❌ | ✅ | ❌ | ❌ | 🟡 | 🟡 |
| spec-table (custom_fields) ✅DONE | 🟡 | ✅ | ✅ | 🟡 | ✅ | 🟡 |
| warranty | ❌ | ❌ | ✅ | ❌ | 🟡 | 🟡 |
| variation swatch (size/color) | ❌ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| weight-based price | 🟡 | ❌ | ❌ | ❌ | ❌ | ❌ |
| expiry date | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| customization-form | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 (cake/custom) |

Filters mirror this: fashion = size/color/brand/price; food = weight/organic/price; electronics
= brand/spec/price.

**Engine readiness (variation+cart+checkout+courier+COD shared by ALL):** food ~95%, fashion
~95% (size-guide ✅ just shipped, spec ✅), electronics/cosmetics/lifestyle ~90%, cake/customize
~60%, grocery-kg ~50%, course ~30%, booking ~10%. **Sell first:** food, fashion, electronics,
cosmetics, lifestyle, landing. **Defer:** cake, grocery-kg, course, booking.

---

## 7. Preset / token route scope (where presets apply)

```
DESIGN TOKENS (colors/fonts/aspect/corner)  → EVERY route (checkout in brand color too)
LAYOUT / SECTION PRESET (which blocks)      → presentation routes ONLY:
      home ✅ + PDP 🔴 + shop/listing 🔴
```

- **shop/listing is skin-bound too** (owner caught this): few-product → curated gallery OR
  **hidden route** (Apple-style: home IS the showcase, no /shop); many-product → filter+grid.
  Filter auto-hides below a product threshold (and few-product filter facets are near-empty
  anyway — functionally useless).
- **checkout / auth / policy / profile** = token-only, NEVER a layout preset.
- **Profit priority:** home + PDP first (90% of "your UI is too generic" impact).

Route inventory (FE): presentation-heavy = `/`, `/products/[slug]`, `/shop`, `/category`,
`/all-products`, strips; functional = `/checkout`, `/cart`, `/wishlist`, `/orders`,
`/user-profile`, auth; static = policy pages.

---

## 8. Custom-design clients — skin-ify, don't fork

A client brings a Figma / reference that's not in your skin library.

```
❌ separate clone to "handle it custom"  → fork hell again
✅ make it a NEW SKIN PRESET, assign to that client, keep it in the library (reusable)
```

Two types:
```
TYPE 1 — existing sections + a new token combination
   → just a new skin preset (easy, the common case)
TYPE 2 — genuinely new section/interaction (3D viewer, unique animation)
   → build a new section component → add to registry → use in the skin
   → still library code, NOT a fork; just more work
```

🔑 Every custom job **grows your library** (next client of that vibe = instant assign), instead
of forking. Needs the skin-registry (Step 3) to plug cleanly.

---

## 9. Preset library governance (ownership + filtering)

When you have 25 presets (8 generic, 17 client-specific), you must not show client A's
exclusive design to a new client.

```
preset metadata:
   origin:      "generic" | "client_specific"
   built_for:   null | client id/name
   exclusive:   true | false      ← can another client get it?
   reusable:    true | false      ← can it later move into the generic pool?
   tags[], created_date
```

- New client preset-picker shows only `origin=generic` (+ `reusable`).
- Filter "which presets are client-specific / built for client X".
- **Exclusivity is monetisable** (exclusive design = higher price; later flip `reusable=true`).
- 🔑 **Tracking lives agency-side** (repo skin-manifest + the client spreadsheet, §13), NOT in any
  client's DB — a clone only knows its OWN assigned skin, not the whole library.

---

## 10. OWNER preset-selection UX (don't assign blind)

The OWNER must SEE before assigning (owner-flagged: "নাম দেখে assign করব না"):
```
Level 1 — preset CARD: thumbnail + tags + a ✓/✗ feature checklist + "8 sections · 3:4 card · serif"
Level 2 — DETAILS modal: full section/token/feature breakdown (auto-generated from preset config — FREE)
Level 3 — LIVE PREVIEW (optional, later): render the skin on demo data without touching the live shop
```

- Start with **static thumbnail + auto feature-list** (Shopify-style, cheap). Live preview later.
- The feature/section/token list is **free** — the preset already declares what it contains.
- Image options: (A) static thumbnail (recommended start), (B) live preview on demo data,
  (C) live preview on the client's real product (draft mode, heaviest).

---

## 11. Landing-page tier (single-product, ad-funnel) — a distinct TIER

A separate market the plan almost missed (owner caught it): ৳5–7k single-product landing pages
for ad-buyers / beginners / dropshippers (huge in BD: FB ad → landing → COD).

```
Structure: one scroll page (hero → benefits → reviews → urgency → inline order). NO shop journey,
           NO /shop, /category, /filter, /cart-as-a-page.
```

- It's Axis-3's extreme end, but **structurally different** (one page = the product), so treat it
  as its own preset family / shop type.
- **How to serve it:** same engine + a "landing preset" with ~90% of modules feature-flagged OFF
  (no shop/category/filter/wishlist/campaign). Fork-free, and **upsell-ready** (turn features back
  on → full shop → bigger price, same deploy).
- **Hosting:** a full clone per ৳5–7k landing is economically wrong → landing = **multi-tenant
  SaaS** (decision locked, §12). Landing is also **static-able** (no live cart/stock), so it can
  even run on cheap static hosting — another reason it's a distinct tier.
- 🔑 **Landing is likely your FIRST SaaS candidate** (volume grows fast: ~10–20/month vs 2–5
  full shops), cost-driven.

---

## 12. Hosting economics & deploy targets (decisions locked)

VPS today: 4-core / 8GB / 75GB NVMe / 250GB S3 @ ~$10–12. Runs FruitSnacks + Artisan (+1 slot).
A Next.js instance idles at ~400–600MB → realistically ~8–10 Next instances on 8GB.

```
DECISION — full shop  → CLONE-per-client (VPS, own DB). ৳30–50k client, profitable.
DECISION — landing    → MULTI-TENANT SaaS (one Next app + one Mongo, domain → shop_id).
                        ~$0.10/client at scale. (Locked by owner.)
shared  — BE          → one Express BE can serve both (must be shop_id-aware for tenant mode).
```

Three deploy targets fall out:
```
Target 1 FULL SHOP    : merged Next app (FE+Admin) + BE + own Mongo per clone  → VPS
Target 2 LANDING      : one merged Next app serving all landings (shop_id) + BE + shared Mongo
Target 3 BE (shared)  : the same Express BE, shop_id-aware
```

So the **same merged codebase runs in two modes** (clone mode = full shop; tenant mode =
landing). One engine, different deploy config — the final form of "এক engine সব".

> Landing multi-tenant = a **rehearsal** for full-shop SaaS later (same `shop_id` pattern, but
> landing is simple so it's safe to do tenancy here first). Tenant concerns to design: domain→shop
> mapping (wildcard + DB), strict `shop_id` scoping on every query, data isolation between shops.

---

## 13. App consolidation (V2: FE + Admin merge — decision locked)

```
DECISION — BE stays SEPARATE (Express; multiple FEs share one BE).
DECISION — FE + Admin MERGE into one Next app in V2:
   /(storefront)  → customer
   /admin/*       → admin panel
```

Why now: V2 is a redesign anyway → the right moment to merge. Wins: 1 fewer deploy, shared
code/types/tokens/components, same-domain auth cookie.

⚠️ Cost/risk: Admin is a Vite SPA (React Router 6 + TanStack + plain fetch) → porting to Next
App Router is a **big** task. Strict bundle-split required so Admin's heavy deps (Recharts,
Quill) don't bloat the storefront bundle (Next route-group code-split if structured right). Time
this with the multi-niche skin work — it's a large V2 scope.

---

## 14. Build order (profit-first, anti-premature-abstraction)

Research rule: **don't abstract until 2 niches are concrete.** Build food + fashion as concrete
shops first, THEN extract the registry.

```
✅ Step 1   — spec-table PDP (custom_fields render) — DONE
✅ (today)  — dynamic size-guide (niche-agnostic grid + paste) — DONE
🔧 Step 1.5 — PERMISSION OVERHAUL (foundation) — see PERMISSION_OVERHAUL.md
              (do before the OWNER layer; everything sits on it)
🎯 Step 2   — FASHION concrete: fashion preset + ONE fashion skin + 2–3 demo products.
              Don't generalize yet. Sells to "your UI is too generic" clients now.
📐 Step 3   — EXTRACT (food+fashion concrete in hand):
              pdp_section_array + skin registry (+ next/dynamic §4) + design tokens §3
              + OWNER feature-flag layer (OWNER_FEATURE_FLAG.md)
📦 Step 4   — bootstrap --preset=<niche> + per-niche demo packs + agency demo sites
🔁 Step 5   — extra skins per niche (fashion-2/3, food-5…) — cheap, logic reused
🛬 Step 6   — landing tier as multi-tenant SaaS (§11–12)
🏢 Later    — full-shop SaaS migration (100+ clients); preset/config layer becomes tenant config
```

🔑 Rule: fashion must be concrete BEFORE the registry abstraction (we saw it this session —
size-guide would've been a wrong fixed-column design without concrete research first).

---

## 15. Clone strategy verdict (the 3 paths)

```
❌ #1 per-niche/per-client repos   → fork hell. N-way bug patching. NEVER.
✅ #2 clone + DB-config + bootstrap → NOW. One engine, difference is DB config not code.
🟡 #3 central cross-client panel    → NO now (security: one panel holding every client's DB
                                       creds). It's multi-tenant SaaS — only at 100+ clients.
                                       The §6 config layer BECOMES tenant config then (cheap migration).
```

Client tracking now = a **spreadsheet** (Client | Niche | Skin | Domain | Deploy | Features | Plan
| Payment) + `bootstrap --preset`. No panel until SaaS.

> **Cross-project link to AgencyPlatform (sibling repo `c:\Coding\Perosnal\AgencyPlatform`).**
> The agency's marketing site (a separate Next.js + Payload app) has a ⭐ "Demos" section that
> showcases stores built by THIS engine. The link is **loose by design — no code/DB/API coupling**:
> AgencyPlatform's `Demos` collection just stores `{ liveUrl, screenshots[], previewVideo,
> embedAllowed }` per demo. So the only thing the engine side must provide is:
> 1. a running demo shop at a stable URL (from `bootstrap --preset=<niche>` demo sites, Step 4), and
> 2. **if AgencyPlatform wants a live iframe preview**, the engine's demo deploys must send a
>    `Content-Security-Policy: frame-ancestors <agency-domain>` header so the agency site can embed
>    them (AgencyPlatform falls back to screenshot/video if embedding is blocked — its plan handles that).
> Keep it loose: NO shared DB, NO shared API, NO imports between the two repos. Coupling = risk; a
> URL + a CSP header is the entire integration. (AgencyPlatform's own `docs/plan/PLAN.md` owns the
> Demos-section detail; this note just records the engine-side obligation.)

> Note: the OWNER feature-flag layer (sub-doc) is NOT path #3 — it's a per-clone privileged role,
> not a cross-client panel. Each OWNER login reaches only its own client's DB → secure.

---

## 16. Repo & release strategy (engine vs clients; food is LIVE)

```
ecommerce-core (this repo, renamed)  = canonical ENGINE. All dev/V2/multi-niche here.
   main/stable branch → live-safe; bug-fix only
   v2 branch          → big rework (FE+Admin merge, multi-niche); breaking changes OK
each client            = clone of engine @ a stable release tag (own deploy+DB+brand, frozen)
```

**One-time engine split (careful — food is LIVE on this repo + Coolify):**
```
1. GitHub rename FruitSnacks → ecommerce-core (GitHub keeps a redirect; Coolify usually survives —
   verify with a small redeploy after).
2. Tag the live food deploy commit (e.g. `food-v1-live`) — rollback safety + "food is on this release".
3. Confirm live food shop unaffected (test redeploy).
4. This repo is now the engine. main = food-stable-live (hotfix only); v2 = engine development.
5. food client is split into its own clone LATER, when the engine has moved far ahead.
```

**Staging → production workflow (owner's instinct = standard):**
```
- v2 branch deploys to a STAGING subdomain (dev.ecommerce-core / new.<x>) + a TEST DB (fake data).
- Live-like test there (Playwright + hand + real mobile/browser).
- "Replace real domain with the tested engine" = git merge v2→main + Coolify production redeploy
  (NOT a file copy / not a new repo). Rollback = git tag.
- A live production bug = hotfix on main → deploy (staging untouched), then merge the fix into v2.
- Staging = a separate lightweight deploy (keep production VPS isolated; Vercel-free / tiny VPS).
```

🔑 "clone + rename" the owner imagined = **branch + staging deploy + config**, NOT a new repo.
A new repo copy would reintroduce fork-hell. Engine separation is a ONE-TIME rename, not per-client.

---

## 17. Pointers to the deep sub-docs

These are deeper, security-critical, and separately edge-audited:

- **[OWNER_FEATURE_FLAG.md](OWNER_FEATURE_FLAG.md)** — Sections C, D, T:
  - C: OWNER role (per-clone privileged, client-invisible), unique creds, client can't see/create it.
  - D: a feature toggle is a **full chain** — section + menu + route(404) + API(403) + sitemap +
    data-hide + admin (menu / PageSEO entry / dashboard widget). Link-hide alone leaves the route
    exposed (SEO-index / bookmark / guess).
  - T: `plan_tier` (basic/standard/premium) = a feature-flag bundle; toggle-off/downgrade = data
    HIDE (not delete) so it returns.
- **[PERMISSION_OVERHAUL.md](PERMISSION_OVERHAUL.md)** — Section M:
  - Current drift: 21 (role.model schema) vs 98 (admin permissionData) vs 83 (route strings) — no
    single source of truth, hand-synced across 4 places.
  - Keep: per-route guard + fresh-DB check (good). Add: a code-defined **permission registry**
    (single source → role.model + UI + guards auto-derived). Industry standard (Laravel/Django/
    AWS IAM), NOT ERP-style "create modules in the DB" (over-engineering for custom-coded pages).
  - 5 unguarded routes to audit; super-admin bypass; feature-flag ≠ permission (two layers, flag
    checked first); migration must not break existing roles.

---

## 17b. Language (i18n) + Admin Notification — V2 features

Two V2 additions agreed this session. Both follow the existing **DB-driven client-config** pattern
(like `currency_code/symbol/name`, which is ALREADY admin-configurable in settings — `currency.js`
helper reads it, BDT fallback). So `client_config` grows: `{ niche, skin, plan_tier, currency,
default_language, enabled_languages }`.

### Language — full i18n (UI + content), for INTERNATIONAL clients (owner decision)

Owner wants international reach (currency is already multi-config, so language follows). Three tiers:
```
Tier 1 — UI text (button/label/menu)
   → next-intl + bn.json / en.json / ar.json …  (ENGINE-level, all clients)
   → setting: default_language + enabled_languages (mirrors currencyOf pattern)
Tier 2 — Product/content data (what admin writes)
   → multi-language fields (e.g. { bn:"…", en:"…" } or a translations sub-doc)
   → admin writes per language; customer sees their language
   → OPTIONAL / premium: single-lang BD client writes only bn (en empty → bn fallback, back-compat)
Tier 3 — which languages the shop supports
   → enabled_languages:["bn"] or ["bn","en"]; customer language switcher when >1
```
- 🔑 **Extract during V2 (not retrofit).** Today every string is hardcoded Bangla; FE is being
  rewritten in V2 → write `t("key")` from the start. Retrofitting later = thousands of manual extracts.
- ⚠️ RTL (Arabic) needs layout mirroring — defer until an Arabic client exists.
- tier mapping: basic BD client = default bn single-language (no i18n overhead); international/premium =
  multi-language toggle + multi-lang content.

### Notification — admin in-app NOW, customer DEFERRED (owner decision)

```
NOW (V2): Admin in-app notification
   events: new order · low stock · new review · new question · (courier status)
   BE: a new notification module (event → notification doc, shop_id-scoped)
   Admin: bell icon + dropdown + unread count + mark-read
   → CORE feature (almost every client wants it) — not OWNER-flagged, like cart/checkout
DEFERRED: customer notification (web push / SMS) — marketing, premium tier later
```
- 🔑 **Design channel-extensible NOW** so customer channels drop in later without rework:
  `notification { type, channel:"in_app", target_role, payload, read, shop_id }`. The `channel` field
  is the future seam (push/sms/email).
- ⚠️ **poll first** (admin bell refetch ~30s) — simple; websocket/SSE real-time only if needed later.
- ⚠️ notification spam (100 orders = 100 notifications) → consider group/digest.
- ⚠️ `shop_id`-scoped from day one (clone-per-client trivial now, but landing multi-tenant needs it).
- Existing SMS/email (BulkSMS, abandoned-cart) can later be unified under this module's channels.

---

## 17c. Structural seams to add NOW (cheap field, painful to retrofit)

From the `architecture-reviewer` foresight audit (2026-06-24, read all 37 models). The owner asked:
"what, if added later, forces painful STRUCTURAL change (esp. DB schema churn)? Seam it now."

**Principle:** these are SEAMS (nullable/additive fields, or a 2-line enum change), NOT full
implementations. The field costs nothing today; the migration from "no field" → "field + index"
later is non-linear (every existing document needs backfilling, every query retouched). Add the
seam before/during the first V2 sprint.

| # | Seam | Why now (risk if deferred) | Cost | Verdict |
|---|------|----------------------------|------|---------|
| 1 | **`shop_id`** (nullable ObjectId) on **all 37 collections**; compound index `{shop_id,…}` on the **5 core** only (orders, products, users, carts, settings) | ⭐ THE big one. Landing multi-tenant SaaS (§12) needs one DB many shops. Without shop_id from the start, going multi-tenant = migrate every doc in 37 collections + retouch every query. Clone mode: field null, a shim injects the implicit shop. | 37 additive fields, index on 5 | **SEAM-NOW** |
| 2 | **`enabled_features`** (Mixed, default `{}`) + **`plan_tier`** (enum basic/standard/premium, default basic) on settings | Foundation for OWNER feature-flag layer. ⚠️ ALSO: settings PATCH handler must guard these as OWNER-write-only (client super-admin can PATCH settings today → would bypass the paywall). | 2 fields | **SEAM-NOW** |
| 3 | **`pdp_section_array`** on settings (SAME shape as `home_section_array`: `[{_id:false,id:String,enabled:Boolean,order:Number}]`, default undefined; niche default injected at read-time) | PDP registry foundation. Audit confirms home_section_array pattern is cleanly copyable — no structural mismatch. | 1 field | **SEAM-NOW** |
| 4 | **Floating `section` enum → plain `String`** in theme.model (floatingAssetSchema) AND product.model (floating_overrides.extras) | Food-hardcoded enum `[hero,order,benefits,use_cases,nutrition,reviews,faq,any]` will REJECT fashion sections (size_guide, lookbook…) via Mongoose validation = hard blocker. MULTI-NICHE-DEBT comment already there. Validation moves to app layer (registry). | 2-line change, 2 files | **SEAM-NOW** |
| 5 | **Notification module** — build with FULL shape at creation: `{shop_id, type, channel(in_app/push/sms/email default in_app), target_role(admin/owner/customer), target_id, payload, read, read_at}` + index `{shop_id,target_id,read,createdAt:-1}` | It's a NEW module — build it right ONCE. A quick in_app-only stub needs a doc migration + query split when customer push/SMS is added. `channel` default in_app = only in_app used at first. | New module, built right | **DO-FULL-NOW** |
| 6 | **`variation_name_snapshot`** (String, nullable) on orderProduct | Today only `product_name_snapshot` + `variation_sku_snapshot` (code, not display name). Variation rename/delete → order history shows only an ObjectId. Wire at checkout (already reads the variation). | 1 field + 1 write-line | **SEAM-NOW** |
| 7 | **`is_owner`** (Boolean, default false) on admin model | OWNER hiding (§C5): without a first-class marker, the OWNER account is VISIBLE in the client's admin user list (paywall leak) or relies on a fragile role-name check. bootstrap sets it; admin-list controller filters `is_owner:true`. | 1 field | **SEAM-NOW** |
| 8 | **`category_slug_history`** (`[String]`) on category | product has `product_slug_history` (301-redirect on rename); category has none → category rename = SEO 404 on indexed URLs. Mirror the product pattern. | 1 field | **SEAM-NOW** |
| 9 | **`status_changed_at`** (Date) on the analytics-relevant models (product, category, user, review) | soft-delete `status:active/in-active` has no timestamp → can't answer "when deactivated?" / no TTL for GDPR-style cleanup. Owner asked to include it. | 1 field on ~4 models | **SEAM-NOW** (owner-requested) |
| 10 | **`translations`** (Mixed, default undefined) on product (+ category) — ONE open field, NOT per-field structs | i18n content seam. ⚠️ Per-field translation structs across product_name/description/short_description/badge_text/video_title/og_*/benefits/use_cases/faqs/size_guide = heavy + risks locking the wrong pattern. A SINGLE `translations: Mixed` is the cheap seam: 1 field, 0 migration, shape stays open (decide bn/en sub-doc vs separate collection later). Primary `product_name:String` stays the default-language value (back-compat); `translations` holds other-language overrides. Owner: "if not too much, keep it" — this is the not-too-much version. | 1 Mixed field on 2 models | **SEAM-NOW (light)** — full i18n still a V2 task (§17b), this just reserves the shape |

> **Permission schema (#7 from audit) is NOT a seam — it's a LIVE BUG.** See
> [PERMISSION_OVERHAUL.md](PERMISSION_OVERHAUL.md): role.model has 21 Boolean fields but the Admin UI
> PATCHes 98; Mongoose `strict:true` (default) **silently drops** the ~77 undefined fields on every
> role-edit save → permissions reset to false. **Verify on the LIVE food super-admin** before any
> role is edited. Fixed properly by the Step 1.5 registry.

**Deferred (premature now — audit agreed):** money integer-cents (BDT has no sub-unit; large churn
for no benefit) · settings monolith split (only when multi-tenant needs per-row shop scoping) ·
full per-field i18n content (do during V2 FE string-extraction — seam #10 reserves the shape).

**Do at the V2 merge moment (not now):** design-token fields on settings/themes (fonts, card_aspect,
grid_columns, corner_radius, motion_level) — additive, but depend on the skin registry being
designed first (§3). **Also the §17d Hardening + DX cluster below** (CSRF/CSP/API-envelope/Swagger).

---

## 17d. V2 Hardening + Developer-Experience cluster (do at the FE+Admin merge, NOT now)

These are NOT cheap seams — they're real work that's correctly DEFERRED to the V2 / FE+Admin merge,
because each either (a) touches all 3 apps and would break the live shop if done piecemeal now, or
(b) lands almost free if done while V2 code is being written fresh. Grouped here so V2 planning sees
the whole hardening+DX scope in one place (pairs with the permission Path C overhaul, same timing).

| # | Item | What / why | Source | Timing rationale |
|---|------|-----------|--------|------------------|
| D1 | **CSRF protection** (🟠 P1, DEFERRED) | `sameSite:none` cookies (needed for the 3-subdomain share) leave every state-changing POST/PATCH/DELETE open to CSRF from a phishing page. Fix = double-submit cookie (BE issues JS-readable `csrf_token` on login/refresh; `verifyCsrf` middleware; Admin axios + FE RTK-Query attach `X-CSRF-Token` on mutations; webhooks/IPN exempt). Full plan + test surface already written. | [audit F004](audit/findings/F004-csrf-protection-deferred.md) | Touches BE+Admin+FE + every mutation needs re-test. FE+Admin merge rewrites the request layer anyway → attach the header once there. |
| D2 | **Content-Security-Policy** (🟡 P2, DEFERRED) | helmet ships today with CSP OFF. CSP needs every external source mapped (S3/Meta/TikTok/GTM/GA4/Clarity/SSLCommerz/fonts); wrong CSP = white page in prod. Directive draft already written. | [audit F003b](audit/findings/F003b-csp-deferred.md) | Every page must be re-tested for `blocked by CSP`. V2 pages are new → map sources once, during V2 page build. |
| D3 | **Finish the module-by-module security pass** | The Stage-1.5a 9-category audit did recon + quick-wins (F001/2/3/6 shipped, F007/8/9/11/12 fixed s39) but the per-module checklist (`adminRegLog`, `cart`, `order`, `payment`, …) is still mostly unchecked. F005 per-module `console.*`→pino migration rides along. | [BACKEND_SECURITY_AUDIT.md](audit/BACKEND_SECURITY_AUDIT.md) | Do as each module is touched/rewritten in V2 (avoids a separate full re-read pass). |
| D4 | **Cron out-of-process** (🟢 P3, DEFERRED) | nightly cron runs in the web process (`index.ts`) — cron throw can crash web, web crash kills cron. Fine for clone-per-client; flagged for the SaaS/landing-tenancy direction. | audit F010 | Only matters at multi-tenant scale (§12); revisit with landing tenancy. |
| D5 | **Standardized rich API response envelope** | Today's `sendResponse` is thin: `{statusCode,success,message,data,totalData}` and the error shape differs (`{success,message,errorMessages}` — no statusCode). Copy a response and you can't tell which endpoint/when/which page. Proposed unified envelope (success AND error same shape): `{success, statusCode, message, data, meta:{page,limit,total,totalPages,hasNext}, error:{code,message,details}, path, method, requestId, timestamp}`. Adds machine-readable `error.code` (client stops string-matching messages), `requestId` (trace a call across logs — SaaS-critical), and one `meta` for all pagination. | owner ask (this session) + observed in `sendResponse.ts` / `global.error.handler.ts` | **Breaking change for the whole FE+Admin** (every `.data`/`.totalData` read). Only safe when FE+Admin are rewritten at merge — adopt the new shape once, everywhere. |
| D6 | **OpenAPI / Swagger API docs** | No API doc exists today → every endpoint is discovered by reading code. For a resold / multi-tenant SaaS this reads as low-grade. Serve Swagger UI at `/api/docs`. Approach: **schema-first for new V2 modules** (Zod/JSON-schema → auto-generate OpenAPI), NOT a hand-written retrofit of the ~40 existing routes (heavy, low value since V2 rewrites them). The D5 envelope becomes the documented response shape. | owner ask (this session) | Lands ~free if new V2 modules are written schema-first; pairs with D5. |

**Sequencing inside V2:** D5 (envelope) is the foundation — D6 (Swagger) documents it, and D1 (CSRF
header) rides the same FE request-layer rewrite. D2/D3 are page-by-page / module-by-module as V2
surfaces are rebuilt. None of this blocks the permission Path C work; they share the merge window.

---

## 18. Anti-patterns — do NOT (research + this session)

- ❌ Per-niche/per-client repos (fork hell).
- ❌ Multi-tenant full-shop SaaS now (2–3× cost; only at 100+). Landing tenancy is the exception.
- ❌ Premature abstraction (build food+fashion concrete before the registry).
- ❌ Config-hell (ship skin presets, not 30 raw toggles).
- ❌ Everything-for-everyone PDP with `switch(niche)` — use registry+data, independent opt-in modules.
- ❌ Tailwind dynamic class names; arbitrary runtime fonts (§3 traps).
- ❌ Static-importing all skins at scale (§4 — use next/dynamic).
- ❌ Link-hide a feature without gating its route + API (§17 / OWNER_FEATURE_FLAG.md).
- ❌ ERP-style DB-created modules for custom-coded pages (§17 / PERMISSION_OVERHAUL.md).
- ✅ Genuinely unique client need → ship as a per-client module/skin, never destabilising others.

---

## 19. Status snapshot (what exists vs gaps)

**✅ Built (reuse):** variation engine + swatch · size_chart image + ChartModal · size-guide grid
(today) · custom_fields spec render · per-product theming (color/font/floating) · themes collection
· home_section_array drag-reorder + SectionRenderer registry · boutique home preset (Level-2 brick)
· bootstrap script · per-route RBAC guard + fresh check · Phase-A order slots (customization/digital/
preorder/subscription/wholesale).

**🔴 Gaps (in build order):** permission registry (Step 1.5) · fashion concrete + 1 skin (Step 2) ·
pdp_section_array + skin registry + dynamic-import + design tokens (Step 3) · OWNER feature-flag
layer (Step 3) · bootstrap --preset + demo packs (Step 4) · extra skins (Step 5) · landing
multi-tenant (Step 6) · grid_columns/aspect/font/corner/motion tokens (Step 3) · floating section
enum derived from registry (Step 3 debt) · **i18n (UI extract during V2; content multi-lang
optional/premium) · admin in-app notification module (V2, channel-extensible)** — §17b ·
**V2 Hardening + DX cluster (CSRF · CSP · finish per-module security pass · cron out-of-process ·
standardized API envelope · OpenAPI/Swagger) — §17d.**

**✅ Already a foundation for V2 features:** currency is DB-driven + admin-configurable
(`currency.js`, settings `currency_code/symbol/name`) → language follows the same pattern.

---

## 20. Operational / SaaS-readiness (the non-feature gaps — what makes it "serious" not "hobby")

The plan §0–§19 is strong on FEATURES + architecture but thin on OPERATIONS. These four are not
code-features — they're the operational backbone that separates a hobby project from a platform you
can sell to many paying clients. The owner flagged the north star: "multi-tenant এ গেলে যেন low-grade
না লাগে." That feel lives mostly here. Each below: what, why it can't be skipped, and WHEN.

### 20a. Clone update / engine-propagation strategy 🔴 (the biggest miss — load-bearing for the whole "no fork-hell" claim)
§0/§16 say "a clone is frozen at a release and pulls engine updates in a controlled way" — but the
**mechanism is undefined.** The entire anti-fork-hell promise rests on this. Concretely needed:
- **Code update:** clone = engine @ a release tag. Update = `git pull` the engine's newer tag into the
  clone + redeploy. Define: which branch a clone tracks, how a client-specific tweak (a custom skin)
  survives an engine pull (it shouldn't live in clone code — it's a DB-config/skin-preset in the
  library, §8/§9, so a pull is clean). **Rule to lock: a clone must hold ZERO client-specific CODE —
  only config/DB differences — or every update reintroduces fork-hell.**
- **Schema/data migration:** when the engine adds/changes a field, each clone's existing DB needs the
  migration. Today there's `bootstrap` (fresh DB) but **no incremental migration runner**. Need a
  versioned, idempotent, ordered migration system (`schema_version` doc + `migrations/NNNN-*.ts` run
  on deploy) — the same machinery the permission Path C live-migration (§ PLAN_PATH_C §6) will pioneer.
  → **Build the migration runner as part of Path C** (it needs it anyway); generalize it after.
- **When:** the runner — with Path C. The clone-update playbook — write before the SECOND client goes
  live (one client = no propagation problem yet; two = the problem is real).

### 20b. Backup / disaster recovery 🔴 (completely absent — non-negotiable for paying clients)
A paying client's shop data lost = business over. The plan never mentions it. Needs:
- **Automated Mongo backups** per clone (mongodump on a cron → off-VPS storage, e.g. the same S3/Contabo
  bucket family, separate prefix; daily + retention). For multi-tenant landing → per-`shop_id` export path.
- **Tested restore** (an untested backup is not a backup) + a documented restore runbook.
- **S3 asset durability** — already on Contabo S3 (durable), but confirm versioning/lifecycle on the bucket.
- **When:** automated backup = **before the SECOND paying client** (food is already live with real
  orders → arguably set up the food backup NOW, it's a cron + a script, low effort, high protection).

### 20c. Monitoring / observability / alerting 🟠
pino structured logging exists (§ audit F005) but there's no "a clone is DOWN and nobody knows":
- **Uptime/health** — a `/health` endpoint per BE + an external uptime monitor (UptimeRobot-class, free
  tier) pinging each clone's domain; alert (email/Telegram) on down.
- **Error alerting** — Sentry-class capture (or pino → a log drain) so a 500 spike surfaces without
  reading logs. Per-clone tag so you know WHICH shop.
- **When:** lightweight uptime monitor = cheap, add as clone count grows (3+). Error alerting = with the
  per-module security pass (§17d D3) / V2, since logging is already pino.

### 20d. Per-clone usage metering 🟠 (the data layer SaaS billing needs)
`plan_tier` (basic/standard/premium, §17c seam #2) exists as a FIELD but nothing MEASURES or ENFORCES
it. Landing multi-tenant (§11–12) is a volume business → billing needs usage:
- **Meter per shop:** orders/month, products, storage (S3 bytes), traffic — the dimensions a tier caps.
- **Enforce tier:** a soft limit check (warn) → hard (block) tied to `plan_tier`. For clone mode this is
  light (one client = one tier); it becomes essential in tenant mode.
- **When:** NOT now (no SaaS billing yet). Design the metering shape WITH the landing multi-tenant work
  (§12, Step 6) — `shop_id` is already the seam it hangs off. Flag now so Step 6 doesn't forget it.

> **Timing summary:** 20a-migration-runner + 20b-food-backup are the only NEAR-term items (Path C
> brings the runner; food backup is a cheap cron worth doing for the live shop). 20a-playbook +
> 20b-automation gate the SECOND client. 20c scales with clone count. 20d is a Step-6 (landing SaaS)
> design concern. None blocks Step 1.5 / Step 2 — but 20a/20b must be solved before scaling client count.

---

## 21. Independent audit findings (fresh-context `architecture-reviewer`, 2026-06-25)

A fresh-context agent audited the whole corpus (this master + OWNER_FEATURE_FLAG + PLAN_PATH_C +
MULTI_NICHE + security audit + backend.md) and VERIFIED each finding against actual code. It did NOT
re-flag anything already in §17c/§17d/§20. New findings below — 10 genuine gaps + 5 polish.

> ⚡ **Four of these apply to TODAY'S LIVE food shop, not just the future plan** (21.1 search,
> 21.2 SMS, 21.3 invoice race, 21.4 admin lockout) — each a small additive fix (1–30 lines, no
> migration). Treat them as Phase-0-class: fix in a near-term hardening pass, don't wait for V2.

### Genuine gaps

| # | Finding | Sev | When | Approach |
|---|---------|-----|------|----------|
| 21.1 | **Product search doesn't scale** — all search uses `$regex /i` = full collection scan; fine at 500, slow at 2k, times out at 10k. No text-search strategy in the plan. | HIGH | **now** (1-line index) / revisit Atlas-Search at Step 6 | Add Mongo `$text` index on `product_name`+`product_description` now; multi-tenant Step 6 may need Atlas Search / dedicated search. |
| 21.2 | **Order SMS is synchronous** — `await sendSMS()` inline in order placement; BulkSMS 300–2000ms → customer "place order" hangs / provider timeout → 500 at the worst UX moment. | HIGH | **now** (1-line/site) | Fire-and-forget: `Promise.resolve().then(()=>sendXxx()).catch(logger.error)`. No full queue needed yet. |
| 21.3 | **Invoice ID race condition** — `while(!unique)` app-level loop, no DB unique index → concurrent orders (flash-sale/SaaS burst) can mint duplicate invoice_id. | HIGH | before Step 6 (do index now) | Unique index on `invoice_id` + catch Mongo 11000 + retry once. |
| 21.4 | **No admin login account-lockout** — OTP has a 5-try cap but admin PASSWORD login has only IP rate-limit (bypassable via IP rotation) → slow brute-force viable on the live shop. | HIGH | **now / Phase-0-class** | Add `login_failed_attempts` + `login_locked_until` to admin model; lock 15min after 10 fails; reset on success. ~30 lines, additive, no migration. |
| 21.5 | **No GDPR / data-deletion design** — no tenant-offboard data purge, no customer PII delete/anonymise, no data export. Blocks regulated/enterprise/international sales. | HIGH (SaaS) / MED (now) | design at Step 6 | `DELETE /user/me` (anonymise PII, keep invoices) + tenant-offboard runbook; `shop_id` makes tenant-scope trivial. |
| 21.6 | **No clone onboarding/offboarding runbook** — §16 describes the WHAT, not the HOW a (non-owner) employee spins up / tears down a client. | MED | before 2nd client | One-page `CLONE_DEPLOY_RUNBOOK.md`: tag → clone+bootstrap → OWNER creds → env swap → deploy → smoke → offboard. Docs, not code. |
| 21.7 | **Dependency/supply-chain untracked** — no `npm audit` anywhere; `bkash-payment-gateway`, `geoip-lite` (stale DB), `sslcommerz` carry risk at SaaS scale. | MED | before next client + ongoing | `npm audit --audit-level=high` in deploy checklist + CI (§21.9); periodic geoip-lite refresh. |
| 21.8 | **Path C migration has no "verification failed" branch** — §6 says dry-run+assert resolved-set equals old flags, but is silent on what to do if a live role is partially-broken (the silent-drop bug) and the assertion fails. | MED | before Path C Phase 4 cutover | Add remediation: on diff, DON'T abort — write the UNION (grant what either path granted), flag role for human review. Preserves access vs silent revoke. **→ fold into PLAN_PATH_C §6.** |
| 21.9 | **No CI** — no `.github/workflows`; only manual `tsc`. At 3+ clones tracking the engine, a tsc-passing change that breaks admin UI is caught only after a client breaks. | MED | V2 (before multiple clones) | GitHub Actions: job1 `tsc --noEmit` (BE), job2 `next build` (FE) on every `v2` push. Free, catches the type/controller-drift class. |
| 21.10 | **Feature-flag FE-route gate has no locked helper shape** — OWNER_FEATURE_FLAG §D4 says "shared helper not 10 checks" but doesn't define it for Next App Router (`notFound()` can't sit in middleware like a Router guard). → drift risk. | MED | Step 3 (OWNER layer) | Lock `requireFeatureOrNotFound(flag)` (Next page) + `assertFeatureEnabled(flag,res)` (Express) signatures in the flag registry before coding Step 3. **→ fold into OWNER_FEATURE_FLAG.** |

### Good-to-have polish
- **P1 Tenant data-isolation TEST** (NICE, before Step 6) — a Vitest/Playwright that creates 2 tenants, confirms neither reads the other's data. Isolation must be verified, not claimed.
- **P2 Preset-preview concurrency guard** (NICE, Step 4) — live-preview must use a read-only demo copy, never write the live settings doc (2 OWNERs previewing = race).
- **P3 Metering dimensions undefined** (NICE, Step 6) — pick the 2 billable now (orders/month + product count); defer S3-bytes/traffic (needs edge proxy) until a client hits the cap.
- **P4 `withdrow_payment_method` misspelling** (NICE) — the V2 FE+Admin clean-rewrite is the window to rename (via the §20a migration runner); else it carries forward.
- **P5 `bkash-payment-gateway` dead dependency** (NICE) — in package.json but NOT wired in the gateway registry (only cod/manual_mfs/sslcommerz/bank_transfer). Wire it or remove it before next handoff (bundle + supply-chain surface for no benefit).

> **Cross-doc actions:** 21.8 → add a "failed-assertion remediation" subsection to PLAN_PATH_C §6;
> 21.10 → lock the two helper signatures in OWNER_FEATURE_FLAG §D4. (Not done yet — flagged here.)

---

## NEXT
Owner reviews. Then Step 1.5 (permission overhaul — foundation) → Step 2 (fashion concrete).
No abstraction before fashion is concrete.
Operational backbone (§20): migration runner rides Path C; food backup is a cheap near-term win;
20a-playbook + 20b-automation must land before the SECOND client scales.
Audit (§21): a near-term HARDENING pass should fix the 4 live-shop items (21.1 search index ·
21.2 async SMS · 21.3 invoice unique-index · 21.4 admin lockout) — all small, additive, no migration.
