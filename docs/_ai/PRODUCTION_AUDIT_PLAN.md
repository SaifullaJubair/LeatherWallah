# Production Audit Plan — Master

**Created:** 2026-06-03 (Session 18)
**Goal:** Take FruitSnacks from "shipped clone-per-client" to "production-grade resellable e-commerce backbone" through systematic security + completeness audit before any redesign work.

**Owner's vision (verbatim):**
> "amar ai common ecommerce market a on of the best solution"
> "backend taake mojbut and solid kore all kind of checkup kore edge case securety and db call everithing shob check kore then admin then frontend"
> "pdp er kono detials tumi hard backend theke pathaye disso kono reference na rekhe admin product upload korlo but pdp te data ager tai show hosse... arokom kono kaj kora jabena proper dynamic and best vabe korte hobe"

---

## Why a separate audit doc (vs BACKEND_AUDIT.md)

[BACKEND_AUDIT.md](BACKEND_AUDIT.md) covered **architecture / feature gaps** — variation engine, price-resolver, filter, wishlist. Phases A–E delivered all of that ([MASTER_BACKEND_ROADMAP.md](MASTER_BACKEND_ROADMAP.md)).

This doc covers a different axis: **production hardening** — security, robustness, observability, dynamic-vs-hardcoded discipline. Even if every feature works, a security hole or a hardcoded brand string breaks the resale promise.

---

## Three stages (sequential, no overlap)

### Stage 1 — Backend hardening (current focus)
**Goal:** Backend becomes the trusted source of truth. Every endpoint authn'd correctly, every input validated, every secret out of code, every dynamic value DB-driven.

Sub-stages:
- **1.5a — Security audit** (this is where we start)
  - Auth + RBAC verification
  - Input validation + injection surface
  - Secret management
  - Rate limiting + brute-force guards
  - Error handling + info leak
  - File upload safety
  - CORS + CSRF posture
  - Webhook signature verification
  - Dependency scan
- **1.5b — Dynamic-vs-hardcoded audit**
  - Every storefront-visible string traced back to DB/admin (no hardcoded brand/product copy)
  - All settings fields read by SOMETHING (no orphan fields)
  - Site settings, page SEO, theme overrides all flow correctly
- **1.5c — Data integrity audit**
  - Every write path uses transactions where multi-doc
  - Stock guard + restock paths verified (Phase B already did this — re-verify)
  - Order total integrity (Phase B done — re-verify)
  - Soft delete vs hard delete consistency
- **1.5d — Observability + ops**
  - Structured logging (replace console.log)
  - Error capture (Sentry-style)
  - Health checks + DB connection retry
  - Graceful shutdown
- **1.5e — Performance**
  - Index audit per collection
  - N+1 query scan
  - `.lean()` discipline
  - Aggregation cost estimation
- **1.5f — Migration safety**
  - All schema changes have idempotent migration scripts (or are documented as additive)
  - Backfill scripts in `src/scripts/` versioned

### Stage 2 — Admin completeness
After backend is hardened, every admin screen exercised end-to-end:
- Every settings field actually writable + read by backend
- Every permission flag actually gates a button
- Every UX edge tested (empty state, bulk action, large list, errors)
- Mobile-friendly admin
- (Bigger Admin V2 redesign planned in [ADMIN_PANEL_V2_PLAN.md](ADMIN_PANEL_V2_PLAN.md))

### Stage 3 — Frontend completeness + redesign
After admin is solid:
- Every storefront UI surface verified driven by admin/DB (no hardcoded copy)
- Then [FRONTEND_V2_PLAN.md](FRONTEND_V2_PLAN.md) redesign

---

## Per-finding workflow

Every issue found in 1.5a → 1.5f:
1. Open `docs/_ai/audit/findings/F<NNN>-<slug>.md` (NNN = 001, 002...)
2. Fill in: title, severity, location, impact, repro, fix proposal, status
3. Add row to `docs/_ai/audit/BACKEND_SECURITY_AUDIT.md` index table
4. Fix on BE `v2` branch (NOT main); commit message references `F<NNN>`
5. Update finding card: status pending → fixed → verified
6. **Push to origin/v2 after every fix** (per [[git-infra-and-branch-rules]] — owner control over main deploys)

## Severity scale
- 🔴 **P0 / blocker** — exploitable now, data corruption, full-auth bypass
- 🟠 **P1 / high** — credentials exposed, info leak, partial auth bypass, brute-force surface
- 🟡 **P2 / medium** — defensive gap, hardening best-practice, missing rate limit on lower-risk endpoint
- 🟢 **P3 / nice** — code quality, documentation, audit log additions

## When to merge v2 → main
- After Stage 1.5a complete + tests pass → ASK owner "deploy security batch to main?"
- After each sub-stage similarly
- NEVER auto-deploy. Coolify triggers on main push; owner-explicit only.

---

## Active session pointer
**Current:** Stage 1.5a — Backend Security Audit
**Working files:** `.claude/work/production-audit/` (PLAN, TODO, FINDINGS scratch)
**Doc:** [audit/BACKEND_SECURITY_AUDIT.md](audit/BACKEND_SECURITY_AUDIT.md)

## Related docs
- [BACKEND_AUDIT.md](BACKEND_AUDIT.md) — original architecture audit (Phases A–E shipped)
- [MASTER_BACKEND_ROADMAP.md](MASTER_BACKEND_ROADMAP.md) — what's done at feature level
- [ADMIN_PANEL_V2_PLAN.md](ADMIN_PANEL_V2_PLAN.md) — Stage 2 redesign plan
- [FRONTEND_V2_PLAN.md](FRONTEND_V2_PLAN.md) — Stage 3 redesign plan
- [SAAS_FUTURE_PLAN.md](SAAS_FUTURE_PLAN.md) — long-term multi-tenant direction
