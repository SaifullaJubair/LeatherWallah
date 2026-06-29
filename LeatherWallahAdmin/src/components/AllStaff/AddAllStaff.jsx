import { useForm } from "react-hook-form";
import { RxCross1 } from "react-icons/rx";
import { useState } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";

const AddAllStaff = ({
  setOpenAddStaffModal,
  refetch,
  roleData,
  isLoading,
  user,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [admin_phone, setUserPhone] = useState(null);

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // data post
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

    if (!admin_phone) {
      toast.error("Phone is required !", {
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

    const sendData = {
      admin_name: data?.admin_name,
      admin_status: data?.admin_status,
      admin_phone: admin_phone,
      admin_password: data?.admin_password,
      role_id: data?.role_id,
      admin_publisher_id: user?._id,
    };

    try {
      const response = await fetch(
        `${BASE_URL}/admin_reg_log`,
        {
          method: "POST",
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
          result?.message ? result?.message : "New Staff created successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setOpenAddStaffModal(false);
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
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mt-4">
            <h3
              className="text-[26px] font-bold text-gray-800 capitalize"
              id="modal-title"
            >
              Add Staff
            </h3>
            <button
              type="button"
              className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3"
              onClick={() => setOpenAddStaffModal(false)}
            >
              {" "}
              <RxCross1 size={20}></RxCross1>
            </button>
          </div>

          <hr className="mt-2 mb-6" />

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
                id="admin_name"
                placeholder="Enter user name"
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
                placeholder="Enter user password"
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
                >
                  {isLoading ? (
                    <MiniSpinner />
                  ) : (
                    <>
                      {" "}
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
                onClick={() => setOpenAddStaffModal(false)}
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
                  Add Staff
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAllStaff;
