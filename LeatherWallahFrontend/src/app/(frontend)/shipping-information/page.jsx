import Shipping from "@/components/frontend/FooterSection/Shipping";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("shippingInfo");
}
const ShippingInformationPage = () => {
  return (
    <div>
      <Shipping />
    </div>
  );
};

export default ShippingInformationPage;
