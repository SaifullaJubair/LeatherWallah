"use client";

// Server components (Banner/hero, FlashSale) are rendered directly in Home.jsx —
// this component handles only client-side sections driven by home_section_array.
// IDs here MUST match HOME_SECTION_DEFAULTS in setting.services.ts (source of truth).
import TrendingProduct from "./trendingProduct/TrendingProduct";
import LatestProducts from "./latestProducts/LatestProducts";
import CategoryWiseProduct from "./categoryWiseProduct/CategoryWiseProduct";
import FeatureCategoryStrip from "./featureCategoryStrip/FeatureCategoryStrip";
import FeatureService from "./featureService/FeatureService";
import PromotionalBanner from "./promotionalBanner/PromotionalBanner";
import PopularProducts from "./popularProducts/PopularProducts";
import BrandStory from "./brandStory/BrandStory";
import ReviewsCarousel from "./reviewsCarousel/ReviewsCarousel";
import SiteFaqSection from "./siteFaqSection/SiteFaqSection";
import NewsletterForm from "./newsletterForm/NewsletterForm";
import ECommerceChoice from "./eCommerceChoice/ECommerceChoice";
// Boutique preset (few-products storytelling home)
import HeroSpotlight from "./heroSpotlight/HeroSpotlight";
import ProductFeatures from "./productFeatures/ProductFeatures";
import StoryBand from "./storyBand/StoryBand";

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
