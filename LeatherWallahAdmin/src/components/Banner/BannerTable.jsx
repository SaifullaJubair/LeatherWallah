import { FiEdit } from "react-icons/fi";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import Pagination from "../common/pagination/Pagination";
import { MdDeleteForever } from "react-icons/md";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import { useEffect, useState } from "react";
import UpdateBanner from "./UpdateBanner";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";

const BannerTable = ({
  banners,
  setPage,
  setLimit,
  page,
  limit,
  totalData,
  refetch,
  isLoading,
  user,
}) => {
  const [serialNumber, setSerialNumber] = useState();
  const [showBannerUpdateModal, setShowBannerUpdateModal] = useState(false);
  const [getBannerUpdateData, setGetBannerUpdateData] = useState({});

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  //banner Update data Function
  const handleBannerUpdateModal = (banner) => {
    setShowBannerUpdateModal(true);
    setGetBannerUpdateData(banner);
  };

  // Handle Delete Banner Table Row function
  const handleDeleteBannerTableRow = (banner) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${banner?.banner_serial} no banner!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: banner?._id,
          banner_image_key: banner?.banner_image_key,
        };
        try {
          const response = await fetch(
            `
            ${BASE_URL}/banner`,
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
              text: `${banner?.banner_serial} No Banner has been deleted!`,
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

  //Update Banner Status..
  const handleBannerActiveStatus = async (id, banner_status) => {
    try {
      const data = {
        _id: id,
        banner_status,
      };
      const response = await fetch(
        `${BASE_URL}/banner`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Banner status successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      });
    } finally {
      ("");
    }
  };
  const handleBannerInActiveStatus = async (id, banner_status) => {
    try {
      const data = {
        _id: id,
        banner_status,
      };
      const response = await fetch(
        `${BASE_URL}/banner`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Banner status successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      });
    } finally {
      ("");
    }
  };

  return (
    <>
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : (
        <div>
          {banners?.length > 0 ? (
            <div className="rounded-lg border border-gray-200 mt-6">
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                      <td className="whitespace-nowrap p-4 ">SL No</td>

                      <td className="whitespace-nowrap p-4 ">Banner Image</td>
                      <td className="whitespace-nowrap p-4 ">Banner Title</td>
                      <td className="whitespace-nowrap p-4 ">Banner Path</td>
                      <td className="whitespace-nowrap p-4 ">
                        Banner Serial No
                      </td>

                      <td className="whitespace-nowrap p-4 ">Banner Status</td>
                      <td className="whitespace-nowrap p-4 ">Action</td>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {banners?.map((banner, i) => (
                      <tr
                        key={banner?._id}
                        className={`divide-x divide-gray-200 ${
                          i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                        }`}
                      >
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {serialNumber + i + 1}
                        </td>
                        <td className="whitespace-nowrap py-1.5 text-gray-700 flex justify-center">
                          <img
                            className="w-[44px] h-[44px] rounded-[8px]"
                            src={banner?.banner_image}
                            alt=""
                          />
                        </td>
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {banner?.banner_title}
                        </td>
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {banner?.banner_path}
                        </td>
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {banner?.banner_serial}
                        </td>

                        <td className="whitespace-nowrap py-1.5 ">
                          {banner?.banner_status === "active" ? (
                            <button
                              className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleBannerActiveStatus(
                                  banner?._id,
                                  banner?.banner_status ? "in-active" : "active"
                                )
                              }
                            >
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleBannerInActiveStatus(
                                  banner?._id,
                                  banner?.banner_status ? "active" : "in-active"
                                )
                              }
                            >
                              <span>In-Active</span>
                            </button>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-1.5 px-2 text-gray-700">
                          {user?.role_id?.banner_delete === true && (
                            <button
                              onClick={() => handleDeleteBannerTableRow(banner)}
                            >
                              <MdDeleteForever
                                size={25}
                                className="cursor-pointer text-red-500 hover:text-red-300"
                              />
                            </button>
                          )}
                          {user?.role_id?.banner_update === true && (
                            <button
                              className="ml-3"
                              onClick={() => handleBannerUpdateModal(banner)}
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
              page={page}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              totalData={totalData}
            />
          )}

          {/* Show Banner Update Modal */}
          {showBannerUpdateModal && (
            <UpdateBanner
              setShowBannerUpdateModal={setShowBannerUpdateModal}
              getBannerUpdateData={getBannerUpdateData}
              refetch={refetch}
            />
          )}
        </div>
      )}
    </>
  );
};

export default BannerTable;
