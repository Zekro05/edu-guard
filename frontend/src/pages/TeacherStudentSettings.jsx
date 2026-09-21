import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileClock,
  FileText,
  HelpCircle,
  Info,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Phone,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { API } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const DEFAULT_NOTIFICATIONS = {
  emailAlerts: true,
  aiPredictionAlerts: false,
  securityWarnings: false,
  adminEmail: "",
  guidanceEmail: "",
  mute: false,
  incidentUpdates: true,
  guidanceMessages: true,
  systemAnnouncements: true,
  highRiskAlerts: true,
  quietHours: false,
  sound: true,
  vibration: true,
};

const DEFAULT_SECURITY = {
  twoFactorEnabled: true,
  sessionTimeoutEnabled: true,
};

const TeacherStudentSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState("");
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [security, setSecurity] = useState(DEFAULT_SECURITY);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingNotification, setSavingNotification] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const role = String(profile?.role || user?.role || "student").toLowerCase();
  const isTeacher = role === "teacher";

  const theme = useMemo(
    () => ({
      page: darkMode
        ? "bg-[#07110B] text-gray-100"
        : "bg-[#F7F9F8] text-gray-900",
      sidebar: darkMode
        ? "bg-[#0B1710] border-[#17251B]"
        : "bg-white border-gray-100",
      card: darkMode
        ? "bg-[#0D1A12] border-[#1A2C20]"
        : "bg-white border-gray-100",
      subtle: darkMode ? "bg-[#101F15]" : "bg-gray-50",
      border: darkMode ? "border-[#1A2C20]" : "border-gray-100",
      heading: darkMode ? "text-gray-100" : "text-gray-900",
      body: darkMode ? "text-gray-300" : "text-gray-500",
      muted: darkMode ? "text-gray-500" : "text-gray-400",
      input: darkMode
        ? "bg-[#101F15] border-[#24392A] text-gray-100 placeholder:text-gray-600"
        : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400",
    }),
    [darkMode]
  );

  const displayName = useMemo(() => {
    const linked = profile?.linkedProfile || {};

    return (
      [
        profile?.firstName ?? linked.firstName ?? user?.firstName,
        profile?.middleName ?? linked.middleName ?? user?.middleName,
        profile?.lastName ?? linked.lastName ?? user?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      profile?.name ||
      user?.name ||
      user?.fullName ||
      (isTeacher ? "Teacher" : "Student")
    );
  }, [profile, user, isTeacher]);

  const profilePhoto =
    profile?.profilePhoto ||
    user?.profilePhoto ||
    user?.profilePicture ||
    user?.photo ||
    "";

  const linked = profile?.linkedProfile || {};

  const lastLoginLabel = useMemo(() => {
    if (!profile?.lastLogin) return "Not available";

    const date = new Date(profile.lastLogin);
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [profile?.lastLogin]);

  const profileFields = isTeacher
    ? [
        ["Full Name", displayName],
        ["Employee ID", profile?.employeeId || user?.employeeId || "Not available"],
        ["Email Address", profile?.email || user?.email || "Not available"],
        ["Department", linked?.department || user?.department || "Not available"],
        ["Gender", linked?.gender || user?.gender || "Not available"],
        ["Account Type", "Teacher"],
      ]
    : [
        ["Full Name", displayName],
        ["Student ID", profile?.studentId || user?.studentId || "Not available"],
        ["Email Address", profile?.email || user?.email || "Not available"],
        ["Grade", linked?.grade || profile?.grade || user?.grade || "Not available"],
        ["Section", linked?.section || profile?.section || user?.section || "Not available"],
        ["Gender", linked?.gender || profile?.gender || user?.gender || "Not available"],
        ["Age", linked?.age || profile?.age || user?.age || "Not available"],
        ["Account Type", "Student"],
      ];

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}

    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    window.dispatchEvent(
      new CustomEvent("guided-theme-change", {
        detail: darkMode ? "dark" : "light",
      })
    );
  }, [darkMode]);

  useEffect(() => {
    const handleTheme = (event) => {
      if (event?.detail === "dark" || event?.detail === "light") {
        setDarkMode(event.detail === "dark");
      }
    };

    window.addEventListener("guided-theme-change", handleTheme);
    return () => window.removeEventListener("guided-theme-change", handleTheme);
  }, []);

  useEffect(() => {
    const ids = ["profile", "notifications", "security", "appearance", "about"];

    const observers = ids
      .map((id) => {
        const element = document.getElementById(id);
        if (!element) return null;

        const observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) setActiveSection(id);
          },
          {
            rootMargin: "-20% 0px -65% 0px",
            threshold: 0,
          }
        );

        observer.observe(element);
        return observer;
      })
      .filter(Boolean);

    return () => observers.forEach((observer) => observer.disconnect());
  }, [loadingProfile]);

  const navigateTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const loadProfile = async () => {
    setLoadingProfile(true);

    try {
      const response = await API.get("/api/settings/profile");

      if (response.data?.success && response.data?.profile) {
        setProfile(response.data.profile);
        setPhone(response.data.profile.phone || "");
      } else {
        throw new Error("Profile response was invalid.");
      }
    } catch (error) {
      console.error("Profile load error:", error);

      // The settings page remains usable even if profile loading is unavailable.
      setProfile(user || null);
      setPhone(user?.phone || "");
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadSettings = async () => {
    setLoadingSettings(true);

    try {
      const [notificationResponse, securityResponse] = await Promise.all([
        API.get("/api/settings/notifications"),
        API.get("/api/settings/security"),
      ]);

      if (notificationResponse.data?.success) {
        setNotifications({
          ...DEFAULT_NOTIFICATIONS,
          ...(notificationResponse.data.settings || {}),
        });
      }

      if (securityResponse.data?.success) {
        setSecurity({
          ...DEFAULT_SECURITY,
          ...(securityResponse.data.settings || {}),
        });
      }
    } catch (error) {
      console.error("Settings load error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Some settings could not be loaded."
      );
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const savePhone = async () => {
    const normalized = phone.trim();

    if (normalized && !/^[0-9+\-\s()]+$/.test(normalized)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    if (normalized.length > 30) {
      toast.error("Phone number is too long.");
      return;
    }

    setSavingPhone(true);

    try {
      const response = await API.put("/api/settings/profile/phone", {
        phone: normalized,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update phone."
        );
      }

      const savedPhone = response.data?.phone ?? normalized;

      setProfile((current) => ({
        ...(current || {}),
        phone: savedPhone,
      }));
      setPhone(savedPhone);
      setPhoneEditing(false);

      toast.success("Phone number updated.");
    } catch (error) {
      console.error("Phone update error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update phone number."
      );
    } finally {
      setSavingPhone(false);
    }
  };

  const updateNotification = async (field, value) => {
    const previous = notifications;

    setNotifications((current) => ({
      ...current,
      [field]: value,
    }));

    setSavingNotification(true);

    try {
      const response = await API.put("/api/settings/notifications", {
        [field]: value,
      });

      if (response.data?.success && response.data?.settings) {
        setNotifications({
          ...DEFAULT_NOTIFICATIONS,
          ...response.data.settings,
        });
      } else {
        throw new Error(
          response.data?.message ||
            "Failed to update notification setting."
        );
      }
    } catch (error) {
      setNotifications(previous);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update notification setting."
      );
    } finally {
      setSavingNotification(false);
    }
  };

  const updateSecurity = async (field, value) => {
    const previous = security;

    setSecurity((current) => ({
      ...current,
      [field]: value,
    }));

    setSavingSecurity(true);

    try {
      const response = await API.put("/api/settings/security", {
        [field]: value,
      });

      if (response.data?.success && response.data?.settings) {
        setSecurity({
          ...DEFAULT_SECURITY,
          ...response.data.settings,
        });
      } else {
        throw new Error(
          response.data?.message || "Failed to update security setting."
        );
      }
    } catch (error) {
      setSecurity(previous);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update security setting."
      );
    } finally {
      setSavingSecurity(false);
    }
  };

  const resetNotificationPreferences = async () => {
    setSavingNotification(true);

    try {
      const response = await API.put(
        "/api/settings/notifications",
        DEFAULT_NOTIFICATIONS
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to reset notification preferences."
        );
      }

      setNotifications({
        ...DEFAULT_NOTIFICATIONS,
        ...(response.data.settings || {}),
      });

      toast.success("Notification preferences reset.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to reset notification preferences."
      );
    } finally {
      setSavingNotification(false);
    }
  };

  const Toggle = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
        checked
          ? "bg-green-600 shadow-[0_0_0_3px_rgba(22,163,74,0.10)]"
          : darkMode
            ? "bg-gray-700"
            : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );

  const SettingRow = ({
    icon,
    title,
    description,
    checked,
    onChange,
    disabled = false,
    badge,
  }) => (
    <div
      className={`group flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 ${
        darkMode
          ? "bg-[#101F15] border-[#1A2C20] hover:border-green-900/60"
          : "bg-gray-50/70 border-gray-100 hover:bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            darkMode
              ? "bg-green-500/10 text-green-300"
              : "bg-green-50 text-green-700"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${theme.heading}`}>{title}</p>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                  darkMode
                    ? "bg-green-500/10 text-green-300"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {badge}
              </span>
            )}
          </div>

          <p className={`text-xs leading-5 mt-0.5 ${theme.body}`}>
            {description}
          </p>
        </div>
      </div>

      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );

  const Section = ({
    id,
    icon,
    title,
    description,
    children,
    accent = "green",
  }) => (
    <section
      id={id}
      className={`scroll-mt-28 rounded-[26px] border p-5 sm:p-6 ${theme.card} shadow-[0_8px_30px_rgba(15,23,42,0.03)]`}
    >
      <div className="flex items-start gap-3.5 mb-5">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            accent === "blue"
              ? darkMode
                ? "bg-blue-500/10 text-blue-300"
                : "bg-blue-50 text-blue-700"
              : accent === "purple"
                ? darkMode
                  ? "bg-purple-500/10 text-purple-300"
                  : "bg-purple-50 text-purple-700"
                : darkMode
                  ? "bg-green-500/10 text-green-300"
                  : "bg-green-50 text-green-700"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className={`text-base font-extrabold ${theme.heading}`}>
            {title}
          </h3>
          <p className={`text-xs leading-5 mt-0.5 ${theme.body}`}>
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );

  const Nav = ({ icon, label, path, active = false }) => (
    <button
      type="button"
      onClick={() => path && navigateTo(path)}
      className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
        active
          ? darkMode
            ? "bg-green-500/10 text-green-400"
            : "bg-green-50 text-green-700"
          : darkMode
            ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span
        className={
          active
            ? darkMode
              ? "text-green-400"
              : "text-green-700"
            : darkMode
              ? "text-gray-500 group-hover:text-gray-300"
              : "text-gray-400 group-hover:text-gray-600"
        }
      >
        {icon}
      </span>

      {label}
    </button>
  );

  const ThemeToggle = () => (
   <button
          type="button"
          onClick={() => setDarkMode((value) => !value)}
          className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border text-sm font-semibold transition ${
            darkMode
              ? "bg-[#101F15] border-[#24392A] text-gray-200 hover:bg-[#15261A]"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-3">
            {darkMode ? (
              <Sun size={17} className="text-amber-300" />
            ) : (
              <Moon size={17} className="text-gray-500" />
            )}
            {darkMode ? "Light mode" : "Dark mode"}
          </span>

          <span
            className={`w-9 h-5 rounded-full p-0.5 transition ${
              darkMode ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                darkMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </button>
  );

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div>
        <div
          className={`flex items-center ${
            mobile ? "justify-between" : ""
          } gap-3 px-3 mb-7`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-green-500/20 blur-md" />
              <img
                src="/school-logo.webp"
                alt="School Logo"
                className="relative w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1
                className={`text-xl font-extrabold tracking-tight ${theme.heading}`}
              >
                Guid<span className="text-green-500">Ed</span>
              </h1>

              <p
                className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}
              >
                {isTeacher ? "Teacher Portal" : "Student Guidance"}
              </p>
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                darkMode
                  ? "bg-[#101F15] text-gray-400"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-3 mb-7">
          <p className={`text-[11px] leading-relaxed ${theme.muted}`}>
            Our Lady of the Holy Rosary
            <br />
            School
            <br />
            General Trias Campus
          </p>
        </div>

        <p
          className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          Main Menu
        </p>

        <div className="space-y-1">
          <Nav
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            path={isTeacher ? "/teacher-dashboard" : "/student-dashboard"}
          />

          {isTeacher ? (
            <>
              <Nav
                icon={<FileText size={18} />}
                label="My Reports"
                path="/teacher-my-reports"
              />
              <Nav
                icon={<UsersRound size={18} />}
                label="My Class"
                path="/teacher-class"
              />
              <Nav
                icon={<MessageSquare size={18} />}
                label="Messages"
                path="/messages"
              />
              <Nav
                icon={<FileText size={18} />}
                label="Report an Incident"
                path="/teacher-reporting"
              />
            </>
          ) : (
            <>
              <Nav
                icon={<FileText size={18} />}
                label="My Reports"
                path="/my-reports"
              />
              <Nav
                icon={<FileClock size={18} />}
                label="My History"
                path="/my-history"
              />
              <Nav
                icon={<MessageSquare size={18} />}
                label="Messages"
                path="/message-admin"
              />
              <Nav
                icon={<FileText size={18} />}
                label="Report an Incident"
                path="/student-reporting"
              />
            </>
          )}
        </div>

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          {isTeacher ? "Teacher Support" : "Student Support"}
        </p>

        <div className="space-y-1">
          <Nav
            icon={<BookOpen size={18} />}
            label="Guidance Resources"
            path="/guidance"
          />
          <Nav
            icon={<LifeBuoy size={18} />}
            label={isTeacher ? "Contact Guidance" : "Get Support"}
            path="/messages"
          />
        </div>

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          System
        </p>

        <Nav
          icon={<SlidersHorizontal size={18} />}
          label="Settings"
          active
        />
      </div>

      <div className="space-y-3">
        <div
          className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ${
                darkMode ? "bg-green-500/10" : "bg-green-100"
              }`}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-500 font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}

              <span
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
                  darkMode ? "border-[#0B1710]" : "border-white"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold truncate ${theme.heading}`}>
                {displayName}
              </p>
              <p className={`text-[10px] truncate mt-0.5 ${theme.muted}`}>
                {isTeacher ? "Teacher account" : "Student account"}
              </p>
            </div>
          </div>
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${
            darkMode
              ? "border-[#24392A] text-gray-400 hover:bg-white/5"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen ${theme.page}`}>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[250px] xl:w-[270px] flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 overflow-y-auto border-r transition-colors duration-300 ${theme.sidebar}`}
      >
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] flex flex-col justify-between px-5 py-5 overflow-y-auto border-r lg:hidden transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${theme.sidebar}`}
      >
        <SidebarContent mobile />
      </aside>

      <main className="lg:pl-[250px] xl:pl-[270px] min-h-screen">
        {/* HEADER */}
        <header
          className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
            darkMode
              ? "bg-[#07110B]/90 border-[#17251B]"
              : "bg-[#F7F9F8]/90 border-gray-100"
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <div
                  className={`hidden sm:flex items-center gap-2 text-sm mb-1 ${theme.muted}`}
                >
                  <span>
                    {isTeacher ? "Teacher Portal" : "Student Portal"}
                  </span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">
                    Settings
                  </span>
                </div>

                <h2
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight truncate ${theme.heading}`}
                >
                  Settings
                </h2>

                <p className={`text-sm mt-1 ${theme.body}`}>
                  Manage your account, notifications, security, and preferences.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection("profile")}
              className={`hidden sm:flex w-10 h-10 rounded-xl border items-center justify-center transition ${
                darkMode
                  ? "bg-[#0D1A12] border-[#24392A] text-gray-300 hover:bg-white/5"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              title="Profile"
            >
              <UserRound size={17} />
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 max-w-[1380px] mx-auto">
          {/* HERO */}
          <div
            className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-6 lg:p-7 mb-6 ${
              darkMode
                ? "bg-gradient-to-br from-[#0E2115] via-[#0C1911] to-[#101A14] border-[#1A3522]"
                : "bg-gradient-to-br from-white via-[#F4FBF5] to-[#ECF8EF] border-green-100"
            }`}
          >
            <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
            <div className="absolute right-20 -bottom-24 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] overflow-hidden bg-green-100 flex items-center justify-center shadow-sm">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-green-700">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}

                  <span className="absolute right-1.5 bottom-1.5 w-3.5 h-3.5 rounded-full bg-green-500 border-[3px] border-white" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        darkMode
                          ? "bg-green-500/10 text-green-300"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isTeacher ? "Teacher" : "Student"}
                    </span>

                    {profile?.isVerified || user?.isVerified ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          darkMode
                            ? "bg-blue-500/10 text-blue-300"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        <Check size={11} />
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <h3
                    className={`text-xl sm:text-2xl font-black mt-2 truncate ${theme.heading}`}
                  >
                    {displayName}
                  </h3>

                  <p className={`text-xs sm:text-sm mt-1 ${theme.body}`}>
                    {isTeacher
                      ? "Keep your teacher account information and preferences up to date."
                      : "Keep your student account information and preferences up to date."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:min-w-[300px]">
                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    darkMode
                      ? "bg-white/[0.03] border-[#25402C]"
                      : "bg-white/80 border-green-100"
                  }`}
                >
                  <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>
                    Account
                  </p>
                  <p className={`text-sm font-extrabold mt-1 ${theme.heading}`}>
                    {profile?.isVerified || user?.isVerified
                      ? "Verified"
                      : "Active"}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    darkMode
                      ? "bg-white/[0.03] border-[#25402C]"
                      : "bg-white/80 border-green-100"
                  }`}
                >
                  <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>
                    Protection
                  </p>
                  <p className={`text-sm font-extrabold mt-1 ${theme.heading}`}>
                    {security.twoFactorEnabled ? "2FA On" : "Standard"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
            {/* SETTINGS NAV */}
            <div className="hidden lg:block">
              <div
                className={`sticky top-[110px] rounded-2xl border p-2 ${theme.card}`}
              >
                {[
                  ["profile", "Profile", <UserRound size={16} />],
                  ["notifications", "Notifications", <Bell size={16} />],
                  ["security", "Security", <LockKeyhole size={16} />],
                  ["appearance", "Appearance", <SlidersHorizontal size={16} />],
                  ["about", "About GuidEd", <Info size={16} />],
                ].map(([id, label, icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-left transition ${
                      activeSection === id
                        ? darkMode
                          ? "bg-green-500/10 text-green-400"
                          : "bg-green-50 text-green-700"
                        : darkMode
                          ? "text-gray-400 hover:bg-white/5"
                          : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* PROFILE */}
              <Section
                id="profile"
                icon={<UserRound size={19} />}
                title="My Profile"
                description="View the information connected to your GuidEd account."
              >
                <div
                  className={`rounded-2xl border p-4 sm:p-5 mb-5 ${
                    darkMode
                      ? "bg-[#101F15] border-[#1A2C20]"
                      : "bg-gray-50/70 border-gray-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-green-100 flex items-center justify-center">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-extrabold text-green-700">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-xl font-black truncate ${theme.heading}`}>
                        {displayName}
                      </p>

                      <p className={`text-sm mt-1 capitalize ${theme.body}`}>
                        {role} account
                      </p>

                      <p className={`text-[11px] mt-2 ${theme.muted}`}>
                        Last login: {lastLoginLabel}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        loadProfile();
                        loadSettings();
                      }}
                      disabled={loadingProfile || loadingSettings}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                        darkMode
                          ? "border-[#24392A] text-gray-300 hover:bg-white/5"
                          : "border-gray-200 text-gray-600 hover:bg-white"
                      } disabled:opacity-50`}
                    >
                      <RefreshCw
                        size={13}
                        className={
                          loadingProfile || loadingSettings
                            ? "animate-spin"
                            : ""
                        }
                      />
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {profileFields.map(([label, value]) => (
                    <div
                      key={label}
                      className={`rounded-2xl border p-4 ${
                        darkMode
                          ? "bg-[#101F15] border-[#1A2C20]"
                          : "bg-gray-50/70 border-gray-100"
                      }`}
                    >
                      <p
                        className={`text-[9px] uppercase tracking-[0.12em] font-bold ${theme.muted}`}
                      >
                        {label}
                      </p>

                      <p
                        className={`text-sm font-bold mt-1 break-words ${theme.heading}`}
                      >
                        {loadingProfile ? "Loading..." : value}
                      </p>
                    </div>
                  ))}

                  {/* PHONE */}
                  <div
                    className={`sm:col-span-2 rounded-2xl border p-4 ${
                      darkMode
                        ? "bg-[#101F15] border-green-900/40"
                        : "bg-green-50/40 border-green-100"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-green-600" />
                          <p
                            className={`text-[9px] uppercase tracking-[0.12em] font-bold ${theme.muted}`}
                          >
                            Phone Number
                          </p>
                        </div>

                        {phoneEditing ? (
                          <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="Enter phone number"
                            maxLength={30}
                            autoFocus
                            className={`w-full mt-2 px-3 py-2.5 rounded-xl border outline-none text-sm focus:ring-2 focus:ring-green-500/20 ${theme.input}`}
                          />
                        ) : (
                          <p className={`text-sm font-bold mt-1 ${theme.heading}`}>
                            {phone || "No phone number provided"}
                          </p>
                        )}
                      </div>

                      {phoneEditing ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPhone(profile?.phone || "");
                              setPhoneEditing(false);
                            }}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-bold ${
                              darkMode
                                ? "border-[#24392A] text-gray-300"
                                : "border-gray-200 text-gray-600"
                            }`}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={savePhone}
                            disabled={savingPhone}
                            className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {savingPhone ? "Saving..." : "Save phone"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPhoneEditing(true)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                        >
                          <Phone size={13} />
                          Edit phone
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 flex items-start gap-2 text-[10px] leading-4 ${theme.muted}`}
                >
                  <Info size={13} className="shrink-0 mt-0.5" />
                  <span>
                    Your identity and school information are managed by GuidEd.
                    These fields are read-only here. Only your phone number can
                    be changed from this page.
                  </span>
                </div>
              </Section>

              {/* NOTIFICATIONS */}
              <Section
                id="notifications"
                icon={<Bell size={19} />}
                title="Notifications"
                description="Choose which GuidEd updates should reach you."
              >
                <div className="space-y-3">
                  <SettingRow
                    icon={<MailIcon />}
                    title="Email alerts"
                    description="Receive important GuidEd updates by email."
                    checked={notifications.emailAlerts}
                    onChange={(value) =>
                      updateNotification("emailAlerts", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<FileText size={17} />}
                    title="Incident updates"
                    description="Get notified when your reports or incident records change."
                    checked={notifications.incidentUpdates}
                    onChange={(value) =>
                      updateNotification("incidentUpdates", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<MessageSquare size={17} />}
                    title="Guidance messages"
                    description="Receive notifications for messages from guidance staff."
                    checked={notifications.guidanceMessages}
                    onChange={(value) =>
                      updateNotification("guidanceMessages", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<Bell size={17} />}
                    title="System announcements"
                    description="Receive school-wide GuidEd announcements."
                    checked={notifications.systemAnnouncements}
                    onChange={(value) =>
                      updateNotification("systemAnnouncements", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<ShieldCheck size={17} />}
                    title="High-risk alerts"
                    description="Receive important alerts related to high-risk incident activity."
                    checked={notifications.highRiskAlerts}
                    onChange={(value) =>
                      updateNotification("highRiskAlerts", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<ShieldCheck size={17} />}
                    title="Security warnings"
                    description="Receive important security-related account notices."
                    checked={notifications.securityWarnings}
                    onChange={(value) =>
                      updateNotification("securityWarnings", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<Sparkles size={17} />}
                    title="AI prediction alerts"
                    description="Receive supported AI-related alerts generated by GuidEd."
                    checked={notifications.aiPredictionAlerts}
                    onChange={(value) =>
                      updateNotification("aiPredictionAlerts", value)
                    }
                    disabled={savingNotification}
                    badge="AI"
                  />

                  <SettingRow
                    icon={<VolumeIcon />}
                    title="Notification sound"
                    description="Play notification sounds when supported by the device."
                    checked={notifications.sound}
                    onChange={(value) =>
                      updateNotification("sound", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<Phone size={17} />}
                    title="Vibration"
                    description="Allow supported mobile devices to vibrate for notifications."
                    checked={notifications.vibration}
                    onChange={(value) =>
                      updateNotification("vibration", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<Moon size={17} />}
                    title="Mute notifications"
                    description="Temporarily silence notification delivery."
                    checked={notifications.mute}
                    onChange={(value) =>
                      updateNotification("mute", value)
                    }
                    disabled={savingNotification}
                  />

                  <SettingRow
                    icon={<Clock3 size={17} />}
                    title="Quiet hours"
                    description="Enable quiet-hour behavior supported by the GuidEd notification system."
                    checked={notifications.quietHours}
                    onChange={(value) =>
                      updateNotification("quietHours", value)
                    }
                    disabled={savingNotification}
                  />
                </div>

                {(notifications.adminEmail || notifications.guidanceEmail) && (
                  <div
                    className={`mt-4 grid sm:grid-cols-2 gap-3`}
                  >
                    {[
                      ["Admin email", notifications.adminEmail],
                      ["Guidance email", notifications.guidanceEmail],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className={`rounded-2xl border p-4 ${
                          darkMode
                            ? "bg-[#101F15] border-[#1A2C20]"
                            : "bg-gray-50/70 border-gray-100"
                        }`}
                      >
                        <p
                          className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}
                        >
                          {label}
                        </p>
                        <p
                          className={`text-xs font-semibold mt-1 break-all ${theme.heading}`}
                        >
                          {value || "Not configured"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 ${
                    darkMode
                      ? "bg-[#101F15] border-[#1A2C20]"
                      : "bg-green-50/50 border-green-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${theme.heading}`}>
                        Notification center
                      </p>
                      <p className={`text-xs mt-0.5 ${theme.body}`}>
                        Your preferences are synchronized with your GuidEd account.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetNotificationPreferences}
                    disabled={savingNotification}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold disabled:opacity-50 ${
                      darkMode
                        ? "border-[#24392A] text-gray-300 hover:bg-white/5"
                        : "border-gray-200 text-gray-600 hover:bg-white"
                    }`}
                  >
                    Reset preferences
                  </button>
                </div>
              </Section>

              {/* SECURITY */}
              <Section
                id="security"
                icon={<LockKeyhole size={19} />}
                title="Security"
                description="Control account protection and automatic session security."
                accent="blue"
              >
                <div className="space-y-3">
                  <SettingRow
                    icon={<ShieldCheck size={17} />}
                    title="Two-factor authentication"
                    description="Require an additional verification step during supported sign-in flows."
                    checked={security.twoFactorEnabled}
                    onChange={(value) =>
                      updateSecurity("twoFactorEnabled", value)
                    }
                    disabled={savingSecurity}
                  />

                  <SettingRow
                    icon={<Clock3 size={17} />}
                    title="Session timeout protection"
                    description="Automatically protect the account after a period of inactivity."
                    checked={security.sessionTimeoutEnabled}
                    onChange={(value) =>
                      updateSecurity("sessionTimeoutEnabled", value)
                    }
                    disabled={savingSecurity}
                  />
                </div>

                <div
                  className={`mt-5 rounded-2xl border p-4 ${
                    darkMode
                      ? "bg-blue-500/5 border-blue-900/40"
                      : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={18}
                      className="text-blue-500 shrink-0 mt-0.5"
                    />

                    <div>
                      <p
                        className={`text-sm font-bold ${
                          darkMode ? "text-blue-300" : "text-blue-800"
                        }`}
                      >
                        Account protection
                      </p>

                      <p
                        className={`text-[11px] leading-5 mt-1 ${
                          darkMode
                            ? "text-blue-300/70"
                            : "text-blue-700"
                        }`}
                      >
                        Keep your credentials private and sign out when using
                        shared or public devices.
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* APPEARANCE */}
              <Section
                id="appearance"
                icon={darkMode ? <Sun size={19} /> : <Moon size={19} />}
                title="Appearance"
                description="Personalize how GuidEd looks on this device."
                accent="purple"
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDarkMode(false)}
                    className={`text-left rounded-2xl border p-4 transition ${
                      !darkMode
                        ? "border-green-300 bg-green-50/70"
                        : `${theme.subtle} ${theme.border}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600">
                        <Sun size={18} />
                      </div>
                      {!darkMode && (
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-bold mt-3 ${theme.heading}`}>
                      Light mode
                    </p>
                    <p className={`text-xs mt-1 ${theme.body}`}>
                      Clean and bright interface.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDarkMode(true)}
                    className={`text-left rounded-2xl border p-4 transition ${
                      darkMode
                        ? "border-green-700/60 bg-green-500/5"
                        : `${theme.subtle} ${theme.border}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          darkMode
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-white border border-gray-100 text-gray-600"
                        }`}
                      >
                        <Moon size={18} />
                      </div>

                      {darkMode && (
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center">
                          <Check size={14} />
                        </span>
                      )}
                    </div>

                    <p className={`text-sm font-bold mt-3 ${theme.heading}`}>
                      Dark mode
                    </p>
                    <p className={`text-xs mt-1 ${theme.body}`}>
                      Softer interface for low-light use.
                    </p>
                  </button>
                </div>
              </Section>

              {/* ABOUT */}
              <Section
                id="about"
                icon={<Info size={19} />}
                title="About GuidEd"
                description="Helpful information and quick access to school support."
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <div
                    className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}
                  >
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}
                    >
                      Platform
                    </p>
                    <p
                      className={`text-sm font-bold mt-1 ${theme.heading}`}
                    >
                      GuidEd Management System
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}
                  >
                    <p
                      className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}
                    >
                      School
                    </p>
                    <p
                      className={`text-sm font-bold mt-1 ${theme.heading}`}
                    >
                      Our Lady of the Holy Rosary
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo("/guidance")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      darkMode
                        ? "bg-[#101F15] border-[#1A2C20] hover:bg-[#13251A]"
                        : "bg-gray-50/70 border-gray-100 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                        <BookOpen size={17} />
                      </div>

                      <div>
                        <p className={`text-sm font-bold ${theme.heading}`}>
                          Guidance Resources
                        </p>
                        <p className={`text-[11px] mt-0.5 ${theme.body}`}>
                          Explore support resources.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigateTo(isTeacher ? "/messages" : "/message-admin")
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      darkMode
                        ? "bg-[#101F15] border-[#1A2C20] hover:bg-[#13251A]"
                        : "bg-gray-50/70 border-gray-100 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <LifeBuoy size={17} />
                      </div>

                      <div>
                        <p className={`text-sm font-bold ${theme.heading}`}>
                          {isTeacher ? "Contact Guidance" : "Message Guidance"}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${theme.body}`}>
                          Reach the guidance team.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div
                  className={`mt-5 pt-4 border-t text-[10px] ${theme.muted} ${theme.border}`}
                >
                  GuidEd provides tools for student guidance, incident
                  reporting, communication, intervention tracking, and school
                  support.
                </div>
              </Section>

              {/* MOBILE SECTION SHORTCUTS */}
              <div className="lg:hidden">
                <div className={`rounded-2xl border p-2 ${theme.card}`}>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      ["profile", "Profile"],
                      ["notifications", "Notifications"],
                      ["security", "Security"],
                      ["appearance", "Appearance"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => scrollToSection(id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold ${
                          activeSection === id
                            ? darkMode
                              ? "bg-green-500/10 text-green-400"
                              : "bg-green-50 text-green-700"
                            : theme.body
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-start gap-2 pb-4 text-[10px] leading-4 ${theme.muted}`}
              >
                <HelpCircle size={13} className="shrink-0 mt-0.5" />
                <span>
                  Need help with your account or guidance concerns? Use
                  Guidance Resources or contact the guidance team.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const MailIcon = () => (
  <span className="text-[15px] font-black leading-none">@</span>
);

const VolumeIcon = () => (
  <span className="text-[15px] font-black leading-none">♪</span>
);

export default TeacherStudentSettings;
