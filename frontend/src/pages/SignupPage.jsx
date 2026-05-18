import React, { useState } from "react";
import { motion } from "framer-motion";

import {
  User,
  Mail,
  Lock,
  Loader2,
  Camera,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Input from "../components/Input";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
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
   SIGNUP PAGE
========================================================= */

const SignupPage = () => {
  const navigate = useNavigate();

  /* =========================================================
     STATES
  ========================================================= */

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");

  const [accountType, setAccountType] = useState("");

  const [localError, setLocalError] = useState("");

  /* =========================================================
     STORE
  ========================================================= */

  const {
    signup,
    verifyOTP,
    otpRequired,
    setOtpRequired,
    error,
    isLoading,
  } = useAuthStore();

  /* =========================================================
     PHOTO
  ========================================================= */

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];

    setProfilePhoto(file);

    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  /* =========================================================
     SIGNUP
  ========================================================= */

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !studentId ||
      !password ||
      !confirmPassword ||
      !grade ||
      !gender ||
      !accountType
    ) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      setLocalError("");

      const formData = new FormData();

      formData.append("firstName", firstName);
      formData.append("middleName", middleName);
      formData.append("lastName", lastName);

      formData.append("email", email);

      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      formData.append("studentId", studentId);
      formData.append("grade", grade);
      formData.append("gender", gender);

      const role =
        accountType === "Teacher"
          ? "teacher"
          : "student";

      formData.append("role", role);

      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      }

      await signup(formData);

      toast.success("OTP sent to your email!");
    } catch (err) {
      setLocalError(
        err.response?.data?.message || err.message
      );
    }
  };

  /* =========================================================
     OTP
  ========================================================= */

  const handleVerifyOTP = async (otp) => {
    try {
      await verifyOTP(otp);

      setOtpRequired(false);

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "OTP verification failed"
      );
    }
  };

  if (otpRequired) {
    return (
      <EmailVerificationPage
        onVerify={handleVerifyOTP}
        title="Enter OTP to Complete Signup"
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
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at top left, rgba(27,94,32,0.08), transparent 25%),
              radial-gradient(circle at bottom right, rgba(34,197,94,0.10), transparent 25%)
            `,
          }}
        />

        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
          }}
          className="absolute -top-52 -left-52 w-[700px] h-[700px] rounded-full blur-3xl opacity-10"
          style={{
            background: LightColors.primary,
          }}
        />

        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
          }}
          className="absolute bottom-[-250px] right-[-250px] w-[750px] h-[750px] rounded-full blur-3xl opacity-10"
          style={{
            background: "#22C55E",
          }}
        />
      </div>

      {/* =========================================================
          NAVBAR
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
                  REPLACE WITH CLIENT SCHOOL LOGO

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
              Secure Registration Portal
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
              LEFT CONTENT
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
            className="flex flex-col justify-center px-8 lg:px-20 py-16"
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
                Secure Student Registration
              </span>
            </div>

            {/* Hero */}
            <div className="mt-10">
              <h1
                className="text-6xl lg:text-7xl font-black leading-[1.02]"
                style={{
                  color: LightColors.textPrimary,
                }}
              >
                Join The
                <br />

                <span
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Future
                </span>

                <br />
                Of Campus Safety.
              </h1>

              <p
                className="mt-8 text-lg leading-relaxed max-w-2xl"
                style={{
                  color: LightColors.textSecondary,
                }}
              >
                Create your GuidEd account and gain access to
                a secure, modern campus safety ecosystem built
                for students, teachers, and administrators.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-5 mt-12 max-w-2xl">
              {[
                "AI-Powered Case Monitoring",
                "Secure Account Authentication",
                "Real-Time Incident Reports",
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-5 mt-14 max-w-xl">
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
                  AI Security
                </p>
              </div>

              <div>
                <h2
                  className="text-4xl font-black"
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Safe
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
                  Modern
                </h2>

                <p
                  className="text-sm mt-2"
                  style={{
                    color: LightColors.textSecondary,
                  }}
                >
                  Dashboard
                </p>
              </div>
            </div>
          </motion.div>

          {/* =========================================================
              SIGNUP CARD
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
            className="flex items-center justify-center px-8 lg:px-20 py-16"
          >
            <div
              className="w-full max-w-2xl rounded-[40px] overflow-hidden border"
              style={{
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(22px)",
                borderColor: "rgba(255,255,255,0.4)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.08)",
              }}
            >
              {/* Accent */}
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
                {/* Header */}
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
                    Create Account
                  </h2>

                  <p
                    className="mt-4 text-base max-w-lg leading-relaxed"
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Register your account to access GuidEd’s
                    secure campus safety management platform.
                  </p>
                </div>

                {/* FORM */}
                <form
                  onSubmit={handleSignUp}
                  encType="multipart/form-data"
                  className="mt-12 space-y-6"
                >
                  {/* Account Type */}
                  <div>
                    <label
                      className="block mb-3 text-sm font-bold"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Account Type
                    </label>

                    <select
                      value={accountType}
                      onChange={(e) =>
                        setAccountType(e.target.value)
                      }
                      required
                      className="w-full h-14 px-5 rounded-2xl border bg-white outline-none transition-all"
                      style={{
                        borderColor: LightColors.border,
                        color: LightColors.textPrimary,
                      }}
                    >
                      <option value="">
                        Select Account Type
                      </option>

                      <option value="Student">
                        Student
                      </option>

                      <option value="Teacher">
                        Teacher
                      </option>
                    </select>
                  </div>

                  {/* Names */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input
                      icon={User}
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) =>
                        setFirstName(e.target.value)
                      }
                    />

                    <Input
                      icon={User}
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) =>
                        setLastName(e.target.value)
                      }
                    />
                  </div>

                  {/* Middle */}
                  <Input
                    icon={User}
                    type="text"
                    placeholder="Middle Name (Optional)"
                    value={middleName}
                    onChange={(e) =>
                      setMiddleName(e.target.value)
                    }
                  />

                  {/* Email */}
                  <Input
                    icon={Mail}
                    type="email"
                    placeholder="Institutional Email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />

                  {/* Student */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input
                      icon={User}
                      type="text"
                      placeholder="Student ID"
                      value={studentId}
                      onChange={(e) =>
                        setStudentId(e.target.value)
                      }
                    />

                    <Input
                      icon={User}
                      type="text"
                      placeholder="Grade / Year"
                      value={grade}
                      onChange={(e) =>
                        setGrade(e.target.value)
                      }
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label
                      className="block mb-3 text-sm font-bold"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Gender
                    </label>

                    <select
                      value={gender}
                      onChange={(e) =>
                        setGender(e.target.value)
                      }
                      required
                      className="w-full h-14 px-5 rounded-2xl border bg-white outline-none transition-all"
                      style={{
                        borderColor: LightColors.border,
                        color: LightColors.textPrimary,
                      }}
                    >
                      <option value="">
                        Select Gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>

                  {/* Passwords */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input
                      icon={Lock}
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                    />

                    <Input
                      icon={Lock}
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {/* Strength */}
                  <PasswordStrengthMeter
                    password={password}
                  />

                  {/* Photo */}
                  <div>
                    <label
                      className="block mb-3 text-sm font-bold"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Profile Photo (Optional)
                    </label>

                    <label
                      className="w-full min-h-[140px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all bg-white"
                      style={{
                        borderColor: LightColors.border,
                      }}
                    >
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-28 h-28 object-cover rounded-full border"
                          style={{
                            borderColor:
                              LightColors.primary,
                          }}
                        />
                      ) : (
                        <>
                          <Camera
                            className="w-10 h-10 mb-3"
                            style={{
                              color:
                                LightColors.primary,
                            }}
                          />

                          <p
                            className="font-semibold"
                            style={{
                              color:
                                LightColors.textPrimary,
                            }}
                          >
                            Upload Profile Photo
                          </p>

                          <p
                            className="text-sm mt-1"
                            style={{
                              color:
                                LightColors.textSecondary,
                            }}
                          >
                            PNG, JPG or JPEG
                          </p>
                        </>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Error */}
                  {(localError || error) && (
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
                      {localError || error}
                    </motion.div>
                  )}

                  {/* Submit */}
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
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Footer */}
                <div className="mt-10 text-center">
                  <p
                    className="text-sm"
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Already have an account?{" "}
                    <Link
                      to={"/login"}
                      className="font-bold hover:underline"
                      style={{
                        color: LightColors.primary,
                      }}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* Bottom */}
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

export default SignupPage;