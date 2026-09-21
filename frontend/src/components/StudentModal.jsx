import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api";
import toast from "react-hot-toast";

import {
  User,
  X,
  Upload,
  UserRound,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  Save,
  Plus,
  Check,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

const StudentModal = ({ close, refresh, student, isEditing }) => {
  /* =========================================================
     DARK MODE
  ========================================================= */

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "guided-theme") {
        setDarkMode(event.newValue === "dark");
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /*
    This allows the modal to respond when the dashboard changes
    the theme while the modal is open in the same tab/window.
  */
  useEffect(() => {
    const checkTheme = () => {
      try {
        const savedTheme = localStorage.getItem("guided-theme");
        setDarkMode(savedTheme === "dark");
      } catch {
        // Ignore localStorage errors
      }
    };

    const interval = setInterval(checkTheme, 500);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    grade: "",
    studentId: "",
    email: "",
    phone: "",
    gender: "",
    riskLevel: "Low",
    notes: "",
    profilePhoto: "",
    newPhoto: null,
  });

  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const fileRef = useRef(null);

  /* =========================================================
     LOAD STUDENT
  ========================================================= */

  useEffect(() => {
    if (isEditing && student) {
      setForm({
        firstName: student.firstName || "",
        middleName: student.middleName || "",
        lastName: student.lastName || "",
        grade: student.grade || "",
        studentId: student.studentId || "",
        email: student.email || "",
        phone: student.phone || "",
        gender: student.gender || "",
        riskLevel: student.riskLevel || "Low",
        notes: student.notes || "",
        profilePhoto: student.profilePhoto || "",
        newPhoto: null,
      });

      setPhotoPreview(student.profilePhoto || null);
    } else {
      setForm({
        firstName: "",
        middleName: "",
        lastName: "",
        grade: "",
        studentId: "",
        email: "",
        phone: "",
        gender: "",
        riskLevel: "Low",
        notes: "",
        profilePhoto: "",
        newPhoto: null,
      });

      setPhotoPreview(null);
    }
  }, [isEditing, student]);

  /* =========================================================
     INPUT
  ========================================================= */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* =========================================================
     PHOTO
  ========================================================= */

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setForm((prev) => ({
      ...prev,
      newPhoto: file,
    }));

    setPhotoPreview(URL.createObjectURL(file));
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Please enter the student's name.");
      return;
    }

    if (!form.studentId.trim()) {
      toast.error("Student ID is required.");
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      Object.keys(form).forEach((key) => {
        if (key === "newPhoto") {
          if (form.newPhoto) {
            data.append("profilePhoto", form.newPhoto);
          }
        } else {
          data.append(key, form[key] ?? "");
        }
      });

      if (isEditing) {
        await API.put(`/api/students/${student._id}`, data);
        toast.success("Student profile updated");
      } else {
        await API.post("/api/students", data);
        toast.success("Student profile created");
      }

      await refresh();
      close();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to save student. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DISPLAY
  ========================================================= */

  const fullName = `${form.firstName} ${form.middleName} ${form.lastName}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    <AnimatePresence>
      <motion.div
        className={`
          fixed inset-0 z-50
          flex items-center justify-center
          p-4 sm:p-6
          backdrop-blur-md
          transition-colors duration-300
          ${
            darkMode
              ? "bg-black/70"
              : "bg-slate-950/45"
          }
        `}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.form
          onSubmit={handleSubmit}
          initial={{
            opacity: 0,
            scale: 0.96,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.96,
            y: 20,
          }}
          transition={{
            duration: 0.22,
            ease: "easeOut",
          }}
          className={`
            relative
            w-full
            max-w-5xl
            max-h-[92vh]
            overflow-hidden
            rounded-[28px]
            backdrop-blur-2xl
            border
            shadow-[0_25px_80px_rgba(0,0,0,0.25)]
            transition-colors duration-300
            ${
              darkMode
                ? "bg-[#0B1712] border-emerald-900/40 shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
                : "bg-white/95 border-white/70"
            }
          `}
        >
          {/* =====================================================
             HEADER
          ===================================================== */}

          <div
            className={`
              relative
              px-6 sm:px-8
              py-6
              border-b
              bg-gradient-to-r
              transition-colors duration-300
              ${
                darkMode
                  ? "border-emerald-900/30 from-[#0E291A]/90 via-[#0B1712]/95 to-[#0B1712]/80"
                  : "border-slate-200/70 from-green-50/90 via-white/80 to-white/60"
              }
            `}
          >
            {/* Decorative glow */}

            <div
              className={`
                absolute
                -top-20
                -right-20
                w-48
                h-48
                rounded-full
                blur-3xl
                pointer-events-none
                ${
                  darkMode
                    ? "bg-emerald-500/10"
                    : "bg-green-200/30"
                }
              `}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`
                    w-12 h-12
                    rounded-2xl
                    border
                    flex items-center justify-center
                    flex-shrink-0
                    shadow-sm
                    ${
                      darkMode
                        ? "bg-emerald-950/60 border-emerald-800/50 text-emerald-300"
                        : "bg-green-100 border-green-200/70 text-green-700"
                    }
                  `}
                >
                  {isEditing ? (
                    <UserRound size={22} />
                  ) : (
                    <Plus size={22} />
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-[0.16em]
                      font-semibold
                      ${
                        darkMode
                          ? "text-emerald-400/80"
                          : "text-green-700/70"
                      }
                    `}
                  >
                    Student Management
                  </p>

                  <h2
                    className={`
                      text-xl sm:text-2xl
                      font-bold
                      tracking-tight
                      ${
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }
                    `}
                  >
                    {isEditing
                      ? "Edit Student Profile"
                      : "Create Student Profile"}
                  </h2>

                  <p
                    className={`
                      text-sm
                      mt-0.5
                      ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }
                    `}
                  >
                    {isEditing
                      ? "Update the student's information and profile."
                      : "Add a new student to the school database."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                aria-label="Close student modal"
                className={`
                  w-10 h-10
                  rounded-xl
                  flex items-center justify-center
                  border
                  transition
                  flex-shrink-0
                  ${
                    darkMode
                      ? "text-slate-400 border-transparent hover:text-white hover:bg-white/10 hover:border-emerald-900/40"
                      : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-white hover:border-slate-200"
                  }
                `}
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* =====================================================
             BODY
          ===================================================== */}

          <div
            className={`
              overflow-y-auto
              max-h-[calc(92vh-150px)]
              transition-colors duration-300
              ${
                darkMode
                  ? "bg-[#0B1712]"
                  : "bg-transparent"
              }
            `}
          >
            <div className="p-6 sm:p-8 space-y-8">
              {/* =================================================
                 PROFILE PREVIEW
              ================================================= */}

              <div
                className={`
                  flex flex-col sm:flex-row
                  items-center sm:items-center
                  gap-5
                  p-5
                  rounded-3xl
                  border
                  shadow-sm
                  transition-colors duration-300
                  ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-900/30"
                      : "bg-white/70 border-slate-200/70"
                  }
                `}
              >
                {/* PHOTO */}

                <div className="relative">
                  <div
                    className={`
                      w-24 h-24
                      rounded-[26px]
                      overflow-hidden
                      bg-gradient-to-br
                      border
                      flex items-center justify-center
                      shadow-sm
                      ${
                        darkMode
                          ? "from-emerald-950/70 to-[#163522] border-emerald-800/50"
                          : "from-green-50 to-green-100 border-green-200/70"
                      }
                    `}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Student preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User
                        size={34}
                        className={
                          darkMode
                            ? "text-emerald-400"
                            : "text-green-600"
                        }
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="
                      absolute
                      -bottom-2
                      -right-2
                      w-9 h-9
                      rounded-xl
                      bg-green-600
                      hover:bg-green-700
                      text-white
                      flex items-center justify-center
                      shadow-lg
                      transition
                    "
                  >
                    <Upload size={15} />
                  </button>
                </div>

                {/* PROFILE TEXT */}

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <p
                    className={`
                      text-[10px]
                      uppercase
                      tracking-wider
                      font-semibold
                      ${
                        darkMode
                          ? "text-slate-500"
                          : "text-slate-400"
                      }
                    `}
                  >
                    Profile Preview
                  </p>

                  <h3
                    className={`
                      text-lg
                      font-bold
                      truncate
                      mt-1
                      ${
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }
                    `}
                  >
                    {fullName || "Student Name"}
                  </h3>

                  <p
                    className={`
                      text-sm
                      mt-1
                      ${
                        darkMode
                          ? "text-slate-400"
                          : "text-slate-500"
                      }
                    `}
                  >
                    {form.studentId || "Student ID"}{" "}
                    {form.grade && `• ${form.grade}`}
                  </p>

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`
                      mt-3
                      inline-flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      transition
                      ${
                        darkMode
                          ? "text-emerald-400 hover:text-emerald-300"
                          : "text-green-700 hover:text-green-800"
                      }
                    `}
                  >
                    <Upload size={13} />
                    {photoPreview
                      ? "Change photo"
                      : "Upload photo"}
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                {/* RISK PREVIEW */}

                <RiskPreview
                  level={form.riskLevel}
                  darkMode={darkMode}
                />
              </div>

              {/* =================================================
                 FORM GRID
              ================================================= */}

              <div className="grid lg:grid-cols-2 gap-8">
                {/* LEFT */}

                <div className="space-y-6">
                  <Section
                    icon={<UserRound size={16} />}
                    title="Personal Information"
                    description="Basic identity details"
                    darkMode={darkMode}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      label="First Name"
                      required
                      form={form}
                      onChange={handleChange}
                      darkMode={darkMode}
                    />

                    <Input
                      name="middleName"
                      label="Middle Name"
                      form={form}
                      onChange={handleChange}
                      darkMode={darkMode}
                    />
                  </div>

                  <Input
                    name="lastName"
                    label="Last Name"
                    required
                    form={form}
                    onChange={handleChange}
                    darkMode={darkMode}
                  />

                  <Select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={["Male", "Female"]}
                    label="Gender"
                    placeholder="Select gender"
                    darkMode={darkMode}
                  />

                  {/* ACADEMIC */}

                  <Section
                    icon={<GraduationCap size={16} />}
                    title="Academic Information"
                    description="School and enrollment details"
                    darkMode={darkMode}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      name="studentId"
                      label="Student ID"
                      required
                      form={form}
                      onChange={handleChange}
                      darkMode={darkMode}
                    />

                    <Select
                      name="grade"
                      value={form.grade}
                      onChange={handleChange}
                      options={[
                        "Grade 1",
                        "Grade 2",
                        "Grade 3",
                        "Grade 4",
                        "Grade 5",
                        "Grade 6",
                        "Grade 7",
                        "Grade 8",
                        "Grade 9",
                        "Grade 10",
                      ]}
                      label="Grade Level"
                      placeholder="Select grade level"
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                {/* RIGHT */}

                <div className="space-y-6">
                  {/* CONTACT */}

                  <Section
                    icon={<Mail size={16} />}
                    title="Contact Information"
                    description="Student contact details"
                    darkMode={darkMode}
                  />

                  <Input
                    name="email"
                    label="Email Address"
                    type="email"
                    form={form}
                    onChange={handleChange}
                    icon={<Mail size={15} />}
                    darkMode={darkMode}
                  />

                  <Input
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    form={form}
                    onChange={handleChange}
                    icon={<Phone size={15} />}
                    darkMode={darkMode}
                  />

                  {/* CLASSIFICATION */}

                  <Section
                    icon={<ShieldCheck size={16} />}
                    title="Risk Classification"
                    description="Behavioral monitoring level"
                    darkMode={darkMode}
                  />

                  <RiskSelector
                    value={form.riskLevel}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        riskLevel: value,
                      }))
                    }
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {/* =================================================
                 NOTES
              ================================================= */}

              <div className="space-y-4">
                <Section
                  icon={<FileText size={16} />}
                  title="Guidance Notes"
                  description="Optional behavioral observations or remarks"
                  darkMode={darkMode}
                />

                <div className="relative">
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Add behavioral notes, guidance remarks, observations, or other relevant information..."
                    className={`
                      w-full
                      min-h-[130px]
                      resize-none
                      px-4
                      py-3.5
                      rounded-2xl
                      border
                      text-sm
                      outline-none
                      transition
                      ${
                        darkMode
                          ? "bg-[#101F17] border-emerald-900/30 text-slate-200 placeholder:text-slate-600 hover:border-emerald-800/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                          : "bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:border-green-400 focus:ring-4 focus:ring-green-100"
                      }
                    `}
                  />

                  <span
                    className={`
                      absolute
                      bottom-3
                      right-3
                      text-[10px]
                      ${
                        darkMode
                          ? "text-slate-600"
                          : "text-slate-400"
                      }
                    `}
                  >
                    Optional
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
             FOOTER
          ===================================================== */}

          <div
            className={`
              px-6 sm:px-8
              py-4
              border-t
              backdrop-blur-xl
              flex
              flex-col-reverse sm:flex-row
              justify-between
              items-center
              gap-3
              transition-colors duration-300
              ${
                darkMode
                  ? "border-emerald-900/30 bg-[#0D1A14]/95"
                  : "border-slate-200/70 bg-white/70"
              }
            `}
          >
            <p
              className={`
                text-xs
                hidden sm:block
                ${
                  darkMode
                    ? "text-slate-500"
                    : "text-slate-400"
                }
              `}
            >
              {isEditing
                ? "Changes will be saved to the student record."
                : "Make sure the student information is accurate before saving."}
            </p>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className={`
                  flex-1 sm:flex-none
                  px-5
                  py-2.5
                  rounded-xl
                  border
                  text-sm
                  font-medium
                  transition
                  disabled:opacity-50
                  ${
                    darkMode
                      ? "bg-[#14231B] border-emerald-900/40 text-slate-300 hover:bg-[#1A2D22] hover:text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                Cancel
              </button>

              <motion.button
                type="submit"
                disabled={saving}
                whileHover={!saving ? { scale: 1.02 } : {}}
                whileTap={!saving ? { scale: 0.98 } : {}}
                className="
                  flex-1 sm:flex-none
                  min-w-[150px]
                  px-5
                  py-2.5
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  text-sm
                  font-semibold
                  shadow-lg
                  shadow-green-900/20
                  transition
                  flex items-center justify-center gap-2
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                {saving ? (
                  <>
                    <span
                      className="
                        w-4 h-4
                        border-2
                        border-white/40
                        border-t-white
                        rounded-full
                        animate-spin
                      "
                    />
                    Saving...
                  </>
                ) : isEditing ? (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Student
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
};

/* =========================================================
   SECTION
========================================================= */

const Section = ({
  icon,
  title,
  description,
  darkMode,
}) => (
  <div className="flex items-start gap-3">
    <div
      className={`
        w-9 h-9
        rounded-xl
        border
        flex items-center justify-center
        flex-shrink-0
        ${
          darkMode
            ? "bg-emerald-950/50 border-emerald-900/40 text-emerald-400"
            : "bg-green-50 border-green-100 text-green-700"
        }
      `}
    >
      {icon}
    </div>

    <div>
      <h3
        className={`
          text-sm
          font-bold
          ${
            darkMode
              ? "text-slate-100"
              : "text-slate-900"
          }
        `}
      >
        {title}
      </h3>

      <p
        className={`
          text-xs
          mt-0.5
          ${
            darkMode
              ? "text-slate-500"
              : "text-slate-400"
          }
        `}
      >
        {description}
      </p>
    </div>
  </div>
);

/* =========================================================
   INPUT
========================================================= */

const Input = ({
  name,
  label,
  form,
  onChange,
  required = false,
  type = "text",
  icon,
  darkMode,
}) => (
  <div>
    <label
      className={`
        flex
        items-center
        gap-1
        text-xs
        font-semibold
        mb-1.5
        ${
          darkMode
            ? "text-slate-300"
            : "text-slate-600"
        }
      `}
    >
      {label}

      {required && (
        <span className="text-red-400">*</span>
      )}
    </label>

    <div className="relative">
      {icon && (
        <div
          className={`
            absolute
            left-3.5
            top-1/2
            -translate-y-1/2
            ${
              darkMode
                ? "text-slate-500"
                : "text-slate-400"
            }
          `}
        >
          {icon}
        </div>
      )}

      <input
        name={name}
        type={type}
        value={form[name] || ""}
        onChange={onChange}
        required={required}
        className={`
          w-full
          px-4
          py-3
          ${icon ? "pl-10" : ""}
          rounded-xl
          border
          text-sm
          outline-none
          transition
          ${
            darkMode
              ? "bg-[#101F17] border-emerald-900/30 text-slate-200 placeholder:text-slate-600 hover:border-emerald-800/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              : "bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:border-green-400 focus:ring-4 focus:ring-green-100"
          }
        `}
      />
    </div>
  </div>
);

/* =========================================================
   SELECT
========================================================= */

const Select = ({
  name,
  value,
  onChange,
  options,
  label,
  placeholder,
  darkMode,
}) => (
  <div>
    <label
      className={`
        block
        text-xs
        font-semibold
        mb-1.5
        ${
          darkMode
            ? "text-slate-300"
            : "text-slate-600"
        }
      `}
    >
      {label}
    </label>

    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`
        w-full
        px-4
        py-3
        rounded-xl
        border
        text-sm
        outline-none
        transition
        ${
          darkMode
            ? "bg-[#101F17] border-emerald-900/30 text-slate-200 hover:border-emerald-800/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            : "bg-white/80 border-slate-200 text-slate-800 hover:border-slate-300 focus:border-green-400 focus:ring-4 focus:ring-green-100"
        }
      `}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}

      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

/* =========================================================
   RISK SELECTOR
========================================================= */

const RiskSelector = ({
  value,
  onChange,
  darkMode,
}) => {
  const risks = [
    {
      value: "Low",
      label: "Low Risk",
      description: "No immediate concerns",
      icon: <Check size={16} />,
      light:
        "border-green-300 bg-green-50 text-green-700 ring-2 ring-green-100",
      dark:
        "border-green-700/60 bg-green-950/40 text-green-300 ring-2 ring-green-900/30",
    },
    {
      value: "Medium",
      label: "Medium Risk",
      description: "Requires monitoring",
      icon: <AlertTriangle size={16} />,
      light:
        "border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-100",
      dark:
        "border-orange-700/60 bg-orange-950/30 text-orange-300 ring-2 ring-orange-900/30",
    },
    {
      value: "High",
      label: "High Risk",
      description: "Needs attention",
      icon: <AlertCircle size={16} />,
      light:
        "border-red-300 bg-red-50 text-red-700 ring-2 ring-red-100",
      dark:
        "border-red-700/60 bg-red-950/30 text-red-300 ring-2 ring-red-900/30",
    },
  ];

  return (
    <div className="grid gap-2.5">
      {risks.map((risk) => {
        const active = value === risk.value;

        return (
          <button
            key={risk.value}
            type="button"
            onClick={() => onChange(risk.value)}
            className={`
              w-full
              p-3.5
              rounded-2xl
              border
              text-left
              transition
              flex
              items-center
              gap-3
              ${
                active
                  ? darkMode
                    ? risk.dark
                    : risk.light
                  : darkMode
                    ? "border-emerald-900/30 bg-[#101F17] hover:bg-[#14261C] hover:border-emerald-800/50 text-slate-300"
                    : "border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300"
              }
            `}
          >
            <div
              className={`
                w-9 h-9
                rounded-xl
                flex
                items-center
                justify-center
                ${
                  active
                    ? darkMode
                      ? "bg-white/10"
                      : "bg-white/70"
                    : darkMode
                      ? "bg-slate-800/70 text-slate-500"
                      : "bg-slate-50 text-slate-400"
                }
              `}
            >
              {risk.icon}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">
                {risk.label}
              </p>

              <p
                className={`
                  text-[11px]
                  mt-0.5
                  ${
                    active
                      ? "opacity-70"
                      : darkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                  }
                `}
              >
                {risk.description}
              </p>
            </div>

            {active && (
              <div className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center">
                <Check size={12} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

/* =========================================================
   RISK PREVIEW
========================================================= */

const RiskPreview = ({
  level,
  darkMode,
}) => {
  const config = {
    Low: {
      light: {
        color: "text-green-700",
        bg: "bg-green-50",
        border: "border-green-200",
      },
      dark: {
        color: "text-green-300",
        bg: "bg-green-950/40",
        border: "border-green-800/50",
      },
      dot: "bg-green-500",
    },

    Medium: {
      light: {
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200",
      },
      dark: {
        color: "text-orange-300",
        bg: "bg-orange-950/30",
        border: "border-orange-800/50",
      },
      dot: "bg-orange-500",
    },

    High: {
      light: {
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
      },
      dark: {
        color: "text-red-300",
        bg: "bg-red-950/30",
        border: "border-red-800/50",
      },
      dot: "bg-red-500",
    },
  };

  const c = config[level] || config.Low;
  const theme = darkMode ? c.dark : c.light;

  return (
    <div
      className={`
        px-4
        py-3
        rounded-2xl
        ${theme.bg}
        border
        ${theme.border}
        min-w-[130px]
      `}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-60">
        Risk Level
      </p>

      <div
        className={`
          flex
          items-center
          gap-2
          mt-1
          ${theme.color}
        `}
      >
        <span
          className={`
            w-2.5
            h-2.5
            rounded-full
            ${c.dot}
          `}
        />

        <span className="text-sm font-bold">
          {level}
        </span>
      </div>
    </div>
  );
};

export default StudentModal;