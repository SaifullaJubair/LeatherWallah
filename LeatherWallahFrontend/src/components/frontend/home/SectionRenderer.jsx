"use client";

import dynamic from "next/dynamic";

// Server components (Banner/hero, FlashSale) are rendered directly in Home.jsx —
// this component handles only client-side sections driven by home_section_array.
// IDs here MUST match HOME_SECTION_DEFAULTS in setting.services.ts (source of truth).
//
// PERF: the whole homepage used to static-import every section, so all of their
// JS landed in the initial bundle — heavy on slow mobile CPUs (long TBT/TTI).
// Below-the-fold sections are now code-split with next/dynamic. `ssr` stays TRUE
// (the default) so each section is still server-rendered into the HTML — SEO,
// section order, and the Admin Home-Layout toggle/drag behaviour are unchanged;
// only the client JS chunk is deferred. First-fold sections stay eager-imported
// so above-the-fold content paints without an extra request.

// ── First-fold: eager (paint immediately) ──
import TrendingProduct from "./trendingProduct/TrendingProduct";
import LatestProducts from "./latestProducts/LatestProducts";
import CategoryWiseProduct from "./categoryWiseProduct/CategoryWiseProduct";
import FeatureCategoryStrip from "./featureCategoryStrip/FeatureCategoryStrip";

// ── Below-fold: code-split (ssr:true, so still in the server HTML) ──
const FeatureService    = dynamic(() => import("./featureService/FeatureService"));
const PromotionalBanner = dynamic(() => import("./promotionalBanner/PromotionalBanner"));
const PopularProducts   = dynamic(() => import("./popularProducts/PopularProducts"));
const BrandStory        = dynamic(() => import("./brandStory/BrandStory"));
const ReviewsCarousel   = dynamic(() => import("./reviewsCarousel/ReviewsCarousel"));
const SiteFaqSection    = dynamic(() => import("./siteFaqSection/SiteFaqSection"));
const NewsletterForm    = dynamic(() => import("./newsletterForm/NewsletterForm"));
const ECommerceChoice   = dynamic(() => import("./eCommerceChoice/ECommerceChoice"));
// Boutique preset (few-products storytelling home)
const HeroSpotlight     = dynamic(() => import("./heroSpotlight/HeroSpotlight"));
const ProductFeatures   = dynamic(() => import("./productFeatures/ProductFeatures"));
const StoryBand         = dynamic(() => import("./storyBand/StoryBand"));

// Sections handled server-side in Home.jsx — skip here to avoid double-render
const SERVER_SIDE_IDS = new Set(["hero", "flash_sale"]);

// Keys match HOME_SECTION_DEFAULTS ids in LeatherWallahBackend/src/app/setting/setting.services.ts
const SECTION_COMPONENTS = {
  trending_products:  TrendingProduct,
  new_arrivals:       LatestProducts,
  feature_categories: FeatureCategoryStrip,
  category_wise_strip: CategoryWiseProduct,
  bestsellers:        PopularProducts,
  promo_banner:       PromotionalBanner,
  feature_service:    FeatureService,   // not in L9 defaults, but safe to keep
  brand_story:        BrandStory,
  reviews_carousel:   ReviewsCarousel,
  site_faq:           SiteFaqSection,
  newsletter:         NewsletterForm,
  ecommerce_choice:    ECommerceChoice,
  // Boutique preset — shipped disabled by default; a small-catalog client
  // enables these + disables the grid sections from Admin → Home Layout.
  hero_spotlight:      HeroSpotlight,
  product_features:    ProductFeatures,
  story_band:          StoryBand,
  // lower-priority sections not yet wired to components — will silently skip
  // trust_strip, offers_block, just_for_you
};

export default function SectionRenderer({ sections, settings }) {
  if (!sections?.length) {
    // No section array yet — render core client sections in sensible default order
    return (
      <>
        <TrendingProduct />
        <LatestProducts />
        <CategoryWiseProduct />
        <FeatureService />
        <PromotionalBanner />
      </>
    );
  }

  const sorted = [...sections]
    .filter((s) => s.enabled && !SERVER_SIDE_IDS.has(s.id))
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((section) => {
        const Component = SECTION_COMPONENTS[section.id];
        if (!Component) return null;
        return <Component key={section.id} settings={settings} />;
      })}
    </>
  );
}
