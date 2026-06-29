"use client";
import Image from "next/image";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import {
  Navigation,
  Scrollbar,
  A11y,
  Keyboard,
  Parallax,
  Autoplay,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/bundle";
import Link from "next/link";
import { calculatePrice } from "@/utils/helper";

const getFlashPrice = (product, flash_price, flash_price_type) => {
  if (!flash_price || !flash_price_type) return null;
  const basePrice = product?.is_variation
    ? product?.variations?.[0]?.variation_price
    : product?.product_price;
  if (!basePrice) return null;
  return calculatePrice(basePrice, flash_price, flash_price_type);
};

const getOriginalPrice = (product) => {
  if (product?.is_variation) return product?.variations?.[0]?.variation_price;
  return product?.product_price;
};

const FlashProductSlider = ({ products, currencySymbol = "৳" }) => {
  return (
    <Swiper
      modules={[Navigation, Scrollbar, A11y, Keyboard, Parallax, Autoplay]}
      slidesPerView={2}
      spaceBetween={20}
      loop={true}
      autoplay={{
        delay: 3000,
        pauseOnMouseEnter: true,
        reverseDirection: true,
      }}
      keyboard={{ enabled: true }}
      breakpoints={{
        640: { slidesPerView: 2 },
        768: { slidesPerView: 4 },
        1024: { slidesPerView: 5 },
        1280: { slidesPerView: 6 },
      }}
      className="flex-1 ml-6 cursor-grab"
    >
      {products?.map((item) => {
        const product = item?.flash_sale_product;
        const flashPrice = getFlashPrice(
          product,
          item?.flash_price,
          item?.flash_price_type,
        );
        const originalPrice = getOriginalPrice(product);
        const displayPrice = flashPrice ?? originalPrice;

        return (
          <SwiperSlide
            key={product?._id}
            className="bg-white shadow-md border-primary-100 border hover:shadow-lg transition-shadow duration-300 h-[400px]"
          >
            <Link href={`/products/${product?.product_slug}`}>
              <div className="relative p-2 group">
                <Image
                  src={product?.main_image}
                  alt={product?.product_name}
                  width={200}
                  height={200}
                  className="w-full h-44 xl:h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 flex flex-col justify-between h-[calc(360px-200px)]">
                <div>
                  <h5 className="mt-2 font-semibold line-clamp-2">
                    {product?.product_name}
                  </h5>
                  <p className="text-sm text-gray-500">
                    {product?.brand?.brand_name}
                  </p>
                </div>
                <div>
                  <div className="flex items-center mt-2">
                    {Array.from({ length: 5 }, (_, index) => {
                      if (item?.rating > index)
                        return <FaStar key={index} className="text-yellow-400" />;
                      return (
                        <FaStarHalfAlt key={index} className="text-yellow-400" />
                      );
                    })}
                    <span className="ml-2 text-sm text-gray-500">
                      ({item?.reviews})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-lg font-semibold text-primary">
                      {currencySymbol}
                      {displayPrice}
                    </span>
                    {flashPrice && originalPrice && flashPrice < originalPrice && (
                      <span className="text-sm line-through text-gray-400">
                        {currencySymbol}
                        {originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default FlashProductSlider;
