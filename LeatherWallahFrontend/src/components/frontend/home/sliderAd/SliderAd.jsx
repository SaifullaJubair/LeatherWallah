import Contain from "@/components/common/Contain";
import { getSlider } from "@/components/lib/getSlider";
import SliderAdSection from "./SliderAddSection";

const SliderAd = async () => {
  const data = await getSlider();
  const sliderData = data?.data;

  return (
    <div className="my-10">
      <Contain>
        <SliderAdSection sliderData={sliderData} />
      </Contain>
    </div>
  );
};

export default SliderAd;
