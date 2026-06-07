# FruitSnacks Home Page — Design Brief
**Source:** Claude-generated demo V1 + V2 (`.claude/work/demo-frontend/`)
**Date:** 2026-06-06
**Purpose:** Reference doc for actual Next.js implementation

---

## V1 vs V2 — কোন seller-এর জন্য কোনটা

| | V1 | V2 |
|---|---|---|
| **Target** | ছোট / মাঝারি seller | বড় / premium seller |
| **Palette** | Green + Honey (#2D5F3F + #C97B3D) | Plum + Bronze (#6B2D5F + #D4A574) |
| **Hero** | Split layout (text left / image right) + blob bg | Image carousel (6 slides, swipe support) |
| **Product card** | Hover → quick-add button | Hover → Quick View modal trigger |
| **Search** | 3-tier dropdown | 3-tier dropdown (same pattern, better animations) |
| **Footer** | Simple dark | Enhanced (brand story + newsletter inline) |
| **Extras** | — | Quick View modal, Compare feature, Tweaks panel |

**আমাদের decision:** V1-এর **Global Search pattern** + V2-এর **Product card + Quick View modal** নেব। Visual style = সবুজ থিম (existing Tailwind green palette).

---

## ১. Navbar + TopBar

### TopBar (V1 pattern — simple, readable)
```
[Rotating announcement] | [ঢাকা সহ সারা দেশে ডেলিভারি] | [Phone] | [Order Track →]
```
- Dark green background (`#1A2820` / `secondary-900`)
- 5s interval এ announcement rotate হয়
- মোবাইলে center text-ই দেখাবে, phone/track hidden

### Navbar
```
[☰ Hamburger] [🌿 FruitSnacks] [________Search box________] [শপ] [অফার] [গল্প] | [👤] [♡] [🛍 3]
```
- Sticky, scroll করলে shadow + backdrop blur add হয়
- Logo = leaf icon + "FruitSnacks" wordmark
- Search box = center, expands on focus
- Mega menu: "শপ" hover-এ open হয় → 3 column (categories / featured products / seasonal promo)
- মোবাইলে: hamburger → Drawer side menu

---

## ২. Global Search Dropdown (V1 pattern — এটাই নেব)

Search box-এ focus/type করলে dropdown open হয়। **3 state:**

### State A — Empty (no query typed)
```
[🕐 সাম্প্রতিক খোঁজ]
  [খেজুর] [বাদাম] [মিক্সড নাটস] [সব মুছুন ✕]

[🔥 জনপ্রিয় খোঁজ]
  [কাজুবাদাম] [ড্রাই ফ্রুট] [গিফট বক্স] ...

[🎁 আপনার জন্য বাছাই]
  [Product thumb] [Product thumb] [Product thumb]  ← mini product row
```

### State B — Query typed, results found
```
৬টি পণ্য পাওয়া গেছে "বাদাম" এর জন্য

[Product image] [Product name]              [›]
[Product image] [Product name] ৳৪৫০ ~~৬০০~~ [›]
...

[📁 ক্যাটাগরিতে]
  [📁] নাটস এন্ড সিডস (২৩)

→ "বাদাম" এর সব ফলাফল দেখুন
```

### State C — No results
```
[🔍 big icon]
"xyz" পাওয়া যায়নি
চেষ্টা করুন: [popular keyword pills]
```

### Implementation notes (Next.js)
- Search input → debounced `GET /product?search=...&limit=5` (RTK Query)
- Recent searches → localStorage (max 5)
- Popular keywords → hardcode বা `GET /product/trending_product` থেকে name নিন
- Trending now mini row → `GET /product/trending_product?limit=4`
- Category matches → client-side filter from cached menu data
- Dropdown = absolute positioned div, click outside বা ESC → close

---

## ৩. Hero Section

### V1 Hero — Split layout (আমাদের default)
```
LEFT (55%)                    RIGHT (45%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SINCE 2024 · CRAFTED IN BD   [blob background]
                              [product image - rotated/floating]
প্রতিদিনের জন্য              [badge: "নতুন"]
একটু ভালো                   [price card: ৳৩৫০ থেকে শুরু]
কিছু।
~~~~ (squiggle underline)

হাতে বাছাই করা খেজুর, বাদাম
আর শুকনো ফল...

[শপ এখনই →]  [আমাদের গল্প পড়ুন]

[✓ ফ্রি ডেলিভারি] [◇ ১০০% খাঁটি] [↺ ৭ দিন রিটার্ন] [💳 ক্যাশ অন ডেলিভারি]
```

- cursor tracking effect on hero media (mouse move → image tilts)
- Hero = existing `Banner.jsx` component (SSR, from `/banner` API)
- **BannerItem null-guard চাই:** `if (!bannerData?.length) return null` (Swiper loop + 0 slides crash করে)

### Alternative: V2 Hero — Carousel (admin বেশি banner add করলে)
- 6-slide autoplay (4s delay)
- Touch swipe support
- Keyboard arrow navigation
- Dot pagination + pause on hover

---

## ৪. Product Card (V2 pattern — এটাই নেব)

```
┌─────────────────┐
│  [Product image]│ ← aspect-[3/4]
│  [−20%] [NEW]   │ ← badges top-left
│         [♡] [👁]│ ← tools top-right (wishlist + quick view)
│  ─────────────  │ ← hover reveal slides up
│  [Nuts]         │
│  [Product Name] │
│  ৳৪৫০ ~~৬০০~~  │
│  [Add to bag]   │
└─────────────────┘
```

**Hover behavior:**
1. Image zoom (scale 1.05)
2. Dark shade overlay appears
3. Bottom panel slides up with: category, name, price, "Add to bag" button
4. Tool buttons (♡ wishlist, 👁 quick view) appear top-right

**Click on card = Quick View modal opens** (V2 pattern)
**"Add to bag" button click = directly add to cart** (no modal needed)

### Quick View Modal (V2)

```
┌────────────────────────────────────────────────────┐
│  [×]                                               │
│ ┌──────────────┐  ┌──────────────────────────────┐ │
│ │ [Main image] │  │ ক্যাটাগরি · ভ্যারিয়েশন      │ │
│ │              │  │ পণ্যের নাম (Bangla)           │ │
│ │              │  │ ★★★★☆ ৪.৩ · ১২৭ reviews      │ │
│ │ [thumb][th..]│  │                               │ │
│              │  │ ৳৪৫০     ~~৬০০~~  Save ৳১৫০   │ │
│              │  │                               │ │
│              │  │ [ধরন: কাঁচা ●  রোস্টেড ●]     │ │
│              │  │ [সাইজ: ২৫০গ্রা | ৫০০গ্রা | ১কেজি] │
│              │  │ [প্যাকেজিং: স্ট্যান্ডার্ড | গিফট টিন +১৫০]│
│              │  │                               │ │
│              │  │ 🟢 স্টকে আছে · ২৪টি           │ │
│              │  │                               │ │
│              │  │ [−] [  2  ] [+]               │ │
│              │  │ [🛍 Add to bag — ৳৯০০]        │ │
│              │  │                               │ │
│              │  │ [♡ Wishlist] [↑ Share]        │ │
│              │  │                               │ │
│              │  │ শেলফ লাইফ | উৎস | প্রক্রিয়া  │ │
│              │  │ [🚚 ২ঘণ্টায় ঢাকা] [✓ ১০০% খাঁটি]│ │
│              │  │ View full details →            │ │
│ └──────────────┘  └──────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Modal data from existing product API response:**
- Gallery → `main_image` + `other_images[]` (4 thumbs)
- Variations → `variations[]` (weight/size pills with price)
- Stock → `product_quantity` / `is_low_stock`
- Rating → aggregate from reviews
- Attributes → `attributes_details[]`

**Modal wiring (Next.js):**
- Global state: `quickViewProductId` in Redux
- On open: `GET /products/:slug` বা product data already in card
- Close: ESC key বা backdrop click বা × button
- Body scroll lock when open

---

## ৫. Home Sections — Full Page Layout

```
[TopBar]
[Navbar + Search]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
S1. Hero Banner (SSR)
    API: GET /banner
    → BannerItem carousel

S2. Feature Categories
    API: GET /category/feature_category
    → 6 category tiles, 2-3 col grid
    → image + name + hover zoom

S3. Flash Sale (conditional — hide if none active)
    API: GET /flash_sale
    → countdown timer (H:M:S) + product slider
    → green/coral accent bar

S4. Bestsellers
    API: GET /product/top_selling?limit=8
    → ProductCard grid (4 col desktop, 2 mobile)
    → Section header: "বেস্টসেলার" + "সব দেখুন →"

S5. Offers Block (conditional — hide if no active offers)
    API: GET /offer (filter active)
    → 3-col dark overlay cards with: tag, name, save amount
    → Click → /offer/:_id

S6. New Arrivals
    API: GET /product/new_arrival?limit=8
    → ProductCard grid
    → Section header: "নতুন কালেকশন"

S7. Brand Story (conditional — hide if no content in settings)
    API: settings.brand_story_* fields
    → Split layout: text left + image right (or reverse)
    → CTA button

S8. Reviews Carousel
    API: GET /review?rating=5&has_photo=true OR /review/by-ids
    → Swiper carousel of review cards
    → Avatar + name + rating + text + product photo

S9. Trust Points
    API: GET /trust-point
    → 4-col icon grid: icon + title + desc
    → e.g. ১০০% খাঁটি | দ্রুত ডেলিভারি | সহজ রিটার্ন | COD

S10. Trending Products
    API: GET /product/trending_product
    → ProductCard horizontal scroll (mobile) / 4-col grid (desktop)
    → Growth % badge on card

S11. Site FAQ (conditional — hide if no active FAQs)
    API: GET /site-faq/active
    → Left: eyebrow + title + WhatsApp CTA
    → Right: accordion list

S12. Newsletter
    API: POST /newsletter-subscriber/subscribe
    → Email / Phone / Both (based on settings.newsletter_collect)
    → "সাবস্ক্রাইব করুন" → success message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Footer]
[FloatingChat: WhatsApp + Messenger]
[BottomNav (mobile)]
```

---

## ৬. Existing Components — কোনটা রাখব, কোনটা rewrite

| Component | Status | Action |
|---|---|---|
| `Banner.jsx` + `BannerItem.jsx` | ✅ রাখব | Null-guard add করতে হবে |
| `FlashSale.jsx` | ✅ রাখব | Already fixed (null-return) |
| `TrendingProduct.jsx` | ✅ রাখব | Visual redesign only |
| `LatestProducts.jsx` | ✅ রাখব | Visual redesign only |
| `PopularProducts.jsx` | 🔄 Refactor | Label ঠিক করতে হবে (এখন "New Arrival" লেখা আছে কিন্তু top_selling data) |
| `CategoryWiseProduct.jsx` | ⏸ Keep disabled | Default off in HOME_SECTION_DEFAULTS |
| `FeatureService.jsx` | 🔄 Replace | Trust Points API দিয়ে replace করব |
| `PromotionalBanner.jsx` | 🔄 Redesign | Leather copy সরাতে হবে |
| `BrandStory.jsx` | ✅ রাখব | Track D-তে done |
| `ReviewsCarousel.jsx` | ✅ রাখব | Track D-তে done |
| `SiteFaqSection.jsx` | ✅ রাখব | Track D-তে done |
| `NewsletterForm.jsx` | ✅ রাখব | Track D-তে done |
| `FeatureCategories.jsx` | 🆕 Rewrite | Old design ছিল — new tile design চাই |

---

## ৭. নতুন Components চাই

| Component | কোথায় | কী করবে |
|---|---|---|
| `QuickViewModal.jsx` | `shared/` বা `home/quickView/` | V2 modal — global state driven |
| `OffersBlock.jsx` | `home/offersBlock/` | Dark card grid, GET /offer |
| `TrustStrip.jsx` | `home/trustStrip/` | GET /trust-point, 4-col grid |
| `FeatureCategories.jsx` | `home/featureCategories/` | Rewrite — GET /category/feature_category |
| `getTrustPoints.js` | `lib/` | Server-side fetch wrapper |
| `globals.css` | CSS vars | `--brand-primary: #2D5F3F` etc. defaults |

---

## ৮. Shared Design Tokens (globals.css এ add করব)

```css
:root {
  --brand-primary:   #2D5F3F;   /* deep green */
  --brand-accent:    #C97B3D;   /* honey/amber */
  --brand-bg:        #FAF6EE;   /* cream */
  --brand-parchment: #F2EBDB;   /* warm off-white */
  --brand-ink:       #1A2820;   /* topbar bg */
}
```

Tailwind palette (`primary-*`, `secondary-*`) ইতিমধ্যে configured — CSS vars শুধু home-page specific floating designs এর জন্য।

---

## ৯. Mobile-specific

- **BottomNav:** 5 items — Home / Search / Cart / Wishlist / Profile
- **Mobile Search:** Full-screen overlay (V2 pattern)
- **Drawer:** Left-side slide-out, accordion mega menu
- **Product cards:** 2-col grid (mobile), 4-col (desktop)
- **Flash sale strip:** Horizontal scroll on mobile

---

## ১০. Animations (V1 pattern — lightweight)

- Scroll reveal: IntersectionObserver → `opacity: 0 → 1` + `translateY(20px → 0)`, 0.5s ease
- Section child stagger: 100ms delay per item (V2 pattern, but lightweight)
- Navbar: smooth box-shadow on scroll
- Quick View: slide-in from right (desktop), slide-up from bottom (mobile)
- Product card hover: 200ms transition
- **No heavy parallax / sparkle particle fields** (V2 এর tweaks system বাদ)

---

## ১১. SSR vs Client — boundary plan

```
Home.jsx (server component — async)
├── getServerSettingData() → settings
├── Banner.jsx (server — GET /banner)
├── FlashSale.jsx (server — GET /flash_sale)
└── SectionRenderer.jsx (client boundary)
    ├── FeatureCategoriesSection (server → lift up to Home.jsx?)
    ├── BestsellersStrip (client — TanStack Query)
    ├── OffersBlock (client — TanStack Query, conditional)
    ├── NewArrivalsStrip (client — TanStack Query)
    ├── BrandStory (client — reads settings prop)
    ├── ReviewsCarousel (client — TanStack Query)
    ├── TrustStrip (client — TanStack Query)
    ├── TrendingStrip (client — RTK Query)
    ├── SiteFaqSection (client — TanStack Query)
    └── NewsletterForm (client — mutation)
```

**FeatureCategories:** `GET /category/feature_category` → 300s cache → server component এ lift করলে ভালো (SEO benefit).

---

## ১২. Files to create/modify (implementation map)

### New files
- `src/components/frontend/home/quickView/QuickViewModal.jsx`
- `src/components/frontend/home/quickView/quickViewSlice.js` (Redux slice for open/close state)
- `src/components/frontend/home/offersBlock/OffersBlock.jsx`
- `src/components/frontend/home/trustStrip/TrustStrip.jsx`
- `src/components/frontend/home/featureCategories/FeatureCategoriesSection.jsx` (new design)
- `src/components/lib/getTrustPoints.js`
- `src/components/lib/getFeatureCategories.js`
- `src/components/frontend/navbar/SearchDropdown.jsx` (global search V1 pattern)

### Modify
- `src/components/frontend/home/banner/BannerItem.jsx` — null-guard
- `src/components/frontend/home/popularProducts/PopularProducts.jsx` — label fix
- `src/components/frontend/home/featureService/FeatureService.jsx` — replace with TrustStrip
- `src/components/frontend/home/promotionalBanner/PromotionalBanner.jsx` — remove leather copy
- `src/app/globals.css` — CSS var defaults
- `src/components/frontend/home/Home.jsx` — add FeatureCategories server-side
- Redux store — add quickView slice

---

## ১৩. Cart Drawer + Floating Bubble (V2 — নতুন, OWNER DECISION LOCKED)

### Trigger rules

| Action | What happens |
|---|---|
| **Add to Cart** | Floating cart bubble appears (right side, mid-page) |
| **Bubble click** | Cart Drawer opens (slide-in from right) |
| **Cart empty** | Bubble hidden |
| **Navbar cart icon click** | Direct → `/checkout` (NO drawer, no stop) |
| **Drawer "Checkout →" button** | Direct → `/checkout` |

---

### A. Floating Cart Bubble

```
                              Right edge, vertically centered
                              ┌─────────────┐
                              │  🛍  [3]    │  ← white, rounded-left pill
                              │  ৳১,২৫০    │  ← subtotal
                              └─────────────┘
```

- `position: fixed; right: 0; top: 50%; transform: translateY(-50%)`
- White background, shadow, rounded left corners (`rounded-l-2xl`)
- Cart icon + item count badge (green circle)
- Subtotal amount below icon
- **Hidden when `cartCount === 0`**
- Click → `openCartDrawer()`
- Appears/disappears with smooth fade+slide transition

---

### B. Cart Drawer Layout

```
┌────────────────────────────────────────┐  max-width: 440px, right: 0
│  আপনার ব্যাগ  [3]                 [×]  │  ← header
├────────────────────────────────────────┤
│  ৳৮৫০ দূরে ফ্রি ডেলিভারি থেকে        │  ← free ship progress
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░   │
├────────────────────────────────────────┤
│  [thumb]  Product Name            [×]  │  ← scrollable items
│           ৫০০গ্রা · স্ট্যান্ডার্ড      │
│           [−] [2] [+]         ৳৯০০    │
│  ──────────────────────────────────── │
│  [thumb]  Product Name            [×]  │
│           ২৫০গ্রা · গিফট টিন          │
│           [−] [1] [+]         ৳৫০০    │
├────────────────────────────────────────┤
│  সর্বমোট                   ৳১,৪০০    │  ← sticky footer
│  ডেলিভারি        চেকআউটে হিসাব হবে   │
│                                        │
│  [      চেকআউট →      ]               │  ← → /checkout
│       কেনাকাটা চালিয়ে যান            │  ← closeDrawer
│  🔒 bKash · Nagad · Visa · COD         │
└────────────────────────────────────────┘
```

### C. Empty state (drawer open, no items)
```
    [🛍 big icon, light bg circle]
    আপনার ব্যাগ খালি
    পছন্দের পণ্য যোগ করুন
    [কেনাকাটা শুরু করুন →]  ← closeDrawer
```

### D. Behavior
- Drawer: backdrop click → close, ESC → close, body scroll lock when open
- Qty +/− inline → `updateQty(key, delta)`, min 1
- Remove [×] → `removeItem(key)`, smooth height collapse
- Free shipping bar: `৳1500` threshold, animated width fill
- Drawer Checkout btn → `router.push("/checkout")` + `closeCartDrawer()`
- Navbar cart icon → `router.push("/checkout")` directly (no drawer)

### E. Free shipping bar
```js
const FREE_SHIP_THRESHOLD = 1500; // ৳ hardcode এখন, settings থেকে পরে
const toGo = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
const pct  = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);
```

### F. Implementation notes (Next.js)

**State — Redux cartSlice এ add:**
```js
// cartSlice.js এ নতুন state + actions
cartDrawerOpen: false,
// actions:
openCartDrawer, closeCartDrawer
```

**New files:**
- `src/components/frontend/cart/CartDrawer.jsx` — `"use client"`, reads Redux
- `src/components/frontend/cart/FloatingCartBubble.jsx` — `"use client"`, fixed position

**Mount point — `(frontend)/layout.js` এ:**
```jsx
<CartDrawer />          {/* global, always mounted */}
<FloatingCartBubble />  {/* global, always mounted */}
```

**Navbar cart icon — wiring change:**
```jsx
// Navbar.jsx
<Link href="/checkout">
  <Icon name="bag" /> {cartCount > 0 && <span>{cartCount}</span>}
</Link>
// NOT onClick openCartDrawer — goes direct to checkout
```

**Cart item thumbnail:**
- `cartItem.main_image` বা `cartItem.variation_image` (whichever exists)
- Fallback: placeholder

**Variant display string:**
- `${size} · ${color} · ${packaging}` — যা আছে তা join করব

---

## Summary — আমরা কী নিচ্ছি কোথা থেকে

| Feature | Source |
|---|---|
| Global Search dropdown | **V1** topnav.jsx `SearchDropdown` |
| Product card design | **V2** catalog.jsx `ProductCard` |
| Quick View modal | **V2** quickview.jsx `QuickView` |
| **Cart Drawer (slide-out)** | **V2** cart.jsx `CartDrawer` |
| Hero layout | **V1** (split) — Banner API drive করে |
| Section structure | **V1** simpler, lightweight |
| Animations | **V1** scroll reveal (no heavy V2 sparkles) |
| Color palette | Existing FruitSnacks green (`primary-*` Tailwind) |
| Mega menu | **V1** 3-col pattern |
| Mobile BottomNav | Both (same pattern) |
