//import Image from 'next/image'

import Contain from "@/components/common/Contain";
import SingleCampaignClockCounter from "../campaignClock/SingleCampaignClockCounter";
import Link from "next/link";
import { calculatePrice, lineThroughPrice, productPrice } from "@/utils/helper";

const CampaignProduct = ({ data }) => {
  // console.log(data?.data?.campaign_products);

  return (
    <div className="w-full  my-10">
      <Contain>
        <div>
          <img
            src={data?.data?.campaign_image}
            alt=""
            srcset=""
            className="w-full h-[350px]"
          />
        </div>
        <div className="bg-primary flex flex-col lg:flex-row justify-between items-center  px-8 py-4 mt-2">
          <div className="flex items-center mt-2 gap-4">
            <h2 className="text-white text-[16px] sm:text-3xl mb-3 sm:mt-0">
              {data?.data?.campaign_title}
            </h2>
          </div>
          <div className="">
            <SingleCampaignClockCounter
              startDate={data?.data?.campaign_start_date}
              endDate={data?.data?.campaign_end_date}
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4  lg:grid-cols-4 xl:grid-cols-5 gap-5 ">
          {data?.data?.campaign_products?.map((product) => (
            <Link
              href={`/products/${product?.campaign_product?.product_slug}`}
              key={product?.campaign_product?._id}
              className="bg-white   border shadow-md"
            >
              <div className=" px-2 py-5  mb-4 relative ">
                <div className="">
                  <img
                    src={product?.campaign_product?.main_image}
                    alt="name"
                    width={200}
                    height={200}
                    className="w-full h-44 xl:h-52 object-contain rounded"
                  />
                </div>
                <div className="p-3">
                  <p className="mt-2 text-text-Lightest">Snack</p>
                  <h4 className="text-text-Lighter text-[16px]">
                    {product?.campaign_product?.product_name}
                  </h4>
                  <div className="flex items-center justify-between space-x-2 mt-2">
                    <div>
                      <span className="text-lg font-semibold">
                        $
                        {calculatePrice(
                          product?.campaign_product?.is_variation &&
                            product?.campaign_product?.variations
                            ? product?.campaign_product?.variations
                                ?.variation_discount_price
                              ? product?.campaign_product?.variations
                                  ?.variation_discount_price
                              : product?.campaign_product?.variations
                                  ?.variation_price
                            : product?.campaign_product?.product_discount_price
                            ? product?.campaign_product?.product_discount_price
                            : product?.campaign_product?.product_price,
                          product?.campaign_product_price,
                          product?.campaign_price_type
                        )}
                      </span>
                      {lineThroughPrice(product?.campaign_product) && (
                        <span className="text-sm ml-2 line-through text-gray-400">
                          $ {lineThroughPrice(product?.campaign_product)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Contain>
    </div>
  );
};

export default CampaignProduct;
