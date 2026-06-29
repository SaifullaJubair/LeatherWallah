const OrderSummaryTable = ({ orderData }) => {
  return (
    <div className="mt-4 bg-white shadow-sm">
      <div className="flex justify-between bg-gray-100/50 p-2.5">
        <p className="text-xl">Order Summary</p>
      </div>
      <div className="p-3">
        {orderData?.shop_products?.map((shop, index) => (
          <div key={index} className="mb-4 overflow-x-auto ">
            <p className="text-lg font-medium">{shop?.shop_name}</p>
            <table className="min-w-full text-sm ">
              <thead className="border-b">
                <tr className="text-gray-900">
                  <th className="whitespace-nowrap p-4">#</th>
                  <th className="whitespace-nowrap p-4">Image</th>
                  <th className="whitespace-nowrap p-4">Product Info</th>
                  <th className="whitespace-nowrap p-4">Unit Price</th>
                  <th className="whitespace-nowrap p-4">Quantity</th>
                  <th className="whitespace-nowrap p-4">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-gray-200">
                {shop?.order_products?.map((product, idx) => (
                  <tr
                    key={idx}
                    className={`divide-y divide-gray-100 space-y-2 py-2 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="whitespace-nowrap p-4">{idx + 1}</td>
                    <td className="py-2">
                      <img
                        src={
                          product?.variations?.variation_images?.[0] ||
                          product?.variations?.variation_image ||
                          product?.main_image
                        }
                        className="w-20 h-[72px]   border"
                        alt=""
                      />
                    </td>
                    <td className="min-w-[260px] py-2.5 text-gray-700 px-4">
                      <div className="mt-1">
                        <p className="mb-1">{product?.product_name}</p>
                        <div className="text-text-Lighter items-center">
                          <p>Brand: {product?.brand}</p>
                          {product?.variation_id && (
                            <p>Variation ID: {product?.variation_id}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                      {product?.product_unit_price >
                      product?.product_unit_final_price ? (
                        <div className="flex items-center gap-2">
                          <span className="line-through text-sm">
                            {" "}
                            ৳ {product?.product_unit_price}
                          </span>
                          <span className="">
                            {" "}
                            ৳ {product?.product_unit_final_price}
                          </span>
                        </div>
                      ) : (
                        <span> ৳ {product?.product_unit_price}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                      {product?.product_quantity}
                    </td>
                    <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                      ৳{product?.product_grand_total_price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sm:text-right text-text-default mt-2.5 ">
              <p className="text-sm">
                <strong>Shop Subtotal:</strong> ৳{shop?.sub_total_amount}
              </p>
              <p className="text-sm">
                <strong>Discount Amount:</strong> ৳{shop?.discount_amount}
              </p>
              <p className="text-sm">
                <strong>Grand Total:</strong> ৳{shop?.grand_total_amount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderSummaryTable;
