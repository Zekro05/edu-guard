import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";

/* =========================================================
   THEME
========================================================= */

export const LightColors = {
  primary: "#1B5E20",
  primaryLight: "#1B5E20",
  primarySoft: "#f0fdf4",

  background: "#F8FAFC",
  surface: "#ffffff",
  card: "#ffffff",
  elevated: "#f9fafb",

  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textLabel: "#1f2937",
  textMuted: "#9CA3AF",

  textInverse: "#ffffff",
  textSoft: "#e8f5e9",

  border: "#d1d5db",
  divider: "#e5e7eb",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#DC2626",

  shadow: "#000000",
  overlay: "rgba(0,0,0,0.2)",
};

/* =========================================================
   FORGOT PASSWORD PAGE
========================================================= */

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");

  const { forgotPassword, isLoading } = useAuthStore();

  const navigate = useNavigate();

  /* =========================================================
     SEND OTP
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      await forgotPassword(email);

      localStorage.setItem("resetEmail", email);

      toast.success("OTP sent to your email!");

      navigate("/reset-password");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to send OTP"
      );
    }
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{
        background: LightColors.background,
      }}
    >
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        {/* Main Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                circle at top left,
                rgba(27,94,32,0.10),
                transparent 25%
              ),
              radial-gradient(
                circle at bottom right,
                rgba(34,197,94,0.10),
                transparent 25%
              )
            `,
          }}
        />

        {/* Animated Blob - Top Left */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
          }}
          className="
            absolute
            -top-40
            -left-40
            w-[350px]
            h-[350px]
            sm:w-[500px]
            sm:h-[500px]
            rounded-full
            blur-3xl
            opacity-10
          "
          style={{
            background: LightColors.primary,
          }}
        />

        {/* Animated Blob - Bottom Right */}
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
          }}
          className="
            absolute
            bottom-[-150px]
            right-[-150px]
            sm:bottom-[-200px]
            sm:right-[-200px]
            w-[400px]
            h-[400px]
            sm:w-[600px]
            sm:h-[600px]
            rounded-full
            blur-3xl
            opacity-10
          "
          style={{
            background: "#22C55E",
          }}
        />
      </div>

      {/* =========================================================
          TOP NAVBAR
      ========================================================= */}

      <header className="relative z-20 w-full">
        <div
          className="
            w-full
            px-5
            sm:px-8
            lg:px-16
            py-4
            sm:py-6
            flex
            items-center
            justify-between
          "
        >
          {/* LEFT */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* SCHOOL LOGO */}
            <div
              className="
                w-12
                h-12
                sm:w-16
                sm:h-16
                rounded-2xl
                sm:rounded-3xl
                bg-white
                border
                shadow-lg
                overflow-hidden
                flex
                items-center
                justify-center
                shrink-0
              "
              style={{
                borderColor: LightColors.border,
              }}
            >
              <img
                src="/school-logo.webp"
                alt="School Logo"
                className="
                  w-full
                  h-full
                  object-contain
                  p-2
                "
              />
            </div>

            {/* BRAND */}
            <div>
              <h1
                className="
                  text-xl
                  sm:text-2xl
                  lg:text-3xl
                  font-black
                  tracking-tight
                "
                style={{
                  color: LightColors.textPrimary,
                }}
              >
                GuidEd
              </h1>

              <p
                className="
                  hidden
                  sm:block
                  text-xs
                  lg:text-sm
                  font-medium
                "
                style={{
                  color: LightColors.textSecondary,
                }}
              >
                Campus Security Management Platform
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hidden md:flex items-center gap-4">
            <div
              className="
                px-5
                py-2
                rounded-2xl
                bg-white
                border
                shadow-sm
                text-sm
                font-semibold
              "
              style={{
                borderColor: LightColors.border,
                color: LightColors.primary,
              }}
            >
              Secure Account Recovery
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN SECTION
      ========================================================= */}

      <main
        className="
          relative
          z-10
          w-full
          px-4
          sm:px-6
          lg:px-0
          pb-10
          sm:pb-14
        "
      >
        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            min-h-0
            lg:min-h-[calc(100vh-110px)]
          "
        >

          {/* =====================================================
              LEFT SIDE
          ===================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="
              flex
              flex-col
              justify-center
              px-2
              sm:px-4
              lg:px-20
              py-8
              sm:py-12
              lg:py-14
            "
          >
            {/* Badge */}
            <div
              className="
                inline-flex
                items-center
                gap-2
                w-fit
                px-4
                sm:px-5
                py-2
                rounded-full
                border
                bg-white
                shadow-sm
              "
              style={{
                borderColor: LightColors.border,
              }}
            >
              <ShieldCheck
                className="w-4 h-4 shrink-0"
                style={{
                  color: LightColors.primary,
                }}
              />

              <span
                className="text-xs sm:text-sm font-semibold"
                style={{
                  color: LightColors.primary,
                }}
              >
                Secure Account Recovery
              </span>
            </div>

            {/* Hero */}
            <div className="mt-7 sm:mt-10">

              <h1
                className="
                  text-4xl
                  sm:text-5xl
                  md:text-6xl
                  lg:text-7xl
                  font-black
                  leading-[1.05]
                  tracking-tight
                "
                style={{
                  color: LightColors.textPrimary,
                }}
              >
                Get Back
                <br />

                <span
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Into Your
                </span>

                <br />

                Account.
              </h1>

              <p
                className="
                  mt-5
                  sm:mt-8
                  text-base
                  sm:text-lg
                  leading-relaxed
                  max-w-2xl
                "
                style={{
                  color: LightColors.textSecondary,
                }}
              >
                Forgot your password? No problem. Verify your registered
                email address and we'll securely guide you through the
                password recovery process.
              </p>
            </div>

            {/* =================================================
                RECOVERY FEATURES
            ================================================= */}

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
                sm:gap-5
                mt-8
                sm:mt-12
                max-w-2xl
              "
            >
              {/* Feature 1 */}
              <div
                className="
                  flex
                  items-center
                  gap-3
                  bg-white
                  border
                  rounded-2xl
                  px-4
                  sm:px-5
                  py-3
                  sm:py-4
                  shadow-sm
                "
                style={{
                  borderColor: LightColors.border,
                }}
              >
                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  style={{
                    background: LightColors.primarySoft,
                  }}
                >
                  <Mail
                    className="w-5 h-5"
                    style={{
                      color: LightColors.primary,
                    }}
                  />
                </div>

                <span
                  className="font-medium text-sm"
                  style={{
                    color: LightColors.textPrimary,
                  }}
                >
                  Email Verification
                </span>
              </div>

              {/* Feature 2 */}
              <div
                className="
                  flex
                  items-center
                  gap-3
                  bg-white
                  border
                  rounded-2xl
                  px-4
                  sm:px-5
                  py-3
                  sm:py-4
                  shadow-sm
                "
                style={{
                  borderColor: LightColors.border,
                }}
              >
                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  style={{
                    background: LightColors.primarySoft,
                  }}
                >
                  <KeyRound
                    className="w-5 h-5"
                    style={{
                      color: LightColors.primary,
                    }}
                  />
                </div>

                <span
                  className="font-medium text-sm"
                  style={{
                    color: LightColors.textPrimary,
                  }}
                >
                  OTP Protection
                </span>
              </div>

              {/* Feature 3 */}
              <div
                className="
                  flex
                  items-center
                  gap-3
                  bg-white
                  border
                  rounded-2xl
                  px-4
                  sm:px-5
                  py-3
                  sm:py-4
                  shadow-sm
                "
                style={{
                  borderColor: LightColors.border,
                }}
              >
                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  style={{
                    background: LightColors.primarySoft,
                  }}
                >
                  <CheckCircle2
                    className="w-5 h-5"
                    style={{
                      color: LightColors.primary,
                    }}
                  />
                </div>

                <span
                  className="font-medium text-sm"
                  style={{
                    color: LightColors.textPrimary,
                  }}
                >
                  Secure Reset
                </span>
              </div>

              {/* Feature 4 */}
              <div
                className="
                  flex
                  items-center
                  gap-3
                  bg-white
                  border
                  rounded-2xl
                  px-4
                  sm:px-5
                  py-3
                  sm:py-4
                  shadow-sm
                "
                style={{
                  borderColor: LightColors.border,
                }}
              >
                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  style={{
                    background: LightColors.primarySoft,
                  }}
                >
                  <ShieldCheck
                    className="w-5 h-5"
                    style={{
                      color: LightColors.primary,
                    }}
                  />
                </div>

                <span
                  className="font-medium text-sm"
                  style={{
                    color: LightColors.textPrimary,
                  }}
                >
                  Account Security
                </span>
              </div>
            </div>

            {/* Bottom Info */}
            <div
              className="
                flex
                items-center
                gap-3
                mt-9
                sm:mt-12
              "
            >
              <ShieldCheck
                className="w-5 h-5 shrink-0"
                style={{
                  color: LightColors.primary,
                }}
              />

              <p
                className="text-sm"
                style={{
                  color: LightColors.textSecondary,
                }}
              >
                Your account information remains protected throughout
                the recovery process.
              </p>
            </div>
          </motion.div>

          {/* =====================================================
              RIGHT SIDE - FORM
          ===================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: 40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="
              flex
              items-center
              justify-center
              px-0
              sm:px-2
              lg:px-20
              py-6
              sm:py-10
              lg:py-14
            "
          >
            <div
              className="
                w-full
                max-w-xl
                rounded-[28px]
                sm:rounded-[36px]
                lg:rounded-[40px]
                overflow-hidden
                border
              "
              style={{
                background: "rgba(255,255,255,0.80)",
                backdropFilter: "blur(22px)",
                borderColor: "rgba(255,255,255,0.4)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.08)",
              }}
            >

              {/* Accent */}
              <div
                className="h-1.5 sm:h-2 w-full"
                style={{
                  background: `
                    linear-gradient(
                      90deg,
                      ${LightColors.primary} 0%,
                      #22C55E 100%
                    )
                  `,
                }}
              />

              <div
                className="
                  p-6
                  sm:p-8
                  md:p-10
                  lg:p-12
                "
              >

                {/* =================================================
                    LOGO
                ================================================= */}

                <div className="flex flex-col items-center text-center">

                  <div
                    className="
                      w-20
                      h-20
                      sm:w-24
                      sm:h-24
                      lg:w-28
                      lg:h-28
                      rounded-[24px]
                      sm:rounded-[28px]
                      lg:rounded-[32px]
                      bg-white
                      border
                      shadow-lg
                      overflow-hidden
                      flex
                      items-center
                      justify-center
                    "
                    style={{
                      borderColor: LightColors.border,
                    }}
                  >
                    <img
                      src="/school-logo.webp"
                      alt="School Logo"
                      className="
                        w-full
                        h-full
                        object-contain
                        p-3
                        sm:p-4
                      "
                    />
                  </div>

                  {/* Title */}
                  <h2
                    className="
                      mt-5
                      sm:mt-7
                      text-3xl
                      sm:text-4xl
                      lg:text-5xl
                      font-black
                      tracking-tight
                    "
                    style={{
                      color: LightColors.textPrimary,
                    }}
                  >
                    Forgot Password?
                  </h2>

                  <p
                    className="
                      mt-3
                      sm:mt-4
                      text-sm
                      sm:text-base
                      max-w-md
                      leading-relaxed
                    "
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Enter your registered email address and we'll send
                    you a one-time password to continue resetting your
                    account.
                  </p>

                </div>

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                  onSubmit={handleSubmit}
                  className="
                    mt-8
                    sm:mt-10
                    lg:mt-12
                    space-y-5
                    sm:space-y-7
                  "
                >

                  {/* EMAIL */}
                  <div>

                    <label
                      htmlFor="email"
                      className="block mb-2 sm:mb-3 text-sm font-bold"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Email Address
                    </label>

                    <Input
                      id="email"
                      icon={Mail}
                      type="email"
                      placeholder="Enter your institutional email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      autoComplete="email"
                    />

                  </div>

                  {/* SEND OTP */}
                  <motion.button
                    whileHover={{
                      scale: 1.015,
                    }}
                    whileTap={{
                      scale: 0.985,
                    }}
                    type="submit"
                    disabled={isLoading}
                    className="
                      w-full
                      h-14
                      sm:h-16
                      rounded-2xl
                      font-bold
                      text-base
                      sm:text-lg
                      text-white
                      shadow-xl
                      flex
                      items-center
                      justify-center
                      gap-3
                      transition-all
                      duration-300
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                    "
                    style={{
                      background: `
                        linear-gradient(
                          135deg,
                          ${LightColors.primary} 0%,
                          #256d2a 100%
                        )
                      `,
                      boxShadow:
                        "0 20px 40px rgba(27,94,32,0.25)",
                    }}
                  >

                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <Mail className="w-5 h-5 shrink-0" />
                      </>
                    )}

                  </motion.button>

                </form>

                {/* =================================================
                    BACK TO LOGIN
                ================================================= */}

                <div
                  className="
                    mt-8
                    sm:mt-10
                    pt-6
                    border-t
                    text-center
                  "
                  style={{
                    borderColor: LightColors.divider,
                  }}
                >
                  <Link
                    to="/login"
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      font-bold
                      hover:underline
                    "
                    style={{
                      color: LightColors.primary,
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>

                {/* =================================================
                    SECURITY NOTE
                ================================================= */}

                <div
                  className="
                    mt-6
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-center
                  "
                >
                  <ShieldCheck
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: LightColors.success,
                    }}
                  />

                  <p
                    className="text-xs"
                    style={{
                      color: LightColors.textMuted,
                    }}
                  >
                    Secure password recovery
                  </p>
                </div>

                {/* COPYRIGHT */}
                <div
                  className="
                    mt-7
                    sm:mt-9
                    pt-5
                    sm:pt-6
                    border-t
                    text-center
                  "
                  style={{
                    borderColor: LightColors.divider,
                  }}
                >
                  <p
                    className="
                      text-[9px]
                      sm:text-xs
                      uppercase
                      tracking-[0.15em]
                      sm:tracking-[0.2em]
                    "
                    style={{
                      color: LightColors.textMuted,
                    }}
                  >
                    GuidEd Campus Security Platform © 2026
                  </p>
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;

