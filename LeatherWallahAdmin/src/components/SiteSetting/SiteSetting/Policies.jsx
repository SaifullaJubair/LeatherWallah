import { useState } from "react";
import ReactQuill from "react-quill-new";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../../../utils/baseURL";
import MiniSpinner from "../../../shared/MiniSpinner/MiniSpinner";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const Policies = ({ refetch, getInitialCurrencyData }) => {
  const [activeTab, setActiveTab] = useState("about");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState({});

  const [policies, setPolicies] = useState({
    about_us: getInitialCurrencyData?.about_us || "",
    return_policy: getInitialCurrencyData?.return_policy || "",
    privacy_policy: getInitialCurrencyData?.privacy_policy || "",
    refund_policy: getInitialCurrencyData?.refund_policy || "",
    cancellation_policy: getInitialCurrencyData?.cancellation_policy || "",
    terms_condition: getInitialCurrencyData?.terms_condition || "",
    shipping_info: getInitialCurrencyData?.shipping_info || "",
  });

  const policyTabs = [
    { id: "about", label: "About Us", icon: "ℹ️", field: "about_us" },
    {
      id: "terms",
      label: "Terms & Conditions",
      icon: "📋",
      field: "terms_condition",
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: "🔒",
      field: "privacy_policy",
    },
    {
      id: "return",
      label: "Return Policy",
      icon: "🔄",
      field: "return_policy",
    },
    {
      id: "refund",
      label: "Refund Policy",
      icon: "💰",
      field: "refund_policy",
    },
    {
      id: "cancellation",
      label: "Cancellation Policy",
      icon: "❌",
      field: "cancellation_policy",
    },
    {
      id: "shipping",
      label: "Shipping Info",
      icon: "📦",
      field: "shipping_info",
    },
  ];

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setPolicies({
      about_us: getInitialCurrencyData?.about_us || "",
      return_policy: getInitialCurrencyData?.return_policy || "",
      privacy_policy: getInitialCurrencyData?.privacy_policy || "",
      refund_policy: getInitialCurrencyData?.refund_policy || "",
      cancellation_policy: getInitialCurrencyData?.cancellation_policy || "",
      terms_condition: getInitialCurrencyData?.terms_condition || "",
      shipping_info: getInitialCurrencyData?.shipping_info || "",
    });
  };

  const handlePolicyUpdate = async (field) => {
    setLoading((prev) => ({ ...prev, [field]: true }));

    if (getInitialCurrencyData?._id) {
      try {
        const sendData = {
          _id: getInitialCurrencyData?._id,
          [field]: policies[field],
        };

        const response = await fetch(`${BASE_URL}/setting`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendData),
        });

        const result = await response.json();
        if (result?.statusCode === 200 && result?.success === true) {
          toast.success(`${field.replace(/_/g, " ")} updated successfully`);
          refetch();
        } else {
          toast.error(result?.message || "Something went wrong");
        }
      } catch (error) {
        toast.error(error?.message);
      } finally {
        setLoading((prev) => ({ ...prev, [field]: false }));
      }
    }
  };

  const currentField = policyTabs.find((t) => t.id === activeTab)?.field;

  return (
    <div className="space-y-6">
      {/* Policy Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
        {policyTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {policyTabs.find((t) => t.id === activeTab)?.label}
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            <ReactQuill
              theme="snow"
              value={policies[currentField]}
              onChange={(value) =>
                setPolicies((prev) => ({ ...prev, [currentField]: value }))
              }
              modules={modules}
              readOnly={!isEditing}
              className={`h-64 mb-12 ${!isEditing && "quill-readonly"}`}
            />

            {isEditing && (
              <div className="flex justify-end space-x-3 mt-16">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePolicyUpdate(currentField)}
                  disabled={loading[currentField]}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading[currentField] ? (
                    <>
                      <MiniSpinner />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Changes</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Policies;
