import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import { AuthContext } from "../../context/AuthProvider";
import { LoaderOverlay } from "../common/loader/LoderOverley";

/**
 * Demo Data settings tab — shows how many demo rows exist and lets an
 * authorized admin remove them in one click (double-confirmed).
 *
 * Backed by GET /demo/count + DELETE /demo/clear (RBAC: demo_data_clear).
 * Clear removes the demo catalog (products/variations/reviews/banners/sliders/
 * attributes/categories) but KEEPS demo themes + the shared S3 demo images.
 */
const DemoDataSettings = () => {
  const { user } = useContext(AuthContext);
  const canClear = user?.role_id?.demo_data_clear === true;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["demo-count"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/demo/count`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Demo count fetch failed");
      return res.json();
    },
    enabled: canClear,
  });

  const counts = data?.data;

  const handleClear = async () => {
    const confirm = await Swal.fire({
      title: "Clear all demo data?",
      html: `This permanently deletes the <b>${counts?.total || 0}</b> demo item(s)
        (products, reviews, banners, sliders, attributes, categories).<br/><br/>
        Demo themes and demo images are kept. <b>This cannot be undone.</b>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, clear demo data",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    // Second confirm — type-to-confirm guard against accidental clicks.
    const second = await Swal.fire({
      title: "Are you absolutely sure?",
      input: "text",
      inputPlaceholder: 'Type "CLEAR" to confirm',
      inputValidator: (value) =>
        value !== "CLEAR" ? 'You must type "CLEAR" exactly.' : undefined,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Clear now",
    });
    if (!second.isConfirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/demo/clear`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Clear failed");
      toast.success(json?.message || "Demo data cleared.");
      refetch();
    } catch (e) {
      toast.error(e.message || "Failed to clear demo data.");
    }
  };

  if (!canClear) {
    return (
      <div className="p-4 text-sm text-gray-500">
        You don’t have permission to manage demo data.
      </div>
    );
  }

  if (isLoading) return <LoaderOverlay />;

  const total = counts?.total || 0;
  const rows = [
    { label: "Products", value: counts?.products },
    { label: "Reviews", value: counts?.reviews },
    { label: "Banners", value: counts?.banners },
    { label: "Sliders", value: counts?.sliders },
    { label: "Attributes", value: counts?.attributes },
    { label: "Categories", value: counts?.categories },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Demo Data</h2>
      <p className="text-sm text-gray-500 mb-5">
        The starter demo catalog helps you preview the shop. Remove it once you’ve
        added your real products. Demo themes and uploaded demo images are kept.
      </p>

      {total === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          ✓ No demo data found — your shop only contains real data.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 overflow-hidden mb-5">
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b last:border-0">
                    <td className="px-4 py-2.5 text-gray-600">{r.label}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                      {r.value ?? 0}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="px-4 py-2.5 font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                    {total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            onClick={handleClear}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            Clear demo data
          </button>
          <p className="text-xs text-gray-400 mt-2">
            You’ll be asked to confirm twice. This action cannot be undone.
          </p>
        </>
      )}
    </div>
  );
};

export default DemoDataSettings;
