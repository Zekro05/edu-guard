import { Bell } from "lucide-react";

const Toggle = () => (
  <input
    type="checkbox"
    className="w-10 h-5 rounded-full appearance-none bg-gray-300 checked:bg-green-600 cursor-pointer transition relative
    before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition checked:before:translate-x-5"
  />
);

const Notifications = () => {
  return (
    <div className="bg-white rounded-xl border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Bell className="text-green-700" size={22} />
        <h2 className="text-lg font-semibold text-gray-800">
          Notification Settings
        </h2>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Configure alerts and notifications for incidents and system events.
      </p>

      {/* Toggles */}
      <div className="space-y-4 mb-8">
        {[
          "Email Alerts for New Incidents",
          "High-Risk Student Alerts",
          "Report Outcome Prediction",
          "Platform Warnings",
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

      {/* Recipients */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          Notification Recipients
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@email.com"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Guidance Email
            </label>
            <input
              type="email"
              placeholder="guidance@email.com"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;