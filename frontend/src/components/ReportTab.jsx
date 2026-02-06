// src/components/ReportTab.jsx
const ReportTab = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium transition ${
      active ? "bg-white text-green-700" : "bg-green-700 text-white hover:bg-green-600"
    }`}
  >
    <span>{icon}</span> {label}
  </button>
);

export default ReportTab;
