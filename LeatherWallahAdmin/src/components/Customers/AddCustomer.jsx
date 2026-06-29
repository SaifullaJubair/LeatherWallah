import { useState } from "react";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import { RxCross1 } from "react-icons/rx";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";

const AddCustomer = ({ setCustomerCreateModal, refetch }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user_phone, setUserPhone] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  //Add Customer Function
  const handleDataPost = async (data) => {
    setLoading(true);

    if (user_phone) {
      const formatPhoneNumberValueCheck = formatPhoneNumber(user_phone);
      const isPossiblePhoneNumberValueCheck = isPossiblePhoneNumber(user_phone);
      const isValidPhoneNumberValueCheck = isValidPhoneNumber(user_phone);
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

    if (!user_phone) {
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

    try {
      const sendData = {
        user_name: data?.user_name,
        user_status: data?.user_status,
        user_password: data?.user_password,
        user_phone: user_phone,
      };

      const response = await fetch(`${BASE_URL}/user/user_create`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Customer created successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setCustomerCreateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      });
      setLoading(false);
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
              Add Customer
            </h3>
            <button
              type="button"
              className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3"
              onClick={() => setCustomerCreateModal(false)}
            >
              {" "}
              <RxCross1 size={20}></RxCross1>
            </button>
          </div>

          <hr className="mt-2 mb-6" />

          <form onSubmit={handleSubmit(handleDataPost)} className="">
            <div>
              <label
                htmlFor="user_name"
                className="block text-xs font-medium text-gray-700"
              >
                User Name
              </label>

              <input
                {...register("user_name", {
                  required: "User name is required",
                })}
                type="text"
                id="user_name"
                placeholder="Enter user name"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.user_name && (
                <p className="text-red-600 text-sm">
                  {errors.user_name?.message}
                </p>
              )}
            </div>
            <div className="mt-2">
              <label htmlFor="admin_phone">Phone</label>
              <PhoneInput
                className="mt-1 w-full rounded-md border-white-light bg-white px-2 py-1  text-black ps-4 placeholder:text-white-dark text-xl custom-input border fo"
                placeholder="Enter phone number"
                id="admin_phone"
                value={user_phone}
                defaultCountry="BD"
                international
                countryCallingCodeEditable={false}
                onChange={setUserPhone}
                error={
                  user_phone
                    ? !isValidPhoneNumber(user_phone) && "Invalid phone number"
                    : "Phone number required"
                }
              />
            </div>

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
                placeholder="Enter user password"
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

            <div className="mt-4 flex-1">
              <label
                htmlFor="user_status"
                className="block text-xs font-medium text-gray-700"
              >
                User Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register("user_status", {
                  required: "User Status is required",
                })}
                className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
              >
                <option value="active">Active</option>
              </select>
              {errors.user_status && (
                <p className="text-red-600 text-sm">
                  {errors.user_status.message}
                </p>
              )}
            </div>

            <div className="flex gap-6 mt-6 justify-end">
              {loading ? (
                <div className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded">
                  <MiniSpinner />
                </div>
              ) : (
                <button
                  className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                  type="submit"
                >
                  Add User
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;
