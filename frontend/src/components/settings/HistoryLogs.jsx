import { Clock, Filter, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { API } from "../lib/api";;

const HistoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await API.get("/api/history", {
        params: {
          ...(category && { category }),
          ...(role && { role }),
        },
        withCredentials: true,
      });

      const data = Array.isArray(res.data) ? res.data : res.data.logs || [];
      setLogs(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch history logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category, role]);

  const totalPages = Math.ceil(logs.length / logsPerPage);
  const currentLogs = logs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  return (
    <div className="flex-1 w-full h-full bg-gray-50 text-gray-900 p-6 overflow-y-auto">

      {/* HEADER */}
      <div className="mb-6 flex items-start gap-4">

        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Clock className="text-green-600" size={20} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold">System History Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track system activity, user actions, and audit events.
          </p>
        </div>

      </div>

      {/* MAIN CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

        {/* FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-6">

          <div className="flex flex-wrap gap-3">

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
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
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Users</option>
              <option value="Admin">Admin</option>
              <option value="Guidance">Guidance</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>

          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            <Filter size={16} />
            {loading ? "Loading..." : "Apply Filters"}
          </button>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-3 font-medium">Date & Time</th>
                <th className="py-3 font-medium">Role</th>
                <th className="py-3 font-medium">Action</th>
                <th className="py-3 font-medium">Details</th>
              </tr>
            </thead>

            <tbody>

              {currentLogs.map((log) => (
                <tr
                  key={log._id || log.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-3 text-gray-600">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString()
                      : "—"}
                  </td>

                  <td className="py-3 font-medium text-green-700">
                    {log.role || "—"}
                  </td>

                  <td className="py-3 text-gray-800">
                    {log.action || "—"}
                  </td>

                  <td className="py-3 text-gray-600 flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    {log.details || "—"}
                  </td>
                </tr>
              ))}

              {!loading && currentLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    No history logs found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">

            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-sm text-gray-500 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default HistoryLogs;