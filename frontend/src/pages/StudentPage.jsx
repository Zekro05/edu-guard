import { useEffect, useState, useRef } from "react";
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
  ExternalLink,
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
     STATE
  ========================================================= */

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

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

  const fileRef = useRef(null);

  const PER_PAGE = 8;

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
     FILTER
  ========================================================= */

  const filtered = students.filter((student) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    const fullName =
      `${student.firstName || ""} ${student.middleName || ""} ${
        student.lastName || ""
      }`.toLowerCase();

    const studentId = String(student.studentId || "").toLowerCase();

    const grade = String(student.grade || "").toLowerCase();

    return (
      fullName.includes(query) ||
      studentId.includes(query) ||
      grade.includes(query)
    );
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const paginated = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > pages) {
      setPage(pages);
    }
  }, [pages, page]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = {
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
          const [firstName, ...rest] = student.name.split(" ");

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
      await API.delete(`/api/students/${deleteTarget._id}`);

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
     ACTION BUTTON
  ========================================================= */

  const Action = ({ icon, danger, label, onClick }) => (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={label}
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
            ? "text-red-500 border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200"
            : "text-gray-500 border-gray-100 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-100"
        }
      `}
    >
      {icon}
    </motion.button>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F7F9F8] text-gray-900 overflow-hidden">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="hidden lg:flex w-[270px] bg-white border-r border-gray-100 flex-col justify-between px-5 py-6">

        <div>

          {/* BRAND */}

          <div className="px-3 mb-8">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 flex items-center justify-center">
                <img
                  src="/school-logo.png"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                  Guid<span className="text-green-600">Ed</span>
                </h1>

                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                  Student Guidance
                </p>
              </div>

            </div>

            <p className="text-[11px] leading-relaxed text-gray-400 mt-4">
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>

          </div>

          {/* NAVIGATION */}

          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">

            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() => navigate("/dashboard")}
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              active
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

          <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
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

              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0">

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
              border
              border-gray-200
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
          MAIN
      ===================================================== */}

      <main className="flex-1 min-w-0 overflow-y-auto">

        {/* HEADER */}

        <header className="sticky top-0 z-30 bg-[#F7F9F8]/90 backdrop-blur-xl border-b border-gray-100">

          <div className="px-6 md:px-10 py-5 flex items-center justify-between">

            <div>

              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span>Management</span>
                <ChevronRight size={12} />
                <span className="text-green-600 font-medium">
                  Students
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Students
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Manage student records and monitor behavioral risk.
              </p>

            </div>

            <div className="hidden md:flex items-center gap-2">

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100">

                <Database
                  size={15}
                  className="text-green-600"
                />

                <span className="text-xs font-semibold text-gray-600">
                  {students.length} records
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="px-6 md:px-10 py-8 space-y-8">

          {/* ===================================================
              OVERVIEW
          =================================================== */}

          <section>

            <div className="flex items-end justify-between mb-4">

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Student Overview
                </h3>

                <p className="text-xs text-gray-400 mt-0.5">
                  Current student population and risk distribution
                </p>
              </div>

              <Users
                size={18}
                className="text-gray-300"
              />

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

              <StatCard
                label="Total Students"
                value={stats.total}
                type="total"
                icon={<Users size={18} />}
              />

              <StatCard
                label="High Risk"
                value={stats.high}
                type="high"
                icon={<AlertTriangle size={18} />}
              />

              <StatCard
                label="Medium Risk"
                value={stats.med}
                type="medium"
                icon={<AlertTriangle size={18} />}
              />

              <StatCard
                label="Low Risk"
                value={stats.low}
                type="low"
                icon={<CheckCircle2 size={18} />}
              />

            </div>

          </section>

          {/* ===================================================
              STUDENT DIRECTORY
          =================================================== */}

          <section>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Student Directory
                </h3>

                <p className="text-xs text-gray-400 mt-0.5">
                  Search, view, edit, or manage student records
                </p>
              </div>

              <div className="flex gap-2">

                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileRef.current?.click()}
                  className="
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    bg-white
                    border
                    border-gray-200
                    text-gray-600
                    text-sm
                    font-semibold
                    hover:border-green-200
                    hover:text-green-700
                    hover:shadow-sm
                    transition
                  "
                >
                  <Upload size={16} />

                  {importing ? "Importing..." : "Import"}
                </motion.button>

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowModal(true);
                    setIsEditing(false);
                    setSelectedStudent(null);
                  }}
                  className="
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    text-sm
                    font-semibold
                    shadow-sm
                    shadow-green-200
                    transition
                  "
                >
                  <Plus size={17} />
                  Add Student
                </motion.button>

              </div>

            </div>

            {/* SEARCH */}

            <div className="
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-3
              shadow-[0_4px_24px_rgba(0,0,0,0.025)]
              mb-4
            ">

              <div className="
                flex
                items-center
                gap-3
                bg-gray-50
                border
                border-gray-100
                px-4
                py-3
                rounded-xl
                focus-within:bg-white
                focus-within:border-green-200
                focus-within:ring-4
                focus-within:ring-green-50
                transition
              ">

                <Search
                  size={17}
                  className="text-gray-400 flex-shrink-0"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    w-full
                    outline-none
                    bg-transparent
                    text-sm
                    text-gray-800
                    placeholder:text-gray-400
                  "
                  placeholder="Search by name, student ID, or grade..."
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}

              </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="
              bg-white
              border
              border-gray-100
              rounded-3xl
              overflow-hidden
              shadow-[0_4px_24px_rgba(0,0,0,0.025)]
            ">

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>

                    <tr className="bg-gray-50/80 border-b border-gray-100">

                      <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Student
                      </th>

                      <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Student ID
                      </th>

                      <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Grade
                      </th>

                      <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Risk Level
                      </th>

                      <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonRow key={index} />
                      ))
                    ) : paginated.length === 0 ? (
                      <EmptyState search={search} />
                    ) : (
                      paginated.map((student, index) => (
                        <motion.tr
                          key={student._id}
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay: index * 0.025,
                          }}
                          className="
                            border-b
                            border-gray-50
                            last:border-b-0
                            hover:bg-green-50/30
                            transition
                          "
                        >

                          {/* STUDENT */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="
                                w-10
                                h-10
                                rounded-xl
                                bg-green-50
                                border
                                border-green-100
                                overflow-hidden
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                              ">

                                {student.profilePhoto ? (
                                  <img
                                    src={student.profilePhoto}
                                    alt={`${student.firstName} ${student.lastName}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <UserRound
                                    size={17}
                                    className="text-green-600"
                                  />
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="font-semibold text-gray-900 truncate">
                                  {student.firstName}{" "}
                                  {student.middleName
                                    ? `${student.middleName} `
                                    : ""}
                                  {student.lastName}
                                </p>

                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  Student Profile
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* ID */}

                          <td className="px-6 py-4">

                            <span className="text-xs font-medium text-gray-500">
                              {student.studentId || "—"}
                            </span>

                          </td>

                          {/* GRADE */}

                          <td className="px-6 py-4 text-center">

                            <span className="
                              inline-flex
                              items-center
                              px-2.5
                              py-1
                              rounded-lg
                              bg-gray-50
                              border
                              border-gray-100
                              text-xs
                              font-semibold
                              text-gray-600
                            ">
                              {student.grade || "—"}
                            </span>

                          </td>

                          {/* RISK */}

                          <td className="px-6 py-4 text-center">

                            <RiskBadge
                              level={student.riskLevel}
                            />

                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-4">

                            <div className="flex justify-end gap-1.5">

                              <Action
                                label="View profile"
                                icon={<Eye size={15} />}
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowProfile(true);
                                }}
                              />

                              <Action
                                label="Edit student"
                                icon={<Pencil size={15} />}
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setIsEditing(true);
                                  setShowModal(true);
                                }}
                              />

                              <Action
                                label="Delete student"
                                danger
                                icon={<Trash2 size={15} />}
                                onClick={() =>
                                  setDeleteTarget(student)
                                }
                              />

                            </div>

                          </td>

                        </motion.tr>
                      ))
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  TABLE FOOTER
              ================================================= */}

              {!loading && (
                <div className="
                  px-6
                  py-4
                  border-t
                  border-gray-100
                  bg-gray-50/40
                  flex
                  flex-col
                  sm:flex-row
                  items-center
                  justify-between
                  gap-3
                ">

                  <p className="text-xs text-gray-400">

                    {filtered.length === 0
                      ? "No students found"
                      : `Showing ${
                          (page - 1) * PER_PAGE + 1
                        }–${Math.min(
                          page * PER_PAGE,
                          filtered.length,
                        )} of ${filtered.length} students`}

                  </p>

                  <div className="flex items-center gap-2">

                    <button
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(current - 1, 1),
                        )
                      }
                      className="
                        w-9
                        h-9
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        flex
                        items-center
                        justify-center
                        text-gray-500
                        hover:border-green-200
                        hover:text-green-700
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                        transition
                      "
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="
                      min-w-9
                      h-9
                      px-3
                      rounded-xl
                      bg-green-600
                      text-white
                      flex
                      items-center
                      justify-center
                      text-xs
                      font-bold
                    ">
                      {page}
                    </div>

                    <button
                      disabled={page >= pages}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(current + 1, pages),
                        )
                      }
                      className="
                        w-9
                        h-9
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        flex
                        items-center
                        justify-center
                        text-gray-500
                        hover:border-green-200
                        hover:text-green-700
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                        transition
                      "
                    >
                      <ChevronRight size={16} />
                    </button>

                  </div>

                </div>
              )}

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
              bg-black/30
              backdrop-blur-sm
              flex
              items-center
              justify-center
              z-50
              p-4
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
              className="
                bg-white
                rounded-3xl
                w-full
                max-w-[760px]
                max-h-[85vh]
                overflow-hidden
                shadow-2xl
                border
                border-gray-100
              "
            >

              {/* HEADER */}

              <div className="
                px-6
                py-5
                border-b
                border-gray-100
                flex
                items-center
                justify-between
              ">

                <div className="flex items-center gap-3">

                  <div className="
                    w-10
                    h-10
                    rounded-xl
                    bg-green-50
                    text-green-600
                    flex
                    items-center
                    justify-center
                  ">
                    <FileUp size={18} />
                  </div>

                  <div>

                    <h2 className="font-bold text-gray-900">
                      Import Preview
                    </h2>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Review changes before importing
                    </p>

                  </div>

                </div>

                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreview(null);
                  }}
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-gray-50
                    hover:bg-gray-100
                    flex
                    items-center
                    justify-center
                    text-gray-500
                  "
                >
                  <X size={17} />
                </button>

              </div>

              {/* BODY */}

              <div className="p-6 overflow-y-auto max-h-[60vh]">

                {/* INSERTS */}

                <ImportSection
                  title="New Students"
                  count={preview.toInsert.length}
                  color="green"
                  icon={<Plus size={15} />}
                >

                  {preview.toInsert.length === 0 ? (
                    <EmptyImport text="No new students." />
                  ) : (
                    preview.toInsert.map((student, index) => (
                      <ImportRow
                        key={index}
                        color="green"
                        title={student.name}
                        subtitle={`${student.studentId} • ${student.grade}`}
                      />
                    ))
                  )}

                </ImportSection>

                {/* UPDATES */}

                <ImportSection
                  title="Updates"
                  count={preview.toUpdate.length}
                  color="amber"
                  icon={<Database size={15} />}
                >

                  {preview.toUpdate.length === 0 ? (
                    <EmptyImport text="No student updates." />
                  ) : (
                    preview.toUpdate.map((student, index) => (
                      <ImportRow
                        key={index}
                        color="amber"
                        title={student.name}
                        subtitle={`${student.oldGrade} → ${student.newGrade}`}
                      />
                    ))
                  )}

                </ImportSection>

                {/* INVALID */}

                {preview.invalid.length > 0 && (
                  <ImportSection
                    title="Invalid Records"
                    count={preview.invalid.length}
                    color="red"
                    icon={<AlertTriangle size={15} />}
                  >

                    {preview.invalid.map((student, index) => (
                      <ImportRow
                        key={index}
                        color="red"
                        title={student.name || "Unknown student"}
                        subtitle="Missing student ID"
                      />
                    ))}

                  </ImportSection>
                )}

              </div>

              {/* FOOTER */}

              <div className="
                px-6
                py-4
                border-t
                border-gray-100
                bg-gray-50/50
                flex
                justify-end
                gap-2
              ">

                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreview(null);
                  }}
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    bg-white
                    border
                    border-gray-200
                    text-sm
                    font-semibold
                    text-gray-600
                    hover:bg-gray-50
                  "
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
                    hover:bg-green-700
                    text-white
                    text-sm
                    font-semibold
                    disabled:opacity-50
                  "
                >
                  {importing ? "Importing..." : "Confirm Import"}
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
              bg-black/30
              backdrop-blur-sm
              flex
              items-center
              justify-center
              z-50
              p-4
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
              className="
                bg-white
                rounded-3xl
                p-6
                w-full
                max-w-[400px]
                shadow-2xl
                border
                border-gray-100
              "
            >

              <div className="flex items-start gap-3">

                <div className="
                  w-11
                  h-11
                  rounded-xl
                  bg-red-50
                  text-red-500
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                ">
                  <Trash2 size={19} />
                </div>

                <div>

                  <h2 className="text-lg font-bold text-gray-900">
                    Delete Student
                  </h2>

                  <p className="text-xs text-gray-400 mt-1">
                    This action cannot be undone.
                  </p>

                </div>

              </div>

              <div className="
                mt-5
                p-4
                rounded-2xl
                bg-red-50
                border
                border-red-100
              ">

                <p className="text-xs text-red-600">
                  You are deleting
                </p>

                <p className="text-sm font-bold text-red-800 mt-1">
                  {deleteTarget.firstName}{" "}
                  {deleteTarget.lastName}
                </p>

              </div>

              <p className="text-sm text-gray-500 mt-5">

                Type{" "}
                <span className="font-bold text-red-600">
                  DELETE
                </span>{" "}
                to confirm.

              </p>

              <input
                value={deleteConfirmText}
                onChange={(e) =>
                  setDeleteConfirmText(e.target.value)
                }
                placeholder="Type DELETE here..."
                className="
                  w-full
                  mt-3
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  outline-none
                  text-sm
                  focus:bg-white
                  focus:border-red-200
                  focus:ring-4
                  focus:ring-red-50
                  transition
                "
              />

              <div className="flex justify-end gap-2 mt-5">

                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteConfirmText("");
                  }}
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    bg-gray-100
                    hover:bg-gray-200
                    text-sm
                    font-semibold
                    text-gray-600
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={deleteConfirmText !== "DELETE"}
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
   NAV
========================================================= */

const Nav = ({
  icon,
  label,
  onClick,
  active,
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
          ? "bg-green-50 text-green-700 font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >

    <span
      className={`
        transition
        ${
          active
            ? "text-green-600"
            : "text-gray-400 group-hover:text-gray-700"
        }
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

const StatCard = ({
  label,
  value,
  type,
  icon,
}) => {

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

  const style = styles[type];

  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="
        relative
        overflow-hidden
        bg-white
        border
        border-gray-100
        rounded-3xl
        p-5
        shadow-[0_4px_24px_rgba(0,0,0,0.025)]
      "
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-semibold text-gray-400">
            {label}
          </p>

          <p
            className={`
              text-3xl
              font-extrabold
              tracking-tight
              mt-3
              ${style.number}
            `}
          >
            {value}
          </p>

        </div>

        <div
          className={`
            w-10
            h-10
            rounded-xl
            flex
            items-center
            justify-center
            ${style.icon}
          `}
        >
          {icon}
        </div>

      </div>

      <div
        className={`
          mt-5
          h-1
          w-10
          rounded-full
          ${style.line}
        `}
      />

    </motion.div>
  );
};

/* =========================================================
   SKELETON ROW
========================================================= */

const SkeletonRow = () => (
  <tr className="border-b border-gray-50 animate-pulse">

    <td className="px-6 py-4">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-xl bg-gray-100" />

        <div className="space-y-2">
          <div className="h-3 w-32 bg-gray-100 rounded" />
          <div className="h-2 w-20 bg-gray-100 rounded" />
        </div>

      </div>

    </td>

    <td className="px-6 py-4">
      <div className="h-3 w-20 bg-gray-100 rounded" />
    </td>

    <td className="px-6 py-4">
      <div className="h-6 w-12 bg-gray-100 rounded-lg mx-auto" />
    </td>

    <td className="px-6 py-4">
      <div className="h-6 w-16 bg-gray-100 rounded-full mx-auto" />
    </td>

    <td className="px-6 py-4">
      <div className="flex justify-end gap-2">
        <div className="w-9 h-9 bg-gray-100 rounded-xl" />
        <div className="w-9 h-9 bg-gray-100 rounded-xl" />
        <div className="w-9 h-9 bg-gray-100 rounded-xl" />
      </div>
    </td>

  </tr>
);

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({ search }) => (
  <tr>

    <td
      colSpan="5"
      className="px-6 py-16 text-center"
    >

      <div className="
        w-14
        h-14
        rounded-2xl
        bg-gray-50
        flex
        items-center
        justify-center
        mx-auto
        mb-4
      ">

        {search ? (
          <Search
            size={22}
            className="text-gray-300"
          />
        ) : (
          <GraduationCap
            size={22}
            className="text-gray-300"
          />
        )}

      </div>

      <p className="font-semibold text-gray-700">
        {search
          ? "No students found"
          : "No students yet"}
      </p>

      <p className="text-xs text-gray-400 mt-1">
        {search
          ? "Try searching with another name, ID, or grade."
          : "Add a student to start building your directory."}
      </p>

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
}) => {

  const styles = {
    green: {
      icon: "bg-green-50 text-green-600",
      badge: "bg-green-50 text-green-700",
    },

    amber: {
      icon: "bg-amber-50 text-amber-600",
      badge: "bg-amber-50 text-amber-700",
    },

    red: {
      icon: "bg-red-50 text-red-600",
      badge: "bg-red-50 text-red-700",
    },
  };

  const style = styles[color];

  return (
    <div className="mb-6 last:mb-0">

      <div className="flex items-center justify-between mb-3">

        <div className="flex items-center gap-2">

          <div
            className={`
              w-8
              h-8
              rounded-lg
              flex
              items-center
              justify-center
              ${style.icon}
            `}
          >
            {icon}
          </div>

          <h3 className="text-sm font-bold text-gray-800">
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
            ${style.badge}
          `}
        >
          {count}
        </span>

      </div>

      <div className="space-y-2">
        {children}
      </div>

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
}) => {

  const styles = {
    green: "bg-green-50/50 border-green-100",
    amber: "bg-amber-50/50 border-amber-100",
    red: "bg-red-50/50 border-red-100",
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

        <p className="text-sm font-semibold text-gray-800 truncate">
          {title}
        </p>

        <p className="text-[11px] text-gray-400 mt-0.5">
          {subtitle}
        </p>

      </div>

    </div>
  );
};

/* =========================================================
   EMPTY IMPORT
========================================================= */

const EmptyImport = ({ text }) => (
  <div className="
    p-4
    rounded-xl
    bg-gray-50
    border
    border-gray-100
    text-xs
    text-gray-400
  ">
    {text}
  </div>
);

export default StudentPage;

