"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image"; // Next.js Image Component
import { Button } from "@/components/ui/button";
import { images } from "@/components/utils/ImageImport";
import { Suspense } from "react";
import ProductSectionSkeleton from "@/components/shared/loader/ProductSectionSkeleton";

const MobileBanner = ({ bannerData }) => {
  return (
    <div className="w-full">
      <Swiper
        modules={[Pagination, Autoplay]}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        loop={true}
        spaceBetween={10}
        slidesPerView={1}
        className="w-full"
      >
        <Suspense fallback={<ProductSectionSkeleton />}></Suspense>
        {bannerData?.map((banner, i) => (
          <SwiperSlide key={banner?._id || i}>
            <div className="relative">
              {/* Next.js Image component for optimized images */}
              <Image
                src={banner?.banner_image || "/placeholder.jpg"} // Fallback for missing image
                alt={`Banner ${i}`}
                width={1200} // Specify width for Image optimization
                height={600} // Specify height for Image optimization
                className="w-full h-80 object-cover  "
                placeholder="blur"
                blurDataURL={images.loadingProductImg}
              />
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-white bg-black bg-opacity-50 px-4 py-2 rounded-md">
                <h2 className="text-lg md:text-xl lg:text-2xl text-slate-300 font-bold">
                  {banner?.banner_title || "Made for creating tasty memories"}
                </h2>
              </div>
              {/* Shop Now button */}
              <Button className="absolute bottom-8 left-1/2 transform -translate-x-1/2   ">
                <a
                  href={banner?.banner_path || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  // className="hover:underline"
                >
                  Shop Now
                </a>
              </Button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MobileBanner;
