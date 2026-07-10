"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import Image from "next/image";
import Link from "next/link";
import { images } from "@/components/utils/ImageImport";
import Contain from "@/components/common/Contain";
import { toInternalPath } from "@/components/utils/internalPath";

const PLACEHOLDER_BANNERS = [
  {
    _id: "ph1",
    banner_image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1400&q=80",
    banner_title: "Fresh Fruits Delivered Daily",
    banner_path: "/shop",
  },
  {
    _id: "ph2",
    banner_image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1400&q=80",
    banner_title: "Premium Snacks Collection",
    banner_path: "/shop",
  },
  {
    _id: "ph3",
    banner_image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=1400&q=80",
    banner_title: "Healthy & Delicious",
    banner_path: "/shop",
  },
];

const BannerItem = ({ bannerData }) => {
  const items = bannerData?.length ? bannerData : PLACEHOLDER_BANNERS;

  return (
    <div className="w-full pt-4 md:pt-6">
      <Contain>
        <Swiper
          modules={[Pagination, Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{
            clickable: true,
            renderBullet: (_, className) =>
              `<span class="${className} !w-6 !h-1.5 !rounded-sm !bg-white/50 [&.swiper-pagination-bullet-active]:!bg-white [&.swiper-pagination-bullet-active]:!w-8 transition-all duration-300"></span>`,
          }}
          loop={true}
          slidesPerView={1}
          className="w-full rounded-3xl overflow-hidden shadow-sm"
        >
        {items?.map((banner, i) => {
          // Admin stores whatever was typed — often a full URL, sometimes a bare
          // hostname (which would resolve relative to the current page and 404).
          const href = toInternalPath(banner?.banner_path);
          return (
          <SwiperSlide key={banner?._id || i}>
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/6] overflow-hidden bg-gray-900">
              {/* PERF: slide 0 is the LCP element on the homepage. It gets
                  priority + fetchPriority="high" so Next emits a <link rel=preload
                  fetchpriority=high> and the browser starts it alongside the CSS
                  instead of after. It also skips `placeholder="blur"` — decoding the
                  base64 blur is extra main-thread work on the one image we want
                  painted first, and the slide already sits on a bg-gray-900 backdrop.
                  `sizes` matches the real render width (full-bleed inside Contain),
                  so we don't download a 1600px file for a 360px phone. */}
              <Image
                src={banner?.banner_image}
                alt={banner?.banner_title || `Banner ${i + 1}`}
                fill
                className="object-cover opacity-90"
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 92vw, 1200px"
                {...(i === 0
                  ? { priority: true, fetchPriority: "high" }
                  : {
                      loading: "lazy",
                      placeholder: "blur",
                      blurDataURL: images.loadingProductImg,
                    })}
              />
              {/* gradient overlay — slightly deeper for readable text */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

              {/* Text + CTA */}
              {banner?.banner_title && (
                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-20">
                  <p className="text-white/80 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-2">
                    Leather Wallah
                  </p>
                  <h2 className="text-white font-extrabold text-2xl sm:text-3xl md:text-5xl leading-tight max-w-xl mb-5 drop-shadow">
                    {banner.banner_title}
                  </h2>
                  {href && (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all hover:scale-[1.03] w-fit shadow-lg shadow-primary-500/30"
                    >
                      Shop Now →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </SwiperSlide>
          );
        })}
        </Swiper>
      </Contain>
    </div>
  );
};

export default BannerItem;
