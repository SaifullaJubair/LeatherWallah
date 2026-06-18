# CLAUDE.md — FruitSnacks Monorepo

This file provides top-level guidance for the **FruitSnacks** e-commerce platform. The codebase was originally copied from a Bangladesh leather e-commerce project (Artisan Leather) and has been rebranded for resale as **FruitSnacks**. Each subproject also has its own `CLAUDE.md` with deeper details — read those when working inside a specific app.

## Project Layout

```
FruitSnacks/
├── FruitSnacksAdmin/      # React + Vite admin dashboard (SPA)
├── FruitSnacksBackend/    # Express + TypeScript + MongoDB API
└── FruitSnacksFrontend/   # Next.js 14 App Router storefront
```

| App | Stack | Port (dev) | Notes |
|-----|-------|------------|-------|
| Admin | React 18, Vite, React Query, Tailwind | 3001 | Pure SPA, cookie auth |
| Backend | Express, TypeScript, Mongoose, S3 (Contabo) | 5000 | JWT in httpOnly cookie, RBAC by permission flags |
| Frontend | Next.js 14, Redux Toolkit + RTK Query, Tailwind | 3000 | App Router, dual-storage cart (localStorage + DB) |

## Rebranding Status — DONE ✅

The branding-only sweep is complete. All hardcoded brand identifiers in code have been switched to FruitSnacks values:

| Identifier | Old | New |
|-----------|-----|-----|
| Display name | Artisan Leather | **FruitSnacks** |
| Domain | artisenleather.com (+ dev/admin variants) | **fruitsnacksbd.com** family |
| Auth cookie | `artisan_lather_token` | **`fruit_snacks_token`** |
| Analytics anon cookie | `_artisan_uid` | **`_fruit_snacks_uid`** |
| S3 bucket placeholder | `artisen-leather` | `fruit-snacks` (in code comments + `next.config.mjs` image hostname) |
| S3 key prefix | `artisen_leather_images/`, `artisen_leather_videos/` | `fruit_snacks_images/`, `fruit_snacks_videos/` |
| `package.json` name (admin) | `artisan-leather-admin` | `fruitsnacks-admin` |

> ⚠️ **Product copy untouched.** The hardcoded Bangladesh-leather product copy in `pageSeo.js`, `pageSeo.services.ts`, `PromotionalBanner.jsx`, `FeatureService.jsx`, `Navbar.jsx`, `QuickViewModal.jsx`, etc. has **not** been changed. The buyer will overwrite these via the Admin → *Site Settings* + *Page SEO Management* screens (which now default to "FruitSnacks" when DB values are empty), or replace them directly to match the actual product line.

> ⚠️ **`.env` files untouched.** The `.env` files in each subproject still hold the original owner's Mongo URI, S3 bucket, Meta/TikTok pixel IDs, Pathao/Steadfast credentials, and BulkSMS sender ID. These belong to the previous deployment — the new buyer will replace them at deploy time. Do **not** edit them.

## Common Commands

```bash
# Backend
cd FruitSnacksBackend && npm run dev

# Admin
cd FruitSnacksAdmin && npm run dev      # http://localhost:3001

# Frontend
cd FruitSnacksFrontend && npm run dev   # http://localhost:3000
```

No test runners or linters beyond ESLint are configured in any subproject.

## Cross-Project Conventions

- **Auth cookie** `fruit_snacks_token` is set by backend on login, read by all three apps. Any future rename must touch all three repos in lockstep.
- **API base URL** is provided per-app via env (`VITE_API_URL`, `NEXT_PUBLIC_API_URL`); each app reads it through a `baseURL` helper — never hardcode.
- **CORS allowlist** lives in [FruitSnacksBackend/src/index.ts](FruitSnacksBackend/src/index.ts). Add any new buyer domains there alongside the existing `fruitsnacksbd.com` entries.
- **Site settings** (title, favicon, SEO defaults) are persisted in DB and exposed via `/setting` endpoint — Admin's *Software Information* page is the runtime source of truth. Hardcoded fallback strings in code now read "FruitSnacks".

## Active Feature Work — Backend hardening for resale

The dynamic per-product theming system (themes collection, floating images, 2-font, nutrition/benefits/use_cases, FAQ, page-content editor) is **DONE**. Current focus is hardening the backend into a production-grade, resellable backbone. Two tracks:

- **Clone-now track** — see [docs/_ai/CLONE_NOW_FIXES.md](docs/_ai/CLONE_NOW_FIXES.md): incremental bug-fixes + additive product fields + DB-driven settings + wishlist/payment/FB-feed + admin UX, all without touching the core structure.
- **Big-bone track** — see [docs/_ai/BACKEND_AUDIT.md](docs/_ai/BACKEND_AUDIT.md): structural rewrites (Phase A variation engine, price-resolver, nested category, dynamic filter).

Future direction (multi-tenant SaaS) is captured in [docs/_ai/SAAS_FUTURE_PLAN.md](docs/_ai/SAAS_FUTURE_PLAN.md); strategy = ship clone-per-client now, write code SaaS-ready. Owner's product backlog is in [docs/_ai/NEXT_PHASES.md](docs/_ai/NEXT_PHASES.md).

> `docs/_ai/` holds AI working-notes (audits, plans, handoffs) — kept separate from your real project docs in `docs/`.

**Database is fresh** — no production data; we drop and recreate as needed during dev.

## Known Leftovers (intentional)

- Product-domain copy referencing wallets/bags/belts/leather in storefront sections, SEO defaults, and category SEO seed data. The Admin Site Settings + Page SEO screens override these at runtime; the buyer can either (a) update those via Admin UI, or (b) replace the static defaults to match their product line.
- Original Artisan Leather credentials in `.env` files (see warning above).

## Verification

To re-confirm the code is clean of brand identifiers (excluding product-domain copy and the historical note above):

```bash
# from FruitSnacks/ root
grep -rni --exclude="*package-lock.json" --exclude="CLAUDE.md" "artisan\|artisen\|lather" .
```

A clean run returns nothing.

## ⭐ Planning Discipline — proactive edge-case auditing

**Rule:** After proposing a feature plan but BEFORE writing any code, I (Claude) must run an edge-case audit against TWO checklists (code/technical edges + real-world user/admin/business scenarios). Owner has explicitly flagged that happy-path planning has cost time/tokens via late-found bugs.

### When to run

I trigger the audit **automatically** (no owner prompt needed) when the plan matches any of these:

- Touches 3+ files
- Touches schema (`*.model.ts` / `*.interface.ts`)
- Crosses app boundaries (Backend + Admin + Frontend all touched)
- Introduces new URL routes / modifies existing ones
- Changes file storage / S3 / external integration
- Modifies auth / RBAC / permission flags
- Affects order / payment / cart / checkout flow

Owner can also manually trigger anytime with `/edge-audit`.

### Skip when

- Single-file bug fix
- Pure UI tweak (no logic change)
- Doc-only update
- < ~50 LOC change

### Two-tier system

**Tier 1 (default) — `/edge-audit` slash command:**
I run the 15-point technical checklist + the real-world scenario checklist inline using my current context. Output is the prioritized BLOCKERS/HIGH/MEDIUM/NICE-TO-HAVE list at [.claude/commands/edge-audit.md](.claude/commands/edge-audit.md).

**Tier 2 (escalate) — `plan-edge-auditor` sub-agent:**
When Tier 1 finds 3+ BLOCKERS, OR when the plan crosses 2+ apps' schemas, I automatically spawn the `plan-edge-auditor` sub-agent (`.claude/agents/plan-edge-auditor.md`) for a fresh-context independent audit. The sub-agent explores the codebase itself rather than trusting my plan's claims about how existing code works.

### Output → action

After audit, I:
1. Show owner the BLOCKERS + HIGH findings
2. Propose plan modifications to absorb them
3. Wait for owner approval
4. Then start coding

This is non-negotiable for big features. Skipping = repeating the rework cycles the owner has already paid for.

## ⭐ Testing Discipline — proactive post-implementation test pass

**Rule:** After finishing implementation but BEFORE declaring "done" or handing off to owner for live testing, I (Claude) must run a systematic test pass against a SIX-tier framework (build verification + stale-reference scan + orphan scan + integration trace + edge-case + real-world scenarios). Owner has explicitly flagged that "looks fine to me" optimism has cost time/tokens via late-found bugs in tester-mode review.

### When to run

I trigger the test pass **automatically** (no owner prompt needed) when the change matches any of these:

- 3+ files modified
- Schema change in any app
- Cross-app changes (Backend + Admin + Frontend together)
- New URL routes / modified existing routes
- File storage / S3 / external integration changes
- Auth, RBAC, permission flag changes
- Order, payment, cart, checkout flow changes
- Migration script written

Owner can also manually trigger anytime with `/test`.

### Skip when

- Single-file bug fix
- Pure UI tweak (no logic change)
- Doc-only update
- < ~50 LOC change

### Two-tier system

**Tier 1 (default) — `/test` slash command:**
I run build verification + 5 other tiers inline using my current context. Output is a PASS/FIXED INLINE/BLOCKERS/STATIC-VERIFIED list plus an owner manual test plan, per [.claude/commands/test.md](.claude/commands/test.md).

**Tier 2 (escalate) — `feature-tester` sub-agent:**
When `/test` finds 3+ BLOCKERS, OR when the diff spans 3+ apps with schema changes, I automatically spawn the `feature-tester` sub-agent (`.claude/agents/feature-tester.md`) for a fresh-context independent pass. The sub-agent runs real builds and explores the codebase itself rather than trusting my own implementation claims.

### Output → action

After test pass, I:
1. Show owner the PASS report + FIXED INLINE list (already applied)
2. Flag BLOCKERS that need owner decision
3. Provide a prioritized manual test plan (P1 smoke / P2 critical / P3 edges)
4. Wait for owner to run live tests; do not declare "done" until owner verifies

This pairs with `/edge-audit` — audit catches bugs at the planning stage, `/test` catches them at the implementation stage. Together they shrink the rework cycles the owner has already paid for.

## ⭐ AI Agent Suite & Workflow — when each runs

Added 2026-06-17. Sub-agents live in `.claude/agents/`; they share notes in
`.claude/work/agent-notes/` (their cross-session "memory"). They fire by **proactive
delegation** (their `description` matches the task) — not a background daemon. The owner
can always invoke any of them explicitly. There are **no hooks** (auto-tsc-on-edit was
rejected as too slow for the 37-module backend — use `/verify-be` / `/test` on demand).

**When each fires:**

| Trigger | Run |
|---------|-----|
| Start of a fresh chat | `/resume` (owner) → read handoff memory + report status |
| Chat getting heavy / before switching chats | `/handoff` (owner) → refresh `current-status-handoff` memory + cross-doc sync |
| Want a roadmap/progress snapshot | `/phase-status` (owner) → status vs NEXT_PHASES / deep-audit / OWNER_TEST_STATUS |
| **Before** coding a big feature (3+ files / schema / cross-app / route / auth / payment-cart) | `/edge-audit` → escalates to `plan-edge-auditor` if 3+ BLOCKERS or 2+ apps' schemas |
| **After** writing/modifying code, before commit | `code-reviewer` (proactive) |
| Touching auth / RBAC flags / order / payment / cart / courier / PII / S3 / secrets | `security-privacy-reviewer` (proactive) — and before deploys |
| Big structural work — admin redesign, frontend 2.0, backend restructure, new module | `architecture-reviewer` (proactive) |
| After a feature/bug fix (esp. price/order/cart/permission logic) | `test-writer` (proactive — build verification always; Vitest for critical pure logic) |
| After new modules / schema / route changes | `doc-generator` (proactive — updates Bangla docs + `docs/_ai/` + cross-doc sync) |
| **After** finishing a big feature, before "done" | `/test` → escalates to `feature-tester` if 3+ BLOCKERS or 3+ apps w/ schema |
| Session start / before commit-deploy / returning after time away / want one summary | `orchestrator` (owner asks) → ranked briefing from all agents' notes |

Same skip rule as the discipline sections: single-file fix · pure UI tweak · doc-only ·
<~50 LOC → don't spin up the heavy agents. Money & access-control code always gets reviewed.
17 global skills (payload, gsap, framer, frontend-design, ui-ux-pro-max, shadcn, find-skills,
seo-audit, systematic-debugging, tanstack-*, next-* …) auto-invoke by task match.
