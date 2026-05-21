import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  MapPin,
  Calendar,
  Clock3,
  User2,
  FileText,
  Check,
  X,
} from "lucide-react";

/* ================= STATUS BADGE ================= */
const StatusBadge = memo(({ status }) => {
  const styles = {
    pending:
      "bg-yellow-500/10 text-yellow-700 border border-yellow-200",
    accepted:
      "bg-emerald-500/10 text-emerald-700 border border-emerald-200",
    rejected:
      "bg-red-500/10 text-red-700 border border-red-200",
  };

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize backdrop-blur-xl ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </div>
  );
});

/* ================= INFO BLOCK ================= */
const Info = memo(({ icon, label, value }) => (
  <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">

    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
        {icon}
      </div>

      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </p>
    </div>

    <p className="text-sm font-semibold text-slate-800 break-words">
      {value || "N/A"}
    </p>

  </div>
));

/* ================= MAIN CARD ================= */
const MobileReport = ({ report, onAccept, onReject }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="
        relative overflow-hidden
        rounded-[30px]
        border border-white/50
        bg-white/65
        backdrop-blur-2xl
        shadow-[0_8px_40px_rgba(15,23,42,0.08)]
      "
    >

      {/* GLOW */}
      <div className="absolute top-0 right-0 w-52 h-52 bg-green-400/10 blur-3xl rounded-full" />

      <div className="relative z-10 p-7">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-7">

          <div className="flex items-start gap-4">

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="
                w-14 h-14 rounded-2xl
                bg-gradient-to-br from-green-500 to-emerald-700
                text-white
                flex items-center justify-center
                shadow-lg
              "
            >
              <Smartphone size={24} />
            </motion.div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Mobile Incident Report
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Submitted via student mobile application
              </p>

              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-500">
                  Real-time synchronized report
                </span>
              </div>
            </div>

          </div>

          <StatusBadge status={report.status} />

        </div>

        {/* ================= INFO GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          <Info
            icon={<User2 size={15} />}
            label="Student"
            value={report.studentName}
          />

          <Info
            icon={<FileText size={15} />}
            label="Offense"
            value={report.offense}
          />

          <Info
            icon={<MapPin size={15} />}
            label="Location"
            value={report.location}
          />

          <Info
            icon={<Calendar size={15} />}
            label="Date"
            value={report.date}
          />

          <Info
            icon={<Clock3 size={15} />}
            label="Time"
            value={report.time}
          />

          <Info
            icon={<User2 size={15} />}
            label="Reporter"
            value={
  report.reporterId
    ? report.reporterId.name ||
      `${report.reporterId.firstName || ""} ${report.reporterId.lastName || ""}`.trim()
    : "Anonymous"
}
          />

        </div>

        {/* ================= DESCRIPTION ================= */}
        <div className="mt-6">

          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <FileText size={15} className="text-slate-600" />
            </div>

            <p className="text-sm font-semibold text-slate-700">
              Incident Description
            </p>
          </div>

          <div
            className="
              rounded-2xl
              bg-white/70
              border border-white/60
              backdrop-blur-xl
              p-5
              text-sm
              leading-relaxed
              text-slate-700
              shadow-sm
            "
          >
            {report.description || "No description provided."}
          </div>

        </div>

        {/* ================= ACTIONS ================= */}
        {report.status === "pending" && (
          <div className="mt-7 flex flex-col md:flex-row gap-4">

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAccept(report._id)}
              className="
                flex-1 flex items-center justify-center gap-2
                py-3 rounded-2xl
                bg-gradient-to-r from-green-600 to-emerald-700
                text-white font-semibold
                shadow-lg shadow-green-500/20
              "
            >
              <Check size={18} />
              Accept Report
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onReject(report._id)}
              className="
                flex-1 flex items-center justify-center gap-2
                py-3 rounded-2xl
                bg-gradient-to-r from-red-500 to-rose-600
                text-white font-semibold
                shadow-lg shadow-red-500/20
              "
            >
              <X size={18} />
              Reject Report
            </motion.button>

          </div>
        )}

      </div>

    </motion.div>
  );
};

export default memo(MobileReport);