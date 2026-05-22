// src/components/ReportCard.jsx
const ReportCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="font-semibold text-lg mb-4">{title}</h3>
    {children}
  </div>
);

export default ReportCard;
