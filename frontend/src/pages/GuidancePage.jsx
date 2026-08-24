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
  Send,
  Search,
  Bell,
  Sparkles,
  BriefcaseBusiness,
  HandHelping,
  MessageCircle,
  CheckCheck,
  LogOut,
} from "lucide-react";

/* =========================================================
   SOCKET
========================================================= */

const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket", "polling"],
});

/* =========================================================
   AVATAR
========================================================= */

const Avatar = ({ name, photo, online, large }) => {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <div
      className={`relative flex-shrink-0 ${large ? "w-14 h-14" : "w-12 h-12"}`}
    >
      <div
        className={`
          ${large ? "w-14 h-14" : "w-12 h-12"}
          rounded-2xl overflow-hidden
          bg-gradient-to-br from-green-50 to-white
          backdrop-blur-xl
          border border-white/60
          shadow-sm
          flex items-center justify-center
        `}
      >
        {photo ? (
          <img
            src={photo}
            alt={name || "User"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="font-bold text-green-700">{initials}</span>
        )}
      </div>

      {online && (
        <span
          className="
            absolute bottom-0 right-0
            w-3.5 h-3.5 rounded-full
            bg-green-500
            border-2 border-white
            shadow-sm
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
    className={`
      group
      flex
      items-center
      gap-3
      px-3.5
      py-2.5
      rounded-xl
      w-full
      text-sm
      transition
      ${
        active
          ? "bg-green-50 text-green-700 font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    <span
      className={`
        transition
        ${active ? "text-green-600" : "text-gray-400 group-hover:text-gray-700"}
      `}
    >
      {icon}
    </span>

    {label}

    {active && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600" />
    )}
  </button>
);

/* =========================================================
   GUIDANCE PAGE
========================================================= */

const GuidancePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  /* =======================================================
     USERS
  ======================================================= */

  const [users, setUsers] = useState([]);
  const [conversationUsers, setConversationUsers] = useState([]);

  /* =======================================================
     CHAT
  ======================================================= */

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  /* =======================================================
     ONLINE
  ======================================================= */

  const [onlineUsers, setOnlineUsers] = useState([]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const [search, setSearch] = useState("");

  /* =======================================================
     CONVERSATION META
  ======================================================= */

  const [conversationMeta, setConversationMeta] = useState({});

  /* =======================================================
     UNREAD
  ======================================================= */

  const [unreadMap, setUnreadMap] = useState({});

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  /* =======================================================
     TOAST
  ======================================================= */

  const [toastNotif, setToastNotif] = useState(null);

  /* =======================================================
     REFS
  ======================================================= */

  const chatEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const usersRef = useRef([]);
  const conversationUsersRef = useRef([]);
  const currentUserRef = useRef(null);

  /* =======================================================
     KEEP REFS UPDATED
  ======================================================= */

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    conversationUsersRef.current = conversationUsers;
  }, [conversationUsers]);

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  /* =======================================================
     ADMIN INFO
  ======================================================= */

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Administrator";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(() => {
    if (!activeChat) return;

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, activeChat]);

  /* =======================================================
     FORMAT TIME
  ======================================================= */

  const formatTime = (time) => {
    if (!time) return "";

    const date = new Date(time);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =======================================================
     FORMAT CONVERSATION TIME
  ======================================================= */

  const formatConversationTime = (time) => {
    if (!time) return "";

    const date = new Date(time);

    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();

    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (sameDay) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  /* =======================================================
     GET DISPLAY NAME
  ======================================================= */

  const getDisplayName = (u) => {
    if (!u) return "Student";

    return (
      u.name ||
      [u.firstName, u.middleName, u.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "Student"
    );
  };

  /* =======================================================
     CREATE USER FROM REALTIME MESSAGE
  ======================================================= */

  const createUserFromMessage = (msg) => {
    if (!msg?.sender) return null;

    const senderId = String(msg.sender);

    const existingUser = usersRef.current.find(
      (u) => String(u._id) === senderId,
    );

    if (existingUser) {
      return existingUser;
    }

    const existingConversation = conversationUsersRef.current.find(
      (u) => String(u._id) === senderId,
    );

    if (existingConversation) {
      return existingConversation;
    }

    if (!msg.senderName) {
      console.warn(
        "⚠️ Sender not found and backend did not provide senderName:",
        senderId,
      );

      return null;
    }

    return {
      _id: senderId,
      name: msg.senderName,
      profilePhoto: msg.senderProfilePhoto || null,
      role: "student",
    };
  };

  /* =======================================================
     FETCH USERS + EXISTING CONVERSATIONS
  ======================================================= */

  useEffect(() => {
    if (!user?._id) return;

    let cancelled = false;

    const loadUsersAndConversations = async () => {
      try {
        const res = await fetch(
          "https://edu-guard-backend.onrender.com/api/users",
        );

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();

        if (cancelled) return;

        const otherUsers = data.filter(
          (u) => String(u._id) !== String(user._id),
        );

        setUsers(otherUsers);
        usersRef.current = otherUsers;

        const conversationChecks = await Promise.all(
          otherUsers.map(async (u) => {
            try {
              const chatId = [String(user._id), String(u._id)].sort().join("-");

              const response = await fetch(
                `https://edu-guard-backend.onrender.com/api/messages/${chatId}`,
              );

              if (!response.ok) {
                return {
                  user: u,
                  hasConversation: false,
                  lastMessage: null,
                };
              }

              const chatData = await response.json();

              const chatMessages = Array.isArray(chatData.messages)
                ? chatData.messages
                : [];

              const lastMessage =
                chatMessages.length > 0
                  ? chatMessages[chatMessages.length - 1]
                  : null;

              return {
                user: u,
                hasConversation: chatMessages.length > 0,
                lastMessage,
              };
            } catch (error) {
              console.error(
                `Failed to check conversation with ${getDisplayName(u)}:`,
                error,
              );

              return {
                user: u,
                hasConversation: false,
                lastMessage: null,
              };
            }
          }),
        );

        if (cancelled) return;

        const existingConversations = conversationChecks
          .filter((item) => item.hasConversation)
          .map((item) => item.user);

        const meta = {};

        conversationChecks.forEach((item) => {
          if (!item.lastMessage) return;

          const message = item.lastMessage;

          meta[item.user._id] = {
            lastMessage: message.text || "",
            lastMessageAt: message.createdAt || message.updatedAt || null,
          };
        });

        setConversationMeta(meta);
        setConversationUsers(existingConversations);
        conversationUsersRef.current = existingConversations;
      } catch (error) {
        console.error("Failed to load users and conversations:", error);
      }
    };

    loadUsersAndConversations();

    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  /* =======================================================
     SOCKET CONNECTION
  ======================================================= */

  useEffect(() => {
    if (!user?._id) return;

    const userId = String(user._id);

    console.log("🔌 Registering Guidance socket:", userId);

    socket.emit("register", userId);

    const handleOnlineUsers = (online) => {
      console.log("🟢 Online users:", online);

      setOnlineUsers(online || []);
    };

    const handleReceiveMessage = (msg) => {
      if (!msg) return;

      console.log("📩 REALTIME MESSAGE RECEIVED:", msg);

      const senderId = String(msg.sender);
      const receiverId = String(msg.receiver);

      const currentUserId = String(currentUserRef.current?._id || "");

      /* =================================================
         ONLY PROCESS MESSAGES INVOLVING CURRENT USER
      ================================================= */

      if (senderId !== currentUserId && receiverId !== currentUserId) {
        return;
      }

      /* =================================================
         FIX:
         IGNORE OUR OWN SOCKET BROADCAST
         
         We already added our message optimistically
         inside sendMessage().

         The ACK below is responsible for replacing
         that optimistic message with the real DB message.

         Without this return, Socket.IO can add the same
         outgoing message a second time for a moment.
      ================================================= */

      if (senderId === currentUserId) {
        console.log("⏭️ Ignoring own receive_message event. ACK handles it.");

        return;
      }

      /* =================================================
         DETERMINE OTHER USER
      ================================================= */

      const otherUserId = senderId;

      /* =================================================
         FIND / CREATE USER
      ================================================= */

      let chatUser = null;

      const existingUser = usersRef.current.find(
        (u) => String(u._id) === otherUserId,
      );

      if (existingUser) {
        chatUser = existingUser;
      } else {
        const existingConversation = conversationUsersRef.current.find(
          (u) => String(u._id) === otherUserId,
        );

        if (existingConversation) {
          chatUser = existingConversation;
        }
      }

      if (!chatUser) {
        chatUser = createUserFromMessage(msg);
      }

      /* =================================================
         ADD UNKNOWN USER TO STATE
      ================================================= */

      if (
        chatUser &&
        !usersRef.current.some((u) => String(u._id) === String(chatUser._id))
      ) {
        setUsers((prev) => {
          if (prev.some((u) => String(u._id) === String(chatUser._id))) {
            return prev;
          }

          return [...prev, chatUser];
        });

        usersRef.current = [...usersRef.current, chatUser];
      }

      /* =================================================
         ADD TO CONVERSATION LIST
      ================================================= */

      if (chatUser) {
        setConversationUsers((prev) => {
          const exists = prev.some(
            (u) => String(u._id) === String(chatUser._id),
          );

          if (exists) return prev;

          const next = [...prev, chatUser];

          conversationUsersRef.current = next;

          return next;
        });
      }

      /* =================================================
         UPDATE CONVERSATION META
      ================================================= */

      setConversationMeta((prev) => ({
        ...prev,

        [otherUserId]: {
          lastMessage: msg.text || "",
          lastMessageAt: msg.createdAt || new Date().toISOString(),
        },
      }));

      /* =================================================
         CHECK CURRENT CHAT
      ================================================= */

      const currentChat = activeChatRef.current;

      const isCurrentChat =
        currentChat && String(currentChat._id) === otherUserId;

      /* =================================================
         ADD INCOMING MESSAGE
      ================================================= */

      if (isCurrentChat) {
        setMessages((prev) => {
          /* =============================================
             SERVER ID DUPLICATE CHECK
          ============================================= */

          if (
            msg._id &&
            prev.some(
              (message) =>
                message._id && String(message._id) === String(msg._id),
            )
          ) {
            return prev;
          }

          /* =============================================
             CLIENT ID DUPLICATE CHECK
          ============================================= */

          if (
            msg.clientMessageId &&
            prev.some(
              (message) =>
                message.clientMessageId &&
                message.clientMessageId === msg.clientMessageId,
            )
          ) {
            return prev;
          }

          return [...prev, msg];
        });

        return;
      }

      /* =================================================
         UNREAD
      ================================================= */

      setUnreadMap((prev) => ({
        ...prev,

        [senderId]: (prev[senderId] || 0) + 1,
      }));

      /* =================================================
         NOTIFICATION
      ================================================= */

      const notif = {
        id: msg._id || msg.clientMessageId || `${senderId}-${Date.now()}`,

        text: msg.text || "",

        name: msg.senderName || getDisplayName(chatUser) || "User",

        photo: msg.senderProfilePhoto || chatUser?.profilePhoto || null,

        time: msg.createdAt || new Date().toISOString(),

        senderId,
      };

      console.log("🔔 Creating notification:", notif);

      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notif.id);

        if (exists) return prev;

        return [notif, ...prev.slice(0, 15)];
      });

      setToastNotif(notif);

      setTimeout(() => {
        setToastNotif((current) => (current?.id === notif.id ? null : current));
      }, 4000);
    };

    socket.on("online_users", handleOnlineUsers);

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("online_users", handleOnlineUsers);

      socket.off("receive_message", handleReceiveMessage);
    };
  }, [user?._id]);

  /* =======================================================
     SORT CONVERSATIONS
  ======================================================= */

  const sortedConversationUsers = useMemo(() => {
    return [...conversationUsers].sort((a, b) => {
      const dateA = conversationMeta[a._id]?.lastMessageAt
        ? new Date(conversationMeta[a._id].lastMessageAt).getTime()
        : 0;

      const dateB = conversationMeta[b._id]?.lastMessageAt
        ? new Date(conversationMeta[b._id].lastMessageAt).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [conversationUsers, conversationMeta]);

  /* =======================================================
     OPEN CHAT
  ======================================================= */

  const openChat = async (u) => {
    if (!u?._id || !user?._id) return;

    console.log("💬 Opening chat with:", getDisplayName(u), u._id);

    setActiveChat(u);
    activeChatRef.current = u;

    setUnreadMap((prev) => ({
      ...prev,
      [u._id]: 0,
    }));

    const chatId = [String(user._id), String(u._id)].sort().join("-");

    try {
      const res = await fetch(
        `https://edu-guard-backend.onrender.com/api/messages/${chatId}`,
      );

      if (!res.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await res.json();

      const chatMessages = Array.isArray(data.messages) ? data.messages : [];

      if (String(activeChatRef.current?._id) !== String(u._id)) {
        return;
      }

      setMessages(chatMessages);

      if (chatMessages.length > 0) {
        const lastMessage = chatMessages[chatMessages.length - 1];

        setConversationMeta((prev) => ({
          ...prev,

          [u._id]: {
            lastMessage: lastMessage.text || "",

            lastMessageAt:
              lastMessage.createdAt || lastMessage.updatedAt || null,
          },
        }));

        setConversationUsers((prev) => {
          const alreadyExists = prev.some(
            (existingUser) => String(existingUser._id) === String(u._id),
          );

          if (alreadyExists) return prev;

          const next = [...prev, u];

          conversationUsersRef.current = next;

          return next;
        });
      }
    } catch (error) {
      console.error("Failed to open chat:", error);

      if (String(activeChatRef.current?._id) === String(u._id)) {
        setMessages((prev) => prev);
      }
    }
  };

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !user?._id) {
      return;
    }

    const text = input.trim();

    const clientMessageId = `client-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const createdAt = new Date().toISOString();

    /* =================================================
       OPTIMISTIC MESSAGE
    ================================================= */

    const optimisticMessage = {
      _id: clientMessageId,

      clientMessageId,

      sender: String(user._id),

      receiver: String(activeChat._id),

      text,

      createdAt,

      seen: false,

      pending: true,
    };

    console.log("📤 SENDING MESSAGE:", optimisticMessage);

    setMessages((prev) => {
      /* FIX:
         Prevent accidental duplicate optimistic
         insertion using the client ID.
      */

      if (prev.some((message) => message.clientMessageId === clientMessageId)) {
        return prev;
      }

      return [...prev, optimisticMessage];
    });

    /* =================================================
       UPDATE META
    ================================================= */

    setConversationMeta((prev) => ({
      ...prev,

      [activeChat._id]: {
        lastMessage: text,

        lastMessageAt: createdAt,
      },
    }));

    /* =================================================
       ADD CONVERSATION
    ================================================= */

    setConversationUsers((prev) => {
      const exists = prev.some((u) => String(u._id) === String(activeChat._id));

      if (exists) return prev;

      const next = [...prev, activeChat];

      conversationUsersRef.current = next;

      return next;
    });

    /* =================================================
       CLEAR INPUT
    ================================================= */

    setInput("");

    /* =================================================
       SEND SOCKET
    ================================================= */

    socket.emit(
      "send_message",
      {
        sender: String(user._id),

        receiver: String(activeChat._id),

        text,

        clientMessageId,
      },
      (saved) => {
        console.log("📨 SEND MESSAGE ACK:", saved);

        /* =============================================
           FAILED
        ============================================= */

        if (saved?.error) {
          console.error("❌ Message failed:", saved.message);

          setMessages((prev) =>
            prev.filter(
              (message) => message.clientMessageId !== clientMessageId,
            ),
          );

          return;
        }

        const savedMessage = saved?.message;

        if (!savedMessage) {
          return;
        }

        /* =============================================
           FIX:
           ALWAYS use the original clientMessageId
           when locating the optimistic message.
        ============================================= */

        setMessages((prev) => {
          const optimisticIndex = prev.findIndex(
            (message) => message.clientMessageId === clientMessageId,
          );

          if (optimisticIndex === -1) {
            /*
             * The optimistic message may already have
             * been replaced.
             *
             * Before appending anything, check whether
             * the server message is already present.
             */

            const alreadyExists =
              (savedMessage._id &&
                prev.some(
                  (message) =>
                    message._id &&
                    String(message._id) === String(savedMessage._id),
                )) ||
              (savedMessage.clientMessageId &&
                prev.some(
                  (message) =>
                    message.clientMessageId === savedMessage.clientMessageId,
                ));

            if (alreadyExists) {
              return prev;
            }

            /*
             * Do NOT append the ACK message here.
             *
             * Normally the optimistic message should
             * still exist until this ACK replaces it.
             *
             * This prevents another possible duplicate.
             */

            return prev;
          }

          const next = [...prev];

          next[optimisticIndex] = {
            ...savedMessage,

            /*
             * Keep clientMessageId around so the message
             * can still be identified consistently.
             */

            clientMessageId,

            pending: false,
          };

          return next;
        });
      },
    );
  };

  /* =======================================================
     ENTER TO SEND
  ======================================================= */

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendMessage();
    }
  };

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return sortedConversationUsers;
    }

    return users
      .filter((u) => {
        const isStudent = u.role?.toLowerCase() === "student";

        const name = getDisplayName(u);

        return isStudent && name.toLowerCase().includes(searchTerm);
      })
      .sort((a, b) => {
        const dateA = conversationMeta[a._id]?.lastMessageAt
          ? new Date(conversationMeta[a._id].lastMessageAt).getTime()
          : 0;

        const dateB = conversationMeta[b._id]?.lastMessageAt
          ? new Date(conversationMeta[b._id].lastMessageAt).getTime()
          : 0;

        return dateB - dateA;
      });
  }, [users, sortedConversationUsers, conversationMeta, search]);

  /* =======================================================
     UNREAD TOTAL
  ======================================================= */

  const unreadTotal = useMemo(() => {
    return Object.values(unreadMap).reduce((total, count) => total + count, 0);
  }, [unreadMap]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F7F9F8] text-gray-900 overflow-hidden">
      {/* =====================================================
         SIDEBAR
      ===================================================== */}

      <aside className="hidden lg:flex w-[270px] bg-white border-r border-gray-100 flex-col justify-between px-5 py-6">
        <div>
          <div className="px-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center">
                <img
                  src="/school-logo.png"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                  Guid
                  <span className="text-green-600">Ed</span>
                </h1>

                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                  Student Guidance
                </p>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-gray-400 mt-4">
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>
          </div>

          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Main Menu
          </p>

          <div className="space-y-1">
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
              icon={<BriefcaseBusiness size={18} />}
              label="Cases"
              onClick={() => navigate("/cases")}
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              onClick={() => navigate("/interventions")}
            />
          </div>

          <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => navigate("/settings")}
          />
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0">
                {adminPhoto ? (
                  <img
                    src={adminPhoto}
                    alt={adminName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-green-700 font-bold">
                    {adminName.charAt(0).toUpperCase()}
                  </span>
                )}

                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Administrator
                </p>

                <p className="text-sm font-bold text-gray-900 truncate">
                  {adminName}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              text-gray-600
              border
              border-gray-200
              hover:bg-red-50
              hover:text-red-600
              hover:border-red-100
              transition
            "
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* =====================================================
         MAIN
      ===================================================== */}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* =====================================================
    HEADER
===================================================== */}
        <header
          className="
    sticky top-0 z-30
    bg-[#F7F9F8]/90
    backdrop-blur-xl
    border-b border-gray-100
    px-8 py-5
  "
        >
          {/* =====================================================
      HEADER CONTENT
  ===================================================== */}
          <div className="w-full">
            {/* =====================================================
        BREADCRUMB
    ===================================================== */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-gray-400">
                Overview
              </span>

              <span className="text-xs text-gray-300">/</span>

              <span className="text-xs font-semibold text-green-600">
                Guidance
              </span>
            </div>

            {/* =====================================================
        PAGE HEADER ROW
    ===================================================== */}
            <div className="flex items-center justify-between gap-6">
              {/* ===================================================
          PAGE TITLE
      =================================================== */}
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="
            w-12 h-12
            rounded-2xl
            bg-green-50
            text-green-600
            flex
            items-center
            justify-center
            border
            border-green-100
            flex-shrink-0
          "
                >
                  <MessageCircle size={21} strokeWidth={2.2} />
                </div>

                <div className="min-w-0">
                  <h2
                    className="
              text-2xl
              font-black
              tracking-tight
              text-gray-900
              leading-tight
            "
                  >
                    Guidance Messaging
                  </h2>

                  <p className="text-gray-400 text-sm mt-1">
                    Real-time communication and student support
                  </p>
                </div>
              </div>

              {/* ===================================================
          NOTIFICATIONS
      =================================================== */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setOpenNotif(!openNotif)}
                  className="
            relative
            w-11 h-11
            rounded-xl
            bg-white
            border border-gray-200
            text-gray-600
            flex
            items-center
            justify-center
            hover:bg-gray-50
            hover:text-gray-900
            hover:border-gray-300
            transition-all
            duration-200
          "
                >
                  <Bell size={18} />

                  {unreadTotal > 0 && (
                    <span
                      className="
                absolute
                -top-1
                -right-1
                min-w-5
                h-5
                px-1
                rounded-full
                bg-red-500
                border-2
                border-white
                text-white
                text-[10px]
                font-bold
                flex
                items-center
                justify-center
              "
                    >
                      {unreadTotal > 9 ? "9+" : unreadTotal}
                    </span>
                  )}
                </button>

                {/* =================================================
            NOTIFICATION DROPDOWN
        ================================================= */}
                <AnimatePresence>
                  {openNotif && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 8,
                        scale: 0.97,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 8,
                        scale: 0.97,
                      }}
                      transition={{
                        duration: 0.18,
                      }}
                      className="
                absolute
                right-0
                top-14
                w-96
                bg-white
                border
                border-gray-100
                rounded-2xl
                overflow-hidden
                shadow-xl
                z-50
              "
                    >
                      {/* NOTIFICATION HEADER */}
                      <div
                        className="
                  px-5
                  py-4
                  border-b
                  border-gray-100
                  flex
                  items-center
                  justify-between
                "
                      >
                        <div>
                          <h3 className="font-bold text-gray-900">
                            Notifications
                          </h3>

                          <p className="text-xs text-gray-400 mt-0.5">
                            Recent messages
                          </p>
                        </div>

                        <div
                          className="
                    w-8
                    h-8
                    rounded-lg
                    bg-green-50
                    text-green-600
                    flex
                    items-center
                    justify-center
                  "
                        >
                          <Sparkles size={15} />
                        </div>
                      </div>

                      {/* NOTIFICATION LIST */}
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center">
                            <div
                              className="
                        w-12
                        h-12
                        rounded-xl
                        bg-gray-50
                        mx-auto
                        flex
                        items-center
                        justify-center
                        mb-3
                      "
                            >
                              <Bell size={18} className="text-gray-400" />
                            </div>

                            <p className="text-sm font-medium text-gray-700">
                              No notifications
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              You're all caught up.
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <motion.button
                              key={n.id}
                              whileHover={{ x: 3 }}
                              onClick={() => {
                                const target =
                                  usersRef.current.find(
                                    (u) => String(u._id) === String(n.senderId),
                                  ) ||
                                  createUserFromMessage({
                                    sender: n.senderId,
                                    senderName: n.name,
                                    senderProfilePhoto: n.photo,
                                  });

                                if (target) {
                                  openChat(target);
                                  setOpenNotif(false);
                                  setToastNotif(null);

                                  setUnreadMap((prev) => ({
                                    ...prev,
                                    [n.senderId]: 0,
                                  }));
                                }
                              }}
                              className="
                        w-full
                        text-left
                        px-5
                        py-4
                        border-b
                        border-gray-100
                        hover:bg-green-50/40
                        transition
                      "
                            >
                              <div className="flex gap-3">
                                <Avatar name={n.name} photo={n.photo} />

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between gap-3">
                                    <span className="text-xs font-bold text-green-700">
                                      {n.name}
                                    </span>

                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                      {formatTime(n.time)}
                                    </span>
                                  </div>

                                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                    {n.text}
                                  </p>
                                </div>
                              </div>
                            </motion.button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* CHAT LAYOUT */}

        <div className="flex flex-1 overflow-hidden">
          {/* CONVERSATIONS */}

          <section
            className="
              w-96
              border-r border-white/30
              bg-white/45
              backdrop-blur-2xl
              flex flex-col
            "
          >
            <div className="p-5 border-b border-white/30">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/65 backdrop-blur-xl border border-white/50 shadow-sm">
                <Search size={16} className="text-gray-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="
                    bg-transparent
                    outline-none
                    text-sm
                    w-full
                    placeholder:text-gray-400
                  "
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {search.trim() ? "Search Results" : "Conversations"}
                </p>

                {!search.trim() && conversationUsers.length > 0 && (
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    {conversationUsers.length} active
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center mb-4">
                    {search.trim() ? (
                      <Search size={24} className="text-green-600" />
                    ) : (
                      <MessageCircle size={24} className="text-green-600" />
                    )}
                  </div>

                  {search.trim() ? (
                    <>
                      <p className="font-semibold text-gray-800">
                        No students found
                      </p>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Try searching using the student's name.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800">
                        No conversations yet
                      </p>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Search for a student above to start a conversation.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const meta = conversationMeta[u._id];

                  const unread = unreadMap[u._id] > 0;

                  const displayName = getDisplayName(u);

                  return (
                    <motion.button
                      key={u._id}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => openChat(u)}
                      className={`
                        w-full
                        text-left
                        p-3.5
                        rounded-3xl
                        border
                        transition-all
                        ${
                          activeChat?._id === u._id
                            ? "bg-green-50 border-green-200 shadow-sm"
                            : unread
                              ? "bg-white border-green-100 shadow-sm"
                              : "bg-white/40 border-white/30 hover:bg-white/70"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={displayName}
                          photo={u.profilePhoto}
                          online={onlineUsers.includes(u._id)}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`
                                truncate text-sm
                                ${
                                  unread
                                    ? "font-bold text-gray-900"
                                    : "font-semibold text-gray-800"
                                }
                              `}
                            >
                              {displayName}
                            </p>

                            {meta?.lastMessageAt && (
                              <span
                                className={`
                                  text-[10px]
                                  whitespace-nowrap
                                  ${
                                    unread
                                      ? "text-green-600 font-bold"
                                      : "text-gray-400"
                                  }
                                `}
                              >
                                {formatConversationTime(meta.lastMessageAt)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <p
                              className={`
                                text-xs truncate flex-1
                                ${
                                  unread
                                    ? "text-gray-700 font-medium"
                                    : "text-gray-500"
                                }
                              `}
                            >
                              {meta?.lastMessage ||
                                (onlineUsers.includes(u._id)
                                  ? "Active now"
                                  : "No messages yet")}
                            </p>

                            {unread && (
                              <span className="w-2.5 h-2.5 rounded-full bg-green-600 flex-shrink-0 shadow-sm" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </section>

          {/* CHAT AREA */}

          <section className="flex-1 flex flex-col overflow-hidden">
            {/* CHAT HEADER */}

            <div
              className="
                px-7 py-5
                border-b border-white/30
                bg-white/45
                backdrop-blur-2xl
                min-h-[88px]
              "
            >
              {activeChat ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      large
                      name={getDisplayName(activeChat)}
                      photo={activeChat.profilePhoto}
                      online={onlineUsers.includes(activeChat._id)}
                    />

                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {getDisplayName(activeChat)}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`
                            w-2 h-2 rounded-full
                            ${
                              onlineUsers.includes(activeChat._id)
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }
                          `}
                        />

                        <p className="text-xs text-gray-500">
                          {onlineUsers.includes(activeChat._id)
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/40">
                    <ShieldX size={14} className="text-green-600" />

                    <span className="text-xs font-medium text-gray-500">
                      Guidance Support
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Select a conversation
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Choose a student to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
               MESSAGES
            ================================================= */}

            <div
              className="
                flex-1
                overflow-y-auto
                px-8 py-6
                bg-gradient-to-br
                from-[#F8FBFF]
                via-[#F3F8F5]
                to-[#EEF5F0]
              "
            >
              {!activeChat ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm mx-auto flex items-center justify-center mb-5">
                      <MessageCircle size={30} className="text-green-600" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800">
                      Your guidance inbox
                    </h3>

                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Select a student from the conversation list to view
                      messages and provide support.
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/70 border border-white/50 mx-auto flex items-center justify-center mb-4">
                      <MessageCircle size={24} className="text-green-600" />
                    </div>

                    <p className="font-semibold text-gray-800">
                      Start the conversation
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Send a message to {getDisplayName(activeChat)}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => {
                    const isMe = String(m.sender) === String(user?._id);

                    return (
                      <motion.div
                        /*
                         * FIX:
                         * Use the client ID while optimistic,
                         * then the server ID after ACK.
                         */
                        key={m.clientMessageId || m._id || `message-${i}`}
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`
                            max-w-[70%]
                            px-5 py-4
                            rounded-[2rem]
                            shadow-sm
                            backdrop-blur-xl
                            border
                            ${
                              isMe
                                ? "bg-green-600 text-white border-green-500 rounded-br-md"
                                : "bg-white/75 border-white/60 text-gray-800 rounded-bl-md"
                            }
                            ${m.pending ? "opacity-75" : ""}
                          `}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {m.text}
                          </p>

                          <div
                            className={`
                              flex items-center justify-end gap-1.5
                              text-[10px]
                              mt-2
                              ${isMe ? "text-green-100" : "text-gray-400"}
                            `}
                          >
                            <span>{formatTime(m.createdAt)}</span>

                            {isMe && <CheckCheck size={11} />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* INPUT */}

            {activeChat && (
              <div
                className="
                  p-5
                  border-t border-white/30
                  bg-white/50
                  backdrop-blur-2xl
                "
              >
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Write a message..."
                      className="
                        w-full
                        px-5 py-4
                        pr-14
                        rounded-3xl
                        bg-white/75
                        backdrop-blur-xl
                        border border-white/50
                        outline-none
                        shadow-sm
                        focus:ring-2
                        focus:ring-green-200
                        focus:border-green-200
                        transition
                        placeholder:text-gray-400
                      "
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hidden lg:block">
                      Enter
                    </span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="
                      w-14
                      rounded-3xl
                      bg-green-600
                      hover:bg-green-700
                      disabled:bg-gray-300
                      disabled:cursor-not-allowed
                      text-white
                      shadow-lg
                      shadow-green-200/60
                      flex items-center justify-center
                      transition
                    "
                  >
                    <Send size={18} />
                  </motion.button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* =====================================================
         TOAST
      ===================================================== */}

      <AnimatePresence>
        {toastNotif && (
          <motion.button
            onClick={() => {
              const target =
                usersRef.current.find(
                  (u) => String(u._id) === String(toastNotif.senderId),
                ) ||
                createUserFromMessage({
                  sender: toastNotif.senderId,
                  senderName: toastNotif.name,
                  senderProfilePhoto: toastNotif.photo,
                });

              if (target) {
                openChat(target);
                setToastNotif(null);

                setUnreadMap((prev) => ({
                  ...prev,
                  [toastNotif.senderId]: 0,
                }));
              }
            }}
            initial={{
              opacity: 0,
              y: -30,
              x: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: 0,
            }}
            exit={{
              opacity: 0,
              y: -20,
              x: 30,
            }}
            className="
              fixed
              top-6 right-6
              z-[999]
              w-[360px]
              text-left
              bg-white/85
              backdrop-blur-2xl
              border border-white/60
              rounded-3xl
              shadow-2xl
              overflow-hidden
            "
          >
            <div className="p-5 flex gap-4">
              <Avatar name={toastNotif.name} photo={toastNotif.photo} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">New Message</p>

                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>

                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {toastNotif.text}
                </p>

                <div className="flex justify-between mt-3">
                  <span className="text-xs text-green-700 font-semibold">
                    {toastNotif.name}
                  </span>

                  <span className="text-xs text-gray-400">
                    {formatTime(toastNotif.time)}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuidancePage;
