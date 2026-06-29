---
description: Resume FruitSnacks work — read handoff memory and report where we are
---

We're resuming work on the FruitSnacks monorepo. Do this, then STOP and wait:

1. Read the auto-memory index `MEMORY.md` and the `current-status-handoff` memory (the ⭐ read-first one).
   **If the global auto-memory is empty/missing (e.g. fresh `git pull` on another PC), read the repo-tracked
   mirror `.claude/MEMORY_MIRROR.md` instead** — it carries the handoff pointer + decision list + the
   authoritative V2 docs to read, and tells you how to rebuild the global memory.
2. **Check for an in-progress feature:** list `.claude/work/`. If a feature folder exists, read its `TODO.md` + `PLAN.md` — that is ACTIVE work mid-flight; its "NEXT SESSION START HERE" note is where to resume. This takes priority over the two tracks below.
3. If no active feature folder, read `docs/_ai/CLONE_NOW_FIXES.md` and `docs/_ai/BACKEND_AUDIT.md` headers to know the two tracks (clone-now vs big-bone).
4. Give me a SHORT Bangla summary: what's DONE, what's the active feature (if any) + its next step, else the two tracks.
5. Ask me whether to continue the active feature (or which track to start). **Do NOT write any code yet** — the owner's rule is plan/discuss before coding.
