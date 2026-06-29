import { RxCross1 } from "react-icons/rx";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { RiImageAddFill } from "react-icons/ri";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BASE_URL } from "./../../utils/baseURL";
import { toast } from "react-toastify";

const UpdateBanner = ({
  setShowBannerUpdateModal,
  getBannerUpdateData,
  refetch,
}) => {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm();

  //Image preview....
  const [imagePreview, setImagePreview] = useState(
    getBannerUpdateData?.banner_image
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Update Banner
  const handleDataPost = async (data) => {
    if (data?.banner_image[0]) {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "banner_image") {
          formData.append(key, data?.banner_image[0]);
        } else formData.append(key, value);
      });

      formData.append(
        "banner_image_key",
        getBannerUpdateData?.banner_image_key
      );
      formData.append("_id", getBannerUpdateData?._id);

      const response = await fetch(`${BASE_URL}/banner`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Banner update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setShowBannerUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } else {
      setLoading(true);
      const sendData = {
        _id: getBannerUpdateData?._id,

        banner_serial: data?.banner_serial
          ? data?.banner_serial
          : getBannerUpdateData?.banner_serial,
        banner_path: data?.banner_path
          ? data?.banner_path
          : getBannerUpdateData?.banner_path,

        banner_status: data?.banner_status
          ? data?.banner_status
          : getBannerUpdateData?.banner_status,
        banner_image_key: getBannerUpdateData?.banner_image_key,
        banner_title: data?.banner_title,
      };
      const response = await fetch(`${BASE_URL}/banner`, {
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
          result?.message ? result?.message : "Banner update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
        setShowBannerUpdateModal(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    }
  };
  return (
    <div>
      <div>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mt-4">
              <h3
                className="text-[26px] font-bold text-gray-800 capitalize"
                id="modal-title "
              >
                Update Banner
              </h3>
              <button
                type="button"
                className="btn bg-white   p-1 absolute right-3 rounded-full top-3 hover:bg-bgBtnInactive hover:text-btnInactiveColor"
                onClick={() => setShowBannerUpdateModal(false)}
              >
                {" "}
                <RxCross1 size={20}></RxCross1>
              </button>
            </div>

            <hr className="mt-2 mb-6" />

            <form onSubmit={handleSubmit(handleDataPost)} className="">
              <div>
                <label
                  htmlFor="UserEmail"
                  className="block text-xs font-medium text-gray-700"
                >
                  Banner Serial
                </label>

                <input
                  {...register("banner_serial", {
                    validate: (value) => {
                      if (value < 1) {
                        return "serial must be greater than 0";
                      }
                      // else if (value > 100) {
                      //   return 'Serial must be less then 100'
                      // }
                    },
                  })}
                  defaultValue={getBannerUpdateData?.banner_serial}
                  type="number"
                  placeholder="Banner Serial"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
              <div className="mt-2">
                <label
                  htmlFor="UserEmail"
                  className="block text-xs font-medium text-gray-700"
                >
                  Banner Title
                </label>

                <input
                  {...register("banner_title", {
                    required: "Banner Title is required",
                  })}
                  defaultValue={getBannerUpdateData?.banner_title}
                  type="text"
                  placeholder="Banner Title"
                  className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Banner Status
                  </label>
                  <select
                    {...register("banner_status")}
                    className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
                    defaultValue={getBannerUpdateData?.banner_status}
                  >
                    <option value="active">Active</option>
                    <option value="in-active">In-Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Banner Path
                  </label>

                  <input
                    {...register("banner_path")}
                    type="text"
                    defaultValue={getBannerUpdateData?.banner_path}
                    placeholder="Banner Path"
                    className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
                  />
                </div>
              </div>
              <div className="mt-6">
                {imagePreview ? (
                  <div className="relative">
                    <button
                      type="button"
                      className="btn bg-bgBtnInactive border p-1 absolute right-1 rounded-full top-1 text-btnInactiveColor "
                      onClick={() => setImagePreview(false)}
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
                    className="mt-4 w-full h-[160px] bg-gray-100 border-dashed border flex justify-center items-center rounded cursor-pointer"
                    htmlFor="banner_image"
                    type="button"
                  >
                    <div className="flex flex-col items-center justify-center ">
                      <div>
                        <RiImageAddFill size={25} />
                      </div>
                      <p className="mt-2 text-[#C9CACA]" type="">
                        upload image
                      </p>
                    </div>
                  </label>
                )}
                <input
                  {...register("banner_image", {
                    valiDate: {
                      isImage: (value) =>
                        (value[0] && value[0].type.startsWith("image/")) ||
                        "Only image files are allowed",
                    },
                  })}
                  accept="image/*"
                  type="file"
                  id="banner_image"
                  className="mt-2  sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white file:border-none file:rounded file:px-2 file:py-1.5"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-[#C9CACA]  mt-1 text-end">
                  Upload 300x300 pixel images in PNG, JPG, or WebP format (max 1
                  MB).
                </p>
              </div>

              <div className="flex gap-8 mt-6 justify-end">
                <button
                  className="px-10 py-2 border rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor"
                  onClick={(event) => {
                    event.preventDefault(); // Prevents form submission on Cancel
                    setShowBannerUpdateModal(false);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                {loading == true ? (
                  <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
                    <MiniSpinner />
                  </div>
                ) : (
                  <button
                    className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                    type="submit"
                  >
                    Update
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;
