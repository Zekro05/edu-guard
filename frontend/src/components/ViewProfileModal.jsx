import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  ShieldAlert,
  Brain,
  Sparkles,
  Activity,
} from "lucide-react";

import RiskBadge from "./RiskBadge";
import { API } from "../store/authStore";

const ViewProfileModal = ({ student, close }) => {
  const [tab, setTab] = useState("history");

  const [timeline, setTimeline] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= ESC CLOSE ================= */
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [close]);

  /* ================= FETCH INCIDENTS (fallback for AI) ================= */
  useEffect(() => {
    if (!student?._id) return;

    const fetchIncidents = async () => {
      try {
        const res = await API.get(
          `/api/incidents/student/${student._id}`
        );
        setIncidents(res.data || []);
      } catch (err) {
        console.log(err);
        setIncidents([]);
      }
    };

    fetchIncidents();
  }, [student?._id]);

  /* ================= FETCH UNIFIED TIMELINE ================= */
  useEffect(() => {
  if (!student?._id) return;

  const fetchTimeline = async () => {
    try {
      const res = await API.get(`/api/incidents/student/${student._id}`);

      const formatted = (res.data || [])
        .filter(Boolean)
        .map((i) => ({
          type: "incident",
          date: i.createdAt,
          data: {
            title: i.title,
            action: i.action,
            description: i.description || i.category,
            details: i.details,
            category: i.category,
            level: i.level,
          },
        }));

      setTimeline(formatted);
    } catch (err) {
      console.log(err);
      setTimeline([]);
    }
  };

  fetchTimeline();
}, [student?._id]);

  /* ================= AI ANALYSIS ================= */
  useEffect(() => {
    if (tab !== "analysis") return;
    if (!student) return;

    setAi(null);

    const run = async () => {
      try {
        setLoading(true);

        if (!incidents.length && !timeline.length) {
          setAi({
            summary: "No behavioral records available.",
            pattern: "Stable profile (no data).",
            risk: "Low risk due to no recorded activity.",
            prediction: "Stable behavior expected.",
            interventions: [
              "Maintain monitoring",
              "Encourage engagement",
              "No intervention required",
            ],
            notes: "Insufficient data for deep analysis.",
          });
          return;
        }

        const prompt = `
Return ONLY JSON:

{
  "summary": "...",
  "pattern": "...",
  "risk": "...",
  "prediction": "...",
  "interventions": ["..."],
  "notes": "..."
}

Student: ${student.firstName} ${student.lastName}
Grade: ${student.grade}
Risk: ${student.riskLevel}

FULL ACTIVITY TIMELINE:
${timeline
  .map(
    (t) =>
      `- ${t.type}: ${t.data.title || t.data.action || "Record"} | ${
        t.data.level || "N/A"
      }`
  )
  .join("\n")}

INCIDENTS (legacy fallback):
${incidents.map((i) => `- ${i.title} | ${i.level}`).join("\n")}
`;

        const res = await API.post("/api/gemini/generate", {
          prompt,
        });

        let raw = (res.data.text || "")
          .replace(/```json|```/g, "")
          .trim();

        const parsed = JSON.parse(raw);

        setAi(parsed);
      } catch (err) {
        console.log(err);
        setAi({
          summary: "AI analysis failed.",
          pattern: "Unavailable",
          risk: "Unknown",
          prediction: "Unavailable",
          interventions: ["Check AI service"],
          notes: "System error",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [tab, student, incidents, timeline]);

  if (!student) return null;

  return (
    <AnimatePresence>
      {/* BACKDROP */}
      <motion.div
        onClick={close}
        className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* MODAL */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.94, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-6xl bg-white/65 backdrop-blur-2xl border border-white/30 rounded-[2rem] shadow-2xl overflow-hidden"
        >
          {/* HEADER */}
          <div className="relative overflow-hidden border-b border-white/20">
            <div className="absolute inset-0 bg-gradient-to-r from-green-100/60 via-white/30 to-white/20" />

            <div className="relative px-8 py-7 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg overflow-hidden flex items-center justify-center">
                  {student.profilePhoto ? (
                    <img
                      src={student.profilePhoto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-gray-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h2>
                    <RiskBadge level={student.riskLevel} />
                  </div>

                  <div className="flex gap-3 mt-3 flex-wrap">
                    <InfoPill label={`Grade ${student.grade}`} />
                    <InfoPill label={`ID ${student.studentId}`} />
                    <InfoPill label={`${timeline.length} Activities`} />
                  </div>
                </div>
              </div>

              <button
                onClick={close}
                className="w-11 h-11 rounded-2xl bg-white/50 hover:bg-white/80 border border-white/30 backdrop-blur flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-3 px-8 py-5 border-b border-white/20 bg-white/20 backdrop-blur">
            <TabButton
              active={tab === "history"}
              icon={<Activity size={16} />}
              label="Activity Timeline"
              onClick={() => setTab("history")}
            />

            <TabButton
              active={tab === "analysis"}
              icon={<Brain size={16} />}
              label="AI Analysis"
              onClick={() => setTab("analysis")}
            />
          </div>

          {/* CONTENT */}
          <div className="p-8 max-h-[72vh] overflow-y-auto bg-gradient-to-br from-white/10 to-white/5">
            {/* HISTORY / TIMELINE */}
            {tab === "history" && (
              <div className="space-y-4">
                {timeline.length === 0 && (
                  <div className="bg-white/40 border border-white/30 rounded-3xl p-8 text-center backdrop-blur-xl">
                    <p className="text-gray-500">
                      No activity recorded.
                    </p>
                  </div>
                )}

                {timeline.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="bg-white/45 backdrop-blur-2xl border border-white/30 rounded-3xl p-6 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs px-3 py-1 rounded-xl bg-green-100 text-green-700 font-medium">
                          {item.type}
                        </span>

                        <h3 className="font-semibold text-lg mt-2">
                          {item.data.title ||
                            item.data.action ||
                            "Record"}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {item.data.description ||
                            item.data.details ||
                            item.data.category ||
                            "No details"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleString()}
                        </p>

                        {item.data.level && (
                          <div className="mt-2">
                            <RiskBadge level={item.data.level} />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ANALYSIS */}
            {tab === "analysis" && (
              <div className="space-y-5">
                {loading && (
                  <div className="bg-white/50 backdrop-blur-xl border border-white/30 rounded-3xl p-10 text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-green-700 font-medium">
                      Generating AI behavioral analysis...
                    </p>
                  </div>
                )}

                {ai && (
                  <>
                    <GlassCard title="Behavior Summary" text={ai.summary} />
                    <GlassCard title="Pattern Analysis" text={ai.pattern} />
                    <GlassCard
                      title="Risk Assessment"
                      text={ai.risk}
                      highlight="yellow"
                    />
                    <GlassCard
                      title="Prediction"
                      text={ai.prediction}
                      highlight="red"
                    />

                    <div className="bg-white/45 backdrop-blur-2xl border border-white/30 rounded-3xl p-6">
                      <h3 className="font-semibold mb-4">
                        Intervention Plan
                      </h3>

                      <div className="space-y-3">
                        {ai.interventions?.map((i, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 bg-white/50 border border-white/20 rounded-2xl p-4"
                          >
                            <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <p className="text-sm text-gray-700">{i}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <GlassCard title="Counselor Notes" text={ai.notes} />
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ================= UI COMPONENTS ================= */

const TabButton = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition ${
      active
        ? "bg-green-600 text-white shadow-lg shadow-green-200"
        : "bg-white/40 text-gray-600 hover:bg-white/60 border border-white/20"
    }`}
  >
    {icon}
    {label}
  </button>
);

const InfoPill = ({ label }) => (
  <div className="px-4 py-2 rounded-2xl bg-white/45 backdrop-blur border border-white/30 text-sm text-gray-700">
    {label}
  </div>
);

const GlassCard = ({ title, text, highlight }) => (
  <div
    className={`bg-white/45 backdrop-blur-2xl border rounded-3xl p-6 shadow-sm ${
      highlight === "yellow"
        ? "border-yellow-200/50"
        : highlight === "red"
        ? "border-red-200/50"
        : "border-white/30"
    }`}
  >
    <p className="text-sm font-semibold text-gray-900">{title}</p>
    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{text}</p>
  </div>
);

export default ViewProfileModal;