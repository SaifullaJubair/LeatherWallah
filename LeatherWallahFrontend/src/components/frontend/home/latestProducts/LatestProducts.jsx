"use client";

import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@/components/utils/baseURL";
import Link from "next/link";
import LatestProductGrid from "./LatestProductGrid";
import { SectionHeader } from "../trendingProduct/TrendingProduct";

const LatestProducts = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["new_arrival_products"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/new_arrival?page=1&limit=8`);
      return res.json();
    },
  });

  return (
    <section className="py-10 md:py-14 bg-gray-50">
      <div className="max-w-[98%] mx-auto px-2">
        <SectionHeader
          label="New"
          accent="Arrival"
          href="/shop"
          linkText="All Products"
        />
        <LatestProductGrid products={data?.data} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default LatestProducts;
