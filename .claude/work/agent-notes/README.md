# Agent notes (shared "memory")

Each subagent reads its own note file here at the start of a run and appends a short,
dated entry at the end. This keeps agents consistent across sessions and lets the
**orchestrator** build a unified briefing.

Files (created by the agents as they run):
- `code-reviewer.md` — recurring issues / patterns to watch.
- `security-privacy-reviewer.md` — recurring security gaps + decisions.
- `doc-generator.md` — doc conventions + what's been documented.
- `architecture-reviewer.md` — architectural decisions + observed patterns.
- `test-writer.md` — build-verification + test conventions/fixtures.

Keep entries short and factual (dated bullets). This folder is working state, not
deliverable docs — real documentation lives in `docs/` (and AI notes in `docs/_ai/`).
