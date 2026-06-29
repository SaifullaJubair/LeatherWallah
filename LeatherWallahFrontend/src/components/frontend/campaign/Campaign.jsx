import Link from "next/link";
import { FaLongArrowAltRight } from "react-icons/fa";
import CampaignClockCounter from "./campaignClock/CampaignClockCounter";
import { EnglishDateShort } from "@/components/utils/EnglishDateShort";
import { Button } from "@/components/ui/button";
import { getAllCampaign } from "@/components/lib/getAllCampaign";
import Contain from "@/components/common/Contain";
import { MdOutlineDateRange } from "react-icons/md";
import { images } from "@/components/utils/ImageImport";

const Campaign = async () => {
  const campaignData = await getAllCampaign();
  if (!campaignData?.data || campaignData?.data?.length === 0) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6   shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No campaign available"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h3 className=" font-semibold text-gray-800 mb-2">
          No Campaign Available!
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn’t find any campaign right now. Please check back later or
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
        {campaignData?.data?.map((campaign) => (
          <div key={campaign?._id}>
            <div className="shadow-md px-4 py-5  ">
              <div className="bg-[#F4F4F4] flex justify-center items-center  ">
                <div className="p-2">
                  <CampaignClockCounter
                    startDate={campaign?.campaign_start_date}
                    endDate={campaign?.campaign_end_date}
                  />
                </div>
              </div>
              <div className="py-2">
                <img
                  src={campaign?.campaign_image}
                  alt={campaign?.campaign_title}
                  className="w-full h-[200px] border   "
                  placeholder="blur"
                  blurDataURL={images.loadingProductImg}
                />
              </div>
              <div>
                <p className="mt-2 flex items-center">
                  <span>
                    {" "}
                    <MdOutlineDateRange className="mr-1" />
                  </span>{" "}
                  {EnglishDateShort(campaign?.campaign_start_date)}
                  <FaLongArrowAltRight className="mx-2" />
                  <span>{EnglishDateShort(campaign?.campaign_end_date)}</span>
                </p>
                <h4 className="my-2">{campaign?.campaign_title}</h4>

                <Link className="mt-2" href={`/campaign/${campaign?._id}`}>
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

export default Campaign;
