import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { BASE_URL } from "../../utils/baseURL";
import TableLoadingSkeleton from "../../components/common/loadingSkeleton/TableLoadingSkeleton";
import Pagination from "../../components/common/pagination/Pagination";
import PrintableInvoice from "../../components/common/printableInvoice/PrintableInvoice";
import { SettingContext } from "../../context/SettingProvider";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import PendingRow from "../../components/Order/PendingRow";

import SteadfastRow from "../../components/Order/SteadfastRow";
import PathaoRow from "../../components/Order/PathaoRow";
import DefaultRow from "../../components/Order/DefaultRow";
import {
  isCourierLocked,
  tabHintForStatus,
} from "../../components/Order/orderStatus.constants";

const TABS = [
  { label: "Pending", value: "pending" },
  { label: "Steadfast", value: "steadfast" },
  { label: "Pathao", value: "pathao" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "All", value: "all" },
  // D18 M3 — POS Orders filter tab
  { label: "POS Orders", value: "pos" },
  // Order Unification Phase A — order_type filter (Phase B fills this with
  // merged offer/bundle orders; today it just filters order_type=offer).
  { label: "Offer Orders", value: "offer" },
];

const STEADFAST_SUB_TABS = [
  { label: "All", value: "all" },
  { label: "In Review", value: "in_review" },
  { label: "Pending", value: "pending" },
  { label: "Hold", value: "hold" },
  { label: "Delivered", value: "delivered" },
  { label: "Partial Delivered", value: "partial_delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Unknown", value: "unknown" },
];

const PATHAO_SUB_TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Pickup Requested", value: "Pickup Requested" },
  { label: "In Transit", value: "In Transit" },
  { label: "Out for Delivery", value: "Out for Delivery" },
  { label: "Delivered", value: "Delivered" },
  { label: "Pickup Cancel", value: "Pickup Cancel" },
  { label: "Return", value: "Return" },
  { label: "Delivery Failed", value: "Delivery Failed" },
];

const STEADFAST_CANCEL_BLOCKED = [
  "delivered_approval_pending",
  "partial_delivered_approval_pending",
  "cancelled_approval_pending",
  "unknown_approval_pending",
  "delivered",
  "partial_delivered",
  "cancelled",
  "unknown",
  "hold",
];

// Pending tab এ checkbox আছে, Pathao tab এ নেই
const PENDING_HEAD = [
  "",
  "SL",
  "Print",
  "Invoice",
  "Customer",
  "Phone",
  "Grand Total",
  "Address",
  "Date",
  "Status",
  "Send Courier",
  "Cancel",
  "Fraud",
  "Details",
];
const STEADFAST_HEAD = [
  "SL",
  "Invoice",
  "Customer",
  "Phone",
  "Tracking Code",
  "Consignment ID",
  "Steadfast Status",
  "Grand Total",
  "Date",
  "Sync",
  "Cancel",
  "Details",
];
const PATHAO_HEAD = [
  "SL",
  "Invoice",
  "Customer",
  "Phone",
  "Tracking Code",
  "Consignment ID",
  "Pathao Status",
  "Grand Total",
  "Date",
  "Sync",
  "Cancel",
  "Details",
];
// Column count MUST match the <td> count in DefaultRow — the row renders every
// cell unconditionally (empty actions show a "—") precisely so head and body
// can never drift apart.
const DEFAULT_HEAD = [
  "SL",
  "Invoice",
  "Customer",
  "Phone",
  "Order Status",
  "Courier",
  "Grand Total",
  "Date",
  "Send Courier",
  "Cancel",
  "Print",
  "Fraud",
  "Details",
];

const OrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "pending",
  );
  const [steadfastSubTab, setSteadfastSubTab] = useState(
    searchParams.get("sub") || "all",
  );
  const [pathaoSubTab, setPathaoSubTab] = useState(
    searchParams.get("sub") || "all",
  );

  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [syncingOrderId, setSyncingOrderId] = useState(null);

  // Pending tab এ selected orders — Steadfast বা Pathao যেকোনোটায় পাঠানো যাবে
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkSteadfastLoading, setBulkSteadfastLoading] = useState(false);
  const [bulkPathaoLoading, setBulkPathaoLoading] = useState(false);
  const [bulkSyncLoading, setBulkSyncLoading] = useState(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);

  const { user, loading } = useContext(AuthContext);
  const { settingData } = useContext(SettingContext);

  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => {
    setSearchTerm(searchText);
    setPage(1);
  }, [searchText]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchValue("");
    setSearchTerm("");
    setSteadfastSubTab("all");
    setPathaoSubTab("all");
    setSelectedOrders([]);
    setSearchParams({ tab });
  };

  const buildApiUrl = () => {
    const base = `${BASE_URL}/order`;
    const common = `page=${page}&limit=${limit}&searchTerm=${searchTerm}`;
    if (activeTab === "steadfast")
      return `${base}/steadfast?${common}&steadfast_status=${steadfastSubTab}`;
    if (activeTab === "pathao")
      return `${base}/pathao?${common}&pathao_status=${pathaoSubTab}`;
    if (activeTab === "all") return `${base}/dashboard?${common}`;
    if (activeTab === "delivered")
      return `${base}/dashboard?${common}&order_status=delivered`;
    if (activeTab === "cancelled")
      return `${base}/dashboard?${common}&order_status=cancel`;
    // D18 M3 — POS Orders: dedicated order_source filter
    if (activeTab === "pos")
      return `${base}/dashboard?${common}&order_source=admin`;
    // Order Unification Phase A — Offer Orders: order_type filter
    if (activeTab === "offer")
      return `${base}/dashboard?${common}&order_type=offer`;
    return `${base}/dashboard?${common}&order_status=pending`;
  };

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "orders",
      activeTab,
      steadfastSubTab,
      pathaoSubTab,
      page,
      limit,
      searchTerm,
    ],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(), { credentials: "include" });
      return res.json();
    },
  });

  const orders = ordersData?.data || [];
  const totalData = ordersData?.totalData || 0;

  // Pending tab checkbox
  const handleSelectOrder = (id) =>
    setSelectedOrders((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const handleSelectAll = () =>
    setSelectedOrders(
      selectedOrders.length === orders.length ? [] : orders.map((o) => o._id),
    );

  const handlePrintClick = async (order) => {
    try {
      const res = await fetch(`${BASE_URL}/order/admin/${order._id}`, {
        credentials: "include",
      });
      const result = await res.json();
      if (result?.statusCode === 200) {
        setSelectedOrder(result?.data?.order);
        setSelectedOrderProducts(result?.data?.order_products);
        setPrintModalOpen(true);
      }
    } catch {
      toast.error("Failed to fetch order details");
    }
  };

  // ── Single send ───────────────────────────────────────────
  const handleSendToSteadfast = async (order) => {
    const ok = await Swal.fire({
      title: "Steadfast এ পাঠাবেন?",
      text: `Invoice: ${order?.invoice_id}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes!",
    });
    if (!ok.isConfirmed) return;
    try {
      setLoadingOrderId(order._id);
      const res = await fetch(
        `${BASE_URL}/courier/steadfast/send/${order._id}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (data?.success) {
        toast.success(`Sent! Tracking: ${data?.data?.tracking_code || ""}`);
        refetch();
      } else throw new Error(data?.message || "Failed!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleSendToPathao = async (order) => {
    const ok = await Swal.fire({
      title: "Pathao তে পাঠাবেন?",
      text: `Invoice: ${order?.invoice_id}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes!",
    });
    if (!ok.isConfirmed) return;
    try {
      setLoadingOrderId(order._id);
      const res = await fetch(`${BASE_URL}/courier/pathao/send/${order._id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(`Sent! Consignment: ${data?.data?.consignment_id || ""}`);
        refetch();
      } else throw new Error(data?.message || "Failed!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingOrderId(null);
    }
  };

  // ── Bulk send — Pending tab ───────────────────────────────
  const handleBulkSendToSteadfast = async () => {
    if (!selectedOrders.length) {
      toast.warning("কোনো order select করা হয়নি।");
      return;
    }
    const ok = await Swal.fire({
      title: `${selectedOrders.length} টা order Steadfast এ পাঠাবেন?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, send all!",
    });
    if (!ok.isConfirmed) return;
    try {
      setBulkSteadfastLoading(true);
      const res = await fetch(`${BASE_URL}/courier/steadfast/bulk-send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: selectedOrders }),
      });
      const data = await res.json();
      if (data?.success) {
        const { success, failed } = data?.data || {};
        Swal.fire({
          title: "Steadfast Bulk Complete!",
          html: `✅ সফল: <b>${success?.length || 0}</b><br/>❌ ব্যর্থ: <b>${failed?.length || 0}</b>`,
          icon: failed?.length > 0 ? "warning" : "success",
        });
        setSelectedOrders([]);
        refetch();
      } else throw new Error(data?.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBulkSteadfastLoading(false);
    }
  };

  const handleBulkSendToPathao = async () => {
    if (!selectedOrders.length) {
      toast.warning("কোনো order select করা হয়নি।");
      return;
    }
    const ok = await Swal.fire({
      title: `${selectedOrders.length} টা order Pathao তে পাঠাবেন?`,
      html: `<p class="text-sm text-gray-500 mt-1">⚠️ প্রতিটা order একটা একটা করে পাঠানো হবে, একটু সময় লাগতে পারে।</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, send all!",
    });
    if (!ok.isConfirmed) return;
    try {
      setBulkPathaoLoading(true);
      const res = await fetch(`${BASE_URL}/courier/pathao/bulk-send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: selectedOrders }),
      });
      const data = await res.json();
      if (data?.success) {
        const { success, failed } = data?.data || {};
        Swal.fire({
          title: "Pathao Bulk Send!",
          html: `✅ সফল: <b>${success?.length || 0}</b><br/>❌ ব্যর্থ: <b>${failed?.length || 0}</b>${failed?.length > 0 ? `<br/><small style="color:red">${failed.map((f) => f.reason).join(", ")}</small>` : ""}<br/><small>Consignment ID পেতে কিছুক্ষণ পর Pathao tab এ Sync করুন।</small>`,
          icon: failed?.length > 0 ? "warning" : "success",
        });
        setSelectedOrders([]);
        refetch();
      } else throw new Error(data?.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBulkPathaoLoading(false);
    }
  };

  // ── Sync ─────────────────────────────────────────────────
  const handleBulkSyncPathao = async () => {
    const ok = await Swal.fire({
      title: "সব Pathao order Sync করবেন?",
      html: `<p class="text-sm text-gray-500 mt-1">Consignment ID আছে এমন সব active Pathao order এর status Pathao থেকে update হবে।</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Sync All!",
    });
    if (!ok.isConfirmed) return;
    try {
      setBulkSyncLoading(true);
      const res = await fetch(`${BASE_URL}/courier/pathao/bulk-sync`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data?.success) {
        const { success, failed, skipped } = data?.data || {};
        Swal.fire({
          title: "Bulk Sync Complete!",
          html: `✅ Synced: <b>${success?.length || 0}</b><br/>❌ Failed: <b>${failed?.length || 0}</b><br/>⏭️ Skipped (no consignment): <b>${skipped?.length || 0}</b>`,
          icon: failed?.length > 0 ? "warning" : "success",
        });
        refetch();
      } else throw new Error(data?.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBulkSyncLoading(false);
    }
  };

  const handleSyncSteadfast = async (order) => {
    try {
      setSyncingOrderId(order._id);
      const res = await fetch(
        `${BASE_URL}/courier/steadfast/sync/${order._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (data?.success) {
        toast.success(
          `Synced! Steadfast Status: ${data?.data?.steadfast_status} → DB Status: ${data?.data?.order_status}`,
        );
        refetch();
      } else throw new Error(data?.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleSyncPathao = async (order) => {
    try {
      setSyncingOrderId(order._id);
      const res = await fetch(`${BASE_URL}/courier/pathao/sync/${order._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(`Synced! → ${data?.data?.pathao_status}`);
        refetch();
      } else throw new Error(data?.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncingOrderId(null);
    }
  };

  // ── Status change (Order List) ────────────────────────────
  // Mirrors ViewAllOrderInfo.handleStatusChange so advancing an order from the
  // list behaves exactly like advancing it from the detail page. Previously the
  // list could ONLY cancel, so every confirm/process/ship step forced a trip
  // into the detail page and back.
  //
  // The backend stamps every *_time field, restocks on cancel/return and fires
  // the confirm SMS, so this only has to send { _id, order_status } (+ reason).
  const handleStatusChange = async (order, nextStatus) => {
    if (!nextStatus || nextStatus === order?.order_status) return;

    // Courier already holds the parcel → cancelling/returning here would
    // restock goods that never came back. Use the courier flow instead.
    if (
      (nextStatus === "cancel" || nextStatus === "return") &&
      isCourierLocked(order)
    ) {
      Swal.fire(
        "Cannot change status here",
        `This order is already with the courier (${order?.courier_type}). Use the ${order?.courier_type} tab to cancel or handle the return.`,
        "warning",
      );
      return;
    }

    const sendData = { _id: order._id, order_status: nextStatus };

    // Same reason prompt as the detail page — without it, a cancel made from
    // the list would lose the "why", and the two paths would disagree.
    if (nextStatus === "cancel" || nextStatus === "return") {
      const isCancel = nextStatus === "cancel";
      const { value: reason, isDismissed } = await Swal.fire({
        title: isCancel ? "Cancel order?" : "Mark as returned?",
        html: `<p>Invoice: <strong>${order?.invoice_id}</strong></p>`,
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
      if (reason) sendData[isCancel ? "cancel_reason" : "return_reason"] = reason;
    }

    try {
      setLoadingOrderId(order._id);
      const res = await fetch(`${BASE_URL}/order`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });
      const data = await res.json();
      if (data?.success || data?.statusCode === 200) {
        // The row leaves the current tab the moment its status changes, which
        // reads as "my order vanished" — so say where it went.
        const hint = tabHintForStatus(nextStatus);
        toast.success(
          `${order?.invoice_id} → ${nextStatus}` +
            (hint && activeTab !== hint.toLowerCase()
              ? ` (now in "${hint}" tab)`
              : ""),
        );
        refetch();
      } else {
        throw new Error(data?.message || "Status update failed");
      }
    } catch (e) {
      toast.error(e.message || "Status update failed");
    } finally {
      setLoadingOrderId(null);
    }
  };

  // ── Cancel ────────────────────────────────────────────────
  const handleCancelOrder = async (order) => {
    const isSteadfastSent =
      order?.courier_type === "steadfast" && order?.steadfast_consignment_id;
    const isPathaoSent =
      order?.courier_type === "pathao" && order?.consignment_id;
    const isPathaoPending =
      order?.courier_type === "pathao" && order?.pathao_status === "Pending";

    // Steadfast block check
    if (
      order?.courier_type === "steadfast" &&
      STEADFAST_CANCEL_BLOCKED.includes(order?.steadfast_status)
    ) {
      Swal.fire(
        "Cannot Cancel!",
        `Order is already "${order?.steadfast_status}" in Steadfast.`,
        "error",
      );
      return;
    }

    // Pathao — Pending না হলে API কাজ করবে না, warning দাও
    if (isPathaoSent && !isPathaoPending) {
      const ok = await Swal.fire({
        title: "Cancel করবেন?",
        html: `<p>Invoice: <strong>${order?.invoice_id}</strong></p>
               <p class="text-sm mt-2">⚠️ Pathao status <b>"${order?.pathao_status}"</b> — API দিয়ে cancel হবে না।<br/>
               <a href="https://merchant.pathao.com" target="_blank" style="color:blue;text-decoration:underline">Pathao Portal</a> থেকে manually cancel করুন।<br/>
               Consignment ID: <b>${order?.consignment_id}</b></p>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "DB তে Cancel করো",
        cancelButtonText: "না",
      });
      if (!ok.isConfirmed) return;
      // শুধু DB update করো
      try {
        setLoadingOrderId(order._id);
        const cancelTime =
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toLocaleTimeString();
        const res = await fetch(`${BASE_URL}/order`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: order._id,
            order_status: "cancel",
            cancel_time: cancelTime,
            order_updated_by: user?._id,
          }),
        });
        const data = await res.json();
        if (data?.statusCode === 200) {
          toast.success("DB তে Cancel হয়েছে!");
          refetch();
        } else throw new Error(data?.message);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoadingOrderId(null);
      }
      return;
    }

    let html = `<p>Invoice: <strong>${order?.invoice_id}</strong></p>`;
    if (isPathaoPending)
      html += `<p class="text-sm mt-2 text-green-600">✅ Pathao API দিয়ে cancel হবে।</p>`;
     if (isSteadfastSent)
      html += `<p class="text-sm text-gray-500 mt-2">⚠️ এই order Steadfast এ পাঠানো হয়েছে (${order?.steadfast_status}).<br/>Database এ cancel হবে, Steadfast portal এ manually cancel করতে হতে পারে।</p>`;

    const ok = await Swal.fire({
      title: "Cancel করবেন?",
      html,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Cancel!",
      cancelButtonText: "No",
    });
    if (!ok.isConfirmed) return;

    try {
      setLoadingOrderId(order._id);

      // Steadfast cancel
      if (order?.courier_type === "steadfast") {
        const res = await fetch(
          `${BASE_URL}/order/steadfast/cancel/${order._id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data = await res.json();
        if (data?.success) {
          order?.steadfast_status === "pending"
            ? Swal.fire({
                title: "DB তে Cancel হয়েছে!",
                html: `⚠️ <a href="https://portal.packzy.com" target="_blank" style="color:blue;text-decoration:underline">Steadfast Portal</a> এ manually cancel করুন।<br/>Consignment ID: <b>${order?.steadfast_consignment_id}</b>`,
                icon: "warning",
              })
            : toast.success(data?.message || "Cancelled!");
          refetch();
        } else throw new Error(data?.message);
        return;
      }

      // Pathao Pending → API দিয়ে cancel
      if (isPathaoPending) {
        const res = await fetch(
          `${BASE_URL}/courier/pathao/cancel/${order._id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );
        const data = await res.json();
        if (data?.success) {
          toast.success("Pathao তে Order Cancel সফল!");
          refetch();
        } else throw new Error(data?.message);
        return;
      }

      // Normal cancel (no courier)
      const cancelTime =
        new Date().toISOString().split("T")[0] +
        " " +
        new Date().toLocaleTimeString();
      const res = await fetch(`${BASE_URL}/order`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: order._id,
          order_status: "cancel",
          cancel_time: cancelTime,
          order_updated_by: user?._id,
        }),
      });
      const data = await res.json();
      if (data?.statusCode === 200) {
        toast.success("Order Cancel হয়েছে!");
        refetch();
      } else throw new Error(data?.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingOrderId(null);
    }
  };

  if (!user?.role_id?.order_show)
    return (
      <div className="flex items-center justify-center h-40 text-red-500 font-medium">
        Access Denied!
      </div>
    );

  // ── Table head ────────────────────────────────────────────
  const getHead = () => {
    const heads =
      activeTab === "pending"
        ? PENDING_HEAD
        : activeTab === "steadfast"
          ? STEADFAST_HEAD
          : activeTab === "pathao"
            ? PATHAO_HEAD
            : DEFAULT_HEAD;

    return (
      <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
        {heads.map((h, i) => (
          <td key={i} className="whitespace-nowrap p-4">
            {h === "" && activeTab === "pending" ? (
              <input
                type="checkbox"
                checked={
                  selectedOrders.length === orders.length && orders.length > 0
                }
                onChange={handleSelectAll}
                className="cursor-pointer"
              />
            ) : (
              h
            )}
          </td>
        ))}
      </tr>
    );
  };

  // ── Table row ─────────────────────────────────────────────
  const getRow = (order, index) => {
    const common = {
      order,
      index,
      page,
      limit,
      loadingOrderId,
      canUpdate: !!user?.role_id?.order_update,
    };
    if (activeTab === "pending")
      return (
        <PendingRow
          key={order._id}
          {...common}
          selected={selectedOrders.includes(order._id)}
          onSelect={handleSelectOrder}
          onPrint={handlePrintClick}
          onSendPathao={handleSendToPathao}
          onSendSteadfast={handleSendToSteadfast}
          onCancel={handleCancelOrder}
          onStatusChange={handleStatusChange}
        />
      );
    if (activeTab === "steadfast")
      return (
        <SteadfastRow
          key={order._id}
          {...common}
          onSync={handleSyncSteadfast}
          onCancel={handleCancelOrder}
          syncingOrderId={syncingOrderId}
        />
      );
    if (activeTab === "pathao")
      return (
        <PathaoRow
          key={order._id}
          {...common}
          onSync={handleSyncPathao}
          onCancel={handleCancelOrder}
          syncingOrderId={syncingOrderId}
        />
      );
    return (
      <DefaultRow
        key={order._id}
        {...common}
        onStatusChange={handleStatusChange}
        onCancel={handleCancelOrder}
        onPrint={handlePrintClick}
        onSendPathao={handleSendToPathao}
        onSendSteadfast={handleSendToSteadfast}
      />
    );
  };

  return (
    <div className="bg-white rounded py-6 px-4 shadow">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h1 className="text-2xl font-semibold">Order List</h1>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by Invoice No..."
          className="w-full sm:w-[300px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-2 mb-3 border-b pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${activeTab === tab.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Steadfast Sub-Tabs */}
      {activeTab === "steadfast" && (
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b">
          {STEADFAST_SUB_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSteadfastSubTab(tab.value);
                setPage(1);
                setSearchParams({ tab: activeTab, sub: tab.value });
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${steadfastSubTab === tab.value ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-300 hover:border-red-400"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Pathao Sub-Tabs + Bulk Sync */}
      {activeTab === "pathao" && (
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b">
          {PATHAO_SUB_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setPathaoSubTab(tab.value);
                setPage(1);
                setSearchParams({ tab: activeTab, sub: tab.value });
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${pathaoSubTab === tab.value ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto">
            <button
              onClick={handleBulkSyncPathao}
              disabled={bulkSyncLoading}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white border-indigo-500 transition-all"
            >
              {bulkSyncLoading ? "Syncing..." : "🔄 Sync All"}
            </button>
          </div>
        </div>
      )}

      {/* Pending tab — Bulk send bar (Steadfast + Pathao দুটো option) */}
      {activeTab === "pending" && selectedOrders.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedOrders.length} টা order selected
          </span>
          <button
            onClick={handleBulkSendToSteadfast}
            disabled={bulkSteadfastLoading || bulkPathaoLoading}
            className="h-[32px] rounded-lg px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-medium"
          >
            {bulkSteadfastLoading ? "Sending..." : "Bulk Send → Steadfast"}
          </button>
          <button
            onClick={handleBulkSendToPathao}
            disabled={bulkSteadfastLoading || bulkPathaoLoading}
            className="h-[32px] rounded-lg px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium"
          >
            {bulkPathaoLoading ? "Sending..." : "Bulk Send → Pathao"}
          </button>
          <button
            onClick={() => setSelectedOrders([])}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {isLoading || loading ? (
        <TableLoadingSkeleton />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No orders found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded">
          <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
            <thead className="bg-[#fff9ee]">{getHead()}</thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {orders.map((order, index) => getRow(order, index))}
            </tbody>
          </table>
        </div>
      )}

      {totalData > 10 && (
        <Pagination
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          totalData={totalData}
        />
      )}

      {printModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
            <PrintableInvoice
              order={selectedOrder}
              orderProducts={selectedOrderProducts}
              settingData={settingData}
            />
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
