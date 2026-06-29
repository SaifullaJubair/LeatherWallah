import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";
import Image from "next/image";
import Link from "next/link";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";

const ProductInfo = ({ products }) => {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-y-6 ">
        {products.map((product, index) => (
          <Link
            href={`/products/${product?.product_slug}`}
            key={index}
            className="bg-white   shadow-md border-primary-100 border h-80 sm:h-96 "
          >
            <div className="relative p-2 group">
              {product.isNew && (
                <span className="absolute top-0 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
                  New
                </span>
              )}
              <Image
                src={product?.main_image}
                alt={product?.product_name}
                width={400}
                height={400}
                className="w-full h-36 sm:h-44  object-cover group-hover:scale-105 transition-transform duration-300" // Hover effect
              />
            </div>
            <div className="p-3 flex flex-col justify-between h-40 sm:h-44 md:h-48">
              {/* Adjusted for spacing */}
              <p className="text-base sm:text-lg mt-2 text-text-default font-medium line-clamp-2">
                {product?.product_name}
              </p>
              <p className="text-sm text-gray-500">
                {product?.brand?.brand_name}
              </p>

              <div className="flex items-center text-xs sm:text-sm ">
                {Array.from({ length: 5 }, (_, index) => {
                  if (product.rating > index) {
                    return <FaStar key={index} className="text-yellow-400 " />;
                  }
                  return (
                    <FaStarHalfAlt key={index} className="text-yellow-400" />
                  );
                })}
                <span className="ml-2  text-gray-500">({117} )</span>
              </div>

              <div className="flex items-center justify-between space-x-2 mt-2">
                <div>
                  <span className="text-lg font-semibold">
                    $
                    {product?.flash_sale_details
                      ? product?.flash_sale_details?.flash_sale_product
                          ?.flash_sale_product_price
                      : product?.campaign_details
                      ? product?.campaign_details?.campaign_product
                          ?.campaign_product_price
                      : product?.is_variation
                      ? product?.variations?.variation_discount_price
                        ? product?.variations?.variation_discount_price
                        : product?.variations?.variation_price
                      : product?.product_discount_price
                      ? product?.product_discount_price
                      : product?.product_price}
                  </span>
                  {product?.variations?.variation_price ? (
                    <span className="text-sm ml-2 line-through text-gray-400">
                      $ {product?.variations?.variation_price}
                    </span>
                  ) : (
                    <span className="text-sm ml-2 line-through text-gray-400">
                      $ {product?.product_price}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div></div>
          </Link>
        ))}
      </div>
      <div className="py-3">
        <PaginationWithPageBtn />
      </div>
    </>
  );
};

export default ProductInfo;
