import {
  Clock3,
  Filter,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { API } from "../../lib/api";

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

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.logs || [];

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
    <div className="w-full text-gray-900">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-6 mb-7">
        <div className="flex items-start gap-4">
          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-green-50
              text-green-600
              flex
              items-center
              justify-center
              border
              border-green-100
              flex-shrink-0
            "
          >
            <Clock3 size={21} strokeWidth={2.2} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              System History Logs
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Track system activity, user actions, and audit events.
            </p>
          </div>
        </div>

        {/* STATUS */}

        <div
          className="
            hidden
            sm:flex
            items-center
            gap-2
            px-3
            py-2
            rounded-xl
            bg-green-50
            border
            border-green-100
            text-xs
            font-semibold
            text-green-700
          "
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Audit Logging Active
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">
        <LogSummary
          icon={<Activity size={18} />}
          label="Total Events"
          value={logs.length}
          description="Recorded activity matching your filters."
        />

        <LogSummary
          icon={<Clock3 size={18} />}
          label="Current Page"
          value={totalPages === 0 ? 0 : currentPage}
          description={`Showing up to ${logsPerPage} events per page.`}
        />

        <LogSummary
          icon={<FileText size={18} />}
          label="Log Status"
          value={loading ? "Loading" : "Active"}
          description="System activity is being monitored."
        />
      </div>

      {/* =====================================================
          MAIN LOG CARD
      ===================================================== */}

      <section
        className="
          bg-white
          border
          border-gray-100
          rounded-3xl
          shadow-[0_4px_24px_rgba(0,0,0,0.025)]
          overflow-hidden
        "
      >
        {/* ===================================================
            CARD HEADER
        =================================================== */}

        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            {/* TITLE */}

            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Activity Records
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Review recent actions and system events.
              </p>
            </div>

            {/* FILTERS */}

            <div className="flex flex-col sm:flex-row gap-2">
              {/* CATEGORY */}

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="
                    appearance-none
                    w-full
                    sm:w-[170px]
                    bg-gray-50
                    border
                    border-gray-200
                    rounded-xl
                    pl-4
                    pr-9
                    py-2.5
                    text-xs
                    font-medium
                    text-gray-600
                    outline-none
                    cursor-pointer
                    focus:bg-white
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-500/10
                    transition-all
                  "
                >
                  <option value="">All Actions</option>
                  <option value="Auth">Login / Logout</option>
                  <option value="Incident">Incident Reports</option>
                  <option value="Student">Student Updates</option>
                  <option value="System">System Changes</option>
                </select>

                <Filter
                  size={14}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    pointer-events-none
                  "
                />
              </div>

              {/* ROLE */}

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="
                  appearance-none
                  w-full
                  sm:w-[145px]
                  bg-gray-50
                  border
                  border-gray-200
                  rounded-xl
                  px-4
                  py-2.5
                  text-xs
                  font-medium
                  text-gray-600
                  outline-none
                  cursor-pointer
                  focus:bg-white
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-500/10
                  transition-all
                "
              >
                <option value="">All Users</option>
                <option value="Admin">Admin</option>
                <option value="Guidance">Guidance</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
              </select>

              {/* REFRESH */}

              <button
                onClick={fetchLogs}
                disabled={loading}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-green-400
                  disabled:cursor-not-allowed
                  text-white
                  text-xs
                  font-semibold
                  shadow-sm
                  hover:shadow-md
                  transition-all
                  duration-200
                "
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />

                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* TABLE HEADER */}

            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                  Date & Time
                </th>

                <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Role
                </th>

                <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Action
                </th>

                <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Details
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <LoadingRows />
              ) : (
                currentLogs.map((log) => (
                  <LogRow
                    key={log._id || log.id}
                    log={log}
                  />
                ))
              )}

              {!loading && currentLogs.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <div className="py-14 flex flex-col items-center justify-center text-center">
                      <div
                        className="
                          w-12
                          h-12
                          rounded-2xl
                          bg-gray-50
                          flex
                          items-center
                          justify-center
                          mb-3
                        "
                      >
                        <FileText
                          size={21}
                          className="text-gray-300"
                        />
                      </div>

                      <p className="text-sm font-semibold text-gray-700">
                        No history logs found
                      </p>

                      <p className="text-xs text-gray-400 mt-1 max-w-[260px]">
                        Try changing your filters or refresh the activity
                        records.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {totalPages > 0 && (
          <div
            className="
              px-6
              py-4
              border-t
              border-gray-100
              flex
              flex-col
              sm:flex-row
              items-center
              justify-between
              gap-3
            "
          >
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-600">
                {currentLogs.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-600">
                {logs.length}
              </span>{" "}
              records
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(p - 1, 1))
                }
                disabled={currentPage === 1}
                className="
                  w-9
                  h-9
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  text-gray-500
                  flex
                  items-center
                  justify-center
                  hover:bg-gray-50
                  hover:text-gray-800
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  transition
                "
              >
                <ChevronLeft size={16} />
              </button>

              <div
                className="
                  px-3
                  h-9
                  rounded-xl
                  bg-green-50
                  border
                  border-green-100
                  text-green-700
                  text-xs
                  font-semibold
                  flex
                  items-center
                "
              >
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(p + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
                className="
                  w-9
                  h-9
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  text-gray-500
                  flex
                  items-center
                  justify-center
                  hover:bg-gray-50
                  hover:text-gray-800
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  transition
                "
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HistoryLogs;

/* =========================================================
   LOG SUMMARY
========================================================= */

const LogSummary = ({
  icon,
  label,
  value,
  description,
}) => (
  <div
    className="
      bg-white
      border
      border-gray-100
      rounded-3xl
      p-5
      shadow-[0_4px_24px_rgba(0,0,0,0.025)]
    "
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          {label}
        </p>

        <p className="text-xl font-extrabold tracking-tight text-gray-900 mt-2">
          {value}
        </p>
      </div>

      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-green-50
          text-green-600
          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>
    </div>

    <p className="text-[11px] text-gray-400 mt-4">
      {description}
    </p>

    <div className="mt-4 h-1 w-10 rounded-full bg-green-500" />
  </div>
);

/* =========================================================
   LOG ROW
========================================================= */

const LogRow = ({ log }) => {
  return (
    <tr className="group hover:bg-gray-50/70 transition-colors">
      {/* DATE */}

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div
            className="
              w-9
              h-9
              rounded-xl
              bg-gray-50
              border
              border-gray-100
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <Clock3
              size={15}
              className="text-gray-400"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700">
              {log.createdAt
                ? new Date(log.createdAt).toLocaleDateString()
                : "—"}
            </p>

            <p className="text-[10px] text-gray-400 mt-0.5">
              {log.createdAt
                ? new Date(log.createdAt).toLocaleTimeString()
                : "—"}
            </p>
          </div>
        </div>
      </td>

      {/* ROLE */}

      <td className="px-6 py-4 whitespace-nowrap">
        <RoleBadge role={log.role} />
      </td>

      {/* ACTION */}

      <td className="px-6 py-4">
        <p className="text-xs font-semibold text-gray-800">
          {log.action || "—"}
        </p>

        {log.category && (
          <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[9px] font-semibold text-gray-400">
            {log.category}
          </span>
        )}
      </td>

      {/* DETAILS */}

      <td className="px-6 py-4 min-w-[280px]">
        <div className="flex items-start gap-2">
          <FileText
            size={14}
            className="text-gray-300 mt-0.5 flex-shrink-0"
          />

          <p className="text-xs text-gray-500 leading-relaxed">
            {log.details || "—"}
          </p>
        </div>
      </td>
    </tr>
  );
};

/* =========================================================
   ROLE BADGE
========================================================= */

const RoleBadge = ({ role }) => {
  const styles = {
    Admin: "bg-green-50 text-green-700 border-green-100",
    Guidance: "bg-blue-50 text-blue-700 border-blue-100",
    Teacher: "bg-amber-50 text-amber-700 border-amber-100",
    Student: "bg-gray-50 text-gray-600 border-gray-100",
  };

  const style =
    styles[role] ||
    "bg-gray-50 text-gray-500 border-gray-100";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-2.5
        py-1
        rounded-lg
        border
        text-[10px]
        font-bold
        ${style}
      `}
    >
      <span
        className={`
          w-1.5
          h-1.5
          rounded-full
          ${
            role === "Admin"
              ? "bg-green-500"
              : role === "Guidance"
              ? "bg-blue-500"
              : role === "Teacher"
              ? "bg-amber-500"
              : "bg-gray-400"
          }
        `}
      />

      {role || "Unknown"}
    </span>
  );
};

/* =========================================================
   LOADING ROWS
========================================================= */

const LoadingRows = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100" />

            <div>
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-2 w-14 bg-gray-100 rounded" />
            </div>
          </div>
        </td>

        <td className="px-6 py-5">
          <div className="h-6 w-20 bg-gray-100 rounded-lg" />
        </td>

        <td className="px-6 py-5">
          <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </td>

        <td className="px-6 py-5">
          <div className="h-3 w-64 bg-gray-100 rounded" />
        </td>
      </tr>
    ))}
  </>
);