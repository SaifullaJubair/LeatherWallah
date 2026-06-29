const StepOnePrice = ({ stepOneData, register, errors }) => {
  return (
    <section className=" shadow-md bg-gray-50 rounded-lg p-4 sm:p-8 md:p-12">
      <h1 className=" text-xl sm:text-2xl md:text-3xl mb-6 font-semibold text-textColor">
        Product Price
      </h1>
      {/* Product all field  */}
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        {/* Product Price */}
        <div className="">
          <label htmlFor="product_price" className="font-medium">
            Product Price<span className="text-red-500">*</span>
          </label>
          <input
            defaultValue={stepOneData?.product_price}
            {...register("product_price", {
              required: "Product Price is required",
            })}
            id="product_price"
            type="number"
            placeholder="Enter Product Price"
            className="block w-full p-2.5 text-gray-800 outline-primaryColor bg-white border border-gray-300 rounded-lg mt-2"
            min={1}
          />
          {errors.product_price && (
            <p className="text-red-600">{errors.product_price?.message}</p>
          )}
        </div>
        {/* Product Discount Price */}
        <div className="">
          <label htmlFor="product_discount_price" className="font-medium">
            After Discount Price <small>(Leave blank if not available.)</small>
          </label>
          <input
            defaultValue={stepOneData?.product_discount_price}
            {...register("product_discount_price")}
            id="product_discount_price"
            type="number"
            placeholder="Enter Product Discount Price"
            className="block w-full p-2.5 outline-primaryColor text-gray-800 bg-white border border-gray-300 rounded-lg mt-2"
            min={0}
          />
        </div>

        {/* Product Buying Price */}
        <div className="">
          <label htmlFor="product_buying_price" className="font-medium">
            Product Buying Price
          </label>
          <input
            defaultValue={stepOneData?.product_buying_price}
            {...register("product_buying_price")}
            id="product_buying_price"
            type="number"
            placeholder="Enter Product Buying Price"
            className="block w-full p-2.5 text-gray-800 outline-primaryColor bg-white border border-gray-300 rounded-lg mt-2"
            min={0}
          />
          {errors.product_buying_price && (
            <p className="text-red-600">
              {errors.product_buying_price?.message}
            </p>
          )}
        </div>
        {/* Product Quantity — required only to PUBLISH (validated in
            ProductForm.validateSimpleNumeric); a draft can be saved without it. */}
        <div className="">
          <label htmlFor="product_quantity" className="font-medium">
            Product Quantity{" "}
            <span className="text-xs text-gray-400">(required to publish)</span>
          </label>
          <input
            defaultValue={stepOneData?.product_quantity}
            {...register("product_quantity")}
            id="product_quantity"
            type="number"
            placeholder="Enter Product Quantity"
            className="block w-full p-2.5 text-gray-800 outline-primaryColor bg-white border border-gray-300 rounded-lg mt-2"
            min={0}
          />
          {errors.product_quantity && (
            <p className="text-red-600">{errors.product_quantity?.message}</p>
          )}
        </div>
        {/* Product Alert Quantity */}
        {/* <div className="">
          <label htmlFor="product_alert_quantity" className="font-medium">
            Product Alert Quantity
          </label>
          <input
            defaultValue={stepOneData?.product_alert_quantity}
            {...register("product_alert_quantity")}
            id="product_alert_quantity"
            type="number"
            placeholder="Enter Product Alert Quantity"
            className="block w-full p-2.5 text-gray-800 outline-primaryColor bg-white border border-gray-300 rounded-lg mt-2"
            min={0}
          />
        </div> */}
      </div>
    </section>
  );
};

export default StepOnePrice;
