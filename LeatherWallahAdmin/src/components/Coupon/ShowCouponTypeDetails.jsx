import { RxCross1 } from "react-icons/rx";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import { GoEye } from "react-icons/go";
import { useState } from "react";
import CouponProductVariation from "./YourCouponOfferTable/CouponProductVariation";

const ShowCouponTypeDetails = ({
  setCouponTypeDetailsShow,
  couponTypeDetailsData,
}) => {
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [variationData, setVariationData] = useState(null);

  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[1350px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
          <div className="">
            <h3
              className="text-[20px] font-bold text-gray-800 capitalize text-center"
              id="modal-title "
            >
              View Coupon Types
            </h3>
            <button
              type="button"
              className="btn bg-white   p-1 absolute right-1 rounded-full top-1 hover:bg-bgBtnInactive hover:text-btnInactiveColor"
              onClick={() => setCouponTypeDetailsShow(false)}
            >
              {" "}
              <RxCross1 size={20}></RxCross1>
            </button>
          </div>
          <div className="text-sm mt-10 gap-4">
            <div className="font-bold">
              Coupon Amount : {couponTypeDetailsData?.coupon_amount}-
              {couponTypeDetailsData?.coupon_type === "fixed"
                ? "Fixed"
                : "Percent"}
            </div>
            <div className="font-bold">
              Coupon Max Amount : {couponTypeDetailsData?.coupon_max_amount}
            </div>

            <div className="font-bold">
              Customer Type : {couponTypeDetailsData?.coupon_customer_type}
            </div>
            <div className="font-bold">
              Product Type : {couponTypeDetailsData?.coupon_product_type}
            </div>
          </div>
          <div className="mt-6">
            <span className="font-medium">Specific User and Product :</span>
            <div className="mt-2 flex gap-4">
              {couponTypeDetailsData?.coupon_specific_customer?.length > 0 ? (
                <div className="overflow-x-auto rounded-t-lg w-2/5">
                  <p className="font-semibold my-2"> Users : </p>
                  <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
                    <thead className="ltr:text-left rtl:text-right text-center bg-[#fff9ee]">
                      <tr className="border divide-x text-xs">
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
                      {couponTypeDetailsData?.coupon_specific_customer?.map(
                        (cUser, i) => (
                          <tr
                            key={cUser?._id}
                            className={`divide-x divide-gray-200 text-xs ${
                              i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                            }`}
                          >
                            <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900 flex justify-center">
                              {cUser?.customer_id?.user_name}
                            </td>

                            <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900">
                              {cUser?.customer_id?.user_email ||
                                cUser?.customer_id?.user_phone ||
                                "No contact information available"}
                            </td>

                            <td className="whitespace-nowrap px-2 py-1.5 ">
                              {cUser?.customer_id?.user_status === "active" ? (
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
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <NoDataFound />
              )}

              {couponTypeDetailsData?.coupon_specific_product?.length > 0 ? (
                <div className="overflow-x-auto rounded-t-lg w-3/5">
                  <p className="font-semibold my-2"> Products : </p>

                  <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
                    <thead className="ltr:text-left rtl:text-right text-center bg-[#fff9ee]">
                      <tr className="border divide-x text-xs">
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
                          Quantity
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
                      {couponTypeDetailsData?.coupon_specific_product?.map(
                        (product, i) => (
                          <tr
                            key={product?._id}
                            className={`divide-x divide-gray-200 text-xs ${
                              i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                            }`}
                          >
                            <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900 flex justify-center">
                              <img
                                src={product?.product_id?.main_image}
                                alt=""
                                className="w-[34px] h-[34px] rounded-[8px]"
                              />
                            </td>

                            <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900">
                              {product?.product_id?.product_name}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                              {product?.product_id?.product_price}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                              {product?.product_id?.product_discount_price}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                              {product?.product_id?.product_quantity}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowVariationModal(true);
                                  setVariationData(product);
                                }}
                                disabled={
                                  product?.product_id?.is_variation === false
                                }
                              >
                                <GoEye
                                  size={22}
                                  className={`${
                                    product?.product_id?.is_variation === false
                                      ? "text-gray-300  cursor-default"
                                      : "text-gray-600"
                                  }`}
                                />
                              </button>
                            </td>

                            <td className="whitespace-nowrap px-2 py-1.5 ">
                              {product?.product_id?.product_status ===
                              "active" ? (
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
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <NoDataFound />
              )}
            </div>
          </div>
        </div>
      </div>
      {showVariationModal && (
        <CouponProductVariation
          setShowVariationModal={setShowVariationModal}
          variationData={variationData}
        />
      )}
    </div>
  );
};

export default ShowCouponTypeDetails;
