import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  RefreshCw,
  ArrowLeft,
  LockKeyhole,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const LightColors = {
  primary: "#1B5E20",
  primarySoft: "#f0fdf4",
  background: "#F8FAFC",
  surface: "#ffffff",
  elevated: "#f9fafb",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textLabel: "#1f2937",
  textMuted: "#9CA3AF",
  border: "#d1d5db",
  divider: "#e5e7eb",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#DC2626",
};

const ResetPasswordOTPPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const {
    verifyForgotPasswordOTP,
    isLoading,
    resendOTP,
    error,
  } = useAuthStore();

  /* =========================================================
     COUNTDOWN
  ========================================================= */
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* =========================================================
     AUTO FOCUS
  ========================================================= */
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  /* =========================================================
     RESEND OTP
  ========================================================= */
  const handleResend = async () => {
    if (timer > 0 || isLoading) return;

    try {
      await resendOTP();

      setCode(["", "", "", "", "", ""]);
      setTimer(60);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);

      toast.success("A new OTP has been sent to your email.");
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  /* =========================================================
     HANDLE OTP INPUT
  ========================================================= */
  const handleChange = (index, value) => {
    const numericValue = value.replace(/\D/g, "");
    const newCode = [...code];

    // Handle pasted OTP
    if (numericValue.length > 1) {
      const pasted = numericValue.slice(0, 6).split("");

      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || "";
      }

      setCode(newCode);

      const nextIndex = Math.min(pasted.length, 5);

      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 50);

      return;
    }

    newCode[index] = numericValue.slice(0, 1);

    setCode(newCode);

    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* =========================================================
     HANDLE KEYBOARD
  ========================================================= */
  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (code[index]) {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
        return;
      }

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();

        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* =========================================================
     HANDLE PASTE
  ========================================================= */
  const handlePaste = (event) => {
    event.preventDefault();

    const pastedText = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedText) return;

    const newCode = ["", "", "", "", "", ""];

    pastedText.split("").forEach((digit, index) => {
      newCode[index] = digit;
    });

    setCode(newCode);

    const nextIndex = Math.min(pastedText.length, 5);

    setTimeout(() => {
      inputRefs.current[nextIndex]?.focus();
    }, 50);
  };

  /* =========================================================
     VERIFY OTP
  ========================================================= */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      await verifyForgotPasswordOTP(verificationCode);

      toast.success("OTP verified successfully!");

      navigate("/reset-password/new");
    } catch (err) {
      console.error("OTP verification error:", err);
    }
  };

  /* =========================================================
     TIMER
  ========================================================= */
  const progressPercentage = ((60 - timer) / 60) * 100;

  const getProgressColor = () => {
    if (timer > 30) return LightColors.success;
    if (timer > 12) return LightColors.warning;
    return LightColors.danger;
  };

  const formattedTimer = `0:${timer.toString().padStart(2, "0")}`;

  const isComplete = code.every((digit) => digit !== "");

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: LightColors.background,
        color: LightColors.textPrimary,
      }}
    >
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(34,197,94,0.22), transparent 70%)",
          }}
        />

        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(22,163,74,0.20), transparent 70%)",
          }}
        />

        <div
          className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)",
          }}
        />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="relative z-10 px-5 sm:px-8 lg:px-12 pt-6">
        <div className="w-full flex items-center justify-between">
          {/* BRAND */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-sm border"
              style={{
                background: "#ffffff",
                borderColor: LightColors.divider,
              }}
            >
              <img
                src="/school-logo.png"
                alt="Our Lady of the Holy Rosary School"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
              />
            </div>

            <div>
              <h1
                className="font-bold text-xl sm:text-2xl leading-none"
                style={{
                  color: LightColors.primary,
                }}
              >
                Guid<span style={{ color: "#16A34A" }}>Ed</span>
              </h1>

              <p
                className="text-[10px] sm:text-xs mt-1"
                style={{
                  color: LightColors.textMuted,
                }}
              >
                Campus Security Management Platform
              </p>
            </div>
          </div>

          {/* DESKTOP BADGE */}
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold"
            style={{
              background: "rgba(255,255,255,0.75)",
              borderColor: "#bbf7d0",
              color: LightColors.primary,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Secure Account Recovery
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}
      <main className="relative z-10 px-5 sm:px-8 lg:px-12">
        <div
          className="
            min-h-[calc(100vh-110px)]
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-10
            lg:gap-16
            xl:gap-20
            items-center
            py-10
            lg:py-12
          "
        >
          {/* =================================================
              LEFT SIDE
          ================================================= */}
          <motion.section
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="hidden lg:flex items-center"
          >
            <div className="w-full max-w-xl">
              {/* BADGE */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
                style={{
                  background: LightColors.primarySoft,
                  borderColor: "#bbf7d0",
                  color: LightColors.primary,
                }}
              >
                <ShieldCheck size={16} />

                <span className="text-sm font-semibold">
                  Identity Verification
                </span>
              </div>

              {/* HEADING */}
              <h2
                className="
                  text-4xl
                  xl:text-5xl
                  font-bold
                  leading-[1.08]
                  tracking-tight
                "
                style={{
                  color: LightColors.textPrimary,
                }}
              >
                Verify Your
                <span
                  className="block"
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Identity.
                </span>
              </h2>

              {/* DESCRIPTION */}
              <p
                className="mt-5 text-base xl:text-lg leading-7 max-w-lg"
                style={{
                  color: LightColors.textSecondary,
                }}
              >
                We sent a verification code to your email address. Enter the
                6-digit code to securely continue resetting your GuidEd
                account password.
              </p>

              {/* FEATURES */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Secure",
                    description: "Protected verification",
                  },
                  {
                    icon: Mail,
                    title: "Email OTP",
                    description: "One-time verification",
                  },
                  {
                    icon: LockKeyhole,
                    title: "Private",
                    description: "Your account stays protected",
                  },
                  {
                    icon: RefreshCw,
                    title: "Easy Recovery",
                    description: "Quick password recovery",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.title}
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.35,
                        delay: 0.15 + index * 0.06,
                      }}
                      className="p-4 rounded-2xl border bg-white/70 backdrop-blur-sm"
                      style={{
                        borderColor: LightColors.divider,
                        boxShadow:
                          "0 6px 20px rgba(15,23,42,0.04)",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                        style={{
                          background: LightColors.primarySoft,
                          color: LightColors.primary,
                        }}
                      >
                        <Icon size={17} />
                      </div>

                      <h3
                        className="font-semibold text-sm"
                        style={{
                          color: LightColors.textPrimary,
                        }}
                      >
                        {item.title}
                      </h3>

                      <p
                        className="text-xs mt-1 leading-5"
                        style={{
                          color: LightColors.textSecondary,
                        }}
                      >
                        {item.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* SECURITY MESSAGE */}
              <div
                className="mt-7 flex items-start gap-3 p-4 rounded-2xl border"
                style={{
                  background: "rgba(240,253,244,0.65)",
                  borderColor: "#bbf7d0",
                }}
              >
                <ShieldCheck
                  size={19}
                  className="flex-shrink-0 mt-0.5"
                  style={{
                    color: LightColors.primary,
                  }}
                />

                <p
                  className="text-sm leading-5"
                  style={{
                    color: "#166534",
                  }}
                >
                  Never share your verification code with anyone. GuidEd will
                  never ask you to provide your OTP through chat or phone.
                </p>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}
          <motion.section
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.1,
            }}
            className="w-full flex justify-center"
          >
            <div className="w-full max-w-[520px]">
              {/* CARD */}
              <div
                className="
                  relative
                  w-full
                  rounded-[28px]
                  sm:rounded-[32px]
                  p-6
                  sm:p-8
                  lg:p-9
                  border
                  overflow-hidden
                "
                style={{
                  background: "rgba(255,255,255,0.88)",
                  borderColor: "rgba(255,255,255,0.95)",
                  boxShadow:
                    "0 20px 60px rgba(15,23,42,0.09), 0 6px 25px rgba(15,23,42,0.04)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* GREEN TOP ACCENT */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background:
                      "linear-gradient(90deg, #1B5E20, #22C55E, #10B981)",
                  }}
                />

                {/* CARD HEADER */}
                <div className="text-center">
                  <div
                    className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 border"
                    style={{
                      background: "#ffffff",
                      borderColor: LightColors.divider,
                      boxShadow:
                        "0 6px 20px rgba(15,23,42,0.05)",
                    }}
                  >
                    <img
                      src="/school-logo.png"
                      alt="School Logo"
                      className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                    />
                  </div>

                  <h2
                    className="text-2xl sm:text-3xl font-bold"
                    style={{
                      color: LightColors.textPrimary,
                    }}
                  >
                    Verify OTP
                  </h2>

                  <p
                    className="mt-2 text-sm sm:text-base leading-6"
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Enter the 6-digit verification code sent to your email.
                  </p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="mt-7">
                  {/* LABEL */}
                  <div className="flex items-center justify-between mb-3">
                    <label
                      className="text-sm font-semibold"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Verification code
                    </label>

                    <span
                      className="text-xs font-medium"
                      style={{
                        color: LightColors.textMuted,
                      }}
                    >
                      {code.filter(Boolean).length}/6
                    </span>
                  </div>

                  {/* OTP INPUTS */}
                  <div
                    className="grid grid-cols-6 gap-2 sm:gap-3"
                    onPaste={handlePaste}
                  >
                    {code.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={(element) => {
                          inputRefs.current[index] = element;
                        }}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.25,
                          delay: index * 0.04,
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={
                          index === 0
                            ? "one-time-code"
                            : "off"
                        }
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                          handleChange(
                            index,
                            event.target.value
                          )
                        }
                        onKeyDown={(event) =>
                          handleKeyDown(index, event)
                        }
                        aria-label={`OTP digit ${index + 1}`}
                        className="
                          w-full
                          h-12
                          sm:h-14
                          text-center
                          text-xl
                          sm:text-2xl
                          font-bold
                          rounded-xl
                          outline-none
                          transition-all
                        "
                        style={{
                          color: LightColors.textPrimary,
                          background: digit
                            ? LightColors.primarySoft
                            : LightColors.elevated,
                          border: `2px solid ${
                            digit
                              ? "#86efac"
                              : LightColors.border
                          }`,
                          boxShadow: digit
                            ? "0 0 0 3px rgba(34,197,94,0.07)"
                            : "none",
                        }}
                        onFocus={(event) => {
                          event.currentTarget.style.borderColor =
                            LightColors.success;

                          event.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(34,197,94,0.10)";
                        }}
                        onBlur={(event) => {
                          event.currentTarget.style.borderColor =
                            digit
                              ? "#86efac"
                              : LightColors.border;

                          event.currentTarget.style.boxShadow =
                            digit
                              ? "0 0 0 3px rgba(34,197,94,0.07)"
                              : "none";
                        }}
                      />
                    ))}
                  </div>

                  {/* ERROR */}
                  {error && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mt-4 rounded-xl border px-4 py-3 flex items-start gap-3"
                      style={{
                        background: "#fef2f2",
                        borderColor: "#fecaca",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: "#fee2e2",
                          color: LightColors.danger,
                        }}
                      >
                        <span className="text-xs font-bold">
                          !
                        </span>
                      </div>

                      <p
                        className="text-sm leading-5"
                        style={{
                          color: "#b91c1c",
                        }}
                      >
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* VERIFY BUTTON */}
                  <motion.button
                    whileHover={
                      !isLoading && isComplete
                        ? { scale: 1.01 }
                        : {}
                    }
                    whileTap={
                      !isLoading && isComplete
                        ? { scale: 0.98 }
                        : {}
                    }
                    type="submit"
                    disabled={
                      isLoading || !isComplete
                    }
                    className="
                      w-full
                      mt-6
                      py-3.5
                      px-5
                      rounded-xl
                      text-white
                      font-semibold
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition-all
                    "
                    style={{
                      background:
                        isLoading || !isComplete
                          ? "#9CA3AF"
                          : "linear-gradient(135deg, #1B5E20, #22C55E)",
                      boxShadow:
                        isLoading || !isComplete
                          ? "none"
                          : "0 8px 20px rgba(34,197,94,0.18)",
                      cursor:
                        isLoading || !isComplete
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="
                            w-4
                            h-4
                            border-2
                            border-white/40
                            border-t-white
                            rounded-full
                            animate-spin
                          "
                        />

                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Verify OTP
                      </>
                    )}
                  </motion.button>

                  {/* RESEND */}
                  <div className="mt-6">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={
                          timer > 0 || isLoading
                        }
                        className="
                          flex
                          items-center
                          gap-2
                          text-sm
                          font-semibold
                        "
                        style={{
                          color:
                            timer > 0 || isLoading
                              ? LightColors.textMuted
                              : LightColors.primary,
                          cursor:
                            timer > 0 || isLoading
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <RefreshCw size={15} />

                        {timer > 0
                          ? `Resend OTP in ${formattedTimer}`
                          : "Resend OTP"}
                      </button>
                    </div>

                    {/* PROGRESS BAR */}
                    <div
                      className="mt-3 h-1 rounded-full overflow-hidden"
                      style={{
                        background: "#e5e7eb",
                      }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        animate={{
                          width: `${progressPercentage}%`,
                        }}
                        transition={{
                          duration: 0.4,
                        }}
                        style={{
                          background:
                            getProgressColor(),
                        }}
                      />
                    </div>

                    <p
                      className="text-center text-xs mt-2"
                      style={{
                        color: LightColors.textMuted,
                      }}
                    >
                      {timer > 0
                        ? "You can request another code when the timer ends."
                        : "Didn't receive the code? Request a new one."}
                    </p>
                  </div>

                  {/* BACK */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/forgot-password")
                    }
                    className="
                      w-full
                      mt-6
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      font-medium
                    "
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to Forgot Password
                  </button>
                </form>

                {/* SECURITY FOOTER */}
                <div
                  className="
                    mt-7
                    pt-5
                    border-t
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                  style={{
                    borderColor: LightColors.divider,
                    color: LightColors.textMuted,
                  }}
                >
                  <LockKeyhole size={14} />

                  <span className="text-xs">
                    Your verification is securely encrypted
                  </span>
                </div>
              </div>

              {/* COPYRIGHT */}
              <p
                className="text-center text-xs mt-5"
                style={{
                  color: LightColors.textMuted,
                }}
              >
                © {new Date().getFullYear()} GuidEd · Our Lady of the Holy
                Rosary School - General Trias Campus
              </p>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordOTPPage;