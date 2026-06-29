import Contain from "@/components/common/Contain";
import { getAllOffers } from "@/components/lib/getAllOffers";
import Link from "next/link";
import { FaLongArrowAltRight } from "react-icons/fa";
import OfferClockCounter from "./offerClockCounter/OfferClockCounter";
import { EnglishDateShort } from "@/components/utils/EnglishDateShort";
import { Button } from "@/components/ui/button";
import { MdOutlineDateRange } from "react-icons/md";

const Offer = async () => {
  const offerData = await getAllOffers();
  if (!offerData?.data || offerData?.data?.length === 0) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6   shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No offers available"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h3 className=" font-semibold text-gray-800 mb-2">
          No Offers Available!
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn’t find any offers right now. Please check back later or
          explore our other exciting products.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Link href="/">
            <Button className="w-full">Go Home</Button>
          </Link>

          <Link href="/shop">
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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {offerData?.data?.map((offer) => (
          <div key={offer?._id}>
            <div className="shadow-md px-4 py-5  ">
              <div className="bg-[#F4F4F4] flex justify-center items-center  ">
                <div className="p-2">
                  <OfferClockCounter
                    startDate={offer?.offer_start_date}
                    endDate={offer?.offer_end_date}
                  />
                </div>
              </div>
              <div className="py-2">
                <img
                  src={offer?.offer_image}
                  alt={offer?.offer_title}
                  className="w-full h-[221px] border   "
                />
              </div>
              <div>
                <p className="mt-2 flex items-center">
                  <span className="mr-1">
                    {" "}
                    <MdOutlineDateRange />{" "}
                  </span>{" "}
                  {EnglishDateShort(offer?.offer_start_date)}
                  <FaLongArrowAltRight className="mx-2" />
                  <span>{EnglishDateShort(offer?.offer_end_date)}</span>
                </p>

                <h4 className="mt-2">{offer?.offer_title}</h4>

                <Link className="mt-2" href={`/offer/${offer?._id}`}>
                  <Button className="w-full my-[10px]   ">View Details</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Contain>
  );
};

export default Offer;
