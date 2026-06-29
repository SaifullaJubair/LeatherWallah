import { useState, useRef, useEffect } from "react";
import { FiX, FiUpload, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";

// A2 — Images Modal. Manages a product's main_image + other_images[].
// Calls PATCH /product/images with a `mode` field that picks the operation
// server-side (swap_main / add_other / reorder / remove_other).
//
// Keep this modal focused on the image gallery only — side-images (benefits/
// use_cases/faq/og) live in their own Page Content editor. Cross-app S3
// cleanup is reference-counted within product on the BE.
const ProductImagesModal = ({ product, onClose, onSaved }) => {
  const [busy, setBusy] = useState(false);
  const mainFileRef = useRef(null);
  const otherFilesRef = useRef(null);
  const [otherImages, setOtherImages] = useState(
    Array.isArray(product?.other_images) ? product.other_images : [],
  );
  const [mainImage, setMainImage] = useState(product?.main_image || "");
  const [mainImageKey, setMainImageKey] = useState(product?.main_image_key || "");
  // Local previews for files the owner just picked (before upload), so they can
  // confirm WHAT they selected. Revoked on replace + unmount to avoid the
  // admin-wide createObjectURL leak (see admin CLAUDE.md A-14).
  const [mainPreview, setMainPreview] = useState("");
  // pendingOthers holds the actual File objects in component state (not the
  // read-only input.files FileList) so individual ones can be removed before
  // upload. Each entry: { file, url }.
  const [pendingOthers, setPendingOthers] = useState([]);

  const onPickMain = () => {
    const file = mainFileRef.current?.files?.[0];
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainPreview(file ? URL.createObjectURL(file) : "");
  };

  const onPickOthers = () => {
    const files = otherFilesRef.current?.files;
    if (files && files.length) {
      const added = Array.from(files).map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      }));
      // Append to whatever was already staged so picking twice accumulates
      // instead of replacing.
      setPendingOthers((prev) => [...prev, ...added]);
    }
    // Clear the input so re-picking the same file re-fires onChange.
    if (otherFilesRef.current) otherFilesRef.current.value = "";
  };

  const removePendingOther = (idx) => {
    setPendingOthers((prev) => {
      const target = prev[idx];
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Final cleanup of any pending preview URLs when the modal unmounts.
  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview);
      pendingOthers.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apiCall = async (formData) => {
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/product/images`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data?.statusCode === 200 && data?.success) {
        toast.success(data.message || "Updated", { autoClose: 1200 });
        setOtherImages(data?.data?.other_images || []);
        setMainImage(data?.data?.main_image || "");
        setMainImageKey(data?.data?.main_image_key || "");
        onSaved?.();
        return true;
      } else {
        toast.error(data?.message || "Update failed", { autoClose: 1500 });
        return false;
      }
    } catch (err) {
      toast.error("Network error", { autoClose: 1500 });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleMainSwap = async () => {
    const file = mainFileRef.current?.files?.[0];
    if (!file) {
      toast.info("Pick an image first", { autoClose: 1200 });
      return;
    }
    const fd = new FormData();
    fd.append("_id", product._id);
    fd.append("mode", "swap_main");
    fd.append("main_image", file);
    await apiCall(fd);
    if (mainFileRef.current) mainFileRef.current.value = "";
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainPreview("");
  };

  const handleAddOthers = async () => {
    if (pendingOthers.length === 0) {
      toast.info("Pick images first", { autoClose: 1200 });
      return;
    }
    const fd = new FormData();
    fd.append("_id", product._id);
    fd.append("mode", "add_other");
    pendingOthers.forEach((p) => fd.append("other_images", p.file));
    const ok = await apiCall(fd);
    if (ok) {
      if (otherFilesRef.current) otherFilesRef.current.value = "";
      pendingOthers.forEach((p) => URL.revokeObjectURL(p.url));
      setPendingOthers([]);
    }
  };

  const handleRemoveOther = async (key) => {
    const confirm = await Swal.fire({
      title: "Remove this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;
    const fd = new FormData();
    fd.append("_id", product._id);
    fd.append("mode", "remove_other");
    fd.append("removed_keys", JSON.stringify([key]));
    await apiCall(fd);
  };

  const moveImage = async (idx, dir) => {
    const newOrder = [...otherImages];
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= newOrder.length) return;
    [newOrder[idx], newOrder[tgt]] = [newOrder[tgt], newOrder[idx]];
    // Snapshot pre-swap order so we can rollback on network/server failure —
    // otherwise the optimistic UI lies until modal close.
    const prevOrder = otherImages;
    setOtherImages(newOrder);
    const fd = new FormData();
    fd.append("_id", product._id);
    fd.append("mode", "reorder");
    fd.append(
      "ordered_keys",
      JSON.stringify(newOrder.map((o) => o.other_image_key).filter(Boolean)),
    );
    const ok = await apiCall(fd);
    if (!ok) setOtherImages(prevOrder);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Images — {product?.product_name}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Main image */}
          <div>
            <h3 className="font-medium text-sm mb-2">Main Image</h3>
            <div className="flex items-center gap-4">
              {mainImage ? (
                <div className="text-center">
                  <img
                    src={mainImage}
                    alt="main"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <span className="text-[10px] text-gray-400">Current</span>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
              {/* Pending selection preview — only shown after the owner picks a
                  new file, so they can confirm before replacing. */}
              {mainPreview && (
                <div className="text-center">
                  <img
                    src={mainPreview}
                    alt="new main"
                    className="w-32 h-32 object-cover rounded border-2 border-green-500"
                  />
                  <span className="text-[10px] font-medium text-green-600">
                    New (preview)
                  </span>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={mainFileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickMain}
                  className="text-sm mb-2 block"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleMainSwap}
                  className="inline-flex items-center gap-1 bg-primaryColor text-white text-sm px-3 py-1.5 rounded hover:bg-blue-500 disabled:opacity-50"
                >
                  <FiUpload size={14} /> Replace main
                </button>
              </div>
            </div>
          </div>

          {/* Other images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">
                Other Images ({otherImages.length})
              </h3>
              <div className="flex items-center gap-2">
                <input
                  ref={otherFilesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickOthers}
                  className="text-xs"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleAddOthers}
                  className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-500 disabled:opacity-50"
                >
                  <FiUpload size={12} /> Add
                </button>
              </div>
            </div>
            {/* Pending selection previews — shown until the owner clicks Add.
                Each has an × to drop it individually before uploading. */}
            {pendingOthers.length > 0 && (
              <div className="mb-3 p-2 rounded border-2 border-dashed border-green-300 bg-green-50">
                <p className="text-[11px] font-medium text-green-700 mb-1.5">
                  {pendingOthers.length} new image(s) selected — click Add to
                  upload (× to drop one)
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {pendingOthers.map((p, i) => (
                    <div
                      key={i}
                      className="relative group rounded overflow-hidden border border-green-400"
                    >
                      <img
                        src={p.url}
                        alt={`new-${i}`}
                        className="w-full h-16 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingOther(i)}
                        title="Remove from selection"
                        className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-80 hover:bg-red-600 hover:opacity-100"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {otherImages.length === 0 ? (
              <div className="text-sm text-gray-400 italic">
                No additional images.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {otherImages.map((img, i) => (
                  <div
                    key={img?.other_image_key || i}
                    className="relative border rounded overflow-hidden group"
                  >
                    <img
                      src={img?.other_image}
                      alt={`other-${i}`}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white flex items-center justify-between px-1 py-0.5 opacity-0 group-hover:opacity-100 transition">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={busy || i === 0}
                          onClick={() => moveImage(i, -1)}
                          title="Move left"
                          className="hover:text-yellow-300 disabled:opacity-30"
                        >
                          <FiArrowUp size={14} className="rotate-[-90deg]" />
                        </button>
                        <button
                          type="button"
                          disabled={busy || i === otherImages.length - 1}
                          onClick={() => moveImage(i, 1)}
                          title="Move right"
                          className="hover:text-yellow-300 disabled:opacity-30"
                        >
                          <FiArrowDown size={14} className="rotate-[-90deg]" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRemoveOther(img?.other_image_key)}
                        title="Remove"
                        className="hover:text-red-300"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 border-t pt-3">
            Side images (benefits / use cases / FAQ / OG) live in the Page
            Content editor. Open the PG button on the product row to edit
            those.
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductImagesModal;
