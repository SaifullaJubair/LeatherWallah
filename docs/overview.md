# FruitSnacks — সম্পূর্ণ প্রজেক্ট ওভারভিউ

> এই ডকুমেন্ট পুরো FruitSnacks প্ল্যাটফর্মের high-level architecture, ৩টি sub-project কীভাবে interconnected, ডেটা কীভাবে flow করে — সব ব্যাখ্যা করে।
> যদি project clone করে শুরু করতে চান, এই ফাইল প্রথমে পড়ুন।

> ⚠️ **২০২৬-০৬-১৬ তে re-audit করা।** মূল আপডেট: ক্যাটাগরি এখন nested tree (পুরোনো 3-level সরানো), offerOrder মডিউল order-এ merge, module ৩৭ → ৪৫+, fresh-DB-তে `npm run bootstrap` দিয়ে super-admin তৈরি (manual নয়)।

---

## প্রজেক্ট কী

FruitSnacks হলো একটি সম্পূর্ণ **e-commerce প্ল্যাটফর্ম** যা মূলত বাংলাদেশী মার্কেটের জন্য ডিজাইন করা — তবে যেকোনো পণ্যের জন্য reusable। মূল উদ্দেশ্য:

- কাস্টমার অনলাইনে product browse, order করতে পারবে
- অ্যাডমিন/স্টাফ product, order, customer, marketing manage করবে
- Pathao ও Steadfast courier integration দিয়ে delivery automated
- Meta/TikTok/Google analytics দিয়ে marketing tracking
- প্রতিটি product page-এ আলাদা theme (color, fonts, floating images) — unique brand presentation

এই codebase মূলত একটা Bangladesh leather e-commerce project (Artisan Leather) থেকে copy করে **FruitSnacks** নামে rebrand করা হয়েছে। Buyer চাইলে এই platform কিনে নিজের brand-এ deploy করতে পারে।

---

## ৩টি Sub-Project

```
FruitSnacks/
├── FruitSnacksBackend/    # Express + TypeScript + MongoDB REST API
├── FruitSnacksAdmin/      # React + Vite admin dashboard (SPA)
└── FruitSnacksFrontend/   # Next.js 14 storefront (SSR/SSG/ISR)
```

| Sub-project | Stack | Dev Port | Purpose |
|-------------|-------|----------|---------|
| **Backend** | Express, TypeScript, Mongoose, S3 (DigitalOcean Spaces) | 5000 | একমাত্র সার্ভার। Admin ও Frontend দুটোই এটাকে call করে। |
| **Admin** | React 18, Vite, React Query, Tailwind | 3001 | অ্যাডমিন/স্টাফ ড্যাশবোর্ড। কোনো SSR নেই। |
| **Frontend** | Next.js 14 (App Router), Redux Toolkit, RTK Query, Tailwind | 3000 | কাস্টমার-facing storefront। SEO-friendly, server-rendered। |

### প্রতিটি প্রজেক্টের বিস্তারিত ডকুমেন্টেশন:

- 📘 [docs/backend.md](backend.md) — Backend ৪৫+ মডিউল, API endpoints, schema
- 📗 [docs/admin.md](admin.md) — Admin pages, components, data flow
- 📕 [docs/frontend.md](frontend.md) — Frontend pages, Redux setup, SEO, analytics
- 🐛 [docs/issues.md](issues.md) — পরিচিত bugs ও improvement opportunities (85টি)
- 📋 [FEATURE_PLAN.md](../FEATURE_PLAN.md) — Dynamic Product Page System spec

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         কাস্টমার                                  │
│                    (Browser/Mobile)                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  FruitSnacksFrontend        │
                │  Next.js 14 (port 3000)     │
                │  fruitsnacksbd.com          │
                │                             │
                │  ─ Server Components (SSR)  │
                │  ─ ISR (60-3600s)           │
                │  ─ Redux Toolkit + RTK      │
                │  ─ Cart in localStorage+DB  │
                │  ─ Analytics: Meta, TikTok, │
                │    GTM, Clarity             │
                └─────────────────────────────┘
                              │
                              │  HTTPS + Cookie
                              │  (fruit_snacks_token)
                              ▼
                ┌─────────────────────────────┐
                │  FruitSnacksBackend         │      ┌──────────────────┐
                │  Express + TypeScript       │ ◄──► │  MongoDB         │
                │  (port 5000)                │      │  (Mongoose)      │
                │  api.fruitsnacksbd.com      │      └──────────────────┘
                │                             │
                │  ─ 45+ CRISM modules        │      ┌──────────────────┐
                │  ─ JWT cookie auth          │ ◄──► │  DigitalOcean    │
                │  ─ RBAC (~100 perm flags)   │      │  Spaces (S3)     │
                │  ─ Cron (campaign expire)   │      └──────────────────┘
                │  ─ External APIs:           │
                │    • Pathao courier         │      ┌──────────────────┐
                │    • Steadfast courier      │ ◄──► │  Pathao /        │
                │    • FraudBD                │      │  Steadfast APIs  │
                │    • Meta/TikTok CAPI       │      └──────────────────┘
                │    • BulkSMS BD             │
                └─────────────────────────────┘
                              ▲
                              │  HTTPS + Cookie
                              │  (fruit_snacks_token)
                              │
                ┌─────────────────────────────┐
                │  FruitSnacksAdmin           │
                │  React + Vite SPA           │
                │  (port 3001)                │
                │  admin.fruitsnacksbd.com    │
                │                             │
                │  ─ 35+ pages                │
                │  ─ React Query              │
                │  ─ Cookie auth (admin)      │
                │  ─ Permission-gated UI      │
                └─────────────────────────────┘
                              ▲
                              │
                              │
                  ┌────────────────────────┐
                  │   অ্যাডমিন / স্টাফ        │
                  └────────────────────────┘
```

---

## ডেটা ফ্লো (Data Flows)

### ১. কাস্টমার Product Browse + Order Flow

```
1. কাস্টমার fruitsnacksbd.com → Frontend
2. Frontend SSR-এ getMenu(), getBanner(), etc. → Backend GET requests
3. Backend MongoDB থেকে data fetch → return → Frontend HTML render
4. কাস্টমার product detail page click → /products/:slug
5. Frontend SSR: GET /product/:slug (no-cache) → Backend
   - Backend populates: category (nested tree + ancestor path), brand, theme, campaign
   - Validates category active status
   - Returns product + variations
6. Frontend renders: PDP with theme, JSON-LD, themed sections
7. কাস্টমার "Add to Cart" → Redux dispatch addToCart
   - cartLocalStorageMiddleware → localStorage save
   - (logged in হলে) → PUT /cart (debounced 500ms)
8. /cart page → CartTable + CouponSection + CartSummary
9. /checkout page → DeliveryInformation + OrderSummary
10. Place Order → POST /order to Backend
    - Backend: invoice generate, totals calculate
    - Mongoose transaction: orders + orderproducts + stock decrement
    - Returns invoice_id
11. Frontend → /orders/order-success → analytics trackPurchase()
    - Meta Pixel + TikTok Pixel + CAPI server calls
    - GTM dataLayer push
```

### ২. অ্যাডমিন Order Processing Flow

```
1. অ্যাডমিন admin.fruitsnacksbd.com → Admin SPA
2. Sign-in → POST /admin_reg_log/login → cookie set
3. AuthProvider GET /admin_reg_log → admin info + role populated
4. /order page → GET /order/dashboard (paginated, sort by date desc)
5. Sidebar শুধু permission-allowed menus দেখায়
   (e.g., order_show flag true থাকলে /order menu show)
6. অ্যাডমিন "Send to Pathao" click → POST /courier/pathao/send/:order_id
   - Backend: Pathao API call with order details
   - Token cached in-memory (expiry tracked)
   - consignment_id returned, saved in order document
   - order_status → "processing"
7. Pathao webhook (auto):
   - Pathao → POST /webhook/pathao (no auth, expects 202)
   - Backend updates order document with delivery status
   - order_status updates real-time
8. অ্যাডমিন /pathao-order page → real-time status visible
```

### ৩. Theme Update Flow (Dynamic Product Page System)

```
1. অ্যাডমিন /theme/create → ThemeForm with color picker, floating asset upload
2. Save → POST /theme (multipart with thumbnail_preview file)
3. Backend creates theme document, S3 uploads complete
4. অ্যাডমিন /product/page-content/:id → ProductPageContentEditPage
5. Theme select dropdown → useGetThemes() → /theme list
6. Save → PATCH /product (with theme_id)
7. Backend product schema hook:
   - Old theme: themes.used_in_products -1
   - New theme: themes.used_in_products +1
   - themes.is_deletable auto recalculate
8. কাস্টমার /products/:slug → Frontend SSR
9. Frontend GET /product/:slug returns product with theme populated
10. ProductThemedSections renders with theme.colors, floating_assets, etc.
```

---

## Shared Conventions (সব sub-project-এ একই)

### Authentication Cookie

```
Cookie name: fruit_snacks_token
Type: httpOnly, signed JWT
Set by: Backend (on login)
Read by: Backend (verifyToken middleware)
Sent by: Admin + Frontend (all fetches with credentials: 'include')
```

JavaScript থেকে এই cookie পড়া যায় না (httpOnly) — তাই Admin/Frontend শুধু "current user info" query করে check করে user logged-in কিনা।

### API Response Format

সব backend response standardized:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "...",
  "data": { ... },
  "totalData": 42         // pagination-এ
}
```

Error হলে:
```json
{
  "success": false,
  "message": "...",
  "errorMessages": [{ "path": "", "message": "..." }]
}
```

### Image/File URLs

Backend image upload করে DigitalOcean Spaces (S3-compatible)। প্রতি ছবির জন্য দুটো ফিল্ড সংরক্ষিত:
- `<thing>_image` — public URL (frontend-এ display)
- `<thing>_image_key` — S3 key (delete-এ লাগে)

S3 folder structure:
- `fruit_snacks_images/<uuid>-<filename>`
- `fruit_snacks_videos/<uuid>-<filename>`

### Soft Delete Pattern

Core entities (product, category, user, admin, etc.) `status: "active" | "in-active"` ফিল্ড ব্যবহার করে — actual DB delete হয় না। শুধু transient data (cart, OTP) hard delete।

### Slug Convention

URL-safe lowercase string, dash-separated:
- Admin: [`src/utils/generateSlug.js`](../FruitSnacksAdmin/src/utils/generateSlug.js)
- Backend: slug history (`product_slug_history`) — 301 redirect support
- Frontend: PDP route-এ old slug hit হলে `redirect_slug` field থাকলে redirect

---

## Domain Architecture (CORS Allowlist)

Backend [`src/index.ts`](../FruitSnacksBackend/src/index.ts)-এ allowed origins:

**Development:**
- `http://localhost:3000` (Frontend)
- `http://localhost:3001` (Admin)
- `http://localhost:4173` (Vite preview)

**Production (fruitsnacksbd.com family):**
- `https://fruitsnacksbd.com` + www (Frontend prod)
- `https://dev.fruitsnacksbd.com` + www (Frontend staging)
- `https://admin.fruitsnacksbd.com` + www (Admin prod)
- `https://dev-admin.fruitsnacksbd.com` + www (Admin staging)
- `https://fruitsnacks-frontend.vercel.app` (Vercel preview)

⚠️ Buyer নতুন domain-এ deploy করলে এই array-তে যোগ করতে হবে।

---

## Permission System (RBAC)

### Flow

```
[Admin role document]
  ↓ contains ~100 boolean permission flags
  ↓ (category_post, product_update, theme_delete, etc.)
  ↓
[Admin user document]
  ↓ role_id reference
  ↓
[Login JWT]
  ↓ admin_phone in payload
  ↓
[verifyToken(permission) middleware on backend route]
  ↓ check user.role.{permission} === true
  ↓
[Admin UI page]
  ↓ user?.role_id?.{permission} === true → render content
  ↓
[Admin sidebar menu]
  ↓ user?.role_id?.{permission} === true → show menu
```

### Permission Flag Locations (must stay synced)

| File | Type |
|------|------|
| [`FruitSnacksBackend/src/app/role/role.interface.ts`](../FruitSnacksBackend/src/app/role/role.interface.ts) | TypeScript interface |
| [`FruitSnacksBackend/src/app/role/role.model.ts`](../FruitSnacksBackend/src/app/role/role.model.ts) | Mongoose schema |
| `verifyToken("flag")` calls in backend route files | Backend enforcement |
| [`FruitSnacksAdmin/src/data/permissionData.js`](../FruitSnacksAdmin/src/data/permissionData.js) | Admin UI checkbox |
| Sidebar / Page-level `user?.role_id?.flag` checks | Admin UX gating |

নতুন permission যোগ করলে ৪-৫ জায়গায় change দরকার। Drift risk — admin-issues A-8 দেখুন।

### Common Flags

- `category_show/post/update/delete` (nested tree — পুরোনো sub_category/child_category/specification flag বাদ)
- `product_show/create/update/delete`
- `order_show/update`, `order_create_admin` (POS)
- `theme_show/create/update/delete`, `faq_template_*`, `trust_point_update`
- `site_setting_update`, `setting_secrets_update`
- `site_faq_*`, `newsletter_*`, `demo_data_clear`, `review_seed_*`
- `page_seo_show/update`
- ...

---

## Critical Backend Modules (45+)

ফুল লিস্ট [docs/backend.md](backend.md)-এ। গুরুত্বপূর্ণ গ্রুপ:

| Group | Modules |
|-------|---------|
| **Auth & Users** | authentication, adminRegLog, user, role, getme, supplier |
| **Catalog** | category (nested tree), brand, attribute, product, variation, productFilter |
| **Commerce** | cart, order (offer merged), orderProducts, courier (Pathao+Steadfast), webhook, fraud, coupon, payment |
| **Marketing** | campaign, offer, flashsale, banner, slider, review, question |
| **Storefront extras** | wishlist, wallet, loyalty, abandonedCart, productFeed, siteFaq, newsletterSubscriber, trustPoint |
| **Admin Config** | setting, pageSeo, theme, faq_template, dashboard, warehouse, demo |
| **Integrations** | metaPixel, tiktokPixel |

> ❌ সরানো module: `sub_category`, `child_category`, `specification` (nested tree + attribute engine-এ merged), `offerOrder` (orders-এ merged)।

### Most Critical Cross-Module Connections

```
products (model + 4 lifecycle hooks)
  ├─ depends on: categories (nested tree — parent_id + category_path; category OPTIONAL)
  ├─ depends on: brands, themes, suppliers, campaigns, admins
  └─ used by: variations, cart, orders, orderproducts, reviews, productFilter, wishlist

orders
  ├─ depends on: users, products, coupons, variations
  ├─ creates: orderproducts (transaction)
  ├─ courier integration: Pathao, Steadfast (send + webhook)
  └─ used by: fraud (history), analytics (purchase event)

themes
  ├─ used_in_products counter (auto-synced by product hooks)
  ├─ is_deletable derived from counter
  ├─ referenced by: products.theme_id, categories.default_theme_id
  └─ floating_assets array (S3 images; product-level floating_overrides layer on top)
```

---

## External Integrations

| Service | Used By | Purpose |
|---------|---------|---------|
| **DigitalOcean Spaces (S3)** | Backend | ফাইল/ছবি/ভিডিও storage |
| **MongoDB Atlas** (or self-hosted) | Backend | Primary database |
| **Pathao Courier** | Backend | Order delivery (OAuth, webhook) |
| **Steadfast Courier** | Backend | Order delivery (API key, webhook) |
| **FraudBD** | Backend | Phone-based fraud risk check |
| **Meta Conversion API** | Backend + Frontend | Server-side Facebook pixel events |
| **TikTok Conversion API** | Backend + Frontend | Server-side TikTok events |
| **Google Tag Manager** | Frontend | GA4 + custom tracking |
| **Microsoft Clarity** | Frontend | Heatmaps, session recordings |
| **BulkSMS BD** | Backend | OTP SMS পাঠানো |
| **SSLCommerz** | Backend (payment module) | Payment gateway (callback + IPN) |

---

## ক্রিটিক্যাল Flows যা multi-project span করে

### Cart Sync (Frontend ↔ Backend)

| Step | Frontend | Backend |
|------|----------|---------|
| 1. Guest add to cart | Redux `addToCart` + localStorage | – |
| 2. Login | `userLogin` mutation | POST `/user/login` → cookie set |
| 3. Post-login merge | `syncCartAfterLogin()` | POST `/cart/sync` → merge logic |
| 4. Page refresh (logged in) | `CartLoader` useEffect | GET `/cart` → DB cart returned |
| 5. Add to cart (logged in) | Middleware → PUT `/cart` debounced | PUT `/cart` → cart_user_id unique upsert |
| 6. Clear cart on order | Redux `allRemoveFromCart` | DELETE `/cart` (logged in) |

### Order Placement (Frontend → Backend → Pathao/Steadfast)

```
Frontend POST /order
  ↓
Backend:
  ├─ Generate invoice_id
  ├─ Validate coupon (`/coupon/check_coupon`)
  ├─ Mongoose transaction:
  │   ├─ orders document create
  │   ├─ orderproducts × N (per line item)
  │   └─ products.product_quantity -= ordered (atomic)
  ├─ Return invoice_id
  ↓
Frontend redirect /orders/order-success
  ↓
Admin /order/dashboard sees new order
  ↓
Admin POST /courier/pathao/send/:order_id
  ↓
Backend → Pathao API → consignment_id returned
  ↓
Order.courier_type = "pathao", consignment_id saved
  ↓
[Later] Pathao POST /webhook/pathao
  ↓
Backend updates order_status, courier status
  ↓
Customer GET /orders/order-tracking → sees updated status
```

### Theme Apply (Admin → Backend → Frontend PDP)

```
Admin /theme/create → POST /theme (multipart)
  ↓
Backend creates theme document, S3 upload
  ↓
Admin /product/page-content/:id → PATCH /product with theme_id
  ↓
Backend:
  ├─ Save product with new theme_id
  ├─ Lifecycle hook: themes.used_in_products +1
  └─ Old theme (if any): themes.used_in_products -1
  ↓
Frontend /products/:slug → GET /product/:slug populates theme
  ↓
PDP renders <ProductThemedSections /> with theme.colors,
  floating_assets, typography, button_style applied
```

---

## প্রজেক্ট স্ট্যাটাস

### Rebranding — ✅ Done

| Identifier | Old (Artisan Leather) | New (FruitSnacks) |
|-----------|------------------------|-------------------|
| Display name | Artisan Leather | **FruitSnacks** |
| Domain | artisenleather.com | **fruitsnacksbd.com** |
| Auth cookie | `artisan_lather_token` | **`fruit_snacks_token`** |
| Analytics cookie | `_artisan_uid` | **`_fruit_snacks_uid`** |
| S3 bucket | `artisen-leather` | **`fruit-snacks`** |
| S3 key prefix | `artisen_leather_images/` | **`fruit_snacks_images/`** |

### Dynamic Product Page System — ✅ DONE (+ পরবর্তী sprint shipped)

theming engine সম্পূর্ণ। তার পরেও shipped: nested category tree + variation/attribute/filter engine, order unification (offer merge, ৯-status), home layout builder + boutique preset, chat widgets, demo-seed, GATE-0 security, bootstrap। বিস্তারিত [docs/backend.md](backend.md) + handoff memory। theming সারসংক্ষেপ:
- প্রতিটি product page-এ unique theme (color, font, floating fruit images)
- `themes` collection — reusable theme presets
- `faq_templates` collection — reusable FAQ entries
- Product schema-তে: `theme_id`, `theme_overrides`, `short_description`, `badge_text`, `short_features[]`, `process_steps[]`, `benefits[]`, `use_cases[]`, `nutrition`, `faqs[]`, `og_*`
- Variation schema-তে: `variation_weight_grams` (Pathao courier-এর hardcoded `0.5kg` ফিক্স), `variation_badge_text`
- Setting schema-তে: `announcement_bar[]`

### Untouched (Intentionally)

- **Product domain copy** (wallet/bag/belt/leather references) — buyer Admin UI থেকে override করবে
- **`.env` credentials** — পুরোনো deployment-এর Mongo URI, S3, Pathao/Steadfast creds — buyer replace করবে

---

## নতুন developer-এর জন্য Setup Guide

### ১. Dependencies install

```bash
cd FruitSnacksBackend && npm install
cd ../FruitSnacksAdmin && npm install
cd ../FruitSnacksFrontend && npm install
```

### ২. .env files setup

প্রতি sub-project-এ `.env` (অথবা `.env.local`) লাগবে:

**FruitSnacksBackend/.env:**
```
MONGO_URI=mongodb+srv://...
PORT=5000
ACCESS_TOKEN=<random 64-byte hex>
S3_REGION=sgp1
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=fruit-snacks
S3_PUBLIC_URL=https://...
PATHAO_BASE_URL=...
PATHAO_CLIENT_ID=...
PATHAO_CLIENT_SECRET=...
PATHAO_CLIENT_EMAIL=...
PATHAO_CLIENT_PASSWORD=...
STEADFAST_CLIENT_ID=...
STEADFAST_CLIENT_PASSWORD=...
FRAUDBD_API_KEY=...
```

**FruitSnacksAdmin/.env:**
```
VITE_API_URL=http://localhost:5000
```

**FruitSnacksFrontend/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
META_PIXEL_ID=
GTM_ID=
GA4_ID=
CLARITY_ID=
TIKTOK_PIXEL_ID=
```

### ৩. Start servers (separate terminals)

```bash
# Terminal 1
cd FruitSnacksBackend && npm run dev   # http://localhost:5000

# Terminal 2
cd FruitSnacksAdmin && npm run dev     # http://localhost:3001

# Terminal 3
cd FruitSnacksFrontend && npm run dev  # http://localhost:3000
```

### ৪. প্রথম অ্যাডমিন তৈরি — `npm run bootstrap`

Database fresh হলে কোনো admin নেই। আগের manual MongoDB insert আর লাগে না — এখন:

```bash
cd FruitSnacksBackend && npm run bootstrap
```

স্কিমা থেকে super-admin role (সব flag true — তাই কখনো stale নয়), super-admin user (`.env` `SUPER_ADMIN_PHONE`/`PASSWORD`, fallback `01700000000`/`123456`), settings doc, auth doc, pageSeo + starter FAQ template seed করে। Idempotent। **এটাই হ্যান্ডওভারের entry point।** ঐচ্ছিক demo catalog: `npm run seed:demo`।

---

## কোড পরিবর্তনের চেকলিস্ট

### নতুন Module যোগ করতে (backend)

1. `FruitSnacksBackend/src/app/<module>/` ফোল্ডার create
2. `<module>.interface.ts`, `<module>.model.ts`, `<module>.services.ts`, `<module>.controllers.ts`, `<module>.routes.ts` লিখুন (CRISM pattern)
3. `src/routes/routes.ts`-এ mount: `{ path: "/<module>", route: ModuleRoutes }`
4. Permission flag লাগলে: `role.interface.ts` + `role.model.ts`-এ ৪টি boolean field
5. Frontend/Admin-এ corresponding hooks/pages

### নতুন Page যোগ করতে (admin)

1. `FruitSnacksAdmin/src/pages/<Feature>Page/<Feature>Page.jsx` create
2. `FruitSnacksAdmin/src/components/<Feature>/` ফোল্ডারে sub-components
3. `src/routes/Route.jsx`-এ route definition যোগ
4. `src/shared/SideNavBar/SideNavBar.jsx`-এ menu item যোগ + permission check
5. Permission flag UI: `src/data/permissionData.js`-এ entry

### নতুন Page যোগ করতে (frontend)

1. `FruitSnacksFrontend/src/app/(frontend)/<route>/page.jsx` create
2. `generateMetadata` লিখুন → `buildPageMeta("page-key")`
3. `src/components/utils/pageSeo.js`-এ static SEO fallback যোগ
4. Server fetch utility `src/components/lib/<getXxx>.js`-এ
5. SEO sitemap: `src/app/sitemap.js`-এ entry যোগ (if SEO important)

---

## রিসোর্স ও References

### File Navigation Help

- 📁 [FruitSnacksBackend/src/routes/routes.ts](../FruitSnacksBackend/src/routes/routes.ts) — সব API endpoint mount point
- 📁 [FruitSnacksAdmin/src/routes/Route.jsx](../FruitSnacksAdmin/src/routes/Route.jsx) — সব Admin route
- 📁 [FruitSnacksFrontend/CLAUDE.FILEMAP.md](../FruitSnacksFrontend/CLAUDE.FILEMAP.md) — Frontend ফিচার-অনুযায়ী সব ফাইল

### Documentation

- [docs/backend.md](backend.md) — Backend deep dive
- [docs/admin.md](admin.md) — Admin deep dive
- [docs/frontend.md](frontend.md) — Frontend deep dive
- [docs/issues.md](issues.md) — Known bugs (৮৫টি)
- [CLAUDE.md](../CLAUDE.md) (root) — মূল project overview
- [FEATURE_PLAN.md](../FEATURE_PLAN.md) — Active feature spec

### Per-app CLAUDE.md (AI tooling-এর জন্য)

- [FruitSnacksBackend/CLAUDE.md](../FruitSnacksBackend/CLAUDE.md)
- [FruitSnacksAdmin/CLAUDE.md](../FruitSnacksAdmin/CLAUDE.md)
- [FruitSnacksFrontend/CLAUDE.md](../FruitSnacksFrontend/CLAUDE.md)

---

## সারসংক্ষেপ — One-Liner Each Project

- **Backend** — একমাত্র সার্ভার, MongoDB-এর সাথে কথা বলে, JWT cookie auth, ৪৫+ মডিউল (CRISM pattern), Pathao/Steadfast/FraudBD/Meta/TikTok integrate করা।
- **Admin** — React SPA, অ্যাডমিন/স্টাফ এখান থেকে product, order, customer, marketing, theme manage করে, permission-gated UI।
- **Frontend** — Next.js storefront, কাস্টমার এখানে আসে, SSR/ISR দিয়ে SEO-optimized, Redux + RTK Query, cart dual-storage (localStorage + DB), analytics integrated।

তিনটাই একই backend ও একই auth cookie ব্যবহার করে — কিন্তু আলাদা UI ও আলাদা user base (admin vs customer)।
