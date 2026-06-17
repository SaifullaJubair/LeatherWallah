# FruitSnacks Admin — সম্পূর্ণ ডকুমেন্টেশন

> React + Vite ভিত্তিক অ্যাডমিন ড্যাশবোর্ড (Single Page Application)।
> পোর্ট ৩০০১ (dev) | ব্যাকএন্ডের সাথে cookie-based authentication।

---

## পরিচিতি

FruitSnacks Admin সম্পূর্ণ অ্যাডমিন প্যানেল — এখানে অ্যাডমিন/স্টাফরা প্রোডাক্ট, ক্যাটাগরি, অর্ডার, ক্যাম্পেইন, কুপন, থিম, FAQ, সাইট সেটিং সব কিছু ম্যানেজ করে। কোনো SSR নেই, পুরোটাই client-side React app যা ব্যাকএন্ড API-তে call করে।

> ⚠️ **এই ডকুমেন্ট ২০২৬-০৬-১৬ তে full re-audit করা হয়েছে।** মূল পরিবর্তন: (১) ক্যাটাগরি এখন **nested tree** (পুরোনো Sub/Child category + Specification পেজ আর নেই); (২) Offer Order পেজ মুছে গেছে (order-এ merge); (৩) sidebar **৮-group**-এ পুনর্গঠিত; (৪) নতুন পেজ — Create Order (POS), Seed Reviews, Flash Sale, Site FAQ, Newsletter, Warehouse, Wishlist, Loyalty, Wallet, Abandoned Cart, Low Stock, Trust Point; (৫) Settings-এ Home Layout (drag-drop + boutique toggle), Demo Data, Chat widget, Analytics-IDs+secrets tab।

### Technology Stack

| টেকনোলজি | ব্যবহার |
|----------|---------|
| React 18 | UI লাইব্রেরি |
| Vite | বিল্ড টুল ও ডেভ সার্ভার |
| React Router 6 | ক্লায়েন্ট-সাইড রাউটিং (`createBrowserRouter`) |
| TanStack React Query 5 | সার্ভার ডেটা ফেচিং ও ক্যাশিং |
| React Hook Form | ফর্ম ম্যানেজমেন্ট |
| Tailwind CSS 3 | স্টাইলিং |
| Recharts | ড্যাশবোর্ডের চার্ট |
| React Toastify | নোটিফিকেশন |
| SweetAlert2 | কনফার্মেশন ডায়ালগ |
| React Select | ড্রপডাউন |
| react-phone-number-input | ফোন নম্বর ইনপুট (বাংলাদেশ ডিফল্ট) |
| react-helmet-async | পেজ টাইটেল ও favicon dynamic |
| react-loading-skeleton | স্কেলিটন লোডিং স্টেট |
| react-quill-new | রিচ টেক্সট এডিটর (description ফিল্ডের জন্য) |

### Entry Points

| File | কাজ |
|------|-----|
| [`src/main.jsx`](../FruitSnacksAdmin/src/main.jsx) | React root, providers wrap (HelmetProvider → QueryClientProvider → AuthProvider → SettingProvider) |
| [`src/App.jsx`](../FruitSnacksAdmin/src/App.jsx) | RouterProvider mount, favicon ও title dynamic update |
| [`src/routes/Route.jsx`](../FruitSnacksAdmin/src/routes/Route.jsx) | সব রাউট ডেফিনেশন (browser router) |
| [`src/layout/DashboardLayout.jsx`](../FruitSnacksAdmin/src/layout/DashboardLayout.jsx) | Sidebar + topbar + main content area |

---

## Architecture Overview

### Provider Hierarchy

```
<HelmetProvider>            ← page title, favicon dynamic
  <QueryClientProvider>     ← React Query cache
    <AuthProvider>          ← current admin user (from /admin_reg_log)
      <SettingProvider>     ← site settings (favicon, title)
        <App />
          <RouterProvider>  ← all routes
```

### Authentication Flow

```
SignInPage form submit
  → POST /api/v1/admin_reg_log/login (with credentials: 'include')
  → ব্যাকএন্ড httpOnly cookie set করে (fruit_snacks_token)
  → window.location.reload() করে নতুন request
  → AuthProvider GET /admin_reg_log → admin info নিয়ে আসে
  → PrivateRoute check: user?.admin_status == "active" && user?.admin_phone
  → পাস হলে DashboardLayout render, না হলে /sign-in redirect
```

কোনো local storage বা JWT manual handling নেই — সবই cookie-based।

### Routing

[`src/routes/Route.jsx`](../FruitSnacksAdmin/src/routes/Route.jsx)-এ সব route definition। মূল pattern:

```jsx
{
  path: "/",
  element: <PrivateRoute><DashboardLayout /></PrivateRoute>,
  children: [
    { path: "/", element: <DashBoard /> },
    { path: "/category", element: <CategoryPage /> },
    // ...
  ]
}
{ path: "/sign-in", element: <SignInPage /> }
```

৩০+ route রয়েছে — সব protected route DashboardLayout-এ wrap।

### Sidebar Permission Filtering

[`src/shared/SideNavBar/SideNavBar.jsx`](../FruitSnacksAdmin/src/shared/SideNavBar/SideNavBar.jsx) এখন **৮টা collapsible group**-এ সাজানো (~৪৫ menu), প্রতিটায় relevant Lucide icon। প্রতিটি menu item-এর আগে `user?.role_id?.<permission_flag>` check হয়। অ্যাডমিনের role-এ যদি flag `true` না থাকে, সেই menu hidden।

উদাহরণ:
```jsx
{user?.role_id?.category_show === true && (
  <ChildMenuItem to="/category" ... />
)}
```

### Page-Level Permission Check

প্রতিটি page-এর top-এ আবার একই check হয় — যদি কেউ direct URL দিয়ে যায়:
```jsx
{user?.role_id?.category_show === true && (
  <div>... page content ...</div>
)}
```

⚠️ ব্যাকএন্ডে JWT verify হয়ই — frontend এই check শুধু UI hide করে।

---

## Data Fetching Pattern

দুই ধরনের pattern admin-এ:

### ১. Custom hooks (preferred)
[`src/hooks/`](../FruitSnacksAdmin/src/hooks/) ফোল্ডারে প্রতিটা resource-এর জন্য reusable hook:

```jsx
// useGetCategory.jsx
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const useGetCategory = () => useQuery({
  queryKey: [`/api/v1/category`],
  queryFn: async () => {
    const res = await fetch(`${BASE_URL}/category`);
    return res.json();
  },
});
```

কিছু hook query params সহ flexible:
```jsx
useGetThemes({ page, limit, status, theme_for, search })
```

### ২. Inline useQuery (পুরোনো pages-এ)
নতুন hook না বানিয়ে page-এ সরাসরি `useQuery` use করা হয়েছে (যেমন `CategoryPage.jsx`-এ pagination/search query)। এটা inconsistent — refactor opportunity।

### Mutation Pattern
Mutations (POST/PATCH/DELETE) সাধারণত plain `fetch` দিয়ে done, React Query mutation hook ব্যবহার সীমিত। প্রতিটা mutation-এর পর `refetch()` call করে cache refresh।

### Base URL
[`src/utils/baseURL.js`](../FruitSnacksAdmin/src/utils/baseURL.js):
```js
export const BASE_URL = import.meta.env.VITE_API_URL + "/api/v1";
```

সব fetch-এ `credentials: 'include'` — cookie পাঠানোর জন্য।

---

## Folder Structure

```
src/
├── App.jsx                 # Root component
├── main.jsx                # Entry point
├── index.css               # Tailwind directives
├── assets/                 # Static images
├── components/             # ফিচার-ভিত্তিক UI components
│   ├── Category/
│   ├── Product/
│   ├── Order/
│   ├── Theme/
│   ├── FaqTemplate/
│   ├── ...
│   └── common/             # Shared (loader, modal wrappers)
├── context/                # React Context providers
│   ├── AuthProvider.jsx
│   └── SettingProvider.jsx
├── data/                   # Static JSON data
│   ├── permissionData.js   # সব permission flag definition
│   ├── division-data.js, district-data.js, city-data.js
│   └── ...
├── hooks/                  # React Query custom hooks
├── layout/
│   └── DashboardLayout.jsx
├── pages/                  # Page-level components
│   ├── DashBoardPage/
│   ├── CategoryPage/
│   ├── ProductPage/
│   ├── OrderPage/
│   ├── ThemePage/
│   ├── FaqTemplatePage/
│   ├── SettingPage/
│   ├── SignInPage/
│   └── ...
├── provider/               # (Legacy, প্রায় খালি)
├── routes/
│   ├── Route.jsx
│   └── privateRoute/PrivateRoute.jsx
├── shared/                 # Layout-শেয়ার্ড UI
│   ├── DashboardNavbar/
│   ├── SideNavBar/
│   ├── MiniSpinner/
│   ├── NoDataFound/
│   └── NotFound/
└── utils/
    ├── baseURL.js
    ├── baseTitle.js
    ├── cookie-storage.js   # js-cookie wrapper (unused with httpOnly cookies)
    ├── generateSlug.js
    ├── DateFormate/
    └── imageImport.js
```

---

# ফিচার তালিকা (Pages ও Components)

প্রতিটি ফিচারের জন্য সাধারণ structure:
- **Page** (`src/pages/<X>Page/`) — list view, search, pagination, modal trigger
- **Components** (`src/components/<X>/`) — sub-components যেমন:
  - `<X>Table.jsx` — list + actions (edit, delete buttons)
  - `Add<X>.jsx` — modal/page-এ create form
  - `Update<X>.jsx` — modal/page-এ edit form

### 1. Dashboard
**Path:** `/` | **File:** [`src/pages/DashBoardPage/`](../FruitSnacksAdmin/src/pages/DashBoardPage/)

GET `/dashboard` থেকে stats আনে — total orders, revenue, customers, top products। Recharts দিয়ে graph render।

### 2. Category Management (Nested Tree)

> ⚠️ পুরোনো ৩টা আলাদা পেজ (Sub Category / Child Category / Specification) **আর নেই**। এখন একটাই Category পেজ যেকোনো গভীরতার tree handle করে; Specification → attribute + product custom_fields-এ merge।

| Page | Path | API | Permission |
|------|------|-----|------------|
| Category (nested) | `/category` | `/category/dashboard` · `/category/tree` · `/category/children/:id` | `category_show` |
| Brand | `/brand-category` | `/brand/dashboard` | `brand_show` |
| Attribute | `/attribute` | `/attribute/dashboard` | `attribute_show` |

Category পেজে nested tree picker — parent select করে যেকোনো গভীরতায় node বানানো যায়। Re-parent করলে confirm dialog descendant + product count দেখায় (`/category/reparent-impact/:id`)। leaf-only delete। প্রতিটায় add/update modal + SweetAlert delete confirmation।

### 3. Product Management

| Page | Path | API |
|------|------|-----|
| Product List | `/product/product-list` | `/product/dashboard-rich` (annotated rows: `_variation_count`/`_stock_total`/`_is_low_stock`/`_flags`/`_has_theme`) |
| Add Product | `/product/product-create` | POST `/product` |
| Update Product | `/product/product-update/:id` | PATCH `/product` (full rebuild) · single-product fetch = `/product/dashboard/:id` |
| Product Page Content Edit | `/product/page-content/:id` | theme/benefits/nutrition/FAQ/floating tab |
| Low Stock | `/low-stock` | alert-quantity-এর নিচে নামা product |
| Variations | (Product List modal) | read = `GET /product/dashboard/:id` → `.variations` · per-cell save = PATCH `/variation/:id` (whitelisted) |

> `/variation/by-product/:productId` endpoint টা Variations modal নয়, Page Content → Variation Weight editor ব্যবহার করে।

⚠️ Product create/update পেজ বেশ complex — image upload, video upload (swap/remove mode), variations (multi-image + video per variation), attributes, theme, FAQ সব এক ফর্মে। **partial-update (Product List থেকে ৬টি modal):** Price (`/product/quick`, tier price + masked buying-price reveal সহ), Stock (`/product/quick`), Images (`/product/images` mode=swap_main/add_other/reorder/remove_other), Video, Variations (per-cell PATCH `/variation/:id`), Analytics-Seed — full rebuild এড়াতে আলাদা endpoint। inline status/trending toggle-ও `/product/quick`। Page Content → Floating tab = per-product floating override (inherit/hide/replace/extra)।

> **Create-mode draft autosave:** ফর্ম sessionStorage-এ debounced draft রাখে (key `fs_product_draft_create`, 30-min TTL) — navigate away করে ফিরলে "Draft restored" toast (Discard option সহ)।
> **Category-default attribute:** category select করলে `GET /category/defaults/:id` থেকে default variant/filter attribute auto-apply (empty form = silent, না হলে Apply/Dismiss banner)।
> **Variation engine:** প্রতিটি attribute হয় **Axis** (variation drive করে) নয়তো **Spec-only** (শুধু filter/PDP table); per-attribute `show_in_filter` toggle আছে। Inactive category/brand/attribute select করলে Save&Publish disable (শুধু Draft)।
> ⚠️ List filter-এ `digital`/`preorder`/`subscription` type filter করা যায়, কিন্তু Add/Update ফর্ম শুধু `simple`/`variable`/`combo` create করতে দেয়।

### 4. Order Management

| Page | Path | API | Filter |
|------|------|-----|--------|
| Order List | `/order` | tab অনুযায়ী ৩ endpoint: `/order/dashboard` (all/delivered/cancelled/pos/offer) · `/order/steadfast` · `/order/pathao` | সব অর্ডার (+ Offer Orders tab = `?order_type=offer`) |
| Create Order (POS) | `/order/create` | POST `/order/create-admin` (`order_create_admin`) | admin manual order |
| Pathao Order (legacy) | `/pathao-order` | ⚠️ `/order/dashboard?order_status=shipped` | নিচে A2.1 দ্রষ্টব্য |
| Steadfast Order (legacy) | `/steadfast-order` | `/order/dashboard` (steadfast filter) | শুধু Steadfast |
| Order Details | `/all-order-info/:id` | `/order/:order_id` | line items + editable internal note + cancel/return reason (view-only) |
| Fraud Check | `/fraud-check` | POST `/fraud/check` | phone-based risk check |
| Abandoned Cart | `/abandoned-cart` | `/abandoned-cart` (`order_show`) | incomplete checkout recovery |

Order action: courier-এ send (Pathao/Steadfast), bulk send (≤50 cap, re-send guard server-side), sync, cancel (reason prompt)। order **confirm**-এ customer-কে SMS যায় (POS order-এ SMS/Meta/TikTok যায় না)। Offer order আলাদা পেজ নয় — order_type tab। ViewAllOrderInfo-তে editable internal note (`internal_note` public/customer response থেকে stripped) + order_type badge + editable Delivery Override card (`PATCH /order/delivery-info/:id` — courier recipient name/phone/address, billing থেকে আলাদা)।

> ⚠️ **status enum ৯-value** (pending/on_hold/confirmed/processing/shipped/delivered/completed/cancel/return) DB-তে আছে, কিন্তু forward-transition `<select>` dropdown (+cancel/return reason prompt) বর্তমানে `components/Order/OrderTable.jsx`-এ — যেটা **কোথাও import করা নেই (dead code, A2.2)**। তাই reachable status-write শুধু list-এর Cancel বাটন + courier sync; admin UI দিয়ে pending→…→completed এগোনো যায় না, আর backend `updateOrder`-এ transition validation নেই (A2.3)। Order Details পেজে cancel/return reason শুধু **দেখা** যায়, set করা যায় না।
> ⚠️ **legacy courier পেজ:** `/pathao-order` + `/steadfast-order` আলাদা পুরোনো স্ক্রিন (নিজস্ব table+dropdown), unified Order List-এর Pathao/Steadfast tab-এর duplicate। `/pathao-order` ভাঙা — সব courier-এর `shipped` order দেখায়, শুধু Pathao নয় (A2.1)।
> **POS price authority:** POS-এ backend সব product/variation/campaign price DB থেকে recompute করে client price overwrite করে, কিন্তু `admin_manual_discount` + admin-নির্বাচিত `shipping_cost` recompute-এ টিকে থাকে; min_order/maintain_stock enforce হয়। POS shipping rate hardcoded (inside 60 / outside 120) — storefront DB shipping থেকে আলাদা হতে পারে।

### 5. Offer, Campaign & Flash Sale

> ⚠️ পুরোনো **Offer Order List / Single Offer Order পেজ মুছে গেছে** — offer order এখন Order List-এর `order_type=offer` tab-এ।

| Page | Path | কাজ |
|------|------|-----|
| Offer List | `/offer-list` | `/offer/dashboard` |
| Add Offer | `/add-offer` | POST `/offer` |
| Campaign List | `/campaign-list` | `/campaign/dashboard` |
| Add Campaign | `/add-campaign` | POST `/campaign` |
| Flash Sale | `/flash-sale` | `/flash-sale` (`offer_create`/`offer_update`/`offer_delete` reuse) |

> Coupon status, Campaign status server-side default `in-active`; Flash Sale status default `active` (API দিয়ে status ছাড়া flash sale বানালে সাথে সাথে live)।

### 6. Staff & Role (RBAC Management)

| Page | Path | API |
|------|------|-----|
| All Staff | `/all-staff` | `/admin_reg_log/dashboard` |
| Staff Roles | `/staff-role` | `/role` |
| Create Staff Role | `/create-staff-role` | POST `/role` |

Role create/update পেজে [`src/data/permissionData.js`](../FruitSnacksAdmin/src/data/permissionData.js) থেকে permission flag checkbox আকারে দেখানো হয়।

> ⚠️ **permissionData.js সব flag দেখায় না।** Question / Offer / Campaign / Slider / Specification block বর্তমানে **commented-out** — তাই custom staff role এই permission কখনো পায় না (শুধু bootstrap-derived super-admin পায়, কারণ ওটা schema থেকে সব flag derive করে)। Role update = posted body-র `$set`, তাই UI-তে না থাকা flag null হয় না — super-admin edit করলেও permission টিকে থাকে; শুধু **নতুন** custom role এগুলো হারায় (A4.2/A4.3)।

### 7. Review & Question

| Page | Path | API |
|------|------|-----|
| Review | `/review` | `/review/dashboard` |
| Pending Reviews | `/review/pending` | moderation queue (active/in-active toggle) |
| Seed Reviews | `/review/seed` | `/review/seed/manual` · `/review/seed/bulk` (`review_seed_*`) |
| Question | `/question` | `/question/dashboard` |

Admin reply দিতে পারে review/question-এ। Seed Reviews: Manual tab = searchable multi-select product picker + image upload; Bulk tab = JSON rows + shared image + validate(dry-run)/save দুই বাটন (lazy S3 upload — abandon করলে orphan হয় না)।

### 8. Coupon

| Page | Path | API |
|------|------|-----|
| Your Coupon | `/your-coupon` | `/coupon/dashboard` |
| Add Coupon | `/add-coupon` | POST `/coupon` |

> `coupon_type` ৩ রকম: `fixed` · `percent` · **`bogo`** (buy-N-get-M)। BOGO হলে `coupon_amount` optional, আর `bogo_buy_qty`/`bogo_get_qty`/`bogo_get_discount_pct` field লাগে। Per-person cap `coupon_use_per_person` + total cap `coupon_use_total_person`। Status default `in-active`।

### 9. Banner & Slider

| Page | Path | API |
|------|------|-----|
| Banner | `/banner` | `/banner/dashboard` |
| Slider | `/slider` | `/slider/dashboard` |

### 10. Theme System (Dynamic Product Page)

| Page | Path | API |
|------|------|-----|
| Theme List | `/theme` | `/theme` |
| Theme Add | `/theme/create` | POST `/theme` |
| Theme Update | `/theme/update/:id` | PATCH `/theme/:id` |
| Theme Preview | `/theme/preview/:id` | GET `/theme/:id` |
| FAQ Templates | `/faq-template` | `/faq-template` |

Theme পেজে: colors picker, floating asset upload (section/position/**align**/animation choice — id-stable), **two-font typography** (`heading_font` + `body_font`; পুরোনো single `font_key` legacy fallback, `style` field deprecated/unused), button style। Live preview ([`ColorAutoPreview.jsx`](../FruitSnacksAdmin/src/components/Theme/ColorAutoPreview.jsx))। Theme editor-এ global floating manager (`ThemeFloatingManager.jsx` — floating asset delete এখন array-index দিয়ে, stable id দিয়ে নয়, A3.5); per-product override Product Page Content → Floating tab-এ।

FAQ Templates (`/faq-template`): **free-text Topic** (পুরোনো enum নয়) + nested-category **Scope** picker + clickable placeholder chips (`{{token}}` insert, real label দেখায়)। প্রোডাক্টে value না থাকলে সেই FAQ PDP-তে auto-hide হয় (static note দেখানো হয়; save-এ live warning নেই)। underlying form field এখনো `category` নামে (UI label "Topic")। নতুন topic/placeholder save/delete-এ live cache refresh।

### 11. Site Setting

**Path:** `/settings` ও `/settings/:tab` | **API:** GET/PATCH `/setting` · `/setting/secrets` · `/setting/home_layout`

Settings এখন **৪-group left sub-nav**। Tab সমূহ:
- **Branding / Contact / Social / Policy / Shipping** — মূল config
- **Analytics** — DB-driven public ID (Meta Pixel / TikTok / GTM / GA4 / Clarity) + toggle; **Secrets** section = CAPI/SMS/courier token (masked, `setting_secrets_update` gated, public `/setting`-এ আসে না)
- **Email Provider** — SMTP + Test Email বাটন (`/setting/test-email`)
- **Storefront Behaviour** — ~১৯ field (৭ Tier-A + ৬ Tier-B + ৩ review toggle: `enable_reviews`/`auto_approve_reviews`/`enable_seeded_reviews`) + **Chat widgets** (Messenger toggle+Page-ID, Live Chat toggle+embed textarea, position selector)। ⚠️ live-chat embed (`chat_livechat_embed_code`) **secret নয়** — storefront-এ render করতে হয় বলে public `/setting`-এ আসে, plain `PATCH /setting`-এ save হয় (chat field সব `chat_*_show`, `_enabled` নয়)। chat config Home Layout tab-এও duplicate আছে — last-saved wins (A3.2)।
- **Feature Cards** — home trust/feature card
- **Home Layout** (`/setting/home_layout`) — @dnd-kit **drag-drop section reorder** + per-section collapsible config; **boutique toggle** (hero_spotlight / product_features / story_band); brand story, reviews carousel, site FAQ, newsletter config
- **Demo Data** — demo row count preview + এক-ক্লিক **Clear** (type `CLEAR` double-confirm, `demo_data_clear` gated)

> ⚠️ Home Layout-এ `home_section_array` সবসময় **পূর্ণ ১৮ section** রাখতে হয় (অবাঞ্ছিতগুলো toggle off) — trim করলে Admin আর Flash Sale/Promo যোগ করতে পারবে না।

### 12. Page SEO Management

**Path:** `/page-seo` | **API:** `/page-seo`

প্রতিটি page-এর জন্য SEO meta override (key-based)। ⚠️ title length cap তিন জায়গায় তিন রকম (RHF maxLength 40 / counter /40 / isFormValid >60) — 41–60 char title-এ button enabled থাকে কিন্তু RHF error submit আটকায় (A3.4)।

### 13. Supplier

**Path:** `/supplier` | **API:** `/supplier/dashboard` | **Permission:** `supplier_show`/`supplier_create`

> Sidebar-এ Inventory group-এর নিচে Suppliers মেনু **active** (`supplier_show` gated)। ⚠️ তবে SupplierPage-এ page-level RBAC guard নেই — permission ছাড়া staff সরাসরি `/supplier`-এ গেলে ভাঙা UI দেখে (data backend-gated, leak নেই — A4.5)।

### 14. Customer

**Path:** `/customer` | **API:** `/user/dashboard`

### 15. My Profile

**Path:** `/admin/my-profile` | **API:** GET `/admin_reg_log` (current user)

প্রোফাইল ছবি, name, password change। Forgot password: `/forget-password` — phone/email toggle + 6-box OTP।

### 16. নতুন পেজ (Storefront extras + Marketing)

| Page | Path | API | Permission |
|------|------|-----|------------|
| Trust Point | `/trust-point` | `/trust-point` | `trust_point_update` |
| Site FAQ | `/site-faq` | `/site-faq` | `site_faq_*` |
| Newsletter | `/newsletter-subscribers` | `/newsletter-subscriber` (+CSV export) | `newsletter_*` |
| Warehouse | `/warehouse` | `/warehouse` | backend route = `site_setting_update` (B1 fix) ⚠️ FE sidebar/page guard এখনো নেই-এমন `setting_show`/`setting_update`-এ চেক করে → মেনু+পেজ সবার কাছে hidden (A4.1, fix বাকি) |
| Wishlist (admin viewer) | `/wishlist` | `/wishlist/admin` | `user_show` |
| Loyalty | `/loyalty` | `/loyalty/history/admin` + adjust | `user_show`/`user_update` |
| Wallet | `/wallet` | `/wallet/history/admin` + adjust | `user_show`/`user_update` |

> Trust Point ("আমাদের প্রতিশ্রুতি") site setting-এর অংশ নয় — নিজস্ব মডিউল/পেজ।

---

## Forms ও Validation

সব form **React Hook Form** দিয়ে। Pattern:

```jsx
const { register, handleSubmit, formState: { errors }, setValue } = useForm();

const handleDataPost = async (data) => {
  // file uploads → FormData
  // text inputs → JSON or FormData
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  const res = await fetch(`${BASE_URL}/category`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  // toast.success / toast.error
  // refetch()
};

return (
  <form onSubmit={handleSubmit(handleDataPost)}>
    <input {...register("category_name", { required: "Required" })} />
    {errors.category_name && <p>{errors.category_name.message}</p>}
  </form>
);
```

### Slug Generation
[`src/utils/generateSlug.js`](../FruitSnacksAdmin/src/utils/generateSlug.js) — name থেকে URL-safe slug generate করে (frontend-এ)।

### File Upload Pattern
- `<input type="file" accept="image/*" onChange={handleImageChange} />`
- `URL.createObjectURL(file)` দিয়ে preview
- Submit-এ FormData-তে যোগ করে multipart POST

### Phone Input
[`react-phone-number-input`](https://www.npmjs.com/package/react-phone-number-input) — `defaultCountry="BD"`, `isValidPhoneNumber` দিয়ে validate।

---

## Tailwind Setup

[`tailwind.config.js`](../FruitSnacksAdmin/tailwind.config.js)-এ custom color tokens:
- `blueColor` (primary brand)
- `primaryColor`
- `successColor`
- `yellowColor`, `purpleColor`
- `bgBtnActive`, `btnInactiveColor`
- `textColor`, `bgray-*`

ব্যবহার:
```jsx
className="bg-primaryColor hover:bg-blue-500 text-white"
```

**Plugins:** `tailwind-scrollbar`, `tailwindcss-motion`।

---

## Static Data Files

[`src/data/`](../FruitSnacksAdmin/src/data/) ফোল্ডারে hard-coded data:

| File | Purpose |
|------|---------|
| `permissionData.js` | সব permission flag definition — Role create/update পেজে checkbox-এর জন্য |
| `division-data.js`, `district-data.js`, `city-data.js`, `address-data.js` | Bangladesh location data — কাস্টমার address ও courier zone-এর জন্য |
| `country-data.js` | (useGetCountry hook থেকে call হয়) |
| `category-data.js`, `product-data.js`, `feature-data.js`, `filter-data.js` | Legacy demo data (ব্যবহার সীমিত — DB থেকেই বেশি ফেচ হয়) |
| `slider-data.js`, `offer-data.js`, `single-data.js` | Same — legacy |

⚠️ `permissionData.js` ব্যাকএন্ডের `role.interface.ts` এর সাথে manual sync রাখতে হয়। নতুন permission যোগ করলে দু'জায়গায় add করতে হবে।

---

## Common Patterns ও Conventions

### Search Debouncing
[`src/hooks/useDebounced.jsx`](../FruitSnacksAdmin/src/hooks/useDebounced.jsx) — 400-500ms delay, list page-এ search input-এ ব্যবহৃত।

### Pagination
সব list page-এ same pattern: `page`, `limit` state, query param-এ পাঠানো, response-এ `totalData` field।

### Toast Notification
```jsx
toast.success("Created!", { autoClose: 1000 });
toast.error("Failed", { autoClose: 1000 });
```

### Confirmation Dialog (Delete)
SweetAlert2 দিয়ে — confirm করলে DELETE call।

### Loading State
- Page-wide → `<LoaderOverlay />`
- Button → `<MiniSpinner />`
- Table → `react-loading-skeleton`

### Modal Pattern
```jsx
const [createModal, setCreateModal] = useState(false);
return (
  <>
    <button onClick={() => setCreateModal(true)}>Create</button>
    {createModal && <AddCategory setCreateModal={setCreateModal} refetch={refetch} user={user} />}
  </>
);
```

Modal `fixed inset-0 z-50 bg-black bg-opacity-50` background-এ render হয়।

### File Path Convention
- Pages: `src/pages/<Feature>Page/<Feature>Page.jsx`
- Components: `src/components/<Feature>/<Action><Feature>.jsx` (যেমন `AddCategory.jsx`, `UpDateCategory.jsx`)

---

## Connection to Backend

### Endpoint mapping
| Admin Page | Backend Endpoint |
|------------|------------------|
| `/category` | `/api/v1/category/dashboard` |
| `/product/product-list` | `/api/v1/product/dashboard` |
| `/order` | `/api/v1/order/dashboard` |
| `/theme` | `/api/v1/theme` |
| `/settings` | `/api/v1/setting` |
| `/sign-in` | `/api/v1/admin_reg_log/login` |
| `/fraud-check` | `/api/v1/fraud/check` |

প্রতিটি admin action ব্যাকএন্ডের একটি endpoint-এ map করে। ফুল API তালিকার জন্য [docs/backend.md](backend.md) দেখুন।

### Permission Flag Sync

| Admin file | Backend file |
|------------|--------------|
| [`src/data/permissionData.js`](../FruitSnacksAdmin/src/data/permissionData.js) | [`src/app/role/role.interface.ts`](../FruitSnacksBackend/src/app/role/role.interface.ts) + [`src/app/role/role.model.ts`](../FruitSnacksBackend/src/app/role/role.model.ts) |

নতুন permission যোগ করতে চাইলে:
1. Backend interface + model-এ field যোগ
2. Backend route-এ `verifyToken("new_flag")` apply
3. Admin permissionData.js-এ entry যোগ
4. Admin Sidebar/Page-এ `user?.role_id?.new_flag` check যোগ

---

## Environment

`.env` ফাইল ([`FruitSnacksAdmin/.env`](../FruitSnacksAdmin/.env)) প্রয়োজনীয়:
```
VITE_API_URL=http://localhost:5000
```

(production-এ ব্যাকএন্ড URL — `https://api.fruitsnacksbd.com` ইত্যাদি)

---

## Build & Deploy

```bash
npm run dev          # Vite dev server (port 3001)
npm run build        # Production build → dist/
npm run preview      # Test production build locally
npm run lint         # ESLint check
```

`dist/` ফোল্ডার static hosting (Vercel, Netlify, S3+CloudFront) এ deploy করা যায়। ESLint লিন্টার configured, কিন্তু কোনো test runner নেই।

---

## Notable Files

| File | কেন গুরুত্বপূর্ণ |
|------|-----------------|
| [`src/routes/Route.jsx`](../FruitSnacksAdmin/src/routes/Route.jsx) | সব route এখানে — নতুন page যোগ করতে এখানে entry লাগবে |
| [`src/shared/SideNavBar/SideNavBar.jsx`](../FruitSnacksAdmin/src/shared/SideNavBar/SideNavBar.jsx) | Menu structure ও permission gating |
| [`src/data/permissionData.js`](../FruitSnacksAdmin/src/data/permissionData.js) | Role permission UI (checkbox list) |
| [`src/context/AuthProvider.jsx`](../FruitSnacksAdmin/src/context/AuthProvider.jsx) | Current admin user — সব permission check এখান থেকে আসে |
| [`src/context/SettingProvider.jsx`](../FruitSnacksAdmin/src/context/SettingProvider.jsx) | Site setting — logo, favicon, title |
| [`src/utils/baseURL.js`](../FruitSnacksAdmin/src/utils/baseURL.js) | API base URL |
| [`tailwind.config.js`](../FruitSnacksAdmin/tailwind.config.js) | Color tokens, plugins |

---

## Known Issues / Bug Tickets (Deep Audit 2026-06-18)

৪-agent deep-audit-এর সম্পূর্ণ findings: [`docs/_ai/ADMIN_DEEP_AUDIT_FINDINGS.md`](_ai/ADMIN_DEEP_AUDIT_FINDINGS.md)। কোড **ফিক্স করা হয়নি** (owner সিদ্ধান্ত: এখন শুধু doc reconcile) — bug গুলো ticket হিসেবে রাখা:

| ID | Severity | সারমর্ম |
|----|----------|---------|
| A2.2/A2.3 | BLOCKER | order status forward-transition dropdown dead code (`OrderTable.jsx` unused) → UI দিয়ে status এগোনো যায় না; backend transition validation নেই। **owner decision লাগবে: dropdown ViewAllOrderInfo-তে wire করা vs courier-only রাখা।** |
| A4.1 | BLOCKER(verify) | Warehouse FE guard নেই-এমন `setting_show`/`setting_update`-এ → মেনু+পেজ সবার কাছে hidden (backend route আগেই B1-তে ঠিক)। |
| A4.2/A4.3 | HIGH | permissionData.js-এ Question/Offer/Campaign/Slider block commented-out → custom role-কে grant করা যায় না। |
| A1.1 | HIGH | simple product "Save Draft" buying-price required-এ আটকায়। |
| A2.1 | HIGH | `/pathao-order` পেজ `order_status=shipped` query করে (সব courier), `/order/pathao` নয়। |
| A1.2,A2.4,A2.5,A2.6,A3.2,A3.3,A3.4,A3.5,A4.4,A4.5 | MEDIUM/SMELL | category file-branch · Fraud/Supplier পেজে RBAC guard নেই · abandoned-cart default shape · POS receipt drift · chat config dual-tab · live-chat-only position selector hidden · PageSeo title cap · floating delete-by-index · login `window.location.reload()`। |

> ✅ **নেই (sweep clean):** s44-এর chat `_show`/`_enabled` field-name bug class আর নেই; RBAC drift (যেগুলো wired তারা সঠিক flag-এ); secret-handling; 9-status enum; internal_note leak-guard; snapshot fallback।
