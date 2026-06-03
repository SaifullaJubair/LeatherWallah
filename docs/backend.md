# FruitSnacks Backend — সম্পূর্ণ ডকুমেন্টেশন

> Express + TypeScript + MongoDB ভিত্তিক REST API সার্ভার।
> পোর্ট ৫০০০ (dev) | বেস URL: `/api/v1`

---

## পরিচিতি

FruitSnacks ব্যাকএন্ড সম্পূর্ণ ই-কমার্স প্ল্যাটফর্মের ডেটা ও বিজনেস লজিকের কেন্দ্র। অ্যাডমিন প্যানেল ও ফ্রন্টএন্ড স্টোরফ্রন্ট উভয়ই এই একটিমাত্র API সার্ভারের সাথে যোগাযোগ করে। মোট ৩৭টি মডিউল রয়েছে — প্রতিটি একই **CRISM প্যাটার্ন** অনুসরণ করে (interface → model → services → controllers → routes)।

### Technology Stack

| টেকনোলজি | ব্যবহার |
|----------|---------|
| Express.js | HTTP সার্ভার ও রাউটিং |
| TypeScript | টাইপ-সেফটি |
| MongoDB + Mongoose | ডেটাবেস ও ODM |
| JWT | কুকি-ভিত্তিক অথেনটিকেশন |
| Multer + AWS S3 SDK | ফাইল আপলোড (DigitalOcean Spaces) |
| node-cron | ক্যাম্পেইন এক্সপায়ার অটো-আপডেট |
| axios | Pathao, Steadfast, FraudBD API call |

### Entry Points

| File | কাজ |
|------|-----|
| [`src/index.ts`](../FruitSnacksBackend/src/index.ts) | Express অ্যাপ, CORS, মিডলওয়্যার, রাউট মাউন্ট, ক্রন জব |
| [`src/server.ts`](../FruitSnacksBackend/src/server.ts) | Mongoose ডেটাবেস কানেকশন |
| [`src/routes/routes.ts`](../FruitSnacksBackend/src/routes/routes.ts) | ৩৭টি মডিউল রাউটারের সেন্ট্রাল মাউন্ট |

### Cron Job (অটোমেটিক)

প্রতিদিন রাত ১১:৫৫ UTC-এ একটি ক্রন জব চলে ([`src/index.ts`](../FruitSnacksBackend/src/index.ts)):
- আজকের তারিখের সমান `offer_end_date` থাকা অফারগুলো `in-active` হয়ে যায়
- `campaign_end_date` শেষ হওয়া ক্যাম্পেইনগুলো `in-active` হয় এবং সংশ্লিষ্ট প্রোডাক্টের `product_campaign_id` $unset হয়

---

## Shared Infrastructure

প্রতিটি মডিউল এই শেয়ার্ড লেয়ারের উপর নির্ভরশীল।

### Response Format

সব এন্ডপয়েন্ট [`sendResponse()`](../FruitSnacksBackend/src/shared/sendResponse.ts) ব্যবহার করে একই ফরম্যাটে রেসপন্স দেয়:

```ts
{ statusCode, success, message, data, totalData? }
```

Error হলে [`globalErrorHandler`](../FruitSnacksBackend/src/middlewares/global.error.handler.ts) থেকে আসে:
```ts
{ success: false, message, errorMessages: [{ path, message }] }
```

Error ক্লাস [`ApiError`](../FruitSnacksBackend/src/errors/ApiError.ts) সার্ভিস লেয়ারে throw হয় (`new ApiError(400, "message")`), গ্লোবাল হ্যান্ডলার ধরে standard response-এ রূপান্তর করে।

### Authentication

**Admin auth:** JWT, httpOnly cookie `fruit_snacks_token`-এ সংরক্ষিত। [`verifyToken(permission)`](../FruitSnacksBackend/src/middlewares/verify.token.ts) মিডলওয়্যার:
1. কুকি থেকে JWT পড়ে
2. JWT verify করে phone নম্বর বের করে
3. সংশ্লিষ্ট অ্যাডমিন খোঁজে, status check করে
4. অ্যাডমিনের role document-এ ওই permission flag (যেমন `product_create`) `true` কিনা check করে

**User auth:** আলাদা মিডলওয়্যার `verifyUserToken` (cart মডিউলে ব্যবহার হয়)।

### File Upload

[`FileUploadHelper`](../FruitSnacksBackend/src/helpers/image.upload.ts) Multer + DigitalOcean Spaces (S3 SDK) ব্যবহার করে:
- ছবি/ভিডিও/পিডিএফ আপলোড → S3-এ `fruit_snacks_images/` বা `fruit_snacks_videos/` ফোল্ডারে
- প্রতিটি ফাইলের জন্য `Location` (URL) ও `Key` (delete-এর জন্য) সংরক্ষিত হয়
- 10MB (image) / 20MB (video) limit

### CORS Allowlist

[`src/index.ts`](../FruitSnacksBackend/src/index.ts)-এ `localhost:3000/3001/4173` এবং `fruitsnacksbd.com` ফ্যামিলি ডোমেইনগুলো allowed। নতুন ডোমেইন যোগ করতে এই array-তে যোগ করতে হবে।

---

## Module Pattern (CRISM)

প্রতিটি মডিউল `src/app/<module>/` ফোল্ডারে এই ৫টি ফাইল নিয়ে গঠিত:

| File | কাজ |
|------|-----|
| `<module>.interface.ts` | TypeScript ইন্টারফেস + searchable fields array |
| `<module>.model.ts` | Mongoose schema ও model |
| `<module>.services.ts` | বিজনেস লজিক — DB queries, aggregations |
| `<module>.controllers.ts` | HTTP handlers — req parse, service call, sendResponse |
| `<module>.routes.ts` | Express router + auth middleware |

---

# মডিউল গ্রুপ ১ — Authentication ও Users

## 1. authentication

**File:** [`src/app/authentication/`](../FruitSnacksBackend/src/app/authentication/) | **Collection:** `authentication`

### কী কাজ করে
SMS OTP সিস্টেমের প্রোভাইডার কনফিগারেশন সংরক্ষণ করে। বাংলাদেশের BulkSMS-এর API ক্রেডেনশিয়াল (user, password, body template) এখানে সংরক্ষিত — যা OTP পাঠানোর সময় ব্যবহৃত হয়।

### Interface
```ts
{ otp_phone_user, otp_phone_password, otp_phone_body }
```

### Endpoints (Base: `/api/v1/authentication`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` | Cookie | `site_setting_update` |
| PATCH | `/` | Cookie | `site_setting_update` |
| DELETE | `/` | — | — |
| GET | `/dashboard` | — | — |
| POST | `/logout` | — | — (cookie clear করে) |

---

## 2. adminRegLog

**File:** [`src/app/adminRegLog/`](../FruitSnacksBackend/src/app/adminRegLog/) | **Collection:** `admins`

### কী কাজ করে
সব অ্যাডমিন/স্টাফ ইউজারের তথ্য সংরক্ষণ করে। অ্যাডমিন লগইন, পাসওয়ার্ড hashing, JWT তৈরি, প্রোফাইল আপডেট — সবকিছু এখানে। প্রতিটি অ্যাডমিনের একটি `role_id` থাকে যেটা তার permission নির্ধারণ করে।

### Interface (গুরুত্বপূর্ণ ফিল্ড)
```ts
{
  admin_password,  // bcrypt hash
  admin_name, admin_phone (unique),
  user_logo, user_logo_key,  // প্রোফাইল ছবি
  admin_country (default: "Bangladesh"), admin_division, admin_district, admin_address,
  admin_status: "active" | "in-active",
  role_id: ObjectId → roles (required),
  admin_publisher_id, admin_updated_by
}
```

### Endpoints (Base: `/api/v1/admin_reg_log`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — (getMe) |
| POST | `/` | Cookie | `user_create` |
| PATCH | `/` | Cookie | `user_update` |
| DELETE | `/` | Cookie | `user_delete` |
| POST | `/login` | — | — (JWT cookie সেট হয়) |
| PATCH | `/login` | — | — |
| GET | `/dashboard` | Cookie | `user_show` |

### Connections
- **Inputs:** `roles` (role_id রেফারেন্স)
- **Outputs:** প্রায় সব কালেকশনের `_publisher_id`/`_updated_by` ফিল্ড এই অ্যাডমিনদের রেফারেন্স করে

---

## 3. user

**File:** [`src/app/user/`](../FruitSnacksBackend/src/app/user/) | **Collection:** `users`

### কী কাজ করে
স্টোরফ্রন্ট ইউজার (কাস্টমার) ডেটা ম্যানেজ করে। সাইন আপ, লগইন, OTP ভেরিফিকেশন, পাসওয়ার্ড রিসেট — সব এখানে। `user_type` দিয়ে guest ও registered আলাদা ট্র্যাক করা হয়।

### Interface
```ts
{
  user_password, user_name,
  user_phone,  // bd format 01XXXXXXXXX
  user_image, user_image_key,
  user_country (default: "Bangladesh"), user_division, user_district, user_address,
  user_status: "active" | "in-active",
  wallet_amount (default: 0),
  forgot_otp, otp_expires_at,  // OTP 10 minute expiry
  user_type: "guest" | "registered",
  user_verified  // password সেট করেছে কিনা
}
```

### Endpoints (Base: `/api/v1/user`)
| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| GET | `/` | Cookie | `user_show` | dashboard customer তালিকা |
| POST | `/` | — | — | guest user create |
| PATCH | `/` | Cookie | `user_update` | admin দ্বারা update |
| DELETE | `/` | Cookie | `user_delete` | delete |
| POST | `/user_create` | Cookie | `user_create` | admin create করা |
| POST | `/login` | — | — | user login, JWT cookie সেট |
| POST | `/forgetPassword` | — | — | OTP পাঠানো |
| GET | `/check_phone` | — | — | phone duplicate check |
| POST | `/verifyOTP` | — | — | OTP verify |
| POST | `/resend_otp` | — | — | OTP resend |
| POST | `/setNewPassword` | — | — | নতুন পাসওয়ার্ড সেট |

---

## 4. role

**File:** [`src/app/role/`](../FruitSnacksBackend/src/app/role/) | **Collection:** `roles`

### কী কাজ করে
RBAC (Role-Based Access Control) সিস্টেমের কেন্দ্র। প্রতিটি role-এ ~১০০টি boolean permission flag থাকে — প্রতিটা মডিউলের জন্য `_show`, `_create`/`_post`, `_update`, `_delete` ৪টি action। অ্যাডমিন লগইনের সময় তার role চেক হয় এবং প্রতিটি API call-এ specific flag verify হয়।

### Interface (গুরুত্বপূর্ণ flag categories)
- Catalog: `category_*`, `sub_category_*`, `child_category_*`, `brand_*`, `attribute_*`, `specification_*`, `product_*`
- Commerce: `order_show`, `order_update`, `coupon_*`, `customer_*`
- Marketing: `campaign_*`, `offer_*`, `banner_*`, `slider_*`, `review_*`, `question_*`
- Admin/Config: `user_*` (admin), `role_*`, `site_setting_update`, `page_seo_*`
- Dynamic Theme System: `theme_*`, `faq_template_*`

### Endpoints (Base: `/api/v1/role`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | Cookie | `role_create` |
| POST | `/` | Cookie | `role_update` |
| PATCH | `/` | Cookie | `role_delete` |
| DELETE | `/` | Cookie | `role_show` |

> ⚠️ Note: রুটে permission flags একটু অদ্ভুতভাবে assign করা — get এ `role_create` chk হয়, post এ `role_update` ইত্যাদি। এটা সম্ভবত typo, পরিবর্তন করতে হবে।

---

## 5. getme

**File:** [`src/app/getme/`](../FruitSnacksBackend/src/app/getme/)

### কী কাজ করে
ফ্রন্টএন্ড ইউজারের নিজের তথ্য (logged-in user) এবং user dashboard data রিটার্ন করে। User profile page-এ ব্যবহৃত হয়।

### Endpoints (Base: `/api/v1/get_me`)
| Method | Path | Auth | কাজ |
|--------|------|------|-----|
| GET | `/` | — | logged-in user info (পাসওয়ার্ড/OTP বাদ দিয়ে) |
| PATCH | `/` | — | নিজের প্রোফাইল আপডেট |
| GET | `/dashboard_data` | — | user dashboard stats |

---

## 6. supplier

**File:** [`src/app/supplier/`](../FruitSnacksBackend/src/app/supplier/) | **Collection:** `suppliers`

### কী কাজ করে
প্রোডাক্ট সরবরাহকারী (supplier) তথ্য সংরক্ষণ করে। অ্যাডমিন প্রোডাক্ট তৈরির সময় optional supplier reference রাখতে পারে।

### Interface
```ts
{ supplier_name, supplier_phone, supplier_address,
  supplier_status: "active" | "in-active",
  supplier_publisher_id, supplier_updated_by }
```

### Endpoints (Base: `/api/v1/supplier`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/` | — |
| POST | `/` | `verifyToken("")` ⚠️ permission flag empty — bug |
| PATCH | `/` | `verifyToken("")` ⚠️ |
| DELETE | `/` | `verifyToken("")` ⚠️ |
| GET | `/dashboard` | `verifyToken("")` ⚠️ |

> ⚠️ supplier রুটে permission flag empty string — যেকোনো logged-in অ্যাডমিন অ্যাক্সেস পায়।

---

# মডিউল গ্রুপ ২ — Catalog (Categories, Brands, Products)

## 7. category

**File:** [`src/app/category/`](../FruitSnacksBackend/src/app/category/) | **Collection:** `categories`

### কী কাজ করে
৩-লেভেল ক্যাটাগরি হায়ারার্কির টপ লেভেল। প্রোডাক্ট অবশ্যই কোনো category-র অধীনে থাকতে হবে।

### Interface
```ts
{
  category_name, category_slug (unique),
  category_logo, category_logo_key,
  category_video, category_video_key,
  category_status: "active" | "in-active",
  category_serial,  // ordering
  feature_category_show, explore_category_show,  // হোম পেজ visibility
  category_publisher_id, category_updated_by
}
```

### Pipeline / Populate
- Public `GET /` — সব active category, serial অনুসারে sort
- `/category_sub_child` — Banner-এর জন্য category + sub + child একসাথে aggregation
- `/feature_category` — `feature_category_show: true` ৬টা category

### Endpoints (Base: `/api/v1/category`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` (multipart) | Cookie | `category_post` |
| PATCH | `/` (multipart) | Cookie | `category_update` |
| DELETE | `/` | Cookie | `category_delete` |
| GET | `/category_sub_child` | — | — |
| GET | `/feature_category` | — | — |
| GET | `/dashboard` | Cookie | `category_show` |

---

## 8. sub_category

**File:** [`src/app/sub_category/`](../FruitSnacksBackend/src/app/sub_category/) | **Collection:** `subcategories`

### কী কাজ করে
ক্যাটাগরির ২য় লেভেল। প্রতিটি sub_category একটি parent category-র অধীনে থাকে। **নতুন ফিচার:** প্রতিটি sub_category-র একটি `default_theme_id` থাকতে পারে — যা ওই sub_category-র সব নতুন প্রোডাক্টে ডিফল্ট থিম হিসেবে অ্যাপ্লাই হয়।

### Interface
```ts
{
  sub_category_name, sub_category_slug,
  sub_category_logo (required), sub_category_logo_key,
  sub_category_status, sub_category_serial,
  category_id: ObjectId → categories (required),
  sub_category_publisher_id, sub_category_updated_by,
  default_theme_id: ObjectId → themes  // Dynamic theming
}
```

### Endpoints (Base: `/api/v1/sub_category`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` (multipart) | Cookie | `sub_category_post` |
| PATCH | `/` (multipart) | Cookie | `sub_category_update` |
| DELETE | `/` | Cookie | `sub_category_delete` |
| GET | `/dashboard` | Cookie | `sub_category_show` |

---

## 9. child_category

**File:** [`src/app/child_category/`](../FruitSnacksBackend/src/app/child_category/) | **Collection:** `childcategories`

### কী কাজ করে
ক্যাটাগরির ৩য় ও সবচেয়ে গভীর লেভেল। প্রতিটি child_category একটি parent sub_category ও grand-parent category-র অধীনে।

### Interface
```ts
{
  child_category_name, child_category_slug, child_category_status, child_category_serial,
  category_id, sub_category_id,  // উভয় required
  child_category_publisher_id, child_category_updated_by
}
```

### Endpoints (Base: `/api/v1/child_category`)
GET (public), POST/PATCH/DELETE (auth + permission), `/dashboard` (auth)।

---

## 10. brand

**File:** [`src/app/brand/`](../FruitSnacksBackend/src/app/brand/) | **Collection:** `brands`

### কী কাজ করে
প্রোডাক্ট ব্র্যান্ড সংরক্ষণ করে। প্রোডাক্ট optionally কোনো ব্র্যান্ডের সাথে যুক্ত হতে পারে।

### Interface
```ts
{
  brand_name, brand_slug,
  brand_logo (required), brand_logo_key (required),
  brand_status, brand_serial, brand_show,
  category_id (optional, ব্র্যান্ডকে কোনো category-তে সীমাবদ্ধ করতে),
  brand_publisher_id, brand_updated_by
}
```

### Endpoints (Base: `/api/v1/brand`)
GET, POST (multipart), PATCH (multipart), DELETE, `/dashboard` — সব standard CRISM প্যাটার্নে।

---

## 11. attribute

**File:** [`src/app/attribute/`](../FruitSnacksBackend/src/app/attribute/) | **Collection:** `attributes`

### কী কাজ করে
প্রোডাক্ট ভ্যারিয়েশন তৈরির জন্য attribute সংজ্ঞা — যেমন "Color" attribute-এর values: Red, Blue, Green। অ্যাডমিন attribute তৈরি করে, প্রতিটি attribute-এ একাধিক value থাকে।

### Interface
```ts
{
  attribute_name, attribute_slug, attribute_status,
  category_id (optional),
  attribute_values: [{
    attribute_value_name, attribute_value_slug,
    attribute_value_code,  // color code, etc.
    attribute_value_status
  }],
  attribute_publisher_id, attribute_updated_by
}
```

### Endpoints (Base: `/api/v1/attribute`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` | Cookie | `attribute_post` |
| PATCH | `/` | Cookie | `attribute_update` |
| DELETE | `/` | Cookie | `attribute_delete` |
| GET | `/dashboard` | Cookie | `attribute_show` |
| GET | `/:category_id` | — | — (specific category-র attributes) |

---

## 12. specification

**File:** [`src/app/specification/`](../FruitSnacksBackend/src/app/specification/) | **Collection:** `specifications`

### কী কাজ করে
প্রোডাক্ট স্পেসিফিকেশন (technical info) সংরক্ষণ করে — যেমন "Material", "Weight", "Size"। প্রতিটি specification-এ একাধিক value থাকে। category ও sub_category উভয়ের সাথে যুক্ত।

### Interface
```ts
{
  specification_name, specification_slug,
  specification_serial, specification_status,
  specification_show: boolean,
  category_id (required), sub_category_id (optional),
  specification_values: [{
    specification_value_name, specification_value_slug, specification_value_status
  }],
  specification_publisher_id, specification_updated_by
}
```

### Endpoints (Base: `/api/v1/specification`)
POST/PATCH/DELETE (auth + permission), `/dashboard` (auth), `/:category_id` (public)।

---

## 13. product

**File:** [`src/app/product/`](../FruitSnacksBackend/src/app/product/) | **Collection:** `products`

### কী কাজ করে
পুরো ই-কমার্স প্ল্যাটফর্মের সবচেয়ে কেন্দ্রীয় মডিউল। প্রোডাক্টের নাম, দাম, স্টক, ক্যাটাগরি, ছবি, ভিডিও, থিম, নিউট্রিশন, FAQ — সবকিছু এখানে।

### Interface (গুরুত্বপূর্ণ ফিল্ড)
```ts
{
  product_name, product_slug (unique), product_slug_history[],
  product_sku, product_status: "active" | "in-active",
  category_id, sub_category_id, child_category_id,  // 3-level
  brand_id, product_supplier_id, product_publisher_id, product_updated_by,
  specifications[], attributes_details[],
  barcode, barcode_image,
  description, main_image, main_video, other_images[], size_chart,
  product_price, product_buying_price, product_discount_price,
  product_quantity, product_alert_quantity,
  is_variation: boolean,  // true হলে variations কালেকশন থেকে দাম/স্টক
  product_warrenty, product_return, unit,
  meta_title, meta_description, meta_keywords[],
  product_campaign_id, trending_product,

  // Dynamic Product Page System
  theme_id, theme_overrides: { colors, button_style },
  short_description (max 200), badge_text,
  short_features[], process_steps[], benefits[], use_cases[],
  nutrition: { calories, protein, carbs, fiber, sugar, fat, vitamins, ... },
  faqs: [{ question, answer }],
  og_image, og_title, og_description
}
```

### Database hooks (theme counter sync)
`product.save()` → `themes.used_in_products +1`
`product.deleteOne()`/`findOneAndDelete()` → `used_in_products -1`
`findOneAndUpdate()` (theme change) → পুরোনো -1, নতুন +1

### Pipeline / Populate
- `GET /:product_slug` → category, sub, child, brand, theme, campaign সব populate; 3-level category active check; `is_variation: true` হলে variations fetch
- `GET /dashboard` → aggregation pipeline (search regex, filter, paginate, sort, count)
- Trending/Popular/Related/JustForYou — আলাদা criteria, একই product collection

### Endpoints (Base: `/api/v1/product`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/` (multipart) | Cookie | `product_create` |
| PATCH | `/` (multipart) | Cookie | `product_update` |
| DELETE | `/` | Cookie | `product_delete` |
| POST | `/check_product_barcode` | — | — |
| POST | `/check_product_barcode_when_update` | — | — |
| GET | `/trending_product` | — | — |
| GET | `/brand_match_product` | — | — |
| GET | `/popular_product` | — | — |
| GET | `/just_for_you_product` | — | — |
| GET | `/related_product` | — | — |
| GET | `/ecommerce_choice_product` | — | — |
| GET | `/dashboard` | Cookie | `product_show` |
| GET | `/dashboard/:_id` | — | — |
| GET | `/cart_product?ids=` | — | — |
| GET | `/compare_product?ids=` | — | — |
| GET | `/:product_slug` | — | — |

### Business Rules
1. ৩-লেভেল category active check
2. Slug history (SEO 301 redirect)
3. `is_variation: true` হলে variations থেকে price/stock
4. ডিসকাউন্ট priority: flash > campaign > discount_price > price
5. Image cleanup on update (S3 delete)

---

## 14. variation

**File:** [`src/app/variation/`](../FruitSnacksBackend/src/app/variation/) | **Collection:** `variations`

### কী কাজ করে
যেসব প্রোডাক্টে একাধিক ভ্যারিয়েন্ট আছে (যেমন: ৫০০g, ১kg, ২kg) সেগুলোর আলাদা আলাদা ডকুমেন্ট। প্রতিটি variation-এর নিজস্ব price, stock, image ও ওজন থাকে।

### Interface
```ts
{
  variation_name,
  product_id: ObjectId → products (required),
  variation_price, variation_discount_price, variation_buying_price,
  variation_quantity, variation_alert_quantity,
  variation_barcode, variation_barcode_image,
  variation_image, variation_image_key,
  variation_video, variation_video_key,
  variation_sku,

  // Dynamic Product Page System
  variation_weight_grams,  // Pathao courier-এর জন্য (hardcoded 0.5kg বদলে)
  variation_badge_text     // যেমন "Best Value"
}
```

### Endpoints (Base: `/api/v1/variation`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/by-product/:productId` | — | — |
| PATCH | `/:id` | Cookie | `product_update` |

---

## 15. productFilter

**File:** [`src/app/productFilter/`](../FruitSnacksBackend/src/app/productFilter/)

### কী কাজ করে
স্টোরফ্রন্টের ফিল্টার ও সার্চ ফাংশনালিটি। category/brand/price-range/attribute/specification ফিল্টার করে প্রোডাক্ট তালিকা রিটার্ন করে।

### Endpoints (Base: `/api/v1/filter_product`)
| Method | Path | কাজ |
|--------|------|-----|
| GET | `/` | ফিল্টার করা প্রোডাক্ট তালিকা |
| GET | `/heading_sub_child_category_data` | হেডিং অনুযায়ী category data |
| GET | `/side_filtered_data/:categoryType` | সাইডবার ফিল্টার ডেটা |
| GET | `/search_product` | সার্চ টার্ম দিয়ে প্রোডাক্ট খোঁজা |

---

# মডিউল গ্রুপ ৩ — Commerce (Cart, Order, Coupon, Fraud)

## 16. cart

**File:** [`src/app/cart/`](../FruitSnacksBackend/src/app/cart/) | **Collection:** `carts`

### কী কাজ করে
লগইন-করা ইউজারের কার্ট DB-তে সংরক্ষণ করে (guest-দের জন্য কার্ট localStorage-এ থাকে frontend-এ)। প্রতি ইউজারের ১টা কার্ট, ভেতরে একাধিক product+variation+quantity।

### Interface
```ts
{
  cart_user_id: ObjectId → users (unique — প্রতি user-এর ১টা cart),
  cart_products: [{ product_id, variation_id, quantity (min 1) }]
}
```

### Endpoints (Base: `/api/v1/cart`)
| Method | Path | Auth | কাজ |
|--------|------|------|-----|
| GET | `/` | User token | কার্ট আনা |
| PUT | `/` | User token | quantity update / item add-remove |
| DELETE | `/` | User token | পুরো কার্ট খালি |
| POST | `/sync` | User token | লগইনের পর localStorage cart DB-তে merge |

---

## 17. order

**File:** [`src/app/order/`](../FruitSnacksBackend/src/app/order/) | **Collection:** `orders`

### কী কাজ করে
সবচেয়ে complex commerce মডিউল। চেকআউট সম্পন্ন হলে অর্ডার তৈরি হয়, courier (Pathao/Steadfast)-এ পাঠানো, status track, webhook update — সব এই মডিউলে। অর্ডার ও line items আলাদা collection-এ (`orders` ও `orderproducts`)।

### Interface
```ts
{
  invoice_id, order_status: "pending"|"processing"|"shipped"|"delivered"|"cancel"|"return",
  pending_time, processing_time, shipped_time, delivered_time, cancel_time, return_time,
  billing_country, billing_city, billing_state, billing_address,
  shipping_location,
  sub_total_amount, discount_amount, shipping_cost, grand_total_amount,
  coupon_id, customer_id, customer_phone,
  order_updated_by, tracking_code,

  // Pathao
  pathao_city_id, pathao_city_name, pathao_zone_id, pathao_zone_name,
  pathao_status, consignment_id, delivery_fee,

  // Courier selection
  courier_type: "pathao" | "steadfast",

  // Steadfast
  steadfast_consignment_id, steadfast_tracking_code,
  steadfast_status: "in_review"|"pending"|"delivered_approval_pending"|"delivered"|...
  steadfast_tracking_message,

  // Admin-editable delivery override
  delivery_name, delivery_phone, delivery_alt_phone, delivery_address, delivery_note
}
```

### Endpoints (Base: `/api/v1/order`)
| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| POST | `/` | — | — | কার্ট থেকে অর্ডার |
| GET | `/` | — | — | logged-in customer-এর সব অর্ডার |
| PATCH | `/` | Cookie | `order_update` | status update |
| POST | `/single_order` | — | — | guest single-product checkout |
| GET | `/dashboard` | Cookie | `order_show` | admin অর্ডার তালিকা |
| GET | `/steadfast` | Cookie | `order_show` | শুধু Steadfast অর্ডার |
| PATCH | `/steadfast/cancel/:order_id` | Cookie | `order_update` | Steadfast cancel |
| GET | `/pathao` | Cookie | `order_show` | শুধু Pathao অর্ডার |
| POST | `/order_tracking` | — | — | invoice_id দিয়ে track (public) |
| PATCH | `/delivery-info/:order_id` | Cookie | `order_update` | delivery info update |
| GET | `/:order_id` | — | — | order + line items details |

### Order Pipeline (চেকআউট flow)
1. Frontend `POST /order` — cart products + billing/shipping info
2. Service: invoice_id generate, validate stock, coupon apply, totals calculate
3. Mongoose session-এ transaction: `orders` create + `orderproducts` create + stock decrement
4. Response: invoice_id

### Webhook Flow
- Steadfast/Pathao নিজে থেকে POST করে → courier status sync হয় → order.order_status আপডেট হয়

---

## 18. orderProducts

**File:** [`src/app/orderProducts/`](../FruitSnacksBackend/src/app/orderProducts/) | **Collection:** `orderproducts`

### কী কাজ করে
প্রতিটি অর্ডারের লাইন আইটেম। আলাদা collection রাখার কারণ — analytics, return process, item-level cancellation easier।

### Interface
```ts
{
  order_id, invoice_id,
  product_id, variation_id,
  product_main_price, product_main_discount_price,
  product_unit_price, product_unit_final_price,
  product_quantity, product_grand_total_price,
  campaign_id,  // কোন ক্যাম্পেইন থেকে ডিসকাউন্ট
  customer_id
}
```

কোনো আলাদা route নেই — order মডিউল থেকে এই collection access হয়।

---

## 19. order/courier

**File:** [`src/app/order/courier/`](../FruitSnacksBackend/src/app/order/courier/)

### কী কাজ করে
Pathao ও Steadfast courier API integration। অর্ডার courier-এ পাঠানো, status sync, balance check, bulk operations।

### Endpoints (Base: `/api/v1/courier`)

**Steadfast:**
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/steadfast/send/:order_id` | Cookie | `order_update` |
| POST | `/steadfast/bulk-send` | Cookie | `order_update` |
| PATCH | `/steadfast/sync/:order_id` | Cookie | `order_update` |
| GET | `/steadfast/track/:consignment_id` | Cookie | `order_show` |
| GET | `/steadfast/balance` | Cookie | `order_show` |

**Pathao:**
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/pathao/send/:order_id` | Cookie | `order_update` |
| POST | `/pathao/bulk-send` | Cookie | `order_update` |
| PATCH | `/pathao/sync/:order_id` | Cookie | `order_update` |
| POST | `/pathao/bulk-sync` | Cookie | `order_update` |
| PATCH | `/pathao/cancel/:order_id` | Cookie | `order_update` |
| GET | `/pathao/track/:consignment_id` | Cookie | `order_show` |

> **Note:** Pathao token মেমরিতে ক্যাশ হয় expiry টাইম সহ ([`pathao.service.ts`](../FruitSnacksBackend/src/app/order/pathao.service.ts))।

---

## 20. order/webhook

**File:** [`src/app/order/webhook/`](../FruitSnacksBackend/src/app/order/webhook/)

### কী কাজ করে
Courier-গুলো নিজে থেকে status update পাঠায় এই webhook URL-এ। কোনো auth নেই — পাবলিক endpoint। Response code ২০২ Pathao expect করে।

### Endpoints (Base: `/api/v1/webhook`)
| Method | Path | কাজ |
|--------|------|-----|
| POST | `/steadfast` | Steadfast status callback |
| POST | `/pathao` | Pathao status callback (response ২০২) |

---

## 21. fraud

**File:** [`src/app/fraud/`](../FruitSnacksBackend/src/app/fraud/)

### কী কাজ করে
চেকআউট/অর্ডারের আগে কাস্টমারের phone নম্বর দিয়ে ফ্রড রিস্ক চেক করে। দুটো সোর্স:
1. **FraudBD API** — বাইরের সার্ভিস (cancel rate, courier risk)
2. **Internal DB history** — আমাদের নিজস্ব অর্ডার ইতিহাস

দুটো মিলিয়ে রিস্ক লেভেল calculate হয়: `High Risk` / `Medium Risk` / `New Customer` / `Low Risk`।

### Endpoint (Base: `/api/v1/fraud`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/check` | Cookie | `order_show` |

### Pipeline
```
phone normalize (01XXXXXXXXX format)
  → Parallel: [FraudBD API call, DB orders aggregate (cancel/delivered count)]
  → calculateRiskLevel(): level + color + reason
```

---

## 22. coupon

**File:** [`src/app/coupon/`](../FruitSnacksBackend/src/app/coupon/) | **Collection:** `coupons`

### কী কাজ করে
ডিসকাউন্ট কুপন সিস্টেম। কুপন তৈরি, validation, apply। `fixed` / `percent` দুটো টাইপ, specific customer/product বা all-এর জন্য, per-person ও total usage limit।

### Interface
```ts
{
  coupon_code, coupon_start_date, coupon_end_date,
  coupon_type: "fixed" | "percent",
  coupon_amount, coupon_max_amount,
  coupon_use_per_person, coupon_use_total_person, coupon_available,
  coupon_status: "active" | "in-active",
  coupon_customer_type: "all" | "specific",
  coupon_specific_customer: [{ customer_id }],
  coupon_product_type: "all" | "specific",
  coupon_specific_product: [{ product_id }],
  coupon_publisher_id, coupon_updated_by
}
```

### Endpoints (Base: `/api/v1/coupon`)
| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| POST | `/` | Cookie | `coupon_create` | create |
| PATCH | `/` | Cookie | `coupon_update` | update |
| DELETE | `/` | Cookie | `coupon_delete` | delete |
| GET | `/dashboard` | Cookie | `coupon_show` | admin তালিকা |
| GET | `/specific_user` | — | — | specific user-এর কুপনগুলো |
| GET | `/specific_product` | — | — | specific product-এ apply যোগ্য কুপন |
| POST | `/check_coupon` | — | — | চেকআউটে কুপন validation |

> **Related:** `coupon_used` সাব-ফোল্ডার — কুপন কতবার, কে use করেছে track রাখে।

---

# মডিউল গ্রুপ ৪ — Marketing (Campaigns, Offers, Banners, Reviews)

## 23. campaign

**File:** [`src/app/campaign/`](../FruitSnacksBackend/src/app/campaign/) | **Collection:** `campaigns`

### কী কাজ করে
নির্দিষ্ট সময়ের জন্য একাধিক প্রোডাক্টে campaign-discount apply করে। প্রতিদিন রাতের cron-এ `campaign_end_date` পেরিয়ে গেলে auto-deactivate হয় এবং সংশ্লিষ্ট প্রোডাক্টের `product_campaign_id` $unset হয়।

### Interface
```ts
{
  campaign_image (required), campaign_image_key,
  campaign_title, campaign_description,
  campaign_start_date, campaign_end_date,
  campaign_status: "active" | "in-active",
  campaign_products: [{
    campaign_product_id, campaign_product_price,
    campaign_price_type: "fixed" | "percent",
    campaign_product_status
  }],
  campaign_publisher_id, campaign_updated_by
}
```

### Endpoints (Base: `/api/v1/campaign`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` (multipart) | Cookie | `campaign_create` |
| PATCH | `/` (multipart) | Cookie | `campaign_update` |
| DELETE | `/` | Cookie | `campaign_delete` |
| GET | `/dashboard` | Cookie | `campaign_show` |
| GET | `/dashboard/add_campaign_product` | — | — |
| GET | `/:_id` | — | — |

---

## 24. offer

**File:** [`src/app/offer/`](../FruitSnacksBackend/src/app/offer/) | **Collection:** `offers`

### কী কাজ করে
"Buy more, save more" type promotional offers। নির্দিষ্ট quantity ও discount নিয়ে bundle/offer তৈরি। Cron-এ expire auto-deactivate।

### Interface
```ts
{
  offer_image (required), offer_image_key,
  offer_start_date, offer_end_date,
  offer_title, offer_description,
  offer_products: [{
    offer_product_id, offer_product_quantity,
    offer_discount_price,
    offer_discount_type: "fixed" | "percent"
  }],
  offer_status, offer_publisher_id, offer_updated_by
}
```

### Endpoints (Base: `/api/v1/offer`)
Standard CRISM (GET public, POST/PATCH/DELETE auth + permission), `/dashboard`, `/dashboard/add_offer_product`, `/:_id`।

---

## 25. offerOrder

**File:** [`src/app/offerOrder/`](../FruitSnacksBackend/src/app/offerOrder/) | **Collection:** `offerorders`

### কী কাজ করে
Offer-এর মাধ্যমে যে অর্ডার হয় সেগুলো এই আলাদা collection-এ। regular order-এর মতই কাঠামো, কিন্তু `offer_id` reference থাকে।

### Interface
নিয়মিত order-এর মতই + `offer_id`, `offer_products: [{ offer_product_id, offer_product_quantity, offer_discount_price, offer_discount_type, is_variation, variation_id }]`।

### Endpoints (Base: `/api/v1/offer_order`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/` | — | — |
| GET | `/` | — | — |
| PATCH | `/` | Cookie | `offer_order_update` |
| GET | `/dashboard` | Cookie | `offer_order_show` |
| GET | `/:_id` | — | — |

---

## 26. banner

**File:** [`src/app/banner/`](../FruitSnacksBackend/src/app/banner/) | **Collection:** `banners`

### কী কাজ করে
হোম পেজের ব্যানার ছবি। প্রতিটি ব্যানারের নিজস্ব link path থাকতে পারে।

### Interface
```ts
{ banner_title, banner_image, banner_image_key,
  banner_path,  // click destination
  banner_serial, banner_status }
```

### Endpoints (Base: `/api/v1/banner`)
Standard CRISM: GET (public), POST/PATCH (multipart, auth), DELETE (auth), `/dashboard`।

---

## 27. slider

**File:** [`src/app/slider/`](../FruitSnacksBackend/src/app/slider/) | **Collection:** `sliders`

### কী কাজ করে
হোম পেজের slider/carousel ছবি (ব্যানার-এর চেয়ে আলাদা, hero carousel)।

### Interface
```ts
{ slider_image, slider_image_key, slider_path, slider_serial, slider_status }
```

### Endpoints (Base: `/api/v1/slider`)
Standard CRISM: GET (public), POST/PATCH (multipart, auth), DELETE (auth), `/dashboard`।

---

## 28. review

**File:** [`src/app/review/`](../FruitSnacksBackend/src/app/review/) | **Collection:** `reviews`

### কী কাজ করে
প্রোডাক্ট রিভিউ। কাস্টমার রিভিউ পোস্ট করে, admin reply দিতে পারে।

### Interface
```ts
{
  review_description, review_answer (admin reply),
  review_image, review_ratting (1-5),
  review_status: "active" | "in-active",
  review_product_id, review_user_id, review_updated_by
}
```

### Endpoints (Base: `/api/v1/review`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — | (user's own reviews) |
| POST | `/` (multipart) | — | — |
| PATCH | `/` | Cookie | `review_update` |
| DELETE | `/` | — | — |
| GET | `/unreview_product` | — | — (যেসব order delivered কিন্তু review দেওয়া হয়নি) |
| GET | `/dashboard` | Cookie | `review_show` |
| GET | `/:review_product_id` | — | — (specific product-এর সব রিভিউ) |

---

## 29. question

**File:** [`src/app/question/`](../FruitSnacksBackend/src/app/question/) | **Collection:** `questions`

### কী কাজ করে
প্রোডাক্টে কাস্টমার প্রশ্ন (Q&A)। কাস্টমার প্রশ্ন করে, admin উত্তর দেয়।

### Endpoints (Base: `/api/v1/question`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — | (user's own questions) |
| POST | `/` | — | — |
| PATCH | `/` | Cookie | `question_update` |
| DELETE | `/` | — | — |
| GET | `/dashboard` | Cookie | `question_show` |
| GET | `/:question_product_id` | — | — |

---

# মডিউল গ্রুপ ৫ — Admin Config (Settings, SEO, Theme, FAQ)

## 30. setting

**File:** [`src/app/setting/`](../FruitSnacksBackend/src/app/setting/) | **Collection:** `settings`

### কী কাজ করে
সাইট-ব্যাপী কনফিগারেশন — সাইট title, logo, favicon, contact, social links, policy text, shipping charges, courier toggles, analytics toggles, SMS/Email provider credentials, announcement bar। সাধারণত একটি ডকুমেন্টই থাকে।

### Interface (গুরুত্বপূর্ণ সেকশন)
- **Branding:** logo, favicon, title, welcome_message, currency
- **Contact/Social:** contact, email, address×3, facebook, instagram, twitter, youtube, whatsapp, tiktok
- **Shipping:** inside_dhaka_shipping_charge/days, outside_dhaka_shipping_charge/days, free_delivery_enabled, free_delivery_type ("always"/"min_order"), free_delivery_min_amount
- **Policies:** about_us, return_policy, refund_policy, cancellation_policy, privacy_policy, terms_condition, shipping_info
- **Trust cards:** card_one to card_four (logo + title)
- **SEO:** seo_title, seo_description, seo_keywords
- **Analytics toggles:** meta_pixel_enabled, meta_capi_enabled, tiktok_pixel_enabled, tiktok_capi_enabled, gtm_enabled, ga4_enabled, clarity_enabled
- **SMS:** sms_provider_name, sms_api_key, sms_api_secret, sms_sender_id, sms_enabled
- **Email:** email_provider_name, email_host, email_port, email_username, email_password, email_from_address, email_from_name, email_provider_enabled
- **Courier toggles:** steadfast_*, pathao_*, redx_* (per-courier enabled flag + creds)
- **Announcement bar:** [{ text, icon }] — উপরের rolling banner (3 items)

### Endpoints (Base: `/api/v1/setting`)
| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| GET | `/` | — | — | পাবলিক setting |
| PATCH | `/` | Cookie | `site_setting_update` | update |
| GET | `/zone` | — | — | Pathao city/zone data |

---

## 31. pageSeo

**File:** [`src/app/pageSeo/`](../FruitSnacksBackend/src/app/pageSeo/) | **Collection:** `PageSeo`

### কী কাজ করে
প্রতিটি page-এর জন্য আলাদা SEO meta (title, description, noIndex)। key-based lookup। সাইট setting-এর SEO ডিফল্ট, এটা প্রতি page-এর override।

### Interface
```ts
{ page_key (unique), path, title, description, noIndex: boolean }
```

### Endpoints (Base: `/api/v1/page-seo`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/:key` | — | — (frontend ব্যবহার করে) |
| GET | `/` | Cookie | `page_seo_show` |
| PUT | `/:key` | Cookie | `page_seo_update` |
| POST | `/seed` | — | — (dev only) |

---

## 32. theme

**File:** [`src/app/theme/`](../FruitSnacksBackend/src/app/theme/) | **Collection:** `themes`

### কী কাজ করে
**Dynamic Product Page System-এর কেন্দ্র।** প্রতিটি প্রোডাক্ট পেজে আলাদা রঙ, ফন্ট, floating fruit images, button style apply করার জন্য reusable theme সংরক্ষণ করে। Sub_category-র `default_theme_id` ও product-এর `theme_id` এই collection-কে রেফারেন্স করে।

### Interface
```ts
{
  theme_name, theme_slug (unique), theme_for,
  thumbnail_preview, thumbnail_preview_key,
  status: "active" | "draft" | "archived",

  colors: {
    primary, page_bg, accent,
    primary_light, primary_dark,
    heading_text, body_text, section_bg, button_text
  },

  floating_assets: [{
    asset_url, asset_key,
    position: "left" | "right",
    section: "hero"|"order"|"benefits"|"use_cases"|"nutrition"|"reviews"|"faq"|"any",
    animation_type: "float"|"spin"|"bounce"|"sway"|"none",
    animation_speed: "slow"|"normal"|"fast",
    size: "xs"|"sm"|"md"|"lg",
    opacity (0-1), hide_on_mobile
  }],

  typography: {
    font_key: "hind-siliguri"|"tiro-bangla"|"noto-sans-bengali"|"baloo-da-2"|"mina",
    heading_weight: "400"|"500"|"600"|"700",
    style: "rounded"|"sharp"|"elegant"|"bold"
  },

  button_style: {
    border_radius (default "8px"),
    variant: "filled" | "outlined" | "gradient"
  },

  preview_data: { product_name, short_description, price, discount_price, image_url },

  used_in_products: number,  // products theme_id reference auto-counter
  is_deletable: boolean,     // used_in_products == 0 হলে true
  preview_approved, approved_by, approved_at,
  created_by, updated_by
}
```

### Connections (Cross-module sync)
Product model lifecycle hooks `themes.used_in_products` কাউন্টার auto-update করে (product save/delete/theme_id change-এ)। এর ফলে `is_deletable` flag automatically calculate হয়।

### Endpoints (Base: `/api/v1/theme`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` (multipart) | Cookie | `theme_create` |
| GET | `/:id` | — | — |
| PATCH | `/:id` (multipart) | Cookie | `theme_update` |
| DELETE | `/:id` | Cookie | `theme_delete` |
| POST | `/:id/approve` | Cookie | `theme_update` |
| POST | `/:id/floating-asset` (multipart) | Cookie | `theme_update` |
| DELETE | `/:id/floating-asset/:index` | Cookie | `theme_update` |

---

## 33. faq_template

**File:** [`src/app/faq_template/`](../FruitSnacksBackend/src/app/faq_template/) | **Collection:** `faq_templates`

### কী কাজ করে
প্রোডাক্ট FAQ-এর জন্য reusable template। অ্যাডমিন একবার তৈরি করে রাখে — তারপর প্রোডাক্টে copy করে paste করা যায়।

### Interface
```ts
{
  question, answer,
  category: "shelf_life"|"storage"|"ingredients"|"usage"|"health"|"general",
  is_active, created_by
}
```

### Endpoints (Base: `/api/v1/faq-template`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` | Cookie | `faq_template_create` |
| GET | `/:id` | — | — |
| PATCH | `/:id` | Cookie | `faq_template_update` |
| DELETE | `/:id` | Cookie | `faq_template_delete` |

---

## 34. dashboard

**File:** [`src/app/dashboard/`](../FruitSnacksBackend/src/app/dashboard/)

### কী কাজ করে
অ্যাডমিন ড্যাশবোর্ডের জন্য aggregate stats — মোট অর্ডার, revenue, customer count, top products ইত্যাদি।

### Endpoint (Base: `/api/v1/dashboard`)
| Method | Path |
|--------|------|
| GET | `/` |

---

## 35. paymentWithdrawList ও withdrow_payment_method

**File:** [`src/app/paymentWithdrawList/`](../FruitSnacksBackend/src/app/paymentWithdrawList/) ও [`src/app/withdrow_payment_method/`](../FruitSnacksBackend/src/app/withdrow_payment_method/)

### কী কাজ করে
দুটো মডিউল মিলে অ্যাডমিন/স্টাফ commission/payout সিস্টেম:

**`paymentmethods` collection** (withdrow_payment_method) — কোন কোন পদ্ধতিতে টাকা withdraw করা যাবে (bKash, Nagad, Bank), প্রতিটির লোগো ও minimum amount।

**`paymentwithdrawlists` collection** (paymentWithdrawList) — admin/staff-এর withdraw request, status (`pending`/`success`/`rejected`), note ও reply।

### Endpoints

**`/api/v1/payment_method`:**
| Method | Path |
|--------|------|
| GET | `/` |
| POST | `/` (multipart) |
| PATCH | `/` (multipart) |
| DELETE | `/` |
| GET | `/dashboard` |

**`/api/v1/payment_withdraw`:**
| Method | Path | কাজ |
|--------|------|-----|
| GET | `/` | self withdraw list |
| POST | `/` | new request |
| PATCH | `/` | update |
| DELETE | `/` | delete |
| GET | `/dashboard` | all withdraws |

> ⚠️ এই দুটো মডিউলে permission check missing — সম্ভবত ব্যবহার সীমিত।

---

# মডিউল গ্রুপ ৬ — Integrations (Pixels, Image Upload)

## 36. metaPixel

**File:** [`src/app/metaPixel/`](../FruitSnacksBackend/src/app/metaPixel/)

### কী কাজ করে
Frontend থেকে Meta Pixel events (PageView, AddToCart, Purchase) server-side conversion API-এ পাঠায়। সব frontend browser event এই endpoint-এ এসে Facebook-এ forward হয়।

### Endpoint (Base: `/api/v1/meta-pixel`)
| Method | Path |
|--------|------|
| POST | `/event` |

---

## 37. tiktokPixel

**File:** [`src/app/tiktokPixel/`](../FruitSnacksBackend/src/app/tiktokPixel/)

### কী কাজ করে
Meta Pixel-এর মতই — TikTok Pixel server-side conversion API।

### Endpoint (Base: `/api/v1/tiktok-pixel`)
| Method | Path |
|--------|------|
| POST | `/event` |

---

## 38. Image Upload Helpers

**File:** [`src/helpers/frontend/imageUpload/`](../FruitSnacksBackend/src/helpers/frontend/imageUpload/)

### কী কাজ করে
Generic image upload endpoints — যেকোনো module থেকে ছবি/ভিডিও আপলোড করার জন্য reusable। Rich text editor-এ ছবি upload, profile image upload ইত্যাদিতে ব্যবহৃত।

### Endpoints
- `/api/v1/image_upload` — single image
- `/api/v1/multi_image_upload` — multiple images

---

# Cross-Module Map

## ObjectId Reference Graph

```
admins ←── (publisher/updated_by) প্রায় সব মডিউল
roles ←── admins
users ←── orders, offerorders, reviews, questions, carts
products ←── orderproducts, variations, reviews, questions, campaigns.campaign_products, offers.offer_products
categories → subcategories → childcategories
themes ←── products.theme_id, subcategories.default_theme_id
campaigns ←── products.product_campaign_id, orderproducts.campaign_id
coupons ←── orders.coupon_id
```

## Permission Flag → Module Map

প্রতিটি permission flag কোন মডিউলকে রক্ষা করে:

| Permission | Module |
|------------|--------|
| `category_*` | category |
| `sub_category_*` | sub_category |
| `child_category_*` | child_category |
| `brand_*` | brand |
| `attribute_*` | attribute |
| `specification_*` | specification |
| `product_*` | product, variation (variation এ `product_update`) |
| `order_show` / `order_update` | order, courier, fraud (show) |
| `offer_*` / `offer_order_*` | offer, offerOrder |
| `campaign_*` | campaign |
| `coupon_*` | coupon |
| `banner_*` / `slider_*` | banner, slider |
| `review_*` / `question_*` | review, question |
| `user_*` | adminRegLog, user |
| `role_*` | role |
| `customer_*` | (declared, ব্যবহার সীমিত) |
| `site_setting_update` | setting, authentication |
| `page_seo_*` | pageSeo |
| `theme_*` | theme |
| `faq_template_*` | faq_template |

## Authentication Flow

```
Admin login (POST /admin_reg_log/login)
  → password verify (bcrypt)
  → role populate
  → JWT sign with admin_phone
  → Set-Cookie: fruit_snacks_token (httpOnly)

Subsequent admin requests
  → cookie পাঠায় (credentials: 'include')
  → verifyToken(permission) মিডলওয়্যার
  → JWT decode → phone → admin খুঁজে → role check → flag verify → next()

User login (POST /user/login)
  → similar, কিন্তু user collection-এ check
  → JWT cookie সেট
  → cart-এর জন্য verifyUserToken মিডলওয়্যার
```

## Order Lifecycle Flow

```
Cart (frontend) → POST /order
  → invoice_id generate
  → coupon validate (POST /coupon/check_coupon)
  → totals calculate (sub + shipping - discount = grand)
  → Mongoose session transaction:
      orders create
      orderproducts create (per line item)
      products/variations stock decrement
  → response: invoice_id

Admin processes order
  → POST /courier/{pathao|steadfast}/send/:order_id
  → courier API call → consignment_id ফেরত
  → order document update with tracking info, order_status: "processing"

Courier webhook (auto)
  → POST /webhook/{steadfast|pathao}
  → order document-এ courier status update
  → order_status: "shipped"/"delivered"/"return"

Frontend tracking
  → POST /order/order_tracking (invoice_id)
  → courier-specific status response
```

## External Integration Map

| Service | Module | API |
|---------|--------|-----|
| DigitalOcean Spaces (S3) | `helpers/image.upload.ts` | AWS S3 SDK (PutObject, DeleteObject) |
| Pathao Courier | `order/pathao.service.ts` | OAuth token caching, send/track/cancel |
| Steadfast Courier | `order/steadfast.service.ts` | API key auth, send/track |
| FraudBD | `fraud/fraud.service.ts` | POST /api/check-courier-info |
| Meta Pixel CAPI | `metaPixel/meta.pixel.service.ts` | Facebook Conversion API |
| TikTok Pixel | `tiktokPixel/tiktok.pixel.service.ts` | TikTok Events API |
| BulkSMS BD | (authentication module config) | SMS sending |

---

# Environment Variables

`.env` ফাইলে যা যা লাগে:

```env
MONGO_URI=
PORT=8080
ACCESS_TOKEN=                # JWT signing secret

# DigitalOcean Spaces / S3
S3_REGION=
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=                   # "fruit-snacks"
S3_PUBLIC_URL=

# Pathao
PATHAO_BASE_URL=
PATHAO_CLIENT_ID=
PATHAO_CLIENT_SECRET=
PATHAO_CLIENT_EMAIL=
PATHAO_CLIENT_PASSWORD=

# Steadfast
STEADFAST_CLIENT_ID=
STEADFAST_CLIENT_PASSWORD=

# FraudBD
FRAUDBD_API_KEY=
```

---

# Known Issues / Notes

1. **Role permissions in `role.routes.ts`** — GET-এ `role_create`, POST-এ `role_update` (probable bug)
2. **Supplier routes** — `verifyToken("")` empty flag, যেকোনো logged-in অ্যাডমিন অ্যাক্সেস পায়
3. **PaymentWithdraw routes** — কোনো `verifyToken` নেই
4. **Backup files** — `product.interface copy.ts`, `setting.model copy.ts`, `order.controller copy.ts`, `user.controllers copy.ts` ইত্যাদি — পুরোনো backup, ignore করতে হবে
5. **`.env` credentials** — পুরোনো deployment-এর (Mongo URI, S3 bucket, Pathao/Steadfast credentials) — buyer replace করবে
6. **Hardcoded `0.5kg` issue (পুরাতন)** — Pathao courier-এ weight hardcode ছিল, এখন `variation_weight_grams` দিয়ে fix হয়েছে
