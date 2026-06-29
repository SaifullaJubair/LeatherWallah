import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { FaEye, FaPen, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";

const STATUS_BADGES = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-200 text-gray-600",
};

const ThemeTable = ({ themes, isLoading, refetch }) => {
  const handleDelete = async (theme) => {
    if (theme.used_in_products > 0) {
      Swal.fire({
        icon: "warning",
        title: "Delete করা যাবে না",
        text: `${theme.used_in_products} টি product এই theme ব্যবহার করছে। আগে product থেকে theme সরাও।`,
      });
      return;
    }
    const confirm = await Swal.fire({
      title: "নিশ্চিত?",
      text: `"${theme.theme_name}" theme archive হয়ে যাবে।`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, archive",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/theme/${theme._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(data?.message || "Theme archived");
        refetch();
      } else {
        toast.error(data?.message || "Failed");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={60} />
        ))}
      </div>
    );
  }

  if (!themes?.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        কোনো theme পাওয়া যায়নি। উপরের "Add Theme" বাটন থেকে নতুন theme তৈরি করো।
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
          <tr>
            <th className="px-4 py-3">Preview</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">For</th>
            <th className="px-4 py-3">Colors</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">In Use</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((t) => (
            <tr key={t._id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3">
                {t.thumbnail_preview ? (
                  <img
                    src={t.thumbnail_preview}
                    alt={t.theme_name}
                    className="w-14 h-14 object-cover rounded border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded border bg-gray-100" />
                )}
              </td>
              <td className="px-4 py-3 font-medium text-gray-800">
                {t.theme_name}
                <div className="text-xs text-gray-400 font-mono">{t.theme_slug}</div>
              </td>
              <td className="px-4 py-3 text-gray-700">{t.theme_for}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: t.colors?.primary }}
                    title={`Primary: ${t.colors?.primary}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: t.colors?.page_bg }}
                    title={`Page bg: ${t.colors?.page_bg}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: t.colors?.accent }}
                    title={`Accent: ${t.colors?.accent}`}
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGES[t.status] || ""}`}
                >
                  {t.status}
                </span>
                {!t.preview_approved && (
                  <span className="ml-1 text-xs text-orange-500">(unapproved)</span>
                )}
              </td>
              <td className="px-4 py-3">{t.used_in_products}</td>
              <td className="px-4 py-3 text-right space-x-1">
                <Link
                  to={`/theme/preview/${t._id}`}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  title="Preview"
                >
                  <FaEye />
                </Link>
                <Link
                  to={`/theme/update/${t._id}`}
                  className="inline-flex items-center px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                  title="Edit"
                >
                  <FaPen />
                </Link>
                <button
                  onClick={() => handleDelete(t)}
                  disabled={t.used_in_products > 0}
                  className="inline-flex items-center px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    t.used_in_products > 0
                      ? `${t.used_in_products} product using this theme`
                      : "Delete"
                  }
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ThemeTable;
