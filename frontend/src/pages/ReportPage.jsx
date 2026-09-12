import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { API } from "../lib/api";

import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import MobileReport from "../components/tabs/MobileReport";
import IncidentReport from "../components/tabs/IncidentReport";
import ComplaintReport from "../components/tabs/ComplaintReport";
import Overview from "../components/tabs/Overview";
import AIPredictions from "../components/tabs/AIPredictions";
import PrintableReport from "../components/reports/PrintableReport";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  FileWarning,
  Activity,
  BriefcaseBusiness,
  HandHelping,
  LogOut,
  ChevronRight,
  X,
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  Menu,
  Printer,
  Download,
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
  const [allReports, setAllReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPrintableReport, setShowPrintableReport] = useState(false);


  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  /* =========================================================
     NAVIGATION HELPER
  ========================================================= */

  const handleNavigate = useCallback(
    (path) => {
      setMobileSidebarOpen(false);
      navigate(path);
    },
    [navigate],
  );

  /* =========================================================
     CLOSE MOBILE SIDEBAR WHEN SCREEN BECOMES DESKTOP
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     PREVENT BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
  ========================================================= */

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  /* =========================================================
   FETCH REPORTS
========================================================= */

  const fetchReports = useCallback(
    async (customSearch = search) => {
      setLoading(true);

      try {
        /*
        MOBILE PENDING LIST
        -------------------
        Only pending reports are shown inside the
        Mobile Pending tab.
      */
        const pendingRes = await API.get(
          `/api/reports?status=pending&search=${encodeURIComponent(
            customSearch,
          )}`,
        );

        setReports(pendingRes.data?.reports || []);

        /*
        ALL REPORTS
        -----------
        Used only for the statistics at the top.

        We intentionally do NOT use status=pending here,
        because we need pending + accepted + rejected.
      */
        const allRes = await API.get(
          `/api/reports?limit=10000&search=${encodeURIComponent(customSearch)}`,
        );

        setAllReports(allRes.data?.reports || []);
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

    const handleConnect = () => {
      socket.emit("join", user._id);
    };

    const handleNewNotification = (data) => {
      if (!data?.report) return;

      setReports((prev) => {
        const exists = prev.some((report) => report._id === data.report._id);

        if (exists) return prev;

        return [data.report, ...prev];
      });

      const notif = {
        id: data.report?._id || Date.now(),
        title: "New Student Report",
        text: data.report?.offense || "A new incident report was submitted.",
        student: data.report?.studentName || "Unknown Student",
        time: new Date().toISOString(),
      };

      setNotifications((prev) => [notif, ...prev.slice(0, 14)]);

      setToastNotif(notif);

      setTimeout(() => {
        setToastNotif((current) => (current?.id === notif.id ? null : current));
      }, 4000);
    };

    const handleReportUpdate = (data) => {
      if (!data?._id) return;

      setReports((prev) =>
        prev.map((report) => (report._id === data._id ? data : report)),
      );
    };

    socket.on("connect", handleConnect);
    socket.on("newNotification", handleNewNotification);
    socket.on("update-report", handleReportUpdate);

    return () => {
      socket.off("connect", handleConnect);
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
      const name = report?.studentName?.toLowerCase() || "";

      const offense = report?.offense?.toLowerCase() || "";

      return name.includes(query) || offense.includes(query);
    });
  }, [reports, search]);

  /* =========================================================
     STATS
  ========================================================= */

  /* =========================================================
   STATS
========================================================= */

  const stats = useMemo(() => {
    const total = allReports.length;

    const pending = allReports.filter(
      (report) => !report.status || report.status === "pending",
    ).length;

    const accepted = allReports.filter(
      (report) =>
        report.status === "accepted" || report.status === "under_review",
    ).length;

    const rejected = allReports.filter(
      (report) => report.status === "rejected",
    ).length;

    return {
      total,
      pending,
      accepted,
      rejected,
    };
  }, [allReports]);

  /* =========================================================
     SIDEBAR CONTENT
  ========================================================= */

  const SidebarContent = ({ mobile = false }) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* BRAND */}

        <div className="px-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
              <img
                src="/school-logo.webp"
                alt="School Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                    Guid<span className="text-green-600">Ed</span>
                  </h1>

                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                    Student Guidance
                  </p>
                </div>

                {mobile && (
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close sidebar"
                    className="
                      lg:hidden
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      text-gray-400
                      hover:text-gray-700
                      hover:bg-gray-100
                      transition
                      flex-shrink-0
                    "
                  >
                    <X size={19} />
                  </button>
                )}
              </div>
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
            onClick={() => handleNavigate("/dashboard")}
          />

          <Nav
            icon={<Users size={18} />}
            label="Students"
            onClick={() => handleNavigate("/students")}
          />

          <Nav
            icon={<ShieldX size={18} />}
            label="Guidance"
            onClick={() => handleNavigate("/guidance")}
          />

          <Nav
            icon={<ChartNoAxesCombined size={18} />}
            label="Reports"
            active
            onClick={() => {
              setMobileSidebarOpen(false);
            }}
          />

          <Nav
            icon={<BriefcaseBusiness size={18} />}
            label="Cases"
            onClick={() => handleNavigate("/cases")}
          />

          <Nav
            icon={<HandHelping size={18} />}
            label="Interventions"
            onClick={() => handleNavigate("/interventions")}
          />
        </div>

        {/* SYSTEM */}

        <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          System
        </p>

        <Nav
          icon={<Settings size={18} />}
          label="Settings"
          onClick={() => handleNavigate("/settings")}
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
    </div>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F7F9F8] text-gray-900 overflow-hidden">
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className="
          hidden
          lg:flex
          w-[270px]
          bg-white
          border-r
          border-gray-100
          flex-col
          px-5
          py-6
          flex-shrink-0
        "
      >
        <SidebarContent />
      </aside>

      {/* =====================================================
          MOBILE SIDEBAR OVERLAY
      ===================================================== */}

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* OVERLAY */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="
                fixed
                inset-0
                bg-black/30
                backdrop-blur-[2px]
                z-[60]
                lg:hidden
              "
            />

            {/* MOBILE DRAWER */}

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 300,
              }}
              className="
                fixed
                left-0
                top-0
                bottom-0
                w-[280px]
                max-w-[85vw]
                bg-white
                z-[70]
                shadow-2xl
                px-5
                py-6
                overflow-y-auto
                lg:hidden
              "
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header
          className="
            sticky
            top-0
            z-30
            bg-[#F7F9F8]/90
            backdrop-blur-xl
            border-b
            border-gray-100
          "
        >
          <div
            className="
              px-4
              sm:px-6
              md:px-8
              xl:px-10
              py-4
              sm:py-5
              flex
              items-center
              justify-between
              gap-3
            "
          >
            {/* LEFT SIDE */}

            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* HAMBURGER */}

              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileSidebarOpen}
                className="
                  lg:hidden
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  flex
                  items-center
                  justify-center
                  text-gray-600
                  hover:border-green-200
                  hover:text-green-700
                  hover:bg-green-50
                  transition
                  flex-shrink-0
                "
              >
                <Menu size={21} strokeWidth={2.2} />
              </button>

              {/* HEADER TEXT */}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 mb-1">
                  <span>Management</span>

                  <ChevronRight size={11} />

                  <span className="text-green-600 font-medium">Reports</span>
                </div>

                <h2
                  className="
                    text-xl
                    sm:text-2xl
                    md:text-3xl
                    font-extrabold
                    tracking-tight
                    text-gray-900
                    truncate
                  "
                >
                  Reports
                </h2>

                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-gray-500
                    mt-1
                    max-w-2xl
                    line-clamp-2
                  "
                >
                  Review and manage student reports and behavioral concerns.
                </p>
              </div>
            </div>

            {/* HEADER ACTIONS */}

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* NOTIFICATIONS */}

              <button
                onClick={() => setOpenNotif(true)}
                aria-label="Open notifications"
                className="
                  relative
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
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
                <Bell size={17} className="sm:w-[18px] sm:h-[18px]" />

                {notifications.length > 0 && (
                  <span
                    className="
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
                    "
                  >
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

              {/* PROFILE */}

              <div className="hidden sm:flex items-center gap-2 ml-1 md:ml-2">
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

        <div
          className="
            px-4
            sm:px-6
            md:px-8
            xl:px-10
            py-5
            sm:py-6
            md:py-8
            space-y-6
            sm:space-y-8
          "
        >
          {/* =================================================
              REPORT OVERVIEW
          ================================================= */}

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900">
                  Report Overview
                </h3>

                <p className="text-xs text-gray-400 mt-0.5">
                  Current status of student reports
                </p>
              </div>

              <Activity size={18} className="text-gray-300 flex-shrink-0" />
            </div>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-3
                sm:gap-4
              "
            >
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
            <div
              className="
      mb-4
      flex
      flex-col
      sm:flex-row
      sm:items-center
      sm:justify-between
      gap-3
    "
            >
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900">
                  Report Management
                </h3>

                <p className="text-xs text-gray-400 mt-0.5">
                  Review submitted reports, incidents, complaints, and insights.
                </p>
              </div>

              <button
                onClick={() => setShowPrintableReport(true)}
                className="
        self-start
        sm:self-center
        flex
        items-center
        justify-center
        gap-2
        px-4
        h-10
        rounded-xl
        bg-white
        border
        border-gray-200
        text-gray-700
        text-xs
        font-bold
        hover:border-green-200
        hover:bg-green-50
        hover:text-green-700
        transition
        shadow-sm
        whitespace-nowrap
      "
              >
                <Printer size={16} />
                Printable Report
              </button>
            </div>

            {/* SEARCH + TABS */}

            <div
              className="
                bg-white
                border
                border-gray-100
                rounded-2xl
                sm:rounded-3xl
                p-3
                sm:p-4
                shadow-[0_4px_24px_rgba(0,0,0,0.025)]
                mb-4
              "
            >
              <div
                className="
                  flex
                  flex-col
                  xl:flex-row
                  xl:items-center
                  justify-between
                  gap-3
                  sm:gap-4
                "
              >
                {/* SEARCH */}

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    px-3
                    sm:px-4
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
                  "
                >
                  <Search size={17} className="text-gray-400 flex-shrink-0" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student or offense..."
                    className="
                      bg-transparent
                      outline-none
                      w-full
                      min-w-0
                      text-sm
                      text-gray-800
                      placeholder:text-gray-400
                    "
                  />

                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="
                        text-gray-400
                        hover:text-gray-700
                        transition
                        flex-shrink-0
                      "
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* TABS */}

                <div
                  className="
                    w-full
                    xl:w-auto
                    min-w-0
                    overflow-x-auto
                    scrollbar-hide
                  "
                >
                  <div
                    className="
                      flex
                      gap-1
                      p-1
                      rounded-xl
                      bg-gray-50
                      border
                      border-gray-100
                      w-max
                      min-w-full
                      xl:min-w-0
                    "
                  >
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
            </div>

            {/* CONTENT */}

            <motion.div
              layout
              className="
                bg-white
                border
                border-gray-100
                rounded-2xl
                sm:rounded-3xl
                p-3
                sm:p-5
                shadow-[0_4px_24px_rgba(0,0,0,0.025)]
                min-h-[500px]
                min-w-0
                overflow-hidden
              "
            >
              {/* MOBILE REPORTS */}

              {activeTab === "mobile" && (
                <>
                  <div
                    className="
                      flex
                      flex-col
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                      gap-3
                      mb-5
                    "
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="
                            w-9
                            h-9
                            rounded-xl
                            bg-green-50
                            text-green-600
                            flex
                            items-center
                            justify-center
                            flex-shrink-0
                          "
                        >
                          <FileWarning size={17} />
                        </div>

                        <h3 className="font-bold text-gray-900 truncate">
                          Mobile Reports
                        </h3>
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Reports submitted through the EduGuard mobile app.
                      </p>
                    </div>

                    <div
                      className="
                        self-start
                        sm:self-center
                        px-2.5
                        py-1
                        rounded-lg
                        bg-green-50
                        text-green-700
                        text-[10px]
                        font-bold
                        whitespace-nowrap
                      "
                    >
                      {filteredReports.length}{" "}
                      {filteredReports.length === 1 ? "REPORT" : "REPORTS"}
                    </div>
                  </div>

                  {loading ? (
                    <LoadingState />
                  ) : filteredReports.length ? (
                    <div className="space-y-3 min-w-0">
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
                            rounded-xl
                            sm:rounded-2xl
                            p-3
                            sm:p-4
                            hover:bg-white
                            hover:shadow-sm
                            transition
                            min-w-0
                            overflow-hidden
                          "
                        >
                          <div className="min-w-0 overflow-x-auto">
                            <MobileReport
                              report={report}
                              onAccept={handleAccept}
                              onReject={handleReject}
                            />
                          </div>
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
                <div className="min-w-0 overflow-x-auto">
                  <IncidentReport />
                </div>
              )}

              {/* COMPLAINT */}

              {activeTab === "complaint" && (
                <div className="min-w-0 overflow-x-auto">
                  <ComplaintReport />
                </div>
              )}

              {/* OVERVIEW */}

              {activeTab === "overview" && (
                <div className="min-w-0 overflow-x-auto">
                  <Overview />
                </div>
              )}

              {/* AI */}

              {activeTab === "ai" && (
                <div className="min-w-0 overflow-x-auto">
                  <AIPredictions />
                </div>
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
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
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
                max-w-full
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

              <div
                className="
                  px-4
                  sm:px-6
                  py-4
                  sm:py-5
                  border-b
                  border-gray-100
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div className="min-w-0">
                  <h3
                    className="
                      font-bold
                      text-gray-900
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Bell size={17} className="flex-shrink-0" />
                    <span>Notifications</span>
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Recent report activity
                  </p>
                </div>

                <button
                  onClick={() => setOpenNotif(false)}
                  aria-label="Close notifications"
                  className="
                    w-9
                    h-9
                    rounded-xl
                    hover:bg-gray-100
                    flex
                    items-center
                    justify-center
                    transition
                    flex-shrink-0
                  "
                >
                  <X size={18} />
                </button>
              </div>

              {/* CONTENT */}

              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                {notifications.length === 0 ? (
                  <div
                    className="
                      h-full
                      flex
                      flex-col
                      items-center
                      justify-center
                      text-center
                      px-4
                    "
                  >
                    <div
                      className="
                        w-14
                        h-14
                        rounded-2xl
                        bg-gray-50
                        flex
                        items-center
                        justify-center
                        mb-4
                      "
                    >
                      <Bell size={22} className="text-gray-300" />
                    </div>

                    <p className="font-semibold text-gray-700">
                      No notifications
                    </p>

                    <p
                      className="
                        text-xs
                        text-gray-400
                        mt-1
                        max-w-[220px]
                      "
                    >
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
                          p-3
                          sm:p-4
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
                          <div
                            className="
                              w-9
                              h-9
                              rounded-xl
                              bg-green-100
                              flex
                              items-center
                              justify-center
                              flex-shrink-0
                            "
                          >
                            <FileWarning size={15} className="text-green-700" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className="
                                font-semibold
                                text-sm
                                text-gray-900
                                break-words
                              "
                            >
                              {notification.title}
                            </p>

                            <p
                              className="
                                text-xs
                                text-gray-500
                                mt-1
                                leading-relaxed
                                break-words
                              "
                            >
                              {notification.text}
                            </p>

                            <div
                              className="
                                flex
                                flex-col
                                sm:flex-row
                                items-start
                                sm:items-center
                                justify-between
                                gap-1
                                sm:gap-3
                                mt-2
                              "
                            >
                              <span
                                className="
                                  text-[10px]
                                  font-semibold
                                  text-green-700
                                  truncate
                                  max-w-full
                                "
                              >
                                {notification.student}
                              </span>

                              <span
                                className="
                                  text-[10px]
                                  text-gray-400
                                  whitespace-nowrap
                                "
                              >
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
              top-3
              sm:top-5
              left-3
              right-3
              sm:left-auto
              sm:right-5
              z-[999]
              w-auto
              sm:w-[380px]
              max-w-[calc(100vw-24px)]
              bg-white
              border
              border-gray-100
              rounded-2xl
              sm:rounded-3xl
              shadow-[0_20px_60px_rgba(0,0,0,0.14)]
              overflow-hidden
            "
          >
            <div className="p-4 sm:p-5 flex gap-3 sm:gap-4">
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
                  flex-shrink-0
                "
              >
                <Bell size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <p
                    className="
                      font-bold
                      text-gray-900
                      text-sm
                      truncate
                    "
                  >
                    {toastNotif.title}
                  </p>

                  <button
                    onClick={() => setToastNotif(null)}
                    aria-label="Close notification"
                    className="
                      text-gray-400
                      hover:text-gray-700
                      flex-shrink-0
                    "
                  >
                    <X size={15} />
                  </button>
                </div>

                <p
                  className="
                    text-sm
                    text-gray-600
                    mt-1
                    line-clamp-2
                    break-words
                  "
                >
                  {toastNotif.text}
                </p>

                <div
                  className="
                    flex
                    justify-between
                    items-center
                    mt-3
                    gap-3
                  "
                >
                  <span
                    className="
                      text-xs
                      text-green-700
                      font-semibold
                      truncate
                      min-w-0
                    "
                  >
                    {toastNotif.student}
                  </span>

                  <span
                    className="
                      text-[10px]
                      text-gray-400
                      whitespace-nowrap
                      flex-shrink-0
                    "
                  >
                    {new Date(toastNotif.time).toLocaleTimeString()}
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

      {/* =====================================================
    PRINTABLE REPORT
===================================================== */}

      {showPrintableReport && (
        <PrintableReport onClose={() => setShowPrintableReport(false)} />
      )}
    </div>
  );
};

/* =========================================================
   NAV
========================================================= */

const Nav = ({ icon, label, onClick, active }) => (
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
        ${active ? "text-green-600" : "text-gray-400 group-hover:text-gray-700"}
      `}
    >
      {icon}
    </span>

    {label}

    {active && (
      <span
        className="
          ml-auto
          w-1.5
          h-1.5
          rounded-full
          bg-green-600
        "
      />
    )}
  </button>
);

/* =========================================================
   TAB
========================================================= */

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-3
      sm:px-3.5
      py-2
      rounded-lg
      text-[11px]
      sm:text-xs
      font-semibold
      transition
      whitespace-nowrap
      flex-shrink-0
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

const StatCard = ({ title, value, icon, type }) => {
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
        rounded-2xl
        sm:rounded-3xl
        p-4
        sm:p-5
        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-400 truncate">
            {title}
          </p>

          <p
            className={`
              text-2xl
              sm:text-3xl
              font-extrabold
              tracking-tight
              mt-2
              sm:mt-3
              ${s.number}
            `}
          >
            {value}
          </p>
        </div>

        <div
          className={`
            w-9
            h-9
            sm:w-10
            sm:h-10
            rounded-xl
            flex
            items-center
            justify-center
            flex-shrink-0
            ${s.icon}
          `}
        >
          {icon}
        </div>
      </div>

      <div
        className={`
          mt-4
          sm:mt-5
          h-1
          w-10
          rounded-full
          ${s.line}
        `}
      />
    </motion.div>
  );
};

/* =========================================================
   LOADING
========================================================= */

const LoadingState = () => (
  <div className="py-16 sm:py-20">
    <div className="flex flex-col items-center justify-center">
      <div
        className="
          w-10
          h-10
          rounded-full
          border-[3px]
          border-green-500
          border-t-transparent
          animate-spin
        "
      />

      <p
        className="
          text-sm
          font-medium
          text-gray-500
          mt-4
        "
      >
        Loading reports...
      </p>
    </div>
  </div>
);

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = () => (
  <div className="py-16 sm:py-20 text-center px-4">
    <div
      className="
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
      "
    >
      <FileWarning size={24} />
    </div>

    <p
      className="
        text-sm
        font-bold
        text-gray-700
      "
    >
      No reports found
    </p>

    <p
      className="
        text-xs
        text-gray-400
        mt-1
        max-w-sm
        mx-auto
      "
    >
      Try adjusting your search filters or check again later.
    </p>
  </div>
);

export default ReportPage;
