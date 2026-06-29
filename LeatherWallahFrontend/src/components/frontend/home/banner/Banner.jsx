import { getBanner } from "@/components/lib/getBanner";
import BannerItem from "./BannerItem";

const Banner = async () => {
  const data = await getBanner();

  return (
    <div className="">
      <BannerItem bannerData={data?.data} />
    </div>
  );
};

export default Banner;
