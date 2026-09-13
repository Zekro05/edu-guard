import { useEffect, useState } from "react";
import {
  ShieldCheck,
  LockKeyhole,
  Clock3,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

/* =========================================================
   TOGGLE
========================================================= */

const Toggle = ({
  checked,
  onToggle,
  disabled = false,
}) => {
  return (
    <label
      className={`relative inline-flex items-center ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked === true}
        onChange={onToggle}
        disabled={disabled}
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
};

/* =========================================================
   SECURITY
========================================================= */

const Security = () => {
  const {
    changePassword,
    isLoading,
    securitySettings,
    getSecuritySettings,
    updateSecuritySettings,
  } = useAuthStore();

  const [loadingSecurity, setLoadingSecurity] =
    useState(true);

  const [updatingSetting, setUpdatingSetting] =
    useState(null);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoadingSecurity(true);

        await getSecuritySettings();
      } catch (error) {
        console.error(
          "FAILED TO LOAD SECURITY SETTINGS:",
          error,
        );

        if (mounted) {
          toast.error(
            "Failed to load security settings.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingSecurity(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [getSecuritySettings]);

  /* =========================================================
     PASSWORD FORM
  ========================================================= */

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* =========================================================
     UPDATE PASSWORD
  ========================================================= */

  const handleUpdatePassword = async () => {
    const {
      oldPassword,
      newPassword,
      confirmPassword,
    } = formData;

    if (
      !oldPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return toast.error(
        "Please fill in all fields.",
      );
    }

    if (newPassword !== confirmPassword) {
      return toast.error(
        "Passwords do not match.",
      );
    }

    if (newPassword.length < 6) {
      return toast.error(
        "Password must be at least 6 characters.",
      );
    }

    try {
      await changePassword(
        oldPassword,
        newPassword,
      );

      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      // Error already handled by authStore
    }
  };

  /* =========================================================
     UPDATE SECURITY SETTING
  ========================================================= */

  const handleSecurityToggle = async (
    settingName,
    newValue,
  ) => {
    if (updatingSetting) {
      return;
    }

    console.log(
      "====================================",
    );

    console.log(
      "🔐 SECURITY SETTING CHANGE",
    );

    console.log(
      "Setting:",
      settingName,
    );

    console.log(
      "New value:",
      newValue,
    );

    console.log(
      "Value type:",
      typeof newValue,
    );

    console.log(
      "====================================",
    );

    try {
      setUpdatingSetting(settingName);

      /*
        Send the EXACT boolean value to the backend.
      */

      const response =
        await updateSecuritySettings({
          [settingName]: Boolean(newValue),
        });

      console.log(
        "====================================",
      );

      console.log(
        "✅ SECURITY SETTING RESPONSE",
      );

      console.log(response);

      console.log(
        "====================================",
      );

      toast.success(
        newValue
          ? "Security protection enabled"
          : "Security protection disabled",
      );
    } catch (error) {
      console.error(
        "====================================",
      );

      console.error(
        "❌ SECURITY SETTING UPDATE FAILED",
      );

      console.error(
        error?.response?.data ||
          error?.message ||
          error,
      );

      console.error(
        "====================================",
      );

      toast.error(
        "Failed to update security setting.",
      );
    } finally {
      setUpdatingSetting(null);
    }
  };

  /* =========================================================
     SECURITY VALUES
  ========================================================= */

  const twoFactorEnabled =
    securitySettings?.twoFactorEnabled !== false;

  const sessionTimeoutEnabled =
    securitySettings?.sessionTimeoutEnabled !== false;

  /* =========================================================
     SECURITY OPTIONS
  ========================================================= */

  const securityOptions = [
    {
      key: "twoFactorEnabled",

      label: "Two-Factor Authentication",

      description:
        "Add an additional verification step when signing in.",

      icon: <ShieldCheck size={18} />,

      enabled: twoFactorEnabled,

      status: twoFactorEnabled
        ? "Protected"
        : "Disabled",
    },

    {
      key: "sessionTimeoutEnabled",

      label: "Session Timeout Protection",

      description:
        "Automatically protect inactive administrator sessions.",

      icon: <Clock3 size={18} />,

      enabled: sessionTimeoutEnabled,

      status: sessionTimeoutEnabled
        ? "Enabled"
        : "Disabled",
    },
  ];

  /* =========================================================
     SECURITY STATUS
  ========================================================= */

  const allSecurityActive =
    twoFactorEnabled &&
    sessionTimeoutEnabled;

  const authenticationStatus =
    twoFactorEnabled
      ? "Secure"
      : "Basic";

  const authenticationDescription =
    twoFactorEnabled
      ? "Additional authentication is enabled."
      : "Two-factor authentication is disabled.";

  const sessionStatus =
    sessionTimeoutEnabled
      ? "Enabled"
      : "Disabled";

  const sessionDescription =
    sessionTimeoutEnabled
      ? "Inactive sessions are protected."
      : "Automatic inactivity logout is disabled.";

  /* =========================================================
     RENDER
  ========================================================= */

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
            <ShieldCheck
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              Security & Protection
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Manage authentication, sessions,
              and account protection.
            </p>
          </div>
        </div>

        {/* SECURITY STATUS */}

        <div
          className={`
            hidden
            sm:flex
            items-center
            gap-2
            px-3
            py-2
            rounded-xl
            border
            text-xs
            font-semibold
            ${
              allSecurityActive
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-yellow-50 border-yellow-100 text-yellow-700"
            }
          `}
        >
          <span
            className={`
              w-2
              h-2
              rounded-full
              ${
                allSecurityActive
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }
            `}
          />

          {allSecurityActive
            ? "Security Active"
            : "Security Partially Active"}
        </div>
      </div>

      {/* =====================================================
          SECURITY OVERVIEW
      ===================================================== */}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">

        <SecuritySummary
          icon={<ShieldCheck size={18} />}
          label="Account Protection"
          value={
            allSecurityActive
              ? "Protected"
              : "Partial"
          }
          description={
            allSecurityActive
              ? "Your security controls are active."
              : "Some security controls are disabled."
          }
        />

        <SecuritySummary
          icon={<LockKeyhole size={18} />}
          label="Authentication"
          value={authenticationStatus}
          description={
            authenticationDescription
          }
        />

        <SecuritySummary
          icon={<Clock3 size={18} />}
          label="Session Security"
          value={sessionStatus}
          description={sessionDescription}
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
              Configure the protection features
              available to your account.
            </p>
          </div>

          <ShieldAlert
            size={19}
            className="text-gray-300"
          />

        </div>

        {loadingSecurity ? (
          <div className="space-y-2">
            <SecurityOptionSkeleton />
            <SecurityOptionSkeleton />
          </div>
        ) : (
          <div className="space-y-2">

            {securityOptions.map((item) => (
              <SecurityOption
                key={item.key}
                {...item}
                loading={
                  updatingSetting === item.key
                }
                onToggle={(value) =>
                  handleSecurityToggle(
                    item.key,
                    value,
                  )
                }
              />
            ))}

          </div>
        )}

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
              Update your administrator password
              to keep your account secure.
            </p>
          </div>

        </div>

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
            Password must contain at least
            6 characters.
          </p>

        </div>

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

            {isLoading
              ? "Updating..."
              : "Update Password"}

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
  onToggle,
  loading,
}) => {
  return (
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

      {/* =====================================================
          IMPORTANT TOGGLE FIX

          Instead of trusting e.target.checked,
          calculate the next value from the CURRENT
          enabled state.

          ON  -> !true  = false
          OFF -> !false = true
      ===================================================== */}

      <Toggle
        checked={enabled}
        disabled={loading}
        onToggle={() => {
          const nextValue = !enabled;

          console.log(
            "🔄 TOGGLE CLICKED"
          );

          console.log(
            "Current:",
            enabled
          );

          console.log(
            "Next:",
            nextValue
          );

          onToggle(nextValue);
        }}
      />

    </div>
  );
};

/* =========================================================
   SECURITY OPTION SKELETON
========================================================= */

const SecurityOptionSkeleton = () => (
  <div
    className="
      flex
      items-center
      justify-between
      gap-4
      p-4
      rounded-2xl
      border
      border-gray-100
      bg-gray-50/70
      animate-pulse
    "
  >

    <div className="flex items-center gap-3 w-full">

      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-gray-200
          flex-shrink-0
        "
      />

      <div className="flex-1">

        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />

        <div className="h-3 w-72 max-w-full bg-gray-200 rounded" />

      </div>

    </div>

    <div className="w-11 h-6 rounded-full bg-gray-200 flex-shrink-0" />

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

