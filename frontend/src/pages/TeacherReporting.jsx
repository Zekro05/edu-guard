import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Plus,
  FileClock,
  Bell,
  BookOpen,
  HelpCircle,
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
  Send,
  UserRound,
  ChevronRight,
  ShieldCheck,
  Info,
  Paperclip,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { API } from "../lib/api.js";
import { useAuthStore } from "../store/authStore";

const incidentOptions = [
  {
    label: "MINOR OFFENSES",
    items: [
      "Dress Code Violation", "Improper Uniform", "Improper Haircut", "Unauthorized Hair Color",
      "Wearing Earrings", "Use of Cosmetics/Nail Polish", "Unnecessary Talking", "Shouting",
      "Howling", "Eating Inside Classroom", "Extreme Quarrels", "Minor Classroom Disruption",
      "Use of Impolite Words", "Cursing", "Teasing", "Name Calling", "Habitual Absences",
      "Unnecessary Use of Chat Box", "Unresponsive During Online Classes", "Leaving Online Conference Without Permission",
      "Turning Off Camera Without Valid Reason", "Improper Camera Visibility", "Habitual Tardiness",
      "Inappropriate Profile Picture/Background", "Unsigned School Correspondence", "Late Submission of Reply Slips",
      "Non-submission of Reply Slips", "Failure to Submit Excuse Letter", "Loss of Violation Report", "Littering",
      "Violation of Library Rules", "Failure to Return Borrowed Materials", "Not Wearing School ID", "Playing Cards",
      "Rough Play", "Horseplaying", "Refusal to Replace Damaged Property", "Using Cellphone During Examination",
      "Failure to Present School ID", "Tampering School ID", "Tampering Library Card", "Loitering",
      "Lending School ID", "Using Someone Else's ID", "Locker Policy Violation", "Eating in Restricted Areas",
      "Unauthorized Gadgets", "Unauthorized Cellphone Use",
    ],
  },
  {
    label: "MAJOR OFFENSES",
    items: [
      "Sharing Account Credentials", "Piracy", "Unauthorized Downloading", "Posting Screenshots Without Consent",
      "Defamation", "Slander", "Recording Without Consent", "Cyberbullying", "Cyber Baiting",
      "Unauthorized Transactions", "Viewing Pornographic Materials", "Selling Without Approval", "Spreading Fake News",
      "Harassment", "Threatening Messages", "Profanity", "Using Portal for Political Activities", "Using Portal for Gambling",
      "Anonymous Harassing Emails", "Threatening Other Students", "Desecration of Religious Items", "Disrespect During Ceremonies",
      "Improper Use of Internet", "Withholding Information", "Petty Theft", "Stealing", "Possession of Pornographic Materials",
      "Threatening School Personnel", "Unauthorized Solicitation", "Disrespect to School Authorities", "Disobedience", "Defiance",
      "Assault", "Abusive Behavior", "Bringing School Into Disrepute", "Forgery", "Cheating", "Plagiarism",
      "Academic Dishonesty", "Vandalism", "Defacing School Property", "Destroying School Property", "Tampering School Records",
      "Possession of Immoral Materials", "Gambling", "Mischief", "Unauthorized Use of School Equipment", "Spreading False Information",
      "Instigating a Fight", "Unauthorized Leaving of Campus", "Possession of Liquor", "Possession of Cigarettes", "Possession of Vape",
      "Possession of Deadly Weapon", "Fighting", "Physical Injury", "Physical Assault", "Entering Bars While in Uniform",
      "Tampering Fire Safety Equipment", "Habitual Violation of School Rules", "Smoking Inside Campus", "Smoking During School Activities",
      "Drug Possession", "Drug Selling", "Public Display of Affection", "Indecent Conduct", "Immoral Conduct",
      "Pregnancy-related Misconduct", "Sex Video/Scandal Involvement", "Joining Unauthorized Fraternities", "Hazing", "Voyeurism",
    ],
  },
  { label: "CUSTOM", items: ["Other"] },
];

const locationOptions = [
  { label: "PRE SCHOOL BUILDING", items: ["PS 101", "PS 102"] },
  { label: "GLORIOUS BUILDING", items: ["GB 101", "GB 102", "GB 103"] },
  { label: "JOYFUL BUILDING", items: ["JB 101", "JB 102", "JB 103", "JB 104", "JB 105", "JB 201", "JB 202", "JB 203", "JB 205", "JB 206", "JB 207"] },
  { label: "LUMINOUS BUILDING", items: ["LB 101", "LB 102", "LB 103", "LB 104", "LB 201", "LB 202", "LB 203", "LB 204"] },
  { label: "GATES", items: ["Main Gate - Pedestrian", "Main Gate - Vehicle", "Campus Gate - Pedestrian", "Campus Gate - Vehicle"] },
  { label: "OTHER AREAS", items: ["Hallway", "Library", "Computer Laboratory", "Science Laboratory", "Canteen", "Gymnasium", "Playground", "School Grounds", "Parking Area", "Clinic", "Guidance Office", "Principal's Office", "Faculty Room", "Chapel", "Comfort Room", "Stairway", "Other"] },
];

const getIncidentCategory = (offense) => {
  if (!offense) return "";
  const group = incidentOptions.find((option) => option.items.includes(offense));
  if (group?.label === "MINOR OFFENSES") return "Minor Offense";
  if (group?.label === "MAJOR OFFENSES") return "Major Offense";
  return "Custom";
};


const ReportIncidentPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSuggestionsOpen, setStudentSuggestionsOpen] = useState(false);

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

  const studentName = useMemo(
    () =>
      [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      user?.fullName ||
      "Student",
    [user],
  );

  const firstName = user?.firstName || user?.name?.split(" ")?.[0] || "Student";
  const profilePhoto = user?.profilePhoto || user?.profilePicture || user?.photo || null;

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    const query = form.studentName.trim();

    if (query.length < 2) {
      setStudents([]);
      setStudentSuggestionsOpen(false);
      return;
    }

    let active = true;

    const searchStudents = async () => {
      try {
        const response = await API.get("/api/students/search", {
          params: { query },
        });

        const results = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.students)
            ? response.data.students
            : [];

        if (active) {
          setStudents(results);
          setStudentSuggestionsOpen(true);
        }
      } catch (error) {
        if (active) {
          setStudents([]);
          setStudentSuggestionsOpen(false);
        }
        console.error("Failed to search students:", error);
      }
    };

    const timer = setTimeout(searchStudents, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.studentName]);

  const navigateTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
  ...current,
  [name]: value,

  ...(name === "studentName"
    ? {
        studentId: "",
        studentNumber: "",
      }
    : {}),

  ...(name === "offense"
    ? {
        category: getIncidentCategory(value),
      }
    : {}),
}));

    if (name === "studentName") {
      setStudentSuggestionsOpen(value.trim().length >= 2);
    }
  };

  const getUserDisplayName = (student) =>
    [student?.firstName, student?.middleName, student?.lastName].filter(Boolean).join(" ").trim() ||
    student?.name || student?.fullName || "";

  const filteredStudentSuggestions = students.slice(0, 6);

  const selectStudentSuggestion = (student) => {
  setForm((current) => ({
    ...current,
    studentName: getUserDisplayName(student),

    // MongoDB _id
    studentId: student?._id || student?.id || "",

    // School/student number
    studentNumber:
      student?.studentId ||
      student?.studentCode ||
      "",
  }));

  setStudentSuggestionsOpen(false);
};

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setEvidenceFile(null);
      setEvidencePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Evidence must be an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Evidence image must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
  };

  const removeEvidence = () => {
    if (evidencePreview) {
      URL.revokeObjectURL(evidencePreview);
    }

    setEvidenceFile(null);
    setEvidencePreview("");

    const input = document.getElementById("student-evidence-upload");
    if (input) input.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const required = [
      ["studentName", "the reported student's name"],
      ["offense", "the incident/offense"],
      ["category", "the incident category"],
      ["location", "the location"],
      ["date", "the date"],
      ["time", "the time"],
      ["description", "the incident description"],
    ];

    const missing = required.find(([key]) => !String(form[key] || "").trim());

    if (missing) {
      toast.error(`Please provide ${missing[1]}.`);
      return;
    }

    if (form.date < oldestReportDate || form.date > latestReportDate) {
      toast.error("Reports can only be submitted for incidents that occurred 3 to 7 days ago.");
      return;
    }

    const incidentDateTime = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(incidentDateTime.getTime())) {
      toast.error("Please provide a valid incident date and time.");
      return;
    }
    if (incidentDateTime > new Date()) {
      toast.error("You cannot report an incident with a future date or time.");
      return;
    }

    if (form.description.trim().length < 15) {
      toast.error("Please provide a little more detail about what happened.");
      return;
    }

    if (!evidenceFile) {
      toast.error("Please upload an evidence image before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("studentName", form.studentName.trim());
      if (form.studentId.trim()) {
        formData.append("studentId", form.studentId.trim());
      }
      formData.append("offense", form.offense.trim());
      formData.append("category", form.category);
      formData.append("location", form.location.trim());
      formData.append("date", form.date);
      formData.append("time", form.time);
      formData.append("description", form.description.trim());
      formData.append("reporterType", "teacher");
      formData.append("reporter", isAnonymous ? "Anonymous" : studentName);
      formData.append("status", "pending");
      formData.append("evidence", evidenceFile);

      await API.post("/api/reports", formData);

      toast.success("Incident report submitted successfully.");
      setForm((current) => ({
        ...current,
        studentName: "",
        studentId: "",
        offense: "",
        category: "",
        location: "",
        description: "",
        date: latestReportDate,
        time: new Date().toTimeString().slice(0, 5),
      }));
      setIsAnonymous(false);
      setStudentSuggestionsOpen(false);
      removeEvidence();

      setTimeout(() => navigate("/my-reports"), 500);
    } catch (error) {
      console.error("Failed to submit incident report:", error);
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to submit the incident report. Please try again.",
      );
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
          <Nav icon={<LayoutDashboard size={18} />} label="Dashboard" path="/student-dashboard" />
          <Nav icon={<FileText size={18} />} label="My Reports" path="/my-reports" />
          <Nav icon={<FileClock size={18} />} label="My History" path="/my-history" />
          <Nav icon={<Plus size={18} />} label="Report an Incident" path="/student-reporting" active />
        </div>

        <p className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          Student Support
        </p>
        <div className="space-y-1">
          <Nav icon={<BookOpen size={18} />} label="Guidance Resources" path="/guidance-resources" />
          <Nav icon={<HelpCircle size={18} />} label="Get Support" path="/message-admin" />
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
                <img src={profilePhoto} alt={studentName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-green-500 font-bold">{studentName.charAt(0).toUpperCase()}</span>
              )}
              <span className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${darkMode ? "border-[#0D1A12]" : "border-white"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold truncate ${theme.heading}`}>{studentName}</p>
              <p className={`text-[10px] truncate mt-0.5 ${theme.muted}`}>{user?.studentId || user?.studentCode || "Student"}</p>
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
                  <span>Student Portal</span>
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
                <div className="relative">
                  <FieldLabel icon={<UserRound size={14} />} required>Reported student's name</FieldLabel>
                  <input
                    className={inputClass}
                    name="studentName"
                    value={form.studentName}
                    onChange={handleChange}
                    onFocus={() => form.studentName.trim().length >= 2 && setStudentSuggestionsOpen(true)}
                    onBlur={() => setTimeout(() => setStudentSuggestionsOpen(false), 150)}
                    placeholder="Enter student's full name"
                    autoComplete="off"
                  />
                  {studentSuggestionsOpen && filteredStudentSuggestions.length > 0 && (
                    <div className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-lg ${darkMode ? "bg-[#0D1A12] border-[#24392A]" : "bg-white border-gray-200"}`}>
                      {filteredStudentSuggestions.map((student) => {
                        const name = getUserDisplayName(student);
                        const id = student?.studentId || student?.studentCode || "";
                        return (
                          <button key={student?._id || student?.id || id || name} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectStudentSuggestion(student)} className={`w-full text-left px-4 py-3 transition ${darkMode ? "hover:bg-[#101F15]" : "hover:bg-gray-50"}`}>
                            <p className={`text-sm font-semibold ${theme.heading}`}>{name}</p>
                            {id && <p className={`text-xs mt-0.5 ${theme.muted}`}>Student ID: {id}</p>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {studentSuggestionsOpen && form.studentName.trim().length >= 2 && filteredStudentSuggestions.length === 0 && (
                    <div className={`absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border px-4 py-3 shadow-lg ${darkMode ? "bg-[#0D1A12] border-[#24392A]" : "bg-white border-gray-200"}`}>
                      <p className={`text-xs ${theme.muted}`}>No matching student found.</p>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel icon={<FileText size={14} />}>Student ID</FieldLabel>
                  <input className={inputClass} name="studentId" value={form.studentNumber} onChange={handleChange} placeholder="Optional" autoComplete="off" />
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
                  <select className={inputClass} name="offense" value={form.offense} onChange={handleChange}>
                    <option value="">Select an incident / offense</option>
                    {incidentOptions.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel icon={<FileText size={14} />} required>Category</FieldLabel>
                  <input
                    className={`${inputClass} cursor-not-allowed`}
                    name="category"
                    value={form.category}
                    readOnly
                    placeholder="Automatically determined from the selected offense"
                  />
                </div>

                <div>
                  <FieldLabel icon={<MapPin size={14} />} required>Location</FieldLabel>
                  <select className={inputClass} name="location" value={form.location} onChange={handleChange}>
                    <option value="">Select where it happened</option>
                    {locationOptions.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel icon={<CalendarDays size={14} />} required>Date</FieldLabel>
                  <input type="date" className={inputClass} name="date" value={form.date} min={oldestReportDate} max={latestReportDate} onChange={handleChange} />
                  <p className={`text-[10px] mt-1.5 ${theme.muted}`}>Only incidents from 3 to 7 days ago can be reported.</p>
                </div>

                <div>
                  <FieldLabel icon={<Clock3 size={14} />} required>Time</FieldLabel>
                  <input type="time" className={inputClass} name="time" value={form.time} onChange={handleChange} />
                  <p className={`text-[10px] mt-1.5 ${theme.muted}`}>Future incident times are not allowed.</p>
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


            <section className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-7 ${theme.card}`}>
              <div className="flex items-start gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                  <Paperclip size={19} />
                </div>
                <div>
                  <h3 className={`font-extrabold ${theme.heading}`}>
                    Evidence Image <span className="text-red-500">*</span>
                  </h3>
                  <p className={`text-xs mt-1 ${theme.body}`}>
                    Upload a clear image that supports the incident you are reporting.
                  </p>
                </div>
              </div>

              <input
                id="student-evidence-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleEvidenceChange}
                className="hidden"
              />

              {!evidenceFile ? (
                <label
                  htmlFor="student-evidence-upload"
                  className={`group flex flex-col items-center justify-center w-full min-h-[190px] rounded-2xl border-2 border-dashed cursor-pointer transition ${
                    darkMode
                      ? "border-[#294433] bg-[#101F15] hover:border-green-600 hover:bg-[#13251A]"
                      : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    darkMode ? "bg-[#0D1A12] text-green-400" : "bg-white text-green-600"
                  } shadow-sm`}>
                    <UploadCloud size={22} />
                  </div>

                  <p className={`text-sm font-bold mt-3 ${theme.heading}`}>
                    Upload evidence image
                  </p>

                  <p className={`text-xs mt-1 ${theme.muted}`}>
                    Click to choose an image from your device
                  </p>

                  <p className={`text-[10px] mt-2 ${theme.muted}`}>
                    JPG, JPEG, PNG, or WEBP • Maximum 10 MB
                  </p>
                </label>
              ) : (
                <div className={`rounded-2xl border overflow-hidden ${theme.border} ${theme.subtle}`}>
                  <div className="relative">
                    {evidencePreview && (
                      <img
                        src={evidencePreview}
                        alt="Evidence preview"
                        className="w-full max-h-[420px] object-contain bg-black/5"
                      />
                    )}

                    <button
                      type="button"
                      onClick={removeEvidence}
                      className="absolute top-3 right-3 px-3 py-2 rounded-xl bg-black/65 text-white text-xs font-bold hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon size={16} className="text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${theme.heading}`}>
                          {evidenceFile.name}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${theme.muted}`}>
                          {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <label
                      htmlFor="student-evidence-upload"
                      className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                        darkMode
                          ? "border-[#294433] text-gray-300 hover:bg-[#14261C]"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Replace
                    </label>
                  </div>
                </div>
              )}

              <p className={`text-[10px] mt-2 ${theme.muted}`}>
                An evidence image is required to submit this incident report.
              </p>
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

export default ReportIncidentPage;
