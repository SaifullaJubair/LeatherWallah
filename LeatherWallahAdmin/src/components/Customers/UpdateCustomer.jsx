import { useForm } from "react-hook-form";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { useState } from "react";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import { RxCross1 } from "react-icons/rx";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
const UpdateCustomer = ({
  refetch,
  customerUpdateModalData,
  setCustomerUpdateModal,
}) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDataPost = async (data) => {
    setLoading(true)
    const sendData = {
      _id: customerUpdateModalData?._id,
      user_phone: customerUpdateModalData?.user_phone,
      user_name: customerUpdateModalData?.user_name,
      user_status: data?.user_status,
      user_password: data?.user_password,
      customer_group: data?.customer_group || "retail",
    };
    const response = await fetch(`${BASE_URL}/user`, {
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
        result?.message ? result?.message : "User update successfully",
        {
          autoClose: 1000,
        }
      );
      refetch();
      setLoading(false);
      setCustomerUpdateModal(false);
    } else {
      toast.error(result?.message || "Something went wrong", {
        autoClose: 1000,
      });
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="relative overflow-hidden bg-white w-[550px]  p-6  max-h-[90vh] rounded overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-[24px] font-semibold text-[#0A0A0A] capitalize pb-2">
            Update Coupon Status
          </h3>
          <button className="btn bg-white   p-1 absolute right-3 rounded-full top-3 hover:bg-bgBtnInactive hover:text-btnInactiveColor">
            <RxCross1
              onClick={() => {
                setCustomerUpdateModal(false);
              }}
              size={20}
            ></RxCross1>
          </button>
        </div>
        <hr />
        <form onSubmit={handleSubmit(handleDataPost)} className="mt-3">
          <div className="flex justify-between mt-6  bg-gray-100 p-2 rounded-lg shadow border ">
            <p className="text-gray-700 font-semibold text-sm">
              Do you want to change your password
            </p>
            <label
              htmlFor="changePassword"
              className="inline-flex items-center space-x-4 cursor-pointer dark:text-gray-800"
            >
              <span className="relative">
                <input
                  id="changePassword"
                  type="checkbox"
                  className="hidden peer"
                  checked={changePassword} // Control the toggle state
                  onChange={() => setChangePassword(!changePassword)}
                />
                <div className="w-12 h-4 rounded-full shadow bg-slate-300  peer-checked:bg-bgBtnActive"></div>
                <div className="absolute left-0 w-6 h-6 rounded-full -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primaryColor bg-white ring-[1px] shadow-lg  ring-gray-300  "></div>
              </span>
            </label>
          </div>
          {changePassword && (
            <div className="relative">
              <label
                htmlFor="user_password"
                className="block text-sm font-medium text-gray-700 mt-2"
              >
                Password
              </label>

              <input
                {...register("user_password", {
                  validate: {
                    isPassword: (value) =>
                      value.length >= 4 ||
                      " Password must be at least 4 characters",
                  },
                  required: "User Password is required",
                })}
                type={showPassword ? "text" : "password"} // Dynamic type based on state
                id="user_password"
                placeholder="Enter your new password"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.user_password && (
                <p className="text-red-600 text-sm">
                  {errors.user_password?.message}
                </p>
              )}

              {/* Eye icon for toggling password visibility */}
              <div
                className="absolute top-9 right-3 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <FaRegEye size={20} />
                ) : (
                  <FaRegEyeSlash size={20} />
                )}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                User Status
              </label>
              <select
                {...register("user_status")}
                defaultValue={customerUpdateModalData?.user_status}
                className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
              >
                <option value="active">Active</option>
                <option value="in-active">In-Active</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Customer Group
              </label>
              <select
                {...register("customer_group")}
                defaultValue={customerUpdateModalData?.customer_group || "retail"}
                className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="vip">VIP</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Non-retail picks the matching <code>group_prices</code> entry on
                a product when it beats the current price.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end mt-4 gap-2 mb-4">
            {loading == true ? (
              <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200  text-white rounded"
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

export default UpdateCustomer;
