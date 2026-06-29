import PrivacyPolicy from "@/components/frontend/FooterSection/PrivacyPolicy";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("privacyPolicy");
}
const PrivacyPolicyPage = () => {
  return (
    <div>
      <PrivacyPolicy />
    </div>
  );
};

export default PrivacyPolicyPage;
