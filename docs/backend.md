# FruitSnacks Backend — সম্পূর্ণ ডকুমেন্টেশন

> Express + TypeScript + MongoDB ভিত্তিক REST API সার্ভার।
> পোর্ট ৫০০০ (dev) | বেস URL: `/api/v1`

---

## পরিচিতি

FruitSnacks ব্যাকএন্ড সম্পূর্ণ ই-কমার্স প্ল্যাটফর্মের ডেটা ও বিজনেস লজিকের কেন্দ্র। অ্যাডমিন প্যানেল ও ফ্রন্টএন্ড স্টোরফ্রন্ট উভয়ই এই একটিমাত্র API সার্ভারের সাথে যোগাযোগ করে। ৪৫+টি মডিউল রয়েছে — প্রতিটি একই **CRISM প্যাটার্ন** অনুসরণ করে (interface → model → services → controllers → routes)। সব মাউন্ট করা মডিউলের চূড়ান্ত তালিকা [`src/routes/routes.ts`](../FruitSnacksBackend/src/routes/routes.ts)-এ।

> ⚠️ **এই ডকুমেন্ট ২০২৬-০৬-১৬ তে full re-audit করা হয়েছে।** আগের সংস্করণে যে কাঠামোগত পরিবর্তনগুলো ছিল না, এখন আছে: (১) ক্যাটাগরি এখন **infinite-depth nested tree** (পুরোনো `sub_category`/`child_category` আলাদা মডিউল আর নেই); (২) offer order এখন `orders`-এ merge — পুরোনো `offerOrder` মডিউল মুছে গেছে; (৩) order status ৬ → ৯; (৪) ১২+ নতুন মডিউল (wishlist, wallet, loyalty, payment, flashsale, warehouse, abandonedCart, productFeed, siteFaq, newsletterSubscriber, demo, trustPoint)।

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
| [`src/routes/routes.ts`](../FruitSnacksBackend/src/routes/routes.ts) | ৪৫+টি মডিউল রাউটারের সেন্ট্রাল মাউন্ট |
| [`src/scripts/bootstrap.ts`](../FruitSnacksBackend/src/scripts/bootstrap.ts) | `npm run bootstrap` — fresh-DB first-run setup (super-admin role+user, settings, pageSeo seed, starter FAQ templates)। **ক্লায়েন্ট হ্যান্ডওভারের entry point** |
| [`src/scripts/seed-demo.ts`](../FruitSnacksBackend/src/scripts/seed-demo.ts) | `npm run seed:demo` — presentable food-shop demo catalog (পরে Admin → Demo Data → Clear দিয়ে মোছা যায়) |

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

### Authentication (access + refresh token, Phase D)

**Dual cookie** ([`utils/auth.tokens.ts`](../FruitSnacksBackend/src/utils/auth.tokens.ts)):
- access token → cookie **`fruit_snacks_token`**
- refresh token → cookie **`fruit_snacks_refresh`**
- cookie flags: `httpOnly:true, secure:true, sameSite:"none"` (cross-domain admin↔storefront-এর জন্য `secure+none` আবশ্যক — তাই plain-http localhost-এ cookie সেট হয় না)
- lifetimes: admin access **7d**, user access **30d**, refresh **90d**। `/refresh` দিয়ে নতুন access।
- token payload `{ kind:"access"|"refresh", who:"admin"|"user", _id, *_phone, role_id? }` — প্রতি middleware refresh-as-access ও cross-role misuse **reject** করে।

**Admin auth:** [`verifyToken(permission)`](../FruitSnacksBackend/src/middlewares/verify.token.ts) — cookie JWT verify → admin খোঁজে (token-এর `_id`, fallback phone) → status check → role document-এ ওই permission flag (যেমন `product_create`) `true` কিনা check।

**User auth:** [`verifyUserToken`](../FruitSnacksBackend/src/middlewares/verify.user.token.ts) — storefront user; `req.user = { id, user_phone }` সেট করে।

**OTP hardening** ([`utils/auth.otp.ts`](../FruitSnacksBackend/src/utils/auth.otp.ts)): 6-digit, **bcrypt-hashed at rest**, 10-min expiry, 60s resend cooldown, 5-attempt cap (`otp_sent_at`/`otp_attempts` ব্যাক করে)। rate limiters: auth 20/10min, otp 5/hr+30/day, signup 20/hr, order 30/10min, review 20/hr, newsletter 10/hr।

### File Upload

[`FileUploadHelper`](../FruitSnacksBackend/src/helpers/image.upload.ts) Multer + DigitalOcean Spaces (S3 SDK) ব্যবহার করে:
- ছবি/ভিডিও/পিডিএফ আপলোড → S3-এ `fruit_snacks_images/` বা `fruit_snacks_videos/` ফোল্ডারে
- প্রতিটি ফাইলের জন্য `Location` (URL) ও `Key` (delete-এর জন্য) সংরক্ষিত হয়
- 10MB (image) / 20MB (video) limit

### CORS Allowlist

CORS origin এখন **env-driven** (GATE 0 F007) — `CORS_ORIGINS` (comma-separated https) + localhost ডিফল্ট। হার্ডকোডেড http:// list সরানো হয়েছে → resale-repeatable। নতুন buyer domain `CORS_ORIGINS`-এ যোগ করতে হবে ([`src/index.ts`](../FruitSnacksBackend/src/index.ts))।

### Security hardening (GATE 0 + Stage 1.5)
- helmet, rate-limit (auth 20/10min, otp 5/hr+30/day, signup 20/hr, newsletter 10/hr), pino logger, body size cap, env guard
- F012 IDOR (GET /order auth), F008 webhook secret, F009 upload whitelist, F011 `.env.local` untracked
- ⚠️ deploy-day: secret **rotate** (go-live-এ chat-এ exposed হওয়া creds) — full git history scrub deferred

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
  admin_name, admin_phone (unique), admin_email,  // email = forgot-password email OTP channel
  user_logo, user_logo_key,  // প্রোফাইল ছবি
  admin_country (default: "Bangladesh"), admin_division, admin_district, admin_address,
  admin_status: "active" | "in-active",
  forgot_otp, otp_expires_at, otp_sent_at, otp_attempts,  // forgot/reset-password
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
| POST | `/login` | — | — (JWT cookie সেট, rate-limited) |
| PATCH | `/login` | — | — |
| POST | `/refresh` | — | — | refresh → new access token |
| POST | `/logout` | — | — | cookie clear |
| POST | `/forgot-password` | — | — | admin forgot-password OTP (phone/email, rate-limited) |
| POST | `/reset-password` | — | — | reset (rate-limited) |
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
  user_email (unique-sparse), user_additional_phone, user_gender,
  user_image, user_image_key,
  user_country (default: "Bangladesh"), user_division, user_district, user_address,
  addresses: [{ ... , is_default }],  // saved-address book (S6)
  customer_group: "retail"|"wholesale"|"vip",  // tier pricing
  wallet_amount (default: 0), loyalty_points (default: 0),
  user_status: "active" | "in-active",
  forgot_otp, otp_expires_at, otp_sent_at, otp_attempts,  // bcrypt-hashed OTP, 10-min, 5-attempt cap
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
| POST | `/login` | — | — | user login, JWT cookie সেট (rate-limited) |
| POST | `/refresh` | — | — | refresh token → new access token |
| POST | `/logout` | — | — | cookie clear |
| POST | `/forgetPassword` | — | — | OTP পাঠানো (rate-limited) |
| GET | `/check_phone` | — | — | phone duplicate check |
| POST | `/verifyOTP` | — | — | OTP verify |
| POST | `/resend_otp` | — | — | OTP resend (rate-limited) |
| POST | `/setNewPassword` | — | — | নতুন পাসওয়ার্ড সেট |

**Saved addresses (S6 — user token):**
| Method | Path | কাজ |
|--------|------|-----|
| GET | `/addresses` | নিজের সব address |
| POST | `/address` | নতুন address যোগ |
| PATCH · DELETE | `/address/:address_id` | edit / remove |
| PATCH | `/address/:address_id/default` | default সেট |
| PATCH | `/me/email` | নিজের email সেট (post-order opt-in) |

> JWT এখন **access + refresh token** pattern ([`utils/auth.tokens.ts`](../FruitSnacksBackend/src/utils/auth.tokens.ts)) — `/refresh` দিয়ে নতুন access token। admin-এও একই (`/admin_reg_log/refresh`, `/logout`, `/forgot-password`, `/reset-password`)।

---

## 4. role

**File:** [`src/app/role/`](../FruitSnacksBackend/src/app/role/) | **Collection:** `roles`

### কী কাজ করে
RBAC (Role-Based Access Control) সিস্টেমের কেন্দ্র। প্রতিটি role-এ ~১০০টি boolean permission flag থাকে — প্রতিটা মডিউলের জন্য `_show`, `_create`/`_post`, `_update`, `_delete` ৪টি action। অ্যাডমিন লগইনের সময় তার role চেক হয় এবং প্রতিটি API call-এ specific flag verify হয়।

### Interface (গুরুত্বপূর্ণ flag categories)
- Catalog: `category_*`, `brand_*`, `attribute_*`, `product_*`। ⚠️ `sub_category_*`/`child_category_*`/`specification_*` flag এখনো role schema-তে **আছে** (orphan/dead — মডিউল মুছে গেছে কিন্তু flag পরিষ্কার করা হয়নি; কোনো route এগুলো ব্যবহার করে না)। `customer_*` flag-ও আছে কিন্তু কোনো route gate করে না।
- Commerce: `order_show`, `order_update`, `order_create_admin` (POS), `coupon_*`
- Marketing: `campaign_*`, `offer_*`, `banner_*`, `slider_*`, `review_*` (+`review_seed_bulk`/`review_seed_manual`), `question_*`, `flash_sale_*`
- Admin/Config: `user_*` (admin), `role_*`, `site_setting_update`, `setting_secrets_update`, `setting_show`/`setting_update`, `page_seo_*`, `dashboard_show`
- Theme/Content: `theme_*`, `faq_template_*`, `trust_point_update`, `site_faq_*`, `newsletter_*`
- Storefront extras: `demo_data_clear`

> bootstrap script schema থেকে প্রতিটা Boolean flag পড়ে super-admin role বানায় — ফলে নতুন flag যোগ করলেও super-admin role stale হয় না (`npm run bootstrap -- --sync-superadmin` দিয়ে refresh)। Admin UI-এর জন্য একই flag [`permissionData.js`](../FruitSnacksAdmin/src/data/permissionData.js)-এ থাকতে হয়।

### Endpoints (Base: `/api/v1/role`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | Cookie | `role_show` |
| POST | `/` | Cookie | `role_create` |
| PATCH | `/` | Cookie | `role_update` |
| DELETE | `/` | Cookie | `role_delete` |

> ✅ আগে flag mapping এলোমেলো ছিল (B-1) — এখন ঠিক (get=show, post=create, patch=update, delete=delete)।

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
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | Cookie | `supplier_show` |
| POST | `/` | Cookie | `supplier_create` |
| PATCH | `/` | Cookie | `supplier_update` |
| DELETE | `/` | Cookie | `supplier_delete` |
| GET | `/dashboard` | Cookie | `supplier_show` |

> ✅ আগে `verifyToken("")` (empty flag — যেকোনো admin access পেত, B-2) ছিল — এখন proper `supplier_*` flag।

---

# মডিউল গ্রুপ ২ — Catalog (Categories, Brands, Products)

## 7. category (Nested Category Tree — infinite depth)

**File:** [`src/app/category/`](../FruitSnacksBackend/src/app/category/) | **Collection:** `categories`

> ⚠️ **কাঠামোগত পরিবর্তন (variation engine sprint):** পুরোনো ৩-লেভেল হায়ারার্কি (`category → sub_category → child_category`, ৩টা আলাদা collection) সরিয়ে দেওয়া হয়েছে। এখন একটাই self-referencing `categories` collection — **যেকোনো গভীরতার** nested tree। `sub_category` ও `child_category` মডিউল আর নেই।

### কী কাজ করে
সব ক্যাটাগরি একই collection-এ থাকে, parent-child সম্পর্ক `parent_id` দিয়ে। প্রতিটি node তার পূর্বপুরুষদের id একটা `category_path` array-তে snapshot করে রাখে — ফলে subtree filter (`{ category_path: nodeId }`) একটা indexed query-তেই node + তার সব descendant ধরে। breadcrumb-ও recursive lookup ছাড়া তৈরি হয়।

### Interface (গুরুত্বপূর্ণ ফিল্ড)
```ts
{
  category_name, category_slug (unique),
  category_logo, category_logo_key,
  category_video, category_video_key,
  category_status: "active" | "in-active",
  category_serial,  // sibling-scoped ordering
  feature_category_show, explore_category_show,  // হোম পেজ visibility

  // ── Nested tree ──
  parent_id: ObjectId → categories | null,  // null = root level
  category_path: ObjectId[],  // ordered ancestors (root → … → parent)
  depth: number,  // path length (0 = root)

  // ── Attribute inheritance (variation/filter engine) ──
  default_variant_attributes: ObjectId[],  // descendant-এ inherited হয়
  default_filter_attributes: ObjectId[],
  default_theme_id: ObjectId → themes,  // ওই node-এ নতুন product create করলে auto-apply

  category_publisher_id, category_updated_by
}
```

### Re-parent / Delete সুরক্ষা
- `updateCategoryServices` re-parent করার সময় cycle prevention + transactional descendant-cascade + সংশ্লিষ্ট product-এর `category_path` refresh করে।
- `getReparentImpactServices` (`/reparent-impact/:id`) descendant + product count ফেরত দেয় admin-এর confirm dialog-এর জন্য।
- `deleteCategoryServices` শুধু leaf node delete করতে দেয় (descendant থাকলে block) এবং stale product `category_path` থেকে deleted id `$pull` করে।
- `resolveCategoryDefaults()` parent-chain merge করে inherited attribute resolve করে (dead-ref self-heal + cycle guard সহ)।
- **Featured caps:** সর্বোচ্চ **৬টা** `feature_category_show` + **৩টা** `explore_category_show` (create+update দুই জায়গায় enforce)।

### Endpoints (Base: `/api/v1/category`)
| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| GET | `/` | — | — | flat active list |
| POST | `/` (multipart) | Cookie | `category_post` | create (logo + video) |
| PATCH | `/` (multipart) | Cookie | `category_update` | update / re-parent |
| DELETE | `/` | Cookie | `category_delete` | leaf-only delete |
| GET | `/tree` | — | — | full nested tree (root → nested children) |
| GET | `/feature_category` | — | — | featured roots + children (tree-aware) |
| GET | `/dashboard` | Cookie | `category_show` | flat paginated (admin) |
| GET | `/breadcrumb/:id` | — | — | ancestors → node |
| GET | `/reparent-impact/:id` | Cookie | `category_update` | descendant + product count preview |
| GET | `/children/:id` | — | — | এক node-এর direct children (`:id` = node id বা `root`) |
| GET | `/defaults/:id` | — | — | resolved default attributes (parent-merged) |

> **Note:** product-এ এখন `category_id` (একটা leaf, **Phase L থেকে OPTIONAL**) + `category_path` (ancestor snapshot, re-parent cascade-এ refresh হয়)। storefront filter ও breadcrumb `category_path` পড়ে।

---

## 8. brand

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

## 9. attribute

**File:** [`src/app/attribute/`](../FruitSnacksBackend/src/app/attribute/) | **Collection:** `attributes`

### কী কাজ করে
প্রোডাক্ট ভ্যারিয়েশন তৈরির জন্য attribute সংজ্ঞা — যেমন "Color" attribute-এর values: Red, Blue, Green। অ্যাডমিন attribute তৈরি করে, প্রতিটি attribute-এ একাধিক value থাকে।

### Interface
```ts
{
  attribute_name, attribute_slug, attribute_status,
  category_id (optional),
  display_type: "swatch"|"button"|"dropdown",  // PDP picker UI (default "button")
  tracks_weight: boolean,  // এই attribute variation weight derive করে
  attribute_values: [{
    attribute_value_name, attribute_value_slug,
    attribute_value_code,  // color code, etc.
    weight_grams_value,  // tracks_weight হলে — variation auto-weight
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
| GET | `/usage/:id` | Cookie | `attribute_show` | এই attribute কতগুলো product/variation-এ ব্যবহৃত (delete-protection) |
| GET | `/:category_id` | — | — (specific category-র attributes) |

> **Delete guard:** কোনো product attribute-টা reference করলে delete **block** হয় → **409** + count + ১০টা sample product id ফেরত দেয় (`attribute.controllers.ts`)। `display_type`/`tracks_weight`/`weight_grams_value` PDP picker + filter + variation auto-weight চালায়।

---

## 10. ~~specification~~ — REMOVED

> ❌ **আলাদা `specification` মডিউল আর নেই** (variation/attribute engine sprint)। আগে technical spec আলাদা collection-এ থাকত; এখন দুই জায়গায় ভাগ হয়েছে:
> - **filterable/variant axis** → `attribute` মডিউল (single source of truth — variation + filter দুটোই attribute থেকে)
> - **display-only spec rows** → product-এর `custom_fields: [{ label, value, icon_key }]` (niche-neutral, FAQ placeholder-এর উৎসও)
>
> storefront filter এখন attribute + category default attribute থেকে আসে। ⚠️ `specification_*` role flag schema-তে এখনো আছে (orphan — মডিউল গেছে, flag পরিষ্কার হয়নি; কোনো route ব্যবহার করে না)।

---

## 11. product

**File:** [`src/app/product/`](../FruitSnacksBackend/src/app/product/) | **Collection:** `products`

### কী কাজ করে
পুরো ই-কমার্স প্ল্যাটফর্মের সবচেয়ে কেন্দ্রীয় মডিউল। প্রোডাক্টের নাম, দাম, স্টক, ক্যাটাগরি, ছবি, ভিডিও, থিম, নিউট্রিশন, FAQ — সবকিছু এখানে।

### Interface (গুরুত্বপূর্ণ ফিল্ড)
```ts
{
  product_name, product_slug (unique), product_slug_history[],
  product_sku, product_status: "active" | "in-active",
  category_id (OPTIONAL since Phase L — single leaf node → categories),
  category_path: ObjectId[],  // ancestor snapshot (nested tree), re-parent cascade refresh
  brand_id, product_supplier_id, product_publisher_id, product_updated_by,
  attributes_details[],  // attribute = variation engine source of truth (পুরোনো specifications[] বাদ)
  custom_fields: [{ label, value, icon_key }],  // niche-neutral spec rows (FAQ placeholder source)
  barcode, barcode_image,
  description, main_image, main_video, other_images[], size_chart,
  product_price, product_buying_price, product_discount_price,
  product_quantity, product_alert_quantity,
  is_variation: boolean,  // true হলে variations কালেকশন থেকে দাম/স্টক
  product_warrenty, product_return, unit,
  meta_title, meta_description, meta_keywords[],
  product_campaign_id, trending_product,  // trending_product → boutique Hero Spotlight + Product Features feed করে
  sold_count, view_count,  // PDP badge (view_count `show_view_count` setting দিয়ে gated)

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
- `GET /:product_slug` → category (+ ancestor path), brand, theme, campaign populate; category active check; `is_variation: true` হলে variations fetch
- `GET /dashboard` → aggregation pipeline (search regex, filter, paginate, sort, count)। N+1 এড়াতে variation single bulk `$in` query
- Trending/Popular/Related/JustForYou — আলাদা criteria, একই product collection
- `GET /faq-placeholder-keys` → FAQ template-এ ব্যবহারযোগ্য niche-neutral placeholder key + label (custom_fields/nutrition/spec থেকে derived)

### Endpoints (Base: `/api/v1/product`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/` (multipart) | Cookie | `product_create` |
| PATCH | `/` (multipart) | Cookie | `product_update` | full rebuild |
| DELETE | `/` | Cookie | `product_delete` |
| PATCH | `/page-content` | Cookie | `product_update` | theme/benefits/nutrition/faq/floating |
| PATCH | `/quick` | Cookie | `product_update` | price/stock/status quick edit |
| PATCH | `/images` (multipart) | Cookie | `product_update` | image reorder/add/remove |
| POST | `/check_product_barcode` | — | — |
| POST | `/check_product_barcode_when_update` | — | — |
| POST | `/qr` | Cookie | `product_update` | QR generate |
| POST | `/ensure-barcode-image` | Cookie | `product_update` | barcode image ensure |
| POST | `/view-count` | — | — | PDP view bump |
| GET | `/by-qr-code/:code` | — | — | QR lookup |
| GET | `/trending_product` | — | — |
| GET | `/brand_match_product` | — | — |
| GET | `/popular_product` | — | — |
| GET | `/top_selling` | — | — |
| GET | `/new_arrival` | — | — |
| GET | `/most_viewed` | — | — |
| GET | `/just_for_you_product` | — | — |
| GET | `/related_product` | — | — |
| GET | `/ecommerce_choice_product` | — | — |
| GET | `/low_stock` | Cookie | `product_show` |
| GET | `/faq-placeholder-keys` | Cookie | `product_show` |
| GET | `/dashboard` | Cookie | `product_show` |
| GET | `/dashboard-rich` | Cookie | `product_show` | rich list (POS) |
| GET | `/dashboard/:_id` | — | — |
| POST | `/cart_product` | — | — (GET→POST, বড় cart-এ URL length limit এড়াতে) |
| GET | `/compare_product?ids=` | — | — |
| GET | `/:product_slug` | — | — |

> **Partial-update endpoints:** full PATCH `/product` একটা multipart full-form rebuild। ছোট পরিবর্তনের জন্য আলাদা route আছে — `/quick` (price/stock/status), `/images` (image reorder/add/remove), `/page-content` (theme/benefits/nutrition/faq), এবং variation-এর জন্য `/variation/:id`। এগুলো full rebuild এড়ায়।

### Business Rules
1. Category active check (nested tree — node ও তার ancestor active কিনা)
2. Slug history (SEO 301 redirect)
3. `is_variation: true` হলে variations থেকে price/stock
4. ডিসকাউন্ট priority: flash > campaign > variation > discount_price > price
5. Image cleanup on update (within-product ref-counted S3 delete)

---

## 12. variation

**File:** [`src/app/variation/`](../FruitSnacksBackend/src/app/variation/) | **Collection:** `variations`

### কী কাজ করে
যেসব প্রোডাক্টে একাধিক ভ্যারিয়েন্ট আছে (যেমন: ৫০০g, ১kg, ২kg) সেগুলোর আলাদা আলাদা ডকুমেন্ট। প্রতিটি variation-এর নিজস্ব price, stock, image ও ওজন থাকে।

### Interface
```ts
{
  variation_name,
  product_id: ObjectId → products (required),

  // Pricing — DUAL model:
  variation_price, variation_discount_price, variation_buying_price,  // legacy ABSOLUTE (override base)
  variation_price_delta,  // NEW combination model — base price-এর সাথে যোগ হয়

  // Combination engine:
  combination: ObjectId[],  // sorted attribute_value ids (এই variation কোন attribute-combo)
  is_active: boolean,

  variation_quantity, variation_alert_quantity,
  variation_barcode, variation_barcode_format, variation_barcode_image,
  variation_sku,  // sparse-unique index (barcode-ও)
  variation_image, variation_image_key,
  variation_images[], variation_images_keys[],  // multi-image gallery
  variation_video, variation_video_key,
  warehouse_id,

  // Dynamic Product Page System
  variation_weight_grams,  // Pathao courier-এর জন্য (hardcoded 0.5kg বদলে)
  variation_badge_text, variation_badge_icon_key
}
```

### Endpoints (Base: `/api/v1/variation`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/by-product/:productId` | — | — |
| PATCH | `/:id` | Cookie | `product_update` |

---

## 13. productFilter

**File:** [`src/app/productFilter/`](../FruitSnacksBackend/src/app/productFilter/)

### কী কাজ করে
স্টোরফ্রন্টের ফিল্টার ও সার্চ ফাংশনালিটি। category (nested subtree)/brand/price-range/attribute দিয়ে ফিল্টার করে প্রোডাক্ট তালিকা রিটার্ন করে।

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
| GET | `/` | User token | কার্ট আনা (per line `product_slug` enrich করে) |
| PUT | `/` | User token | **পুরো `cart_products` array replace** (partial add/remove নয়) |
| DELETE | `/` | User token | পুরো কার্ট খালি |
| POST | `/sync` | User token | লগইনের পর localStorage cart DB-তে merge |

> **Merge rule:** guest→DB sync-এ একই `product_id`+`variation_id` (null-aware) line-এ quantity **`Math.max(existing, local)`** নেয় — যোগ (additive) **নয়**।

---

## 17. order

**File:** [`src/app/order/`](../FruitSnacksBackend/src/app/order/) | **Collection:** `orders`

### কী কাজ করে
সবচেয়ে complex commerce মডিউল। চেকআউট সম্পন্ন হলে অর্ডার তৈরি হয়, courier (Pathao/Steadfast)-এ পাঠানো, status track, webhook update — সব এই মডিউলে। অর্ডার ও line items আলাদা collection-এ (`orders` ও `orderproducts`)।

### Interface
```ts
{
  invoice_id,
  // ৯-value status (was ৬ — on_hold/confirmed/completed যোগ হয়েছে, ZatiqEasy-aligned)
  order_status: "pending"|"on_hold"|"confirmed"|"processing"|"shipped"|"delivered"|"completed"|"cancel"|"return",
  pending_time, on_hold_time, confirmed_time, processing_time, shipped_time,
  delivered_time, completed_time, cancel_time, return_time,

  // Order Unification (Phase A) — slot + wired fields
  order_type: "regular"|"offer"|"gift"|"pre_order"|"subscription"|"wholesale"|"custom"|"digital",  // default "regular"
  currency,  // settings.currency_code snapshot
  pre_discount_total,  // discount আগের মোট (invoice-এ savings দেখাতে)
  cancel_reason, return_reason, internal_note,  // internal_note public GET থেকে stripped
  fraud_status, fraud_checked,

  billing_country, billing_city, billing_state, billing_address,
  shipping_location,
  sub_total_amount, discount_amount, vat_amount, shipping_cost, grand_total_amount,
  exchange_rate,  // multi-currency slot (default 1)
  coupon_id, customer_id, customer_phone,
  offer_id,  // order_type:"offer" হলে — পুরোনো offerOrder collection merge
  order_updated_by, tracking_code,
  stock_restored,  // cancel/return-এ restock idempotency guard

  // Loyalty redeem at checkout (folded into discount):
  loyalty_redeem_points, loyalty_redeem_amount,

  // Phase C — payment (manual MFS / SSLCommerz / advance):
  payment_method: "cod"|"manual_mfs"|"sslcommerz"|"bank_transfer",
  payment_status, transaction_id, paid_amount, paid_at, payment_meta,
  advance_amount, advance_method,  // partial/advance payment

  // POS / admin order:
  order_source: "storefront"|"admin",  // admin order pipeline আলাদা
  admin_manual_discount, manual_discount_reason, admin_created_by, payment_method_note,

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
| POST | `/` | — | — | কার্ট থেকে অর্ডার (regular + offer) |
| GET | `/` | User token | — | logged-in customer-এর সব অর্ডার (**F012 fix:** এখন `verifyUserToken` + `req.user.id`, আগে unauthenticated IDOR ছিল) |
| PATCH | `/` | Cookie | `order_update` | status update |
| POST | `/single_order` | — | — | guest single-product checkout (rate-limited) |
| POST | `/create-admin` | Cookie | `order_create_admin` | POS / admin order create |
| GET | `/dashboard` | Cookie | `order_show` | admin অর্ডার তালিকা (+ `?order_type=offer`) |
| GET | `/steadfast` | Cookie | `order_show` | শুধু Steadfast অর্ডার |
| PATCH | `/steadfast/cancel/:order_id` | Cookie | `order_update` | Steadfast cancel |
| GET | `/pathao` | Cookie | `order_show` | শুধু Pathao অর্ডার |
| POST | `/order_tracking` | — | — | invoice_id দিয়ে track (public) |
| PATCH | `/delivery-info/:order_id` | Cookie | `order_update` | delivery info update |
| PATCH | `/:order_id/email` | — | — | order-এ email attach (post-order email opt-in) |
| GET | `/:order_id` | — | — | order + line items details |

### Order Pipeline (চেকআউট flow)
1. Frontend `POST /order` — cart products + billing/shipping info (regular **এবং** offer উভয়, `order_type` + optional `offer_id` সহ)
2. **Pre-write gates:** `min_order_amount`, `verify_phone_on_order` (settings) — fail হলে কোনো DB write হয় না।
3. **`recomputeOrderTotals` (server price authority — `order.recompute.ts`):** client-এর পাঠানো price/total **সম্পূর্ণ উপেক্ষা** করে নিজে recompute করে:
   - per-line price resolve: base/variation(absolute বা delta) → flash → campaign → offer → coupon/BOGO (best/override, last-writer)
   - per-line name/image snapshot + `discount_source`
   - **loyalty redeem** (`loyalty_redeem_points`→amount, clamped) discount-এ যোগ
   - **per-line VAT** (`vat_percentage_override` > `settings.vat_percentage`, net-after-discount-এ)
   - **zone-aware shipping recompute** (inside/outside Dhaka from `billing_state`, per-product mode free/flat/qty_threshold, global free-delivery rule)
   - `grand = sub_total − discount + vat_amount + shipping_cost`
4. offer branch (Phase B): `offer_id` → offer active + date-window (+১দিন grace) verify (expired reject)।
5. Mongoose transaction: `orders` + `orderproducts` create + **atomic conditional stock decrement** (`order.stock.ts` — `updateOne` qty `$gte` → `modifiedCount===0` হলে 409 "Out of stock", negative অসম্ভব; **placement-এ decrement** delivery-তে নয়; `maintain_stock:false` প্রোডাক্ট (pre-order/MTO) guard+decrement bypass করে)।
6. Response: invoice_id

### Advance/partial payment ও POS
- **Advance (Phase C3):** `advance_amount`/`advance_method` settings-এর min-percent gate-এর বিপরীতে validate; gateway init করে। `payment_status` partial/paid `paid_amount` vs grand দিয়ে।
- **POS (`POST /create-admin`):** `order_source:"admin"`; **admin-chosen shipping recompute-এ survive করে**; `admin_manual_discount` coupon-কে replace করে; pickup হলে shipping 0; Meta/SMS/user-update **fire করে না**।

### Restock (cancel/return)
courier webhook বা admin status-change cancel/return করলে `restockOrder` — idempotent (`stock_restored` flag একবারই restock নিশ্চিত করে)।

> **SMS:** order-place-এ নয়, admin order **CONFIRM**-এ SMS fire করে (post-commit, non-blocking)। guest-unverified / verified-guest / logged-in ভেরিয়েন্ট আলাদা।

> **Admin filter:** `GET /dashboard?order_type=offer` দিয়ে শুধু offer order দেখা যায় (পুরোনো আলাদা offerorders তালিকার বদলে)।

### Webhook Flow
- Steadfast/Pathao নিজে থেকে POST করে → courier status sync হয় → order.order_status আপডেট হয়
- **Security (GATE 0 F008):** Steadfast webhook এখন shared-secret (`STEADFAST_WEBHOOK_SECRET` via `?token=`/header); Pathao fail-open বন্ধ — deploy-day-তে `*_WEBHOOK_SECRET` env সেট করতে হবে + courier dashboard-এ register

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
  product_name_snapshot, product_image_snapshot,  // order-time snapshot (product বদলালেও invoice অক্ষত)
  product_main_price, product_main_discount_price,
  product_unit_price, product_unit_final_price,
  product_quantity, product_grand_total_price,
  discount_source: "flash_sale"|"campaign"|"offer"|"coupon"|"manual"|"none",
  vat_rate, vat_amount,
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

> **Pathao token cache:** in-memory, 5-min safety margin আগে refresh, `expires_in` fallback 3600s, **401 এলে cache bust** করে re-auth ([`pathao.service.ts`](../FruitSnacksBackend/src/app/order/pathao.service.ts))।
>
> **Send guards:** আগে পাঠানো (consignment আছে) বা status processing/shipped/delivered হলে re-send block; Pathao-তে `pathao_city_id`+`pathao_zone_id` লাগে; send হলে `order_status:"processing"`; Pathao cancel শুধু `pathao_status==="Pending"` থাকলে।
>
> **⚠️ Weight:** single-send `variation_weight_grams` যোগ করে (fallback 500g, floor `Math.max(0.5,…)`)। **🐛 BUG:** Pathao **bulk-send এখনো hardcoded `item_weight:0.5`** (`pathao.service.ts:321`) — পুরোনো 0.5kg bug bulk path-এ রয়ে গেছে। `PATHAO_STORE_ID` env payload-এ লাগে।

---

## 20. order/webhook

**File:** [`src/app/order/webhook/`](../FruitSnacksBackend/src/app/order/webhook/)

### কী কাজ করে
Courier-গুলো নিজে থেকে status update পাঠায় এই webhook URL-এ। **secret-protected** (GATE-0 F008 — আগে open ছিল):
- **Pathao:** HMAC-SHA256 signature verify; `PATHAO_WEBHOOK_SECRET` সেট থাকলে **fail-closed** (invalid signature reject)।
- **Steadfast:** shared-secret `?token=` query বা `x-steadfast-webhook-secret` header; mismatch হলে **401**।

cancel/return status এলে webhook `restockOrder` call করে (idempotent — `stock_restored` flag)। event filtering: Pathao `webhook_integration`/`order.created`/no-status skip করে; Steadfast `delivery_status` vs `tracking_update` আলাদা handle।

### Endpoints (Base: `/api/v1/webhook`)
| Method | Path | কাজ |
|--------|------|-----|
| POST | `/steadfast` | Steadfast callback — সবসময় **200** (retry থামাতে), bad secret-এ **401** |
| POST | `/pathao` | Pathao callback — HMAC verify; response **202** |

### Courier status maps (code → order_status)
- **Pathao** (`pathao.service.ts`): `Pending→pending`, `On Hold/Hold→shipped`, `Picked/In Transit→shipped`, `Delivered/Partial Delivery→delivered`, `Returned/Partially Returned→return`, `Cancelled→cancel`।
- **Steadfast** (`webhook.controller.ts`): `pending/hold→shipped`, `in_review→processing`, `delivered/partial_delivered→delivered`, `cancelled→cancel`, `unknown→` (no change)।

> ⚠️ `pathaoStatusMap` দুই জায়গায় duplicated (`pathao.service.ts` + `pathao.webhook.controller.ts`) — sync রাখতে হয়।

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
phone normalize: strip +?88 → ^01[3-9]\d{8}$ (FraudBD); DB search 3 variants [cleaned, +88…, 88…]
  → Parallel: [FraudBD API, DB last-20-orders cancel/return/delivered count in JS]
  → calculateRiskLevel(): level + color + reason
```

**Thresholds** (`fraud.service.ts`):
- **High** = Pathao `very_high` OR FraudBD cancelRate ≥50 OR db cancelRate ≥50
- **Medium** = Pathao `high` OR cancelRate ≥30 OR db cancelRate ≥30 OR db returned ≥2
- **New** = কোনো DB order নেই + FraudBD summary নেই
- **Low** = বাকি সব

> ⚠️ **advisory only** — High Risk হলেও কোনো order auto-block হয় না; admin সিদ্ধান্ত নেয়। history শুধু last 20 order-এর windowed।

---

## 22. coupon

**File:** [`src/app/coupon/`](../FruitSnacksBackend/src/app/coupon/) | **Collection:** `coupons`

### কী কাজ করে
ডিসকাউন্ট কুপন সিস্টেম। কুপন তৈরি, validation, apply। `fixed` / `percent` দুটো টাইপ, specific customer/product বা all-এর জন্য, per-person ও total usage limit।

### Interface
```ts
{
  coupon_code, coupon_start_date, coupon_end_date,
  coupon_type: "fixed" | "percent" | "bogo",   // bogo = 3rd shipped type
  coupon_amount, coupon_max_amount,
  bogo_buy_qty, bogo_get_qty, bogo_get_discount_pct,  // BOGO config
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

### Discount math (server-side, `order.recompute.ts`)
- **percent:** `round(sub_total × amount/100)`, তারপর `coupon_max_amount`-এ cap (max শুধু percent-এ লাগে)।
- **fixed:** flat `coupon_amount` (max দিয়ে cap হয় না)। চূড়ান্ত discount `sub_total`-এ clamp।
- **bogo:** buy-N (`bogo_buy_qty`) get-M (`bogo_get_qty`) at `bogo_get_discount_pct`% off **সবচেয়ে সস্তা** qualifying line; `coupon_specific_product` সেট থাকলে সেই scope-এ, নয়তো পুরো cart; eligible qty `< buy+get` হলে apply হয় না; anon (logged-out)-ও পারে।
- **Validation:** date-window (end + ১ দিন grace), `coupon_status:"active"`, `coupon_available > 0` (global stock — create-এ `coupon_use_total_person` দিয়ে seed হয়, order-এ decrement), customer allowlist (শুধু `customer_id` পাঠালে enforce), per-person cap (order placement-এ enforce)।

> **Related:** `coupon_used` সাব-ফোল্ডার = `couponcustomers` collection (`{coupon_id, customer_id, used}`) — per-(coupon,customer) count। Global total `coupon_available` decrement দিয়ে track হয় (আলাদা counter row নেই)। per-person cap এখন `/check_coupon` ও order placement দুই জায়গাতেই enforce হয় (B3 fix — আগে check_coupon-এ dead ছিল)।

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
    offer_product_id, offer_product_quantity,  // ⚠️ display-only — checkout-এ enforce হয় না (নিচে দেখুন)
    offer_discount_price,
    offer_discount_type: "fixed" | "percent"
  }],
  offer_status, offer_publisher_id, offer_updated_by
}
```

> ⚠️ **`offer_product_quantity` ("buy N") enforce হয় না** — offer order-এ প্রোডাক্টটা থাকলে **যেকোনো quantity-তে** discount পায় (`order.recompute.ts` শুধু product_id দিয়ে match করে, qty পড়ে না)। এটা ইচ্ছাকৃত (owner সিদ্ধান্ত: qty শুধু UI suggestion)। **Future:** client সত্যিকারের "buy N save" চাইলে BE+FE মিলিয়ে min-qty gate করতে হবে (deep-audit B4)।

### Endpoints (Base: `/api/v1/offer`)
Standard CRISM (GET public, POST/PATCH/DELETE auth + `offer_*`), `/dashboard` (`offer_show`), `/dashboard/add_offer_product`, `/by-product/:product_id` (public — PDP offer-discovery banner-এর জন্য active offer), `/:_id`।

---

## 25. ~~offerOrder~~ — REMOVED (merged into `orders`)

> ❌ **এই মডিউল আর নেই** (Order Unification Phase B, commit `fc397dd`)। আগে offer order আলাদা `offerorders` collection-এ থাকত; এখন সব order এক `orders` collection-এ, offer order = `order_type:"offer"` + `offer_id`। সম্পর্কিত পরিবর্তন:
> - `offer_order_show`/`offer_order_update` role flag মুছে গেছে
> - `/api/v1/offer_order` route মুছে গেছে; offer checkout এখন `POST /order` ব্যবহার করে
> - admin OfferOrderList page মুছে গেছে; offer order দেখা যায় `GET /order/dashboard?order_type=offer` দিয়ে
> - পুরোনো `/offer-orders/...` FE URL → purchase history-তে 301 redirect
> - offer line stock এখন `decrementStockForLines` দিয়ে decrement হয় (পুরোনো manual `$inc` বাদ)

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
  review_status: "pending" | "active" | "in-active",
  reviewer_name, reviewer_verified,  // seeded/guest reviews-এর জন্য (review_user_id null হলে)
  is_seeded, source: "customer"|"csv_bulk"|"manual_admin"|"demo_seed",  // demo-clear "demo_seed" দিয়ে মোছে
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
| GET | `/by-ids` | — | — | reviews carousel manual-pick (by id list) |
| POST | `/seed/bulk` | Cookie | `review_seed_bulk` | bulk seed (JSON rows + shared image) |
| POST | `/seed/manual` | Cookie | `review_seed_manual` | multi-product manual seed |
| GET | `/seed/list` | Cookie | `review_show` | seeded review তালিকা |
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

> ⚠️ ২০৬-field monolith — security ইতিমধ্যে ২-tier separated (public `/setting` secret strip করে, `/setting/secrets` flag-gated)। ৪-collection split = future/SaaS, delivery blocker নয় (`docs/_ai/SETTINGS_ARCH_DEBT.md`)।

### Interface (গুরুত্বপূর্ণ সেকশন)
- **Branding:** logo, favicon, title, welcome_message, currency_code/symbol/name
- **Contact/Social:** contact, email, address×3, facebook, instagram, twitter, youtube, whatsapp, tiktok
- **Shipping:** inside_dhaka_shipping_charge/days, outside_dhaka_shipping_charge/days, free_delivery_enabled, free_delivery_type ("always"/"min_order"), free_delivery_min_amount
- **Policies:** about_us, return_policy, refund_policy, cancellation_policy, privacy_policy, terms_condition, shipping_info
- **SEO:** seo_title, seo_description, seo_keywords
- **Analytics (DB-driven IDs, S4+S5):** meta_pixel_id, tiktok_pixel_id, gtm_id, ga4_id, clarity_id + প্রতিটার `_enabled` toggle। CAPI secret (meta_capi_access_token, tiktok_capi_access_token) **secrets endpoint-এ আলাদা** (public `/setting` থেকে stripped)
- **SMS:** sms_provider_name, sms_api_key, sms_api_secret, sms_sender_id, sms_enabled
- **Email:** email_provider_name, email_host, email_port, email_username, email_password, email_from_address, email_from_name, email_provider_enabled (forgot-password email OTP channel-এর জন্য)
- **Courier toggles:** steadfast_*, pathao_*, redx_* (per-courier enabled flag + creds)
- **Storefront behaviour (C13):** ১৩টা toggle (review moderation, WhatsApp chat, ইত্যাদি)
- **Chat widgets (NEW):** `chat_messenger_show` + `chat_messenger_page_id` (m.me), `chat_livechat_show` + `chat_livechat_embed_code` (Tawk.to/Crisp embed), `chat_widgets_position` ("bottom-right"/...)। WhatsApp button পুরোনো `enable_whatsapp_chat` reuse করে। **`chat_livechat_embed_code` public** (browser-এ inject হয়, secret নয়)
- **Home Layout (Track D — ~60 field):** `home_section_array: [{ id, enabled, order }]` (drag-drop section reorder), strip config, hero/navbar/topbar/footer config, `brand_story_*`, `reviews_carousel_*` (auto_featured / manual_pick), `site_faq_title`, `newsletter_*`, `footer_show_mini_newsletter`
- **Boutique sections (NEW):** home_section_array-এ `hero_spotlight` / `product_features` / `story_band` enable করলে boutique preset render হয় (অল্প-product শপের জন্য)
- **Announcement bar:** [{ text, icon }] — উপরের rolling banner (3 items)
- **Misc:** `show_view_count` (PDP view-count badge), `demo` data (`is_demo`-flagged rows — Demo Data tab থেকে clear হয়)

### Endpoints (Base: `/api/v1/setting`)
| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| GET | `/` | — | — | পাবলিক setting (secret stripped) |
| PATCH | `/` | Cookie | `site_setting_update` | update |
| GET | `/secrets` | Cookie | `setting_secrets_update` | CAPI/SMS/courier secret (masked) |
| PATCH | `/secrets` | Cookie | `setting_secrets_update` | secret update (staff `site_setting_update` দিয়ে owner token rotate করতে পারে না) |
| POST | `/test-email` | Cookie | `setting_secrets_update` | go-live-এর আগে SMTP verify |
| GET | `/home_layout` | Cookie | `site_setting_update` | Home Layout tab data |
| PATCH | `/home_layout` | Cookie | `site_setting_update` | শুধু home-relevant field save (অন্য tab অক্ষত) |
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
**Dynamic Product Page System-এর কেন্দ্র।** প্রতিটি প্রোডাক্ট পেজে আলাদা রঙ, ফন্ট, floating fruit images, button style apply করার জন্য reusable theme সংরক্ষণ করে। category node-এর `default_theme_id` (nested tree — পুরোনো sub_category নয়) ও product-এর `theme_id` এই collection-কে রেফারেন্স করে।

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
    id,  // stable randomUUID — product-level override এই id দিয়ে target করে ($push-এও explicit সেট)
    asset_url, asset_key (REQUIRED),
    position: "left" | "right",
    align: "top" | "middle" | "bottom",  // section-এর ভেতরে anchor
    section: "hero"|"order"|"benefits"|"use_cases"|"nutrition"|"reviews"|"faq"|"any",
    animation_type: "float"|"spin"|"bounce"|"sway"|"none",
    animation_speed: "slow"|"normal"|"fast",
    size: "xs"|"sm"|"md"|"lg",
    opacity (0-1), hide_on_mobile
  }],

  typography: {
    heading_font,  // two-font system (heading + body আলাদা)
    body_font,
    heading_weight: "400"|"500"|"600"|"700"
    // style: deprecated/unused (পুরোনো single-font system-এর leftover)
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

### Floating images — section-anchored unified model (rethink)
theme-এর global `floating_assets[]` সব product-এ inherit হয়। প্রতিটি product নিজের `floating_overrides { hidden_ids[], replacements{}, extras[] }` দিয়ে per-product **hide** / **replace** (একই slot+anim, শুধু image swap, theme অক্ষত) / **extra** যোগ করতে পারে। FE `mergeFloating()` override-কে theme-এর উপর layer করে (dead-ref guard সহ)। পুরোনো full-page `ProductFloatingImages` (z-index trap) সরানো হয়েছে; `prefers-reduced-motion` float anim বন্ধ করে। ⚠️ section enum এখনও food-hardcoded — multi-niche debt।

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
প্রোডাক্ট FAQ-এর জন্য reusable template। অ্যাডমিন একবার তৈরি করে রাখে — তারপর প্রোডাক্টে copy করে paste করা যায়। **overhaul (commit `ba7161a`):** `category` এখন hardcoded enum নয়, **free-text TOPIC** — যেকোনো niche-এর buyer নিজের topic বানাতে পারে (cosmetics → "skin_type", electronics → "warranty") কোড বদল ছাড়াই। `category_ids[]` দিয়ে optional product-category SCOPE — কোনো template শুধু নির্দিষ্ট category-র (+descendant) product-এ suggest হয়, খালি = global।

### Interface
```ts
{
  question, answer,
  category: string,  // free-text topic; FAQ_DEFAULT_TOPICS = 6 starter suggestion (shelf_life/storage/ingredients/usage/health/general)
  category_ids: ObjectId[],  // optional scope — subtree match (parent tag → sub-categories cascade)
  is_active, created_by
}
```

> placeholder `{{english_slug}}` ইত্যাদি DB-driven (product custom_fields/nutrition/spec label থেকে resolve)। unresolved placeholder থাকলে PDP ওই FAQ auto-hide করে + admin amber warn দেখায়। bootstrap fresh DB-তে ৬টা starter template seed করে (কোনো hardcoded fallback নেই)।

### Endpoints (Base: `/api/v1/faq-template`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` | Cookie | `faq_template_create` |
| GET | `/topics` | — | — | distinct topic suggestion list (DB-driven) |
| GET | `/:id` | — | — |
| PATCH | `/:id` | Cookie | `faq_template_update` |
| DELETE | `/:id` | Cookie | `faq_template_delete` |

---

## 34. dashboard

**File:** [`src/app/dashboard/`](../FruitSnacksBackend/src/app/dashboard/)

### কী কাজ করে
অ্যাডমিন ড্যাশবোর্ডের জন্য aggregate stats — মোট অর্ডার, revenue, customer count, top products ইত্যাদি। সব এখন `dashboard_show` flag-gated (E20 — আগে public ছিল, audit bug)।

### Endpoints (Base: `/api/v1/dashboard`)
| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | Cookie | `dashboard_show` |
| GET | `/widgets/top-selling` | Cookie | `dashboard_show` |
| GET | `/widgets/orders-by-status` | Cookie | `dashboard_show` |

---

## 35. paymentWithdrawList ও withdrow_payment_method

**File:** [`src/app/paymentWithdrawList/`](../FruitSnacksBackend/src/app/paymentWithdrawList/) ও [`src/app/withdrow_payment_method/`](../FruitSnacksBackend/src/app/withdrow_payment_method/)

### কী কাজ করে
দুটো মডিউল মিলে অ্যাডমিন/স্টাফ commission/payout সিস্টেম:

**`paymentmethods` collection** (withdrow_payment_method) — কোন কোন পদ্ধতিতে টাকা withdraw করা যাবে (bKash, Nagad, Bank), প্রতিটির লোগো ও minimum amount।

**`paymentwithdrawlists` collection** (paymentWithdrawList) — admin/staff-এর withdraw request, status (`pending`/`success`/`rejected`), note ও reply।

### Endpoints

**`/api/v1/payment_method`:**
| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | — (public) |
| POST | `/` (multipart) | `payment_method_create` |
| PATCH | `/` (multipart) | `payment_method_update` |
| DELETE | `/` | `payment_method_delete` |
| GET | `/dashboard` | `payment_method_show` |

**`/api/v1/payment_withdraw`:**
| Method | Path | Permission | কাজ |
|--------|------|------------|-----|
| GET | `/` | `payment_withdraw_show` | self withdraw list |
| POST | `/` | `payment_withdraw_create` | new request |
| PATCH | `/` | `payment_withdraw_update` | update |
| DELETE | `/` | `payment_withdraw_delete` | delete |
| GET | `/dashboard` | `payment_withdraw_show` | all withdraws |

> ✅ আগে এই দুটো মডিউলে কোনো `verifyToken` ছিল না (B-3 — যেকেউ access পেত) — এখন proper `payment_method_*` / `payment_withdraw_*` flag।

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

> **Security (GATE 0 F009):** fileFilter এখন image/video/pdf extension whitelist করে (.exe/.html/.svg-XSS block)। হার্ডকোডেড S3 key pair comment থেকে সরানো হয়েছে।

---

# মডিউল গ্রুপ ৭ — নতুন মডিউল (Storefront extras, Marketing, Demo)

> ১৮ মে'র পর যোগ হওয়া মডিউল — variation engine, Sprint 2/3, order unification, go-live ও demo-seed sprint থেকে।

## 39. trustPoint

**File:** [`src/app/trustPoint/`](../FruitSnacksBackend/src/app/trustPoint/) | "আমাদের প্রতিশ্রুতি" trust point — site setting-এর অংশ নয়, নিজস্ব মডিউল।

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| PUT | `/` | Cookie | `trust_point_update` |

## 40. wishlist

**File:** [`src/app/wishlist/`](../FruitSnacksBackend/src/app/wishlist/) | **Collection:** `wishlists` | DB-backed wishlist (cross-device), guest localStorage merge।

| Method | Path | Auth | কাজ |
|--------|------|------|-----|
| GET | `/` | User token | নিজের wishlist |
| POST | `/add` · `/remove` · `/sync` | User token | add / remove / login-merge |
| GET | `/admin` | Cookie (`user_show`) | admin viewer |

## 41. flashsale

**File:** [`src/app/flashsale/`](../FruitSnacksBackend/src/app/flashsale/) | **Collection:** `flashsales` | হোম পেজের flash sale (campaign থেকে আলাদা, নিজস্ব মডিউল)।

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/` | — | — |
| POST | `/` | Cookie | `offer_create` |
| GET | `/active` | — | — (storefront, populated) |
| GET·PATCH·DELETE | `/:_id` | Cookie | `offer_*` |

## 42. payment

**File:** [`src/app/payment/`](../FruitSnacksBackend/src/app/payment/) | অর্ডার পেমেন্ট। **৪ gateway** (Phase C1–C4) একটা `Gateway` registry-র পিছনে: `cod`, `manual_mfs`, `sslcommerz`, `bank_transfer`। `initiatePayment` → `kind: "none"|"instruction"|"redirect"`।

| Method | Path | Auth | কাজ |
|--------|------|------|-----|
| PATCH | `/submit/:order_id` | — | customer trxId submit (status→`pending`, COD/already-paid reject) |
| PATCH | `/submit-with-screenshot/:order_id` (multipart) | — | + deposit slip → `payment_meta.screenshot_url/key` |
| PATCH | `/verify/:order_id` | Cookie (`order_update`) | admin verify; `paid_amount` vs grand → partial/paid; failed → restock |
| POST | `/sslcommerz/{success\|fail\|cancel\|ipn}` | — | SSLCommerz callback |

**SSLCommerz security (C1):** callback body **trust করে না** — `val_id` দিয়ে validator API re-hit করে, শুধু `VALID/VALIDATED`-এ paid করে; returned amount `grand_total ± 0.5`-এ মিলতে হবে (replay-small-payment guard)। success/ipn idempotent (already-paid skip); fail/cancel/IPN-FAILED → `markFailedFromCallback` = `order_status:"cancel"` + `restockOrder` (transaction)। SSLCommerz secret **env থেকে** (settings doc নয়)।

## 43. wallet ও loyalty

**File:** [`src/app/wallet/`](../FruitSnacksBackend/src/app/wallet/), [`src/app/loyalty/`](../FruitSnacksBackend/src/app/loyalty/) | user wallet ও loyalty point ledger।

| Module | Endpoint | কাজ |
|--------|----------|-----|
| wallet | `POST /wallet/adjust` (`user_update`) · `GET /wallet/history` (user) · `/history/admin` (`user_show`) | credit/debit + ledger |
| loyalty | `POST /loyalty/adjust` · `GET /loyalty/history` · `/history/admin` | একই প্যাটার্ন |

## 44. warehouse

**File:** [`src/app/warehouse/`](../FruitSnacksBackend/src/app/warehouse/) | একাধিক warehouse (courier weight/origin)। CRUD `setting_show`/`setting_update`; `/default` public।

## 45. abandonedCart

**File:** [`src/app/abandonedCart/`](../FruitSnacksBackend/src/app/abandonedCart/) | checkout অসম্পূর্ণ ছাড়লে capture (recovery campaign)। `POST /capture` (public) · `GET /` (`order_show`)।

## 46. productFeed

**File:** [`src/app/productFeed/`](../FruitSnacksBackend/src/app/productFeed/) | `GET /product-feed/feed.xml` — Meta/Google catalog feed (public XML)।

## 47. siteFaq

**File:** [`src/app/siteFaq/`](../FruitSnacksBackend/src/app/siteFaq/) | **Collection:** `sitefaqs` | হোম পেজের সাইট-ব্যাপী FAQ (product FAQ নয়, Track D)।

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| GET | `/active` | — | — (storefront) |
| GET | `/` | Cookie | `site_faq_show` |
| POST | `/` | Cookie | `site_faq_post` |
| PATCH·DELETE | `/:id` | Cookie | `site_faq_update`/`delete` |

## 48. newsletterSubscriber

**File:** [`src/app/newsletterSubscriber/`](../FruitSnacksBackend/src/app/newsletterSubscriber/) | **Collection:** `newslettersubscribers` | newsletter subscribe (Track D)। Interface: `{ contact, channel: "email"|"sms"|"both", source, status, subscribed_at }`।

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/subscribe` | — | — (rate-limited 10/hr/IP) |
| GET | `/` | Cookie | `newsletter_show` |
| GET | `/export` | Cookie | `newsletter_export` (CSV) |
| DELETE | `/:id` | Cookie | `newsletter_delete` |

## 49. demo

**File:** [`src/app/demo/`](../FruitSnacksBackend/src/app/demo/) | demo-seed catalog clear (count + cascade delete)।

| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| GET | `/count` | Cookie | `demo_data_clear` | clear করলে কী মুছবে তার preview |
| DELETE | `/clear` | Cookie | `demo_data_clear` | flag-based cascade delete |

> **`is_demo` flag** category/attribute/brand/banner/slider/theme model-এ আছে (doc-এর interface block-গুলোতে আলাদা করে লেখা নেই — demo-seed marker)। ৫টা controller-এ (attribute/banner/category/product/slider) [`stripDemoFlag.ts`](../FruitSnacksBackend/src/helpers/stripDemoFlag.ts) দিয়ে create/update payload থেকে stripped — API দিয়ে কখনো সেট হয় না, ফলে client-এর real row কখনো মোছে না। demo review `source:"demo_seed"` দিয়ে clear হয় (client-এর real seeded review বাঁচে)। Clear demo theme + S3 `demo/food/` image রাখে। seed/clear: `npm run seed:demo` / Admin → Demo Data।

---

# Cross-Module Map

## ObjectId Reference Graph

```
admins ←── (publisher/updated_by) প্রায় সব মডিউল
roles ←── admins
users ←── orders, reviews, questions, carts, wishlists, wallets, loyalty
products ←── orderproducts, variations, reviews, questions, campaigns.campaign_products, offers.offer_products
categories ←── categories.parent_id (self-ref nested tree), products.category_id + category_path
themes ←── products.theme_id, categories.default_theme_id
campaigns ←── products.product_campaign_id, orderproducts.campaign_id
coupons ←── orders.coupon_id
offers ←── orders.offer_id (order_type:"offer" — পুরোনো offerorders merge হয়েছে)
```

## Permission Flag → Module Map

প্রতিটি permission flag কোন মডিউলকে রক্ষা করে:

| Permission | Module |
|------------|--------|
| `category_*` | category (nested tree; sub/child/specification flag orphan — কোনো route ব্যবহার করে না) |
| `brand_*` | brand |
| `attribute_*` | attribute |
| `attribute_*` | attribute (variation + filter; পুরোনো specification merge) |
| `product_*` | product, variation (variation এ `product_update`) |
| `order_show` / `order_update` | order, courier, fraud (show), payment (verify), abandonedCart |
| `offer_*` | offer, flashsale (offer order এখন order মডিউলে — offer_order_* flag বাদ) |
| `campaign_*` | campaign |
| `coupon_*` | coupon |
| `banner_*` / `slider_*` | banner, slider |
| `review_*` / `question_*` | review, question |
| `user_*` | adminRegLog, user, wallet/loyalty (adjust=`user_update`, viewer=`user_show`), wishlist (admin) |
| `role_*` | role |
| `site_setting_update` | setting, authentication |
| `setting_secrets_update` | setting (secrets/test-email) |
| `setting_show` / `setting_update` | warehouse |
| `page_seo_*` | pageSeo |
| `theme_*` | theme |
| `faq_template_*` | faq_template |
| `trust_point_update` | trustPoint |
| `site_faq_*` | siteFaq |
| `newsletter_show/delete/export` | newsletterSubscriber |
| `demo_data_clear` | demo |
| `order_create_admin` | order (POS / admin create order) |
| `review_seed_bulk` / `review_seed_manual` | review (seed reviews) |
| `dashboard_show` | dashboard (auth gate) |

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
  → gates: min_order_amount, verify_phone_on_order (DB write-এর আগে)
  → recomputeOrderTotals (SERVER price authority — client price উপেক্ষা):
      per-line resolve: base/variation → flash → campaign → offer → coupon/BOGO
      + loyalty redeem + per-line VAT + zone-aware shipping recompute
      grand = sub_total − discount + vat_amount + shipping_cost
  → Mongoose session transaction:
      orders create  (snapshot name/image, discount_source, vat per line)
      orderproducts create (per line item)
      atomic stock decrement (conditional $gte → 409 if oversold; maintain_stock:false বাদ)
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
PATHAO_STORE_ID=            # required in send payload — pathao.service.ts reads this

# Steadfast — ⚠️ code reads these EXACT names (steadfast.service.ts), NOT *_CLIENT_*
STEADFAST_API_KEY=
STEADFAST_SECRET_KEY=

# FraudBD
FRAUDBD_API_KEY=

# Security / resale (GATE 0)
CORS_ORIGINS=                # comma-separated https origins (F007)
STEADFAST_WEBHOOK_SECRET=    # F008 — courier dashboard-এ register
PATHAO_WEBHOOK_SECRET=

# Handover bootstrap (npm run bootstrap)
SUPER_ADMIN_PHONE=           # E.164 (+880...) — login form match
SUPER_ADMIN_PASSWORD=        # demo fallback: 01700000000 / 123456
```

---

# Known Issues / Notes

> ✅ পুরোনো Known-Issues #1/#2/#3 (role flag mapping, supplier empty-flag, paymentWithdraw no-auth) সব **FIXED** — নিচে আর তালিকাভুক্ত নয়।

1. **`.env` credentials** — পুরোনো deployment-এর (Mongo URI, S3, Pathao/Steadfast) — buyer replace করবে। go-live-এ chat-এ exposed creds **rotate** করতে হবে
2. **Backup files** — ` copy.ts` backup ফাইল delete করা হয়েছে (আর নেই)
3. **Floating-asset section enum** food-hardcoded — PDP section registry এলে `pdp_section_array` থেকে derive করতে হবে (multi-niche debt)
4. **Settings 206-field monolith** — security 2-tier separated, কিন্তু ৪-collection split future/SaaS (`docs/_ai/SETTINGS_ARCH_DEBT.md`)

### 🐛 Live code bugs (deep-audit 2026-06-16/17 — বিস্তারিত `docs/_ai/BACKEND_DEEP_AUDIT_FINDINGS.md`)
**✅ FIXED (tsc 0):**
- **B1 warehouse 403** (`setting_*` flag missing) → `site_setting_update`।
- **B2 getme IDOR + double-hash** → verifyUserToken + self-update allowlist।
- **B3 coupon per-person cap dead code** → `result?.coupon_id`→`result?._id`।
- **B5 flashsale default** `"active"`→`"in-active"`।
- **B7 campaign PATCH** → field allowlist যোগ।
- **Pathao bulk-send 0.5kg** → `variation_weight_grams` থেকে compute।
- **abandonedCart comment** (invoice_id→phone) + **cron** `{ timezone: "UTC" }` + **pathaoStatusMap dedup**।

**⏳ OPEN / by-design:**
- **B4** offer `offer_product_quantity` ("buy N") enforce হয় না — owner সিদ্ধান্ত: **display-only রাখা** (কোড change নেই)। Future: client চাইলে BE+FE min-qty gate (edge-audit সহ)।
- ⚠️ `specification_*`/`sub_category_*`/`child_category_*`/`customer_*` orphan role flags (dead, কোনো route ব্যবহার করে না)।
