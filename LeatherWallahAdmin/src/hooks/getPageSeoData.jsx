// DB থেকে একটা page এর SEO data আনো (Public route - no auth needed)

import { BASE_URL } from "../utils/baseURL";

// buildPageMeta এ use হবে
export const getPageSeoData = async (page_key) => {
  try {
    // Changed from /page-seo/:key to /page-seo/public/:key
    const res = await fetch(`${BASE_URL}/page-seo/public/${page_key}`, {
      next: { revalidate: 3600 }, // 1 hour cache
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
};
