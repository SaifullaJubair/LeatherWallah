# Sample Documentation Format (Revised)

> এটি একটি **স্যাম্পল** — Product মডিউলকে নেওয়া হয়েছে কারণ এটি সবচেয়ে জটিল।
> ফরম্যাট পছন্দ হলে নিশ্চিত করুন, তারপর ব্যাকএন্ডের বাকি ৩৬টি মডিউল এবং অ্যাডমিন/ফ্রন্টএন্ড একই ফরম্যাটে তৈরি করা হবে।

---

## Product Module

**File location:** [FruitSnacksBackend/src/app/product/](../FruitSnacksBackend/src/app/product/)

### কী কাজ করে

Product মডিউল পুরো ই-কমার্স প্ল্যাটফর্মের সবচেয়ে কেন্দ্রীয় মডিউল। প্রতিটি প্রোডাক্টের নাম, দাম, স্টক, ক্যাটাগরি, ছবি, ভিডিও, থিম, নিউট্রিশন তথ্য, FAQ — সবকিছু এই কালেকশনে সংরক্ষিত হয়। ফ্রন্টএন্ডের প্রোডাক্ট পেজ, অ্যাডমিনের প্রোডাক্ট ম্যানেজমেন্ট, কার্ট, অর্ডার, রিভিউ — সব এই মডিউলের ডেটার উপর নির্ভরশীল।

---

### ১. Interface (TypeScript Shape)

**File:** [`product.interface.ts`](../FruitSnacksBackend/src/app/product/product.interface.ts)

মূল ইন্টারফেস `IProductInterface`-এর গুরুত্বপূর্ণ ফিল্ডগুলো:

```ts
{
  product_name: string;              // প্রোডাক্টের নাম
  product_slug: string;              // URL-friendly নাম, ইউনিক
  product_slug_history: string[];    // পুরোনো স্ল্যাগ — SEO 301 রিডাইরেক্টের জন্য
  product_status: "active" | "in-active";  // সফট ডিলিট প্যাটার্ন
  category_id, sub_category_id, child_category_id;  // ৩-লেভেল ক্যাটাগরি রেফারেন্স
  brand_id, product_supplier_id, product_publisher_id;
  product_price, product_buying_price, product_discount_price;
  product_quantity, product_alert_quantity;  // স্টক ও কম-স্টক অ্যালার্ট
  is_variation: boolean;             // true হলে variations কালেকশন থেকে দাম/স্টক আসে
  main_image, main_video, other_images[];  // S3 URL + S3 key জোড়া
  product_campaign_id;               // অ্যাকটিভ ক্যাম্পেইন থাকলে রেফারেন্স
  trending_product: boolean;

  // Dynamic Product Page System
  theme_id;                          // প্রতিটি প্রোডাক্টের আলাদা থিম
  theme_overrides;                   // থিমের নির্দিষ্ট ফিল্ড override
  short_description, badge_text;     // হিরো সেকশন
  short_features[], process_steps[]; // আইকন + টেক্সট সারি
  benefits[], use_cases[];           // বুলেট পয়েন্ট + আইকন সারি
  nutrition;                         // ক্যালরি, প্রোটিন, ভিটামিন ইত্যাদি
  faqs[];                            // প্রোডাক্ট-নির্দিষ্ট প্রশ্নোত্তর
  og_image, og_title, og_description;  // সোশ্যাল মিডিয়া শেয়ার
}
```

**Searchable fields:** `product_name`, `product_slug`, `description`, `short_description`, `badge_text`, `meta_*` — অ্যাডমিন ড্যাশবোর্ড সার্চ এই ফিল্ডগুলোতে regex চালায়।

---

### ২. Database Schema

**Collection:** `products`
**File:** [`product.model.ts`](../FruitSnacksBackend/src/app/product/product.model.ts)

স্কিমার গুরুত্বপূর্ণ বৈশিষ্ট্য:

- `timestamps: true` — `createdAt` ও `updatedAt` অটোমেটিক
- `product_slug` ফিল্ড **unique index**
- `theme_id` ফিল্ড **indexed** (থিম-ভিত্তিক কুয়েরি দ্রুত করার জন্য)
- ৩-লেভেল ক্যাটাগরি ফিল্ডগুলো ObjectId রেফারেন্স — `populate()` করে ফেচ করা হয়
- `nutrition` ও `theme_overrides` সাব-ডকুমেন্টে `_id: false` — অপ্রয়োজনীয় ObjectId জেনারেট হয় না

**Mongoose lifecycle hooks (অটো-লজিক):**

| Hook | কী করে |
|------|--------|
| `post("save")` | নতুন প্রোডাক্টে `theme_id` থাকলে `themes.used_in_products` +১ |
| `post("findOneAndDelete")` | প্রোডাক্ট ডিলিট হলে `themes.used_in_products` -১ |
| `post("deleteOne")` | একই — কাউন্টার -১ |
| `pre/post("findOneAndUpdate")` | `theme_id` পরিবর্তন হলে পুরোনো থিম -১, নতুন থিম +১ |

**কেন:** `themes` কালেকশনের `is_deletable` ফ্ল্যাগ `used_in_products` কাউন্টারের উপর নির্ভরশীল — কোনো প্রোডাক্ট ব্যবহার করছে এমন থিম অ্যাডমিন ডিলিট করতে পারবে না।

---

### ৩. Pipeline / Populate Strategy

**Public product detail (`GET /:product_slug`):**

```
ProductModel.findOne({ product_slug })
  .populate("category_id")          // top-level category
  .populate("sub_category_id")      // ২য় লেভেল
  .populate("child_category_id")    // ৩য় লেভেল
  .populate("brand_id")
  .populate("theme_id")             // ফুল থিম অবজেক্ট
  .populate("product_campaign_id")  // অ্যাকটিভ ক্যাম্পেইন
```

এরপর সার্ভিস লেয়ারে চেক হয়: ৩-লেভেল ক্যাটাগরির সবগুলোর `status: "active"` কিনা — যেকোনো একটি ইন-অ্যাকটিভ হলে error থ্রো হয়।

`is_variation: true` হলে আলাদাভাবে `VariationModel.find({ product_id })` কল হয় ও রেসপন্সে যোগ হয়।

**Dashboard product list (`GET /dashboard`):**

`product.services.ts`-এ Mongoose aggregation pipeline — search regex, category filter, pagination (`skip`/`limit`), sort, কাউন্ট সব এক aggregation-এ।

**Trending / Popular / Related / Just-For-You:**

আলাদা সার্ভিস ফাংশন, প্রতিটি নির্দিষ্ট ক্রাইটেরিয়া দিয়ে ফিল্টার করে (যেমন `trending_product: true`, একই `brand_id`, অর্ডার কাউন্ট দিয়ে sort)।

---

### ৪. API Endpoints

**Base URL:** `/api/v1/product`
**File:** [`product.routes.ts`](../FruitSnacksBackend/src/app/product/product.routes.ts)

| Method | Path | Auth | Permission | কাজ |
|--------|------|------|------------|-----|
| POST | `/` | Cookie | `product_create` | নতুন প্রোডাক্ট তৈরি (multipart, ছবি/ভিডিও সহ) |
| PATCH | `/` | Cookie | `product_update` | প্রোডাক্ট আপডেট |
| DELETE | `/` | Cookie | `product_delete` | প্রোডাক্ট ডিলিট |
| POST | `/check_product_barcode` | — | — | তৈরির আগে বারকোড ডুপ্লিকেট চেক |
| POST | `/check_product_barcode_when_update` | — | — | আপডেটের সময় বারকোড চেক (বর্তমান প্রোডাক্ট বাদ দিয়ে) |
| GET | `/trending_product` | — | — | ট্রেন্ডিং প্রোডাক্ট তালিকা |
| GET | `/brand_match_product` | — | — | ব্র্যান্ড-ভিত্তিক প্রোডাক্ট |
| GET | `/popular_product` | — | — | জনপ্রিয় প্রোডাক্ট (অর্ডার কাউন্ট অনুসারে) |
| GET | `/just_for_you_product` | — | — | পার্সোনালাইজড প্রোডাক্ট |
| GET | `/related_product` | — | — | একই ক্যাটাগরির অন্যান্য প্রোডাক্ট |
| GET | `/ecommerce_choice_product` | — | — | কিউরেটেড লিস্ট |
| GET | `/dashboard` | Cookie | `product_show` | অ্যাডমিন প্রোডাক্ট তালিকা (পেজিনেশন, সার্চ, ফিল্টার) |
| GET | `/dashboard/:_id` | — | — | অ্যাডমিন সিঙ্গেল প্রোডাক্ট ডিটেইল |
| GET | `/cart_product?ids=` | — | — | একাধিক প্রোডাক্ট কার্টের জন্য |
| GET | `/compare_product?ids=` | — | — | কম্পেয়ার পেজের জন্য একাধিক প্রোডাক্ট |
| GET | `/:product_slug` | — | — | পাবলিক প্রোডাক্ট ডিটেইল পেজ |

**Response format (সব এন্ডপয়েন্টে একই):**
```
{ statusCode, success, message, data, totalData? }
```
`sendResponse()` হেল্পার থেকে আসে। Error হলে `{ success: false, message, errorMessages: [...] }`।

---

### ৫. Connections (অন্যান্য মডিউলের সাথে সম্পর্ক)

**যেসব মডিউলের উপর নির্ভরশীল (inputs):**
- `categories`, `subcategories`, `childcategories` — ৩-লেভেল রেফারেন্স, সবগুলোর `status: "active"` চেক হয়
- `brands` — অপশনাল রেফারেন্স
- `admins` — `product_publisher_id`, `product_updated_by`
- `suppliers` — অপশনাল সাপ্লায়ার
- `themes` — `theme_id` রেফারেন্স + কাউন্টার সিঙ্ক
- `campaigns` — `product_campaign_id` সেট থাকলে ডিসকাউন্ট প্রযোজ্য

**যেসব মডিউল এই প্রোডাক্ট ব্যবহার করে (outputs):**
- `variations` — `product_id` দিয়ে রেফারেন্স
- `cart` — কার্ট আইটেম প্রোডাক্ট আইডি রাখে
- `orders` / `orderProducts` — অর্ডার লাইন আইটেম
- `reviews` — প্রোডাক্ট রিভিউ
- `productFilter` — ফিল্টার API
- অ্যাডমিন প্রোডাক্ট পেজ, ফ্রন্টএন্ড প্রোডাক্ট ডিটেইল/লিস্টিং/সার্চ

**Cross-module side effects:**
- প্রোডাক্ট save/delete → `themes.used_in_products` কাউন্টার অটো-আপডেট (স্কিমা হুক)
- ক্যাম্পেইন এক্সপায়ার ক্রন (২৩:৫৫ UTC) → মিলে যাওয়া প্রোডাক্টের `product_campaign_id` $unset হয়

---

### ৬. গুরুত্বপূর্ণ বিজনেস রুল

1. **৩-লেভেল ক্যাটাগরি active check** — প্রোডাক্ট ডিটেইল রিটার্নের আগে category, sub_category, child_category সবগুলোর `status: "active"` হতে হবে
2. **Slug history** — slug পরিবর্তন হলে পুরোনো slug `product_slug_history` array-তে push হয়, ফ্রন্টএন্ডে old URL হিট হলে 301 রিডাইরেক্ট সম্ভব
3. **Variation logic** — `is_variation: true` হলে প্রোডাক্টের নিজস্ব price/quantity ignore হয়, variations কালেকশন থেকে আসে
4. **ডিসকাউন্ট প্রায়োরিটি** — flash sale > campaign discount > `product_discount_price` > `product_price`
5. **Image cleanup** — আপডেটে নতুন ছবি দিলে পুরোনো ছবি S3 থেকে `deleteFromSpaces()` দিয়ে ডিলিট হয়
6. **Permission required** — create/update/delete করতে অ্যাডমিনের role-এ সংশ্লিষ্ট permission flag `true` হতে হবে

---

### ৭. মডিউলের ফাইল তালিকা

| File | বিবরণ |
|------|--------|
| `product.interface.ts` | TypeScript ইন্টারফেস, sub-interfaces, searchable fields |
| `product.model.ts` | Mongoose schema + ৪টি lifecycle hook (theme counter) |
| `product.services.ts` | বিজনেস লজিক — DB queries, aggregations (~৮০০+ লাইন) |
| `product.controllers.ts` | HTTP handlers — request parse, service call, sendResponse |
| `product.routes.ts` | Express রাউটার + auth middleware |
| `product.allId.ts` | একাধিক প্রোডাক্ট ID দিয়ে fetch করার হেল্পার |
| `product.interface copy.ts` | ⚠️ পুরোনো ব্যাকআপ ফাইল — উপেক্ষা করুন |

---

## 🤔 ফরম্যাট কনফার্মেশন

এই ফরম্যাট পছন্দ হলো?

**আগের থেকে কী পরিবর্তন:**
- ✅ Banglish সম্পূর্ণ বাদ, পুরো বাংলা
- ✅ Request/Response JSON examples বাদ (response format শুধু এক লাইনে উল্লেখ)
- ✅ Schema টেবিল ছোট — শুধু গুরুত্বপূর্ণ ফিল্ড + ক্যাটেগরি অনুযায়ী
- ✅ Interface, Pipeline/Populate, Database hooks আলাদা সেকশন
- ✅ মোট দৈর্ঘ্য আগের প্রায় অর্ধেক

**আপনার মতামত জানান:**
1. এই দৈর্ঘ্য ঠিক আছে নাকি আরও কমাতে হবে?
2. কোনো সেকশন বাদ দিতে চান (যেমন Business Rules, Connections)?
3. কোনো কিছু যোগ করতে চান?
4. বাংলা ভাষার মান ঠিক আছে?

কনফার্ম করলে একই ফরম্যাটে ব্যাকএন্ডের বাকি ৩৬ মডিউল `docs/backend.md`-এ লিখব।
