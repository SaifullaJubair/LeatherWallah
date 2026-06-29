import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import ThemeForm from "../../components/Theme/ThemeForm";
import { useGetThemeById } from "../../hooks/useGetTheme";
import { LoaderOverlay } from "../../components/common/loader/LoderOverley";
import { BASE_URL } from "../../utils/baseURL";

const ThemeUpdatePage = () => {
  const { id } = useParams();
  const { data, isLoading, refetch } = useGetThemeById(id);
  const theme = data?.data;

  const handleApprove = async () => {
    try {
      const res = await fetch(`${BASE_URL}/theme/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Theme approved & activated");
        refetch();
      } else {
        toast.error(data?.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (isLoading) return <LoaderOverlay />;
  if (!theme) {
    return (
      <div className="p-4 text-center text-gray-500">Theme not found.</div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Edit: {theme.theme_name}
          </h1>
          <p className="text-sm text-gray-500">
            Status: <strong>{theme.status}</strong> · Used in{" "}
            {theme.used_in_products} product(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!theme.preview_approved && (
            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              <FaCheck /> Approve & Activate
            </button>
          )}
          <Link
            to="/theme"
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            <FaArrowLeft /> Back
          </Link>
        </div>
      </div>

      <ThemeForm mode="update" initial={theme} />
    </div>
  );
};

export default ThemeUpdatePage;
