import { useState } from 'react'
import { GoEye } from 'react-icons/go'
import { MdAddToPhotos } from 'react-icons/md'

import VariationModal from './VariationModal'
import Pagination from '../../common/pagination/Pagination'
import TableLoadingSkeleton from './../../common/loadingSkeleton/TableLoadingSkeleton'

const CampaignProductTable = ({
  campaignData,
  limit,
  setLimit,
  setPage,
  page,
  totalData,
  handleAddProduct,
  oneProducts,
  isLoading,
}) => {
  const [showVariationModal, setShowVariationModal] = useState(false)
  const [variationData, setVariationData] = useState(null)

  return (
    <>
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : (
        <div className='overflow-x-auto rounded-t-lg'>
          <table className='min-w-full divide-y-2 divide-gray-200 bg-white text-sm'>
            <thead className='ltr:text-left rtl:text-right text-center bg-[#fff9ee]'>
              <tr className='border divide-x'>
                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  ADD
                </th>

                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Product Img
                </th>
                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Product name
                </th>

                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Price
                </th>

                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Discount Price
                </th>
                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Description
                </th>
                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Quantity
                </th>
                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Product SKU
                </th>
                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Status
                </th>
                <th className='whitespace-nowrap py-4 font-medium text-gray-900'>
                  Brand
                </th>
              </tr>
            </thead>

            <tbody className='divide-y divide-gray-200 text-center'>
              {campaignData?.map((item, i) => (
                <tr
                  key={item?._id}
                  className={`divide-x divide-gray-200 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-tableRowBGColor'
                  }`}
                >
                  <td className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                    <button
                      type='button'
                      onClick={() => handleAddProduct(item)}
                      disabled={oneProducts?.some((p) => {
                        p?._id === item?._id
                      })}
                    >
                      <MdAddToPhotos
                        className={`${
                          oneProducts?.some((p) => p?._id === item?._id)
                            ? 'text-green-300 cursor-default'
                            : 'text-green-600 hover:text-green-500'
                        }`}
                        size={25}
                      />
                    </button>
                  </td>

                  <td className='whitespace-nowrap px-4 py-2 font-medium text-gray-900 flex justify-center'>
                    <img
                      src={item?.main_image}
                      alt=''
                      className='w-[34px] h-[34px] rounded-[8px]'
                    />
                  </td>

                  <td className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                    {item?.product_name}
                  </td>

                  <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                    {item?.product_price}
                  </td>
                  <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                    {item?.product_discount_price
                      ? item?.product_discount_price
                      : 0}
                  </td>
                  <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowVariationModal(true)
                        setVariationData(item)
                      }}
                      disabled={item?.is_variation === false}
                    >
                      <GoEye
                        size={22}
                        className={`${
                          item?.is_variation === false
                            ? 'text-gray-300  cursor-default'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  </td>
                  <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                    {item?.product_quantity ? item?.product_quantity : 0}
                  </td>
                  <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                    {item?.product_sku ? item?.product_sku : '-'}
                  </td>

                  <td className='whitespace-nowrap px-4 py-2 '>
                    {item?.product_status === 'active' ? (
                      <button
                        type='button'
                        className='bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]'
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
                        type='button'
                        className='bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]'
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
                  <td className='whitespace-nowrap px-4 py-2 '>
                    {item?.brand_id?.brand_name
                      ? item?.brand_id?.brand_name
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            limit={limit}
            setLimit={setLimit}
            setPage={setPage}
            page={page}
            totalData={totalData}
          />

          {showVariationModal && (
            <VariationModal
              showVariationModal={showVariationModal}
              setShowVariationModal={setShowVariationModal}
              variationData={variationData}
            />
          )}
        </div>
      )}
    </>
  )
}

export default CampaignProductTable
