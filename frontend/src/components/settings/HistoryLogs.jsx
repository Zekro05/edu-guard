import { Clock, Filter, FileText } from "lucide-react";

const HistoryLogs = () => {
  return (
    <div className="bg-white rounded-xl border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-green-700" size={22} />
        <h2 className="text-lg font-semibold text-gray-800">
          System History Logs
        </h2>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Track all system activities including logins, incident reports,
        data changes, and administrative actions.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-600">
          <option>All Actions</option>
          <option>Login / Logout</option>
          <option>Incident Reports</option>
          <option>Student Updates</option>
          <option>System Changes</option>
        </select>

        <select className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-600">
          <option>All Users</option>
          <option>Admin</option>
          <option>Guidance</option>
          <option>Teacher</option>
        </select>

        <button className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 transition">
          <Filter size={16} />
          Apply Filter
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left px-4 py-3">Date & Time</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hover:bg-gray-50">
              <td className="px-4 py-3">2026-02-06 09:12 AM</td>
              <td className="px-4 py-3">Admin</td>
              <td className="px-4 py-3">Login</td>
              <td className="px-4 py-3 flex items-center gap-2">
                <FileText size={14} />
                Successful login
              </td>
            </tr>

            <tr className="border-t hover:bg-gray-50">
              <td className="px-4 py-3">2026-02-06 10:05 AM</td>
              <td className="px-4 py-3">Guidance</td>
              <td className="px-4 py-3">Incident Report</td>
              <td className="px-4 py-3">New incident added</td>
            </tr>

            <tr className="border-t hover:bg-gray-50">
              <td className="px-4 py-3">2026-02-06 11:30 AM</td>
              <td className="px-4 py-3">Admin</td>
              <td className="px-4 py-3">System Update</td>
              <td className="px-4 py-3">Backup initiated</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryLogs;