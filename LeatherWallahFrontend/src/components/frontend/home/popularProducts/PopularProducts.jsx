"use client";

import ProductCard from "@/components/common/ProductCard";
import ProductCardSkeleton from "@/components/common/ProductCardSkeleton";
import { BASE_URL } from "@/components/utils/baseURL";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SectionHeader } from "../trendingProduct/TrendingProduct";

const PopularProducts = () => {
  const [limit, setLimit] = useState(8);

  const { data: products = [], isLoading } = useQuery({
    queryKey: [`top_selling_${limit}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/top_selling?page=1&limit=${limit}`);
      return res.json();
    },
  });

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="max-w-[98%] mx-auto px-2">
        <SectionHeader label="Best" accent="Sellers" href="/shop?sort=popular" linkText="View All" />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            <ProductCardSkeleton count={8} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products?.data?.map((product) => (
              <ProductCard key={product?._id} product={product} />
            ))}
          </div>
        )}

        {products?.totalData > limit && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setLimit((p) => p + 8)}
              className="px-8 py-2.5 border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all duration-200"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularProducts;
