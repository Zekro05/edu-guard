import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../store/authStore";
import { exportInterventionPDF } from "../utils/exportInterventionPDF";
import {
  LayoutDashboard, Users, ShieldX, ChartNoAxesCombined,
  Settings, Gavel, Search, X
} from "lucide-react";

/* ================= MAIN ================= */
const InterventionPage = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const [cases, setCases] = useState([]);
  const [interventions, setInterventions] = useState({});

  const [form, setForm] = useState({
    type: "warning",
    description: "",
    status: "pending",
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportRes, incidentRes] = await Promise.all([
        API.get("/api/reports"),
        API.get("/api/incidents"),
      ]);

      /* ================= REPORTS SAFE ================= */
      const reportsData = Array.isArray(reportRes.data?.reports)
        ? reportRes.data.reports
        : Array.isArray(reportRes.data)
        ? reportRes.data
        : [];

      const reports = reportsData.map((r) => ({
        _id: r._id,
        studentId: String(r.studentId),
        studentName: r.studentName || "Unknown",
        offense: r.offense || "",
      }));

      setCases(reports);

      /* ================= INCIDENTS SAFE ================= */
      const incidentsData = Array.isArray(incidentRes.data)
        ? incidentRes.data
        : [];

      const grouped = {};

      incidentsData.forEach((i) => {
        const key = String(i.studentId);

        if (!grouped[key]) grouped[key] = [];

        grouped[key].push({
          type: i.title || "Intervention",
          description: i.action || "",
          status: "completed",
        });
      });

      setInterventions(grouped);

    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
    }
  };

  /* ================= HELPERS ================= */
  const getInitials = (name = "") =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase();

  const getOffenseCount = (studentId) =>
    interventions[String(studentId)]?.length || 0;

  const getOffenderLevel = (studentId) => {
    const c = getOffenseCount(studentId);
    if (c >= 3) return "repeat-offender";
    if (c === 2) return "watchlist";
    if (c === 1) return "first-offense";
    return "clean";
  };

  const recommendAction = (offense, studentId) => {
    const o = (offense || "").toLowerCase();

    if (getOffenderLevel(studentId) === "repeat-offender") {
      return "SUSPENSION (AUTO ESCALATED)";
    }

    if (o.includes("fighting")) return "Suspension";
    if (o.includes("bullying")) return "Detention";
    if (o.includes("cheating")) return "Warning";

    return "Warning";
  };

  const getStatus = (studentId) => {
    const list = interventions[String(studentId)] || [];
    if (list.length === 0) return "none";
    if (list.some((i) => i.status === "active")) return "active";
    return "completed";
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const status = getStatus(c.studentId);

      if (
        tab !== "all" &&
        tab !== status &&
        !(tab === "none" && status === "none")
      ) return false;

      if (
        search &&
        !c.studentName.toLowerCase().includes(search.toLowerCase()) &&
        !c.offense.toLowerCase().includes(search.toLowerCase())
      ) return false;

      return true;
    });
  }, [cases, tab, search, interventions]);

  /* ================= FORM ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    try {
      const payload = {
        studentId: selected.studentId,
        title: form.type,
        action: form.description,
        level: "Low",
      };

      await API.post("/api/incidents", payload);

      await fetchData();

      setForm({ type: "warning", description: "", status: "pending" });
    } catch (err) {
      console.error("Submit error:", err.response?.data || err.message);
    }
  };

  /* ================= UI (UNCHANGED) ================= */
  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white">

      <aside className="w-72 bg-white/5 p-6 border-r border-white/10">
        <h1 className="text-2xl font-bold text-green-400">EduGuard</h1>

        <p className="text-xs text-gray-400 mb-6">
          Our Lady of the Holy Rosary - General Trias Cavite
        </p>

        <Nav icon={<LayoutDashboard />} label="Dashboard" onClick={() => navigate("/dashboard")} />
        <Nav icon={<Users />} label="Students" onClick={() => navigate("/students")} />
        <Nav icon={<ShieldX />} label="Guidance" onClick={() => navigate("/guidance")} />
        <Nav icon={<ChartNoAxesCombined />} label="Reports" onClick={() => navigate("/reports")} />
        <Nav icon={<Gavel />} label="Interventions" />
        <Nav icon={<Settings />} label="Settings" onClick={() => navigate("/settings")} />
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Intervention System</h2>

          <div className="flex items-center bg-white/10 px-3 py-2 rounded-xl">
            <Search size={16} />
            <input
              className="bg-transparent ml-2 outline-none"
              placeholder="Search..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="Total Cases" value={cases.length} />
          <Stat
            label="Repeat Offenders"
            value={cases.filter(c => getOffenderLevel(c.studentId) === "repeat-offender").length}
          />
          <Stat
            label="Active Cases"
            value={cases.filter(c => getStatus(c.studentId) === "active").length}
          />
        </div>

        <div className="flex gap-3 mb-6">
          {["all", "none", "active", "completed"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl ${tab === t ? "bg-green-500" : "bg-white/10"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c._id}
              onClick={() => { setSelected(c); setOpen(true); }}
              className="bg-white/5 p-5 rounded-2xl hover:bg-white/10 cursor-pointer flex gap-4 items-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-lg">
                {getInitials(c.studentName)}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">{c.studentName}</h3>
                <p className="text-gray-400 text-sm">{c.offense}</p>

                <p className="text-xs text-green-400 mt-1">
                  AI Suggestion: {recommendAction(c.offense, c.studentId)}
                </p>

                <p className="text-[10px] text-gray-500">
                  Offenses: {getOffenseCount(c.studentId)} | {getOffenderLevel(c.studentId)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {open && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-900 w-[600px] p-6 rounded-2xl relative">

            <button onClick={() => setOpen(false)} className="absolute top-4 right-4">
              <X />
            </button>

            <h2 className="text-2xl font-bold text-green-400">
              {selected.studentName}
            </h2>

            <p className="text-gray-400">{selected.offense}</p>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Timeline</h3>

              <div className="border-l border-white/20 pl-4 space-y-2">
                {(interventions[selected.studentId] || []).map((i, idx) => (
                  <div key={idx}>
                    <p className="font-semibold">{i.type}</p>
                    <p className="text-xs text-gray-400">{i.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">

              <select name="type" onChange={handleChange} className="bg-white/10 p-2 rounded">
                <option>warning</option>
                <option>detention</option>
                <option>suspension</option>
              </select>

              <textarea
                name="description"
                onChange={handleChange}
                className="bg-white/10 p-2 rounded"
                placeholder="Description..."
              />

              <button onClick={submit} className="bg-green-500 py-2 rounded-xl">
                Add Intervention
              </button>

              <button
                onClick={() => exportInterventionPDF(selected, interventions)}
                className="bg-blue-500 py-2 rounded-xl"
              >
                Export PDF
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

/* ================= SMALL COMPONENTS ================= */
const Nav = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex gap-3 items-center px-4 py-3 hover:bg-white/10 rounded-xl">
    {icon} {label}
  </button>
);

const Stat = ({ label, value }) => (
  <div className="bg-white/5 p-4 rounded-xl">
    <p className="text-xs text-gray-400">{label}</p>
    <h3 className="text-2xl font-bold">{value}</h3>
  </div>
);

export default InterventionPage;