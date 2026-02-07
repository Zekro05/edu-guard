// src/pages/ReportPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";

// Tab components
import MobileReport from "../components/tabs/MobileReport";
import IncidentReport from "../components/tabs/IncidentReport";
import ComplaintReport from "../components/tabs/ComplaintReport";
import Overview from "../components/tabs/Overview";
import AIPredictions from "../components/tabs/AIPredictions";
import { ChartNoAxesCombined, LayoutDashboard, Settings, ShieldX, Users } from "lucide-react";

const ReportPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("mobile");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex flex-col">

      {/* ===== TOP BAR ===== */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">EduGuard</h1>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm hidden sm:block">
            <p className="font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs opacity-80">
              San Sebastian College Recoletos de Cavite
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-white text-green-700 px-4 py-2 rounded-md shadow hover:bg-gray-100 hover:scale-105 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ===== MAIN NAV ===== */}
      <div className="mt-6 px-4 sm:px-8">
  <div className="bg-white rounded-2xl border flex flex-wrap justify-around items-center py-3 gap-3 shadow-sm">

    <button 
    onClick={() => navigate("/dashboard")}
    className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
      <LayoutDashboard className="mr-2" />Dashboard
    </button>

    <button
      onClick={() => navigate("/students")}
      className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
    >
      <Users className="mr-2"/>Students
    </button>

    <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
      <ShieldX className="mr-2" />Guidance
    </button>

    <button
    className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 shadow-inner flex items-center justify-center">
      <ChartNoAxesCombined className="mr-2"/> Reports
    </button>

    <button 
    onClick={() => navigate("/settings")}
    className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
     <Settings className="mr-2"/> Settings
    </button>

  </div>
</div>

      {/* ===== HEADER CARD ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            Reports & Analytics
          </h2>
          <p className="text-sm opacity-90 mt-1">
            Document student discipline incidents, analyze trends, and AI predictions.
          </p>
        </div>
      </div>

      {/* ===== SETTINGS-STYLE SUB NAV ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-white rounded-2xl border p-2 flex flex-wrap gap-2 shadow-sm">

          <SubTab
            label="Mobile Pending"
            active={activeTab === "mobile"}
            onClick={() => setActiveTab("mobile")}
          />

          <SubTab
            label="Incident Reports"
            active={activeTab === "incident"}
            onClick={() => setActiveTab("incident")}
          />

          <SubTab
            label="Complaint Reports"
            active={activeTab === "complaint"}
            onClick={() => setActiveTab("complaint")}
          />

          <SubTab
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />

          <SubTab
            label="AI Predictions"
            active={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />

        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <main className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6">
       <div className="bg-white rounded-2xl border p-6 shadow-sm flex-1">
        {activeTab === "mobile" && <MobileReport />}
        {activeTab === "incident" && <IncidentReport />}
        {activeTab === "complaint" && <ComplaintReport />}
        {activeTab === "overview" && <Overview />}
        {activeTab === "ai" && <AIPredictions />}
      </div>
      </main>

    </div>
  );a
};

export default ReportPage;

/* ===== SUB TAB COMPONENT ===== */
const SubTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition
      ${
        active
          ? "bg-green-100 text-green-700 shadow-inner"
          : "text-gray-600 hover:bg-gray-100"
      }`}
  >
    {label}
  </button>
);