import JustForYouAllProduct from "@/components/frontend/justForYouAll/JustForYouAllProduct";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("latestProduct");
}
const JustForYouProduct = () => {
  return (
    <div>
      <JustForYouAllProduct />
    </div>
  );
};

export default JustForYouProduct;
