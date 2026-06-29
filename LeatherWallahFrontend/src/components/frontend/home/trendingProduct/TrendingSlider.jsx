"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import ProductCardSkeleton from "@/components/common/ProductCardSkeleton";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ProductCard from "@/components/common/ProductCard";

const TrendingSlider = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
        <ProductCardSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="relative px-4">
      <Swiper
        modules={[Navigation, Autoplay, Keyboard]}
        slidesPerView={2}
        spaceBetween={12}
        breakpoints={{
          640:  { slidesPerView: 2, spaceBetween: 14 },
          768:  { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 20 },
          1280: { slidesPerView: 5, spaceBetween: 20 },
        }}
        navigation={{ nextEl: ".trend-next", prevEl: ".trend-prev" }}
        autoplay={{ delay: 3200, pauseOnMouseEnter: true, disableOnInteraction: false }}
        keyboard={{ enabled: true }}
        loop={true}
      >
        {products?.map((product) => (
          <SwiperSlide key={product?._id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      <button className="trend-prev absolute left-0 top-[40%] -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 -translate-x-1">
        <FaAngleLeft className="text-sm" />
      </button>
      <button className="trend-next absolute right-0 top-[40%] -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 translate-x-1">
        <FaAngleRight className="text-sm" />
      </button>
    </div>
  );
};

export default TrendingSlider;
