import Contain from "@/components/common/Contain";
import { images } from "@/components/utils/ImageImport";
import Image from "next/image";

const AdsSection = () => {
  return (
    <Contain>
      <div className="my-10 ">
        <div className="relative h-32">
          <Image src={images.ad} alt="ads" layout="fill" />
        </div>
      </div>
    </Contain>
  );
};

export default AdsSection;