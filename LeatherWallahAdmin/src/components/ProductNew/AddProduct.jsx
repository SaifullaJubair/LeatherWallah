import ProductForm from "./ProductForm";

// AddProduct — single-page form (no wizard). The old StepOne → StepThree
// 2-step machinery was removed; everything now lives on one scrollable page
// with collapsible Advanced sections, owned by ProductForm.jsx. After save,
// the form shows a "✨ Configure Hero Content →" CTA that routes to the
// existing /product/page-content/:id page (theme / benefits / FAQ / nutrition
// stay there — owner publishes first, enriches second).
const AddProduct = () => {
  return (
    <div className="mt-6 bg-white rounded-lg shadow-xl sm:p-6 py-6 px-4">
      <ProductForm mode="add" />
    </div>
  );
};

export default AddProduct;
