import React, { memo } from "react";
import { Smartphone } from "lucide-react";

/* ================= STATUS BADGE ================= */
const StatusBadge = memo(({ status }) => {
  const styles = {
    pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30",
    accepted: "bg-green-500/20 text-green-300 border border-green-400/30",
    rejected: "bg-red-500/20 text-red-300 border border-red-400/30",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
});

/* ================= INFO BLOCK ================= */
const Info = memo(({ label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm text-gray-200 font-medium">
      {value || "N/A"}
    </p>
  </div>
));

/* ================= MAIN CARD ================= */
const MobileReport = ({ report, onAccept, onReject }) => {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 transition">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-green-400">
            <Smartphone size={20} />
            Mobile Incident Report
          </h3>
          <p className="text-xs text-gray-400">
            Submitted via mobile device
          </p>
        </div>

        <StatusBadge status={report.status} />
      </div>

      {/* INFO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Info label="Student" value={report.studentName} />
        <Info label="Offense" value={report.offense} />
        <Info label="Location" value={report.location} />
        <Info label="Date" value={report.date} />
        <Info label="Time" value={report.time} />
        <Info label="Reporter" value={report.reporter} />
      </div>

      {/* DESCRIPTION */}
      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-1">Description</p>
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-gray-200">
          {report.description || "No description provided."}
        </div>
      </div>

      {/* ACTIONS */}
      {report.status === "pending" && (
        <div className="mt-6 flex gap-3">

          <button
            onClick={() => onAccept(report._id)}
            className="flex-1 py-2 rounded-xl bg-green-500/80 hover:bg-green-500 text-white font-medium transition"
          >
            Accept
          </button>

          <button
            onClick={() => onReject(report._id)}
            className="flex-1 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium transition"
          >
            Reject
          </button>

        </div>
      )}
    </div>
  );
};

export default memo(MobileReport);