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
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { API } from "../store/authStore";
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
const aiAnalyze = (text = "") => {
  const t = text.toLowerCase();

  if (t.includes("bullying"))
    return {
      risk: "HIGH",
      insight:
        "Repeated behavioral aggression detected. Requires immediate review before escalation.",
    };

  if (t.includes("fighting"))
    return {
      risk: "HIGH",
      insight:
        "Physical conflict detected. Safety-sensitive case requiring urgent review.",
    };

  return {
    risk: "LOW",
    insight: "Minor behavioral concern under monitoring stage.",
  };
};

/* ================= FLOW ================= */
const flow = [
  "received",
  "reviewing",
  "waiting_for_student",
  "escalated",
  "intervention-ready",
];

const statusUI = {
  received: "from-blue-300 to-cyan-200",
  reviewing: "from-yellow-300 to-orange-300",
  waiting_for_student: "from-purple-300 to-indigo-300",
  escalated: "from-red-300 to-pink-300",
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
    student: c.studentId
      ? {
          name: `${c.studentId.firstName || ""} ${c.studentId.lastName || ""}`,
          avatar: c.studentId.profilePhoto,
          grade: c.studentId.grade,
          section: c.studentId.section,
        }
      : c.student || {},
    status: c.caseStatus || c.status || "received",
    logs: c.caseLogs || [],
    evidence,
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
  if (lvl === "High") return "text-red-500";
  if (lvl === "Medium") return "text-yellow-500";
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
    return aiAnalyze(selected.offense || "");
  }, [selected]);

  const getStatus = (c) => c?.status || c?.caseStatus || "received";
  const progressIndex = (status) => flow.indexOf(status);

  const updateStatus = async (status) => {
    if (!note.trim()) return alert("Admin note required.");

    const res = await API.put(
      `/api/incidents/${selected._id}/status`,
      { status, note }
    );

    const updated = normalizeCase(res.data.incident);
    updated.status = status;

    setSelected(updated);
    setCases((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );

    setNote("");
  };

  const requestStudentStatement = async () => {
    const res = await API.put(
      `/api/incidents/${selected._id}/request-statement`,
      { note }
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
    const res = await API.put(
      `/api/incidents/${selected._id}/manual-statement`,
      { statement: studentInput }
    );

    const updated = normalizeCase(res.data.incident);

    setSelected(updated);
    setCases((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );

    setStudentInput("");
  };

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

        {loading ? (
          <p className="text-gray-500">Loading cases...</p>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {cases.map((c) => {
              const ai = aiAnalyze(c.offense || "");
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
                    AI Risk: <span className="text-green-600">{ai.risk}</span>
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
            className="w-[1000px] bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={close}
              className="absolute right-6 top-6 text-gray-500 hover:text-black"
            >
              <X />
            </button>

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
                    Grade {selected.student?.grade} • Section {selected.student?.section}
                  </p>

                  <p className={`text-xs mt-1 font-semibold ${severityColor(selected.level)}`}>
                    Severity: {selected.level}
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
                  {selected.category}
                </span>
              </div>
            </div>

            {/* FLOW */}
            <div className="flex items-center justify-between mt-6">
              {flow.map((s, i) => (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`w-3 h-3 rounded-full ${i <= progressIndex(getStatus(selected)) ? "bg-green-500" : "bg-gray-200"}`} />
                  {i !== flow.length - 1 && <div className="h-[2px] flex-1 bg-gray-200" />}
                </div>
              ))}
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
                <p className="text-sm">{selected.reporter?.name}</p>

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
              className="w-full h-24 object-cover rounded-lg border border-gray-200"
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
            <div className="mt-5">
              <p className="text-xs text-gray-500 mb-2">Manual Student Statement Entry</p>

              <textarea
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 text-sm"
              />

              <button
                onClick={saveStudentStatement}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl"
              >
                Save Statement
              </button>
            </div>

            {/* LOGS */}
            <div className="mt-6 space-y-3 border-l border-gray-200 pl-4">
              {(selected.logs || []).map((l, i) => (
                <div key={i}>
                  <p className="text-sm font-medium">{l.stage}</p>
                  <p className="text-xs text-gray-500">{l.note}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(l.time).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mt-6 p-3 rounded-xl border border-gray-200 text-sm"
              placeholder="Admin note..."
            />

            <div className="grid grid-cols-3 gap-3 mt-4">
              <button onClick={() => updateStatus("reviewing")} className="py-2 rounded-xl bg-yellow-500 text-white">
                <Eye size={14} className="inline mr-1" /> Review
              </button>

              <button onClick={() => updateStatus("escalated")} className="py-2 rounded-xl bg-red-500 text-white">
                <AlertTriangle size={14} className="inline mr-1" /> Escalate
              </button>

              <button onClick={() => updateStatus("intervention-ready")} className="py-2 rounded-xl bg-green-500 text-white">
                <CheckCircle size={14} className="inline mr-1" /> Intervention
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}