# Permission + Auth Overhaul — Path C (DB-driven, nested, rich)

**Status:** PLAN — owner reviewing. NO CODE until approved.
**Supersedes:** `docs/_ai/PERMISSION_OVERHAUL.md` (that was Path A = code-registry; owner chose
Path C = DB-driven nested module tree after reading two reference projects).
**Reference studied (read-only, NOT copied):**
- `C:\Coding\Revinr\oms-v2-frontend` — early scaffold (fakeData, APIs commented). Pattern only.
- `C:\Coding\Revinr\bridge-to-bangladesh-web-app-dev` — frontend RBAC (withPermission, nav filter, PermissionModules UI). `PERMISSION_CHECK_ENABLED=false`.
- `C:\Coding\Revinr\bridge-to-bangladesh-microservices-dev` — NestJS/TypeORM backend RBAC + auth.

> **Owner directive:** take bridge's MODEL (it's A-grade), but where bridge has gaps/bugs/missing
> pieces, ADD what's genuinely better. This must feel best-in-class for a future multi-tenant SaaS,
> never low-grade. So: borrow the **design**, do NOT copy the **code** (bridge's impl is incomplete +
> buggy — see §0).

---

## ⭐ TIMING STRATEGY — LOCKED (owner decision, 2026-06-24)

**Split the work by risk + timeline. Do NOT build the whole module now.**

| Part | When | Why |
|------|------|-----|
| **Phase 0** — 2 live security bugs (§7) | **NOW** (this/next session) | Active credential leak on the LIVE shop. 2 lines, no schema, no migration, merge-independent. Cannot wait. |
| **9 FE-only permission gaps** (Phase 5 / §9 M2) | **NOW, alongside Phase 0** | Also just route-guards (schema-independent, no migration). Any logged-in admin can currently read/write customer data + SEO via direct API. Close before merge since merge is not imminent. |
| **Backend RBAC** (4 collections + guard + migration + auth_sessions) | optional: can be done before merge | The API is NOT being merged — only FE+Admin merge. So backend foundation could land early. Not mandatory; fine to do it all at merge too. |
| **Admin RBAC UI** (permission-modules CRUD, role-matrix, recursive sidebar, sessions view, `withPermission`) | **AT FE+Admin MERGE** | This is the heavy part. Building it in today's separate Vite-Admin means REWRITING it after merge = double work + double edge-bugs. Build once, in the merged app. |

**Rationale:** the merge is FE+Admin (two frontends) — backend stays one Express API. The double-work
trap is the **UI**, so only the UI waits for merge. The live bugs (Phase 0 + 9 gaps) are guard-only and
must not wait. See [[platform-architecture-plan]] for the FE+Admin merge plan (V2).

**Next-session entry:** if merge is still pending → do Phase 0 + the 9 gaps, ship, stop. Resume full
Path C (backend + UI) when the FE+Admin merge starts.

---

## §0. What bridge got RIGHT vs what it LEFT BROKEN (measured from code)

**A-grade (borrow the design):**
- 4-table RBAC: `module` × `permission_types` × `role_permissions` × `roles`.
- `module.parentId` self-FK → infinite nested module tree (page → section → sub-section).
- Action as its own table (`select/insert/update/delete/execute/grant`).
- Audit on grants (`grantedBy/grantedAt/updatedBy`), `role.isSystem` lockout-guard.
- `getUserPermissions()` → flat `["module.action"]` array, deduped, resolved at login.
- Auth: `auth_sessions` table (device/IP/location/UA/lastUsed), refresh-token bcrypt-hashed in DB,
  token-revoke via session expiry + Redis blacklist, 2FA flow, OAuth strategies.

**Broken / missing in bridge (do NOT copy — we fix/add):**
1. 🐛 `role-permission.service.ts:71-79` — assign maps `permissionIds` but writes only `roleId`;
   `moduleId/permissionTypeId/isGranted` never set → empty/broken rows. We write correct assign.
2. 🚨 No seed/migration for `module` or `permission_types` — tables ship empty; nobody populates them.
   We add a **schema-derived seed** (the registry idea from Path A, reused as DATA not code).
3. RBAC disabled (`PERMISSION_CHECK_ENABLED=false`) — never proven live. We ship it ON + tested.
4. Per-request permission resolution unclear (resolved at login → stale if role edited mid-session).
   We define the freshness model explicitly (§4).

---

## §0b. Reference file map (exact paths — go straight here when coding; don't re-search)

> ⚠️ These live in OTHER repos that may change/disappear. They are REFERENCE for the DESIGN, not code
> to copy. If a path is gone at coding time, the model is fully captured in §0/§2 of this doc — proceed
> from here. Roots:
> `OMS = C:\Coding\Revinr\oms-v2-frontend` ·
> `BR-WEB = C:\Coding\Revinr\bridge-to-bangladesh-web-app-dev` ·
> `BR-MS = C:\Coding\Revinr\bridge-to-bangladesh-microservices-dev`

**Backend RBAC data model (BR-MS) — the core to translate to Mongoose (§2):**
- `services/auth/src/entities/modules.entity.ts` — nested module (`parentId` self-FK, code/displayName/icon/sortOrder/isActive). → our `permission_modules`.
- `services/auth/src/entities/permission-types.entity.ts` — action vocabulary (select/insert/update/delete/execute/grant). → our `permission_types`.
- `services/auth/src/entities/role-permission.entity.ts` — the grant join (roleId × moduleId × permissionTypeId + isGranted/grantedBy/grantedAt). → our `role_permissions`.
- `services/auth/src/entities/role.entity.ts` — role (name/description/isSystem/isActive/sortOrder). → our `roles` rewrite (we ADD perm_version).

**Backend RBAC logic (BR-MS):**
- `services/auth/src/role-permission/role-permission.service.ts`
  - `:30 addOrUpdateRole` — role create/edit + delete-then-reinsert grants pattern. **:71-79 = THE BUG** (writes only roleId, drops moduleId/permissionTypeId/isGranted). We write this correctly (§9 B4).
  - `:153 deleteRoleById` — "Cannot delete system roles" (isSystem guard). → our B3.
  - `:172 getUserPermissions`, `:188 userHasPermission`, `:193/198 any/all` — permission-check helpers.
- `services/auth/src/auth.service.ts`
  - `:1585-1597 getUserPermissions` — builds the flat `module.action` deduped array. → our login-resolve (§4).
  - `:2516 validateToken` — JWT verify + session expiry check + lastUsedAt touch.
  - `:2545 signToken` / `:2561 signRefreshToken` / `:2591 issueAndPersistTokens` — token issue + refresh-hash persist.
- ⚠️ **NO seed/migration exists** for module/permission_types (confirmed: nothing in `services/auth/src/migrations/` names module/permission/role). This is bridge's gap #2 — WE add the schema-derived seed (§1 A3).

**Backend auth/session (BR-MS):**
- `services/auth/src/entities/auth-session.entity.ts` — session row (device/deviceType/ip/location/city/country/userAgent/refreshTokenHash/expiresAt/lastUsedAt). → our `auth_sessions` (§1 A6).
- `services/gateway/src/auth/jwt-auth.guard.ts` — per-request guard: bearer extract + Redis blacklist check + grpc validateToken → sets req.user. (We do monolith equivalent: cookie + session lookup + perm_version, no grpc/Redis required.)

**Frontend RBAC (BR-WEB) — UX patterns to rebuild in the merged app (§5):**
- `src/utils/permissions.js` — `hasPermission(perms, module, action)` + `filterNavByPermissions` (recursive parent-shows-if-child-visible) + `PERMISSION_CHECK_ENABLED` flag.
- `src/components/common/WithPermission.jsx` — `withPermission(Component, perm, action)` HOC → AccessDenied.
- `src/app/(admin)/layout.js` — ProtectedRoute + allowedPaths + allowedUserTypes pattern.
- `src/features/admin/user-management/PermissionModules/PermissionModulesComponent.jsx` — nested module CRUD table (TanStack getSubRows via parentId, add/edit modal). The UI to mirror.
- `src/app/(admin)/admin/user-management/roles-permissions/page.js` — role list/assign entry.

**Frontend role-permission matrix (OMS) — richer assign UI to mirror (§5):**
- `src/features/settings/role-permission/AddOrUpdateComponent.jsx` — role form + permission cards grouped into **Page / Action / Feature** permissions, per-group "select all", view-only when no edit perm. (Note: OMS uses fakeData / commented APIs — pattern only, not wired.)
- `src/hooks/common/useCommonFunctions.js` — `hasPermission(code)` against `useAuthStore.permissions`.

---

## §1. Our additions beyond bridge (the "make it richer" list)

These are MY judgment calls per owner's directive — each is justified, none is gold-plating:

| # | Addition | Why it's worth it for SaaS |
|---|----------|----------------------------|
| A1 | **`feature_flag` field on module** (gates whole module per-clone/preset) | multi-niche: a food clone hides "Lookbook" module entirely, not per-role. Two-layer: feature THEN permission. |
| A2 | **`is_owner_only` on module/action** | OWNER-tier perms (manage_features, plan_tier) that client super-admin can NEVER get. SaaS paywall integrity. |
| A3 | **Schema-derived seed** (`PERMISSION_SEED` manifest → seeds module+action rows + grants super-admin) | bridge's #2 gap. New module = 1 manifest line; bootstrap auto-seeds. Keeps "new feature = no blocker". |
| A4 | **`module.code` immutable + `displayName` editable** | rename label in UI without breaking `code.action` guard strings. bridge conflates name/display. |
| A5 | **Permission resolution = login-resolve + version stamp** | role edited mid-session → bump `role.permVersion`; session carries it; mismatch forces re-resolve. Catches bridge's stale-perm hole without a DB join every request. |
| A6 | **`auth_sessions` + "active sessions" admin/user view + revoke-one / revoke-all** | bridge has the table but no UI. SaaS users expect "log out other devices". |
| A7 | **Audit log collection** (`permission_audit`: who granted/revoked what, when) | bridge audits on the row only; a dedicated trail is compliance-grade for SaaS. |
| A8 | **Migration safety: dual-read shim** | during rollout, `verifyToken` understands BOTH old boolean flags AND new `code.action` so a half-deployed state never 403s the live shop. Removed after cutover. |
| A9 | **`hasPermission` helper symmetry FE↔BE** | one canonical `code.action` string; FE `withPermission`/nav-filter and BE guard read the SAME format. No drift. |

---

## §2. Mongoose data model (bridge → FruitSnacks)

New collections (names chosen to avoid clashing with existing `roles`):

```
permission_modules        # the nested tree
  _id, code (unique, immutable, e.g. "flash_sale"), display_name, icon,
  parent_id (ObjectId|null → self),  sort_order, is_active,
  feature_flag (string|null),        # A1
  is_owner_only (bool),              # A2
  module_path ([ObjectId])           # ancestor ids, for fast subtree (mirrors category_path pattern)

permission_types          # global action vocabulary (seeded once)
  _id, code (unique: select|insert|update|delete|execute|grant),
  display_name, sort_order

role_permissions          # the grant join (module × action × role)
  _id, role_id, module_id, permission_type_id, is_granted (default true on insert),
  granted_by, granted_at, updated_by
  # compound unique index (role_id, module_id, permission_type_id)

roles (REWRITE existing)
  _id, role_name (unique), description, is_system (←lockout guard),
  is_active, sort_order, perm_version (int, A5), timestamps
  # the 96 boolean flags are DROPPED (migrated into role_permissions rows — §6)

auth_sessions (NEW, A6)
  _id, admin_id, refresh_token_hash, expires_at, device, device_type,
  ip_address, user_agent, location, city, country, last_used_at, perm_version, timestamps

permission_audit (NEW, A7)
  _id, actor_admin_id, action ("grant"|"revoke"|"role_create"|...),
  role_id, module_id, permission_type_id, before, after, created_at
```

Resolved permission string = `${module.code}.${permission_type.code}` → e.g. `"flash_sale.select"`.

---

## §3. New guard + the new-module workflow (owner's KEY requirement)

**Backend middleware (replaces today's `verifyToken("flag")`):**
```
verifyToken("flash_sale", "update")   // (moduleCode, action)
```
Internally: resolve admin → roles → granted (module.code, action) set (from login-resolved cache,
re-checked against `perm_version`); also enforce `is_owner_only` exclusion + `feature_flag` (404 if
the clone has the feature disabled — no info leak).

**Adding a brand-new "Lookbook" feature — total permission work:**
```
1. PERMISSION_SEED manifest: one entry →
     { code:"lookbook", display:"Lookbook", parent:null, actions:["select","insert","update","delete"], featureFlag:"lookbook" }
2. npm run seed:permissions            # idempotent: upserts module + grants super-admin, touches nothing else
3. Write the routes with verifyToken("lookbook","insert") etc.

AUTO (dev does none of this):
   ✅ module + 4 grants seeded; super-admin can use it immediately
   ✅ Admin "Permission Modules" page shows Lookbook (it reads the DB, not a static file)
   ✅ Admin Role-matrix shows Lookbook × 4 actions checkboxes
   ✅ Recursive sidebar shows Lookbook when role has lookbook.select
   ✅ Staff roles = no grant → 403 until owner ticks it
```
Plus: owner can ALSO create ad-hoc modules/sections **purely from the Admin UI** (DB insert) — the
seed manifest is only for code-shipped modules that must exist on every clone. Both paths coexist
(that's the richness: code-defined baseline + UI-defined extras).

**Nested section example (owner's Site-Settings concern):**
```
module "setting" (parent:null)
  ├ module "setting_sms"        (parent: setting, is_owner_only:true)
  ├ module "setting_vat"        (parent: setting)
  ├ module "setting_loyalty"    (parent: setting)
  └ module "setting_home_layout"(parent: setting)
```
Each child is its own module → its own `select/update` grants → each tab gated independently.
Tab renders only if `hasPermission("setting_vat","select")`. A client preset that lacks VAT → that
child module `is_active:false` (or feature-flagged off) → tab gone for everyone, not just per role.

---

## §4. Permission freshness (fixes bridge's unclear model — A5)

- **Login:** resolve full `code.action` set once → store in session + return to FE (for nav/guards).
- **Each admin request:** `verifyToken` reads the resolved set from the session doc (one indexed
  lookup, no join). It compares `session.perm_version` vs `role.perm_version`.
- **Role edited / deactivated:** bump `role.perm_version`. Next request: version mismatch → re-resolve
  fresh, update session. → mid-session permission changes take effect on the very next request, WITHOUT
  a per-request multi-collection join. (Best of both: bridge's login-resolve speed + per-request safety.)

---

## §5. Admin + Frontend UI (borrow bridge's UX, wire it for real)

**Admin (new pages):**
- `/settings/permission-modules` — nested CRUD table (expandable rows via `parent_id`), create/edit
  module (code, display, icon, parent, sort, feature_flag, owner_only, active). Mirrors bridge's
  `PermissionModulesComponent` but with working mutations.
- `/settings/roles` + `/settings/roles/:id` — role form + **module × action matrix** of checkboxes
  (grouped by parent module, "select all" per group). Saves `permissionIds` → correct
  `role_permissions` rows (the bug we fix). `is_system` roles → view-only.
- `/settings/sessions` (A6) — active sessions list + revoke.
- Sidebar: recursive `filterNavByPermissions(modules, perms)` — parent shows if any child visible.

**Frontend storefront:** unaffected (public routes). Only the Admin app's gating changes.

---

## §6. Live-shop migration (the highest-risk part — dry-run on a DB COPY first)

The live food shop has roles with the 96 boolean flags. Migration script (idempotent, reversible):
```
1. Seed permission_types (6 actions) + permission_modules (from PERMISSION_SEED manifest).
2. For each existing role doc: for each boolean flag == true, map "<module>_<action>" →
   (module_id, permission_type_id) and insert a role_permissions row (is_granted:true).
   - Mapping table handles legacy oddities: offer_* → flashsale module too (cross-gate, §note),
     specification_* → DROP (dead), site_setting_update / setting_secrets_update → setting module +
     setting_sms child, etc. Every one of the 83 route strings gets an explicit mapping (no silent loss).
3. Set role.is_system = true on Super Admin; add perm_version = 1 to all roles.
4. Keep the boolean fields in the doc UNTIL cutover (dual-read shim A8 reads either) → instant rollback.
5. Post-cutover migration: $unset the boolean flags.
```
**Safety gates:** run on a restored COPY of the live DB; assert (a) every true-flag produced exactly
one row, (b) the resolved `code.action` set per role equals the old true-flag set (diff must be empty),
(c) super-admin resolves to ALL non-owner perms. Only then touch live. `security-privacy-reviewer`
pass before cutover (auth + live shop + PII).

---

## §7. Phase 0 — 2 live security bugs (path-independent, do FIRST)

Unchanged from the old doc, still real, verified in code this session:
- `authentication.routes.ts:22` `GET /dashboard` → add `verifyToken("setting","update")` (leaks SMS creds).
- `authentication.routes.ts:19` `.delete` → add `verifyToken("setting","update")` (anyone deletes SMS config).
(Phrased in NEW guard form; if Phase 0 ships before the overhaul, use the OLD form
`verifyToken("setting_secrets_update")` / `verifyToken("site_setting_update")` and the migration maps it.)

---

## §8. Phased rollout (live-safe)

```
Phase 0  — 2 security bugs. Single-line. Ship now (old guard form).
Phase 1  — Backend foundation: 4 collections + PERMISSION_SEED + seed:permissions + new verifyToken
           (dual-read shim) + auth_sessions + login-resolve + perm_version. Build-verify (tsc 0).
Phase 2  — Migration script + dry-run on live-DB COPY + diff assertions. (No live write yet.)
Phase 3  — Admin UI: permission-modules CRUD, role matrix, sessions view, recursive sidebar.
Phase 4  — Cutover on live: run migration, flip guards to new form, verify, then $unset old flags.
Phase 5  — Close the 9 FE-only gaps (page_seo/customer/theme/faq_template/trust_point now real BE guards).
Phase 6  — OWNER tier seed (is_owner_only modules + OWNER role) — prereq for OWNER_FEATURE_FLAG layer.
```

---

## §9. Edge-audit (to expand before coding Phase 1)

```
🚨 BLOCKERS
  B1 Phase-0 unguarded auth routes → §7, now.
  B2 Migration must dry-run on a COPY; resolved-set diff per role must be EMPTY before live (§6).
  B3 Super Admin lockout — is_system guard in role controller (can't delete/strip the only admin role).
  B4 Assign logic must write moduleId+permissionTypeId+isGranted (the exact bridge bug) — covered by tests.
⚠️ HIGH
  H1 Dual-read shim window: every guard must accept old flag OR new code.action until Phase 4 $unset.
  H2 perm_version bump points: role edit, role delete, admin role reassign, admin deactivate.
  H3 feature_flag off must 404 (not 403) to avoid leaking which features a clone lacks.
  H4 Cross-gate legacy (offer_* gating flashsale) — preserve exactly in the migration map or flash sale breaks.
🟡 MEDIUM
  M1 specification_* dead flags → drop in migration (don't seed).
  M2 Public storefront GETs (theme/faq_template/trust_point) stay public; add guarded /dashboard variants.
  M3 Owner-only modules hidden from client staff list + role-list.
```
→ Before coding Phase 1: run `plan-edge-auditor` (cross-app + schema + auth) + `security-privacy-reviewer`.

---

## §10. Open decisions for owner (answer before coding)

1. **UI-created modules** — allow owner to create ad-hoc modules/sections purely in Admin (no code),
   in addition to the code-seeded baseline? (My rec: YES — that's the richness you asked for; the
   seed manifest just guarantees baseline modules exist on every clone.)
2. **Auth scope now or later** — include the `auth_sessions` + device-management + revoke-all upgrade
   in THIS overhaul, or split it into a follow-up? (My rec: include sessions table + revoke now since
   we're already rewriting auth resolution; 2FA/OAuth can be a later phase.)
3. **Flash Sale own permission** — give Flash Sale its own `flash_sale` module now, or keep it gated by
   `offer`'s grants (today's behavior) and migrate as-is? (My rec: migrate as-is first = zero behavior
   change, then split in a tiny follow-up — keeps the big migration's diff clean.)
4. **Naming** — keep existing `roles` collection (rewrite) vs new collection? (My rec: rewrite in place;
   admins already reference role_id.)
```
