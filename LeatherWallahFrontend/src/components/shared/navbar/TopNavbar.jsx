"use client";
import LoginToSellerApply from "@/components/auth/LoginToSeller/LoginToSellerApply";
import Contain from "@/components/common/Contain";
import useGetSettingData from "@/components/lib/getSettingData";
import Link from "next/link";
import { useState } from "react";
import Marquee from "react-fast-marquee";

const TopNavbar = () => {
  const [sellerLoginApplyModal, setSellerLoginApplyModal] = useState(false);
  const { data: settingsData } = useGetSettingData();
  const footerData = settingsData?.data[0];

  return (
    <div className="bg-primary   ">
      <div className="flex items-center justify-between">
        <div className=" text-white flex gap-2 text-center ">
          <span className="hidden lg:flex font-semibold">
            <div className="marquee-container">
              <Marquee
                className="custom-marquee"
                autoPlay
                speed={70}
                gradient={false}
                pauseOnHover
              >
                <span className="marquee-text">
                  {footerData?.welcome_message}
                </span>
              </Marquee>
            </div>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;
