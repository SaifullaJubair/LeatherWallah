# FruitSnacks Admin — সম্পূর্ণ ডকুমেন্টেশন

> React + Vite ভিত্তিক অ্যাডমিন ড্যাশবোর্ড (Single Page Application)।
> পোর্ট ৩০০১ (dev) | ব্যাকএন্ডের সাথে cookie-based authentication।

---

## পরিচিতি

FruitSnacks Admin সম্পূর্ণ অ্যাডমিন প্যানেল — এখানে অ্যাডমিন/স্টাফরা প্রোডাক্ট, ক্যাটাগরি, অর্ডার, ক্যাম্পেইন, কুপন, থিম, FAQ, সাইট সেটিং সব কিছু ম্যানেজ করে। কোনো SSR নেই, পুরোটাই client-side React app যা ব্যাকএন্ড API-তে call করে।

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

[`src/shared/SideNavBar/SideNavBar.jsx`](../FruitSnacksAdmin/src/shared/SideNavBar/SideNavBar.jsx)-এ প্রতিটি menu item-এর আগে `user?.role_id?.<permission_flag>` check হয়। অ্যাডমিনের role-এ যদি flag `true` না থাকে, সেই menu hidden।

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

### 2. Category Management (৩-লেভেল)

| Page | Path | API | Permission |
|------|------|-----|------------|
| Category | `/category` | `/category/dashboard` | `category_show` |
| Sub Category | `/sub-category` | `/sub_category/dashboard` | `sub_category_show` |
| Child Category | `/child-category` | `/child_category/dashboard` | `child_category_show` |
| Brand | `/brand-category` | `/brand/dashboard` | `brand_show` |
| Attribute | `/attribute` | `/attribute/dashboard` | `attribute_show` |
| Specification | `/specification-list` | `/specification/dashboard` | `specification_show` |

প্রতিটায় same pattern: list table + add modal + update modal + delete confirmation (SweetAlert)।

### 3. Product Management

| Page | Path | API |
|------|------|-----|
| Product List | `/product/product-list` | `/product/dashboard` |
| Add Product | `/product/product-create` | POST `/product` |
| Update Product | `/product/product-update/:id` | PATCH `/product` |
| Product Page Content Edit | `/product/page-content/:id` | (Dynamic Product Page System) PATCH `/product` |
| Variations | (Embedded in product update) | `/variation/by-product/:productId` |

⚠️ Product create/update পেজ বেশ complex — image upload, video upload, variations, attributes, specifications, theme, FAQ সব এক ফর্মে।

### 4. Order Management

| Page | Path | API | Filter |
|------|------|-----|--------|
| Order List | `/order` | `/order/dashboard` | সব অর্ডার |
| Pathao Order | `/pathao-order` | `/order/pathao` | শুধু Pathao |
| Steadfast Order | `/steadfast-order` | `/order/steadfast` | শুধু Steadfast |
| Order Details | `/all-order-info/:id` | `/order/:order_id` | line items সহ |
| Fraud Check | `/fraud-check` | POST `/fraud/check` | phone-based risk check |

Order action: status update, courier-এ send (Pathao/Steadfast), bulk send, sync, cancel। প্রতিটি action courier route-এ POST/PATCH।

### 5. Offer & Campaign

| Page | Path | কাজ |
|------|------|-----|
| Offer List | `/offer-list` | `/offer/dashboard` |
| Add Offer | `/add-offer` | POST `/offer` |
| Campaign List | `/campaign-list` | `/campaign/dashboard` |
| Add Campaign | `/add-campaign` | POST `/campaign` |
| Offer Order List | `/offer-order-list` | `/offer_order/dashboard` |
| Single Offer Order | `/all-offerOrder-info/:id` | `/offer_order/:_id` |

### 6. Staff & Role (RBAC Management)

| Page | Path | API |
|------|------|-----|
| All Staff | `/all-staff` | `/admin_reg_log/dashboard` |
| Staff Roles | `/staff-role` | `/role` |
| Create Staff Role | `/create-staff-role` | POST `/role` |

Role create/update পেজে [`src/data/permissionData.js`](../FruitSnacksAdmin/src/data/permissionData.js) থেকে সব available permission flag দেখানো হয় checkbox আকারে।

### 7. Review & Question

| Page | Path | API |
|------|------|-----|
| Review | `/review` | `/review/dashboard` |
| Question | `/question` | `/question/dashboard` |

Admin reply দিতে পারে review/question-এ।

### 8. Coupon

| Page | Path | API |
|------|------|-----|
| Your Coupon | `/your-coupon` | `/coupon/dashboard` |
| Add Coupon | `/add-coupon` | POST `/coupon` |

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

Theme পেজে: colors picker, floating asset upload (with section/position/animation choice), typography picker, button style। Live preview ([`ColorAutoPreview.jsx`](../FruitSnacksAdmin/src/components/Theme/ColorAutoPreview.jsx))।

### 11. Site Setting

**Path:** `/settings` ও `/settings/:tab` | **API:** GET/PATCH `/setting`

একাধিক tab — branding, contact, social, policy, shipping, analytics, SMS, email, courier toggles, announcement bar। `setting.interface.ts`-এ যত field, সব এই page থেকে editable।

### 12. Page SEO Management

**Path:** `/page-seo` | **API:** `/page-seo`

প্রতিটি page-এর জন্য SEO meta override (key-based)।

### 13. Supplier

**Path:** `/supplier` | **API:** `/supplier/dashboard` (Sidebar-এ commented out — direct URL access only)

### 14. Customer

**Path:** `/customer` | **API:** `/user/dashboard`

### 15. My Profile

**Path:** `/admin/my-profile` | **API:** GET `/admin_reg_log` (current user)

প্রোফাইল ছবি, name, password change।

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
