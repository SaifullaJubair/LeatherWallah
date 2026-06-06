# Client Sprint 2 TODO

**Sprint doc (source of truth):** [docs/_ai/CLIENT_SPRINT_2.md](../../../docs/_ai/CLIENT_SPRINT_2.md)
**Approach:** Quick wins → schema-ready → backend hardening → admin daily-use
**Branch:** All on `v2`. No remote push without explicit owner deploy command.

## Pre-code — Edge audits ✅ ALL DONE

- [x] Wave 1: plan-edge-auditor on **D15** + **H** + **H1** (parallel) — 2026-06-05
- [x] Wave 2: plan-edge-auditor on **C12** + **C13** + **11β** + **D18** + **E20** (parallel) — 2026-06-05
- [x] **49 findings absorbed** (13 BLOCKERS + 19 HIGH + 17 MEDIUM) into CLIENT_SPRINT_2.md
- [x] **7 D-locks resolved** (D6-D12) — see sprint doc owner decisions table

## Bucket 0 — Pre-sprint bug fixes ✅ SHIPPED 2026-06-05
- [x] BUG-1/2/3 + Item 8/10/11α back-fixes (commits `00de5da`, `0bcf174`, BE Item 8/10/11α)

## Bucket 1 — Quick wins
- [x] **C12** SMS settings runtime read ✅ SHIPPED 2026-06-05 session 25 — 2 BLOCKERS + 3 HIGH all in. Side-effect: C13 BLOCKER 1 ($set fix in updateSettingServices) also landed here.
- [ ] **Item 5** `/products-original` regression verify (owner test, document only)

## Bucket 2 — Cross-app feature
- [x] **D15** Wishlist fix + complete ✅ SHIPPED 2026-06-05 session 25 — 3 BLOCKERS fixed (WishlistLoader + add/remove BE wire). BE module untouched (already correct).

## Bucket 3 — Schema-ready
- [x] **11β** Coupon BOGO wire-up ✅ SHIPPED 2026-06-05 session 25 — 3 BLOCKERS + 4 HIGH + 2 MEDIUM (M3 + N1) all in. BE + Admin + FE builds green.

## Bucket 4 — Backend hardening
- [x] **H** Auth hardening ✅ SHIPPED 2026-06-05 session 25 — Admin FE ForgotPassword page + 3 BE bug fixes (SMS-vs-DB-save reorder + 3 modifiedCount guards). BE + Admin builds green.
- [ ] **C13** 12 shop toggles — includes 2 BLOCKERS remaining (review enum "pending", controller strip+override) + 4 HIGH (server-side hide-OOS, maintain_stock skip-both, min_order_amount server-first, Pending Reviews moderation UI). ⚠ Old BLOCKER 1 ($set fix) already shipped in C12 session 25.

## Bucket 5 — Admin daily-use
- [ ] **E20** Dashboard widgets — includes 2 BLOCKERS (dashboard_show 4-point sync auth, compound index) + 4 HIGH (per-period top-selling aggregation, exclude cancel/return revenue, delete dummy arrays, BST timezone)
- [ ] **D18** Admin Create Order POS — includes 3 BLOCKERS (order_create_admin 4-point sync, skip userUpdate address overwrite, Pathao zone optional) + 4 HIGH (skip CAPI, skip SMS, manual_discount field, maintain_stock interaction)

## Per-item cross-doc sync (per [[cross-doc-sync-rule]])
- [ ] Add test scenarios to `.claude/work/OWNER_TEST_STATUS.md` after each item
- [ ] Mark item ✅ + commit hash in CLIENT_SPRINT_2.md
- [ ] Update related memories
- [ ] Commit on `v2`

## Sprint close
- [ ] All builds green (BE tsc, Admin vite, FE next)
- [ ] OWNER_TEST_STATUS Summary table updated
- [ ] current-status-handoff updated
- [ ] Backlog docs (NEXT_PHASES / CLONE_NOW_FIXES / BACKEND_AUDIT / CLIENT_SPRINT_2) marked DONE
- [ ] Owner runs P1 smoke + P2 (new items) + P4 (regression) tests
- [ ] Owner says "deploy" → batch merge v2→main per repo (Coolify auto-deploys)
- [ ] Post-deploy: permission flag ticks (`dashboard_show`, `order_create_admin`) + analytics token paste + migration scripts (orders index)

## NEXT — Resume here

**On RESUME: start coding C13 Shop toggles** — owner-locked Sprint 2 execution order: ~~C12~~ → ~~Item 5~~ → ~~D15~~ → ~~11β~~ → ~~H~~ → **C13 ← next code** → E20 → D18.

C13: 12 shop toggles (Tier A+B per D5 lock) + 2 BLOCKERS remaining (review enum "pending", controller strip+override) + 4 HIGH (server-side hide-OOS, maintain_stock skip-both, min_order_amount server-first, Pending Reviews moderation UI). ⚠ Old BLOCKER 1 ($set fix in updateSettingServices) already shipped in C12. ~8-10h. Full contract in CLIENT_SPRINT_2.md C13 section.

First step on resume: check OWNER_TEST_STATUS.md for any C12 / D15 / 11β / H P2 failures from owner's in-between testing — those take priority over C13.
