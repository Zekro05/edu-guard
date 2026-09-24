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
  LayoutGrid,
  List,
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
  const [viewMode, setViewMode] = useState("cards");
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

          studentPhoto:
            student.profilePhoto ||
            student.profilePicture ||
            student.avatar ||
            student.photo ||
            null,

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
        /* Modal typography: readable, polished, and consistent */
        .intervention-modal {
          font-family: "Inter", "Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
          font-size: 15px;
          letter-spacing: -0.005em;
        }
        .intervention-modal p,
        .intervention-modal span,
        .intervention-modal label,
        .intervention-modal button,
        .intervention-modal input,
        .intervention-modal textarea,
        .intervention-modal select {
          font-family: inherit;
        }
        .intervention-modal .text-\[9px\] { font-size: 12px !important; }
        .intervention-modal .text-\[10px\] { font-size: 13px !important; }
        .intervention-modal .text-\[11px\] { font-size: 13px !important; }
        .intervention-modal .text-xs { font-size: 14px !important; }
        .intervention-modal .text-sm { font-size: 15px !important; }
        .intervention-modal .text-base { font-size: 16px !important; }
        .intervention-modal .text-lg { font-size: 20px !important; }
        .intervention-modal input,
        .intervention-modal textarea,
        .intervention-modal select {
          font-size: 15px !important;
          line-height: 1.5;
        }
        .intervention-modal ::placeholder { font-size: 14px !important; }

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

          <div
            className="intervention-content-typography"
            style={{ fontFamily: '"Inter", "Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}
          >

          {/* OVERVIEW */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Intervention Overview
              </h3>

              <p className="text-[15px] text-gray-400 mt-1">
                Monitor the current state of student
                intervention cases.
              </p>
            </div>

            <button
              onClick={() =>
                setShowPrintableReport(
                  true,
                )
              }
              className="
                h-10
                px-4
                rounded-xl
                bg-white
                border
                border-gray-200
                text-gray-600
                text-xs
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                hover:bg-gray-50
                hover:border-gray-300
                transition
                shadow-sm
              "
            >
              <Printer size={15} />
              Printable Report
            </button>
          </div>

          {/* STATS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={
                <FileText size={18} />
              }
              label="Total Cases"
              value={stats.total}
              description="All intervention-ready cases"
              darkMode={darkMode}
            />

            <StatCard
              icon={
                <Timer size={18} />
              }
              label="Ongoing"
              value={stats.ongoing}
              description="Currently being handled"
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              darkMode={darkMode}
            />

            <StatCard
              icon={
                <CircleCheck
                  size={18}
                />
              }
              label="Completed"
              value={
                stats.completed
              }
              description="Successfully resolved"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              darkMode={darkMode}
            />

            <StatCard
              icon={
                <Clock3 size={18} />
              }
              label="Pending"
              value={stats.pending}
              description="Awaiting intervention"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              darkMode={darkMode}
            />
          </div>

          {/* SEARCH + FILTER */}

          <div
            className="
              bg-white
              border border-gray-100
              rounded-2xl
              shadow-sm
              p-5
              mb-6
            "
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div
                className="
                  flex
                  items-center
                  gap-3
                  h-11
                  px-4
                  rounded-xl
                  bg-gray-50
                  border
                  border-gray-200
                  w-full
                  lg:max-w-md
                  focus-within:border-green-300
                  focus-within:ring-4
                  focus-within:ring-green-50
                  transition
                "
              >
                <Search
                  size={17}
                  className="text-gray-400 shrink-0"
                />

                <input
                  className="
                    bg-transparent
                    outline-none
                    w-full
                    text-sm
                    text-gray-700
                    placeholder:text-gray-400
                  "
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value,
                    )
                  }
                  placeholder="Search student or offense..."
                />

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  {
                    id: "all",
                    label: "All",
                  },
                  {
                    id: "none",
                    label: "Pending",
                  },
                  {
                    id: "ongoing",
                    label: "Ongoing",
                  },
                  {
                    id: "completed",
                    label: "Completed",
                  },
                ].map(
                  (item) => (
                    <Tab
                      key={item.id}
                      label={
                        item.label
                      }
                      active={
                        tab ===
                        item.id
                      }
                      onClick={() =>
                        setTab(
                          item.id,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          {/* RESULTS HEADER */}

          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Intervention Cases
              </p>

              <p className="text-xs text-gray-400 mt-0.5">
                Showing{" "}
                {filtered.length}{" "}
                {filtered.length ===
                1
                  ? "case"
                  : "cases"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                    viewMode === "cards"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  aria-label="Cards view"
                  aria-pressed={viewMode === "cards"}
                >
                  <LayoutGrid size={14} />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                    viewMode === "compact"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  aria-label="Compact view"
                  aria-pressed={viewMode === "compact"}
                >
                  <List size={14} />
                  Compact
                </button>
              </div>

              {search && (
              <span className="text-xs text-gray-400 hidden md:block">
                Search results for{" "}
                <span className="font-semibold text-gray-600">
                  "{search}"
                </span>
              </span>
              )}
            </div>
          </div>

          {/* CASES */}

          <div
            className="
              bg-white
              border border-gray-100
              rounded-2xl
              shadow-sm
              p-5
            "
          >
            {filtered.length ===
            0 ? (
              <div className="min-h-[420px] flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div
                    className="
                      w-16
                      h-16
                      rounded-2xl
                      bg-green-50
                      text-green-600
                      flex
                      items-center
                      justify-center
                      mx-auto
                      mb-4
                    "
                  >
                    <ClipboardCheck
                      size={28}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    No intervention cases
                  </h3>

                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    There are no cases matching your
                    current search or intervention
                    filter.
                  </p>

                  {(search ||
                    tab !==
                      "all") && (
                    <button
                      onClick={() => {
                        setSearch(
                          "",
                        );
                        setTab(
                          "all",
                        );
                      }}
                      className="
                        mt-5
                        px-4
                        py-2
                        rounded-xl
                        text-sm
                        font-semibold
                        text-green-700
                        bg-green-50
                        hover:bg-green-100
                        transition
                      "
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <motion.div
                layout
                className={`grid gap-4 ${
                  viewMode === "cards"
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3"
                }`}
              >
                {filtered.map(
                  (c) => {
                    const status =
                      getIncidentInterventionStatus(
                        c.incidentId,
                      );

                    const statusConfig =
                      getStatusConfig(
                        status,
                      );

                    const StatusIcon =
                      statusConfig.icon;

                    const interventionCount =
                      getIncidentInterventions(
                        c.incidentId,
                      ).length;

                    const aiResult =
                      getAIRecommendation(
                        c.incidentId,
                      );

                    return (
                      <motion.div
                        layout
                        key={c._id}
                        whileHover={{
                          y: -3,
                          boxShadow:
                            "0 12px 30px rgba(15, 23, 42, 0.07)",
                        }}
                        transition={{
                          duration: 0.2,
                        }}
                        onClick={() =>
                          openCase(c)
                        }
                        className={`
                          group
                          bg-white
                          border
                          border-gray-100
                          rounded-2xl
                          cursor-pointer
                          transition-all
                          relative
                          overflow-hidden
                          ${viewMode === "cards" ? "p-5" : "p-3.5"}
                        `}
                      >
                        {/* TOP */}

                        <div className="flex items-start justify-between gap-4">
                          <div
                            className={`
                              ${viewMode === "cards" ? "w-14 h-14 rounded-2xl" : "w-12 h-12 rounded-xl"}
                              overflow-hidden
                              bg-green-50
                              text-green-700
                              flex
                              items-center
                              justify-center
                              font-bold
                              text-base
                              shrink-0
                              border
                              ${darkMode ? "border-emerald-900/50" : "border-green-100"}
                            `}
                          >
                            {c.studentPhoto ? (
                              <img
                                src={c.studentPhoto}
                                alt={`${c.studentName} profile`}
                                className="w-full h-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              getInitials(c.studentName)
                            )}
                          </div>

                          <div
                            className={`
                              flex
                              items-center
                              gap-1.5
                              px-2.5
                              py-1.5
                              rounded-lg
                              border
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-wide
                              ${statusConfig.badge}
                            `}
                          >
                            <StatusIcon
                              size={
                                11
                              }
                            />

                            {
                              statusConfig.label
                            }
                          </div>
                        </div>

                        {/* STUDENT */}

                        <div className="mt-4">
                          <h3
                            className="
                              text-xl
                              font-bold
                              text-gray-900
                              group-hover:text-green-700
                              transition-colors
                            "
                          >
                            {
                              c.studentName
                            }
                          </h3>

                          <p className="text-sm text-gray-400 mt-1">
                            {c.grade} •{" "}
                            {
                              c.studentCode
                            }{" "}
                            •{" "}
                            {
                              c.gender
                            }
                          </p>
                        </div>

                        {/* INCIDENT */}

                        <div className="mt-5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                              <AlertCircle
                                size={
                                  11
                                }
                                className="text-gray-500"
                              />
                            </div>

                            <p
                              className="
                                text-[12px]
                                uppercase
                                tracking-wider
                                font-bold
                                text-gray-400
                              "
                            >
                              Incident
                            </p>
                          </div>

                          <p
                            className="
                              text-[16px]
                              text-gray-700
                              leading-relaxed
                              line-clamp-2
                              min-h-[40px]
                            "
                          >
                            {
                              c.offense
                            }
                          </p>
                        </div>

                        {/* AI */}

                        <div
                          className={`mt-5 p-3.5 rounded-xl border ${darkMode ? "bg-emerald-950/35 border-emerald-900/60" : "bg-green-50/70 border-green-100"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? "bg-[#101F17] text-emerald-400" : "bg-white text-green-600"}`}
                              >
                                {aiLoading &&
                                selected?.incidentId ===
                                  c.incidentId ? (
                                  <Loader2
                                    size={
                                      14
                                    }
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Brain
                                    size={
                                      14
                                    }
                                  />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  className={`text-[11px] uppercase tracking-wider font-bold ${darkMode ? "text-emerald-400" : "text-green-600"}`}
                                >
                                  AI Recommendation
                                </p>

                                <p
                                  className={`text-[14px] font-semibold mt-0.5 line-clamp-2 ${darkMode ? "text-emerald-200" : "text-green-900"}`}
                                >
                                  {aiResult?.conclusion ||
                                    (aiLoading &&
                                    selected?.incidentId ===
                                      c.incidentId
                                      ? "Analyzing..."
                                      : "Open case to analyze")}
                                </p>
                              </div>
                            </div>

                            <ChevronRight
                              size={15}
                              className={`group-hover:translate-x-0.5 transition shrink-0 ${darkMode ? "text-emerald-400" : "text-green-400"}`}
                            />
                          </div>
                        </div>

                        {/* FOOTER */}

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            mt-5
                            pt-4
                            border-t
                            border-gray-100
                          "
                        >
                          <div className="flex items-center gap-1.5 text-[14px] text-gray-400">
                            <HandHelping
                              size={
                                13
                              }
                            />

                            {
                              interventionCount
                            }{" "}
                            {interventionCount ===
                            1
                              ? "intervention"
                              : "interventions"}
                          </div>

                          <span
                            className="
                              text-[13px]
                              font-semibold
                              text-green-600
                              opacity-0
                              group-hover:opacity-100
                              transition
                            "
                          >
                            View Case →
                          </span>
                        </div>
                      </motion.div>
                    );
                  },
                )}
              </motion.div>
            )}
          </div>
          </div>
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
                        relative
                        w-14
                        h-14
                        rounded-2xl
                        overflow-hidden
                        bg-green-50
                        text-green-700
                        flex
                        items-center
                        justify-center
                        font-bold
                        text-base
                        shrink-0
                        border
                        border-green-100
                        shadow-sm
                      "
                    >
                      <span className="absolute inset-0 flex items-center justify-center">
                        {getInitials(selected.studentName)}
                      </span>

                      {selected.studentPhoto && (
                        <img
                          src={selected.studentPhoto}
                          alt={`${selected.studentName} profile`}
                          className="relative z-10 w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
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

