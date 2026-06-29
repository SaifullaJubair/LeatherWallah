/**
 * PaymentInfoCard — admin order-detail surfacing of Phase C payment fields.
 *
 * Shows: payment_method, payment_status, paid_amount, advance_amount,
 *        vat_amount, transaction_id, payment_meta (submitted_at,
 *        method_name, payer_number, screenshot_url, verify_note,
 *        verified_at, verified_by).
 * Action: PATCH /payment/verify/:order_id with { decision, paid_amount?, note? }.
 *         Gated on `order_update`.
 */

import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { FaCheckCircle, FaTimesCircle, FaExternalLinkAlt } from "react-icons/fa";
import { MdPayments, MdReceiptLong } from "react-icons/md";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const METHOD_LABEL = {
  cod: "Cash on Delivery",
  manual_mfs: "Manual MFS",
  sslcommerz: "SSLCommerz",
  bank_transfer: "Bank Transfer",
};

const STATUS_COLOR = {
  unpaid: "bg-gray-100 text-gray-700",
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const fmt = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
};

const Row = ({ label, children }) => (
  <div className="flex justify-between items-start gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-800 font-medium text-right">{children}</span>
  </div>
);

const VerifyModal = ({ order, decision, onClose, onDone }) => {
  const isPaid = decision === "paid";
  const totalOwed = Number(order?.grand_total_amount) || 0;
  const alreadyPaid = Number(order?.paid_amount) || 0;
  const remainingOwed = Math.max(totalOwed - alreadyPaid, 0);
  const [paidAmount, setPaidAmount] = useState(remainingOwed || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const body = { decision };
      if (isPaid && paidAmount !== "" && paidAmount !== null) {
        const n = Number(paidAmount);
        if (Number.isFinite(n) && n > 0) body.paid_amount = n;
      }
      if (note.trim()) body.note = note.trim();

      const res = await fetch(`${BASE_URL}/payment/verify/${order._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Payment verified", { autoClose: 1500 });
        onDone();
        onClose();
      } else {
        toast.error(result?.message || "Verify failed", { autoClose: 2000 });
      }
    } catch (e) {
      toast.error(e?.message || "Network error", { autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl w-[480px] p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-1">
          {isPaid ? "Mark Payment as Paid" : "Mark Payment as Failed"}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Invoice <span className="font-mono">{order?.invoice_id}</span> · grand
          total ৳{totalOwed}
        </p>

        {isPaid && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600">
              Amount received (৳)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={String(remainingOwed)}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Leave blank → backend fills the remaining ৳{remainingOwed} owed.
              Already received: ৳{alreadyPaid}.
            </p>
          </div>
        )}

        {!isPaid && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded p-3 text-xs text-red-700">
            Marking failed will <strong>cancel the order</strong> and restock the
            items (Phase B). This is idempotent — a re-mark won't double-restock.
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600">
            Internal note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Saved into payment_meta.verify_note"
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          {loading ? (
            <div
              className={`px-6 py-2 flex items-center justify-center text-white rounded ${
                isPaid ? "bg-emerald-600" : "bg-red-600"
              }`}
            >
              <MiniSpinner />
            </div>
          ) : (
            <button
              type="button"
              onClick={submit}
              className={`px-6 py-2 text-sm text-white rounded ${
                isPaid
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isPaid ? "Confirm — Paid" : "Confirm — Failed"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentInfoCard = ({ order, user, refetch }) => {
  const [verifyModal, setVerifyModal] = useState(null); // null | "paid" | "failed"

  if (!order) return null;

  const method = order?.payment_method || "cod";
  const status = order?.payment_status || "unpaid";
  const meta = order?.payment_meta || {};

  const canVerify =
    user?.role_id?.order_update === true &&
    status !== "paid" &&
    status !== "refunded";

  // For COD orders with no online step, "verify failed" still makes sense
  // (admin can cancel + restock from here) but "mark paid" only fires once
  // payment actually changes hands. We surface both — the backend rejects
  // bad transitions.
  const showVerifyButtons = canVerify;

  return (
    <div className="bg-white border border-gray-200 shadow rounded p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdPayments className="text-gray-600" size={20} />
          <h3 className="font-semibold text-gray-700">Payment</h3>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            STATUS_COLOR[status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div>
          <Row label="Method">
            {METHOD_LABEL[method] || method}
          </Row>
          <Row label="Grand total">৳{order?.grand_total_amount ?? 0}</Row>
          <Row label="Paid amount">৳{Number(order?.paid_amount) || 0}</Row>
          {Number(order?.advance_amount) > 0 && (
            <Row label="Advance (pre-paid)">৳{order.advance_amount}</Row>
          )}
          {Number(order?.vat_amount) > 0 && (
            <Row label="VAT">৳{order.vat_amount}</Row>
          )}
          {Number(order?.loyalty_redeem_amount) > 0 && (
            <Row label="Loyalty redeemed">
              −৳{order.loyalty_redeem_amount}{" "}
              <span className="text-xs text-gray-400">
                ({order.loyalty_redeem_points} pts)
              </span>
            </Row>
          )}
          {order?.transaction_id && (
            <Row label="Transaction ID">
              <span className="font-mono text-xs">{order.transaction_id}</span>
            </Row>
          )}
        </div>

        <div>
          {meta?.submitted_at && (
            <Row label="Customer submitted">{fmt(meta.submitted_at)}</Row>
          )}
          {meta?.method_name && (
            <Row label="Submitted method">{meta.method_name}</Row>
          )}
          {meta?.payer_number && (
            <Row label="Payer number">{meta.payer_number}</Row>
          )}
          {meta?.verified_at && (
            <Row label="Verified at">{fmt(meta.verified_at)}</Row>
          )}
          {meta?.verify_note && (
            <Row label="Verify note">
              <span className="text-xs italic">{meta.verify_note}</span>
            </Row>
          )}
          {order?.stock_restored && (
            <Row label="Stock">
              <span className="text-amber-600 text-xs">restored (cancelled)</span>
            </Row>
          )}
        </div>
      </div>

      {meta?.screenshot_url && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MdReceiptLong className="text-gray-500" size={18} />
              <span className="text-sm font-medium text-gray-700">
                Payment screenshot
              </span>
            </div>
            <a
              href={meta.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Open full size <FaExternalLinkAlt size={10} />
            </a>
          </div>
          <a
            href={meta.screenshot_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-xs"
          >
            <img
              src={meta.screenshot_url}
              alt="Payment screenshot"
              className="rounded border border-gray-200 max-h-48 object-contain bg-gray-50"
            />
          </a>
        </div>
      )}

      {showVerifyButtons && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-3">
          <span className="text-xs text-gray-400 mr-auto">
            Admin action — verify the buyer's payment claim.
          </span>
          <button
            type="button"
            onClick={() =>
              Swal.fire({
                title: "Mark this payment failed?",
                text: "The order will be cancelled and stock restored. You can add a reason on the next screen.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#dc2626",
                confirmButtonText: "Continue",
              }).then((r) => {
                if (r.isConfirmed) setVerifyModal("failed");
              })
            }
            className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 flex items-center gap-1.5"
          >
            <FaTimesCircle size={14} /> Mark Failed
          </button>
          <button
            type="button"
            onClick={() => setVerifyModal("paid")}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1.5"
          >
            <FaCheckCircle size={14} /> Mark Paid
          </button>
        </div>
      )}

      {verifyModal && (
        <VerifyModal
          order={order}
          decision={verifyModal}
          onClose={() => setVerifyModal(null)}
          onDone={() => {
            if (typeof refetch === "function") refetch();
          }}
        />
      )}
    </div>
  );
};

export default PaymentInfoCard;
