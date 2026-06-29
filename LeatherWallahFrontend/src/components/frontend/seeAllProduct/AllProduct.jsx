// scr/components/frontend/seeAllProduct/AllProduct.jsx
"use client";
import { Suspense } from "react";
import Contain from "@/components/common/Contain";
import { useEffect, useState, useMemo } from "react";
import ShowAllProduct from "./ShowAllProduct";
import { useGetAllProductAndSearchProduct } from "@/components/lib/getAllProductandSearchProduct";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderOverlay } from "@/components/shared/loader/LoaderOverlay";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BsGrid, BsGrid3X3Gap } from "react-icons/bs";
import { FiList, FiSearch, FiX } from "react-icons/fi";
import { titleFont } from "@/utils/font";

const AllProduct = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [limit, setLimit] = useState(12);
  const [sortBy, setSortBy] = useState("newest");
  const [gridView, setGridView] = useState("grid"); // "grid" | "grid-large" | "list"

  const searchParams = useSearchParams();
  const search = searchParams?.get("search");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (search) {
      setSearchTerm(search);
      setLocalSearch(search);
    }
  }, [search]);

  const handleResetSearch = () => {
    router.push(pathname);
    setSearchTerm("");
    setLocalSearch("");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(localSearch);
    setPage(1);
  };

  const { data: allProducts, isLoading } = useGetAllProductAndSearchProduct({
    page,
    limit,
    searchTerm,
  });

  // Sort products frontend side
  const sortedProducts = useMemo(() => {
    if (!allProducts?.data) return [];
    const products = [...allProducts.data];
    switch (sortBy) {
      case "price-low":
        return products.sort((a, b) => {
          const priceA =
            a.product_discount_price ||
            a.variations?.variation_discount_price ||
            a.product_price ||
            a.variations?.variation_price ||
            0;
          const priceB =
            b.product_discount_price ||
            b.variations?.variation_discount_price ||
            b.product_price ||
            b.variations?.variation_price ||
            0;
          return priceA - priceB;
        });
      case "price-high":
        return products.sort((a, b) => {
          const priceA =
            a.product_discount_price ||
            a.variations?.variation_discount_price ||
            a.product_price ||
            a.variations?.variation_price ||
            0;
          const priceB =
            b.product_discount_price ||
            b.variations?.variation_discount_price ||
            b.product_price ||
            b.variations?.variation_price ||
            0;
          return priceB - priceA;
        });
      case "newest":
        return products.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
      case "oldest":
        return products.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      default:
        return products;
    }
  }, [allProducts?.data, sortBy]);

  const title = searchTerm
    ? `Search results for "${searchTerm}"`
    : "All Products";

  // Grid class based on view
  const gridClass = {
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6",
    "grid-large": "grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6",
    list: "flex flex-col gap-4",
  };

  if (!isLoading && (!allProducts || allProducts?.data?.length === 0)) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6 shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No products available"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h4 className="font-semibold text-gray-800 mb-4">
          No Products Available!
        </h4>
        <p className="text-gray-600 mb-6">
          We couldn't find any products right now. Please check back later or
          explore our other exciting products.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {searchTerm && (
            <Button variant="outline" onClick={handleResetSearch}>
              Reset Search
            </Button>
          )}
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <Contain>
          <div className="p-6 md:py-8">
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-800 mb-1"
              style={{ fontFamily: titleFont.style.fontFamily }}
            >
              {searchTerm ? (
                <>
                  Search:{" "}
                  <span className="text-primary-500">"{searchTerm}"</span>
                </>
              ) : (
                <>
                  All <span className="text-primary-500">Products</span>
                </>
              )}
            </h1>
            {allProducts?.totalData > 0 && (
              <p className="text-sm text-gray-400">
                {allProducts?.totalData} products found
              </p>
            )}
          </div>
        </Contain>
      </div>

      <Contain>
        <div className="py-6">
          {/* Toolbar */}
          <div className="bg-white border border-gray-100 px-4 py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Left: Search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <div className="relative flex-1 sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 focus:outline-none focus:border-primary-400 bg-gray-50"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2 py-2"
              >
                Search
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2 py-2"
                >
                  <FiX className="text-sm" />
                </button>
              )}
            </form>

            {/* Right: Sort + Grid toggle */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-200 px-3 py-2 bg-gray-50 focus:outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {/* Grid toggle */}
              <div className="flex items-center border border-gray-200">
                <button
                  onClick={() => setGridView("grid")}
                  className={`p-2 transition-colors ${gridView === "grid" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-gray-600 hidden md:flex"}`}
                  title="Small Grid"
                >
                  <BsGrid3X3Gap className="text-sm" />
                </button>
                <button
                  onClick={() => setGridView("grid-large")}
                  className={`p-2 transition-colors ${gridView === "grid-large" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
                  title="Large Grid"
                >
                  <BsGrid className="text-sm" />
                </button>
                <button
                  onClick={() => setGridView("list")}
                  className={`p-2 transition-colors ${gridView === "list" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-gray-600 md:hidden"}`}
                  title="List View"
                >
                  <FiList className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Products */}
          <ShowAllProduct
            products={sortedProducts}
            isLoading={isLoading}
            page={page}
            setPage={setPage}
            rows={limit}
            setRows={setLimit}
            totalData={allProducts?.totalData}
            gridView={gridView}
            gridClass={gridClass[gridView]}
          />
        </div>
      </Contain>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<LoaderOverlay />}>
      <AllProduct />
    </Suspense>
  );
}
