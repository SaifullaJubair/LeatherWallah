import TermsCondition from "@/components/frontend/FooterSection/TermsCondition";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("termsCondition");
}
const TermsConditionPage = () => {
  return (
    <div>
      <TermsCondition />
    </div>
  );
};

export default TermsConditionPage;
