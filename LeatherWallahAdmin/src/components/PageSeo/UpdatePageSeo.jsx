import { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { RxCross1 } from "react-icons/rx";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { SettingContext } from "../../context/SettingProvider";

const UpdatePageSeo = ({
  setShowPageSeoUpdateModal,
  getPageSeoUpdateData,
  refetch,
}) => {
  const [loading, setLoading] = useState(false);
  const { settingData, loading: settingLoading } = useContext(SettingContext);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: getPageSeoUpdateData?.title || "",
      description: getPageSeoUpdateData?.description || "",
      noIndex: getPageSeoUpdateData?.noIndex || false,
    },
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (getPageSeoUpdateData) {
      reset({
        title: getPageSeoUpdateData?.title || "",
        description: getPageSeoUpdateData?.description || "",
        noIndex: getPageSeoUpdateData?.noIndex || false,
      });
    }
  }, [getPageSeoUpdateData, reset]);

  // Watch for changes
  const watchTitle = watch("title");
  const watchDescription = watch("description");
  const watchNoIndex = watch("noIndex");

  // Get character counts
  const titleLength = watchTitle?.length || 0;
  const descLength = watchDescription?.length || 0;

  // Get site name from settings
  const siteName = settingData?.title || "Leather Wallah";

  const siteNameLength = siteName.length + 3 || 20;

  // Calculate full title with site name (matching your template: `%s | ${seo.siteName}`)
  const fullTitleWithSiteName = watchTitle ? `${watchTitle} | ${siteName}` : "";
  const fullTitleLength = fullTitleWithSiteName.length;

  // Check if title will be truncated (over 60 chars including site name)
  const isTitleTooLong = fullTitleLength > 60;

  // Get color for meta title input
  const getTitleColorClass = () => {
    if (titleLength === 0) return "text-gray-400";
    if (titleLength <= 15) return "text-red-600"; // Too short (0-15)
    if (titleLength <= 20) return "text-orange-500"; // Short (16-20)
    if (titleLength <= 35) return "text-green-600"; // Perfect (21-35) 👈 Ideal
    if (titleLength <= 40) return "text-yellow-600"; // Near limit (36-40)
    return "text-red-600"; // Limit exceed (41+)
  };

  // Description color classes -
  const getDescColorClass = () => {
    if (descLength === 0) return "text-gray-400";
    if (descLength < 100) return "text-red-600"; // Too short (<100)
    if (descLength <= 119) return "text-orange-500"; // Short (100-119)
    if (descLength <= 150) return "text-green-600"; // Perfect (120-150) 👈 Ideal
    if (descLength <= 160) return "text-yellow-600"; // Near limit (151-160)
    return "text-red-600"; // Limit exceed (161+)
  };
  // Handle Update Page SEO
  const handleDataUpdate = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/page-seo/${getPageSeoUpdateData?.page_key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Page SEO updated successfully",
          { autoClose: 1000 },
        );
        refetch();
        setLoading(false);
        setShowPageSeoUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message, { autoClose: 1000 });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (settingLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg">
          <MiniSpinner />
        </div>
      </div>
    );
  }

  // Determine if form is valid to submit
  const isFormValid = () => {
    if (!watchTitle) return false; // Title is required
    if (titleLength > 60) return false; // Title can't exceed 60
    if (descLength > 160) return false; // Description can't exceed 160
    return true;
  };

  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[650px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mt-4">
            <h3
              className="text-[26px] font-bold text-gray-800 capitalize"
              id="modal-title"
            >
              Update Page SEO - {getPageSeoUpdateData?.page_key}
            </h3>
            <button
              type="button"
              className="btn bg-white p-1 absolute right-3 rounded-full top-3 hover:bg-bgBtnInactive hover:text-btnInactiveColor"
              onClick={() => setShowPageSeoUpdateModal(false)}
            >
              <RxCross1 size={20} />
            </button>
          </div>

          <hr className="mt-2 mb-6" />

          <form onSubmit={handleSubmit(handleDataUpdate)}>
            {/* Page Path (Read-only) */}
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Page Path
              </label>
              <input
                type="text"
                value={`/${getPageSeoUpdateData?.path || ""}`}
                disabled
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* NoIndex Warning */}
            {watchNoIndex && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  ⚠️ This page is set as{" "}
                  <span className="font-bold">NoIndex</span>. It will be hidden
                  from search engines (Google, Bing, etc.). Use this only for
                  private pages like login, cart, checkout, etc.
                </p>
              </div>
            )}

            {/* Meta Title */}
            {/* Meta Title */}
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-gray-700">
                  Meta Title <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs font-medium ${getTitleColorClass()}`}>
                  {titleLength}/40 characters
                  <span className="text-gray-400 ml-1">
                    (site name সহ {titleLength + siteNameLength}/60)
                  </span>
                </span>
              </div>
              <input
                {...register("title", {
                  required: "Meta Title is required",
                  maxLength: {
                    value: 40,
                    message: "Title should be max 40 characters",
                  },
                  minLength: {
                    value: 21,
                    message:
                      "Title should be at least 21 characters for best results",
                  },
                })}
                type="text"
                placeholder="Enter meta title (max 40 characters)"
                className={`mt-2 w-full rounded-md shadow-sm sm:text-sm p-2 border-2 ${
                  errors.title
                    ? "border-red-500 focus:border-red-500"
                    : titleLength > 40
                      ? "border-red-500 focus:border-red-500"
                      : titleLength > 35
                        ? "border-yellow-500 focus:border-yellow-500"
                        : titleLength >= 21
                          ? "border-green-500 focus:border-green-500"
                          : titleLength >= 16
                            ? "border-orange-500 focus:border-orange-500"
                            : titleLength > 0
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 focus:border-primaryColor"
                }`}
              />

              {/* Progress bar */}
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    titleLength > 40
                      ? "bg-red-500"
                      : titleLength > 35
                        ? "bg-yellow-500"
                        : titleLength >= 21
                          ? "bg-green-500"
                          : titleLength >= 16
                            ? "bg-orange-500"
                            : titleLength > 0
                              ? "bg-red-500"
                              : "bg-gray-200"
                  }`}
                  style={{
                    width: `${Math.min((titleLength / 40) * 100, 100)}%`,
                  }}
                ></div>
              </div>

              {errors.title && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.title?.message}
                </p>
              )}

              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-green-600">Ideal:</span>{" "}
                  21-35 characters
                </p>
                {titleLength > 0 && titleLength <= 15 && (
                  <p className="text-xs text-red-600">
                    ⚠️ Too short (aim for 21-35)
                  </p>
                )}
                {titleLength >= 16 && titleLength <= 20 && (
                  <p className="text-xs text-orange-500">
                    ⚠️ Short (try to add more)
                  </p>
                )}
                {titleLength >= 21 && titleLength <= 35 && (
                  <p className="text-xs text-green-600">
                    ✓ Perfect length! ({titleLength + siteNameLength}/60 with
                    site name)
                  </p>
                )}
                {titleLength >= 36 && titleLength <= 40 && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Near limit ({titleLength + siteNameLength}/60 total)
                  </p>
                )}
                {titleLength > 40 && (
                  <p className="text-xs text-red-600">
                    ✗ Too long ({titleLength + siteNameLength}/60 total)
                  </p>
                )}
              </div>
            </div>

            {/* Meta Description */}
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-gray-700">
                  Meta Description
                </label>
                <span className={`text-xs font-medium ${getDescColorClass()}`}>
                  {descLength}/160 characters
                </span>
              </div>
              <textarea
                {...register("description", {
                  maxLength: {
                    value: 160,
                    message: "Description should be max 160 characters",
                  },
                  minLength: {
                    value: 100,
                    message:
                      "Description should be at least 100 characters for best results",
                  },
                })}
                rows={4}
                placeholder="Enter meta description (120-150 characters ideal)"
                className={`mt-2 w-full rounded-md shadow-sm sm:text-sm p-2 border-2 ${
                  errors.description
                    ? "border-red-500 focus:border-red-500"
                    : descLength > 160
                      ? "border-red-500 focus:border-red-500"
                      : descLength > 150
                        ? "border-yellow-500 focus:border-yellow-500"
                        : descLength >= 120
                          ? "border-green-500 focus:border-green-500"
                          : descLength >= 100
                            ? "border-orange-500 focus:border-orange-500"
                            : descLength > 0
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200 focus:border-primaryColor"
                }`}
              />

              {/* Progress bar */}
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    descLength > 160
                      ? "bg-red-500"
                      : descLength > 150
                        ? "bg-yellow-500"
                        : descLength >= 120
                          ? "bg-green-500"
                          : descLength >= 100
                            ? "bg-orange-500"
                            : descLength > 0
                              ? "bg-red-500"
                              : "bg-gray-200"
                  }`}
                  style={{
                    width: `${Math.min((descLength / 160) * 100, 100)}%`,
                  }}
                ></div>
              </div>

              {errors.description && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.description?.message}
                </p>
              )}

              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-green-600">Ideal:</span>{" "}
                  120-150 characters
                </p>
                {descLength > 0 && descLength < 100 && (
                  <p className="text-xs text-red-600">
                    ⚠️ Too short (add more details)
                  </p>
                )}
                {descLength >= 100 && descLength <= 119 && (
                  <p className="text-xs text-orange-500">
                    ⚠️ Short (try to add more aim for 120-150)
                  </p>
                )}
                {descLength >= 120 && descLength <= 150 && (
                  <p className="text-xs text-green-600">✓ Perfect length!</p>
                )}
                {descLength > 150 && descLength <= 160 && (
                  <p className="text-xs text-yellow-600">⚠️ Near limit</p>
                )}
                {descLength > 160 && (
                  <p className="text-xs text-red-600">✗ Too long (max 160)</p>
                )}
              </div>
            </div>

            {/* NoIndex Toggle */}
            <div className="mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  {...register("noIndex")}
                  type="checkbox"
                  className="w-4 h-4 text-primaryColor border-gray-300 rounded focus:ring-primaryColor"
                />
                <span className="text-sm font-medium text-gray-700">
                  NoIndex (Hide from search engines)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Check this for private pages (login, cart, checkout, etc.)
              </p>
            </div>

            {/* Google Search Preview - Matches your frontend implementation */}
            {watchTitle && (
              <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-6h2v6zm0-8h-2V6h2v2z" />
                  </svg>
                  Google Search Preview
                </h4>

                <div className="space-y-2 font-sans">
                  {/* Title - matches your template: %s | siteName */}
                  <div>
                    <div className="text-sm text-blue-700 hover:underline cursor-pointer font-medium">
                      {watchTitle}{" "}
                      <span className="text-gray-500">| {siteName}</span>
                    </div>

                    {/* Character count warning */}
                    {isTitleTooLong && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Title will be truncated in search results (
                          {fullTitleLength}/60 chars)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* URL */}
                  <div className="text-xs text-green-700">
                    {window.location.origin}/
                    {getPageSeoUpdateData?.path || "page-url"}
                  </div>

                  {/* Description */}
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {watchDescription || "Meta description will appear here"}
                  </div>

                  {/* Date (optional) */}
                  <div className="text-xs text-gray-400">
                    {new Date().toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    —<span className="text-gray-500 ml-1">Read more</span>
                  </div>
                </div>

                {/* SEO Tips based on length */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {isTitleTooLong && (
                    <p className="text-xs text-orange-600">
                      💡 Tip: Your title is {fullTitleLength} characters with
                      site name. Try to keep it under 60 for better visibility.
                    </p>
                  )}
                  {descLength < 120 && descLength > 0 && (
                    <p className="text-xs text-yellow-600">
                      💡 Tip: Add more details to your description for better
                      click-through rates.
                    </p>
                  )}
                  {descLength === 0 && (
                    <p className="text-xs text-yellow-600">
                      💡 Tip: Add a meta description to improve search
                      visibility.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6 justify-end">
              <button
                className="px-10 py-2 border rounded hover:bg-gray-100 transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPageSeoUpdateModal(false);
                }}
                type="button"
              >
                Cancel
              </button>
              {loading ? (
                <div className="px-10 py-2 flex items-center justify-center bg-primaryColor text-white rounded">
                  <MiniSpinner />
                </div>
              ) : (
                <button
                  className={`px-10 py-2 rounded text-white transition-colors duration-200 ${
                    isFormValid()
                      ? "bg-primaryColor hover:bg-blue-600 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  type="submit"
                  disabled={!isFormValid()}
                >
                  Update
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePageSeo;
