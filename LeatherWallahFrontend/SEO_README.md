# SEO Setup Documentation

## Overview

এই project এ Next.js App Router এর `generateMetadata` API ব্যবহার করে SEO implement করা হয়েছে।

**দুই ধরনের page আছে:**

- **Static pages** → `buildPageMeta()` use করে, DB থেকে dynamic title/description আসে, fallback হিসেবে `pageSeo.js` আছে
- **Dynamic pages** → নিজেই API call করে meta বানায় (product, category, brand)

---

## File Structure

```
src/
├── app/
│   ├── layout.js                          # Root layout — global meta fallback + Organization JSON-LD
│   ├── sitemap.js                         # Auto-generated /sitemap.xml
│   ├── robots.js                          # Auto-generated /robots.txt
│   └── (frontend)/
│       ├── page.js                        # Home — buildPageMeta("home")
│       ├── about-us/page.jsx
│       ├── all-products/page.jsx          # search param থাকলে noindex
│       ├── all-trending-products/page.jsx
│       ├── cancel-policy/page.jsx
│       ├── cart/page.jsx                  # noindex
│       ├── category/[...slug]/page.js     # Dynamic — API থেকে category name
│       ├── change-password/page.jsx       # noindex
│       ├── checkout/page.jsx              # noindex
│       ├── compare/page.jsx               # noindex
│       ├── latest-product/page.jsx
│       ├── new-arrival/page.jsx
│       ├── offer/page.jsx                 # noindex
│       ├── privacy-policy/page.jsx
│       ├── products/[slug]/page.js        # Dynamic — API + Product JSON-LD Schema
│       ├── refund-policy/page.jsx
│       ├── return-policy/page.jsx
│       ├── shipping-information/page.jsx
│       ├── terms-condition/page.jsx
│       ├── top-product/page.jsx
│       ├── verify/page.jsx                # noindex
│       └── wishlist/page.jsx              # noindex
├── (auth)/
│   ├── forget-password/page.jsx           # noindex
│   ├── sign-in/page.jsx                   # noindex
│   └── sign-up/page.jsx                   # noindex
└── components/
    ├── lib/
    │   ├── getSeoConfig.js                # DB (setting model) থেকে global SEO config
    │   ├── buildPageMeta.js               # Static page এর reusable meta builder
    │   ├── getServerSettingData.js        # Setting API fetch (6hr revalidate)
    │   └── getPageSeo.js                  # Page SEO API fetch (1hr revalidate)
    └── utils/
        └── pageSeo.js                     # সব static page এর title/description fallback
```

---

## Architecture — কিভাবে কাজ করে

### Static Page Flow

```
Admin Panel → DB (PageSeo model)
                    ↓
            getPageSeoData(page_key)    ← 1hr cache
                    ↓
            buildPageMeta("page_key")
                    ↓
            generateMetadata()          ← Next.js
                    ↓
            pageSeo.js fallback         ← DB তে না থাকলে
```

### Dynamic Page Flow

```
URL params (slug/id)
        ↓
API fetch (product/category/brand data)
        ↓
generateMetadata() — নিজেই meta বানায়
        ↓
JSON-LD Schema inject (product page এ)
```

### Global Config Flow

```
Admin Panel → DB (Setting model)
                    ↓
            getServerSettingData()      ← 6hr cache
                    ↓
            getSeoConfig()
                    ↓
    layout.js / buildPageMeta / dynamic pages
```

---

## সব SEO File এর কাজ

### `getSeoConfig.js`

DB এর `setting` model থেকে global SEO data আনে। সব page এ use হয়।

| Return করে            | কোথা থেকে আসে                        |
| --------------------- | ------------------------------------ |
| `siteName`            | `setting.title`                      |
| `seoTitle`            | `setting.seo_title`                  |
| `seoDescription`      | `setting.seo_description`            |
| `seoKeywords`         | `setting.seo_keywords` (comma split) |
| `logo`                | `setting.logo`                       |
| `favicon`             | `setting.favicon`                    |
| `siteUrl`             | `SITE_URL` env                       |
| `joinUrl(base, path)` | helper function                      |

### `buildPageMeta(page_key)`

String key নেয় (যেমন `"aboutUs"`), DB + fallback মিলিয়ে পুরো meta object return করে।

**⚠️ Important:** সবসময় string key pass করতে হবে, object না।

```js
// ✅ সঠিক
buildPageMeta("aboutUs");

// ❌ ভুল
buildPageMeta(PAGE_SEO.aboutUs);
```

### `pageSeo.js`

DB তে data না থাকলে এটা fallback হিসেবে কাজ করে। নতুন page যোগ করলে এখানেও entry লাগবে।

### `getPageSeo.js`

Backend `/page-seo/:key` endpoint থেকে per-page SEO data আনে। `revalidate: 3600` (1 ঘণ্টা)।

---

## Root Layout (`layout.js`)

| Property               | কারণ                                         |
| ---------------------- | -------------------------------------------- | ---------------------------- |
| `metadataBase`         | Relative image URL → full URL                |
| `title.template`       | `"Page Title                                 | Site Name"` format সব page এ |
| `description`          | generateMetadata নেই এমন page এর fallback    |
| `keywords`             | Admin থেকে set করা keywords                  |
| `openGraph`            | Social share fallback                        |
| `twitter`              | Twitter/X share fallback                     |
| `verification.google`  | Search Console verify                        |
| `icons.apple`          | iPhone home screen icon                      |
| `formatDetection`      | Phone/email auto-link বন্ধ                   |
| `Organization JSON-LD` | Google কে business info, social links জানায় |

---

## Dynamic Pages — Pattern

### Product Page (`/products/[slug]`)

- Product API থেকে data fetch করে
- `meta_description` DB তে থাকলে সেটা, না থাকলে auto-generate
- **Product JSON-LD Schema** — Google এ price, rating rich result
- Fallback image: product image না থাকলে site logo

### Category Page (`/category/[...slug]`)

- `getFilterHeadData` API থেকে category name আনে
- Subcategory থাকলে: `"SubCategory – Category"` format
- Slug থেকে readable name বানানোর fallback আছে

### Brand Pages (নতুন pattern — দেখো নিচে)

---

## Private/NoIndex Pages

এই pages Google index করবে না (`robots: { index: false }`):

```
/sign-in, /sign-up, /cart, /wishlist
/verify, /change-password, /forget-password
/checkout, /orders, /offer-orders, /user-profile
/compare, /offer
```

---

## Sitemap (`/sitemap.xml`)

| Section                                   | `lastModified`        | `changeFrequency` | `priority` |
| ----------------------------------------- | --------------------- | ----------------- | ---------- |
| Home, all-products, trending, new-arrival | `new Date()`          | daily             | 0.9–1.0    |
| about-us, policies                        | `LAUNCH_DATE` (fixed) | monthly/yearly    | 0.3–0.5    |
| Products                                  | `product.updatedAt`   | weekly            | 0.8        |
| Categories                                | `category.updatedAt`  | weekly            | 0.7        |

**⚠️ Note:** Static policy pages এ `new Date()` দিলে Google mislead হয়, তাই fixed `LAUNCH_DATE` use করা হয়।

---

## Robots (`/robots.txt`)

Disallow করা আছে:

```
/user-profile/, /orders/, /order-success/, /cart/
/checkout/, /verify/, /change-password/, /forget-password/
/sign-in/, /sign-up/, /offer/, /shop/, /compare/, /wishlist/

/*?search=*
/*?page=*
/*?sort=*
/*?filter=*
```

---

---

# নতুন Page যোগ করার Checklist

## Case 1: Static Public Page

যেমন: `/faq`, `/contact-us`, `/size-guide`

### Step 1 — `pageSeo.js` এ entry যোগ করো

```js
// src/components/utils/pageSeo.js
faq: {
  title: "FAQ | Frequently Asked Questions",
  description: "আমাদের সচরাচর জিজ্ঞাসিত প্রশ্নের উত্তর।",
  path: "faq",
},
```

### Step 2 — Backend seed data যোগ করো

```ts
// pageSeo.services.ts → DEFAULT_PAGES array
{
  page_key: "faq",
  path: "faq",
  title: "FAQ | Frequently Asked Questions",
  description: "আমাদের সচরাচর জিজ্ঞাসিত প্রশ্নের উত্তর।",
  noIndex: false,
},
```

তারপর `/page-seo/seed` endpoint call করো।

### Step 3 — Page এ `generateMetadata` যোগ করো

```js
// src/app/(frontend)/faq/page.jsx
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("faq"); // ← string key, object না
}
```

### Step 4 — `sitemap.js` এ যোগ করো

```js
{
  url: `${SITE_URL}/faq`,
  lastModified: LAUNCH_DATE,  // static page → fixed date
  changeFrequency: "monthly",
  priority: 0.5,
},
```

---

## Case 2: Static Private/NoIndex Page

যেমন: `/order-tracking`, `/user-profile`

### Step 1 — `pageSeo.js` এ entry যোগ করো

```js
orderTracking: {
  title: "Track Your Order",
  description: "",
  path: "order-tracking",
  noIndex: true,  // ← এটা অবশ্যই দিতে হবে
},
```

### Step 2 — Backend seed data যোগ করো

```ts
{
  page_key: "orderTracking",
  path: "order-tracking",
  title: "Track Your Order",
  description: "",
  noIndex: true,
},
```

### Step 3 — Page এ `generateMetadata` যোগ করো

```js
export async function generateMetadata() {
  return buildPageMeta("orderTracking");
  // noIndex: true থাকলে buildPageMeta নিজেই robots: { index: false } return করবে
}
```

### Step 4 — `robots.js` এ disallow যোগ করো

```js
disallow: [
  // ... existing
  "/order-tracking/",
],
```

**⚠️ Sitemap এ যোগ করবে না** — private page sitemap এ থাকার দরকার নেই।

---

## Case 3: Dynamic Page — List (e.g., All Brands)

যেমন: `/brand-product` — সব brand card দেখায়

### Step 1 — `pageSeo.js` এ entry যোগ করো

```js
allBrands: {
  title: "All Brands | Genuine Leather Brands in Bangladesh",
  description: "বাংলাদেশের সেরা লেদার ব্র্যান্ডগুলো এক জায়গায়। সব ব্র্যান্ডের কালেকশন দেখুন।",
  path: "brand-product",
},
```

### Step 2 — Backend seed data যোগ করো

```ts
{
  page_key: "allBrands",
  path: "brand-product",
  title: "All Brands | Genuine Leather Brands in Bangladesh",
  description: "বাংলাদেশের সেরা লেদার ব্র্যান্ডগুলো এক জায়গায়।",
  noIndex: false,
},
```

### Step 3 — Page এ `generateMetadata` যোগ করো

```js
// src/app/(frontend)/brand-product/page.jsx
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("allBrands");
}
```

### Step 4 — `sitemap.js` এ যোগ করো

```js
// Static entry
{
  url: `${SITE_URL}/brand-product`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.8,
},
```

---

## Case 4: Dynamic Page — Single Item (e.g., Single Brand)

যেমন: `/brand-product/[id]` — একটা brand এর সব product

### Step 1 — `pageSeo.js` এ কিছু লাগবে না

Dynamic page, per-item SEO API থেকে আসে।

### Step 2 — Backend seed এ কিছু লাগবে না

### Step 3 — Page এ dynamic `generateMetadata` লিখো

```js
// src/app/(frontend)/brand-product/[id]/page.jsx
import { getSeoConfig } from "@/components/lib/getSeoConfig";
import { BASE_URL } from "@/components/utils/baseURL";

export async function generateMetadata({ params }) {
  const { id } = params;

  const [seo, res] = await Promise.all([
    getSeoConfig(),
    fetch(`${BASE_URL}/brand/${id}`, { next: { revalidate: 3600 } }),
  ]);

  if (!res.ok) {
    return {
      title: `Brand Not Found | ${seo.siteName}`,
      robots: { index: false },
    };
  }

  const data = await res.json();
  const brand = data?.data;
  const brandImage = brand?.brand_image || seo.logo;
  const description = `${brand?.brand_name} এর সব লেদার প্রোডাক্ট দেখুন। Genuine leather, premium quality। Cash on delivery সারাদেশে।`;

  return {
    title: `${brand?.brand_name} – All Products`,
    description,
    alternates: {
      canonical: seo.joinUrl(seo.siteUrl, `brand-product/${id}`),
    },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      siteName: seo.siteName,
      url: seo.joinUrl(seo.siteUrl, `brand-product/${id}`),
      title: `${brand?.brand_name} – All Products`,
      description,
      images: [
        { url: brandImage, width: 800, height: 800, alt: brand?.brand_name },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand?.brand_name} – All Products`,
      description,
      images: [brandImage],
    },
  };
}
```

### Step 4 — `sitemap.js` এ dynamic brand pages যোগ করো

```js
// Brand pages
let brandPages = [];
try {
  const res = await fetch(`${API_URL}/brand?limit=500`, {
    next: { revalidate: 3600 * 24 },
  });
  const data = await res.json();
  brandPages = (data?.data || []).map((b) => ({
    url: `${SITE_URL}/brand-product/${b._id}`,
    lastModified: new Date(b.updatedAt || b.createdAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
} catch (e) {
  console.error("Sitemap: brand fetch failed", e);
}

// return এ যোগ করো
return [...staticPages, ...productPages, ...categoryPages, ...brandPages];
```

---

## Quick Reference — কোন Case এ কী করতে হবে

| করণীয়                 | Static Public |   Static Private   |     Dynamic List      |  Dynamic Single   |
| ---------------------- | :-----------: | :----------------: | :-------------------: | :---------------: |
| `pageSeo.js` এ entry   |      ✅       | ✅ (noIndex: true) |          ✅           |        ❌         |
| Backend seed           |      ✅       |         ✅         |          ✅           |        ❌         |
| `buildPageMeta()` use  |      ✅       |         ✅         |          ✅           |        ❌         |
| নিজে API call করে meta |      ❌       |         ❌         |          ❌           |        ✅         |
| `sitemap.js` এ যোগ     |      ✅       |         ❌         | ✅ (static + dynamic) | ✅ (dynamic loop) |
| `robots.js` disallow   |      ❌       |         ✅         |          ❌           |        ❌         |

---

## Admin Panel থেকে কী Control করা যায়

### Global (Site Setting)

| Field                   | Effect                           |
| ----------------------- | -------------------------------- |
| `seo_title`             | Root layout title fallback       |
| `seo_description`       | Root layout description fallback |
| `seo_keywords`          | Meta keywords সব page এ          |
| `logo`                  | OG image fallback                |
| `facebook`, `instagram` | Organization JSON-LD sameAs      |

### Per-Page (Page SEO)

Admin panel → Page SEO section থেকে যেকোনো static page এর title ও description update করা যাবে।
পরিবর্তন 1 ঘণ্টার মধ্যে সব page এ reflect হবে (`revalidate: 3600`)।

---

## Deploy Checklist

- [ ] `.env` এ `NEXT_PUBLIC_GOOGLE_VERIFICATION` — Search Console verification code
- [ ] `/public/apple-touch-icon.png` — 180×180px PNG
- [ ] `/public/logo.jpg` — OG image fallback (1200×630px ideal)
- [ ] Admin panel → Site Setting → SEO Title, SEO Description, SEO Keywords fill করো
- [ ] `/page-seo/seed` endpoint একবার call করো — default data DB তে যাবে
- [ ] `sitemap.js` এ `LAUNCH_DATE` সঠিক project launch date দাও
- [ ] Google Search Console এ sitemap submit করো: `https://yourdomain.com/sitemap.xml`
- [ ] `layout.js` এ Organization JSON-LD এ YouTube/TikTok link থাকলে `sameAs` array এ যোগ করো

---

## Common Mistakes

```js
// ❌ buildPageMeta এ object pass করা
buildPageMeta(PAGE_SEO.aboutUs);

// ✅ string key pass করতে হবে
buildPageMeta("aboutUs");
```

```js
// ❌ getPageSeoData এ বড় revalidate
next: {
  revalidate: 3600000;
} // ~41 দিন!

// ✅ 10 min
next: {
  revalidate: 600;
}
```

```js
// ❌ static policy page এ new Date()
lastModified: new Date(); // Google mislead হয়

// ✅ fixed launch date
lastModified: LAUNCH_DATE;
```

```ts
// ❌ Express router এ dynamic route আগে
router.get("/:key", handler); // এটা GET "/" কেও catch করে
router.get("/", handler); // কখনো hit হবে না!

// ✅ Specific routes আগে, dynamic শেষে
router.get("/", handler);
router.get("/:key", handler);
```
