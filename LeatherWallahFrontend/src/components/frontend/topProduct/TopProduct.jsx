"use client";
import { Suspense } from "react";
import Contain from "@/components/common/Contain";
import ProductInfo from "./ProductInfo";
import { getECommerceChoiceProducts } from "@/components/lib/getECommerceChoiceProducts";
import { LoaderOverlay } from "@/components/shared/loader/LoaderOverlay";

const TopProduct = async () => {
  const data = await getECommerceChoiceProducts();
  const products = Array.isArray(data?.data) ? data.data : [];
  return (
    <div>
      <Contain>
        <div className="flex justify-between mt-4 sm:mt-6">
          <h2 className="pb-4 text-text-default">Top Products</h2>
        </div>
        <ProductInfo products={products} />
      </Contain>
    </div>
  );
};

// export default TopProduct;

export default function Page() {
  return (
      <Suspense fallback={<LoaderOverlay />}>
          <TopProduct />
      </Suspense>
  );
}
