import React, { useState, useEffect, memo } from "react";
import {
  Brain,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { API } from "../../lib/api";

/* ================= THEME ================= */

const C = {
  primary: "#1B5E20",
  primaryLight: "#E8F5E9",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};

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

        const cleaned = raw
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

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
    <div
      className="min-h-screen p-6 text-gray-900"
      style={{ background: C.bg }}
    >
      {/* ================= HEADER ================= */}

      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: C.primaryLight }}
          >
            <Brain size={22} style={{ color: C.primary }} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              AI Predictions
            </h2>

            <p className="text-sm text-gray-500 mt-0.5">
              Behavioral insights powered by AI analysis
            </p>
          </div>
        </div>
      </div>

      {/* ================= AI STATUS ================= */}

      {loading && (
        <div
          className="mb-6 rounded-2xl border bg-white p-4 flex items-center gap-3"
          style={{ borderColor: C.border }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: C.primaryLight }}
          >
            <RefreshCw
              size={17}
              className="animate-spin"
              style={{ color: C.primary }}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">
              Analyzing school data...
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              EduGuard AI is processing behavioral patterns and incidents.
            </p>
          </div>
        </div>
      )}

      {/* ================= CONTENT ================= */}

      {ai && (
        <div className="space-y-6">
          {/* ================= AI OVERVIEW BANNER ================= */}

          <div
            className="rounded-2xl border p-5 bg-white"
            style={{ borderColor: C.border }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: C.primaryLight }}
              >
                <Sparkles size={19} style={{ color: C.primary }} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  AI Behavioral Analysis
                </h3>

                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  The following insights are generated from the available
                  student reports and incident records.
                </p>
              </div>
            </div>
          </div>

          {/* ================= MAIN GRID ================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ================= LEFT / MAIN ================= */}

            <div className="xl:col-span-2 space-y-6">
              {/* SUMMARY */}

              <InsightCard
                icon={FileText}
                title="Summary"
                description="Overall behavioral overview"
              >
                <p className="text-sm text-gray-600 leading-7">
                  {ai.summary}
                </p>
              </InsightCard>

              {/* PATTERN */}

              <InsightCard
                icon={Activity}
                title="Pattern Analysis"
                description="Detected behavioral patterns"
              >
                <p className="text-sm text-gray-600 leading-7">
                  {ai.pattern}
                </p>
              </InsightCard>

              {/* PREDICTION */}

              <InsightCard
                icon={TrendingUp}
                title="Prediction"
                description="Potential future behavioral trends"
              >
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: "#FEF2F2",
                    borderColor: "#FECACA",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp
                      size={18}
                      className="text-red-500 mt-0.5 shrink-0"
                    />

                    <p className="text-sm text-gray-700 leading-relaxed">
                      {ai.prediction}
                    </p>
                  </div>
                </div>
              </InsightCard>
            </div>

            {/* ================= RIGHT COLUMN ================= */}

            <div className="space-y-6">
              {/* RISK */}

              <div
                className="rounded-2xl border bg-white p-5"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "#FEF3C7",
                    }}
                  >
                    <ShieldAlert size={18} className="text-amber-600" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Risk Insight
                    </h3>

                    <p className="text-xs text-gray-500">
                      Current behavioral risk
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: "#FFFBEB",
                    borderColor: "#FDE68A",
                  }}
                >
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {ai.risk}
                  </p>
                </div>
              </div>

              {/* RECOMMENDATIONS */}

              <div
                className="rounded-2xl border bg-white p-5"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: C.primaryLight }}
                  >
                    <Lightbulb size={18} style={{ color: C.primary }} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Recommendations
                    </h3>

                    <p className="text-xs text-gray-500">
                      Suggested actions
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {ai.recommendations?.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 p-3"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                        style={{
                          background: C.primaryLight,
                          color: C.primary,
                        }}
                      >
                        {index + 1}
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">
                        {recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SYSTEM NOTES */}

              <div
                className="rounded-2xl border bg-white p-5"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#EFF6FF" }}
                  >
                    <CheckCircle2
                      size={18}
                      className="text-blue-600"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      System Notes
                    </h3>

                    <p className="text-xs text-gray-500">
                      AI processing status
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {ai.notes}
                </p>
              </div>
            </div>
          </div>

          {/* ================= DISCLAIMER ================= */}

          <div className="flex items-start gap-3 px-1">
            <AlertTriangle
              size={15}
              className="text-gray-400 mt-0.5 shrink-0"
            />

            <p className="text-xs text-gray-400 leading-relaxed">
              AI-generated insights are intended to support school personnel
              in reviewing behavioral data. They should not be treated as a
              final disciplinary decision.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AIPredictions);

/* ================= INSIGHT CARD ================= */

const InsightCard = memo(
  ({ icon: Icon, title, description, children }) => (
    <div
      className="bg-white border rounded-2xl p-5 transition-shadow hover:shadow-sm"
      style={{ borderColor: C.border }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: C.primaryLight }}
        >
          <Icon size={18} style={{ color: C.primary }} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {title}
          </h3>

          <p className="text-xs text-gray-500 mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  )
);