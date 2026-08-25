import { useState } from "react";
import {
  ShieldCheck,
  LockKeyhole,
  Clock3,
  KeyRound,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

/* =========================================================
   TOGGLE
========================================================= */

const Toggle = ({ defaultChecked = false }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="sr-only peer"
    />

    <div
      className="
        w-11
        h-6
        rounded-full
        bg-gray-200
        peer-checked:bg-green-600
        transition-all
        duration-200
      "
    />

    <div
      className="
        absolute
        left-0.5
        top-0.5
        w-5
        h-5
        rounded-full
        bg-white
        shadow-sm
        transition-transform
        duration-200
        peer-checked:translate-x-5
      "
    />
  </label>
);

/* =========================================================
   SECURITY
========================================================= */

const Security = () => {
  const { changePassword, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdatePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return toast.error("Please fill in all fields.");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    try {
      await changePassword(oldPassword, newPassword);

      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      // Error already handled in authStore
    }
  };

  const securityOptions = [
    {
      label: "Two-Factor Authentication",
      description:
        "Add an additional verification step when signing in.",
      icon: <ShieldCheck size={18} />,
      enabled: true,
      status: "Protected",
    },
    {
      label: "Session Timeout Protection",
      description:
        "Automatically protect inactive administrator sessions.",
      icon: <Clock3 size={18} />,
      enabled: true,
      status: "Enabled",
    },
    {
      label: "Password Recovery Options",
      description:
        "Allow account recovery through configured recovery methods.",
      icon: <KeyRound size={18} />,
      enabled: false,
      status: "Disabled",
    },
  ];

  return (
    <div className="w-full text-gray-900">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-6 mb-7">
        <div className="flex items-start gap-4">
          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-green-50
              text-green-600
              flex
              items-center
              justify-center
              border
              border-green-100
              flex-shrink-0
            "
          >
            <ShieldCheck size={21} strokeWidth={2.2} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              Security & Protection
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Manage authentication, sessions, and account protection.
            </p>
          </div>
        </div>

        {/* SECURITY STATUS */}

        <div
          className="
            hidden
            sm:flex
            items-center
            gap-2
            px-3
            py-2
            rounded-xl
            bg-green-50
            border
            border-green-100
            text-xs
            font-semibold
            text-green-700
          "
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Security Active
        </div>
      </div>

      {/* =====================================================
          SECURITY OVERVIEW
      ===================================================== */}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">
        <SecuritySummary
          icon={<ShieldCheck size={18} />}
          label="Account Protection"
          value="Protected"
          description="Your security controls are active."
        />

        <SecuritySummary
          icon={<LockKeyhole size={18} />}
          label="Authentication"
          value="Secure"
          description="Additional authentication is enabled."
        />

        <SecuritySummary
          icon={<Clock3 size={18} />}
          label="Session Security"
          value="Enabled"
          description="Inactive sessions are protected."
        />
      </div>

      {/* =====================================================
          SECURITY CONTROLS
      ===================================================== */}

      <section
        className="
          bg-white
          border
          border-gray-100
          rounded-3xl
          p-6
          shadow-[0_4px_24px_rgba(0,0,0,0.025)]
          mb-7
        "
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Security Controls
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Configure the protection features available to your account.
            </p>
          </div>

          <ShieldAlert
            size={19}
            className="text-gray-300"
          />
        </div>

        <div className="space-y-2">
          {securityOptions.map((item) => (
            <SecurityOption
              key={item.label}
              {...item}
            />
          ))}
        </div>
      </section>

      {/* =====================================================
          CHANGE PASSWORD
      ===================================================== */}

      <section
        className="
          bg-white
          border
          border-gray-100
          rounded-3xl
          p-6
          shadow-[0_4px_24px_rgba(0,0,0,0.025)]
        "
      >
        {/* SECTION HEADER */}

        <div className="flex items-start gap-3 mb-6">
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-gray-100
              text-gray-600
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <LockKeyhole size={18} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Change Password
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              Update your administrator password to keep your account secure.
            </p>
          </div>
        </div>

        {/* PASSWORD FIELDS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field
            label="Current Password"
            type="password"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
          />

          <Field
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
          />

          <Field
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        {/* PASSWORD REQUIREMENT */}

        <div
          className="
            mt-5
            flex
            items-center
            gap-2
            px-4
            py-3
            rounded-2xl
            bg-gray-50
            border
            border-gray-100
          "
        >
          <CheckCircle2
            size={15}
            className="text-green-500 flex-shrink-0"
          />

          <p className="text-xs text-gray-500">
            Password must contain at least 6 characters.
          </p>
        </div>

        {/* ACTION */}

        <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleUpdatePassword}
            disabled={isLoading}
            className="
              flex
              items-center
              justify-center
              gap-2
              px-5
              py-2.5
              rounded-xl
              bg-green-600
              hover:bg-green-700
              disabled:bg-green-400
              disabled:cursor-not-allowed
              text-white
              text-sm
              font-semibold
              shadow-sm
              hover:shadow-md
              transition-all
              duration-200
            "
          >
            <LockKeyhole size={16} />

            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Security;

/* =========================================================
   SECURITY SUMMARY
========================================================= */

const SecuritySummary = ({
  icon,
  label,
  value,
  description,
}) => (
  <div
    className="
      bg-white
      border
      border-gray-100
      rounded-3xl
      p-5
      shadow-[0_4px_24px_rgba(0,0,0,0.025)]
    "
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          {label}
        </p>

        <p className="text-lg font-extrabold text-green-600 mt-2">
          {value}
        </p>
      </div>

      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-green-50
          text-green-600
          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>
    </div>

    <p className="text-[11px] text-gray-400 mt-4">
      {description}
    </p>

    <div className="mt-4 h-1 w-10 rounded-full bg-green-500" />
  </div>
);

/* =========================================================
   SECURITY OPTION
========================================================= */

const SecurityOption = ({
  label,
  description,
  icon,
  enabled,
  status,
}) => (
  <div
    className="
      group
      flex
      items-center
      justify-between
      gap-4
      p-4
      rounded-2xl
      border
      border-gray-100
      bg-gray-50/70
      hover:bg-white
      hover:border-green-100
      hover:shadow-sm
      transition-all
      duration-200
    "
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`
          w-10
          h-10
          rounded-xl
          flex
          items-center
          justify-center
          flex-shrink-0
          ${
            enabled
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-400"
          }
        `}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">
            {label}
          </p>

          <span
            className={`
              hidden
              sm:inline-flex
              px-2
              py-0.5
              rounded-md
              text-[9px]
              font-bold
              uppercase
              tracking-wide
              ${
                enabled
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-400"
              }
            `}
          >
            {status}
          </span>
        </div>

        <p className="text-[11px] text-gray-400 mt-1">
          {description}
        </p>
      </div>
    </div>

    <Toggle defaultChecked={enabled} />
  </div>
);

/* =========================================================
   FIELD
========================================================= */

const Field = ({
  label,
  type = "text",
  name,
  value,
  onChange,
}) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        className="
          w-full
          bg-gray-50
          border
          border-gray-200
          rounded-xl
          px-4
          py-3
          text-sm
          text-gray-900
          placeholder-gray-400
          focus:outline-none
          focus:ring-2
          focus:ring-green-500/20
          focus:border-green-500
          focus:bg-white
          transition-all
          duration-200
        "
      />
    </div>
  );
};