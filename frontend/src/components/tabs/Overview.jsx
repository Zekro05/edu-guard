import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  ChevronRight,
  CircleDot,
} from "lucide-react";

import { API } from "../../lib/api";

/* =========================================================
   HELPERS
========================================================= */

const getDateValue = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
  });

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/* =========================================================
   SKELETON
========================================================= */

const Skeleton = memo(function Skeleton({
  className = "",
  darkMode = false,
}) {
  return (
    <div
      className={`animate-pulse rounded-xl ${
        darkMode ? "bg-gray-800" : "bg-gray-200"
      } ${className}`}
    />
  );
});

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  darkMode,
}) {
  return (
    <div
      className={`
        group
        rounded-2xl
        border
        p-4
        sm:p-5
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:shadow-lg
        ${
          darkMode
            ? "border-gray-700/70 bg-gray-50 hover:border-gray-600 shadow-black/10"
            : "border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.025)]"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} strokeWidth={2} />
        </div>

        <Activity
          size={16}
          className={
            darkMode ? "text-gray-700" : "text-gray-200"
          }
        />
      </div>

      <p
        className={`
          mt-4 sm:mt-5
          text-[9px] sm:text-[10px]
          font-extrabold
          uppercase
          tracking-[0.14em]
          ${
            darkMode
              ? "text-gray-500"
              : "text-gray-400"
          }
        `}
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          text-2xl sm:text-3xl
          font-extrabold
          tracking-tight
          ${
            darkMode
              ? "text-white"
              : "text-gray-900"
          }
        `}
      >
        {value}
      </p>

      <p
        className={`
          mt-2
          text-[11px] sm:text-xs
          leading-5
          ${
            darkMode
              ? "text-gray-500"
              : "text-gray-400"
          }
        `}
      >
        {description}
      </p>
    </div>
  );
});

/* =========================================================
   SECTION TITLE
========================================================= */

const SectionTitle = memo(function SectionTitle({
  eyebrow,
  title,
  description,
  darkMode,
}) {
  return (
    <div className="min-w-0">
      <p
        className={`
          text-[9px] sm:text-[10px]
          font-extrabold
          uppercase
          tracking-[0.16em]
          ${
            darkMode
              ? "text-green-400"
              : "text-green-700"
          }
        `}
      >
        {eyebrow}
      </p>

      <h2
        className={`
          mt-1
          text-lg sm:text-xl
          font-extrabold
          tracking-tight
          ${
            darkMode
              ? "text-white"
              : "text-gray-900"
          }
        `}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`
            mt-1
            text-[11px] sm:text-xs
            leading-5
            ${
              darkMode
                ? "text-gray-500"
                : "text-gray-400"
            }
          `}
        >
          {description}
        </p>
      )}
    </div>
  );
});

/* =========================================================
   PANEL
========================================================= */

const Panel = memo(function Panel({
  children,
  className = "",
  darkMode,
}) {
  return (
    <section
      className={`
        min-w-0
        rounded-2xl
        sm:rounded-3xl
        border
        overflow-hidden
        ${
          darkMode
            ? "border-gray-700/70 bg-gray-50 shadow-black/10"
            : "border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.025)]"
        }
        ${className}
      `}
    >
      {children}
    </section>
  );
});

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({ darkMode = false }) {
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  /*
   * ReportPage owns the theme.
   * Overview only consumes the darkMode prop so the page
   * stays synchronized with the ReportPage appearance toggle.
   */

  /* =========================================================
     FETCH DATA
  ========================================================= */

  const fetchData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          studentsResponse,
          reportsResponse,
          incidentsResponse,
        ] = await Promise.all([
          API.get("/api/students"),
          API.get("/api/reports"),
          API.get("/api/incidents"),
        ]);

        const studentData =
          studentsResponse?.data;

        const reportData =
          reportsResponse?.data;

        const incidentData =
          incidentsResponse?.data;

        const normalizedStudents =
          Array.isArray(studentData)
            ? studentData
            : Array.isArray(
                studentData?.students,
              )
            ? studentData.students
            : [];

        const normalizedReports =
          Array.isArray(reportData)
            ? reportData
            : Array.isArray(
                reportData?.reports,
              )
            ? reportData.reports
            : [];

        const normalizedIncidents =
          Array.isArray(incidentData)
            ? incidentData
            : Array.isArray(
                incidentData?.incidents,
              )
            ? incidentData.incidents
            : [];

        setStudents(normalizedStudents);
        setReports(normalizedReports);
        setIncidents(normalizedIncidents);
        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Overview fetch error:",
          error,
        );

        setStudents([]);
        setReports([]);
        setIncidents([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const totalReports = reports.length;

    const totalIncidents =
      incidents.length;

    const pendingReports =
      reports.filter(
        (report) =>
          String(
            report?.status || "",
          ).toLowerCase() === "pending",
      ).length;

    const acceptedReports =
      reports.filter(
        (report) =>
          String(
            report?.status || "",
          ).toLowerCase() === "accepted",
      ).length;

    const rejectedReports =
      reports.filter(
        (report) =>
          String(
            report?.status || "",
          ).toLowerCase() === "rejected",
      ).length;

    /*
     * Risk is calculated the same way as DashboardPage: by the
     * student's total recorded incidents. This keeps the Overview
     * distribution consistent with the main dashboard.
     *
     * High   = 5+ incidents
     * Medium = 2-4 incidents
     * Low    = 0-1 incidents
     */
    const getStudentRisk = (student) => {
      const count = Number(student?.totalIncidents || 0);

      if (count >= 5) return "High";
      if (count >= 2) return "Medium";

      return "Low";
    };

    const totalStudents = students.length;

    const highRisk = students.filter(
      (student) => getStudentRisk(student) === "High",
    ).length;

    const mediumRisk = students.filter(
      (student) => getStudentRisk(student) === "Medium",
    ).length;

    const lowRisk = students.filter(
      (student) => getStudentRisk(student) === "Low",
    ).length;

    return {
      totalStudents,
      totalReports,
      totalIncidents,
      pendingReports,
      acceptedReports,
      rejectedReports,
      highRisk,
      mediumRisk,
      lowRisk,
    };
  }, [students, reports, incidents]);

  /* =========================================================
     MONTHLY INCIDENTS
  ========================================================= */

  const monthlyIncidents = useMemo(() => {
    const now = new Date();

    const months = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
      );

      months.push({
        key: getMonthKey(date),
        label: getMonthLabel(date),
        value: 0,
      });
    }

    const monthMap = new Map(
      months.map((month) => [
        month.key,
        month,
      ]),
    );

    incidents.forEach((incident) => {
      const date = getDateValue(
        incident?.createdAt ||
          incident?.date ||
          incident?.incidentDate,
      );

      if (!date) return;

      const month = monthMap.get(
        getMonthKey(date),
      );

      if (month) {
        month.value += 1;
      }
    });

    return months;
  }, [incidents]);

  /* =========================================================
     OFFENSE STATISTICS
  ========================================================= */

  const offenseStats = useMemo(() => {
    const counts = {};

    incidents.forEach((incident) => {
      const offense =
        incident?.offense ||
        incident?.offenseType ||
        incident?.type ||
        "Other";

      const normalized =
        String(offense).trim() || "Other";

      counts[normalized] =
        (counts[normalized] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [incidents]);

  /* =========================================================
     RISK DISTRIBUTION
  ========================================================= */

  const riskDistribution = useMemo(
    () => [
      {
        label: "High Risk",
        value: summary.highRisk,
        icon: ShieldAlert,
        iconClass: darkMode
          ? "bg-red-500/10 text-red-400"
          : "bg-red-50 text-red-600",
        barClass: "bg-red-500",
      },
      {
        label: "Medium Risk",
        value: summary.mediumRisk,
        icon: AlertTriangle,
        iconClass: darkMode
          ? "bg-amber-500/10 text-amber-400"
          : "bg-amber-50 text-amber-600",
        barClass: "bg-amber-500",
      },
      {
        label: "Low Risk",
        value: summary.lowRisk,
        icon: CheckCircle2,
        iconClass: darkMode
          ? "bg-green-500/10 text-green-400"
          : "bg-green-50 text-green-600",
        barClass: "bg-green-500",
      },
    ],
    [summary, darkMode],
  );

  /* =========================================================
     TREND
  ========================================================= */

  const trend = useMemo(() => {
    if (monthlyIncidents.length < 2) {
      return 0;
    }

    const previous =
      monthlyIncidents[
        monthlyIncidents.length - 2
      ]?.value || 0;

    const current =
      monthlyIncidents[
        monthlyIncidents.length - 1
      ]?.value || 0;

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Math.round(
      ((current - previous) / previous) * 100,
    );
  }, [monthlyIncidents]);

  const maxMonthlyValue = useMemo(
    () =>
      Math.max(
        ...monthlyIncidents.map(
          (month) => month.value,
        ),
        1,
      ),
    [monthlyIncidents],
  );

  const maxOffenseValue = useMemo(
    () =>
      Math.max(
        ...offenseStats.map(
          (item) => item.value,
        ),
        1,
      ),
    [offenseStats],
  );

  /* =========================================================
     SYSTEM MESSAGE
  ========================================================= */

  const systemMessage = useMemo(() => {
    if (summary.highRisk > 0) {
      return {
        type: "warning",
        title:
          "High-risk incidents require attention",
        text: `${summary.highRisk} high-risk incident${
          summary.highRisk === 1
            ? ""
            : "s"
        } currently appear in the recorded data.`,
      };
    }

    if (summary.pendingReports > 0) {
      return {
        type: "info",
        title:
          "Reports are waiting for review",
        text: `${summary.pendingReports} report${
          summary.pendingReports === 1
            ? ""
            : "s"
        } currently have a pending status.`,
      };
    }

    return {
      type: "success",
      title:
        "System overview is up to date",
      text:
        "No immediate high-risk or pending-report indicators were detected.",
    };
  }, [summary]);

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div
        className={`
          min-h-screen
          w-full
          p-4
          sm:p-6
          lg:p-8
          transition-colors
          duration-300
          text-inherit
        `}
      >
        <div className="mx-auto max-w-7xl">
          <Skeleton
            darkMode={darkMode}
            className="h-9 w-52"
          />

          <Skeleton
            darkMode={darkMode}
            className="mt-3 h-4 w-80"
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton
              darkMode={darkMode}
              className="h-36"
            />

            <Skeleton
              darkMode={darkMode}
              className="h-36"
            />

            <Skeleton
              darkMode={darkMode}
              className="h-36"
            />

            <Skeleton
              darkMode={darkMode}
              className="h-36"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <Skeleton
              darkMode={darkMode}
              className="h-96"
            />

            <Skeleton
              darkMode={darkMode}
              className="h-96"
            />
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <div
      className={`
        relative
        min-h-screen
        w-full
        overflow-x-hidden
        transition-colors
        duration-300
        text-inherit
      `}
    >
      <div
        className={`
          relative
          z-10
          mx-auto
          max-w-7xl
          p-4
          sm:p-6
          lg:p-8
        `}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div
                className={`
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-xl
                  ${
                    darkMode
                      ? "bg-green-500/10 text-green-400"
                      : "bg-green-50 text-green-700"
                  }
                `}
              >
                <BarChart3 size={16} />
              </div>

              <span
                className={`
                  text-[9px]
                  sm:text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  ${
                    darkMode
                      ? "text-green-400"
                      : "text-green-700"
                  }
                `}
              >
                Guidance Analytics
              </span>
            </div>

            <h1
              className={`
                text-2xl
                sm:text-3xl
                font-extrabold
                tracking-tight
                ${
                  darkMode
                    ? "text-white"
                    : "text-gray-900"
                }
              `}
            >
              Overview
            </h1>

            <p
              className={`
                mt-1
                max-w-2xl
                text-xs
                sm:text-sm
                leading-relaxed
                ${
                  darkMode
                    ? "text-gray-500"
                    : "text-gray-500"
                }
              `}
            >
              Monitor reports, incidents, risk
              levels, and recent guidance activity
              from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div
                className={`
                  hidden
                  sm:flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  px-3
                  py-2
                  ${
                    darkMode
                      ? "border-gray-700 bg-gray-800 text-gray-500"
                      : "border-gray-100 bg-white text-gray-400"
                  }
                `}
              >
                <Clock3 size={13} />

                <span className="text-[10px] font-medium">
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString(
                    [],
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={`
                flex
                h-10
                items-center
                gap-2
                rounded-xl
                border
                px-3.5
                text-xs
                font-semibold
                transition
                ${
                  darkMode
                    ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-750 hover:border-gray-600"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                }
              `}
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          </div>
        </div>

        {/* =====================================================
            SYSTEM STATUS
        ===================================================== */}

        <div
          className={`
            mt-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            p-4
            ${
              systemMessage.type ===
              "warning"
                ? darkMode
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-amber-100 bg-amber-50/60"
                : systemMessage.type ===
                  "info"
                ? darkMode
                  ? "border-gray-700 bg-gray-800/60"
                  : "border-gray-100 bg-gray-50"
                : darkMode
                ? "border-green-500/20 bg-green-500/5"
                : "border-green-100 bg-green-50/60"
            }
          `}
        >
          <div
            className={`
              mt-0.5
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-xl
              ${
                systemMessage.type ===
                "warning"
                  ? darkMode
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-amber-100 text-amber-600"
                  : systemMessage.type ===
                    "info"
                  ? darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                  : darkMode
                  ? "bg-green-500/10 text-green-400"
                  : "bg-green-100 text-green-600"
              }
            `}
          >
            {systemMessage.type ===
            "warning" ? (
              <AlertTriangle size={16} />
            ) : systemMessage.type ===
              "info" ? (
              <Clock3 size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
          </div>

          <div className="min-w-0">
            <p
              className={`
                text-xs
                sm:text-sm
                font-bold
                ${
                  darkMode
                    ? "text-gray-200"
                    : "text-gray-800"
                }
              `}
            >
              {systemMessage.title}
            </p>

            <p
              className={`
                mt-0.5
                text-[11px]
                sm:text-xs
                leading-5
                ${
                  darkMode
                    ? "text-gray-500"
                    : "text-gray-500"
                }
              `}
            >
              {systemMessage.text}
            </p>
          </div>
        </div>

        {/* =====================================================
            STAT CARDS
        ===================================================== */}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Total Reports"
            value={summary.totalReports}
            description="All recorded reports"
            darkMode={darkMode}
            iconClass={
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }
          />

          <StatCard
            icon={AlertTriangle}
            label="Pending Reports"
            value={summary.pendingReports}
            description="Reports awaiting review"
            darkMode={darkMode}
            iconClass={
              darkMode
                ? "bg-amber-500/10 text-amber-400"
                : "bg-amber-50 text-amber-600"
            }
          />

          <StatCard
            icon={ShieldAlert}
            label="High Risk"
            value={summary.highRisk}
            description="High or critical incidents"
            darkMode={darkMode}
            iconClass={
              darkMode
                ? "bg-red-500/10 text-red-400"
                : "bg-red-50 text-red-600"
            }
          />

          <StatCard
            icon={CheckCircle2}
            label="Accepted Reports"
            value={summary.acceptedReports}
            description="Reports accepted into records"
            darkMode={darkMode}
            iconClass={
              darkMode
                ? "bg-green-500/10 text-green-400"
                : "bg-green-50 text-green-700"
            }
          />
        </div>

        {/* =====================================================
            MAIN ANALYTICS
        ===================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          {/* MONTHLY TREND */}

          <Panel darkMode={darkMode}>
            <div
              className={`
                flex
                flex-col
                gap-3
                border-b
                p-5
                sm:flex-row
                sm:items-start
                sm:justify-between
                sm:p-6
                ${
                  darkMode
                    ? "border-gray-700"
                    : "border-gray-100"
                }
              `}
            >
              <SectionTitle
                eyebrow="Incident Activity"
                title="Monthly Incident Trend"
                description="Incident records across the last six months."
                darkMode={darkMode}
              />

              <div
                className={`
                  flex
                  w-fit
                  items-center
                  gap-2
                  rounded-xl
                  px-3
                  py-2
                  ${
                    darkMode
                      ? "bg-gray-700/60"
                      : "bg-gray-50"
                  }
                `}
              >
                <TrendingUp
                  size={14}
                  className={
                    trend >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                />

                <span
                  className={`
                    text-[11px]
                    font-bold
                    ${
                      trend >= 0
                        ? darkMode
                          ? "text-green-400"
                          : "text-green-700"
                        : darkMode
                        ? "text-red-400"
                        : "text-red-600"
                    }
                  `}
                >
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </span>

                <span
                  className={`
                    text-[10px]
                    ${
                      darkMode
                        ? "text-gray-500"
                        : "text-gray-400"
                    }
                  `}
                >
                  vs. previous month
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex h-64 items-end gap-2 sm:gap-4">
                {monthlyIncidents.map(
                  (month) => {
                    const height =
                      month.value === 0
                        ? 4
                        : Math.max(
                            (month.value /
                              maxMonthlyValue) *
                              100,
                            8,
                          );

                    return (
                      <div
                        key={month.key}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <div className="relative flex h-full w-full items-end justify-center">
                          {month.value > 0 && (
                            <span
                              className={`
                                absolute
                                bottom-[calc(${height}%+8px)]
                                text-[10px]
                                font-bold
                                ${
                                  darkMode
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }
                              `}
                              style={{
                                bottom: `calc(${height}% + 7px)`,
                              }}
                            >
                              {month.value}
                            </span>
                          )}

                          <div
                            className={`
                              w-full
                              max-w-12
                              rounded-t-xl
                              transition-all
                              duration-500
                              ${
                                month.value > 0
                                  ? darkMode
                                    ? "bg-green-500/80 hover:bg-green-500"
                                    : "bg-green-600 hover:bg-green-700"
                                  : darkMode
                                  ? "bg-gray-700"
                                  : "bg-gray-100"
                              }
                            `}
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span
                          className={`
                            text-[10px]
                            font-semibold
                            ${
                              darkMode
                                ? "text-gray-500"
                                : "text-gray-400"
                            }
                          `}
                        >
                          {month.label}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </Panel>

          {/* RISK DISTRIBUTION */}

          <Panel darkMode={darkMode}>
            <div
              className={`
                border-b
                p-5
                sm:p-6
                ${
                  darkMode
                    ? "border-gray-700"
                    : "border-gray-100"
                }
              `}
            >
              <SectionTitle
                eyebrow="Risk Monitoring"
                title="Risk Distribution"
                description="Current student risk distribution based on recorded incidents."
                darkMode={darkMode}
              />
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {riskDistribution.map(
                (item) => {
                  const Icon = item.icon;

                  const total =
                    summary.highRisk +
                    summary.mediumRisk +
                    summary.lowRisk;

                  const percentage =
                    total > 0
                      ? Math.round(
                          (item.value / total) *
                            100,
                        )
                      : 0;

                  return (
                    <div
                      key={item.label}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              ${item.iconClass}
                            `}
                          >
                            <Icon size={16} />
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`
                                truncate
                                text-xs
                                font-bold
                                ${
                                  darkMode
                                    ? "text-gray-200"
                                    : "text-gray-700"
                                }
                              `}
                            >
                              {item.label}
                            </p>

                            <p
                              className={`
                                mt-0.5
                                text-[10px]
                                ${
                                  darkMode
                                    ? "text-gray-500"
                                    : "text-gray-400"
                                }
                              `}
                            >
                              {percentage}% of
                              incidents
                            </p>
                          </div>
                        </div>

                        <span
                          className={`
                            text-lg
                            font-extrabold
                            ${
                              darkMode
                                ? "text-white"
                                : "text-gray-900"
                            }
                          `}
                        >
                          {item.value}
                        </span>
                      </div>

                      <div
                        className={`
                          mt-3
                          h-1.5
                          overflow-hidden
                          rounded-full
                          ${
                            darkMode
                              ? "bg-gray-700"
                              : "bg-gray-100"
                          }
                        `}
                      >
                        <div
                          className={`h-full rounded-full ${item.barClass}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )}

              {summary.totalStudents ===
                0 && (
                <div
                  className={`
                    rounded-xl
                    border
                    p-4
                    text-center
                    ${
                      darkMode
                        ? "border-gray-700 bg-gray-900/40"
                        : "border-gray-100 bg-gray-50"
                    }
                  `}
                >
                  <p
                    className={`
                      text-xs
                      ${
                        darkMode
                          ? "text-gray-500"
                          : "text-gray-400"
                      }
                    `}
                  >
                    No student risk data
                    available yet.
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* =====================================================
            LOWER ANALYTICS
        ===================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* TOP OFFENSES */}

          <Panel darkMode={darkMode}>
            <div
              className={`
                flex
                items-start
                justify-between
                gap-4
                border-b
                p-5
                sm:p-6
                ${
                  darkMode
                    ? "border-gray-700"
                    : "border-gray-100"
                }
              `}
            >
              <SectionTitle
                eyebrow="Incident Categories"
                title="Most Recorded Offenses"
                description="Top offense categories based on recorded incidents."
                darkMode={darkMode}
              />

              <div
                className={`
                  hidden
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  sm:flex
                  ${
                    darkMode
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-50 text-gray-400"
                  }
                `}
              >
                <BarChart3 size={16} />
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {offenseStats.length > 0 ? (
                <div className="space-y-4">
                  {offenseStats.map(
                    (item, index) => {
                      const percentage =
                        Math.round(
                          (item.value /
                            maxOffenseValue) *
                            100,
                        );

                      return (
                        <div
                          key={`${item.name}-${index}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`
                                  flex
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-lg
                                  text-[9px]
                                  font-bold
                                  ${
                                    darkMode
                                      ? "bg-gray-700 text-gray-400"
                                      : "bg-gray-100 text-gray-500"
                                  }
                                `}
                              >
                                {index + 1}
                              </span>

                              <span
                                className={`
                                  truncate
                                  text-xs
                                  font-semibold
                                  ${
                                    darkMode
                                      ? "text-gray-300"
                                      : "text-gray-700"
                                  }
                                `}
                                title={item.name}
                              >
                                {item.name}
                              </span>
                            </div>

                            <span
                              className={`
                                shrink-0
                                text-xs
                                font-bold
                                ${
                                  darkMode
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }
                              `}
                            >
                              {item.value}
                            </span>
                          </div>

                          <div
                            className={`
                              ml-[34px]
                              h-2
                              overflow-hidden
                              rounded-full
                              ${
                                darkMode
                                  ? "bg-gray-700"
                                  : "bg-gray-100"
                              }
                            `}
                          >
                            <div
                              className={`
                                h-full
                                rounded-full
                                transition-all
                                duration-500
                                ${
                                  darkMode
                                    ? "bg-green-500/80"
                                    : "bg-green-600"
                                }
                              `}
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <div
                  className={`
                    flex
                    min-h-52
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    ${
                      darkMode
                        ? "border-gray-700 bg-gray-900/40"
                        : "border-gray-100 bg-gray-50"
                    }
                  `}
                >
                  <FileText
                    size={24}
                    className={
                      darkMode
                        ? "text-gray-600"
                        : "text-gray-300"
                    }
                  />

                  <p
                    className={`
                      mt-3
                      text-xs
                      font-semibold
                      ${
                        darkMode
                          ? "text-gray-500"
                          : "text-gray-500"
                      }
                    `}
                  >
                    No offense data yet
                  </p>

                  <p
                    className={`
                      mt-1
                      text-[10px]
                      ${
                        darkMode
                          ? "text-gray-600"
                          : "text-gray-400"
                      }
                    `}
                  >
                    Recorded incidents will
                    appear here.
                  </p>
                </div>
              )}
            </div>
          </Panel>

          {/* REPORT STATUS */}

          <Panel darkMode={darkMode}>
            <div
              className={`
                border-b
                p-5
                sm:p-6
                ${
                  darkMode
                    ? "border-gray-700"
                    : "border-gray-100"
                }
              `}
            >
              <SectionTitle
                eyebrow="Report Management"
                title="Report Status"
                description="Current distribution of submitted reports."
                darkMode={darkMode}
              />
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`
                    rounded-2xl
                    border
                    p-4
                    ${
                      darkMode
                        ? "border-gray-700 bg-gray-900/40"
                        : "border-gray-100 bg-gray-50"
                    }
                  `}
                >
                  <div
                    className={`
                      mb-3
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        darkMode
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-amber-50 text-amber-600"
                      }
                    `}
                  >
                    <Clock3 size={15} />
                  </div>

                  <p
                    className={`
                      text-2xl
                      font-extrabold
                      ${
                        darkMode
                          ? "text-white"
                          : "text-gray-900"
                      }
                    `}
                  >
                    {summary.pendingReports}
                  </p>

                  <p
                    className={`
                      mt-1
                      text-[10px]
                      font-semibold
                      ${
                        darkMode
                          ? "text-gray-500"
                          : "text-gray-400"
                      }
                    `}
                  >
                    Pending
                  </p>
                </div>

                <div
                  className={`
                    rounded-2xl
                    border
                    p-4
                    ${
                      darkMode
                        ? "border-gray-700 bg-gray-900/40"
                        : "border-gray-100 bg-gray-50"
                    }
                  `}
                >
                  <div
                    className={`
                      mb-3
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        darkMode
                          ? "bg-green-500/10 text-green-400"
                          : "bg-green-50 text-green-600"
                      }
                    `}
                  >
                    <CheckCircle2 size={15} />
                  </div>

                  <p
                    className={`
                      text-2xl
                      font-extrabold
                      ${
                        darkMode
                          ? "text-white"
                          : "text-gray-900"
                      }
                    `}
                  >
                    {summary.acceptedReports}
                  </p>

                  <p
                    className={`
                      mt-1
                      text-[10px]
                      font-semibold
                      ${
                        darkMode
                          ? "text-gray-500"
                          : "text-gray-400"
                      }
                    `}
                  >
                    Accepted
                  </p>
                </div>

                <div
                  className={`
                    rounded-2xl
                    border
                    p-4
                    ${
                      darkMode
                        ? "border-gray-700 bg-gray-900/40"
                        : "border-gray-100 bg-gray-50"
                    }
                  `}
                >
                  <div
                    className={`
                      mb-3
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        darkMode
                          ? "bg-red-500/10 text-red-400"
                          : "bg-red-50 text-red-600"
                      }
                    `}
                  >
                    <AlertTriangle size={15} />
                  </div>

                  <p
                    className={`
                      text-2xl
                      font-extrabold
                      ${
                        darkMode
                          ? "text-white"
                          : "text-gray-900"
                      }
                    `}
                  >
                    {summary.rejectedReports}
                  </p>

                  <p
                    className={`
                      mt-1
                      text-[10px]
                      font-semibold
                      ${
                        darkMode
                          ? "text-gray-500"
                          : "text-gray-400"
                      }
                    `}
                  >
                    Rejected
                  </p>
                </div>
              </div>

              {/* REPORT SUMMARY BAR */}

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      ${
                        darkMode
                          ? "text-gray-500"
                          : "text-gray-400"
                      }
                    `}
                  >
                    Overall report distribution
                  </span>

                  <span
                    className={`
                      text-[10px]
                      font-semibold
                      ${
                        darkMode
                          ? "text-gray-500"
                          : "text-gray-400"
                      }
                    `}
                  >
                    {summary.totalReports} total
                  </span>
                </div>

                <div
                  className={`
                    flex
                    h-3
                    overflow-hidden
                    rounded-full
                    ${
                      darkMode
                        ? "bg-gray-700"
                        : "bg-gray-100"
                    }
                  `}
                >
                  {summary.totalReports >
                    0 && (
                    <>
                      <div
                        className="bg-green-500 transition-all"
                        style={{
                          width: `${
                            (summary.acceptedReports /
                              summary.totalReports) *
                            100
                          }%`,
                        }}
                      />

                      <div
                        className="bg-amber-400 transition-all"
                        style={{
                          width: `${
                            (summary.pendingReports /
                              summary.totalReports) *
                            100
                          }%`,
                        }}
                      />

                      <div
                        className="bg-red-500 transition-all"
                        style={{
                          width: `${
                            (summary.rejectedReports /
                              summary.totalReports) *
                            100
                          }%`,
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* QUICK INFO */}

              <div
                className={`
                  mt-6
                  rounded-2xl
                  border
                  p-4
                  ${
                    darkMode
                      ? "border-gray-700 bg-gray-900/40"
                      : "border-gray-100 bg-gray-50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        darkMode
                          ? "bg-gray-700 text-gray-400"
                          : "bg-white text-gray-500 border border-gray-100"
                      }
                    `}
                  >
                    <CircleDot size={15} />
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`
                        text-xs
                        font-bold
                        ${
                          darkMode
                            ? "text-gray-300"
                            : "text-gray-700"
                        }
                      `}
                    >
                      Incident records
                    </p>

                    <p
                      className={`
                        mt-1
                        text-[11px]
                        leading-5
                        ${
                          darkMode
                            ? "text-gray-500"
                            : "text-gray-400"
                        }
                      `}
                    >
                      {summary.totalIncidents}{" "}
                      incident
                      {summary.totalIncidents ===
                      1
                        ? ""
                        : "s"}{" "}
                      currently recorded in the
                      guidance management system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* =====================================================
            BOTTOM SUMMARY
        ===================================================== */}

        <div
          className={`
            mt-6
            rounded-2xl
            sm:rounded-3xl
            border
            p-4
            sm:p-5
            ${
              darkMode
                ? "border-gray-700/70 bg-gray-800/70"
                : "border-gray-100 bg-white"
            }
          `}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  ${
                    darkMode
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-50 text-gray-500"
                  }
                `}
              >
                <Users size={16} />
              </div>

              <div className="min-w-0">
                <p
                  className={`
                    text-xs
                    font-bold
                    ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-700"
                    }
                  `}
                >
                  Guidance Management Overview
                </p>

                <p
                  className={`
                    mt-0.5
                    text-[10px]
                    leading-5
                    ${
                      darkMode
                        ? "text-gray-500"
                        : "text-gray-400"
                    }
                  `}
                >
                  Review your latest report and
                  incident indicators above.
                </p>
              </div>
            </div>

            <div
              className={`
                flex
                items-center
                gap-1.5
                text-[10px]
                font-semibold
                ${
                  darkMode
                    ? "text-gray-600"
                    : "text-gray-400"
                }
              `}
            >
              <span>
                GuidEd Guidance System
              </span>

              <ChevronRight size={13} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;