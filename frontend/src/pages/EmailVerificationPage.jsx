import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const EmailVerificationPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const [timer, setTimer] = useState(60);

  const { error, isLoading, otpType, verifyOTP, resendOTP } = useAuthStore();

  // ---------------- OTP INPUT ----------------
  const handleChange = (index, value) => {
    const newCode = [...code];

    // Handle paste
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
      setCode(newCode);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
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

  // ---------------- SUBMIT ----------------
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

  // Auto submit when all digits filled
  useEffect(() => {
    if (code.every((digit) => digit !== "")) handleSubmit();
  }, [code]);

  // ---------------- RESEND OTP ----------------
  const handleResendOTP = async () => {
    if (timer > 0) return;
    try {
      await resendOTP();
      toast.success("OTP resent!");
      setTimer(60);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // Countdown timer for resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const getProgressColor = () => {
    const percent = (60 - timer) / 60;
    if (percent < 0.5) return "#22c55e";
    if (percent < 0.8) return "#facc15";
    return "#ef4444";
  };

  // ---------------- UI ----------------
  return (
    <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-xl mx-auto mt-16 p-6">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8"
      >
        <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
          {otpType === "login" ? "Verify Login OTP" : "Verify Your Email"}
        </h2>
        <p className="text-center text-gray-300 mb-6 text-sm">
          {otpType === "login"
            ? "Enter the 6-digit code sent to your email to complete login."
            : "Enter the 6-digit code sent to your email address."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP inputs */}
          <div className="flex justify-between mb-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-2xl font-bold bg-gray-700 text-white border-2 
                  border-gray-600 rounded-lg focus:border-green-500 focus:outline-none transition"
              />
            ))}
          </div>

          {/* Error */}
          {error && <p className="text-red-500 font-semibold mt-2 text-center">{error}</p>}

          {/* Submit button */}
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

          {/* Resend OTP */}
          <div className="mt-2 text-center relative">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={timer > 0}
              className={`text-sm font-medium rounded-lg ${
                timer > 0
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-green-400 hover:underline"
              }`}
            >
              {timer > 0 ? `Resend OTP in 0:${timer.toString().padStart(2, "0")}` : "Resend OTP"}
            </button>
            <div
              className="absolute bottom-0 left-0 h-1 rounded-full w-full mt-1"
              style={{
                backgroundColor: getProgressColor(),
                width: `${((60 - timer) / 60) * 100}%`,
                transition: "width 1s linear, background-color 0.5s linear",
              }}
            />
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage;