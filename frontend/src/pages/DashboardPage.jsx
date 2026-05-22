import { useNavigate } from "react-router-dom";
import { useAuthStore} from "../store/authStore";
import { useEffect, useState, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api.js"





import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Gavel,
  BookOpen,
  Sparkles,
  Bell,
  Brain,
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
  PointElement
);

/* ================= SOCKET ================= */
const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket"],
  autoConnect: false,
});

/* ================= DASHBOARD ================= */

const DashboardPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [notifCount, setNotifCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.length;

  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const notifSound = useRef(null);

  const socketRef = useRef(null);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    setLoading(true);

    const [s, r, i] = await Promise.all([
      API.get("/api/students"),
      API.get("/api/reports"),
      API.get("/api/incidents"),
    ]);

    setStudents(s.data || []);
    setReports(r.data?.reports || r.data || []);
    setIncidents(i.data || []);

    setTimeout(() => setLoading(false), 600);
  };


  /* ================= SOCKET ================= */
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
        createdAt: data.createdAt,
      },
      ...prev,
    ]);
  });

  fetchData();
  return () => socket.disconnect();
}, []);

  /* ================= RISK ================= */
  const getRisk = (s) => {
    const c = s.totalIncidents || 0;
    if (c >= 5) return "High";
    if (c >= 2) return "Medium";
    return "Low";
  };

  const kpi = useMemo(() => ({
    total: students.length,
    high: students.filter(s => getRisk(s) === "High").length,
    medium: students.filter(s => getRisk(s) === "Medium").length,
    low: students.filter(s => getRisk(s) === "Low").length,
  }), [students]);

  const topRisk = useMemo(() => {
    const p = { High: 3, Medium: 2, Low: 1 };
    return [...students]
      .sort((a, b) => p[getRisk(b)] - p[getRisk(a)])
      .slice(0, 5);
  }, [students]);

  /* ================= CHARTS ================= */
  const barData = useMemo(() => {
    const g = {};
    reports.forEach(r => {
      const d = r.date || "Unknown";
      g[d] = (g[d] || 0) + 1;
    });

    return {
      labels: Object.keys(g),
      datasets: [{
        label: "Reports",
        data: Object.values(g),
        backgroundColor: "rgba(27,94,32,0.75)",
        borderRadius: 10,
      }],
    };
  }, [reports]);

  const pieData = useMemo(() => ({
    labels: ["High", "Medium", "Low"],
    datasets: [{
      data: [kpi.high, kpi.medium, kpi.low],
      backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"],
      borderWidth: 0,
    }],
  }), [kpi]);

  const lineData = useMemo(() => {
    const g = {};
    incidents.forEach(i => {
      const d = new Date(i.createdAt).toLocaleDateString();
      g[d] = (g[d] || 0) + 1;
    });

    return {
      labels: Object.keys(g),
      datasets: [{
        label: "Incidents",
        data: Object.values(g),
        borderColor: "#1B5E20",
        tension: 0.4,
      }],
    };
  }, [incidents]);

  /* ================= AI WIDGET ================= */
  const runAI = async (type) => {
  setAiOpen(true);
  setAiText("Thinking...");
  
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
Keep it professional and concise.
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
  } catch (err) {
    setAiText(
      "AI temporarily unavailable. Please check backend Gemini endpoint or API key configuration."
    );
  }
};

  /* ================= LOADING SKELETON ================= */
  const Skeleton = () => (
    <div className="animate-pulse bg-white/40 border rounded-2xl h-28" />
  );

  return (
    <div className="h-screen w-screen flex bg-[#F4F7FB] text-gray-900">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 bg-white/70 backdrop-blur-2xl border-r border-white/30 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-600">GuidEd</h1>
          <p className="text-xs text-gray-500 mb-6">School System</p>

          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <Nav icon={<Users size={18} />} label="Students" onClick={() => navigate("/students")} />
          <Nav icon={<ShieldX size={18} />} label="Guidance" onClick={() => navigate("/guidance")} />
          <Nav icon={<ChartNoAxesCombined size={18} />} label="Reports" onClick={() => navigate("/reports")} />
          <Nav icon={<Gavel size={18} />} label="Cases" onClick={() => navigate("/cases")} />
          <Nav icon={<Settings size={18} />} label="Settings" onClick={() => navigate("/settings")} />
        </div>

        <button
          onClick={logout}
          className="bg-green-600 text-white py-3 rounded-2xl"
        >
          Logout
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 overflow-y-auto">

        {/* HEADER */}
        <div className="sticky top-0 z-30 px-12 py-6 bg-white/50 backdrop-blur-2xl border-b border-white/30 flex justify-between">
          <div>
            <h2 className="text-4xl font-black">Dashboard</h2>
            <p className="text-gray-500">Real-time insights & analytics</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => runAI("risk")} className="p-3 rounded-2xl bg-white border">
              <Brain size={18} />
            </button>

            <button onClick={() => {
    setOpenNotif(!openNotif);

    // clear unread count when opened
    if (!openNotif) {
      setNotifCount(0);
    }
  }} className="p-3 rounded-2xl bg-white border relative">
              <Bell size={18} />
              {unreadCount > 0 &&  (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS DRAWER */}
        <AnimatePresence>
          {openNotif && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="fixed right-0 top-0 h-full w-[360px] bg-white/70 backdrop-blur-2xl border-l border-white/30 p-6 z-50"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Bell size={16} /> Notifications
              </h3>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-4 bg-white border rounded-xl">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
  {new Date(n.createdAt).toLocaleString()}
</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI FLOATING WIDGET */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed bottom-10 right-10 w-[320px] bg-white/80 backdrop-blur-2xl border rounded-2xl p-5 shadow-xl"
            >
              <div className="flex justify-between mb-2">
                <span className="font-bold flex items-center gap-2">
                  <Sparkles size={16} /> AI Insight
                </span>
                <button onClick={() => setAiOpen(false)}>✕</button>
              </div>
              <p className="text-sm text-gray-700">{aiText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI */}
        <div className="grid md:grid-cols-4 gap-6 px-12 mt-10">
          {loading ? (
            <>
              <Skeleton /><Skeleton /><Skeleton /><Skeleton />
            </>
          ) : (
            <>
              <Glass label="Total Students" value={kpi.total} />
              <Glass label="High Risk" value={kpi.high} level="high" />
              <Glass label="Medium Risk" value={kpi.medium} level="medium" />
              <Glass label="Low Risk" value={kpi.low} level="low"  />
            </>
          )}
        </div>

        {/* HAND BOOK */}
        <div className="px-12 mt-10">
          <Panel title="Handbook Access">
            <div className="grid md:grid-cols-2 gap-5">
              <Card title="Pupil Handbook" color="green" url="https://online.fliphtml5.com/kjzdq/zomc/" />
              <Card title="Student Handbook" color="amber" url="https://online.fliphtml5.com/kjzdq/fkfo/" />
            </div>
          </Panel>
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-3 gap-6 px-12 mt-10">
          <Panel title="Reports"><Bar data={barData} /></Panel>
          <Panel title="Risk"><Pie data={pieData} /></Panel>
          <Panel title="Trends"><Line data={lineData} /></Panel>
        </div>

        {/* INSIGHTS */}
        <div className="grid lg:grid-cols-2 gap-6 px-12 mt-10 pb-10">
          <Panel title="Top Risk Students">
            {topRisk.map(s => (
              <div key={s._id} className="p-4 rounded-2xl
    bg-white/70 backdrop-blur-xl
    border border-white/40
    flex justify-between items-center
    transition
    hover:scale-[1.01] hover:shadow-md
">
                <div>
                  <p className="font-semibold">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-500">{s.totalIncidents} incidents</p>
                </div>
                <span className="
  px-3 py-1 text-xs rounded-full
  bg-gray-100 border
">
  {getRisk(s)}
</span>
              </div>
            ))}
          </Panel>

          <Panel title="AI Quick Actions">
            <button onClick={() => runAI("risk")} className="
    w-full p-3 rounded-2xl
    bg-gradient-to-r from-green-600 to-green-500
    text-white font-medium
    shadow-md
    hover:shadow-xl hover:scale-[1.02]
    transition
  "
>
              Analyze Risk
            </button>
            <button onClick={() => runAI("reports")} className="
    w-full p-3 rounded-2xl
    bg-white/70 border border-white/40
    hover:bg-white
    font-medium
    shadow-sm hover:shadow-md
    transition
  "
>
              Analyze Reports
            </button>
          </Panel>
        </div>

      </main>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const Nav = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full ${
      active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    {label}
  </button>
);

const Glass = ({ label, value, level = "low" }) => {
  const styles = {
    low: {
      glow: "bg-green-200/20",
      accent: "from-green-500",
      border: "border-green-200/40",
      text: "text-green-700",
    },
    medium: {
      glow: "bg-orange-200/25",
      accent: "from-orange-500",
      border: "border-orange-200/40",
      text: "text-orange-700",
    },
    high: {
      glow: "bg-red-200/25",
      accent: "from-red-500",
      border: "border-red-200/40",
      text: "text-red-700",
    },
  };

  const s = styles[level] || styles.low;

  return (
    <div
      className={`
        relative overflow-hidden
        p-6 rounded-3xl
        bg-white/70 backdrop-blur-2xl
        border ${s.border}
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        transition hover:scale-[1.02] hover:shadow-xl
      `}
    >
      {/* dynamic glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 ${s.glow} blur-3xl rounded-full`}
      />

      <p className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <h2 className={`text-4xl font-bold mt-2 tracking-tight ${s.text}`}>
        {value}
      </h2>

      {/* bottom accent line */}
      <div
        className={`mt-4 h-[2px] w-12 bg-gradient-to-r ${s.accent} to-transparent rounded-full`}
      />
    </div>
  );
};

const Panel = ({ title, children }) => (
  <div className="bg-white/45 border rounded-3xl p-6">
    <h3 className="font-bold mb-4">{title}</h3>
    {children}
  </div>
);

const Card = ({ title, url }) => (
  <div
    onClick={() => window.open(url, "_blank")}
    className="
      group cursor-pointer
      p-5 rounded-2xl
      bg-white/70 backdrop-blur-xl
      border border-white/40
      shadow-sm
      transition
      hover:shadow-lg hover:scale-[1.02]
    "
  >
    <p className="font-semibold text-gray-900 group-hover:text-green-600 transition">
      {title}
    </p>

    <p className="text-xs text-gray-500 mt-1">
      Open handbook →
    </p>

    <div className="mt-3 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-green-500 to-transparent transition-all duration-300" />
  </div>
);

export default DashboardPage;