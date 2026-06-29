"use client";
import Contain from "@/components/common/Contain";
import SingleOfferClockCounter from "../offerClockCounter/SingleOfferClockCounter";
import ProductTable from "./productTable/ProductTable";

const OfferProduct = ({ data }) => {
  return (
    <div className="w-full my-8">
      <Contain>
        <div>
          <img
            src={data?.data?.offer_image}
            alt=""
            srcset=""
            className="w-full h-[350px]"
          />
        </div>
        <div className="bg-primary flex flex-col lg:flex-row justify-between items-center  px-8 py-4 mt-2">
          <div className="flex items-center mt-2 gap-4">
            <h2 className="text-white text-[16px] sm:text-3xl mb-3 sm:mt-0">
              {data?.data?.offer_title}
            </h2>
          </div>
          <div className="">
            <SingleOfferClockCounter
              startDate={data?.data?.offer_start_date}
              endDate={data?.data?.offer_end_date}
            />
          </div>
        </div>
        <div className="mt-3">
          <div className=" ">
            {/* <h2 className=" font-base text-text-light">
              Offer For You - {data?.data?.offer_price} Taka
            </h2> */}
            <p
              className="mt-1 text-text-Lightest"
              dangerouslySetInnerHTML={{
                __html: data?.data?.offer_description,
              }}
            />
          </div>
          {/* ..Product Table.. */}
          <div className="mt-3">
            <ProductTable offerProducts={data?.data?.offer_products} offer_id={data?.data?._id} />
          </div>
        </div>
      </Contain>
    </div>
  );
};

export default OfferProduct;
