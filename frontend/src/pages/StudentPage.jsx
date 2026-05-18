import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
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
  Gavel,
} from "lucide-react";

import { useAuthStore, API } from "../store/authStore";
import StudentModal from "../components/StudentModal";
import RiskBadge from "../components/RiskBadge";
import ViewProfileModal from "../components/ViewProfileModal";

const socket = io("http://localhost:5000");

const StudentPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);

  const fileRef = useRef(null);

  const PER_PAGE = 8;

  /* ================= FETCH ================= */
  const fetchStudents = async () => {
    const res = await API.get("/api/students");
    setStudents(res.data || []);
  };

  /* ================= SOCKET ================= */
  useEffect(() => {
    fetchStudents();

    socket.on("student-created", fetchStudents);
    socket.on("student-updated", fetchStudents);
    socket.on("student-deleted", fetchStudents);

    return () => {
      socket.off("student-created");
      socket.off("student-updated");
      socket.off("student-deleted");
    };
  }, []);

  /* ================= FILTER ================= */
  const filtered = students.filter((s) =>
    `${s.firstName} ${s.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const pages = Math.ceil(filtered.length / PER_PAGE);

  const paginated = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  useEffect(() => setPage(1), [search]);

  /* ================= STATS ================= */
  const stats = {
    total: students.length,
    high: students.filter((s) => s.riskLevel === "High").length,
    med: students.filter((s) => s.riskLevel === "Medium").length,
    low: students.filter((s) => s.riskLevel === "Low").length,
  };

  const handleImport = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setImporting(true);

    const data = JSON.parse(await file.text());

    const res = await API.post("/api/students/bulk", data);

    toast.success(
      `Import completed: ${res.data.count} students processed`
    );

    // IMPORTANT: refresh to reflect updated + new students
    fetchStudents();

    socket.emit("students-imported"); // optional realtime trigger
  } catch (err) {
    console.error(err);
    toast.error("Invalid JSON or import failed");
  } finally {
    setImporting(false);
  }
};

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    await API.delete(`/api/students/${deleteTarget._id}`);
    toast.success("Deleted");

    setDeleteTarget(null);
    fetchStudents();
  };

  /* ================= NAV ================= */
  const Nav = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition ${
      active
        ? "bg-green-50 text-green-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

  /* ================= ACTION ================= */
  const Action = ({ icon, danger, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-2 rounded-xl border transition ${
        danger
          ? "text-red-500 hover:bg-red-50 border-red-100"
          : "hover:bg-white/70 text-gray-600 border-white/30"
      }`}
    >
      {icon}
    </motion.button>
  );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 text-gray-900 flex overflow-hidden">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold text-green-600">
            GuidEd
          </h1>

          <p className="text-xs text-gray-500 mb-6">
            School Management System
          </p>

          <div className="space-y-2">

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
              icon={<Gavel size={18} />}
              label="Cases"
              onClick={() => navigate("/cases")}
            />

            <Nav icon={<Gavel size={18} />} label="Interventions" onClick={() => navigate("/interventions")} />

            <Nav
              icon={<Settings size={18} />}
              label="Settings"
              onClick={() => navigate("/settings")}
            />

          </div>
        </div>

        <button
          onClick={logout}
          className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
        >
          Logout
        </button>

      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 overflow-y-auto p-10 space-y-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >

          <div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Students
            </h2>

            <p className="text-gray-500 mt-1">
              Manage student records, risk monitoring, and behavioral insights
            </p>
          </div>

          <div className="flex gap-3">

            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => fileRef.current.click()}
              className="px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-sm"
            >
              <Upload size={16} className="inline mr-2" />
              {importing ? "Importing..." : "Import"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setShowModal(true);
                setIsEditing(false);
                setSelectedStudent(null);
              }}
              className="px-5 py-2 rounded-2xl bg-green-600 text-white shadow-lg shadow-green-200"
            >
              <Plus size={16} className="inline mr-2" />
              Add Student
            </motion.button>

          </div>

        </motion.div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <Stat
            label="Total Students"
            value={stats.total}
          />

          <Stat
            label="High Risk"
            value={stats.high}
            color="text-red-500"
          />

          <Stat
            label="Medium Risk"
            value={stats.med}
            color="text-yellow-500"
          />

          <Stat
            label="Low Risk"
            value={stats.low}
            color="text-green-600"
          />

        </div>

        {/* ================= SEARCH ================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-2xl border border-white/30 rounded-3xl p-5 shadow-sm"
        >

          <div className="flex items-center bg-white/70 border border-white/40 px-4 py-3 rounded-2xl">

            <Search size={18} className="text-gray-400" />

            <input
              className="ml-3 w-full outline-none bg-transparent text-sm"
              placeholder="Search students..."
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </motion.div>

        {/* ================= TABLE ================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/55 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden shadow-sm"
        >

          <table className="w-full text-sm">

            <thead className="bg-white/40 backdrop-blur text-gray-500 uppercase text-xs">
              <tr>
                <th className="p-5 text-left">Student</th>
                <th className="p-5 text-center">Grade</th>
                <th className="p-5 text-center">Risk</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((s, index) => (
                <motion.tr
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-t border-white/20 hover:bg-white/30 transition"
                >

                  <td className="p-5">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center">
                        <Users size={18} className="text-green-700" />
                      </div>

                      <div>
                        <p className="font-semibold">
                          {s.firstName} {s.lastName}
                        </p>

                        <p className="text-xs text-gray-500">
                          Student Profile
                        </p>
                      </div>

                    </div>

                  </td>

                  <td className="p-5 text-center text-gray-600">
                    {s.grade}
                  </td>

                  <td className="p-5 text-center">
                    <RiskBadge level={s.riskLevel} />
                  </td>

                  <td className="p-5">

                    <div className="flex justify-end gap-2">

                      <Action
                        icon={<Eye size={16} />}
                        onClick={() => {
                          setSelectedStudent(s);
                          setShowProfile(true);
                        }}
                      />

                      <Action
                        icon={<Pencil size={16} />}
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsEditing(true);
                          setShowModal(true);
                        }}
                      />

                      <Action
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={() => setDeleteTarget(s)}
                      />

                    </div>

                  </td>

                </motion.tr>
              ))}
            </tbody>

          </table>

        </motion.div>

        {/* ================= PAGINATION ================= */}
        <div className="flex justify-between items-center text-sm text-gray-500">

          <p>
            Showing page {page} of {pages}
          </p>

          <div className="flex gap-3">

            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur border border-white/30"
            >
              Prev
            </button>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, pages))}
              className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur border border-white/30"
            >
              Next
            </button>

          </div>

        </div>

      </main>

      {/* ================= MODALS ================= */}
      {showModal && (
        <StudentModal
          close={() => setShowModal(false)}
          refresh={fetchStudents}
          student={selectedStudent}
          isEditing={isEditing}
          students={students}
        />
      )}

      {showProfile && (
        <ViewProfileModal
          student={selectedStudent}
          close={() => setShowProfile(false)}
        />
      )}

      {/* ================= DELETE MODAL ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/80 backdrop-blur-2xl border border-white/30 rounded-3xl p-7 w-[380px] shadow-2xl"
          >

            <h2 className="text-xl font-bold">
              Delete Student
            </h2>

            <p className="text-gray-500 mt-2 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {deleteTarget.firstName}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>

            </div>

          </motion.div>

        </div>
      )}

    </div>
  );
};

/* ================= STAT ================= */

const Stat = ({ label, value, color = "text-gray-900" }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="bg-white/55 backdrop-blur-2xl border border-white/30 rounded-3xl p-6 shadow-sm"
  >

    <p className="text-sm text-gray-500">
      {label}
    </p>

    <h2 className={`text-4xl font-bold mt-2 ${color}`}>
      {value}
    </h2>

  </motion.div>
);

export default StudentPage;