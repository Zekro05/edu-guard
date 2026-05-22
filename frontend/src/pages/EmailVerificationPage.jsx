import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/authStore";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
} from "lucide-react";

/* =========================================================
   THEME (same system as login/signup)
========================================================= */

const LightColors = {
  primary: "#1B5E20",
  background: "#F8FAFC",
  border: "#d1d5db",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  danger: "#DC2626",
};

/* =========================================================
   PAGE
========================================================= */

const EmailVerificationPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const [timer, setTimer] = useState(60);

  const { error, isLoading, otpType, verifyOTP, resendOTP } =
    useAuthStore();

  /* =========================================================
     INPUT HANDLING
  ========================================================= */

  const handleChange = (index, value) => {
    const newCode = [...code];

    // paste support
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || "";
      }

      setCode(newCode);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /* =========================================================
     VERIFY
  ========================================================= */

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const verificationCode = code.join("");

    if (verificationCode.length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }

    try {
      await verifyOTP(verificationCode);

      toast.success(
        otpType === "signup"
          ? "Signup verified!"
          : "Login verified!"
      );

      navigate("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message
      );
    }
  };

  /* =========================================================
     AUTO SUBMIT
  ========================================================= */

  useEffect(() => {
    if (code.every((d) => d !== "")) {
      handleSubmit();
    }
  }, [code]);

  /* =========================================================
     TIMER
  ========================================================= */

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleResendOTP = async () => {
    if (timer > 0) return;

    try {
      await resendOTP();
      toast.success("OTP resent!");
      setTimer(60);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message
      );
    }
  };

  /* =========================================================
     UI COLORS
  ========================================================= */

  const progress = (60 - timer) / 60;

  const getColor = () => {
    if (progress < 0.5) return "#22c55e";
    if (progress < 0.8) return "#facc15";
    return "#ef4444";
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{
        background: LightColors.background,
      }}
    >
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{ background: LightColors.primary }}
        />

        <div
          className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: "#22C55E" }}
        />
      </div>

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg rounded-[32px] border bg-white shadow-xl overflow-hidden"
        style={{
          borderColor: LightColors.border,
        }}
      >
        {/* TOP ACCENT */}
        <div
          className="h-2 w-full"
          style={{
            background:
              "linear-gradient(90deg,#1B5E20,#22C55E)",
          }}
        />

        <div className="p-10 text-center">
          {/* ICON */}
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center border bg-white shadow-sm"
            style={{
              borderColor: LightColors.border,
            }}
          >
            <ShieldCheck
              className="w-10 h-10"
              style={{
                color: LightColors.primary,
              }}
            />
          </div>

          {/* TITLE */}
          <h2
            className="mt-6 text-3xl font-black"
            style={{
              color: LightColors.textPrimary,
            }}
          >
            Verify Your Code
          </h2>

          <p
            className="mt-2 text-sm"
            style={{
              color: LightColors.textSecondary,
            }}
          >
            Enter the 6-digit OTP sent to your email
          </p>

          {/* OTP BOXES */}
          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) =>
                    (inputRefs.current[index] = el)
                  }
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleChange(
                      index,
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(index, e)
                  }
                  className="w-14 h-14 text-center text-xl font-bold rounded-xl border bg-white shadow-sm outline-none transition"
                  style={{
                    borderColor:
                      LightColors.border,
                  }}
                />
              ))}
            </div>

            {/* ERROR */}
            {error && (
              <p
                className="mt-4 text-sm font-medium"
                style={{
                  color: LightColors.danger,
                }}
              >
                {error}
              </p>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={
                isLoading ||
                code.some((d) => !d)
              }
              className="mt-8 w-full h-14 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg,#1B5E20,#256d2a)",
              }}
            >
              {isLoading ? (
                "Verifying..."
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* RESEND */}
          <div className="mt-8">
            <button
              onClick={handleResendOTP}
              disabled={timer > 0}
              className="text-sm font-semibold"
              style={{
                color:
                  timer > 0
                    ? "#9CA3AF"
                    : LightColors.primary,
              }}
            >
              {timer > 0
                ? `Resend in 0:${timer
                    .toString()
                    .padStart(2, "0")}`
                : "Resend OTP"}
            </button>

            {/* TIMER BAR */}
            <div className="mt-3 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: getColor(),
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage;