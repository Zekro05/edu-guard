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

import ReportTab from "../components/ReportTab";

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
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/students")}
            className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
          >
            Students
          </button>

          <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
            Guidance
          </button>

          {/* ===== ACTIVE REPORTS BUTTON ===== */}
          <button
            className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 shadow-inner flex items-center justify-center"
          >
            Reports
          </button>

          <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
            Settings
          </button>
        </div>
      </div>

      {/* ===== HEADER CARD ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm opacity-90 mt-1">
            Document student discipline incidents & Analyze patterns, and AI predictions
          </p>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="flex gap-2 bg-green-700 text-white rounded-2xl overflow-hidden shadow-md">
          <ReportTab icon="📱" label="Mobile Pending Report" active={activeTab === "mobile"} onClick={() => setActiveTab("mobile")} />
          <ReportTab icon="📝" label="Incident Report" active={activeTab === "incident"} onClick={() => setActiveTab("incident")} />
          <ReportTab icon="📋" label="Complaint Report" active={activeTab === "complaint"} onClick={() => setActiveTab("complaint")} />
          <ReportTab icon="📊" label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <ReportTab icon="🤖" label="AI Predictions" active={activeTab === "ai"} onClick={() => setActiveTab("ai")} />
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <main className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6">
        {activeTab === "mobile" && <MobileReport />}
        {activeTab === "incident" && <IncidentReport />}
        {activeTab === "complaint" && <ComplaintReport />}
        {activeTab === "overview" && <Overview />}
        {activeTab === "ai" && <AIPredictions />}
      </main>
    </div>
  );
};

export default ReportPage;
