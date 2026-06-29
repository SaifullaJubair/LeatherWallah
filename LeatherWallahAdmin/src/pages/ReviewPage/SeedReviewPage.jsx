import { useContext, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AsyncSelect from "react-select/async";
import { AuthContext } from "../../context/AuthProvider";
import { BASE_URL } from "../../utils/baseURL";
import Pagination from "../../components/common/pagination/Pagination";
import { FiUpload, FiPlusCircle, FiList, FiTrash2, FiImage, FiX } from "react-icons/fi";

// ─── Shared: debounced product search for the AsyncSelect picker ──────────────
// Hits the existing admin product list endpoint (perm: product_show). Returns
// { value: _id, label: product_name } options.
let _searchTimer;
const loadProductOptions = (input) =>
  new Promise((resolve) => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/product/dashboard?page=1&limit=20&searchTerm=${encodeURIComponent(input || "")}`,
          { credentials: "include" },
        );
        const data = await res.json();
        const opts = (data?.data || []).map((p) => ({
          value: p._id,
          label: p.product_name || p._id,
        }));
        resolve(opts);
      } catch {
        resolve([]);
      }
    }, 350);
  });

// ─── Sample CSV format shown to admin ────────────────────────────────────────
const SAMPLE_CSV = `review_product_id,review_ratting,review_description,reviewer_name,reviewer_verified,review_image
64abc123...,5,দারুণ পণ্য! খুবই ভালো লেগেছে।,রাহেলা বেগম,true,
64abc124...,4,ভালো quality তবে delivery একটু দেরি হয়েছে।,করিম সাহেব,false,`;

// ─── Bulk Upload Tab ──────────────────────────────────────────────────────────
const BulkTab = () => {
  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  // Shared image: held locally and uploaded LAZILY on submit (only a real run),
  // so an abandoned page never orphans a file in S3.
  const [sharedImageFile, setSharedImageFile] = useState(null);
  const [sharedImagePreview, setSharedImagePreview] = useState("");
  const bulkFileRef = useRef(null);

  const handleSharedImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Only image files allowed", { autoClose: 1800 });
      if (bulkFileRef.current) bulkFileRef.current.value = "";
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB", { autoClose: 1800 });
      if (bulkFileRef.current) bulkFileRef.current.value = "";
      return;
    }
    if (sharedImagePreview) URL.revokeObjectURL(sharedImagePreview);
    setSharedImageFile(f);
    setSharedImagePreview(URL.createObjectURL(f));
  };

  const clearSharedImage = () => {
    if (sharedImagePreview) URL.revokeObjectURL(sharedImagePreview);
    setSharedImageFile(null);
    setSharedImagePreview("");
    if (bulkFileRef.current) bulkFileRef.current.value = "";
  };

  const handleSubmit = async (isDryRun) => {
    let rows;
    try {
      rows = JSON.parse(jsonText);
      if (!Array.isArray(rows)) throw new Error("Must be a JSON array");
    } catch (e) {
      toast.error(`Invalid JSON: ${e.message}`, { autoClose: 2500 });
      return;
    }
    if (rows.length > 500) {
      toast.error("Max 500 rows per upload", { autoClose: 2000 });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      // Always multipart: carries the JSON rows + the (optional) shared image
      // file together, so the image only ever uploads on a real submit.
      const fd = new FormData();
      fd.append("rows", JSON.stringify(rows));
      if (sharedImageFile) fd.append("shared_image", sharedImageFile);

      const res = await fetch(`${BASE_URL}/review/seed/bulk?dry_run=${isDryRun}`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (data?.success) {
        setResult({ ...data.data, dry_run: isDryRun });
        toast.success(data.message, { autoClose: 2000 });
        // Clear the form only after a real save — keep it on dry run so the
        // admin can review then hit "Upload & Save" with the same data.
        if (!isDryRun) {
          setJsonText("");
          clearSharedImage();
        }
      } else {
        toast.error(data?.message || "Upload failed", { autoClose: 2500 });
      }
    } catch {
      toast.error("Network error", { autoClose: 1500 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">Paste a JSON array of review objects:</p>
        <p className="text-xs text-blue-600">Required: <code>review_product_id</code>, <code>review_ratting</code> (1–5), <code>review_description</code></p>
        <p className="text-xs text-blue-600 mt-0.5">Optional: <code>reviewer_name</code>, <code>reviewer_verified</code> (true/false), <code>review_image</code> (URL)</p>
        <p className="text-xs text-blue-600 mt-0.5">Max 500 rows. Duplicate rows (same product + name + description) are skipped automatically.</p>
      </div>

      {/* Shared image — applied to rows that have no review_image of their own.
          Held locally; only uploaded when you actually submit a real run. */}
      <div className="border rounded p-3 bg-gray-50">
        <label className="block text-sm font-medium mb-1">Shared image (optional)</label>
        {sharedImagePreview ? (
          <div className="flex items-center gap-3">
            <img src={sharedImagePreview} alt="shared" className="w-14 h-14 object-cover rounded border" />
            <button
              type="button"
              onClick={clearSharedImage}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <FiX size={14} /> Remove
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-sm border border-dashed rounded px-3 py-2 w-fit cursor-pointer hover:bg-white">
            <FiImage size={16} className="text-gray-500" />
            <span className="text-gray-600">Choose image</span>
            <input
              ref={bulkFileRef}
              type="file"
              accept="image/*"
              onChange={handleSharedImagePick}
              className="hidden"
            />
          </label>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Used only for rows with no <code>review_image</code>. A row&apos;s own image always wins.
          Uploaded only when you submit (not on dry run).
        </p>
      </div>

      {/* Helper: search a product → copies its _id to clipboard so admins don't
          have to hunt the ObjectId by hand for the JSON rows below. */}
      <div>
        <label className="block text-sm font-medium mb-1">Find product ID</label>
        <AsyncSelect
          cacheOptions
          defaultOptions
          value={null}
          onChange={(opt) => {
            if (!opt?.value) return;
            navigator.clipboard?.writeText(opt.value).then(
              () => toast.success(`Copied ID: ${opt.label}`, { autoClose: 1500 }),
              () => toast.info(`ID: ${opt.value}`, { autoClose: 3000 }),
            );
          }}
          loadOptions={loadProductOptions}
          placeholder="Search a product to copy its ID..."
          noOptionsMessage={() => "Type to search products"}
          className="text-sm"
          classNamePrefix="react-select"
        />
        <p className="text-xs text-gray-400 mt-0.5">
          Pick a product → its <code>review_product_id</code> is copied to your clipboard. Paste it into the JSON below.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">JSON Array</label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={12}
          className="w-full border rounded px-3 py-2 text-xs font-mono"
          placeholder='[{"review_product_id": "...", "review_ratting": 5, "review_description": "...", "reviewer_name": "..."}]'
        />
      </div>

      <p className="text-xs text-gray-500">
        <strong>Validate</strong> checks your JSON without saving. <strong>Upload &amp; Save</strong> writes the reviews to the database.
      </p>

      {/* Two explicit actions so it's never ambiguous whether data is saved. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={busy || !jsonText.trim()}
          className="flex items-center gap-2 border border-primaryColor text-primaryColor px-4 py-2 rounded text-sm disabled:opacity-50 hover:bg-blue-50"
        >
          <FiUpload size={14} />
          {busy ? "Processing..." : "Validate (Dry Run)"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={busy || !jsonText.trim()}
          className="flex items-center gap-2 bg-primaryColor text-white px-4 py-2 rounded text-sm disabled:opacity-50 hover:bg-blue-600"
        >
          <FiUpload size={14} />
          {busy ? "Processing..." : "Upload & Save Reviews"}
        </button>
      </div>

      {result && (
        <div className={`rounded p-3 text-sm border ${result.failed?.length ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
          {result.dry_run && (
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Dry run — nothing was saved. Click “Upload &amp; Save Reviews” to commit.
            </p>
          )}
          <div className="flex gap-4 mb-2">
            <span className="text-green-700 font-semibold">
              ✅ {result.dry_run ? "Would insert" : "Inserted"}: {result.inserted}
            </span>
            <span className="text-gray-600">⏭ Skipped (dup): {result.skipped}</span>
            {result.failed?.length > 0 && (
              <span className="text-red-600 font-semibold">❌ Failed: {result.failed.length}</span>
            )}
          </div>
          {result.failed?.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-red-700 mb-1">Failed rows:</p>
              {result.failed.map((f) => (
                <div key={f.row} className="text-xs text-red-600">
                  Row {f.row}: {f.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-700">Sample JSON format</summary>
        <pre className="mt-2 bg-gray-50 border rounded p-2 overflow-x-auto text-[10px]">{`[
  {
    "review_product_id": "64abc123def456...",
    "review_ratting": 5,
    "review_description": "দারুণ পণ্য! খুবই ভালো লেগেছে।",
    "reviewer_name": "রাহেলা বেগম",
    "reviewer_verified": true
  }
]`}</pre>
        <p className="mt-1 text-[10px] text-gray-400">Equivalent CSV fields: {SAMPLE_CSV.split("\n")[0]}</p>
      </details>
    </div>
  );
};

// ─── Manual Add Tab ───────────────────────────────────────────────────────────
const ManualTab = () => {
  const [products, setProducts] = useState([]); // [{ value, label }]
  const [form, setForm] = useState({
    review_ratting: 5,
    review_description: "",
    reviewer_name: "",
    reviewer_verified: false,
    review_status: "active",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Only image files allowed", { autoClose: 1800 });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB", { autoClose: 1800 });
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setProducts([]);
    setForm({ review_ratting: 5, review_description: "", reviewer_name: "", reviewer_verified: false, review_status: "active" });
    clearImage();
  };

  const handleSubmit = async () => {
    if (products.length === 0) {
      toast.error("Select at least one product", { autoClose: 1500 }); return;
    }
    if (!form.review_description.trim()) {
      toast.error("Review description required", { autoClose: 1500 }); return;
    }
    const rating = Number(form.review_ratting);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      toast.error("Rating must be 1–5", { autoClose: 1500 }); return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("review_product_ids", JSON.stringify(products.map((p) => p.value)));
      fd.append("review_ratting", String(rating));
      fd.append("review_description", form.review_description);
      fd.append("reviewer_name", form.reviewer_name);
      fd.append("reviewer_verified", String(form.reviewer_verified));
      fd.append("review_status", form.review_status);
      if (imageFile) fd.append("review_image", imageFile);

      const res = await fetch(`${BASE_URL}/review/seed/manual`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (data?.success) {
        const { inserted = 0, skipped = 0 } = data.data || {};
        toast.success(
          `Added to ${inserted} product(s)${skipped ? `, skipped ${skipped} duplicate(s)` : ""}`,
          { autoClose: 2200 },
        );
        resetForm();
      } else {
        toast.error(data?.message || "Failed", { autoClose: 2000 });
      }
    } catch {
      toast.error("Network error", { autoClose: 1500 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">Products <span className="text-red-500">*</span></label>
        <AsyncSelect
          isMulti
          cacheOptions
          defaultOptions
          value={products}
          onChange={(sel) => setProducts(sel || [])}
          loadOptions={loadProductOptions}
          placeholder="Search products by name..."
          noOptionsMessage={() => "Type to search products"}
          className="text-sm"
          classNamePrefix="react-select"
        />
        <p className="text-xs text-gray-400 mt-0.5">
          The same review is seeded to every selected product. Pick one or many.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Rating <span className="text-red-500">*</span></label>
        <select
          name="review_ratting"
          value={form.review_ratting}
          onChange={handleChange}
          className="border rounded px-3 py-1.5 text-sm bg-white"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{"⭐".repeat(r)} ({r})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Review Text <span className="text-red-500">*</span></label>
        <textarea
          name="review_description"
          value={form.review_description}
          onChange={handleChange}
          rows={3}
          className="w-full border rounded px-3 py-1.5 text-sm"
          placeholder="বাংলা বা English-এ রিভিউ লিখুন..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Reviewer Name</label>
          <input
            name="reviewer_name"
            value={form.reviewer_name}
            onChange={handleChange}
            placeholder="রাহেলা বেগম"
            className="w-full border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="review_status"
            value={form.review_status}
            onChange={handleChange}
            className="w-full border rounded px-3 py-1.5 text-sm bg-white"
          >
            <option value="active">Active (visible)</option>
            <option value="in-active">Hidden</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Review Image (optional)</label>
        {imagePreview ? (
          <div className="flex items-center gap-3">
            <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded border" />
            <button
              type="button"
              onClick={clearImage}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <FiX size={14} /> Remove
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-sm cursor-pointer border border-dashed rounded px-3 py-2 w-fit hover:bg-gray-50">
            <FiImage size={16} className="text-gray-500" />
            <span className="text-gray-600">Upload image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
          </label>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          Max 10 MB. The same image is attached to every selected product.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          name="reviewer_verified"
          checked={form.reviewer_verified}
          onChange={handleChange}
          className="w-4 h-4"
        />
        <span>Mark as &quot;Verified Purchase&quot;</span>
      </label>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="flex items-center gap-2 bg-primaryColor text-white px-4 py-2 rounded text-sm disabled:opacity-50 hover:bg-blue-600"
      >
        <FiPlusCircle size={14} />
        {busy ? "Saving..." : "Add Seed Review"}
      </button>
    </div>
  );
};

// ─── List Tab ─────────────────────────────────────────────────────────────────
const ListTab = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: [`/api/v1/review/seed/list?page=${page}&limit=${limit}&searchTerm=${search}`],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/review/seed/list?page=${page}&limit=${limit}&searchTerm=${encodeURIComponent(search)}`,
        { credentials: "include" },
      );
      return res.json();
    },
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this seeded review?")) return;
    try {
      const res = await fetch(`${BASE_URL}/review`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ _id: id }),
      });
      const d = await res.json();
      if (d?.success) {
        toast.success("Deleted", { autoClose: 1200 });
        refetch();
      } else {
        toast.error(d?.message || "Failed", { autoClose: 1500 });
      }
    } catch {
      toast.error("Network error", { autoClose: 1500 });
    }
  };

  const reviews = data?.data || [];
  const total = data?.totalData || 0;

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by reviewer name or description..."
        className="w-full border rounded px-3 py-1.5 text-sm max-w-sm"
      />

      {isLoading ? (
        <div className="text-sm text-gray-400 py-4">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="text-sm text-gray-400 py-4 text-center">No seeded reviews yet.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Product</th>
                <th className="p-2">Rating</th>
                <th className="p-2 text-left">Reviewer</th>
                <th className="p-2 text-left max-w-xs">Review</th>
                <th className="p-2">Source</th>
                <th className="p-2">Status</th>
                <th className="p-2">Verified</th>
                <th className="p-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r, i) => (
                <tr key={r._id} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className="p-2 text-xs text-gray-600 max-w-[150px] truncate">
                    {r.review_product_id?.product_name || r.review_product_id}
                  </td>
                  <td className="p-2 text-center">{"⭐".repeat(r.review_ratting)}</td>
                  <td className="p-2 text-xs">{r.reviewer_name || <span className="text-gray-400">—</span>}</td>
                  <td className="p-2 text-xs max-w-xs truncate">{r.review_description}</td>
                  <td className="p-2 text-center text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.source === "csv_bulk" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {r.source === "csv_bulk" ? "CSV" : "Manual"}
                    </span>
                  </td>
                  <td className="p-2 text-center text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.review_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.review_status}
                    </span>
                  </td>
                  <td className="p-2 text-center text-xs">
                    {r.reviewer_verified ? "✅" : "—"}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(r._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <Pagination page={page} setPage={setPage} limit={limit} totalData={total} />
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "bulk", label: "Bulk Upload", icon: FiUpload, perm: "review_seed_bulk" },
  { key: "manual", label: "Manual Add", icon: FiPlusCircle, perm: "review_seed_manual" },
  { key: "list", label: "Seeded Reviews", icon: FiList, perm: "review_show" },
];

const SeedReviewPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("bulk");

  const canAccess = user?.role_id?.review_seed_bulk || user?.role_id?.review_seed_manual || user?.role_id?.review_show;
  if (!canAccess) return null;

  return (
    <div className="bg-white rounded-lg py-5 px-4 shadow">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Seed Reviews</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Add realistic seeded reviews to products. Seeded data is separate from real customer reviews.
          Dashboard analytics always show real data only.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-5">
        {TABS.map(({ key, label, icon: Icon, perm }) => {
          if (!user?.role_id?.[perm]) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? "border-primaryColor text-primaryColor"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "bulk" && user?.role_id?.review_seed_bulk && <BulkTab />}
      {activeTab === "manual" && user?.role_id?.review_seed_manual && <ManualTab />}
      {activeTab === "list" && user?.role_id?.review_show && <ListTab />}
    </div>
  );
};

export default SeedReviewPage;
