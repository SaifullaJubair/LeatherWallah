import { BASE_URL } from "../../utils/baseURL";
import { useQuery } from "@tanstack/react-query";
import { LoaderOverlay } from "../../components/common/loader/LoderOverley";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
  FiPackage,
  FiTruck,
  FiDollarSign,
  FiRefreshCw,
  FiStar,
  FiTag,
} from "react-icons/fi";
import { useState } from "react";
import { toast } from "react-toastify";

// ── stat card icons — matched positionally to BE sendData array ──────────────
const ICON_MAP = {
  0: <FiShoppingBag size={22} />,  // Total Orders
  1: <FiUsers size={22} />,        // Total Customers
  2: <FiPackage size={22} />,      // Total Products
  3: <FiTruck size={22} />,        // Total Staffs
  4: <FiStar size={22} />,         // Total Reviews
  5: <FiTag size={22} />,          // Total Categories
  6: <FiDollarSign size={22} />,   // Total Brands
};

const CARD_COLORS = [
  { bg: "bg-blue-50", icon: "bg-blue-500", text: "text-blue-600" },
  { bg: "bg-emerald-50", icon: "bg-emerald-500", text: "text-emerald-600" },
  { bg: "bg-amber-50", icon: "bg-amber-500", text: "text-amber-600" },
  { bg: "bg-rose-50", icon: "bg-rose-500", text: "text-rose-600" },
  { bg: "bg-violet-50", icon: "bg-violet-500", text: "text-violet-600" },
  { bg: "bg-cyan-50", icon: "bg-cyan-500", text: "text-cyan-600" },
  { bg: "bg-orange-50", icon: "bg-orange-500", text: "text-orange-600" },
];

// E20 D9: period options — all aggregations keyed to BST "today"
const PERIOD_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

const STATUS_COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancel: "#ef4444",
  return: "#6b7280",
};

const DashBoard = () => {
  const [period, setPeriod] = useState(7);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [steadfastBalance, setSteadfastBalance] = useState(null);

  // ── summary stat cards ───────────────────────────────────────────────────
  const { data: getDashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/v1/dashboard"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/dashboard`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Dashboard fetch failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  // ── top-selling widget ───────────────────────────────────────────────────
  const { data: topSellingData, isLoading: topSellingLoading } = useQuery({
    queryKey: ["/api/v1/dashboard/widgets/top-selling", period],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/dashboard/widgets/top-selling?days=${period}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Top selling fetch failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  // ── orders-by-status widget ──────────────────────────────────────────────
  const { data: orderStatusData, isLoading: orderStatusLoading } = useQuery({
    queryKey: ["/api/v1/dashboard/widgets/orders-by-status", period],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/dashboard/widgets/orders-by-status?days=${period}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Order status fetch failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  // ── fetch steadfast balance ──────────────────────────────────────────────
  const handleFetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const res = await fetch(`${BASE_URL}/courier/steadfast/balance`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) {
        setSteadfastBalance(data?.data?.current_balance ?? data?.data);
      } else {
        throw new Error(data?.message || "Failed");
      }
    } catch {
      toast.error("Steadfast balance fetch failed");
    } finally {
      setBalanceLoading(false);
    }
  };

  if (statsLoading) return <LoaderOverlay />;

  const stats = getDashboardData?.data || [];
  const topSelling = topSellingData?.data || [];
  const statusCounts = orderStatusData?.data?.statusCounts || [];
  const totalRevenue = orderStatusData?.data?.total_revenue ?? 0;
  const totalPeriodOrders = orderStatusData?.data?.total_orders ?? 0;

  // Capitalise first letter for chart display
  const chartData = statusCounts.map((s) => ({
    ...s,
    name: s.name ? s.name.charAt(0).toUpperCase() + s.name.slice(1) : s.name,
  }));

  return (
    <div className="space-y-6">
      {/* ── header + period selector ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back! Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {new Date().toLocaleDateString("en-BD", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 transition-colors ${
                  period === opt.value
                    ? "bg-blueColor-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats.map((data, index) => {
          const color = CARD_COLORS[index % CARD_COLORS.length];
          return (
            <Link
              to={data?.url_link}
              key={index}
              className={`${color.bg} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3`}
            >
              <div
                className={`${color.icon} w-10 h-10 rounded-lg flex items-center justify-center text-white`}
              >
                {ICON_MAP[index] || <FiPackage size={22} />}
              </div>
              <div>
                <p className={`text-2xl font-bold ${color.text}`}>
                  {data?.number}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  {data?.title}
                </p>
              </div>
            </Link>
          );
        })}

        {/* Steadfast Balance Card */}
        <div className="bg-orange-50 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
            <FiTruck size={22} />
          </div>
          <div>
            {steadfastBalance !== null ? (
              <p className="text-2xl font-bold text-orange-600">
                ৳{steadfastBalance}
              </p>
            ) : (
              <p className="text-sm text-gray-400 font-medium">Not loaded</p>
            )}
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-xs text-gray-500 font-medium">
                Steadfast Balance
              </p>
              <button
                onClick={handleFetchBalance}
                disabled={balanceLoading}
                title="Refresh balance"
                className="ml-auto text-orange-400 hover:text-orange-600 disabled:opacity-50"
              >
                <FiRefreshCw
                  size={12}
                  className={balanceLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── period revenue summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Revenue (last {period} days, excl. cancel/return)
          </p>
          {orderStatusLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : (
            <p className="text-3xl font-bold text-emerald-600">
              ৳{totalRevenue.toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Orders placed (last {period} days, excl. cancel/return)
          </p>
          {orderStatusLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : (
            <p className="text-3xl font-bold text-blue-600">
              {totalPeriodOrders.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* ── charts row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">
              Orders by Status
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              Last {period} days
            </span>
          </div>
          {orderStatusLoading ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              No orders in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  name="Orders"
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top-selling products */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">
              Top Selling
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              Last {period} days
            </span>
          </div>
          {topSellingLoading ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : topSelling.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              No sales in this period
            </div>
          ) : (
            <ul className="space-y-3">
              {topSelling.map((item, i) => (
                <li key={String(item._id)} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-blueColor-100 text-blueColor-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {item.product_thumbnail && (
                    <img
                      src={item.product_thumbnail}
                      alt=""
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {item.product_name || "Unknown product"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.total_qty} sold · ৳{item.total_revenue?.toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── quick links ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Orders",
            to: "/order",
            color: "border-orange-400 text-orange-600 bg-orange-50",
          },
          {
            label: "Steadfast Orders",
            to: "/order?tab=steadfast",
            color: "border-red-400 text-red-600 bg-red-50",
          },
          {
            label: "All Products",
            to: "/product",
            color: "border-blue-400 text-blue-600 bg-blue-50",
          },
          {
            label: "All Customers",
            to: "/customer",
            color: "border-emerald-400 text-emerald-600 bg-emerald-50",
          },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`border-l-4 rounded-lg px-4 py-3 text-sm font-medium hover:shadow-sm transition-shadow ${link.color}`}
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashBoard;
