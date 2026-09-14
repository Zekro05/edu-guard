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
  CalendarDays,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuthStore } from "../../store/authStore";

/* =========================================================
   HELPERS
========================================================= */

const toDateInputValue = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayInputValue = () => {
  return toDateInputValue(new Date());
};

const getMonthStartInputValue = () => {
  const now = new Date();

  return toDateInputValue(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
};

/* =========================================================
   GET PERIOD RANGE
========================================================= */

const getPeriodRange = (period, referenceDate) => {
  if (period === "all") {
    return null;
  }

  const base = referenceDate
    ? new Date(`${referenceDate}T12:00:00`)
    : new Date();

  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const start = new Date(base);
  const end = new Date(base);

  /* =======================================================
     DAILY
  ======================================================= */

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  /* =======================================================
     WEEKLY
     Monday - Sunday
  ======================================================= */

  if (period === "weekly") {
    const day = base.getDay();

    // Sunday = 0
    // Monday = 1
    const diff = day === 0 ? 6 : day - 1;

    start.setDate(base.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  /* =======================================================
     MONTHLY
  ======================================================= */

  if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(base.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  /* =======================================================
     YEARLY
  ======================================================= */

  if (period === "yearly") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }

  return {
    start,
    end,
  };
};

/* =========================================================
   CUSTOM RANGE
========================================================= */

const getCustomRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return null;
  }

  return {
    start,
    end,
  };
};

/* =========================================================
   PERIOD LABEL
========================================================= */

const getPeriodLabel = (period) => {
  const labels = {
    all: "All Time",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    custom: "Custom Range",
  };

  return labels[period] || "All Time";
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* =========================================================
   SHORT DATE
========================================================= */

const formatShortDate = (value) => {
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

/* =========================================================
   FORMAT TIME
========================================================= */

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

/* =========================================================
   FORMAT DATE + TIME
========================================================= */

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${formatDate(value)} ${formatTime(value)}`;
};

/* =========================================================
   FORMAT RANGE
========================================================= */

const formatRange = (range) => {
  if (!range) {
    return "All recorded history";
  }

  return `${formatDate(range.start)} - ${formatDate(
    range.end
  )}`;
};

/* =========================================================
   SAFE TEXT
========================================================= */

const getSafeText = (value, fallback = "—") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return String(value);
};

/* =========================================================
   GET LOG DATE
========================================================= */

const getLogDate = (log) => {
  return (
    log?.createdAt ||
    log?.date ||
    log?.timestamp ||
    log?.updatedAt ||
    null
  );
};

/* =========================================================
   GET ACTOR NAME
========================================================= */

const getActorName = (log) => {
  // Your HistoryLog backend populates:
  // user: { name, email }
  if (
    log?.user &&
    typeof log.user === "object"
  ) {
    const populatedName =
      log.user?.name?.trim() ||
      [
        log.user?.firstName,
        log.user?.middleName,
        log.user?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      log.user?.fullName?.trim();

    if (populatedName) {
      return populatedName;
    }

    if (log.user?.email) {
      return log.user.email;
    }
  }

  // Other possible name fields
  const directName =
    log?.userName ||
    log?.actorName ||
    log?.adminName ||
    log?.teacherName ||
    log?.performedByName ||
    log?.createdByName;

  if (
    directName &&
    typeof directName !== "object"
  ) {
    return String(directName).trim();
  }

  // Possible actor object
  if (
    log?.actor &&
    typeof log.actor === "object"
  ) {
    const actorName =
      log.actor?.name?.trim() ||
      [
        log.actor?.firstName,
        log.actor?.middleName,
        log.actor?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      log.actor?.fullName?.trim();

    if (actorName) {
      return actorName;
    }

    if (log.actor?.email) {
      return log.actor.email;
    }
  }

  return "Unknown User";
};

/* =========================================================
   LOAD IMAGE
========================================================= */

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
    console.warn(
      "Could not load school logo:",
      error
    );

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
  /*
   * Get the currently logged-in user.
   *
   * This allows the report to show:
   * "Generated By: John Doe"
   * instead of simply saying "GuidEd Administrator".
   */
  const { user } = useAuthStore();

  /* =======================================================
     GENERATED INFORMATION
  ======================================================= */

  const [generatedAt] = useState(
    () => new Date()
  );

  const generatedBy =
    user?.name?.trim() ||
    [
      user?.firstName,
      user?.middleName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.fullName?.trim() ||
    user?.email ||
    "GuidEd Administrator";

  const generatedByRole =
    user?.role || "Administrator";

  /* =======================================================
     REPORT FILTER STATE
  ======================================================= */

  const [period, setPeriod] =
    useState("monthly");

  const [selectedDate, setSelectedDate] =
    useState(getTodayInputValue());

  const [customStartDate, setCustomStartDate] =
    useState(getMonthStartInputValue());

  const [customEndDate, setCustomEndDate] =
    useState(getTodayInputValue());

  const [downloading, setDownloading] =
    useState(false);

  /* =======================================================
     CUSTOM RANGE VALIDATION
  ======================================================= */

  const customRangeError = useMemo(() => {
    if (period !== "custom") {
      return "";
    }

    if (
      !customStartDate ||
      !customEndDate
    ) {
      return "Please select both a start date and an end date.";
    }

    const start = new Date(
      `${customStartDate}T00:00:00`
    );

    const end = new Date(
      `${customEndDate}T23:59:59.999`
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return "Invalid custom date range.";
    }

    if (start > end) {
      return "The start date cannot be later than the end date.";
    }

    return "";
  }, [
    period,
    customStartDate,
    customEndDate,
  ]);

  /* =======================================================
     CURRENT REPORT RANGE
  ======================================================= */

  const reportRange = useMemo(() => {
    if (period === "custom") {
      return getCustomRange(
        customStartDate,
        customEndDate
      );
    }

    return getPeriodRange(
      period,
      selectedDate
    );
  }, [
    period,
    selectedDate,
    customStartDate,
    customEndDate,
  ]);

  /* =======================================================
     NORMALIZE LOGS
  ======================================================= */

  const normalizedLogs = useMemo(() => {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs.map((log) => ({
      ...log,

      date: getLogDate(log),

      role:
        log?.role ||
        log?.userRole ||
        log?.actorRole ||
        log?.user?.role ||
        log?.actor?.role ||
        "Unknown",

      actorName: getActorName(log),

      category:
        log?.category ||
        log?.type ||
        "System",

      action:
        log?.action ||
        log?.event ||
        log?.activity ||
        "—",

      details:
        log?.details ||
        log?.description ||
        log?.message ||
        "—",
    }));
  }, [logs]);

  /* =======================================================
     FILTER LOGS
  ======================================================= */

  const filteredLogs = useMemo(() => {
    if (customRangeError) {
      return [];
    }

    return normalizedLogs.filter((log) => {
      /* ================================================
         CATEGORY
      ================================================ */

      if (
        category &&
        String(log.category).toLowerCase() !==
          String(category).toLowerCase()
      ) {
        return false;
      }

      /* ================================================
         ROLE
      ================================================ */

      if (
        role &&
        String(log.role).toLowerCase() !==
          String(role).toLowerCase()
      ) {
        return false;
      }

      /* ================================================
         ALL TIME
      ================================================ */

      if (!reportRange) {
        return true;
      }

      /* ================================================
         DATE
      ================================================ */

      if (!log.date) {
        return false;
      }

      const date = new Date(log.date);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return (
        date >= reportRange.start &&
        date <= reportRange.end
      );
    });
  }, [
    normalizedLogs,
    category,
    role,
    reportRange,
    customRangeError,
  ]);

  /* =======================================================
     SORT NEWEST FIRST
  ======================================================= */

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const dateA = new Date(
        a.date || 0
      ).getTime();

      const dateB = new Date(
        b.date || 0
      ).getTime();

      return dateB - dateA;
    });
  }, [filteredLogs]);

  /* =======================================================
     ACTUAL RANGE FOR ALL TIME
  ======================================================= */

  const actualAllTimeRange = useMemo(() => {
    const validDates = normalizedLogs
      .map((log) => {
        if (!log.date) return null;

        const date = new Date(log.date);

        return Number.isNaN(date.getTime())
          ? null
          : date;
      })
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (!validDates.length) {
      return null;
    }

    return {
      start: validDates[0],
      end: validDates[validDates.length - 1],
    };
  }, [normalizedLogs]);

  /* =======================================================
     DISPLAY DATE RANGE
  ======================================================= */

  const displayDateRange = useMemo(() => {
    if (period === "all") {
      if (!actualAllTimeRange) {
        return "All recorded history";
      }

      return `${formatDate(
        actualAllTimeRange.start
      )} - ${formatDate(
        actualAllTimeRange.end
      )}`;
    }

    if (period === "custom") {
      if (customRangeError) {
        return "Invalid custom range";
      }

      return formatRange(reportRange);
    }

    return formatRange(reportRange);
  }, [
    period,
    reportRange,
    actualAllTimeRange,
    customRangeError,
  ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    const roles = new Set();
    const categories = new Set();
    const actions = new Set();

    sortedLogs.forEach((log) => {
      if (log.role) {
        roles.add(log.role);
      }

      if (log.category) {
        categories.add(log.category);
      }

      if (log.action) {
        actions.add(log.action);
      }
    });

    return {
      total: sortedLogs.length,
      roles: roles.size,
      categories: categories.size,
      actions: actions.size,
    };
  }, [sortedLogs]);

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {
    if (customRangeError) {
      alert(customRangeError);
      return;
    }

    window.print();
  };

  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  const handleDownloadPDF = async () => {
    if (downloading) return;

    if (customRangeError) {
      alert(customRangeError);
      return;
    }

    try {
      setDownloading(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      /* ===================================================
         TOP GREEN BAR
      =================================================== */

      doc.setFillColor(
        22,
        163,
        74
      );

      doc.rect(
        0,
        0,
        pageWidth,
        8,
        "F"
      );

      /* ===================================================
         SCHOOL LOGO
      =================================================== */

      let logoData = null;

      try {
        logoData =
          await loadImageAsDataUrl(
            "/school-logo.webp"
          );
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
          // Continue without logo.
        }
      }

      const titleX =
        logoData ? 38 : 15;

      /* ===================================================
         GUIDED
      =================================================== */

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(18);

      doc.setTextColor(
        22,
        163,
        74
      );

      doc.text(
        "GuidEd",
        titleX,
        20
      );

      /* ===================================================
         SCHOOL NAME
      =================================================== */

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.setTextColor(
        100,
        100,
        100
      );

      doc.text(
        "Our Lady of the Holy Rosary School - General Trias Campus",
        titleX,
        26
      );

      /* ===================================================
         REPORT TITLE
      =================================================== */

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(14);

      doc.setTextColor(
        30,
        30,
        30
      );

      doc.text(
        "SYSTEM HISTORY LOGS REPORT",
        15,
        43
      );

      /* ===================================================
         METADATA
      =================================================== */

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.setTextColor(
        80,
        80,
        80
      );

      doc.text(
        `Generated By: ${generatedBy}`,
        15,
        50
      );

      doc.text(
        `Generated On: ${formatDateTime(
          generatedAt
        )}`,
        15,
        56
      );

      doc.text(
        `Generated Role: ${generatedByRole}`,
        15,
        62
      );

      doc.text(
        `Report Period: ${getPeriodLabel(
          period
        )}`,
        pageWidth - 15,
        50,
        {
          align: "right",
        }
      );

      doc.text(
        `Date Range: ${displayDateRange}`,
        pageWidth - 15,
        56,
        {
          align: "right",
        }
      );

      doc.text(
        `Category: ${
          category || "All Categories"
        }`,
        pageWidth - 15,
        62,
        {
          align: "right",
        }
      );

      doc.text(
        `Role: ${
          role || "All Roles"
        }`,
        pageWidth - 15,
        68,
        {
          align: "right",
        }
      );

      /* ===================================================
         SUMMARY
      =================================================== */

      const summaryY = 75;

      doc.setFillColor(
        248,
        250,
        249
      );

      doc.roundedRect(
        15,
        summaryY,
        pageWidth - 30,
        20,
        3,
        3,
        "F"
      );

      const boxWidth =
        (pageWidth - 45) / 4;

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

      summaryItems.forEach(
        (item, index) => {
          const x =
            15 +
            index *
              (boxWidth + 5);

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(7);

          doc.setTextColor(
            110,
            110,
            110
          );

          doc.text(
            item.label,
            x + 5,
            summaryY + 7
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(12);

          doc.setTextColor(
            30,
            30,
            30
          );

          doc.text(
            String(item.value),
            x + 5,
            summaryY + 15
          );
        }
      );

      /* ===================================================
         TABLE
      =================================================== */

      const tableRows =
        sortedLogs.map(
          (log, index) => [
            index + 1,
            formatShortDate(
              log.date
            ),
            formatTime(
              log.date
            ),
            getSafeText(
              log.actorName
            ),
            getSafeText(
              log.role
            ),
            getSafeText(
              log.category
            ),
            getSafeText(
              log.action
            ),
            getSafeText(
              log.details
            ),
          ]
        );

      autoTable(doc, {
        startY: 102,

        head: [
          [
            "#",
            "Date",
            "Time",
            "Performed By",
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
          textColor: [
            45,
            45,
            45,
          ],
          lineColor: [
            220,
            225,
            222,
          ],
          lineWidth: 0.1,
          valign: "top",
        },

        headStyles: {
          fillColor: [
            22,
            163,
            74,
          ],
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle: "bold",
          fontSize: 7,
          halign: "left",
        },

        alternateRowStyles: {
          fillColor: [
            248,
            250,
            249,
          ],
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
            cellWidth: 38,
          },

          4: {
            cellWidth: 25,
          },

          5: {
            cellWidth: 28,
          },

          6: {
            cellWidth: 45,
          },

          7: {
            cellWidth: "auto",
          },
        },

        margin: {
          left: 15,
          right: 15,
        },

        didDrawPage: (
          data
        ) => {
          /* =============================================
             FOOTER
          ============================================= */

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(7);

          doc.setTextColor(
            120,
            120,
            120
          );

          doc.text(
            "GuidEd - Student Guidance and Discipline Management System",
            15,
            pageHeight - 10
          );

          doc.text(
            `Prepared by: ${generatedBy}`,
            pageWidth / 2,
            pageHeight - 10,
            {
              align: "center",
            }
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

      if (
        sortedLogs.length === 0
      ) {
        const emptyY =
          doc.lastAutoTable?.finalY
            ? doc.lastAutoTable
                .finalY + 10
            : 110;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(9);

        doc.setTextColor(
          120,
          120,
          120
        );

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

      let filenameRange =
        "all-time";

      if (
        reportRange &&
        !customRangeError
      ) {
        const start =
          toDateInputValue(
            reportRange.start
          );

        const end =
          toDateInputValue(
            reportRange.end
          );

        filenameRange =
          `${start}-to-${end}`;
      }

      const filename =
        `GuidEd-History-Logs-${period}-${filenameRange}.pdf`;

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

  /* =========================================================
     RENDER
  ========================================================= */

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
              REPORT HEADER / CONTROLS
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
              gap-4
            "
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                  onClick={
                    handleDownloadPDF
                  }
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
                    <Download
                      size={14}
                    />
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
                REPORT FILTERS
            ================================================= */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-4
                gap-3
              "
            >
              {/* PERIOD */}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                  Report Period
                </label>

                <select
                  value={period}
                  onChange={(e) =>
                    setPeriod(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    px-3
                    py-2.5
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-xs
                    font-semibold
                    text-gray-700
                    outline-none
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-100
                  "
                >
                  <option value="daily">
                    Daily
                  </option>

                  <option value="weekly">
                    Weekly
                  </option>

                  <option value="monthly">
                    Monthly
                  </option>

                  <option value="yearly">
                    Yearly
                  </option>

                  <option value="custom">
                    Custom Range
                  </option>

                  <option value="all">
                    All Time
                  </option>
                </select>
              </div>

              {/* REFERENCE DATE */}

              {period !== "custom" &&
                period !== "all" && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                      Reference Date
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={14}
                        className="
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-gray-400
                        "
                      />

                      <input
                        type="date"
                        value={
                          selectedDate
                        }
                        onChange={(e) =>
                          setSelectedDate(
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          pl-9
                          pr-3
                          py-2.5
                          rounded-xl
                          border
                          border-gray-200
                          bg-white
                          text-xs
                          font-semibold
                          text-gray-700
                          outline-none
                          focus:border-green-500
                          focus:ring-2
                          focus:ring-green-100
                        "
                      />
                    </div>
                  </div>
                )}

              {/* CUSTOM START DATE */}

              {period === "custom" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                    From Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={14}
                      className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                    />

                    <input
                      type="date"
                      value={
                        customStartDate
                      }
                      onChange={(e) =>
                        setCustomStartDate(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        pl-9
                        pr-3
                        py-2.5
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        text-xs
                        font-semibold
                        text-gray-700
                        outline-none
                        focus:border-green-500
                        focus:ring-2
                        focus:ring-green-100
                      "
                    />
                  </div>
                </div>
              )}

              {/* CUSTOM END DATE */}

              {period === "custom" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                    To Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={14}
                      className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                    />

                    <input
                      type="date"
                      value={
                        customEndDate
                      }
                      onChange={(e) =>
                        setCustomEndDate(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        pl-9
                        pr-3
                        py-2.5
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        text-xs
                        font-semibold
                        text-gray-700
                        outline-none
                        focus:border-green-500
                        focus:ring-2
                        focus:ring-green-100
                      "
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOM RANGE ERROR */}

            {customRangeError && (
              <div
                className="
                  px-4
                  py-3
                  rounded-xl
                  bg-red-50
                  border
                  border-red-100
                  text-xs
                  font-semibold
                  text-red-600
                "
              >
                {customRangeError}
              </div>
            )}
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
                    src="/school-logo.webp"
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
                    GENERATED ON
                  </p>

                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {formatDateTime(
                      generatedAt
                    )}
                  </p>

                  <p className="text-[11px] text-gray-500 mt-1">
                    By:{" "}
                    <span className="font-semibold text-gray-700">
                      {generatedBy}
                    </span>
                  </p>

                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {generatedByRole}
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

                {/* =========================================
                    REPORT INFORMATION
                ========================================= */}

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <ReportInfo
                    label="Generated By"
                    value={generatedBy}
                  />

                  <ReportInfo
                    label="Generated On"
                    value={formatDateTime(
                      generatedAt
                    )}
                  />

                  <ReportInfo
                    label="Report Period"
                    value={getPeriodLabel(
                      period
                    )}
                  />

                  <ReportInfo
                    label="Date Range"
                    value={displayDateRange}
                  />

                  <ReportInfo
                    label="Category"
                    value={
                      category ||
                      "All Categories"
                    }
                  />

                  <ReportInfo
                    label="Role"
                    value={
                      role ||
                      "All Roles"
                    }
                  />
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
                  icon={
                    <Activity size={17} />
                  }
                  label="Total Events"
                  value={
                    summary.total
                  }
                />

                <ReportSummary
                  icon={
                    <Users size={17} />
                  }
                  label="Roles Represented"
                  value={
                    summary.roles
                  }
                />

                <ReportSummary
                  icon={
                    <FileText size={17} />
                  }
                  label="Categories"
                  value={
                    summary.categories
                  }
                />

                <ReportSummary
                  icon={
                    <ShieldCheck
                      size={17}
                    />
                  }
                  label="Unique Actions"
                  value={
                    summary.actions
                  }
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
                        Performed By
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
                    {sortedLogs.map(
                      (log, index) => (
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
                              index %
                                2 ===
                              0
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
                                {formatShortDate(
                                  log.date
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                            {formatTime(
                              log.date
                            )}
                          </td>

                          {/* =================================
                              PERFORMED BY
                          ================================= */}

                          <td className="px-3 py-3 min-w-[180px]">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800">
                                {getSafeText(
                                  log.actorName,
                                  "Unknown User"
                                )}
                              </span>

                              {log?.user?.email && (
                                <span className="text-[10px] text-gray-400 mt-0.5">
                                  {log.user.email}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* =================================
                              ROLE
                          ================================= */}

                          <td className="px-3 py-3 whitespace-nowrap">
                            <RoleBadge
                              role={
                                log.role
                              }
                            />
                          </td>

                          {/* =================================
                              CATEGORY
                          ================================= */}

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
                              {getSafeText(
                                log.category
                              )}
                            </span>
                          </td>

                          {/* =================================
                              ACTION
                          ================================= */}

                          <td className="px-3 py-3 min-w-[180px]">
                            <p className="font-bold text-gray-800">
                              {getSafeText(
                                log.action
                              )}
                            </p>
                          </td>

                          {/* =================================
                              DETAILS
                          ================================= */}

                          <td className="px-3 py-3 min-w-[320px]">
                            <p className="text-gray-500 leading-relaxed whitespace-pre-wrap">
                              {getSafeText(
                                log.details
                              )}
                            </p>
                          </td>
                        </tr>
                      )
                    )}

                    {sortedLogs.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan="8"
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
                              No activity was
                              recorded for
                              the selected
                              period and
                              filters.
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
                <div>
                  <p className="text-[10px] text-gray-400">
                    Prepared by:{" "}
                    <span className="font-bold text-gray-600">
                      {generatedBy}
                    </span>
                  </p>

                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Generated on:{" "}
                    {formatDateTime(
                      generatedAt
                    )}
                  </p>
                </div>

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
   REPORT INFO
========================================================= */

const ReportInfo = ({
  label,
  value,
}) => (
  <div
    className="
      rounded-xl
      border
      border-gray-100
      bg-gray-50/60
      px-3
      py-2.5
    "
  >
    <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
      {label}
    </p>

    <p className="text-[11px] font-bold text-gray-700 mt-1 break-words">
      {value}
    </p>
  </div>
);

/* =========================================================
   REPORT SUMMARY
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

const RoleBadge = ({
  role,
}) => {
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
    dotStyles[role] ||
    "bg-gray-400";

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

