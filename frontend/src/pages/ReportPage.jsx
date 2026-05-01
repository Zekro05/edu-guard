import { useNavigate } from "react-router-dom";
import { useAuthStore, API } from "../store/authStore";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import MobileReport from "../components/tabs/MobileReport";
import IncidentReport from "../components/tabs/IncidentReport";
import ComplaintReport from "../components/tabs/ComplaintReport";
import Overview from "../components/tabs/Overview";
import AIPredictions from "../components/tabs/AIPredictions";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Search,
  Gavel
} from "lucide-react";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  transports: ["websocket"],
});

const ReportPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState("mobile");
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  /* ================= FETCH ================= */
  const fetchReports = useCallback(async (customSearch = search, customPage = page) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/reports?status=pending&page=${customPage}&limit=10&search=${customSearch}`
      );
      setReports(res.data.reports || []);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchReports();
  }, [page]);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchReports(search, 1);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  /* ================= SOCKET (NO FULL REFRESH = FAST) ================= */
  useEffect(() => {
    if (!user?._id) return;

    socket.connect();
    socket.emit("register", user._id);

    const handleNew = (data) => {
      setReports((prev) => [data.report, ...prev]);
    };

    const handleUpdate = (data) => {
      setReports((prev) =>
        prev.map((r) => (r._id === data._id ? data : r))
      );
    };

    socket.on("new-report", handleNew);
    socket.on("update-report", handleUpdate);

    return () => {
      socket.off("new-report", handleNew);
      socket.off("update-report", handleUpdate);
      socket.disconnect();
    };
  }, [user]);

  /* ================= ACTIONS ================= */
 const handleAccept = async (id) => {
  try {
    await API.put(`/api/reports/${id}/accept`);
    fetchReports(); // refresh list
  } catch (err) {
    console.log("Accept error:", err.response?.data || err.message);
  }
};

const handleReject = async (id) => {
  try {
    await API.put(`/api/reports/${id}/reject`);
    fetchReports();
  } catch (err) {
    console.log("Reject error:", err.response?.data || err.message);
  }
};

  /* ================= FILTERED LIST ================= */
  const filteredReports = useMemo(() => {
    return reports.filter((r) =>
      (r.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.offense || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [reports, search]);

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-72 h-full bg-white/5 backdrop-blur-md border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-400">EduGuard</h1>
          <p className="text-xs text-gray-400 mb-6">
            Our Lady of the Holy Rosary - General Trias Cavite
          </p>

          <Nav icon={<LayoutDashboard />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <Nav icon={<Users />} label="Students" onClick={() => navigate("/students")} />
          <Nav icon={<ShieldX />} label="Guidance" onClick={() => navigate("/guidance")} />
          <Nav icon={<ChartNoAxesCombined />} label="Reports" active />
          <Nav icon={<Gavel />} label="Interventions" onClick={() => navigate("/interventions")} />
          <Nav icon={<Settings />} label="Settings" onClick={() => navigate("/settings")} />
        </div>

        <button onClick={logout} className="bg-green-500 py-2 rounded-xl">
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">

        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold">Reports Management</h2>
          <p className="text-gray-400 text-sm">
            Review, approve, and analyze submitted reports
          </p>
        </div>

        {/* SEARCH */}
        <div className="flex items-center bg-white/10 px-4 py-2 rounded-xl w-full max-w-md">
          <Search size={16} />
          <input
            className="bg-transparent ml-2 outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or offense..."
          />
        </div>

        {/* TABS (RESTORED) */}
        <div className="flex flex-wrap gap-2">
          <Tab label="Mobile Pending" active={activeTab === "mobile"} onClick={() => setActiveTab("mobile")} />
          <Tab label="Incident" active={activeTab === "incident"} onClick={() => setActiveTab("incident")} />
          <Tab label="Complaint" active={activeTab === "complaint"} onClick={() => setActiveTab("complaint")} />
          <Tab label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <Tab label="AI Insights" active={activeTab === "ai"} onClick={() => setActiveTab("ai")} />
        </div>

        {/* CONTENT */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">

          {activeTab === "mobile" && (
            <>
              {loading ? (
                <p className="text-gray-400">Loading...</p>
              ) : filteredReports.length ? (
                <div className="grid gap-4">
                  {filteredReports.map((report) => (
                    <MobileReport
                      key={report._id}
                      report={report}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center">No reports found</p>
              )}
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

/* NAV */
const Nav = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex gap-3 items-center px-4 py-3 rounded-xl ${
      active ? "bg-green-500/20 text-green-400" : "hover:bg-white/10"
    }`}
  >
    {icon} {label}
  </button>
);

/* TAB */
const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm transition ${
      active
        ? "bg-green-500/20 text-green-400 border border-green-400/30"
        : "bg-white/5 text-gray-400 hover:bg-white/10"
    }`}
  >
    {label}
  </button>
);