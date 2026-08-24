import { useEffect, useMemo, useState } from "react";

import {
  Bell,
  Save,
  Mail,
  ShieldAlert,
  Brain,
  LockKeyhole,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { API } from "../../lib/api.js";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  emailAlerts: true,
  highRiskAlerts: true,
  aiPredictionAlerts: false,
  securityWarnings: false,
  adminEmail: "",
  guidanceEmail: "",
};

/* =========================================================
   TOGGLE
========================================================= */

const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative
        inline-flex
        h-6
        w-11
        flex-shrink-0
        items-center
        rounded-full
        transition-all
        duration-200
        ease-in-out
        focus:outline-none
        focus:ring-2
        focus:ring-green-200
        ${
          checked
            ? "bg-green-500"
            : "bg-gray-200"
        }
        ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }
      `}
    >
      <span
        className={`
          inline-block
          h-5
          w-5
          transform
          rounded-full
          bg-white
          shadow-sm
          transition-transform
          duration-200
          ease-in-out
          ${
            checked
              ? "translate-x-5"
              : "translate-x-0.5"
          }
        `}
      />
    </button>
  );
};

/* =========================================================
   NOTIFICATIONS
========================================================= */

const Notifications = () => {
  const [settings, setSettings] = useState(
    DEFAULT_SETTINGS
  );

  const [savedSettings, setSavedSettings] = useState(
    DEFAULT_SETTINGS
  );

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     LOAD SETTINGS
  ===================================================== */

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await API.get(
          "/api/settings/notifications"
        );

        const loadedSettings = {
          ...DEFAULT_SETTINGS,
          ...(response.data?.settings || {}),
        };

        setSettings(loadedSettings);
        setSavedSettings(loadedSettings);
      } catch (error) {
        console.error(
          "Failed to load notification settings:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            "Failed to load notification settings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  /* =====================================================
     ADMIN NOTIFICATION OPTIONS
  ===================================================== */

  const notificationOptions = [
    {
      key: "emailAlerts",
      label: "New Incident Alerts",
      description:
        "Notify administrators when a new incident report is submitted.",
      icon: <Mail size={17} strokeWidth={2} />,
    },
    {
      key: "highRiskAlerts",
      label: "High-Risk Student Alerts",
      description:
        "Notify administrators when a student is identified as high risk.",
      icon: <ShieldAlert size={17} strokeWidth={2} />,
    },
    {
      key: "aiPredictionAlerts",
      label: "AI Prediction Alerts",
      description:
        "Notify administrators when AI-generated report predictions are available.",
      icon: <Brain size={17} strokeWidth={2} />,
    },
    {
      key: "securityWarnings",
      label: "System Security Warnings",
      description:
        "Notify administrators about important security-related activity.",
      icon: <LockKeyhole size={17} strokeWidth={2} />,
    },
  ];

  /* =====================================================
     UPDATE SETTING
  ===================================================== */

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSaveMessage("");
    setErrorMessage("");
  };

  /* =====================================================
     UNSAVED CHANGES
  ===================================================== */

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(settings) !==
      JSON.stringify(savedSettings)
    );
  }, [settings, savedSettings]);

  /* =====================================================
     NOTIFICATIONS ACTIVE
  ===================================================== */

  const notificationsActive = useMemo(() => {
    return (
      settings.emailAlerts ||
      settings.highRiskAlerts ||
      settings.aiPredictionAlerts ||
      settings.securityWarnings
    );
  }, [settings]);

  /* =====================================================
     SAVE SETTINGS
  ===================================================== */

  const handleSave = async () => {
    if (!hasChanges) {
      setSaveMessage(
        "Your notification settings are already up to date."
      );

      setTimeout(() => {
        setSaveMessage("");
      }, 2500);

      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage("");
      setErrorMessage("");

      const response = await API.put(
        "/api/settings/notifications",
        settings
      );

      const updatedSettings = {
        ...DEFAULT_SETTINGS,
        ...(response.data?.settings || settings),
      };

      setSettings(updatedSettings);
      setSavedSettings(updatedSettings);

      setSaveMessage(
        "Admin notification settings saved successfully."
      );

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Failed to save notification settings:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to save notification settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =====================================================
     RESET
  ===================================================== */

  const handleReset = () => {
    setSettings(savedSettings);
    setSaveMessage("");
    setErrorMessage("");
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div
              className="
                w-8
                h-8
                border-2
                border-green-200
                border-t-green-600
                rounded-full
                animate-spin
              "
            />

            <p className="text-sm text-gray-400">
              Loading notification settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div className="w-full text-gray-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between gap-6 mb-8">

        <div className="flex items-center gap-4">

          <div
            className="
              w-11
              h-11
              rounded-xl
              bg-green-50
              text-green-600
              border
              border-green-100
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <Bell size={20} strokeWidth={2.1} />
          </div>

          <div>

            <h1
              className="
                text-xl
                font-black
                tracking-tight
                text-gray-900
              "
            >
              Notification Settings
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Manage administrator alerts and system
              notifications for the platform.
            </p>

          </div>

        </div>

        {/* =====================================================
            STATUS
        ===================================================== */}

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
            ${
              notificationsActive
                ? "bg-green-50 border-green-100"
                : "bg-gray-50 border-gray-100"
            }
          `}
        >
          <span
            className={`
              w-2
              h-2
              rounded-full
              ${
                notificationsActive
                  ? "bg-green-500"
                  : "bg-gray-400"
              }
            `}
          />

          <span className="text-xs font-medium text-gray-500">
            {notificationsActive
              ? "Admin Alerts Active"
              : "Admin Alerts Disabled"}
          </span>
        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (
        <div
          className="
            mb-6
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-xl
            bg-red-50
            border
            border-red-100
            text-red-600
          "
        >
          <AlertCircle size={17} />

          <p className="text-sm font-medium">
            {errorMessage}
          </p>
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {saveMessage && (
        <div
          className="
            mb-6
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-xl
            bg-green-50
            border
            border-green-100
            text-green-700
          "
        >
          <CheckCircle2 size={17} />

          <p className="text-sm font-medium">
            {saveMessage}
          </p>
        </div>
      )}

      {/* =====================================================
          ADMIN ALERT PREFERENCES
      ===================================================== */}

      <section
        className="
          border
          border-gray-100
          rounded-2xl
          overflow-hidden
          bg-white
        "
      >

        <div
          className="
            px-5
            py-4
            bg-gray-50/70
            border-b
            border-gray-100
          "
        >
          <h2 className="text-sm font-bold text-gray-900">
            Admin Alert Preferences
          </h2>

          <p className="text-xs text-gray-400 mt-0.5">
            Choose which events should trigger alerts for
            administrators.
          </p>
        </div>

        <div className="p-5 space-y-3">

          {notificationOptions.map((option) => {

            const isEnabled = Boolean(
              settings[option.key]
            );

            return (
              <div
                key={option.key}
                className={`
                  group
                  flex
                  items-center
                  justify-between
                  gap-5
                  p-4
                  rounded-xl
                  border
                  ${
                    isEnabled
                      ? "border-green-100 bg-green-50/30"
                      : "border-gray-100 bg-white"
                  }
                  hover:bg-gray-50
                  hover:border-gray-200
                  transition-all
                  duration-200
                `}
              >

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <div className="flex items-center gap-3 min-w-0">

                  <div
                    className={`
                      w-9
                      h-9
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                      transition-all
                      duration-200
                      ${
                        isEnabled
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }
                    `}
                  >
                    {option.icon}
                  </div>

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">

                      <p className="text-sm font-semibold text-gray-800">
                        {option.label}
                      </p>

                      {isEnabled && (
                        <span
                          className="
                            hidden
                            sm:inline-flex
                            items-center
                            px-1.5
                            py-0.5
                            rounded-md
                            bg-green-100
                            text-green-600
                            text-[10px]
                            font-bold
                          "
                        >
                          ON
                        </span>
                      )}

                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">
                      {option.description}
                    </p>

                  </div>

                </div>

                {/* =================================================
                    TOGGLE
                ================================================= */}

                <div className="flex-shrink-0">

                  <Toggle
                    checked={isEnabled}
                    onChange={(value) =>
                      updateSetting(
                        option.key,
                        value
                      )
                    }
                    label={option.label}
                    disabled={isSaving}
                  />

                </div>

              </div>
            );
          })}

        </div>

      </section>

      {/* =====================================================
          RECIPIENTS
      ===================================================== */}

      <section
        className="
          mt-8
          border
          border-gray-100
          rounded-2xl
          overflow-hidden
          bg-white
        "
      >

        <div
          className="
            px-5
            py-4
            bg-gray-50/70
            border-b
            border-gray-100
          "
        >
          <h2 className="text-sm font-bold text-gray-900">
            Notification Recipients
          </h2>

          <p className="text-xs text-gray-400 mt-0.5">
            Configure the administrator and guidance office
            email addresses that receive system alerts.
          </p>
        </div>

        <div className="p-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <Field
              label="Admin Email"
              placeholder="admin@email.com"
              value={settings.adminEmail}
              onChange={(value) =>
                updateSetting(
                  "adminEmail",
                  value
                )
              }
              type="email"
            />

            <Field
              label="Guidance Office Email"
              placeholder="guidance@email.com"
              value={settings.guidanceEmail}
              onChange={(value) =>
                updateSetting(
                  "guidanceEmail",
                  value
                )
              }
              type="email"
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          ACTION BAR
      ===================================================== */}

      <div
        className="
          mt-8
          pt-5
          border-t
          border-gray-100
          flex
          items-center
          justify-between
          gap-4
        "
      >

        <div className="flex items-center gap-3">

          <p className="hidden sm:block text-xs text-gray-400">
            {hasChanges
              ? "You have unsaved changes."
              : "Admin notification preferences are up to date."}
          </p>

          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="
                inline-flex
                items-center
                gap-2
                text-gray-500
                hover:text-gray-700
                font-medium
                text-xs
                px-3
                py-2
                rounded-lg
                hover:bg-gray-100
                transition-all
                disabled:opacity-50
              "
            >
              <RotateCcw size={14} />

              Reset
            </button>
          )}

        </div>

        {/* =====================================================
            SAVE BUTTON
        ===================================================== */}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            bg-green-600
            hover:bg-green-700
            disabled:bg-green-400
            disabled:cursor-not-allowed
            text-white
            font-semibold
            text-sm
            px-5
            py-2.5
            rounded-xl
            shadow-sm
            hover:shadow-md
            transition-all
            duration-200
          "
        >

          {isSaving ? (
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

              Saving...
            </>
          ) : (
            <>
              <Save
                size={16}
                strokeWidth={2.2}
              />

              Save Changes
            </>
          )}

        </button>

      </div>

    </div>
  );
};

export default Notifications;

/* =========================================================
   FIELD
========================================================= */

const Field = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}) => {
  return (
    <div>

      <label
        className="
          block
          text-sm
          font-semibold
          text-gray-700
          mb-2
        "
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="
          w-full
          bg-white
          border
          border-gray-200
          rounded-xl
          px-4
          py-3
          text-sm
          text-gray-900
          placeholder-gray-400
          transition-all
          duration-200
          hover:border-gray-300
          focus:outline-none
          focus:ring-2
          focus:ring-green-100
          focus:border-green-500
        "
      />

    </div>
  );
};