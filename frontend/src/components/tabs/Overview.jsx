import React from "react";

const Overview = () => {
  // Example data
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

  return (
    <div className="flex flex-col gap-6">

      {/* Monthly Incidents */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4">Monthly Incidents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {monthlyIncidents.map((item) => (
            <div
              key={item.month}
              className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 shadow-sm"
            >
              <span className="font-medium">{item.month}</span>
              <span
                className={`text-sm font-semibold ${
                  item.change === "up" ? "text-red-600" : "text-green-600"
                }`}
              >
                {item.change === "up" ? "↑" : "↓"} {item.count} incidents
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Offense Distribution */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4">Offense Statistics</h3>
        <div className="space-y-3">
          {offenseStats.map((offense) => (
            <div key={offense.label} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{offense.label}</span>
                <span className="text-sm font-medium">{offense.count} incidents</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full">
                <div
                  className={`h-3 rounded-full ${
                    offense.color === "green"
                      ? "bg-green-500"
                      : offense.color === "yellow"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${offense.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4">Student Risk Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskDistribution.map((risk) => (
            <div
              key={risk.risk}
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 shadow-sm bg-white"
            >
              <div
                className={`text-white text-2xl font-bold mb-2 w-12 h-12 flex items-center justify-center rounded-full ${
                  risk.color === "red"
                    ? "bg-red-500"
                    : risk.color === "yellow"
                    ? "bg-yellow-400"
                    : "bg-green-500"
                }`}
              >
                {risk.count}
              </div>
              <span className="text-gray-700 font-medium">{risk.risk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;