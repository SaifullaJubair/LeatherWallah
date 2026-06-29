import { forwardRef } from "react";

const POSReceipt = forwardRef(({ lines, customer, delivery, discount, shippingCost, grandTotal, invoiceId, shopName, shopPhone }, ref) => {
  const now = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" });
  const subTotal = lines.reduce((s, l) => s + l.unit_price * l.product_quantity, 0);

  return (
    <div ref={ref} className="receipt-print hidden print:block font-mono text-sm text-black bg-white p-4 w-80">
      <div className="text-center mb-3">
        <p className="text-base font-bold">{shopName || "Leather Wallah"}</p>
        {shopPhone && <p className="text-xs">{shopPhone}</p>}
        <p className="text-xs mt-1">POS Receipt</p>
        <p className="text-xs">{now}</p>
        {invoiceId && <p className="text-xs font-semibold mt-1">Invoice: {invoiceId}</p>}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-xs mb-1">
        <span className="font-semibold">Customer: </span>
        {customer.name || "Walk-in"} {customer.phone ? `(${customer.phone})` : ""}
      </div>
      {delivery.address && delivery.address !== "Pickup" && (
        <div className="text-xs mb-1">
          <span className="font-semibold">Address: </span>{delivery.address}
        </div>
      )}

      <div className="border-t border-dashed border-black my-2" />

      <table className="w-full text-xs mb-2">
        <thead>
          <tr>
            <th className="text-left font-semibold">Item</th>
            <th className="text-center font-semibold">Qty</th>
            <th className="text-right font-semibold">Price</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l._lineId}>
              <td className="text-left pr-1 py-0.5">
                {l.product_name}
                {l.variation_label && <span className="text-gray-600"> ({l.variation_label})</span>}
              </td>
              <td className="text-center py-0.5">{l.product_quantity}</td>
              <td className="text-right py-0.5">৳{(l.unit_price * l.product_quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-xs space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span><span>৳{subTotal.toLocaleString()}</span>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between">
            <span>Shipping</span><span>৳{shippingCost}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span><span>-৳{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-black pt-1 mt-1">
          <span>TOTAL</span><span>৳{grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />
      <p className="text-center text-xs">Thank you for your purchase!</p>
    </div>
  );
});

POSReceipt.displayName = "POSReceipt";
export default POSReceipt;
