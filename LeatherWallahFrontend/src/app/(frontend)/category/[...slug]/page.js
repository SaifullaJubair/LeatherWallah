// src/app/(frontend)/category/[...slug]/page.js
import { Suspense } from "react";
import CategoryViewSection from "@/components/categoryview/CategoryViewSection";
import { getFilterData } from "@/components/lib/getFilterData";
import { getFilterHeadData } from "@/components/lib/getFilterHeadData";
import { getSeoConfig } from "@/components/lib/getSeoConfig";

// slug থেকে readable নাম বানানোর helper
const slugToName = (slug) =>
  slug
    ?.split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export async function generateMetadata({ params }) {
  // Next.js 15+ — `params` is a Promise that must be awaited before
  // destructuring. Without the await, `slug` ends up as undefined and
  // every consumer (this metadata fn + the page below + CategoryViewSection)
  // crashes downstream.
  const { slug } = await params;
  // catch-all route — slug is the full chain root → … → leaf in the tree.
  const leafSlug = slug?.[slug.length - 1];
  const rootSlug = slug?.[0];

  const [seo] = await Promise.all([getSeoConfig()]);

  try {
    const leafName = slugToName(leafSlug);
    const rootName = slugToName(rootSlug);
    const pageTitle = leafSlug !== rootSlug ? `${leafName} – ${rootName}` : leafName;

    const description = `Explore the ${pageTitle} collection at ${seo.siteName}. Premium quality, affordable prices, cash on delivery nationwide.`;
    const canonicalSlug = slug.join("/");
    const url = seo.joinUrl(seo.siteUrl, `category/${canonicalSlug}`);

    return {
      title: pageTitle,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        locale: "bn_BD",
        siteName: seo.siteName,
        url,
        title: pageTitle,
        description,
        images: [{ url: seo.logo, width: 1200, height: 630, alt: pageTitle }],
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description,
        images: [seo.logo],
      },
    };
  } catch {
    return {
      title: slugToName(rootSlug),
      robots: { index: false },
    };
  }
}

const CategoryPage = async ({ params }) => {
  // Next.js 15+ — `params` is a Promise; must await before destructuring.
  const { slug } = await params;
  // Filter facets are scoped to the chosen leaf (subtree at the deepest crumb)
  // and the heading chips are the leaf's direct children.
  const leafSlug = slug?.[slug.length - 1];

  const [filterData, filterHeadData] = await Promise.all([
    getFilterData(leafSlug),
    getFilterHeadData({ categoryType: leafSlug }),
  ]);

  return (
    <div className="container mx-auto px-2 pb-5">
      {/* CategoryViewSection uses useSearchParams() — needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <CategoryViewSection
          slug={slug}
          filterData={filterData?.data}
          filterHeadData={filterHeadData?.data}
        />
      </Suspense>
    </div>
  );
};

export default CategoryPage;
