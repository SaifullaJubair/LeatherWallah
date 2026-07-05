# Coolify Deploy Runbook — LeatherWallah (3-app monorepo)

**Purpose:** copy this into a fresh chat (or hand to any devops) to reproduce the full production
deployment of the LeatherWallah monorepo onto the shared Contabo VPS via **Coolify**, exactly as it
was done on 2026-07-05. Covers app creation, env, DNS, SSL, the build-contention gotcha, and the
Atlas→Contabo MongoDB migration.

> This is the **authoritative, tested** procedure. Artisan Leather + FruitSnacks already run on the
> same Coolify instance; LeatherWallah was added the same way. Everything below was executed and
> verified live.

---

## 0. The setup (what you're deploying onto)

- **Server:** one Contabo VPS, `217.216.34.155`, hostname `vmi3130701`, **4 CPU / 8 GB RAM / 72 GB disk**.
  - ⚠️ **Shared** — Artisan Leather + FruitSnacks are LIVE here too. Never break them.
- **Coolify:** v4.1.2 at `https://coolify.artisenleather.com`, API base `https://coolify.artisenleather.com/api/v1`.
  - Server uuid: `b8okwso80oo04g4ow4owogcg` (name `localhost`, `is_coolify_host: true`).
  - GitHub App source: **`saifulla-jubair`**, github_app_uuid **`ikgskgcc48sw8s0g48os8c0o`** (db id 3). It has access to `SaifullaJubair/LeatherWallah`.
- **Repo:** `SaifullaJubair/LeatherWallah` (private monorepo), branch `main`, folders:
  `LeatherWallahBackend/`, `LeatherWallahFrontend/`, `LeatherWallahAdmin/`.
- **Domain:** `leatherwallah.com` (Namecheap). DNS → same VPS IP.
- **DB:** MongoDB — started on Atlas, **migrated to a Coolify-managed `mongo:7` container** on the box (see §7).

### Reference: how Artisan/FruitSnacks are configured (the pattern we copy)
Each is a **separate Coolify project** with 3 apps (frontend/backend/admin) + a `standalone-mongodb`
(`mongo:7`) database. All apps use build_pack **nixpacks**, GitHub App source. FruitSnacks apps each
live in their **own repo** (`FruitSnacksFrontend` etc.), but LeatherWallah is a **monorepo** — so we
use one repo + per-app `base_directory` + `watch_paths` (see §4).

---

## 1. Prerequisites (one-time, do before API calls)

1. **Coolify API token** — Coolify → Keys & Tokens → API Tokens → create with **root** permission.
   - First enable API: Settings → Advanced → **API Access** ON, and set **Allowed IPs** to your
     machine's public IP (or its `/24`, e.g. `103.122.91.0/24` — ISP rotates the last octet).
   - Export it: `export CTOKEN='...'; export CB='https://coolify.artisenleather.com/api/v1'`
   - **Revoke it when done.** It's root access to a live box.
2. **Confirm the GitHub App can see the repo** — in the Coolify "new application" UI, typing the repo
   name should list `LeatherWallah`. If not: GitHub → Settings → Applications → Coolify → add repo.
3. **SSH access to the box** (optional but very useful for diagnostics + DB work):
   `~/.ssh/coolify_vps` → `root@217.216.34.155` (port 22 open). Used for `free -m`, `docker stats`,
   `mongodump`/`mongorestore`, checking container envs.

Quick connectivity test:
```bash
curl -s -H "Authorization: Bearer $CTOKEN" "$CB/version"          # -> 4.1.2
curl -s -H "Authorization: Bearer $CTOKEN" "$CB/servers"          # -> localhost server, note uuid
```

---

## 2. Create the project

```bash
curl -s -X POST -H "Authorization: Bearer $CTOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Leather Wallah","description":"Leather Wallah - Ecommerce - premium leather footwear"}' \
  "$CB/projects"
# -> {"uuid":"<PROJECT_UUID>"}     (was zl4sxh8qhtlifrx4p7rwrrdo)

curl -s -H "Authorization: Bearer $CTOKEN" "$CB/projects/<PROJECT_UUID>"
# read environments[].uuid for "production"   (was yezech45a6kn857i68qz2gs3)
```

---

## 3. Find the GitHub App uuid

```bash
curl -s -H "Authorization: Bearer $CTOKEN" "$CB/github-apps"
# find name "saifulla-jubair" -> uuid   (ikgskgcc48sw8s0g48os8c0o)
```

---

## 4. Create the 3 applications (monorepo: base_directory + watch_paths)

Endpoint: `POST $CB/applications/private-github-app`. Common fields: `project_uuid`,
`environment_name:"production"`, `environment_uuid`, `server_uuid`, `github_app_uuid`,
`git_repository:"SaifullaJubair/LeatherWallah"`, `git_branch:"main"`, `build_pack:"nixpacks"`,
`instant_deploy:false`.

**`watch_paths` is the key to isolated deploys** — pushing a change to one folder redeploys only that
app (mirrors FruitSnacks's separate-repo behaviour, but from one monorepo).

| App | name | base_directory | watch_paths | ports_exposes | build_command | publish_directory | domains |
|-----|------|---------------|-------------|:---:|---------------|---|---------|
| Frontend (Next.js) | `leatherwallah-frontend` | `/LeatherWallahFrontend` | `LeatherWallahFrontend/**` | `3000` | `npm run build` (start `npm start`) | — | `https://leatherwallah.com,https://www.leatherwallah.com` |
| Backend (Express)  | `leatherwallah-backend`  | `/LeatherWallahBackend`  | `LeatherWallahBackend/**`  | `5000` | (nixpacks auto) | — | `https://api.leatherwallah.com` |
| Admin (Vite SPA)   | `leatherwallah-admin`    | `/LeatherWallahAdmin`    | `LeatherWallahAdmin/**`    | `80`   | `NODE_OPTIONS=--max-old-space-size=2048 npm run build` | `/dist` | `https://admin.leatherwallah.com` |

Example (frontend):
```bash
curl -s -X POST -H "Authorization: Bearer $CTOKEN" -H "Content-Type: application/json" -d '{
  "project_uuid":"<PROJECT_UUID>","environment_name":"production","environment_uuid":"<ENV_UUID>",
  "server_uuid":"b8okwso80oo04g4ow4owogcg","github_app_uuid":"ikgskgcc48sw8s0g48os8c0o",
  "git_repository":"SaifullaJubair/LeatherWallah","git_branch":"main","build_pack":"nixpacks",
  "name":"leatherwallah-frontend","base_directory":"/LeatherWallahFrontend",
  "watch_paths":"LeatherWallahFrontend/**","ports_exposes":"3000",
  "build_command":"npm run build","start_command":"npm start",
  "domains":"https://leatherwallah.com,https://www.leatherwallah.com","instant_deploy":false
}' "$CB/applications/private-github-app"
# -> {"uuid":"<FE_UUID>", ...}
```
Repeat for backend + admin. Recorded uuids (this deploy):
`FE fvx98y2wwrnlq8mk0psldxka` · `BE paqiploqbxf38e4peli3zl29` · `ADMIN an36ckvyoatm96bcegnkdxwb`.

---

## 5. Set env vars (bulk)

Endpoint: `PATCH $CB/applications/<APP_UUID>/envs/bulk` with `{data:[{key,value,is_preview:false,is_build_time,is_literal:true}]}`.

**Rules that matter:**
- Read values from the local `.env` files; **override URLs to production**:
  - Backend: `SITE_URL=https://leatherwallah.com`, `BACKEND_PUBLIC_URL=https://api.leatherwallah.com`,
    `FRONTEND_PUBLIC_URL=https://leatherwallah.com`,
    `CORS_ORIGINS=https://leatherwallah.com,https://www.leatherwallah.com,https://admin.leatherwallah.com`
  - Frontend: `NEXT_PUBLIC_API_URL=https://api.leatherwallah.com/api/v1` (**with** `/api/v1`), `NEXT_PUBLIC_SITE_URL=https://leatherwallah.com`
  - Admin: `VITE_API_URL=https://api.leatherwallah.com` (**without** `/api/v1` — admin's baseURL appends it), `VITE_FRONTEND_URL=https://leatherwallah.com`
- Add **`NIXPACKS_NODE_VERSION=22`** to every app (matches FruitSnacks; forces Node 22).
- **`is_build_time:true`** for anything the build inlines: all `NEXT_PUBLIC_*` (frontend) and `VITE_*`
  (admin) and `NIXPACKS_NODE_VERSION`. Backend vars are runtime (`is_build_time:false`).
- Backend also needs `SUPER_ADMIN_PHONE=01700000000`, `SUPER_ADMIN_PASSWORD=123456` (bootstrap admin).
- **Do NOT set `PORT`** on frontend/backend — Coolify/nixpacks provides it.
- ⚠️ **On single-env update use `PATCH .../envs` with only `{key,value}`** — `is_build_time` is
  rejected there (422). It's only allowed on create/bulk.

> `.env` secrets are the previous owner's (S3 bucket `fruit-snacks`, Pathao/Steadfast/SMS/pixel). For
> a real client handover, replace these in Coolify → app → Environment Variables with the client's own
> accounts, then redeploy. (LeatherWallah's Atlas/Contabo DB is already its own.)

---

## 6. DNS + SSL

At Namecheap → leatherwallah.com → Advanced DNS, **delete the default URL-redirect/parking record**,
then add 4 A records → the VPS IP:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `217.216.34.155` |
| A | `www` | `217.216.34.155` |
| A | `api` | `217.216.34.155` |
| A | `admin` | `217.216.34.155` |

Leave the mail `TXT` (spf) record alone. Propagation ~15–30 min. **Coolify auto-issues Let's Encrypt
SSL** for each domain once it resolves — no manual cert step. Verify:
```bash
nslookup api.leatherwallah.com 8.8.8.8
curl -s -o /dev/null -w "%{http_code} ssl:%{ssl_verify_result}\n" https://api.leatherwallah.com/api/v1/setting
```

---

## 7. Database: Atlas → Contabo MongoDB migration

We started on Atlas (free M0) then moved to a box-local `mongo:7` container to avoid Atlas's 512 MB /
no-backup limits without paying for M10. **Atlas data is only copied, never deleted — instant rollback.**

### 7a. Create + start the Mongo container
```bash
curl -s -X POST -H "Authorization: Bearer $CTOKEN" -H "Content-Type: application/json" -d '{
  "project_uuid":"<PROJECT_UUID>","environment_name":"production","environment_uuid":"<ENV_UUID>",
  "server_uuid":"b8okwso80oo04g4ow4owogcg","name":"leatherwallah-database","image":"mongo:7","is_public":false
}' "$CB/databases/mongodb"
# -> {"uuid":"<DB_UUID>","internal_db_url":"mongodb://root:<PW>@<DB_UUID>:27017/?directConnection=true"}

curl -s -H "Authorization: Bearer $CTOKEN" "$CB/databases/<DB_UUID>/start"
```
The **internal hostname is the DB container uuid** (Coolify `coolify` docker network). Save `<PW>`.
> After start, the API may briefly report `exited:unhealthy` — that's a stale status. Confirm on the
> box: `docker ps --filter name=<DB_UUID>` → `Up ... (healthy)`, logs show `Waiting for connections`.

### 7b. Dump from Atlas, restore to Contabo (run from the box via `mongo:7` image)
```bash
# get the Atlas URI onto the box (from LeatherWallahBackend/.env MONGO_URI)
ATLAS='mongodb+srv://USER:PASS@cluster0.xxx.mongodb.net/leatherwallah?...'

# DUMP (note --user 0:0 + chmod 777 the out dir to avoid perm-denied)
mkdir -p /root/lwdump && chmod 777 /root/lwdump
docker run --rm --user 0:0 -v /root/lwdump:/dump mongo:7 \
  mongodump --uri="$ATLAS" --db=leatherwallah --out=/dump

# RESTORE (must join the coolify network so the DB hostname resolves; authSource=admin)
MONGOPASS='<PW from 7a>'
TARGET="mongodb://root:${MONGOPASS}@<DB_UUID>:27017/?authSource=admin&directConnection=true"
docker run --rm --network coolify --user 0:0 -v /root/lwdump:/dump mongo:7 \
  mongorestore --uri="$TARGET" --db=leatherwallah /dump/leatherwallah
# -> "80 document(s) restored successfully. 0 failed."
```
Verify counts match Atlas (products:6, categories:6, variations:9, admins:1, settings:1, pageseos:24,
reviews:18, themes:1).

### 7c. Point backend at Contabo + redeploy
```bash
# find MONGO_URI env uuid
curl -s -H "Authorization: Bearer $CTOKEN" "$CB/applications/<BE_UUID>/envs"   # locate key MONGO_URI

# update it (single-env PATCH: only key+value, NO is_build_time)
curl -s -X PATCH -H "Authorization: Bearer $CTOKEN" -H "Content-Type: application/json" \
  -d '{"key":"MONGO_URI","value":"mongodb://root:<PW>@<DB_UUID>:27017/leatherwallah?authSource=admin&directConnection=true"}' \
  "$CB/applications/<BE_UUID>/envs"

# redeploy backend so the new container picks it up
curl -s -H "Authorization: Bearer $CTOKEN" "$CB/deploy?uuid=<BE_UUID>&force=false"
```
Verify the **running** container actually switched:
```bash
ssh ... "cid=\$(docker ps --filter name=<BE_UUID> --format '{{.Names}}'|head -1); docker exec \$cid printenv MONGO_URI"
# must contain <DB_UUID>, not mongodb+srv
curl -s "https://api.leatherwallah.com/api/v1/filter_product/search_product?page=1&limit=10"  # -> 6 products
```
> ⚠️ Restart ≠ env change. A plain `/restart` keeps the old env; you must **redeploy** (or full
> recreate) for a new `MONGO_URI` to take effect.

### 7d. Rollback (if anything breaks)
Set `MONGO_URI` back to the Atlas value and redeploy. Atlas data was never touched.

### Future: Contabo → dedicated server (owner plans this ~2 months out)
Same recipe: install Coolify on the new box, recreate the 3 apps (this runbook) pointing at the same
repo, `mongodump`/`mongorestore` the Contabo DB (now including real orders/customers) to the new box,
repoint DNS to the new IP, copy env vars. No code changes — DB location is just the `MONGO_URI` env.

---

## 8. ⚠️ The build-contention gotcha (READ THIS)

The box has **8 GB RAM and runs Artisan + FruitSnacks live**. Two heavy builds at once (e.g. Next.js
`next build` + Vite `vite build`) exhaust RAM and the **docker `exporting layers` step fails with exit
255** (OOM). This bit us: frontend failed at export while admin was building in parallel.

**Fixes applied:**
1. **Deploy serially** — one app at a time. Backend first (others need its URL), then frontend, then
   admin. If two are queued, cancel one.
2. **`concurrent_builds` set to `1`** so Coolify never runs 2 builds together. The API has no endpoint
   for this; set it in **Coolify UI → Servers → localhost → Settings**, or directly in the DB:
   ```bash
   ssh ... 'docker exec coolify-db psql -U coolify -c "UPDATE server_settings SET concurrent_builds=1 WHERE server_id=0;"'
   ```
3. `watch_paths` (§4) means day-to-day pushes only build one app anyway — contention is only a risk on
   a first all-three deploy.

Check live resources anytime (API has no metrics endpoint; use SSH):
```bash
ssh ... "free -m; df -h /; uptime; docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'"
```
First-time nixpacks builds are also just **slow** on this shared box (nix-env step can take 5–6 min).
Occasional transient nix-env failures happen — just retry the deploy.

---

## 9. Deploy order (the actual happy path)

1. Create project + env (§2).
2. Create all 3 apps (§4) with `instant_deploy:false`.
3. Set env on all 3 (§5).
4. Owner sets DNS (§6).
5. `curl "$CB/deploy?uuid=<BE_UUID>&force=false"` → wait until **finished** + `api.leatherwallah.com/api/v1/setting` = 200.
6. Deploy frontend **alone** → wait finished → `leatherwallah.com` shows products.
7. Deploy admin **alone** → `admin.leatherwallah.com` loads, login `+8801700000000` / `123456`.
8. (Optional now, recommended for prod) DB migration (§7).
9. Revoke the API token.

Deployment status/logs:
```bash
curl -s -H "Authorization: Bearer $CTOKEN" "$CB/deploy?uuid=<APP_UUID>&force=false"   # returns deployment_uuid
curl -s -H "Authorization: Bearer $CTOKEN" "$CB/deployments/<DEPLOYMENT_UUID>"        # .status + .logs (JSON string)
```

---

## 10. Verification checklist (all passed on 2026-07-05)

- [x] `https://api.leatherwallah.com/api/v1/setting` → 200 + JSON, valid SSL
- [x] `https://leatherwallah.com` → 200, homepage renders **6 products** with ৳ prices, English UI, 0 Bangla (currency aside)
- [x] `https://admin.leatherwallah.com` → 200, login works, category tree loads (Men's Footwear, Casual & Accessories)
- [x] backend running container's `MONGO_URI` points at the **Contabo** mongo (`<DB_UUID>`), not Atlas
- [x] all 4 hostnames (`@`, www, api, admin) resolve to `217.216.34.155` with auto Let's Encrypt SSL
- [x] `concurrent_builds=1`

Known cosmetic follow-ups (non-blocking): admin logo asset broken, frontend `favicon.ico` 404,
guest `get_me` returns 401 (expected — not logged in).

---

## Appendix — recorded UUIDs from the 2026-07-05 deploy

| Thing | UUID |
|-------|------|
| Server (localhost) | `b8okwso80oo04g4ow4owogcg` |
| GitHub App (saifulla-jubair) | `ikgskgcc48sw8s0g48os8c0o` |
| Project (Leather Wallah) | `zl4sxh8qhtlifrx4p7rwrrdo` |
| Env (production) | `yezech45a6kn857i68qz2gs3` |
| App: frontend | `fvx98y2wwrnlq8mk0psldxka` |
| App: backend | `paqiploqbxf38e4peli3zl29` |
| App: admin | `an36ckvyoatm96bcegnkdxwb` |
| DB: mongo container | `b10b3ibsklonpuq8mursgq8p` |

Secrets (mongo root password, API token, Atlas URI) are intentionally **not** in this file — pull them
from `LeatherWallahBackend/.env`, Coolify env vars, and the DB container's `internal_db_url` at run time.
