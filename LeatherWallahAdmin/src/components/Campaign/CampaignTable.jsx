import { useEffect, useState } from "react";

import { BiShow } from "react-icons/bi";

import { MdDeleteForever } from "react-icons/md";
import { FiEdit } from "react-icons/fi";

import { toast } from "react-toastify";

import Swal from "sweetalert2-optimized";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import CampaignDesCription from "./CampaignDescription/CampaignDesCription";
import UpdateCampaignModal from "./UpdateCampaignModal";
import Pagination from "../common/pagination/Pagination";
import { BASE_URL } from "../../utils/baseURL";

const CampaignTable = ({
  campaignProducts,
  setLimit,
  setPage,
  page,
  limit,
  totalData,
  refetch,
  user,
  isLoading,
}) => {
  const [serialNumber, setSerialNumber] = useState();
  //get Serial number

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);
  //Show Campaign DesCription  Modal State
  const [showCampaignDesCription, setShowCampaignDesCription] = useState(false);
  const [productDetails, setProductDetails] = useState({});

  //Show Campaign Update Modal State
  const [showCampaignUpdateModal, setShowCampaignUpdateModal] = useState(false);
  const [getCampaignUpdateData, setGetCampaignUpdateData] = useState({});

  const handleCampaignUpdate = (campaign) => {
    setShowCampaignUpdateModal(true);
    setGetCampaignUpdateData(campaign);
  };

  //Campaign Description Show Function
  const handleShowCampaignDesCription = (campaign) => {
    setShowCampaignDesCription(true);
    setProductDetails(campaign);
  };

  //Campaign Status update Function

  const handleOfferActiveStatus = async (id, campaign_status) => {
    try {
      const data = {
        _id: id,
        campaign_status,
      };
      const response = await fetch(
        `${BASE_URL}/campaign`,
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
          result?.message ? result?.message : "campaign status successfully",
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
  const handleOfferInActiveStatus = async (id, campaign_status) => {
    try {
      const data = {
        _id: id,
        campaign_status,
      };
      const response = await fetch(
        `${BASE_URL}/campaign`,
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
          result?.message ? result?.message : "campaign status successfully",
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
  //campaign Delete Function
  const handleDeleteCampaignTableRow = (campaign) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${campaign?.campaign_title} Product!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: campaign?._id,
          campaign_image_key: campaign?.campaign_image_key,
          campaign_products: campaign?.campaign_products?.map((item) => {
            return {
              campaign_product_id: item?.campaign_product_id?._id,
            };
          }),
        };
        try {
          const response = await fetch(
            `
            ${BASE_URL}/campaign`,
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
              text: `${campaign?.campaign_title} Product has been deleted!`,
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
        <div className="rounded-lg   mt-6">
          {campaignProducts?.data?.length > 0 ? (
            <div className="overflow-x-auto rounded-t-lg border">
              <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm rounded-t-lg">
                <thead className="ltr:text-left rtl:text-right bg-tableRowBGColor">
                  <tr className="border divide-x">
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      SL
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      campaign Image
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Title
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Start Date
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      End Date
                    </th>
                    <th className="whitespace-nowrap py-4 font-medium text-gray-900">
                      Show Campaign Product
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
                  {campaignProducts?.data?.map((campaign, i) => (
                    <tr
                      key={campaign?._id}
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
                          src={campaign?.campaign_image}
                          alt=""
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {campaign?.campaign_title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {campaign?.campaign_start_date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 ">
                        {campaign?.campaign_end_date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900 ">
                        <button
                          onClick={() =>
                            handleShowCampaignDesCription(campaign)
                          }
                        >
                          <BiShow size={22} />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                        {campaign?.campaign_status === "active" ? (
                          <button
                            className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                            onClick={
                              campaign?.campaign_end_date >= new Date().toISOString().split("T")[0]
                                ? () =>
                                  handleOfferActiveStatus(
                                    campaign?._id,
                                    campaign?.campaign_status
                                      ? "in-active"
                                      : "active"
                                  )
                                : undefined
                            }
                            disabled={campaign?.campaign_end_date < new Date().toISOString().split("T")[0]}
                          >
                            <span>Active</span>
                          </button>
                        ) : (
                          <button
                            className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                            onClick={
                              campaign?.campaign_end_date >= new Date().toISOString().split("T")[0]
                                ? () =>
                                  handleOfferInActiveStatus(
                                    campaign?._id,
                                    campaign?.campaign_status
                                      ? "active"
                                      : "in-active"
                                  )
                                : undefined
                            }
                            disabled={campaign?.campaign_end_date < new Date().toISOString().split("T")[0]}
                          >
                            <span>In-Active</span>
                          </button>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {user?.role_id?.campaign_delete === true && (
                          <button className="ml-1">
                            <MdDeleteForever
                              onClick={() =>
                                handleDeleteCampaignTableRow(campaign)
                              }
                              size={25}
                              className="cursor-pointer text-red-500 hover:text-red-300"
                            />
                          </button>
                        )}

                        {campaign?.campaign_end_date >=
                          new Date().toISOString().split("T")[0] && (
                          <>
                            {user?.role_id?.campaign_update === true && (
                              <button
                                className="ml-3"
                                onClick={() => handleCampaignUpdate(campaign)}
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

          {/* Campaign Description */}
          {showCampaignDesCription && (
            <CampaignDesCription
              setShowCampaignDesCription={setShowCampaignDesCription}
              productDetails={productDetails}
            />
          )}

          {/* Campaign Update Modal */}
          {showCampaignUpdateModal && (
            <UpdateCampaignModal
              setShowCampaignUpdateModal={setShowCampaignUpdateModal}
              getCampaignUpdateData={getCampaignUpdateData}
              refetch={refetch}
              user={user}
            />
          )}

          {/* pagination */}
          {totalData > 10 && (
            <Pagination
              setLimit={setLimit}
              page={page}
              setPage={setPage}
              limit={limit}
              totalData={totalData}
            />
          )}
        </div>
      )}
    </>
  );
};

export default CampaignTable;
