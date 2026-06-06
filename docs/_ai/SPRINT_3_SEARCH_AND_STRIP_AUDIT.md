# Sprint 3 — Global Search + Product Strip Audit + View More

**Created:** 2026-06-05 (session 24, end-of-session planning)
**Couples with:** [SPRINT_3_HOME_LAYOUT_TOGGLES.md](SPRINT_3_HOME_LAYOUT_TOGGLES.md) — strips must work BEFORE toggles ship.
**Owner intent:** Search UX upgrade + correct strip semantics + dedicated View-More routes.

---

## 🔒 Owner decisions LOCKED (session 24)

| # | Decision | Why |
|---|---|---|
| **S1** | **Global search = 4-tier dropdown** | Empty: recent + popular keywords. Typing: live products + categories + "See all" link. Daraz/Pickaboo pattern. |
| **S2** | **All 7 product strip APIs full audit** | Data shape parity + semantic correctness across the board. ~3-4h audit + 4-6h fixes. |
| **S3** | **View More = pre-filtered `/shop` with query params** | `/shop?sort=popular`, `/shop?sort=createdAt`, `/shop?on_sale=1`. Single canonical listing page, SEO-friendly, shareable. |

---

## Part 1 — Global Search upgrade

### Current state

- BE endpoint exists: `GET /product/search_product?searchTerm=X` — returns paginated filtered list
- FE navbar has search input, submits to `/search?q=X` (full page) — **no dropdown**
- No recent-search localStorage tracker
- No "popular keywords" admin module

### Target UX (4-tier dropdown)

**State A — Input focused, empty:**
```
┌─────────────────────────────────────┐
│ 🕐 Recent searches                  │
│   • dried mango                     │
│   • mixed nuts                      │
│   • [clear all]                     │
├─────────────────────────────────────┤
│ 🔥 Popular searches                 │
│   • gift pack  • office snack       │
│   • under ৳500 • new arrival        │
├─────────────────────────────────────┤
│ 🎁 Recommended for you              │
│   [product card] [product card] [product card]│
└─────────────────────────────────────┘
```

**State B — Typing (debounce 250ms):**
```
┌─────────────────────────────────────┐
│ 🔍 "ma" — 8 matches                 │
│   [img] Dried Mango Slices  ৳350 ▾  │
│   [img] Mango Bites Pack    ৳200 ▾  │
│   [img] Mixed Mango Nuts    ৳450 ▾  │
│   ... 5 more                        │
├─────────────────────────────────────┤
│ 📁 In categories                    │
│   • Mango Products (12)             │
│   • Dried Fruits (45)               │
├─────────────────────────────────────┤
│ → See all 8 results for "ma"        │
└─────────────────────────────────────┘
```

**State C — No match:**
```
┌─────────────────────────────────────┐
│ ❌ No products match "xyzabc"        │
│ Try: nuts, mango, gift pack         │
├─────────────────────────────────────┤
│ 🎁 You might like                   │
│   [bestsellers fallback]            │
└─────────────────────────────────────┘
```

### BE work

| # | Item | Effort |
|---|---|---|
| S.BE1 | New endpoint `GET /product/search_suggest?q=X&limit=6` — returns `{products: [...], categories: [...], total: N}`. Lightweight projection (no full populate). | ~2h |
| S.BE2 | New module `popularKeyword` — admin CRUD (keyword, order_no, click_count, status). Surfaced via `GET /popular-keyword?limit=8`. | ~1.5h |
| S.BE3 | Extend `bumpProductViewCount` pattern: track search term + clicked product → `searchAnalytics` collection (optional, for popular-keyword auto-curation). Defer recommend — manual curation enough Phase 1. | DEFERRED |

### FE work

| # | Item | Effort |
|---|---|---|
| S.FE1 | New `<GlobalSearchDropdown />` component (replaces navbar plain input). Tailwind dropdown, keyboard nav (↑↓ Enter Esc), debounce 250ms, mobile-fullscreen variant | ~3-4h |
| S.FE2 | `useRecentSearches()` hook — localStorage CRUD (max 5, dedupe, clear-all). | ~30min |
| S.FE3 | Recommended-for-you tier reads existing `just_for_you_product` API (logged-in) or `popular_product` fallback. | ~30min |
| S.FE4 | Empty-state Popular Searches reads new `popular-keyword` endpoint. | ~30min |
| S.FE5 | Typing-state cells: product card mini (img/name/price/disc badge), category cell with count. | ~1.5h |

### Admin work

| # | Item | Effort |
|---|---|---|
| S.AD1 | New "Popular Keywords" page in Site Settings or under Marketing nav — CRUD list, order, on/off. ~6-10 keywords typical. | ~2h |

### Effort total: ~11-13h

---

## Part 2 — Product Strip API Audit + Fixes

### Current reality (verified 2026-06-05)

**Findings from reading `product.services.ts`:**

| Strip | API | Filter | Sort | Reality |
|---|---|---|---|---|
| Trending | `/trending_product` | `trending_product: true` (admin flag) | `_id: -1` | Admin-curated, NOT view-count-driven |
| Popular | `/popular_product` | `product_status: active` only (no flag!) | `_id: -1` | **NOT popular-by-sales — just newest active products** ❌ |
| Latest (LatestProducts.jsx) | `/popular_product` alias | (same as above) | `_id: -1` | **Falsely labeled — same as "popular"** ❌ |
| Just for You | `/just_for_you_product` | TBD — need to read | TBD | TBD |
| E-commerce Choice | `/ecommerce_choice_product` | TBD | TBD | TBD |
| Flash Sale | `/flashsale` (separate module) | flashsale active + product link | TBD | Likely correct |
| Category-wise | `/popular_product?category=X` | category match | `_id: -1` | **Also newest, not popular** |

### 🚨 Semantic correctness bugs surfaced

1. **`popular_product` is NOT popular** — no `sold_count` sort, no `view_count` sort. It's just "newest active products."
2. **`LatestProducts.jsx` aliases to `popular_product`** — Sprint 3 H1 HIGH 2 already flagged; same bug.
3. **"Trending" is admin-flag-curated**, not algorithmic. Owner intent must clarify: keep manual curation OR switch to view_count-based?

### Data shape parity audit checklist

For each of 7 strips, verify these fields are present + same names + same types in the response:
- `_id`, `product_name`, `product_slug`, `main_image`
- `product_price` (compare-at / MSRP)
- `product_discount_price` (sale price, can be null)
- `is_variation` (bool)
- `variation_details` (array, when `is_variation: true`)
- `attributes_details` (array)
- `category_id` populated `{_id, category_name, category_slug}`
- `brand_id` populated `{_id, brand_name}`
- `average_review_rating`, `total_reviews`
- `sold_count` (lifetime), `effective_stock` (computed)
- `badges` derived (NEW / TRENDING / SALE — computed FE or BE)
- `campaign_details` (when active campaign on product)

If any field is missing or differs in any strip → fix.

### Proposed semantic fixes

| Strip | New (post-fix) filter + sort | Notes |
|---|---|---|
| **Trending** | EITHER admin flag (current) OR `view_count_30d` desc. Owner D-lock needed. | Recommend: keep admin flag for now (manual curation), add view-count alternative later |
| **Popular / Bestsellers** | sort: `sold_count: -1` | Real bestsellers |
| **New Arrivals** | sort: `createdAt: -1` (or `_id: -1` — same outcome) | Truly newest first |
| **Just for You** | Logged-in: aggregate from user `view_history` + `purchase_history`. Guest fallback: `popular_product`. | Real personalization (Phase 2) OR fallback for now |
| **E-commerce Choice** | OWNER D-lock: deprecate this strip OR define semantic. | Current code is unclear |
| **Flash Sale** | flashsale active + sort by discount % desc | Read flashsale.services to verify |
| **Category-wise** | `category_id: X` + sort by `sold_count: -1` (popular within category) | |

### Unified response shape (proposed)

Standardize ALL 7 strip endpoints to return:
```json
{
  "data": [
    {
      "_id": "...",
      "product_name": "...",
      "product_slug": "...",
      "main_image": "...",
      "product_price": 500,
      "product_discount_price": 350,
      "currency_symbol": "৳",
      "is_variation": false,
      "category": { "_id": "...", "name": "...", "slug": "..." },
      "brand": { "_id": "...", "name": "..." },
      "rating": { "average": 4.5, "count": 23 },
      "stock": { "in_stock": true, "low_stock": false },
      "badges": ["NEW", "SALE"],
      "campaign": null | { "name": "...", "discount_type": "percent", "discount_value": 20 }
    }
  ],
  "totalData": 47,
  "strip_meta": {
    "strip_type": "popular",
    "view_more_url": "/shop?sort=popular",
    "title": "বেস্টসেলার"
  }
}
```

FE consumes uniformly via a single `<ProductStrip />` component. Today FE has 7 different components with subtle render differences.

### BE work for strip audit

| # | Item | Effort |
|---|---|---|
| ST.BE1 | Read + document each of 7 strip services in `product.services.ts` and `flashsale.services.ts` (and `just_for_you`, `ecommerce_choice`) | ~1h |
| ST.BE2 | Fix `popular_product` to sort by `sold_count: -1` (BLOCKER per audit) | ~30min |
| ST.BE3 | Add new `/new_arrival` endpoint (was Sprint 3 H1 HIGH 2) | ~1h |
| ST.BE4 | Decide trending semantics (admin flag vs view_count) — D-lock | ~discussion |
| ST.BE5 | Standardize response shape via `productCardProjection()` helper applied to all 7 endpoints | ~2-3h |
| ST.BE6 | Add `strip_meta` block with `view_more_url` per endpoint | ~1h |
| ST.BE7 | Resolve `ecommerce_choice` and `just_for_you` semantic | ~D-lock + 1h |

### FE work for strip audit

| # | Item | Effort |
|---|---|---|
| ST.FE1 | New single `<ProductStrip />` component reading unified shape | ~3h |
| ST.FE2 | Migrate 7 existing strip components → use new shared component | ~2h |
| ST.FE3 | Per-strip "View More" button uses `strip_meta.view_more_url` | ~30min |
| ST.FE4 | Badge derivation logic (NEW = createdAt within 30d, SALE = discount > 0, OUT_OF_STOCK = stock=0) | ~1h |
| ST.FE5 | Skeleton loaders unified | ~1h |

### Effort total: ~12-15h

---

## Part 3 — View More dedicated route

### Locked: `/shop?<query params>` pattern

| Strip | View More URL |
|---|---|
| Trending | `/shop?strip=trending` (or `?sort=trending`) |
| Popular / Bestsellers | `/shop?sort=popular` |
| New Arrivals | `/shop?sort=createdAt` |
| Just for You | `/shop?strip=just_for_you` (login-gated, fallback to popular for guests) |
| E-commerce Choice | `/shop?strip=ecommerce_choice` |
| Flash Sale | `/shop?on_sale=1` |
| Category-wise | `/shop?category=<slug>&sort=popular` |
| Brand strip (future) | `/shop?brand=<slug>` |
| Price bucket (future) | `/shop?price_max=200&sort=popular` |

### FE work

| # | Item | Effort |
|---|---|---|
| VM.FE1 | Audit existing `/shop` page (`(frontend)/products/page.js` or similar) — does it accept all query params above? Likely supports `category` + `brand` already from filter API. Add `sort`, `strip`, `on_sale`. | ~1-2h |
| VM.FE2 | URL state sync — when user changes filter on `/shop`, update URL. Already may be done. | ~30min |
| VM.FE3 | SEO meta per query combination — `<title>` reflects "Best Sellers — Site Name" when `?sort=popular`. | ~1h |

### BE work

| # | Item | Effort |
|---|---|---|
| VM.BE1 | Ensure `findAllFilteredProduct` (the `/product` GET) accepts new query params: `sort` (popular/createdAt/trending), `strip`, `on_sale`. May already; verify. | ~1h |

### Effort total: ~3-5h

---

## Cross-coupling note

These 3 items are **prerequisites for Sprint 3 H1 toggle catalog**. If we ship `bestsellers_show: true` toggle but `popular_product` is broken-popular, owner toggle ON-OFF shows wrong data.

**Recommended order within Sprint 3:**
1. **Part 2 (strip audit) — first** — fix the data foundation
2. **Part 1 (search) — second** — independent UX upgrade
3. **Part 3 (View More) — third** — small wiring once Part 2's strip_meta is in
4. **H1 toggle catalog — last** — toggle ON/OFF the now-correct strips

### Combined effort

| Part | Effort |
|---|---|
| 1. Global Search | ~11-13h |
| 2. Strip Audit + Fix | ~12-15h |
| 3. View More routing | ~3-5h |
| Total before H1 toggles | **~26-33h** |
| H1 toggles (separate doc) | ~35-45h |
| **Sprint 3 grand total** | **~60-80h** |

Sprint 3 was originally ~10-14h. After scope expansion: ~60-80h. This is **a real sprint of its own**, likely 2-3 weeks.

---

## D-locks still needed

| # | Question |
|---|---|
| ST.D1 | "Trending" semantic — keep admin flag (manual curation) OR switch to view_count_30d desc (algorithmic)? |
| ST.D2 | "E-commerce Choice" — keep as separate strip with admin-curated flag, deprecate, or merge into "Editor's Picks"? |
| ST.D3 | "Just for You" — Phase 1 = fallback to popular for everyone (no real personalization), OR build view+purchase history aggregation now? |
| S.D4 | Search "popular keywords" — owner manually maintains via admin OR auto-derived from search log (build searchAnalytics)? |

Defer all 4 D-locks to Sprint 3 kickoff. Recommendations:
- ST.D1: keep admin flag (simpler, owner control). Add view_count alternative later.
- ST.D2: merge → keep only "Editor's Picks" (one curated strip is enough; current has both trending + ecommerce_choice that overlap).
- ST.D3: Phase 1 = popular fallback. Real personalization Phase 2.
- S.D4: manual admin Phase 1. Auto-derive Phase 2.

---

## Files touched (preview)

**BE:**
- `src/app/product/product.services.ts` — strip semantics fix, unified projection
- `src/app/product/product.controllers.ts` — new endpoints (`/search_suggest`, `/new_arrival`)
- `src/app/product/product.routes.ts` — new routes
- NEW `src/app/popularKeyword/` module (model/interface/services/controllers/routes)
- `src/app/setting/setting.interface.ts` + `setting.model.ts` — keyword display setting

**Admin:**
- NEW `src/pages/PopularKeywords/` page
- (no other admin work for strip fix — fix happens BE)

**FE:**
- NEW `src/components/frontend/navbar/GlobalSearchDropdown.jsx` (replaces plain input)
- NEW `src/hooks/useRecentSearches.js`
- NEW `src/components/frontend/home/strips/ProductStrip.jsx` (unified)
- MIGRATE 7 existing strip components → use ProductStrip
- `src/app/(frontend)/shop/page.js` (or `/products/page.js`) — accept new query params

---

## Resume notes

This planning doc captures session-24-end strategy for Sprint 3 search + strip work. Sprint 2 still ships first. When Sprint 3 starts:

1. Re-read this doc + [SPRINT_3_HOME_LAYOUT_TOGGLES.md](SPRINT_3_HOME_LAYOUT_TOGGLES.md)
2. Resolve ST.D1 / ST.D2 / ST.D3 / S.D4 with owner
3. Order: strip audit (Part 2) → search (Part 1) → view-more (Part 3) → H1 toggles → home rewrite

Owner already pre-locked S1 + S2 + S3 in session 24.
