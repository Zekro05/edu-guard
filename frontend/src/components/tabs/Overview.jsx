import React, { memo, useEffect, useMemo, useState } from "react";
import { API } from "../../store/authStore";

/* ================= MAIN ================= */
const Overview = () => {
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, incidentRes] = await Promise.all([
          API.get("/api/reports"),
          API.get("/api/incidents"),
        ]);

        setReports(reportRes.data?.reports || reportRes.data || []);
        setIncidents(incidentRes.data || []);
      } catch (err) {
        console.log("Overview fetch error:", err);
      }
    };

    fetchData();
  }, []);

  /* ================= MONTHLY INCIDENTS ================= */
  const monthlyIncidents = useMemo(() => {
    const map = {};

    incidents.forEach((i) => {
      const month = new Date(i.createdAt).toLocaleString("default", {
        month: "short",
      });

      map[month] = (map[month] || 0) + 1;
    });

    return Object.entries(map).map(([month, count], index, arr) => {
      const prev = arr[index - 1]?.[1] || 0;

      return {
        month,
        count,
        change: count >= prev ? "up" : "down",
      };
    });
  }, [incidents]);

  /* ================= OFFENSE STATS ================= */
  const offenseStats = useMemo(() => {
    const total = reports.length;

    const counts = { Minor: 0, Moderate: 0, Major: 0 };

    reports.forEach((r) => {
      const level = r.level || "Minor";

      if (level === "High") counts.Major++;
      else if (level === "Medium") counts.Moderate++;
      else counts.Minor++;
    });

    return [
      {
        label: "Minor",
        count: counts.Minor,
        percentage: total ? (counts.Minor / total) * 100 : 0,
        color: "#16a34a",
      },
      {
        label: "Moderate",
        count: counts.Moderate,
        percentage: total ? (counts.Moderate / total) * 100 : 0,
        color: "#f59e0b",
      },
      {
        label: "Major",
        count: counts.Major,
        percentage: total ? (counts.Major / total) * 100 : 0,
        color: "#dc2626",
      },
    ];
  }, [reports]);

  /* ================= RISK DISTRIBUTION ================= */
  const riskDistribution = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };

    incidents.forEach((i) => {
      const level = i.level || "Low";
      if (level === "High") counts.High++;
      else if (level === "Medium") counts.Medium++;
      else counts.Low++;
    });

    return [
      { label: "High Risk", count: counts.High, color: "#dc2626" },
      { label: "Medium Risk", count: counts.Medium, color: "#f59e0b" },
      { label: "Low Risk", count: counts.Low, color: "#16a34a" },
    ];
  }, [incidents]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Overview Analytics</h2>
        <p className="text-sm text-gray-500">
          System insights and risk breakdown
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MONTHLY INCIDENTS */}
        <Card title="Monthly Incidents">
          <div className="space-y-2">
            {monthlyIncidents.map((item) => (
              <div
                key={item.month}
                className="flex justify-between items-center bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm"
              >
                <span className="text-sm font-medium text-gray-700">
                  {item.month}
                </span>

                <span
                  className={`text-sm font-semibold ${
                    item.change === "up"
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {item.change === "up" ? "↑" : "↓"} {item.count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* OFFENSE BREAKDOWN */}
        <Card title="Offense Breakdown">
          <div className="space-y-4">
            {offenseStats.map((o) => (
              <div key={o.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{o.label}</span>
                  <span>{o.count}</span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${o.percentage}%`,
                      backgroundColor: o.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* RISK DISTRIBUTION */}
        <Card title="Risk Distribution">
          <div className="grid grid-cols-3 gap-3">
            {riskDistribution.map((r) => (
              <div
                key={r.label}
                className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm"
              >
                <div
                  className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: r.color }}
                >
                  {r.count}
                </div>

                <p className="text-xs text-gray-600">{r.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default memo(Overview);

/* ================= CARD ================= */
const Card = memo(({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-800 mb-4">
      {title}
    </h3>
    {children}
  </div>
));