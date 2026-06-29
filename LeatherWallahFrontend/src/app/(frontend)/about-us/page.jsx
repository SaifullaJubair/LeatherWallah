// src/app/(frontend)/about-us/page.jsx
// seo
import AboutUs from "@/components/frontend/FooterSection/AboutUs";
import { buildPageMeta } from "@/components/lib/buildPageMeta";
export async function generateMetadata() {
  return buildPageMeta("aboutUs");
}
const AboutUsPage = () => {
  return (
    <div>
      <AboutUs />
    </div>
  );
};

export default AboutUsPage;
