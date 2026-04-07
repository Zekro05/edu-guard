import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { LayoutDashboard, Users, ShieldX, ChartNoAxesCombined, Settings, UserCircle, Smartphone } from "lucide-react";

// 🔥 SOCKET CONNECTION
const socket = io("http://localhost:5000"); // change to Render URL if deployed

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [reports, setReports] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Timer
  const countdown = useAuthStore((state) => state.countdown || 0);
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  // 🔥 FETCH REPORTS
  const fetchReports = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/reports?status=pending&limit=3"
      );

      setReports(res.data.reports);
      setPendingCount(res.data.reports.length);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  useEffect(() => {
    fetchReports();

    // 🔴 REAL-TIME LISTENERS
    socket.on("new-report", fetchReports);
    socket.on("update-report", fetchReports);

    return () => {
      socket.off("new-report");
      socket.off("update-report");
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex flex-col">

      {/* ===== TOP BAR ===== */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          EduGuard
          
          {/* 🔔 NOTIFICATION BADGE */}
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {pendingCount}
            </span>
          )}
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm hidden sm:block">
            <p className="font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs opacity-80">
              Our Lady of the Holy Rosary - General Trias Cavite
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-white text-green-700 px-4 py-2 rounded-md shadow hover:bg-gray-100 hover:scale-105 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ===== AUTO-LOGOUT TIMER ===== */}
      <div className="fixed bottom-4 right-4 bg-gray-800/70 text-white px-4 py-2 rounded-lg shadow-lg">
        Auto-logout in {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>

      {/* ===== NAV ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-white rounded-2xl border flex flex-wrap justify-around items-center py-3 gap-3 shadow-sm">
          <button className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 shadow-inner flex items-center justify-center">
            <LayoutDashboard className="mr-2"/> Dashboard
          </button>

          <button onClick={() => navigate("/students")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center">
            <Users className="mr-2"/> Students
          </button>

          <button onClick={() => navigate("/guidance")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center">
            <ShieldX className="mr-2"/> Guidance
          </button>

          <button onClick={() => navigate("/reports")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center">
            <ChartNoAxesCombined className="mr-2"/> Reports
          </button>

          <button onClick={() => navigate("/settings")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center">
            <Settings className="mr-2"/>Settings
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6">

        {/* HEADER CARD */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            Dashboard Overview
          </h2>

          {/* 📊 COUNT DISPLAY */}
          <p className="text-sm opacity-90 mt-1">
            {pendingCount} Pending Mobile Reports
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Incidents" value="144" trend="-8% from last month" trendColor="text-green-600"/>
          <StatCard title="High-Risk Students" value="12" trend="+3 from last month" trendColor="text-red-500"/>
          <StatCard title="Resolved Cases" value="100" trend="+15% from last month" trendColor="text-orange-500"/>
        </div>

        {/* LOWER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

          {/* MOBILE PENDING REPORT */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Smartphone className="text-green-700" size={22} /> Mobile Pending Report
            </h3>

            {reports.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending reports</p>
            ) : (
              reports.map((r) => (
                <MobileReportCard
                  key={r._id}
                  name={r.studentName}
                  description={r.offense}
                  level={getLevel(r.offense)}
                  time={formatTime(r.createdAt)}
                />
              ))
            )}
          </div>

          {/* AI INSIGHTS */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">AI Insights</h3>

            <Insight title="Behavioral Pattern Alert" description="Repeated tardiness detected in Grade 10-A" color="border-orange-400 bg-orange-50" badge="Medium"/>
            <Insight title="Risk Escalation Detected" description="Escalation from minor to major offense" color="border-red-500 bg-red-50" badge="High"/>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

/* ===== HELPERS ===== */
const getLevel = (offense) => {
  if (!offense) return "Low";
  const text = offense.toLowerCase();
  if (text.includes("fight") || text.includes("violence")) return "High";
  if (text.includes("late") || text.includes("disrupt")) return "Medium";
  return "Low";
};

const formatTime = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 60000);
  if (diff < 60) return `${diff} mins ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
  return `${Math.floor(diff / 1440)} days ago`;
};

/* ===== COMPONENTS ===== */
const StatCard = ({ title, value, trend, trendColor }) => (
  <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
    <p className="text-sm text-gray-400">{title}</p>
    <h3 className="text-3xl font-bold my-2">{value}</h3>
    <p className={`text-sm ${trendColor}`}>{trend}</p>
  </div>
);

const Insight = ({ title, description, color, badge }) => (
  <div className={`border-l-4 ${color} p-4 rounded mb-4 shadow-sm hover:shadow-md transition`}>
    <div className="flex justify-between items-center mb-1">
      <p className="font-medium text-sm">{title}</p>
      <span className="text-xs px-2 py-1 rounded bg-white font-semibold">{badge}</span>
    </div>
    <p className="text-xs text-gray-600">{description}</p>
  </div>
);

const MobileReportCard = ({ name, description, level, time }) => {
  const levelStyles = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-orange-100 text-orange-700",
    High: "bg-red-100 text-red-700",
  };

  return (
    <div className="border rounded-2xl p-5 mb-5 bg-gray-50 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-green-700 flex items-center justify-center">
            <UserCircle size={28} />
          </div>

          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-gray-500">{description}</p>

            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelStyles[level]}`}>
                {level}
              </span>
              <span className="px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                Minor
              </span>
              <span className="px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                Pending
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className="text-xs text-gray-400">{time}</span>
          <button className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-1 rounded-lg transition">
            View
          </button>
        </div>
      </div>
    </div>
  );
};