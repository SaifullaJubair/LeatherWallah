"use client";
import { RiImageAddFill } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { RxCross1 } from "react-icons/rx";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import Select from "react-select";
import { divisions } from "@/data/divisions";
import { districts } from "@/data/districts";

import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { BASE_URL } from "@/components/utils/baseURL";
import ImageUploader from "@/components/common/ImageUploader";

const ProfileSetting = ({ setUserupdateModalOpen, userInfo, refetch }) => {
  const [loading, setLoading] = useState(false);
  const [districtsData, setDistrictsData] = useState([]);
  const [districtId, setDistrictId] = useState("");
  const [user_division, setDivision] = useState(userInfo?.data?.user_division);
  const [user_district, setDistrict] = useState(userInfo?.data?.user_district);
  const [user_gender, setGender] = useState(userInfo?.data?.user_gender || "");
  const [isOpenDistrict, setIsOpenDistrict] = useState(true);
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (districtId) {
      const districtData = districts.filter(
        (district) => district?.division_id === districtId
      );
      setDistrictsData(districtData);
    }
  }, [districtId]);

  //Image preview....
  const [imagePreview, setImagePreview] = useState(userInfo?.data?.user_image);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setValue("user_image", file);
    }
  };
  const clearImagePreview = () => {
    setImagePreview(null);
    setValue("user_image", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //Image preview end....

  const handleDataPost = async (data) => {
    //setLoading(true);

    let user_image;

    if (data?.user_image) {
      const logoUpload = await ImageUploader(data?.user_image);
      user_image = logoUpload[0];
    }

    const sendData = {
      _id: userInfo?.data?._id,
      user_image: user_image || userInfo?.data?.user_image,
      user_name: data?.user_name || userInfo?.data?.user_name,
      user_phone: data?.user_phone || userInfo?.data?.user_phone,
      user_password: data?.user_password || userInfo?.data?.user_password,
      user_additional_phone: data?.user_additional_phone ?? userInfo?.data?.user_additional_phone,
      user_gender: user_gender || userInfo?.data?.user_gender,
      user_country: data?.user_country || userInfo?.data?.user_country,
      user_division: user_division || userInfo?.data?.user_division,
      user_district: user_district || userInfo?.data?.user_district,
      user_address: data?.user_address || userInfo?.data?.user_address,
    };
    // console.log(sendData);

    const response = await fetch(`${BASE_URL}/get_me`, {
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
      setUserupdateModalOpen(false);
    } else {
      toast.error(result?.message || "Something went wrong", {
        autoClose: 1000,
      });
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="relative overflow-hidden text-left bg-white rounded-2xl shadow-xl w-full max-w-[750px] p-6 max-h-[90dvh] overflow-y-auto scrollbar-thin">
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
              className="btn bg-white hover:bg-error-50 hover:text-error-200  p-1 absolute right-3  top-3"
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
                {...register("user_name", {
                  required: "User Name is required",
                })}
                type="text"
                defaultValue={userInfo?.data?.user_name}
                placeholder="Your Name"
                className="mt-2 w-full   border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
              {errors.user_name && (
                <p className="text-red-600">{errors.user_name?.message}</p>
              )}
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Phone No</label>
                <input
                  {...register("user_phone")}
                  type="text"
                  defaultValue={userInfo?.data?.user_phone}
                  placeholder="Your Phone"
                  readOnly
                  className="mt-2 w-full border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Additional Phone</label>
                <input
                  {...register("user_additional_phone")}
                  type="text"
                  defaultValue={userInfo?.data?.user_additional_phone}
                  placeholder="Alternative phone number"
                  className="mt-2 w-full border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700">Gender</label>
              <div className="flex gap-4 mt-2">
                {["male", "female", "other"].map((g) => (
                  <label key={g} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer capitalize">
                    <input
                      type="radio"
                      name="user_gender"
                      value={g}
                      checked={user_gender === g}
                      onChange={() => setGender(g)}
                      className="accent-primary"
                    />
                    {g}
                  </label>
                ))}
                {user_gender && (
                  <button type="button" onClick={() => setGender("")} className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto">Clear</button>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-3  bg-gray-100 p-2   shadow border ">
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
                  <div className="w-12 h-4  shadow bg-slate-300  peer-checked:bg-bgBtnActive"></div>
                  <div className="absolute left-0 w-6 h-6  -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primaryColor bg-white ring-[1px] shadow-lg  ring-gray-300  "></div>
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
                  className="mt-2 w-full   border-gray-200 shadow-sm sm:text-sm p-2 border-2"
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

            <div className="mt-2">
              <label
                htmlFor=""
                className="block text-xs font-medium text-gray-700"
              >
                Country Name
              </label>

              <input
                {...register("user_country")}
                defaultValue={userInfo?.data?.user_country}
                type="text"
                placeholder="Country Name"
                readOnly
                className="mt-2 w-full   border-gray-200 shadow-sm sm:text-sm p-2 border-2"
              />
            </div>

            <div className="mt-4 grid lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Division
                </label>
                <Select
                  id="division"
                  name="division"
                  className="mt-1"
                  aria-label="Select a division"
                  options={divisions}
                  defaultValue={{
                    name: user_division,
                  }}
                  getOptionLabel={(x) => x?.name}
                  getOptionValue={(x) => x?.id}
                  onChange={(selectedOption) => {
                    setIsOpenDistrict(false);
                    setDistrict();
                    setDistrictId(selectedOption?.id);
                    setDivision(selectedOption?.name);
                    setTimeout(() => {
                      setIsOpenDistrict(true);
                    }, 100);
                  }}
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 999,
                    }), // Set a high z-index
                  }}
                ></Select>
              </div>
              {isOpenDistrict && (
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    District
                  </label>
                  <Select
                    id="district"
                    name="district"
                    defaultValue={{
                      name: user_district,
                    }}
                    className="mt-1"
                    aria-label="Select a district"
                    options={districtsData}
                    getOptionLabel={(x) => x?.name}
                    getOptionValue={(x) => x?.id}
                    onChange={(selectedOption) => {
                      setDistrict(selectedOption?.name);
                    }}
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 999,
                      }), // Set a high z-index
                    }}
                  ></Select>
                </div>
              )}
              <div className="">
                <label
                  htmlFor=""
                  className="block text-xs font-medium text-gray-700"
                >
                  Address
                </label>

                <input
                  {...register("user_address", {
                    required: "Fill the address",
                  })}
                  defaultValue={userInfo?.data?.user_address}
                  type="text"
                  placeholder="Your Address"
                  className="mt-2 w-full   border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
                {errors.user_address && (
                  <p className="text-red-600 text-sm ml-2">
                    {errors.user_address?.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6">
              {imagePreview ? (
                <div className="relative">
                  <button
                    type="button"
                    className="btn bg-red-300 border p-1 absolute right-1  top-1 text-red-600 "
                    onClick={clearImagePreview}
                  >
                    {" "}
                    <RxCross1 size={15}></RxCross1>
                  </button>

                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover my-2 "
                  />
                </div>
              ) : (
                <label
                  className="mt-4 w-full h-[160px] bg-gray-200 border-dashed border flex justify-center items-center cursor-pointer"
                  htmlFor="user_image"
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
                {...register("user_image", {
                  validate: {
                    isImage: (value) =>
                      (value[0] && value[0].type.startsWith("image/")) ||
                      "Only image files are allowed",
                  },
                })}
                accept="image/*"
                type="file"
                ref={fileInputRef}
                id="user_image"
                className="mt-2  sm:text-sm p-0.5 file:cursor-pointer file:bg-primary-400 file:text-white file:border-none file:px-2 file:py-1.5"
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
                  className="px-10 py-2  bg-primary   text-white rounded"
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
