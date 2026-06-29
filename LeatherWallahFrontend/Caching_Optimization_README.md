# 🚀 Next.js Caching Optimization Guide

> **উদ্দেশ্য:** Traffic বাড়লে কোথায় কী পরিবর্তন করতে হবে তার সম্পূর্ণ গাইড।

---

## 📊 বর্তমান Cache Configuration (Current State)

### `revalidate` ব্যবহার করা files:

| File                            | Current        | Recommended (High Traffic) | কারণ                                   |
| ------------------------------- | -------------- | -------------------------- | -------------------------------------- |
| `getFlashSaleProducts.js`       | `60s`          | `120s`                     | Flash sale বেশি change হয় না          |
| `getBanner.js`                  | `600s`         | `600s` ✅                  | Banner rarely change হয়               |
| `getSlider.js`                  | `600s`         | `600s` ✅                  | Same                                   |
| `getAllCampaign.js`             | `100s`         | `300s`                     | Campaign time-sensitive কিন্তু এতটা না |
| `getAllOffers.js`               | `100s`         | `300s`                     | Offer change হতে পারে                  |
| `getCategory.js`                | `600s`         | `600s` ✅                  | Category rarely changes                |
| `getECommerceChoiceProducts.js` | `300s`         | `600s`                     | Slow-changing data                     |
| `getFilterHeadData.js`          | `300s`         | `600s`                     | Same                                   |
| `getJustForProducts.js`         | `300s`         | `600s`                     | Same                                   |
| `getMenu.js`                    | `600s`         | `3600s`                    | Menu almost never changes              |
| `getServerSettingData.js`       | `600s`         | `3600s`                    | Settings rarely change                 |
| `getPopularProducts.js`         | `300s`         | `600s`                     | Same                                   |
| `getPreOrderProducts.js`        | `300s`         | `600s`                     | Same                                   |
| `sitemap.js`                    | `60s` / `300s` | `3600s`                    | Sitemap doesn't change often           |
| `getPageSeo.js`                 | `600s`         | `3600s`                    | SEO data rarely changes                |

---

### `no-store` ব্যবহার করা files (Always fresh):

| File                       | Cache      | Traffic বাড়লে কী করতে হবে                  |
| -------------------------- | ---------- | ------------------------------------------- |
| `page.js` (product/[slug]) | `no-store` | ⚠️ **On-Demand Revalidation এ migrate করো** |
| `getCampaignProduct.js`    | `no-store` | ⚠️ `revalidate: 300` দিতে পারো              |
| `getFilterData.js`         | `no-store` | ⚠️ `revalidate: 300` দিতে পারো              |
| `getOfferProducts.js`      | `no-store` | ⚠️ `revalidate: 300` দিতে পারো              |

---

## ⚠️ Traffic বাড়লে কী কী করতে হবে (Priority Order)

### 🔴 Priority 1 — সবচেয়ে জরুরি

#### Product Details Page — `no-store` থেকে On-Demand Revalidation এ migrate করো

**কেন:** প্রতিটা user visit এ backend এ fresh request যাচ্ছে। ১০০০ user একসাথে একটা product দেখলে ১০০০ DB query হবে।

**কীভাবে:**

1. **Backend এ revalidation endpoint call করো** — admin product update করলে:

```js
// Backend (Node.js/Express example)
await fetch(
  `${NEXT_FRONTEND_URL}/api/revalidate?secret=${SECRET}&path=/products/${slug}`,
  {
    method: "POST",
  },
);
```

2. **Next.js এ revalidation route বানাও:**

```js
// src/app/api/revalidate/route.js
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  const path = request.nextUrl.searchParams.get("path");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true });
}
```

3. **Product page fetch পরিবর্তন করো:**

```js
// আগে (no-store):
const res = await fetch(`${BASE_URL}/product/${slug}`, { cache: "no-store" });

// পরে (revalidate দিয়ে, on-demand দিয়ে clear হবে):
const res = await fetch(`${BASE_URL}/product/${slug}`, {
  next: { revalidate: 3600 },
});
```

---

### 🟡 Priority 2 — Traffic মাঝারি হলে

#### `no-store` files গুলোতে revalidate দাও

```js
// getCampaignProduct.js
{
  next: {
    revalidate: 300;
  }
} // 5 মিনিট

// getFilterData.js
{
  next: {
    revalidate: 300;
  }
}

// getOfferProducts.js
{
  next: {
    revalidate: 300;
  }
}
```

---

### 🟢 Priority 3 — Optimization (যেকোনো সময়)

#### Slow-changing data এর revalidate বাড়াও

```js
// getMenu.js — 600s থেকে 3600s
{
  next: {
    revalidate: 3600;
  }
}

// getServerSettingData.js — 600s থেকে 3600s
{
  next: {
    revalidate: 3600;
  }
}

// getPageSeo.js — 600s থেকে 3600s
{
  next: {
    revalidate: 3600;
  }
}

// sitemap.js — 60s/300s থেকে 3600s
{
  next: {
    revalidate: 3600;
  }
}
```

---

## 📚 Key Concepts — মনে রাখার জন্য

### revalidate কীভাবে কাজ করে:

```
User page এ গেলো → Cache আছে?
  ├── হ্যাঁ → Cache কি X সেকেন্টের পুরনো?
  │     ├── না → Cache থেকে serve করো (fast ✅)
  │     └── হ্যাঁ → এই user কে পুরনো cache দাও
  │                  Background এ fresh fetch করো
  │                  পরের user fresh পাবে
  └── না → Fresh fetch করো
```

> **গুরুত্বপূর্ণ:** কেউ site এ না থাকলে কোনো request যায় না। User request ছাড়া background fetch হয় না।

---

### cache: "no-store" vs revalidate:

| বিষয়                 | `no-store`                  | `revalidate: 300`      |
| --------------------- | --------------------------- | ---------------------- |
| প্রতি visit এ request | হ্যাঁ                       | না (cached থাকলে)      |
| Data freshness        | সবসময় fresh                | ৫ মিনিট পুরনো হতে পারে |
| Server load           | বেশি                        | কম                     |
| কখন ব্যবহার করবে      | Traffic কম, freshness দরকার | Traffic বেশি           |

---

### On-Demand Revalidation Flow:

```
Admin product update করলো
        ↓
Backend DB তে save করলো
        ↓
Backend frontend কে call করলো → /api/revalidate?path=/products/slug
        ↓
Next.js cache clear হলো
        ↓
যেকোনো user এখন fresh data পাবে ✅
```

---

## 🛠️ Environment Variables (যোগ করতে হবে)

On-Demand Revalidation implement করতে `.env` এ:

```env
REVALIDATION_SECRET=your-secret-key-here
NEXT_FRONTEND_URL=https://yoursite.com
```

Backend এও একই secret রাখতে হবে।

---

## 📋 Quick Reference — কখন কী করবে

| Traffic Level         | Action                                              |
| --------------------- | --------------------------------------------------- |
| **এখন (Low)**         | Current config ঠিক আছে, `no-store` products এ রাখো  |
| **Medium Traffic**    | `no-store` files এ `revalidate: 300` দাও            |
| **High Traffic**      | Product page এ On-Demand Revalidation implement করো |
| **Very High Traffic** | সব slow-changing data এর revalidate `3600s` করো     |

---

_Last updated: Based on chat discussion about Next.js ISR and caching strategies._
