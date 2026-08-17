import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Gavel,
  Send,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";

const socket = io("https://edu-guard-backend.onrender.com");

/* =========================================================
   AVATAR
========================================================= */
const Avatar = ({ name, photo, online, large }) => {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || "U";

  return (
    <div className={`relative ${large ? "w-14 h-14" : "w-11 h-11"}`}>
      <div
        className={`
        ${large ? "w-14 h-14" : "w-11 h-11"}
        rounded-2xl overflow-hidden
        bg-white/40 backdrop-blur-xl
        border border-white/30
        shadow-sm
        flex items-center justify-center
      `}
      >
        {photo ? (
          <img src={photo} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-green-700">{initials}</span>
        )}
      </div>

      {online && (
        <span
          className="
          absolute bottom-0 right-0
          w-3.5 h-3.5 rounded-full
          bg-green-500 border-2 border-white
        "
        />
      )}
    </div>
  );
};

/* =========================================================
   NAV
========================================================= */
const Nav = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition ${
      active
        ? "bg-green-50 text-green-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const GuidancePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [unreadMap, setUnreadMap] = useState({});

  /* ================= NOTIFS ================= */
  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  /* ================= TOAST ================= */
  const [toastNotif, setToastNotif] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* =========================================================
     FETCH USERS
  ========================================================= */
  useEffect(() => {
    fetch("https://edu-guard-backend.onrender.com/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.filter((u) => u._id !== user._id)));
  }, [user]);

  /* =========================================================
     SOCKET
  ========================================================= */
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("register", user._id);

    socket.on("online_users", setOnlineUsers);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      if (msg.sender !== user._id) {
        setUnreadMap((prev) => ({
          ...prev,
          [msg.sender]: (prev[msg.sender] || 0) + 1,
        }));

        const notif = {
          id: msg._id || Date.now(),
          text: msg.text,
          name: msg.senderName || "User",
          time: msg.createdAt || new Date().toISOString(),
        };

        setNotifications((prev) => {
          const exists = prev.find((n) => n.id === notif.id);

          if (exists) return prev;

          return [notif, ...prev.slice(0, 15)];
        });

        /* TOAST */
        setToastNotif(notif);

        setTimeout(() => {
          setToastNotif(null);
        }, 4000);
      }
    });

    return () => socket.off();
  }, [user]);

  /* =========================================================
     OPEN CHAT
  ========================================================= */
  const openChat = async (u) => {
    setActiveChat(u);

    const chatId = [user._id, u._id].sort().join("-");

    const res = await fetch(
      `https://edu-guard-backend.onrender.com/api/messages/${chatId}`,
    );

    const data = await res.json();

    setMessages(data.messages || []);

    setUnreadMap((prev) => ({
      ...prev,
      [u._id]: 0,
    }));
  };

  /* =========================================================
     SEND
  ========================================================= */
  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;

    const msg = {
      sender: user._id,
      receiver: activeChat._id,
      text: input,
      createdAt: new Date().toISOString(),
    };

    socket.emit("send_message", msg, (saved) => {
      if (saved?.error) {
        console.error("❌ Message failed:", saved.message);
        return;
      }

      setMessages((prev) => [...prev, saved]);
    });

    setInput("");
  };

  /* =========================================================
     FILTER USERS
  ========================================================= */
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  const formatTime = (t) =>
    new Date(t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="h-screen w-screen flex bg-[#F4F7FB] text-gray-900 overflow-hidden">
      {/* =========================================================
         SIDEBAR
      ========================================================= */}
      <aside className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
        <div>
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-green-600">GuidEd</h1>

            <p className="text-xs text-gray-500 mt-1">
              Guidance Messaging System
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

            <Nav icon={<ShieldX size={18} />} label="Guidance" active />

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
              label="Interventions"
              onClick={() => navigate("/interventions")}
            />

            <Nav
              icon={<Settings size={18} />}
              label="Settings"
              onClick={() => navigate("/settings")}
            />
          </div>
        </div>

        <button
          onClick={logout}
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* =========================================================
           HEADER
        ========================================================= */}
        <div
          className="
          px-8 py-6
          border-b border-white/20
          bg-white/50 backdrop-blur-2xl
          flex items-center justify-between
        "
        >
          <div>
            <h2 className="text-4xl font-black tracking-tight">
              Guidance Messaging
            </h2>

            <p className="text-gray-500 mt-1">
              Real-time communication and student support
            </p>
          </div>

          {/* NOTIFS */}
          <div className="relative">
            <button
              onClick={() => setOpenNotif(!openNotif)}
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

            {/* PANEL */}
            <AnimatePresence>
              {openNotif && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="
                    absolute right-0 mt-4 w-96
                    bg-white/70 backdrop-blur-2xl
                    border border-white/30
                    rounded-3xl overflow-hidden
                    shadow-2xl z-50
                  "
                >
                  <div className="p-5 border-b border-white/20 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">Notifications</h3>

                      <p className="text-xs text-gray-500">Real-time updates</p>
                    </div>

                    <Sparkles size={16} className="text-green-600" />
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
                          <p className="text-sm text-gray-800">{n.text}</p>

                          <div className="flex justify-between mt-2">
                            <span className="text-xs text-green-700 font-medium">
                              {n.name}
                            </span>

                            <span className="text-xs text-gray-400">
                              {formatTime(n.time)}
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

        {/* =========================================================
           CHAT LAYOUT
        ========================================================= */}
        <div className="flex flex-1 overflow-hidden">
          {/* =========================================================
             USERS
          ========================================================= */}
          <div
            className="
            w-96 border-r border-white/20
            bg-white/35 backdrop-blur-2xl
            flex flex-col
          "
          >
            {/* SEARCH */}
            <div className="p-5 border-b border-white/20">
              <div
                className="
                flex items-center gap-3
                px-4 py-3 rounded-2xl
                bg-white/50 backdrop-blur-xl
                border border-white/20
              "
              >
                <Search size={16} className="text-gray-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="
                    bg-transparent outline-none
                    text-sm w-full
                  "
                />
              </div>
            </div>

            {/* USERS */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredUsers.map((u) => (
                <motion.div
                  whileHover={{ y: -2 }}
                  key={u._id}
                  onClick={() => openChat(u)}
                  className={`
                    p-4 rounded-3xl cursor-pointer
                    border transition-all
                    ${
                      activeChat?._id === u._id
                        ? "bg-green-50 border-green-100 shadow-sm"
                        : "bg-white/40 border-white/20 hover:bg-white/60"
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={u.name}
                      photo={u.profilePhoto}
                      online={onlineUsers.includes(u._id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold truncate">{u.name}</p>

                        {unreadMap[u._id] > 0 && (
                          <span
                            className="
                            min-w-[22px] h-6 px-2
                            rounded-full bg-green-600
                            text-white text-xs font-bold
                            flex items-center justify-center
                          "
                          >
                            {unreadMap[u._id]}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {onlineUsers.includes(u._id) ? "Active now" : "Offline"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* =========================================================
             CHAT AREA
          ========================================================= */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* CHAT HEADER */}
            <div
              className="
              px-7 py-5 border-b border-white/20
              bg-white/40 backdrop-blur-2xl
            "
            >
              {activeChat ? (
                <div className="flex items-center gap-4">
                  <Avatar
                    large
                    name={activeChat.name}
                    photo={activeChat.profilePhoto}
                    online={onlineUsers.includes(activeChat._id)}
                  />

                  <div>
                    <h3 className="text-xl font-bold">{activeChat.name}</h3>

                    <p className="text-sm text-gray-500">
                      {onlineUsers.includes(activeChat._id)
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center">
                  <p className="text-gray-500">
                    Select a conversation to start messaging
                  </p>
                </div>
              )}
            </div>

            {/* MESSAGES */}
            <div
              className="
              flex-1 overflow-y-auto
              px-8 py-6
              bg-gradient-to-br from-[#F8FBFF] to-[#EEF5F0]
            "
            >
              <div className="space-y-4">
                {messages.map((m, i) => {
                  const isMe = m.sender === user._id;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`
                          max-w-[70%] px-5 py-4
                          rounded-[2rem]
                          shadow-sm
                          backdrop-blur-xl
                          border
                          ${
                            isMe
                              ? "bg-green-600 text-white border-green-500"
                              : "bg-white/60 border-white/30 text-gray-800"
                          }
                        `}
                      >
                        <p className="text-sm leading-relaxed">{m.text}</p>

                        <div
                          className={`
                          text-[10px] mt-2 text-right
                          ${isMe ? "text-green-100" : "text-gray-400"}
                        `}
                        >
                          {formatTime(m.createdAt)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* INPUT */}
            <div
              className="
              p-5 border-t border-white/20
              bg-white/45 backdrop-blur-2xl
            "
            >
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write a message..."
                  className="
                    flex-1 px-5 py-4 rounded-3xl
                    bg-white/60 backdrop-blur-xl
                    border border-white/30
                    outline-none
                    focus:ring-2 focus:ring-green-200
                    transition
                  "
                />

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={sendMessage}
                  className="
                    px-6 rounded-3xl
                    bg-green-600 text-white
                    shadow-lg shadow-green-200
                    flex items-center justify-center
                  "
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================
         TOAST
      ========================================================= */}
      <AnimatePresence>
        {toastNotif && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: 30 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 30 }}
            className="
              fixed top-6 right-6 z-[999]
              w-[340px]
              bg-white/70 backdrop-blur-2xl
              border border-white/30
              rounded-3xl shadow-2xl
              overflow-hidden
            "
          >
            <div className="p-5 flex gap-4">
              <div
                className="
                w-12 h-12 rounded-2xl
                bg-green-100 text-green-700
                flex items-center justify-center
              "
              >
                <Bell size={18} />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-gray-900">New Message</p>

                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {toastNotif.text}
                </p>

                <div className="flex justify-between mt-3">
                  <span className="text-xs text-green-700 font-medium">
                    {toastNotif.name}
                  </span>

                  <span className="text-xs text-gray-400">
                    {formatTime(toastNotif.time)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuidancePage;
