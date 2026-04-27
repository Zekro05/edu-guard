import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  LayoutDashboard, Users, ShieldX, ChartNoAxesCombined,
  Settings, Bell, Search
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
  PointElement
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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const socketRef = useRef(null);
  const soundRef = useRef(null);

  const [dark, setDark] = useState(true);
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [feed, setFeed] = useState([]);
  const [notif, setNotif] = useState([]);
  const [selected, setSelected] = useState(null);

  /* ================= INIT AUDIO ================= */
  useEffect(() => {
    soundRef.current = new Audio("/notification.mp3");
  }, []);

  /* ================= FETCH REPORTS ================= */
  const fetchReports = async () => {
    try {
      const res = await axios.get(
        "https://edu-guard-backend.onrender.com/api/reports?status=pending"
      );
      setReports(res.data.reports || []);
      setFiltered(res.data.reports || []);
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= SOCKET ================= */
  useEffect(() => {
    const socket = io("https://edu-guard-backend.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register", user?._id);
      console.log("🟢 DASHBOARD CONNECTED:", socket.id);
    });

    socket.on("activity_feed", (data) => {
    console.log("📡 RECEIVED FEED:", data); // 🔥 ADD THIS

  const newItem = {
    msg: data.message,
    time: new Date(),
  };

  setFeed((prev) => [newItem, ...prev].slice(0, 20));
  setNotif((prev) => [newItem, ...prev].slice(0, 20));

  soundRef.current?.play().catch(() => {});
});
    fetchReports();

    return () => socket.disconnect();
  }, [user]);

  /* ================= SEARCH ================= */
  useEffect(() => {
    setFiltered(
      reports.filter(
        (r) =>
          r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
          r.offense?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, reports]);

  /* ================= MEMOIZED CHARTS ================= */
  const barData = useMemo(() => ({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      { label: "Incidents", data: [5, 8, 3, 6, 4], backgroundColor: "#22c55e" }
    ]
  }), []);

  const pieData = useMemo(() => ({
    labels: ["Low", "Medium", "High"],
    datasets: [
      { data: [60, 25, 15], backgroundColor: ["#22c55e", "#facc15", "#ef4444"] }
    ]
  }), []);

  const lineData = useMemo(() => ({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      { label: "Trend", data: [3, 6, 4, 8, 5], borderColor: "#22c55e" }
    ]
  }), []);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="h-screen w-screen flex bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-72 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-400">EduGuard</h1>
            <p className="text-xs text-gray-400 mb-6">
              Our Lady of The Holy Rosary
            </p>

            <Nav icon={<LayoutDashboard />} label="Dashboard" />
            <Nav icon={<Users />} label="Students" onClick={() => navigate("/students")} />
            <Nav icon={<ShieldX />} label="Guidance" onClick={() => navigate("/guidance")} />
            <Nav icon={<ChartNoAxesCombined />} label="Reports" onClick={() => navigate("/reports")} />
            <Nav icon={<Settings />} label="Settings" onClick={() => navigate("/settings")} />
          </div>

          <button onClick={logout} className="bg-green-500 py-2 rounded-xl">
            Logout
          </button>
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">

          {/* TOP */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">EduGuard Dashboard</h2>
              <p className="text-gray-400 text-sm">Secure Monitoring System</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/10 px-3 py-2 rounded-xl">
                <Search size={16} />
                <input
                  className="bg-transparent ml-2 outline-none"
                  placeholder="Search reports..."
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button onClick={() => setDark(!dark)} className="px-3 py-2 bg-white/10 rounded-xl">
                {dark ? "🌙" : "☀️"}
              </button>

              <div className="relative">
                <Bell className="cursor-pointer" />
                {notif.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 px-2 rounded-full text-xs">
                    {notif.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 p-4 rounded-xl"><Bar data={barData} /></div>
            <div className="bg-white/5 p-4 rounded-xl"><Pie data={pieData} /></div>
            <div className="bg-white/5 p-4 rounded-xl"><Line data={lineData} /></div>
          </div>

          {/* LIVE FEED */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 p-4 rounded-xl">
              <h3 className="mb-3 font-semibold">Live Activity Feed</h3>

              {feed.length === 0 ? (
                <p className="text-gray-400 text-sm">Waiting for activity...</p>
              ) : (
                feed.map((f, i) => (
                  <div key={i} className="text-sm border-b border-white/10 py-2 flex gap-2">
                    <span>🔴</span>
                    {f.msg}
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-2 bg-white/5 p-4 rounded-xl">
              <h3 className="mb-3 font-semibold">Pending Reports</h3>

              {filtered.map((r) => (
                <div
                  key={r._id}
                  onClick={() => setSelected(r)}
                  className="p-3 mb-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10"
                >
                  {r.studentName} — {r.offense}
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

const Nav = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex gap-3 items-center px-4 py-3 rounded-xl hover:bg-white/10">
    {icon} {label}
  </button>
);