import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../utils/baseURL";
import { LoaderOverlay } from "../common/loader/LoderOverley";
import { DateFormate } from "../../utils/DateFormate/DateFormate";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { FiRefreshCw, FiExternalLink, FiEdit2, FiX } from "react-icons/fi";
import {
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPrint,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthProvider";
import PaymentInfoCard from "./PaymentInfoCard";
import PrintLabel from "../common/printLabel/PrintLabel";

const STEADFAST_STATUS_COLOR = {
  delivered: "bg-green-100 text-green-700 border-green-200",
  partial_delivered: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  in_review: "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  hold: "bg-purple-100 text-purple-700 border-purple-200",
  delivered_approval_pending: "bg-green-50 text-green-600 border-green-100",
  partial_delivered_approval_pending:
    "bg-yellow-50 text-yellow-600 border-yellow-100",
  cancelled_approval_pending: "bg-red-50 text-red-600 border-red-100",
  unknown_approval_pending: "bg-gray-50 text-gray-500 border-gray-100",
  unknown: "bg-gray-100 text-gray-600 border-gray-200",
};

const PATHAO_STATUS_COLOR = {
  Delivered: "bg-green-100 text-green-700 border-green-200",
  "Partial Delivery": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
  "In Transit": "bg-purple-100 text-purple-700 border-purple-200",
  "Out for Delivery": "bg-orange-100 text-orange-700 border-orange-200",
  Return: "bg-red-50 text-red-500 border-red-100",
  "Delivery Failed": "bg-red-50 text-red-500 border-red-100",
  "On Hold": "bg-purple-50 text-purple-500 border-purple-100",
  "Pickup Requested": "bg-blue-100 text-blue-700 border-blue-200",
};

const ORDER_STATUS_COLOR = {
  pending: "bg-orange-100 text-orange-700",
  on_hold: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-teal-100 text-teal-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancel: "bg-red-100 text-red-700",
  return: "bg-rose-100 text-rose-700",
};

// ── Delivery Info Edit Modal ──────────────────────────────────────────────────
const DeliveryInfoModal = ({ order, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    delivery_name: order?.delivery_name ?? order?.customer_id?.user_name ?? "",
    delivery_phone: order?.delivery_phone ?? order?.customer_phone ?? "",
    delivery_alt_phone: order?.delivery_alt_phone ?? "",
    delivery_address: order?.delivery_address ?? order?.billing_address ?? "",
    delivery_note: order?.delivery_note ?? "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.delivery_phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!form.delivery_address.trim()) {
      toast.error("Address is required");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${BASE_URL}/order/delivery-info/${order._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Delivery info updated!");
        onSuccess();
        onClose();
      } else {
        throw new Error(data?.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-800">Edit Delivery Info</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Invoice: {order?.invoice_id} — এই info courier এ পাঠানো হবে
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Recipient Name
            </label>
            <input
              type="text"
              name="delivery_name"
              value={form.delivery_name}
              onChange={handleChange}
              placeholder="Customer name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="delivery_phone"
              value={form.delivery_phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Alternative Phone
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              name="delivery_alt_phone"
              value={form.delivery_alt_phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="delivery_address"
              value={form.delivery_address}
              onChange={handleChange}
              rows={2}
              placeholder="Full delivery address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Delivery Note
              <span className="text-gray-400 font-normal ml-1">
                (optional — courier instruction)
              </span>
            </label>
            <input
              type="text"
              name="delivery_note"
              value={form.delivery_note}
              onChange={handleChange}
              placeholder="e.g. Call before delivery"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Info note */}
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-3 py-2">
            ⚠️ Original order data পরিবর্তন হবে না। Courier এ পাঠানোর সময় এই
            info use হবে।
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Admin Notes Card (Order Unification Phase A) ──────────────────────────────
// Shows the admin-only internal_note (editable) + read-only cancel/return reason
// when present. internal_note is stripped from all public/customer responses BE-
// side, so it is safe to show only here on the admin order-detail page.
const AdminNotesCard = ({ order, refetch }) => {
  const [note, setNote] = useState(order?.internal_note ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${BASE_URL}/order`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: order?._id, internal_note: note }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Internal note saved");
        refetch();
      } else throw new Error(data?.message || "Save failed");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 shadow rounded p-5 space-y-4">
      <h3 className="font-semibold text-gray-700">Admin Notes</h3>

      {(order?.cancel_reason || order?.return_reason) && (
        <div className="space-y-2">
          {order?.cancel_reason && (
            <div className="bg-red-50 border border-red-100 rounded px-3 py-2">
              <p className="text-xs font-semibold text-red-500 uppercase mb-0.5">
                Cancel Reason
              </p>
              <p className="text-sm text-gray-700">{order.cancel_reason}</p>
            </div>
          )}
          {order?.return_reason && (
            <div className="bg-rose-50 border border-rose-100 rounded px-3 py-2">
              <p className="text-xs font-semibold text-rose-500 uppercase mb-0.5">
                Return Reason
              </p>
              <p className="text-sm text-gray-700">{order.return_reason}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">
          Internal Note (admin only — customer never sees this)
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. customer asked to deliver after 6pm; fraud-checked OK"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blueColor resize-y"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSave}
            disabled={saving || note === (order?.internal_note ?? "")}
            className="px-4 py-1.5 bg-blueColor text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
// Forward / terminal status options from the current status. MUST stay in sync
// with ALLOWED_STATUS_TRANSITIONS in backend order.service.ts (the server is
// the real guard; this just drives the dropdown UI).
const NEXT_STATUS_OPTIONS = {
  pending: ["on_hold", "confirmed", "cancel"],
  on_hold: ["confirmed", "cancel"],
  confirmed: ["processing", "cancel"],
  processing: ["shipped", "cancel"],
  shipped: ["delivered", "return"],
  delivered: ["completed", "return"],
  completed: [],
  cancel: [],
  return: [],
};

const ViewAllOrderInfo = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [syncing, setSyncing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false); // ✅ নতুন
  // Phase D Bug #3 — per-line print label modal target. `null` = closed.
  const [labelLine, setLabelLine] = useState(null);

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`/api/v1/order/${id}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/order/${id}`, {
        credentials: "include",
      });
      return res.json();
    },
  });

  if (isLoading) return <LoaderOverlay />;

  const order = orders?.data?.order;
  const orderProducts = orders?.data?.order_products;
  const isSteadfast = order?.courier_type === "steadfast";
  const isPathao = order?.courier_type === "pathao";

  // Delivery info — override থাকলে সেটা, না থাকলে original
  const effectiveName =
    order?.delivery_name || order?.customer_id?.user_name || "—";
  const effectivePhone = order?.delivery_phone || order?.customer_phone || "—";
  const effectiveAddress =
    order?.delivery_address || order?.billing_address || "—";
  const hasOverride =
    order?.delivery_name ||
    order?.delivery_phone ||
    order?.delivery_address ||
    order?.delivery_alt_phone ||
    order?.delivery_note;

  const handleSync = async () => {
    try {
      setSyncing(true);
      const url = isSteadfast
        ? `${BASE_URL}/courier/steadfast/sync/${id}`
        : `${BASE_URL}/courier/pathao/sync/${id}`;
      const res = await fetch(url, { method: "PATCH", credentials: "include" });
      const data = await res.json();
      if (data?.success) {
        toast.success(`Synced! → ${data?.data?.order_status}`);
        refetch();
      } else throw new Error(data?.message);
    } catch (err) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // A2.2 — advance the order status. Forward transitions just PATCH; cancel /
  // return ask for a reason first. Server validates the transition (A2.3), so a
  // bad jump is rejected even if the UI somehow offers it.
  const handleStatusChange = async (nextStatus) => {
    if (!nextStatus || nextStatus === order?.order_status) return;

    const sendData = { _id: id, order_status: nextStatus };

    // Don't let an order already handed to a courier be cancelled OR returned
    // here — the courier still has the parcel, and restocking now would drift
    // inventory. Use the courier cancel/sync flow instead.
    const courierLocked =
      (order?.courier_type === "steadfast" && order?.steadfast_consignment_id) ||
      (order?.courier_type === "pathao" && order?.consignment_id);
    if ((nextStatus === "cancel" || nextStatus === "return") && courierLocked) {
      Swal.fire(
        "Cannot change status here",
        `This order is already with the courier (${order?.courier_type}). Use the courier flow to cancel or handle the return.`,
        "warning",
      );
      return;
    }

    if (nextStatus === "cancel" || nextStatus === "return") {
      const isCancel = nextStatus === "cancel";
      const { value: reason, isDismissed } = await Swal.fire({
        title: isCancel ? "Cancel order?" : "Mark as returned?",
        input: "textarea",
        inputLabel: isCancel
          ? "Reason for cancellation (optional)"
          : "Reason for return (optional)",
        inputPlaceholder: isCancel
          ? "e.g. customer requested / out of stock / fraud"
          : "e.g. wrong item / damaged / customer changed mind",
        showCancelButton: true,
        confirmButtonText: isCancel ? "Confirm Cancel" : "Confirm Return",
        confirmButtonColor: "#d33",
      });
      if (isDismissed) return;
      if (reason) {
        sendData[isCancel ? "cancel_reason" : "return_reason"] = reason;
      }
    }

    try {
      setStatusUpdating(true);
      const res = await fetch(`${BASE_URL}/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sendData),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(`Status updated → ${nextStatus}`);
        refetch();
      } else {
        throw new Error(data?.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.message || "Status update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  const nextOptions = NEXT_STATUS_OPTIONS[order?.order_status] ?? [];
  const canUpdateStatus = user?.role_id?.order_update === true;

  return (
    <section className="max-w-6xl mx-auto space-y-4 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-[#fff9ee] px-5 py-3 shadow rounded">
        <div>
          <p className="text-lg font-semibold text-gray-800">Order Details</p>
          <p className="text-xs text-gray-400">Invoice: {order?.invoice_id}</p>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_COLOR[order?.order_status] || "bg-gray-100 text-gray-600"}`}
          >
            {order?.order_status}
          </span>
          {/* A2.2 — advance order status (forward + cancel/return). Hidden once
              the order reaches a terminal state or for admins without
              order_update. Server validates the transition (A2.3). */}
          {canUpdateStatus && nextOptions.length > 0 && (
            <select
              value=""
              disabled={statusUpdating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white cursor-pointer disabled:opacity-50"
              title="Advance order status"
            >
              <option value="" disabled>
                {statusUpdating ? "Updating…" : "Change status →"}
              </option>
              {nextOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          {order?.order_type && order?.order_type !== "regular" && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 capitalize">
              {order?.order_type}
            </span>
          )}
          {order?.courier_type && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
              {order?.courier_type}
            </span>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#fff9ee] p-4 shadow rounded">
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
            Billing To
          </p>
          <p className="font-semibold text-gray-800">
            {order?.customer_id?.user_name}
          </p>
          <p className="text-sm text-gray-500">
            {order?.customer_id?.user_phone}
          </p>
          <p className="text-xs text-gray-400 mt-1">{order?.billing_address}</p>
          <p className="text-xs text-gray-400">
            {order?.billing_state}, {order?.billing_city}
          </p>
        </div>
        <div className="bg-[#fff9ee] p-4 shadow rounded">
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
            Invoice
          </p>
          <p className="font-bold text-gray-800 text-lg">{order?.invoice_id}</p>
          <p className="text-xs text-gray-400 mt-1">
            {DateFormate(order?.createdAt)}
          </p>
        </div>
        <div className="bg-[#fff9ee] p-4 shadow rounded">
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
            Shipping
          </p>
          <p className="font-semibold text-gray-800">
            {order?.shipping_location}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Cost: ৳{order?.shipping_cost}
          </p>
        </div>
        <div className="bg-[#fff9ee] p-4 shadow rounded">
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
            Grand Total
          </p>
          <p className="font-bold text-2xl text-gray-800">
            ৳{order?.grand_total_amount}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Sub: ৳{order?.sub_total_amount} | Discount: ৳
            {order?.discount_amount}
            {Number(order?.vat_amount) > 0 && <> | VAT: ৳{order.vat_amount}</>}
          </p>
        </div>
      </div>

      {/* ✅ Delivery Contact Info Card — নতুন */}
      <div className="bg-white border border-gray-200 shadow rounded p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaTruck className="text-gray-500" size={16} />
            <h3 className="font-semibold text-gray-700">
              Delivery Contact Info
            </h3>
            {hasOverride && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                Overridden
              </span>
            )}
          </div>
          <button
            onClick={() => setDeliveryModalOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          >
            <FiEdit2 size={12} />
            Edit Delivery Info
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">
              Recipient Name
            </p>
            <p className="text-sm font-medium text-gray-700">{effectiveName}</p>
            {order?.delivery_name &&
              order?.delivery_name !== order?.customer_id?.user_name && (
                <p className="text-xs text-gray-400 line-through">
                  {order?.customer_id?.user_name}
                </p>
              )}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Phone</p>
            <p className="text-sm font-medium text-gray-700">
              {effectivePhone}
            </p>
            {order?.delivery_phone &&
              order?.delivery_phone !== order?.customer_phone && (
                <p className="text-xs text-gray-400 line-through">
                  {order?.customer_phone}
                </p>
              )}
          </div>
          {order?.delivery_alt_phone && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Alternative Phone
              </p>
              <p className="text-sm font-medium text-gray-700">
                {order?.delivery_alt_phone}
              </p>
            </div>
          )}
          <div className="col-span-2 sm:col-span-2">
            <p className="text-xs text-gray-400 font-medium mb-1">
              Delivery Address
            </p>
            <p className="text-sm font-medium text-gray-700">
              {effectiveAddress}
            </p>
            {order?.delivery_address &&
              order?.delivery_address !== order?.billing_address && (
                <p className="text-xs text-gray-400 line-through">
                  {order?.billing_address}
                </p>
              )}
          </div>
          {order?.delivery_note && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Delivery Note
              </p>
              <p className="text-sm text-gray-700 italic">
                &quot;{order?.delivery_note}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Phase C Payment Info + Admin verify buttons ───────────────────── */}
      <PaymentInfoCard order={order} user={user} refetch={refetch} />

      {/* ── Order Unification Phase A — admin notes + cancel/return reason ─── */}
      <AdminNotesCard order={order} refetch={refetch} />

      {/* Steadfast Info */}
      {isSteadfast && (
        <div className="bg-white border border-orange-100 shadow rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaTruck className="text-orange-500" size={18} />
              <h3 className="font-semibold text-gray-700">
                Steadfast Courier Info
              </h3>
            </div>
            {order?.steadfast_consignment_id && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition"
              >
                <FiRefreshCw
                  size={12}
                  className={syncing ? "animate-spin" : ""}
                />
                {syncing ? "Syncing..." : "Sync Status"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Steadfast Status
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${STEADFAST_STATUS_COLOR[order?.steadfast_status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
              >
                {order?.steadfast_status || "-"}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Consignment ID
              </p>
              <p className="text-sm font-mono font-semibold text-gray-700">
                {order?.steadfast_consignment_id || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Tracking Code
              </p>
              <p className="text-sm font-mono font-semibold text-gray-700">
                {order?.steadfast_tracking_code || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Portal</p>
              <a
                href="https://portal.packzy.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                Steadfast Portal <FiExternalLink size={11} />
              </a>
            </div>
          </div>
          {order?.steadfast_tracking_message && (
            <div className="mt-4 bg-orange-50 border border-orange-100 rounded p-3">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Last Tracking Message
              </p>
              <p className="text-sm text-gray-700">
                {order?.steadfast_tracking_message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pathao Info */}
      {isPathao && (
        <div className="bg-white border border-blue-100 shadow rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaTruck className="text-blue-500" size={18} />
              <h3 className="font-semibold text-gray-700">
                Pathao Courier Info
              </h3>
            </div>
            {order?.consignment_id && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition"
              >
                <FiRefreshCw
                  size={12}
                  className={syncing ? "animate-spin" : ""}
                />
                {syncing ? "Syncing..." : "Sync Status"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Pathao Status
              </p>
              {order?.pathao_status ? (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${PATHAO_STATUS_COLOR[order?.pathao_status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                >
                  {order?.pathao_status}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Not synced yet</span>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Consignment ID
              </p>
              <p className="text-sm font-mono font-semibold text-gray-700">
                {order?.consignment_id || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                Tracking Code
              </p>
              <p className="text-sm font-mono font-semibold text-gray-700">
                {order?.tracking_code || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">
                City / Zone
              </p>
              <p className="text-xs text-gray-600 mb-1">
                {order?.pathao_city_name || "-"} /{" "}
                {order?.pathao_zone_name || "-"}
              </p>
              <a
                href="https://merchant.pathao.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                Pathao Portal <FiExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white shadow rounded p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Order Timeline</h3>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Pending",
              time: order?.pending_time,
              icon: <FaClock size={13} />,
            },
            {
              label: "Processing",
              time: order?.processing_time,
              icon: <FaClock size={13} />,
            },
            {
              label: "Shipped",
              time: order?.shipped_time,
              icon: <FaTruck size={13} />,
            },
            {
              label: "Delivered",
              time: order?.delivered_time,
              icon: <FaCheckCircle size={13} />,
            },
            {
              label: "Cancelled",
              time: order?.cancel_time,
              icon: <FaTimesCircle size={13} />,
            },
            {
              label: "Returned",
              time: order?.return_time,
              icon: <FaTimesCircle size={13} />,
            },
          ]
            .filter((s) => s.time)
            .map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 border rounded-lg px-4 py-2"
              >
                <span className="text-gray-400">{s.icon}</span>
                <div>
                  <p className="font-medium text-gray-700 text-xs">{s.label}</p>
                  <p className="text-gray-400 text-xs">{s.time}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Products */}
      <div className="bg-[#fff9ee] shadow rounded overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="font-semibold text-gray-700">Ordered Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white border-b">
              <tr className="text-gray-500 text-center">
                {[
                  "SL",
                  "Image",
                  "Product",
                  "SKU",
                  "Unit Price",
                  "Qty",
                  "Total",
                  "Label",
                ].map((h) => (
                  <th key={h} className="p-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderProducts?.map((product, idx) => {
                // Snapshot SKU is the source of truth (write-once at order
                // placement). Live SKU is the printable-label source.
                const displaySku =
                  product?.variation_sku_snapshot ||
                  product?.product_sku_snapshot ||
                  product?.variation_id?.variation_sku ||
                  product?.product_id?.product_sku;
                return (
                  <tr
                    key={idx}
                    className={`text-center ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="p-4">{idx + 1}</td>
                    <td className="p-4 flex justify-center">
                      <img
                        src={
                          product?.variation_id?.variation_image ||
                          product?.product_id?.main_image
                        }
                        className="w-16 h-14 rounded border object-cover"
                        alt=""
                      />
                    </td>
                    <td className="p-4 text-left min-w-[200px]">
                      <p className="font-medium text-gray-800">
                        {product?.product_id?.product_name}
                      </p>
                      {product?.variation_id && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Variation: {product?.variation_id?.variation_name}
                        </p>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {displaySku ? (
                        <code className="text-xs font-mono text-gray-700 select-all">
                          {displaySku}
                        </code>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      ৳{product?.product_unit_final_price}
                    </td>
                    <td className="p-4 text-gray-700">
                      {product?.product_quantity}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      ৳{product?.product_grand_total_price}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() =>
                          setLabelLine({
                            // ids let PrintLabel call the lazy ensure-image
                            // endpoint when the barcode_image field is null
                            // (Phase 0.5+ Option 1 — images render at print
                            // time, not save time).
                            product_id: product?.product_id?._id,
                            variation_id: product?.variation_id?._id,
                            product_name: product?.product_id?.product_name,
                            variation_name:
                              product?.variation_id?.variation_name,
                            product_sku: product?.product_id?.product_sku,
                            variation_sku:
                              product?.variation_id?.variation_sku,
                            barcode: product?.product_id?.barcode,
                            barcode_image: product?.product_id?.barcode_image,
                            variation_barcode:
                              product?.variation_id?.variation_barcode,
                            variation_barcode_image:
                              product?.variation_id?.variation_barcode_image,
                          })
                        }
                        title="Print sticker label"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        <FaPrint size={11} />
                        Label
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end p-5">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Sub Total</span>
              <span>৳{order?.sub_total_amount}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Discount</span>
              <span>- ৳{order?.discount_amount}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span>৳{order?.shipping_cost}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 border-t pt-2 text-base">
              <span>Grand Total</span>
              <span>৳{order?.grand_total_amount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Delivery Info Modal */}
      {deliveryModalOpen && (
        <DeliveryInfoModal
          order={order}
          onClose={() => setDeliveryModalOpen(false)}
          onSuccess={refetch}
        />
      )}

      {/* Phase D Bug #3 — single-line sticker label print modal */}
      {labelLine && (
        <PrintLabel line={labelLine} onClose={() => setLabelLine(null)} />
      )}
    </section>
  );
};

export default ViewAllOrderInfo;
