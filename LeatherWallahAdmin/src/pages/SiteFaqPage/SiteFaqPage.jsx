import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { FiPlus, FiEdit2, FiTrash2, FiHelpCircle } from "react-icons/fi";
import { MdToggleOff, MdToggleOn } from "react-icons/md";

const EMPTY = { question: "", answer: "", order_no: 0, status: "active" };

const SiteFaqPage = () => {
  const [formData, setFormData] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["site-faqs", page],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/site-faq?limit=${limit}&page=${page}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  });

  const faqs = data?.data || [];
  const total = data?.totalData || 0;

  const openAdd = () => {
    setEditId(null);
    setFormData(EMPTY);
    setShowForm(true);
  };

  const openEdit = (faq) => {
    setEditId(faq._id);
    setFormData({ question: faq.question, answer: faq.answer, order_no: faq.order_no ?? 0, status: faq.status });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and Answer are required");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `${BASE_URL}/site-faq/${editId}` : `${BASE_URL}/site-faq`;
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(editId ? "FAQ updated" : "FAQ created");
      setShowForm(false);
      setFormData(EMPTY);
      setEditId(null);
      refetch();
    } catch {
      toast.error("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this FAQ?",
      text: "This will remove it from the storefront home page.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${BASE_URL}/site-faq/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("FAQ deleted");
      refetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleToggleStatus = async (faq) => {
    const newStatus = faq.status === "active" ? "inactive" : "active";
    try {
      await fetch(`${BASE_URL}/site-faq/${faq._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      refetch();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiHelpCircle className="text-2xl text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Site FAQ (Storefront)</h1>
            <p className="text-sm text-gray-500">These FAQs appear on the home page FAQ section.</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <FiPlus /> Add FAQ
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">{editId ? "Edit FAQ" : "New FAQ"}</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Question *</label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData((p) => ({ ...p, question: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter question..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Answer *</label>
              <textarea
                rows={3}
                value={formData.answer}
                onChange={(e) => setFormData((p) => ({ ...p, answer: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter answer..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Order No</label>
                <input
                  type="number"
                  value={formData.order_no}
                  onChange={(e) => setFormData((p) => ({ ...p, order_no: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                {saving && <MiniSpinner />}
                {editId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData(EMPTY); setEditId(null); }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-12"><MiniSpinner /></div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No FAQs yet. Click "Add FAQ" to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Question</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Order</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {faqs.map((faq, idx) => (
                <tr key={faq._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{(page - 1) * limit + idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-md">
                    <p className="font-medium">{faq.question}</p>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{faq.answer}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(faq)}>
                      {faq.status === "active"
                        ? <MdToggleOn className="text-3xl text-green-500" />
                        : <MdToggleOff className="text-3xl text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{faq.order_no ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(faq)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(faq._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
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

export default SiteFaqPage;
