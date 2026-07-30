import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore"; // Adjust path if needed

const Toggle = ({ defaultChecked = false }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="sr-only peer"
    />

    <div
      className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full
      peer-checked:bg-green-500 transition"
    ></div>

    <div
      className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm
      transition peer-checked:translate-x-5"
    ></div>
  </label>
);

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

  return (
    <div className="flex-1 w-full h-full bg-gray-50 text-gray-900 p-6 overflow-y-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-start gap-4">
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <ShieldCheck className="text-green-600" size={20} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold">Security Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage authentication, session rules, and account protection.
          </p>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        {/* SECURITY OPTIONS */}
        <div className="space-y-3 mb-8">
          {[
            {
              label: "Two-Factor Authentication",
              enabled: true,
            },
            {
              label: "Session Timeout Protection",
              enabled: true,
            },
            {
              label: "Password Recovery Options",
              enabled: false,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition"
            >
              <span className="text-sm font-medium text-gray-700">
                {item.label}
              </span>

              <Toggle defaultChecked={item.enabled} />
            </div>
          ))}
        </div>

        {/* PASSWORD SECTION */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4">
            Change Password
          </h3>

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

          {/* ACTION */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpdatePassword}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-xl shadow-sm transition"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;

/* ================= FIELD ================= */

const Field = ({
  label,
  type = "text",
  name,
  value,
  onChange,
}) => {
  return (
    <div>
      <label className="text-sm text-gray-600 font-medium">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
        text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
        focus:ring-green-500 focus:border-green-500 transition"
      />
    </div>
  );
};