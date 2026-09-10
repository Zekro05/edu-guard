import { useEffect, useMemo, useState } from "react";
import {
  X,
  Printer,
  FileText,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Download,
  BriefcaseBusiness,
  ShieldAlert,
  Activity,
  MapPin,
  User2,
  RefreshCw,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { API } from "../../lib/api";

/* =========================================================
   DEFAULTS
========================================================= */

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

/* =========================================================
   OFFENSE MAP
========================================================= */

const offenseMap = {
  MINOR: [
    "dress code violation",
    "improper uniform",
    "improper haircut",
    "unauthorized hair color",
    "wearing earrings",
    "use of cosmetics/nail polish",
    "unnecessary talking",
    "shouting",
    "howling",
    "eating inside classroom",
    "extreme quarrels",
    "minor classroom disruption",
    "use of impolite words",
    "cursing",
    "teasing",
    "name calling",
    "habitual absences",
    "unnecessary use of chat box",
    "unresponsive during online classes",
    "leaving online conference without permission",
    "turning off camera without valid reason",
    "improper camera visibility",
    "habitual tardiness",
    "inappropriate profile picture/background",
    "unsigned school correspondence",
    "late submission of reply slips",
    "non-submission of reply slips",
    "failure to submit excuse letter",
    "loss of violation report",
    "littering",
    "violation of library rules",
    "failure to return borrowed materials",
    "not wearing school id",
    "playing cards",
    "rough play",
    "horseplaying",
    "refusal to replace damaged property",
    "using cellphone during examination",
    "failure to present school id",
    "tampering school id",
    "tampering library card",
    "loitering",
    "lending school id",
    "using someone else's id",
    "locker policy violation",
    "eating in restricted areas",
    "unauthorized gadgets",
    "unauthorized cellphone use",
  ],

  MAJOR: [
    "sharing account credentials",
    "piracy",
    "unauthorized downloading",
    "posting screenshots without consent",
    "defamation",
    "slander",
    "recording without consent",
    "cyberbullying",
    "cyber baiting",
    "unauthorized transactions",
    "viewing pornographic materials",
    "selling without approval",
    "spreading fake news",
    "harassment",
    "threatening messages",
    "using portal for gambling",
    "petty theft",
    "stealing",
    "assault",
    "abusive behavior",
    "forgery",
    "cheating",
    "plagiarism",
    "academic dishonesty",
    "vandalism",
    "destroying school property",
    "tampering school records",
    "gambling",
    "unauthorized use of school equipment",
    "instigating a fight",
    "possession of liquor",
    "possession of cigarettes",
    "possession of vape",
    "possession of deadly weapon",
    "fighting",
    "physical injury",
    "physical assault",
    "drug possession",
    "drug selling",
    "hazing",
    "voyeurism",
  ],
};

/* =========================================================
   HELPERS
========================================================= */

const normalize = (str = "") =>
  String(str).toLowerCase().trim();

const findMatch = (text, list = []) =>
  list.find((item) =>
    text.includes(normalize(item)),
  );

const classifyCase = (c = {}) => {
  const text = normalize(
    [
      c.offense,
      c.category,
      c.title,
      c.description,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const matchedMajor = findMatch(
    text,
    offenseMap.MAJOR,
  );

  const matchedMinor = findMatch(
    text,
    offenseMap.MINOR,
  );

  const criticalKeywords = [
    "drug",
    "weapon",
    "assault",
    "physical injury",
    "physical assault",
    "hazing",
    "voyeurism",
    "fighting",
    "threatening",
  ];

  const isCritical = criticalKeywords.some((keyword) =>
    text.includes(normalize(keyword)),
  );

  if (matchedMajor && isCritical) {
    return {
      risk: "HIGH",
      severity: "CRITICAL MAJOR OFFENSE",
    };
  }

  if (matchedMajor) {
    return {
      risk: "MEDIUM",
      severity: "MAJOR OFFENSE",
    };
  }

  if (matchedMinor) {
    return {
      risk: "LOW",
      severity: "MINOR OFFENSE",
    };
  }

  return {
    risk: "LOW",
    severity: "UNCLASSIFIED",
  };
};

/* =========================================================
   STATUS
========================================================= */

const statusLabels = {
  received: "Received",
  "saved-student-statement": "Statement Saved",
  reviewing: "Reviewing",
  "refer-for-intervention": "For Intervention",
  "intervention-ready": "Intervention Ready",
  completed: "Completed",
};

/* =========================================================
   GET CASE DATE
========================================================= */

/*
  Some incident records may not have a top-level `date`.
  Depending on how the incident/report was created, the date
  may instead be stored as `incidentDate`, `createdAt`, or
  inside the populated report/reportId object.

  We resolve all supported locations here so the printable
  report and PDF always receive one normalized `date` value.
*/

const getCaseDate = (c = {}) => {
  return (
    c.date ||
    c.incidentDate ||
    c.createdAt ||
    c.reportId?.date ||
    c.reportId?.incidentDate ||
    c.reportId?.createdAt ||
    c.report?.date ||
    c.report?.incidentDate ||
    c.report?.createdAt ||
    null
  );
};

/* =========================================================
   NORMALIZE CASE
========================================================= */

const normalizeCase = (c) => {
  const evidence = Array.isArray(c.evidence)
    ? c.evidence
    : [];

  /* =========================================================
     FIND REPORTER
  ========================================================= */

  const reporterUser =
    c.reportId?.reporterId ||
    c.report?.reporterId ||
    null;

  const reporterName = reporterUser
    ? [
        reporterUser.firstName,
        reporterUser.middleName,
        reporterUser.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      reporterUser.name ||
      reporterUser.email ||
      "Anonymous"
    : c.reporter || "Anonymous";

  return {
    ...c,

    /* =======================================================
       NORMALIZED DATE
    ======================================================= */

    date: getCaseDate(c),

    offense:
      c.offense ||
      c.reportId?.offense ||
      c.report?.offense ||
      c.title ||
      "Unknown Offense",

    category:
      c.category ||
      c.reportId?.category ||
      c.report?.category ||
      "",

    title:
      c.title ||
      c.reportId?.title ||
      c.report?.title ||
      "",

    description:
      c.description ||
      c.reportId?.description ||
      c.report?.description ||
      "",

    student: c.studentId
      ? {
          name: `${c.studentId.firstName || ""} ${
            c.studentId.lastName || ""
          }`.trim(),

          avatar: c.studentId.profilePhoto,

          grade: c.studentId.grade,

          section: c.studentId.section,

          studentId: c.studentId.studentId,
        }
      : c.student || {},

    status:
      c.effectiveStatus ||
      c.status ||
      "received",

    logs:
      c.caseLogs ||
      c.logs ||
      [],

    evidence,

    location:
      c.location ||
      c.reportId?.location ||
      c.report?.location ||
      "Unknown location",

    /* =======================================================
       ACTUAL REPORTER
    ======================================================= */

    reporter: reporterName,

    reporterId:
      reporterUser?._id ||
      reporterUser?.id ||
      c.reportId?.reporterId ||
      null,

    reporterEmail:
      reporterUser?.email || "",

    reporterType:
      c.reportId?.reporterType ||
      c.report?.reporterType ||
      "",
  };
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const CasePrintableReport = ({ onClose }) => {
  const [cases, setCases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [riskFilter, setRiskFilter] =
    useState("all");

  const [period, setPeriod] =
    useState("all");

  const [selectedDate, setSelectedDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0],
    );

  /* =========================================================
     FETCH CASES
  ========================================================= */

  const fetchCases = async () => {
    setLoading(true);

    try {
      const response = await API.get(
        "/api/incidents",
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.incidents || [];

      setCases(data.map(normalizeCase));
    } catch (error) {
      console.error(
        "Failed to fetch cases:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Failed to load case report.",
      );

      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
      },
    );
  };

  const formatLongDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    );
  };

  /* =========================================================
     PERIOD FILTER
  ========================================================= */

  const isWithinPeriod = (
    date,
    selectedPeriod,
    selectedDateValue,
  ) => {
    if (
      selectedPeriod === "all" ||
      !selectedDateValue
    ) {
      return true;
    }

    if (!date) return false;

    const caseDate = new Date(date);

    if (Number.isNaN(caseDate.getTime())) {
      return false;
    }

    const target = new Date(
      `${selectedDateValue}T00:00:00`,
    );

    if (Number.isNaN(target.getTime())) {
      return true;
    }

    if (selectedPeriod === "daily") {
      return (
        caseDate.getFullYear() ===
          target.getFullYear() &&
        caseDate.getMonth() ===
          target.getMonth() &&
        caseDate.getDate() ===
          target.getDate()
      );
    }

    if (selectedPeriod === "monthly") {
      return (
        caseDate.getFullYear() ===
          target.getFullYear() &&
        caseDate.getMonth() ===
          target.getMonth()
      );
    }

    if (selectedPeriod === "yearly") {
      return (
        caseDate.getFullYear() ===
        target.getFullYear()
      );
    }

    return true;
  };

  /* =========================================================
     FILTERED CASES
  ========================================================= */

  const filteredCases = useMemo(() => {
    return cases.filter((caseData) => {
      const currentStatus =
        caseData.status || "received";

      const currentRisk =
        classifyCase(caseData).risk;

      if (
        statusFilter !== "all" &&
        currentStatus !== statusFilter
      ) {
        return false;
      }

      if (
        riskFilter !== "all" &&
        currentRisk !== riskFilter
      ) {
        return false;
      }

      if (
        !isWithinPeriod(
          caseData.date,
          period,
          selectedDate,
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    cases,
    statusFilter,
    riskFilter,
    period,
    selectedDate,
  ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const total = filteredCases.length;

    const ongoing = filteredCases.filter(
      (c) =>
        c.status === "received" ||
        c.status ===
          "saved-student-statement" ||
        c.status === "reviewing",
    ).length;

    const intervention = filteredCases.filter(
      (c) =>
        c.status ===
        "refer-for-intervention",
    ).length;

    const ready = filteredCases.filter(
      (c) =>
        c.status ===
        "intervention-ready",
    ).length;

    const completed = filteredCases.filter(
      (c) => c.status === "completed",
    ).length;

    const high = filteredCases.filter(
      (c) =>
        classifyCase(c).risk === "HIGH",
    ).length;

    const medium = filteredCases.filter(
      (c) =>
        classifyCase(c).risk === "MEDIUM",
    ).length;

    const low = filteredCases.filter(
      (c) =>
        classifyCase(c).risk === "LOW",
    ).length;

    return {
      total,
      ongoing,
      intervention,
      ready,
      completed,
      high,
      medium,
      low,
    };
  }, [filteredCases]);

  /* =========================================================
     PERIOD LABEL
  ========================================================= */

  const periodLabel = useMemo(() => {
    if (period === "all") {
      return "All Recorded Cases";
    }

    if (period === "daily") {
      return `Daily Report • ${formatLongDate(
        selectedDate,
      )}`;
    }

    if (period === "monthly") {
      const date = new Date(
        `${selectedDate}T00:00:00`,
      );

      return `Monthly Report • ${date.toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        },
      )}`;
    }

    if (period === "yearly") {
      const date = new Date(
        `${selectedDate}T00:00:00`,
      );

      return `Yearly Report • ${date.getFullYear()}`;
    }

    return "Case Report";
  }, [period, selectedDate]);

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================================================
     IMAGE LOADER
  ========================================================= */

  const loadImageAsDataURL = async (
    src,
  ) => {
    try {
      const response = await fetch(src);

      if (!response.ok) {
        throw new Error(
          "Failed to load image",
        );
      }

      const blob = await response.blob();

      return await new Promise(
        (resolve, reject) => {
          const reader =
            new FileReader();

          reader.onloadend = () =>
            resolve(reader.result);

          reader.onerror = reject;

          reader.readAsDataURL(blob);
        },
      );
    } catch {
      return null;
    }
  };

  /* =========================================================
     DOWNLOAD PDF
  ========================================================= */

  const handleDownloadPDF = async () => {
    if (downloading || loading) {
      return;
    }

    setDownloading(true);

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

      const green = [22, 163, 74];
      const dark = [17, 24, 39];
      const gray = [107, 114, 128];

      const lightGray = [
        249, 250, 251,
      ];

      const border = [
        229, 231, 235,
      ];

      const white = [255, 255, 255];

      /* =====================================================
         LOGO
      ===================================================== */

      const logo =
        await loadImageAsDataURL(
          "/school-logo.png",
        );

      let currentY = 12;

      if (logo) {
        try {
          pdf.addImage(
            logo,
            "PNG",
            pageWidth / 2 - 8,
            currentY,
            16,
            16,
          );

          currentY += 19;
        } catch {
          currentY += 3;
        }
      } else {
        currentY += 3;
      }

      /* =====================================================
         SCHOOL HEADER
      ===================================================== */

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        ...dark,
      );

      pdf.text(
        "OUR LADY OF THE HOLY ROSARY SCHOOL",
        pageWidth / 2,
        currentY,
        {
          align: "center",
        },
      );

      currentY += 5;

      pdf.setFontSize(8);

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setTextColor(
        ...gray,
      );

      pdf.text(
        "GENERAL TRIAS CAMPUS",
        pageWidth / 2,
        currentY,
        {
          align: "center",
        },
      );

      currentY += 8;

      /* =====================================================
         TITLE
      ===================================================== */

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(16);

      pdf.setTextColor(
        ...green,
      );

      pdf.text(
        "CASE MANAGEMENT REPORT",
        pageWidth / 2,
        currentY,
        {
          align: "center",
        },
      );

      currentY += 5;

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        ...gray,
      );

      pdf.text(
        "GuidEd · Student Guidance",
        pageWidth / 2,
        currentY,
        {
          align: "center",
        },
      );

      currentY += 8;

      /* =====================================================
         PERIOD BOX
      ===================================================== */

      pdf.setFillColor(
        ...lightGray,
      );

      pdf.setDrawColor(
        ...border,
      );

      pdf.roundedRect(
        margin,
        currentY,
        pageWidth -
          margin * 2,
        18,
        3,
        3,
        "FD",
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        ...dark,
      );

      pdf.text(
        "REPORT PERIOD",
        margin + 5,
        currentY + 6,
      );

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setTextColor(
        ...gray,
      );

      pdf.text(
        periodLabel,
        margin + 5,
        currentY + 12,
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setTextColor(
        ...dark,
      );

      pdf.text(
        `Status: ${
          statusFilter === "all"
            ? "All"
            : statusLabels[
                statusFilter
              ] || statusFilter
        }`,
        pageWidth - margin - 5,
        currentY + 6,
        {
          align: "right",
        },
      );

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setTextColor(
        ...gray,
      );

      pdf.text(
        `Risk: ${
          riskFilter === "all"
            ? "All"
            : riskFilter
        }`,
        pageWidth - margin - 5,
        currentY + 12,
        {
          align: "right",
        },
      );

      currentY += 24;

      /* =====================================================
         SUMMARY CARDS
      ===================================================== */

      const cardGap = 3;

      const cardWidth =
        (pageWidth -
          margin * 2 -
          cardGap * 2) /
        3;

      const cards = [
        {
          label: "TOTAL CASES",
          value: summary.total,
        },
        {
          label: "ONGOING",
          value: summary.ongoing,
        },
        {
          label: "INTERVENTION",
          value: summary.intervention,
        },
      ];

      cards.forEach(
        (card, index) => {
          const x =
            margin +
            index *
              (cardWidth + cardGap);

          pdf.setFillColor(
            ...white,
          );

          pdf.setDrawColor(
            ...border,
          );

          pdf.roundedRect(
            x,
            currentY,
            cardWidth,
            23,
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
            card.label,
            x + 4,
            currentY + 7,
          );

          pdf.setFontSize(15);

          pdf.setTextColor(
            ...dark,
          );

          pdf.text(
            String(card.value),
            x + 4,
            currentY + 17,
          );
        },
      );

      currentY += 29;

      /* =====================================================
         SECOND SUMMARY ROW
      ===================================================== */

      const cards2 = [
        {
          label: "INTERVENTION READY",
          value: summary.ready,
        },
        {
          label: "COMPLETED",
          value: summary.completed,
        },
        {
          label: "HIGH RISK",
          value: summary.high,
        },
      ];

      cards2.forEach(
        (card, index) => {
          const x =
            margin +
            index *
              (cardWidth + cardGap);

          pdf.setFillColor(
            ...white,
          );

          pdf.setDrawColor(
            ...border,
          );

          pdf.roundedRect(
            x,
            currentY,
            cardWidth,
            23,
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
            card.label,
            x + 4,
            currentY + 7,
          );

          pdf.setFontSize(15);

          pdf.setTextColor(
            ...dark,
          );

          pdf.text(
            String(card.value),
            x + 4,
            currentY + 17,
          );
        },
      );

      currentY += 30;

      /* =====================================================
         TABLE
      ===================================================== */

      const tableBody =
        filteredCases.map(
          (caseData, index) => {
            const ai =
              classifyCase(
                caseData,
              );

            return [
              index + 1,

              caseData.student
                ?.name ||
                "Unknown Student",

              caseData.student
                ?.studentId ||
                "N/A",

              caseData.offense ||
                "Unknown Offense",

              caseData.location ||
                "Unknown",

              formatDate(
                caseData.date,
              ),

              caseData.reporter ||
                "Anonymous",

              statusLabels[
                caseData.status
              ] ||
                caseData.status ||
                "Received",

              ai.risk,
            ];
          },
        );

      autoTable(pdf, {
        startY: currentY,

        head: [
          [
            "#",
            "Student",
            "Student ID",
            "Offense",
            "Location",
            "Date",
            "Reporter",
            "Status",
            "Risk",
          ],
        ],

        body: tableBody,

        theme: "grid",

        margin: {
          left: margin,
          right: margin,
          top: 15,
          bottom: 18,
        },

        styles: {
          font:
            "helvetica",
          fontSize: 6.5,
          cellPadding: 2.2,
          textColor: dark,
          lineColor: border,
          lineWidth: 0.2,
          overflow:
            "linebreak",
          valign: "middle",
        },

        headStyles: {
          fillColor: green,
          textColor: white,
          fontStyle: "bold",
          fontSize: 6.5,
          halign: "center",
        },

        alternateRowStyles: {
          fillColor: lightGray,
        },

        columnStyles: {
          0: {
            cellWidth: 7,
            halign: "center",
          },

          1: {
            cellWidth: 25,
          },

          2: {
            cellWidth: 20,
          },

          3: {
            cellWidth: 30,
          },

          4: {
            cellWidth: 22,
          },

          5: {
            cellWidth: 18,
          },

          6: {
            cellWidth: 23,
          },

          7: {
            cellWidth: 23,
          },

          8: {
            cellWidth: 13,
            halign: "center",
          },
        },

        didDrawPage: () => {
          const pageNumber =
            pdf.internal.getNumberOfPages();

          pdf.setFont(
            "helvetica",
            "normal",
          );

          pdf.setFontSize(7);

          pdf.setTextColor(
            ...gray,
          );

          pdf.text(
            "GuidEd · Student Discipline and Monitoring System",
            margin,
            pageHeight - 9,
          );

          pdf.text(
            `Page ${pageNumber}`,
            pageWidth - margin,
            pageHeight - 9,
            {
              align: "right",
            },
          );
        },
      });

      /* =====================================================
         EMPTY REPORT
      ===================================================== */

      if (filteredCases.length === 0) {
        pdf.setFont(
          "helvetica",
          "normal",
        );

        pdf.setFontSize(9);

        pdf.setTextColor(
          ...gray,
        );

        pdf.text(
          "No cases found for the selected filters.",
          pageWidth / 2,
          currentY + 10,
          {
            align: "center",
          },
        );
      }

      /* =====================================================
         FINAL FOOTER
      ===================================================== */

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

        pdf.setFontSize(7);

        pdf.setTextColor(
          ...gray,
        );

        pdf.text(
          `Generated ${formatLongDate(
            new Date(),
          )}`,
          margin,
          pageHeight - 4,
        );
      }

      /* =====================================================
         SAVE
      ===================================================== */

      const safeDate =
        selectedDate.replace(
          /[^0-9-]/g,
          "",
        );

      pdf.save(
        `GuidEd-Case-Management-Report-${safeDate}.pdf`,
      );
    } catch (error) {
      console.error(
        "Failed to generate case PDF:",
        error,
      );

      alert(
        "Failed to generate the PDF. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  /* =========================================================
     STATUS LABEL
  ========================================================= */

  const selectedStatusLabel =
    statusFilter === "all"
      ? "All Cases"
      : statusLabels[
          statusFilter
        ] || statusFilter;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            .case-printable-report,
            .case-printable-report * {
              visibility: visible !important;
            }

            .case-printable-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            .case-print-controls {
              display: none !important;
            }

            .case-print-document {
              overflow: visible !important;
              max-height: none !important;
            }

            .case-print-table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            .case-print-table th,
            .case-print-table td {
              border: 1px solid #d1d5db !important;
              padding: 6px !important;
              font-size: 9px !important;
            }

            .case-summary-card {
              box-shadow: none !important;
            }

            @page {
              size: A4;
              margin: 12mm;
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
          z-[200]
          bg-black/40
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-3
          md:p-6
        "
      >
        {/* ===================================================
            MODAL
        =================================================== */}

        <div
          className="
            case-printable-report
            bg-white
            w-full
            max-w-6xl
            max-h-[95vh]
            rounded-3xl
            shadow-2xl
            flex
            flex-col
            overflow-hidden
          "
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              px-5
              md:px-6
              py-4
              border-b
              border-gray-100
              flex-shrink-0
            "
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-50
                  text-green-700
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <BriefcaseBusiness
                  size={19}
                />
              </div>

              <div className="min-w-0">
                <h2 className="font-extrabold text-gray-900 text-sm md:text-base">
                  Case Management Report
                </h2>

                <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                  Generate a case summary for
                  printing or PDF.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="
                w-9
                h-9
                rounded-xl
                flex
                items-center
                justify-center
                text-gray-400
                hover:bg-gray-100
                hover:text-gray-700
                transition
                flex-shrink-0
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
              case-print-controls
              px-5
              md:px-6
              py-4
              border-b
              border-gray-100
              bg-gray-50/60
              flex-shrink-0
            "
          >
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-4
                gap-3
              "
            >
              {/* STATUS */}

              <div>
                <label
                  className="
                    block
                    text-[9px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-gray-400
                    mb-1.5
                  "
                >
                  Case Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value,
                    )
                  }
                  className="
                    w-full
                    h-10
                    px-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-xs
                    font-semibold
                    text-gray-700
                    outline-none
                    focus:border-green-300
                    focus:ring-4
                    focus:ring-green-500/5
                  "
                >
                  <option value="all">
                    All Cases
                  </option>

                  <option value="received">
                    Received
                  </option>

                  <option value="saved-student-statement">
                    Statement Saved
                  </option>

                  <option value="reviewing">
                    Reviewing
                  </option>

                  <option value="refer-for-intervention">
                    For Intervention
                  </option>

                  <option value="intervention-ready">
                    Intervention Ready
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>
              </div>

              {/* RISK */}

              <div>
                <label
                  className="
                    block
                    text-[9px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-gray-400
                    mb-1.5
                  "
                >
                  Risk Level
                </label>

                <select
                  value={riskFilter}
                  onChange={(e) =>
                    setRiskFilter(
                      e.target.value,
                    )
                  }
                  className="
                    w-full
                    h-10
                    px-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-xs
                    font-semibold
                    text-gray-700
                    outline-none
                    focus:border-green-300
                    focus:ring-4
                    focus:ring-green-500/5
                  "
                >
                  <option value="all">
                    All Risk Levels
                  </option>

                  <option value="HIGH">
                    High Risk
                  </option>

                  <option value="MEDIUM">
                    Medium Risk
                  </option>

                  <option value="LOW">
                    Low Risk
                  </option>
                </select>
              </div>

              {/* PERIOD */}

              <div>
                <label
                  className="
                    block
                    text-[9px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-gray-400
                    mb-1.5
                  "
                >
                  Report Period
                </label>

                <select
                  value={period}
                  onChange={(e) =>
                    setPeriod(
                      e.target.value,
                    )
                  }
                  className="
                    w-full
                    h-10
                    px-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-xs
                    font-semibold
                    text-gray-700
                    outline-none
                    focus:border-green-300
                    focus:ring-4
                    focus:ring-green-500/5
                  "
                >
                  <option value="all">
                    All Time
                  </option>

                  <option value="daily">
                    Daily
                  </option>

                  <option value="monthly">
                    Monthly
                  </option>

                  <option value="yearly">
                    Yearly
                  </option>
                </select>
              </div>

              {/* DATE */}

              <div>
                <label
                  className="
                    block
                    text-[9px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-gray-400
                    mb-1.5
                  "
                >
                  Reference Date
                </label>

                <div
                  className="
                    relative
                    flex
                    items-center
                  "
                >
                  <CalendarDays
                    size={14}
                    className="
                      absolute
                      left-3
                      text-gray-400
                      pointer-events-none
                    "
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
                      h-10
                      pl-9
                      pr-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      text-xs
                      font-semibold
                      text-gray-700
                      outline-none
                      focus:border-green-300
                      focus:ring-4
                      focus:ring-green-500/5
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
              <button
                onClick={handleDownloadPDF}
                disabled={
                  downloading ||
                  loading
                }
                className="
                  h-10
                  px-4
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-green-300
                  text-white
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                  gap-2
                  transition
                  shadow-sm
                "
              >
                {downloading ? (
                  <>
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />

                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={15} />

                    Download PDF
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                disabled={loading}
                className="
                  h-10
                  px-4
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-gray-700
                  hover:border-green-200
                  hover:bg-green-50
                  hover:text-green-700
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                  gap-2
                  transition
                  shadow-sm
                "
              >
                <Printer size={15} />

                Print Report
              </button>
            </div>
          </div>

          {/* =================================================
              DOCUMENT
          ================================================= */}

          <div
            className="
              case-print-document
              flex-1
              overflow-y-auto
              bg-gray-100/70
              p-4
              md:p-6
            "
          >
            <div
              className="
                bg-white
                max-w-5xl
                mx-auto
                min-h-full
                shadow-sm
                rounded-2xl
                p-6
                md:p-8
              "
            >
              {/* =================================================
                  DOCUMENT HEADER
              ================================================= */}

              <div className="text-center">
                <div
                  className="
                    w-16
                    h-16
                    mx-auto
                    flex
                    items-center
                    justify-center
                    mb-3
                  "
                >
                  <img
                    src="/school-logo.png"
                    alt="School Logo"
                    className="
                      w-full
                      h-full
                      object-contain
                    "
                    onError={(e) => {
                      e.currentTarget.src =
                        DEFAULT_AVATAR;
                    }}
                  />
                </div>

                <p
                  className="
                    text-xs
                    md:text-sm
                    font-extrabold
                    tracking-wide
                    text-gray-900
                  "
                >
                  OUR LADY OF THE HOLY
                  ROSARY SCHOOL
                </p>

                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.2em]
                    text-gray-400
                    font-semibold
                    mt-1
                  "
                >
                  General Trias Campus
                </p>

                <div
                  className="
                    w-16
                    h-1
                    bg-green-600
                    rounded-full
                    mx-auto
                    my-4
                  "
                />

                <h1
                  className="
                    text-lg
                    md:text-xl
                    font-extrabold
                    text-gray-900
                  "
                >
                  CASE MANAGEMENT REPORT
                </h1>

                <p
                  className="
                    text-[10px]
                    text-green-700
                    font-bold
                    mt-1
                  "
                >
                  GuidEd · Student Guidance
                </p>
              </div>

              {/* =================================================
                  PERIOD INFORMATION
              ================================================= */}

              <div
                className="
                  mt-7
                  rounded-2xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-4
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-3
                  "
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={14}
                        className="text-green-600"
                      />

                      <p
                        className="
                          text-[9px]
                          uppercase
                          tracking-wider
                          font-bold
                          text-gray-400
                        "
                      >
                        Report Period
                      </p>
                    </div>

                    <p
                      className="
                        text-sm
                        font-bold
                        text-gray-900
                        mt-1
                      "
                    >
                      {periodLabel}
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    <span
                      className="
                        px-2.5
                        py-1.5
                        rounded-full
                        bg-green-50
                        border
                        border-green-200
                        text-[9px]
                        font-bold
                        text-green-700
                      "
                    >
                      {selectedStatusLabel}
                    </span>

                    <span
                      className="
                        px-2.5
                        py-1.5
                        rounded-full
                        bg-white
                        border
                        border-gray-200
                        text-[9px]
                        font-bold
                        text-gray-600
                      "
                    >
                      {riskFilter ===
                      "all"
                        ? "All Risk Levels"
                        : `${riskFilter} Risk`}
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-3
                  gap-3
                  mt-5
                "
              >
                <SummaryCard
                  icon={
                    <ClipboardList
                      size={17}
                    />
                  }
                  label="Total Cases"
                  value={
                    summary.total
                  }
                />

                <SummaryCard
                  icon={
                    <Activity
                      size={17}
                    />
                  }
                  label="Ongoing"
                  value={
                    summary.ongoing
                  }
                  iconClass="bg-amber-50 text-amber-700"
                />

                <SummaryCard
                  icon={
                    <AlertTriangle
                      size={17}
                    />
                  }
                  label="For Intervention"
                  value={
                    summary.intervention
                  }
                  iconClass="bg-red-50 text-red-700"
                />

                <SummaryCard
                  icon={
                    <CheckCircle2
                      size={17}
                    />
                  }
                  label="Intervention Ready"
                  value={
                    summary.ready
                  }
                  iconClass="bg-emerald-50 text-emerald-700"
                />

                <SummaryCard
                  icon={
                    <CheckCircle2
                      size={17}
                    />
                  }
                  label="Completed"
                  value={
                    summary.completed
                  }
                  iconClass="bg-indigo-50 text-indigo-700"
                />

                <SummaryCard
                  icon={
                    <ShieldAlert
                      size={17}
                    />
                  }
                  label="High Risk"
                  value={
                    summary.high
                  }
                  iconClass="bg-red-50 text-red-700"
                />
              </div>

              {/* =================================================
                  TABLE
              ================================================= */}

              <div className="mt-7">
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    mb-3
                  "
                >
                  <div>
                    <h2
                      className="
                        text-sm
                        font-extrabold
                        text-gray-900
                      "
                    >
                      Case Records
                    </h2>

                    <p
                      className="
                        text-[10px]
                        text-gray-400
                        mt-0.5
                      "
                    >
                      {filteredCases.length} case
                      {filteredCases.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      included in this
                      report.
                    </p>
                  </div>

                  {loading && (
                    <RefreshCw
                      size={16}
                      className="
                        text-green-600
                        animate-spin
                      "
                    />
                  )}
                </div>

                <div
                  className="
                    border
                    border-gray-200
                    rounded-2xl
                    overflow-x-auto
                  "
                >
                  <table
                    className="
                      case-print-table
                      w-full
                      min-w-[1000px]
                      border-collapse
                    "
                  >
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          #
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Student
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Student ID
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Offense
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Location
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Date
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Reporter
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Status
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold">
                          Risk
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="
                              px-4
                              py-12
                              text-center
                              text-xs
                              text-gray-400
                            "
                          >
                            <RefreshCw
                              size={18}
                              className="
                                animate-spin
                                mx-auto
                                mb-2
                                text-green-600
                              "
                            />

                            Loading case
                            records...
                          </td>
                        </tr>
                      ) : filteredCases.length ===
                        0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="
                              px-4
                              py-12
                              text-center
                            "
                          >
                            <div
                              className="
                                w-12
                                h-12
                                rounded-2xl
                                bg-gray-50
                                mx-auto
                                flex
                                items-center
                                justify-center
                                text-gray-300
                              "
                            >
                              <FileText
                                size={20}
                              />
                            </div>

                            <p
                              className="
                                text-xs
                                font-bold
                                text-gray-500
                                mt-3
                              "
                            >
                              No cases found
                            </p>

                            <p
                              className="
                                text-[10px]
                                text-gray-400
                                mt-1
                              "
                            >
                              Try changing
                              your report
                              filters.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredCases.map(
                          (
                            caseData,
                            index,
                          ) => {
                            const ai =
                              classifyCase(
                                caseData,
                              );

                            return (
                              <tr
                                key={
                                  caseData._id ||
                                  index
                                }
                                className="
                                  border-b
                                  border-gray-100
                                  last:border-b-0
                                  hover:bg-gray-50
                                "
                              >
                                <td className="px-3 py-3 text-[9px] font-semibold text-gray-400">
                                  {index + 1}
                                </td>

                                <td className="px-3 py-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-800">
                                      {caseData
                                        .student
                                        ?.name ||
                                        "Unknown Student"}
                                    </p>

                                    {caseData
                                      .student
                                      ?.grade && (
                                      <p className="text-[8px] text-gray-400 mt-0.5">
                                        {
                                          caseData
                                            .student
                                            .grade
                                        }

                                        {caseData
                                          .student
                                          .section
                                          ? ` • ${caseData.student.section}`
                                          : ""}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                <td className="px-3 py-3 text-[9px] text-gray-500">
                                  {caseData
                                    .student
                                    ?.studentId ||
                                    "N/A"}
                                </td>

                                <td className="px-3 py-3">
                                  <p className="text-[9px] font-semibold text-gray-700 max-w-[180px]">
                                    {
                                      caseData.offense
                                    }
                                  </p>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1">
                                    <MapPin
                                      size={10}
                                      className="text-gray-400"
                                    />

                                    <span className="text-[9px] text-gray-500 max-w-[120px] truncate">
                                      {
                                        caseData.location
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td className="px-3 py-3 text-[9px] text-gray-500 whitespace-nowrap">
                                  {formatDate(
                                    caseData.date,
                                  )}
                                </td>

                                <td className="px-3 py-3 text-[9px] text-gray-500">
                                  {
                                    caseData.reporter
                                  }
                                </td>

                                <td className="px-3 py-3">
                                  <span
                                    className={`
                                      inline-flex
                                      items-center
                                      px-2
                                      py-1
                                      rounded-full
                                      text-[8px]
                                      font-bold
                                      border
                                      ${
                                        caseData.status ===
                                        "completed"
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                          : caseData.status ===
                                              "refer-for-intervention"
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : caseData.status ===
                                                "intervention-ready"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : caseData.status ===
                                                  "reviewing"
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : caseData.status ===
                                                    "saved-student-statement"
                                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                      }
                                    `}
                                  >
                                    {statusLabels[
                                      caseData
                                        .status
                                    ] ||
                                      caseData.status}
                                  </span>
                                </td>

                                <td className="px-3 py-3">
                                  <span
                                    className={`
                                      inline-flex
                                      items-center
                                      px-2
                                      py-1
                                      rounded-full
                                      text-[8px]
                                      font-bold
                                      border
                                      ${
                                        ai.risk ===
                                        "HIGH"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : ai.risk ===
                                              "MEDIUM"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      }
                                    `}
                                  >
                                    {ai.risk}
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
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div
                className="
                  mt-8
                  pt-5
                  border-t
                  border-gray-200
                  flex
                  flex-col
                  md:flex-row
                  md:items-center
                  md:justify-between
                  gap-2
                "
              >
                <div>
                  <p className="text-[9px] font-bold text-gray-500">
                    Prepared by:
                    GuidEd Administrator
                  </p>

                  <p className="text-[8px] text-gray-400 mt-1">
                    EduGuard Student
                    Discipline and
                    Monitoring System
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-[8px] text-gray-400">
                    Generated on
                  </p>

                  <p className="text-[9px] font-semibold text-gray-600">
                    {formatLongDate(
                      new Date(),
                    )}
                  </p>
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
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  icon,
  label,
  value,
  iconClass = "bg-green-50 text-green-700",
}) => {
  return (
    <div
      className="
        case-summary-card
        rounded-2xl
        border
        border-gray-100
        bg-white
        p-4
        shadow-sm
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
          flex-shrink-0
          ${iconClass}
        `}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            uppercase
            tracking-wider
            text-gray-400
            font-bold
          "
        >
          {label}
        </p>

        <p
          className="
            text-xl
            font-extrabold
            text-gray-900
            mt-0.5
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default CasePrintableReport;

