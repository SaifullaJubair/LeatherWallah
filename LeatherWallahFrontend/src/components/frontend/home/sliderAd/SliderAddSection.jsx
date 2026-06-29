"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image"; // Next.js Image Component
import { images } from "@/components/utils/ImageImport";
import Link from "next/link";

const SliderAdSection = ({ sliderData }) => {
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
        {sliderData.map((slider, i) => (
          <SwiperSlide key={slider?._id || i}>
            <Link href={slider?.slider_path || "#"}>
              <div className="relative">
                <Image
                  src={slider?.slider_image || images.ad}
                  alt={`Slider ${i}`}
                  width={1200}
                  height={200}
                  className="w-full h-72 object-cover      "
                />
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SliderAdSection;
