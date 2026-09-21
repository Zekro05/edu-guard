import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Plus,
  BookOpen,
  LifeBuoy,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  Filter,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  GraduationCap,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock4,
  Image as ImageIcon,
  ExternalLink,
  FileWarning,
  RefreshCw,
} from "lucide-react";

import { API } from "../lib/api";
import { useAuthStore } from "../store/authStore";

/* =========================================================
   HELPERS
========================================================= */

const getDisplayName = (user) =>
  [user?.firstName, user?.middleName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() ||
  user?.name ||
  user?.fullName ||
  "Teacher";

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.reports)) return value.reports;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const getReporterId = (report) => {
  const candidates = [
    report?.reporterId?._id,
    report?.reporterId?.id,
    report?.reporterId,
    report?.reportedBy?._id,
    report?.reportedBy?.id,
    report?.reportedBy,
    report?.createdBy?._id,
    report?.createdBy?.id,
    report?.createdBy,
    report?.userId?._id,
    report?.userId?.id,
    report?.userId,
  ];

  return candidates.find(
    (value) => value !== undefined && value !== null && String(value).trim() !== "",
  );
};

const getReporterRole = (report) =>
  String(
    report?.reporterType ||
      report?.reporterRole ||
      report?.reportedByRole ||
      report?.createdBy?.role ||
      report?.reporterId?.role ||
      "",
  ).toLowerCase();

const isTeacherReport = (report, userId) => {
  if (!userId) return false;

  const reporterId = getReporterId(report);
  if (String(reporterId) !== String(userId)) return false;

  const role = getReporterRole(report);

  // If the backend does not populate the reporter role, matching the
  // authenticated teacher's ID is still the authoritative identity check.
  return !role || role === "teacher";
};

const getStudent = (report) => {
  const raw =
    report?.studentId && typeof report.studentId === "object"
      ? report.studentId
      : report?.student && typeof report.student === "object"
        ? report.student
        : report?.reportedStudent && typeof report.reportedStudent === "object"
          ? report.reportedStudent
          : null;

  const name =
    raw &&
    [raw.firstName, raw.middleName, raw.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

  return {
    id: raw?._id || raw?.id || report?.studentId || null,
    name:
      name ||
      report?.studentName ||
      report?.reportedStudentName ||
      report?.student?.name ||
      "Student information unavailable",
    studentId:
      raw?.studentId ||
      report?.studentNumber ||
      report?.student?.studentId ||
      "",
    grade: raw?.grade || report?.grade || "",
    section: raw?.section || report?.section || "",
    email: raw?.email || report?.studentEmail || "",
    phone: raw?.phone || "",
    profilePhoto:
      raw?.profilePhoto ||
      report?.studentProfilePhoto ||
      report?.profilePhoto ||
      "",
  };
};

const getOffense = (report) =>
  report?.offense ||
  report?.title ||
  report?.incidentType ||
  report?.subject ||
  "Incident Report";

const getCategory = (report) =>
  report?.category || report?.type || "Uncategorized";

const getDescription = (report) =>
  report?.description ||
  report?.details ||
  report?.message ||
  "No description provided.";

const getLocation = (report) =>
  report?.location || report?.incidentLocation || "Not recorded";

const getRiskLevel = (report) => {
  const value =
    report?.riskLevel ||
    report?.aiReview?.riskLevel ||
    report?.risk ||
    report?.level ||
    "";

  const normalized = String(value).toLowerCase();

  if (normalized.includes("high")) return "High";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "Medium";
  if (normalized.includes("low")) return "Low";

  return "Not assessed";
};

const getSeverity = (report) => {
  const value =
    report?.severity ||
    report?.aiReview?.severity ||
    report?.level ||
    "";

  const normalized = String(value).toLowerCase();

  if (normalized.includes("high") || normalized.includes("major")) return "High";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "Medium";
  if (normalized.includes("low") || normalized.includes("minor")) return "Low";

  return "Not recorded";
};

const statusGroup = (report) => {
  const status = String(report?.status || "pending").toLowerCase();

  if (
    [
      "rejected",
      "declined",
      "denied",
      "closed-rejected",
    ].includes(status)
  ) {
    return "rejected";
  }

  if (
    [
      "accepted",
      "approved",
      "under-review",
      "under_review",
      "reviewing",
      "reviewed",
      "resolved",
      "completed",
    ].includes(status)
  ) {
    return "accepted";
  }

  return "pending";
};

const statusLabel = (report) => {
  const group = statusGroup(report);
  if (group === "accepted") return "Accepted";
  if (group === "rejected") return "Rejected";
  return "In progress";
};

const statusClass = (report, darkMode) => {
  const group = statusGroup(report);

  if (group === "accepted") {
    return darkMode
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : "bg-green-50 text-green-700 border-green-100";
  }

  if (group === "rejected") {
    return darkMode
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-red-50 text-red-700 border-red-100";
  }

  return darkMode
    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
    : "bg-amber-50 text-amber-700 border-amber-100";
};

const riskClass = (value, darkMode) => {
  const level = String(value).toLowerCase();

  if (level === "high") {
    return darkMode
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-red-50 text-red-700 border-red-100";
  }

  if (level === "medium") {
    return darkMode
      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
      : "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (level === "low") {
    return darkMode
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : "bg-green-50 text-green-700 border-green-100";
  }

  return darkMode
    ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
    : "bg-gray-50 text-gray-500 border-gray-100";
};

const formatDate = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeEvidence = (report) => {
  const source =
    report?.evidence ||
    report?.evidenceFiles ||
    report?.attachments ||
    [];

  if (!Array.isArray(source)) return [];

  return source
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          url: item,
          name: `Evidence ${index + 1}`,
          type: "",
        };
      }

      if (!item || typeof item !== "object") return null;

      const url =
        item.url ||
        item.secure_url ||
        item.path ||
        item.src ||
        item.downloadUrl;

      if (!url) return null;

      return {
        url,
        name:
          item.name ||
          item.originalName ||
          item.originalname ||
          item.filename ||
          item.fileName ||
          `Evidence ${index + 1}`,
        type: item.type || item.mimeType || item.contentType || "",
      };
    })
    .filter(Boolean);
};

const normalizeEvidenceUrl = (url) => {
  if (!url) return "";

  if (/^(https?:|blob:|data:)/i.test(url)) return url;

  if (url.startsWith("/uploads") || url.startsWith("/api/uploads")) {
    const base = String(
      import.meta.env.VITE_API_URL || "http://localhost:5000",
    ).replace(/\/$/, "");

    return `${base}${url}`;
  }

  return url;
};

const isImageEvidence = (item) =>
  /(^image\/|\.(png|jpe?g|gif|webp|bmp|svg)(\?|$))/i.test(
    `${item?.type || ""} ${item?.url || ""}`,
  );

/* =========================================================
   THEME
========================================================= */

const getStoredTheme = () => {
  try {
    return localStorage.getItem("guided-theme") === "dark";
  } catch {
    return false;
  }
};

const ThemeToggle = ({ darkMode, setDarkMode }) => {
  const handleToggle = () => {
    setDarkMode((current) => {
      const next = !current;
      const theme = next ? "dark" : "light";

      try {
        localStorage.setItem("guided-theme", theme);
      } catch {}

      document.documentElement.style.colorScheme = theme;

      window.dispatchEvent(
        new CustomEvent("guided-theme-change", {
          detail: theme,
        }),
      );

      return next;
    });
  };

  return (
     <button
          type="button"
          onClick={() => setDarkMode((value) => !value)}
          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition ${
            darkMode
              ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]"
              : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
          }`}
          title="Toggle theme"
        >
          <span className="flex items-center gap-3">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                darkMode
                  ? "bg-amber-950/40 text-amber-300"
                  : "bg-white text-slate-500"
              }`}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            {darkMode ? "Light mode" : "Dark mode"}
          </span>
          <span
            className={`relative w-9 h-5 rounded-full transition ${
              darkMode ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition ${
                darkMode ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
        </button>
  );
};

/* =========================================================
   PAGE
========================================================= */

const TeacherMyReportsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [darkMode, setDarkMode] = useState(getStoredTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const [selectedReport, setSelectedReport] = useState(null);
  const [expandedEvidence, setExpandedEvidence] = useState(null);

  const teacherName = getDisplayName(user);
  const teacherFirstName =
    user?.firstName ||
    teacherName.split(" ")[0] ||
    "Teacher";

  const profilePhoto = user?.profilePhoto || user?.avatar || "";

  const theme = useMemo(
    () => ({
      page: darkMode ? "bg-[#07110B] text-gray-100" : "bg-[#F7F9F8] text-gray-900",
      sidebar: darkMode ? "bg-[#0B1710]" : "bg-white",
      card: darkMode ? "bg-[#0D1A12]" : "bg-white",
      subtle: darkMode ? "bg-[#101F17]" : "bg-gray-50",
      border: darkMode ? "border-[#1D3324]" : "border-gray-100",
      heading: darkMode ? "text-gray-100" : "text-gray-900",
      body: darkMode ? "text-gray-400" : "text-gray-600",
      muted: darkMode ? "text-gray-500" : "text-gray-400",
    }),
    [darkMode],
  );

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  /* =========================================================
     THEME SYNC
  ========================================================= */

  useEffect(() => {
    const handleThemeChange = (event) => {
      if (event?.detail === "dark") {
        setDarkMode(true);
      } else if (event?.detail === "light") {
        setDarkMode(false);
      } else {
        setDarkMode(getStoredTheme());
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "guided-theme") {
        setDarkMode(event.newValue === "dark");
      }
    };

    window.addEventListener("guided-theme-change", handleThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("guided-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /* =========================================================
     FETCH
  ========================================================= */

  const fetchReports = useCallback(async () => {
    if (!user?._id) {
      setReports([]);
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      setError("");

      const response = await API.get("/api/reports?limit=10000");
      const allReports = normalizeArray(response.data);

      const teacherReports = allReports
        .filter((report) => isTeacherReport(report, user._id))
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.date || 0).getTime() -
            new Date(a.createdAt || a.date || 0).getTime(),
        );

      setReports(teacherReports);
    } catch (err) {
      console.error("Teacher My Reports fetch error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load your reported records.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const status = statusGroup(report);
      const risk = getRiskLevel(report).toLowerCase();

      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (riskFilter !== "all" && risk !== riskFilter) return false;

      if (!query) return true;

      const student = getStudent(report);

      return [
        getOffense(report),
        getCategory(report),
        getDescription(report),
        getLocation(report),
        student.name,
        student.studentId,
        student.grade,
        student.section,
        report.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [reports, search, statusFilter, riskFilter]);

  const stats = useMemo(() => {
    const people = new Set();

    reports.forEach((report) => {
      const student = getStudent(report);
      if (student.id || student.studentId || student.name) {
        people.add(
          String(student.id || student.studentId || student.name).toLowerCase(),
        );
      }
    });

    return {
      total: reports.length,
      people: people.size,
      pending: reports.filter((report) => statusGroup(report) === "pending").length,
      accepted: reports.filter((report) => statusGroup(report) === "accepted").length,
      rejected: reports.filter((report) => statusGroup(report) === "rejected").length,
    };
  }, [reports]);

  /* =========================================================
     SIDEBAR
  ========================================================= */

  const Nav = ({ icon, label, path, active = false }) => (
    <button
      type="button"
      onClick={() => path && handleNavigation(path)}
      className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
        active
          ? darkMode
            ? "bg-green-500/10 text-green-400"
            : "bg-green-50 text-green-700"
          : darkMode
            ? "text-gray-400 hover:bg-[#101F15] hover:text-gray-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span
        className={`transition ${
          active
            ? "text-green-500"
            : darkMode
              ? "text-gray-600 group-hover:text-gray-300"
              : "text-gray-400 group-hover:text-gray-700"
        }`}
      >
        {icon}
      </span>

      <span className="truncate">{label}</span>

      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
      )}
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
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-green-500/10 blur-md" />
              <img
                src="/school-logo.webp"
                alt="School Logo"
                className="relative w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className={`text-xl font-extrabold tracking-tight ${theme.heading}`}>
                Guid<span className="text-green-500">Ed</span>
              </h1>
              <p
                className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}
              >
                Teacher Guidance
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
            path="/teacher-dashboard"
          />
          <Nav
            icon={<FileWarning size={18} />}
            label="My Reports"
            path="/teacher-my-reports"
            active
          />
          <Nav
            icon={<FileText size={18} />}
            label="My Class"
            path="/teacher-class"
          />
          <Nav
            icon={<MessageSquare size={18} />}
            label="Messages"
            path="/messages"
          />
          <Nav
            icon={<Plus size={18} />}
            label="Report an Incident"
            path="/reports/create"
          />
        </div>

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          Guidance Support
        </p>

        <div className="space-y-1">
          <Nav
            icon={<BookOpen size={18} />}
            label="Guidance Resources"
            path="/guidance"
          />
          <Nav
            icon={<LifeBuoy size={18} />}
            label="Get Support"
            path="/messages"
          />
        </div>

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          System
        </p>

        <Nav
          icon={<Settings size={18} />}
          label="Settings"
          path="/settings"
        />
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                darkMode ? "bg-green-500/10" : "bg-green-100"
              }`}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={teacherName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-500 font-bold">
                  {teacherName.charAt(0).toUpperCase()}
                </span>
              )}

              <span
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
                  darkMode ? "border-[#0B1710]" : "border-white"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}
              >
                Teacher
              </p>
              <p className={`text-sm font-bold truncate ${theme.heading}`}>
                {teacherName}
              </p>
            </div>
          </div>
        </div>

        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

        <button
          type="button"
          onClick={logout}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${
            darkMode
              ? "text-gray-300 border-[#24392A] hover:bg-red-500/10 hover:text-red-400"
              : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  /* =========================================================
     REPORT CARD
  ========================================================= */

  const ReportCard = ({ report }) => {
    const student = getStudent(report);
    const risk = getRiskLevel(report);
    const severity = getSeverity(report);

    return (
      <button
        type="button"
        onClick={() => setSelectedReport(report)}
        className={`group relative w-full text-left rounded-[24px] border p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
          theme.card
        } ${theme.border}`}
      >
        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
            risk === "High"
              ? "bg-red-500/10"
              : risk === "Medium"
                ? "bg-amber-500/10"
                : "bg-green-500/10"
          }`}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  darkMode
                    ? "bg-green-500/10 text-green-400"
                    : "bg-green-50 text-green-600"
                }`}
              >
                <FileWarning size={21} />
              </div>

              <div className="min-w-0">
                <p
                  className={`text-[10px] uppercase tracking-widest font-bold ${theme.muted}`}
                >
                  Reported Record
                </p>
                <h3
                  className={`text-sm sm:text-base font-extrabold truncate mt-1 ${theme.heading}`}
                >
                  {getOffense(report)}
                </h3>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-lg border text-[9px] font-extrabold whitespace-nowrap ${statusClass(
                report,
                darkMode,
              )}`}
            >
              {statusLabel(report)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200/50">
              {student.profilePhoto ? (
                <img
                  src={student.profilePhoto}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    darkMode
                      ? "bg-[#14261C] text-green-300"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  <UserRound size={17} />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${theme.heading}`}>
                {student.name}
              </p>
              <p className={`text-[10px] mt-0.5 truncate ${theme.muted}`}>
                {student.studentId || "No student ID"}
                {student.grade ? ` • ${student.grade}` : ""}
                {student.section ? ` • ${student.section}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <MiniInfo
              icon={<CalendarDays size={13} />}
              label="Incident"
              value={formatDate(report.date || report.createdAt)}
              theme={theme}
            />
            <MiniInfo
              icon={<MapPin size={13} />}
              label="Location"
              value={getLocation(report)}
              theme={theme}
            />
            <MiniInfo
              icon={<AlertTriangle size={13} />}
              label="Severity"
              value={severity}
              theme={theme}
            />
            <div
              className={`rounded-xl border p-2.5 ${theme.subtle} ${theme.border}`}
            >
              <p
                className={`text-[8px] uppercase tracking-wider font-bold ${theme.muted}`}
              >
                Risk
              </p>
              <span
                className={`inline-flex mt-1 px-2 py-0.5 rounded-md border text-[9px] font-extrabold ${riskClass(
                  risk,
                  darkMode,
                )}`}
              >
                {risk}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <p className={`text-[9px] ${theme.muted}`}>
              Submitted {formatDateTime(report.createdAt)}
            </p>

            <span
              className={`text-[10px] font-bold transition-colors ${
                darkMode
                  ? "text-green-400 group-hover:text-green-300"
                  : "text-green-600 group-hover:text-green-700"
              }`}
            >
              View record →
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${theme.page}`}
    >
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[250px] xl:w-[270px] flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 overflow-y-auto border-r ${theme.sidebar} ${theme.border}`}
      >
        <SidebarContent />
      </aside>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside
            className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] flex flex-col justify-between px-5 py-5 overflow-y-auto border-r lg:hidden ${theme.sidebar} ${theme.border}`}
          >
            <SidebarContent mobile />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto lg:ml-[250px] xl:ml-[270px]">
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
                  <span>Teacher Portal</span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">
                    My Reports
                  </span>
                </div>

                <h2
                  className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${theme.heading}`}
                >
                  My Reports
                </h2>

                <p className={`text-xs sm:text-sm mt-1 ${theme.body}`}>
                  Review all incident records submitted through your teacher account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-amber-300"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
                title="Toggle theme"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                <Bell size={17} />
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 max-w-[1380px] mx-auto">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-6">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.muted}`}>
                Teacher record history
              </p>
              <h1
                className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${theme.heading}`}
              >
                Your submitted reports
              </h1>
              <p className={`text-sm mt-2 max-w-2xl leading-relaxed ${theme.body}`}>
                These records are tied to the currently signed-in teacher account.
                Click any record to view the complete report details.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchReports}
              disabled={refreshing}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                darkMode
                  ? "bg-[#0D1A12] border-[#24392A] text-gray-300 hover:bg-[#14261C]"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              } disabled:opacity-60`}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <StatCard
              label="Total Reports"
              value={stats.total}
              icon={<FileWarning size={18} />}
              theme={theme}
              darkMode={darkMode}
            />
            <StatCard
              label="Students Reported"
              value={stats.people}
              icon={<UserRound size={18} />}
              theme={theme}
              darkMode={darkMode}
            />
            <StatCard
              label="In Progress"
              value={stats.pending}
              icon={<Clock4 size={18} />}
              tone="amber"
              theme={theme}
              darkMode={darkMode}
            />
            <StatCard
              label="Accepted"
              value={stats.accepted}
              icon={<CheckCircle2 size={18} />}
              tone="green"
              theme={theme}
              darkMode={darkMode}
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={<XCircle size={18} />}
              tone="red"
              theme={theme}
              darkMode={darkMode}
            />
          </div>

          {/* FILTERS */}
          <div
            className={`rounded-[24px] border p-4 sm:p-5 mb-6 ${theme.card} ${theme.border}`}
          >
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.muted}`}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by student, offense, category, location..."
                  className={`w-full h-11 rounded-xl border pl-10 pr-4 text-sm outline-none transition ${
                    darkMode
                      ? "bg-[#0B1710] border-[#24392A] text-gray-200 placeholder:text-gray-600 focus:border-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-green-300"
                  }`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Filter
                    size={14}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`}
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={`h-11 rounded-xl border pl-9 pr-9 text-xs font-semibold outline-none appearance-none ${
                      darkMode
                        ? "bg-[#0B1710] border-[#24392A] text-gray-200"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <option value="all">All status</option>
                    <option value="pending">In progress</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.muted}`}
                  />
                </div>

                <div className="relative">
                  <ShieldAlert
                    size={14}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`}
                  />
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value)}
                    className={`h-11 rounded-xl border pl-9 pr-9 text-xs font-semibold outline-none appearance-none ${
                      darkMode
                        ? "bg-[#0B1710] border-[#24392A] text-gray-200"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <option value="all">All risk</option>
                    <option value="low">Low risk</option>
                    <option value="medium">Medium risk</option>
                    <option value="high">High risk</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.muted}`}
                  />
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between gap-3 mt-3 text-[10px] ${theme.muted}`}>
              <span>
                Showing {filteredReports.length} of {reports.length} teacher reports
              </span>
              {(search || statusFilter !== "all" || riskFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setRiskFilter("all");
                  }}
                  className="font-bold text-green-500"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`rounded-[24px] border p-5 animate-pulse ${theme.card} ${theme.border}`}
                >
                  <div className={`h-5 w-2/3 rounded ${theme.subtle}`} />
                  <div className={`h-4 w-1/2 rounded mt-3 ${theme.subtle}`} />
                  <div className={`h-20 rounded-2xl mt-5 ${theme.subtle}`} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className={`rounded-[24px] border p-8 text-center ${theme.card} ${theme.border}`}
            >
              <XCircle className="mx-auto text-red-500" size={32} />
              <h3 className={`font-extrabold mt-3 ${theme.heading}`}>
                Unable to load reports
              </h3>
              <p className={`text-sm mt-2 ${theme.body}`}>{error}</p>
              <button
                type="button"
                onClick={fetchReports}
                className="mt-5 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
              >
                Try again
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div
              className={`rounded-[28px] border p-10 sm:p-14 text-center ${theme.card} ${theme.border}`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center ${
                  darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                }`}
              >
                <FileWarning size={25} />
              </div>

              <h3 className={`font-extrabold mt-5 ${theme.heading}`}>
                {reports.length === 0
                  ? "No reports submitted yet"
                  : "No matching reports"}
              </h3>

              <p className={`text-sm mt-2 max-w-md mx-auto leading-relaxed ${theme.body}`}>
                {reports.length === 0
                  ? "Reports submitted through your teacher account will appear here."
                  : "Try changing your search or filters to find another record."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report._id || report.id}
                  report={report}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          REPORT MODAL
      ===================================================== */}

      {selectedReport && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className={`w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[28px] border shadow-2xl ${theme.card} ${theme.border}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`px-5 sm:px-7 py-5 border-b flex items-center justify-between gap-4 ${theme.border}`}>
              <div className="min-w-0">
                <p className={`text-[10px] uppercase tracking-widest font-bold ${theme.muted}`}>
                  Teacher Report Record
                </p>
                <h2 className={`text-xl sm:text-2xl font-extrabold truncate mt-1 ${theme.heading}`}>
                  {getOffense(selectedReport)}
                </h2>
                <p className={`text-xs mt-1 ${theme.muted}`}>
                  Submitted {formatDateTime(selectedReport.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode
                    ? "bg-[#101F17] text-gray-400 hover:text-gray-100"
                    : "bg-gray-50 text-gray-500 hover:text-gray-800"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(92vh-104px)] p-5 sm:p-7">
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
                {/* STUDENT / SUMMARY */}
                <div className="space-y-4">
                  <section className={`rounded-2xl border p-5 ${theme.subtle} ${theme.border}`}>
                    {(() => {
                      const student = getStudent(selectedReport);

                      return (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200/50 flex-shrink-0">
                              {student.profilePhoto ? (
                                <img
                                  src={student.profilePhoto}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center ${
                                    darkMode
                                      ? "bg-[#14261C] text-green-300"
                                      : "bg-green-50 text-green-600"
                                  }`}
                                >
                                  <UserRound size={26} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>
                                Reported Student
                              </p>
                              <h3 className={`text-base font-extrabold truncate mt-1 ${theme.heading}`}>
                                {student.name}
                              </h3>
                              <p className={`text-[10px] mt-1 ${theme.muted}`}>
                                {student.studentId || "No student ID"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4 mt-5">
                            <DetailRow
                              icon={<GraduationCap size={15} />}
                              label="Grade and Section"
                              value={
                                [student.grade, student.section]
                                  .filter(Boolean)
                                  .join(" • ") || "Not recorded"
                              }
                              theme={theme}
                            />
                            <DetailRow
                              icon={<Mail size={15} />}
                              label="Email"
                              value={student.email || "Not recorded"}
                              theme={theme}
                            />
                            <DetailRow
                              icon={<Phone size={15} />}
                              label="Phone"
                              value={student.phone || "Not recorded"}
                              theme={theme}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </section>

                  <section className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${theme.muted}`}>
                      Report Status
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold ${statusClass(selectedReport, darkMode)}`}>
                        {statusLabel(selectedReport)}
                      </span>

                      <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-extrabold ${riskClass(getRiskLevel(selectedReport), darkMode)}`}>
                        {getRiskLevel(selectedReport)} Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <SummaryBox
                        label="Severity"
                        value={getSeverity(selectedReport)}
                        theme={theme}
                      />
                      <SummaryBox
                        label="Category"
                        value={getCategory(selectedReport)}
                        theme={theme}
                      />
                    </div>
                  </section>
                </div>

                {/* DETAILS */}
                <div className="space-y-5">
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={18} className="text-green-500" />
                      <h3 className={`font-extrabold ${theme.heading}`}>
                        Incident Details
                      </h3>
                    </div>

                    <div className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailRow
                          icon={<FileWarning size={15} />}
                          label="Offense"
                          value={getOffense(selectedReport)}
                          theme={theme}
                        />
                        <DetailRow
                          icon={<FileText size={15} />}
                          label="Category"
                          value={getCategory(selectedReport)}
                          theme={theme}
                        />
                        <DetailRow
                          icon={<CalendarDays size={15} />}
                          label="Incident Date"
                          value={formatDate(selectedReport.date)}
                          theme={theme}
                        />
                        <DetailRow
                          icon={<Clock3 size={15} />}
                          label="Incident Time"
                          value={selectedReport.time || "Not recorded"}
                          theme={theme}
                        />
                        <DetailRow
                          icon={<MapPin size={15} />}
                          label="Location"
                          value={getLocation(selectedReport)}
                          theme={theme}
                        />
                        <DetailRow
                          icon={<Clock4 size={15} />}
                          label="Submitted"
                          value={formatDateTime(selectedReport.createdAt)}
                          theme={theme}
                        />
                      </div>

                      <div className={`mt-5 rounded-xl p-4 ${theme.subtle}`}>
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${theme.muted}`}>
                          Description
                        </p>
                        <p className={`text-sm leading-6 mt-2 whitespace-pre-wrap ${theme.body}`}>
                          {getDescription(selectedReport)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* EVIDENCE */}
                  <section>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon size={18} className="text-blue-500" />
                        <h3 className={`font-extrabold ${theme.heading}`}>
                          Evidence
                        </h3>
                      </div>

                      <span className={`text-[10px] font-semibold ${theme.muted}`}>
                        {normalizeEvidence(selectedReport).length} file(s)
                      </span>
                    </div>

                    {normalizeEvidence(selectedReport).length === 0 ? (
                      <div className={`rounded-2xl border p-5 ${theme.subtle} ${theme.border}`}>
                        <p className={`text-sm ${theme.body}`}>
                          No evidence file was attached to this report.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {normalizeEvidence(selectedReport).map((item, index) => {
                          const url = normalizeEvidenceUrl(item.url);

                          return (
                            <div
                              key={`${item.url}-${index}`}
                              className={`rounded-2xl border overflow-hidden ${theme.card} ${theme.border}`}
                            >
                              {isImageEvidence(item) ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedEvidence(
                                      expandedEvidence === url ? null : url,
                                    )
                                  }
                                  className="block w-full aspect-square"
                                >
                                  <img
                                    src={url}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : (
                                <div className={`aspect-square flex flex-col items-center justify-center ${theme.subtle}`}>
                                  <FileText size={24} className="text-blue-500" />
                                  <p className={`text-[10px] font-bold mt-2 px-3 text-center truncate max-w-full ${theme.heading}`}>
                                    {item.name}
                                  </p>
                                </div>
                              )}

                              <div className="p-3">
                                <p className={`text-[10px] font-bold truncate ${theme.heading}`}>
                                  {item.name}
                                </p>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] font-bold text-green-500 mt-1"
                                >
                                  Open file
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {expandedEvidence && (
                      <div
                        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setExpandedEvidence(null)}
                      >
                        <img
                          src={expandedEvidence}
                          alt="Evidence preview"
                          className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        />
                      </div>
                    )}
                  </section>

                  {/* ADDITIONAL DATA */}
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck size={18} className="text-green-500" />
                      <h3 className={`font-extrabold ${theme.heading}`}>
                        Record Information
                      </h3>
                    </div>

                    <div className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailRow
                          icon={<UserRound size={15} />}
                          label="Reporter"
                          value={
                            reportReporterName(selectedReport) ||
                            teacherName
                          }
                          theme={theme}
                        />
                        <DetailRow
                          icon={<ShieldAlert size={15} />}
                          label="Reporter Type"
                          value={selectedReport.reporterType || "Teacher"}
                          theme={theme}
                        />
                        <DetailRow
                          icon={<CheckCircle2 size={15} />}
                          label="Record ID"
                          value={selectedReport._id || "Not available"}
                          theme={theme}
                        />
                        <DetailRow
                          icon={<Clock4 size={15} />}
                          label="Last Updated"
                          value={formatDateTime(
                            selectedReport.updatedAt || selectedReport.createdAt,
                          )}
                          theme={theme}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

const MiniInfo = ({ icon, label, value, theme }) => (
  <div className={`rounded-xl border p-2.5 ${theme.subtle} ${theme.border}`}>
    <div className="flex items-center gap-1.5">
      <span className={theme.muted}>{icon}</span>
      <p className={`text-[8px] uppercase tracking-wider font-bold ${theme.muted}`}>
        {label}
      </p>
    </div>
    <p className={`text-[10px] font-bold mt-1 truncate ${theme.heading}`}>
      {value}
    </p>
  </div>
);

const DetailRow = ({ icon, label, value, theme }) => (
  <div className="flex items-start gap-2.5 min-w-0">
    <span className={`mt-0.5 flex-shrink-0 ${theme.muted}`}>{icon}</span>
    <div className="min-w-0">
      <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>
        {label}
      </p>
      <p className={`text-xs font-semibold mt-0.5 break-words ${theme.heading}`}>
        {value}
      </p>
    </div>
  </div>
);

const SummaryBox = ({ label, value, theme }) => (
  <div className={`rounded-xl border p-3 ${theme.subtle} ${theme.border}`}>
    <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>
      {label}
    </p>
    <p className={`text-sm font-extrabold mt-1 truncate ${theme.heading}`}>
      {value}
    </p>
  </div>
);

const StatCard = ({
  label,
  value,
  icon,
  tone = "default",
  theme,
  darkMode,
}) => {
  const iconClass =
    tone === "red"
      ? darkMode
        ? "bg-red-500/10 text-red-400"
        : "bg-red-50 text-red-600"
      : tone === "amber"
        ? darkMode
          ? "bg-amber-500/10 text-amber-400"
          : "bg-amber-50 text-amber-600"
        : tone === "green"
          ? darkMode
            ? "bg-green-500/10 text-green-400"
            : "bg-green-50 text-green-600"
          : darkMode
            ? "bg-blue-500/10 text-blue-400"
            : "bg-blue-50 text-blue-600";

  return (
    <div className={`rounded-[22px] border p-4 ${theme.card} ${theme.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>
            {label}
          </p>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${theme.heading}`}>
            {value}
          </p>
        </div>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const reportReporterName = (report) => {
  const reporter = report?.reporterId;

  if (reporter && typeof reporter === "object") {
    return (
      reporter.name ||
      [reporter.firstName, reporter.middleName, reporter.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
    );
  }

  return report?.reporterName || report?.reporter || "";
};

export default TeacherMyReportsPage;
