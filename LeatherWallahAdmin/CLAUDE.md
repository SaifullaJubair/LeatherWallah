# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For complete admin documentation in Bangla (every page, every feature, data flow), see [docs/admin.md](../docs/admin.md) in the monorepo root.
> For known bugs and improvement opportunities, see [docs/issues.md](../docs/issues.md).

## Commands

```bash
npm run dev        # Start dev server on port 3001
npm run build      # Production build → dist/
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

No test runner is configured.

## Environment

Requires a `.env` file with:
```
VITE_API_URL=<backend API root, NO trailing /api/v1 — baseURL.js appends it>
```

## Architecture

This is a React + Vite admin dashboard for the FruitSnacks e-commerce platform. There is no SSR — it's a pure SPA.

**Core libraries:** React 18, React Router 6, TanStack React Query 5, React Hook Form, Tailwind CSS 3, Recharts, react-quill-new (rich text), react-phone-number-input, SweetAlert2, React Toastify, react-helmet-async.

### Provider Hierarchy

[src/main.jsx](src/main.jsx) wires providers in this order:
```
HelmetProvider → QueryClientProvider → AuthProvider → SettingProvider → App
```

### Data Fetching Pattern

All server state goes through React Query. Two patterns coexist:

1. **Custom hooks** (preferred) — [src/hooks/](src/hooks/) wraps `useQuery` for a specific resource:
   ```js
   export const useGetCategory = () =>
     useQuery({ queryKey: ['/api/v1/category'], queryFn: ... });
   ```
2. **Inline `useQuery`** — some pages (e.g. `CategoryPage.jsx`) call `useQuery` directly when query params change. Refactor target: move to hooks.

The base API URL comes from [src/utils/baseURL.js](src/utils/baseURL.js) which reads `VITE_API_URL` and appends `/api/v1`. All requests use `credentials: 'include'` (cookie auth).

**Mutations use plain `fetch`, NOT `useMutation`.** Cache invalidation is manual via `refetch()` returned from `useQuery`. This is consistent across the codebase but creates repetitive code — a refactor opportunity.

### State Management

- **AuthProvider** ([src/context/AuthProvider.jsx](src/context/AuthProvider.jsx)) — current admin user, fetched from `/api/v1/admin_reg_log` on mount. The `role_id` is populated, so `user.role_id.<permission_flag>` is the permission check throughout the app.
- **SettingProvider** ([src/context/SettingProvider.jsx](src/context/SettingProvider.jsx)) — site settings (logo, favicon, title) from `/api/v1/setting`. The result is fetched once on mount.
- React Query handles all server cache; Context handles only global client state. No Redux or other store.

### Routing & Auth

Routes are defined in [src/routes/Route.jsx](src/routes/Route.jsx) using `createBrowserRouter`. Protected pages are wrapped with `PrivateRoute` ([src/routes/privateRoute/PrivateRoute.jsx](src/routes/privateRoute/PrivateRoute.jsx)) which redirects to `/sign-in` unless `user.admin_status == "active" && user.admin_phone`.

The dashboard layout is in [src/layout/DashboardLayout.jsx](src/layout/DashboardLayout.jsx) — collapsible sidebar + top navbar + `<Outlet />` for child pages.

**Auth flow:**
- POST `/admin_reg_log/login` → backend sets httpOnly cookie `fruit_snacks_token`
- AuthProvider GET `/admin_reg_log` to fetch current user (including populated `role_id`)
- Login currently calls `window.location.reload()` after navigate — see A-6 in issues.md

### Permission Gating

Two parallel checks for every protected feature:

1. **Sidebar menu** ([src/shared/SideNavBar/SideNavBar.jsx](src/shared/SideNavBar/SideNavBar.jsx)) — every menu item is wrapped in `{user?.role_id?.<flag> === true && (...)}`. Hides items the admin doesn't have permission for.
2. **Page content** — pages re-check the same flag at the top to handle direct URL access.

⚠️ Both layers are **UX-only** — real security lives in the backend `verifyToken()` middleware. Frontend checks can be bypassed via DevTools (the request will still be rejected by the backend).

When adding a new permission flag:
1. Add the boolean field to backend [role.interface.ts](../FruitSnacksBackend/src/app/role/role.interface.ts) AND [role.model.ts](../FruitSnacksBackend/src/app/role/role.model.ts)
2. Apply `verifyToken("new_flag")` on the backend routes
3. Add an entry to [src/data/permissionData.js](src/data/permissionData.js) so the Role create/update page exposes the checkbox
4. Add the `user?.role_id?.new_flag` check in Sidebar and Page

### Feature Module Convention

Each feature (Products, Orders, Categories, Campaigns, Coupons, Banners, Themes, FAQ Templates, etc.) follows the same pattern:
- `src/pages/<Feature>Page/` — page-level component (list view, search input, pagination, modal trigger)
- `src/components/<Feature>/` — sub-components:
  - `<Feature>Table.jsx` — list table + action buttons
  - `Add<Feature>.jsx` — modal/page create form
  - `UpDate<Feature>.jsx` (or `Update<Feature>.jsx`) — edit form. Naming is inconsistent — see A-11.

Forms use React Hook Form + React Select for dropdowns. List views use paginated tables with skeleton loading states (`react-loading-skeleton`). Dialogs/confirmations use SweetAlert2; toasts use React Toastify.

### File Upload Pattern

Multipart forms (`new FormData()`) with `<input type="file">`. Preview via `URL.createObjectURL` — but cleanup via `URL.revokeObjectURL` is missing in most places (memory leak risk — see A-14).

FormData is cleaned of `null`/`undefined`/empty values before POST. The same cleanup loop is repeated in ~25 places — strong candidate for a `cleanFormData()` utility.

### Tailwind

Custom color tokens are defined in [tailwind.config.js](tailwind.config.js):
- `blueColor` (brand primary, with `-50` to `-900` shades)
- `primaryColor`, `successColor`, `yellowColor`, `purpleColor`
- `bgBtnActive`, `btnInactiveColor`, `textColor`, `bgray-*`

Use these instead of raw Tailwind palette colors. Active plugins: `tailwind-scrollbar`, `tailwindcss-motion`.

### Dynamic Product Page System (new)

Three admin areas serve the per-product theming system:

- **`/theme`, `/theme/create`, `/theme/update/:id`, `/theme/preview/:id`** — manage the `themes` collection (color palette, floating fruit assets, typography, button style, status). Live color preview via [ColorAutoPreview.jsx](src/components/Theme/ColorAutoPreview.jsx).
- **`/faq-template`** — reusable FAQ entries categorized (shelf_life, storage, ingredients, usage, health, general).
- **`/product/page-content/:id`** — edit a product's `theme_id`, `theme_overrides`, `short_description`, `badge_text`, `short_features`, `process_steps`, `benefits`, `use_cases`, `nutrition`, `faqs`, `og_*` fields.

These map to backend `theme` and `faq_template` modules. See [FEATURE_PLAN.md](../docs/FEATURE_PLAN.md).

### Static Data Files

[src/data/](src/data/):
- `permissionData.js` — the list of all permission flags (UI mirror of backend `role.interface.ts`). **Must be kept in sync manually.**
- `division-data.js`, `district-data.js`, `city-data.js`, `address-data.js` — Bangladesh location data for customer addresses & courier zones
- Other files (`category-data.js`, `product-data.js`, `feature-data.js`, etc.) are legacy demo data — DB is now the source of truth (delete candidates — see A-18)

## Known Pitfalls

- **`useGetData.jsx`** is an empty placeholder returning JSX from a hook — dead/broken code, delete it
- **`cookie-storage.js`** is unused (backend uses httpOnly cookies which JS can't read) — delete to prevent confusion
- **Misspelled file `UpDateCategory.jsx`** — should be `Update`; some folders use the correct spelling already
- **`console.log` left in production code** (e.g. `SideNavBar.jsx:67`) — configure Vite to drop them or remove manually
- **Inconsistent route naming** — `/brand-category` (admin URL) vs `/brand` (backend) vs `BrandPage` (component). (`/sub-category`, `/child-category`, `/specification-list` routes/pages were REMOVED — category is now a single nested-tree page.)
- **Sidebar reorganized** into 8 collapsible groups (2026-06); Sub/Child Category + Specification pages gone (nested tree + attribute engine). Some commented routes may still linger in `Route.jsx`/`SideNavBar.jsx` — verify against current `Route.jsx` before relying on this note.
- **`window.location.reload()` after login** breaks the SPA model — refactor to use AuthProvider re-fetch
- **Permission flag drift** — adding a permission requires changes in 4 places (backend interface + model + route + admin permissionData.js + sidebar/page checks); easy to miss one
