import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Printer,
  FileText,
  CalendarDays,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Download,
  UserRound,
  Clock3,
  CalendarRange,
  RefreshCw,
} from "lucide-react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { API } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

/* =========================================================
   DATE HELPERS
========================================================= */

const getLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getStartOfCurrentMonth = () => {
  const now = new Date();

  return getLocalDateInput(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
};

const formatDisplayDate = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatLongDate = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
};

/* =========================================================
   PDF COLOR HELPERS

   html2canvas currently has problems parsing modern CSS
   color functions such as:
   - oklab()
   - oklch()

   Tailwind CSS can generate these automatically.

   These helpers make sure the cloned PDF document does
   not contain unsupported color functions.
========================================================= */

const hasUnsupportedColorFunction = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  const normalized = value.toLowerCase();

  return (
    normalized.includes("oklab(") ||
    normalized.includes("oklch(")
  );
};

const sanitizePdfElementStyles = (element) => {
  try {
    const computed = window.getComputedStyle(element);

    /* =====================================================
       BACKGROUND
    ===================================================== */

    if (
      hasUnsupportedColorFunction(
        computed.backgroundColor,
      )
    ) {
      element.style.setProperty(
        "background-color",
        "#ffffff",
        "important",
      );
    }

    if (
      hasUnsupportedColorFunction(
        computed.backgroundImage,
      )
    ) {
      element.style.setProperty(
        "background-image",
        "none",
        "important",
      );
    }

    /* =====================================================
       TEXT
    ===================================================== */

    if (hasUnsupportedColorFunction(computed.color)) {
      element.style.setProperty(
        "color",
        "#111827",
        "important",
      );
    }

    /* =====================================================
       BORDERS
    ===================================================== */

    if (
      hasUnsupportedColorFunction(
        computed.borderTopColor,
      )
    ) {
      element.style.setProperty(
        "border-top-color",
        "#e5e7eb",
        "important",
      );
    }

    if (
      hasUnsupportedColorFunction(
        computed.borderRightColor,
      )
    ) {
      element.style.setProperty(
        "border-right-color",
        "#e5e7eb",
        "important",
      );
    }

    if (
      hasUnsupportedColorFunction(
        computed.borderBottomColor,
      )
    ) {
      element.style.setProperty(
        "border-bottom-color",
        "#e5e7eb",
        "important",
      );
    }

    if (
      hasUnsupportedColorFunction(
        computed.borderLeftColor,
      )
    ) {
      element.style.setProperty(
        "border-left-color",
        "#e5e7eb",
        "important",
      );
    }

    if (
      hasUnsupportedColorFunction(
        computed.borderColor,
      )
    ) {
      element.style.setProperty(
        "border-color",
        "#e5e7eb",
        "important",
      );
    }

    /* =====================================================
       SHADOWS
    ===================================================== */

    if (
      hasUnsupportedColorFunction(
        computed.boxShadow,
      )
    ) {
      element.style.setProperty(
        "box-shadow",
        "none",
        "important",
      );
    }

    if (
      hasUnsupportedColorFunction(
        computed.textShadow,
      )
    ) {
      element.style.setProperty(
        "text-shadow",
        "none",
        "important",
      );
    }

    /* =====================================================
       OUTLINE
    ===================================================== */

    if (
      hasUnsupportedColorFunction(
        computed.outlineColor,
      )
    ) {
      element.style.setProperty(
        "outline-color",
        "#e5e7eb",
        "important",
      );
    }

    /* =====================================================
       SVG COLORS
    ===================================================== */

    if (
      hasUnsupportedColorFunction(
        computed.fill,
      )
    ) {
      element.style.setProperty(
        "fill",
        "#111827",
        "important",
      );
    }

    if (
      hasUnsupportedColorFunction(
        computed.stroke,
      )
    ) {
      element.style.setProperty(
        "stroke",
        "#111827",
        "important",
      );
    }

    /* =====================================================
       CSS VARIABLES

       Tailwind v4 can store colors inside CSS variables.
       If one of those variables contains oklab/oklch,
       remove it from the PDF clone.
    ===================================================== */

    for (let index = 0; index < computed.length; index++) {
      const propertyName = computed[index];

      if (!propertyName?.startsWith("--")) {
        continue;
      }

      const propertyValue =
        computed.getPropertyValue(propertyName);

      if (hasUnsupportedColorFunction(propertyValue)) {
        element.style.removeProperty(propertyName);
      }
    }
  } catch {
    // Ignore individual element style failures.
  }
};

/* =========================================================
   REPORT STATUS HELPER
========================================================= */

const normalizeReportStatus = (report) => {
  if (
    report?.status === "accepted" ||
    report?.status === "under_review"
  ) {
    return "Accepted";
  }

  if (report?.status === "rejected") {
    return "Rejected";
  }

  return report?.status || "Unknown";
};

/* =========================================================
   REPORT DATE HELPER
========================================================= */

const getReportDate = (report) => {
  return (
    report?.date ||
    report?.createdAt ||
    report?.updatedAt ||
    null
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const PrintableReport = ({ onClose }) => {
  const { user } = useAuthStore();

  /* =======================================================
     FILTERS
  ======================================================= */

  const [status, setStatus] = useState("all");

  const [period, setPeriod] = useState("monthly");

  const [selectedDate, setSelectedDate] = useState(() =>
    getLocalDateInput(),
  );

  const [customStartDate, setCustomStartDate] = useState(() =>
    getStartOfCurrentMonth(),
  );

  const [customEndDate, setCustomEndDate] = useState(() =>
    getLocalDateInput(),
  );

  /* =======================================================
     REPORT DATA
  ======================================================= */

  const [reports, setReports] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
  });

  const [periodInfo, setPeriodInfo] = useState(null);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] = useState(false);

  const [downloading, setDownloading] = useState(false);

  const [customRangeError, setCustomRangeError] = useState("");

  const [generatedAt, setGeneratedAt] = useState(
    () => new Date(),
  );

  const printableContentRef = useRef(null);

  /* =======================================================
     GENERATED BY
  ======================================================= */

  const generatedBy = useMemo(() => {
    if (!user) {
      return "GuidEd Administrator";
    }

    const fullName = [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    if (user.name?.trim()) {
      return user.name.trim();
    }

    if (user.email?.trim()) {
      return user.email.trim();
    }

    return "GuidEd Administrator";
  }, [user]);

  const generatedRole = useMemo(() => {
    if (!user?.role) {
      return "Administrator";
    }

    return (
      user.role.charAt(0).toUpperCase() +
      user.role.slice(1)
    );
  }, [user]);

  /* =======================================================
     PERIOD LABEL
  ======================================================= */

  const periodLabel =
    period === "daily"
      ? "Daily"
      : period === "weekly"
        ? "Weekly"
        : period === "monthly"
          ? "Monthly"
          : period === "yearly"
            ? "Yearly"
            : "Custom Range";

  /* =======================================================
     STATUS LABEL
  ======================================================= */

  const statusLabel =
    status === "accepted"
      ? "Accepted"
      : status === "rejected"
        ? "Rejected"
        : "All Reviewed";

  /* =======================================================
     CUSTOM RANGE VALIDATION
  ======================================================= */

  const validateCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      return "Please select both a start date and an end date.";
    }

    const start = new Date(
      `${customStartDate}T00:00:00`,
    );

    const end = new Date(
      `${customEndDate}T23:59:59.999`,
    );

    if (Number.isNaN(start.getTime())) {
      return "The start date is invalid.";
    }

    if (Number.isNaN(end.getTime())) {
      return "The end date is invalid.";
    }

    if (start > end) {
      return "The start date cannot be later than the end date.";
    }

    return "";
  };

  /* =======================================================
     FETCH CUSTOM RANGE
     
     We use the existing yearly endpoint and filter the
     returned reports locally.
  ======================================================= */

  const fetchCustomRangeReports = async () => {
    const validationError = validateCustomRange();

    if (validationError) {
      setCustomRangeError(validationError);

      setReports([]);

      setSummary({
        total: 0,
        accepted: 0,
        rejected: 0,
      });

      setPeriodInfo({
        start: `${customStartDate}T00:00:00`,
        end: `${customEndDate}T23:59:59.999`,
      });

      return;
    }

    setCustomRangeError("");

    const start = new Date(
      `${customStartDate}T00:00:00`,
    );

    const end = new Date(
      `${customEndDate}T23:59:59.999`,
    );

    const startYear = start.getFullYear();

    const endYear = end.getFullYear();

    const years = [];

    for (
      let year = startYear;
      year <= endYear;
      year++
    ) {
      years.push(year);
    }

    const responses = await Promise.all(
      years.map((year) =>
        API.get("/api/reports/printable", {
          params: {
            status,
            period: "yearly",
            date: `${year}-01-01`,
          },
        }),
      ),
    );

    const allReports = responses.flatMap(
      (response) =>
        response.data?.reports || [],
    );

    /* =====================================================
       REMOVE DUPLICATES
    ===================================================== */

    const uniqueReports = Array.from(
      new Map(
        allReports.map((report, index) => [
          report?._id ||
            `${getReportDate(report)}-${index}`,
          report,
        ]),
      ).values(),
    );

    /* =====================================================
       FILTER BY CUSTOM RANGE
    ===================================================== */

    const filteredReports = uniqueReports.filter(
      (report) => {
        const reportDateValue =
          getReportDate(report);

        if (!reportDateValue) {
          return false;
        }

        const reportDate = new Date(
          reportDateValue,
        );

        if (
          Number.isNaN(reportDate.getTime())
        ) {
          return false;
        }

        return (
          reportDate >= start &&
          reportDate <= end
        );
      },
    );

    /* =====================================================
       CUSTOM SUMMARY
    ===================================================== */

    const accepted = filteredReports.filter(
      (report) =>
        normalizeReportStatus(report) ===
        "Accepted",
    ).length;

    const rejected = filteredReports.filter(
      (report) =>
        normalizeReportStatus(report) ===
        "Rejected",
    ).length;

    setReports(filteredReports);

    setSummary({
      total: filteredReports.length,
      accepted,
      rejected,
    });

    setPeriodInfo({
      start: `${customStartDate}T00:00:00`,
      end: `${customEndDate}T23:59:59.999`,
    });
  };

  /* =======================================================
     FETCH NORMAL REPORT
  ======================================================= */

  const fetchPrintableReports = async () => {
    setLoading(true);

    try {
      if (period === "custom") {
        await fetchCustomRangeReports();
      } else {
        setCustomRangeError("");

        const response = await API.get(
          "/api/reports/printable",
          {
            params: {
              status,
              period,
              date: selectedDate,
            },
          },
        );

        setReports(
          response.data?.reports || [],
        );

        setSummary(
          response.data?.summary || {
            total: 0,
            accepted: 0,
            rejected: 0,
          },
        );

        setPeriodInfo(
          response.data?.period || null,
        );
      }

      /*
       * Timestamp represents when this report
       * was generated.
       */

      setGeneratedAt(new Date());
    } catch (error) {
      console.error(
        "Failed to fetch printable reports:",
        error,
      );

      setReports([]);

      setSummary({
        total: 0,
        accepted: 0,
        rejected: 0,
      });

      alert(
        error?.response?.data?.message ||
          "Failed to generate report.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD REPORT WHEN FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    fetchPrintableReports();
  }, [
    status,
    period,
    selectedDate,
    customStartDate,
    customEndDate,
  ]);

  /* =======================================================
     FORMAT REPORT PERIOD
  ======================================================= */

  const formatPeriod = () => {
    if (period === "custom") {
      if (
        !customStartDate ||
        !customEndDate
      ) {
        return "Custom Range";
      }

      return `${formatLongDate(
        `${customStartDate}T00:00:00`,
      )} – ${formatLongDate(
        `${customEndDate}T00:00:00`,
      )}`;
    }

    if (!periodInfo) {
      return "Loading...";
    }

    const start = new Date(
      periodInfo.start,
    );

    const end = new Date(
      periodInfo.end,
    );

    if (Number.isNaN(start.getTime())) {
      return "N/A";
    }

    if (period === "daily") {
      return formatLongDate(start);
    }

    if (period === "yearly") {
      return start
        .getFullYear()
        .toString();
    }

    return `${formatDisplayDate(
      start,
    )} – ${formatDisplayDate(end)}`;
  };

  /* =======================================================
     GET EXACT DATE RANGE
  ======================================================= */

  const getDateRange = () => {
    if (period === "custom") {
      return `${formatDisplayDate(
        `${customStartDate}T00:00:00`,
      )} – ${formatDisplayDate(
        `${customEndDate}T00:00:00`,
      )}`;
    }

    if (!periodInfo) {
      return "Loading...";
    }

    return `${formatDisplayDate(
      periodInfo.start,
    )} – ${formatDisplayDate(
      periodInfo.end,
    )}`;
  };

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {
    const validationError =
      period === "custom"
        ? validateCustomRange()
        : "";

    if (validationError) {
      setCustomRangeError(
        validationError,
      );

      alert(validationError);

      return;
    }

    window.print();
  };

  /* =======================================================
     WAIT FOR IMAGES
  ======================================================= */

  const waitForImages = async (element) => {
    const images = Array.from(
      element.querySelectorAll("img"),
    );

    if (images.length === 0) {
      return;
    }

    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }

            img.onload = resolve;

            img.onerror = resolve;

            setTimeout(resolve, 3000);
          }),
      ),
    );
  };

  /* =======================================================
     PREPARE PDF CLONE
     
     This creates a PDF-only copy of the report and
     removes modern CSS color functions that html2canvas
     cannot parse.
  ======================================================= */

  const preparePdfClone = (
    originalElement,
  ) => {
    const clone =
      originalElement.cloneNode(true);

    clone.setAttribute(
      "data-pdf-clone",
      "true",
    );

    clone.style.position = "fixed";
    clone.style.left = "-100000px";
    clone.style.top = "0";

    clone.style.width = `${originalElement.scrollWidth}px`;
    clone.style.height = "auto";
    clone.style.maxHeight = "none";
    clone.style.overflow = "visible";

    clone.style.backgroundColor =
      "#ffffff";

    clone.style.color =
      "#111827";

    clone.style.padding = "32px";

    /*
     * Add a PDF-safe stylesheet directly to the clone.
     *
     * These values intentionally avoid:
     * - oklab()
     * - oklch()
     * - modern color functions
     */

    const safeStyle =
      document.createElement("style");

    safeStyle.setAttribute(
      "data-pdf-safe-style",
      "true",
    );

    safeStyle.textContent = `
      * {
        --tw-ring-color: #e5e7eb !important;
        --tw-ring-offset-color: #ffffff !important;
      }

      html,
      body {
        background: #ffffff !important;
        color: #111827 !important;
      }

      [class*="bg-"] {
        box-shadow: none;
      }

      img {
        max-width: 100%;
      }
    `;

    clone.prepend(safeStyle);

    document.body.appendChild(clone);

    /*
     * Sanitize every element.
     */

    const allElements = [
      clone,
      ...clone.querySelectorAll("*"),
    ];

    allElements.forEach(
      sanitizePdfElementStyles,
    );

    /*
     * Remove any inline style containing unsupported
     * color functions.
     */

    allElements.forEach((element) => {
      try {
        const inlineStyle =
          element.getAttribute("style");

        if (
          inlineStyle &&
          hasUnsupportedColorFunction(
            inlineStyle,
          )
        ) {
          /*
           * We cannot safely parse an arbitrary inline
           * style string, so clear it and let the
           * sanitized values above rebuild the important
           * visual properties.
           */

          const computed =
            window.getComputedStyle(
              element,
            );

          if (
            hasUnsupportedColorFunction(
              computed.color,
            )
          ) {
            element.style.color =
              "#111827";
          }

          if (
            hasUnsupportedColorFunction(
              computed.backgroundColor,
            )
          ) {
            element.style.backgroundColor =
              "#ffffff";
          }
        }
      } catch {
        // Ignore.
      }
    });

    return clone;
  };

  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  const handleDownloadPDF = async () => {
    if (!printableContentRef.current) {
      alert(
        "Unable to prepare the report for download.",
      );

      return;
    }

    if (loading || downloading) {
      return;
    }

    if (period === "custom") {
      const validationError =
        validateCustomRange();

      if (validationError) {
        setCustomRangeError(
          validationError,
        );

        alert(validationError);

        return;
      }
    }

    setDownloading(true);

    let clone = null;

    try {
      const originalElement =
        printableContentRef.current;

      /* ===================================================
         CREATE PDF-SAFE CLONE
      =================================================== */

      clone = preparePdfClone(
        originalElement,
      );

      /* ===================================================
         WAIT FOR IMAGES
      =================================================== */

      await waitForImages(clone);

      /*
       * Give the browser enough time to apply the
       * sanitized styles before html2canvas starts.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 300),
      );

      /* ===================================================
         CAPTURE
      =================================================== */

      const canvas =
        await html2canvas(clone, {
          scale: 2,

          backgroundColor:
            "#ffffff",

          useCORS: true,

          allowTaint: false,

          logging: false,

          imageTimeout: 15000,

          width:
            clone.scrollWidth,

          height:
            clone.scrollHeight,

          windowWidth:
            clone.scrollWidth,

          windowHeight:
            clone.scrollHeight,

          scrollX: 0,

          scrollY: 0,

          /*
           * html2canvas creates another internal clone.
           * Sanitize that clone too.
           */

          onclone: (
            clonedDocument,
          ) => {
            try {
              /*
               * Add another PDF-safe stylesheet to the
               * internal html2canvas document.
               */

              const internalSafeStyle =
                clonedDocument.createElement(
                  "style",
                );

              internalSafeStyle.textContent = `
                *,
                *::before,
                *::after {
                  --tw-ring-color: #e5e7eb !important;
                  --tw-ring-offset-color: #ffffff !important;
                }

                html,
                body {
                  background: #ffffff !important;
                  color: #111827 !important;
                }
              `;

              clonedDocument.head.appendChild(
                internalSafeStyle,
              );

              const clonedElements = [
                clonedDocument.documentElement,
                clonedDocument.body,
                ...clonedDocument.querySelectorAll(
                  "*",
                ),
              ];

              clonedElements.forEach(
                (element) => {
                  try {
                    const computed =
                      clonedDocument.defaultView.getComputedStyle(
                        element,
                      );

                    /*
                     * Background color
                     */

                    if (
                      hasUnsupportedColorFunction(
                        computed.backgroundColor,
                      )
                    ) {
                      element.style.setProperty(
                        "background-color",
                        "#ffffff",
                        "important",
                      );
                    }

                    /*
                     * Background image / gradients
                     */

                    if (
                      hasUnsupportedColorFunction(
                        computed.backgroundImage,
                      )
                    ) {
                      element.style.setProperty(
                        "background-image",
                        "none",
                        "important",
                      );
                    }

                    /*
                     * Text
                     */

                    if (
                      hasUnsupportedColorFunction(
                        computed.color,
                      )
                    ) {
                      element.style.setProperty(
                        "color",
                        "#111827",
                        "important",
                      );
                    }

                    /*
                     * Borders
                     */

                    if (
                      hasUnsupportedColorFunction(
                        computed.borderColor,
                      )
                    ) {
                      element.style.setProperty(
                        "border-color",
                        "#e5e7eb",
                        "important",
                      );
                    }

                    if (
                      hasUnsupportedColorFunction(
                        computed.borderTopColor,
                      )
                    ) {
                      element.style.setProperty(
                        "border-top-color",
                        "#e5e7eb",
                        "important",
                      );
                    }

                    if (
                      hasUnsupportedColorFunction(
                        computed.borderRightColor,
                      )
                    ) {
                      element.style.setProperty(
                        "border-right-color",
                        "#e5e7eb",
                        "important",
                      );
                    }

                    if (
                      hasUnsupportedColorFunction(
                        computed.borderBottomColor,
                      )
                    ) {
                      element.style.setProperty(
                        "border-bottom-color",
                        "#e5e7eb",
                        "important",
                      );
                    }

                    if (
                      hasUnsupportedColorFunction(
                        computed.borderLeftColor,
                      )
                    ) {
                      element.style.setProperty(
                        "border-left-color",
                        "#e5e7eb",
                        "important",
                      );
                    }

                    /*
                     * Shadows
                     */

                    if (
                      hasUnsupportedColorFunction(
                        computed.boxShadow,
                      )
                    ) {
                      element.style.setProperty(
                        "box-shadow",
                        "none",
                        "important",
                      );
                    }

                    if (
                      hasUnsupportedColorFunction(
                        computed.textShadow,
                      )
                    ) {
                      element.style.setProperty(
                        "text-shadow",
                        "none",
                        "important",
                      );
                    }

                    /*
                     * Outline
                     */

                    if (
                      hasUnsupportedColorFunction(
                        computed.outlineColor,
                      )
                    ) {
                      element.style.setProperty(
                        "outline-color",
                        "#e5e7eb",
                        "important",
                      );
                    }

                    /*
                     * SVG
                     */

                    if (
                      hasUnsupportedColorFunction(
                        computed.fill,
                      )
                    ) {
                      element.style.setProperty(
                        "fill",
                        "#111827",
                        "important",
                      );
                    }

                    if (
                      hasUnsupportedColorFunction(
                        computed.stroke,
                      )
                    ) {
                      element.style.setProperty(
                        "stroke",
                        "#111827",
                        "important",
                      );
                    }

                    /*
                     * CSS variables
                     */

                    for (
                      let index = 0;
                      index <
                      computed.length;
                      index++
                    ) {
                      const propertyName =
                        computed[index];

                      if (
                        !propertyName?.startsWith(
                          "--",
                        )
                      ) {
                        continue;
                      }

                      const propertyValue =
                        computed.getPropertyValue(
                          propertyName,
                        );

                      if (
                        hasUnsupportedColorFunction(
                          propertyValue,
                        )
                      ) {
                        element.style.removeProperty(
                          propertyName,
                        );
                      }
                    }
                  } catch {
                    // Ignore individual failures.
                  }
                },
              );
            } catch (cloneError) {
              console.warn(
                "PDF internal clone sanitization warning:",
                cloneError,
              );
            }
          },
        });

      /* ===================================================
         VALIDATE CANVAS
      =================================================== */

      if (
        !canvas ||
        canvas.width <= 0 ||
        canvas.height <= 0
      ) {
        throw new Error(
          "PDF canvas is empty.",
        );
      }

      /* ===================================================
         CREATE A4 PDF
      =================================================== */

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 10;

      const usableWidth =
        pageWidth - margin * 2;

      const usableHeight =
        pageHeight - margin * 2;

      const pixelsPerMM =
        canvas.width /
        usableWidth;

      const pageCanvasHeight =
        Math.floor(
          usableHeight *
            pixelsPerMM,
        );

      let currentY = 0;

      let pageNumber = 0;

      /* ===================================================
         SPLIT INTO PAGES
      =================================================== */

      while (
        currentY < canvas.height
      ) {
        pageNumber++;

        const remainingHeight =
          canvas.height -
          currentY;

        const currentPageHeight =
          Math.min(
            pageCanvasHeight,
            remainingHeight,
          );

        const pageCanvas =
          document.createElement(
            "canvas",
          );

        pageCanvas.width =
          canvas.width;

        pageCanvas.height =
          currentPageHeight;

        const context =
          pageCanvas.getContext(
            "2d",
          );

        if (!context) {
          throw new Error(
            "Unable to create PDF page.",
          );
        }

        context.fillStyle =
          "#ffffff";

        context.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height,
        );

        context.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          currentPageHeight,
          0,
          0,
          canvas.width,
          currentPageHeight,
        );

        const pageImage =
          pageCanvas.toDataURL(
            "image/jpeg",
            0.92,
          );

        if (pageNumber > 1) {
          pdf.addPage();
        }

        const imageHeight =
          currentPageHeight /
          pixelsPerMM;

        pdf.addImage(
          pageImage,
          "JPEG",
          margin,
          margin,
          usableWidth,
          imageHeight,
          undefined,
          "FAST",
        );

        currentY +=
          currentPageHeight;
      }

      /* ===================================================
         PAGE NUMBERS
      =================================================== */

      const pageCount =
        pdf.internal.getNumberOfPages();

      for (
        let page = 1;
        page <= pageCount;
        page++
      ) {
        pdf.setPage(page);

        pdf.setFont(
          "helvetica",
          "normal",
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          140,
          140,
          140,
        );

        pdf.text(
          `GuidEd Student Guidance System | Page ${page} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          {
            align: "center",
          },
        );
      }

      /* ===================================================
         FILE NAME
      =================================================== */

      let filePart;

      if (period === "custom") {
        filePart = `${customStartDate}-to-${customEndDate}`;
      } else {
        filePart =
          selectedDate ||
          getLocalDateInput();
      }

      const safeFilePart =
        filePart.replace(
          /[^a-zA-Z0-9-_]/g,
          "-",
        );

      const fileName =
        `GuidEd-Student-Report-${period}-${safeFilePart}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error(
        "PDF GENERATION FAILED:",
        error,
      );

      alert(
        `Failed to generate the PDF.\n\n${
          error?.message ||
          "Unknown error occurred."
        }`,
      );
    } finally {
      /* =================================================
         ALWAYS REMOVE TEMPORARY CLONES
      ================================================= */

      if (
        clone &&
        clone.parentNode
      ) {
        clone.parentNode.removeChild(
          clone,
        );
      }

      const leftovers =
        document.querySelectorAll(
          '[data-pdf-clone="true"]',
        );

      leftovers.forEach(
        (leftover) => {
          try {
            leftover.remove();
          } catch {
            // Ignore cleanup failures.
          }
        },
      );

      setDownloading(false);
    }
  };

  /* =======================================================
     STUDENT NAME
  ======================================================= */

  const getStudentName = (report) => {
    if (report?.studentName) {
      return report.studentName;
    }

    const student =
      report?.studentId;

    if (!student) {
      return "Unknown Student";
    }

    return (
      [
        student.firstName,
        student.middleName,
        student.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      student.name ||
      "Unknown Student"
    );
  };

  /* =======================================================
     REPORTER NAME
  ======================================================= */

  const getReporterName = (report) => {
    const reporter =
      report?.reporterId ||
      report?.reporter ||
      report?.reporterUser ||
      null;

    if (
      !reporter ||
      typeof reporter === "string"
    ) {
      return "Anonymous";
    }

    const fullName = [
      reporter.firstName,
      reporter.middleName,
      reporter.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    if (reporter.name?.trim()) {
      return reporter.name.trim();
    }

    if (reporter.email?.trim()) {
      return reporter.email.trim();
    }

    return "Anonymous";
  };

  /* =======================================================
     STATUS STYLE
  ======================================================= */

  const getStatusClasses = (
    reportStatus,
  ) => {
    if (
      reportStatus === "Accepted"
    ) {
      return "bg-green-50 text-green-700 border-green-100";
    }

    if (
      reportStatus === "Rejected"
    ) {
      return "bg-red-50 text-red-700 border-red-100";
    }

    return "bg-gray-50 text-gray-600 border-gray-100";
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ===================================================
          PRINT STYLES
      =================================================== */}

      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            .printable-report,
            .printable-report * {
              visibility: visible !important;
            }

            .printable-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              background: white !important;
              padding: 25px !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            .print-controls {
              display: none !important;
            }

            .print-report-table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            .print-report-table th,
            .print-report-table td {
              border: 1px solid #d1d5db !important;
              padding: 8px !important;
              font-size: 10px !important;
            }

            .print-report-table th {
              background: #f0fdf4 !important;
              color: #166534 !important;
              font-weight: 700 !important;
            }

            .print-summary-card {
              border: 1px solid #d1d5db !important;
              box-shadow: none !important;
            }

            .printable-document {
              overflow: visible !important;
            }

            @page {
              size: A4;
              margin: 12mm;
            }
          }
        `}
      </style>

      {/* ===================================================
          MODAL
      =================================================== */}

      <div
        className="
          fixed
          inset-0
          z-[100]
          bg-black/40
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-3
          sm:p-5
        "
      >
        <div
          className="
            printable-report
            bg-white
            w-full
            max-w-6xl
            max-h-[95vh]
            overflow-hidden
            rounded-3xl
            shadow-2xl
            flex
            flex-col
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              print-controls
              px-5
              sm:px-7
              py-4
              sm:py-5
              border-b
              border-gray-100
              flex
              items-center
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
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FileText size={20} />
              </div>

              <div>
                <h2 className="font-extrabold text-gray-900">
                  Printable Report
                </h2>

                <p className="text-xs text-gray-400 mt-0.5">
                  Review the report details before
                  printing or exporting.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="
                w-10
                h-10
                rounded-xl
                bg-gray-50
                hover:bg-gray-100
                flex
                items-center
                justify-center
                text-gray-500
                transition
              "
            >
              <X size={18} />
            </button>
          </div>

          {/* =================================================
              FILTER / CONTROL PANEL
          ================================================= */}

          <div
            className="
              print-controls
              p-4
              sm:p-6
              border-b
              border-gray-100
              bg-gray-50/70
            "
          >
            {/* PERIOD QUICK SELECT */}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500">
                  Report Period
                </p>

                <span className="text-[10px] text-gray-400 font-semibold">
                  {periodLabel}
                </span>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-5
                  gap-2
                "
              >
                {[
                  {
                    value: "daily",
                    label: "Daily",
                  },
                  {
                    value: "weekly",
                    label: "Weekly",
                  },
                  {
                    value: "monthly",
                    label: "Monthly",
                  },
                  {
                    value: "yearly",
                    label: "Yearly",
                  },
                  {
                    value: "custom",
                    label: "Custom Range",
                  },
                ].map((option) => {
                  const active =
                    period ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        setPeriod(
                          option.value,
                        )
                      }
                      className={`
                        h-10
                        rounded-xl
                        border
                        text-xs
                        font-bold
                        transition
                        ${
                          active
                            ? "bg-green-600 text-white border-green-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FILTERS */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-3
              "
            >
              {/* STATUS */}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Report Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value,
                    )
                  }
                  className="
                    w-full
                    h-11
                    px-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-sm
                    outline-none
                    focus:border-green-300
                    focus:ring-2
                    focus:ring-green-50
                  "
                >
                  <option value="all">
                    All Reviewed
                  </option>

                  <option value="accepted">
                    Accepted
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>
              </div>

              {/* NORMAL DATE */}

              {period !== "custom" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Reference Date
                  </label>

                  <div
                    className="
                      h-11
                      px-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <CalendarDays
                      size={16}
                      className="text-gray-400"
                    />

                    <input
                      type="date"
                      value={
                        selectedDate
                      }
                      onChange={(e) =>
                        setSelectedDate(
                          e.target.value,
                        )
                      }
                      className="
                        w-full
                        bg-transparent
                        outline-none
                        text-sm
                        text-gray-700
                      "
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* CUSTOM FROM */}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      From Date
                    </label>

                    <div
                      className="
                        h-11
                        px-3
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <CalendarRange
                        size={16}
                        className="text-gray-400"
                      />

                      <input
                        type="date"
                        value={
                          customStartDate
                        }
                        onChange={(e) =>
                          setCustomStartDate(
                            e.target.value,
                          )
                        }
                        className="
                          w-full
                          bg-transparent
                          outline-none
                          text-sm
                          text-gray-700
                        "
                      />
                    </div>
                  </div>

                  {/* CUSTOM TO */}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      To Date
                    </label>

                    <div
                      className="
                        h-11
                        px-3
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <CalendarRange
                        size={16}
                        className="text-gray-400"
                      />

                      <input
                        type="date"
                        value={
                          customEndDate
                        }
                        onChange={(e) =>
                          setCustomEndDate(
                            e.target.value,
                          )
                        }
                        className="
                          w-full
                          bg-transparent
                          outline-none
                          text-sm
                          text-gray-700
                        "
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* CUSTOM ERROR */}

            {customRangeError && (
              <div
                className="
                  mt-3
                  px-3
                  py-2.5
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

            {/* ACTIONS */}

            <div
              className="
                flex
                flex-col
                sm:flex-row
                justify-end
                gap-2
                mt-4
              "
            >
              <button
                onClick={
                  handleDownloadPDF
                }
                disabled={
                  loading ||
                  downloading ||
                  !!customRangeError
                }
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  h-11
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-gray-300
                  disabled:cursor-not-allowed
                  text-white
                  text-sm
                  font-bold
                  transition
                  shadow-sm
                "
              >
                <Download size={17} />

                {downloading
                  ? "Preparing PDF..."
                  : "Download PDF"}
              </button>

              <button
                onClick={
                  handlePrint
                }
                disabled={
                  loading ||
                  downloading ||
                  !!customRangeError
                }
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  h-11
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  hover:border-green-200
                  hover:bg-green-50
                  hover:text-green-700
                  disabled:bg-gray-100
                  disabled:text-gray-400
                  disabled:cursor-not-allowed
                  text-gray-700
                  text-sm
                  font-bold
                  transition
                "
              >
                <Printer size={17} />

                {loading
                  ? "Generating..."
                  : "Print Report"}
              </button>
            </div>
          </div>

          {/* =================================================
              PRINTABLE DOCUMENT
          ================================================= */}

          <div
            ref={
              printableContentRef
            }
            className="
              printable-document
              flex-1
              overflow-y-auto
              p-5
              sm:p-8
              bg-white
            "
          >
            {/* =================================================
                REPORT HEADER
            ================================================= */}

            <div className="text-center">
              <img
                src="/school-logo.png"
                alt="School Logo"
                crossOrigin="anonymous"
                className="
                  w-16
                  h-16
                  mx-auto
                  object-contain
                  mb-3
                "
              />

              <h1
                className="
                  text-lg
                  sm:text-xl
                  font-extrabold
                  text-gray-900
                "
              >
                OUR LADY OF THE HOLY ROSARY SCHOOL
              </h1>

              <p className="text-xs text-gray-500 font-medium">
                GENERAL TRIAS CAMPUS
              </p>

              <div className="mt-5">
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-1.5
                    rounded-full
                    bg-green-50
                    border
                    border-green-100
                    text-green-700
                    text-[10px]
                    font-bold
                  "
                >
                  <FileText size={12} />

                  GuidEd · Student Guidance
                </div>

                <h2
                  className="
                    text-xl
                    sm:text-2xl
                    font-extrabold
                    text-gray-900
                    mt-3
                  "
                >
                  STUDENT REPORT SUMMARY
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Student discipline and incident
                  report overview.
                </p>
              </div>
            </div>

            {/* =================================================
                REPORT INFORMATION
            ================================================= */}

            <div
              className="
                mt-6
                rounded-2xl
                border
                border-gray-100
                bg-gray-50/70
                p-4
              "
            >
              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-4
                  gap-4
                "
              >
                <ReportInfo
                  icon={
                    <CalendarDays
                      size={15}
                    />
                  }
                  label="Report Period"
                  value={
                    periodLabel
                  }
                  detail={formatPeriod()}
                />

                <ReportInfo
                  icon={
                    <CalendarRange
                      size={15}
                    />
                  }
                  label="Date Range"
                  value={
                    getDateRange()
                  }
                  detail="Records covered"
                />

                <ReportInfo
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  label="Generated By"
                  value={
                    generatedBy
                  }
                  detail={
                    generatedRole
                  }
                />

                <ReportInfo
                  icon={
                    <Clock3
                      size={15}
                    />
                  }
                  label="Generated On"
                  value={formatDateTime(
                    generatedAt,
                  )}
                  detail={
                    statusLabel
                  }
                />
              </div>
            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-3
                gap-3
                mt-5
              "
            >
              <SummaryCard
                title="Total Reviewed"
                value={
                  summary.total
                }
                icon={
                  <ClipboardList
                    size={17}
                  />
                }
              />

              <SummaryCard
                title="Accepted"
                value={
                  summary.accepted
                }
                icon={
                  <CheckCircle2
                    size={17}
                  />
                }
              />

              <SummaryCard
                title="Rejected"
                value={
                  summary.rejected
                }
                icon={
                  <XCircle
                    size={17}
                  />
                }
              />
            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="mt-6">
              {loading ? (
                <div className="py-16 text-center">
                  <div
                    className="
                      w-9
                      h-9
                      mx-auto
                      rounded-full
                      border-[3px]
                      border-green-500
                      border-t-transparent
                      animate-spin
                    "
                  />

                  <p className="text-sm text-gray-500 mt-3">
                    Generating report...
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Preparing the selected date range.
                  </p>
                </div>
              ) : reports.length ===
                0 ? (
                <div
                  className="
                    py-16
                    text-center
                    border
                    border-dashed
                    border-gray-200
                    rounded-2xl
                  "
                >
                  <FileText
                    size={30}
                    className="mx-auto text-gray-300"
                  />

                  <p className="text-sm font-bold text-gray-700 mt-3">
                    No reviewed reports found
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Try another date, period, or
                    status.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="print-report-table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-green-50">
                        <th className="border border-green-100 px-3 py-2.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          #
                        </th>

                        <th className="border border-green-100 px-3 py-2.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          Student
                        </th>

                        <th className="border border-green-100 px-3 py-2.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          Offense
                        </th>

                        <th className="border border-green-100 px-3 py-2.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          Location
                        </th>

                        <th className="border border-green-100 px-3 py-2.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          Date
                        </th>

                        <th className="border border-green-100 px-3 py-2.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          Reporter
                        </th>

                        <th className="border border-green-100 px-3 py-2.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {reports.map(
                        (
                          report,
                          index,
                        ) => {
                          const reportStatus =
                            normalizeReportStatus(
                              report,
                            );

                          return (
                            <tr
                              key={
                                report._id ||
                                index
                              }
                              className="hover:bg-gray-50"
                            >
                              <td className="border border-gray-100 px-3 py-2.5 text-xs text-gray-500">
                                {index +
                                  1}
                              </td>

                              <td className="border border-gray-100 px-3 py-2.5 text-xs font-bold text-gray-900">
                                {getStudentName(
                                  report,
                                )}
                              </td>

                              <td className="border border-gray-100 px-3 py-2.5 text-xs text-gray-700">
                                {report.offense ||
                                  "N/A"}
                              </td>

                              <td className="border border-gray-100 px-3 py-2.5 text-xs text-gray-600">
                                {report.location ||
                                  "N/A"}
                              </td>

                              <td className="border border-gray-100 px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                                {formatDisplayDate(
                                  getReportDate(
                                    report,
                                  ),
                                )}
                              </td>

                              <td className="border border-gray-100 px-3 py-2.5 text-xs text-gray-600">
                                {getReporterName(
                                  report,
                                )}
                              </td>

                              <td className="border border-gray-100 px-3 py-2.5 text-xs">
                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    px-2
                                    py-1
                                    rounded-full
                                    border
                                    text-[10px]
                                    font-bold
                                    ${getStatusClasses(
                                      reportStatus,
                                    )}
                                  `}
                                >
                                  {
                                    reportStatus
                                  }
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* =================================================
                REPORT FOOTER
            ================================================= */}

            <div
              className="
                mt-8
                pt-5
                border-t
                border-gray-200
                flex
                flex-col
                sm:flex-row
                justify-between
                gap-5
              "
            >
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="
                      w-7
                      h-7
                      rounded-lg
                      bg-green-50
                      text-green-600
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <UserRound
                      size={14}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Prepared By
                    </p>

                    <p className="text-xs font-bold text-gray-800 mt-0.5">
                      {generatedBy}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 mt-2 ml-9">
                  {generatedRole}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-center gap-2 sm:justify-end">
                  <RefreshCw
                    size={13}
                    className="text-green-600"
                  />

                  <p className="text-xs font-extrabold text-gray-800">
                    GuidEd
                  </p>
                </div>

                <p className="text-[10px] text-gray-400 mt-1">
                  Student Discipline and Monitoring
                  System
                </p>

                <p className="text-[10px] text-gray-400 mt-0.5">
                  Generated{" "}
                  {formatDateTime(
                    generatedAt,
                  )}
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
  icon,
  label,
  value,
  detail,
}) => (
  <div
    className="
      rounded-xl
      bg-white
      border
      border-gray-100
      p-3
      min-w-0
    "
  >
    <div className="flex items-center gap-2">
      <div
        className="
          w-7
          h-7
          rounded-lg
          bg-green-50
          text-green-600
          flex
          items-center
          justify-center
          shrink-0
        "
      >
        {icon}
      </div>

      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
        {label}
      </p>
    </div>

    <p className="text-xs font-extrabold text-gray-900 mt-2 break-words">
      {value}
    </p>

    <p className="text-[10px] text-gray-400 mt-1 break-words">
      {detail}
    </p>
  </div>
);

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  title,
  value,
  icon,
}) => (
  <div
    className="
      print-summary-card
      border
      border-gray-100
      rounded-2xl
      p-4
      bg-white
      shadow-[0_4px_20px_rgba(0,0,0,0.025)]
    "
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
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

        <p className="text-xs font-semibold text-gray-400">
          {title}
        </p>
      </div>
    </div>

    <p className="text-2xl font-extrabold text-gray-900 mt-3">
      {value}
    </p>
  </div>
);

export default PrintableReport;