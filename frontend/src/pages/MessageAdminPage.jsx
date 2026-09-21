import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BookOpen,
  Moon,
  Sun,
  Search,
  Send,
  ShieldCheck,
  Clock3,
  CheckCheck,
  RefreshCw,
  ArrowLeft,
  MoreHorizontal,
  HelpCircle,
  Plus,
  FileClock,
} from "lucide-react";
import { API } from "../lib/api.js";
import { useAuthStore } from "../store/authStore";

const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket", "polling"],
});

const getName = (user) =>
  [user?.firstName, user?.middleName, user?.lastName]
    .filter(Boolean)
    .join(" ") ||
  user?.name ||
  user?.fullName ||
  "Admin";

const getPhoto = (user) =>
  user?.profilePhoto || user?.profilePicture || user?.photo || user?.avatar || null;

const isAdmin = (user) => {
  const role = String(user?.role || user?.userType || user?.accountType || "")
    .toLowerCase()
    .trim();
  return ["admin", "administrator"].includes(role);
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Avatar = ({ user, large = false, online = false }) => {
  const name = getName(user);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`relative flex-shrink-0 ${large ? "w-12 h-12" : "w-10 h-10"}`}>
      <div
        className={`w-full h-full rounded-2xl overflow-hidden flex items-center justify-center border ${
          large ? "bg-green-50 border-green-100" : "bg-green-500/10 border-transparent"
        }`}
      >
        {getPhoto(user) ? (
          <img src={getPhoto(user)} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-extrabold text-green-600 text-sm">{initials || "A"}</span>
        )}
      </div>
      {online && (
        <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
      )}
    </div>
  );
};

export default function MessageAdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const messagesEndRef = useRef(null);
  const currentUserRef = useRef(user);
  const activeAdminRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("guided-theme") === "dark";
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminMeta, setAdminMeta] = useState({});
  const [unreadMap, setUnreadMap] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeAdmin, setActiveAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("guided-theme", darkMode ? "dark" : "light");
    } catch {}
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

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

  const studentName = useMemo(() => getName(user), [user]);
  const profilePhoto = getPhoto(user);
  const userId = user?._id || user?.id;

  const Nav = ({ icon, label, path, active = false, onClick }) => (
    <button
      type="button"
      onClick={onClick || (() => path && navigate(path))}
      className={`group flex items-center gap-3 px-3 py-3 rounded-xl w-full text-sm font-semibold transition-all ${
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
        className={`transition-colors ${
          active
            ? darkMode
              ? "text-green-400"
              : "text-green-600"
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

          <Nav icon={<FileClock size={18} />} label="My History" path="/my-history"/>

          <Nav
            icon={<MessageSquare size={18} />}
            label="Messages"
            active
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

        <Nav
          icon={<BookOpen size={18} />}
          label="Guidance Resources"
          path="/guidance"
        />

        <Nav
          icon={<HelpCircle size={18} />}
          label="Get Support"
          path="/messages"
        />

        <p
          className={`px-3 mt-7 mb-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}
        >
          System
        </p>

        <Nav
          icon={<Settings size={18} />}
          label="Settings"
          path="/settings"
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
                className={`text-[11px] uppercase tracking-wider font-bold ${theme.muted}`}
              >
                Student
              </p>
              <p className={`text-sm font-bold truncate ${theme.heading}`}>
                {studentName}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDarkMode((value) => !value)}
          className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border text-sm font-semibold transition ${
            darkMode
              ? "bg-[#101F15] border-[#24392A] text-gray-200 hover:bg-[#15261A]"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-3">
            {darkMode ? (
              <Sun size={17} className="text-amber-300" />
            ) : (
              <Moon size={17} className="text-gray-500" />
            )}
            {darkMode ? "Light mode" : "Dark mode"}
          </span>

          <span
            className={`w-9 h-5 rounded-full p-0.5 transition ${
              darkMode ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                darkMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={logout}
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

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await API.get(`/api/notifications/${userId}/unread`);
      const data = Array.isArray(response.data) ? response.data : response.data?.notifications || response.data?.data || [];
      setNotifications(data.filter((item) => !item.isRead));
    } catch (error) {
      console.warn("Notifications unavailable", error);
    }
  }, [userId]);

  const loadAdmins = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      const response = await API.get("/api/users");
      const data = Array.isArray(response.data) ? response.data : response.data?.users || [];
      const adminAccounts = data.filter((account) => String(account._id) !== String(userId) && isAdmin(account));

      setAdmins(adminAccounts);

      const checks = await Promise.all(
        adminAccounts.map(async (admin) => {
          const chatId = [String(userId), String(admin._id)].sort().join("-");
          try {
            const result = await API.get(`/api/messages/${chatId}`);
            const chatMessages = Array.isArray(result.data?.messages) ? result.data.messages : [];
            const lastMessage = chatMessages.at(-1) || null;
            const unread = chatMessages.filter((message) => String(message.receiver) === String(userId) && message.seen === false).length;
            return { id: String(admin._id), lastMessage, unread };
          } catch {
            return { id: String(admin._id), lastMessage: null, unread: 0 };
          }
        }),
      );

      const meta = {};
      const unread = {};
      checks.forEach(({ id, lastMessage, unread: count }) => {
        if (lastMessage) meta[id] = { text: lastMessage.text || "", at: lastMessage.createdAt || lastMessage.updatedAt };
        if (count) unread[id] = count;
      });
      setAdminMeta(meta);
      setUnreadMap(unread);
    } catch (error) {
      console.error("Failed to load admin accounts:", error);
      setAdmins([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAdmins();
    loadNotifications();
  }, [loadAdmins, loadNotifications]);

  useEffect(() => {
    if (!userId) return;
    const id = String(userId);
    socket.emit("register", id);

    const handleOnline = (online) => setOnlineUsers((online || []).map(String));
    const handleReceive = (message) => {
      if (!message) return;
      const currentId = String(currentUserRef.current?._id || "");
      const sender = String(message.sender);
      const receiver = String(message.receiver);
      if (sender !== currentId && receiver !== currentId) return;

      const otherId = sender === currentId ? receiver : sender;
      setAdminMeta((prev) => ({ ...prev, [otherId]: { text: message.text || "", at: message.createdAt || new Date().toISOString() } }));

      if (activeAdminRef.current && String(activeAdminRef.current._id) === otherId) {
        setMessages((prev) => {
          if (message.clientMessageId && prev.some((item) => item.clientMessageId === message.clientMessageId)) {
            return prev.map((item) => item.clientMessageId === message.clientMessageId ? { ...message, pending: false } : item);
          }
          if (prev.some((item) => item._id && message._id && String(item._id) === String(message._id))) return prev;
          return [...prev, message];
        });
      } else if (sender !== currentId) {
        setUnreadMap((prev) => ({ ...prev, [otherId]: (prev[otherId] || 0) + 1 }));
      }
    };

    socket.on("online_users", handleOnline);
    socket.on("receive_message", handleReceive);
    return () => {
      socket.off("online_users", handleOnline);
      socket.off("receive_message", handleReceive);
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredAdmins = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...admins]
      .filter((admin) => !term || getName(admin).toLowerCase().includes(term) || String(admin.email || "").toLowerCase().includes(term))
      .sort((a, b) => {
        const at = new Date(adminMeta[a._id]?.at || 0).getTime();
        const bt = new Date(adminMeta[b._id]?.at || 0).getTime();
        return bt - at;
      });
  }, [admins, search, adminMeta]);

  const openChat = async (admin) => {
    if (!admin?._id || !userId) return;
    setActiveAdmin(admin);
    activeAdminRef.current = admin;
    setMobileChatOpen(true);
    setUnreadMap((prev) => ({ ...prev, [admin._id]: 0 }));

    const chatId = [String(userId), String(admin._id)].sort().join("-");
    try {
      const response = await API.get(`/api/messages/${chatId}`);
      const chatMessages = Array.isArray(response.data?.messages) ? response.data.messages : [];
      setMessages(chatMessages);
      try {
        await API.patch(`/api/messages/${chatId}/seen`, { userId });
        setMessages((prev) => prev.map((message) => String(message.receiver) === String(userId) ? { ...message, seen: true } : message));
      } catch (error) {
        console.warn("Could not mark messages as seen", error);
      }
    } catch (error) {
      console.error("Failed to open admin conversation", error);
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !activeAdmin || !userId) return;
    const text = input.trim();
    const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();
    const optimistic = { _id: clientMessageId, clientMessageId, sender: String(userId), receiver: String(activeAdmin._id), text, createdAt, seen: false, pending: true };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setAdminMeta((prev) => ({ ...prev, [activeAdmin._id]: { text, at: createdAt } }));

    socket.emit("send_message", {
      sender: String(userId),
      receiver: String(activeAdmin._id),
      text,
      clientMessageId,
    }, (saved) => {
      if (saved?.error) {
        setMessages((prev) => prev.filter((message) => message.clientMessageId !== clientMessageId));
        return;
      }
      if (saved?.message) {
        setMessages((prev) => prev.map((message) => message.clientMessageId === clientMessageId ? { ...saved.message, pending: false } : message));
      }
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put(`/api/notifications/${userId}/read-all`);
      setNotifications([]);
    } catch (error) {
      console.warn("Unable to mark notifications", error);
    }
  };

  const ChatBubble = ({ message }) => {
    const mine = String(message.sender) === String(userId);
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[78%] sm:max-w-[65%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
          <div className={`px-4 py-3 rounded-2xl text-sm leading-6 ${mine ? "bg-green-600 text-white rounded-br-md" : darkMode ? "bg-[#142319] text-gray-100 border border-[#213528] rounded-bl-md" : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm"}`}>
            {message.text}
          </div>
          <div className={`mt-1 flex items-center gap-1.5 text-[10px] ${theme.muted}`}>
            <span>{formatTime(message.createdAt || message.updatedAt)}</span>
            {mine && (message.pending ? <Clock3 size={11} /> : <CheckCheck size={12} className={message.seen ? "text-green-500" : ""} />)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen w-screen flex overflow-hidden transition-colors duration-300 ${theme.page}`}>
      <aside className={`hidden lg:flex w-[250px] xl:w-[270px] border-r flex-col justify-between px-4 xl:px-5 py-5 xl:py-6 flex-shrink-0 ${theme.sidebar} ${theme.border}`}>
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className={`fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] shadow-2xl flex flex-col justify-between px-5 py-5 lg:hidden ${theme.sidebar}`}>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <header className={`flex-shrink-0 sticky top-0 z-30 backdrop-blur-xl border-b ${darkMode ? "bg-[#07110B]/90 border-[#17251B]" : "bg-[#F7F9F8]/90 border-gray-100"}`}>
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => setMobileMenuOpen(true)} className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center ${darkMode ? "bg-[#0D1A12] border-[#24392A] text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}><Menu size={19} /></button>
              <div className="min-w-0">
                <div className={`hidden sm:flex items-center gap-2 text-sm mb-1 ${theme.muted}`}>
                  <span>Student Portal</span><ChevronRight size={12} /><span className="text-green-500 font-medium">Messages</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight truncate ${theme.heading}`}>Messages</h2>
                <p className={`text-sm mt-1 ${theme.body}`}>Connect directly with the GuidEd administrators for support.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button" onClick={loadAdmins} className={`hidden sm:inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold ${darkMode ? "bg-[#0D1A12] border-[#24392A] text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}>
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
              <div className="relative">
                <button type="button" onClick={() => setNotificationOpen((v) => !v)} className={`relative w-10 h-10 rounded-xl border flex items-center justify-center ${darkMode ? "bg-[#0D1A12] border-[#24392A] text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
                  <Bell size={17} />
                  {notifications.length > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{notifications.length > 9 ? "9+" : notifications.length}</span>}
                </button>
                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={`absolute right-0 mt-3 w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border shadow-2xl overflow-hidden z-50 ${theme.card}`}>
                      <div className={`p-4 border-b flex items-center justify-between ${theme.border}`}><p className={`font-extrabold ${theme.heading}`}>Notifications</p><button type="button" onClick={markAllAsRead} className="text-xs font-bold text-green-500">Mark all read</button></div>
                      <div className="max-h-80 overflow-y-auto">{notifications.length === 0 ? <p className={`p-6 text-center text-sm ${theme.muted}`}>No unread notifications.</p> : notifications.map((item) => <div key={item._id || item.id} className={`p-4 border-b ${theme.border}`}><p className={`font-bold text-sm ${theme.heading}`}>{item.title || "Notification"}</p><p className={`text-sm mt-1 ${theme.body}`}>{item.message || item.body || "You have a new notification."}</p></div>)}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 p-3 sm:p-5 lg:p-6">
          <section className={`h-full min-h-0 rounded-[26px] border shadow-sm overflow-hidden flex ${theme.card}`}>
            <aside className={`${mobileChatOpen ? "hidden lg:flex" : "flex"} w-full lg:w-[330px] xl:w-[370px] flex-col border-r ${theme.border}`}>
              <div className={`p-5 border-b ${theme.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${theme.muted}`}>Admin Support</p>
                    <h3 className={`text-xl font-extrabold mt-1 ${theme.heading}`}>Message an Admin</h3>
                    <p className={`text-sm mt-1 ${theme.body}`}>Only verified admin accounts are available here.</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center"><ShieldCheck size={20} /></div>
                </div>
                <div className={`mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.subtle} ${theme.border}`}>
                  <Search size={16} className={theme.muted} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search admins..." className={`w-full bg-transparent outline-none text-sm ${theme.heading} placeholder:${theme.muted}`} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {loading ? (
                  <div className={`p-8 text-center text-sm ${theme.muted}`}>Loading admin accounts...</div>
                ) : filteredAdmins.length === 0 ? (
                  <div className={`m-2 p-7 rounded-2xl border text-center ${theme.subtle} ${theme.border}`}>
                    <ShieldCheck size={26} className="mx-auto text-green-500" />
                    <p className={`font-extrabold mt-3 ${theme.heading}`}>No admin accounts found</p>
                    <p className={`text-sm mt-1 ${theme.body}`}>Admin accounts configured in GuidEd will appear here.</p>
                  </div>
                ) : (
                  filteredAdmins.map((admin) => {
                    const active = String(activeAdmin?._id) === String(admin._id);
                    const meta = adminMeta[admin._id];
                    const unread = unreadMap[admin._id] || 0;
                    const online = onlineUsers.includes(String(admin._id));
                    return (
                      <button key={admin._id} type="button" onClick={() => openChat(admin)} className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 mb-1 ${active ? (darkMode ? "bg-green-500/10" : "bg-green-50") : "hover:bg-green-500/5"}`}>
                        <Avatar user={admin} online={online} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-extrabold text-sm truncate ${theme.heading}`}>{getName(admin)}</p>
                            {online && <span className="text-[10px] text-green-500 font-bold">Online</span>}
                          </div>
                          <p className={`text-xs mt-1 truncate ${theme.muted}`}>{meta?.text || "Start a conversation with this admin"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {meta?.at && <span className={`text-[10px] ${theme.muted}`}>{formatDate(meta.at)}</span>}
                          {unread > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-green-500 text-white text-[10px] font-extrabold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className={`${mobileChatOpen ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col`}>
              {!activeAdmin ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="max-w-md text-center">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500"><MessageSquare size={34} /></div>
                    <h3 className={`text-2xl font-extrabold mt-5 ${theme.heading}`}>Your admin support inbox</h3>
                    <p className={`text-sm leading-6 mt-2 ${theme.body}`}>Choose an administrator from the list to ask questions, follow up on a report, or request guidance.</p>
                    <div className={`mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${theme.subtle} ${theme.border} ${theme.muted}`}><ShieldCheck size={14} className="text-green-500" /> Messages are limited to Admin accounts</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`flex items-center gap-3 px-4 sm:px-5 py-4 border-b ${theme.border}`}>
                    <button type="button" onClick={() => { setMobileChatOpen(false); setActiveAdmin(null); activeAdminRef.current = null; }} className={`lg:hidden w-9 h-9 rounded-xl border flex items-center justify-center ${theme.subtle} ${theme.border}`}><ArrowLeft size={17} /></button>
                    <Avatar user={activeAdmin} online={onlineUsers.includes(String(activeAdmin._id))} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><h3 className={`font-extrabold truncate ${theme.heading}`}>{getName(activeAdmin)}</h3><span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-extrabold">ADMIN</span></div>
                      <p className={`text-xs mt-1 ${theme.muted}`}>{onlineUsers.includes(String(activeAdmin._id)) ? "Online now" : "Administrator · GuidEd Support"}</p>
                    </div>
                    <MoreHorizontal size={18} className={theme.muted} />
                  </div>

                  <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 ${darkMode ? "bg-[#09150F]" : "bg-[#F9FBFA]"}`}>
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-sm">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center"><ShieldCheck size={25} /></div>
                          <p className={`font-extrabold mt-4 ${theme.heading}`}>Start a private conversation</p>
                          <p className={`text-sm mt-1 leading-6 ${theme.body}`}>You are messaging <strong>{getName(activeAdmin)}</strong>. Ask about your report, guidance concerns, or anything you need help with.</p>
                        </div>
                      </div>
                    ) : messages.map((message, index) => <ChatBubble key={message._id || message.clientMessageId || index} message={message} />)}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className={`p-3 sm:p-4 border-t ${theme.border}`}>
                    <div className={`rounded-2xl border p-2 flex items-end gap-2 ${theme.subtle} ${theme.border}`}>
                      <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder={`Message ${getName(activeAdmin)}...`} className={`flex-1 resize-none bg-transparent outline-none px-2 py-2.5 text-sm ${theme.heading} placeholder:text-gray-400`} />
                      <button type="button" onClick={sendMessage} disabled={!input.trim()} className="w-10 h-10 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition"><Send size={17} /></button>
                    </div>
                    <p className={`text-[10px] mt-2 text-center ${theme.muted}`}>Enter to send · Shift + Enter for a new line · Admin-only messaging</p>
                  </div>
                </>
              )}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
