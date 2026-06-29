import { FiEdit } from "react-icons/fi";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import Pagination from "../common/pagination/Pagination";
import OfferDescription from "./OfferDescription/OfferDescription";
import UpdateOffer from "./UpdateOffer";
import { MdDeleteForever } from "react-icons/md";
import { BiShow } from "react-icons/bi";
import Swal from "sweetalert2-optimized";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import { useEffect, useState } from "react";

const OfferTable = ({
  offerTypes,
  setLimit,
  page,
  limit,
  totalData,
  setPage,
  refetch,
  user,
  isLoading,
}) => {
  const [serialNumber, setSerialNumber] = useState();
  //Show offer DesCription  Modal State
  const [showDesCription, setShowDesCription] = useState(false);
  const [offerProductData, setOfferProductData] = useState([]);

  //Show Offer Update Modal State
  const [showOfferUpdateModal, setShowOfferUpdateModal] = useState(false);
  const [offerUpdateData, setOfferUpdateData] = useState({});

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  //Offer Description Show Function
  const handleShowOfferDesCription = (product) => {
    setShowDesCription(true);
    setOfferProductData(product);
  };
  //Offer Update Show Function
  const handleOfferUpdate = (data) => {
    setShowOfferUpdateModal(true);
    setOfferUpdateData(data);
  };

  //Offer Status Function

  const handleOfferActiveStatus = async (id, offer_status) => {
    try {
      const data = {
        _id: id,
        offer_status,
      };
      const response = await fetch(`${BASE_URL}/offer`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Offer status successfully",
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
  const handleOfferInActiveStatus = async (id, offer_status) => {
    try {
      const data = {
        _id: id,
        offer_status,
      };
      const response = await fetch(`${BASE_URL}/offer`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Offer status successfully",
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

  //Offer Delete Function
  const handleDeleteOfferTableRow = (offer) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${offer?.offer_title} Product!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: offer?._id,
          offer_image_key: offer?.offer_image_key,
        };
        try {
          const response = await fetch(
            `
            ${BASE_URL}/offer`,
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
              text: `${offer?.category_name} Product has been deleted!`,
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
        <div className="rounded-lg  mt-6">
          {offerTypes?.data?.length > 0 ? (
            <div className="overflow-x-auto rounded-t-lg border border-gray-200">
              <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                  <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      SL
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Offer Image
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Offer Title
                    </th>

                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Start Date
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      End Date
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Show Offer Product
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Status
                    </th>

                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-center">
                  {offerTypes?.data?.map((offer, i) => (
                    <tr
                      key={offer?._id}
                      className={`divide-x divide-gray-200 ${
                        i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {serialNumber + i + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700 flex justify-center">
                        <img
                          className="w-[44px] h-[44px] rounded-[8px]"
                          src={offer?.offer_image}
                          alt=""
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {offer?.offer_title}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {offer?.offer_start_date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 ">
                        {offer?.offer_end_date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 ">
                        <button
                          onClick={() =>
                            handleShowOfferDesCription(offer?.offer_products)
                          }
                        >
                          <BiShow
                            size={22}
                            className="cursor-pointer text-gray-500 hover:text-gray-300"
                          />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {offer?.offer_status === "active" ? (
                          <button
                            className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                            onClick={
                              offer?.offer_end_date >=
                              new Date().toISOString().split("T")[0]
                                ? () =>
                                    handleOfferActiveStatus(
                                      offer?._id,
                                      offer?.offer_status
                                        ? "in-active"
                                        : "active"
                                    )
                                : undefined
                            }
                            disabled={
                              offer?.offer_end_date <
                              new Date().toISOString().split("T")[0]
                            }
                          >
                            <span>Active</span>
                          </button>
                        ) : (
                          <button
                            className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                            onClick={
                              offer?.offer_end_date >=
                              new Date().toISOString().split("T")[0]
                                ? () =>
                                    handleOfferActiveStatus(
                                      offer?._id,
                                      offer?.offer_status
                                        ? "active"
                                        : "in-active"
                                    )
                                : undefined
                            }
                            disabled={
                              offer?.offer_end_date <
                              new Date().toISOString().split("T")[0]
                            }
                          >
                            <span>In-Active</span>
                          </button>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {user?.role_id?.offer_delete === true && (
                          <button
                            onClick={() => handleDeleteOfferTableRow(offer)}
                          >
                            <MdDeleteForever
                              size={25}
                              className="cursor-pointer text-red-500 hover:text-red-300"
                            />
                          </button>
                        )}

                        {offer?.offer_end_date >=
                          new Date().toISOString().split("T")[0] && (
                          <>
                            {" "}
                            {user?.role_id?.offer_update === true && (
                              <button
                                className="ml-3"
                                onClick={() => handleOfferUpdate(offer)}
                              >
                                <FiEdit
                                  size={25}
                                  className="cursor-pointer text-gray-500 hover:text-gray-300"
                                />
                              </button>
                            )}
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
          {/* Offer Description */}
          {showDesCription && (
            <OfferDescription
              setShowDesCription={setShowDesCription}
              offerProductData={offerProductData}
            />
          )}

          {/* Offer Update Modal */}
          {showOfferUpdateModal && (
            <UpdateOffer
              setShowOfferUpdateModal={setShowOfferUpdateModal}
              refetch={refetch}
              user={user}
              offerUpdateData={offerUpdateData}
            />
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
        </div>
      )}
    </>
  );
};

export default OfferTable;
