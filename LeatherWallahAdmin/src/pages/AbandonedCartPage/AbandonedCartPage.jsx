import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/AuthProvider";
import { BASE_URL } from "../../utils/baseURL";
import AbandonedCartTable from "../../components/AbandonedCart/AbandonedCartTable";

const RECOVERED_OPTIONS = [
  { value: "", label: "All" },
  { value: "false", label: "Not recovered" },
  { value: "true", label: "Recovered" },
];

const AGE_OPTIONS = [
  { value: "", label: "Any age" },
  { value: "30", label: "≥ 30 min" },
  { value: "60", label: "≥ 1 hour" },
  { value: "180", label: "≥ 3 hours" },
  { value: "1440", label: "≥ 1 day" },
];

const AbandonedCartPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [recovered, setRecovered] = useState("false"); // most useful default
  const [minAge, setMinAge] = useState("");
  const { user } = useContext(AuthContext);

  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (recovered) qs.set("recovered", recovered);
  if (minAge) qs.set("min_age_minutes", minAge);

  const {
    data: carts = [],
    isLoading,
  } = useQuery({
    queryKey: [`/api/v1/abandoned-cart?${qs.toString()}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/abandoned-cart?${qs.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error: ${res.status} ${res.statusText} - ${t}`);
      }
      return res.json();
    },
  });

  return (
    <>
      {user?.role_id?.order_show === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Abandoned Carts</h1>
              <p className="text-xs text-gray-400 mt-1">
                Buyers who reached checkout-intent but didn't complete. A row
                flips to <em>recovered</em> automatically when an order is later
                placed with the same phone (server-side, fire-and-forget).
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Recovered
              </label>
              <select
                value={recovered}
                onChange={(e) => {
                  setRecovered(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                {RECOVERED_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Minimum age
              </label>
              <select
                value={minAge}
                onChange={(e) => {
                  setMinAge(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                {AGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AbandonedCartTable
            carts={carts}
            setPage={setPage}
            setLimit={setLimit}
            totalData={carts?.totalData}
            page={page}
            limit={limit}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
};

export default AbandonedCartPage;
