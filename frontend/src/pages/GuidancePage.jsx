import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { io } from "socket.io-client";
import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Bell
} from "lucide-react";

const socket = io("https://edu-guard-backend.onrender.com");
const notificationSound = new Audio("/notification.mp3");

const GuidancePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  const chatEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // USERS
  useEffect(() => {
    fetch("https://edu-guard-backend.onrender.com/api/users")
      .then(res => res.json())
      .then(data => setUsers(data.filter(u => u._id !== user._id)));
  }, [user]);

  // SOCKET CORE
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("register", user._id);

    socket.on("online_users", setOnlineUsers);

    // 💬 RECEIVE MESSAGE
    socket.on("receive_message", (msg) => {
      setMessages(prev => [...prev, msg]);

      const isIncoming = msg.sender !== user._id;

      if (isIncoming) {
        setNotifications(prev => [
          { id: msg._id, text: msg.text },
          ...prev
        ]);

        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});
      }
    });

    // 👁️ MESSAGE SEEN EVENT (from backend or fallback)
    socket.on("message_seen", ({ messageId, seenBy }) => {
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId
            ? { ...m, seen: true, seenBy }
            : m
        )
      );
    });

    socket.on("typing", ({ sender }) => {
      if (activeChat?._id === sender) setTyping(true);
    });

    socket.on("stop_typing", () => setTyping(false));

    return () => socket.off();
  }, [activeChat, user]);

  // OPEN CHAT
  const openChat = async (u) => {
    setActiveChat(u);

    const chatId = [user._id, u._id].sort().join("-");

    const res = await fetch(
      `https://edu-guard-backend.onrender.com/api/messages/${chatId}`
    );

    const data = await res.json();
    setMessages(data.messages || []);

    // 👁️ mark as seen (GUIDANCE COUNSELOR VIEW)
    socket.emit("mark_seen", {
      chatId,
      seenBy: user._id
    });
  };

  // TYPING
  const handleTyping = (e) => {
    setInput(e.target.value);

    socket.emit("typing", {
      sender: user._id,
      receiver: activeChat?._id
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", {
        sender: user._id,
        receiver: activeChat?._id
      });
    }, 600);
  };

  // SEND MESSAGE
  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;

    const msg = {
      sender: user._id,
      receiver: activeChat._id,
      text: input,
      seen: false
    };

    socket.emit("send_message", msg, (saved) => {
      setMessages(prev => [...prev, saved]);
    });

    setInput("");
  };

  // STATUS TEXT (Messenger style)
  const getStatus = (msg) => {
    if (msg.sender !== user._id) return null;
    if (!msg.seen) return "✓ Sent";
    return "✓✓ Seen by Counselor";
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-gray-950 via-green-950 to-emerald-950 text-white">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-400">EduGuard</h1>
          <p className="text-xs text-gray-400 mb-6">
            Guidance Communication System
          </p>

          <Nav icon={<LayoutDashboard />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <Nav icon={<Users />} label="Students" onClick={() => navigate("/students")} />
          <Nav icon={<ShieldX />} label="Guidance" />
          <Nav icon={<ChartNoAxesCombined />} label="Reports" onClick={() => navigate("/reports")} />
          <Nav icon={<Settings />} label="Settings" onClick={() => navigate("/settings")} />
        </div>

        {/* logout moved here only */}
        <button
          onClick={logout}
          className="bg-red-500/80 hover:bg-red-500 py-2 rounded-xl"
        >
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold tracking-wide">
            Guidance Console
          </h2>

          {/* NOTIF */}
          <div className="relative">
            <Bell onClick={() => setOpenNotif(!openNotif)} className="cursor-pointer" />

            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 px-2 rounded-full text-xs">
                {notifications.length}
              </span>
            )}

            {openNotif && (
              <div className="absolute right-0 mt-2 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl z-50">
                {notifications.length === 0 ? (
                  <p className="p-3 text-sm text-gray-400">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-3 border-b border-white/10 text-sm">
                      💬 {n.text}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* CHAT BODY */}
        <div className="flex flex-1 overflow-hidden">

          {/* USERS */}
          <div className="w-1/3 border-r border-white/10 p-4 overflow-y-auto">
            {users.map(u => (
              <div
                key={u._id}
                onClick={() => openChat(u)}
                className={`p-3 mb-2 rounded-xl cursor-pointer flex justify-between transition ${
                  activeChat?._id === u._id
                    ? "bg-white/10 scale-[1.02]"
                    : "hover:bg-white/5"
                }`}
              >
                <span>{u.name}</span>
                <span className={onlineUsers.includes(u._id) ? "text-green-400" : "text-gray-500"}>
                  ●
                </span>
              </div>
            ))}
          </div>

          {/* CHAT */}
          <div className="flex-1 flex flex-col">

            <div className="flex-1 p-5 overflow-y-auto space-y-2">

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === user._id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`px-4 py-2 rounded-2xl max-w-xs relative ${
                    m.sender === user._id
                      ? "bg-green-500"
                      : "bg-white/10"
                  }`}>

                    <div>{m.text}</div>

                    {/* READ RECEIPT */}
                    {m.sender === user._id && (
                      <div className="text-[10px] text-white/70 mt-1 text-right">
                        {getStatus(m)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <p className="text-xs text-gray-400 italic">
                  typing...
                </p>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 border-t border-white/10 flex">
              <input
                value={input}
                onChange={handleTyping}
                className="flex-1 bg-white/10 p-3 rounded-l-xl outline-none"
                placeholder="Message..."
              />
              <button
                onClick={sendMessage}
                className="bg-green-500 px-6 rounded-r-xl"
              >
                Send
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

const Nav = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 w-full transition"
  >
    {icon} {label}
  </button>
);

export default GuidancePage;