import React from "react";

// Small courier-box sticker — NOT the full invoice. Printed on a 4x6" (100x150mm)
// label and stuck on the parcel: shop name, who it's going to, and the courier
// consignment id so it's scannable/readable without opening the box.
const PrintableSticker = ({ order, settingData }) => {
  const customerName =
    order?.delivery_name || order?.customer_id?.user_name || "—";
  const customerPhone = order?.delivery_phone || order?.customer_phone || "—";
  const address = [order?.billing_address, order?.billing_city, order?.billing_state]
    .filter(Boolean)
    .join(", ");

  const courierType = order?.courier_type; // "steadfast" | "pathao" | undefined
  const consignmentId =
    courierType === "steadfast"
      ? order?.steadfast_consignment_id
      : courierType === "pathao"
        ? order?.consignment_id
        : order?.steadfast_consignment_id || order?.consignment_id;
  const trackingCode =
    courierType === "steadfast" ? order?.steadfast_tracking_code : null;

  return (
    <div className="p-4 bg-white" id="printable-sticker">
      <style>
        {`
  @media print {
    body * {
      visibility: hidden;
    }

    #printable-sticker, #printable-sticker * {
      visibility: visible;
    }

    #printable-sticker {
      position: fixed;
      left: 0;
      top: 0;
      margin: 0;
      padding: 0;
      z-index: 9999;
      background: white;
      width: 100mm;
    }

    #printable-sticker-label {
      width: 100mm !important;
      min-height: 150mm !important;
      margin: 0 !important;
      border-width: 0 !important;
    }

    .no-print {
      display: none !important;
    }

    @page {
      size: 100mm 150mm;
      margin: 0;
    }
  }
  `}
      </style>

      <div className="no-print mb-3">
        <p className="text-xs text-gray-500 mb-2">
          প্রিন্ট ডায়ালগে Paper size → &quot;4x6 in&quot; বা &quot;Custom&quot; (100mm × 150mm) সিলেক্ট করুন, নাহলে A4 এ প্রিন্ট হবে।
        </p>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Print Sticker
        </button>
      </div>

      <div
        id="printable-sticker-label"
        className="border-2 border-black mx-auto"
        style={{ width: "100mm", minHeight: "150mm", padding: "5mm", boxSizing: "border-box" }}
      >
        {/* Shop logo + name — courier/delivery staff need the name readable,
            not just the logo, so both show together (logo kept small). */}
        <div className="flex flex-col items-center border-b-2 border-black pb-2 mb-3">
          {settingData?.logo && (
            <img
              src={settingData.logo}
              alt={settingData?.title || "Logo"}
              className="h-8 object-contain mb-1"
            />
          )}
          <h1 className="text-lg font-bold">
            {settingData?.title || "Leather Wallah"}
          </h1>
          {settingData?.contact && (
            <p className="text-xs mt-0.5">{settingData.contact}</p>
          )}
        </div>

        {/* Customer info */}
        <div className="mb-3">
          <p className="text-[11px] uppercase text-gray-500 font-semibold">
            Deliver To
          </p>
          <p className="text-lg font-bold">{customerName}</p>
          <p className="text-base font-semibold">{customerPhone}</p>
          {address && <p className="text-sm mt-1">{address}</p>}
        </div>

        {/* Invoice */}
        <div className="mb-3 border-t border-dashed border-gray-400 pt-2">
          <p className="text-[11px] uppercase text-gray-500 font-semibold">
            Invoice
          </p>
          <p className="text-base font-bold">{order?.invoice_id || "—"}</p>
        </div>

        {/* Courier consignment */}
        <div className="border-t border-dashed border-gray-400 pt-2">
          <p className="text-[11px] uppercase text-gray-500 font-semibold">
            {courierType === "pathao" ? "Pathao Consignment ID" : "Steadfast Consignment ID"}
          </p>
          <p className="text-2xl font-extrabold tracking-wide">
            {consignmentId || "—"}
          </p>
          {trackingCode && (
            <p className="text-sm text-gray-600 mt-1">
              Tracking: {trackingCode}
            </p>
          )}
        </div>

        {/* COD amount — the most important number for a COD courier box */}
        {order?.grand_total_amount != null && (
          <div className="border-t-2 border-black mt-3 pt-2 text-center">
            <p className="text-[11px] uppercase text-gray-500 font-semibold">
              COD Amount
            </p>
            <p className="text-2xl font-extrabold">
              {settingData?.currency_symbol || "৳"}
              {order.grand_total_amount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintableSticker;
