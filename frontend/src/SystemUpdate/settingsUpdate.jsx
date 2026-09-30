import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../hooks/useTheme";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  HandHelping,
  BriefcaseBusiness,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Check,
  ChevronRight,
  Sparkles,
  Palette,
} from "lucide-react";

import SchoolInformation from "../components/settings/SchoolInformation";
import Notifications from "../components/settings/Notifications";
import Security from "../components/settings/Security";
import HistoryLogs from "../components/settings/HistoryLogs";
import BackupRecovery from "../components/settings/BackupRecovery";
import AppearanceSettings from "../components/settings/AppearanceSettings";

/* =========================================================
   SETTINGS TABS
========================================================= */

const SETTINGS_TABS = [
  {
    label: "School Information",
    description: "School profile and institution details",
    type: "local",
  },
  {
    label: "Notifications",
    description: "Alerts and notification preferences",
    type: "local",
  },
  {
    label: "Security",
    description: "Account and security controls",
    type: "local",
  },
  {
    label: "History / Logs",
    description: "System activity and audit history",
    type: "local",
  },
  {
    label: "Backup & Recovery",
    description: "Data backup and recovery tools",
    type: "local",
  },
  {
    label: "Appearance",
    description: "Theme, colors, and visual preferences",
    type: "local",
  },
];

/* =========================================================
   MAIN SETTINGS PAGE
========================================================= */

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  /*
   * GLOBAL GUIDED THEME
   *
   * ThemeProvider is the single source of truth.
   *
   * Available palettes:
   * forest
   * ocean
   * violet
   * amber
   * rose
   * slate
   */
  const theme = useTheme();

  const darkMode = theme?.mode === "dark";

  /*
   * Current palette information.
   *
   * AppearanceSettings changes this through ThemeProvider.
   * This page automatically reacts to those changes.
   */
  const currentPalette = theme?.currentPalette;

  const paletteColors =
    currentPalette?.[darkMode ? "dark" : "light"] ||
    currentPalette?.light ||
    {};

  /* =======================================================
     ADMIN INFORMATION
  ======================================================= */

  const adminName =
    [
      user?.firstName,
      user?.middleName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Admin";

  const adminPhoto =
    user?.profilePhoto ||
    user?.profilePicture ||
    user?.photo ||
    null;

  /* =======================================================
     LOCAL PAGE STATE
  ======================================================= */

  const [activeTab, setActiveTab] = useState(
    "School Information"
  );

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /* =======================================================
     RESPONSIVE MENU
  ======================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  /* =======================================================
     CLOSE MOBILE MENU AFTER TAB CHANGE
  ======================================================= */

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  /* =======================================================
     THEME MODE
  ======================================================= */

  const setDarkMode = (value) => {
    const nextValue =
      typeof value === "function"
        ? value(darkMode)
        : value;

    if (typeof theme?.setMode === "function") {
      theme.setMode(
        nextValue ? "dark" : "light"
      );
      return;
    }

    if (
      typeof theme?.setThemeMode === "function"
    ) {
      theme.setThemeMode(
        nextValue ? "dark" : "light"
      );
      return;
    }
  };

  /* =======================================================
     TAB RENDERER
  ======================================================= */

  const renderTab = () => {
    switch (activeTab) {
      case "School Information":
        return (
          <SchoolInformation
            darkMode={darkMode}
          />
        );

      case "Notifications":
        return (
          <Notifications
            darkMode={darkMode}
          />
        );

      case "Security":
        return (
          <Security
            darkMode={darkMode}
          />
        );

      case "History / Logs":
        return (
          <HistoryLogs
            darkMode={darkMode}
          />
        );

      case "Backup & Recovery":
        return (
          <BackupRecovery
            darkMode={darkMode}
          />
        );

      case "Appearance":
        return <AppearanceSettings />;

      default:
        return null;
    }
  };

  /* =======================================================
     TAB CLICK
  ======================================================= */

  const handleTabClick = (tab) => {
    setActiveTab(tab.label);
  };

  /* =======================================================
     APPEARANCE SHORTCUT
  ======================================================= */

  const openAppearance = () => {
    setActiveTab("Appearance");
    setMobileMenuOpen(false);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <div
      className={`settings-page ${
        darkMode
          ? "settings-page-dark"
          : "settings-page-light"
      } h-screen w-screen flex overflow-hidden`}
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[250px] xl:w-[270px] flex-col px-5 py-6 border-r transition-all duration-300"
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 settings-scrollbar">
          <SidebarBrand
            darkMode={darkMode}
          />

          <p
            className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
            style={{
              color: "var(--text-muted)",
            }}
          >
            Main Menu
          </p>

          <div className="space-y-1">
            <Nav
              icon={
                <LayoutDashboard size={18} />
              }
              label="Dashboard"
              darkMode={darkMode}
              onClick={() =>
                navigate("/dashboard")
              }
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              darkMode={darkMode}
              onClick={() =>
                navigate("/students")
              }
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              darkMode={darkMode}
              onClick={() =>
                navigate("/guidance")
              }
            />

            <Nav
              icon={
                <ChartNoAxesCombined size={18} />
              }
              label="Reports"
              darkMode={darkMode}
              onClick={() =>
                navigate("/reports")
              }
            />

            <Nav
              icon={
                <BriefcaseBusiness size={18} />
              }
              label="Cases"
              darkMode={darkMode}
              onClick={() =>
                navigate("/cases")
              }
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              darkMode={darkMode}
              onClick={() =>
                navigate("/interventions")
              }
            />
          </div>

          <p
            className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest"
            style={{
              color: "var(--text-muted)",
            }}
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
          onAppearance={openAppearance}
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
          onClick={() =>
            setMobileMenuOpen(false)
          }
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <aside
          className={`absolute left-0 top-0 bottom-0 w-[290px] max-w-[88vw] flex flex-col px-5 py-6 shadow-2xl transform transition-transform duration-300 ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
          style={{
            backgroundColor: "var(--sidebar-bg)",
            borderRight:
              "1px solid var(--border-color)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <SidebarBrand
              darkMode={darkMode}
              compact
            />

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center transition"
              style={{
                color: "var(--text-secondary)",
                backgroundColor:
                  "var(--card-muted)",
              }}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar">
            <p
              className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{
                color: "var(--text-muted)",
              }}
            >
              Main Menu
            </p>

            <div className="space-y-1">
              <Nav
                icon={
                  <LayoutDashboard size={18} />
                }
                label="Dashboard"
                darkMode={darkMode}
                onClick={() =>
                  navigate("/dashboard")
                }
              />

              <Nav
                icon={<Users size={18} />}
                label="Students"
                darkMode={darkMode}
                onClick={() =>
                  navigate("/students")
                }
              />

              <Nav
                icon={<ShieldX size={18} />}
                label="Guidance"
                darkMode={darkMode}
                onClick={() =>
                  navigate("/guidance")
                }
              />

              <Nav
                icon={
                  <ChartNoAxesCombined
                    size={18}
                  />
                }
                label="Reports"
                darkMode={darkMode}
                onClick={() =>
                  navigate("/reports")
                }
              />

              <Nav
                icon={
                  <BriefcaseBusiness
                    size={18}
                  />
                }
                label="Cases"
                darkMode={darkMode}
                onClick={() =>
                  navigate("/cases")
                }
              />

              <Nav
                icon={
                  <HandHelping size={18} />
                }
                label="Interventions"
                darkMode={darkMode}
                onClick={() =>
                  navigate("/interventions")
                }
              />
            </div>

            <p
              className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{
                color: "var(--text-muted)",
              }}
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
            onAppearance={openAppearance}
          />
        </aside>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className="flex-1 min-w-0 overflow-y-auto lg:ml-[250px] xl:ml-[270px]"
        style={{
          backgroundColor: "var(--app-bg)",
          color: "var(--text-primary)",
        }}
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <header
          className="sticky top-0 z-30 backdrop-blur-xl border-b transition-all duration-300"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--header-bg) 92%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    setMobileMenuOpen(true)
                  }
                  className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    backgroundColor:
                      "var(--card-bg)",
                    border:
                      "1px solid var(--border-color)",
                    color:
                      "var(--text-secondary)",
                  }}
                  aria-label="Open navigation"
                >
                  <Menu size={19} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      Management
                    </span>

                    <ChevronRight
                      size={12}
                      style={{
                        color:
                          "var(--text-muted)",
                      }}
                    />

                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: "var(--accent)",
                      }}
                    >
                      Settings
                    </span>
                  </div>

                  <h2
                    className="text-xl sm:text-2xl font-black tracking-tight leading-tight"
                    style={{
                      color:
                        "var(--text-primary)",
                    }}
                  >
                    System Settings
                  </h2>

                  <p
                    className="hidden sm:block text-sm mt-1"
                    style={{
                      color:
                        "var(--text-secondary)",
                    }}
                  >
                    Manage system configuration and
                    security preferences
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold"
                  style={{
                    backgroundColor:
                      "var(--card-bg)",
                    borderColor:
                      "var(--border-color)",
                    color:
                      "var(--text-secondary)",
                  }}
                >
                  <span className="relative flex w-2 h-2">
                    <span
                      className="absolute inline-flex w-full h-full rounded-full opacity-50 animate-ping"
                      style={{
                        backgroundColor:
                          "var(--accent)",
                      }}
                    />

                    <span
                      className="relative inline-flex w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          "var(--accent)",
                      }}
                    />
                  </span>

                  System Settings
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 max-w-[1600px] mx-auto">

          {/* =================================================
              HERO
          ================================================= */}

          <section
            className="relative overflow-hidden rounded-3xl border p-5 sm:p-7 mb-6 transition-all duration-300"
            style={{
              background: `linear-gradient(
                135deg,
                var(--card-bg),
                var(--accent-soft),
                var(--app-bg)
              )`,
              borderColor:
                "var(--accent-border)",
            }}
          >
            <div
              className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{
                backgroundColor:
                  "var(--accent)",
                opacity: 0.08,
              }}
            />

            <div
              className="absolute -left-16 -bottom-24 w-52 h-52 rounded-full blur-3xl pointer-events-none"
              style={{
                backgroundColor:
                  "var(--accent)",
                opacity: 0.06,
              }}
            />

            <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{
                    backgroundColor:
                      "var(--accent-soft)",
                    borderColor:
                      "var(--accent-border)",
                    color:
                      "var(--accent-text)",
                  }}
                >
                  <Sparkles size={12} />

                  GuidEd • Control Center
                </div>

                <h3
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{
                    color:
                      "var(--text-primary)",
                  }}
                >
                  Everything in one place.
                </h3>

                <p
                  className="mt-2 text-sm sm:text-[15px] leading-relaxed"
                  style={{
                    color:
                      "var(--text-secondary)",
                  }}
                >
                  Configure your school information,
                  notifications, security, system history,
                  recovery options, and appearance
                  preferences from one organized workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:min-w-[330px]">
                <MiniFeature
                  label="Configuration"
                  value="Ready"
                />

                <MiniFeature
                  label="Security"
                  value="Protected"
                />
              </div>
            </div>
          </section>

          {/* =================================================
              SETTINGS NAVIGATION
          ================================================= */}

          <section
            className="rounded-2xl border p-2 shadow-sm mb-6 transition-all duration-300"
            style={{
              backgroundColor:
                "var(--card-bg)",
              borderColor:
                "var(--border-color)",
              boxShadow:
                "0 8px 24px rgba(var(--shadow-color), 0.05)",
            }}
          >
            <div className="flex flex-wrap gap-1">
              {SETTINGS_TABS.map((tab) => {
                const isActive =
                  activeTab === tab.label;

                const isAppearance =
                  tab.label === "Appearance";

                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() =>
                      handleTabClick(tab)
                    }
                    className="group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border"
                    style={{
                      backgroundColor:
                        isActive
                          ? "var(--accent-soft)"
                          : "transparent",

                      color: isActive
                        ? "var(--accent-text)"
                        : "var(--text-secondary)",

                      borderColor: isActive
                        ? "var(--accent-border)"
                        : "transparent",
                    }}
                    title={tab.description}
                  >
                    {isAppearance ? (
                      <Palette
                        size={15}
                        style={{
                          color: isActive
                            ? "var(--accent)"
                            : "var(--text-muted)",
                        }}
                      />
                    ) : (
                      isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              "var(--accent)",
                          }}
                        />
                      )
                    )}

                    <span>{tab.label}</span>

                    {isActive && (
                      <Check
                        size={14}
                        style={{
                          color:
                            "var(--accent)",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* =================================================
              CONTENT CARD
          ================================================= */}

          <section
            className="rounded-2xl border shadow-sm overflow-hidden transition-all duration-300"
            style={{
              backgroundColor:
                "var(--card-bg)",
              borderColor:
                "var(--border-color)",
              boxShadow:
                "0 8px 30px rgba(var(--shadow-color), 0.06)",
            }}
          >
            <div
              className="px-5 sm:px-7 py-5 border-b"
              style={{
                borderColor:
                  "var(--border-color)",
                backgroundColor:
                  "var(--card-bg)",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-widest font-bold"
                    style={{
                      color:
                        "var(--text-muted)",
                    }}
                  >
                    Current section
                  </p>

                  <h3
                    className="mt-1 text-lg font-black"
                    style={{
                      color:
                        "var(--text-primary)",
                    }}
                  >
                    {activeTab}
                  </h3>
                </div>

                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border"
                  style={{
                    backgroundColor:
                      "var(--card-muted)",
                    borderColor:
                      "var(--border-color)",
                    color:
                      "var(--text-secondary)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        "var(--accent)",
                    }}
                  />

                  Changes are saved securely
                </div>
              </div>
            </div>

            <div
              className="p-5 sm:p-7"
              style={{
                backgroundColor:
                  "var(--card-bg)",
              }}
            >
              {renderTab()}
            </div>
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

const SidebarBrand = ({
  darkMode,
  compact = false,
}) => (
  <div
    className={`${
      compact ? "px-1 mb-4" : "px-3 mb-8"
    }`}
  >
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
          className="text-xl font-extrabold tracking-tight"
          style={{
            color: "var(--text-primary)",
          }}
        >
          Guid
          <span
            style={{
              color: "var(--accent)",
            }}
          >
            Ed
          </span>
        </h1>

        <p
          className="text-[9px] uppercase tracking-widest font-semibold"
          style={{
            color: "var(--text-muted)",
          }}
        >
          Student Guidance
        </p>
      </div>
    </div>

    {!compact && (
      <p
        className="text-[11px] leading-relaxed mt-4"
        style={{
          color: "var(--text-secondary)",
        }}
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
========================================================= */

const SidebarFooter = ({
  darkMode,
  setDarkMode,
  adminName,
  adminPhoto,
  onLogout,
  onAppearance,
}) => (
  <div className="pt-4 space-y-3 flex-shrink-0">

    {/* ADMIN PROFILE */}

    <div
      className="p-3 rounded-2xl border transition-colors"
      style={{
        backgroundColor:
          "var(--card-muted)",
        borderColor:
          "var(--border-color)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor:
              "var(--accent-soft)",
          }}
        >
          {adminPhoto ? (
            <img
              src={adminPhoto}
              alt={adminName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <span
              className="font-bold"
              style={{
                color: "var(--accent)",
              }}
            >
              {adminName
                .charAt(0)
                .toUpperCase()}
            </span>
          )}

          <span
            className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{
              backgroundColor:
                "var(--accent)",
              borderColor:
                "var(--card-muted)",
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[9px] uppercase tracking-wider font-bold"
            style={{
              color: "var(--text-muted)",
            }}
          >
            Administrator
          </p>

          <p
            className="text-sm font-bold truncate"
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            {adminName}
          </p>
        </div>
      </div>
    </div>

    {/* APPEARANCE SHORTCUT */}

    <button
      type="button"
      onClick={onAppearance}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200"
      style={{
        backgroundColor:
          "var(--card-muted)",
        borderColor:
          "var(--border-color)",
      }}
      title="Open Appearance Settings"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor:
              "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          <Palette size={15} />
        </div>

        <div className="text-left min-w-0">
          <span
            className="block text-xs font-semibold"
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            Appearance
          </span>

          <span
            className="block text-[10px]"
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            Theme & colors
          </span>
        </div>
      </div>

      <ChevronRight
        size={15}
        style={{
          color: "var(--text-muted)",
        }}
      />
    </button>

    {/* THEME TOGGLE */}

    <ThemeToggle
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    />

    {/* LOGOUT */}

    <button
      type="button"
      onClick={onLogout}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
      style={{
        color: "var(--text-secondary)",
        borderColor:
          "var(--border-color)",
        backgroundColor:
          "transparent",
      }}
    >
      <LogOut size={16} />
      Sign out
    </button>
  </div>
);

/* =========================================================
   THEME TOGGLE
========================================================= */

const ThemeToggle = ({
  darkMode,
  setDarkMode,
}) => (
  <button
    type="button"
    onClick={() =>
      setDarkMode((prev) => !prev)
    }
    className="group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200"
    style={{
      backgroundColor:
        "var(--card-muted)",
      borderColor:
        "var(--border-color)",
    }}
    aria-label={
      darkMode
        ? "Switch to light mode"
        : "Switch to dark mode"
    }
    aria-pressed={darkMode}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          backgroundColor: darkMode
            ? "var(--accent-soft)"
            : "var(--card-muted)",
          color: darkMode
            ? "var(--accent)"
            : "var(--text-secondary)",
        }}
      >
        {darkMode ? (
          <Sun size={15} />
        ) : (
          <Moon size={15} />
        )}
      </div>

      <span
        className="text-xs font-semibold"
        style={{
          color:
            "var(--text-primary)",
        }}
      >
        {darkMode
          ? "Light mode"
          : "Dark mode"}
      </span>
    </div>

    <span
      className="relative block w-10 h-5 rounded-full flex-shrink-0 overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: darkMode
          ? "var(--accent)"
          : "var(--border-color)",
      }}
      aria-hidden="true"
    >
      <span
        className="absolute left-0.5 top-0.5 block w-4 h-4 rounded-full shadow-sm transition-transform duration-200"
        style={{
          transform: darkMode
            ? "translateX(20px)"
            : "translateX(0)",
          backgroundColor: darkMode
            ? "var(--card-bg)"
            : "#ffffff",
        }}
      />
    </span>
  </button>
);

/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

const Nav = ({
  icon,
  label,
  onClick,
  active,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-sm transition-all duration-200"
    style={{
      color: active
        ? "var(--accent-text)"
        : "var(--text-secondary)",

      backgroundColor: active
        ? "var(--accent-soft)"
        : "transparent",

      fontWeight: active
        ? 600
        : 400,
    }}
  >
    <span
      className="transition-colors"
      style={{
        color: active
          ? "var(--accent)"
          : "var(--text-muted)",
      }}
    >
      {icon}
    </span>

    <span className="truncate">
      {label}
    </span>

    {active && (
      <span
        className="ml-auto w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor:
            "var(--accent)",
        }}
      />
    )}
  </button>
);

/* =========================================================
   HERO MINI FEATURE
========================================================= */

const MiniFeature = ({
  label,
  value,
}) => (
  <div
    className="rounded-2xl border px-4 py-3 transition-colors duration-300"
    style={{
      backgroundColor:
        "var(--card-muted)",
      borderColor:
        "var(--border-color)",
    }}
  >
    <div
      className="text-[10px] uppercase tracking-widest font-bold"
      style={{
        color: "var(--text-muted)",
      }}
    >
      {label}
    </div>

    <div
      className="mt-1 text-sm font-black"
      style={{
        color:
          "var(--text-primary)",
      }}
    >
      {value}
    </div>
  </div>
);

