---
description: Audit the current plan/feature design for edge cases, real-world user scenarios, and integration bugs BEFORE coding starts. Catches what the happy-path mindset misses.
---

# /edge-audit — Edge case + real-world scenario validator

Run this AFTER finalizing a plan/design but BEFORE writing any code. Saves rework cycles by catching bugs at the planning stage instead of after implementation.

## When to run

**Owner triggers manually:** `/edge-audit` after I (Claude) propose a plan.

**Claude triggers proactively (without owner asking) when:**
- Plan touches 3+ files
- Plan touches schema (`*.model.ts` or `*.interface.ts`)
- Plan crosses app boundaries (Backend + Admin + Frontend all touched)
- Plan introduces new URL routes or modifies existing ones
- Plan changes file storage / S3 / external integration
- Plan modifies auth, RBAC, or permission flags
- Plan affects order placement / payment / cart flow

**Skip when:**
- Single-file bug fix
- Pure UI tweak (no logic change)
- Doc-only update
- Less than ~50 LOC change

## What the audit does

I (Claude) re-read the current plan and run it through TWO checklists:

### Checklist A — Code / Technical edge cases (15 points)

1. **ROUTE / URL** — New URLs generated/referenced. Does the route actually exist in the consumer? (Frontend route for backend-built URL, vice versa.)
2. **SCHEMA INTEGRATION** — New fields conflict with existing `populate()`, `.select()`, indexes, or searchable arrays?
3. **EXISTING FLOW INTERACTION** — Cart, order, search, filter, courier, analytics — any ripple effect?
4. **RENAME LIFECYCLE** — Product / category / admin / slug rename → orphan references? Foreign-key style references stale?
5. **DELETE LIFECYCLE** — Soft vs hard delete; cascade scope; orphan S3 keys; order history snapshots intact?
6. **DOMAIN / ENV CHANGE** — Hardcoded URLs that break when env changes? Print-time hardcoded data (QR, barcode labels)?
7. **RACE CONDITION** — Two admins editing same doc; double order placement; double form submit; auto-gen collision under concurrency.
8. **AUTH / RBAC** — New endpoint has correct `verifyToken("flag")`? Flag exists in role.model + permissionData.js?
9. **BACK-COMPAT** — Existing docs without the new field still work? Old data shape rendered without crash?
10. **MIGRATION** — Default values applied to existing docs? Sparse vs non-sparse index behavior on legacy data?
11. **EXTERNAL FAILURE** — S3 down, DB slow, payment gateway 500, courier API timeout — what does the user see? Does the order/save get stuck in inconsistent state?
12. **UPLOAD CONSTRAINT** — File size limit, MIME validation, multer limits, S3 ACL, content-type detection — does the new flow respect these?
13. **FRONTEND-BACKEND CONTRACT** — Response shape matches what frontend reads? Naming convention consistent across 3 apps?
14. **LOG / OBSERVABILITY** — Failure cases logged enough to debug in production?
15. **TEST SCENARIOS** — Can owner manually test golden path + 3 specific edge paths? Are they listed?

### Checklist B — Real-world user / admin / business scenarios

Imagine the actual humans using this in production. List edge cases like a QA tester would:

**User (storefront customer) perspective:**
- What if user opens the same QR/link 6 months later? (Slug rename, product deletion, status change)
- What if user has the page open and product gets edited/deleted server-side?
- What if user lands from an old QR / old email / old social share?
- What if user uses unusual phone (old Android, iPhone privacy modes, ad-blocker, third-party browser)?
- What if user is logged in vs guest — does feature work in both?
- What if user is on slow 3G / packet loss / offline-then-online?
- What if user clicks button twice rapidly?
- What if user changes language / locale / timezone?
- What if user enters Bangla data in English-only field, emoji, RTL text?

**Admin / Owner perspective:**
- What if admin types in Bangla, very long string, special chars, only spaces?
- What if admin uploads HUGE file, wrong file type, corrupted file?
- What if admin reuses same value across products by mistake?
- What if admin deletes a category that has 100 products? Theme used by 50?
- What if admin's session expires mid-form-fill? (Lost work?)
- What if admin clones a product? Duplicates? Imports CSV with bad data?
- What if 2 admins edit same product concurrently?
- What if admin reverts a change after save? (Undo possible?)
- What if admin has limited permission — does the UI still show buttons they can't use?
- What if admin is staff / outsourced — what mistakes can they make?

**Warehouse / Operations perspective (if applicable):**
- What if barcode label gets damaged / partially printed?
- What if scanner is broken — manual fallback path?
- What if stocktake is happening while orders flow in?
- What if multiple warehouses share product catalog?

**Customer support perspective:**
- Can support identify the exact product/variation in an order from snapshot?
- What if customer claims wrong item received?
- Can support refund / cancel / split / merge orders?
- Is product history (price changes, name changes) auditable?

**Business / Owner-of-shop perspective:**
- What if owner pivots business (mango shop → panjabi shop)?
- What if owner sells the shop (data migration to new owner)?
- What if owner expands to 2 shops (multi-tenant)?
- What if owner has agency / VA staff making bulk edits?
- What if owner wants Year-end audit / tax report — is data sufficient?
- What if Facebook / TikTok / Daraz scraper crawls the data?
- What if owner runs a discount flash sale during peak hours — does pricing logic survive?

**Resale / SaaS perspective (this codebase is sold to multiple clients):**
- Does this feature need owner-configurable settings, or is it hardcoded?
- Will buyer A's data look right with buyer B's branding?
- Is the URL / domain / brand name hardcoded anywhere?

## Output format

After running both checklists, I produce:

```
## 🚨 BLOCKERS (must fix before code)
1. [Specific issue] — Impact: ... — Fix: ...

## ⚠️ HIGH (likely bugs in production)
1. ...

## 🟡 MEDIUM (rare but real)
1. ...

## 💡 NICE-TO-HAVE (deferred OK)
1. ...

## ✅ Already handled in current plan
- ...

## 📝 Plan modifications I'm adding
1. ...
```

Then owner approves the modified plan, THEN coding starts.

## Escalation rule

If audit finds **3+ BLOCKERS** OR plan touches **schema across 2+ apps**, automatically spawn the `plan-edge-auditor` sub-agent for a deeper fresh-perspective pass before continuing.

## Don't audit fluff

This is for catching real bugs, not for ceremony. If a checklist item genuinely doesn't apply, skip it explicitly:
> "Item 7 (race condition): N/A — single-admin shop, no concurrency expected"

Don't pad the output with empty bullets.
