import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";
import useGetSettingData from "@/components/lib/getSettingData";
import ProductSectionSkeleton from "@/components/shared/loader/ProductSectionSkeleton";
import { averageRatingStar } from "@/utils/average";
import { isHexColor, lineThroughPrice, productPrice } from "@/utils/helper";

import Image from "next/image";
import Link from "next/link";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";

const ShowAllProduct = ({
  products,
  isLoading,
  page,
  setPage,
  rows,
  setRows,
  totalData,
  gridView,
  gridClass,
}) => {
  const { data: settingsData } = useGetSettingData();

  const currencySymbol = settingsData?.data[0];
  return (
    <>
      {isLoading ? (
        <ProductSectionSkeleton />
      ) : (
        <div>
          <div
            className={
              gridClass ||
              "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            }
          >
            {products?.map((product, index) => (
              <Link
                href={`/products/${product?.product_slug}`}
                className="group block"
                key={index}
              >
                {/* Image */}
                <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-50">
                  {product?.main_video ? (
                    <video
                      src={product.main_video}
                      autoPlay
                      loop
                      muted
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Image
                      fill
                      src={
                        product?.main_image || "/assets/images/placeholder.jpg"
                      }
                      alt={product?.product_name || "Product Image"}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product?.is_variation && (
                      <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 tracking-wide">
                        VARIATION
                      </span>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Quick view on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 tracking-widest uppercase">
                    View Details
                  </div>
                </div>

                {/* Info */}
                <div className="bg-white pt-3 pb-2 px-1 border-b-2 border-transparent group-hover:border-primary-500 transition-colors duration-300">
                  <h3 className="text-sm text-gray-800 line-clamp-1 mb-2">
                    {product?.product_name}
                  </h3>

                  {/* Colors */}
                  <div className="flex items-center gap-1 mb-2 h-4">
                    {product?.attributes_details?.attribute_values
                      ?.filter((c) => isHexColor(c?.attribute_value_code))
                      ?.slice(0, 4)
                      ?.map((color) => (
                        <span
                          key={color?._id}
                          className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                          style={{
                            backgroundColor: color?.attribute_value_code,
                          }}
                          title={color?.attribute_value_name}
                        />
                      ))}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {currencySymbol?.currency_symbol}
                      {productPrice(product)}
                    </span>
                    {lineThroughPrice(product) && (
                      <span className="text-xs line-through text-gray-400">
                        {currencySymbol?.currency_symbol}
                        {lineThroughPrice(product)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <PaginationWithPageBtn
            page={page}
            setPage={setPage}
            rows={rows}
            setRows={setRows}
            totalData={totalData}
          />
        </div>
      )}
    </>
  );
};

export default ShowAllProduct;
