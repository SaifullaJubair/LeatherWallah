import { FiEdit } from "react-icons/fi";
import { useState } from "react";
import UpdatePageSeo from "./UpdatePageSeo";
import { MdToggleOff, MdToggleOn } from "react-icons/md";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";

const PageSeoTable = ({ pageSeoData, refetch, isLoading, user }) => {
  const [showPageSeoUpdateModal, setShowPageSeoUpdateModal] = useState(false);
  const [getPageSeoUpdateData, setGetPageSeoUpdateData] = useState({});

  // Page SEO Update Modal Open
  const handlePageSeoUpdateModal = (pageSeo) => {
    setShowPageSeoUpdateModal(true);
    setGetPageSeoUpdateData(pageSeo);
  };

  // Toggle noIndex status
  const handleToggleNoIndex = async (page_key, currentStatus) => {
    try {
      const response = await fetch(`${BASE_URL}/page-seo/${page_key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ noIndex: !currentStatus }),
      });

      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : "NoIndex status updated successfully",
          { autoClose: 1000 },
        );
        refetch();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      toast.error(error?.message, { autoClose: 1000 });
    }
  };

  return (
    <>
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : (
        <div>
          {pageSeoData?.length > 0 ? (
            <div className="rounded-lg border border-gray-200 mt-6">
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                      <td className="whitespace-nowrap p-4">SL No</td>
                      <td className="whitespace-nowrap p-4">Page Key</td>
                      <td className="whitespace-nowrap p-4">Page Path</td>
                      <td className="whitespace-nowrap p-4">Meta Title</td>
                      <td className="whitespace-nowrap p-4">
                        Meta Description
                      </td>
                      <td className="whitespace-nowrap p-4">NoIndex</td>
                      <td className="whitespace-nowrap p-4">Action</td>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {pageSeoData?.map((pageSeo, i) => (
                      <tr
                        key={pageSeo?._id}
                        className={`divide-x divide-gray-200 ${
                          i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                        }`}
                      >
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {i + 1}
                        </td>
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          {pageSeo?.page_key}
                        </td>
                        <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                          /{pageSeo?.path || ""}
                        </td>
                        <td className="py-1.5 px-2 text-gray-700 max-w-xs truncate">
                          {pageSeo?.title}
                        </td>
                        <td className="py-1.5 px-2 text-gray-700 max-w-md truncate">
                          {pageSeo?.description || "—"}
                        </td>
                        <td className="whitespace-nowrap py-1.5">
                          <button
                            onClick={() =>
                              handleToggleNoIndex(
                                pageSeo?.page_key,
                                pageSeo?.noIndex,
                              )
                            }
                            className="flex items-center justify-center mx-auto"
                          >
                            {pageSeo?.noIndex ? (
                              <MdToggleOn
                                size={35}
                                className="text-red-500 hover:text-red-400"
                              />
                            ) : (
                              <MdToggleOff
                                size={35}
                                className="text-green-500 hover:text-green-400"
                              />
                            )}
                          </button>
                        </td>
                        <td className="whitespace-nowrap py-1.5 px-2 text-gray-700">
                          {user?.role_id?.page_seo_update === true && (
                            <button
                              onClick={() => handlePageSeoUpdateModal(pageSeo)}
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

          {/* Show Page SEO Update Modal */}
          {showPageSeoUpdateModal && (
            <UpdatePageSeo
              setShowPageSeoUpdateModal={setShowPageSeoUpdateModal}
              getPageSeoUpdateData={getPageSeoUpdateData}
              refetch={refetch}
            />
          )}
        </div>
      )}
    </>
  );
};

export default PageSeoTable;
