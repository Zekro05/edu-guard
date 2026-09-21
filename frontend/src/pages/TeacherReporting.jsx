import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  Plus,
  Bell,
  BookOpen,
  LifeBuoy,
  Settings,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  MapPin,
  CalendarDays,
  Clock3,
  FileWarning,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Send,
  UserRound,
  ChevronRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { API } from "../lib/api.js";
import { useAuthStore } from "../store/authStore";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return getLocalDateString(date);
};

const oldestReportDate = getDateDaysAgo(7);
const latestReportDate = getDateDaysAgo(3);

const TeacherReporting = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState("");

  const [form, setForm] = useState({
    studentName: "",
    studentId: "",
    studentNumber: "",
    offense: "",
    category: "",
    location: "",
    date: latestReportDate,
    time: new Date().toTimeString().slice(0, 5),
    description: "",
  });

  const theme = useMemo(
    () => ({
      page: darkMode ? "bg-[#07110B] text-gray-100" : "bg-[#F7F9F8] text-gray-900",
      sidebar: darkMode ? "bg-[#0B1710] border-[#17251B]" : "bg-white border-gray-100",
      card: darkMode ? "bg-[#0D1A12] border-[#1A2C20]" : "bg-white border-gray-100",
      subtle: darkMode ? "bg-[#101F15]" : "bg-gray-50",
      border: darkMode ? "border-[#1A2C20]" : "border-gray-100",
      heading: darkMode ? "text-gray-100" : "text-gray-900",
      body: darkMode ? "text-gray-300" : "text-gray-500",
      muted: darkMode ? "text-gray-500" : "text-gray-400",
    }),
    [darkMode],
  );

  const teacherName = useMemo(
    () =>
      [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.fullName ||
      "Teacher",
    [user],
  );

  const firstName = user?.firstName || user?.name?.split(" ")?.[0] || "Teacher";
  const profilePhoto = user?.profilePhoto || user?.profilePicture || user?.photo || null;

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const navigateTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  useEffect(() => {
    const query = form.studentName.trim();
    if (!query || form.studentId) {
      setStudentSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingStudents(true);
        const response = await API.get("/api/students/search", { params: { query } });
        const students = Array.isArray(response.data) ? response.data : response.data?.students || response.data?.data || [];
        setStudentSuggestions(students.slice(0, 6));
      } catch (error) {
        console.error("Teacher student search error:", error);
        setStudentSuggestions([]);
      } finally {
        setSearchingStudents(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [form.studentName, form.studentId]);

  const selectStudent = (student) => {
    const fullName = [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(" ").trim();
    setForm((current) => ({ ...current, studentName: fullName, studentId: student?._id || "", studentNumber: student?.studentId || "" }));
    setStudentSuggestions([]);
  };

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Evidence must be an image file."); event.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Evidence image must be 10 MB or smaller."); event.target.value = ""; return; }
    if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
  };

  const removeEvidence = () => {
    if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    setEvidenceFile(null);
    setEvidencePreview("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "studentName" ? { studentId: "", studentNumber: "" } : {}),
      ...(name === "offense" ? { category: getIncidentCategory(value) } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.studentId) return toast.error("Please select a student from the database suggestions.");
    if (!form.offense) return toast.error("Please select an offense.");
    if (!form.location) return toast.error("Please select the incident location.");
    if (!form.date || !form.time) return toast.error("Please provide the incident date and time.");
    if (form.date < oldestReportDate || form.date > latestReportDate) {
      return toast.error("Reports can only be submitted for incidents that occurred 3 to 7 days ago.");
    }
    const incidentDateTime = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(incidentDateTime.getTime())) return toast.error("Please provide a valid incident date and time.");
    if (incidentDateTime > new Date()) return toast.error("You cannot report an incident with a future date or time.");
    if (form.description.trim().length < 15) return toast.error("Please provide at least 15 characters describing the incident.");
    if (!evidenceFile) return toast.error("An evidence image is required before submitting the report.");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("studentId", form.studentId);
      formData.append("studentName", form.studentName.trim());
      if (form.studentNumber) formData.append("studentNumber", form.studentNumber);
      formData.append("offense", form.offense);
      formData.append("category", form.category);
      formData.append("location", form.location);
      formData.append("date", form.date);
      formData.append("time", form.time);
      formData.append("description", form.description.trim());
      formData.append("reporterType", "Teacher");
      formData.append("status", "pending");
      formData.append("evidence", evidenceFile);

      await API.post("/api/reports", formData);
      toast.success("Incident report submitted successfully.");
      navigate("/teacher-my-reports");
    } catch (error) {
      console.error("Failed to submit teacher incident report:", error);
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to submit the incident report.");
    } finally {
      setSubmitting(false);
    }
  };

  const Nav = ({ icon, label, path, active = false }) => (
    <button
      type="button"
      onClick={() => navigateTo(path)}
      className={`group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
        active
          ? darkMode
            ? "bg-green-500/10 text-green-400"
            : "bg-green-50 text-green-700"
          : darkMode
            ? "text-gray-400 hover:bg-[#101F15] hover:text-gray-100"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span
        className={`transition ${
          active
            ? "text-green-500"
            : darkMode
              ? "text-gray-600 group-hover:text-gray-300"
              : "text-gray-400 group-hover:text-gray-700"
        }`}
      >
        {icon}
      </span>

      {label}

      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
      )}
    </button>
  );

  const ThemeToggle = () => (
    <button
      type="button"
      onClick={() => setDarkMode((current) => !current)}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border text-sm font-semibold transition ${
        darkMode
          ? "bg-[#101F15] border-[#1A2C20] text-gray-300 hover:bg-[#14261C]"
          : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            darkMode ? "bg-amber-950/40 text-amber-300" : "bg-white text-slate-500"
          }`}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </span>
        {darkMode ? "Light mode" : "Dark mode"}
      </div>
      <span className={`relative w-9 h-5 rounded-full transition ${darkMode ? "bg-green-600" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition ${darkMode ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div>
        <div className="px-3 mb-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img src="/school-logo.webp" alt="School Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-xl font-extrabold tracking-tight ${theme.heading}`}>
                  Guid<span className="text-green-500">Ed</span>
                </h1>
                <p className={`text-[9px] uppercase tracking-widest font-semibold truncate ${theme.muted}`}>
                  Student Guidance
                </p>
              </div>
            </div>
            {mobile && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  darkMode ? "bg-[#101F15] text-gray-400" : "bg-gray-50 text-gray-500"
                }`}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <p className={`text-[11px] leading-relaxed mt-4 ${theme.muted}`}>
            Our Lady of the Holy Rosary
            <br />
            School
            <br />
            General Trias Campus
          </p>
        </div>

        <p className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Main Menu
        </p>
        <div className="space-y-1">
          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" path="/teacher-dashboard" />
          <Nav icon={<FileText size={18} />} label="My Reports" path="/teacher-my-reports" />
          <Nav icon={<Users size={18} />} label="My Class" path="/teacher-class" />
          <Nav icon={<MessageSquare size={18} />} label="Messages" path="/messages" />
          <Nav icon={<Plus size={18} />} label="Report an Incident" path="/teacher-reporting" active />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Guidance Support
        </p>
        <div className="space-y-1">
          <Nav icon={<BookOpen size={18} />} label="Guidance Resources" path="/guidance" />
          <Nav icon={<LifeBuoy size={18} />} label="Get Support" path="/messages" />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          System
        </p>
        <Nav icon={<Settings size={18} />} label="Settings" path="/settings" />
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-green-500/10" : "bg-green-100"}`}>
              {profilePhoto ? (
                <img src={profilePhoto} alt={teacherName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-green-500 font-bold">{teacherName.charAt(0).toUpperCase()}</span>
              )}
              <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${darkMode ? "border-[#0D1A12]" : "border-white"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold truncate ${theme.heading}`}>{teacherName}</p>
              <p className={`text-[10px] truncate mt-0.5 ${theme.muted}`}>Teacher account</p>
            </div>
          </div>
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${
            darkMode
              ? "border-[#1A2C20] text-gray-400 hover:bg-[#101F15] hover:text-gray-200"
              : "border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  const FieldLabel = ({ icon, children, required = false }) => (
    <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-2 ${theme.heading}`}>
      <span className={darkMode ? "text-green-400" : "text-green-600"}>{icon}</span>
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );

  const inputClass = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition ${
    darkMode
      ? "bg-[#101F15] border-[#1A2C20] text-gray-100 placeholder:text-gray-600 focus:border-green-600 focus:ring-2 focus:ring-green-500/10"
      : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-green-300 focus:ring-2 focus:ring-green-50"
  }`;

  return (
    <div className={`min-h-[100dvh] w-full ${theme.page}`}>
      <aside className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[250px] xl:w-[270px] flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 overflow-y-auto border-r transition-colors duration-300 ${theme.sidebar}`}>
        <SidebarContent />
      </aside>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
          />
          <aside className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] flex flex-col justify-between px-5 py-5 overflow-y-auto border-r lg:hidden ${theme.sidebar}`}>
            <SidebarContent mobile />
          </aside>
        </>
      )}

      <main className="lg:pl-[250px] xl:pl-[270px] min-h-[100dvh]">
        <header
          className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
            darkMode
              ? "bg-[#07110B]/90 border-[#17251B]"
              : "bg-[#F7F9F8]/90 border-gray-100"
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <Menu size={19} />
              </button>

              <div className="min-w-0">
                <div className={`hidden sm:flex items-center gap-2 text-sm mb-1 ${theme.muted}`}>
                  <span>Teacher Portal</span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">Report an Incident</span>
                </div>

                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight truncate ${theme.heading}`}>
                  Report an Incident
                </h2>

                <p className={`text-sm sm:text-sm mt-1 ${theme.body}`}>
                  Submit a concern or incident for the guidance team to review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${
                darkMode
                  ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                  : "bg-white border-gray-200 text-gray-600"
              }`}>
                <Bell size={17} />
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 max-w-[1180px] mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.heading}`}>Tell us what happened.</h1>
            <p className={`text-sm mt-2 max-w-2xl leading-relaxed ${theme.body}`}>
              Submit an incident report to the school guidance team. Please provide clear and accurate information so your concern can be reviewed properly.
            </p>
          </div>

          <div className={`mb-6 rounded-2xl border p-4 sm:p-5 ${darkMode ? "bg-[#0D2415] border-green-900/40" : "bg-green-50 border-green-100"}`}>
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-green-500/10 text-green-400" : "bg-white text-green-600"}`}>
                <ShieldCheck size={19} />
              </div>
              <div>
                <p className={`text-sm font-bold ${theme.heading}`}>Your report is handled by the guidance team.</p>
                <p className={`text-xs leading-relaxed mt-1 ${theme.body}`}>
                  Share only information that is relevant to the incident. Avoid guessing or adding details you are not sure about.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <section className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-7 ${theme.card}`}>
              <div className="flex items-start gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}`}>
                  <UserRound size={19} />
                </div>
                <div>
                  <h3 className={`font-extrabold ${theme.heading}`}>Who is involved?</h3>
                  <p className={`text-xs mt-1 ${theme.body}`}>Identify the student involved in the incident.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel icon={<UserRound size={14} />} required>Reported student's name</FieldLabel>
                  <input className={inputClass} name="studentName" value={form.studentName} onChange={handleChange} placeholder="Enter student's full name" autoComplete="off" />

                  {!form.studentId && form.studentName.trim() && (
                    <div className={`absolute left-0 right-0 top-[76px] z-20 rounded-2xl border shadow-xl overflow-hidden ${darkMode ? "bg-[#0D1A12] border-[#24392A]" : "bg-white border-gray-200"}`}>
                      {searchingStudents ? (
                        <div className={`px-4 py-3 text-xs ${theme.muted}`}>Searching students...</div>
                      ) : studentSuggestions.length ? studentSuggestions.map((student) => (
                        <button type="button" key={student._id} onClick={() => selectStudent(student)} className={`w-full text-left px-4 py-3 flex items-center gap-3 ${darkMode ? "hover:bg-[#14261C]" : "hover:bg-gray-50"}`}>
                          <UserRound size={16} className="text-green-500" />
                          <span className="min-w-0"><span className={`block text-sm font-bold truncate ${theme.heading}`}>{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")}</span><span className={`block text-[10px] mt-0.5 ${theme.muted}`}>{student.studentId || student.email}</span></span>
                        </button>
                      )) : <div className={`px-4 py-3 text-xs ${theme.muted}`}>No matching students found.</div>}
                    </div>
                  )}

                </div>
                <div>
                  <FieldLabel icon={<FileText size={14} />}>Student ID</FieldLabel>
                  <input className={inputClass} name="studentId" value={form.studentId} onChange={handleChange} placeholder="Optional" autoComplete="off" />
                </div>
              </div>
            </section>

            <section className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-7 ${theme.card}`}>
              <div className="flex items-start gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                  <FileWarning size={19} />
                </div>
                <div>
                  <h3 className={`font-extrabold ${theme.heading}`}>Incident details</h3>
                  <p className={`text-xs mt-1 ${theme.body}`}>Give the guidance team the basic facts about what happened.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <FieldLabel icon={<FileWarning size={14} />} required>Incident / offense</FieldLabel>
                  <input className={inputClass} name="offense" value={form.offense} onChange={handleChange} placeholder="e.g. Bullying, physical altercation, harassment..." />
                </div>

                <div>
                  <FieldLabel icon={<FileText size={14} />} required>Category</FieldLabel>
                  <select className={inputClass} name="category" value={form.category} onChange={handleChange}>
                    <option value="">Select a category</option>
                    <option value="Bullying">Bullying</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Physical Altercation">Physical Altercation</option>
                    <option value="Disrespect / Misconduct">Disrespect / Misconduct</option>
                    <option value="Academic Misconduct">Academic Misconduct</option>
                    <option value="Property Concern">Property Concern</option>
                    <option value="Threat / Safety Concern">Threat / Safety Concern</option>
                    <option value="Substance-Related">Substance-Related</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <FieldLabel icon={<MapPin size={14} />} required>Location</FieldLabel>
                  <input className={inputClass} name="location" value={form.location} onChange={handleChange} placeholder="Where did it happen?" />
                </div>

                <div>
                  <FieldLabel icon={<CalendarDays size={14} />} required>Date</FieldLabel>
                  <input type="date" className={inputClass} name="date" value={form.date} onChange={handleChange} />
                </div>

                <div>
                  <FieldLabel icon={<Clock3 size={14} />} required>Time</FieldLabel>
                  <input type="time" className={inputClass} name="time" value={form.time} onChange={handleChange} />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel icon={<FileText size={14} />} required>What happened?</FieldLabel>
                  <textarea
                    className={`${inputClass} min-h-[170px] resize-y leading-relaxed`}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe what happened, who was involved, and any relevant details you personally observed."
                    maxLength={3000}
                  />
                  <div className={`flex justify-between gap-3 mt-2 text-[10px] ${theme.muted}`}>
                    <span>Please keep the description factual and specific.</span>
                    <span>{form.description.length}/3000</span>
                  </div>
                </div>
              </div>
            </section>

            <div className={`rounded-2xl border p-4 ${theme.card}`}>
              <div className="flex gap-3">
                <Info size={17} className={`flex-shrink-0 mt-0.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                <p className={`text-xs leading-relaxed ${theme.body}`}>
                  After submission, your report will appear in <strong className={theme.heading}>My Reports</strong>. The guidance team will review the information and update its status when action is taken.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigateTo("/my-reports")}
                className={`px-5 py-3 rounded-xl border text-sm font-bold transition ${
                  darkMode ? "border-[#1A2C20] text-gray-300 hover:bg-[#101F15]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold shadow-sm transition"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Incident Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default TeacherReporting;
