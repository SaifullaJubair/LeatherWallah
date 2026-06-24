# OWNER Feature-Flag Layer (Sections C · D · T)

**Parent:** [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md)
**Status:** BLUEPRINT — not started. Build in Step 3 (after permission overhaul, Step 1.5).
**Why a sub-doc:** security-critical (a privileged god-mode role + cross-cutting gates). Includes
an edge-audit at the bottom. Pairs tightly with [PERMISSION_OVERHAUL.md](PERMISSION_OVERHAUL.md) —
they share the registry pattern and should be designed together.

> **The owner's core idea, verbatim intent:** every clone (FE+BE+Admin+DB) has, inside its OWN
> admin panel, an extra role **OWNER** (agency) that the client never knows exists. OWNER sees a
> master toggle of every feature/section/theme. OWNER turns on only what the client paid for; the
> client (super-admin) sees only the enabled ones — e.g. never sees Size Chart or Flash Sale that
> exist in code but are off. Later the client asks for Campaign → OWNER logs in to THAT client's
> panel, toggles it on, saves → the client now has it. No redeploy, no seed script.

---

## Section C — The OWNER role (per-clone, client-invisible)

### C1. What it is (and is NOT)
```
OWNER  = a privileged role INSIDE each clone's own admin panel.
         Reaches ONLY that one client's DB (it lives in that clone).
         NOT a central cross-client panel (that would be path #3 / multi-tenant — insecure now).
```
This is the key security property: because each clone is a separate deploy + DB, an OWNER login
can only ever touch its own shop. There is no single place holding every client's credentials.
(Contrast: a central panel connecting to all client DBs = the security nightmare we rejected.)

### C2. Two-tier control in one panel
```
OWNER (you/agency)     → sees the master feature/section/theme toggles ("Feature Management" page)
super-admin (client)   → sees & uses only what OWNER enabled
staff (client's staff) → sees only what their permission allows, within what's enabled
```

### C3. The live-upsell flow (the whole point)
```
client asks for Campaign later
   → OWNER logs into THAT client's admin (OWNER creds)
   → Feature Management → toggle Campaign on → save
   → client's panel now shows Campaign menu; storefront route opens
   → NO deploy, NO ssh, NO seed script (do it from a phone if needed)
```

### C4. Credentials (security)
- **Unique OWNER credential per clone** — `bootstrap` auto-generates it; store in your password
  manager / client spreadsheet. NEVER reuse one OWNER password across clones (one leak ⇒ a client
  could guess others).
- The OWNER account is created at bootstrap, separate from the client's super-admin.

### C5. Hiding OWNER from the client (critical)
The client must NOT be able to see or recreate the OWNER role — otherwise they'd make their own
OWNER and unlock every feature (bypassing your sales).
- Client's super-admin must NOT have `role_create` over the OWNER role (or OWNER role is filtered
  out of the role list the client sees).
- OWNER-only pages (Feature Management) are gated by an OWNER-only permission the client can't grant
  themselves.
- This is enforced in the permission layer → see [PERMISSION_OVERHAUL.md](PERMISSION_OVERHAUL.md)
  (super-admin bypass must EXCLUDE owner-tier flags).

### C6. Feature-flag ≠ permission (two different layers)
```
PERMISSION (role-based)  → "can THIS admin user do campaign?" (staff vs super-admin)
FEATURE-FLAG (shop-level)→ "does THIS shop HAVE campaign at all?" (client A bought it, B didn't)
```
Order of checks: **feature-flag first** (does the shop have it?) → if no, nobody gets it (route 404,
admin hidden). → if yes, **permission** (can this user?) → staff maybe not, super-admin yes.
Mixing them is a classic bug: super-admin has all permissions, but a disabled feature must still be
invisible to them.

### C7. Storage
```
enabled_features lives in settings (or a small dedicated collection), e.g.:
   enabled_features: { size_chart:true, nutrition:false, flash_sale:false,
                       campaign:true, wishlist:true, loyalty:false, ... }
```
Source of truth for "is feature X on for this shop". Set initially by the niche preset / plan_tier
(§T), then fine-tuned by OWNER.

---

## Section D — A feature toggle is a FULL CHAIN (not just link-hide)

The owner caught the cardinal trap: hiding a menu/section does NOT close the route. `/campaign`
stays reachable by URL (SEO index, bookmark, guess) even with the link gone.

### D1. Storefront chain (when a feature is OFF)
```
✅ home section hidden        (data/flag gate — already the pattern)
✅ menu / nav link hidden     (flag gate)
🔴 ROUTE → notFound() / 404   ← the owner-caught gap. Next.js: gate at the route, off ⇒ notFound()
🔴 API endpoint → 403/404     ← REAL security. FE 404 is UX; data still leaks via direct API call
⚙️ sitemap → exclude          ← so Google de-indexes the off feature's pages
⚙️ old data → HIDDEN not deleted (off→on restores it)
```
Why each: SEO-indexed `/campaign` → customer clicks → empty/broken page → bad impression. Client's
old bookmark → "why is this open, I didn't buy campaign?" → blames you. Off feature but data in DB +
route open → the "off" feature isn't really off (data visible).

### D2. Admin chain (owner-caught: PageSEO too)
```
🔴 sidebar campaign menu hidden
🔴 Page-SEO list entry for /campaign hidden  ← owner's exact catch: "campaign route-এর data
   SEO page-এ পাবে না" — the PageSEO route list must be FEATURE-FLAG-AWARE
🔴 campaign-related settings/pages hidden
🔴 dashboard campaign stat/widget hidden
```

### D3. Data behavior on toggle-off (ties to §T downgrade)
- **HIDE, never delete.** A client downgraded from premium had loyalty points; turning loyalty off
  must not wipe them — off→on restores. This makes downgrades safe.

### D4. Where the gate code lives
- **FE route gate** = customer UX (notFound()).
- **BE API gate** = real security (off ⇒ 403). CLAUDE.md rule: "frontend checks are UX-only; real
  security is backend." Feature-flags obey the same — route-hide is UX, API-gate is security.
- A single feature flag therefore touches ~10 places (6 storefront + 4 admin). Implement as a
  shared helper, not 10 hand-written checks, so a new flagged module wires up uniformly.

---

## Section T — plan_tier (basic / standard / premium)

### T1. What it is
`plan_tier` = a **bundle shortcut** over feature-flags (like a skin = a bundle of tokens). Instead
of OWNER toggling 12 features one by one, pick a tier → its feature set turns on.
```
basic    = { wishlist, reviews, COD }
standard = basic + { campaign, flash_sale, coupon }
premium  = standard + { loyalty, abandoned_cart, advanced_analytics, multi_courier }
```

### T2. How it resolves
```
client_config.plan_tier = "premium"
   → PLAN_FEATURES registry (code) maps tier → feature list
   → enabled_features = tier's features  ⊕  OWNER manual overrides
```
**OWNER override is the final word** (real-world needs exceptions):
- premium client doesn't want loyalty → OWNER turns loyalty off.
- basic client buys just campaign as a paid add-on → OWNER keeps basic, turns campaign on.

### T3. It's NOT a new gate — just convenience
plan_tier sets which flags are on; the §D feature-flag chain then does all the actual gating. No new
security surface, so it's cheap to add once feature-flags exist.

### T4. Business value (the revenue backbone)
- **Pricing:** basic ৳X / standard ৳2X / premium ৳3X.
- **Instant upsell:** client grows, wants flash sale → OWNER flips tier basic→standard → save →
  instant unlock, NO deploy → charge an upgrade fee → recurring revenue.
- **SaaS billing (future):** in the landing multi-tenant SaaS, plan_tier = billing tier. Building it
  now means SaaS billing drops straight in.

### T5. Downgrade safety
tier downgrade just turns flags off → §D3 (hide, not delete) → customer/loyalty data preserved,
returns on re-upgrade.

---

## EDGE-AUDIT (Checklists A + B, relevant points)

This is schema + cross-app + auth + new gates → audit is mandatory.

### Checklist A — technical

- **#1 ROUTE:** every flagged storefront route needs a gate that calls `notFound()` when off; every
  flagged admin page + PageSEO entry needs flag-aware listing. **MISS RISK HIGH** — easy to add the
  flag to the menu but forget the route → exposed. Mitigation: a shared `requireFeature(flag)` route
  helper + a registry that lists every flagged route, so coverage is auditable, not ad-hoc.
- **#2 SCHEMA:** `enabled_features` (object/map) + `plan_tier` (string) on settings (or new
  collection). No populate/index conflict. `PLAN_FEATURES` is code (registry), not DB.
- **#3 EXISTING FLOW:** order/cart/courier must NOT depend on a flag that could disable them — COD,
  cart, checkout are CORE, never flaggable off. Only marketing/extra modules are flaggable.
  **BLOCKER if core gets flagged** — define a non-flaggable core set explicitly.
- **#8 AUTH/RBAC:** OWNER-only flag must be ungrantable by client super-admin (C5). Feature-flag
  checked BEFORE permission (C6). New `manage_features` permission (OWNER-tier) must be excluded
  from super-admin bypass.
- **#9 BACK-COMPAT:** existing clones have no `enabled_features` → default must be "all current
  features ON" (so an existing live shop doesn't suddenly lose features). New clones get
  preset/tier defaults. **MISS RISK** — gate must read "absent = on for legacy" the way size-image
  used `!== false`.
- **#11 EXTERNAL/STATE:** toggling a flag mid-session for a logged-in client admin — does the menu
  update? (re-fetch settings on navigation; or it updates next load — acceptable.)
- **#13 FE-BE CONTRACT:** `enabled_features` shape identical across FE (route gate) + Admin (menu/
  PageSEO) + BE (API gate). Single registry of flag keys shared/copied across apps (like permission
  keys).

### Checklist B — real-world

- **Client self-makes OWNER role** → unlock everything → bypass sales. **HIGH** → C5 enforcement is
  non-negotiable (client can't see/create OWNER role or grant `manage_features`).
- **OWNER forgets a route gate** → customer finds `/campaign` via old FB ad link → broken page.
  → the registry-driven `requireFeature` coverage check.
- **Downgrade wipes data** → customer loyalty points vanish → support nightmare. → §D3/T5 hide-not-
  delete.
- **SEO leak** → Google indexed an off feature's page → shows in search. → sitemap exclude + 404.
- **Two OWNERs (you + a VA)** editing flags → last-write-wins on settings (single-shop, low concurrency
  → acceptable; note it).
- **Resale/multi-niche:** preset/tier defaults must be niche-correct (food preset: nutrition on,
  size_chart off; fashion: reverse). Defaults come from the niche preset, refined by plan_tier.

### Audit verdict
```
🚨 BLOCKERS:
   1. Core commerce (cart/checkout/COD/courier) must be NON-flaggable — define explicit core set.
   2. OWNER role/flag must be ungrantable by client (C5) — or the whole paywall is bypassable.
⚠️ HIGH:
   1. Route-gate coverage must be registry-driven + auditable (not per-route hand-added) — else leaks.
   2. Legacy clones: enabled_features absent ⇒ treat as ALL ON (back-compat), or live shops lose features.
   3. API-gate (BE 403) is the REAL security; FE 404 alone leaks data via direct API.
🟡 MEDIUM:
   1. Settings shape identical 3 apps (shared flag-key registry).
   2. plan_tier downgrade = hide not delete (data safety).
📝 PLAN MODIFICATIONS:
   1. Define CORE (non-flaggable) vs OPTIONAL (flaggable) module sets up front.
   2. Shared FLAG registry (keys) across 3 apps; shared requireFeature() helper (FE route + BE API).
   3. Legacy default = all-on; new = preset/tier default.
   4. Build AFTER permission overhaul (shares registry pattern + super-admin-bypass exclusion).
```

→ **Escalation:** touches auth + schema + 3 apps + new gates → before coding, run
`security-privacy-reviewer` + `plan-edge-auditor` for a fresh independent pass (per CLAUDE.md).
