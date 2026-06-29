"use client";

import useGetTrendingProducts from "@/components/lib/getTrendingProducts";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import TrendingSlider from "./TrendingSlider";
import { titleFont } from "@/utils/font";

const TrendingProduct = () => {
  const { data: products = [], isLoading } = useGetTrendingProducts();
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="max-w-[98%] mx-auto px-2">
        <SectionHeader
          label="Trending"
          accent="Products"
          href="/shop?sort=trending"
          linkText="All Trending"
        />
        <TrendingSlider products={products?.data?.data} isLoading={isLoading} />
      </div>
    </section>
  );
};

export const SectionHeader = ({ label, accent, href, linkText }) => (
  <div className="flex items-center justify-between mb-6 md:mb-8">
    <div className="flex items-center gap-3">
      <span className="w-1 h-7 bg-primary rounded-full inline-block flex-shrink-0" />
      <h2
        className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-tight"
        style={{ fontFamily: titleFont.style.fontFamily }}
      >
        {label}{" "}
        <span className="text-primary">{accent}</span>
      </h2>
    </div>
    {href && (
      <Link
        href={href}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-600 transition-colors whitespace-nowrap group"
      >
        <span className="hidden sm:inline">{linkText || "View All"}</span>
        <span className="sm:hidden">All</span>
        <FiArrowRight className="text-base group-hover:translate-x-0.5 transition-transform" />
      </Link>
    )}
  </div>
);

export default TrendingProduct;
