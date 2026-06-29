import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import { RxCross1 } from "react-icons/rx";
import { FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const toLocalDatetime = (isoOrDate) => {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_ROW = {
  product_id: "",
  flash_price: "",
  flash_price_type: "fixed",
  active: true,
};

const AddFlashSale = ({ setFlashSaleCreateModal, refetch }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    status: "active",
    products: [{ ...EMPTY_ROW }],
  });

  // Product list for the picker
  const { data: productsResp = {}, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/v1/product/dashboard?limit=500&searchTerm="],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/product/dashboard?page=1&limit=500&searchTerm=`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });

  const productOptions = useMemo(
    () =>
      (productsResp?.data || []).map((p) => ({
        value: p._id,
        label: p.product_name + (p.product_sku ? ` — ${p.product_sku}` : ""),
        raw: p,
      })),
    [productsResp],
  );

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setRow = (idx, k, v) =>
    setForm((p) => ({
      ...p,
      products: p.products.map((r, i) => (i === idx ? { ...r, [k]: v } : r)),
    }));
  const addRow = () =>
    setForm((p) => ({ ...p, products: [...p.products, { ...EMPTY_ROW }] }));
  const removeRow = (idx) =>
    setForm((p) => ({ ...p, products: p.products.filter((_, i) => i !== idx) }));

  const validate = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!form.start_at || !form.end_at) {
      toast.error("Start and end dates are required");
      return false;
    }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      toast.error("End time must be after start time");
      return false;
    }
    const cleanRows = form.products.filter((r) => r.product_id);
    if (!cleanRows.length) {
      toast.error("Pick at least one product");
      return false;
    }
    for (const [i, r] of cleanRows.entries()) {
      const price = Number(r.flash_price);
      if (!Number.isFinite(price) || price <= 0) {
        toast.error(`Row #${i + 1}: flash price must be > 0`);
        return false;
      }
      if (r.flash_price_type === "percent" && price > 100) {
        toast.error(`Row #${i + 1}: percent must be ≤ 100`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        status: form.status,
        products: form.products
          .filter((r) => r.product_id)
          .map((r) => ({
            product_id: r.product_id,
            flash_price: Number(r.flash_price),
            flash_price_type: r.flash_price_type,
            active: !!r.active,
          })),
      };
      const res = await fetch(`${BASE_URL}/flash-sale`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Flash sale created", { autoClose: 1000 });
        refetch();
        setFlashSaleCreateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", { autoClose: 1500 });
      }
    } catch (err) {
      toast.error(err?.message || "Network error", { autoClose: 1500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[760px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-[22px] font-bold text-gray-800">Create Flash Sale</h3>
          <button
            type="button"
            className="btn bg-white p-1 absolute right-3 rounded-full top-3"
            onClick={() => setFlashSaleCreateModal(false)}
          >
            <RxCross1 size={20} />
          </button>
        </div>
        <hr className="mt-2 mb-6" />

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Eid Mega Flash Sale"
                className="mt-1 w-full rounded-md border-2 border-gray-200 shadow-sm sm:text-sm p-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={2}
                placeholder="Optional description shown alongside the sale"
                className="mt-1 w-full rounded-md border-2 border-gray-200 shadow-sm sm:text-sm p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Start <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setField("start_at", e.target.value)}
                className="mt-1 w-full rounded-md border-2 border-gray-200 shadow-sm sm:text-sm p-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                End <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setField("end_at", e.target.value)}
                className="mt-1 w-full rounded-md border-2 border-gray-200 shadow-sm sm:text-sm p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="mt-1 w-full rounded-md border-2 border-gray-200 shadow-sm sm:text-sm p-2"
              >
                <option value="active">Active</option>
                <option value="in-active">In-Active</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Sale must be active AND within the time window to apply.
              </p>
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Products in this sale
              </p>
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 text-xs bg-primaryColor text-white rounded-lg hover:bg-blue-500 flex items-center gap-1.5"
              >
                <FaPlus size={10} /> Add row
              </button>
            </div>

            <div className="space-y-3">
              {form.products.map((r, idx) => {
                const selected = productOptions.find((o) => o.value === r.product_id);
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Product
                        </label>
                        <Select
                          isLoading={productsLoading}
                          options={productOptions}
                          value={selected || null}
                          onChange={(opt) => setRow(idx, "product_id", opt?.value || "")}
                          placeholder="Search product…"
                          isClearable
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Flash price
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={r.flash_price}
                          onChange={(e) => setRow(idx, "flash_price", e.target.value)}
                          placeholder="0"
                          className="w-full rounded-md border-2 border-gray-200 shadow-sm sm:text-sm p-2"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Type
                        </label>
                        <select
                          value={r.flash_price_type}
                          onChange={(e) => setRow(idx, "flash_price_type", e.target.value)}
                          className="w-full rounded-md border-2 border-gray-200 shadow-sm sm:text-sm p-2"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="percent">Percent %</option>
                        </select>
                      </div>

                      <div className="md:col-span-1 flex items-center justify-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!r.active}
                            onChange={(e) => setRow(idx, "active", e.target.checked)}
                            className="w-4 h-4 accent-primaryColor"
                          />
                          <span className="text-[11px] text-gray-600">On</span>
                        </label>
                      </div>

                      <div className="md:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          disabled={form.products.length === 1}
                          className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove row"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-6 mt-6 justify-end">
            <button
              type="button"
              className="px-8 py-2 border rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor"
              onClick={() => setFlashSaleCreateModal(false)}
            >
              Cancel
            </button>
            {loading ? (
              <div className="px-8 py-2 flex items-center justify-center bg-primaryColor text-white rounded">
                <MiniSpinner />
              </div>
            ) : (
              <button
                type="submit"
                className="px-8 py-2 bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
              >
                Create
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFlashSale;
