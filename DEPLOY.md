# LeatherWallah — Testing Deploy Guide

Deploy the 3-app monorepo for **testing/demo**:

| App | Host | Why |
|-----|------|-----|
| **LeatherWallahBackend** (Express) | **Render** (free) | Express runs as-is; nightly cron + `uploads/` temp + Pathao token cache all work. Vercel serverless would break these. |
| **LeatherWallahFrontend** (Next.js) | **Vercel** | Native Next.js host. |
| **LeatherWallahAdmin** (Vite SPA) | **Vercel** | Static build + SPA rewrite (`vercel.json` included). |

> DB (MongoDB **Atlas**) and file storage (**S3** — Contabo/DO) stay as they are. Only compute is being hosted; both already live in the cloud.

**Deploy order matters:** Backend first (you need its live URL for the other two), then Frontend + Admin, then come back and set the backend's `CORS_ORIGINS`.

---

## 0. Prerequisites

- GitHub repo pushed: `SaifullaJubair/LeatherWallah` ✅
- Your `.env` files are **gitignored** (not in the repo) — you paste secrets into each dashboard.
- Atlas: make sure **Network Access → allow `0.0.0.0/0`** (or Render's egress IPs) so Render + Vercel can reach the DB. For testing, `0.0.0.0/0` is simplest.

---

## 1. Backend → Render

1. **Render → New → Blueprint** → connect GitHub → pick the `LeatherWallah` repo.
   Render reads [LeatherWallahBackend/render.yaml](LeatherWallahBackend/render.yaml) and proposes a service `leatherwallah-backend`.
2. It will ask you to fill every env var marked "required" (the `sync: false` ones). Copy each value from your local `LeatherWallahBackend/.env`:
   - `MONGO_URI`, `ACCESS_TOKEN`, `SITE_TITLE`, `SITE_URL`
   - all `S3_*`, `PATHAO_*`, `STEADFAST_*`, `SSLCOMMERZ_*`
   - `META_*`, `TIKTOK_*`, `BULKSMS_*`, `FRAUDBD_API_KEY`
   - **`CORS_ORIGINS`** → leave blank for now (you'll set it in step 4, after the Vercel URLs exist). Or put a placeholder; you'll edit it.
   - `FRONTEND_PUBLIC_URL` / `BACKEND_PUBLIC_URL` → fill once URLs are known (can edit later).
3. **Create / Deploy.** Wait for the build (`npm install && npm run build`) and start (`npm start`).
4. Copy the live URL Render gives you, e.g. `https://leatherwallah-backend.onrender.com`.
   - Test it: open `https://<that-url>/api/v1/setting` in a browser — you should get JSON (not an error).
   - ⚠️ **Free plan sleeps after ~15 min idle.** First request after sleep takes ~30–50s to wake. That's normal for testing.

> **Do NOT run `seed:demo` on Render automatically.** Your Atlas DB is already seeded. If you ever need to reseed, do it locally against the Atlas URI.

---

## 2. Frontend → Vercel

1. **Vercel → Add New → Project** → import the `LeatherWallah` repo.
2. **Root Directory** → set to **`LeatherWallahFrontend`** (click Edit next to Root Directory). Framework auto-detects as **Next.js**.
3. **Environment Variables** (from `LeatherWallahFrontend/.env`, but point the API at Render):

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://<backend>.onrender.com/api/v1` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<frontend>.vercel.app` (fill after first deploy, then redeploy) |
   | `API_URL` | `https://<backend>.onrender.com/api/v1` |
   | `META_PIXEL_ID`, `GTM_ID`, `GA4_ID`, `CLARITY_ID`, `TIKTOK_PIXEL_ID`, `GOOGLE_VERIFICATION` | copy from local `.env` (or leave blank for testing — analytics just won't fire) |

4. **Deploy.** Copy the resulting URL, e.g. `https://leatherwallah-frontend.vercel.app`.
5. Go back to env vars, set `NEXT_PUBLIC_SITE_URL` to that URL, and **redeploy**.

> Image domains: `next.config.mjs` already allowlists the S3/CDN hosts. If a product image 404s with a Next.js "hostname not configured" error, add that host there.

---

## 3. Admin → Vercel

1. **Vercel → Add New → Project** → import the **same** `LeatherWallah` repo again (second project).
2. **Root Directory** → **`LeatherWallahAdmin`**. Framework auto-detects **Vite**.
   ([LeatherWallahAdmin/vercel.json](LeatherWallahAdmin/vercel.json) handles the SPA rewrite so deep links / refresh don't 404.)
3. **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<backend>.onrender.com` **(no `/api/v1` — admin's baseURL.js appends it)** |
   | `VITE_FRONTEND_URL` | `https://<frontend>.vercel.app` (used for "view product on site" / theme preview links) |

   ⚠️ Note the difference: **frontend** wants `.../api/v1`, **admin** wants the **root** URL. This matches how each app's `baseURL.js` builds requests. Double-check against `LeatherWallahAdmin/src/utils/baseURL.js` if unsure.
4. **Deploy.** Copy the URL, e.g. `https://leatherwallah-admin.vercel.app`.

---

## 4. Wire up CORS (back to Render)

Now that the Vercel URLs exist, tell the backend to accept them:

1. **Render → leatherwallah-backend → Environment** → set:
   ```
   CORS_ORIGINS = https://<frontend>.vercel.app,https://<admin>.vercel.app
   ```
   (comma-separated, `https://`, no trailing slash)
2. Also fill `FRONTEND_PUBLIC_URL` and `BACKEND_PUBLIC_URL` with the live URLs.
3. **Save** — Render redeploys automatically.

> The backend's CORS list already merges `localhost` dev origins + whatever is in `CORS_ORIGINS`, so no code change is needed.

---

## 5. Smoke test (the important part)

Open the deployed **frontend**:
- Homepage loads with real products (not empty). If empty → open DevTools console; a CORS error means step 4 isn't applied / URL mismatch.
- Open a product page — themed sections render.
- **Login / cart sync:** add to cart as guest, then log in. The auth cookie is set with `Secure; SameSite=None` (already configured), so cross-site (vercel ↔ onrender) cookies work **as long as both are HTTPS** — they are. If login silently fails, re-check `CORS_ORIGINS` and that `credentials: "include"` requests aren't blocked.

Open the deployed **admin** (`+8801700000000` / `123456` from the seed):
- Login works, dashboard loads, product list populates.

---

## Known testing limitations (acceptable for a demo, fix for production)

- **Render free sleeps** — first hit after 15 min idle is slow. Upgrade to a paid instance to remove this.
- **Cron on Render free** only fires while the instance is awake. If it's asleep at 23:55 UTC, that night's offer/campaign auto-expire is skipped. Fine for testing.
- **SSLCommerz / Pathao / Steadfast webhooks** point at `BACKEND_PUBLIC_URL` — update those provider dashboards to the Render URL if you test real courier/payment callbacks. Otherwise they'll hit the old domain.
- **Secrets** in these `.env` files are the previous owner's (Atlas, S3, courier, SMS). For a real client handover, rotate them.
