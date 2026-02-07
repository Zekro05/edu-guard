import { ShieldCheck } from "lucide-react";

const Toggle = () => (
  <input
    type="checkbox"
    className="w-10 h-5 rounded-full appearance-none bg-gray-300 checked:bg-green-600 cursor-pointer transition relative
    before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition checked:before:translate-x-5"
  />
);

const Security = () => {
  return (
    <div className="bg-white rounded-xl border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-green-700" size={22} />
        <h2 className="text-lg font-semibold text-gray-800">
          Security Settings
        </h2>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Enhance account and system security configurations.
      </p>

      {/* Security Options */}
      <div className="space-y-4 mb-8">
        {[
          "Two-Factor Authentication",
          "Session Timeout",
          "Password Recovery",
        ].map((label) => (
          <div
            key={label}
            className="flex items-center justify-between border rounded-lg px-4 py-3"
          >
            <span className="text-sm text-gray-700">{label}</span>
            <Toggle />
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">
          Change Password
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="password"
            placeholder="Current Password"
            className="border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
          <input
            type="password"
            placeholder="New Password"
            className="border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
          />
        </div>

        <button className="mt-5 bg-green-700 text-white px-5 py-2 rounded-md text-sm hover:bg-green-800 transition">
          Update Password
        </button>
      </div>
    </div>
  );
};

export default Security;