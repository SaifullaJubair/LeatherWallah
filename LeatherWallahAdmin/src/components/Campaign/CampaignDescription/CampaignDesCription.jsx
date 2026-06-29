
import { RxCross1 } from 'react-icons/rx'
import NoDataFound from '../../../shared/NoDataFound/NoDataFound'
import { GoEye } from 'react-icons/go'
import { useState } from 'react'
import AddProductVariation from './AddProductVariation.jsx/AddProductVariation'

const CampaignDesCription = ({
  setShowCampaignDesCription,
  productDetails,
}) => {
  //VariAtion State
  const [showCampaignVariationModal, setShowCampaignVariationModal] =
    useState(false)
  const [campaignVariationData, setCampaignVariationData] = useState({})

  //Show Variation Details handle
  const showVariationDetail = (productVariation) => {
    setShowCampaignVariationModal(true)
    setCampaignVariationData(productVariation)
  }
  console.log(productDetails)

  return (
    <div>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
        <div className='relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[1550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin'>
          <div className=''>
            <h3
              className='text-[20px] font-bold text-gray-800 capitalize text-center'
              id='modal-title '
            >
              Campaign DesCription
            </h3>
            <button
              type='button'
              className='btn bg-white   p-1 absolute right-1 rounded-full top-1 hover:bg-bgBtnInactive hover:text-btnInactiveColor'
              onClick={() => setShowCampaignDesCription(false)}
            >
              {' '}
              <RxCross1 size={20}></RxCross1>
            </button>
          </div>
          <div className='mt-4'>
            <p className='text-xl font-medium'>
              Description : <br />
              <span className='text-sm text-justify line-clamp-2'>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Animi
                inventore libero quos veritatis consequuntur! Similique fuga
                necessitatibus voluptatum, quasi quos neque temporibus
                doloremque aperiam ut ipsam maiores excepturi cum assumenda.
              </span>
            </p>

            <div className='my-8'>
              <p className='mb-1 font-medium'>You Add This Product : </p>
              {productDetails?.campaign_products?.length > 0 ? (
                <div className='my-6  bg-gray-50 px-3 py-5  rounded-lg'>
                  <div className='overflow-x-auto rounded-t-lg'>
                    <table className='min-w-full divide-y-2 divide-gray-200 bg-white text-sm border'>
                      <thead className='ltr:text-left rtl:text-right text-center bg-tableRowBGColor'>
                        <tr className='divide-x divide-gray-300  font-semibold text-center text-gray-900'>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Product Img
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Product name
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Campaign Product Price
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Campaign Product Status
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Price
                          </th>

                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            variation
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Quantity
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Product SKU
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Status
                          </th>
                          <th className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                            Brand
                          </th>
                        </tr>
                      </thead>

                      <tbody className='divide-y divide-gray-200 text-center'>
                        {productDetails?.campaign_products?.map(
                          (product, i) => (
                            <tr
                              key={product?._id}
                              className={`divide-x divide-gray-200 ${
                                i % 2 === 0 ? 'bg-white' : 'bg-tableRowBGColor'
                              }`}
                            >
                              <td className='whitespace-nowrap px-4 py-2 font-medium text-gray-900 flex justify-center'>
                                <img
                                  src={product?.campaign_product_id?.main_image}
                                  alt=''
                                  className='w-[34px] h-[34px] rounded-[8px]'
                                />
                              </td>

                              <td className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                                {product?.campaign_product_id?.product_name}
                              </td>
                              <td className='whitespace-nowrap px-4 py-2 font-medium text-gray-900'>
                                {product?.campaign_product_price}
                              </td>
                              <td>
                                {product?.campaign_product_status ===
                                'active' ? (
                                  <button
                                    type='button'
                                    className='bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px]'
                                  >
                                    <span>Active</span>
                                  </button>
                                ) : (
                                  <button
                                    type='button'
                                    className='bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px]'
                                  >
                                    <span>In-Active</span>
                                  </button>
                                )}
                              </td>
                              <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                                {product?.campaign_product_id?.product_price}
                              </td>

                              <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                                <button
                                  type='button'
                                  onClick={() =>
                                    showVariationDetail(product?.variations)
                                  }
                                  disabled={
                                    product?.campaign_product_id
                                      ?.is_variation === false
                                  }
                                >
                                  <GoEye
                                    size={22}
                                    className={`${
                                      product?.campaign_product_id
                                        ?.is_variation === false
                                        ? 'text-gray-300  cursor-default'
                                        : 'text-gray-600'
                                    }`}
                                  />
                                </button>
                              </td>
                              <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                                {product?.campaign_product_id?.product_quantity
                                  ? product?.campaign_product_id
                                      ?.product_quantity
                                  : 0}
                              </td>
                              <td className='whitespace-nowrap px-4 py-2 text-gray-700'>
                                {product?.campaign_product_id?.product_sku
                                  ? product?.campaign_product_id?.product_sku
                                  : '-'}
                              </td>

                              <td className='whitespace-nowrap px-4 py-2 '>
                                {product?.campaign_product_id
                                  ?.product_status === 'active' ? (
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
                                {product?.campaign_product_id?.brand_id
                                  ?.brand_name
                                  ? product?.campaign_product_id?.brand_id
                                      ?.brand_name
                                  : '-'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <NoDataFound />
              )}
            </div>
          </div>
        </div>
      </div>
      {showCampaignVariationModal && (
        <AddProductVariation
          setShowCampaignVariationModal={setShowCampaignVariationModal}
          campaignVariationData={campaignVariationData}
        />
      )}
    </div>
  )
}

export default CampaignDesCription
