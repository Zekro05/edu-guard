import { ShieldCheck } from "lucide-react";

const Toggle = () => (
  <input
    type="checkbox"
    className="w-10 h-5 rounded-full appearance-none bg-white/10 border border-white/10 checked:bg-green-500 cursor-pointer transition relative
    before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition checked:before:translate-x-5"
  />
);

const Security = () => {
  return (
    <div className="flex-1 w-full h-full text-white p-6 overflow-y-auto">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 border border-white/10 rounded-xl">
            <ShieldCheck className="text-green-400" size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Security Settings</h1>
            <p className="text-sm text-gray-400">
              Manage account protection and system security rules.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-6">

        {/* SECURITY OPTIONS */}
        <div className="space-y-4 mb-10">

          {[
            "Two-Factor Authentication",
            "Session Timeout",
            "Password Recovery",
          ].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <span className="text-sm text-gray-200">{label}</span>
              <Toggle />
            </div>
          ))}
        </div>

        {/* PASSWORD SECTION */}
        <div>
          <h3 className="text-green-400 font-semibold mb-4">
            Change Password
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <input
              type="password"
              placeholder="Current Password"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none"
            />

            <input
              type="password"
              placeholder="New Password"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-green-500 outline-none"
            />

          </div>

          <div className="mt-6 flex justify-end">
            <button className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-lg transition">
              Update Password
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Security;