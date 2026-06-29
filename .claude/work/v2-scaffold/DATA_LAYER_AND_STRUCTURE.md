# V2 Admin — Data Layer + Folder Structure Guide (LOCKED)

> Written session 57 (2026-06-29). This is the **authoritative coding guide** for how every admin
> feature in `ecommerce-core-web` fetches data, does CRUD, caches, and is laid out on disk. Read this
> BEFORE writing any feature. Pairs with `.claude/work/v2-scaffold/PLAN.md` (the scaffold steps) and
> master plan §22 + state doctrine §2d.
>
> **Goal owner stated:** admin has ~40 routes, each with table + filters + CRUD. Without ONE locked
> pattern the site drifts into 40 different styles. This doc locks the single repeatable contract so
> EVERY CRUD page looks/behaves identically and a new feature = fill ~6 small files, not re-architect.

---

## 0. Decisions locked (the spine)

| # | Decision | Value |
|---|----------|-------|
| D1 | Admin data fetching | **Client-side TanStack Query** — NOT RSC/SSR. (Admin is login-gated, no SEO; needs filter/sort/optimistic interaction.) |
| D2 | Storefront data fetching | RSC `fetch` (SEO). Admin never does `await fetch` in a page. |
| D3 | RTK Query | **Never used.** Redux = storefront cart/UI only. |
| D4 | CRUD code | **Hybrid factory:** `makeCrudHooks(resource)` covers ~80% simple resources in ~1 line; complex resources (Product wizard, multi-step, FormData + sub-entity sync) **extend** the factory with custom hooks. |
| D5 | Mutations | **Optimistic update** (instant UI + rollback on error) for add/update/delete — owner chose "do it right even if longer." |
| D6 | Caching | TanStack global: `staleTime 30s`, `gcTime 60s`, `refetchOnWindowFocus:false`, `refetchOnReconnect:false`. (Validated against bridge-to-bangladesh production.) detail `staleTime 60s`. |
| D7 | Tables | TanStack Table + **server-side** pagination/sort/filter/search, URL-synced (catalog has 1000s of rows). |
| D8 | Forms | RHF + Zod. Small resource (brand/category) → **Modal**; large resource (Product ~30 fields) → **full-page route**. |
| D9 | shop_id | **Seam now, dormant.** One header in api-client + one dimension in query-key → multi-tenant conversion later touches ZERO feature code. |
| D10 | Types | TS everywhere. Canonical DTO + Zod schema in `packages/types`, shared BE↔FE. No `result?.data?.data?.id` guessing — standardized response envelope (§17d D5). |
| D11 | API transport | `fetch`-based typed `apiClient` (not axios). credentials:include for cookie auth. |
| D12 | NOT adopting from references | No offline/IndexedDB layer (bridge has it — not needed for admin). No `keepPreviousData:true` (deprecated → use `placeholderData: keepPreviousData`). No copy/dead files. |

**Why hybrid factory (D4) over pure-explicit (bridge style) or pure-factory:**
- Pure explicit (bridge): every resource = ~130-line hand-written hook → 40× boilerplate + drift. Rejected.
- Pure factory: 1 line each, but can't express Product-wizard / campaign-event-sync complexity. Rejected.
- **Hybrid:** factory is the BASE (brand/category/coupon/supplier/etc. = 1 line); complex resources call
  the factory for the plumbing and add custom mutation logic on top. Best of both — proven-pattern
  flexibility, minimal boilerplate.

---

## 1. The two layers (engine vs feature)

### Layer A — SHARED ENGINE (written ONCE in scaffold, every feature reuses)
```
src/
├── lib/
│   ├── api-client.ts          # typed fetch: base URL, credentials, error-envelope→throw, shop_id seam
│   └── crud-factory.ts        # makeCrudApi<T>(resource) → {list,get,create,update,remove}
├── hooks/
│   ├── useDataTable.ts        # URL-synced server-side page+sort+filter+search+rowSelection (TanStack Table)
│   ├── use-mobile.ts · use-media-query.ts · use-file-upload.ts
│   └── crud/
│       └── useCrud.ts         # makeCrudHooks<T>(resource) → {useList,useDetail,useCreate,useUpdate,useDelete}
│                              #   + optimistic add/update/delete + invalidate + toast (D5/D6)
├── components/
│   ├── ui/                    # shadcn primitives (the 27)
│   └── data-table/            # DataTable · Toolbar · Pagination · ColumnHeader · FacetedFilter · RowActions · TableSkeleton
├── shared/
│   ├── CrudPageShell.tsx      # page wrapper: title + Add btn + StatsCards + Toolbar + Table + modal state
│   ├── ResourceFormModal.tsx  # generic Dialog + RHF + Zod wrapper
│   ├── DeleteConfirmDialog.tsx· StatsCards.tsx · EmptyState.tsx · ErrorState.tsx
│   └── toast.ts               # ONE toast contract
├── packages/
│   ├── types/                 # canonical DTO + Zod per resource (brand.ts, category.ts, …) — BE↔FE shared
│   ├── lib/                   # cn, currency, phone, price-resolver, tweakcn token-parser, track()
│   └── ui/                    # cross-app primitives (storefront + admin share)
├── providers/
│   ├── QueryProvider.tsx      # TanStack QueryClient (the D6 defaults live here)
│   ├── ThemeProvider.tsx      # admin chrome color theme + next-themes day/night
│   └── ReduxProvider.tsx      # storefront cart only
└── config/
    └── adminNav.ts            # config-driven NAV_SECTIONS (title,url,icon,perm,children?) — sidebar source
```

### Layer B — PER-FEATURE (every CRUD resource = these ~7 files, identical mold)
```
src/features/<area>/<resource>/
├── <resource>.types.ts        # (1) DTO + Zod  (re-export from packages/types)
├── <resource>.api.ts          # (2) makeCrudApi("<resource>")            ~1 line (+ custom calls if complex)
├── <resource>.hooks.ts        # (3) makeCrudHooks("<resource>")          ~1 line (+ custom hooks if complex)
├── <resource>.columns.tsx     # (4) ColumnDef<T>[]  — which columns + row actions
├── <resource>.filters.ts      # (5) filter config   — which faceted filters
├── <Resource>FormModal.tsx    # (6) RHF+Zod form fields (Modal; OR a /new + /[id]/edit page if large)
└── <Resource>sPage.tsx        # (7) <CrudPageShell> wiring the 6 pieces
```
Route entry is thin:
```
src/app/[locale]/(admin)/admin/<area>/<resource>/
├── page.tsx      # renders <ResourcesPage/> — NO data fetch here
├── loading.tsx   # <TableSkeleton/>
└── error.tsx     # <ErrorState/>
```

**Rule of thumb:** new CRUD page ⇒ write columns + form fields + filter config. Everything else is free.

---

## 2. Reference code for the SHARED ENGINE

### 2.1 `lib/api-client.ts`
```ts
import { ApiError } from "./errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL!; // http://localhost:5000/api/v1

export async function apiClient<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const shopId = getActiveShopId(); // D9 seam: null in clone mode (BE infers shop from cookie/subdomain)
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",                         // fruit_snacks_token cookie (D11)
    headers: {
      "Content-Type": "application/json",
      ...(shopId ? { "X-Shop-Id": shopId } : {}),   // dormant today; flips on for multi-tenant
      ...opts.headers,
    },
    ...opts,
  });
  const json = await res.json().catch(() => ({}));
  // §17d D5 envelope: success+error share one shape. Error → throw the typed `error{code,message,details}`
  // + requestId for log tracing (UI stops string-matching messages). See §9.
  if (!res.ok || json.success === false) throw new ApiError(json.error, res.status, json.requestId);
  return json.data as T;        // list helpers also read json.meta → Paginated<T>.meta
}

// Today returns null (clone = single shop). Multi-tenant day: resolve from subdomain/context.
function getActiveShopId(): string | null { return null; }
```
> Note: for `multipart/form-data` (image upload) drop the JSON Content-Type so the browser sets the
> boundary — `apiClient` accepts an `opts.body` of `FormData` and strips the header in that case.

### 2.2 `lib/crud-factory.ts`
```ts
import { apiClient } from "./api-client";

export interface ListParams { page: number; limit: number; sort?: string; search?: string; filters?: Record<string,string>; }
// Pagination comes from the §17d D5 envelope `meta` (NOT a separate `pagination` key). See §9.
export interface Paginated<T> { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean }; }

export function makeCrudApi<T>(resource: string) {
  return {
    list:   (p: ListParams)              => apiClient<Paginated<T>>(`/${resource}?${toQuery(p)}`),
    get:    (id: string)                 => apiClient<T>(`/${resource}/${id}`),
    create: (body: Partial<T> | FormData)=> apiClient<T>(`/${resource}`,       { method:"POST",  body: asBody(body) }),
    update: (id: string, body: Partial<T> | FormData) => apiClient<T>(`/${resource}/${id}`, { method:"PATCH", body: asBody(body) }),
    remove: (id: string)                 => apiClient<void>(`/${resource}/${id}`, { method:"DELETE" }),
  };
}
```

### 2.3 `hooks/crud/useCrud.ts` — the caching + OPTIMISTIC CRUD (D5/D6), written once
```ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { makeCrudApi, ListParams } from "@/lib/crud-factory";
import { toast } from "@/shared/toast";

export function makeCrudHooks<T extends { id: string }>(resource: string) {
  const api  = makeCrudApi<T>(resource);
  const root = [resource] as const;                    // D9: later → [resource,{shop}]
  const listKey   = (p: ListParams) => [resource, "list", p] as const;
  const detailKey = (id: string)    => [resource, "detail", id] as const;

  const useList = (p: ListParams) =>
    useQuery({
      queryKey: listKey(p),
      queryFn: () => api.list(p),
      placeholderData: keepPreviousData,               // smooth paging (D12: not keepPreviousData:true)
      staleTime: 30_000,                               // D6
    });

  const useDetail = (id?: string) =>
    useQuery({ queryKey: detailKey(id!), queryFn: () => api.get(id!), enabled: !!id, staleTime: 60_000 });

  // ---- OPTIMISTIC mutations (D5) ----
  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: api.create,
      // (create: no row id yet → invalidate-only is fine; optimistic mainly pays off on update/delete)
      onSuccess: () => { qc.invalidateQueries({ queryKey: root }); toast.success("Created"); },
      onError: (e) => toast.error(e.message),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<T> }) => api.update(id, body),
      onMutate: async ({ id, body }) => {
        await qc.cancelQueries({ queryKey: root });
        const prev = qc.getQueriesData({ queryKey: root });
        // patch every cached list + the detail optimistically
        qc.setQueriesData({ queryKey: root }, (old: any) =>
          patchRowInCache(old, id, body));
        return { prev };
      },
      onError: (e, _v, ctx) => { ctx?.prev?.forEach(([k, d]) => qc.setQueryData(k, d)); toast.error(e.message); },
      onSettled: () => qc.invalidateQueries({ queryKey: root }),
      onSuccess: () => toast.success("Updated"),
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: api.remove,
      onMutate: async (id: string) => {
        await qc.cancelQueries({ queryKey: root });
        const prev = qc.getQueriesData({ queryKey: root });
        qc.setQueriesData({ queryKey: root }, (old: any) => removeRowFromCache(old, id));
        return { prev };
      },
      onError: (e, _id, ctx) => { ctx?.prev?.forEach(([k, d]) => qc.setQueryData(k, d)); toast.error(e.message); },
      onSettled: () => qc.invalidateQueries({ queryKey: root }),
      onSuccess: () => toast.success("Deleted"),
    });
  };

  return { useList, useDetail, useCreate, useUpdate, useDelete, keys: { root, listKey, detailKey } };
}
```
> `patchRowInCache` / `removeRowFromCache` are small shared helpers (in `lib/cache-utils.ts`) that know
> the `Paginated<T>` shape, so optimistic logic is written ONCE, not per-feature.

### 2.4 `providers/QueryProvider.tsx` — caching defaults (D6) in ONE place
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, gcTime: 60_000,
      refetchOnWindowFocus: false, refetchOnReconnect: false, retry: 1,
    },
  },
});
```

---

## 3. Reference code for a FEATURE (Brand — the simple case)

```ts
// brand.types.ts
export type { Brand } from "@/packages/types/brand";
export { brandSchema } from "@/packages/types/brand";       // Zod (shared)

// brand.api.ts
import { makeCrudApi } from "@/lib/crud-factory";
import type { Brand } from "./brand.types";
export const brandApi = makeCrudApi<Brand>("brand");         // ← 1 line

// brand.hooks.ts
import { makeCrudHooks } from "@/hooks/crud/useCrud";
import type { Brand } from "./brand.types";
export const brandHooks = makeCrudHooks<Brand>("brand");     // ← 1 line: cached list/detail + optimistic CRUD

// brand.filters.ts
export const brandFilters = [
  { key: "status", label: "Status", options: [{ value:"active", label:"Active" }, { value:"inactive", label:"Inactive" }] },
];

// brand.columns.tsx  → ColumnDef<Brand>[] with logo, name, status badge, <DataTableRowActions onEdit onView onDelete/>

// BrandFormModal.tsx → <ResourceFormModal schema={brandSchema}> name + logo upload + status </>

// BrandsPage.tsx
export default function BrandsPage() {
  return (
    <CrudPageShell
      title="Brands"
      hooks={brandHooks}
      columns={brandColumns}
      filters={brandFilters}
      FormModal={BrandFormModal}
      stats={["total","active","inactive"]}
      searchPlaceholder="Search brands…"
    />
  );
}
```
**Category** = identical 7 files; deltas only: `parent_id` in types/form/columns, a parent-category
faceted filter. That's the whole "feature."

---

## 4. The COMPLEX case (escape hatch — D4 hybrid)

When a resource needs more than plain REST (Product create wizard; campaign that syncs sub-entities;
multipart FormData builders), DON'T abandon the factory — extend it:

```ts
// product.hooks.ts
const base = makeCrudHooks<Product>("product");              // reuse list/detail/delete/caching

export const productHooks = {
  ...base,
  // override create/update with the multi-step / FormData / sub-entity logic, but keep the SAME
  // query keys (base.keys.root) so cache + optimistic stay consistent
  useCreateWizard() { /* build FormData, POST, then PATCH images/variations, invalidate base.keys.root */ },
};
```
Rules for the escape hatch:
- Reuse `base.keys` so invalidation matches the rest of the system.
- Keep the toast + error contract identical.
- Custom API calls live in `<resource>.api.ts` alongside the factory api (e.g. `product.api.ts` also
  exports `patchProductImages`, `syncVariations`).
- A large form is a **route** (`/admin/catalog/products/new`, `/[id]/edit`) not a modal (D8).

---

## 5. End-to-end data flow (with caching + optimistic)
```
LIST    page → useDataTable() reads URL {page,sort,filters,search}
             → brandHooks.useList(params)
             → cache miss → apiClient → BE GET /brand?page=…  → cache ["brand","list",params] (fresh 30s)
             → change filter → new key → new fetch (old cache kept; back = instant via placeholderData)

ADD     create.mutate(values) → POST /brand → invalidate ["brand"] → list refetch → new row appears

EDIT    update.mutate({id,body})
             → onMutate: patch row in EVERY cached list + detail INSTANTLY (optimistic)
             → PATCH /brand/:id → onError: rollback → onSettled: invalidate → reconcile

DELETE  remove.mutate(id)
             → onMutate: row vanishes instantly → DELETE /brand/:id → error? row returns → settled: invalidate
```

---

## 6. What we deliberately took / rejected from the references
| From | Took | Rejected |
|------|------|----------|
| **bridge-to-bangladesh** (Next admin, prod) | 3-layer (service/query-hook/component), per-resource query-key + invalidate-on-mutation, 30s/60s stale + focus/reconnect off, toast+close wiring, config-driven `perm` nav | per-resource hand-written 130-line hooks (→ factory), JS/untyped response-shape guessing (→ TS+envelope), no optimistic (→ add it), `keepPreviousData:true` deprecated, offline/IndexedDB layer, copy/dead files |
| **common-ecommerce-admin** (Vite demo) | shadcn new-york + 27 primitives, DataTable/Toolbar/Pagination/Skeleton design, feature-folder pattern, color-theme dropdown (Tier-1) | fakeData/console.log stubs, RTK/RTK-Query, React Router, `useState(()=>{},[])` bug, copy files |

---

## 7. Checklist — adding a new CRUD feature (the repeatable ritual)
1. `packages/types/<resource>.ts` — DTO + Zod schema.
2. `features/<area>/<resource>/` — the 7 files (api+hooks ~1 line each via factory).
3. Route folder — `page.tsx` (renders the Page) + `loading.tsx` + `error.tsx`.
4. Add a line to `config/adminNav.ts` (`{title,url,icon,perm}`) — sidebar + access auto-update.
5. Confirm: table loads, filter/sort/search hit BE, add/edit/delete optimistic + toast, skeleton + empty + error states render.
6. If complex (wizard/FormData/sub-entity) → escape hatch (§4), still reusing factory keys + contracts.

> If a page can't be expressed in this mold, that's a signal to improve the SHELL/factory once — not to
> hand-roll a one-off. Keep the 40 routes converging on one pattern.

---

## 8. TanStack official-alignment (LOCKED — from the tanstack-query + tanstack-table skills, session 57)

Read both official skills and reconciled this doc against them. Our key/optimistic/caching design
already matches the official guidance (hierarchical keys, cancel→snapshot→set→rollback→settled,
`placeholderData: keepPreviousData` not the deprecated `keepPreviousData:true`, invalidate-after-mutate
even with optimistic, focus/reconnect off). These 6 refinements are now MANDATORY in the engine:

### 8.1 Build the factory on the `queryOptions` helper (TanStack #1 best practice)
Don't hand-write `useQuery({queryKey, queryFn})` per call. The factory exposes typed `queryOptions`
objects so the SAME options are reused by `useQuery`, `prefetchQuery`, `ensureQueryData`,
`invalidateQueries`, and (storefront) RSC prefetch — one source of key+fn.
```ts
import { queryOptions } from "@tanstack/react-query";

export function makeCrudHooks<T extends { id: string }>(resource: string) {
  const api = makeCrudApi<T>(resource);

  const listOptions = (p: ListParams) =>
    queryOptions({
      queryKey: [resource, "list", p] as const,
      queryFn: () => api.list(p),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    });

  const detailOptions = (id: string) =>
    queryOptions({
      queryKey: [resource, "detail", id] as const,
      queryFn: () => api.get(id),
      staleTime: 60_000,
    });

  const useList   = (p: ListParams)   => useQuery(listOptions(p));
  const useDetail = (id?: string)     => useQuery({ ...detailOptions(id!), enabled: !!id });
  // …optimistic useCreate/useUpdate/useDelete as in §2.3, keyed off [resource]
  return { useList, useDetail, listOptions, detailOptions, /* …mutations, keys */ };
}
```
Benefit: storefront RSC can `queryClient.prefetchQuery(brandHooks.listOptions(p))` later with the exact
same key the admin client uses — zero drift.

### 8.2 `useDataTable` server-side mode — explicit `manualX` + `pageCount`, drop client row models
For server-driven tables (the default for catalog-scale data): set the `manual*` flags and **do NOT
import** `getSortedRowModel`/`getFilteredRowModel`/`getPaginationRowModel` (importing them makes the
table re-process data the server already sorted/filtered → wrong + slow).
```ts
const table = useReactTable({
  data, columns,
  manualPagination: true, manualSorting: true, manualFiltering: true,
  pageCount: serverPageCount,                 // from API pagination.lastPage
  state: { sorting, columnFilters, pagination, rowSelection, columnVisibility },
  onSortingChange: setSorting, onPaginationChange: setPagination,
  onColumnFiltersChange: setColumnFilters, onRowSelectionChange: setRowSelection,
  onColumnVisibilityChange: setColumnVisibility,
  getCoreRowModel: getCoreRowModel(),         // ONLY this row model in server mode
  getRowId: (row) => row.id,                  // see 8.4
  autoResetPageIndex: false,                  // server controls paging; don't auto-reset on data change
});
```
`useDataTable` keeps a `mode: "server" | "client"` switch; client mode (small static lists, e.g. a
settings enum) adds the three row models back. Default = server.

### 8.3 `data` and `columns` MUST be referentially stable (top TanStack-table pitfall)
Inline `data`/`columns` = new reference every render = infinite re-render loop.
- **columns:** module-level `const xColumns = [...]` (or `useMemo([], [])` if they need handlers — pass
  handlers via table `meta`, not closure, to keep columns stable).
- **data:** `const data = useMemo(() => query.data?.data ?? [], [query.data]);`
This is a hard rule for every `*.columns.tsx` and every Page.

### 8.4 `getRowId: (row) => row.id` is mandatory
Stable row identity by business id (not array index). Our optimistic `patchRowInCache` /
`removeRowFromCache` (§2.3) rely on matching `row.id`; row-selection persistence across pages relies on
it too. Every table sets it.

### 8.5 Column `meta` + module augmentation — typed once in the engine
Standardize per-column concerns (alignment, filter variant, header label) via typed `meta`, declared
ONCE so all 40 tables share it (no per-feature ad-hoc styling):
```ts
// in components/data-table/types.ts
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "center" | "right";
    filterVariant?: "text" | "select" | "range";
  }
  interface TableMeta<TData> {
    onEdit?: (row: TData) => void;
    onView?: (row: TData) => void;
    onDelete?: (row: TData) => void;     // row-action handlers via meta keeps columns stable (8.3)
  }
}
```
`DataTableRowActions` reads `table.options.meta.onEdit/...`; `*.columns.tsx` stay pure data + meta.

### 8.6 `gcTime` must be ≥ `staleTime` (cache-eviction pitfall)
If `staleTime > gcTime`, "fresh" data gets garbage-collected before it goes stale. Our global
`staleTime 30s / gcTime 60s` is fine. But `detail` uses `staleTime 60s` against a global `gcTime 60s`
(equal — borderline). Fix: bump detail-scope `gcTime` (e.g. `5 * 60_000`) wherever detail `staleTime`
is raised. General rule baked into the factory: detail `gcTime` = `max(detail.staleTime * 5, 5min)`.

### Net effect on the per-feature mold
None of this changes the 7-file feature surface — Brand/Category still `makeCrudHooks("x")` in 1 line.
These refinements live entirely inside the SHARED ENGINE (factory + `useDataTable` + data-table types),
written once. The features just inherit correct, official-grade behavior.

---

## 8.7 Table feature matrix (LOCKED — what the engine ships)

TanStack Table is headless → all 20 features are AVAILABLE. The decision is what `useDataTable` wires
day-1 vs what stays a capability the engine can switch on per-feature. Built into the SHARED ENGINE
once; features opt in via flags. (Owner: include all of Tier-1; pull in as much of Tier-2 as feasible;
**row drag-reorder is Tier-1, not optional.**)

### Tier 1 — wired in `useDataTable` from day-1 (every CRUD table gets these)
| Feature | Why it's day-1 | How |
|---|---|---|
| Sorting (multi) | core | server `manualSorting` |
| Column filter | core | `DataTableFacetedFilter` + server `manualFiltering` |
| Global search | core | toolbar search → server `?search=` |
| Pagination | core | server `manualPagination` + `pageCount` |
| Row selection + bulk action | bulk delete/export | `enableRowSelection` + `getRowId` |
| Column visibility | dense admin tables | `columnVisibility` state + toggle menu |
| Faceted filter values+count | filter dropdowns | `getFacetedUniqueValues` (client) / API facets (server) |
| **Column pinning** | wide tables → freeze actions right, name left | `columnPinning` `{left,right}` + `getLeft/Right/CenterVisibleCells` |
| **Row expanding** | order → line items, detail-in-row | `getExpandedRowModel` + detail-row render |
| **Sub-rows / hierarchical tree** | **nested category parent→child** (FruitSnacks has nested categories) | `getSubRows: r => r.children` + expand toggle + indent |
| **Row drag-and-drop reorder → save position** | **manual ordering** (category, attribute values, home sections, banners, variation matrix — owner-required, see [[variation-reorder-backlog]]) | `@dnd-kit/core`+`/sortable` over TanStack row order; on drop → recompute `position`/`display_order` → optimistic reorder in cache → `PATCH /<resource>/reorder` (batch ids). Built as a shared `<SortableDataTable>` / `useRowReorder` so EVERY orderable table reuses it. |
| Column meta (align/filterVariant) | typed once | module augmentation (§8.5) |
| `getRowId` | optimistic + selection identity | `getRowId: r => r.id` (§8.4) |

### Tier 2 — capability slots in the engine, OFF by default, switch on per-feature when a real need lands
(Engine leaves the seam/flag; we DON'T build the UI until a feature needs it — master §17 "no
abstraction before concrete." Listed so we know it's reachable, not free-floating.)
| Feature | Turn on when | Note |
|---|---|---|
| Virtualization (`@tanstack/react-virtual`) | a list must show 1000s of rows un-paginated | engine `mode` already supports; add virtual row renderer |
| Editable cells (inline) | stock/price quick-edit grids | table `meta.updateData` pattern; optimistic via factory |
| Column resizing | user-resizable wide tables | `enableColumnResizing` + resize handle |
| Column ordering (drag header) | user-customizable column order | `columnOrder` state + dnd-kit on headers (reuses the dnd-kit dep we already add for row reorder) |
| Grouping + aggregation (sum/avg/count) | report/analytics tables (totals row) | `getGroupedRowModel` + `aggregationFn` |
| Fuzzy filter | client-side typo-tolerant search | `match-sorter-utils`; mostly redundant once search is server-side |

### Engine shape that makes this work
`useDataTable(options)` accepts feature flags so a feature turns things on declaratively, e.g.:
```ts
const dt = useDataTable<Category>({
  mode: "server",
  reorder: true,                 // Tier-1 drag reorder → exposes onReorder(ids)
  tree: { subRows: r => r.children },   // Tier-1 hierarchical
  expand: true,                  // Tier-1 row expand
  pin: { right: ["actions"], left: ["select", "name"] },
  // tier-2 (default off): virtual, editable, resize, columnReorder, grouping
});
```
The `<DataTable>` / `<SortableDataTable>` renderers read these flags. Brand (no reorder/tree) and
Category (reorder + tree) use the SAME hook — just different flags. Still 1-line `makeCrudHooks`; the
table capabilities are config, not new code per feature.

> Dependency note: row drag-reorder (and later column reorder) uses **`@dnd-kit/core` +
> `@dnd-kit/sortable`** — add to the scaffold deps (Phase 0c). This is the same lib the reference
> sidebar/keyboard-DnD craft note (AD-A8) assumed. Reorder endpoint contract: `PATCH /<resource>/reorder`
> body `{ items: [{id, position}] }` — BE updates in one transaction (lock with the BE V2 work).

---

## 9. API CONTRACT FOUNDATION + cross-cutting seams (LOCKED, session 57)

Surfaced by re-reading all V2 plan docs before scaffold (PLATFORM_ARCHITECTURE §17c/§17d, ADMIN/FRONTEND
V2 plans, PERMISSION_OVERHAUL). These are foundation seams that, if not laid now, force a re-test/rewrite
of every slice later (exactly the "BE response change breaks FE+Admin" trap). **Because FE+Admin are
being written FRESH and the BE may be updated freely, we adopt the target shapes NOW and update BE to
match — never the reverse.** The unifying principle: **BE shapes data ONCE; FE+Admin never re-map.**

### 9.1 §17d D5 — standardized response envelope (THE foundation; BE update required)
Every endpoint (success AND error) returns ONE shape:
```jsonc
{
  "success": true,
  "statusCode": 200,
  "message": "Categories fetched",
  "data": <T | T[]>,
  "meta": { "page": 1, "limit": 20, "total": 137, "totalPages": 7, "hasNext": true },
  "error": { "code": "VALIDATION_FAILED", "message": "...", "details": [...] },  // present only on error
  "path": "/api/v1/category", "method": "GET",
  "requestId": "uuid",            // trace one call across logs — SaaS-critical
  "timestamp": "2026-06-29T..."
}
```
- `apiClient` reads `json.data`; list helpers read `json.meta` → `Paginated<T>.meta` (NOT a `pagination`
  key — §2.2 fixed). Errors throw the typed `json.error{code,message,details}` + `requestId` so the UI
  switches on `error.code`, never string-matches `message`.
- **BE work (not optional):** update `sendResponse.ts` + `global.error.handler.ts` to emit this envelope.
  Do it as the BE V2 foundation, BEFORE / alongside the first FE slice. Today's thin
  `{statusCode,success,message,data,totalData}` + the different error shape are REPLACED.

### 9.2 FE-A4 — canonical `ProductCardDTO` + ONE `<ProductCard>` / `<ProductStrip>`
The most-reused unit (card on home/shop/category/search/related; strips popular/trending/flash) drifts
today (the "popular ≠ popular" bug). Lock:
- **`packages/types/product-card.ts`** = the canonical `ProductCardDTO` (id, slug, title, image, price
  layers resolved, badges, rating). **EVERY list endpoint returns exactly this shape** (BE shapes once).
- **ONE `<ProductCard variant density aspect>`** + **ONE `<ProductStrip>`** in `packages/ui` — niche/skin
  differ by TOKENS, not by a different component. Cards never re-map per surface.
- Storefront-facing but the DTO is foundation → declare it in `packages/types` at scaffold; the strip/card
  components land in the storefront slice. (Pairs with 9.1 envelope + 9.4 shared Zod.)

### 9.3 §17d D1 — CSRF token seam in `apiClient` (lay now, fill at auth slice)
`sameSite:none` cookies (needed for the 3-subdomain share) leave every mutation CSRF-exposed. Fix =
double-submit: BE issues a JS-readable `csrf_token` on login/refresh; `apiClient` attaches
`X-CSRF-Token` on every POST/PATCH/DELETE; BE `verifyCsrf` checks it (webhooks/IPN exempt).
- **Seam now:** `apiClient` already centralizes headers — add the `X-CSRF-Token` attach point there so
  turning CSRF on later is ONE change, not a per-mutation retrofit. Token read from a `csrf_token` cookie
  via a tiny helper. Implement the BE side + flip on at the auth slice.

### 9.4 AD-B3 / D6 — shared Zod schema BE↔FE (schema-first)
`packages/types/<resource>.ts` holds the canonical **Zod** schema used by: RHF form validation, the DTO
type (`z.infer`), and — the part not yet locked — **the BE consumes the SAME schema** (validation +
auto-generate the §17d D6 OpenAPI/Swagger from it). One schema = no type/validation drift, Swagger free.
Lock: new V2 BE modules are **schema-first**; the Zod lives in a shared location both sides import (or BE
mirrors it 1:1). This is what makes 9.1 + 9.2 actually enforceable.

### 9.5 Permission registry (Path C) — nav `perm` and BE route guard share ONE source
PERMISSION_OVERHAUL is "Step-1.5, do FIRST." Today 9 permissions are **FE-only gates** (admin JS hides
the menu but NO backend route checks them → data writable by direct API call = HIGH security bug). For
V2:
- The `adminNav` `perm` field (§2b config-driven sidebar) and the BE `verifyToken("...")` guard MUST come
  from **one permission registry** — not hand-synced in 4 places. Adding a feature module auto-registers
  its permission (sidebar visibility + route guard together).
- **Scaffold seam:** build `adminNav` so its `perm` strings reference the registry; never ship a nav item
  whose route/API isn't guarded by the same perm. Full registry = the permission slice; the nav must not
  diverge from it. (Also: fix the 2 live unauthenticated routes — PERMISSION_OVERHAUL Phase 0 — in BE V2.)

### 9.6 FE-A5 — storefront RSC + admin-mutation → tag revalidation seam
Storefront is RSC-first with tag-based caching; when an admin mutation publishes (product/price/settings)
it must `revalidateTag`/`revalidatePath` so storefront edits go live WITHOUT `no-store` everywhere
(current PDP is `no-store` = perf hole).
- **Seam now:** the admin mutation factory (§2.3) gets an optional `revalidate?: string[]` (tags to bust
  after success). Dormant while only admin exists; wired when the storefront slice lands. Admin uses
  TanStack `invalidateQueries` for ITS cache; `revalidateTag` is the cross-surface (admin→storefront) bus.

### 9.7 FE-A1 — SEO foundation (storefront slice, but #1 rewrite risk — don't forget)
Current app already ships sitemap/robots/JSON-LD/`generateMetadata`-from-DB/slug-301. A clean rewrite
with no SEO spec **loses all of it → a reselling shop that de-indexes on rebuild.** Not a data-layer
(admin) concern, but flagged here so the storefront slice re-implements (not regresses): per-route
`generateMetadata` + canonical/`metadataBase`, JSON-LD (Product·Breadcrumb·Org·WebSite), `sitemap.ts`/
`robots.ts`, 301 from product + category slug-history, OOS → noindex/410. Run the **seo-audit** skill
before declaring the storefront done.

### Net
9.1–9.4 are the "BE shapes once, FE never re-maps" contract (envelope + ProductCardDTO + CSRF + shared
Zod) — locked into `apiClient`, the factory, and `packages/types` at scaffold. 9.5–9.7 are seams
(registry alignment, revalidate bus, SEO) — contract laid now, full impl at their slice. None of this
changes the 7-file feature mold; it hardens the shared engine the mold sits on.

---

## 8.8 Ordering / serial-number system (drag reorder) — LOCKED

Every orderable resource (category, brand, product, attribute values, home sections, banners, etc.)
carries a stored ordering field (`position`). The admin shows a serial column and lets the user grab a
row and drag it up/down to change order; the new order is persisted and the storefront renders in that
order. Owner delegated the behavior decision to senior-dev judgment; requirement = "drag a row to
reorder." Decisions:

### Behavior = MOVE / INSERT (NOT swap)  ← senior-dev decision
Dragging row 9 to position 2 INSERTS it before the old row 2; rows 2..8 each shift down one slot — the
universal drag-list behavior (Trello / playlist / file manager). NOT a swap (swap would fling the old
row 2 down to slot 9, which is confusing). User intent "make 9 the 2nd item" is satisfied by MOVE.

### Stored value = gap-based position (display = clean serial)
- DB stores `position` with gaps: 10, 20, 30, … (not 1,2,3).
- Admin DISPLAYS a clean serial (1,2,3 = the row's visual index), so the user never sees the gap values.
- On a MOVE, the dragged row's new `position` = midpoint of its new neighbours' positions
  (e.g. dropped between 10 and 20 → 15). **Only the dragged row is updated → 1-row write**, even though
  visually rows 2..8 "shifted" (their stored positions are unchanged; only sort order shows the move).
- Rebalance: when a gap closes (neighbours differ by <2, no integer midpoint) the BE renumbers that
  scope back to 10,20,30… in one transaction. Rare; invisible to the user.

### Scope (owner decision 3, confirmed) — per-parent / per-level
- Categories are nested: **each parent scope has its own independent serial.** Top-level categories
  order among themselves; a parent's direct children order among themselves; grandchildren among
  themselves. Drag is confined to its scope (can't drag a child out of its parent via the order handle).
- Brands: single flat scope.
- Products: **category-scoped** position (order within a category listing). A product in multiple
  categories holds a position per category-membership row, not one global product position. (Confirm at
  the product slice; flagged.)

### MOVE + pagination edge (resolved)
Drag reorder needs the contiguous list visible. Rule:
- Small scopes (category per-parent, brand, attribute values, home sections, banners): **reorder works
  inline**; if a "Reorder" affordance is on, that scope is shown un-paginated (counts are small).
- Large scopes (products, 1000s): drag is impractical across pages → offer **a number/position
  quick-edit** (type the position) OR a dedicated "Arrange" view filtered to a small subset (e.g. one
  category). Do NOT try cross-page drag.

### Optimistic + contract
- On drop: reorder the rows in the TanStack cache IMMEDIATELY (optimistic), then
  `PATCH /<resource>/reorder` body `{ items: [{ id, position }] }` (send the dragged row; BE may
  rebalance scope and return the authoritative positions). onError → rollback to pre-drag order.
- BE updates in ONE transaction; reorder is scope-aware (accepts `parentId`/`categoryId` for the scope).
- Shared engine pieces: `useRowReorder` hook + `<SortableDataTable>` renderer (dnd-kit over TanStack row
  order) — written ONCE; any orderable feature opts in via `useDataTable({ reorder: true })` (§8.7).
  Reuses the factory query-key so the optimistic reorder + invalidation match the rest of the system.

### Keyboard + a11y
dnd-kit gives keyboard reordering (grab handle focus → arrow up/down → drop) and screen-reader
announcements for free — wire its `KeyboardSensor`; don't ship mouse-only drag.
```
