"use client";

import Contain from "@/components/common/Contain";
import { BASE_URL } from "@/components/utils/baseURL";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import JustForYouProductDetails from "./JustForYouProductDetails";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const JustForYouAllProduct = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const { data: justForYouProducts = [], isLoading } = useQuery({
    queryKey: [
      `/api/v1/product/just_for_you_product?page=${page}&limit=${limit}`,
    ],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/product/just_for_you_product?page=${page}&limit=${limit}`,
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
    (!justForYouProducts?.data || justForYouProducts?.data?.data?.length === 0)
  ) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6   shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No Latest product available"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h3 className=" font-semibold text-gray-800 mb-2">
          No Latest Products Available!
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn’t find any Latest products right now. Please check
          back later or explore our other exciting products.
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
        <h2 className="pb-4 sm:pb-6 text-text-default">
          All Latest Product
        </h2>
      </div>
      <JustForYouProductDetails
        products={justForYouProducts?.data?.data}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        totalData={justForYouProducts?.data?.totalData}
      />
    </Contain>
  );
};

export default JustForYouAllProduct;
