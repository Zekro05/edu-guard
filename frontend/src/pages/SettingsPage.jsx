import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LayoutDashboard } from 'lucide-react';
import { Users } from 'lucide-react';
import { ShieldX } from 'lucide-react';
import { ChartNoAxesCombined } from 'lucide-react';
import { Settings } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex flex-col">

      {/* ===== TOP BAR ===== */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">EduGuard</h1>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm hidden sm:block">
            <p className="font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs opacity-80">San Sebastian College Recoletos de Cavite</p>
          </div>

          <button
            onClick={logout}
            className="bg-white text-green-700 px-4 py-2 rounded-md shadow hover:bg-gray-100 hover:scale-105 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ===== NAV ===== */}
      <div className="mt-6 px-4 sm:px-8">
  <div className="bg-white rounded-2xl border flex flex-wrap justify-around items-center py-3 gap-3 shadow-sm">

    <button 
    onClick={() => navigate("/dashboard")}
    className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
      <LayoutDashboard className="mr-2" />Dashboard
    </button>

    <button
      onClick={() => navigate("/students")}
      className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
    >
      <Users className="mr-2"/>Students
    </button>

    <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
      <ShieldX className="mr-2" />Guidance
    </button>

    <button
    onClick={() => navigate("/reports")}
    className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
      <ChartNoAxesCombined className="mr-2"/> Reports
    </button>

    <button className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 shadow-inner flex items-center justify-center">
     <Settings className="mr-2"/> Settings
    </button>

  </div>
</div>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6">

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold">System Settings</h2>
          <p className="text-sm opacity-90 mt-1">
            Manage school information, security, logs, and backups
          </p>
        </div>

        {/* SUB NAV */}
        <div className="bg-white rounded-2xl border p-2 flex flex-wrap gap-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                ${
                  activeTab === tab
                    ? "bg-green-100 text-green-700 shadow-inner"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB BODY */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm flex-1">
          {renderTab()}
        </div>

      </main>
    </div>
  );
};

export default SettingsPage;