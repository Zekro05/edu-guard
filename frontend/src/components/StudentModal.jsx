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

  /* ================= LOAD STUDENT ================= */

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

  /* ================= INPUT ================= */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ================= PHOTO ================= */

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setForm((prev) => ({
      ...prev,
      newPhoto: file,
    }));

    setPhotoPreview(URL.createObjectURL(file));
  };

  /* ================= SUBMIT ================= */

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

  /* ================= DISPLAY ================= */

  const fullName =
    `${form.firstName} ${form.middleName} ${form.lastName}`
      .replace(/\s+/g, " ")
      .trim();

  return (
    <AnimatePresence>
      <motion.div
        className="
          fixed inset-0 z-50
          bg-slate-950/45
          backdrop-blur-md
          flex items-center justify-center
          p-4 sm:p-6
        "
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
          className="
            relative
            w-full
            max-w-5xl
            max-h-[92vh]
            overflow-hidden
            rounded-[28px]
            bg-white/90
            backdrop-blur-2xl
            border border-white/70
            shadow-[0_25px_80px_rgba(0,0,0,0.18)]
          "
        >
          {/* ================= HEADER ================= */}

          <div
            className="
              relative
              px-6 sm:px-8
              py-6
              border-b border-slate-200/70
              bg-gradient-to-r
              from-green-50/90
              via-white/80
              to-white/60
            "
          >
            {/* Decorative glow */}

            <div
              className="
                absolute
                -top-20
                -right-20
                w-48
                h-48
                rounded-full
                bg-green-200/30
                blur-3xl
                pointer-events-none
              "
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="
                    w-12 h-12
                    rounded-2xl
                    bg-green-100
                    border border-green-200/70
                    flex items-center justify-center
                    text-green-700
                    shadow-sm
                  "
                >
                  {isEditing ? (
                    <UserRound size={22} />
                  ) : (
                    <Plus size={22} />
                  )}
                </div>

                <div>
                  <p
                    className="
                      text-[10px]
                      uppercase
                      tracking-[0.16em]
                      font-semibold
                      text-green-700/70
                    "
                  >
                    Student Management
                  </p>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {isEditing
                      ? "Edit Student Profile"
                      : "Create Student Profile"}
                  </h2>

                  <p className="text-sm text-slate-500 mt-0.5">
                    {isEditing
                      ? "Update the student's information and profile."
                      : "Add a new student to the school database."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                className="
                  w-10 h-10
                  rounded-xl
                  flex items-center justify-center
                  text-slate-500
                  hover:text-slate-800
                  hover:bg-white
                  border border-transparent
                  hover:border-slate-200
                  transition
                "
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* ================= BODY ================= */}

          <div className="overflow-y-auto max-h-[calc(92vh-150px)]">
            <div className="p-6 sm:p-8 space-y-8">
              {/* ================= PROFILE PREVIEW ================= */}

              <div
                className="
                  flex flex-col sm:flex-row
                  items-center sm:items-center
                  gap-5
                  p-5
                  rounded-3xl
                  bg-white/70
                  border border-slate-200/70
                  shadow-sm
                "
              >
                {/* PHOTO */}

                <div className="relative">
                  <div
                    className="
                      w-24 h-24
                      rounded-[26px]
                      overflow-hidden
                      bg-gradient-to-br
                      from-green-50
                      to-green-100
                      border
                      border-green-200/70
                      flex items-center justify-center
                      shadow-sm
                    "
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Student preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={34} className="text-green-600" />
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
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Profile Preview
                  </p>

                  <h3 className="text-lg font-bold text-slate-900 truncate mt-1">
                    {fullName || "Student Name"}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {form.studentId || "Student ID"}{" "}
                    {form.grade && `• ${form.grade}`}
                  </p>

                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="
                      mt-3
                      inline-flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      text-green-700
                      hover:text-green-800
                    "
                  >
                    <Upload size={13} />
                    {photoPreview ? "Change photo" : "Upload photo"}
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

                <RiskPreview level={form.riskLevel} />
              </div>

              {/* ================= FORM GRID ================= */}

              <div className="grid lg:grid-cols-2 gap-8">
                {/* ================= LEFT ================= */}

                <div className="space-y-6">
                  <Section
                    icon={<UserRound size={16} />}
                    title="Personal Information"
                    description="Basic identity details"
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      label="First Name"
                      required
                      form={form}
                      onChange={handleChange}
                    />

                    <Input
                      name="middleName"
                      label="Middle Name"
                      form={form}
                      onChange={handleChange}
                    />
                  </div>

                  <Input
                    name="lastName"
                    label="Last Name"
                    required
                    form={form}
                    onChange={handleChange}
                  />

                  <Select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={["Male", "Female"]}
                    label="Gender"
                    placeholder="Select gender"
                  />

                  {/* ACADEMIC */}

                  <Section
                    icon={<GraduationCap size={16} />}
                    title="Academic Information"
                    description="School and enrollment details"
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      name="studentId"
                      label="Student ID"
                      required
                      form={form}
                      onChange={handleChange}
                    />

                    <Input
                      name="grade"
                      label="Grade Level"
                      required
                      form={form}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* ================= RIGHT ================= */}

                <div className="space-y-6">
                  {/* CONTACT */}

                  <Section
                    icon={<Mail size={16} />}
                    title="Contact Information"
                    description="Student contact details"
                  />

                  <Input
                    name="email"
                    label="Email Address"
                    type="email"
                    form={form}
                    onChange={handleChange}
                    icon={<Mail size={15} />}
                  />

                  <Input
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    form={form}
                    onChange={handleChange}
                    icon={<Phone size={15} />}
                  />

                  {/* CLASSIFICATION */}

                  <Section
                    icon={<ShieldCheck size={16} />}
                    title="Risk Classification"
                    description="Behavioral monitoring level"
                  />

                  <RiskSelector
                    value={form.riskLevel}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        riskLevel: value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* ================= NOTES ================= */}

              <div className="space-y-4">
                <Section
                  icon={<FileText size={16} />}
                  title="Guidance Notes"
                  description="Optional behavioral observations or remarks"
                />

                <div className="relative">
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Add behavioral notes, guidance remarks, observations, or other relevant information..."
                    className="
                      w-full
                      min-h-[130px]
                      resize-none
                      px-4
                      py-3.5
                      rounded-2xl
                      bg-white/80
                      border border-slate-200
                      text-sm
                      text-slate-800
                      placeholder:text-slate-400
                      outline-none
                      transition
                      focus:border-green-400
                      focus:ring-4
                      focus:ring-green-100
                    "
                  />

                  <span className="absolute bottom-3 right-3 text-[10px] text-slate-400">
                    Optional
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= FOOTER ================= */}

          <div
            className="
              px-6 sm:px-8
              py-4
              border-t border-slate-200/70
              bg-white/70
              backdrop-blur-xl
              flex
              flex-col-reverse sm:flex-row
              justify-between
              items-center
              gap-3
            "
          >
            <p className="text-xs text-slate-400 hidden sm:block">
              {isEditing
                ? "Changes will be saved to the student record."
                : "Make sure the student information is accurate before saving."}
            </p>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="
                  flex-1 sm:flex-none
                  px-5
                  py-2.5
                  rounded-xl
                  bg-white
                  border border-slate-200
                  text-slate-600
                  text-sm
                  font-medium
                  hover:bg-slate-50
                  transition
                  disabled:opacity-50
                "
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
                  shadow-green-200/60
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

const Section = ({ icon, title, description }) => (
  <div className="flex items-start gap-3">
    <div
      className="
        w-9 h-9
        rounded-xl
        bg-green-50
        border border-green-100
        text-green-700
        flex items-center justify-center
        flex-shrink-0
      "
    >
      {icon}
    </div>

    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>

      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
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
}) => (
  <div>
    <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 mb-1.5">
      {label}

      {required && <span className="text-red-400">*</span>}
    </label>

    <div className="relative">
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
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
          bg-white/80
          border border-slate-200
          text-sm
          text-slate-800
          placeholder:text-slate-400
          outline-none
          transition
          hover:border-slate-300
          focus:border-green-400
          focus:ring-4
          focus:ring-green-100
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
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}
    </label>

    <select
      name={name}
      value={value}
      onChange={onChange}
      className="
        w-full
        px-4
        py-3
        rounded-xl
        bg-white/80
        border border-slate-200
        text-sm
        text-slate-800
        outline-none
        transition
        hover:border-slate-300
        focus:border-green-400
        focus:ring-4
        focus:ring-green-100
      "
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

const RiskSelector = ({ value, onChange }) => {
  const risks = [
    {
      value: "Low",
      label: "Low Risk",
      description: "No immediate concerns",
      icon: <Check size={16} />,
      classes:
        "border-green-300 bg-green-50 text-green-700 ring-2 ring-green-100",
    },
    {
      value: "Medium",
      label: "Medium Risk",
      description: "Requires monitoring",
      icon: <AlertTriangle size={16} />,
      classes:
        "border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-100",
    },
    {
      value: "High",
      label: "High Risk",
      description: "Needs attention",
      icon: <AlertCircle size={16} />,
      classes: "border-red-300 bg-red-50 text-red-700 ring-2 ring-red-100",
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
                  ? risk.classes
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
                    ? "bg-white/70"
                    : "bg-slate-50 text-slate-400"
                }
              `}
            >
              {risk.icon}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">{risk.label}</p>

              <p
                className={`text-[11px] mt-0.5 ${
                  active ? "opacity-70" : "text-slate-400"
                }`}
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

const RiskPreview = ({ level }) => {
  const config = {
    Low: {
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
      dot: "bg-green-500",
    },
    Medium: {
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      dot: "bg-orange-500",
    },
    High: {
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-500",
    },
  };

  const c = config[level] || config.Low;

  return (
    <div
      className={`
        px-4
        py-3
        rounded-2xl
        ${c.bg}
        border ${c.border}
        min-w-[130px]
      `}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-60">
        Risk Level
      </p>

      <div className={`flex items-center gap-2 mt-1 ${c.color}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />

        <span className="text-sm font-bold">{level}</span>
      </div>
    </div>
  );
};

export default StudentModal;