import { RxCross1 } from "react-icons/rx";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Swal from "sweetalert2-optimized";
import { generateSlug } from "./../../utils/generateSlug";
//import ReactTooltip from 'react-tooltip'
import { GrUpdate } from "react-icons/gr";
import { Tooltip } from "react-tooltip";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import AttributeDefaultsSelector from "./AttributeDefaultsSelector";
import CategoryTreePicker from "./CategoryTreePicker";

const UpDateCategory = ({
  setCategoryUpdateModal,
  categoryUpdateData,
  refetch,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  //Image Handling...
  const [imagePreview, setImagePreview] = useState(
    categoryUpdateData?.category_logo
  );
  //Video Handling...
  const [videoPreview, setVideoPreview] = useState(
    categoryUpdateData?.category_video
  );

  // Phase B — controlled default attribute selections (seeded from existing doc).
  const [attrDefaults, setAttrDefaults] = useState({
    default_variant_attributes:
      categoryUpdateData?.default_variant_attributes?.map((id) => String(id)) ||
      [],
    default_filter_attributes:
      categoryUpdateData?.default_filter_attributes?.map((id) => String(id)) ||
      [],
  });

  // M24 — re-parent. Seeded from the existing doc; null = root. Tracked
  // separately from form state so we can compare and gate confirmation.
  const originalParentId = categoryUpdateData?.parent_id
    ? String(categoryUpdateData.parent_id)
    : null;
  const [selectedParentId, setSelectedParentId] = useState(originalParentId);

  // Helper used inside every branch to append the multi-select ids onto the
  // outbound FormData. Sent as JSON-stringified arrays (multer collapses
  // repeated keys to last value, so per-id append doesn't work). Always sent
  // so that clearing the list writes [] and removes stale ids.
  const appendAttrDefaults = (fd) => {
    fd.append(
      "default_variant_attributes",
      JSON.stringify(attrDefaults.default_variant_attributes || []),
    );
    fd.append(
      "default_filter_attributes",
      JSON.stringify(attrDefaults.default_filter_attributes || []),
    );
  };

  // M24 — append parent_id only when explicitly set (sending "" wipes parent
  // to root, which is intentional when admin clears the picker).
  const appendParent = (fd) => {
    fd.append("parent_id", selectedParentId || "");
  };

  // M24 — confirm re-parent with admin BEFORE submit. Fetches impact counts
  // from BE (cheap pair of countDocuments) and shows a SweetAlert. Returns
  // true if admin confirmed OR no re-parent happened, false on cancel.
  const confirmReparentIfNeeded = async () => {
    const isReparent = selectedParentId !== originalParentId;
    if (!isReparent) return true;
    // Client-side self-pick guard (BE also rejects this with a clear error).
    if (selectedParentId && selectedParentId === String(categoryUpdateData?._id)) {
      toast.error("A category cannot be its own parent", { autoClose: 2000 });
      return false;
    }
    try {
      const res = await fetch(
        `${BASE_URL}/category/reparent-impact/${categoryUpdateData?._id}`,
        { credentials: "include" },
      );
      const json = await res.json();
      const { descendant_count = 0, product_count = 0 } = json?.data || {};
      const oldLabel = originalParentId ? "current parent" : "Root";
      const newLabel = selectedParentId ? "new parent" : "Root";
      const confirm = await Swal.fire({
        title: "Move this category?",
        html:
          `Moving <strong>"${categoryUpdateData?.category_name}"</strong> from ${oldLabel} → ${newLabel}.<br/><br/>` +
          `This will also move:<br/>` +
          `• <strong>${descendant_count}</strong> nested categor${descendant_count === 1 ? "y" : "ies"}<br/>` +
          `• <strong>${product_count}</strong> attached product${product_count === 1 ? "" : "s"}<br/><br/>` +
          `<span style="color:#b91c1c">Category paths will be re-snapshot on every affected document. This cannot be undone in one click.</span>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, move",
        cancelButtonText: "Cancel",
      });
      return !!confirm.isConfirmed;
    } catch {
      toast.error("Failed to compute move impact — try again", {
        autoClose: 2000,
      });
      return false;
    }
  };

  //
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  // Handle Update Category
  const handleDataPost = async (data) => {
    // M24 — if parent changed, confirm with admin before submitting.
    const ok = await confirmReparentIfNeeded();
    if (!ok) return;

    if (data?.category_logo[0] && data?.category_video[0]) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "category_logo") {
          formData.append(key, data?.category_logo[0]);
        } else if (key === "category_video") {
          formData.append(key, data?.category_video[0]);
        } else formData.append(key, value);
      });

      formData.append(
        "category_logo_key",
        categoryUpdateData?.category_logo_key
      );
      formData.append(
        "category_video_key",
        categoryUpdateData?.category_video_key
      );

      const category_slug = generateSlug(
        data?.category_name
          ? data?.category_name
          : categoryUpdateData?.category_name
      );
      formData.append("category_slug", category_slug);
      formData.append("_id", categoryUpdateData?._id);
      formData.append("category_updated_by", user?._id);
      appendAttrDefaults(formData);
      appendParent(formData);
      const response = await fetch(`${BASE_URL}/category`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Category update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setCategoryUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } else if (data?.category_logo[0]) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "category_logo") {
          formData.append(key, data?.category_logo[0]);
        } else if (key === "category_video") {
        } else formData.append(key, value);
      });

      formData.append(
        "category_logo_key",
        categoryUpdateData?.category_logo_key
      );

      const category_slug = generateSlug(
        data?.category_name
          ? data?.category_name
          : categoryUpdateData?.category_name
      );
      formData.append("category_slug", category_slug);
      formData.append("_id", categoryUpdateData?._id);
      formData.append("category_updated_by", user?._id);
      appendAttrDefaults(formData);
      appendParent(formData);
      const response = await fetch(`${BASE_URL}/category`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Category update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setCategoryUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } else if (data?.category_video[0]) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "category_video") {
          formData.append(key, data?.category_video[0]);
        } else if (key === "category_logo") {
        } else formData.append(key, value);
      });

      formData.append(
        "category_video_key",
        categoryUpdateData?.category_video_key
      );

      const category_slug = generateSlug(
        data?.category_name
          ? data?.category_name
          : categoryUpdateData?.category_name
      );
      formData.append("category_slug", category_slug);
      formData.append("_id", categoryUpdateData?._id);
      formData.append("category_updated_by", user?._id);
      appendAttrDefaults(formData);
      appendParent(formData);
      const response = await fetch(`${BASE_URL}/category`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Category update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setCategoryUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } else {
      setLoading(true);
      const sendData = {
        _id: categoryUpdateData?._id,

        category_name: data?.category_name
          ? data?.category_name
          : categoryUpdateData?.category_name,
        category_serial: data?.category_serial
          ? data?.category_serial
          : categoryUpdateData?.category_serial,
        category_status: data?.category_status
          ? data?.category_status
          : categoryUpdateData?.category_status,
        feature_category_show: data?.feature_category_show,

        explore_category_show: data?.explore_category_show,
        category_updated_by: user?._id,
        category_slug: generateSlug(
          data?.category_name
            ? data?.category_name
            : categoryUpdateData?.category_name
        ),
        // Phase B — real arrays in JSON path; backend normalizer accepts both
        // arrays and stringified arrays.
        default_variant_attributes:
          attrDefaults.default_variant_attributes || [],
        default_filter_attributes: attrDefaults.default_filter_attributes || [],
        // M24 — explicit parent_id: null wipes parent → root.
        parent_id: selectedParentId || null,
      };
      const response = await fetch(`${BASE_URL}/category`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Category update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setCategoryUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mt-4">
              <h3
                className="text-[26px] font-bold text-gray-800 capitalize"
                id="modal-title"
              >
                Update Category
              </h3>
              <button
                type="button"
                className="btn bg-white  p-1 absolute right-3 rounded-full top-3 hover:bg-bgBtnInactive hover:text-btnInactiveColor"
                onClick={() => setCategoryUpdateModal(false)}
              >
                {" "}
                <RxCross1 size={20}></RxCross1>
              </button>
            </div>

            <hr className="mt-2 mb-6" />

            <form onSubmit={handleSubmit(handleDataPost)} className="">
              <div>
                <label
                  htmlFor="UserEmail"
                  className="block text-xs font-medium text-gray-700"
                >
                  Category Name
                </label>

                <input
                  {...register("category_name")}
                  type="text"
                  defaultValue={categoryUpdateData?.category_name}
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Category Status
                  </label>
                  <select
                    {...register("category_status")}
                    defaultValue={categoryUpdateData?.category_status}
                    className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
                  >
                    <option value="active">Active</option>
                    <option value="in-active">In-Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Category serial
                  </label>

                  <input
                    {...register("category_serial", {
                      validate: (value) => {
                        if (value < 1) {
                          return "serial must be greater than 0";
                        }
                      },
                    })}
                    type="number"
                    defaultValue={categoryUpdateData?.category_serial}
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Explore Category show
                  </label>
                  <div className="whitespace-nowrap px-4 py-2 text-gray-700 ">
                    <label
                      htmlFor="Toggle3"
                      className="inline-flex items-center space-x-4 cursor-pointer dark:text-gray-800"
                    >
                      <span className="relative mt-2">
                        <input
                          id="Toggle3"
                          type="checkbox"
                          defaultChecked={
                            categoryUpdateData?.explore_category_show
                          }
                          className="hidden peer"
                          {...register("explore_category_show")}
                        />
                        <div className="w-10 h-4 rounded-full shadow bg-slate-200 peer-checked:bg-bgBtnActive "></div>
                        <div className="absolute left-0 w-6 h-6 rounded-full shadow -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primaryColor bg-white"></div>
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Feature Category show
                  </label>
                  <div className="whitespace-nowrap px-4 py-2 text-gray-700 ">
                    <label
                      htmlFor="Toggle4"
                      className="inline-flex items-center space-x-4 cursor-pointer dark:text-gray-800"
                    >
                      <span className="relative mt-2">
                        <input
                          id="Toggle4"
                          type="checkbox"
                          defaultChecked={
                            categoryUpdateData?.feature_category_show
                          }
                          className="hidden peer"
                          {...register("feature_category_show")}
                        />
                        <div className="w-10 h-4 rounded-full shadow bg-slate-200 peer-checked:bg-bgBtnActive "></div>
                        <div className="absolute left-0 w-6 h-6 rounded-full shadow -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primaryColor bg-white"></div>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* M24 — Parent category picker. Default = current parent (or root).
                  Changing this triggers the confirm-impact modal on submit. */}
              <div className="mt-6">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Parent category{" "}
                  <span className="text-gray-400 font-normal">
                    (leave empty for root level)
                  </span>
                </label>
                <CategoryTreePicker
                  value={selectedParentId}
                  includeInactive
                  onChange={(node) =>
                    setSelectedParentId(node ? String(node._id) : null)
                  }
                  placeholder="Root (no parent)"
                />
                {selectedParentId !== originalParentId && (
                  <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    ⚠️ Parent changed — confirmation dialog will show how many
                    nested categories + products move with this on save.
                  </p>
                )}
              </div>

              {/* Phase B — Default attributes for products under this category */}
              <AttributeDefaultsSelector
                parentId={categoryUpdateData?.parent_id || null}
                initialVariantIds={
                  categoryUpdateData?.default_variant_attributes || []
                }
                initialFilterIds={
                  categoryUpdateData?.default_filter_attributes || []
                }
                onChange={setAttrDefaults}
              />

              {/* image */}
              <div className="mt-6 relative">
                {imagePreview && (
                  <>
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover my-2 rounded "
                      />
                    </div>
                  </>
                )}
                <>
                  <label
                    className="p-2  bg-primaryColor  rounded cursor-pointer absolute top-2  right-2 text-white border "
                    htmlFor="category_logo"
                    data-tooltip-id="category-image"
                    data-tooltip-content="Upload Your Image"
                  >
                    <GrUpdate size={25} />
                    <Tooltip id="category-image" />
                    <Tooltip />
                  </label>

                  <input
                    {...register("category_logo")}
                    accept="image/*"
                    type="file"
                    id="category_logo"
                    className=" sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white  file:border-none file:rounded file:px-2 file:py-1.5"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-[#C9CACA]  mt-1 text-end">
                    Upload 300x300 pixel images in PNG, JPG, or WebP format (max
                    1 MB).
                  </p>
                </>
              </div>

              {/* video */}
              <div className="mt-6 relative">
                {videoPreview && (
                  <>
                    <div className="relative">
                      <video
                        src={videoPreview}
                        autoPlay
                        controls
                        alt="Preview"
                        className="w-full h-64 object-cover my-2 rounded "
                      />
                    </div>
                  </>
                )}
                <>
                  <label
                    className="p-2  bg-primaryColor  rounded cursor-pointer absolute top-2  right-2 text-white border "
                    htmlFor="category_video"
                    data-tooltip-id="category-video"
                    data-tooltip-content="Upload Your Video"
                  >
                    <GrUpdate size={25} />
                    <Tooltip id="category-video" />
                    <Tooltip />
                  </label>

                  <input
                    {...register("category_video")}
                    accept="video/*"
                    type="file"
                    id="category_video"
                    className=" sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white  file:border-none file:rounded file:px-2 file:py-1.5"
                    onChange={handleVideoChange}
                  />
                </>
              </div>

              <div className="flex gap-8 mt-6 justify-end">
                <button
                  className="px-10 py-2 border  rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor"
                  onClick={() => setCategoryUpdateModal(false)}
                >
                  Cancel
                </button>
                {loading ? (
                  <div className="px-10 py-2  bg-primaryColor text-white rounded flex justify-center items-center">
                    <MiniSpinner />
                  </div>
                ) : (
                  <button
                    className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                    type="Submit"
                  >
                    Update
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpDateCategory;
