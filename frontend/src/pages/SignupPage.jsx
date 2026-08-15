import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Cropper from "react-easy-crop";

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
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
   CROPPED IMAGE HELPER
========================================================= */

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));

    image.addEventListener("error", (error) => {
      reject(error);
    });

    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");

  const size = Math.max(pixelCrop.width, pixelCrop.height);

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context.");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create cropped image."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.95
    );
  });
};

/* =========================================================
   SIGNUP PAGE
========================================================= */

const SignupPage = () => {
  const navigate = useNavigate();

  /* =========================================================
     FORM STATES
  ========================================================= */

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [grade, setGrade] = useState("");
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");

  const [accountType, setAccountType] = useState("");

  const [showPolicy, setShowPolicy] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const [localError, setLocalError] = useState("");

  /* =========================================================
     CROPPER STATES
  ========================================================= */

  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState(null);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
     CLEANUP PHOTO URL
  ========================================================= */

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      if (cropImage) {
        URL.revokeObjectURL(cropImage);
      }
    };
  }, [photoPreview, cropImage]);

  /* =========================================================
     PHOTO SELECTION
  ========================================================= */

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    /* -----------------------------------------
       Validate image
    ----------------------------------------- */

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      return;
    }

    /* -----------------------------------------
       Validate size
    ----------------------------------------- */

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Image must be smaller than 10MB.");
      return;
    }

    /* -----------------------------------------
       Create temporary image URL
    ----------------------------------------- */

    const imageUrl = URL.createObjectURL(file);

    setCropImage(imageUrl);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setShowCropper(true);

    /* -----------------------------------------
       Reset file input so selecting the same
       photo again still triggers onChange
    ----------------------------------------- */

    e.target.value = "";
  };

  /* =========================================================
     CROP COMPLETE
  ========================================================= */

  const onCropComplete = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  /* =========================================================
     CANCEL CROPPING
  ========================================================= */

  const handleCropCancel = () => {
    setShowCropper(false);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setCroppedAreaPixels(null);

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
  };

  /* =========================================================
     CONFIRM CROPPING
  ========================================================= */

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) {
      toast.error("Please select an image area.");
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(
        cropImage,
        croppedAreaPixels
      );

      const croppedFile = new File(
        [croppedBlob],
        "profile-photo.jpg",
        {
          type: "image/jpeg",
        }
      );

      /* -----------------------------------------
         Create preview
      ----------------------------------------- */

      const previewUrl = URL.createObjectURL(croppedBlob);

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      setProfilePhoto(croppedFile);

      setPhotoPreview(previewUrl);

      /* -----------------------------------------
         Close cropper
      ----------------------------------------- */

      setShowCropper(false);

      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);

      setCroppedAreaPixels(null);

      if (cropImage) {
        URL.revokeObjectURL(cropImage);
      }

      setCropImage(null);

      toast.success("Profile photo cropped successfully!");
    } catch (err) {
      console.error("Crop error:", err);

      toast.error("Failed to crop the image.");
    }
  };

  /* =========================================================
     SIGNUP
  ========================================================= */

  const handleSignUp = async (e) => {
    e.preventDefault();

    /* -----------------------------------------
       Required fields
    ----------------------------------------- */

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !gender ||
      !accountType ||
      (accountType === "Student" &&
        (!studentId || !grade)) ||
      (accountType === "Teacher" &&
        (!employeeId || !department))
    ) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    /* -----------------------------------------
       Password validation
    ----------------------------------------- */

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    /* -----------------------------------------
       Policy validation
    ----------------------------------------- */

    if (!acceptedPolicy) {
      setLocalError(
        "Please read and accept the GuidEd User Policy."
      );
      return;
    }

    try {
      setLocalError("");

      const formData = new FormData();

      /* -----------------------------------------
         Basic information
      ----------------------------------------- */

      formData.append("firstName", firstName);
      formData.append("middleName", middleName);
      formData.append("lastName", lastName);

      formData.append("email", email);

      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      /* -----------------------------------------
         Student / Teacher
      ----------------------------------------- */

      if (accountType === "Student") {
        formData.append("studentId", studentId);
        formData.append("grade", grade);
      } else {
        formData.append("employeeId", employeeId);
        formData.append("department", department);
      }

      /* -----------------------------------------
         Gender
      ----------------------------------------- */

      formData.append("gender", gender);

      /* -----------------------------------------
         Role
      ----------------------------------------- */

      const role =
        accountType === "Teacher"
          ? "teacher"
          : "student";

      formData.append("role", role);

      /* -----------------------------------------
         Profile photo
         IMPORTANT:
         This is now the CROPPED file.
      ----------------------------------------- */

      if (profilePhoto) {
        formData.append(
          "profilePhoto",
          profilePhoto
        );
      }

      /* -----------------------------------------
         Signup
      ----------------------------------------- */

      await signup(formData);

      toast.success("OTP sent to your email!");
    } catch (err) {
      setLocalError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed."
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

  /* =========================================================
     OTP PAGE
  ========================================================= */

  if (otpRequired) {
    return (
      <EmailVerificationPage
        onVerify={handleVerifyOTP}
        title="Enter OTP to Complete Signup"
      />
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{
        background: LightColors.background,
      }}
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                circle at top left,
                rgba(27,94,32,0.08),
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

        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
          }}
          className="
            absolute
            -top-40
            -left-40
            sm:-top-52
            sm:-left-52
            w-[400px]
            h-[400px]
            sm:w-[700px]
            sm:h-[700px]
            rounded-full
            blur-3xl
            opacity-10
          "
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
          className="
            absolute
            bottom-[-150px]
            right-[-150px]
            sm:bottom-[-250px]
            sm:right-[-250px]
            w-[450px]
            h-[450px]
            sm:w-[750px]
            sm:h-[750px]
            rounded-full
            blur-3xl
            opacity-10
          "
          style={{
            background: "#22C55E",
          }}
        />
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="relative z-20 w-full">
        <div
          className="
            w-full
            px-4
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
              <GraduationCap
                className="w-6 h-6 sm:w-8 sm:h-8"
                style={{
                  color: LightColors.primary,
                }}
              />
            </div>

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
              Secure Registration Portal
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        className="
          relative
          z-10
          w-full
          px-3
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
            lg:min-h-[calc(100vh-100px)]
          "
        >
          {/* =================================================
              LEFT CONTENT
          ================================================= */}

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
              lg:py-16
            "
          >
            {/* BADGE */}

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
                Secure Student Registration
              </span>
            </div>

            {/* HERO */}

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
                Create your GuidEd account and gain access
                to a secure, modern campus safety ecosystem
                built for students, teachers, and
                administrators.
              </p>
            </div>

            {/* FEATURES */}

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
              {[
                "AI-Powered Case Monitoring",
                "Secure Account Authentication",
                "Real-Time Incident Reports",
                "Centralized Campus Dashboard",
              ].map((item, index) => (
                <div
                  key={index}
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
                  <CheckCircle2
                    className="w-5 h-5 shrink-0"
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

            {/* STATS */}

            <div
              className="
                grid
                grid-cols-3
                gap-3
                sm:gap-5
                mt-9
                sm:mt-14
                max-w-xl
              "
            >
              <div>
                <h2
                  className="
                    text-2xl
                    sm:text-3xl
                    lg:text-4xl
                    font-black
                  "
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Smart
                </h2>

                <p
                  className="text-xs sm:text-sm mt-1 sm:mt-2"
                  style={{
                    color: LightColors.textSecondary,
                  }}
                >
                  AI Security
                </p>
              </div>

              <div>
                <h2
                  className="
                    text-2xl
                    sm:text-3xl
                    lg:text-4xl
                    font-black
                  "
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Safe
                </h2>

                <p
                  className="text-xs sm:text-sm mt-1 sm:mt-2"
                  style={{
                    color: LightColors.textSecondary,
                  }}
                >
                  Authentication
                </p>
              </div>

              <div>
                <h2
                  className="
                    text-2xl
                    sm:text-3xl
                    lg:text-4xl
                    font-black
                  "
                  style={{
                    color: LightColors.primary,
                  }}
                >
                  Modern
                </h2>

                <p
                  className="text-xs sm:text-sm mt-1 sm:mt-2"
                  style={{
                    color: LightColors.textSecondary,
                  }}
                >
                  Dashboard
                </p>
              </div>
            </div>
          </motion.div>

          {/* =================================================
              SIGNUP CARD
          ================================================= */}

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
              lg:py-16
            "
          >
            <div
              className="
                w-full
                max-w-2xl
                rounded-[28px]
                sm:rounded-[36px]
                lg:rounded-[40px]
                overflow-hidden
                border
              "
              style={{
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(22px)",
                borderColor: "rgba(255,255,255,0.4)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.08)",
              }}
            >
              {/* ACCENT */}

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
                  p-5
                  sm:p-8
                  md:p-10
                  lg:p-12
                "
              >
                {/* =================================================
                    HEADER
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
                    <GraduationCap
                      className="
                        w-9
                        h-9
                        sm:w-11
                        sm:h-11
                        lg:w-12
                        lg:h-12
                      "
                      style={{
                        color: LightColors.primary,
                      }}
                    />
                  </div>

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
                    Create Account
                  </h2>

                  <p
                    className="
                      mt-3
                      sm:mt-4
                      text-sm
                      sm:text-base
                      max-w-lg
                      leading-relaxed
                    "
                    style={{
                      color: LightColors.textSecondary,
                    }}
                  >
                    Register your account to access
                    GuidEd's secure campus safety
                    management platform.
                  </p>
                </div>

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                  onSubmit={handleSignUp}
                  encType="multipart/form-data"
                  className="
                    mt-8
                    sm:mt-10
                    lg:mt-12
                    space-y-5
                    sm:space-y-6
                  "
                >
                  {/* ACCOUNT TYPE */}

                  <div>
                    <label
                      className="
                        block
                        mb-2
                        sm:mb-3
                        text-sm
                        font-bold
                      "
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Account Type
                    </label>

                    <select
                      value={accountType}
                      onChange={(e) => {
                        setAccountType(e.target.value);

                        /* Reset role-specific fields */

                        setStudentId("");
                        setGrade("");
                        setEmployeeId("");
                        setDepartment("");
                      }}
                      required
                      className="
                        w-full
                        h-14
                        px-4
                        sm:px-5
                        rounded-2xl
                        border
                        bg-white
                        outline-none
                        transition-all
                        text-sm
                        sm:text-base
                      "
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

                  {/* FIRST / LAST NAME */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                  {/* MIDDLE NAME */}

                  <Input
                    icon={User}
                    type="text"
                    placeholder="Middle Name (Optional)"
                    value={middleName}
                    onChange={(e) =>
                      setMiddleName(e.target.value)
                    }
                  />

                  {/* EMAIL */}

                  <Input
                    icon={Mail}
                    type="email"
                    placeholder="Institutional Email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />

                  {/* STUDENT / TEACHER */}

                  {accountType === "Student" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  ) : accountType === "Teacher" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        icon={User}
                        type="text"
                        placeholder="Employee ID"
                        value={employeeId}
                        onChange={(e) =>
                          setEmployeeId(e.target.value)
                        }
                      />

                      <Input
                        icon={GraduationCap}
                        type="text"
                        placeholder="Department"
                        value={department}
                        onChange={(e) =>
                          setDepartment(e.target.value)
                        }
                      />
                    </div>
                  ) : null}

                  {/* GENDER */}

                  <div>
                    <label
                      className="
                        block
                        mb-2
                        sm:mb-3
                        text-sm
                        font-bold
                      "
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
                      className="
                        w-full
                        h-14
                        px-4
                        sm:px-5
                        rounded-2xl
                        border
                        bg-white
                        outline-none
                        transition-all
                        text-sm
                        sm:text-base
                      "
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

                  {/* PASSWORDS */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                        setConfirmPassword(e.target.value)
                      }
                    />
                  </div>

                  {/* PASSWORD STRENGTH */}

                  <PasswordStrengthMeter
                    password={password}
                  />

                  {/* =================================================
                      PROFILE PHOTO
                  ================================================= */}

                  <div>
                    <label
                      className="
                        block
                        mb-2
                        sm:mb-3
                        text-sm
                        font-bold
                      "
                      style={{
                        color: LightColors.textLabel,
                      }}
                    >
                      Profile Photo (Optional)
                    </label>

                    <label
                      className="
                        w-full
                        min-h-[140px]
                        sm:min-h-[160px]
                        border-2
                        border-dashed
                        rounded-3xl
                        flex
                        flex-col
                        items-center
                        justify-center
                        cursor-pointer
                        transition-all
                        bg-white
                        px-4
                        hover:bg-green-50/30
                      "
                      style={{
                        borderColor: LightColors.border,
                      }}
                    >
                      {photoPreview ? (
                        <>
                          <img
                            src={photoPreview}
                            alt="Profile Preview"
                            className="
                              w-24
                              h-24
                              sm:w-28
                              sm:h-28
                              object-cover
                              rounded-full
                              border-4
                              shadow-md
                            "
                            style={{
                              borderColor:
                                LightColors.primary,
                            }}
                          />

                          <p
                            className="
                              mt-3
                              text-xs
                              sm:text-sm
                              font-semibold
                            "
                            style={{
                              color:
                                LightColors.primary,
                            }}
                          >
                            Click to change photo
                          </p>

                          <p
                            className="
                              mt-1
                              text-[11px]
                              sm:text-xs
                              text-center
                            "
                            style={{
                              color:
                                LightColors.textSecondary,
                            }}
                          >
                            You can crop the new photo
                            before using it
                          </p>
                        </>
                      ) : (
                        <>
                          <Camera
                            className="
                              w-8
                              h-8
                              sm:w-10
                              sm:h-10
                              mb-2
                              sm:mb-3
                            "
                            style={{
                              color:
                                LightColors.primary,
                            }}
                          />

                          <p
                            className="
                              font-semibold
                              text-sm
                              sm:text-base
                              text-center
                            "
                            style={{
                              color:
                                LightColors.textPrimary,
                            }}
                          >
                            Upload Profile Photo
                          </p>

                          <p
                            className="
                              text-xs
                              sm:text-sm
                              mt-1
                              text-center
                            "
                            style={{
                              color:
                                LightColors.textSecondary,
                            }}
                          >
                            PNG, JPG or JPEG • Max 10MB
                          </p>
                        </>
                      )}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* ERROR */}

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
                      className="
                        rounded-2xl
                        border
                        px-4
                        py-3
                        text-sm
                        font-medium
                      "
                      style={{
                        color: LightColors.danger,
                        background: "#fef2f2",
                        borderColor: "#fecaca",
                      }}
                    >
                      {localError || error}
                    </motion.div>
                  )}

                  {/* POLICY LINK */}

                  <button
                    type="button"
                    onClick={() => setShowPolicy(true)}
                    className="
                      text-sm
                      font-semibold
                      underline
                      text-left
                    "
                    style={{
                      color: LightColors.primary,
                    }}
                  >
                    View GuidEd User Policy
                  </button>

                  {/* POLICY AGREEMENT */}

                  <div
                    className="
                      flex
                      items-start
                      gap-3
                      p-4
                      rounded-2xl
                      border
                      bg-white
                    "
                    style={{
                      borderColor: LightColors.border,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acceptedPolicy}
                      onChange={(e) =>
                        setAcceptedPolicy(
                          e.target.checked
                        )
                      }
                      className="
                        mt-1
                        w-5
                        h-5
                        shrink-0
                        accent-green-800
                      "
                    />

                    <div className="text-sm">
                      <p
                        className="font-semibold"
                        style={{
                          color:
                            LightColors.textPrimary,
                        }}
                      >
                        I agree to the Policy
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{
                          color:
                            LightColors.textSecondary,
                        }}
                      >
                        You must read the full policy
                        before continuing.
                      </p>
                    </div>
                  </div>

                  {/* SUBMIT */}

                  <motion.button
                    whileHover={{
                      scale: 1.015,
                    }}
                    whileTap={{
                      scale: 0.985,
                    }}
                    type="submit"
                    disabled={
                      isLoading ||
                      !acceptedPolicy
                    }
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
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span>Create Account</span>

                        <ArrowRight
                          className="
                            w-5
                            h-5
                            shrink-0
                          "
                        />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* FOOTER */}

                <div className="mt-8 sm:mt-10 text-center">
                  <p
                    className="text-sm"
                    style={{
                      color:
                        LightColors.textSecondary,
                    }}
                  >
                    Already have an account?{" "}

                    <Link
                      to="/login"
                      className="font-bold hover:underline"
                      style={{
                        color:
                          LightColors.primary,
                      }}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* COPYRIGHT */}

                <div
                  className="
                    mt-8
                    sm:mt-10
                    pt-5
                    sm:pt-6
                    border-t
                    text-center
                  "
                  style={{
                    borderColor:
                      LightColors.divider,
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
                      color:
                        LightColors.textMuted,
                    }}
                  >
                    GuidEd Campus Security Platform ©
                    2026
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* =====================================================
          POLICY MODAL
      ===================================================== */}

      {showPolicy && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-3
            sm:p-6
          "
        >
          <div
            className="
              bg-white
              w-full
              max-w-3xl
              max-h-[90vh]
              sm:max-h-[80vh]
              overflow-y-auto
              rounded-2xl
              sm:rounded-3xl
              p-5
              sm:p-8
              shadow-2xl
            "
          >
            <h2
              className="
                text-xl
                sm:text-2xl
                font-black
                mb-4
              "
              style={{
                color: LightColors.textPrimary,
              }}
            >
              GuidEd User Policy
            </h2>

            <div
              className="
                text-sm
                leading-relaxed
                whitespace-pre-wrap
                text-gray-700
              "
            >
{`GuidED User Policy and Agreement
1. Purpose

The purpose of this policy is to establish the rules, responsibilities, and procedures governing the use of the Student Discipline Management System (SDMS), a mobile and web-based application designed to improve the reporting, monitoring, recording, and analysis of student disciplinary incidents within the institution.

The system allows teachers and guest users to submit disciplinary reports, students to review their own incident records, and students to communicate with the Guidance Counselor regarding disciplinary concerns, counseling, and follow-up actions. The system also uses Artificial Intelligence (AI) analysis to identify behavioral patterns and generate disciplinary insights.

2. Scope

This policy applies to the following users of the Student Discipline Management System:

Students
Teachers
Guest Users (School Staff for Reporting Purposes)
Guidance Counselors

All users are required to comply with this policy and related institutional regulations.

3. System Features

The Student Discipline Management System provides the following functions:

3.1 Incident Reporting

Teachers and authorized guest users may digitally submit reports involving student misconduct, violations, or disciplinary concerns.

3.2 Incident Record Viewing

Students may access and review only their own disciplinary records and previous incidents through their accounts.

3.3 Student–Guidance Counselor Communication

Students may communicate directly with the Guidance Counselor through the system regarding:

Counseling requests;
Clarifications about incidents;
Follow-up discussions;
Behavioral guidance and support.

All communications shall remain professional, respectful, and confidential.

3.4 AI-Based Incident Analysis

The system includes AI-powered analysis features that may:

Detect repeated behavioral patterns;
Categorize incident severity;
Identify frequent violations;
Generate summaries and recommendations;
Assist school personnel in monitoring student behavior trends.

AI-generated analysis serves only as a support tool and shall not replace human judgment or official disciplinary procedures.

3.5 Notifications and Updates

Users may receive notifications regarding:

Newly submitted incidents;
Incident status updates;
Counseling schedules or responses;
Disciplinary recommendations or actions.

4. User Responsibilities

4.1 Students

Students are responsible for:

Accessing only their own disciplinary records;
Maintaining the confidentiality of their login credentials;
Using the communication feature respectfully and responsibly;
Reporting incorrect information to authorized personnel.

Students are prohibited from:

Accessing another user’s records;
Sharing confidential information;
Sending abusive, threatening, or inappropriate messages;
Attempting to manipulate or alter disciplinary records.

4.2 Teachers

Teachers are authorized to:

Submit disciplinary incident reports;
Review submitted incidents;
Access AI-generated analysis related to disciplinary cases.

Teachers must:

Submit factual, objective, and professional reports;
Avoid biased or discriminatory statements;
Maintain confidentiality of student information;
Use AI-generated recommendations responsibly.

False reporting or misuse of the system may result in administrative sanctions.

4.3 Guest Users (School Staff)

Guest users are school staff members granted limited access solely for incident reporting purposes.

Guest users may:

Submit disciplinary incident reports;
Provide supporting information regarding incidents.

Guest users are prohibited from:

Viewing confidential disciplinary records;
Editing existing incident reports;
Accessing student disciplinary history;
Sharing confidential information outside authorized channels.

5. Data Privacy and Confidentiality

All disciplinary records, counseling communications, and personal information stored in the system shall be treated as confidential.

The institution shall:

Protect user data using secure authentication measures;
Restrict access according to user roles and permissions;
Prevent unauthorized disclosure of records and communications;
Use collected data only for legitimate educational and disciplinary purposes.

Student disciplinary and counseling information shall not be publicly disclosed without proper authorization unless required by law.

6. AI Ethics and Fair Use

The AI analysis feature is intended only to assist in identifying behavioral trends and improving disciplinary management.

The institution recognizes that:

AI-generated analysis may contain inaccuracies;
Human review is required before disciplinary actions are finalized;
AI analysis must not result in discrimination or unfair treatment.

All disciplinary decisions shall remain subject to proper school procedures and human evaluation.

7. Prohibited Activities

The following activities are strictly prohibited:

Unauthorized access to accounts or records;
Sharing confidential disciplinary or counseling information;
Submitting false or misleading incident reports;
Sending abusive or inappropriate messages;
Attempting to bypass system security;
Misusing AI-generated analysis for harassment or discrimination.

Violations may result in disciplinary action, suspension of access privileges, or legal consequences.

8. Record Retention

Disciplinary records and counseling communications shall be retained according to institutional policies and applicable regulations.

The institution reserves the right to archive or remove records after the approved retention period.

9. System Availability and Maintenance

The institution may temporarily suspend access to the system for:

System maintenance;
Security updates;
Technical improvements;
Emergency situations.

Users shall be informed whenever possible regarding scheduled maintenance activities.

10. Policy Violations

Failure to comply with this policy may result in:

Suspension of system access;
Administrative sanctions;
School disciplinary action;

11. Acceptance of Terms

By accessing and using the Student Discipline Management System, users acknowledge that they have read, understood, and agreed to comply with this policy and related institutional regulations.

12. Conclusion

The Student Discipline Management System aims to modernize school discipline processes by improving accountability, transparency, efficiency, communication, and behavioral monitoring through digital technology and AI-assisted analysis. The institution remains committed to ensuring fairness, responsible technology use, and the protection of student rights, privacy, and well-being.
`}
            </div>

            {/* MODAL BUTTONS */}

            <div
              className="
                flex
                flex-col-reverse
                sm:flex-row
                justify-end
                mt-6
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setShowPolicy(false)
                }
                className="
                  w-full
                  sm:w-auto
                  px-5
                  py-3
                  rounded-xl
                  border
                  text-sm
                  font-semibold
                "
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setAcceptedPolicy(true);
                  setShowPolicy(false);
                }}
                className="
                  w-full
                  sm:w-auto
                  px-5
                  py-3
                  rounded-xl
                  text-white
                  text-sm
                  font-semibold
                "
                style={{
                  background:
                    LightColors.primary,
                }}
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PROFILE PHOTO CROPPER MODAL
      ===================================================== */}

      {showCropper && cropImage && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/70
            backdrop-blur-sm
            p-3
            sm:p-6
          "
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              relative
              w-full
              max-w-xl
              bg-white
              rounded-3xl
              sm:rounded-[32px]
              overflow-hidden
              shadow-2xl
            "
          >
            {/* =================================================
                CROPPER HEADER
            ================================================= */}

            <div
              className="
                flex
                items-center
                justify-between
                px-5
                sm:px-7
                py-4
                sm:py-5
                border-b
              "
              style={{
                borderColor:
                  LightColors.divider,
              }}
            >
              <div>
                <h2
                  className="
                    text-lg
                    sm:text-xl
                    font-black
                  "
                  style={{
                    color:
                      LightColors.textPrimary,
                  }}
                >
                  Crop Profile Photo
                </h2>

                <p
                  className="
                    text-xs
                    sm:text-sm
                    mt-1
                  "
                  style={{
                    color:
                      LightColors.textSecondary,
                  }}
                >
                  Drag the image and adjust the zoom
                </p>
              </div>

              <button
                type="button"
                onClick={handleCropCancel}
                className="
                  w-9
                  h-9
                  sm:w-10
                  sm:h-10
                  rounded-full
                  flex
                  items-center
                  justify-center
                  hover:bg-gray-100
                  transition
                "
                aria-label="Close cropper"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* =================================================
                CROPPER
            ================================================= */}

            <div
              className="
                relative
                w-full
                h-[320px]
                sm:h-[400px]
                bg-gray-950
              "
            >
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* =================================================
                CONTROLS
            ================================================= */}

            <div
              className="
                px-5
                sm:px-7
                py-5
                sm:py-6
              "
            >
              {/* ZOOM */}

              <div className="flex items-center gap-3">
                <ZoomOut
                  className="w-5 h-5 shrink-0"
                  style={{
                    color:
                      LightColors.textSecondary,
                  }}
                />

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) =>
                    setZoom(
                      Number(e.target.value)
                    )
                  }
                  className="
                    flex-1
                    accent-green-800
                    cursor-pointer
                  "
                />

                <ZoomIn
                  className="w-5 h-5 shrink-0"
                  style={{
                    color:
                      LightColors.textSecondary,
                  }}
                />
              </div>

              <div className="flex justify-center mt-2">
                <span
                  className="
                    text-xs
                    font-medium
                  "
                  style={{
                    color:
                      LightColors.textSecondary,
                  }}
                >
                  Zoom: {zoom.toFixed(1)}x
                </span>
              </div>

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-3
                  mt-5
                "
              >
                {/* RESET */}

                <button
                  type="button"
                  onClick={() => {
                    setCrop({
                      x: 0,
                      y: 0,
                    });

                    setZoom(1);
                  }}
                  className="
                    w-full
                    sm:flex-1
                    h-12
                    rounded-2xl
                    border
                    font-semibold
                    text-sm
                    flex
                    items-center
                    justify-center
                    gap-2
                    hover:bg-gray-50
                    transition
                  "
                  style={{
                    borderColor:
                      LightColors.border,
                    color:
                      LightColors.textPrimary,
                  }}
                >
                  <RotateCcw className="w-4 h-4" />

                  Reset
                </button>

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="
                    w-full
                    sm:flex-1
                    h-12
                    rounded-2xl
                    border
                    font-semibold
                    text-sm
                    hover:bg-gray-50
                    transition
                  "
                  style={{
                    borderColor:
                      LightColors.border,
                    color:
                      LightColors.textPrimary,
                  }}
                >
                  Cancel
                </button>

                {/* USE PHOTO */}

                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="
                    w-full
                    sm:flex-[1.5]
                    h-12
                    rounded-2xl
                    text-white
                    font-bold
                    text-sm
                    flex
                    items-center
                    justify-center
                    gap-2
                    shadow-lg
                    hover:opacity-95
                    transition
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${LightColors.primary} 0%,
                        #256d2a 100%
                      )
                    `,
                  }}
                >
                  <CheckCircle2 className="w-5 h-5" />

                  Use Photo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;