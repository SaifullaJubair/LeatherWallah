import Contain from "@/components/common/Contain";
import FlashClockCounter from "./FlashClockCounter";
import FlashProductSlider from "./FlashProductSlider";
import { getFlashSaleProducts } from "@/components/lib/getFlashSaleProducts";
import { getServerSettingData } from "@/components/lib/getServerSettingData";

const FlashSale = async () => {
  const [data, settingData] = await Promise.all([
    getFlashSaleProducts(),
    getServerSettingData(),
  ]);
  if (!data) return null;
  const products = data?.data;
  const currencySymbol = settingData?.data?.[0]?.currency_symbol || "৳";
  const today = new Date();
  // console.log(today);
  if (products?.length === 0) {
    return null;
  } else if (
    products?.flash_sale_end_time &&
    new Date(products.flash_sale_end_time) < today
  ) {
    return null; // Flash sale has ended
  }
  return (
    <div className="my-10 bg-[#F4F4F4] py-6">
      <Contain>
        <div className="bg-white   p-8 shadow-md ">
          <div className="flex items-center justify-between pb-6">
            <h2 className="font-bold">Flash Sale</h2>
            <div className="flex items-center gap-3  text-white">
              <FlashClockCounter
                startDate={products?.flash_sale_start_time}
                endDate={products?.flash_sale_end_time}
              />
            </div>
          </div>
          <div className="relative flex items-start">
            {/* Flash Sale Label */}
            <div className="bg-primary h-[440px] w-72  relative">
              <h1 className="text-white -rotate-90 absolute top-1/2 -left-8 transform -translate-y-1/2">
                {products?.flash_sale_title}
              </h1>
            </div>
            <div className="absolute top-6 left-20 w-[95%]">
              <FlashProductSlider products={products?.flash_sale_products} currencySymbol={currencySymbol} />
            </div>
          </div>
        </div>
      </Contain>
    </div>
  );
};

export default FlashSale;
