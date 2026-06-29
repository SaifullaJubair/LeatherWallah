// One container that wraps all themed sections for a product. Injects CSS vars,
// merges theme + theme_overrides once, and renders each section. Each section
// gracefully no-ops when its data is empty, so partially populated products
// (e.g. just a theme but no benefits yet) still look good.

import VideoSection from "./sections/VideoSection";
import BenefitsUseCasesSection from "./sections/BenefitsUseCasesSection";
import SizeGuideSection from "./sections/SizeGuideSection";
import NutritionSection from "./sections/NutritionSection";
import ReviewsSection from "./sections/ReviewsSection";
import FaqSection from "./sections/FaqSection";
import OfferBanner from "./sections/OfferBanner";
// OfferDiscoveryBanner intentionally NOT imported here — it now mounts at
// page level (products/[slug]/page.js) so sparse products without other
// themed content still surface bundle offers. See Item 11α audit follow-up.
import RelatedProductsThemed from "./sections/RelatedProductsThemed";
import DescriptionCard from "./DescriptionCard";
import { mergeTheme } from "@/lib/theme/mergeTheme";

// Renders the lower content sections only. The hero + order + variant UI now
// lives inside the themed SingleProduct hub, and ThemeStyleInjector +
// AnnouncementBar are injected page-level (see products/[slug]/page.js).
// So this component is purely: benefits → use cases → nutrition → faq.
export default function ProductThemedSections({ product, theme: passedTheme, setting, trustPoints }) {
  if (!product) return null;

  const baseTheme =
    product.theme_id && typeof product.theme_id === "object"
      ? product.theme_id
      : null;
  const theme = passedTheme || mergeTheme(baseTheme, product.theme_overrides);

  // Description counts as content too — keeps PDP visible for products that
  // only have a description and nothing else populated yet.
  const hasContent =
    product.main_video ||
    product.video_link ||
    (product.process_steps?.length || 0) > 0 ||
    (product.benefits?.length || 0) > 0 ||
    (product.use_cases?.length || 0) > 0 ||
    (product.size_guide_rows?.length || 0) > 0 ||
    product.size_chart ||
    product.nutrition ||
    (trustPoints?.length || 0) > 0 ||
    (product.faqs?.length || 0) > 0 ||
    (product.custom_fields?.length || 0) > 0 ||
    (product.description && String(product.description).trim());

  if (!hasContent) return null;

  // Order (owner request): order form (in the SingleProduct hub above) → Video
  // → Details (description + spec) → Benefits/UseCases → Nutrition → Reviews →
  // Related → FAQ → Offer. Description+spec sits right after the video instead
  // of buried mid-page. Card self-hides when both description + custom_fields
  // are empty (see DescriptionCard.jsx).
  return (
    <div className="themed-product-page" style={{ background: "var(--page-bg)" }}>
      <VideoSection product={product} theme={theme} />
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <DescriptionCard
          html={product?.description}
          customFields={product?.custom_fields}
        />
      </div>
      <BenefitsUseCasesSection product={product} theme={theme} />
      <SizeGuideSection product={product} theme={theme} />
      <NutritionSection product={product} theme={theme} trustPoints={trustPoints} />
      {(setting?.enable_reviews ?? true) && <ReviewsSection product={product} theme={theme} />}
      <RelatedProductsThemed product_slug={product?.product_slug} />
      <FaqSection product={product} theme={theme} />
      <OfferBanner product={product} setting={setting} />
    </div>
  );
}
