# Dashboard Redesign — Implementation Plan

**Created:** 2026-06-09  
**Branch:** sprint-3  
**Scope:** Pure frontend redesign — no schema change, no new API endpoints, no new routes.

---

## Goals

1. Modern, consistent UI across all 8 dashboard tabs
2. Fix sticky sidebar (audit B2 — needs `min-h-screen` + `self-start`)
3. Fix mobile nav (audit B1 — replace double-bottom-bar, add icon+label, 5-item limit)
4. Consistent card wrapper on every tab
5. Keep all existing logic, data-fetching, deep-link (`?tab=`) URL sync intact

---

## Files Touched (12)

| # | File | Change type |
|---|------|-------------|
| 1 | `src/app/(user-profile)/layout.js` | Remove MobileNavBarUserDashBoard from layout (new one lives inside UserProfile) |
| 2 | `src/components/allUserProfile/userProfile/UserProfile.jsx` | Full layout rebuild — sidebar, grid, URL sync, mobile detection |
| 3 | `src/components/shared/navbar/MobileNavBarUserDashBoard.jsx` | Rewrite to dashboard-specific bottom tab bar (5 items max, icon+label) |
| 4 | `src/components/allUserProfile/userProfile/Dashboard.jsx` | Stat cards redesign + consistent card wrapper |
| 5 | `src/components/allUserProfile/userProfile/PurchaseHistory.jsx` | Card wrapper + responsive table polish |
| 6 | `src/components/allUserProfile/userProfile/UserDashboardWishList.jsx` | Card wrapper + grid polish |
| 7 | `src/components/allUserProfile/userProfile/Addresses.jsx` | Card wrapper + inline form polish |
| 8 | `src/components/allUserProfile/userProfile/LoyaltyHistory.jsx` | Card wrapper + balance card polish |
| 9 | `src/components/allUserProfile/userProfile/WalletHistory.jsx` | Card wrapper + balance card polish |
| 10 | `src/components/allUserProfile/userProfile/ReviewDashBoard.jsx` | Card wrapper + sub-tab polish |
| 11 | `src/components/allUserProfile/userProfile/ShowProfileDetails.jsx` | Card wrapper + avatar section |
| 12 | `src/components/allUserProfile/userProfile/ProfileSetting.jsx` | `w-[750px]` → `w-full max-w-[750px]` + form polish |

---

## Design System (from ui-ux-pro-max guidelines)

### Layout skeleton

```
(user-profile)/layout.js
  SecondNavbar (sticky top-0 z-30)
  <div class="min-h-dvh pb-16 md:pb-0">     ← content + mobile padding
    {children}                               ← UserProfile page
  </div>
  Footer

UserProfile.jsx
  <div class="max-w-7xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[260px_1fr] gap-6 min-h-screen">
    <aside class="self-start sticky top-24 hidden lg:block ...">   ← sidebar
    <main class="min-w-0">                                         ← tab content
      {activeTab content}
    </main>
  </div>
  <MobileTabBar />   ← rendered inside UserProfile, not layout
```

### Sidebar (desktop, lg+)
- `self-start sticky top-24` — sticks below 96px navbar (SecondNavbar ~64px + gap)
- `rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden`
- Avatar section: `rounded-full w-20 h-20 object-cover` with initial fallback
- Nav items: `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors`
- Active: `bg-primary/10 text-primary border-l-2 border-primary pl-3.5`
- Hover: `hover:bg-gray-50 hover:text-gray-900`
- Logout: below `<hr>` divider, `text-red-500 hover:bg-red-50`
- `order-tracking` nav item: shows `↗` external icon (FiExternalLink) to signal page navigation

### Mobile bottom tab bar (inside UserProfile, md:hidden)
- `fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg`
- `pb-[env(safe-area-inset-bottom)]`
- **5 items only:** Dashboard / Orders / Wishlist / Profile / More
- Each item: icon (20px) + label (10px) stacked, `min-w-[44px] min-h-[44px]` touch target
- Active: `text-primary`, inactive: `text-gray-400`
- "More" item → opens a `fixed inset-0 z-[60]` slide-up sheet with remaining tabs
  (Addresses, Loyalty, Wallet, Review) + close button
- Sheet: `fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-[60] p-4`

### Per-tab card wrapper (shared pattern)
Every tab content is wrapped in:
```jsx
<div className="space-y-4">
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    {/* tab content */}
  </div>
</div>
```
Page title inside card: `text-lg font-semibold text-gray-900 mb-4`

### Typography / spacing scale
- Page title: `text-lg font-semibold text-gray-900`
- Section label: `text-xs font-semibold text-gray-500 uppercase tracking-wide`
- Body: `text-sm text-gray-700`
- Stat number: `text-2xl font-bold text-gray-900`
- Badge/chip: `text-xs font-semibold px-2 py-0.5 rounded-full`

---

## Tab-by-tab changes

### Tab 1 — Dashboard (`Dashboard.jsx`)
**Keep:** all data fetching (`dasBoardData`, wishlist/cart counts), trending product grid  
**Change:**
- 5 stat cards → `rounded-2xl border bg-white shadow-sm p-5` with icon in colored circle + label + number
- Trending section title: `text-sm font-semibold text-gray-700 mt-6 mb-3`
- Product grid cards: add `rounded-xl overflow-hidden border border-gray-100 hover:shadow-md` wrapper

### Tab 2 — Purchase History (`PurchaseHistory.jsx`)
**Keep:** all data fetching, pagination, status badge map, search term state  
**Change:**
- Wrap in card: `bg-white rounded-2xl border shadow-sm`
- Table header: `bg-gray-50/80` sticky row
- Rows: `hover:bg-gray-50/60 transition-colors`
- Status badges: keep existing color map, add `rounded-full` (already has it)
- Mobile: table stays `overflow-x-auto` — no change to logic

### Tab 3 — Wishlist (`UserDashboardWishList.jsx`)
**Keep:** all data fetching, cart dispatch, wishlist localStorage logic  
**Change:**
- Wrap in card
- Product grid: `grid-cols-2 sm:grid-cols-3 gap-3` consistent with main wishlist page style

### Tab 4 — Addresses (`Addresses.jsx`)
**Keep:** all fetch/POST/PATCH/DELETE logic, inline form, Swal confirm  
**Change:**
- Wrap in card
- Address cards: `rounded-xl border p-4 relative` with default star chip top-right
- Add/Edit form: tighten field spacing to `gap-3 grid grid-cols-1 sm:grid-cols-2`

### Tab 5 — Loyalty Points (`LoyaltyHistory.jsx`)
**Keep:** all data fetching, type badge map, pagination  
**Change:**
- Wrap in card
- Balance card: prominent `text-3xl font-bold text-primary` pts display + `FaGift` icon
- Transaction table: `text-xs` rows, type badge

### Tab 6 — Wallet (`WalletHistory.jsx`)
**Keep:** all data fetching, type badge map, pagination  
**Change:**
- Same pattern as Loyalty — balance card + table in card wrapper

### Tab 7 — Review (`ReviewDashBoard.jsx`)
**Keep:** all sub-tab logic, review data  
**Change:**
- Wrap in card
- Sub-tab: `flex gap-1 bg-gray-100 rounded-xl p-1` pill switcher

### Tab 8 — Profile Setting (`ShowProfileDetails.jsx` + `ProfileSetting.jsx`)
**Keep:** all form logic, email inline editor, ProfileSetting modal  
**Change:**
- `ShowProfileDetails`: card wrapper, avatar `rounded-full`, info grid `grid-cols-1 sm:grid-cols-3`
- `ProfileSetting` modal: `w-full max-w-[750px]` (already fixed for M2)

---

## Blocker from previous audit — absorbed here

| Audit finding | How absorbed |
|---|---|
| B1 double bottom bar | `MobileNavBarUserDashBoard` removed from `layout.js`; new one rendered inside `UserProfile.jsx` only on dashboard pages |
| B2 sticky sidebar | Parent grid `min-h-screen`, sidebar `self-start sticky top-24` |
| H1 SecondNavbar inconsistency | Deferred — changing navbar is out of scope for this sprint; layout.js still uses SecondNavbar |
| H2 ProfileSetting w-[750px] | `w-full max-w-[750px]` fix in ProfileSetting.jsx |
| M2 URL deep-link | Tab clicks call `router.push(?tab=X)` — URL sync preserved |
| M3 pb-16 | Already fixed in layout.js; new bottom tab bar also gets `pb-[env(safe-area-inset-bottom)]` |

---

## Implementation order

1. `layout.js` — remove MobileNavBarUserDashBoard (1 line change)
2. `UserProfile.jsx` — new sidebar + grid layout + mobile tab bar + "More" sheet
3. `MobileNavBarUserDashBoard.jsx` — rewrite (now only used if imported elsewhere; may become dead code)
4. `Dashboard.jsx` — stat cards + product grid polish
5. `PurchaseHistory.jsx` — card wrapper
6. `UserDashboardWishList.jsx` — card wrapper
7. `Addresses.jsx` — card wrapper + form polish
8. `LoyaltyHistory.jsx` — card wrapper + balance card
9. `WalletHistory.jsx` — card wrapper + balance card
10. `ReviewDashBoard.jsx` — card wrapper + sub-tab pill
11. `ShowProfileDetails.jsx` — card wrapper + avatar
12. `ProfileSetting.jsx` — modal width fix + form polish

---

## What is NOT changing

- All API calls / data fetching — untouched
- Redux cart/wishlist logic — untouched
- URL routing / `?tab=` deep-link — preserved (router.push on tab click)
- Auth redirect (unauthenticated → /sign-in) — untouched
- `Suspense` wrapper — untouched
- `SecondNavbar` in layout — untouched (H1 deferred)
