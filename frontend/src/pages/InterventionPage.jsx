import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api";
import { exportInterventionPDF } from "../utils/exportInterventionPDF";
import InterventionPrintableReport from "../components/reports/InterventionPrintableReport";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Search,
  X,
  Bell,
  Sparkles,
  Brain,
  Activity,
  CheckCircle2,
  FileText,
  HandHelping,
  BriefcaseBusiness,
  Clock3,
  ChevronRight,
  ClipboardCheck,
  UserRound,
  AlertCircle,
  Plus,
  Download,
  CircleCheck,
  Timer,
  LogOut,
  Printer,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Loader2,
  Menu,
  Moon,
  Sun,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";

const ThemeToggle = ({ darkMode, setDarkMode }) => (
  <button
    type="button"
    onClick={() => setDarkMode((current) => !current)}
    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition ${
      darkMode
        ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]"
        : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
    }`}
    aria-label="Toggle theme"
    aria-pressed={darkMode}
  >
    <div className="flex items-center gap-3 min-w-0">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        darkMode ? "bg-amber-950/40 text-amber-300" : "bg-white text-slate-500"
      }`}>
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      </span>
      <span>{darkMode ? "Light mode" : "Dark mode"}</span>
    </div>
    <span className={`relative w-9 h-5 rounded-full flex-shrink-0 transition ${darkMode ? "bg-green-600" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition ${darkMode ? "left-[18px] bg-black" : "left-0.5 bg-white"}`} />
    </span>
  </button>
);

const InterventionPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  /* =========================================================
     USER
  ========================================================= */

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Admin";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  /* =========================================================
     STATE
  ========================================================= */

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [showPrintableReport, setShowPrintableReport] = useState(false);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const [cases, setCases] = useState([]);
  const [interventions, setInterventions] = useState([]);

  /*
    Keep all reports because:
    - the current report can provide the detailed incident overview
    - previous reports can be used only as secondary context by AI
  */
  const [reports, setReports] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("guided-theme");
      if (savedTheme === "dark") return true;
      if (savedTheme === "light") return false;
      return false;
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [auditLog, setAuditLog] = useState([]);
  const [openTimeline, setOpenTimeline] = useState(null);

  const [form, setForm] = useState({
    type: "warning",
    description: "",
  });

  /* =========================================================
     AI RECOMMENDATION STATE
  ========================================================= */

  const [aiRecommendations, setAiRecommendations] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const loggedInUser =
    JSON.parse(localStorage.getItem("user"))?.name ||
    adminName ||
    "Unknown User";

  /*
    These are the ONLY conclusions that the AI recommendation
    is allowed to use.
  */
  const options = [
    "warning",
    "call a parent",
    "community service",
    "suspension",
  ];

  /* =========================================================
     AUDIT
  ========================================================= */

  const addAuditLog = (action) => {
    const entry = {
      id: Date.now(),
      action,
      time: new Date().toISOString(),
    };

    setAuditLog((prev) => [entry, ...prev]);
  };

  /* =========================================================
     FETCH
  ========================================================= */

  const fetchData = async () => {
    try {
      const [incidentRes, interventionRes, reportsRes] =
        await Promise.all([
          API.get("/api/incidents"),
          API.get("/api/interventions"),
          API.get("/api/reports"),
        ]);

      const incidentsData = incidentRes.data || [];

      const reportsData = reportsRes.data?.reports || [];

      setReports(reportsData);

      const casesData = incidentsData.map((i) => {
        const student = i.studentId || {};

        return {
          _id: i._id,
          incidentId: i._id,

          studentId: student._id,

          studentName:
            `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
            "Unknown",

          grade: student.grade || "N/A",
          gender: student.gender || "N/A",
          studentCode: student.studentId || "N/A",

          age: student.birthDate
            ? new Date().getFullYear() -
              new Date(student.birthDate).getFullYear()
            : "N/A",

          /*
            CURRENT INCIDENT DATA
          */
          offense: i.title || "No title",
          title: i.title || "No title",

          status: i.status || "received",

          level: i.level || "Low",
          category: i.category || "Uncategorized",

          studentStatement: i.studentStatement || "",

          createdAt: i.createdAt || null,

          reportId: i.reportId || null,

          action: i.action || "",

          caseLogs: i.caseLogs || [],
        };
      });

      setCases(casesData);

      const interventionData = interventionRes.data || [];
      setInterventions(interventionData);

      setNotifications(
        casesData.slice(0, 10).map((r) => ({
          id: r._id,
          title: "Case Requires Intervention",
          text: r.offense,
          student: r.studentName,
          time: new Date().toISOString(),
        })),
      );
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getIncidentInterventions = (incidentId) => {
    return interventions.filter(
      (i) =>
        String(i.incidentId?._id || i.incidentId) === String(incidentId),
    );
  };

  const getIncidentInterventionStatus = (incidentId) => {
    const list = getIncidentInterventions(incidentId);

    if (list.length === 0) {
      return "none";
    }

    const allCompleted = list.every(
      (i) => String(i.status || "").toLowerCase() === "completed",
    );

    if (allCompleted) {
      return "completed";
    }

    return "ongoing";
  };

  /* =========================================================
     AI RECOMMENDATION HELPERS
  ========================================================= */

  /*
    Get every incident belonging to this student.

    IMPORTANT:
    The current incident is separated from previous incidents.
    This prevents the current incident from being mixed together
    with historical incidents.
  */
  const getStudentIncidents = (studentId) => {
    if (!studentId) return [];

    return cases.filter(
      (incident) =>
        String(incident.studentId) === String(studentId),
    );
  };

  /*
    Get reports belonging to the student.
  */
  const getStudentReports = (studentId) => {
    if (!studentId) return [];

    return reports.filter(
      (report) =>
        String(
          report.studentId?._id ||
            report.studentId,
        ) === String(studentId),
    );
  };

  /*
    Risk is supporting context only.
    It must NOT replace the current incident as the main
    basis for the recommendation.
  */
  const getRiskLevelForStudent = (studentId) => {
    const studentIncidents = getStudentIncidents(studentId);

    if (!studentIncidents.length) {
      return "Low";
    }

    const high = studentIncidents.filter(
      (i) =>
        String(i.level || "").toLowerCase() === "high",
    ).length;

    const medium = studentIncidents.filter(
      (i) =>
        String(i.level || "").toLowerCase() === "medium",
    ).length;

    if (high >= 2) return "High";
    if (high >= 1 || medium >= 2) return "Medium";

    return "Low";
  };

  /*
    Convert different possible AI conclusion formats into
    the exact four allowed intervention conclusions.
  */
  const normalizeConclusion = (
    recommendation = "",
    explicitConclusion = "",
    fallbackLevel = "Low",
  ) => {
    const combined =
      `${explicitConclusion} ${recommendation}`.toLowerCase();

    /*
      Check the strongest/more specific terms first.
    */

    if (
      /\bsuspension\b/i.test(combined)
    ) {
      return "Suspension";
    }

    if (
      /\bcommunity\s+service\b/i.test(combined)
    ) {
      return "Community Service";
    }

    if (
      /\bcall\s+(a\s+)?parent\b/i.test(combined) ||
      /\bparent\s+conference\b/i.test(combined) ||
      /\bparent\s+meeting\b/i.test(combined)
    ) {
      return "Call a Parent";
    }

    if (
      /\bwarning\b/i.test(combined)
    ) {
      return "Warning";
    }

    /*
      If the AI did not provide a valid conclusion, use the
      current incident severity only as a fallback.

      This fallback is NOT presented as a separate AI analysis.
      It only guarantees that the UI always has one valid
      conclusion.
    */
    const level = String(fallbackLevel || "Low").toLowerCase();

    if (level === "high") {
      return "Suspension";
    }

    if (level === "medium") {
      return "Call a Parent";
    }

    return "Warning";
  };

  /*
    Make sure the final recommendation ALWAYS ends with:

    Conclusion: Warning
    Conclusion: Call a Parent
    Conclusion: Community Service
    Conclusion: Suspension
  */
  const ensureRecommendationConclusion = (
    recommendation,
    explicitConclusion,
    fallbackLevel,
  ) => {
    const cleanRecommendation =
      String(
        recommendation ||
          "No specific intervention recommendation was generated.",
      ).trim();

    const conclusion = normalizeConclusion(
      cleanRecommendation,
      explicitConclusion,
      fallbackLevel,
    );

    /*
      Remove an existing conclusion from the end so that we
      don't produce:

      Conclusion: Warning
      Conclusion: Suspension
    */
    const withoutOldConclusion = cleanRecommendation
      .replace(
        /\s*(?:final\s+)?conclusion\s*:\s*(warning|call\s+a\s+parent|community\s+service|suspension)\s*\.?\s*$/i,
        "",
      )
      .trim();

    return {
      text: `${withoutOldConclusion}\n\nConclusion: ${conclusion}`,
      conclusion,
    };
  };

  /*
    Normalize the backend response so the frontend has one
    predictable AI object.
  */
  const normalizeAIRecommendation = (
    analysis,
    fallbackLevel = "Low",
  ) => {
    if (!analysis) {
      return null;
    }

    const interventions = Array.isArray(
      analysis.interventions,
    )
      ? analysis.interventions
      : [];

    const firstIntervention =
      interventions[0] || null;

    if (!firstIntervention) {
      const fallbackRecommendation =
        analysis.notes ||
        "The available evidence does not provide enough information for a specific intervention recommendation.";

      const finalized =
        ensureRecommendationConclusion(
          fallbackRecommendation,
          analysis.conclusion,
          fallbackLevel,
        );

      return {
        recommendation: finalized.text,

        conclusion: finalized.conclusion,

        basis:
          analysis.notes ||
          "The available behavioral data does not provide enough evidence for a specific intervention.",

        references: Array.isArray(
          analysis.researchReferences,
        )
          ? analysis.researchReferences
          : [],

        referenceIds: [],

        summary: analysis.summary || "",
        risk: analysis.risk || "",
        prediction: analysis.prediction || "",
        pattern: analysis.pattern || "",
        notes: analysis.notes || "",
      };
    }

    const finalized =
      ensureRecommendationConclusion(
        firstIntervention.recommendation ||
          "No specific intervention recommended.",
        firstIntervention.conclusion ||
          analysis.conclusion,
        fallbackLevel,
      );

    return {
      recommendation: finalized.text,

      conclusion: finalized.conclusion,

      basis:
        firstIntervention.basis ||
        "Recommendation generated from the current incident and supporting behavioral records.",

      references: Array.isArray(
        firstIntervention.references,
      )
        ? firstIntervention.references
        : [],

      referenceIds: Array.isArray(
        firstIntervention.referenceIds,
      )
        ? firstIntervention.referenceIds
        : [],

      summary: analysis.summary || "",
      risk: analysis.risk || "",
      prediction: analysis.prediction || "",
      pattern: analysis.pattern || "",
      notes: analysis.notes || "",
    };
  };

  const getAIRecommendation = (incidentId) => {
    return (
      aiRecommendations[String(incidentId)] ||
      null
    );
  };

  /* =========================================================
     RUN AI RECOMMENDATION
  ========================================================= */

  const runAIRecommendation = async (
    caseData,
  ) => {
    if (!caseData?.studentId) {
      return;
    }

    const incidentId = String(
      caseData.incidentId,
    );

    /*
      Avoid calling Gemini again if this case was already
      analyzed during the current page session.
    */
    if (aiRecommendations[incidentId]) {
      return;
    }

    try {
      setAiLoading(true);
      setAiError("");

      /*
        =====================================================
        CURRENT INCIDENT
        =====================================================

        This is the MOST IMPORTANT object sent to the AI.

        The AI should answer:

        "What intervention is most appropriate for THIS
        incident?"
      */

      const currentIncidentReport =
        reports.find(
          (report) =>
            String(report._id) ===
            String(caseData.reportId),
        );

      const currentIncident = {
        incidentId: caseData.incidentId,

        title:
          caseData.offense ||
          caseData.title ||
          "No title",

        category:
          caseData.category ||
          "Uncategorized",

        level:
          caseData.level ||
          "Low",

        status:
          caseData.status ||
          "received",

        studentStatement:
          caseData.studentStatement ||
          "",

        action:
          caseData.action ||
          "",

        createdAt:
          caseData.createdAt ||
          null,

        /*
          Include the original report details when available.
          These are part of the current incident overview.
        */
        reportId:
          caseData.reportId ||
          null,

        reportOffense:
          currentIncidentReport?.offense ||
          "",

        description:
          currentIncidentReport?.description ||
          "",

        location:
          currentIncidentReport?.location ||
          "",

        date:
          currentIncidentReport?.date ||
          null,

        time:
          currentIncidentReport?.time ||
          "",

        evidence:
          currentIncidentReport?.evidence ||
          [],
      };

      /*
        =====================================================
        PREVIOUS INCIDENTS
        =====================================================

        Previous incidents are deliberately separated from
        the current incident.

        They are SECONDARY context only.
      */

      const studentIncidents =
        getStudentIncidents(
          caseData.studentId,
        );

      const previousIncidents =
        studentIncidents
          .filter(
            (incident) =>
              String(
                incident.incidentId,
              ) !==
              String(
                caseData.incidentId,
              ),
          )
          .map(
            (incident) => ({
              incidentId:
                incident.incidentId,

              title:
                incident.offense ||
                incident.title ||
                "No title",

              category:
                incident.category ||
                "Uncategorized",

              level:
                incident.level ||
                "Low",

              status:
                incident.status ||
                "received",

              studentStatement:
                incident.studentStatement ||
                "",

              action:
                incident.action ||
                "",

              createdAt:
                incident.createdAt ||
                null,
            }),
          );

      /*
        =====================================================
        STUDENT REPORT HISTORY
        =====================================================

        Reports are supporting evidence only.
      */

      const studentReports =
        getStudentReports(
          caseData.studentId,
        );

      const formattedReports =
        studentReports.map(
          (report) => ({
            reportId:
              report._id,

            offense:
              report.offense ||
              "",

            description:
              report.description ||
              "",

            location:
              report.location ||
              "",

            date:
              report.date ||
              null,

            time:
              report.time ||
              "",

            status:
              report.status ||
              "",

            evidence:
              report.evidence ||
              [],
          }),
        );

      /*
        =====================================================
        RISK
        =====================================================

        Risk is secondary context. It does not override the
        current incident.
      */

      const riskLevel =
        getRiskLevelForStudent(
          caseData.studentId,
        );

      /*
        =====================================================
        TIMELINE
        =====================================================

        Explicitly mark the current incident and historical
        incidents so the backend/AI can distinguish them.
      */

      const timeline = [
        {
          type: "current-incident",
          ...currentIncident,
        },

        ...previousIncidents.map(
          (incident) => ({
            type: "previous-incident",
            ...incident,
          }),
        ),
      ];

      /*
        Keep incidents for backward compatibility with the
        existing /student-analysis endpoint.

        The CURRENT INCIDENT is always first.
      */
      const incidents = [
        currentIncident,
        ...previousIncidents,
      ];

      /*
        =====================================================
        AI REQUEST
        =====================================================
      */

      const response =
        await API.post(
          "/api/gemini/student-analysis",
          {
            /*
              PRIMARY DATA
            */
            currentIncident,

            /*
              SUPPORTING CONTEXT
            */
            grade:
              caseData.grade,

            riskLevel,

            previousIncidents,

            timeline,

            incidents,

            reports:
              formattedReports,

            /*
              Tell the backend exactly what conclusion format
              the frontend requires.
            */
            requiredConclusionOptions:
              [
                "Warning",
                "Call a Parent",
                "Community Service",
                "Suspension",
              ],

            recommendationInstruction:
              "Base the recommendation primarily on the CURRENT INCIDENT. Previous incidents and reports are secondary context only. The recommendation must end with a conclusion using exactly one of: Warning, Call a Parent, Community Service, or Suspension. Include the supplied research support when relevant and explain the evidence basis.",
          },
          {
            timeout: 90000,
          },
        );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "AI analysis failed.",
        );
      }

      /*
        Make sure the recommendation ALWAYS has a valid
        conclusion even if the backend response did not
        explicitly format it correctly.
      */
      const normalized =
        normalizeAIRecommendation(
          response.data,
          caseData.level ||
            "Low",
        );

      setAiRecommendations(
        (prev) => ({
          ...prev,
          [incidentId]:
            normalized,
        }),
      );
    } catch (error) {
      console.error(
        "❌ AI recommendation error:",
        error.response?.data ||
          error.message,
      );

      let message =
        "Unable to generate an AI recommendation.";

      if (
        error.response?.status ===
        429
      ) {
        message =
          "AI service is temporarily rate-limited. Please try again later.";
      } else if (
        error.response?.status ===
        503
      ) {
        message =
          "AI service is temporarily busy. Please try again later.";
      } else if (
        error.code ===
        "ECONNABORTED"
      ) {
        message =
          "AI analysis took too long to complete.";
      }

      setAiError(message);

      /*
        Store a fallback object so the UI doesn't break.

        IMPORTANT:
        This is explicitly marked as an error and is NOT
        presented as a research-backed AI result.
      */
      setAiRecommendations(
        (prev) => ({
          ...prev,

          [incidentId]: {
            recommendation:
              "AI recommendation unavailable",

            conclusion: null,

            basis: message,

            references: [],

            referenceIds: [],

            summary: "",
            risk: "",
            prediction: "",
            pattern: "",

            error: true,
          },
        }),
      );
    } finally {
      setAiLoading(false);
    }
  };

  /*
    Display a concise recommendation on the case card.
  */
  const getRecommendationLabel = (
    caseData,
  ) => {
    const aiResult =
      getAIRecommendation(
        caseData.incidentId,
      );

    if (
      aiResult?.conclusion
    ) {
      return aiResult.conclusion;
    }

    if (
      aiLoading &&
      selected?.incidentId ===
        caseData.incidentId
    ) {
      return "Analyzing...";
    }

    return "View AI recommendation";
  };

  /* =========================================================
     DATE HELPERS
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
  };

  const formatDateTime = (
    date,
  ) => {
    if (!date) return "N/A";

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return date;
    }

    return parsed.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      },
    );
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async () => {
    try {
      if (!selected) return;

      await API.post(
        "/api/interventions",
        {
          studentId:
            selected.studentId,

          incidentId:
            selected.incidentId,

          type: form.type,

          description:
            form.description,

          interventionBy:
            loggedInUser,

          approvedBy:
            loggedInUser,
        },
      );

      addAuditLog(
        `Created intervention: ${form.type}`,
      );

      await fetchData();

      setForm({
        type: "warning",
        description: "",
      });

      setOpen(false);
      setSelected(null);
    } catch (err) {
      console.error(
        err.response?.data ||
          err.message,
      );
    }
  };

  /* =========================================================
     COMPLETE
  ========================================================= */

  const markComplete = async (
    id,
  ) => {
    try {
      await API.put(
        `/api/interventions/${id}/resolve`,
        {
          completedBy:
            loggedInUser,
        },
      );

      addAuditLog(
        "Marked intervention as completed",
      );

      await fetchData();
    } catch (err) {
      console.error(
        err.response?.data ||
          err.message,
      );
    }
  };

  /* =========================================================
     INTERVENTION CASES
  ========================================================= */

  const interventionCases =
    useMemo(() => {
      return cases.filter(
        (c) => {
          const interventionList =
            getIncidentInterventions(
              c.incidentId,
            );

          return (
            c.status ===
              "intervention-ready" ||
            interventionList.length >
              0
          );
        },
      );
    }, [
      cases,
      interventions,
    ]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered =
    useMemo(() => {
      return interventionCases.filter(
        (c) => {
          const status =
            getIncidentInterventionStatus(
              c.incidentId,
            );

          if (
            tab !== "all" &&
            tab !== status
          ) {
            return false;
          }

          const searchTerm =
            search
              .trim()
              .toLowerCase();

          if (
            searchTerm &&
            !c.studentName
              .toLowerCase()
              .includes(
                searchTerm,
              ) &&
            !c.offense
              .toLowerCase()
              .includes(
                searchTerm,
              )
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      interventionCases,
      tab,
      search,
    ]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = {
    total:
      interventionCases.length,

    ongoing:
      interventionCases.filter(
        (c) =>
          getIncidentInterventionStatus(
            c.incidentId,
          ) === "ongoing",
      ).length,

    completed:
      interventionCases.filter(
        (c) =>
          getIncidentInterventionStatus(
            c.incidentId,
          ) === "completed",
      ).length,

    pending:
      interventionCases.filter(
        (c) =>
          getIncidentInterventionStatus(
            c.incidentId,
          ) === "none",
      ).length,
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusConfig = (
    status,
  ) => {
    if (
      status ===
      "completed"
    ) {
      return {
        label: "Completed",
        icon: CheckCircle2,
        badge:
          "bg-emerald-50 text-emerald-700 border-emerald-100",
        dot: "bg-emerald-500",
      };
    }

    if (
      status === "ongoing"
    ) {
      return {
        label: "Ongoing",
        icon: Activity,
        badge:
          "bg-amber-50 text-amber-700 border-amber-100",
        dot: "bg-amber-500",
      };
    }

    return {
      label: "Pending",
      icon: Clock3,
      badge:
        "bg-blue-50 text-blue-700 border-blue-100",
      dot: "bg-blue-500",
    };
  };

  /* =========================================================
     META
  ========================================================= */

  const Meta = ({
    label,
    value,
    icon: Icon,
  }) => (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <Icon
            size={13}
            className="text-gray-400"
          />
        )}

        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
      </div>

      <p className="text-sm font-semibold text-gray-700 truncate">
        {value || "N/A"}
      </p>
    </div>
  );

  /* =========================================================
     OPEN CASE
  ========================================================= */

  const openCase = async (
    caseData,
  ) => {
    setSelected(caseData);
    setOpenTimeline(null);
    setOpen(true);

    await runAIRecommendation(
      caseData,
    );
  };

  /* =========================================================
     RETURN
  ========================================================= */

  const pageBg = darkMode ? "bg-[#07110D]" : "bg-[#F5F8F6]";
  const textPrimary = darkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = darkMode ? "text-slate-500" : "text-gray-400";

  return (
    <div
      className={`case-intervention min-h-screen w-full flex ${pageBg} ${textPrimary} overflow-hidden transition-colors duration-300 ${darkMode ? "case-intervention-dark" : ""}`}
    >
      <style>{`
        .case-intervention-dark [class*="bg-white"] { background-color: #0C1913 !important; }
        .case-intervention-dark [class*="bg-gray-50"] { background-color: #101F17 !important; }
        .case-intervention-dark [class*="bg-gray-100"] { background-color: #14231C !important; }
        .case-intervention-dark [class*="bg-gray-200"] { background-color: #1A2C23 !important; }
        .case-intervention-dark .bg-[#F8FAFC] { background-color: #101F17 !important; }
        .case-intervention-dark .bg-white { background-color: #0C1913 !important; }
        .case-intervention-dark .bg-gray-50 { background-color: #101F17 !important; }
        .case-intervention-dark .bg-gray-100 { background-color: #14231C !important; }
        .case-intervention-dark .bg-gray-200 { background-color: #1A2C23 !important; }
        .case-intervention-dark .intervention-modal {
          background-color: #0C1913 !important;
          border-color: rgba(6,78,59,.65) !important;
          color: #E2E8F0 !important;
        }
        .case-intervention-dark .intervention-modal [class*="bg-white"],
        .case-intervention-dark .intervention-modal [class*="bg-[#F8FAFC]"],
        .case-intervention-dark .intervention-modal [class*="bg-gray-50"],
        .case-intervention-dark .intervention-modal [class*="bg-gray-100"] {
          background-color: #101F17 !important;
        }
        /* AI recommendation surfaces inside the modal */
        .case-intervention-dark .intervention-modal .bg-green-50\/80 { background-color: rgba(6,78,59,.28) !important; }
        .case-intervention-dark .intervention-modal .bg-white\/80 { background-color: #101F17 !important; }
        .case-intervention-dark .intervention-modal [class*="bg-green-50\/"] { background-color: rgba(6,78,59,.28) !important; }
        .case-intervention-dark .intervention-modal [class*="bg-white\/"] { background-color: #101F17 !important; }
        .case-intervention-dark .intervention-modal .text-green-900 { color: #D1FAE5 !important; }
        .case-intervention-dark .intervention-modal .text-green-800 { color: #A7F3D0 !important; }
        .case-intervention-dark .intervention-modal .text-green-700 { color: #6EE7B7 !important; }
        .case-intervention-dark .intervention-modal .text-green-600 { color: #34D399 !important; }
        .case-intervention-dark .intervention-modal .text-green-700\/60 { color: rgba(110,231,183,.65) !important; }
        .case-intervention-dark .intervention-modal .text-green-700\/80 { color: rgba(167,243,208,.82) !important; }
        .case-intervention-dark .intervention-modal .border-green-100 { border-color: rgba(6,78,59,.55) !important; }

        .case-intervention-dark .intervention-modal input,
        .case-intervention-dark .intervention-modal textarea,
        .case-intervention-dark .intervention-modal select {
          background-color: #0C1913 !important;
          color: #E2E8F0 !important;
          border-color: rgba(6,78,59,.65) !important;
        }
        .case-intervention-dark .intervention-modal ::placeholder {
          color: #64748B !important;
        }
        .case-intervention-dark .intervention-modal .text-gray-900 { color: #F1F5F9 !important; }
        .case-intervention-dark .intervention-modal .text-gray-800 { color: #E2E8F0 !important; }
        .case-intervention-dark .intervention-modal .text-gray-700 { color: #CBD5E1 !important; }
        .case-intervention-dark .intervention-modal .text-gray-600 { color: #94A3B8 !important; }
        .case-intervention-dark .intervention-modal .text-gray-500,
        .case-intervention-dark .intervention-modal .text-gray-400 { color: #64748B !important; }

        .case-intervention-dark .bg-green-50 { background-color: rgba(6,78,59,.28) !important; }
        .case-intervention-dark .bg-green-100 { background-color: rgba(6,78,59,.42) !important; }
        .case-intervention-dark .bg-amber-50 { background-color: rgba(120,53,15,.28) !important; }
        .case-intervention-dark .bg-blue-50 { background-color: rgba(30,64,175,.25) !important; }
        .case-intervention-dark .bg-emerald-50 { background-color: rgba(6,78,59,.28) !important; }
        .case-intervention-dark .bg-red-50 { background-color: rgba(127,29,29,.28) !important; }
        .case-intervention-dark .bg-purple-50 { background-color: rgba(107,33,168,.24) !important; }
        .case-intervention-dark .border-white { border-color: rgba(255,255,255,.10) !important; }
        .case-intervention-dark .border-gray-100 { border-color: rgba(6,78,59,.55) !important; }
        .case-intervention-dark .border-gray-200 { border-color: rgba(6,78,59,.65) !important; }
        .case-intervention-dark .border-gray-300 { border-color: rgba(6,78,59,.8) !important; }
        .case-intervention-dark .border-green-100 { border-color: rgba(6,78,59,.55) !important; }
        .case-intervention-dark .border-green-200 { border-color: rgba(6,78,59,.7) !important; }
        .case-intervention-dark .border-amber-200 { border-color: rgba(245,158,11,.3) !important; }
        .case-intervention-dark .border-red-100, .case-intervention-dark .border-red-200 { border-color: rgba(239,68,68,.3) !important; }
        .case-intervention-dark .text-gray-900 { color: #F1F5F9 !important; }
        .case-intervention-dark .text-gray-800 { color: #E2E8F0 !important; }
        .case-intervention-dark .text-gray-700 { color: #CBD5E1 !important; }
        .case-intervention-dark .text-gray-600 { color: #94A3B8 !important; }
        .case-intervention-dark .text-gray-500 { color: #64748B !important; }
        .case-intervention-dark .text-gray-400 { color: #64748B !important; }
        .case-intervention-dark .text-gray-300 { color: #475569 !important; }
        .case-intervention-dark .text-green-800 { color: #A7F3D0 !important; }
        .case-intervention-dark .text-green-700 { color: #6EE7B7 !important; }
        .case-intervention-dark .text-green-600 { color: #34D399 !important; }
        .case-intervention-dark .text-amber-700 { color: #FCD34D !important; }
        .case-intervention-dark .text-amber-600 { color: #FBBF24 !important; }
        .case-intervention-dark .text-blue-700 { color: #93C5FD !important; }
        .case-intervention-dark .text-emerald-700 { color: #6EE7B7 !important; }
        .case-intervention-dark input, .case-intervention-dark textarea, .case-intervention-dark select {
          background-color: #0C1913 !important; color: #E2E8F0 !important; border-color: rgba(6,78,59,.65) !important; color-scheme: dark;
        }
        .case-intervention-dark input::placeholder, .case-intervention-dark textarea::placeholder { color: #64748B !important; }
        .case-intervention-dark .hover\:bg-gray-50:hover { background-color: #14231C !important; }
        .case-intervention-dark .hover\:bg-gray-100:hover { background-color: #192A21 !important; }
        .case-intervention-dark .hover\:bg-green-50:hover { background-color: rgba(6,78,59,.38) !important; }
        .case-intervention-dark .shadow-sm, .case-intervention-dark .shadow-md, .case-intervention-dark .shadow-xl { box-shadow: 0 14px 38px rgba(0,0,0,.22) !important; }
        .case-intervention-dark .theme-toggle { background-color: #0C1913 !important; border-color: rgba(6,78,59,.60) !important; }
        .case-intervention-dark .theme-toggle-switch { background-color: #16A34A !important; }
        .case-intervention-dark .theme-toggle-switch { overflow: hidden !important; }
        .case-intervention-dark .theme-toggle-knob { background-color: #000000 !important; }
        .case-intervention-dark option { background: #0C1913; color: #E2E8F0; }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[250px] xl:w-[270px] flex-col justify-between px-4 xl:px-5 py-6 overflow-y-auto border-r transition-colors duration-300 ${darkMode ? "bg-[#09150F] border-emerald-950/60" : "bg-white border-gray-100"}`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
          <div className="px-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 xl:w-11 h-10 xl:h-11 flex items-center justify-center flex-shrink-0">
                <img src="/school-logo.webp" alt="School Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-xl font-extrabold tracking-tight ${textPrimary}`}>Guid<span className="text-green-500">Ed</span></h1>
                <p className={`text-[9px] uppercase tracking-widest font-semibold truncate ${textMuted}`}>Student Guidance</p>
              </div>
            </div>
            <p className={`text-[11px] leading-relaxed mt-4 ${textMuted}`}>Our Lady of the Holy Rosary School<br />General Trias Campus</p>
          </div>
          <p className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Main Menu</p>
          <div className="space-y-1">
            <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate("/dashboard")} darkMode={darkMode} />
            <Nav icon={<Users size={18} />} label="Students" onClick={() => navigate("/students")} darkMode={darkMode} />
            <Nav icon={<ShieldX size={18} />} label="Guidance" onClick={() => navigate("/guidance")} darkMode={darkMode} />
            <Nav icon={<ChartNoAxesCombined size={18} />} label="Reports" onClick={() => navigate("/reports")} darkMode={darkMode} />
            <Nav icon={<BriefcaseBusiness size={18} />} label="Cases" onClick={() => navigate("/cases")} darkMode={darkMode} />
            <Nav icon={<HandHelping size={18} />} label="Interventions" active darkMode={darkMode} />
          </div>
          <p className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>System</p>
          <Nav icon={<Settings size={18} />} label="Settings" onClick={() => navigate("/settings")} darkMode={darkMode} />
        </div>
        <div className="space-y-2.5 flex-shrink-0 pt-3">
          <div className={`p-3 rounded-2xl border ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-gray-50 border-gray-100"}`}>
            <div className="flex items-center gap-3">
              <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-950/60" : "bg-green-100"}`}>
                {adminPhoto ? <img src={adminPhoto} alt={adminName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span className="text-green-700 font-bold">{adminName.charAt(0).toUpperCase()}</span>}
                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}>Administrator</p>
                <p className={`text-sm font-bold truncate ${textPrimary}`}>{adminName}</p>
              </div>
            </div>
          </div>
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          <button onClick={logout} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${darkMode ? "text-slate-300 border-emerald-950/60 hover:bg-red-950/30 hover:text-red-300" : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"}`}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className={`fixed left-0 top-0 bottom-0 z-50 w-[270px] flex flex-col justify-between px-4 py-6 overflow-hidden border-r lg:hidden ${darkMode ? "bg-[#09150F] border-emerald-950/60" : "bg-white border-gray-100"}`}>
              <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
                <div className="flex items-center justify-between px-3 mb-8">
                  <div className="flex items-center gap-3"><img src="/school-logo.webp" alt="School Logo" className="w-10 h-10 object-contain" /><div><h1 className={`text-xl font-extrabold ${textPrimary}`}>Guid<span className="text-green-500">Ed</span></h1><p className={`text-[9px] uppercase tracking-widest font-semibold ${textMuted}`}>Student Guidance</p></div></div>
                  <button onClick={() => setMobileMenuOpen(false)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? "text-slate-300 hover:bg-emerald-950/40" : "text-gray-500 hover:bg-gray-50"}`}><X size={18} /></button>
                </div>
                <p className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Main Menu</p>
                <div className="space-y-1">
                  <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }} darkMode={darkMode} />
                  <Nav icon={<Users size={18} />} label="Students" onClick={() => { setMobileMenuOpen(false); navigate("/students"); }} darkMode={darkMode} />
                  <Nav icon={<ShieldX size={18} />} label="Guidance" onClick={() => { setMobileMenuOpen(false); navigate("/guidance"); }} darkMode={darkMode} />
                  <Nav icon={<ChartNoAxesCombined size={18} />} label="Reports" onClick={() => { setMobileMenuOpen(false); navigate("/reports"); }} darkMode={darkMode} />
                  <Nav icon={<BriefcaseBusiness size={18} />} label="Cases" onClick={() => { setMobileMenuOpen(false); navigate("/cases"); }} darkMode={darkMode} />
                  <Nav icon={<HandHelping size={18} />} label="Interventions" active darkMode={darkMode} />
                </div>
                <p className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>System</p>
                <Nav icon={<Settings size={18} />} label="Settings" onClick={() => { setMobileMenuOpen(false); navigate("/settings"); }} darkMode={darkMode} />
              </div>
              <div className="space-y-2.5 flex-shrink-0 pt-3">
                <div className={`p-3 rounded-2xl border ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-950/60" : "bg-green-100"}`}>
                      {adminPhoto ? <img src={adminPhoto} alt={adminName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span className={`font-bold ${darkMode ? "text-emerald-300" : "text-green-700"}`}>{adminName.charAt(0).toUpperCase()}</span>}
                      <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${darkMode ? "border-[#0C1913]" : "border-white"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}>Administrator</p>
                      <p className={`text-sm font-bold truncate ${textPrimary}`}>{adminName}</p>
                    </div>
                  </div>
                </div>
                <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                <button onClick={logout} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border ${darkMode ? "text-slate-300 border-emerald-950/60 hover:bg-red-950/30 hover:text-red-300" : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"}`}><LogOut size={16} /> Sign out</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-[250px] xl:ml-[270px] overflow-y-auto">
        {/* HEADER */}

        <header className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors duration-300 ${darkMode ? "bg-[#07110D]/90 border-emerald-950/50" : "bg-[#F7F9F8]/90 border-gray-100"}`}>
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className={`flex items-center gap-2 text-xs mb-1.5 ${textMuted}`}>
                <button className={`lg:hidden mr-1 w-9 h-9 rounded-xl flex items-center justify-center border ${darkMode ? "border-emerald-950/60 bg-[#0C1913] text-slate-300" : "border-gray-200 bg-white text-gray-600"}`} onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
                <span>Management</span>
                <ChevronRight size={13} />
                <span className="text-green-600 font-semibold">Interventions</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>Intervention Management</h2>
              <p className={`text-xs sm:text-sm mt-1 ${textMuted}`}>Manage student interventions, sanctions, and rehabilitation plans.</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setDarkMode((v) => !v)} className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center border transition ${darkMode ? "bg-[#0C1913] border-emerald-950/60 text-slate-300 hover:bg-emerald-950/30" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"}`} aria-label="Toggle theme">
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <div className="relative">
                <button onClick={() => setOpenNotif(!openNotif)} className={`relative w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition ${darkMode ? "bg-[#0C1913] border-emerald-950/60 text-slate-300 hover:bg-emerald-950/30" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"}`}>
                  <Bell size={17} />
                  {notifications.length > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#F7F9F8]">{notifications.length > 9 ? "9+" : notifications.length}</span>}
                </button>
                <AnimatePresence>
                  {openNotif && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} className={`absolute right-0 mt-3 w-[330px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden shadow-xl z-50 border ${darkMode ? "bg-[#0C1913] border-emerald-950/60" : "bg-white border-gray-100"}`}>
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div><h3 className="font-bold text-gray-900 text-sm">Notifications</h3><p className="text-xs text-gray-400 mt-0.5">Cases requiring attention</p></div>
                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><Sparkles size={15} /></div>
                      </div>
                      <div className="max-h-[380px] overflow-y-auto">
                        {notifications.length === 0 ? <div className="py-12 text-center"><Bell size={24} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No notifications</p></div> : notifications.map((n) => (
                          <div key={n.id} className="px-5 py-4 border-b border-gray-100">
                            <div className="flex gap-3"><div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><AlertCircle size={16} /></div><div className="min-w-0"><p className="font-semibold text-sm text-gray-900">{n.title}</p><p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.text}</p><div className="flex items-center justify-between gap-3 mt-2"><span className="text-[11px] font-semibold text-green-700 truncate">{n.student}</span><span className="text-[10px] text-gray-400 shrink-0">{new Date(n.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div></div></div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 max-w-[1600px] mx-auto">
          {/* =================================================
              INTERVENTION MANAGEMENT HERO
              Matches the CaseManagement hero card exactly.
          ================================================= */}

          <section className="mb-8">
            <div
              className={`
                relative
                overflow-hidden
                rounded-3xl
                border
                p-5 sm:p-7
                ${
                  darkMode
                    ? "bg-gradient-to-br from-[#0C2418] via-[#0D321F] to-[#091B12] border-emerald-900/40"
                    : "bg-gradient-to-br from-white via-[#EFF9F3] to-[#E5F5EB] border-green-100"
                }
              `}
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-24 w-52 h-52 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div
                    className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                      border text-[10px] sm:text-[11px] font-bold uppercase tracking-wider
                      ${
                        darkMode
                          ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
                          : "bg-white/80 border-green-100 text-green-700"
                      }
                    `}
                  >
                    <Sparkles size={12} />
                    GuidEd • Intervention Management
                  </div>

                  <h1
                    className={`
                      text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-4
                      ${darkMode ? "text-white" : "text-slate-900"}
                    `}
                  >
                    Your intervention workload,
                    <span className="text-green-500">{" "}at a glance.</span>
                  </h1>

                  <p
                    className={`
                      text-sm sm:text-base leading-relaxed mt-3 max-w-xl
                      ${darkMode ? "text-slate-300" : "text-slate-500"}
                    `}
                  >
                    Review active interventions, monitor student support progress, and keep every
                    intervention moving through the guidance workflow from one organized workspace.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <div
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                        ${
                          darkMode
                            ? "bg-white/5 text-slate-300 border border-white/10"
                            : "bg-white/80 text-slate-600 border border-white"
                        }
                      `}
                    >
                      <BriefcaseBusiness size={14} className="text-green-500" />
                      {stats.total} interventions
                    </div>

                    <div
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                        ${
                          darkMode
                            ? "bg-amber-950/30 text-amber-300 border border-amber-900/30"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }
                      `}
                    >
                      <Activity size={14} />
                      {stats.ongoing} ongoing
                    </div>

                    <div
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                        ${
                          darkMode
                            ? "bg-emerald-950/30 text-emerald-300 border border-emerald-900/30"
                            : "bg-green-50 text-green-700 border border-green-100"
                        }
                      `}
                    >
                      <ShieldCheck size={14} />
                      {stats.completed} completed
                    </div>
                  </div>
                </div>

                <div
                  className={`
                    shrink-0 w-full xl:w-[260px] rounded-2xl p-4 border
                    ${darkMode ? "bg-black/10 border-white/10" : "bg-white/70 border-white"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                      <ClipboardList size={20} />
                    </div>

                    <div>
                      <p className={`text-xs font-semibold ${textMuted}`}>Directory</p>
                      <p className={`text-lg font-extrabold ${textPrimary}`}>{filtered.length}</p>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed mt-3 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Currently matching your selected search and filters.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* INTERVENTION COMMAND CENTER */}

          <section className="mb-7">
            <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_.65fr] gap-4">
              <div className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${darkMode ? "bg-[#0C1913] border-emerald-950/60" : "bg-white border-gray-100"} shadow-sm`}>
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-green-500/5 pointer-events-none" />
                <div className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-emerald-950/60 text-emerald-300" : "bg-green-50 text-green-600"}`}>
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Intervention command center</p>
                        <h3 className={`text-lg font-black ${textPrimary}`}>Keep every support plan moving.</h3>
                      </div>
                    </div>
                    <button onClick={fetchData} className={`h-10 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${darkMode ? "bg-[#101F17] border-emerald-950/60 text-slate-300 hover:bg-emerald-950/30" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      <Activity size={14} /> Refresh
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {[
                      { label: "Total", value: stats.total, icon: FileText, tone: "green" },
                      { label: "Pending", value: stats.pending, icon: Clock3, tone: "blue" },
                      { label: "Ongoing", value: stats.ongoing, icon: Activity, tone: "amber" },
                      { label: "Completed", value: stats.completed, icon: CircleCheck, tone: "emerald" },
                    ].map((item) => {
                      const Icon = item.icon;
                      const toneClass =
                        item.tone === "amber"
                          ? darkMode ? "bg-amber-950/30 text-amber-300" : "bg-amber-50 text-amber-600"
                          : item.tone === "blue"
                            ? darkMode ? "bg-blue-950/30 text-blue-300" : "bg-blue-50 text-blue-600"
                            : darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-green-50 text-green-600";
                      return (
                        <div key={item.label} className={`rounded-2xl border p-3.5 ${darkMode ? "bg-[#101F17] border-emerald-950/50" : "bg-[#F8FAFC] border-gray-100"}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${toneClass}`}><Icon size={15} /></div>
                          <p className={`text-2xl font-black ${textPrimary}`}>{item.value}</p>
                          <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${textMuted}`}>{item.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={`rounded-3xl border p-5 sm:p-6 ${darkMode ? "bg-[#0C1913] border-emerald-950/60" : "bg-white border-gray-100"} shadow-sm`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Workload pulse</p>
                    <h3 className={`text-base font-black mt-1 ${textPrimary}`}>Intervention progress</h3>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-green-50 text-green-600"}`}><ChartNoAxesCombined size={17} /></div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${textMuted}`}>Completion rate</span>
                    <span className={`text-sm font-black ${darkMode ? "text-emerald-300" : "text-green-700"}`}>{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-emerald-950/50" : "bg-green-50"}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-5">
                  {[
                    { label: "Pending", value: stats.pending, dot: "bg-blue-500" },
                    { label: "Ongoing", value: stats.ongoing, dot: "bg-amber-500" },
                    { label: "Done", value: stats.completed, dot: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl p-3 ${darkMode ? "bg-[#101F17]" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${item.dot}`} /><span className={`text-[10px] font-bold ${textMuted}`}>{item.label}</span></div>
                      <p className={`text-lg font-black mt-1 ${textPrimary}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}

          <section className="mb-7">
            <div className="mb-4">
              <p className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Shortcuts</p>
              <h3 className={`text-xl font-black mt-1 ${textPrimary}`}>Move faster</h3>
              <p className={`text-sm mt-1 ${textMuted}`}>Jump straight to the work that needs attention.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: "Review pending", description: `${stats.pending} case${stats.pending === 1 ? "" : "s"} waiting`, icon: Clock3, action: () => setTab("none"), className: darkMode ? "bg-blue-950/20 border-blue-900/40 hover:bg-blue-950/30" : "bg-blue-50/60 border-blue-100 hover:bg-blue-50", iconClass: darkMode ? "bg-blue-950/50 text-blue-300" : "bg-white text-blue-600" },
                { label: "Continue ongoing", description: `${stats.ongoing} active plan${stats.ongoing === 1 ? "" : "s"}`, icon: Activity, action: () => setTab("ongoing"), className: darkMode ? "bg-amber-950/20 border-amber-900/40 hover:bg-amber-950/30" : "bg-amber-50/60 border-amber-100 hover:bg-amber-50", iconClass: darkMode ? "bg-amber-950/50 text-amber-300" : "bg-white text-amber-600" },
                { label: "Create intervention", description: "Start a new support plan", icon: Plus, action: () => { const target = filtered[0] || interventionCases[0]; if (target) { setSelected(target); setOpen(true); } }, className: darkMode ? "bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-950/30" : "bg-green-50/60 border-green-100 hover:bg-green-50", iconClass: darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-white text-green-600" },
                { label: "Printable report", description: "Prepare a case summary", icon: Printer, action: () => setShowPrintableReport(true), className: darkMode ? "bg-[#101F17] border-emerald-950/50 hover:bg-emerald-950/30" : "bg-white border-gray-100 hover:bg-gray-50", iconClass: darkMode ? "bg-[#14231C] text-slate-300" : "bg-gray-50 text-gray-600" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={item.action} className={`group text-left rounded-2xl border p-4 transition ${item.className}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconClass}`}><Icon size={17} /></div>
                      <div className="min-w-0 flex-1"><p className={`text-sm font-bold ${textPrimary}`}>{item.label}</p><p className={`text-[11px] mt-0.5 ${textMuted}`}>{item.description}</p></div>
                      <ChevronRight size={15} className={`shrink-0 transition-transform group-hover:translate-x-1 ${textMuted}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* FIND + FILTER WORKSPACE */}

          <section className={`rounded-3xl border p-4 sm:p-5 mb-6 ${darkMode ? "bg-[#0C1913] border-emerald-950/60" : "bg-white border-gray-100"} shadow-sm`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Intervention directory</p>
                <h3 className={`text-lg font-black mt-1 ${textPrimary}`}>Find the right case</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className={`flex items-center gap-3 h-11 px-4 rounded-xl border w-full sm:w-[330px] focus-within:ring-4 transition ${darkMode ? "bg-[#101F17] border-emerald-950/60 focus-within:border-emerald-700 focus-within:ring-emerald-950/30" : "bg-gray-50 border-gray-200 focus-within:border-green-300 focus-within:ring-green-50"}`}>
                  <Search size={16} className={textMuted} />
                  <input className={`bg-transparent outline-none w-full text-sm ${darkMode ? "text-slate-100 placeholder:text-slate-500" : "text-gray-700 placeholder:text-gray-400"}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or incident..." />
                  {search && <button onClick={() => setSearch("")} className={textMuted} aria-label="Clear search"><X size={15} /></button>}
                </div>
                <div className={`flex items-center rounded-xl border p-1 overflow-x-auto ${darkMode ? "bg-[#101F17] border-emerald-950/60" : "bg-gray-50 border-gray-200"}`}>
                  {[
                    { id: "all", label: "All" },
                    { id: "none", label: "Pending" },
                    { id: "ongoing", label: "Ongoing" },
                    { id: "completed", label: "Completed" },
                  ].map((item) => (
                    <button key={item.id} onClick={() => setTab(item.id)} className={`px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${tab === item.id ? darkMode ? "bg-emerald-900/50 text-emerald-200" : "bg-white text-green-700 shadow-sm" : textMuted}`}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t ${darkMode ? "border-emerald-950/40" : "border-gray-100"}`}>
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className={`text-[10px] uppercase tracking-wider font-bold shrink-0 ${textMuted}`}>Priority</span>
                {[
                  { id: "all", label: "All cases" },
                  { id: "High", label: "High risk" },
                  { id: "Medium", label: "Medium" },
                  { id: "Low", label: "Low" },
                ].map((item) => (
                  <button key={item.id} onClick={() => setPriorityFilter(item.id)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold whitespace-nowrap transition ${priorityFilter === item.id ? darkMode ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-200" : "bg-green-50 border-green-100 text-green-700" : darkMode ? "border-emerald-950/50 text-slate-400 hover:bg-emerald-950/20" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{item.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold ${textMuted}`}>
                  {filtered.filter((c) => priorityFilter === "all" || String(c.level || "").toLowerCase() === priorityFilter.toLowerCase()).length} matching
                </span>
                <div className={`flex items-center rounded-lg border p-0.5 ${darkMode ? "border-emerald-950/60 bg-[#101F17]" : "border-gray-200 bg-gray-50"}`}>
                  <button onClick={() => setViewMode("cards")} className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold ${viewMode === "cards" ? darkMode ? "bg-emerald-900/50 text-emerald-200" : "bg-white text-green-700 shadow-sm" : textMuted}`}>Cards</button>
                  <button onClick={() => setViewMode("compact")} className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold ${viewMode === "compact" ? darkMode ? "bg-emerald-900/50 text-emerald-200" : "bg-white text-green-700 shadow-sm" : textMuted}`}>Compact</button>
                </div>
              </div>
            </div>
          </section>

          {/* CASE DIRECTORY */}

          <section className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>Active workload</p>
                <h3 className={`text-xl font-black mt-1 ${textPrimary}`}>Intervention cases</h3>
                <p className={`text-sm mt-1 ${textMuted}`}>Open a case to review its plan, history, and GuidEd AI recommendation.</p>
              </div>
              {(search || tab !== "all" || priorityFilter !== "all") && (
                <button onClick={() => { setSearch(""); setTab("all"); setPriorityFilter("all"); }} className={`text-xs font-bold px-3 py-2 rounded-xl border ${darkMode ? "border-emerald-950/60 text-emerald-300 hover:bg-emerald-950/30" : "border-green-100 text-green-700 hover:bg-green-50"}`}>Clear filters</button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className={`rounded-3xl border p-10 sm:p-16 text-center ${darkMode ? "bg-[#0C1913] border-emerald-950/60" : "bg-white border-gray-100"} shadow-sm`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-green-50 text-green-600"}`}><ClipboardCheck size={28} /></div>
                <h3 className={`text-lg font-black mt-5 ${textPrimary}`}>No matching intervention cases</h3>
                <p className={`text-sm max-w-sm mx-auto mt-2 leading-relaxed ${textMuted}`}>Try another search or clear the filters to see more cases in the intervention directory.</p>
                <button onClick={() => { setSearch(""); setTab("all"); setPriorityFilter("all"); }} className={`mt-5 px-4 py-2.5 rounded-xl text-xs font-bold ${darkMode ? "bg-emerald-950/50 text-emerald-200 hover:bg-emerald-950/70" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>Reset workspace</button>
              </div>
            ) : (
              <div className={viewMode === "cards" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                {filtered
                  .filter((c) => priorityFilter === "all" || String(c.level || "").toLowerCase() === priorityFilter.toLowerCase())
                  .map((c, index) => {
                    const status = getIncidentInterventionStatus(c.incidentId);
                    const statusConfig = getStatusConfig(status);
                    const StatusIcon = statusConfig.icon;
                    const interventionCount = getIncidentInterventions(c.incidentId).length;
                    const aiResult = getAIRecommendation(c.incidentId);

                    if (viewMode === "compact") {
                      return (
                        <button key={c._id} onClick={() => openCase(c)} className={`w-full text-left rounded-2xl border p-4 transition group ${darkMode ? "bg-[#0C1913] border-emerald-950/60 hover:bg-[#101F17]" : "bg-white border-gray-100 hover:border-green-100 hover:shadow-sm"}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-green-50 text-green-700"}`}>{getInitials(c.studentName)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`text-sm font-black ${textPrimary}`}>{c.studentName}</p>
                                <span className={`px-2 py-1 rounded-lg border text-[9px] font-bold ${statusConfig.badge}`}><StatusIcon size={10} className="inline mr-1" />{statusConfig.label}</span>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${String(c.level).toLowerCase() === "high" ? darkMode ? "bg-red-950/40 text-red-300" : "bg-red-50 text-red-700" : String(c.level).toLowerCase() === "medium" ? darkMode ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-700" : darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>{c.level} risk</span>
                              </div>
                              <p className={`text-xs mt-1 truncate ${textMuted}`}>{c.offense} • {c.grade} • {c.studentCode}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right"><p className={`text-[10px] font-bold ${textMuted}`}>{interventionCount} intervention{interventionCount === 1 ? "" : "s"}</p><p className={`text-[10px] mt-1 ${textMuted}`}>{aiResult?.conclusion || "AI review available"}</p></div>
                              <ChevronRight size={16} className={textMuted} />
                            </div>
                          </div>
                        </button>
                      );
                    }

                    return (
                      <motion.article key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.15) }} onClick={() => openCase(c)} className={`group relative overflow-hidden rounded-3xl border p-5 cursor-pointer transition-all ${darkMode ? "bg-[#0C1913] border-emerald-950/60 hover:border-emerald-800/70 hover:bg-[#101F17]" : "bg-white border-gray-100 hover:border-green-100 hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]"}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-600 opacity-70" />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-green-50 text-green-700"}`}>{getInitials(c.studentName)}</div>
                            <div className="min-w-0"><h3 className={`text-base font-black truncate group-hover:text-green-600 transition-colors ${textPrimary}`}>{c.studentName}</h3><p className={`text-[10px] mt-1 truncate ${textMuted}`}>{c.studentCode} • {c.grade} • {c.gender}</p></div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wide ${statusConfig.badge}`}><StatusIcon size={11} className="inline mr-1" />{statusConfig.label}</span>
                        </div>

                        <div className={`mt-5 rounded-2xl border p-4 ${darkMode ? "bg-[#101F17] border-emerald-950/50" : "bg-gray-50 border-gray-100"}`}>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2"><AlertCircle size={13} className={darkMode ? "text-slate-400" : "text-gray-500"} /><span className={`text-[9px] uppercase tracking-widest font-black ${textMuted}`}>Current incident</span></div>
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${String(c.level).toLowerCase() === "high" ? darkMode ? "bg-red-950/40 text-red-300" : "bg-red-50 text-red-700" : String(c.level).toLowerCase() === "medium" ? darkMode ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-700" : darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>{c.level} risk</span>
                          </div>
                          <p className={`text-sm font-bold leading-relaxed line-clamp-2 ${darkMode ? "text-slate-200" : "text-gray-700"}`}>{c.offense}</p>
                          <div className="flex flex-wrap gap-2 mt-3"><span className={`px-2 py-1 rounded-lg text-[9px] font-semibold ${darkMode ? "bg-[#0C1913] text-slate-400" : "bg-white text-gray-500"}`}>{c.category}</span><span className={`px-2 py-1 rounded-lg text-[9px] font-semibold ${darkMode ? "bg-[#0C1913] text-slate-400" : "bg-white text-gray-500"}`}>{interventionCount} plan{interventionCount === 1 ? "" : "s"}</span></div>
                        </div>

                        <div className={`mt-4 rounded-2xl border p-3.5 ${darkMode ? "bg-emerald-950/20 border-emerald-900/50" : "bg-green-50/60 border-green-100"}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? "bg-emerald-950/50 text-emerald-300" : "bg-white text-green-600"}`}><Brain size={15} /></div>
                            <div className="min-w-0 flex-1"><p className={`text-[9px] uppercase tracking-widest font-black ${darkMode ? "text-emerald-400" : "text-green-600"}`}>GuidEd AI Review</p><p className={`text-xs font-bold mt-0.5 truncate ${darkMode ? "text-emerald-200" : "text-green-900"}`}>{aiResult?.conclusion || "Open case to generate a recommendation"}</p></div>
                            <ChevronRight size={15} className={darkMode ? "text-emerald-400" : "text-green-500"} />
                          </div>
                        </div>

                        <div className={`flex items-center justify-between gap-3 mt-4 pt-4 border-t ${darkMode ? "border-emerald-950/50" : "border-gray-100"}`}>
                          <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} /><span className={`text-[10px] font-semibold ${textMuted}`}>{interventionCount ? `${interventionCount} intervention${interventionCount === 1 ? "" : "s"} recorded` : "No intervention recorded yet"}</span></div>
                          <span className={`text-[10px] font-black flex items-center gap-1 ${darkMode ? "text-emerald-300" : "text-green-700"}`}>Open case <ChevronRight size={12} /></span>
                        </div>
                      </motion.article>
                    );
                  })}
              </div>
            )}
          </section>

          {/* SUPPORT SNAPSHOT */}

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6">
            {[
              { label: "Support queue", title: `${stats.pending} pending cases`, text: "Pending cases are ready for an intervention plan or follow-up action.", icon: ClipboardList, iconClass: darkMode ? "bg-blue-950/40 text-blue-300" : "bg-blue-50 text-blue-600" },
              { label: "In progress", title: `${stats.ongoing} active plans`, text: "Keep active support plans updated until their intended action is completed.", icon: Timer, iconClass: darkMode ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-600" },
              { label: "Resolved", title: `${stats.completed} completed`, text: "Completed interventions remain available in the case history for future context.", icon: ShieldCheck, iconClass: darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-emerald-50 text-emerald-600" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`rounded-3xl border p-5 ${darkMode ? "bg-[#0C1913] border-emerald-950/60" : "bg-white border-gray-100"} shadow-sm`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconClass}`}><Icon size={17} /></div>
                    <div><p className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>{item.label}</p><h4 className={`font-black ${textPrimary}`}>{item.title}</h4></div>
                  </div>
                  <p className={`text-xs leading-relaxed mt-4 ${textMuted}`}>{item.text}</p>
                </div>
              );
            })}
          </section>
        </div>
      </main>

      {/* =====================================================
          MODAL
      ===================================================== */}

      <AnimatePresence>
        {open &&
          selected && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                p-5
                bg-gray-950/40
                backdrop-blur-sm
              "
              onMouseDown={(
                e,
              ) => {
                if (
                  e.target ===
                  e.currentTarget
                ) {
                  setOpen(false);
                }
              }}
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.97,
                  y: 16,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  y: 16,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 28,
                }}
                className="
                  w-full
                  max-w-6xl
                  max-h-[92vh]
                  intervention-modal
                  bg-[#F8FAFC]
                  rounded-3xl
                  shadow-2xl
                  overflow-hidden
                  border
                  flex
                  flex-col
                "
              >
                {/* MODAL HEADER */}

                <div
                  className="
                    px-7
                    py-5
                    bg-white
                    border-b
                    border-gray-100
                    flex
                    items-center
                    justify-between
                    shrink-0
                  "
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="
                        w-12
                        h-12
                        rounded-xl
                        bg-green-50
                        text-green-700
                        flex
                        items-center
                        justify-center
                        font-bold
                      "
                    >
                      {getInitials(
                        selected.studentName,
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {
                            selected.studentName
                          }
                        </h2>

                        <span
                          className="
                            px-2
                            py-1
                            rounded-md
                            bg-blue-50
                            text-blue-700
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-wide
                          "
                        >
                          Intervention
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        {selected.grade}{" "}
                        •{" "}
                        {
                          selected.studentCode
                        }{" "}
                        •{" "}
                        {
                          selected.gender
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setOpen(false)
                    }
                    className="
                      w-9
                      h-9
                      rounded-xl
                      bg-gray-50
                      border
                      border-gray-200
                      text-gray-500
                      flex
                      items-center
                      justify-center
                      hover:bg-gray-100
                      hover:text-gray-700
                      transition
                    "
                  >
                    <X
                      size={17}
                    />
                  </button>
                </div>

                {/* MODAL BODY */}

                <div
                  className="
                    grid
                    grid-cols-1
                    lg:grid-cols-12
                    gap-6
                    p-7
                    overflow-y-auto
                  "
                >
                  {/* LEFT */}

                  <div className="lg:col-span-5 space-y-5">
                    {/* STUDENT SUMMARY */}

                    <div
                      className="
                        bg-white
                        border
                        border-gray-100
                        rounded-2xl
                        p-5
                        shadow-sm
                      "
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="
                            w-7
                            h-7
                            rounded-lg
                            bg-gray-100
                            text-gray-500
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <UserRound
                            size={
                              14
                            }
                          />
                        </div>

                        <h3 className="text-sm font-bold text-gray-900">
                          Student Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Meta
                          label="Student"
                          value={
                            selected.studentName
                          }
                          icon={
                            UserRound
                          }
                        />

                        <Meta
                          label="Student ID"
                          value={
                            selected.studentCode
                          }
                        />

                        <Meta
                          label="Grade"
                          value={
                            selected.grade
                          }
                        />

                        <Meta
                          label="Gender"
                          value={
                            selected.gender
                          }
                        />
                      </div>
                    </div>

                    {/* INCIDENT */}

                    <div
                      className="
                        bg-white
                        border
                        border-gray-100
                        rounded-2xl
                        p-5
                        shadow-sm
                      "
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="
                            w-7
                            h-7
                            rounded-lg
                            bg-red-50
                            text-red-500
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <AlertCircle
                            size={
                              14
                            }
                          />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Incident Overview
                          </h3>

                          <p className="text-[10px] text-gray-400">
                            Current incident being reviewed
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          p-4
                          rounded-xl
                          bg-gray-50
                          border
                          border-gray-100
                          space-y-4
                        "
                      >
                        {/* OFFENSE */}

                        <div>
                          <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                            Offense / Incident
                          </p>

                          <p
                            className="
                              text-sm
                              font-semibold
                              text-gray-800
                              leading-relaxed
                            "
                          >
                            {
                              selected.offense
                            }
                          </p>
                        </div>

                        {/* CATEGORY + LEVEL */}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                              Category
                            </p>

                            <p className="text-xs font-semibold text-gray-700">
                              {
                                selected.category
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                              Severity
                            </p>

                            <p className="text-xs font-semibold text-gray-700">
                              {
                                selected.level
                              }
                            </p>
                          </div>
                        </div>

                        {/* STUDENT STATEMENT */}

                        {selected.studentStatement && (
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                              Student Statement
                            </p>

                            <p className="text-xs text-gray-600 leading-relaxed">
                              {
                                selected.studentStatement
                              }
                            </p>
                          </div>
                        )}

                        {/* REPORT DESCRIPTION */}

                        {(() => {
                          const currentReport =
                            reports.find(
                              (
                                report,
                              ) =>
                                String(
                                  report._id,
                                ) ===
                                String(
                                  selected.reportId,
                                ),
                            );

                          if (
                            !currentReport?.description
                          ) {
                            return null;
                          }

                          return (
                            <div>
                              <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                                Report Description
                              </p>

                              <p className="text-xs text-gray-600 leading-relaxed">
                                {
                                  currentReport.description
                                }
                              </p>
                            </div>
                          );
                        })()}

                        {/* DATE / LOCATION */}

                        {(() => {
                          const currentReport =
                            reports.find(
                              (
                                report,
                              ) =>
                                String(
                                  report._id,
                                ) ===
                                String(
                                  selected.reportId,
                                ),
                            );

                          if (
                            !currentReport
                          ) {
                            return null;
                          }

                          return (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                                  Location
                                </p>

                                <p className="text-xs font-semibold text-gray-700">
                                  {
                                    currentReport.location ||
                                    "N/A"
                                  }
                                </p>
                              </div>

                              <div>
                                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                                  Date
                                </p>

                                <p className="text-xs font-semibold text-gray-700">
                                  {formatDate(
                                    currentReport.date,
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* AI */}

                    {(() => {
                      const aiResult =
                        getAIRecommendation(
                          selected.incidentId,
                        );

                      return (
                        <div
                          className={`rounded-2xl border p-5 ${darkMode ? "border-emerald-900/60 bg-emerald-950/35" : "border-green-100 bg-green-50/80"}`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? "bg-[#101F17] text-emerald-400" : "bg-white text-green-600"}`}
                            >
                              {aiLoading ? (
                                <Loader2
                                  size={
                                    17
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Brain
                                  size={
                                    17
                                  }
                                />
                              )}
                            </div>

                            <div>
                              <p
                                className={`text-[10px] uppercase tracking-wider font-bold ${darkMode ? "text-emerald-400" : "text-green-600"}`}
                              >
                                AI Recommendation
                              </p>

                              <p
                                className={`text-base font-bold mt-0.5 ${darkMode ? "text-emerald-200" : "text-green-900"}`}
                              >
                                {aiLoading
                                  ? "Analyzing current incident..."
                                  : aiResult?.conclusion ||
                                    "AI recommendation unavailable"}
                              </p>
                            </div>
                          </div>

                          {/* FULL RECOMMENDATION */}

                          {aiResult?.recommendation && (
                            <div className="mt-4">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-green-700/60 mb-2">
                                Recommendation & Conclusion
                              </p>

                              <div className="p-3.5 rounded-xl bg-white/80 border border-green-100">
                                <p className="text-xs text-green-800 leading-relaxed whitespace-pre-line">
                                  {
                                    aiResult.recommendation
                                  }
                                </p>
                              </div>
                            </div>
                          )}

                          {/* EVIDENCE BASIS */}

                          {aiResult?.basis && (
                            <div className="mt-4">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-green-700/60 mb-1">
                                Evidence Basis
                              </p>

                              <p className="text-xs text-green-700/80 leading-relaxed">
                                {
                                  aiResult.basis
                                }
                              </p>
                            </div>
                          )}

                          {/* RESEARCH */}

                          {aiResult?.references
                            ?.length >
                            0 && (
                            <div className="mt-4 pt-4 border-t border-green-100">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen
                                  size={
                                    13
                                  }
                                  className="text-green-700"
                                />

                                <p className="text-[10px] uppercase tracking-wider font-bold text-green-700">
                                  Research Support
                                </p>
                              </div>

                              <div className="space-y-2">
                                {aiResult.references
                                  .slice(
                                    0,
                                    3,
                                  )
                                  .map(
                                    (
                                      reference,
                                      index,
                                    ) => (
                                      <div
                                        key={
                                          reference.referenceId ||
                                          index
                                        }
                                        className="
                                          p-3
                                          rounded-xl
                                          bg-white/80
                                          border
                                          border-green-100
                                        "
                                      >
                                        <p className="text-xs font-semibold text-green-900 leading-relaxed">
                                          {
                                            reference.citation ||
                                            reference.title ||
                                            "Research reference"
                                          }
                                        </p>

                                        {reference.doi && (
                                          <p className="text-[10px] text-green-700/60 mt-1">
                                            DOI:{" "}
                                            {
                                              reference.doi
                                            }
                                          </p>
                                        )}
                                      </div>
                                    ),
                                  )}
                              </div>
                            </div>
                          )}

                          {/* ERROR */}

                          {aiResult?.error && (
                            <p className="text-xs text-amber-700 mt-3">
                              {
                                aiResult.basis
                              }
                            </p>
                          )}

                          {/* LOADING */}

                          {!aiResult &&
                            aiLoading && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
                                <Loader2
                                  size={
                                    13
                                  }
                                  className="animate-spin"
                                />

                                <span>
                                  Analyzing the current incident and relevant research...
                                </span>
                              </div>
                            )}

                          {/* EMPTY */}

                          {!aiResult &&
                            !aiLoading && (
                              <p className="text-xs text-green-700/70 leading-relaxed">
                                Opened case will be analyzed primarily from the current incident overview, with previous behavioral records used only as supporting context.
                              </p>
                            )}
                        </div>
                      );
                    })()}

                    {/* CASE STATS */}

                    <div className="grid grid-cols-2 gap-3">
                      <Meta
                        label="Case Status"
                        value={
                          getStatusConfig(
                            getIncidentInterventionStatus(
                              selected.incidentId,
                            ),
                          ).label
                        }
                        icon={
                          Activity
                        }
                      />

                      <Meta
                        label="Interventions"
                        value={
                          getIncidentInterventions(
                            selected.incidentId,
                          ).length
                        }
                        icon={
                          HandHelping
                        }
                      />
                    </div>

                    {/* AUDIT */}

                    <div
                      className="
                        bg-white
                        border
                        border-gray-100
                        rounded-2xl
                        p-5
                      "
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-900">
                          Recent Activity
                        </h4>

                        <Activity
                          size={
                            15
                          }
                          className="text-gray-400"
                        />
                      </div>

                      <div className="space-y-3 max-h-32 overflow-y-auto">
                        {auditLog.length ===
                        0 ? (
                          <div
                            className="
                              py-3
                              text-center
                              text-xs
                              text-gray-400
                            "
                          >
                            No actions recorded yet.
                          </div>
                        ) : (
                          auditLog.map(
                            (a) => (
                              <div
                                key={
                                  a.id
                                }
                                className="
                                  flex
                                  items-start
                                  justify-between
                                  gap-3
                                  text-xs
                                "
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className="
                                      mt-1
                                      w-1.5
                                      h-1.5
                                      rounded-full
                                      bg-green-500
                                      shrink-0
                                    "
                                  />

                                  <span className="text-gray-600">
                                    {
                                      a.action
                                    }
                                  </span>
                                </div>

                                <span
                                  className="
                                    text-[10px]
                                    text-gray-400
                                    shrink-0
                                  "
                                >
                                  {new Date(
                                    a.time,
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "numeric",
                                      minute:
                                        "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                            ),
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="lg:col-span-7 space-y-5">
                    {/* TIMELINE */}

                    <div
                      className="
                        bg-white
                        border
                        border-gray-100
                        rounded-2xl
                        shadow-sm
                        p-5
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          mb-5
                        "
                      >
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Intervention Timeline
                          </h3>

                          <p className="text-xs text-gray-400 mt-1">
                            Track all actions taken
                            for this case.
                          </p>
                        </div>

                        <div
                          className="
                            w-8
                            h-8
                            rounded-lg
                            bg-green-50
                            text-green-600
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <Clock3
                            size={
                              15
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {getIncidentInterventions(
                          selected.incidentId,
                        ).length ===
                        0 ? (
                          <div
                            className="
                              py-10
                              text-center
                              rounded-xl
                              bg-gray-50
                              border
                              border-dashed
                              border-gray-200
                            "
                          >
                            <HandHelping
                              size={
                                24
                              }
                              className="mx-auto text-gray-300 mb-2"
                            />

                            <p className="text-sm font-medium text-gray-500">
                              No interventions yet
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              Create the first intervention below.
                            </p>
                          </div>
                        ) : (
                          getIncidentInterventions(
                            selected.incidentId,
                          ).map(
                            (i) => {
                              const isOpen =
                                openTimeline ===
                                i._id;

                              const completed =
                                String(
                                  i.status ||
                                    "",
                                ).toLowerCase() ===
                                "completed";

                              return (
                                <div
                                  key={
                                    i._id
                                  }
                                  className="
                                    border
                                    border-gray-100
                                    rounded-xl
                                    overflow-hidden
                                  "
                                >
                                  <button
                                    onClick={() =>
                                      setOpenTimeline(
                                        isOpen
                                          ? null
                                          : i._id,
                                      )
                                    }
                                    className="
                                      w-full
                                      flex
                                      items-center
                                      justify-between
                                      p-4
                                      text-left
                                      hover:bg-gray-50
                                      transition
                                    "
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="
                                          relative
                                          flex
                                          flex-col
                                          items-center
                                        "
                                      >
                                        <div
                                          className={`
                                            w-8
                                            h-8
                                            rounded-lg
                                            flex
                                            items-center
                                            justify-center
                                            ${
                                              completed
                                                ? "bg-emerald-50 text-emerald-600"
                                                : "bg-amber-50 text-amber-600"
                                            }
                                          `}
                                        >
                                          {completed ? (
                                            <CheckCircle2
                                              size={
                                                15
                                              }
                                            />
                                          ) : (
                                            <Activity
                                              size={
                                                15
                                              }
                                            />
                                          )}
                                        </div>
                                      </div>

                                      <div>
                                        <p
                                          className="
                                            text-sm
                                            font-bold
                                            text-gray-800
                                            capitalize
                                          "
                                        >
                                          {
                                            i.type
                                          }
                                        </p>

                                        <div
                                          className="
                                            flex
                                            items-center
                                            gap-2
                                            mt-1
                                          "
                                        >
                                          <span
                                            className={`
                                              w-1.5
                                              h-1.5
                                              rounded-full
                                              ${
                                                completed
                                                  ? "bg-emerald-500"
                                                  : "bg-amber-500"
                                              }
                                            `}
                                          />

                                          <span
                                            className="
                                              text-[10px]
                                              text-gray-400
                                              uppercase
                                              font-semibold
                                            "
                                          >
                                            {
                                              i.status
                                            }
                                          </span>

                                          {i.createdAt && (
                                            <>
                                              <span className="text-gray-300">
                                                •
                                              </span>

                                              <span
                                                className="
                                                  text-[10px]
                                                  text-gray-400
                                                "
                                              >
                                                {formatDate(
                                                  i.createdAt,
                                                )}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <ChevronRight
                                      size={
                                        16
                                      }
                                      className={`
                                        text-gray-400
                                        transition-transform
                                        ${
                                          isOpen
                                            ? "rotate-90"
                                            : ""
                                        }
                                      `}
                                    />
                                  </button>

                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.div
                                        initial={{
                                          height: 0,
                                          opacity: 0,
                                        }}
                                        animate={{
                                          height:
                                            "auto",
                                          opacity: 1,
                                        }}
                                        exit={{
                                          height: 0,
                                          opacity: 0,
                                        }}
                                        className="border-t border-gray-100"
                                      >
                                        <div className="p-4 space-y-4">
                                          {/* DESCRIPTION */}

                                          <div>
                                            <p
                                              className="
                                                text-[10px]
                                                uppercase
                                                tracking-wider
                                                font-bold
                                                text-gray-400
                                                mb-2
                                              "
                                            >
                                              Intervention Plan
                                            </p>

                                            <div
                                              className="
                                                p-3.5
                                                rounded-xl
                                                bg-gray-50
                                                border
                                                border-gray-100
                                              "
                                            >
                                              <p
                                                className="
                                                  text-sm
                                                  text-gray-600
                                                  leading-relaxed
                                                "
                                              >
                                                {i.description ||
                                                  "No description provided."}
                                              </p>
                                            </div>
                                          </div>

                                          {/* META */}

                                          <div className="grid grid-cols-2 gap-3">
                                            <Meta
                                              label="Intervention By"
                                              value={
                                                i.interventionBy
                                              }
                                            />

                                            <Meta
                                              label="Approved By"
                                              value={
                                                i.approvedBy
                                              }
                                            />

                                            <Meta
                                              label="Created At"
                                              value={formatDateTime(
                                                i.createdAt,
                                              )}
                                            />

                                            <Meta
                                              label="Completed By"
                                              value={
                                                i.completedBy
                                              }
                                            />
                                          </div>

                                          {/* AUDIT TRAIL */}

                                          {i.auditLogs
                                            ?.length >
                                            0 && (
                                            <div
                                              className="
                                                border
                                                border-gray-100
                                                rounded-xl
                                                overflow-hidden
                                              "
                                            >
                                              <div
                                                className="
                                                  px-3
                                                  py-2.5
                                                  bg-gray-50
                                                  border-b
                                                  border-gray-100
                                                "
                                              >
                                                <p
                                                  className="
                                                    text-[10px]
                                                    uppercase
                                                    tracking-wider
                                                    font-bold
                                                    text-gray-500
                                                  "
                                                >
                                                  Audit Trail
                                                </p>
                                              </div>

                                              {i.auditLogs.map(
                                                (
                                                  log,
                                                  idx,
                                                ) => (
                                                  <div
                                                    key={
                                                      idx
                                                    }
                                                    className="
                                                      px-3
                                                      py-3
                                                      flex
                                                      items-start
                                                      justify-between
                                                      gap-4
                                                      border-b
                                                      last:border-b-0
                                                      border-gray-100
                                                    "
                                                  >
                                                    <div>
                                                      <p
                                                        className="
                                                          text-xs
                                                          font-semibold
                                                          text-gray-700
                                                        "
                                                      >
                                                        {
                                                          log.action
                                                        }
                                                      </p>

                                                      {log.note && (
                                                        <p
                                                          className="
                                                            text-[11px]
                                                            text-gray-400
                                                            mt-1
                                                          "
                                                        >
                                                          {
                                                            log.note
                                                          }
                                                        </p>
                                                      )}
                                                    </div>

                                                    <div
                                                      className="
                                                        text-right
                                                        shrink-0
                                                      "
                                                    >
                                                      <p
                                                        className="
                                                          text-[11px]
                                                          font-medium
                                                          text-gray-600
                                                        "
                                                      >
                                                        {
                                                          log.by
                                                        }
                                                      </p>

                                                      <p
                                                        className="
                                                          text-[9px]
                                                          text-gray-400
                                                          mt-1
                                                        "
                                                      >
                                                        {formatDateTime(
                                                          log.createdAt ||
                                                            log.time,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          )}

                                          {/* COMPLETE */}

                                          {!completed && (
                                            <button
                                              onClick={() =>
                                                markComplete(
                                                  i._id,
                                                )
                                              }
                                              className="
                                                w-full
                                                h-10
                                                rounded-xl
                                                bg-green-600
                                                hover:bg-green-700
                                                text-white
                                                text-xs
                                                font-semibold
                                                flex
                                                items-center
                                                justify-center
                                                gap-2
                                                transition
                                                active:scale-[0.99]
                                              "
                                            >
                                              <CheckCircle2
                                                size={
                                                  15
                                                }
                                              />
                                              Mark Intervention
                                              Complete
                                            </button>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            },
                          )
                        )}
                      </div>
                    </div>

                    {/* CREATE */}

                    <div
                      className="
                        bg-white
                        border
                        border-gray-100
                        rounded-2xl
                        shadow-sm
                        p-5
                      "
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="
                            w-9
                            h-9
                            rounded-xl
                            bg-green-50
                            text-green-600
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <Plus
                            size={
                              17
                            }
                          />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            Create Intervention
                          </h4>

                          <p className="text-xs text-gray-400 mt-0.5">
                            Add a new action or
                            rehabilitation plan.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            className="
                              block
                              text-[10px]
                              uppercase
                              tracking-wider
                              font-bold
                              text-gray-400
                              mb-2
                            "
                          >
                            Intervention Type
                          </label>

                          <select
                            value={
                              form.type
                            }
                            onChange={(
                              e,
                            ) =>
                              setForm({
                                ...form,
                                type:
                                  e
                                    .target
                                    .value,
                              })
                            }
                            className="
                              w-full
                              h-11
                              bg-gray-50
                              border
                              border-gray-200
                              rounded-xl
                              px-4
                              text-sm
                              text-gray-700
                              outline-none
                              focus:border-green-300
                              focus:ring-4
                              focus:ring-green-50
                              transition
                            "
                          >
                            {options.map(
                              (
                                opt,
                              ) => (
                                <option
                                  key={
                                    opt
                                  }
                                  value={
                                    opt
                                  }
                                >
                                  {opt}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        <div>
                          <label
                            className="
                              block
                              text-[10px]
                              uppercase
                              tracking-wider
                              font-bold
                              text-gray-400
                              mb-2
                            "
                          >
                            Intervention Plan
                          </label>

                          <textarea
                            rows={4}
                            value={
                              form.description
                            }
                            placeholder="Describe the intervention plan, expected outcome, or follow-up actions..."
                            onChange={(
                              e,
                            ) =>
                              setForm({
                                ...form,
                                description:
                                  e
                                    .target
                                    .value,
                              })
                            }
                            className="
                              w-full
                              bg-gray-50
                              border
                              border-gray-200
                              rounded-xl
                              px-4
                              py-3
                              text-sm
                              text-gray-700
                              placeholder:text-gray-400
                              outline-none
                              resize-none
                              focus:border-green-300
                              focus:ring-4
                              focus:ring-green-50
                              transition
                            "
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODAL FOOTER */}

                <div
                  className="
                    px-7
                    py-4
                    bg-white
                    border-t
                    border-gray-100
                    flex
                    items-center
                    justify-between
                    shrink-0
                  "
                >
                  <button
                    onClick={() =>
                      exportInterventionPDF(
                        selected,
                        interventions,
                      )
                    }
                    className="
                      h-10
                      px-4
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      text-gray-600
                      text-xs
                      font-semibold
                      flex
                      items-center
                      gap-2
                      hover:bg-gray-50
                      transition
                    "
                  >
                    <Download
                      size={14}
                    />
                    Export Report
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setOpen(false)
                      }
                      className="
                        h-10
                        px-4
                        rounded-xl
                        bg-gray-50
                        border
                        border-gray-200
                        text-gray-600
                        text-xs
                        font-semibold
                        hover:bg-gray-100
                        transition
                      "
                    >
                      Cancel
                    </button>

                    <button
                      onClick={
                        submit
                      }
                      disabled={
                        !form.description.trim()
                      }
                      className="
                        h-10
                        px-5
                        rounded-xl
                        bg-green-600
                        hover:bg-green-700
                        disabled:bg-gray-300
                        disabled:cursor-not-allowed
                        text-white
                        text-xs
                        font-semibold
                        flex
                        items-center
                        gap-2
                        transition
                      "
                    >
                      <CheckCircle2
                        size={
                          14
                        }
                      />
                      Save Intervention
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>

      {showPrintableReport && (
        <InterventionPrintableReport
          cases={cases}
          interventions={
            interventions
          }
          onClose={() =>
            setShowPrintableReport(
              false,
            )
          }
        />
      )}
    </div>
  );
};

/* =========================================================
   NAV
========================================================= */

const Nav = ({
  icon,
  label,
  onClick,
  active,
  darkMode = false,
}) => (
  <button
    onClick={onClick}
    className={`
      group
      flex
      items-center
      gap-3
      px-3.5
      py-2.5
      rounded-xl
      w-full
      text-sm
      transition
      ${
        active
          ? (darkMode ? "bg-emerald-950/50 text-emerald-300 font-semibold" : "bg-green-50 text-green-700 font-semibold")
          : darkMode
            ? "text-slate-400 hover:bg-emerald-950/30 hover:text-slate-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <span
      className={`
        transition
        ${
          active
            ? "text-green-600"
            : darkMode
              ? "text-slate-500 group-hover:text-emerald-400"
              : "text-gray-400 group-hover:text-gray-700"
        }
      `}
    >
      {icon}
    </span>

    {label}

    {active && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
    )}
  </button>
);

/* =========================================================
   TAB
========================================================= */

const Tab = ({
  label,
  active,
  onClick,
}) => (
  <motion.button
    whileTap={{
      scale: 0.97,
    }}
    onClick={onClick}
    className={`
      h-10
      px-4
      rounded-xl
      text-xs
      font-semibold
      whitespace-nowrap
      transition-all
      ${
        active
          ? "bg-green-600 text-white shadow-sm"
          : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100 hover:text-gray-700"
      }
    `}
  >
    {label}
  </motion.button>
);

/* =========================================================
   STAT CARD
========================================================= */

const HeroMetric = ({ icon, value, label, darkMode = false, tone = "green" }) => {
  const toneClass = {
    green: darkMode ? "bg-emerald-950/50 text-emerald-400" : "bg-green-50 text-green-700",
    amber: darkMode ? "bg-amber-950/40 text-amber-400" : "bg-amber-50 text-amber-700",
    emerald: darkMode ? "bg-emerald-950/50 text-emerald-400" : "bg-emerald-50 text-emerald-700",
    blue: darkMode ? "bg-blue-950/40 text-blue-400" : "bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 ${darkMode ? "bg-[#101F17] border-emerald-950/45" : "bg-gray-50/70 border-gray-100"}`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${toneClass}`}>{icon}</div>
        <div className="min-w-0">
          <p className={`text-xl sm:text-2xl font-black leading-none ${darkMode ? "text-slate-100" : "text-gray-900"}`}>{value}</p>
          <p className={`text-[9px] uppercase tracking-wider font-bold mt-1 truncate ${darkMode ? "text-slate-500" : "text-gray-400"}`}>{label}</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  description,
  iconBg = "bg-green-50",
  iconColor = "text-green-600",
  darkMode = false,
}) => (
  <motion.div
    whileHover={{
      y: -2,
    }}
    className={`
      border
      rounded-2xl
      p-5
      shadow-sm
      transition-all
      hover:shadow-md
      ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}
    `}
  >
    <div className="flex items-start justify-between">
      <div
        className={`
          w-10
          h-10
          rounded-xl
          flex
          items-center
          justify-center
          ${iconBg}
          ${iconColor}
        `}
      >
        {icon}
      </div>

      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-300">
        Overview
      </span>
    </div>

    <p className="text-xs font-medium text-gray-400 mt-5">
      {label}
    </p>

    <div className="flex items-end justify-between gap-3 mt-1">
      <h2 className="text-2xl font-black text-gray-900">
        {value}
      </h2>
    </div>

    <p className="text-[10px] text-gray-400 mt-1">
      {description}
    </p>
  </motion.div>
);

export default InterventionPage;

