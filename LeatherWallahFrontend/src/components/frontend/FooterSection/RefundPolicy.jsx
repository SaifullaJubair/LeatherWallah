"use client";

import Contain from "@/components/common/Contain";
import useGetSettingData from "@/components/lib/getSettingData";
import CustomLoader from "@/components/shared/loader/CustomLoader";

const RefundPolicy = () => {
  const { data: settingsData, isLoading } = useGetSettingData();
  const footerData = settingsData?.data[0];

  return (
    <div>
      {" "}
      <Contain>
        {isLoading ? (
          <CustomLoader />
        ) : (
          <div
            className="my-6"
            dangerouslySetInnerHTML={{ __html: footerData?.refund_policy }}
          />
        )}
      </Contain>
    </div>
  );
};

export default RefundPolicy;
