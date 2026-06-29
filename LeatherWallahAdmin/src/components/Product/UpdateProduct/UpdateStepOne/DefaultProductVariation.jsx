const ProductTable = ({ defaultVariationData, setDefaultVariationData }) => {
  // Handler function to update state when an input value changes
  const handleInputChange = (index, field, value) => {
    const newData = [...defaultVariationData];
    newData[index][field] = value;
    setDefaultVariationData(newData);
  };

  // Handler to handle image change and store it as a file
  const handleImageChange = (index, file) => {
    const newData = [...defaultVariationData];
    newData[index].variation_image = file;
    setDefaultVariationData(newData);
  };
  // Handler to handle Video change and store it as a file
  const handleVideoChange = (index, file) => {
    const newData = [...defaultVariationData];
    newData[index].variation_video = file;
    setDefaultVariationData(newData);
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 mt-6">
        <div className="overflow-x-auto scrollbar-thin scrollbar-hide ">
          <table className="w-full divide-y-2 divide-gray-200 bg-white text-sm">
            <thead className="bg-[#fff9ee]">
              <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                <td className="whitespace-nowrap px-4 py-5">#SL No</td>
                <td className="whitespace-nowrap px-4 py-5">Variant</td>
                <td className="whitespace-nowrap px-4 py-5">Variant Price</td>
                <td className="whitespace-nowrap px-4 py-5">Discount Price</td>
                <td className="whitespace-nowrap px-4 py-5">Buying Price</td>
                <td className="whitespace-nowrap px-4 py-5">
                  Variant Quantity
                </td>
                {/* <td className="whitespace-nowrap px-4 py-5">
                  Variant Alert Quantity
                </td> */}
                {/* <td className="whitespace-nowrap px-4 py-5">Variant SKU</td> */}
                <td className="whitespace-nowrap px-4 py-5">Image</td>
                <td className="whitespace-nowrap px-4 py-5">Video</td>
              </tr>
            </thead>
            <tbody>
              {defaultVariationData?.map((item, index) => (
                <tr
                  key={index}
                  className={`divide-x divide-gray-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                  }`}
                >
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700 text-center">
                    {index + 1}
                  </td>
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700 text-center">
                    {item?.variation_name}
                  </td>
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    <input
                      type="number"
                      className="p-2 border rounded-md mx-1.5 outline-primaryColor text-center"
                      value={item?.variation_price}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "variation_price",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    <input
                      type="number"
                      className="p-2 border rounded-md mx-1.5 outline-primaryColor text-center"
                      value={item?.variation_discount_price}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "variation_discount_price",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    <input
                      type="number"
                      className="p-2 border rounded-md mx-1.5 outline-primaryColor text-center"
                      value={item?.variation_buying_price}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "variation_buying_price",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    <input
                      type="number"
                      className="p-2 border rounded-md mx-1.5 outline-primaryColor text-center"
                      value={item?.variation_quantity}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "variation_quantity",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  {/* <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    <input
                      type="number"
                      className="p-2 border rounded-md mx-1.5 outline-primaryColor text-center"
                      value={item?.variation_alert_quantity}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "variation_alert_quantity",
                          e.target.value
                        )
                      }
                    />
                  </td> */}
                  {/* <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    <input
                      type="text"
                      className="p-2 border rounded-md mx-1.5 outline-primaryColor text-center"
                      value={item?.variation_sku}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "variation_sku",
                          e.target.value
                        )
                      }
                    />
                  </td> */}
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    {/* Display the image preview if it's already an uploaded file */}
                    {item?.variation_image instanceof File ? (
                      <div className="flex justify-center items-center">
                        <img
                          src={URL.createObjectURL(item?.variation_image)}
                          alt={item?.variation_sku}
                          className="w-20 h-16 object-cover"
                        />
                      </div>
                    ) : (
                      // Display the current image URL or a placeholder
                      <div className="flex justify-center items-center">
                        <img
                          src={
                            item?.variation_image ||
                            "https://via.placeholder.com/50"
                          }
                          alt={item?.variation_sku}
                          className="w-20 h-16 object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(index, e.target.files[0])
                      }
                    />
                  </td>
                  {/* video */}
                  <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                    {/* Display the image preview if it's already an uploaded file */}
                    {item?.variation_video instanceof File ? (
                      <div className="flex justify-center items-center">
                        <video
                          className="w-20 h-16 rounded-md object-cover"
                          src={URL.createObjectURL(item?.variation_video)}
                          alt={item?.variation_sku}
                          muted
                          loop
                          autoPlay
                          controls
                        ></video>
                      </div>
                    ) : (
                      // Display the current image URL or a placeholder
                      <div className="flex justify-center items-center">
                        <video
                          className="w-20 h-16 rounded-md object-cover"
                          src={
                            item?.variation_video ||
                            "https://via.placeholder.com/50"
                          }
                          alt={item?.variation_sku}
                          muted
                          loop
                          autoPlay
                          controls
                        ></video>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        handleVideoChange(index, e.target.files[0])
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const DefaultProductVariation = ({
  defaultVariationData,
  setDefaultVariationData,
  stepOneData,
}) => {
  return (
    <div>
      <h1>Product Variants</h1>
      <ProductTable
        defaultVariationData={defaultVariationData}
        setDefaultVariationData={setDefaultVariationData}
        stepOneData={stepOneData}
      />
    </div>
  );
};

export default DefaultProductVariation;
