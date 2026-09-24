import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Plus,
  BookOpen,
  Moon,
  Sun,
  RefreshCw,
  Search,
  FileClock,
  CalendarDays,
  AlertCircle,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  PlayCircle,
  XCircle,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Activity,
  ClipboardList,
  Download,
  BrainCircuit,
  UserRound,
  AlertTriangle,
} from "lucide-react";
import { API } from "../lib/api.js";
import { useAuthStore } from "../store/authStore";

const MyHistory = () => {
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
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const theme = useMemo(
    () => ({
      page: darkMode ? "bg-[#07110B] text-gray-100" : "bg-[#F7F9F8] text-gray-900",
      sidebar: darkMode ? "bg-[#0B1710] border-[#17251B]" : "bg-white border-gray-100",
      card: darkMode ? "bg-[#0D1A12] border-[#1A2C20]" : "bg-white border-gray-100",
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
      [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.fullName ||
      "Student",
    [user],
  );

  const firstName = user?.firstName || user?.name?.split(" ")?.[0] || "Student";
  const profilePhoto = user?.profilePhoto || user?.profilePicture || user?.photo || null;
  const userId = user?._id || user?.id;

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const getId = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value._id || value.id || value.studentId || null;
    return value;
  };

  const getStudentId = (item) =>
    getId(item?.studentId) ||
    getId(item?.student) ||
    getId(item?.reportedStudentId) ||
    getId(item?.reportedStudent) ||
    getId(item?.userId) ||
    getId(item?.user);

  const getStudentName = (item) => {
    const student =
      (item?.studentId && typeof item.studentId === "object" && item.studentId) ||
      (item?.student && typeof item.student === "object" && item.student) ||
      (item?.reportedStudent && typeof item.reportedStudent === "object" && item.reportedStudent) ||
      null;

    return (
      item?.studentName ||
      item?.reportedStudentName ||
      student?.name ||
      student?.fullName ||
      [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(" ") ||
      ""
    );
  };

  const formatStatus = (status) => {
    const s = String(status || "received").toLowerCase().trim();

    if (s === "completed") return "Completed";
    if (["intervention-ready", "intervention_ready", "intervention ready"].includes(s)) return "Intervention Ready";
    if (["refer-for-intervention", "refer_for_intervention", "refer for intervention"].includes(s)) return "Refer for Intervention";
    if (["reviewing", "review", "under review", "under_review"].includes(s)) return "Under Review";
    if (["saved-student-statement", "saved_student_statement", "saved student statement"].includes(s)) return "Student Statement Saved";
    if (s === "received" || s === "pending") return "Pending";
    if (s === "resolved") return "Resolved";
    if (["rejected", "declined", "denied"].includes(s)) return "Rejected";

    return String(status || "Pending");
  };

  const getInterventionRecord = (item) => {
    if (item?.intervention && typeof item.intervention === "object") return item.intervention;
    if (item?.interventionRecord && typeof item.interventionRecord === "object") return item.interventionRecord;
    if (item?.interventionData && typeof item.interventionData === "object") return item.interventionData;
    if (item?.interventionId && typeof item.interventionId === "object") return item.interventionId;
    return null;
  };

  const getInterventionStatus = (item) => {
    const intervention = getInterventionRecord(item);
    const incidentStatus = String(item?.status || item?.effectiveStatus || "").toLowerCase().trim();
    const interventionStatus = String(intervention?.status || item?.interventionStatus || "").toLowerCase().trim();

    if (interventionStatus === "completed") return "Completed";
    if (interventionStatus === "resolved") return "Resolved";
    if (interventionStatus === "active") return "Active Intervention";

    if (["intervention-ready", "intervention_ready", "intervention ready"].includes(incidentStatus)) {
      return "Intervention Ready";
    }
    if (["refer-for-intervention", "refer_for_intervention", "refer for intervention"].includes(incidentStatus)) {
      return "Refer for Intervention";
    }
    if (incidentStatus === "completed") return "Completed";

    return "Not started";
  };

  const getInterventionDetails = (item) => {
    const intervention = getInterventionRecord(item);

    return {
      status: getInterventionStatus(item),
      type: intervention?.type || item?.interventionType || "",
      description: intervention?.description || item?.interventionDescription || "",
      interventionBy: intervention?.interventionBy || "",
      approvedBy: intervention?.approvedBy || "",
      completedBy: intervention?.completedBy || "",
      createdAt: intervention?.createdAt || null,
      rawStatus: intervention?.status || "",
    };
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
      case "Resolved":
      case "Case Closed":
        return { bg: darkMode ? "bg-green-500/10" : "bg-green-50", text: darkMode ? "text-green-400" : "text-green-700", border: darkMode ? "border-green-500/20" : "border-green-100", accent: "bg-green-500", icon: <CheckCircle2 size={14} /> };
      case "Intervention Ready":
        return { bg: darkMode ? "bg-cyan-500/10" : "bg-cyan-50", text: darkMode ? "text-cyan-300" : "text-cyan-700", border: darkMode ? "border-cyan-500/20" : "border-cyan-100", accent: "bg-cyan-500", icon: <ShieldCheck size={14} /> };
      case "Refer for Intervention":
        return { bg: darkMode ? "bg-purple-500/10" : "bg-purple-50", text: darkMode ? "text-purple-300" : "text-purple-700", border: darkMode ? "border-purple-500/20" : "border-purple-100", accent: "bg-purple-500", icon: <ShieldCheck size={14} /> };
      case "Active Intervention":
        return { bg: darkMode ? "bg-blue-500/10" : "bg-blue-50", text: darkMode ? "text-blue-400" : "text-blue-700", border: darkMode ? "border-blue-500/20" : "border-blue-100", accent: "bg-blue-500", icon: <PlayCircle size={14} /> };
      case "Under Review":
      case "Student Statement Saved":
        return { bg: darkMode ? "bg-amber-500/10" : "bg-amber-50", text: darkMode ? "text-amber-400" : "text-amber-700", border: darkMode ? "border-amber-500/20" : "border-amber-100", accent: "bg-amber-500", icon: <Clock3 size={14} /> };
      case "Rejected":
        return { bg: darkMode ? "bg-red-500/10" : "bg-red-50", text: darkMode ? "text-red-400" : "text-red-700", border: darkMode ? "border-red-500/20" : "border-red-100", accent: "bg-red-500", icon: <XCircle size={14} /> };
      case "Pending":
      default:
        return { bg: darkMode ? "bg-slate-500/10" : "bg-slate-50", text: darkMode ? "text-slate-300" : "text-slate-700", border: darkMode ? "border-slate-500/20" : "border-slate-200", accent: "bg-slate-400", icon: <Clock3 size={14} /> };
    }
  };

  const formatDate = (value) => {
    if (!value) return "No date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const normalizeIncidents = (payload) => {
    const data = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.incidents)
        ? payload.incidents
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    // The mobile app consumes /api/incidents directly. Some backend versions
    // return only the authenticated student's incidents, while others include
    // student identity fields on each record. Only apply a client-side filter
    // when identity information is actually present; otherwise preserve the
    // endpoint's scoped result instead of incorrectly hiding valid records.
    const hasIdentityFields = data.some((item) =>
      Boolean(
        getStudentId(item) ||
        getStudentName(item).trim(),
      ),
    );

    return data
      .filter((item) => {
        if (!hasIdentityFields) return true;
        if (!userId) return false;

        const incidentStudentId = getStudentId(item);
        if (incidentStudentId && String(incidentStudentId) === String(userId)) return true;

        const incidentStudentName = getStudentName(item).trim().toLowerCase();
        const currentName = studentName.trim().toLowerCase();

        return Boolean(
          incidentStudentName &&
          currentName !== "student" &&
          incidentStudentName === currentName,
        );
      })
      .map((item) => ({
        ...item,
        id: item._id || item.id,
        reportId: getId(item.reportId),
        title: item.title || item.offense || item.incidentType || "Incident Report",
        createdAt: item.createdAt || item.date || null,
        status: formatStatus(item.status || item.effectiveStatus),
        risk: item.level ? `${item.level} Risk` : item.riskLevel ? `${item.riskLevel} Risk` : "Unknown Risk",
        category: item.category || "Uncategorized",
        description: item.description || item.incidentDescription || "",
        studentStatement: item.studentStatement || item.statement || "",
        action: item.action || "",
        interventionRecord: item.intervention || item.interventionRecord || item.interventionData || (typeof item.interventionId === "object" ? item.interventionId : null),
        interventionStatus: getInterventionStatus(item),
      }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);

      const [incidentResponse, notificationResponse] = await Promise.all([
        API.get("/api/incidents"),
        API.get(`/api/notifications/${userId}/unread`).catch(() => ({ data: [] })),
      ]);

      setIncidents(normalizeIncidents(incidentResponse.data));

      const notificationData = Array.isArray(notificationResponse.data)
        ? notificationResponse.data
        : notificationResponse.data?.notifications || notificationResponse.data?.data || [];

      setNotifications(notificationData.filter((item) => !item.isRead));
    } catch (error) {
      console.error("My History fetch error:", error?.response?.data || error);
      setIncidents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, studentName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(incidents.map((item) => item.category).filter(Boolean)))], [incidents]);
  const statusOptions = useMemo(() => ["All", ...Array.from(new Set(incidents.map((item) => item.status).filter(Boolean)))], [incidents]);

  const filteredIncidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...incidents]
      .filter((item) => {
        const matchesSearch = !term || [item.title, item.category, item.status, item.interventionStatus, item.risk, item.description]
          .filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
        return matchesSearch && (statusFilter === "All" || item.status === statusFilter) && (categoryFilter === "All" || item.category === categoryFilter);
      })
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return sortOrder === "newest" ? bDate - aDate : aDate - bDate;
      });
  }, [incidents, search, statusFilter, categoryFilter, sortOrder]);

  const resolvedCount = incidents.filter((i) => i.status === "Resolved" || i.status === "Completed").length;
  const interventionCount = incidents.filter((i) => ["Refer for Intervention", "Intervention Ready", "Active Intervention"].includes(i.interventionStatus)).length;
  const reviewCount = incidents.filter((i) => ["Pending", "Under Review", "Student Statement Saved"].includes(i.status)).length;
  const completionRate = incidents.length ? Math.round((resolvedCount / incidents.length) * 100) : 0;

  const analyzeStudentHistory = useCallback(async () => {
    if (!incidents.length) {
      setAiAnalysis(null);
      setAiError("There is not enough incident history to generate a student analysis yet.");
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const current = incidents[0];
      const response = await API.post("/api/gemini/student-history-analysis", {
        grade: user?.gradeLevel || user?.grade || "Not specified",
        riskLevel: current?.risk?.replace(/\s*Risk$/i, "") || "Not specified",
        currentIncident: {
          incidentId: current?.id || null,
          reportId: current?.reportId || null,
          title: current?.title || "",
          category: current?.category || "",
          level: current?.risk || "",
          status: current?.status || "",
          studentStatement: current?.studentStatement || "",
          reportDescription: current?.description || "",
          action: current?.action || "",
          date: current?.createdAt || null,
        },
        previousIncidents: incidents.slice(1).map((item) => ({
          incidentId: item.id || null,
          reportId: item.reportId || null,
          title: item.title || "",
          category: item.category || "",
          level: item.risk || "",
          status: item.status || "",
          description: item.description || "",
          studentStatement: item.studentStatement || "",
          action: item.action || "",
          createdAt: item.createdAt || null,
        })),
        incidents: incidents.map((item) => ({
          title: item.title,
          category: item.category,
          risk: item.risk,
          status: item.status,
          interventionStatus: item.interventionStatus,
          description: item.description,
          studentStatement: item.studentStatement,
          action: item.action,
          createdAt: item.createdAt,
        })),
        reports: [],
      });

      const data = response?.data || {};
      const analysis = data?.analysis || data;
      setAiAnalysis({
        summary: analysis?.summary || "No student description was generated.",
        pattern: analysis?.pattern || "No clear pattern was identified from the available records.",
        risk: analysis?.risk || "Not determined",
        prediction: analysis?.prediction || "No warning was generated.",
        notes: analysis?.notes || "",
        interventions: Array.isArray(analysis?.interventions) ? analysis.interventions : [],
      });
    } catch (error) {
      console.error("Student AI analysis error:", error?.response?.data || error);
      setAiAnalysis(null);
      setAiError(error?.response?.data?.message || "Unable to generate the student analysis right now.");
    } finally {
      setAiLoading(false);
    }
  }, [incidents, user]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  const exportHistory = () => {
    const header = ["Date", "Incident", "Category", "Status", "Risk", "Intervention"];
    const rows = filteredIncidents.map((item) => [
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
      item.title, item.category, item.status, item.risk, item.interventionStatus,
    ]);
    const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "guided-incident-history.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const markAllAsRead = async () => {
    try {
      await API.put(`/api/notifications/${userId}/read-all`);
      setNotifications([]);
    } catch {}
  };

  const Nav = ({ icon, label, path, active = false }) => (
    <button
      type="button"
      onClick={() => {
        if (path) navigate(path);
        setMobileMenuOpen(false);
      }}
      className={`group flex items-center gap-3 px-3 py-3 rounded-xl w-full text-sm font-semibold transition ${
        active
          ? darkMode
            ? "bg-green-900/30 text-green-400"
            : "bg-green-50 text-green-700"
          : darkMode
            ? "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
      }`}
    >
      <span
        className={
          active
            ? "text-green-500"
            : darkMode
              ? "text-gray-600 group-hover:text-gray-300"
              : "text-gray-400 group-hover:text-gray-700"
        }
      >
        {icon}
      </span>
      {label}
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
    </button>
  );

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div>
        <div className={`flex items-center ${mobile ? "justify-between" : ""} gap-3 px-3 mb-7`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-green-500/10 blur-md" />
              <img src="/school-logo.webp" alt="School Logo" className="relative w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-xl font-extrabold tracking-tight ${theme.heading}`}>
                Guid<span className="text-green-500">Ed</span>
              </h1>
              <p className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}>
                Student Guidance
              </p>
            </div>
          </div>
          {mobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                darkMode ? "bg-[#101F15] text-gray-400" : "bg-gray-50 text-gray-500"
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

        <p className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Main Menu
        </p>

        <div className="space-y-1">
          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" path="/student-dashboard" />
          <Nav icon={<FileText size={18} />} label="My Reports" path="/my-reports" />
          <Nav icon={<FileClock size={18} />} label="My History" path="/my-history" active />
          <Nav icon={<Plus size={18} />} label="Report an Incident" path="/student-reporting" />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Support
        </p>

        <Nav icon={<BookOpen size={18} />} label="Guidance Resources" path="/guidance-resources" />
        <Nav icon={<HelpCircle size={18} />} label="Get Support" path="/message-admin" />

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          System
        </p>

        <Nav icon={<Settings size={18} />} label="Settings" path="/settings" />
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-green-500/10" : "bg-green-100"}`}>
              {profilePhoto ? (
                <img src={profilePhoto} alt={studentName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-green-500 font-bold">{studentName.charAt(0).toUpperCase()}</span>
              )}
              <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${darkMode ? "border-[#0B1710]" : "border-white"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-extrabold truncate ${theme.heading}`}>{firstName}</p>
              <p className={`text-[11px] truncate ${theme.muted}`}>Student Account</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDarkMode((value) => !value)}
          className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-sm font-semibold ${theme.subtle} ${theme.border} ${theme.body}`}
        >
          <span className="flex items-center gap-3">
            {darkMode ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-slate-500" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
          <span className={`w-9 h-5 rounded-full p-0.5 flex ${darkMode ? "bg-green-500 justify-end" : "bg-gray-200 justify-start"}`}>
            <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border ${theme.border} ${theme.body} hover:text-red-500 hover:border-red-200 transition`}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  const StatusBadge = ({ status }) => {
    const style = getStatusStyle(status);
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${style.bg} ${style.text} ${style.border}`}>
        {style.icon}
        {status}
      </span>
    );
  };

  const HistoryCard = ({ item }) => (
    <article className={`rounded-2xl border overflow-hidden shadow-sm ${theme.card}`}>
      <div className={`h-1 ${getStatusStyle(item.status).accent}`} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>Incident Record</p>
            <h3 className={`text-lg sm:text-xl font-extrabold mt-1 ${theme.heading}`}>{item.title}</h3>
            <div className={`flex items-center gap-2 mt-2 text-sm ${theme.body}`}>
              <CalendarDays size={15} />
              {formatDate(item.createdAt)}
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className={`rounded-xl border p-3 ${theme.subtle} ${theme.border}`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              <span className={`text-[11px] ${theme.muted}`}>Risk Level</span>
            </div>
            <p className={`text-sm font-bold mt-1 ${theme.heading}`}>{item.risk}</p>
          </div>
          <div className={`rounded-xl border p-3 ${theme.subtle} ${theme.border}`}>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-green-500" />
              <span className={`text-[11px] ${theme.muted}`}>Category</span>
            </div>
            <p className={`text-sm font-bold mt-1 truncate ${theme.heading}`}>{item.category}</p>
          </div>
          <div className={`rounded-xl border p-3 ${theme.subtle} ${theme.border}`}>
            <div className="flex items-center gap-2">
              <PlayCircle size={16} className="text-blue-500" />
              <span className={`text-[11px] ${theme.muted}`}>Intervention</span>
            </div>
            <p className={`text-sm font-bold mt-1 ${theme.heading}`}>{item.interventionStatus}</p>
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={() => setSelectedIncident(item)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 py-3 text-sm font-bold hover:bg-green-500/15 transition"
          >
            <Eye size={16} />
            View Incident Details & Intervention
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${theme.page}`}>
      <aside className={`hidden lg:flex w-[250px] xl:w-[270px] border-r flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 flex-shrink-0 ${theme.sidebar} ${theme.border}`}>
        <SidebarContent />
      </aside>

      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          />
          <aside className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] shadow-2xl flex flex-col justify-between px-5 py-5 lg:hidden ${theme.sidebar}`}>
            <SidebarContent mobile />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <header className={`flex-shrink-0 sticky top-0 z-30 backdrop-blur-xl border-b ${darkMode ? "bg-[#07110B]/90 border-[#17251B]" : "bg-[#F7F9F8]/90 border-gray-100"}`}>
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center ${darkMode ? "bg-[#0D1A12] border-[#24392A] text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}
              >
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <div className={`hidden sm:flex items-center gap-2 text-sm mb-1 ${theme.muted}`}>
                  <span>Student Portal</span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">My History</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight truncate ${theme.heading}`}>
                  My History
                </h2>
                <p className={`text-sm mt-1 ${theme.body}`}>
                  Review disciplinary records officially recorded under your student account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={fetchData}
                className={`hidden sm:inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold ${darkMode ? "bg-[#0D1A12] border-[#24392A] text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationOpen((value) => !value)}
                  className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${darkMode ? "bg-[#0D1A12] border-[#24392A] text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}
                >
                  <Bell size={17} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                    <div className={`absolute right-0 mt-3 w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border shadow-2xl overflow-hidden z-50 ${theme.card}`}>
                      <div className={`p-4 border-b flex items-center justify-between ${theme.border}`}>
                        <p className={`font-extrabold ${theme.heading}`}>Notifications</p>
                        <button type="button" onClick={markAllAsRead} className="text-xs font-bold text-green-500">
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className={`p-6 text-center text-sm ${theme.muted}`}>No unread notifications.</p>
                        ) : (
                          notifications.map((item) => (
                            <div key={item._id || item.id} className={`p-4 border-b ${theme.border}`}>
                              <p className={`font-bold text-sm ${theme.heading}`}>{item.title || "Notification"}</p>
                              <p className={`text-sm mt-1 ${theme.body}`}>{item.message || item.body || "You have a new notification."}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10">
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {[
              { label: "Total Records", value: incidents.length, icon: ClipboardList, accent: "text-green-500", bg: "bg-green-500/10" },
              { label: "Under Review", value: reviewCount, icon: Clock3, accent: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Interventions", value: interventionCount, icon: Activity, accent: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Resolved", value: resolvedCount, icon: CheckCircle2, accent: "text-emerald-500", bg: "bg-emerald-500/10" },
            ].map((stat) => { const Icon = stat.icon; return (
              <div key={stat.label} className={`rounded-2xl border p-4 sm:p-5 ${theme.card} ${theme.border}`}>
                <div className="flex items-center justify-between gap-3"><span className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.accent}`}><Icon size={19} /></span><span className={`text-2xl font-extrabold ${theme.heading}`}>{stat.value}</span></div>
                <p className={`text-xs font-semibold mt-3 ${theme.body}`}>{stat.label}</p>
              </div>
            ); })}
          </section>

          <section className={`rounded-2xl border p-4 sm:p-5 mb-5 ${theme.card} ${theme.border}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div><div className="flex items-center gap-2"><Activity size={17} className="text-green-500" /><p className={`font-extrabold ${theme.heading}`}>History Overview</p></div><p className={`text-xs mt-1 ${theme.body}`}>{incidents.length ? `${completionRate}% of your recorded incidents are resolved or completed.` : "Your incident history will appear here when records are available."}</p></div>
              <div className="w-full lg:w-64"><div className="flex items-center justify-between text-[11px] font-bold mb-2"><span className={theme.muted}>Resolution progress</span><span className={theme.heading}>{completionRate}%</span></div><div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-100"}`}><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${completionRate}%` }} /></div></div>
            </div>
          </section>

          <section className={`rounded-2xl border p-5 sm:p-6 mb-5 ${theme.card} ${theme.border}`}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                  <BrainCircuit size={22} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>GuidEd AI</p>
                  <h3 className={`text-xl font-extrabold mt-1 ${theme.heading}`}>Guided AI Analysis</h3>
                  <p className={`text-sm leading-6 mt-2 max-w-2xl ${theme.body}`}>
                    Generate a student-focused description and warning based on the incident history recorded in your account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={analyzeStudentHistory}
                disabled={aiLoading || !incidents.length}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <BrainCircuit size={17} />
                {aiLoading ? "Analyzing..." : "Analyze My History"}
              </button>
            </div>

            {aiError && (
              <div className={`mt-4 rounded-xl border p-3 text-sm ${darkMode ? "border-red-400/20 bg-red-500/10 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                {aiError}
              </div>
            )}

            {aiAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-5">
                <div className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <UserRound size={16} className="text-purple-500" />
                    <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Student Description</p>
                  </div>
                  <p className={`text-sm leading-6 ${theme.body}`}>{aiAnalysis.summary}</p>
                </div>

                <div className={`rounded-2xl border p-4 ${darkMode ? "border-amber-400/20 bg-amber-500/10" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-amber-300" : "text-amber-700"}`}>AI Warning / Attention</p>
                  </div>
                  <p className={`text-sm leading-6 ${darkMode ? "text-amber-100" : "text-amber-900"}`}>{aiAnalysis.prediction}</p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Recorded Pattern</p>
                  <p className={`text-sm leading-6 mt-2 ${theme.body}`}>{aiAnalysis.pattern}</p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Risk Assessment</p>
                  <p className={`text-sm font-extrabold mt-2 ${theme.heading}`}>{aiAnalysis.risk}</p>
                  {aiAnalysis.notes && <p className={`text-sm leading-6 mt-2 ${theme.body}`}>{aiAnalysis.notes}</p>}
                </div>
              </div>
            )}
          </section>

          <section className={`rounded-2xl border p-4 sm:p-5 mb-5 ${theme.card} ${theme.border}`}>
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">
              <div className="relative flex-1 min-w-0"><Search size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.muted}`} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents, categories, statuses..." className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-sm ${theme.subtle} ${theme.border} ${theme.heading}`} /></div>
              <div className="flex flex-wrap gap-2">
                <div className="relative"><SlidersHorizontal size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.muted}`} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`appearance-none pl-9 pr-8 py-3 rounded-xl border text-sm font-semibold outline-none ${theme.subtle} ${theme.border} ${theme.heading}`}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`px-3 py-3 rounded-xl border text-sm font-semibold outline-none ${theme.subtle} ${theme.border} ${theme.heading}`}>{categories.map((option) => <option key={option}>{option}</option>)}</select>
                <button type="button" onClick={() => setSortOrder((v) => v === "newest" ? "oldest" : "newest")} className={`inline-flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold ${theme.subtle} ${theme.border} ${theme.body}`}><ArrowUpDown size={15} />{sortOrder === "newest" ? "Newest" : "Oldest"}</button>
                <button type="button" onClick={exportHistory} disabled={!filteredIncidents.length} className="inline-flex items-center gap-2 px-3 py-3 rounded-xl bg-green-500 text-white text-sm font-bold disabled:opacity-40"><Download size={15} />Export</button>
              </div>
            </div>
            {(search || statusFilter !== "All" || categoryFilter !== "All") && <div className={`flex items-center justify-between gap-3 mt-3 pt-3 border-t ${theme.border}`}><span className={`text-xs ${theme.muted}`}>Showing {filteredIncidents.length} of {incidents.length} records</span><button type="button" onClick={clearFilters} className="text-xs font-bold text-green-500">Clear filters</button></div>}
          </section>

          <div className="max-w-6xl mx-auto">
            <section className={`rounded-[26px] border shadow-sm p-5 sm:p-6 ${theme.card}`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                      <FileClock size={22} />
                    </div>
                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>Student Record</p>
                      <h3 className={`text-xl sm:text-2xl font-extrabold ${theme.heading}`}>Incident History</h3>
                    </div>
                  </div>
                  <p className={`mt-3 text-sm leading-6 max-w-2xl ${theme.body}`}>
                    This page shows disciplinary incidents officially recorded under your account. Select a record to review its current intervention status.
                  </p>
                </div>

                <div className={`grid grid-cols-3 rounded-2xl border overflow-hidden ${theme.border}`}>
                  <div className={`px-4 py-3 text-center ${theme.subtle}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>Total</p>
                    <p className={`text-xl font-extrabold mt-1 ${theme.heading}`}>{incidents.length}</p>
                  </div>
                  <div className={`px-4 py-3 text-center border-x ${theme.border} ${theme.subtle}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>Resolved</p>
                    <p className="text-xl font-extrabold mt-1 text-green-500">{resolvedCount}</p>
                  </div>
                  <div className={`px-4 py-3 text-center ${theme.subtle}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>Review</p>
                    <p className="text-xl font-extrabold mt-1 text-amber-500">{reviewCount}</p>
                  </div>
                </div>
              </div>

            </section>

            <div className="mt-7">
              {loading ? (
                <div className={`rounded-2xl border p-12 text-center ${theme.card} ${theme.border}`}>
                  <RefreshCw size={25} className="mx-auto animate-spin text-green-500" />
                  <p className={`mt-4 font-bold ${theme.heading}`}>Loading your incident history...</p>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className={`rounded-[26px] border p-10 sm:p-14 text-center ${theme.card} ${theme.border}`}>
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <FileClock size={35} />
                  </div>
                  <h3 className={`text-2xl font-extrabold mt-5 ${theme.heading}`}>
                    {search ? "No matching records" : "No Incident Records"}
                  </h3>
                  <p className={`max-w-lg mx-auto text-sm leading-6 mt-2 ${theme.body}`}>
                    {search
                      ? "Try a different search term."
                      : "You currently have no disciplinary incidents officially recorded under your student account."}
                  </p>
                  {!search && (
                    <div className={`mt-6 max-w-xl mx-auto rounded-2xl border p-4 flex items-start gap-3 text-left ${theme.subtle} ${theme.border}`}>
                      <ShieldCheck size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <p className={`text-xs leading-5 ${theme.body}`}>
                        Your history only displays records associated with your logged-in student account.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end justify-between px-1">
                    <div>
                      <h3 className={`text-xl font-extrabold ${theme.heading}`}>Incident Records</h3>
                      <p className={`text-sm mt-1 ${theme.body}`}>Your recorded disciplinary history</p>
                    </div>
                    <span className={`text-xs font-semibold ${theme.muted}`}>
                      {filteredIncidents.length} {filteredIncidents.length === 1 ? "record" : "records"}
                    </span>
                  </div>

                  {filteredIncidents.map((item) => (
                    <HistoryCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedIncident && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            onClick={() => setSelectedIncident(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className={`relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-[28px] border shadow-2xl ${theme.card} ${theme.border}`}>
              <div className={`sticky top-0 z-10 px-5 sm:px-7 py-5 border-b backdrop-blur-xl ${theme.border} ${darkMode ? "bg-[#0D1A12]/95" : "bg-white/95"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>Incident Details</p>
                    <h3 className={`text-xl sm:text-2xl font-extrabold mt-1 ${theme.heading}`}>{selectedIncident.title}</h3>
                    <p className={`text-sm mt-1 ${theme.body}`}>{formatDate(selectedIncident.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(null)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${theme.subtle} ${theme.border} ${theme.body}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-7 space-y-5">
                <div className={`rounded-2xl border p-5 ${theme.subtle} ${theme.border}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Record Status</p>
                      <div className="mt-2">
                        <StatusBadge status={selectedIncident.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Risk Level</p>
                      <p className={`text-sm font-extrabold mt-2 ${theme.heading}`}>{selectedIncident.risk}</p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Record Information</p>
                      <p className={`text-sm mt-1 ${theme.body}`}>Details shown here come directly from the incident record returned by the system.</p>
                    </div>
                    <FileClock size={20} className="text-green-500 flex-shrink-0" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <div>
                      <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Category</p>
                      <p className={`text-sm font-semibold mt-1 ${theme.heading}`}>{selectedIncident.category}</p>
                    </div>
                    <div>
                      <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Risk Level</p>
                      <p className={`text-sm font-semibold mt-1 ${theme.heading}`}>{selectedIncident.risk}</p>
                    </div>
                    {selectedIncident.description && (
                      <div className="sm:col-span-2">
                        <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Description</p>
                        <p className={`text-sm leading-6 mt-1 ${theme.body}`}>{selectedIncident.description}</p>
                      </div>
                    )}
                    {selectedIncident.studentStatement && (
                      <div className="sm:col-span-2">
                        <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Student Statement</p>
                        <p className={`text-sm leading-6 mt-1 ${theme.body}`}>{selectedIncident.studentStatement}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(() => {
                  const interventionDetails = getInterventionDetails(selectedIncident);

                  return (
                    <>
                      <div className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Intervention</p>
                            <p className={`text-sm mt-1 ${theme.body}`}>Current intervention information for this incident.</p>
                          </div>
                          <ShieldCheck size={20} className="text-blue-500" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                          <div>
                            <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Intervention Status</p>
                            <p className={`text-sm font-semibold mt-1 ${theme.body}`}>{interventionDetails.status || "Not started"}</p>
                          </div>
                          <div>
                            <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Intervention Type</p>
                            <p className={`text-sm font-semibold mt-1 ${theme.body}`}>{interventionDetails.type || "Not specified"}</p>
                          </div>
                          <div>
                            <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Assigned / Scheduled</p>
                            <p className={`text-sm font-semibold mt-1 ${theme.body}`}>{interventionDetails.interventionBy || interventionDetails.createdAt || "Not specified"}</p>
                          </div>
                          <div>
                            <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Approved By</p>
                            <p className={`text-sm font-semibold mt-1 ${theme.body}`}>{interventionDetails.approvedBy || "Not specified"}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Intervention Description</p>
                            <p className={`text-sm mt-1 ${theme.body}`}>{interventionDetails.description || "No intervention description available."}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>Completed By</p>
                            <p className={`text-sm font-semibold mt-1 ${theme.body}`}>{interventionDetails.completedBy || "Not completed"}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                    <div className="flex items-center gap-2">
                      <Tag size={17} className="text-green-500" />
                      <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Category</p>
                    </div>
                    <p className={`font-bold mt-2 ${theme.heading}`}>{selectedIncident.category}</p>
                  </div>
                  <div className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={17} className="text-green-500" />
                      <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Recorded Date</p>
                    </div>
                    <p className={`font-bold mt-2 ${theme.heading}`}>{formatDate(selectedIncident.createdAt)}</p>
                  </div>
                </div>

                {(selectedIncident.description || selectedIncident.details || selectedIncident.studentStatement || selectedIncident.action) && (
                  <div className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                    <h4 className={`font-extrabold ${theme.heading}`}>Record Information</h4>
                    <div className="mt-4 space-y-4">
                      {selectedIncident.description && (
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Description</p>
                          <p className={`text-sm leading-6 mt-1 ${theme.body}`}>{selectedIncident.description}</p>
                        </div>
                      )}
                      {selectedIncident.studentStatement && (
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Student Statement</p>
                          <p className={`text-sm leading-6 mt-1 ${theme.body}`}>{selectedIncident.studentStatement}</p>
                        </div>
                      )}
                      {selectedIncident.action && (
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Action Recorded</p>
                          <p className={`text-sm leading-6 mt-1 ${theme.body}`}>{selectedIncident.action}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={`rounded-2xl border p-4 flex items-start gap-3 ${theme.subtle} ${theme.border}`}>
                  <ShieldCheck size={19} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs leading-5 ${theme.body}`}>
                    This information is displayed from the incident record associated with your student account. Intervention status reflects the available status fields returned by the GuidEd system.
                  </p>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHistory;
