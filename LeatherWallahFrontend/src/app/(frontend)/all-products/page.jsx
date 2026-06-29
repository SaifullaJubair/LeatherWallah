// src/app/(frontend)/all-products/page.jsx
import AllProduct from "@/components/frontend/seeAllProduct/AllProduct";
import { buildPageMeta } from "@/components/lib/buildPageMeta";
import { getSeoConfig } from "@/components/lib/getSeoConfig";

export async function generateMetadata({ searchParams }) {
  const search = searchParams?.search;

  if (search) {
    const seo = await getSeoConfig();
    return {
      title: `"${search}" – Search Results`,
      description: `${seo.siteName} এ "${search}" এর search results।`,
      robots: { index: false, follow: true },
    };
  }

  return buildPageMeta("allProducts");
}
const AllProductPage = () => {
  return (
    <div>
      <AllProduct />
    </div>
  );
};

export default AllProductPage;
