import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { FiDownload, FiTrash2, FiMail } from "react-icons/fi";

const NewsletterPage = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["newsletter-subscribers", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit, page });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${BASE_URL}/newsletter-subscriber?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  });

  const subscribers = data?.data || [];
  const total = data?.totalData || 0;

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete subscriber?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${BASE_URL}/newsletter-subscriber/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("Subscriber deleted");
      refetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(
        `${BASE_URL}/newsletter-subscriber/export?${params}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscribers_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiMail className="text-2xl text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Newsletter Subscribers</h1>
            <p className="text-sm text-gray-500">
              {total} total subscriber{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {exporting ? <MiniSpinner /> : <FiDownload size={14} />}
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-12"><MiniSpinner /></div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No subscribers yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Contact</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Channel</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Source</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Subscribed</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscribers.map((sub, idx) => (
                <tr key={sub._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{(page - 1) * limit + idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{sub.contact}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      sub.channel === "email" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {sub.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{sub.source}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      sub.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > limit && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterPage;
