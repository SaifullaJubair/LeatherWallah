"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { BASE_URL } from "@/components/utils/baseURL";
import ProductSectionSkeleton from "@/components/shared/loader/ProductSectionSkeleton";
import { yatra } from "@/utils/font";
import Link from "next/link";
import Image from "next/image";
import { isHexColor, lineThroughPrice, productPrice } from "@/utils/helper";
import useGetSettingData from "@/components/lib/getSettingData";
import { Button } from "@/components/ui/button";
import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";

const SingleBrandProductPage = ({ params }) => {
  const { id } = params;
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data[0];
  const [wishlist, setWishlist] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(16);
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["brandProducts", id],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/product/brand_match_product?brand_id=${id}`
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch brand products");
      }

      return result;
    },
  });

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast.error(error.message);
    }
  }, [isError, error]);

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
    <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 my-4">
      <div className="flex items-center justify-between flex-wrap gap-6">
        {" "}
        <div className="flex items-center justify-center gap-3">
          {" "}
          <img
            src={products?.data?.brand_details?.brand_logo}
            alt="brand logo"
            className="size-14"
          />
          <h1 className="font-thin">
            {products?.data?.brand_details.brand_name}
          </h1>
        </div>
        <p className="font-thin">
          Showing all {products?.data?.data?.length || 0} results
        </p>
      </div>

      <div className="my-10">
        <div className="max-w-[98%] mx-auto">
          <div>
            {" "}
            {isLoading ? (
              <ProductSectionSkeleton />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-y-6">
                {products?.data?.data?.map((product, index) => (
                  <Link
                    href={`/products/${product?.product_slug}`}
                    key={index}
                    className="bg-white shadow-md relative hover:scale-105 transition-transform duration-300 group block"
                  >
                    <div className="relative w-full aspect-[2/3] overflow-hidden ">
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
                          src={product?.main_video}
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
                        {/*
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

                          {product?.attributes_details?.attribute_values?.filter(
                            (color) => isHexColor(color?.attribute_value_code)
                          )?.length > 4 && (
                            <span className="w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 ml-1">
                              +
                              {product?.attributes_details?.attribute_values?.filter(
                                (color) =>
                                  isHexColor(color?.attribute_value_code)
                              ).length - 4}
                            </span>
                          )}
                        </p> */}

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
            {/* Sentinel element for infinite scroll */}
            {/* <div ref={sentinelRef} className="h-10"></div>
            {isLoading && page > 1 && <MiniSpinner />} */}
          </div>
        </div>
      </div>

      <PaginationWithPageBtn
        page={page}
        setPage={setPage}
        rows={limit}
        setRows={setLimit}
        totalData={products?.totalData}
      />
    </div>
  );
};

export default SingleBrandProductPage;
