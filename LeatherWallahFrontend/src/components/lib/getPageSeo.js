import { BASE_URL } from "@/components/utils/baseURL";

// DB থেকে একটা page এর SEO data আনো
// buildPageMeta এ use হবে
export const getPageSeoData = async (page_key) => {
  try {
    const res = await fetch(`${BASE_URL}/page-seo/${page_key}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
};
