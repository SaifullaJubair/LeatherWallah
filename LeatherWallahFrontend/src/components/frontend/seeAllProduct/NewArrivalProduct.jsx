"use client";
import { Suspense } from "react";
import Contain from "@/components/common/Contain";
import { useEffect, useState } from "react";
import ShowAllProduct from "./ShowAllProduct";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderOverlay } from "@/components/shared/loader/LoaderOverlay";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAllNewArrivalProduct } from "@/components/lib/getAllNewArrivalProduct";

const NewArrivalProduct = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(10);

  const searchParams = useSearchParams(); // Get search parameters
  const search = searchParams?.get("search");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (search) {
      setSearchTerm(search);
    }
  }, [search]);
  const handleResetSearch = () => {
    router.push(pathname); // Removes all search parameters
    setSearchTerm("");
  };
  const title = searchTerm
    ? `Search results for "${searchTerm}"`
    : "New Arrival Products";
  const { data: allProducts, isLoading } = getAllNewArrivalProduct({
    page,
    limit,
    searchTerm,
  });
  if (!isLoading && (!allProducts || allProducts?.data?.length === 0)) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6   shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No products available"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h4 className=" font-semibold text-gray-800 mb-4">
          No Products Available!
        </h4>
        <p className="text-gray-600 mb-6">
          We couldn’t find any products right now. Please check back later or
          explore our other exciting products.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Link href="/">
            <Button className="w-full">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Contain>
      <div className="flex flex-wrap items-center mb-4 gap-6 mt-4 sm:mt-6">
        <h2 className="pb-4 text-text-default">
          <span>{title}</span>
        </h2>
        {searchTerm && (
          <Button
            variant="outline"
            className="text-sm"
            onClick={handleResetSearch}
          >
            Reset
          </Button>
        )}
      </div>
      <ShowAllProduct
        products={allProducts?.data}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        rows={limit}
        setRows={setLimit}
        totalData={allProducts?.totalData}
      />
    </Contain>
  );
};

// export default AllProduct;

export default function Page() {
  return (
    <Suspense fallback={<LoaderOverlay />}>
      <NewArrivalProduct />
    </Suspense>
  );
}
