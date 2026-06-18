---
description: Report FruitSnacks progress against the roadmap docs (NEXT_PHASES / CLONE_NOW_FIXES / deep-audit) + open owner-test items.
allowed-tools: Read, Grep, Glob, Bash
---

Report where FruitSnacks stands.

1. Read the roadmap/handoff sources: `docs/_ai/NEXT_PHASES.md`, `CLONE_NOW_FIXES.md`,
   `BACKEND_AUDIT.md`, the deep-audit findings (`*_DEEP_AUDIT_FINDINGS.md`),
   `.claude/work/OWNER_TEST_STATUS.md`, and the `current-status-handoff` memory.
2. Inspect the repo (`git -C . log --oneline -15`, `git -C . status`, app structure) to infer
   what's actually shipped vs planned — don't trust docs blindly.
3. Output a tight status:
   - **Active track(s):** admin redesign · frontend 2.0 · backend hardening — and % feel for each.
   - **Done recently** (with area + commit).
   - **In progress / next** immediate tasks.
   - **Open deep-audit BLOCKERs** still unaddressed (by id: FE F1.1, Admin A2.2, etc.).
   - **Owner-test pending** rows from OWNER_TEST_STATUS.
   - **Blockers needing an owner decision**, if any.

Be honest — infer from code + git, not optimism. Keep it scannable.
