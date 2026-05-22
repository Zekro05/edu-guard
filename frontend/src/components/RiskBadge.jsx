const RiskBadge = ({ level }) => {
  const styles = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-orange-100 text-orange-700",
    High: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[level] || "bg-gray-100 text-gray-600"
      }`}
    >
      {level || "Unknown"}
    </span>
  );
};

export default RiskBadge;
