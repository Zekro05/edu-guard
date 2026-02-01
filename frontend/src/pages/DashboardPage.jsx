import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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

    <button className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 shadow-inner flex items-center justify-center">
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

    <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
      Reports
    </button>

    <button className="px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed flex items-center justify-center">
      Settings
    </button>

  </div>
</div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6">

        {/* HEADER CARD */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            Dashboard Overview
          </h2>
          <p className="text-sm opacity-90 mt-1">
            Monitor incidents, behavioral trends, and AI-assisted insights.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Incidents"
            value="144"
            trend="-8% from last month"
            trendColor="text-green-600"
          />
          <StatCard
            title="High-Risk Students"
            value="12"
            trend="+3 from last month"
            trendColor="text-red-500"
          />
          <StatCard
            title="Resolved Cases"
            value="100"
            trend="+15% from last month"
            trendColor="text-orange-500"
          />
        </div>

        {/* LOWER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

          {/* INCIDENTS */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Recent Incidents</h3>

            <Incident
              name="Al Horford"
              description="Disruptive behavior in class"
              level="Low"
              color="bg-green-100 text-green-700"
            />

            <Incident
              name="Bronny James"
              description="Verbal altercation"
              level="Medium"
              color="bg-orange-100 text-orange-700"
            />
          </div>

          {/* AI INSIGHTS */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">AI Insights</h3>

            <Insight
              title="Behavioral Pattern Alert"
              description="Repeated tardiness detected in Grade 10-A"
              color="border-orange-400 bg-orange-50"
              badge="Medium"
            />

            <Insight
              title="Risk Escalation Detected"
              description="Escalation from minor to major offense"
              color="border-red-500 bg-red-50"
              badge="High"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

/* ===== COMPONENTS ===== */

const StatCard = ({ title, value, trend, trendColor }) => (
  <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
    <p className="text-sm text-gray-400">{title}</p>
    <h3 className="text-3xl font-bold my-2">{value}</h3>
    <p className={`text-sm ${trendColor}`}>{trend}</p>
  </div>
);

const Incident = ({ name, description, level, color }) => (
  <div className="border rounded-lg p-4 flex justify-between items-center mb-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
    <div>
      <p className="font-medium">{name}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <span className={`px-3 py-1 rounded text-xs font-semibold ${color}`}>
      {level}
    </span>
  </div>
);

const Insight = ({ title, description, color, badge }) => (
  <div className={`border-l-4 ${color} p-4 rounded mb-4 shadow-sm hover:shadow-md transition`}>
    <div className="flex justify-between items-center mb-1">
      <p className="font-medium text-sm">{title}</p>
      <span className="text-xs px-2 py-1 rounded bg-white font-semibold">
        {badge}
      </span>
    </div>
    <p className="text-xs text-gray-600">{description}</p>
  </div>
);
