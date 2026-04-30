import { Clock, Filter, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { API } from "../../store/authStore";

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

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let start = Math.max(currentPage - 2, 1);
    let end = Math.min(start + maxPagesToShow - 1, totalPages);

    if (end - start < maxPagesToShow - 1)
      start = Math.max(end - maxPagesToShow + 1, 1);

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex-1 w-full h-full text-white p-6 overflow-y-auto">

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 border border-white/10 rounded-xl">
            <Clock className="text-green-400" size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">System History Logs</h1>
            <p className="text-sm text-gray-400">
              Track all system activities including logins, reports, and changes.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-6">

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4 mb-6">

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
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
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
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
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <Filter size={16} />
            {loading ? "Loading..." : "Apply Filter"}
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="text-left py-3">Date & Time</th>
                <th className="text-left py-3">Role</th>
                <th className="text-left py-3">Action</th>
                <th className="text-left py-3">Details</th>
              </tr>
            </thead>

            <tbody>

              {currentLogs.map((log) => (
                <tr
                  key={log._id || log.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="py-3 text-gray-300">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString()
                      : "—"}
                  </td>

                  <td className="py-3 text-green-400 font-medium">
                    {log.role || "—"}
                  </td>

                  <td className="py-3 text-gray-200">
                    {log.action || "—"}
                  </td>

                  <td className="py-3 text-gray-300 flex items-center gap-2">
                    <FileText size={14} />
                    {log.details || "—"}
                  </td>
                </tr>
              ))}

              {!loading && currentLogs.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-10 text-gray-500"
                  >
                    No history logs found
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">

            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-white/10 rounded-lg text-sm disabled:opacity-40"
            >
              Prev
            </button>

            {getPageNumbers().map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-3 py-1 rounded-lg text-sm border ${
                  num === currentPage
                    ? "bg-green-500 text-black border-green-500"
                    : "bg-white/5 border-white/10 text-white"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-white/10 rounded-lg text-sm disabled:opacity-40"
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