import { useState, useEffect } from "react";
import { FiX, FiPlus, FiMinus, FiChevronLeft, FiChevronRight, FiShoppingCart } from "react-icons/fi";
import { BASE_URL } from "../../utils/baseURL";

const ProductQuickViewModal = ({ product: initialProduct, onClose, onAddToCart }) => {
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);

  // Fetch full product details on mount — list response has minimal fields
  useEffect(() => {
    if (!initialProduct?._id) return;
    setLoading(true);
    fetch(`${BASE_URL}/product/dashboard/${initialProduct._id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d?.data) setProduct(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialProduct._id]);

  const images = [
    ...(product.main_image ? [product.main_image] : []),
    ...(product.other_images || []),
  ];
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedVar, setSelectedVar] = useState(
    product.variations?.length > 0 ? product.variations[0] : null,
  );
  const [qty, setQty] = useState(1);

  // Update selectedVar when full product loads (gets full variation list)
  useEffect(() => {
    if (product.variations?.length > 0) {
      setSelectedVar(product.variations[0]);
    }
  }, [product._id, product.variations?.length]);

  const price = selectedVar
    ? (selectedVar.variation_sale_price || selectedVar.variation_discount_price || selectedVar.variation_price)
    : (product.product_sale_price || product.product_price);
  const origPrice = selectedVar
    ? (selectedVar.variation_sale_price || selectedVar.variation_discount_price ? selectedVar.variation_price : null)
    : (product.product_sale_price ? product.product_price : null);
  const stock = selectedVar ? selectedVar.variation_quantity : product.product_quantity;
  const varImage = selectedVar?.variation_image || selectedVar?.variation_images?.[0];
  const displayImages = varImage ? [varImage, ...images.filter((i) => i !== varImage)] : images;

  const handleAdd = () => {
    onAddToCart(product, selectedVar, qty);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-800 text-sm truncate pr-4">{product.product_name}</h3>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0">
            <FiX size={16} />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-2xl">
            <svg className="animate-spin h-6 w-6 text-blueColor-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col sm:flex-row overflow-y-auto">

          {/* Image slider */}
          <div className="sm:w-56 shrink-0 bg-gray-50 p-3 flex flex-col gap-2">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              {displayImages.length > 0 ? (
                <img src={displayImages[imgIdx]} alt={product.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiShoppingCart size={32} className="text-gray-300" />
                </div>
              )}
              {displayImages.length > 1 && (
                <>
                  <button type="button"
                    onClick={() => setImgIdx((i) => (i - 1 + displayImages.length) % displayImages.length)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow">
                    <FiChevronLeft size={13} />
                  </button>
                  <button type="button"
                    onClick={() => setImgIdx((i) => (i + 1) % displayImages.length)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow">
                    <FiChevronRight size={13} />
                  </button>
                </>
              )}
            </div>
            {displayImages.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {displayImages.slice(0, 6).map((img, i) => (
                  <button key={i} type="button" onClick={() => setImgIdx(i)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${imgIdx === i ? "border-blueColor-500" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-4 space-y-3">
            {/* Price */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-extrabold text-blueColor-700">৳{price?.toLocaleString()}</span>
              {origPrice && origPrice > price && (
                <>
                  <span className="text-sm text-gray-400 line-through">৳{origPrice?.toLocaleString()}</span>
                  <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold">
                    -{Math.round(((origPrice - price) / origPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-xs font-medium ${stock > 0 ? "text-green-700" : "text-red-600"}`}>
                {stock > 0 ? `In Stock${stock <= 10 ? ` · ${stock} left` : ""}` : "Out of Stock"}
              </span>
            </div>

            {/* SKU */}
            {(selectedVar?.variation_sku || product.product_sku) && (
              <p className="text-xs text-gray-400">SKU: {selectedVar?.variation_sku || product.product_sku}</p>
            )}

            {/* Short description */}
            {product.product_short_description && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{product.product_short_description}</p>
            )}

            {/* Variations */}
            {product.variations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Variation</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.variations.map((v) => {
                    const vPrice = v.variation_sale_price || v.variation_discount_price || v.variation_price;
                    const isSelected = selectedVar?._id === v._id;
                    const outOfStock = v.variation_quantity <= 0;
                    return (
                      <button key={v._id} type="button" disabled={outOfStock}
                        onClick={() => { setSelectedVar(v); setQty(1); setImgIdx(0); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all relative
                          ${isSelected
                            ? "bg-blueColor-600 text-white border-blueColor-600 shadow-md"
                            : outOfStock
                              ? "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed"
                              : "border-gray-300 text-gray-700 hover:border-blueColor-400 hover:text-blueColor-600"
                          }`}>
                        {v.variation_name}
                        {vPrice !== price && !isSelected && (
                          <span className="ml-1 text-gray-400 text-[10px]">৳{vPrice?.toLocaleString()}</span>
                        )}
                        {outOfStock && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] px-1 rounded-full">0</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qty stepper */}
            <div className="flex items-center gap-3 pt-1">
              <p className="text-xs font-semibold text-gray-600">Qty:</p>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-30" disabled={qty <= 1}>
                  <FiMinus size={12} />
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-gray-800 border-x border-gray-300 min-w-[40px] text-center">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(stock > 0 ? stock : 999, q + 1))}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-30"
                  disabled={stock > 0 && qty >= stock}>
                  <FiPlus size={12} />
                </button>
              </div>
              {stock > 0 && qty >= stock && (
                <span className="text-xs text-orange-500 font-medium">Max {stock}</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleAdd} disabled={stock <= 0}
            className="flex-1 py-2 rounded-xl bg-blueColor-600 hover:bg-blueColor-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2">
            <FiPlus size={14} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickViewModal;
