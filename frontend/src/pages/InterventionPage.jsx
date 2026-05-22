
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api";
import { exportInterventionPDF } from "../utils/exportInterventionPDF";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Gavel,
  Search,
  X,
  Bell,
  Sparkles,
  Brain,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";

const InterventionPage = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const [cases, setCases] = useState([]);
  const [interventions, setInterventions] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [openTimeline, setOpenTimeline] = useState(null);

  const [form, setForm] = useState({
    type: "warning",
    description: "",
  });

  const loggedInUser =
    JSON.parse(localStorage.getItem("user"))?.name || "Unknown User";


  const options = [
    "warning",
    "call a parent",
    "community service",
    "suspension",
  ];

  const addAuditLog = (action) => {
  const entry = {
    id: Date.now(),
    action,
    time: new Date().toISOString(),
  };

  setAuditLog((prev) => [entry, ...prev]);
};

  /* =========================================================
     FETCH
  ========================================================= */
  const fetchData = async () => {
    try {
      const [incidentRes, interventionRes] = await Promise.all([
        API.get("/api/incidents"),
        API.get("/api/interventions"),
      ]);

      const incidentsData = incidentRes.data || [];

const reports = incidentsData.map((i) => {
  const student = i.studentId || {};

  return {
    _id: i._id,

    studentId: student._id, // IMPORTANT

    studentName:
      `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
      "Unknown",

    grade: student.grade || "N/A",   // ✅ use grade (not section)

    gender: student.gender || "N/A",

    studentCode: student.studentId || "N/A", // STU-2008

    age: student.birthDate
      ? new Date().getFullYear() -
        new Date(student.birthDate).getFullYear()
      : "N/A",

    offense: i.title || "No title",
    status: i.status,
  };
});

      setCases(reports);
      setInterventions(interventionRes.data || []);

      setNotifications(
        reports.slice(0, 10).map((r) => ({
          id: r._id,
          title: "Case Requires Intervention",
          text: r.offense,
          student: r.studentName,
          time: new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */
  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getStudentInterventions = (studentId) =>
    interventions.filter(
      (i) =>
        String(i.studentId?._id || i.studentId) ===
        String(studentId)
    );

  const getReportStatus = (studentId) => {
    const list = getStudentInterventions(studentId);

    if (list.length === 0) return "none";

    const allCompleted = list.every(
      (i) => i.status === "completed"
    );

    if (allCompleted) return "completed";

    return "ongoing";
  };

  const recommendAction = (offense) => {
    const o = (offense || "").toLowerCase();

    if (o.includes("fighting")) return "Suspension";
    if (o.includes("bullying")) return "Call a Parent";
    if (o.includes("cheating")) return "Warning";

    return "Behavior Monitoring";
  };

  /* =========================================================
     SUBMIT
  ========================================================= */
  const submit = async () => {
    try {
      if (!selected) return;

      await API.post("/api/interventions", {
  studentId: selected.studentId,
  type: form.type,
  description: form.description,
  status: "active",

  interventionBy: loggedInUser,
  approvedBy: loggedInUser,
});

      addAuditLog(`Created intervention: ${form.type}`);


      await fetchData();

      setForm({
        type: "warning",
        description: "",
      });

      setOpen(false);
      setSelected(null);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const markComplete = async (id) => {
    try {
      await API.put(
  `/api/interventions/${id}/resolve`,
  {
    completedBy: loggedInUser,
  }
);
      await fetchData();
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */
  const filtered = useMemo(() => {
  return cases.filter((c) => {
    // ✅ IMPORTANT: only intervention-ready from incident system
    if (c.status !== "intervention-ready") return false;

    // tab filtering (UI preserved)
    const status = getReportStatus(c.studentId);

    if (tab !== "all" && tab !== status) return false;

    // search
    if (
      search &&
      !c.studentName.toLowerCase().includes(search.toLowerCase()) &&
      !c.offense.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
}, [cases, tab, search, interventions]);

  const stats = {
    total: cases.length,
    ongoing: cases.filter(
      (c) => getReportStatus(c.studentId) === "ongoing"
    ).length,
    completed: cases.filter(
      (c) => getReportStatus(c.studentId) === "completed"
    ).length,
    pending: cases.filter(
      (c) => getReportStatus(c.studentId) === "none"
    ).length,
  };

  const Meta = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
    <p className="text-gray-400 mb-1">{label}</p>
    <p className="font-medium text-gray-700">
      {value || "N/A"}
    </p>
  </div>
);

  return (
    <div className="h-screen w-screen flex bg-[#F4F7FB] text-gray-900 overflow-hidden">

      {/* =========================================================
         SIDEBAR
      ========================================================= */}
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">

        <div>

          <div className="mb-10">
            <h1 className="text-2xl font-bold text-green-600">
              GuidEd
            </h1>

            <p className="text-xs text-gray-500 mt-1">
              Case & Intervention System
            </p>
          </div>

          <div className="space-y-2">

            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() => navigate("/dashboard")}
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              onClick={() => navigate("/students")}
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

            <Nav
              icon={<Gavel size={18} />}
              label="Intervention"
              active
            />

            <Nav
              icon={<Settings size={18} />}
              label="Settings"
              onClick={() => navigate("/settings")}
            />

          </div>

        </div>

        <button
          className="
            w-full bg-green-600 text-white
            py-3 rounded-2xl
            hover:bg-green-700 transition
            font-medium
          "
        >
          Logout
        </button>

      </aside>

      {/* =========================================================
         MAIN
      ========================================================= */}
      <main className="flex-1 overflow-y-auto">

        {/* =========================================================
           HEADER
        ========================================================= */}
        <div
          className="
            sticky top-0 z-30
            px-8 py-6
            border-b border-white/20
            bg-white/50 backdrop-blur-2xl
          "
        >

          <div className="flex justify-between items-start">

            <div>

              <h2 className="text-4xl font-black tracking-tight">
                Intervention Management
              </h2>

              <p className="text-gray-500 mt-2">
                Manage student cases, interventions,
                sanctions, and rehabilitation workflows
              </p>

            </div>

            {/* NOTIFICATIONS */}
            <div className="relative">

              <button
                onClick={() =>
                  setOpenNotif(!openNotif)
                }
                className="
                  w-12 h-12 rounded-2xl
                  bg-white/60 backdrop-blur-xl
                  border border-white/30
                  shadow-sm
                  flex items-center justify-center
                  hover:scale-105 transition
                "
              >
                <Bell size={18} />
              </button>

              {notifications.length > 0 && (
                <span
                  className="
                    absolute -top-1 -right-1
                    min-w-[20px] h-5
                    px-1 rounded-full
                    bg-red-500 text-white
                    text-[11px] font-bold
                    flex items-center justify-center
                  "
                >
                  {notifications.length}
                </span>
              )}

              <AnimatePresence>
                {openNotif && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95,
                    }}
                    className="
                      absolute right-0 mt-4 w-96
                      bg-white/70 backdrop-blur-2xl
                      border border-white/30
                      rounded-3xl overflow-hidden
                      shadow-2xl z-50
                    "
                  >

                    <div className="p-5 border-b border-white/20 flex justify-between items-center">

                      <div>
                        <h3 className="font-bold text-gray-900">
                          Notifications
                        </h3>

                        <p className="text-xs text-gray-500">
                          Intervention updates
                        </p>
                      </div>

                      <Sparkles
                        size={16}
                        className="text-green-600"
                      />

                    </div>

                    <div className="max-h-[400px] overflow-y-auto">

                      {notifications.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <motion.div
                            key={n.id}
                            whileHover={{ x: 4 }}
                            className="
                              p-5 border-b border-white/20
                              hover:bg-white/30 transition
                            "
                          >

                            <p className="font-semibold text-sm text-gray-900">
                              {n.title}
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                              {n.text}
                            </p>

                            <div className="flex justify-between mt-3">

                              <span className="text-xs text-green-700 font-medium">
                                {n.student}
                              </span>

                              <span className="text-xs text-gray-400">
                                {new Date(
                                  n.time
                                ).toLocaleTimeString()}
                              </span>

                            </div>

                          </motion.div>
                        ))
                      )}

                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>

        {/* =========================================================
           CONTENT
        ========================================================= */}
        <div className="p-8">

          {/* =========================================================
             STATS
          ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

            <StatCard
              icon={<FileText size={18} />}
              label="Total Cases"
              value={stats.total}
            />

            <StatCard
              icon={<Activity size={18} />}
              label="Ongoing"
              value={stats.ongoing}
              color="text-yellow-500"
            />

            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Completed"
              value={stats.completed}
              color="text-green-600"
            />

            <StatCard
              icon={<Brain size={18} />}
              label="Pending"
              value={stats.pending}
              color="text-blue-500"
            />

          </div>

          {/* =========================================================
             SEARCH + FILTERS
          ========================================================= */}
          <div
            className="
              bg-white/45 backdrop-blur-2xl
              border border-white/30
              rounded-[2rem]
              p-6 shadow-sm mb-8
            "
          >

            {/* SEARCH */}
            <div
              className="
                flex items-center gap-3
                px-5 py-4 rounded-2xl
                bg-white/60 backdrop-blur-xl
                border border-white/30
                max-w-xl mb-6
              "
            >

              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                className="
                  bg-transparent outline-none
                  w-full text-sm
                "
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search student or offense..."
              />

            </div>

            {/* TABS */}
            <div className="flex flex-wrap gap-3">

              {[
                "all",
                "none",
                "ongoing",
                "completed",
              ].map((t) => (
                <Tab
                  key={t}
                  label={t.toUpperCase()}
                  active={tab === t}
                  onClick={() => setTab(t)}
                />
              ))}

            </div>

          </div>

          {/* =========================================================
             CASES GRID
          ========================================================= */}
          <motion.div
            layout
            className="
              bg-white/45 backdrop-blur-2xl
              border border-white/30
              rounded-[2rem]
              p-7 shadow-sm min-h-[500px]
            "
          >

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

              {filtered.map((c) => {
                const status = getReportStatus(
                  c.studentId
                );

                return (
                  <motion.div
                    key={c._id}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      setSelected(c);
                      setOpen(true);
                    }}
                    className="
                      bg-white/60 backdrop-blur-xl
                      border border-white/30
                      rounded-[2rem]
                      p-5 shadow-sm cursor-pointer
                      relative overflow-hidden
                    "
                  >

                    {/* STATUS */}
                    <div className="absolute top-4 right-4">

                      <span
                        className={`
                          px-3 py-1 rounded-full
                          text-[11px] font-semibold border
                          ${
                            status === "completed"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : status === "ongoing"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }
                        `}
                      >
                        {status.toUpperCase()}
                      </span>

                    </div>

                    {/* AVATAR */}
                    <div
                      className="
                        w-16 h-16 rounded-2xl
                        bg-green-100 text-green-700
                        flex items-center justify-center
                        font-black text-lg mb-5
                      "
                    >
                      {getInitials(c.studentName)}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900">
                      {c.studentName}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {c.section} • {c.studentCode} • {c.gender}
                    </p>

                    <div className="mt-5">

                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        Incident
                      </p>

                      <p className="text-sm text-gray-700 leading-relaxed">
                        {c.offense}
                      </p>

                    </div>

                    <div
                      className="
                        mt-5 rounded-2xl
                        bg-green-50 border border-green-100
                        p-4
                      "
                    >

                      <div className="flex items-center gap-2 mb-2">
                        <Brain
                          size={16}
                          className="text-green-700"
                        />

                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                          AI Recommendation
                        </p>
                      </div>

                      <p className="text-sm text-green-900 font-medium">
                        {recommendAction(c.offense)}
                      </p>

                    </div>

                  </motion.div>
                );
              })}

            </div>

          </motion.div>

        </div>

      </main>

    {/* =========================================================
   MODERN PROFESSIONAL LIGHT MODE MODAL (REFINED)
========================================================= */}
<AnimatePresence>
  {open && selected && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 18 }}
        transition={{ type: "spring", stiffness: 240, damping: 28 }}
        className="
          w-full max-w-6xl
          bg-[#F9FAFB]
          border border-gray-200
          rounded-[24px]
          shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]
          overflow-hidden
        "
      >

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200">

          <div className="flex items-center gap-5">

            <div className="
              w-14 h-14 rounded-2xl
              bg-green-50 border border-green-100
              flex items-center justify-center
              text-green-700 font-semibold text-lg
            ">
              {getInitials(selected.studentName)}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selected.studentName}
              </h2>

              <p className="text-sm text-gray-500">
                {selected.grade} • {selected.studentCode} • {selected.gender}
              </p>
            </div>

          </div>

          <button
            onClick={() => setOpen(false)}
            className="
              w-10 h-10 rounded-xl
              bg-gray-100 hover:bg-gray-200
              border border-gray-200
              flex items-center justify-center
              transition
            "
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="grid grid-cols-12 gap-8 px-8 py-8 max-h-[75vh] overflow-y-auto">

          {/* LEFT PANEL */}
          <div className="col-span-5 space-y-6">

            {/* INCIDENT */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                Incident Overview
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selected.offense}
              </p>
            </div>

            {/* AI RECOMMENDATION */}
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-xs uppercase tracking-wider text-green-600 mb-2">
                AI Recommendation
              </p>
              <p className="text-lg font-semibold text-green-800">
                {recommendAction(selected.offense)}
              </p>
              <p className="text-xs text-green-600/80 mt-2">
                Suggested based on behavioral analysis
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-400">Status</p>
                <p className="font-semibold text-gray-900 mt-1 capitalize">
                  {getReportStatus(selected.studentId)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-400">Interventions</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {getStudentInterventions(selected.studentId).length}
                </p>
              </div>

            </div>

            {/* AUDIT LOG */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">

              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Audit Log
              </h4>

              <div className="space-y-2 max-h-32 overflow-y-auto text-xs">

                {auditLog.length === 0 ? (
                  <p className="text-gray-400">No actions yet</p>
                ) : (
                  auditLog.map((a) => (
                    <div key={a.id} className="flex justify-between text-gray-600">
                      <span>{a.action}</span>
                      <span className="text-gray-400">
                        {new Date(a.time).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}

              </div>
            </div>

          </div>

          

          {/* RIGHT PANEL */}
          <div className="col-span-7 space-y-6">

            {/* TIMELINE HEADER */}
            <h3 className="text-sm font-semibold text-gray-700">
              Intervention Timeline
            </h3>

            {/* TIMELINE */}
            <div className="space-y-4">

              {getStudentInterventions(selected.studentId).map((i) => {
  const isOpen = openTimeline === i._id;

  return (
    <div
      key={i._id}
      className="border border-gray-200 bg-white rounded-2xl overflow-hidden"
    >
      {/* HEADER */}
      <div
        onClick={() =>
          setOpenTimeline(isOpen ? null : i._id)
        }
        className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />

          <div>
            <p className="font-medium capitalize">
              {i.type}
            </p>
            <p className="text-xs text-gray-500">
              {i.status}
            </p>
          </div>
        </div>

        <span className="text-xs text-gray-400">
          {isOpen ? "Hide" : "View"}
        </span>
      </div>

      {/* BODY (COLLAPSIBLE) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 space-y-4"
          >
            {/* DESCRIPTION */}
            <p className="text-sm text-gray-600">
              {i.description}
            </p>

            {/* META */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Meta label="Intervention By" value={i.interventionBy} />
              <Meta label="Approved By" value={i.approvedBy} />
              <Meta label="Created At" value={i.createdAt} />
              <Meta label="Completed By" value={i.completedBy} />
            </div>

            {/* AUDIT LOG */}
            {i.auditLogs?.length > 0 && (
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold">
                  Audit Trail
                </div>

                {i.auditLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 text-xs flex justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {log.action}
                      </p>
                      <p className="text-gray-500">
                        {log.note}
                      </p>
                    </div>

                    <div className="text-right">
                      <p>{log.by}</p>
                      <p className="text-gray-400">
                        {new Date(
                          log.createdAt ||
                          log.time ||
                          Date.now()
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACTION */}
            {i.status !== "completed" && (
              <button
                onClick={() => markComplete(i._id)}
                className="w-full bg-green-600 text-white py-2 rounded-xl text-sm"
              >
                Mark Complete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
})}

            </div>

            {/* FORM */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-white space-y-4">

              <h4 className="text-sm font-semibold text-gray-900">
                Create Intervention
              </h4>

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
              >
                {options.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>

              <textarea
                rows={4}
                placeholder="Write intervention plan..."
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none"
              />

            </div>

          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-between items-center px-8 py-5 border-t border-gray-200 bg-white">

          <button
            onClick={() =>
              exportInterventionPDF(selected, interventions)
            }
            className="
              px-5 py-2.5 rounded-xl
              border border-gray-200
              bg-white hover:bg-gray-50
              text-sm font-medium
            "
          >
            Export Report
          </button>

          <button
            onClick={submit}
            className="
              px-5 py-2.5 rounded-xl
              bg-green-600 hover:bg-green-700
              text-white text-sm font-medium
            "
          >
            Save Intervention
          </button>

        </div>

      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

/* =========================================================
   NAV
========================================================= */
const Nav = ({
  icon,
  label,
  onClick,
  active,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-full transition-all duration-200 ${
      active
        ? "bg-green-50 text-green-700 font-semibold shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}

    <span className="text-sm">
      {label}
    </span>
  </button>
);

/* =========================================================
   TAB
========================================================= */
const Tab = ({
  label,
  active,
  onClick,
}) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all border ${
      active
        ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100"
        : "bg-white/50 backdrop-blur-xl text-gray-600 border-white/30 hover:bg-white/70"
    }`}
  >
    {label}
  </motion.button>
);

/* =========================================================
   STAT CARD
========================================================= */
const StatCard = ({
  icon,
  label,
  value,
  color = "text-gray-900",
}) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="
      bg-white/45 backdrop-blur-2xl
      border border-white/30
      rounded-[2rem]
      p-6 shadow-sm
    "
  >

    <div
      className="
        w-12 h-12 rounded-2xl
        bg-green-100 text-green-700
        flex items-center justify-center mb-5
      "
    >
      {icon}
    </div>

    <p className="text-sm text-gray-500">
      {label}
    </p>

    <h2
      className={`text-3xl font-black mt-2 ${color}`}
    >
      {value}
    </h2>

  </motion.div>
);

export default InterventionPage;

