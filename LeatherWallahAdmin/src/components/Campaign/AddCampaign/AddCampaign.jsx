import { useState } from "react";
import { useForm } from "react-hook-form";

import { RiImageAddFill } from "react-icons/ri";
import { RxCross1, RxCrossCircled } from "react-icons/rx";
import ReactQuill from "react-quill-new";
import CampaignProductTable from "./CampaignProductTable";

import { GoEye } from "react-icons/go";
import VariationModal from "./VariationModal";
import { toast } from "react-toastify";
import { BASE_URL } from "../../../utils/baseURL";
import { useNavigate } from "react-router-dom";
import MiniSpinner from "../../../shared/MiniSpinner/MiniSpinner";

const AddCampaign = ({
  handleSearchValue,
  campaignData,
  refetch,
  setLimit,
  setPage,
  page,
  user,
  limit,
  isLoading,
  searchTerm,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [campaignProducts, setCampaignProducts] = useState([]);

  const [showVariationModal, setShowVariationModal] = useState(false);
  const [variationData, setVariationData] = useState(null);
  const [selectedValue, setSelectedValue] = useState("");

  //Image preview....
  const [imagePreview, setImagePreview] = useState(null);
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  //Add Product Function
  const handleAddProduct = (product) => {
    if (!campaignProducts?.some((item) => item?._id === product?._id)) {
      const newArray = [...campaignProducts, product];
      setCampaignProducts(newArray);
    }
  };
  //Delete Product
  const handleDeleteProduct = (oneProduct) => {
    const newProducts = campaignProducts?.filter(
      (p) => p?._id !== oneProduct?._id
    );
    setCampaignProducts(newProducts);
  };
  //get product Campaign Price
  const handleCampaignPriceChange = (id, value) => {
    const newValue = value;

    if (newValue < 0) {
      toast.warn("Price cannot be negative.");
      return;
    }
    const product = campaignProducts?.find((item) => item?._id === id);

    if (product?.campaign_price_type === "percent" && newValue > 99) {
      toast.warn("Percentage price cannot exceed 100.");
      return;
    }

    const updatedItems = campaignProducts?.map((item) =>
      item?._id === id ? { ...item, campaign_product_price: newValue } : item
    );
    setCampaignProducts(updatedItems);
  };

  //get Product Campaign Status

  const handleSelectChange = (id, value) => {
    const updatedItems = campaignProducts?.map((item) =>
      item?._id === id ? { ...item, campaign_product_status: value } : item
    );
    setCampaignProducts(updatedItems);
  };
  const handlePriceTypeChange = (id, value) => {
    setSelectedValue(value);
    const updatedItems = campaignProducts?.map((item) =>
      item?._id === id ? { ...item, campaign_price_type: value } : item
    );
    setCampaignProducts(updatedItems);
  };

  //data post of campaign
  const handleDataPost = async (data) => {
    setLoading(true);
    const startDate = new Date(data?.campaign_start_date);
    const endDate = new Date(data?.campaign_end_date);
    if (endDate < startDate) {
      setLoading(false);
      return toast.warn("Invalid Date");
    }

    if (campaignProducts?.length <= 0) {
      setLoading(false);
      return toast.warn("Please Add Some Product");
    }
    if (!selectedValue) {
      setLoading(false);
      return toast.warn("Please Select the Campaign Price Type");
    }

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "campaign_image") {
          formData.append(key, data?.campaign_image[0]);
        } else {
          formData.append(key, value);
        }
      });

      formData.append("campaign_publisher_id", user?._id);

      formData.append("campaign_description", description);
      formData.append("campaign_products", JSON.stringify(campaignProducts));

      const response = await fetch(
        `${BASE_URL}/campaign`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : "Campaign Product  created successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        navigate("/campaign-list");
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="shadow-md p-5 bg-white rounded-lg">
        <div className="max-w-5xl mx-auto mt-4 mb-4">
          <h3
            className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 capitalize border-b pb-1"
            id="modal-title "
          >
            Add Campaign
          </h3>
        </div>

        <form onSubmit={handleSubmit(handleDataPost)} className="">
          {/* Form data here */}
          <div className="max-w-5xl mx-auto bg-gray-50 p-6 rounded-md shadow-md">
            <div>
              <label htmlFor="" className="block  font-medium text-gray-700">
                {" "}
                Campaign Title
                <span className="text-red-500">*</span>
              </label>

              <input
                {...register("campaign_title", {
                  required: "Campaign title name is required",
                })}
                type="text"
                placeholder="Campaign title name"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.campaign_title && (
                <p className="text-red-600">{errors.campaign_title?.message}</p>
              )}
            </div>
            <div className="mt-2">
              <label
                htmlFor=""
                className="block mb-2 font-medium text-gray-700"
              >
                Campaign Description
                <span className="text-red-500">*</span>
              </label>

              <ReactQuill
                className="h-56 mb-12"
                id="campaign_description"
                required
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Enter Campaign Description"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block  font-medium text-gray-700">
                  Campaign Start Date <span className="text-red-500">*</span>
                </label>

                <input
                  {...register("campaign_start_date", {
                    required: "Start date Serial is required",
                  })}
                  min={new Date().toISOString().split("T")[0]}
                  type="date"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.campaign_start_date && (
                  <p className="text-red-600">
                    {errors.campaign_start_date?.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block  font-medium text-gray-700">
                  Campaign End Date <span className="text-red-500">*</span>
                </label>

                <input
                  {...register("campaign_end_date", {
                    required: "End date Serial is required",
                  })}
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.campaign_end_date && (
                  <p className="text-red-600">
                    {errors.campaign_end_date?.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block  font-medium text-gray-700">
                  Campaign Status <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("campaign_status", {
                    required: "Campaign Status is required",
                  })}
                  className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
                >
                  <option value="active">Active</option>
                  <option value="in-active">In-Active</option>
                </select>
                {errors.campaign_status && (
                  <p className="text-red-600">
                    {errors.campaign_status.message}
                  </p>
                )}
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
                  required: "Image is Required",
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

              {errors.campaign_image && (
                <p className="text-red-600">{errors.campaign_image?.message}</p>
              )}
            </div>
          </div>

          {/* Table start hare */}

          {campaignProducts?.length > 0 && (
            <div className="my-6 shadow-md bg-gray-50 px-3 py-5 border rounded-lg">
              <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                <thead className="ltr:text-left rtl:text-right text-center bg-[#fff9ee]">
                  <tr className="border divide-x">
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Delete
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Price Type
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Campaign Discount Price
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Status
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Product Img
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Product name
                    </th>

                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Price
                    </th>

                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Discount Price
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      variation
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Quantity
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Product SKU
                    </th>
                    <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-center">
                  {campaignProducts?.map((oneProduct, i) => (
                    <tr
                      key={oneProduct?._id}
                      className={`divide-x divide-gray-200 ${
                        i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(oneProduct)}
                        >
                          <RxCrossCircled
                            size={25}
                            className="text-red-600 hover:text-red-400 "
                          />
                        </button>
                      </td>
                      <td className="">
                        <div className="flex justify-center items-center">
                          <select
                            required
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
                      <td>
                        <input
                          type="number"
                          required
                          value={oneProduct?.campaign_product_price || ""}
                          onChange={(e) =>
                            handleCampaignPriceChange(
                              oneProduct?._id,
                              e.target.value
                            )
                          }
                          className="m-1 rounded-md border-gray-200 shadow-sm sm:text-sm border p-2"
                        />
                      </td>

                      <td className="">
                        <div className="flex justify-center items-center">
                          <select
                            required
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

                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 flex justify-center">
                        <img
                          src={oneProduct?.main_image}
                          alt=""
                          className="w-[34px] h-[34px] rounded-[8px]"
                        />
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {oneProduct?.product_name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {oneProduct?.product_price}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {oneProduct?.product_discount_price
                          ? oneProduct?.product_discount_price
                          : 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            setShowVariationModal(true);
                            setVariationData(oneProduct);
                          }}
                          disabled={oneProduct?.is_variation === false}
                        >
                          <GoEye
                            size={22}
                            className={`${
                              oneProduct?.is_variation === false
                                ? "text-gray-300  cursor-default"
                                : "text-gray-600"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {oneProduct?.product_quantity
                          ? oneProduct?.product_quantity
                          : 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {oneProduct?.product_sku
                          ? oneProduct?.product_sku
                          : "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 ">
                        {oneProduct?.product_status === "active" ? (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 shadow-md bg-gray-50 px-3 py-5 border rounded-lg">
            <div className="flex justify-between items-center ">
              {" "}
              <p className="mb-1 font-medium">Review Product Info : </p>
              {/* search Category... */}
              <div className="my-6">
                <input
                  type="text"
                  defaultValue={searchTerm}
                  onChange={(e) => handleSearchValue(e.target.value)}
                  placeholder="Search Offer Product..."
                  className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
            </div>

            {/* Product Table */}
            <CampaignProductTable
              campaignData={campaignData?.data}
              totalData={campaignData?.totalData}
              setLimit={setLimit}
              setPage={setPage}
              page={page}
              limit={limit}
              handleAddProduct={handleAddProduct}
              oneProducts={campaignProducts}
              isLoading={isLoading}
            />
          </div>
          <div className="mt-3 flex justify-end">
            {" "}
            {loading == true ? (
              <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                type="submit"
              >
                Add Campaign
              </button>
            )}
          </div>
        </form>
      </div>
      {showVariationModal && (
        <VariationModal
          showVariationModal={showVariationModal}
          setShowVariationModal={setShowVariationModal}
          variationData={variationData}
        />
      )}
    </div>
  );
};

export default AddCampaign;
