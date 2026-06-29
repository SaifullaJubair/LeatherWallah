import { useRef, useState } from "react";
import ImageUploader from "../../components/common/ImageUploader";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import { RxCross1 } from "react-icons/rx";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { RiImageAddFill } from "react-icons/ri";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const ProfileSetting = ({ setUserupdateModalOpen, user }) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  //Image preview....
  const [imagePreview, setImagePreview] = useState(user?.user_logo);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setValue("user_logo", file);
    }
  };
  const clearImagePreview = () => {
    setImagePreview(null);
    setValue("user_logo", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //Image preview end....

  const handleDataPost = async (data) => {
    //setLoading(true);
    let user_logo;
    if (data?.user_logo) {
      const logoUpload = await ImageUploader(data?.user_logo);
      user_logo = logoUpload[0];
    }
    const sendData = {
      admin_name: data?.admin_name,
      admin_address: data?.admin_address,
      admin_phone: user?.admin_phone,
      admin_email: data?.admin_email || "",
      _id: user?._id,
    };
    if (user_logo) {
      sendData.user_logo = user_logo;
    }
    if (data?.admin_password && changePassword) {
      sendData.admin_password = data?.admin_password;
    }

    try {
      const response = await fetch(`${BASE_URL}/admin_reg_log/login`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode == 200 && result?.success == true) {
        toast.success(
          result?.message ? result?.message : "Profile update successfully",
          {
            autoClose: 1000,
          }
        );
        setLoading(false);
        if (data?.admin_password) {
          document.cookie = "leather_wallah_token=; Max-Age=0; path=/;";
        }
        window.location.reload();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } catch (error) {
      toast.error("Network error or server is down", {
        autoClose: 1000,
      });
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[750px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
        {" "}
        <div className="">
          <div className="flex items-center justify-between mt-4">
            <h3
              className="text-[26px] font-bold text-gray-800 capitalize"
              id="modal-title"
            >
              Update Profile
            </h3>
            <button
              type="button"
              className="btn bg-white hover:bg-red-50 hover:text-red-600  p-1 absolute right-3 rounded-full top-3"
              onClick={() => setUserupdateModalOpen(false)}
            >
              {" "}
              <RxCross1 size={20}></RxCross1>
            </button>
          </div>

          <hr className="mt-2 mb-6" />

          <form onSubmit={handleSubmit(handleDataPost)} className="">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Name
              </label>

              <input
                {...register("admin_name")}
                type="text"
                placeholder="Write Your Name"
                defaultValue={user?.admin_name}
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.name && (
                <p className="text-red-600">{errors.name?.message}</p>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700">
                Phone Number
              </label>
              <input
                {...register("admin_phone")}
                type="text"
                placeholder="Write Your Phone Number"
                defaultValue={user?.admin_phone}
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                readOnly
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700">
                Email <span className="text-gray-400 font-normal">(for password reset)</span>
              </label>
              <input
                {...register("admin_email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
                type="email"
                placeholder="your@email.com"
                defaultValue={user?.admin_email}
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.admin_email && (
                <p className="text-red-600 text-xs mt-1">{errors.admin_email?.message}</p>
              )}
            </div>

            <div className="mt-5">
              <div className="flex justify-between   bg-gray-100 p-2 rounded-lg shadow border ">
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
                    <div className="absolute left-0 w-6 h-6 rounded-full -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primary bg-white ring-[1px] shadow-lg  ring-gray-300  "></div>
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
            </div>
            <div className="mt-4">
              <label
                htmlFor=""
                className="block text-xs font-medium text-gray-700"
              >
                Address
              </label>

              <input
                {...register("admin_address")}
                type="text"
                defaultValue={user?.admin_address}
                placeholder="Write Your Address"
                className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>

            <div className="mt-6">
              {imagePreview ? (
                <div className="relative">
                  <button
                    type="button"
                    className="btn bg-red-300 border p-1 absolute right-1 rounded-full top-1 text-red-600 "
                    onClick={clearImagePreview}
                  >
                    {" "}
                    <RxCross1 size={15}></RxCross1>
                  </button>

                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover my-2 rounded "
                  />
                </div>
              ) : (
                <label
                  className="mt-4 w-full h-[160px] bg-gray-200 border-dashed border flex justify-center items-center rounded cursor-pointer"
                  htmlFor="user_logo"
                  type="button"
                >
                  <div className="flex flex-col items-center justify-center ">
                    <div>
                      <RiImageAddFill size={25} />
                    </div>
                  </div>
                </label>
              )}

              <input
                {...register("user_logo", {
                  valiDate: {
                    isImage: (value) =>
                      (value[0] && value[0].type.startsWith("image/")) ||
                      "Only image files are allowed",
                  },
                })}
                accept="image/*"
                type="file"
                ref={fileInputRef}
                id="user_logo"
                className="mt-2  sm:text-sm p-0.5 file:cursor-pointer file:bg-blue-400 file:text-white file:border-none file:rounded file:px-2 file:py-1.5"
                onChange={handleImageChange}
              />
            </div>

            <div className="flex justify-end">
              {loading == true ? (
                <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
                  <MiniSpinner />
                </div>
              ) : (
                <button
                  className="px-10 py-2  bg-primaryColor   text-white rounded"
                  type="submit"
                >
                  Save
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetting;
