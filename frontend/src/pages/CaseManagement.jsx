import { useState, useMemo, useEffect, memo } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Brain,
  X,
  Image as ImageIcon,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageSquare,
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Bell,
  Sparkles,
  BriefcaseBusiness,
  HandHelping,
  Clock3,
  User2,
  FileText,
  Calendar,
  ChevronRight,
  CircleCheck,
  CircleDot,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  SlidersHorizontal,
  Activity,
  LogOut,
  Printer,
  Menu,
  Moon,
  Sun,
  Database,
  ShieldCheck,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import CasePrintableReport from "../components/reports/CasePrintableReport";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const MIN_TEXT_LENGTH = 10;

const Nav = ({ icon, label, onClick, active, darkMode }) => (
  <button
    onClick={onClick}
    className={`
      group flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-[15px] transition
      ${
        active
          ? darkMode
            ? "bg-emerald-950/50 text-emerald-300 font-semibold"
            : "bg-green-50 text-green-700 font-semibold"
          : darkMode
            ? "text-slate-400 hover:bg-[#101F17] hover:text-slate-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <span
      className={`transition ${
        active
          ? darkMode
            ? "text-emerald-300"
            : "text-green-600"
          : darkMode
            ? "text-slate-500 group-hover:text-slate-200"
            : "text-gray-400 group-hover:text-gray-700"
      }`}
    >
      {icon}
    </span>
    {label}
    {active && (
      <span className={`ml-auto w-1.5 h-1.5 rounded-full ${darkMode ? "bg-emerald-400" : "bg-green-600"}`} />
    )}
  </button>
);

const StatusBadge = memo(({ status }) => {
  const config = {
    received: {
      label: "Received",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },

    "saved-student-statement": {
      label: "Statement Saved",
      className: "bg-purple-50 text-purple-700 border-purple-200",
      dot: "bg-purple-500",
    },

    reviewing: {
      label: "Reviewing",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },

    "refer-for-intervention": {
      label: "For Intervention",
      className: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    },

    "intervention-ready": {
      label: "Intervention Ready",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },

    completed: {
      label: "Completed",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
      dot: "bg-indigo-500",
    },
  };

  const item = config[status] || config.received;

  return (
    <span
      className={`
        inline-flex items-center gap-2
        px-2.5 py-1.5
        rounded-full
        border
        text-[10px]
        font-bold
        whitespace-nowrap
        ${item.className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
});

const RiskBadge = memo(({ risk }) => {
  const config = {
    HIGH: {
      label: "High Risk",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <ShieldAlert size={12} />,
    },

    MEDIUM: {
      label: "Medium Risk",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertTriangle size={12} />,
    },

    LOW: {
      label: "Low Risk",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle size={12} />,
    },
  };

  const item = config[risk] || config.LOW;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1.5
        rounded-full
        border
        text-[10px]
        font-bold
        whitespace-nowrap
        ${item.className}
      `}
    >
      {item.icon}
      {item.label}
    </span>
  );
});

const InfoBlock = memo(({ icon, label, value }) => (
  <div
    className="
      bg-white
      border border-gray-100
      rounded-2xl
      p-4
      shadow-sm
      hover:shadow-md
      transition-all duration-200
    "
  >
    <div className="flex items-center gap-2 mb-2.5">
      <div
        className="
          w-8 h-8
          rounded-xl
          bg-green-50
          text-green-700
          flex items-center justify-center
          flex-shrink-0
        "
      >
        {icon}
      </div>

      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">
        {label}
      </p>
    </div>

    <p className="text-[15px] font-semibold text-gray-800 break-words">
      {value || "N/A"}
    </p>
  </div>
));

const StatCard = memo(
  ({
    icon,
    label,
    value,
    description,
    iconClass = "bg-green-50 text-green-700",
    darkMode = false,
  }) => (
    <motion.div
      whileHover={{ y: -3 }}
      className={`
        relative
        overflow-hidden
        border
        rounded-2xl
        sm:rounded-3xl
        p-4
        sm:p-5
        transition-all duration-200
        ${
          darkMode
            ? "bg-[#0C1913] border-emerald-950/50 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            : "bg-white border-gray-100 shadow-sm hover:shadow-md"
        }
      `}
    >
      <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-green-500/5 blur-2xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`
              text-[10px]
              sm:text-[13px]
              font-semibold
              uppercase
              tracking-wider
              truncate
              ${darkMode ? "text-slate-500" : "text-gray-400"}
            `}
          >
            {label}
          </p>

          <p
            className={`
              text-2xl
              sm:text-3xl
              font-extrabold
              tracking-tight
              mt-2
              sm:mt-3
              ${darkMode ? "text-slate-100" : "text-gray-900"}
            `}
          >
            {value}
          </p>

          {description && (
            <p
              className={`text-[10px] mt-1 truncate ${
                darkMode ? "text-slate-500" : "text-gray-400"
              }`}
            >
              {description}
            </p>
          )}
        </div>

        <div
          className={`
            w-10 h-10
            rounded-xl
            flex items-center justify-center
            flex-shrink-0
            ${iconClass}
          `}
        >
          {icon}
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-5 right-5 h-px rounded-full ${
          darkMode ? "bg-emerald-500/20" : "bg-green-500/10"
        }`}
      />
    </motion.div>
  ),
);

const offenseMap = {
  MINOR: [
    "dress code violation",
    "improper uniform",
    "improper haircut",
    "unauthorized hair color",
    "wearing earrings",
    "use of cosmetics/nail polish",
    "unnecessary talking",
    "shouting",
    "howling",
    "eating inside classroom",
    "extreme quarrels",
    "minor classroom disruption",
    "use of impolite words",
    "cursing",
    "teasing",
    "name calling",
    "habitual absences",
    "unnecessary use of chat box",
    "unresponsive during online classes",
    "leaving online conference without permission",
    "turning off camera without valid reason",
    "improper camera visibility",
    "habitual tardiness",
    "inappropriate profile picture/background",
    "unsigned school correspondence",
    "late submission of reply slips",
    "non-submission of reply slips",
    "failure to submit excuse letter",
    "loss of violation report",
    "littering",
    "violation of library rules",
    "failure to return borrowed materials",
    "not wearing school id",
    "playing cards",
    "rough play",
    "horseplaying",
    "refusal to replace damaged property",
    "using cellphone during examination",
    "failure to present school id",
    "tampering school id",
    "tampering library card",
    "loitering",
    "lending school id",
    "using someone else's id",
    "locker policy violation",
    "eating in restricted areas",
    "unauthorized gadgets",
    "unauthorized cellphone use",
  ],

  MAJOR: [
    "sharing account credentials",
    "piracy",
    "unauthorized downloading",
    "posting screenshots without consent",
    "defamation",
    "slander",
    "recording without consent",
    "cyberbullying",
    "cyber baiting",
    "unauthorized transactions",
    "viewing pornographic materials",
    "selling without approval",
    "spreading fake news",
    "harassment",
    "threatening messages",
    "using portal for gambling",
    "petty theft",
    "stealing",
    "assault",
    "abusive behavior",
    "forgery",
    "cheating",
    "plagiarism",
    "academic dishonesty",
    "vandalism",
    "destroying school property",
    "tampering school records",
    "gambling",
    "unauthorized use of school equipment",
    "instigating a fight",
    "possession of liquor",
    "possession of cigarettes",
    "possession of vape",
    "possession of deadly weapon",
    "fighting",
    "physical injury",
    "physical assault",
    "drug possession",
    "drug selling",
    "hazing",
    "voyeurism",
  ],
};

const normalize = (str = "") => str.toLowerCase().trim();

const findMatch = (text, list = []) =>
  list.find((item) => text.includes(normalize(item)));

const classifyCase = (c = {}) => {
  const text = normalize(
    [c.offense, c.category, c.title, c.description].filter(Boolean).join(" "),
  );

  const matchedMajor = findMatch(text, offenseMap.MAJOR);
  const matchedMinor = findMatch(text, offenseMap.MINOR);

  const criticalKeywords = [
    "drug",
    "weapon",
    "assault",
    "physical injury",
    "physical assault",
    "hazing",
    "voyeurism",
    "fighting",
    "threatening",
  ];

  const isCritical = criticalKeywords.some((k) => text.includes(normalize(k)));

  if (matchedMajor && isCritical) {
    return {
      risk: "HIGH",
      severity: "CRITICAL MAJOR OFFENSE",
      insight: `Critical violation detected (${matchedMajor}). Immediate intervention recommended.`,
    };
  }

  if (matchedMajor) {
    return {
      risk: "MEDIUM",
      severity: "MAJOR OFFENSE",
      insight: `Major offense detected (${matchedMajor}). Guidance review and escalation may be required.`,
    };
  }

  if (matchedMinor) {
    return {
      risk: "LOW",
      severity: "MINOR OFFENSE",
      insight: `Minor offense detected (${matchedMinor}). Monitor student behavior and apply corrective action.`,
    };
  }

  return {
    risk: "LOW",
    severity: "UNCLASSIFIED",
    insight: "No direct policy match found. Manual review recommended.",
  };
};

const flow = [
  "received",
  "saved-student-statement",
  "reviewing",
  "refer-for-intervention",
  "intervention-ready",
];

const statusUI = {
  received: "from-blue-400 to-cyan-400",
  reviewing: "from-amber-400 to-orange-400",
  "saved-student-statement": "from-purple-400 to-indigo-400",
  "refer-for-intervention": "from-red-400 to-pink-400",
  "intervention-ready": "from-green-400 to-emerald-400",
};

const normalizeCase = (c) => {
  let evidence = [];

  try {
    if (Array.isArray(c.evidence)) {
      evidence = c.evidence
        .map((e) => {
          if (e && typeof e === "object" && e.url) {
            return e;
          }

          if (typeof e === "string") {
            const urlMatch = e.match(/https?:\/\/[^\s'"}]+/);

            return {
              url: urlMatch?.[0],
              type: urlMatch?.[0]?.includes("video") ? "video" : "image",
            };
          }

          return null;
        })
        .filter(Boolean);
    }
  } catch {
    evidence = [];
  }

  return {
    ...c,

    reportId: c.reportId?._id || c.reportId || null,

    offense:
      c.offense ||
      c.reportId?.offense ||
      c.report?.offense ||
      c.title ||
      "Unknown Offense",

    category: c.category || c.reportId?.category || c.report?.category || "",

    title: c.title || c.reportId?.title || c.report?.title || "",

    description:
      c.description || c.reportId?.description || c.report?.description || "",

    date: c.date || c.reportId?.date || c.report?.date || null,

    time: c.time || c.reportId?.time || c.report?.time || null,

    studentStatement: c.studentStatement || c.statement || "",

    level: c.level || "",

    student: c.studentId
      ? {
          name: `${c.studentId.firstName || ""} ${
            c.studentId.lastName || ""
          }`.trim(),
          avatar: c.studentId.profilePhoto,
          grade: c.studentId.grade,
          section: c.studentId.section,
          studentId: c.studentId.studentId,
          _id: c.studentId._id,
        }
      : c.student || {},

    status: c.status || "received",

    logs: c.caseLogs || c.logs || [],

    evidence,

    location:
      c.location ||
      c.reportId?.location ||
      c.report?.location ||
      "Unknown location",

    reporter:
      c.reporter ||
      c.reportId?.reporterId?.name ||
      c.report?.reporterId?.name ||
      "Anonymous",
  };
};

const normalizeEvidenceUrl = (url) => {
  if (!url) return null;

  if (url.includes("cloudinary")) return url;

  if (url.startsWith("/uploads")) {
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`;
  }

  return url;
};

const CaseCard = memo(({ caseData, onClick, darkMode = false, compact = false }) => {
  const ai = classifyCase(caseData);
  const student = caseData.student || {};
  const status = caseData.status || "received";
  const progress = ((Math.max(flow.indexOf(status), 0) + 1) / flow.length) * 100;
  const latestLog = [...(caseData.logs || caseData.caseLogs || [])].sort(
    (a, b) => new Date(b.time) - new Date(a.time),
  )[0];

  const riskShell =
    ai.risk === "HIGH"
      ? darkMode
        ? "border-red-900/50 bg-red-950/10"
        : "border-red-100 bg-red-50/30"
      : ai.risk === "MEDIUM"
        ? darkMode
          ? "border-amber-900/50 bg-amber-950/10"
          : "border-amber-100 bg-amber-50/30"
        : darkMode
          ? "border-emerald-900/50 bg-emerald-950/10"
          : "border-emerald-100 bg-emerald-50/20";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`
        group relative overflow-hidden border ${compact ? "rounded-2xl" : "rounded-[26px]"}
        ${riskShell}
        ${darkMode ? "shadow-[0_16px_45px_rgba(0,0,0,.18)]" : "shadow-[0_12px_35px_rgba(15,23,42,.06)]"}
        hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,.10)]
        transition-all duration-200
      `}
    >
      <button type="button" onClick={onClick} className={`w-full text-left ${compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={student.avatar || DEFAULT_AVATAR}
                alt={student.name || "Student"}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md"
              />
              <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-[16px] font-extrabold truncate ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                {student.name || "Unknown Student"}
              </p>
              <p className={`text-[12px] mt-1 truncate ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                {student.studentId || "No student ID"}
                {student.grade ? ` • ${student.grade}` : ""}
                {student.section ? ` • ${student.section}` : ""}
              </p>
            </div>
          </div>
          <ChevronRight size={17} className={darkMode ? "text-slate-600" : "text-gray-300"} />
        </div>

        <div className={`${compact ? "mt-3 rounded-xl p-3" : "mt-5 rounded-2xl p-4"} border ${darkMode ? "bg-[#0A1711]/80 border-emerald-950/60" : "bg-white/80 border-white"}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[11px] uppercase tracking-[.16em] font-bold ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
              Current incident
            </span>
            <RiskBadge risk={ai.risk} />
          </div>
          <h3 className={`mt-2 text-[17px] sm:text-[18px] font-extrabold leading-snug line-clamp-2 ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
            {caseData.offense}
          </h3>
          <p className={`mt-2 text-[13px] line-clamp-2 leading-relaxed ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
            {caseData.description || ai.insight}
          </p>
        </div>

        <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-3" : "mt-4"}`}>
          <StatusBadge status={status} />
          {caseData.category && (
            <span className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border ${darkMode ? "bg-white/5 border-white/10 text-slate-400" : "bg-white border-gray-100 text-gray-500"}`}>
              {caseData.category}
            </span>
          )}
        </div>

        <div className={compact ? "mt-3" : "mt-5"}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] uppercase tracking-wider font-bold ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                Workflow
              </span>
              <span className={`text-[11px] font-bold ${darkMode ? "text-emerald-400" : "text-green-600"}`}>
                {Math.round(progress)}%
              </span>
            </div>
            <span className={`text-[11px] ${darkMode ? "text-slate-600" : "text-gray-400"}`}>
              {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date"}
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
            <div
              className={`h-full rounded-full bg-gradient-to-r ${statusUI[status] || statusUI.received}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-2 ${compact ? "mt-3 pt-3" : "mt-4 pt-4"} border-t ${darkMode ? "border-emerald-950/50" : "border-gray-100"}`}>
          <div className={`rounded-xl px-3 py-2.5 ${darkMode ? "bg-white/[.03]" : "bg-gray-50/80"}`}>
            <p className={`text-[10px] uppercase tracking-wider font-bold ${darkMode ? "text-slate-600" : "text-gray-400"}`}>Location</p>
            <p className={`text-[12px] font-semibold truncate mt-1 ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
              {caseData.location || "Unknown"}
            </p>
          </div>
          <div className={`rounded-xl px-3 py-2.5 ${darkMode ? "bg-white/[.03]" : "bg-gray-50/80"}`}>
            <p className={`text-[8px] uppercase tracking-wider font-bold ${darkMode ? "text-slate-600" : "text-gray-400"}`}>Latest activity</p>
            <p className={`text-[12px] font-semibold truncate mt-1 ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
              {latestLog?.changedByName || "No activity"}
            </p>
          </div>
        </div>
      </button>

      <div className={`${compact ? "px-3 sm:px-3.5 pb-3" : "px-4 sm:px-5 pb-4"} flex items-center justify-between gap-3 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
        <span className="text-[11px]">Click to open case workspace</span>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${darkMode ? "text-emerald-400" : "text-green-600"}`}>
          <Eye size={11} /> Open case
        </span>
      </div>
    </motion.article>
  );
});

const ThemeToggle = ({ darkMode, setDarkMode }) => (
  <button onClick={() => setDarkMode((current) => !current)} className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-[15px] font-semibold transition ${darkMode ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]" : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"}`}>
    <div className="flex items-center gap-3">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${darkMode ? "bg-amber-950/40 text-amber-300" : "bg-white text-slate-500"}`}>
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      </span>
      {darkMode ? "Light mode" : "Dark mode"}
    </div>
    <span className={`relative w-9 h-5 rounded-full transition ${darkMode ? "bg-green-600" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition ${darkMode ? "left-[18px] bg-black" : "left-0.5 bg-white"}`} />
    </span>
  </button>
);

export default function CaseManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Admin";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  /* =====================================================
     THEME
  ===================================================== */

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("guided-theme");
      if (savedTheme === "dark") return true;
      if (savedTheme === "light") return false;
      return false;
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [caseViewMode, setCaseViewMode] = useState("cards");

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}

    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const pageBg = darkMode ? "bg-[#07110D]" : "bg-[#F5F8F6]";
  const textPrimary = darkMode ? "text-slate-100" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-400" : "text-slate-500";
  const textMuted = darkMode ? "text-slate-500" : "text-gray-400";

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [showCasePrintableReport, setShowCasePrintableReport] = useState(false);
  const [note, setNote] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("newest");

  const [involvedPersons, setInvolvedPersons] = useState("");
  const [additionalParticipants, setAdditionalParticipants] = useState("");
  const [approvalDetails, setApprovalDetails] = useState("");

  // =====================================================
  // GEMINI AI STATE
  // =====================================================

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const getStatus = (c) => c?.status || "received";

  const canReview = (c) => getStatus(c) === "saved-student-statement";

  const canEscalate = (c) => getStatus(c) === "reviewing";

  const canIntervene = (c) => getStatus(c) === "refer-for-intervention";

  const actionLabels = {
    received: "Case Created",
    reviewing: "Reviewed Case",
    waiting_for_student: "Student Statement Requested",
    "saved-student-statement": "Saved Student Statement",
    "refer-for-intervention": "Refer for Intervention",
    "intervention-ready": "Deemed Intervention Ready",
    completed: "Case Completed",
  };

  const actionColors = {
    received: "text-gray-600 bg-gray-50 border-gray-200",
    reviewing: "text-amber-700 bg-amber-50 border-amber-200",
    waiting_for_student: "text-blue-700 bg-blue-50 border-blue-200",
    "refer-for-intervention": "text-red-700 bg-red-50 border-red-200",
    "intervention-ready": "text-green-700 bg-green-50 border-green-200",
    completed: "text-purple-700 bg-purple-50 border-purple-200",
  };

  const getLatestLog = (logs = []) =>
    [...logs].sort((a, b) => new Date(b.time) - new Date(a.time))[0];

  const lastLog = getLatestLog(selected?.caseLogs || selected?.logs);

  const action = lastLog
    ? {
        text: `${actionLabels[lastLog.stage] || lastLog.stage} by ${
          lastLog.changedByName || "N/A"
        }`,
        color: actionColors[lastLog.stage] || actionColors.received,
      }
    : {
        text: "No Actions Yet",
        color: actionColors.received,
      };

  const loggedInUser =
    JSON.parse(localStorage.getItem("user"))?.name || adminName || "Admin";

  // =====================================================
  // GEMINI AI ANALYSIS
  // =====================================================

  const runGeminiAnalysis = async (caseData) => {
    if (!caseData?._id) return;

    try {
      setAiLoading(true);
      setAiError("");
      setAiAnalysis(null);

      const studentId =
        caseData.studentId?._id ||
        caseData.studentId ||
        caseData.student?._id ||
        caseData.student?._id;

      // =================================================
      // CURRENT INCIDENT
      // THIS IS THE PRIMARY AI CONTEXT
      // =================================================

      const currentIncident = {
        incidentId: caseData._id,

        reportId: caseData.reportId?._id || caseData.reportId || null,

        title: caseData.title || caseData.offense || "Unknown offense",

        offense: caseData.offense || caseData.title || "Unknown offense",

        category: caseData.category || "Uncategorized",

        level:
          caseData.level || classifyCase(caseData)?.severity || "Unclassified",

        status: caseData.status || "received",

        studentStatement: caseData.studentStatement || caseData.statement || "",

        description: caseData.description || "",

        location: caseData.location || "",

        date: caseData.date || caseData.createdAt || null,

        time: caseData.time || null,

        evidence: Array.isArray(caseData.evidence) ? caseData.evidence : [],

        reporter: caseData.reporter || "Anonymous",

        createdAt: caseData.createdAt || null,
      };

      // =================================================
      // PREVIOUS INCIDENTS
      // SECONDARY CONTEXT ONLY
      // =================================================

      const previousIncidents = cases
        .filter((incident) => {
          if (String(incident._id) === String(caseData._id)) {
            return false;
          }

          const incidentStudentId =
            incident.studentId?._id ||
            incident.studentId ||
            incident.student?._id ||
            incident.student?.studentId ||
            "";

          return String(incidentStudentId) === String(studentId || "");
        })
        .map((incident) => ({
          incidentId: incident._id,

          title: incident.title || incident.offense || "Unknown offense",

          offense: incident.offense || incident.title || "Unknown offense",

          category: incident.category || "Uncategorized",

          level: incident.level || "Unclassified",

          status: incident.status || "received",

          studentStatement:
            incident.studentStatement || incident.statement || "",

          description: incident.description || "",

          location: incident.location || "",

          createdAt: incident.createdAt || null,
        }));

      const timeline = [
        {
          type: "current-incident",
          ...currentIncident,
        },

        ...previousIncidents.map((incident) => ({
          type: "previous-incident",
          ...incident,
        })),
      ];

      const incidents = [currentIncident, ...previousIncidents];

      // =================================================
      // REPORT CONTEXT
      // =================================================

      const reports = [
        {
          reportId: caseData.reportId?._id || caseData.reportId || null,

          offense: caseData.offense || "",

          category: caseData.category || "",

          description: caseData.description || "",

          location: caseData.location || "",

          date: caseData.date || caseData.createdAt || null,

          time: caseData.time || null,

          status: caseData.status || "",

          isCurrentIncident: true,
        },

        ...previousIncidents.map((incident) => ({
          reportId: incident.reportId || null,

          offense: incident.offense || "",

          category: incident.category || "",

          description: incident.description || "",

          location: incident.location || "",

          date: incident.createdAt || null,

          status: incident.status || "",

          isCurrentIncident: false,
        })),
      ];

      // =================================================
      // LOCAL RISK CLASSIFICATION
      // =================================================

      const localClassification = classifyCase(caseData);

      const riskLevel =
        localClassification?.risk === "HIGH"
          ? "High"
          : localClassification?.risk === "MEDIUM"
            ? "Medium"
            : "Low";

      // =================================================
      // GEMINI REQUEST
      // =================================================

      const response = await API.post(
        "/api/gemini/student-analysis",
        {
          currentIncident,

          previousIncidents,

          grade: caseData.student?.grade || "N/A",

          riskLevel,

          timeline,

          incidents,

          reports,

          recommendationInstructions: `
The currentIncident object represents the incident
currently being reviewed by the guidance administrator.

IMPORTANT:

The CURRENT INCIDENT is the PRIMARY CONTEXT.

The AI analysis must focus primarily on the facts
and circumstances of the current incident.

Evaluate the current incident's:

- offense
- title
- category
- severity or level
- status
- incident description
- student statement
- location
- date and time
- evidence

Previous incidents are SECONDARY CONTEXT ONLY.

Previous incidents may be used to understand
behavioral history or recurring patterns, but they
must NOT automatically determine the analysis of
the current incident.

Do NOT recommend a harsher response merely because
the student has previous incidents.

Do NOT allow an old incident to override the facts
of the current incident.

The analysis should answer:

"What does the available evidence indicate about
THIS CURRENT INCIDENT?"

Provide:

1. A clear summary of the current incident.
2. An assessment of the behavioral pattern, if enough
   information is available.
3. An assessment of the student's current risk level.
4. A prediction or possible behavioral concern when
   supported by the available information.
5. A guidance recommendation based primarily on the
   current incident.
6. Supporting research references when available.

Do NOT provide a fixed intervention conclusion such as
Warning, Call a Parent, Community Service, or Suspension.

This page is CASE MANAGEMENT only.

The actual intervention decision will be handled
separately by the Intervention Management module.

Do not invent facts that are not present in the
provided incident information.
          `,
        },
        {
          timeout: 90000,
        },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Gemini analysis failed.");
      }

      const analysis = response.data;

      const firstIntervention = Array.isArray(analysis.interventions)
        ? analysis.interventions[0]
        : null;

      setAiAnalysis({
        ...analysis,

        recommendation:
          firstIntervention?.recommendation ||
          analysis.recommendation ||
          "No specific recommendation was generated.",

        basis:
          firstIntervention?.basis ||
          analysis.notes ||
          "Analysis generated from the current incident and available supporting records.",

        references: Array.isArray(firstIntervention?.references)
          ? firstIntervention.references
          : Array.isArray(analysis.researchReferences)
            ? analysis.researchReferences
            : [],

        referenceIds: Array.isArray(firstIntervention?.referenceIds)
          ? firstIntervention.referenceIds
          : [],

        summary: analysis.summary || "",

        pattern: analysis.pattern || "",

        prediction: analysis.prediction || "",

        risk: analysis.risk || riskLevel,

        notes: analysis.notes || "",
      });
    } catch (error) {
      console.error(
        "Gemini case analysis failed:",
        error?.response?.data || error,
      );

      setAiError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to generate AI analysis.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const close = () => {
    setSelected(null);
    setNote("");
    setStudentInput("");
    setRequestSent(false);
    setInvolvedPersons("");
    setAdditionalParticipants("");
    setApprovalDetails("");
    setPreviewImage(null);

    // Reset Gemini state
    setAiAnalysis(null);
    setAiError("");
    setAiLoading(false);
  };

  // =====================================================
  // ESCAPE KEY
  // =====================================================

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          close();
        }
      }
    };

    window.addEventListener("keydown", esc);

    return () => window.removeEventListener("keydown", esc);
  }, [previewImage]);

  // =====================================================
  // FETCH CASES
  // =====================================================

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);

        const res = await API.get("/api/incidents");

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.incidents || [];

        setCases(data.map(normalizeCase));
      } catch (err) {
        console.error("Failed to fetch cases:", err);

        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  // =====================================================
  // SOCKET EVENTS
  // =====================================================

  useEffect(() => {
    const handleUpdated = (updatedCase) => {
      const norm = normalizeCase(updatedCase);

      setCases((prev) => prev.map((c) => (c._id === norm._id ? norm : c)));

      setSelected((prev) => (prev && prev._id === norm._id ? norm : prev));
    };

    const handleCreated = (newCase) => {
      setCases((prev) => [normalizeCase(newCase), ...prev]);
    };

    const handleLogAdded = ({ caseId, log }) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c._id !== caseId) return c;

          const existingLogs = c.logs || [];

          const alreadyExists = existingLogs.some(
            (existing) =>
              existing._id === log._id ||
              (existing.stage === log.stage &&
                existing.time === log.time &&
                existing.note === log.note),
          );

          if (alreadyExists) {
            return c;
          }

          return {
            ...c,
            logs: [...existingLogs, log],
          };
        }),
      );

      setSelected((prev) => {
        if (!prev || prev._id !== caseId) return prev;

        const existingLogs = prev.logs || [];

        const alreadyExists = existingLogs.some(
          (existing) =>
            existing._id === log._id ||
            (existing.stage === log.stage &&
              existing.time === log.time &&
              existing.note === log.note),
        );

        if (alreadyExists) {
          return prev;
        }

        return {
          ...prev,
          logs: [...existingLogs, log],
        };
      });
    };

    socket.on("caseUpdated", handleUpdated);

    socket.on("caseCreated", handleCreated);

    socket.on("caseLogAdded", handleLogAdded);

    return () => {
      socket.off("caseUpdated", handleUpdated);

      socket.off("caseCreated", handleCreated);

      socket.off("caseLogAdded", handleLogAdded);
    };
  }, []);

  // =====================================================
  // LOCAL POLICY AI
  // =====================================================

  const ai = useMemo(() => {
    if (!selected) return null;

    return classifyCase(selected);
  }, [selected]);

  // =====================================================
  // FILTER CASES
  // =====================================================

  const visibleCases = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    const filtered = cases.filter((c) => {
      if (!keyword) return true;

      return (
        c.student?.name?.toLowerCase().includes(keyword) ||
        c.student?.studentId?.toLowerCase().includes(keyword) ||
        c.offense?.toLowerCase().includes(keyword) ||
        c.status?.toLowerCase().includes(keyword) ||
        c.location?.toLowerCase().includes(keyword)
      );
    });

    const getTime = (c) => new Date(c.createdAt || c.updatedAt || 0).getTime();

    const getRisk = (c) => {
      const result = classifyCase(c);

      if (result.risk === "HIGH") return 3;

      if (result.risk === "MEDIUM") return 2;

      return 1;
    };

    return [...filtered].sort((a, b) => {
      if (sortMode === "high") {
        return getRisk(b) - getRisk(a) || getTime(b) - getTime(a);
      }

      if (sortMode === "medium") {
        const score = (c) => (getRisk(c) === 2 ? 3 : getRisk(c));

        return score(b) - score(a) || getTime(b) - getTime(a);
      }

      if (sortMode === "low") {
        return getRisk(a) - getRisk(b) || getTime(b) - getTime(a);
      }

      return getTime(b) - getTime(a);
    });
  }, [cases, search, sortMode]);

  // =====================================================
  // STATS
  // =====================================================

  const totalCases = cases.length;

  const ongoingCases = cases.filter(
    (c) =>
      getStatus(c) === "reviewing" ||
      getStatus(c) === "received" ||
      getStatus(c) === "saved-student-statement",
  ).length;

  const interventionCases = cases.filter(
    (c) => getStatus(c) === "refer-for-intervention",
  ).length;

  const interventionReady = cases.filter(
    (c) => getStatus(c) === "intervention-ready",
  ).length;

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const updateStatus = async (status) => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      alert("Admin note is required.");
      return;
    }

    if (trimmedNote.length < MIN_TEXT_LENGTH) {
      alert(`Admin note must be at least ${MIN_TEXT_LENGTH} characters long.`);
      return;
    }

    try {
      const payload = {
        status,
        note: trimmedNote,
        changedByName: loggedInUser,
      };

      if (status === "refer-for-intervention") {
        payload.escalationInfo = {
          involvedPersons,
          additionalParticipants,
          approvalDetails,
        };
      }

      const res = await API.put(
        `/api/incidents/${selected._id}/status`,
        payload,
      );

      const updated = normalizeCase(res.data.incident);

      setSelected(updated);

      setCases((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );

      setNote("");
      setInvolvedPersons("");
      setAdditionalParticipants("");
      setApprovalDetails("");

      // Re-analyze the updated current incident
      runGeminiAnalysis(updated);
    } catch (err) {
      console.error("Status update failed:", err);

      alert(err?.response?.data?.message || "Failed to update case.");
    }
  };

  // =====================================================
  // REQUEST STUDENT STATEMENT
  // =====================================================

  const requestStudentStatement = async () => {
    try {
      const res = await API.put(
        `/api/incidents/${selected._id}/request-statement`,
        {
          note,
          changedByName: loggedInUser,
        },
      );

      const updated = normalizeCase(res.data.incident);

      setSelected(updated);

      setCases((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );

      setRequestSent(true);
      setNote("");
    } catch (err) {
      console.error(err);

      alert(err?.response?.data?.message || "Failed to request statement.");
    }
  };

  // =====================================================
  // SAVE STATEMENT
  // =====================================================

  const saveStudentStatement = async () => {
    const trimmedStatement = studentInput.trim();

    if (!trimmedStatement) {
      alert("Student statement cannot be empty.");
      return;
    }

    if (trimmedStatement.length < MIN_TEXT_LENGTH) {
      alert(
        `Student statement must be at least ${MIN_TEXT_LENGTH} characters long.`,
      );
      return;
    }

    try {
      const res = await API.put(
        `/api/incidents/${selected._id}/manual-statement`,
        {
          statement: trimmedStatement,
          changedByName: loggedInUser,
          stage: "student_statement_saved",
        },
      );

      const updated = normalizeCase(res.data.incident);

      setSelected(updated);

      setCases((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );

      setStudentInput("");

      // Re-run Gemini because the current incident
      // now contains the student's statement.
      runGeminiAnalysis(updated);
    } catch (err) {
      console.error("Save statement failed:", err);

      alert(err?.response?.data?.message || "Failed to save statement");
    }
  };

  // =====================================================
  // FLOW
  // =====================================================

  const flowWithMeta = flow.map((step) => {
    const logs = selected?.logs || [];

    const log = logs
      .filter((l) => l.stage === step)
      .sort((a, b) => new Date(b.time) - new Date(a.time))[0];

    const currentIndex = flow.indexOf(getStatus(selected));

    return {
      key: step,
      label: actionLabels[step] || step,
      time: log?.time,
      by: log?.changedByName,
      done: currentIndex >= flow.indexOf(step),
    };
  });

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => navigate("/login");

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${pageBg} ${darkMode ? "case-dark" : ""}`}
    >
      <style>{`
        .case-dark {
          background: #07110D !important;
          color: #F1F5F9;
        }

        /* Core surfaces */
        .case-dark .bg-white { background-color: #0C1913 !important; }
        .case-dark .bg-white\/70 { background-color: rgba(12,25,19,.82) !important; }
        .case-dark .bg-white\/20 { background-color: rgba(255,255,255,.06) !important; }
        .case-dark .bg-gray-50 { background-color: #101F17 !important; }
        .case-dark .bg-gray-100 { background-color: #14231C !important; }
        .case-dark .bg-gray-200 { background-color: #1A2C23 !important; }
        .case-dark .bg-gray-300 { background-color: #263B31 !important; }

        /* Soft status surfaces */
        .case-dark .bg-green-50 { background-color: rgba(6,78,59,.28) !important; }
        .case-dark .bg-green-100 { background-color: rgba(6,78,59,.42) !important; }
        .case-dark .bg-amber-50 { background-color: rgba(120,53,15,.28) !important; }
        .case-dark .bg-red-50 { background-color: rgba(127,29,29,.28) !important; }
        .case-dark .bg-red-100 { background-color: rgba(127,29,29,.34) !important; }
        .case-dark .bg-blue-50 { background-color: rgba(30,64,175,.25) !important; }
        .case-dark .bg-emerald-50 { background-color: rgba(6,78,59,.28) !important; }
        .case-dark .bg-indigo-50 { background-color: rgba(49,46,129,.25) !important; }
        .case-dark .bg-purple-50 { background-color: rgba(107,33,168,.24) !important; }

        /* Borders */
        .case-dark .border-white { border-color: rgba(255,255,255,.10) !important; }
        .case-dark .border-gray-100 { border-color: rgba(6,78,59,.55) !important; }
        .case-dark .border-gray-200 { border-color: rgba(6,78,59,.65) !important; }
        .case-dark .border-green-100 { border-color: rgba(6,78,59,.55) !important; }
        .case-dark .border-green-200 { border-color: rgba(6,78,59,.70) !important; }
        .case-dark .border-blue-200 { border-color: rgba(59,130,246,.30) !important; }
        .case-dark .border-purple-200 { border-color: rgba(168,85,247,.30) !important; }
        .case-dark .border-amber-200 { border-color: rgba(245,158,11,.30) !important; }
        .case-dark .border-red-100,
        .case-dark .border-red-200,
        .case-dark .border-red-300 { border-color: rgba(239,68,68,.30) !important; }
        .case-dark .border-emerald-200 { border-color: rgba(16,185,129,.30) !important; }
        .case-dark .border-indigo-200 { border-color: rgba(99,102,241,.30) !important; }

        /* Typography */
        .case-dark .text-gray-900 { color: #F1F5F9 !important; }
        .case-dark .text-gray-800 { color: #E2E8F0 !important; }
        .case-dark .text-gray-700 { color: #CBD5E1 !important; }
        .case-dark .text-gray-600 { color: #94A3B8 !important; }
        .case-dark .text-gray-500 { color: #64748B !important; }
        .case-dark .text-gray-400 { color: #64748B !important; }
        .case-dark .text-gray-300 { color: #475569 !important; }
        .case-dark .text-green-800 { color: #A7F3D0 !important; }
        .case-dark .text-green-700 { color: #6EE7B7 !important; }
        .case-dark .text-green-600 { color: #34D399 !important; }
        .case-dark .text-amber-700 { color: #FCD34D !important; }
        .case-dark .text-red-800 { color: #FECACA !important; }
        .case-dark .text-red-700 { color: #FCA5A5 !important; }
        .case-dark .text-blue-700 { color: #93C5FD !important; }
        .case-dark .text-indigo-700 { color: #A5B4FC !important; }
        .case-dark .text-purple-700 { color: #D8B4FE !important; }
        .case-dark .text-emerald-700 { color: #6EE7B7 !important; }

        /* Modal-specific surfaces: these are explicit so custom/arbitrary Tailwind backgrounds
           and modal content cannot fall back to the light theme. */
        .case-dark .case-modal {
          background-color: #0C1913 !important;
          border-color: rgba(6,78,59,.65) !important;
          color: #E2E8F0 !important;
        }
        .case-dark .case-modal-header {
          background-color: #0C1913 !important;
          border-color: rgba(6,78,59,.65) !important;
        }
        .case-dark .case-modal .bg-white,
        .case-dark .case-modal .bg-white\/70,
        .case-dark .case-modal .bg-\[\#f7faf8\] {
          background-color: #0C1913 !important;
        }
        .case-dark .case-modal .bg-gray-50 {
          background-color: #101F17 !important;
        }
        .case-dark .case-modal .bg-gray-100 {
          background-color: #14231C !important;
        }

        /* AI analysis modal: remove every light surface from the analysis panel in dark mode */
        .case-dark .case-ai-analysis {
          background: linear-gradient(135deg, #0C2418 0%, #0D321F 52%, #091B12 100%) !important;
          border-color: rgba(6,78,59,.65) !important;
          color: #E2E8F0 !important;
        }
        .case-dark .case-ai-analysis .bg-white,
        .case-dark .case-ai-analysis .bg-white\/70 {
          background-color: #0C1913 !important;
        }
        .case-dark .case-ai-analysis .bg-gray-50 {
          background-color: #101F17 !important;
        }
        .case-dark .case-ai-analysis .bg-green-50 {
          background-color: rgba(6,78,59,.28) !important;
        }
        .case-dark .case-ai-analysis .bg-green-100 {
          background-color: rgba(6,78,59,.42) !important;
        }
        .case-dark .case-ai-analysis .bg-red-50 {
          background-color: rgba(127,29,29,.28) !important;
        }
        .case-dark .case-ai-analysis .border-white,
        .case-dark .case-ai-analysis .border-gray-100,
        .case-dark .case-ai-analysis .border-green-100,
        .case-dark .case-ai-analysis .border-red-100 {
          border-color: rgba(6,78,59,.55) !important;
        }
        .case-dark .case-ai-analysis .text-gray-800 { color: #E2E8F0 !important; }
        .case-dark .case-ai-analysis .text-gray-700 { color: #CBD5E1 !important; }
        .case-dark .case-ai-analysis .text-gray-600 { color: #94A3B8 !important; }
        .case-dark .case-ai-analysis .text-gray-400 { color: #64748B !important; }

        /* Inputs and controls */
        .case-dark input,
        .case-dark textarea,
        .case-dark select {
          background-color: #0C1913 !important;
          color: #E2E8F0 !important;
          border-color: rgba(6,78,59,.65) !important;
          color-scheme: dark;
        }
        .case-dark input::placeholder,
        .case-dark textarea::placeholder { color: #64748B !important; }

        /* Hover states that otherwise reveal white/light surfaces */
        .case-dark .hover\:bg-gray-50:hover { background-color: #14231C !important; }
        .case-dark .hover\:bg-gray-100:hover { background-color: #192A21 !important; }
        .case-dark .hover\:bg-green-50:hover { background-color: rgba(6,78,59,.38) !important; }
        .case-dark .hover\:bg-red-50:hover { background-color: rgba(127,29,29,.38) !important; }
        .case-dark .hover\:bg-red-100:hover { background-color: rgba(127,29,29,.45) !important; }

        /* Card depth */
        .case-dark .shadow-sm,
        .case-dark .shadow-md,
        .case-dark .shadow-xl {
          box-shadow: 0 14px 38px rgba(0,0,0,.22) !important;
        }

        /* Native controls */
        .case-dark option { background: #0C1913; color: #E2E8F0; }
      `}</style>
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          hidden lg:flex fixed left-0 top-0 bottom-0 z-40
          w-[250px] xl:w-[270px]
          flex-col justify-between px-4 xl:px-5 py-6
          overflow-y-auto border-r transition-colors duration-300
          ${darkMode ? "bg-[#09150F] border-emerald-950/60" : "bg-white border-gray-100"}
        `}
      >
        <div>
          <div className="px-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 xl:w-11 h-10 xl:h-11 flex items-center justify-center flex-shrink-0">
                <img src="/school-logo.webp" alt="School Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-xl font-extrabold tracking-tight ${textPrimary}`}>
                  Guid<span className="text-green-500">Ed</span>
                </h1>
                <p className={`text-[9px] uppercase tracking-widest font-semibold truncate ${textMuted}`}>
                  Student Guidance
                </p>
              </div>
            </div>
            <p className={`text-[12px] leading-relaxed mt-4 ${textMuted}`}>
              Our Lady of the Holy Rosary School<br />General Trias Campus
            </p>
          </div>

          <p className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Main Menu</p>
          <div className="space-y-1">
            <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate("/dashboard")} darkMode={darkMode} />
            <Nav icon={<Users size={18} />} label="Students" onClick={() => navigate("/students")} darkMode={darkMode} />
            <Nav icon={<ShieldX size={18} />} label="Guidance" onClick={() => navigate("/guidance")} darkMode={darkMode} />
            <Nav icon={<ChartNoAxesCombined size={18} />} label="Reports" onClick={() => navigate("/reports")} darkMode={darkMode} />
            <Nav icon={<BriefcaseBusiness size={18} />} label="Cases" active darkMode={darkMode} />
            <Nav icon={<HandHelping size={18} />} label="Interventions" onClick={() => navigate("/interventions")} darkMode={darkMode} />
          </div>

          <p className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>System</p>
          <Nav icon={<Settings size={18} />} label="Settings" onClick={() => navigate("/settings")} darkMode={darkMode} />
        </div>

        <div className="space-y-3 mt-8">
          <div className={`p-3 rounded-2xl border ${darkMode ? "bg-[#101F17] border-emerald-950/50" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center gap-3">
              <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-950 text-emerald-300" : "bg-green-100 text-green-700"}`}>
                {adminPhoto ? (
                  <img src={adminPhoto} alt={adminName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <span className="font-bold">{adminName.charAt(0).toUpperCase()}</span>
                )}
                <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${darkMode ? "border-[#101F17]" : "border-white"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}>Administrator</p>
                <p className={`text-[15px] font-bold truncate ${textPrimary}`}>{adminName}</p>
              </div>
            </div>
          </div>

          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />

          <button onClick={logout} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[15px] font-semibold border transition ${darkMode ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300 hover:border-red-900/40" : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"}`}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed left-0 top-0 bottom-0 z-50 w-[min(82vw,300px)] flex flex-col justify-between px-5 py-6 overflow-y-auto border-r lg:hidden ${darkMode ? "bg-[#09150F] border-emerald-950/60" : "bg-white border-gray-100"}`}
            >
              <div>
                <div className="px-3 mb-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"><img src="/school-logo.webp" alt="School Logo" className="w-full h-full object-contain" /></div>
                      <div className="min-w-0">
                        <h1 className={`text-xl font-extrabold tracking-tight ${textPrimary}`}>Guid<span className="text-green-500">Ed</span></h1>
                        <p className={`text-[9px] uppercase tracking-widest font-semibold ${textMuted}`}>Student Guidance</p>
                      </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-[#101F17] text-slate-400" : "bg-gray-50 text-gray-500"}`} aria-label="Close menu"><X size={18} /></button>
                  </div>
                  <p className={`text-[12px] leading-relaxed mt-4 ${textMuted}`}>Our Lady of the Holy Rosary School<br />General Trias Campus</p>
                </div>
                <p className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Main Menu</p>
                <div className="space-y-1">
                  <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }} darkMode={darkMode} />
                  <Nav icon={<Users size={18} />} label="Students" onClick={() => { setMobileMenuOpen(false); navigate("/students"); }} darkMode={darkMode} />
                  <Nav icon={<ShieldX size={18} />} label="Guidance" onClick={() => { setMobileMenuOpen(false); navigate("/guidance"); }} darkMode={darkMode} />
                  <Nav icon={<ChartNoAxesCombined size={18} />} label="Reports" onClick={() => { setMobileMenuOpen(false); navigate("/reports"); }} darkMode={darkMode} />
                  <Nav icon={<BriefcaseBusiness size={18} />} label="Cases" active darkMode={darkMode} />
                  <Nav icon={<HandHelping size={18} />} label="Interventions" onClick={() => { setMobileMenuOpen(false); navigate("/interventions"); }} darkMode={darkMode} />
                </div>
                <p className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>System</p>
                <Nav icon={<Settings size={18} />} label="Settings" onClick={() => { setMobileMenuOpen(false); navigate("/settings"); }} darkMode={darkMode} />
              </div>
              <div className="space-y-3 mt-8">
                <div className={`p-3 rounded-2xl border ${darkMode ? "bg-[#101F17] border-emerald-950/50" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-950 text-emerald-300" : "bg-green-100 text-green-700"}`}>
                      {adminPhoto ? <img src={adminPhoto} alt={adminName} className="w-full h-full object-cover" /> : <span className="font-bold">{adminName.charAt(0).toUpperCase()}</span>}
                      <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${darkMode ? "border-[#101F17]" : "border-white"}`} />
                    </div>
                    <div className="min-w-0 flex-1"><p className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}>Administrator</p><p className={`text-[15px] font-bold truncate ${textPrimary}`}>{adminName}</p></div>
                  </div>
                </div>
                <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                <button onClick={logout} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[15px] font-semibold border transition ${darkMode ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300" : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600"}`}><LogOut size={16} /> Sign out</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="flex-1 min-w-0 lg:ml-[250px] xl:ml-[270px] overflow-y-auto min-h-screen">
        <div className="max-w-[1600px] mx-auto px-5 md:px-7 xl:px-9 py-6 md:py-8">
          {/* HEADER */}

          <div className="flex items-center justify-between gap-5 mb-7">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`
                  lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0
                  ${darkMode ? "bg-[#101F17] border-emerald-950/50 text-slate-300" : "bg-white border-gray-200 text-gray-600"}
                `}
                aria-label="Open menu"
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="hidden sm:flex items-center gap-2 text-[13px] mb-1">
                  <span className={textMuted}>Management</span>
                  <ChevronRight size={12} className={textMuted} />
                  <span className="text-green-500 font-semibold">Cases</span>
                </div>

                <h2 className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight ${textPrimary}`}>
                  Case Management
                </h2>

                <p className={`text-[13px] sm:text-[15px] mt-1 truncate sm:whitespace-normal ${textSecondary}`}>
                  Monitor incidents, review cases, and manage intervention workflows.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setDarkMode((value) => !value)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${darkMode ? "bg-[#101F17] border-emerald-950/50 text-amber-300 hover:bg-[#14261C]" : "bg-white border-gray-100 text-slate-500 hover:bg-green-50 hover:text-green-600"}`}
                  title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${darkMode ? "bg-[#101F17] border-emerald-950/50" : "bg-white border-gray-100"}`}>
                  <Database size={15} className="text-green-500" />
                  <span className={`text-[13px] font-semibold ${textSecondary}`}>{totalCases} records</span>
                </div>
              </div>
            </div>

            {/* NOTIFICATION */}

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setOpenNotif(!openNotif)}
                className={`relative w-10 h-10 rounded-xl border shadow-sm flex items-center justify-center transition-all ${
                  darkMode
                    ? "bg-[#101F17] border-emerald-950/50 text-slate-400 hover:text-green-400 hover:bg-[#14261C]"
                    : "bg-white border-gray-100 text-gray-500 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                <Bell size={17} />

                {notifications.length > 0 && (
                  <span
                    className={`
                      absolute
                      -top-1
                      -right-1
                      min-w-[18px]
                      h-[18px]
                      px-1
                      rounded-full
                      bg-red-500
                      text-white
                      text-[9px]
                      font-bold
                      flex items-center justify-center
                      border-2
                      ${darkMode ? "border-[#0C1913]" : "border-[#f7faf8]"}
                    `}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {openNotif && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    className="
                      absolute
                      right-0
                      top-12
                      w-[330px]
                      max-w-[calc(100vw-32px)]
                      bg-white
                      border border-gray-100
                      rounded-2xl
                      overflow-hidden
                      shadow-xl
                      z-[100]
                    "
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-[15px]">
                          Notifications
                        </h3>

                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Case updates
                        </p>
                      </div>

                      <div
                        className="
                          w-8 h-8
                          rounded-xl
                          bg-green-50
                          text-green-700
                          flex items-center justify-center
                        "
                      >
                        <Sparkles size={14} />
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-9 text-center">
                          <div
                            className="
                              w-11 h-11
                              rounded-2xl
                              bg-gray-50
                              mx-auto
                              flex items-center justify-center
                              text-gray-300
                            "
                          >
                            <Bell size={18} />
                          </div>

                          <p className="text-[13px] font-semibold text-gray-500 mt-3">
                            No notifications
                          </p>

                          <p className="text-[10px] text-gray-400 mt-1">
                            You're all caught up.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <motion.div
                            key={n.id}
                            whileHover={{
                              x: 2,
                            }}
                            className="
                                p-4
                                border-b
                                border-gray-100
                                hover:bg-gray-50
                                transition
                              "
                          >
                            <p className="font-semibold text-[13px] text-gray-900">
                              {n.title}
                            </p>

                            <p className="text-[12px] text-gray-500 mt-1">
                              {n.text}
                            </p>

                            <div className="flex justify-between mt-3">
                              <span className="text-[9px] text-green-700 font-bold">
                                {n.student}
                              </span>

                              <span className="text-[9px] text-gray-400">
                                {new Date(n.time).toLocaleTimeString()}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ===================================================
              CASE MANAGEMENT HERO
          =================================================== */}

          <section className="mb-8">
            <div
              className={`
                relative
                overflow-hidden
                rounded-3xl
                border
                p-5 sm:p-7
                ${
                  darkMode
                    ? "bg-gradient-to-br from-[#0C2418] via-[#0D321F] to-[#091B12] border-emerald-900/40"
                    : "bg-gradient-to-br from-white via-[#EFF9F3] to-[#E5F5EB] border-green-100"
                }
              `}
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-24 w-52 h-52 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div
                    className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                      border text-[10px] sm:text-[12px] font-bold uppercase tracking-wider
                      ${
                        darkMode
                          ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
                          : "bg-white/80 border-green-100 text-green-700"
                      }
                    `}
                  >
                    <Sparkles size={12} />
                    GuidEd • Case Management
                  </div>

                  <h1
                    className={`
                      text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-4
                      ${darkMode ? "text-white" : "text-slate-900"}
                    `}
                  >
                    Your case workload,
                    <span className="text-green-500">{" "}at a glance.</span>
                  </h1>

                  <p
                    className={`
                      text-[15px] sm:text-base leading-relaxed mt-3 max-w-xl
                      ${darkMode ? "text-slate-300" : "text-slate-500"}
                    `}
                  >
                    Review active incidents, monitor risk indicators, and keep every
                    case moving through the guidance workflow from one organized workspace.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <div
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold
                        ${
                          darkMode
                            ? "bg-white/5 text-slate-300 border border-white/10"
                            : "bg-white/80 text-slate-600 border border-white"
                        }
                      `}
                    >
                      <BriefcaseBusiness size={14} className="text-green-500" />
                      {totalCases} cases
                    </div>

                    <div
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold
                        ${
                          darkMode
                            ? "bg-red-950/30 text-red-300 border border-red-900/30"
                            : "bg-red-50 text-red-600 border border-red-100"
                        }
                      `}
                    >
                      <AlertTriangle size={14} />
                      {cases.filter((c) => classifyCase(c).risk === "HIGH").length} high risk
                    </div>

                    <div
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold
                        ${
                          darkMode
                            ? "bg-emerald-950/30 text-emerald-300 border border-emerald-900/30"
                            : "bg-green-50 text-green-700 border border-green-100"
                        }
                      `}
                    >
                      <ShieldCheck size={14} />
                      {cases.filter((c) => classifyCase(c).risk === "LOW").length} low risk
                    </div>
                  </div>
                </div>

                <div
                  className={`
                    shrink-0 w-full xl:w-[260px] rounded-2xl p-4 border
                    ${darkMode ? "bg-black/10 border-white/10" : "bg-white/70 border-white"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                      <ClipboardList size={20} />
                    </div>

                    <div>
                      <p className={`text-[13px] font-semibold ${textMuted}`}>Directory</p>
                      <p className={`text-lg font-extrabold ${textPrimary}`}>{visibleCases.length}</p>
                    </div>
                  </div>

                  <p className={`text-[13px] leading-relaxed mt-3 ${textSecondary}`}>
                    Currently matching your selected search and filters.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div
            className="case-content-typography"
            style={{
              fontFamily:
                '"Inter", "Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
            }}
          >

          {/* ===================================================
              CASE WORKSPACE
          =================================================== */}

          <section className="mb-7">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
              <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 shadow-sm ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-green-50 text-green-700"}`}>
                  <Search size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] uppercase tracking-[.16em] font-bold ${textMuted}`}>Case finder</p>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student, offense, status, or location..."
                    className={`w-full mt-1 bg-transparent outline-none text-[16px] ${textPrimary} placeholder:text-gray-400`}
                  />
                </div>
                {search && (
                  <button type="button" onClick={() => setSearch("")} className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? "hover:bg-white/5 text-slate-500" : "hover:bg-gray-50 text-gray-400"}`}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className={`flex items-center gap-1 p-1.5 rounded-2xl border shadow-sm overflow-x-auto ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}`}>
                <SlidersHorizontal size={14} className={`ml-2 mr-1 shrink-0 ${textMuted}`} />
                {[
                  ["newest", "Newest"],
                  ["high", "High Risk"],
                  ["medium", "Medium"],
                  ["low", "Low"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSortMode(value)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-[13px] font-bold transition ${
                      sortMode === value
                        ? "bg-green-600 text-white shadow-sm"
                        : darkMode
                          ? "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* COMMAND STRIP */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              {
                label: "Needs attention",
                value: cases.filter((c) => ["received", "saved-student-statement"].includes(getStatus(c))).length,
                icon: <Clock3 size={17} />,
                tone: darkMode ? "bg-blue-950/30 text-blue-300 border-blue-900/40" : "bg-blue-50 text-blue-700 border-blue-100",
                hint: "Awaiting review",
              },
              {
                label: "High risk",
                value: cases.filter((c) => classifyCase(c).risk === "HIGH").length,
                icon: <ShieldAlert size={17} />,
                tone: darkMode ? "bg-red-950/30 text-red-300 border-red-900/40" : "bg-red-50 text-red-700 border-red-100",
                hint: "Priority review",
              },
              {
                label: "Intervention queue",
                value: interventionCases,
                icon: <HandHelping size={17} />,
                tone: darkMode ? "bg-amber-950/30 text-amber-300 border-amber-900/40" : "bg-amber-50 text-amber-700 border-amber-100",
                hint: "Escalated cases",
              },
              {
                label: "Ready",
                value: interventionReady,
                icon: <CircleCheck size={17} />,
                tone: darkMode ? "bg-emerald-950/30 text-emerald-300 border-emerald-900/40" : "bg-emerald-50 text-emerald-700 border-emerald-100",
                hint: "Next-step ready",
              },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border p-4 shadow-sm ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${item.tone}`}>{item.icon}</div>
                <p className={`text-[12px] uppercase tracking-wider font-bold mt-4 ${textMuted}`}>{item.label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${textPrimary}`}>{item.value}</p>
                <p className={`text-[12px] mt-1 ${textMuted}`}>{item.hint}</p>
              </div>
            ))}
          </section>

          {/* RISK PULSE + WORKLOAD */}
          <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-4 mb-8">
            <div className={`relative overflow-hidden rounded-[26px] border p-5 sm:p-6 ${darkMode ? "bg-gradient-to-br from-[#0C2418] to-[#091B12] border-emerald-900/50" : "bg-gradient-to-br from-[#F0FBF5] to-white border-green-100"}`}>
              <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-[12px] uppercase tracking-[.18em] font-bold ${darkMode ? "text-emerald-400" : "text-green-700"}`}>Case pulse</p>
                    <h3 className={`text-lg sm:text-xl font-extrabold mt-1 ${darkMode ? "text-white" : "text-slate-900"}`}>Risk balance across your queue</h3>
                    <p className={`text-[13px] leading-relaxed mt-1 max-w-lg ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                      A quick visual snapshot of locally classified case risk. Use it as a review aid, not a final decision.
                    </p>
                  </div>
                  <div className={`hidden sm:flex w-11 h-11 rounded-2xl items-center justify-center ${darkMode ? "bg-white/5 text-emerald-300" : "bg-white text-green-600 shadow-sm"}`}>
                    <ChartNoAxesCombined size={20} />
                  </div>
                </div>
                <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-gray-200/60 dark:bg-white/5">
                  {[
                    ["HIGH", "bg-red-500", cases.filter((c) => classifyCase(c).risk === "HIGH").length],
                    ["MEDIUM", "bg-amber-400", cases.filter((c) => classifyCase(c).risk === "MEDIUM").length],
                    ["LOW", "bg-emerald-500", cases.filter((c) => classifyCase(c).risk === "LOW").length],
                  ].map(([key, color, count]) => (
                    <div key={key} className={`${color} transition-all`} style={{ width: `${totalCases ? (count / totalCases) * 100 : 0}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    ["High", cases.filter((c) => classifyCase(c).risk === "HIGH").length, "text-red-500"],
                    ["Medium", cases.filter((c) => classifyCase(c).risk === "MEDIUM").length, "text-amber-500"],
                    ["Low", cases.filter((c) => classifyCase(c).risk === "LOW").length, "text-emerald-500"],
                  ].map(([label, value, color]) => (
                    <div key={label}>
                      <p className={`text-[12px] font-bold uppercase tracking-wider ${textMuted}`}>{label}</p>
                      <p className={`text-xl font-extrabold mt-1 ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`rounded-[26px] border p-5 sm:p-6 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[12px] uppercase tracking-[.18em] font-bold ${textMuted}`}>Workflow health</p>
                  <h3 className={`text-lg font-extrabold mt-1 ${textPrimary}`}>Where cases are sitting</h3>
                </div>
                <Activity size={18} className={darkMode ? "text-emerald-400" : "text-green-600"} />
              </div>
              <div className="space-y-3 mt-5">
                {[
                  ["Received", cases.filter((c) => getStatus(c) === "received").length],
                  ["Reviewing", cases.filter((c) => getStatus(c) === "reviewing").length],
                  ["Statement saved", cases.filter((c) => getStatus(c) === "saved-student-statement").length],
                  ["Intervention", cases.filter((c) => ["refer-for-intervention", "intervention-ready"].includes(getStatus(c))).length],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-[13px] font-semibold ${textSecondary}`}>{label}</span>
                      <span className={`text-[13px] font-bold ${textPrimary}`}>{value}</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${totalCases ? Math.max(4, (value / totalCases) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ACTIVE CASE DIRECTORY */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-extrabold ${textPrimary}`}>Active Case Directory</h3>
                  <div className={`ml-2 inline-flex items-center rounded-xl border p-1 ${darkMode ? "bg-[#101F17] border-emerald-950/50" : "bg-gray-50 border-gray-200"}`}>
                    <button
                      type="button"
                      onClick={() => setCaseViewMode("cards")}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition ${caseViewMode === "cards" ? (darkMode ? "bg-emerald-900/60 text-emerald-200" : "bg-white text-green-700 shadow-sm") : (darkMode ? "text-slate-400" : "text-gray-500")}`}
                    >
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaseViewMode("compact")}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition ${caseViewMode === "compact" ? (darkMode ? "bg-emerald-900/60 text-emerald-200" : "bg-white text-green-700 shadow-sm") : (darkMode ? "text-slate-400" : "text-gray-500")}`}
                    >
                      Compact
                    </button>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[12px] font-bold ${darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-green-50 text-green-700"}`}>{visibleCases.length}</span>
                </div>
                <p className={`text-[14px] mt-1 ${textMuted}`}>Open any case to review evidence, student statements, AI analysis, workflow history, and next actions.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCasePrintableReport(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl border text-[14px] font-bold transition ${
                  darkMode ? "bg-[#0C1913] border-emerald-950/60 text-slate-300 hover:bg-[#10231A]" : "bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                }`}
              >
                <Printer size={15} /> Printable Report
              </button>
            </div>

            {loading ? (
              <div className={caseViewMode === "cards" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-2"}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className={`h-[330px] rounded-[26px] border animate-pulse ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}`} />
                ))}
              </div>
            ) : visibleCases.length === 0 ? (
              <div className={`rounded-[26px] border p-14 text-center ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center ${darkMode ? "bg-emerald-950/40 text-emerald-400" : "bg-green-50 text-green-600"}`}>
                  <ClipboardList size={26} />
                </div>
                <h3 className={`font-extrabold mt-4 ${textPrimary}`}>Your case queue is clear</h3>
                <p className={`text-[14px] mt-1 ${textMuted}`}>No cases match the current search or risk filter.</p>
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="mt-4 px-4 py-2 rounded-xl bg-green-600 text-white text-[13px] font-bold">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className={caseViewMode === "cards" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3"}>
                {visibleCases.map((c) => (
                  <CaseCard
                    key={c._id}
                    caseData={c}
                    darkMode={darkMode}
                    compact={caseViewMode === "compact"}
                    onClick={() => {
                      setSelected(c);
                      runGeminiAnalysis(c);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
          </div>
        </div>
      </main>

      {/* =================================================
          CASE WORKSPACE MODAL
      ================================================= */}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-slate-950/65 backdrop-blur-sm p-0 sm:p-4 lg:p-6 flex items-end sm:items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.18 }}
              style={{
                fontFamily:
                  '"Inter", "Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
              }}
              className={`case-modal w-full max-w-6xl max-h-[100dvh] sm:max-h-[94vh] overflow-hidden rounded-t-[30px] sm:rounded-[30px] border shadow-2xl ${darkMode ? "bg-[#0B1710] border-emerald-950/60" : "bg-[#F7FAF8] border-white"}`}
            >
              <div className={`case-modal-header sticky top-0 z-20 px-4 sm:px-6 py-4 border-b ${darkMode ? "bg-[#0C1913] border-emerald-950/60" : "bg-white border-gray-100"}`}>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={close} className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${darkMode ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10" : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"}`}>
                    <X size={18} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[12px] uppercase tracking-[.18em] font-bold ${darkMode ? "text-emerald-400" : "text-green-700"}`}>Case workspace</span>
                      <StatusBadge status={getStatus(selected)} />
                    </div>
                    <h2 className={`text-base sm:text-lg font-extrabold truncate mt-1 ${textPrimary}`}>{selected.offense || "Case Details"}</h2>
                  </div>
                  <button type="button" onClick={() => setShowCasePrintableReport(true)} className={`hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-bold ${darkMode ? "border-emerald-950/60 text-slate-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700"}`}>
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(100dvh-74px)] sm:max-h-[calc(94vh-74px)]">
                <div className="p-4 sm:p-6 lg:p-7 space-y-5">
                  {/* PROFILE HERO */}
                  <section className={`relative overflow-hidden rounded-[26px] p-5 sm:p-6 border ${darkMode ? "bg-gradient-to-br from-[#0C2418] via-[#0D321F] to-[#091B12] border-emerald-900/50" : "bg-gradient-to-br from-white via-[#F0FBF5] to-[#E3F5EA] border-green-100"}`}>
                    <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl" />
                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={selected.student?.avatar || DEFAULT_AVATAR} alt={selected.student?.name || "Student"} className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] object-cover border-4 border-white/80 shadow-lg shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-[12px] uppercase tracking-[.18em] font-bold ${darkMode ? "text-emerald-400" : "text-green-700"}`}>Student case</p>
                          <h3 className={`text-xl sm:text-2xl font-extrabold truncate mt-1 ${darkMode ? "text-white" : "text-slate-900"}`}>{selected.student?.name || "Unknown Student"}</h3>
                          <p className={`text-[14px] mt-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                            {selected.student?.studentId || "No student ID"}
                            {selected.student?.grade ? ` • ${selected.student.grade}` : ""}
                            {selected.student?.section ? ` • ${selected.student.section}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`rounded-2xl px-3 py-3 border text-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white/70 border-white"}`}>
                          <p className={`text-[12px] uppercase tracking-wider font-bold ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Risk</p>
                          <div className="mt-1"><RiskBadge risk={aiAnalysis?.risk || ai?.risk || "LOW"} /></div>
                        </div>
                        <div className={`rounded-2xl px-3 py-3 border text-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white/70 border-white"}`}>
                          <p className={`text-[12px] uppercase tracking-wider font-bold ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Evidence</p>
                          <p className={`text-lg font-extrabold mt-1 ${darkMode ? "text-white" : "text-slate-900"}`}>{selected.evidence?.length || 0}</p>
                        </div>
                        <div className={`rounded-2xl px-3 py-3 border text-center ${darkMode ? "bg-white/5 border-white/10" : "bg-white/70 border-white"}`}>
                          <p className={`text-[12px] uppercase tracking-wider font-bold ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Updates</p>
                          <p className={`text-lg font-extrabold mt-1 ${darkMode ? "text-white" : "text-slate-900"}`}>{selected.logs?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* QUICK FACTS */}
                  <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {[
                      [FileText, "Offense", selected.offense],
                      [MapPin, "Location", selected.location],
                      [User2, "Reporter", selected.reporter],
                      [Calendar, "Date", selected.date ? new Date(selected.date).toLocaleDateString() : selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "N/A"],
                      [Clock3, "Time", selected.time || "N/A"],
                      [BriefcaseBusiness, "Category", selected.category || "Uncategorized"],
                    ].map(([Icon, label, value]) => (
                      <div key={label} className={`rounded-2xl border p-3.5 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-green-50 text-green-700"}`}><Icon size={14} /></div>
                        <p className={`text-[12px] uppercase tracking-wider font-bold mt-3 ${textMuted}`}>{label}</p>
                        <p className={`text-[13px] font-bold mt-1 truncate ${textPrimary}`}>{value || "N/A"}</p>
                      </div>
                    ))}
                  </section>

                  {/* WORKFLOW */}
                  <section className={`rounded-[26px] border p-5 sm:p-6 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-[12px] uppercase tracking-[.18em] font-bold ${darkMode ? "text-emerald-400" : "text-green-700"}`}>Case journey</p>
                        <h3 className={`text-lg font-extrabold mt-1 ${textPrimary}`}>Workflow progress</h3>
                      </div>
                      <span className={`text-[14px] font-extrabold ${darkMode ? "text-emerald-300" : "text-green-700"}`}>{Math.round(((Math.max(flow.indexOf(getStatus(selected)), 0) + 1) / flow.length) * 100)}%</span>
                    </div>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                      {flowWithMeta.map((step, index) => (
                        <div key={step.key} className={`relative rounded-2xl border p-3 ${step.done ? (darkMode ? "bg-emerald-950/25 border-emerald-900/50" : "bg-green-50/70 border-green-100") : (darkMode ? "bg-white/[.02] border-white/5" : "bg-gray-50 border-gray-100")}`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.done ? (darkMode ? "bg-emerald-900/60 text-emerald-300" : "bg-green-600 text-white") : (darkMode ? "bg-white/5 text-slate-600" : "bg-white text-gray-300 border border-gray-100")}`}>
                            {step.done ? <CheckCircle size={15} /> : <CircleDot size={15} />}
                          </div>
                          <p className={`text-[12px] font-extrabold mt-3 leading-snug ${textPrimary}`}>{step.label}</p>
                          <p className={`text-[12px] mt-1 ${textMuted}`}>{step.time ? new Date(step.time).toLocaleDateString() : "Pending"}</p>
                          {index < flowWithMeta.length - 1 && <span className={`hidden md:block absolute top-7 -right-3 w-3 h-px ${step.done ? "bg-green-500" : darkMode ? "bg-white/10" : "bg-gray-200"}`} />}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* DESCRIPTION + STATEMENT */}
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`rounded-[26px] border p-5 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-blue-950/40 text-blue-300" : "bg-blue-50 text-blue-700"}`}><FileText size={16} /></div>
                        <div><p className={`text-[16px] font-extrabold ${textPrimary}`}>Incident story</p><p className={`text-[12px] ${textMuted}`}>What was reported</p></div>
                      </div>
                      <p className={`text-[16px] leading-7 whitespace-pre-wrap ${textSecondary}`}>{selected.description || "No description provided."}</p>
                    </div>
                    <div className={`rounded-[26px] border p-5 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-purple-950/40 text-purple-300" : "bg-purple-50 text-purple-700"}`}><MessageSquare size={16} /></div>
                        <div><p className={`text-[16px] font-extrabold ${textPrimary}`}>Student voice</p><p className={`text-[12px] ${textMuted}`}>Recorded statement</p></div>
                      </div>
                      <div className={`rounded-2xl p-4 min-h-[130px] ${darkMode ? "bg-white/[.03]" : "bg-gray-50"}`}>
                        <p className={`text-[16px] leading-7 whitespace-pre-wrap ${textSecondary}`}>{selected.studentStatement || "No student statement recorded yet."}</p>
                      </div>
                    </div>
                  </section>

                  {/* EVIDENCE */}
                  <section className={`rounded-[26px] border p-5 sm:p-6 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-cyan-950/40 text-cyan-300" : "bg-cyan-50 text-cyan-700"}`}><ImageIcon size={16} /></div>
                        <div><p className={`text-[16px] font-extrabold ${textPrimary}`}>Evidence locker</p><p className={`text-[12px] ${textMuted}`}>{selected.evidence?.length || 0} attached item(s)</p></div>
                      </div>
                      <span className={`text-[12px] font-bold ${textMuted}`}>Click images to inspect</span>
                    </div>
                    {Array.isArray(selected.evidence) && selected.evidence.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {selected.evidence.map((e, i) => {
                          let parsed = e;
                          if (typeof e === "string") {
                            const urlMatch = e.match(/https?:\/\/[^\s'"}]+/);
                            parsed = { url: urlMatch?.[0] || normalizeEvidenceUrl(e), type: e.includes("video") ? "video" : "image" };
                          }
                          const url = normalizeEvidenceUrl(parsed?.url);
                          if (!url) return null;
                          const isImage = parsed?.type === "image" || /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                          return isImage ? (
                            <button key={i} type="button" onClick={() => setPreviewImage(url)} className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border ${darkMode ? "border-emerald-950/50" : "border-gray-100"}`}>
                              <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                              <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-lg bg-black/55 py-1.5 text-[12px] font-bold text-white opacity-0 group-hover:opacity-100 transition"><Eye size={11} /> Inspect</span>
                            </button>
                          ) : (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={`aspect-[4/3] rounded-2xl border flex flex-col items-center justify-center gap-2 text-[13px] font-bold ${darkMode ? "border-emerald-950/50 bg-white/[.03] text-slate-400" : "border-gray-100 bg-gray-50 text-gray-500"}`}>
                              <FileText size={20} /> Open file
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`rounded-2xl border border-dashed p-8 text-center ${darkMode ? "border-emerald-900/60 bg-white/[.02]" : "border-gray-200 bg-gray-50"}`}>
                        <ImageIcon size={22} className="mx-auto text-gray-400" />
                        <p className={`text-[14px] font-bold mt-2 ${textSecondary}`}>No evidence attached</p>
                      </div>
                    )}
                  </section>

                  {/* AI REVIEW */}
                  <section className={`case-ai-analysis relative overflow-hidden rounded-[28px] border p-5 sm:p-6 ${darkMode ? "" : "bg-gradient-to-br from-[#EFFAF3] via-white to-[#E7F7ED] border-green-100"}`}>
                    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" />
                    <div className="relative">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${darkMode ? "bg-emerald-900/60 text-emerald-300" : "bg-green-600 text-white shadow-lg shadow-green-600/20"}`}><Brain size={19} /></div>
                          <div>
                            <p className={`text-[12px] uppercase tracking-[.18em] font-bold ${darkMode ? "text-emerald-400" : "text-green-700"}`}>Intelligence layer</p>
                            <h3 className={`text-base font-extrabold mt-0.5 ${textPrimary}`}>GuidEd AI Case Review</h3>
                            <p className={`text-[12px] mt-0.5 ${textMuted}`}>Current incident first • previous records are supporting context</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiskBadge risk={aiAnalysis?.risk || ai?.risk || "LOW"} />
                          <button type="button" onClick={() => runGeminiAnalysis(selected)} disabled={aiLoading} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold border transition ${darkMode ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10" : "bg-white border-gray-100 text-gray-600 hover:text-green-700"}`}>
                            <RefreshCw size={12} className={aiLoading ? "animate-spin" : ""} /> {aiLoading ? "Analyzing..." : "Refresh"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-5">
                        {[
                          ["Risk", aiAnalysis?.risk || ai?.risk || "LOW"],
                          ["Severity", selected.level || ai?.severity || "Unclassified"],
                          ["Status", getStatus(selected)],
                          ["Student", selected.student?.name || "Unknown"],
                        ].map(([label, value]) => (
                          <div key={label} className={`rounded-2xl p-3 border ${darkMode ? "bg-white/[.03] border-white/5" : "bg-white/80 border-white"}`}>
                            <p className={`text-[12px] uppercase tracking-wider font-bold ${textMuted}`}>{label}</p>
                            <p className={`text-[13px] font-extrabold mt-1 truncate ${textPrimary}`}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {aiLoading && (
                        <div className={`mt-4 rounded-2xl p-5 flex items-center gap-3 ${darkMode ? "bg-white/[.03]" : "bg-white/80"}`}>
                          <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center"><Brain size={17} className="animate-pulse" /></div>
                          <div><p className={`text-[14px] font-bold ${textPrimary}`}>GuidEd AI is reviewing the current incident…</p><p className={`text-[12px] mt-1 ${textMuted}`}>This may take a moment.</p></div>
                        </div>
                      )}

                      {!aiLoading && aiError && (
                        <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 p-4">
                          <div className="flex items-start gap-3"><AlertTriangle size={17} className="text-red-600 shrink-0" /><div><p className="text-[14px] font-extrabold text-red-700">AI review unavailable</p><p className="text-[13px] text-red-600 mt-1">{aiError}</p><button type="button" onClick={() => runGeminiAnalysis(selected)} className="mt-3 px-3 py-2 rounded-xl bg-white border border-red-200 text-[13px] font-bold text-red-700">Try again</button></div></div>
                        </div>
                      )}

                      {!aiLoading && !aiError && aiAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          {[
                            ["AI Summary", aiAnalysis.summary, Sparkles],
                            ["Guidance Recommendation", aiAnalysis.recommendation, Brain],
                            ["Evidence Basis", aiAnalysis.basis, ShieldCheck],
                            ["Behavioral Pattern", aiAnalysis.pattern, Activity],
                            ["Behavioral Prediction", aiAnalysis.prediction, ChartNoAxesCombined],
                            ["AI Notes", aiAnalysis.notes, ClipboardList],
                          ].filter(([, value]) => value).map(([label, value, Icon]) => (
                            <div key={label} className={`rounded-2xl p-4 border ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-green-100"}`}>
                              <div className="flex items-center gap-2"><Icon size={13} className={darkMode ? "text-emerald-400" : "text-green-600"} /><p className={`text-[12px] uppercase tracking-wider font-bold ${darkMode ? "text-emerald-400" : "text-green-700"}`}>{label}</p></div>
                              <p className={`text-[14px] leading-relaxed mt-2 ${textSecondary}`}>{value}</p>
                            </div>
                          ))}
                          {Array.isArray(aiAnalysis.references) && aiAnalysis.references.length > 0 && (
                            <div className={`md:col-span-2 rounded-2xl p-4 border ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-green-100"}`}>
                              <div className="flex items-center gap-2"><FileText size={13} className="text-green-600" /><p className={`text-[12px] uppercase tracking-wider font-bold ${darkMode ? "text-emerald-400" : "text-green-700"}`}>Research support</p></div>
                              <div className="space-y-2 mt-3">
                                {aiAnalysis.references.slice(0, 5).map((reference, index) => (
                                  <div key={reference.referenceId || reference.id || index} className={`rounded-xl p-3 ${darkMode ? "bg-white/[.03]" : "bg-gray-50"}`}>
                                    <p className={`text-[13px] font-bold ${textPrimary}`}>{reference.referenceId || `Reference ${index + 1}`}</p>
                                    {reference.citation && <p className={`text-[13px] mt-1 leading-relaxed ${textSecondary}`}>{reference.citation}</p>}
                                    {reference.doi && <p className="text-[12px] text-green-700 font-semibold mt-1">DOI: {reference.doi}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!aiLoading && !aiError && !aiAnalysis && (
                        <div className={`mt-4 rounded-2xl p-6 text-center border ${darkMode ? "bg-white/[.03] border-white/5" : "bg-white/80 border-white"}`}>
                          <Brain size={24} className="mx-auto text-green-500" />
                          <p className={`text-[14px] font-extrabold mt-2 ${textPrimary}`}>No AI review yet</p>
                          <p className={`text-[13px] mt-1 ${textMuted}`}>Generate an incident-focused review when you're ready.</p>
                          <button type="button" onClick={() => runGeminiAnalysis(selected)} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-[13px] font-bold hover:bg-green-700"><Sparkles size={13} /> Run AI Review</button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* MANUAL STATEMENT */}
                  {selected.statementStatus !== "manual_entry" && !selected.studentStatement && (
                    <section className={`rounded-[26px] border p-5 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-blue-950/40 text-blue-300" : "bg-blue-50 text-blue-700"}`}><FileText size={16} /></div>
                        <div><p className={`text-[16px] font-extrabold ${textPrimary}`}>Record student statement</p><p className={`text-[12px] ${textMuted}`}>Use this when a statement needs to be entered manually.</p></div>
                      </div>
                      <textarea value={studentInput} onChange={(e) => setStudentInput(e.target.value)} minLength={MIN_TEXT_LENGTH} placeholder="Write the student's statement…" className={`w-full min-h-[120px] p-4 rounded-2xl border outline-none resize-none text-[16px] ${darkMode ? "bg-white/[.03] border-emerald-950/60 text-slate-200" : "bg-gray-50 border-gray-200 text-gray-700"} ${studentInput.trim().length > 0 && studentInput.trim().length < MIN_TEXT_LENGTH ? "border-red-300" : ""}`} />
                      <div className="flex items-center justify-between mt-2"><p className={`text-[13px] ${studentInput.trim().length > 0 && studentInput.trim().length < MIN_TEXT_LENGTH ? "text-red-500" : textMuted}`}>{studentInput.trim().length < MIN_TEXT_LENGTH ? `${MIN_TEXT_LENGTH - studentInput.trim().length} more characters required` : "Minimum length reached"}</p><span className={`text-[13px] ${textMuted}`}>{studentInput.length} characters</span></div>
                      <button type="button" onClick={saveStudentStatement} className="mt-3 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold">Save Statement</button>
                    </section>
                  )}

                  {/* ESCALATION */}
                  {getStatus(selected) === "intervention-ready" && (
                    <section className={`rounded-[26px] border p-5 ${darkMode ? "bg-red-950/15 border-red-900/40" : "bg-red-50 border-red-100"}`}>
                      <div className="flex items-center gap-3 mb-5"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-red-950/50 text-red-300" : "bg-red-100 text-red-600"}`}><AlertTriangle size={17} /></div><div><p className={`text-[16px] font-extrabold ${darkMode ? "text-red-300" : "text-red-800"}`}>Escalation record</p><p className={`text-[12px] ${darkMode ? "text-red-400/70" : "text-red-500"}`}>Information captured during intervention referral.</p></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <InfoBlock icon={<User2 size={14} />} label="Involved Persons" value={selected?.escalationInfo?.involvedPersons} />
                        <InfoBlock icon={<Users size={14} />} label="Additional Participants" value={selected?.escalationInfo?.additionalParticipants} />
                        <InfoBlock icon={<CheckCircle size={14} />} label="Approval Details" value={selected?.escalationInfo?.approvalDetails} />
                      </div>
                    </section>
                  )}

                  {/* ESCALATION INPUT */}
                  {canEscalate(selected) && (
                    <section className={`rounded-[26px] border p-5 ${darkMode ? "bg-red-950/10 border-red-900/40" : "bg-red-50/70 border-red-100"}`}>
                      <div className="flex items-center gap-3 mb-5"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-red-950/50 text-red-300" : "bg-red-100 text-red-600"}`}><AlertTriangle size={17} /></div><div><p className={`text-[16px] font-extrabold ${darkMode ? "text-red-300" : "text-red-800"}`}>Prepare intervention referral</p><p className={`text-[12px] ${darkMode ? "text-red-400/70" : "text-red-500"}`}>Complete the supporting details before escalating this case.</p></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          ["Involved Persons", involvedPersons, setInvolvedPersons, "Primary involved persons…"],
                          ["Additional Participants", additionalParticipants, setAdditionalParticipants, "Witnesses, classmates, faculty…"],
                          ["Approval Details", approvalDetails, setApprovalDetails, "Guidance / dean approval remarks…"],
                        ].map(([label, value, setter, placeholder]) => (
                          <div key={label}>
                            <label className={`text-[12px] uppercase tracking-wider font-bold ${textMuted}`}>{label}</label>
                            <textarea value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} className={`mt-2 w-full min-h-[110px] p-3 rounded-2xl border outline-none resize-none text-[14px] ${darkMode ? "bg-[#0C1913] border-emerald-950/60 text-slate-200" : "bg-white border-gray-200 text-gray-700"}`} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ACTIVITY */}
                  <section className={`rounded-[26px] border p-5 sm:p-6 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"} shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div><p className={`text-[12px] uppercase tracking-[.18em] font-bold ${textMuted}`}>Audit trail</p><h3 className={`text-lg font-extrabold mt-1 ${textPrimary}`}>Case activity</h3></div>
                      <Clock3 size={18} className={darkMode ? "text-emerald-400" : "text-green-600"} />
                    </div>
                    <div className="mt-5 space-y-3">
                      {(selected.logs || []).slice().reverse().map((l, i) => (
                        <div key={l._id || i} className={`flex gap-3 rounded-2xl border p-3.5 ${darkMode ? "bg-white/[.02] border-white/5" : "bg-gray-50/70 border-gray-100"}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-green-50 text-green-600"}`}><CircleCheck size={15} /></div>
                          <div className="min-w-0">
                            <p className={`text-[14px] font-extrabold ${textPrimary}`}>{actionLabels[l.stage] || l.stage}</p>
                            {l.note && <p className={`text-[13px] leading-relaxed mt-1 ${textSecondary}`}>{l.note}</p>}
                            <p className={`text-[12px] mt-2 ${textMuted}`}>{l.changedByName ? `By ${l.changedByName} • ` : ""}{l.time ? new Date(l.time).toLocaleString() : "No date"}</p>
                          </div>
                        </div>
                      ))}
                      {(!selected.logs || selected.logs.length === 0) && <div className={`py-8 text-center text-[14px] ${textMuted}`}>No case activity recorded yet.</div>}
                    </div>
                  </section>

                  {/* ADMIN NOTE + ACTION CENTER */}
                  <section className={`rounded-[28px] border p-5 sm:p-6 ${darkMode ? "bg-gradient-to-br from-[#0C1913] to-[#09150F] border-emerald-950/60" : "bg-white border-gray-100"} shadow-sm`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-green-50 text-green-700"}`}><ClipboardList size={16} /></div>
                      <div><p className={`text-[16px] font-extrabold ${textPrimary}`}>Action center</p><p className={`text-[12px] mt-0.5 ${textMuted}`}>Add a clear admin note before changing the case stage.</p></div>
                    </div>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} minLength={MIN_TEXT_LENGTH} placeholder="Explain the reason, observation, or context for this action…" className={`mt-4 w-full min-h-[115px] p-4 rounded-2xl border outline-none resize-none text-[16px] ${darkMode ? "bg-white/[.03] border-emerald-950/60 text-slate-200" : "bg-gray-50 border-gray-200 text-gray-700"}`} />
                    <div className="flex items-center justify-between mt-2"><span className={`text-[13px] ${note.trim().length > 0 && note.trim().length < MIN_TEXT_LENGTH ? "text-red-500" : textMuted}`}>{note.trim().length < MIN_TEXT_LENGTH ? `${MIN_TEXT_LENGTH - note.trim().length} more characters required` : "Ready to submit"}</span><span className={`text-[13px] ${textMuted}`}>{note.length} characters</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                      <button type="button" onClick={() => updateStatus("reviewing")} disabled={!canReview(selected)} className={`py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-extrabold transition ${canReview(selected) ? "bg-amber-500 hover:bg-amber-600 text-white" : darkMode ? "bg-white/5 text-slate-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}><Eye size={14} /> Review Case</button>
                      <button type="button" onClick={() => updateStatus("refer-for-intervention")} disabled={!canEscalate(selected)} className={`py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-extrabold transition ${canEscalate(selected) ? "bg-red-500 hover:bg-red-600 text-white" : darkMode ? "bg-white/5 text-slate-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}><AlertTriangle size={14} /> Refer Intervention</button>
                      <button type="button" onClick={() => updateStatus("intervention-ready")} disabled={!canIntervene(selected)} className={`py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-extrabold transition ${canIntervene(selected) ? "bg-green-600 hover:bg-green-700 text-white" : darkMode ? "bg-white/5 text-slate-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}><CheckCircle size={14} /> Intervention Ready</button>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCasePrintableReport && (
        <CasePrintableReport
          onClose={() => setShowCasePrintableReport(false)}
        />
      )}
    </div>
  );
}
