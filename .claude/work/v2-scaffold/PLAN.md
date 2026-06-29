# V2 Scaffold Plan — `ecommerce-core-web` (Layer 0 foundation)

> Written session 56 (2026-06-26). This is the **scaffold/foundation plan** for the merged FE+Admin
> Next.js app. NO feature code yet — this stands up the empty-but-running skeleton + the shared kit, so
> feature slices (admin-first) can begin. Owner-approve before scaffold code runs.
>
> Locked context: [[v2-branch-and-staging-model]] + master plan §22. Reference admin =
> `c:\Coding\Perosnal\common-ecommerce-admin` (read this session). Build bibles =
> `docs/_ai/V2_ADMIN_FEATURE_CHECKLIST.md` + `V2_FRONTEND_FEATURE_CHECKLIST.md`.

---

> ⭐ **DATA LAYER + FOLDER STRUCTURE = the authoritative coding guide is now a separate doc:**
> [`DATA_LAYER_AND_STRUCTURE.md`](./DATA_LAYER_AND_STRUCTURE.md) (session 57). It locks: admin =
> client TanStack Query (not RSC), hybrid CRUD factory (`makeCrudHooks` ~1 line + escape hatch for
> complex resources), optimistic add/update/delete, 30s/60s caching, server-side TanStack tables,
> shop_id seam, the per-feature 7-file mold, and exactly what was taken/rejected from bridge +
> common-admin. **Read it before writing any feature.** The folder skeleton in §3 below is the macro
> view; that doc is the data-layer detail.
>
> ⚠️ **API CONTRACT FOUNDATION (that doc's §9) must land at scaffold, not later** — it's the
> "BE-response-change-breaks-FE+Admin" trap, avoided by adopting target shapes NOW + updating BE to match:
> (9.1) §17d D5 response envelope `{success,statusCode,data,meta,error{code},path,requestId,timestamp}`
> — **BE `sendResponse.ts`/`global.error.handler.ts` update required**, done as BE V2 foundation
> before/with slice 1; (9.2) canonical `ProductCardDTO` + one `<ProductCard>`/`<ProductStrip>` (declare DTO
> in `packages/types` now); (9.3) CSRF `X-CSRF-Token` seam in `apiClient`; (9.4) shared Zod BE↔FE
> (schema-first → D6 Swagger free); (9.5) permission registry = nav `perm` ↔ BE guard ONE source
> (+ fix the 2 live unauthed routes, PERMISSION_OVERHAUL Phase 0); (9.6) admin-mutation→`revalidateTag`
> seam for storefront; (9.7) SEO foundation (storefront slice, #1 rewrite risk).

## 0. Locked decisions feeding this plan
- **TypeScript** + **Next.js (latest, App Router)**, 2-repo (this = the web app; BE stays FruitSnacks).
- Local folder + GitHub repo `ecommerce-core-web` at `c:\Coding\Perosnal\ecommerce-core\ecommerce-core-web`.
- **Now:** create repo + run locally on localhost. **Coolify/staging = later** (separate step).
- Calls the EXISTING FruitSnacks backend (`http://localhost:5000` local; `api-staging`/`api` later).
- **Reference admin** `common-ecommerce-admin` (React19+Vite+JS) = design/structure/shadcn/theme blueprint
  → translate to TS + Next App Router. Take look-&-feel + feature-folder pattern + theme CSS, NOT the
  Vite/RTK/React-Router plumbing.
- **Build order:** foundation kit → Admin (settings→theme→catalog→…) fully → THEN storefront.
- **Storefront** = RSC-first, Redux for cart only, no RTK Query. **Admin** = TanStack Query + useMutation,
  all client. **Admin tables** = TanStack Table full potential. **Skeletons** everywhere.

---

## 1. Theme architecture (LOCKED — 3 tiers)
| Tier | What | static/dynamic | Source |
|------|------|----------------|--------|
| 1 | **Admin chrome** (color dropdown blue/green/rose… + day/night) | **STATIC** (class-based CSS, localStorage) | reference admin `styles/themes/*.css` + ThemeProvider + ColorThemeSelector + ModeToggle |
| 2 | **Storefront site-default skin** (+ day/night) | **DYNAMIC** (DB token JSON, tweakcn-paste, runtime inject, NO deploy) | new — extends FruitSnacks `themes` collection + `ThemeStyleInjector` pattern |
| 3 | **Per-product PDP theme override** | **DYNAMIC** (already exists in FruitSnacks) | page-content theme assign |
- **PDP priority:** product-assigned theme → else site-default skin → day/night = user/system toggle.
- **tweakcn JSON:** Tier-1 = developer drops a `.css` + 2 config lines (static, ships w/ deploy). Tier-2/3 =
  admin pastes tweakcn JSON in a textarea → parser → DB → runtime inject (dynamic, no deploy). Same oklch
  token shape both places → ONE shared token parser in `packages/lib`.
- Admin theme dynamic = NOT now (only worth it at Step-6 white-label SaaS; static dropdown is the base anyway).
- ⭐ **Token strategy (LOCKED, session 57): ONE token system = shadcn CSS variables (`--primary`, `--background`,
  `--ring`, …) for ALL three tiers.** A color theme is just a class block overriding those vars, e.g.
  `:root.theme-green { --primary: <oklch>; … }`; day/night is `.dark { … }`. `<html>` carries BOTH a color
  class AND `.dark` → shadcn components obey automatically, no per-component styling. From the reference admin
  take ONLY the *idea* (which colors: green/blue/rose/amber/…, the swatch dropdown UX) — **NOT** its separate
  Vite/Tailwind-v4 `styles/themes/*.css` class system. Re-implement as shadcn `--*` overrides so Tier-1 (static
  admin chrome) and Tier-2/3 (dynamic tweakcn-paste) share the EXACT same oklch `--*` shape → the one shared
  token parser works everywhere, zero split. (`components.json` must have `cssVariables: true`.)

---

## 2. Reference admin — what we adopt (blueprint, translated to TS+Next)
Verified this session in `common-ecommerce-admin`:
- **Stack there:** React 19, Vite 7, Tailwind v4, shadcn **new-york / neutral / cssVariables**, TanStack
  Table 8, RHF + Zod, lucide, recharts, react-toastify, Redux+RTK (we drop RTK).
- **shadcn primitives present (27)** — adopt all: alert-dialog, avatar, badge, breadcrumb, button, card,
  chart, checkbox, collapsible, dialog, dropdown-menu, field, input, label, pagination, popover, scroll-area,
  select, separator, sheet, sidebar, single-file-upload, skeleton, switch, table, textarea, tooltip.
- **Layout pattern:** `SidebarProvider > DashBoardSidebar + SidebarInset(Navbar + Outlet)` — shadcn sidebar.
  → Next: `(admin)/admin/layout.tsx` = SidebarProvider + sidebar + topbar + `{children}`.
- **Feature-folder pattern (adopt exactly):** `features/<area>/<feature>/<Feature>Page` +
  `components/{AddEdit*Modal, *Columns, *TableToolbar, *StatsCards, *DetailsModal, use*Table}`.
- **TanStack table hook pattern:** `use*Table(data, columns)` wires sorting/filter/columnVisibility/
  rowSelection/globalFilter/pagination. → V2: generalize to ONE `useDataTable` + server-side mode (BE
  pagination/sort/filter per §21.1 + AD-A8) since reference is client-side only.
- **Theme system:** `styles/themes/*.css` (oklch class blocks) + `index.css` @import + `themeConfig.js`
  (list + swatch) + `ThemeProvider` (localStorage, `<html>` class) + `useTheme` + `ColorThemeSelector` +
  `ModeToggle`. → port to Tier-1 admin chrome (TS, Next-safe: avoid hydration flash w/ a blocking
  inline script or `next-themes`).
- **hooks to bring:** use-mobile, use-media-query, use-file-upload, useDataTable. **lib/utils** (cn).
- ⚠️ Reference is `tsx:false` + Vite + RTK + React-Router — we re-do those in TS + Next + TanStack/RSC.
  Reference has dead/`copy` files (e.g. `useCategoryTable copy.js`) — don't carry those over.

---

## 2b. Two more references — i18n/theme (AgencyPlatform) + admin sidebar (bridge-to-bangladesh)
Owner pointed to two more repos for IDEAS (read this session — apply best practice, not blind copy):

### i18n (en/bn) + day/night — from `c:\Coding\Perosnal\AgencyPlatform` (same owner, Next 16 + next-intl v4)
Adopt this exact, proven pattern (keeps our two apps consistent + matches master §17b i18n + §17 i18n-SEO seam):
- **next-intl v4** (`next-intl ^4.13`) + **next-themes** (`^0.4`). Deps to install.
- `src/i18n/routing.ts` — `defineRouting({ locales:['en','bn'], defaultLocale:'en', localePrefix:'always' })`.
  ⚠️ **Use `localePrefix:'always'`** (`/en`, `/bn`) — owner already hit `ERR_TOO_MANY_REDIRECTS` with
  `'as-needed'` on next-intl v4 + Next 16; `'always'` is the verified fix (single `/`→`/en` redirect, SEO
  unaffected via canonical+hreflang). Don't repeat that bug.
- `src/i18n/navigation.ts` — `createNavigation(routing)` → locale-aware `Link`/`useRouter`/`usePathname`
  (use these everywhere instead of next/link so prefixing is automatic).
- `src/i18n/request.ts` — `getRequestConfig` loads `messages/${locale}.json`, unknown → default.
- `src/messages/{en,bn}.json` — translation dictionaries. `proxy.ts` (next-intl middleware) at src root.
- `LocaleSwitcher` (links same page in other locale) + `ThemeProvider` (next-themes, `class` strategy, `.dark`
  on `<html>`, `defaultTheme="system"`) + `ThemeToggle` (Sun/Moon, **`useMounted` guard to avoid hydration
  flash**). Both keyed off CSS tokens in globals.css.
- This is the **day/night engine for BOTH admin chrome AND storefront** (next-themes `class` strategy works for
  both). Tier-1 admin color-dropdown layers ON TOP of this (color class + light/dark class together).
- **i18n is in from day 0** (locale routing + messages), so strings aren't hardcoded — matches master "extract
  i18n DURING v2, not retrofit". Per-clone `enabled_languages` decides if the switcher shows (bn-only client →
  no switcher, bn messages only).

#### ⭐ i18n EXECUTION POLICY (LOCKED, session 57) — "wrap day-0, translate later"
Owner decision: full en+bn infra now; **build in EN only**; translate to BN later once the whole site is
feature-complete + tested + stable (so strings don't churn and waste translation work).
- **Every UI string is wrapped in `t("key")` from day-0** — buttons, titles, table headers, form labels,
  toasts, validation, empty/error states, tooltips. **NEVER hardcode raw text and retrofit `t()` later**
  (that's the exact retrofit the master rule forbids; 40 routes × ~50 strings = unsearchable mess).
- **`en.json` gets the value as we build.** `bn.json` keys are left empty / filled later — next-intl
  falls back to `en`, so missing BN just shows English. No code is touched when BN is added — it's pure
  DATA fill (`bn.json` values), done in one pass at the end. Claude can bulk-generate `bn.json` from the
  finished `en.json` then owner reviews e-commerce terms (SKU/Variation/COD stay English where clearer).
- **Sidebar nav labels = en+bn NOW** (small fixed ~40-item `adminNav` list — cheap, and it's the visible
  "language works" proof). Everything else (page bodies/buttons/forms/lists) = EN value now, BN at the end.
- **Message namespacing = per-feature** (mirrors the feature-folder mold): `catalog.brand.add`,
  `orders.status.pending`, etc. Keeps `en.json`/`bn.json` from becoming one unmanageable flat blob.
- **Admin bilingual vs single-language is deferred, NOT cancelled** — infra carries both; if a client
  needs a Bangla admin it's a one-pass `bn.json` fill, no rebuild. (Storefront en/bn matters for SEO;
  admin BN is a sellable-later feature, not a delivery blocker.) e-commerce extras (currency/number/date
  locale formatting) still added on top of the AgencyPlatform marketing-only i18n.

### Admin left-sidebar — IDEA from `c:\Coding\Revinr\bridge-to-bangladesh-web-app-dev` (Next App Router admin)
Its `(admin)/admin` layout + `AdminLeftSidebar` is a mature pattern — take the IDEAS (re-implement in our
TS/shadcn-sidebar, our judgement on the rest):
- **Config-driven nav** `src/config/adminNav` → `NAV_SECTIONS` (section label + items; each item =
  `{title,url,icon,perm, children?}` → **nested/collapsible groups**) + `BOTTOM_NAV`. One config drives the
  whole sidebar (our V2 generates it from the permission registry later — Path C).
- **Collapsible sidebar** (open/close, icon-only collapsed w/ tooltip, mobile slide-in button).
- **Active-route detection:** root routes = exact match; others = `startsWith`; nested groups **auto-open** when
  a child is active (`hasActiveChild` recursion).
- **Badge pill (expanded) / dot (collapsed)** for counts (e.g. notifications) — dynamic or static.
- **Permission filter** `filterNavByPermissions(nav, perms)` hides items the role can't see (ties to our RBAC).
- Layout shell: left sidebar + main column (top navbar + announcement bar + scroll content + sticky footer);
  allowed-paths derived FROM the nav config (single source).
- We build this on **shadcn `sidebar` primitive** (reference admin already has it) + this bridge nav-config idea
  = best of both: shadcn's accessible sidebar mechanics + bridge's config/permission/nested pattern.

## 2c. Beyond the references — what we ADD ourselves (best practice, not in any reference)
References give the best parts; these are the gaps WE fill (foundation/skeleton at Layer 0, full impl per
slice — per master §17 "no abstraction before concrete", we lay the contract but don't over-build):
1. **Server-side `useDataTable`** — reference table is client-only (in-memory). Catalog has 1000s of rows →
   server pagination/sort/filter (BE-driven, URL-synced state), built on TanStack Table. (AD-A8 / §21.1.)
2. **Shared Zod schema (BE↔FE)** — reference has RHF+Zod but not shared. Put canonical Zod schemas in
   `packages/types` consumed by both validation + form + (ideally) BE. Kills the type/validation drift.
   + autosave/dirty-guard form pattern (AD-B3).
3. **Standardized UI contracts** — ONE toast pattern, ONE skeleton/empty/error set in `shared/` (reference
   scatters these). Every list/page consumes the same primitives.
4. **Typed API client + error envelope** — reference's fetch is thin. A typed client that understands the
   §17d D5 rich response envelope (`error.code`, `meta`, `requestId`) so the UI stops string-matching messages.
5. **Route-level `loading.tsx` / `error.tsx` / `not-found.tsx`** — Next App Router convention; absent in the
   Vite SPA reference. Real skeletons per route.
6. **a11y baseline** (AD-A6 / FE-A6) — focus management, aria, keyboard nav. shadcn helps but we verify.
7. **SEO foundation** (storefront) — `generateMetadata` helper, Product/Org/Breadcrumb JSON-LD, sitemap,
   canonical/hreflang (ties i18n). Master's #1 rewrite risk (FE-A1) — lay the helper now, fill per slice.
8. **Typed analytics `track()`** (FE-A10) — consent-gated, eventID-deduped, GTM+pixel+CAPI. Not in references.
9. **e-commerce i18n extras** — AgencyPlatform i18n is marketing-only; we add currency/number/date locale
   formatting + product-content multi-lang (bn-fallback, master §17b) on top of its routing pattern.

## 2d. State / data management doctrine (LOCKED — answers "Redux? RTK Query?")
**RTK Query = NOT used anywhere. Redux = storefront cart/UI only. Server data = RSC fetch (storefront) +
TanStack Query (admin).**

| | Storefront | Admin |
|---|------------|-------|
| **Server data** (product/order/settings…) | **RSC `fetch`** + tag-revalidation + `React.cache()` dedup | **TanStack Query** (`useQuery`/`useMutation`) |
| **Client-owned state** | **Redux Toolkit** — cart (dual-storage localStorage+DB) + UI (drawer/selection) ONLY | none needed — current user via TanStack `useQuery(/get_me)`/context, theme via next-themes, sidebar via shadcn context |
| **RTK Query** | ❌ dropped | ❌ never added |
- **Rule:** data from the server → fetch/TanStack; data the client owns (cart) → Redux. Never both for the
  same data (that drift is exactly current-FE's bug).
- **Why no RTK Query:** current FE barely uses it (mostly native fetch + 2 dead slices); in an RSC-first app
  server data is fetched server-side, making a client cache-lib redundant; two query libs = drift. One: TanStack.
- **Why no Redux in admin:** admin has no real cross-page client state at Layer 0. If a future need appears
  (e.g. multi-step wizard draft surviving navigation) → reach for **Zustand** or context, NOT Redux.

## 3. Target folder skeleton (this scaffold creates)
```
ecommerce-core-web/
├── src/
│   ├── app/
│   │   └── [locale]/                  # next-intl locale segment (en/bn)
│   │       ├── layout.tsx             # root-ish: html/body, fonts, ThemeProvider, NextIntlClientProvider
│   │       ├── (storefront)/layout.tsx    # storefront chrome (later — stub now)
│   │       │   └── page.tsx           # "storefront coming" placeholder
│   │       ├── (admin)/admin/
│   │       │   ├── layout.tsx         # shadcn SidebarProvider + sidebar + topbar (theme+locale+user)
│   │       │   ├── page.tsx           # dashboard placeholder
│   │       │   └── (feature routes added per slice)
│   │       └── (auth)/                # admin + customer auth (stub now)
│   ├── proxy.ts                       # next-intl middleware (locale routing) + admin/customer cookie split
│   ├── i18n/                          # routing.ts, navigation.ts, request.ts (from AgencyPlatform pattern)
│   ├── messages/                      # en.json, bn.json
│   ├── app/api/                       # route handlers if needed (later)
│   ├── components/ui/                 # shadcn primitives (the 27)
│   ├── features/                      # feature-folders (added per slice)
│   ├── packages/                      # the shared kit (plain folders, NOT turborepo)
│   │   ├── ui/                        # cross-app primitives + design tokens
│   │   ├── types/                     # canonical DTOs (Product/Order/Cart/Setting…)
│   │   └── lib/                       # cn, currency, phone, price resolver, token parser, track()
│   ├── lib/                           # app-local utils, api client (RSC fetch + admin TanStack)
│   ├── hooks/                         # useDataTable, use-mobile, use-media-query, use-file-upload, useTheme
│   ├── providers/                     # ThemeProvider (admin chrome), QueryProvider (admin), Redux (cart)
│   ├── shared/                        # sidebar, navbar, skeletons, empty-states
│   ├── styles/themes/                 # Tier-1 admin chrome theme CSS (from reference)
│   └── constants/                     # themeConfig, nav config, etc.
├── components.json                    # shadcn (new-york/neutral/cssVariables, tsx:true, rsc:true)
├── tailwind.config + globals.css
├── tsconfig.json                      # @/* + @/packages/* path aliases
├── .env.local                         # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1 …
├── CLAUDE.md                          # V2 app guide (patterns + "reference = ../../FruitSnacks")
└── (the 2 checklist docs moved into docs/ here)
```
Note: `packages/` lives inside the app (plain folders, path-aliased) per the 2-repo decision.

---

## 4. Scaffold steps (the actual work, in order)
**Phase 0a — create + run empty Next app**
1. `create-next-app` (TS, App Router, Tailwind, ESLint, `src/`, `@/*` alias) at the target path.
2. Verify `npm run dev` serves localhost. Set `.env.local` API URL.
3. `git init` → first commit → create GitHub repo `ecommerce-core-web` → push `main`; create `v2-dev`,
   work on `v2-dev`. (Coolify wiring deferred.)

**Phase 0a-i18n — locale routing + day/night (AgencyPlatform pattern, day 0)**
3.5. Install `next-intl` + `next-themes` (latest). Add `src/i18n/{routing,navigation,request}.ts`
   (`locales:['en','bn']`, `localePrefix:'always'`), `src/messages/{en,bn}.json`, `src/proxy.ts`. Wrap app in
   `NextIntlClientProvider` + `ThemeProvider` (next-themes, class strategy). Add `LocaleSwitcher` + `ThemeToggle`
   (+ `useMounted` guard). Verify `/en` + `/bn` route and day/night toggle on localhost.

**Phase 0b — shadcn + design tokens + admin chrome COLOR theme (Tier 1, layered on next-themes)**
4. `shadcn init` (new-york, neutral, cssVariables, tsx). Add the 27 primitives.
5. Build the color-theme system (IDEA from reference admin, our impl): theme token CSS (oklch class blocks, can
   seed from tweakcn) + a `colorTheme` provider/config + `ColorThemeSelector` dropdown — layered on top of
   next-themes light/dark (so `<html>` carries BOTH a color class AND `.dark`). Confirm color dropdown +
   day/night work together without hydration flash.

**Phase 0c — packages kit + helpers (foundation, owner asked "build reusable + helpers first")**
6. `packages/lib`: `cn`, `currency`, `phone` (normalizeBdPhone), **price resolver** (port from FruitSnacks
   `helper.js` — the keystone), `applyCartLayers` (later, for storefront), tweakcn **token parser**, typed `track()`.
7. `packages/types`: core DTOs from BE interfaces (Product/Order/Cart/Setting/Category/Attribute).
8. `packages/ui`: wrap/re-export shadcn primitives + token CSS so both surfaces consume one set.
9. `hooks/useDataTable` (generalized TanStack hook, client + server-side mode ready) + use-mobile/media/file.
10. `lib/api` client: RSC `fetch` helper (tag-revalidation, `cache()` dedup) + admin TanStack QueryClient + `useMutation` base + toast contract + skeleton/empty/error components in `shared/`.

**Phase 0d — admin shell**
11. `(admin)/admin/layout.tsx`: shadcn SidebarProvider + DashboardSidebar (nav config from constants) +
    topbar (ColorThemeSelector + ModeToggle + user menu) + breadcrumb + `{children}`.
12. `middleware.ts` stub: gate `/admin/*` on admin cookie (real verify wired w/ auth slice).
13. Dashboard placeholder page → confirm the admin shell renders on localhost with theme switching + skeletons.

**Phase 0e — housekeeping**
14. New `CLAUDE.md` (V2 patterns, reference pointer, doctrine). Move the 2 checklist docs into this repo's
    `docs/`. `.gitignore`, ESLint/TS strict, README.
14b. **`.claude/` setup (LOCKED session 57):** structure + `settings.json` from the AgencyPlatform pattern
    (`bypassPermissions`, allow-list). The 8 agents + commands = **reuse FruitSnacks' versions** (they
    already know the Express/Mongoose BE this app talks to + the §9 contract — **do NOT strip Express/Mongo;
    the app is cross-app and we also update BE**) + ADD V2 web-stack knowledge (Next/TanStack/shadcn/TS,
    DATA_LAYER §0-9). Trim only genuinely-irrelevant V1 bits (old Vite/RTK Admin refs, dead V1 modules).
    Drop `verify-be` (BE is a separate repo → its `.claude/` later); `fs-dev` → `dev` (`npm run dev`).
    Empty `work/agent-notes/`. CLAUDE.md (root, step 14) stays the project guide outside `.claude/`.
14c. **Docs location (LOCKED session 57):** NOT a monorepo (master §22 stands). Container folder
    `ecommerce-core/` is a plain local organizer (NOT a git repo) — never put docs directly in it. For now
    keep V2 scaffold docs in `ecommerce-core-web/docs/` (only one app exists). When BE arrives + real
    cross-app docs are needed, create a separate `ecommerce-core-docs` repo (the "docs repo" from
    [[git-infra-and-branch-rules]]) and move container/contract docs there. Don't create it prematurely.

**Exit criteria (Layer 0 done):** localhost shows an empty admin shell with working sidebar, color-theme
dropdown + day/night, skeleton/empty/error primitives, the packages kit + useDataTable in place, repo on
GitHub (`v2-dev`). No feature yet — ready for slice #1.

---

## 5. After scaffold — first feature slice
Per owner order: **Admin first** → slice 1 = **Settings + admin auth + Tier-1 theme polish** (foundation
every page needs), then **Theme management (Tier-2 dynamic storefront skin + tweakcn-paste)**, then catalog
(Category → Attribute → Product list → Product wizard → Page-content), … full admin, THEN storefront.
Each slice: build + staging-test before next. Each gets its own scratch PLAN when started.

---

## 6. Owner answers (resolved session 56)
1. **Versions:** **latest** of every package (Next + all deps), shadcn latest, create-next-app latest.
2. **GitHub repo:** Claude creates `SaifullaJubair/ecommerce-core-web` via `gh` CLI, **PRIVATE**.
3. **Admin theme:** full color-theme system + day/night **in one go**, modeled on reference admin —
   **idea not blind copy**; Claude's judgement + best-use-case for the actual impl.
4. **All other components + folder structure = Claude's call** (references = inspiration, not a spec to clone).
5. **i18n (en/bn) in from day 0** — adopt the AgencyPlatform next-intl v4 pattern (`localePrefix:'always'`).
6. **Admin left-sidebar** — take the bridge-to-bangladesh config-driven/nested/permission sidebar idea, built
   on the shadcn `sidebar` primitive.

> Guiding principle owner restated: references = source of IDEAS, NOT blind copy. Claude decides the actual
> structure/components/folders using best practice + best-use-case judgement.

### Reference repos (IDEAS only, read session 56)
| Repo | Take from it |
|------|--------------|
| `common-ecommerce-admin` (React19/Vite/JS) | shadcn new-york setup + 27 primitives, feature-folder pattern, TanStack table hook, color-theme dropdown idea |
| `AgencyPlatform` (Next16/next-intl v4/next-themes, same owner) | **en/bn i18n (adopt as-is)** + **day/night via next-themes** + `localePrefix:'always'` fix |
| `bridge-to-bangladesh-web-app-dev` (Next App Router admin) | **admin left-sidebar idea** — config-driven NAV_SECTIONS, nested/collapsible, active-route detection, permission filter, badge, layout shell |
| `FruitSnacks` (live V1) | feature checklist + proven business logic (price/cart/variation) — the 2 checklist docs |
