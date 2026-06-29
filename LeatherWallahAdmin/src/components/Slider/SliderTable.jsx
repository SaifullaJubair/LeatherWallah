import Pagination from "./../common/pagination/Pagination";
import NoDataFound from "./../../shared/NoDataFound/NoDataFound";
import { FiEdit } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import TableLoadingSkeleton from "./../common/loadingSkeleton/TableLoadingSkeleton";
import { useState, useEffect } from "react";
import UpdateSlider from "./UpdateSlider";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";

const SliderTable = ({
  sliders,
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
  const [showSliderUpdateModal, setShowSliderUpdateModal] = useState(false);
  const [getSliderUpdateData, setGetSliderUpdateData] = useState({});
  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  //banner Update data Function
  const handleSliderUpdateModal = (slider) => {
    setShowSliderUpdateModal(true);
    setGetSliderUpdateData(slider);
  };

  // Handle Delete Slider Table Row function
  const handleDeleteSliderTableRow = (slider) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${slider?.slider_serial} slider!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: slider?._id,
          slider_image_key: slider?.slider_image_key,
        };
        try {
          const response = await fetch(
            `
            ${BASE_URL}/slider`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                credentials: "include",
              },
              body: JSON.stringify(sendData),
            }
          );
          const result = await response.json();
          // console.log(result);
          if (result?.statusCode === 200 && result?.success === true) {
            refetch();
            Swal.fire({
              title: "Deleted!",
              text: `${slider?.slider_serial} No slider has been deleted!`,
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
  const handleSliderActiveStatus = async (id, slider_status) => {
    try {
      const data = {
        _id: id,
        slider_status,
      };
      const response = await fetch(
        `${BASE_URL}/slider`,
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
          result?.message ? result?.message : "Slider status successfully",
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
  const handleSliderInActiveStatus = async (id, slider_status) => {
    try {
      const data = {
        _id: id,
        slider_status,
      };
      const response = await fetch(
        `${BASE_URL}/slider`,
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
          result?.message ? result?.message : "Slider status successfully",
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
          {sliders?.length > 0 ? (
            <div className="rounded-lg border border-gray-200 mt-6">
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                      <td className="whitespace-nowrap p-4 ">SL No</td>

                      <td className="whitespace-nowrap p-4 ">Slider Image</td>
                      <td className="whitespace-nowrap p-4 ">Slider Path</td>
                      <td className="whitespace-nowrap p-4 ">
                        Slider Serial No
                      </td>

                      <td className="whitespace-nowrap p-4 ">Slider Status</td>
                      <td className="whitespace-nowrap p-4 ">Action</td>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {sliders?.map((slider, i) => (
                      <tr
                        key={slider?._id}
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
                            src={slider?.slider_image}
                            alt=""
                          />
                        </td>
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {slider?.slider_path}
                        </td>
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {slider?.slider_serial}
                        </td>

                        <td className="whitespace-nowrap py-1.5 ">
                          {slider?.slider_status === "active" ? (
                            <button
                              className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleSliderActiveStatus(
                                  slider?._id,
                                  slider?.slider_status ? "in-active" : "active"
                                )
                              }
                            >
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleSliderInActiveStatus(
                                  slider?._id,
                                  slider?.slider_status ? "active" : "in-active"
                                )
                              }
                            >
                              <span>In-Active</span>
                            </button>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-1.5 px-2 text-gray-700">
                          {user?.role_id?.slider_delete === true && (
                            <button
                              onClick={() => handleDeleteSliderTableRow(slider)}
                            >
                              <MdDeleteForever
                                size={25}
                                className="cursor-pointer text-red-500 hover:text-red-300"
                              />
                            </button>
                          )}
                          {user?.role_id?.slider_update === true && (
                            <button
                              className="ml-3"
                              onClick={() => handleSliderUpdateModal(slider)}
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

          {/* Show SliderUpdate Modal */}
          {showSliderUpdateModal && (
            <UpdateSlider
              setShowSliderUpdateModal={setShowSliderUpdateModal}
              getSliderUpdateData={getSliderUpdateData}
              refetch={refetch}
            />
          )}
        </div>
      )}
    </>
  );
};

export default SliderTable;
