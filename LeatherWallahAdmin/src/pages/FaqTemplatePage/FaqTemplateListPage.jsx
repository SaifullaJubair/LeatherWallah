import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FaPlus, FaPen, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  useGetFaqTemplates,
  useGetFaqTemplateTopics,
} from "../../hooks/useGetFaqTemplate";
import useDebounced from "../../hooks/useDebounced";
import FaqTemplateModal from "../../components/FaqTemplate/FaqTemplateModal";
import { BASE_URL } from "../../utils/baseURL";

const FaqTemplateListPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const debouncedSearch = useDebounced({ searchQuery: search, delay: 400 });
  const { data, isLoading, refetch } = useGetFaqTemplates({
    page: 1,
    limit: 100,
    category: category || undefined,
    search: debouncedSearch || undefined,
  });
  const templates = data?.data || [];

  // Topic filter options = DB distinct topics (starter set comes from bootstrap).
  const { data: topicsRes } = useGetFaqTemplateTopics();
  const topicOptions = useMemo(
    () => (Array.isArray(topicsRes?.data) ? topicsRes.data : []),
    [topicsRes],
  );

  const handleDelete = async (t) => {
    const ok = await Swal.fire({
      title: "নিশ্চিত?",
      text: "Template টি মুছে যাবে।",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!ok.isConfirmed) return;
    try {
      const res = await fetch(`${BASE_URL}/faq-template/${t._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Deleted");
        refetch();
        // Deleting the last template of a topic should drop it from the filter.
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/faq-template/topics"],
        });
      } else toast.error(data?.message || "Failed");
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">FAQ Templates</h1>
          <p className="text-sm text-gray-500">
            Product page এ FAQ যোগ করার সময় এই template থেকে suggest করা হবে।
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 text-sm"
        >
          <FaPlus /> Add Template
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded border border-gray-200">
        <input
          type="text"
          placeholder="Search question or answer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input flex-1 min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input max-w-[180px]"
        >
          <option value="">All topics</option>
          {topicOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={60} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">কোনো template নেই।</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Answer</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-md">
                    {t.question}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md truncate">
                    {t.answer}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(t.category_ids?.length || 0) === 0 ? (
                      <span className="text-xs text-gray-400">All products</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700">
                        {t.category_ids.length}{" "}
                        {t.category_ids.length === 1 ? "category" : "categories"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.is_active ? (
                      <span className="text-green-600 text-xs">Yes</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => {
                        setEditing(t);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                    >
                      <FaPen />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="inline-flex items-center px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FaqTemplateModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initial={editing}
        refetch={refetch}
      />
    </div>
  );
};

export default FaqTemplateListPage;
