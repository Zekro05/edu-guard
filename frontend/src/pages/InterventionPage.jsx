import { useState, useMemo, useEffect, useRef } from "react";
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
  const [interventions, setInterventions] = useState([]);

  const [form, setForm] = useState({
    type: "warning",
    description: "",
  });

  /* ================= CUSTOM DROPDOWN ================= */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = ["warning", "detention", "suspension"];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    try {
      const [reportRes, incidentRes, interventionRes] = await Promise.all([
        API.get("/api/reports"),
        API.get("/api/incidents"),
        API.get("/api/interventions"),
      ]);

      const reportsData = Array.isArray(reportRes.data?.reports)
        ? reportRes.data.reports
        : Array.isArray(reportRes.data)
        ? reportRes.data
        : [];

      const reports = reportsData.map((r) => ({
        _id: r._id,

        studentId: String(r.studentId?._id || r.studentId),

        studentName: r.studentId?.name || r.studentName || "Unknown",
        section: r.studentId?.section || "N/A",
        age: r.studentId?.age || "N/A",
        gender: r.studentId?.gender || "N/A",

        offense: r.offense || "",
      }));

      setCases(reports);

      setInterventions(Array.isArray(interventionRes.data) ? interventionRes.data : []);
    } catch (err) {
      console.error("FETCH ERROR:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= HELPERS ================= */
  const getInitials = (name = "") =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase();

  const getStudentInterventions = (studentId) =>
    interventions.filter(
      (i) => String(i.studentId?._id || i.studentId) === String(studentId)
    );

  const getOffenseCount = (studentId) =>
    getStudentInterventions(studentId).length;

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
    const list = getStudentInterventions(studentId);

    if (list.length === 0) return "none";

    const hasHigh = list.some((i) => i.type === "suspension");

    if (hasHigh || list.length >= 3) return "active";
    if (list.length >= 1) return "ongoing";

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
  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  /* ================= SUBMIT ================= */
  const submit = async () => {
    try {
      if (!selected) return;

      const payload = {
        studentId: selected.studentId,
        type: form.type,
        description: form.description,
      };

      await API.post("/api/interventions", payload);

      await fetchData();

      setForm({ type: "warning", description: "" });
      setOpen(false);
      setSelected(null);

    } catch (err) {
      console.error("SUBMIT ERROR:", err.response?.data || err.message);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white">

      {/* ================= SIDEBAR ================= */}
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

      {/* ================= MAIN ================= */}
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

        {/* ================= CARDS ================= */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="Total Cases" value={cases.length} />
          <Stat label="Repeat Offenders" value={cases.filter(c => getOffenderLevel(c.studentId) === "repeat-offender").length} />
          <Stat label="Active Cases" value={cases.filter(c => getStatus(c.studentId) === "active").length} />
        </div>

        {/* ================= FILTER ================= */}
        <div className="flex gap-3 mb-6">
          {["all", "none", "active", "ongoing", "completed"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl ${tab === t ? "bg-green-500" : "bg-white/10"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ================= LIST ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c._id}
              onClick={() => { setSelected(c); setOpen(true); }}
              className="bg-white/5 p-5 rounded-2xl hover:bg-white/10 cursor-pointer flex gap-4 items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-lg">
                {getInitials(c.studentName)}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">{c.studentName}</h3>

                {/* NEW INFO */}
                <p className="text-xs text-gray-400">
                  Section: {c.section} | Age: {c.age} | Gender: {c.gender}
                </p>

                <p className="text-gray-400 text-sm">{c.offense}</p>

                <p className="text-xs text-green-400 mt-1">
                  AI Suggestion: {recommendAction(c.offense, c.studentId)}
                </p>

                <p className="text-[10px] text-gray-500">
                  Status: {getStatus(c.studentId)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ================= MODAL ================= */}
      {open && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-900 w-[600px] p-6 rounded-2xl relative">

            <button onClick={() => setOpen(false)} className="absolute top-4 right-4">
              <X />
            </button>

            <h2 className="text-2xl font-bold text-green-400">
              {selected.studentName}
            </h2>

            <p className="text-xs text-gray-400">
              Section: {selected.section} | Age: {selected.age} | Gender: {selected.gender}
            </p>

            <p className="text-gray-400">{selected.offense}</p>

            <div className="mt-4 border-l border-white/20 pl-4 space-y-2">
              {getStudentInterventions(selected.studentId).map((i, idx) => (
                <div key={idx}>
                  <p className="font-semibold">{i.type}</p>
                  <p className="text-xs text-gray-400">{i.description}</p>
                </div>
              ))}
            </div>

            {/* ================= DROPDOWN ================= */}
            <div className="mt-4 flex flex-col gap-2">

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full bg-white/10 p-2 rounded text-left"
                >
                  {form.type}
                </button>

                {dropdownOpen && (
                  <div className="absolute w-full mt-1 bg-gray-800 border border-white/10 rounded z-50">
                    {options.map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          handleChange("type", opt);
                          setDropdownOpen(false);
                        }}
                        className="p-2 hover:bg-white/10 cursor-pointer"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                name="description"
                onChange={(e) => handleChange("description", e.target.value)}
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