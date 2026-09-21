import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { API } from "../lib/api";

import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import MobileReport from "../components/tabs/MobileReport";
import IncidentReport from "../components/tabs/IncidentReport";
import ComplaintReport from "../components/tabs/ComplaintReport";
import Overview from "../components/tabs/Overview";
import AIPredictions from "../components/tabs/AIPredictions";
import PrintableReport from "../components/reports/PrintableReport";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  FileWarning,
  Activity,
  BriefcaseBusiness,
  HandHelping,
  LogOut,
  ChevronRight,
  ChevronDown,
  X,
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  Menu,
  Printer,
  BrainCircuit,
  Sparkles,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Filter,
  Eye,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";

/* =========================================================
   SOCKET
========================================================= */

const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket"],
  autoConnect: false,
});

/* =========================================================
   REPORT PAGE
========================================================= */

const ReportPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState("mobile");
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPrintableReport, setShowPrintableReport] = useState(false);

  /* =========================================================
     AI REVIEW
  ========================================================= */

  const [aiFilter, setAiFilter] = useState("all");

  const [batchAnalyzing, setBatchAnalyzing] = useState(false);

  const [batchProgress, setBatchProgress] = useState(null);

  const [showAIResults, setShowAIResults] = useState(false);

  const [aiBatchResults, setAiBatchResults] = useState([]);

  const [selectedAIResult, setSelectedAIResult] = useState(null);

  const [aiBatchError, setAiBatchError] = useState("");

  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* =========================================================
   THEME
   Keep Reports synchronized with the Dashboard theme.
   Dashboard stores the theme in:
   localStorage["guided-theme"] = "dark" | "light"
========================================================= */

  const getStoredTheme = () => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(getStoredTheme);

  useEffect(() => {
    const readTheme = () => {
      setIsDarkMode(getStoredTheme());
    };

    // Read the current Dashboard theme immediately
    readTheme();

    // Listen for the custom theme event if Dashboard dispatches it
    const handleThemeChange = (event) => {
      if (event?.detail === "dark") {
        setIsDarkMode(true);
      } else if (event?.detail === "light") {
        setIsDarkMode(false);
      } else {
        readTheme();
      }
    };

    // Also support theme changes from another browser tab/window
    const handleStorageChange = (event) => {
      if (event.key === "guided-theme") {
        setIsDarkMode(event.newValue === "dark");
      }
    };

    window.addEventListener("guided-theme-change", handleThemeChange);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("guided-theme-change", handleThemeChange);

      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);
  const [toastNotif, setToastNotif] = useState(null);

  const debounceRef = useRef(null);

  /* =========================================================
     ADMIN
  ========================================================= */

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Administrator";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  /* =========================================================
     NAVIGATION HELPER
  ========================================================= */

  const handleNavigate = useCallback(
    (path) => {
      setMobileSidebarOpen(false);
      navigate(path);
    },
    [navigate],
  );

  /* =========================================================
     CLOSE MOBILE SIDEBAR WHEN SCREEN BECOMES DESKTOP
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     PREVENT BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
  ========================================================= */

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  /* =========================================================
     PREVENT BODY SCROLL WHEN AI MODAL IS OPEN
  ========================================================= */

  useEffect(() => {
    if (showAIResults || selectedAIResult) {
      document.body.style.overflow = "hidden";
    } else if (!mobileSidebarOpen) {
      document.body.style.overflow = "";
    }

    return () => {
      if (!mobileSidebarOpen) {
        document.body.style.overflow = "";
      }
    };
  }, [showAIResults, selectedAIResult, mobileSidebarOpen]);

  /* =========================================================
     FETCH REPORTS
  ========================================================= */

  const fetchReports = useCallback(
    async (customSearch = search) => {
      setLoading(true);

      try {
        /*
        MOBILE PENDING LIST
        -------------------
        Only pending reports are shown inside the
        Mobile Pending tab.
        */

        const pendingRes = await API.get(
          `/api/reports?status=pending&search=${encodeURIComponent(
            customSearch,
          )}`,
        );

        setReports(pendingRes.data?.reports || []);

        /*
        ALL REPORTS
        -----------
        Used only for the statistics at the top.

        We intentionally do NOT use status=pending here,
        because we need pending + accepted + rejected.
        */

        const allRes = await API.get(
          `/api/reports?limit=10000&search=${encodeURIComponent(customSearch)}`,
        );

        setAllReports(allRes.data?.reports || []);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchReports("");
  }, []);

  /* =========================================================
     SEARCH DEBOUNCE
  ========================================================= */

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchReports(search);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  /* =========================================================
     SOCKET
  ========================================================= */

  useEffect(() => {
    if (!user?._id) return;

    socket.connect();

    const handleConnect = () => {
      socket.emit("join", user._id);
    };

    const handleNewNotification = (data) => {
      if (!data?.report) return;

      setReports((prev) => {
        const exists = prev.some((report) => report._id === data.report._id);

        if (exists) return prev;

        return [data.report, ...prev];
      });

      const notif = {
        id: data.report?._id || Date.now(),
        title: "New Student Report",
        text: data.report?.offense || "A new incident report was submitted.",
        student: data.report?.studentName || "Unknown Student",
        time: new Date().toISOString(),
      };

      setNotifications((prev) => [notif, ...prev.slice(0, 14)]);

      setToastNotif(notif);

      setTimeout(() => {
        setToastNotif((current) => (current?.id === notif.id ? null : current));
      }, 4000);
    };

    const handleReportUpdate = (data) => {
      if (!data?._id) return;

      setReports((prev) =>
        prev.map((report) =>
          report._id === data._id
            ? {
                ...report,
                ...data,
                aiReview:
                  data.aiReview !== undefined ? data.aiReview : report.aiReview,
              }
            : report,
        ),
      );

      setAllReports((prev) =>
        prev.map((report) =>
          report._id === data._id
            ? {
                ...report,
                ...data,
                aiReview:
                  data.aiReview !== undefined ? data.aiReview : report.aiReview,
              }
            : report,
        ),
      );
    };

    socket.on("connect", handleConnect);
    socket.on("newNotification", handleNewNotification);
    socket.on("update-report", handleReportUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newNotification", handleNewNotification);
      socket.off("update-report", handleReportUpdate);
      socket.disconnect();
    };
  }, [user?._id]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleAccept = async (id) => {
    try {
      await API.put(`/api/reports/${id}/accept`);
      await fetchReports(search);
    } catch (error) {
      console.error("Failed to accept report:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/api/reports/${id}/reject`);
      await fetchReports(search);
    } catch (error) {
      console.error("Failed to reject report:", error);
    }
  };

  /* =========================================================
     INDIVIDUAL AI ANALYSIS CALLBACK
  ========================================================= */

  const handleAIAnalyzed = useCallback((reportId, aiReview) => {
    if (!reportId || !aiReview) return;

    setReports((prev) =>
      prev.map((report) =>
        String(report._id) === String(reportId)
          ? {
              ...report,
              aiReview,
            }
          : report,
      ),
    );

    setAllReports((prev) =>
      prev.map((report) =>
        String(report._id) === String(reportId)
          ? {
              ...report,
              aiReview,
            }
          : report,
      ),
    );
  }, []);

  /* =========================================================
     AI STATISTICS
  ========================================================= */

  const aiStats = useMemo(() => {
    const pending = reports || [];

    return {
      total: pending.length,

      analyzed: pending.filter((report) => report?.aiReview?.analyzed === true)
        .length,

      needsAI: pending.filter((report) => report?.aiReview?.analyzed !== true)
        .length,

      highRisk: pending.filter(
        (report) => report?.aiReview?.riskLevel === "High",
      ).length,

      mediumRisk: pending.filter(
        (report) => report?.aiReview?.riskLevel === "Medium",
      ).length,

      lowRisk: pending.filter((report) => report?.aiReview?.riskLevel === "Low")
        .length,

      highSeverity: pending.filter(
        (report) => report?.aiReview?.severity === "High",
      ).length,

      mediumSeverity: pending.filter(
        (report) => report?.aiReview?.severity === "Medium",
      ).length,

      lowSeverity: pending.filter(
        (report) => report?.aiReview?.severity === "Low",
      ).length,
    };
  }, [reports]);

  /* =========================================================
     AI FILTER
  ========================================================= */

  const filteredReports = useMemo(() => {
    const query = search.toLowerCase().trim();

    return (reports || []).filter((report) => {
      const name = report?.studentName?.toLowerCase() || "";
      const offense = report?.offense?.toLowerCase() || "";

      const matchesSearch =
        !query || name.includes(query) || offense.includes(query);

      if (!matchesSearch) return false;

      const ai = report?.aiReview;

      switch (aiFilter) {
        case "needs_ai":
          return ai?.analyzed !== true;

        case "ai_reviewed":
          return ai?.analyzed === true;

        case "high_risk":
          return ai?.riskLevel === "High";

        case "medium_risk":
          return ai?.riskLevel === "Medium";

        case "low_risk":
          return ai?.riskLevel === "Low";

        case "high_severity":
          return ai?.severity === "High";

        case "medium_severity":
          return ai?.severity === "Medium";

        case "low_severity":
          return ai?.severity === "Low";

        case "all":
        default:
          return true;
      }
    });
  }, [reports, search, aiFilter]);

  /* =========================================================
     ANALYZE ALL PENDING REPORTS
  ========================================================= */

  const handleAnalyzeAllPending = async () => {
    if (batchAnalyzing) return;

    setBatchAnalyzing(true);
    setAiBatchError("");
    setBatchProgress(null);
    setSelectedAIResult(null);

    try {
      const response = await API.post(
        "/api/gemini/analyze-pending-reports",
        {
          reanalyze: false,
        },
        {
          timeout: 15 * 60 * 1000,
        },
      );

      const data = response?.data || {};

      const rawResults = Array.isArray(data?.results) ? data.results : [];

      /*
       * Attach the actual report information to every
       * AI result so the completion modal can show:
       *
       * Student
       * Offense
       * Date
       * Location
       * AI severity
       * AI risk
       * Reasoning
       * Evidence
       * Summary
       */

      const currentReports = reports || [];

      const detailedResults = rawResults.map((result) => {
        const matchingReport = currentReports.find(
          (report) => String(report?._id) === String(result?.reportId),
        );

        return {
          ...result,
          report: matchingReport || null,
          aiReview: result?.aiReview || null,
        };
      });

      /*
       * Merge AI results into the current pending reports.
       */

      const resultMap = new Map();

      detailedResults.forEach((result) => {
        if (result?.reportId && result?.aiReview) {
          resultMap.set(String(result.reportId), result.aiReview);
        }
      });

      setReports((prev) =>
        prev.map((report) => {
          const aiReview = resultMap.get(String(report._id));

          if (!aiReview) return report;

          return {
            ...report,
            aiReview,
          };
        }),
      );

      setAllReports((prev) =>
        prev.map((report) => {
          const aiReview = resultMap.get(String(report._id));

          if (!aiReview) return report;

          return {
            ...report,
            aiReview,
          };
        }),
      );

      /*
       * Save the complete results for the popup.
       */

      setAiBatchResults(detailedResults);

      setBatchProgress({
        total: Number(data?.total || 0),
        analyzed: Number(data?.analyzed || 0),
        skipped: Number(data?.skipped || 0),
        failed: Number(data?.failed || 0),

        highRisk: Number(data?.highRisk || 0),
        mediumRisk: Number(data?.mediumRisk || 0),
        lowRisk: Number(data?.lowRisk || 0),

        highSeverity: Number(data?.highSeverity || 0),
        mediumSeverity: Number(data?.mediumSeverity || 0),
        lowSeverity: Number(data?.lowSeverity || 0),
      });

      /*
       * Show the detailed completion popup.
       */

      setShowAIResults(true);
    } catch (error) {
      console.error("Failed to analyze all pending reports:", error);

      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to analyze pending reports.";

      setAiBatchError(message);
    } finally {
      setBatchAnalyzing(false);
    }
  };

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const total = allReports.length;

    const pending = allReports.filter(
      (report) => !report.status || report.status === "pending",
    ).length;

    const accepted = allReports.filter(
      (report) =>
        report.status === "accepted" || report.status === "under_review",
    ).length;

    const rejected = allReports.filter(
      (report) => report.status === "rejected",
    ).length;

    return {
      total,
      pending,
      accepted,
      rejected,
    };
  }, [allReports]);

  const ThemeToggle = ({ darkMode, setDarkMode }) => {
  const handleToggle = () => {
    setDarkMode((current) => {
      const next = !current;
      const theme = next ? "dark" : "light";

      try {
        localStorage.setItem("guided-theme", theme);
      } catch {}

      document.documentElement.style.colorScheme = theme;

      window.dispatchEvent(
        new CustomEvent("guided-theme-change", {
          detail: theme,
        })
      );

      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        w-full
        flex
        items-center
        justify-between
        gap-3
        px-3.5
        py-2.5
        rounded-xl
        border
        text-sm
        font-semibold
        transition
        ${
          darkMode
            ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]"
            : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span
          className={`
            w-7 h-7 rounded-lg
            flex items-center justify-center
            ${
              darkMode
                ? "bg-amber-950/40 text-amber-300"
                : "bg-white text-slate-500"
            }
          `}
        >
          {darkMode ? (
            <Sun size={15} />
          ) : (
            <Moon size={15} />
          )}
        </span>

        {darkMode ? "Light mode" : "Dark mode"}
      </div>

      <span
        className={`
          relative
          w-9
          h-5
          rounded-full
          overflow-hidden
          flex-shrink-0
          transition
          ${
            darkMode
              ? "bg-green-600"
              : "bg-gray-300"
          }
        `}
      >
        <span
          className={`
            absolute
            top-0.5
            w-4
            h-4
            rounded-full
            bg-white
            shadow-sm
            transition
            ${
              darkMode
                ? "left-[18px]"
                : "left-0.5"
            }
          `}
        />
      </span>
    </button>
  );
};

   /* =========================================================
     SIDEBAR CONTENT
     EXACTLY MATCHES STUDENTPAGE SIDEBAR
  ========================================================= */

  const SidebarContent = () => (
    <>
      {/* ============================================================
          DESKTOP SIDEBAR
      ============================================================ */}

      <aside
        className={`
          hidden lg:flex
          fixed left-0 top-0 bottom-0
          z-40
          w-[250px] xl:w-[270px]
          flex-col justify-between
          px-4 xl:px-5 py-6
          overflow-y-auto
          border-r
          transition-colors duration-300
          ${
            isDarkMode
              ? "bg-[#09150F] border-emerald-950/60"
              : "bg-white border-gray-100"
          }
        `}
      >
        <div>
          {/* BRAND */}

          <div className="px-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 xl:w-11 h-10 xl:h-11 flex items-center justify-center flex-shrink-0">
                <img
                  src="/school-logo.webp"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1
                  className={`text-xl font-extrabold tracking-tight ${
                    isDarkMode
                      ? "text-slate-100"
                      : "text-slate-900"
                  }`}
                >
                  Guid
                  <span className="text-green-500">Ed</span>
                </h1>

                <p
                  className={`text-[9px] uppercase tracking-widest font-semibold truncate ${
                    isDarkMode
                      ? "text-slate-500"
                      : "text-gray-400"
                  }`}
                >
                  Student Guidance
                </p>
              </div>
            </div>

            <p
              className={`text-[11px] leading-relaxed mt-4 ${
                isDarkMode
                  ? "text-slate-500"
                  : "text-gray-400"
              }`}
            >
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>
          </div>

          {/* NAVIGATION */}

          <p
            className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${
              isDarkMode
                ? "text-slate-500"
                : "text-gray-400"
            }`}
          >
            Main Menu
          </p>

          <div className="space-y-1">
            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() => handleNavigate("/dashboard")}
              darkMode={isDarkMode}
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              onClick={() => handleNavigate("/students")}
              darkMode={isDarkMode}
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              onClick={() => handleNavigate("/guidance")}
              darkMode={isDarkMode}
            />

            <Nav
              icon={<ChartNoAxesCombined size={18} />}
              label="Reports"
              active
              darkMode={isDarkMode}
            />

            <Nav
              icon={<BriefcaseBusiness size={18} />}
              label="Cases"
              onClick={() => handleNavigate("/cases")}
              darkMode={isDarkMode}
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              onClick={() => handleNavigate("/interventions")}
              darkMode={isDarkMode}
            />
          </div>

          <p
            className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${
              isDarkMode
                ? "text-slate-500"
                : "text-gray-400"
            }`}
          >
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => handleNavigate("/settings")}
            darkMode={isDarkMode}
          />
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="space-y-3 mt-8">
          {/* ADMIN PROFILE */}

          <div
            className={`p-3 rounded-2xl border ${
              isDarkMode
                ? "bg-[#101F17] border-emerald-950/50"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  relative
                  w-10
                  h-10
                  rounded-xl
                  overflow-hidden
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                  ${
                    isDarkMode
                      ? "bg-emerald-950 text-emerald-300"
                      : "bg-green-100 text-green-700"
                  }
                `}
              >
                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt={adminName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="font-bold">
                    {adminName.charAt(0).toUpperCase()}
                  </span>
                )}

                {/* ONLINE INDICATOR */}

                <span
                  className={`
                    absolute
                    bottom-0.5
                    right-0.5
                    w-2.5
                    h-2.5
                    rounded-full
                    bg-green-500
                    border-2
                    ${
                      isDarkMode
                        ? "border-[#101F17]"
                        : "border-white"
                    }
                  `}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-[9px] uppercase tracking-wider font-bold ${
                    isDarkMode
                      ? "text-slate-500"
                      : "text-gray-400"
                  }`}
                >
                  Administrator
                </p>

                <p
                  className={`text-sm font-bold truncate ${
                    isDarkMode
                      ? "text-slate-100"
                      : "text-slate-900"
                  }`}
                >
                  {adminName}
                </p>
              </div>
            </div>
          </div>

          {/* THEME */}

          <ThemeToggle
            darkMode={isDarkMode}
            setDarkMode={setIsDarkMode}
          />

          {/* SIGN OUT */}

          <button
            onClick={async () => {
              setMobileSidebarOpen(false);
              await logout();
            }}
            className={`
              w-full
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              border
              transition
              ${
                isDarkMode
                  ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300 hover:border-red-900/40"
                  : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
              }
            `}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ============================================================
          MOBILE OVERLAY
      ============================================================ */}

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* BACKDROP */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />

            {/* MOBILE SIDEBAR */}

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={`
                fixed
                left-0
                top-0
                bottom-0
                z-50
                w-[min(82vw,300px)]
                flex
                flex-col
                justify-between
                px-5
                py-6
                overflow-y-auto
                border-r
                lg:hidden
                ${
                  isDarkMode
                    ? "bg-[#09150F] border-emerald-950/60"
                    : "bg-white border-gray-100"
                }
              `}
            >
              <div>
                {/* MOBILE BRAND */}

                <div className="px-3 mb-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                        <img
                          src="/school-logo.webp"
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <h1
                          className={`text-xl font-extrabold tracking-tight ${
                            isDarkMode
                              ? "text-slate-100"
                              : "text-slate-900"
                          }`}
                        >
                          Guid
                          <span className="text-green-500">
                            Ed
                          </span>
                        </h1>

                        <p
                          className={`text-[9px] uppercase tracking-widest font-semibold ${
                            isDarkMode
                              ? "text-slate-500"
                              : "text-gray-400"
                          }`}
                        >
                          Student Guidance
                        </p>
                      </div>
                    </div>

                    {/* CLOSE BUTTON */}

                    <button
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`
                        w-9
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                        ${
                          isDarkMode
                            ? "bg-[#101F17] text-slate-400"
                            : "bg-gray-50 text-gray-500"
                        }
                      `}
                      aria-label="Close menu"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed mt-4 ${
                      isDarkMode
                        ? "text-slate-500"
                        : "text-gray-400"
                    }`}
                  >
                    Our Lady of the Holy Rosary School
                    <br />
                    General Trias Campus
                  </p>
                </div>

                {/* MAIN MENU */}

                <p
                  className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${
                    isDarkMode
                      ? "text-slate-500"
                      : "text-gray-400"
                  }`}
                >
                  Main Menu
                </p>

                <div className="space-y-1">
                  <Nav
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    onClick={() =>
                      handleNavigate("/dashboard")
                    }
                    darkMode={isDarkMode}
                  />

                  <Nav
                    icon={<Users size={18} />}
                    label="Students"
                    onClick={() =>
                      handleNavigate("/students")
                    }
                    darkMode={isDarkMode}
                  />

                  <Nav
                    icon={<ShieldX size={18} />}
                    label="Guidance"
                    onClick={() =>
                      handleNavigate("/guidance")
                    }
                    darkMode={isDarkMode}
                  />

                  <Nav
                    icon={
                      <ChartNoAxesCombined size={18} />
                    }
                    label="Reports"
                    active
                    darkMode={isDarkMode}
                  />

                  <Nav
                    icon={
                      <BriefcaseBusiness size={18} />
                    }
                    label="Cases"
                    onClick={() =>
                      handleNavigate("/cases")
                    }
                    darkMode={isDarkMode}
                  />

                  <Nav
                    icon={<HandHelping size={18} />}
                    label="Interventions"
                    onClick={() =>
                      handleNavigate("/interventions")
                    }
                    darkMode={isDarkMode}
                  />
                </div>

                {/* SYSTEM */}

                <p
                  className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${
                    isDarkMode
                      ? "text-slate-500"
                      : "text-gray-400"
                  }`}
                >
                  System
                </p>

                <Nav
                  icon={<Settings size={18} />}
                  label="Settings"
                  onClick={() =>
                    handleNavigate("/settings")
                  }
                  darkMode={isDarkMode}
                />
              </div>

              {/* MOBILE FOOTER */}

              <div className="space-y-3 mt-8">
                {/* ADMIN PROFILE */}

                <div
                  className={`p-3 rounded-2xl border ${
                    isDarkMode
                      ? "bg-[#101F17] border-emerald-950/50"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        relative
                        w-10
                        h-10
                        rounded-xl
                        overflow-hidden
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                        ${
                          isDarkMode
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-green-100 text-green-700"
                        }
                      `}
                    >
                      {adminPhoto ? (
                        <img
                          src={adminPhoto}
                          alt={adminName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="font-bold">
                          {adminName
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}

                      {/* ONLINE INDICATOR */}

                      <span
                        className={`
                          absolute
                          bottom-0.5
                          right-0.5
                          w-2.5
                          h-2.5
                          rounded-full
                          bg-green-500
                          border-2
                          ${
                            isDarkMode
                              ? "border-[#101F17]"
                              : "border-white"
                          }
                        `}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[9px] uppercase tracking-wider font-bold ${
                          isDarkMode
                            ? "text-slate-500"
                            : "text-gray-400"
                        }`}
                      >
                        Administrator
                      </p>

                      <p
                        className={`text-sm font-bold truncate ${
                          isDarkMode
                            ? "text-slate-100"
                            : "text-slate-900"
                        }`}
                      >
                        {adminName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* THEME */}

                <ThemeToggle
                  darkMode={isDarkMode}
                  setDarkMode={setIsDarkMode}
                />

                {/* SIGN OUT */}

                <button
                  onClick={async () => {
                    setMobileSidebarOpen(false);
                    await logout();
                  }}
                  className={`
                    w-full
                    flex
                    items-center
                    justify-center
                    gap-2
                    py-2.5
                    rounded-xl
                    text-sm
                    font-semibold
                    border
                    transition
                    ${
                      isDarkMode
                        ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300"
                        : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                    }
                  `}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <style>{`
        .report-page-dark {
          color-scheme: dark;
        }

        /* Printable Report dark-mode preview */
        .report-page-dark .printable-report-dark,
        .report-page-dark [data-printable-report="true"] {
          background: #0f1714 !important;
          color: #e5e7eb !important;
          border-color: #263a30 !important;
        }

        .report-page-dark .printable-report-dark .bg-white,
        .report-page-dark [data-printable-report="true"] .bg-white {
          background-color: #111918 !important;
        }

        /* =====================================================
           PRINTABLE REPORT — FORCE DARK MODE ON EVERY PREVIEW
           The printable component contains its own Tailwind
           light-mode utility classes (bg-white, bg-gray-50/70,
           bg-green-50, etc.). These selectors intentionally target
           the printable-report host so the preview follows the
           ReportPage theme without changing print/PDF output.
        ===================================================== */
        .report-page-dark .printable-report-host .printable-report,
        .report-page-dark .printable-report-host [data-printable-report="true"],
        .report-page-dark .printable-report-host {
          background-color: #0f1714 !important;
          color: #e5e7eb !important;
          border-color: #263a30 !important;
        }

        .report-page-dark .printable-report-host .bg-white,
        .report-page-dark .printable-report-host .bg-gray-50,
        .report-page-dark .printable-report-host .bg-gray-50\/70,
        .report-page-dark .printable-report-host .bg-gray-100 {
          background-color: #111918 !important;
        }

        .report-page-dark .printable-report-host .bg-gray-50,
        .report-page-dark .printable-report-host .bg-gray-50\/70 {
          background-color: #17211f !important;
        }

        /* Report Period buttons, status/date controls and Print button */
        .report-page-dark .printable-report-host button.bg-white,
        .report-page-dark .printable-report-host select.bg-white,
        .report-page-dark .printable-report-host .bg-white {
          background-color: #111918 !important;
          color: #d1d5db !important;
          border-color: #34413d !important;
        }

        /* The large Report Information card containing the four fields */
        .report-page-dark .printable-report-host .printable-document > .bg-gray-50\/70,
        .report-page-dark .printable-report-host .printable-document .bg-gray-50\/70 {
          background-color: #17211f !important;
          border-color: #34413d !important;
        }

        /* Small Report Period / Date Range / Generated By / Generated On cards */
        .report-page-dark .printable-report-host .printable-document .print-summary-card,
        .report-page-dark .printable-report-host .printable-document [class*="rounded-2xl"] {
          border-color: #34413d !important;
        }

        .report-page-dark .printable-report-host .text-gray-900 { color: #f3f4f6 !important; }
        .report-page-dark .printable-report-host .text-gray-800 { color: #e5e7eb !important; }
        .report-page-dark .printable-report-host .text-gray-700 { color: #d1d5db !important; }
        .report-page-dark .printable-report-host .text-gray-600 { color: #b8c2bf !important; }
        .report-page-dark .printable-report-host .text-gray-500 { color: #9ca8a4 !important; }
        .report-page-dark .printable-report-host .text-gray-400 { color: #7f8c88 !important; }

        .report-page-dark .printable-report-host .border-gray-100 { border-color: #27332f !important; }
        .report-page-dark .printable-report-host .border-gray-200 { border-color: #34413d !important; }

        .report-page-dark .printable-report-host .bg-green-50 { background-color: #0d291b !important; }
        .report-page-dark .printable-report-host .bg-green-100 { background-color: #123820 !important; }
        .report-page-dark .printable-report-host .border-green-100 { border-color: #1d5a34 !important; }
        .report-page-dark .printable-report-host .border-green-200 { border-color: #287344 !important; }
        .report-page-dark .printable-report-host .text-green-700 { color: #86efac !important; }
        .report-page-dark .printable-report-host .text-green-600 { color: #4ade80 !important; }

        .report-page-dark .printable-report-host input,
        .report-page-dark .printable-report-host textarea,
        .report-page-dark .printable-report-host select {
          background-color: #111918 !important;
          color: #f3f4f6 !important;
          border-color: #34413d !important;
          color-scheme: dark !important;
        }

        .report-page-dark .printable-report-host select option {
          background-color: #111918 !important;
          color: #f3f4f6 !important;
        }

        .report-page-dark .printable-report-host .hover\:bg-gray-50:hover { background-color: #202b29 !important; }
        .report-page-dark .printable-report-host .hover\:bg-gray-100:hover { background-color: #27332f !important; }
        .report-page-dark .printable-report-host .hover\:bg-green-50:hover { background-color: #123820 !important; }


        .report-page-dark .printable-report-dark .text-gray-900,
        .report-page-dark [data-printable-report="true"] .text-gray-900 {
          color: #f3f4f6 !important;
        }

        .report-page-dark .printable-report-dark .text-gray-800,
        .report-page-dark [data-printable-report="true"] .text-gray-800 {
          color: #e5e7eb !important;
        }

        .report-page-dark .printable-report-dark .text-gray-700,
        .report-page-dark [data-printable-report="true"] .text-gray-700 {
          color: #d1d5db !important;
        }

        .report-page-dark .printable-report-dark .text-gray-600,
        .report-page-dark [data-printable-report="true"] .text-gray-600 {
          color: #b8c2bf !important;
        }

        .report-page-dark .printable-report-dark .border-gray-100,
        .report-page-dark [data-printable-report="true"] .border-gray-100 {
          border-color: #27332f !important;
        }

        .report-page-dark .printable-report-dark .border-gray-200,
        .report-page-dark [data-printable-report="true"] .border-gray-200 {
          border-color: #34413d !important;
        }

        /* Keep actual printed paper clean and readable even in dark mode. */
        @media print {
          .report-page-dark .printable-report-dark,
          .report-page-dark [data-printable-report="true"] {
            background: #ffffff !important;
            color: #111827 !important;
          }

          .report-page-dark .printable-report-dark *,
          .report-page-dark [data-printable-report="true"] * {
            color: #111827 !important;
            background-color: transparent !important;
            border-color: #d1d5db !important;
            box-shadow: none !important;
          }
        }

        .report-page-dark.bg\[\#F7F9F8\],
        .report-page-dark {
          background: #0b1110 !important;
          color: #e5e7eb !important;
        }

        .report-page-dark .bg-white {
          background-color: #111918 !important;
        }

        .report-page-dark .bg-gray-50 {
          background-color: #17211f !important;
        }

        .report-page-dark .bg-gray-100 {
          background-color: #202b29 !important;
        }

        .report-page-dark .bg-gray-900 {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }

        .report-page-dark .text-gray-900 {
          color: #f3f4f6 !important;
        }

        .report-page-dark .text-gray-800 {
          color: #e5e7eb !important;
        }

        .report-page-dark .text-gray-700 {
          color: #d1d5db !important;
        }

        .report-page-dark .text-gray-600 {
          color: #b8c2bf !important;
        }

        .report-page-dark .text-gray-500 {
          color: #9ca8a4 !important;
        }

        .report-page-dark .text-gray-400 {
          color: #7f8c88 !important;
        }

        .report-page-dark .text-gray-300 {
          color: #64716d !important;
        }

        .report-page-dark .border-gray-100 {
          border-color: #27332f !important;
        }

        .report-page-dark .border-gray-200 {
          border-color: #34413d !important;
        }

        .report-page-dark .border-gray-900 {
          border-color: #e5e7eb !important;
        }

        .report-page-dark input,
        .report-page-dark textarea,
        .report-page-dark select {
          background-color: #111918 !important;
          color: #f3f4f6 !important;
          border-color: #34413d !important;
        }

        .report-page-dark input::placeholder,
        .report-page-dark textarea::placeholder {
          color: #71807b !important;
        }

        .report-page-dark .hover\:bg-white:hover {
          background-color: #1a2422 !important;
        }

        .report-page-dark .hover\:bg-gray-50:hover {
          background-color: #202b29 !important;
        }

        .report-page-dark .hover\:bg-gray-100:hover {
          background-color: #27332f !important;
        }

        .report-page-dark .hover\:bg-gray-800:hover {
          background-color: #e5e7eb !important;
          color: #111827 !important;
        }

        .report-page-dark .hover\:text-gray-900:hover {
          color: #ffffff !important;
        }

        .report-page-dark .hover\:text-gray-800:hover,
        .report-page-dark .hover\:text-gray-700:hover {
          color: #f3f4f6 !important;
        }

        .report-page-dark .bg-\[\#F7F9F8\]\/90 {
          background-color: rgba(11, 17, 16, 0.92) !important;
        }

        .report-page-dark .border-\[\#F7F9F8\] {
          border-color: #27332f !important;
        }

        .report-page-dark .bg-blue-50 {
          background-color: #102332 !important;
        }

        .report-page-dark .border-blue-100 {
          border-color: #1e4055 !important;
        }

        .report-page-dark .text-blue-800 {
          color: #93c5fd !important;
        }

        .report-page-dark .bg-green-50 {
          background-color: #0d291b !important;
        }

        .report-page-dark .bg-green-100 {
          background-color: #123820 !important;
        }

        .report-page-dark .border-green-100 {
          border-color: #1d5a34 !important;
        }

        .report-page-dark .border-green-200 {
          border-color: #287344 !important;
        }

        .report-page-dark .text-green-700 {
          color: #86efac !important;
        }

        .report-page-dark .text-green-600 {
          color: #4ade80 !important;
        }

        .report-page-dark .bg-red-50 {
          background-color: #321516 !important;
        }

        .report-page-dark .border-red-100 {
          border-color: #642528 !important;
        }

        .report-page-dark .text-red-700 {
          color: #fca5a5 !important;
        }

        .report-page-dark .bg-amber-50 {
          background-color: #30240d !important;
        }

        .report-page-dark .border-amber-100 {
          border-color: #66501b !important;
        }

        .report-page-dark .text-amber-700 {
          color: #fcd34d !important;
        }

        .report-page-dark .bg-black\/10 {
          background-color: rgba(255, 255, 255, 0.06) !important;
        }

        .report-page-dark .bg-black\/30 {
          background-color: rgba(0, 0, 0, 0.62) !important;
        }

        .report-page-dark .shadow-2xl,
        .report-page-dark .shadow-xl,
        .report-page-dark .shadow-lg,
        .report-page-dark .shadow-md {
          --tw-shadow-color: rgba(0, 0, 0, 0.45) !important;
        }

        .report-page-dark .scrollbar-hide::-webkit-scrollbar {
          background: transparent;
        }
      `}</style>

      <div
        className={`h-screen w-screen flex overflow-hidden ${
          isDarkMode
            ? "report-page-dark bg-[#0B1110] text-gray-100"
            : "bg-[#F7F9F8] text-gray-900"
        }`}
      >
        {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

        <aside
          className={`
              hidden
              lg:flex
              w-[270px]
              border-r
              flex-col
              px-5
              py-6
              flex-shrink-0
              ${
                isDarkMode
                  ? "bg-[#0B1710] border-[#17251B]"
                  : "bg-white border-gray-100"
              }
            `}
        >
          <SidebarContent />
        </aside>

        {/* =====================================================
          MOBILE SIDEBAR OVERLAY
      ===================================================== */}

        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="
                fixed
                inset-0
                bg-black/30
                backdrop-blur-[2px]
                z-[60]
                lg:hidden
              "
              />

              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{
                  type: "spring",
                  damping: 28,
                  stiffness: 300,
                }}
                className={`
                  fixed
                  left-0
                  top-0
                  bottom-0
                  w-[280px]
                  max-w-[85vw]
                  z-[70]
                  shadow-2xl
                  px-5
                  py-6
                  overflow-y-auto
                  lg:hidden
                  ${
                    isDarkMode
                      ? "bg-[#0B1710] border-r border-[#17251B]"
                      : "bg-white"
                  }
                `}
              >
                <SidebarContent mobile />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* =====================================================
          MAIN
      ===================================================== */}

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {/* ===================================================
            HEADER
        =================================================== */}

          <header
            className={`
    sticky
    top-0
    z-30
    backdrop-blur-xl
    border-b
    transition-colors
    duration-300
    ${
      isDarkMode
        ? "bg-[#0B1110]/95 border-[#1A2C20]"
        : "bg-[#F7F9F8]/90 border-gray-100"
    }
  `}
          >
            <div
              className="
              px-4
              sm:px-6
              md:px-8
              xl:px-10
              py-4
              sm:py-5
              flex
              items-center
              justify-between
              gap-3
            "
            >
              {/* LEFT SIDE */}

              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={mobileSidebarOpen}
                  className={`
                  lg:hidden
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  transition
                  flex-shrink-0
                  ${
                    isDarkMode
                      ? "bg-[#101F15] border-[#24392A] text-gray-300 hover:border-green-700 hover:text-green-400 hover:bg-[#14261A]"
                      : "bg-white border-gray-200 text-gray-600 hover:border-green-200 hover:text-green-700 hover:bg-green-50"
                  }
                `}
                >
                  <Menu size={21} strokeWidth={2.2} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 mb-1">
                    <span>Management</span>

                    <ChevronRight size={11} />

                    <span className="text-green-600 font-medium">Reports</span>
                  </div>

                  <h2
                    className="
                    text-xl
                    sm:text-2xl
                    md:text-3xl
                    font-extrabold
                    tracking-tight
                    text-gray-900
                    truncate
                  "
                  >
                    Reports
                  </h2>

                  <p
                    className="
                    text-xs
                    sm:text-sm
                    text-gray-500
                    mt-1
                    max-w-2xl
                    line-clamp-2
                  "
                  >
                    Review and manage student reports and behavioral concerns.
                  </p>
                </div>
              </div>

              {/* HEADER ACTIONS */}

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setOpenNotif(true)}
                  aria-label="Open notifications"
                  className={`
                  relative
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  transition
                  ${
                    isDarkMode
                      ? "bg-[#101F15] border-[#24392A] text-gray-300 hover:border-green-700 hover:text-green-400 hover:bg-[#14261A]"
                      : "bg-white border-gray-200 text-gray-600 hover:border-green-200 hover:text-green-700"
                  }
                `}
                >
                  <Bell size={17} className="sm:w-[18px] sm:h-[18px]" />

                  {notifications.length > 0 && (
                    <span
                      className={`
                      absolute
                      -top-1
                      -right-1
                      min-w-5
                      h-5
                      px-1.5
                      rounded-full
                      bg-red-500
                      text-white
                      text-[10px]
                      font-bold
                      flex
                      items-center
                      justify-center
                      border-2
                      ${isDarkMode ? "border-[#0B1110]" : "border-[#F7F9F8]"}
                    `}
                    >
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>

                <div className="hidden sm:flex items-center gap-2 ml-1 md:ml-2">
                  <div
                    className={`
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      overflow-hidden
                      ${isDarkMode ? "bg-[#123820]" : "bg-green-100"}
                    `}
                  >
                    {adminPhoto ? (
                      <img
                        src={adminPhoto}
                        alt={adminName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-green-700">
                        {adminName.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ===================================================
            CONTENT
        =================================================== */}

          <div
            className="
            px-4
            sm:px-6
            md:px-8
            xl:px-10
            py-5
            sm:py-6
            md:py-8
            space-y-6
            sm:space-y-8
          "
          >
            {/* =================================================
              REPORT MANAGEMENT HERO
              Matches the Case Management hero card exactly.
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
                    isDarkMode
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
                          isDarkMode
                            ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
                            : "bg-white/80 border-green-100 text-green-700"
                        }
                      `}
                    >
                      <Sparkles size={12} />
                      GuidEd • Report Management
                    </div>

                    <h1
                      className={`
                        text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-4
                        ${isDarkMode ? "text-white" : "text-slate-900"}
                      `}
                    >
                      Your report workload,
                      <span className="text-green-500">{" "}at a glance.</span>
                    </h1>

                    <p
                      className={`
                        text-sm sm:text-base leading-relaxed mt-3 max-w-xl
                        ${isDarkMode ? "text-slate-300" : "text-slate-500"}
                      `}
                    >
                      Review submitted reports, monitor their current status, and keep
                      every report moving through the guidance workflow from one organized workspace.
                    </p>

                    <div className="flex flex-wrap gap-2 mt-5">
                      <div
                        className={`
                          inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                          ${
                            isDarkMode
                              ? "bg-white/5 text-slate-300 border border-white/10"
                              : "bg-white/80 text-slate-600 border border-white"
                          }
                        `}
                      >
                        <ClipboardList size={14} className="text-green-500" />
                        {stats.total} reports
                      </div>

                      <div
                        className={`
                          inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                          ${
                            isDarkMode
                              ? "bg-amber-950/30 text-amber-300 border border-amber-900/30"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }
                        `}
                      >
                        <Clock3 size={14} />
                        {stats.pending} pending
                      </div>

                      <div
                        className={`
                          inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                          ${
                            isDarkMode
                              ? "bg-emerald-950/30 text-emerald-300 border border-emerald-900/30"
                              : "bg-green-50 text-green-700 border border-green-100"
                          }
                        `}
                      >
                        <CheckCircle2 size={14} />
                        {stats.accepted} accepted
                      </div>
                    </div>
                  </div>

                  {/* DIRECTORY — exact Case Management hero treatment */}
                  <div
                    className={`
                      shrink-0
                      w-full xl:w-[260px]
                      rounded-2xl
                      p-4
                      border
                      ${
                        isDarkMode
                          ? "bg-black/10 border-white/10"
                          : "bg-white/70 border-white"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                        <ClipboardList size={20} />
                      </div>

                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            isDarkMode ? "text-slate-400" : "text-gray-500"
                          }`}
                        >
                          Directory
                        </p>

                        <p
                          className={`text-lg font-extrabold ${
                            isDarkMode ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {filteredReports.length}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`
                        text-xs leading-relaxed mt-3
                        ${isDarkMode ? "text-slate-400" : "text-slate-500"}
                      `}
                    >
                      Currently matching your selected search and filters.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
              REPORT OVERVIEW
          ================================================= */}

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">
                    Report Overview
                  </h3>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Current status of student reports
                  </p>
                </div>

                <Activity size={18} className="text-gray-300 flex-shrink-0" />
              </div>

              <div
                className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-3
                sm:gap-4
              "
              >
                <StatCard
                  title="Total Reports"
                  value={stats.total}
                  icon={<ClipboardList size={19} />}
                  type="total"
                />

                <StatCard
                  title="Pending"
                  value={stats.pending}
                  icon={<Clock3 size={19} />}
                  type="pending"
                />

                <StatCard
                  title="Accepted"
                  value={stats.accepted}
                  icon={<CheckCircle2 size={19} />}
                  type="accepted"
                />

                <StatCard
                  title="Rejected"
                  value={stats.rejected}
                  icon={<XCircle size={19} />}
                  type="rejected"
                />
              </div>
            </section>

            {/* =================================================
              REPORT WORKSPACE
          ================================================= */}

            <section>
              <div
                className="
                mb-4
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-3
              "
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">
                    Report Management
                  </h3>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Review submitted reports, incidents, complaints, and
                    insights.
                  </p>
                </div>

                <button
                  onClick={() => setShowPrintableReport(true)}
                  className="
                  self-start
                  sm:self-center
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  h-10
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-gray-700
                  text-xs
                  font-bold
                  hover:border-green-200
                  hover:bg-green-50
                  hover:text-green-700
                  transition
                  shadow-sm
                  whitespace-nowrap
                "
                >
                  <Printer size={16} />
                  Printable Report
                </button>
              </div>

              {/* SEARCH + TABS */}

              <div
                className="
                bg-white
                border
                border-gray-100
                rounded-2xl
                sm:rounded-3xl
                p-3
                sm:p-4
                shadow-[0_4px_24px_rgba(0,0,0,0.025)]
                mb-4
              "
              >
                <div
                  className="
                  flex
                  flex-col
                  xl:flex-row
                  xl:items-center
                  justify-between
                  gap-3
                  sm:gap-4
                "
                >
                  {/* SEARCH */}

                  <div
                    className="
                    flex
                    items-center
                    gap-3
                    px-3
                    sm:px-4
                    h-11
                    rounded-xl
                    bg-gray-50
                    border
                    border-gray-100
                    focus-within:bg-white
                    focus-within:border-green-200
                    focus-within:ring-2
                    focus-within:ring-green-50
                    transition
                    w-full
                    xl:max-w-md
                  "
                  >
                    <Search size={17} className="text-gray-400 flex-shrink-0" />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search student or offense..."
                      className="
                      bg-transparent
                      outline-none
                      w-full
                      min-w-0
                      text-sm
                      text-gray-800
                      placeholder:text-gray-400
                    "
                    />

                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="
                        text-gray-400
                        hover:text-gray-700
                        transition
                        flex-shrink-0
                      "
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* TABS */}

                  <div
                    className="
                    w-full
                    xl:w-auto
                    min-w-0
                    overflow-x-auto
                    scrollbar-hide
                  "
                  >
                    <div
                      className="
                      flex
                      gap-1
                      p-1
                      rounded-xl
                      bg-gray-50
                      border
                      border-gray-100
                      w-max
                      min-w-full
                      xl:min-w-0
                    "
                    >
                      <Tab
                        label="Mobile Reports"
                        active={activeTab === "mobile"}
                        onClick={() => setActiveTab("mobile")}
                      />

                      <Tab
                        label="Incident"
                        active={activeTab === "incident"}
                        onClick={() => setActiveTab("incident")}
                      />

                      <Tab
                        label="Complaint"
                        active={activeTab === "complaint"}
                        onClick={() => setActiveTab("complaint")}
                      />

                      <Tab
                        label="Overview"
                        active={activeTab === "overview"}
                        onClick={() => setActiveTab("overview")}
                      />

                      <Tab
                        label="AI Insights"
                        active={activeTab === "ai"}
                        onClick={() => setActiveTab("ai")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTENT */}

              <motion.div
                layout
                className="
                bg-white
                border
                border-gray-100
                rounded-2xl
                sm:rounded-3xl
                p-3
                sm:p-5
                shadow-[0_4px_24px_rgba(0,0,0,0.025)]
                min-h-[500px]
                min-w-0
                overflow-hidden
              "
              >
                {/* =================================================
                  MOBILE REPORTS
              ================================================= */}

                {activeTab === "mobile" && (
                  <>
                    {/* MOBILE REPORT HEADER */}

                    <div
                      className="
                      flex
                      flex-col
                      lg:flex-row
                      lg:items-center
                      lg:justify-between
                      gap-4
                      mb-5
                    "
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
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
                            flex-shrink-0
                          "
                          >
                            <FileWarning size={17} />
                          </div>

                          <h3 className="font-bold text-gray-900 truncate">
                            Mobile Reports
                          </h3>
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Reports submitted through the GuidEd mobile app.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start lg:self-center">
                        <div
                          className="
                          px-2.5
                          py-1
                          rounded-lg
                          bg-green-50
                          text-green-700
                          text-[10px]
                          font-bold
                          whitespace-nowrap
                        "
                        >
                          {filteredReports.length}{" "}
                          {filteredReports.length === 1 ? "REPORT" : "REPORTS"}
                        </div>
                      </div>
                    </div>

                    {/* =================================================
                      AI CONTROL PANEL
                  ================================================= */}

                    <div
                      className={`
                        mb-5
                        rounded-2xl
                        sm:rounded-3xl
                        border
                        p-4
                        sm:p-5
                        ${
                          isDarkMode
                            ? "border-[#1A2C20] bg-[#0D1A12]"
                            : "border-green-100 bg-gradient-to-br from-green-50 via-white to-white"
                        }
                      `}
                    >
                      <div
                        className="
                        flex
                        flex-col
                        xl:flex-row
                        xl:items-center
                        xl:justify-between
                        gap-4
                      "
                      >
                        {/* AI DESCRIPTION */}

                        <div className="flex gap-3 min-w-0">
                          <div
                            className="
                            w-11
                            h-11
                            rounded-2xl
                            bg-green-600
                            text-white
                            flex
                            items-center
                            justify-center
                            flex-shrink-0
                            shadow-sm
                          "
                          >
                            <BrainCircuit size={21} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`font-extrabold ${
                                  isDarkMode ? "text-gray-100" : "text-gray-900"
                                }`}
                              >
                                Gemini AI Review
                              </h4>

                              <span
                                className={`
                                  px-2
                                  py-0.5
                                  rounded-full
                                  text-[9px]
                                  font-bold
                                  uppercase
                                  tracking-wide
                                  ${
                                    isDarkMode
                                      ? "bg-[#17351D] text-green-300 border border-[#2E6B36]"
                                      : "bg-green-100 text-green-700"
                                  }
                                `}
                              >
                                Decision Support
                              </span>
                            </div>

                            <p
                              className={`
                                text-xs
                                mt-1
                                max-w-2xl
                                leading-relaxed
                                ${isDarkMode ? "text-gray-400" : "text-gray-500"}
                              `}
                            >
                              Analyze pending mobile reports for severity, risk
                              level, review priority, and evidence consistency.
                              AI assists the authorized reviewer and does not
                              automatically accept or reject reports.
                            </p>
                          </div>
                        </div>

                        {/* ANALYZE BUTTON */}

                        <button
                          onClick={handleAnalyzeAllPending}
                          disabled={batchAnalyzing || reports.length === 0}
                          className={`
                              w-full
                              xl:w-auto
                              min-w-[230px]
                              h-11
                              px-4
                              rounded-xl
                              bg-green-700
                              hover:bg-green-800
                              text-white
                              text-xs
                              font-bold
                              flex
                              items-center
                              justify-center
                              gap-2
                              transition
                              shadow-sm
                              disabled:cursor-not-allowed
                              flex-shrink-0
                              ${
                                isDarkMode
                                  ? "disabled:bg-[#243028] disabled:text-gray-500"
                                  : "disabled:bg-gray-300 disabled:text-gray-500"
                              }
                            `}
                        >
                          {batchAnalyzing ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Analyzing Pending Reports...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              Analyze All Pending Reports
                            </>
                          )}
                        </button>
                      </div>

                      {/* AI STATISTICS */}

                      <div
                        className="
                        grid
                        grid-cols-2
                        sm:grid-cols-4
                        lg:grid-cols-8
                        gap-2
                        mt-4
                      "
                      >
                        <AIStat
                          label="Pending"
                          value={aiStats.total}
                          darkMode={isDarkMode}
                        />

                        <AIStat
                          label="AI Reviewed"
                          value={aiStats.analyzed}
                          type="green"
                          darkMode={isDarkMode}
                        />

                        <AIStat
                          label="Needs AI"
                          value={aiStats.needsAI}
                          type="amber"
                          darkMode={isDarkMode}
                        />

                        <AIStat
                          label="High Risk"
                          value={aiStats.highRisk}
                          type="red"
                          darkMode={isDarkMode}
                        />

                        <AIStat
                          label="Medium Risk"
                          value={aiStats.mediumRisk}
                          type="amber"
                          darkMode={isDarkMode}
                        />

                        <AIStat
                          label="Low Risk"
                          value={aiStats.lowRisk}
                          type="green"
                          darkMode={isDarkMode}
                        />

                        <AIStat
                          label="High Severity"
                          value={aiStats.highSeverity}
                          type="red"
                          darkMode={isDarkMode}
                        />

                        <AIStat
                          label="Medium Severity"
                          value={aiStats.mediumSeverity}
                          type="amber"
                          darkMode={isDarkMode}
                        />
                      </div>

                      {/* ERROR */}

                      {aiBatchError && (
                        <div
                          className="
                          mt-4
                          p-3
                          rounded-xl
                          bg-red-50
                          border
                          border-red-100
                          text-red-700
                          text-xs
                          flex
                          items-start
                          gap-2
                        "
                        >
                          <AlertTriangle
                            size={16}
                            className="flex-shrink-0 mt-0.5"
                          />

                          <div className="min-w-0">
                            <p className="font-bold">
                              AI analysis could not be completed.
                            </p>

                            <p className="mt-0.5 leading-relaxed">
                              {aiBatchError}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* LAST BATCH RESULT */}

                      {batchProgress && !batchAnalyzing && (
                        <div
                          className="
                          mt-4
                          flex
                          flex-col
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                          gap-2
                          text-[10px]
                          text-gray-500
                        "
                        >
                          <span>
                            Last batch:{" "}
                            <strong className="text-gray-700">
                              {batchProgress.analyzed}
                            </strong>{" "}
                            analyzed,{" "}
                            <strong className="text-gray-700">
                              {batchProgress.skipped}
                            </strong>{" "}
                            skipped,{" "}
                            <strong className="text-gray-700">
                              {batchProgress.failed}
                            </strong>{" "}
                            failed.
                          </span>

                          <button
                            onClick={() => setShowAIResults(true)}
                            className="
                            inline-flex
                            items-center
                            gap-1.5
                            font-bold
                            text-green-700
                            hover:text-green-800
                          "
                          >
                            <Eye size={13} />
                            View Full Results
                          </button>
                        </div>
                      )}
                    </div>

                    {/* =================================================
                      AI FILTERS
                  ================================================= */}

                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Filter size={14} className="text-gray-400" />

                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          AI Filters
                        </span>
                      </div>

                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <AIFilterButton
                          label="All"
                          count={aiStats.total}
                          active={aiFilter === "all"}
                          onClick={() => setAiFilter("all")}
                        />

                        <AIFilterButton
                          label="Needs AI Review"
                          count={aiStats.needsAI}
                          active={aiFilter === "needs_ai"}
                          onClick={() => setAiFilter("needs_ai")}
                          type="amber"
                        />

                        <AIFilterButton
                          label="AI Reviewed"
                          count={aiStats.analyzed}
                          active={aiFilter === "ai_reviewed"}
                          onClick={() => setAiFilter("ai_reviewed")}
                          type="green"
                        />

                        <AIFilterButton
                          label="High Risk"
                          count={aiStats.highRisk}
                          active={aiFilter === "high_risk"}
                          onClick={() => setAiFilter("high_risk")}
                          type="red"
                        />

                        <AIFilterButton
                          label="Medium Risk"
                          count={aiStats.mediumRisk}
                          active={aiFilter === "medium_risk"}
                          onClick={() => setAiFilter("medium_risk")}
                          type="amber"
                        />

                        <AIFilterButton
                          label="Low Risk"
                          count={aiStats.lowRisk}
                          active={aiFilter === "low_risk"}
                          onClick={() => setAiFilter("low_risk")}
                          type="green"
                        />

                        <AIFilterButton
                          label="High Severity"
                          count={aiStats.highSeverity}
                          active={aiFilter === "high_severity"}
                          onClick={() => setAiFilter("high_severity")}
                          type="red"
                        />

                        <AIFilterButton
                          label="Medium Severity"
                          count={aiStats.mediumSeverity}
                          active={aiFilter === "medium_severity"}
                          onClick={() => setAiFilter("medium_severity")}
                          type="amber"
                        />

                        <AIFilterButton
                          label="Low Severity"
                          count={aiStats.lowSeverity}
                          active={aiFilter === "low_severity"}
                          onClick={() => setAiFilter("low_severity")}
                          type="green"
                        />
                      </div>
                    </div>

                    {/* =================================================
                      REPORT LIST
                  ================================================= */}

                    {loading ? (
                      <LoadingState />
                    ) : filteredReports.length ? (
                      <div className="space-y-3 min-w-0">
                        {filteredReports.map((report) => (
                          <motion.div
                            key={report._id}
                            layout
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            whileHover={{
                              y: -1,
                            }}
                            className={`
                              border
                              rounded-xl
                              sm:rounded-2xl
                              p-3
                              sm:p-4
                              transition
                              min-w-0
                              overflow-hidden
                              ${
                                isDarkMode
                                  ? "bg-[#07110B] border-[#1A2C20] hover:bg-[#0B1710]"
                                  : "bg-gray-50 border-gray-100 hover:bg-white"
                              }
                            `}
                          >
                            <div className="min-w-0 overflow-x-auto">
                              <MobileReport
                                report={report}
                                onAccept={handleAccept}
                                onReject={handleReject}
                                onAIAnalyzed={handleAIAnalyzed}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState />
                    )}
                  </>
                )}

                {/* INCIDENT */}

                {activeTab === "incident" && (
                  <div className="min-w-0 overflow-x-auto">
                    <IncidentReport />
                  </div>
                )}

                {/* COMPLAINT */}

                {activeTab === "complaint" && (
                  <div className="min-w-0 overflow-x-auto">
                    <ComplaintReport />
                  </div>
                )}

                {/* OVERVIEW */}

                {activeTab === "overview" && (
                  <div className="min-w-0 overflow-x-auto">
                    <Overview />
                  </div>
                )}

                {/* AI */}

                {activeTab === "ai" && (
                  <div className="min-w-0 overflow-x-auto">
                    <AIPredictions />
                  </div>
                )}
              </motion.div>
            </section>
          </div>
        </main>

        {/* =====================================================
          NOTIFICATION DRAWER
      ===================================================== */}

        <AnimatePresence>
          {openNotif && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpenNotif(false)}
                className="
                fixed
                inset-0
                bg-black/10
                backdrop-blur-[2px]
                z-40
              "
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "spring",
                  damping: 28,
                }}
                className="
                fixed
                right-0
                top-0
                h-full
                w-full
                max-w-full
                sm:w-[390px]
                bg-white
                border-l
                border-gray-100
                shadow-2xl
                z-50
                flex
                flex-col
              "
              >
                <div
                  className="
                  px-4
                  sm:px-6
                  py-4
                  sm:py-5
                  border-b
                  border-gray-100
                  flex
                  items-center
                  justify-between
                  gap-3
                "
                >
                  <div className="min-w-0">
                    <h3
                      className="
                      font-bold
                      text-gray-900
                      flex
                      items-center
                      gap-2
                    "
                    >
                      <Bell size={17} className="flex-shrink-0" />
                      <span>Notifications</span>
                    </h3>

                    <p className="text-xs text-gray-400 mt-1">
                      Recent report activity
                    </p>
                  </div>

                  <button
                    onClick={() => setOpenNotif(false)}
                    aria-label="Close notifications"
                    className="
                    w-9
                    h-9
                    rounded-xl
                    hover:bg-gray-100
                    flex
                    items-center
                    justify-center
                    transition
                    flex-shrink-0
                  "
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                  {notifications.length === 0 ? (
                    <div
                      className="
                      h-full
                      flex
                      flex-col
                      items-center
                      justify-center
                      text-center
                      px-4
                    "
                    >
                      <div
                        className="
                        w-14
                        h-14
                        rounded-2xl
                        bg-gray-50
                        flex
                        items-center
                        justify-center
                        mb-4
                      "
                      >
                        <Bell size={22} className="text-gray-300" />
                      </div>

                      <p className="font-semibold text-gray-700">
                        No notifications
                      </p>

                      <p
                        className="
                        text-xs
                        text-gray-400
                        mt-1
                        max-w-[220px]
                      "
                      >
                        New report submissions and updates will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{
                            opacity: 0,
                            y: 5,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="
                            p-3
                            sm:p-4
                            rounded-2xl
                            bg-gray-50
                            border
                            border-gray-100
                            hover:bg-white
                            hover:shadow-sm
                            transition
                          "
                        >
                          <div className="flex gap-3">
                            <div
                              className="
                                w-9
                                h-9
                                rounded-xl
                                bg-green-100
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                              "
                            >
                              <FileWarning
                                size={15}
                                className="text-green-700"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className="
                                  font-semibold
                                  text-sm
                                  text-gray-900
                                  break-words
                                "
                              >
                                {notification.title}
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-gray-500
                                  mt-1
                                  leading-relaxed
                                  break-words
                                "
                              >
                                {notification.text}
                              </p>

                              <div
                                className="
                                  flex
                                  flex-col
                                  sm:flex-row
                                  items-start
                                  sm:items-center
                                  justify-between
                                  gap-1
                                  sm:gap-3
                                  mt-2
                                "
                              >
                                <span
                                  className="
                                    text-[10px]
                                    font-semibold
                                    text-green-700
                                    truncate
                                    max-w-full
                                  "
                                >
                                  {notification.student}
                                </span>

                                <span
                                  className="
                                    text-[10px]
                                    text-gray-400
                                    whitespace-nowrap
                                  "
                                >
                                  {new Date(
                                    notification.time,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* =====================================================
          TOAST
      ===================================================== */}

        <AnimatePresence>
          {toastNotif && (
            <motion.div
              initial={{
                opacity: 0,
                y: -15,
                x: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
                x: 0,
              }}
              exit={{
                opacity: 0,
                y: -15,
                x: 20,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
              }}
              className="
              fixed
              top-3
              sm:top-5
              left-3
              right-3
              sm:left-auto
              sm:right-5
              z-[999]
              w-auto
              sm:w-[380px]
              max-w-[calc(100vw-24px)]
              bg-white
              border
              border-gray-100
              rounded-2xl
              sm:rounded-3xl
              shadow-[0_20px_60px_rgba(0,0,0,0.14)]
              overflow-hidden
            "
            >
              <div className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                <div
                  className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
                >
                  <Bell size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                  >
                    <p
                      className="
                      font-bold
                      text-gray-900
                      text-sm
                      truncate
                    "
                    >
                      {toastNotif.title}
                    </p>

                    <button
                      onClick={() => setToastNotif(null)}
                      aria-label="Close notification"
                      className="
                      text-gray-400
                      hover:text-gray-700
                      flex-shrink-0
                    "
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <p
                    className="
                    text-sm
                    text-gray-600
                    mt-1
                    line-clamp-2
                    break-words
                  "
                  >
                    {toastNotif.text}
                  </p>

                  <div
                    className="
                    flex
                    justify-between
                    items-center
                    mt-3
                    gap-3
                  "
                  >
                    <span
                      className="
                      text-xs
                      text-green-700
                      font-semibold
                      truncate
                      min-w-0
                    "
                    >
                      {toastNotif.student}
                    </span>

                    <span
                      className="
                      text-[10px]
                      text-gray-400
                      whitespace-nowrap
                      flex-shrink-0
                    "
                    >
                      {new Date(toastNotif.time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{
                  duration: 4,
                  ease: "linear",
                }}
                className="h-1 bg-green-500"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* =====================================================
          AI ANALYSIS COMPLETE MODAL
      ===================================================== */}

        <AIAnalysisResultsModal
          open={showAIResults}
          onClose={() => {
            setShowAIResults(false);
            setSelectedAIResult(null);
          }}
          progress={batchProgress}
          results={aiBatchResults}
          onSelectReport={(result) => {
            setSelectedAIResult(result);
          }}
        />

        {/* =====================================================
          INDIVIDUAL AI RESULT DETAIL
      ===================================================== */}

        <AIResultDetailModal
          result={selectedAIResult}
          onClose={() => setSelectedAIResult(null)}
        />

        {/* =====================================================
          PRINTABLE REPORT
      ===================================================== */}

        {showPrintableReport && (
          <div
            className={`printable-report-host ${
              isDarkMode ? "printable-report-dark" : ""
            }`}
            data-printable-report="true"
          >
            <PrintableReport
              darkMode={isDarkMode}
              onClose={() => setShowPrintableReport(false)}
            />
          </div>
        )}
      </div>
    </>
  );
};

/* =========================================================
   NAV
========================================================= */

const Nav = ({
  icon,
  label,
  onClick,
  active = false,
  darkMode = false,
}) => (
  <button
    type="button"
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
          ? darkMode
            ? "bg-emerald-950/70 text-emerald-300 font-semibold"
            : "bg-green-50 text-green-700 font-semibold"
          : darkMode
            ? "text-slate-400 hover:bg-[#101F17] hover:text-gray-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <span
      className={`
        transition
        ${
          active
            ? darkMode
              ? "text-emerald-300"
              : "text-green-600"
            : darkMode
              ? "text-slate-500 group-hover:text-gray-300"
              : "text-gray-400 group-hover:text-gray-700"
        }
      `}
    >
      {icon}
    </span>

    <span>{label}</span>

    {active && (
      <span
        className={`
          ml-auto
          w-1.5
          h-1.5
          rounded-full
          ${
            darkMode
              ? "bg-emerald-400"
              : "bg-green-600"
          }
        `}
      />
    )}
  </button>
);

/* =========================================================
   TAB
========================================================= */

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-3
      sm:px-3.5
      py-2
      rounded-lg
      text-[11px]
      sm:text-xs
      font-semibold
      transition
      whitespace-nowrap
      flex-shrink-0
      ${
        active
          ? "bg-white text-green-700 shadow-sm border border-gray-100"
          : "text-gray-500 hover:text-gray-800 hover:bg-white/70"
      }
    `}
  >
    {label}
  </button>
);

/* =========================================================
   AI STAT
========================================================= */

const AIStat = ({ label, value, type = "default", darkMode = false }) => {
  const lightStyles = {
    default: "bg-gray-50 border-gray-100 text-gray-700",
    green: "bg-green-50 border-green-100 text-green-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    red: "bg-red-50 border-red-100 text-red-700",
  };

  const darkStyles = {
    default: "bg-[#101F15] border-[#1A2C20] text-gray-200",
    green: "bg-green-950/30 border-green-900/60 text-green-300",
    amber: "bg-amber-950/30 border-amber-900/60 text-amber-300",
    red: "bg-red-950/30 border-red-900/60 text-red-300",
  };

  return (
    <div
      className={`
        rounded-xl
        border
        px-2.5
        py-2
        min-w-0
        ${darkMode ? darkStyles[type] : lightStyles[type]}
      `}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide opacity-70 truncate">
        {label}
      </p>

      <p className="text-lg font-extrabold mt-0.5">{value}</p>
    </div>
  );
};

/* =========================================================
   AI FILTER BUTTON
========================================================= */

const AIFilterButton = ({
  label,
  count,
  active,
  onClick,
  type = "default",
  darkMode = false,
}) => {
  const styles = {
    default: darkMode
      ? active
        ? "bg-gray-100 text-gray-900 border-gray-100"
        : "bg-[#101F15] text-gray-300 border-[#24392A] hover:bg-[#16291C]"
      : active
        ? "bg-gray-900 text-white border-gray-900"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",

    green: darkMode
      ? active
        ? "bg-green-700 text-white border-green-700"
        : "bg-[#10251A] text-green-300 border-green-900/60 hover:bg-[#17351D]"
      : active
        ? "bg-green-700 text-white border-green-700"
        : "bg-white text-green-700 border-green-100 hover:bg-green-50",

    amber: darkMode
      ? active
        ? "bg-amber-600 text-white border-amber-600"
        : "bg-[#2A210C] text-amber-300 border-amber-900/60 hover:bg-[#362A0D]"
      : active
        ? "bg-amber-600 text-white border-amber-600"
        : "bg-white text-amber-700 border-amber-100 hover:bg-amber-50",

    red: darkMode
      ? active
        ? "bg-red-600 text-white border-red-600"
        : "bg-[#2A1214] text-red-300 border-red-900/60 hover:bg-[#391719]"
      : active
        ? "bg-red-600 text-white border-red-600"
        : "bg-white text-red-700 border-red-100 hover:bg-red-50",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex
        items-center
        gap-2
        px-3
        py-2
        rounded-xl
        border
        text-[10px]
        sm:text-[11px]
        font-bold
        whitespace-nowrap
        transition
        flex-shrink-0
        ${styles[type]}
      `}
    >
      {label}

      <span
        className={`
          min-w-5
          h-5
          px-1.5
          rounded-full
          flex
          items-center
          justify-center
          text-[9px]
          ${
            active
              ? "bg-white/20"
              : darkMode
                ? "bg-[#1A2C20] text-gray-300"
                : "bg-gray-100 text-gray-600"
          }
        `}
      >
        {count}
      </span>
    </button>
  );
};

/* =========================================================
   AI LEVEL BADGE
========================================================= */

const AILevelBadge = ({ value, label }) => {
  if (!value) return null;

  const normalized = String(value).toLowerCase();

  let style = "bg-gray-100 text-gray-600 border-gray-200";

  let icon = null;

  if (normalized === "high") {
    style = "bg-red-50 text-red-700 border-red-100";

    icon = <ShieldAlert size={12} />;
  }

  if (normalized === "medium") {
    style = "bg-amber-50 text-amber-700 border-amber-100";

    icon = <AlertTriangle size={12} />;
  }

  if (normalized === "low") {
    style = "bg-green-50 text-green-700 border-green-100";

    icon = <ShieldCheck size={12} />;
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        px-2
        py-1
        rounded-lg
        border
        text-[9px]
        font-extrabold
        uppercase
        tracking-wide
        ${style}
      `}
    >
      {icon}

      {label ? `${label}: ` : ""}
      {value}
    </span>
  );
};

/* =========================================================
   REPORT IDENTIFIER
========================================================= */

const getReportIdentifier = (report) => {
  if (!report) return "Report";

  return (
    report.reportNumber ||
    report.reportId ||
    report.referenceNumber ||
    `Report #${String(report._id || "")
      .slice(-6)
      .toUpperCase()}`
  );
};

/* =========================================================
   DATE FORMATTER
========================================================= */

const formatReportDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* =========================================================
   AI ANALYSIS RESULTS MODAL
========================================================= */

const AIAnalysisResultsModal = ({
  open,
  onClose,
  progress,
  results,
  onSelectReport,
}) => {
  const [activeSection, setActiveSection] = useState("all");

  if (!open) return null;

  const successfulResults = (results || []).filter(
    (result) => result?.success === true && result?.aiReview,
  );

  const failedResults = (results || []).filter(
    (result) => result?.success !== true,
  );

  const highSeverity = successfulResults.filter(
    (result) => result?.aiReview?.severity === "High",
  );

  const mediumSeverity = successfulResults.filter(
    (result) => result?.aiReview?.severity === "Medium",
  );

  const lowSeverity = successfulResults.filter(
    (result) => result?.aiReview?.severity === "Low",
  );

  const highRisk = successfulResults.filter(
    (result) => result?.aiReview?.riskLevel === "High",
  );

  const mediumRisk = successfulResults.filter(
    (result) => result?.aiReview?.riskLevel === "Medium",
  );

  const lowRisk = successfulResults.filter(
    (result) => result?.aiReview?.riskLevel === "Low",
  );

  let displayedResults = successfulResults;

  if (activeSection === "high_severity") {
    displayedResults = highSeverity;
  }

  if (activeSection === "medium_severity") {
    displayedResults = mediumSeverity;
  }

  if (activeSection === "low_severity") {
    displayedResults = lowSeverity;
  }

  if (activeSection === "high_risk") {
    displayedResults = highRisk;
  }

  if (activeSection === "medium_risk") {
    displayedResults = mediumRisk;
  }

  if (activeSection === "low_risk") {
    displayedResults = lowRisk;
  }

  if (activeSection === "failed") {
    displayedResults = failedResults;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="ai-results-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="
          fixed
          inset-0
          z-[200]
          bg-black/45
          backdrop-blur-sm
          p-3
          sm:p-5
          md:p-8
          flex
          items-center
          justify-center
        "
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.97,
            y: 15,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.97,
            y: 15,
          }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 24,
          }}
          className="
            w-full
            max-w-6xl
            max-h-[94vh]
            bg-white
            rounded-2xl
            sm:rounded-3xl
            shadow-2xl
            overflow-hidden
            flex
            flex-col
          "
        >
          {/* HEADER */}

          <div
            className="
              px-4
              sm:px-6
              py-4
              sm:py-5
              border-b
              border-gray-100
              bg-white
              flex
              items-start
              justify-between
              gap-4
              flex-shrink-0
            "
          >
            <div className="flex gap-3 min-w-0">
              <div
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-green-600
                  text-white
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <BrainCircuit size={21} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    AI Analysis Complete
                  </h2>

                  <span
                    className="
                      px-2
                      py-0.5
                      rounded-full
                      bg-green-50
                      text-green-700
                      text-[9px]
                      font-bold
                      uppercase
                    "
                  >
                    Gemini
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Detailed AI decision-support results for the pending reports
                  that were analyzed.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="
                w-9
                h-9
                rounded-xl
                bg-gray-50
                text-gray-500
                hover:bg-gray-100
                hover:text-gray-800
                flex
                items-center
                justify-center
                flex-shrink-0
              "
              aria-label="Close AI results"
            >
              <X size={18} />
            </button>
          </div>

          {/* SUMMARY */}

          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div
              className="
                grid
                grid-cols-2
                sm:grid-cols-4
                lg:grid-cols-7
                gap-2
              "
            >
              <ResultStat
                label="Total"
                value={progress?.total ?? results.length}
              />

              <ResultStat
                label="Analyzed"
                value={progress?.analyzed ?? successfulResults.length}
                type="green"
              />

              <ResultStat
                label="Skipped"
                value={progress?.skipped ?? 0}
                type="amber"
              />

              <ResultStat
                label="Failed"
                value={progress?.failed ?? failedResults.length}
                type="red"
              />

              <ResultStat
                label="High Risk"
                value={progress?.highRisk ?? highRisk.length}
                type="red"
              />

              <ResultStat
                label="Medium Risk"
                value={progress?.mediumRisk ?? mediumRisk.length}
                type="amber"
              />

              <ResultStat
                label="Low Risk"
                value={progress?.lowRisk ?? lowRisk.length}
                type="green"
              />
            </div>
          </div>

          {/* NOTICE */}

          <div className="px-4 sm:px-6 pt-4">
            <div
              className="
                p-3
                rounded-xl
                bg-blue-50
                border
                border-blue-100
                text-blue-800
                flex
                items-start
                gap-2
              "
            >
              <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />

              <p className="text-[11px] leading-relaxed">
                <strong>Human review required:</strong> Gemini provides an AI
                assessment to assist the authorized school reviewer. These
                results do not determine whether a report is true, whether a
                student is guilty, or whether a report should automatically be
                accepted or rejected.
              </p>
            </div>
          </div>

          {/* FILTER */}

          <div className="px-4 sm:px-6 pt-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <ModalFilter
                label="All"
                count={successfulResults.length}
                active={activeSection === "all"}
                onClick={() => setActiveSection("all")}
              />

              <ModalFilter
                label="High Severity"
                count={highSeverity.length}
                active={activeSection === "high_severity"}
                onClick={() => setActiveSection("high_severity")}
                type="red"
              />

              <ModalFilter
                label="Medium Severity"
                count={mediumSeverity.length}
                active={activeSection === "medium_severity"}
                onClick={() => setActiveSection("medium_severity")}
                type="amber"
              />

              <ModalFilter
                label="Low Severity"
                count={lowSeverity.length}
                active={activeSection === "low_severity"}
                onClick={() => setActiveSection("low_severity")}
                type="green"
              />

              <ModalFilter
                label="High Risk"
                count={highRisk.length}
                active={activeSection === "high_risk"}
                onClick={() => setActiveSection("high_risk")}
                type="red"
              />

              <ModalFilter
                label="Medium Risk"
                count={mediumRisk.length}
                active={activeSection === "medium_risk"}
                onClick={() => setActiveSection("medium_risk")}
                type="amber"
              />

              <ModalFilter
                label="Low Risk"
                count={lowRisk.length}
                active={activeSection === "low_risk"}
                onClick={() => setActiveSection("low_risk")}
                type="green"
              />

              {failedResults.length > 0 && (
                <ModalFilter
                  label="Failed"
                  count={failedResults.length}
                  active={activeSection === "failed"}
                  onClick={() => setActiveSection("failed")}
                  type="red"
                />
              )}
            </div>
          </div>

          {/* RESULTS */}

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {displayedResults.length === 0 ? (
              <div className="py-12 text-center">
                <div
                  className="
                    w-12
                    h-12
                    mx-auto
                    rounded-2xl
                    bg-gray-50
                    flex
                    items-center
                    justify-center
                    text-gray-300
                    mb-3
                  "
                >
                  <BrainCircuit size={22} />
                </div>

                <p className="font-bold text-gray-700 text-sm">
                  No results in this category
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Try another AI filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedResults.map((result, index) => (
                  <AIResultCard
                    key={result?.reportId || result?.report?._id || index}
                    result={result}
                    onClick={() => onSelectReport(result)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div
            className="
              px-4
              sm:px-6
              py-3
              border-t
              border-gray-100
              bg-white
              flex
              items-center
              justify-between
              gap-3
              flex-shrink-0
            "
          >
            <p className="text-[10px] text-gray-400">
              Click any report to view the complete AI analysis.
            </p>

            <button
              onClick={onClose}
              className="
                px-4
                h-9
                rounded-xl
                bg-gray-900
                text-white
                text-xs
                font-bold
                hover:bg-gray-800
                transition
                flex-shrink-0
              "
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* =========================================================
   AI RESULT CARD
========================================================= */

const AIResultCard = ({ result, onClick }) => {
  const report = result?.report;
  const ai = result?.aiReview;

  if (!ai) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-red-100
          bg-red-50
          p-4
        "
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />

          <div>
            <p className="text-sm font-bold text-red-800">
              {getReportIdentifier(report)}
            </p>

            <p className="text-xs text-red-700 mt-1">
              {result?.error || "This report could not be analyzed."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="
        w-full
        text-left
        rounded-2xl
        border
        border-gray-100
        bg-white
        hover:border-green-200
        hover:shadow-md
        transition
        overflow-hidden
      "
    >
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* REPORT INFORMATION */}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="
                  px-2
                  py-1
                  rounded-lg
                  bg-gray-100
                  text-gray-700
                  text-[9px]
                  font-extrabold
                "
              >
                {getReportIdentifier(report)}
              </span>

              <AILevelBadge value={ai.severity} label="Severity" />

              <AILevelBadge value={ai.riskLevel} label="Risk" />

              <AILevelBadge value={ai.reviewPriority} label="Priority" />
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mt-3">
              {report?.studentName || "Student information unavailable"}
            </h3>

            <p className="text-xs text-gray-500 mt-0.5">
              {report?.offense || "Offense information unavailable"}
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-1.5
              text-[10px]
              font-bold
              text-green-700
              flex-shrink-0
            "
          >
            <Eye size={13} />
            View Full Analysis
            <ChevronRight size={13} />
          </div>
        </div>

        {/* AI REASON */}

        <div
          className="
            mt-4
            grid
            grid-cols-1
            md:grid-cols-2
            gap-3
          "
        >
          <div
            className="
              rounded-xl
              bg-gray-50
              border
              border-gray-100
              p-3
            "
          >
            <p className="text-[9px] uppercase tracking-wide font-bold text-gray-400">
              Severity Reason
            </p>

            <p className="text-xs text-gray-700 mt-1.5 leading-relaxed line-clamp-3">
              {ai.severityReason || "No severity reasoning provided."}
            </p>
          </div>

          <div
            className="
              rounded-xl
              bg-gray-50
              border
              border-gray-100
              p-3
            "
          >
            <p className="text-[9px] uppercase tracking-wide font-bold text-gray-400">
              Evidence Assessment
            </p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-bold text-gray-800">
                {ai.evidenceAssessment || "Unable to Verify"}
              </span>

              {ai.evidenceConfidence !== null &&
                ai.evidenceConfidence !== undefined && (
                  <span className="text-[10px] text-gray-400">
                    {ai.evidenceConfidence}% confidence
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* SUMMARY */}

        <div
          className="
            mt-3
            rounded-xl
            bg-green-50/60
            border
            border-green-100
            p-3
          "
        >
          <p className="text-[9px] uppercase tracking-wide font-bold text-green-700">
            AI Summary
          </p>

          <p className="text-xs text-gray-700 mt-1 leading-relaxed line-clamp-3">
            {ai.summary || "No AI summary was provided."}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

/* =========================================================
   AI RESULT DETAIL MODAL
========================================================= */

const AIResultDetailModal = ({ result, onClose }) => {
  if (!result) return null;

  const report = result?.report;
  const ai = result?.aiReview;

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          key="ai-result-detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="
            fixed
            inset-0
            z-[300]
            bg-black/50
            backdrop-blur-sm
            p-3
            sm:p-5
            md:p-8
            flex
            items-center
            justify-center
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.97,
              y: 15,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 15,
            }}
            className="
              w-full
              max-w-4xl
              max-h-[94vh]
              bg-white
              rounded-2xl
              sm:rounded-3xl
              shadow-2xl
              overflow-hidden
              flex
              flex-col
            "
          >
            {/* HEADER */}

            <div
              className="
                px-4
                sm:px-6
                py-4
                border-b
                border-gray-100
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="
                      px-2
                      py-1
                      rounded-lg
                      bg-gray-100
                      text-gray-700
                      text-[9px]
                      font-extrabold
                    "
                  >
                    {getReportIdentifier(report)}
                  </span>

                  <span
                    className="
                      px-2
                      py-1
                      rounded-lg
                      bg-green-50
                      text-green-700
                      text-[9px]
                      font-extrabold
                    "
                  >
                    Gemini AI Analysis
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mt-3">
                  {report?.studentName || "Student information unavailable"}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {report?.offense || "Offense information unavailable"}
                </p>
              </div>

              <button
                onClick={onClose}
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-gray-50
                  text-gray-500
                  hover:bg-gray-100
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* REPORT INFORMATION */}

              <DetailSection title="Report Information">
                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-3
                    gap-3
                  "
                >
                  <DetailItem
                    label="Student Reported"
                    value={report?.studentName || "Unavailable"}
                  />

                  <DetailItem
                    label="Offense"
                    value={report?.offense || "Unavailable"}
                  />

                  <DetailItem
                    label="Location"
                    value={report?.location || "Unavailable"}
                  />

                  <DetailItem
                    label="Date"
                    value={formatReportDate(report?.date)}
                  />

                  <DetailItem
                    label="Time"
                    value={report?.time || "Unavailable"}
                  />

                  <DetailItem
                    label="Report Status"
                    value={report?.status || "Pending"}
                  />
                </div>

                {report?.description && (
                  <div className="mt-3">
                    <p className="text-[9px] uppercase tracking-wide font-bold text-gray-400">
                      Submitted Description
                    </p>

                    <div
                      className="
                        mt-1.5
                        p-3
                        rounded-xl
                        bg-gray-50
                        border
                        border-gray-100
                      "
                    >
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {report.description}
                      </p>
                    </div>
                  </div>
                )}
              </DetailSection>

              {/* AI CLASSIFICATION */}

              <DetailSection title="AI Assessment">
                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-4
                    gap-3
                  "
                >
                  <AIClassificationCard
                    label="Severity"
                    value={ai?.severity}
                    icon={<AlertTriangle size={17} />}
                  />

                  <AIClassificationCard
                    label="Risk Level"
                    value={ai?.riskLevel}
                    icon={<ShieldAlert size={17} />}
                  />

                  <AIClassificationCard
                    label="Review Priority"
                    value={ai?.reviewPriority}
                    icon={<Clock3 size={17} />}
                  />

                  <AIClassificationCard
                    label="Evidence"
                    value={ai?.evidenceAssessment || "Unable to Verify"}
                    icon={<Eye size={17} />}
                  />
                </div>
              </DetailSection>

              {/* SEVERITY REASON */}

              <DetailSection title="Why Gemini Assigned This Severity">
                <DetailText
                  text={
                    ai?.severityReason || "No severity reasoning was returned."
                  }
                />
              </DetailSection>

              {/* EVIDENCE */}

              <DetailSection title="Evidence Assessment">
                <div
                  className="
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    gap-3
                    mb-3
                  "
                >
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-3
                      py-2
                      rounded-xl
                      bg-gray-50
                      border
                      border-gray-100
                      text-xs
                      font-bold
                      text-gray-800
                    "
                  >
                    <Eye size={15} />

                    {ai?.evidenceAssessment || "Unable to Verify"}
                  </span>

                  {ai?.evidenceConfidence !== null &&
                    ai?.evidenceConfidence !== undefined && (
                      <span className="text-xs font-semibold text-gray-500">
                        Confidence:{" "}
                        <strong className="text-gray-800">
                          {ai.evidenceConfidence}%
                        </strong>
                      </span>
                    )}
                </div>

                {Array.isArray(ai?.evidenceFindings) &&
                  ai.evidenceFindings.length > 0 && (
                    <div className="space-y-2">
                      {ai.evidenceFindings.map((finding, index) => (
                        <div
                          key={index}
                          className="
                              flex
                              items-start
                              gap-2
                              p-3
                              rounded-xl
                              bg-gray-50
                              border
                              border-gray-100
                            "
                        >
                          <span
                            className="
                                w-5
                                h-5
                                rounded-full
                                bg-green-100
                                text-green-700
                                flex
                                items-center
                                justify-center
                                text-[9px]
                                font-bold
                                flex-shrink-0
                              "
                          >
                            {index + 1}
                          </span>

                          <p className="text-xs text-gray-700 leading-relaxed">
                            {finding}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </DetailSection>

              {/* SUMMARY */}

              <DetailSection title="AI Summary">
                <div
                  className="
                    p-4
                    rounded-2xl
                    bg-green-50
                    border
                    border-green-100
                  "
                >
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {ai?.summary || "No AI summary was returned."}
                  </p>
                </div>
              </DetailSection>

              {/* LIMITATIONS */}

              <DetailSection title="AI Limitations">
                {Array.isArray(ai?.limitations) && ai.limitations.length > 0 ? (
                  <div className="space-y-2">
                    {ai.limitations.map((limitation, index) => (
                      <div
                        key={index}
                        className="
                            flex
                            items-start
                            gap-2
                            p-3
                            rounded-xl
                            bg-amber-50
                            border
                            border-amber-100
                          "
                      >
                        <AlertTriangle
                          size={14}
                          className="
                              text-amber-600
                              flex-shrink-0
                              mt-0.5
                            "
                        />

                        <p className="text-xs text-amber-800 leading-relaxed">
                          {limitation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DetailText text="No additional limitations were returned." />
                )}
              </DetailSection>

              {/* HUMAN REVIEW NOTICE */}

              <div
                className="
                  mt-4
                  p-4
                  rounded-2xl
                  bg-blue-50
                  border
                  border-blue-100
                  flex
                  items-start
                  gap-3
                "
              >
                <ShieldCheck
                  size={19}
                  className="
                    text-blue-700
                    flex-shrink-0
                    mt-0.5
                  "
                />

                <div>
                  <p className="text-xs font-extrabold text-blue-900">
                    Authorized Human Review Required
                  </p>

                  <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                    This AI assessment is decision-support information only. The
                    reviewer must independently evaluate the submitted report
                    and evidence before deciding whether to accept or reject the
                    report. AI severity or risk classification does not
                    establish guilt or prove the report is truthful.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div
              className="
                px-4
                sm:px-6
                py-3
                border-t
                border-gray-100
                flex
                justify-end
                flex-shrink-0
              "
            >
              <button
                onClick={onClose}
                className="
                  px-5
                  h-10
                  rounded-xl
                  bg-gray-900
                  text-white
                  text-xs
                  font-bold
                  hover:bg-gray-800
                  transition
                "
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =========================================================
   RESULT STAT
========================================================= */

const ResultStat = ({ label, value, type = "default" }) => {
  const styles = {
    default: "bg-white border-gray-200 text-gray-800",
    green: "bg-green-50 border-green-100 text-green-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    red: "bg-red-50 border-red-100 text-red-700",
  };

  return (
    <div
      className={`
        p-2.5
        rounded-xl
        border
        ${styles[type]}
      `}
    >
      <p className="text-[9px] uppercase tracking-wide font-bold opacity-60 truncate">
        {label}
      </p>

      <p className="text-lg font-extrabold mt-0.5">{value}</p>
    </div>
  );
};

/* =========================================================
   MODAL FILTER
========================================================= */

const ModalFilter = ({ label, count, active, onClick, type = "default" }) => {
  const styles = {
    default: active
      ? "bg-gray-900 text-white border-gray-900"
      : "bg-white text-gray-600 border-gray-200",

    green: active
      ? "bg-green-700 text-white border-green-700"
      : "bg-white text-green-700 border-green-100",

    amber: active
      ? "bg-amber-600 text-white border-amber-600"
      : "bg-white text-amber-700 border-amber-100",

    red: active
      ? "bg-red-600 text-white border-red-600"
      : "bg-white text-red-700 border-red-100",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex
        items-center
        gap-2
        px-3
        py-2
        rounded-xl
        border
        text-[10px]
        font-bold
        whitespace-nowrap
        transition
        flex-shrink-0
        ${styles[type]}
      `}
    >
      {label}

      <span
        className={`
          min-w-5
          h-5
          px-1.5
          rounded-full
          flex
          items-center
          justify-center
          text-[9px]
          ${active ? "bg-white/20" : "bg-gray-100 text-gray-600"}
        `}
      >
        {count}
      </span>
    </button>
  );
};

/* =========================================================
   DETAIL SECTION
========================================================= */

const DetailSection = ({ title, children }) => (
  <section className="mb-5">
    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">
      {title}
    </h3>

    {children}
  </section>
);

/* =========================================================
   DETAIL ITEM
========================================================= */

const DetailItem = ({ label, value }) => (
  <div
    className="
      p-3
      rounded-xl
      bg-gray-50
      border
      border-gray-100
      min-w-0
    "
  >
    <p className="text-[9px] uppercase tracking-wide font-bold text-gray-400">
      {label}
    </p>

    <p className="text-xs font-semibold text-gray-800 mt-1 break-words">
      {value}
    </p>
  </div>
);

/* =========================================================
   DETAIL TEXT
========================================================= */

const DetailText = ({ text }) => (
  <div
    className="
      p-4
      rounded-2xl
      bg-gray-50
      border
      border-gray-100
    "
  >
    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
      {text}
    </p>
  </div>
);

/* =========================================================
   AI CLASSIFICATION CARD
========================================================= */

const AIClassificationCard = ({ label, value, icon }) => {
  const normalized = String(value || "").toLowerCase();

  let style = "bg-gray-50 border-gray-100 text-gray-700";

  if (normalized === "high" || normalized === "inconsistent") {
    style = "bg-red-50 border-red-100 text-red-700";
  }

  if (normalized === "medium" || normalized === "partially consistent") {
    style = "bg-amber-50 border-amber-100 text-amber-700";
  }

  if (
    normalized === "low" ||
    normalized === "relevant" ||
    normalized === "consistent"
  ) {
    style = "bg-green-50 border-green-100 text-green-700";
  }

  return (
    <div
      className={`
        p-3
        rounded-2xl
        border
        ${style}
      `}
    >
      <div className="flex items-center gap-2">
        {icon}

        <span className="text-[9px] uppercase tracking-wide font-bold opacity-70">
          {label}
        </span>
      </div>

      <p className="text-sm font-extrabold mt-2 break-words">
        {value || "Not Available"}
      </p>
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ title, value, icon, type }) => {
  const styles = {
    total: {
      icon: "bg-gray-100 text-gray-700",
      number: "text-gray-900",
      line: "bg-gray-400",
    },

    pending: {
      icon: "bg-amber-50 text-amber-600",
      number: "text-amber-600",
      line: "bg-amber-500",
    },

    accepted: {
      icon: "bg-green-50 text-green-600",
      number: "text-green-600",
      line: "bg-green-500",
    },

    rejected: {
      icon: "bg-red-50 text-red-600",
      number: "text-red-600",
      line: "bg-red-500",
    },
  };

  const s = styles[type];

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 22,
      }}
      className="
        relative
        overflow-hidden
        bg-white
        border
        border-gray-100
        rounded-2xl
        sm:rounded-3xl
        p-4
        sm:p-5
        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-400 truncate">
            {title}
          </p>

          <p
            className={`
              text-2xl
              sm:text-3xl
              font-extrabold
              tracking-tight
              mt-2
              sm:mt-3
              ${s.number}
            `}
          >
            {value}
          </p>
        </div>

        <div
          className={`
            w-9
            h-9
            sm:w-10
            sm:h-10
            rounded-xl
            flex
            items-center
            justify-center
            flex-shrink-0
            ${s.icon}
          `}
        >
          {icon}
        </div>
      </div>

      <div
        className={`
          mt-4
          sm:mt-5
          h-1
          w-10
          rounded-full
          ${s.line}
        `}
      />
    </motion.div>
  );
};

/* =========================================================
   LOADING
========================================================= */

const LoadingState = () => (
  <div className="py-16 sm:py-20">
    <div className="flex flex-col items-center justify-center">
      <div
        className="
          w-10
          h-10
          rounded-full
          border-[3px]
          border-green-500
          border-t-transparent
          animate-spin
        "
      />

      <p
        className="
          text-sm
          font-medium
          text-gray-500
          mt-4
        "
      >
        Loading reports...
      </p>
    </div>
  </div>
);

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = () => (
  <div className="py-16 sm:py-20 text-center px-4">
    <div
      className="
        w-14
        h-14
        mx-auto
        rounded-2xl
        bg-gray-50
        border
        border-gray-100
        flex
        items-center
        justify-center
        text-gray-300
        mb-4
      "
    >
      <FileWarning size={24} />
    </div>

    <p
      className="
        text-sm
        font-bold
        text-gray-700
      "
    >
      No reports found
    </p>

    <p
      className="
        text-xs
        text-gray-400
        mt-1
        max-w-sm
        mx-auto
      "
    >
      Try adjusting your search filters or check again later.
    </p>
  </div>
);

export default ReportPage;
