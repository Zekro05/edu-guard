import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  FileText,
  HeartHandshake,
  History,
  Info,
  Menu,
  MessageCircle,
  Moon,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ANDROID_APP_URL = "";
const IOS_APP_URL = "";

/* =========================================================
   DATA
========================================================= */

const roles = [
  {
    icon: ShieldCheck,
    title: "Administrator",
    short: "System Management",
    description:
      "Manages users, student information, system settings, reports, records, and accountability logs.",
    items: [
      "Manage student and user records",
      "Review system activities",
      "Manage reports and guidance records",
      "Access system settings",
    ],
    color: "green",
  },
  {
    icon: HeartHandshake,
    title: "Guidance Personnel",
    short: "Student Support",
    description:
      "Reviews student-related information, incidents, cases, interventions, and AI-supported insights.",
    items: [
      "Review incidents and reports",
      "Manage guidance cases",
      "Coordinate interventions",
      "Review AI-supported information",
    ],
    color: "violet",
  },
  {
    icon: ClipboardList,
    title: "Teacher",
    short: "Student Information",
    description:
      "Provides relevant student information and reports according to the access assigned by the school.",
    items: [
      "Provide student-related information",
      "Submit relevant reports",
      "Receive appropriate updates",
      "Work within assigned permissions",
    ],
    color: "blue",
  },
  {
    icon: Smartphone,
    title: "Student",
    short: "Student Access",
    description:
      "Uses the mobile experience for relevant student-facing functions, notifications, and guidance-related updates.",
    items: [
      "Receive notifications",
      "Access available student functions",
      "Submit information when permitted",
      "View relevant guidance updates",
    ],
    color: "amber",
  },
];

const systemModules = [
  {
    icon: Users,
    number: "01",
    title: "Student Management",
    description:
      "Centralized student profiles and information used throughout the guidance process.",
  },
  {
    icon: ClipboardList,
    number: "02",
    title: "Incident & Reports",
    description:
      "Records and organizes student-related incidents and submitted reports for review.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Cases & Guidance",
    description:
      "Helps guidance personnel organize cases and follow the progress of student support.",
  },
  {
    icon: Activity,
    number: "04",
    title: "Interventions",
    description:
      "Tracks intervention activities and connects them to the appropriate guidance case.",
  },
  {
    icon: Bell,
    number: "05",
    title: "Notifications",
    description:
      "Provides relevant updates about incidents, guidance activities, and system events.",
  },
  {
    icon: BarChart3,
    number: "06",
    title: "Analytics & Reports",
    description:
      "Presents summaries and data views that help school personnel understand recorded information.",
  },
  {
    icon: BrainCircuit,
    number: "07",
    title: "AI-Supported Analysis",
    description:
      "Uses AI to analyze available information and provide additional context for human review.",
  },
  {
    icon: History,
    number: "08",
    title: "History & Logs",
    description:
      "Records relevant system activities to support accountability and traceability.",
  },
];

const workflow = [
  {
    number: "01",
    icon: FileText,
    title: "Record",
    description:
      "Student information, incidents, and relevant reports are recorded in the system.",
  },
  {
    number: "02",
    icon: Search,
    title: "Review",
    description:
      "Authorized personnel examine the available information and determine what requires attention.",
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "Analyze",
    description:
      "Available data and AI-supported analysis can provide additional context and identify patterns.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Decide",
    description:
      "School personnel review the information and determine the appropriate guidance action.",
  },
  {
    number: "05",
    icon: HeartHandshake,
    title: "Intervene",
    description:
      "Guidance interventions can be recorded, organized, and connected to the student case.",
  },
  {
    number: "06",
    icon: Activity,
    title: "Monitor",
    description:
      "Relevant records and intervention progress remain available for continued guidance.",
  },
];

/* =========================================================
   ANIMATION
========================================================= */

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeLeft = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.65,
      ease: "easeOut",
    },
  },
};

const fadeRight = {
  hidden: {
    opacity: 0,
    x: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.65,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  darkMode,
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="mx-auto max-w-3xl"
    >
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-[#2E7D32]" />

        <span
          className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${
            darkMode ? "text-green-300" : "text-[#2E7D32]"
          }`}
        >
          {eyebrow}
        </span>
      </div>

      <h2
        className={`mt-5 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl ${
          darkMode ? "text-white" : "text-slate-900"
        }`}
      >
        {title}{" "}
        <span className={darkMode ? "text-green-300" : "text-[#2E7D32]"}>
          {highlight}
        </span>
      </h2>

      <p
        className={`mt-5 max-w-2xl text-sm leading-7 sm:text-base ${
          darkMode ? "text-green-100/60" : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </motion.div>
  );
}

/* =========================================================
   THEME TOGGLE
========================================================= */

function ThemeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      onClick={() => setDarkMode((prev) => !prev)}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
        darkMode
          ? "border-white/10 bg-white/5 text-green-200 hover:border-green-400/30 hover:bg-green-400/10"
          : "border-slate-200 bg-white text-slate-600 hover:border-green-200 hover:bg-green-50 hover:text-[#1B5E20]"
      }`}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: darkMode ? 180 : 0,
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 0.35 }}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </button>
  );
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function FloatingDot({ className = "" }) {
  return (
    <motion.span
      animate={{
        y: [0, -10, 0],
        opacity: [0.2, 0.6, 0.2],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute h-1.5 w-1.5 rounded-full bg-green-400 ${className}`}
    />
  );
}

function ModuleIcon({ icon: Icon, darkMode }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
        darkMode
          ? "bg-green-400/10 text-green-300"
          : "bg-green-50 text-[#1B5E20]"
      }`}
    >
      <Icon size={20} strokeWidth={1.8} />
    </div>
  );
}

/* =========================================================
   LANDING PAGE
========================================================= */

function LandingPage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("guided-theme");

      if (savedTheme === "dark") return true;
      if (savedTheme === "light") return false;

      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}

    document.documentElement.style.colorScheme = darkMode
      ? "dark"
      : "light";
  }, [darkMode]);

  const goToLogin = () => {
    navigate("/login");
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const navItems = [
    {
      label: "Overview",
      id: "overview",
    },
    {
      label: "Users",
      id: "users",
    },
    {
      label: "Modules",
      id: "modules",
    },
    {
      label: "Workflow",
      id: "workflow",
    },
    {
      label: "AI",
      id: "ai",
    },
  ];

  const pageBg = darkMode ? "bg-[#06150A]" : "bg-[#F8FAF8]";
  const cardBg = darkMode ? "bg-[#0D2413]" : "bg-white";
  const softBg = darkMode ? "bg-[#081C0D]" : "bg-[#F5F8F5]";
  const mainText = darkMode ? "text-white" : "text-slate-900";
  const bodyText = darkMode ? "text-green-100/60" : "text-slate-500";
  const border = darkMode ? "border-white/10" : "border-slate-200";

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-500 ${pageBg}`}
    >
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-2xl transition-colors duration-500 ${
          darkMode
            ? "border-white/10 bg-[#06150A]/90"
            : "border-slate-200/70 bg-white/90"
        }`}
      >
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <button
            onClick={() => scrollToSection("overview")}
            className="flex items-center gap-3 text-left"
          >
            <img
              src="/school-logo.png"
              alt="Our Lady of the Holy Rosary School"
              className="h-10 w-10 object-contain"
            />

            <div>
              <div
                className={`font-heading text-xl font-extrabold tracking-tight ${
                  darkMode ? "text-white" : "text-[#0B3D18]"
                }`}
              >
                Guid
                <span
                  className={
                    darkMode ? "text-green-300" : "text-[#2E7D32]"
                  }
                >
                  Ed
                </span>
              </div>

              <div
                className={`text-[8px] font-bold uppercase tracking-[0.15em] ${
                  darkMode ? "text-green-100/40" : "text-slate-400"
                }`}
              >
                Student Guidance
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  darkMode
                    ? "text-green-100/55 hover:bg-white/5 hover:text-green-300"
                    : "text-slate-500 hover:bg-green-50 hover:text-[#1B5E20]"
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="ml-2">
              <ThemeToggle
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </div>

            <button
              onClick={goToLogin}
              className="ml-2 flex items-center gap-2 rounded-xl bg-[#1B5E20] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0B3D18]"
            >
              Sign In
              <ArrowRight size={15} />
            </button>
          </nav>

          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`rounded-xl border p-2.5 lg:hidden ${
              darkMode
                ? "border-white/10 text-green-200"
                : "border-slate-200 text-[#1B5E20]"
            }`}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: menuOpen ? "auto" : 0,
            opacity: menuOpen ? 1 : 0,
          }}
          className={`overflow-hidden border-t lg:hidden ${
            darkMode
              ? "border-white/10 bg-[#071F0D]"
              : "border-slate-100 bg-white"
          }`}
        >
          <nav className="flex flex-col gap-1 px-5 py-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                  darkMode
                    ? "text-green-100/60 hover:bg-white/5 hover:text-green-300"
                    : "text-slate-600 hover:bg-green-50 hover:text-[#1B5E20]"
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="mt-2 flex items-center justify-between rounded-xl px-4 py-2">
              <span
                className={`text-sm font-semibold ${
                  darkMode ? "text-green-100/60" : "text-slate-600"
                }`}
              >
                {darkMode ? "Light Mode" : "Dark Mode"}
              </span>

              <ThemeToggle
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            </div>

            <button
              onClick={goToLogin}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#1B5E20] px-4 py-3 text-sm font-bold text-white"
            >
              Sign In
              <ArrowRight size={16} />
            </button>
          </nav>
        </motion.div>
      </header>

      {/* =====================================================
          HERO / SYSTEM OVERVIEW
      ====================================================== */}

      <section
        id="overview"
        className={`relative scroll-mt-20 overflow-hidden border-b pt-28 transition-colors duration-500 sm:pt-32 ${
          darkMode
            ? "bg-gradient-to-br from-[#06150A] via-[#071F0D] to-[#0B3D18] border-white/10"
            : "bg-gradient-to-br from-white via-[#F8FCF8] to-[#EEF7EF] border-green-100"
        }`}
      >
        <FloatingDot className="left-[12%] top-[25%]" />
        <FloatingDot className="left-[45%] top-[18%]" />
        <FloatingDot className="right-[18%] top-[30%]" />
        <FloatingDot className="right-[10%] bottom-[20%]" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-10 lg:pb-28">
          {/* LEFT */}

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                  darkMode
                    ? "border-green-400/20 bg-green-400/10 text-green-300"
                    : "border-green-100 bg-white text-[#1B5E20]"
                }`}
              >
                <Info size={12} />
                System Overview
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className={`mt-7 max-w-3xl font-heading text-[42px] font-extrabold leading-[1.06] tracking-[-1.8px] sm:text-5xl lg:text-[58px] ${mainText}`}
            >
              GuidEd is a
              <span
                className={`block ${
                  darkMode ? "text-green-300" : "text-[#2E7D32]"
                }`}
              >
                Student Guidance
              </span>
              Management System.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className={`mt-7 max-w-2xl text-sm leading-7 sm:text-base ${bodyText}`}
            >
              GuidEd is a centralized platform for managing student
              information, incidents, reports, guidance cases, interventions,
              notifications, analytics, and AI-supported analysis.
            </motion.p>

            <motion.p
              variants={fadeUp}
              className={`mt-4 max-w-2xl text-sm leading-7 ${bodyText}`}
            >
              It is designed for the guidance and student-support processes of
              <strong
                className={`ml-1 ${
                  darkMode ? "text-green-300" : "text-[#1B5E20]"
                }`}
              >
                Our Lady of the Holy Rosary School – General Trias Campus.
              </strong>
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <button
                onClick={() => scrollToSection("modules")}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#1B5E20] px-6 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0B3D18]"
              >
                Explore System Modules
                <ArrowRight size={17} />
              </button>

              <button
                onClick={goToLogin}
                className={`inline-flex items-center justify-center gap-3 rounded-xl border px-6 py-4 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                  darkMode
                    ? "border-white/10 bg-white/5 text-green-200 hover:bg-white/10"
                    : "border-slate-200 bg-white text-[#1B5E20] hover:bg-green-50"
                }`}
              >
                Sign In
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className={`mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t pt-6 ${
                darkMode ? "border-white/10" : "border-slate-200"
              }`}
            >
              {[
                "Student Records",
                "Incident Monitoring",
                "Guidance Cases",
                "AI-Supported Analysis",
              ].map((item) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    darkMode ? "text-green-100/50" : "text-slate-500"
                  }`}
                >
                  <CheckCircle2
                    size={14}
                    className="text-[#2E7D32]"
                  />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* SYSTEM MAP */}

          <motion.div
            variants={fadeRight}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            <div
              className={`rounded-[2rem] border p-4 shadow-2xl sm:p-5 ${
                darkMode
                  ? "border-white/10 bg-[#0D2413] shadow-black/30"
                  : "border-slate-200/80 bg-white shadow-green-900/10"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-2 pb-4 ${
                  darkMode ? "border-white/10" : "border-slate-100"
                }`}
              >
                <div>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-[0.15em] ${
                      darkMode ? "text-green-300" : "text-[#2E7D32]"
                    }`}
                  >
                    GuidEd Platform
                  </p>

                  <h3
                    className={`mt-1 font-heading text-lg font-extrabold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    System at a Glance
                  </h3>
                </div>

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-green-400/10 text-green-300"
                      : "bg-green-50 text-[#1B5E20]"
                  }`}
                >
                  <Database size={17} />
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3">
                {systemModules.slice(0, 6).map((module, index) => {
                  const Icon = module.icon;

                  return (
                    <motion.div
                      key={module.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.35 + index * 0.08,
                      }}
                      className={`rounded-xl border p-4 ${
                        darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-slate-100 bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            darkMode
                              ? "bg-green-400/10 text-green-300"
                              : "bg-green-50 text-[#2E7D32]"
                          }`}
                        >
                          <Icon size={15} />
                        </div>

                        <span
                          className={`text-[10px] font-bold leading-4 ${
                            darkMode ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {module.title}
                        </span>
                      </div>

                      <p
                        className={`mt-3 text-[9px] leading-5 ${
                          darkMode
                            ? "text-green-100/35"
                            : "text-slate-400"
                        }`}
                      >
                        {module.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <div
                className={`mt-4 rounded-xl border p-4 ${
                  darkMode
                    ? "border-green-400/15 bg-green-400/5"
                    : "border-green-100 bg-green-50/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      darkMode
                        ? "bg-green-400/10 text-green-300"
                        : "bg-white text-[#1B5E20]"
                    }`}
                  >
                    <BrainCircuit size={17} />
                  </div>

                  <div>
                    <p
                      className={`text-xs font-extrabold ${
                        darkMode ? "text-white" : "text-slate-700"
                      }`}
                    >
                      AI-Supported Analysis
                    </p>

                    <p
                      className={`mt-0.5 text-[9px] ${
                        darkMode
                          ? "text-green-100/40"
                          : "text-slate-400"
                      }`}
                    >
                      Additional information for human review
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <button
          onClick={() => scrollToSection("users")}
          className={`mx-auto mb-8 flex flex-col items-center gap-2 ${
            darkMode ? "text-green-100/35" : "text-slate-400"
          }`}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
            Understand the users
          </span>

          <ChevronDown size={17} className="animate-bounce" />
        </button>
      </section>

      {/* =====================================================
          WHAT IS GUIDED
      ====================================================== */}

      <section
        className={`py-24 transition-colors duration-500 sm:py-28 ${
          darkMode ? "bg-[#06150A]" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid items-start gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <span
                className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${
                  darkMode ? "text-green-300" : "text-[#2E7D32]"
                }`}
              >
                What is GuidEd?
              </span>

              <h2
                className={`mt-5 font-heading text-3xl font-extrabold leading-tight sm:text-4xl ${mainText}`}
              >
                One system for the
                <span className="block text-[#2E7D32]">
                  guidance process.
                </span>
              </h2>
            </motion.div>

            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-5"
            >
              <p className={`text-sm leading-7 sm:text-base ${bodyText}`}>
                GuidEd provides a centralized digital environment for
                information related to student guidance and discipline
                management.
              </p>

              <p className={`text-sm leading-7 sm:text-base ${bodyText}`}>
                Instead of keeping important information across separate
                processes, the system connects student records, incidents,
                reports, cases, interventions, notifications, analytics, and
                history logs.
              </p>

              <div
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-green-100 bg-green-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Info
                    size={19}
                    className="mt-0.5 shrink-0 text-[#2E7D32]"
                  />

                  <div>
                    <p
                      className={`text-sm font-bold ${
                        darkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      The purpose is organization and support.
                    </p>

                    <p
                      className={`mt-2 text-xs leading-6 ${
                        darkMode
                          ? "text-green-100/45"
                          : "text-slate-500"
                      }`}
                    >
                      GuidEd does not replace the judgment of school
                      personnel. It provides the information and tools they
                      need to review situations and coordinate appropriate
                      guidance actions.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          USERS
      ====================================================== */}

      <section
        id="users"
        className={`scroll-mt-20 border-y py-24 transition-colors duration-500 sm:py-28 ${softBg} ${
          darkMode ? "border-white/10" : "border-slate-100"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="Who Uses GuidEd?"
            title="Different Users,"
            highlight="Different Access"
            description="GuidEd is designed around the responsibilities of different school users. Available functions depend on the user's assigned role and permissions."
            darkMode={darkMode}
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {roles.map((role, index) => {
              const Icon = role.icon;

              return (
                <motion.article
                  key={role.title}
                  variants={fadeUp}
                  className={`rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                    darkMode
                      ? "border-white/10 bg-[#0D2413]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        darkMode
                          ? "bg-green-400/10 text-green-300"
                          : "bg-green-50 text-[#1B5E20]"
                      }`}
                    >
                      <Icon size={21} />
                    </div>

                    <span
                      className={`text-[10px] font-extrabold ${
                        darkMode
                          ? "text-green-100/20"
                          : "text-slate-300"
                      }`}
                    >
                      0{index + 1}
                    </span>
                  </div>

                  <p
                    className={`mt-6 text-[9px] font-bold uppercase tracking-wider ${
                      darkMode ? "text-green-300" : "text-[#2E7D32]"
                    }`}
                  >
                    {role.short}
                  </p>

                  <h3
                    className={`mt-1 font-heading text-lg font-extrabold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {role.title}
                  </h3>

                  <p className={`mt-3 text-xs leading-6 ${bodyText}`}>
                    {role.description}
                  </p>

                  <div
                    className={`mt-5 border-t pt-5 ${
                      darkMode ? "border-white/10" : "border-slate-100"
                    }`}
                  >
                    <ul className="space-y-2.5">
                      {role.items.map((item) => (
                        <li
                          key={item}
                          className={`flex items-start gap-2 text-[10px] leading-5 ${
                            darkMode
                              ? "text-green-100/45"
                              : "text-slate-500"
                          }`}
                        >
                          <CheckCircle2
                            size={12}
                            className="mt-1 shrink-0 text-[#2E7D32]"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          MODULES
      ====================================================== */}

      <section
        id="modules"
        className={`scroll-mt-20 py-24 transition-colors duration-500 sm:py-28 ${
          darkMode ? "bg-[#06150A]" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="System Modules"
            title="What Can You Do"
            highlight="Inside GuidEd?"
            description="The platform connects the major activities involved in student information management, incident review, guidance, intervention, communication, and reporting."
            darkMode={darkMode}
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {systemModules.map((module) => {
              const Icon = module.icon;

              return (
                <motion.article
                  key={module.title}
                  variants={fadeUp}
                  className={`group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
                    darkMode
                      ? "border-white/10 bg-[#0D2413] hover:border-green-400/20"
                      : "border-slate-200 bg-white hover:border-green-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <ModuleIcon icon={Icon} darkMode={darkMode} />

                    <span
                      className={`font-heading text-xs font-extrabold ${
                        darkMode
                          ? "text-white/15"
                          : "text-slate-200"
                      }`}
                    >
                      {module.number}
                    </span>
                  </div>

                  <h3
                    className={`mt-5 text-sm font-extrabold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {module.title}
                  </h3>

                  <p
                    className={`mt-2 text-xs leading-6 ${
                      darkMode
                        ? "text-green-100/45"
                        : "text-slate-500"
                    }`}
                  >
                    {module.description}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          WORKFLOW
      ====================================================== */}

      <section
        id="workflow"
        className={`scroll-mt-20 border-y py-24 transition-colors duration-500 sm:py-28 ${softBg} ${
          darkMode ? "border-white/10" : "border-slate-100"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="How It Works"
            title="From Information to"
            highlight="Student Support"
            description="GuidEd connects several stages of the guidance process so authorized personnel can move from recorded information to review, action, and monitoring."
            darkMode={darkMode}
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {workflow.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  variants={fadeUp}
                  className={`relative rounded-2xl border p-6 ${
                    darkMode
                      ? "border-white/10 bg-[#0D2413]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        darkMode
                          ? "bg-green-400/10 text-green-300"
                          : "bg-green-50 text-[#1B5E20]"
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <span
                      className={`font-heading text-2xl font-extrabold ${
                        darkMode
                          ? "text-white/10"
                          : "text-slate-100"
                      }`}
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3
                    className={`mt-6 text-lg font-extrabold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {step.title}
                  </h3>

                  <p className={`mt-3 text-xs leading-6 ${bodyText}`}>
                    {step.description}
                  </p>

                  {index < workflow.length - 1 && (
                    <div
                      className={`absolute -bottom-3 left-1/2 hidden h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border md:flex lg:hidden ${
                        darkMode
                          ? "border-white/10 bg-[#0D2413]"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <ChevronDown size={12} />
                    </div>
                  )}
                </motion.article>
              );
            })}
          </motion.div>

          <div
            className={`mx-auto mt-8 hidden max-w-5xl items-center justify-between lg:flex ${
              darkMode ? "text-green-300/40" : "text-green-700/40"
            }`}
          >
            {workflow.slice(0, 5).map((step) => (
              <React.Fragment key={step.number}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />

                <span className="h-px flex-1 bg-current" />
              </React.Fragment>
            ))}

            <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
          </div>
        </div>
      </section>

      {/* =====================================================
          AI
      ====================================================== */}

      <section
        id="ai"
        className={`scroll-mt-20 py-24 transition-colors duration-500 sm:py-28 ${
          darkMode ? "bg-[#06150A]" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div
            className={`overflow-hidden rounded-[2rem] border ${
              darkMode
                ? "border-white/10 bg-[#0D2413]"
                : "border-green-100 bg-[#F7FBF7]"
            }`}
          >
            <div className="grid items-center gap-12 p-7 sm:p-10 lg:grid-cols-[1fr_0.85fr] lg:p-14">
              <motion.div
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <span
                  className={`inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] ${
                    darkMode ? "text-green-300" : "text-[#2E7D32]"
                  }`}
                >
                  <BrainCircuit size={14} />
                  AI in GuidEd
                </span>

                <h2
                  className={`mt-5 font-heading text-3xl font-extrabold leading-tight sm:text-4xl ${mainText}`}
                >
                  What does the AI
                  <span className="block text-[#2E7D32]">
                    actually do?
                  </span>
                </h2>

                <p className={`mt-6 text-sm leading-7 ${bodyText}`}>
                  GuidEd uses AI-supported analysis to help interpret available
                  student-related information and provide additional context
                  during review.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    {
                      icon: Activity,
                      title: "Analyze available information",
                      text: "AI can process relevant input and identify useful patterns or observations.",
                    },
                    {
                      icon: BarChart3,
                      title: "Provide additional context",
                      text: "Results can help personnel understand recorded information from another perspective.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Keep human review in control",
                      text: "AI output is intended as decision support and does not independently determine disciplinary action.",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className={`flex gap-3 rounded-xl border p-4 ${
                          darkMode
                            ? "border-white/10 bg-white/[0.03]"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            darkMode
                              ? "bg-green-400/10 text-green-300"
                              : "bg-green-50 text-[#1B5E20]"
                          }`}
                        >
                          <Icon size={16} />
                        </div>

                        <div>
                          <h3
                            className={`text-xs font-extrabold ${
                              darkMode
                                ? "text-white"
                                : "text-slate-800"
                            }`}
                          >
                            {item.title}
                          </h3>

                          <p
                            className={`mt-1 text-[10px] leading-5 ${
                              darkMode
                                ? "text-green-100/40"
                                : "text-slate-400"
                            }`}
                          >
                            {item.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* AI VISUAL */}

              <motion.div
                variants={fadeRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="relative"
              >
                <div
                  className={`rounded-3xl border p-5 ${
                    darkMode
                      ? "border-white/10 bg-[#071F0D]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          darkMode
                            ? "text-green-300"
                            : "text-[#2E7D32]"
                        }`}
                      >
                        AI Analysis
                      </p>

                      <h3
                        className={`mt-1 text-base font-extrabold ${
                          darkMode ? "text-white" : "text-slate-800"
                        }`}
                      >
                        Review Support
                      </h3>
                    </div>

                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        darkMode
                          ? "bg-violet-400/10 text-violet-300"
                          : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      <Sparkles size={17} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div
                      className={`rounded-xl border p-4 ${
                        darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-bold ${
                            darkMode
                              ? "text-green-100/40"
                              : "text-slate-400"
                          }`}
                        >
                          DATA INPUT
                        </span>

                        <CheckCircle2
                          size={13}
                          className="text-[#2E7D32]"
                        />
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/20">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: "82%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1 }}
                          className="h-full rounded-full bg-[#4CAF50]"
                        />
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-center rounded-xl border py-5 ${
                        darkMode
                          ? "border-green-400/15 bg-green-400/5"
                          : "border-green-100 bg-green-50"
                      }`}
                    >
                      <div className="text-center">
                        <BrainCircuit
                          size={27}
                          className="mx-auto text-[#4CAF50]"
                        />

                        <p
                          className={`mt-2 text-xs font-extrabold ${
                            darkMode ? "text-white" : "text-slate-800"
                          }`}
                        >
                          AI Processing
                        </p>

                        <p
                          className={`mt-1 text-[9px] ${
                            darkMode
                              ? "text-green-100/40"
                              : "text-slate-400"
                          }`}
                        >
                          Pattern and information analysis
                        </p>
                      </div>
                    </div>

                    <div
                      className={`rounded-xl border p-4 ${
                        darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            darkMode
                              ? "bg-blue-400/10 text-blue-300"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          <MessageCircle size={16} />
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold ${
                              darkMode
                                ? "text-white"
                                : "text-slate-700"
                            }`}
                          >
                            Human Review
                          </p>

                          <p
                            className={`mt-0.5 text-[9px] ${
                              darkMode
                                ? "text-green-100/40"
                                : "text-slate-400"
                            }`}
                          >
                            Personnel evaluate the result
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WEB + MOBILE
      ====================================================== */}

      <section
        className={`border-y py-24 transition-colors duration-500 sm:py-28 ${
          darkMode
            ? "border-white/10 bg-[#081C0D]"
            : "border-slate-100 bg-[#F7FAF7]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading
            eyebrow="Access"
            title="Web and Mobile"
            highlight="Experiences"
            description="Different parts of GuidEd can be accessed through the web and mobile experiences depending on the user's role and available functions."
            darkMode={darkMode}
          />

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {/* WEB */}

            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className={`rounded-2xl border p-7 sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0D2413]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-green-400/10 text-green-300"
                      : "bg-green-50 text-[#1B5E20]"
                  }`}
                >
                  <Database size={21} />
                </div>

                <div>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      darkMode ? "text-green-300" : "text-[#2E7D32]"
                    }`}
                  >
                    Web Platform
                  </p>

                  <h3
                    className={`mt-1 text-lg font-extrabold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Administration & Guidance
                  </h3>
                </div>
              </div>

              <p className={`mt-5 text-sm leading-7 ${bodyText}`}>
                The web platform provides the broader management environment
                for authorized school personnel.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {[
                  "Dashboard",
                  "Student Management",
                  "Reports",
                  "Cases",
                  "Interventions",
                  "Analytics",
                  "Settings",
                  "History Logs",
                ].map((item) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold ${
                      darkMode
                        ? "border-white/10 bg-white/[0.03] text-green-100/50"
                        : "border-slate-100 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <CheckCircle2
                      size={13}
                      className="text-[#2E7D32]"
                    />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* MOBILE */}

            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className={`rounded-2xl border p-7 sm:p-8 ${
                darkMode
                  ? "border-white/10 bg-[#0D2413]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-blue-400/10 text-blue-300"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Smartphone size={21} />
                </div>

                <div>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      darkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    Mobile Experience
                  </p>

                  <h3
                    className={`mt-1 text-lg font-extrabold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Student-Facing Access
                  </h3>
                </div>
              </div>

              <p className={`mt-5 text-sm leading-7 ${bodyText}`}>
                The mobile experience provides convenient access to
                student-facing functions and relevant guidance notifications.
              </p>

              <div className="mt-6 space-y-2">
                {[
                  {
                    icon: Bell,
                    text: "Receive relevant notifications",
                  },
                  {
                    icon: ClipboardList,
                    text: "Access available student functions",
                  },
                  {
                    icon: MessageCircle,
                    text: "Receive guidance-related updates",
                  },
                  {
                    icon: ShieldCheck,
                    text: "Use access based on assigned permissions",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.text}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${
                        darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={
                          darkMode
                            ? "text-blue-300"
                            : "text-blue-600"
                        }
                      />

                      <span
                        className={`text-xs font-semibold ${
                          darkMode
                            ? "text-green-100/50"
                            : "text-slate-500"
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECURITY / ACCOUNTABILITY
      ====================================================== */}

      <section
        className={`py-24 transition-colors duration-500 sm:py-28 ${
          darkMode ? "bg-[#06150A]" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid items-start gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <span
                className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${
                  darkMode ? "text-green-300" : "text-[#2E7D32]"
                }`}
              >
                Access & Accountability
              </span>

              <h2
                className={`mt-5 font-heading text-3xl font-extrabold leading-tight sm:text-4xl ${mainText}`}
              >
                Information is managed
                <span className="block text-[#2E7D32]">
                  with controlled access.
                </span>
              </h2>

              <p className={`mt-6 text-sm leading-7 ${bodyText}`}>
                GuidEd separates system access according to assigned roles and
                keeps relevant activities traceable through authentication,
                notifications, and history records.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                {
                  icon: ShieldCheck,
                  title: "Authentication",
                  text: "Users access the system through an authenticated account.",
                },
                {
                  icon: Users,
                  title: "Role-Based Access",
                  text: "Available functions depend on the user's assigned role.",
                },
                {
                  icon: Bell,
                  title: "Notifications",
                  text: "Relevant events can be communicated through system notifications.",
                },
                {
                  icon: History,
                  title: "History Logs",
                  text: "Relevant activities can be recorded for accountability and review.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className={`rounded-2xl border p-5 ${
                      darkMode
                        ? "border-white/10 bg-[#0D2413]"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        darkMode
                          ? "bg-green-400/10 text-green-300"
                          : "bg-green-50 text-[#1B5E20]"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <h3
                      className={`mt-5 text-sm font-extrabold ${
                        darkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p
                      className={`mt-2 text-xs leading-6 ${
                        darkMode
                          ? "text-green-100/40"
                          : "text-slate-500"
                      }`}
                    >
                      {item.text}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SCHOOL IDENTITY
      ====================================================== */}

      <section
        className={`border-y py-16 transition-colors duration-500 ${
          darkMode
            ? "border-white/10 bg-[#081C0D]"
            : "border-green-100 bg-[#F8FCF8]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-7 px-5 text-center sm:px-8 md:flex-row md:text-left lg:px-10">
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl p-3 ${
              darkMode ? "bg-white/5" : "bg-white"
            }`}
          >
            <img
              src="/school-logo.png"
              alt="Our Lady of the Holy Rosary School"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2E7D32]">
              Developed for
            </p>

            <h3
              className={`mt-2 font-heading text-xl font-extrabold ${
                darkMode ? "text-white" : "text-slate-800"
              }`}
            >
              Our Lady of the Holy Rosary School
            </h3>

            <p
              className={`mt-1 text-sm ${
                darkMode ? "text-green-100/40" : "text-slate-400"
              }`}
            >
              General Trias Campus
            </p>
          </div>

          <div
            className={`flex flex-wrap justify-center gap-2 md:justify-end`}
          >
            {[
              "Student Records",
              "Guidance",
              "Analytics",
              "AI Support",
            ].map((item) => (
              <span
                key={item}
                className={`rounded-full border px-3 py-2 text-[10px] font-bold ${
                  darkMode
                    ? "border-green-400/15 bg-green-400/5 text-green-300"
                    : "border-green-100 bg-white text-[#2E7D32]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SIMPLE CTA
      ====================================================== */}

      <section
        className={`py-20 transition-colors duration-500 sm:py-24 ${
          darkMode ? "bg-[#06150A]" : "bg-white"
        }`}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-3xl px-5 text-center sm:px-8"
        >
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              darkMode
                ? "bg-green-400/10 text-green-300"
                : "bg-green-50 text-[#1B5E20]"
            }`}
          >
            <img
              src="/school-logo.png"
              alt="School logo"
              className="h-11 w-11 object-contain"
            />
          </div>

          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#2E7D32]">
            GuidEd Platform
          </p>

          <h2
            className={`mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl ${mainText}`}
          >
            Ready to access the system?
          </h2>

          <p className={`mx-auto mt-4 max-w-xl text-sm leading-7 ${bodyText}`}>
            Sign in to access the functions available for your assigned role.
          </p>

          <button
            onClick={goToLogin}
            className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#1B5E20] px-7 py-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0B3D18]"
          >
            Sign In to GuidEd
            <ArrowRight size={17} />
          </button>
        </motion.div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer
        className={`text-white ${
          darkMode ? "bg-[#030D06]" : "bg-[#071F0D]"
        }`}
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.5fr_0.7fr_0.7fr_1fr] lg:px-10">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/school-logo.png"
                alt="School logo"
                className="h-11 w-11 object-contain"
              />

              <div>
                <h3 className="font-heading text-xl font-extrabold">
                  Guid
                  <span className="text-green-400">Ed</span>
                </h3>

                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-green-100/35">
                  Student Guidance
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-green-100/45">
              Student Guidance Management System for Our Lady of the Holy
              Rosary School – General Trias Campus.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-green-300">
              System
            </h4>

            <div className="mt-4 flex flex-col items-start gap-3">
              {[
                ["Overview", "overview"],
                ["Users", "users"],
                ["Modules", "modules"],
                ["Workflow", "workflow"],
                ["AI", "ai"],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="text-sm text-green-100/45 transition-colors hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-green-300">
              Access
            </h4>

            <div className="mt-4 flex flex-col items-start gap-3">
              <button
                onClick={goToLogin}
                className="text-sm text-green-100/45 transition-colors hover:text-white"
              >
                Web Login
              </button>

              <span className="text-sm text-green-100/30">
                Mobile App
                <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[8px]">
                  Coming soon
                </span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-green-300">
              School
            </h4>

            <p className="mt-4 text-sm leading-7 text-green-100/45">
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-5 text-[10px] text-green-100/30 sm:flex-row sm:px-8 lg:px-10">
            <p>© {new Date().getFullYear()} GuidEd. All rights reserved.</p>

            <p>Student Guidance Management System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;