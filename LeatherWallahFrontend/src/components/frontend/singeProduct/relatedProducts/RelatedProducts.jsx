"use client";
import Link from "next/link";
import Image from "next/image";
import useGetRelatedProducts from "@/components/lib/getRelatedProduct";
import { isHexColor, lineThroughPrice, productPrice } from "@/utils/helper";
import ProductSectionSkeleton from "@/components/shared/loader/ProductSectionSkeleton";
import useGetSettingData from "@/components/lib/getSettingData";

const RelatedProducts = ({ product_slug }) => {
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data[0]?.currency_symbol;
  const { data: relatedProduct, isLoading } = useGetRelatedProducts({
    product_slug,
  });

  if (isLoading) return <ProductSectionSkeleton />;
  if (!relatedProduct?.data?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {relatedProduct?.data?.map((product, index) => {
        const price = productPrice(product);
        const ltPrice = lineThroughPrice(product);
        const discountPct =
          ltPrice && price
            ? Math.round(((ltPrice - price) / ltPrice) * 100)
            : 0;
        const colors = product?.attributes_details?.attribute_values?.filter(
          (c) => isHexColor(c?.attribute_value_code),
        );

        return (
          <Link
            href={`/products/${product?.product_slug}`}
            key={index}
            className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 block"
          >
            {/* Image */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50">
              {/* Discount badge */}
              {discountPct > 0 && (
                <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  -{discountPct}%
                </div>
              )}

              {product?.main_video ? (
                <video
                  src={product.main_video}
                  autoPlay
                  loop
                  muted
                  className="absolute inset-0 w-full h-full object-cover group-hover:opacity-0 transition-opacity duration-300"
                />
              ) : (
                <Image
                  fill
                  src={product?.main_image || "/assets/images/placeholder.jpg"}
                  alt={product?.product_name || "Product"}
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              {/* Hover image */}
              {product?.other_images?.[0]?.other_image && (
                <Image
                  fill
                  src={product.other_images[0].other_image}
                  alt="hover"
                  className="absolute inset-0 object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              )}
            </div>

            {/* Info */}
            <div className="p-2.5">
              <p className="text-xs text-gray-800 line-clamp-2 font-medium leading-snug mb-2 group-hover:text-primary transition-colors">
                {product?.product_name}
              </p>

              {/* Colors */}
              {colors?.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  {colors.slice(0, 4).map((c) => (
                    <span
                      key={c?._id}
                      className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
                      style={{ backgroundColor: c?.attribute_value_code }}
                      title={c?.attribute_value_name}
                    />
                  ))}
                  {colors.length > 4 && (
                    <span className="text-[10px] text-gray-500">
                      +{colors.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-gray-900">
                  {currencySymbol}
                  {price}
                </span>
                {ltPrice && (
                  <span className="text-[11px] line-through text-gray-400">
                    {currencySymbol}
                    {ltPrice}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default RelatedProducts;
