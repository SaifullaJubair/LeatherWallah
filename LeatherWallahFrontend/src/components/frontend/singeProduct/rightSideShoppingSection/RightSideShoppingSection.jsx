"use client";

import { useState } from "react";
import { CiDeliveryTruck } from "react-icons/ci";
import { MdAttachMoney } from "react-icons/md";
import { LiaRedoAltSolid } from "react-icons/lia";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { GoShieldSlash } from "react-icons/go";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const RightSideShoppingSection = ({ product, settingData }) => {
  // Calculate delivery days
  const minDays = Math.min(
    settingData?.data[0]?.outside_dhaka_shipping_days || 0,
    settingData?.data[0]?.inside_dhaka_shipping_days || 0
  );
  const maxDays = Math.max(
    settingData?.data[0]?.outside_dhaka_shipping_days || 0,
    settingData?.data[0]?.inside_dhaka_shipping_days || 0
  );

  return (
    <div>
      {/* Desktop View (md and larger) */}
      <div className="hidden md:block border bg-[#F4F4F4] p-4 relative">
        <div className="flex items-center flex-wrap gap-3 my-3">
          <div className="flex items-center flex-grow gap-3">
            <CiDeliveryTruck size={24} />
            <div className="flex flex-col">
              <p className="font-semibold text-text-light">Standard Delivery</p>
              <p className="text-text-Lighter text-sm">
                Guaranteed by {minDays} - {maxDays} days
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 my-3">
          <MdAttachMoney size={24} className="text-text-light" />
          <p className="font-semibold text-text-light">
            Cash on Delivery Available
          </p>
        </div>

        <hr className="mx-2" />

        <div>
          <div className="flex items-center gap-3 my-3">
            <LiaRedoAltSolid size={20} />
            <p className="font-semibold text-text-light">
              {product?.product_return
                ? `${product?.product_return} Days Return`
                : "Return Not Available"}
            </p>
          </div>

          <div className="flex items-center gap-3 my-3">
            {product?.product_warrenty ? (
              <>
                <IoShieldCheckmarkOutline size={20} />
                <p className="font-semibold text-text-light">
                  {product?.product_warrenty} Product Warranty
                </p>
              </>
            ) : (
              <>
                <GoShieldSlash size={20} />
                <p className="font-semibold text-text-light">
                  Warranty Not Available
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSideShoppingSection;

// "use client";
// import { useEffect, useState } from "react";
// import { IoLocationOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
// import Spinner from "@/components/shared/loader/Spinner";
// import useGetShippingConfiguration from "@/components/lib/getShippingConfiguration";
// import { GoShieldSlash } from "react-icons/go";
// import { LiaRedoAltSolid } from "react-icons/lia";
// import { MdAttachMoney, MdMoneyOff } from "react-icons/md";
// import { CiDeliveryTruck } from "react-icons/ci";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { toast } from "react-toastify";
// import { TbShoppingBagCheck, TbShoppingBagPlus } from "react-icons/tb";
// import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
// import useGetSettingData from "@/components/lib/getSettingData";

// const RightSideShoppingSection = ({ product }) => {
//   const { data: settingData } = useGetSettingData();
//   const { data: userInfo, isLoading: userGetLoading } = useUserInfoQuery();
//   return (
//     <div>
//       <div className="border bg-[#F4F4F4]  p-4 relative">
//         <div className="flex items-center flex-wrap gap-3 my-3">
//           <div className="flex items-center flex-grow gap-3">
//             <CiDeliveryTruck size={24} />
//             <div className="flex flex-col">
//               <p className="font-semibold text-text-light">Standard Delivery</p>
//               <p className="text-text-Lighter text-sm">
//                 Guaranteed by{" "}
//                 {settingData?.data[0]?.outside_dhaka_shipping_days <
//                 settingData?.data[0]?.inside_dhaka_shipping_days
//                   ? settingData?.data[0]?.outside_dhaka_shipping_days
//                   : settingData?.data[0]?.inside_dhaka_shipping_days}
//                 -{" "}
//                 {settingData?.data[0]?.outside_dhaka_shipping_days >
//                 settingData?.data[0]?.inside_dhaka_shipping_days
//                   ? settingData?.data[0]?.outside_dhaka_shipping_days
//                   : settingData?.data[0]?.inside_dhaka_shipping_days}{" "}
//                 days
//               </p>
//             </div>
//           </div>

//           {/* <div className="ml-8">
//             {product?.free_shipping ? (
//               <span className="text-sm font-medium text-text-light mr-4">
//                 Free Shipping
//               </span>
//             ) : (
//               <span className="font-medium text-text-light mr-4">
//                 Free shipping not available
//               </span>
//             )}
//           </div> */}
//         </div>

//         <div className="flex items-center gap-2 my-3">
//           <MdAttachMoney size={24} className="text-text-light" />
//           <div className="flex flex-col">
//             <p className="font-semibold text-text-light">
//               Cash on Delivery Available
//             </p>
//           </div>
//         </div>
//         <hr className="mx-2" />
//         <div>
//           {product?.product_return ? (
//             <div className="flex items-center gap-3 my-3">
//               <LiaRedoAltSolid size={20} />
//               <p className="font-semibold text-text-light">
//                 {" "}
//                 {product?.product_return} Days Return{" "}
//               </p>
//             </div>
//           ) : (
//             <div className="flex items-center gap-3 my-3">
//               <LiaRedoAltSolid size={20} />
//               <p className="font-semibold text-text-light">
//                 {" "}
//                 Return Not Available
//               </p>
//             </div>
//           )}

//           <div className="flex items-center gap-3 my-3">
//             {product?.product_warrenty ? (
//               <>
//                 <IoShieldCheckmarkOutline size={20} />
//                 <p className="font-semibold text-text-light">
//                   {product?.product_warrenty} Product Warranty
//                 </p>
//               </>
//             ) : (
//               <>
//                 <GoShieldSlash size={20} />
//                 <p className="font-semibold text-text-light">
//                   Warranty Not Available
//                 </p>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RightSideShoppingSection;
