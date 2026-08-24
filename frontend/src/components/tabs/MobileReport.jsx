import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  MapPin,
  Calendar,
  User2,
  FileText,
  Check,
  X,
  Clock3,
  Activity,
} from "lucide-react";

/* ================= THEME ================= */

const C = {
  primary: "#1B5E20",
  primaryLight: "#E8F5E9",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};

/* ================= STATUS BADGE ================= */

const StatusBadge = memo(({ status }) => {
  const normalizedStatus = status?.toLowerCase() || "pending";

  const styles = {
    pending: {
      wrapper: "bg-amber-50 border-amber-200 text-amber-700",
      dot: "bg-amber-500",
    },

    accepted: {
      wrapper: "bg-emerald-50 border-emerald-200 text-emerald-700",
      dot: "bg-emerald-500",
    },

    rejected: {
      wrapper: "bg-red-50 border-red-200 text-red-700",
      dot: "bg-red-500",
    },
  };

  const style = styles[normalizedStatus] || styles.pending;

  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        rounded-full
        border
        text-xs
        font-semibold
        capitalize
        ${style.wrapper}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />

      {normalizedStatus}
    </div>
  );
});

/* ================= INFO BLOCK ================= */

const Info = memo(({ icon, label, value }) => (
  <div
    className="
      rounded-xl
      border
      bg-gray-50/70
      p-4
      transition-all
      duration-200
      hover:bg-gray-50
    "
    style={{ borderColor: C.border }}
  >
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: C.primaryLight, color: C.primary }}
      >
        {icon}
      </div>

      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
        {label}
      </p>
    </div>

    <p className="text-sm font-semibold text-gray-800 break-words leading-relaxed">
      {value || "N/A"}
    </p>
  </div>
));

/* ================= MAIN CARD ================= */

const MobileReport = ({ report, onAccept, onReject }) => {
  const status = report.status?.toLowerCase() || "pending";

  const reporterName = report.reporterId
    ? report.reporterId.name ||
      `${report.reporterId.firstName || ""} ${
        report.reporterId.lastName || ""
      }`.trim()
    : "Anonymous";

  const createdDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const incidentDate = report.date
    ? `${new Date(report.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })} • ${report.time || "N/A"}`
    : "N/A";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22 }}
      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        bg-white
        shadow-sm
        hover:shadow-md
        transition-shadow
      "
      style={{ borderColor: C.border }}
    >
      {/* ================= TOP ACCENT ================= */}

      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: C.primary }}
      />

      <div className="p-6">
        {/* ================= HEADER ================= */}

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.15 }}
              className="
                w-12 h-12
                rounded-xl
                flex items-center justify-center
                shrink-0
              "
              style={{
                background: C.primaryLight,
                color: C.primary,
              }}
            >
              <Smartphone size={22} />
            </motion.div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mobile Incident Report
                </h3>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Activity size={12} />
                  Mobile
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Submitted via student mobile application
              </p>

              <div className="flex items-center gap-2 mt-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>

                <span className="text-xs text-gray-400">
                  Real-time synchronized report
                </span>
              </div>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* ================= DIVIDER ================= */}

        <div
          className="border-t mb-6"
          style={{ borderColor: C.border }}
        />

        {/* ================= INFORMATION ================= */}

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
            label="Created Report Case Date"
            value={createdDate}
          />

          <Info
            icon={<Clock3 size={15} />}
            label="Incident Date & Time"
            value={incidentDate}
          />

          <Info
            icon={<User2 size={15} />}
            label="Reporter"
            value={reporterName}
          />
        </div>

        {/* ================= DESCRIPTION ================= */}

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: C.primaryLight,
                color: C.primary,
              }}
            >
              <FileText size={15} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                Incident Description
              </p>

              <p className="text-xs text-gray-400">
                Details provided with the report
              </p>
            </div>
          </div>

          <div
            className="
              rounded-xl
              border
              bg-gray-50/70
              p-4
              text-sm
              leading-7
              text-gray-600
            "
            style={{ borderColor: C.border }}
          >
            {report.description || "No description provided."}
          </div>
        </div>

        {/* ================= ACTIONS ================= */}

        {status === "pending" && (
          <div
            className="
              mt-6
              pt-5
              border-t
              flex
              flex-col
              sm:flex-row
              gap-3
            "
            style={{ borderColor: C.border }}
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAccept(report._id)}
              className="
                flex-1
                flex
                items-center
                justify-center
                gap-2
                py-2.5
                rounded-xl
                bg-green-700
                hover:bg-green-800
                text-white
                text-sm
                font-semibold
                transition-colors
              "
            >
              <Check size={17} />
              Accept Report
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onReject(report._id)}
              className="
                flex-1
                flex
                items-center
                justify-center
                gap-2
                py-2.5
                rounded-xl
                bg-red-600
                hover:bg-red-700
                text-white
                text-sm
                font-semibold
                transition-colors
              "
            >
              <X size={17} />
              Reject Report
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(MobileReport);