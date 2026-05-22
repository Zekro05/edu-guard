import { useState, useMemo, useEffect } from "react";
import { io } from "socket.io-client";
import {
  Search,
  Brain,
  X,
  Image,
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
  Gavel,
  Bell, Sparkles
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { getFileUrl } from "../utils/getBaseUrl";

/* ================= SOCKET ================= */
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");


/* ================= NAV COMPONENT ================= */
const Nav = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition ${
      active
        ? "bg-green-50 text-green-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

/* ================= AI ENGINE ================= */
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

const normalize = (str = "") =>
  str.toLowerCase().trim();

const findMatch = (text, list = []) =>
  list.find((item) => text.includes(normalize(item)));

const classifyCase = (c = {}) => {
  const text = normalize(
    [
      c.offense,
      c.category,
      c.title,
      c.description,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const matchedMajor = findMatch(text, offenseMap.MAJOR);
  const matchedMinor = findMatch(text, offenseMap.MINOR);

  // =========================
  // HIGH RISK
  // =========================
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

  const isCritical = criticalKeywords.some((k) =>
    text.includes(normalize(k))
  );

  if (matchedMajor && isCritical) {
    return {
      risk: "HIGH",
      severity: "CRITICAL MAJOR OFFENSE",
      insight: `Critical violation detected (${matchedMajor}). Immediate intervention recommended.`,
    };
  }

  // =========================
  // MEDIUM RISK
  // =========================
  if (matchedMajor) {
    return {
      risk: "MEDIUM",
      severity: "MAJOR OFFENSE",
      insight: `Major offense detected (${matchedMajor}). Guidance review and escalation may be required.`,
    };
  }

  // =========================
  // LOW RISK
  // =========================
  if (matchedMinor) {
    return {
      risk: "LOW",
      severity: "MINOR OFFENSE",
      insight: `Minor offense detected (${matchedMinor}). Monitor student behavior and apply corrective action.`,
    };
  }

  // =========================
  // UNKNOWN
  // =========================
  return {
    risk: "LOW",
    severity: "UNCLASSIFIED",
    insight:
      "No direct policy match found. Manual review recommended.",
  };
};

/* ================= FLOW ================= */
const flow = [
  "received",
  "saved-student-statement",
  "reviewing",
  "refer-for-intervention",
  "intervention-ready",
];


const stepIndex = (status) => flow.indexOf(status);

const canSaveStatement = (c) =>
  getStatus(c) === "received";

const canReview = (c) => {
  const status = getStatus(c);
  console.log("canReview status:", status);

  return status === "saved-student-statement";
};

const canEscalate = (c) =>
  getStatus(c) === "reviewing";

const canIntervene = (c) =>
  getStatus(c) === "refer-for-intervention";

const statusUI = {
  received: "from-blue-300 to-cyan-200",
  reviewing: "from-yellow-300 to-orange-300",
  "saved-student-statement": "from-purple-300 to-indigo-300",
  "refer-for-intervention": "from-red-300 to-pink-300",
  "intervention-ready": "from-green-300 to-emerald-300",
};

/* ================= NORMALIZER ================= */
const normalizeCase = (c) => {
  let evidence = [];

  try {
    if (Array.isArray(c.evidence)) {
      evidence = c.evidence
        .map((e) => {
          // CASE 1: already correct object
          if (e && typeof e === "object" && e.url) {
            return e;
          }

          // CASE 2: string (Cloudinary or broken string)
          if (typeof e === "string") {
            const urlMatch = e.match(/https?:\/\/[^\s'"}]+/);

            return {
              url: urlMatch?.[0],
              type: urlMatch?.[0]?.includes("video")
                ? "video"
                : "image",
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

    // =========================
    // FLATTEN IMPORTANT FIELDS
    // =========================
    offense:
      c.offense ||
      c.reportId?.offense ||
      c.report?.offense ||
      c.title ||
      "Unknown Offense",

    category:
      c.category ||
      c.reportId?.category ||
      c.report?.category ||
      "",

    title:
      c.title ||
      c.reportId?.title ||
      c.report?.title ||
      "",

    description:
      c.description ||
      c.reportId?.description ||
      c.report?.description ||
      "",

    // =========================
    // STUDENT
    // =========================
    student: c.studentId
      ? {
          name: `${c.studentId.firstName || ""} ${c.studentId.lastName || ""}`,
          avatar: c.studentId.profilePhoto,
          grade: c.studentId.grade,
          section: c.studentId.section,
          studentId: c.studentId.studentId,
        }
      : c.student || {},

    // =========================
    // OTHER FIELDS
    // =========================
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

/* ================= UI HELPERS ================= */
const categoryColor = (cat = "") => {
  const c = cat.toLowerCase();
  if (c.includes("bully")) return "bg-purple-100 text-purple-700 border-purple-200";
  if (c.includes("fight")) return "bg-red-100 text-red-700 border-red-200";
  if (c.includes("theft")) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const severityColor = (lvl = "Low") => {
  if (lvl === "HIGH") return "text-red-500";
  if (lvl === "MEDIUM") return "text-yellow-500";
  return "text-green-500";
};

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const normalizeEvidenceUrl = (url) => {
  if (!url) return null;

  // Cloudinary already full URL
  if (url.includes("cloudinary")) return url;

  // old local format
  if (url.startsWith("/uploads")) {
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${url}`;
  }

  return url;
};

/* ================= MAIN ================= */
export default function CaseManagement() {
  const navigate = useNavigate();

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

const [involvedPersons, setInvolvedPersons] = useState("");
const [additionalParticipants, setAdditionalParticipants] = useState("");
const [approvalDetails, setApprovalDetails] = useState("");

const [sortMode, setSortMode] = useState("newest");

const getSortedCases = (list) => {
  const getTime = (c) =>
    new Date(c.createdAt || c.updatedAt || 0).getTime();

  const getRisk = (c) => {
    const ai = classifyCase(c);
    if (ai.risk === "HIGH") return 3;
    if (ai.risk === "MEDIUM") return 2;
    return 1;
  };

  const sorted = [...list];

  switch (sortMode) {
    case "high":
      return sorted.sort(
        (a, b) => getRisk(b) - getRisk(a) || getTime(b) - getTime(a)
      );

    case "medium":
      return sorted.sort(
        (a, b) => {
          const riskA = getRisk(a);
          const riskB = getRisk(b);

          // prioritize MEDIUM first
          const scoreA = riskA === 2 ? 3 : riskA;
          const scoreB = riskB === 2 ? 3 : riskB;

          return scoreB - scoreA || getTime(b) - getTime(a);
        }
      );

    case "low":
      return sorted.sort(
        (a, b) => getRisk(a) - getRisk(b) || getTime(b) - getTime(a)
      );

    case "newest":
    default:
      return sorted.sort((a, b) => getTime(b) - getTime(a));
  }
};

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
  received: "text-gray-600 bg-gray-100",
  reviewing: "text-orange-600 bg-orange-100",
  waiting_for_student: "text-blue-600 bg-blue-100",
  "refer-for-intervention": "text-red-600 bg-red-100",
  "intervention-ready": "text-green-600 bg-green-100",
  completed: "text-purple-600 bg-purple-100",
};


const getLatestLog = (logs = []) =>
  [...logs].sort((a, b) => new Date(b.time) - new Date(a.time))[0];

const lastLog = getLatestLog(selected?.caseLogs);

const action = lastLog
  ? {
      text: `${actionLabels[lastLog.stage] || lastLog.stage} by ${
        lastLog.changedByName || "N/A"
      }`,
      color: actionColors[lastLog.stage] || "text-gray-600 bg-gray-100",
    }
  : {
      text: "No Actions Yet",
      color: "text-gray-500 bg-gray-100",
    };
  
  const loggedInUser =
  JSON.parse(localStorage.getItem("user"))?.name ||
  "Zekro Admin";

  const close = () => {
    setSelected(null);
    setNote("");
    setStudentInput("");
    setRequestSent(false);
  };

  const logout = () => navigate("/login");

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

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
        console.error(err);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  useEffect(() => {
    socket.on("caseUpdated", (updatedCase) => {
      const norm = normalizeCase(updatedCase);

      setCases((prev) =>
        prev.map((c) => (c._id === norm._id ? norm : c))
      );

      setSelected((prev) =>
        prev && prev._id === norm._id ? norm : prev
      );
    });

    socket.on("caseCreated", (newCase) => {
      setCases((prev) => [normalizeCase(newCase), ...prev]);
    });

    socket.on("caseLogAdded", ({ caseId, log }) => {
      setCases((prev) =>
        prev.map((c) =>
          c._id === caseId
            ? { ...c, logs: [...(c.logs || []), log] }
            : c
        )
      );

      setSelected((prev) =>
        prev && prev._id === caseId
          ? { ...prev, logs: [...(prev.logs || []), log] }
          : prev
      );
    });

    return () => socket.off();
  }, []);

  const ai = useMemo(() => {
  if (!selected) return null;
  return classifyCase(selected);
}, [selected]);

  const getStatus = (c) => c?.status || "received";

  const stepIndex = (status) => flow.indexOf(status);

  const canSaveStatement = (selected) =>
    getStatus(selected) === "received";

  const canReview = (selected) =>
    getStatus(selected) === "saved-student-statement";

  const canEscalate = (selected) =>
    getStatus(selected) === "reviewing";

  const canIntervene = (selected) =>
    getStatus(selected) === "refer-for-intervention";

  const progressIndex = (status) => flow.indexOf(status);

  const updateStatus = async (status) => {
  if (!note.trim()) {
    return alert("Admin note required.");
  }

  const payload = {
    status,
    note,
    changedByName: loggedInUser,
  };

  // ONLY include escalation info when referring for intervention
  if (status === "refer-for-intervention") {
    payload.escalationInfo = {
      involvedPersons,
      additionalParticipants,
      approvalDetails,
    };
  }

  const res = await API.put(
    `/api/incidents/${selected._id}/status`,
    payload
  );

  const updated = normalizeCase(res.data.incident);

  setSelected(updated);

  setCases((prev) =>
    prev.map((c) => (c._id === updated._id ? updated : c))
  );

  // reset fields
  setNote("");
  setInvolvedPersons("");
  setAdditionalParticipants("");
  setApprovalDetails("");
};

  const requestStudentStatement = async () => {
    const res = await API.put(
      `/api/incidents/${selected._id}/request-statement`,
      { note, changedByName: loggedInUser }
    );

    const updated = normalizeCase(res.data.incident);

    setSelected(updated);
    setCases((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );

    setRequestSent(true);
    setNote("");
  };

  const saveStudentStatement = async () => {
  try {
    if (!studentInput.trim()) {
      alert("Statement cannot be empty");
      return;
    }

    const res = await API.put(
      `/api/incidents/${selected._id}/manual-statement`,
      { statement: studentInput, changedByName: loggedInUser,stage: "student_statement_saved"
 }
    );

    const updated = normalizeCase(res.data.incident);

    setSelected(updated);

    setCases((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );

    setStudentInput("");

    console.log("✅ Statement saved:", updated);
  } catch (err) {
    console.error("❌ Save failed:", err);
    alert(err?.response?.data?.message || "Failed to save statement");
  }
};

const flowWithMeta = flow.map((step) => {
  const log = (selected?.logs || [])
    .filter((l) => l.stage === step)
    .sort((a, b) => new Date(b.time) - new Date(a.time))[0];

  return {
    key: step,
    label: actionLabels?.[step] || step,
    time: log?.time,
    by: log?.changedByName,
    done: stepIndex(getStatus(selected)) >= stepIndex(step),
  };
});

  return (
    <div className="h-screen w-screen bg-gray-50 text-gray-900 flex">

      {/* SIDEBAR */}
      <aside className="w-72 h-full bg-white p-6 flex flex-col justify-between border-r border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-green-600">GuidEd</h1>

          <p className="text-xs text-gray-500 mb-6">
            Our Lady of the Holy Rosary - General Trias Cavite
          </p>

          <Nav icon={<LayoutDashboard />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <Nav icon={<Users />} label="Students" onClick={() => navigate("/students")} />
          <Nav icon={<ShieldX />} label="Guidance" onClick={() => navigate("/guidance")} />
          <Nav icon={<ChartNoAxesCombined />} label="Cases" active />
          <Nav icon={<Gavel size={18} />} label="Interventions" onClick={() => navigate("/interventions")} />
          <Nav icon={<Settings />} label="Settings" onClick={() => navigate("/settings")} />
        </div>

        <button onClick={logout} className="bg-green-500 text-white py-2 rounded-xl">
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* HEADER (INTERVENTION STYLE) */}
<div
  className="
     top-0 z-30
    px-8 py-6
    border-b border-white/20
    bg-white/50 backdrop-blur-2xl
  "
>
  <div className="flex justify-between items-start">

    {/* TITLE */}
    <div>
      <h2 className="text-4xl font-black tracking-tight">
        Case Management
      </h2>

      <p className="text-gray-500 mt-2">
        Manage student incidents, case progress,
        evidence, and escalation workflows
      </p>
    </div>

    {/* NOTIFICATIONS */}
    <div className="relative">

      <button
        onClick={() => setOpenNotif(!openNotif)}
        className="
          w-12 h-12 rounded-2xl
          bg-white/60 backdrop-blur-xl
          border border-white/30
          shadow-sm
          flex items-center justify-center
          hover:scale-105 transition
        "
      >
        <Bell size={18} />
      </button>

      {notifications.length > 0 && (
        <span
          className="
            absolute -top-1 -right-1
            min-w-[20px] h-5 px-1
            rounded-full bg-red-500 text-white
            text-[11px] font-bold
            flex items-center justify-center
          "
        >
          {notifications.length}
        </span>
      )}

      <AnimatePresence>
        {openNotif && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="
              absolute right-0 mt-4 w-96
              bg-white/70 backdrop-blur-2xl
              border border-white/30
              rounded-3xl overflow-hidden
              shadow-2xl z-50
            "
          >
            <div className="p-5 border-b border-white/20 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">
                  Notifications
                </h3>
                <p className="text-xs text-gray-500">
                  Case updates
                </p>
              </div>

              <Sparkles size={16} className="text-green-600" />
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    whileHover={{ x: 4 }}
                    className="
                      p-5 border-b border-white/20
                      hover:bg-white/30 transition
                    "
                  >
                    <p className="font-semibold text-sm text-gray-900">
                      {n.title}
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {n.text}
                    </p>

                    <div className="flex justify-between mt-3">
                      <span className="text-xs text-green-700 font-medium">
                        {n.student}
                      </span>

                      <span className="text-xs text-gray-400">
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
</div>



{/* SEARCH BAR */}
<div
  className="
    flex items-center gap-3
    px-5 py-4 mb-6
    rounded-2xl
    bg-white/60 backdrop-blur-xl
    border border-white/30
    max-w-xl
  "
>
  <Search size={18} className="text-gray-400" />

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search student, offense, or status..."
    className="w-full bg-transparent outline-none text-sm"
  />
</div>

{/* STATS (INTERVENTION STYLE) */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

  <div className="bg-white/45 backdrop-blur-2xl border border-white/30 rounded-[2rem] p-6 shadow-sm">
    <p className="text-sm text-gray-500">Total Cases</p>
    <h2 className="text-3xl font-black mt-2">{cases.length}</h2>
  </div>

  <div className="bg-white/45 backdrop-blur-2xl border border-white/30 rounded-[2rem] p-6 shadow-sm">
    <p className="text-sm text-gray-500">Ongoing</p>
    <h2 className="text-3xl font-black mt-2 text-yellow-600">
      {cases.filter(c => getStatus(c) === "reviewing" || getStatus(c) === "received").length}
    </h2>
  </div>

  <div className="bg-white/45 backdrop-blur-2xl border border-white/30 rounded-[2rem] p-6 shadow-sm">
    <p className="text-sm text-gray-500">Refer for Intervention</p>
    <h2 className="text-3xl font-black mt-2 text-red-600">
      {cases.filter(c => getStatus(c) === "refer-for-intervention").length}
    </h2>
  </div>

  <div className="bg-white/45 backdrop-blur-2xl border border-white/30 rounded-[2rem] p-6 shadow-sm">
    <p className="text-sm text-gray-500">Intervention Ready</p>
    <h2 className="text-3xl font-black mt-2 text-green-600">
      {cases.filter(c => getStatus(c) === "intervention-ready").length}
    </h2>
  </div>

</div>

<div className="flex gap-2 mb-4">
  <button
    onClick={() => setSortMode("newest")}
    className={`px-3 py-1 rounded-lg text-sm ${
      sortMode === "newest"
        ? "bg-green-500 text-white"
        : "bg-gray-100"
    }`}
  >
    Newest
  </button>

  <button
    onClick={() => setSortMode("high")}
    className={`px-3 py-1 rounded-lg text-sm ${
      sortMode === "high"
        ? "bg-red-500 text-white"
        : "bg-gray-100"
    }`}
  >
    High Risk
  </button>

  <button
    onClick={() => setSortMode("medium")}
    className={`px-3 py-1 rounded-lg text-sm ${
      sortMode === "medium"
        ? "bg-yellow-500 text-white"
        : "bg-gray-100"
    }`}
  >
    Medium Priority
  </button>

  <button
    onClick={() => setSortMode("low")}
    className={`px-3 py-1 rounded-lg text-sm ${
      sortMode === "low"
        ? "bg-blue-500 text-white"
        : "bg-gray-100"
    }`}
  >
    Low Priority
  </button>
</div>

        {loading ? (
          <p className="text-gray-500">Loading cases...</p>
        ) : (
          <div className="grid grid-cols-3 gap-5">

            
            {[...cases]
  .filter((c) => {
    const keyword = search.toLowerCase();

    return (
      c.student?.name?.toLowerCase().includes(keyword) ||
      c.offense?.toLowerCase().includes(keyword) ||
      c.status?.toLowerCase().includes(keyword)
    );
  })
  .sort((a, b) => {
    const getTime = (c) =>
      new Date(c.createdAt || c.updatedAt || 0).getTime();

    const getRisk = (c) => {
      const ai = classifyCase(c);
      if (ai.risk === "HIGH") return 3;
      if (ai.risk === "MEDIUM") return 2;
      return 1;
    };

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

    // default: newest
    return getTime(b) - getTime(a);
  })
  .map((c) => {
              const ai = classifyCase(c);
              const severity = ai.risk;
              const student = c.student || {};
              const status = getStatus(c);

              return (
                <div
                  key={c._id}
                  onClick={() => setSelected(c)}
                  className="p-5 rounded-xl bg-white border border-gray-200 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar || DEFAULT_AVATAR}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-xs text-gray-500">{c.offense}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
  AI Risk:
  <span
    className={`ml-1 font-semibold ${
      severity === "HIGH"
        ? "text-red-500"
        : severity === "MEDIUM"
        ? "text-yellow-500"
        : "text-green-500"
    }`}
  >
    {severity}
  </span>
</div>

                  <div className={`mt-3 h-1 w-full rounded-full bg-gradient-to-r ${statusUI[status]}`} />
                  <p className="text-[10px] mt-2 text-gray-500 uppercase">
                    {status}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= MODAL (FULL ORIGINAL RESTORED) ================= */}
      
      {selected && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-6"
          onClick={close}
        >
          <div
  className="w-[1000px] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl relative"
  onClick={(e) => e.stopPropagation()}
>

            <button
              onClick={close}
              className="absolute right-6 top-6 text-gray-500 hover:text-black"
            >
              <X />
            </button>

           <div className={`mb-4 p-2 rounded-lg ${action.color}`}>
  <p className="text-xs">
    {action.text}
  </p>
</div>

            {/* HEADER */}
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <img
                  src={selected.student?.avatar || DEFAULT_AVATAR}
                  className="w-14 h-14 rounded-full border border-gray-200 object-cover"
                />

                <div>
                  <h2 className="text-xl font-bold text-green-600">
                    {selected.student?.name}
                  </h2>

                  <p className="text-xs text-gray-500 mt-2">
                    {selected.student?.grade} • {selected.student?.studentId}
                  </p>

                  <p className={`text-xs mt-1 font-semibold ${severityColor(ai?.risk)}`}>
                    Severity: {ai?.risk}
                  </p>

                   
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">STATUS</p>
                <p className="text-green-600 uppercase tracking-widest text-sm">
                  {getStatus(selected)}
                </p>

                <p className="text-sm font-semibold">
                  {selected.title}
                </p>

                <span className={`text-xs px-2 py-1 rounded-full border inline-block mt-1 ${categoryColor(selected.category)}`}>
                  {selected.location}
                </span>
              </div>
            </div>

            

            {/* FLOW (ENHANCED TIMELINE) */}
<div className="mt-6 relative">

  <div className="flex items-start justify-between gap-4">
    {flowWithMeta.map((step, i) => (
      <div key={step.key} className="flex-1 flex flex-col items-center text-center">

        {/* DOT + LINE */}
        <div className="flex items-center w-full">
          <div
            className={`w-3 h-3 rounded-full z-10 ${
              step.done ? "bg-green-500" : "bg-gray-300"
            }`}
          />

          {i !== flowWithMeta.length - 1 && (
            <div
              className={`h-[2px] flex-1 ${
                step.done ? "bg-green-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>

        {/* LABEL */}
        <p className="text-[11px] font-semibold mt-2 text-gray-700">
          {step.label}
        </p>

        {/* DATE */}
        {step.time ? (
          <p className="text-[10px] text-gray-400">
            {new Date(step.time).toLocaleString()}
          </p>
        ) : (
          <p className="text-[10px] text-gray-300">No date</p>
        )}

        {/* BY */}
        {step.by && (
          <p className="text-[10px] text-gray-400">
            by {step.by}
          </p>
        )}
      </div>
    ))}
  </div>

</div>

            {/* AI */}
            <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Brain size={14} /> AI Analysis
              </p>
              <p className="mt-2 text-sm text-gray-800">
                {ai?.insight}
              </p>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-2 gap-4 mt-6">

              <div className="p-4 rounded-xl bg-white border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Reporter</p>
                <p className="text-sm">{selected.reporter}</p>

                <p className="text-xs text-gray-500 mt-4">Student Statement</p>
                <p className="text-sm text-gray-700 mt-1">
                  {selected.studentStatement}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200">
                <p className="text-xs text-gray-500 mb-2 flex gap-2">
                  <Image size={14} /> Evidence
                </p>

                {Array.isArray(selected.evidence) && selected.evidence.length > 0 ? (
  <div className="grid grid-cols-3 gap-2">
    {selected.evidence.map((e, i) => {
      let parsed = e;

      // CASE 1: already object
      if (typeof e === "object" && e !== null) {
        parsed = e;
      }

      // CASE 2: malformed string from MongoDB
      else if (typeof e === "string") {
        // extract cloudinary/local URL
        const urlMatch = e.match(/https?:\/\/[^\s'"}]+/);

        // detect type
        const typeMatch = e.match(/type:\s*'([^']+)'/);

        parsed = {
          url: urlMatch?.[0] || null,
          type: typeMatch?.[1] || "image",
        };
      }

      if (!parsed?.url) return null;

      const isImage =
        parsed.type === "image" ||
        /\.(jpg|jpeg|png|webp|gif)$/i.test(parsed.url);

      return (
        <div key={i} className="relative">
          {isImage ? (
            <img
  src={parsed.url}
  alt="evidence"
  onClick={() => setPreviewImage(parsed.url)}
  className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition"
/>
          ) : (
            <a
              href={parsed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-24 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-600"
            >
              Open File
            </a>
          )}
        </div>
      );
    })}
  </div>
) : (
  <p className="text-xs text-gray-500">No evidence attached</p>
)}
              </div>
            </div>

            

            {/* IMAGE PREVIEW MODAL */}
{previewImage && (
  <div
    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
    onClick={() => setPreviewImage(null)}
  >
    {/* CLOSE BUTTON */}
    <button
      onClick={() => setPreviewImage(null)}
      className="absolute top-6 right-6 text-white hover:text-gray-300"
    >
      <X size={32} />
    </button>

    {/* IMAGE */}
    <img
      src={previewImage}
      alt="Preview"
      onClick={(e) => e.stopPropagation()}
      className="max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
    />
  </div>
)}

            {/* REQUEST */}
            {(getStatus(selected) === "reviewing" || getStatus(selected) === "received") && (
              <button
                onClick={requestStudentStatement}
                className="mt-5 px-4 py-2 bg-purple-500 text-white rounded-xl"
              >
                <MessageSquare size={14} className="inline mr-1" />
                Request Student Statement
              </button>
            )}

            {requestSent && (
              <p className="text-xs text-yellow-600 mt-2">
                Waiting for student response...
              </p>
            )}

            {/* MANUAL INPUT */}
{selected.statementStatus !== "manual_entry" && !selected.studentStatement && (
  <div className="mt-5">
    <p className="text-xs text-gray-500 mb-2">
      Manual Student Statement Entry
    </p>

    <textarea
      value={studentInput}
      onChange={(e) => setStudentInput(e.target.value)}
      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
      placeholder="Write student statement..."
    />

    <button
      onClick={saveStudentStatement}
      className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl"
    >
      Save Statement
    </button>
  </div>
)}

          {/* LOGS + ESCALATION WRAPPER */}
<div className="mt-6 grid grid-cols-2 gap-6 items-start">

  {/* LOGS (LEFT - 2 columns) */}
  <div className="col-span-1">
    <div className="p-4 rounded-2xl border border-gray-200 bg-white h-full">

      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Case Logs
      </h3>

      <div className="space-y-4">
        {(selected.logs || []).map((l, i) => (
          <div key={i} className="border-l-2 border-gray-200 pl-4">
            <p className="text-sm font-medium text-gray-800">{l.stage}</p>
            <p className="text-xs text-gray-500">{l.note}</p>
            <p className="text-[10px] text-gray-400">
              {l.changedByName ? `By ${l.changedByName} • ` : ""}
              {new Date(l.time).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* ESCALATION (RIGHT - 1 column) */}
  {getStatus(selected) === "intervention-ready" && (
  <div className="col-span-1 p-4 rounded-2xl border border-red-200 bg-red-50 h-fit">

    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="text-red-500" size={18} />
      <h3 className="font-semibold text-red-700">
        Escalation Details
      </h3>
    </div>

    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500">Involved Persons</p>
        <p className="text-sm text-gray-800 mt-1">
          {selected?.escalationInfo?.involvedPersons || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Additional Participants</p>
        <p className="text-sm text-gray-800 mt-1">
          {selected?.escalationInfo?.additionalParticipants || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Approval Details</p>
        <p className="text-sm text-gray-800 mt-1">
          {selected?.escalationInfo?.approvalDetails || "N/A"}
        </p>
      </div>
    </div>

  </div>
)}

</div>
            {/* ESCALATION INFORMATION */}
{canEscalate(selected) && (
  <div className="mt-6 p-5 rounded-2xl border border-red-200 bg-red-50">
    
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="text-red-500" size={18} />
      <h3 className="font-semibold text-red-700">
        Escalation Information
      </h3>
    </div>

    <div className="grid grid-cols-1 gap-4">

      {/* INVOLVED PERSONS */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Involved Persons
        </p>

        <textarea
          value={involvedPersons}
          onChange={(e) => setInvolvedPersons(e.target.value)}
          placeholder="List primary involved persons..."
          className="w-full p-3 rounded-xl border border-gray-200 text-sm"
        />
      </div>

      {/* ADDITIONAL PARTICIPANTS */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Additional Participants
        </p>

        <textarea
          value={additionalParticipants}
          onChange={(e) =>
            setAdditionalParticipants(e.target.value)
          }
          placeholder="Witnesses, classmates, faculty, etc..."
          className="w-full p-3 rounded-xl border border-gray-200 text-sm"
        />
      </div>

      {/* APPROVAL DETAILS */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Approval Details
        </p>

        <textarea
          value={approvalDetails}
          onChange={(e) => setApprovalDetails(e.target.value)}
          placeholder="Guidance approval / dean approval / remarks..."
          className="w-full p-3 rounded-xl border border-gray-200 text-sm"
        />
      </div>

    </div>
  </div>
)}



            {/* ACTIONS */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mt-6 p-3 rounded-xl border border-gray-200 text-sm"
              placeholder="Admin note..."
            />

            <div className="grid grid-cols-3 gap-3 mt-4">

              <button
                onClick={() => updateStatus("reviewing")}
                disabled={!canReview(selected)}
                className={`py-2 rounded-xl text-white ${
                  canReview(selected)
                    ? "bg-yellow-500"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <Eye size={14} className="inline mr-1" /> Review
              </button>

              <button
                onClick={() => updateStatus("refer-for-intervention")}
                disabled={!canEscalate(selected)}
                className={`py-2 rounded-xl text-white ${
                  canEscalate(selected)
                    ? "bg-lime-500"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <AlertTriangle size={14} className="inline mr-1" /> Refer Intervention
              </button>

              <button
                onClick={() => updateStatus("intervention-ready")}
                disabled={!canIntervene(selected)}
                className={`py-2 rounded-xl text-white ${
                  canIntervene(selected)
                    ? "bg-green-500"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <CheckCircle size={14} className="inline mr-1" /> Intervention
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}