import { useNavigate } from "react-router-dom";
import { useAuthStore} from "../store/authStore";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { API } from "../lib/api";

import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

import MobileReport from "../components/tabs/MobileReport";
import IncidentReport from "../components/tabs/IncidentReport";
import ComplaintReport from "../components/tabs/ComplaintReport";
import Overview from "../components/tabs/Overview";
import AIPredictions from "../components/tabs/AIPredictions";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Search,
  Gavel,
  Bell,
  Sparkles,
  FileWarning,
  Activity,
  Brain,
} from "lucide-react";

/* =========================================================
   SOCKET
========================================================= */
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

const ReportPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState("mobile");
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= NOTIFS ================= */
  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);
  const [toastNotif, setToastNotif] = useState(null);

  const debounceRef = useRef(null);

  /* =========================================================
     FETCH REPORTS
  ========================================================= */
  const fetchReports = useCallback(
  async (customSearch = search) => {
    setLoading(true);

    try {
      const res = await API.get(
        `/api/reports?status=pending&search=${customSearch}`
      );

      setReports(res.data.reports || []);
    } finally {
      setLoading(false);
    }
  },
  [search]
);

  useEffect(() => {
    fetchReports();
  }, []);

  /* =========================================================
     SOCKET
  ========================================================= */
  useEffect(() => {
    if (!user?._id) return;

    socket.connect();

    socket.emit("register", user._id);

    socket.on("newNotification", (data) => {

      setReports((prev) => [data.report, ...prev]);

      const notif = {
        id: data.report?._id || Date.now(),
        title: "New Student Report",
        text:
          data.report?.offense ||
          "A new incident report was submitted.",
        student:
          data.report?.studentName || "Unknown Student",
        time: new Date().toISOString(),
      };

      setNotifications((prev) => [
        notif,
        ...prev.slice(0, 15),
      ]);

      setToastNotif(notif);

      setTimeout(() => {
        setToastNotif(null);
      }, 4000);
    });

    socket.on("update-report", (data) => {
      setReports((prev) =>
        prev.map((r) =>
          r._id === data._id ? data : r
        )
      );
    });

    return () => socket.disconnect();
  }, [user]);

  /* =========================================================
     ACTIONS
  ========================================================= */
  const handleAccept = async (id) => {
    await API.put(`/api/reports/${id}/accept`);
    fetchReports();
  };

  const handleReject = async (id) => {
    await API.put(`/api/reports/${id}/reject`);
    fetchReports();
  };

  /* =========================================================
     FILTER
  ========================================================= */
  const filteredReports = useMemo(() => {
    return (reports || []).filter((r) => {
      const name =
        r?.studentName?.toLowerCase() || "";

      const offense =
        r?.offense?.toLowerCase() || "";

      return (
        name.includes(search.toLowerCase()) ||
        offense.includes(search.toLowerCase())
      );
    });
  }, [reports, search]);

  /* =========================================================
     STATS
  ========================================================= */
  const stats = {
    total: reports.length,
    pending: reports.filter(
      (r) => r.status === "pending"
    ).length,
    accepted: reports.filter(
      (r) => r.status === "accepted"
    ).length,
    rejected: reports.filter(
      (r) => r.status === "rejected"
    ).length,
  };

  return (
    <div className="h-screen w-screen flex bg-[#F4F7FB] text-gray-900 overflow-hidden">

      {/* =========================================================
         SIDEBAR
      ========================================================= */}
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">

        <div>

          <div className="mb-10">
            <h1 className="text-2xl font-bold text-green-600">
              GuidEd
            </h1>

            <p className="text-xs text-gray-500 mt-1">
              Case & Report Management System
            </p>
          </div>

          <div className="space-y-2">

            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() => navigate("/dashboard")}
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              onClick={() => navigate("/students")}
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              onClick={() => navigate("/guidance")}
            />

            <Nav
              icon={<ChartNoAxesCombined size={18} />}
              label="Reports"
              active
            />

            <Nav
              icon={<Gavel size={18} />}
              label="Interventions"
              onClick={() =>
                navigate("/interventions")
              }
            />

            <Nav
              icon={<Settings size={18} />}
              label="Settings"
              onClick={() => navigate("/settings")}
            />

          </div>

        </div>

        <button
          onClick={logout}
          className="
            w-full bg-green-600 text-white
            py-3 rounded-2xl
            hover:bg-green-700 transition
            font-medium
          "
        >
          Logout
        </button>

      </aside>

      {/* =========================================================
         MAIN
      ========================================================= */}
      <main className="flex-1 overflow-y-auto">

        {/* =========================================================
           HEADER
        ========================================================= */}
        <div className="
          sticky top-0 z-30
          px-8 py-6
          border-b border-white/20
          bg-white/50 backdrop-blur-2xl
        ">

          <div className="flex justify-between items-start">

            <div>

              <h2 className="text-4xl font-black tracking-tight">
                Reports Management
              </h2>

              <p className="text-gray-500 mt-2">
                Review, monitor, and manage student
                incident reports in real-time
              </p>

            </div>

            {/* NOTIF */}
            <div className="relative">

              <button
                onClick={() =>
                  setOpenNotif(!openNotif)
                }
                className="
                  w-12 h-12 rounded-2xl
                  bg-white/60 backdrop-blur-xl
                  border border-white/30
                  shadow-sm
                  flex items-center justify-center
                  hover:scale-105 transition
                "
              >
                <Bell size={18} />
              </button>

              {notifications.length > 0 && (
                <span className="
                  absolute -top-1 -right-1
                  min-w-[20px] h-5
                  px-1 rounded-full
                  bg-red-500 text-white
                  text-[11px] font-bold
                  flex items-center justify-center
                ">
                  {notifications.length}
                </span>
              )}

              {/* PANEL */}
              <AnimatePresence>

                {openNotif && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95,
                    }}
                    className="
                      absolute right-0 mt-4 w-96
                      bg-white/70 backdrop-blur-2xl
                      border border-white/30
                      rounded-3xl overflow-hidden
                      shadow-2xl z-50
                    "
                  >

                    <div className="p-5 border-b border-white/20 flex justify-between items-center">

                      <div>

                        <h3 className="font-bold text-gray-900">
                          Notifications
                        </h3>

                        <p className="text-xs text-gray-500">
                          Live report updates
                        </p>

                      </div>

                      <Sparkles
                        size={16}
                        className="text-green-600"
                      />

                    </div>

                    <div className="max-h-[400px] overflow-y-auto">

                      {notifications.length ===
                      0 ? (
                        <div className="p-10 text-center text-gray-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <motion.div
                            key={n.id}
                            whileHover={{ x: 4 }}
                            className="
                              p-5 border-b border-white/20
                              hover:bg-white/30 transition
                            "
                          >

                            <p className="font-semibold text-sm text-gray-900">
                              {n.title}
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                              {n.text}
                            </p>

                            <div className="flex justify-between mt-3">

                              <span className="text-xs text-green-700 font-medium">
                                {n.student}
                              </span>

                              <span className="text-xs text-gray-400">
                                {new Date(
                                  n.time
                                ).toLocaleTimeString()}
                              </span>

                            </div>

                          </motion.div>
                        ))
                      )}

                    </div>

                  </motion.div>
                )}

              </AnimatePresence>

            </div>

          </div>

        </div>

        {/* =========================================================
           CONTENT
        ========================================================= */}
        <div className="p-8">

          {/* =========================================================
             STATS
          ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

            <StatCard
              icon={<FileWarning size={18} />}
              label="Total Reports"
              value={stats.total}
            />

            <StatCard
              icon={<Activity size={18} />}
              label="Pending"
              value={stats.pending}
              color="text-yellow-500"
            />

            <StatCard
              icon={<ShieldX size={18} />}
              label="Accepted"
              value={stats.accepted}
              color="text-green-600"
            />

            <StatCard
              icon={<Brain size={18} />}
              label="Rejected"
              value={stats.rejected}
              color="text-red-500"
            />

          </div>

          {/* =========================================================
             SEARCH + TABS
          ========================================================= */}
          <div className="
            bg-white/45 backdrop-blur-2xl
            border border-white/30
            rounded-[2rem]
            p-6 shadow-sm mb-8
          ">

            {/* SEARCH */}
            <div className="
              flex items-center gap-3
              px-5 py-4 rounded-2xl
              bg-white/60 backdrop-blur-xl
              border border-white/30
              max-w-xl mb-6
            ">

              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                className="
                  bg-transparent outline-none
                  w-full text-sm
                "
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search student or offense..."
              />

            </div>

            {/* TABS */}
            <div className="flex flex-wrap gap-3">

              <Tab
                label="Mobile Pending"
                active={activeTab === "mobile"}
                onClick={() =>
                  setActiveTab("mobile")
                }
              />

              <Tab
                label="Incident"
                active={activeTab === "incident"}
                onClick={() =>
                  setActiveTab("incident")
                }
              />

              <Tab
                label="Complaint"
                active={activeTab === "complaint"}
                onClick={() =>
                  setActiveTab("complaint")
                }
              />

              <Tab
                label="Overview"
                active={activeTab === "overview"}
                onClick={() =>
                  setActiveTab("overview")
                }
              />

              <Tab
                label="AI Insights"
                active={activeTab === "ai"}
                onClick={() => setActiveTab("ai")}
              />

            </div>

          </div>

          {/* =========================================================
             CONTENT PANEL
          ========================================================= */}
          <motion.div
            layout
            className="
              bg-white/45 backdrop-blur-2xl
              border border-white/30
              rounded-[2rem]
              p-7 shadow-sm min-h-[500px]
            "
          >

            {/* MOBILE */}
            {activeTab === "mobile" && (
              <>
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="
                      w-12 h-12 rounded-full
                      border-4 border-green-500
                      border-t-transparent
                      animate-spin
                    " />
                  </div>
                ) : filteredReports.length ? (
                  <div className="grid gap-5">

                    {filteredReports.map(
                      (report) => (
                        <motion.div
                          key={report._id}
                          whileHover={{ y: -2 }}
                          className="
                            bg-white/60 backdrop-blur-xl
                            border border-white/30
                            rounded-3xl
                            p-5 shadow-sm
                          "
                        >

                          <MobileReport
                            report={report}
                            onAccept={handleAccept}
                            onReject={handleReject}
                          />

                        </motion.div>
                      )
                    )}

                  </div>
                ) : (
                  <div className="py-20 text-center">

                    <p className="text-lg font-semibold text-gray-700">
                      No reports found
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      Try adjusting your search
                      filters.
                    </p>

                  </div>
                )}
              </>
            )}

            {/* OTHER TABS */}
            {activeTab === "incident" && (
              <IncidentReport />
            )}

            {activeTab === "complaint" && (
              <ComplaintReport />
            )}

            {activeTab === "overview" && (
              <Overview />
            )}

            {activeTab === "ai" && (
              <AIPredictions />
            )}

          </motion.div>

        </div>

      </main>

      {/* =========================================================
         TOAST
      ========================================================= */}
      <AnimatePresence>

        {toastNotif && (
          <motion.div
            initial={{
              opacity: 0,
              y: -30,
              x: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: 0,
            }}
            exit={{
              opacity: 0,
              y: -20,
              x: 30,
            }}
            className="
              fixed top-6 right-6 z-[999]
              w-[360px]
              bg-white/70 backdrop-blur-2xl
              border border-white/30
              rounded-3xl shadow-2xl
              overflow-hidden
            "
          >

            <div className="p-5 flex gap-4">

              <div className="
                w-12 h-12 rounded-2xl
                bg-green-100 text-green-700
                flex items-center justify-center
              ">
                <Bell size={18} />
              </div>

              <div className="flex-1">

                <p className="font-semibold text-gray-900">
                  {toastNotif.title}
                </p>

                <p className="text-sm text-gray-700 mt-1">
                  {toastNotif.text}
                </p>

                <div className="flex justify-between mt-3">

                  <span className="text-xs text-green-700 font-medium">
                    {toastNotif.student}
                  </span>

                  <span className="text-xs text-gray-400">
                    {new Date(
                      toastNotif.time
                    ).toLocaleTimeString()}
                  </span>

                </div>

              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};

/* =========================================================
   NAV
========================================================= */
const Nav = ({
  icon,
  label,
  onClick,
  active,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-full transition-all duration-200 ${
      active
        ? "bg-green-50 text-green-700 font-semibold shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    <span className="text-sm">
      {label}
    </span>
  </button>
);

/* =========================================================
   TAB
========================================================= */
const Tab = ({
  label,
  active,
  onClick,
}) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all border ${
      active
        ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100"
        : "bg-white/50 backdrop-blur-xl text-gray-600 border-white/30 hover:bg-white/70"
    }`}
  >
    {label}
  </motion.button>
);

/* =========================================================
   STAT CARD
========================================================= */
const StatCard = ({
  icon,
  label,
  value,
  color = "text-gray-900",
}) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="
      bg-white/45 backdrop-blur-2xl
      border border-white/30
      rounded-[2rem]
      p-6 shadow-sm
    "
  >

    <div className="
      w-12 h-12 rounded-2xl
      bg-green-100 text-green-700
      flex items-center justify-center mb-5
    ">
      {icon}
    </div>

    <p className="text-sm text-gray-500">
      {label}
    </p>

    <h2 className={`text-3xl font-black mt-2 ${color}`}>
      {value}
    </h2>

  </motion.div>
);

export default ReportPage;