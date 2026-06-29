"use client";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useResendOtpMutation,
  useVerifyMutation,
} from "@/redux/feature/auth/authApi";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";

const VerifyForm = () => {
  const [loading, setLoading] = useState(false);
  const [login_credentials, setLogin_credentials] = useState("");
  const [user_name, setUser_name] = useState("");
  const [otp_system, setOtp_system] = useState("");
  const [timerCount, setTimer] = useState(15);
  const [OTPinput, setOTPinput] = useState(["", "", "", ""]);
  const [disable, setDisable] = useState(true);
  const { handleSubmit, reset } = useForm();
  const router = useRouter();

  const [verify, { isLoading }] = useVerifyMutation();
  const [resendOtp] = useResendOtpMutation();

  const handleVerify = async () => {
    try {
      setLoading(true);
      const otp = OTPinput.join("");
      const data = {
        user_phone: login_credentials,
        user_otp: otp,
      };
      const res = await verify(data);
      if (res?.data?.success) {
        toast.success(res?.data?.message, {
          autoClose: 1,
        });
        localStorage.removeItem("sign_up_login_credentials");
        localStorage.removeItem("sign_up_user_name");
        localStorage.removeItem("sign_up_otp_system");
        router.push("/sign-in");
        reset();
      } else if (res?.error?.status === 400) {
        toast.error(res?.error?.data?.message);
      }
    } catch (error) {
      console.error("otp verified error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (disable) return;
      if (!login_credentials || !user_name || !otp_system) {
        toast.error("Something went wrong !", {
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
      const data = {
        login_credentials: login_credentials,
        user_name: user_name,
        otp_system: otp_system,
      };
      const res = await resendOtp(data);
      if (res.data?.statusCode === 200 && res.data?.success === true) {
        setDisable(true);
        toast.info(res?.data?.message);
        setTimer(15);
      } else {
        toast.error(res.error.data?.message, {
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("resend otp error", error);
    }
  };

  const handleInputChange = (index, value) => {
    const newOTPinput = [...OTPinput];
    newOTPinput[index] = value;
    setOTPinput(newOTPinput);

    // Automatically move to the next input field if the current field is not the last one
    if (index < newOTPinput.length - 1 && value !== "") {
      document.getElementById(`otpInput-${index + 1}`).focus();
    }
  };

  const handleInputKeyDown = (index, e) => {
    // Move to the previous input field on backspace if the current field is empty
    if (e.key === "Backspace" && index > 0 && OTPinput[index] === "") {
      document.getElementById(`otpInput-${index - 1}`).focus();
    }
  };

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((lastTimerCount) => {
        lastTimerCount <= 1 && clearInterval(interval);
        if (lastTimerCount <= 1) setDisable(false);
        if (lastTimerCount <= 0) return lastTimerCount;
        return lastTimerCount - 1;
      });
    }, 1000); // each count lasts for a second
    // cleanup the interval on complete
    return () => clearInterval(interval);
  }, [disable]);

  useEffect(() => {
    const login_credentials = JSON.parse(
      localStorage.getItem("sign_up_login_credentials")
    );
    const user_name = JSON.parse(localStorage.getItem("sign_up_user_name"));
    const otp_system = JSON.parse(localStorage.getItem("sign_up_otp_system"));
    if (login_credentials) {
      setLogin_credentials(login_credentials);
    }
    if (otp_system) {
      setOtp_system(otp_system);
    }
    if (user_name) {
      setUser_name(user_name);
    }
  }, []);

  return (
    <div className="flex justify-center items-center">
      <div>
        <div className="px-6 pt-10 pb-9 shadow mx-auto w-full  ">
          <div className="mx-auto flex flex-col space-y-3">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <h4 className="text-primary font-medium mb-0">
                Verify your account
              </h4>
              <p>We have sent a code to {login_credentials}</p>
            </div>

            <form onSubmit={handleSubmit(handleVerify)}>
              <div className="flex flex-col space-y-5">
                <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="w-12 h-12">
                      <input
                        maxLength="1"
                        id={`otpInput-${index}`}
                        className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none  border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                        type="text"
                        onChange={(e) =>
                          handleInputChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleInputKeyDown(index, e)}
                      ></input>
                    </div>
                  ))}
                </div>
                <div>
                  <button className="flex flex-row cursor-pointer items-center justify-center text-center w-full border  outline-none py-3 bg-primary border-none text-white text-sm shadow-sm">
                    {loading || isLoading ? <MiniSpinner /> : "Verify Account"}
                  </button>
                </div>
              </div>
            </form>
            <div className="flex flex-col space-y-5 max-w-xs mx-auto">
              <div className="flex flex-row items-center justify-center text-center text-sm font-medium space-x-1 text-gray-500">
                <p className="mb-0">Did not receive code?</p>{" "}
                <button
                  className={`${
                    disable
                      ? "text-gray-500 cursor-not-allowed"
                      : "cursor-pointer underline"
                  }`}
                  onClick={() => handleResend()}
                >
                  {disable ? `Resend OTP in ${timerCount}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyForm;
