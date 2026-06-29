import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { RxCrossCircled } from "react-icons/rx";
import useGetCouponProduct from "../../hooks/useGetCouponProduct";
import UseGetUser from "../../hooks/UseGetUser";
import useDebounced from "../../hooks/useDebounced";
import { AuthContext } from "../../context/AuthProvider";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import { MdAddToPhotos } from "react-icons/md";

import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import { useNavigate } from "react-router-dom";
import Pagination from "../common/pagination/Pagination";
import { GoEye } from "react-icons/go";
import VariationModal from "../Campaign/AddCampaign/VariationModal";

const AddCoupon = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [addCouponProducts, setAddCouponProducts] = useState([]);
  const [addCouponUser, setAddCouponUser] = useState([]);

  const [productPage, setProductPage] = useState(1);
  const [productLimit, setProductLimit] = useState(10);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);
  const [userSearchValue, setUserSearchValue] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [variationData, setVariationData] = useState(null);
  //Initialize the state for coupon type
  const [couponType, setCouponType] = useState("fixed");
  //Coupon Customer Type State
  const [couponCustomerType, setCouponCustomerType] = useState("all");
  //Coupon Product  Type State
  const [couponProductType, setCouponProductType] = useState("all");

  const panel_owner_id = user?.panel_owner_id
    ? user?.panel_owner_id
    : user?._id;

  ///get user hook
  const { data: couponProducts = [], isLoading: productLoading } =
    useGetCouponProduct(
      productPage,
      productLimit,
      productSearchTerm,
      panel_owner_id
    );
  const { data: couponUsers = [], isLoading: userLoading } = UseGetUser(
    userPage,
    userLimit,
    userSearchTerm,
    panel_owner_id
  );

  // Handle adding a product
  const handleAddProduct = (product) => {
    setAddCouponProducts((prevProducts) => [...prevProducts, product]);
  };

  // Handle removing a product
  const handleDeleteProduct = (product) => {
    const newProducts = addCouponProducts.filter(
      (p) => p?._id !== product?._id
    );
    setAddCouponProducts(newProducts);
  };
  // Handle adding a product
  const handleAddUser = (user) => {
    setAddCouponUser((addCouponUser) => [...addCouponUser, user]);
  };

  // Handle removing a product
  const handleDeleteUser = (user) => {
    const newUser = addCouponUser.filter((u) => u?._id !== user?._id);
    setAddCouponUser(newUser);
  };

  // handle Product search function....
  const productSearchText = useDebounced({
    searchQuery: productSearchValue,
    delay: 500,
  });
  useEffect(() => {
    setProductSearchTerm(productSearchText);
  }, [productSearchText]);

  //handle Product item search function....
  const handleProductSearchValue = (value) => {
    setProductSearchValue(value);
    setProductLimit(10);
    setProductPage(1);
  };

  // handle user search function....
  const userSearchText = useDebounced({
    searchQuery: userSearchValue,
    delay: 500,
  });
  useEffect(() => {
    setUserSearchTerm(userSearchText);
  }, [userSearchText]);

  //handle User  search function....
  const handleUserSearchValue = (value) => {
    setUserSearchValue(value);
    setUserLimit(10);
    setUserPage(1);
  };

  const handleDataPost = async (data) => {
    setLoading(true);
    if (data?.coupon_type === "percent" && data?.coupon_amount > 100) {
      toast.warn("Coupon Amount cannot be greater than 100 for percent type");
      setLoading(false);
      return;
    }
    // 11β — BOGO needs the 3 bogo_* fields, but coupon_amount is irrelevant
    // (BE schema makes it conditional). Validate locally so admin sees the
    // error before the round-trip.
    if (data?.coupon_type === "bogo") {
      if (!data?.bogo_buy_qty || Number(data.bogo_buy_qty) < 1) {
        toast.warn("BOGO 'buy quantity' must be at least 1");
        setLoading(false);
        return;
      }
      if (!data?.bogo_get_qty || Number(data.bogo_get_qty) < 1) {
        toast.warn("BOGO 'get quantity' must be at least 1");
        setLoading(false);
        return;
      }
      const pct = Number(data?.bogo_get_discount_pct);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        toast.warn("BOGO discount percent must be between 0 and 100");
        setLoading(false);
        return;
      }
    }
    try {
      const sendData = {
        coupon_code: data?.coupon_code,
        coupon_start_date: data?.coupon_start_date,
        coupon_end_date: data?.coupon_end_date,
        coupon_type: data?.coupon_type,
        // BOGO ignores coupon_amount — BE schema lets it be 0/undefined.
        coupon_amount:
          data?.coupon_type === "bogo" ? 0 : data?.coupon_amount,
        coupon_use_per_person: data?.coupon_use_per_person,
        coupon_use_total_person: data?.coupon_use_total_person,
        coupon_status: data?.coupon_status,
        coupon_customer_type: data?.coupon_customer_type,
        coupon_product_type: data?.coupon_product_type,

        coupon_publisher_id: user?._id,
        panel_owner_id: user?.panel_owner_id ? user?.panel_owner_id : user?._id,
      };

      if (data?.coupon_max_amount) {
        sendData.coupon_max_amount = data?.coupon_max_amount;
      }

      if (data?.coupon_type === "bogo") {
        sendData.bogo_buy_qty = Number(data?.bogo_buy_qty);
        sendData.bogo_get_qty = Number(data?.bogo_get_qty);
        sendData.bogo_get_discount_pct = Number(data?.bogo_get_discount_pct);
      }

      if (data?.coupon_product_type == "specific") {
        sendData.coupon_specific_product = addCouponProducts?.map((item) => ({
          product_id: item?._id,
        }));
      }
      if (data?.coupon_customer_type == "specific") {
        sendData.coupon_specific_customer = addCouponUser?.map((item) => ({
          customer_id: item?._id,
        }));
      }

      console.log("sendData : ", sendData);

      const response = await fetch(`${BASE_URL}/coupon`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Coupon created successfully",
          {
            autoClose: 1000,
          }
        );
        navigate("/your-coupon");
        setLoading(false);
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
    <div className="px-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[24px] font-semibold text-[#0A0A0A] capitalize">
          Add Coupon
        </h3>
      </div>

      <form onSubmit={handleSubmit(handleDataPost)} className="mt-3">
        <div className="mt-4 w-full  grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              {...register("coupon_code", {
                required: "Coupon code is required",
              })}
              type="text"
              placeholder="Coupon code"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.coupon_code && (
              <p className="text-red-600">{errors.coupon_code?.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("coupon_status", {
                required: " Status is required",
              })}
              className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
            >
              <option value="active">Active</option>
              <option value="in-active">In-Active</option>
            </select>
            {errors.coupon_status && (
              <p className="text-red-600">{errors.coupon_status.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Start Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register("coupon_start_date", {
                required: "Coupon Start Date is required",
              })}
              min={new Date().toISOString().split("T")[0]}
              type="date"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.coupon_start_date && (
              <p className="text-red-600">
                {errors.coupon_start_date?.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon End Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register("coupon_end_date", {
                required: "Coupon end Date is required",
              })}
              min={new Date().toISOString().split("T")[0]}
              type="date"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.coupon_end_date && (
              <p className="text-red-600">{errors.coupon_end_date?.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Use total Person <span className="text-red-500">*</span>
            </label>
            <input
              {...register("coupon_use_total_person", {
                required: "Coupon Amount is required",
                validate: (value) => {
                  if (value < 1) {
                    return "serial must be greater than 0";
                  }
                  // else if (value > 100) {
                  //   return 'Serial must be less then 100'
                  // }
                },
              })}
              type="number"
              placeholder="Coupon use total person"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.coupon_use_total_person && (
              <p className="text-red-600">
                {errors.coupon_use_total_person?.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Use Per Person <span className="text-red-500">*</span>
            </label>
            <input
              {...register("coupon_use_per_person", {
                required: "Coupon Amount is required",
                validate: (value) => {
                  if (value < 1) {
                    return "serial must be greater than 0";
                  }
                  // else if (value > 100) {
                  //   return 'Serial must be less then 100'
                  // }
                },
              })}
              type="number"
              placeholder="Coupon use per person"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.coupon_use_per_person && (
              <p className="text-red-600">
                {errors.coupon_use_per_person?.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Type{" "}
              {couponType === "bogo" ? (
                <span className="text-red-500 text-xs">
                  (*Buy N Get M at X% off cheapest line)
                </span>
              ) : couponProductType === "all" ? (
                <span className="text-red-500 text-xs">
                  (*Deduct Form Over All Purchase Amount)
                </span>
              ) : (
                <span className="text-red-500 text-xs">(*per product)</span>
              )}
            </label>
            <select
              {...register("coupon_type", {
                required: " Status is required",
              })}
              value={couponType}
              onChange={(e) => setCouponType(e.target.value)}
              className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
            >
              <option value="fixed">Fixed</option>
              <option value="percent">Percent</option>
              <option value="bogo">BOGO (Buy X Get Y)</option>
            </select>
            {errors.coupon_type && (
              <p className="text-red-600">{errors.coupon_type.message}</p>
            )}
          </div>
          {couponType !== "bogo" && (
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Coupon Amount{" "}
                {couponProductType === "all" ? (
                  <span className="text-red-500 text-xs">
                    (*Deduct Form Over All Purchase Amount)
                  </span>
                ) : (
                  <span className="text-red-500 text-xs">(*per product)</span>
                )}
              </label>
              <input
                {...register("coupon_amount", {
                  required:
                    couponType === "bogo" ? false : "Coupon Amount is required",
                })}
                type="number"
                placeholder="Coupon number"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.coupon_amount && (
                <p className="text-red-600">{errors.coupon_amount?.message}</p>
              )}
            </div>
          )}
          {/* 11β — BOGO conditional fields: buy_qty / get_qty / get_discount_pct */}
          {couponType === "bogo" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  BOGO Buy Qty <span className="text-red-500">*</span>{" "}
                  <span className="text-red-500 text-xs">
                    (e.g. 2 = customer must buy 2)
                  </span>
                </label>
                <input
                  {...register("bogo_buy_qty", {
                    validate: (value) => {
                      if (couponType !== "bogo") return true;
                      if (!value || Number(value) < 1)
                        return "Must be at least 1";
                    },
                  })}
                  type="number"
                  min={1}
                  placeholder="2"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.bogo_buy_qty && (
                  <p className="text-red-600">{errors.bogo_buy_qty?.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  BOGO Get Qty <span className="text-red-500">*</span>{" "}
                  <span className="text-red-500 text-xs">
                    (e.g. 1 = customer gets 1 free/discounted)
                  </span>
                </label>
                <input
                  {...register("bogo_get_qty", {
                    validate: (value) => {
                      if (couponType !== "bogo") return true;
                      if (!value || Number(value) < 1)
                        return "Must be at least 1";
                    },
                  })}
                  type="number"
                  min={1}
                  placeholder="1"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.bogo_get_qty && (
                  <p className="text-red-600">{errors.bogo_get_qty?.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  BOGO Discount % <span className="text-red-500">*</span>{" "}
                  <span className="text-red-500 text-xs">
                    (100 = free, 50 = half-price)
                  </span>
                </label>
                <input
                  {...register("bogo_get_discount_pct", {
                    validate: (value) => {
                      if (couponType !== "bogo") return true;
                      const n = Number(value);
                      if (isNaN(n) || n < 0 || n > 100)
                        return "Must be 0-100";
                    },
                  })}
                  type="number"
                  min={0}
                  max={100}
                  placeholder="100"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.bogo_get_discount_pct && (
                  <p className="text-red-600">
                    {errors.bogo_get_discount_pct?.message}
                  </p>
                )}
              </div>
            </>
          )}
          {couponType === "percent" && (
            <div>
              {" "}
              <label className="block text-xs font-medium text-gray-700">
                Coupon Max Amount{" "}
                {couponType === "percent" ? (
                  <span className="text-red-500 text-xs">
                    (*Deduct Form Over All Purchase Amount)
                  </span>
                ) : (
                  <span className="text-red-500 text-xs">(*per product)</span>
                )}
              </label>
              <input
                {...register("coupon_max_amount", {
                  required: " Amount is required",
                  validate: (value) => {
                    if (value < 1) {
                      return "serial must be greater than 0";
                    }
                    // else if (value > 100) {
                    //   return 'Serial must be less then 100'
                    // }
                  },
                })}
                type="number"
                placeholder="Coupon Max Amount"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.coupon_max_amount && (
                <p className="text-red-600">
                  {errors.coupon_max_amount?.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Product Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("coupon_product_type", {
                required: "Product Type is required",
              })}
              value={couponProductType}
              onChange={(e) => {
                const selectedValue = e.target.value;
                setCouponProductType(selectedValue);
                if (selectedValue === "all") {
                  setAddCouponProducts([]);
                }
                // 11β — old auto-force-to-fixed wiping admin's bogo/percent
                // pick on product_type change removed. Admin picks type
                // explicitly now.
              }}
              className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
            >
              <option value="all">All</option>
              <option value="specific">Specific</option>
            </select>
            {errors.coupon_product_type && (
              <p className="text-red-600">
                {errors.coupon_product_type.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Coupon Customer Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("coupon_customer_type", {
                required: " Status is required",
              })}
              value={couponCustomerType}
              onChange={(e) => {
                const selectedValue = e.target.value;
                setCouponCustomerType(selectedValue);
                if (selectedValue === "all") {
                  setAddCouponUser([]);
                }
              }}
              className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
            >
              <option value="all">All</option>
              <option value="specific">Specific</option>
            </select>
            {errors.coupon_customer_type && (
              <p className="text-red-600">
                {errors.coupon_customer_type.message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          {couponCustomerType === "specific" && (
            <>
              <div className="w-2/5 p-4 bg-white shadow-md">
                {" "}
                <div className="flex justify-between">
                  <p className="font-semibold my-2">Users</p>
                  <div>
                    {" "}
                    <input
                      type="text"
                      defaultValue={userSearchTerm}
                      onChange={(e) => handleUserSearchValue(e.target.value)}
                      placeholder="Search User..."
                      className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                  </div>
                </div>
                {userLoading ? (
                  <TableLoadingSkeleton />
                ) : (
                  <div className="overflow-x-auto rounded-t-lg ">
                    {couponUsers?.data?.length > 0 ? (
                      <div>
                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded mt-3">
                          <thead className="ltr:text-left rtl:text-right text-center bg-[#fff9ee]">
                            <tr className="border divide-x text-xs">
                              <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                                ADD
                              </th>

                              <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                                User Name
                              </th>
                              <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                                Log With
                              </th>

                              <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-200 text-center">
                            {couponUsers?.data?.map((cUser, i) => (
                              <tr
                                key={cUser?._id}
                                className={`divide-x divide-gray-200 text-xs ${
                                  i % 2 === 0
                                    ? "bg-white"
                                    : "bg-tableRowBGColor"
                                }`}
                              >
                                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900">
                                  {addCouponUser.includes(cUser) ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(cUser)}
                                      className="text-red-600 hover:text-red-400"
                                    >
                                      <RxCrossCircled size={25} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAddUser(cUser)}
                                    >
                                      <MdAddToPhotos
                                        size={25}
                                        className="text-green-600 hover:text-green-500"
                                      />
                                    </button>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900 flex justify-center">
                                  {cUser?.user_name}
                                </td>

                                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900">
                                  {cUser?.user_phone}
                                </td>

                                <td className="whitespace-nowrap px-2 py-1.5 ">
                                  {cUser?.user_status === "active" ? (
                                    <button
                                      type="button"
                                      className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[3px] rounded-[8px]"
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
                                      className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[3px] rounded-[8px]"
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
                    ) : (
                      <NoDataFound />
                    )}
                    <Pagination
                      setPage={setUserPage}
                      page={userPage}
                      limit={userLimit}
                      setLimit={setUserLimit}
                      totalData={couponUsers?.totalData}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {couponProductType === "specific" && (
            <>
              <div className="w-3/5 p-4 bg-white shadow-md">
                <div className="flex justify-between">
                  <p className="font-semibold my-2"> Products</p>
                  <div>
                    <input
                      type="text"
                      defaultValue={productSearchTerm}
                      onChange={(e) => handleProductSearchValue(e.target.value)}
                      placeholder="Search Product..."
                      className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                  </div>
                </div>
                {productLoading ? (
                  <TableLoadingSkeleton />
                ) : (
                  <div className="overflow-x-auto rounded-t-lg ">
                    {couponProducts?.data?.length > 0 ? (
                      <div>
                        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded mt-3">
                          <thead className="ltr:text-left rtl:text-right text-center bg-[#fff9ee]">
                            <tr className="border divide-x text-xs">
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
                                View Variation
                              </th>

                              <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-200 text-center">
                            {couponProducts?.data?.map((product, i) => (
                              <tr
                                key={product?._id}
                                className={`divide-x divide-gray-200 text-xs ${
                                  i % 2 === 0
                                    ? "bg-white"
                                    : "bg-tableRowBGColor"
                                }`}
                              >
                                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900">
                                  {addCouponProducts.includes(product) ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteProduct(product)
                                      }
                                      className="text-red-600 hover:text-red-400"
                                    >
                                      <RxCrossCircled size={25} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAddProduct(product)}
                                    >
                                      <MdAddToPhotos
                                        size={25}
                                        className="text-green-600 hover:text-green-500"
                                      />
                                    </button>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900 flex justify-center">
                                  <img
                                    src={product?.main_image}
                                    alt=""
                                    className="w-[34px] h-[34px] rounded-[8px]"
                                  />
                                </td>

                                <td className="whitespace-nowrap  py-1.5 font-medium text-gray-900">
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
                                    onClick={() => {
                                      setShowVariationModal(true);
                                      setVariationData(product);
                                    }}
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
                                <td className="whitespace-nowrap px-2 py-1.5 ">
                                  {product?.product_status === "active" ? (
                                    <button
                                      type="button"
                                      className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[3px] rounded-[8px]"
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
                                      className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[3px] rounded-[8px]"
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
                    ) : (
                      <NoDataFound />
                    )}
                    <Pagination
                      setPage={setProductPage}
                      page={productPage}
                      limit={productLimit}
                      setLimit={setProductLimit}
                      totalData={couponProducts?.totalData}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end mt-4 gap-2 mb-4">
          {loading == true ? (
            <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
              <MiniSpinner />
            </div>
          ) : (
            <button
              className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200  text-white rounded"
              type="submit"
            >
              Create
            </button>
          )}
        </div>
      </form>
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

export default AddCoupon;