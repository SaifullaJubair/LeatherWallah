import OfferProduct from "@/components/frontend/offer/offerProduct/OfferProduct";
import { getOfferProducts } from "@/components/lib/getOfferProducts";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const OfferProductPage = async ({ params }) => {
  const id = params?.id;
  const data = await getOfferProducts(id);
  if (!data?.data) {
    return (
      <div className="text-center max-w-md mx-auto mt-2 bg-white p-6   shadow-lg">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="Offer not found"
          className="mx-auto mb-2 w-80 sm:w-96"
        />
        <h3 className="font-semibold text-gray-800 mb-2">Offer Not Found!</h3>
        <p className="text-gray-600 mb-6">
          We couldn’t find the offer you’re looking for. It might have been
          removed or the URL might be incorrect.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Link href="/">
            <Button className="w-full">Go Home</Button>
          </Link>

          <Link href="/shop">
            <Button variant="secondary" className="w-full">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <OfferProduct data={data} />
    </div>
  );
};

export default OfferProductPage;
