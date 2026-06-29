import { useState } from "react";
import { useForm } from "react-hook-form";

import { RiImageAddFill } from "react-icons/ri";
import { RxCross1 } from "react-icons/rx";
import ReactQuill from "react-quill-new";

import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import { GoEye } from "react-icons/go";
import UpdateVariation from "./CampaignDescription/UpdateVariationDes/UpdateVariation";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
// import 'react-quill-new/dist/quill.snow.css'

const UpdateCampaignModal = ({
  setShowCampaignUpdateModal,
  getCampaignUpdateData,
  refetch,
  user,
}) => {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm();

  const [productUpdateValue, setProductUpdateValue] = useState(
    getCampaignUpdateData?.campaign_products
  );
  const [description, setDescription] = useState(
    getCampaignUpdateData?.campaign_description
  );

  console.log(22, productUpdateValue);

  //get product Campaign Price

  const handleCampaignPriceChange = (id, value) => {
    const newValue = value;

    if (newValue < 0) {
      toast.warn("Price cannot be negative.");
      return;
    }
    const product = productUpdateValue?.find((item) => item?._id === id);

    if (product?.campaign_price_type === "percent" && newValue > 99) {
      toast.warn("Percentage price cannot exceed 100.");
      return;
    }

    const updatedItems = productUpdateValue?.map((item) =>
      item?._id === id ? { ...item, campaign_product_price: newValue } : item
    );
    setProductUpdateValue(updatedItems);
  };
  //PriceType Change
  const handlePriceTypeChange = (id, value) => {
    const updatedItems = productUpdateValue?.map((item) => {
      if (item?._id === id) {
        return {
          ...item,
          campaign_price_type: value,
          campaign_product_price:
            value === "percent"
              ? item?.campaign_product_price > 99
                ? 1
                : item?.campaign_product_price
              : item?.campaign_product_price,
        };
      }
      return item;
    });
    setProductUpdateValue(updatedItems);
  };

  // //handle  Product Status State change
  // const handleAttributeActiveStatus = (id) => {
  //   const updatedItems = productUpdateValue.map((item) =>
  //     item._id === id
  //       ? {
  //           ...item,
  //           campaign_product_status:
  //             item?.campaign_product_status === "in-active"
  //               ? "active"
  //               : "in-active",
  //         }
  //       : item
  //   );
  //   setProductUpdateValue(updatedItems);
  // };
  // const handleAttributeInActiveStatus = (id) => {
  //   const updatedItems = productUpdateValue.map((item) =>
  //     item._id === id
  //       ? {
  //           ...item,
  //           campaign_product_status:
  //             item?.campaign_product_status === "active"
  //               ? "in-active"
  //               : "active",
  //         }
  //       : item
  //   );
  //   setProductUpdateValue(updatedItems);
  // };

  //get Product Campaign Status

  const handleSelectChange = (id, value) => {
    const updatedItems = productUpdateValue?.map((item) =>
      item?._id === id ? { ...item, campaign_product_status: value } : item
    );
    setProductUpdateValue(updatedItems);
  };

  //Show Variation State Modal
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [getVariationData, setGetVariationData] = useState(false);

  //Image preview....
  const [imagePreview, setImagePreview] = useState(
    getCampaignUpdateData?.campaign_image
  );
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };
  //show Variation Modal Function
  const showVariationDetails = (variation) => {
    setShowVariationModal(true);
    setGetVariationData(variation);
  };

  //data post of campaign......................

  const handleDataPost = async (data) => {
    const startDate = new Date(data?.campaign_start_date);
    const endDate = new Date(data?.campaign_end_date);
    if (endDate < startDate) {
      return toast.warn("Invalid Date");
    }
    if (data?.campaign_image[0]) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "campaign_image") {
          formData.append(key, data?.campaign_image[0]);
        } else formData.append(key, value);
      });

      formData.append(
        "campaign_image_key",
        getCampaignUpdateData?.campaign_image_key
      );

      formData.append("campaign_updated_by", user?._id);
      formData.append("_id", getCampaignUpdateData?._id);
      formData.append("campaign_products", JSON.stringify(productUpdateValue));

      const response = await fetch(
        `${BASE_URL}/campaign`,
        {
          method: "PATCH",
          credentials: "include",
          body: formData,
        }
      );
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Campaign update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setShowCampaignUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } else {
      setLoading(true);
      const sendData = {
        _id: getCampaignUpdateData?._id,
        campaign_title: data?.campaign_title
          ? data?.campaign_title
          : getCampaignUpdateData?.campaign_title,
        campaign_start_date: data?.campaign_start_date
          ? data?.campaign_start_date
          : getCampaignUpdateData?.campaign_start_date,
        campaign_end_date: data?.campaign_end_date
          ? data?.campaign_end_date
          : getCampaignUpdateData?.campaign_end_date,

        campaign_status: data?.campaign_status
          ? data?.campaign_status
          : getCampaignUpdateData?.campaign_status,

        campaign_description: data?.campaign_description
          ? data?.campaign_description
          : getCampaignUpdateData?.campaign_description,
        offer_updated_by: user?._id,

        campaign_image_key: getCampaignUpdateData?.campaign_image_key,

        campaign_updated_by: user?._id,
        campaign_products: productUpdateValue?.map((item) => ({
          _id: item?._id,
          campaign_product_price: item?.campaign_product_price,
          campaign_product_status: item?.campaign_product_status,
          campaign_product_id: item?.campaign_product_id?._id,
          campaign_price_type: item?.campaign_price_type,
        })),
      };
      const response = await fetch(
        `${BASE_URL}/campaign`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sendData),
        }
      );
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Campaign update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setShowCampaignUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-6">
        <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[1450px] p-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
          <div className="mt-4 mb-4">
            <h3
              className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 capitalize border-b pb-1"
              id="modal-title "
            >
              Update Campaign
            </h3>
            <button
              type="button"
              className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3"
              onClick={() => setShowCampaignUpdateModal(false)}
            >
              {" "}
              <RxCross1 size={20}></RxCross1>
            </button>
          </div>
          <form onSubmit={handleSubmit(handleDataPost)} className="">
            {/* Form data here */}
            <div className=" bg-gray-50 p-6 rounded-md">
              <div>
                <label htmlFor="" className="block  font-medium text-gray-700">
                  {" "}
                  Campaign Title
                </label>

                <input
                  {...register("campaign_title")}
                  defaultValue={getCampaignUpdateData?.campaign_title}
                  type="text"
                  placeholder="Campaign title name"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
              <div className="mt-2">
                <label
                  htmlFor=""
                  className="block mb-2 font-medium text-gray-700"
                >
                  Campaign Description
                </label>

                <ReactQuill
                  className="h-56 mb-12"
                  id="campaign_description"
                  defaultValue={getCampaignUpdateData?.campaign_description}
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter Campaign Description"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block  font-medium text-gray-700">
                    Campaign Start Date
                  </label>

                  <input
                    {...register("campaign_start_date")}
                    defaultValue={getCampaignUpdateData?.campaign_start_date}
                    min={new Date().toISOString().split("T")[0]}
                    type="date"
                    readOnly
                    disabled
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
                <div>
                  <label className="block  font-medium text-gray-700">
                    Campaign End Date <span className="text-red-500">*</span>
                  </label>

                  <input
                    {...register("campaign_end_date")}
                    defaultValue={getCampaignUpdateData?.campaign_end_date}
                    min={new Date().toISOString().split("T")[0]}
                    type="date"
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
                <div>
                  <label className="block  font-medium text-gray-700">
                    Campaign Status
                  </label>
                  <select
                    {...register("campaign_status")}
                    defaultValue={getCampaignUpdateData?.campaign_status}
                    className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
                  >
                    <option value="active">Active</option>
                    <option value="in-active">In-Active</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <p className="block mb-2  font-medium text-gray-700">
                  Add Campaign Image
                </p>
                {imagePreview ? (
                  <div className="relative">
                    <button
                      type="button"
                      className="btn bg-bgBtnInactive border p-1 absolute right-1 rounded-full top-1 text-btnInactiveColor "
                      onClick={() => setImagePreview(false)}
                    >
                      {" "}
                      <RxCross1 size={15}></RxCross1>
                    </button>

                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover my-2 rounded "
                    />
                  </div>
                ) : (
                  <label
                    className="mt-1 w-full h-[160px] bg-white border-dashed border flex justify-center items-center rounded cursor-pointer border-blueColor-400"
                    htmlFor="campaign_logo"
                  >
                    <div className="flex flex-col items-center justify-center ">
                      <div>
                        <RiImageAddFill className="text-5xl text-gray-400" />
                      </div>
                      <p className=" text-gray-500">upload image</p>
                      <p className="text-xs text-gray-500">
                        Upload 300x300 pixel images in PNG, JPG, or WebP format
                        (max 1 MB).
                      </p>
                    </div>
                  </label>
                )}
                <input
                  {...register("campaign_image", {
                    valiDate: {
                      isImage: (value) =>
                        (value[0] && value[0].type.startsWith("image/")) ||
                        "Only image files are allowed",
                    },
                  })}
                  accept="image/*"
                  type="file"
                  id="campaign_logo"
                  className="mt-2  sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white file:border-none file:rounded file:px-2 file:py-1.5"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Table start hare ..........update Product Table......... */}
            <div className="my-6 shadow-md bg-gray-50 px-3 py-5 border rounded-lg">
              <p className="mb-1 font-medium">You Add This Product : </p>
              <div className="overflow-x-auto rounded-t-lg">
                {productUpdateValue?.length > 0 ? (
                  <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="ltr:text-left rtl:text-right text-center">
                      <tr className="border divide-x">
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Product Img
                        </th>
                        <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                          Price Type
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Campaign Discount Price
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Campaign Product Status
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Product name
                        </th>

                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Price
                        </th>

                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Discount Price
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          variation
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Quantity
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Product SKU
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Status
                        </th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Brand
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 text-center">
                      {productUpdateValue?.map((oneProduct, i) => (
                        <tr
                          key={oneProduct?.campaign_product_id?._id}
                          className={`divide-x divide-gray-200 ${
                            i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 flex justify-center">
                            <img
                              src={oneProduct?.campaign_product_id?.main_image}
                              alt=""
                              className="w-[34px] h-[34px] rounded-[8px]"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex justify-center items-center">
                              <select
                                required
                                className="rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                                value={oneProduct?.campaign_price_type}
                                onChange={(e) =>
                                  handlePriceTypeChange(
                                    oneProduct?._id,
                                    e.target.value
                                  )
                                }
                              >
                                {" "}
                                <option value="fixed">Fixed</option>
                                <option value="percent">Percent</option>
                              </select>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                            <input
                              type="number"
                              required
                              value={oneProduct?.campaign_product_price}
                              onChange={(e) =>
                                handleCampaignPriceChange(
                                  oneProduct?._id,
                                  e.target.value
                                )
                              }
                              className="m-1 rounded-md border-gray-200 shadow-sm sm:text-sm border p-2"
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                            {/* {oneProduct?.campaign_product_status ===
                            "active" ? (
                              <button
                                type="button"
                                className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                                onClick={() =>
                                  handleAttributeActiveStatus(oneProduct?._id)
                                }
                              >
                                <span>Active</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                                onClick={() =>
                                  handleAttributeInActiveStatus(oneProduct?._id)
                                }
                              >
                                <span>In-Active</span>
                              </button>
                            )} */}
                            <div className="flex justify-center items-center">
                              <select
                                value={oneProduct?.campaign_product_status}
                                className="rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                                onChange={(e) =>
                                  handleSelectChange(
                                    oneProduct?._id,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="active">Active</option>
                                <option value="in-active">In-Active</option>
                              </select>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                            {oneProduct?.campaign_product_id?.product_name}
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.campaign_product_id?.product_price}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.campaign_product_id
                              ?.product_discount_price
                              ? oneProduct?.campaign_product_id
                                  ?.product_discount_price
                              : 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            <button
                              type="button"
                              onClick={() =>
                                showVariationDetails(oneProduct?.variations)
                              }
                              disabled={
                                oneProduct?.campaign_product_id
                                  ?.is_variation === false
                              }
                            >
                              <GoEye
                                size={22}
                                className={`${
                                  oneProduct?.campaign_product_id
                                    ?.is_variation === false
                                    ? "text-gray-300  cursor-default"
                                    : "text-gray-600"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.campaign_product_id?.product_quantity
                              ? oneProduct?.campaign_product_id?.product_quantity
                              : 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.campaign_product_id?.product_sku
                              ? oneProduct?.campaign_product_id?.product_sku
                              : "-"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 ">
                            {oneProduct?.campaign_product_id?.product_status ===
                            "active" ? (
                              <button
                                type="button"
                                className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                                // onClick={() =>
                                //   handleAttributeActiveStatus(
                                //     attribute?._id,
                                //     attribute?.attribute_status
                                //       ? 'in-active'
                                //       : 'active'
                                //   )
                                // }
                              >
                                <span>Active</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                                // onClick={() =>
                                //   handleAttributeInActiveStatus(
                                //     attribute?._id,
                                //     attribute?.attribute_status
                                //       ? 'active'
                                //       : 'in-active'
                                //   )
                                // }
                              >
                                <span>In-Active</span>
                              </button>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 ">
                            {oneProduct?.campaign_product_id?.brand_id?.brand_name
                              ? oneProduct?.campaign_product_id?.brand_id
                                  ?.brand_name
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <NoDataFound />
                )}
              </div>
            </div>

            {/* Table start hare */}

            <div className="flex gap-6 mt-6 justify-end">
              {loading == true ? (
                <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
                  <MiniSpinner />
                </div>
              ) : (
                <button
                  className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                  type="submit"
                >
                  Update Campaign
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {showVariationModal && (
        <UpdateVariation
          getVariationData={getVariationData}
          setShowVariationModal={setShowVariationModal}
        />
      )}
    </div>
  );
};

export default UpdateCampaignModal;
