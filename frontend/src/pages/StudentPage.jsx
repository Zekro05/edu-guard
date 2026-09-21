import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Eye,
  Pencil,
  Trash2,
  Upload,
  Plus,
  Search,
  BriefcaseBusiness,
  HandHelping,
  LogOut,
  UserRound,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  X,
  FileUp,
  Database,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  Filter,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  ChevronDown,
  BookOpen,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import { API } from "../lib/api";
import StudentModal from "../components/StudentModal";
import RiskBadge from "../components/RiskBadge";
import ViewProfileModal from "../components/ViewProfileModal";

const socket = io(
  import.meta.env.VITE_SOCKET_URL ||
    "https://edu-guard-backend.onrender.com",
);

/* =========================================================
   STUDENT PAGE
========================================================= */

const StudentPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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

  /* =========================================================
     THEME
  ========================================================= */

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("guided-theme");

      if (savedTheme === "dark") return true;
      if (savedTheme === "light") return false;

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

  /* =========================================================
     STATE
  ========================================================= */

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const [gradeFilter, setGradeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);

  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [loading, setLoading] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const fileRef = useRef(null);

  const PER_PAGE = 8;

  /* =========================================================
     THEME HELPERS
  ========================================================= */

  const pageBg = darkMode ? "bg-[#07110D]" : "bg-[#F5F8F6]";

  const textPrimary = darkMode
    ? "text-slate-100"
    : "text-slate-900";

  const textSecondary = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const textMuted = darkMode
    ? "text-slate-500"
    : "text-gray-400";

  const surface = darkMode
    ? "bg-[#0C1913] border-emerald-950/50"
    : "bg-white border-gray-100";

  const softSurface = darkMode
    ? "bg-[#101F17] border-emerald-950/40"
    : "bg-gray-50 border-gray-100";

  const inputSurface = darkMode
    ? "bg-[#0A1610] border-emerald-950/50 text-slate-100"
    : "bg-gray-50 border-gray-100 text-gray-800";

  /* =========================================================
     FETCH
  ========================================================= */

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await API.get("/api/students");

      setStudents(res.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SOCKET
  ========================================================= */

  useEffect(() => {
    fetchStudents();

    socket.on("student-created", fetchStudents);
    socket.on("student-updated", fetchStudents);
    socket.on("student-deleted", fetchStudents);

    return () => {
      socket.off("student-created", fetchStudents);
      socket.off("student-updated", fetchStudents);
      socket.off("student-deleted", fetchStudents);
    };
  }, []);

  /* =========================================================
     CLOSE MOBILE MENU ON RESIZE
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* =========================================================
     GRADE OPTIONS
  ========================================================= */

  const gradeOptions = useMemo(() => {
    const uniqueGrades = [
      ...new Set(
        students
          .map((student) => student.grade)
          .filter(
            (grade) =>
              grade !== undefined &&
              grade !== null &&
              String(grade).trim() !== "",
          )
          .map((grade) => String(grade).trim()),
      ),
    ];

    return uniqueGrades.sort((a, b) => {
      const aNumber = parseInt(a.match(/\d+/)?.[0] || "999", 10);
      const bNumber = parseInt(b.match(/\d+/)?.[0] || "999", 10);

      if (aNumber !== bNumber) {
        return aNumber - bNumber;
      }

      return a.localeCompare(b);
    });
  }, [students]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    return students.filter((student) => {
      const fullName =
        `${student.firstName || ""} ${
          student.middleName || ""
        } ${student.lastName || ""}`.toLowerCase();

      const studentId = String(
        student.studentId || "",
      ).toLowerCase();

      const grade = String(student.grade || "").toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        studentId.includes(query) ||
        grade.includes(query);

      const matchesGrade =
        gradeFilter === "all" ||
        String(student.grade || "").trim() === gradeFilter;

      const matchesSeverity =
        severityFilter === "all" ||
        String(student.riskLevel || "").toLowerCase() ===
          severityFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesGrade &&
        matchesSeverity
      );
    });
  }, [
    students,
    search,
    gradeFilter,
    severityFilter,
  ]);

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / PER_PAGE),
  );

  const paginated = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, gradeFilter, severityFilter]);

  useEffect(() => {
    if (page > pages) {
      setPage(pages);
    }
  }, [pages, page]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(
    () => ({
      total: students.length,

      high: students.filter(
        (student) => student.riskLevel === "High",
      ).length,

      med: students.filter(
        (student) => student.riskLevel === "Medium",
      ).length,

      low: students.filter(
        (student) => student.riskLevel === "Low",
      ).length,
    }),
    [students],
  );

  const hasActiveFilters =
    search.trim() ||
    gradeFilter !== "all" ||
    severityFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setGradeFilter("all");
    setSeverityFilter("all");
    setPage(1);
  };

  /* =========================================================
     IMPORT
  ========================================================= */

  const handleImport = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setImporting(true);

      const data = JSON.parse(await file.text());

      const res = await API.post(
        "/api/students/bulk/preview",
        data,
      );

      setPreview(res.data);
      setShowPreview(true);
    } catch (error) {
      console.error(error);
      toast.error("Invalid JSON or preview failed");
    } finally {
      setImporting(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const confirmImport = async () => {
    if (!preview) return;

    try {
      setImporting(true);

      const payload = [
        ...preview.toInsert.map((student) => {
          const [firstName, ...rest] =
            student.name.split(" ");

          return {
            studentId: student.studentId,
            firstName,
            lastName: rest.join(" ") || "",
            grade: student.grade,
            gender: "Male",
            email: student.email || "",
            phone: student.phone || "",
          };
        }),

        ...preview.toUpdate.map((student) => ({
          studentId: student.studentId,
          grade: student.newGrade,
          email: student.email || undefined,
          phone: student.phone || undefined,
        })),
      ];

      const res = await API.post(
        "/api/students/bulk",
        payload,
      );

      toast.success(
        `Import done: ${res.data.inserted} inserted, ${res.data.updated} updated`,
      );

      setShowPreview(false);
      setPreview(null);

      await fetchStudents();

      socket.emit("students-imported");
    } catch (error) {
      console.error(error);
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await API.delete(
        `/api/students/${deleteTarget._id}`,
      );

      toast.success("Student deleted successfully");

      setDeleteTarget(null);
      setDeleteConfirmText("");

      await fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete student");
    }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleNavigate = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`min-h-screen w-full flex ${pageBg} ${textPrimary} overflow-x-hidden transition-colors duration-300`}
    >
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className={`
          hidden lg:flex
          fixed left-0 top-0 bottom-0
          z-40
          w-[250px] xl:w-[270px]
          flex-col justify-between
          px-4 xl:px-5 py-6
          overflow-y-auto
          border-r
          transition-colors duration-300
          ${
            darkMode
              ? "bg-[#09150F] border-emerald-950/60"
              : "bg-white border-gray-100"
          }
        `}
      >
        <div>
          {/* BRAND */}

          <div className="px-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 xl:w-11 h-10 xl:h-11 flex items-center justify-center flex-shrink-0">
                <img
                  src="/school-logo.webp"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1
                  className={`text-xl font-extrabold tracking-tight ${textPrimary}`}
                >
                  Guid
                  <span className="text-green-500">Ed</span>
                </h1>

                <p
                  className={`text-[9px] uppercase tracking-widest font-semibold truncate ${textMuted}`}
                >
                  Student Guidance
                </p>
              </div>
            </div>

            <p
              className={`text-[11px] leading-relaxed mt-4 ${textMuted}`}
            >
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>
          </div>

          {/* NAVIGATION */}

          <p
            className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
          >
            Main Menu
          </p>

          <div className="space-y-1">
            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() =>
                handleNavigate("/dashboard")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              active
              darkMode={darkMode}
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              onClick={() =>
                handleNavigate("/guidance")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<ChartNoAxesCombined size={18} />}
              label="Reports"
              onClick={() =>
                handleNavigate("/reports")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<BriefcaseBusiness size={18} />}
              label="Cases"
              onClick={() =>
                handleNavigate("/cases")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              onClick={() =>
                handleNavigate("/interventions")
              }
              darkMode={darkMode}
            />
          </div>

          <p
            className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
          >
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() =>
              handleNavigate("/settings")
            }
            darkMode={darkMode}
          />
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="space-y-3 mt-8">
          <div
            className={`p-3 rounded-2xl border ${
              darkMode
                ? "bg-[#101F17] border-emerald-950/50"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  relative w-10 h-10 rounded-xl
                  overflow-hidden
                  flex items-center justify-center
                  flex-shrink-0
                  ${
                    darkMode
                      ? "bg-emerald-950 text-emerald-300"
                      : "bg-green-100 text-green-700"
                  }
                `}
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
                  <span className="font-bold">
                    {adminName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <span
                  className={`
                    absolute bottom-0.5 right-0.5
                    w-2.5 h-2.5 rounded-full
                    bg-green-500 border-2
                    ${
                      darkMode
                        ? "border-[#101F17]"
                        : "border-white"
                    }
                  `}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}
                >
                  Administrator
                </p>

                <p
                  className={`text-sm font-bold truncate ${textPrimary}`}
                >
                  {adminName}
                </p>
              </div>
            </div>
          </div>

          {/* THEME */}

          <ThemeToggle
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

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
                  ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300 hover:border-red-900/40"
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
          MOBILE OVERLAY
      ===================================================== */}

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={`
                fixed
                left-0
                top-0
                bottom-0
                z-50
                w-[min(82vw,300px)]
                flex
                flex-col
                justify-between
                px-5
                py-6
                overflow-y-auto
                border-r
                lg:hidden
                ${
                  darkMode
                    ? "bg-[#09150F] border-emerald-950/60"
                    : "bg-white border-gray-100"
                }
              `}
            >
              <div>
                {/* MOBILE BRAND */}

                <div className="px-3 mb-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                        <img
                          src="/school-logo.webp"
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <h1
                          className={`text-xl font-extrabold tracking-tight ${textPrimary}`}
                        >
                          Guid
                          <span className="text-green-500">
                            Ed
                          </span>
                        </h1>

                        <p
                          className={`text-[9px] uppercase tracking-widest font-semibold ${textMuted}`}
                        >
                          Student Guidance
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setMobileMenuOpen(false)
                      }
                      className={`
                        w-9 h-9 rounded-xl
                        flex items-center justify-center
                        flex-shrink-0
                        ${
                          darkMode
                            ? "bg-[#101F17] text-slate-400"
                            : "bg-gray-50 text-gray-500"
                        }
                      `}
                      aria-label="Close menu"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed mt-4 ${textMuted}`}
                  >
                    Our Lady of the Holy Rosary School
                    <br />
                    General Trias Campus
                  </p>
                </div>

                <p
                  className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                >
                  Main Menu
                </p>

                <div className="space-y-1">
                  <Nav
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    onClick={() =>
                      handleNavigate("/dashboard")
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={<Users size={18} />}
                    label="Students"
                    active
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={<ShieldX size={18} />}
                    label="Guidance"
                    onClick={() =>
                      handleNavigate("/guidance")
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <ChartNoAxesCombined size={18} />
                    }
                    label="Reports"
                    onClick={() =>
                      handleNavigate("/reports")
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <BriefcaseBusiness size={18} />
                    }
                    label="Cases"
                    onClick={() =>
                      handleNavigate("/cases")
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={<HandHelping size={18} />}
                    label="Interventions"
                    onClick={() =>
                      handleNavigate("/interventions")
                    }
                    darkMode={darkMode}
                  />
                </div>

                <p
                  className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                >
                  System
                </p>

                <Nav
                  icon={<Settings size={18} />}
                  label="Settings"
                  onClick={() =>
                    handleNavigate("/settings")
                  }
                  darkMode={darkMode}
                />
              </div>

              <div className="space-y-3 mt-8">
                <div
                  className={`p-3 rounded-2xl border ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-950/50"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        relative w-10 h-10 rounded-xl
                        overflow-hidden
                        flex items-center justify-center
                        flex-shrink-0
                        ${
                          darkMode
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-green-100 text-green-700"
                        }
                      `}
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
                        <span className="font-bold">
                          {adminName
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}

                      <span
                        className={`
                          absolute bottom-0.5 right-0.5
                          w-2.5 h-2.5 rounded-full
                          bg-green-500 border-2
                          ${
                            darkMode
                              ? "border-[#101F17]"
                              : "border-white"
                          }
                        `}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}
                      >
                        Administrator
                      </p>

                      <p
                        className={`text-sm font-bold truncate ${textPrimary}`}
                      >
                        {adminName}
                      </p>
                    </div>
                  </div>
                </div>

                <ThemeToggle
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />

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
                        ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300"
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

      <main className="flex-1 min-w-0 lg:ml-[250px] xl:ml-[270px] overflow-y-auto min-h-screen">
        {/* HEADER */}

        <header
          className={`
            sticky top-0 z-30
            backdrop-blur-xl
            border-b
            transition-colors duration-300
            ${
              darkMode
                ? "bg-[#07110D]/90 border-emerald-950/50"
                : "bg-[#F5F8F6]/90 border-gray-100"
            }
          `}
        >
          <div className="px-4 sm:px-6 md:px-8 xl:px-10 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              {/* MOBILE MENU */}

              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className={`
                  lg:hidden
                  w-10
                  h-10
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                  ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-950/50 text-slate-300"
                      : "bg-white border-gray-200 text-gray-600"
                  }
                `}
                aria-label="Open menu"
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="hidden sm:flex items-center gap-2 text-xs mb-1">
                  <span className={textMuted}>
                    Management
                  </span>

                  <ChevronRight
                    size={12}
                    className={textMuted}
                  />

                  <span className="text-green-500 font-semibold">
                    Students
                  </span>
                </div>

                <h2
                  className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight ${textPrimary}`}
                >
                  Student Directory
                </h2>

                <p
                  className={`text-xs sm:text-sm mt-1 truncate sm:whitespace-normal ${textSecondary}`}
                >
                  Manage student records, grade levels,
                  and behavioral risk.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() =>
                    setDarkMode((value) => !value)
                  }
                  className={`
                    w-10 h-10 rounded-xl border
                    flex items-center justify-center
                    transition
                    ${
                      darkMode
                        ? "bg-[#101F17] border-emerald-950/50 text-amber-300 hover:bg-[#14261C]"
                        : "bg-white border-gray-100 text-slate-500 hover:bg-green-50 hover:text-green-600"
                    }
                  `}
                  title={
                    darkMode
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                >
                  {darkMode ? (
                    <Sun size={17} />
                  ) : (
                    <Moon size={17} />
                  )}
                </button>

                <div
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl border
                    ${
                      darkMode
                        ? "bg-[#101F17] border-emerald-950/50"
                        : "bg-white border-gray-100"
                    }
                  `}
                >
                  <Database
                    size={15}
                    className="text-green-500"
                  />

                  <span
                    className={`text-xs font-semibold ${textSecondary}`}
                  >
                    {students.length} records
                  </span>
                </div>
              </div>
            </div>

            {/* MOBILE RECORD COUNT */}

            <div className="sm:hidden mt-3 flex items-center gap-2">
              <div
                className={`
                  inline-flex items-center gap-2 px-3 py-2 rounded-xl border
                  ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-950/50"
                      : "bg-white border-gray-100"
                  }
                `}
              >
                <Database
                  size={14}
                  className="text-green-500"
                />

                <span
                  className={`text-[11px] font-semibold ${textSecondary}`}
                >
                  {students.length} records
                </span>
              </div>

              <button
                onClick={() =>
                  setDarkMode((value) => !value)
                }
                className={`
                  w-9 h-9 rounded-xl border
                  flex items-center justify-center
                  ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-950/50 text-amber-300"
                      : "bg-white border-gray-100 text-slate-500"
                  }
                `}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <Sun size={15} />
                ) : (
                  <Moon size={15} />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div className="px-4 sm:px-6 md:px-8 xl:px-10 py-5 sm:py-8 space-y-6 sm:space-y-8">
          {/* ===================================================
              HERO
          =================================================== */}

          <section>
            <div
              className={`
                relative
                overflow-hidden
                rounded-3xl
                border
                p-5 sm:p-7
                ${
                  darkMode
                    ? "bg-gradient-to-br from-[#0C2418] via-[#0D321F] to-[#091B12] border-emerald-900/40"
                    : "bg-gradient-to-br from-white via-[#EFF9F3] to-[#E5F5EB] border-green-100"
                }
              `}
            >
              {/* DECORATION */}

              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />

              <div className="absolute -left-16 -bottom-24 w-52 h-52 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div
                    className={`
                      inline-flex
                      items-center
                      gap-2
                      px-3
                      py-1.5
                      rounded-full
                      border
                      text-[10px]
                      sm:text-[11px]
                      font-bold
                      uppercase
                      tracking-wider
                      ${
                        darkMode
                          ? "bg-emerald-950/50 border-emerald-800/50 text-emerald-300"
                          : "bg-white/80 border-green-100 text-green-700"
                      }
                    `}
                  >
                    <Sparkles size={12} />
                    GuidEd • Student Management
                  </div>

                  <h1
                    className={`
                      text-2xl sm:text-3xl md:text-4xl
                      font-extrabold
                      tracking-tight
                      mt-4
                      ${
                        darkMode
                          ? "text-white"
                          : "text-slate-900"
                      }
                    `}
                  >
                    Your student population,
                    <span className="text-green-500">
                      {" "}
                      at a glance.
                    </span>
                  </h1>

                  <p
                    className={`
                      text-sm
                      sm:text-base
                      leading-relaxed
                      mt-3
                      max-w-xl
                      ${
                        darkMode
                          ? "text-slate-300"
                          : "text-slate-500"
                      }
                    `}
                  >
                    Quickly find students, review their
                    grade levels, and identify behavioral
                    risk indicators from one organized
                    workspace.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <div
                      className={`
                        inline-flex items-center gap-2
                        px-3 py-2 rounded-xl text-xs font-semibold
                        ${
                          darkMode
                            ? "bg-white/5 text-slate-300 border border-white/10"
                            : "bg-white/80 text-slate-600 border border-white"
                        }
                      `}
                    >
                      <Users
                        size={14}
                        className="text-green-500"
                      />
                      {stats.total} students
                    </div>

                    <div
                      className={`
                        inline-flex items-center gap-2
                        px-3 py-2 rounded-xl text-xs font-semibold
                        ${
                          darkMode
                            ? "bg-red-950/30 text-red-300 border border-red-900/30"
                            : "bg-red-50 text-red-600 border border-red-100"
                        }
                      `}
                    >
                      <AlertTriangle size={14} />
                      {stats.high} high risk
                    </div>

                    <div
                      className={`
                        inline-flex items-center gap-2
                        px-3 py-2 rounded-xl text-xs font-semibold
                        ${
                          darkMode
                            ? "bg-emerald-950/30 text-emerald-300 border border-emerald-900/30"
                            : "bg-green-50 text-green-700 border border-green-100"
                        }
                      `}
                    >
                      <ShieldCheck size={14} />
                      {stats.low} low risk
                    </div>
                  </div>
                </div>

                {/* HERO ACTION */}

                <div
                  className={`
                    shrink-0
                    w-full xl:w-[260px]
                    rounded-2xl
                    p-4
                    border
                    ${
                      darkMode
                        ? "bg-black/10 border-white/10"
                        : "bg-white/70 border-white"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                      <UserPlus size={20} />
                    </div>

                    <div>
                      <p
                        className={`text-xs font-semibold ${textMuted}`}
                      >
                        Directory
                      </p>

                      <p
                        className={`text-lg font-extrabold ${textPrimary}`}
                      >
                        {filtered.length}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-xs leading-relaxed mt-3 ${textSecondary}`}
                  >
                    Currently matching your selected
                    search and filters.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================
              STUDENT COMMAND CENTER
          =================================================== */}

          <section>
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      darkMode
                        ? "bg-emerald-950/60 text-emerald-300"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <ChartNoAxesCombined size={17} />
                  </div>
                  <div>
                    <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${textPrimary}`}>
                      Student Command Center
                    </h3>
                    <p className={`text-[11px] sm:text-xs mt-0.5 ${textMuted}`}>
                      A quick operational view of your student population.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchStudents}
                  className={`h-10 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition hover:-translate-y-0.5 ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:text-emerald-300"
                      : "bg-white border-gray-200 text-gray-600 hover:border-green-200 hover:text-green-700"
                  }`}
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setIsEditing(false);
                    setSelectedStudent(null);
                  }}
                  className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white flex items-center gap-2 text-xs font-bold shadow-lg shadow-green-600/20 transition hover:-translate-y-0.5"
                >
                  <UserPlus size={15} />
                  New Student
                </button>
              </div>
            </div>

            {/* BENTO STATS */}
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              <div
                className={`col-span-12 lg:col-span-5 relative overflow-hidden rounded-3xl border p-5 ${
                  darkMode
                    ? "bg-gradient-to-br from-[#102C1D] via-[#0D2117] to-[#09150F] border-emerald-900/50"
                    : "bg-gradient-to-br from-white via-[#F0FBF4] to-[#E6F7EC] border-green-100"
                }`}
              >
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-green-400/10 blur-2xl" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.18em] font-bold ${textMuted}`}>
                      Population
                    </p>
                    <div className="flex items-end gap-2 mt-2">
                      <span className={`text-4xl sm:text-5xl font-black tracking-tight ${textPrimary}`}>
                        {stats.total}
                      </span>
                      <span className={`text-xs font-semibold pb-1.5 ${textSecondary}`}>
                        active records
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-xl shadow-green-500/20">
                    <Users size={21} />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-[10px] font-bold mb-2">
                    <span className={textMuted}>Risk coverage</span>
                    <span className="text-green-500">
                      {stats.total ? Math.round(((stats.low + stats.med + stats.high) / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-black/30" : "bg-white/80"}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.total ? Math.min(100, ((stats.low + stats.med + stats.high) / stats.total) * 100) : 0}%` }}
                      className="h-full rounded-full bg-green-500"
                    />
                  </div>
                </div>
              </div>

              {[
                {
                  label: "High Risk",
                  value: stats.high,
                  type: "high",
                  icon: <AlertTriangle size={18} />,
                  note: stats.total ? `${Math.round((stats.high / stats.total) * 100)}% of population` : "No records",
                },
                {
                  label: "Medium Risk",
                  value: stats.med,
                  type: "medium",
                  icon: <AlertTriangle size={18} />,
                  note: stats.total ? `${Math.round((stats.med / stats.total) * 100)}% of population` : "No records",
                },
                {
                  label: "Low Risk",
                  value: stats.low,
                  type: "low",
                  icon: <ShieldCheck size={18} />,
                  note: stats.total ? `${Math.round((stats.low / stats.total) * 100)}% of population` : "No records",
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -3 }}
                  className={`col-span-12 sm:col-span-4 rounded-3xl border p-4 ${
                    darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.type === "high"
                          ? darkMode ? "bg-red-950/40 text-red-300" : "bg-red-50 text-red-500"
                          : item.type === "medium"
                          ? darkMode ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-500"
                          : darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className={`text-2xl font-black ${textPrimary}`}>{item.value}</span>
                  </div>
                  <p className={`text-xs font-bold mt-4 ${textPrimary}`}>{item.label}</p>
                  <p className={`text-[10px] mt-1 ${textMuted}`}>{item.note}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===================================================
              QUICK ACTIONS + GRADE MIX
          =================================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div
              className={`xl:col-span-3 rounded-3xl border p-5 ${
                darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-extrabold ${textPrimary}`}>Quick actions</h3>
                  <p className={`text-[11px] mt-1 ${textMuted}`}>Jump straight into your most common tasks.</p>
                </div>
                <Sparkles size={17} className="text-green-500" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: "Add student", icon: <Plus size={17} />, action: () => { setShowModal(true); setIsEditing(false); setSelectedStudent(null); } },
                  { label: "Import JSON", icon: <Upload size={17} />, action: () => fileRef.current?.click() },
                  { label: "High-risk", icon: <AlertTriangle size={17} />, action: () => setSeverityFilter("High") },
                  { label: "Clear view", icon: <RefreshCw size={17} />, action: clearFilters },
                ].map((action) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={action.action}
                    className={`group rounded-2xl border p-3 text-left transition ${
                      darkMode
                        ? "bg-[#101F17] border-emerald-950/50 hover:border-emerald-800/70"
                        : "bg-gray-50/80 border-gray-100 hover:bg-green-50/60 hover:border-green-100"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition">
                      {action.icon}
                    </div>
                    <p className={`text-[11px] font-bold mt-3 ${textPrimary}`}>{action.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div
              className={`xl:col-span-2 rounded-3xl border p-5 ${
                darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-extrabold ${textPrimary}`}>Risk balance</h3>
                  <p className={`text-[11px] mt-1 ${textMuted}`}>Current distribution across records.</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                  <ShieldCheck size={17} />
                </div>
              </div>

              <div className="space-y-3 mt-5">
                {[
                  { label: "Low", value: stats.low, className: "bg-green-500", track: darkMode ? "bg-green-950/40" : "bg-green-50", text: "text-green-500" },
                  { label: "Medium", value: stats.med, className: "bg-amber-400", track: darkMode ? "bg-amber-950/40" : "bg-amber-50", text: "text-amber-500" },
                  { label: "High", value: stats.high, className: "bg-red-500", track: darkMode ? "bg-red-950/40" : "bg-red-50", text: "text-red-500" },
                ].map((risk) => (
                  <div key={risk.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-[11px] font-bold ${textSecondary}`}>{risk.label} risk</span>
                      <span className={`text-[11px] font-black ${risk.text}`}>{risk.value}</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${risk.track}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.total ? (risk.value / stats.total) * 100 : 0}%` }}
                        className={`h-full rounded-full ${risk.className}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===================================================
              DIRECTORY WORKSPACE
          =================================================== */}

          <section>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? "bg-emerald-950/60 text-emerald-300" : "bg-green-50 text-green-600"}`}>
                    <BookOpen size={17} />
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold ${textPrimary}`}>Student workspace</h3>
                    <p className={`text-[11px] mt-0.5 ${textMuted}`}>
                      {filtered.length} visible · {students.length} total records
                    </p>
                  </div>
                </div>
              </div>

              <div className={`flex items-center p-1 rounded-xl border w-fit ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-gray-50 border-gray-100"}`}>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold transition ${viewMode === "table" ? "bg-green-600 text-white shadow-sm" : textSecondary}`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold transition ${viewMode === "cards" ? "bg-green-600 text-white shadow-sm" : textSecondary}`}
                >
                  Cards
                </button>
              </div>
            </div>

            <div
              className={`rounded-3xl border p-3 sm:p-4 ${
                darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"
              }`}
            >
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

              <div className="flex flex-col xl:flex-row gap-3">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border flex-1 focus-within:ring-4 ${
                  darkMode
                    ? "bg-[#08130D] border-emerald-950/50 focus-within:border-emerald-700 focus-within:ring-emerald-950/30"
                    : "bg-gray-50 border-gray-100 focus-within:bg-white focus-within:border-green-200 focus-within:ring-green-50"
                }`}>
                  <Search size={17} className={darkMode ? "text-slate-500" : "text-gray-400"} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full outline-none bg-transparent text-sm ${darkMode ? "text-slate-100" : "text-gray-800"}`}
                    placeholder="Search name, student ID, or grade..."
                  />
                  {search && <button onClick={() => setSearch("")}><X size={16} className={textMuted} /></button>}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative min-w-[170px]">
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className={`appearance-none w-full pl-4 pr-9 py-3 rounded-2xl border outline-none text-xs font-bold ${
                        darkMode ? "bg-[#08130D] border-emerald-950/50 text-slate-200" : "bg-gray-50 border-gray-100 text-gray-700"
                      }`}
                    >
                      <option value="all">All Grade Levels</option>
                      {gradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
                  </div>

                  <div className="relative min-w-[170px]">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className={`appearance-none w-full pl-4 pr-9 py-3 rounded-2xl border outline-none text-xs font-bold ${
                        darkMode ? "bg-[#08130D] border-emerald-950/50 text-slate-200" : "bg-gray-50 border-gray-100 text-gray-700"
                      }`}
                    >
                      <option value="all">All Risk Levels</option>
                      <option value="High">High Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="Low">Low Risk</option>
                    </select>
                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className={`px-4 py-3 rounded-2xl border text-xs font-bold ${
                        darkMode ? "bg-red-950/20 border-red-900/30 text-red-300" : "bg-red-50 border-red-100 text-red-600"
                      }`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {search && <FilterChip label={`Search: ${search}`} onRemove={() => setSearch("")} darkMode={darkMode} />}
                  {gradeFilter !== "all" && <FilterChip label={gradeFilter} onRemove={() => setGradeFilter("all")} darkMode={darkMode} />}
                  {severityFilter !== "all" && <FilterChip label={`${severityFilter} Risk`} onRemove={() => setSeverityFilter("all")} darkMode={darkMode} />}
                </div>
              )}
            </div>

            {viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
                {loading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className={`h-48 rounded-3xl border animate-pulse ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}`} />
                    ))
                  : paginated.length === 0
                  ? (
                    <div className={`md:col-span-2 xl:col-span-3 rounded-3xl border p-10 text-center ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}`}>
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center">
                        <Search size={20} />
                      </div>
                      <p className={`font-bold mt-3 ${textPrimary}`}>No students found</p>
                      <p className={`text-xs mt-1 ${textMuted}`}>Try adjusting your search or filters.</p>
                    </div>
                  )
                  : paginated.map((student, index) => {
                      const risk = String(student.riskLevel || "Low").toLowerCase();
                      const riskTone =
                        risk === "high"
                          ? darkMode ? "border-red-900/40 bg-red-950/10" : "border-red-100 bg-red-50/40"
                          : risk === "medium"
                          ? darkMode ? "border-amber-900/40 bg-amber-950/10" : "border-amber-100 bg-amber-50/40"
                          : darkMode ? "border-emerald-900/40 bg-emerald-950/10" : "border-emerald-100 bg-emerald-50/40";

                      return (
                        <motion.div
                          key={student._id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          whileHover={{ y: -4 }}
                          className={`rounded-3xl border p-4 ${surface} ${riskTone} transition`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 border ${darkMode ? "bg-emerald-950/50 border-emerald-900/50" : "bg-white border-green-100"}`}>
                                {student.profilePhoto ? (
                                  <img src={student.profilePhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserRound size={19} className="text-green-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className={`font-extrabold truncate ${textPrimary}`}>{student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}</p>
                                <p className={`text-[10px] mt-1 ${textMuted}`}>{student.studentId || "No ID"}</p>
                              </div>
                            </div>
                            <RiskBadge level={student.riskLevel} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className={`rounded-2xl p-3 ${darkMode ? "bg-black/10" : "bg-white/70"}`}>
                              <p className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}>Grade</p>
                              <p className={`text-sm font-extrabold mt-1 ${textPrimary}`}>{student.grade || "—"}</p>
                            </div>
                            <div className={`rounded-2xl p-3 ${darkMode ? "bg-black/10" : "bg-white/70"}`}>
                              <p className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}>Status</p>
                              <p className="text-sm font-extrabold mt-1 text-green-500">Active</p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 mt-3">
                            <Action label="View profile" icon={<Eye size={14} />} darkMode={darkMode} onClick={() => { setSelectedStudent(student); setShowProfile(true); }} />
                            <Action label="Edit student" icon={<Pencil size={14} />} darkMode={darkMode} onClick={() => { setSelectedStudent(student); setIsEditing(true); setShowModal(true); }} />
                            <Action label="Delete student" danger icon={<Trash2 size={14} />} darkMode={darkMode} onClick={() => setDeleteTarget(student)} />
                          </div>
                        </motion.div>
                      );
                    })}
              </div>
            ) : (
              <div className={`mt-4 rounded-3xl border overflow-hidden ${surface}`}>
                <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 ${darkMode ? "border-emerald-950/40" : "border-gray-100"}`}>
                  <div>
                    <p className={`text-xs font-bold ${textPrimary}`}>All students</p>
                    <p className={`text-[10px] mt-0.5 ${textMuted}`}>Use profile, edit, or delete actions on each record.</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${darkMode ? "bg-emerald-950/40 text-emerald-300" : "bg-green-50 text-green-700"}`}>
                    {filtered.length} matches
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className={darkMode ? "bg-[#101F17]" : "bg-gray-50/80"}>
                        {["Student", "Student ID", "Grade", "Risk Level", "Actions"].map((head, i) => (
                          <th key={head} className={`px-4 sm:px-6 py-4 ${i === 4 ? "text-right" : i === 2 || i === 3 ? "text-center" : "text-left"} text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} darkMode={darkMode} />)
                      ) : paginated.length === 0 ? (
                        <EmptyState search={search} hasActiveFilters={hasActiveFilters} darkMode={darkMode} clearFilters={clearFilters} />
                      ) : (
                        paginated.map((student, index) => (
                          <motion.tr
                            key={student._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.025 }}
                            className={`border-b last:border-b-0 ${darkMode ? "border-emerald-950/30 hover:bg-emerald-950/20" : "border-gray-50 hover:bg-green-50/40"}`}
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border ${darkMode ? "bg-emerald-950/50 border-emerald-900/50" : "bg-green-50 border-green-100"}`}>
                                  {student.profilePhoto ? <img src={student.profilePhoto} alt="" className="w-full h-full object-cover" /> : <UserRound size={17} className="text-green-600" />}
                                </div>
                                <div className="min-w-0 max-w-[240px]">
                                  <p className={`font-bold truncate ${textPrimary}`}>{student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}</p>
                                  <p className={`text-[11px] mt-0.5 ${textMuted}`}>Student profile</p>
                                </div>
                              </div>
                            </td>
                            <td className={`px-4 sm:px-6 py-4 font-mono text-xs ${textSecondary}`}>{student.studentId || "—"}</td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${darkMode ? "bg-[#101F17] border-emerald-950/50 text-slate-300" : "bg-gray-50 border-gray-100 text-gray-600"}`}>
                                <GraduationCap size={12} className="text-green-500" />
                                {student.grade || "—"}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center"><RiskBadge level={student.riskLevel} /></td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex justify-end gap-1.5">
                                <Action label="View profile" icon={<Eye size={15} />} darkMode={darkMode} onClick={() => { setSelectedStudent(student); setShowProfile(true); }} />
                                <Action label="Edit student" icon={<Pencil size={15} />} darkMode={darkMode} onClick={() => { setSelectedStudent(student); setIsEditing(true); setShowModal(true); }} />
                                <Action label="Delete student" danger icon={<Trash2 size={15} />} darkMode={darkMode} onClick={() => setDeleteTarget(student)} />
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!loading && (
                  <div className={`px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${darkMode ? "border-emerald-950/40 bg-[#0A1610]" : "border-gray-100 bg-gray-50/40"}`}>
                    <p className={`text-xs ${textMuted}`}>
                      {filtered.length === 0 ? "No students found" : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} students`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))} className={`w-9 h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 ${darkMode ? "bg-[#101F17] border-emerald-950/50 text-slate-400" : "bg-white border-gray-200 text-gray-500"}`}>
                        <ChevronLeft size={16} />
                      </button>
                      <div className="min-w-9 h-9 px-3 rounded-xl bg-green-600 text-white flex items-center justify-center text-xs font-bold">{page}</div>
                      <button disabled={page >= pages} onClick={() => setPage((current) => Math.min(current + 1, pages))} className={`w-9 h-9 rounded-xl border flex items-center justify-center disabled:opacity-30 ${darkMode ? "bg-[#101F17] border-emerald-950/50 text-slate-400" : "bg-white border-gray-200 text-gray-500"}`}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ===================================================
              RECENT STUDENTS + GUIDANCE SIGNALS
          =================================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className={`xl:col-span-2 rounded-3xl border p-5 ${darkMode ? "bg-[#0C1913] border-emerald-950/50" : "bg-white border-gray-100"}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-extrabold ${textPrimary}`}>Recent student records</h3>
                  <p className={`text-[11px] mt-1 ${textMuted}`}>A compact look at the latest records in your workspace.</p>
                </div>
                <Database size={17} className="text-green-500" />
              </div>

              <div className="space-y-2">
                {students.slice(-4).reverse().map((student, index) => (
                  <motion.button
                    key={student._id || index}
                    whileHover={{ x: 3 }}
                    onClick={() => { setSelectedStudent(student); setShowProfile(true); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left border transition ${
                      darkMode ? "bg-[#101F17] border-emerald-950/40 hover:border-emerald-800/60" : "bg-gray-50/70 border-gray-100 hover:bg-green-50/50 hover:border-green-100"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden ${darkMode ? "bg-emerald-950/50" : "bg-green-100"}`}>
                      {student.profilePhoto ? <img src={student.profilePhoto} alt="" className="w-full h-full object-cover" /> : <UserRound size={15} className="text-green-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${textPrimary}`}>{student.firstName} {student.lastName}</p>
                      <p className={`text-[10px] mt-0.5 ${textMuted}`}>{student.studentId || "No student ID"} · Grade {student.grade || "—"}</p>
                    </div>
                    <RiskBadge level={student.riskLevel} />
                  </motion.button>
                ))}
                {students.length === 0 && !loading && (
                  <p className={`text-xs py-5 text-center ${textMuted}`}>No student records yet.</p>
                )}
              </div>
            </div>

            <div className={`rounded-3xl border p-5 relative overflow-hidden ${darkMode ? "bg-gradient-to-br from-[#102C1D] to-[#09150F] border-emerald-900/50" : "bg-gradient-to-br from-[#F0FBF4] to-white border-green-100"}`}>
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-green-400/10 blur-2xl" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Sparkles size={18} />
                </div>
                <h3 className={`text-sm font-extrabold mt-4 ${textPrimary}`}>Guidance signal</h3>
                <p className={`text-xs leading-relaxed mt-2 ${textSecondary}`}>
                  {stats.high > 0
                    ? `${stats.high} student${stats.high === 1 ? "" : "s"} currently carry a high-risk indicator. Review their profiles and coordinate the next guidance action.`
                    : "No high-risk indicators are currently visible. Keep monitoring the student population for changes."}
                </p>

                <button
                  onClick={() => setSeverityFilter("High")}
                  className="mt-5 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition"
                >
                  Review high-risk students
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* =====================================================
          STUDENT MODAL
      ===================================================== */}

      <AnimatePresence>
        {showModal && (
          <StudentModal
            close={() => setShowModal(false)}
            refresh={fetchStudents}
            student={selectedStudent}
            isEditing={isEditing}
            students={students}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

      {/* =====================================================
          PROFILE MODAL
      ===================================================== */}

      <AnimatePresence>
        {showProfile && (
          <ViewProfileModal
            student={selectedStudent}
            close={() => setShowProfile(false)}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

      {/* =====================================================
          IMPORT PREVIEW
      ===================================================== */}

      <AnimatePresence>
        {showPreview && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed
              inset-0
              bg-black/50
              backdrop-blur-sm
              flex
              items-center
              justify-center
              z-50
              p-3
              sm:p-4
              overflow-y-auto
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              className={`
                rounded-2xl
                sm:rounded-3xl
                w-full
                max-w-[760px]
                max-h-[92vh]
                sm:max-h-[85vh]
                overflow-hidden
                shadow-2xl
                border
                ${
                  darkMode
                    ? "bg-[#0C1913] border-emerald-950/50"
                    : "bg-white border-gray-100"
                }
              `}
            >
              {/* HEADER */}

              <div
                className={`
                  px-4
                  sm:px-6
                  py-4
                  sm:py-5
                  border-b
                  flex
                  items-center
                  justify-between
                  gap-3
                  ${
                    darkMode
                      ? "border-emerald-950/40"
                      : "border-gray-100"
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`
                      w-10
                      h-10
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                      ${
                        darkMode
                          ? "bg-emerald-950/60 text-emerald-300"
                          : "bg-green-50 text-green-600"
                      }
                    `}
                  >
                    <FileUp size={18} />
                  </div>

                  <div className="min-w-0">
                    <h2
                      className={`font-bold ${textPrimary}`}
                    >
                      Import Preview
                    </h2>

                    <p
                      className={`text-xs mt-0.5 truncate ${textMuted}`}
                    >
                      Review changes before importing
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreview(null);
                  }}
                  className={`
                    w-9
                    h-9
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                    ${
                      darkMode
                        ? "bg-[#101F17] text-slate-400 hover:bg-[#14261C]"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }
                  `}
                  aria-label="Close preview"
                >
                  <X size={17} />
                </button>
              </div>

              {/* BODY */}

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh]">
                <ImportSection
                  title="New Students"
                  count={preview.toInsert.length}
                  color="green"
                  icon={<Plus size={15} />}
                  darkMode={darkMode}
                >
                  {preview.toInsert.length === 0 ? (
                    <EmptyImport
                      text="No new students."
                      darkMode={darkMode}
                    />
                  ) : (
                    preview.toInsert.map(
                      (student, index) => (
                        <ImportRow
                          key={index}
                          color="green"
                          title={student.name}
                          subtitle={`${student.studentId} • ${student.grade}`}
                          darkMode={darkMode}
                        />
                      ),
                    )
                  )}
                </ImportSection>

                <ImportSection
                  title="Updates"
                  count={preview.toUpdate.length}
                  color="amber"
                  icon={<Database size={15} />}
                  darkMode={darkMode}
                >
                  {preview.toUpdate.length === 0 ? (
                    <EmptyImport
                      text="No student updates."
                      darkMode={darkMode}
                    />
                  ) : (
                    preview.toUpdate.map(
                      (student, index) => (
                        <ImportRow
                          key={index}
                          color="amber"
                          title={student.name}
                          subtitle={`${student.oldGrade} → ${student.newGrade}`}
                          darkMode={darkMode}
                        />
                      ),
                    )
                  )}
                </ImportSection>

                {preview.invalid.length > 0 && (
                  <ImportSection
                    title="Invalid Records"
                    count={preview.invalid.length}
                    color="red"
                    icon={
                      <AlertTriangle size={15} />
                    }
                    darkMode={darkMode}
                  >
                    {preview.invalid.map(
                      (student, index) => (
                        <ImportRow
                          key={index}
                          color="red"
                          title={
                            student.name ||
                            "Unknown student"
                          }
                          subtitle="Missing student ID"
                          darkMode={darkMode}
                        />
                      ),
                    )}
                  </ImportSection>
                )}
              </div>

              {/* FOOTER */}

              <div
                className={`
                  px-4
                  sm:px-6
                  py-4
                  border-t
                  flex
                  flex-col-reverse
                  sm:flex-row
                  justify-end
                  gap-2
                  ${
                    darkMode
                      ? "border-emerald-950/40 bg-[#0A1610]"
                      : "border-gray-100 bg-gray-50/50"
                  }
                `}
              >
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreview(null);
                  }}
                  className={`
                    px-4
                    py-2.5
                    rounded-xl
                    border
                    text-sm
                    font-semibold
                    w-full
                    sm:w-auto
                    ${
                      darkMode
                        ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  Cancel
                </button>

                <button
                  onClick={confirmImport}
                  disabled={importing}
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    bg-green-600
                    hover:bg-green-500
                    text-white
                    text-sm
                    font-semibold
                    disabled:opacity-50
                    w-full
                    sm:w-auto
                  "
                >
                  {importing
                    ? "Importing..."
                    : "Confirm Import"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed
              inset-0
              bg-black/50
              backdrop-blur-sm
              flex
              items-center
              justify-center
              z-50
              p-3
              sm:p-4
              overflow-y-auto
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className={`
                rounded-2xl
                sm:rounded-3xl
                p-5
                sm:p-6
                w-full
                max-w-[400px]
                shadow-2xl
                border
                my-auto
                ${
                  darkMode
                    ? "bg-[#0C1913] border-emerald-950/50"
                    : "bg-white border-gray-100"
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    w-11
                    h-11
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                    ${
                      darkMode
                        ? "bg-red-950/40 text-red-300"
                        : "bg-red-50 text-red-500"
                    }
                  `}
                >
                  <Trash2 size={19} />
                </div>

                <div className="min-w-0">
                  <h2
                    className={`text-lg font-bold ${textPrimary}`}
                  >
                    Delete Student
                  </h2>

                  <p
                    className={`text-xs mt-1 ${textMuted}`}
                  >
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div
                className={`
                  mt-5
                  p-4
                  rounded-2xl
                  border
                  ${
                    darkMode
                      ? "bg-red-950/20 border-red-900/30"
                      : "bg-red-50 border-red-100"
                  }
                `}
              >
                <p
                  className={`text-xs ${
                    darkMode
                      ? "text-red-300"
                      : "text-red-600"
                  }`}
                >
                  You are deleting
                </p>

                <p
                  className={`text-sm font-bold mt-1 break-words ${
                    darkMode
                      ? "text-red-200"
                      : "text-red-800"
                  }`}
                >
                  {deleteTarget.firstName}{" "}
                  {deleteTarget.lastName}
                </p>
              </div>

              <p
                className={`text-sm mt-5 ${textSecondary}`}
              >
                Type{" "}
                <span className="font-bold text-red-500">
                  DELETE
                </span>{" "}
                to confirm.
              </p>

              <input
                value={deleteConfirmText}
                onChange={(e) =>
                  setDeleteConfirmText(
                    e.target.value,
                  )
                }
                placeholder="Type DELETE here..."
                className={`
                  w-full
                  mt-3
                  px-4
                  py-3
                  rounded-xl
                  border
                  outline-none
                  text-sm
                  transition
                  ${
                    darkMode
                      ? "bg-[#08130D] border-emerald-950/50 text-slate-100 placeholder:text-slate-600 focus:border-red-800 focus:ring-4 focus:ring-red-950/20"
                      : "bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:border-red-200 focus:ring-4 focus:ring-red-50"
                  }
                `}
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5">
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteConfirmText("");
                  }}
                  className={`
                    px-4
                    py-2.5
                    rounded-xl
                    text-sm
                    font-semibold
                    w-full
                    sm:w-auto
                    ${
                      darkMode
                        ? "bg-[#101F17] text-slate-300 border border-emerald-950/50 hover:bg-[#14261C]"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={
                    deleteConfirmText !== "DELETE"
                  }
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    bg-red-500
                    hover:bg-red-600
                    text-white
                    text-sm
                    font-semibold
                    disabled:bg-red-200
                    disabled:cursor-not-allowed
                    transition
                    w-full
                    sm:w-auto
                  "
                >
                  Delete Student
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================
   THEME TOGGLE
========================================================= */

const ThemeToggle = ({ darkMode, setDarkMode }) => (
  <button
    onClick={() =>
      setDarkMode((current) => !current)
    }
    className={`
      w-full
      flex
      items-center
      justify-between
      gap-3
      px-3.5
      py-2.5
      rounded-xl
      border
      text-sm
      font-semibold
      transition
      ${
        darkMode
          ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]"
          : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
      }
    `}
  >
    <div className="flex items-center gap-3">
      <span
        className={`
          w-7 h-7 rounded-lg
          flex items-center justify-center
          ${
            darkMode
              ? "bg-amber-950/40 text-amber-300"
              : "bg-white text-slate-500"
          }
        `}
      >
        {darkMode ? (
          <Sun size={15} />
        ) : (
          <Moon size={15} />
        )}
      </span>

      {darkMode ? "Light mode" : "Dark mode"}
    </div>

    <span
      className={`
        relative
        w-9
        h-5
        rounded-full
        transition
        ${
          darkMode
            ? "bg-green-600"
            : "bg-gray-300"
        }
      `}
    >
      <span
        className={`
  absolute
  top-0.5
  w-4
  h-4
  rounded-full
  shadow-sm
  transition
  ${
    darkMode
      ? "left-[18px] bg-black"
      : "left-0.5 bg-white"
  }
`}
      />
    </span>
  </button>
);

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
            ? "bg-emerald-950/50 text-emerald-300 font-semibold"
            : "bg-green-50 text-green-700 font-semibold"
          : darkMode
            ? "text-slate-400 hover:bg-[#101F17] hover:text-slate-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <span
      className={`
        transition
        ${
          active
            ? darkMode
              ? "text-emerald-400"
              : "text-green-600"
            : darkMode
              ? "text-slate-600 group-hover:text-slate-300"
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
   STAT CARD
========================================================= */

const StatCard = ({
  label,
  value,
  type,
  icon,
  darkMode,
}) => {
  const styles = {
    total: {
      icon: darkMode
        ? "bg-slate-800 text-slate-300"
        : "bg-gray-100 text-gray-700",
      number: darkMode
        ? "text-slate-100"
        : "text-gray-900",
      line: "bg-slate-500",
      glow: darkMode
        ? "shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
        : "",
    },

    high: {
      icon: darkMode
        ? "bg-red-950/50 text-red-300"
        : "bg-red-50 text-red-600",
      number: darkMode
        ? "text-red-300"
        : "text-red-600",
      line: "bg-red-500",
      glow: darkMode
        ? "shadow-[0_12px_35px_rgba(239,68,68,0.08)]"
        : "",
    },

    medium: {
      icon: darkMode
        ? "bg-amber-950/50 text-amber-300"
        : "bg-amber-50 text-amber-600",
      number: darkMode
        ? "text-amber-300"
        : "text-amber-600",
      line: "bg-amber-500",
      glow: darkMode
        ? "shadow-[0_12px_35px_rgba(245,158,11,0.07)]"
        : "",
    },

    low: {
      icon: darkMode
        ? "bg-emerald-950/50 text-emerald-300"
        : "bg-green-50 text-green-600",
      number: darkMode
        ? "text-emerald-300"
        : "text-green-600",
      line: "bg-green-500",
      glow: darkMode
        ? "shadow-[0_12px_35px_rgba(34,197,94,0.08)]"
        : "",
    },
  };

  const style = styles[type];

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className={`
        relative
        overflow-hidden
        border
        rounded-2xl
        sm:rounded-3xl
        p-4
        sm:p-5
        transition-colors
        ${surfaceClass(darkMode)}
        ${style.glow}
      `}
    >
      <div className="absolute right-0 top-0 w-20 h-20 rounded-full bg-green-500/5 blur-2xl" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`
              text-[10px]
              sm:text-xs
              font-semibold
              truncate
              ${
                darkMode
                  ? "text-slate-500"
                  : "text-gray-400"
              }
            `}
          >
            {label}
          </p>

          <p
            className={`
              text-2xl
              sm:text-3xl
              font-extrabold
              tracking-tight
              mt-2
              sm:mt-3
              ${style.number}
            `}
          >
            {value}
          </p>
        </div>

        <div
          className={`
            w-9
            sm:w-10
            h-9
            sm:h-10
            rounded-xl
            flex
            items-center
            justify-center
            flex-shrink-0
            ${style.icon}
          `}
        >
          {icon}
        </div>
      </div>

      <div
        className={`
          mt-4
          sm:mt-5
          h-1
          w-8
          sm:w-10
          rounded-full
          ${style.line}
        `}
      />
    </motion.div>
  );
};

/* =========================================================
   ACTION
========================================================= */

const Action = ({
  icon,
  danger,
  label,
  onClick,
  darkMode,
}) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`
      w-9
      h-9
      rounded-xl
      border
      flex
      items-center
      justify-center
      transition
      ${
        danger
          ? darkMode
            ? "text-red-300 border-red-900/40 bg-red-950/20 hover:bg-red-950/40"
            : "text-red-500 border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200"
          : darkMode
            ? "text-slate-400 border-emerald-950/50 bg-[#101F17] hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-800"
            : "text-gray-500 border-gray-100 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-100"
      }
    `}
  >
    {icon}
  </motion.button>
);

/* =========================================================
   FILTER CHIP
========================================================= */

const FilterChip = ({
  label,
  onRemove,
  darkMode,
}) => (
  <span
    className={`
      inline-flex
      items-center
      gap-1
      px-2
      py-1
      rounded-lg
      text-[10px]
      font-bold
      border
      ${
        darkMode
          ? "bg-emerald-950/30 border-emerald-900/40 text-emerald-300"
          : "bg-green-50 border-green-100 text-green-700"
      }
    `}
  >
    {label}

    <button
      onClick={onRemove}
      className="opacity-70 hover:opacity-100"
      aria-label={`Remove ${label} filter`}
    >
      <X size={11} />
    </button>
  </span>
);

/* =========================================================
   SKELETON ROW
========================================================= */

const SkeletonRow = ({ darkMode }) => (
  <tr
    className={`
      border-b
      animate-pulse
      ${
        darkMode
          ? "border-emerald-950/30"
          : "border-gray-50"
      }
    `}
  >
    <td className="px-4 sm:px-6 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl ${
            darkMode
              ? "bg-emerald-950/50"
              : "bg-gray-100"
          }`}
        />

        <div className="space-y-2">
          <div
            className={`h-3 w-32 rounded ${
              darkMode
                ? "bg-emerald-950/50"
                : "bg-gray-100"
            }`}
          />

          <div
            className={`h-2 w-20 rounded ${
              darkMode
                ? "bg-emerald-950/50"
                : "bg-gray-100"
            }`}
          />
        </div>
      </div>
    </td>

    <td className="px-4 sm:px-6 py-4">
      <div
        className={`h-3 w-20 rounded ${
          darkMode
            ? "bg-emerald-950/50"
            : "bg-gray-100"
        }`}
      />
    </td>

    <td className="px-4 sm:px-6 py-4">
      <div
        className={`h-6 w-16 rounded-lg mx-auto ${
          darkMode
            ? "bg-emerald-950/50"
            : "bg-gray-100"
        }`}
      />
    </td>

    <td className="px-4 sm:px-6 py-4">
      <div
        className={`h-6 w-16 rounded-full mx-auto ${
          darkMode
            ? "bg-emerald-950/50"
            : "bg-gray-100"
        }`}
      />
    </td>

    <td className="px-4 sm:px-6 py-4">
      <div className="flex justify-end gap-2">
        {Array.from({ length: 3 }).map(
          (_, index) => (
            <div
              key={index}
              className={`w-9 h-9 rounded-xl ${
                darkMode
                  ? "bg-emerald-950/50"
                  : "bg-gray-100"
              }`}
            />
          ),
        )}
      </div>
    </td>
  </tr>
);

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({
  search,
  hasActiveFilters,
  darkMode,
  clearFilters,
}) => (
  <tr>
    <td colSpan="5" className="px-6 py-16 text-center">
      <div
        className={`
          w-16
          h-16
          rounded-2xl
          flex
          items-center
          justify-center
          mx-auto
          mb-4
          ${
            darkMode
              ? "bg-emerald-950/40 text-emerald-500"
              : "bg-gray-50 text-gray-300"
          }
        `}
      >
        {search ? (
          <Search size={23} />
        ) : (
          <GraduationCap size={23} />
        )}
      </div>

      <p
        className={`font-semibold ${darkMode ? "text-slate-200" : "text-gray-700"}`}
      >
        {search || hasActiveFilters
          ? "No matching students"
          : "No students yet"}
      </p>

      <p
        className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-gray-400"}`}
      >
        {search || hasActiveFilters
          ? "Try another search or clear the active filters."
          : "Add a student to start building your directory."}
      </p>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition"
        >
          <RefreshCw size={13} />
          Clear Filters
        </button>
      )}
    </td>
  </tr>
);

/* =========================================================
   IMPORT SECTION
========================================================= */

const ImportSection = ({
  title,
  count,
  color,
  icon,
  children,
  darkMode,
}) => {
  const styles = {
    green: {
      icon: darkMode
        ? "bg-green-950/50 text-green-300"
        : "bg-green-50 text-green-600",
      badge: darkMode
        ? "bg-green-950/40 text-green-300"
        : "bg-green-50 text-green-700",
    },

    amber: {
      icon: darkMode
        ? "bg-amber-950/50 text-amber-300"
        : "bg-amber-50 text-amber-600",
      badge: darkMode
        ? "bg-amber-950/40 text-amber-300"
        : "bg-amber-50 text-amber-700",
    },

    red: {
      icon: darkMode
        ? "bg-red-950/50 text-red-300"
        : "bg-red-50 text-red-600",
      badge: darkMode
        ? "bg-red-950/40 text-red-300"
        : "bg-red-50 text-red-700",
    },
  };

  const style = styles[color];

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`
              w-8
              h-8
              rounded-lg
              flex
              items-center
              justify-center
              flex-shrink-0
              ${style.icon}
            `}
          >
            {icon}
          </div>

          <h3
            className={`text-sm font-bold truncate ${
              darkMode
                ? "text-slate-200"
                : "text-gray-800"
            }`}
          >
            {title}
          </h3>
        </div>

        <span
          className={`
            px-2
            py-1
            rounded-lg
            text-[10px]
            font-bold
            flex-shrink-0
            ${style.badge}
          `}
        >
          {count}
        </span>
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
};

/* =========================================================
   IMPORT ROW
========================================================= */

const ImportRow = ({
  title,
  subtitle,
  color,
  darkMode,
}) => {
  const styles = {
    green: darkMode
      ? "bg-green-950/20 border-green-900/30"
      : "bg-green-50/50 border-green-100",

    amber: darkMode
      ? "bg-amber-950/20 border-amber-900/30"
      : "bg-amber-50/50 border-amber-100",

    red: darkMode
      ? "bg-red-950/20 border-red-900/30"
      : "bg-red-50/50 border-red-100",
  };

  return (
    <div
      className={`
        flex
        items-center
        justify-between
        gap-4
        p-3
        rounded-xl
        border
        ${styles[color]}
      `}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            darkMode
              ? "text-slate-200"
              : "text-gray-800"
          }`}
        >
          {title}
        </p>

        <p
          className={`text-[11px] mt-0.5 truncate ${
            darkMode
              ? "text-slate-500"
              : "text-gray-400"
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   EMPTY IMPORT
========================================================= */

const EmptyImport = ({ text, darkMode }) => (
  <div
    className={`
      p-4
      rounded-xl
      border
      text-xs
      ${
        darkMode
          ? "bg-[#101F17] border-emerald-950/40 text-slate-500"
          : "bg-gray-50 border-gray-100 text-gray-400"
      }
    `}
  >
    {text}
  </div>
);

/* =========================================================
   SURFACE CLASS
========================================================= */

const surfaceClass = (darkMode) =>
  darkMode
    ? "bg-[#0C1913] border-emerald-950/50"
    : "bg-white border-gray-100";

export default StudentPage;