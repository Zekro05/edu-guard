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

/* =========================================================
   THEME
========================================================= */

const C = {
  primary: "#1B5E20",
  primaryLight: "#E8F5E9",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
};

/* =========================================================
   STATUS BADGE
========================================================= */

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
        inline-flex
        items-center
        justify-center
        gap-2
        px-3
        py-1.5
        rounded-full
        border
        text-xs
        font-semibold
        capitalize
        whitespace-nowrap
        ${style.wrapper}
      `}
    >
      <span
        className={`
          w-1.5
          h-1.5
          rounded-full
          shrink-0
          ${style.dot}
        `}
      />

      {normalizedStatus}
    </div>
  );
});

/* =========================================================
   INFO BLOCK
========================================================= */

const Info = memo(({ icon, label, value }) => (
  <div
    className="
      min-w-0
      rounded-xl
      border
      bg-gray-50/70
      p-3.5
      sm:p-4
      transition-all
      duration-200
      hover:bg-gray-50
    "
    style={{ borderColor: C.border }}
  >
    <div className="flex items-center gap-2 mb-2.5 sm:mb-3 min-w-0">
      <div
        className="
          w-8
          h-8
          rounded-lg
          flex
          items-center
          justify-center
          shrink-0
        "
        style={{
          background: C.primaryLight,
          color: C.primary,
        }}
      >
        {icon}
      </div>

      <p
        className="
          text-[10px]
          sm:text-[11px]
          uppercase
          tracking-wide
          text-gray-400
          font-semibold
          leading-tight
          break-words
        "
      >
        {label}
      </p>
    </div>

    <p
      className="
        text-sm
        font-semibold
        text-gray-800
        break-words
        whitespace-normal
        leading-relaxed
      "
    >
      {value || "N/A"}
    </p>
  </div>
));

/* =========================================================
   MAIN CARD
========================================================= */

const MobileReport = ({ report, onAccept, onReject }) => {
  const status = report?.status?.toLowerCase() || "pending";

  /* =======================================================
     REPORTER
  ======================================================= */

  const reporterName = report?.reporterId
    ? report.reporterId.name ||
      `${report.reporterId.firstName || ""} ${
        report.reporterId.lastName || ""
      }`.trim()
    : "Anonymous";

  /* =======================================================
     CREATED DATE
  ======================================================= */

  const createdDate = report?.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  /* =======================================================
     INCIDENT DATE
  ======================================================= */

  const incidentDate = report?.date
    ? `${new Date(report.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })} • ${report.time || "N/A"}`
    : "N/A";

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.22,
      }}
      className="
        relative
        w-full
        max-w-full
        overflow-hidden
        rounded-2xl
        border
        bg-white
        shadow-sm
        hover:shadow-md
        transition-shadow
      "
      style={{
        borderColor: C.border,
      }}
    >
      {/* ===================================================
          TOP ACCENT
      =================================================== */}

      <div
        className="
          absolute
          top-0
          left-0
          right-0
          h-1
        "
        style={{
          background: C.primary,
        }}
      />

      {/* ===================================================
          CARD CONTENT
      =================================================== */}

      <div
        className="
          p-4
          sm:p-5
          lg:p-6
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-4
            mb-5
            sm:mb-6
            lg:flex-row
            lg:items-start
            lg:justify-between
            lg:gap-5
          "
        >
          {/* REPORT TYPE */}

          <div
            className="
              flex
              items-start
              gap-3
              sm:gap-4
              min-w-0
              flex-1
            "
          >
            <motion.div
              whileHover={{
                scale: 1.04,
              }}
              transition={{
                duration: 0.15,
              }}
              className="
                w-10
                h-10
                sm:w-12
                sm:h-12
                rounded-xl
                flex
                items-center
                justify-center
                shrink-0
              "
              style={{
                background: C.primaryLight,
                color: C.primary,
              }}
            >
              <Smartphone
                size={20}
                className="sm:hidden"
              />

              <Smartphone
                size={22}
                className="hidden sm:block"
              />
            </motion.div>

            <div className="min-w-0 flex-1">
              {/* TITLE */}

              <div
                className="
                  flex
                  items-start
                  gap-2
                  flex-wrap
                "
              >
                <h3
                  className="
                    text-base
                    sm:text-lg
                    font-semibold
                    text-gray-900
                    leading-snug
                    break-words
                  "
                >
                  Mobile Incident Report
                </h3>

                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-[10px]
                    sm:text-[11px]
                    text-gray-400
                    whitespace-nowrap
                  "
                >
                  <Activity size={11} />

                  Mobile
                </div>
              </div>

              {/* SUBTITLE */}

              <p
                className="
                  text-xs
                  sm:text-sm
                  text-gray-500
                  mt-1
                  leading-relaxed
                "
              >
                Submitted via student mobile application
              </p>

              {/* REAL-TIME STATUS */}

              <div
                className="
                  flex
                  items-start
                  gap-2
                  mt-3
                "
              >
                <span
                  className="
                    relative
                    flex
                    h-2
                    w-2
                    mt-1
                    shrink-0
                  "
                >
                  <span
                    className="
                      animate-ping
                      absolute
                      inline-flex
                      h-full
                      w-full
                      rounded-full
                      bg-green-400
                      opacity-60
                    "
                  />

                  <span
                    className="
                      relative
                      inline-flex
                      rounded-full
                      h-2
                      w-2
                      bg-green-500
                    "
                  />
                </span>

                <span
                  className="
                    text-[10px]
                    sm:text-xs
                    text-gray-400
                    leading-relaxed
                  "
                >
                  Real-time synchronized report
                </span>
              </div>
            </div>
          </div>

          {/* STATUS */}

          <div
            className="
              flex
              lg:justify-end
              shrink-0
            "
          >
            <StatusBadge status={status} />
          </div>
        </div>

        {/* =================================================
            DIVIDER
        ================================================= */}

        <div
          className="
            border-t
            mb-5
            sm:mb-6
          "
          style={{
            borderColor: C.border,
          }}
        />

        {/* =================================================
            INFORMATION GRID
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-3
            gap-3
            sm:gap-4
          "
        >
          <Info
            icon={<User2 size={15} />}
            label="Student"
            value={report?.studentName}
          />

          <Info
            icon={<FileText size={15} />}
            label="Offense"
            value={report?.offense}
          />

          <Info
            icon={<MapPin size={15} />}
            label="Location"
            value={report?.location}
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

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <div
          className="
            mt-5
            sm:mt-6
          "
        >
          {/* DESCRIPTION HEADER */}

          <div
            className="
              flex
              items-center
              gap-2
              mb-3
            "
          >
            <div
              className="
                w-8
                h-8
                rounded-lg
                flex
                items-center
                justify-center
                shrink-0
              "
              style={{
                background: C.primaryLight,
                color: C.primary,
              }}
            >
              <FileText size={15} />
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-semibold
                  text-gray-800
                "
              >
                Incident Description
              </p>

              <p
                className="
                  text-[10px]
                  sm:text-xs
                  text-gray-400
                "
              >
                Details provided with the report
              </p>
            </div>
          </div>

          {/* DESCRIPTION CONTENT */}

          <div
            className="
              rounded-xl
              border
              bg-gray-50/70
              p-3.5
              sm:p-4
              text-sm
              leading-6
              sm:leading-7
              text-gray-600
              break-words
              whitespace-pre-wrap
              overflow-hidden
            "
            style={{
              borderColor: C.border,
            }}
          >
            {report?.description || "No description provided."}
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        {status === "pending" && (
          <div
            className="
              mt-5
              sm:mt-6
              pt-4
              sm:pt-5
              border-t
              flex
              flex-col
              sm:flex-row
              gap-3
            "
            style={{
              borderColor: C.border,
            }}
          >
            {/* ACCEPT */}

            <motion.button
              whileHover={{
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() => onAccept?.(report._id)}
              className="
                w-full
                sm:flex-1
                min-h-[44px]
                flex
                items-center
                justify-center
                gap-2
                py-2.5
                px-4
                rounded-xl
                bg-green-700
                hover:bg-green-800
                active:bg-green-900
                text-white
                text-sm
                font-semibold
                transition-colors
                touch-manipulation
              "
            >
              <Check
                size={17}
                className="shrink-0"
              />

              <span>Accept Report</span>
            </motion.button>

            {/* REJECT */}

            <motion.button
              whileHover={{
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() => onReject?.(report._id)}
              className="
                w-full
                sm:flex-1
                min-h-[44px]
                flex
                items-center
                justify-center
                gap-2
                py-2.5
                px-4
                rounded-xl
                bg-red-600
                hover:bg-red-700
                active:bg-red-800
                text-white
                text-sm
                font-semibold
                transition-colors
                touch-manipulation
              "
            >
              <X
                size={17}
                className="shrink-0"
              />

              <span>Reject Report</span>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(MobileReport);

