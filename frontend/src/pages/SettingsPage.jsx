import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  HandHelping,
  BriefcaseBusiness,
  SlidersHorizontal,
  LogOut,
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
    <div className="h-screen w-screen flex bg-[#F4F7FB] text-gray-900 overflow-hidden">
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

          {/* MAIN MENU */}
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

          {/* SYSTEM */}
          <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            System
          </p>

          <Nav icon={<Settings size={18} />} label="Settings" active />
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="space-y-3">
          {/* ADMIN PROFILE */}
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              {/* PROFILE PHOTO */}
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

                {/* ONLINE DOT */}
                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>

              {/* ADMIN INFO */}
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

          {/* SIGN OUT */}
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
        border
        border-gray-200
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
          MAIN CONTENT
      ===================================================== */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* ===================================================
            HEADER
        =================================================== */}
        <header
          className="
            sticky
            top-0
            z-30
            bg-[#F4F7FB]/90
            backdrop-blur-xl
            border-b
            border-gray-100
            px-8
            py-5
          "
        >
          <div className="w-full">
            {/* =================================================
                BREADCRUMB
            ================================================= */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-400">
                Overview
              </span>

              <span className="text-xs text-gray-300">/</span>

              <span className="text-xs font-semibold text-green-600">
                Settings
              </span>
            </div>

            {/* =================================================
                PAGE HEADER ROW
            ================================================= */}
            <div className="flex items-center justify-between gap-6">
              {/* PAGE TITLE */}
              <div className="flex items-center gap-4 min-w-0">
                {/* ICON */}
                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-green-50
                    text-green-600
                    flex
                    items-center
                    justify-center
                    border
                    border-green-100
                    flex-shrink-0
                  "
                >
                  <SlidersHorizontal size={21} strokeWidth={2.2} />
                </div>

                {/* TITLE */}
                <div className="min-w-0">
                  <h2
                    className="
                      text-2xl
                      font-black
                      tracking-tight
                      text-gray-900
                      leading-tight
                    "
                  >
                    System Settings
                  </h2>

                  <p className="text-gray-400 text-sm mt-1">
                    Manage system configuration and security preferences
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-xl
                    bg-white
                    border
                    border-gray-200
                    text-xs
                    font-medium
                    text-gray-500
                  "
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  System Settings
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}
        <div className="px-8 py-7">
          {/* =================================================
              SETTINGS NAVIGATION
          ================================================= */}
          <div
            className="
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-2
              shadow-sm
              mb-6
            "
          >
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-4
                      py-2.5
                      rounded-xl
                      text-sm
                      font-medium
                      transition-all
                      duration-200
                      border
                      ${
                        isActive
                          ? `
                            bg-green-50
                            text-green-700
                            border-green-100
                            shadow-sm
                          `
                          : `
                            bg-transparent
                            text-gray-500
                            border-transparent
                            hover:bg-gray-50
                            hover:text-gray-800
                          `
                      }
                    `}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================
              CONTENT CARD
          ================================================= */}
          <section
            className="
              bg-white
              border
              border-gray-100
              rounded-2xl
              shadow-sm
              overflow-hidden
            "
          >
            <div className="p-7">{renderTab()}</div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

/* =========================================================
   SIDEBAR NAVIGATION
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
