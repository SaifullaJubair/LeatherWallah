// sign-in/page.jsx এ এই change করো
// LoginForm এ phone prefill support add করো

"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { CiLock } from "react-icons/ci";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { syncCartAfterLogin } from "@/utils/cartSync";
import { syncWishlistAfterLogin } from "@/utils/wishlistSync";
import { FaEye, FaEyeSlash, FaShoppingBag } from "react-icons/fa";
import { useUserLoginMutation } from "@/redux/feature/auth/authApi";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import Image from "next/image";
import signupImage from "./loginIMg.png";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
import { LoaderOverlay } from "@/components/shared/loader/LoaderOverlay";
import useAnalytics from "@/components/analyticsScripts/utils/useAnalytics";

const LoginForm = () => {
  const [user_phone, setUserPhone] = useState();
  const [isPasswordShow, setPasswordShow] = useState(false);
  const [userLogin, { isLoading }] = useUserLoginMutation();
  const getQuery = useSearchParams();
  const successRedirect = getQuery.get("success_redirect");
  // ✅ phone prefill — set-password page থেকে আসলে
  const phoneFromQuery = getQuery.get("phone");

  const dispatch = useDispatch();
  const { products: cartProducts } = useSelector((state) => state.cart);
  const { trackLogin } = useAnalytics();

  // ✅ prefill phone if passed in query
  useEffect(() => {
    if (phoneFromQuery) {
      setUserPhone(phoneFromQuery);
    }
  }, [phoneFromQuery]);

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

      const res = await userLogin({
        user_phone,
        user_password: data?.user_password,
      });

      if (res?.data?.statusCode === 200 && res?.data?.success === true) {
        toast.success(res?.data?.message, { autoClose: 2000 });
        reset();
        await trackLogin({ ph: user_phone });
        await syncCartAfterLogin(cartProducts, dispatch);
        // F3 — push the guest's localStorage wishlist to the BE so the buyer
        // keeps saved items across devices. Best-effort, never throws.
        await syncWishlistAfterLogin();
        router.push(successRedirect || "/");
      } else {
        // B1 FE (2026-06-04) — when a guest-checkout user (auto-created
        // account, no password set) tries to log in with any password, BE
        // returns the "Account exists but no password set" 400. We deep-link
        // them straight to /forget-password with the phone prefilled so
        // they don't have to retype it. Other login errors keep the toast.
        const errMsg = res?.error?.data?.message || "Something went wrong";
        if (/no password set/i.test(errMsg)) {
          toast.info(
            "Account exists — set your password via OTP to sign in.",
            { autoClose: 2500 },
          );
          router.push(
            `/forget-password?phone=${encodeURIComponent(user_phone || "")}`,
          );
          return;
        }
        toast.error(errMsg, { autoClose: 1000 });
      }
    } catch (error) {
      console.error(error);
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
              <h2 className="text-primary my-2">WELCOME BACK</h2>
              <p>Login To Your Account</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit(submitForm)}>
              <div>
                <label htmlFor="user_phone" className="font-medium">
                  Phone
                </label>
                <PhoneInput
                  className="custom-phone-input w-full border border-white-light bg-white px-4 py-2 text-sm text-black placeholder:text-white-dark"
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
              <div className="flex flex-col-reverse lg:flex-row justify-end">
                <Link
                  href="/forget-password"
                  className="flex cursor-pointer items-center"
                >
                  <span className="text-danger underline ml-2">
                    Forget Password
                  </span>
                </Link>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || Object.keys(errors).length > 0}
                className="bg-primary text-white py-[6px] !mt-6 w-full border-0 font-medium uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
              >
                {isLoading ? <MiniSpinner /> : "Sign in"}
              </button>
            </form>
            <div className="relative my-7 text-center">
              <span className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 bg-white-light"></span>
              <span className="relative px-2 uppercase text-white-dark">
                or
              </span>
            </div>
            <div className="text-center">
              Don&apos;t have an account ?&nbsp;
              <Link
                href="/sign-up"
                className="uppercase text-primary underline transition hover:text-black font-medium"
              >
                SIGN UP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<LoaderOverlay />}>
      <LoginForm />
    </Suspense>
  );
}
