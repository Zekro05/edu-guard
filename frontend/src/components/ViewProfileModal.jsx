import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import RiskBadge from "./RiskBadge";
import { API } from "../store/authStore";

const ViewProfileModal = ({ student, close }) => {
  const [tab, setTab] = useState("history");
  const [incidents, setIncidents] = useState([]);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ESC CLOSE */
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [close]);

  /* FETCH INCIDENTS */
  useEffect(() => {
    if (!student) return;

    API.get(`/api/incidents?studentId=${student._id}`)
      .then((res) => setIncidents(res.data))
      .catch(console.error);
  }, [student]);

  /* AI ANALYSIS (DEEP VERSION) */
  useEffect(() => {
    if (tab !== "analysis") return;

    setAi(null);

    if (!incidents.length) {
      setAi({
        summary:
          "No recorded behavioral incidents. Student is currently stable with no disciplinary concerns.",
        pattern:
          "No observable negative or positive behavioral patterns detected due to lack of data.",
        risk: "Low risk profile due to absence of incidents.",
        prediction:
          "Student is expected to maintain stable behavior if current conditions remain unchanged.",
        interventions: [
          "Continue standard monitoring",
          "Encourage positive reinforcement",
          "Maintain regular check-ins",
          "No intervention required at this time",
          "Promote engagement in academic activities",
        ],
        notes:
          "Student currently does not require intervention. Maintain preventive guidance approach.",
      });
      return;
    }

    const runAI = async () => {
      try {
        setLoading(true);

        const prompt = `
You are an advanced School Behavioral Intelligence AI.

Return ONLY valid JSON.

{
  "summary": "2-4 sentence overview",
  "pattern": "deep behavioral pattern analysis",
  "risk": "risk assessment with reasoning",
  "prediction": "future behavior outlook",
  "interventions": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "notes": "professional counselor guidance"
}

Student:
${student.firstName} ${student.lastName}
Grade: ${student.grade}
Risk: ${student.riskLevel}

Incidents:
${incidents.map(i => `- ${i.title} | ${i.level} | ${i.date}`).join("\n")}
`;

        const res = await API.post("/api/gemini/generate", { prompt });

        let raw = res.data.text || "";

        // clean markdown if Gemini adds it
        raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(raw);

        setAi({
          summary: parsed.summary || "",
          pattern: parsed.pattern || "",
          risk: parsed.risk || "",
          prediction: parsed.prediction || "",
          interventions: parsed.interventions || [],
          notes: parsed.notes || "",
        });
      } catch (err) {
        console.error("AI Error:", err);

        setAi({
          summary: "AI analysis failed to generate properly.",
          pattern: "Unable to analyze patterns.",
          risk: "Unknown risk level due to system error.",
          prediction: "Unavailable.",
          interventions: [
            "Check backend Gemini API",
            "Ensure valid JSON response format",
          ],
          notes: "System error occurred during AI processing.",
        });
      } finally {
        setLoading(false);
      }
    };

    runAI();
  }, [tab, student, incidents]);

  if (!student) return null;

  return (
    <AnimatePresence>
      {/* BACKDROP */}
      <motion.div
        onClick={close}
        className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* MODAL */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9 }}
          className="relative w-full max-w-5xl bg-white/10 border border-white/10 rounded-3xl overflow-hidden text-white shadow-2xl"
        >
          {/* CLOSE */}
          <button
            onClick={close}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-red-500/30 rounded-full"
          >
            <X size={18} />
          </button>

          {/* HEADER */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border border-white/30 flex items-center justify-center">
              {student.profilePhoto ? (
                <img
                  src={student.profilePhoto}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold">
                  {student.firstName?.[0]}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-white/80 text-sm">
                Grade {student.grade} • {student.studentId}
              </p>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-xl">
              <RiskBadge level={student.riskLevel} />
            </div>
          </div>

          {/* TABS */}
          <div className="flex border-b border-white/10">
            {["history", "analysis"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 ${
                  tab === t
                    ? "text-green-400 border-b border-green-400"
                    : "text-gray-400"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">

            {/* HISTORY */}
            {tab === "history" && (
              <div className="space-y-4">

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 p-4 rounded-xl">
                    Incidents: {incidents.length}
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl">
                    Risk: <RiskBadge level={student.riskLevel} />
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl">
                    Status: Active
                  </div>
                </div>

                {incidents.map((i, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl">
                    <p className="font-semibold">{i.title}</p>
                    <p className="text-sm text-gray-400">
                      {i.date} • {i.category}
                    </p>
                  </div>
                ))}

              </div>
            )}

            {/* AI ANALYSIS */}
            {tab === "analysis" && (
              <div className="space-y-4">

                {loading && (
                  <div className="text-center text-green-400 animate-pulse">
                    AI analyzing behavioral patterns...
                  </div>
                )}

                {ai && (
                  <>
                    {/* HEADER */}
                    <div className="bg-green-500/10 border border-green-400/20 rounded-2xl p-4">
                      <h3 className="font-bold">
                        AI Behavioral Intelligence Report
                      </h3>
                      <p className="text-xs text-gray-400">
                        Deep multi-layer student behavioral analysis
                      </p>
                    </div>

                    {/* SUMMARY */}
                    <div className="bg-white/5 p-4 rounded-2xl">
                      <p className="text-xs text-gray-400">Summary</p>
                      <p className="text-sm mt-1">{ai.summary}</p>
                    </div>

                    {/* PATTERN */}
                    <div className="bg-white/5 p-4 rounded-2xl">
                      <p className="text-xs text-gray-400">Pattern Analysis</p>
                      <p className="text-sm mt-1">{ai.pattern}</p>
                    </div>

                    {/* RISK */}
                    <div className="bg-yellow-500/10 border border-yellow-400/20 p-4 rounded-2xl">
                      <p className="text-xs text-yellow-300">Risk Assessment</p>
                      <p className="text-sm mt-1">{ai.risk}</p>
                    </div>

                    {/* PREDICTION */}
                    <div className="bg-red-500/10 border border-red-400/20 p-4 rounded-2xl">
                      <p className="text-xs text-red-300">Prediction</p>
                      <p className="text-sm mt-1">{ai.prediction}</p>
                    </div>

                    {/* INTERVENTIONS */}
                    <div className="bg-white/5 p-4 rounded-2xl">
                      <p className="text-xs text-gray-400 mb-2">
                        Intervention Plan
                      </p>

                      <ol className="space-y-2 text-sm">
                        {ai.interventions.map((i, idx) => (
                          <li key={idx}>
                            <span className="text-green-400">{idx + 1}.</span>{" "}
                            {i}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* NOTES */}
                    <div className="bg-blue-500/10 border border-blue-400/20 p-4 rounded-2xl">
                      <p className="text-xs text-blue-300">Counselor Notes</p>
                      <p className="text-sm mt-1">{ai.notes}</p>
                    </div>
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

export default ViewProfileModal;