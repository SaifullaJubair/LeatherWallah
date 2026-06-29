import { useEffect, useState } from 'react'

import { FiEdit } from 'react-icons/fi'
import { MdDeleteForever } from 'react-icons/md'
import UpdateAttribute from './UpdateAttribute'
import ViewAttributeValue from './viewAttributeValue/ViewAttributeValue'
import Swal from 'sweetalert2-optimized'
import Pagination from '../common/pagination/Pagination'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/baseURL'
import NoDataFound from '../../shared/NoDataFound/NoDataFound'
import { GoEye } from 'react-icons/go'
import TableLoadingSkeleton from './../common/loadingSkeleton/TableLoadingSkeleton'

const AttributeTable = ({
  categoryTypes,
  attributeTypes,
  setPage,
  setLimit,
  isLoading,
  totalData,
  page,
  limit,
  refetch,
  user,
}) => {
  //get Serial Number From..index....
  const [serialNumber, setSerialNumber] = useState()
  useEffect(() => {
    const newSerialNumber = (page - 1) * limit
    setSerialNumber(newSerialNumber)
  }, [page, limit])

  // Attribute Update Modal...
  const [openAttributeUpdateModal, setOpenAttributeUpdateModal] =
    useState(false)
  const [attributeUpdateValue, setAttributeUpdateValue] = useState({})
  // handle Attribute Update Function
  const handleAttributeUpdate = (attribute) => {
    setOpenAttributeUpdateModal(true)
    setAttributeUpdateValue(attribute)
  }

  // Attribute View Value Modal...
  const [viewAttributeValueModal, setViewAttributeValueModal] = useState(false)
  const [attributesValue, setAttributesValue] = useState({})
  //handle View Attribute Value Function
  const handleAttributeValue = (attribute) => {
    setViewAttributeValueModal(true)
    setAttributesValue(attribute)
  }

  //handle Specific Status update

  const handleAttributeActiveStatus = async (id, attribute_status) => {
    try {
      const data = {
        _id: id,
        attribute_status,
      }
      const response = await fetch(
        `${BASE_URL}/attribute`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        }
      )
      const result = await response.json()
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : 'attribute status update successfully',
          {
            autoClose: 1000,
          }
        )
        refetch()
      } else {
        toast.error(result?.message || 'Something went wrong', {
          autoClose: 1000,
        })
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      })
    } finally {
      ;('')
    }
  }

  const handleAttributeInActiveStatus = async (id, attribute_status) => {
    try {
      const data = {
        _id: id,
        attribute_status,
      }
      const response = await fetch(
        `${BASE_URL}/attribute`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        }
      )
      const result = await response.json()
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : 'attribute status update successfully',
          {
            autoClose: 1000,
          }
        )
        refetch()
      } else {
        toast.error(result?.message || 'Something went wrong', {
          autoClose: 1000,
        })
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      })
    } finally {
      ;('')
    }
  }

  // handle Specific Status update End...

  //handle Delete Attribute Table row function
  const handleDeleteAttributeTableRow = (attribute) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this ${attribute?.attribute_name} Specification!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: attribute?._id,
        }
        try {
          const response = await fetch(
            `
            ${BASE_URL}/attribute`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(sendData),
            }
          )
          const result = await response.json()
          // console.log(result);
          if (result?.statusCode === 200 && result?.success === true) {
            refetch()
            Swal.fire({
              title: 'Deleted!',
              text: `${attribute?.attribute_name} Attribute has been deleted!`,
              icon: 'success',
            })
          } else if (result?.statusCode === 409) {
            // B2 — attribute referenced by N products. Show count + clickable
            // sample product links so the admin can clear references first.
            const sampleIds = Array.isArray(result?.data?.sample_ids)
              ? result.data.sample_ids
              : []
            const count = result?.data?.count || 0
            const linksHtml = sampleIds.length
              ? `
                <div style="margin-top:12px;text-align:left;">
                  <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">
                    Affected products (showing ${sampleIds.length} of ${count}) — click to edit and remove the attribute:
                  </div>
                  <ul style="list-style:none;padding:0;margin:0;max-height:200px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;">
                    ${sampleIds
                      .map(
                        (id, i) => `
                      <li style="border-bottom:1px solid #f3f4f6;">
                        <a href="/product/product-update/${id}" target="_blank" rel="noopener noreferrer"
                           style="display:block;padding:8px 12px;color:#2563eb;font-family:monospace;font-size:12px;text-decoration:none;">
                          ${i + 1}. ${id} ↗
                        </a>
                      </li>`
                      )
                      .join('')}
                  </ul>
                </div>
              `
              : ''
            Swal.fire({
              title: `Cannot delete — in use by ${count} product${count === 1 ? '' : 's'}`,
              html: `
                <div style="font-size:14px;color:#374151;">
                  <strong>${attribute?.attribute_name}</strong> is referenced by
                  product attributes. Remove it from the listed products first,
                  then retry the delete.
                </div>
                ${linksHtml}
              `,
              icon: 'warning',
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6',
              width: 520,
            })
          } else {
            toast.error(result?.message, {
              autoClose: 1000,
            })
          }
        } catch (error) {
          toast.error('Network error or server is down', {
            autoClose: 1000,
          })
          console.error(error)
        }
      }
    })
  }

  return (
    <>
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : (
        <div>
          <div className="rounded-lg border border-gray-200 mt-6">
            {attributeTypes?.data?.length > 0 ? (
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        SL No
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Attribute Name
                      </th>
                      {/* Phase A — display style + weight tracking at a glance. */}
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Display
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Attribute value
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Attribute Status
                      </th>

                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {attributeTypes?.data?.map((attribute, i) => (
                      <tr
                        key={attribute?._id}
                        className={`divide-x divide-gray-200 ${
                          i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          {serialNumber + i + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                          {attribute?.attribute_name}
                        </td>
                        {/* Phase A — display style badge + weight tracking indicator. */}
                        <td className="whitespace-nowrap px-4 py-2">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                                attribute?.display_type === "swatch"
                                  ? "bg-purple-100 text-purple-700"
                                  : attribute?.display_type === "dropdown"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {attribute?.display_type || "button"}
                            </span>
                            {attribute?.tracks_weight && (
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-700"
                                title="Weight tracking enabled — variation matrix auto-fills from weight values"
                              >
                                ⚖ weight
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                          <button
                            onClick={() => handleAttributeValue(attribute)}
                          >
                            <GoEye
                              size={22}
                              className="cursor-pointer text-gray-500 hover:text-gray-300"
                            />
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                          {attribute?.attribute_status === "active" ? (
                            <button
                              className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleAttributeActiveStatus(
                                  attribute?._id,
                                  attribute?.attribute_status
                                    ? "in-active"
                                    : "active"
                                )
                              }
                            >
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]"
                              onClick={() =>
                                handleAttributeInActiveStatus(
                                  attribute?._id,
                                  attribute?.attribute_status
                                    ? "active"
                                    : "in-active"
                                )
                              }
                            >
                              <span>In-Active</span>
                            </button>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                          {user?.role_id?.attribute_delete && (
                            <button
                              onClick={() =>
                                handleDeleteAttributeTableRow(attribute)
                              }
                            >
                              <MdDeleteForever
                                size={25}
                                className="cursor-pointer text-red-500 hover:text-red-300"
                              />
                            </button>
                          )}
                          {user?.role_id?.attribute_update && (
                            <button
                              className="ml-[8px]"
                              onClick={() => handleAttributeUpdate(attribute)}
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
            ) : (
              <NoDataFound />
            )}
          </div>
          {/* pagination */}
          {totalData > 10 && (
            <Pagination
              setPage={setPage}
              setLimit={setLimit}
              totalData={totalData}
              page={page}
              limit={limit}
            />
          )}

          {/* Show Attribute Update Modal */}
          {openAttributeUpdateModal && (
            <UpdateAttribute
              setOpenAttributeUpdateModal={setOpenAttributeUpdateModal}
              categoryTypes={categoryTypes}
              attributeUpdateValue={attributeUpdateValue}
              refetch={refetch}
              user={user}
            />
          )}
          {/* Show Attribute Value Modal */}

          {viewAttributeValueModal && (
            <ViewAttributeValue
              setViewAttributeValueModal={setViewAttributeValueModal}
              attributesValue={attributesValue}
            />
          )}
        </div>
      )}
    </>
  );
}

export default AttributeTable
