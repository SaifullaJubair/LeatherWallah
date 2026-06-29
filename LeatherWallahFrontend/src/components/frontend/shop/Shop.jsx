"use client";
// app/popular-products/page.js

import Contain from "@/components/common/Contain";
import useGetSettingData from "@/components/lib/getSettingData";

import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import ProductSectionSkeleton from "@/components/shared/loader/ProductSectionSkeleton";

import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/components/utils/baseURL";
import { averageRatingStar } from "@/utils/average";
import { yatra } from "@/utils/font";
import { isHexColor, lineThroughPrice, productPrice } from "@/utils/helper";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRef, useState } from "react";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";

// Fetch the data dynamically based on the category_id from searchParams
const Shop = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [initialProduct, setInitialProduct] = useState([]);
  const sentinelRef = useRef(null); // Ref for the sentinel element
  const [wishlist, setWishlist] = useState([]);

  const { data: settingsData } = useGetSettingData();

  const currencySymbol = settingsData?.data[0];

  const { data: categoryTypes = [], isLoading: isLoadingCategoryTypes } =
    useQuery({
      queryKey: [`/api/v1/category`],
      queryFn: async () => {
        try {
          const res = await fetch(`${BASE_URL}/category`);
          if (!res.ok) {
            const errorData = await res.text();
            throw new Error(
              `Error: ${res.status} ${res.statusText} - ${errorData}`
            );
          }

          const categoryData = await res.json();
          const data = categoryData?.data;

          // Check products for each category
          // for (const category of data) {
          //   const productRes = await fetch(
          //     `${BASE_URL}/product/top_selling?category_id=${category._id}&page=${page}&limit=${limit}`
          //   );
          //   const productData = await productRes.json();
          //   category.hasProducts = productData?.data?.length > 0;
          // }

          // return data.filter((cat) => cat.hasProducts);
          return data;
        } catch (error) {
          console.error("Fetch error:", error);
          throw error;
        }
      },
    });

  const {
    data: products = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/product/top_selling?category_id=${categoryId}&page=${page}&limit=${limit}`,
    ],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/product/top_selling?category_id=${categoryId}&page=${page}&limit=${limit}`
        );

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`
          );
        }

        const data = await res.json();
        setInitialProduct(data);
        return data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
  });

  const handleLoadMore = () => {
    setLimit((prevLimit) => prevLimit + limit);
    refetch();
  };

  // Infinite scroll logic
  // useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       if (entries[0].isIntersecting) {
  //         setPage((prevPage) => prevPage + 1); // Increment page to fetch more products
  //       }
  //     },
  //     { threshold: 1.0 } // Trigger when the sentinel is fully visible
  //   );

  //   if (sentinelRef.current) {
  //     observer.observe(sentinelRef.current);
  //   }

  //   return () => {
  //     if (sentinelRef.current) {
  //       observer.unobserve(sentinelRef.current);
  //     }
  //   };
  // }, [sentinelRef]);
  useEffect(() => {
    try {
      const existingWishlist =
        JSON.parse(localStorage.getItem("wishlist")) || [];
      setWishlist(existingWishlist);
    } catch (error) {
      console.error("Error parsing wishlist from localStorage", error);
    }
  }, []);

  const handleWishlist = (product) => {
    let existingWishlist = [];
    try {
      existingWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    } catch (error) {
      console.error("Error parsing wishlist from localStorage", error);
    }

    const wishListItem = {
      productId: product?._id,
      variation_product_id: product?.variations?._id || null,
    };

    // Check if the product (with variation) is already in the wishlist
    const isWishlisted = existingWishlist.some(
      (item) =>
        item.productId === wishListItem.productId &&
        item.variation_product_id === wishListItem.variation_product_id
    );

    let updatedWishlist;
    if (isWishlisted) {
      // Remove product from wishlist
      updatedWishlist = existingWishlist.filter(
        (item) =>
          item.productId !== wishListItem.productId ||
          item.variation_product_id !== wishListItem.variation_product_id
      );
      toast.error("Product removed from your wishlist", { autoClose: 1500 });
    } else {
      // Add product to wishlist
      updatedWishlist = [...existingWishlist, wishListItem];
      toast.success("Product added to your wishlist", { autoClose: 1500 });
    }

    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event("localStorageUpdated"));
  };
  return (
    <div className="my-4">
      <div className="max-w-7xl mx-auto w-[95%]">
        {/* Categories on the Right (Scrollable) */}
        <div className="my-6 w-full flex overflow-x-auto scrollbar-hidden">
          <div className="flex items-center gap-3 text-text-semiLight w-max">
            <Button
              onClick={() => setCategoryId("")}
              size="sm"
              variant={categoryId === "" ? "default" : "outline"}
              className={`sm:text-base text-sm whitespace-nowrap border ${
                categoryId === ""
                  ? "bg-primary-500 text-white border-primary-500"
                  : ""
              }`}
            >
              All
            </Button>

            {isLoadingCategoryTypes ? (
              <>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div className="w-20 sm:w-24 h-8 rounded-md" key={i}>
                    <Skeleton height={32} width={80} borderRadius={6} />
                  </div>
                ))}
              </>
            ) : (
              categoryTypes?.map((category) => (
                <Link
                  href={`/category/${category?.category_slug}`}
                  key={category?._id}
                >
                  <Button
                    key={category?._id}
                    onClick={() => setCategoryId(category?._id)}
                    variant={
                      categoryId === category?._id ? "default" : "outline"
                    }
                    size="sm"
                    className={`sm:text-base text-sm whitespace-nowrap border ${
                      categoryId === category?._id
                        ? "bg-primary-500 text-white border-primary-500"
                        : ""
                    }`}
                  >
                    {category?.category_name}
                  </Button>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 space-y-3 gap-2">
          {isLoadingCategoryTypes ? (
            <>
              {Array.from({ length: 10 }).map((_, i) => (
                <div className="flex items-center gap-3">
                  <Skeleton height={70} width={70} />
                  <Skeleton width={120} height={20} />
                </div>
              ))}
            </>
          ) : (
            categoryTypes?.map((category) => (
              <Link
                href={`/category/${category?.category_slug}`}
                key={category?._id}
                className="flex items-center hover:bg-gray-100 gap-3"
              >
                <img
                  src={category?.category_logo}
                  className="w-20 h-20"
                  alt={category?.category_name}
                />
                <h4 className="">{category?.category_name}</h4>
              </Link>
            ))
          )}
        </div>

        {isLoadingCategoryTypes ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3  lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-y-6">
              {initialProduct?.data?.map((product, index) => (
                <Link
                  href={`/products/${product?.product_slug}`}
                  key={index}
                  className="bg-white shadow-md relative hover:scale-105 transition-transform duration-300 group block"
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleWishlist(product);
                      }}
                      className={`absolute top-2 right-2 p-1 bg-white rounded-full hover:bg-gray-100 z-10  ${
                        wishlist.some(
                          (item) =>
                            item.productId === product?._id &&
                            item.variation_product_id ===
                              (product?.variations?._id || null)
                        )
                          ? "text-primary"
                          : "text-gray-500"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill={
                          wishlist.some(
                            (item) =>
                              item.productId === product?._id &&
                              item.variation_product_id ===
                                (product?.variations?._id || null)
                          )
                            ? "black"
                            : "none"
                        }
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                    {/* Default (Visible) Image or Video */}
                    {product?.main_video ? (
                      <video
                        src={product.main_video}
                        autoPlay
                        loop
                        muted
                        className="absolute inset-0 h-full w-full object-cover opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                      />
                    ) : (
                      <Image
                        fill
                        src={
                          product?.main_image ||
                          "/assets/images/placeholder.jpg"
                        } // Fallback image
                        alt={product?.product_name || "Product Image"}
                        className="absolute inset-0 h-full w-full object-cover opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                      />
                    )}

                    {/* Hover (Alternate) Image */}
                    <Image
                      fill
                      src={
                        product?.is_variation
                          ? product?.variations?.variation_image
                            ? product?.variations?.variation_image
                            : product?.main_image
                          : product?.other_images?.other_image
                          ? product?.other_images?.other_image
                          : product?.main_image ||
                            "/assets/images/placeholder.jpg"
                      } // Fallback to main image if hover image is missing
                      alt={product?.product_name || "Product Hover Image"}
                      className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>

                  <div className="mt-1.5 px-2">
                    <p className="text-gray-900 group-hover:underline group-hover:underline-offset-4 line-clamp-2 pr-1 ">
                      {product?.product_name}
                    </p>

                    {/* <div className="mt-1.5 flex gap-1">
                               {product?.attributes_details?.attribute_values?.map}
                             </div> */}
                    {/* if color here will be show color circel like red, green, blue */}

                    <div className="mt-3 flex flex-wrap-reverse flex-col-reverse gap-y-1 sm:flex-row sm:justify-between text-sm lg:text-base mb-1.5 ">
                      <p className="tracking-wide whitespace-nowrap">
                        <span className="text-sm font-semibold">
                          {currencySymbol?.currency_symbol}

                          {productPrice(product)}
                        </span>
                        {lineThroughPrice(product) && (
                          <span className="text-xs ml-1 line-through text-gray-400">
                            {currencySymbol?.currency_symbol}
                            {lineThroughPrice(product)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 flex flex-wrap items-center">
                        {/* Filter and get hex color attributes */}
                        {product?.attributes_details?.attribute_values
                          ?.filter((color) =>
                            isHexColor(color?.attribute_value_code)
                          )
                          ?.slice(0, 4) // Show only the first 4 colors
                          ?.map((color) => (
                            <span
                              key={color?._id}
                              className="w-4  h-4 lg:w-5 lg:h-5 inline-block rounded-full border border-gray-300 mr-1"
                              style={{
                                backgroundColor: color?.attribute_value_code,
                              }}
                              title={color?.attribute_value_name}
                            />
                          ))}

                        {/* Show count of remaining colors if more than 4 exist */}
                        {product?.attributes_details?.attribute_values?.filter(
                          (color) => isHexColor(color?.attribute_value_code)
                        )?.length > 4 && (
                          <span className="w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 ml-1">
                            +
                            {product?.attributes_details?.attribute_values?.filter(
                              (color) => isHexColor(color?.attribute_value_code)
                            ).length - 4}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            {" "}
            {isLoading ? (
              <ProductSectionSkeleton />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3  lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-y-6">
                {products?.data?.map((product, index) => (
                  <Link
                    href={`/products/${product?.product_slug}`}
                    key={index}
                    className="bg-white shadow-md relative hover:scale-105 transition-transform duration-300 group block"
                  >
                    <div className="relative w-full aspect-[2/3] overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleWishlist(product);
                        }}
                        className={`absolute top-2 right-2 p-1 bg-white rounded-full hover:bg-gray-100 z-10  ${
                          wishlist.some(
                            (item) =>
                              item.productId === product?._id &&
                              item.variation_product_id ===
                                (product?.variations?._id || null)
                          )
                            ? "text-primary"
                            : "text-gray-500"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill={
                            wishlist.some(
                              (item) =>
                                item.productId === product?._id &&
                                item.variation_product_id ===
                                  (product?.variations?._id || null)
                            )
                              ? "black"
                              : "none"
                          }
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      {/* Default (Visible) Image or Video */}
                      {product?.main_video ? (
                        <video
                          src={product.main_video}
                          autoPlay
                          loop
                          muted
                          className="absolute inset-0 h-full w-full object-cover opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                        />
                      ) : (
                        <Image
                          fill
                          src={
                            product?.main_image ||
                            "/assets/images/placeholder.jpg"
                          } // Fallback image
                          alt={product?.product_name || "Product Image"}
                          className="absolute inset-0 h-full w-full object-cover opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                        />
                      )}

                      {/* Hover (Alternate) Image */}
                      <Image
                        fill
                        src={
                          product?.is_variation
                            ? product?.variations?.variation_image
                              ? product?.variations?.variation_image
                              : product?.main_image
                            : product?.other_images?.other_image
                            ? product?.other_images?.other_image
                            : product?.main_image ||
                              "/assets/images/placeholder.jpg"
                        } // Fallback to main image if hover image is missing
                        alt={product?.product_name || "Product Hover Image"}
                        className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                    <div className="mt-1.5 px-2">
                      <p className="text-gray-900 group-hover:underline group-hover:underline-offset-4 line-clamp-2 pr-1 ">
                        {product?.product_name}
                      </p>

                      {/* <div className="mt-1.5 flex gap-1">
                  {product?.attributes_details?.attribute_values?.map}
                </div> */}
                      {/* if color here will be show color circel like red, green, blue */}

                      <div className="mt-3 flex flex-wrap-reverse flex-col-reverse gap-y-1 sm:flex-row sm:justify-between text-sm lg:text-base mb-1.5 ">
                        <p className="tracking-wide whitespace-nowrap">
                          <span className="text-sm font-semibold">
                            {currencySymbol?.currency_symbol}

                            {productPrice(product)}
                          </span>
                          {lineThroughPrice(product) && (
                            <span className="text-xs ml-1 line-through text-gray-400">
                              {currencySymbol?.currency_symbol}
                              {lineThroughPrice(product)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 flex flex-wrap items-center">
                          {/* Ensure attributes_details is an array and extract color values */}
                          {Array.isArray(product?.attributes_details) &&
                            product.attributes_details
                              .filter(
                                (attr) =>
                                  Array.isArray(attr.attribute_values) &&
                                  attr.attribute_values.some((val) =>
                                    isHexColor(val?.attribute_value_code)
                                  )
                              ) // Keep only attributes that contain valid hex colors
                              .flatMap((attr) => attr.attribute_values) // Flatten color values
                              .filter((val) =>
                                isHexColor(val?.attribute_value_code)
                              ) // Ensure only valid hex colors
                              .slice(0, 4) // Show first 4 colors
                              .map((color) => (
                                <span
                                  key={color?._id}
                                  className="w-4 h-4 lg:w-5 lg:h-5 inline-block rounded-full border border-gray-300 mr-1"
                                  style={{
                                    backgroundColor:
                                      color?.attribute_value_code,
                                  }}
                                  title={color?.attribute_value_name}
                                />
                              ))}

                          {/* Show count of remaining colors if more than 4 exist */}
                          {Array.isArray(product?.attributes_details) &&
                            product.attributes_details
                              .flatMap((attr) =>
                                Array.isArray(attr.attribute_values)
                                  ? attr.attribute_values
                                  : []
                              ) // Ensure valid attribute_values
                              .filter((val) =>
                                isHexColor(val?.attribute_value_code)
                              ).length > 4 && ( // Filter valid hex colors
                              <span className="w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 ml-1">
                                +
                                {product.attributes_details
                                  .flatMap((attr) =>
                                    Array.isArray(attr.attribute_values)
                                      ? attr.attribute_values
                                      : []
                                  )
                                  .filter((val) =>
                                    isHexColor(val?.attribute_value_code)
                                  ).length - 4}
                              </span>
                            )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {/* Load More Button */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                className="bg-primary-500 text-white px-6 py-2  hover:bg-primary-600 transition-colors duration-300"
              >
                Load More
              </Button>
            </div>
            {/* Sentinel element for infinite scroll */}
            {/* <div ref={sentinelRef} className="h-10"></div>
            {isLoading && page > 1 && <MiniSpinner />} */}
          </>
        )}
      </div>
    </div>
  );
};

export default Shop;
