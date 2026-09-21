import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DashboardPrintableReport from "../components/reports/DashboardPrintableReport";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Bell,
  Brain,
  BriefcaseBusiness,
  HandHelping,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Activity,
  X,
  ExternalLink,
  LogOut,
  ChevronRight,
  MessageSquare,
  FileText,
  CheckCheck,
  Menu,
  Printer,
  Moon,
  Sun,
  Database,
  Wifi,
  TrendingUp,
  Clock3,
  ShieldCheck,
  Zap,
} from "lucide-react";

import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";

import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
);

/* =========================================================
   DASHBOARD

   Dark mode is handled locally through React state.
   No tailwind.config.js is required.

   Global notifications are still handled by:
   GlobalNotifications.jsx
========================================================= */

const DashboardPage = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();

  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPrintableReport, setShowPrintableReport] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  /* =====================================================
     DARK MODE
  ===================================================== */

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("guided-theme");

      if (saved === "dark") return true;
      if (saved === "light") return false;

      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}

    document.documentElement.style.colorScheme = darkMode
      ? "dark"
      : "light";
  }, [darkMode]);

  /* =====================================================
     MOBILE MENU
  ===================================================== */

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  /* =====================================================
     AI
  ===================================================== */

  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");

  const notifSound = useRef(null);

  /* =========================================================
     FETCH DASHBOARD DATA
  ========================================================= */

  const fetchData = async () => {
    try {
      setLoading(true);

      const [studentsResponse, reportsResponse, incidentsResponse] =
        await Promise.all([
          API.get("/api/students"),
          API.get("/api/reports"),
          API.get("/api/incidents"),
        ]);

      setStudents(studentsResponse.data || []);

      setReports(
        reportsResponse.data?.reports ||
          reportsResponse.data ||
          [],
      );

      setIncidents(incidentsResponse.data || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  /* =========================================================
     DOWNLOAD DASHBOARD PDF REPORT
  ========================================================= */

  const downloadDashboardPDF = async () => {
    if (pdfLoading) return;

    try {
      setPdfLoading(true);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      const green = [21, 128, 61];
      const darkGreen = [20, 83, 45];
      const gray = [107, 114, 128];
      const dark = [17, 24, 39];
      const red = [220, 38, 38];
      const amber = [217, 119, 6];

      /* HEADER */

      doc.setFillColor(
        darkGreen[0],
        darkGreen[1],
        darkGreen[2],
      );

      doc.rect(0, 0, pageWidth, 38, "F");

      try {
        const logoResponse = await fetch("/school-logo.webp");

        const logoBlob = await logoResponse.blob();

        const logoData = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;

          reader.readAsDataURL(logoBlob);
        });

        doc.addImage(
          logoData,
          "PNG",
          margin,
          7,
          22,
          22,
        );
      } catch (logoError) {
        console.warn(
          "Could not load school logo:",
          logoError,
        );
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("GuidEd", margin + 27, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(
        "STUDENT GUIDANCE",
        margin + 27,
        22,
      );

      doc.text(
        "Our Lady of the Holy Rosary School - General Trias Campus",
        margin + 27,
        27,
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);

      doc.text(
        "Dashboard Report",
        pageWidth - margin,
        16,
        {
          align: "right",
        },
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(
        new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        pageWidth - margin,
        22,
        {
          align: "right",
        },
      );

      let y = 50;

      doc.setTextColor(
        dark[0],
        dark[1],
        dark[2],
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);

      doc.text(
        "Student Behavioral Overview",
        margin,
        y,
      );

      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.setTextColor(
        gray[0],
        gray[1],
        gray[2],
      );

      doc.text(
        "Summary of current student risk levels, reports, and incident activity.",
        margin,
        y,
      );

      y += 12;

      const cardGap = 4;
      const cardWidth =
        (pageWidth - margin * 2 - cardGap * 3) / 4;

      const cards = [
        {
          title: "Total Students",
          value: kpi.total,
          color: green,
        },
        {
          title: "High Risk",
          value: kpi.high,
          color: red,
        },
        {
          title: "Medium Risk",
          value: kpi.medium,
          color: amber,
        },
        {
          title: "Low Risk",
          value: kpi.low,
          color: green,
        },
      ];

      cards.forEach((card, index) => {
        const x =
          margin +
          index * (cardWidth + cardGap);

        doc.setFillColor(248, 250, 249);

        doc.roundedRect(
          x,
          y,
          cardWidth,
          25,
          3,
          3,
          "F",
        );

        doc.setTextColor(
          gray[0],
          gray[1],
          gray[2],
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);

        doc.text(
          card.title,
          x + 5,
          y + 7,
        );

        doc.setTextColor(
          card.color[0],
          card.color[1],
          card.color[2],
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);

        doc.text(
          String(card.value),
          x + 5,
          y + 18,
        );
      });

      y += 34;

      doc.setTextColor(
        dark[0],
        dark[1],
        dark[2],
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);

      doc.text(
        "Activity Summary",
        margin,
        y,
      );

      y += 5;

      autoTable(doc, {
        startY: y,
        margin: {
          left: margin,
          right: margin,
        },

        head: [["Metric", "Total"]],

        body: [
          ["Submitted Reports", String(reports.length)],
          ["Recorded Incidents", String(incidents.length)],
          ["High-Risk Students", String(kpi.high)],
          ["Medium-Risk Students", String(kpi.medium)],
          ["Low-Risk Students", String(kpi.low)],
        ],

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          textColor: dark,
        },

        headStyles: {
          fillColor: green,
          textColor: 255,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [248, 250, 249],
        },
      });

      y = doc.lastAutoTable.finalY + 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);

      doc.setTextColor(
        dark[0],
        dark[1],
        dark[2],
      );

      doc.text(
        "Students Requiring Attention",
        margin,
        y,
      );

      y += 5;

      const studentRows = topRisk.map(
        (student, index) => [
          String(index + 1),
          `${student.firstName || ""} ${
            student.lastName || ""
          }`.trim() || "Unknown Student",
          String(student.totalIncidents || 0),
          getRisk(student),
        ],
      );

      if (studentRows.length === 0) {
        studentRows.push([
          "-",
          "No students found",
          "0",
          "Low",
        ]);
      }

      autoTable(doc, {
        startY: y,

        margin: {
          left: margin,
          right: margin,
        },

        head: [
          ["#", "Student", "Incidents", "Risk Level"],
        ],

        body: studentRows,

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 3,
          textColor: dark,
        },

        headStyles: {
          fillColor: green,
          textColor: 255,
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [248, 250, 249],
        },

        didParseCell: (data) => {
          if (
            data.section === "body" &&
            data.column.index === 3
          ) {
            const risk = data.cell.raw;

            if (risk === "High") {
              data.cell.styles.textColor = red;
            }

            if (risk === "Medium") {
              data.cell.styles.textColor = amber;
            }

            if (risk === "Low") {
              data.cell.styles.textColor = green;
            }

            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      y = doc.lastAutoTable.finalY + 10;

      if (reports.length > 0) {
        if (y > pageHeight - 70) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);

        doc.setTextColor(
          dark[0],
          dark[1],
          dark[2],
        );

        doc.text(
          "Report Activity",
          margin,
          y,
        );

        y += 5;

        const groupedReports = {};

        reports.forEach((report) => {
          const rawDate =
            report.date ||
            report.createdAt;

          if (!rawDate) return;

          const date = new Date(rawDate);

          if (Number.isNaN(date.getTime())) {
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
            (groupedReports[key] || 0) + 1;
        });

        const reportRows = Object.entries(
          groupedReports,
        ).map(([date, count]) => [
          date,
          String(count),
        ]);

        autoTable(doc, {
          startY: y,

          margin: {
            left: margin,
            right: margin,
          },

          head: [["Date", "Reports"]],

          body: reportRows.length
            ? reportRows
            : [["No report activity", "0"]],

          theme: "grid",

          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 3,
            textColor: dark,
          },

          headStyles: {
            fillColor: green,
            textColor: 255,
            fontStyle: "bold",
          },

          alternateRowStyles: {
            fillColor: [248, 250, 249],
          },
        });
      }

      const totalPages =
        doc.internal.getNumberOfPages();

      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {
        doc.setPage(page);

        doc.setDrawColor(
          229,
          231,
          235,
        );

        doc.line(
          margin,
          pageHeight - 12,
          pageWidth - margin,
          pageHeight - 12,
        );

        doc.setFont(
          "helvetica",
          "normal",
        );

        doc.setFontSize(7);

        doc.setTextColor(
          156,
          163,
          175,
        );

        doc.text(
          "GuidEd - Student Guidance System",
          margin,
          pageHeight - 6,
        );

        doc.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 6,
          {
            align: "right",
          },
        );
      }

      const date =
        new Date()
          .toISOString()
          .split("T")[0];

      doc.save(
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
    } finally {
      setPdfLoading(false);
    }
  };

  /* =========================================================
     FETCH UNREAD NOTIFICATIONS
  ========================================================= */

  const fetchNotifications = useCallback(
    async () => {
      const userId =
        useAuthStore.getState().user?._id;

      if (!userId) return;

      try {
        setNotificationLoading(true);

        const response =
          await API.get(
            `/api/notifications/${userId}/unread`,
          );

        const incoming =
          response.data?.notifications ||
          response.data ||
          [];

        const unread =
          incoming.filter(
            (notification) =>
              !notification.isRead,
          );

        unread.sort(
          (a, b) =>
            new Date(
              b.createdAt || 0,
            ) -
            new Date(
              a.createdAt || 0,
            ),
        );

        setNotifications(unread);
        setNotifCount(unread.length);
      } catch (error) {
        console.error(
          "Fetch notifications error:",
          error,
        );
      } finally {
        setNotificationLoading(false);
      }
    },
    [],
  );

  /* =========================================================
     MARK NOTIFICATION AS READ
  ========================================================= */

  const markAsRead = async (
    notification,
  ) => {
    const notificationId =
      notification._id ||
      notification.id;

    if (!notificationId) return;

    try {
      await API.put(
        `/api/notifications/read/${notificationId}`,
      );

      setNotifications((prev) =>
        prev.filter(
          (item) =>
            String(
              item._id ||
                item.id,
            ) !==
            String(notificationId),
        ),
      );

      setNotifCount((prev) =>
        Math.max(0, prev - 1),
      );
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error,
      );
    }
  };

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  const markAllAsRead = async () => {
    const userId =
      useAuthStore.getState().user?._id;

    if (
      !userId ||
      notifications.length === 0
    ) {
      return;
    }

    try {
      await API.put(
        "/api/notifications/read-all",
      );

      setNotifications([]);
      setNotifCount(0);
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error,
      );
    }
  };

  /* =========================================================
     OPEN NOTIFICATION
  ========================================================= */

  const handleNotificationClick = async (
    notification,
  ) => {
    await markAsRead(notification);

    const type = notification.type;
    const relatedType =
      notification.relatedType;

    setOpenNotif(false);

    if (
      type === "report" ||
      relatedType === "Report"
    ) {
      navigate("/reports");
      return;
    }

    if (
      type === "message" ||
      relatedType === "Message"
    ) {
      navigate("/messages");
      return;
    }

    if (
      type === "incident" ||
      relatedType === "Incident"
    ) {
      navigate("/cases");
      return;
    }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleNavigation = (
    path,
  ) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [fetchNotifications]);

  /* =========================================================
     GLOBAL REALTIME NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    const handleGlobalNotification = (
      event,
    ) => {
      const data = event?.detail;

      if (!data) return;

      const notificationId =
        data._id ||
        data.id ||
        data.notificationId ||
        `${data.type || "general"}-${Date.now()}`;

      const newNotification = {
        _id: notificationId,
        id: notificationId,

        title:
          data.title ||
          "New Notification",

        message:
          data.message ||
          data.body ||
          data.text ||
          "You have a new notification.",

        type:
          data.type ||
          data.notificationType ||
          "general",

        priority:
          data.priority ||
          "low",

        isRead: false,

        relatedId:
          data.relatedId ||
          data.data?.relatedId ||
          null,

        relatedType:
          data.relatedType ||
          data.data?.relatedType ||
          null,

        createdAt:
          data.createdAt ||
          new Date().toISOString(),

        data:
          data.data || {},
      };

      setNotifications((prev) => {
        const alreadyExists =
          prev.some(
            (item) =>
              String(
                item._id ||
                  item.id,
              ) ===
              String(notificationId),
          );

        if (alreadyExists) {
          return prev;
        }

        setNotifCount(
          (count) => count + 1,
        );

        return [
          newNotification,
          ...prev,
        ];
      });
    };

    window.addEventListener(
      "eduguard:new-notification",
      handleGlobalNotification,
    );

    return () => {
      window.removeEventListener(
        "eduguard:new-notification",
        handleGlobalNotification,
      );
    };
  }, []);

  /* =========================================================
     GLOBAL MESSAGE EVENTS
  ========================================================= */

  useEffect(() => {
    const handleNewMessage = (
      event,
    ) => {
      console.log(
        "📨 DASHBOARD GLOBAL MESSAGE EVENT:",
        event?.detail,
      );
    };

    window.addEventListener(
      "eduguard:new-message",
      handleNewMessage,
    );

    return () => {
      window.removeEventListener(
        "eduguard:new-message",
        handleNewMessage,
      );
    };
  }, []);

  /* =========================================================
     RISK
  ========================================================= */

  const getRisk = (student) => {
    const count =
      student.totalIncidents || 0;

    if (count >= 5) return "High";
    if (count >= 2) return "Medium";

    return "Low";
  };

  const kpi = useMemo(
    () => ({
      total: students.length,

      high: students.filter(
        (s) =>
          getRisk(s) === "High",
      ).length,

      medium: students.filter(
        (s) =>
          getRisk(s) === "Medium",
      ).length,

      low: students.filter(
        (s) =>
          getRisk(s) === "Low",
      ).length,
    }),
    [students],
  );

  const topRisk = useMemo(() => {
    const priority = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return [...students]
      .sort(
        (a, b) =>
          priority[
            getRisk(b)
          ] -
          priority[
            getRisk(a)
          ],
      )
      .slice(0, 5);
  }, [students]);

  /* =========================================================
     CHART DATA
  ========================================================= */

  const barData = useMemo(() => {
    const grouped = {};

    reports.forEach(
      (report) => {
        const rawDate =
          report.date ||
          report.createdAt;

        if (!rawDate) {
          grouped.Unknown =
            (grouped.Unknown || 0) +
            1;

          return;
        }

        const date =
          new Date(rawDate);

        if (
          isNaN(
            date.getTime(),
          )
        ) {
          grouped.Unknown =
            (grouped.Unknown || 0) +
            1;

          return;
        }

        const formatted =
          date.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            },
          );

        grouped[formatted] =
          (grouped[formatted] ||
            0) + 1;
      },
    );

    return {
      labels:
        Object.keys(grouped),

      datasets: [
        {
          label: "Reports",

          data:
            Object.values(
              grouped,
            ),

          backgroundColor:
            darkMode
              ? "rgba(74, 222, 128, 0.75)"
              : "rgba(22, 163, 74, 0.78)",

          hoverBackgroundColor:
            "#16A34A",

          borderRadius: 8,

          borderSkipped: false,

          maxBarThickness: 34,
        },
      ],
    };
  }, [reports, darkMode]);

  const pieData = useMemo(
    () => ({
      labels: [
        "High Risk",
        "Medium Risk",
        "Low Risk",
      ],

      datasets: [
        {
          data: [
            kpi.high,
            kpi.medium,
            kpi.low,
          ],

          backgroundColor: [
            "#EF4444",
            "#F59E0B",
            "#22C55E",
          ],

          borderWidth: 0,

          hoverOffset: 5,
        },
      ],
    }),
    [kpi],
  );

  const lineData = useMemo(() => {
    const grouped = {};

    incidents.forEach(
      (incident) => {
        if (!incident.createdAt) {
          return;
        }

        const date =
          new Date(
            incident.createdAt,
          );

        if (
          isNaN(
            date.getTime(),
          )
        ) {
          return;
        }

        const key =
          date
            .toISOString()
            .split("T")[0];

        grouped[key] =
          (grouped[key] || 0) +
          1;
      },
    );

    const sortedDates =
      Object.keys(
        grouped,
      ).sort(
        (a, b) =>
          new Date(a) -
          new Date(b),
      );

    const labels =
      sortedDates.map(
        (dateString) => {
          const date =
            new Date(
              `${dateString}T00:00:00`,
            );

          return date.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            },
          );
        },
      );

    return {
      labels,

      datasets: [
        {
          label: "Incidents",

          data:
            sortedDates.map(
              (date) =>
                grouped[date],
            ),

          borderColor:
            darkMode
              ? "#4ADE80"
              : "#15803D",

          backgroundColor:
            darkMode
              ? "rgba(74,222,128,0.08)"
              : "rgba(21,128,61,0.08)",

          tension: 0.4,

          fill: true,

          pointRadius: 3,

          pointHoverRadius: 6,

          pointBackgroundColor:
            darkMode
              ? "#4ADE80"
              : "#15803D",

          borderWidth: 2.5,
        },
      ],
    };
  }, [incidents, darkMode]);

  /* =========================================================
     AI
  ========================================================= */

  const runAI = async (type) => {
    setAiOpen(true);

    setAiText(
      "Analyzing dashboard data...",
    );

    try {
      const prompt = `
You are an AI assistant for a school behavioral analytics dashboard.

Return a SHORT response (max 4–6 sentences).

Context:

* Type: ${type}
* Students: ${students.length}
* Reports: ${reports.length}
* Incidents: ${incidents.length}

Format:
Give a clear insight, risk interpretation, and action recommendation.

Keep it professional, concise, and appropriate for school administrators.

Do not make disciplinary decisions automatically.
AI output should be treated as decision-support information and reviewed by authorized school personnel.
`;

      const res =
        await API.post(
          "/api/gemini/generate",
          {
            prompt,
          },
        );

      const text =
        res.data?.text ||
        res.data?.response ||
        res.data ||
        "No response from AI.";

      setAiText(
        String(text)
          .replace(
            /```/g,
            "",
          )
          .trim(),
      );
    } catch (error) {
      console.error(
        "AI error:",
        error,
      );

      setAiText(
        "AI is temporarily unavailable. Please check your Gemini endpoint or backend configuration.",
      );
    }
  };

  /* =========================================================
     USER
  ========================================================= */

  const adminName =
    [
      user?.firstName,
      user?.middleName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Administrator";

  const adminPhoto =
    user?.profilePhoto ||
    user?.profilePicture ||
    user?.photo ||
    null;

  const firstName =
    user?.firstName ||
    user?.name?.split(" ")?.[0] ||
    "Administrator";

  /* =========================================================
     THEME COLORS
  ========================================================= */

  const theme = {
    page: darkMode
      ? "bg-[#07110B] text-gray-100"
      : "bg-[#F7F9F8] text-gray-900",

    sidebar: darkMode
      ? "bg-[#0B1710] border-[#17251B]"
      : "bg-white border-gray-100",

    card: darkMode
      ? "bg-[#0D1A12] border-[#1A2C20]"
      : "bg-white border-gray-100",

    subtle: darkMode
      ? "bg-[#101F15]"
      : "bg-gray-50",

    border: darkMode
      ? "border-[#1A2C20]"
      : "border-gray-100",

    heading: darkMode
      ? "text-gray-100"
      : "text-gray-900",

    body: darkMode
      ? "text-gray-300"
      : "text-gray-500",

    muted: darkMode
      ? "text-gray-500"
      : "text-gray-400",

    input: darkMode
      ? "bg-[#101F15] border-[#24392A] text-gray-100"
      : "bg-white border-gray-200 text-gray-900",
  };

  /* =========================================================
     CHART OPTIONS
  ========================================================= */

  const chartText =
    darkMode
      ? "#9CA3AF"
      : "#6B7280";

  const chartGrid =
    darkMode
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.05)";

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: true,

        backgroundColor:
          darkMode
            ? "#102017"
            : "#111827",

        titleColor: "#FFFFFF",

        bodyColor: "#D1D5DB",

        padding: 12,

        cornerRadius: 10,
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        border: {
          display: false,
        },

        ticks: {
          color: chartText,

          maxRotation: 45,

          minRotation: 0,

          autoSkip: true,

          maxTicksLimit: 7,

          font: {
            size: 10,
          },
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          precision: 0,

          color: chartText,

          font: {
            size: 10,
          },
        },

        grid: {
          color: chartGrid,
        },

        border: {
          display: false,
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: true,

        backgroundColor:
          darkMode
            ? "#102017"
            : "#111827",

        titleColor: "#FFFFFF",

        bodyColor: "#D1D5DB",

        padding: 12,

        cornerRadius: 10,
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        border: {
          display: false,
        },

        ticks: {
          color: chartText,

          maxRotation: 45,

          minRotation: 0,

          autoSkip: true,

          maxTicksLimit: 7,

          font: {
            size: 10,
          },
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          precision: 0,

          color: chartText,

          font: {
            size: 10,
          },
        },

        grid: {
          color: chartGrid,
        },

        border: {
          display: false,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "bottom",

        labels: {
          color: chartText,

          usePointStyle: true,

          padding: 14,

          boxWidth: 8,

          font: {
            size: 10,
          },
        },
      },

      tooltip: {
        backgroundColor:
          darkMode
            ? "#102017"
            : "#111827",

        titleColor: "#FFFFFF",

        bodyColor: "#D1D5DB",

        padding: 12,

        cornerRadius: 10,
      },
    },
  };

  /* =========================================================
     SKELETON
  ========================================================= */

  const Skeleton = () => (
    <div
      className={`animate-pulse ${
        darkMode
          ? "bg-[#101F15] border-[#1A2C20]"
          : "bg-white border-gray-100"
      } border rounded-3xl h-32 sm:h-36`}
    />
  );

  /* =========================================================
     NOTIFICATION ICON
  ========================================================= */

  const getNotificationIcon = (
    notification,
  ) => {
    if (
      notification.type ===
        "message" ||
      notification.relatedType ===
        "Message"
    ) {
      return (
        <MessageSquare
          size={15}
          className="text-blue-500"
        />
      );
    }

    if (
      notification.type ===
        "report" ||
      notification.relatedType ===
        "Report"
    ) {
      return (
        <FileText
          size={15}
          className="text-green-500"
        />
      );
    }

    if (
      notification.type ===
        "incident" ||
      notification.relatedType ===
        "Incident"
    ) {
      return (
        <AlertTriangle
          size={15}
          className="text-red-500"
        />
      );
    }

    return (
      <Bell
        size={15}
        className="text-green-500"
      />
    );
  };

  /* =========================================================
     NOTIFICATION COLORS
  ========================================================= */

  const getNotificationBackground =
    (notification) => {
      if (
        notification.type ===
          "message" ||
        notification.relatedType ===
          "Message"
      ) {
        return darkMode
          ? "bg-blue-500/10"
          : "bg-blue-50";
      }

      if (
        notification.type ===
          "report" ||
        notification.relatedType ===
          "Report"
      ) {
        return darkMode
          ? "bg-green-500/10"
          : "bg-green-100";
      }

      if (
        notification.type ===
          "incident" ||
        notification.relatedType ===
          "Incident"
      ) {
        return darkMode
          ? "bg-red-500/10"
          : "bg-red-50";
      }

      return darkMode
        ? "bg-green-500/10"
        : "bg-green-100";
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${theme.page}`}
    >
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className={`
          hidden
          lg:flex
          w-[250px]
          xl:w-[270px]
          border-r
          flex-col
          justify-between
          px-4
          xl:px-5
          py-5
          xl:py-6
          flex-shrink-0
          transition-colors
          duration-300
          ${theme.sidebar}
          ${theme.border}
        `}
      >
        <div>
          {/* BRAND */}

          <div className="px-3 mb-7 xl:mb-8">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 xl:w-11 xl:h-11 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-green-500/10 blur-md" />

                <img
                  src="/school-logo.webp"
                  alt="School Logo"
                  className="relative w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1
                  className={`text-xl font-extrabold tracking-tight ${theme.heading}`}
                >
                  Guid
                  <span className="text-green-500">
                    Ed
                  </span>
                </h1>

                <p
                  className={`text-[8px] xl:text-[9px] uppercase tracking-widest font-semibold ${theme.muted}`}
                >
                  Student Guidance
                </p>
              </div>
            </div>

            <p
              className={`text-[10px] xl:text-[11px] leading-relaxed mt-4 ${theme.muted}`}
            >
              Our Lady of the Holy Rosary
              School
              <br />
              General Trias Campus
            </p>
          </div>

          <p
            className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}
          >
            Main Menu
          </p>

          <div className="space-y-1">
            <Nav
              icon={
                <LayoutDashboard
                  size={18}
                />
              }
              label="Dashboard"
              active
              darkMode={darkMode}
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              onClick={() =>
                navigate("/students")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              onClick={() =>
                navigate("/guidance")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={
                <ChartNoAxesCombined
                  size={18}
                />
              }
              label="Reports"
              onClick={() =>
                navigate("/reports")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={
                <BriefcaseBusiness
                  size={18}
                />
              }
              label="Cases"
              onClick={() =>
                navigate("/cases")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={
                <HandHelping
                  size={18}
                />
              }
              label="Interventions"
              onClick={() =>
                navigate("/interventions")
              }
              darkMode={darkMode}
            />
          </div>

          <p
            className={`px-3 mt-7 xl:mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}
          >
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() =>
              navigate("/settings")
            }
            darkMode={darkMode}
          />
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="space-y-3">
          <div
            className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`relative w-9 h-9 xl:w-10 xl:h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                  darkMode
                    ? "bg-green-500/10"
                    : "bg-green-100"
                }`}
              >
                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt={adminName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <span className="text-green-500 font-bold">
                    {adminName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <span
                  className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
                    darkMode
                      ? "border-[#0B1710]"
                      : "border-white"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}
                >
                  Administrator
                </p>

                <p
                  className={`text-sm font-bold truncate ${theme.heading}`}
                >
                  {adminName}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className={`
              w-full
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              border
              transition
              ${
                darkMode
                  ? "text-gray-300 border-[#24392A] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                  : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
              }
            `}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />

            <motion.aside
              initial={{
                x: "-100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100%",
              }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 280,
              }}
              className={`
                fixed
                left-0
                top-0
                bottom-0
                z-[70]
                w-[280px]
                max-w-[85vw]
                shadow-2xl
                flex
                flex-col
                justify-between
                px-5
                py-5
                lg:hidden
                transition-colors
                duration-300
                ${theme.sidebar}
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src="/school-logo.webp"
                      alt="School Logo"
                      className="w-10 h-10 object-contain"
                    />

                    <div>
                      <h1
                        className={`text-xl font-extrabold tracking-tight ${theme.heading}`}
                      >
                        Guid
                        <span className="text-green-500">
                          Ed
                        </span>
                      </h1>

                      <p
                        className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}
                      >
                        Student Guidance
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setMobileMenuOpen(
                        false,
                      )
                    }
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                      darkMode
                        ? "bg-[#101F15] text-gray-400 hover:bg-[#16271B]"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                <p
                  className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}
                >
                  Main Menu
                </p>

                <div className="space-y-1">
                  <Nav
                    icon={
                      <LayoutDashboard
                        size={18}
                      />
                    }
                    label="Dashboard"
                    active
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <Users size={18} />
                    }
                    label="Students"
                    onClick={() =>
                      handleNavigation(
                        "/students",
                      )
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <ShieldX size={18} />
                    }
                    label="Guidance"
                    onClick={() =>
                      handleNavigation(
                        "/guidance",
                      )
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <ChartNoAxesCombined
                        size={18}
                      />
                    }
                    label="Reports"
                    onClick={() =>
                      handleNavigation(
                        "/reports",
                      )
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <BriefcaseBusiness
                        size={18}
                      />
                    }
                    label="Cases"
                    onClick={() =>
                      handleNavigation(
                        "/cases",
                      )
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <HandHelping
                        size={18}
                      />
                    }
                    label="Interventions"
                    onClick={() =>
                      handleNavigation(
                        "/interventions",
                      )
                    }
                    darkMode={darkMode}
                  />
                </div>

                <p
                  className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}
                >
                  System
                </p>

                <Nav
                  icon={
                    <Settings size={18} />
                  }
                  label="Settings"
                  onClick={() =>
                    handleNavigation(
                      "/settings",
                    )
                  }
                  darkMode={darkMode}
                />
              </div>

              <div className="space-y-3">
                <div
                  className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center ${
                        darkMode
                          ? "bg-green-500/10"
                          : "bg-green-100"
                      }`}
                    >
                      {adminPhoto ? (
                        <img
                          src={adminPhoto}
                          alt={adminName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-green-500 font-bold">
                          {adminName
                            .charAt(
                              0,
                            )
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}
                      >
                        Administrator
                      </p>

                      <p
                        className={`text-sm font-bold truncate ${theme.heading}`}
                      >
                        {adminName}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(
                      false,
                    );

                    logout();
                  }}
                  className={`
                    w-full
                    flex
                    items-center
                    justify-center
                    gap-2
                    py-2.5
                    rounded-xl
                    text-sm
                    font-semibold
                    border
                    transition
                    ${
                      darkMode
                        ? "text-gray-300 border-[#24392A] hover:bg-red-500/10 hover:text-red-400"
                        : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600"
                    }
                  `}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* HEADER */}

        <header
          className={`
            sticky
            top-0
            z-30
            backdrop-blur-xl
            border-b
            transition-colors
            duration-300
            ${
              darkMode
                ? "bg-[#07110B]/90 border-[#17251B]"
                : "bg-[#F7F9F8]/90 border-gray-100"
            }
          `}
        >
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className={`
                  lg:hidden
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  transition
                  flex-shrink-0
                  ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#24392A] text-gray-300 hover:text-green-400"
                      : "bg-white border-gray-200 text-gray-700 hover:text-green-700"
                  }
                `}
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <div
                  className={`hidden sm:flex items-center gap-2 text-xs mb-1 ${theme.muted}`}
                >
                  <span>Overview</span>

                  <ChevronRight
                    size={12}
                  />

                  <span className="text-green-500 font-medium">
                    Dashboard
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h2
                    className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${theme.heading}`}
                  >
                    Good day,{" "}
                    {firstName}.
                  </h2>

                  <span className="hidden sm:inline-flex w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>

                <p
                  className={`text-xs sm:text-sm mt-1 line-clamp-2 ${theme.body}`}
                >
                  Here's your student guidance
                  overview for today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* SYSTEM STATUS */}

              <div
                className={`hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  darkMode
                    ? "bg-green-500/5 border-green-500/10"
                    : "bg-green-50 border-green-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                <span
                  className={`text-[11px] font-semibold ${
                    darkMode
                      ? "text-green-400"
                      : "text-green-700"
                  }`}
                >
                  System Online
                </span>
              </div>

              {/* AI */}

              <button
                onClick={() =>
                  runAI("risk")
                }
                className={`
                  hidden
                  sm:flex
                  items-center
                  gap-2
                  px-3
                  lg:px-4
                  py-2.5
                  rounded-xl
                  border
                  text-sm
                  font-semibold
                  transition
                  ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#24392A] text-gray-300 hover:border-green-500/30 hover:text-green-400"
                      : "bg-white border-gray-200 text-gray-700 hover:border-green-200 hover:text-green-700"
                  }
                `}
              >
                <Brain size={17} />

                <span className="hidden md:inline">
                  AI Insights
                </span>
              </button>

              {/* DARK MODE */}

              <button
                onClick={() =>
                  setDarkMode(
                    (prev) => !prev,
                  )
                }
                className={`
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  transition
                  ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#24392A] text-yellow-300 hover:bg-[#142419]"
                      : "bg-white border-gray-200 text-gray-600 hover:border-green-200 hover:text-green-700"
                  }
                `}
                aria-label="Toggle dark mode"
              >
                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  <motion.div
                    key={
                      darkMode
                        ? "sun"
                        : "moon"
                    }
                    initial={{
                      rotate: -30,
                      opacity: 0,
                      scale: 0.7,
                    }}
                    animate={{
                      rotate: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      rotate: 30,
                      opacity: 0,
                      scale: 0.7,
                    }}
                  >
                    {darkMode ? (
                      <Sun size={18} />
                    ) : (
                      <Moon size={18} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* NOTIFICATIONS */}

              <button
                onClick={() =>
                  setOpenNotif(
                    (prev) => !prev,
                  )
                }
                className={`
                  relative
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  transition
                  ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#24392A] text-gray-300 hover:text-green-400"
                      : "bg-white border-gray-200 text-gray-700 hover:text-green-700"
                  }
                `}
              >
                <Bell size={18} />

                {notifCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 ${
                      darkMode
                        ? "border-[#07110B]"
                        : "border-[#F7F9F8]"
                    }`}
                  >
                    {notifCount >
                    9
                      ? "9+"
                      : notifCount}
                  </span>
                )}
              </button>

              {/* PROFILE */}

              <div
                className={`hidden md:flex items-center gap-2 ml-1 pl-2 border-l ${
                  darkMode
                    ? "border-[#24392A]"
                    : "border-gray-200"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden ${
                    darkMode
                      ? "bg-green-500/10"
                      : "bg-green-100"
                  }`}
                >
                  {adminPhoto ? (
                    <img
                      src={adminPhoto}
                      alt={adminName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-green-500">
                      {adminName.charAt(
                        0,
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-8 space-y-6 sm:space-y-8">
          {/* =================================================
              WELCOME / STATUS HERO
          ================================================= */}

          

          {/* =================================================
              DASHBOARD CONTENT — COMMAND CENTER REDESIGN
              Sidebar, header, and guidance overview intentionally unchanged.
          ================================================= */}
          <div className="space-y-7 sm:space-y-9">

            {/* COMMAND STRIP */}
            <section>
              <div className={`relative overflow-hidden rounded-[30px] border ${theme.border} ${theme.card} shadow-sm`}>
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_90%_10%,rgba(34,197,94,0.12),transparent_30%),radial-gradient(circle_at_5%_100%,rgba(16,185,129,0.08),transparent_28%)]" />
                <div className="relative p-5 sm:p-7">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/15 bg-green-500/5 text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-[0.18em]">
                        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" /></span>
                        Guidance command center
                      </div>
                      <h2 className={`mt-3 text-2xl sm:text-3xl font-black tracking-tight ${theme.heading}`}>Know what needs attention next.</h2>
                      <p className={`mt-2 text-xs sm:text-sm leading-relaxed max-w-lg ${theme.body}`}>
                        A focused workspace for spotting student needs, checking activity, and jumping into the right guidance workflow faster.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 min-w-0 lg:w-[310px]">
                      {[
                        ["Students", kpi.total, Users, "sky"],
                        ["Reports", reports.length, FileText, "violet"],
                        ["Incidents", incidents.length, AlertTriangle, "amber"],
                        ["Unread", notifCount, Bell, "rose"],
                      ].map(([label, value, Icon, color]) => {
                        const c = {
                          sky: darkMode ? "bg-sky-400/10 text-sky-300" : "bg-sky-50 text-sky-600",
                          violet: darkMode ? "bg-violet-400/10 text-violet-300" : "bg-violet-50 text-violet-600",
                          amber: darkMode ? "bg-amber-400/10 text-amber-300" : "bg-amber-50 text-amber-600",
                          rose: darkMode ? "bg-rose-400/10 text-rose-300" : "bg-rose-50 text-rose-600",
                        }[color];
                        return (
                          <div key={label} className={`rounded-2xl border p-3 ${darkMode ? "bg-white/[0.025] border-white/[0.06]" : "bg-white/80 border-gray-100"}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.muted}`}>{label}</span>
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${c}`}><Icon size={13} /></span>
                            </div>
                            <p className={`mt-2 text-xl font-black ${theme.heading}`}>{loading ? "—" : value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* KPI BENTO */}
            <section>
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500">Student landscape</p>
                  <h3 className={`mt-1 text-lg sm:text-xl font-black ${theme.heading}`}>Risk at a glance</h3>
                </div>
                <button onClick={() => setShowPrintableReport(true)} className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[10px] font-extrabold transition-all hover:-translate-y-0.5 ${darkMode ? "border-[#24392A] bg-[#101F15] text-gray-200 hover:border-green-500/30" : "border-gray-200 bg-white text-gray-700 hover:border-green-200 shadow-sm"}`}>
                  <Printer size={13} /> Print snapshot
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { title: "Total students", value: kpi.total, type: "total", icon: Users, note: "Registered in GuidEd", pct: 100 },
                  { title: "High attention", value: kpi.high, type: "high", icon: AlertTriangle, note: "5+ recorded incidents", pct: kpi.total ? Math.round(kpi.high / kpi.total * 100) : 0 },
                  { title: "Moderate attention", value: kpi.medium, type: "medium", icon: Activity, note: "2–4 recorded incidents", pct: kpi.total ? Math.round(kpi.medium / kpi.total * 100) : 0 },
                  { title: "Low attention", value: kpi.low, type: "low", icon: ShieldCheck, note: "0–1 recorded incidents", pct: kpi.total ? Math.round(kpi.low / kpi.total * 100) : 0 },
                ].map((item, index) => {
                  const styles = {
                    total: { accent: "sky", text: darkMode ? "text-sky-300" : "text-sky-600", bg: darkMode ? "bg-sky-400/10" : "bg-sky-50", bar: "bg-sky-500" },
                    high: { accent: "rose", text: darkMode ? "text-rose-300" : "text-rose-600", bg: darkMode ? "bg-rose-400/10" : "bg-rose-50", bar: "bg-rose-500" },
                    medium: { accent: "amber", text: darkMode ? "text-amber-300" : "text-amber-600", bg: darkMode ? "bg-amber-400/10" : "bg-amber-50", bar: "bg-amber-500" },
                    low: { accent: "green", text: darkMode ? "text-green-300" : "text-green-600", bg: darkMode ? "bg-green-400/10" : "bg-green-50", bar: "bg-green-500" },
                  }[item.type];
                  return (
                    <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} whileHover={{ y: -5 }} className={`group relative overflow-hidden rounded-[26px] border p-5 ${theme.card} ${theme.border} shadow-sm hover:shadow-xl transition-shadow`}>
                      <div className={`absolute -right-10 -top-10 w-28 h-28 rounded-full blur-3xl ${styles.bg}`} />
                      <div className="relative flex items-start justify-between">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${styles.bg} ${styles.text}`}><item.icon size={19} /></div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${styles.bg} ${styles.text}`}>{item.pct}%</span>
                      </div>
                      <p className={`mt-5 text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>{item.title}</p>
                      <p className={`mt-1 text-3xl sm:text-4xl font-black tracking-tight ${styles.text}`}>{loading ? "—" : item.value}</p>
                      <div className={`mt-4 h-1.5 rounded-full ${darkMode ? "bg-white/[0.06]" : "bg-gray-100"}`}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(item.pct, 100)}%` }} transition={{ duration: .8, delay: .15 }} className={`h-full rounded-full ${styles.bar}`} /></div>
                      <p className={`mt-2 text-[9px] ${theme.muted}`}>{item.note}</p>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* ACTIONS + HEALTH */}
            <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-4">
              <div className={`rounded-[28px] border p-5 sm:p-6 ${theme.card} ${theme.border}`}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500">Workflow shortcuts</p>
                    <h3 className={`mt-1 text-base sm:text-lg font-black ${theme.heading}`}>Jump into your next task</h3>
                  </div>
                  <Zap size={18} className="text-green-500" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ["Students", "Browse student records", Users, "/students", "green"],
                    ["Reports", "Review submissions", FileText, "/reports", "violet"],
                    ["Cases", "Track active cases", BriefcaseBusiness, "/cases", "amber"],
                    ["Interventions", "Plan support", HandHelping, "/interventions", "sky"],
                  ].map(([label, desc, Icon, path, color]) => {
                    const palette = { green: "text-green-500 bg-green-500/10", violet: "text-violet-500 bg-violet-500/10", amber: "text-amber-500 bg-amber-500/10", sky: "text-sky-500 bg-sky-500/10" }[color];
                    return <motion.button key={label} whileHover={{ y: -3 }} onClick={() => navigate(path)} className={`text-left rounded-2xl border p-3.5 transition-all ${darkMode ? "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]" : "bg-gray-50/70 border-gray-100 hover:bg-white hover:shadow-md"}`}>
                      <div className="flex items-start justify-between"><span className={`w-9 h-9 rounded-xl flex items-center justify-center ${palette}`}><Icon size={16} /></span><ArrowUpRight size={14} className={theme.muted} /></div>
                      <p className={`mt-3 text-xs font-black ${theme.heading}`}>{label}</p><p className={`mt-1 text-[9px] leading-relaxed ${theme.muted}`}>{desc}</p>
                    </motion.button>;
                  })}
                </div>
              </div>

              <div className={`rounded-[28px] border p-5 sm:p-6 ${theme.card} ${theme.border}`}>
                <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500">System pulse</p><h3 className={`mt-1 text-base font-black ${theme.heading}`}>Workspace health</h3></div><Wifi size={17} className="text-green-500" /></div>
                <div className="mt-5 space-y-4">
                  {[['Student records', kpi.total > 0 ? 100 : 0], ['Guidance activity', Math.min(100, reports.length + incidents.length > 0 ? 100 : 20)], ['Unread follow-ups', notifCount ? Math.min(100, notifCount * 12) : 8]].map(([label, pct], i) => <div key={label}><div className="flex justify-between mb-1.5"><span className={`text-[10px] font-semibold ${theme.body}`}>{label}</span><span className={`text-[10px] font-black ${theme.heading}`}>{pct}%</span></div><div className={`h-2 rounded-full ${darkMode ? "bg-white/[0.06]" : "bg-gray-100"}`}><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .7, delay: i * .1 }} className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-400" /></div></div>)}
                </div>
                <div className={`mt-5 rounded-2xl p-3 ${darkMode ? "bg-green-500/5" : "bg-green-50/70"}`}><div className="flex items-center gap-2"><CheckCheck size={14} className="text-green-500" /><span className={`text-[10px] font-bold ${theme.heading}`}>Dashboard is ready</span></div><p className={`mt-1 text-[9px] leading-relaxed ${theme.muted}`}>Use the shortcuts above to move from insight to action.</p></div>
              </div>
            </section>

            {/* RESOURCES */}
            <section>
              <div className="flex items-end justify-between mb-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500">Resource library</p><h3 className={`mt-1 text-lg sm:text-xl font-black ${theme.heading}`}>Guidance essentials</h3></div><BookOpen size={18} className={theme.muted} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResourceCard title="Pupil Handbook" description="Guidelines and policies for pupils." url="https://online.fliphtml5.com/kjzdq/zomc/" type="green" darkMode={darkMode} />
                <ResourceCard title="Student Handbook" description="Student policies, responsibilities and guidelines." url="https://online.fliphtml5.com/kjzdq/fkfo/" type="amber" darkMode={darkMode} />
              </div>
            </section>

            {/* ANALYTICS STUDIO */}
            <section>
              <div className={`rounded-[30px] border p-4 sm:p-6 ${theme.card} ${theme.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500">Analytics studio</p><h3 className={`mt-1 text-lg sm:text-xl font-black ${theme.heading}`}>Patterns worth watching</h3><p className={`text-[10px] mt-1 ${theme.muted}`}>Use the live charts below to understand changes in guidance activity.</p></div>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-[9px] font-bold self-start ${darkMode ? "bg-white/[0.025] border-white/[0.06] text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"}`}><Activity size={12} className="text-green-500" /> Live dashboard data</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ChartPanel title="Reports" subtitle="Submission activity" icon={<FileText size={15} />} accent="green" darkMode={darkMode}><div className="h-[230px] sm:h-[260px]"><Bar data={barData} options={barOptions} /></div></ChartPanel>
                  <ChartPanel title="Risk distribution" subtitle="Current student profile" icon={<ShieldCheck size={15} />} accent="amber" darkMode={darkMode}><div className="h-[230px] sm:h-[260px]"><Pie data={pieData} options={pieOptions} /></div></ChartPanel>
                  <ChartPanel title="Incident trends" subtitle="Activity over time" icon={<TrendingUp size={15} />} accent="blue" darkMode={darkMode}><div className="h-[230px] sm:h-[260px]"><Line data={lineData} options={lineOptions} /></div></ChartPanel>
                </div>
              </div>
            </section>

            {/* ATTENTION BOARD */}
            <section className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4">
              <div className={`rounded-[30px] border overflow-hidden ${theme.card} ${theme.border}`}>
                <div className={`p-5 sm:p-6 border-b ${theme.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">Attention board</p><h3 className={`mt-1 text-lg font-black ${theme.heading}`}>Students to review</h3><p className={`mt-1 text-[10px] ${theme.muted}`}>Prioritized from recorded incident activity.</p></div>
                    <button onClick={() => navigate('/students')} className="inline-flex items-center gap-1.5 text-[10px] font-black text-green-500 hover:text-green-600">View students <ChevronRight size={13} /></button>
                  </div>
                </div>
                <div className="p-2 sm:p-3">
                  {topRisk.length === 0 ? <div className={`py-12 text-center rounded-2xl ${darkMode ? "bg-white/[0.02]" : "bg-gray-50/70"}`}><div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center"><CheckCircle2 size={25} /></div><p className={`mt-3 text-sm font-black ${theme.heading}`}>No students flagged</p><p className={`mt-1 text-[10px] ${theme.muted}`}>There are no students requiring additional attention right now.</p></div> : <div className="space-y-1">{topRisk.map((student, index) => <RiskStudent key={student._id || student.id || index} student={student} index={index} risk={getRisk(student)} darkMode={darkMode} />)}</div>}
                </div>
              </div>

              {/* AI INSIGHT LAB */}
              <div className="relative overflow-hidden rounded-[30px] bg-[#092D19] text-white shadow-xl shadow-green-950/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(74,222,128,0.28),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(16,185,129,0.18),transparent_35%)]" />
                <div className="absolute right-[-40px] top-[90px] w-40 h-40 rounded-full border border-white/5" />
                <div className="relative p-5 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-wider"><Sparkles size={11} /> AI insight lab</span><Brain size={19} className="text-green-300" /></div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight">Turn data into<br />useful questions.</h3>
                  <p className="mt-2 text-[10px] leading-relaxed text-green-50/70">Explore patterns in risk and reports with GuidEd AI before deciding what deserves a closer look.</p>
                  <div className="mt-6 space-y-2">
                    <AIAction label="Analyze Risk" description="Review behavioral risk patterns" onClick={() => runAI('risk')} />
                    <AIAction label="Analyze Reports" description="Find patterns in submitted reports" onClick={() => runAI('reports')} />
                  </div>
                  <div className="mt-auto pt-5 flex items-start gap-2 text-[9px] leading-relaxed text-green-100/60"><ShieldCheck size={13} className="mt-0.5 flex-shrink-0" /><span>AI is decision support. Authorized guidance personnel remain responsible for final decisions.</span></div>
                </div>
              </div>
            </section>

            {/* MOBILE PRINT ACTION */}
            <button onClick={() => setShowPrintableReport(true)} className={`sm:hidden w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black ${theme.card} ${theme.border} ${darkMode ? "text-gray-200" : "text-gray-700"}`}><Printer size={14} /> Generate dashboard snapshot</button>
          </div>
        </div>
      </main>

      {/* =====================================================
          NOTIFICATION DRAWER
      ===================================================== */}

      <AnimatePresence>
        {openNotif && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setOpenNotif(
                  false,
                )
              }
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            />

            <motion.div
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                damping: 28,
              }}
              className={`
                fixed
                right-0
                top-0
                h-full
                w-full
                sm:w-[390px]
                border-l
                shadow-2xl
                z-50
                flex
                flex-col
                transition-colors
                duration-300
                ${
                  darkMode
                    ? "bg-[#0B1710] border-[#1A2C20]"
                    : "bg-white border-gray-100"
                }
              `}
            >
              {/* HEADER */}

              <div
                className={`px-4 sm:px-6 py-4 sm:py-5 border-b flex items-center justify-between gap-3 ${
                  darkMode
                    ? "border-[#1A2C20]"
                    : "border-gray-100"
                }`}
              >
                <div>
                  <h3
                    className={`font-bold flex items-center gap-2 ${theme.heading}`}
                  >
                    <Bell
                      size={17}
                    />
                    Notifications

                    {notifCount >
                      0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px]">
                        {notifCount}
                      </span>
                    )}
                  </h3>

                  <p
                    className={`text-[11px] sm:text-xs mt-1 ${theme.muted}`}
                  >
                    Unread system activity
                  </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {notifications.length >
                    0 && (
                    <button
                      onClick={
                        markAllAsRead
                      }
                      className="text-[10px] sm:text-[11px] font-semibold text-green-500 flex items-center gap-1 px-1"
                    >
                      <CheckCheck
                        size={14}
                      />
                      Read all
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setOpenNotif(
                        false,
                      )
                    }
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                      darkMode
                        ? "hover:bg-[#142419] text-gray-400"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* NOTIFICATIONS */}

              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                {notificationLoading ? (
                  <div className="space-y-3">
                    <div
                      className={`h-24 rounded-2xl animate-pulse ${
                        darkMode
                          ? "bg-[#101F15]"
                          : "bg-gray-50"
                      }`}
                    />

                    <div
                      className={`h-24 rounded-2xl animate-pulse ${
                        darkMode
                          ? "bg-[#101F15]"
                          : "bg-gray-50"
                      }`}
                    />

                    <div
                      className={`h-24 rounded-2xl animate-pulse ${
                        darkMode
                          ? "bg-[#101F15]"
                          : "bg-gray-50"
                      }`}
                    />
                  </div>
                ) : notifications.length ===
                  0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                        darkMode
                          ? "bg-[#101F15]"
                          : "bg-gray-50"
                      }`}
                    >
                      <Bell
                        size={22}
                        className={
                          darkMode
                            ? "text-gray-600"
                            : "text-gray-300"
                        }
                      />
                    </div>

                    <p
                      className={`font-semibold ${theme.heading}`}
                    >
                      You're all caught up
                    </p>

                    <p
                      className={`text-xs mt-1 max-w-[220px] ${theme.muted}`}
                    >
                      New messages and reports
                      will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(
                      (
                        notification,
                      ) => (
                        <motion.button
                          layout
                          key={
                            notification._id ||
                            notification.id
                          }
                          onClick={() =>
                            handleNotificationClick(
                              notification,
                            )
                          }
                          className={`w-full text-left p-3 sm:p-4 rounded-2xl border transition ${
                            darkMode
                              ? "bg-[#101F15] border-[#1A2C20] hover:bg-[#142419] hover:border-green-500/20"
                              : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md hover:border-green-100"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationBackground(
                                notification,
                              )}`}
                            >
                              {getNotificationIcon(
                                notification,
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`font-semibold text-sm break-words ${theme.heading}`}
                                >
                                  {
                                    notification.title
                                  }
                                </p>

                                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                              </div>

                              <p
                                className={`text-xs mt-1 leading-relaxed break-words ${theme.body}`}
                              >
                                {
                                  notification.message
                                }
                              </p>

                              <div className="flex items-center justify-between gap-2 mt-3">
                                <p
                                  className={`text-[9px] sm:text-[10px] truncate ${theme.muted}`}
                                >
                                  {notification.createdAt
                                    ? new Date(
                                        notification.createdAt,
                                      ).toLocaleString()
                                    : "Just now"}
                                </p>

                                <span className="text-[10px] font-semibold text-green-500 flex-shrink-0">
                                  View
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================
          AI MODAL
      ===================================================== */}

      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.96,
            }}
            className={`
              fixed
              bottom-4
              left-4
              right-4
              sm:left-auto
              sm:right-6
              sm:bottom-6
              z-50
              w-auto
              sm:w-[380px]
              border
              rounded-3xl
              shadow-[0_20px_60px_rgba(0,0,0,0.2)]
              overflow-hidden
              ${
                darkMode
                  ? "bg-[#0D1A12] border-[#24392A]"
                  : "bg-white border-gray-100"
              }
            `}
          >
            <div className="p-4 sm:p-5 bg-gradient-to-r from-green-700 to-green-600 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <Sparkles
                      size={17}
                    />
                  </div>

                  <div>
                    <p className="font-bold text-sm">
                      GuidEd AI
                    </p>

                    <p className="text-[9px] sm:text-[10px] text-green-100">
                      Behavioral analytics assistant
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setAiOpen(
                      false,
                    )
                  }
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    darkMode
                      ? "bg-green-500/10"
                      : "bg-green-50"
                  }`}
                >
                  <Brain
                    size={15}
                    className="text-green-500"
                  />
                </div>

                <p
                  className={`text-sm leading-relaxed whitespace-pre-line break-words ${theme.body}`}
                >
                  {aiText}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPrintableReport && (
        <DashboardPrintableReport
          students={students}
          reports={reports}
          incidents={incidents}
          topRisk={topRisk}
          getRisk={getRisk}
          onClose={() =>
            setShowPrintableReport(
              false,
            )
          }
        />
      )}
    </div>
  );
};

/* =========================================================
   NAV
========================================================= */

const Nav = ({
  icon,
  label,
  onClick,
  active,
  darkMode,
}) => (
  <button
    onClick={onClick}
    className={`
      group
      flex
      items-center
      gap-3
      px-3.5
      py-2.5
      rounded-xl
      w-full
      text-sm
      transition
      ${
        active
          ? darkMode
            ? "bg-green-500/10 text-green-400 font-semibold"
            : "bg-green-50 text-green-700 font-semibold"
          : darkMode
            ? "text-gray-400 hover:bg-[#101F15] hover:text-gray-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <span
      className={`
        transition
        ${
          active
            ? "text-green-500"
            : darkMode
              ? "text-gray-600 group-hover:text-gray-300"
              : "text-gray-400 group-hover:text-gray-700"
        }
      `}
    >
      {icon}
    </span>

    {label}

    {active && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
    )}
  </button>
);

/* =========================================================
   MINI STATUS
========================================================= */

const MiniStatus = ({
  icon,
  label,
  value,
  darkMode,
}) => (
  <div
    className={`
      rounded-2xl
      border
      px-3
      py-3
      backdrop-blur
      ${
        darkMode
          ? "bg-white/[0.03] border-white/[0.06]"
          : "bg-white/70 border-green-100"
      }
    `}
  >
    <div className="flex items-center gap-2">
      <span
        className={
          darkMode
            ? "text-green-400"
            : "text-green-600"
        }
      >
        {icon}
      </span>

      <span
        className={`text-[9px] font-semibold ${
          darkMode
            ? "text-gray-500"
            : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>

    <p
      className={`text-lg font-extrabold mt-1 ${
        darkMode
          ? "text-white"
          : "text-gray-900"
      }`}
    >
      {value}
    </p>
  </div>
);

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ title, value, icon, type, darkMode }) => {
  const styles = {
    total: {
      icon: darkMode ? "bg-sky-500/10 text-sky-300" : "bg-sky-50 text-sky-600",
      number: darkMode ? "text-white" : "text-gray-900",
      line: "bg-sky-400",
      glow: "bg-sky-500/10",
    },
    high: {
      icon: darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600",
      number: darkMode ? "text-red-300" : "text-red-600",
      line: "bg-red-500",
      glow: "bg-red-500/10",
    },
    medium: {
      icon: darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600",
      number: darkMode ? "text-amber-300" : "text-amber-600",
      line: "bg-amber-500",
      glow: "bg-amber-500/10",
    },
    low: {
      icon: darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600",
      number: darkMode ? "text-green-300" : "text-green-600",
      line: "bg-green-500",
      glow: "bg-green-500/10",
    },
  };

  const current = styles[type];

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`
        group relative overflow-hidden border rounded-[26px] p-4 sm:p-5
        shadow-sm hover:shadow-xl transition-all duration-300
        ${darkMode ? "bg-[#0D1A12] border-[#1A2C20]" : "bg-white border-gray-100"}
      `}
    >
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl ${current.glow}`} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-green-500/70 to-transparent opacity-60" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {title}
          </p>
          <p className={`text-3xl sm:text-4xl font-black tracking-tight mt-2 ${current.number}`}>
            {value}
          </p>
          <div className={`mt-3 h-1 rounded-full w-9 ${current.line} group-hover:w-14 transition-all duration-300`} />
        </div>

        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${current.icon} group-hover:rotate-3 transition-transform`}>
          {icon}
        </div>
      </div>

      <div className={`relative mt-4 flex items-center gap-1.5 text-[9px] font-semibold ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
        <Activity size={11} />
        Current dashboard count
      </div>
    </motion.div>
  );
};

const ResourceCard = ({ title, description, url, type, darkMode }) => {
  const green = type === "green";

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      className={`
        group relative overflow-hidden cursor-pointer border rounded-[26px] p-4 sm:p-5
        shadow-sm hover:shadow-xl transition-all duration-300
        ${darkMode
          ? "bg-[#0D1A12] border-[#1A2C20] hover:border-green-500/30"
          : "bg-white border-gray-100 hover:border-green-200"}
      `}
    >
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-70 ${
        green ? "bg-green-500/10" : "bg-amber-500/10"
      }`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
          green
            ? darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
            : darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"
        }`}>
          <BookOpen size={20} />
        </div>

        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
          darkMode
            ? "bg-white/5 text-gray-500 group-hover:bg-green-500/10 group-hover:text-green-400"
            : "bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600"
        }`}>
          <ExternalLink size={15} />
        </div>
      </div>

      <h4 className={`relative font-extrabold mt-4 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
        {title}
      </h4>

      <p className={`relative text-xs mt-1.5 leading-relaxed max-w-md ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        {description}
      </p>

      <div className="relative flex items-center justify-between mt-5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">
          Open handbook
        </span>
        <span className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
          ↗
        </span>
      </div>
    </motion.div>
  );
};

const ChartPanel = ({ title, subtitle, children, darkMode, icon, accent = "green" }) => {
  const accentStyles = {
    green: darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600",
    amber: darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600",
    blue: darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600",
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`
        relative overflow-hidden border rounded-[26px] p-4 sm:p-5 shadow-sm
        hover:shadow-lg transition-all duration-300 min-w-0
        ${darkMode ? "bg-[#0D1A12] border-[#1A2C20]" : "bg-white border-gray-100"}
      `}
    >
      <div className={`absolute -right-10 -top-10 w-24 h-24 rounded-full blur-3xl opacity-50 ${
        accent === "blue" ? "bg-blue-500/10" : accent === "amber" ? "bg-amber-500/10" : "bg-green-500/10"
      }`} />

      <div className="relative flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentStyles[accent]}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className={`font-extrabold text-sm truncate ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
              {title}
            </h3>
            <p className={`text-[10px] sm:text-[11px] mt-0.5 truncate ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {subtitle}
            </p>
          </div>
        </div>
        <span className={`hidden sm:block w-1.5 h-1.5 rounded-full ${accent === "blue" ? "bg-blue-400" : accent === "amber" ? "bg-amber-400" : "bg-green-400"}`} />
      </div>

      <div className="relative">{children}</div>
    </motion.div>
  );
};

const RiskStudent = ({ student, index, risk, darkMode }) => {
  const styles = {
    High: {
      badge: darkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-100",
      dot: "bg-red-500",
      avatar: darkMode ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-600",
    },
    Medium: {
      badge: darkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-100",
      dot: "bg-amber-500",
      avatar: darkMode ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-600",
    },
    Low: {
      badge: darkMode ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-50 text-green-600 border-green-100",
      dot: "bg-green-500",
      avatar: darkMode ? "bg-green-500/10 text-green-300" : "bg-green-50 text-green-600",
    },
  };

  const current = styles[risk];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`
        group flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl
        border border-transparent transition-all duration-200
        ${darkMode ? "hover:bg-white/[0.025] hover:border-white/[0.04]" : "hover:bg-gray-50 hover:border-gray-100"}
      `}
    >
      <div className={`w-6 sm:w-7 text-center text-[9px] sm:text-[10px] font-black flex-shrink-0 ${darkMode ? "text-gray-700" : "text-gray-300"}`}>
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black flex-shrink-0 ${current.avatar}`}>
        {student.firstName?.charAt(0)}
        {student.lastName?.charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-xs sm:text-sm font-bold truncate ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
          {student.firstName} {student.lastName}
        </p>
        <div className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
          {student.totalIncidents || 0} incidents
        </div>
      </div>

      <span className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-extrabold flex-shrink-0 ${current.badge}`}>
        {risk}
      </span>
    </motion.div>
  );
};

const AIAction = ({ label, description, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 text-left"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15">
        <Brain size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold truncate">{label}</p>
        <p className="text-[10px] text-green-100/80 truncate mt-0.5">{description}</p>
      </div>
    </div>
    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
      <ArrowUpRight size={14} className="text-green-100" />
    </div>
  </button>
);

export default DashboardPage;