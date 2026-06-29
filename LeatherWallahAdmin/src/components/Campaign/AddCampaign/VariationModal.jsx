import { RxCross1 } from 'react-icons/rx'

const VariationModal = ({ setShowVariationModal, variationData }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-6">
      <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[1000px] p-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div>
          <h3
            className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 capitalize border-b pb-2"
            id="modal-title "
          >
            Variation Description
          </h3>
          <button
            type="button"
            className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3"
            onClick={() => setShowVariationModal(false)}
          >
            {" "}
            <RxCross1 size={20}></RxCross1>
          </button>
          <div className="rounded-lg border border-gray-200 mt-6">
            <div className="overflow-x-auto scrollbar-thin scrollbar-hide ">
              <table className="w-full divide-y-2 divide-gray-200 bg-white text-sm">
                <thead className="bg-[#fff9ee]">
                  <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                    <td className="whitespace-nowrap px-4 py-5">SL No</td>
                    <td className="whitespace-nowrap px-4 py-5">
                      Variant Name
                    </td>

                    <td className="whitespace-nowrap px-4 py-5">
                      Variant Price
                    </td>
                    <td className="whitespace-nowrap px-4 py-5">
                      Discount Price
                    </td>
                    <td className="whitespace-nowrap px-4 py-5">
                      Buying Price
                    </td>

                    <td className="whitespace-nowrap px-4 py-5">
                      Variant Quantity
                    </td>
                    <td className="whitespace-nowrap px-4 py-5">
                      Variant Alert Quantity
                    </td>

                    <td className="whitespace-nowrap px-4 py-5">Image</td>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {variationData?.variation_details?.map((item, index) => (
                    <tr
                      key={index}
                      className={`divide-x divide-gray-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                      }`}
                    >
                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700 text-center">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700 text-center">
                        {" "}
                        {item?.variation_name}
                      </td>

                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                        {item?.variation_price}
                      </td>
                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                        {item?.variation_discount_price}
                      </td>
                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                        {item?.variation_buying_price}
                      </td>

                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                        {item?.variation_quantity}
                      </td>
                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700">
                        {item?.variation_alert_quantity}
                      </td>

                      <td className="whitespace-nowrap py-1.5 font-medium text-gray-700 flex justify-center">
                        <img
                          className="w-[24px] h-[24px] rounded-[8px]"
                          src={
                            item.variation_image ||
                            "https://via.placeholder.com/50"
                          }
                          alt={item.variation_sku}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VariationModal
