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

const getCollectionArray = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  const nestedKeys = ["data", "result", "results", "response", "payload"];

  for (const key of nestedKeys) {
    const nested = data?.[key];
    if (Array.isArray(nested)) return nested;

    if (nested && typeof nested === "object") {
      const found = getCollectionArray(nested, keys);
      if (found.length) return found;
    }
  }

  return [];
};

const getReportsArray = (data) =>
  getCollectionArray(data, [
    "reports",
    "report",
    "items",
    "docs",
  ]);

const getIncidentsArray = (data) =>
  getCollectionArray(data, [
    "incidents",
    "incident",
    "items",
    "docs",
  ]);

const cleanText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "string") {
    const text = value.replace(/\s+/g, " ").trim();
    return text || fallback;
  }

  return String(value).trim() || fallback;
};

/* =========================================================
   SAFE VALUE + NORMALIZATION HELPERS
========================================================= */

const asId = (value) => {
  if (value === null || value === undefined) return null;

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text || null;
  }

  if (value?._id) return String(value._id);
  if (value?.id) return String(value.id);
  if (value?.$oid) return String(value.$oid);

  return null;
};

const getReportId = (item) =>
  asId(
    item?._id ||
      item?.id ||
      item?.reportId
  );

const getIncidentId = (item) =>
  asId(
    item?._id ||
      item?.id ||
      item?.incidentId
  );

const getRecordId = (item) =>
  getReportId(item) || getIncidentId(item);

const getIncidentReportId = (incident) =>
  asId(
    incident?.reportId ||
      incident?.sourceReportId ||
      incident?.report?._id ||
      incident?.report?.id ||
      incident?.report?.reportId ||
      incident?.reportData?._id ||
      incident?.reportData?.id ||
      incident?.reportData?.reportId ||
      incident?.case?.reportId
  );

const getNestedValue = (item, keys = []) => {
  if (!item || typeof item !== "object") return null;

  const sources = [
    item,
    item.report,
    item.reportData,
    item.case,
    item.caseData,
    item.incident,
    item.details,
  ].filter(
    (source) => source && typeof source === "object"
  );

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        return value;
      }
    }
  }

  return null;
};

const getStudentId = (item) => {
  const value = getNestedValue(item, [
    "studentId",
    "studentCode",
  ]);

  return (
    asId(value) ||
    asId(item?.student?._id) ||
    asId(item?.student?.id) ||
    asId(item?.student?.studentId) ||
    null
  );
};

const getStudentName = (item) => {
  const value = getNestedValue(item, [
    "studentName",
    "name",
    "fullName",
  ]);

  return cleanText(
    value ||
      item?.student?.name ||
      item?.student?.fullName ||
      item?.studentId?.name,
    "Unknown student"
  );
};

const normalizeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getItemDate = (item) =>
  getNestedValue(item, [
    "date",
    "createdAt",
    "updatedAt",
  ]);

const normalizeLabel = (value) => {
  const text = cleanText(value, "");
  return text || null;
};

const countBy = (items, getter) => {
  const counts = {};
  const displayNames = {};

  items.forEach((item) => {
    const value = normalizeLabel(getter(item));
    if (!value) return;

    const key = value.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
    displayNames[key] = displayNames[key] || value;
  });

  return Object.entries(counts).reduce((result, [key, count]) => {
    result[displayNames[key]] = count;
    return result;
  }, {});
};

const sortCounts = (counts) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

/* =========================================================
   REAL FIELD EXTRACTION

   Older GuidEd records may store offense/category/location in
   slightly different places. These helpers read the real values
   from the record or its linked report without inventing data.
========================================================= */

const getOffense = (item, fallbackItem = null) =>
  normalizeLabel(
    getNestedValue(item, [
      "offense",
      "offenseType",
      "violation",
      "incidentType",
      "title",
    ]) ||
      getNestedValue(fallbackItem, [
        "offense",
        "offenseType",
        "violation",
        "incidentType",
        "title",
      ]) ||
      getNestedValue(item, ["category"]) ||
      getNestedValue(fallbackItem, ["category"])
  );

const getCategory = (item, fallbackItem = null) =>
  normalizeLabel(
    getNestedValue(item, [
      "category",
      "offenseCategory",
      "incidentCategory",
      "classification",
    ]) ||
      getNestedValue(fallbackItem, [
        "category",
        "offenseCategory",
        "incidentCategory",
        "classification",
      ]) ||
      getNestedValue(item, ["offense", "offenseType"]) ||
      getNestedValue(fallbackItem, ["offense", "offenseType"])
  );

const getLocation = (item, fallbackItem = null) =>
  normalizeLabel(
    getNestedValue(item, [
      "location",
      "place",
      "incidentLocation",
      "campusLocation",
    ]) ||
      getNestedValue(fallbackItem, [
        "location",
        "place",
        "incidentLocation",
        "campusLocation",
      ])
  );

const getLevel = (item, fallbackItem = null) =>
  normalizeLabel(
    getNestedValue(item, [
      "level",
      "severity",
      "riskLevel",
    ]) ||
      getNestedValue(fallbackItem, [
        "level",
        "severity",
        "riskLevel",
      ])
  );

const getStatus = (item, fallbackItem = null) =>
  normalizeLabel(
    getNestedValue(item, ["status", "caseStatus"]) ||
      getNestedValue(fallbackItem, ["status", "caseStatus"])
  );

const getDescription = (item, fallbackItem = null) =>
  normalizeLabel(
    getNestedValue(item, [
      "description",
      "details",
      "incidentDescription",
    ]) ||
      getNestedValue(fallbackItem, [
        "description",
        "details",
        "incidentDescription",
      ])
  );

/* =========================================================
   NORMALIZE REPORTS + INCIDENTS INTO ONE EVENT STREAM

   A report that already has an incident is represented by the
   incident only. This prevents the same real-world case from being
   counted once as a report and again as an incident.
========================================================= */

const buildNormalizedEvents = (reports, incidents) => {
  const uniqueReports = [];
  const uniqueIncidents = [];

  const seenReportIds = new Set();
  const seenIncidentIds = new Set();

  reports.forEach((report, index) => {
    const id = getReportId(report);
    const key = id ? `id:${id}` : `index:${index}`;

    if (seenReportIds.has(key)) return;
    seenReportIds.add(key);
    uniqueReports.push(report);
  });

  incidents.forEach((incident, index) => {
    const id = getIncidentId(incident);
    const reportId = getIncidentReportId(incident);
    const key = id
      ? `id:${id}`
      : reportId
        ? `report:${reportId}`
        : `index:${index}`;

    if (seenIncidentIds.has(key)) return;
    seenIncidentIds.add(key);
    uniqueIncidents.push(incident);
  });

  const reportById = new Map(
    uniqueReports
      .map((report) => [getReportId(report), report])
      .filter(([id]) => Boolean(id))
  );

  const reportIds = new Set(reportById.keys());
  const linkedReportIds = new Set();

  uniqueIncidents.forEach((incident) => {
    const reportId = getIncidentReportId(incident);
    if (reportId && reportIds.has(String(reportId))) {
      linkedReportIds.add(String(reportId));
    }
  });

  const normalizedIncidents = uniqueIncidents.map((incident) => {
    const reportId = getIncidentReportId(incident);
    const sourceReport = reportId
      ? reportById.get(String(reportId))
      : null;

    return {
      id: getIncidentId(incident),
      source: "incident",
      sourceId: getIncidentId(incident),
      reportId,
      studentId: getStudentId(incident) || getStudentId(sourceReport),
      studentName:
        getStudentName(incident) !== "Unknown student"
          ? getStudentName(incident)
          : getStudentName(sourceReport),
      offense: getOffense(incident, sourceReport),
      category: getCategory(incident, sourceReport),
      location: getLocation(incident, sourceReport),
      level: getLevel(incident, sourceReport),
      status: getStatus(incident, sourceReport),
      title: normalizeLabel(
        getNestedValue(incident, ["title"]) ||
          getNestedValue(sourceReport, ["title"])
      ),
      action: normalizeLabel(
        getNestedValue(incident, ["action", "intervention"])
      ),
      description: getDescription(incident, sourceReport),
      studentStatement: normalizeLabel(
        getNestedValue(incident, ["studentStatement", "statement"])
      ),
      reporterType: normalizeLabel(
        getNestedValue(incident, ["reporterType"]) ||
          getNestedValue(sourceReport, ["reporterType"])
      ),
      date: getItemDate(incident) || getItemDate(sourceReport),
    };
  });

  const normalizedUnlinkedReports = uniqueReports
    .filter((report) => {
      const reportId = getReportId(report);
      return !reportId || !linkedReportIds.has(String(reportId));
    })
    .map((report) => ({
      id: getReportId(report),
      source: "report",
      sourceId: getReportId(report),
      reportId: getReportId(report),
      studentId: getStudentId(report),
      studentName: getStudentName(report),
      offense: getOffense(report),
      category: getCategory(report),
      location: getLocation(report),
      level: getLevel(report),
      status: getStatus(report),
      title: normalizeLabel(getNestedValue(report, ["title"])),
      action: normalizeLabel(getNestedValue(report, ["action", "intervention"])),
      description: getDescription(report),
      studentStatement: normalizeLabel(
        getNestedValue(report, ["studentStatement", "statement"])
      ),
      reporterType: normalizeLabel(getNestedValue(report, ["reporterType"])),
      date: getItemDate(report),
    }));

  const events = [
    ...normalizedIncidents,
    ...normalizedUnlinkedReports,
  ].sort((a, b) => {
    const aTime = normalizeDate(a.date)?.getTime() || 0;
    const bTime = normalizeDate(b.date)?.getTime() || 0;
    return bTime - aTime;
  });

  return {
    reports: uniqueReports,
    incidents: uniqueIncidents,
    linkedReportIds,
    events,
    normalizedIncidents,
    normalizedUnlinkedReports,
  };
};

/* =========================================================
   BUILD SCHOOL STATISTICS FROM THE NORMALIZED EVENT STREAM
========================================================= */

const buildSchoolStats = (dataset) => {
  const {
    reports = [],
    incidents = [],
    events = [],
    linkedReportIds = new Set(),
  } = dataset || {};

  const studentIds = new Set(
    events
      .map((event) => event.studentId)
      .filter(Boolean)
      .map(String)
  );

  const highIncidents = events.filter(
    (event) => String(event.level || "").toLowerCase() === "high"
  ).length;

  const mediumIncidents = events.filter(
    (event) => String(event.level || "").toLowerCase() === "medium"
  ).length;

  const lowIncidents = events.filter(
    (event) => String(event.level || "").toLowerCase() === "low"
  ).length;

  const offenseCounts = countBy(events, (event) => event.offense);
  const categoryCounts = countBy(events, (event) => event.category);
  const locationCounts = countBy(events, (event) => event.location);
  const statusCounts = countBy(events, (event) => event.status);
  const sourceCounts = countBy(events, (event) => event.source);
  const reporterTypeCounts = countBy(events, (event) => event.reporterType);

  const dates = events
    .map((event) => normalizeDate(event.date))
    .filter(Boolean);

  let dateRange = { earliest: null, latest: null };

  if (dates.length) {
    const timestamps = dates.map((date) => date.getTime());
    dateRange = {
      earliest: new Date(Math.min(...timestamps)).toISOString(),
      latest: new Date(Math.max(...timestamps)).toISOString(),
    };
  }

  const monthlyMap = {};

  events.forEach((event) => {
    const date = normalizeDate(event.date);
    if (!date) return;

    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
  });

  const monthlyTrend = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));

  const studentMap = {};

  events.forEach((event) => {
    if (!event.studentId) return;

    const studentId = String(event.studentId);

    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        studentId,
        studentName: event.studentName || "Unknown student",
        eventCount: 0,
        incidentCount: 0,
        reportCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      };
    }

    const student = studentMap[studentId];
    student.eventCount += 1;

    if (event.source === "incident") student.incidentCount += 1;
    else student.reportCount += 1;

    const level = String(event.level || "").toLowerCase();
    if (level === "high") student.highCount += 1;
    if (level === "medium") student.mediumCount += 1;
    if (level === "low") student.lowCount += 1;
  });

  const studentBehaviorSummary = Object.values(studentMap)
    .sort(
      (a, b) =>
        b.eventCount - a.eventCount ||
        b.highCount - a.highCount
    )
    .slice(0, 50);

  let overallRisk = "Low";
  if (highIncidents >= 5) overallRisk = "High";
  else if (highIncidents >= 2 || mediumIncidents >= 5) overallRisk = "Medium";

  const linkedReportCount = linkedReportIds.size;

  return {
    totalReports: reports.length,
    totalIncidents: incidents.length,
    totalUniqueEvents: events.length,
    linkedReportCount,
    unlinkedReportCount: Math.max(reports.length - linkedReportCount, 0),
    studentsInvolved: studentIds.size,
    highIncidents,
    mediumIncidents,
    lowIncidents,
    overallRisk,
    topOffenses: sortCounts(offenseCounts).slice(0, 10),
    topCategories: sortCounts(categoryCounts).slice(0, 10),
    topLocations: sortCounts(locationCounts).slice(0, 10),
    statusCounts,
    sourceCounts,
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
  data,
  canonicalStats = null
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
      canonicalStats ||
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
           FETCH SCHOOL DATASET
        ===================================================== */

        const [reportsRes, incidentsRes] = await Promise.all([
          API.get("/api/reports"),
          API.get("/api/incidents"),
        ]);

        const rawReports = getReportsArray(reportsRes.data);
        const rawIncidents = getIncidentsArray(incidentsRes.data);

        /*
         * Normalize the two API collections before doing ANY
         * statistics. An incident linked to a report replaces that
         * report in the behavioral event stream.
         */
        const dataset = buildNormalizedEvents(
          rawReports,
          rawIncidents
        );

        const stats = buildSchoolStats(dataset);

        setScopeStats(stats);

        console.log("========================================");
        console.log("🏫 GUIDED SCHOOL-WIDE AI INSIGHTS");
        console.log("========================================");
        console.log("Raw reports:", stats.totalReports);
        console.log("Raw incidents:", stats.totalIncidents);
        console.log("Linked reports removed from event stream:", stats.linkedReportCount);
        console.log("Unique behavioral events:", stats.totalUniqueEvents);
        console.log("School statistics:", stats);

        /* =====================================================
           EMPTY DATA
        ===================================================== */

        if (!dataset.events.length) {
          setAi({
            summary:
              "No sufficient school-wide data is currently available for AI analysis.",

            pattern:
              "Not enough reports or incidents have been recorded to identify meaningful school-wide behavioral patterns.",

            risk:
              "School-wide risk cannot be meaningfully assessed because there are no behavioral events in the current dataset.",

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
                  "Maintain consistent documentation of offense, category, location, severity, and outcomes.",
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
              "No unique behavioral events were available for analysis.",

            researchReferences: [],
            schoolStats: stats,
            trends: stats.monthlyTrend,
          });

          return;
        }

        /* =====================================================
           PREPARE ONE NORMALIZED AI EVENT STREAM

           `events` is the single source of truth for behavioral
           statistics. A linked report is NOT sent again as a second
           behavioral event.
        ===================================================== */

        const normalizedEvents = dataset.events.map((event) => ({
          id: event.id,
          source: event.source,
          sourceId: event.sourceId,
          reportId: event.reportId,
          studentId: event.studentId,
          studentName: event.studentName,
          offense: event.offense,
          category: event.category,
          location: event.location,
          level: event.level,
          status: event.status,
          title: event.title,
          action: event.action,
          description: event.description,
          studentStatement: event.studentStatement,
          reporterType: event.reporterType,
          date: event.date,
        }));

        /*
         * Keep the endpoint's familiar `reports` and `incidents`
         * fields, but partition them from the normalized event stream:
         * - incidents = all unique incidents
         * - reports = ONLY reports that are not already represented by
         *   an incident
         *
         * This lets the backend remain compatible while preventing an
         * AI prompt from receiving the same case twice.
         */
        const structuredIncidents = dataset.normalizedIncidents.map(
          (incident) => ({ ...incident })
        );

        const structuredReports = dataset.normalizedUnlinkedReports.map(
          (report) => ({ ...report })
        );

        const timeline = normalizedEvents.map((event) => ({
          ...event,
          type: event.source,
        }));

        /* =====================================================
           SCHOOL-WIDE PAYLOAD
        ===================================================== */

        const payload = {
          scope: "school-wide",
          analysisType: "school-wide-behavioral-insights",
          grade: "All Grades",
          riskLevel: stats.overallRisk,

          /* Explicit aggregation rule for the backend/AI. */
          aggregationRule:
            "Use normalizedEvents as the canonical behavioral dataset. A report linked to an incident is represented by the incident only and must not be counted again.",

          schoolStats: {
            ...stats,
            totalRawRecords:
              stats.totalReports + stats.totalIncidents,
            totalUniqueEvents: stats.totalUniqueEvents,
          },

          /* Canonical dataset used for all AI reasoning. */
          normalizedEvents,
          timeline,

          /* Compatibility fields. These are already partitioned and
             contain no linked report duplicate. */
          incidents: structuredIncidents,
          reports: structuredReports,
        };

        console.log("🧠 Sending normalized SCHOOL-WIDE dataset to GuidEd AI...");
        console.log("Payload statistics:", {
          rawReports: stats.totalReports,
          rawIncidents: stats.totalIncidents,
          linkedReports: stats.linkedReportCount,
          uniqueEvents: stats.totalUniqueEvents,
          normalizedReports: structuredReports.length,
          normalizedIncidents: structuredIncidents.length,
          students: stats.studentsInvolved,
          overallRisk: stats.overallRisk,
        });

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
            res.data,
            stats
          );

        setAi(normalized);

        /*
         * Keep the UI cards bound to the exact same locally
         * normalized statistics that were sent to the AI. The AI
         * response is descriptive output, not a second source of
         * truth for counts.
         */
        setScopeStats(stats);
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
        value: stats.studentsInvolved ?? 0,
        icon: Users,
        helper: "Unique students in normalized events",
      },
      {
        label: "Unique Behavioral Events",
        value: stats.totalUniqueEvents ?? 0,
        icon: Activity,
        helper: "Reports linked to incidents counted once",
      },
      {
        label: "Source Reports",
        value: stats.totalReports ?? 0,
        icon: ClipboardList,
        helper: `${stats.linkedReportCount ?? 0} linked to incidents`,
      },
      {
        label: "Recorded Incidents",
        value: stats.totalIncidents ?? 0,
        icon: AlertCircle,
        helper: `${stats.highIncidents ?? 0} high-risk`,
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
              helper,
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
                    font-semibold
                    ${
                      isDarkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }
                  `}
                >
                  {label}
                </p>

                <p
                  className={`
                    text-[11px]
                    mt-1
                    leading-relaxed
                    ${
                      isDarkMode
                        ? "text-gray-500"
                        : "text-gray-400"
                    }
                  `}
                >
                  {helper}
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
        title="Normalized Behavioral Distribution"
        description="Real offense, category, and location values from the de-duplicated event stream"
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