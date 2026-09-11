import React, { useMemo, useState } from "react";
import {
  X,
  Printer,
  Download,
  FileText,
  Activity,
  Clock3,
  Users,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =========================================================
   HELPERS
========================================================= */

const getPeriodRange = (period) => {
  const now = new Date();

  const start = new Date(now);
  const end = new Date(now);

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "weekly") {
    const day = now.getDay();

    // Monday = first day of week
    const diff = day === 0 ? 6 : day - 1;

    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "yearly") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "all") {
    return null;
  }

  return {
    start,
    end,
  };
};

const getPeriodLabel = (period) => {
  const labels = {
    all: "All Time",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  return labels[period] || "All Time";
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${formatDate(value)} ${formatTime(value)}`;
};

const getDateRangeLabel = (period) => {
  const range = getPeriodRange(period);

  if (!range) {
    return "All recorded history";
  }

  return `${formatDate(range.start)} - ${formatDate(range.end)}`;
};

const getSafeText = (value, fallback = "—") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

const loadImageAsDataUrl = async (src) => {
  try {
    const response = await fetch(src);

    if (!response.ok) {
      throw new Error("Failed to load image");
    }

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Could not load school logo:", error);
    return null;
  }
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const HistoryLogsReport = ({
  logs = [],
  category = "",
  role = "",
  onClose,
}) => {
  const [period, setPeriod] = useState("monthly");
  const [downloading, setDownloading] = useState(false);

  /* =======================================================
     NORMALIZE LOGS
  ======================================================= */

  const normalizedLogs = useMemo(() => {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs.map((log) => ({
      ...log,

      date: log.createdAt || log.date || log.timestamp,

      role:
        log.role ||
        log.userRole ||
        log.actorRole ||
        "Unknown",

      category:
        log.category ||
        log.type ||
        "System",

      action:
        log.action ||
        log.event ||
        log.activity ||
        "—",

      details:
        log.details ||
        log.description ||
        log.message ||
        "—",
    }));
  }, [logs]);

  /* =======================================================
     FILTER BY PERIOD
  ======================================================= */

  const filteredLogs = useMemo(() => {
    const range = getPeriodRange(period);

    if (!range) {
      return normalizedLogs;
    }

    return normalizedLogs.filter((log) => {
      if (!log.date) {
        return false;
      }

      const date = new Date(log.date);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return date >= range.start && date <= range.end;
    });
  }, [normalizedLogs, period]);

  /* =======================================================
     SORT NEWEST FIRST
  ======================================================= */

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();

      return dateB - dateA;
    });
  }, [filteredLogs]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    const uniqueUsers = new Set();

    sortedLogs.forEach((log) => {
      if (log.role) {
        uniqueUsers.add(log.role);
      }
    });

    const categories = new Set();

    sortedLogs.forEach((log) => {
      if (log.category) {
        categories.add(log.category);
      }
    });

    const actions = new Set();

    sortedLogs.forEach((log) => {
      if (log.action) {
        actions.add(log.action);
      }
    });

    return {
      total: sortedLogs.length,
      roles: uniqueUsers.size,
      categories: categories.size,
      actions: actions.size,
    };
  }, [sortedLogs]);

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  const handleDownloadPDF = async () => {
    if (downloading) return;

    try {
      setDownloading(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      /* ===================================================
         HEADER
      =================================================== */

      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, pageWidth, 8, "F");

      let logoData = null;

      try {
        logoData = await loadImageAsDataUrl("/school-logo.png");
      } catch {
        logoData = null;
      }

      if (logoData) {
        try {
          doc.addImage(
            logoData,
            "PNG",
            15,
            14,
            18,
            18
          );
        } catch {
          // Continue without logo
        }
      }

      const titleX = logoData ? 38 : 15;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(22, 163, 74);
      doc.text("GuidEd", titleX, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Our Lady of the Holy Rosary School - General Trias Campus",
        titleX,
        26
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(
        "System History Logs Report",
        15,
        43
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);

      doc.text(
        `Period: ${getPeriodLabel(period)}`,
        15,
        50
      );

      doc.text(
        `Date Range: ${getDateRangeLabel(period)}`,
        15,
        56
      );

      doc.text(
        `Generated: ${formatDateTime(new Date())}`,
        pageWidth - 15,
        50,
        {
          align: "right",
        }
      );

      if (category) {
        doc.text(
          `Category Filter: ${category}`,
          pageWidth - 15,
          56,
          {
            align: "right",
          }
        );
      }

      if (role) {
        doc.text(
          `Role Filter: ${role}`,
          pageWidth - 15,
          62,
          {
            align: "right",
          }
        );
      }

      /* ===================================================
         SUMMARY
      =================================================== */

      const summaryY = 69;

      doc.setFillColor(248, 250, 249);
      doc.roundedRect(
        15,
        summaryY,
        pageWidth - 30,
        20,
        3,
        3,
        "F"
      );

      const boxWidth = (pageWidth - 45) / 4;

      const summaryItems = [
        {
          label: "Total Events",
          value: summary.total,
        },
        {
          label: "Roles Represented",
          value: summary.roles,
        },
        {
          label: "Categories",
          value: summary.categories,
        },
        {
          label: "Unique Actions",
          value: summary.actions,
        },
      ];

      summaryItems.forEach((item, index) => {
        const x = 15 + index * (boxWidth + 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        doc.text(item.label, x + 5, summaryY + 7);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text(
          String(item.value),
          x + 5,
          summaryY + 15
        );
      });

      /* ===================================================
         TABLE
      =================================================== */

      const tableRows = sortedLogs.map((log, index) => [
        index + 1,
        formatDate(log.date),
        formatTime(log.date),
        getSafeText(log.role),
        getSafeText(log.category),
        getSafeText(log.action),
        getSafeText(log.details),
      ]);

      autoTable(doc, {
        startY: 96,

        head: [
          [
            "#",
            "Date",
            "Time",
            "Role",
            "Category",
            "Action",
            "Details",
          ],
        ],

        body: tableRows,

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 7,
          cellPadding: 2.5,
          textColor: [45, 45, 45],
          lineColor: [220, 225, 222],
          lineWidth: 0.1,
          valign: "top",
        },

        headStyles: {
          fillColor: [22, 163, 74],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          halign: "left",
        },

        alternateRowStyles: {
          fillColor: [248, 250, 249],
        },

        columnStyles: {
          0: {
            cellWidth: 8,
            halign: "center",
          },

          1: {
            cellWidth: 25,
          },

          2: {
            cellWidth: 23,
          },

          3: {
            cellWidth: 25,
          },

          4: {
            cellWidth: 28,
          },

          5: {
            cellWidth: 45,
          },

          6: {
            cellWidth: "auto",
          },
        },

        margin: {
          left: 15,
          right: 15,
        },

        didDrawPage: (data) => {
          /* ===============================================
             FOOTER
          =============================================== */

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(120, 120, 120);

          doc.text(
            "GuidEd - Student Guidance and Discipline Management System",
            15,
            pageHeight - 10
          );

          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth - 15,
            pageHeight - 10,
            {
              align: "right",
            }
          );
        },
      });

      /* ===================================================
         EMPTY REPORT
      =================================================== */

      if (sortedLogs.length === 0) {
        // Add a clear empty-state message if there are no records.
        const emptyY =
          doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 10
            : 105;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);

        doc.text(
          "No history logs were recorded for the selected period and filters.",
          pageWidth / 2,
          emptyY,
          {
            align: "center",
          }
        );
      }

      /* ===================================================
         FILE NAME
      =================================================== */

      const date = new Date();

      const dateStamp = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      const filename = `GuidEd-History-Logs-${period}-${dateStamp}.pdf`;

      doc.save(filename);
    } catch (error) {
      console.error(
        "Failed to generate history logs PDF:",
        error
      );

      alert(
        "Failed to generate the PDF report. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =====================================================
          PRINT STYLES
      ===================================================== */}

      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            #history-logs-print-report,
            #history-logs-print-report * {
              visibility: visible !important;
            }

            #history-logs-print-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: none !important;
              height: auto !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
            }

            #history-logs-print-report .no-print {
              display: none !important;
            }

            #history-logs-print-report .print-scroll {
              max-height: none !important;
              overflow: visible !important;
            }

            #history-logs-print-report table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            #history-logs-print-report tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          }
        `}
      </style>

      {/* =====================================================
          OVERLAY
      ===================================================== */}

      <div
        className="
          fixed
          inset-0
          z-[999]
          bg-black/40
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-4
        "
      >
        {/* ===================================================
            REPORT CONTAINER
        =================================================== */}

        <div
          id="history-logs-print-report"
          className="
            bg-white
            w-full
            max-w-7xl
            max-h-[94vh]
            rounded-3xl
            shadow-2xl
            overflow-hidden
            flex
            flex-col
          "
        >
          {/* =================================================
              REPORT HEADER
          ================================================= */}

          <div
            className="
              no-print
              px-6
              py-5
              border-b
              border-gray-100
              flex
              flex-col
              lg:flex-row
              lg:items-center
              justify-between
              gap-4
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-green-50
                  border
                  border-green-100
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FileText size={20} />
              </div>

              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  History Logs Report
                </h2>

                <p className="text-xs text-gray-400 mt-0.5">
                  Printable system activity and audit report
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* PERIOD */}

              <div
                className="
                  flex
                  items-center
                  gap-1
                  bg-gray-50
                  border
                  border-gray-200
                  rounded-xl
                  p-1
                "
              >
                {[
                  ["all", "All"],
                  ["daily", "Daily"],
                  ["weekly", "Weekly"],
                  ["monthly", "Monthly"],
                  ["yearly", "Yearly"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={`
                      px-3
                      py-2
                      rounded-lg
                      text-[11px]
                      font-semibold
                      transition
                      ${
                        period === value
                          ? "bg-green-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-white hover:text-gray-800"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* PRINT */}

              <button
                type="button"
                onClick={handlePrint}
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-gray-900
                  hover:bg-gray-800
                  text-white
                  text-xs
                  font-semibold
                  transition
                "
              >
                <Printer size={14} />
                Print
              </button>

              {/* PDF */}

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-green-400
                  disabled:cursor-not-allowed
                  text-white
                  text-xs
                  font-semibold
                  transition
                "
              >
                {downloading ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={14} />
                )}

                {downloading
                  ? "Generating..."
                  : "Download PDF"}
              </button>

              {/* CLOSE */}

              <button
                type="button"
                onClick={onClose}
                className="
                  w-10
                  h-10
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  text-gray-500
                  hover:bg-gray-50
                  hover:text-gray-800
                  flex
                  items-center
                  justify-center
                  transition
                "
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* =================================================
              REPORT CONTENT
          ================================================= */}

          <div className="print-scroll flex-1 overflow-y-auto p-6">
            {/* ===============================================
                REPORT PAPER
            =============================================== */}

            <div
              className="
                bg-white
                border
                border-gray-100
                rounded-2xl
                p-7
              "
            >
              {/* =============================================
                  SCHOOL HEADER
              ============================================= */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-6
                  pb-6
                  border-b
                  border-gray-100
                "
              >
                <div className="flex items-center gap-4">
                  <img
                    src="/school-logo.png"
                    alt="School Logo"
                    className="
                      w-16
                      h-16
                      object-contain
                      flex-shrink-0
                    "
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />

                  <div>
                    <p
                      className="
                        text-xl
                        font-black
                        tracking-tight
                        text-green-600
                      "
                    >
                      GuidEd
                    </p>

                    <p className="text-sm font-bold text-gray-800 mt-1">
                      Student Guidance and Discipline
                      Management System
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Our Lady of the Holy Rosary School -
                      General Trias Campus
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-400">
                    GENERATED
                  </p>

                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {formatDateTime(new Date())}
                  </p>
                </div>
              </div>

              {/* =============================================
                  TITLE
              ============================================= */}

              <div className="py-6">
                <h1 className="text-2xl font-black text-gray-900">
                  System History Logs Report
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  Audit trail of recorded system activity,
                  user actions, and administrative events.
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <ReportBadge
                    label="Period"
                    value={getPeriodLabel(period)}
                  />

                  <ReportBadge
                    label="Date Range"
                    value={getDateRangeLabel(period)}
                  />

                  {category && (
                    <ReportBadge
                      label="Category"
                      value={category}
                    />
                  )}

                  {role && (
                    <ReportBadge
                      label="Role"
                      value={role}
                    />
                  )}
                </div>
              </div>

              {/* =============================================
                  SUMMARY
              ============================================= */}

              <div
                className="
                  grid
                  grid-cols-2
                  xl:grid-cols-4
                  gap-3
                  mb-6
                "
              >
                <ReportSummary
                  icon={<Activity size={17} />}
                  label="Total Events"
                  value={summary.total}
                />

                <ReportSummary
                  icon={<Users size={17} />}
                  label="Roles Represented"
                  value={summary.roles}
                />

                <ReportSummary
                  icon={<FileText size={17} />}
                  label="Categories"
                  value={summary.categories}
                />

                <ReportSummary
                  icon={<ShieldCheck size={17} />}
                  label="Unique Actions"
                  value={summary.actions}
                />
              </div>

              {/* =============================================
                  TABLE
              ============================================= */}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="px-3 py-3 text-left font-bold">
                        #
                      </th>

                      <th className="px-3 py-3 text-left font-bold whitespace-nowrap">
                        Date
                      </th>

                      <th className="px-3 py-3 text-left font-bold whitespace-nowrap">
                        Time
                      </th>

                      <th className="px-3 py-3 text-left font-bold">
                        Role
                      </th>

                      <th className="px-3 py-3 text-left font-bold">
                        Category
                      </th>

                      <th className="px-3 py-3 text-left font-bold">
                        Action
                      </th>

                      <th className="px-3 py-3 text-left font-bold min-w-[320px]">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedLogs.map((log, index) => (
                      <tr
                        key={
                          log._id ||
                          log.id ||
                          `${log.date}-${index}`
                        }
                        className={`
                          border-b
                          border-gray-100
                          align-top
                          ${
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/70"
                          }
                        `}
                      >
                        <td className="px-3 py-3 text-gray-400 font-semibold">
                          {index + 1}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock3
                              size={13}
                              className="text-gray-300"
                            />

                            <span className="font-semibold text-gray-700">
                              {formatDate(log.date)}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                          {formatTime(log.date)}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <RoleBadge role={log.role} />
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className="
                              inline-flex
                              px-2.5
                              py-1
                              rounded-lg
                              bg-gray-50
                              border
                              border-gray-100
                              text-[10px]
                              font-semibold
                              text-gray-600
                            "
                          >
                            {getSafeText(log.category)}
                          </span>
                        </td>

                        <td className="px-3 py-3 min-w-[180px]">
                          <p className="font-bold text-gray-800">
                            {getSafeText(log.action)}
                          </p>
                        </td>

                        <td className="px-3 py-3 min-w-[320px]">
                          <p className="text-gray-500 leading-relaxed whitespace-pre-wrap">
                            {getSafeText(log.details)}
                          </p>
                        </td>
                      </tr>
                    ))}

                    {sortedLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-14 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className="
                                w-12
                                h-12
                                rounded-2xl
                                bg-gray-50
                                flex
                                items-center
                                justify-center
                                mb-3
                              "
                            >
                              <FileText
                                size={20}
                                className="text-gray-300"
                              />
                            </div>

                            <p className="text-sm font-bold text-gray-700">
                              No history logs found
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              No activity was recorded for
                              the selected period and filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* =============================================
                  FOOTER
              ============================================= */}

              <div
                className="
                  mt-7
                  pt-4
                  border-t
                  border-gray-100
                  flex
                  flex-col
                  sm:flex-row
                  items-start
                  sm:items-center
                  justify-between
                  gap-2
                "
              >
                <p className="text-[10px] text-gray-400">
                  GuidEd - Student Guidance and Discipline
                  Management System
                </p>

                <p className="text-[10px] text-gray-400">
                  Total records in report:{" "}
                  <span className="font-bold text-gray-600">
                    {summary.total}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   REPORT BADGE
========================================================= */

const ReportBadge = ({ label, value }) => (
  <div
    className="
      inline-flex
      items-center
      gap-1.5
      px-3
      py-1.5
      rounded-lg
      bg-gray-50
      border
      border-gray-100
      text-[10px]
    "
  >
    <span className="font-semibold text-gray-400">
      {label}:
    </span>

    <span className="font-bold text-gray-700">
      {value}
    </span>
  </div>
);

/* =========================================================
   SUMMARY CARD
========================================================= */

const ReportSummary = ({
  icon,
  label,
  value,
}) => (
  <div
    className="
      rounded-2xl
      border
      border-gray-100
      bg-gray-50/60
      p-4
    "
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-semibold text-gray-400">
          {label}
        </p>

        <p className="text-lg font-black text-gray-900 mt-1">
          {value}
        </p>
      </div>

      <div
        className="
          w-9
          h-9
          rounded-xl
          bg-green-50
          text-green-600
          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>
    </div>
  </div>
);

/* =========================================================
   ROLE BADGE
========================================================= */

const RoleBadge = ({ role }) => {
  const styles = {
    Admin:
      "bg-green-50 text-green-700 border-green-100",
    Guidance:
      "bg-blue-50 text-blue-700 border-blue-100",
    Teacher:
      "bg-amber-50 text-amber-700 border-amber-100",
    Student:
      "bg-gray-50 text-gray-600 border-gray-100",
  };

  const dotStyles = {
    Admin: "bg-green-500",
    Guidance: "bg-blue-500",
    Teacher: "bg-amber-500",
    Student: "bg-gray-400",
  };

  const style =
    styles[role] ||
    "bg-gray-50 text-gray-500 border-gray-100";

  const dot =
    dotStyles[role] || "bg-gray-400";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-2.5
        py-1
        rounded-lg
        border
        text-[10px]
        font-bold
        ${style}
      `}
    >
      <span
        className={`
          w-1.5
          h-1.5
          rounded-full
          ${dot}
        `}
      />

      {role || "Unknown"}
    </span>
  );
};

export default HistoryLogsReport;