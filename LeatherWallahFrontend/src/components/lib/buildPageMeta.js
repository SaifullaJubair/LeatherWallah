// src/components/lib/buildPageMeta.js

import { getPageSeoData } from "./getPageSeo";
import { getSeoConfig } from "./getSeoConfig";

import { PAGE_SEO } from "@/components/utils/pageSeo";

// page_key দিয়ে call করো — DB থেকে নেবে, না থাকলে pageSeo.js fallback
export async function buildPageMeta(page_key) {
  const [seo, dbPage] = await Promise.all([
    getSeoConfig(),
    getPageSeoData(page_key),
  ]);

  // DB তে data আছে → সেটা use করো
  // না থাকলে → pageSeo.js এর hardcoded value fallback
  const fallback = PAGE_SEO[page_key] || {};
  const title = dbPage?.title ?? fallback.title ?? "";
  const description = dbPage?.description ?? fallback.description ?? "";
  const path = dbPage?.path ?? fallback.path ?? "";
  const noIndex = dbPage?.noIndex ?? fallback.noIndex ?? false;

  // Private / noindex page
  if (noIndex) {
    return {
      title,
      robots: { index: false, follow: false },
    };
  }

  const url = seo.joinUrl(seo.siteUrl, path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      siteName: seo.siteName,
      url,
      title,
      description,
      images: [{ url: seo.logo, width: 1200, height: 630, alt: seo.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [seo.logo],
    },
  };
}
