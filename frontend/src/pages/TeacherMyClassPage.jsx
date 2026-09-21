import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  BookOpen,
  LifeBuoy,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Upload,
  Search,
  RefreshCw,
  UserRound,
  GraduationCap,
  Mail,
  Phone,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileClock,
  History,
  Database,
  FileJson,
  UsersRound,
  Trash2,
  BrainCircuit,
  Sparkles,
  Loader2,
  FileWarning,
  Plus
} from "lucide-react";
import toast from "react-hot-toast";
import { API } from "../lib/api.js";
import { useAuthStore } from "../store/authStore";

const TeacherMyClassPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);

  const theme = useMemo(
    () => ({
      page: darkMode
        ? "bg-[#07110B] text-gray-100"
        : "bg-[#F7F9F8] text-gray-900",
      sidebar: darkMode
        ? "bg-[#0B1710] border-[#17251B]"
        : "bg-white border-gray-100",
      card: darkMode
        ? "bg-[#0D1A12] border-[#1A2C20]"
        : "bg-white border-gray-100",
      subtle: darkMode ? "bg-[#101F15]" : "bg-gray-50",
      border: darkMode ? "border-[#1A2C20]" : "border-gray-100",
      heading: darkMode ? "text-gray-100" : "text-gray-900",
      body: darkMode ? "text-gray-300" : "text-gray-500",
      muted: darkMode ? "text-gray-500" : "text-gray-400",
      input: darkMode
        ? "bg-[#0A1610] border-[#24392A] text-gray-100 placeholder:text-gray-600"
        : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400",
    }),
    [darkMode],
  );

  const teacherName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.name ||
    "Teacher";

  const firstName = user?.firstName || teacherName.split(" ")[0] || "Teacher";
  const profilePhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const fetchClass = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const response = await API.get("/api/teacher-class");
      const data = Array.isArray(response?.data?.students)
        ? response.data.students
        : [];

      setStudents(data);

      if (selectedStudent) {
        const updated = data.find(
          (item) => String(item._id) === String(selectedStudent._id),
        );
        setSelectedStudent(updated || null);
      }
    } catch (error) {
      console.error("Failed to load teacher class:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load your class.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClass();
  }, []);

  const navigateTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  const normalizeStudentId = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, "");

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportSummary(null);

      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new Error("Please select a .json file.");
      }

      const raw = await file.text();
      let parsed;

      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("The selected file is not valid JSON.");
      }

      const rawStudents = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.students)
          ? parsed.students
          : null;

      if (!rawStudents) {
        throw new Error(
          'JSON must be an array of students or an object containing a "students" array.',
        );
      }

      if (rawStudents.length === 0) {
        throw new Error("The JSON file contains no students.");
      }

      const studentIds = rawStudents.map((item) =>
        normalizeStudentId(
          typeof item === "string"
            ? item
            : item?.studentId || item?.studentNumber || item?.id,
        ),
      );

      if (studentIds.some((id) => !id)) {
        throw new Error(
          "Every JSON student entry must contain a studentId.",
        );
      }

      const seen = new Set();
      const duplicates = [];

      for (const id of studentIds) {
        if (seen.has(id)) duplicates.push(id);
        seen.add(id);
      }

      if (duplicates.length) {
        const uniqueDuplicates = [...new Set(duplicates)];
        throw new Error(
          `Duplicate student ID${uniqueDuplicates.length > 1 ? "s" : ""} found in JSON: ${uniqueDuplicates.join(", ")}`,
        );
      }

      const response = await API.post("/api/teacher-class/import", {
        studentIds,
      });

      setImportSummary(response.data);
      await fetchClass(false);

      toast.success(
        `Class loaded successfully: ${response.data.count || studentIds.length} students.`,
      );
    } catch (error) {
      console.error("Class JSON import failed:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to import class JSON.",
      );
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) => {
      const name = [
        student.firstName,
        student.middleName,
        student.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        name.includes(query) ||
        String(student.studentId || "").toLowerCase().includes(query) ||
        String(student.grade || "").toLowerCase().includes(query) ||
        String(student.section || "").toLowerCase().includes(query)
      );
    });
  }, [students, search]);


  const toggleStudentSelection = (studentId) => {
    const id = String(studentId);
    setSelectedStudentIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredStudents.map((student) => String(student._id));
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.includes(id));

    setSelectedStudentIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  };

  const openDeleteDialog = () => {
    if (!selectedStudentIds.length) {
      toast.error("Select at least one student first.");
      return;
    }
    setDeleteConfirmation("");
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
  };

  const handleDeleteSelected = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== "REMOVE") {
      toast.error('Type "REMOVE" to confirm this action.');
      return;
    }

    try {
      setDeleting(true);

      const response = await API.delete("/api/teacher-class/students", {
        data: { studentIds: selectedStudentIds },
      });

      const removedIds = new Set(
        (response.data?.removedStudentIds || selectedStudentIds).map(String),
      );

      setStudents((current) =>
        current.filter((student) => !removedIds.has(String(student._id))),
      );
      setSelectedStudentIds([]);
      setSelectedStudent(null);
      setDeleteDialogOpen(false);
      setDeleteConfirmation("");

      toast.success(
        `${response.data?.count || removedIds.size} student${removedIds.size === 1 ? "" : "s"} removed from My Class.`,
      );
    } catch (error) {
      console.error("Failed to remove students from class:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to remove the selected students from My Class.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const incidents = students.reduce(
      (total, student) => total + (student.incidents?.length || 0),
      0,
    );

    const interventions = students.reduce(
      (total, student) => total + (student.interventions?.length || 0),
      0,
    );

    const activeInterventions = students.reduce(
      (total, student) =>
        total +
        (student.interventions || []).filter(
          (item) => String(item.status).toLowerCase() === "active",
        ).length,
      0,
    );

    return {
      students: students.length,
      incidents,
      interventions,
      activeInterventions,
    };
  }, [students]);

  const getStudentName = (student) =>
    [student?.firstName, student?.middleName, student?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Unknown Student";

  const formatDate = (value) => {
    if (!value) return "No date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatStatus = (status) => {
    const value = String(status || "received").toLowerCase();

    const map = {
      received: "Received",
      "saved-student-statement": "Student Statement Saved",
      reviewing: "Under Review",
      "refer-for-intervention": "Refer for Intervention",
      "intervention-ready": "Intervention Ready",
      completed: "Completed",
      resolved: "Resolved",
      rejected: "Rejected",
      declined: "Rejected",
      denied: "Rejected",
    };

    return map[value] || value.replace(/-/g, " ");
  };

  const statusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (["completed", "resolved"].includes(value)) {
      return darkMode
        ? "bg-emerald-500/10 text-emerald-300"
        : "bg-emerald-50 text-emerald-700";
    }

    if (["rejected", "declined", "denied"].includes(value)) {
      return darkMode
        ? "bg-red-500/10 text-red-300"
        : "bg-red-50 text-red-700";
    }

    if (value === "intervention-ready") {
      return darkMode
        ? "bg-blue-500/10 text-blue-300"
        : "bg-blue-50 text-blue-700";
    }

    return darkMode
      ? "bg-amber-500/10 text-amber-300"
      : "bg-amber-50 text-amber-700";
  };

  const renderSidebar = (mobile = false) => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 px-3 mb-7">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-green-500/20 blur-lg" />
              <img
                src="/school-logo.webp"
                alt="School Logo"
                className="relative w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className={`text-xl font-extrabold tracking-tight ${theme.heading}`}>
                Guid<span className="text-green-500">Ed</span>
              </h1>
              <p className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}>
                Teacher Portal
              </p>
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                darkMode
                  ? "bg-[#101F15] text-gray-400"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-3 mb-7">
          <p className={`text-[11px] leading-relaxed ${theme.muted}`}>
            Our Lady of the Holy Rosary
            <br />
            School
            <br />
            General Trias Campus
          </p>
        </div>

        <p className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Main Menu
        </p>

        <div className="space-y-1">
          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" path="/teacher-dashboard" onNavigate={navigateTo} />
          <Nav icon={<FileWarning size={18} />} label="My Reports" path="/teacher-my-reports" onNavigate={navigateTo} />
          <Nav icon={<UsersRound size={18} />} label="My Class" active onNavigate={() => {}} />
          <Nav icon={<MessageSquare size={18} />} label="Messages" path="/messages" onNavigate={navigateTo} />
          <Nav
            icon={<Plus size={18} />}
            label="Report an Incident"
            path="/reports/create"
          />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Teacher Support
        </p>

        <div className="space-y-1">
          <Nav icon={<BookOpen size={18} />} label="Guidance Resources" path="/guidance" onNavigate={navigateTo} />
          <Nav icon={<LifeBuoy size={18} />} label="Contact Guidance" path="/messages" onNavigate={navigateTo} />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          System
        </p>

        <Nav icon={<Settings size={18} />} label="Settings" path="/settings" onNavigate={navigateTo} />
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                darkMode ? "bg-green-500/10" : "bg-green-100"
              }`}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={teacherName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-500 font-bold">
                  {teacherName.charAt(0).toUpperCase()}
                </span>
              )}
              <span
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
                  darkMode ? "border-[#0B1710]" : "border-white"
                }`}
              />
            </div>

            <div className="min-w-0">
              <p className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}>
                Teacher
              </p>
              <p className={`text-sm font-bold truncate ${theme.heading}`}>
                {teacherName}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDarkMode((value) => !value)}
          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition ${
            darkMode
              ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]"
              : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
          }`}
          title="Toggle theme"
        >
          <span className="flex items-center gap-3">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                darkMode
                  ? "bg-amber-950/40 text-amber-300"
                  : "bg-white text-slate-500"
              }`}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            {darkMode ? "Light mode" : "Dark mode"}
          </span>
          <span
            className={`relative w-9 h-5 rounded-full transition ${
              darkMode ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition ${
                darkMode ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${
            darkMode
              ? "border-[#24392A] text-gray-300 hover:bg-white/5"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen w-full flex ${theme.page}`}>
      <aside
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[250px] xl:w-[270px] flex-col px-4 xl:px-5 py-5 xl:py-6 overflow-y-auto border-r ${theme.sidebar}`}
      >
        {renderSidebar(false)}
      </aside>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] flex flex-col px-5 py-5 overflow-y-auto border-r lg:hidden ${theme.sidebar}`}
          >
            {renderSidebar(true)}
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 lg:ml-[250px] xl:ml-[270px]">
        <header
          className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
            darkMode
              ? "bg-[#07110B]/90 border-[#17251B]"
              : "bg-[#F7F9F8]/90 border-gray-100"
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center border ${theme.border}`}
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <div
                  className={`hidden sm:flex items-center gap-2 text-sm mb-1 ${theme.muted}`}
                >
                  <span>Teacher Portal</span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">
                    My Class
                  </span>
                </div>
                <h2
                  className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${theme.heading}`}
                >
                  My Class
                </h2>
                <p className={`text-xs sm:text-sm mt-1 ${theme.body}`}>
                  Manage your assigned students and review their recorded guidance history.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-amber-300"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
                title="Toggle theme"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <button
                type="button"
                className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
                title="Notifications"
              >
                <Bell size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
          <section className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-6 mb-5 ${theme.card} ${theme.border}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-start gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                }`}>
                  <FileJson size={23} />
                </div>

                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${theme.muted}`}>
                    Class roster
                  </p>
                  <h2 className={`text-xl sm:text-2xl font-extrabold mt-1 ${theme.heading}`}>
                    Load students from JSON
                  </h2>
                  <p className={`text-sm mt-1.5 max-w-2xl leading-6 ${theme.body}`}>
                    Upload a JSON roster containing student IDs. GuidEd validates every ID against the
                    database and loads only existing students. No student records are created or modified.
                  </p>
                </div>
              </div>

              <label className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold cursor-pointer transition flex-shrink-0 ${
                importing
                  ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-600"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}>
                <Upload size={17} />
                {importing ? "Validating..." : "Import JSON"}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImport}
                  disabled={importing}
                />
              </label>
            </div>

            <div className={`mt-5 rounded-xl border p-4 ${theme.subtle} ${theme.border}`}>
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-green-500 flex-shrink-0 mt-0.5" size={17} />
                <div>
                  <p className={`text-xs font-bold ${theme.heading}`}>Validation rules</p>
                  <p className={`text-xs mt-1 leading-5 ${theme.body}`}>
                    Duplicate IDs are rejected. IDs that do not exist in the Student collection are rejected.
                    The entire import is rejected if any entry is invalid.
                  </p>
                </div>
              </div>
            </div>

            {importSummary && (
              <div className={`mt-4 rounded-xl border p-4 ${theme.subtle} ${theme.border}`}>
                <p className={`text-sm font-bold ${theme.heading}`}>
                  Class roster updated successfully.
                </p>
                <p className={`text-xs mt-1 ${theme.body}`}>
                  {importSummary.count || 0} verified students are now associated with this teacher.
                </p>
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {[
              { label: "Students", value: stats.students, icon: UsersRound, accent: "green" },
              { label: "Recorded Incidents", value: stats.incidents, icon: FileClock, accent: "amber" },
              { label: "Interventions", value: stats.interventions, icon: ClipboardList, accent: "blue" },
              { label: "Active Interventions", value: stats.activeInterventions, icon: Clock3, accent: "purple" },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className={`rounded-2xl border p-4 sm:p-5 ${theme.card} ${theme.border}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    accent === "green"
                      ? darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                      : accent === "amber"
                        ? darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"
                        : accent === "blue"
                          ? darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                          : darkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600"
                  }`}>
                    <Icon size={19} />
                  </div>
                  <span className={`text-2xl font-extrabold ${theme.heading}`}>{value}</span>
                </div>
                <p className={`text-xs font-semibold mt-3 ${theme.body}`}>{label}</p>
              </div>
            ))}
          </section>

          <section className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 mb-5 ${theme.card} ${theme.border}`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className={`relative flex-1`}>
                <Search size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.muted}`} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, student ID, grade, or section..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-sm ${theme.input}`}
                />
              </div>

              <button
                type="button"
                onClick={() => fetchClass(false)}
                disabled={refreshing}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${theme.border} ${theme.subtle}`}
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t ${theme.border}`}>
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                disabled={!filteredStudents.length}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border ${theme.border} ${theme.subtle} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {filteredStudents.length > 0 && filteredStudents.every((student) => selectedStudentIds.includes(String(student._id)))
                  ? "Unselect visible students"
                  : "Select visible students"}
              </button>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${theme.body}`}>
                  {selectedStudentIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={openDeleteDialog}
                  disabled={!selectedStudentIds.length || deleting}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Trash2 size={15} />
                  Remove from My Class
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className={`rounded-2xl sm:rounded-3xl border p-10 text-center ${theme.card} ${theme.border}`}>
              <RefreshCw size={24} className="mx-auto text-green-500 animate-spin" />
              <p className={`text-sm font-semibold mt-3 ${theme.body}`}>Loading your class...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className={`rounded-2xl sm:rounded-3xl border p-10 sm:p-14 text-center ${theme.card} ${theme.border}`}>
              <UsersRound size={35} className={`mx-auto ${theme.muted}`} />
              <h3 className={`text-lg font-extrabold mt-4 ${theme.heading}`}>
                {students.length ? "No students found" : "Your class is empty"}
              </h3>
              <p className={`text-sm mt-2 max-w-md mx-auto ${theme.body}`}>
                {students.length
                  ? "Try a different search."
                  : "Import a JSON roster containing valid student IDs to load your class."}
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const incidents = student.incidents || [];
                const interventions = student.interventions || [];
                const active = interventions.filter(
                  (item) => String(item.status).toLowerCase() === "active",
                ).length;

                return (
                  <div
                    key={student._id}
                    className={`relative text-left rounded-2xl sm:rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${theme.card} ${theme.border} ${selectedStudentIds.includes(String(student._id)) ? (darkMode ? "ring-2 ring-green-500/40" : "ring-2 ring-green-200") : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(String(student._id))}
                        onChange={() => toggleStudentSelection(student._id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1.5 w-4 h-4 accent-green-600 cursor-pointer flex-shrink-0"
                        aria-label={`Select ${getStudentName(student)}`}
                      />
                      <div
                        className={`relative w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                          darkMode ? "bg-green-500/10" : "bg-green-50"
                        }`}
                      >
                        {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt={getStudentName(student)}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <UserRound
                            size={22}
                            className={darkMode ? "text-green-400" : "text-green-600"}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className={`font-extrabold truncate ${theme.heading}`}>
                              {getStudentName(student)}
                            </h3>
                            <p className={`text-xs mt-1 ${theme.muted}`}>
                              ID: {student.studentId || "Not available"}
                            </p>
                          </div>
                          <RiskBadge risk={student.riskLevel} darkMode={darkMode} />
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.subtle} ${theme.muted} hover:text-green-500 transition`}
                            title="View student record"
                          >
                            <ChevronRight size={17} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-5">
                      <InfoMini icon={<GraduationCap size={14} />} label="Grade" value={student.grade || "—"} theme={theme} />
                      <InfoMini icon={<Users size={14} />} label="Section" value={student.section || "—"} theme={theme} />
                      <InfoMini icon={<FileClock size={14} />} label="Incidents" value={incidents.length} theme={theme} />
                      <InfoMini icon={<ClipboardList size={14} />} label="Active" value={active} theme={theme} />
                    </div>

                    <div className={`mt-4 pt-4 border-t flex items-center justify-between gap-3 ${theme.border}`}>
                      <span className={`text-[11px] font-semibold ${theme.body}`}>
                        View student record
                      </span>
                      <span className={`text-[11px] font-bold ${
                        incidents.length || interventions.length
                          ? "text-green-500"
                          : theme.muted
                      }`}>
                        {incidents.length + interventions.length} history item{incidents.length + interventions.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </main>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDeleteDialog} />

          <div className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-7 ${theme.card} ${theme.border}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}>
                <Trash2 size={22} />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] uppercase tracking-widest font-bold ${theme.muted}`}>Security Confirmation</p>
                <h2 className={`text-xl font-extrabold mt-1 ${theme.heading}`}>Remove students from My Class?</h2>
              </div>
            </div>

            <p className={`text-sm leading-6 mt-5 ${theme.body}`}>
              You are about to remove <strong className={theme.heading}>{selectedStudentIds.length}</strong> student{selectedStudentIds.length === 1 ? "" : "s"} from your My Class roster.
              This does <strong className={theme.heading}>not delete the student from the Student collection</strong>; it only removes the student from your teacher roster.
            </p>

            <div className={`mt-4 rounded-2xl border p-4 ${darkMode ? "bg-red-500/5 border-red-900/40" : "bg-red-50 border-red-100"}`}>
              <p className={`text-xs font-bold ${darkMode ? "text-red-300" : "text-red-700"}`}>
                This action changes your class roster immediately.
              </p>
            </div>

            <label className="block mt-5">
              <span className={`text-xs font-bold ${theme.heading}`}>Type <span className="text-red-500">REMOVE</span> to confirm</span>
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                disabled={deleting}
                autoFocus
                className={`w-full mt-2 px-4 py-3 rounded-xl border outline-none text-sm ${theme.input}`}
                placeholder="REMOVE"
              />
            </label>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleting}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold ${theme.border} ${theme.subtle} disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={deleting || deleteConfirmation.trim().toUpperCase() !== "REMOVE"}
                className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                {deleting ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          darkMode={darkMode}
          theme={theme}
          close={() => setSelectedStudent(null)}
          formatDate={formatDate}
          formatStatus={formatStatus}
          statusClass={statusClass}
        />
      )}
    </div>
  );
};

const normalizeRiskLevel = (risk) => {
  const value = String(risk || "").trim().toLowerCase();
  if (value === "high") return "High";
  if (value === "medium" || value === "moderate") return "Medium";
  if (value === "low") return "Low";
  return "Not recorded";
};

const RiskBadge = ({ risk, darkMode }) => {
  const value = normalizeRiskLevel(risk);
  const styles =
    value === "High"
      ? darkMode
        ? "bg-red-500/10 text-red-300 border-red-500/20"
        : "bg-red-50 text-red-700 border-red-100"
      : value === "Medium"
        ? darkMode
          ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
          : "bg-amber-50 text-amber-700 border-amber-100"
        : value === "Low"
          ? darkMode
            ? "bg-green-500/10 text-green-300 border-green-500/20"
            : "bg-green-50 text-green-700 border-green-100"
          : darkMode
            ? "bg-gray-500/10 text-gray-300 border-gray-500/20"
            : "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-extrabold uppercase tracking-wide whitespace-nowrap ${styles}`}>
      <ShieldCheck size={11} />
      {value}
    </span>
  );
};

const InfoMini = ({ icon, label, value, theme }) => (
  <div className={`rounded-xl border p-3 ${theme.subtle} ${theme.border}`}>
    <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
      {icon}
      {label}
    </div>
    <p className={`text-sm font-bold mt-1 truncate ${theme.heading}`}>{value}</p>
  </div>
);

const StudentDetailsModal = ({
  student,
  darkMode,
  theme,
  close,
  formatDate,
  formatStatus,
  statusClass,
}) => {
  const name =
    [student?.firstName, student?.middleName, student?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Unknown Student";

  const incidents = Array.isArray(student?.incidents)
    ? student.incidents
    : [];
  const interventions = Array.isArray(student?.interventions)
    ? student.interventions
    : [];

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const analyzeStudent = async () => {
    setAiLoading(true);
    setAiError("");

    try {
      const sortedIncidents = [...incidents].sort(
        (a, b) =>
          new Date(b?.date || b?.createdAt || 0) -
          new Date(a?.date || a?.createdAt || 0),
      );

      const currentIncident = sortedIncidents[0] || null;
      const previousIncidents = currentIncident
        ? sortedIncidents.slice(1)
        : sortedIncidents;

      const response = await API.post("/api/gemini/student-analysis", {
        grade: student?.grade || "Not specified",
        riskLevel: student?.riskLevel || "Not specified",
        currentIncident: currentIncident
          ? {
              ...currentIncident,
              incidentId: currentIncident._id,
            }
          : null,
        previousIncidents,
        incidents: sortedIncidents,
        reports: [],
      });

      const data = response?.data || {};
      if (!data.success) {
        throw new Error(data.error || "Gemini could not analyze this student.");
      }

      setAiAnalysis(data);
    } catch (error) {
      console.error("Student Gemini analysis error:", error);
      setAiError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to generate Gemini analysis.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    setAiAnalysis(null);
    setAiError("");
    analyzeStudent();
    // Analyze only when a different student record is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?._id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={close} />

      <div className={`relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border shadow-2xl ${theme.card} ${theme.border}`}>
        <div className={`px-5 sm:px-7 py-5 border-b flex items-center justify-between gap-4 ${theme.border}`}>
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`relative w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                darkMode ? "bg-green-500/10" : "bg-green-50"
              }`}
            >
              {student.profilePhoto ? (
                <img
                  src={student.profilePhoto}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <UserRound
                  size={22}
                  className={darkMode ? "text-green-400" : "text-green-600"}
                />
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] uppercase tracking-widest font-bold ${theme.muted}`}>
                Student Record
              </p>
              <h2 className={`text-xl sm:text-2xl font-extrabold truncate ${theme.heading}`}>
                {name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.subtle}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-89px)] p-5 sm:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
            <div className="space-y-4">
              <section className={`rounded-2xl border p-5 ${theme.subtle} ${theme.border}`}>
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-green-500/10 text-green-500 flex items-center justify-center">
                  {student.profilePhoto ? (
                    <img
                      src={student.profilePhoto}
                      alt={name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <UserRound size={28} />
                  )}
                </div>

                <h3 className={`text-lg font-extrabold mt-4 ${theme.heading}`}>{name}</h3>

                <div className="space-y-3 mt-5">
                  <DetailRow icon={<GraduationCap size={15} />} label="Student ID" value={student.studentId || "—"} theme={theme} />
                  <DetailRow
                    icon={<GraduationCap size={15} />}
                    label="Grade and Section"
                    value={`${student.grade || "—"}${student.section ? ` • ${student.section}` : ""}`}
                    theme={theme}
                  />
                  <DetailRow icon={<ShieldCheck size={15} />} label="Risk Level" value={normalizeRiskLevel(student.riskLevel)} theme={theme} />
                  <DetailRow icon={<Mail size={15} />} label="Email" value={student.email || "—"} theme={theme} />
                  <DetailRow icon={<Phone size={15} />} label="Phone" value={student.phone || "—"} theme={theme} />
                </div>
              </section>

              <section className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${theme.muted}`}>
                  Record Summary
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <SummaryBox label="Incidents" value={incidents.length} theme={theme} />
                  <SummaryBox label="Interventions" value={interventions.length} theme={theme} />
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className={`rounded-2xl border p-5 ${theme.card} ${theme.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"
                    }`}>
                      <BrainCircuit size={21} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-extrabold ${theme.heading}`}>Gemini Student Analysis</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                          darkMode ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-green-50 text-green-700"
                        }`}>
                          AI-assisted
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-5 ${theme.body}`}>
                        A guidance-focused analysis based on this student's recorded information.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={analyzeStudent}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold flex-shrink-0"
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {aiLoading ? "Analyzing..." : "Analyze again"}
                  </button>
                </div>

                {aiLoading && !aiAnalysis ? (
                  <div className={`mt-4 rounded-2xl border p-5 ${theme.subtle} ${theme.border}`}>
                    <div className="flex items-center gap-3">
                      <Loader2 size={18} className="animate-spin text-green-500" />
                      <div>
                        <p className={`text-sm font-bold ${theme.heading}`}>Gemini is reviewing the student record...</p>
                        <p className={`text-xs mt-1 ${theme.muted}`}>This may take a few moments.</p>
                      </div>
                    </div>
                  </div>
                ) : aiError ? (
                  <div className={`mt-4 rounded-2xl border p-4 ${darkMode ? "bg-red-500/5 border-red-900/40" : "bg-red-50 border-red-100"}`}>
                    <p className={`text-xs font-semibold ${darkMode ? "text-red-300" : "text-red-700"}`}>{aiError}</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={`rounded-2xl border p-4 md:col-span-2 ${theme.subtle} ${theme.border}`}>
                        <p className={`text-[9px] uppercase tracking-widest font-bold ${theme.muted}`}>Summary</p>
                        <p className={`text-sm leading-6 mt-2 ${theme.body}`}>{aiAnalysis.summary || "No summary was generated."}</p>
                      </div>
                      <div className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                        <p className={`text-[9px] uppercase tracking-widest font-bold ${theme.muted}`}>AI Risk Level</p>
                        <div className="mt-2"><RiskBadge risk={aiAnalysis.risk} darkMode={darkMode} /></div>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                      <p className={`text-[9px] uppercase tracking-widest font-bold ${theme.muted}`}>Observed Pattern</p>
                      <p className={`text-sm leading-6 mt-2 ${theme.body}`}>{aiAnalysis.pattern || "No clear pattern was identified."}</p>
                    </div>

                    <div className={`rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}>
                      <p className={`text-[9px] uppercase tracking-widest font-bold ${theme.muted}`}>Guidance Interpretation</p>
                      <p className={`text-sm leading-6 mt-2 ${theme.body}`}>{aiAnalysis.prediction || "No additional interpretation was generated."}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-green-500" />
                        <p className={`text-sm font-extrabold ${theme.heading}`}>Suggested Guidance Actions</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(aiAnalysis.interventions || []).slice(0, 3).map((item, index) => (
                          <div key={index} className={`rounded-2xl border p-4 ${theme.card} ${theme.border}`}>
                            <p className="text-[10px] font-black uppercase tracking-wider text-green-500">Suggestion {index + 1}</p>
                            <p className={`text-sm font-bold mt-2 ${theme.heading}`}>{item?.recommendation || "Support recommendation"}</p>
                            {item?.basis && <p className={`text-xs leading-5 mt-2 ${theme.body}`}>{item.basis}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {aiAnalysis.notes && (
                      <p className={`text-[10px] leading-5 ${theme.muted}`}>{aiAnalysis.notes}</p>
                    )}
                  </div>
                ) : null}
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <History size={18} className="text-green-500" />
                  <h3 className={`font-extrabold ${theme.heading}`}>Cases & Incident History</h3>
                </div>

                {incidents.length === 0 ? (
                  <EmptyHistory text="No recorded incidents for this student." theme={theme} />
                ) : (
                  <div className="space-y-3">
                    {incidents.map((incident) => (
                      <div key={incident._id} className={`rounded-2xl border p-4 ${theme.card} ${theme.border}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`font-bold truncate ${theme.heading}`}>
                              {incident.title || incident.offense || "Incident Record"}
                            </p>
                            <p className={`text-xs mt-1 ${theme.muted}`}>
                              {formatDate(incident.date || incident.createdAt)}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusClass(incident.status)}`}>
                            {formatStatus(incident.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <DetailRow icon={<FileText size={14} />} label="Category" value={incident.category || "Uncategorized"} theme={theme} />
                          <DetailRow icon={<AlertTriangle size={14} />} label="Level" value={incident.level || "Not recorded"} theme={theme} />
                          <DetailRow icon={<Database size={14} />} label="Location" value={incident.location || "Not recorded"} theme={theme} />
                          <DetailRow icon={<CalendarDays size={14} />} label="Recorded" value={formatDate(incident.createdAt)} theme={theme} />
                        </div>

                        {incident.description && (
                          <div className={`mt-4 rounded-xl p-3 ${theme.subtle}`}>
                            <p className={`text-[10px] uppercase tracking-wider font-bold ${theme.muted}`}>
                              Description
                            </p>
                            <p className={`text-xs leading-5 mt-1 ${theme.body}`}>
                              {incident.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList size={18} className="text-blue-500" />
                  <h3 className={`font-extrabold ${theme.heading}`}>Interventions</h3>
                </div>

                {interventions.length === 0 ? (
                  <EmptyHistory text="No intervention records for this student." theme={theme} />
                ) : (
                  <div className="space-y-3">
                    {interventions.map((intervention) => (
                      <div key={intervention._id} className={`rounded-2xl border p-4 ${theme.card} ${theme.border}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`font-bold capitalize ${theme.heading}`}>
                              {intervention.type || "Intervention"}
                            </p>
                            <p className={`text-xs mt-1 ${theme.muted}`}>
                              {formatDate(intervention.createdAt)}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusClass(intervention.status)}`}>
                            {String(intervention.status || "active").replace(/-/g, " ")}
                          </span>
                        </div>

                        {intervention.description && (
                          <p className={`text-xs leading-5 mt-3 ${theme.body}`}>
                            {intervention.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <DetailRow icon={<UserRound size={14} />} label="Intervention By" value={intervention.interventionBy || "Not recorded"} theme={theme} />
                          <DetailRow icon={<CheckCircle2 size={14} />} label="Approved By" value={intervention.approvedBy || "Not recorded"} theme={theme} />
                          <DetailRow icon={<CheckCircle2 size={14} />} label="Completed By" value={intervention.completedBy || "Not recorded"} theme={theme} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value, theme }) => (
  <div className="flex items-start gap-2.5 min-w-0">
    <span className={`mt-0.5 flex-shrink-0 ${theme.muted}`}>{icon}</span>
    <div className="min-w-0">
      <p className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}>{label}</p>
      <p className={`text-xs font-semibold mt-0.5 break-words ${theme.heading}`}>{value}</p>
    </div>
  </div>
);

const SummaryBox = ({ label, value, theme }) => (
  <div className={`rounded-xl border p-3 ${theme.subtle} ${theme.border}`}>
    <p className={`text-[10px] uppercase tracking-wider font-bold ${theme.muted}`}>{label}</p>
    <p className={`text-xl font-extrabold mt-1 ${theme.heading}`}>{value}</p>
  </div>
);

const EmptyHistory = ({ text, theme }) => (
  <div className={`rounded-2xl border p-5 text-sm ${theme.subtle} ${theme.border} ${theme.body}`}>
    {text}
  </div>
);

const Nav = ({ icon, label, path, active, onNavigate }) => (
  <button
    type="button"
    onClick={() => path && onNavigate(path)}
    className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
      active
        ? "bg-green-500/10 text-green-500"
        : "text-gray-500 hover:bg-gray-500/5"
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
  </button>
);

export default TeacherMyClassPage;
