import { PiHouseBold } from "react-icons/pi";
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../../utils/baseURL";
import { LoaderOverlay } from "../../../components/common/loader/LoderOverley";
import UpdateProduct from "../../../components/Product/UpdateProduct/UpdateProduct";
import ProductMetaPanel from "../../../components/Product/UpdateProduct/ProductMetaPanel";

const ProductUpdatePage = () => {
  const { id } = useParams();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [`/api/v1/product/dashboard/${id}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/dashboard/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      return data;
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  });
  if (isLoading) {
    return <LoaderOverlay />;
  }
  return (
    <>
      <div className="flex items-center justify-between shadow-md bg-white p-4 rounded-xl">
        <h3 className="text-[20px] font-semibold">Update Product</h3>
        <div className="flex items-center gap-2">
          <Link to="/admin">
            <p>
              <PiHouseBold size={25} color="#000F24" />
            </p>
          </Link>
          <p className="font-semibold text-xl">/</p>
          <Link to="/product/product-create">
            <p className="font-semibold">Update Product</p>
          </Link>
        </div>
      </div>

      {/* A2c read-only stats + QR generator. */}
      <ProductMetaPanel productData={data?.data} refetch={refetch} />

      {/* Step start */}
      <UpdateProduct productData={data?.data} refetch={refetch} />
      {/* Step end */}
    </>
  );
};

export default ProductUpdatePage;
