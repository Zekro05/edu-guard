import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const EmailVerificationPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const { error, isLoading, otpRequired, otpType, verifyOTP, resendOTP } = useAuthStore();

 
  const handleChange = (index, value) => {
    const newCode = [...code];

    // Handle paste
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
      setCode(newCode);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // SUBMIT 
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const verificationCode = code.join("");

    if (verificationCode.length < 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    try {
      await verifyOTP(verificationCode);
      toast.success(otpType === "signup" ? "Signup verified!" : "Login verified!");
      navigate("/login"); 
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  
  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      handleSubmit();
    }
    
  }, [code]);

  //  RESEND OTP 
  const handleResendOTP = async () => {
    try {
      await resendOTP();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="max-w-md w-full bg-gray-800/50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden mx-auto mt-16">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
          {otpType === "login" ? "Verify Login OTP" : "Verify Your Email"}
        </h2>

        <p className="text-center text-gray-300 mb-6">
          {otpType === "login"
            ? "Enter the 6-digit code sent to your email to complete login."
            : "Enter the 6-digit code sent to your email address."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white border-2 
                  border-gray-600 rounded-lg focus:border-green-500 focus:outline-none"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 font-semibold mt-2 text-center">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || code.some((d) => !d)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg
              shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 
              focus:ring-opacity-50 disabled:opacity-50"
          >
            {isLoading
              ? "Verifying..."
              : otpType === "login"
              ? "Verify Login OTP"
              : "Verify Email"}
          </motion.button>

          <button
            type="button"
            onClick={handleResendOTP}
            className="w-full mt-2 text-sm text-green-400 hover:underline"
          >
            Resend OTP
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage;
