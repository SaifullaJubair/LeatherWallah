"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "react-toastify";
import { useForgetPasswordMutation } from "@/redux/feature/auth/authApi";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
import { FaLongArrowAltLeft, FaShoppingBag } from "react-icons/fa";
import signupImage from "./forgetPasswordimg.png";
import Link from "next/link";
import Image from "next/image";

const ForgetPasswordForm = () => {
  const [user_phone, setUserPhone] = useState();
  const router = useRouter();
  const {
    handleSubmit,

    formState: { errors, isSubmitting },
    reset,
  } = useForm();
  const [forgetPassword, { isLoading }] = useForgetPasswordMutation();
  const submitForm = async () => {
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
          return;
        }
      }
      if (!user_phone) {
        toast.error(" Phone is required !", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }
      const sendData = {
        user_phone: user_phone,
      };

      const res = await forgetPassword(sendData);
      if (res?.data?.statusCode === 200 && res?.data?.success === true) {
        localStorage.setItem(
          "forget_user_phone",
          JSON.stringify(sendData?.user_phone),
        );
        localStorage.setItem(
          "forget_user_name",
          JSON.stringify(res?.data?.data?.user_name),
        );
        toast.info(res?.data?.message, {
          autoClose: 2000,
        });
        router.push("/change-password");
        reset();
      } else {
        toast.error(res?.error?.data?.message || "Something went wrong", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      console.log("done");
    }
  };

  return (
    <div className="sm:grid sm:grid-cols-2 sm:gap-6 md:gap-8 lg:gap-12">
      <div className="bg-primary sm:flex sm:justify-center sm:items-center hidden ">
        <Image src={signupImage} alt="signupImage" width={500} height={500} />
      </div>
      <div className="min-h-screen lg:w-[500px] md:w-[380px] sm:w-[300px] w-[95%] sm:mx-0 mx-auto flex items-center ">
        {" "}
        <div className="w-full">
          <div className="mb-8">
            <FaShoppingBag size={35} className="text-primary" />
            <h2 className="text-primary my-2">Forgot password?</h2>
            <p>Enter your phone number to recover your password.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit(submitForm)}>
            <div className="">
              <div>
                <label htmlFor="user_phone" className="font-medium">
                  Phone
                </label>
                <PhoneInput
                  className="w-full custom-phone-input  border border-white-light bg-white px-2 py-3 text-sm text-black !outline-none ps-4 placeholder:text-white-dark mt-2"
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="bg-primary text-white py-[6px]  font-medium !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
            >
              {isLoading ? <MiniSpinner /> : "RECOVER"}
            </button>
            <Link href={"/sign-in"}>
              <button className="text-primary hover:text-blue-600 font-semibold mt-8 flex items-center gap-2.5">
                <FaLongArrowAltLeft /> Back to Previous Page
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPasswordForm;
