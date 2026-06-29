"use client";
import { Button } from "@/components/ui/button";
import Contain from "@/components/common/Contain";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { BASE_URL } from "@/components/utils/baseURL";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
const AllBrand = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);

  const { data: allBrands = [], isLoading } = useQuery({
    queryKey: [`/api/v1/brand?page=${page}&limit=${limit}`],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/brand?page=${page}&limit=${limit}`,
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

  if (!isLoading && (!allBrands?.data || allBrands?.data?.length === 0)) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6   shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No trending products available"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h3 className=" font-semibold text-gray-800 mb-2">
          No Brand Available!
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn’t find any Brand right now. Please check back later or
          explore our other exciting products.
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
        <h2 className="pb-4 sm:pb-6 text-text-default">All Brand</h2>
      </div>
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3  lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-y-6">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="group block overflow-hidden">
                <div>
                  <Skeleton height={250} />
                </div>
                <div className=" bg-white py-3 px-2 ">
                  <Skeleton height={20} width="50%" className="mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3  lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-y-6">
              {allBrands?.data?.map((brand, index) => (
                <Link
                  key={index}
                  href={`/all-brands/brand-product/${brand?._id}`}
                  className="group block overflow-hidden"
                >
                  <div className="">
                    <img
                      src={
                        brand?.brand_logo || "/assets/images/placeholder.jpg"
                      } // Fallback image
                      alt={brand?.brand_name || "Brand Image"}
                      className="w-full object-cover group-hover:scale-125 transition-transform duration-300 h-[250px]"
                    />
                  </div>
                  {/* product details */}
                  <div className="relative bg-white py-3 px-2">
                    <h3 className="text-sm text-gray-700 group-hover:underline group-hover:underline-offset-4 line-clamp-1 text-center uppercase">
                      {brand?.brand_name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
            {/* <div className="py-3">
              <PaginationWithPageBtn
                page={page}
                setPage={setPage}
                rows={limit}
                setRows={setLimit}
                totalData={totalData}
              />
            </div> */}
          </div>
        )}
      </div>
    </Contain>
  );
};

export default AllBrand;
