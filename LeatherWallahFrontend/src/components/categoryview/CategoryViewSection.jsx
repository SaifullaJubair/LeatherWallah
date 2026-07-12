"use client";
import { titleFont } from "@/utils/font";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiFilter, FiX, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { RiHome2Line } from "react-icons/ri";
import NotFoundData from "../common/NotFoundData";
import PaginationWithPageBtn from "../common/paginationWithPageBtn/PaginationWithPageBtn";
import ProductCard from "@/components/common/ProductCard";
import ProductCardSkeleton from "@/components/common/ProductCardSkeleton";
import { BASE_URL } from "../utils/baseURL";
import FilterSection from "./FilterSection";

// The default price window must not exclude anything — it is what a visitor who
// never touches the slider gets. DEFAULT_MAX used to be 5000 while the shop sold
// boots at 5200, so two products were missing from /shop and nobody could reach
// them by browsing. PriceRangeFilter already renders its track from the backend's
// `maxPriceRange`, so the slider still ends at the real top price; this constant
// only decides the query sent before the customer has expressed a preference, and
// "no upper bound" is the honest answer to that.
//
// DEFAULT_MIN stays 1 rather than 0 deliberately: 0 is not a price, and a product
// whose effective_price is 0 means an admin saved a variation without one. The
// backend now falls back to product_price in that case, so nothing hides.
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 10000000;

const AVAILABILITY_SLUGS = { "in-stock": 1, "out-of-stock": 0 };
const AVAILABILITY_TO_SLUG = { 1: "in-stock", 0: "out-of-stock" };

const SORT_OPTIONS = [
  { value: "latest",     label: "Latest",          slug: "latest" },
  { value: "price_asc",  label: "Price ↑",          slug: "price-low-high" },
  { value: "price_desc", label: "Price ↓",          slug: "price-high-low" },
  { value: "popular",    label: "Popular",          slug: "popular" },
  { value: "trending",   label: "Trending",         slug: "trending" },
  { value: "rating",     label: "Top Rated",        slug: "rating" },
];
const SORT_BY_SLUG = Object.fromEntries(SORT_OPTIONS.map((o) => [o.slug, o.value]));
const SORT_TO_SLUG = Object.fromEntries(SORT_OPTIONS.map((o) => [o.value, o.slug]));

const buildSlugMaps = (filterData) => {
  const attrSlugToId = new Map();
  const attrIdToSlug = new Map();
  const valueSlugToId = new Map();
  const valueIdToSlug = new Map();
  for (const attr of filterData?.attributes || []) {
    if (!attr?.attribute_slug || !attr?._id) continue;
    attrSlugToId.set(attr.attribute_slug, String(attr._id));
    attrIdToSlug.set(String(attr._id), attr.attribute_slug);
    for (const v of attr.attribute_values || []) {
      if (!v?.attribute_value_slug || !v?._id) continue;
      valueSlugToId.set(`${attr.attribute_slug}|${v.attribute_value_slug}`, String(v._id));
      valueIdToSlug.set(`${String(attr._id)}|${String(v._id)}`, v.attribute_value_slug);
    }
  }
  return { attrSlugToId, attrIdToSlug, valueSlugToId, valueIdToSlug };
};

const readFiltersFromUrl = (sp, maps) => {
  const out = { filters: {}, min_price: DEFAULT_MIN, max_price: DEFAULT_MAX, availability: [], brands: [] };
  if (!sp) return out;
  for (const [key, value] of sp.entries()) {
    if (["min", "max", "av", "brand", "sort", "page"].includes(key)) continue;
    const attrId = maps.attrSlugToId.get(key);
    if (!attrId) continue;
    const valIds = value.split(",").map((slug) => maps.valueSlugToId.get(`${key}|${slug}`)).filter(Boolean);
    if (valIds.length) out.filters[attrId] = valIds;
  }
  const minP = Number(sp.get("min"));
  const maxP = Number(sp.get("max"));
  if (Number.isFinite(minP) && minP > 0) out.min_price = minP;
  if (Number.isFinite(maxP) && maxP > 0) out.max_price = maxP;
  const av = sp.get("av");
  if (av) out.availability = av.split(",").map((s) => AVAILABILITY_SLUGS[s]).filter((n) => n === 0 || n === 1);
  const br = sp.get("brand");
  if (br) out.brands = br.split(",").filter(Boolean);
  return out;
};

const writeFiltersToUrl = (filters, sort, page, maps, search) => {
  const params = new URLSearchParams();
  for (const [attrId, vals] of Object.entries(filters?.filters || {})) {
    if (!Array.isArray(vals) || !vals.length) continue;
    const attrSlug = maps.attrIdToSlug.get(String(attrId));
    if (!attrSlug) continue;
    const valSlugs = vals.map((vid) => maps.valueIdToSlug.get(`${attrId}|${vid}`)).filter(Boolean);
    if (valSlugs.length) params.set(attrSlug, valSlugs.join(","));
  }
  if (filters?.min_price && filters.min_price !== DEFAULT_MIN) params.set("min", String(filters.min_price));
  if (filters?.max_price && filters.max_price !== DEFAULT_MAX) params.set("max", String(filters.max_price));
  if (filters?.availability?.length) {
    const slugs = filters.availability.map((n) => AVAILABILITY_TO_SLUG[n]).filter(Boolean);
    if (slugs.length) params.set("av", slugs.join(","));
  }
  if (filters?.brands?.length) params.set("brand", filters.brands.join(","));
  if (sort && sort !== "latest") { const slug = SORT_TO_SLUG[sort]; if (slug) params.set("sort", slug); }
  if (search) params.set("search", search);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

// Count total active filters for badge
const countActiveFilters = (selectedFilters, selectedSort) => {
  let n = 0;
  const f = selectedFilters || {};
  n += Object.values(f.filters || {}).filter((v) => Array.isArray(v) && v.length).length;
  if (f.min_price && f.min_price !== DEFAULT_MIN) n++;
  if (f.max_price && f.max_price !== DEFAULT_MAX) n++;
  n += (f.availability || []).length;
  n += (f.brands || []).length;
  if (selectedSort && selectedSort !== "latest") n++;
  return n;
};

const CategoryViewSection = ({ slug, filterData, filterHeadData, initialSort, initialTitle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const maps = useMemo(() => buildSlugMaps(filterData), [filterData]);

  const [rows, setRows] = useState(20);
  const [page, setPage] = useState(() => {
    const p = Number(searchParams?.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [selectedFilters, setSelectedFilters] = useState(() => readFiltersFromUrl(searchParams, maps));
  const [selectedSort, setSelectedSort] = useState(() => {
    const urlSlug = searchParams?.get("sort");
    return SORT_BY_SLUG[urlSlug] || initialSort || "latest";
  });
  const [searchTerm, setSearchTerm] = useState(() => searchParams?.get("search") || "");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const reSeededRef = useRef(false);
  useEffect(() => {
    if (reSeededRef.current) return;
    if (!filterData?.attributes?.length) return;
    reSeededRef.current = true;
    setSelectedFilters(readFiltersFromUrl(searchParams, maps));
  }, [filterData, maps, searchParams]);

  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    setSearchTerm(urlSearch);
  }, [searchParams]);

  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    const qs = writeFiltersToUrl(selectedFilters, selectedSort, page, maps, searchTerm);
    router.replace(`${pathname}${qs}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters, selectedSort, page, searchTerm]);

  const handleResetFilters = () => {
    setSelectedFilters({ filters: {}, min_price: DEFAULT_MIN, max_price: DEFAULT_MAX, availability: [], brands: [] });
    setSelectedSort("latest");
    setSearchTerm("");
    setPage(1);
    router.replace(pathname, { scroll: false });
  };

  const activeFilterCount = useMemo(() => countActiveFilters(selectedFilters, selectedSort), [selectedFilters, selectedSort]);

  const queryString = encodeURIComponent(JSON.stringify(selectedFilters));
  const safeSlug = Array.isArray(slug) ? slug : [];
  const leafSlug = safeSlug[safeSlug.length - 1];
  const isTrending = selectedSort === "trending";

  // F3.3 — "trending" goes through the trending_only flag; every other sort is
  // a catalog-wide server-side sort param. selectedSort is in the queryKey so
  // switching sort always refetches (was page-local before → "popular ≠ popular").
  const sortParam =
    selectedSort && !isTrending ? `&sort=${selectedSort}` : "";

  const { data, isLoading } = useQuery({
    queryKey: [selectedFilters, slug, page, rows, isTrending, searchTerm, selectedSort],
    queryFn: async () => {
      const trendingParam = isTrending ? "&trending_only=true" : "";
      const searchParam = searchTerm ? `&searchTerm=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(
        `${BASE_URL}/filter_product?categoryType=${leafSlug}&filterData=${queryString}&page=${page}&limit=${rows}${trendingParam}${searchParam}${sortParam}`,
      );
      return res.json();
    },
  });

  // Server already returns the page in the correct catalog-wide order; no
  // page-local re-sort (that only reordered the current ~20 rows). Kept as a
  // named passthrough so the render below is untouched.
  const sortedData = data?.data || [];

  const startIndex = (page - 1) * rows + 1;
  const endIndex = Math.min(startIndex + rows - 1, data?.totalData || 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1800px] mx-auto px-3 md:px-4 py-5">
        <div className="flex gap-5">

          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-[82px]">
              {/* Filters card — header inside */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FiFilter size={13} />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {activeFilterCount}
                      </span>
                    )}
                  </h2>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      <FiRefreshCw size={11} /> Reset
                    </button>
                  )}
                </div>
                <FilterSection
                  slug={slug}
                  filterData={filterData}
                  selectedFilters={selectedFilters}
                  setSelectedFilters={setSelectedFilters}
                />
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Page header — only inside right column */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-xs text-gray-500 mb-1.5 flex-wrap">
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                  <RiHome2Line size={12} /> Home
                </Link>
                {safeSlug.map((s, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <FiChevronRight size={10} className="text-gray-300" />
                    <Link
                      href={`/category/${safeSlug.slice(0, i + 1).join("/")}`}
                      className={`capitalize hover:text-primary transition-colors ${i === safeSlug.length - 1 ? "text-gray-700 font-medium" : ""}`}
                    >
                      {s}
                    </Link>
                  </span>
                ))}
                {!safeSlug.length && (
                  <span className="flex items-center gap-1">
                    <FiChevronRight size={10} className="text-gray-300" />
                    <span className="text-gray-700 font-medium">{initialTitle || "All Products"}</span>
                  </span>
                )}
              </nav>

              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize" style={{ fontFamily: titleFont.style.fontFamily }}>
                  {initialTitle || safeSlug[0] || "All Products"}
                </h1>
                {!isLoading && data?.totalData > 0 && (
                  <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {data.totalData} Products
                  </span>
                )}
              </div>

              {/* Sub-category pills */}
              {filterHeadData?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {filterHeadData.map((item) => (
                    <Link
                      key={item._id}
                      href={`/category/${[...safeSlug, item?.category_slug].filter(Boolean).join("/")}`}
                      className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      {item?.category_name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {/* Sort / controls bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-2.5 mb-4">
              {/* ── Mobile row ── */}
              <div className="flex items-center gap-2 lg:hidden">
                {/* Filter button */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors shrink-0"
                >
                  <FiFilter size={14} />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort dropdown — mobile */}
                <select
                  value={selectedSort}
                  onChange={(e) => { setSelectedSort(e.target.value); setPage(1); }}
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 font-medium"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Per page — mobile */}
                <select
                  value={rows}
                  onChange={(e) => { setRows(Number(e.target.value)); setPage(1); }}
                  className="text-sm px-2 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary text-gray-600 shrink-0"
                >
                  {[12, 20, 36, 60].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* ── Desktop row ── */}
              <div className="hidden lg:flex items-center gap-2">
                {/* Sort pills */}
                <span className="text-xs text-gray-400 font-medium shrink-0">Sort:</span>
                <div className="flex items-center gap-1.5 flex-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedSort(opt.value); setPage(1); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                        selectedSort === opt.value
                          ? "bg-primary text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Count + per page */}
                <div className="flex items-center gap-3 ml-auto shrink-0">
                  {!isLoading && (
                    <span className="text-xs text-gray-400">
                      {data?.totalData ?? 0} results
                    </span>
                  )}
                  <select
                    value={rows}
                    onChange={(e) => { setRows(Number(e.target.value)); setPage(1); }}
                    className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary text-gray-600"
                  >
                    {[12, 20, 36, 60].map((n) => (
                      <option key={n} value={n}>{n} / page</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(selectedFilters?.filters || {}).flatMap(([attrId, valIds]) => {
                  const attr = filterData?.attributes?.find((a) => String(a._id) === attrId);
                  if (!attr) return [];
                  return (valIds || []).map((vid) => {
                    const val = attr.attribute_values?.find((v) => String(v._id) === vid);
                    if (!val) return null;
                    return (
                      <span key={`${attrId}-${vid}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {val.attribute_value_name}
                        <button onClick={() => {
                          setSelectedFilters((prev) => {
                            const m = { ...(prev.filters || {}) };
                            m[attrId] = (m[attrId] || []).filter((i) => i !== vid);
                            if (!m[attrId].length) delete m[attrId];
                            return { ...prev, filters: m };
                          });
                        }}><FiX size={11} /></button>
                      </span>
                    );
                  }).filter(Boolean);
                })}
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-500 text-xs font-medium rounded-full hover:bg-red-100 transition-colors"
                >
                  <FiRefreshCw size={11} /> Clear all
                </button>
              </div>
            )}

            {/* Product grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                <ProductCardSkeleton count={12} />
              </div>
            ) : data?.totalData > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {sortedData.map((product) => (
                  <ProductCard
                    key={product?._id}
                    product={product}
                    activeFilters={selectedFilters?.filters}
                  />
                ))}
              </div>
            ) : (
              <NotFoundData />
            )}

            {/* Pagination */}
            {!isLoading && data?.totalData > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">{startIndex}–{endIndex}</span>
                  {" "}of{" "}
                  <span className="font-semibold text-gray-700">{data?.totalData}</span> products
                </p>
                <PaginationWithPageBtn
                  rows={rows}
                  page={page}
                  setPage={setPage}
                  setRows={setRows}
                  totalData={data?.totalData}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      <>
        <div
          className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsDrawerOpen(false)}
        />
        <div
          className={`fixed left-0 top-0 h-full w-[300px] sm:w-[340px] bg-white z-50 lg:hidden flex flex-col transform transition-transform duration-300 ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <FiFilter size={15} /> Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={handleResetFilters} className="text-xs text-red-500 font-medium">Reset</button>
              )}
              <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                <FiX size={17} className="text-gray-600" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FilterSection
              slug={slug}
              filterData={filterData}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
            />
          </div>
          <div className="p-4 border-t border-gray-100 shrink-0">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors"
            >
              Show {data?.totalData ?? 0} Results
            </button>
          </div>
        </div>
      </>
    </div>
  );
};

export default CategoryViewSection;
