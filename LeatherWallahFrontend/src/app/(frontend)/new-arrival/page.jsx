import NewArrivalProduct from "@/components/frontend/seeAllProduct/NewArrivalProduct";

import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("newArrival");
}
const NewArrivalPage = () => {
  return (
    <div>
      <NewArrivalProduct />
    </div>
  );
};

export default NewArrivalPage;
