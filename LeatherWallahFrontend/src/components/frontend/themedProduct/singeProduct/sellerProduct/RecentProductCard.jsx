"use client";
import useGetSettingData from "@/components/lib/getSettingData";
import Image from "next/image";

import Link from "next/link";

const RecentProductCard = ({ product }) => {
  const { data: settingsData } = useGetSettingData();

  // console.log(product)
  return (
    <div className="  transition duration-500 ">
      <Link
        href={`/products/${product?.product_slug}`}
        className="group block overflow-hidden"
      >
        <div className="relative aspect-[2/3] overflow-hidden w-full  ">
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
            <Image
              fill
              src={product?.main_image || "/assets/images/placeholder.jpg"} // Fallback image
              alt={product?.product_name || "Product Image"}
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-125 transition-transform duration-300"
            />
          )}
        </div>

        <div className="relative bg-white py-3 px-2">
          <h3 className="text-sm text-gray-700 group-hover:underline group-hover:underline-offset-4 line-clamp-1">
            {product?.product_name}
          </h3>
        </div>
      </Link>
    </div>
  );
};

export default RecentProductCard;
