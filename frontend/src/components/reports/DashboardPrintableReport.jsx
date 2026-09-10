import {
  X,
  Printer,
  FileText,
  Users,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Download,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DashboardPrintableReport = ({
  students = [],
  reports = [],
  incidents = [],
  topRisk = [],
  getRisk,
  onClose,
}) => {
  const safeGetRisk = (student) => {
    if (typeof getRisk === "function") {
      return getRisk(student);
    }

    const count = Number(student?.totalIncidents || 0);

    if (count >= 5) return "High";
    if (count >= 2) return "Medium";

    return "Low";
  };

  /* =========================================================
     KPI
  ========================================================= */

  const kpi = {
    total: students.length,

    high: students.filter(
      (student) => safeGetRisk(student) === "High",
    ).length,

    medium: students.filter(
      (student) => safeGetRisk(student) === "Medium",
    ).length,

    low: students.filter(
      (student) => safeGetRisk(student) === "Low",
    ).length,
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
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

  const getStudentName = (student) => {
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
        .join(" ")
        .trim() ||
      student.name ||
      "Unknown Student"
    );
  };

  const getStudentId = (student) => {
    return (
      student?.studentId ||
      student?.id ||
      student?._id ||
      "N/A"
    );
  };

  const getReportDate = (report) => {
    return (
      report?.date ||
      report?.incidentDate ||
      report?.createdAt ||
      report?.updatedAt
    );
  };

  const getOffense = (report) => {
    return (
      report?.offense ||
      report?.incidentType ||
      report?.violation ||
      report?.reason ||
      "N/A"
    );
  };

  const getLocation = (report) => {
    return (
      report?.location ||
      report?.incidentLocation ||
      "N/A"
    );
  };

  const getReportStatus = (report) => {
    if (
      report?.status === "accepted" ||
      report?.status === "under_review"
    ) {
      return "Accepted";
    }

    if (report?.status === "rejected") {
      return "Rejected";
    }

    return "Pending";
  };

  const getReporterName = (report) => {
    const reporter =
      report?.reporterId ||
      report?.reporterUser ||
      null;

    if (
      reporter &&
      typeof reporter !== "string"
    ) {
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

      if (reporter.name) {
        return reporter.name;
      }

      if (reporter.email) {
        return reporter.email;
      }
    }

    if (
      report?.reporter &&
      report.reporter !== "Anonymous"
    ) {
      return report.reporter;
    }

    return "Anonymous";
  };

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================================================
     LOAD LOGO
  ========================================================= */

  const loadImageAsDataURL = async (src) => {
    try {
      const response = await fetch(src);

      if (!response.ok) {
        throw new Error(
          `Failed to load image: ${response.status}`,
        );
      }

      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn(
        "Could not load school logo:",
        error,
      );

      return null;
    }
  };

  /* =========================================================
     DOWNLOAD DASHBOARD PDF
  ========================================================= */

  const handleDownloadPDF = async () => {
    try {
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

      const margin = 14;

      const green = [21, 128, 61];
      const darkGreen = [20, 83, 45];
      const dark = [17, 24, 39];
      const gray = [107, 114, 128];
      const lightGray = [248, 250, 249];
      const border = [229, 231, 235];
      const red = [220, 38, 38];
      const amber = [217, 119, 6];
      const white = [255, 255, 255];

      let y = 12;

      /* =====================================================
         HEADER
      ===================================================== */

      pdf.setFillColor(
        darkGreen[0],
        darkGreen[1],
        darkGreen[2],
      );

      pdf.rect(
        0,
        0,
        pageWidth,
        38,
        "F",
      );

      const logoData =
        await loadImageAsDataURL(
          "/school-logo.png",
        );

      if (logoData) {
        try {
          pdf.addImage(
            logoData,
            "PNG",
            margin,
            7,
            22,
            22,
          );
        } catch (error) {
          console.warn(
            "Could not add logo:",
            error,
          );
        }
      }

      pdf.setTextColor(
        white[0],
        white[1],
        white[2],
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(20);

      pdf.text(
        "GuidEd",
        margin + 27,
        16,
      );

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(8);

      pdf.text(
        "STUDENT GUIDANCE",
        margin + 27,
        22,
      );

      pdf.text(
        "Our Lady of the Holy Rosary School - General Trias Campus",
        margin + 27,
        27,
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(11);

      pdf.text(
        "Dashboard Report",
        pageWidth - margin,
        16,
        {
          align: "right",
        },
      );

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(8);

      pdf.text(
        formatLongDate(new Date()),
        pageWidth - margin,
        22,
        {
          align: "right",
        },
      );

      /* =====================================================
         TITLE
      ===================================================== */

      y = 50;

      pdf.setTextColor(
        dark[0],
        dark[1],
        dark[2],
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(16);

      pdf.text(
        "Student Behavioral Overview",
        margin,
        y,
      );

      y += 6;

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        gray[0],
        gray[1],
        gray[2],
      );

      pdf.text(
        "Summary of current student risk levels, reports, and incident activity.",
        margin,
        y,
      );

      y += 12;

      /* =====================================================
         KPI CARDS
      ===================================================== */

      const cardGap = 4;

      const cardWidth =
        (pageWidth -
          margin * 2 -
          cardGap * 3) /
        4;

      const cardHeight = 25;

      const cards = [
        {
          title: "TOTAL STUDENTS",
          value: kpi.total,
          color: green,
        },
        {
          title: "HIGH RISK",
          value: kpi.high,
          color: red,
        },
        {
          title: "MEDIUM RISK",
          value: kpi.medium,
          color: amber,
        },
        {
          title: "LOW RISK",
          value: kpi.low,
          color: green,
        },
      ];

      cards.forEach(
        (card, index) => {
          const x =
            margin +
            index *
              (cardWidth + cardGap);

          pdf.setFillColor(
            ...lightGray,
          );

          pdf.setDrawColor(
            ...border,
          );

          pdf.setLineWidth(0.25);

          pdf.roundedRect(
            x,
            y,
            cardWidth,
            cardHeight,
            3,
            3,
            "FD",
          );

          pdf.setFont(
            "helvetica",
            "bold",
          );

          pdf.setFontSize(7);

          pdf.setTextColor(
            ...gray,
          );

          pdf.text(
            card.title,
            x + 5,
            y + 7,
          );

          pdf.setFontSize(17);

          pdf.setTextColor(
            ...card.color,
          );

          pdf.text(
            String(card.value),
            x + 5,
            y + 19,
          );
        },
      );

      y += 35;

      /* =====================================================
         ACTIVITY SUMMARY
      ===================================================== */

      pdf.setTextColor(
        ...dark,
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(12);

      pdf.text(
        "Activity Summary",
        margin,
        y,
      );

      y += 5;

      autoTable(pdf, {
        startY: y,

        margin: {
          left: margin,
          right: margin,
        },

        head: [
          ["Metric", "Total"],
        ],

        body: [
          [
            "Submitted Reports",
            String(reports.length),
          ],
          [
            "Recorded Incidents",
            String(incidents.length),
          ],
          [
            "High-Risk Students",
            String(kpi.high),
          ],
          [
            "Medium-Risk Students",
            String(kpi.medium),
          ],
          [
            "Low-Risk Students",
            String(kpi.low),
          ],
        ],

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          textColor: dark,
          lineColor: border,
          lineWidth: 0.2,
        },

        headStyles: {
          fillColor: green,
          textColor: white,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: lightGray,
        },
      });

      y =
        pdf.lastAutoTable.finalY +
        10;

      /* =====================================================
         STUDENTS REQUIRING ATTENTION
      ===================================================== */

      if (
        y >
        pageHeight - 75
      ) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        ...dark,
      );

      pdf.text(
        "Students Requiring Attention",
        margin,
        y,
      );

      y += 5;

      const riskStudents =
        topRisk.length > 0
          ? topRisk
          : [...students]
              .sort(
                (a, b) =>
                  ({
                    High: 3,
                    Medium: 2,
                    Low: 1,
                  }[
                    safeGetRisk(b)
                  ] || 0) -
                  ({
                    High: 3,
                    Medium: 2,
                    Low: 1,
                  }[
                    safeGetRisk(a)
                  ] || 0),
              )
              .slice(0, 5);

      const studentRows =
        riskStudents.map(
          (student, index) => [
            String(index + 1),
            getStudentName(student),
            getStudentId(student),
            String(
              student.totalIncidents ||
                0,
            ),
            safeGetRisk(student),
          ],
        );

      if (
        studentRows.length ===
        0
      ) {
        studentRows.push([
          "-",
          "No students found",
          "-",
          "0",
          "Low",
        ]);
      }

      autoTable(pdf, {
        startY: y,

        margin: {
          left: margin,
          right: margin,
        },

        head: [
          [
            "#",
            "Student",
            "Student ID",
            "Incidents",
            "Risk Level",
          ],
        ],

        body: studentRows,

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          textColor: dark,
          lineColor: border,
          lineWidth: 0.2,
        },

        headStyles: {
          fillColor: green,
          textColor: white,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: lightGray,
        },

        columnStyles: {
          0: {
            cellWidth: 10,
            halign: "center",
          },

          1: {
            cellWidth: 58,
          },

          2: {
            cellWidth: 32,
          },

          3: {
            cellWidth: 25,
            halign: "center",
          },

          4: {
            cellWidth: 35,
            halign: "center",
          },
        },

        didParseCell: (
          data,
        ) => {
          if (
            data.section ===
              "body" &&
            data.column.index ===
              4
          ) {
            const risk = String(
              data.cell.raw || "",
            );

            if (
              risk === "High"
            ) {
              data.cell.styles.textColor =
                red;
            }

            if (
              risk === "Medium"
            ) {
              data.cell.styles.textColor =
                amber;
            }

            if (
              risk === "Low"
            ) {
              data.cell.styles.textColor =
                green;
            }

            data.cell.styles.fontStyle =
              "bold";
          }
        },
      });

      y =
        pdf.lastAutoTable.finalY +
        10;

      /* =====================================================
         REPORT ACTIVITY
      ===================================================== */

      if (
        y >
        pageHeight - 75
      ) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        ...dark,
      );

      pdf.text(
        "Report Activity",
        margin,
        y,
      );

      y += 5;

      const groupedReports = {};

      reports.forEach(
        (report) => {
          const rawDate =
            getReportDate(report);

          if (!rawDate) {
            return;
          }

          const date =
            new Date(rawDate);

          if (
            Number.isNaN(
              date.getTime(),
            )
          ) {
            return;
          }

          const key =
            date.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

          groupedReports[key] =
            (groupedReports[key] ||
              0) + 1;
        },
      );

      const reportRows =
        Object.entries(
          groupedReports,
        ).map(
          ([date, count]) => [
            date,
            String(count),
          ],
        );

      autoTable(pdf, {
        startY: y,

        margin: {
          left: margin,
          right: margin,
        },

        head: [
          ["Date", "Reports"],
        ],

        body:
          reportRows.length >
          0
            ? reportRows
            : [
                [
                  "No report activity",
                  "0",
                ],
              ],

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          textColor: dark,
          lineColor: border,
          lineWidth: 0.2,
        },

        headStyles: {
          fillColor: green,
          textColor: white,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: lightGray,
        },
      });

      /* =====================================================
         FOOTER
      ===================================================== */

      const totalPages =
        pdf.internal.getNumberOfPages();

      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {
        pdf.setPage(page);

        pdf.setDrawColor(
          229,
          231,
          235,
        );

        pdf.setLineWidth(
          0.2,
        );

        pdf.line(
          margin,
          pageHeight - 13,
          pageWidth - margin,
          pageHeight - 13,
        );

        pdf.setFont(
          "helvetica",
          "normal",
        );

        pdf.setFontSize(7);

        pdf.setTextColor(
          156,
          163,
          175,
        );

        pdf.text(
          "GuidEd - Student Guidance System",
          margin,
          pageHeight - 7,
        );

        pdf.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 7,
          {
            align: "right",
          },
        );
      }

      /* =====================================================
         SAVE
      ===================================================== */

      const date =
        new Date()
          .toISOString()
          .split("T")[0];

      pdf.save(
        `GuidEd-Dashboard-Report-${date}.pdf`,
      );
    } catch (error) {
      console.error(
        "Dashboard PDF generation error:",
        error,
      );

      alert(
        "Failed to generate the PDF. Please try again.",
      );
    }
  };

  /* =========================================================
     PRINT STYLES
  ========================================================= */

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            .dashboard-printable-report,
            .dashboard-printable-report * {
              visibility: visible !important;
            }

            .dashboard-printable-report {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              background: white !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            .dashboard-print-controls {
              display: none !important;
            }

            .dashboard-print-document {
              overflow: visible !important;
              max-height: none !important;
            }

            .dashboard-print-table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            .dashboard-print-table th,
            .dashboard-print-table td {
              border: 1px solid #d1d5db !important;
              padding: 6px !important;
              font-size: 10px !important;
            }

            .dashboard-print-summary-card {
              border: 1px solid #d1d5db !important;
              box-shadow: none !important;
            }

            @page {
              size: A4;
              margin: 12mm;
            }
          }
        `}
      </style>

      <div
        className="
          fixed
          inset-0
          z-[100]
          flex
          items-center
          justify-center
          bg-black/40
          backdrop-blur-sm
          p-3
          sm:p-5
        "
      >
        <div
          className="
            dashboard-printable-report
            w-full
            max-w-6xl
            max-h-[95vh]
            bg-white
            rounded-3xl
            shadow-2xl
            overflow-hidden
            flex
            flex-col
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              px-5
              py-4
              sm:px-6
              border-b
              border-gray-100
              shrink-0
            "
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-100
                  text-green-700
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Printer size={19} />
              </div>

              <div className="min-w-0">
                <h2
                  className="
                    text-base
                    sm:text-lg
                    font-bold
                    text-gray-900
                  "
                >
                  Dashboard Printable Report
                </h2>

                <p
                  className="
                    text-xs
                    text-gray-500
                    mt-0.5
                  "
                >
                  Print or download the current
                  dashboard overview.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                w-9
                h-9
                rounded-xl
                flex
                items-center
                justify-center
                text-gray-400
                hover:text-gray-700
                hover:bg-gray-100
                transition
                shrink-0
              "
            >
              <X size={19} />
            </button>
          </div>

          {/* CONTROLS */}

          <div
            className="
              dashboard-print-controls
              px-5
              py-4
              sm:px-6
              border-b
              border-gray-100
              bg-gray-50/70
              shrink-0
            "
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="
                  flex-1
                  sm:flex-none
                  flex
                  items-center
                  justify-center
                  gap-2
                  h-10
                  px-5
                  rounded-xl
                  bg-green-600
                  text-white
                  text-xs
                  font-bold
                  hover:bg-green-700
                  transition
                  shadow-sm
                "
              >
                <Download size={16} />
                Download Dashboard PDF
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="
                  flex-1
                  sm:flex-none
                  flex
                  items-center
                  justify-center
                  gap-2
                  h-10
                  px-5
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-gray-700
                  text-xs
                  font-bold
                  hover:border-green-200
                  hover:bg-green-50
                  hover:text-green-700
                  transition
                  shadow-sm
                "
              >
                <Printer size={16} />
                Print Dashboard
              </button>
            </div>
          </div>

          {/* DOCUMENT */}

          <div
            className="
              dashboard-print-document
              flex-1
              overflow-y-auto
              p-4
              sm:p-6
              lg:p-8
              bg-gray-100/60
            "
          >
            <div
              className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                border-gray-100
                p-5
                sm:p-8
                lg:p-10
              "
            >
              {/* SCHOOL HEADER */}

              <div className="text-center">
                <img
                  src="/school-logo.png"
                  alt="School Logo"
                  className="
                    w-16
                    h-16
                    sm:w-20
                    sm:h-20
                    object-contain
                    mx-auto
                    mb-3
                  "
                />

                <h1
                  className="
                    text-base
                    sm:text-xl
                    font-extrabold
                    tracking-wide
                    text-gray-900
                  "
                >
                  OUR LADY OF THE HOLY ROSARY SCHOOL
                </h1>

                <p
                  className="
                    text-xs
                    sm:text-sm
                    font-medium
                    text-gray-500
                    mt-1
                    tracking-wide
                  "
                >
                  GENERAL TRIAS CAMPUS
                </p>

                <div
                  className="
                    mt-5
                    text-green-700
                    text-lg
                    sm:text-2xl
                    font-extrabold
                    tracking-wide
                  "
                >
                  DASHBOARD REPORT
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  GuidEd · Student Guidance
                </p>
              </div>

              {/* REPORT INFO */}

              <div
                className="
                  mt-7
                  rounded-2xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-4
                  sm:p-5
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-gray-400
                    "
                  >
                    Report Type
                  </p>

                  <p
                    className="
                      text-sm
                      sm:text-base
                      font-bold
                      text-gray-800
                      mt-1
                    "
                  >
                    Student Behavioral Overview
                  </p>
                </div>

                <div className="sm:text-right">
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-gray-400
                    "
                  >
                    Generated
                  </p>

                  <p
                    className="
                      text-sm
                      sm:text-base
                      font-bold
                      text-gray-800
                      mt-1
                    "
                  >
                    {formatLongDate(new Date())}
                  </p>
                </div>
              </div>

              {/* KPI */}

              <div
                className="
                  mt-5
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-4
                  gap-3
                "
              >
                <DashboardSummaryCard
                  icon={<Users size={18} />}
                  label="Total Students"
                  value={kpi.total}
                />

                <DashboardSummaryCard
                  icon={<ShieldAlert size={18} />}
                  label="High Risk"
                  value={kpi.high}
                  danger
                />

                <DashboardSummaryCard
                  icon={<AlertTriangle size={18} />}
                  label="Medium Risk"
                  value={kpi.medium}
                  warning
                />

                <DashboardSummaryCard
                  icon={<CheckCircle2 size={18} />}
                  label="Low Risk"
                  value={kpi.low}
                />
              </div>

              {/* ACTIVITY */}

              <section className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Activity
                    size={17}
                    className="text-green-600"
                  />

                  <h3
                    className="
                      text-sm
                      sm:text-base
                      font-bold
                      text-gray-900
                    "
                  >
                    Activity Summary
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DashboardMetric
                    label="Submitted Reports"
                    value={reports.length}
                  />

                  <DashboardMetric
                    label="Recorded Incidents"
                    value={incidents.length}
                  />
                </div>
              </section>

              {/* STUDENTS REQUIRING ATTENTION */}

              <section className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3
                      className="
                        text-sm
                        sm:text-base
                        font-bold
                        text-gray-900
                      "
                    >
                      Students Requiring Attention
                    </h3>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Highest current behavioral risk levels.
                    </p>
                  </div>
                </div>

                <div
                  className="
                    overflow-x-auto
                    rounded-2xl
                    border
                    border-gray-200
                  "
                >
                  <table
                    className="
                      dashboard-print-table
                      w-full
                      min-w-[650px]
                      text-left
                      border-collapse
                    "
                  >
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="px-3 py-3 text-[11px] font-bold text-center">
                          #
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold">
                          Student
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold">
                          Student ID
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold text-center">
                          Incidents
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold text-center">
                          Risk Level
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {topRisk.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="
                              px-3
                              py-8
                              text-center
                              text-xs
                              text-gray-400
                            "
                          >
                            No students found.
                          </td>
                        </tr>
                      ) : (
                        topRisk.map(
                          (
                            student,
                            index,
                          ) => {
                            const risk =
                              safeGetRisk(
                                student,
                              );

                            return (
                              <tr
                                key={
                                  student._id ||
                                  student.studentId ||
                                  index
                                }
                                className="
                                  border-t
                                  border-gray-200
                                  even:bg-gray-50
                                "
                              >
                                <td className="px-3 py-3 text-xs text-gray-500 text-center">
                                  {index + 1}
                                </td>

                                <td className="px-3 py-3 text-xs font-semibold text-gray-800">
                                  {getStudentName(
                                    student,
                                  )}
                                </td>

                                <td className="px-3 py-3 text-xs text-gray-600">
                                  {getStudentId(
                                    student,
                                  )}
                                </td>

                                <td className="px-3 py-3 text-xs text-gray-600 text-center">
                                  {student.totalIncidents ||
                                    0}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  <span
                                    className={`
                                      inline-flex
                                      items-center
                                      justify-center
                                      px-2.5
                                      py-1
                                      rounded-full
                                      text-[10px]
                                      font-bold
                                      ${
                                        risk ===
                                        "High"
                                          ? "bg-red-100 text-red-700"
                                          : risk ===
                                              "Medium"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-green-100 text-green-700"
                                      }
                                    `}
                                  >
                                    {risk}
                                  </span>
                                </td>
                              </tr>
                            );
                          },
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* REPORT ACTIVITY */}

              <section className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <FileText
                    size={17}
                    className="text-green-600"
                  />

                  <h3
                    className="
                      text-sm
                      sm:text-base
                      font-bold
                      text-gray-900
                    "
                  >
                    Recent Report Activity
                  </h3>
                </div>

                <div
                  className="
                    overflow-x-auto
                    rounded-2xl
                    border
                    border-gray-200
                  "
                >
                  <table
                    className="
                      dashboard-print-table
                      w-full
                      min-w-[850px]
                      text-left
                      border-collapse
                    "
                  >
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="px-3 py-3 text-[11px] font-bold text-center">
                          #
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold">
                          Student
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold">
                          Offense
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold">
                          Location
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold">
                          Date
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold">
                          Reporter
                        </th>

                        <th className="px-3 py-3 text-[11px] font-bold text-center">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {reports.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="
                              px-3
                              py-8
                              text-center
                              text-xs
                              text-gray-400
                            "
                          >
                            No report activity found.
                          </td>
                        </tr>
                      ) : (
                        reports
                          .slice(0, 10)
                          .map(
                            (
                              report,
                              index,
                            ) => {
                              const reportStatus =
                                getReportStatus(
                                  report,
                                );

                              return (
                                <tr
                                  key={
                                    report._id ||
                                    report.id ||
                                    index
                                  }
                                  className="
                                    border-t
                                    border-gray-200
                                    even:bg-gray-50
                                  "
                                >
                                  <td className="px-3 py-3 text-xs text-gray-500 text-center">
                                    {index + 1}
                                  </td>

                                  <td className="px-3 py-3 text-xs font-semibold text-gray-800">
                                    {report.studentName ||
                                      getStudentName(
                                        report.studentId,
                                      )}
                                  </td>

                                  <td className="px-3 py-3 text-xs text-gray-600">
                                    {getOffense(
                                      report,
                                    )}
                                  </td>

                                  <td className="px-3 py-3 text-xs text-gray-600">
                                    {getLocation(
                                      report,
                                    )}
                                  </td>

                                  <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                                    {formatDate(
                                      getReportDate(
                                        report,
                                      ),
                                    )}
                                  </td>

                                  <td className="px-3 py-3 text-xs text-gray-600">
                                    {getReporterName(
                                      report,
                                    )}
                                  </td>

                                  <td className="px-3 py-3 text-center">
                                    <span
                                      className={`
                                        inline-flex
                                        items-center
                                        justify-center
                                        px-2.5
                                        py-1
                                        rounded-full
                                        text-[10px]
                                        font-bold
                                        ${
                                          reportStatus ===
                                          "Accepted"
                                            ? "bg-green-100 text-green-700"
                                            : reportStatus ===
                                                "Rejected"
                                              ? "bg-red-100 text-red-700"
                                              : "bg-amber-100 text-amber-700"
                                        }
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
                          )
                      )}
                    </tbody>
                  </table>
                </div>

                {reports.length > 10 && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    Showing the 10 most recent reports from{" "}
                    {reports.length} total reports.
                  </p>
                )}
              </section>

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
                  sm:items-center
                  sm:justify-between
                  gap-2
                "
              >
                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    Prepared by: GuidEd Administrator
                  </p>

                  <p className="text-[10px] text-gray-400 mt-1">
                    EduGuard Student Discipline and Monitoring System
                  </p>
                </div>

                <div className="text-[10px] text-gray-400 sm:text-right">
                  Dashboard snapshot generated on{" "}
                  {formatLongDate(new Date())}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   DASHBOARD SUMMARY CARD
========================================================= */

const DashboardSummaryCard = ({
  icon,
  label,
  value,
  danger = false,
  warning = false,
}) => {
  const iconClass = danger
    ? "bg-red-50 text-red-600"
    : warning
      ? "bg-amber-50 text-amber-600"
      : "bg-green-50 text-green-600";

  const valueClass = danger
    ? "text-red-600"
    : warning
      ? "text-amber-600"
      : "text-green-700";

  return (
    <div
      className="
        dashboard-print-summary-card
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-4
        flex
        items-center
        gap-3
      "
    >
      <div
        className={`
          w-10
          h-10
          rounded-xl
          flex
          items-center
          justify-center
          shrink-0
          ${iconClass}
        `}
      >
        {icon}
      </div>

      <div>
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            text-gray-400
          "
        >
          {label}
        </p>

        <p
          className={`
            text-xl
            font-extrabold
            mt-0.5
            ${valueClass}
          `}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   SIMPLE METRIC
========================================================= */

const DashboardMetric = ({
  label,
  value,
}) => {
  return (
    <div
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-4
      "
    >
      <p
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-wider
          text-gray-400
        "
      >
        {label}
      </p>

      <p className="text-2xl font-extrabold text-gray-900 mt-1">
        {value}
      </p>
    </div>
  );
};

export default DashboardPrintableReport;