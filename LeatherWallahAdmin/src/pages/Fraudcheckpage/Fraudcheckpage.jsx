import { useState, useEffect, useContext, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BASE_URL } from "../../utils/baseURL";
import { AuthContext } from "../../context/AuthProvider";
import { toast } from "react-toastify";

// ── Simple in-memory cache (session চলাকালীন রাখবে) ──────────
const fraudCache = {};

const RiskBadge = ({ level, color }) => {
  const colors = {
    red: "bg-red-100 text-red-700 border-red-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
    blue: "bg-blue-100 text-blue-700 border-blue-300",
    green: "bg-green-100 text-green-700 border-green-300",
  };
  const icons = { red: "🚨", orange: "⚠️", blue: "🆕", green: "✅" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${colors[color] || colors.blue}`}
    >
      {icons[color]} {level}
    </span>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-600",
    blue: "text-blue-600",
    gray: "text-gray-600",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
      <div className={`text-2xl font-bold ${colors[color] || colors.gray}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
};

const CourierCard = ({ name, data }) => {
  if (!data) return null;
  const isRating = data.data_type === "rating";
  const ratingColors = {
    excellent_customer: "text-green-600 bg-green-50 border-green-200",
    good_customer: "text-blue-600 bg-blue-50 border-blue-200",
    moderate_customer: "text-yellow-600 bg-yellow-50 border-yellow-200",
    risky_customer: "text-red-600 bg-red-50 border-red-200",
    new_customer: "text-gray-600 bg-gray-50 border-gray-200",
  };
  const ratingLabels = {
    excellent_customer: "Excellent",
    good_customer: "Good",
    moderate_customer: "Moderate",
    risky_customer: "Risky",
    new_customer: "New",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">{name}</h4>
        {isRating ? (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full border ${ratingColors[data.customer_rating] || ratingColors.new_customer}`}
          >
            {ratingLabels[data.customer_rating] || data.customer_rating}
          </span>
        ) : (
          <span className="text-xs text-gray-400">Delivery Data</span>
        )}
      </div>
      {isRating ? (
        <p className="text-xs text-gray-500">{data.message}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-gray-800">
              {data.total || 0}
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {data.success || 0}
            </div>
            <div className="text-xs text-gray-400">Success</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {data.cancel || 0}
            </div>
            <div className="text-xs text-gray-400">Cancel</div>
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_COLOR = {
  delivered: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancel: "bg-red-100 text-red-700",
  return: "bg-orange-100 text-orange-700",
  shipped: "bg-purple-100 text-purple-700",
};

const FraudCheckPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // URL থেকে phone নাও শুধু input fill করতে — auto-fetch করবে না
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { user } = useContext(AuthContext);

  // URL change হলে শুধু input update করো — fetch করবে না
  useEffect(() => {
    const phoneFromUrl = searchParams.get("phone");
    if (phoneFromUrl) {
      setPhone(phoneFromUrl);
      // cache তে আগের result থাকলে দেখাও, API call করবে না
      if (fraudCache[phoneFromUrl]) {
        setResult(fraudCache[phoneFromUrl]);
      }
      // auto-fetch করবে না — user কে button click করতে হবে
    }
  }, [searchParams]);

  const handleCheck = async () => {
    const cleaned = phone.trim().replace(/^\+?88/, "");
    if (!cleaned) {
      toast.warning("Phone number দিন");
      return;
    }

    // Cache hit — API call বাঁচাও
    if (fraudCache[cleaned]) {
      setResult(fraudCache[cleaned]);
      setSearchParams({ phone: cleaned });
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setSearchParams({ phone: cleaned });

      const res = await fetch(`${BASE_URL}/fraud/check`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: cleaned }),
      });
      const data = await res.json();
      if (data?.success) {
        // Cache এ save করো
        fraudCache[cleaned] = data.data;
        setResult(data.data);
      } else {
        toast.error(data?.message || "Check failed");
      }
    } catch (e) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCheck();
  };

  const summaries = result?.fraudBD?.Summaries || {};
  const totalSummary = result?.fraudBD?.totalSummary || {};
  const dbHistory = result?.dbHistory || {};

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🔍 Fraud Check</h1>
          <p className="text-sm text-gray-500 mt-1">
            FraudBD + আমাদের DB — customer এর delivery history check করুন
          </p>
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Phone number: 01XXXXXXXXX"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCheck}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Checking..." : "Check করুন"}
            </button>
          </div>
          {result && (
            <p className="text-xs text-gray-400 mt-2">
              ✅ Result cached — reload দিলেও API call হবে না। নতুন number check
              করতে input clear করুন।
            </p>
          )}
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3 animate-pulse">🔍</div>
            <p className="text-sm">Checking FraudBD + আমাদের Database...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-5">
            {/* Risk Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Phone</div>
                  <div className="text-lg font-mono font-bold text-gray-800">
                    {result.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">
                    Risk Assessment
                  </div>
                  <RiskBadge
                    level={result.riskLevel?.level}
                    color={result.riskLevel?.color}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {result.riskLevel?.reason}
                  </div>
                </div>
              </div>
            </div>

            {/* FraudBD Total */}
            {result.fraudBDStatus && totalSummary.total > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  🌐 FraudBD — সব Courier মিলিয়ে
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="মোট Order"
                    value={totalSummary.total || 0}
                    color="gray"
                  />
                  <StatCard
                    label="Success"
                    value={totalSummary.success || 0}
                    color="green"
                  />
                  <StatCard
                    label="Cancel"
                    value={totalSummary.cancel || 0}
                    color="red"
                  />
                  <StatCard
                    label="Success Rate"
                    value={`${totalSummary.successRate || 0}%`}
                    color={totalSummary.successRate >= 70 ? "green" : "red"}
                  />
                </div>
              </div>
            )}

            {/* FraudBD না আসলে warning */}
            {!result.fraudBDStatus && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
                ⚠️ FraudBD থেকে data আসেনি। Daily limit শেষ হতে পারে অথবা API
                error।
              </div>
            )}

            {/* Courier breakdown */}
            {result.fraudBDStatus && Object.keys(summaries).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  📦 Courier ভিত্তিক
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(summaries).map(([name, data]) => (
                    <CourierCard key={name} name={name} data={data} />
                  ))}
                </div>
              </div>
            )}

            {/* DB History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                🏪 আমাদের Site এ History
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                <StatCard
                  label="মোট"
                  value={dbHistory.total || 0}
                  color="gray"
                />
                <StatCard
                  label="Delivered"
                  value={dbHistory.delivered || 0}
                  color="green"
                />
                <StatCard
                  label="Processing"
                  value={dbHistory.processing || 0}
                  color="blue"
                />
                <StatCard
                  label="Pending"
                  value={dbHistory.pending || 0}
                  color="orange"
                />
                <StatCard
                  label="Cancelled"
                  value={dbHistory.cancelled || 0}
                  color="red"
                />
                <StatCard
                  label="Return"
                  value={dbHistory.returned || 0}
                  color="orange"
                />
              </div>

              {dbHistory.orders?.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                          Invoice
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                          Courier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dbHistory.orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-blue-600">
                            {order.invoice_id}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.order_status] || "bg-gray-100 text-gray-600"}`}
                            >
                              {order.order_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                            {order.courier_type || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-800">
                            ৳{order.grand_total_amount}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-BD",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm">
                  আমাদের site এ কোনো order নেই এই number এ
                </div>
              )}
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-sm text-gray-400">
              Phone number দিয়ে <strong>Check করুন</strong> button click করুন
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudCheckPage;
