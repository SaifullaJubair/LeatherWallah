"use client";
// themedProduct/singeProduct/SingleProduct.jsx
// 🎨 Dynamic-theme version of the PDP hub. ALL logic (variant select, qty,
// cart, wishlist, single-order form, analytics) is preserved verbatim from the
// original SingleProduct; only the JSX is redesigned per the theme mockups and
// driven by CSS variables (--brand-primary etc.) injected by ThemeStyleInjector.
import { splitName } from "@/utils/nameSplit";
import { normalizeBdPhone } from "@/utils/phone";
import { firePurchaseOnce } from "@/utils/purchaseDedup";
import { buildAnalyticsUserData } from "@/utils/buildAnalyticsUserData";
import RightSideDeliveryInfo from "./rightSideShoppingSection/RightSideDeliveryInfo";
import ChartModal from "./productHighLightSection/ChartModal";
import WhatsAppOrderButton from "../theme/WhatsAppOrderButton";
import HeroGallery from "../theme/HeroGallery";
import FloatingAssets from "../theme/FloatingAssets";
// DescriptionCard moved to ProductThemedSections (renders between Nutrition
// and Reviews now) — was too prominent right after hero per mockup review.
import DynamicIcon from "@/lib/icons/DynamicIcon";
import PdpPriceMeta from "./PdpPriceMeta";
import ViewCountFire from "./ViewCountFire";
import { useEffect, useState, useRef } from "react";
import {
  updateRecentProducts,
  calculatePrice,
  singleProductPrice,
  variantAxisAttributes,
} from "@/utils/helper";
import VariationPicker from "./VariationPicker";
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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
import useGetZoneData from "@/components/lib/getZoneData";
import "react-phone-number-input/style.css";
import { FaHeart, FaRegHeart, FaStar, FaLock } from "react-icons/fa";
import { HiMinus, HiOutlinePlus } from "react-icons/hi";
import { BsCart, BsCartCheckFill } from "react-icons/bs";
import { GoGitCompare } from "react-icons/go";

// ✅ একটাই analytics hook — সব platform
import useAnalytics from "@/components/analyticsScripts/utils/useAnalytics";

const SingleProduct = ({ product, theme }) => {
  useEffect(() => {
    if (product) updateRecentProducts(product);
  }, [product]);

  const { data: userInfo, isLoading: userGetLoading } = useUserInfoQuery();
  const initiateCheckoutFired = useRef(false);

  const {
    trackViewContent,
    trackAddToCart,
    trackPurchase,
    trackInitiateCheckout,
    trackAddToWishlist,
  } = useAnalytics();

  // ✅ ViewContent — Phase 1B EMQ user_data via shared helper.
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
  const [showChart, setShowChart] = useState(false);
  const [cartAnim, setCartAnim] = useState(false);
  const navigate = useRouter();
  // ── URL ↔ variation sync ──────────────────────────────────────────────────
  // Pattern: /products/:slug?size=m&color=jet-black
  // Reload / share / back-button all preserve the picked variation. The keys
  // are the attribute_name kebab-cased, the values are the attribute_value_name
  // kebab-cased (matches admin URL conventions everywhere).
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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
      ? // First-paint seed: use the first ACTIVE variation's stock, not
        // variations[0] (which may be a disabled variation, falsely showing the
        // product as out of stock for the split-second before the init effect
        // resolves the real selected variation).
        (
          product?.variations?.find((v) => v?.is_active !== false) ||
          product?.variations?.[0]
        )?.variation_quantity
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

  const currencySymbol = settingData?.data?.[0]?.currency_symbol || "৳";
  const whatsappNumber = settingData?.data?.[0]?.watsapp;
  // C13 PDP toggles
  const showSoldCount = settingData?.data?.[0]?.show_sold_count ?? true;
  const showViewCount = settingData?.data?.[0]?.show_view_count ?? true;
  const showStockCountOnPdp = settingData?.data?.[0]?.show_stock_count_on_pdp ?? false;
  const allowImageDownload = settingData?.data?.[0]?.allow_image_download ?? false;

  const shippingCharge =
    division === "Dhaka"
      ? settingData?.data?.[0]?.inside_dhaka_shipping_charge || 0
      : settingData?.data?.[0]?.outside_dhaka_shipping_charge || 0;

  const maxQuantity = stock || product?.product_quantity || 1;

  // Phase C audit fix — themed PDP uses combination[] set-intersection
  // matching (Bangla-safe). URL state now keyed by attribute_slug / value_slug
  // (Phase E follow-up) instead of ObjectId so URLs are human-readable
  // (`?color=jet-black&size=l`). Falls back to ObjectId when a slug isn't
  // pure-ASCII (i.e. legacy Bangla-literal slug that didn't go through the
  // any-ascii migration) so old data doesn't break.
  const PURE_ASCII_SLUG = /^[a-z0-9-]+$/;
  const safeKey = (slug, fallbackId) =>
    typeof slug === "string" && PURE_ASCII_SLUG.test(slug)
      ? slug
      : String(fallbackId);

  // Helper: build a Set<value_id_string> from the current selection map.
  const collectSelectedValueIds = (vars) => {
    const ids = [];
    for (const v of Object.values(vars || {})) {
      if (v?._id) ids.push(String(v._id));
    }
    return ids;
  };

  // Combination[] set intersection — order-agnostic, Bangla-safe.
  const findVariationByValueIds = (vars) => {
    const selectedIds = collectSelectedValueIds(vars);
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

  // Apply a chosen variation's price / stock into local state. Shared between
  // the init effect and the click handler so they can't drift.
  const applyVariationPriceStock = (found) => {
    if (!found) return;
    setStock(found.variation_quantity);
    let price = found.variation_discount_price || found.variation_price;
    if (product?.flash_sale_details?.flash_sale_product) {
      const fp = product.flash_sale_details.flash_sale_product;
      if (fp?.flash_price_type)
        price = calculatePrice(
          price,
          fp.flash_sale_product_price,
          fp.flash_price_type,
        );
      setLineThoughPrice(found.variation_price);
    } else if (product?.campaign_details?.campaign_product) {
      const cp = product.campaign_details.campaign_product;
      if (cp?.campaign_price_type)
        price = calculatePrice(
          price,
          cp.campaign_product_price,
          cp.campaign_price_type,
        );
      setLineThoughPrice(found.variation_price);
    } else {
      setLineThoughPrice(
        found.variation_discount_price > 0 ? found.variation_price : null,
      );
    }
    setProductPrice(price);
  };

  // Product init — seed from URL params if present, else first value of every
  // axis. URL pattern: ?<attribute_slug>=<value_slug> (legacy ObjectId-keyed
  // links still resolved as fallback). Bug A audit fix — init now sets the
  // resolved variation's price + lineThoughPrice too. Previously only set
  // product-level base price, so after URL-driven re-render (router.replace
  // triggers Next.js server re-fetch with cache:"no-store") the price would
  // flicker to base then back to variation in handleSelectVariation.
  useEffect(() => {
    if (!product?.is_variation) {
      setProductPrice(singleProductPrice(product));
      if (product?.product_discount_price) {
        setLineThoughPrice(product?.product_price);
      } else {
        setLineThoughPrice(null);
      }
      setStock(product?.product_quantity);
      return;
    }
    // Fix #23 — initial selection prefers the first IN-STOCK active variation
    // when the URL doesn't pin a specific one. Previously hard-coded
    // axis.attribute_values[0] meant a product whose first listed color was OOS
    // would show "স্টক শেষ" on landing even when other colors had stock,
    // confusing buyers into thinking the whole product was unavailable.
    const axisAttrs = variantAxisAttributes(product);
    const hasUrlPinned = axisAttrs?.some((axis) => {
      const axisKey = safeKey(axis.attribute_slug, axis.attribute_id);
      return !!searchParams?.get(axisKey);
    });
    // If URL pins a value, honour it (deep-link / share / SEO use). Otherwise
    // try to land on the first active+in-stock variation so the badge starts
    // green when at least one combination is buyable.
    let seedVariation = null;
    if (!hasUrlPinned) {
      seedVariation = (product?.variations || []).find(
        (v) => v?.is_active !== false && Number(v?.variation_quantity) > 0,
      );
    }
    const initial = {};
    axisAttrs?.forEach((axis) => {
      if (!axis?.attribute_values?.length) return;
      const axisKey = safeKey(axis.attribute_slug, axis.attribute_id);
      const wanted = searchParams?.get(axisKey);
      const urlMatch = wanted
        ? axis.attribute_values.find((v) => {
            const valueKey = safeKey(v.attribute_value_slug, v._id);
            return valueKey === wanted || String(v._id) === wanted;
          })
        : null;
      // Seed-variation match: find the axis value that belongs to seedVariation.
      const seedMatch =
        seedVariation && Array.isArray(seedVariation.combination)
          ? axis.attribute_values.find((v) =>
              seedVariation.combination.some(
                (id) => String(id) === String(v._id),
              ),
            )
          : null;
      initial[axis.attribute_name] =
        urlMatch || seedMatch || axis.attribute_values[0];
    });
    setSelectedVariations(initial);
    const found =
      findVariationByValueIds(initial) ||
      seedVariation ||
      product?.variations?.find((v) => v?.is_active !== false) ||
      null;
    setVariationProduct(found);
    if (found) {
      applyVariationPriceStock(found);
    } else {
      // No usable variation at all — degrade to product-level pricing.
      setProductPrice(singleProductPrice(product));
      setLineThoughPrice(
        product?.product_discount_price ? product?.product_price : null,
      );
      setStock(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Kept for the JSX that still references generateSlug + findVariation (e.g.
  // badge-text lookup inside the chip render). Both now route through the
  // ID-based path internally — the slug arg is ignored.
  const generateSlug = (vars) => collectSelectedValueIds(vars).join("|");
  const findVariation = (_slug, varsOverride = selectedVariations) =>
    findVariationByValueIds(varsOverride);

  const handleSelectVariation = (value, attributeName) => {
    const newVars = { ...selectedVariations, [attributeName]: value };
    setSelectedVariations(newVars);
    const found = findVariationByValueIds(newVars);
    setVariationProduct(found || null);

    // URL sync — key by attribute_slug, value by attribute_value_slug
    // (Phase E follow-up). Falls back to ObjectId if a slug is non-ASCII
    // (legacy data that hasn't been migrated yet). Share-safe, reload-safe.
    try {
      const params = new URLSearchParams(searchParams?.toString() || "");
      const axisAttrs = variantAxisAttributes(product);
      // Drop any stale ObjectId-keyed params left over from older session URLs
      // so we don't end up with both ?color=red AND ?<colorObjectId>=<...>.
      for (const axis of axisAttrs || []) {
        params.delete(String(axis.attribute_id));
      }
      for (const axis of axisAttrs || []) {
        const picked = newVars[axis.attribute_name];
        if (!picked?._id) continue;
        const axisKey = safeKey(axis.attribute_slug, axis.attribute_id);
        const valueKey = safeKey(picked.attribute_value_slug, picked._id);
        params.set(axisKey, valueKey);
      }
      navigate.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } catch {
      /* no-op — URL sync is a nice-to-have, never block the pick */
    }
    if (found) {
      setQuantity(1);
      applyVariationPriceStock(found);
    }
  };

  const handleIncrement = () => {
    if (quantity < stock) setQuantity(quantity + 1);
    else toast.error("Stock limit reached");
  };
  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  // ✅ AddToCart
  const handleAddToCart = () => {
    const cartItem = {
      productId: product?._id,
      quantity,
      variation_product_id: variationProduct?._id || null,
      product_slug: product?.product_slug || null,
      maxStock: maxQuantity, // F1.2 — clamp additive merge to live stock
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
    setCartAnim(true);
    setTimeout(() => setCartAnim(false), 1500);

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
      // D15 — logged-in হলে BE-তেও remove fire করি
      removeFromWishlistRemote(
        product?._id,
        variationProduct?._id || null,
        isLoggedIn,
      );
    } else {
      list.push(item);
      setIsWishlisted(true);
      toast.success("Added to wishlist", { autoClose: 1500 });
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
    const subtotal =
      (lineThoughPrice != null ? lineThoughPrice : productPrice) * quantity;
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
      // F1.3 — submit one consistent phone format (E.164), symmetric with BE.
      customer_phone: normalizeBdPhone(customer_phone || data?.customer_phone),
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
        if (result?.data?.order_id) params.set("order_id", result.data.order_id);
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

  // ---- derived display values ----
  const rating = parseFloat(product?.avarage_review_ratting || 0).toFixed(1);
  const discountPct =
    lineThoughPrice && productPrice && lineThoughPrice > productPrice
      ? Math.round(((lineThoughPrice - productPrice) / lineThoughPrice) * 100)
      : 0;
  const variantName = variationProduct?.variation_name || product?.product_name;

  return (
    <div
      className="overflow-x-hidden"
      style={{ background: "var(--page-bg, #FFF8F8)", fontFamily: "var(--brand-font)" }}
    >
      {/* F2 — fire-and-forget view count bump (deduped per session). */}
      <ViewCountFire productId={product?._id} />
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div
            className="w-14 h-14 border-4 rounded-full animate-spin"
            style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }}
          />
          <p className="text-gray-800 font-bold text-lg">Placing your order...</p>
          <p className="text-gray-500 text-sm">Please don't close this window</p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleOrderProduct)}>
        <div className="max-w-6xl mx-auto px-4">
          {/* ════════════ HERO ════════════ */}
          <section className="relative overflow-hidden py-6 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Hero floats anchor to the whole section. On large screens the
                grid is side-by-side so left-aligned floats sit over the text
                column (above the badge — the spot that looked good). On mobile
                the grid stacks with the IMAGE on top (order-1), so we anchor
                mobile floats to the top band and lift them above the gallery
                (z) — see FloatingAssets mobile handling — so they sit ON the
                product image instead of being buried under it. */}
            <FloatingAssets assets={theme?.floating_assets} section="hero" />
            {/* Left — text */}
            <div className="space-y-4 order-2 lg:order-1 relative z-10">
              {product?.badge_text && (
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: "var(--brand-primary-light)",
                    color: "var(--brand-primary-dark)",
                  }}
                >
                  {product.badge_text}
                </span>
              )}

              <h1
                className="text-3xl md:text-5xl font-black leading-tight"
                style={{
                  color: "var(--heading-color)",
                  fontWeight: "var(--brand-heading-weight, 700)",
                }}
              >
                {(() => {
                  const name = product?.product_name || "";
                  const m = name.match(/^(.*?)\s*\((.+)\)\s*$/);
                  if (m) {
                    return (
                      <>
                        {m[1]}
                        <span className="block text-lg md:text-2xl font-semibold opacity-70 mt-1">
                          {m[2]}
                        </span>
                      </>
                    );
                  }
                  return name;
                })()}
              </h1>

              {product?.short_description && (
                <p className="text-base md:text-lg" style={{ color: "var(--body-color)" }}>
                  {product.short_description}
                </p>
              )}

              {/* Short features */}
              {(product?.short_features || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {product.short_features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {f.icon_url ? (
                        <img src={f.icon_url} alt="" className="w-6 h-6 object-contain" />
                      ) : f.icon_key ? (
                        <DynamicIcon
                          name={f.icon_key}
                          size={18}
                          style={{ color: "var(--brand-primary)" }}
                          className="shrink-0"
                        />
                      ) : (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: "var(--brand-primary)" }}
                        />
                      )}
                      <span className="text-xs" style={{ color: "var(--body-color)" }}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 flex-wrap pt-2">
                <span
                  className="text-3xl md:text-4xl font-black"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {currencySymbol}
                  {productPrice}
                </span>
                {lineThoughPrice && lineThoughPrice > productPrice && (
                  <span className="text-lg line-through text-gray-400">
                    {currencySymbol}
                    {lineThoughPrice}
                  </span>
                )}
                {discountPct > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--brand-primary-light)",
                      color: "var(--brand-primary-dark)",
                    }}
                  >
                    {discountPct}% OFF
                  </span>
                )}
              </div>

              {/* F2 — PDP price meta: flash countdown + sold count + tier + group hint. */}
              <PdpPriceMeta
                product={product}
                currencySymbol={currencySymbol}
                showSoldCount={showSoldCount}
                showViewCount={showViewCount}
              />

              {/* SKU display — variation_sku when a specific variation is
                  selected, otherwise the parent product_sku. Industry standard
                  (Shopify pattern): small grey text below price for buyer
                  reference + customer-support handoff. */}
              {(variationProduct?.variation_sku || product?.product_sku) && (
                <p className="text-xs text-gray-400 mt-1">
                  SKU:{" "}
                  <code className="font-mono text-gray-500 select-all">
                    {variationProduct?.variation_sku || product?.product_sku}
                  </code>
                </p>
              )}

              {/* Rating */}
              {(product?.avarage_review_ratting > 0 ||
                product?.total_review_ratting > 0) && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar
                        key={i}
                        size={15}
                        className={
                          i <= Math.round(parseFloat(rating)) ? "" : "text-gray-200"
                        }
                        style={
                          i <= Math.round(parseFloat(rating))
                            ? { color: "var(--accent-color)" }
                            : {}
                        }
                      />
                    ))}
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--body-color)" }}
                  >
                    {rating}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({product?.total_review_ratting || 0}+ reviews)
                  </span>
                </div>
              )}

              {/* Hero CTAs — scroll to order section */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="#order-section"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{
                    background: "var(--brand-primary)",
                    borderRadius: "var(--button-radius, 8px)",
                    color: "var(--button-text, #fff)",
                  }}
                >
                  Order Now <BsCartCheckFill size={14} />
                </a>
                <WhatsAppOrderButton
                  whatsappNumber={whatsappNumber}
                  productName={product?.product_name}
                  variantName={variantName}
                  price={productPrice}
                />
              </div>
            </div>

            {/* Right — product photo */}
            <div
              className="order-1 lg:order-2 relative"
              onContextMenu={allowImageDownload ? undefined : (e) => e.preventDefault()}
            >
              {product?.hero_corner_badge && (
                <span
                  className="absolute top-3 left-3 z-20 text-xs font-bold px-3 py-1.5 rounded-full shadow-md"
                  style={{
                    background: "var(--brand-primary)",
                    color: "var(--button-text, #fff)",
                  }}
                >
                  {product.hero_corner_badge}
                </span>
              )}
              <HeroGallery
                product={product}
                variationProduct={variationProduct}
              />
            </div>
          </section>

          {/* ════════════ ORDER SECTION ════════════ */}
          <section
            id="order-section"
            className="relative overflow-hidden rounded-2xl p-5 md:p-7 mb-8 scroll-mt-20"
            style={{ background: "var(--section-bg, #fff)" }}
          >
            {/* Theme floats anchored to the "order" section. Needs the relative
                wrapper above so the absolute floats anchor inside this card.
                pointer-events-none (in FloatingAssets) lets clicks reach the
                weight picker / Add-to-Cart underneath. */}
            <FloatingAssets assets={theme?.floating_assets} section="order" />
            <h2
              className="relative z-10 text-xl md:text-2xl font-bold mb-5"
              style={{ color: "var(--heading-color)" }}
            >
              Order Now
            </h2>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* --- left: variant + qty --- */}
              <div className="space-y-5">
                {/* Variations — axes only (spec-only attrs go in the Spec table).
                    V2 picker extracted to <VariationPicker> — handles swatch +
                    button + dropdown + swatch-no-hex fallback + OOS visual cue
                    + viewport overflow modal. State (selectedVariations) and
                    handlers (handleSelectVariation, findVariation) stay here
                    so the rest of this component (price/stock/cart/url-sync)
                    keeps working unchanged. */}
                {product?.is_variation &&
                  variantAxisAttributes(product)?.map((attr, ai) => (
                    <VariationPicker
                      key={attr?.attribute_id || ai}
                      product={product}
                      attribute={attr}
                      selectedVariations={selectedVariations}
                      findVariation={findVariation}
                      handleSelectVariation={handleSelectVariation}
                    />
                  ))}

                {/* Size chart */}
                {product?.size_chart && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowChart(!showChart)}
                      className="text-xs underline underline-offset-4"
                      style={{ color: "var(--brand-primary)" }}
                    >
                      📏 Size Chart
                    </button>
                    {showChart && (
                      <ChartModal
                        showChart={showChart}
                        setShowChart={setShowChart}
                        size_chart={product?.size_chart}
                      />
                    )}
                  </>
                )}

                {/* Stock — always show the live count alongside the badge so
                    buyers + testers can verify per-variation stock changes. */}
                <div className="flex items-center gap-2">
                  {stock > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-700">
                        In Stock
                        {showStockCountOnPdp && (
                          <span
                            className={
                              stock <= 10
                                ? "text-amber-600 ml-1.5"
                                : "text-emerald-700 ml-1.5"
                            }
                          >
                            · {stock} left{stock <= 10 ? "!" : ""}
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-red-600">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Qty + total */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--body-color)" }}
                    >
                      Quantity:
                    </span>
                    <div
                      className="flex items-center overflow-hidden border-2"
                      style={{
                        borderRadius: "var(--button-radius, 8px)",
                        borderColor: "var(--brand-primary-light)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={quantity <= 1}
                        className="px-3 py-2 disabled:opacity-30"
                        style={{ color: "var(--brand-primary)" }}
                      >
                        <HiMinus size={14} />
                      </button>
                      <input
                        readOnly
                        value={quantity}
                        className="w-12 text-center py-2 text-sm font-bold outline-none no-spin-buttons bg-transparent"
                        style={{ color: "var(--heading-color)" }}
                      />
                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={quantity >= stock}
                        className="px-3 py-2 disabled:opacity-30"
                        style={{ color: "var(--brand-primary)" }}
                      >
                        <HiOutlinePlus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "var(--body-color)" }}>
                      Total:
                    </span>
                    {/* Show strikethrough subtotal when there's a discount so
                        the savings are visible on the inline total too. */}
                    {shopSubtotals > shopTotal && (
                      <span className="text-sm line-through text-gray-400">
                        {currencySymbol}
                        {shopSubtotals}
                      </span>
                    )}
                    <span
                      className="text-2xl font-black"
                      style={{ color: "var(--brand-primary)" }}
                    >
                      {currencySymbol}
                      {shopTotal}
                    </span>
                  </div>
                </div>

                {/* Add to cart + wishlist + compare */}
                {stock > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold border-2 transition-all"
                      style={{
                        borderColor: "var(--brand-primary)",
                        color: cartAnim
                          ? "var(--button-text,#fff)"
                          : "var(--brand-primary)",
                        background: cartAnim ? "var(--brand-primary)" : "transparent",
                        borderRadius: "var(--button-radius, 8px)",
                      }}
                    >
                      {cartAnim ? (
                        <>
                          <BsCartCheckFill size={16} /> Added to Cart!
                        </>
                      ) : (
                        <>
                          <BsCart size={16} /> Add to Cart
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleWishlist}
                      className="p-3 border-2 transition-all"
                      style={{
                        borderRadius: "var(--button-radius, 8px)",
                        borderColor: isWishlisted ? "var(--brand-primary)" : "#e5e7eb",
                        background: isWishlisted ? "var(--brand-primary)" : "#fff",
                        color: isWishlisted ? "var(--button-text,#fff)" : "#9ca3af",
                      }}
                    >
                      {isWishlisted ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddToCompare}
                      title="Compare"
                      className="p-3 border-2 transition-all"
                      style={{
                        borderRadius: "var(--button-radius, 8px)",
                        borderColor: isCompare ? "var(--brand-primary)" : "#e5e7eb",
                        background: isCompare ? "var(--brand-primary)" : "#fff",
                        color: isCompare ? "var(--button-text,#fff)" : "#9ca3af",
                      }}
                    >
                      <GoGitCompare size={15} />
                    </button>
                  </div>
                )}

                {/* Price breakdown — folded into this card (no separate summary box) */}
                <div
                  className="rounded-xl p-4 space-y-2 text-sm"
                  style={{ background: "#fff", color: "var(--body-color)" }}
                >
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{shopSubtotals}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>- {currencySymbol}{totalDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span>
                      {division ? `${currencySymbol}${shippingCharge}` : "Select area"}
                    </span>
                  </div>
                  <div
                    className="flex justify-between items-center pt-2 mt-1 border-t border-dashed"
                    style={{ borderColor: "var(--brand-primary-light)" }}
                  >
                    <span className="font-bold" style={{ color: "var(--heading-color)" }}>
                      Grand Total
                    </span>
                    <span className="text-2xl font-black" style={{ color: "var(--brand-primary)" }}>
                      {currencySymbol}{shopGrandTotals}
                    </span>
                  </div>
                </div>

                {/* Confirm order */}
                {loading ? (
                  <div
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold rounded-xl"
                    style={{ background: "var(--brand-primary)", color: "var(--button-text,#fff)", opacity: 0.8 }}
                  >
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing order...
                  </div>
                ) : stock > 0 ? (
                  <button
                    type="submit"
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: "var(--brand-primary)",
                      color: "var(--button-text, #fff)",
                      borderRadius: "var(--button-radius, 8px)",
                    }}
                  >
                    Confirm Order <FaLock size={13} />
                  </button>
                ) : (
                  <div className="w-full py-3.5 text-center text-sm font-semibold bg-gray-200 text-gray-500 rounded-xl">
                    Out of Stock
                  </div>
                )}
                <p className="text-center text-[11px]" style={{ color: "var(--body-color)", opacity: 0.6 }}>
                  Your information is 100% safe and private
                </p>
              </div>

              {/* --- right: delivery form --- */}
              <div>
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
                  isAccordionOpen={true}
                  setIsAccordionOpen={setIsAccordionOpen}
                  customer_phone={customer_phone}
                  setUserPhone={handlePhoneChangeWithTracking}
                  setUserPhoneLogin={setUserPhoneLogin}
                  zoneLoading={zoneLoading}
                  zoneData={zoneData}
                />
              </div>
            </div>
          </section>
        </div>
      </form>

      {/* Description moved to a compact card right after the hero (see
          <DescriptionCard /> above). Reviews / shipping / return /
          recently-viewed are covered by themed ReviewsSection + OfferBanner
          perks + footer policy links. */}

      <div className="h-20 md:h-0" />
    </div>
  );
};

export default SingleProduct;
