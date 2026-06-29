"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaCheckCircle, FaFileInvoice, FaEnvelope } from "react-icons/fa";
import { FiPackage, FiTruck, FiShield, FiLogIn, FiX, FiShoppingBag } from "react-icons/fi";
import Contain from "../common/Contain";
import { BASE_URL } from "@/components/utils/baseURL";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import AccountModal from "../frontend/auth/accountModal/AccountModal";

const OrderSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const invoiceId = searchParams.get("invoice_id");
  const isGuest = searchParams.get("guest") === "true";

  const { data: userInfo, refetch: refetchUser } = useUserInfoQuery();
  const isLoggedIn = !!userInfo?.data?._id;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("full");
  const [orderData, setOrderData] = useState(null);
  const [orderProducts, setOrderProducts] = useState([]);
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${BASE_URL}/order/${orderId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data?.success && data?.data?.order) {
          const order = data.data.order;
          setOrderData(order);
          setOrderProducts(data.data.order_products || []);

          // ✅ Unverified হলে localStorage এ save করো banner এর জন্য
          const verified = order?.customer_id?.user_verified;
          const phone = order?.customer_phone;
          if (!verified && phone && !isLoggedIn) {
            localStorage.setItem("unverified_guest_phone", phone);
          }
        }
      } catch {}
    };
    fetchOrder();
  }, [orderId]);

  const customerPhone = orderData?.customer_phone;
  const isVerified = orderData?.customer_id?.user_verified === true;

  // S4+S5 Phase 1C — opt-in email prompt. Shows when neither the
  // logged-in user nor the order has an email yet. Skip-able +
  // dismissible. Hits /user/me/email (logged-in) or /order/:id/email
  // (guest path).
  const userHasEmail = !!userInfo?.data?.user_email;
  const orderHasEmail = !!orderData?.customer_email;
  const emailAlreadyPresent = isLoggedIn ? userHasEmail : orderHasEmail;
  const [emailPromptDismissed, setEmailPromptDismissed] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const showEmailPrompt =
    orderData && !emailAlreadyPresent && !emailPromptDismissed && !emailSaved;

  const saveEmailForOrder = async () => {
    const val = (emailValue || "").trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setEmailSaving(true);
    try {
      const url = isLoggedIn
        ? `${BASE_URL}/user/me/email`
        : `${BASE_URL}/order/${orderId}/email`;
      const body = isLoggedIn
        ? { user_email: val }
        : { customer_email: val };
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Thanks! Email saved.", { autoClose: 1200 });
        setEmailSaved(true);
        if (isLoggedIn) refetchUser();
      } else {
        toast.error(data?.message || "Failed to save email.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setEmailSaving(false);
    }
  };

  // ✅ Logic — isGuest URL param independent
  // showSetPassword: order আছে + user unverified + logged in না + modal success না
  const showSetPassword =
    orderData && !isVerified && !isLoggedIn && !successState;

  // showLoginPrompt: order আছে + user verified + logged in না + modal success না
  const showLoginPrompt =
    orderData && isVerified && !isLoggedIn && !successState;

  const handleModalSuccess = () => {
    setSuccessState(true);
    setModalOpen(false);
    refetchUser(); // ✅ user info refresh
    localStorage.removeItem("unverified_guest_phone");
    sessionStorage.removeItem("banner_dismissed");
  };

  return (
    <Contain>
      <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-green-200 opacity-20" style={{ animation: "ping 1s cubic-bezier(0,0,0.2,1) 3" }} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800 text-center">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-500 mb-5 text-center max-w-md text-sm">
          Thank you for your purchase. We'll process your order shortly.
        </p>

        {invoiceId && (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 mb-4">
            <FiPackage size={15} className="text-gray-400" />
            <span className="text-sm text-gray-500">Invoice ID:</span>
            <span className="text-sm font-bold text-gray-800 font-mono">
              {invoiceId}
            </span>
          </div>
        )}

        {/* Order recap — total + item count + COD badge */}
        {orderData && (
          <div className="flex items-center gap-3 flex-wrap justify-center mb-7">
            {orderProducts.length > 0 && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <FiShoppingBag size={13} className="text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">
                  {orderProducts.length} {orderProducts.length === 1 ? "item" : "items"}
                </span>
              </div>
            )}
            {orderData.grand_total_amount != null && (
              <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                <span className="text-sm font-bold text-primary">
                  ৳{orderData.grand_total_amount}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-emerald-700">
                Cash on Delivery
              </span>
            </div>
            {orderData.shipping_location && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <FiTruck size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">{orderData.shipping_location}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Unverified guest: Set Password ─────────────────────────── */}
        {showSetPassword && (
          <div className="bg-gradient-to-br from-primary/5 via-white to-primary/5 border border-primary/15 rounded-2xl p-6 mb-7 max-w-sm w-full">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <FiShield size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-semibold text-sm mb-1">
                  আপনার account তৈরি হয়েছে!
                </p>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                  পাসওয়ার্ড সেট করলে পরবর্তীতে অর্ডার ট্র্যাক করতে ও invoice
                  দেখতে পারবেন।
                </p>
                <button
                  onClick={() => {
                    setModalMode("full");
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                >
                  <FiShield size={13} /> Set Password Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Verified but not logged in: Login ──────────────────────── */}
        {showLoginPrompt && (
          <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-7 max-w-sm w-full">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <FiLogIn size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-semibold text-sm mb-1">
                  আপনার account আছে!
                </p>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                  Login করুন order track করতে এবং invoice দেখতে।
                </p>
                <button
                  onClick={() => {
                    setModalMode("login");
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                >
                  <FiLogIn size={13} /> Login Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── After modal success ──────────────────────────────────────── */}
        {successState && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 max-w-sm w-full">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-xl shrink-0" />
              <p className="text-green-800 font-semibold text-sm">
                Logged in successfully! Now you can track your order.
              </p>
            </div>
          </div>
        )}

        {/* Phase 1C — opt-in email prompt. Skip-able + dismissible. */}
        {showEmailPrompt && (
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 border border-amber-200 rounded-2xl p-5 mb-7 max-w-md w-full relative">
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setEmailPromptDismissed(true)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <FiX size={16} />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <FaEnvelope size={14} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-semibold text-sm mb-1">
                  Want a receipt + tracking link?
                </p>
                <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                  Add your email — we'll send the invoice + courier updates.
                  Optional, you can skip.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={120}
                    className="border px-3 py-2 text-sm rounded outline-amber-500 flex-1 min-w-[180px]"
                  />
                  <button
                    type="button"
                    onClick={saveEmailForOrder}
                    disabled={emailSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    {emailSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {emailSaved && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 max-w-md w-full">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-xl shrink-0" />
              <p className="text-green-800 font-semibold text-sm">
                Email saved. We'll send your invoice + tracking shortly.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={`/orders/${orderId}`}>
            <Button className="flex items-center gap-2">
              <FaFileInvoice size={14} /> View Invoice
            </Button>
          </Link>

          {(isLoggedIn || successState) && (
            <Link href="/user-profile?tab=purchase-history">
              <Button variant="outline">View All Orders</Button>
            </Link>
          )}
          <Link href={`/orders/order-tracking/${invoiceId}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <FiTruck size={14} /> Track Order
            </Button>
          </Link>
          <Button
            className="bg-secondary hover:bg-red-500 text-white"
            onClick={() => router.push("/")}
          >
            Go to Home
          </Button>
        </div>
      </div>

      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        userPhone={customerPhone}
        userName={orderData?.user_name || orderData?.customer_name}
        orderId={orderId}
        onSuccess={handleModalSuccess}
      />
    </Contain>
  );
};

export default OrderSuccessContent;
