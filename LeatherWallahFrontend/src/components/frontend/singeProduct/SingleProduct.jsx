"use client";
// src/components/frontend/singeProduct/SingleProduct.jsx
import { splitName } from "@/utils/nameSplit";
import { firePurchaseOnce } from "@/utils/purchaseDedup";
import { buildAnalyticsUserData } from "@/utils/buildAnalyticsUserData";
import Contain from "@/components/common/Contain";
import ProductPhotoSelect from "./productDetails/ProductPhotoSelect";
import ProductHighlightSection from "./productHighLightSection/ProductHighlightSection";
import ProductReviewAccordion from "./productReviewAccordion/ProductReviewAccordion";
import ProductDescription from "./productDescription/ProductDescription";
import RightSideDeliveryInfo from "./rightSideShoppingSection/RightSideDeliveryInfo";
import RightSideProductSummary from "./rightSideShoppingSection/RightSideProductSummary";
import RecentProducts from "./sellerProduct/RecentProducts";
import RelatedProducts from "./relatedProducts/RelatedProducts";
import MobileDeliveryInfoAccordion from "./rightSideShoppingSection/MobileDeliveryInfoAccordion";
import ReturnPolicyAccordion from "./returnPolicyAccordion/ReturnPolicyAccordion";
import { useEffect, useState, useRef } from "react";
import {
  updateRecentProducts,
  calculatePrice,
  singleProductPrice,
  variantAxisAttributes,
  buildVariationAvailabilityMap,
  strikeThroughPrice,
} from "@/utils/helper";
import { toast } from "react-toastify";
import { addToCart } from "@/redux/feature/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import useGetSettingData from "@/components/lib/getSettingData";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import {
  addToWishlistRemote,
  removeFromWishlistRemote,
} from "@/utils/wishlistSync";
import { BASE_URL } from "@/components/utils/baseURL";
import { useRouter } from "next/navigation";
import {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
import useGetZoneData from "@/components/lib/getZoneData";
import "react-phone-number-input/style.css";
import { BsBoxSeam } from "react-icons/bs";

// ✅ আগে ছিল: useMetaPixel + generateEventId + sendServerEvent + useGTM + useTikTokPixel + sendTikTokServerEvent
// ✅ এখন: একটাই hook
import useAnalytics from "@/components/analyticsScripts/utils/useAnalytics";

const SingleProduct = ({ product }) => {
  useEffect(() => {
    if (product) updateRecentProducts(product);
  }, [product]);

  const { data: userInfo, isLoading: userGetLoading } = useUserInfoQuery();
  const initiateCheckoutFired = useRef(false);

  // ✅ একটাই hook — সব platform
  const {
    trackViewContent,
    trackAddToCart,
    trackPurchase,
    trackInitiateCheckout,
    trackAddToWishlist,
  } = useAnalytics();

  // ✅ ViewContent — product load হলে একবার fire (Phase 1B EMQ user_data).
  useEffect(() => {
    if (!product?._id) return;
    trackViewContent(product, buildAnalyticsUserData(userInfo));
  }, [product?._id]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  const { data: settingData } = useGetSettingData();
  const [loading, setLoading] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const navigate = useRouter();
  const [customer_phone, setUserPhone] = useState(
    userInfo?.data?.user_phone?.slice(3, 14),
  );
  const [userPhoneLogin, setUserPhoneLogin] = useState(false);

  // ✅ InitiateCheckout — phone দিলে একবার fire
  const handlePhoneChangeWithTracking = (value) => {
    setUserPhone(value);
    if (!initiateCheckoutFired.current && value) {
      initiateCheckoutFired.current = true;
      trackInitiateCheckout(
        {
          content_ids: [product?._id],
          value: productPrice * quantity,
          num_items: quantity,
        },
        { ph: value, external_id: userInfo?.data?._id },
      );
    }
  };

  useEffect(() => {
    if (userInfo?.data?.user_phone)
      setUserPhone(userInfo?.data?.user_phone?.slice(3, 14));
  }, [userInfo?.data?.user_phone]);

  const [divisionID, setDivisionID] = useState();
  const [division, setDivision] = useState();
  const [districtId, setDistrictId] = useState("");
  const [district, setDistrict] = useState();
  const [isOpenDistrict, setIsOpenDistrict] = useState(true);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [shopSubtotals, setShopSubtotals] = useState(0);
  const [shopTotal, setShopTotal] = useState(0);
  const [shopGrandTotals, setShopGrandTotals] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [variationProduct, setVariationProduct] = useState(null);
  const [stock, setStock] = useState(
    product?.is_variation
      ? product?.variations?.[0]?.variation_quantity
      : product?.product_quantity,
  );
  const [productPrice, setProductPrice] = useState(null);
  const [lineThoughPrice, setLineThoughPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompare, setIsCompare] = useState(false);
  const cartProducts = useSelector((state) => state.cart.products);
  const dispatch = useDispatch();
  const { data: zoneData, isLoading: zoneLoading } = useGetZoneData(divisionID);

  const shippingCharge =
    division === "Dhaka"
      ? settingData?.data?.[0]?.inside_dhaka_shipping_charge || 0
      : settingData?.data?.[0]?.outside_dhaka_shipping_charge || 0;
  // C13 PDP toggles
  const showSoldCount = settingData?.data?.[0]?.show_sold_count ?? true;
  const showStockCountOnPdp = settingData?.data?.[0]?.show_stock_count_on_pdp ?? false;
  const enableReviews = settingData?.data?.[0]?.enable_reviews ?? true;
  const allowImageDownload = settingData?.data?.[0]?.allow_image_download ?? false;

  const maxQuantity = stock || product?.product_quantity || 1;

  // ── Phase C — variation picker state model ────────────────────────────────
  // selectedVariations: { [axis_attribute_id_str]: full_value_obj_with_source_id }
  // Replaces the old { [attribute_name]: value_obj } shape so matching can
  // happen on attribute_value._id (combination[]) instead of name slugs.

  // Pre-built availability + axis list. Recomputed only when the product
  // identity / variation set changes.
  const axisAttrs = variantAxisAttributes(product);
  const availabilityMap = buildVariationAvailabilityMap(product);

  // Match a selectedVariations map to a variation row via combination[] set
  // equality. Order-agnostic; works with Bangla/emoji axis values.
  const findVariationByValueIds = (valuesById) => {
    const selectedIds = Object.values(valuesById)
      .map((v) => v?._id && String(v._id))
      .filter(Boolean);
    if (!selectedIds.length) return null;
    const target = new Set(selectedIds);
    return (
      product?.variations?.find((v) => {
        if (v?.is_active === false) return false;
        const combo = v?.combination;
        if (!Array.isArray(combo) || combo.length !== target.size) return false;
        for (const id of combo) {
          if (!target.has(String(id))) return false;
        }
        return true;
      }) || null
    );
  };

  // Apply a found variation's price / stock / line-through into local state.
  const applyVariation = (found) => {
    setVariationProduct(found || null);
    if (!found) return;
    setStock(found.variation_quantity);
    setQuantity(1);
    // A variation with no absolute price of its own falls back to the product's
    // — the resolver on the server does exactly the same, so the two agree.
    const variationRegular =
      Number(found.variation_price) > 0
        ? Number(found.variation_price)
        : Number(product?.product_price) || 0;
    let price = found.variation_discount_price || variationRegular;
    if (product?.flash_sale_details?.flash_sale_product) {
      const fp = product.flash_sale_details.flash_sale_product;
      if (fp?.flash_price_type)
        price = calculatePrice(
          price,
          fp.flash_sale_product_price,
          fp.flash_price_type,
        );
    } else if (product?.campaign_details?.campaign_product) {
      const cp = product.campaign_details.campaign_product;
      if (cp?.campaign_price_type)
        price = calculatePrice(
          price,
          cp.campaign_product_price,
          cp.campaign_price_type,
        );
    }
    setLineThoughPrice(strikeThroughPrice(variationRegular, price));
    setProductPrice(price);
  };

  // Product init — seed selections from URL params if present, else first
  // value of every axis. URL pattern: ?<axis_attribute_id>=<value_id>.
  useEffect(() => {
    const initialPrice = singleProductPrice(product);
    setProductPrice(initialPrice);
    // Always assign — the old code only set the struck-out price when a discount
    // existed, so switching to a product without one left the previous product's
    // value on screen. strikeThroughPrice returns null when there is nothing to
    // strike through, which is exactly what the render guards expect.
    setLineThoughPrice(
      strikeThroughPrice(
        Number(product?.variations?.[0]?.variation_price) > 0
          ? product?.variations?.[0]?.variation_price
          : product?.product_price,
        initialPrice,
      ),
    );
    if (!product?.is_variation) {
      setStock(product?.product_quantity);
      return;
    }

    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const initial = {};
    for (const axis of axisAttrs || []) {
      const axisIdStr = String(axis.attribute_id);
      const wantedValueId = urlParams.get(axisIdStr);
      const match = wantedValueId
        ? axis.attribute_values?.find((v) => String(v._id) === wantedValueId)
        : null;
      if (match) {
        initial[axisIdStr] = match;
      } else if (axis.attribute_values?.length > 0) {
        initial[axisIdStr] = axis.attribute_values[0];
      }
    }
    setSelectedVariations(initial);
    const found = findVariationByValueIds(initial);
    if (found) {
      applyVariation(found);
    } else {
      // No exact match (URL combo doesn't exist) — fall back to first variation.
      const fallback = product?.variations?.find(
        (v) => v?.is_active !== false,
      );
      setVariationProduct(fallback || null);
      setStock(fallback?.variation_quantity || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Mirror current selection into URL (?<axis_id>=<value_id>) without page
  // navigation so reload / share / back preserves state.
  useEffect(() => {
    if (!product?.is_variation || !selectedVariations) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    for (const [axisId, val] of Object.entries(selectedVariations)) {
      if (val?._id) params.set(axisId, String(val._id));
    }
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${
      newSearch ? `?${newSearch}` : ""
    }${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  }, [selectedVariations, product?.is_variation]);

  const handleSelectVariation = (value, axisAttrId) => {
    const key = String(axisAttrId);
    const newVars = { ...selectedVariations, [key]: value };
    setSelectedVariations(newVars);
    const found = findVariationByValueIds(newVars);
    applyVariation(found);
  };

  // Picker-complete guard for add-to-cart: every axis must have a selection
  // AND the resolved variation must exist + be in stock.
  const allAxesSelected =
    !product?.is_variation ||
    (axisAttrs?.length > 0 &&
      axisAttrs.every((a) => selectedVariations[String(a.attribute_id)]?._id));
  const canAddToCart =
    !product?.is_variation ||
    (allAxesSelected && variationProduct && (stock || 0) > 0);

  const handleIncrement = () => {
    if (quantity < stock) setQuantity(quantity + 1);
    else toast.error("Stock limit reached");
  };
  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  // ✅ AddToCart
  const handleAddToCart = () => {
    if (!canAddToCart) {
      toast.error(
        product?.is_variation && !allAxesSelected
          ? "প্রথমে সব option select করুন।"
          : "এই combination এখন stock-এ নেই।",
        { autoClose: 1500 },
      );
      return;
    }
    const cartItem = {
      productId: product?._id,
      quantity,
      variation_product_id: variationProduct?._id || null,
      product_slug: product?.product_slug || null,
    };
    const inCart = cartProducts.some((item) =>
      variationProduct
        ? item.productId === product?._id &&
          item.variation_product_id === variationProduct?._id
        : item.productId === product?._id && !item.variation_product_id,
    );
    if (inCart) {
      toast.error("Already in cart", { autoClose: 1500 });
      return;
    }

    dispatch(addToCart(cartItem));
    toast.success("Added to cart!", { autoClose: 1500 });

    // ✅ AddToCart — Phase 1B EMQ user_data via shared helper.
    trackAddToCart(
      product,
      variationProduct,
      quantity,
      buildAnalyticsUserData(userInfo),
    );
  };

  // Wishlist & compare sync
  useEffect(() => {
    try {
      const w = JSON.parse(localStorage.getItem("wishlist")) || [];
      const c = JSON.parse(localStorage.getItem("compare")) || [];
      setIsWishlisted(
        w.some(
          (i) =>
            i.productId === product?._id &&
            i.variation_product_id === (variationProduct?._id || null),
        ),
      );
      setIsCompare(
        c.some(
          (i) =>
            i.productId === product?._id &&
            i.variation_product_id === (variationProduct?._id || null),
        ),
      );
    } catch (e) {}
  }, [product?._id, variationProduct?._id]);

  // ✅ Wishlist
  const handleWishlist = () => {
    const item = {
      productId: product?._id,
      variation_product_id: variationProduct?._id || null,
    };
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("wishlist")) || [];
    } catch (e) {}
    const idx = list.findIndex(
      (i) =>
        i.productId === product?._id &&
        i.variation_product_id === (variationProduct?._id || null),
    );
    const isLoggedIn = !!userInfo?.data?._id;
    if (idx !== -1) {
      list.splice(idx, 1);
      setIsWishlisted(false);
      toast.error("Removed from wishlist", { autoClose: 1500 });
      // D15 — logged-in হলে BE-তেও remove fire করি (cross-device sync)
      removeFromWishlistRemote(
        product?._id,
        variationProduct?._id || null,
        isLoggedIn,
      );
    } else {
      list.push(item);
      setIsWishlisted(true);
      toast.success("Added to wishlist", { autoClose: 1500 });

      // ✅ AddToWishlist — Meta + TikTok + GTM একটাই call
      trackAddToWishlist(product, variationProduct);
      // D15 — logged-in হলে BE-তেও upsert fire করি
      addToWishlistRemote(
        product?._id,
        variationProduct?._id || null,
        isLoggedIn,
      );
    }
    localStorage.setItem("wishlist", JSON.stringify(list));
    window.dispatchEvent(new Event("localStorageUpdated"));
  };

  const handleAddToCompare = () => {
    const item = {
      productId: product?._id,
      variation_product_id: variationProduct?._id || null,
    };
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("compare")) || [];
    } catch (e) {}
    const idx = list.findIndex(
      (i) =>
        i.productId === product?._id &&
        i.variation_product_id === (variationProduct?._id || null),
    );
    if (idx !== -1) {
      list.splice(idx, 1);
      setIsCompare(false);
      toast.error("Removed from compare", { autoClose: 1500 });
    } else {
      list.push(item);
      setIsCompare(true);
      toast.success("Added to compare", { autoClose: 1500 });
    }
    localStorage.setItem("compare", JSON.stringify(list));
    window.dispatchEvent(new Event("localStorageUpdated"));
  };

  useEffect(() => {
    // `> 0` rather than `!= null`: a 0 is not a price, and multiplying it by the
    // quantity used to show the buyer a ৳0 subtotal above a correct grand total.
    const subtotal =
      (lineThoughPrice > 0 ? lineThoughPrice : productPrice) * quantity;
    const total = productPrice * quantity;
    setShopSubtotals(subtotal || 0);
    setShopTotal(total || 0);
    setTotalDiscount(subtotal - total || 0);
    setShopGrandTotals(total + shippingCharge || 0);
  }, [productPrice, quantity, lineThoughPrice, shippingCharge]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) setIsAccordionOpen(true);
  }, [errors]);

  // ✅ Order submit — Purchase
  const handleOrderProduct = async (data) => {
    if (!userPhoneLogin) {
      if (customer_phone) {
        if (
          !formatPhoneNumber(customer_phone) ||
          !isPossiblePhoneNumber(customer_phone) ||
          !isValidPhoneNumber(customer_phone)
        ) {
          toast.error("Mobile number is not valid!", {
            position: "top-center",
            autoClose: 2000,
          });
          return;
        }
      }
    }
    if (!customer_phone) {
      toast.error("Phone is required!", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }
    if (!district || !division || !divisionID || !districtId) {
      toast.error("Please select a City and Zone.");
      return;
    }

    const today =
      new Date().toISOString().split("T")[0] +
      " " +
      new Date().toLocaleTimeString();

    const sendData = {
      order_status: "pending",
      pending_time: today,
      customer_id: userInfo?.data?._id || null,
      customer_phone: customer_phone || data?.customer_phone,
      billing_country: "Bangladesh",
      billing_city: district,
      billing_state: division,
      billing_address: data?.address,
      user_name: data?.customer_name,
      need_user_create: !userInfo?.data?.user_phone,
      shipping_location:
        division === "Dhaka"
          ? `Inside Dhaka, ${settingData?.data[0]?.inside_dhaka_shipping_days} Days`
          : `Outside Dhaka, ${settingData?.data[0]?.outside_dhaka_shipping_days} Days`,
      sub_total_amount: shopTotal || 0,
      discount_amount: totalDiscount || 0,
      shipping_cost: shippingCharge || 0,
      grand_total_amount: shopGrandTotals || 0,
      coupon_id: null,
      pathao_city_id: parseInt(divisionID),
      pathao_city_name: division,
      pathao_zone_id: parseInt(districtId),
      pathao_zone_name: district,
      order_products: [product].map((item) => ({
        product_id: item._id,
        variation_id: variationProduct?._id || null,
        product_main_price: lineThoughPrice || productPrice,
        product_main_discount_price:
          variationProduct?.variation_discount_price ||
          product?.product_discount_price ||
          0,
        product_unit_price: productPrice,
        product_unit_final_price: productPrice,
        product_quantity: quantity,
        product_grand_total_price: productPrice * quantity,
        campaign_id: item?.campaign_details?._id || null,
      })),
    };

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/order/single_order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        // ✅ Purchase — Phase 1B B6 dedup + B4 form-data CAPI pass.
        const newOrderId = result?.data?.order_id
          ? String(result.data.order_id)
          : null;
        firePurchaseOnce(newOrderId, () => {
          const { fn, ln } = splitName(
            data?.customer_name || userInfo?.data?.user_name,
          );
          trackPurchase(
            { ...sendData, _id: newOrderId },
            {
              ph: customer_phone,
              fn,
              ln,
              em: userInfo?.data?.user_email,
              ct: district,
              st: division,
              country: "bd",
              external_id: userInfo?.data?._id,
            },
          );
        });

        toast.success(result?.message || "Order placed successfully!", {
          autoClose: 1000,
        });
        const params = new URLSearchParams();
        if (result?.data?.order_id)
          params.set("order_id", result.data.order_id);
        if (result?.data?.invoice_id)
          params.set("invoice_id", result.data.invoice_id);

        const isGuest = result?.data?.user_created === true;

        if (isGuest) params.set("guest", "true");

        navigate.push(`/orders/order-success?${params.toString()}`);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-800 font-bold text-lg">
            Placing your order...
          </p>
          <p className="text-gray-500 text-sm">
            Please don't close this window
          </p>
        </div>
      )}
      <Contain>
        <div className="py-4 md:py-6 space-y-5">
          <form onSubmit={handleSubmit(handleOrderProduct)}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-0">
                <div
                  className="lg:col-span-4 p-4 md:p-5 border-b lg:border-b-0 lg:border-r border-gray-100"
                  onContextMenu={allowImageDownload ? undefined : (e) => e.preventDefault()}
                >
                  <ProductPhotoSelect
                    product={product}
                    variationProduct={variationProduct}
                  />
                </div>
                <div className="lg:col-span-4 p-4 md:p-5 border-b lg:border-b-0 lg:border-r border-gray-100">
                  <ProductHighlightSection
                    product={product}
                    variationProduct={variationProduct}
                    productPrice={productPrice}
                    lineThoughPrice={lineThoughPrice}
                    stock={stock}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    handleIncrement={handleIncrement}
                    handleDecrement={handleDecrement}
                    isWishlisted={isWishlisted}
                    isCompare={isCompare}
                    handleAddToCompare={handleAddToCompare}
                    handleWishlist={handleWishlist}
                    handleSelectVariation={handleSelectVariation}
                    selectedVariations={selectedVariations}
                    axisAttrs={axisAttrs}
                    availabilityMap={availabilityMap}
                    canAddToCart={canAddToCart}
                    maxQuantity={maxQuantity}
                    handleAddToCart={handleAddToCart}
                    showSoldCount={showSoldCount}
                    showStockCountOnPdp={showStockCountOnPdp}
                  />
                </div>
                <div className="lg:col-span-4 p-4 md:p-5 bg-gray-50/40">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                    <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/20">
                      <BsBoxSeam className="text-white" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Order Now
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Cash on Delivery · Fast Shipping
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <RightSideDeliveryInfo
                      register={register}
                      userInfo={userInfo}
                      errors={errors}
                      setDivision={setDivision}
                      setDistrictId={setDistrictId}
                      setDivisionID={setDivisionID}
                      division={division}
                      district={district}
                      setDistrict={setDistrict}
                      setIsOpenDistrict={setIsOpenDistrict}
                      isOpenDistrict={isOpenDistrict}
                      watch={watch}
                      loading={userGetLoading}
                      isAccordionOpen={isAccordionOpen}
                      setIsAccordionOpen={setIsAccordionOpen}
                      customer_phone={customer_phone}
                      setUserPhone={handlePhoneChangeWithTracking}
                      setUserPhoneLogin={setUserPhoneLogin}
                      zoneLoading={zoneLoading}
                      zoneData={zoneData}
                    />
                    <RightSideProductSummary
                      totalDiscount={totalDiscount}
                      shippingCharge={shippingCharge}
                      shopSubtotals={shopSubtotals}
                      shopGrandTotals={shopGrandTotals}
                      division={division}
                      loading={loading}
                      shopTotal={shopTotal}
                      stock={stock}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                <ProductDescription product={product} />
                {enableReviews && <ProductReviewAccordion product={product} />}
                <MobileDeliveryInfoAccordion
                  product={product}
                  settingData={settingData}
                />
                <ReturnPolicyAccordion />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-14">
                <RecentProducts
                  productId={product?._id}
                  product_slug={product?.product_slug}
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-base font-bold text-gray-800">
                Related Products
              </h2>
            </div>
            <RelatedProducts product_slug={product?.product_slug} />
          </div>
        </div>
      </Contain>
      <div className="h-20 md:h-0" />
    </div>
  );
};

export default SingleProduct;
