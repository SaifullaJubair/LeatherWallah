import ViewAllTrendingProducts from "@/components/frontend/viewAllTrendingProduct/ViewAllTrendingProducts";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("allTrending");
}

const AllTrendingProductsPage = () => {
  return (
    <div>
      <ViewAllTrendingProducts />
    </div>
  );
};

export default AllTrendingProductsPage;
