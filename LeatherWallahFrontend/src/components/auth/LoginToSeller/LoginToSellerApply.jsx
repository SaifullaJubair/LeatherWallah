import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import { RxCross1 } from "react-icons/rx";
import { RiImageAddFill } from "react-icons/ri";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { BASE_URL } from "@/components/utils/baseURL";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";

const LoginToSellerApply = ({ setSellerLoginApplyModal }) => {
  const [loading, setLoading] = useState(false);
  const [user_phone, setUserPhone] = useState();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  //Image preview....
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setPdfFile(file?.name);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setValue("nid_card", file);
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    setValue("nid_card", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  //Login Data post
  const handleSignIn = async (data) => {
    setLoading(true);
    try {
      if (user_phone) {
        const formatPhoneNumberValueCheck = formatPhoneNumber(user_phone);
        const isPossiblePhoneNumberValueCheck =
          isPossiblePhoneNumber(user_phone);
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

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "nid_card") {
          formData.append(key, data?.nid_card);
        } else {
          formData.append(key, value);
        }
      });

      formData.append("user_phone", user_phone);

      formData.append("login_credentials", user_phone);

      const response = await fetch(`${BASE_URL}/seller`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : "Seller Account Create successfully",
          {
            autoClose: 1000,
          }
        );

        setLoading(false);
        setSellerLoginApplyModal(false);
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
      <div>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative overflow-hidden text-left bg-white   shadow-xl w-[750px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mt-4">
              <h3
                className="text-[22px] font-bold text-gray-800 capitalize"
                id="modal-title "
              >
                Welcome To Seller Sign Up
              </h3>
              <button
                type="button"
                className="btn text-white  bg-secondary p-1 absolute right-3  top-3 hover:bg-secondaryVariant-200"
                onClick={() => setSellerLoginApplyModal(false)}
              >
                {" "}
                <RxCross1 size={20}></RxCross1>
              </button>
            </div>

            <hr className="mt-2 mb-6" />

            <form onSubmit={handleSubmit(handleSignIn)} className="space-y-4">
              <div className="form-control w-full">
                <label htmlFor="login_credentials" className="label">
                  <span className="label-text">Your Name</span>
                </label>
                <input
                  id=""
                  type="text"
                  placeholder="Write Your Name"
                  className="border px-3 py-2 w-full mt-2"
                  {...register("user_name", {
                    required: "Name is required",
                  })}
                />
                {errors.user_name && (
                  <p className="text-red-600"> {errors?.user_name?.message}</p>
                )}
              </div>
              <div className="mt-2">
                <label htmlFor="user_phone">Phone Number</label>
                <PhoneInput
                  className="mt-2 w-full   border-white-light bg-white px-2 py-2  text-black ps-4 placeholder:text-white-dark text-xl custom-phone-input border "
                  placeholder="Enter phone number"
                  id="user_phone"
                  value={user_phone}
                  defaultCountry="BD"
                  international
                  countryCallingCodeEditable={false}
                  onChange={setUserPhone}
                  error={
                    user_phone
                      ? !isValidPhoneNumber(user_phone) &&
                        "Invalid phone number"
                      : "Phone number required"
                  }
                />
              </div>

              <div className="mt-6">
                {imagePreview ? (
                  <>
                    {pdfFile?.endsWith(".pdf") || pdfFile?.endsWith(".PDF") ? (
                      <div className="relative">
                        <button
                          type="button"
                          className="btn text-white  bg-secondary border p-1 absolute right-1  top-1 "
                          onClick={clearImagePreview}
                        >
                          <RxCross1 size={15}></RxCross1>
                        </button>
                        {/* Image Preview */}
                        <iframe
                          src={imagePreview}
                          width="100%"
                          height="300"
                          title="PDF Preview"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          className="btn text-white  bg-secondary border p-1 absolute right-1  top-1 "
                          onClick={clearImagePreview}
                        >
                          <RxCross1 size={15}></RxCross1>
                        </button>
                        {/* Image Preview */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-64 object-cover my-2 rounded"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label
                      className="mt-4 w-full h-[160px] bg-gray-100 border-dashed border flex justify-center items-center cursor-pointer"
                      htmlFor="nid_card"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div>
                          <RiImageAddFill size={25} />
                        </div>
                        <p className="mt-2 text-[#C9CACA]">upload image</p>
                      </div>
                    </label>
                  </>
                )}
                <input
                  {...register("nid_card", {
                    required: "Image or Pdf is Required",
                  })}
                  type="file"
                  id="nid_card"
                  ref={fileInputRef}
                  className="mt-2  sm:text-sm p-0.5 file:cursor-pointer file:bg-primary file:text-white file:border-none file:px-2 file:py-1.5"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-[#C9CACA]  text-end">
                  Upload 300x300 pixel images in PNG, JPG, or WebP format (max 1
                  MB).
                </p>

                {errors.nid_card && (
                  <p className="text-red-600">{errors.nid_card?.message}</p>
                )}
              </div>
              <div className="flex justify-end mt-2">
                <Button type="submit">
                  {loading ? <MiniSpinner /> : "Sign Up"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginToSellerApply;
