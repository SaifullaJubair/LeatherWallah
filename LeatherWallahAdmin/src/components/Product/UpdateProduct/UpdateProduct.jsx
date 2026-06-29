import ProductForm from "../../ProductNew/ProductForm";

// UpdateProduct — single-page form (no wizard). Mirrors AddProduct exactly;
// the shared ProductForm.jsx prefills from `productData` and submits via
// PATCH /product/:id. The 2-step UpdateStepOne / UpdateStepThree pair has
// been retired in favour of one scrollable page with collapsible Advanced
// sections.
const UpdateProduct = ({ productData, refetch }) => {
  if (!productData?._id) return null;
  return (
    <div className="mt-4 bg-white rounded-lg shadow-xl sm:p-6 py-6 px-4">
      <ProductForm
        mode="update"
        initialData={productData}
        onSaved={() => refetch && refetch()}
      />
    </div>
  );
};

export default UpdateProduct;
