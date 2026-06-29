import { getServerSettingData } from "@/components/lib/getServerSettingData";
import Head from "next/head";

const DynamicFavicon = async () => {
  const settingData = await getServerSettingData();

  const faviconUrl = settingData?.data[0]?.favicon;
  // console.log(faviconUrl);

  return (
    <>
      <Head>
        {/* If favicon exists, set it, otherwise use a default */}
        <link
          rel="icon"
          href={faviconUrl || "/favicon.ico"}
          type="image/x-icon"
        />
      </Head>
      {/* Your component content here */}
    </>
  );
};

export default DynamicFavicon;
