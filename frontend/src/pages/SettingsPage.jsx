import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Gavel
} from "lucide-react";

import SchoolInformation from "../components/settings/SchoolInformation";
import Notifications from "../components/settings/Notifications";
import Security from "../components/settings/Security";
import HistoryLogs from "../components/settings/HistoryLogs";
import BackupRecovery from "../components/settings/BackupRecovery";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("School Information");

  const tabs = [
    "School Information",
    "Notifications",
    "Security",
    "History / Logs",
    "Backup & Recovery",
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "School Information":
        return <SchoolInformation />;
      case "Notifications":
        return <Notifications />;
      case "Security":
        return <Security />;
      case "History / Logs":
        return <HistoryLogs />;
      case "Backup & Recovery":
        return <BackupRecovery />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white overflow-hidden">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold text-green-400">EduGuard</h1>
          <p className="text-xs text-gray-400 mb-6">
            Our Lady of the Holy Rosary - General Trias Cavite
          </p>

          <Nav icon={<LayoutDashboard />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <Nav icon={<Users />} label="Students" onClick={() => navigate("/students")} />
          <Nav icon={<ShieldX />} label="Guidance" onClick={() => navigate("/guidance")} />
          <Nav icon={<ChartNoAxesCombined />} label="Reports" onClick={() => navigate("/reports")} />
          <Nav icon={<Gavel />} label="Interventions" onClick={() => navigate("/interventions")} />
          <Nav icon={<Settings />} label="Settings" active />
        </div>

        <button
          onClick={logout}
          className="bg-green-500 py-2 rounded-xl hover:bg-green-600 transition"
        >
          Logout
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">

        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold">System Settings</h2>
          <p className="text-gray-400 text-sm">
            Manage system configuration and security
          </p>
        </div>

        {/* SUB TABS */}
        <div className="flex flex-wrap gap-2 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xl">

          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                activeTab === tab
                  ? "bg-green-500/20 text-green-400 border border-green-400/30"
                  : "text-gray-400 hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}

        </div>

        {/* CONTENT */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          {renderTab()}
        </div>

      </main>
    </div>
  );
};

export default SettingsPage;

/* ================= NAV COMPONENT ================= */
const Nav = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex gap-3 items-center px-4 py-3 rounded-xl transition ${
      active
        ? "bg-green-500/20 text-green-400"
        : "hover:bg-white/10 text-gray-300"
    }`}
  >
    {icon} {label}
  </button>
);