# Permission / RBAC System — Full Audit + Greenfield Redesign (Section M)

**Parent:** [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md)
**Status:** BLUEPRINT — **Step 1.5 (foundation), do FIRST.** Owner wants permission rebuilt as if
greenfield: industry-standard, DYNAMIC, single-source, so that **adding a new feature module is
AUTOMATICALLY supported** by the permission system (no 4-place hand-sync).
**Source:** full `architecture-reviewer` deep audit (2026-06-24) that read every model + every
`*.routes.ts` + the admin role UI + bootstrap. This doc REPLACES the earlier partial diagnosis.
**Pairs with:** [OWNER_FEATURE_FLAG.md](OWNER_FEATURE_FLAG.md) (OWNER tier, feature-flag-vs-permission
ordering, super-admin-bypass exclusion).

> **⚡ NEXT-SESSION ENTRY POINT:** start here. Do **Phase 0 (2 live security bugs) immediately**,
> then Phase 1 (registry). Everything is concrete below.

---

## 🚨 PHASE 0 — LIVE SECURITY BUGS (fix immediately, independent of the overhaul)

The audit found two unauthenticated routes leaking/destroying SMS credentials on the LIVE shop:

```
1. GET  /api/v1/authentication/dashboard   → NO auth guard
      Reads the auth config doc containing sms_api_key / sms_password / sms_sender_id (BulkSMS creds).
      Any browser can read it unauthenticated. → REAL credential leak.
      FILE: FruitSnacksBackend/src/app/authentication/authentication.routes.ts  (~line 22)
      FIX:  add verifyToken("setting_secrets_update")

2. DELETE /api/v1/authentication           → NO auth guard
      Anyone can delete the SMS config document.
      FILE: same, ~line 19
      FIX:  add verifyToken("site_setting_update")
```
Both are **single-line** additions, no schema impact, no migration. Do these first, deploy, then
proceed with the registry work. (Verify exact line numbers in code — audit read them but confirm.)

---

## M1. Diagnosis — measured from code (corrects the earlier doc)

Actual counts measured by the audit (the earlier "21 vs 98 vs 83" used a stale commit):
```
role.model.ts        : 96 Boolean flags  (NOT 21 — schema has grown)
permissionData.js    : 98 entries / 92 active (6 in a commented-out specification_* block)
route verifyToken()  : 83 distinct permission strings
```
**Key correction:** the 96 schema flags are a SUPERSET of all 83 route strings → **the Mongoose
strict-mode silent-drop is NOT actively losing data today** (the earlier doc was wrong on this).
The real problems are different:

### M1a. The actual drift / gaps (with the live impact)
1. **9 permissions are FE-only gates** — exist in schema + admin UI, but NO backend route uses them.
   Granting/revoking has zero API effect; only the admin's JS hides the menu. The data is reachable
   by direct API call by ANY logged-in admin:
   `page_seo_show`, `page_seo_update`, `customer_show/create/update/delete`, `theme_show`,
   `faq_template_show`, `trust_point_show`. → **HIGH: customer data + SEO writable without the flag.**
2. **Super Admin role has NO deletion/edit protection** — a user with `role_delete` can delete it;
   with `role_update` can strip its permissions. Delete the only admin's role → lockout. → **BLOCKER.**
3. **Typo'd guard string silently 403s** — `verifyToken("prodct_update")` → `roleData[undefined]` =
   falsy → 403 for everyone incl. super-admin, no error. Only found by testing. → **HIGH.**
4. **4-place hand-sync (the root rot)** — adding a module = edit role.interface + role.model +
   permissionData.js + the route string, across 3 repos. Miss one → schema-only flag (no UI) or
   UI-only flag (backend ignores it). This is what the owner sensed.
5. **`specification_*` (4 flags)** — retired module, dead schema weight. → MEDIUM (cosmetic $unset later).

### M1b. What is FINE — keep it, do NOT rewrite
- ✅ **Per-route `verifyToken("flag")` middleware** — correct pattern (NOT login-service-level; perms
  must be checked per-request so mid-session deactivation is caught).
- ✅ **Fresh DB lookup every request** — `verify.token.ts` does `AdminModel.findById().populate("role_id")`
  every request, not trusting the cached JWT. Industry-standard. Keep.
- ✅ **`bootstrap.ts` schema-introspection** — `buildAllPermissionsTrue()` walks `RoleModel.schema.eachPath()`
  to grant the super-admin every Boolean. Adding a schema flag auto-grants it on next sync. Keep + extend.
- ✅ **Boolean-per-flag storage on the role doc** — keep the shape; only change HOW the schema is built.
- ✅ The 5 "unguarded" routes (cart, getme, productFilter, productFeed, metaPixel) are legitimately
  PUBLIC storefront routes — leave them. (Don't accidentally guard them during the rewrite.)

---

## M2. The new system — a permission REGISTRY (single source of truth)

One code manifest; schema + admin UI + guard types + sidebar all DERIVE from it. Industry standard
(Laravel-Spatie / Django / NestJS-CASL / AWS-IAM), adapted to this stack.

### M2a. The registry — `FruitSnacksBackend/src/app/role/permission.registry.ts` (NEW)
```ts
export type PermissionAction = "show" | "create" | "update" | "delete";
export interface ModulePermissions {
  module: string;            // "product"
  label: string;             // "Product" (admin UI grouping)
  actions: PermissionAction[];
  ownerOnly?: boolean;       // OWNER tier — excluded from super-admin bypass
  featureFlag?: string;      // which feature-flag gates this module (sidebar/route, for Step 3)
  extraActions?: { key: string; label: string }[];  // non-standard, e.g. order_create_admin
}

export const MODULE_REGISTRY: ModulePermissions[] = [
  { module:"product", label:"Product", actions:["show","create","update","delete"] },
  { module:"campaign", label:"Campaign", actions:["show","create","update","delete"], featureFlag:"campaign" },
  { module:"order", label:"Orders", actions:["show","update"],
    extraActions:[{key:"order_create_admin", label:"Create POS Order"}] },
  // … all current modules (refactor of today's 96 flags — no flags removed)
];

// OWNER-tier (never grantable by client super-admin):
export const OWNER_REGISTRY = [
  { key:"manage_features",  label:"Feature Management (OWNER only)" },
  { key:"manage_plan_tier", label:"Plan Tier Management (OWNER only)" },
];
```

### M2b. Derive the Mongoose schema — `role.model.ts` (rewrite)
```ts
function buildRoleSchemaFields() {
  const fields = {};
  for (const m of MODULE_REGISTRY) {
    for (const a of m.actions) fields[`${m.module}_${a}`] = { type: Boolean, default: false };
    for (const e of m.extraActions ?? []) fields[e.key] = { type: Boolean, default: false };
  }
  for (const o of OWNER_REGISTRY) fields[o.key] = { type: Boolean, default: false };
  return fields;
}
const roleSchema = new Schema({
  role_name: { type: String, required: true },
  is_protected: { type: Boolean, default: false },   // Super Admin + OWNER → can't delete/edit via UI
  role_publisher_id: { ... }, role_updated_by: { ... },
  ...buildRoleSchemaFields(),
}, { timestamps: true });
```
Runs once at startup; schema is static to Mongoose. **Output is identical to today's 96 fields → zero
DB migration** (no field renamed). `role.interface.ts` can also be derived (no more hand-typed).

### M2c. Derive the Admin UI — a generator script
Pre-V2 (3-app split): `gen-permission-data.ts` reads the registry, writes
`FruitSnacksAdmin/src/data/permissionRegistry.ts` in the exact shape the admin form expects. Run via
`npm run gen:permissions` (wire into `prebuild` so it can't be forgotten — see H4). The admin imports
the GENERATED file → drift impossible. **V2 (FE+Admin merged):** just a local import, no copy.

### M2d. Type-safe guard strings
Generate `permission.keys.ts` → `export type AllPermissionKey = "product_show" | … ;` and type
`verifyToken(permission: AllPermissionKey)`. A typo becomes a COMPILE error instead of a silent 403.

### M2e. Dynamic sidebar (Admin)
Replace ~100 hardcoded `user.role_id.flag` checks with a registry loop:
```
visible = MODULE_REGISTRY.filter(m =>
   (!m.featureFlag || settings.enabled_features?.[m.featureFlag] !== false)  // feature gate (Step 3)
   && m.actions/extra.some(p => user.role_id[p] === true)                    // permission gate
)
```
Sidebar never needs manual edits when a module is added.

### M2f. super-admin bypass + OWNER exclusion
No change to `verifyToken` itself. The separation is at SEED time: `buildAllPermissionsTrue()` EXCLUDES
`OWNER_REGISTRY` keys → super-admin literally never has `manage_features=true` → can't bypass the OWNER
paywall. `buildOwnerPermissions()` sets only owner keys on the OWNER role. `is_owner: Boolean` on the
admin model hides the OWNER account from the client's staff list (controller filters `is_owner:true`).

### M2g. feature-flag vs permission (two-layer, Step 3)
Order: feature-flag FIRST, then permission. Route gets a double guard:
```
router.get("/dashboard", requireFeature("campaign"), verifyToken("campaign_show"), handler)
```
`requireFeature` reads `settings.enabled_features[flag]`; off → 404 (no info leak). The registry's
`featureFlag` field is metadata ready for Step 3; `requireFeature` doesn't exist until then.

### M2h. Storage — keep boolean-per-flag on the role doc
The populated role is already in memory each request; `roleData["flag"]` is one property access. An
array-of-keys would be a linear scan with no benefit. Keep the shape; only the schema-build changes.

---

## M3. ⭐ The new-module developer workflow (the owner's KEY requirement)

Adding a "lookbook" module:
```
1. Registry: add ONE line →
     { module:"lookbook", label:"Lookbook", actions:["show","create","update","delete"], featureFlag:"lookbook" }
2. Run: npm run gen:permissions
3. Run (live DB): npm run bootstrap -- --sync-superadmin   (super-admin gains the 4 new flags, nothing else touched)
4. Write the module's routes with verifyToken("lookbook_show") etc. (type-checked)

AUTO-happens (dev does NONE of this manually):
   ✅ role.model schema gains lookbook_show/create/update/delete (default false)
   ✅ Admin role create/edit UI shows a "Lookbook" section with 4 checkboxes
   ✅ AllPermissionKey type includes the keys (typo = compile error)
   ✅ bootstrap super-admin auto-grants them
   ✅ Sidebar shows Lookbook when the role has lookbook_show
   ✅ Staff roles default to false → 403 until granted via UI
```
The dev does NOT touch role.interface, role.model, permissionData.js, or SideNavBar. **Total manual
permission work = 1 registry line + `gen:permissions`.** This is the whole point.

---

## M4. Phased, live-safe implementation + migration

```
Phase 0 — 2 live security bugs (authentication/dashboard GET + DELETE guards). Single-line. NOW.
Phase 1 — Foundation:
   1a. Create permission.registry.ts (refactor of today's 96 flags — remove none).
   1b. Rewrite role.model.ts → buildRoleSchemaFields(). Output identical → ZERO DB migration.
   1c. Add is_protected; set true on Super Admin (+ later OWNER); controller rejects edit/delete of protected roles. (Fixes BLOCKER B2.)
   1d. gen-permission-data.ts + `npm run gen:permissions` (wire into prebuild). Commit generated file to Admin.
   1e. Add OWNER_REGISTRY; buildAllPermissionsTrue() excludes owner flags; add buildOwnerPermissions().
   MIGRATION: schema field names unchanged → no migration doc. Run bootstrap --sync-superadmin on a
   COPY of the live food DB first, diff role doc field names vs current schema (must match exactly),
   then on live.
Phase 2 — Admin:
   2a. CreateStaffRole/UpDateStaffRole import the generated registry (same shape, no component change).
   2b. SideNavBar → registry-driven loop (featureFlag absent/undefined = enabled, back-compat).
   2c. AllPermissionKey type on verifyToken (existing typos become build errors — fix them).
Phase 3 — Close the 9 FE-only gaps:
   add verifyToken to page_seo_*, customer_* routes. For theme/faq_template/trust_point: the GET is
   public (storefront reads it) → add a guarded /dashboard variant for admin (pattern already used by
   category), don't guard the public GET.
Phase 4 — OWNER tier seeding (prereq for OWNER feature-flag layer):
   bootstrap creates Super Admin (all non-owner) + OWNER (owner flags + is_protected) roles + an OWNER
   admin (is_owner:true, separate creds). Admin-list controller filters is_owner:true. Role-list hides
   owner-only roles unless requester has manage_features.
```

---

## M5. Why NOT ERP-style DB-created modules (owner asked)
ERP "create modules + actions in the Admin (DB-driven)" fits LOW-CODE platforms (Odoo/Frappe/Salesforce)
whose modules are generic CRUD/form-builders. Here a "campaign" module's PAGE is CUSTOM CODE — a DB row
won't create it. So: **code-defined registry (right for custom pages) + DB assignment.** You get every
ERP benefit (dynamic sidebar, dynamic permission, single source) WITHOUT the false promise of
"add a feature with no code". This is the Laravel/Django model — correct for this stack.

---

## M6. Edge-audit (BLOCKERS / HIGH / MEDIUM)

```
🚨 BLOCKERS
   B1. authentication/dashboard GET + DELETE unguarded → SMS creds leak / deletable. → Phase 0, NOW.
   B2. Super Admin role has no delete/edit protection → lockout risk. → Phase 1c (is_protected).
   B3. Migration must dry-run on a COPY of the LIVE food DB first; diff schema field names exactly
       (registry output must equal today's 96 names) before deploying. A name mismatch = silent
       undefined fields = permission loss on the live shop.
⚠️ HIGH
   H1. 9 FE-only permissions → bypassable by direct API call until Phase 3.
   H2. Typo'd guard string = silent 403 until Phase 2 type. New routes hand-verify until then.
   H3. No role-edit concurrency protection (last-write-wins). Fine at single-admin scale; note it.
   H4. `gen:permissions` must be wired into prebuild/git-hook or a dev forgets it → admin UI stale.
🟡 MEDIUM
   M1. specification_* dead flags — omit from registry; one-time $unset later (cosmetic).
   M2. theme/faq_template/trust_point GET is public for storefront → add /dashboard guarded variant,
       don't guard the public GET (else storefront breaks).
   M3. "Super Admin" magic string in bootstrap → is_protected flag replaces name-based special status.
   M4. page_seo PATCH unguarded (admin write open) → Phase 3.
   M5. OWNER account visible in client staff list without is_owner → Phase 4.
```

→ **Escalation:** schema migration on a LIVE shop + auth + 3 apps → already audited by
`architecture-reviewer`; before coding Phase 1, run `security-privacy-reviewer` for a second pass and
ALWAYS dry-run the migration on a DB copy (never first on live).

---

## Files this touches (from the audit)
```
NEW:    role/permission.registry.ts · scripts/gen-permission-data.ts · (generated) permission.keys.ts
        · (generated) Admin/src/data/permissionRegistry.ts
REWRITE: role/role.model.ts (buildRoleSchemaFields) · role/role.interface.ts (derive)
        · middlewares/verify.token.ts (AllPermissionKey type)
        · scripts/bootstrap.ts (exclude OWNER flags; create OWNER role+admin)
EDIT:   authentication/authentication.routes.ts (Phase 0 guards) · page_seo/customer routes (Phase 3)
        · adminRegLog/admin.model.ts (is_owner) · Admin CreateStaffRole/UpDateStaffRole (import)
        · Admin SideNavBar.jsx (registry-driven)
```
