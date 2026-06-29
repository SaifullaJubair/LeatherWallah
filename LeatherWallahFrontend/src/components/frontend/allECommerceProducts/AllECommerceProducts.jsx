"use client";
import Contain from "@/components/common/Contain";
import AllECommerceSingeProductCard from "./AllCategoryProduct";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@/components/utils/baseURL";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const AllECommerceProducts = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: allCategoryProducts = [], isLoading } = useQuery({
    queryKey: [
      `/api/v1/product/top_selling?page=${page}&limit=${limit}`,
    ],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/product/top_selling?page=${page}&limit=${limit}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`
          );
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
  });

  if (
    !isLoading &&
    (!allCategoryProducts?.data ||
      allCategoryProducts?.data?.data?.length === 0)
  ) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6   shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No ecommerce product available"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h3 className=" font-semibold text-gray-800 mb-2">
          No E-Commerce Products Available!
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn’t find any E-Commerce products right now. Please check back
          later or explore our other exciting products.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Link href="/">
            <Button className="w-full">Go Home</Button>
          </Link>

          <Link href="/all-products">
            <Button variant="secondary" className="w-full">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <Contain>
      <div className="flex justify-between mt-4 sm:mt-6">
        <h2 className="pb-4 text-text-default">All E-Commerce Product</h2>
      </div>
      <AllECommerceSingeProductCard
        products={allCategoryProducts?.data?.data}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        totalData={allCategoryProducts?.data?.totalData}
      />
    </Contain>
  );
};

export default AllECommerceProducts;
