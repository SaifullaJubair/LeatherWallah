# Architecture-Reviewer Agent Notes

## 2026-06-24 — Foresight audit: structural seams before V2 / FE+Admin merge

**Context:** Pre-V2 foresight audit. Owner confirmed platform plan (PLATFORM_ARCHITECTURE.md +
OWNER_FEATURE_FLAG.md + PERMISSION_OVERHAUL.md). Reviewed all 37 Mongoose models. Task:
identify which schema seams are expensive to retrofit post-V2.

### Key decisions / patterns observed

- Settings = 206-field monolith (one doc, one collection). Security already 2-tier (public vs
  secret). Clone-mode: fine. SaaS-mode: must be shop_id-scoped or split. Decision: defer split
  to SaaS phase (documented in SETTINGS_ARCH_DEBT.md).

- `home_section_array` pattern exists on settings — typed subdoc `[{id, enabled, order}]`.
  This is the exact pattern to copy for `pdp_section_array`. No structural blocker to copy it.

- Floating-asset section enum is hardcoded food (hero/order/benefits/use_cases/nutrition/reviews/faq)
  in BOTH theme.model.ts and product.model.ts. MULTI-NICHE-DEBT comment is in both files. This
  must be loosened when pdp_section_array lands — either `type:String` (no enum), or a longer
  enum that covers all niches. The current enum rejects non-food section names at save time.

- Permission schema drift is real and measured: 21 role.model fields vs 98 admin UI checkboxes vs
  83 route strings. The role schema's Mongoose loose-schema behavior means extra fields ARE
  persisted (Mongoose stores fields not in schema when using Mixed implicitly or when strict:false
  is set — but strict mode is DEFAULT true, so fields not in schema are SILENTLY DROPPED on write).
  This means ~62 permissions checked in routes are NOT persisted on role doc rewrites.
  RISK: super-admin role that gets updated via Admin role-edit form will drop those 62 flags.

- Order model has no `currency_snapshot_rate` in orderProducts (it IS on order header as
  `exchange_rate:Number default 1`). Adequate for now but orderProduct line-items carry amounts
  without the rate reference.

- Money fields are all plain Number (no integer-cents discipline). At BDT scale this is fine.
  Multi-currency would need a rethink but that is a V2/international-client concern.

- No `shop_id` / `tenant_id` on any collection. All collections implicitly scoped to the single
  DB (clone-per-client). Landing multi-tenant (Step 6) will require shop_id on ALL queried
  collections unless landing data is isolated per-DB (which defeats the economics).

- Notification module does not exist. Plan (PLATFORM_ARCHITECTURE §17b) says: BE module,
  channel-extensible, shop_id-scoped from day one. Channel seam = `channel: "in_app"` field.

- Soft-delete consistency: most modules use `status: "active" | "in-active"`. Cart and OTP use
  hard delete. Reviews use status + is_seeded + source. No `deleted_at` timestamp anywhere.
  Soft-delete is not queryable for "when was it deactivated" — useful for analytics/audit.

- Audit trail: `_publisher_id` + `_updated_by` pattern exists on most models. No `updated_at`
  field for the operation itself (timestamps: true gives doc createdAt/updatedAt but not
  per-field history). For compliance (e.g. who changed an order status and when) there is no
  dedicated audit log.

- Slug history: product has `product_slug_history: [String]` — good for SEO redirects.
  Category has `category_slug` but NO slug_history. PageSeo has `page_key` (stable key) +
  `path` — path is the actual URL, key is stable. No 301-redirect support for category slugs
  if renamed.

- Variation price: `variation_price` is absolute (not delta from base). `variation_price_delta`
  field also exists — creates dual-path confusion. Price resolver must be the single source.

- `admin_country` defaults "Bangladesh" hardcoded. `user_country` defaults "Bangladesh".
  These are non-critical clone-config fields; swap via bootstrap, not a structural issue.

- OrderProduct snapshot: `product_name_snapshot`, `product_image_snapshot` wired.
  `variation_name_snapshot` is NOT present (only variation_id + variation_sku_snapshot).
  If variation is deleted/renamed, order history loses the variation display name.

- `customer_group` on user model supports retail/wholesale/vip. `group_prices` array on product
  supports wholesale/vip pricing. The group enum on product is narrower than user's enum —
  if a new group type is added (e.g. "influencer"), both must be updated in sync.

- Notification (new): proposed shape `{ type, channel, target_role, payload, read, shop_id }`.
  `payload` as Mixed/Object is correct for extensibility. `channel` field is the SaaS seam.
  `shop_id` is the tenancy seam. Both should be on the initial schema even if only "in_app"
  and implicit shop are used at first.

### Structural risks by priority (this session)

P1 — SEAM-NOW: shop_id on at least settings, orders, users, products for landing-tier SaaS.
  Without it, adding multi-tenancy later = full-collection migration + every query must be
  retouched. Minimum viable: nullable ObjectId on the 5 highest-traffic collections.

P2 — SEAM-NOW: notification module with channel + shop_id from the start (cheap to add now,
  painful to bolt channel-extensibility in after the first admin-only impl is in prod).

P3 — SEAM-NOW: pdp_section_array in settings (mirrors home_section_array, zero schema cost).
  Unlocks the niche preset work without any migration later.

P4 — SEAM-NOW: floating section enum loosened (String, not enum) so non-food section names
  don't get rejected when fashion/electronics PDP sections appear. This is a 1-line change to
  two models (theme + product) but requires a plan for existing food enum values.

P5 — SEAM-NOW: enabled_features + plan_tier on settings. These are additive fields to the
  existing settings doc. Cost = 2 fields now, avoids a migration when OWNER layer ships.

P6 — SAFE-TO-DEFER: i18n content fields. Going from String to translatable sub-doc is large
  churn. No international clients yet. Extract only during V2 FE rewrite when strings are
  already being touched. DB seam would be a `translations` Mixed sub-doc but even that
  requires defining the pattern consistently — safer to do it as a V2 task.

P7 — SAFE-TO-DEFER: money precision (integer cents). BDT is a whole-number currency; no
  sub-unit risk. Only matters for multi-currency with fractional rates.

P8 — SEAM-NOW (cheap): variation_name_snapshot on orderProduct. One nullable String field.
  Makes order history self-contained if variation is later renamed/deleted.

P9 — STRUCTURAL (permission overhaul): the 21 vs 98 vs 83 drift means role doc PATCH via
  admin form silently drops ~62 permissions. This is a live bug today, not a future seam.
  Addressed by PERMISSION_OVERHAUL.md (Step 1.5).

P10 — SAFE-TO-DEFER: soft-delete deleted_at timestamp. Useful for analytics but no current
  business requirement driving it. Add if compliance/audit requirement emerges.

---

## 2026-06-24 — Permission/RBAC full greenfield design audit

**Context:** Owner requested full greenfield RBAC design. Explored all 3 apps in depth.
Measured exact counts from code (not docs):

### Verified measurements
- role.model.ts Boolean flags: **96** (not 21 as older notes said — those 21 were the initial
  first commit; the schema has been growing)
- permissionData.js entries: **98** (2 show-only flags defined but commented out from older modules)
- route-guard distinct strings: **83**
- PermData entries visible in Admin UI (not commented): **92** (6 flags in commented-out spec block)

### Exact drift map
**Schema has but NO route uses (13 flags — schema overhead):**
- specification_post/delete/update/show (retired module, kept for back-compat but no routes)
- page_seo_show, page_seo_update (in schema + permData but NO route uses them — routes use them but wait, verified below)
- customer_create/update/delete/show (in schema + permData but NO route guards them — routes exist but use user_*/customer_* flags see below)
- theme_show (schema + permData but all theme routes use theme_create/update/delete, not theme_show for read)
- faq_template_show (schema + permData, but GET faq_template routes have NO guard — publicly readable!)
- trust_point_show (schema + permData, but GET trust_point route has NO guard — publicly readable!)

**Routes but NOT schema:** NONE. Current schema (96 flags) is a superset of all route strings.
This means the Mongoose strict:true silent-drop issue from the earlier audit is RESOLVED — the schema
already covers all 83 route permission strings. The earlier "21 vs 83 gap" was a stale count.

**PermData but NOT routes (9 flags — UI shows checkboxes but no route uses them):**
- page_seo_show, page_seo_update (admin pages check user.role_id.page_seo_show on FE side only — no BE route guard)
- theme_show, faq_template_show, trust_point_show (FE-only gate, no BE guard)
- customer_create, customer_update, customer_show, customer_delete (FE-only, no BE route uses these flags)

### Critical actual bug (corrected from earlier notes)
The original "21 fields → silent drop" concern was true at an early state. The current role.model.ts
has 96 Boolean fields, which is a SUPERSET of all 83 route strings. So the Mongoose strict-drop
of route-permission-flags is NOT happening today. The REMAINING real bugs are:
1. 9 flags (page_seo_*, customer_*, theme_show, faq_template_show, trust_point_show) exist in both
   schema and permData but have NO backend route guard. Backend routes for these features either
   have no guard at all (publicly readable — faq_template GET, trust_point GET, theme GET) or rely
   only on FE-side checks. A direct API call bypasses the admin permission entirely.
2. specification_* flags are dead schema weight (module retired). Wasting space in every role doc
   and cluttering the admin UI.
3. The Admin role create/update form only sends the 92 flags in permissionsData — NOT the 4 
   specification_* flags (commented out) and NOT the schema-only-no-UI flags. If a flag is in
   schema but absent from permData, a role-update SETS IT TO FALSE because the update sends
   explicit false for all permData flags but leaves out schema-only flags (updateOne with the
   permData payload sets them to false via the update object). This is the actual silent-drop vector.

### Public route audit (the "5 unguarded" from docs)
All 5 confirmed legitimate public/customer routes:
- cart routes: verifyUserToken (customer JWT, not admin RBAC) — correct
- getme: GET is fully public (no auth), PATCH uses verifyUserToken — correct for storefront
- productFilter: public — correct (customer search)
- productFeed: public XML feed — correct
- metaPixel: public event endpoint — correct (browser-side pixel events, no sensitive data)
Additional unguarded but intentionally public:
- authentication.routes.ts GET /dashboard (reads SMS config) — CONCERN: exposes SMS/OTP config publicly
- faq_template GET / and /:id — legitimately public (FE storefront reads FAQ templates)
- theme GET / and /:id — legitimately public (FE PDP reads theme data)
- trustPoint GET — legitimately public (FE storefront reads trust points)
- order /order_tracking POST — public (customer tracks own order by phone)
- order /single_order POST — public (customer places order)
- review GET endpoints — public (customer reads reviews)

### The one genuine security gap
authentication.routes.ts line 22: GET /api/v1/authentication/dashboard has NO guard. This reads
the SMS/OTP configuration document. Currently this doc contains: sms_api_key, sms_password, 
sms_sender_id fields (the BulkSMS credentials). This is a REAL data leak — any browser can
GET this endpoint without being logged in and read the SMS provider credentials.
File: c:/Coding/Perosnal/FruitSnacks/FruitSnacksBackend/src/app/authentication/authentication.routes.ts line 22

### Architecture decisions for the new system

**Registry location:** `FruitSnacksBackend/src/app/role/permission.registry.ts` — a single TS
const exported from the BE. The Admin imports this as a copied/generated file
(`FruitSnacksAdmin/src/data/permissionRegistry.ts`) because V2 merges FE+Admin into one Next app,
so the copy becomes a local import. Pre-V2: a simple build-step script copies it.

**Storage model:** keep boolean-per-flag on the role doc (NOT an array of strings). Reason:
Mongoose populate already puts the role doc on req.user.role_id; the guard is a single property
lookup `roleData[permission]`. Array-of-strings needs `includes()` on every request — negligible
but no gain. Boolean map is also self-documenting in DB. Only change: role schema derived from
registry, not hand-written.

**OWNER tier:** a separate `OWNER_PERMISSIONS` const in the same registry, with flags like
`manage_features`, `manage_plan_tier`. These are EXCLUDED from `buildAllPermissionsTrue()` in
bootstrap (super-admin does NOT get them). OWNER role gets ONLY these flags. `is_owner: Boolean`
on admin model added as seam (architecture-reviewer P7, 2026-06-24).

**No-schema-drift mechanism:** registry defines the shape; a `generateRoleSchema()` function
builds the Mongoose SchemaDefinition from it programmatically. role.model.ts calls this function
instead of hand-writing 96 Boolean fields. When a dev adds a module to the registry, the schema,
the permData equivalent, and the valid guard strings all update automatically.
