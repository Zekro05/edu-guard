// src/components/NavButton.jsx
const NavButton = ({ icon, label, onClick, active=false, disabled=false }) => (
  <button
    onClick={disabled ? undefined : onClick}
    className={`flex items-center gap-1 px-4 py-2 text-sm rounded transition ${
      disabled
        ? "text-gray-400 cursor-not-allowed"
        : active
        ? "bg-green-100 text-green-700 font-semibold shadow-inner"
        : "hover:bg-gray-100 text-gray-700"
    }`}
  >
    <span>{icon}</span> {label}
  </button>
);

export default NavButton;
