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
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

/* =========================================================
   DEFAULTS
========================================================= */

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

/* =========================================================
   NAV
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

/* =========================================================
   STATUS BADGE
========================================================= */

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

/* =========================================================
   RISK BADGE
========================================================= */

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

/* =========================================================
   INFO BLOCK
========================================================= */

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

    <p className="text-sm font-semibold text-gray-800 break-words">
      {value || "N/A"}
    </p>
  </div>
));

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = memo(
  ({
    icon,
    label,
    value,
    description,
    iconClass = "bg-green-50 text-green-700",
  }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="
        relative
        overflow-hidden
        bg-white
        border border-gray-100
        rounded-2xl
        p-5
        shadow-sm
        hover:shadow-md
        transition-all duration-200
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
            {label}
          </p>

          <h3 className="text-2xl font-extrabold text-gray-900 mt-2">
            {value}
          </h3>

          {description && (
            <p className="text-[10px] text-gray-400 mt-1 truncate">
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
    </motion.div>
  ),
);

/* =========================================================
   OFFENSE MAP
========================================================= */

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

/* =========================================================
   CASE FLOW
========================================================= */

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

/* =========================================================
   NORMALIZER
========================================================= */

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

    student: c.studentId
      ? {
          name: `${c.studentId.firstName || ""} ${
            c.studentId.lastName || ""
          }`.trim(),
          avatar: c.studentId.profilePhoto,
          grade: c.studentId.grade,
          section: c.studentId.section,
          studentId: c.studentId.studentId,
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

/* =========================================================
   EVIDENCE
========================================================= */

const normalizeEvidenceUrl = (url) => {
  if (!url) return null;

  if (url.includes("cloudinary")) return url;

  if (url.startsWith("/uploads")) {
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`;
  }

  return url;
};

/* =========================================================
   CASE CARD
========================================================= */

const CaseCard = memo(({ caseData, onClick }) => {
  const ai = classifyCase(caseData);
  const student = caseData.student || {};
  const status = caseData.status || "received";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="
        text-left
        relative
        overflow-hidden
        w-full
        bg-white
        border border-gray-100
        rounded-2xl
        p-5
        shadow-sm
        hover:shadow-md
        hover:border-gray-200
        transition-all duration-200
      "
    >
      <div
        className={`
          absolute
          -top-14
          -right-14
          w-36
          h-36
          rounded-full
          blur-3xl
          ${
            ai.risk === "HIGH"
              ? "bg-red-400/10"
              : ai.risk === "MEDIUM"
                ? "bg-amber-400/10"
                : "bg-green-400/10"
          }
        `}
      />

      <div className="relative">
        {/* STUDENT */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={student.avatar || DEFAULT_AVATAR}
                alt={student.name || "Student"}
                className="
                  w-11 h-11
                  rounded-xl
                  object-cover
                  border border-gray-100
                  shadow-sm
                "
              />

              <span
                className="
                  absolute
                  -bottom-1
                  -right-1
                  w-3
                  h-3
                  bg-green-500
                  rounded-full
                  border-2
                  border-white
                "
              />
            </div>

            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate text-sm">
                {student.name || "Unknown Student"}
              </p>

              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                {student.studentId || "No student ID"}
                {student.grade ? ` • ${student.grade}` : ""}
              </p>
            </div>
          </div>

          <ChevronRight
            size={16}
            className="text-gray-300 flex-shrink-0 mt-1"
          />
        </div>

        {/* OFFENSE */}
        <div className="mt-5">
          <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
            Offense
          </p>

          <h3 className="font-bold text-gray-800 text-sm mt-1 line-clamp-2">
            {caseData.offense}
          </h3>
        </div>

        {/* BADGES */}
        <div className="flex flex-wrap gap-2 mt-4">
          <StatusBadge status={status} />
          <RiskBadge risk={ai.risk} />
        </div>

        {/* PROGRESS */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              Case Progress
            </span>

            <span className="text-[9px] font-bold text-gray-400">
              {flow.indexOf(status) >= 0
                ? `${flow.indexOf(status) + 1}/${flow.length}`
                : "1/5"}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${
                  ((Math.max(flow.indexOf(status), 0) + 1) / flow.length) * 100
                }%`,
              }}
              className={`
                h-full
                rounded-full
                bg-gradient-to-r
                ${statusUI[status] || statusUI.received}
              `}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-400 min-w-0">
            <MapPin size={11} className="flex-shrink-0" />

            <span className="text-[9px] truncate max-w-[150px]">
              {caseData.location || "Unknown location"}
            </span>
          </div>

          <span className="text-[9px] font-medium text-gray-400">
            {caseData.createdAt
              ? new Date(caseData.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "No date"}
          </span>
        </div>
      </div>
    </motion.button>
  );
});

/* =========================================================
   MAIN
========================================================= */

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

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
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

  /* =====================================================
     STATUS HELPERS
  ===================================================== */

  const getStatus = (c) => c?.status || "received";

  const canReview = (c) => getStatus(c) === "saved-student-statement";

  const canEscalate = (c) => getStatus(c) === "reviewing";

  const canIntervene = (c) => getStatus(c) === "refer-for-intervention";

  /* =====================================================
     ACTION LABELS
  ===================================================== */

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

  /* =====================================================
     LATEST LOG
  ===================================================== */

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

  /* =====================================================
     CLOSE
  ===================================================== */

  const close = () => {
    setSelected(null);
    setNote("");
    setStudentInput("");
    setRequestSent(false);
    setInvolvedPersons("");
    setAdditionalParticipants("");
    setApprovalDetails("");
    setPreviewImage(null);
  };

  /* =====================================================
     ESCAPE
  ===================================================== */

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

  /* =====================================================
     FETCH CASES
  ===================================================== */

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

  /* =====================================================
     SOCKET
  ===================================================== */

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
        prev.map((c) =>
          c._id === caseId
            ? {
                ...c,
                logs: [...(c.logs || []), log],
              }
            : c,
        ),
      );

      setSelected((prev) =>
        prev && prev._id === caseId
          ? {
              ...prev,
              logs: [...(prev.logs || []), log],
            }
          : prev,
      );
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

  /* =====================================================
     AI
  ===================================================== */

  const ai = useMemo(() => {
    if (!selected) return null;

    return classifyCase(selected);
  }, [selected]);

  /* =====================================================
     FILTER / SORT
  ===================================================== */

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

  /* =====================================================
     STATS
  ===================================================== */

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

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  const updateStatus = async (status) => {
    if (!note.trim()) {
      alert("Admin note required.");
      return;
    }

    try {
      const payload = {
        status,
        note,
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
    } catch (err) {
      console.error("Status update failed:", err);

      alert(err?.response?.data?.message || "Failed to update case.");
    }
  };

  /* =====================================================
     REQUEST STUDENT STATEMENT
  ===================================================== */

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

  /* =====================================================
     SAVE STATEMENT
  ===================================================== */

  const saveStudentStatement = async () => {
    try {
      if (!studentInput.trim()) {
        alert("Statement cannot be empty");
        return;
      }

      const res = await API.put(
        `/api/incidents/${selected._id}/manual-statement`,
        {
          statement: studentInput,
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
    } catch (err) {
      console.error("Save statement failed:", err);

      alert(err?.response?.data?.message || "Failed to save statement");
    }
  };

  /* =====================================================
     FLOW
  ===================================================== */

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

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => navigate("/login");

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="
        h-screen
        w-screen
        bg-[#f7faf8]
        text-gray-900
        flex
        overflow-hidden
      "
    >
      {/* =================================================
          SIDEBAR
      ================================================= */}

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

          {/* NAV LABEL */}

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

            <Nav icon={<BriefcaseBusiness size={18} />} label="Cases" active />

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

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => navigate("/settings")}
          />
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
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

                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>

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
        border border-gray-200
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

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-5 md:px-7 xl:px-9 py-6 md:py-8">
          {/* HEADER */}

          <div className="flex items-center justify-between gap-5 mb-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="
                    w-8 h-8
                    rounded-xl
                    bg-green-100
                    text-green-700
                    flex items-center justify-center
                  "
                >
                  <BriefcaseBusiness size={16} />
                </div>

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-700">
                  Case Management
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Case Management
              </h2>

              <p className="text-xs md:text-sm text-gray-400 mt-1.5">
                Monitor incidents, review cases, and manage intervention
                workflows.
              </p>
            </div>

            {/* NOTIFICATION */}

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setOpenNotif(!openNotif)}
                className="
                  relative
                  w-10 h-10
                  rounded-xl
                  bg-white
                  border border-gray-100
                  shadow-sm
                  flex items-center justify-center
                  text-gray-500
                  hover:text-green-600
                  hover:shadow-md
                  transition-all
                "
              >
                <Bell size={17} />

                {notifications.length > 0 && (
                  <span
                    className="
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
                      border-[#f7faf8]
                    "
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
                        <h3 className="font-bold text-gray-900 text-sm">
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

                          <p className="text-xs font-semibold text-gray-500 mt-3">
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
                            whileHover={{ x: 2 }}
                            className="
                              p-4
                              border-b
                              border-gray-100
                              hover:bg-gray-50
                              transition
                            "
                          >
                            <p className="font-semibold text-xs text-gray-900">
                              {n.title}
                            </p>

                            <p className="text-[11px] text-gray-500 mt-1">
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

          {/* SEARCH + FILTER */}

          <div className="flex flex-col xl:flex-row gap-3 mb-7">
            <div
              className="
                flex-1
                h-12
                flex items-center gap-3
                px-4
                rounded-xl
                bg-white
                border border-gray-100
                shadow-sm
                focus-within:border-green-200
                focus-within:ring-4
                focus-within:ring-green-500/5
                transition-all
              "
            >
              <Search size={17} className="text-gray-400 flex-shrink-0" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, offense, status, or location..."
                className="
                  flex-1
                  bg-transparent
                  outline-none
                  text-sm
                  text-gray-800
                  placeholder:text-gray-400
                "
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="
                    w-7 h-7
                    rounded-lg
                    flex items-center justify-center
                    text-gray-400
                    hover:bg-gray-100
                    hover:text-gray-700
                    transition
                  "
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div
              className="
                flex items-center
                gap-1
                p-1
                rounded-xl
                bg-white
                border border-gray-100
                shadow-sm
                overflow-x-auto
              "
            >
              <div className="px-2.5 text-gray-400">
                <SlidersHorizontal size={15} />
              </div>

              {[
                ["newest", "Newest"],
                ["high", "High Risk"],
                ["medium", "Medium"],
                ["low", "Low"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setSortMode(value)}
                  className={`
                    whitespace-nowrap
                    px-3 py-2
                    rounded-lg
                    text-[11px]
                    font-semibold
                    transition-all
                    ${
                      sortMode === value
                        ? "bg-green-600 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* STATS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<BriefcaseBusiness size={19} />}
              label="Total Cases"
              value={totalCases}
              description="All recorded cases"
            />

            <StatCard
              icon={<Activity size={19} />}
              label="Ongoing"
              value={ongoingCases}
              description="Cases currently in progress"
              iconClass="bg-amber-50 text-amber-700"
            />

            <StatCard
              icon={<AlertTriangle size={19} />}
              label="For Intervention"
              value={interventionCases}
              description="Cases requiring escalation"
              iconClass="bg-red-50 text-red-700"
            />

            <StatCard
              icon={<CheckCircle size={19} />}
              label="Intervention Ready"
              value={interventionReady}
              description="Ready for intervention"
              iconClass="bg-emerald-50 text-emerald-700"
            />
          </div>

          {/* SECTION HEADER */}

          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900">
                  Active Cases
                </h3>

                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] font-bold">
                  {visibleCases.length}
                </span>
              </div>

              <p className="text-[11px] text-gray-400 mt-1">
                Review and manage current student cases.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
              <RefreshCw size={12} />

              <span>Real-time synchronized</span>

              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          {/* CASES */}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="
                    h-[260px]
                    rounded-2xl
                    bg-white
                    border border-gray-100
                    animate-pulse
                  "
                />
              ))}
            </div>
          ) : visibleCases.length === 0 ? (
            <div
              className="
                rounded-2xl
                bg-white
                border border-gray-100
                p-14
                text-center
                shadow-sm
              "
            >
              <div
                className="
                  w-14 h-14
                  mx-auto
                  rounded-2xl
                  bg-gray-50
                  text-gray-400
                  flex items-center justify-center
                "
              >
                <ClipboardList size={24} />
              </div>

              <h3 className="font-bold text-gray-700 mt-4">No cases found</h3>

              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleCases.map((c) => (
                <CaseCard
                  key={c._id}
                  caseData={c}
                  onClick={() => setSelected(c)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* =================================================
          CASE MODAL
      ================================================= */}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0
              z-[500]
              bg-slate-950/40
              backdrop-blur-md
              flex items-center justify-center
              p-3 md:p-6
            "
            onClick={close}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 15,
                scale: 0.98,
              }}
              transition={{
                duration: 0.22,
              }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative
                w-full
                max-w-[1150px]
                max-h-[92vh]
                overflow-y-auto
                rounded-2xl
                bg-[#f7faf8]
                border border-gray-100
                shadow-[0_25px_100px_rgba(15,23,42,0.25)]
              "
            >
              {/* MODAL HEADER */}

              <div
                className="
                  sticky top-0 z-30
                  px-5 md:px-7
                  py-4
                  bg-white
                  border-b border-gray-100
                "
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="
                        w-11 h-11
                        rounded-xl
                        bg-green-600
                        text-white
                        flex items-center justify-center
                        shadow-sm
                        flex-shrink-0
                      "
                    >
                      <BriefcaseBusiness size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-green-700 font-bold">
                        Case Details
                      </p>

                      <h2 className="text-lg md:text-xl font-extrabold text-gray-900 truncate">
                        {selected.offense}
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={close}
                    className="
                      w-9 h-9
                      rounded-xl
                      bg-gray-50
                      border border-gray-100
                      hover:bg-gray-100
                      text-gray-500
                      flex items-center justify-center
                      transition
                      flex-shrink-0
                    "
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-5 md:p-7">
                {/* LAST ACTION */}

                <div
                  className={`
                    px-4 py-3
                    rounded-xl
                    border
                    mb-5
                    ${action.color}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Activity size={13} />

                    <p className="text-[11px] font-semibold">{action.text}</p>
                  </div>
                </div>

                {/* STUDENT HEADER */}

                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    border border-gray-100
                    p-5
                    shadow-sm
                  "
                >
                  <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-green-400/10 blur-3xl" />

                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <img
                        src={selected.student?.avatar || DEFAULT_AVATAR}
                        alt={selected.student?.name || "Student"}
                        className="
                          w-14 h-14
                          rounded-xl
                          object-cover
                          border border-gray-100
                          shadow-sm
                        "
                      />

                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900">
                          {selected.student?.name || "Unknown Student"}
                        </h3>

                        <p className="text-[11px] text-gray-400 mt-1">
                          {selected.student?.grade || "Grade N/A"}
                          {" • "}
                          {selected.student?.studentId || "No Student ID"}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <RiskBadge risk={ai?.risk || "LOW"} />

                          <StatusBadge status={getStatus(selected)} />
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                        Case Location
                      </p>

                      <div className="flex md:justify-end items-center gap-2 mt-2">
                        <MapPin size={13} className="text-green-600" />

                        <p className="text-xs font-semibold text-gray-700">
                          {selected.location || "Unknown location"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FLOW */}

                <div
                  className="
                    mt-5
                    p-5
                    rounded-2xl
                    bg-white
                    border border-gray-100
                    shadow-sm
                  "
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        Case Progress
                      </h3>

                      <p className="text-[10px] text-gray-400 mt-1">
                        Track the case workflow
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
                      <Activity size={14} />
                    </div>
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[720px] flex items-start">
                      {flowWithMeta.map((step, i) => (
                        <div key={step.key} className="flex-1 relative">
                          <div className="flex items-center">
                            <div
                              className={`
                                relative z-10
                                w-9 h-9
                                rounded-xl
                                flex items-center justify-center
                                border-2
                                ${
                                  step.done
                                    ? "bg-green-600 border-green-600 text-white"
                                    : "bg-white border-gray-200 text-gray-300"
                                }
                              `}
                            >
                              {step.done ? (
                                <CheckCircle size={15} />
                              ) : (
                                <CircleDot size={15} />
                              )}
                            </div>

                            {i !== flowWithMeta.length - 1 && (
                              <div
                                className={`
                                  h-1
                                  flex-1
                                  ${step.done ? "bg-green-400" : "bg-gray-200"}
                                `}
                              />
                            )}
                          </div>

                          <div className="pr-3 mt-3">
                            <p
                              className={`
                                text-[10px]
                                font-bold
                                ${step.done ? "text-gray-800" : "text-gray-400"}
                              `}
                            >
                              {step.label}
                            </p>

                            {step.time ? (
                              <p className="text-[8px] text-gray-400 mt-1">
                                {new Date(step.time).toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-[8px] text-gray-300 mt-1">
                                Pending
                              </p>
                            )}

                            {step.by && (
                              <p className="text-[8px] text-gray-400 mt-0.5">
                                by {step.by}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* INFO GRID */}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                  <InfoBlock
                    icon={<FileText size={14} />}
                    label="Offense"
                    value={selected.offense}
                  />

                  <InfoBlock
                    icon={<MapPin size={14} />}
                    label="Location"
                    value={selected.location}
                  />

                  <InfoBlock
                    icon={<User2 size={14} />}
                    label="Reporter"
                    value={selected.reporter}
                  />

                  <InfoBlock
                    icon={<Calendar size={14} />}
                    label="Created"
                    value={
                      selected.createdAt
                        ? new Date(selected.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "N/A"
                    }
                  />

                  <InfoBlock
                    icon={<FileText size={14} />}
                    label="Category"
                    value={selected.category}
                  />

                  <InfoBlock
                    icon={<Clock3 size={14} />}
                    label="Status"
                    value={getStatus(selected)}
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="
                        w-8 h-8
                        rounded-xl
                        bg-gray-100
                        text-gray-600
                        flex items-center justify-center
                      "
                    >
                      <FileText size={14} />
                    </div>

                    <p className="text-sm font-bold text-gray-700">
                      Incident Description
                    </p>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      bg-white
                      border border-gray-100
                      p-5
                      text-sm
                      leading-relaxed
                      text-gray-700
                      shadow-sm
                    "
                  >
                    {selected.description || "No description provided."}
                  </div>
                </div>

                {/* AI */}

                <div
                  className="
                    mt-5
                    relative
                    overflow-hidden
                    rounded-2xl
                    bg-gradient-to-br
                    from-green-50
                    via-white
                    to-emerald-50
                    border border-green-100
                    p-5
                  "
                >
                  <div className="absolute -right-10 -top-10 w-36 h-36 bg-green-300/10 blur-3xl rounded-full" />

                  <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            w-9 h-9
                            rounded-xl
                            bg-green-100
                            text-green-700
                            flex items-center justify-center
                          "
                        >
                          <Brain size={17} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            AI Case Analysis
                          </p>

                          <p className="text-[9px] text-gray-400">
                            Automated policy-based classification
                          </p>
                        </div>
                      </div>

                      <RiskBadge risk={ai?.risk || "LOW"} />
                    </div>

                    <div className="mt-4 bg-white rounded-xl p-4 border border-green-100">
                      <p className="text-sm leading-relaxed text-gray-700">
                        {ai?.insight}
                      </p>
                    </div>
                  </div>
                </div>

                {/* STATEMENT + EVIDENCE */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                  {/* STATEMENT */}

                  <div
                    className="
                      bg-white
                      border border-gray-100
                      rounded-2xl
                      p-5
                      shadow-sm
                    "
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="
                          w-9 h-9
                          rounded-xl
                          bg-purple-50
                          text-purple-700
                          flex items-center justify-center
                        "
                      >
                        <MessageSquare size={15} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          Student Statement
                        </p>

                        <p className="text-[9px] text-gray-400">
                          Recorded response
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4 min-h-[110px]">
                      <p className="text-sm leading-relaxed text-gray-600">
                        {selected.studentStatement ||
                          "No student statement recorded yet."}
                      </p>
                    </div>
                  </div>

                  {/* EVIDENCE */}

                  <div
                    className="
                      bg-white
                      border border-gray-100
                      rounded-2xl
                      p-5
                      shadow-sm
                    "
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="
                          w-9 h-9
                          rounded-xl
                          bg-blue-50
                          text-blue-700
                          flex items-center justify-center
                        "
                      >
                        <ImageIcon size={15} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          Evidence
                        </p>

                        <p className="text-[9px] text-gray-400">
                          Attached case files
                        </p>
                      </div>
                    </div>

                    {Array.isArray(selected.evidence) &&
                    selected.evidence.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {selected.evidence.map((e, i) => {
                          let parsed = e;

                          if (typeof e === "string") {
                            const urlMatch = e.match(/https?:\/\/[^\s'"}]+/);

                            parsed = {
                              url: urlMatch?.[0] || normalizeEvidenceUrl(e),
                              type: e.includes("video") ? "video" : "image",
                            };
                          }

                          const url = normalizeEvidenceUrl(parsed?.url);

                          if (!url) return null;

                          const isImage =
                            parsed?.type === "image" ||
                            /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

                          return (
                            <div key={i} className="relative">
                              {isImage ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(url)}
                                  className="w-full overflow-hidden rounded-xl"
                                >
                                  <img
                                    src={url}
                                    alt="Evidence"
                                    className="
                                      w-full
                                      h-24
                                      object-cover
                                      rounded-xl
                                      border border-gray-200
                                      hover:scale-[1.03]
                                      transition
                                    "
                                  />
                                </button>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="
                                    flex
                                    items-center
                                    justify-center
                                    h-24
                                    rounded-xl
                                    border border-gray-200
                                    bg-gray-50
                                    text-[10px]
                                    font-semibold
                                    text-gray-500
                                    hover:bg-gray-100
                                  "
                                >
                                  Open File
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-gray-50 p-5 text-center">
                        <ImageIcon
                          size={19}
                          className="mx-auto text-gray-300"
                        />

                        <p className="text-[10px] text-gray-400 mt-2">
                          No evidence attached
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* IMAGE PREVIEW */}

                <AnimatePresence>
                  {previewImage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="
                        fixed inset-0
                        z-[9999]
                        bg-black/80
                        backdrop-blur-sm
                        flex items-center
                        justify-center
                        p-6
                      "
                      onClick={() => setPreviewImage(null)}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImage(null)}
                        className="
                          absolute
                          top-5 right-5
                          w-11 h-11
                          rounded-xl
                          bg-white/10
                          text-white
                          flex items-center justify-center
                          hover:bg-white/20
                        "
                      >
                        <X size={22} />
                      </button>

                      <img
                        src={previewImage}
                        alt="Evidence Preview"
                        onClick={(e) => e.stopPropagation()}
                        className="
                          max-w-[95vw]
                          max-h-[90vh]
                          rounded-2xl
                          shadow-2xl
                          object-contain
                        "
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* REQUEST STATEMENT */}

                {(getStatus(selected) === "reviewing" ||
                  getStatus(selected) === "received") && (
                  <div
                    className="
                      mt-5
                      rounded-2xl
                      bg-purple-50
                      border border-purple-100
                      p-5
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          w-9 h-9
                          rounded-xl
                          bg-purple-100
                          text-purple-700
                          flex items-center justify-center
                        "
                      >
                        <MessageSquare size={15} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-purple-900">
                          Student Statement
                        </p>

                        <p className="text-[9px] text-purple-600 mt-0.5">
                          Request the student's explanation before proceeding.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={requestStudentStatement}
                      className="
                        mt-4
                        px-5
                        py-2.5
                        rounded-xl
                        bg-purple-600
                        hover:bg-purple-700
                        text-white
                        text-xs
                        font-bold
                        shadow-sm
                        transition
                      "
                    >
                      <MessageSquare size={13} className="inline mr-2" />
                      Request Student Statement
                    </button>

                    {requestSent && (
                      <p className="text-[10px] text-amber-700 mt-3 font-medium">
                        Waiting for student response...
                      </p>
                    )}
                  </div>
                )}

                {/* MANUAL STATEMENT */}

                {selected.statementStatus !== "manual_entry" &&
                  !selected.studentStatement && (
                    <div
                      className="
                        mt-5
                        rounded-2xl
                        bg-white
                        border border-gray-100
                        p-5
                        shadow-sm
                      "
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="
                            w-9 h-9
                            rounded-xl
                            bg-blue-50
                            text-blue-700
                            flex items-center justify-center
                          "
                        >
                          <FileText size={15} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            Manual Statement Entry
                          </p>

                          <p className="text-[9px] text-gray-400">
                            Record a statement manually if needed.
                          </p>
                        </div>
                      </div>

                      <textarea
                        value={studentInput}
                        onChange={(e) => setStudentInput(e.target.value)}
                        className="
                          w-full
                          min-h-[110px]
                          p-4
                          rounded-xl
                          bg-gray-50
                          border border-gray-200
                          outline-none
                          resize-none
                          text-sm
                          text-gray-700
                          focus:ring-2
                          focus:ring-green-500/10
                          focus:border-green-300
                        "
                        placeholder="Write student statement..."
                      />

                      <button
                        onClick={saveStudentStatement}
                        className="
                          mt-3
                          px-5
                          py-2.5
                          rounded-xl
                          bg-blue-600
                          hover:bg-blue-700
                          text-white
                          text-xs
                          font-bold
                          transition
                        "
                      >
                        Save Statement
                      </button>
                    </div>
                  )}

                {/* LOGS */}

                <div className="mt-5">
                  <div
                    className="
                      rounded-2xl
                      bg-white
                      border border-gray-100
                      p-5
                      shadow-sm
                    "
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="
                          w-9 h-9
                          rounded-xl
                          bg-gray-100
                          text-gray-600
                          flex items-center justify-center
                        "
                      >
                        <Clock3 size={15} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          Case Activity
                        </p>

                        <p className="text-[9px] text-gray-400">
                          Complete case history
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(selected.logs || [])
                        .slice()
                        .reverse()
                        .map((l, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className="
                                  w-8 h-8
                                  rounded-xl
                                  bg-green-50
                                  text-green-600
                                  flex items-center justify-center
                                "
                              >
                                <CircleCheck size={14} />
                              </div>

                              {i !== (selected.logs || []).length - 1 && (
                                <div className="w-px flex-1 bg-gray-200 mt-2" />
                              )}
                            </div>

                            <div className="pb-3 min-w-0">
                              <p className="text-sm font-bold text-gray-800">
                                {actionLabels[l.stage] || l.stage}
                              </p>

                              {l.note && (
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                  {l.note}
                                </p>
                              )}

                              <p className="text-[9px] text-gray-400 mt-2">
                                {l.changedByName
                                  ? `By ${l.changedByName} • `
                                  : ""}
                                {l.time
                                  ? new Date(l.time).toLocaleString()
                                  : "No date"}
                              </p>
                            </div>
                          </div>
                        ))}

                      {(!selected.logs || selected.logs.length === 0) && (
                        <p className="text-xs text-gray-400 text-center py-6">
                          No case activity recorded.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ESCALATION DETAILS */}

                {getStatus(selected) === "intervention-ready" && (
                  <div
                    className="
                      mt-5
                      rounded-2xl
                      bg-red-50
                      border border-red-100
                      p-5
                    "
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="
                          w-9 h-9
                          rounded-xl
                          bg-red-100
                          text-red-600
                          flex items-center justify-center
                        "
                      >
                        <AlertTriangle size={16} />
                      </div>

                      <div>
                        <h3 className="font-bold text-red-800 text-sm">
                          Escalation Details
                        </h3>

                        <p className="text-[9px] text-red-500 mt-0.5">
                          Information recorded during intervention referral
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoBlock
                        icon={<User2 size={14} />}
                        label="Involved Persons"
                        value={selected?.escalationInfo?.involvedPersons}
                      />

                      <InfoBlock
                        icon={<Users size={14} />}
                        label="Additional Participants"
                        value={selected?.escalationInfo?.additionalParticipants}
                      />

                      <InfoBlock
                        icon={<CheckCircle size={14} />}
                        label="Approval Details"
                        value={selected?.escalationInfo?.approvalDetails}
                      />
                    </div>
                  </div>
                )}

                {/* ESCALATION INPUT */}

                {canEscalate(selected) && (
                  <div
                    className="
                      mt-5
                      rounded-2xl
                      bg-red-50
                      border border-red-100
                      p-5
                    "
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className="
                          w-9 h-9
                          rounded-xl
                          bg-red-100
                          text-red-600
                          flex items-center justify-center
                        "
                      >
                        <AlertTriangle size={16} />
                      </div>

                      <div>
                        <h3 className="font-bold text-red-800 text-sm">
                          Escalation Information
                        </h3>

                        <p className="text-[9px] text-red-500 mt-0.5">
                          Required when referring this case for intervention.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                          Involved Persons
                        </label>

                        <textarea
                          value={involvedPersons}
                          onChange={(e) => setInvolvedPersons(e.target.value)}
                          placeholder="List primary involved persons..."
                          className="
                            mt-2
                            w-full
                            min-h-[90px]
                            p-4
                            rounded-xl
                            bg-white
                            border border-gray-200
                            outline-none
                            resize-none
                            text-sm
                            focus:ring-2
                            focus:ring-red-500/10
                            focus:border-red-200
                          "
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                          Additional Participants
                        </label>

                        <textarea
                          value={additionalParticipants}
                          onChange={(e) =>
                            setAdditionalParticipants(e.target.value)
                          }
                          placeholder="Witnesses, classmates, faculty, etc..."
                          className="
                            mt-2
                            w-full
                            min-h-[90px]
                            p-4
                            rounded-xl
                            bg-white
                            border border-gray-200
                            outline-none
                            resize-none
                            text-sm
                            focus:ring-2
                            focus:ring-red-500/10
                            focus:border-red-200
                          "
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                          Approval Details
                        </label>

                        <textarea
                          value={approvalDetails}
                          onChange={(e) => setApprovalDetails(e.target.value)}
                          placeholder="Guidance approval / dean approval / remarks..."
                          className="
                            mt-2
                            w-full
                            min-h-[90px]
                            p-4
                            rounded-xl
                            bg-white
                            border border-gray-200
                            outline-none
                            resize-none
                            text-sm
                            focus:ring-2
                            focus:ring-red-500/10
                            focus:border-red-200
                          "
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ADMIN NOTE */}

                <div className="mt-5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500">
                    Admin Note
                  </label>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="
                      mt-2
                      w-full
                      min-h-[100px]
                      p-4
                      rounded-xl
                      bg-white
                      border border-gray-200
                      outline-none
                      resize-none
                      text-sm
                      focus:ring-2
                      focus:ring-green-500/10
                      focus:border-green-300
                    "
                    placeholder="Add a note explaining this case action..."
                  />
                </div>

                {/* ACTIONS */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pb-2">
                  <button
                    onClick={() => updateStatus("reviewing")}
                    disabled={!canReview(selected)}
                    className={`
                      py-3
                      rounded-xl
                      flex items-center justify-center gap-2
                      text-xs
                      font-bold
                      transition
                      ${
                        canReview(selected)
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <Eye size={15} />
                    Review Case
                  </button>

                  <button
                    onClick={() => updateStatus("refer-for-intervention")}
                    disabled={!canEscalate(selected)}
                    className={`
                      py-3
                      rounded-xl
                      flex items-center justify-center gap-2
                      text-xs
                      font-bold
                      transition
                      ${
                        canEscalate(selected)
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <AlertTriangle size={15} />
                    Refer Intervention
                  </button>

                  <button
                    onClick={() => updateStatus("intervention-ready")}
                    disabled={!canIntervene(selected)}
                    className={`
                      py-3
                      rounded-xl
                      flex items-center justify-center gap-2
                      text-xs
                      font-bold
                      transition
                      ${
                        canIntervene(selected)
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <CheckCircle size={15} />
                    Intervention Ready
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
