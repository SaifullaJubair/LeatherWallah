import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ThemeForm from "../../components/Theme/ThemeForm";

const ThemeAddPage = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Add New Theme</h1>
          <p className="text-sm text-gray-500">
            ৫টি step এ একটি নতুন product page theme তৈরি করো।
          </p>
        </div>
        <Link
          to="/theme"
          className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          <FaArrowLeft /> Back to list
        </Link>
      </div>

      <ThemeForm mode="create" />
    </div>
  );
};

export default ThemeAddPage;
