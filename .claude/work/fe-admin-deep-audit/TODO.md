# FE + Admin Deep-Dive Audit — TODO / progress

**Started:** 2026-06-17 (session 46)
**Owner directive this session:** "age admin koro" → do ADMIN first, FE after.

## NEXT SESSION START HERE
- ADMIN audit in progress. 4 parallel sub-agents launched (products/variations · orders/POS · settings/home-layout · marketing/RBAC).
- Findings land in `docs/_ai/ADMIN_DEEP_AUDIT_FINDINGS.md`.
- After agents return: triage BLOCKER/HIGH → fix real bugs on `dev` (edge-audit + /test discipline) → update `docs/admin.md` → docs to `main`.
- THEN: FE audit (4 agents) → `docs/_ai/FRONTEND_DEEP_AUDIT_FINDINGS.md`.

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
