import { Bell } from "lucide-react";

const Toggle = ({ defaultChecked = false }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />

    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
    peer-checked:bg-green-500 transition-all duration-300"></div>

    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm
    transition-all duration-300 peer-checked:translate-x-5"></div>
  </label>
);

const Notifications = () => {
  return (
    <div className="flex-1 w-full h-full bg-gray-50 text-gray-900 p-6 overflow-y-auto">

      {/* HEADER */}
      <div className="mb-6 flex items-start gap-4">

        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Bell className="text-green-600" size={20} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold">Notification Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage alerts and system notifications for the platform.
          </p>
        </div>

      </div>

      {/* MAIN CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

        {/* TOGGLES */}
        <div className="space-y-3 mb-8">

          {[
            "Email Alerts for New Incidents",
            "High-Risk Student Alerts",
            "Report Outcome Prediction",
            "System Security Warnings",
          ].map((label, index) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition"
            >
              <span className="text-sm text-gray-700 font-medium">
                {label}
              </span>

              <Toggle defaultChecked={index < 2} />
            </div>
          ))}

        </div>

        {/* RECIPIENTS */}
        <div className="border-t border-gray-100 pt-6">

          <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4">
            Notification Recipients
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <Field label="Admin Email" placeholder="admin@email.com" />
            <Field label="Guidance Office Email" placeholder="guidance@email.com" />

          </div>

        </div>

        {/* SAVE ACTION */}
        <div className="mt-8 flex justify-end border-t border-gray-100 pt-5">

          <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-xl shadow-sm transition">
            Save Changes
          </button>

        </div>

      </div>
    </div>
  );
};

export default Notifications;

/* ================= FIELD ================= */
const Field = ({ label, placeholder }) => {
  return (
    <div>
      <label className="text-sm text-gray-600 font-medium">
        {label}
      </label>

      <input
        type="text"
        placeholder={placeholder}
        className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
        text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
        focus:ring-green-500 focus:border-green-500 transition"
      />
    </div>
  );
};