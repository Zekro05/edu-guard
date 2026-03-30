import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const ResetPasswordOTPPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { verifyForgotPasswordOTP, isLoading, resendOTP, error } = useAuthStore();

  const [timer, setTimer] = useState(60); // countdown starts immediately

  // Countdown effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    try {
      await resendOTP();
      toast.success("OTP resent!");
      setTimer(60); // reset 1-minute countdown
    } catch (err) {
      console.error(err);
      toast.error("Failed to resend OTP.");
    }
  };

  const handleChange = (index, value) => {
    const newCode = [...code];
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join("");
    if (verificationCode.length < 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    try {
      await verifyForgotPasswordOTP(verificationCode);
      navigate("/reset-password/new");
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for progress bar color: green → yellow → red
  const getProgressColor = () => {
    const percent = (60 - timer) / 60;
    if (percent < 0.5) return "#22c55e"; // green
    if (percent < 0.8) return "#facc15"; // yellow
    return "#ef4444"; // red
  };

  return (
    <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl mx-auto mt-16 p-8">
      <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
        Reset Password OTP
      </h2>
      <p className="text-center text-gray-300 mb-6">
        Enter the 6-digit OTP sent to your email.
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
              className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-green-500 focus:outline-none"
            />
          ))}
        </div>

        {error && <p className="text-red-500 font-semibold mt-2 text-center">{error}</p>}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={isLoading || code.some((d) => !d)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </motion.button>

        {/* Resend OTP Button with timer and progress bar */}
        <div className="relative w-full mt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0}
            className={`w-full py-2 text-sm font-medium rounded-lg ${
              timer > 0
                ? "text-gray-500 cursor-not-allowed bg-gray-700"
                : "text-green-400 hover:underline bg-gray-800"
            }`}
          >
            {timer > 0 ? `Resend OTP in 0:${timer.toString().padStart(2, "0")}` : "Resend OTP"}
          </button>

          {/* Animated color-changing progress bar */}
          <div
            className="absolute bottom-0 left-0 h-1 rounded-full"
            style={{
              width: `${((60 - timer) / 60) * 100}%`,
              backgroundColor: getProgressColor(),
              transition: "width 1s linear, background-color 0.5s linear",
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordOTPPage;