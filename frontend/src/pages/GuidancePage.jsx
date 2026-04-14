import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Bell
} from "lucide-react";
import io from "socket.io-client";

const notificationSound = new Audio("/notification.mp3");

const GuidancePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const socketRef = useRef(null);

  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const [unreadCounts, setUnreadCounts] = useState({});

  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getChatId = (otherUserId) =>
    [user._id, otherUserId].sort().join("-");

  // scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // load users
  useEffect(() => {
    fetch("https://edu-guard-backend.onrender.com/api/users")
      .then(res => res.json())
      .then(data =>
        setConversations(Array.isArray(data) ? data.filter(u => u._id !== user._id) : [])
      );
  }, [user]);

  // SOCKET FIX (REALTIME CORE FIX ONLY)
  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket", "polling"],
});
    socketRef.current.emit("register", user._id);

    socketRef.current.on("receive_message", (msg) => {
  const isCurrent =
    activeChat && msg.chatId === getChatId(activeChat._id);

  if (isCurrent) {
    setMessages((prev) => [...prev, msg]);
  } else {
    setUnreadCounts((prev) => ({
      ...prev,
      [msg.sender]: (prev[msg.sender] || 0) + 1,
    }));
  }

  if (msg.sender !== user._id) {
    notificationSound.play().catch(() => {});
  }
});

    socketRef.current.on("typing", (senderId) => {
      if (activeChat && senderId === activeChat._id) {
        setTypingUser(true);
      }
    });

    socketRef.current.on("stop_typing", () => {
      setTypingUser(false);
    });

    socketRef.current.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => socketRef.current.disconnect();
  }, [user?._id, activeChat, conversations]);

  // LOAD MESSAGES (UNCHANGED LOGIC FIX ONLY)
  const loadMessages = async (conv) => {
  setActiveChat(conv);

  const res = await fetch(
    `https://edu-guard-backend.onrender.com/api/messages/${getChatId(conv._id)}`
  );

  const data = await res.json();

  setMessages(data?.messages || []);

  socketRef.current.emit("mark_seen", {
    chatId: getChatId(conv._id),
    userId: user._id,
  });

  setUnreadCounts((prev) => ({
    ...prev,
    [conv._id]: 0,
  }));
};

  // typing FIX ONLY
  const handleTyping = (e) => {
    setInput(e.target.value);

    if (!activeChat) return;

    socketRef.current.emit("typing", {
      sender: user._id,
      receiver: activeChat._id,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop_typing", {
        sender: user._id,
        receiver: activeChat._id,
      });
    }, 800);
  };

  // send FIX ONLY (KEEP YOUR STRUCTURE)
  const sendMessage = () => {
  if (!input.trim() || !activeChat) return;

  const msg = {
    chatId: getChatId(activeChat._id),
    sender: user._id,
    receiver: activeChat._id,
    text: input,
    seen: false,
  };

  socketRef.current.emit("send_message", msg);

  setMessages((prev) => [...prev, msg]);

  setInput("");
};

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex flex-col">

      {/* ===== TOP BAR (UNCHANGED EXACT UI) ===== */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">EduGuard</h1>

        <div className="flex items-center gap-4 relative">

          <div className="relative">
            <button onClick={() => setShowNotif(!showNotif)}>
              <Bell />
            </button>

            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-2 rounded-full">
                {notifications.length}
              </span>
            )}

            {showNotif && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-black rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
                {notifications.length === 0 ? (
                  <p className="p-3 text-sm">No notifications</p>
                ) : (
                  notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const conv = conversations.find(c => c._id === notif.sender);
                        if (conv) loadMessages(conv);
                        setShowNotif(false);
                      }}
                      className="p-3 border-b cursor-pointer hover:bg-gray-100 flex gap-3"
                    >
                      <img
                        src={
                          notif.senderPhoto
                            ? `http://localhost:5000${notif.senderPhoto}`
                            : "https://i.pravatar.cc/150"
                        }
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-semibold">
                          {notif.senderName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {notif.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="text-right text-sm hidden sm:block">
            <p className="font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs opacity-80">
              Our Lady of the Holy Rosary - General Trias Cavite
            </p>
          </div>

          <button onClick={logout} className="bg-white text-green-700 px-4 py-2 rounded-md shadow">
            Logout
          </button>
        </div>
      </header>

      {/* ===== NAV (UNCHANGED) ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-white rounded-2xl border flex flex-wrap justify-around items-center py-3 gap-3 shadow-sm">
          <button className="px-4 py-2 rounded-lg text-gray-700 flex items-center">
            <LayoutDashboard className="mr-2"/> Dashboard
          </button>

          <button onClick={() => navigate("/students")} className="px-4 py-2 rounded-lg text-gray-700 flex items-center">
            <Users className="mr-2"/> Students
          </button>

          <button onClick={() => navigate("/guidance")} className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 flex items-center">
            <ShieldX className="mr-2"/> Guidance
          </button>

          <button onClick={() => navigate("/reports")} className="px-4 py-2 rounded-lg text-gray-700 flex items-center">
            <ChartNoAxesCombined className="mr-2"/> Reports
          </button>

          <button onClick={() => navigate("/settings")} className="px-4 py-2 rounded-lg text-gray-700 flex items-center">
            <Settings className="mr-2"/>Settings
          </button>
        </div>
      </div>

      {/* ===== MAIN (UNCHANGED UI INCLUDING SEEN) ===== */}
      <main className="flex-1 px-6 py-6 flex gap-6 flex-col md:flex-row">

        {/* LEFT */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl border p-4 shadow-sm">
          <h2 className="font-semibold mb-4 text-lg">Active Conversations</h2>

          {conversations.map((conv, idx) => (
            <div
              key={idx}
              onClick={() => loadMessages(conv)}
              className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer hover:bg-green-50 ${
                activeChat?._id === conv._id ? "bg-green-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={conv.profilePhoto ? `http://localhost:5000${conv.profilePhoto}` : "https://i.pravatar.cc/150"}
                  className="w-10 h-10 rounded-full"
                />
                <span>{conv.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {unreadCounts[conv._id] > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                    {unreadCounts[conv._id]}
                  </span>
                )}

                <span className={`text-xs ${onlineUsers.includes(conv._id) ? "text-green-500" : "text-gray-400"}`}>
                  ●
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="flex-1 bg-white rounded-2xl border p-4 shadow-sm flex flex-col">
          <h2 className="font-semibold mb-4 text-lg">
            {activeChat?.name || "Select a conversation"}
          </h2>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3">
            {Array.isArray(messages) &&
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === user._id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className={`p-3 rounded-2xl max-w-xs ${
                    msg.sender === user._id ? "bg-green-500 text-white" : "bg-gray-200"
                  }`}>
                    {msg.text}

                    {/* 🔥 KEEPING YOUR SEEN UI EXACTLY */}
                    {msg.sender === user._id && (
                      <div className="text-[10px] text-right mt-1 opacity-70">
                        {msg.seen ? "✔✔ Seen" : "✔ Sent"}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {typingUser && (
              <p className="text-sm italic text-gray-400">
                {activeChat?.name} is typing...
              </p>
            )}

            <div ref={chatEndRef}></div>
          </div>

          <div className="flex mt-3">
            <input
              value={input}
              onChange={handleTyping}
              className="flex-1 border p-2 rounded-l-xl"
            />
            <button
              onClick={sendMessage}
              className="bg-green-500 text-white px-4 rounded-r-xl"
            >
              Send
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default GuidancePage;