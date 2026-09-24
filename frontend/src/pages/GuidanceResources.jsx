import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileClock,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BookOpen,
  Moon,
  Sun,
  LifeBuoy,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Brain,
  Clock3,
  Users,
  ShieldAlert,
  HelpCircle,
  Plus
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const resources = [
  {
    id: "stress",
    title: "Managing Stress",
    category: "Well-being",
    icon: Brain,
    description:
      "Practical ways to handle school pressure, deadlines, and everyday stress.",
    tips: [
      "Break large tasks into smaller steps.",
      "Take short breaks between study sessions.",
      "Keep a consistent sleep schedule when possible.",
      "Talk to someone you trust when stress becomes difficult to manage.",
    ],
  },
  {
    id: "study",
    title: "Study & Time Management",
    category: "Academic",
    icon: Clock3,
    description:
      "Simple strategies for organizing schoolwork and making your study time more manageable.",
    tips: [
      "Write down your most important tasks for the day.",
      "Prioritize deadlines before less urgent activities.",
      "Use a study schedule that fits your actual routine.",
      "Start large assignments early instead of waiting until the deadline.",
    ],
  },
  {
    id: "relationships",
    title: "Relationships & Communication",
    category: "Relationships",
    icon: Users,
    description:
      "Helpful guidance for communication, boundaries, misunderstandings, and relationships.",
    tips: [
      "Listen carefully before responding.",
      "Communicate your boundaries clearly and respectfully.",
      "Ask questions instead of assuming someone's intentions.",
      "Ask for help when a relationship becomes unsafe or harmful.",
    ],
  },
  {
    id: "safety",
    title: "Student Safety",
    category: "Safety",
    icon: ShieldAlert,
    description:
      "Know what to do when you feel unsafe or notice a situation that may put someone at risk.",
    tips: [
      "Move to a safe location if you feel threatened.",
      "Tell a trusted teacher, adult, or Guidance staff member.",
      "Keep important details about an incident accurate.",
      "Use GuidEd's reporting tools when an incident needs to be documented.",
    ],
  },
  {
    id: "wellbeing",
    title: "Emotional Well-being",
    category: "Personal",
    icon: HeartHandshake,
    description:
      "Small reminders that can help you understand your emotions and take care of yourself.",
    tips: [
      "Acknowledge your feelings without judging yourself.",
      "Spend time with people who make you feel safe and supported.",
      "Make room for activities that help you recharge.",
      "Reach out when you feel that you need someone to talk to.",
    ],
  },
  {
    id: "reporting",
    title: "Reporting an Incident",
    category: "Reporting",
    icon: FileText,
    description:
      "Learn how to use GuidEd when you need to document a school-related concern.",
    tips: [
      "Provide the reported student's information accurately.",
      "Select the appropriate offense and location.",
      "Describe what happened as clearly as possible.",
      "Attach the required evidence before submitting.",
    ],
  },
];

const faqs = [
  {
    question: "When should I contact Guidance?",
    answer:
      "You can contact Guidance whenever you need support with personal, emotional, academic, relationship, safety, or other school-related concerns.",
  },
  {
    question: "Do I have to wait until a problem becomes serious?",
    answer:
      "No. You can ask for support early. Reaching out when a concern first appears can make it easier to address.",
  },
  {
    question: "Can Guidance help with academic concerns?",
    answer:
      "Yes. Guidance can support concerns involving study habits, time management, school pressure, and other student-related challenges.",
  },
  {
    question: "What should I do if I am in immediate danger?",
    answer:
      "Move to a safe location and contact the appropriate emergency or school authority first. Guidance can provide follow-up support after the immediate situation is addressed.",
  },
];

export default function GuidancePage() {
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openResource, setOpenResource] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const theme = useMemo(
    () => ({
      page: darkMode
        ? "bg-[#07110B] text-gray-100"
        : "bg-[#F7F9F8] text-gray-900",
      sidebar: darkMode
        ? "bg-[#0B1710] border-[#17251B]"
        : "bg-white border-gray-100",
      card: darkMode
        ? "bg-[#0D1A12] border-[#1A2C20]"
        : "bg-white border-gray-100",
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
      [user?.firstName, user?.middleName, user?.lastName]
        .filter(Boolean)
        .join(" ") ||
      user?.name ||
      user?.fullName ||
      "Student",
    [user],
  );

  const firstName =
    user?.firstName || user?.name?.split(" ")?.[0] || "Student";

  const profilePhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  const handleTheme = () => {
    setDarkMode((value) => {
      const next = !value;

      try {
        localStorage.setItem("guided-theme", next ? "dark" : "light");
      } catch {}

      return next;
    });
  };

  const handleNavigation = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesCategory =
        category === "All" || resource.category === category;

      const searchable = [
        resource.title,
        resource.category,
        resource.description,
        ...resource.tips,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [search, category]);

  const Nav = ({ icon, label, path, active = false }) => (
    <button
      type="button"
      onClick={() => path && handleNavigation(path)}
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

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div>
        <div
          className={`flex items-center ${
            mobile ? "justify-between" : ""
          } gap-3 px-3 mb-7`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-green-500/10 blur-md" />

              <img
                src="/school-logo.webp"
                alt="School Logo"
                className="relative w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1
                className={`text-xl font-extrabold tracking-tight ${theme.heading}`}
              >
                Guid<span className="text-green-500">Ed</span>
              </h1>

              <p
                className={`text-[8px] uppercase tracking-widest font-semibold ${theme.muted}`}
              >
                Student Guidance
              </p>
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                darkMode
                  ? "bg-[#101F15] text-gray-400"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-3 mb-7">
          <p className={`text-[11px] leading-relaxed ${theme.muted}`}>
            Our Lady of the Holy Rosary
            <br />
            School
            <br />
            General Trias Campus
          </p>
        </div>

        <p
          className={`px-3 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          Main Menu
        </p>

        <div className="space-y-1">
          <Nav
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            path="/student-dashboard"
          />

          <Nav
            icon={<FileText size={18} />}
            label="My Reports"
            path="/my-reports"
          />

          <Nav
            icon={<FileClock size={18} />}
            label="My History"
            path="/my-history"
          />

          <Nav
            icon={<Plus size={18} />}
            label="Report an Incident"
            path="/student-reporting"
          />
        </div>

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          Student Support
        </p>

        <div className="space-y-1">
          <Nav
            icon={<BookOpen size={18} />}
            label="Guidance Resources"
            path="/guidance-resources"
            active
          />

          <Nav
            icon={<LifeBuoy size={18} />}
            label="Get Support"
            path="/message-admin"
          />
        </div>

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          System
        </p>

        <Nav
          icon={<Settings size={18} />}
          label="Settings"
          path="/my-settings"
        />
      </div>

      <div className="space-y-3">
        <div
          className={`p-3 rounded-2xl border ${theme.subtle} ${theme.border}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                darkMode ? "bg-green-500/10" : "bg-green-100"
              }`}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-green-500 font-bold">
                  {studentName.charAt(0).toUpperCase()}
                </span>
              )}

              <span
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 ${
                  darkMode ? "border-[#0B1710]" : "border-white"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-[9px] uppercase tracking-wider font-bold ${theme.muted}`}
              >
                Student
              </p>

              <p className={`text-sm font-bold truncate ${theme.heading}`}>
                {studentName}
              </p>
            </div>
          </div>
        </div>

        {/* Theme toggle intentionally retained below profile */}
        <button
          type="button"
          onClick={handleTheme}
          className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border text-sm font-semibold transition ${
            darkMode
              ? "bg-[#101F15] border-[#24392A] text-gray-200 hover:bg-[#142319]"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
          title="Toggle theme"
        >
          <span className="flex items-center gap-3">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            {darkMode ? "Dark mode" : "Light mode"}
          </span>

          <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
            {darkMode ? "On" : "Off"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition ${
            darkMode
              ? "text-gray-300 border-[#24392A] hover:bg-red-500/10 hover:text-red-400"
              : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${theme.page}`}
    >
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex w-[250px] xl:w-[270px] border-r flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 flex-shrink-0 ${theme.sidebar} ${theme.border}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          />

          <aside
            className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] shadow-2xl flex flex-col justify-between px-5 py-5 lg:hidden ${theme.sidebar}`}
          >
            <SidebarContent mobile />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header copied structurally from StudentDashboard */}
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
                <div
                  className={`hidden sm:flex items-center gap-2 text-sm mb-1 ${theme.muted}`}
                >
                  <span>Student Portal</span>
                  <ChevronRight size={12} />
                  <span className="text-green-500 font-medium">
                    Guidance Resources
                  </span>
                </div>

                <h2
                  className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate ${theme.heading}`}
                >
                  Guidance Resources
                </h2>

                <p className={`text-xs sm:text-sm mt-1 ${theme.body}`}>
                  Helpful resources for your academic, personal, and student
                  support needs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Header theme toggle, same behavior as dashboard */}
              <button
                type="button"
                onClick={handleTheme}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#24392A] text-amber-300"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
                title="Toggle theme"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setNotificationOpen((value) => !value)
                  }
                  className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#24392A] text-gray-300"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                  title="Notifications"
                >
                  <Bell size={17} />
                </button>

                {notificationOpen && (
                  <div
                    className={`absolute right-0 mt-3 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl border shadow-2xl overflow-hidden z-50 ${theme.card}`}
                  >
                    <div
                      className={`flex items-center justify-between p-4 border-b ${theme.border}`}
                    >
                      <p
                        className={`font-extrabold text-sm ${theme.heading}`}
                      >
                        Notifications
                      </p>

                      <button
                        type="button"
                        onClick={() => setNotificationOpen(false)}
                        className={`text-xs font-bold ${theme.muted}`}
                      >
                        Close
                      </button>
                    </div>

                    <div className={`p-5 text-xs ${theme.body}`}>
                      Guidance notifications will appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6">
          {/* Hero */}
          <section
            className={`relative overflow-hidden rounded-[30px] border p-5 sm:p-7 ${
              darkMode
                ? "bg-gradient-to-br from-[#123A22] via-[#0D2A19] to-[#08140D] border-green-500/10"
                : "bg-gradient-to-br from-[#166534] via-[#15803D] to-[#14532D] border-green-700/10"
            } text-white`}
          >
            <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-16 -bottom-24 w-56 h-56 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative grid lg:grid-cols-[1.35fr_0.65fr] gap-7 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={13} />
                  Your GuidEd space
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mt-4">
                  Take care of yourself, one step at a time.
                </h3>

                <p className="text-sm leading-relaxed text-green-50/80 mt-2 max-w-2xl">
                  Explore practical guidance for common student concerns,
                  learn useful strategies, and connect with Guidance whenever
                  you need personal support.
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => handleNavigation("/message-admin")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white text-green-800 text-xs font-extrabold hover:bg-green-50 transition shadow-sm"
                  >
                    <MessageSquare size={15} />
                    Talk to Guidance
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigation("/student-reporting")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-extrabold hover:bg-white/15 transition"
                  >
                    <FileText size={15} />
                    Report a concern
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-green-100/70">
                    Resources
                  </p>

                  <p className="text-3xl font-black mt-2">
                    {resources.length}
                  </p>

                  <p className="text-[10px] text-green-100/70 mt-1">
                    helpful topics
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-green-100/70">
                    Support
                  </p>

                  <p className="text-3xl font-black mt-2">
                    24/7
                  </p>

                  <p className="text-[10px] text-green-100/70 mt-1">
                    resource access
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Search / filter */}
          <section>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}
                >
                  Explore
                </p>

                <h3
                  className={`text-lg font-black mt-1 ${theme.heading}`}
                >
                  Find something useful
                </h3>
              </div>

              <span className={`text-[10px] font-bold ${theme.muted}`}>
                {filteredResources.length}{" "}
                {filteredResources.length === 1
                  ? "resource"
                  : "resources"}
              </span>
            </div>

            <div className="grid lg:grid-cols-[1fr_220px] gap-3">
              <div className="relative">
                <Search
                  size={17}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.muted}`}
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search guidance resources..."
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none text-sm transition ${
                    darkMode
                      ? "bg-[#0D1A12] border-[#1A2C20] text-gray-100 placeholder:text-gray-600 focus:border-green-500/50"
                      : "bg-white border-gray-100 text-gray-900 placeholder:text-gray-400 focus:border-green-300"
                  }`}
                />
              </div>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={`w-full px-4 py-3.5 rounded-2xl border outline-none text-sm font-semibold ${
                  darkMode
                    ? "bg-[#0D1A12] border-[#1A2C20] text-gray-200"
                    : "bg-white border-gray-100 text-gray-700"
                }`}
              >
                <option value="All">All topics</option>
                {resources.map((resource) => (
                  <option
                    key={resource.category}
                    value={resource.category}
                  >
                    {resource.category}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Resource grid */}
          <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredResources.map((resource) => {
              const Icon = resource.icon;
              const expanded = openResource === resource.id;

              return (
                <article
                  key={resource.id}
                  className={`group rounded-[26px] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        darkMode
                          ? "bg-green-500/10 text-green-400"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                        darkMode
                          ? "bg-[#101F15] text-gray-400"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {resource.category}
                    </span>
                  </div>

                  <h4
                    className={`text-sm font-extrabold mt-5 ${theme.heading}`}
                  >
                    {resource.title}
                  </h4>

                  <p
                    className={`text-xs leading-relaxed mt-2 ${theme.body}`}
                  >
                    {resource.description}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenResource(
                        expanded ? null : resource.id,
                      )
                    }
                    className={`w-full mt-5 flex items-center justify-between text-xs font-extrabold ${
                      darkMode
                        ? "text-green-400"
                        : "text-green-600"
                    }`}
                  >
                    <span>
                      {expanded
                        ? "Hide helpful tips"
                        : "View helpful tips"}
                    </span>

                    {expanded ? (
                      <ChevronUp size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                  </button>

                  {expanded && (
                    <div
                      className={`mt-4 rounded-2xl border p-4 ${theme.subtle} ${theme.border}`}
                    >
                      <ul className="space-y-3">
                        {resource.tips.map((tip) => (
                          <li
                            key={tip}
                            className={`flex items-start gap-3 text-xs leading-relaxed ${theme.body}`}
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          {filteredResources.length === 0 && (
            <section
              className={`rounded-[26px] border p-10 text-center ${theme.card}`}
            >
              <Search
                size={26}
                className={`mx-auto ${theme.muted}`}
              />

              <h3
                className={`text-sm font-extrabold mt-3 ${theme.heading}`}
              >
                No resources found
              </h3>

              <p className={`text-xs mt-1 ${theme.muted}`}>
                Try another search term or choose a different topic.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="mt-4 text-xs font-extrabold text-green-500"
              >
                Clear filters
              </button>
            </section>
          )}

          {/* FAQ */}
          <section>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}
                >
                  Quick answers
                </p>

                <h3
                  className={`text-lg font-black mt-1 ${theme.heading}`}
                >
                  Frequently Asked Questions
                </h3>
              </div>

              <HelpCircle
                size={25}
                className={theme.muted}
              />
            </div>

            <div
              className={`rounded-[26px] border overflow-hidden ${theme.card}`}
            >
              {faqs.map((faq, index) => {
                const expanded = openFaq === index;

                return (
                  <div
                    key={faq.question}
                    className={
                      index > 0
                        ? `border-t ${theme.border}`
                        : ""
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaq(
                          expanded ? null : index,
                        )
                      }
                      className={`w-full flex items-center justify-between gap-4 text-left px-5 py-5 transition ${
                        darkMode
                          ? "hover:bg-white/[0.03]"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-xs sm:text-sm font-extrabold ${theme.heading}`}
                      >
                        {faq.question}
                      </span>

                      {expanded ? (
                        <ChevronUp
                          size={17}
                          className="flex-shrink-0 text-green-500"
                        />
                      ) : (
                        <ChevronDown
                          size={17}
                          className={`flex-shrink-0 ${theme.muted}`}
                        />
                      )}
                    </button>

                    {expanded && (
                      <div
                        className={`px-5 pb-5 text-xs leading-relaxed ${theme.body}`}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Support CTA */}
          <section
            className={`rounded-[26px] border p-5 sm:p-6 ${theme.card}`}
          >
            <div className="grid md:grid-cols-[1fr_auto] gap-5 items-center">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    darkMode
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <LifeBuoy size={20} />
                </div>

                <div>
                  <h3
                    className={`text-sm font-extrabold ${theme.heading}`}
                  >
                    Need personal support?
                  </h3>

                  <p
                    className={`text-xs leading-relaxed mt-1 max-w-2xl ${theme.body}`}
                  >
                    Resources are a starting point. If you have a concern
                    specific to you, contact Guidance and start a private
                    conversation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleNavigation("/message-admin")
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold transition whitespace-nowrap"
              >
                Contact Guidance
                <ArrowRight size={15} />
              </button>
            </div>
          </section>

          {/* Privacy reminder */}
          <section
            className={`rounded-[22px] border px-4 py-4 ${theme.subtle} ${theme.border}`}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="text-green-500 mt-0.5 flex-shrink-0"
              />

              <div>
                <p
                  className={`text-xs font-extrabold ${theme.heading}`}
                >
                  Your support matters.
                </p>

                <p
                  className={`text-[10px] leading-relaxed mt-1 ${theme.muted}`}
                >
                  Use GuidEd when you need guidance, want to report a
                  concern, or simply need a safe place to ask for support.
                </p>
              </div>
            </div>
          </section>

          <div
            className={`flex items-center justify-center gap-2 pb-4 text-[10px] ${theme.muted}`}
          >
            <ShieldCheck size={13} />
            GuidEd Student Guidance Resources
          </div>
        </div>
      </main>
    </div>
  );
}
