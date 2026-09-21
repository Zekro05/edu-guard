import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  BookOpen,
  Moon,
  Sun,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Eye,
  CalendarDays,
  MapPin,
  ChevronDown,
  Sparkles,
  Plus,
  Inbox,
  CircleDot,
  HelpCircle,
  Paperclip,
  ExternalLink,
  FileClock,
  Image as ImageIcon,
} from "lucide-react";
import { API } from "../lib/api.js";
import { useAuthStore } from "../store/authStore";

const MINOR_OFFENSES = [
  "Dress Code Violation", "Improper Uniform", "Improper Haircut", "Unauthorized Hair Color", "Wearing Earrings", "Use of Cosmetics/Nail Polish", "Unnecessary Talking", "Shouting", "Howling", "Eating Inside Classroom", "Extreme Quarrels", "Minor Classroom Disruption", "Use of Impolite Words", "Cursing", "Teasing", "Name Calling", "Habitual Absences", "Unnecessary Use of Chat Box", "Unresponsive During Online Classes", "Leaving Online Conference Without Permission", "Turning Off Camera Without Valid Reason", "Improper Camera Visibility", "Habitual Tardiness", "Inappropriate Profile Picture/Background", "Unsigned School Correspondence", "Late Submission of Reply Slips", "Non-submission of Reply Slips", "Failure to Submit Excuse Letter", "Loss of Violation Report", "Littering", "Violation of Library Rules", "Failure to Return Borrowed Materials", "Not Wearing School ID", "Playing Cards", "Rough Play", "Horseplaying", "Refusal to Replace Damaged Property", "Using Cellphone During Examination", "Failure to Present School ID", "Tampering School ID", "Tampering Library Card", "Loitering", "Lending School ID", "Using Someone Else's ID", "Locker Policy Violation", "Eating in Restricted Areas", "Unauthorized Gadgets", "Unauthorized Cellphone Use",
];

const MAJOR_OFFENSES = [
  "Sharing Account Credentials", "Piracy", "Unauthorized Downloading", "Posting Screenshots Without Consent", "Defamation", "Slander", "Recording Without Consent", "Cyberbullying", "Cyber Baiting", "Unauthorized Transactions", "Viewing Pornographic Materials", "Selling Without Approval", "Spreading Fake News", "Harassment", "Threatening Messages", "Profanity", "Using Portal for Political Activities", "Using Portal for Gambling", "Anonymous Harassing Emails", "Threatening Other Students", "Desecration of Religious Items", "Disrespect During Ceremonies", "Improper Use of Internet", "Withholding Information", "Petty Theft", "Stealing", "Possession of Pornographic Materials", "Threatening School Personnel", "Unauthorized Solicitation", "Disrespect to School Authorities", "Disobedience", "Defiance", "Assault", "Abusive Behavior", "Bringing School Into Disrepute", "Forgery", "Cheating", "Plagiarism", "Academic Dishonesty", "Vandalism", "Defacing School Property", "Destroying School Property", "Tampering School Records", "Possession of Immoral Materials", "Gambling", "Mischief", "Unauthorized Use of School Equipment", "Spreading False Information", "Instigating a Fight", "Unauthorized Leaving of Campus", "Possession of Liquor", "Possession of Cigarettes", "Possession of Vape", "Possession of Deadly Weapon", "Fighting", "Physical Injury", "Physical Assault", "Entering Bars While in Uniform", "Tampering Fire Safety Equipment", "Habitual Violation of School Rules", "Smoking Inside Campus", "Smoking During School Activities", "Drug Possession", "Drug Selling", "Public Display of Affection", "Indecent Conduct", "Immoral Conduct", "Pregnancy-related Misconduct", "Sex Video/Scandal Involvement", "Joining Unauthorized Fraternities", "Hazing", "Voyeurism",
];

const normalizeOffenseName = (value) => String(value || "").trim().toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ");
const MINOR_OFFENSE_SET = new Set(MINOR_OFFENSES.map(normalizeOffenseName));
const MAJOR_OFFENSE_SET = new Set(MAJOR_OFFENSES.map(normalizeOffenseName));

const MyReportsPage = () => {
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
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}

    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

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
    }),
    [darkMode],
  );

  const studentName = useMemo(
    () =>
      [user?.firstName, user?.middleName, user?.lastName]
        .filter(Boolean)
        .join(" ") ||
      user?.name ||
      user?.fullName ||
      "Student",
    [user],
  );

  const firstName =
    user?.firstName || user?.name?.split(" ")?.[0] || "Student";

  const profilePhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  const userId = user?._id || user?.id;

  const normalizeArray = (payload, keys = []) => {
    if (Array.isArray(payload)) return payload;

    for (const key of keys) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }

    return [];
  };

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);

      const [reportsResponse, notificationsResponse] = await Promise.all([
        API.get("/api/reports/my"),
        API.get(`/api/notifications/${userId}/unread`),
      ]);

      const allReports = normalizeArray(reportsResponse.data, [
        "reports",
        "data",
      ]);

      // `/api/reports/my` is already scoped by the authenticated account.
      // Keep the response intact because this endpoint also supplies
      // `studentName`, which is the reported student's actual display name.
      const ownReports = allReports;

      const uniqueReports = Array.from(
        new Map(
          ownReports.map((report, index) => [
            String(report?._id || report?.id || `local-${index}`),
            report,
          ]),
        ).values(),
      );

      setReports(uniqueReports);

      const unread = normalizeArray(notificationsResponse.data, [
        "notifications",
        "data",
      ])
        .filter((notification) => !notification.isRead)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );

      setNotifications(unread);
    } catch (error) {
      console.error("My reports fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reportStatus = (report) =>
    String(report.status || report.reportStatus || "pending").toLowerCase();

  // Status grouping for My Reports:
  // - pending = In progress
  // - rejected/declined/denied = Rejected
  // - every other non-pending status = Accepted
  const statusGroup = (report) => {
    const status = reportStatus(report);

    if (["rejected", "declined", "denied", "decline", "deny"].includes(status)) {
      return "rejected";
    }

    return status === "pending" ? "pending" : "accepted";
  };

  const statusLabel = (report) => {
    const group = statusGroup(report);
    if (group === "accepted") return "Accepted";
    if (group === "rejected") return "Rejected";
    return "In progress";
  };

  const statusStyle = (report) => {
    const group = statusGroup(report);

    if (group === "accepted") {
      return darkMode
        ? "bg-green-500/10 text-green-400 border-green-500/20"
        : "bg-green-50 text-green-700 border-green-100";
    }

    if (group === "rejected") {
      return darkMode
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-red-50 text-red-700 border-red-100";
    }

    return darkMode
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-amber-50 text-amber-700 border-amber-100";
  };

  const formatDate = (value) => {
    if (!value) return "No date";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "No date available";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date available";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Reports reference the IncidentModel for the actual offense/risk context.
  // Keep these helpers defensive because the API may return the relation populated
  // under different property names.
  const getIncidentModel = (report) =>
    report?.incidentId && typeof report.incidentId === "object"
      ? report.incidentId
      : report?.incident && typeof report.incident === "object"
        ? report.incident
        : report?.incidentModel && typeof report.incidentModel === "object"
          ? report.incidentModel
          : report?.case && typeof report.case === "object"
            ? report.case
            : null;

  const getReportedStudent = (report) => {
    const incident = getIncidentModel(report);

    // The mobile My Reports screen receives the reported student's name
    // directly from the /api/reports/my response as `studentName`.
    // Prefer that value before trying populated student objects.
    const directStudentName =
      report?.studentName ||
      report?.reportedStudentName ||
      report?.targetStudentName ||
      incident?.studentName ||
      null;

    const student =
      report?.studentId && typeof report.studentId === "object"
        ? report.studentId
        : report?.student && typeof report.student === "object"
          ? report.student
          : report?.reportedStudent && typeof report.reportedStudent === "object"
            ? report.reportedStudent
            : report?.reportedStudentId && typeof report.reportedStudentId === "object"
              ? report.reportedStudentId
              : report?.targetStudent && typeof report.targetStudent === "object"
                ? report.targetStudent
                : incident?.studentId && typeof incident.studentId === "object"
                  ? incident.studentId
                  : incident?.student && typeof incident.student === "object"
                    ? incident.student
                    : null;

    const rawId =
      report?.studentId && typeof report.studentId !== "object"
        ? report.studentId
        : report?.reportedStudentId && typeof report.reportedStudentId !== "object"
          ? report.reportedStudentId
          : report?.targetStudentId && typeof report.targetStudentId !== "object"
            ? report.targetStudentId
            : incident?.studentId && typeof incident.studentId !== "object"
              ? incident.studentId
              : null;

    // `studentName` is the canonical value used by the mobile app.
    // Do not show the generic placeholder when the API already supplied it.
    if (directStudentName) {
      return {
        id: rawId || student?._id || student?.id || student?.studentId || null,
        name: String(directStudentName).trim(),
        grade: report?.studentGrade || report?.grade || student?.grade || student?.yearLevel || null,
        section: report?.studentSection || report?.section || student?.section || null,
        avatar: report?.studentPhoto || report?.studentAvatar || student?.profilePhoto || student?.profilePicture || student?.avatar || null,
        studentCode: report?.studentCode || student?.studentId || student?.studentCode || null,
      };
    }

    if (!student) {
      return {
        id: rawId,
        name: "Reported student unavailable",
        grade: null,
        section: null,
      };
    }

    const name =
      [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      student.name ||
      student.fullName ||
      student.displayName ||
      "Reported student unavailable";

    return {
      id: student._id || student.id || student.studentId || null,
      name,
      grade: student.grade || student.yearLevel || null,
      section: student.section || null,
      avatar: student.profilePhoto || student.profilePicture || student.avatar || null,
      studentCode: student.studentId || student.studentCode || null,
    };
  };

  const getOffense = (report) => {
    const incident = getIncidentModel(report);
    return (
      report?.offense || incident?.offense || report?.incidentType ||
      report?.title || report?.subject || report?.category || "Other"
    );
  };

  const getOffenseLevel = (report) => {
    const offense = normalizeOffenseName(getOffense(report));
    if (MINOR_OFFENSE_SET.has(offense)) return "Minor";
    if (MAJOR_OFFENSE_SET.has(offense)) return "Major";

    const incident = getIncidentModel(report);
    const explicit = normalizeOffenseName(incident?.level || incident?.riskLevel || incident?.risk || "");
    if (explicit.includes("major") || explicit.includes("high")) return "Major";
    if (explicit.includes("minor") || explicit.includes("low")) return "Minor";
    return "Custom";
  };

  const getRiskLevel = (report) => {
    const level = getOffenseLevel(report);
    if (level === "Minor") return "Low";
    if (level === "Major") return "High";
    return "Not classified";
  };

  const getEvidenceSource = (report) => {
    const incident = getIncidentModel(report);
    return {
      ...report,
      evidence: report?.evidence?.length
        ? report.evidence
        : incident?.evidence || report?.attachments || report?.files || [],
    };
  };

  const getTitle = (report) => {
    const level = getOffenseLevel(report);
    return level === "Major" ? "Major Offense" : level === "Minor" ? "Minor Offense" : "Custom Offense";
  };

  const getDescription = (report) =>
    report.description ||
    report.details ||
    report.message ||
    report.incidentDescription ||
    "No additional description was provided.";

  const getLocation = (report) =>
    report.location ||
    report.incidentLocation ||
    report.place ||
    "Not specified";

  const normalizeEvidence = (report) => {
    const source = getEvidenceSource(report);
    const raw = [
      source?.evidence,
      report?.attachments,
      report?.files,
      report?.evidenceFiles,
      report?.uploadedFiles,
    ].find((value) => Array.isArray(value) && value.length > 0) || [];

    return raw
      .map((item, index) => {
        if (typeof item === "string") {
          return { url: item, name: `Evidence ${index + 1}`, type: "" };
        }

        if (!item || typeof item !== "object") return null;

        const url =
          item.url ||
          item.secure_url ||
          item.fileUrl ||
          item.path ||
          item.location ||
          item.src ||
          item.downloadUrl ||
          null;

        if (!url) return null;

        return {
          url,
          name:
            item.name ||
            item.originalname ||
            item.originalName ||
            item.filename ||
            item.fileName ||
            `Evidence ${index + 1}`,
          type: item.type || item.mimeType || item.contentType || "",
        };
      })
      .filter(Boolean);
  };

  const normalizeEvidenceUrl = (url) => {
    if (!url) return null;
    if (/^(https?:|blob:|data:)/i.test(url)) return url;
    if (url.startsWith("/uploads") || url.startsWith("/api/uploads")) {
      const base = String(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
      return `${base}${url}`;
    }
    return url;
  };

  const isImageEvidence = (item) =>
    /(^image\/|\.(png|jpe?g|gif|webp|bmp|svg)(\?|$))/i.test(
      `${item?.type || ""} ${item?.url || ""}`,
    );

  const isVideoEvidence = (item) =>
    /(^video\/|\.(mp4|webm|mov|m4v|ogg)(\?|$))/i.test(
      `${item?.type || ""} ${item?.url || ""}`,
    );

  const getOptionalField = (report, keys) => {
    for (const key of keys) {
      const value = report?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return null;
  };

  const stats = useMemo(() => {
    const reportedPeople = new Set();

    reports.forEach((report) => {
      const student = getReportedStudent(report);
      const key = student.id || student.name;
      if (key && student.name !== "Reported student unavailable") {
        reportedPeople.add(String(key).toLowerCase());
      }
    });

    return {
      total: reports.length,
      people: reportedPeople.size,
      pending: reports.filter((report) => statusGroup(report) === "pending")
        .length,
      accepted: reports.filter((report) => statusGroup(report) === "accepted")
        .length,
      rejected: reports.filter((report) => statusGroup(report) === "rejected")
        .length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = reports.filter((report) => {
      const matchesStatus =
        statusFilter === "all" || statusGroup(report) === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return [
        getOffense(report),
        getDescription(report),
        getLocation(report),
        getRiskLevel(report),
        report.status,
        report.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return result.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.date || 0).getTime();
      const bDate = new Date(b.createdAt || b.date || 0).getTime();

      return sortOrder === "newest" ? bDate - aDate : aDate - bDate;
    });
  }, [reports, search, statusFilter, sortOrder]);

  const markNotificationAsRead = async (notification) => {
    const notificationId = notification._id || notification.id;
    if (!notificationId) return;

    try {
      await API.put(`/api/notifications/read/${notificationId}`);
      setNotifications((current) =>
        current.filter(
          (item) =>
            String(item._id || item.id) !== String(notificationId),
        ),
      );
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!notifications.length) return;

    try {
      await API.put("/api/notifications/read-all");
      setNotifications([]);
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
    }
  };

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

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

      {label}

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
              <h1
                className={`text-xl font-extrabold tracking-tight ${theme.heading}`}
              >
                Guid<span className="text-green-500">Ed</span>
              </h1>
              <p
                className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}
              >
                Student Guidance
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
            path="/student-dashboard"
          />

          <Nav
            icon={<FileText size={18} />}
            label="My Reports"
            active
          />

          <Nav icon={<FileClock size={18} />} label="My History" path="/my-history"/>

          <Nav
            icon={<MessageSquare size={18} />}
            label="Messages"
            path="/message-admin"
          />

          <Nav
            icon={<Plus size={18} />}
            label="Report an Incident"
            path="/student-reporting"
          />
        </div>

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          Student Support
        </p>

        <Nav
          icon={<BookOpen size={18} />}
          label="Guidance Resources"
          path="/guidance"
        />

        <Nav
          icon={<HelpCircle size={18} />}
          label="Get Support"
          path="/messages"
        />

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
        <div
          className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                darkMode ? "bg-green-500/10" : "bg-green-100"
              }`}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-500 font-bold">
                  {studentName.charAt(0).toUpperCase()}
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
                className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}
              >
                Student
              </p>
              <p className={`text-sm font-bold truncate ${theme.heading}`}>
                {studentName}
              </p>
            </div>
          </div>
        </div>

        {/* Theme toggle intentionally sits directly below the student name card. */}
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

  const StatCard = ({ title, value, description, icon, accent }) => (
    <div
      className={`relative overflow-hidden border rounded-[24px] p-4 sm:p-5 shadow-sm ${theme.card}`}
    >
      <div
        className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl ${
          accent === "amber"
            ? "bg-amber-500/10"
            : accent === "red"
              ? "bg-red-500/10"
              : accent === "blue"
                ? "bg-blue-500/10"
                : "bg-green-500/10"
        }`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[11px] sm:text-sm font-bold uppercase tracking-wider ${theme.muted}`}
          >
            {title}
          </p>

          <p
            className={`text-3xl sm:text-4xl font-black tracking-tight mt-2 ${
              accent === "amber"
                ? darkMode
                  ? "text-amber-300"
                  : "text-amber-600"
                : accent === "red"
                  ? darkMode
                    ? "text-red-300"
                    : "text-red-600"
                  : accent === "blue"
                    ? darkMode
                      ? "text-blue-300"
                      : "text-blue-600"
                    : darkMode
                      ? "text-green-300"
                      : "text-green-600"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            accent === "amber"
              ? darkMode
                ? "bg-amber-500/10 text-amber-400"
                : "bg-amber-50 text-amber-600"
              : accent === "red"
                ? darkMode
                  ? "bg-red-500/10 text-red-400"
                  : "bg-red-50 text-red-600"
                : accent === "blue"
                  ? darkMode
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                  : darkMode
                    ? "bg-green-500/10 text-green-400"
                    : "bg-green-50 text-green-600"
          }`}
        >
          {icon}
        </div>
      </div>

      <p className={`relative text-[11px] mt-3 ${theme.muted}`}>
        {description}
      </p>
    </div>
  );

  const ReportCard = ({ report, index }) => {
    const group = statusGroup(report);
    const title = getTitle(report);

    return (
      <button
        type="button"
        onClick={() => setSelectedReport(report)}
        className={`group w-full text-left rounded-[24px] border p-4 sm:p-5 transition shadow-sm hover:shadow-md ${theme.card}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              group === "accepted"
                ? darkMode
                  ? "bg-green-500/10 text-green-400"
                  : "bg-green-50 text-green-600"
                : group === "rejected"
                  ? darkMode
                    ? "bg-red-500/10 text-red-400"
                    : "bg-red-50 text-red-600"
                  : darkMode
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-amber-50 text-amber-600"
            }`}
          >
            {group === "accepted" ? (
              <CheckCircle2 size={19} />
            ) : group === "rejected" ? (
              <AlertCircle size={19} />
            ) : (
              <Clock3 size={19} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-base sm:text-lg font-extrabold truncate max-w-full ${theme.heading}`}
              >
                {title}
              </h3>

              <span
                className={`px-2 py-1 rounded-lg border text-[11px] font-extrabold whitespace-nowrap ${statusStyle(
                  report,
                )}`}
              >
                {statusLabel(report)}
              </span>
            </div>

            <div className={`mt-3 flex items-center gap-3 rounded-2xl border p-3 ${
              darkMode ? "bg-white/[0.03] border-white/10" : "bg-green-50/60 border-green-100"
            }`}>
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-green-500/10">
                {getReportedStudent(report).avatar ? (
                  <img
                    src={getReportedStudent(report).avatar}
                    alt={getReportedStudent(report).name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-green-600 font-extrabold text-sm">
                    {getReportedStudent(report).name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>
                  Reported student
                </p>
                <p className={`text-sm font-extrabold truncate mt-0.5 ${theme.heading}`}>
                  {getReportedStudent(report).name}
                </p>
              </div>
              {getReportedStudent(report).grade && (
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? "bg-white/5 text-gray-300" : "bg-white text-gray-600"}`}>
                  {getReportedStudent(report).grade}{getReportedStudent(report).section ? ` • ${getReportedStudent(report).section}` : ""}
                </span>
              )}
            </div>

            <div className={`flex flex-wrap items-center gap-2 mt-2 text-sm ${theme.muted}`}>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {formatDate(report.createdAt || report.date)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {getLocation(report)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border ${
                getOffenseLevel(report) === "Major"
                  ? darkMode ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-100 text-red-700"
                  : getOffenseLevel(report) === "Minor"
                    ? darkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-100 text-amber-700"
                    : darkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"
              }`}>
                <ClipboardList size={13} />
                {getTitle(report)}
              </span>
              <span className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border ${
                getRiskLevel(report) === "High"
                  ? darkMode ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-100 text-red-700"
                  : getRiskLevel(report) === "Low"
                    ? darkMode ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-green-50 border-green-100 text-green-700"
                    : darkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"
              }`}>
                Risk Level: {getRiskLevel(report)}
              </span>
              {normalizeEvidence(report).length > 0 && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ${theme.subtle} ${theme.muted}`}>
                  <Paperclip size={13} />
                  {normalizeEvidence(report).length} evidence
                </span>
              )}
            </div>
          </div>

          <ChevronRight
            size={17}
            className={`mt-1 flex-shrink-0 transition-transform group-hover:translate-x-1 ${theme.muted}`}
          />
        </div>

        <p
          className={`mt-4 text-sm sm:text-base leading-6 line-clamp-3 ${theme.body}`}
        >
          {getDescription(report)}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span
            className={`text-[11px] font-bold ${
              group === "accepted"
                ? "text-green-500"
                : group === "rejected"
                  ? "text-red-500"
                  : "text-amber-500"
            }`}
          >
            {group === "accepted"
              ? "Your report has been accepted by the admin."
              : group === "rejected"
                ? "This report was not accepted."
                : "Your report is being reviewed."}
          </span>

          <span className={`text-[11px] font-bold ${theme.muted}`}>
            View details
          </span>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${theme.page}`}
    >
      <aside
        className={`hidden lg:flex w-[250px] xl:w-[270px] border-r flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 flex-shrink-0 ${theme.sidebar} ${theme.border}`}
      >
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] shadow-2xl flex flex-col justify-between px-5 py-5 lg:hidden ${theme.sidebar}`}
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header kept consistent with the student dashboard style. */}
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
                  <span>Student Portal</span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">
                    My Reports
                  </span>
                </div>

                <h2
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight truncate ${theme.heading}`}
                >
                  My Reports
                </h2>

                <p className={`text-sm sm:text-sm mt-1 ${theme.body}`}>
                  Keep track of your concerns and see where they are in the
                  guidance process.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => navigate("/report")}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold transition"
              >
                <Plus size={15} />
                Report an incident
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setNotificationOpen((value) => !value)
                  }
                  className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  <Bell size={17} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      className={`absolute right-0 mt-3 w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border shadow-2xl overflow-hidden z-50 ${theme.card}`}
                    >
                      <div
                        className={`flex items-center justify-between p-4 border-b ${theme.border}`}
                      >
                        <p className={`font-extrabold text-sm ${theme.heading}`}>
                          Notifications
                        </p>

                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[11px] font-bold text-green-500"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div
                            className={`p-6 text-center text-sm ${theme.muted}`}
                          >
                            You have no unread notifications.
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              type="button"
                              key={notification._id || notification.id}
                              onClick={() =>
                                markNotificationAsRead(notification)
                              }
                              className={`w-full text-left p-4 border-b ${theme.border} hover:bg-green-500/5`}
                            >
                              <p
                                className={`text-sm font-bold ${theme.heading}`}
                              >
                                {notification.title || "New notification"}
                              </p>

                              <p className={`text-sm mt-1 ${theme.body}`}>
                                {notification.message ||
                                  notification.body ||
                                  "You have a new notification."}
                              </p>

                              <p className={`text-[11px] mt-2 ${theme.muted}`}>
                                {formatDate(notification.createdAt)}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6">
          <section className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              title="Total"
              value={loading ? "—" : stats.total}
              description="All reports you've submitted"
              icon={<ClipboardList size={20} />}
              accent="blue"
            />

            <StatCard
              title="In progress"
              value={loading ? "—" : stats.pending}
              description="Currently being reviewed"
              icon={<Clock3 size={20} />}
              accent="amber"
            />

            <StatCard
              title="Accepted"
              value={loading ? "—" : stats.accepted}
              description="Reports accepted by the admin"
              icon={<CheckCircle2 size={20} />}
              accent="green"
            />

            <StatCard
              title="Rejected"
              value={loading ? "—" : stats.rejected}
              description="Reports declined by the admin"
              icon={<XCircle size={20} />}
              accent="red"
            />

            <StatCard
              title="People reported"
              value={loading ? "—" : stats.people}
              description="Unique students you've reported"
              icon={<MessageSquare size={20} />}
              accent="green"
            />

          </section>

          <section
            className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-7 ${
              darkMode
                ? "bg-gradient-to-br from-[#123A22] via-[#0E2818] to-[#0B1710] border-green-500/10"
                : "bg-gradient-to-br from-[#166534] via-[#15803D] to-[#14532D] border-green-700/10"
            } text-white`}
          >
            <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-20 -bottom-28 w-56 h-56 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={13} />
                  Your guidance record
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-4">
                  Your voice matters, {firstName}.
                </h3>

                <p className="text-sm leading-relaxed text-green-50/80 mt-2 max-w-xl">
                  Every report is a way to ask for help, raise a concern, or
                  make your school community safer. Use this page to follow
                  your submissions without losing track of what happens next.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/report")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-green-800 text-sm font-extrabold hover:bg-green-50 transition"
                >
                  <Plus size={15} />
                  Report an incident
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/messages")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-extrabold hover:bg-white/15 transition"
                >
                  Talk to guidance
                  <MessageSquare size={15} />
                </button>
              </div>
            </div>
          </section>

          <section className={`rounded-[26px] border p-4 sm:p-5 ${theme.card}`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      darkMode
                        ? "bg-green-500/10 text-green-400"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    <Inbox size={17} />
                  </div>

                  <div>
                    <h3 className={`text-sm font-extrabold ${theme.heading}`}>
                      Your report history
                    </h3>
                    <p className={`text-[11px] mt-0.5 ${theme.muted}`}>
                      Search, filter, and open any submission for details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                <div
                  className={`relative flex-1 sm:w-[260px] xl:w-[280px]`}
                >
                  <Search
                    size={15}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`}
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search your reports..."
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border outline-none text-sm transition ${
                      darkMode
                        ? "bg-[#101F15] border-[#24392A] text-gray-100 placeholder:text-gray-600 focus:border-green-500/40"
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-green-400"
                    }`}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <SlidersHorizontal
                      size={14}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`}
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value)
                      }
                      className={`appearance-none pl-9 pr-8 py-2.5 rounded-xl border outline-none text-sm font-semibold ${
                        darkMode
                          ? "bg-[#101F15] border-[#24392A] text-gray-200"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">In progress</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <ChevronDown
                      size={13}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.muted}`}
                    />
                  </div>

                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={sortOrder}
                      onChange={(event) => setSortOrder(event.target.value)}
                      className={`appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl border outline-none text-sm font-semibold ${
                        darkMode
                          ? "bg-[#101F15] border-[#24392A] text-gray-200"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>

                    <ChevronDown
                      size={13}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.muted}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${theme.border}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["all", "All"],
                  ["pending", "In progress"],
                  ["accepted", "Accepted"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-extrabold transition ${
                      statusFilter === value
                        ? darkMode
                          ? "bg-green-500/10 text-green-400"
                          : "bg-green-50 text-green-700"
                        : darkMode
                          ? "text-gray-500 hover:text-gray-200 hover:bg-white/5"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <span className={`text-[11px] font-bold ${theme.muted}`}>
                {loading
                  ? "Loading..."
                  : `${filteredReports.length} ${
                      filteredReports.length === 1 ? "report" : "reports"
                    } shown`}
              </span>
            </div>
          </section>

          <section>
            {loading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className={`h-44 rounded-[24px] animate-pulse ${
                      darkMode ? "bg-white/5" : "bg-gray-100"
                    }`}
                  />
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div
                className={`rounded-[28px] border border-dashed p-10 sm:p-14 text-center ${theme.card} ${theme.border}`}
              >
                <div
                  className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center ${
                    darkMode
                      ? "bg-green-500/10 text-green-400"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {search || statusFilter !== "all" ? (
                    <Search size={24} />
                  ) : (
                    <FileText size={24} />
                  )}
                </div>

                <h3 className={`text-base font-extrabold mt-4 ${theme.heading}`}>
                  {search || statusFilter !== "all"
                    ? "No matching reports"
                    : "No reports yet"}
                </h3>

                <p
                  className={`text-sm leading-relaxed max-w-md mx-auto mt-2 ${theme.muted}`}
                >
                  {search || statusFilter !== "all"
                    ? "Try changing your search or status filter to find another report."
                    : "If you need to raise a concern, you can submit your first incident report through GuidEd."}
                </p>

                {search || statusFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                    className="mt-5 text-sm font-extrabold text-green-500"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/report")}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold transition"
                  >
                    <Plus size={15} />
                    Report an incident
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredReports.map((report, index) => (
                  <ReportCard
                    key={report._id || report.id || index}
                    report={report}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? "bg-green-500/10 text-green-400"
                    : "bg-green-50 text-green-600"
                }`}
              >
                <CircleDot size={18} />
              </div>

              <h3 className={`text-sm font-extrabold mt-4 ${theme.heading}`}>
                What happens next?
              </h3>

              <p className={`text-sm leading-relaxed mt-2 ${theme.body}`}>
                Submitted reports can move through review, follow-up, and
                resolution. Status updates will appear here when available.
              </p>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <MessageSquare size={18} />
              </div>

              <h3 className={`text-sm font-extrabold mt-4 ${theme.heading}`}>
                Want to follow up?
              </h3>

              <p className={`text-sm leading-relaxed mt-2 ${theme.body}`}>
                If you need clarification or want to talk about a concern,
                reach out to the guidance team through Messages.
              </p>

              <button
                type="button"
                onClick={() => navigate("/messages")}
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-extrabold text-green-500"
              >
                Open messages
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.card}`}>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <Sparkles size={18} />
              </div>

              <h3 className={`text-sm font-extrabold mt-4 ${theme.heading}`}>
                Need a fresh start?
              </h3>

              <p className={`text-sm leading-relaxed mt-2 ${theme.body}`}>
                You can always submit another report when you have a new
                concern that needs the attention of the guidance team.
              </p>

              <button
                type="button"
                onClick={() => navigate("/report")}
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-extrabold text-green-500"
              >
                Create a report
                <Plus size={13} />
              </button>
            </div>
          </section>

          <section
            className={`rounded-[24px] border p-4 sm:p-5 ${theme.card}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`text-sm font-extrabold ${theme.heading}`}>
                  Keep your dashboard current
                </h3>
                <p className={`text-sm mt-1 ${theme.muted}`}>
                  Refresh to check for the latest report and notification
                  updates.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchData}
                disabled={refreshing}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold ${
                  darkMode
                    ? "border-[#24392A] text-gray-300 hover:bg-white/5"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                } disabled:opacity-50`}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </section>
        </div>
      </main>

      {selectedReport && (
          <>
            <div
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            />

            <div
              className={`fixed z-[90] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-4xl max-h-[88vh] overflow-y-auto rounded-[24px] border shadow-2xl ${theme.card}`}
            >
              <div
                className={`sticky top-0 z-10 p-4 sm:p-5 border-b backdrop-blur-xl ${
                  darkMode
                    ? "bg-[#0D1A12]/95 border-[#1A2C20]"
                    : "bg-white/95 border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        statusGroup(selectedReport) === "accepted"
                          ? "bg-green-500/10 text-green-500"
                          : statusGroup(selectedReport) === "rejected"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      <FileText size={19} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-[11px] uppercase tracking-widest font-bold ${theme.muted}`}
                      >
                        Report details
                      </p>

                      <h3
                        className={`text-lg font-black mt-1 truncate ${theme.heading}`}
                      >
                        {getTitle(selectedReport)}
                      </h3>

                      <span
                        className={`inline-flex mt-2 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold ${statusStyle(
                          selectedReport,
                        )}`}
                      >
                        {statusLabel(selectedReport)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      darkMode
                        ? "bg-white/5 text-gray-400 hover:text-white"
                        : "bg-gray-50 text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`rounded-2xl p-4 ${theme.subtle}`}>
                    <CalendarDays size={16} className="text-green-500" />
                    <p className={`text-[11px] uppercase font-bold mt-3 ${theme.muted}`}>
                      Submitted
                    </p>
                    <p className={`text-sm font-bold mt-1 ${theme.heading}`}>
                      {formatDateTime(
                        selectedReport.createdAt || selectedReport.date,
                      )}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-4 ${theme.subtle}`}>
                    <MapPin size={16} className="text-green-500" />
                    <p className={`text-[11px] uppercase font-bold mt-3 ${theme.muted}`}>
                      Location
                    </p>
                    <p className={`text-sm font-bold mt-1 ${theme.heading}`}>
                      {getLocation(selectedReport)}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-4 ${theme.subtle}`}>
                    <CircleDot size={16} className="text-green-500" />
                    <p className={`text-[11px] uppercase font-bold mt-3 ${theme.muted}`}>
                      Status
                    </p>
                    <p className={`text-sm font-bold mt-1 ${theme.heading}`}>
                      {statusLabel(selectedReport)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-green-500" />
                    <h4 className={`text-sm font-extrabold ${theme.heading}`}>
                      Your report
                    </h4>
                  </div>

                  <div
                    className={`mt-3 rounded-2xl border p-4 ${
                      darkMode
                        ? "bg-[#101F15] border-[#1A2C20]"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <p className={`text-sm leading-6 whitespace-pre-wrap ${theme.body}`}>
                      {getDescription(selectedReport)}
                    </p>
                  </div>
                </div>

                {(() => {
                  const evidence = normalizeEvidence(selectedReport);
                  const offense = getOffense(selectedReport);
                  const response = getOptionalField(selectedReport, [
                    "adminResponse",
                    "guidanceResponse",
                    "reviewNotes",
                    "resolution",
                    "remarks",
                    "feedback",
                  ]);

                  return (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <ClipboardList size={16} className="text-green-500" />
                          <h4 className={`text-sm font-extrabold ${theme.heading}`}>
                            Report information
                          </h4>
                        </div>
                        <p className={`text-sm mt-2 ${theme.body}`}>
                          You reported this student from your current GuidEd account.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          {[
                            ["Reported student", getReportedStudent(selectedReport).name],
                            ["Offense", offense],
                            ["Report ID", selectedReport?._id || selectedReport?.id || "Not available"],
                            ["Last updated", formatDateTime(selectedReport.updatedAt || selectedReport.modifiedAt) || "Not available"],
                          ].map(([label, value]) => (
                            <div key={label} className={`rounded-2xl border p-3 ${theme.subtle} ${theme.border}`}>
                              <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>{label}</p>
                              <p className={`text-sm font-bold mt-1 break-words ${theme.heading}`}>{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Paperclip size={16} className="text-green-500" />
                            <h4 className={`text-sm font-extrabold ${theme.heading}`}>Evidence</h4>
                          </div>
                          <span className={`text-[11px] font-bold ${theme.muted}`}>
                            {evidence.length} {evidence.length === 1 ? "file" : "files"}
                          </span>
                        </div>

                        {evidence.length === 0 ? (
                          <div className={`mt-3 rounded-2xl border border-dashed p-5 text-center ${theme.subtle} ${theme.border}`}>
                            <Paperclip size={20} className={`mx-auto ${theme.muted}`} />
                            <p className={`text-sm font-bold mt-2 ${theme.heading}`}>No evidence attached</p>
                            <p className={`text-[11px] mt-1 ${theme.muted}`}>This report does not contain any uploaded evidence.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            {evidence.map((item, index) => {
                              const url = normalizeEvidenceUrl(item.url);
                              const image = isImageEvidence(item);
                              const video = isVideoEvidence(item);
                              return (
                                <div key={`${item.url}-${index}`} className={`overflow-hidden rounded-2xl border ${theme.border} ${theme.subtle}`}>
                                  {image && url ? (
                                    <a href={url} target="_blank" rel="noreferrer" className="block aspect-video bg-black/5">
                                      <img src={url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                    </a>
                                  ) : video && url ? (
                                    <video src={url} controls className="w-full aspect-video object-cover" />
                                  ) : (
                                    <div className={`h-24 flex items-center justify-center ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
                                      <FileText size={26} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                                    </div>
                                  )}
                                  <div className="p-3 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className={`text-sm font-bold truncate ${theme.heading}`}>{item.name}</p>
                                      <p className={`text-[11px] mt-1 ${theme.muted}`}>{item.type || "Attached file"}</p>
                                    </div>
                                    {url && (
                                      <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${item.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/10 text-green-500 flex-shrink-0">
                                        <ExternalLink size={14} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {response && (
                        <div>
                          <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-green-500" />
                            <h4 className={`text-sm font-extrabold ${theme.heading}`}>Guidance response</h4>
                          </div>
                          <div className={`mt-3 rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                            <p className={`text-sm leading-6 whitespace-pre-wrap ${theme.body}`}>{String(response)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                  <div className="flex items-center gap-2">
                    <HelpCircle size={18} className="text-green-500" />
                    <h4 className={`text-sm font-extrabold ${theme.heading}`}>What happens next?</h4>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      ["1", "Submitted", "Your report is recorded securely."],
                      ["2", "Reviewed", "The guidance team reviews the incident details."],
                      ["3", statusGroup(selectedReport) === "accepted" ? "Accepted" : "Follow-up", statusGroup(selectedReport) === "accepted" ? "Your report has been accepted by the admin." : "You may be contacted if more information is needed."],
                    ].map(([number, title, text]) => (
                      <div key={number} className={`rounded-2xl p-3 ${darkMode ? "bg-white/5" : "bg-white"}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-sm font-black">{number}</span>
                          <span className={`text-sm font-bold ${theme.heading}`}>{title}</span>
                        </div>
                        <p className={`text-sm leading-5 mt-2 ${theme.muted}`}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    statusGroup(selectedReport) === "accepted"
                      ? darkMode
                        ? "border-green-500/15 bg-green-500/5"
                        : "border-green-100 bg-green-50/70"
                      : statusGroup(selectedReport) === "rejected"
                        ? darkMode
                          ? "border-red-500/15 bg-red-500/5"
                          : "border-red-100 bg-red-50/70"
                        : darkMode
                          ? "border-amber-500/15 bg-amber-500/5"
                          : "border-amber-100 bg-amber-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={18}
                      className={
                        statusGroup(selectedReport) === "accepted"
                          ? "text-green-500"
                          : statusGroup(selectedReport) === "rejected"
                            ? "text-red-500"
                            : "text-amber-500"
                      }
                    />

                    <div>
                      <p className={`text-sm font-extrabold ${theme.heading}`}>
                        {statusGroup(selectedReport) === "accepted"
                          ? "Report accepted"
                          : statusGroup(selectedReport) === "rejected"
                            ? "Report closed"
                            : "Under guidance review"}
                      </p>

                      <p className={`text-sm leading-relaxed mt-1 ${theme.body}`}>
                        {statusGroup(selectedReport) === "accepted"
                          ? "This report has been accepted by the admin. If you need additional support, you can still contact the guidance team."
                          : statusGroup(selectedReport) === "rejected"
                            ? "This report is marked as rejected. If you believe you need help with the concern, you can talk directly with the guidance team."
                            : "Your concern is still in progress. You can use Messages if you need to communicate with the guidance team."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(null);
                      navigate("/messages");
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-extrabold transition"
                  >
                    <MessageSquare size={15} />
                    Talk to guidance
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-extrabold ${
                      darkMode
                        ? "border-[#24392A] text-gray-300 hover:bg-white/5"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Close details
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

export default MyReportsPage;
