"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const NewFeatureCategorySwiper = ({ featureData }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 xl:gap-8">
      {featureData.map(({ category }) => (
        <div key={category?._id} className="relative group">
          <Link href={`/category/${category.category_slug}`}>
            <div className="relative w-full  aspect-[2/3] overflow-hidden shadow-lg">
              {category.category_video ? (
                <video
                  src={category?.category_video}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={category?.category_logo}
                  alt={category?.category_name || "Category Image"}
                  fill
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center bg-secondary opacity-75 group-hover:opacity-100   duration-300  text-white py-2 text-xs sm:text-sm md:text-base lg:text-lg font-semibold">
              {category?.category_name}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default NewFeatureCategorySwiper;
