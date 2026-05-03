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
  Gavel
} from "lucide-react";

import { useAuthStore, API } from "../store/authStore";
import StudentModal from "../components/StudentModal";
import RiskBadge from "../components/RiskBadge";
import ViewProfileModal from "../components/ViewProfileModal";

const socket = io("http://localhost:5000");

const ITEMS_PER_PAGE = 5;

const StudentPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ NEW (bulk import)
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  // FETCH
  const fetchStudents = async () => {
    const res = await API.get("/api/students");
    setStudents(res.data);
  };

  // BULK IMPORT HANDLER
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImporting(true);

      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        toast.error("JSON must be an array of students");
        return;
      }

      const validStudents = data.filter(
        (s) => s.firstName && s.lastName && s.grade
      );

      if (validStudents.length === 0) {
        toast.error("No valid student data found");
        return;
      }

      await API.post("/api/students/bulk", validStudents);

      toast.success(`Imported ${validStudents.length} students`);
      fetchStudents();

    } catch (err) {
      console.error(err);
      toast.error("Invalid JSON file");
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  // REAL-TIME SOCKET
  useEffect(() => {
    if (!user) return;

    fetchStudents();

    socket.on("student-created", () => {
      toast.success("New student added");
      fetchStudents();
    });

    socket.on("student-updated", () => {
      toast.success("Student updated");
      fetchStudents();
    });

    socket.on("student-deleted", () => {
      toast.error("Student removed");
      fetchStudents();
    });

    return () => {
      socket.off("student-created");
      socket.off("student-updated");
      socket.off("student-deleted");
    };
  }, [user]);

  // FILTER
  const filteredStudents = students.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const paginated = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => setCurrentPage(1), [search]);

  // ANALYTICS
  const total = students.length;
  const high = students.filter(s => s.riskLevel === "High").length;
  const med = students.filter(s => s.riskLevel === "Medium").length;
  const low = students.filter(s => s.riskLevel === "Low").length;

  const confirmDelete = async () => {
    await API.delete(`/api/students/${deleteTarget._id}`);
    toast.success("Deleted");
    setDeleteTarget(null);
    fetchStudents();
  };

  // NAV ITEM
  const Nav = ({ icon, label, onClick, active }) => (
    <button
      onClick={onClick}
      className={`flex gap-3 items-center px-4 py-3 rounded-xl transition ${
        active ? "bg-green-500 text-white" : "hover:bg-white/10 text-gray-300"
      }`}
    >
      {icon} {label}
    </button>
  );

  // ANALYTICS CARD
  const Stat = ({ title, value, color }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/5 border border-white/10 p-4 rounded-xl"
    >
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
    </motion.div>
  );

  // RISK PULSE INDICATOR
  const RiskPulse = ({ level }) => {
    const color =
      level === "High"
        ? "bg-red-500"
        : level === "Medium"
        ? "bg-yellow-400"
        : "bg-green-400";

    const animate =
      level === "High"
        ? "animate-ping"
        : "animate-pulse";

    return (
      <div className="flex items-center gap-2 justify-center">
        <span className={`relative flex h-3 w-3`}>
          <span className={`absolute inline-flex h-full w-full rounded-full ${color} ${animate} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
        </span>
        <RiskBadge level={level} />
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-72 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-400">EduGuard</h1>

          <p className="text-xs text-gray-400 mb-6">
            Our Lady of the Holy Rosary - General Trias Cavite
          </p>

          <Nav icon={<LayoutDashboard />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <Nav icon={<Users />} label="Students" active />
          <Nav icon={<ShieldX />} label="Guidance" onClick={() => navigate("/guidance")} />
          <Nav icon={<ChartNoAxesCombined />} label="Reports" onClick={() => navigate("/reports")} />
          <Nav icon={<Gavel />} label="Interventions" onClick={() => navigate("/interventions")} />
          <Nav icon={<Settings />} label="Settings" onClick={() => navigate("/settings")} />
        </div>

        <button onClick={logout} className="bg-green-500 py-2 rounded-xl">
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">

        <div>
          <h2 className="text-3xl font-bold">Student Analytics (Live)</h2>
          <p className="text-gray-400 text-sm">Real-time discipline monitoring system</p>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat title="Total Students" value={total} color="text-white" />
          <Stat title="High Risk" value={high} color="text-red-400" />
          <Stat title="Medium Risk" value={med} color="text-yellow-400" />
          <Stat title="Low Risk" value={low} color="text-green-400" />
        </div>

        {/* SEARCH + ADD + IMPORT (UNCHANGED UI STYLE) */}
        <div className="flex justify-between gap-4">
          <input
            placeholder="Search student..."
            className="bg-white/10 px-4 py-2 rounded-xl w-full sm:w-1/3 outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-2">
            {/* HIDDEN INPUT */}
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-blue-500 px-4 py-2 rounded-xl"
              disabled={importing}
            >
              {importing ? "Importing..." : "Import JSON"}
            </button>

            <button
              onClick={() => {
                setSelectedStudent(null);
                setIsEditing(false);
                setShowModal(true);
              }}
              className="bg-green-500 px-4 py-2 rounded-xl"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-center">Grade</th>
                <th className="p-3 text-center">Risk</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((s, i) => (
                <motion.tr
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-3">{s.firstName} {s.lastName}</td>
                  <td className="p-3 text-center">{s.grade}</td>

                  <td className="p-3 text-center">
                    <RiskPulse level={s.riskLevel} />
                  </td>

                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedStudent(s); setShowProfile(true); }} className="p-2 bg-white/10 rounded-lg">
                        <Eye size={16} />
                      </button>

                      <button onClick={() => { setSelectedStudent(s); setIsEditing(true); setShowModal(true); }} className="p-2 bg-white/10 rounded-lg">
                        <Pencil size={16} />
                      </button>

                      <button onClick={() => setDeleteTarget(s)} className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between text-gray-400 text-sm">
          <span>Page {currentPage} / {totalPages}</span>

          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <button onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>

      </main>

      {/* MODALS */}
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

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-xl">
            <p>Delete {deleteTarget.firstName}?</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button onClick={confirmDelete} className="text-red-400">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentPage;