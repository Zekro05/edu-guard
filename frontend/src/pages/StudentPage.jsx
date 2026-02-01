import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { useAuthStore, API } from "../store/authStore";
import StudentModal from "../components/StudentModal";
import RiskBadge from "../components/RiskBadge";
import ViewProfileModal from "../components/ViewProfileModal";

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
  const [hovered, setHovered] = useState(null);

  // Fetch students
  const fetchStudents = async () => {
    try {
      const res = await API.get("/api/students");
      setStudents(res.data);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    if (user) fetchStudents();
  }, [user]);

  // Pagination
  const filteredStudents = students.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  useEffect(() => setCurrentPage(1), [search]);

  // Delete student
  const confirmDelete = async () => {
    try {
      await API.delete(`/api/students/${deleteTarget._id}`);
      setDeleteTarget(null);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
      toast.error("Failed to delete student");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
      {/* ===== TOP BAR ===== */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">EduGuard</h1>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm hidden sm:block">
            <p className="font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs opacity-80">San Sebastian College Recoletos de Cavite</p>
          </div>
          <button
            onClick={logout}
            className="bg-white text-green-700 px-4 py-2 rounded-md shadow hover:bg-gray-100 hover:scale-105 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ===== NAV ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-white rounded-2xl border flex flex-wrap justify-around items-center py-3 gap-3 shadow-sm">
          <button
            className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
            onClick={() => navigate("/")}
          >
            Dashboard
          </button>

          <button className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 shadow-inner flex items-center justify-center">
            Students
          </button>

          <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
            Guidance
          </button>

          <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
            Reports
          </button>

          <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
            Settings
          </button>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <main className="px-4 sm:px-8 py-6 flex flex-col gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-md">
          <h2 className="text-3xl font-semibold">Student Discipline Profile</h2>
          <p className="text-sm opacity-90">
            View comprehensive student records and risk levels.
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <input
              placeholder="Search student..."
              className="border px-4 py-2 rounded-lg w-full sm:w-1/3 focus:ring-2 focus:ring-green-400 outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedStudent(null);
                setShowModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              + Add Student
            </button>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-green-100 text-green-800 uppercase text-xs">
                <tr>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-center py-3 px-4">Grade</th>
                  <th className="text-center py-3 px-4">Risk</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="py-3 px-4 text-center">{s.grade}</td>
                    <td className="py-3 px-4 text-center">
                      <RiskBadge level={s.riskLevel} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2 relative">
                        {/* VIEW */}
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setShowProfile(true);
                            setIsEditing(false);
                          }}
                          className="p-2 border rounded-md hover:bg-gray-100"
                        >
                          <Eye size={16} />
                        </button>

                        {/* EDIT */}
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsEditing(true);
                            setShowModal(true);
                          }}
                          className="p-2 border rounded-md hover:bg-gray-100"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-2 border border-red-400 text-red-600 rounded-md hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ADD/EDIT MODAL */}
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Student</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
