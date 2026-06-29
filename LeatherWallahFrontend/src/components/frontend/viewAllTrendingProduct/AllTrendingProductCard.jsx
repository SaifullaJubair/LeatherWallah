import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";
import ProductSectionSkeleton from "@/components/shared/loader/ProductSectionSkeleton";
import { isHexColor, lineThroughPrice, productPrice } from "@/utils/helper";
import useGetSettingData from "@/components/lib/getSettingData";
import { averageRatingStar } from "@/utils/average";

const AllTrendingProductCard = ({
  products,
  isLoading,
  page,
  setPage,
  limit,
  setLimit,
  totalData,
}) => {
  const { data: settingsData } = useGetSettingData();

  const currencySymbol = settingsData?.data[0];

  return (
    <>
      {isLoading ? (
        <ProductSectionSkeleton />
      ) : (
        <div>
          <div className="grid grid-cols-2   lg:grid-cols-4 gap-4 md:gap-y-6">
            {products?.map((product, index) => (
              <Link
                key={index}
                href={`/products/${product?.product_slug}`}
                className="group block overflow-hidden"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  {product?.main_video ? (
                    <video
                      src={product.main_video}
                      autoPlay
                      loop
                      muted
                      //
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-125 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={
                        product?.main_image || "/assets/images/placeholder.jpg"
                      } // Fallback image
                      alt={product?.product_name || "Product Image"}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-125 transition-transform duration-300"
                    />
                  )}
                </div>
                {/* product details */}
                <div className="relative bg-white py-3 px-2">
                  <h3 className="text-sm text-gray-700 group-hover:underline group-hover:underline-offset-4 line-clamp-1">
                    {product?.product_name}
                  </h3>
                  {/* Price Section */}
                  <div className="mt-3 flex flex-wrap-reverse flex-col-reverse gap-y-1 sm:flex-row sm:justify-between text-sm lg:text-base mb-1.5 ">
                    <p className="tracking-wide whitespace-nowrap">
                      <span className="text-sm font-semibold">
                        {currencySymbol?.currency_symbol}

                        {productPrice(product)}
                      </span>
                      {lineThroughPrice(product) && (
                        <span className="text-xs ml-1 line-through text-gray-400">
                          {currencySymbol?.currency_symbol}
                          {lineThroughPrice(product)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 flex flex-wrap items-center">
                      {/* Filter and get hex color attributes */}
                      {product?.attributes_details?.attribute_values
                        ?.filter((color) =>
                          isHexColor(color?.attribute_value_code)
                        )
                        ?.slice(0, 4) // Show only the first 4 colors
                        ?.map((color) => (
                          <span
                            key={color?._id}
                            className="w-4  h-4 lg:w-5 lg:h-5 inline-block rounded-full border border-gray-300 mr-1"
                            style={{
                              backgroundColor: color?.attribute_value_code,
                            }}
                            title={color?.attribute_value_name}
                          />
                        ))}

                      {/* Show count of remaining colors if more than 4 exist */}
                      {product?.attributes_details?.attribute_values?.filter(
                        (color) => isHexColor(color?.attribute_value_code)
                      )?.length > 4 && (
                        <span className="w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 ml-1">
                          +
                          {product?.attributes_details?.attribute_values?.filter(
                            (color) => isHexColor(color?.attribute_value_code)
                          ).length - 4}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="py-3">
            <PaginationWithPageBtn
              page={page}
              setPage={setPage}
              rows={limit}
              setRows={setLimit}
              totalData={totalData}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AllTrendingProductCard;
