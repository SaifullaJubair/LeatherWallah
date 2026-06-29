"use client";
import Image from "next/image";
import signupImage from "./signup_image.png";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useUserRegistrationMutation } from "@/redux/feature/auth/authApi";
import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaRegUser,
  FaShoppingBag,
} from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import Link from "next/link";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";

// ✅ আগে ছিল: useMetaPixel + generateEventId + sendServerEvent
// ✅ এখন: একটাই hook
import useAnalytics from "@/components/analyticsScripts/utils/useAnalytics";

const SignUpForm = () => {
  const [isPasswordShow, setPasswordShow] = useState(false);
  const [userRegistration, { isLoading }] = useUserRegistrationMutation();
  const [user_phone, setUserPhone] = useState();

  // ✅ একটাই
  const { trackCompleteRegistration } = useAnalytics();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const router = useRouter();

  const submitForm = async (data) => {
    try {
      if (user_phone) {
        if (
          !formatPhoneNumber(user_phone) ||
          !isPossiblePhoneNumber(user_phone) ||
          !isValidPhoneNumber(user_phone)
        ) {
          toast.error("Mobile number not valid !", {
            position: "top-center",
            autoClose: 2000,
          });
          return;
        }
      }
      if (!user_phone) {
        toast.error("Phone is required !", {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }

      // Phase 1C — optional email passed through if provided.
      const email = (data?.user_email || "").trim();
      const res = await userRegistration({
        user_name: data?.user_name,
        user_phone,
        user_password: data?.user_password,
        ...(email ? { user_email: email } : {}),
      });

      if (res.data?.statusCode === 200 && res.data?.success === true) {
        // ✅ CompleteRegistration — Meta (browser + CAPI) + TikTok (browser + CAPI) + GTM
        // সব একটাই call — settings এ যেটা enabled সেটাই fire হবে
        await trackCompleteRegistration({
          ph: user_phone,
          fn: data?.user_name,
        });

        reset();
        router.push("/sign-in");
      } else {
        toast.error(res.error.data?.message, { autoClose: 2000 });
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="">
      <div className="sm:grid sm:grid-cols-2 sm:gap-6 md:gap-8 lg:gap-12">
        <div className="bg-primary sm:flex sm:justify-center sm:items-center hidden">
          <Image src={signupImage} alt="signupImage" width={500} height={500} />
        </div>
        <div className="min-h-screen lg:w-[500px] md:w-[380px] sm:w-[300px] w-[95%] sm:mx-0 mx-auto flex items-center">
          <div className="w-full">
            <div className="mb-8">
              <FaShoppingBag size={35} className="text-primary" />
              <h2 className="text-primary my-2">CREATE AN ACCOUNT</h2>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit(submitForm)}>
              <div>
                <label htmlFor="user_name" className="font-medium">
                  User Name
                </label>
                <span className="text-xs text-danger">*</span>
                <div className="relative text-white-dark">
                  <input
                    id="user_name"
                    name="user_name"
                    type="text"
                    placeholder="Enter Name"
                    className="w-full border border-white-light bg-white px-4 py-2 text-sm text-black !outline-none ps-10 placeholder:text-white-dark"
                    {...register("user_name", {
                      required: "First Name is Required!",
                    })}
                  />
                  <span className="absolute start-4 top-1/2 -translate-y-1/2">
                    <FaRegUser />
                  </span>
                </div>
                {errors.user_name && (
                  <span className="text-xs text-danger">
                    {errors?.user_name?.message}
                  </span>
                )}
              </div>
              {/* Phase 1C — optional email. Skip-able, only validated
                  when the buyer actually types something. */}
              <div>
                <label htmlFor="user_email" className="font-medium">
                  Email{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    (optional)
                  </span>
                </label>
                <div className="relative text-white-dark">
                  <input
                    id="user_email"
                    name="user_email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full border border-white-light bg-white px-4 py-2 text-sm text-black !outline-none ps-10 placeholder:text-white-dark"
                    {...register("user_email", {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email format",
                      },
                    })}
                  />
                  <span className="absolute start-4 top-1/2 -translate-y-1/2">
                    <FaEnvelope size={13} />
                  </span>
                </div>
                {errors.user_email && (
                  <span className="text-xs text-danger">
                    {errors?.user_email?.message}
                  </span>
                )}
              </div>
              <div>
                <label htmlFor="user_phone" className="font-medium">
                  Phone
                </label>
                <PhoneInput
                  className="w-full border border-white-light bg-white px-2 py-3 text-sm text-black !outline-none ps-4 placeholder:text-white-dark"
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
              <div>
                <label htmlFor="Password" className="font-medium">
                  Password
                </label>
                <span className="text-xs text-danger">*</span>
                <div className="relative text-white-dark">
                  <input
                    id="Password"
                    name="user_password"
                    type={isPasswordShow ? "text" : "password"}
                    placeholder="Enter Password"
                    className="w-full border border-white-light bg-white px-4 py-2 text-sm text-black !outline-none ps-10 placeholder:text-white-dark"
                    {...register("user_password", {
                      required: "Password is Required!",
                    })}
                  />
                  <span className="absolute start-4 top-1/2 -translate-y-1/2">
                    <CiLock />
                  </span>
                  <span
                    onClick={() => setPasswordShow(!isPasswordShow)}
                    className="absolute end-4 top-1 translate-y-1/2 cursor-pointer"
                  >
                    {isPasswordShow ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.user_password && (
                  <span className="text-xs text-danger">
                    {errors?.user_password?.message}
                  </span>
                )}
              </div>
              <div className="flex flex-row">
                <label className="flex cursor-pointer items-center">
                  <input
                    {...register("agree", {
                      required: "You must agree to the terms and conditions.",
                    })}
                    type="checkbox"
                    className="form-checkbox bg-white"
                  />
                  <span className="text-white-dark ml-2">
                    Do you have agree with?
                  </span>
                </label>
                <Link
                  href="/term-&-condition"
                  className="flex cursor-pointer items-center"
                >
                  <span className="underline ml-2">Term & Condition</span>
                </Link>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || Object.keys(errors).length > 0}
                className="bg-primary text-white py-[6px] font-medium !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
              >
                {isLoading ? <MiniSpinner /> : "Sign Up"}
              </button>
            </form>
            <div className="relative my-7 text-center">
              <span className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 bg-white-light"></span>
              <span className="relative px-2 uppercase text-white-dark">
                or
              </span>
            </div>
            <div className="text-center">
              Already have an account ?&nbsp;
              <Link
                href="/sign-in"
                className="uppercase text-primary underline transition hover:text-black font-medium"
              >
                SIGN IN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
