import { useNavigate } from "react-router-dom";
import { useAuthStore, API } from "../store/authStore";
import { useEffect, useState, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Gavel,
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

/* ================= TOAST SYSTEM ================= */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const pushToast = (msg) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg }]);

    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 3500);
  };

  const Toasts = () => (
    <div className="fixed bottom-5 right-5 space-y-3 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-3 rounded-xl bg-white/80 backdrop-blur-xl border shadow-lg text-sm"
        >
          {t.msg}
        </div>
      ))}
    </div>
  );

  return { pushToast, Toasts };
};

/* ================= DASHBOARD ================= */

const DashboardPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const { pushToast, Toasts } = useToast();

  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [notifCount, setNotifCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const socketRef = useRef(null);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    const [s, r, i] = await Promise.all([
      API.get("/api/students"),
      API.get("/api/reports"),
      API.get("/api/incidents"),
    ]);

    setStudents(s.data || []);
    setReports(Array.isArray(r.data?.reports) ? r.data.reports : r.data || []);
    setIncidents(Array.isArray(i.data) ? i.data : []);
  };

  /* ================= SOCKET ================= */
  useEffect(() => {
    const socket = io("https://edu-guard-backend.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("newNotification", (data) => {
  setReports((prev) => [data, ...prev]);

  setNotifications((prev) => [
    {
      id: data.id || data._id || Date.now(),
      title: data.title || "New Report",
      message: data.message || "A new report was submitted",
      type: data.type || "update",
      priority: data.priority || "normal",
      time: new Date(),
      isRead: false,
    },
    ...prev,
  ]);

  setNotifCount((prev) => prev + 1);
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
    high: students.filter((s) => getRisk(s) === "High").length,
    medium: students.filter((s) => getRisk(s) === "Medium").length,
    low: students.filter((s) => getRisk(s) === "Low").length,
  }), [students]);

  const topRisk = useMemo(() => {
    const priority = { High: 3, Medium: 2, Low: 1 };

    return [...students]
      .sort((a, b) => priority[getRisk(b)] - priority[getRisk(a)])
      .slice(0, 6);
  }, [students]);

  const behaviorSummary = useMemo(() => ({
    high: kpi.high,
    medium: kpi.medium,
    low: kpi.low,
  }), [kpi]);

  /* ================= CHARTS ================= */
  const barData = useMemo(() => {
    const grouped = {};
    reports.forEach(r => {
      const d = r.date || "Unknown";
      grouped[d] = (grouped[d] || 0) + 1;
    });

    return {
      labels: Object.keys(grouped),
      datasets: [{
        label: "Reports",
        data: Object.values(grouped),
        backgroundColor: "rgba(27,94,32,0.75)",
        borderRadius: 12,
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
    const grouped = {};
    incidents.forEach(i => {
      const d = new Date(i.createdAt).toLocaleDateString();
      grouped[d] = (grouped[d] || 0) + 1;
    });

    return {
      labels: Object.keys(grouped),
      datasets: [{
        label: "Incidents",
        data: Object.values(grouped),
        borderColor: "#1B5E20",
        tension: 0.35,
      }],
    };
  }, [incidents]);

  /* ================= UI ================= */
  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-600">GuidEd</h1>
          <p className="text-xs text-gray-500 mb-6">School Management System</p>

          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <Nav icon={<Users size={18} />} label="Students" onClick={() => navigate("/students")} />
          <Nav icon={<ShieldX size={18} />} label="Guidance" onClick={() => navigate("/guidance")} />
          <Nav icon={<ChartNoAxesCombined size={18} />} label="Reports" onClick={() => navigate("/reports")} />
          <Nav icon={<Gavel size={18} />} label="Cases" onClick={() => navigate("/cases")} />
          <Nav icon={<Gavel size={18} />} label="Interventions" onClick={() => navigate("/interventions")} />
          <Nav icon={<Settings size={18} />} label="Settings" onClick={() => navigate("/settings")} />
        </div>

        <button
          onClick={logout}
          className="w-full bg-green-600 text-white py-2 rounded-xl"
        >
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-10 space-y-10 overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Dashboard Overview
            </h2>
            <p className="text-gray-500 mt-1">
              Real-time insights & analytics
            </p>
          </div>

          {/* NOTIFICATION BUTTON (KEPT) */}
          <button
            onClick={() => setShowNotifPanel((v) => !v)}
            className="relative bg-white border px-4 py-2 rounded-xl shadow-sm hover:shadow transition"
          >
            🔔
            {notifCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                {notifCount}
              </span>
            )}
          </button>
        </div>

        {/* NOTIF PANEL */}
        {showNotifPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-xl border rounded-2xl p-6"
          >
            <p className="font-semibold mb-2">Notifications</p>
            <p className="text-sm text-gray-500">No need for clutter — using toast system instead.</p>
          </motion.div>
        )}

        {/* KPI */}
        <div className="grid md:grid-cols-4 gap-6">
          <Glass label="Total Students" value={kpi.total} />
          <Glass label="High Risk" value={kpi.high} />
          <Glass label="Medium Risk" value={kpi.medium} />
          <Glass label="Low Risk" value={kpi.low} />
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Panel title="Reports Overview"><Bar data={barData} /></Panel>
          <Panel title="Risk Distribution"><Pie data={pieData} /></Panel>
          <Panel title="Incident Trends"><Line data={lineData} /></Panel>
        </div>

        {/* INSIGHTS */}
        <div className="grid lg:grid-cols-2 gap-6">

          <Panel title="Top Risk Students">
            <div className="space-y-3">
              {topRisk.map(s => {
                const r = getRisk(s);

                return (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={s._id}
                    className="flex justify-between p-4 rounded-xl bg-white/60 backdrop-blur border"
                  >
                    <div>
                      <p className="font-semibold">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.totalIncidents} incidents</p>
                    </div>

                    <span className="text-xs px-3 py-1 rounded-full text-white"
                      style={{
                        background:
                          r === "High"
                            ? "#ef4444"
                            : r === "Medium"
                            ? "#f59e0b"
                            : "#22c55e",
                      }}>
                      {r}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Behavior Summary">
            <div className="space-y-4">
              <Metric label="High Risk" value={behaviorSummary.high} color="#ef4444" />
              <Metric label="Medium Risk" value={behaviorSummary.medium} color="#f59e0b" />
              <Metric label="Low Risk" value={behaviorSummary.low} color="#22c55e" />
            </div>
          </Panel>

        </div>

      </main>

      <Toasts />
    </div>
  );
};

/* ================= UI COMPONENTS ================= */

const Nav = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition ${
      active
        ? "bg-green-50 text-green-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const Glass = ({ label, value }) => (
  <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <h2 className="text-3xl font-bold mt-2">{value}</h2>
  </div>
);

const Panel = ({ title, children }) => (
  <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border shadow-sm">
    <h3 className="font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

const Metric = ({ label, value, color }) => (
  <div className="flex justify-between p-4 rounded-xl bg-white/60 border backdrop-blur">
    <span style={{ color }}>{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

export default DashboardPage;