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

   IMPORTANT:
   DashboardPage DOES NOT create its own Socket.IO
   connection.

   Realtime notifications are handled globally by:

   GlobalNotifications.jsx

   GlobalNotifications dispatches:

   "eduguard:new-notification"

   This dashboard listens to that event and updates the
   notification drawer immediately.
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

  const [aiOpen, setAiOpen] = useState(false);

  const [aiText, setAiText] = useState("");

  /*
   * Kept for compatibility, but notification sound is
   * now handled by GlobalNotifications.jsx.
   */
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

      setReports(reportsResponse.data?.reports || reportsResponse.data || []);

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

   IMPORTANT:
   This does NOT use html2canvas.

   Therefore Tailwind's generated oklch() colors will
   NOT cause PDF generation errors.
========================================================= */

  const downloadDashboardPDF = async () => {
    if (pdfLoading) {
      return;
    }

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

      /* =====================================================
       COLORS
    ===================================================== */

      const green = [21, 128, 61];
      const darkGreen = [20, 83, 45];
      const gray = [107, 114, 128];
      const lightGray = [243, 244, 246];
      const dark = [17, 24, 39];
      const red = [220, 38, 38];
      const amber = [217, 119, 6];

      /* =====================================================
       HEADER
    ===================================================== */

      doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2]);

      doc.rect(0, 0, pageWidth, 38, "F");

      /* LOGO */

      try {
        const logoResponse = await fetch("/school-logo.webp");

        const logoBlob = await logoResponse.blob();

        const logoData = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);

          reader.onerror = reject;

          reader.readAsDataURL(logoBlob);
        });

        doc.addImage(logoData, "PNG", margin, 7, 22, 22);
      } catch (logoError) {
        console.warn("Could not load school logo:", logoError);
      }

      doc.setTextColor(255, 255, 255);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(20);

      doc.text("GuidEd", margin + 27, 16);

      doc.setFont("helvetica", "normal");

      doc.setFontSize(8);

      doc.text("STUDENT GUIDANCE", margin + 27, 22);

      doc.setFontSize(8);

      doc.text(
        "Our Lady of the Holy Rosary School - General Trias Campus",
        margin + 27,
        27,
      );

      doc.setFont("helvetica", "bold");

      doc.setFontSize(11);

      doc.text("Dashboard Report", pageWidth - margin, 16, {
        align: "right",
      });

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

      /* =====================================================
       REPORT INTRO
    ===================================================== */

      let y = 50;

      doc.setTextColor(dark[0], dark[1], dark[2]);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(15);

      doc.text("Student Behavioral Overview", margin, y);

      y += 6;

      doc.setFont("helvetica", "normal");

      doc.setFontSize(8);

      doc.setTextColor(gray[0], gray[1], gray[2]);

      doc.text(
        "Summary of current student risk levels, reports, and incident activity.",
        margin,
        y,
      );

      y += 12;

      /* =====================================================
       KPI CARDS
    ===================================================== */

      const cardGap = 4;

      const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;

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
        const x = margin + index * (cardWidth + cardGap);

        doc.setFillColor(248, 250, 249);

        doc.roundedRect(x, y, cardWidth, 25, 3, 3, "F");

        doc.setTextColor(gray[0], gray[1], gray[2]);

        doc.setFont("helvetica", "normal");

        doc.setFontSize(7);

        doc.text(card.title, x + 5, y + 7);

        doc.setTextColor(card.color[0], card.color[1], card.color[2]);

        doc.setFont("helvetica", "bold");

        doc.setFontSize(17);

        doc.text(String(card.value), x + 5, y + 18);
      });

      y += 34;

      /* =====================================================
       REPORT / INCIDENT SUMMARY
    ===================================================== */

      doc.setTextColor(dark[0], dark[1], dark[2]);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(12);

      doc.text("Activity Summary", margin, y);

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

      /* =====================================================
       STUDENTS REQUIRING ATTENTION
    ===================================================== */

      doc.setFont("helvetica", "bold");

      doc.setFontSize(12);

      doc.setTextColor(dark[0], dark[1], dark[2]);

      doc.text("Students Requiring Attention", margin, y);

      y += 5;

      const studentRows = topRisk.map((student, index) => [
        String(index + 1),
        `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
          "Unknown Student",
        String(student.totalIncidents || 0),
        getRisk(student),
      ]);

      if (studentRows.length === 0) {
        studentRows.push(["-", "No students found", "0", "Low"]);
      }

      autoTable(doc, {
        startY: y,
        margin: {
          left: margin,
          right: margin,
        },

        head: [["#", "Student", "Incidents", "Risk Level"]],

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
          if (data.section === "body" && data.column.index === 3) {
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

      /* =====================================================
       REPORT ACTIVITY BY DATE
    ===================================================== */

      if (reports.length > 0) {
        if (y > pageHeight - 70) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");

        doc.setFontSize(12);

        doc.setTextColor(dark[0], dark[1], dark[2]);

        doc.text("Report Activity", margin, y);

        y += 5;

        const groupedReports = {};

        reports.forEach((report) => {
          const rawDate = report.date || report.createdAt;

          if (!rawDate) {
            return;
          }

          const date = new Date(rawDate);

          if (Number.isNaN(date.getTime())) {
            return;
          }

          const key = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          groupedReports[key] = (groupedReports[key] || 0) + 1;
        });

        const reportRows = Object.entries(groupedReports).map(
          ([date, count]) => [date, String(count)],
        );

        autoTable(doc, {
          startY: y,
          margin: {
            left: margin,
            right: margin,
          },

          head: [["Date", "Reports"]],

          body: reportRows.length ? reportRows : [["No report activity", "0"]],

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

      /* =====================================================
       FOOTER ON EVERY PAGE
    ===================================================== */

      const totalPages = doc.internal.getNumberOfPages();

      for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);

        doc.setDrawColor(229, 231, 235);

        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont("helvetica", "normal");

        doc.setFontSize(7);

        doc.setTextColor(156, 163, 175);

        doc.text("GuidEd - Student Guidance System", margin, pageHeight - 6);

        doc.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 6,
          {
            align: "right",
          },
        );
      }

      /* =====================================================
       SAVE
    ===================================================== */

      const date = new Date().toISOString().split("T")[0];

      doc.save(`GuidEd-Dashboard-Report-${date}.pdf`);
    } catch (error) {
      console.error("Dashboard PDF generation error:", error);

      alert("Failed to generate the PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  /* =========================================================
     FETCH UNREAD NOTIFICATIONS
  ========================================================= */

  const fetchNotifications = useCallback(async () => {
    const userId = useAuthStore.getState().user?._id;

    if (!userId) {
      return;
    }

    try {
      setNotificationLoading(true);

      const response = await API.get(`/api/notifications/${userId}/unread`);

      const incoming = response.data?.notifications || response.data || [];

      const unread = incoming.filter((notification) => !notification.isRead);

      /*
       * Sort newest first.
       */
      unread.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

      setNotifications(unread);
      setNotifCount(unread.length);
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  /* =========================================================
     MARK NOTIFICATION AS READ
  ========================================================= */

  const markAsRead = async (notification) => {
    const notificationId = notification._id || notification.id;

    if (!notificationId) {
      return;
    }

    try {
      await API.put(`/api/notifications/read/${notificationId}`);

      setNotifications((prev) =>
        prev.filter(
          (item) => String(item._id || item.id) !== String(notificationId),
        ),
      );

      setNotifCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  };

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  const markAllAsRead = async () => {
    const userId = useAuthStore.getState().user?._id;

    if (!userId || notifications.length === 0) {
      return;
    }

    try {
      await API.put("/api/notifications/read-all");;

      setNotifications([]);
      setNotifCount(0);
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
    }
  };

  /* =========================================================
     OPEN NOTIFICATION
  ========================================================= */

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification);

    const type = notification.type;

    const relatedType = notification.relatedType;

    setOpenNotif(false);

    if (type === "report" || relatedType === "Report") {
      navigate("/reports");
      return;
    }

    if (type === "message" || relatedType === "Message") {
      navigate("/messages");
      return;
    }

    if (type === "incident" || relatedType === "Incident") {
      navigate("/cases");
      return;
    }
  };

  /* =========================================================
     NAVIGATION HELPER
  ========================================================= */

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  /* =========================================================
     INITIAL DASHBOARD LOAD
  ========================================================= */

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [fetchNotifications]);

  /* =========================================================
     GLOBAL REALTIME NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    const handleGlobalNotification = (event) => {
      const data = event?.detail;

      if (!data) {
        return;
      }

      console.log("====================================");

      console.log("📩 DASHBOARD GLOBAL NOTIFICATION RECEIVED");

      console.log("====================================");

      console.log("Notification:", data);

      const notificationId =
        data._id ||
        data.id ||
        data.notificationId ||
        `${data.type || "general"}-${Date.now()}`;

      /* =================================================
           NORMALIZE NOTIFICATION
        ================================================= */

      const newNotification = {
        _id: notificationId,

        id: notificationId,

        title: data.title || "New Notification",

        message:
          data.message ||
          data.body ||
          data.text ||
          "You have a new notification.",

        type: data.type || data.notificationType || "general",

        priority: data.priority || "low",

        isRead: false,

        relatedId: data.relatedId || data.data?.relatedId || null,

        relatedType: data.relatedType || data.data?.relatedType || null,

        createdAt: data.createdAt || new Date().toISOString(),

        data: data.data || {},
      };

      /* =================================================
           PREVENT DUPLICATES
        ================================================= */

      let wasAdded = false;

      setNotifications((prev) => {
        const alreadyExists = prev.some(
          (item) => String(item._id || item.id) === String(notificationId),
        );

        if (alreadyExists) {
          console.log(
            "⏭️ Dashboard ignored duplicate notification:",
            notificationId,
          );

          return prev;
        }

        wasAdded = true;

        console.log(
          "✅ Dashboard adding realtime notification:",
          newNotification,
        );

        return [newNotification, ...prev];
      });

      if (wasAdded) {
        setNotifCount((prev) => prev + 1);
      }
    };

    window.addEventListener(
      "eduguard:new-notification",
      handleGlobalNotification,
    );

    console.log("👂 DASHBOARD GLOBAL NOTIFICATION LISTENER ACTIVE");

    return () => {
      window.removeEventListener(
        "eduguard:new-notification",
        handleGlobalNotification,
      );

      console.log("🧹 DASHBOARD GLOBAL NOTIFICATION LISTENER REMOVED");
    };
  }, []);

  /* =========================================================
     GLOBAL MESSAGE EVENTS
  ========================================================= */

  useEffect(() => {
    const handleNewMessage = (event) => {
      console.log("📨 DASHBOARD GLOBAL MESSAGE EVENT:", event?.detail);
    };

    window.addEventListener("eduguard:new-message", handleNewMessage);

    return () => {
      window.removeEventListener("eduguard:new-message", handleNewMessage);
    };
  }, []);

  /* =========================================================
     RISK
  ========================================================= */

  const getRisk = (student) => {
    const count = student.totalIncidents || 0;

    if (count >= 5) {
      return "High";
    }

    if (count >= 2) {
      return "Medium";
    }

    return "Low";
  };

  const kpi = useMemo(
    () => ({
      total: students.length,

      high: students.filter((s) => getRisk(s) === "High").length,

      medium: students.filter((s) => getRisk(s) === "Medium").length,

      low: students.filter((s) => getRisk(s) === "Low").length,
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
      .sort((a, b) => priority[getRisk(b)] - priority[getRisk(a)])
      .slice(0, 5);
  }, [students]);

  /* =========================================================
     CHART DATA
  ========================================================= */

  const barData = useMemo(() => {
    const grouped = {};

    reports.forEach((report) => {
      const rawDate = report.date || report.createdAt;

      if (!rawDate) {
        grouped.Unknown = (grouped.Unknown || 0) + 1;

        return;
      }

      const date = new Date(rawDate);

      if (isNaN(date.getTime())) {
        grouped.Unknown = (grouped.Unknown || 0) + 1;

        return;
      }

      const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      grouped[formatted] = (grouped[formatted] || 0) + 1;
    });

    return {
      labels: Object.keys(grouped),

      datasets: [
        {
          label: "Reports",

          data: Object.values(grouped),

          backgroundColor: "rgba(22, 163, 74, 0.78)",

          hoverBackgroundColor: "#15803D",

          borderRadius: 8,

          borderSkipped: false,

          maxBarThickness: 34,
        },
      ],
    };
  }, [reports]);

  const pieData = useMemo(
    () => ({
      labels: ["High Risk", "Medium Risk", "Low Risk"],

      datasets: [
        {
          data: [kpi.high, kpi.medium, kpi.low],

          backgroundColor: ["#EF4444", "#F59E0B", "#22C55E"],

          borderWidth: 0,

          hoverOffset: 5,
        },
      ],
    }),
    [kpi],
  );

  const lineData = useMemo(() => {
    const grouped = {};

    incidents.forEach((incident) => {
      if (!incident.createdAt) {
        return;
      }

      const date = new Date(incident.createdAt);

      if (isNaN(date.getTime())) {
        return;
      }

      const key = date.toISOString().split("T")[0];

      grouped[key] = (grouped[key] || 0) + 1;
    });

    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(a) - new Date(b),
    );

    const labels = sortedDates.map((dateString) => {
      const date = new Date(`${dateString}T00:00:00`);

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    return {
      labels,

      datasets: [
        {
          label: "Incidents",

          data: sortedDates.map((date) => grouped[date]),

          borderColor: "#15803D",

          backgroundColor: "rgba(21,128,61,0.08)",

          tension: 0.4,

          fill: true,

          pointRadius: 3,

          pointHoverRadius: 6,

          pointBackgroundColor: "#15803D",

          borderWidth: 2.5,
        },
      ],
    };
  }, [incidents]);

  /* =========================================================
     AI
  ========================================================= */

  const runAI = async (type) => {
    setAiOpen(true);

    setAiText("Analyzing dashboard data...");

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
`;

      const res = await API.post("/api/gemini/generate", {
        prompt,
      });

      const text =
        res.data?.text ||
        res.data?.response ||
        res.data ||
        "No response from AI.";

      setAiText(String(text).replace(/```/g, "").trim());
    } catch (error) {
      console.error("AI error:", error);

      setAiText(
        "AI is temporarily unavailable. Please check your Gemini endpoint or backend configuration.",
      );
    }
  };

  /* =========================================================
     ADMIN
  ========================================================= */

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Administrator";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  const firstName =
    user?.firstName || user?.name?.split(" ")?.[0] || "Administrator";

  /* =========================================================
     CHART OPTIONS
  ========================================================= */

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        enabled: true,
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
          font: {
            size: 10,
          },
        },

        grid: {
          color: "rgba(0,0,0,0.05)",
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
          font: {
            size: 10,
          },
        },

        grid: {
          color: "rgba(0,0,0,0.05)",
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
          usePointStyle: true,

          padding: 14,

          boxWidth: 8,

          font: {
            size: 10,
          },
        },
      },
    },
  };

  /* =========================================================
     SKELETON
  ========================================================= */

  const Skeleton = () => (
    <div className="animate-pulse bg-white border border-gray-100 rounded-3xl h-32 sm:h-36" />
  );

  /* =========================================================
     NOTIFICATION ICON
  ========================================================= */

  const getNotificationIcon = (notification) => {
    if (
      notification.type === "message" ||
      notification.relatedType === "Message"
    ) {
      return <MessageSquare size={15} className="text-blue-600" />;
    }

    if (
      notification.type === "report" ||
      notification.relatedType === "Report"
    ) {
      return <FileText size={15} className="text-green-700" />;
    }

    if (
      notification.type === "incident" ||
      notification.relatedType === "Incident"
    ) {
      return <AlertTriangle size={15} className="text-red-600" />;
    }

    return <Bell size={15} className="text-green-700" />;
  };

  /* =========================================================
     NOTIFICATION COLORS
  ========================================================= */

  const getNotificationBackground = (notification) => {
    if (
      notification.type === "message" ||
      notification.relatedType === "Message"
    ) {
      return "bg-blue-50";
    }

    if (
      notification.type === "report" ||
      notification.relatedType === "Report"
    ) {
      return "bg-green-100";
    }

    if (
      notification.type === "incident" ||
      notification.relatedType === "Incident"
    ) {
      return "bg-red-50";
    }

    return "bg-green-100";
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F7F9F8] text-gray-900 overflow-hidden">
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="hidden lg:flex w-[250px] xl:w-[270px] bg-white border-r border-gray-100 flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 flex-shrink-0">
        <div>
          {/* BRAND */}

          <div className="px-3 mb-7 xl:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 xl:w-11 xl:h-11 flex items-center justify-center flex-shrink-0">
                <img
                  src="/school-logo.webp"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                  Guid
                  <span className="text-green-600">Ed</span>
                </h1>

                <p className="text-[8px] xl:text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                  Student Guidance
                </p>
              </div>
            </div>

            <p className="text-[10px] xl:text-[11px] leading-relaxed text-gray-400 mt-4">
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>
          </div>

          {/* NAV LABEL */}

          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">
            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              onClick={() => navigate("/students")}
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              onClick={() => navigate("/guidance")}
            />

            <Nav
              icon={<ChartNoAxesCombined size={18} />}
              label="Reports"
              onClick={() => navigate("/reports")}
            />

            <Nav
              icon={<BriefcaseBusiness size={18} />}
              label="Cases"
              onClick={() => navigate("/cases")}
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              onClick={() => navigate("/interventions")}
            />
          </div>

          <p className="px-3 mt-7 xl:mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => navigate("/settings")}
          />
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 xl:w-10 xl:h-10 rounded-xl overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0">
                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt={adminName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-green-700 font-bold">
                    {adminName.charAt(0).toUpperCase()}
                  </span>
                )}

                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Administrator
                </p>

                <p className="text-sm font-bold text-gray-900 truncate">
                  {adminName}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              text-gray-600
              border border-gray-200
              hover:bg-red-50
              hover:text-red-600
              hover:border-red-100
              transition
            "
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE MENU OVERLAY
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
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60] lg:hidden"
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
              className="
                fixed
                left-0
                top-0
                bottom-0
                z-[70]
                w-[280px]
                max-w-[85vw]
                bg-white
                shadow-2xl
                flex
                flex-col
                justify-between
                px-5
                py-5
                lg:hidden
              "
            >
              <div>
                {/* MOBILE BRAND */}

                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <img
                        src="/school-logo.webp"
                        alt="School Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                        Guid
                        <span className="text-green-600">Ed</span>
                      </h1>

                      <p className="text-[8px] uppercase tracking-widest text-gray-400 font-semibold">
                        Student Guidance
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Main Menu
                </p>

                <div className="space-y-1">
                  <Nav
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    active
                  />

                  <Nav
                    icon={<Users size={18} />}
                    label="Students"
                    onClick={() => handleNavigation("/students")}
                  />

                  <Nav
                    icon={<ShieldX size={18} />}
                    label="Guidance"
                    onClick={() => handleNavigation("/guidance")}
                  />

                  <Nav
                    icon={<ChartNoAxesCombined size={18} />}
                    label="Reports"
                    onClick={() => handleNavigation("/reports")}
                  />

                  <Nav
                    icon={<BriefcaseBusiness size={18} />}
                    label="Cases"
                    onClick={() => handleNavigation("/cases")}
                  />

                  <Nav
                    icon={<HandHelping size={18} />}
                    label="Interventions"
                    onClick={() => handleNavigation("/interventions")}
                  />
                </div>

                <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  System
                </p>

                <Nav
                  icon={<Settings size={18} />}
                  label="Settings"
                  onClick={() => handleNavigation("/settings")}
                />
              </div>

              {/* MOBILE SIDEBAR FOOTER */}

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0">
                      {adminPhoto ? (
                        <img
                          src={adminPhoto}
                          alt={adminName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-green-700 font-bold">
                          {adminName.charAt(0).toUpperCase()}
                        </span>
                      )}

                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                        Administrator
                      </p>

                      <p className="text-sm font-bold text-gray-900 truncate">
                        {adminName}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="
                    w-full
                    flex
                    items-center
                    justify-center
                    gap-2
                    py-2.5
                    rounded-xl
                    text-sm
                    font-semibold
                    text-gray-600
                    border border-gray-200
                    hover:bg-red-50
                    hover:text-red-600
                    hover:border-red-100
                    transition
                  "
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
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="sticky top-0 z-30 bg-[#F7F9F8]/90 backdrop-blur-xl border-b border-gray-100">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            {/* LEFT HEADER */}

            <div className="flex items-center gap-3 min-w-0">
              {/* MOBILE MENU BUTTON */}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="
                  lg:hidden
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  flex
                  items-center
                  justify-center
                  text-gray-700
                  hover:border-green-200
                  hover:text-green-700
                  transition
                  flex-shrink-0
                "
                aria-label="Open navigation menu"
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>Overview</span>

                  <ChevronRight size={12} />

                  <span className="text-green-600 font-medium">Dashboard</span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900 truncate">
                  Good day, {firstName}.
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                  Here's what's happening with your students today.
                </p>
              </div>
            </div>

            {/* RIGHT HEADER */}

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* AI */}

              <button
                onClick={() => runAI("risk")}
                className="
                  hidden sm:flex
                  items-center
                  gap-2
                  px-3
                  lg:px-4
                  py-2.5
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-gray-700
                  text-sm
                  font-semibold
                  hover:border-green-200
                  hover:text-green-700
                  hover:shadow-sm
                  transition
                "
              >
                <Brain size={17} />
                <span className="hidden md:inline">AI Insights</span>
              </button>

              {/* NOTIFICATIONS */}

              <button
                onClick={() => setOpenNotif((prev) => !prev)}
                className="
                  relative
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  flex
                  items-center
                  justify-center
                  hover:border-green-200
                  hover:text-green-700
                  transition
                "
                aria-label="Notifications"
              >
                <Bell size={18} />

                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#F7F9F8]">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>

              {/* PROFILE */}

              <div className="hidden md:flex lg:hidden items-center gap-2 ml-1">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center overflow-hidden">
                  {adminPhoto ? (
                    <img
                      src={adminPhoto}
                      alt={adminName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-green-700">
                      {adminName.charAt(0)}
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
              KPI
          ================================================= */}

          <section>
            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900">
                  Student Overview
                </h3>

                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Current behavioral risk distribution
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* PRINTABLE REPORT */}

                <button
                  onClick={() => setShowPrintableReport(true)}
                  className="
        self-start
        sm:self-center
        flex
        items-center
        justify-center
        gap-2
        px-4
        h-10
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
        whitespace-nowrap
      "
                >
                  <Printer size={16} />
                  Printable Report
                </button>
                <Activity size={18} className="text-gray-300 hidden md:block" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {loading ? (
                <>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Students"
                    value={kpi.total}
                    icon={<Users size={19} />}
                    type="total"
                  />

                  <StatCard
                    title="High Risk"
                    value={kpi.high}
                    icon={<AlertTriangle size={19} />}
                    type="high"
                  />

                  <StatCard
                    title="Medium Risk"
                    value={kpi.medium}
                    icon={<AlertTriangle size={19} />}
                    type="medium"
                  />

                  <StatCard
                    title="Low Risk"
                    value={kpi.low}
                    icon={<CheckCircle2 size={19} />}
                    type="low"
                  />
                </>
              )}
            </div>
          </section>

          {/* =================================================
              HANDBOOK
          ================================================= */}

          <section>
            <div className="flex items-end justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  School Resources
                </h3>

                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Quickly access school handbooks
                </p>
              </div>

              <BookOpen size={18} className="text-gray-300 flex-shrink-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <ResourceCard
                title="Pupil Handbook"
                description="Guidelines and policies for pupils."
                url="https://online.fliphtml5.com/kjzdq/zomc/"
                type="green"
              />

              <ResourceCard
                title="Student Handbook"
                description="Student policies, responsibilities and guidelines."
                url="https://online.fliphtml5.com/kjzdq/fkfo/"
                type="amber"
              />
            </div>
          </section>

          {/* =================================================
              CHARTS
          ================================================= */}

          <section>
            <div className="mb-3 sm:mb-4">
              <h3 className="text-sm font-bold text-gray-900">Analytics</h3>

              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                Monitor reports, risk levels, and incident activity
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              <ChartPanel
                title="Reports"
                subtitle="Reports submitted over time"
              >
                <div className="h-[220px] sm:h-[250px] lg:h-[270px]">
                  <Bar data={barData} options={barOptions} />
                </div>
              </ChartPanel>

              <ChartPanel
                title="Risk Distribution"
                subtitle="Current student risk levels"
              >
                <div className="h-[220px] sm:h-[250px] lg:h-[270px]">
                  <Pie data={pieData} options={pieOptions} />
                </div>
              </ChartPanel>

              <ChartPanel
                title="Incident Trends"
                subtitle="Incident activity over time"
              >
                <div className="h-[220px] sm:h-[250px] lg:h-[270px]">
                  <Line data={lineData} options={lineOptions} />
                </div>
              </ChartPanel>
            </div>
          </section>

          {/* =================================================
              INSIGHTS
          ================================================= */}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 pb-6 sm:pb-10">
            {/* STUDENTS */}

            <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.025)]">
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    Students Requiring Attention
                  </h3>

                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                    Based on incident frequency
                  </p>
                </div>

                <button
                  onClick={() => navigate("/students")}
                  className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 flex-shrink-0"
                >
                  <span className="hidden xs:inline">View all</span>
                  <span className="xs:hidden">View</span>

                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="space-y-1">
                {topRisk.length === 0 ? (
                  <div className="py-10 text-center">
                    <CheckCircle2
                      size={30}
                      className="mx-auto text-green-500 mb-2"
                    />

                    <p className="text-sm font-semibold text-gray-700">
                      No students found
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Student risk information will appear here.
                    </p>
                  </div>
                ) : (
                  topRisk.map((student, index) => (
                    <RiskStudent
                      key={student._id}
                      student={student}
                      index={index}
                      risk={getRisk(student)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* AI */}

            <div className="relative overflow-hidden bg-gradient-to-br from-[#14532D] via-[#166534] to-[#15803D] rounded-3xl p-4 sm:p-6 text-white shadow-[0_12px_40px_rgba(21,128,61,0.16)]">
              <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />

              <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-green-300/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between mb-5 sm:mb-6">
                  <div className="min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
                      <Sparkles size={19} />
                    </div>

                    <h3 className="text-lg font-bold">AI Assistant</h3>

                    <p className="text-xs sm:text-sm text-green-100 mt-1 max-w-sm">
                      Use GuidEd AI to quickly understand student behavior
                      patterns and generate actionable insights.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <AIAction
                    label="Analyze Risk"
                    description="Identify behavioral risk patterns"
                    onClick={() => runAI("risk")}
                  />

                  <AIAction
                    label="Analyze Reports"
                    description="Find patterns in submitted reports"
                    onClick={() => runAI("reports")}
                  />
                </div>
              </div>
            </div>
          </section>
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
              onClick={() => setOpenNotif(false)}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
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
              className="fixed right-0 top-0 h-full w-full sm:w-[390px] bg-white border-l border-gray-100 shadow-2xl z-50 flex flex-col"
            >
              {/* HEADER */}

              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Bell size={17} />
                    Notifications
                  </h3>

                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                    Unread system activity
                  </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] sm:text-[11px] font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 px-1"
                    >
                      <CheckCheck size={14} />
                      <span>Read all</span>
                    </button>
                  )}

                  <button
                    onClick={() => setOpenNotif(false)}
                    className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* NOTIFICATIONS */}

              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                {notificationLoading ? (
                  <div className="space-y-3">
                    <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
                    <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
                    <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-5">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <Bell size={22} className="text-gray-300" />
                    </div>

                    <p className="font-semibold text-gray-700">
                      You're all caught up
                    </p>

                    <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                      New messages and reports will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <motion.button
                        layout
                        key={notification._id || notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-left p-3 sm:p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md hover:border-green-100 transition"
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationBackground(
                              notification,
                            )}`}
                          >
                            {getNotificationIcon(notification)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm text-gray-900 break-words">
                                {notification.title}
                              </p>

                              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                            </div>

                            <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between gap-2 mt-3">
                              <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">
                                {notification.createdAt
                                  ? new Date(
                                      notification.createdAt,
                                    ).toLocaleString()
                                  : "Just now"}
                              </p>

                              <span className="text-[10px] font-semibold text-green-700 flex-shrink-0">
                                View
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
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
            className="
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
              bg-white
              border
              border-gray-100
              rounded-3xl
              shadow-[0_20px_60px_rgba(0,0,0,0.14)]
              overflow-hidden
            "
          >
            <div className="p-4 sm:p-5 bg-gradient-to-r from-green-700 to-green-600 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-sm">GuidEd AI</p>

                    <p className="text-[9px] sm:text-[10px] text-green-100 truncate">
                      Behavioral analytics assistant
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAiOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Brain size={15} className="text-green-700" />
                </div>

                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">
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
          onClose={() => setShowPrintableReport(false)}
        />
      )}
    </div>
  );
};

/* =========================================================
   NAV
========================================================= */

const Nav = ({ icon, label, onClick, active }) => (
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
          ? "bg-green-50 text-green-700 font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <span
      className={`
        transition
        ${active ? "text-green-600" : "text-gray-400 group-hover:text-gray-700"}
      `}
    >
      {icon}
    </span>

    {label}

    {active && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
    )}
  </button>
);

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ title, value, icon, type }) => {
  const styles = {
    total: {
      icon: "bg-gray-100 text-gray-700",
      number: "text-gray-900",
      line: "bg-gray-400",
    },

    high: {
      icon: "bg-red-50 text-red-600",
      number: "text-red-600",
      line: "bg-red-500",
    },

    medium: {
      icon: "bg-amber-50 text-amber-600",
      number: "text-amber-600",
      line: "bg-amber-500",
    },

    low: {
      icon: "bg-green-50 text-green-600",
      number: "text-green-600",
      line: "bg-green-500",
    },
  };

  const s = styles[type];

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-400 truncate">
            {title}
          </p>

          <p
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 sm:mt-3 ${s.number}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className={`mt-4 sm:mt-5 h-1 w-8 sm:w-10 rounded-full ${s.line}`} />
    </motion.div>
  );
};

/* =========================================================
   RESOURCE CARD
========================================================= */

const ResourceCard = ({ title, description, url, type }) => {
  const green = type === "green";

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      onClick={() => window.open(url, "_blank")}
      className="group cursor-pointer bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] hover:shadow-md transition"
    >
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${
            green ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          <BookOpen size={19} />
        </div>

        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-green-600 group-hover:bg-green-50 transition">
          <ExternalLink size={15} />
        </div>
      </div>

      <h4 className="font-bold text-gray-900 mt-4">{title}</h4>

      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-green-700">
        Open handbook
        <ArrowUpRight size={13} />
      </div>
    </motion.div>
  );
};

/* =========================================================
   CHART PANEL
========================================================= */

const ChartPanel = ({ title, subtitle, children }) => (
  <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.025)] min-w-0">
    <div className="mb-4">
      <h3 className="font-bold text-sm text-gray-900">{title}</h3>

      <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">
        {subtitle}
      </p>
    </div>

    {children}
  </div>
);

/* =========================================================
   RISK STUDENT
========================================================= */

const RiskStudent = ({ student, index, risk }) => {
  const styles = {
    High: {
      badge: "bg-red-50 text-red-600 border-red-100",
      dot: "bg-red-500",
    },

    Medium: {
      badge: "bg-amber-50 text-amber-600 border-amber-100",
      dot: "bg-amber-500",
    },

    Low: {
      badge: "bg-green-50 text-green-600 border-green-100",
      dot: "bg-green-500",
    },
  };

  const s = styles[risk];

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl hover:bg-gray-50 transition">
      <div className="w-6 sm:w-8 text-center text-[10px] sm:text-xs font-bold text-gray-300 flex-shrink-0">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-600 flex-shrink-0">
        {student.firstName?.charAt(0)}

        {student.lastName?.charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
          {student.firstName} {student.lastName}
        </p>

        <p className="text-[10px] sm:text-[11px] text-gray-400">
          {student.totalIncidents || 0} incidents
        </p>
      </div>

      <span
        className={`px-1.5 sm:px-2.5 py-1 rounded-lg border text-[9px] sm:text-[10px] font-bold flex-shrink-0 ${s.badge}`}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-1 sm:mr-1.5 ${s.dot}`}
        />

        {risk}
      </span>
    </div>
  );
};

/* =========================================================
   AI ACTION
========================================================= */

const AIAction = ({ label, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-left"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <Brain size={14} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{label}</p>

        <p className="text-[10px] text-green-100 truncate">{description}</p>
      </div>
    </div>

    <ArrowUpRight size={15} className="text-green-100 flex-shrink-0" />
  </button>
);

export default DashboardPage;
