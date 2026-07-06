"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { FiLock } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { splitName } from "@/utils/nameSplit";
import { normalizeBdPhone } from "@/utils/phone";
import { firePurchaseOnce } from "@/utils/purchaseDedup";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";

import CartTable from "./CartTable";
import CartSummary from "./CartSummary";
import Contain from "../../common/Contain";
import DeliveryInformation from "../checkout/DeliveryInformation";
import { Button } from "@/components/ui/button";
import CartTableSkeleton from "@/components/shared/loader/CartTableSkeleton";
import DeliveryInformationSkeleton from "@/components/shared/loader/DeliveryInformationSkeleton";
import CartSummarySkeleton from "@/components/shared/loader/CartSummarySkeleton";

import { BASE_URL } from "@/components/utils/baseURL";
import { fetchCartDetails } from "@/utils/fetchCartDetails";
import { productPrice, useCartCalculations } from "@/utils/helper";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import useGetSettingData from "@/components/lib/getSettingData";
import { allRemoveFromCart } from "@/redux/feature/cart/cartSlice";
import useGetZoneData from "@/components/lib/getZoneData";

// ✅ একটাই hook — সব platform
import useAnalytics from "@/components/analyticsScripts/utils/useAnalytics";

export const CART_QUERY_KEY = "/api/v1/product/cart_product";

const AddToCart = () => {
  const navigate = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { products } = useSelector((state) => state.cart);
  const { trackPurchase, trackInitiateCheckout } = useAnalytics();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  // S6 (2026-06-04) — saved addresses (logged-in only). Used by
  // DeliveryInformation to render an address picker that pre-fills the
  // form. Anonymous checkout never triggers the fetch.
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [mounted, setMounted] = useState(false);
  const initiateCheckoutFired = useRef(false);
  useEffect(() => setMounted(true), []);

  const { data: userInfo, isLoading: userGetLoading } = useUserInfoQuery();
  const { data: settingData } = useGetSettingData();

  // products এর শুধু id গুলো key হিসেবে ব্যবহার করো
  const cartKey = products
    .map((p) => `${p.productId}-${p.variation_product_id || ""}`)
    .join(",");

  const { data: cartData = [], isLoading: cartLoading } = useQuery({
    queryKey: [CART_QUERY_KEY, cartKey], // ✅ product add/remove এ key বদলায়
    queryFn: async () => {
      const res = await fetchCartDetails(products);
      return res?.data || [];
    },
    enabled: mounted && products?.length > 0,
    // F1.1 — was Infinity (never refetched). Cart now carries campaign (and,
    // later, flash) pricing that can expire while the cart sits open; the BE
    // recompute pulls promotions fresh at checkout, so a stale cart would show
    // a price the server won't honour. 60s caps the shown-vs-charged window.
    staleTime: 60_000,
  });
  const isLoading = !mounted || cartLoading;
  const [divisionID, setDivisionID] = useState();
  const [division, setDivision] = useState();
  const [districtId, setDistrictId] = useState("");
  const [district, setDistrict] = useState();
  const [isOpenDistrict, setIsOpenDistrict] = useState(true);
  const [couponData, setCouponData] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customer_phone, setUserPhone] = useState(
    userInfo?.data?.user_phone?.slice(3, 14),
  );
  const [userPhoneLogin, setUserPhoneLogin] = useState(false);

  useEffect(() => {
    if (userInfo?.data?.user_phone)
      setUserPhone(userInfo?.data?.user_phone?.slice(3, 14));
  }, [userInfo?.data?.user_phone]);

  // Auto-fill name + email from logged-in user profile when data arrives
  const userFillRef = useRef(false);
  useEffect(() => {
    if (userFillRef.current) return;
    if (!userInfo?.data?._id) return;
    userFillRef.current = true;
    if (userInfo.data.user_name) setValue("customer_name", userInfo.data.user_name);
    if (userInfo.data.user_email) setValue("customer_email", userInfo.data.user_email);
    if (userInfo.data.user_address) setValue("address", userInfo.data.user_address);
  }, [userInfo?.data?._id, setValue]);

  // S6 (2026-06-04) — fetch saved addresses once a logged-in user is
  // confirmed. Anonymous (FB-ads) checkout never hits this — userInfo is
  // null/undefined for them, so the picker stays hidden and the inline
  // billing fields work exactly like before.
  useEffect(() => {
    if (!userInfo?.data?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/user/addresses`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled && data?.success) {
          setSavedAddresses(data?.data || []);
        }
      } catch {
        /* silent — saved addresses are optional polish */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userInfo?.data?._id]);

  // S6 — apply a saved address to the checkout form. Only fills BLANK
  // fields by default so we never clobber what the buyer already typed.
  // Phone is filled when empty; division/district drive the controlled
  // city/zone state so the courier zone API refetches automatically.
  const applySavedAddress = (addr) => {
    if (!addr) return;
    if (addr.recipient_name) setValue("customer_name", addr.recipient_name);
    if (addr.recipient_phone) {
      const phoneStripped = String(addr.recipient_phone).replace(/\D/g, "").slice(-11);
      setUserPhone(phoneStripped);
      setValue("customer_phone", phoneStripped);
    }
    if (addr.division && addr.division !== division) {
      setDivision(addr.division);
      setDistrict();
      setDistrictId();
      setIsOpenDistrict(true);
    }
    if (addr.district) setDistrict(addr.district);
    if (addr.address_line) setValue("address", addr.address_line);
  };

  // Auto-apply default address ONCE on first load — fills blank form on
  // page open. Buyer can still pick another address via the picker or
  // type over the fields.
  const autoFilledRef = useRef(false);
  useEffect(() => {
    if (autoFilledRef.current) return;
    if (!savedAddresses?.length) return;
    const def = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
    if (def) {
      autoFilledRef.current = true;
      applySavedAddress(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  const {
    data: zoneData,
    isLoading: zoneLoading,
    refetch: refetchZone,
  } = useGetZoneData(divisionID);

  const shippingCharge = useMemo(
    () =>
      division === "Dhaka"
        ? settingData?.data?.[0]?.inside_dhaka_shipping_charge || 0
        : settingData?.data?.[0]?.outside_dhaka_shipping_charge || 0,
    [division, settingData],
  );
  // C13 checkout toggles
  const showEmailField = settingData?.data?.[0]?.show_email_field_checkout ?? true;
  const enablePromoAtCheckout = settingData?.data?.[0]?.enable_promo_at_checkout ?? true;
  const minOrderAmount = settingData?.data?.[0]?.min_order_amount ?? 0;

  const { shopSubtotals, shopGrandTotals, totalDiscount, adjustedPrices } =
    useCartCalculations({ cartData, products, couponData, shippingCharge });

  // ✅ InitiateCheckout — Phase 1B B5 value>0 guard + form-data CAPI pass.
  const handlePhoneChangeWithTracking = useCallback(
    (value) => {
      setUserPhone(value);
      // Skip when cart total is 0 — Meta's Purchase-optimisation campaigns
      // weight 0-value events poorly and they pollute funnel analytics.
      if (
        !initiateCheckoutFired.current &&
        value &&
        (shopGrandTotals || 0) > 0
      ) {
        initiateCheckoutFired.current = true;
        const { fn, ln } = splitName(userInfo?.data?.user_name);
        // num_items = sum of cart qty, not distinct lines (Phase 1B B2).
        const numItems =
          cartData?.reduce((s, c) => s + (c?.quantity || 1), 0) || 1;
        trackInitiateCheckout(
          {
            content_ids: cartData?.map((p) => p?._id) || [],
            value: shopGrandTotals || 0,
            num_items: numItems,
          },
          {
            ph: value,
            external_id: userInfo?.data?._id,
            fn,
            ln,
            em: userInfo?.data?.user_email,
            // Form may not be filled yet at this point — fall back to
            // logged-in user's saved address; backend will further fall
            // back to IP-derived geo.
            ct: userInfo?.data?.user_district,
            st: userInfo?.data?.user_division,
            country: "bd",
          },
        );
      }
    },
    [cartData, shopGrandTotals, trackInitiateCheckout, userInfo],
  );

  const handleRemoveFromCache = useCallback(
    (productId, variationId) => {
      // Invalidate by prefix — covers [CART_QUERY_KEY, cartKey] regardless of current cartKey
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
    [queryClient],
  );

  const handleRemoveCoupon = useCallback(() => {
    setCouponData(null);
    setCouponCode("");
    toast.success("Coupon removed successfully!");
  }, []);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a valid coupon code.");
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const response = await fetch(`${BASE_URL}/coupon/check_coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon_code: couponCode,
          customer_id: userInfo?.data?._id,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCouponData(data?.data);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(data.message || "Failed to apply coupon.");
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [couponCode, userInfo]);

  const handleOrderProduct = useCallback(
    async (formData) => {
      if (!userPhoneLogin && customer_phone) {
        if (
          !formatPhoneNumber(customer_phone) ||
          !isPossiblePhoneNumber(customer_phone) ||
          !isValidPhoneNumber(customer_phone)
        ) {
          toast.error("Mobile number not valid!");
          return;
        }
      }
      if (!customer_phone) {
        toast.error("Phone is required!");
        return;
      }
      if (!district || !division) {
        toast.error("Please select a City and Zone.");
        return;
      }

      const getCookie = (name) => {
        if (typeof document === "undefined") return "";
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? match[2] : "";
      };

      // F1.3 — submit ONE phone format. Logged-in path produced `01XXXXXXXXX`
      // (user_phone slice), guest PhoneInput produces E.164 `+8801…`. Normalize
      // both to E.164 here (symmetric with the backend); non-BD numbers pass
      // through untouched for clone deployments.
      const normalizedCustomerPhone = normalizeBdPhone(
        customer_phone || formData.customer_phone,
      );

      const orderData = {
        pathao_city_id: parseInt(divisionID),
        pathao_city_name: division,
        pathao_zone_id: parseInt(districtId),
        pathao_zone_name: district,
        order_status: "pending",
        pending_time:
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toLocaleTimeString(),
        customer_id: userInfo?.data?._id,
        customer_name: formData.customer_name || userInfo?.data?.user_name,
        customer_phone: normalizedCustomerPhone,
        billing_country: "Bangladesh",
        billing_city: district || userInfo?.data?.user_district,
        billing_state: division || userInfo?.data?.user_division,
        billing_address: formData.address || userInfo?.data?.user_address,
        shipping_location:
          division === "Dhaka"
            ? `Inside Dhaka, ${settingData?.data[0]?.inside_dhaka_shipping_days} Days`
            : `Outside Dhaka, ${settingData?.data[0]?.outside_dhaka_shipping_days} Days`,
        sub_total_amount: shopSubtotals || 0,
        discount_amount: totalDiscount || 0,
        shipping_cost: shippingCharge || 0,
        grand_total_amount: shopGrandTotals || 0,
        coupon_id: couponData?._id || null,
        need_user_create: !userInfo?.data?.user_phone,
        fbc: getCookie("_fbc"),
        fbp: getCookie("_fbp"),
        order_products: cartData.map((product) => {
          const isVariation = product?.is_variation;
          const originalPrice = isVariation
            ? product?.variations?.variation_price
            : product?.product_price;
          const originalDiscountPrice = isVariation
            ? product?.variations?.variation_discount_price
            : product?.product_discount_price;
          const cartItem = products.find(
            (item) =>
              item.productId === product._id &&
              (!product.variations?._id ||
                item.variation_product_id === product.variations._id),
          );
          const isCouponApplicable =
            couponData?.coupon_product_type === "specific" &&
            couponData?.coupon_specific_product?.some(
              (item) => item.product_id === product._id,
            );
          const priceKey = product?.variations?._id
            ? `${product._id}-${product.variations._id}`
            : product._id;
          return {
            product_id: product._id,
            variation_id: product.variations?._id || null,
            product_main_price: originalPrice,
            product_main_discount_price: originalDiscountPrice || 0,
            product_unit_price: productPrice(product),
            product_unit_final_price: isCouponApplicable
              ? adjustedPrices[priceKey]
              : productPrice(product),
            product_quantity: cartItem?.quantity || 1,
            product_grand_total_price:
              (isCouponApplicable
                ? adjustedPrices[priceKey]
                : productPrice(product)) * (cartItem?.quantity || 1),
            campaign_id: product?.campaign_details?._id || null,
          };
        }),
      };

      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Failed to create order");

        dispatch(allRemoveFromCart());
        queryClient.removeQueries({ queryKey: [CART_QUERY_KEY] });
        if (userInfo?.data?._id) {
          await fetch(`${BASE_URL}/cart`, {
            method: "DELETE",
            credentials: "include",
          }).catch(() => {});
        }

        // ✅ Purchase — Phase 1B B6 (dedup) + B4 (form-data CAPI passthrough).
        const newOrderId = result?.data?.order_id
          ? String(result.data.order_id)
          : null;
        firePurchaseOnce(newOrderId, () => {
          const { fn, ln } = splitName(
            formData.customer_name || userInfo?.data?.user_name,
          );
          trackPurchase(
            { ...orderData, _id: newOrderId },
            {
              ph: customer_phone,
              fn,
              ln,
              em: userInfo?.data?.user_email,
              ct: district, // form-derived shipping district wins over IP
              st: division,
              country: "bd",
              external_id: userInfo?.data?._id,
            },
          );
        });

        const orderId = result?.data?.order_id;
        const invoiceId = result?.data?.invoice_id;
        // const isGuest = !userInfo?.data?._id || orderData?.need_user_create;
        const isGuest = result?.data?.user_created === true;

        toast.success(result.message || "Order created successfully", {
          autoClose: 1500,
        });
        await new Promise((r) => setTimeout(r, 300));
        const params = new URLSearchParams();
        if (orderId) params.set("order_id", orderId);
        if (invoiceId) params.set("invoice_id", invoiceId);
        if (isGuest) params.set("guest", "true");
        navigate.push(`/orders/order-success?${params.toString()}`);
      } catch (error) {
        toast.error(error.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    },
    [
      userPhoneLogin,
      customer_phone,
      district,
      division,
      userInfo,
      shopSubtotals,
      totalDiscount,
      shippingCharge,
      shopGrandTotals,
      couponData,
      cartData,
      products,
      adjustedPrices,
      settingData,
      dispatch,
      navigate,
      divisionID,
      districtId,
      queryClient,
      trackPurchase,
    ],
  );

  if (!mounted)
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Contain>
          <div className="pt-6 pb-4">
            <div className="h-7 w-32 bg-gray-100 rounded-lg animate-pulse mb-1" />
            <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-10">
            <div className="md:col-span-2">
              <CartTableSkeleton />
            </div>
            <div className="md:col-span-1 space-y-4">
              <CartSummarySkeleton />
            </div>
          </div>
        </Contain>
      </div>
    );

  if (!products?.length)
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[#FAF7F2]">
        <div className="text-center max-w-sm bg-white rounded-2xl border border-secondary-100/70 shadow-[0_1px_3px_rgba(62,39,35,0.06)] p-8">
          <img
            src="/assets/images/empty/Empty-cuate.png"
            alt="Empty cart"
            className="mx-auto mb-4 w-52"
          />
          <h3 className="text-xl font-serif font-bold text-secondary mb-1">
            Your bag is empty
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Add items to your cart to checkout.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="outline" className="rounded-xl">Go Home</Button>
            </Link>
            <Link href="/shop">
              <Button className="rounded-xl">Shop Now</Button>
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative pb-24 md:pb-0">
      {loading && (
        <div className="fixed inset-0 z-50 bg-secondary/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-secondary font-serif font-medium">Placing your order…</p>
        </div>
      )}
      <form onSubmit={handleSubmit(handleOrderProduct)}>
        <Contain>
          {/* Page header — boutique serif with gold underline */}
          <div className="pt-8 pb-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-1.5">
              <span className="h-px w-6 bg-accent-700" />
              Secure Checkout
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-secondary tracking-tight">
              Complete your order
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 tabular-nums">
              {products?.length} {products?.length === 1 ? "item" : "items"} · ready for delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-10 items-start">
            {/* Left column (wide, 2/3): Delivery form — the main task, gets the room */}
            <div className="md:col-span-2">
              {userGetLoading ? (
                <DeliveryInformationSkeleton />
              ) : (
                <DeliveryInformation
                  register={register}
                  userInfo={userInfo}
                  errors={errors}
                  setUserPhoneLogin={setUserPhoneLogin}
                  setUserPhone={handlePhoneChangeWithTracking}
                  customer_phone={customer_phone}
                  setDivision={setDivision}
                  setDistrictId={setDistrictId}
                  setDivisionID={setDivisionID}
                  division={division}
                  district={district}
                  setDistrict={setDistrict}
                  setIsOpenDistrict={setIsOpenDistrict}
                  isOpenDistrict={isOpenDistrict}
                  refetchZone={refetchZone}
                  zoneLoading={zoneLoading}
                  zoneData={zoneData}
                  savedAddresses={savedAddresses}
                  onPickSavedAddress={applySavedAddress}
                  showEmailField={showEmailField}
                />
              )}
            </div>

            {/* Right column (1/3): cart items + summary + Place Order, together and
                sticky so Place Order stays on screen regardless of cart size. */}
            <div className="md:col-span-1">
              <div className="md:sticky md:top-[90px] space-y-4">
                {isLoading ? (
                  <CartTableSkeleton />
                ) : (
                  <CartTable
                    products={products}
                    couponData={couponData}
                    shopProduct={cartData}
                    adjustedPrices={adjustedPrices}
                    onRemoveFromCache={handleRemoveFromCache}
                  />
                )}
                <CartSummary
                  userInfo={userInfo}
                  totalDiscount={totalDiscount}
                  shippingCharge={shippingCharge}
                  shopSubtotals={shopSubtotals}
                  shopGrandTotals={shopGrandTotals}
                  couponData={couponData}
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  isApplyingCoupon={isApplyingCoupon}
                  handleApplyCoupon={handleApplyCoupon}
                  handleRemoveCoupon={handleRemoveCoupon}
                  loading={loading}
                  division={division}
                  enablePromoAtCheckout={enablePromoAtCheckout}
                  minOrderAmount={minOrderAmount}
                />
              </div>
            </div>
          </div>
        </Contain>

        {/* Mobile fixed bottom bar — hidden on md+ (desktop uses sidebar Place Order) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-secondary-100 shadow-[0_-4px_20px_rgba(62,39,35,0.12)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 leading-none mb-1">Total</p>
              <p className="text-lg font-bold text-primary leading-none tabular-nums">
                {settingData?.data?.[0]?.currency_symbol ?? ""}{shopGrandTotals || 0}
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || (minOrderAmount > 0 && shopSubtotals < minOrderAmount)}
              className="flex items-center justify-center gap-2 bg-gradient-to-b from-primary to-primary-700 text-white text-[15px] font-semibold px-7 py-3.5 rounded-2xl shadow-[0_6px_16px_-4px_rgba(107,26,31,0.45)] disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
            >
              <FiLock size={14} />
              {loading ? "Placing…" : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddToCart;
