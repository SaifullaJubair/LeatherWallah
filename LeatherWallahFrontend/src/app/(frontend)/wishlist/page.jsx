import WishList from "@/components/frontend/wishList/WishList";
import { buildPageMeta } from "@/components/lib/buildPageMeta";
export async function generateMetadata() {
  return buildPageMeta("wishlist");
}
const WishListPage = () => {
  return (
    <div>
      <WishList />
    </div>
  );
};

export default WishListPage;
