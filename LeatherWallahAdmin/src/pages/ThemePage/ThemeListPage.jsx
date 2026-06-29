import { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import ThemeTable from "../../components/Theme/ThemeTable";
import { useGetThemes } from "../../hooks/useGetTheme";
import useDebounced from "../../hooks/useDebounced";

const ThemeListPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 400 });

  const { data, isLoading, refetch } = useGetThemes({
    page: 1,
    limit: 50,
    status: status || undefined,
    search: debouncedSearch || undefined,
  });

  const themes = data?.data || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Themes</h1>
          <p className="text-sm text-gray-500">
            প্রতিটি product page এর visual theme এখান থেকে manage করো।
          </p>
        </div>
        <Link
          to="/theme/create"
          className="inline-flex items-center gap-2 px-3 py-2 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 text-sm"
        >
          <FaPlus /> Add Theme
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded border border-gray-200">
        <input
          type="text"
          placeholder="Search by name, slug, or theme_for..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input flex-1 min-w-[200px]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="form-input max-w-[160px]"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <ThemeTable themes={themes} isLoading={isLoading} refetch={refetch} />
    </div>
  );
};

export default ThemeListPage;
