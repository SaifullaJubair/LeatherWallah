"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiArrowRight } from "react-icons/fi";
import { BASE_URL } from "@/components/utils/baseURL";
import { SectionHeader } from "../trendingProduct/TrendingProduct";
import ProductCardSkeleton from "@/components/common/ProductCardSkeleton";
import ProductCard from "@/components/common/ProductCard";

const CategoryWiseProduct = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/product/just_for_you_product`)
      .then((r) => r.json())
      .then((r) => setData(r?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-10 md:py-14 bg-gray-50">
        <div className="max-w-[98%] mx-auto px-2">
          <div className="h-9 w-56 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="flex flex-col gap-8">
            {[0, 1].map((i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-5 lg:grid-cols-6 gap-4">
                {/* category card skeleton */}
                <div className="sm:col-span-2 aspect-[4/3] sm:aspect-auto sm:min-h-[320px] bg-gray-200 rounded-2xl animate-pulse" />
                {/* product cards skeleton */}
                <div className="sm:col-span-3 lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ProductCardSkeleton count={3} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data?.length) return null;

  return (
    <section className="py-10 md:py-14 bg-gray-50">
      <div className="max-w-[98%] mx-auto px-2">
        <SectionHeader label="Shop by" accent="Category" />
        <div className="flex flex-col gap-10">
          {data.map((group, index) => (
            <CategoryGroup key={index} group={group} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const CategoryGroup = ({ group, index }) => {
  const prevId = `cat-prev-${index}`;
  const nextId = `cat-next-${index}`;

  return (
    // sm: 5 cols (cat=2, products=3) | lg: 6 cols (cat=2, products=4)
    <div className="grid grid-cols-1 sm:grid-cols-5 lg:grid-cols-6 gap-4 items-stretch">

      {/* ── Category card — 2 cols wide ── */}
      <Link
        href={`/category/${group?.categoryDetails?.category_slug}`}
        className="sm:col-span-2 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 aspect-[4/3] sm:aspect-auto sm:min-h-[320px] flex flex-col justify-end"
      >
        {group?.categoryDetails?.category_logo && (
          <Image
            src={group.categoryDetails.category_logo}
            alt={group?.categoryDetails?.category_name || "Category"}
            fill
            className="object-cover opacity-90 group-hover:scale-105 transition-all duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 33vw"
          />
        )}

        {/* Gradient overlay — soft, only deep enough at the bottom to keep text
            readable (was an almost-black wash that made the card look dark). */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Text */}
        <div className="relative z-10 p-5">
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-medium mb-1.5">
            Collection
          </p>
          <h3 className="text-white font-bold text-lg sm:text-xl leading-tight mb-4">
            {group?.categoryDetails?.category_name}
          </h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-white font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-200 border border-white/30">
            Shop Now <FiArrowRight size={12} />
          </span>
        </div>

        {/* Product count badge */}
        {group?.products?.length > 0 && (
          <span className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {group.products.length}+ items
          </span>
        )}
      </Link>

      {/* ── Products slider — 3 cols on sm, 4 cols on lg ── */}
      <div className="sm:col-span-3 lg:col-span-4 relative px-6">
        <Swiper
          modules={[Navigation, Autoplay]}
          slidesPerView={2}
          spaceBetween={12}
          breakpoints={{
            480:  { slidesPerView: 2, spaceBetween: 12 },
            640:  { slidesPerView: 3, spaceBetween: 14 },
            1280: { slidesPerView: 3, spaceBetween: 14 },
          }}
          navigation={{ nextEl: `.${nextId}`, prevEl: `.${prevId}` }}
          autoplay={{ delay: 4000 + index * 400, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop={group?.products?.length > 3}
        >
          {group?.products?.map((product) => (
            <SwiperSlide key={product._id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button className={`${prevId} absolute left-0 top-[40%] -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 -translate-x-1`}>
          <FaAngleLeft className="text-xs" />
        </button>
        <button className={`${nextId} absolute right-0 top-[40%] -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 translate-x-1`}>
          <FaAngleRight className="text-xs" />
        </button>
      </div>
    </div>
  );
};

export default CategoryWiseProduct;
