import React, { memo } from "react";

/* STATIC DATA OUTSIDE COMPONENT (IMPORTANT PERF FIX) */
const monthlyIncidents = [
  { month: "January", change: "up", count: 10 },
  { month: "February", change: "down", count: 7 },
  { month: "March", change: "down", count: 5 },
  { month: "April", change: "up", count: 12 },
];

const offenseStats = [
  { label: "Minor Offenses", count: 57, percentage: 45, color: "green" },
  { label: "Moderate Offenses", count: 29, percentage: 30, color: "yellow" },
  { label: "Major Offenses", count: 15, percentage: 25, color: "red" },
];

const riskDistribution = [
  { risk: "High Risk", count: 12, color: "red" },
  { risk: "Medium Risk", count: 28, color: "yellow" },
  { risk: "Low Risk", count: 50, color: "green" },
];

/* ================= MAIN ================= */
const Overview = () => {
  return (
    <div className="flex flex-col gap-6 text-white">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold">Overview Analytics</h2>
        <p className="text-sm text-gray-400">
          System insights and risk breakdown
        </p>
      </div>

      {/* MONTHLY INCIDENTS */}
      <Card title="Monthly Incidents">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {monthlyIncidents.map((item) => (
            <div
              key={item.month}
              className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <span className="text-sm font-medium">{item.month}</span>

              <span
                className={`text-sm font-semibold ${
                  item.change === "up"
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {item.change === "up" ? "↑" : "↓"} {item.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* OFFENSE STATS */}
      <Card title="Offense Breakdown">
        <div className="space-y-4">
          {offenseStats.map((o) => (
            <div key={o.label}>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>{o.label}</span>
                <span>{o.count}</span>
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    o.color === "green"
                      ? "bg-green-500"
                      : o.color === "yellow"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${o.percentage}%` }}
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
              key={r.risk}
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
            >
              <div
                className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center font-bold ${
                  r.color === "red"
                    ? "bg-red-500/20 text-red-400"
                    : r.color === "yellow"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {r.count}
              </div>

              <p className="text-xs text-gray-300">{r.risk}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default memo(Overview);

/* ================= CARD ================= */
const Card = memo(({ title, children }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
    <h3 className="text-sm font-semibold text-green-400 mb-4">
      {title}
    </h3>
    {children}
  </div>
));