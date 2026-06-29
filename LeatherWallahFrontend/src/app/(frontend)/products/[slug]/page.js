// src/app/(frontend)/products/[slug]/page.js
// Main customer-facing Product Details page (themed). Uses the self-contained
// components under components/frontend/themedProduct/. A product without a
// theme_id falls back to mergeTheme's DEFAULT (site brand green) — page never
// looks broken. Old non-themed page is preserved at /products-original/[slug]
// as a safety backup.
import { BASE_URL } from "@/components/utils/baseURL";
import SingleProduct from "@/components/frontend/themedProduct/singeProduct/SingleProduct";
import ProductThemedSections from "@/components/frontend/themedProduct/theme/ProductThemedSections";
import OfferDiscoveryBanner from "@/components/frontend/themedProduct/theme/sections/OfferDiscoveryBanner";
import { mergeFloating } from "@/lib/theme/mergeFloating";
import ThemeStyleInjector from "@/components/frontend/themedProduct/theme/ThemeStyleInjector";
import { mergeTheme } from "@/lib/theme/mergeTheme";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSeoConfig } from "@/components/lib/getSeoConfig";
import { redirect } from "next/navigation";

// ✅ Variation সহ সঠিক price বের করা
const getProductPrice = (product) => {
  if (!product) return null;

  // Variation product — প্রথম variation এর price নাও
  if (product?.is_variation && product?.variations?.length > 0) {
    const firstVariation = product.variations[0];
    return (
      firstVariation?.variation_discount_price ||
      firstVariation?.variation_price ||
      null
    );
  }

  // Normal product
  return product?.product_discount_price || product?.product_price || null;
};

// ✅ Variation সহ সঠিক image বের করা
const getProductImage = (product, fallback) => {
  if (!product) return fallback;

  if (product?.is_variation && product?.variations?.length > 0) {
    const firstVariation = product.variations[0];
    return firstVariation?.variation_image || product?.main_image || fallback;
  }

  return product?.main_image || fallback;
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const seo = await getSeoConfig();

  const res = await fetch(`${BASE_URL}/product/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      title: `Product Not Found | ${seo.siteName}`,
      robots: { index: false },
    };
  }

  const productData = await res.json();

  if (productData?.redirect_slug) {
    return { robots: { index: false } };
  }

  const product = productData?.data;
  if (!product) return { title: `Product Not Found | ${seo.siteName}` };

  const price = getProductPrice(product); // ✅ variation aware
  const productImage = getProductImage(product, seo.logo); // ✅ variation aware

  // S3b (2026-06-04) — full per-product SEO field wiring. Admin sets these
  // in the product form / page-content editor; PDP falls back gracefully
  // when a field is empty so older docs without SEO still render correctly.
  const pageTitle = product?.meta_title || product?.product_name;
  const description =
    product?.meta_description ||
    `${product?.product_name} – ${seo.siteName} এ পাচ্ছেন মাত্র ${seo.currencySymbol}${price ?? ""}। Cash on delivery সারাদেশে।`;
  const keywordsList = Array.isArray(product?.meta_keywords)
    ? product.meta_keywords.filter(Boolean)
    : [];
  const ogTitle = product?.og_title || pageTitle;
  const ogDescription = product?.og_description || description;
  const ogImage = product?.og_image || productImage;

  return {
    title: pageTitle,
    description,
    ...(keywordsList.length > 0 && { keywords: keywordsList }),
    alternates: {
      canonical: seo.joinUrl(seo.siteUrl, `products/${slug}`),
    },
    openGraph: {
      type: "article",
      locale: "bn_BD",
      siteName: seo.siteName,
      url: seo.joinUrl(seo.siteUrl, `products/${slug}`),
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

const ProductDetailsPage = async ({ params }) => {
  const { slug } = await params;

  const [seo, productRes, settingRes, trustRes] = await Promise.all([
    getSeoConfig(),
    fetch(`${BASE_URL}/product/${slug}`, { cache: "no-store" }),
    fetch(`${BASE_URL}/setting`, { next: { revalidate: 60 } }).catch(() => null),
    fetch(`${BASE_URL}/trust-point`, { next: { revalidate: 60 } }).catch(() => null),
  ]);

  const data = await productRes.json();
  const settingJson = settingRes ? await settingRes.json().catch(() => null) : null;
  const setting = settingJson?.data?.[0] || settingJson?.data || null;

  // Site-wide "আমাদের প্রতিশ্রুতি" list (its own module, not part of settings).
  const trustJson = trustRes ? await trustRes.json().catch(() => null) : null;
  const trustPoints = trustJson?.data?.points || [];

  if (data?.redirect_slug) {
    redirect(`/products/${data.redirect_slug}`);
  }

  const product = data?.data;

  if (!product) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6 shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="Product not found"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h3 className="font-semibold text-gray-800 mb-2">Product Not Found!</h3>
        <p className="text-gray-600 mb-6">
          We couldn't find the product you're looking for. It might have been
          removed or the URL might be incorrect.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Link href="/">
            <Button className="w-full">Go Home</Button>
          </Link>
          <Link href="/shop">
            <Button variant="secondary" className="w-full">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const price = getProductPrice(product); // ✅ variation aware

  // Resolve the product's theme once on the server; inject CSS vars page-level
  // so the hero (inside SingleProduct) is themed from first paint. No theme_id
  // on product → mergeTheme returns the default green fallback. Per-product
  // color overrides were removed — a product's colors come solely from its
  // assigned theme (create a new theme for a different palette).
  const baseTheme =
    product?.theme_id && typeof product.theme_id === "object"
      ? product.theme_id
      : null;
  const baseResolved = mergeTheme(baseTheme);
  // Section-anchored floating: layer the per-product override (hide/replace/
  // extras) over the theme's floating_assets ONCE here, then hand the merged
  // list down via theme.floating_assets so all section <FloatingAssets/> mounts
  // render the resolved set with no per-section wiring. Replaces the old
  // full-page ProductFloatingImages (z-trapped) entirely.
  const theme = {
    ...baseResolved,
    floating_assets: mergeFloating(
      baseResolved?.floating_assets,
      product?.floating_overrides,
    ),
  };

  // S3b (2026-06-04) — Product JSON-LD now includes SKU (when available)
  // and uses brand_name from product.brand_id when admin set a brand;
  // falls back to site name otherwise. availability flips between InStock
  // and OutOfStock based on real stock.
  const totalStock = product?.is_variation
    ? (product?.variations || []).reduce(
        (acc, v) =>
          acc + (v?.is_active === false ? 0 : v?.variation_quantity || 0),
        0,
      )
    : product?.product_quantity || 0;
  const brandName = product?.brand_id?.brand_name || seo.siteName;
  const productSku = product?.product_sku || product?.variations?.[0]?.variation_sku;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.product_name,
    image: getProductImage(product, seo.logo),
    description: product?.meta_description || product?.product_name,
    brand: { "@type": "Brand", name: brandName },
    ...(productSku && { sku: productSku }),
    offers: {
      "@type": "Offer",
      url: seo.joinUrl(seo.siteUrl, `products/${slug}`),
      priceCurrency: seo.currencyCode,
      price,
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      )
        .toISOString()
        .split("T")[0],
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: seo.siteName },
    },
    ...(product?.avarage_review_ratting && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product?.avarage_review_ratting,
        reviewCount: product?.total_review_ratting || 1,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  // S3a (2026-06-04) — BreadcrumbList JSON-LD. Helps Google render
  // "Home › Category › Product" chips in search results. Category segment
  // is only added when the product has an active category.
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: seo.siteUrl,
    },
  ];
  if (product?.category_id?.category_slug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: product.category_id.category_name,
      item: seo.joinUrl(
        seo.siteUrl,
        `category/${product.category_id.category_slug}`,
      ),
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: product?.product_name,
      item: seo.joinUrl(seo.siteUrl, `products/${slug}`),
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: product?.product_name,
      item: seo.joinUrl(seo.siteUrl, `products/${slug}`),
    });
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <section
      data-themed-pdp
      className="relative overflow-hidden"
      style={{ background: "var(--page-bg, #F4F4F4)", fontFamily: "var(--brand-font)" }}
    >
      <ThemeStyleInjector theme={theme} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Floating accent images are now section-anchored: each themed section
          mounts its own <FloatingAssets/> from theme.floating_assets (already
          merged with the product's floating_overrides above). No full-page
          float layer / z-index trap anymore. */}
      <div className="relative">
        <SingleProduct product={product} theme={theme} />
        {/* Mounted at the page level (not inside ProductThemedSections) so
            sparse products with no themed content but an active offer still
            surface the discovery banner. Component self-hides when product
            isn't in any active offer. */}
        <OfferDiscoveryBanner productId={product?._id} />
        <ProductThemedSections
          product={product}
          theme={theme}
          setting={setting}
          trustPoints={trustPoints}
        />
      </div>
    </section>
  );
};

export default ProductDetailsPage;
