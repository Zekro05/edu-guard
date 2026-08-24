import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api.js";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Bell,
  Brain,
  BriefcaseBusiness,
  HandHelping,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Activity,
  X,
  ExternalLink,
  LogOut,
  ChevronRight,
} from "lucide-react";

import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";

import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
);

/* =========================================================
   SOCKET
========================================================= */

const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket"],
  autoConnect: false,
});

/* =========================================================
   DASHBOARD
========================================================= */

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [notifCount, setNotifCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");

  const notifSound = useRef(null);

  /* =========================================================
     FETCH DATA
  ========================================================= */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [s, r, i] = await Promise.all([
        API.get("/api/students"),
        API.get("/api/reports"),
        API.get("/api/incidents"),
      ]);

      setStudents(s.data || []);
      setReports(r.data?.reports || r.data || []);
      setIncidents(i.data || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  /* =========================================================
     SOCKET
  ========================================================= */

  useEffect(() => {
    socket.connect();

    notifSound.current = new Audio("/notification.mp3");
    notifSound.current.volume = 1;

    socket.on("connect", () => {
      console.log("🟢 CONNECTED:", socket.id);

      const userId = useAuthStore.getState().user?._id;

      if (userId) {
        socket.emit("join", userId);
        console.log("📡 Joined room:", userId);
      }
    });

    socket.onAny((event, data) => {
      console.log("📡 ANY EVENT:", event, data);
    });

    socket.on("newNotification", (data) => {
      console.log("📩 RECEIVED:", data);

      notifSound.current?.play().catch((err) => {
        console.log("🔇 Audio blocked:", err);
      });

      setNotifCount((prev) => prev + 1);

      setNotifications((prev) => [
        {
          id: data.id || Date.now(),
          title: data.title,
          text: data.message,
          createdAt: data.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);
    });

    fetchData();

    return () => {
      socket.off("connect");
      socket.off("newNotification");
      socket.offAny();
      socket.disconnect();
    };
  }, []);

  /* =========================================================
     RISK
  ========================================================= */

  const getRisk = (student) => {
    const count = student.totalIncidents || 0;

    if (count >= 5) return "High";
    if (count >= 2) return "Medium";

    return "Low";
  };

  const kpi = useMemo(
    () => ({
      total: students.length,
      high: students.filter((s) => getRisk(s) === "High").length,
      medium: students.filter((s) => getRisk(s) === "Medium").length,
      low: students.filter((s) => getRisk(s) === "Low").length,
    }),
    [students],
  );

  const topRisk = useMemo(() => {
    const priority = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return [...students]
      .sort((a, b) => priority[getRisk(b)] - priority[getRisk(a)])
      .slice(0, 5);
  }, [students]);

  /* =========================================================
     CHART DATA
  ========================================================= */

  const barData = useMemo(() => {
    const grouped = {};

    reports.forEach((report) => {
      const rawDate = report.date || report.createdAt;

      if (!rawDate) {
        grouped.Unknown = (grouped.Unknown || 0) + 1;
        return;
      }

      const date = new Date(rawDate);

      if (isNaN(date.getTime())) {
        grouped.Unknown = (grouped.Unknown || 0) + 1;
        return;
      }

      const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      grouped[formatted] = (grouped[formatted] || 0) + 1;
    });

    return {
      labels: Object.keys(grouped),
      datasets: [
        {
          label: "Reports",
          data: Object.values(grouped),
          backgroundColor: "rgba(22, 163, 74, 0.78)",
          hoverBackgroundColor: "#15803D",
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 34,
        },
      ],
    };
  }, [reports]);

  const pieData = useMemo(
    () => ({
      labels: ["High Risk", "Medium Risk", "Low Risk"],
      datasets: [
        {
          data: [kpi.high, kpi.medium, kpi.low],
          backgroundColor: ["#EF4444", "#F59E0B", "#22C55E"],
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    }),
    [kpi],
  );

  const lineData = useMemo(() => {
    const grouped = {};

    incidents.forEach((incident) => {
      if (!incident.createdAt) return;

      const date = new Date(incident.createdAt);

      if (isNaN(date.getTime())) return;

      const key = date.toISOString().split("T")[0];

      grouped[key] = (grouped[key] || 0) + 1;
    });

    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(a) - new Date(b),
    );

    const labels = sortedDates.map((dateString) => {
      const date = new Date(`${dateString}T00:00:00`);

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    return {
      labels,
      datasets: [
        {
          label: "Incidents",
          data: sortedDates.map((date) => grouped[date]),
          borderColor: "#15803D",
          backgroundColor: "rgba(21,128,61,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#15803D",
          borderWidth: 2.5,
        },
      ],
    };
  }, [incidents]);

  /* =========================================================
     AI
  ========================================================= */

  const runAI = async (type) => {
    setAiOpen(true);
    setAiText("Analyzing dashboard data...");

    try {
      const prompt = `
You are an AI assistant for a school behavioral analytics dashboard.

Return a SHORT response (max 4–6 sentences).

Context:
- Type: ${type}
- Students: ${students.length}
- Reports: ${reports.length}
- Incidents: ${incidents.length}

Format:
Give a clear insight, risk interpretation, and action recommendation.

Keep it professional, concise, and appropriate for school administrators.
`;

      const res = await API.post("/api/gemini/generate", {
        prompt,
      });

      const text =
        res.data?.text ||
        res.data?.response ||
        res.data ||
        "No response from AI.";

      setAiText(text.replace(/```/g, "").trim());
    } catch (error) {
      console.error("AI error:", error);

      setAiText(
        "AI is temporarily unavailable. Please check your Gemini endpoint or backend configuration.",
      );
    }
  };

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
     CHART OPTIONS
  ========================================================= */

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        border: {
          display: false,
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        border: {
          display: false,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 18,
          font: {
            size: 11,
          },
        },
      },
    },
  };

  /* =========================================================
     SKELETON
  ========================================================= */

  const Skeleton = () => (
    <div className="animate-pulse bg-white border border-gray-100 rounded-3xl h-36" />
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F7F9F8] text-gray-900 overflow-hidden">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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
              active
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
        {/* HEADER */}

        <header className="sticky top-0 z-30 bg-[#F7F9F8]/90 backdrop-blur-xl border-b border-gray-100">
          <div className="px-6 md:px-10 py-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span>Overview</span>
                <ChevronRight size={12} />
                <span className="text-green-600 font-medium">Dashboard</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Good day, {firstName}.
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Here's what's happening with your students today.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* AI */}

              <button
                onClick={() => runAI("risk")}
                className="
                  hidden sm:flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-gray-700
                  text-sm
                  font-semibold
                  hover:border-green-200
                  hover:text-green-700
                  hover:shadow-sm
                  transition
                "
              >
                <Brain size={17} />
                AI Insights
              </button>

              {/* NOTIFICATIONS */}

              <button
                onClick={() => {
                  setOpenNotif(!openNotif);

                  if (!openNotif) {
                    setNotifCount(0);
                  }
                }}
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

                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#F7F9F8]">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>

              {/* MOBILE PROFILE */}

              <div className="hidden md:flex lg:hidden items-center gap-2 ml-2">
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

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="px-6 md:px-10 py-8 space-y-8">
          {/* ===================================================
              KPI
          =================================================== */}

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Student Overview
                </h3>

                <p className="text-xs text-gray-400 mt-0.5">
                  Current behavioral risk distribution
                </p>
              </div>

              <Activity size={18} className="text-gray-300" />
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {loading ? (
                <>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Students"
                    value={kpi.total}
                    icon={<Users size={19} />}
                    type="total"
                  />

                  <StatCard
                    title="High Risk"
                    value={kpi.high}
                    icon={<AlertTriangle size={19} />}
                    type="high"
                  />

                  <StatCard
                    title="Medium Risk"
                    value={kpi.medium}
                    icon={<AlertTriangle size={19} />}
                    type="medium"
                  />

                  <StatCard
                    title="Low Risk"
                    value={kpi.low}
                    icon={<CheckCircle2 size={19} />}
                    type="low"
                  />
                </>
              )}
            </div>
          </section>

          {/* ===================================================
              HANDBOOK
          =================================================== */}

          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  School Resources
                </h3>

                <p className="text-xs text-gray-400 mt-0.5">
                  Quickly access school handbooks
                </p>
              </div>

              <BookOpen size={18} className="text-gray-300" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <ResourceCard
                title="Pupil Handbook"
                description="Guidelines and policies for pupils."
                url="https://online.fliphtml5.com/kjzdq/zomc/"
                type="green"
              />

              <ResourceCard
                title="Student Handbook"
                description="Student policies, responsibilities and guidelines."
                url="https://online.fliphtml5.com/kjzdq/fkfo/"
                type="amber"
              />
            </div>
          </section>

          {/* ===================================================
              CHARTS
          =================================================== */}

          <section>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900">Analytics</h3>

              <p className="text-xs text-gray-400 mt-0.5">
                Monitor reports, risk levels, and incident activity
              </p>
            </div>

            <div className="grid xl:grid-cols-3 gap-4">
              {/* REPORTS */}

              <ChartPanel
                title="Reports"
                subtitle="Reports submitted over time"
              >
                <div className="h-[270px]">
                  <Bar data={barData} options={barOptions} />
                </div>
              </ChartPanel>

              {/* RISK */}

              <ChartPanel
                title="Risk Distribution"
                subtitle="Current student risk levels"
              >
                <div className="h-[270px]">
                  <Pie data={pieData} options={pieOptions} />
                </div>
              </ChartPanel>

              {/* TRENDS */}

              <ChartPanel
                title="Incident Trends"
                subtitle="Incident activity over time"
              >
                <div className="h-[270px]">
                  <Line data={lineData} options={lineOptions} />
                </div>
              </ChartPanel>
            </div>
          </section>

          {/* ===================================================
              INSIGHTS
          =================================================== */}

          <section className="grid xl:grid-cols-2 gap-4 pb-10">
            {/* TOP RISK */}

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.025)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-gray-900">
                    Students Requiring Attention
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Based on incident frequency
                  </p>
                </div>

                <button
                  onClick={() => navigate("/students")}
                  className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="space-y-2">
                {topRisk.length === 0 ? (
                  <div className="py-10 text-center">
                    <CheckCircle2
                      size={30}
                      className="mx-auto text-green-500 mb-2"
                    />

                    <p className="text-sm font-semibold text-gray-700">
                      No students found
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Student risk information will appear here.
                    </p>
                  </div>
                ) : (
                  topRisk.map((student, index) => (
                    <RiskStudent
                      key={student._id}
                      student={student}
                      index={index}
                      risk={getRisk(student)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* AI */}

            <div
              className="
              relative
              overflow-hidden
              bg-gradient-to-br
              from-[#14532D]
              via-[#166534]
              to-[#15803D]
              rounded-3xl
              p-6
              text-white
              shadow-[0_12px_40px_rgba(21,128,61,0.16)]
            "
            >
              <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-green-300/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                      <Sparkles size={19} />
                    </div>

                    <h3 className="text-lg font-bold">AI Assistant</h3>

                    <p className="text-sm text-green-100 mt-1 max-w-sm">
                      Use GuidEd AI to quickly understand student behavior
                      patterns and generate actionable insights.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <AIAction
                    label="Analyze Risk"
                    description="Identify behavioral risk patterns"
                    onClick={() => runAI("risk")}
                  />

                  <AIAction
                    label="Analyze Reports"
                    description="Find patterns in submitted reports"
                    onClick={() => runAI("reports")}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* =====================================================
          NOTIFICATION DRAWER
      ===================================================== */}

      <AnimatePresence>
        {openNotif && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenNotif(false)}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
            />

            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 28 }}
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
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Bell size={17} />
                    Notifications
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Recent system activity
                  </p>
                </div>

                <button
                  onClick={() => setOpenNotif(false)}
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <Bell size={22} className="text-gray-300" />
                    </div>

                    <p className="font-semibold text-gray-700">
                      No notifications
                    </p>

                    <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                      New alerts and system updates will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
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
                          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Bell size={15} className="text-green-700" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900">
                              {notification.title}
                            </p>

                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {notification.text}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-2">
                              {new Date(
                                notification.createdAt,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================
          AI MODAL
      ===================================================== */}

      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="
              fixed
              bottom-6
              right-6
              z-50
              w-[calc(100%-48px)]
              sm:w-[380px]
              bg-white
              border
              border-gray-100
              rounded-3xl
              shadow-[0_20px_60px_rgba(0,0,0,0.14)]
              overflow-hidden
            "
          >
            <div className="p-5 bg-gradient-to-r from-green-700 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <Sparkles size={17} />
                  </div>

                  <div>
                    <p className="font-bold text-sm">GuidEd AI</p>

                    <p className="text-[10px] text-green-100">
                      Behavioral analytics assistant
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAiOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Brain size={15} className="text-green-700" />
                </div>

                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {aiText}
                </p>
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
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
    )}
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
    high: {
      icon: "bg-red-50 text-red-600",
      number: "text-red-600",
      line: "bg-red-500",
    },
    medium: {
      icon: "bg-amber-50 text-amber-600",
      number: "text-amber-600",
      line: "bg-amber-500",
    },
    low: {
      icon: "bg-green-50 text-green-600",
      number: "text-green-600",
      line: "bg-green-500",
    },
  };

  const s = styles[type];

  return (
    <motion.div
      whileHover={{ y: -2 }}
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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400">{title}</p>

          <p
            className={`text-3xl font-extrabold tracking-tight mt-3 ${s.number}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`
            w-10
            h-10
            rounded-xl
            flex
            items-center
            justify-center
            ${s.icon}
          `}
        >
          {icon}
        </div>
      </div>

      <div className={`mt-5 h-1 w-10 rounded-full ${s.line}`} />
    </motion.div>
  );
};

/* =========================================================
   RESOURCE CARD
========================================================= */

const ResourceCard = ({ title, description, url, type }) => {
  const green = type === "green";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => window.open(url, "_blank")}
      className="
        group
        cursor-pointer
        bg-white
        border
        border-gray-100
        rounded-3xl
        p-5
        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
        hover:shadow-md
        transition
      "
    >
      <div className="flex items-center justify-between">
        <div
          className={`
            w-11
            h-11
            rounded-xl
            flex
            items-center
            justify-center
            ${
              green
                ? "bg-green-50 text-green-600"
                : "bg-amber-50 text-amber-600"
            }
          `}
        >
          <BookOpen size={19} />
        </div>

        <div
          className="
            w-8
            h-8
            rounded-lg
            bg-gray-50
            flex
            items-center
            justify-center
            text-gray-400
            group-hover:text-green-600
            group-hover:bg-green-50
            transition
          "
        >
          <ExternalLink size={15} />
        </div>
      </div>

      <h4 className="font-bold text-gray-900 mt-4">{title}</h4>

      <p className="text-xs text-gray-400 mt-1">{description}</p>

      <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-green-700">
        Open handbook
        <ArrowUpRight size={13} />
      </div>
    </motion.div>
  );
};

/* =========================================================
   CHART PANEL
========================================================= */

const ChartPanel = ({ title, subtitle, children }) => (
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
    <div className="mb-4">
      <h3 className="font-bold text-sm text-gray-900">{title}</h3>

      <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>
    </div>

    {children}
  </div>
);

/* =========================================================
   RISK STUDENT
========================================================= */

const RiskStudent = ({ student, index, risk }) => {
  const styles = {
    High: {
      badge: "bg-red-50 text-red-600 border-red-100",
      dot: "bg-red-500",
    },
    Medium: {
      badge: "bg-amber-50 text-amber-600 border-amber-100",
      dot: "bg-amber-500",
    },
    Low: {
      badge: "bg-green-50 text-green-600 border-green-100",
      dot: "bg-green-500",
    },
  };

  const s = styles[risk];

  return (
    <div
      className="
        flex
        items-center
        gap-3
        p-3
        rounded-2xl
        hover:bg-gray-50
        transition
      "
    >
      <div className="w-8 text-center text-xs font-bold text-gray-300">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
        {student.firstName?.charAt(0)}
        {student.lastName?.charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {student.firstName} {student.lastName}
        </p>

        <p className="text-[11px] text-gray-400">
          {student.totalIncidents || 0} incidents
        </p>
      </div>

      <span
        className={`
          px-2.5
          py-1
          rounded-lg
          border
          text-[10px]
          font-bold
          ${s.badge}
        `}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`}
        />

        {risk}
      </span>
    </div>
  );
};

/* =========================================================
   AI ACTION
========================================================= */

const AIAction = ({ label, description, onClick }) => (
  <button
    onClick={onClick}
    className="
      w-full
      flex
      items-center
      justify-between
      gap-3
      p-3
      rounded-2xl
      bg-white/10
      border
      border-white/10
      hover:bg-white/15
      transition
      text-left
    "
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
        <Brain size={14} />
      </div>

      <div>
        <p className="text-sm font-semibold">{label}</p>

        <p className="text-[10px] text-green-100">{description}</p>
      </div>
    </div>

    <ArrowUpRight size={15} className="text-green-100" />
  </button>
);

export default DashboardPage;
