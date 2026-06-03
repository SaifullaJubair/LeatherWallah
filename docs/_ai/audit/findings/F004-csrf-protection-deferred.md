---
name: F004-csrf-protection-deferred
description: "CSRF protection — defended decision DEFERRED to dedicated session after Stage 1.5a backend pass completes."
metadata:
  finding_id: F004
  severity: P1
  status: deferred
  module: index.ts + middleware + 3-app frontend
  decided: 2026-06-03 (Session 18)
---

# F004 — CSRF Protection (DEFERRED)

## Status: 🟠 P1 — DEFERRED to dedicated session

**Decision made:** Session 18, 2026-06-03.
**Owner approved defer.** Do NOT silently skip — schedule a session for this once Stage 1.5a module pass is complete.

---

## The vulnerability

Cookies are set with `sameSite: "none"` in [auth.tokens.ts:114-118](../../../FruitSnacksBackend/src/utils/auth.tokens.ts#L114-L118):

```ts
const baseCookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
};
```

`sameSite: "none"` is **required** to share auth cookie across:
- `admin.fruitsnacksbd.com` (Admin SPA)
- `fruitsnacksbd.com` (Storefront)
- `api.fruitsnacksbd.com` (Backend API)

…because each is a different subdomain = different site to the browser.

**But:** `sameSite: "none"` means the browser sends the cookie on ANY cross-origin request to the API, including from attacker-controlled sites.

### Attack scenario

1. Admin logged into `admin.fruitsnacksbd.com` (cookie sits in browser)
2. Admin opens attacker's page (phishing email, malicious ad, compromised blog)
3. Attacker's page has a hidden auto-submitting form:
   ```html
   <form action="https://api.fruitsnacksbd.com/api/v1/product/<id>" method="POST">
     <input name="product_name" value="HACKED"/>
   </form>
   <script>document.forms[0].submit()</script>
   ```
4. Browser auto-attaches `fruit_snacks_token` cookie → backend treats as legitimate admin action

### Blast radius

- All state-changing endpoints (POST/PATCH/PUT/DELETE) on admin AND user side
- Worst targets: order placement (financial impact), product/category mass-edit/delete, settings tampering, admin self-modification

### Why threat ranked P1 not P0

- Requires victim to visit attacker-controlled URL (phishing prerequisite)
- Admin pool is small (owner + 2-3 staff) → small attack surface vs storefront
- Storefront users hitting attacker site + having active session = lower-impact (orders only)
- Brute-force (F002) is the immediately exploitable threat → prioritized

---

## Fix plan — Double-submit cookie pattern

**Why this pattern:** Keeps `sameSite: "none"` (no infra rewrite). Industry standard. Stateless (no DB lookup per request).

### Backend changes

**1. Issue CSRF token on login + refresh:**
   - On `POST /admin_reg_log/login`, `POST /user/login`, `POST /admin_reg_log/refresh`, `POST /user/refresh`:
     - Generate random 32-byte hex token
     - Set as cookie `csrf_token` with `httpOnly: false` (must be JS-readable), `secure: true`, `sameSite: "none"`, same maxAge as access token
   - On `POST /logout` (both): `res.clearCookie("csrf_token")`

**2. New middleware** `src/middlewares/verify.csrf.ts`:
   ```ts
   import { NextFunction, Request, Response } from "express";
   import ApiError from "../errors/ApiError";

   const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

   export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
     if (SAFE_METHODS.has(req.method)) return next();
     // Allow webhooks (signature-verified separately, no cookie context)
     if (req.path.startsWith("/api/v1/webhook/")) return next();
     // Allow public callbacks (SSLCommerz IPN etc — no auth cookie either)
     if (req.path.match(/^\/api\/v1\/payment\/sslcommerz\/(success|fail|cancel|ipn)/)) return next();

     const cookieToken = req.cookies?.csrf_token;
     const headerToken = req.headers["x-csrf-token"];
     if (!cookieToken || !headerToken || cookieToken !== headerToken) {
       throw new ApiError(403, "CSRF token mismatch");
     }
     next();
   };
   ```

**3. Mount in `index.ts` AFTER `cookieParser`:**
   ```ts
   app.use(cookieParser());
   app.use(verifyCsrf);  // ← add
   app.use("/api/v1", routes);
   ```

### Admin SPA changes ([FruitSnacksAdmin](../../../FruitSnacksAdmin))

**1. Axios interceptor** — likely in `src/utils/axios.js` or similar:
   ```ts
   import Cookies from "js-cookie";

   axios.interceptors.request.use((config) => {
     const method = (config.method || "").toLowerCase();
     if (["post", "put", "patch", "delete"].includes(method)) {
       const token = Cookies.get("csrf_token");
       if (token) config.headers["X-CSRF-Token"] = token;
     }
     return config;
   });
   ```

**2. Verify `js-cookie` (or equivalent) is installed.**

### Frontend storefront changes ([FruitSnacksFrontend](../../../FruitSnacksFrontend))

**1. RTK Query baseQuery** — likely in `src/redux/api/apiSlice.js`:
   ```ts
   const baseQuery = fetchBaseQuery({
     baseUrl,
     credentials: "include",
     prepareHeaders: (headers, { type }) => {
       // type === "mutation" → state-changing
       if (type === "mutation") {
         const token = getCookie("csrf_token"); // helper to read non-httpOnly cookie
         if (token) headers.set("X-CSRF-Token", token);
       }
       return headers;
     },
   });
   ```

**2. For any raw fetch/axios outside RTK Query (cart sync, etc), same interceptor pattern.**

### Test plan (do NOT skip — this is where things break)

After implementation, run through every write surface and confirm no 403:

**Admin:**
- Login → CSRF cookie set → product create/edit/delete works
- Category tree manipulate
- Settings save
- Theme upload
- Order status update
- Coupon/campaign/offer CRUD
- User management (add/edit admin)
- Logout → cookie cleared

**Storefront:**
- User register/login
- Add to cart (logged-in: server sync)
- Update cart quantity / remove item
- Place order (COD, SSLCommerz, manual MFS)
- Review submit
- Question submit
- Wishlist add/remove
- Profile update
- Logout

**Webhooks:**
- Pathao webhook still hits (no CSRF — exempt)
- Steadfast webhook still hits
- SSLCommerz callbacks still hit (success/fail/cancel/ipn)

---

## Why deferred to dedicated session

1. **Scope:** Touches 3 apps (BE + Admin + FE) → not a backend-only fix
2. **Test surface:** Every mutation across both apps needs verification — wide
3. **Concurrent work risk:** Mixing with other security fixes in same session = if something breaks, harder to isolate cause
4. **Stability:** Admin + FE currently stable (post-V2 picker rebuild) — keep them untouched while backend hardening completes
5. **Threat ranking:** F002 (brute-force) is the immediate exploitable risk; F004 needs victim phishing → can wait days, not weeks

## Schedule

- After Stage 1.5a module pass complete (~3-5 sessions)
- BEFORE Stage 1.5b (dynamic-vs-hardcoded audit) starts
- Dedicated session — no other audit work that day
- Estimated effort: 1 full session (~3-4 hours coding + testing)

## Related findings
- [[F001]] env guard (this session)
- [[F002]] rate-limit (this session)
- [[F003]] helmet (this session)
- [[F006]] body size (this session)
