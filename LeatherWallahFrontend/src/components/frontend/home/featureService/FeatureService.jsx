import { TbTruckDelivery } from "react-icons/tb";
import { PiHammerLight, PiLeafLight } from "react-icons/pi";
import { TbArrowsExchange } from "react-icons/tb";
import { MdOutlinePayment } from "react-icons/md";

const services = [
  {
    icon: <PiHammerLight className="text-3xl text-primary-400" />,
    title: "Built to Last",
    desc: "Reinforced stitching at every joint",
  },
  {
    icon: <PiLeafLight className="text-3xl text-primary-400" />,
    title: "Genuine Leather",
    desc: "100% authentic material",
  },
  {
    icon: <TbArrowsExchange className="text-3xl text-primary-400" />,
    title: "Easy Return",
    desc: "Instant return if you don't like it.",
  },
  {
    icon: <MdOutlinePayment className="text-3xl text-primary-400" />,
    title: "Cash on Delivery",
    desc: "Pay when you receive",
  },
];

const FeatureService = () => {
  return (
    <div className="py-4 md:py-10">
      <div className="max-w-[98%] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-100">
          {services.map((service, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-6 py-6 hover:bg-accent-50 transition-colors duration-300
                ${i !== services.length - 1 ? "border-b md:border-b-0 md:border-r border-gray-100" : ""}
                ${i === 1 ? "border-b md:border-b-0" : ""}
              `}
            >
              <div className="shrink-0 w-12 h-12 flex items-center justify-center bg-primary-50 rounded-full">
                {service.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {service.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureService;

// "use client";

// import Contain from "@/components/common/Contain";
// import useGetSettingData from "@/components/lib/getSettingData";

// import Image from "next/image";

// const FeatureService = () => {
//   const { data: settingsData } = useGetSettingData();
//   const footerData = settingsData?.data[0];
//   // console.log(footerData);

//   return (
//     <Contain>
//       <div className="my-6">
//         <div className="grid grid-cols-2  md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
//           <div className="flex flex-col sm:flex-row items-center gap-2 gap-x-6 sm:gap-6   bg-gray-100   p-4">
//             <Image
//               src={footerData?.card_one_logo}
//               alt="Card"
//               width={40}
//               height={40}
//             />

//             <div>
//               <p className="text-xs  sm:text-sm  sm:stroke-text-semiLight text-text-Lighter ">
//                 {footerData?.card_one_title}
//               </p>
//             </div>
//           </div>
//           <div className="flex flex-col sm:flex-row items-center gap-6  bg-gray-100   p-3">
//             <Image
//               src={footerData?.card_two_logo}
//               alt="Card"
//               width={40}
//               height={40}
//             />

//             <div>
//               <p className="text-xs tracking-wider sm:text-sm text-text-Lighter ">
//                 {footerData?.card_two_title}
//               </p>
//             </div>
//           </div>
//           <div className="flex flex-col sm:flex-row items-center gap-2 gap-x-6 sm:gap-6   bg-gray-100   p-3">
//             <Image
//               src={footerData?.card_three_logo}
//               alt="Card"
//               width={40}
//               height={40}
//             />

//             <div>
//               <p className="text-xs tracking-wider sm:text-sm text-text-Lighter ">
//                 {footerData?.card_three_title}
//               </p>
//             </div>
//           </div>
//           <div className="flex flex-col sm:flex-row items-center gap-2 gap-x-6 sm:gap-6   bg-gray-100   p-3">
//             <Image
//               src={footerData?.card_four_logo}
//               alt="Card"
//               width={40}
//               height={40}
//             />

//             <div>
//               <p className="text-xs tracking-wider sm:text-sm text-text-Lighter ">
//                 {footerData?.card_four_title}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Contain>
//   );
// };

// export default FeatureService;
