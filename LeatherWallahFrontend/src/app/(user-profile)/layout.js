import { getMenu } from "@/components/lib/getMenu";
import Footer from "@/components/shared/footer/Footer";
import SecondNavbar from "@/components/shared/navbar/SecondNavbar";

const MainLayout = async ({ children }) => {
  const menuData = await getMenu();
  return (
    <div>
      <div className="sticky top-0 z-30 bg-white">
        <SecondNavbar menuData={menuData} />
      </div>
      <div className="pb-16 md:pb-0">{children}</div>
      <Footer />
    </div>
  );
};

export default MainLayout;
