# Frontend + Admin Deep-Dive Audit — PLAN (next session)

**Created:** 2026-06-17 (end of session 45)
**Trigger:** owner — "next session a fe and ad deep dive audit hobe sub agent diye"
**Status:** NOT STARTED — this is the queued task for the next session.

## Goal

Same exercise just completed on the **Backend** (session 45), now for **Frontend** and **Admin**:
a pre-next-phase reference that reconciles the actual code against `docs/frontend.md` + `docs/admin.md`,
surfaces gaps / doc-mistakes / real bugs, and fixes the real bugs.

The backend pass is the template for "done right". Read these first as the model:
- `docs/_ai/BACKEND_DEEP_AUDIT_FINDINGS.md` — logic-level findings doc shape (per-bug ID, BLOCKER/HIGH/MEDIUM, fix status, B4 decision).
- `docs/_ai/BACKEND_ROUTE_AUDIT_2026-06-16.md` — route/module reconciliation report shape.

## Method (replicate the backend approach)

1. **Inventory pass (route/page level).** Map every FE route (App Router pages under `src/app`) and every
   Admin page/route + RTK/React-Query data hook against what `docs/frontend.md` / `docs/admin.md` claim exists.
   Note added/removed/renamed pages, dead routes, redirect stubs.
2. **Deep pass via sub-agents (parallel).** Spawn agents (Explore / general-purpose) to READ FULL components +
   slices/services, not just route files. The backend used 4 parallel background agents — do the same, split by area:
   - **FE agent 1:** cart + checkout + order flow (helper.js price math, dual-storage cart, COD, recompute trust).
   - **FE agent 2:** PDP / product / variation UI (themed PDP, section registry render, floating images, variant picker).
   - **FE agent 3:** home + sections + SectionRenderer + boutique vs marketplace presets + home_section_array consumption.
   - **FE agent 4:** auth + user dashboard + wishlist + reviews + SEO/pageSeo wiring.
   - **Admin agent 1:** products / variations / page-content editor / image+video upload.
   - **Admin agent 2:** orders / POS create-order / order status transitions / courier send.
   - **Admin agent 3:** settings monolith / Home Layout builder / SEO / demo-data / chat widgets.
   - **Admin agent 4:** marketing (campaign/flash/offer/coupon) + RBAC/permissionData + sidebar gates.
   (Batch into 4 background agents per app, or run FE then Admin — owner's call on parallelism.)
3. **Collect findings** into:
   - `docs/_ai/FRONTEND_DEEP_AUDIT_FINDINGS.md`
   - `docs/_ai/ADMIN_DEEP_AUDIT_FINDINGS.md`
   Mirror the backend findings doc: per-bug ID (F1.., A1..), BLOCKER/HIGH/MEDIUM/NICE, root cause, fix status.
4. **Fix real bugs** on `dev` (app repos). Apply /edge-audit discipline for any auth/RBAC/order/cart/checkout
   or 3+-file / schema-touching fix BEFORE coding. Run /test after.
5. **Update docs** `docs/frontend.md` / `docs/admin.md` with corrected facts. Cross-doc sync per
   [[cross-doc-sync-rule]] (mark items DONE w/ commit hash in NEXT_PHASES/CLONE_NOW_FIXES/etc.).

## Branch / push rules (confirmed s45)

- App repos (Admin/FE) → commit on **`dev`** only. NEVER push app `main` unless owner explicitly says deploy
  (main push = Coolify auto-deploy = production).
- If a repo starts on `main` with working-tree changes: `git stash push -u` → `git checkout dev` →
  (if `dev` is a strict ancestor of `main`: `git merge --ff-only main` to catch dev up) → `git stash pop` → commit → push.
  Verify ff-safety first: `git merge-base --is-ancestor dev main`.
- Docs repo → push to **`main`** (no deploy, no dev branch).
- After pushing app dev, return working tree to `main` + confirm clean (owner opens repos on main).

## Known watch-items to probe (seeds for the audit, not exhaustive)

- FE/BE price mismatches already logged in [[price-flow-reference]] / `docs/_ai/PRICE_FLOW.md` — verify they're real or stale.
- `custom_fields` saved but NOT rendered on PDP (spec-table block gap) — multi-niche debt.
- home_section_array must stay FULL 18 sections; FE renders only enabled (don't "fix" by trimming).
- Chat widgets: field-name `*_show` vs `*_enabled` class of bug (s44 found 2) — sweep for more.
- Themed PDP section enum hardcoded "food" (multi-niche debt) — confirm still present.
