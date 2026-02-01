import { useState, useEffect, useRef } from "react";
import RiskBadge from "./RiskBadge";
import { API } from "../store/authStore";

const ViewProfileModal = ({ student, close }) => {
  const [tab, setTab] = useState("history");
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const aiGeneratedRef = useRef(false);

  /* ---------------- FETCH INCIDENTS ---------------- */
  useEffect(() => {
    if (!student) return;
    setLoading(true);
    API.get(`/api/incidents?studentId=${student._id}`)
      .then((res) => setIncidents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [student]);

  /* ---------------- GEMINI AI ANALYSIS ---------------- */
  useEffect(() => {
    if (tab !== "analysis" || aiGeneratedRef.current || !student || loading)
      return;

    aiGeneratedRef.current = true;
    setAiLoading(true);
    setAiError(null);

    const fetchAI = async () => {
      try {
        const prompt = `
You are an AI-assisted school behavioral analysis system.
Analyze the student's behavior using the provided incidents.
Return your response strictly in the following format:

Pattern Recognition:
<short paragraph>

Repeat Offense Prediction:
<percentage likelihood + explanation>

Recommended Interventions:
- <bullet 1>
- <bullet 2>
- <bullet 3>
- <bullet 4>

Student Information:
Name: ${student.firstName} ${student.lastName}
Grade: ${student.grade}

Incident Records:
${JSON.stringify(incidents, null, 2)}
        `;
        const res = await API.post("/api/gemini/generate", { prompt });
        const text = res.data.text;
        if (!text) throw new Error("No AI output received");

        const extractSection = (label) => {
          const regex = new RegExp(
            `${label}:([\\s\\S]*?)(?=\\n[A-Z][A-Za-z ]+:|$)`
          );
          return text.match(regex)?.[1]?.trim() || "N/A";
        };

        setAiAnalysis({
          pattern: extractSection("Pattern Recognition"),
          prediction: extractSection("Repeat Offense Prediction"),
          interventions: extractSection("Recommended Interventions"),
        });
      } catch (err) {
        console.error("AI Analysis Error:", err);
        setAiError("Failed to generate AI analysis.");
      } finally {
        setAiLoading(false);
      }
    };

    fetchAI();
  }, [tab, student, incidents, loading]);

  useEffect(() => {
    aiGeneratedRef.current = false;
    setAiAnalysis(null);
    setAiError(null);
  }, [student]);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-800 to-green-900 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-sm text-white/80">{student.grade || "Grade N/A"}</p>
          </div>
          <button onClick={close} className="text-white text-2xl">✕</button>
        </div>

        {/* TABS */}
        <div className="flex border-b bg-gray-50">
          {["history", "analysis"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 font-medium ${
                tab === t
                  ? "border-b-2 border-green-600 text-green-700"
                  : "text-gray-500 hover:text-green-600"
              }`}
            >
              {t === "history" ? "Incident History" : "AI Analysis"}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {tab === "history" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[{
                  label: "Total Incidents",
                  value: student.totalIncidents || incidents.length,
                }, {
                  label: "Risk Level",
                  value: student.riskLevel || "Low",
                  isBadge: true,
                }, {
                  label: "Status", value: "Active"
                }].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-5 text-center"
                  >
                    <p className="text-sm text-gray-500">{item.label}</p>
                    {item.isBadge ? (
                      <div className="mt-2 flex justify-center">
                        <RiskBadge level={item.value} />
                      </div>
                    ) : (
                      <p className="text-xl font-semibold mt-2">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {loading ? (
                <p className="text-center text-gray-400">Loading incidents...</p>
              ) : incidents.length === 0 ? (
                <p className="text-center text-gray-400">No incidents recorded.</p>
              ) : (
                <div className="space-y-4">
                  {incidents.map((i, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-100 rounded-2xl shadow hover:shadow-md transition-shadow p-5"
                    >
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-800 mb-1">{i.title}</p>
                        <p className="text-sm text-gray-500">{i.date} • {i.category}</p>
                      </div>
                      <span
                        className={`mt-3 sm:mt-0 inline-block px-4 py-1.5 text-sm font-medium rounded-full ${
                          i.level === "High"
                            ? "bg-red-100 text-red-700"
                            : i.level === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {i.level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {aiLoading && <p className="text-center text-gray-400">Generating AI analysis...</p>}
              {aiError && <p className="text-center text-red-500">{aiError}</p>}
              {aiAnalysis && (
                <div className="space-y-4">
                  <div className="border rounded-xl p-4 bg-pink-50 border-pink-200">
                    <h3 className="font-semibold mb-3">AI-Assisted Behavioral Analysis</h3>

                    <div className="mb-3">
                      <p className="font-medium">Pattern Recognition</p>
                      <p className="text-sm text-gray-700">{aiAnalysis.pattern}</p>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium">Repeat Offense Prediction</p>
                      <p className="text-sm text-gray-700">{aiAnalysis.prediction}</p>
                    </div>

                    <div>
                      <p className="font-medium">Recommended Interventions</p>
                      <ul className="list-disc ml-5 text-sm text-gray-700">
                        {aiAnalysis.interventions.split("\n").filter(i => i.trim()).map((item, idx) => (
                          <li key={idx}>{item.replace(/^[-\d.]+/, "").trim()}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded-xl p-4 bg-orange-50 border-orange-200 text-orange-700 text-sm">
                    <strong>⚠ Advisory Notice</strong>
                    <p className="mt-1">
                      AI predictions are advisory only and should be combined
                      with professional judgment and personal knowledge of the student’s circumstances.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProfileModal;
