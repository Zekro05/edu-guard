import React, { useState, useEffect, memo } from "react";
import { API } from "../../lib/api";

/* ================= MAIN ================= */
const AIPredictions = () => {
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState(null);

  useEffect(() => {
    const runAI = async () => {
      try {
        setLoading(true);

        const [reportsRes, incidentsRes] = await Promise.all([
          API.get("/api/reports"),
          API.get("/api/incidents"),
        ]);

        const reports = reportsRes.data?.reports || [];
        const incidents = incidentsRes.data || [];

        if (!reports.length && !incidents.length) {
          setAi({
            summary: "No sufficient data available for analysis.",
            pattern: "Not enough behavioral patterns detected.",
            risk: "Low due to missing dataset.",
            prediction: "No forecast available.",
            recommendations: [
              "Start logging student reports",
              "Enable incident tracking system",
            ],
            notes: "System requires data to generate insights.",
          });
          return;
        }

        const prompt = `
Return ONLY valid JSON:

{
  "summary": "...",
  "pattern": "...",
  "risk": "...",
  "prediction": "...",
  "recommendations": ["...", "...", "..."],
  "notes": "..."
}

REPORTS:
${reports.map((r) => `- ${r.studentName} | ${r.offense}`).join("\n")}

INCIDENTS:
${incidents.map((i) => `- ${i.title} | ${i.level}`).join("\n")}
`;

        const res = await API.post("/api/gemini/generate", { prompt });

        const raw = res.data?.text || "";
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(cleaned);

        setAi(parsed);
      } catch (err) {
        console.error(err);

        setAi({
          summary: "AI system failed to generate insights.",
          pattern: "Analysis unavailable.",
          risk: "Unknown risk state.",
          prediction: "No prediction available.",
          recommendations: [
            "Check AI service connection",
            "Validate backend prompt structure",
          ],
          notes: "Error occurred during processing.",
        });
      } finally {
        setLoading(false);
      }
    };

    runAI();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">AI Predictions</h2>
        <p className="text-sm text-gray-500">
          Behavioral insights powered by AI analysis
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-green-600 animate-pulse">
          Analyzing school data...
        </div>
      )}

      {/* CONTENT */}
      {ai && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-4">

            <Card title="Summary">
              {ai.summary}
            </Card>

            <Card title="Pattern Analysis">
              {ai.pattern}
            </Card>

            <Card title="Risk Insight">
              <span className="text-yellow-600 font-medium">
                {ai.risk}
              </span>
            </Card>

            <Card title="Prediction">
              <span className="text-red-600 font-medium">
                {ai.prediction}
              </span>
            </Card>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">

            {/* RECOMMENDATIONS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Recommendations
              </h3>

              <div className="space-y-2">
                {ai.recommendations?.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-green-600 font-semibold">
                      {i + 1}.
                    </span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SYSTEM NOTES */}
            <Card title="System Notes">
              <span className="text-blue-600">
                {ai.notes}
              </span>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AIPredictions);

/* ================= CARD ================= */
const Card = memo(({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
    <h3 className="text-sm font-semibold text-gray-800 mb-2">
      {title}
    </h3>
    <p className="text-sm text-gray-600 leading-relaxed">
      {children}
    </p>
  </div>
));