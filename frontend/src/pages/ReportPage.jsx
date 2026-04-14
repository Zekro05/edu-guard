import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import MobileReport from "../components/tabs/MobileReport";
import IncidentReport from "../components/tabs/IncidentReport";
import ComplaintReport from "../components/tabs/ComplaintReport";
import Overview from "../components/tabs/Overview";
import AIPredictions from "../components/tabs/AIPredictions";
import {
  ChartNoAxesCombined,
  LayoutDashboard,
  Settings,
  ShieldX,
  Users,
} from "lucide-react";

const socket = io("http://localhost:5000");

const ReportPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState("mobile");

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // ===== FETCH REPORTS (STABLE) =====
  const fetchReports = async (customSearch = search, customPage = page) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/reports?status=pending&page=${customPage}&limit=5&search=${customSearch}`
      );
      setReports(res.data.reports);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  // fetch only when page changes
  useEffect(() => {
    fetchReports();
  }, [page]);

  // debounce search (prevents UI reset spam)
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchReports(search, 1);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  // socket (stable)
  useEffect(() => {
    const handler = () => fetchReports();

    socket.on("new-report", handler);
    socket.on("update-report", handler);

    return () => {
      socket.off("new-report", handler);
      socket.off("update-report", handler);
    };
  }, []);

  // ===== ACTIONS =====
  const handleAccept = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/reports/${id}/accept`
      );
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/reports/${id}/reject`
      );
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex flex-col">

      {/* TOP BAR */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">EduGuard</h1>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm hidden sm:block">
            <p className="font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs opacity-80">
              Our Lady of the Holy Rosary - General Trias Cavite
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-white text-green-700 px-4 py-2 rounded-md shadow hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN NAV */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-white rounded-2xl border flex flex-wrap justify-around items-center py-3 gap-3 shadow-sm">

          <button onClick={() => navigate("/dashboard")} className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg">
            <LayoutDashboard className="mr-2" /> Dashboard
          </button>

          <button onClick={() => navigate("/students")} className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg">
            <Users className="mr-2" /> Students
          </button>

          <button onClick={() => navigate("/guidance")} className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg">
            <ShieldX className="mr-2" /> Guidance
          </button>

          <button className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
            <ChartNoAxesCombined className="mr-2" /> Reports
          </button>

          <button onClick={() => navigate("/settings")} className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg">
            <Settings className="mr-2" /> Settings
          </button>
        </div>
      </div>

      {/* SUB NAV */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-white rounded-2xl border p-2 flex flex-wrap gap-2 shadow-sm">

          <SubTab label="Mobile Pending" active={activeTab === "mobile"} onClick={() => setActiveTab("mobile")} />
          <SubTab label="Incident Reports" active={activeTab === "incident"} onClick={() => setActiveTab("incident")} />
          <SubTab label="Complaint Reports" active={activeTab === "complaint"} onClick={() => setActiveTab("complaint")} />
          <SubTab label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SubTab label="AI Predictions" active={activeTab === "ai"} onClick={() => setActiveTab("ai")} />

        </div>
      </div>

      {/* CONTENT */}
      <main className="flex-1 px-4 sm:px-8 py-6">
        <div className="bg-white rounded-2xl border p-6 shadow-sm">

          {activeTab === "mobile" && (
            <>
              <input
                type="text"
                placeholder="Search student or offense..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded w-full mb-4"
              />

              {loading ? (
                <p>Loading...</p>
              ) : reports.length ? (
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <MobileReport
                      key={report._id}
                      report={report}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No reports found
                </p>
              )}

              {/* PAGINATION */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>

                <span>{page} / {totalPages}</span>

                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {activeTab === "incident" && <IncidentReport />}
          {activeTab === "complaint" && <ComplaintReport />}
          {activeTab === "overview" && <Overview />}
          {activeTab === "ai" && <AIPredictions />}

        </div>
      </main>
    </div>
  );
};

export default ReportPage;

// ===== SUB TAB =====
const SubTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
      active
        ? "bg-green-100 text-green-700 shadow-inner"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);