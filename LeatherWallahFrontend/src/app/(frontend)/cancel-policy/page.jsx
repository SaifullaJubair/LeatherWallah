import CancelPolicy from "@/components/frontend/FooterSection/CancelPolicy";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("cancelPolicy");
}
const CancelPolicyPage = () => {
  return (
    <div>
      <CancelPolicy />
    </div>
  );
};

export default CancelPolicyPage;
