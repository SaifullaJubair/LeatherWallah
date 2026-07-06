import Navbar from "@/components/shared/navbar/Navbar";
import Footer from "@/components/shared/footer/Footer";
import { getMenu } from "@/components/lib/getMenu";
import UnverifiedBanner from "@/components/common/unverifiedBanner/UnverifiedBanner";
import { getServerSettingData } from "@/components/lib/getServerSettingData";
import AnnouncementBar from "@/components/theme/AnnouncementBar";
import FloatingWhatsApp from "@/components/shared/FloatingWhatsApp";
import ChatWidgetStacker from "@/components/shared/ChatWidgetStacker";

const MainLayout = async ({ children }) => {
  const dataArray = await getMenu();
  const menuData = dataArray?.data;

  // site_settings.announcement_bar — top-of-page rolling banner
  let announcementItems = [];
  try {
    const settingResp = await getServerSettingData();
    announcementItems = settingResp?.data?.[0]?.announcement_bar || [];
  } catch (e) {
    // non-fatal — site renders without announcement bar
  }

  return (
    // Warm off-white page canvas (#FAF7F2) so white product cards "float"
    // and the storefront reads premium instead of plain white.
    <div className="bg-[#FAF7F2]">
      <AnnouncementBar items={announcementItems} />
      <Navbar menuData={dataArray} />
      <UnverifiedBanner />
      {/* pb-16 — mobile bottom nav এর জন্য space */}
      <div className="min-h-screen pb-16 md:pb-0">{children}</div>
      <FloatingWhatsApp />
      <ChatWidgetStacker />
      <Footer menuData={menuData} />
    </div>
  );
};

export default MainLayout;

// import TopNavbar from "@/components/shared/navbar/TopNavbar";
// import SecondNavbar from "@/components/shared/navbar/SecondNavbar";
// import BottomNavbar from "@/components/shared/navbar/BottomNavbar";
// import Footer from "@/components/shared/footer/Footer";
// import { getMenu } from "@/components/lib/getMenu";
// import dynamic from "next/dynamic";
// import Navbar from "@/components/shared/navbar/Navbar";

// // import MobileNavBarUserDashBoard from "@/components/shared/navbar/MobileNavBarUserDashBoard";
// const MobileNavBarUserDashBoard = dynamic(
//   () => import("@/components/shared/navbar/MobileNavBarUserDashBoard"),
//   { ssr: false } // Ensures it only loads on the client side
// );

// const MainLayout = async ({ children }) => {
//   const dataArray = await getMenu();
//   const menuData = dataArray?.data;
//   return (
//     <div>
//       {/* <TopNavbar /> */}
//       <div className="sticky top-0 z-30 bg-white shadow-md">
//         <SecondNavbar menuData={dataArray} />
//         {/* <Navbar menuData={menuData} /> */}
//         {/* <BottomNavbar menuData={menuData} /> */}
//       </div>
//       <div className="min-h-screen">{children}</div>
//       <MobileNavBarUserDashBoard />
//       <Footer menuData={menuData} />
//     </div>
//   );
// };

// export default MainLayout;
