---
description: Before a heavy chat ends, refresh the FruitSnacks handoff (memory + roadmap docs) so the next chat can /resume cleanly.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---

Refresh the FruitSnacks handoff so a fresh chat resumes accurately. Run when a chat is
getting long/heavy, before switching.

1. Review what changed this session: `git -C . log --oneline -15`, `git -C . status`, and what
   we actually did in this conversation.
2. Update the **handoff memory** `current-status-handoff.md` (the file `/resume` reads):
   - Session date + one-line "what happened."
   - Current state / what's now shipped (with commit hashes + which app: BE/Admin/FE).
   - The precise NEXT action for the following chat.
   - Any new blockers / owner decisions needed.
3. **Cross-doc sync (owner's mandatory rule):** for anything shipped this session, mark it DONE
   (with commit hash) in the matching roadmap doc — `docs/_ai/NEXT_PHASES.md`,
   `CLONE_NOW_FIXES.md`, `BACKEND_AUDIT.md`, the deep-audit findings — and update
   `.claude/work/OWNER_TEST_STATUS.md` rows. Don't leave a feature "done" in one place and
   "pending" in another.
4. Leave settled decisions intact unless something genuinely changed.
5. **Update the repo-tracked memory mirror** `.claude/MEMORY_MIRROR.md` — refresh its "Current handoff
   pointer" (new session # + one-line TL;DR), and add a line if a NEW project-critical memory or work-style
   rule was created this session. This mirror is what makes the handoff survive a `git pull` on another PC
   (the global auto-memory folder is outside the repo). Don't move the global `memory/` folder — just keep
   the mirror current.

Confirm what you updated and summarize it. Keep the handoff TRUE — the next chat trusts it first.
