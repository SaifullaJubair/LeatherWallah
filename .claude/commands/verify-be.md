---
description: Verify backend changes — TypeScript compile check + optional live endpoint hit
argument-hint: "[endpoint path to curl, e.g. /product]  (optional)"
---

Verify the current backend changes. Steps:

1. **Type-check** — from `FruitSnacksBackend`, run `npx tsc --noEmit`. Report any errors with file:line. This is the project's only real safety net (no test runner configured).
2. **Live check (only if an endpoint was given in $1)** — assume the backend dev server is running on http://localhost:5000. `curl -s` the endpoint `$1` and show the JSON shape (status + first part of body). If the server isn't running, say so and offer to start it via /fs-dev rather than failing silently.
3. Report PASS/FAIL plainly. If tsc fails, do NOT claim the change works — show the errors.

Reminder: report results faithfully — if tsc errors, say so with the output; don't hedge a green result.
