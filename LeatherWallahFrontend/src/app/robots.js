// src/app/robots.js
import { getSeoConfig } from "@/components/lib/getSeoConfig";

export default async function robots() {
  const seo = await getSeoConfig();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/user-profile/",
          "/orders/",
          "/order-success/",
          "/checkout/",
          "/verify/",
          "/change-password/",
          "/forget-password/",
          "/sign-in/",
          "/sign-up/",
          // NOTE: /shop (main product listing) and /offer (public offers) are
          // intentionally NOT disallowed — they are primary indexable pages and
          // are listed in the sitemap. Blocking them here was an SEO bug.
          "/compare/",
          "/wishlist/",

          // ✅ কুয়েরি প্যারামিটার
          "/*?search=*",
          "/*?page=*",
          "/*?sort=*",
          "/*?filter=*",
        ],
      },
    ],
    sitemap: `${seo.siteUrl}/sitemap.xml`,
  };
}
