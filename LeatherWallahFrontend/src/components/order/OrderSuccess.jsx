"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaCheckCircle, FaFileInvoice, FaEnvelope } from "react-icons/fa";
import {
  FiPackage,
  FiTruck,
  FiShield,
  FiLogIn,
  FiX,
  FiShoppingBag,
  FiCheck,
  FiHome,
} from "react-icons/fi";
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
      const body = isLoggedIn ? { user_email: val } : { customer_email: val };
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

  // Right rail shows an account card (set-password / login / confirmed) —
  // the email prompt sits under it so the two never stack into a tall column.
  const showAccountCard = showSetPassword || showLoginPrompt || successState;

  return (
    <Contain>
      <div className="mx-auto w-full max-w-5xl py-6 sm:py-10">
        {/* ── Receipt shell ─────────────────────────────────────────────
            One card, two rails. The left rail is the confirmation + order
            recap; the right rail carries every action. On mobile they stack
            in that same reading order.                                   */}
        <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-12px_rgba(16,24,40,0.12)]">
          <div className="grid md:grid-cols-[1.15fr_1fr]">
            {/* ── Left rail — confirmation + recap ───────────────────── */}
            <div className="relative p-6 sm:p-8">
              {/* soft brand wash behind the checkmark, not a flat block */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/[0.07] blur-2xl"
              />

              <div className="relative">
                <div className="flex items-center gap-3.5">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20">
                    <FiCheck
                      size={22}
                      strokeWidth={3}
                      className="text-primary"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full ring-2 ring-primary/25 motion-safe:animate-[ping_1.4s_cubic-bezier(0,0,0.2,1)_2] motion-reduce:hidden"
                    />
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-[22px] font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl">
                      Order Placed Successfully!
                    </h1>
                    <p className="mt-0.5 text-[13px] text-gray-500">
                      Thank you — we&apos;ll process your order shortly.
                    </p>
                  </div>
                </div>

                {/* Invoice — the one thing people screenshot, so it leads. */}
                {invoiceId && (
                  <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-3">
                    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <FiPackage size={14} className="text-gray-400" />
                      Invoice ID
                    </span>
                    <span className="font-mono text-[15px] font-bold tabular-nums text-gray-900">
                      {invoiceId}
                    </span>
                  </div>
                )}

                {/* Order recap — a definition row reads faster than pills. */}
                {orderData && (
                  <dl className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
                    {orderProducts.length > 0 && (
                      <div className="flex items-center justify-between gap-4 py-2.5">
                        <dt className="flex items-center gap-2 text-[13px] text-gray-500">
                          <FiShoppingBag size={14} className="text-gray-400" />
                          Items
                        </dt>
                        <dd className="text-[13px] font-semibold text-gray-900">
                          {orderProducts.length}{" "}
                          {orderProducts.length === 1 ? "item" : "items"}
                        </dd>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="flex items-center gap-2 text-[13px] text-gray-500">
                        <FiTruck size={14} className="text-gray-400" />
                        Payment
                      </dt>
                      <dd>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Cash on Delivery
                        </span>
                      </dd>
                    </div>

                    {orderData.shipping_location && (
                      <div className="flex items-center justify-between gap-4 py-2.5">
                        <dt className="text-[13px] text-gray-500">Delivery</dt>
                        <dd className="text-right text-[13px] font-medium text-gray-700">
                          {orderData.shipping_location}
                        </dd>
                      </div>
                    )}

                    {orderData.grand_total_amount != null && (
                      <div className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-[13px] font-semibold text-gray-900">
                          Total
                        </dt>
                        <dd className="text-xl font-extrabold tabular-nums tracking-tight text-primary">
                          ৳{orderData.grand_total_amount}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                {/* Reassurance line — fills the rail's tail instead of leaving
                    dead space when the action rail runs longer. */}
                {orderData && (
                  <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                    <FiShield
                      size={13}
                      className="mt-0.5 shrink-0 text-gray-400"
                    />
                    <span>
                      Keep your Invoice ID handy — you can track this order any
                      time, no account needed.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* ── Right rail — actions ───────────────────────────────────
                Perforated divider: vertical on desktop, horizontal on
                mobile — the one detail that makes this read as a receipt. */}
            <div className="relative border-t border-dashed border-gray-200 bg-gray-50/60 p-6 sm:p-8 md:border-l md:border-t-0">
              {/* notches that punch the seam */}
              <span
                aria-hidden="true"
                className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-white md:-top-2.5 md:left-[-11px]"
              />
              <span
                aria-hidden="true"
                className="absolute -right-2.5 -top-2.5 hidden h-5 w-5 rounded-full bg-white md:block md:bottom-[-11px] md:left-[-11px] md:right-auto md:top-auto"
              />

              {/* Account card — set password / login / confirmed */}
              {showSetPassword && (
                <div className="rounded-2xl border border-primary/15 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <FiShield size={16} className="text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-gray-900">
                        Your account has been created!
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Set a password to track your orders and view invoices
                        later.
                      </p>
                      <button
                        onClick={() => {
                          setModalMode("full");
                          setModalOpen(true);
                        }}
                        className="mt-3 inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                      >
                        <FiShield size={13} /> Set Password Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showLoginPrompt && (
                <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <FiLogIn size={16} className="text-blue-600" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-gray-900">
                        You already have an account!
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Log in to track your orders and view invoices.
                      </p>
                      <button
                        onClick={() => {
                          setModalMode("login");
                          setModalOpen(true);
                        }}
                        className="mt-3 inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                      >
                        <FiLogIn size={13} /> Login Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {successState && (
                <div
                  role="status"
                  className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4"
                >
                  <FaCheckCircle className="shrink-0 text-xl text-green-500" />
                  <p className="text-[13px] font-semibold text-green-800">
                    Logged in successfully! Now you can track your order.
                  </p>
                </div>
              )}

              {/* Phase 1C — opt-in email prompt. Skip-able + dismissible. */}
              {showEmailPrompt && (
                <div
                  className={`relative rounded-2xl border border-amber-200 bg-amber-50/70 p-4 ${
                    showAccountCard ? "mt-3" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-label="Dismiss email prompt"
                    onClick={() => setEmailPromptDismissed(true)}
                    className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-amber-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <FiX size={15} />
                  </button>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <FaEnvelope size={13} className="text-amber-600" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor="order-success-email"
                        className="block pr-6 text-[13px] font-semibold text-gray-900"
                      >
                        Want a receipt + tracking link?
                      </label>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Add your email — we&apos;ll send the invoice + courier
                        updates. Optional.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          id="order-success-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={emailValue}
                          onChange={(e) => setEmailValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !emailSaving)
                              saveEmailForOrder();
                          }}
                          placeholder="you@example.com"
                          maxLength={120}
                          className="min-h-[38px] min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                        />
                        <button
                          type="button"
                          onClick={saveEmailForOrder}
                          disabled={emailSaving}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-amber-500 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                        >
                          {emailSaving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {emailSaved && (
                <div
                  role="status"
                  className={`flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 ${
                    showAccountCard ? "mt-3" : ""
                  }`}
                >
                  <FaCheckCircle className="shrink-0 text-xl text-green-500" />
                  <p className="text-[13px] font-semibold text-green-800">
                    Email saved. We&apos;ll send your invoice + tracking
                    shortly.
                  </p>
                </div>
              )}

              {/* ── Actions — one primary, the rest subordinate ─────────── */}
              <div
                className={
                  showAccountCard || showEmailPrompt || emailSaved
                    ? "mt-5 border-t border-gray-200 pt-5"
                    : ""
                }
              >
                <Link href={`/orders/${orderId}`} className="block">
                  <Button className="h-11 w-full gap-2 rounded-xl text-sm font-semibold shadow-sm">
                    <FaFileInvoice size={14} /> View Invoice
                  </Button>
                </Link>

                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <Link
                    href={`/orders/order-tracking/${invoiceId}`}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="h-11 w-full gap-2 rounded-xl bg-white text-sm font-medium"
                    >
                      <FiTruck size={14} /> Track Order
                    </Button>
                  </Link>

                  {isLoggedIn || successState ? (
                    <Link
                      href="/user-profile?tab=purchase-history"
                      className="block"
                    >
                      <Button
                        variant="outline"
                        className="h-11 w-full gap-2 rounded-xl bg-white text-sm font-medium"
                      >
                        <FiShoppingBag size={14} /> My Orders
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="h-11 w-full gap-2 rounded-xl bg-white text-sm font-medium"
                    >
                      <FiHome size={14} /> Go to Home
                    </Button>
                  )}
                </div>

                {(isLoggedIn || successState) && (
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="mt-3 w-full text-center text-[13px] font-medium text-gray-500 underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    Continue shopping
                  </button>
                )}
              </div>
            </div>
          </div>
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
