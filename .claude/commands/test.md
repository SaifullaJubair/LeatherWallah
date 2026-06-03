---
description: Run a systematic test pass on the current session's changes — static analysis, build verification, integration trace, edge-case scan, and a real-world manual test plan for the owner. Catches bugs and dead references before owner-facing live testing.
---

# /test — Post-implementation test pass

Run this AFTER finishing implementation but BEFORE handing off to owner for live test. Catches the bugs that "I'm done" optimism misses.

## When to run

**Owner triggers manually:** `/test` at any time after I finish a feature/fix.

**Claude triggers proactively (without owner asking) when:**
- Feature touches 3+ files
- Schema change in any app
- Cross-app changes (Backend + Admin + Frontend together)
- New URL routes / modified existing routes
- File storage / S3 / external integration changes
- Auth, RBAC, permission flag changes
- Order, payment, cart, checkout flow changes
- Migration script written

**Skip when:**
- Single-file bug fix
- Pure UI tweak (no logic change)
- Doc-only update
- < ~50 LOC change

## What the test pass does

I (Claude) run through a SIX-tier framework against the current diff + the relevant codebase.

### Tier 1 — Build / compile verification (must pass)

1. **Backend tsc compile** — `node node_modules/typescript/bin/tsc --noEmit` from backend folder. EXIT 0 required.
2. **Admin Vite build** — `npm run build` from admin folder. EXIT 0 required.
3. **Frontend Next compile** — `npm run build` from frontend folder. "Compiled successfully" required (prerender errors that depend on a live backend are OK and noted).

Any build failure = STOP everything else. Fix first.

### Tier 2 — Stale-reference scan

4. **Renamed files / classes / components** — grep for the OLD name across all 3 apps. Should return 0 active-code matches.
5. **Removed exports / fields** — grep for fields/flags I deleted. Should be 0 in active code (comments OK if updated).
6. **Removed imports** — grep for the import that no longer exists. Should be 0.

### Tier 3 — Orphan scan

7. **Added but unused fields** — every schema field added this session should be USED somewhere (model + interface + at least one controller path).
8. **Added but unused settings** — every settings field added should be read by some logic.
9. **Added but unused exports** — exported helpers/functions should have at least one importer.

### Tier 4 — Integration trace

For each end-to-end flow this feature touches, walk the chain:

10. **Schema → Controller → Route → Frontend consumer** — does the field/value reach the consumer correctly? Naming consistent across 3 apps?
11. **API contract match** — frontend `fetch()`/RTK Query call shape matches backend route + response shape?
12. **Permission flag wiring** — new endpoint has `verifyToken("flag")`? Flag exists in `role.model` + `role.interface` + `permissionData.js` + sidebar + page?
13. **FormData shape match** — frontend appends `key`, backend reads `req.body.key` with same spelling? (Including array bracket conventions.)

### Tier 5 — Edge case + null-guard scan

14. **Null/undefined guards on new fields** — backend `existingDoc.newField` accesses guarded? Frontend `data.newField` accesses optional-chained?
15. **Migration safety** — existing docs without the new field still work? Sparse vs non-sparse index behavior correct?
16. **Failure paths** — S3 down, DB slow, external API timeout — does the code degrade gracefully (try/catch, fallback) or crash?
17. **Race conditions** — concurrent admin edit on same doc, double-submit, auto-gen collision under load.

### Tier 6 — Real-world scenario mental simulation

Simulate actual humans hitting this. List edge cases like a tester would:

**Customer perspective:**
- Stale link / QR / email 6 months later
- Page open while product gets edited/deleted server-side
- Slow 3G / packet loss / offline-then-online
- Double-click / rapid taps
- Bangla data, emoji, RTL text
- Logged in vs guest parity

**Admin / Owner perspective:**
- Huge file upload, wrong MIME, corrupted file
- Very long text, only spaces, special chars, Bangla in English field
- Bulk action on 100 items
- Session expires mid-form-fill — lost work?
- Two admins concurrent edit
- Limited-permission admin — UI shows buttons they can't use?
- Owner pivots / rebrands / migrates data

**Warehouse / operations / support:**
- Damaged barcode label, broken scanner
- Identify exact item in old order from snapshot
- Audit trail of changes available?

**Resale / SaaS perspective:**
- Hardcoded URL / brand / domain leaks?
- Owner-configurable or rigid?

## Output format

```markdown
# Test Report — <feature name>

## ✅ PASS (tier-by-tier)
- Tier 1: tsc EXIT 0 / Vite EXIT 0 / Next compiled
- Tier 2: 0 stale refs to <old name>
- ... etc

## ⚠️ FIXED INLINE
1. [bug description] — Fix applied: [what I did]
2. ...

## ❌ BLOCKERS (need owner decision)
1. [issue] — Why blocked: [reason] — Suggested resolution: [options]
2. ...

## 🔍 STATIC-VERIFIED ONLY (need owner browser test)
Why: Real browser, real DB, real S3, real phone scanner can't be auto-tested by me.

1. [scenario] — How to test: [exact steps]
2. ...

## 🧪 OWNER MANUAL TEST PLAN (priority order)

### Priority 1 — Smoke (5 min)
1. ...

### Priority 2 — Critical paths (10 min)
1. ...

### Priority 3 — Edge cases (15 min)
1. ...
```

## Escalation rule

If `/test` finds **3+ BLOCKERS** OR the diff spans **3+ apps with schema changes**, automatically spawn the `feature-tester` sub-agent for a fresh-context deep pass before declaring "done."

## Rules

- **Fix what I can, flag what I can't.** Small inline-fixable bugs (stale comments, dead imports, missing optional-chain) — I fix immediately and report. Bigger issues (architectural, needs owner call) — I flag as BLOCKER, don't silently fix.
- **Don't claim PASS without evidence.** Every PASS line should be backed by a grep/build/trace I actually ran. No "looks fine to me" claims.
- **Be specific in owner test plan.** "Test the QR" is useless. "Visit `localhost:3000/q/<short_code_from_DB>` → should 301-redirect to `/products/<slug>`" is useful.
- **Don't pad.** If a tier has no relevant items, skip it explicitly. Don't invent issues for ceremony.
- **Sit on hands until trigger fires.** Don't run /test unprompted on tiny fixes — it's for completed features, not every 2-line edit.
