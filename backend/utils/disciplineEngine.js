export const getDisciplineAction = ({ offenseCount, hasHigh, hasMedium, offense }) => {
  const o = (offense || "").toLowerCase();

  if (offenseCount >= 5 || hasHigh >= 2) {
    return {
      level: "High",
      action: "Suspension",
      status: "auto-escalated",
    };
  }

  if (offenseCount >= 3) {
    return {
      level: "Medium",
      action: "Detention",
      status: "watchlist",
    };
  }

  if (o.includes("fighting") || o.includes("assault")) {
    return {
      level: "High",
      action: "Suspension",
      status: "critical offense",
    };
  }

  if (o.includes("bullying")) {
    return {
      level: "Medium",
      action: "Detention",
      status: "behavior correction",
    };
  }

  return {
    level: "Low",
    action: "Warning",
    status: "first offense",
  };
};