// src/components/lib/getSeoConfig.js
// Main Engine - SEO Configuration
import { SITE_URL } from "../utils/baseURL";
import { getServerSettingData } from "./getServerSettingData";

// ✅ Trailing slash fix
const joinUrl = (base, path) => {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
};

// ✅ Fallback OG image — DB থেকে না আসলে এটা use হবে
const FALLBACK_IMAGE = "/logo.jpg"; // public folder a এটা আছে site logo

export async function getSeoConfig() {
  let s = null;
  try {
    const settingData = await getServerSettingData();
    s = settingData?.data?.[0];
  } catch (error) {
    console.error("Server Setting Data Fetch Error:", error);
  }

  const siteName = s?.title || "Leather Wallah";
  const seoTitle =
    s?.seo_title || `${siteName} – Premium Genuine Leather Footwear Bangladesh`;
  const seoDescription =
    s?.seo_description ||
    `${siteName} – Bangladesh এর সেরা genuine leather wallet, bag ও belt। High quality, affordable price। Cash on delivery সারাদেশে।`;
  const seoKeywords = s?.seo_keywords
    ? s.seo_keywords.split(",").map((k) => k.trim())
    : [
        "leather wallet",
        "genuine leather",
        "leather bag",
        "leather belt",
        "bangladesh",
      ];

  return {
    siteName,
    siteUrl: SITE_URL,
    joinUrl, // ✅ helper export করলাম
    seoTitle,
    seoDescription,
    seoKeywords,
    logo: s?.logo || FALLBACK_IMAGE, // ✅ fallback
    favicon: s?.favicon || "/favicon.ico",
    // M28 (2026-06-04) — currency tri-field for SSR contexts (JSON-LD
    // priceCurrency, sitemap, OG metadata). Mirrors the client `currencyOf`
    // helper. Clone clients only edit DB settings; no code change needed.
    currencyCode: s?.currency_code || "BDT",
    currencySymbol: s?.currency_symbol || "৳",
    currencyName: s?.currency_name || "টাকা",
    facebook: s?.facebook || "",
    instagram: s?.instagram || "",
    youtube: s?.you_tube || "",
    whatsapp: s?.watsapp || "",
    tiktok: s?.tik_tok || "",
    twitter: s?.twitter || "",

    // ── Analytics — enabled toggles + IDs both from DB now (Phase 1A).
    // .env stays as fallback for back-compat with early clones that
    // haven't migrated their values to the Admin Settings UI yet.
    metaPixelEnabled: !!s?.meta_pixel_enabled,
    tiktokPixelEnabled: !!s?.tiktok_pixel_enabled,
    gtmEnabled: !!s?.gtm_enabled,
    ga4Enabled: !!s?.ga4_enabled,
    clarityEnabled: !!s?.clarity_enabled,

    metaPixelId: s?.meta_pixel_enabled
      ? s?.meta_pixel_id || process.env.META_PIXEL_ID || null
      : null,
    tiktokPixelId: s?.tiktok_pixel_enabled
      ? s?.tiktok_pixel_id || process.env.TIKTOK_PIXEL_ID || null
      : null,
    gtmId: s?.gtm_enabled
      ? s?.gtm_id || process.env.GTM_ID || null
      : null,
    ga4Id: s?.ga4_enabled
      ? s?.ga4_id || process.env.GA4_ID || null
      : null,
    clarityId: s?.clarity_enabled
      ? s?.clarity_id || process.env.CLARITY_ID || null
      : null,
    googleVerification:
      s?.google_verification_meta || process.env.GOOGLE_VERIFICATION || null,
  };
}
