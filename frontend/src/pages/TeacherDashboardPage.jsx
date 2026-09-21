import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  BookOpen,
  Moon,
  Sun,
  RefreshCw,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  FileClock,
  FileWarning,
  Plus,
} from "lucide-react";
import { API } from "../lib/api.js";
import { useAuthStore } from "../store/authStore";

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}

    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const theme = useMemo(
    () => ({
      page: darkMode
        ? "bg-[#07110B] text-gray-100"
        : "bg-[#F7F9F8] text-gray-900",
      sidebar: darkMode
        ? "bg-[#0B1710] border-[#17251B]"
        : "bg-white border-gray-100",
      card: darkMode
        ? "bg-[#0D1A12] border-[#1A2C20]"
        : "bg-white border-gray-100",
      subtle: darkMode ? "bg-[#101F15]" : "bg-gray-50",
      border: darkMode ? "border-[#1A2C20]" : "border-gray-100",
      heading: darkMode ? "text-gray-100" : "text-gray-900",
      body: darkMode ? "text-gray-300" : "text-gray-500",
      muted: darkMode ? "text-gray-500" : "text-gray-400",
    }),
    [darkMode],
  );

  const teacherName = useMemo(
    () =>
      [user?.firstName, user?.middleName, user?.lastName]
        .filter(Boolean)
        .join(" ") ||
      user?.name ||
      user?.fullName ||
      "Teacher",
    [user],
  );

  const teacherFirstName =
    user?.firstName || user?.name?.split(" ")?.[0] || "Teacher";

  const profilePhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  const userId = user?._id || user?.id;

  const normalizeArray = (payload, keys = []) => {
    if (Array.isArray(payload)) return payload;

    for (const key of keys) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }

    return [];
  };

  const fetchTeacherData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);

      const [reportsResponse, notificationsResponse] = await Promise.all([
        API.get("/api/reports"),
        API.get(`/api/notifications/${userId}/unread`),
      ]);

      const allReports = normalizeArray(reportsResponse.data, [
        "reports",
        "data",
      ]);

      // Teachers can review the reports available to the teacher portal.
      setReports(allReports);

      const incomingNotifications = normalizeArray(
        notificationsResponse.data,
        ["notifications", "data"],
      )
        .filter((notification) => !notification.isRead)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );

      setNotifications(incomingNotifications);
    } catch (error) {
      console.error("Teacher dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  const reportStatus = (report) =>
    String(report.status || report.reportStatus || "pending").toLowerCase();

  const statusGroup = (report) => {
    const status = reportStatus(report);

    if (
      ["resolved", "completed", "accepted", "approved", "closed"].some((item) =>
        status.includes(item),
      )
    ) {
      return "resolved";
    }

    if (
      ["rejected", "declined", "cancelled", "canceled"].some((item) =>
        status.includes(item),
      )
    ) {
      return "rejected";
    }

    return "pending";
  };

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => statusGroup(report) === "pending")
        .length,
      resolved: reports.filter((report) => statusGroup(report) === "resolved")
        .length,
      rejected: reports.filter((report) => statusGroup(report) === "rejected")
        .length,
    };
  }, [reports]);

  const recentReports = useMemo(
    () =>
      [...reports]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.date || 0) -
            new Date(a.createdAt || a.date || 0),
        )
        .slice(0, 5),
    [reports],
  );

  const markNotificationAsRead = async (notification) => {
    const notificationId = notification._id || notification.id;
    if (!notificationId) return;

    try {
      await API.put(`/api/notifications/read/${notificationId}`);
      setNotifications((current) =>
        current.filter(
          (item) =>
            String(item._id || item.id) !== String(notificationId),
        ),
      );
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!notifications.length) return;

    try {
      await API.put("/api/notifications/read-all");
      setNotifications([]);
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
    }
  };

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const formatDate = (value) => {
    if (!value) return "No date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusStyle = (report) => {
    const group = statusGroup(report);

    if (group === "resolved") {
      return darkMode
        ? "bg-green-500/10 text-green-400 border-green-500/20"
        : "bg-green-50 text-green-700 border-green-100";
    }

    if (group === "rejected") {
      return darkMode
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-red-50 text-red-700 border-red-100";
    }

    return darkMode
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-amber-50 text-amber-700 border-amber-100";
  };

  const statusLabel = (report) => {
    const group = statusGroup(report);
    if (group === "resolved") return "Resolved";
    if (group === "rejected") return "Rejected";
    return "In progress";
  };

  const Nav = ({ icon, label, path, active = false }) => (
    <button
      type="button"
      onClick={() => path && handleNavigation(path)}
      className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
        active
          ? darkMode
            ? "bg-green-500/10 text-green-400"
            : "bg-green-50 text-green-700"
          : darkMode
            ? "text-gray-400 hover:bg-[#101F15] hover:text-gray-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span
        className={`transition ${
          active
            ? "text-green-500"
            : darkMode
              ? "text-gray-600 group-hover:text-gray-300"
              : "text-gray-400 group-hover:text-gray-700"
        }`}
      >
        {icon}
      </span>
      {label}
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
      )}
    </button>
  );

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div>
        <div
          className={`flex items-center ${
            mobile ? "justify-between" : ""
          } gap-3 px-3 mb-7`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-green-500/10 blur-md" />
              <img
                src="/school-logo.webp"
                alt="School Logo"
                className="relative w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className={`text-xl font-extrabold tracking-tight ${theme.heading}`}>
                Guid<span className="text-green-500">Ed</span>
              </h1>
              <p className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}>
                Teacher Portal
              </p>
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                darkMode ? "bg-[#101F15] text-gray-400" : "bg-gray-50 text-gray-500"
              }`}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-3 mb-7">
          <p className={`text-[11px] leading-relaxed ${theme.muted}`}>
            Our Lady of the Holy Rosary
            <br />
            School
            <br />
            General Trias Campus
          </p>
        </div>

        <p className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Main Menu
        </p>

        <div className="space-y-1">
          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <Nav
            icon={<FileWarning size={18} />}
            label="My Reports"
            path="/teacher-my-reports"
            
          />
          <Nav icon={<ClipboardList size={18} />} label="My Class" path="/teacher-class" />
          <Nav icon={<MessageSquare size={18} />} label="Messages" path="/messages" />
          <Nav
            icon={<Plus size={18} />}
            label="Report an Incident"
            path="/teacher-reporting"
          />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Teacher Support
        </p>

        <div className="space-y-1">
          <Nav icon={<BookOpen size={18} />} label="Guidance Resources" path="/guidance" />
          <Nav icon={<LifeBuoy size={18} />} label="Contact Guidance" path="/messages" />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          System
        </p>

        <Nav icon={<Settings size={18} />} label="Settings" path="/settings" />
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                darkMode ? "bg-green-500/10" : "bg-green-100"
              }`}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt={teacherName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-green-500 font-bold">
                  {teacherName.charAt(0).toUpperCase()}
                </span>
              )}
              <span
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
                  darkMode ? "border-[#0B1710]" : "border-white"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>
                Teacher
              </p>
              <p className={`text-sm font-bold truncate ${theme.heading}`}>{teacherName}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${
            darkMode
              ? "text-gray-300 border-[#24392A] hover:bg-red-500/10 hover:text-red-400"
              : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  const StatCard = ({ title, value, icon, accent }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden border rounded-[26px] p-4 sm:p-5 shadow-sm ${theme.card}`}
    >
      <div
        className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl ${
          accent === "amber"
            ? "bg-amber-500/10"
            : accent === "blue"
              ? "bg-blue-500/10"
              : accent === "red"
                ? "bg-red-500/10"
                : "bg-green-500/10"
        }`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${theme.muted}`}
          >
            {title}
          </p>
          <p
            className={`text-3xl sm:text-4xl font-black tracking-tight mt-2 ${
              accent === "amber"
                ? darkMode
                  ? "text-amber-300"
                  : "text-amber-600"
                : accent === "blue"
                  ? darkMode
                    ? "text-blue-300"
                    : "text-blue-600"
                  : accent === "red"
                    ? darkMode
                      ? "text-red-300"
                      : "text-red-600"
                    : darkMode
                      ? "text-green-300"
                      : "text-green-600"
            }`}
          >
            {value}
          </p>
          <div
            className={`mt-3 h-1 rounded-full w-9 ${
              accent === "amber"
                ? "bg-amber-500"
                : accent === "blue"
                  ? "bg-blue-500"
                  : accent === "red"
                    ? "bg-red-500"
                    : "bg-green-500"
            }`}
          />
        </div>

        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            accent === "amber"
              ? darkMode
                ? "bg-amber-500/10 text-amber-400"
                : "bg-amber-50 text-amber-600"
              : accent === "blue"
                ? darkMode
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-blue-50 text-blue-600"
                : accent === "red"
                  ? darkMode
                    ? "bg-red-500/10 text-red-400"
                    : "bg-red-50 text-red-600"
                  : darkMode
                    ? "bg-green-500/10 text-green-400"
                    : "bg-green-50 text-green-600"
          }`}
        >
          {icon}
        </div>
      </div>

      <p className={`relative text-[9px] mt-4 ${theme.muted}`}>
        Based on available reports
      </p>
    </motion.div>
  );

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${theme.page}`}
    >
      <aside
        className={`hidden lg:flex w-[250px] xl:w-[270px] border-r flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 flex-shrink-0 ${theme.sidebar} ${theme.border}`}
      >
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] shadow-2xl flex flex-col justify-between px-5 py-5 lg:hidden ${theme.sidebar}`}
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header
          className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
            darkMode
              ? "bg-[#07110B]/90 border-[#17251B]"
              : "bg-[#F7F9F8]/90 border-gray-100"
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <div
                  className={`hidden sm:flex items-center gap-2 text-sm mb-1 ${theme.muted}`}
                >
                  <span>Teacher Portal</span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">
                    Dashboard
                  </span>
                </div>

                <h2
                  className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${theme.heading}`}
                >
                  Good day, {teacherFirstName}.
                </h2>

                <p className={`text-xs sm:text-sm mt-1 ${theme.body}`}>
                  Monitor student reports, guidance activity, and concerns that need attention.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-amber-300"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
                title="Toggle theme"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationOpen((value) => !value)}
                  className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  <Bell size={17} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      className={`absolute right-0 mt-3 w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border shadow-2xl overflow-hidden z-50 ${theme.card}`}
                    >
                      <div
                        className={`flex items-center justify-between p-4 border-b ${theme.border}`}
                      >
                        <p className={`font-extrabold text-sm ${theme.heading}`}>
                          Notifications
                        </p>
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-green-500"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className={`p-6 text-center text-xs ${theme.muted}`}>
                            You have no unread notifications.
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              type="button"
                              key={notification._id || notification.id}
                              onClick={() => markNotificationAsRead(notification)}
                              className={`w-full text-left p-4 border-b ${theme.border} hover:bg-green-500/5`}
                            >
                              <p className={`text-xs font-bold ${theme.heading}`}>
                                {notification.title || "New notification"}
                              </p>
                              <p className={`text-xs mt-1 ${theme.body}`}>
                                {notification.message ||
                                  notification.body ||
                                  "You have a new notification."}
                              </p>
                              <p className={`text-[10px] mt-2 ${theme.muted}`}>
                                {formatDate(notification.createdAt)}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6">
          {/* Teacher welcome / command center */}
          <section
            className={`relative overflow-hidden rounded-[30px] border p-5 sm:p-7 ${
              darkMode
                ? "bg-gradient-to-br from-[#123A22] via-[#0D2A19] to-[#08140D] border-green-500/10"
                : "bg-gradient-to-br from-[#166534] via-[#15803D] to-[#14532D] border-green-700/10"
            } text-white`}
          >
            <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-16 -bottom-24 w-56 h-56 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative grid lg:grid-cols-[1.4fr_0.8fr] gap-7 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={13} />
                  Teacher Workspace
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mt-4">
                  Welcome back, {teacherFirstName}.
                </h3>
                <p className="text-sm leading-relaxed text-green-50/80 mt-2 max-w-2xl">
                  Review submitted reports, stay informed about student concerns, and coordinate with the guidance team when support is needed.
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => navigate("/reports")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-green-800 text-xs font-extrabold hover:bg-green-50 transition shadow-sm"
                  >
                    <ClipboardList size={15} />
                    Review Reports
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/messages")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-extrabold hover:bg-white/15 transition"
                  >
                    <MessageSquare size={15} />
                    Message Guidance
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-green-100/70">
                    Reports
                  </p>
                  <p className="text-3xl font-black mt-2">{loading ? "—" : stats.total}</p>
                  <p className="text-[10px] text-green-100/70 mt-1">available to review</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-green-100/70">
                    In progress
                  </p>
                  <p className="text-3xl font-black mt-2">{loading ? "—" : stats.pending}</p>
                  <p className="text-[10px] text-green-100/70 mt-1">awaiting action</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}>
                  Quick actions
                </p>
                <h3 className={`text-lg font-black mt-1 ${theme.heading}`}>
                  Teacher tools
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  title: "Review Reports",
                  text: "Monitor submitted reports.",
                  icon: <ClipboardList size={19} />,
                  path: "/reports",
                  accent: "green",
                },
                {
                  title: "Students",
                  text: "Access student records.",
                  icon: <FileText size={19} />,
                  path: "/students",
                  accent: "blue",
                },
                {
                  title: "Messages",
                  text: "Contact the guidance team.",
                  icon: <MessageSquare size={19} />,
                  path: "/messages",
                  accent: "amber",
                },
                {
                  title: "Guidance Resources",
                  text: "Access helpful materials.",
                  icon: <BookOpen size={19} />,
                  path: "/guidance",
                  accent: "purple",
                },
              ].map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className={`group text-left rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                    theme.card
                  } ${theme.border}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      action.accent === "blue"
                        ? darkMode
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                        : action.accent === "amber"
                          ? darkMode
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-amber-50 text-amber-600"
                          : action.accent === "purple"
                            ? darkMode
                              ? "bg-violet-500/10 text-violet-400"
                              : "bg-violet-50 text-violet-600"
                            : darkMode
                              ? "bg-green-500/10 text-green-400"
                              : "bg-green-50 text-green-600"
                    }`}
                  >
                    {action.icon}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-4">
                    <div>
                      <p className={`text-xs font-extrabold ${theme.heading}`}>{action.title}</p>
                      <p className={`text-[10px] mt-1 ${theme.muted}`}>{action.text}</p>
                    </div>
                    <ArrowRight
                      size={15}
                      className={`${theme.muted} group-hover:text-green-500 transition`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Reports"
              value={loading ? "—" : stats.total}
              icon={<ClipboardList size={20} />}
              accent="blue"
            />
            <StatCard
              title="In Progress"
              value={loading ? "—" : stats.pending}
              icon={<Clock3 size={20} />}
              accent="amber"
            />
            <StatCard
              title="Resolved"
              value={loading ? "—" : stats.resolved}
              icon={<CheckCircle2 size={20} />}
              accent="green"
            />
            <StatCard
              title="Rejected"
              value={loading ? "—" : stats.rejected}
              icon={<AlertCircle size={20} />}
              accent="red"
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.85fr] gap-6">
            {/* Recent reports */}
            <div className={`rounded-[26px] border p-4 sm:p-5 ${theme.card}`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                    }`}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-extrabold ${theme.heading}`}>Recent reports</h3>
                    <p className={`text-[10px] mt-0.5 ${theme.muted}`}>
                      A quick look at the latest reports
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/reports")}
                  className="text-[10px] font-extrabold text-green-500 flex items-center gap-1"
                >
                  View all <ArrowUpRight size={13} />
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className={`h-16 rounded-2xl animate-pulse ${
                        darkMode ? "bg-white/5" : "bg-gray-50"
                      }`}
                    />
                  ))}
                </div>
              ) : recentReports.length === 0 ? (
                <div className={`rounded-2xl border border-dashed p-8 text-center ${theme.border}`}>
                  <div
                    className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center ${
                      darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                    }`}
                  >
                    <FileText size={23} />
                  </div>
                  <p className={`text-sm font-bold mt-3 ${theme.heading}`}>No reports available</p>
                  <p className={`text-xs mt-1 max-w-sm mx-auto ${theme.muted}`}>
                    Review submitted incident reports and follow up on concerns that may need guidance attention.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/reports")}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold"
                  >
                    <PlusCircle size={14} />
                    View reports
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentReports.map((report, index) => (
                    <motion.button
                      type="button"
                      whileHover={{ x: 3 }}
                      key={report._id || report.id || index}
                      onClick={() => navigate("/reports")}
                      className={`w-full flex items-center gap-3 text-left p-3 rounded-2xl border border-transparent ${
                        darkMode
                          ? "hover:bg-white/[0.03] hover:border-white/[0.05]"
                          : "hover:bg-gray-50 hover:border-gray-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                        }`}
                      >
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${theme.heading}`}>
                          {report.title ||
                            report.subject ||
                            report.incidentType ||
                            report.offense ||
                            "Incident report"}
                        </p>
                        <p className={`text-[10px] mt-1 truncate ${theme.body}`}>
                          {report.studentName ||
                            report.student?.name ||
                            report.student?.fullName ||
                            "Student not specified"}
                          {" • "}
                          {formatDate(report.createdAt || report.date)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg border text-[9px] font-extrabold whitespace-nowrap ${statusStyle(
                          report,
                        )}`}
                      >
                        {statusLabel(report)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Support panel */}
            <div className={`rounded-[26px] border p-5 ${theme.card}`}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <LifeBuoy size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold ${theme.heading}`}>Need guidance support?</h3>
                  <p className={`text-[10px] mt-1 ${theme.muted}`}>Connect with the guidance team when a student concern needs support.</p>
                </div>
              </div>

              <div
                className={`mt-5 rounded-2xl p-4 border ${
                  darkMode ? "bg-green-500/5 border-green-500/10" : "bg-green-50/70 border-green-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-green-500 mt-0.5" size={17} />
                  <div>
                    <p className={`text-xs font-extrabold ${theme.heading}`}>Guidance team</p>
                    <p className={`text-[10px] leading-relaxed mt-1 ${theme.body}`}>
                      Use GuidEd to review student concerns, communicate with the guidance team, and keep relevant information organized.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/messages")}
                  className="w-full flex items-center justify-between rounded-2xl bg-green-600 hover:bg-green-700 text-white px-4 py-3 text-xs font-extrabold transition"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={15} />
                    Message guidance
                  </span>
                  <ArrowUpRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/guidance")}
                  className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-extrabold transition ${
                    darkMode
                      ? "border-[#24392A] text-gray-300 hover:bg-white/5"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={15} />
                    Open guidance resources
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* Teacher-friendly safety / privacy reminder */}
          <section className={`rounded-[26px] border p-5 sm:p-6 ${theme.card}`}>
            <div className="grid md:grid-cols-[1fr_auto] gap-5 items-center">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold ${theme.heading}`}>Responsible reporting</h3>
                  <p className={`text-xs leading-relaxed mt-1 max-w-2xl ${theme.body}`}>
                    When reviewing a student concern, keep information accurate, objective, and relevant. Clear documentation helps the guidance team understand the situation and determine appropriate support.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/reports")}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold transition whitespace-nowrap"
              >
                <AlertCircle size={15} />
                View Reports
              </button>
            </div>
          </section>

          <section className={`rounded-[22px] border px-4 py-3 ${theme.subtle} ${theme.border}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className={`text-[10px] leading-relaxed ${theme.muted}`}>
                Dashboard data is based on the reports and guidance information available to your teacher account.
              </p>
              <button
                type="button"
                onClick={fetchTeacherData}
                disabled={refreshing}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold ${
                  darkMode
                    ? "border-[#24392A] text-gray-300 hover:bg-white/5"
                    : "border-gray-200 text-gray-600 hover:bg-white"
                } disabled:opacity-50`}
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboardPage;
