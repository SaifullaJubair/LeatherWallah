import { getServerSettingData } from "@/components/lib/getServerSettingData";
import Banner from "./banner/Banner";
import FlashSale from "./flashSale/FlashSale";
import SectionRenderer from "./SectionRenderer";

const Home = async () => {
  let settings = null;
  try {
    const res = await getServerSettingData();
    settings = res?.data?.[0] ?? null;
  } catch {
    // non-fatal — render with static defaults
  }

  const sections = settings?.home_section_array ?? [];

  const getSectionEnabled = (id, defaultEnabled = true) => {
    const s = sections.find((x) => x.id === id);
    return s ? s.enabled !== false : defaultEnabled;
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto">
      {getSectionEnabled("hero") && <Banner />}
      {/* Flash sale — temporarily disabled; re-enable when BE endpoint is ready */}
      {/* {getSectionEnabled("flash_sale") && <FlashSale />} */}
      <SectionRenderer sections={sections} settings={settings} />
    </div>
  );
};

export default Home;
