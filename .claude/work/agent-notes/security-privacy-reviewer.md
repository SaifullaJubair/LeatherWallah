# Security & Privacy Reviewer — Agent Notes

## Session log

### 2026-06-19 — s47 audit (commits 5e97db7 / 09fdb86 / d3c6c88)

**Scope:** RBAC warehouse guards, permissionData unlock (Question/Offer/Campaign/Slider), campaign cart enrichment, helper.js campaign base fix.

**All four specific concerns from the brief answered:**

1. Warehouse RBAC (A4.1): FE guards and BE routes now both use `site_setting_update`. Consistent. CLEAN.
2. Newly grantable flags (A4.2/A4.3): question/offer/campaign/slider flags gate their own routes only. No secrets, PII, or payment data exposed. `setting_secrets_update` and `role_create` remain ungrantable. CLEAN — with one pre-existing gap (SHF-1) now exposed.
3. Price integrity (F1.1): `order.recompute.ts` lines 346–362 validates campaign_id from DB, checks active status + product membership + product status before applying discount. Client-supplied price never trusted. SOLID.
4. Campaign enrichment data exposure: explicit `.select()` + manual field reconstruction in `findCartProductServices` exposes only public pricing fields. No buying price, no admin identity. CLEAN.

**Findings:**

- SHF-1 (should-fix): `GET /api/v1/campaign/dashboard/add_campaign_product` has no `verifyToken`. Aggregate `$project` strips only `__v` — leaks `product_buying_price`, `product_alert_quantity`, `product_sku`, `barcode`, `barcode_image` to unauthenticated callers. Fix: add `verifyToken("campaign_create")` + exclude sensitive fields in `$project`. Files: `campaign.routes.ts:37`, `campaign.services.ts:316-328`.

- SHF-2 (should-fix): `DELETE /api/v1/question` has no `verifyToken`. Any caller with a known question ObjectId can hard-delete it. Fix: add `verifyToken("question_update")` to the delete handler. File: `question.routes.ts:19`.

- SHF-3 (should-fix): `findAllDashboardCampaignServices` `.select("-__v")` leaks `campaign_publisher_id` + `campaign_updated_by` to `campaign_show` holders. Fix: add those fields to the select exclusion. File: `campaign.services.ts:207`.

- HRD-1: staleTime 60 s is a UX cap. If campaign expires between refresh and submit, buyer sees lower price than charged. Add `price_changed` flag to recompute output for UX (not a security blocker).

- HRD-2: Flash sale shows regular price in cart, BE charges flash (under-charge, buyer-favorable). Known gap, tracked separately.

**Decisions recorded:**
- `offer_*` flags intentionally gate Flash Sale routes too (documented in permissionData comment).
- `setting_secrets_update` is NOT in permissionData and must stay super-admin only.
- Campaign enrichment uses explicit field reconstruction (not raw DB doc spread) — good pattern to follow for future cart enrichments.

**Pre-existing gaps surfaced (not introduced by s47):**
- SHF-1 and SHF-2 existed before these commits; flagged now because the RBAC surface expansion makes them more relevant.

