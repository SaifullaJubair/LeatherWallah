// One container that wraps all themed sections for a product. Injects CSS vars,
// merges theme + theme_overrides once, and renders each section. Each section
// gracefully no-ops when its data is empty, so partially populated products
// (e.g. just a theme but no benefits yet) still look good.

import ThemeStyleInjector from "./ThemeStyleInjector";
import HeroEnrichment from "./sections/HeroEnrichment";
import BenefitsSection from "./sections/BenefitsSection";
import UseCasesSection from "./sections/UseCasesSection";
import NutritionSection from "./sections/NutritionSection";
import FaqSection from "./sections/FaqSection";
import { mergeTheme, NEUTRAL_FALLBACK } from "@/lib/theme/mergeTheme";

export default function ProductThemedSections({ product }) {
  if (!product) return null;

  const baseTheme = product.theme_id && typeof product.theme_id === "object"
    ? product.theme_id
    : null;
  const theme = mergeTheme(baseTheme, product.theme_overrides);

  // Skip rendering altogether if product has no themed content of any kind
  const hasContent =
    product.badge_text ||
    product.short_description ||
    (product.short_features?.length || 0) > 0 ||
    (product.process_steps?.length || 0) > 0 ||
    (product.benefits?.length || 0) > 0 ||
    (product.use_cases?.length || 0) > 0 ||
    product.nutrition ||
    (product.faqs?.length || 0) > 0;

  if (!hasContent) return null;

  return (
    <div className="themed-product-page">
      <ThemeStyleInjector theme={theme} />
      <HeroEnrichment product={product} theme={theme} />
      <BenefitsSection product={product} theme={theme} />
      <UseCasesSection product={product} theme={theme} />
      <NutritionSection product={product} theme={theme} />
      <FaqSection product={product} theme={theme} />
    </div>
  );
}
