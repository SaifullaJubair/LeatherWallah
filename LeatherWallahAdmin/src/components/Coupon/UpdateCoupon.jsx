import { useForm } from "react-hook-form";
import { RxCross1 } from "react-icons/rx";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import { useState } from "react";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

// 11β — expanded from status-only modal to full editable form so the new
// updateCouponServices ($set patch on every allowed field) is actually
// reachable from the admin UI. Mirrors AddCoupon's BOGO conditional fields
// and amount validation.
const UpdateCoupon = ({ setCouponUpdate, getCouponUpdateData, refetch }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const [couponType, setCouponType] = useState(
    getCouponUpdateData?.coupon_type || "fixed",
  );

  const dateOnly = (s) => (s ? String(s).slice(0, 10) : "");

  const handleDataPost = async (data) => {
    setLoading(true);
    if (data?.coupon_type === "percent" && Number(data?.coupon_amount) > 100) {
      toast.warn("Coupon Amount cannot be greater than 100 for percent type");
      setLoading(false);
      return;
    }
    if (data?.coupon_type === "bogo") {
      if (!data?.bogo_buy_qty || Number(data.bogo_buy_qty) < 1) {
        toast.warn("BOGO 'buy quantity' must be at least 1");
        setLoading(false);
        return;
      }
      if (!data?.bogo_get_qty || Number(data.bogo_get_qty) < 1) {
        toast.warn("BOGO 'get quantity' must be at least 1");
        setLoading(false);
        return;
      }
      const pct = Number(data?.bogo_get_discount_pct);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        toast.warn("BOGO discount percent must be between 0 and 100");
        setLoading(false);
        return;
      }
    }

    const sendData = {
      _id: getCouponUpdateData?._id,
      coupon_code: data?.coupon_code,
      coupon_start_date: data?.coupon_start_date,
      coupon_end_date: data?.coupon_end_date,
      coupon_type: data?.coupon_type,
      coupon_amount:
        data?.coupon_type === "bogo" ? 0 : Number(data?.coupon_amount || 0),
      coupon_use_per_person: Number(data?.coupon_use_per_person || 0),
      coupon_use_total_person: Number(data?.coupon_use_total_person || 0),
      coupon_status: data?.coupon_status,
    };

    if (data?.coupon_max_amount) {
      sendData.coupon_max_amount = Number(data.coupon_max_amount);
    }
    if (data?.coupon_type === "bogo") {
      sendData.bogo_buy_qty = Number(data?.bogo_buy_qty);
      sendData.bogo_get_qty = Number(data?.bogo_get_qty);
      sendData.bogo_get_discount_pct = Number(data?.bogo_get_discount_pct);
    }

    try {
      const response = await fetch(`${BASE_URL}/coupon`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Coupon update successfully", {
          autoClose: 1000,
        });
        refetch();
        setCouponUpdate(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1500,
        });
      }
    } catch (err) {
      toast.error(err?.message || "Network error", { autoClose: 1500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="relative overflow-hidden bg-white w-[680px] p-6 max-h-[92vh] rounded overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-[24px] font-semibold text-[#0A0A0A] capitalize pb-2">
            Update Coupon
          </h3>
          <button className="btn bg-white p-1 absolute right-3 rounded-full top-3 hover:bg-bgBtnInactive hover:text-btnInactiveColor">
            <RxCross1 onClick={() => setCouponUpdate(false)} size={20} />
          </button>
        </div>
        <hr />
        <form onSubmit={handleSubmit(handleDataPost)} className="mt-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                {...register("coupon_code", { required: "Coupon code is required" })}
                defaultValue={getCouponUpdateData?.coupon_code}
                type="text"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.coupon_code && (
                <p className="text-red-600">{errors.coupon_code?.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Coupon Status
              </label>
              <select
                {...register("coupon_status")}
                defaultValue={getCouponUpdateData?.coupon_status}
                className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
              >
                <option value="active">Active</option>
                <option value="in-active">In-Active</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register("coupon_start_date", { required: "Start date required" })}
                defaultValue={dateOnly(getCouponUpdateData?.coupon_start_date)}
                type="date"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                {...register("coupon_end_date", { required: "End date required" })}
                defaultValue={dateOnly(getCouponUpdateData?.coupon_end_date)}
                type="date"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Use Total Person <span className="text-red-500">*</span>
              </label>
              <input
                {...register("coupon_use_total_person", {
                  required: "Required",
                  validate: (v) => Number(v) >= 1 || "Must be at least 1",
                })}
                defaultValue={getCouponUpdateData?.coupon_use_total_person}
                type="number"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Use Per Person <span className="text-red-500">*</span>
              </label>
              <input
                {...register("coupon_use_per_person", {
                  required: "Required",
                  validate: (v) => Number(v) >= 1 || "Must be at least 1",
                })}
                defaultValue={getCouponUpdateData?.coupon_use_per_person}
                type="number"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Coupon Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("coupon_type", { required: "Type required" })}
                value={couponType}
                onChange={(e) => setCouponType(e.target.value)}
                className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
              >
                <option value="fixed">Fixed</option>
                <option value="percent">Percent</option>
                <option value="bogo">BOGO (Buy X Get Y)</option>
              </select>
            </div>
            {couponType !== "bogo" && (
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Coupon Amount <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("coupon_amount", {
                    required:
                      couponType === "bogo" ? false : "Amount required",
                  })}
                  defaultValue={getCouponUpdateData?.coupon_amount}
                  type="number"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
            )}
            {couponType === "percent" && (
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Max Amount (cap)
                </label>
                <input
                  {...register("coupon_max_amount")}
                  defaultValue={getCouponUpdateData?.coupon_max_amount}
                  type="number"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
            )}
            {couponType === "bogo" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    BOGO Buy Qty <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("bogo_buy_qty", {
                      validate: (v) => {
                        if (couponType !== "bogo") return true;
                        if (!v || Number(v) < 1) return "Must be at least 1";
                      },
                    })}
                    defaultValue={getCouponUpdateData?.bogo_buy_qty}
                    type="number"
                    min={1}
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    BOGO Get Qty <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("bogo_get_qty", {
                      validate: (v) => {
                        if (couponType !== "bogo") return true;
                        if (!v || Number(v) < 1) return "Must be at least 1";
                      },
                    })}
                    defaultValue={getCouponUpdateData?.bogo_get_qty}
                    type="number"
                    min={1}
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Discount % (0-100) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("bogo_get_discount_pct", {
                      validate: (v) => {
                        if (couponType !== "bogo") return true;
                        const n = Number(v);
                        if (isNaN(n) || n < 0 || n > 100) return "0-100 only";
                      },
                    })}
                    defaultValue={getCouponUpdateData?.bogo_get_discount_pct}
                    type="number"
                    min={0}
                    max={100}
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 italic mt-4">
            Note: customer / product allowlists are set at creation. For BOGO,
            scope is inherited from the original coupon_specific_product list.
          </p>

          <div className="flex items-center justify-end mt-4 gap-2 mb-4">
            {loading ? (
              <div className="px-10 py-2 flex items-center justify-center bg-primaryColor text-white rounded">
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2 bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                type="submit"
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

export default UpdateCoupon;
