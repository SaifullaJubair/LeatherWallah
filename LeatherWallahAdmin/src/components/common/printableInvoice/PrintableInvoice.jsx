import React from "react";
import { DateFormate } from "../../../utils/DateFormate/DateFormate";

const PrintableInvoice = ({ order, orderProducts, settingData }) => {
  return (
    <>
      <div className="p-6 bg-white" id="printable-invoice">
        <style>
          {`
  @media print {
    body * {
      visibility: hidden;
    }

    #printable-invoice, #printable-invoice * {
      visibility: visible;
    }

    #printable-invoice {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
      padding: 20px;
      z-index: 9999;
      background: white;
    }

    .no-print,
    header,
    footer,
    nav,
    .dashboard-layout,
    .route-name, /* if applicable */
    .breadcrumb, /* if applicable */
    title::before, /* some browsers */
    title::after {
      display: none !important;
    }

    @page {
      margin: 0;
    }
  }
  `}
        </style>

        {/* Company Header */}
        <div className="text-center mb-6">
          {settingData?.logo && (
            <div className="flex justify-center mb-4">
              <img
                src={settingData.logo}
                alt="Company Logo"
                className="h-16 object-contain"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold">
            {settingData?.title || "Company Name"}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-4 mt-2 text-sm">
            {settingData?.address && <p>{settingData.address}</p>}
            {settingData?.address_two && <p>{settingData.address_two}</p>}
            {settingData?.address_three && <p>{settingData.address_three}</p>}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 mt-2 text-sm">
            {settingData?.contact && <p>Contact: {settingData.contact}</p>}
            {settingData?.email && <p>Email: {settingData.email}</p>}
          </div>
        </div>

        {/* Invoice Header */}
        <div className="flex justify-between items-center mb-8 border-t-2 border-b-2 border-gray-200 py-4">
          <div>
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p className="text-gray-600">#{order?.invoice_id}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Date: {DateFormate(new Date())}</p>
            <button
              onClick={() => window.print()}
              className="no-print mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Print Invoice
            </button>
          </div>
        </div>

        {/* Customer and Order Info */}
        {/* <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Billed To:</h2>
          <p className="font-medium">{order?.customer_id?.user_name}</p>
          <p>{order?.customer_phone}</p>
          <p>{order?.billing_address}</p>
          <p>
            {order?.billing_city}, {order?.billing_state}
          </p>
        </div> */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Billed To:</h2>
            <p className="font-medium">{order?.customer_id?.user_name}</p>
            <p>{order?.customer_phone}</p>
            <p>{order?.billing_address}</p>
            <p>
              {order?.billing_city}, {order?.billing_state}
            </p>
          </div>
          <div className="flex justify-end">
            <div className="w-2/3">
              <div className="">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Subtotal:</span>
                  <span>
                    {settingData?.currency_symbol || "৳"}
                    {order?.sub_total_amount}
                  </span>
                </div>

                <div className="flex justify-between mb-2">
                  <span className="font-medium">Shipping:</span>
                  <span>
                    {settingData?.currency_symbol || "৳"}
                    {order?.shipping_cost}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-2 border-t">
                  <span>Grand Total:</span>
                  <span>
                    {settingData?.currency_symbol || "৳"}
                    {order?.grand_total_amount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left border">#</th>
              <th className="p-3 text-left border">Image</th>
              <th className="p-3 text-left border">Product</th>
              <th className="p-3 text-left border">Variation</th>
              <th className="p-3 text-left border">Unit Price</th>
              <th className="p-3 text-left border">Qty</th>
              <th className="p-3 text-left border">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderProducts?.map((product, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-3 border">{idx + 1}</td>
                <td className="py-2 flex justify-center">
                  {product?.variation_id ? (
                    <img
                      src={
                        product?.variation_id?.variation_image ||
                        product?.product_id?.main_image
                      }
                      className="w-14 h-14 rounded-md border"
                      alt=""
                    />
                  ) : (
                    <img
                      src={product?.product_id?.main_image}
                      className="w-14 h-14 rounded-md border"
                      alt=""
                    />
                  )}
                </td>
                <td className="p-3 border">
                  {product?.product_id?.product_name}
                </td>
                <td className="p-3 border">
                  {product?.variation_id?.variation_name || "-"}
                </td>
                <td className="p-3 border">
                  {settingData?.currency_symbol || "৳"}
                  {product?.product_unit_final_price}
                </td>
                <td className="p-3 border">{product?.product_quantity}</td>
                <td className="p-3 border">
                  {settingData?.currency_symbol || "৳"}
                  {product?.product_grand_total_price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        {/* <div className="flex justify-end">
          <div className="w-1/3">
            <div className="border-t-2 border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Subtotal:</span>
                <span>
                  {settingData?.currency_symbol || "৳"}
                  {order?.sub_total_amount}
                </span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="font-medium">Shipping:</span>
                <span>
                  {settingData?.currency_symbol || "৳"}
                  {order?.shipping_cost}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-4 pt-2 border-t">
                <span>Grand Total:</span>
                <span>
                  {settingData?.currency_symbol || "৳"}
                  {order?.grand_total_amount}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Footer */}
        {/* <div className="mt-12 pt-4 border-t text-center">
        <p className="text-gray-500 text-sm mb-4">
        {settingData?.welcome_message || "Thank you for your business!"}
        </p>
        
        <p
        className="mt-4 text-sm text-gray-500"
          dangerouslySetInnerHTML={{
            __html:
            settingData?.shipping_info ||
            "If you have any questions about this invoice, please contact our customer support.",
          }}
        />
      </div> */}
      </div>
    </>
  );
};

export default PrintableInvoice;
