---
description: Start all 3 LeatherWallah dev servers (backend 5000, admin 3001, frontend 3005)
---

Start the three LeatherWallah dev servers. Each `npm run dev` is long-running, so launch each with the **Bash** tool using `run_in_background: true` (do NOT block the session), giving each its own log file, then confirm each came up.

Because Bash background jobs don't reliably persist a `cd`, run each with an absolute cwd. Launch all three:

- **Backend** (:5000, Atlas DB): `cd /c/Coding/Perosnal/LeatherWallah/LeatherWallahBackend && npm run dev`
- **Admin** (:3001): `cd /c/Coding/Perosnal/LeatherWallah/LeatherWallahAdmin && npm run dev`
- **Frontend** (:3005): `cd /c/Coding/Perosnal/LeatherWallah/LeatherWallahFrontend && PORT=3005 npm run dev`

If the user passes an argument (`backend` | `admin` | `frontend` / `be` | `ad` | `fe`), start only that one.

After launching, wait for the background-ready notifications (don't foreground-sleep), then verify and report:
- Backend: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/setting` → expect 200 (takes ~10s to boot on Atlas connect).
- Frontend: port 3005 LISTENING + a `✓ Ready` line in its log.
- Admin: port 3001 LISTENING + a `Local: http://localhost:3001/` line.

Notes:
- **Check `.env.local` first** — it decides whether admin/frontend talk to `localhost:5000` (Atlas) or the live API `api.leatherwallah.com`. The Atlas DB and the live Contabo DB hold different data (see the `current-status-handoff` memory). If a fresh chat, tell the owner which one it's pointed at.
- Owner's other projects run on **3000 / 5050** — LeatherWallah frontend must be **3005**, never 3000.
