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
  RefreshCw,
  UserRound,
  Clock3,
  CalendarRange,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { API } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

/* =========================================================
   DEFAULTS
========================================================= */

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

/* =========================================================
   LOCAL DATE HELPERS
========================================================= */

const getLocalDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getStartOfMonthInput = () => {
  const now = new Date();

  return getLocalDateInput(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
};

const getStartOfYearInput = () => {
  const now = new Date();

  return getLocalDateInput(
    new Date(now.getFullYear(), 0, 1),
  );
};

const getEndOfYearInput = () => {
  const now = new Date();

  return getLocalDateInput(
    new Date(now.getFullYear(), 11, 31),
  );
};

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
   FORMATTERS
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

const formatDateTime = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatShortDateTime = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const CasePrintableReport = ({ onClose }) => {
  const { user } = useAuthStore();

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
    useState(() =>
      getLocalDateInput(),
    );

  const [customStartDate, setCustomStartDate] =
    useState(() =>
      getStartOfMonthInput(),
    );

  const [customEndDate, setCustomEndDate] =
    useState(() =>
      getLocalDateInput(),
    );

  const [generatedAt, setGeneratedAt] =
    useState(() => new Date());

  /* =========================================================
     CURRENT USER / GENERATOR
  ========================================================= */

  const generatedBy = useMemo(() => {
    const fullName = [
      user?.firstName,
      user?.middleName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      user?.name?.trim() ||
      user?.email?.trim() ||
      "GuidEd Administrator"
    );
  }, [user]);

  const generatedByRole = useMemo(() => {
    if (!user?.role) {
      return "Administrator";
    }

    return (
      String(user.role)
        .charAt(0)
        .toUpperCase() +
      String(user.role).slice(1)
    );
  }, [user]);

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

      setGeneratedAt(new Date());
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
     CUSTOM RANGE FILTER
  ========================================================= */

  const isWithinCustomRange = (date) => {
    if (!date) return false;

    if (!customStartDate || !customEndDate) {
      return false;
    }

    const start = new Date(
      `${customStartDate}T00:00:00`,
    );

    const end = new Date(
      `${customEndDate}T23:59:59.999`,
    );

    const caseDate = new Date(date);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      Number.isNaN(caseDate.getTime())
    ) {
      return false;
    }

    if (start > end) {
      return false;
    }

    return (
      caseDate >= start &&
      caseDate <= end
    );
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

      if (period === "custom") {
        if (
          !isWithinCustomRange(
            caseData.date,
          )
        ) {
          return false;
        }
      } else if (
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
    customStartDate,
    customEndDate,
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
     DATE RANGE
  ========================================================= */

  const dateRange = useMemo(() => {
    if (period === "all") {
      if (cases.length === 0) {
        return {
          start: null,
          end: null,
        };
      }

      const dates = cases
        .map((item) =>
          item.date
            ? new Date(item.date)
            : null,
        )
        .filter(
          (date) =>
            date &&
            !Number.isNaN(
              date.getTime(),
            ),
        )
        .sort(
          (a, b) =>
            a.getTime() - b.getTime(),
        );

      return {
        start: dates[0] || null,
        end:
          dates[dates.length - 1] ||
          null,
      };
    }

    if (period === "custom") {
      return {
        start: customStartDate
          ? new Date(
              `${customStartDate}T00:00:00`,
            )
          : null,
        end: customEndDate
          ? new Date(
              `${customEndDate}T23:59:59.999`,
            )
          : null,
      };
    }

    if (!selectedDate) {
      return {
        start: null,
        end: null,
      };
    }

    const target = new Date(
      `${selectedDate}T00:00:00`,
    );

    if (Number.isNaN(target.getTime())) {
      return {
        start: null,
        end: null,
      };
    }

    if (period === "daily") {
      return {
        start: new Date(
          target.getFullYear(),
          target.getMonth(),
          target.getDate(),
        ),
        end: new Date(
          target.getFullYear(),
          target.getMonth(),
          target.getDate(),
          23,
          59,
          59,
          999,
        ),
      };
    }

    if (period === "monthly") {
      return {
        start: new Date(
          target.getFullYear(),
          target.getMonth(),
          1,
        ),
        end: new Date(
          target.getFullYear(),
          target.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      };
    }

    if (period === "yearly") {
      return {
        start: new Date(
          target.getFullYear(),
          0,
          1,
        ),
        end: new Date(
          target.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999,
        ),
      };
    }

    return {
      start: null,
      end: null,
    };
  }, [
    period,
    selectedDate,
    customStartDate,
    customEndDate,
    cases,
  ]);

  /* =========================================================
     PERIOD LABEL
  ========================================================= */

  const periodLabel = useMemo(() => {
    if (period === "all") {
      return "All Recorded Cases";
    }

    if (period === "custom") {
      if (
        !customStartDate ||
        !customEndDate
      ) {
        return "Custom Date Range";
      }

      const start = new Date(
        `${customStartDate}T00:00:00`,
      );

      const end = new Date(
        `${customEndDate}T00:00:00`,
      );

      return `${formatLongDate(
        start,
      )} – ${formatLongDate(end)}`;
    }

    if (period === "daily") {
      return formatLongDate(
        selectedDate,
      );
    }

    if (period === "monthly") {
      const date = new Date(
        `${selectedDate}T00:00:00`,
      );

      return date.toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        },
      );
    }

    if (period === "yearly") {
      const date = new Date(
        `${selectedDate}T00:00:00`,
      );

      return String(
        date.getFullYear(),
      );
    }

    return "Case Report";
  }, [
    period,
    selectedDate,
    customStartDate,
    customEndDate,
  ]);

  const periodTypeLabel = useMemo(() => {
    if (period === "all") {
      return "All Time";
    }

    if (period === "custom") {
      return "Custom Range";
    }

    if (period === "daily") {
      return "Daily";
    }

    if (period === "monthly") {
      return "Monthly";
    }

    if (period === "yearly") {
      return "Yearly";
    }

    return "Case Report";
  }, [period]);

  /* =========================================================
     STATUS / RISK LABELS
  ========================================================= */

  const selectedStatusLabel =
    statusFilter === "all"
      ? "All Cases"
      : statusLabels[
          statusFilter
        ] || statusFilter;

  const selectedRiskLabel =
    riskFilter === "all"
      ? "All Risk Levels"
      : `${riskFilter} Risk`;

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    if (loading) {
      return;
    }

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
          "/school-logo.webp",
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
         REPORT INFORMATION BOX
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
        pageWidth - margin * 2,
        38,
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
        "REPORT PERIOD",
        margin + 5,
        currentY + 7,
      );

      pdf.text(
        "DATE RANGE",
        margin + 5,
        currentY + 18,
      );

      pdf.text(
        "GENERATED BY",
        margin + 5,
        currentY + 29,
      );

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setTextColor(
        ...dark,
      );

      pdf.text(
        periodTypeLabel,
        margin + 32,
        currentY + 7,
      );

      pdf.text(
        periodLabel,
        margin + 32,
        currentY + 18,
      );

      pdf.text(
        generatedBy,
        margin + 32,
        currentY + 29,
      );

      pdf.setFont(
        "helvetica",
        "bold",
      );

      pdf.setTextColor(
        ...gray,
      );

      pdf.text(
        "STATUS",
        pageWidth - margin - 58,
        currentY + 7,
      );

      pdf.text(
        "RISK",
        pageWidth - margin - 58,
        currentY + 18,
      );

      pdf.text(
        "GENERATED ON",
        pageWidth - margin - 58,
        currentY + 29,
      );

      pdf.setFont(
        "helvetica",
        "normal",
      );

      pdf.setTextColor(
        ...dark,
      );

      pdf.text(
        selectedStatusLabel,
        pageWidth - margin - 5,
        currentY + 7,
        {
          align: "right",
        },
      );

      pdf.text(
        selectedRiskLabel,
        pageWidth - margin - 5,
        currentY + 18,
        {
          align: "right",
        },
      );

      pdf.text(
        formatShortDateTime(
          generatedAt,
        ),
        pageWidth - margin - 5,
        currentY + 29,
        {
          align: "right",
        },
      );

      currentY += 44;

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
          label: "FOR INTERVENTION",
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
          font: "helvetica",
          fontSize: 6.5,
          cellPadding: 2.2,
          textColor: dark,
          lineColor: border,
          lineWidth: 0.2,
          overflow: "linebreak",
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
        const emptyY =
          currentY + 10;

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
          emptyY,
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
          `Generated by ${generatedBy} • ${formatShortDateTime(
            generatedAt,
          )}`,
          margin,
          pageHeight - 4,
        );
      }

      /* =====================================================
         SAVE
      ===================================================== */

      let safeDatePart =
        selectedDate;

      if (period === "custom") {
        safeDatePart = `${customStartDate}-to-${customEndDate}`;
      }

      if (period === "all") {
        safeDatePart = "all-time";
      }

      safeDatePart = safeDatePart.replace(
        /[^0-9a-zA-Z-]/g,
        "",
      );

      pdf.save(
        `GuidEd-Case-Management-Report-${safeDatePart}.pdf`,
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
     CUSTOM RANGE VALIDATION
  ========================================================= */

  const customRangeInvalid =
    period === "custom" &&
    customStartDate &&
    customEndDate &&
    new Date(
      `${customStartDate}T00:00:00`,
    ) >
      new Date(
        `${customEndDate}T23:59:59.999`,
      );

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
              background: white !important;
              padding: 0 !important;
            }

            .case-print-paper {
              box-shadow: none !important;
              border-radius: 0 !important;
              max-width: none !important;
              width: 100% !important;
              padding: 20px !important;
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
                  Review, filter, print, or
                  export case records.
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
            {/* PERIOD TABS */}

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarRange
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

              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                {[
                  {
                    value: "all",
                    label: "All Time",
                  },
                  {
                    value: "daily",
                    label: "Daily",
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
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() =>
                      setPeriod(
                        item.value,
                      )
                    }
                    className={`
                      px-3.5
                      h-9
                      rounded-xl
                      text-[10px]
                      font-bold
                      transition
                      border
                      ${
                        period ===
                        item.value
                          ? "bg-green-600 text-white border-green-600 shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTERS */}

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

              {/* REFERENCE DATE */}

              {period !== "custom" && (
                <div
                  className={
                    period === "all"
                      ? "sm:col-span-2 lg:col-span-2"
                      : ""
                  }
                >
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
              )}

              {/* CUSTOM RANGE */}

              {period === "custom" && (
                <>
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
                      From Date
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
                          customStartDate
                        }
                        onChange={(e) =>
                          setCustomStartDate(
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
                      To Date
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
                          customEndDate
                        }
                        onChange={(e) =>
                          setCustomEndDate(
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
                </>
              )}
            </div>

            {/* CUSTOM RANGE ERROR */}

            {customRangeInvalid && (
              <div
                className="
                  mt-3
                  px-3
                  py-2.5
                  rounded-xl
                  bg-red-50
                  border
                  border-red-100
                  text-[10px]
                  font-semibold
                  text-red-600
                "
              >
                The start date cannot be
                later than the end date.
              </div>
            )}

            {/* ACTION BUTTONS */}

            <div
              className="
                flex
                flex-col
                sm:flex-row
                items-stretch
                sm:items-center
                justify-between
                gap-3
                mt-4
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-2.5
                    py-1.5
                    rounded-full
                    bg-green-50
                    border
                    border-green-100
                    text-[9px]
                    font-bold
                    text-green-700
                  "
                >
                  <CalendarRange
                    size={11}
                  />

                  {periodTypeLabel}
                </span>

                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    px-2.5
                    py-1.5
                    rounded-full
                    bg-white
                    border
                    border-gray-200
                    text-[9px]
                    font-bold
                    text-gray-500
                  "
                >
                  {filteredCases.length}{" "}
                  case
                  {filteredCases.length !==
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  justify-end
                  gap-2
                "
              >
                <button
                  onClick={
                    handleDownloadPDF
                  }
                  disabled={
                    downloading ||
                    loading ||
                    customRangeInvalid
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
                      <Download
                        size={15}
                      />

                      Download PDF
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  disabled={
                    loading ||
                    customRangeInvalid
                  }
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
                case-print-paper
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
                    src="/school-logo.webp"
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
                  REPORT INFORMATION
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
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-4
                  "
                >
                  {/* PERIOD */}

                  <ReportMeta
                    icon={
                      <CalendarRange
                        size={14}
                      />
                    }
                    label="Report Period"
                    value={
                      periodTypeLabel
                    }
                  />

                  {/* DATE RANGE */}

                  <ReportMeta
                    icon={
                      <CalendarDays
                        size={14}
                      />
                    }
                    label="Date Range"
                    value={
                      dateRange.start &&
                      dateRange.end
                        ? `${formatLongDate(
                            dateRange.start,
                          )} – ${formatLongDate(
                            dateRange.end,
                          )}`
                        : "All available records"
                    }
                  />

                  {/* GENERATED BY */}

                  <ReportMeta
                    icon={
                      <UserRound
                        size={14}
                      />
                    }
                    label="Generated By"
                    value={
                      generatedBy
                    }
                    subValue={
                      generatedByRole
                    }
                  />

                  {/* GENERATED ON */}

                  <ReportMeta
                    icon={
                      <Clock3
                        size={14}
                      />
                    }
                    label="Generated On"
                    value={formatDateTime(
                      generatedAt,
                    )}
                  />
                </div>

                <div
                  className="
                    mt-4
                    pt-4
                    border-t
                    border-gray-200
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
                    {selectedRiskLabel}
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
                    {filteredCases.length}{" "}
                    Records Included
                  </span>
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
                      {filteredCases.length}{" "}
                      case
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
                              filters or
                              date range.
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
                  gap-4
                "
              >
                <div>
                  <div className="flex items-center gap-2">
                    <UserRound
                      size={13}
                      className="text-green-600"
                    />

                    <p className="text-[9px] font-bold text-gray-600">
                      Prepared by:{" "}
                      {generatedBy}
                    </p>
                  </div>

                  <p className="text-[8px] text-gray-400 mt-1 ml-5">
                    {generatedByRole} ·
                    GuidEd Student
                    Discipline and
                    Monitoring System
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5">
                    <Clock3
                      size={11}
                      className="text-gray-400"
                    />

                    <p className="text-[8px] text-gray-400">
                      Generated on
                    </p>
                  </div>

                  <p className="text-[9px] font-semibold text-gray-600 mt-1">
                    {formatDateTime(
                      generatedAt,
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
   REPORT META
========================================================= */

const ReportMeta = ({
  icon,
  label,
  value,
  subValue,
}) => {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="
          w-8
          h-8
          rounded-lg
          bg-green-50
          text-green-700
          flex
          items-center
          justify-center
          flex-shrink-0
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[8px]
            uppercase
            tracking-wider
            font-bold
            text-gray-400
          "
        >
          {label}
        </p>

        <p
          className="
            text-[10px]
            md:text-[11px]
            font-bold
            text-gray-800
            mt-0.5
            break-words
          "
        >
          {value}
        </p>

        {subValue && (
          <p className="text-[8px] text-gray-400 mt-0.5">
            {subValue}
          </p>
        )}
      </div>
    </div>
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