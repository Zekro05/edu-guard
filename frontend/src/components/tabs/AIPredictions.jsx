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
  BookOpen,
  ExternalLink,
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

/* ================= HELPERS ================= */

const getReportsArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getIncidentsArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.incidents)) return data.incidents;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const cleanText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  return String(value);
};

const normalizeInterventions = (aiData) => {
  /*
   * New backend format:
   *
   * interventions: [
   *   {
   *     recommendation: "...",
   *     basis: "...",
   *     referenceIds: ["RRS-..."],
   *     references: [...]
   *   }
   * ]
   *
   * Old format:
   *
   * recommendations: ["...", "..."]
   */

  if (Array.isArray(aiData?.interventions)) {
    return aiData.interventions.map((item) => {
      if (typeof item === "string") {
        return {
          recommendation: item,
          basis: "",
          referenceIds: [],
          references: [],
        };
      }

      return {
        recommendation: cleanText(
          item?.recommendation,
          "No recommendation provided."
        ),
        basis: cleanText(item?.basis, ""),
        referenceIds: Array.isArray(item?.referenceIds)
          ? item.referenceIds
          : [],
        references: Array.isArray(item?.references)
          ? item.references
          : [],
      };
    });
  }

  if (Array.isArray(aiData?.recommendations)) {
    return aiData.recommendations.map((item) => {
      if (typeof item === "string") {
        return {
          recommendation: item,
          basis: "",
          referenceIds: [],
          references: [],
        };
      }

      return {
        recommendation: cleanText(
          item?.recommendation,
          "No recommendation provided."
        ),
        basis: cleanText(item?.basis, ""),
        referenceIds: Array.isArray(item?.referenceIds)
          ? item.referenceIds
          : [],
        references: Array.isArray(item?.references)
          ? item.references
          : [],
      };
    });
  }

  return [];
};

const normalizeAIResponse = (data) => {
  return {
    summary: cleanText(
      data?.summary,
      "No behavioral summary was generated."
    ),

    pattern: cleanText(
      data?.pattern,
      "No clear behavioral pattern was detected."
    ),

    risk: cleanText(
      data?.risk,
      "Risk level could not be determined from the available data."
    ),

    prediction: cleanText(
      data?.prediction,
      "No reliable behavioral forecast is currently available."
    ),

    interventions: normalizeInterventions(data),

    notes: cleanText(
      data?.notes,
      "AI analysis completed using the available school data."
    ),

    researchReferences: Array.isArray(data?.researchReferences)
      ? data.researchReferences
      : [],
  };
};

/* ================= MAIN ================= */

const AIPredictions = () => {
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState(null);

  useEffect(() => {
    runAIAnalysis();
  }, []);

  const runAIAnalysis = async () => {
    try {
      setLoading(true);
      setAi(null);

      /* ================= FETCH DATA ================= */

      const [reportsRes, incidentsRes] = await Promise.all([
        API.get("/api/reports"),
        API.get("/api/incidents"),
      ]);

      const reports = getReportsArray(reportsRes.data);
      const incidents = getIncidentsArray(incidentsRes.data);

      console.log("📊 AI INSIGHTS DATA");
      console.log("Reports:", reports.length);
      console.log("Incidents:", incidents.length);

      /* ================= EMPTY DATA ================= */

      if (!reports.length && !incidents.length) {
        setAi({
          summary: "No sufficient data available for analysis.",
          pattern: "Not enough behavioral patterns have been recorded.",
          risk: "Low due to insufficient behavioral data.",
          prediction:
            "No reliable behavioral forecast is available until more student reports and incidents are recorded.",
          interventions: [
            {
              recommendation:
                "Continue recording student reports and incidents consistently.",
              basis:
                "The system requires sufficient behavioral records before meaningful patterns can be identified.",
              referenceIds: [],
              references: [],
            },
            {
              recommendation:
                "Maintain regular monitoring of student behavioral records.",
              basis:
                "Consistent records provide a stronger basis for identifying recurring behavioral concerns.",
              referenceIds: [],
              references: [],
            },
          ],
          notes:
            "AI analysis requires sufficient behavioral data. Research-based recommendations will become more specific as the database grows.",
          researchReferences: [],
        });

        return;
      }

      /* ================= PREPARE TIMELINE ================= */

      const timeline = [
        ...reports.map((report) => ({
          type: "report",
          date: report.date || report.createdAt || null,
          studentName: report.studentName || "Unknown student",
          offense: report.offense || "Unknown offense",
          location: report.location || "",
          description: report.description || "",
          status: report.status || "",
        })),

        ...incidents.map((incident) => ({
          type: "incident",
          date: incident.createdAt || incident.updatedAt || null,
          studentName:
            incident.studentName ||
            incident.student?.name ||
            "Unknown student",
          title: incident.title || "Untitled incident",
          category: incident.category || "Uncategorized",
          level: incident.level || "Low",
          status: incident.status || "",
          action: incident.action || "",
          studentStatement: incident.studentStatement || "",
        })),
      ];

      /* ================= CALCULATE OVERALL RISK ================= */

      const highIncidents = incidents.filter(
        (incident) =>
          String(incident.level || "").toLowerCase() === "high"
      ).length;

      const mediumIncidents = incidents.filter(
        (incident) =>
          String(incident.level || "").toLowerCase() === "medium"
      ).length;

      const lowIncidents = incidents.filter(
        (incident) =>
          String(incident.level || "").toLowerCase() === "low"
      ).length;

      let overallRisk = "Low";

      if (highIncidents >= 5) {
        overallRisk = "High";
      } else if (highIncidents >= 2 || mediumIncidents >= 5) {
        overallRisk = "Medium";
      }

      /* ================= BUILD STRUCTURED DATA ================= */

      const structuredIncidents = incidents.map((incident) => ({
        id: incident._id,
        title: incident.title,
        category: incident.category,
        level: incident.level,
        status: incident.status,
        action: incident.action,
        studentName:
          incident.studentName ||
          incident.student?.name ||
          "Unknown student",
        createdAt: incident.createdAt,
      }));

      const structuredReports = reports.map((report) => ({
        id: report._id,
        studentName: report.studentName,
        offense: report.offense,
        location: report.location,
        date: report.date,
        description: report.description,
        status: report.status,
        reporterType: report.reporterType,
      }));

      /* ================= RESEARCH-BACKED AI ================= */

      const payload = {
        grade: "All Grades",
        riskLevel: overallRisk,

        timeline,

        incidents: structuredIncidents,

        reports: structuredReports,
      };

      console.log("🧠 Sending school-wide data to research-backed AI...");

      const res = await API.post(
        "/api/gemini/student-analysis",
        payload,
        {
          timeout: 120000,
        }
      );

      console.log("✅ AI analysis response:", res.data);

      if (!res.data?.success) {
        throw new Error(
          res.data?.message ||
            res.data?.error ||
            "AI analysis failed."
        );
      }

      const normalized = normalizeAIResponse(res.data);

      setAi(normalized);
    } catch (err) {
      console.error("❌ AI INSIGHTS ERROR:", err);

      let message =
        "The AI system failed to generate school-wide insights.";

      let notes =
        "An error occurred while processing the behavioral data.";

      const status = err?.response?.status;

      if (status === 429) {
        message =
          "AI analysis is temporarily unavailable because the Gemini request limit has been reached.";

        notes =
          "Please wait before running the analysis again. This is usually caused by Gemini API rate limits.";
      } else if (status === 503) {
        message =
          "The AI service is temporarily unavailable.";

        notes =
          "Gemini may be experiencing high demand. Please try the analysis again later.";
      } else if (status === 408) {
        message =
          "The AI analysis request timed out.";

        notes =
          "The dataset may be large or the AI service may be temporarily slow.";
      } else if (err?.code === "ECONNABORTED") {
        message =
          "The AI analysis took too long to complete.";

        notes =
          "The request timed out while waiting for the AI service.";
      } else if (
        err?.response?.data?.message
      ) {
        message = err.response.data.message;
      }

      setAi({
        summary: message,

        pattern:
          "Analysis unavailable because the AI service could not complete the request.",

        risk:
          "Risk assessment is unavailable at this time.",

        prediction:
          "No behavioral prediction is available.",

        interventions: [
          {
            recommendation:
              "Try running the AI analysis again when the AI service is available.",
            basis: "",
            referenceIds: [],
            references: [],
          },
          {
            recommendation:
              "Continue maintaining accurate incident and report records.",
            basis:
              "Complete behavioral records improve the quality of future analysis.",
            referenceIds: [],
            references: [],
          },
        ],

        notes,

        researchReferences: [],
      });
    } finally {
      setLoading(false);
    }
  };

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
              EduGuard AI is analyzing behavioral patterns and
              matching recommendations with the research database.
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
                  The following insights are generated from the
                  available student reports and incident records.
                  Recommended interventions are supported by
                  references available in the EduGuard research
                  database when applicable.
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

              {/* ================= RESEARCH OVERVIEW ================= */}

              {ai.researchReferences?.length > 0 && (
                <InsightCard
                  icon={BookOpen}
                  title="Research Evidence"
                  description="References considered during AI analysis"
                >
                  <div className="space-y-3">
                    {ai.researchReferences.map(
                      (reference, index) => (
                        <ResearchReference
                          key={
                            reference.referenceId ||
                            reference._id ||
                            index
                          }
                          reference={reference}
                        />
                      )
                    )}
                  </div>
                </InsightCard>
              )}
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
                    <ShieldAlert
                      size={18}
                      className="text-amber-600"
                    />
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
                    <Lightbulb
                      size={18}
                      style={{ color: C.primary }}
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Recommendations
                    </h3>

                    <p className="text-xs text-gray-500">
                      Research-supported suggested actions
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {ai.interventions?.length > 0 ? (
                    ai.interventions.map(
                      (intervention, index) => (
                        <RecommendationItem
                          key={index}
                          intervention={intervention}
                          index={index}
                        />
                      )
                    )
                  ) : (
                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-sm text-gray-500">
                        No recommendations were generated from
                        the available data.
                      </p>
                    </div>
                  )}
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
              AI-generated insights are intended to support school
              personnel in reviewing behavioral data. They should
              not be treated as a final disciplinary decision.
              Research references provide an evidence base for
              educational recommendations and do not constitute a
              diagnosis of any student.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AIPredictions);

/* ================= RECOMMENDATION ITEM ================= */

const RecommendationItem = memo(
  ({ intervention, index }) => {
    const hasResearch =
      intervention?.references?.length > 0 ||
      intervention?.referenceIds?.length > 0;

    return (
      <div className="rounded-xl border border-gray-100 p-3">
        <div className="flex items-start gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
            style={{
              background: C.primaryLight,
              color: C.primary,
            }}
          >
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 leading-relaxed">
              {intervention?.recommendation}
            </p>

            {/* ================= EVIDENCE BASIS ================= */}

            {intervention?.basis && (
              <div
                className="mt-3 rounded-lg border p-3"
                style={{
                  background: "#F9FAFB",
                  borderColor: C.border,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen
                    size={14}
                    style={{ color: C.primary }}
                  />

                  <p className="text-xs font-semibold text-gray-700">
                    Evidence basis
                  </p>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  {intervention.basis}
                </p>
              </div>
            )}

            {/* ================= RESEARCH REFERENCES ================= */}

            {hasResearch && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen
                    size={13}
                    style={{ color: C.primary }}
                  />

                  <p className="text-xs font-semibold text-gray-700">
                    Supporting research
                  </p>
                </div>

                <div className="space-y-2">
                  {intervention.references?.map(
                    (reference, referenceIndex) => (
                      <ResearchReference
                        key={
                          reference.referenceId ||
                          reference._id ||
                          referenceIndex
                        }
                        reference={reference}
                        compact
                      />
                    )
                  )}

                  {/* Fallback when only reference IDs were returned */}

                  {!intervention.references?.length &&
                    intervention.referenceIds?.map(
                      (referenceId, referenceIndex) => (
                        <div
                          key={referenceIndex}
                          className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2"
                        >
                          <p className="text-xs font-medium text-gray-600">
                            {referenceId}
                          </p>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}

            {!hasResearch && (
              <p className="mt-2 text-[11px] text-gray-400">
                No specific research reference was attached to
                this recommendation.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

/* ================= RESEARCH REFERENCE ================= */

const ResearchReference = memo(
  ({ reference, compact = false }) => {
    if (!reference) return null;

    const citation =
      reference.citation ||
      reference.title ||
      "Research reference";

    const authors = Array.isArray(reference.authors)
      ? reference.authors.join(", ")
      : reference.authors || "";

    const journal =
      reference.journal ||
      "";

    const year =
      reference.year ||
      "";

    const doi =
      reference.doi ||
      "";

    const sourceUrl =
      reference.sourceUrl ||
      (doi
        ? `https://doi.org/${doi}`
        : "");

    return (
      <div
        className={`rounded-xl border ${
          compact ? "p-3" : "p-4"
        }`}
        style={{
          borderColor: C.border,
          background: compact ? "#FAFAFA" : "#FFFFFF",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`${
              compact ? "w-7 h-7" : "w-9 h-9"
            } rounded-lg flex items-center justify-center shrink-0`}
            style={{
              background: C.primaryLight,
            }}
          >
            <BookOpen
              size={compact ? 14 : 17}
              style={{ color: C.primary }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`${
                compact ? "text-xs" : "text-sm"
              } font-semibold text-gray-800 leading-relaxed`}
            >
              {citation}
            </p>

            {(authors || journal || year) && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {authors}

                {authors && (journal || year) ? " · " : ""}

                {journal}

                {journal && year ? " · " : ""}

                {year}
              </p>
            )}

            {doi && (
              <p className="text-[11px] text-gray-400 mt-1 break-all">
                DOI: {doi}
              </p>
            )}

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
                style={{ color: C.primary }}
              >
                View source
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
);

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

