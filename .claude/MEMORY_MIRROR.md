# Memory Mirror — repo-tracked snapshot of Claude's auto-memory

> **Why this file exists:** Claude's auto-memory lives in a GLOBAL user folder
> (`C:\Users\<you>\.claude\projects\c--Coding-Perosnal-FruitSnacks\memory\`) which is OUTSIDE this git
> repo — so a fresh `git clone`/`pull` on another PC would NOT have it, and the handoff/rules/decisions
> would be lost. This mirror keeps the project-critical memory INSIDE the repo so it travels with a pull.
>
> **Source-of-truth rule (avoid drift):**
> - **Plan/work docs** (`.claude/work/**`, `docs/_ai/**`) — already repo-tracked = source of truth. Not duplicated here.
> - **Handoff** — source of truth = the global `current-status-handoff` memory; this file carries a POINTER
>   + the latest TL;DR heading so a new machine knows where we are and can rebuild the global copy.
> - **Personal work-style rules** — stay GLOBAL (they apply to every project, not just FruitSnacks). Listed
>   here by name only so a new machine knows they exist and can recreate them.
>
> **On a fresh machine:** run `/resume`. Claude reads this mirror + `.claude/work/v2-scaffold/*` and
> rebuilds the global auto-memory from it. Do NOT move the global `memory/` folder into the repo — that
> breaks Claude's auto-recall (it looks for that fixed global path).

---

## How to regenerate the global memory on a new PC
1. `git pull` this repo.
2. Open Claude Code in the repo, run `/resume`.
3. Claude reads this mirror → recreates the key memories in the global folder (handoff, architecture
   decisions). The full plan/decision content already lives in `.claude/work/` + `docs/_ai/` (repo-tracked).

---

## Current handoff pointer
- **Latest:** session 57 (2026-06-29) — V2 data-layer + API-contract foundation LOCKED; scaffold is the next action.
- **Full handoff:** global memory `current-status-handoff` (top TL;DR block). Mirror of the session-57 summary
  also captured at the bottom of this file.
- **Authoritative V2 docs (repo-tracked, READ FIRST next session):**
  - `.claude/work/v2-scaffold/PLAN.md` — scaffold steps (Phase 0a–0e) + locked decisions.
  - `.claude/work/v2-scaffold/DATA_LAYER_AND_STRUCTURE.md` — the data-layer/table/ordering/§9-contract bible.
  - `docs/_ai/PLATFORM_ARCHITECTURE.md` (master) + V2_ADMIN/FRONTEND_FEATURE_CHECKLIST.md.

---

## Project-specific memories (mirror — these matter for THIS repo)
> Content lives in the global memory files of the same name; summarized here so a pull carries the gist.

- **current-status-handoff** ⭐ — read-first; where we are. (s57: V2 foundation locked, scaffold next.)
- **platform-architecture-plan** — the agreed multi-niche/SaaS architecture; full in `docs/_ai/PLATFORM_ARCHITECTURE.md`.
- **v2-branch-and-staging-model** — 4-branch model (main/dev/v2-dev/staging), 2-repo, test DB `test-ecommerce-core`.
- **git-infra-and-branch-rules** — 4 repos (3 deploying + 1 docs); work on branch, merge to main only on "deploy".
- **price-flow-reference** — all price layers; full in `docs/_ai/PRICE_FLOW.md`.
- **fruitsnacks-local-dev-setup** — DB URI (`test` db), per-app API base URLs, admin login.
- **coolify-vps-access** / **vps-deploy-inventory** / **deploy-build-gotchas** — deploy/VPS facts.
- **variation-attribute-filter-shipped** / **variation-overhaul-session-12** — the shipped variation engine.
- (+ the many feature-backlog + audit memories — see the global `MEMORY.md` index for the full list.)

## Personal work-style rules (stay GLOBAL — listed by name only; recreate on a new PC if missing)
- **answer-as-honest-senior-dev** — give REAL senior-dev answers, push back when owner is wrong, never agree to please.
- **reply-in-bangla** — chat replies in Bangla by default (code/paths/IDs literal).
- **discuss-in-chat-not-select-fields** — plan/scope questions in plain chat with numbered options.
- **build-it-right-breakage-ok** — pre-launch resale code: do features fully; temp breakage fine.
- **claude-runs-scripts** — Claude runs terminal commands, never asks owner to.
- **user-prefers-no-permission-prompts** — routine Bash/PowerShell without asking.
- **dont-break-old-tests** — fixing a new bug must not silently break paths older tests rely on.
- **cross-doc-sync-rule** — before "done", grep roadmap docs + memories and mark items DONE with commit hash.
- **feature-work-scratch-folder** — new feature → temp `.claude/work/<feature>/` for plan+todo+test notes.

---

## SYNC RULE (keep this mirror from going stale)
When the global `current-status-handoff` is refreshed (e.g. via `/handoff` at session end), update the
**Current handoff pointer** section above with the new session number + one-line TL;DR. Everything else here
changes rarely (only when a new project-critical memory or work-style rule is added). The `/handoff` command
should touch this file too.
