/**
 * Admin Wallet viewer + adjust (Phase E, V fix).
 *
 * Mirrors LoyaltyPage — user picker → balance + history table + adjust form.
 * Wallet entries are currency (BDT) while loyalty is points; otherwise the
 * shape and flow match.
 *
 * Backend:
 *   GET  /wallet/history/admin?user_id=…   (verifyToken user_show)
 *   POST /wallet/adjust                    (verifyToken user_update)
 *        body: { user_id, delta, reason }
 *        delta > 0 → admin_credit, delta < 0 → admin_debit
 */

import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthProvider";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "../../components/common/loadingSkeleton/TableLoadingSkeleton";
import Pagination from "../../components/common/pagination/Pagination";

const TYPE_BADGE = {
  admin_credit: "bg-emerald-100 text-emerald-700",
  admin_debit: "bg-red-100 text-red-700",
  refund: "bg-blue-100 text-blue-700",
  order_pay: "bg-amber-100 text-amber-700",
  giftcard: "bg-purple-100 text-purple-700",
};

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const WalletPage = () => {
  const { user: adminUser } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const loadUserOptions = async (input) => {
    if (!input || input.trim().length < 2) return [];
    const res = await fetch(
      `${BASE_URL}/user?page=1&limit=20&searchTerm=${encodeURIComponent(input.trim())}`,
      { credentials: "include" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data || []).map((u) => ({
      value: u._id,
      label: `${u.user_name || "(no name)"} — ${u.user_phone}`,
      raw: u,
    }));
  };

  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      `/api/v1/wallet/history/admin?user_id=${selectedUser?.value}&page=${page}&limit=${limit}`,
    ],
    queryFn: async () => {
      if (!selectedUser?.value) return null;
      const res = await fetch(
        `${BASE_URL}/wallet/history/admin?user_id=${selectedUser.value}&page=${page}&limit=${limit}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error: ${res.status} - ${t}`);
      }
      return res.json();
    },
    enabled: !!selectedUser?.value,
  });

  useEffect(() => {
    setPage(1);
  }, [selectedUser?.value]);

  const balance = history?.data?.balance ?? 0;
  const rows = history?.data?.rows ?? [];
  const totalData = history?.totalData;

  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const handleAdjust = async () => {
    if (!selectedUser?.value) {
      toast.error("Pick a user first");
      return;
    }
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) {
      toast.error("Amount must be a non-zero number (positive = credit, negative = debit)");
      return;
    }
    setAdjusting(true);
    try {
      const res = await fetch(`${BASE_URL}/wallet/adjust`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.value,
          delta: n,
          reason: reason.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          `Wallet ${n > 0 ? "credited" : "debited"}. New balance: ৳${result?.data?.balance ?? "?"}`,
          { autoClose: 1500 },
        );
        setDelta("");
        setReason("");
        refetchHistory();
      } else {
        toast.error(result?.message || "Adjust failed", { autoClose: 2000 });
      }
    } catch (e) {
      toast.error(e?.message || "Network error", { autoClose: 2000 });
    } finally {
      setAdjusting(false);
    }
  };

  const canAdjust = adminUser?.role_id?.user_update === true;

  return (
    <>
      {adminUser?.role_id?.user_show === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow space-y-6">
          <div>
            <h1 className="text-2xl">Wallet</h1>
            <p className="text-xs text-gray-400 mt-1">
              Pick a customer, view their wallet ledger, and (with{" "}
              <code>user_update</code> permission) credit/debit BDT manually
              (giftcard, refund, top-up).
            </p>
          </div>

          {/* Picker + balance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Find customer (name or phone)
              </label>
              <AsyncSelect
                cacheOptions
                loadOptions={loadUserOptions}
                value={selectedUser}
                onChange={setSelectedUser}
                isClearable
                placeholder="Type at least 2 characters…"
              />
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">
                Current balance
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {selectedUser ? `৳${balance}` : "—"}
              </p>
              {selectedUser && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedUser.raw?.user_name} — {selectedUser.raw?.user_phone}
                </p>
              )}
            </div>
          </div>

          {/* Adjust form */}
          {selectedUser && canAdjust && (
            <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Manual adjust
              </p>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Amount (+ credit, − debit) ৳
                  </label>
                  <input
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    placeholder="e.g. 500 or -100"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="md:col-span-7">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Reason (optional, saved to ledger)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. giftcard top-up / refund for cancelled order #INV123"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  {adjusting ? (
                    <div className="w-full py-2 flex items-center justify-center bg-blue-600 text-white rounded">
                      <MiniSpinner />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAdjust}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Backend refuses a debit that would drive the balance below 0.
              </p>
            </div>
          )}

          {/* Ledger */}
          {selectedUser && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Ledger</p>
              {historyLoading ? (
                <TableLoadingSkeleton />
              ) : (
                <div className="rounded-lg border border-gray-200">
                  {rows.length > 0 ? (
                    <div className="overflow-x-auto rounded-t-lg">
                      <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                        <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                          <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                            <th className="whitespace-nowrap p-3 font-medium">When</th>
                            <th className="whitespace-nowrap p-3 font-medium">Type</th>
                            <th className="whitespace-nowrap p-3 font-medium">Amount</th>
                            <th className="whitespace-nowrap p-3 font-medium">Reference</th>
                            <th className="whitespace-nowrap p-3 font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-center">
                          {rows.map((r) => (
                            <tr
                              key={r._id}
                              className="divide-x divide-gray-200 hover:bg-gray-50"
                            >
                              <td className="whitespace-nowrap p-3 text-gray-500 text-xs">
                                {fmt(r.createdAt)}
                              </td>
                              <td className="whitespace-nowrap p-3">
                                <span
                                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                                    TYPE_BADGE[r.type] ||
                                    "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {r.type}
                                </span>
                              </td>
                              <td
                                className={`whitespace-nowrap p-3 font-mono font-bold ${
                                  r.delta > 0
                                    ? "text-emerald-700"
                                    : "text-red-700"
                                }`}
                              >
                                {r.delta > 0 ? "+" : ""}৳{r.delta}
                              </td>
                              <td className="whitespace-nowrap p-3 text-gray-600 font-mono text-xs">
                                {r.reference_id || (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                              <td className="p-3 text-gray-600 text-xs italic">
                                {r.reason || (
                                  <span className="text-gray-300 not-italic">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <NoDataFound />
                  )}
                </div>
              )}
              <Pagination
                setPage={setPage}
                setLimit={setLimit}
                totalData={totalData}
                page={page}
                limit={limit}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default WalletPage;
