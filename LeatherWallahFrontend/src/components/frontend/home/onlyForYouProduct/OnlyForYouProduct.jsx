import { getJustForYouProducts } from "@/components/lib/getJustForProducts";
import ProductCard from "@/components/common/ProductCard";
import { Button } from "@/components/ui/button";
import { titleFont } from "@/utils/font";
import Link from "next/link";
import { IoIosArrowRoundForward } from "react-icons/io";

const OnlyForYouProduct = async () => {
  const data = await getJustForYouProducts();
  const products = data?.data?.data;

  return (
    <div className="my-10">
      <div className="max-w-[98%] mx-auto">
        <div className="flex justify-between items-center pb-6">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
            style={{ fontFamily: titleFont.style.fontFamily }}
          >
            New <span className="text-primary">Arrival</span>
          </h2>
          <Link href="/shop">
            <Button variant="link">
              See All Products
              <IoIosArrowRoundForward />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
          {products?.slice(0, 10)?.map((product) => (
            <ProductCard key={product?._id} product={product} badge="New" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlyForYouProduct;
