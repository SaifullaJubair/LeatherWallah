import TopProduct from "@/components/frontend/topProduct/TopProduct";
import { buildPageMeta } from "@/components/lib/buildPageMeta";
export async function generateMetadata() {
  return buildPageMeta("topProduct");
}
const TopProductPage = () => {
  return (
    <div>
      <TopProduct />
    </div>
  );
};

export default TopProductPage;
