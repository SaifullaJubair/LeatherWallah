// src/app/sitemap.js
import { BASE_URL as API_URL } from "@/components/utils/baseURL";
import { getSeoConfig } from "@/components/lib/getSeoConfig";

// ✅ Static pages এর জন্য fixed date — project launch date
const LAUNCH_DATE = new Date("2025-03-12");

export default async function sitemap() {
  const seo = await getSeoConfig();
  const SITE_URL = seo.siteUrl;

  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    // ✅ Static pages এ fixed date — Google কে mislead করবে না
    {
      url: `${SITE_URL}/about-us`,
      lastModified: LAUNCH_DATE,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: LAUNCH_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/return-policy`,
      lastModified: LAUNCH_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms-condition`,
      lastModified: LAUNCH_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },

    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: LAUNCH_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cancel-policy`,
      lastModified: LAUNCH_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/shipping-information`,
      lastModified: LAUNCH_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ✅ Products — updatedAt use করছি
  let productPages = [];
  try {
    const res = await fetch(
      `${API_URL}/product?page=1&limit=500&product_status=active`,
      { next: { revalidate: 60 } },
    );
    const data = await res.json();
    productPages = (data?.data || []).map((p) => ({
      url: `${SITE_URL}/products/${p.product_slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (e) {
    console.error("Sitemap: product fetch failed", e);
  }

  // ✅ Categories
  let categoryPages = [];
  try {
    const res = await fetch(`${API_URL}/category/category_sub_child`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    categoryPages = (data?.data || []).map((item) => ({
      url: `${SITE_URL}/category/${item.category?.category_slug}`,
      lastModified: new Date(
        item.category?.updatedAt || item.category?.createdAt,
      ),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (e) {
    console.error("Sitemap: category fetch failed", e);
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
