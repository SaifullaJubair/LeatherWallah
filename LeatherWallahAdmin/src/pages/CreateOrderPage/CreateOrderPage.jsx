import { useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthProvider";
import { BASE_URL } from "../../utils/baseURL";
import useGetCategory from "../../hooks/useGetCategory";
import POSReceipt from "./POSReceipt";
import ProductQuickViewModal from "./ProductQuickViewModal";
import { divisions } from "../../data/division-data";
import { districts } from "../../data/district-data";
import { cities as pathaoCities } from "../../data/pathao-city-data";
import {
  FiSearch, FiX, FiPlus, FiMinus, FiShoppingCart,
  FiUser, FiTruck, FiTag, FiPrinter,
  FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import { MdStorefront } from "react-icons/md";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Shipping charges are DB-driven (Site Settings → Shipping Configuration).
// They are NOT hardcoded here: the server recomputes the same numbers from
// `settings.inside_dhaka_shipping_charge` / `outside_dhaka_shipping_charge`
// keyed off `billing_state`, so any constant here would silently disagree
// with what actually gets charged. 0 is the safe fallback while /setting
// is still loading — the cashier sees "…" rather than a wrong number.

// Pathao's own id for Dhaka city. The server's zone check is a name match on
// `billing_state` ("dhaka"), but we key the UI off the id because it is stable
// even if Pathao ever relabels the city.
const PATHAO_DHAKA_CITY_ID = 1;
const PER_PAGE_OPTIONS = [20, 50, 100];

const SkeletonCard = () => (
  <div className="border border-gray-200 rounded-xl p-2.5 animate-pulse">
    <div className="w-full h-28 bg-gray-200 rounded-lg mb-2" />
    <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-7 bg-gray-200 rounded" />
  </div>
);

// Pure helper — no state
// NOTE: user.user_division sometimes stores a district name (FE checkout form
// inconsistency). Strategy: try user_district first, fall back to user_division
// as district, then try user_division as a real division name.
function resolveCustomerDivDistrict(customer) {
  const normalize = (s) => (s || "").trim().toLowerCase();

  // 1. Try user_district as a district name
  let dist = null;
  if (customer?.user_district) {
    dist = districts.find(
      (d) =>
        normalize(d.name) === normalize(customer.user_district) ||
        d.bn_name === customer.user_district?.trim(),
    );
  }

  // 2. If no district match yet, try user_division as a district name
  //    (common case: Bagerhat, Barguna, Bandarban stored in user_division)
  if (!dist && customer?.user_division) {
    dist = districts.find(
      (d) =>
        normalize(d.name) === normalize(customer.user_division) ||
        d.bn_name === customer.user_division?.trim(),
    );
  }

  if (dist) {
    return { divId: dist.division_id, distId: dist.id };
  }

  // 3. Fall back: try user_division as an actual division name
  if (customer?.user_division) {
    const div = divisions.find(
      (d) =>
        normalize(d.name) === normalize(customer.user_division) ||
        d.bn_name === customer.user_division?.trim(),
    );
    if (div) return { divId: div.id, distId: "" };
  }

  return { divId: "", distId: "" };
}

// Map a saved customer onto a Pathao city. The POS now books against Pathao's
// city/zone list (same as the storefront), but existing User docs only carry
// the legacy free-text `user_division` / `user_district`, and those two fields
// are known to hold each other's values on older records — hence we try both
// against the Pathao city names before giving up. Returning "" just means the
// cashier picks the city manually; it is never a hard failure.
function resolveCustomerPathaoCity(customer) {
  const normalize = (s) => (s || "").trim().toLowerCase();
  const candidates = [customer?.user_division, customer?.user_district];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const city = pathaoCities.find(
      (c) => normalize(c.city_name) === normalize(candidate),
    );
    if (city) return city;
  }

  // Legacy rescue: the stored value may be a DISTRICT (e.g. "Savar") whose
  // parent division shares a Pathao city name. Resolve district → division,
  // then division → Pathao city.
  const { divId } = resolveCustomerDivDistrict(customer);
  if (divId) {
    const divName = divisions.find((d) => d.id === divId)?.name;
    if (divName) {
      const city = pathaoCities.find(
        (c) => normalize(c.city_name) === normalize(divName),
      );
      if (city) return city;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
const CreateOrderPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── Product grid state ───────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // ── Modal ────────────────────────────────────────────────────────
  const [modalProduct, setModalProduct] = useState(null);

  // ── Cart ────────────────────────────────────────────────────────
  const [lines, setLines] = useState([]);

  // ── Customer ────────────────────────────────────────────────────
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const debouncedCustomer = useDebounce(customerQuery);
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customerRef = useRef(null);

  // ── Delivery ────────────────────────────────────────────────────
  // City/zone mirror the storefront checkout so both channels speak Pathao's
  // vocabulary. `cityId` drives the charge (Dhaka vs outside) AND the courier
  // booking; `zoneId` is only needed by the courier, so it stays optional —
  // see the zone query below for why that matters at a POS counter.
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  // ── Discount ────────────────────────────────────────────────────
  const [discountType, setDiscountType] = useState("flat");
  const [discountInput, setDiscountInput] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  // ── Payment ──────────────────────────────────────────────────────
  const [paymentNote, setPaymentNote] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  // ── Submit ──────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState(null);

  // ── Reset page on filter change ──────────────────────────────────
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter, brandFilter, stockFilter, perPage]);

  // ── Product query ────────────────────────────────────────────────
  const productParams = useMemo(() => new URLSearchParams({
    page: String(page), limit: String(perPage),
    ...(debouncedSearch && { searchTerm: debouncedSearch }),
    ...(categoryFilter && { category_id: categoryFilter }),
    ...(brandFilter && { brand_id: brandFilter }),
    ...(stockFilter !== "all" && { stock_filter: stockFilter }),
  }), [page, perPage, debouncedSearch, categoryFilter, brandFilter, stockFilter]);

  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ["pos-products", page, perPage, debouncedSearch, categoryFilter, brandFilter, stockFilter],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/dashboard?${productParams}`, { credentials: "include" });
      return res.json();
    },
    staleTime: 30_000,
    keepPreviousData: true,
  });

  // ── Category + Brand queries ─────────────────────────────────────
  const { data: categoryData } = useGetCategory();
  const { data: brandData } = useQuery({
    queryKey: ["pos-brands"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/brand`, { credentials: "include" });
      return res.json();
    },
    staleTime: 300_000,
  });

  // ── Shop settings ────────────────────────────────────────────────
  // Shipping charges, free-delivery rule and VAT all live in the DB. staleTime
  // is deliberately short: the owner changes a rate in Site Settings and the
  // very next sale at the counter must already use it.
  const { data: settingData } = useQuery({
    queryKey: ["pos-setting"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/setting`, { credentials: "include" });
      return res.json();
    },
    staleTime: 30_000,
  });
  const setting = settingData?.data?.[0] || {};

  // ── Pathao zones for the chosen city ─────────────────────────────
  // This hits Pathao's live API through the backend. It can legitimately fail
  // (Pathao down, credentials not configured on a fresh shop) and the POS must
  // survive that: the zone is only needed for courier booking, never for the
  // price, so a failure downgrades to "book the courier later" instead of
  // blocking the sale with a customer standing at the counter.
  const {
    data: zoneData,
    isLoading: zoneLoading,
    isError: zoneError,
    refetch: refetchZone,
  } = useQuery({
    queryKey: ["pos-zones", selectedCityId],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/setting/zone?city_id=${selectedCityId}`, {
        credentials: "include",
      });
      const json = await res.json();
      // The endpoint answers 200 even when the upstream lookup failed, so a
      // non-array payload is treated as an error rather than "no zones".
      if (!Array.isArray(json?.data)) throw new Error("Zone lookup failed");
      return json;
    },
    enabled: deliveryType === "delivery" && !!selectedCityId,
    retry: 1,
    staleTime: 300_000,
  });
  const zones = zoneData?.data || [];

  // ── Customer search — block search if a customer is already selected ──
  useEffect(() => {
    if (selectedCustomer) return;           // already locked, don't re-search
    if (!debouncedCustomer.trim()) { setCustomerResults([]); return; }
    setCustomerSearching(true);
    fetch(`${BASE_URL}/user?page=1&limit=8&searchTerm=${encodeURIComponent(debouncedCustomer)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setCustomerResults(d?.data || []); setShowCustomerDrop(true); })
      .catch(() => {})
      .finally(() => setCustomerSearching(false));
  }, [debouncedCustomer, selectedCustomer]);

  useEffect(() => {
    const handler = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomerDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived data (memoized) ──────────────────────────────────────
  const products = useMemo(() => productData?.data || [], [productData]);
  const totalProducts = productData?.totalData || 0;
  const totalPages = Math.ceil(totalProducts / perPage);
  const categories = useMemo(() => (categoryData?.data || []).filter((c) => !c.parent_id), [categoryData]);
  const brands = useMemo(() => brandData?.data || [], [brandData]);
  const selectedCity = useMemo(
    () => pathaoCities.find((c) => String(c.city_id) === String(selectedCityId)) || null,
    [selectedCityId],
  );
  const isInsideDhaka = Number(selectedCityId) === PATHAO_DHAKA_CITY_ID;

  // ── Totals ───────────────────────────────────────────────────────
  // Everything below mirrors the server's recompute (order.recompute.ts) so
  // the cashier collects exactly what gets stored. The server remains the
  // authority — this is a preview, not a second source of truth.
  const subTotal = useMemo(
    () => lines.reduce((s, l) => s + l.unit_price * l.product_quantity, 0),
    [lines],
  );
  const rawDiscountInput = Number(discountInput) || 0;
  const discount = useMemo(() => {
    if (!rawDiscountInput) return 0;
    return discountType === "percent"
      ? Math.round(subTotal * Math.min(rawDiscountInput, 100) / 100)
      : Math.max(0, rawDiscountInput);
  }, [discountType, rawDiscountInput, subTotal]);

  // Shipping — per-line, same rules as the server: `inherit` lines split the
  // zone charge between them and are the only ones the global free-delivery
  // rule can waive; explicit per-product modes bypass that rule entirely.
  const shippingCost = useMemo(() => {
    if (deliveryType === "pickup") return 0;
    if (lines.length === 0) return 0;
    if (!selectedCityId) return 0;

    const zoneCharge = isInsideDhaka
      ? Number(setting.inside_dhaka_shipping_charge) || 0
      : Number(setting.outside_dhaka_shipping_charge) || 0;

    const inheritLines = lines.filter(
      (l) => !l.delivery_mode || l.delivery_mode === "inherit",
    );
    const overrideLines = lines.filter(
      (l) => l.delivery_mode && l.delivery_mode !== "inherit",
    );

    const inheritSubtotal = inheritLines.reduce(
      (s, l) => s + l.unit_price * l.product_quantity,
      0,
    );
    const freeType = setting.free_delivery_type;
    const freeMin = Number(setting.free_delivery_min_amount) || 0;
    const globalFreeApplies =
      setting.free_delivery_enabled === true &&
      (freeType === "always" ||
        (freeType === "min_order" && inheritSubtotal >= freeMin));

    const inheritShare =
      inheritLines.length > 0 && !globalFreeApplies
        ? Math.round(zoneCharge / inheritLines.length)
        : 0;

    let total = inheritLines.length * inheritShare;

    for (const line of overrideLines) {
      if (line.delivery_mode === "free") continue;
      if (line.delivery_mode === "flat") {
        total += Number(line.delivery_flat_amount) || 0;
        continue;
      }
      if (line.delivery_mode === "qty_threshold") {
        const threshold = Number(line.delivery_free_after_qty) || 0;
        if (threshold > 0 && line.product_quantity >= threshold) continue;
        // Below threshold: the server falls back to the inherit share when
        // there are inherit lines to share with, else the full zone charge.
        total += inheritLines.length > 0 ? inheritShare : zoneCharge;
      }
    }
    return total;
  }, [deliveryType, lines, selectedCityId, isInsideDhaka, setting]);

  const freeDeliveryApplied =
    deliveryType === "delivery" &&
    setting.free_delivery_enabled === true &&
    shippingCost === 0 &&
    lines.length > 0 &&
    !!selectedCityId;

  // VAT — per line, on the post-discount amount, matching the server. The
  // discount is apportioned across lines by value so a line's tax follows what
  // the customer actually pays for it. Rounded once at the end.
  const vatAmount = useMemo(() => {
    if (subTotal <= 0) return 0;
    const defaultPct = Number(setting.vat_percentage) || 0;
    let total = 0;
    for (const l of lines) {
      const override = Number(l.vat_percentage_override) || 0;
      const pct = override > 0 ? override : defaultPct;
      if (pct <= 0) continue;
      const lineTotal = l.unit_price * l.product_quantity;
      const lineShare = (lineTotal / subTotal) * discount;
      total += ((lineTotal - lineShare) * pct) / 100;
    }
    return Math.round(total);
  }, [lines, subTotal, discount, setting]);

  const grandTotal = Math.max(0, subTotal - discount + vatAmount + shippingCost);
  const paidNum = Number(paidAmount) || 0;
  const returnAmount = Math.max(0, paidNum - grandTotal);
  const dueAmount = Math.max(0, grandTotal - paidNum);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleAddToCart = useCallback((product, selectedVar, qty = 1) => {
    const unitPrice = selectedVar
      ? (selectedVar.variation_sale_price || selectedVar.variation_discount_price || selectedVar.variation_price)
      : (product.product_sale_price || product.product_price);
    setLines((prev) => {
      const existIdx = prev.findIndex(
        (l) => l.product_id === product._id && l.variation_id === (selectedVar?._id || null),
      );
      if (existIdx >= 0) {
        return prev.map((l, i) => i === existIdx ? { ...l, product_quantity: l.product_quantity + qty } : l);
      }
      return [...prev, {
        _lineId: Date.now() + Math.random(),
        product_id: product._id,
        product_name: product.product_name,
        product_thumbnail: selectedVar?.variation_image || selectedVar?.variation_images?.[0] || product.main_image,
        product_type: selectedVar ? "variation" : "simple",
        variations: product.variations || [],
        variation_id: selectedVar?._id || null,
        variation_label: selectedVar?.variation_name || "",
        unit_price: unitPrice,
        product_quantity: qty,
        // Preview-only copies of the server's pricing inputs. They are never
        // sent back — the server re-reads them from the product document —
        // but they let the counter total match the stored order.
        vat_percentage_override: Number(product.vat_percentage_override) || 0,
        delivery_mode: product.delivery_mode || "inherit",
        delivery_flat_amount: Number(product.delivery_flat_amount) || 0,
        delivery_free_after_qty: Number(product.delivery_free_after_qty) || 0,
      }];
    });
  }, []);

  const updateLineQty = useCallback((lineId, delta) =>
    setLines((prev) => prev.map((l) => l._lineId === lineId ? { ...l, product_quantity: Math.max(1, l.product_quantity + delta) } : l)),
  []);

  const updateLineVariation = useCallback((lineId, varId) =>
    setLines((prev) => prev.map((l) => {
      if (l._lineId !== lineId) return l;
      const chosen = l.variations.find((v) => v._id === varId);
      return {
        ...l,
        variation_id: varId,
        variation_label: chosen?.variation_name || "",
        unit_price: chosen?.variation_sale_price || chosen?.variation_discount_price || chosen?.variation_price || l.unit_price,
      };
    })),
  []);

  const removeLine = useCallback((lineId) => setLines((prev) => prev.filter((l) => l._lineId !== lineId)), []);

  const selectCustomer = useCallback((c) => {
    setSelectedCustomer(c);
    setCustomerQuery(`${c.user_name || ""} — ${c.user_phone}`);
    setShowCustomerDrop(false);
    // Auto-fill address
    if (c.user_address) setBillingAddress(c.user_address);
    // Saved customers predate the Pathao city picker, so this is best-effort:
    // no match just leaves the dropdown empty for the cashier to fill in.
    const city = resolveCustomerPathaoCity(c);
    if (city) {
      setSelectedCityId(String(city.city_id));
      setSelectedZoneId("");
    }
  }, []);

  const handlePrint = useCallback(() => {
    if (lines.length === 0) { toast.error("Add products before printing."); return; }
    window.print();
  }, [lines.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) { toast.error("Please add at least one product."); return; }
    const customerName = isWalkIn ? walkInName || "Walk-in Customer" : selectedCustomer?.user_name || "Customer";
    const customerPhone = isWalkIn ? walkInPhone : selectedCustomer?.user_phone;
    if (!customerPhone?.trim()) { toast.error("Customer phone is required."); return; }
    if (deliveryType === "delivery" && !billingAddress.trim()) { toast.error("Delivery address is required."); return; }
    if (deliveryType === "delivery" && !selectedCityId) { toast.error("Please select a city."); return; }

    const zoneName = zones.find((z) => String(z.zone_id) === String(selectedZoneId))?.zone_name;

    const orderPayload = {
      order_source: "admin",
      need_user_create: true,
      customer_name: customerName,
      customer_phone: customerPhone,
      billing_country: "Bangladesh",
      // billing_state MUST hold the city/division name: the server derives the
      // shipping zone from it (order.recompute.ts). These two were previously
      // swapped here, which is why the server's own recompute had to be
      // overridden for POS orders.
      billing_state: selectedCity?.city_name || "",
      billing_city: zoneName || selectedCity?.city_name || "",
      billing_address: deliveryType === "pickup" ? "Pickup" : billingAddress,
      shipping_location:
        deliveryType === "pickup"
          ? "Pickup"
          : isInsideDhaka
            ? `Inside Dhaka, ${setting.inside_dhaka_shipping_days || 0} Days`
            : `Outside Dhaka, ${setting.outside_dhaka_shipping_days || 0} Days`,
      shipping_cost: shippingCost,
      delivery_type: deliveryType,
      // Courier booking needs these. POS orders never carried them before, so
      // Pathao booking could not work at all from the counter. Zone stays
      // optional: if the live lookup failed, the order is still taken and the
      // zone can be set later from the order detail page.
      ...(deliveryType === "delivery" && selectedCity
        ? {
            pathao_city_id: Number(selectedCity.city_id),
            pathao_city_name: selectedCity.city_name,
            ...(selectedZoneId
              ? {
                  pathao_zone_id: Number(selectedZoneId),
                  pathao_zone_name: zoneName,
                }
              : {}),
          }
        : {}),
      sub_total_amount: subTotal,
      discount_amount: discount,
      admin_manual_discount: discount,
      manual_discount_reason: discountReason,
      grand_total_amount: grandTotal,
      paid_amount: paidNum,
      payment_method: "cod",
      payment_method_note: paymentNote || "cash",
      order_products: lines.map((l) => ({
        product_id: l.product_id,
        variation_id: l.variation_id || undefined,
        product_quantity: l.product_quantity,
        product_unit_price: l.unit_price,
        product_unit_final_price: l.unit_price,
        product_grand_total_price: l.unit_price * l.product_quantity,
        product_main_price: l.unit_price,
        product_main_discount_price: 0,
      })),
    };
    if (!isWalkIn && selectedCustomer?._id) {
      orderPayload.customer_id = selectedCustomer._id;
      orderPayload.need_user_create = false;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${BASE_URL}/order/create-admin`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      if (data?.success) {
        setLastInvoiceId(data?.data?.invoice_id);
        toast.success(`Order Created! Invoice: ${data?.data?.invoice_id}`);
        navigate(`/order?tab=all`);
      } else {
        throw new Error(data?.message || "Order creation failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Permission guard — AFTER all hooks ───────────────────────────
  if (!user?.role_id?.order_create_admin) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 font-medium">
        Access Denied — You need &quot;Create Order (POS)&quot; permission.
      </div>
    );
  }

  const receiptCustomer = {
    name: isWalkIn ? walkInName || "Walk-in Customer" : selectedCustomer?.user_name,
    phone: isWalkIn ? walkInPhone : selectedCustomer?.user_phone,
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 flex flex-col overflow-hidden">
      <POSReceipt
        lines={lines} customer={receiptCustomer}
        delivery={{ address: deliveryType === "pickup" ? "Pickup" : billingAddress }}
        discount={discount} shippingCost={shippingCost} vatAmount={vatAmount} grandTotal={grandTotal}
        invoiceId={lastInvoiceId} shopName={user?.admin_name}
      />

      {modalProduct && (
        <ProductQuickViewModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blueColor-600 rounded-lg">
            <MdStorefront size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-none">POS — Create Order</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">{totalProducts} products</p>
          </div>
        </div>
        <button type="button" onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
          <FiPrinter size={13} /> Print
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT — Product grid ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-gray-200 bg-white">

          {/* Filters */}
          <div className="shrink-0 p-3 border-b border-gray-100 bg-white">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[160px] flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blueColor-500 bg-white">
                <FiSearch size={13} className="text-gray-400 shrink-0" />
                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..." className="flex-1 text-sm outline-none bg-transparent" />
                {searchInput && (
                  <button type="button" onClick={() => setSearchInput("")} className="text-gray-400 hover:text-gray-600">
                    <FiX size={12} />
                  </button>
                )}
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blueColor-500">
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.category_name}</option>)}
              </select>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blueColor-500">
                <option value="">All Brands</option>
                {brands.map((b) => <option key={b._id} value={b._id}>{b.brand_name}</option>)}
              </select>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blueColor-500">
                <option value="all">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low ≤10</option>
              </select>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blueColor-500">
                {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}/page</option>)}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FiShoppingCart size={28} className="mb-2 opacity-40" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                {products.map((p) => {
                  const hasVariations = p.variations?.length > 0;
                  const totalStock = hasVariations
                    ? p.variations.reduce((s, v) => s + (v.variation_quantity || 0), 0)
                    : p.product_quantity || 0;
                  const availableVars = hasVariations ? p.variations.filter((v) => v.variation_quantity > 0).length : null;
                  const allVarsOOS = hasVariations && availableVars === 0;
                  const someVarsOOS = hasVariations && availableVars > 0 && availableVars < p.variations.length;
                  const isOOS = hasVariations ? allVarsOOS : totalStock <= 0;
                  const simplePrice = p.product_sale_price || p.product_price;
                  const simpleOrig = p.product_sale_price ? p.product_price : null;
                  let priceDisplay, origDisplay;
                  if (hasVariations) {
                    const vPrices = p.variations.map((v) => v.variation_sale_price || v.variation_discount_price || v.variation_price).filter(Boolean);
                    const minP = Math.min(...vPrices);
                    const maxP = Math.max(...vPrices);
                    priceDisplay = minP === maxP ? `৳${minP?.toLocaleString()}` : `৳${minP?.toLocaleString()} – ৳${maxP?.toLocaleString()}`;
                    origDisplay = null;
                  } else {
                    priceDisplay = `৳${simplePrice?.toLocaleString()}`;
                    origDisplay = simpleOrig;
                  }
                  const inCart = lines.some((l) => l.product_id === p._id);
                  const cartQty = lines.filter((l) => l.product_id === p._id).reduce((s, l) => s + l.product_quantity, 0);

                  return (
                    <div key={p._id}
                      className={`border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${inCart ? "border-blueColor-400 bg-blueColor-50/20" : "border-gray-200 bg-white"}`}
                      onClick={() => setModalProduct(p)}
                    >
                      <div className="relative">
                        {p.main_image ? (
                          <img src={p.main_image} alt={p.product_name} className="w-full h-28 object-cover" />
                        ) : (
                          <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                            <FiShoppingCart size={18} className="text-gray-300" />
                          </div>
                        )}
                        {isOOS && (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                            <span className="bg-white text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Out of Stock</span>
                          </div>
                        )}
                        {hasVariations ? (
                          <span className="absolute top-1.5 left-1.5 bg-blueColor-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {p.variations.length} variants
                          </span>
                        ) : (simpleOrig && simpleOrig > simplePrice) ? (
                          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                            -{Math.round(((simpleOrig - simplePrice) / simpleOrig) * 100)}%
                          </span>
                        ) : null}
                        {someVarsOOS && !isOOS && (
                          <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {availableVars}/{p.variations.length} avail
                          </span>
                        )}
                        {!hasVariations && totalStock > 0 && totalStock <= 10 && (
                          <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                            {totalStock} left
                          </span>
                        )}
                        {inCart && (
                          <span className="absolute bottom-1.5 right-1.5 bg-blueColor-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            ✓ {cartQty}
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">{p.product_name}</p>
                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-blueColor-700">{priceDisplay}</span>
                          {origDisplay && <span className="text-[10px] text-gray-400 line-through">৳{origDisplay?.toLocaleString()}</span>}
                        </div>
                        {p.product_sku && <p className="text-[9px] text-gray-400 mb-1">SKU: {p.product_sku}</p>}
                        {hasVariations ? (
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setModalProduct(p); }}
                            disabled={isOOS}
                            className={`w-full py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${isOOS ? "border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50" : inCart ? "bg-blueColor-600 text-white" : "border border-purple-400 text-purple-600 hover:bg-purple-600 hover:text-white"}`}>
                            {isOOS ? "Out of Stock" : inCart ? "＋ More Variant" : "Select Variant"}
                          </button>
                        ) : (
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); if (!isOOS) handleAddToCart(p, null, 1); }}
                            disabled={isOOS}
                            className={`w-full py-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${isOOS ? "border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50" : inCart ? "bg-blueColor-600 text-white" : "border border-blueColor-400 text-blueColor-600 hover:bg-blueColor-600 hover:text-white"}`}>
                            <FiPlus size={10} /> {isOOS ? "Out of Stock" : inCart ? "Add More" : "Add"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalProducts)} of {totalProducts}
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                    <FiChevronLeft size={13} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                    return (
                      <button key={pg} type="button" onClick={() => setPage(pg)}
                        className={`w-7 h-7 text-xs rounded border transition-all ${page === pg ? "bg-blueColor-600 text-white border-blueColor-600" : "border-gray-300 hover:bg-gray-50"}`}>
                        {pg}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                    <FiChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT panel ── */}
        <div className="w-80 xl:w-96 shrink-0 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">

            {/* Cart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiShoppingCart size={14} className="text-blueColor-600" />
                  <span className="text-sm font-semibold text-gray-700">Cart</span>
                  {lines.length > 0 && (
                    <span className="bg-blueColor-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{lines.length}</span>
                  )}
                </div>
                {lines.length > 0 && (
                  <button type="button" onClick={() => setLines([])} className="text-[11px] text-red-500 hover:underline">Clear</button>
                )}
              </div>
              {lines.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-gray-400">
                  <FiShoppingCart size={22} className="mb-1.5 opacity-40" />
                  <p className="text-xs">Click products to add</p>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {lines.map((line) => (
                    <div key={line._lineId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      {line.product_thumbnail ? (
                        <img src={line.product_thumbnail} alt="" className="w-9 h-9 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                          <FiShoppingCart size={12} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 truncate">{line.product_name}</p>
                        {line.product_type === "variation" && line.variations.length > 0 ? (
                          <select value={line.variation_id || ""}
                            onChange={(e) => updateLineVariation(line._lineId, e.target.value)}
                            className="mt-0.5 text-[10px] border border-gray-300 rounded px-1 py-0.5 bg-white w-full">
                            {line.variations.map((v) => (
                              <option key={v._id} value={v._id}>
                                {v.variation_name} — ৳{v.variation_sale_price || v.variation_discount_price || v.variation_price}
                              </option>
                            ))}
                          </select>
                        ) : line.variation_label ? (
                          <p className="text-[10px] text-gray-400">{line.variation_label}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button type="button" onClick={() => updateLineQty(line._lineId, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100">
                          <FiMinus size={9} />
                        </button>
                        <span className="w-6 text-center text-[11px] font-bold">{line.product_quantity}</span>
                        <button type="button" onClick={() => updateLineQty(line._lineId, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100">
                          <FiPlus size={9} />
                        </button>
                      </div>
                      <div className="text-right shrink-0 w-14">
                        <p className="text-[11px] font-bold text-blueColor-700">৳{(line.unit_price * line.product_quantity).toLocaleString()}</p>
                        <p className="text-[9px] text-gray-400">৳{line.unit_price}</p>
                      </div>
                      <button type="button" onClick={() => removeLine(line._lineId)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                        <FiX size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <FiUser size={13} className="text-blueColor-600" />
                <span className="text-sm font-semibold text-gray-700">Customer</span>
              </div>
              <div className="flex gap-1.5 mb-2.5">
                {["walkin", "existing"].map((t) => (
                  <button key={t} type="button"
                    onClick={() => {
                      setIsWalkIn(t === "walkin");
                      setSelectedCustomer(null);
                      setCustomerQuery("");
                      setSelectedDivisionId("");
                      setSelectedDistrictId("");
                      setBillingAddress("");
                    }}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all ${(t === "walkin") === isWalkIn ? "bg-blueColor-600 text-white border-blueColor-600" : "bg-white text-gray-600 border-gray-300"}`}>
                    {t === "walkin" ? "Walk-in" : "Search Existing"}
                  </button>
                ))}
              </div>
              {isWalkIn ? (
                <div className="space-y-2">
                  <input type="text" value={walkInName} onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="Customer name (optional)"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500" />
                  <input type="text" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="Phone * (01XXXXXXXXX)"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500" />
                </div>
              ) : (
                <div ref={customerRef} className="relative">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blueColor-500 bg-white">
                    <FiSearch size={12} className="text-gray-400 shrink-0" />
                    <input type="text" value={customerQuery}
                      onChange={(e) => { setCustomerQuery(e.target.value); setSelectedCustomer(null); }}
                      onFocus={() => customerResults.length > 0 && setShowCustomerDrop(true)}
                      placeholder="Search by name or phone..."
                      className="flex-1 text-xs outline-none bg-transparent" />
                    {customerSearching && <span className="text-[10px] text-gray-400">...</span>}
                  </div>
                  {showCustomerDrop && customerResults.length > 0 && (
                    <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {customerResults.map((c) => (
                        <li key={c._id} onClick={() => selectCustomer(c)}
                          className="px-3 py-2 hover:bg-blueColor-50 cursor-pointer">
                          <p className="text-xs font-medium">{c.user_name}</p>
                          <p className="text-[10px] text-gray-500">
                            {c.user_phone}
                            {c.user_division && <span className="ml-1 text-gray-400">· {c.user_division}{c.user_district ? `, ${c.user_district}` : ""}</span>}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedCustomer && (
                    <div className="mt-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0">✓</span>
                          <span className="font-medium truncate">{selectedCustomer.user_name}</span>
                          <span className="text-green-600/70 shrink-0">{selectedCustomer.user_phone}</span>
                        </div>
                        <button type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerQuery("");
                            setSelectedDivisionId("");
                            setSelectedDistrictId("");
                            setBillingAddress("");
                          }}
                          className="shrink-0 p-0.5 rounded hover:bg-red-100 text-green-600 hover:text-red-500 transition-colors">
                          <FiX size={12} />
                        </button>
                      </div>
                      {(selectedCustomer.user_division || selectedCustomer.user_district) && (
                        <p className="text-[10px] text-green-600/70 mt-0.5 ml-4">
                          {[selectedCustomer.user_division, selectedCustomer.user_district].filter(Boolean).join(", ")}
                          {selectedCustomer.user_address && ` — ${selectedCustomer.user_address}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <FiTruck size={13} className="text-blueColor-600" />
                <span className="text-sm font-semibold text-gray-700">Delivery</span>
              </div>
              <div className="flex gap-1.5 mb-3">
                {["delivery", "pickup"].map((dt) => (
                  <button key={dt} type="button" onClick={() => setDeliveryType(dt)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all ${deliveryType === dt ? "bg-blueColor-600 text-white border-blueColor-600" : "bg-white text-gray-600 border-gray-300"}`}>
                    {dt === "delivery" ? "Home Delivery" : "Pickup (Free)"}
                  </button>
                ))}
              </div>
              {deliveryType === "delivery" && (
                <div className="space-y-2">
                  <select value={selectedCityId}
                    onChange={(e) => { setSelectedCityId(e.target.value); setSelectedZoneId(""); }}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500 bg-white">
                    <option value="">Select City *</option>
                    {pathaoCities.map((c) => <option key={c.city_id} value={c.city_id}>{c.city_name.trim()}</option>)}
                  </select>
                  <select value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    disabled={!selectedCityId || zoneLoading || zoneError}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500 bg-white disabled:opacity-50">
                    <option value="">
                      {zoneLoading ? "Loading zones…" : zoneError ? "Zones unavailable" : "Select Zone (for courier)"}
                    </option>
                    {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                  </select>
                  {/* The zone lookup goes to Pathao live, so it can fail while
                      the shop is perfectly able to sell. Never block the sale —
                      say what is lost (courier booking) and offer a retry. */}
                  {zoneError && (
                    <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span>Zone list unavailable — you can still take the order.</span>
                      <button type="button" onClick={() => refetchZone()}
                        className="underline shrink-0 hover:text-amber-900">Retry</button>
                    </div>
                  )}
                  {selectedCityId && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${isInsideDhaka ? "bg-green-50 text-green-700 border border-green-200" : "bg-orange-50 text-orange-700 border border-orange-200"}`}>
                      <span>{isInsideDhaka ? "✓" : "→"}</span>
                      <span>
                        {freeDeliveryApplied
                          ? `${isInsideDhaka ? "Inside" : "Outside"} Dhaka — Free delivery`
                          : `${isInsideDhaka ? "Inside" : "Outside"} Dhaka — ৳${shippingCost}`}
                      </span>
                    </div>
                  )}
                  <input type="text" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Full address (Road, Area, Flat...) *"
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500" />
                </div>
              )}
            </div>

            {/* Discount */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <FiTag size={13} className="text-blueColor-600" />
                  <span className="text-sm font-semibold text-gray-700">Discount</span>
                </div>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden text-[10px] font-semibold">
                  <button type="button"
                    onClick={() => setDiscountType("flat")}
                    className={`px-2.5 py-1 transition-all ${discountType === "flat" ? "bg-blueColor-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                    ৳ Flat
                  </button>
                  <button type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`px-2.5 py-1 transition-all ${discountType === "percent" ? "bg-blueColor-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                    % Off
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none select-none">
                    {discountType === "percent" ? "%" : "৳"}
                  </span>
                  <input
                    type="number" min={0} max={discountType === "percent" ? 100 : undefined}
                    value={discountInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (discountType === "percent" && Number(v) > 100) return;
                      setDiscountInput(v);
                    }}
                    placeholder={discountType === "percent" ? "0–100" : "Amount"}
                    className="w-full border border-gray-300 rounded-lg pl-6 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500" />
                </div>
                <input type="text" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500" />
              </div>
              {discount > 0 && (
                <div className="mt-2 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                  {discountType === "percent"
                    ? `${rawDiscountInput}% off → saving ৳${discount.toLocaleString()}`
                    : `Flat ৳${discount.toLocaleString()} off`}
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <p className="text-sm font-semibold text-gray-700 mb-2.5">Payment</p>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-blueColor-50 border border-blueColor-200 mb-3">
                <span className="text-[11px] font-bold text-blueColor-700 shrink-0">COD</span>
                <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Note: cash / bKash / bank..."
                  className="flex-1 text-[11px] border-0 border-b border-blueColor-200 bg-transparent focus:outline-none text-gray-600 placeholder-gray-400" />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                    Advance / Cash Received (৳)
                    <span className="ml-1 font-normal text-gray-400">— কত পেয়েছেন?</span>
                  </label>
                  <input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blueColor-500" />
                </div>
                {paidNum > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {returnAmount > 0 && (
                      <div className="px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-[9px] text-green-600 font-medium uppercase tracking-wide">Change Back</p>
                        <p className="text-sm font-bold text-green-700">৳{returnAmount.toLocaleString()}</p>
                      </div>
                    )}
                    {dueAmount > 0 && (
                      <div className="px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-[9px] text-red-600 font-medium uppercase tracking-wide">Still Due</p>
                        <p className="text-sm font-bold text-red-700">৳{dueAmount.toLocaleString()}</p>
                      </div>
                    )}
                    {returnAmount === 0 && dueAmount === 0 && (
                      <div className="col-span-2 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg text-center">
                        <p className="text-[11px] font-bold text-green-700">✓ Exact Amount</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-3 py-2.5 bg-blueColor-600">
                <p className="text-sm font-semibold text-white">Order Summary</p>
              </div>
              <div className="p-3 space-y-1.5">
                {lines.map((l) => (
                  <div key={l._lineId} className="flex justify-between text-[11px] text-gray-600">
                    <span className="flex-1 truncate pr-2">
                      {l.product_name}
                      {l.variation_label && <span className="text-gray-400"> · {l.variation_label}</span>}
                      {" × "}{l.product_quantity}
                    </span>
                    <span className="font-semibold shrink-0">৳{(l.unit_price * l.product_quantity).toLocaleString()}</span>
                  </div>
                ))}
                {lines.length === 0 && <p className="text-[11px] text-gray-400 text-center py-1">No items</p>}
                <div className="border-t border-dashed border-gray-200 pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">৳{subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">
                      {deliveryType === "pickup" || freeDeliveryApplied
                        ? <span className="text-green-600">Free</span>
                        : `৳${shippingCost}`}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Discount{discountType === "percent" && rawDiscountInput > 0 && <span className="ml-1 text-[10px]">({rawDiscountInput}%)</span>}</span>
                      <span>− ৳{discount.toLocaleString()}</span>
                    </div>
                  )}
                  {vatAmount > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>VAT</span>
                      <span className="font-medium">৳{vatAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="text-sm font-bold text-gray-800">Total</span>
                    <span className="text-base font-extrabold text-blueColor-700">৳{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="shrink-0 p-3 border-t border-gray-200 bg-white space-y-2">
            <button type="submit" disabled={submitting || lines.length === 0}
              className="w-full py-2.5 rounded-xl bg-blueColor-600 hover:bg-blueColor-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-md">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating...
                </span>
              ) : "Confirm Order"}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={handlePrint} disabled={lines.length === 0}
                className="flex-1 py-1.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40">
                <FiPrinter size={12} /> Print Invoice
              </button>
              <button type="button" onClick={() => navigate("/order")}
                className="flex-1 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderPage;
