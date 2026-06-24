# Project Strategy — V1 (ship) → V2 (rebuild) two-stage plan

> 🆕 **2026-06-24 — the V2/platform vision is now consolidated in
> [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md)** (master) + sub-docs
> [OWNER_FEATURE_FLAG.md](OWNER_FEATURE_FLAG.md) + [PERMISSION_OVERHAUL.md](PERMISSION_OVERHAUL.md).
> That master is the **authoritative source** for: engine (`ecommerce-core`) vs client clones,
> the 3 axes (niche/skin/density), OWNER feature-flag layer, plan_tier, landing multi-tenant SaaS,
> **FE+Admin merge in V2**, repo/staging strategy, permission overhaul, i18n + notifications.
> This doc + FRONTEND_V2_PLAN + ADMIN_PANEL_V2_PLAN + SAAS_FUTURE_PLAN are EARLIER, narrower
> captures — still useful for detail, but where they conflict with the master, **the master wins.**
> Read PLATFORM_ARCHITECTURE first.

**Captured:** 2026-05-25 (session 3, owner's "final kotha"). The big-picture sequence that all the other `_ai` plans hang under. Read this to understand WHY/WHEN each plan runs.

---

## Stage 1 — Complete & ship V1
Finish the CURRENT codebase to a sellable, working state on top of the backend work already done/queued.

1. **Backend** — keep going through `MASTER_BACKEND_ROADMAP.md` (A ✅, B ✅; then C payment / E / F / D / etc. as owner picks). Each feature + bug-fix lands here.
2. **Admin + Frontend** — bring admin and storefront up to match every backend feature + bug-fix landed (variation/filter/category UI, payment UI, etc.). i.e. make the EXISTING admin/frontend fully functional against the new backend — NOT the full V2 redesign yet.
3. **Deploy + full live testing** — owner deploys and tests the whole site end-to-end live.

> Stage 1 = "make V1 correct, complete, and shippable." Functional completeness over polish.

## Stage 2 — V2 full rebuild (after V1 is deployed & tested)
Owner may **clone the project** and start V2 fresh (or do it in place). V2 is NOT just a UI reskin — it's a top-to-bottom quality pass on all 3 apps:

- **Admin Panel V2** — `ADMIN_PANEL_V2_PLAN.md` (shadcn theme system + i18n + RHF/Zod + TanStack Table + dropzone + redesign + animation). Make it **top-notch**.
- **Frontend V2** — `FRONTEND_V2_PLAN.md` (redesign + cart drawer + feature audit + storefront shadcn theme system w/ zero hardcoded colors + i18n + rendering/data refactor + perf cleanup + analytics + security).
- **Backend V2 audit (NEW — owner-stated)** — a FULL backend performance/quality audit, not just features:
  - Find & fix **extra/redundant queries** (over-fetching, N+1, fetching whole collections to use one field).
  - Find **where too many API hits** happen (chatty endpoints, missing aggregation, missing pagination) → consolidate.
  - **Proper caching / state management** — decide what to cache and where; add **Redis** (or equivalent) for hot reads (settings, category tree, product lists, sessions/rate-limits) if it earns its keep.
  - Indexes audit (right indexes for the actual query patterns), connection pooling, response shaping (`.lean()`, projections), N+1 → aggregation.
  - Anything else that makes the backend genuinely fast & production-grade.
  - **Claude's role:** proactively SUGGEST these improvements during the audit (owner: "tumi amake suggest korba"). Don't wait to be told each one — surface the wins.

> Stage 2 = "make all 3 apps top-notch + genuinely fast" — the version that's premium-sellable.

## Why two stages (not just build V2 now)
- V1 shipping proves the system works live + gives owner a sellable product NOW (clone-per-client revenue can start).
- V2 is a big, deliberate quality investment — best done on a stable, deployed, tested base (so the rebuild targets known-good behavior), and possibly on a clone so V1 clients aren't disrupted.

## How the other plans map
- `MASTER_BACKEND_ROADMAP.md` → Stage 1 backend (features/bugs) + its later phases.
- `ADMIN_PANEL_V2_PLAN.md` / `FRONTEND_V2_PLAN.md` → Stage 2 UI rebuilds.
- **Backend V2 audit** (this doc) → Stage 2 backend performance/quality pass (no separate doc yet; expand into one when Stage 2 starts).

## When Stage 2 starts
Make scratch folders per app (`.claude/work/admin-panel-v2/`, `frontend-v2/`, `backend-v2-audit/`), each with its own PLAN + owner approval, foundation-first. Likely share i18n + theme-token approach across admin+frontend so it's built once.
