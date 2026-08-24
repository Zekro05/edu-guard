import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { API } from "../lib/api";

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
  Bell,
  Sparkles,
  FileWarning,
  Activity,
  Brain,
  BriefcaseBusiness,
  HandHelping,
  LogOut,
  ChevronRight,
  X,
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

/* =========================================================
   SOCKET
========================================================= */

const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket"],
  autoConnect: false,
});

/* =========================================================
   REPORT PAGE
========================================================= */

const ReportPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState("mobile");
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);
  const [toastNotif, setToastNotif] = useState(null);

  const debounceRef = useRef(null);

  /* =========================================================
     ADMIN
  ========================================================= */

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Administrator";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  const firstName =
    user?.firstName || user?.name?.split(" ")?.[0] || "Administrator";

  /* =========================================================
     FETCH REPORTS
  ========================================================= */

  const fetchReports = useCallback(
    async (customSearch = search) => {
      setLoading(true);

      try {
        const res = await API.get(
          `/api/reports?status=pending&search=${encodeURIComponent(
            customSearch,
          )}`,
        );

        setReports(res.data?.reports || []);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchReports("");
  }, []);

  /* =========================================================
     SEARCH DEBOUNCE
  ========================================================= */

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchReports(search);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  /* =========================================================
     SOCKET
  ========================================================= */

  useEffect(() => {
    if (!user?._id) return;

    socket.connect();

    socket.on("connect", () => {
      socket.emit("join", user._id);
    });

    const handleNewNotification = (data) => {
      if (!data?.report) return;

      setReports((prev) => {
        const exists = prev.some(
          (report) => report._id === data.report._id,
        );

        if (exists) return prev;

        return [data.report, ...prev];
      });

      const notif = {
        id: data.report?._id || Date.now(),
        title: "New Student Report",
        text:
          data.report?.offense ||
          "A new incident report was submitted.",
        student: data.report?.studentName || "Unknown Student",
        time: new Date().toISOString(),
      };

      setNotifications((prev) => [
        notif,
        ...prev.slice(0, 14),
      ]);

      setToastNotif(notif);

      setTimeout(() => {
        setToastNotif(null);
      }, 4000);
    };

    const handleReportUpdate = (data) => {
      if (!data?._id) return;

      setReports((prev) =>
        prev.map((report) =>
          report._id === data._id ? data : report,
        ),
      );
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("update-report", handleReportUpdate);

    return () => {
      socket.off("connect");
      socket.off("newNotification", handleNewNotification);
      socket.off("update-report", handleReportUpdate);
      socket.disconnect();
    };
  }, [user?._id]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleAccept = async (id) => {
    try {
      await API.put(`/api/reports/${id}/accept`);
      await fetchReports(search);
    } catch (error) {
      console.error("Failed to accept report:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/api/reports/${id}/reject`);
      await fetchReports(search);
    } catch (error) {
      console.error("Failed to reject report:", error);
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredReports = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return reports || [];

    return (reports || []).filter((report) => {
      const name =
        report?.studentName?.toLowerCase() || "";

      const offense =
        report?.offense?.toLowerCase() || "";

      return (
        name.includes(query) ||
        offense.includes(query)
      );
    });
  }, [reports, search]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(
    () => ({
      total: reports.length,

      pending: reports.filter(
        (report) => report.status === "pending",
      ).length,

      accepted: reports.filter(
        (report) => report.status === "accepted",
      ).length,

      rejected: reports.filter(
        (report) => report.status === "rejected",
      ).length,
    }),
    [reports],
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F7F9F8] text-gray-900 overflow-hidden">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="hidden lg:flex w-[270px] bg-white border-r border-gray-100 flex-col justify-between px-5 py-6 flex-shrink-0">

        <div>

          {/* BRAND */}

          <div className="px-3 mb-8">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 flex items-center justify-center">
                <img
                  src="/school-logo.png"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                  Guid<span className="text-green-600">Ed</span>
                </h1>

                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                  Student Guidance
                </p>
              </div>

            </div>

            <p className="text-[11px] leading-relaxed text-gray-400 mt-4">
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>

          </div>

          {/* MAIN MENU */}

          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">

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
              icon={<BriefcaseBusiness size={18} />}
              label="Cases"
              onClick={() => navigate("/cases")}
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              onClick={() => navigate("/interventions")}
            />

          </div>

          {/* SYSTEM */}

          <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => navigate("/settings")}
          />

        </div>

        {/* SIDEBAR FOOTER */}

        <div className="space-y-3">

          {/* PROFILE */}

          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">

            <div className="flex items-center gap-3">

              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0">

                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt={adminName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-green-700 font-bold">
                    {adminName.charAt(0).toUpperCase()}
                  </span>
                )}

                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />

              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Administrator
                </p>

                <p className="text-sm font-bold text-gray-900 truncate">
                  {adminName}
                </p>

              </div>

            </div>

          </div>

          {/* SIGN OUT */}

          <button
            onClick={logout}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              text-gray-600
              border
              border-gray-200
              hover:bg-red-50
              hover:text-red-600
              hover:border-red-100
              transition
            "
          >
            <LogOut size={16} />
            Sign out
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="flex-1 overflow-y-auto">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="sticky top-0 z-30 bg-[#F7F9F8]/90 backdrop-blur-xl border-b border-gray-100">

          <div className="px-6 md:px-10 py-5 flex items-center justify-between">

            <div>

              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">

                <span>Management</span>

                <ChevronRight size={12} />

                <span className="text-green-600 font-medium">
                  Reports
                </span>

              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Reports
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Review and manage student reports and behavioral concerns.
              </p>

            </div>

            <div className="flex items-center gap-2">

              {/* NOTIFICATIONS */}

              <button
                onClick={() => setOpenNotif(true)}
                className="
                  relative
                  w-11
                  h-11
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  flex
                  items-center
                  justify-center
                  hover:border-green-200
                  hover:text-green-700
                  transition
                "
              >

                <Bell size={18} />

                {notifications.length > 0 && (
                  <span className="
                    absolute
                    -top-1
                    -right-1
                    min-w-5
                    h-5
                    px-1.5
                    rounded-full
                    bg-red-500
                    text-white
                    text-[10px]
                    font-bold
                    flex
                    items-center
                    justify-center
                    border-2
                    border-[#F7F9F8]
                  ">
                    {notifications.length > 9
                      ? "9+"
                      : notifications.length}
                  </span>
                )}

              </button>

              {/* PROFILE */}

              <div className="hidden md:flex items-center gap-2 ml-2">

                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center overflow-hidden">

                  {adminPhoto ? (
                    <img
                      src={adminPhoto}
                      alt={adminName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-green-700">
                      {adminName.charAt(0)}
                    </span>
                  )}

                </div>

              </div>

            </div>

          </div>

        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="px-6 md:px-10 py-8 space-y-8">

          {/* =================================================
              REPORT OVERVIEW
          ================================================= */}

          <section>

            <div className="flex items-center justify-between mb-4">

              <div>

                <h3 className="text-sm font-bold text-gray-900">
                  Report Overview
                </h3>

                <p className="text-xs text-gray-400 mt-0.5">
                  Current status of student reports
                </p>

              </div>

              <Activity
                size={18}
                className="text-gray-300"
              />

            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">

              <StatCard
                title="Total Reports"
                value={stats.total}
                icon={<ClipboardList size={19} />}
                type="total"
              />

              <StatCard
                title="Pending"
                value={stats.pending}
                icon={<Clock3 size={19} />}
                type="pending"
              />

              <StatCard
                title="Accepted"
                value={stats.accepted}
                icon={<CheckCircle2 size={19} />}
                type="accepted"
              />

              <StatCard
                title="Rejected"
                value={stats.rejected}
                icon={<XCircle size={19} />}
                type="rejected"
              />

            </div>

          </section>

          {/* =================================================
              REPORT WORKSPACE
          ================================================= */}

          <section>

            {/* SECTION HEADER */}

            <div className="mb-4">

              <h3 className="text-sm font-bold text-gray-900">
                Report Management
              </h3>

              <p className="text-xs text-gray-400 mt-0.5">
                Review submitted reports, incidents, complaints, and insights.
              </p>

            </div>

            {/* SEARCH + TABS */}

            <div className="
              bg-white
              border
              border-gray-100
              rounded-3xl
              p-4
              shadow-[0_4px_24px_rgba(0,0,0,0.025)]
              mb-4
            ">

              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

                {/* SEARCH */}

                <div className="
                  flex
                  items-center
                  gap-3
                  px-4
                  h-11
                  rounded-xl
                  bg-gray-50
                  border
                  border-gray-100
                  focus-within:bg-white
                  focus-within:border-green-200
                  focus-within:ring-2
                  focus-within:ring-green-50
                  transition
                  w-full
                  xl:max-w-md
                ">

                  <Search
                    size={17}
                    className="text-gray-400 flex-shrink-0"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search student or offense..."
                    className="
                      bg-transparent
                      outline-none
                      w-full
                      text-sm
                      text-gray-800
                      placeholder:text-gray-400
                    "
                  />

                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="
                        text-gray-400
                        hover:text-gray-700
                        transition
                      "
                    >
                      <X size={15} />
                    </button>
                  )}

                </div>

                {/* TABS */}

                <div className="
                  flex
                  flex-wrap
                  gap-1
                  p-1
                  rounded-xl
                  bg-gray-50
                  border
                  border-gray-100
                ">

                  <Tab
                    label="Mobile Pending"
                    active={activeTab === "mobile"}
                    onClick={() => setActiveTab("mobile")}
                  />

                  <Tab
                    label="Incident"
                    active={activeTab === "incident"}
                    onClick={() => setActiveTab("incident")}
                  />

                  <Tab
                    label="Complaint"
                    active={activeTab === "complaint"}
                    onClick={() => setActiveTab("complaint")}
                  />

                  <Tab
                    label="Overview"
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                  />

                  <Tab
                    label="AI Insights"
                    active={activeTab === "ai"}
                    onClick={() => setActiveTab("ai")}
                  />

                </div>

              </div>

            </div>

            {/* CONTENT */}

            <motion.div
              layout
              className="
                bg-white
                border
                border-gray-100
                rounded-3xl
                p-5
                shadow-[0_4px_24px_rgba(0,0,0,0.025)]
                min-h-[500px]
              "
            >

              {/* =================================================
                  MOBILE REPORTS
              ================================================= */}

              {activeTab === "mobile" && (
                <>

                  <div className="flex items-center justify-between mb-5">

                    <div>

                      <div className="flex items-center gap-2">

                        <div className="
                          w-9
                          h-9
                          rounded-xl
                          bg-green-50
                          text-green-600
                          flex
                          items-center
                          justify-center
                        ">
                          <FileWarning size={17} />
                        </div>

                        <h3 className="font-bold text-gray-900">
                          Mobile Reports
                        </h3>

                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Reports submitted through the EduGuard mobile app.
                      </p>

                    </div>

                    <div className="
                      px-2.5
                      py-1
                      rounded-lg
                      bg-green-50
                      text-green-700
                      text-[10px]
                      font-bold
                    ">
                      {filteredReports.length}{" "}
                      {filteredReports.length === 1
                        ? "REPORT"
                        : "REPORTS"}
                    </div>

                  </div>

                  {loading ? (

                    <LoadingState />

                  ) : filteredReports.length ? (

                    <div className="space-y-3">

                      {filteredReports.map((report) => (

                        <motion.div
                          key={report._id}
                          layout
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          whileHover={{
                            y: -1,
                          }}
                          className="
                            bg-gray-50
                            border
                            border-gray-100
                            rounded-2xl
                            p-4
                            hover:bg-white
                            hover:shadow-sm
                            transition
                          "
                        >

                          <MobileReport
                            report={report}
                            onAccept={handleAccept}
                            onReject={handleReject}
                          />

                        </motion.div>

                      ))}

                    </div>

                  ) : (

                    <EmptyState />

                  )}

                </>
              )}

              {/* INCIDENT */}

              {activeTab === "incident" && (
                <IncidentReport />
              )}

              {/* COMPLAINT */}

              {activeTab === "complaint" && (
                <ComplaintReport />
              )}

              {/* OVERVIEW */}

              {activeTab === "overview" && (
                <Overview />
              )}

              {/* AI */}

              {activeTab === "ai" && (
                <AIPredictions />
              )}

            </motion.div>

          </section>

        </div>

      </main>

      {/* =====================================================
          NOTIFICATION DRAWER
      ===================================================== */}

      <AnimatePresence>

        {openNotif && (
          <>

            {/* OVERLAY */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenNotif(false)}
              className="
                fixed
                inset-0
                bg-black/10
                backdrop-blur-[2px]
                z-40
              "
            />

            {/* DRAWER */}

            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{
                type: "spring",
                damping: 28,
              }}
              className="
                fixed
                right-0
                top-0
                h-full
                w-full
                sm:w-[390px]
                bg-white
                border-l
                border-gray-100
                shadow-2xl
                z-50
                flex
                flex-col
              "
            >

              {/* HEADER */}

              <div className="
                px-6
                py-5
                border-b
                border-gray-100
                flex
                items-center
                justify-between
              ">

                <div>

                  <h3 className="
                    font-bold
                    text-gray-900
                    flex
                    items-center
                    gap-2
                  ">
                    <Bell size={17} />
                    Notifications
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Recent report activity
                  </p>

                </div>

                <button
                  onClick={() => setOpenNotif(false)}
                  className="
                    w-9
                    h-9
                    rounded-xl
                    hover:bg-gray-100
                    flex
                    items-center
                    justify-center
                    transition
                  "
                >
                  <X size={18} />
                </button>

              </div>

              {/* CONTENT */}

              <div className="flex-1 overflow-y-auto p-5">

                {notifications.length === 0 ? (

                  <div className="
                    h-full
                    flex
                    flex-col
                    items-center
                    justify-center
                    text-center
                  ">

                    <div className="
                      w-14
                      h-14
                      rounded-2xl
                      bg-gray-50
                      flex
                      items-center
                      justify-center
                      mb-4
                    ">
                      <Bell
                        size={22}
                        className="text-gray-300"
                      />
                    </div>

                    <p className="font-semibold text-gray-700">
                      No notifications
                    </p>

                    <p className="
                      text-xs
                      text-gray-400
                      mt-1
                      max-w-[220px]
                    ">
                      New report submissions and updates will appear here.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {notifications.map((notification) => (

                      <motion.div
                        key={notification.id}
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="
                          p-4
                          rounded-2xl
                          bg-gray-50
                          border
                          border-gray-100
                          hover:bg-white
                          hover:shadow-sm
                          transition
                        "
                      >

                        <div className="flex gap-3">

                          <div className="
                            w-9
                            h-9
                            rounded-xl
                            bg-green-100
                            flex
                            items-center
                            justify-center
                            flex-shrink-0
                          ">
                            <FileWarning
                              size={15}
                              className="text-green-700"
                            />
                          </div>

                          <div className="min-w-0">

                            <p className="
                              font-semibold
                              text-sm
                              text-gray-900
                            ">
                              {notification.title}
                            </p>

                            <p className="
                              text-xs
                              text-gray-500
                              mt-1
                              leading-relaxed
                            ">
                              {notification.text}
                            </p>

                            <div className="
                              flex
                              items-center
                              justify-between
                              gap-3
                              mt-2
                            ">

                              <span className="
                                text-[10px]
                                font-semibold
                                text-green-700
                                truncate
                              ">
                                {notification.student}
                              </span>

                              <span className="
                                text-[10px]
                                text-gray-400
                                whitespace-nowrap
                              ">
                                {new Date(
                                  notification.time,
                                ).toLocaleTimeString()}
                              </span>

                            </div>

                          </div>

                        </div>

                      </motion.div>

                    ))}

                  </div>

                )}

              </div>

            </motion.div>

          </>
        )}

      </AnimatePresence>

      {/* =====================================================
          TOAST
      ===================================================== */}

      <AnimatePresence>

        {toastNotif && (
          <motion.div
            initial={{
              opacity: 0,
              y: -15,
              x: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: 0,
            }}
            exit={{
              opacity: 0,
              y: -15,
              x: 20,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
            }}
            className="
              fixed
              top-5
              right-5
              z-[999]
              w-[calc(100%-40px)]
              sm:w-[380px]
              bg-white
              border
              border-gray-100
              rounded-3xl
              shadow-[0_20px_60px_rgba(0,0,0,0.14)]
              overflow-hidden
            "
          >

            <div className="p-5 flex gap-4">

              <div className="
                w-10
                h-10
                rounded-xl
                bg-green-50
                text-green-600
                flex
                items-center
                justify-center
                flex-shrink-0
              ">
                <Bell size={18} />
              </div>

              <div className="flex-1 min-w-0">

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-3
                ">

                  <p className="
                    font-bold
                    text-gray-900
                    text-sm
                  ">
                    {toastNotif.title}
                  </p>

                  <button
                    onClick={() => setToastNotif(null)}
                    className="
                      text-gray-400
                      hover:text-gray-700
                    "
                  >
                    <X size={15} />
                  </button>

                </div>

                <p className="
                  text-sm
                  text-gray-600
                  mt-1
                ">
                  {toastNotif.text}
                </p>

                <div className="
                  flex
                  justify-between
                  items-center
                  mt-3
                  gap-3
                ">

                  <span className="
                    text-xs
                    text-green-700
                    font-semibold
                    truncate
                  ">
                    {toastNotif.student}
                  </span>

                  <span className="
                    text-[10px]
                    text-gray-400
                    whitespace-nowrap
                  ">
                    {new Date(
                      toastNotif.time,
                    ).toLocaleTimeString()}
                  </span>

                </div>

              </div>

            </div>

            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{
                duration: 4,
                ease: "linear",
              }}
              className="h-1 bg-green-500"
            />

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
    className={`
      group
      flex
      items-center
      gap-3
      px-3.5
      py-2.5
      rounded-xl
      w-full
      text-sm
      transition
      ${
        active
          ? "bg-green-50 text-green-700 font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >

    <span
      className={`
        transition
        ${
          active
            ? "text-green-600"
            : "text-gray-400 group-hover:text-gray-700"
        }
      `}
    >
      {icon}
    </span>

    {label}

    {active && (
      <span className="
        ml-auto
        w-1.5
        h-1.5
        rounded-full
        bg-green-600
      " />
    )}

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
  <button
    onClick={onClick}
    className={`
      px-3.5
      py-2
      rounded-lg
      text-xs
      font-semibold
      transition
      ${
        active
          ? "bg-white text-green-700 shadow-sm border border-gray-100"
          : "text-gray-500 hover:text-gray-800 hover:bg-white/70"
      }
    `}
  >
    {label}
  </button>
);

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  title,
  value,
  icon,
  type,
}) => {

  const styles = {

    total: {
      icon: "bg-gray-100 text-gray-700",
      number: "text-gray-900",
      line: "bg-gray-400",
    },

    pending: {
      icon: "bg-amber-50 text-amber-600",
      number: "text-amber-600",
      line: "bg-amber-500",
    },

    accepted: {
      icon: "bg-green-50 text-green-600",
      number: "text-green-600",
      line: "bg-green-500",
    },

    rejected: {
      icon: "bg-red-50 text-red-600",
      number: "text-red-600",
      line: "bg-red-500",
    },

  };

  const s = styles[type];

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 22,
      }}
      className="
        relative
        overflow-hidden
        bg-white
        border
        border-gray-100
        rounded-3xl
        p-5
        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
      "
    >

      <div className="
        flex
        items-start
        justify-between
      ">

        <div>

          <p className="
            text-xs
            font-semibold
            text-gray-400
          ">
            {title}
          </p>

          <p className={`
            text-3xl
            font-extrabold
            tracking-tight
            mt-3
            ${s.number}
          `}>
            {value}
          </p>

        </div>

        <div className={`
          w-10
          h-10
          rounded-xl
          flex
          items-center
          justify-center
          ${s.icon}
        `}>
          {icon}
        </div>

      </div>

      <div className={`
        mt-5
        h-1
        w-10
        rounded-full
        ${s.line}
      `} />

    </motion.div>
  );
};

/* =========================================================
   LOADING
========================================================= */

const LoadingState = () => (
  <div className="py-20">

    <div className="flex flex-col items-center justify-center">

      <div className="
        w-10
        h-10
        rounded-full
        border-[3px]
        border-green-500
        border-t-transparent
        animate-spin
      " />

      <p className="
        text-sm
        font-medium
        text-gray-500
        mt-4
      ">
        Loading reports...
      </p>

    </div>

  </div>
);

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = () => (
  <div className="py-20 text-center">

    <div className="
      w-14
      h-14
      mx-auto
      rounded-2xl
      bg-gray-50
      border
      border-gray-100
      flex
      items-center
      justify-center
      text-gray-300
      mb-4
    ">
      <FileWarning size={24} />
    </div>

    <p className="
      text-sm
      font-bold
      text-gray-700
    ">
      No reports found
    </p>

    <p className="
      text-xs
      text-gray-400
      mt-1
    ">
      Try adjusting your search filters or check again later.
    </p>

  </div>
);

export default ReportPage;