
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../store/authStore";
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

  const [form, setForm] = useState({
    type: "warning",
    description: "",
  });

  const options = [
    "warning",
    "detention",
    "call a parent",
    "community service",
    "suspension",
  ];

  /* =========================================================
     FETCH
  ========================================================= */
  const fetchData = async () => {
    try {
      const [reportRes, interventionRes] = await Promise.all([
        API.get("/api/reports?limit=1000"),
        API.get("/api/interventions"),
      ]);

      const reportsData = reportRes.data?.reports || [];

      const reports = reportsData.map((r) => {
        const student = r.studentId || {};

        return {
          _id: r._id,
          studentId: String(student._id || r.studentId),
          studentName: student.name || r.studentName || "Unknown",
          section: student.section || "N/A",
          age: student.age || "N/A",
          gender: student.gender || "N/A",
          offense: r.offense || "",
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
      });

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
      await API.put(`/api/interventions/${id}/resolve`);
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
      const status = getReportStatus(c.studentId);

      if (tab !== "all" && tab !== status)
        return false;

      if (
        search &&
        !c.studentName
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        !c.offense
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;

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
                      {c.section} • {c.age} • {c.gender}
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
         MODAL
      ========================================================= */}
      <AnimatePresence>

        {open && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
              }}
              className="
                w-full max-w-3xl
                bg-white/80 backdrop-blur-2xl
                border border-white/30
                rounded-[2.5rem]
                shadow-2xl overflow-hidden
              "
            >

              {/* HEADER */}
              <div className="p-8 border-b border-white/20 flex justify-between items-start">

                <div className="flex items-center gap-5">

                  <div
                    className="
                      w-20 h-20 rounded-3xl
                      bg-green-100 text-green-700
                      flex items-center justify-center
                      font-black text-2xl
                    "
                  >
                    {getInitials(selected.studentName)}
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-gray-900">
                      {selected.studentName}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {selected.section} • {selected.age} • {selected.gender}
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="
                    w-11 h-11 rounded-2xl
                    bg-white/60 backdrop-blur-xl
                    border border-white/30
                    flex items-center justify-center
                    hover:scale-105 transition
                  "
                >
                  <X size={18} />
                </button>

              </div>

              {/* BODY */}
              <div className="p-8 max-h-[70vh] overflow-y-auto">

                {/* INCIDENT */}
                <div className="mb-6">

                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    Incident Case
                  </p>

                  <div className="bg-white/60 border border-white/30 rounded-3xl p-5">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selected.offense}
                    </p>
                  </div>

                </div>

                {/* INTERVENTIONS */}
                <div className="mb-6">

                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle
                      size={18}
                      className="text-yellow-500"
                    />

                    <h3 className="font-bold text-lg">
                      Intervention History
                    </h3>
                  </div>

                  <div className="space-y-4">

                    {getStudentInterventions(
                      selected.studentId
                    ).length === 0 ? (
                      <div className="bg-white/60 border border-white/30 rounded-3xl p-6 text-center text-gray-500 text-sm">
                        No interventions yet.
                      </div>
                    ) : (
                      getStudentInterventions(
                        selected.studentId
                      ).map((i) => (
                        <div
                          key={i._id}
                          className="
                            bg-white/60 backdrop-blur-xl
                            border border-white/30
                            rounded-3xl p-5
                            flex justify-between gap-4
                          "
                        >

                          <div>
                            <p className="font-bold capitalize text-gray-900">
                              {i.type}
                            </p>

                            <p className="text-sm text-gray-600 mt-2">
                              {i.description}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">

                            <span
                              className={`
                                px-3 py-1 rounded-full text-[11px]
                                font-semibold border
                                ${
                                  i.status === "completed"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                }
                              `}
                            >
                              {i.status}
                            </span>

                            {i.status !== "completed" && (
                              <button
                                onClick={() =>
                                  markComplete(i._id)
                                }
                                className="text-xs text-green-700 hover:text-green-800 font-semibold"
                              >
                                Mark Complete
                              </button>
                            )}

                          </div>

                        </div>
                      ))
                    )}

                  </div>

                </div>

                {/* FORM */}
                <div className="space-y-4">

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                      Intervention Type
                    </p>

                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.value,
                        })
                      }
                      className="
                        w-full rounded-2xl
                        border border-white/30
                        bg-white/60 backdrop-blur-xl
                        px-4 py-3 outline-none text-sm
                      "
                    >

                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}

                    </select>

                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                      Description
                    </p>

                    <textarea
                      rows={4}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description:
                            e.target.value,
                        })
                      }
                      className="
                        w-full rounded-2xl
                        border border-white/30
                        bg-white/60 backdrop-blur-xl
                        px-4 py-3 outline-none text-sm resize-none
                      "
                      placeholder="Describe the intervention plan..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">

                    <button
                      onClick={submit}
                      className="
                        bg-green-600 hover:bg-green-700
                        text-white py-3 rounded-2xl
                        font-semibold transition
                      "
                    >
                      Add Intervention
                    </button>

                    <button
                      onClick={() =>
                        exportInterventionPDF(
                          selected,
                          interventions
                        )
                      }
                      className="
                        bg-blue-600 hover:bg-blue-700
                        text-white py-3 rounded-2xl
                        font-semibold transition
                      "
                    >
                      Export PDF
                    </button>

                  </div>

                </div>

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

