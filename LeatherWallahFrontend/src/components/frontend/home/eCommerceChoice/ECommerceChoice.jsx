import Contain from "@/components/common/Contain";
import { getECommerceChoiceProducts } from "@/components/lib/getECommerceChoiceProducts";
import { getServerSettingData } from "@/components/lib/getServerSettingData";

import ProductSectionSkeleton from "@/components/shared/loader/ProductSectionSkeleton";
import { Button } from "@/components/ui/button";
import { images } from "@/components/utils/ImageImport";
import { averageRatingStar } from "@/utils/average";

import { lineThroughPrice, productPrice } from "@/utils/helper";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";

const ECommerceChoice = async () => {
  const data = await getECommerceChoiceProducts();
  const products = data?.data?.data;

  //get Setting Data
  const settingData = await getServerSettingData();
  const currencySymbol = settingData?.data[0];

  return (
    <div className="my-10">
      <Contain>
        <div className="flex items-center justify-between pb-6">
          <h2 className="text-base tracking-tighter sm:tracking-normal sm:text-2xl md:text-2xl">
            E-Commerce Choice
          </h2>
          <div className="list-none flex items-center gap-3 text-text-semiLight text-sm">
            <Link href={"/shop"}>
              {" "}
              <Button variant="link">
                All E-Commerce Product
                <IoIosArrowRoundForward />
              </Button>
            </Link>
          </div>
        </div>
        <Suspense fallback={<ProductSectionSkeleton />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-y-6 ">
            {products?.map((product, index) => (
              <Link
                href={`/products/${product?.product_slug}`}
                key={index}
                className="bg-white   shadow-md border-primary-100 border h-80 sm:h-[380px] hover:scale-105 transition-transform duration-300 "
              >
                <div className="relative p-2 group">
                  {/* "New" Badge */}
                  {product.isNew && (
                    <span className="absolute top-0 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
                      New
                    </span>
                  )}

                  {/* "Variation Available" Badge */}
                  {product?.is_variation && (
                    <span className="absolute top-0 right-0 bg-primary font-medium text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                      Variation Available
                    </span>
                  )}

                  <Image
                    src={product?.main_image}
                    alt={product?.product_name}
                    width={400}
                    height={400}
                    className="w-full h-36 sm:h-44 object-cover "
                    placeholder="blur"
                    blurDataURL={images.loadingProductImg}
                  />
                </div>
                <div className="p-3 flex flex-col justify-between h-40 sm:h-44 ">
                  <p className="text-base sm:text-lg mt-2 text-text-default font-medium line-clamp-2">
                    {product?.product_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product?.category?.category_name}
                  </p>
                  <div className="flex items-center gap-1  text-sm ">
                    {averageRatingStar(
                      parseFloat(product?.average_review_rating || 0).toFixed(1)
                    )}{" "}
                    ({product?.total_reviews || 0})
                  </div>
                  <div className="flex items-center justify-between space-x-2 mt-2">
                    <div>
                      <span className="text-xl font-semibold">
                        <span className=" font-bold mr-1">
                          {" "}
                          {currencySymbol?.currency_symbol}
                        </span>
                        {productPrice(product)}
                      </span>
                      {lineThroughPrice(product) && (
                        <span className="text-sm ml-2 line-through text-gray-400">
                          {currencySymbol?.currency_symbol}

                          {lineThroughPrice(product)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Suspense>
      </Contain>
    </div>
  );
};

export default ECommerceChoice;
