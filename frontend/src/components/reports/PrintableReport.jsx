import { useEffect, useState, useRef } from "react";
import {
  X,
  Printer,
  FileText,
  CalendarDays,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Download,
} from "lucide-react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { API } from "../../lib/api";

const PrintableReport = ({ onClose }) => {
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [reports, setReports] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
  });

  const [periodInfo, setPeriodInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /* =========================================================
     PDF REF
  ========================================================= */

  const printableContentRef = useRef(null);

  /* =========================================================
     FETCH PRINTABLE REPORT
  ========================================================= */

  const fetchPrintableReports = async () => {
    setLoading(true);

    try {
      const response = await API.get(
        `/api/reports/printable?status=${encodeURIComponent(
          status,
        )}&period=${encodeURIComponent(period)}&date=${encodeURIComponent(
          selectedDate,
        )}`,
      );

      setReports(response.data?.reports || []);

      setSummary(
        response.data?.summary || {
          total: 0,
          accepted: 0,
          rejected: 0,
        },
      );

      setPeriodInfo(response.data?.period || null);
    } catch (error) {
      console.error("Failed to fetch printable reports:", error);

      alert(error?.response?.data?.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD REPORTS WHEN FILTER CHANGES
  ========================================================= */

  useEffect(() => {
    fetchPrintableReports();
  }, [status, period, selectedDate]);

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================================================
     WAIT FOR IMAGES
  ========================================================= */

  const waitForImages = async (element) => {
    const images = Array.from(element.querySelectorAll("img"));

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

  /* =========================================================
     DOWNLOAD PDF
  ========================================================= */

  const handleDownloadPDF = async () => {
    if (!printableContentRef.current) {
      alert("Unable to prepare the report for download.");
      return;
    }

    if (loading) {
      return;
    }

    if (reports.length === 0) {
      alert("There are no reports available to download.");
      return;
    }

    if (downloading) {
      return;
    }

    setDownloading(true);

    try {
      const originalElement = printableContentRef.current;

      console.log("Starting PDF generation...");

      /*
       * =========================================================
       * CREATE A CLEAN PDF CONTAINER
       *
       * We do NOT capture the original scrollable element
       * directly. Instead, we clone it.
       * =========================================================
       */

      const clone = originalElement.cloneNode(true);

      /*
       * Remove React/UI-only behavior from the cloned element.
       */

      clone.style.position = "fixed";
      clone.style.left = "-100000px";
      clone.style.top = "0";
      clone.style.width = `${originalElement.scrollWidth}px`;
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.overflow = "visible";
      clone.style.backgroundColor = "#ffffff";
      clone.style.color = "#111827";
      clone.style.padding = "32px";

      /*
       * =========================================================
       * PUT CLONE INTO DOCUMENT
       * =========================================================
       */

      document.body.appendChild(clone);

      /*
       * =========================================================
       * REMOVE UNSUPPORTED CSS COLORS
       *
       * html2canvas cannot parse:
       *
       *   oklch(...)
       *   oklab(...)
       *
       * Some Tailwind/browser styles can contain these colors.
       * We explicitly replace them with normal RGB/HEX colors.
       * =========================================================
       */

      const allElements = [clone, ...clone.querySelectorAll("*")];

      allElements.forEach((element) => {
        try {
          const computed = window.getComputedStyle(element);

          /*
           * Background
           */

          if (
            computed.backgroundColor &&
            computed.backgroundColor.includes("oklch")
          ) {
            element.style.backgroundColor = "#ffffff";
          }

          /*
           * Text color
           */

          if (computed.color && computed.color.includes("oklch")) {
            element.style.color = "#111827";
          }

          /*
           * Border colors
           */

          if (
            computed.borderTopColor &&
            computed.borderTopColor.includes("oklch")
          ) {
            element.style.borderTopColor = "#e5e7eb";
          }

          if (
            computed.borderRightColor &&
            computed.borderRightColor.includes("oklch")
          ) {
            element.style.borderRightColor = "#e5e7eb";
          }

          if (
            computed.borderBottomColor &&
            computed.borderBottomColor.includes("oklch")
          ) {
            element.style.borderBottomColor = "#e5e7eb";
          }

          if (
            computed.borderLeftColor &&
            computed.borderLeftColor.includes("oklch")
          ) {
            element.style.borderLeftColor = "#e5e7eb";
          }

          /*
           * Box shadow
           */

          if (computed.boxShadow && computed.boxShadow.includes("oklch")) {
            element.style.boxShadow = "none";
          }

          /*
           * Text shadow
           */

          if (computed.textShadow && computed.textShadow.includes("oklch")) {
            element.style.textShadow = "none";
          }

          /*
           * Outline
           */

          if (
            computed.outlineColor &&
            computed.outlineColor.includes("oklch")
          ) {
            element.style.outlineColor = "#e5e7eb";
          }
        } catch (styleError) {
          console.warn("Could not process element style:", styleError);
        }
      });

      /*
       * =========================================================
       * WAIT FOR IMAGES
       * =========================================================
       */

      const images = clone.querySelectorAll("img");

      await Promise.all(
        Array.from(images).map(
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

      /*
       * Give the browser time to render the clone.
       */

      await new Promise((resolve) => setTimeout(resolve, 500));

      /*
       * =========================================================
       * CAPTURE CLONE
       * =========================================================
       */

      console.log("Capturing PDF-safe report...");

      const canvas = await html2canvas(clone, {
        scale: 2,

        backgroundColor: "#ffffff",

        useCORS: true,

        allowTaint: false,

        logging: false,

        imageTimeout: 15000,

        width: clone.scrollWidth,

        height: clone.scrollHeight,

        windowWidth: clone.scrollWidth,

        windowHeight: clone.scrollHeight,

        scrollX: 0,

        scrollY: 0,

        /*
         * IMPORTANT:
         * Force safe colors inside the html2canvas clone.
         */

        onclone: (clonedDocument) => {
          const clonedElements = [
            clonedDocument.documentElement,
            clonedDocument.body,
            ...clonedDocument.querySelectorAll("*"),
          ];

          clonedElements.forEach((el) => {
            try {
              const style = window.getComputedStyle(el);

              if (style.backgroundColor?.includes("oklch")) {
                el.style.backgroundColor = "#ffffff";
              }

              if (style.color?.includes("oklch")) {
                el.style.color = "#111827";
              }

              if (style.borderColor?.includes("oklch")) {
                el.style.borderColor = "#e5e7eb";
              }

              if (style.boxShadow?.includes("oklch")) {
                el.style.boxShadow = "none";
              }
            } catch {
              // Ignore individual style failures.
            }
          });
        },
      });

      /*
       * =========================================================
       * REMOVE CLONE
       * =========================================================
       */

      document.body.removeChild(clone);

      /*
       * =========================================================
       * VALIDATE CANVAS
       * =========================================================
       */

      if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
        throw new Error("PDF canvas is empty.");
      }

      console.log("Canvas generated:", canvas.width, "x", canvas.height);

      /*
       * =========================================================
       * CREATE A4 PDF
       * =========================================================
       */

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;

      const usableWidth = pageWidth - margin * 2;

      const usableHeight = pageHeight - margin * 2;

      /*
       * Determine how many canvas pixels correspond
       * to one PDF millimeter.
       */

      const pixelsPerMM = canvas.width / usableWidth;

      const pageCanvasHeight = Math.floor(usableHeight * pixelsPerMM);

      let currentY = 0;
      let pageNumber = 0;

      /*
       * =========================================================
       * SPLIT REPORT INTO PAGES
       * =========================================================
       */

      while (currentY < canvas.height) {
        pageNumber++;

        const remainingHeight = canvas.height - currentY;

        const currentPageHeight = Math.min(pageCanvasHeight, remainingHeight);

        const pageCanvas = document.createElement("canvas");

        pageCanvas.width = canvas.width;

        pageCanvas.height = currentPageHeight;

        const context = pageCanvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to create PDF page.");
        }

        /*
         * White background.
         */

        context.fillStyle = "#ffffff";

        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        /*
         * Copy the current section.
         */

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

        const pageImage = pageCanvas.toDataURL("image/jpeg", 0.92);

        if (pageNumber > 1) {
          pdf.addPage();
        }

        const imageHeight = currentPageHeight / pixelsPerMM;

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

        currentY += currentPageHeight;
      }

      /*
       * =========================================================
       * PAGE NUMBERS
       * =========================================================
       */

      const pageCount = pdf.internal.getNumberOfPages();

      for (let page = 1; page <= pageCount; page++) {
        pdf.setPage(page);

        pdf.setFont("helvetica", "normal");

        pdf.setFontSize(8);

        pdf.setTextColor(140, 140, 140);

        pdf.text(
          `GuidEd Student Guidance System | Page ${page} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          {
            align: "center",
          },
        );
      }

      /*
       * =========================================================
       * SAVE FILE
       * =========================================================
       */

      const datePart = selectedDate || new Date().toISOString().split("T")[0];

      const safeDatePart = datePart.replace(/[^a-zA-Z0-9-_]/g, "-");

      const fileName = `GuidEd-Student-Report-${safeDatePart}.pdf`;

      console.log("Saving PDF:", fileName);

      pdf.save(fileName);

      console.log("PDF successfully generated.");
    } catch (error) {
      console.error("====================================");

      console.error("PDF GENERATION FAILED");

      console.error(error);

      console.error("Message:", error?.message);

      console.error("====================================");

      /*
       * Remove any leftover clone if generation failed.
       */

      const leftover = document.querySelector('[data-pdf-clone="true"]');

      if (leftover) {
        leftover.remove();
      }

      alert(
        `Failed to generate the PDF.\n\n${
          error?.message || "Unknown error occurred."
        }`,
      );
    } finally {
      setDownloading(false);
    }
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* =========================================================
     FORMAT PERIOD
  ========================================================= */

  const formatPeriod = () => {
    if (!periodInfo) {
      return "Loading...";
    }

    const start = new Date(periodInfo.start);

    const end = new Date(periodInfo.end);

    if (period === "daily") {
      return start.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    if (period === "yearly") {
      return start.getFullYear().toString();
    }

    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} – ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  /* =========================================================
     STATUS LABEL
  ========================================================= */

  const statusLabel =
    status === "accepted"
      ? "Accepted"
      : status === "rejected"
        ? "Rejected"
        : "All Reviewed";

  /* =========================================================
     REPORT STATUS
  ========================================================= */

  const getReportStatus = (report) => {
    if (report.status === "accepted" || report.status === "under_review") {
      return "Accepted";
    }

    if (report.status === "rejected") {
      return "Rejected";
    }

    return report.status || "Unknown";
  };

  /* =========================================================
     STUDENT NAME
  ========================================================= */

  const getStudentName = (report) => {
    if (report.studentName) {
      return report.studentName;
    }

    const student = report.studentId;

    if (!student) {
      return "Unknown Student";
    }

    return (
      [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ") ||
      student.name ||
      "Unknown Student"
    );
  };

  /* =========================================================
     REPORTER NAME
  ========================================================= */

  const getReporterName = (report) => {
    /*
     * The printable endpoint may return the reporter in
     * different structures depending on how the report
     * was populated.
     */

    const reporter =
      report.reporterId || report.reporter || report.reporterUser || null;

    /*
     * If reporterId is only an ObjectId/string, there is
     * no name available in the frontend.
     */

    if (!reporter || typeof reporter === "string") {
      return "Anonymous";
    }

    /*
     * Build the user's complete name.
     */

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

    /*
     * Some older User records may only have `name`.
     */

    if (reporter.name?.trim()) {
      return reporter.name.trim();
    }

    /*
     * Last useful fallback.
     */

    if (reporter.email?.trim()) {
      return reporter.email.trim();
    }

    return "Anonymous";
  };

  return (
    <>
      {/* =====================================================
          PRINT STYLES
      ===================================================== */}

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
              padding: 30px !important;
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
              background: #f3f4f6 !important;
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

      {/* =====================================================
          SCREEN MODAL
      ===================================================== */}

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
                  w-10
                  h-10
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <Printer size={19} />
              </div>

              <div>
                <h2 className="font-extrabold text-gray-900">
                  Printable Report
                </h2>

                <p className="text-xs text-gray-400 mt-0.5">
                  Generate a report summary for printing or PDF.
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
              CONTROLS
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
            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-3
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
                  onChange={(e) => setStatus(e.target.value)}
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
                  <option value="all">All Reviewed</option>

                  <option value="accepted">Accepted</option>

                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* PERIOD */}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Report Period
                </label>

                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
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
                  <option value="daily">Daily</option>

                  <option value="weekly">Weekly</option>

                  <option value="monthly">Monthly</option>

                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* DATE */}

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
                  <CalendarDays size={16} className="text-gray-400" />

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
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
            </div>

            {/* ACTION BUTTONS */}

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
              {/* DOWNLOAD PDF */}

              <button
                onClick={handleDownloadPDF}
                disabled={loading || downloading || reports.length === 0}
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

                {downloading ? "Preparing PDF..." : "Download PDF"}
              </button>

              {/* PRINT */}

              <button
                onClick={handlePrint}
                disabled={loading || downloading || reports.length === 0}
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

                {loading ? "Generating..." : "Print Report"}
              </button>
            </div>
          </div>

          {/* =================================================
              PRINTABLE DOCUMENT
          ================================================= */}

          <div
            ref={printableContentRef}
            className="
              printable-document
              flex-1
              overflow-y-auto
              p-5
              sm:p-8
              bg-white
            "
          >
            {/* SCHOOL HEADER */}

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
                <h2
                  className="
                    text-xl
                    sm:text-2xl
                    font-extrabold
                    text-gray-900
                  "
                >
                  STUDENT REPORT SUMMARY
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  GuidEd · Student Guidance
                </p>
              </div>
            </div>

            {/* PERIOD INFORMATION */}

            <div
              className="
                mt-6
                p-4
                rounded-2xl
                bg-gray-50
                border
                border-gray-100
              "
            >
              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-3
                  gap-3
                "
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Report Period
                  </p>

                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatPeriod()}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Status
                  </p>

                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {statusLabel}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Generated
                  </p>

                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {new Date().toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* SUMMARY */}

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
                value={summary.total}
                icon={<ClipboardList size={17} />}
              />

              <SummaryCard
                title="Accepted"
                value={summary.accepted}
                icon={<CheckCircle2 size={17} />}
              />

              <SummaryCard
                title="Rejected"
                value={summary.rejected}
                icon={<XCircle size={17} />}
              />
            </div>

            {/* TABLE */}

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
                </div>
              ) : reports.length === 0 ? (
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
                  <FileText size={30} className="mx-auto text-gray-300" />

                  <p className="text-sm font-bold text-gray-700 mt-3">
                    No reviewed reports found
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Try another date, period, or status.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="print-report-table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">
                          #
                        </th>

                        <th className="border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">
                          Student
                        </th>

                        <th className="border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">
                          Offense
                        </th>

                        <th className="border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">
                          Location
                        </th>

                        <th className="border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">
                          Date
                        </th>

                        <th className="border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">
                          Reporter
                        </th>

                        <th className="border border-gray-200 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {reports.map((report, index) => {
                        const reportStatus = getReportStatus(report);

                        return (
                          <tr key={report._id || index}>
                            <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">
                              {index + 1}
                            </td>

                            <td className="border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-900">
                              {getStudentName(report)}
                            </td>

                            <td className="border border-gray-200 px-3 py-2 text-xs text-gray-700">
                              {report.offense || "N/A"}
                            </td>

                            <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">
                              {report.location || "N/A"}
                            </td>

                            <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                              {formatDate(report.date || report.createdAt)}
                            </td>

                            <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">
                              {getReporterName(report)}
                            </td>

                            <td className="border border-gray-200 px-3 py-2 text-xs font-bold">
                              {reportStatus}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* FOOTER */}

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
                gap-4
              "
            >
              <div>
                <p className="text-xs font-bold text-gray-700">Prepared by:</p>

                <p className="text-xs text-gray-500 mt-1">
                  GuidEd Administrator
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-gray-700">EduGuard</p>

                <p className="text-[10px] text-gray-400 mt-1">
                  Student Discipline and Monitoring System
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
   SUMMARY CARD
========================================================= */

const SummaryCard = ({ title, value, icon }) => (
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
    <div className="flex items-center gap-2">
      <div
        className="
          w-8
          h-8
          rounded-lg
          bg-gray-50
          text-gray-500
          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>

      <p className="text-xs font-semibold text-gray-400">{title}</p>
    </div>

    <p className="text-2xl font-extrabold text-gray-900 mt-3">{value}</p>
  </div>
);

export default PrintableReport;
