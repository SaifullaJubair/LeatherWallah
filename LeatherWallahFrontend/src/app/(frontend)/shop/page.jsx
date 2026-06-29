import { Suspense } from "react";
import CategoryViewSection from "@/components/categoryview/CategoryViewSection";
import { getFilterData } from "@/components/lib/getFilterData";
import { getFilterHeadData } from "@/components/lib/getFilterHeadData";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("shop");
}

const ShopPage = async () => {
  const [filterData, filterHeadData] = await Promise.all([
    getFilterData(undefined).catch(() => null),
    getFilterHeadData({ categoryType: undefined }).catch(() => null),
  ]);

  return (
    <div className="container mx-auto px-2 pb-5">
      {/* CategoryViewSection uses useSearchParams() — must sit under a Suspense
          boundary or Next.js bails the whole route to 404 at build/prerender. */}
      <Suspense fallback={null}>
        <CategoryViewSection
          slug={[]}
          filterData={filterData?.data}
          filterHeadData={filterHeadData?.data}
          initialTitle="All Products"
        />
      </Suspense>
    </div>
  );
};

export default ShopPage;
