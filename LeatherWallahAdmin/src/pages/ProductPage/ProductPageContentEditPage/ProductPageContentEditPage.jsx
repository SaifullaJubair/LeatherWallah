import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../../utils/baseURL";
import ProductPageContentForm from "../../../components/ProductPageContent/ProductPageContentForm";
import { LoaderOverlay } from "../../../components/common/loader/LoderOverley";

const ProductPageContentEditPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/product/dashboard/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setProduct(data?.data || data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <LoaderOverlay />;
  if (!product?._id) {
    return (
      <div className="p-4 text-center text-gray-500">Product not found.</div>
    );
  }

  // Header (title + Back + Save/Open-live) now lives INSIDE the form so the
  // editor can be a single viewport-height flex column with its own internal
  // scroll. The page wrapper just provides outer padding.
  return (
    <div className="h-full min-h-0 flex flex-col">
      <ProductPageContentForm product={product} refetch={load} />
    </div>
  );
};

export default ProductPageContentEditPage;
