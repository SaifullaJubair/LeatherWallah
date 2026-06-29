import { useForm } from "react-hook-form";
import { RxCross1 } from "react-icons/rx";
import { useState } from "react";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
const UpdateStaff = ({
  refetch,
  setUpdateModal,
  updateModalValue,
  roleData,
  isLoading,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const [admin_phone, setUserPhone] = useState(updateModalValue?.admin_phone);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleDataPost = async (data) => {
    setLoading(true);
    if (admin_phone) {
      const formatPhoneNumberValueCheck = formatPhoneNumber(admin_phone);
      const isPossiblePhoneNumberValueCheck = isPossiblePhoneNumber(admin_phone);
      const isValidPhoneNumberValueCheck = isValidPhoneNumber(admin_phone);
      if (formatPhoneNumberValueCheck == false) {
        toast.error("Mobile number not valid !", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }
      if (isPossiblePhoneNumberValueCheck == false) {
        toast.error("Mobile number not valid !", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }
      if (isValidPhoneNumberValueCheck == false) {
        toast.error("Mobile number not valid !", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }
    }
    const sendData = {
      _id: updateModalValue?._id,
      role_id: data?.role_id,
      admin_name: data?.admin_name,
      admin_status: data?.admin_status,
      admin_phone: admin_phone,
      admin_password: data?.admin_password,
      admin_updated_by: user?._id,
    };
    if (!data?.admin_password) {
      delete sendData?.admin_password;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/admin_reg_log`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(sendData),
        }
      );
      const result = await response.json();
      if (result?.statusCode == 200 && result?.success == true) {
        toast.success(
          result?.message ? result?.message : "Staff updated  successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setUpdateModal(false);
        reset();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      toast.error("Network error or server is down", {
        autoClose: 1000,
      });
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3
            className="text-[26px] font-bold text-gray-800 capitalize"
            id="modal-title"
          >
            {" "}
            Update User
          </h3>
          <button
            type="button"
            onClick={() => setUpdateModal(false)}
            className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3"
          >
            <RxCross1 size={20}></RxCross1>
          </button>
        </div>

        <hr className="mt-2 mb-4" />

        <form onSubmit={handleSubmit(handleDataPost)} className="">
          <div>
            <label
              htmlFor="admin_name"
              className="block text-xs font-medium text-gray-700"
            >
              User Name
            </label>

            <input
              {...register("admin_name", {
                required: "User name is required",
              })}
              type="text"
              defaultValue={updateModalValue?.admin_name}
              placeholder="Enter user name"
              id="admin_name"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.admin_name && (
              <p className="text-red-600 text-sm">
                {errors.admin_name?.message}
              </p>
            )}
          </div>

          <div className="mt-2">
            <label htmlFor="admin_phone">Phone</label>
            <PhoneInput
              className="mt-1 w-full rounded-md border-white-light bg-white px-2 py-1  text-black ps-4 placeholder:text-white-dark text-xl custom-input border fo"
              placeholder="Enter phone number"
              id="admin_phone"
              value={admin_phone}
              defaultCountry="BD"
              international
              countryCallingCodeEditable={false}
              onChange={setUserPhone}
              error={
                admin_phone
                  ? !isValidPhoneNumber(admin_phone) && "Invalid phone number"
                  : "Phone number required"
              }
            />
          </div>
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
                htmlFor="admin_password"
                className="block text-sm font-medium text-gray-700 mt-2"
              >
                Password
              </label>

              <input
                {...register("admin_password", {
                  validate: {
                    isPassword: (value) =>
                      value.length >= 4 ||
                      " Password must be at least 4 characters",
                  },
                  required: "User Password is required",
                })}
                type={showPassword ? "text" : "password"} // Dynamic type based on state
                id="admin_password"
                placeholder="Enter your new password"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.admin_password && (
                <p className="text-red-600 text-sm">
                  {errors.admin_password?.message}
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

          <div className="flex items-center justify-between gap-2">
            <div className="mt-4 flex-1">
              <label
                htmlFor="role_id"
                className="block text-xs font-medium text-gray-700"
              >
                Staff Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register("role_id", {
                  required: " User Role is required",
                })}
                id="role_id"
                className=" mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
                defaultValue={updateModalValue?.role_id?._id}
              >
                {isLoading ? (
                  <MiniSpinner />
                ) : (
                  <>
                    {updateModalValue?.role_id?.role_name && (
                      <option
                        className="capitalize"
                        disabled
                        selected
                        defaultValue={updateModalValue?.role_id?._id}
                      >
                        {updateModalValue?.role_id?.role_name}
                      </option>
                    )}
                    {roleData.map((role) => (
                      <option key={role?._id} value={role?._id}>
                        {role?.role_name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errors.role_id && (
                <p className="text-red-600 text-sm">
                  {errors.role_id?.message}
                </p>
              )}
            </div>
            <div className="mt-4 flex-1">
              <label
                htmlFor="admin_status"
                className="block text-xs font-medium text-gray-700"
              >
                Staff Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register("admin_status", {
                  required: "Staff Status is required",
                })}
                className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
              >
                <option
                  className="capitalize"
                  disabled
                  selected
                  defaultValue={updateModalValue?.admin_status}
                >
                  {updateModalValue?.admin_status}
                </option>
                <option value="active">Active</option>
                <option value="in-active">In-Active</option>
              </select>
              {errors.admin_status && (
                <p className="text-red-600 text-sm">
                  {errors.admin_status.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-6 mt-6 justify-end">
            <button
              className="px-10 py-2 border hover:bg-bgBtnInactive hover:text-btnInactiveColor rounded "
              onClick={() => setUpdateModal(false)}
              type="button"
            >
              Cancel
            </button>
            {loading ? (
              <div className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded">
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                type="submit"
              >
                Update Staff
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStaff;
