import { useState } from "react";
import { useForm } from "react-hook-form";
import { RxCross1 } from "react-icons/rx";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const UpdateWarehouse = ({ setWarehouseUpdateModal, warehouseUpdateData, refetch }) => {
  const [loading, setLoading] = useState(false);
  const w = warehouseUpdateData || {};
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: w.name || "",
      code: w.code || "",
      address: w.address || "",
      city: w.city || "",
      is_default: !!w.is_default,
      status: w.status || "active",
    },
  });

  const onSubmit = async (data) => {
    if (!w?._id) {
      toast.error("Missing warehouse id");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: data.name?.trim(),
        code: data.code?.trim(),
        address: data.address?.trim(),
        city: data.city?.trim(),
        is_default: !!data.is_default,
        status: data.status || "active",
      };
      const res = await fetch(`${BASE_URL}/warehouse/${w._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Warehouse updated", { autoClose: 1000 });
        refetch();
        setWarehouseUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", { autoClose: 1500 });
      }
    } catch (e) {
      toast.error(e?.message || "Network error", { autoClose: 1500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-[22px] font-bold text-gray-800">Update Warehouse</h3>
          <button
            type="button"
            className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor p-1 absolute right-3 rounded-full top-3"
            onClick={() => setWarehouseUpdateModal(false)}
          >
            <RxCross1 size={20} />
          </button>
        </div>
        <hr className="mt-2 mb-6" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Warehouse Name <span className="text-red-600">*</span>
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              type="text"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Code</label>
              <input
                {...register("code")}
                type="text"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">City</label>
              <input
                {...register("city")}
                type="text"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700">Address</label>
            <textarea
              {...register("address")}
              rows={2}
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Status <span className="text-red-600">*</span>
              </label>
              <select
                {...register("status", { required: "Status is required" })}
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              >
                <option value="active">Active</option>
                <option value="in-active">In-Active</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_default")}
                  className="w-4 h-4 accent-primaryColor"
                />
                <span className="text-xs font-medium text-gray-700">
                  Set as default warehouse
                </span>
              </label>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Turning this on will unset any other default warehouse.
          </p>

          <div className="flex gap-6 mt-6 justify-end">
            <button
              type="button"
              className="px-8 py-2 border rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor"
              onClick={() => setWarehouseUpdateModal(false)}
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
                Update
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateWarehouse;
