import { useState } from "react";
import { useForm } from "react-hook-form";

import { RiImageAddFill } from "react-icons/ri";
import { RxCross1 } from "react-icons/rx";
import ReactQuill from "react-quill-new";
import Pagination from "../common/pagination/Pagination";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import { GoEye } from "react-icons/go";

import UpdateVariationDetails from "./VariationDesCription/UpdateVariationDetails";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
// import 'react-quill-new/dist/quill.snow.css'

const UpdateOffer = ({
  setShowOfferUpdateModal,
  refetch,
  user,
  offerUpdateData,
}) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();
  const [offerProductUpdateValue, setOfferProductUpdateValue] = useState(
    offerUpdateData?.offer_products
  );
  const [openVariationDetailsModal, setOpenVariationDetailsModal] =
    useState(false);
  const [getVariationDetails, setGetVariationDetails] = useState({});

  const [description, setDescription] = useState(
    offerUpdateData?.offer_description
  );

  //get product Offer Quantity
  const handleOfferProductQuantity = (id, value) => {
    const newValue = value;

    if (newValue < 0) {
      toast.warn("Quantity cannot be negative or 0.");
      return;
    }

    const updatedItems = offerProductUpdateValue?.map((item) =>
      item?._id === id ? { ...item, offer_product_quantity: newValue } : item
    );
    setOfferProductUpdateValue(updatedItems);
  };

  //get product Campaign Price

  const handleOfferPriceChange = (id, value) => {
    const newValue = value;

    if (newValue < 0) {
      toast.warn("Price cannot be negative.");
      return;
    }
    const product = offerProductUpdateValue?.find((item) => item?._id === id);

    if (product?.offer_discount_type === "percent" && newValue > 99) {
      toast.warn("Percentage price cannot exceed 100.");
      return;
    }

    const updatedItems = offerProductUpdateValue?.map((item) =>
      item?._id === id ? { ...item, offer_discount_price: newValue } : item
    );
    setOfferProductUpdateValue(updatedItems);
  };

  //PriceType Change
  const handlePriceTypeChange = (id, value) => {
    const updatedItems = offerProductUpdateValue?.map((item) => {
      if (item?._id === id) {
        return {
          ...item,
          offer_discount_type: value,
          offer_discount_price:
            value === "percent"
              ? item?.offer_discount_price > 99
                ? 1
                : item?.offer_discount_price
              : item?.offer_discount_price,
        };
      }
      return item;
    });
    setOfferProductUpdateValue(updatedItems);
  };

  //Variation Details Function
  const showVariationDetails = (product) => {
    setOpenVariationDetailsModal(true);
    setGetVariationDetails(product);
  };

  //Image preview....
  const [imagePreview, setImagePreview] = useState(
    offerUpdateData?.offer_image
  );
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  //Update data post of Offer
  const handleDataPost = async (data) => {
    //setLoading(true);
    const offer_products = offerProductUpdateValue?.map((item) => ({
      _id: item?._id,
      offer_product_quantity: item?.offer_product_quantity,
      offer_discount_price: item?.offer_discount_price,
      offer_discount_type: item?.offer_discount_type,
      offer_product_id: item?.offer_product_id?._id,
    }));

    const startDate = new Date(data?.offer_start_date);
    const endDate = new Date(data?.offer_end_date);
    if (endDate < startDate) {
      return toast.warn("Invalid Date");
    }

    if (data?.offer_image[0]) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "offer_image") {
          formData.append(key, data?.offer_image[0]);
        } else formData.append(key, value);
      });
      formData.append("_id", offerUpdateData?._id);
      formData.append("offer_image_key", offerUpdateData?.offer_image_key);
      formData.append("offer_updated_by", user?._id);
      formData.append("offer_products", JSON.stringify(offer_products));

      const response = await fetch(`${BASE_URL}/offer`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Offer update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setShowOfferUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } else {
      setLoading(true);
      const sendData = {
        _id: offerUpdateData?._id,
        offer_title: data?.offer_title
          ? data?.offer_title
          : offerUpdateData?.offer_title,
        offer_start_date: data?.offer_start_date
          ? data?.offer_start_date
          : offerUpdateData?.offer_start_date,
        offer_end_date: data?.offer_end_date
          ? data?.offer_end_date
          : offerUpdateData?.offer_end_date,

        offer_status: data?.offer_status
          ? data?.offer_status
          : offerUpdateData?.offer_status,

        offer_description: data?.offer_description
          ? data?.offer_description
          : offerUpdateData?.offer_description,
        offer_updated_by: user?._id,
        offer_price: data?.offer_price
          ? data?.offer_price
          : offerUpdateData?.offer_price,
        offer_image_key: offerUpdateData?.offer_image_key,

        offer_products: offerProductUpdateValue?.map((item) => ({
          _id: item?._id,
          offer_product_quantity: item?.offer_product_quantity,
          offer_discount_price: item?.offer_discount_price,
          offer_discount_type: item?.offer_discount_type,
          offer_product_id: item?.offer_product_id?._id,
        })),
      };
      const response = await fetch(`${BASE_URL}/offer`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Offer update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setShowOfferUpdateModal(false);
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
          <div>
            <h3
              className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 capitalize border-b pb-2"
              id="modal-title "
            >
              Update Offer
            </h3>
            <button
              type="button"
              className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3"
              onClick={() => setShowOfferUpdateModal(false)}
            >
              {" "}
              <RxCross1 size={20}></RxCross1>
            </button>
          </div>
          <form onSubmit={handleSubmit(handleDataPost)} className="">
            {/* Form data here */}
            <div className=" bg-gray-50 p-6 rounded-md mt-4">
              <div>
                <label
                  htmlFor=""
                  className="block mb-2 font-medium text-gray-700"
                >
                  {" "}
                  Offer Title
                </label>

                <input
                  {...register("offer_title")}
                  defaultValue={offerUpdateData?.offer_title}
                  type="text"
                  placeholder="Offer title name"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
              <div className="mt-2">
                <label htmlFor="" className="block  font-medium text-gray-700">
                  Offer Description
                </label>

                <ReactQuill
                  className="h-56 mb-12"
                  id="offer_description"
                  defaultValue={offerUpdateData?.offer_description}
                  required
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter Offer Description"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block  font-medium text-gray-700">
                    Offer Start Date{" "}
                  </label>

                  <input
                    {...register("offer_start_date")}
                    type="date"
                    readOnly
                    disabled
                    min={new Date().toISOString().split("T")[0]}
                    defaultValue={offerUpdateData?.offer_start_date}
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
                <div>
                  <label className="block  font-medium text-gray-700">
                    Offer End Date{" "}
                  </label>

                  <input
                    {...register("offer_end_date")}
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    defaultValue={offerUpdateData?.offer_end_date}
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
                <div>
                  <label className="block  font-medium text-gray-700">
                    Offer Status
                  </label>
                  <select
                    {...register("offer_status")}
                    defaultValue={offerUpdateData?.offer_status}
                    className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
                  >
                    <option value="active">Active</option>
                    <option value="in-active">In-Active</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <p className="block mb-2  font-medium text-gray-700">
                  Offer Image
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
                    htmlFor="offer_logo"
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
                  {...register("offer_image", {
                    valiDate: {
                      isImage: (value) =>
                        (value[0] && value[0].type.startsWith("image/")) ||
                        "Only image files are allowed",
                    },
                  })}
                  accept="image/*"
                  type="file"
                  id="offer_logo"
                  className="mt-2  sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white file:border-none file:rounded file:px-2 file:py-1.5"
                  onChange={handleImageChange}
                />
              </div>
            </div>
            {/* Table start hare ..........update Product Table......... */}
            <div className="my-6 shadow-md bg-gray-50 px-3 py-5 border rounded-lg">
              <p className="mb-1 font-medium">You Add This Product : </p>
              <div className="overflow-x-auto rounded-t-lg">
                {offerUpdateData?.offer_products?.length > 0 ? (
                  <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="ltr:text-left rtl:text-right text-center">
                      <tr className="border divide-x">
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          Product Img
                        </th>
                        <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                          Offer Discount Type
                        </th>
                        <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                          Offer Discount{" "}
                          <span className="text-red-500">Per(qty)</span>
                        </th>
                        <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                          Product Quantity
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
                      {offerProductUpdateValue?.map((oneProduct, i) => (
                        <tr
                          key={oneProduct?.offer_product_id?._id}
                          className={`divide-x divide-gray-200 ${
                            i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 flex justify-center">
                            <img
                              src={oneProduct?.offer_product_id?.main_image}
                              alt=""
                              className="w-[34px] h-[34px] rounded-[8px]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center items-center">
                              <select
                                value={oneProduct?.offer_discount_type}
                                className="rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                                onChange={(e) =>
                                  handlePriceTypeChange(
                                    oneProduct?._id,
                                    e.target.value
                                  )
                                }
                              >
                                {" "}
                                <option selected disabled>
                                  Select Price Type
                                </option>
                                <option value="fixed">Fixed</option>
                                <option value="percent">Percent</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              value={oneProduct?.offer_discount_price || ""}
                              onChange={(e) =>
                                handleOfferPriceChange(
                                  oneProduct?._id,
                                  e.target.value
                                )
                              }
                              className="m-1 rounded-md border-gray-200 shadow-sm sm:text-sm border p-2"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                            <input
                              type="number"
                              required
                              value={oneProduct?.offer_product_quantity || ""}
                              onChange={(e) =>
                                handleOfferProductQuantity(
                                  oneProduct?._id,
                                  e.target.value
                                )
                              }
                              className="m-1 rounded-md border-gray-200 shadow-sm sm:text-sm border p-2"
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                            {oneProduct?.offer_product_id?.product_name}
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.offer_product_id?.product_price}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.offer_product_id
                              ?.product_discount_price
                              ? oneProduct?.offer_product_id
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
                                oneProduct?.offer_product_id?.is_variation ===
                                false
                              }
                            >
                              <GoEye
                                size={22}
                                className={`${
                                  oneProduct?.offer_product_id?.is_variation ===
                                  false
                                    ? "text-gray-300  cursor-default"
                                    : "text-gray-600"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.offer_product_id?.product_quantity
                              ? oneProduct?.offer_product_id?.product_quantity
                              : 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {oneProduct?.offer_product_id?.product_sku
                              ? oneProduct?.offer_product_id?.product_sku
                              : "-"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 ">
                            {oneProduct?.offer_product_id?.product_status ===
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
                            {oneProduct?.offer_product_id?.brand_id?.brand_name
                              ? oneProduct?.offer_product_id?.brand_id
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
            {/* Review Product hare Review Product*/}

            <Pagination />
            {/* Show Variation DesCription */}
            {openVariationDetailsModal && (
              <UpdateVariationDetails
                setOpenVariationDetailsModal={setOpenVariationDetailsModal}
                getVariationDetails={getVariationDetails}
              />
            )}
            <div className="flex gap-6 mt-6 justify-end">
              <button
                className="px-10 py-2 border  rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor "
                onClick={() => setShowOfferUpdateModal(false)}
              >
                Cancel
              </button>
              {loading == true ? (
                <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
                  <MiniSpinner />
                </div>
              ) : (
                <button
                  className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                  type="submit"
                >
                  Update Offer
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateOffer;
