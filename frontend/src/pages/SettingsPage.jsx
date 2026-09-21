import { useEffect, useState } from "react";
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
  Menu,
  X,
  Moon,
  Sun,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import SchoolInformation from "../components/settings/SchoolInformation";
import Notifications from "../components/settings/Notifications";
import Security from "../components/settings/Security";
import HistoryLogs from "../components/settings/HistoryLogs";
import BackupRecovery from "../components/settings/BackupRecovery";

const SETTINGS_TABS = [
  {
    label: "School Information",
    description: "School profile and institution details",
  },
  {
    label: "Notifications",
    description: "Alerts and notification preferences",
  },
  {
    label: "Security",
    description: "Account and security controls",
  },
  {
    label: "History / Logs",
    description: "System activity and audit history",
  },
  {
    label: "Backup & Recovery",
    description: "Data backup and recovery tools",
  },
];

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

  // Keep the theme synchronized with the rest of GuidEd.
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("guided-theme");
      if (savedTheme === "dark") return true;
      if (savedTheme === "light") return false;
    } catch {}
    return false;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}

    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case "School Information":
        return <SchoolInformation darkMode={darkMode} />;
      case "Notifications":
        return <Notifications darkMode={darkMode} />;
      case "Security":
        return <Security darkMode={darkMode} />;
      case "History / Logs":
        return <HistoryLogs darkMode={darkMode} />;
      case "Backup & Recovery":
        return <BackupRecovery darkMode={darkMode} />;
      default:
        return null;
    }
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <div
      className={`settings-page ${
        darkMode ? "settings-page-dark" : "settings-page-light"
      } h-screen w-screen flex overflow-hidden`}
    >
      <SettingsThemeStyles darkMode={darkMode} />

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[250px] xl:w-[270px] flex-col px-5 py-6 border-r transition-colors duration-300 ${
          darkMode
            ? "bg-[#09150F] border-emerald-950/60"
            : "bg-white border-gray-100"
        }`}
      >
        {/* TOP / NAV */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 settings-scrollbar">
          <SidebarBrand darkMode={darkMode} />

          <p
            className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${
              darkMode ? "text-slate-500" : "text-gray-400"
            }`}
          >
            Main Menu
          </p>

          <div className="space-y-1">
            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              darkMode={darkMode}
              onClick={() => navigate("/dashboard")}
            />
            <Nav
              icon={<Users size={18} />}
              label="Students"
              darkMode={darkMode}
              onClick={() => navigate("/students")}
            />
            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              darkMode={darkMode}
              onClick={() => navigate("/guidance")}
            />
            <Nav
              icon={<ChartNoAxesCombined size={18} />}
              label="Reports"
              darkMode={darkMode}
              onClick={() => navigate("/reports")}
            />
            <Nav
              icon={<BriefcaseBusiness size={18} />}
              label="Cases"
              darkMode={darkMode}
              onClick={() => navigate("/cases")}
            />
            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              darkMode={darkMode}
              onClick={() => navigate("/interventions")}
            />
          </div>

          <p
            className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${
              darkMode ? "text-slate-500" : "text-gray-400"
            }`}
          >
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            active
            darkMode={darkMode}
          />
        </div>

        {/* FOOTER — intentionally separate so the theme switch never overlaps */}
        <SidebarFooter
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          adminName={adminName}
          adminPhoto={adminPhoto}
          onLogout={handleLogout}
        />
      </aside>

      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <aside
          className={`absolute left-0 top-0 bottom-0 w-[290px] max-w-[88vw] flex flex-col px-5 py-6 shadow-2xl transform transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } ${
            darkMode
              ? "bg-[#09150F] border-r border-emerald-950/60"
              : "bg-white border-r border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <SidebarBrand darkMode={darkMode} compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                darkMode
                  ? "text-slate-400 hover:text-white hover:bg-[#101F17]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar">
            <p
              className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${
                darkMode ? "text-slate-500" : "text-gray-400"
              }`}
            >
              Main Menu
            </p>

            <div className="space-y-1">
              <Nav
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                darkMode={darkMode}
                onClick={() => navigate("/dashboard")}
              />
              <Nav
                icon={<Users size={18} />}
                label="Students"
                darkMode={darkMode}
                onClick={() => navigate("/students")}
              />
              <Nav
                icon={<ShieldX size={18} />}
                label="Guidance"
                darkMode={darkMode}
                onClick={() => navigate("/guidance")}
              />
              <Nav
                icon={<ChartNoAxesCombined size={18} />}
                label="Reports"
                darkMode={darkMode}
                onClick={() => navigate("/reports")}
              />
              <Nav
                icon={<BriefcaseBusiness size={18} />}
                label="Cases"
                darkMode={darkMode}
                onClick={() => navigate("/cases")}
              />
              <Nav
                icon={<HandHelping size={18} />}
                label="Interventions"
                darkMode={darkMode}
                onClick={() => navigate("/interventions")}
              />
            </div>

            <p
              className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${
                darkMode ? "text-slate-500" : "text-gray-400"
              }`}
            >
              System
            </p>

            <Nav
              icon={<Settings size={18} />}
              label="Settings"
              active
              darkMode={darkMode}
            />
          </div>

          <SidebarFooter
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            adminName={adminName}
            adminPhoto={adminPhoto}
            onLogout={handleLogout}
          />
        </aside>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main
        className={`flex-1 min-w-0 overflow-y-auto lg:ml-[250px] xl:ml-[270px] ${
          darkMode ? "bg-[#07110D] text-slate-100" : "bg-[#F4F7FB] text-gray-900"
        }`}
      >
        {/* HEADER */}
        <header
          className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors duration-300 ${
            darkMode
              ? "bg-[#07110D]/90 border-emerald-950/50"
              : "bg-[#F4F7FB]/90 border-gray-100"
          }`}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    darkMode
                      ? "bg-[#0C1913] border border-emerald-950/60 text-slate-300"
                      : "bg-white border border-gray-200 text-gray-600"
                  }`}
                  aria-label="Open navigation"
                >
                  <Menu size={19} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs font-medium ${
                        darkMode ? "text-slate-500" : "text-gray-400"
                      }`}
                    >
                      Management
                    </span>
                    <ChevronRight
                      size={12}
                      className={darkMode ? "text-slate-600" : "text-gray-300"}
                    />
                    <span className="text-xs font-semibold text-green-500">
                      Settings
                    </span>
                  </div>

                  <h2
                    className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${
                      darkMode ? "text-slate-100" : "text-gray-900"
                    }`}
                  >
                    System Settings
                  </h2>

                  <p
                    className={`hidden sm:block text-sm mt-1 ${
                      darkMode ? "text-slate-500" : "text-gray-400"
                    }`}
                  >
                    Manage system configuration and security preferences
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                    darkMode
                      ? "bg-[#0C1913] border-emerald-950/60 text-slate-400"
                      : "bg-white border-gray-200 text-gray-500"
                  }`}
                >
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-50 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
                  </span>
                  System Settings
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 max-w-[1600px] mx-auto">
          {/* HERO */}
          <section
            className={`relative overflow-hidden rounded-3xl border p-5 sm:p-7 mb-6 ${
              darkMode
                ? "bg-gradient-to-br from-[#0C2418] via-[#0D321F] to-[#091B12] border-emerald-900/40"
                : "bg-gradient-to-br from-white via-[#EFF9F3] to-[#E5F5EB] border-green-100"
            }`}
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-24 w-52 h-52 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div
                  className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-3 ${
                    darkMode
                      ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-400"
                      : "bg-green-50 border-green-100 text-green-700"
                  }`}
                >
                  <Sparkles size={12} />
                  GuidEd • Control Center
                </div>

                <h3
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    darkMode ? "text-slate-100" : "text-gray-900"
                  }`}
                >
                  Everything in one place.
                </h3>

                <p
                  className={`mt-2 text-sm sm:text-[15px] leading-relaxed ${
                    darkMode ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  Configure your school information, notifications, security,
                  system history, and recovery options from one organized
                  workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:min-w-[330px]">
                <MiniFeature
                  label="Configuration"
                  value="Ready"
                  darkMode={darkMode}
                />
                <MiniFeature
                  label="Security"
                  value="Protected"
                  darkMode={darkMode}
                />
              </div>
            </div>
          </section>

          {/* SETTINGS NAVIGATION */}
          <section
            className={`rounded-2xl border p-2 shadow-sm mb-6 ${
              darkMode
                ? "bg-[#0C1913] border-emerald-950/60 shadow-black/20"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex flex-wrap gap-1">
              {SETTINGS_TABS.map((tab) => {
                const isActive = activeTab === tab.label;

                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveTab(tab.label)}
                    className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      isActive
                        ? darkMode
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/70 shadow-sm"
                          : "bg-green-50 text-green-700 border-green-100 shadow-sm"
                        : darkMode
                          ? "bg-transparent text-slate-500 border-transparent hover:bg-[#101F17] hover:text-slate-200"
                          : "bg-transparent text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800"
                    }`}
                    title={tab.description}
                  >
                    {isActive && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          darkMode ? "bg-emerald-400" : "bg-green-600"
                        }`}
                      />
                    )}
                    <span>{tab.label}</span>
                    {isActive && (
                      <Check
                        size={14}
                        className={
                          darkMode ? "text-emerald-400" : "text-green-600"
                        }
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* CONTENT CARD */}
          <section
            className={`rounded-2xl border shadow-sm overflow-hidden ${
              darkMode
                ? "bg-[#0C1913] border-emerald-950/60 shadow-black/20"
                : "bg-white border-gray-100"
            }`}
          >
            <div
              className={`px-5 sm:px-7 py-5 border-b ${
                darkMode
                  ? "border-emerald-950/50 bg-[#0C1913]"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className={`text-[10px] uppercase tracking-widest font-bold ${
                      darkMode ? "text-slate-600" : "text-gray-400"
                    }`}
                  >
                    Current section
                  </p>
                  <h3
                    className={`mt-1 text-lg font-black ${
                      darkMode ? "text-slate-100" : "text-gray-900"
                    }`}
                  >
                    {activeTab}
                  </h3>
                </div>

                <div
                  className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-950/60 text-slate-400"
                      : "bg-gray-50 border-gray-100 text-gray-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      darkMode ? "bg-emerald-400" : "bg-green-500"
                    }`}
                  />
                  Changes are saved securely
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">{renderTab()}</div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

/* =========================================================
   SIDEBAR BRAND
========================================================= */

const SidebarBrand = ({ darkMode, compact = false }) => (
  <div className={`${compact ? "px-1 mb-4" : "px-3 mb-8"}`}>
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
        <img
          src="/school-logo.webp"
          alt="School Logo"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="min-w-0">
        <h1
          className={`text-xl font-extrabold tracking-tight ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Guid<span className="text-green-600">Ed</span>
        </h1>

        <p
          className={`text-[9px] uppercase tracking-widest font-semibold ${
            darkMode ? "text-slate-500" : "text-gray-400"
          }`}
        >
          Student Guidance
        </p>
      </div>
    </div>

    {!compact && (
      <p
        className={`text-[11px] leading-relaxed mt-4 ${
          darkMode ? "text-slate-500" : "text-gray-400"
        }`}
      >
        Our Lady of the Holy Rosary School
        <br />
        General Trias Campus
      </p>
    )}
  </div>
);

/* =========================================================
   SIDEBAR FOOTER
   The footer owns its layout so the theme switch never
   collides with the profile or sign-out button.
========================================================= */

const SidebarFooter = ({
  darkMode,
  setDarkMode,
  adminName,
  adminPhoto,
  onLogout,
}) => (
  <div className="pt-4 space-y-3 flex-shrink-0">
    <div
      className={`p-3 rounded-2xl border transition-colors ${
        darkMode
          ? "bg-[#0C1913] border-emerald-950/60"
          : "bg-gray-50 border-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
            darkMode ? "bg-emerald-950/50" : "bg-green-100"
          }`}
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
            <span
              className={`font-bold ${
                darkMode ? "text-emerald-300" : "text-green-700"
              }`}
            >
              {adminName.charAt(0).toUpperCase()}
            </span>
          )}

          <span
            className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
              darkMode ? "border-[#0C1913]" : "border-white"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[9px] uppercase tracking-wider font-bold ${
              darkMode ? "text-slate-600" : "text-gray-400"
            }`}
          >
            Administrator
          </p>

          <p
            className={`text-sm font-bold truncate ${
              darkMode ? "text-slate-100" : "text-gray-900"
            }`}
          >
            {adminName}
          </p>
        </div>
      </div>
    </div>

    <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

    <button
      type="button"
      onClick={onLogout}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
        darkMode
          ? "text-slate-400 border-emerald-950/60 hover:bg-red-950/30 hover:text-red-300 hover:border-red-950/60"
          : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
      }`}
    >
      <LogOut size={16} />
      Sign out
    </button>
  </div>
);

/* =========================================================
   THEME TOGGLE
   Deliberately uses a fixed 40x20 track and a 14x14 knob.
   The knob is black in dark mode and stays inside the track.
========================================================= */

const ThemeToggle = ({ darkMode, setDarkMode }) => (
  <button
    type="button"
    onClick={() => setDarkMode((prev) => !prev)}
    className={`group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
      darkMode
        ? "bg-[#0C1913] border-emerald-950/60 hover:bg-[#101F17]"
        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
    }`}
    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    aria-pressed={darkMode}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          darkMode
            ? "bg-amber-950/40 text-amber-300"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      </div>

      <span
        className={`text-xs font-semibold ${
          darkMode ? "text-slate-200" : "text-gray-700"
        }`}
      >
        {darkMode ? "Light mode" : "Dark mode"}
      </span>
    </div>

    <span
      className={`relative block w-10 h-5 rounded-full flex-shrink-0 overflow-hidden transition-colors duration-200 ${
        darkMode ? "bg-green-600" : "bg-gray-300"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute left-0.5 top-0.5 block w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
          darkMode
            ? "translate-x-5 bg-black"
            : "translate-x-0 bg-white"
        }`}
      />
    </span>
  </button>
);

/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

const Nav = ({ icon, label, onClick, active, darkMode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-sm transition-all duration-200 ${
      active
        ? darkMode
          ? "bg-emerald-950/40 text-emerald-300 font-semibold"
          : "bg-green-50 text-green-700 font-semibold"
        : darkMode
          ? "text-slate-500 hover:bg-[#101F17] hover:text-slate-100"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <span
      className={`transition-colors ${
        active
          ? darkMode
            ? "text-emerald-400"
            : "text-green-600"
          : darkMode
            ? "text-slate-600 group-hover:text-slate-300"
            : "text-gray-400 group-hover:text-gray-700"
      }`}
    >
      {icon}
    </span>

    <span className="truncate">{label}</span>

    {active && (
      <span
        className={`ml-auto w-1.5 h-1.5 rounded-full ${
          darkMode ? "bg-emerald-400" : "bg-green-600"
        }`}
      />
    )}
  </button>
);

/* =========================================================
   HERO MINI FEATURE
========================================================= */

const MiniFeature = ({ label, value, darkMode }) => (
  <div
    className={`rounded-2xl border px-4 py-3 ${
      darkMode
        ? "bg-[#101F17] border-emerald-950/60"
        : "bg-gray-50 border-gray-100"
    }`}
  >
    <div
      className={`text-[10px] uppercase tracking-widest font-bold ${
        darkMode ? "text-slate-600" : "text-gray-400"
      }`}
    >
      {label}
    </div>
    <div
      className={`mt-1 text-sm font-black ${
        darkMode ? "text-slate-200" : "text-gray-800"
      }`}
    >
      {value}
    </div>
  </div>
);

/* =========================================================
   DARK MODE COMPATIBILITY
   The settings subcomponents were designed with their own
   light surfaces. These scoped overrides make their existing
   Tailwind utility classes respond to the same GuidEd theme
   without changing their functional behavior.
========================================================= */

const SettingsThemeStyles = ({ darkMode }) => {
  if (!darkMode) return null;

  return (
    <style>{`
      /* =====================================================
         GUIDED SETTINGS — DARK GREEN SYSTEM
         This scope intentionally covers every settings tab,
         including child components that still use light-only
         Tailwind utilities internally.
      ===================================================== */

      .settings-page-dark {
        color-scheme: dark;
      }

      /* ---------- SURFACES ---------- */
      .settings-page-dark [class*="bg-white"] {
        background-color: #0C1913 !important;
      }

      .settings-page-dark [class*="bg-gray-50"] {
        background-color: #101F17 !important;
      }

      .settings-page-dark [class*="bg-gray-100"] {
        background-color: #14251B !important;
      }

      .settings-page-dark [class*="bg-gray-200"] {
        background-color: #1A2D22 !important;
      }

      /* Light green surfaces become subtle dark-green surfaces. */
      .settings-page-dark [class*="bg-green-50"] {
        background-color: rgba(6, 78, 59, 0.32) !important;
      }

      .settings-page-dark [class*="bg-green-100"] {
        background-color: rgba(6, 78, 59, 0.42) !important;
      }

      .settings-page-dark [class*="bg-emerald-50"] {
        background-color: rgba(6, 78, 59, 0.32) !important;
      }

      .settings-page-dark [class*="bg-emerald-100"] {
        background-color: rgba(6, 78, 59, 0.42) !important;
      }

      /* ---------- BORDERS ---------- */
      .settings-page-dark [class*="border-gray-100"],
      .settings-page-dark [class*="border-gray-200"],
      .settings-page-dark [class*="border-gray-300"] {
        border-color: rgba(6, 78, 59, 0.55) !important;
      }

      .settings-page-dark [class*="border-green-100"],
      .settings-page-dark [class*="border-green-200"] {
        border-color: rgba(6, 78, 59, 0.65) !important;
      }

      /* ---------- TEXT ---------- */
      .settings-page-dark [class*="text-gray-900"],
      .settings-page-dark [class*="text-gray-800"],
      .settings-page-dark [class*="text-gray-700"] {
        color: #E2E8F0 !important;
      }

      .settings-page-dark [class*="text-gray-600"] {
        color: #CBD5E1 !important;
      }

      .settings-page-dark [class*="text-gray-500"] {
        color: #94A3B8 !important;
      }

      .settings-page-dark [class*="text-gray-400"] {
        color: #64748B !important;
      }

      .settings-page-dark [class*="text-gray-300"] {
        color: #94A3B8 !important;
      }

      /* Keep GuidEd green accents readable in dark mode. */
      .settings-page-dark [class*="text-green-900"],
      .settings-page-dark [class*="text-green-800"],
      .settings-page-dark [class*="text-green-700"],
      .settings-page-dark [class*="text-green-600"] {
        color: #34D399 !important;
      }

      .settings-page-dark [class*="text-emerald-900"],
      .settings-page-dark [class*="text-emerald-800"],
      .settings-page-dark [class*="text-emerald-700"],
      .settings-page-dark [class*="text-emerald-600"] {
        color: #34D399 !important;
      }

      /* ---------- FORM CONTROLS ---------- */
      .settings-page-dark input,
      .settings-page-dark select,
      .settings-page-dark textarea {
        background-color: #0F1E17 !important;
        color: #E2E8F0 !important;
        border-color: rgba(6, 78, 59, 0.65) !important;
        color-scheme: dark;
      }

      .settings-page-dark input::placeholder,
      .settings-page-dark textarea::placeholder {
        color: #64748B !important;
        opacity: 1 !important;
      }

      .settings-page-dark option {
        background: #0C1913 !important;
        color: #E2E8F0 !important;
      }

      .settings-page-dark input:focus,
      .settings-page-dark select:focus,
      .settings-page-dark textarea:focus {
        border-color: rgba(16, 185, 129, 0.75) !important;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.10) !important;
        outline: none !important;
      }

      .settings-page-dark label {
        color: #CBD5E1 !important;
      }

      /* ---------- BUTTONS / INTERACTIVE LIGHT STATES ---------- */
      .settings-page-dark [class*="hover\\:bg-gray-50"]:hover {
        background-color: #14251B !important;
      }

      .settings-page-dark [class*="hover\\:bg-gray-100"]:hover {
        background-color: #182B20 !important;
      }

      .settings-page-dark [class*="hover\\:bg-white"]:hover {
        background-color: #14251B !important;
      }

      .settings-page-dark [class*="hover\\:bg-green-50"]:hover {
        background-color: rgba(6, 78, 59, 0.45) !important;
      }

      .settings-page-dark [class*="hover\\:text-gray-900"]:hover {
        color: #F8FAFC !important;
      }

      /* ---------- COMMON SETTINGS CHILD CARDS ---------- */
      .settings-page-dark .rounded-xl,
      .settings-page-dark .rounded-2xl {
        --tw-ring-color: rgba(16, 185, 129, 0.15);
      }

      /* Avoid accidental pure-white shadows looking detached. */
      .settings-page-dark .shadow-sm,
      .settings-page-dark .shadow-md,
      .settings-page-dark .shadow-lg,
      .settings-page-dark .shadow-xl,
      .settings-page-dark .shadow-2xl {
        box-shadow: 0 14px 38px rgba(0, 0, 0, 0.20) !important;
      }

      /* ---------- STATUS / NOTICE COLORS ---------- */
      .settings-page-dark [class*="bg-amber-50"] {
        background-color: rgba(120, 53, 15, 0.28) !important;
      }

      .settings-page-dark [class*="border-amber-100"],
      .settings-page-dark [class*="border-amber-200"] {
        border-color: rgba(120, 53, 15, 0.55) !important;
      }

      .settings-page-dark [class*="text-amber-800"],
      .settings-page-dark [class*="text-amber-700"],
      .settings-page-dark [class*="text-amber-600"] {
        color: #FCD34D !important;
      }

      .settings-page-dark [class*="bg-blue-50"] {
        background-color: rgba(30, 64, 175, 0.20) !important;
      }

      .settings-page-dark [class*="border-blue-100"],
      .settings-page-dark [class*="border-blue-200"] {
        border-color: rgba(30, 64, 175, 0.40) !important;
      }

      .settings-page-dark [class*="text-blue-700"],
      .settings-page-dark [class*="text-blue-600"] {
        color: #93C5FD !important;
      }

      .settings-page-dark [class*="bg-red-50"] {
        background-color: rgba(127, 29, 29, 0.22) !important;
      }

      .settings-page-dark [class*="border-red-100"],
      .settings-page-dark [class*="border-red-200"] {
        border-color: rgba(127, 29, 29, 0.45) !important;
      }

      .settings-page-dark [class*="text-red-700"],
      .settings-page-dark [class*="text-red-600"] {
        color: #FCA5A5 !important;
      }

      /* ---------- SCROLLBARS ---------- */
      .settings-page-dark .settings-scrollbar::-webkit-scrollbar {
        width: 5px;
      }

      .settings-page-dark .settings-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }

      .settings-page-dark .settings-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(71, 85, 105, 0.35);
        border-radius: 999px;
      }

      /* ---------- DISABLED CONTROLS ---------- */
      .settings-page-dark input:disabled,
      .settings-page-dark select:disabled,
      .settings-page-dark textarea:disabled,
      .settings-page-dark button:disabled {
        opacity: 0.55;
      }
    `}</style>
  );
};
