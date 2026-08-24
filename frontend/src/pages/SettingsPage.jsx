import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Gavel,
  HandHelping,
  BriefcaseBusiness,
} from "lucide-react";

import SchoolInformation from "../components/settings/SchoolInformation";
import Notifications from "../components/settings/Notifications";
import Security from "../components/settings/Security";
import HistoryLogs from "../components/settings/HistoryLogs";
import BackupRecovery from "../components/settings/BackupRecovery";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Admin";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;
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
      <aside className="w-72 bg-white/70 backdrop-blur-2xl border-r border-white/30 p-6 flex flex-col justify-between">
        <div>
          {/* LOGO */}
          <h1 className="text-2xl font-bold text-green-600">GuidEd</h1>

          <p className="text-xs text-gray-500 mb-6">
            Our Lady of the Holy Rosary School - General Trias Campus
          </p>

          {/* NAVIGATION */}
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

          <Nav icon={<Settings size={18} />} label="Settings" active />
        </div>

        {/* ================= SIDEBAR BOTTOM ================= */}
        <div className="space-y-3">
          {/* ADMIN PROFILE */}
          <div
            className="
          flex
          items-center
          gap-3
          p-3
          rounded-2xl
          bg-gray-50/80
          border border-gray-200/70
          hover:bg-white
          hover:shadow-sm
          transition
        "
          >
            {/* PROFILE PHOTO */}
            <div
              className="
            relative
            w-11
            h-11
            rounded-xl
            overflow-hidden
            bg-green-100
            border border-green-200
            flex
            items-center
            justify-center
            flex-shrink-0
          "
            >
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
                <span className="text-green-700 font-bold text-lg">
                  {adminName.charAt(0).toUpperCase()}
                </span>
              )}

              {/* ONLINE DOT */}
              <span
                className="
              absolute
              bottom-0.5
              right-0.5
              w-2.5
              h-2.5
              rounded-full
              bg-green-500
              border-2
              border-white
            "
              />
            </div>

            {/* ADMIN INFO */}
            <div className="min-w-0 flex-1">
              <p
                className="
              text-[10px]
              uppercase
              tracking-wider
              text-gray-400
              font-medium
            "
              >
                Administrator
              </p>

              <p
                className="
              text-sm
              font-bold
              text-gray-900
              truncate
            "
              >
                {adminName}
              </p>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            onClick={logout}
            className="
            w-full
            bg-green-600
            hover:bg-green-700
            text-white
            py-3
            rounded-2xl
            font-medium
            shadow-sm
            hover:shadow-md
            transition
          "
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-4xl font-black tracking-tight">System Settings</h2>
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
    className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full ${
      active
        ? "bg-green-50 text-green-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    {label}
  </button>
);
