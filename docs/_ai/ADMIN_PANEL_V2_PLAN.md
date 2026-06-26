# Admin Panel V2 — Plan (deferred: after backend phases, or when owner says)

> 🆕 **2026-06-24 — read [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md) FIRST.** Major V2
> decision SUPERSEDES this doc's framing: **Admin MERGES into the storefront's Next app**
> (`/admin/*` route group; Admin is no longer a standalone Vite SPA — that's a big port, see master
> §13). Also new: OWNER feature-flag layer (Feature Management page is OWNER-only —
> [OWNER_FEATURE_FLAG.md](OWNER_FEATURE_FLAG.md)), permission registry rewrite
> ([PERMISSION_OVERHAUL.md](PERMISSION_OVERHAUL.md)), admin in-app notifications, i18n. This doc's
> page/UX detail still helps, but the standalone-SPA assumption is replaced. Master wins on conflict.

> 🆕 **2026-06-26 (session 56) — EXECUTION locked + feature inventory done.** Read master
> [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md) **§22** (repo/folder/branch: 2-repo not monorepo,
> Admin = `(admin)/admin/*` route group inside `ecommerce-core-web`, 4-branch model, TanStack Query +
> `useMutation`, all `"use client"`, bundle-split so Recharts/Quill never hit storefront). The **definitive
> admin feature spec to rebuild from** is now [V2_ADMIN_FEATURE_CHECKLIST.md](V2_ADMIN_FEATURE_CHECKLIST.md)
> — every route/page/tab + ~30 smart-UX niceties + reference file paths, independently re-verified by
> sub-agents. Use that checklist as the build bible; this doc = the craft/UX intent layer (AD-A8 TanStack
> server-side table, AD-B3 forms beyond RHF+Zod, AD-A6 a11y, toast/empty/skeleton contracts).

**Captured:** 2026-05-25 (session 3). **Status:** PLANNING ONLY — not started. Pick up AFTER the MASTER_BACKEND_ROADMAP backend phases are done, OR whenever the owner says. Details to be expanded into a scratch-folder PLAN when work begins.

> Owner's vision: "amra ja shundor backend kortici shei vabe admin panel ta korte chai" — rebuild the admin UI to resale-grade, driven by a reference admin the owner already has (built from shadcn's theme-generator). The current admin works but is not polished/themeable enough to sell.

## The goal
A polished, **fully themeable, multi-language, animation-rich** admin panel — so a clone buyer can re-skin + re-language it with zero code, and the day-to-day authoring (products, page-content) is genuinely pleasant.

## Current admin stack (verified 2026-05-25)
- ✅ already present: `react-hook-form`, `@tanstack/react-query`, `framer-motion`, `tailwindcss` (+ tailwindcss-motion, tailwind-scrollbar), existing `src/components/common/ImageUploader.jsx`.
- ❌ to ADD for V2: **shadcn/ui** (+ `@radix-ui/*`, `clsx`, `class-variance-authority`, `tailwind-merge`), **zod** (+ `@hookform/resolvers`), **@tanstack/react-table**, **i18next + react-i18next** (or next-intl-style for Vite). Owner has reference shadcn theme classes copied from the theme generator to seed the palette dropdown.
- Admin is **React + Vite SPA** (not Next) — so i18n = `react-i18next`; shadcn works fine in Vite.

## Requirements (owner-stated)
1. **Multi-language** — entire admin. Phase 1 = BN + EN; later = others. All UI strings via i18n keys (no hardcoded text). Language switcher in header; persist choice.
2. **Dynamic shadcn theme** — a color dropdown (seeded from owner's collected shadcn-theme-generator palettes) → picking a color re-skins the WHOLE admin. ALL colors via shadcn CSS variables (`--primary`, `--background`, etc.) — **zero hardcoded colors** anywhere, so one switch recolors everything. Use shadcn components everywhere (Button, etc.) — no raw styled elements.
3. **Day / Night mode** — on top of the theme (light/dark token sets), toggle in header.
4. **Forms** — ALL forms = React Hook Form + **Zod** validation + TanStack Query mutations. Consistent error display.
5. **Tables** — ALL list tables = **TanStack Table**, full potential: per-column filter, **column drag-drop reorder**, multi-field search, and **row drag-drop that updates the serial/order field** (the existing serial-number concept on category/product/etc.).
6. **Image upload** — adopt the owner's existing reusable dropzone component (drag-drop, file-type-aware accept). (Read it when starting — owner: "code porle bujhba".) Replace ad-hoc upload UIs with this one contract component.
7. **Sidebar menu** — redesign, cleaner/nicer, more shadcn.
8. **Animation** — use shadcn components + framer-motion / tailwindcss-motion liberally for a premium feel.
9. **Page-specific polish** — Product create/edit page and the Page-Content editor especially → more visual, user-friendly. (Page-Content already got a tabbed redesign; V2 takes it further with the new component system.)

## Why it's big (honest)
This is essentially a **UI-layer rebuild** of the admin: introduce shadcn + a theme-token system + i18n + a table abstraction, then migrate every page/form/table onto them. Best done as its own multi-phase feature with its own scratch PLAN. NOT a quick task.

## Rough phase shape (to detail later when started)
- V2.0 Foundation: install shadcn + radix + cva + tailwind-merge; set up the CSS-variable theme token system; wire the palette-dropdown + day/night toggle; add zod + @hookform/resolvers; add i18next (BN/EN scaffolding).
- V2.1 Shared primitives: shadcn Button/Input/Select/Dialog/Card/etc.; the DataTable abstraction (TanStack Table: column filter + column DnD + row DnD→serial); adopt the dropzone ImageUploader as the one upload component; redesigned Sidebar.
- V2.2+ Migrate pages onto the system, page by page (Category tree, Product form, Page-Content, Orders, Settings, Theme, etc.), each form→RHF+Zod, each list→DataTable, all strings→i18n keys, all colors→theme vars.
- V2.last: sweep for any hardcoded color/string; verify theme switch + language switch + day/night recolor/re-text everything.

## Dependencies / ordering
- Independent of the backend roadmap (different app) — but do it AFTER backend is solid so the forms/tables target stable APIs and don't get rebuilt.
- The frontend (storefront) theme system already uses CSS-variable theming ([[default-site-theme]], ThemeStyleInjector) — V2 admin can mirror that approach so the two apps feel consistent.

## ⭐ Craft-quality additions (independent FE/Admin audit, 2026-06-25)

### AD-A8. TanStack Table — make it server-side + persistent + a11y (not just a feature list) 🟠
The feature list (column-filter / column-DnD / row-DnD-serial / multi-search) is right, but at
multi-niche/multi-tenant scale these MUST be **server-side**: pagination + sort + filter on the BE
(ties to PLATFORM_ARCHITECTURE §21.1 — `$regex` won't scale, and the D5 response `meta` carries
page/total). Also add, currently unspecced:
- **Persisted table state** in URL/localStorage (filters/sort survive refresh + are shareable).
- **Column visibility + density toggle.**
- **Sticky header + row virtualization** for long lists (>100 rows).
- **Bulk row-select + bulk actions** (owner asked: product multiselect) + **CSV export.**
- **Keyboard-accessible DnD** (pointer-only reorder is inaccessible).
> Skills: **tanstack-table**, **tanstack-query**, **shadcn**.

### AD-A6. Accessibility baseline (same as storefront) 🔴
Focus management on every Dialog/Drawer/Sheet, keyboard DnD fallback, `aria-live` for toasts/saves,
RHF+Zod errors wired to inputs, visible focus surviving the theme tokens, WCAG-AA contrast from the
palette dropdown.

### AD-B3. Forms beyond "RHF + Zod"
Share the **Zod schema BE↔FE** (D5/D6 schema-first makes it free), autosave/dirty-guard + unsaved-changes
prompt on the long product form, async uniqueness validation (slug/SKU), one consistent inline-error component.

### AD-B6. Empty / skeleton / error states for admin too
Tables, dashboard widgets, list pages — pleasant authoring includes good empty + loading + error states,
not just the happy path.

### AD-B4. One toast/notification contract
A single toast system (not ToastContainer + ad-hoc), tied to the §17b admin in-app notification bell;
`aria-live`; dedupe/stacking.

> See FRONTEND_V2_PLAN for the storefront craft additions (SEO must-not-regress, ProductCard DTO,
> data doctrine), and PLATFORM_ARCHITECTURE §13b (shared write-once UI lib both apps consume) + §14
> (skill→phase map). The shared UI library is the whole point of the FE+Admin merge — admin tables/forms
> and storefront cards/forms come from ONE primitive set.

## When starting
Make `.claude/work/admin-panel-v2/` with a detailed PLAN, get owner approval, then go foundation-first ([[feature-work-scratch-folder]] workflow). Owner will likely share the reference admin / its screenshots then.
