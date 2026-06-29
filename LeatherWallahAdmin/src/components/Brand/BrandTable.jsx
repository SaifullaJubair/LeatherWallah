import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import UpdateBrandCategory from "./UpdateBrandCategory";
import Swal from "sweetalert2-optimized";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import DuplicateBrandCategory from "./DuplicateBrandCategory";
import Pagination from "../common/pagination/Pagination";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "./../common/loadingSkeleton/TableLoadingSkeleton";

const BrandTable = ({
  brandTypes,
  setPage,
  setLimit,
  categoryTypes,
  categoryLoading,
  refetch,
  totalData,
  page,
  limit,
  user,
  isLoading,
}) => {
  const [serialNumber, setSerialNumber] = useState();

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  //Update Handle controler
  const [brandCategoryUpdateModal, setBrandCategoryUpdateModal] =
    useState(false);
  const [brandUpdateData, setBrandUpdateData] = useState({});

  const handleBrandUpdateModal = (brand) => {
    setBrandUpdateData(brand);
    setBrandCategoryUpdateModal(true);
  };

  // Brand Category Duplicate modal
  const [brandCategoryDuplicateModal, setBrandCategoryDuplicateModal] =
    useState(false);
  const handleBrandDuplicateModal = (brand) => {
    setBrandCategoryDuplicateModal(true);
    setBrandUpdateData(brand);
  };
  //Toggle show button show status in table
  const handleBrandToggle = async (id, brand_show) => {
    try {
      const data = {
        _id: id,
        brand_show,
      };
      const response = await fetch(
        `${BASE_URL}/brand`,
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
          result?.message
            ? result?.message
            : "Brand Category show successfully",
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

  //Update Button Status of Brand
  const handleBrandActiveStatus = async (id, brand_status) => {
    console.log(id, brand_status);
    try {
      const data = {
        _id: id,
        brand_status,
      };
      const response = await fetch(
        `${BASE_URL}/brand`,
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
          result?.message
            ? result?.message
            : "Brand Category status successfully",
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
  const handleBrandInActiveStatus = async (id, brand_status) => {
    console.log(id, brand_status);

    try {
      const data = {
        _id: id,
        brand_status,
      };
      const response = await fetch(
        `${BASE_URL}/brand`,
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
          result?.message
            ? result?.message
            : "Brand Category status successfully",
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

  //handle Delete Brand Table Row Function
  const handleDeleteBrandTableRow = (brand) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${brand?.brand_name} brand category!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: brand?._id,
          brand_logo_key: brand?.brand_logo_key,
        };
        try {
          const response = await fetch(
            `
            ${BASE_URL}/brand`,
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
              text: `${brand?.brand_name} brand category has been deleted!`,
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
          <div className="rounded-lg border border-gray-200 mt-6">
            {brandTypes?.data?.length > 0 ? (
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        SL No
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Brand Name
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Brand Image
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Brand Serial
                      </th>
                      {/* <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Category Name
                      </th> */}
                      {/* <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Brand Show
                      </th> */}

                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Brand Status
                      </th>

                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {brandTypes?.data?.map((brand, i) => (
                      <tr
                        key={brand?._id}
                        className={`divide-x divide-gray-200 ${
                          i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4  py-1.5 font-medium text-gray-900">
                          {serialNumber + i + 1}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 font-medium text-gray-900">
                          {brand?.brand_name}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700 flex justify-center">
                          <img
                            className="w-[44px] h-[44px] rounded-[8px] "
                            src={brand?.brand_logo}
                            alt=""
                          />
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {brand?.brand_serial}
                        </td>
                        {/* <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {brand?.category_id?.category_name}
                        </td> */}
                        {/* <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          <label
                            htmlFor={brand?._id}
                            className="inline-flex items-center space-x-4 cursor-pointer dark:text-gray-800"
                          >
                            <span className="relative">
                              <input
                                id={brand?._id}
                                type="checkbox"
                                checked={brand?.brand_show}
                                className="hidden peer"
                                onChange={() =>
                                  handleBrandToggle(
                                    brand?._id,
                                    brand?.brand_show ? false : true
                                  )
                                } // Handle toggle
                              />
                              <div className="w-10 h-4 rounded-full shadow bg-slate-200 peer-checked:bg-bgBtnActive"></div>
                              <div className="absolute left-0 w-6 h-6 rounded-full shadow -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primaryColor bg-white"></div>
                            </span>
                          </label>
                        </td> */}

                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {brand?.brand_status === "active" ? (
                            <button
                              className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleBrandActiveStatus(
                                  brand?._id,
                                  brand?.brand_status ? "in-active" : "active"
                                )
                              }
                            >
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleBrandInActiveStatus(
                                  brand?._id,
                                  brand?.brand_status ? "active" : "in-active"
                                )
                              }
                            >
                              <span>In-Active</span>
                            </button>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {user?.role_id?.brand_delete === true && (
                            <button className="ml-[8px]">
                              <MdDeleteForever
                                className="cursor-pointer text-red-500 hover:text-red-300"
                                size={25}
                                onClick={() => handleDeleteBrandTableRow(brand)}
                              />
                            </button>
                          )}
                          {user?.role_id?.brand_update === true && (
                            <>
                              {" "}
                              {/* <button className="ml-[8px]">
                                <HiOutlineDocumentDuplicate
                                  className="cursor-pointer text-gray-500 hover:text-gray-300"
                                  size={25}
                                  onClick={() =>
                                    handleBrandDuplicateModal(brand)
                                  }
                                />
                              </button> */}
                              <button
                                className="ml-[8px]"
                                onClick={() => handleBrandUpdateModal(brand)}
                              >
                                <FiEdit
                                  size={25}
                                  className="cursor-pointer text-gray-500 hover:text-gray-300"
                                />
                              </button>
                            </>
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
          </div>
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

          {/* Show Brand Category Update Modal */}
          {brandCategoryUpdateModal && (
            <UpdateBrandCategory
              setBrandCategoryUpdateModal={setBrandCategoryUpdateModal}
              brandUpdateData={brandUpdateData}
              refetch={refetch}
              categoryTypes={categoryTypes}
              categoryLoading={categoryLoading}
              user={user}
            />
          )}
          {/* Show Brand Category Duplicate Modal */}
          {brandCategoryDuplicateModal && (
            <DuplicateBrandCategory
              setBrandCategoryDuplicateModal={setBrandCategoryDuplicateModal}
              brandUpdateData={brandUpdateData}
              refetch={refetch}
              categoryTypes={categoryTypes}
              categoryLoading={categoryLoading}
              user={user}
            />
          )}
        </div>
      )}
    </>
  );
};

export default BrandTable;
