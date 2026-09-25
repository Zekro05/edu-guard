import React, {
  useState,
  useEffect,
  memo,
} from "react";

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
  Users,
  ClipboardList,
  AlertCircle,
  MapPin,
  BarChart3,
} from "lucide-react";

import { API } from "../../lib/api";

/* =========================================================
   THEME
========================================================= */

const C = {
  primary: "#1B5E20",
  primaryLight: "#E8F5E9",

  darkBg: "#07110B",
  darkSurface: "#0D1A12",
  darkSurface2: "#101F17",
  darkBorder: "#1A2C20",
  darkText: "#F3F4F6",
  darkMuted: "#9CA8A4",

  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};

/* =========================================================
   SHARED GUIDED THEME
========================================================= */

const getStoredTheme = () => {
  try {
    return localStorage.getItem("guided-theme") === "dark";
  } catch {
    return false;
  }
};

const useGuidedTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    getStoredTheme
  );

  useEffect(() => {
    const readTheme = () => {
      setIsDarkMode(getStoredTheme());
    };

    readTheme();

    const handleThemeChange = (event) => {
      if (event?.detail === "dark") {
        setIsDarkMode(true);
      } else if (event?.detail === "light") {
        setIsDarkMode(false);
      } else {
        readTheme();
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "guided-theme") {
        setIsDarkMode(
          event.newValue === "dark"
        );
      }
    };

    window.addEventListener(
      "guided-theme-change",
      handleThemeChange
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "guided-theme-change",
        handleThemeChange
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  return isDarkMode;
};

/* =========================================================
   HELPERS
========================================================= */

const getReportsArray = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.reports)) {
    return data.reports;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const getIncidentsArray = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.incidents)) {
    return data.incidents;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const cleanText = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  return String(value);
};

/* =========================================================
   SAFE VALUE HELPERS
========================================================= */

const getStudentId = (item) => {
  if (!item) return null;

  if (
    typeof item.studentId === "string"
  ) {
    return item.studentId;
  }

  if (item.studentId?._id) {
    return String(
      item.studentId._id
    );
  }

  if (item.student?._id) {
    return String(
      item.student._id
    );
  }

  return null;
};

const getStudentName = (item) => {
  if (!item) {
    return "Unknown student";
  }

  return (
    item.studentName ||
    item.student?.name ||
    item.student?.fullName ||
    item.studentId?.name ||
    "Unknown student"
  );
};

const normalizeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const countBy = (
  items,
  getter
) => {
  const counts = {};

  items.forEach((item) => {
    const value = getter(item);

    if (!value) return;

    const key = String(value).trim();

    if (!key) return;

    counts[key] =
      (counts[key] || 0) + 1;
  });

  return counts;
};

const sortCounts = (counts) => {
  return Object.entries(counts)
    .sort(
      (a, b) => b[1] - a[1]
    )
    .map(
      ([name, count]) => ({
        name,
        count,
      })
    );
};

/* =========================================================
   BUILD SCHOOL STATISTICS
========================================================= */

const buildSchoolStats = (
  reports,
  incidents
) => {
  const studentIds = new Set();

  reports.forEach((report) => {
    const studentId =
      getStudentId(report);

    if (studentId) {
      studentIds.add(studentId);
    }
  });

  incidents.forEach((incident) => {
    const studentId =
      getStudentId(incident);

    if (studentId) {
      studentIds.add(studentId);
    }
  });

  const highIncidents =
    incidents.filter(
      (incident) =>
        String(
          incident?.level || ""
        ).toLowerCase() === "high"
    ).length;

  const mediumIncidents =
    incidents.filter(
      (incident) =>
        String(
          incident?.level || ""
        ).toLowerCase() === "medium"
    ).length;

  const lowIncidents =
    incidents.filter(
      (incident) =>
        String(
          incident?.level || ""
        ).toLowerCase() === "low"
    ).length;

  const offenseCounts =
    countBy(
      reports,
      (report) =>
        report?.offense
    );

  const incidentCategoryCounts =
    countBy(
      incidents,
      (incident) =>
        incident?.category
    );

  const locationCounts =
    countBy(
      [
        ...reports.map(
          (report) => ({
            location:
              report?.location,
          })
        ),

        ...incidents.map(
          (incident) => ({
            location:
              incident?.location,
          })
        ),
      ],
      (item) =>
        item?.location
    );

  const reportStatusCounts =
    countBy(
      reports,
      (report) =>
        report?.status
    );

  const incidentStatusCounts =
    countBy(
      incidents,
      (incident) =>
        incident?.status
    );

  const reporterTypeCounts =
    countBy(
      reports,
      (report) =>
        report?.reporterType
    );

  /* ================= DATE RANGE ================= */

  const dates = [
    ...reports.map((report) =>
      normalizeDate(
        report?.date ||
          report?.createdAt ||
          report?.updatedAt
      )
    ),

    ...incidents.map(
      (incident) =>
        normalizeDate(
          incident?.date ||
            incident?.createdAt ||
            incident?.updatedAt
        )
    ),
  ].filter(Boolean);

  let dateRange = {
    earliest: null,
    latest: null,
  };

  if (dates.length) {
    const timestamps =
      dates.map((date) =>
        date.getTime()
      );

    const earliest =
      new Date(
        Math.min(
          ...timestamps
        )
      );

    const latest =
      new Date(
        Math.max(
          ...timestamps
        )
      );

    dateRange = {
      earliest:
        earliest.toISOString(),

      latest:
        latest.toISOString(),
    };
  }

  /* ================= MONTHLY TREND ================= */

  const monthlyMap = {};

  [
    ...reports,
    ...incidents,
  ].forEach((item) => {
    const rawDate =
      item?.date ||
      item?.createdAt ||
      item?.updatedAt;

    const date =
      normalizeDate(rawDate);

    if (!date) return;

    const monthKey =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    monthlyMap[monthKey] =
      (monthlyMap[monthKey] || 0) +
      1;
  });

  const monthlyTrend =
    Object.entries(
      monthlyMap
    )
      .sort((a, b) =>
        a[0].localeCompare(
          b[0]
        )
      )
      .map(
        ([month, count]) => ({
          month,
          count,
        })
      );

  /* ================= STUDENT BEHAVIOR SUMMARY ================= */

  const studentMap = {};

  incidents.forEach(
    (incident) => {
      const studentId =
        getStudentId(
          incident
        );

      if (!studentId) return;

      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          studentId,
          incidentCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
        };
      }

      studentMap[
        studentId
      ].incidentCount += 1;

      const level =
        String(
          incident?.level || ""
        ).toLowerCase();

      if (level === "high") {
        studentMap[
          studentId
        ].highCount += 1;
      } else if (
        level === "medium"
      ) {
        studentMap[
          studentId
        ].mediumCount += 1;
      } else if (
        level === "low"
      ) {
        studentMap[
          studentId
        ].lowCount += 1;
      }
    }
  );

  const studentBehaviorSummary =
    Object.values(
      studentMap
    )
      .sort(
        (a, b) =>
          b.incidentCount -
          a.incidentCount
      )
      .slice(0, 50);

  /* ================= OVERALL RISK ================= */

  let overallRisk = "Low";

  if (highIncidents >= 5) {
    overallRisk = "High";
  } else if (
    highIncidents >= 2 ||
    mediumIncidents >= 5
  ) {
    overallRisk = "Medium";
  }

  return {
    totalReports:
      reports.length,

    totalIncidents:
      incidents.length,

    studentsInvolved:
      studentIds.size,

    highIncidents,
    mediumIncidents,
    lowIncidents,

    overallRisk,

    topOffenses:
      sortCounts(
        offenseCounts
      ).slice(0, 10),

    topCategories:
      sortCounts(
        incidentCategoryCounts
      ).slice(0, 10),

    topLocations:
      sortCounts(
        locationCounts
      ).slice(0, 10),

    reportStatusCounts,

    incidentStatusCounts,

    reporterTypeCounts,

    monthlyTrend,

    studentBehaviorSummary,

    dateRange,
  };
};

/* =========================================================
   INTERVENTIONS
========================================================= */

const normalizeInterventions = (
  aiData
) => {
  if (
    Array.isArray(
      aiData?.interventions
    )
  ) {
    return aiData.interventions.map(
      (item) => {
        if (
          typeof item ===
          "string"
        ) {
          return {
            recommendation: item,
            basis: "",
            referenceIds: [],
            references: [],
            conclusion: "",
          };
        }

        return {
          recommendation:
            cleanText(
              item?.recommendation,
              "No recommendation provided."
            ),

          basis:
            cleanText(
              item?.basis,
              ""
            ),

          referenceIds:
            Array.isArray(
              item?.referenceIds
            )
              ? item.referenceIds
              : [],

          references:
            Array.isArray(
              item?.references
            )
              ? item.references
              : [],

          conclusion:
            cleanText(
              item?.conclusion,
              ""
            ),
        };
      }
    );
  }

  if (
    Array.isArray(
      aiData?.recommendations
    )
  ) {
    return aiData.recommendations.map(
      (item) => {
        if (
          typeof item ===
          "string"
        ) {
          return {
            recommendation: item,
            basis: "",
            referenceIds: [],
            references: [],
            conclusion: "",
          };
        }

        return {
          recommendation:
            cleanText(
              item?.recommendation,
              "No recommendation provided."
            ),

          basis:
            cleanText(
              item?.basis,
              ""
            ),

          referenceIds:
            Array.isArray(
              item?.referenceIds
            )
              ? item.referenceIds
              : [],

          references:
            Array.isArray(
              item?.references
            )
              ? item.references
              : [],

          conclusion:
            cleanText(
              item?.conclusion,
              ""
            ),
        };
      }
    );
  }

  return [];
};

/* =========================================================
   NORMALIZE AI RESPONSE
========================================================= */

const normalizeAIResponse = (
  data
) => {
  return {
    summary:
      cleanText(
        data?.summary,
        "No school-wide behavioral summary was generated."
      ),

    pattern:
      cleanText(
        data?.pattern,
        "No clear school-wide behavioral pattern was detected."
      ),

    risk:
      cleanText(
        data?.risk,
        "School-wide risk could not be determined from the available data."
      ),

    prediction:
      cleanText(
        data?.prediction,
        "No reliable school-wide behavioral forecast is currently available."
      ),

    interventions:
      normalizeInterventions(
        data
      ),

    notes:
      cleanText(
        data?.notes,
        "AI analysis completed using the available school-wide data."
      ),

    researchReferences:
      Array.isArray(
        data?.researchReferences
      )
        ? data.researchReferences
        : [],

    schoolStats:
      data?.schoolStats ||
      null,

    trends:
      Array.isArray(
        data?.trends
      )
        ? data.trends
        : [],
  };
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (
  value
) => {
  if (!value) return "N/A";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "N/A";
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

/* =========================================================
   MAIN
========================================================= */

const AIPredictions = () => {
  const isDarkMode =
    useGuidedTheme();

  const [loading, setLoading] =
    useState(false);

  const [ai, setAi] =
    useState(null);

  const [scopeStats, setScopeStats] =
    useState(null);

  useEffect(() => {
    runAIAnalysis();
  }, []);

  const runAIAnalysis =
    async () => {
      try {
        setLoading(true);
        setAi(null);
        setScopeStats(null);

        /* =====================================================
           FETCH ENTIRE SCHOOL DATASET
        ===================================================== */

        const [
          reportsRes,
          incidentsRes,
        ] = await Promise.all([
          API.get("/api/reports"),
          API.get("/api/incidents"),
        ]);

        const reports =
          getReportsArray(
            reportsRes.data
          );

        const incidents =
          getIncidentsArray(
            incidentsRes.data
          );

        console.log(
          "========================================"
        );

        console.log(
          "🏫 EDU GUARD SCHOOL-WIDE AI INSIGHTS"
        );

        console.log(
          "========================================"
        );

        console.log(
          "Reports:",
          reports.length
        );

        console.log(
          "Incidents:",
          incidents.length
        );

        /* =====================================================
           BUILD SCHOOL-WIDE STATISTICS
        ===================================================== */

        const stats =
          buildSchoolStats(
            reports,
            incidents
          );

        setScopeStats(stats);

        console.log(
          "School statistics:",
          stats
        );

        /* =====================================================
           EMPTY DATA
        ===================================================== */

        if (
          !reports.length &&
          !incidents.length
        ) {
          setAi({
            summary:
              "No sufficient school-wide data is currently available for AI analysis.",

            pattern:
              "Not enough reports or incidents have been recorded to identify meaningful school-wide behavioral patterns.",

            risk:
              "Low due to insufficient behavioral data.",

            prediction:
              "No reliable school-wide behavioral forecast is available until more reports and incidents are recorded.",

            interventions: [
              {
                recommendation:
                  "Continue recording student reports and incidents consistently across the school.",

                basis:
                  "A broader and more complete behavioral dataset provides a stronger basis for identifying school-wide trends.",

                referenceIds: [],

                references: [],

                conclusion: "",
              },

              {
                recommendation:
                  "Maintain consistent documentation of incident categories, severity levels, locations, and outcomes.",

                basis:
                  "Consistent structured records improve the quality of future school-wide behavioral analysis.",

                referenceIds: [],

                references: [],

                conclusion: "",
              },

              {
                recommendation:
                  "Review the AI Insights dashboard periodically as the school behavioral dataset grows.",

                basis:
                  "Behavioral patterns become more informative when sufficient historical records are available.",

                referenceIds: [],

                references: [],

                conclusion: "",
              },
            ],

            notes:
              "School-wide AI analysis requires sufficient behavioral records. Research-supported recommendations will become more specific as the GuidEd database grows.",

            researchReferences: [],

            schoolStats:
              stats,

            trends:
              stats.monthlyTrend,
          });

          return;
        }

        /* =====================================================
           PREPARE TIMELINE
        ===================================================== */

        const timeline = [
          ...reports.map(
            (report) => ({
              type: "report",

              id:
                report?._id ||
                report?.reportId ||
                null,

              date:
                report?.date ||
                report?.createdAt ||
                null,

              studentId:
                getStudentId(
                  report
                ),

              offense:
                report?.offense ||
                "Unknown offense",

              category:
                report?.category ||
                "",

              location:
                report?.location ||
                "",

              description:
                report?.description ||
                "",

              reporterType:
                report?.reporterType ||
                "",

              status:
                report?.status ||
                "",
            })
          ),

          ...incidents.map(
            (incident) => ({
              type: "incident",

              id:
                incident?._id ||
                incident?.incidentId ||
                null,

              date:
                incident?.date ||
                incident?.createdAt ||
                incident?.updatedAt ||
                null,

              studentId:
                getStudentId(
                  incident
                ),

              title:
                incident?.title ||
                "Untitled incident",

              category:
                incident?.category ||
                "Uncategorized",

              level:
                incident?.level ||
                "Low",

              location:
                incident?.location ||
                "",

              status:
                incident?.status ||
                "",

              action:
                incident?.action ||
                "",

              studentStatement:
                incident?.studentStatement ||
                "",
            })
          ),
        ];

        /* =====================================================
           STRUCTURED INCIDENT DATA
        ===================================================== */

        const structuredIncidents =
          incidents.map(
            (incident) => ({
              id:
                incident?._id ||
                incident?.incidentId,

              studentId:
                getStudentId(
                  incident
                ),

              category:
                incident?.category ||
                "",

              title:
                incident?.title ||
                "",

              level:
                incident?.level ||
                "Low",

              status:
                incident?.status ||
                "",

              action:
                incident?.action ||
                "",

              location:
                incident?.location ||
                "",

              studentStatement:
                incident?.studentStatement ||
                "",

              reportId:
                incident?.reportId ||
                null,

              createdAt:
                incident?.createdAt ||
                incident?.updatedAt ||
                null,
            })
          );

        /* =====================================================
           STRUCTURED REPORT DATA
        ===================================================== */

        const structuredReports =
          reports.map(
            (report) => ({
              id:
                report?._id ||
                report?.reportId,

              studentId:
                getStudentId(
                  report
                ),

              offense:
                report?.offense ||
                "",

              category:
                report?.category ||
                "",

              location:
                report?.location ||
                "",

              date:
                report?.date ||
                report?.createdAt ||
                null,

              description:
                report?.description ||
                "",

              status:
                report?.status ||
                "",

              reporterType:
                report?.reporterType ||
                "",
            })
          );

        /* =====================================================
           SCHOOL-WIDE PAYLOAD
        ===================================================== */

        const payload = {
          scope:
            "school-wide",

          analysisType:
            "school-wide-behavioral-insights",

          grade:
            "All Grades",

          riskLevel:
            stats.overallRisk,

          schoolStats: {
            totalReports:
              stats.totalReports,

            totalIncidents:
              stats.totalIncidents,

            studentsInvolved:
              stats.studentsInvolved,

            highIncidents:
              stats.highIncidents,

            mediumIncidents:
              stats.mediumIncidents,

            lowIncidents:
              stats.lowIncidents,

            overallRisk:
              stats.overallRisk,

            topOffenses:
              stats.topOffenses,

            topCategories:
              stats.topCategories,

            topLocations:
              stats.topLocations,

            reportStatusCounts:
              stats.reportStatusCounts,

            incidentStatusCounts:
              stats.incidentStatusCounts,

            reporterTypeCounts:
              stats.reporterTypeCounts,

            monthlyTrend:
              stats.monthlyTrend,

            studentBehaviorSummary:
              stats.studentBehaviorSummary,

            dateRange:
              stats.dateRange,
          },

          timeline,

          incidents:
            structuredIncidents,

          reports:
            structuredReports,
        };

        console.log(
          "🧠 Sending SCHOOL-WIDE dataset to GuidEd AI..."
        );

        console.log(
          "Payload statistics:",
          {
            reports:
              structuredReports.length,

            incidents:
              structuredIncidents.length,

            students:
              stats.studentsInvolved,

            overallRisk:
              stats.overallRisk,
          }
        );

        /* =====================================================
           SCHOOL-WIDE GEMINI ENDPOINT
        ===================================================== */

        const res =
          await API.post(
            "/api/gemini/school-analysis",
            payload,
            {
              timeout: 120000,
            }
          );

        console.log(
          "✅ School-wide AI analysis response:",
          res.data
        );

        if (
          !res.data?.success
        ) {
          throw new Error(
            res.data?.message ||
              res.data?.error ||
              "School-wide AI analysis failed."
          );
        }

        const normalized =
          normalizeAIResponse(
            res.data
          );

        setAi(normalized);

        if (
          res.data?.schoolStats
        ) {
          setScopeStats(
            res.data.schoolStats
          );
        }
      } catch (err) {
        console.error(
          "❌ SCHOOL-WIDE AI INSIGHTS ERROR:",
          err
        );

        let message =
          "The AI system failed to generate school-wide insights.";

        let notes =
          "An error occurred while processing the school's behavioral data.";

        const status =
          err?.response?.status;

        if (status === 429) {
          message =
            "AI analysis is temporarily unavailable because the Gemini request limit has been reached.";

          notes =
            "Please wait before running the analysis again. This is usually caused by Gemini API rate limits.";
        } else if (
          status === 503
        ) {
          message =
            "The AI service is temporarily unavailable.";

          notes =
            "Gemini may be experiencing high demand. Please try the analysis again later.";
        } else if (
          status === 408
        ) {
          message =
            "The school-wide AI analysis request timed out.";

          notes =
            "The behavioral dataset may be large or the AI service may be temporarily slow.";
        } else if (
          err?.code ===
          "ECONNABORTED"
        ) {
          message =
            "The school-wide AI analysis took too long to complete.";

          notes =
            "The request timed out while waiting for the AI service.";
        } else if (
          err?.response?.data?.error
        ) {
          message =
            err.response.data.error;
        } else if (
          err?.response?.data?.message
        ) {
          message =
            err.response.data.message;
        } else if (
          err?.message
        ) {
          message =
            err.message;
        }

        setAi({
          summary:
            message,

          pattern:
            "School-wide behavioral analysis is unavailable because the AI service could not complete the request.",

          risk:
            "School-wide risk assessment is unavailable at this time.",

          prediction:
            "No school-wide behavioral prediction is available.",

          interventions: [
            {
              recommendation:
                "Try running the school-wide AI analysis again when the AI service is available.",

              basis: "",

              referenceIds: [],

              references: [],

              conclusion: "",
            },

            {
              recommendation:
                "Continue maintaining complete and accurate incident and report records.",

              basis:
                "Complete behavioral records improve the quality of future school-wide analysis.",

              referenceIds: [],

              references: [],

              conclusion: "",
            },
          ],

          notes,

          researchReferences: [],

          schoolStats:
            scopeStats,

          trends:
            scopeStats?.monthlyTrend ||
            [],
        });
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      className={`
        min-h-screen
        p-4
        sm:p-5
        lg:p-6
        transition-colors
        duration-300
        ${
          isDarkMode
            ? "bg-[#07110B] text-gray-100"
            : "bg-[#F8FAFC] text-gray-900"
        }
      `}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`
                w-11
                h-11
                rounded-xl
                flex
                items-center
                justify-center
                ${
                  isDarkMode
                    ? "bg-[#17351D]"
                    : "bg-[#E8F5E9]"
                }
              `}
            >
              <Brain
                size={22}
                className={
                  isDarkMode
                    ? "text-emerald-300"
                    : "text-[#1B5E20]"
                }
              />
            </div>

            <div>
              <h2
                className={`
                  text-2xl
                  font-semibold
                  tracking-tight
                  ${
                    isDarkMode
                      ? "text-gray-100"
                      : "text-gray-900"
                  }
                `}
              >
                AI Insights
              </h2>

              <p
                className={`
                  text-sm
                  mt-0.5
                  ${
                    isDarkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }
                `}
              >
                School-wide behavioral intelligence
                powered by GuidEd AI
              </p>
            </div>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={runAIAnalysis}
              className={`
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-medium
                border
                transition-all
                duration-200
                ${
                  isDarkMode
                    ? "bg-[#0D1A12] border-[#1A2C20] text-gray-200 hover:bg-[#101F17]"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <RefreshCw
                size={15}
                className={
                  isDarkMode
                    ? "text-emerald-300"
                    : "text-[#1B5E20]"
                }
              />

              Refresh Analysis
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          AI STATUS
      ===================================================== */}

      {loading && (
        <div
          className={`
            mb-6
            rounded-2xl
            border
            p-4
            flex
            items-center
            gap-3
            transition-colors
            duration-300
            ${
              isDarkMode
                ? "bg-[#0D1A12] border-[#1A2C20]"
                : "bg-white border-gray-200"
            }
          `}
        >
          <div
            className={`
              w-9
              h-9
              rounded-full
              flex
              items-center
              justify-center
              ${
                isDarkMode
                  ? "bg-[#17351D]"
                  : "bg-[#E8F5E9]"
              }
            `}
          >
            <RefreshCw
              size={17}
              className={`
                animate-spin
                ${
                  isDarkMode
                    ? "text-emerald-300"
                    : "text-[#1B5E20]"
                }
              `}
            />
          </div>

          <div>
            <p
              className={`
                text-sm
                font-semibold
                ${
                  isDarkMode
                    ? "text-gray-100"
                    : "text-gray-800"
                }
              `}
            >
              Analyzing school-wide data...
            </p>

            <p
              className={`
                text-xs
                mt-0.5
                ${
                  isDarkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }
              `}
            >
              GuidEd AI is reviewing the overall
              reports, incidents, severity distribution,
              recurring categories, locations, and
              behavioral trends across the system.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {ai && (
        <div className="space-y-6">
          {/* =================================================
              DATA SCOPE
          ================================================= */}

          {scopeStats && (
            <SchoolDataScope
              stats={scopeStats}
              isDarkMode={isDarkMode}
            />
          )}

          {/* =================================================
              AI OVERVIEW BANNER
          ================================================= */}

          <div
            className={`
              rounded-2xl
              border
              p-5
              transition-colors
              duration-300
              ${
                isDarkMode
                  ? "bg-[#0D1A12] border-[#1A2C20]"
                  : "bg-white border-gray-200"
              }
            `}
          >
            <div className="flex items-start gap-4">
              <div
                className={`
                  w-10
                  h-10
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  shrink-0
                  ${
                    isDarkMode
                      ? "bg-[#17351D]"
                      : "bg-[#E8F5E9]"
                  }
                `}
              >
                <Sparkles
                  size={19}
                  className={
                    isDarkMode
                      ? "text-emerald-300"
                      : "text-[#1B5E20]"
                  }
                />
              </div>

              <div>
                <h3
                  className={`
                    text-sm
                    font-semibold
                    ${
                      isDarkMode
                        ? "text-gray-100"
                        : "text-gray-800"
                    }
                  `}
                >
                  School-wide AI Behavioral Analysis
                </h3>

                <p
                  className={`
                    text-sm
                    mt-1
                    leading-relaxed
                    ${
                      isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  `}
                >
                  These insights are generated from the
                  overall behavioral data recorded across
                  the GuidEd system. The analysis considers
                  reports, incidents, severity levels,
                  recurring categories, locations, statuses,
                  student involvement, and historical trends.
                  It is designed to identify school-wide
                  behavioral patterns rather than evaluate a
                  single student or a single incident.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* =================================================
                LEFT / MAIN
            ================================================= */}

            <div className="xl:col-span-2 space-y-6">
              {/* SUMMARY */}

              <InsightCard
                icon={FileText}
                title="School-wide Summary"
                description="Overall behavioral overview across GuidEd"
                isDarkMode={isDarkMode}
              >
                <p
                  className={`
                    text-sm
                    leading-7
                    ${
                      isDarkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }
                  `}
                >
                  {ai.summary}
                </p>
              </InsightCard>

              {/* PATTERN */}

              <InsightCard
                icon={Activity}
                title="Pattern Analysis"
                description="Recurring behavioral trends detected across the school"
                isDarkMode={isDarkMode}
              >
                <p
                  className={`
                    text-sm
                    leading-7
                    ${
                      isDarkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }
                  `}
                >
                  {ai.pattern}
                </p>
              </InsightCard>

              {/* PREDICTION */}

              <InsightCard
                icon={TrendingUp}
                title="School-wide Prediction"
                description="Potential future behavioral trends"
                isDarkMode={isDarkMode}
              >
                <div
                  className={`
                    rounded-xl
                    p-4
                    border
                    ${
                      isDarkMode
                        ? "bg-[#211315] border-[#4A2428]"
                        : "bg-[#FEF2F2] border-[#FECACA]"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp
                      size={18}
                      className={`
                        mt-0.5
                        shrink-0
                        ${
                          isDarkMode
                            ? "text-red-400"
                            : "text-red-500"
                        }
                      `}
                    />

                    <p
                      className={`
                        text-sm
                        leading-relaxed
                        ${
                          isDarkMode
                            ? "text-gray-300"
                            : "text-gray-700"
                        }
                      `}
                    >
                      {ai.prediction}
                    </p>
                  </div>
                </div>
              </InsightCard>

              {/* TOP SCHOOL TRENDS */}

              {scopeStats && (
                <SchoolTrendCard
                  stats={scopeStats}
                  isDarkMode={isDarkMode}
                />
              )}

              {/* RESEARCH OVERVIEW */}

              {ai.researchReferences
                ?.length > 0 && (
                <InsightCard
                  icon={BookOpen}
                  title="Research Evidence"
                  description="References considered during school-wide AI analysis"
                  isDarkMode={isDarkMode}
                >
                  <div className="space-y-3">
                    {ai.researchReferences.map(
                      (
                        reference,
                        index
                      ) => (
                        <ResearchReference
                          key={
                            reference.referenceId ||
                            reference._id ||
                            index
                          }
                          reference={reference}
                          isDarkMode={
                            isDarkMode
                          }
                        />
                      )
                    )}
                  </div>
                </InsightCard>
              )}
            </div>

            {/* =================================================
                RIGHT COLUMN
            ================================================= */}

            <div className="space-y-6">
              {/* RISK */}

              <div
                className={`
                  rounded-2xl
                  border
                  p-5
                  transition-colors
                  duration-300
                  ${
                    isDarkMode
                      ? "bg-[#0D1A12] border-[#1A2C20]"
                      : "bg-white border-gray-200"
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${
                        isDarkMode
                          ? "bg-[#2B2510]"
                          : "bg-[#FEF3C7]"
                      }
                    `}
                  >
                    <ShieldAlert
                      size={18}
                      className={
                        isDarkMode
                          ? "text-amber-400"
                          : "text-amber-600"
                      }
                    />
                  </div>

                  <div>
                    <h3
                      className={`
                        text-sm
                        font-semibold
                        ${
                          isDarkMode
                            ? "text-gray-100"
                            : "text-gray-800"
                        }
                      `}
                    >
                      School-wide Risk Insight
                    </h3>

                    <p
                      className={`
                        text-xs
                        ${
                          isDarkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }
                      `}
                    >
                      Aggregate behavioral risk
                    </p>
                  </div>
                </div>

                <div
                  className={`
                    rounded-xl
                    p-4
                    border
                    ${
                      isDarkMode
                        ? "bg-[#211D0D] border-[#4A4218]"
                        : "bg-[#FFFBEB] border-[#FDE68A]"
                    }
                  `}
                >
                  <p
                    className={`
                      text-sm
                      leading-relaxed
                      ${
                        isDarkMode
                          ? "text-gray-300"
                          : "text-gray-700"
                      }
                    `}
                  >
                    {ai.risk}
                  </p>
                </div>
              </div>

              {/* RECOMMENDATIONS */}

              <div
                className={`
                  rounded-2xl
                  border
                  p-5
                  transition-colors
                  duration-300
                  ${
                    isDarkMode
                      ? "bg-[#0D1A12] border-[#1A2C20]"
                      : "bg-white border-gray-200"
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${
                        isDarkMode
                          ? "bg-[#17351D]"
                          : "bg-[#E8F5E9]"
                      }
                    `}
                  >
                    <Lightbulb
                      size={18}
                      className={
                        isDarkMode
                          ? "text-emerald-300"
                          : "text-[#1B5E20]"
                      }
                    />
                  </div>

                  <div>
                    <h3
                      className={`
                        text-sm
                        font-semibold
                        ${
                          isDarkMode
                            ? "text-gray-100"
                            : "text-gray-800"
                        }
                      `}
                    >
                      School-wide Recommendations
                    </h3>

                    <p
                      className={`
                        text-xs
                        ${
                          isDarkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }
                      `}
                    >
                      Research-supported suggested actions
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {ai.interventions
                    ?.length > 0 ? (
                    ai.interventions.map(
                      (
                        intervention,
                        index
                      ) => (
                        <RecommendationItem
                          key={index}
                          intervention={
                            intervention
                          }
                          index={index}
                          isDarkMode={
                            isDarkMode
                          }
                        />
                      )
                    )
                  ) : (
                    <div
                      className={`
                        rounded-xl
                        border
                        p-4
                        ${
                          isDarkMode
                            ? "bg-[#101F17] border-[#1A2C20]"
                            : "bg-white border-gray-100"
                        }
                      `}
                    >
                      <p
                        className={`
                          text-sm
                          ${
                            isDarkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                          }
                        `}
                      >
                        No school-wide recommendations were
                        generated from the available data.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SYSTEM NOTES */}

              <div
                className={`
                  rounded-2xl
                  border
                  p-5
                  transition-colors
                  duration-300
                  ${
                    isDarkMode
                      ? "bg-[#0D1A12] border-[#1A2C20]"
                      : "bg-white border-gray-200"
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${
                        isDarkMode
                          ? "bg-[#14243A]"
                          : "bg-[#EFF6FF]"
                      }
                    `}
                  >
                    <CheckCircle2
                      size={18}
                      className={
                        isDarkMode
                          ? "text-blue-400"
                          : "text-blue-600"
                      }
                    />
                  </div>

                  <div>
                    <h3
                      className={`
                        text-sm
                        font-semibold
                        ${
                          isDarkMode
                            ? "text-gray-100"
                            : "text-gray-800"
                        }
                      `}
                    >
                      System Notes
                    </h3>

                    <p
                      className={`
                        text-xs
                        ${
                          isDarkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }
                      `}
                    >
                      AI processing status
                    </p>
                  </div>
                </div>

                <p
                  className={`
                    text-sm
                    leading-relaxed
                    ${
                      isDarkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }
                  `}
                >
                  {ai.notes}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              DISCLAIMER
          ================================================= */}

          <div className="flex items-start gap-3 px-1">
            <AlertTriangle
              size={15}
              className={`
                mt-0.5
                shrink-0
                ${
                  isDarkMode
                    ? "text-gray-500"
                    : "text-gray-400"
                }
              `}
            />

            <p
              className={`
                text-xs
                leading-relaxed
                ${
                  isDarkMode
                    ? "text-gray-500"
                    : "text-gray-400"
                }
              `}
            >
              AI-generated school-wide insights are intended
              to support authorized school personnel in
              reviewing aggregate behavioral data. They
              should not be treated as a final disciplinary
              decision or as a diagnosis of any student.
              Recommendations describe possible school-level
              actions and should be evaluated together with
              school policies, available evidence, and
              professional judgment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(
  AIPredictions
);

/* =========================================================
   SCHOOL DATA SCOPE
========================================================= */

const SchoolDataScope = memo(
  ({
    stats,
    isDarkMode = false,
  }) => {
    if (!stats) return null;

    const cards = [
      {
        label: "Students Involved",
        value:
          stats.studentsInvolved ??
          0,
        icon: Users,
      },

      {
        label: "Total Reports",
        value:
          stats.totalReports ??
          0,
        icon: ClipboardList,
      },

      {
        label: "Total Incidents",
        value:
          stats.totalIncidents ??
          0,
        icon: AlertCircle,
      },

      {
        label: "High Risk Incidents",
        value:
          stats.highIncidents ??
          0,
        icon: ShieldAlert,
      },
    ];

    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3
              className={`
                text-sm
                font-semibold
                ${
                  isDarkMode
                    ? "text-gray-100"
                    : "text-gray-800"
                }
              `}
            >
              Analysis Scope
            </h3>

            <p
              className={`
                text-xs
                mt-0.5
                ${
                  isDarkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }
              `}
            >
              Data currently included in the school-wide AI analysis
            </p>
          </div>

          <div
            className={`
              inline-flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              text-xs
              font-medium
              ${
                isDarkMode
                  ? "bg-[#17351D] text-emerald-300"
                  : "bg-[#E8F5E9] text-[#1B5E20]"
              }
            `}
          >
            <BarChart3
              size={13}
            />

            Entire School Dataset
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(
            ({
              label,
              value,
              icon: Icon,
            }) => (
              <div
                key={label}
                className={`
                  border
                  rounded-2xl
                  p-4
                  transition-colors
                  duration-300
                  ${
                    isDarkMode
                      ? "bg-[#0D1A12] border-[#1A2C20]"
                      : "bg-white border-gray-200"
                  }
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      shrink-0
                      ${
                        isDarkMode
                          ? "bg-[#17351D]"
                          : "bg-[#E8F5E9]"
                      }
                    `}
                  >
                    <Icon
                      size={17}
                      className={
                        isDarkMode
                          ? "text-emerald-300"
                          : "text-[#1B5E20]"
                      }
                    />
                  </div>

                  <span
                    className={`
                      text-2xl
                      font-semibold
                      ${
                        isDarkMode
                          ? "text-gray-100"
                          : "text-gray-800"
                      }
                    `}
                  >
                    {value}
                  </span>
                </div>

                <p
                  className={`
                    text-xs
                    mt-3
                    ${
                      isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  `}
                >
                  {label}
                </p>
              </div>
            )
          )}
        </div>

        {stats.dateRange && (
          <div
            className={`
              flex
              flex-wrap
              items-center
              gap-2
              mt-3
              text-xs
              ${
                isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
              }
            `}
          >
            <Activity
              size={13}
            />

            Data range:

            <span
              className={
                isDarkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            >
              {formatDate(
                stats.dateRange
                  ?.earliest
              )}
            </span>

            <span>to</span>

            <span
              className={
                isDarkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            >
              {formatDate(
                stats.dateRange
                  ?.latest
              )}
            </span>
          </div>
        )}
      </div>
    );
  }
);

/* =========================================================
   SCHOOL TREND CARD
========================================================= */

const SchoolTrendCard = memo(
  ({
    stats,
    isDarkMode = false,
  }) => {
    const topOffenses =
      stats?.topOffenses || [];

    const topCategories =
      stats?.topCategories || [];

    const topLocations =
      stats?.topLocations || [];

    return (
      <InsightCard
        icon={BarChart3}
        title="School-wide Behavioral Distribution"
        description="Most frequently recorded behavioral categories and locations"
        isDarkMode={isDarkMode}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DistributionList
            title="Top Offenses"
            items={topOffenses}
            emptyText="No offense data available."
            isDarkMode={isDarkMode}
          />

          <DistributionList
            title="Top Categories"
            items={topCategories}
            emptyText="No category data available."
            isDarkMode={isDarkMode}
          />

          <DistributionList
            title="Top Locations"
            items={topLocations}
            emptyText="No location data available."
            icon={MapPin}
            isDarkMode={isDarkMode}
          />
        </div>
      </InsightCard>
    );
  }
);

/* =========================================================
   DISTRIBUTION LIST
========================================================= */

const DistributionList = memo(
  ({
    title,
    items,
    emptyText,
    icon: Icon = Activity,
    isDarkMode = false,
  }) => {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon
            size={14}
            className={
              isDarkMode
                ? "text-emerald-300"
                : "text-[#1B5E20]"
            }
          />

          <p
            className={`
              text-xs
              font-semibold
              ${
                isDarkMode
                  ? "text-gray-200"
                  : "text-gray-700"
              }
            `}
          >
            {title}
          </p>
        </div>

        {items?.length ? (
          <div className="space-y-2">
            {items
              .slice(0, 5)
              .map((item) => (
                <div
                  key={`${item.name}-${item.count}`}
                  className="flex items-center justify-between gap-3"
                >
                  <p
                    className={`
                      text-xs
                      truncate
                      ${
                        isDarkMode
                          ? "text-gray-400"
                          : "text-gray-600"
                      }
                    `}
                  >
                    {item.name}
                  </p>

                  <span
                    className={`
                      text-[11px]
                      font-semibold
                      px-2
                      py-1
                      rounded-full
                      shrink-0
                      ${
                        isDarkMode
                          ? "bg-[#17351D] text-emerald-300"
                          : "bg-[#E8F5E9] text-[#1B5E20]"
                      }
                    `}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p
            className={`
              text-xs
              ${
                isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
              }
            `}
          >
            {emptyText}
          </p>
        )}
      </div>
    );
  }
);

/* =========================================================
   RECOMMENDATION ITEM
========================================================= */

const RecommendationItem = memo(
  ({
    intervention,
    index,
    isDarkMode = false,
  }) => {
    const hasResearch =
      intervention?.references
        ?.length > 0 ||
      intervention?.referenceIds
        ?.length > 0;

    return (
      <div
        className={`
          rounded-xl
          border
          p-3
          ${
            isDarkMode
              ? "bg-[#0B1710] border-[#1A2C20]"
              : "bg-white border-gray-100"
          }
        `}
      >
        <div className="flex items-start gap-3">
          <div
            className={`
              w-6
              h-6
              rounded-full
              flex
              items-center
              justify-center
              shrink-0
              text-xs
              font-semibold
              ${
                isDarkMode
                  ? "bg-[#17351D] text-emerald-300"
                  : "bg-[#E8F5E9] text-[#1B5E20]"
              }
            `}
          >
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`
                text-sm
                leading-relaxed
                ${
                  isDarkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }
              `}
            >
              {intervention?.recommendation}
            </p>

            {/* CONCLUSION */}

            {intervention?.conclusion && (
              <div className="mt-2">
                <span
                  className={`
                    inline-flex
                    items-center
                    px-2.5
                    py-1
                    rounded-full
                    text-[11px]
                    font-semibold
                    ${
                      isDarkMode
                        ? "bg-[#17351D] text-emerald-300"
                        : "bg-[#E8F5E9] text-[#1B5E20]"
                    }
                  `}
                >
                  {intervention.conclusion}
                </span>
              </div>
            )}

            {/* EVIDENCE BASIS */}

            {intervention?.basis && (
              <div
                className={`
                  mt-3
                  rounded-lg
                  border
                  p-3
                  ${
                    isDarkMode
                      ? "bg-[#101F17] border-[#1A2C20]"
                      : "bg-[#F9FAFB] border-gray-200"
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen
                    size={14}
                    className={
                      isDarkMode
                        ? "text-emerald-300"
                        : "text-[#1B5E20]"
                    }
                  />

                  <p
                    className={`
                      text-xs
                      font-semibold
                      ${
                        isDarkMode
                          ? "text-gray-200"
                          : "text-gray-700"
                      }
                    `}
                  >
                    Evidence basis
                  </p>
                </div>

                <p
                  className={`
                    text-xs
                    leading-relaxed
                    ${
                      isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  `}
                >
                  {intervention.basis}
                </p>
              </div>
            )}

            {/* RESEARCH REFERENCES */}

            {hasResearch && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen
                    size={13}
                    className={
                      isDarkMode
                        ? "text-emerald-300"
                        : "text-[#1B5E20]"
                    }
                  />

                  <p
                    className={`
                      text-xs
                      font-semibold
                      ${
                        isDarkMode
                          ? "text-gray-200"
                          : "text-gray-700"
                      }
                    `}
                  >
                    Supporting research
                  </p>
                </div>

                <div className="space-y-2">
                  {intervention.references?.map(
                    (
                      reference,
                      referenceIndex
                    ) => (
                      <ResearchReference
                        key={
                          reference.referenceId ||
                          reference._id ||
                          referenceIndex
                        }
                        reference={
                          reference
                        }
                        compact
                        isDarkMode={
                          isDarkMode
                        }
                      />
                    )
                  )}

                  {/* FALLBACK WHEN ONLY IDS ARE RETURNED */}

                  {!intervention.references
                    ?.length &&
                    intervention.referenceIds?.map(
                      (
                        referenceId,
                        referenceIndex
                      ) => (
                        <div
                          key={
                            referenceIndex
                          }
                          className={`
                            rounded-lg
                            border
                            px-3
                            py-2
                            ${
                              isDarkMode
                                ? "bg-[#101F17] border-[#1A2C20]"
                                : "bg-gray-50 border-gray-100"
                            }
                          `}
                        >
                          <p
                            className={`
                              text-xs
                              font-medium
                              ${
                                isDarkMode
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }
                            `}
                          >
                            {referenceId}
                          </p>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}

            {!hasResearch && (
              <p
                className={`
                  mt-2
                  text-[11px]
                  ${
                    isDarkMode
                      ? "text-gray-500"
                      : "text-gray-400"
                  }
                `}
              >
                No specific research reference was attached
                to this recommendation.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

/* =========================================================
   RESEARCH REFERENCE
========================================================= */

const ResearchReference = memo(
  ({
    reference,
    compact = false,
    isDarkMode = false,
  }) => {
    if (!reference) return null;

    const citation =
      reference.citation ||
      reference.title ||
      "Research reference";

    const authors =
      Array.isArray(
        reference.authors
      )
        ? reference.authors.join(
            ", "
          )
        : reference.authors ||
          "";

    const journal =
      reference.journal || "";

    const year =
      reference.year || "";

    const doi =
      reference.doi || "";

    const sourceUrl =
      reference.sourceUrl ||
      (doi
        ? `https://doi.org/${doi}`
        : "");

    return (
      <div
        className={`
          rounded-xl
          border
          ${
            compact
              ? "p-3"
              : "p-4"
          }
          ${
            isDarkMode
              ? "bg-[#0B1710] border-[#1A2C20]"
              : "bg-white border-gray-200"
          }
        `}
      >
        <div className="flex items-start gap-3">
          <div
            className={`
              ${
                compact
                  ? "w-7 h-7"
                  : "w-9 h-9"
              }
              rounded-lg
              flex
              items-center
              justify-center
              shrink-0
              ${
                isDarkMode
                  ? "bg-[#17351D]"
                  : "bg-[#E8F5E9]"
              }
            `}
          >
            <BookOpen
              size={
                compact
                  ? 14
                  : 17
              }
              className={
                isDarkMode
                  ? "text-emerald-300"
                  : "text-[#1B5E20]"
              }
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`
                ${
                  compact
                    ? "text-xs"
                    : "text-sm"
                }
                font-semibold
                leading-relaxed
                ${
                  isDarkMode
                    ? "text-gray-100"
                    : "text-gray-800"
                }
              `}
            >
              {citation}
            </p>

            {(authors ||
              journal ||
              year) && (
              <p
                className={`
                  text-xs
                  mt-1
                  leading-relaxed
                  ${
                    isDarkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }
                `}
              >
                {authors}

                {authors &&
                (journal ||
                  year)
                  ? " · "
                  : ""}

                {journal}

                {journal &&
                year
                  ? " · "
                  : ""}

                {year}
              </p>
            )}

            {doi && (
              <p
                className={`
                  text-[11px]
                  mt-1
                  break-all
                  ${
                    isDarkMode
                      ? "text-gray-500"
                      : "text-gray-400"
                  }
                `}
              >
                DOI: {doi}
              </p>
            )}

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  inline-flex
                  items-center
                  gap-1
                  mt-2
                  text-xs
                  font-medium
                  hover:underline
                  ${
                    isDarkMode
                      ? "text-emerald-300"
                      : "text-[#1B5E20]"
                  }
                `}
              >
                View source

                <ExternalLink
                  size={11}
                />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
);

/* =========================================================
   INSIGHT CARD
========================================================= */

const InsightCard = memo(
  ({
    icon: Icon,
    title,
    description,
    children,
    isDarkMode = false,
  }) => (
    <div
      className={`
        border
        rounded-2xl
        p-5
        transition-all
        duration-300
        ${
          isDarkMode
            ? "bg-[#0D1A12] border-[#1A2C20] hover:bg-[#101F17]"
            : "bg-white border-gray-200 hover:shadow-sm"
        }
      `}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`
            w-9
            h-9
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0
            ${
              isDarkMode
                ? "bg-[#17351D]"
                : "bg-[#E8F5E9]"
            }
          `}
        >
          <Icon
            size={18}
            className={
              isDarkMode
                ? "text-emerald-300"
                : "text-[#1B5E20]"
            }
          />
        </div>

        <div>
          <h3
            className={`
              text-sm
              font-semibold
              ${
                isDarkMode
                  ? "text-gray-100"
                  : "text-gray-800"
              }
            `}
          >
            {title}
          </h3>

          <p
            className={`
              text-xs
              mt-0.5
              ${
                isDarkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            `}
          >
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  )
);