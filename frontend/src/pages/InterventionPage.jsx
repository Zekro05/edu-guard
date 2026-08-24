import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api";
import { exportInterventionPDF } from "../utils/exportInterventionPDF";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Search,
  X,
  Bell,
  Sparkles,
  Brain,
  Activity,
  CheckCircle2,
  FileText,
  HandHelping,
  BriefcaseBusiness,
  Clock3,
  ChevronRight,
  ClipboardCheck,
  UserRound,
  AlertCircle,
  Plus,
  Download,
  CircleCheck,
  Timer,
  LogOut,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";

const InterventionPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  /* =========================================================
     USER
  ========================================================= */

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Admin";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  /* =========================================================
     STATE
  ========================================================= */

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const [cases, setCases] = useState([]);
  const [interventions, setInterventions] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  const [auditLog, setAuditLog] = useState([]);
  const [openTimeline, setOpenTimeline] = useState(null);

  const [form, setForm] = useState({
    type: "warning",
    description: "",
  });

  const loggedInUser =
    JSON.parse(localStorage.getItem("user"))?.name ||
    adminName ||
    "Unknown User";

  const options = [
    "warning",
    "call a parent",
    "community service",
    "suspension",
  ];

  /* =========================================================
     AUDIT
  ========================================================= */

  const addAuditLog = (action) => {
    const entry = {
      id: Date.now(),
      action,
      time: new Date().toISOString(),
    };

    setAuditLog((prev) => [entry, ...prev]);
  };

  /* =========================================================
     FETCH
  ========================================================= */

  const fetchData = async () => {
    try {
      const [incidentRes, interventionRes] = await Promise.all([
        API.get("/api/incidents"),
        API.get("/api/interventions"),
      ]);

      const incidentsData = incidentRes.data || [];

      const reports = incidentsData.map((i) => {
        const student = i.studentId || {};

        return {
          _id: i._id,
          incidentId: i._id,

          studentId: student._id,

          studentName:
            `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
            "Unknown",

          grade: student.grade || "N/A",
          gender: student.gender || "N/A",
          studentCode: student.studentId || "N/A",

          age: student.birthDate
            ? new Date().getFullYear() -
              new Date(student.birthDate).getFullYear()
            : "N/A",

          offense: i.title || "No title",
          status: i.status,
        };
      });

      setCases(reports);

      const interventionData = interventionRes.data || [];
      setInterventions(interventionData);

      setNotifications(
        reports.slice(0, 10).map((r) => ({
          id: r._id,
          title: "Case Requires Intervention",
          text: r.offense,
          student: r.studentName,
          time: new Date().toISOString(),
        })),
      );
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getIncidentInterventions = (incidentId) => {
    return interventions.filter(
      (i) => String(i.incidentId?._id || i.incidentId) === String(incidentId),
    );
  };

  const getIncidentInterventionStatus = (incidentId) => {
    const list = getIncidentInterventions(incidentId);

    if (list.length === 0) {
      return "none";
    }

    const allCompleted = list.every((i) => i.status === "completed");

    if (allCompleted) {
      return "completed";
    }

    return "ongoing";
  };

  const recommendAction = (offense) => {
    const o = (offense || "").toLowerCase();

    if (o.includes("fighting")) return "Suspension";
    if (o.includes("bullying")) return "Call a Parent";
    if (o.includes("cheating")) return "Warning";

    return "Behavior Monitoring";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async () => {
    try {
      if (!selected) return;

      await API.post("/api/interventions", {
        studentId: selected.studentId,
        incidentId: selected.incidentId,

        type: form.type,
        description: form.description,

        interventionBy: loggedInUser,
        approvedBy: loggedInUser,
      });

      addAuditLog(`Created intervention: ${form.type}`);

      await fetchData();

      setForm({
        type: "warning",
        description: "",
      });

      setOpen(false);
      setSelected(null);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  /* =========================================================
     COMPLETE
  ========================================================= */

  const markComplete = async (id) => {
    try {
      await API.put(`/api/interventions/${id}/resolve`, {
        completedBy: loggedInUser,
      });

      addAuditLog("Marked intervention as completed");

      await fetchData();
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (c.status !== "intervention-ready") return false;

      const status = getIncidentInterventionStatus(c.incidentId);

      if (tab !== "all" && tab !== status) return false;

      if (
        search &&
        !c.studentName.toLowerCase().includes(search.toLowerCase()) &&
        !c.offense.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [cases, tab, search, interventions]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = {
    total: cases.length,

    ongoing: cases.filter(
      (c) => getIncidentInterventionStatus(c.incidentId) === "ongoing",
    ).length,

    completed: cases.filter(
      (c) => getIncidentInterventionStatus(c.incidentId) === "completed",
    ).length,

    pending: cases.filter(
      (c) => getIncidentInterventionStatus(c.incidentId) === "none",
    ).length,
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusConfig = (status) => {
    if (status === "completed") {
      return {
        label: "Completed",
        icon: CheckCircle2,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
        dot: "bg-emerald-500",
      };
    }

    if (status === "ongoing") {
      return {
        label: "Ongoing",
        icon: Activity,
        badge: "bg-amber-50 text-amber-700 border-amber-100",
        dot: "bg-amber-500",
      };
    }

    return {
      label: "Pending",
      icon: Clock3,
      badge: "bg-blue-50 text-blue-700 border-blue-100",
      dot: "bg-blue-500",
    };
  };

  /* =========================================================
     META
  ========================================================= */

  const Meta = ({ label, value, icon: Icon }) => (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={13} className="text-gray-400" />}

        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
      </div>

      <p className="text-sm font-semibold text-gray-700 truncate">
        {value || "N/A"}
      </p>
    </div>
  );

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F4F7FB] text-gray-900 overflow-hidden">
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="hidden lg:flex w-[270px] bg-white border-r border-gray-100 flex-col justify-between px-5 py-6">
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

          {/* NAV LABEL */}

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
              onClick={() => navigate("/reports")}
            />

            <Nav icon={<BriefcaseBusiness size={18} />} label="Cases"
            onClick={() => navigate("/cases")}/>

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions" active
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
        border border-gray-200
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

        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-gray-100">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span>Guidance</span>
                <ChevronRight size={13} />
                <span className="text-green-600 font-medium">Interventions</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-gray-900">
                Intervention Management
              </h2>

              <p className="text-sm text-gray-500 mt-1.5">
                Manage student interventions, sanctions, and rehabilitation
                plans.
              </p>
            </div>

            {/* NOTIFICATION */}

            <div className="relative">
              <button
                onClick={() => setOpenNotif(!openNotif)}
                className="
                  relative
                  w-11 h-11
                  rounded-xl
                  bg-white
                  border border-gray-200
                  text-gray-600
                  flex items-center justify-center
                  hover:bg-gray-50
                  hover:border-gray-300
                  transition
                "
              >
                <Bell size={18} />

                {notifications.length > 0 && (
                  <span
                    className="
                    absolute
                    -top-1
                    -right-1
                    min-w-[18px]
                    h-[18px]
                    px-1
                    rounded-full
                    bg-red-500
                    text-white
                    text-[9px]
                    font-bold
                    flex
                    items-center
                    justify-center
                    border-2
                    border-white
                  "
                  >
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {openNotif && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    className="
                      absolute
                      right-0
                      mt-3
                      w-[380px]
                      bg-white
                      border border-gray-200
                      rounded-2xl
                      shadow-xl
                      overflow-hidden
                      z-50
                    "
                  >
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          Notifications
                        </h3>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Cases requiring attention
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <Sparkles size={15} />
                      </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                          <Bell
                            size={24}
                            className="mx-auto text-gray-300 mb-3"
                          />

                          <p className="text-sm text-gray-500">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <motion.div
                            key={n.id}
                            whileHover={{ backgroundColor: "#f9fafb" }}
                            className="px-5 py-4 border-b border-gray-100 cursor-pointer"
                          >
                            <div className="flex gap-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <AlertCircle size={16} />
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-900">
                                  {n.title}
                                </p>

                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {n.text}
                                </p>

                                <div className="flex items-center justify-between gap-3 mt-2">
                                  <span className="text-[11px] font-semibold text-green-700 truncate">
                                    {n.student}
                                  </span>

                                  <span className="text-[10px] text-gray-400 shrink-0">
                                    {new Date(n.time).toLocaleTimeString([], {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
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
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="p-8 max-w-[1600px] mx-auto">
          {/* =================================================
              OVERVIEW
          ================================================= */}

          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Intervention Overview
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Monitor the current state of student intervention cases.
              </p>
            </div>
          </div>

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<FileText size={18} />}
              label="Total Cases"
              value={stats.total}
              description="All intervention-ready cases"
            />

            <StatCard
              icon={<Timer size={18} />}
              label="Ongoing"
              value={stats.ongoing}
              description="Currently being handled"
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />

            <StatCard
              icon={<CircleCheck size={18} />}
              label="Completed"
              value={stats.completed}
              description="Successfully resolved"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />

            <StatCard
              icon={<Clock3 size={18} />}
              label="Pending"
              value={stats.pending}
              description="Awaiting intervention"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>

          {/* =================================================
              SEARCH + FILTER
          ================================================= */}

          <div
            className="
            bg-white
            border border-gray-100
            rounded-2xl
            shadow-sm
            p-5
            mb-6
          "
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* SEARCH */}

              <div
                className="
                flex
                items-center
                gap-3
                h-11
                px-4
                rounded-xl
                bg-gray-50
                border
                border-gray-200
                w-full
                lg:max-w-md
                focus-within:border-green-300
                focus-within:ring-4
                focus-within:ring-green-50
                transition
              "
              >
                <Search size={17} className="text-gray-400 shrink-0" />

                <input
                  className="
                    bg-transparent
                    outline-none
                    w-full
                    text-sm
                    text-gray-700
                    placeholder:text-gray-400
                  "
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student or offense..."
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* TABS */}

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  {
                    id: "all",
                    label: "All",
                  },
                  {
                    id: "none",
                    label: "Pending",
                  },
                  {
                    id: "ongoing",
                    label: "Ongoing",
                  },
                  {
                    id: "completed",
                    label: "Completed",
                  },
                ].map((item) => (
                  <Tab
                    key={item.id}
                    label={item.label}
                    active={tab === item.id}
                    onClick={() => setTab(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* =================================================
              RESULTS HEADER
          ================================================= */}

          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Intervention Cases
              </p>

              <p className="text-xs text-gray-400 mt-0.5">
                Showing {filtered.length}{" "}
                {filtered.length === 1 ? "case" : "cases"}
              </p>
            </div>

            {search && (
              <span className="text-xs text-gray-400">
                Search results for{" "}
                <span className="font-semibold text-gray-600">"{search}"</span>
              </span>
            )}
          </div>

          {/* =================================================
              CASES
          ================================================= */}

          <div
            className="
            bg-white
            border border-gray-100
            rounded-2xl
            shadow-sm
            p-5
          "
          >
            {filtered.length === 0 ? (
              <div className="min-h-[420px] flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div
                    className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-green-50
                    text-green-600
                    flex
                    items-center
                    justify-center
                    mx-auto
                    mb-4
                  "
                  >
                    <ClipboardCheck size={28} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    No intervention cases
                  </h3>

                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    There are no cases matching your current search or
                    intervention filter.
                  </p>

                  {(search || tab !== "all") && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setTab("all");
                      }}
                      className="
                        mt-5
                        px-4
                        py-2
                        rounded-xl
                        text-sm
                        font-semibold
                        text-green-700
                        bg-green-50
                        hover:bg-green-100
                        transition
                      "
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filtered.map((c) => {
                  const status = getIncidentInterventionStatus(c.incidentId);

                  const statusConfig = getStatusConfig(status);
                  const StatusIcon = statusConfig.icon;

                  const interventionCount = getIncidentInterventions(
                    c.incidentId,
                  ).length;

                  return (
                    <motion.div
                      layout
                      key={c._id}
                      whileHover={{
                        y: -3,
                        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      onClick={() => {
                        setSelected(c);
                        setOpenTimeline(null);
                        setOpen(true);
                      }}
                      className="
                        group
                        bg-white
                        border
                        border-gray-100
                        rounded-2xl
                        p-5
                        cursor-pointer
                        transition-all
                        relative
                        overflow-hidden
                      "
                    >
                      {/* TOP */}

                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="
                          w-12
                          h-12
                          rounded-xl
                          bg-green-50
                          text-green-700
                          flex
                          items-center
                          justify-center
                          font-bold
                          text-sm
                          shrink-0
                        "
                        >
                          {getInitials(c.studentName)}
                        </div>

                        <div
                          className={`
                            flex
                            items-center
                            gap-1.5
                            px-2.5
                            py-1.5
                            rounded-lg
                            border
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wide
                            ${statusConfig.badge}
                          `}
                        >
                          <StatusIcon size={11} />
                          {statusConfig.label}
                        </div>
                      </div>

                      {/* STUDENT */}

                      <div className="mt-4">
                        <h3
                          className="
                          text-base
                          font-bold
                          text-gray-900
                          group-hover:text-green-700
                          transition-colors
                        "
                        >
                          {c.studentName}
                        </h3>

                        <p className="text-xs text-gray-400 mt-1">
                          {c.grade} • {c.studentCode} • {c.gender}
                        </p>
                      </div>

                      {/* INCIDENT */}

                      <div className="mt-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                            <AlertCircle size={11} className="text-gray-500" />
                          </div>

                          <p
                            className="
                            text-[10px]
                            uppercase
                            tracking-wider
                            font-bold
                            text-gray-400
                          "
                          >
                            Incident
                          </p>
                        </div>

                        <p
                          className="
                          text-sm
                          text-gray-700
                          leading-relaxed
                          line-clamp-2
                          min-h-[40px]
                        "
                        >
                          {c.offense}
                        </p>
                      </div>

                      {/* AI */}

                      <div
                        className="
                        mt-5
                        p-3.5
                        rounded-xl
                        bg-green-50/70
                        border
                        border-green-100
                      "
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="
                              w-7
                              h-7
                              rounded-lg
                              bg-white
                              text-green-600
                              flex
                              items-center
                              justify-center
                            "
                            >
                              <Brain size={14} />
                            </div>

                            <div>
                              <p
                                className="
                                text-[9px]
                                uppercase
                                tracking-wider
                                font-bold
                                text-green-600
                              "
                              >
                                AI Recommendation
                              </p>

                              <p
                                className="
                                text-xs
                                font-semibold
                                text-green-900
                                mt-0.5
                              "
                              >
                                {recommendAction(c.offense)}
                              </p>
                            </div>
                          </div>

                          <ChevronRight
                            size={15}
                            className="
                              text-green-400
                              group-hover:translate-x-0.5
                              transition
                            "
                          />
                        </div>
                      </div>

                      {/* FOOTER */}

                      <div
                        className="
                        flex
                        items-center
                        justify-between
                        mt-5
                        pt-4
                        border-t
                        border-gray-100
                      "
                      >
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <HandHelping size={13} />
                          {interventionCount}{" "}
                          {interventionCount === 1
                            ? "intervention"
                            : "interventions"}
                        </div>

                        <span
                          className="
                          text-xs
                          font-semibold
                          text-green-600
                          opacity-0
                          group-hover:opacity-100
                          transition
                        "
                        >
                          View Case →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* =====================================================
          MODAL
      ===================================================== */}

      <AnimatePresence>
        {open && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              p-5
              bg-gray-950/40
              backdrop-blur-sm
            "
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setOpen(false);
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.97,
                y: 16,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.97,
                y: 16,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
              }}
              className="
                w-full
                max-w-6xl
                max-h-[92vh]
                bg-[#F8FAFC]
                rounded-3xl
                shadow-2xl
                overflow-hidden
                border
                border-white
                flex
                flex-col
              "
            >
              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div
                className="
                px-7
                py-5
                bg-white
                border-b
                border-gray-100
                flex
                items-center
                justify-between
                shrink-0
              "
              >
                <div className="flex items-center gap-4">
                  <div
                    className="
                    w-12
                    h-12
                    rounded-xl
                    bg-green-50
                    text-green-700
                    flex
                    items-center
                    justify-center
                    font-bold
                  "
                  >
                    {getInitials(selected.studentName)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        {selected.studentName}
                      </h2>

                      <span
                        className="
                        px-2
                        py-1
                        rounded-md
                        bg-blue-50
                        text-blue-700
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                      "
                      >
                        Intervention
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      {selected.grade} • {selected.studentCode} •{" "}
                      {selected.gender}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-gray-50
                    border
                    border-gray-200
                    text-gray-500
                    flex
                    items-center
                    justify-center
                    hover:bg-gray-100
                    hover:text-gray-700
                    transition
                  "
                >
                  <X size={17} />
                </button>
              </div>

              {/* =================================================
                  MODAL BODY
              ================================================= */}

              <div
                className="
                grid
                grid-cols-1
                lg:grid-cols-12
                gap-6
                p-7
                overflow-y-auto
              "
              >
                {/* =================================================
                    LEFT
                ================================================= */}

                <div className="lg:col-span-5 space-y-5">
                  {/* STUDENT SUMMARY */}

                  <div
                    className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    p-5
                    shadow-sm
                  "
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="
                        w-7
                        h-7
                        rounded-lg
                        bg-gray-100
                        text-gray-500
                        flex
                        items-center
                        justify-center
                      "
                      >
                        <UserRound size={14} />
                      </div>

                      <h3 className="text-sm font-bold text-gray-900">
                        Student Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Meta
                        label="Student"
                        value={selected.studentName}
                        icon={UserRound}
                      />

                      <Meta label="Student ID" value={selected.studentCode} />

                      <Meta label="Grade" value={selected.grade} />

                      <Meta label="Gender" value={selected.gender} />
                    </div>
                  </div>

                  {/* INCIDENT */}

                  <div
                    className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    p-5
                    shadow-sm
                  "
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="
                        w-7
                        h-7
                        rounded-lg
                        bg-red-50
                        text-red-500
                        flex
                        items-center
                        justify-center
                      "
                      >
                        <AlertCircle size={14} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Incident Overview
                        </h3>

                        <p className="text-[10px] text-gray-400">
                          Report requiring intervention
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                      p-4
                      rounded-xl
                      bg-gray-50
                      border
                      border-gray-100
                    "
                    >
                      <p
                        className="
                        text-sm
                        text-gray-700
                        leading-relaxed
                      "
                      >
                        {selected.offense}
                      </p>
                    </div>
                  </div>

                  {/* AI */}

                  <div
                    className="
                    rounded-2xl
                    border
                    border-green-100
                    bg-green-50/80
                    p-5
                  "
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="
                        w-9
                        h-9
                        rounded-xl
                        bg-white
                        text-green-600
                        flex
                        items-center
                        justify-center
                      "
                      >
                        <Brain size={17} />
                      </div>

                      <div>
                        <p
                          className="
                          text-[10px]
                          uppercase
                          tracking-wider
                          font-bold
                          text-green-600
                        "
                        >
                          AI Recommendation
                        </p>

                        <p
                          className="
                          text-base
                          font-bold
                          text-green-900
                          mt-0.5
                        "
                        >
                          {recommendAction(selected.offense)}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-green-700/70 leading-relaxed">
                      Suggested based on the recorded incident and behavioral
                      analysis.
                    </p>
                  </div>

                  {/* CASE STATS */}

                  <div className="grid grid-cols-2 gap-3">
                    <Meta
                      label="Case Status"
                      value={
                        getStatusConfig(
                          getIncidentInterventionStatus(selected.incidentId),
                        ).label
                      }
                      icon={Activity}
                    />

                    <Meta
                      label="Interventions"
                      value={
                        getIncidentInterventions(selected.incidentId).length
                      }
                      icon={HandHelping}
                    />
                  </div>

                  {/* AUDIT */}

                  <div
                    className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    p-5
                  "
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-900">
                        Recent Activity
                      </h4>

                      <Activity size={15} className="text-gray-400" />
                    </div>

                    <div className="space-y-3 max-h-32 overflow-y-auto">
                      {auditLog.length === 0 ? (
                        <div
                          className="
                          py-3
                          text-center
                          text-xs
                          text-gray-400
                        "
                        >
                          No actions recorded yet.
                        </div>
                      ) : (
                        auditLog.map((a) => (
                          <div
                            key={a.id}
                            className="
                              flex
                              items-start
                              justify-between
                              gap-3
                              text-xs
                            "
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className="
                                mt-1
                                w-1.5
                                h-1.5
                                rounded-full
                                bg-green-500
                                shrink-0
                              "
                              />

                              <span className="text-gray-600">{a.action}</span>
                            </div>

                            <span
                              className="
                              text-[10px]
                              text-gray-400
                              shrink-0
                            "
                            >
                              {new Date(a.time).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* =================================================
                    RIGHT
                ================================================= */}

                <div className="lg:col-span-7 space-y-5">
                  {/* TIMELINE */}

                  <div
                    className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    shadow-sm
                    p-5
                  "
                  >
                    <div
                      className="
                      flex
                      items-center
                      justify-between
                      mb-5
                    "
                    >
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Intervention Timeline
                        </h3>

                        <p className="text-xs text-gray-400 mt-1">
                          Track all actions taken for this case.
                        </p>
                      </div>

                      <div
                        className="
                        w-8
                        h-8
                        rounded-lg
                        bg-green-50
                        text-green-600
                        flex
                        items-center
                        justify-center
                      "
                      >
                        <Clock3 size={15} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {getIncidentInterventions(selected.incidentId).length ===
                      0 ? (
                        <div
                          className="
                          py-10
                          text-center
                          rounded-xl
                          bg-gray-50
                          border
                          border-dashed
                          border-gray-200
                        "
                        >
                          <HandHelping
                            size={24}
                            className="mx-auto text-gray-300 mb-2"
                          />

                          <p className="text-sm font-medium text-gray-500">
                            No interventions yet
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            Create the first intervention below.
                          </p>
                        </div>
                      ) : (
                        getIncidentInterventions(selected.incidentId).map(
                          (i, index) => {
                            const isOpen = openTimeline === i._id;
                            const completed = i.status === "completed";

                            return (
                              <div
                                key={i._id}
                                className="
                                border
                                border-gray-100
                                rounded-xl
                                overflow-hidden
                              "
                              >
                                <button
                                  onClick={() =>
                                    setOpenTimeline(isOpen ? null : i._id)
                                  }
                                  className="
                                  w-full
                                  flex
                                  items-center
                                  justify-between
                                  p-4
                                  text-left
                                  hover:bg-gray-50
                                  transition
                                "
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="
                                    relative
                                    flex
                                    flex-col
                                    items-center
                                  "
                                    >
                                      <div
                                        className={`
                                        w-8
                                        h-8
                                        rounded-lg
                                        flex
                                        items-center
                                        justify-center
                                        ${
                                          completed
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-amber-50 text-amber-600"
                                        }
                                      `}
                                      >
                                        {completed ? (
                                          <CheckCircle2 size={15} />
                                        ) : (
                                          <Activity size={15} />
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <p
                                        className="
                                      text-sm
                                      font-bold
                                      text-gray-800
                                      capitalize
                                    "
                                      >
                                        {i.type}
                                      </p>

                                      <div
                                        className="
                                      flex
                                      items-center
                                      gap-2
                                      mt-1
                                    "
                                      >
                                        <span
                                          className={`
                                        w-1.5
                                        h-1.5
                                        rounded-full
                                        ${
                                          completed
                                            ? "bg-emerald-500"
                                            : "bg-amber-500"
                                        }
                                      `}
                                        />

                                        <span
                                          className="
                                        text-[10px]
                                        text-gray-400
                                        uppercase
                                        font-semibold
                                      "
                                        >
                                          {i.status}
                                        </span>

                                        {i.createdAt && (
                                          <>
                                            <span className="text-gray-300">
                                              •
                                            </span>

                                            <span
                                              className="
                                            text-[10px]
                                            text-gray-400
                                          "
                                            >
                                              {formatDate(i.createdAt)}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <ChevronRight
                                    size={16}
                                    className={`
                                    text-gray-400
                                    transition-transform
                                    ${isOpen ? "rotate-90" : ""}
                                  `}
                                  />
                                </button>

                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{
                                        height: 0,
                                        opacity: 0,
                                      }}
                                      animate={{
                                        height: "auto",
                                        opacity: 1,
                                      }}
                                      exit={{
                                        height: 0,
                                        opacity: 0,
                                      }}
                                      className="
                                      border-t
                                      border-gray-100
                                    "
                                    >
                                      <div className="p-4 space-y-4">
                                        {/* DESCRIPTION */}

                                        <div>
                                          <p
                                            className="
                                          text-[10px]
                                          uppercase
                                          tracking-wider
                                          font-bold
                                          text-gray-400
                                          mb-2
                                        "
                                          >
                                            Intervention Plan
                                          </p>

                                          <div
                                            className="
                                          p-3.5
                                          rounded-xl
                                          bg-gray-50
                                          border
                                          border-gray-100
                                        "
                                          >
                                            <p
                                              className="
                                            text-sm
                                            text-gray-600
                                            leading-relaxed
                                          "
                                            >
                                              {i.description ||
                                                "No description provided."}
                                            </p>
                                          </div>
                                        </div>

                                        {/* META */}

                                        <div className="grid grid-cols-2 gap-3">
                                          <Meta
                                            label="Intervention By"
                                            value={i.interventionBy}
                                          />

                                          <Meta
                                            label="Approved By"
                                            value={i.approvedBy}
                                          />

                                          <Meta
                                            label="Created At"
                                            value={formatDateTime(i.createdAt)}
                                          />

                                          <Meta
                                            label="Completed By"
                                            value={i.completedBy}
                                          />
                                        </div>

                                        {/* AUDIT TRAIL */}

                                        {i.auditLogs?.length > 0 && (
                                          <div
                                            className="
                                          border
                                          border-gray-100
                                          rounded-xl
                                          overflow-hidden
                                        "
                                          >
                                            <div
                                              className="
                                            px-3
                                            py-2.5
                                            bg-gray-50
                                            border-b
                                            border-gray-100
                                          "
                                            >
                                              <p
                                                className="
                                              text-[10px]
                                              uppercase
                                              tracking-wider
                                              font-bold
                                              text-gray-500
                                            "
                                              >
                                                Audit Trail
                                              </p>
                                            </div>

                                            {i.auditLogs.map((log, idx) => (
                                              <div
                                                key={idx}
                                                className="
                                                  px-3
                                                  py-3
                                                  flex
                                                  items-start
                                                  justify-between
                                                  gap-4
                                                  border-b
                                                  last:border-b-0
                                                  border-gray-100
                                                "
                                              >
                                                <div>
                                                  <p
                                                    className="
                                                    text-xs
                                                    font-semibold
                                                    text-gray-700
                                                  "
                                                  >
                                                    {log.action}
                                                  </p>

                                                  {log.note && (
                                                    <p
                                                      className="
                                                      text-[11px]
                                                      text-gray-400
                                                      mt-1
                                                    "
                                                    >
                                                      {log.note}
                                                    </p>
                                                  )}
                                                </div>

                                                <div
                                                  className="
                                                  text-right
                                                  shrink-0
                                                "
                                                >
                                                  <p
                                                    className="
                                                    text-[11px]
                                                    font-medium
                                                    text-gray-600
                                                  "
                                                  >
                                                    {log.by}
                                                  </p>

                                                  <p
                                                    className="
                                                    text-[9px]
                                                    text-gray-400
                                                    mt-1
                                                  "
                                                  >
                                                    {formatDateTime(
                                                      log.createdAt || log.time,
                                                    )}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* COMPLETE */}

                                        {!completed && (
                                          <button
                                            onClick={() => markComplete(i._id)}
                                            className="
                                            w-full
                                            h-10
                                            rounded-xl
                                            bg-green-600
                                            hover:bg-green-700
                                            text-white
                                            text-xs
                                            font-semibold
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            transition
                                            active:scale-[0.99]
                                          "
                                          >
                                            <CheckCircle2 size={15} />
                                            Mark Intervention Complete
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          },
                        )
                      )}
                    </div>
                  </div>

                  {/* CREATE */}

                  <div
                    className="
                    bg-white
                    border
                    border-gray-100
                    rounded-2xl
                    shadow-sm
                    p-5
                  "
                  >
                    <div className="flex items-center gap-3 mb-5">
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
                      "
                      >
                        <Plus size={17} />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Create Intervention
                        </h4>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Add a new action or rehabilitation plan.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          className="
                          block
                          text-[10px]
                          uppercase
                          tracking-wider
                          font-bold
                          text-gray-400
                          mb-2
                        "
                        >
                          Intervention Type
                        </label>

                        <select
                          value={form.type}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              type: e.target.value,
                            })
                          }
                          className="
                            w-full
                            h-11
                            bg-gray-50
                            border
                            border-gray-200
                            rounded-xl
                            px-4
                            text-sm
                            text-gray-700
                            outline-none
                            focus:border-green-300
                            focus:ring-4
                            focus:ring-green-50
                            transition
                          "
                        >
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          className="
                          block
                          text-[10px]
                          uppercase
                          tracking-wider
                          font-bold
                          text-gray-400
                          mb-2
                        "
                        >
                          Intervention Plan
                        </label>

                        <textarea
                          rows={4}
                          value={form.description}
                          placeholder="Describe the intervention plan, expected outcome, or follow-up actions..."
                          onChange={(e) =>
                            setForm({
                              ...form,
                              description: e.target.value,
                            })
                          }
                          className="
                            w-full
                            bg-gray-50
                            border
                            border-gray-200
                            rounded-xl
                            px-4
                            py-3
                            text-sm
                            text-gray-700
                            placeholder:text-gray-400
                            outline-none
                            resize-none
                            focus:border-green-300
                            focus:ring-4
                            focus:ring-green-50
                            transition
                          "
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div
                className="
                px-7
                py-4
                bg-white
                border-t
                border-gray-100
                flex
                items-center
                justify-between
                shrink-0
              "
              >
                <button
                  onClick={() => exportInterventionPDF(selected, interventions)}
                  className="
                    h-10
                    px-4
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-gray-600
                    text-xs
                    font-semibold
                    flex
                    items-center
                    gap-2
                    hover:bg-gray-50
                    transition
                  "
                >
                  <Download size={14} />
                  Export Report
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="
                      h-10
                      px-4
                      rounded-xl
                      bg-gray-50
                      border
                      border-gray-200
                      text-gray-600
                      text-xs
                      font-semibold
                      hover:bg-gray-100
                      transition
                    "
                  >
                    Cancel
                  </button>

                  <button
                    onClick={submit}
                    disabled={!form.description.trim()}
                    className="
                      h-10
                      px-5
                      rounded-xl
                      bg-green-600
                      hover:bg-green-700
                      disabled:bg-gray-300
                      disabled:cursor-not-allowed
                      text-white
                      text-xs
                      font-semibold
                      flex
                      items-center
                      gap-2
                      transition
                    "
                  >
                    <CheckCircle2 size={14} />
                    Save Intervention
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
    )}
  </button>
);

/* =========================================================
   TAB
========================================================= */

const Tab = ({ label, active, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`
      h-10
      px-4
      rounded-xl
      text-xs
      font-semibold
      whitespace-nowrap
      transition-all
      ${
        active
          ? "bg-green-600 text-white shadow-sm"
          : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100 hover:text-gray-700"
      }
    `}
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
  description,
  iconBg = "bg-green-50",
  iconColor = "text-green-600",
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="
      bg-white
      border
      border-gray-100
      rounded-2xl
      p-5
      shadow-sm
      transition-shadow
      hover:shadow-md
    "
  >
    <div className="flex items-start justify-between">
      <div
        className={`
          w-10
          h-10
          rounded-xl
          flex
          items-center
          justify-center
          ${iconBg}
          ${iconColor}
        `}
      >
        {icon}
      </div>

      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-300">
        Overview
      </span>
    </div>

    <p className="text-xs font-medium text-gray-400 mt-5">{label}</p>

    <div className="flex items-end justify-between gap-3 mt-1">
      <h2 className="text-2xl font-black text-gray-900">{value}</h2>
    </div>

    <p className="text-[10px] text-gray-400 mt-1">{description}</p>
  </motion.div>
);

export default InterventionPage;
