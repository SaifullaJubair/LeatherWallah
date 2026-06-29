import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { MdAddToPhotos } from "react-icons/md";

import { RiImageAddFill } from "react-icons/ri";
import { RxCross1, RxCrossCircled } from "react-icons/rx";
import ReactQuill from "react-quill-new";
// import 'react-quill-new/dist/quill.snow.css'
import UseGetProduct from "./../../hooks/UseGetProduct";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import Pagination from "../common/pagination/Pagination";
import { GoEye } from "react-icons/go";
import { AuthContext } from "../../context/AuthProvider";

import VariationDesCription from "./VariationDesCription/VariationDesCription";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import useDebounced from "../../hooks/useDebounced";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";

const AddOffers = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);

  const [openVariationDetailsModal, setOpenVariationDetailsModal] =
    useState(false);
  const [getVariationDetails, setGetVariationDetails] = useState({});
  const [description, setDescription] = useState("");
  const [oneProducts, setOneProducts] = useState([]);
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const navigate = useNavigate();

  //Image preview....
  const [imagePreview, setImagePreview] = useState(null);
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  //get Product Data
  const {
    data: products = [],
    refetch,
    isLoading,
  } = UseGetProduct(page, limit, searchTerm);

  // handle item search function....
  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => {
    setSearchTerm(searchText);
  }, [searchText]);

  // handle item search function....
  const handleSearchValue = (value) => {
    setSearchValue(value);
    setLimit(10);
    setPage(1);
  };

  //get product Offer Quantity
  const handleOfferProductQuantity = (id, value) => {
    const newValue = value;

    if (newValue < 0) {
      toast.warn("Quantity cannot be negative or 0.");
      return;
    }

    const updatedItems = oneProducts?.map((item) =>
      item?._id === id ? { ...item, offer_product_quantity: newValue } : item
    );
    setOneProducts(updatedItems);
  };

  //get product Offer Price
  const handleOfferPriceChange = (id, value) => {
    const newValue = value;

    if (newValue < 0) {
      toast.warn("Price cannot be negative.");
      return;
    }
    const product = oneProducts?.find((item) => item?._id === id);

    if (product?.offer_discount_type === "percent" && newValue > 99) {
      toast.warn("Percentage price cannot exceed 100.");
      return;
    }

    const updatedItems = oneProducts?.map((item) =>
      item?._id === id ? { ...item, offer_discount_price: newValue } : item
    );
    setOneProducts(updatedItems);
  };

  //offer type
  const handlePriceTypeChange = (id, value) => {
    setSelectedValue(value);
    const updatedItems = oneProducts?.map((item) =>
      item?._id === id ? { ...item, offer_discount_type: value } : item
    );
    setOneProducts(updatedItems);
  };

  //Add Product Function
  const handleAddProduct = (product) => {
    if (!oneProducts.some((item) => item?._id === product?._id)) {
      const newArray = [...oneProducts, product];
      setOneProducts(newArray);
    }
  };
  //Delete Product
  const handleDeleteProduct = (oneProduct) => {
    const newProducts = oneProducts.filter((p) => p?._id !== oneProduct?._id);
    setOneProducts(newProducts);
  };

  //Variation Details Function
  const showVariationDetails = (product) => {
    setOpenVariationDetailsModal(true);
    setGetVariationDetails(product);
  };

  //data post of campaign
  const handleDataPost = async (data) => {
    setLoading(true);

    try {
      const startDate = new Date(data?.offer_start_date);
      const endDate = new Date(data?.offer_end_date);
      if (endDate < startDate) {
        return toast.warn("Invalid Date");
      }
      if (oneProducts?.length == 0) {
        return toast.warn("Please Add Some Product");
      }
      if (!selectedValue) {
        return toast.warn("Please Select the Offer Discount Type");
      }
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "offer_image") {
          formData.append(key, data?.offer_image[0]);
        } else {
          formData.append(key, value);
        }
      });

      formData.append("offer_publisher_id", user?._id);

      formData.append("offer_description", description);
      formData.append("offer_products", JSON.stringify(oneProducts));

      const response = await fetch(`${BASE_URL}/offer`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : "Offer Product  created successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        navigate("/offer-list");
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
            Add Offer
          </h3>
        </div>

        <form onSubmit={handleSubmit(handleDataPost)} className="">
          {/* Form data here */}
          <div className="max-w-5xl mx-auto bg-gray-50 p-6 rounded-md shadow-md">
            <div>
              <label htmlFor="" className="block  font-medium text-gray-700">
                {" "}
                Offer Title
                <span className="text-red-500">*</span>
              </label>

              <input
                {...register("offer_title", {
                  required: "Offer title name is required",
                })}
                type="text"
                placeholder="Offer title name"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.offer_title && (
                <p className="text-red-600">{errors.offer_title?.message}</p>
              )}
            </div>
            <div className="my-2">
              <label
                htmlFor=""
                className="block mb-2 font-medium text-gray-700"
              >
                Offer Description
                <span className="text-red-500">*</span>
              </label>

              <ReactQuill
                id="offer_description"
                required
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Enter Offer Description"
                className="h-56 mb-12"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block  font-medium text-gray-700">
                  Offer Start Date <span className="text-red-500">*</span>
                </label>

                <input
                  {...register("offer_start_date", {
                    required: "Start date Serial is required",
                  })}
                  min={new Date().toISOString().split("T")[0]}
                  type="date"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.offer_start_date && (
                  <p className="text-red-600">
                    {errors.offer_start_date?.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block  font-medium text-gray-700">
                  Offer End Date <span className="text-red-500">*</span>
                </label>

                <input
                  {...register("offer_end_date", {
                    required: "End date Serial is required",
                  })}
                  min={new Date().toISOString().split("T")[0]}
                  type="date"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.offer_end_date && (
                  <p className="text-red-600">
                    {errors.offer_end_date?.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block  font-medium text-gray-700">
                  Offer Status <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("offer_status", {
                    required: "Offer Status is required",
                  })}
                  className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
                >
                  <option value="active">Active</option>
                  <option value="in-active">In-Active</option>
                </select>
                {errors.offer_status && (
                  <p className="text-red-600">{errors.offer_status.message}</p>
                )}
              </div>
            </div>
            <div className="mt-6">
              <p className="block mb-2  font-medium text-gray-700">
                Add Offer Image
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
                  required: "Image is Required",
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

              {errors.offer_image && (
                <p className="text-red-600">{errors.offer_image?.message}</p>
              )}
            </div>
          </div>

          {oneProducts?.length > 0 && (
            <div className="my-6 shadow-md bg-gray-50 px-3 py-5 border rounded-lg">
              <p className="mb-1 font-medium">You Add This Product : </p>
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right text-center bg-[#fff9ee]">
                    <tr className="border divide-x">
                      <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                        Delete
                      </th>

                      <th className="whitespace-nowrap py-4 font-medium text-gray-900">
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
                      <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                        Status
                      </th>
                      <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                        Brand
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {oneProducts?.map((oneProduct, i) => (
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
                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 flex justify-center">
                          <img
                            src={oneProduct?.main_image}
                            alt=""
                            className="w-[34px] h-[34px] rounded-[8px]"
                          />
                        </td>
                        <td className="">
                          <div className="flex justify-center items-center">
                            <select
                              className="rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                              required
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
                        <td className="whitespace-nowrap py-2 font-medium text-gray-900">
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
                            onClick={() => showVariationDetails(oneProduct)}
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
                        <td className="whitespace-nowrap px-4 py-2 ">
                          {oneProduct?.brand_id?.brand_name
                            ? oneProduct?.brand_id?.brand_name
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Review Product hare Review Product*/}

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

            {isLoading ? (
              <TableLoadingSkeleton />
            ) : (
              <div className="overflow-x-auto rounded-t-lg">
                {products?.data?.length > 0 ? (
                  <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="ltr:text-left rtl:text-right text-center bg-[#fff9ee]">
                      <tr className="border divide-x">
                        <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                          ADD
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
                        <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                          Status
                        </th>
                        <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                          Brand
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 text-center">
                      {products?.data?.map((product, i) => (
                        <tr
                          key={product?._id}
                          className={`divide-x divide-gray-200 ${
                            i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                          }`}
                        >
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                            <button
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              disabled={oneProducts?.some((item) => {
                                item?._id === product?._id;
                              })}
                            >
                              <MdAddToPhotos
                                className={`${
                                  oneProducts.some(
                                    (item) => item?._id === product?._id
                                  )
                                    ? "text-green-300 cursor-default"
                                    : "text-green-600 hover:text-green-500"
                                }`}
                                size={25}
                              />
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 flex justify-center">
                            <img
                              src={product?.main_image}
                              alt=""
                              className="w-[34px] h-[34px] rounded-[8px]"
                            />
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                            {product?.product_name}
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {product?.product_price}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {product?.product_discount_price
                              ? product?.product_discount_price
                              : 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            <button
                              type="button"
                              onClick={() => showVariationDetails(product)}
                              disabled={product?.is_variation === false}
                            >
                              <GoEye
                                size={22}
                                className={`${
                                  product?.is_variation === false
                                    ? "text-gray-300  cursor-default"
                                    : "text-gray-600"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {product?.product_quantity
                              ? product?.product_quantity
                              : 0}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            {product?.product_sku ? product?.product_sku : "-"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-2 ">
                            {product?.product_status === "active" ? (
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
                            {product?.brand_id?.brand_name
                              ? product?.brand_id?.brand_name
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
            )}
          </div>
          {products?.totalData > 5 && (
            <Pagination
              page={page}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              totalData={products?.totalData}
            />
          )}

          <div className="mt-3 flex justify-end">
            {loading == true ? (
              <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                type="submit"
              >
                Add Offer
              </button>
            )}
          </div>
        </form>
      </div>
      {/* Show Variation DesCription */}
      {openVariationDetailsModal && (
        <VariationDesCription
          setOpenVariationDetailsModal={setOpenVariationDetailsModal}
          getVariationDetails={getVariationDetails}
        />
      )}
    </div>
  );
};

export default AddOffers;
