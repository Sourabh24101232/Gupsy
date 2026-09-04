"use client";

import { ArrowRight, ChevronLeft, Loader2, Lock } from "lucide-react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie"; //Used to create/read browser cookies.This component uses it to save the authentication token.
import axios from "axios"; //Axios is used to make HTTP requests to your backend.
import { useAppData, user_service } from "@/context/AppContext";
import Loading from "./Loading";
import toast from "react-hot-toast";

const VerifyOtp = () => {
  const { isAuth, setIsAuth, setUser, loading: userLoading } = useAppData();

  const [loading, setLoading] = useState(false); //Stores whether OTP verification is currently happening.The button changes from: Verify → Verifying...
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]); //otp is an array of string
  const [error, setError] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60); //Stores the resend countdown.While timer > 0:Resend code in 42s  , When it reaches 0: "Resend Code" button becomes available.

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  const searchParams = useSearchParams(); //get email from url
  const email: string = searchParams.get("email") || "";

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const otpString = otp.join(""); //Convert OTP array into a string . otp = ["4", "7", "2", "9", "1", "8"] converted into "472918"
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError(""); //First remove any old error.
    setLoading(true); //Verification request has started.So the button can show: Verifying...

    try {
      //Send OTP to backend. So your frontend is basically saying: Backend, please check whether OTP 472918 belongs to sourabh@gmail.com.
      const { data } = await axios.post(`${user_service}/api/v1/verify`, {
        email,
        otp: otpString,
      });

      //sample data
      // {
      //   "message": "Email verified successfully",
      //   "token": "abc123"
      // }

      //Show backend message
      toast.success(data.message);

      //Save authentication token.Your backend gives the frontend a token after successful verification.The frontend stores that token in a cookie.
      Cookies.set("token", data.token, {
        expires: 15, //The cookie expires after 15 days.
        secure: false, //The cookie can be sent over non-HTTPS connections.
        path: "/", //The cookie is available throughout the website.
      });

      setOtp(["", "", "", "", "", ""]); //After successful verification, all OTP boxes become empty.
      inputRefs.current[0]?.focus(); //This puts the cursor into the first OTP box.
      setUser(data.User);
      setIsAuth(true);
    } catch (error: any) {
      setError(error.response?.data?.message);
    } finally {
      //This runs whether the request succeeds or fails.
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    //Start resend loading
    setResendLoading(true);
    setError("");

    try {
      //Request a new OTP
      const { data } = await axios.post(`${user_service}/api/v1/login`, {
        email,
      });

      toast.success(data.message);
      setTimer(60);
    } catch (error: any) {
      setError(error.response?.data?.message);
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1); //update counter
      }, 1000); //took 1000 ms

      return () => clearInterval(interval); //When the effect is cleaned up, it stops the previous interval.
    }
  }, [timer]); //Run this effect whenever timer changes.So every second, timer changes:React runs the effect again.

  //Now the function handling OTP input.
  const handleInputChange = (index: number, value: string): void => {
    //It receives:{index,value}-->>indexing is 0 based
    if (value.length > 1) return; //Each OTP box should contain only one character.

    const newOtp = [...otp]; //copy it Because React state should not be directly modified.
    newOtp[index] = value; //Update specific digit
    setOtp(newOtp);
    setError("");

    //Automatically move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  //it handles Backspace.
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLElement>,
  ): void => {
    //Backspace behavior
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  //This function handles the entire OTP.
  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement | null>,
  ): void => {
    e.preventDefault(); //Stop the browser's normal paste behavior.We'll handle the paste ourselves.

    const pastedData = e.clipboardData.getData("text"); //If user copied:"Your OTP is 472918" then pastedData = "Your OTP is 472918"
    const digits = pastedData.replace(/\D/g, "").slice(0, 6); //Find everything that is NOT a digit and Remove non-digits. takes only the first 6 characters.so 472918999 becomes 472918
    if (digits.length === 6) {
      const newOtp = digits.split(""); //Convert string to array
      setOtp(newOtp);
      inputRefs.current[5]?.focus(); //Cursor goes to the sixth box.
    }
  };

  if (userLoading) return <Loading />;
  if (isAuth) redirect("/chat");

  //The return contains what appears on the screen.
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <div className="text-center mb-8 relative">
            <button
              className="absolute top-0 left-0 p-2 text-gray-300 hover:text-white"
              onClick={() => router.push("/login")}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              <Lock size={40} className="text-white" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-3">
              {" "}
              Verify Your Email{" "}
            </h1>

            <p className="text-gray-300 text-lg">
              We have sent a 6-digit code to
            </p>

            <p className="text-blue-400 font-medium">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-4 text-center"
              >
                Enter your 6-digit OTP here...
              </label>

              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el: HTMLInputElement | null) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-600 rounded-lg bg-gray-700 text-white"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                <p className="text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading} //Disable button while verifying, when loading = true, the button becomes disabled.
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Verify</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          <p className="text-gray-400 text-sm mb-4">Didn't receive the code?</p>

          {timer > 0 ? (
            <p className="text-sm text-gray-400">Resend code in {timer}s</p>
          ) : (
            <button
              className="text-blue-400 hover:text-blue-300 font-medium text-sm disabled:opacity-50"
              disabled={resendLoading}
              onClick={handleResendOtp}
            >
              {resendLoading ? "Sending..." : "Resend Code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
