import { MdDeleteForever } from "react-icons/md";
import { BiShow } from "react-icons/bi";
import { useEffect, useState } from "react";

import Swal from "sweetalert2-optimized";

import { toast } from "react-toastify";
import { BASE_URL } from "../../../utils/baseURL";
import Pagination from "../../common/pagination/Pagination";
import ShowCouponTypeDetails from "../ShowCouponTypeDetails";
//import UpdateCoupon from "../UpdateCoupon";
//import { FiEdit } from "react-icons/fi";
import TableLoadingSkeleton from "./../../common/loadingSkeleton/TableLoadingSkeleton";
import NoDataFound from "../../../shared/NoDataFound/NoDataFound";
import { FiEdit } from "react-icons/fi";
import UpdateCoupon from "../UpdateCoupon";

const YourCouponTable = ({
  refetch,
  setPage,
  page,
  limit,
  setLimit,
  user,
  isLoading,
  getCoupons,
  totalData,
}) => {
  //Table Serial number
  const [serialNumber, setSerialNumber] = useState();
  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);
  //End Table Serial number
  //coupon Type Show State
  const [couponTypeDetailsShow, setCouponTypeDetailsShow] = useState(false);
  const [couponTypeDetailsData, setCouponTypeDetailsData] = useState({});

  //Update Coupon Type Data State
  const [couponUpdate, setCouponUpdate] = useState(false);
  const [getCouponUpdateData, setGetCouponUpdateData] = useState({});

  //Coupon Type Product Type ,customer type ,Details show handle
  const handleCouponDetailsShow = (coupon) => {
    setCouponTypeDetailsShow(true);
    setCouponTypeDetailsData(coupon);
  };
  //Coupon Type Update handle
  const handleCouponUpdate = (coupon) => {
    setCouponUpdate(true);
    setGetCouponUpdateData(coupon);
  };

  //Delete Coupon Data
  const handleDeleteCoupon = (coupon) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${coupon?.coupon_code}!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: coupon?._id,
        };
        try {
          const response = await fetch(
            `
            ${BASE_URL}/coupon`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(sendData),
            }
          );
          const result = await response.json();
          // console.log(result);
          if (result?.statusCode === 200 && result?.success === true) {
            refetch();
            Swal.fire({
              title: "Deleted!",
              text: `${coupon?.coupon_code} coupon has been deleted!`,
              icon: "success",
            });
          } else {
            toast.error(result?.message, {
              autoClose: 1000,
            });
          }
        } catch (error) {
          toast.error("Network error or server is down", {
            autoClose: 1000,
          });
          console.error(error);
        }
      }
    });
  };
  return (
    <>
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : (
        <div>
          {getCoupons?.data?.length > 0 ? (
            <div className="rounded-lg border border-gray-200 mt-6">
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        SL
                      </th>
                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        Coupon Code
                      </th>
                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        Start Date
                      </th>
                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        End Date
                      </th>
                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        Coupon Amount
                      </th>

                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        Coupon Use Per Person
                      </th>
                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        Coupon Use Total Person
                      </th>

                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        Status
                      </th>
                      <th className="whitespace-nowrap py-4 font-semibold text-gray-900 text-center border">
                        View Details
                      </th>
                      <th className="py-4 text-center font-semibold text-gray-900 whitespace-nowrap border">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {getCoupons?.data?.map((coupon, i) => (
                      <tr
                        key={coupon?._id}
                        className={`divide-x divide-gray-200 ${
                          i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {serialNumber + i + 1}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {coupon?.coupon_code}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {coupon?.coupon_start_date}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {coupon?.coupon_end_date}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {coupon?.coupon_amount}-
                          {coupon?.coupon_type === "fixed"
                            ? "Fixed"
                            : "Percent"}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {coupon?.coupon_use_per_person}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {coupon?.coupon_use_total_person}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {coupon?.coupon_status === "active" ? (
                            <button
                              className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                              // onClick={() =>
                              //   handleCityActiveStatus(
                              //     city?._id,
                              //     city?.city_status ? 'in-active' : 'active'
                              //   )
                              // }
                            >
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                              // onClick={() =>
                              //   handleCityInActiveStatus(
                              //     city?._id,
                              //     city?.city_status ? 'active' : 'in-active'
                              //   )
                              // }
                            >
                              <span>In-Active</span>
                            </button>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          <button
                            onClick={() => handleCouponDetailsShow(coupon)}
                          >
                            <BiShow
                              size={25}
                              className="text-gray-500 hover:text-gray-300"
                            />
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {user?.role_id?.coupon_delete === true && (
                            <button onClick={() => handleDeleteCoupon(coupon)}>
                              <MdDeleteForever
                                size={25}
                                className="cursor-pointer text-red-500 hover:text-red-300"
                              />
                            </button>
                          )}
                          {user?.role_id?.coupon_update === true && (
                            <button
                              className="ml-3"
                              onClick={() => handleCouponUpdate(coupon)}
                            >
                              <FiEdit
                                size={25}
                                className="cursor-pointer text-gray-500 hover:text-gray-300"
                              />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <NoDataFound />
          )}

          {/* pagination */}
          {totalData > 10 && (
            <Pagination
              setPage={setPage}
              page={page}
              limit={limit}
              setLimit={setLimit}
              totalData={totalData}
            />
          )}

          {/* Show coupons Details Data Component*/}
          {couponTypeDetailsShow && (
            <ShowCouponTypeDetails
              setCouponTypeDetailsShow={setCouponTypeDetailsShow}
              couponTypeDetailsData={couponTypeDetailsData}
            />
          )}

          {/* Update Coupon Data Component */}
          {couponUpdate && (
            <UpdateCoupon
              setCouponUpdate={setCouponUpdate}
              refetch={refetch}
              getCouponUpdateData={getCouponUpdateData}
            />
          )}
        </div>
      )}
    </>
  );
};

export default YourCouponTable;
