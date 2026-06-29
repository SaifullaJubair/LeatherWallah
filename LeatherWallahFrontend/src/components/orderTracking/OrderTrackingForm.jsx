"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BASE_URL } from "../utils/baseURL";
import { toast } from "react-toastify";
import { FiSearch, FiPackage } from "react-icons/fi";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";

const OrderTrackingForm = ({ setOrder }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleOnSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/order/order_tracking`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: data?.order_id }),
      });
      const result = await response.json();
      setOrder(result);
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Order found!", { autoClose: 1000 });
      } else {
        toast.error(result?.message || "Order not found.", { autoClose: 1500 });
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong.", { autoClose: 1000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleOnSubmit)} className="mt-5">
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Invoice / Order ID
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiPackage
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="order_id"
              type="text"
              placeholder="e.g. FS-2024-001"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors bg-white"
              {...register("order_id", { required: "Invoice ID is required" })}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all whitespace-nowrap"
          >
            {isLoading ? (
              <MiniSpinner />
            ) : (
              <>
                <FiSearch size={14} />
                Track
              </>
            )}
          </button>
        </div>
        {errors?.order_id && (
          <p className="text-red-500 text-xs mt-1">{errors.order_id.message}</p>
        )}
      </div>
    </form>
  );
};

export default OrderTrackingForm;
