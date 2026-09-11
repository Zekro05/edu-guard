import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Check,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
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

/*
|--------------------------------------------------------------------------
| Common weak passwords
|--------------------------------------------------------------------------
| These are intentionally blocked even if they technically satisfy
| some of the character requirements.
*/
const COMMON_WEAK_PASSWORDS = [
  "password",
  "password1",
  "password123",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "00000000",
  "abcdefgh",
  "abcd1234",
  "letmein",
  "welcome",
  "welcome1",
  "admin",
  "admin123",
  "iloveyou",
  "monkey",
  "dragon",
  "football",
  "baseball",
];

const NewPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [localError, setLocalError] = useState("");

  const { resetPassword, isLoading } = useAuthStore();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Password validation
  |--------------------------------------------------------------------------
  */
  const passwordValidation = useMemo(() => {
    const normalizedPassword = newPassword.toLowerCase();

    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    const isCommonPassword = COMMON_WEAK_PASSWORDS.includes(
      normalizedPassword
    );

    /*
     * Also reject simple repeated/sequential patterns.
     * Examples:
     * 11111111
     * 12345678
     * abcdefgh
     */
    const isRepeatedCharacter = /^(.)(\1)+$/.test(newPassword);

    const isSequentialPattern =
      /^(?:12345678|23456789|34567890|abcdefgh|bcdefghi|qwertyui)$/i.test(
        newPassword
      );

    const isValid =
      hasMinLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecial &&
      !isCommonPassword &&
      !isRepeatedCharacter &&
      !isSequentialPattern;

    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isCommonPassword,
      isRepeatedCharacter,
      isSequentialPattern,
      isValid,
    };
  }, [newPassword]);

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const canSubmit =
    passwordValidation.isValid &&
    passwordsMatch &&
    !isLoading;

  /*
  |--------------------------------------------------------------------------
  | Input handlers
  |--------------------------------------------------------------------------
  */
  const handleNewPasswordChange = (event) => {
    const value = event.target.value;

    setNewPassword(value);

    if (localError) {
      setLocalError("");
    }
  };

  const handleConfirmPasswordChange = (event) => {
    const value = event.target.value;

    setConfirmPassword(value);

    if (localError) {
      setLocalError("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLocalError("");

    /*
     * Required fields
     */
    if (!newPassword || !confirmPassword) {
      setLocalError("Please enter and confirm your new password.");
      return;
    }

    /*
     * Strong password validation
     */
    if (!passwordValidation.isValid) {
      if (!passwordValidation.hasMinLength) {
        setLocalError(
          "Password must contain at least 8 characters."
        );
      } else if (!passwordValidation.hasUppercase) {
        setLocalError(
          "Password must contain at least one uppercase letter."
        );
      } else if (!passwordValidation.hasLowercase) {
        setLocalError(
          "Password must contain at least one lowercase letter."
        );
      } else if (!passwordValidation.hasNumber) {
        setLocalError(
          "Password must contain at least one number."
        );
      } else if (!passwordValidation.hasSpecial) {
        setLocalError(
          "Password must contain at least one special character."
        );
      } else if (passwordValidation.isCommonPassword) {
        setLocalError(
          "This password is too common. Please choose a stronger password."
        );
      } else if (passwordValidation.isRepeatedCharacter) {
        setLocalError(
          "Password cannot contain only repeated characters."
        );
      } else if (passwordValidation.isSequentialPattern) {
        setLocalError(
          "Password is too predictable. Please choose a stronger password."
        );
      }

      return;
    }

    /*
     * Confirm password
     */
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword(newPassword);

      toast.success(
        "Password reset successful! You can now login."
      );

      navigate("/login");
    } catch (err) {
      console.error("Password reset error:", err);

      setLocalError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reset password. Please try again."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Password requirement component
  |--------------------------------------------------------------------------
  */
  const Requirement = ({ valid, children }) => (
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: valid ? "#dcfce7" : "#f3f4f6",
          color: valid ? LightColors.primary : LightColors.textMuted,
        }}
      >
        {valid ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
      </div>

      <span
        className="text-xs sm:text-sm"
        style={{
          color: valid
            ? "#166534"
            : LightColors.textSecondary,
        }}
      >
        {children}
      </span>
    </div>
  );

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: LightColors.background,
        color: LightColors.textPrimary,
      }}
    >
      {/* =========================================================
          BACKGROUND DECORATION
      ========================================================== */}
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

      {/* =========================================================
          HEADER
      ========================================================== */}
      <header className="relative z-10 px-5 sm:px-8 lg:px-12 pt-6">
        <div className="w-full flex items-center justify-between">
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

      {/* =========================================================
          MAIN
      ========================================================== */}
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
          {/* =====================================================
              LEFT SIDE
          ====================================================== */}
          <motion.section
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="hidden lg:flex items-center"
          >
            <div className="w-full max-w-xl">
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
                  Secure Password Recovery
                </span>
              </div>

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
                Create a
                <span
                  className="block"
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Strong Password.
                </span>
              </h2>

              <p
                className="mt-5 text-base xl:text-lg leading-7 max-w-lg"
                style={{
                  color: LightColors.textSecondary,
                }}
              >
                Protect your GuidEd account with a strong password that
                is difficult to guess and easy for you to remember.
              </p>

              {/* Feature cards */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                {[
                  {
                    icon: LockKeyhole,
                    title: "Protected",
                    description: "Keep your account secure",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Strong",
                    description: "Better password protection",
                  },
                  {
                    icon: Check,
                    title: "Validated",
                    description: "Password requirements checked",
                  },
                  {
                    icon: AlertCircle,
                    title: "Private",
                    description: "Your credentials stay protected",
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

              {/* Security note */}
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
                  Use a password that is unique to your GuidEd account.
                  Avoid simple passwords such as <strong>qwerty</strong>,
                  <strong> password</strong>, or predictable number sequences.
                </p>
              </div>
            </div>
          </motion.section>

          {/* =====================================================
              RIGHT SIDE
          ====================================================== */}
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
                {/* Green top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background:
                      "linear-gradient(90deg, #1B5E20, #22C55E, #10B981)",
                  }}
                />

                {/* =================================================
                    CARD HEADER
                ================================================== */}
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
                    Set New Password
                  </h2>

                  <p
                    className="mt-2 text-sm sm:text-base leading-6"
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Create a strong new password for your GuidEd account.
                  </p>
                </div>

                {/* =================================================
                    FORM
                ================================================== */}
                <form
                  onSubmit={handleSubmit}
                  className="mt-7"
                >
                  {/* New password */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      New Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                          color: LightColors.textMuted,
                        }}
                      />

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        className="
                          w-full
                          h-12
                          pl-11
                          pr-12
                          rounded-xl
                          border
                          outline-none
                          transition-all
                          text-sm
                        "
                        style={{
                          color: LightColors.textPrimary,
                          background: LightColors.elevated,
                          borderColor:
                            newPassword.length > 0
                              ? passwordValidation.isValid
                                ? "#86efac"
                                : "#fca5a5"
                              : LightColors.border,
                        }}
                        onFocus={(event) => {
                          event.currentTarget.style.borderColor =
                            LightColors.success;

                          event.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(34,197,94,0.10)";
                        }}
                        onBlur={(event) => {
                          event.currentTarget.style.borderColor =
                            newPassword.length > 0
                              ? passwordValidation.isValid
                                ? "#86efac"
                                : "#fca5a5"
                              : LightColors.border;

                          event.currentTarget.style.boxShadow =
                            "none";
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword(
                            (previous) => !previous
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg"
                        style={{
                          color: LightColors.textMuted,
                        }}
                        aria-label={
                          showNewPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password strength meter */}
                  <div className="mt-3">
                    <PasswordStrengthMeter
                      password={newPassword}
                    />
                  </div>

                  {/* Requirements */}
                  {newPassword.length > 0 && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      className="mt-4 p-4 rounded-xl border"
                      style={{
                        background: "#f9fafb",
                        borderColor: LightColors.divider,
                      }}
                    >
                      <p
                        className="text-xs font-semibold mb-3"
                        style={{
                          color: LightColors.textLabel,
                        }}
                      >
                        Password requirements
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Requirement
                          valid={
                            passwordValidation.hasMinLength
                          }
                        >
                          At least 8 characters
                        </Requirement>

                        <Requirement
                          valid={
                            passwordValidation.hasUppercase
                          }
                        >
                          One uppercase letter
                        </Requirement>

                        <Requirement
                          valid={
                            passwordValidation.hasLowercase
                          }
                        >
                          One lowercase letter
                        </Requirement>

                        <Requirement
                          valid={
                            passwordValidation.hasNumber
                          }
                        >
                          One number
                        </Requirement>

                        <Requirement
                          valid={
                            passwordValidation.hasSpecial
                          }
                        >
                          One special character
                        </Requirement>

                        <Requirement
                          valid={
                            !passwordValidation.isCommonPassword &&
                            !passwordValidation.isRepeatedCharacter &&
                            !passwordValidation.isSequentialPattern
                          }
                        >
                          Not a common or predictable password
                        </Requirement>
                      </div>
                    </motion.div>
                  )}

                  {/* Confirm password */}
                  <div className="mt-5">
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                          color: LightColors.textMuted,
                        }}
                      />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        className="
                          w-full
                          h-12
                          pl-11
                          pr-12
                          rounded-xl
                          border
                          outline-none
                          transition-all
                          text-sm
                        "
                        style={{
                          color: LightColors.textPrimary,
                          background: LightColors.elevated,
                          borderColor:
                            confirmPassword.length > 0
                              ? passwordsMatch
                                ? "#86efac"
                                : "#fca5a5"
                              : LightColors.border,
                        }}
                        onFocus={(event) => {
                          event.currentTarget.style.borderColor =
                            LightColors.success;

                          event.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(34,197,94,0.10)";
                        }}
                        onBlur={(event) => {
                          event.currentTarget.style.borderColor =
                            confirmPassword.length > 0
                              ? passwordsMatch
                                ? "#86efac"
                                : "#fca5a5"
                              : LightColors.border;

                          event.currentTarget.style.boxShadow =
                            "none";
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (previous) => !previous
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg"
                        style={{
                          color: LightColors.textMuted,
                        }}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        {passwordsMatch ? (
                          <>
                            <Check
                              size={14}
                              style={{
                                color: LightColors.success,
                              }}
                            />

                            <span
                              className="text-xs font-medium"
                              style={{
                                color: "#166534",
                              }}
                            >
                              Passwords match
                            </span>
                          </>
                        ) : (
                          <>
                            <X
                              size={14}
                              style={{
                                color: LightColors.danger,
                              }}
                            />

                            <span
                              className="text-xs font-medium"
                              style={{
                                color: "#b91c1c",
                              }}
                            >
                              Passwords do not match
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {localError && (
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
                        <AlertCircle size={13} />
                      </div>

                      <p
                        className="text-sm leading-5"
                        style={{
                          color: "#b91c1c",
                        }}
                      >
                        {localError}
                      </p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button
                    whileHover={
                      canSubmit
                        ? { scale: 1.01 }
                        : {}
                    }
                    whileTap={
                      canSubmit
                        ? { scale: 0.98 }
                        : {}
                    }
                    type="submit"
                    disabled={!canSubmit}
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
                      background: canSubmit
                        ? "linear-gradient(135deg, #1B5E20, #22C55E)"
                        : "#9CA3AF",
                      boxShadow: canSubmit
                        ? "0 8px 20px rgba(34,197,94,0.18)"
                        : "none",
                      cursor: canSubmit
                        ? "pointer"
                        : "not-allowed",
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
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Reset Password
                      </>
                    )}
                  </motion.button>

                  {/* Back */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/login")
                    }
                    className="
                      w-full
                      mt-5
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
                    Back to Login
                  </button>
                </form>

                {/* Security footer */}
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
                    Your new password is securely protected
                  </span>
                </div>
              </div>

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

export default NewPasswordPage;

