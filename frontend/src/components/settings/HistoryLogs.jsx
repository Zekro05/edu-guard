import { Clock, Filter, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { API } from "../../store/authStore";

const HistoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await API.get("/api/history", {
        params: {
          // Send only if value exists
          ...(category && { category }),
          ...(role && { role }),
        },
        withCredentials: true,
      });

      console.log("HISTORY RESPONSE:", res.data);

      // Support both cases: { logs: [...] } or [...] directly
      if (Array.isArray(res.data)) setLogs(res.data);
      else setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Failed to fetch history logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs();
  }, [category, role]);

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
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          <option value="Auth">Login / Logout</option>
          <option value="Incident">Incident Reports</option>
          <option value="Student">Student Updates</option>
          <option value="System">System Changes</option>
        </select>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Users</option>
          <option value="Admin">Admin</option>
          <option value="Guidance">Guidance</option>
          <option value="Teacher">Teacher</option>
          <option value="Student">Student</option>
        </select>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 disabled:opacity-50"
        >
          <Filter size={16} />
          {loading ? "Loading..." : "Apply Filter"}
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left px-4 py-3">Date & Time</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Details</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log._id || log.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  {log.createdAt
                    ? new Date(log.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 font-medium">{log.role || "—"}</td>
                <td className="px-4 py-3">{log.action || "—"}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <FileText size={14} />
                  {log.details || "—"}
                </td>
              </tr>
            ))}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-400">
                  No history logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryLogs;