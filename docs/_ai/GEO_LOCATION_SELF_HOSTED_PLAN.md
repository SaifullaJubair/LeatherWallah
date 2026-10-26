# Geo Location — self-hosted division/district/upazila (replaces live Pathao lookup)

**Status:** PLANNED — not started. Owner approved the direction 2026-10-25, deferred to "next" (not now).

## Why

Checkout's City/Zone dropdown (`DeliveryInformation.jsx` + `useGetZoneData` → `GET /setting/zone?city_id=`)
calls Pathao's live `/cities/:id/zone-list` API on every request. This makes checkout itself depend on
Pathao being up, fast, and holding a valid cached token — none of which the customer's order has
anything to do with.

**What actually happened (2026-10-24):** Pathao started rejecting the already-cached OAuth token without
ever 401-ing the `issue-token` call again. `getZoneData` got HTTP 200 back from Pathao with no `data` key,
silently returned `success:true` with nothing — checkout showed "No options" with zero signal why. Only a
manual Coolify restart (which clears the in-memory token cache) fixed it, on both LW and FS.

**Immediate fix already shipped** (2026-10-25, both repos, `main`):
- LW `4a058f0` (surface the real error) + `219f550` (auto-retry with forced token refresh)
- FS (FruitSnacks-port) `4d1d747` (same retry logic, ported same day)

That stops the *symptom* (silent empty data / needing a manual restart) recurring. It does **not** remove
the structural dependency: checkout still cannot render an address picker if Pathao is down, and a
Steadfast-only shop still needs Pathao credentials just to let a customer pick a district.

**The real fix** — seen already working in `ecommerce-core` (`ecommerce-core-backend/src/app/geo/`) — is to
own Bangladesh's administrative geography ourselves and only ever touch Pathao's API once, offline, to pull
their zone list into our own data file. See that repo's `geo.interface.ts` for the full design rationale
(reproduced below, adapted to LW/FS).

## What ecommerce-core already proved (reference, don't re-derive)

Read these directly, they're the working implementation:

- `ecommerce-core/ecommerce-core-backend/src/app/geo/geo.interface.ts` — the "why", courier-support table
- `ecommerce-core/ecommerce-core-backend/src/app/geo/geo.model.ts` — schema (self-referencing tree, courier_refs)
- `ecommerce-core/ecommerce-core-backend/src/app/geo/geo.services.ts` — children/breadcrumb/dedupe/resolve-snapshot logic
- `ecommerce-core/ecommerce-core-backend/src/app/geo/geo.routes.ts` — public `/children` + `/breadcrumb`, admin `/list` + `/mapping`
- `ecommerce-core/ecommerce-core-backend/src/scripts/fetch-pathao-geo.ts` — one-time Pathao pull → checked-in JSON
- `ecommerce-core/ecommerce-core-backend/src/scripts/seed-pathao-zones.ts` — merges Pathao zones into the tree, idempotent
- `ecommerce-core/ecommerce-core-backend/src/data/geo/bd-geo.json` — government admin list (8 div / 64 dist / 494 upazila)
- `ecommerce-core/ecommerce-core-backend/src/data/geo/pathao-geo.json` — Pathao's own city/zone list, pulled once

LW/FS are clones of the same original codebase as ecommerce-core pre-divergence, so the shape transplants
cleanly — this is not a from-scratch design.

## The model, summarized

- One collection, self-referencing tree: `division → district → upazila`, same `parent_id` + `geo_path[]`
  + `depth` pattern already proven by LW's own nested `category` model.
- `source: "government" | "pathao"` — government upazilas (name-matched by Steadfast/Paperfly/eCourier) and
  Pathao's own zones (which don't correspond to real upazilas — Dhaka city corporation alone has 367 Pathao
  zones vs 5 government upazilas) live side by side under the same district. Never collapsed into one list
  by deleting either; de-duplicated only at *display* time (picker hides a government row when a Pathao
  row with the same normalized name exists under the same district — Pathao wins ties because it carries
  a `zone_id` and the government twin doesn't).
- `courier_refs.pathao.{city_id, zone_id}` sits on the row itself, filled in AT SEED TIME by the merge
  script — not looked up live, ever, after that.
- Checkout calls `GET /geo/children?parent=<id>` (our own DB, **no Pathao credentials needed at all**) to
  drive each level of the cascading dropdown.
- At dispatch time (admin clicks "Send to Pathao"), `findCourierRefServices(locationId, "pathao")` walks
  the node then its ancestors until it finds a mapped `city_id`/`zone_id`. An unmapped location just makes
  *that one courier* unavailable for that order — never blocks checkout, never blocks other couriers.

## Migration reality for LW/FS production (VPS)

Purely additive — nothing existing is touched or backfilled:

1. New `geo_locations` collection, created empty by the first seed run.
2. `fetch-pathao-geo.ts` run **once**, against either shop's live Pathao credentials (LW's or FS's — the
   zone list itself is public data, same for any merchant). Output is a checked-in JSON file, committed to
   the repo — after this, the running server never calls Pathao for geography again.
3. Government list (`bd-geo.json`) + Pathao merge (`seed-pathao-zones.ts`) seeded into both LW's and FS's
   production Mongo. Each shop needs the seed run against *its own* database (separate Atlas/Mongo
   instances), but from the *same* checked-in JSON — no second Pathao pull needed for the second shop.
4. Existing `orders` collection: **untouched**. Old orders keep whatever `pathao_city_id`/`pathao_zone_id`
   (or free-text address) they already stored. Only *new* orders placed after the switch snapshot geo via
   the new flow.
5. Per owner's standing rule ("owner doesn't run scripts — Claude does" for core dev, but "ask first" for a
   clone's live DB) — **this seed run against LW's/FS's production Mongo needs explicit go-ahead each time**,
   it is not autonomous like core dev.

No schema change to `orders`, `products`, or `settings` is required to land this — it's new, additive
fields only (e.g. `order.geo_district_id` / `order.geo_upazila_id` alongside, not replacing, the existing
`pathao_city_id`/`pathao_zone_id` fields).

## Pathao-enabled behavior after this lands

Nothing new to "sync" when a shop flips `pathao_enabled` on later — mapping is already baked into the geo
rows from the one-time seed. The flag only gates whether `order.courier.send-to-pathao` is allowed to run;
it reads `courier_refs.pathao` off the location the customer already picked at checkout. If Pathao adds new
zones in the future, re-running `fetch-pathao-geo.ts` + `seed-pathao-zones.ts` (idempotent, matched on
`code`) picks up the delta without touching anything an admin has hand-edited.

## Scope of the LW/FS-specific work (not yet designed in detail — do this at implementation time)

This plan intentionally stops at "what ecommerce-core already proved + what changes for LW/FS specifically."
Before writing code, per CLAUDE.md's Planning Discipline rule (schema change + cross-app + new routes +
order flow → mandatory edge-case audit), run `/edge-audit` covering at minimum:

- **Backend:** new `geo` module (interface/model/services/controllers/routes), new permission flag wiring
  (`site_setting_update` reuse vs new flag — ecommerce-core reused the existing flag deliberately, confirm
  that's still right here), `resolveGeoSnapshotServices` wiring into `postOrder`.
- **Frontend:** `DeliveryInformation.jsx` goes from 2-level (City/Zone) to 3-level (Division/District/Upazila)
  cascading — bigger UI change than it sounds, current `Select` components and `useGetZoneData` hook need
  a rewrite, not a patch. Decide whether Division is even shown to the customer or collapsed (ecommerce-core's
  checkout UX choice should be checked, not assumed).
- **Admin:** does LW/FS get the geo mapping/admin screen too, or is that core-only tooling? (ecommerce-core
  built one; LW/FS are frozen clones, so probably skip the admin UI and just seed once.)
- **Steadfast/other couriers:** confirm LW/FS's `steadfast.service.ts` send payload still gets a sane
  free-text address out of the new structured pick (it should — Steadfast never needed ids).
- **Existing orders / admin order-detail views:** anywhere that currently reads `order.pathao_city_id` /
  renders the old city/zone pair for historical orders must keep working unchanged.
- Owner's "clones are frozen — port nothing" rule means this is a deliberate, scoped **exception** (owner
  explicitly asked for this plan) — confirm scope boundaries again at kickoff, don't let it balloon into
  porting unrelated core features.

## Trigger

Owner said: write the plan now, pick this up "next" — not started yet. No date committed.
