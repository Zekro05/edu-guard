import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LayoutDashboard, Users, ShieldX, ChartNoAxesCombined, Settings } from "lucide-react";
import io from "socket.io-client";

const socket = io("http://localhost:5000"); // replace with your backend URL if needed

const GuidancePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const chatEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // Load users from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setConversations(data.filter(u => u._id !== user._id)));
  }, [user]);

  // Register user in socket
  useEffect(() => {
    if (user?._id) socket.emit("register", user._id);

    socket.on("receive_message", (msg) => {
      if (activeChat && msg.chatId === getChatId(activeChat._id)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", (senderId) => {
      if (activeChat && senderId === activeChat._id) setTypingUser(true);
    });

    socket.on("stop_typing", (senderId) => {
      if (activeChat && senderId === activeChat._id) setTypingUser(false);
    });

    socket.on("online_users", (users) => setOnlineUsers(users));

    return () => socket.off();
  }, [activeChat, user]);

  // Helper for unique chat IDs
  const getChatId = (otherUserId) => [user._id, otherUserId].sort().join("-");

  // Load messages when selecting a conversation
  const loadMessages = async (conv) => {
    setActiveChat(conv);
    const res = await fetch(`http://localhost:5000/api/messages/${getChatId(conv._id)}`);
    const data = await res.json();
    setMessages(data);

    // Mark messages as seen
    socket.emit("mark_seen", { chatId: getChatId(conv._id), userId: user._id });
  };

  // Handle typing
  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeChat) return;

    socket.emit("typing", { sender: user._id, receiver: activeChat._id });
    setTimeout(() => socket.emit("stop_typing", { receiver: activeChat._id }), 1000);
  };

  // Send message
  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;

    const msg = {
      chatId: getChatId(activeChat._id),
      sender: user._id,
      receiver: activeChat._id,
      text: input,
      seen: false,
    };

    socket.emit("send_message", msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex flex-col">

      {/* ===== TOP BAR ===== */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">EduGuard</h1>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm hidden sm:block">
            <p className="font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs opacity-80">Our Lady of the Holy Rosary - General Trias Cavite</p>
          </div>

          <button
            onClick={logout}
            className="bg-white text-green-700 px-4 py-2 rounded-md shadow hover:bg-gray-100 hover:scale-105 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ===== NAV ===== */}
      <div className="mt-6 px-4 sm:px-8">
        <div className="bg-white rounded-2xl border flex flex-wrap justify-around items-center py-3 gap-3 shadow-sm">
          <button onClick={() => navigate("/dashboard")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
            <LayoutDashboard className="mr-2"/> Dashboard
          </button>

          <button onClick={() => navigate("/students")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
            <Users className="mr-2"/> Students
          </button>

          <button onClick={() => navigate("/guidance")} className="px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-700 shadow-inner flex items-center justify-center">
            <ShieldX className="mr-2"/> Guidance
          </button>

          <button onClick={() => navigate("/reports")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
            <ChartNoAxesCombined className="mr-2"/> Reports
          </button>

          <button onClick={() => navigate("/settings")} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
            <Settings className="mr-2"/>Settings
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 px-6 py-6 flex gap-6 flex-col md:flex-row">

        {/* LEFT PANEL - Conversations */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl border p-4 shadow-sm mb-4 md:mb-0">
          <h2 className="font-semibold mb-4 text-lg">Active Conversations</h2>
          {conversations.map((conv, idx) => (
            <div
              key={idx}
              onClick={() => loadMessages(conv)}
              className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer hover:bg-green-50 transition ${
                activeChat?.name === conv.name ? "bg-green-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={conv.profilePhoto ? `http://localhost:5000${conv.profilePhoto}` : "https://i.pravatar.cc/150?img=65"}
                  alt={conv.name}
                  className="w-10 h-10 rounded-full border-2 border-green-300"
                />
                <span className="font-medium">{conv.name}</span>
              </div>
              <span className={`text-xs ${onlineUsers.includes(conv._id) ? "text-green-500" : "text-gray-400"}`}>●</span>
            </div>
          ))}
        </div>

        {/* RIGHT PANEL - Chat Box */}
        <div className="flex-1 bg-white rounded-2xl border p-4 shadow-sm flex flex-col">
          <h2 className="font-semibold mb-4 text-lg">{activeChat?.name || "Select a conversation"}</h2>

          <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-3 px-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end gap-2 ${msg.sender === user._id ? "justify-end" : "justify-start"}`}
              >
                {msg.sender !== user._id && (
                  <img
                    src={activeChat?.profilePhoto ? `http://localhost:5000${activeChat.profilePhoto}` : "https://i.pravatar.cc/150?img=8"}
                    alt={activeChat?.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className={`p-3 rounded-2xl shadow max-w-[70%] break-words ${msg.sender === user._id ? "bg-green-200 text-green-900 rounded-br-none" : "bg-gray-200 text-gray-900 rounded-bl-none"}`}>
                  {msg.text}
                </div>
                {msg.sender === user._id && (
                  <img
                    src={user.profilePhoto ? `http://localhost:5000${user.profilePhoto}` : "https://i.pravatar.cc/150?img=65"}
                    alt="Admin"
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
            ))}
            {typingUser && <p className="text-sm italic text-gray-400">{`${activeChat?.name} is typing...`}</p>}
            <div ref={chatEndRef}></div>
          </div>

          <div className="flex">
            <input
              type="text"
              placeholder="Type your message here..."
              value={input}
              onChange={handleTyping}
              className="flex-1 border rounded-l-2xl p-3 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-r-2xl transition"
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