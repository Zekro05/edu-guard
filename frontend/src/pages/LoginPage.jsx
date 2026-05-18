import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";
import EmailVerificationPage from "./EmailVerificationPage";

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
   LOGIN PAGE
========================================================= */

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const {
    login,
    verifyLoginOTP,
    otpRequired,
    setOtpRequired,
    isLoading,
    error,
  } = useAuthStore();

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  /* =========================================================
     OTP
  ========================================================= */

  const handleVerifyOTP = async (otp) => {
    try {
      await verifyLoginOTP(otp);

      toast.success("Login successful!");

      setOtpRequired(false);

      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    }
  };

  if (otpRequired) {
    return (
      <EmailVerificationPage
        onVerify={handleVerifyOTP}
        title="Enter OTP to Login"
      />
    );
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: LightColors.background,
      }}
    >
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 overflow-hidden">
        {/* Main Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at top left, rgba(27,94,32,0.10), transparent 25%),
              radial-gradient(circle at bottom right, rgba(34,197,94,0.10), transparent 25%)
            `,
          }}
        />

        {/* Animated Blobs */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
          }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{
            background: LightColors.primary,
          }}
        />

        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
          }}
          className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{
            background: "#22C55E",
          }}
        />
      </div>

      {/* =========================================================
          TOP NAVBAR
      ========================================================= */}

      <header className="relative z-20 w-full">
        <div className="w-full px-8 lg:px-16 py-6 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            {/* SCHOOL LOGO */}
            <div
              className="w-16 h-16 rounded-3xl bg-white border shadow-lg overflow-hidden flex items-center justify-center"
              style={{
                borderColor: LightColors.border,
              }}
            >
              {/* =========================================================
                  REPLACE THIS WITH CLIENT SCHOOL LOGO
                  
                  Example:
                  
                  <img
                    src="/school-logo.png"
                    alt="School Logo"
                    className="w-full h-full object-cover"
                  />
              ========================================================= */}

              <GraduationCap
                className="w-8 h-8"
                style={{
                  color: LightColors.primary,
                }}
              />
            </div>

            <div>
              <h1
                className="text-3xl font-black tracking-tight"
                style={{
                  color: LightColors.textPrimary,
                }}
              >
                GuidEd
              </h1>

              <p
                className="text-sm font-medium"
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
              className="px-5 py-2 rounded-2xl bg-white border shadow-sm text-sm font-semibold"
              style={{
                borderColor: LightColors.border,
                color: LightColors.primary,
              }}
            >
              Production Ready UI
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN SECTION
      ========================================================= */}

      <main className="relative z-10 w-full min-h-[calc(100vh-100px)]">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-100px)]">
          {/* =========================================================
              LEFT SIDE
          ========================================================= */}

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
            className="flex flex-col justify-center px-8 lg:px-20 py-14"
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 w-fit px-5 py-2 rounded-full border bg-white shadow-sm"
              style={{
                borderColor: LightColors.border,
              }}
            >
              <ShieldCheck
                className="w-4 h-4"
                style={{
                  color: LightColors.primary,
                }}
              />

              <span
                className="text-sm font-semibold"
                style={{
                  color: LightColors.primary,
                }}
              >
                Smart Campus Protection
              </span>
            </div>

            {/* Hero Text */}
            <div className="mt-10">
              <h1
                className="text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight"
                style={{
                  color: LightColors.textPrimary,
                }}
              >
                Secure
                <br />

                <span
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Modern
                </span>

                <br />
                Campus Safety.
              </h1>

              <p
                className="mt-8 text-lg leading-relaxed max-w-2xl"
                style={{
                  color: LightColors.textSecondary,
                }}
              >
                A next-generation campus incident reporting and management
                platform designed for educational institutions. Streamline
                security operations, monitor reports in real-time, and manage
                campus incidents through one centralized system.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-5 mt-12 max-w-2xl">
              {[
                "Real-time Incident Monitoring",
                "AI-Powered Case Management",
                "Secure Authentication System",
                "Centralized Campus Dashboard",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white border rounded-2xl px-5 py-4 shadow-sm"
                  style={{
                    borderColor: LightColors.border,
                  }}
                >
                  <CheckCircle2
                    className="w-5 h-5"
                    style={{
                      color: LightColors.primary,
                    }}
                  />

                  <span
                    className="font-medium text-sm"
                    style={{
                      color: LightColors.textPrimary,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-3 gap-5 mt-14 max-w-xl">
              <div>
                <h2
                  className="text-4xl font-black"
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  24/7
                </h2>

                <p
                  className="text-sm mt-2"
                  style={{
                    color: LightColors.textSecondary,
                  }}
                >
                  Monitoring
                </p>
              </div>

              <div>
                <h2
                  className="text-4xl font-black"
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Secure
                </h2>

                <p
                  className="text-sm mt-2"
                  style={{
                    color: LightColors.textSecondary,
                  }}
                >
                  Authentication
                </p>
              </div>

              <div>
                <h2
                  className="text-4xl font-black"
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Smart
                </h2>

                <p
                  className="text-sm mt-2"
                  style={{
                    color: LightColors.textSecondary,
                  }}
                >
                  AI Features
                </p>
              </div>
            </div>
          </motion.div>

          {/* =========================================================
              RIGHT SIDE LOGIN
          ========================================================= */}

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
            className="flex items-center justify-center px-8 lg:px-20 py-14"
          >
            <div
              className="w-full max-w-xl rounded-[40px] overflow-hidden border"
              style={{
                background: "rgba(255,255,255,0.80)",
                backdropFilter: "blur(22px)",
                borderColor: "rgba(255,255,255,0.4)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.08)",
              }}
            >
              {/* Accent Top */}
              <div
                className="h-2 w-full"
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

              <div className="p-10 lg:p-12">
                {/* LOGO */}
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-28 h-28 rounded-[32px] bg-white border shadow-lg overflow-hidden flex items-center justify-center"
                    style={{
                      borderColor: LightColors.border,
                    }}
                  >
                    {/* =========================================================
                        REPLACE WITH CLIENT SCHOOL LOGO
                    ========================================================= */}

                    <GraduationCap
                      className="w-12 h-12"
                      style={{
                        color: LightColors.primary,
                      }}
                    />
                  </div>

                  <h2
                    className="mt-7 text-5xl font-black tracking-tight"
                    style={{
                      color: LightColors.textPrimary,
                    }}
                  >
                    Welcome Back
                  </h2>

                  <p
                    className="mt-4 text-base max-w-md leading-relaxed"
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Login to access your GuidEd administration dashboard and
                    manage campus safety operations securely.
                  </p>
                </div>

                {/* FORM */}
                <form
                  onSubmit={handleLogin}
                  className="mt-12 space-y-7"
                >
                  {/* EMAIL */}
                  <div>
                    <label
                      className="block mb-3 text-sm font-bold"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Email Address
                    </label>

                    <Input
                      icon={Mail}
                      type="email"
                      placeholder="Enter your institutional email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label
                      className="block mb-3 text-sm font-bold"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Password
                    </label>

                    <Input
                      icon={Lock}
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
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
                      className="rounded-2xl border px-4 py-3 text-sm font-medium"
                      style={{
                        color: LightColors.danger,
                        background: "#fef2f2",
                        borderColor: "#fecaca",
                      }}
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* FORGOT */}
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold hover:underline"
                      style={{
                        color: LightColors.primary,
                      }}
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* LOGIN BUTTON */}
                  <motion.button
                    whileHover={{
                      scale: 1.015,
                    }}
                    whileTap={{
                      scale: 0.985,
                    }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 rounded-2xl font-bold text-lg text-white shadow-xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Login to Dashboard
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* FOOTER */}
                <div className="mt-10 text-center">
                  <p
                    className="text-sm"
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/signup"
                      className="font-bold hover:underline"
                      style={{
                        color: LightColors.primary,
                      }}
                    >
                      Create Account
                    </Link>
                  </p>
                </div>

                {/* COPYRIGHT */}
                <div
                  className="mt-10 pt-6 border-t text-center"
                  style={{
                    borderColor: LightColors.divider,
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-[0.2em]"
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

export default LoginPage;