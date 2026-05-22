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
  const { logout } = useAuthStore();
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
    <div className="h-screen w-screen flex bg-gray-50 text-gray-900">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold text-green-600">
            GuidEd
          </h1>

          <p className="text-xs text-gray-500 mb-6">
            School Management System
          </p>

          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <Nav icon={<Users size={18} />} label="Students" onClick={() => navigate("/students")} />
          <Nav icon={<ShieldX size={18} />} label="Guidance" onClick={() => navigate("/guidance")} />
          <Nav icon={<ChartNoAxesCombined size={18} />} label="Reports" onClick={() => navigate("/reports")} />
          <Nav icon={<Gavel size={18} />} label="Cases" onClick={() => navigate("/cases")} />
          <Nav icon={<Gavel size={18} />} label="Interventions" onClick={() => navigate("/interventions")} />
          <Nav icon={<Settings size={18} />} label="Settings" active />
        </div>

        <button
          onClick={logout}
          className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
        >
          Logout
        </button>

      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">System Settings</h2>
          <p className="text-sm text-gray-500">
            Manage system configuration and security preferences
          </p>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm mb-6">

          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                activeTab === tab
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}

        </div>

        {/* CONTENT */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {renderTab()}
        </div>

      </main>
    </div>
  );
};

export default SettingsPage;

/* ================= NAV ================= */
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