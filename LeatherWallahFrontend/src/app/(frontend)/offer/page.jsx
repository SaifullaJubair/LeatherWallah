import Offer from "@/components/frontend/offer/Offer";

import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("offer");
}

const OfferPage = () => {
  return (
    <div>
      <Offer />
    </div>
  );
};

export default OfferPage;
