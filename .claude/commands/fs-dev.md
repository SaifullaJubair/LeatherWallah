---
description: Start all 3 FruitSnacks dev servers via the root `npm run dev` (concurrently)
---

Run `npm run dev` from the project root (`c:\Coding\Perosnal\FruitSnacks\`). That root script uses **concurrently** to launch all three apps with colored prefixes `[BE]` `[AD]` `[FE]`, each with `cross-env NODE_ENV=development` (this machine has `NODE_ENV=production` set globally, which would otherwise skip ts-node-dev).

Use the Bash tool with `run_in_background: true` so the session isn't blocked. Then read the background output file once and report the three ready lines:
- `[BE] ... server listening on port 5000` + `Database is connected Successfully`
- `[AD]   Local:   http://localhost:3001/`
- `[FE] ✓ Ready in ...` + `Local: http://localhost:3000`

If the user passes an argument (`backend|admin|frontend`), run the matching `npm run dev:be` / `dev:ad` / `dev:fe` from root instead (same env handling, just one app).

Notes:
- Backend takes ~10s to boot (Atlas connect). Confirm live with `curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/setting` → expect 200.
- The auth cookie `fruit_snacks_token` is shared across all three; admin/frontend talk to backend:5000 via `VITE_API_URL` / `NEXT_PUBLIC_API_URL`.
- Mongo connection + per-app env gotchas are in the `fruitsnacks-local-dev-setup` memory — check it if a server won't boot.
- Don't sleep in the foreground; rely on background-process notifications.
