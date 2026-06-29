import { useState, useRef, useEffect } from "react";
import { FiX, FiUpload, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { BASE_URL } from "../../utils/baseURL";

// A2 — Video Modal. Two channels:
//   1. main_video — uploaded mp4/mov/webm; lives in S3. Upload / replace /
//      remove now go through the SAFE partial route PATCH /product/images with
//      mode = swap_video | remove_video (multer.any, 20 MB). This avoids the
//      full-rebuild /product PATCH that wipes other fields.
//   2. video_link — YouTube/Vimeo URL; whitelisted in /product/quick.
const ProductVideoModal = ({ product, onClose, onSaved }) => {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [videoLink, setVideoLink] = useState(product?.video_link || "");
  const [currentVideo, setCurrentVideo] = useState(product?.main_video || "");
  // Local preview of the file just picked, so the owner confirms before upload.
  const [videoPreview, setVideoPreview] = useState("");

  const onPickVideo = () => {
    const file = fileRef.current?.files?.[0];
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(file ? URL.createObjectURL(file) : "");
  };

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Partial JSON route for the external link only.
  const apiQuickPatch = async (body) => {
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/product/quick`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ _id: product._id, ...body }),
      });
      const data = await res.json();
      if (data?.statusCode === 200 && data?.success) {
        toast.success("Updated", { autoClose: 1200 });
        onSaved?.();
        return true;
      }
      toast.error(data?.message || "Update failed", { autoClose: 1500 });
      return false;
    } catch {
      toast.error("Network error", { autoClose: 1500 });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Multipart route for the uploaded main_video (swap_video / remove_video).
  const apiVideoPatch = async (formData) => {
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
        setCurrentVideo(data?.data?.main_video || "");
        onSaved?.();
        return true;
      }
      toast.error(data?.message || "Update failed", { autoClose: 1500 });
      return false;
    } catch {
      toast.error("Network error", { autoClose: 1500 });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveLink = async () => {
    await apiQuickPatch({ video_link: videoLink || "" });
  };

  const handleUploadVideo = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.info("Pick a video first", { autoClose: 1200 });
      return;
    }
    const fd = new FormData();
    fd.append("_id", product._id);
    fd.append("mode", "swap_video");
    fd.append("main_video", file);
    const ok = await apiVideoPatch(fd);
    if (ok) {
      if (fileRef.current) fileRef.current.value = "";
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoPreview("");
    }
  };

  const handleRemoveVideo = async () => {
    const ok = await Swal.fire({
      title: "Remove uploaded video?",
      text: "The uploaded main video file will be deleted from storage.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append("_id", product._id);
    fd.append("mode", "remove_video");
    await apiVideoPatch(fd);
  };

  const handleRemoveLink = async () => {
    const ok = await Swal.fire({
      title: "Clear video link?",
      text: "External video URL will be removed. The uploaded main video (if any) is unchanged.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, clear",
    });
    if (!ok.isConfirmed) return;
    setVideoLink("");
    await apiQuickPatch({ video_link: "" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Video — {product?.product_name}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Uploaded main video */}
          <div>
            <h3 className="font-medium text-sm mb-2">Uploaded Main Video</h3>
            {currentVideo ? (
              <div className="space-y-2">
                <video
                  src={currentVideo}
                  controls
                  className="w-full max-h-64 rounded border bg-black"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRemoveVideo}
                  className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-sm disabled:opacity-50"
                >
                  <FiTrash2 size={14} /> Remove uploaded video
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                No uploaded video on this product.
              </div>
            )}
          </div>

          {/* Upload / replace */}
          <div className="border rounded p-3 bg-gray-50">
            <h3 className="font-medium text-sm mb-2">
              {currentVideo ? "Replace Video" : "Upload Video"}{" "}
              <span className="text-xs font-normal text-gray-400">
                (mp4 / mov / webm, ≤ 20 MB)
              </span>
            </h3>
            {videoPreview && (
              <video
                src={videoPreview}
                controls
                className="w-full max-h-56 rounded border-2 border-green-500 mb-2 bg-black"
              />
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm,.avi"
                onChange={onPickVideo}
                className="text-sm flex-1"
              />
              <button
                type="button"
                disabled={busy}
                onClick={handleUploadVideo}
                className="inline-flex items-center gap-1 bg-primaryColor text-white text-sm px-3 py-1.5 rounded hover:bg-blue-500 disabled:opacity-50"
              >
                <FiUpload size={14} /> {currentVideo ? "Replace" : "Upload"}
              </button>
            </div>
          </div>

          {/* External video link */}
          <div>
            <h3 className="font-medium text-sm mb-2">
              External Video URL (YouTube / Vimeo)
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://youtu.be/..."
                className="flex-1 px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primaryColor"
              />
              <button
                type="button"
                disabled={busy}
                onClick={saveLink}
                className="bg-primaryColor text-white text-sm px-3 py-1.5 rounded hover:bg-blue-500 disabled:opacity-50"
              >
                Save
              </button>
              {videoLink && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRemoveLink}
                  className="text-red-500 hover:text-red-600 p-1"
                  title="Clear link"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Cheap alternative to uploading. Renders on PDP as an embed.
            </div>
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

export default ProductVideoModal;
