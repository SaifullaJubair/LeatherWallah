import { useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { FiEdit } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import { BsStarFill, BsStar } from "react-icons/bs";

import { BASE_URL } from "../../../utils/baseURL";
import { AuthContext } from "../../../context/AuthProvider";
import useDebounced from "../../../hooks/useDebounced";
import useGetCategory from "../../../hooks/useGetCategory";
import NoDataFound from "../../../shared/NoDataFound/NoDataFound";
import { LoaderOverlay } from "../../../components/common/loader/LoderOverley";
import Pagination from "../../../components/common/pagination/Pagination";

import ProductImagesModal from "../../../components/ProductList/ProductImagesModal";
import ProductVideoModal from "../../../components/ProductList/ProductVideoModal";
import ProductPriceModal from "../../../components/ProductList/ProductPriceModal";
import ProductStockModal from "../../../components/ProductList/ProductStockModal";
import ProductVariationsModal from "../../../components/ProductList/ProductVariationsModal";
import ProductAnalyticsSeedModal from "../../../components/ProductList/ProductAnalyticsSeedModal";

// A2 (2026-06-04) — operational product list dashboard.
// Backed by /product/dashboard-rich which returns each row pre-annotated with
// _variation_count, _stock_total, _is_low_stock, _is_out_of_stock, _flags,
// _has_theme, _has_page_content. Each column with multi-item / complex data
// opens its own focused modal (Images / Video / Price / Stock / Variations).
// Inline toggles (status, trending) write through PATCH /product/quick which
// is a whitelisted partial update — does NOT trigger the full-rebuild trap.

const FlagBadge = ({ flag }) => {
  const meta = {
    trending: { label: "⭐ Trend", color: "bg-yellow-100 text-yellow-700" },
    campaign: { label: "🎯 Campaign", color: "bg-pink-100 text-pink-700" },
    theme: { label: "🎨 Theme", color: "bg-purple-100 text-purple-700" },
    page_content: { label: "📄 PG", color: "bg-blue-100 text-blue-700" },
    tier_pricing: { label: "🏷 Tier", color: "bg-orange-100 text-orange-700" },
    weight: { label: "⚖ Wt", color: "bg-amber-100 text-amber-700" },
    used: { label: "🔁 Used", color: "bg-gray-200 text-gray-700" },
    refurbished: {
      label: "♻ Refurb",
      color: "bg-gray-200 text-gray-700",
    },
  }[flag] || { label: flag, color: "bg-gray-100 text-gray-600" };
  return (
    <span
      className={`inline-block text-[10px] px-1 py-0.5 rounded font-semibold ${meta.color}`}
    >
      {meta.label}
    </span>
  );
};

const timeAgo = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

const ProductListTablePage = () => {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    stock: "",
    has_variation: "",
    category_id: "",
    has_theme: "",
    product_type: "",
  });
  const [sort, setSort] = useState("new");

  // Modal state — only one open at a time, single source of truth.
  const [modal, setModal] = useState(null); // { type, product }
  // Per-row toggle in-flight guard (Set of product _ids currently in PATCH).
  // Prevents rapid-click double-fire where the 2nd click reads stale cached
  // status and sends the wrong target value.
  const [togglingIds, setTogglingIds] = useState(new Set());

  const searchText = useDebounced({ searchQuery: searchValue, delay: 400 });
  useEffect(() => {
    setSearchTerm(searchText);
    setPage(1);
  }, [searchText]);

  const { data: categoryData } = useGetCategory();

  const queryStr = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", page);
    p.set("limit", limit);
    if (searchTerm) p.set("searchTerm", searchTerm);
    if (sort) p.set("sort", sort);
    Object.entries(filters).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    return p.toString();
  }, [page, limit, searchTerm, sort, filters]);

  const {
    data: productData = {},
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`/api/v1/product/dashboard-rich?${queryStr}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/dashboard-rich?${queryStr}`, {
        credentials: "include",
      });
      return res.json();
    },
  });

  const quickPatch = async (productId, body, optimisticLabel = "Updated") => {
    // In-flight guard — block re-fire on the same product until current
    // request completes.
    if (togglingIds.has(productId)) return;
    setTogglingIds((prev) => {
      const copy = new Set(prev);
      copy.add(productId);
      return copy;
    });
    try {
      const res = await fetch(`${BASE_URL}/product/quick`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ _id: productId, ...body }),
      });
      const data = await res.json();
      if (data?.statusCode === 200 && data?.success) {
        toast.success(optimisticLabel, { autoClose: 800 });
        refetch();
      } else {
        toast.error(data?.message || "Update failed", { autoClose: 1500 });
      }
    } catch {
      toast.error("Network error", { autoClose: 1500 });
    } finally {
      setTogglingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(productId);
        return copy;
      });
    }
  };

  const handleToggleStatus = (item) => {
    const next = item.product_status === "active" ? "in-active" : "active";
    quickPatch(
      item._id,
      { product_status: next },
      `Status → ${next === "active" ? "Active" : "Inactive"}`,
    );
  };

  const handleToggleTrending = (item) => {
    quickPatch(
      item._id,
      { trending_product: !item.trending_product },
      item.trending_product ? "Trending cleared" : "Marked trending",
    );
  };

  const handleDelete = (item) => {
    Swal.fire({
      title: "Delete this product?",
      text: `${item?.product_name} will be removed. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        const res = await fetch(`${BASE_URL}/product`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ _id: item._id }),
        });
        const data = await res.json();
        if (data?.statusCode === 200 && data?.success) {
          refetch();
          Swal.fire({
            title: "Deleted",
            text: `${item.product_name} removed`,
            icon: "success",
          });
        } else {
          toast.error(data?.message || "Delete failed", { autoClose: 1500 });
        }
      } catch {
        toast.error("Network error", { autoClose: 1500 });
      }
    });
  };

  const openModal = (type, product) => setModal({ type, product });
  const closeModal = () => setModal(null);

  if (isLoading) return <LoaderOverlay />;
  if (!user?.role_id?.product_show) return null;

  const items = productData?.data || [];
  const total = productData?.totalData || 0;

  return (
    <div className="bg-white rounded-lg py-4 px-3 shadow">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h1 className="text-xl font-semibold">Products</h1>
        {user?.role_id?.product_create && (
          <Link
            to="/product/product-create"
            className="rounded-md py-2 px-3 bg-primaryColor hover:bg-blue-500 text-white text-sm"
          >
            + Create Product
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-2 border-b pb-3 mb-3">
        <div>
          <label className="block text-[10px] text-gray-500 uppercase">
            Search
          </label>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Name / SKU / barcode..."
            className="px-2 py-1 border rounded text-sm w-56"
          />
        </div>
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => {
            setFilters({ ...filters, status: v });
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "in-active", label: "Inactive" },
          ]}
        />
        <FilterSelect
          label="Stock"
          value={filters.stock}
          onChange={(v) => {
            setFilters({ ...filters, stock: v });
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            { value: "in", label: "In stock" },
            { value: "low", label: "Low" },
            { value: "out", label: "Out" },
          ]}
        />
        <FilterSelect
          label="Has variation"
          value={filters.has_variation}
          onChange={(v) => {
            setFilters({ ...filters, has_variation: v });
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
        <FilterSelect
          label="Has theme"
          value={filters.has_theme}
          onChange={(v) => {
            setFilters({ ...filters, has_theme: v });
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />
        <FilterSelect
          label="Type"
          value={filters.product_type}
          onChange={(v) => {
            setFilters({ ...filters, product_type: v });
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            { value: "simple", label: "Simple" },
            { value: "variable", label: "Variable" },
            { value: "digital", label: "Digital" },
            { value: "combo", label: "Combo" },
            { value: "preorder", label: "Preorder" },
            { value: "subscription", label: "Subscription" },
          ]}
        />
        <FilterSelect
          label="Category"
          value={filters.category_id}
          onChange={(v) => {
            setFilters({ ...filters, category_id: v });
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            ...((categoryData?.data || []).map((c) => ({
              value: c._id,
              label: c.category_name,
            }))),
          ]}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: "new", label: "Newest" },
            { value: "updated_desc", label: "Recently updated" },
            { value: "name_asc", label: "Name A-Z" },
            { value: "name_desc", label: "Name Z-A" },
            { value: "price_desc", label: "Price high→low" },
            { value: "price_asc", label: "Price low→high" },
            { value: "sold_desc", label: "Best selling" },
          ]}
        />
        <FilterSelect
          label="Per page"
          value={String(limit)}
          onChange={(v) => {
            setLimit(Number(v));
            setPage(1);
          }}
          options={[
            { value: "10", label: "10" },
            { value: "25", label: "25" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
        />
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <NoDataFound />
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-[#fff9ee] text-gray-900">
              <tr className="text-center">
                <th className="p-2">SL</th>
                <th className="p-2">Image</th>
                <th className="p-2">Video</th>
                <th className="p-2 text-left">Product</th>
                <th className="p-2">Category</th>
                <th className="p-2">Price</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Variants</th>
                <th className="p-2">Status</th>
                <th className="p-2">Trend</th>
                <th className="p-2">Flags</th>
                <th className="p-2">Sold/Views</th>
                <th className="p-2">Updated</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => {
                const sl = (page - 1) * limit + i + 1;
                const hasDiscount =
                  p.product_discount_price &&
                  p.product_discount_price > 0 &&
                  p.product_discount_price !== p.product_price;
                const stockClass = p._is_out_of_stock
                  ? "text-red-600 font-bold"
                  : p._is_low_stock
                    ? "text-orange-600 font-semibold"
                    : "text-gray-700";
                return (
                  <tr
                    key={p._id}
                    className={`border-t ${
                      i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                    }`}
                  >
                    <td className="p-2 text-center text-gray-500">{sl}</td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => openModal("images", p)}
                        title="Edit images"
                        className="block"
                      >
                        {p.main_image ? (
                          <img
                            src={p.main_image}
                            alt=""
                            className="w-14 h-14 object-cover rounded border hover:border-primaryColor"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded border flex items-center justify-center text-[10px] text-gray-400 hover:border-primaryColor">
                            no img
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => openModal("video", p)}
                        title="Edit video"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {p.main_video || p.video_link ? "🎥 view" : "+ add"}
                      </button>
                    </td>
                    <td className="p-2">
                      <div className="font-semibold text-gray-900">
                        {p.product_name}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {p.product_sku || "no sku"}
                      </div>
                      {p.product_type && p.product_type !== "simple" && (
                        <div className="text-[10px] text-purple-700 uppercase font-semibold mt-0.5">
                          {p.product_type}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-center text-xs">
                      {p.category_id?.category_name || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => openModal("price", p)}
                        title="Edit price"
                        className="block w-full hover:bg-blue-50 rounded py-0.5"
                      >
                        <div className="font-semibold text-gray-900">
                          ৳{p.product_price ?? 0}
                        </div>
                        {hasDiscount && (
                          <div className="text-[11px] text-gray-400 line-through">
                            ৳{p.product_discount_price}
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => openModal("stock", p)}
                        title="Edit stock"
                        className={`block w-full hover:bg-blue-50 rounded py-0.5 ${stockClass}`}
                      >
                        {p._stock_total}
                      </button>
                    </td>
                    <td className="p-2 text-center">
                      {p._variation_count > 0 ? (
                        <button
                          type="button"
                          onClick={() => openModal("variations", p)}
                          title="View / edit variations"
                          className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded hover:bg-purple-200"
                        >
                          {p._variation_count} var
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        disabled={
                          !user?.role_id?.product_update ||
                          togglingIds.has(p._id)
                        }
                        onClick={() => handleToggleStatus(p)}
                        className={`text-[10px] px-2 py-1 rounded font-semibold ${
                          p.product_status === "active"
                            ? "bg-bgBtnActive text-btnActiveColor"
                            : "bg-bgBtnInactive text-btnInactiveColor"
                        } disabled:opacity-50`}
                      >
                        {p.product_status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        disabled={
                          !user?.role_id?.product_update ||
                          togglingIds.has(p._id)
                        }
                        onClick={() => handleToggleTrending(p)}
                        title="Toggle trending"
                        className="disabled:opacity-50"
                      >
                        {p.trending_product ? (
                          <BsStarFill className="text-yellow-500" size={18} />
                        ) : (
                          <BsStar className="text-gray-300" size={18} />
                        )}
                      </button>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1 justify-center max-w-[140px]">
                        {p._flags?.length ? (
                          p._flags.map((f) => <FlagBadge key={f} flag={f} />)
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center text-xs text-gray-600">
                      {user?.role_id?.product_update ? (
                        <button
                          type="button"
                          onClick={() => openModal("analytics_seed", p)}
                          title="Seed sold/view count"
                          className="hover:underline hover:text-primaryColor"
                        >
                          {p.sold_count || 0} / {p.view_count || 0}
                        </button>
                      ) : (
                        <>{p.sold_count || 0} / {p.view_count || 0}</>
                      )}
                    </td>
                    <td
                      className="p-2 text-center text-xs text-gray-500"
                      title={p.updatedAt}
                    >
                      {timeAgo(p.updatedAt)}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user?.role_id?.product_update && (
                          <Link
                            to={`/product/product-update/${p._id}`}
                            title="Full edit"
                          >
                            <FiEdit
                              size={18}
                              className="text-gray-500 hover:text-gray-700"
                            />
                          </Link>
                        )}
                        {user?.role_id?.product_update && (
                          <Link
                            to={`/product/page-content/${p._id}`}
                            title="Page content (theme/FAQ/nutrition)"
                            className="text-purple-500 hover:text-purple-700 text-xs font-bold"
                          >
                            PG
                          </Link>
                        )}
                        {user?.role_id?.product_delete && (
                          <MdDeleteForever
                            onClick={() => handleDelete(p)}
                            size={20}
                            className="cursor-pointer text-red-500 hover:text-red-300"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="mt-3">
          <Pagination
            setLimit={setLimit}
            page={page}
            setPage={setPage}
            limit={limit}
            totalData={total}
          />
        </div>
      )}

      {/* Modals */}
      {modal?.type === "images" && (
        <ProductImagesModal
          product={modal.product}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
      {modal?.type === "video" && (
        <ProductVideoModal
          product={modal.product}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
      {modal?.type === "price" && (
        <ProductPriceModal
          product={modal.product}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
      {modal?.type === "stock" && (
        <ProductStockModal
          product={modal.product}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
      {modal?.type === "variations" && (
        <ProductVariationsModal
          product={modal.product}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
      {modal?.type === "analytics_seed" && (
        <ProductAnalyticsSeedModal
          product={modal.product}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-[10px] text-gray-500 uppercase">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 border rounded text-sm bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default ProductListTablePage;
