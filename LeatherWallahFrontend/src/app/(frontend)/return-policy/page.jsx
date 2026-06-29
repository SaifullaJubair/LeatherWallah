import ReturnPolicy from "@/components/frontend/FooterSection/ReturnPolicy";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("returnPolicy");
}
const ReturnPolicyPage = () => {
  return (
    <div>
      <ReturnPolicy />
    </div>
  );
};

export default ReturnPolicyPage;
