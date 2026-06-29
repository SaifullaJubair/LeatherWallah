import RefundPolicy from "@/components/frontend/FooterSection/RefundPolicy";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("refundPolicy");
}
const RefundPolicyPage = () => {
  return (
    <div>
      <RefundPolicy />
    </div>
  );
};

export default RefundPolicyPage;
