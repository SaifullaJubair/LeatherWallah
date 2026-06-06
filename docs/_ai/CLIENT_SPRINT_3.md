# Client Sprint 3 — FruitSnacks (Frontend redesign + future design-heavy work)

**Created:** 2026-06-05 (session 24)
**Status:** PLANNING — not started yet. Sprint 2 must complete first.
**Branch:** Will be on `v2` (continuation of long-lived branch) or new branch — owner decides at start.
**Predecessor:** [CLIENT_SPRINT_2.md](CLIENT_SPRINT_2.md)
**Why separate from Sprint 2:** Owner D4 — design-heavy work (home redesign, future redesigns) needs a dedicated design pass + owner decisions before code. Bundling with quick-wins risks the small-stuff getting delayed by design discussion.

---

## 🔒 Owner decisions LOCKED

| # | Decision | Why |
|---|---|---|
| **D1** | **Sprint 3 dedicated to design-heavy frontend work** | Sprint 2 = quick wins + backend; Sprint 3 = UI redesign + design-pass items |
| **D2** | **plan-edge-auditor already ran on H1 (2026-06-05)** | Findings documented below; absorbed into the design pass |
| **CRITICAL** | **Anonymous checkout MUST keep working** | Carry-forward from Sprint 1 + 2 |

---

## Sprint 3 scope

### Item 1 — **H1 Frontend home page redesign** (~60-80h Sprint 3 total)

**SCOPE EXPANDED 2026-06-05 (session 24 end):** Sprint 3 is now a real 2-3 week sprint, not a single item. Splits into 4 tracks:

| Track | Doc | Effort |
|---|---|---|
| **A. Product Strip API audit + fix** (prerequisite — bestsellers actually bestsellers, etc.) | [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) Part 2 | ~12-15h |
| **B. Global Search 4-tier dropdown** (recent + popular keywords + live products + recommended) | [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) Part 1 | ~11-13h |
| **C. View More dedicated routing** (`/shop?sort=popular` etc, single canonical filtered listing) | [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) Part 3 | ~3-5h |
| **D. Home Layout Control + redesign** (74 owner toggles + 2 new modules + section variants) | [SPRINT_3_HOME_LAYOUT_TOGGLES.md](SPRINT_3_HOME_LAYOUT_TOGGLES.md) | ~35-45h |

**Order matters:** A → B → C → D. Strip fix is foundation; toggling broken strips just hides the bug.

Bumped estimate trail: 8-12h initial → 10-14h after H1 audit → 35-45h after toggle catalog → **60-80h after search+strip audit scope-out**.

#### What it is

Replace leftover leather-template sections in `src/app/(frontend)/page.js` with fruit-snacks-themed sections matching the PDP aesthetic. Reuse existing data sources (banner, slider, featured categories, trending products, new arrivals, offers, trust points).

#### Audit findings (plan-edge-auditor 2026-06-05)

The auditor surfaced 3 blockers + 4 highs + 5 open questions. Several are now absorbed into Sprint 2 Bucket 0 (BUG-1 to BUG-3). Remaining items below.

**🚨 BLOCKERS (must resolve before code)**

1. **Home page has no `ThemeStyleInjector`** → CSS variables (`--brand-primary`, etc.) undefined → entire visual design breaks if new sections use `var(--brand-primary)`.
   - Owner decision needed: option (a) fetch default theme from BE and inject server-side, OR option (b) hardcode green palette CSS vars in `globals.css`.
   - **Recommendation (audit):** option (b) — simpler, keeps home SSR-zero-JS, matches PDP `mergeTheme` fallback behaviour.

**⚠️ HIGH (likely production bugs without fix)**

2. **"New Arrivals" data source ambiguity** — `LatestProducts.jsx` currently fetches `/product/popular_product` but labels as "New Arrival". No real new-arrivals endpoint exists. Decide: (a) add BE endpoint `/product/new_arrival?sort=createdAt&limit=8`, OR (b) keep `popular_product` and document the alias.
   - **Recommendation:** option (a). New arrivals semantic ≠ popular semantic; mixing causes future confusion.

3. **`BannerItem.jsx` crashes when `bannerData` is null/undefined** (fresh clone) — Swiper with `loop={true}` and zero slides throws. Add `if (!bannerData?.length) return null` before Swiper render.

4. **`CategoryWiseProduct` (`just_for_you_product`) is `"use client"` with `useEffect` fetch** — hurts FCP (Lighthouse Performance ≥ 80 target). Convert to server component OR remove from v2 home.
   - **Recommendation:** convert to server component (`use server` + direct fetch in page.js).

5. **Trust points has no FE lib function** — `GET /api/v1/trust-point` exists on BE, but no `src/components/lib/getTrustPoints.js` wrapper. Trust Grid section in v2 needs this.

**🟡 MEDIUM (rare but worth handling)**

6. `BannerItem.jsx` uses `next/image fill` without `sizes` prop — Lighthouse warns about oversized images on mobile.
7. Offer/`pageSeo.js` marked `noIndex: true` — crawlers won't index offer pages reached from home (intentional but worth knowing).

#### 5 owner decisions needed BEFORE code

| # | Question | Recommendation |
|---|---|---|
| Q1 | **Default theme injection on home page:** option (a) BE-fetched default theme OR option (b) hardcoded green fallback in `globals.css` | (b) — simpler, SSR-zero-JS |
| Q2 | **"New Arrivals" data:** add real BE endpoint OR alias to `popular_product` | (a) — add real endpoint |
| Q3 | **`CategoryWiseProduct` section:** keep + convert to server component OR cut from v2 | Convert to server component (data is valuable) |
| Q4 | **Section ORDER admin-configurable** (admin can reorder sections via Page Content editor)? | Defer to Sprint 4 — adds 2+ days to scope |
| Q5 | **Testimonials section:** include OR skip? If yes, owner provides 3-5 testimonials as static content | Owner to decide at start of Sprint 3 |

#### Proposed section list (v2 home, in render order)

Subject to refinement after Q1-Q5 resolved.

1. **Hero** — banner slider OR full-width hero with announcement bar
2. **Featured categories** — dynamic from `feature_category_show` (BUG-1 of Sprint 2 must be merged first or section is empty)
3. **Trending products** — `/product/trending_product`
4. **Active offers/bundles** — offer cards linking to `/offer/:id`
5. **Brand story / Trust grid** — trust points (new lib function from H1 BLOCKER 5)
6. **New arrivals** — Q2 decision dependent
7. **Testimonials** — Q5 decision dependent; skip if no content
8. **Newsletter / contact CTA** — simple section
9. **Footer** — existing, already updated

#### Acceptance

- Home page loads in <2s on 4G
- No console errors
- All 9 sections render with real data (empty-state self-hide where data missing — pattern from PDP themed sections)
- Mobile + tablet + desktop responsive
- Theme colors match PDP (post Q1 resolution)
- Anonymous user: browse → click product → cart → checkout (Sprint 1 critical flow)
- Lighthouse: Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 90
- View source: all SEO meta tags + JSON-LD present

#### Contract — BE

- (Q2-dependent) Possibly new `/product/new_arrival?sort=createdAt&limit=N` endpoint
- (No other BE work — all data sources already exist)

#### Contract — Admin

- (No admin work initially)
- (Q4-dependent — admin section reorder UI defers to Sprint 4)

#### Contract — FE

- Rewrite `src/app/(frontend)/page.js`
- New components in `src/components/frontend/home/v2/` — keep `home/` for safety transition
- New `src/components/lib/getTrustPoints.js` server lib function
- Default theme CSS vars added to `globals.css` (Q1=b)
- Fix `BannerItem.jsx` empty-state guard
- Convert `CategoryWiseProduct` to server component (Q3)

#### Files

- BE: Maybe `product.routes.ts` + `product.controllers.ts` + `product.services.ts` (Q2-dependent new arrivals endpoint)
- FE:
  - `src/app/(frontend)/page.js` (rewrite)
  - `src/components/frontend/home/v2/` (new folder, 9 section components)
  - `src/components/lib/getTrustPoints.js` (new)
  - `src/app/globals.css` (CSS var defaults)
  - `src/components/frontend/home/banner/BannerItem.jsx` (empty-state guard)
  - `src/components/frontend/home/categoryWiseProduct/CategoryWiseProduct.jsx` (convert to server component OR delete)

---

### Item 2 — **Floating images rethink** (~?, BLOCKED on sketch)

Owner has a new concept for the floating fruit-image placement system. Provides a hand-drawn sketch + discussion before code can start.

Status: **BLOCKED** until sketch arrives. Not estimated.

---

### Item 3 — **PDP refinement pass** (post-H1, ~?)

After H1 ships and owner uses the new home page in production for a few days, common patterns may emerge that benefit the PDP too (typography unification, spacing rhythm, transition consistency). Hold this as a placeholder; design pass triggered after H1 live test.

---

### Item 4 — **Admin section reorder UI (Q4 deferred)** (~6-8h)

If Q4 in H1 turns out to be a YES later, add an admin Page Content style editor for home sections (drag-reorder + toggle on/off). Schema lives in `setting.home_layout` or a new `homeLayout` collection.

---

## Sprint 3 vs Admin 2.0

Sprint 3 is **storefront frontend redesign only**. Admin redesign work is parked in [[admin-2-rebuild-backlog]]:

- CREATE wizard (Item 9)
- Theme create page friendlier (Item 6)
- Theme preview page improve (Item 7)
- Page-Content editor friendlier (Item 12)

Those happen in a separate ground-up Admin 2.0 rebuild, not Sprint 3.

---

## Open before Sprint 3 starts

- [ ] Sprint 2 fully shipped + owner live-tested
- [ ] Owner answers Q1-Q5 above (~30 min discussion at start of Sprint 3)
- [ ] If Q5=yes, owner provides 3-5 testimonials text + photos
- [ ] Reference site/screenshot if owner has visual preference (otherwise Claude designs based on PDP aesthetic + ZatiqEasy/fruit-shop patterns)

## Resume notes

**Sprint 3 not yet started.** When Sprint 2 ships, owner kicks off Sprint 3 with the Q1-Q5 discussion. Audit findings already absorbed into this plan; no need to re-run plan-edge-auditor unless scope changes.
