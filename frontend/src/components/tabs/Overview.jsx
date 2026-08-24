import React, { memo, useEffect, useMemo, useState } from "react";
import { API } from "../../lib/api";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  FileWarning,
} from "lucide-react";

/* =========================================================
   MAIN
========================================================= */

const Overview = () => {
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [reportRes, incidentRes] = await Promise.all([
          API.get("/api/reports"),
          API.get("/api/incidents"),
        ]);

        setReports(reportRes.data?.reports || reportRes.data || []);
        setIncidents(incidentRes.data || []);
      } catch (err) {
        console.error("Overview fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* =========================================================
     MONTHLY INCIDENTS
  ========================================================= */

  const monthlyIncidents = useMemo(() => {
    const map = {};

    incidents.forEach((incident) => {
      if (!incident.createdAt) return;

      const date = new Date(incident.createdAt);

      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (!map[key]) {
        map[key] = {
          month: date.toLocaleString("en-US", {
            month: "short",
            year: "numeric",
          }),
          count: 0,
          date,
        };
      }

      map[key].count++;
    });

    const sorted = Object.values(map).sort((a, b) => a.date - b.date);

    return sorted.map((item, index) => {
      const previous = sorted[index - 1]?.count;

      return {
        ...item,
        change:
          previous === undefined
            ? "neutral"
            : item.count >= previous
              ? "up"
              : "down",
      };
    });
  }, [incidents]);

  /* =========================================================
     OFFENSE STATS
  ========================================================= */

  const offenseStats = useMemo(() => {
    const total = reports.length;

    const counts = {
      Minor: 0,
      Moderate: 0,
      Major: 0,
    };

    reports.forEach((report) => {
      const level = report.level || "Minor";

      if (level === "High") {
        counts.Major++;
      } else if (level === "Medium") {
        counts.Moderate++;
      } else {
        counts.Minor++;
      }
    });

    return [
      {
        label: "Minor",
        count: counts.Minor,
        percentage: total ? (counts.Minor / total) * 100 : 0,
        color: "green",
      },
      {
        label: "Moderate",
        count: counts.Moderate,
        percentage: total ? (counts.Moderate / total) * 100 : 0,
        color: "amber",
      },
      {
        label: "Major",
        count: counts.Major,
        percentage: total ? (counts.Major / total) * 100 : 0,
        color: "red",
      },
    ];
  }, [reports]);

  /* =========================================================
     RISK DISTRIBUTION
  ========================================================= */

  const riskDistribution = useMemo(() => {
    const counts = {
      High: 0,
      Medium: 0,
      Low: 0,
    };

    incidents.forEach((incident) => {
      const level = incident.level || "Low";

      if (level === "High") {
        counts.High++;
      } else if (level === "Medium") {
        counts.Medium++;
      } else {
        counts.Low++;
      }
    });

    return [
      {
        label: "High Risk",
        count: counts.High,
        type: "high",
        icon: <AlertTriangle size={18} />,
      },
      {
        label: "Medium Risk",
        count: counts.Medium,
        type: "medium",
        icon: <Activity size={18} />,
      },
      {
        label: "Low Risk",
        count: counts.Low,
        type: "low",
        icon: <ShieldCheck size={18} />,
      },
    ];
  }, [incidents]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalReports = reports.length;
  const totalIncidents = incidents.length;

  const highRisk = riskDistribution.find(
    (item) => item.type === "high",
  )?.count;

  const lowRisk = riskDistribution.find(
    (item) => item.type === "low",
  )?.count;

  /* =========================================================
     SKELETON
  ========================================================= */

  const Skeleton = ({ className = "" }) => (
    <div
      className={`animate-pulse bg-gray-100 rounded-2xl ${className}`}
    />
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-full bg-[#F7F9F8] text-gray-900">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="px-6 md:px-10 pt-7 pb-5">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>Reports</span>
          <ChevronRight size={12} />
          <span className="text-green-600 font-medium">
            Overview
          </span>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
              Overview Analytics
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              System insights, incident activity, and risk breakdown.
            </p>
          </div>

          <div className="hidden sm:flex w-11 h-11 rounded-xl bg-white border border-gray-200 items-center justify-center text-green-600">
            <BarChart3 size={19} />
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="px-6 md:px-10 pb-10 space-y-6">
        {/* ===================================================
            SUMMARY CARDS
        =================================================== */}

        <section>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              <>
                <Skeleton className="h-[118px]" />
                <Skeleton className="h-[118px]" />
                <Skeleton className="h-[118px]" />
                <Skeleton className="h-[118px]" />
              </>
            ) : (
              <>
                <SummaryCard
                  label="Total Reports"
                  value={totalReports}
                  icon={<FileWarning size={18} />}
                  type="neutral"
                  description="Submitted reports"
                />

                <SummaryCard
                  label="Total Incidents"
                  value={totalIncidents}
                  icon={<Activity size={18} />}
                  type="green"
                  description="Recorded incidents"
                />

                <SummaryCard
                  label="High Risk"
                  value={highRisk || 0}
                  icon={<AlertTriangle size={18} />}
                  type="red"
                  description="Requires attention"
                />

                <SummaryCard
                  label="Low Risk"
                  value={lowRisk || 0}
                  icon={<ShieldCheck size={18} />}
                  type="green"
                  description="Currently low risk"
                />
              </>
            )}
          </div>
        </section>

        {/* ===================================================
            MAIN ANALYTICS
        =================================================== */}

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Analytics
              </h3>

              <p className="text-xs text-gray-400 mt-0.5">
                Monitor incident trends and behavioral risk levels
              </p>
            </div>

            <Activity size={18} className="text-gray-300" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* =================================================
                MONTHLY INCIDENTS
            ================================================= */}

            <AnalyticsCard
              title="Monthly Incidents"
              subtitle="Incident activity over time"
              icon={<Activity size={17} />}
            >
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : monthlyIncidents.length === 0 ? (
                <EmptyState
                  icon={<Activity size={21} />}
                  title="No incident data"
                  description="Incident activity will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {monthlyIncidents.map((item) => (
                    <div
                      key={item.month}
                      className="
                        flex
                        items-center
                        justify-between
                        px-4
                        py-3
                        rounded-2xl
                        bg-gray-50
                        border
                        border-gray-100
                        hover:bg-white
                        hover:shadow-sm
                        transition
                      "
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                          <Activity size={16} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {item.month}
                          </p>

                          <p className="text-[10px] text-gray-400">
                            Recorded incidents
                          </p>
                        </div>
                      </div>

                      <div
                        className={`
                          flex
                          items-center
                          gap-1
                          px-2.5
                          py-1
                          rounded-lg
                          text-xs
                          font-bold
                          ${
                            item.change === "up"
                              ? "bg-red-50 text-red-600"
                              : item.change === "down"
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-100 text-gray-500"
                          }
                        `}
                      >
                        {item.change === "up" && (
                          <TrendingUp size={13} />
                        )}

                        {item.change === "down" && (
                          <TrendingDown size={13} />
                        )}

                        {item.change === "neutral" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        )}

                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnalyticsCard>

            {/* =================================================
                OFFENSE BREAKDOWN
            ================================================= */}

            <AnalyticsCard
              title="Offense Breakdown"
              subtitle="Distribution of reported offense severity"
              icon={<BarChart3 size={17} />}
            >
              {loading ? (
                <div className="space-y-6">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
              ) : (
                <div className="space-y-6">
                  {offenseStats.map((offense) => (
                    <div key={offense.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`
                              w-2 h-2 rounded-full
                              ${
                                offense.color === "green"
                                  ? "bg-green-500"
                                  : offense.color === "amber"
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }
                            `}
                          />

                          <span className="text-xs font-semibold text-gray-600">
                            {offense.label}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-gray-800">
                          {offense.count}
                        </span>
                      </div>

                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`
                            h-full
                            rounded-full
                            transition-all
                            duration-700
                            ${
                              offense.color === "green"
                                ? "bg-green-500"
                                : offense.color === "amber"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }
                          `}
                          style={{
                            width: `${Math.max(
                              offense.percentage,
                              offense.count > 0 ? 3 : 0,
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="text-[10px] text-gray-400 mt-1">
                        {offense.percentage.toFixed(1)}% of all reports
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </AnalyticsCard>
          </div>
        </section>

        {/* ===================================================
            RISK DISTRIBUTION
        =================================================== */}

        <section>
          <AnalyticsCard
            title="Risk Distribution"
            subtitle="Current behavioral risk classification"
            icon={<ShieldCheck size={17} />}
          >
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {riskDistribution.map((risk) => (
                  <RiskCard
                    key={risk.label}
                    label={risk.label}
                    count={risk.count}
                    type={risk.type}
                    icon={risk.icon}
                  />
                ))}
              </div>
            )}
          </AnalyticsCard>
        </section>

        {/* ===================================================
            INSIGHT
        =================================================== */}

        {!loading && (
          <section>
            <div
              className="
                relative
                overflow-hidden
                bg-gradient-to-br
                from-[#14532D]
                via-[#166534]
                to-[#15803D]
                rounded-3xl
                p-6
                text-white
                shadow-[0_12px_40px_rgba(21,128,61,0.12)]
              "
            >
              <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />

              <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-green-300/10 blur-3xl" />

              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                    <BarChart3 size={19} />
                  </div>

                  <h3 className="text-lg font-bold">
                    Analytics Summary
                  </h3>

                  <p className="text-sm text-green-100 mt-1 max-w-2xl leading-relaxed">
                    The system currently has{" "}
                    <span className="font-bold text-white">
                      {totalReports}
                    </span>{" "}
                    reports and{" "}
                    <span className="font-bold text-white">
                      {totalIncidents}
                    </span>{" "}
                    recorded incidents.{" "}
                    {highRisk > 0
                      ? `${highRisk} high-risk incident${
                          highRisk > 1 ? "s" : ""
                        } currently require attention.`
                      : "No high-risk incidents are currently recorded."}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-green-100 font-bold">
                      System Status
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-300" />

                      <span className="text-sm font-semibold">
                        Analytics Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  label,
  value,
  icon,
  type,
  description,
}) => {
  const styles = {
    neutral: {
      icon: "bg-gray-100 text-gray-700",
      number: "text-gray-900",
      line: "bg-gray-400",
    },
    green: {
      icon: "bg-green-50 text-green-600",
      number: "text-green-600",
      line: "bg-green-500",
    },
    red: {
      icon: "bg-red-50 text-red-600",
      number: "text-red-600",
      line: "bg-red-500",
    },
  };

  const style = styles[type];

  return (
    <div
      className="
        relative
        overflow-hidden
        bg-white
        border
        border-gray-100
        rounded-3xl
        p-5
        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
        hover:shadow-md
        transition
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400">
            {label}
          </p>

          <p
            className={`text-3xl font-extrabold tracking-tight mt-3 ${style.number}`}
          >
            {value}
          </p>

          <p className="text-[10px] text-gray-400 mt-1">
            {description}
          </p>
        </div>

        <div
          className={`
            w-10
            h-10
            rounded-xl
            flex
            items-center
            justify-center
            ${style.icon}
          `}
        >
          {icon}
        </div>
      </div>

      <div
        className={`mt-4 h-1 w-10 rounded-full ${style.line}`}
      />
    </div>
  );
};

/* =========================================================
   ANALYTICS CARD
========================================================= */

const AnalyticsCard = ({
  title,
  subtitle,
  icon,
  children,
}) => (
  <div
    className="
      bg-white
      border
      border-gray-100
      rounded-3xl
      p-5
      shadow-[0_4px_24px_rgba(0,0,0,0.025)]
    "
  >
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="font-bold text-sm text-gray-900">
          {title}
        </h3>

        <p className="text-[11px] text-gray-400 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
        {icon}
      </div>
    </div>

    {children}
  </div>
);

/* =========================================================
   RISK CARD
========================================================= */

const RiskCard = ({
  label,
  count,
  type,
  icon,
}) => {
  const styles = {
    high: {
      wrapper: "bg-red-50/60 border-red-100",
      icon: "bg-red-100 text-red-600",
      number: "text-red-600",
      dot: "bg-red-500",
    },
    medium: {
      wrapper: "bg-amber-50/60 border-amber-100",
      icon: "bg-amber-100 text-amber-600",
      number: "text-amber-600",
      dot: "bg-amber-500",
    },
    low: {
      wrapper: "bg-green-50/60 border-green-100",
      icon: "bg-green-100 text-green-600",
      number: "text-green-600",
      dot: "bg-green-500",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`
        rounded-2xl
        border
        p-4
        ${style.wrapper}
        transition
        hover:shadow-sm
      `}
    >
      <div className="flex items-start justify-between">
        <div
          className={`
            w-9
            h-9
            rounded-xl
            flex
            items-center
            justify-center
            ${style.icon}
          `}
        >
          {icon}
        </div>

        <span
          className={`w-2 h-2 rounded-full ${style.dot}`}
        />
      </div>

      <p
        className={`
          text-3xl
          font-extrabold
          tracking-tight
          mt-5
          ${style.number}
        `}
      >
        {count}
      </p>

      <p className="text-xs font-semibold text-gray-600 mt-1">
        {label}
      </p>
    </div>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({
  icon,
  title,
  description,
}) => (
  <div className="py-10 text-center">
    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-300">
      {icon}
    </div>

    <p className="text-sm font-semibold text-gray-700">
      {title}
    </p>

    <p className="text-xs text-gray-400 mt-1">
      {description}
    </p>
  </div>
);

export default memo(Overview);