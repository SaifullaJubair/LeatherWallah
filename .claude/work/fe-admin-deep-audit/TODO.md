# FE + Admin Deep-Dive Audit — TODO / progress

**Started:** 2026-06-17 (session 46)
**Owner directive this session:** "age admin koro" → do ADMIN first, FE after.

## STATUS: BOTH AUDITS DONE (doc-only). Code-bug tickets await owner triage.
- ✅ ADMIN audit done → `docs/_ai/ADMIN_DEEP_AUDIT_FINDINGS.md` + admin.md reconciled + Known-Issues table. Committed main b8870a4.
- ✅ FE audit done → `docs/_ai/FRONTEND_DEEP_AUDIT_FINDINGS.md` + frontend.md reconciled + Known-Issues table + MULTI_NICHE_PLAN custom_fields marked DONE.
- Owner chose DOC-ONLY both passes — NO code fixed. Bugs are tickets.

## NEXT SESSION START HERE — code-bug triage (if owner wants fixes)
Top tickets to verify-then-fix on `dev` (app repos), highest-impact first:
- **FE F1.1 (BLOCKER)** — cart doesn't attach flash/campaign → shown≠charged price + campaign lost. BE+FE (enrich findCartProductServices). edge-audit (cart/checkout/price).
- **FE F4.1/F3.1 (BLOCKER)** — home ReviewsCarousel auto_featured hits 400 endpoint → never renders. Needs a public featured-reviews endpoint (BE) + field-name fix F4.2 (FE).
- **Admin A2.2/A2.3 (BLOCKER)** — order status dropdown dead code → no reachable status-advance UI + no BE transition validation. OWNER DECISION: wire dropdown vs courier-only.
- **Admin A4.1** — warehouse FE guard ghost-flag (verify post-B1, likely 1-line).
- **Admin A4.2/A4.3** — uncomment permissionData blocks.
- **FE F3.4 / F3.3 / F1.3 / Admin A1.1 / A2.1** — HIGH batch.
Branch: app repos → `dev` only. Docs → main.

## Method (from PLAN.md — backend pass template)
1. ✅ Inventory pass — Admin routes (Route.jsx, 39 routes) + page inventory mapped vs docs/admin.md (561 lines).
2. ⏳ Deep pass via 4 parallel sub-agents reading FULL components + hooks + data slices.
3. Collect → docs/_ai/ADMIN_DEEP_AUDIT_FINDINGS.md (mirror BACKEND_DEEP_AUDIT_FINDINGS.md shape: per-bug ID A1.., BLOCKER/HIGH/MEDIUM, root cause, fix status).
4. Fix real bugs on `dev`. Update docs/admin.md. Docs → main.

## Agent slice split (Admin)
- **Admin agent 1:** products / variations / page-content editor / image+video upload / attributes / categories / brand.
- **Admin agent 2:** orders / POS create-order / order status transitions / courier send (Pathao/Steadfast) / fraud / abandoned cart.
- **Admin agent 3:** settings monolith / Home Layout builder / SEO (pageSeo) / demo-data / chat widgets / theme manager / trust points / site-faq / newsletter.
- **Admin agent 4:** marketing (campaign/flash/offer/coupon) + RBAC (permissionData + StaffRole) + sidebar gates + auth/login flow + customers/loyalty/wallet/wishlist/low-stock viewers.

## Branch rules
- Admin repo → commit on `dev` ONLY. Never push app `main` unless owner says deploy.
- Docs → `main`.

## Status log
- 2026-06-17: inventory pass done; 4 admin agents launched.
- 2026-06-18: ALL 4 admin agents complete. Findings in docs/_ai/ADMIN_DEEP_AUDIT_FINDINGS.md.
  Top: A2.2/A2.3 order-status dropdown is dead code (no reachable UI to advance status) = biggest finding.
  A4.1 warehouse FE guard stale (verify post-B1). A4.2/A4.3 permissionData commented blocks → marketing/question ungrantable to custom roles. A1.1 simple-draft blocked by required buying price. A2.1 /pathao-order broken.
  NEXT: owner triage → which to fix on dev. Then FE audit (4 agents).
- 2026-06-18: ADMIN audit committed doc-only → main b8870a4. Now starting FE audit.
  FE inventory: 40 App Router pages, RTK Query (src/redux/api/baseApi.js + feature slices auth/banner/campaign/cart),
  price math src/utils/helper.js, theme src/lib/theme/{mergeTheme,mergeFloating,formatWeight,whatsappLink}.js.
  4 FE agents launched (cart/checkout/order · PDP/product/variation · home/sections · auth/dashboard/SEO).
  Findings → docs/_ai/FRONTEND_DEEP_AUDIT_FINDINGS.md.
- 2026-06-18 (SESSION 46 END): FE audit done. frontend.md reconciled + Known-Issues table + MULTI_NICHE_PLAN custom_fields=DONE. Committed main 0831d06.
  Cross-doc sync done: NEXT_PHASES.md (audit-ticket section + item#5 /products-original fix), MEMORY.md, current-status-handoff, deep-audit-series (new memory), pending-doc-update memory.
  BOTH audits complete, doc-only. SESSION HANDED OFF. Next = code-bug triage (4 BLOCKERs above), app repos → dev only.
