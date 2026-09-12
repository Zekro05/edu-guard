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
  ArrowLeft,
  Menu,
  X,
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
      className={`relative flex-shrink-0 ${
        large
          ? "w-11 h-11 sm:w-14 sm:h-14"
          : "w-10 h-10 sm:w-12 sm:h-12"
      }`}
    >
      <div
        className={`
          ${
            large
              ? "w-11 h-11 sm:w-14 sm:h-14"
              : "w-10 h-10 sm:w-12 sm:h-12"
          }
          rounded-xl sm:rounded-2xl
          overflow-hidden
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
          <span
            className={`font-bold text-green-700 ${
              large ? "text-sm sm:text-base" : "text-xs sm:text-sm"
            }`}
          >
            {initials}
          </span>
        )}
      </div>

      {online && (
        <span
          className="
            absolute bottom-0 right-0
            w-3 h-3 sm:w-3.5 sm:h-3.5
            rounded-full
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
        ${
          active
            ? "text-green-600"
            : "text-gray-400 group-hover:text-gray-700"
        }
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
     MOBILE SIDEBAR
  ======================================================= */

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
     MOBILE CHAT
  ======================================================= */

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

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
     CLOSE MOBILE SIDEBAR ON DESKTOP
  ======================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =======================================================
     LOCK BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
  ======================================================= */

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

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
    user?.profilePhoto ||
    user?.profilePicture ||
    user?.photo ||
    null;

  /* =======================================================
     CLOSE SIDEBAR + NAVIGATE
  ======================================================= */

  const handleNavigation = (path) => {
    setMobileSidebarOpen(false);
    navigate(path);
  };

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
      (u) => String(u._id) === senderId
    );

    if (existingUser) {
      return existingUser;
    }

    const existingConversation =
      conversationUsersRef.current.find(
        (u) => String(u._id) === senderId
      );

    if (existingConversation) {
      return existingConversation;
    }

    if (!msg.senderName) {
      console.warn(
        "⚠️ Sender not found and backend did not provide senderName:",
        senderId
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
          "https://edu-guard-backend.onrender.com/api/users"
        );

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();

        if (cancelled) return;

        const otherUsers = data.filter(
          (u) => String(u._id) !== String(user._id)
        );

        setUsers(otherUsers);
        usersRef.current = otherUsers;

        const conversationChecks = await Promise.all(
          otherUsers.map(async (u) => {
            try {
              const chatId = [String(user._id), String(u._id)]
                .sort()
                .join("-");

              const response = await fetch(
                `https://edu-guard-backend.onrender.com/api/messages/${chatId}`
              );

              if (!response.ok) {
                return {
                  user: u,
                  hasConversation: false,
                  lastMessage: null,
                };
              }

              const chatData = await response.json();

              const chatMessages = Array.isArray(
                chatData.messages
              )
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
                `Failed to check conversation with ${getDisplayName(
                  u
                )}:`,
                error
              );

              return {
                user: u,
                hasConversation: false,
                lastMessage: null,
              };
            }
          })
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
            lastMessageAt:
              message.createdAt ||
              message.updatedAt ||
              null,
          };
        });

        setConversationMeta(meta);
        setConversationUsers(existingConversations);
        conversationUsersRef.current = existingConversations;
      } catch (error) {
        console.error(
          "Failed to load users and conversations:",
          error
        );
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

    console.log(
      "🔌 Registering Guidance socket:",
      userId
    );

    socket.emit("register", userId);

    const handleOnlineUsers = (online) => {
      console.log("🟢 Online users:", online);

      setOnlineUsers(online || []);
    };

    const handleReceiveMessage = (msg) => {
      if (!msg) return;

      console.log(
        "📩 REALTIME MESSAGE RECEIVED:",
        msg
      );

      const senderId = String(msg.sender);
      const receiverId = String(msg.receiver);

      const currentUserId = String(
        currentUserRef.current?._id || ""
      );

      if (
        senderId !== currentUserId &&
        receiverId !== currentUserId
      ) {
        return;
      }

      if (senderId === currentUserId) {
        console.log(
          "⏭️ Ignoring own receive_message event. ACK handles it."
        );

        return;
      }

      const otherUserId = senderId;

      let chatUser = null;

      const existingUser = usersRef.current.find(
        (u) => String(u._id) === otherUserId
      );

      if (existingUser) {
        chatUser = existingUser;
      } else {
        const existingConversation =
          conversationUsersRef.current.find(
            (u) => String(u._id) === otherUserId
          );

        if (existingConversation) {
          chatUser = existingConversation;
        }
      }

      if (!chatUser) {
        chatUser = createUserFromMessage(msg);
      }

      if (
        chatUser &&
        !usersRef.current.some(
          (u) =>
            String(u._id) === String(chatUser._id)
        )
      ) {
        setUsers((prev) => {
          if (
            prev.some(
              (u) =>
                String(u._id) ===
                String(chatUser._id)
            )
          ) {
            return prev;
          }

          return [...prev, chatUser];
        });

        usersRef.current = [
          ...usersRef.current,
          chatUser,
        ];
      }

      if (chatUser) {
        setConversationUsers((prev) => {
          const exists = prev.some(
            (u) =>
              String(u._id) ===
              String(chatUser._id)
          );

          if (exists) return prev;

          const next = [...prev, chatUser];

          conversationUsersRef.current = next;

          return next;
        });
      }

      setConversationMeta((prev) => ({
        ...prev,

        [otherUserId]: {
          lastMessage: msg.text || "",
          lastMessageAt:
            msg.createdAt ||
            new Date().toISOString(),
        },
      }));

      const currentChat = activeChatRef.current;

      const isCurrentChat =
        currentChat &&
        String(currentChat._id) === otherUserId;

      if (isCurrentChat) {
        setMessages((prev) => {
          if (
            msg._id &&
            prev.some(
              (message) =>
                message._id &&
                String(message._id) ===
                  String(msg._id)
            )
          ) {
            return prev;
          }

          if (
            msg.clientMessageId &&
            prev.some(
              (message) =>
                message.clientMessageId &&
                message.clientMessageId ===
                  msg.clientMessageId
            )
          ) {
            return prev;
          }

          return [...prev, msg];
        });

        return;
      }

      setUnreadMap((prev) => ({
        ...prev,

        [senderId]: (prev[senderId] || 0) + 1,
      }));

      const notif = {
        id:
          msg._id ||
          msg.clientMessageId ||
          `${senderId}-${Date.now()}`,

        text: msg.text || "",

        name:
          msg.senderName ||
          getDisplayName(chatUser) ||
          "User",

        photo:
          msg.senderProfilePhoto ||
          chatUser?.profilePhoto ||
          null,

        time:
          msg.createdAt ||
          new Date().toISOString(),

        senderId,
      };

      console.log(
        "🔔 Creating notification:",
        notif
      );

      setNotifications((prev) => {
        const exists = prev.some(
          (n) => n.id === notif.id
        );

        if (exists) return prev;

        return [notif, ...prev.slice(0, 15)];
      });

      setToastNotif(notif);

      setTimeout(() => {
        setToastNotif((current) =>
          current?.id === notif.id
            ? null
            : current
        );
      }, 4000);
    };

    socket.on(
      "online_users",
      handleOnlineUsers
    );

    socket.on(
      "receive_message",
      handleReceiveMessage
    );

    return () => {
      socket.off(
        "online_users",
        handleOnlineUsers
      );

      socket.off(
        "receive_message",
        handleReceiveMessage
      );
    };
  }, [user?._id]);

  /* =======================================================
     SORT CONVERSATIONS
  ======================================================= */

  const sortedConversationUsers = useMemo(() => {
    return [...conversationUsers].sort((a, b) => {
      const dateA = conversationMeta[a._id]
        ?.lastMessageAt
        ? new Date(
            conversationMeta[a._id]
              .lastMessageAt
          ).getTime()
        : 0;

      const dateB = conversationMeta[b._id]
        ?.lastMessageAt
        ? new Date(
            conversationMeta[b._id]
              .lastMessageAt
          ).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [
    conversationUsers,
    conversationMeta,
  ]);

  /* =======================================================
     OPEN CHAT
  ======================================================= */

  const openChat = async (u) => {
    if (!u?._id || !user?._id) return;

    setMobileChatOpen(true);

    console.log(
      "💬 Opening chat with:",
      getDisplayName(u),
      u._id
    );

    setActiveChat(u);
    activeChatRef.current = u;

    setUnreadMap((prev) => ({
      ...prev,

      [u._id]: 0,
    }));

    const chatId = [
      String(user._id),
      String(u._id),
    ]
      .sort()
      .join("-");

    try {
      const res = await fetch(
        `https://edu-guard-backend.onrender.com/api/messages/${chatId}`
      );

      if (!res.ok) {
        throw new Error(
          "Failed to load conversation"
        );
      }

      const data = await res.json();

      const chatMessages = Array.isArray(
        data.messages
      )
        ? data.messages
        : [];

      if (
        String(
          activeChatRef.current?._id
        ) !== String(u._id)
      ) {
        return;
      }

      setMessages(chatMessages);

      if (chatMessages.length > 0) {
        const lastMessage =
          chatMessages[
            chatMessages.length - 1
          ];

        setConversationMeta((prev) => ({
          ...prev,

          [u._id]: {
            lastMessage:
              lastMessage.text || "",

            lastMessageAt:
              lastMessage.createdAt ||
              lastMessage.updatedAt ||
              null,
          },
        }));

        setConversationUsers((prev) => {
          const alreadyExists =
            prev.some(
              (existingUser) =>
                String(existingUser._id) ===
                String(u._id)
            );

          if (alreadyExists) return prev;

          const next = [...prev, u];

          conversationUsersRef.current =
            next;

          return next;
        });
      }
    } catch (error) {
      console.error(
        "Failed to open chat:",
        error
      );

      if (
        String(
          activeChatRef.current?._id
        ) === String(u._id)
      ) {
        setMessages([]);
      }
    }
  };

  /* =======================================================
     BACK TO CONVERSATIONS
  ======================================================= */

  const backToConversations = () => {
    setActiveChat(null);
    activeChatRef.current = null;
    setMessages([]);
    setInput("");
    setMobileChatOpen(false);
  };

  /* =======================================================
     CLOSE MOBILE CHAT
  ======================================================= */

  const closeMobileChat = () => {
    backToConversations();
  };

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage = () => {
    if (
      !input.trim() ||
      !activeChat ||
      !user?._id
    ) {
      return;
    }

    const text = input.trim();

    const clientMessageId =
      `client-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

    const createdAt =
      new Date().toISOString();

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

    console.log(
      "📤 SENDING MESSAGE:",
      optimisticMessage
    );

    setMessages((prev) => {
      if (
        prev.some(
          (message) =>
            message.clientMessageId ===
            clientMessageId
        )
      ) {
        return prev;
      }

      return [
        ...prev,
        optimisticMessage,
      ];
    });

    setConversationMeta((prev) => ({
      ...prev,

      [activeChat._id]: {
        lastMessage: text,

        lastMessageAt: createdAt,
      },
    }));

    setConversationUsers((prev) => {
      const exists = prev.some(
        (u) =>
          String(u._id) ===
          String(activeChat._id)
      );

      if (exists) return prev;

      const next = [
        ...prev,
        activeChat,
      ];

      conversationUsersRef.current =
        next;

      return next;
    });

    setInput("");

    socket.emit(
      "send_message",
      {
        sender: String(user._id),

        receiver: String(
          activeChat._id
        ),

        text,

        clientMessageId,
      },
      (saved) => {
        console.log(
          "📨 SEND MESSAGE ACK:",
          saved
        );

        if (saved?.error) {
          console.error(
            "❌ Message failed:",
            saved.message
          );

          setMessages((prev) =>
            prev.filter(
              (message) =>
                message.clientMessageId !==
                clientMessageId
            )
          );

          return;
        }

        const savedMessage =
          saved?.message;

        if (!savedMessage) {
          return;
        }

        setMessages((prev) => {
          const optimisticIndex =
            prev.findIndex(
              (message) =>
                message.clientMessageId ===
                clientMessageId
            );

          if (optimisticIndex === -1) {
            const alreadyExists =
              (savedMessage._id &&
                prev.some(
                  (message) =>
                    message._id &&
                    String(
                      message._id
                    ) ===
                      String(
                        savedMessage._id
                      )
                )) ||
              (savedMessage.clientMessageId &&
                prev.some(
                  (message) =>
                    message.clientMessageId ===
                    savedMessage.clientMessageId
                ));

            if (alreadyExists) {
              return prev;
            }

            return prev;
          }

          const next = [...prev];

          next[optimisticIndex] = {
            ...savedMessage,

            clientMessageId,

            pending: false,
          };

          return next;
        });
      }
    );
  };

  /* =======================================================
     ENTER TO SEND
  ======================================================= */

  const handleInputKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      sendMessage();
    }
  };

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const searchTerm =
      search.trim().toLowerCase();

    if (!searchTerm) {
      return sortedConversationUsers;
    }

    return users
      .filter((u) => {
        const isStudent =
          u.role?.toLowerCase() ===
          "student";

        const name =
          getDisplayName(u);

        return (
          isStudent &&
          name
            .toLowerCase()
            .includes(searchTerm)
        );
      })
      .sort((a, b) => {
        const dateA =
          conversationMeta[a._id]
            ?.lastMessageAt
            ? new Date(
                conversationMeta[
                  a._id
                ].lastMessageAt
              ).getTime()
            : 0;

        const dateB =
          conversationMeta[b._id]
            ?.lastMessageAt
            ? new Date(
                conversationMeta[
                  b._id
                ].lastMessageAt
              ).getTime()
            : 0;

        return dateB - dateA;
      });
  }, [
    users,
    sortedConversationUsers,
    conversationMeta,
    search,
  ]);

  /* =======================================================
     UNREAD TOTAL
  ======================================================= */

  const unreadTotal = useMemo(() => {
    return Object.values(
      unreadMap
    ).reduce(
      (total, count) =>
        total + count,
      0
    );
  }, [unreadMap]);

  /* =======================================================
     NOTIFICATION CLICK
  ======================================================= */

  const handleNotificationClick = (n) => {
    const target =
      usersRef.current.find(
        (u) =>
          String(u._id) ===
          String(n.senderId)
      ) ||
      conversationUsersRef.current.find(
        (u) =>
          String(u._id) ===
          String(n.senderId)
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
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="h-[100dvh] w-full flex bg-[#F7F9F8] text-gray-900 overflow-hidden">

      {/* ===================================================
         DESKTOP SIDEBAR
      =================================================== */}

      <aside className="hidden lg:flex w-[270px] flex-shrink-0 bg-white border-r border-gray-100 flex-col justify-between px-5 py-6">
        <div>
          <div className="px-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center">
                <img
                  src="/school-logo.webp"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                  Guid
                  <span className="text-green-600">
                    Ed
                  </span>
                </h1>

                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
                  Student Guidance
                </p>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-gray-400 mt-4">
              Our Lady of the Holy Rosary
              School
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
              onClick={() =>
                navigate("/dashboard")
              }
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              onClick={() =>
                navigate("/students")
              }
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              active
            />

            <Nav
              icon={
                <ChartNoAxesCombined size={18} />
              }
              label="Reports"
              onClick={() =>
                navigate("/reports")
              }
            />

            <Nav
              icon={
                <BriefcaseBusiness size={18} />
              }
              label="Cases"
              onClick={() =>
                navigate("/cases")
              }
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              onClick={() =>
                navigate("/interventions")
              }
            />
          </div>

          <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() =>
              navigate("/settings")
            }
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
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <span className="text-green-700 font-bold">
                    {adminName
                      .charAt(0)
                      .toUpperCase()}
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

      {/* ===================================================
         MOBILE SIDEBAR OVERLAY + DRAWER
      =================================================== */}

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() =>
                setMobileSidebarOpen(false)
              }
              className="
                fixed
                inset-0
                bg-black/35
                backdrop-blur-[2px]
                z-[998]
                lg:hidden
              "
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 30,
              }}
              className="
                fixed
                top-0
                left-0
                bottom-0
                w-[285px]
                max-w-[85vw]
                bg-white
                z-[999]
                shadow-2xl
                flex
                flex-col
                justify-between
                px-5
                py-6
                lg:hidden
                overflow-y-auto
              "
            >
              <div>
                <div className="px-3 mb-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 flex-shrink-0">
                        <img
                          src="/school-logo.webp"
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                          Guid
                          <span className="text-green-600">
                            Ed
                          </span>
                        </h1>

                        <p className="text-[8px] uppercase tracking-widest text-gray-400 font-semibold truncate">
                          Student Guidance
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setMobileSidebarOpen(false)
                      }
                      className="
                        w-9
                        h-9
                        rounded-xl
                        bg-gray-50
                        border
                        border-gray-200
                        flex
                        items-center
                        justify-center
                        text-gray-500
                        hover:bg-gray-100
                        hover:text-gray-900
                        transition
                        flex-shrink-0
                      "
                      aria-label="Close menu"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed text-gray-400 mt-4">
                    Our Lady of the Holy Rosary
                    School
                    <br />
                    General Trias Campus
                  </p>
                </div>

                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Main Menu
                </p>

                <div className="space-y-1">
                  <Nav
                    icon={
                      <LayoutDashboard size={18} />
                    }
                    label="Dashboard"
                    onClick={() =>
                      handleNavigation(
                        "/dashboard"
                      )
                    }
                  />

                  <Nav
                    icon={<Users size={18} />}
                    label="Students"
                    onClick={() =>
                      handleNavigation(
                        "/students"
                      )
                    }
                  />

                  <Nav
                    icon={<ShieldX size={18} />}
                    label="Guidance"
                    active
                  />

                  <Nav
                    icon={
                      <ChartNoAxesCombined size={18} />
                    }
                    label="Reports"
                    onClick={() =>
                      handleNavigation(
                        "/reports"
                      )
                    }
                  />

                  <Nav
                    icon={
                      <BriefcaseBusiness size={18} />
                    }
                    label="Cases"
                    onClick={() =>
                      handleNavigation(
                        "/cases"
                      )
                    }
                  />

                  <Nav
                    icon={
                      <HandHelping size={18} />
                    }
                    label="Interventions"
                    onClick={() =>
                      handleNavigation(
                        "/interventions"
                      )
                    }
                  />
                </div>

                <p className="px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  System
                </p>

                <Nav
                  icon={<Settings size={18} />}
                  label="Settings"
                  onClick={() =>
                    handleNavigation(
                      "/settings"
                    )
                  }
                />
              </div>

              <div className="space-y-3 mt-8">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0">
                      {adminPhoto ? (
                        <img
                          src={adminPhoto}
                          alt={adminName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="text-green-700 font-bold">
                          {adminName
                            .charAt(0)
                            .toUpperCase()}
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
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                  }}
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===================================================
         MAIN
      =================================================== */}

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* =================================================
           HEADER
        ================================================= */}

        <header
          className="
            flex-shrink-0
            bg-[#F7F9F8]/95
            backdrop-blur-xl
            border-b border-gray-100
            px-4
            sm:px-6
            lg:px-8
            py-3
            sm:py-4
            lg:py-5
          "
        >
          {/* MOBILE BRAND + HAMBURGER + NOTIFICATION */}

          <div className="flex lg:hidden items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() =>
                  setMobileSidebarOpen(true)
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-gray-600
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                  hover:bg-gray-50
                  hover:text-gray-900
                  transition
                  shadow-sm
                "
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <div className="w-9 h-9 flex-shrink-0">
                <img
                  src="/school-logo.webp"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg font-extrabold tracking-tight text-gray-900">
                  Guid
                  <span className="text-green-600">
                    Ed
                  </span>
                </h1>

                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-semibold truncate">
                  Student Guidance
                </p>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <button
                onClick={() =>
                  setOpenNotif(!openNotif)
                }
                className="
                  relative
                  w-10
                  h-10
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-gray-600
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >
                <Bell size={17} />

                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadTotal > 9
                      ? "9+"
                      : unreadTotal}
                  </span>
                )}
              </button>

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
                      top-12
                      w-[calc(100vw-2rem)]
                      max-w-96
                      bg-white
                      border border-gray-100
                      rounded-2xl
                      overflow-hidden
                      shadow-xl
                      z-[100]
                    "
                  >
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Notifications
                        </h3>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Recent messages
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <Sparkles size={15} />
                      </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                      {notifications.length ===
                      0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 mx-auto flex items-center justify-center mb-3">
                            <Bell
                              size={18}
                              className="text-gray-400"
                            />
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
                            whileHover={{
                              x: 3,
                            }}
                            onClick={() =>
                              handleNotificationClick(n)
                            }
                            className="
                              w-full
                              text-left
                              px-4
                              py-4
                              border-b border-gray-100
                              hover:bg-green-50/40
                            "
                          >
                            <div className="flex gap-3">
                              <Avatar
                                name={n.name}
                                photo={n.photo}
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between gap-2">
                                  <span className="text-xs font-bold text-green-700 truncate">
                                    {n.name}
                                  </span>

                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    {formatTime(
                                      n.time
                                    )}
                                  </span>
                                </div>

                                <p className="text-sm text-gray-700 mt-1 line-clamp-2 break-words">
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

          {/* BREADCRUMB */}

          <div className="flex items-center gap-2 mb-3 lg:mb-4">
            <span className="text-[11px] sm:text-xs font-medium text-gray-400">
              Overview
            </span>

            <span className="text-[11px] sm:text-xs text-gray-300">
              /
            </span>

            <span className="text-[11px] sm:text-xs font-semibold text-green-600">
              Guidance
            </span>
          </div>

          {/* PAGE HEADER */}

          <div className="flex items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className="
                  w-10 h-10
                  sm:w-12 sm:h-12
                  rounded-xl
                  sm:rounded-2xl
                  bg-green-50
                  text-green-600
                  flex items-center justify-center
                  border border-green-100
                  flex-shrink-0
                "
              >
                <MessageCircle
                  size={18}
                  className="sm:hidden"
                />

                <MessageCircle
                  size={21}
                  strokeWidth={2.2}
                  className="hidden sm:block"
                />
              </div>

              <div className="min-w-0">
                <h2
                  className="
                    text-lg
                    sm:text-xl
                    lg:text-2xl
                    font-black
                    tracking-tight
                    text-gray-900
                    leading-tight
                    truncate
                  "
                >
                  Guidance Messaging
                </h2>

                <p className="text-gray-400 text-xs sm:text-sm mt-1 truncate">
                  Real-time communication
                  and student support
                </p>
              </div>
            </div>

            {/* DESKTOP NOTIFICATION */}

            <div className="relative flex-shrink-0 hidden lg:block">
              <button
                onClick={() =>
                  setOpenNotif(!openNotif)
                }
                className="
                  relative
                  w-11 h-11
                  rounded-xl
                  bg-white
                  border border-gray-200
                  text-gray-600
                  flex items-center justify-center
                  hover:bg-gray-50
                  transition
                "
              >
                <Bell size={18} />

                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadTotal > 9
                      ? "9+"
                      : unreadTotal}
                  </span>
                )}
              </button>

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
                    className="
                      absolute
                      right-0
                      top-14
                      w-96
                      max-w-[calc(100vw-2rem)]
                      bg-white
                      border border-gray-100
                      rounded-2xl
                      overflow-hidden
                      shadow-xl
                      z-[100]
                    "
                  >
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Notifications
                        </h3>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Recent messages
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <Sparkles size={15} />
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length ===
                      0 ? (
                        <div className="p-10 text-center">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 mx-auto flex items-center justify-center mb-3">
                            <Bell
                              size={18}
                              className="text-gray-400"
                            />
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
                            whileHover={{
                              x: 3,
                            }}
                            onClick={() =>
                              handleNotificationClick(n)
                            }
                            className="
                              w-full
                              text-left
                              px-5
                              py-4
                              border-b border-gray-100
                              hover:bg-green-50/40
                            "
                          >
                            <div className="flex gap-3">
                              <Avatar
                                name={n.name}
                                photo={n.photo}
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between gap-3">
                                  <span className="text-xs font-bold text-green-700 truncate">
                                    {n.name}
                                  </span>

                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    {formatTime(
                                      n.time
                                    )}
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
        </header>

        {/* =================================================
           CHAT LAYOUT
           
           IMPORTANT:
           lg:flex makes the conversation list and chat
           appear SIDE-BY-SIDE on desktop.
        ================================================= */}

        <div
          className="
            relative
            flex-1
            min-h-0
            overflow-hidden

            lg:flex
            lg:flex-row
          "
        >

          {/* ===============================================
             CONVERSATIONS
          =============================================== */}

          <section
            className={`
              absolute
              inset-0

              lg:relative
              lg:inset-auto
              lg:w-96
              lg:h-full
              lg:flex-shrink-0
              lg:flex

              border-r
              border-white/30
              bg-white/45
              backdrop-blur-2xl
              flex-col

              ${
                mobileChatOpen
                  ? "hidden lg:flex"
                  : "flex"
              }
            `}
          >
            {/* SEARCH */}

            <div className="p-3 sm:p-4 lg:p-5 border-b border-white/30">
              <div className="flex items-center gap-3 px-3 sm:px-4 py-3 rounded-2xl bg-white/65 backdrop-blur-xl border border-white/50 shadow-sm">
                <Search
                  size={16}
                  className="text-gray-400 flex-shrink-0"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search students..."
                  className="
                    bg-transparent
                    outline-none
                    text-sm
                    w-full
                    min-w-0
                    placeholder:text-gray-400
                  "
                />

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 sm:mt-4 px-1 gap-2">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
                  {search.trim()
                    ? "Search Results"
                    : "Conversations"}
                </p>

                {!search.trim() &&
                  conversationUsers.length >
                    0 && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg whitespace-nowrap">
                      {
                        conversationUsers.length
                      }{" "}
                      active
                    </span>
                  )}
              </div>
            </div>

            {/* CONVERSATION LIST */}

            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 space-y-2">
              {filteredUsers.length ===
              0 ? (
                <div className="flex flex-col items-center justify-center h-full px-5 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-green-50 flex items-center justify-center mb-4">
                    {search.trim() ? (
                      <Search
                        size={22}
                        className="text-green-600"
                      />
                    ) : (
                      <MessageCircle
                        size={22}
                        className="text-green-600"
                      />
                    )}
                  </div>

                  {search.trim() ? (
                    <>
                      <p className="font-semibold text-gray-800">
                        No students found
                      </p>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs">
                        Try searching
                        using the
                        student's name.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800">
                        No conversations
                        yet
                      </p>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-xs">
                        Search for a
                        student above
                        to start a
                        conversation.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const meta =
                    conversationMeta[
                      u._id
                    ];

                  const unread =
                    unreadMap[
                      u._id
                    ] > 0;

                  const displayName =
                    getDisplayName(u);

                  const isActive =
                    String(
                      activeChat?._id
                    ) ===
                    String(u._id);

                  return (
                    <motion.button
                      key={u._id}
                      whileHover={{
                        y: -1,
                      }}
                      whileTap={{
                        scale: 0.99,
                      }}
                      onClick={() =>
                        openChat(u)
                      }
                      className={`
                        w-full
                        text-left
                        p-3
                        sm:p-3.5
                        rounded-2xl
                        sm:rounded-3xl
                        border
                        transition-all
                        ${
                          isActive
                            ? "bg-green-50 border-green-200 shadow-sm"
                            : unread
                              ? "bg-white border-green-100 shadow-sm"
                              : "bg-white/40 border-white/30 hover:bg-white/70"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Avatar
                          name={displayName}
                          photo={u.profilePhoto}
                          online={onlineUsers.includes(
                            u._id
                          )}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`
                                truncate
                                text-sm
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
                                  text-[9px] sm:text-[10px]
                                  whitespace-nowrap
                                  ${
                                    unread
                                      ? "text-green-600 font-bold"
                                      : "text-gray-400"
                                  }
                                `}
                              >
                                {formatConversationTime(
                                  meta.lastMessageAt
                                )}
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
                                (onlineUsers.includes(
                                  u._id
                                )
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

          {/* ===============================================
             CHAT AREA
          =============================================== */}

          <section
            className={`
              absolute
              inset-0

              lg:relative
              lg:inset-auto
              lg:flex-1
              lg:h-full

              flex
              flex-col
              min-w-0
              overflow-hidden
              bg-white

              ${
                mobileChatOpen
                  ? "flex"
                  : "hidden lg:flex"
              }
            `}
          >
            {/* CHAT HEADER */}

            <div
              className="
                flex-shrink-0
                px-3
                sm:px-5
                lg:px-7
                py-3
                sm:py-4
                lg:py-5
                border-b border-white/30
                bg-white/45
                backdrop-blur-2xl
                min-h-[72px]
                sm:min-h-[80px]
                lg:min-h-[88px]
              "
            >
              {activeChat ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">

                    {/* =====================================
                       BACK BUTTON
                       
                       Visible on BOTH mobile and desktop.
                    ====================================== */}

                    <button
                      onClick={backToConversations}
                      className="
                        w-9
                        h-9
                        rounded-xl
                        bg-gray-50
                        border
                        border-gray-200
                        flex
                        items-center
                        justify-center
                        text-gray-600
                        flex-shrink-0
                        hover:bg-green-50
                        hover:text-green-600
                        hover:border-green-100
                        transition
                      "
                      aria-label="Back to conversations"
                      title="Back to conversations"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <Avatar
                      large
                      name={getDisplayName(
                        activeChat
                      )}
                      photo={
                        activeChat.profilePhoto
                      }
                      online={onlineUsers.includes(
                        activeChat._id
                      )}
                    />

                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                        {getDisplayName(
                          activeChat
                        )}
                      </h3>

                      <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                        <span
                          className={`
                            w-2 h-2 rounded-full
                            ${
                              onlineUsers.includes(
                                activeChat._id
                              )
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }
                          `}
                        />

                        <p className="text-[11px] sm:text-xs text-gray-500">
                          {onlineUsers.includes(
                            activeChat._id
                          )
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/40 flex-shrink-0">
                    <ShieldX
                      size={14}
                      className="text-green-600"
                    />

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
                      Choose a student
                      to start
                      messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* MESSAGES */}

            <div
              className="
                flex-1
                min-h-0
                overflow-y-auto
                px-3
                sm:px-5
                lg:px-8
                py-4
                sm:py-5
                lg:py-6
                bg-gradient-to-br
                from-[#F8FBFF]
                via-[#F3F8F5]
                to-[#EEF5F0]
              "
            >
              {!activeChat ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-sm px-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm mx-auto flex items-center justify-center mb-5">
                      <MessageCircle
                        size={26}
                        className="text-green-600"
                      />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                      Your guidance
                      inbox
                    </h3>

                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Select a student
                      from the
                      conversation
                      list to view
                      messages and
                      provide
                      support.
                    </p>
                  </div>
                </div>
              ) : messages.length ===
                0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center px-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white/70 border border-white/50 mx-auto flex items-center justify-center mb-4">
                      <MessageCircle
                        size={22}
                        className="text-green-600"
                      />
                    </div>

                    <p className="font-semibold text-gray-800">
                      Start the
                      conversation
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Send a message
                      to{" "}
                      {getDisplayName(
                        activeChat
                      )}
                      .
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {messages.map(
                    (m, i) => {
                      const isMe =
                        String(
                          m.sender
                        ) ===
                        String(
                          user?._id
                        );

                      return (
                        <motion.div
                          key={
                            m.clientMessageId ||
                            m._id ||
                            `message-${i}`
                          }
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className={`flex ${
                            isMe
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`
                              max-w-[85%]
                              sm:max-w-[75%]
                              lg:max-w-[70%]
                              px-3.5
                              sm:px-5
                              py-3
                              sm:py-4
                              rounded-[1.5rem]
                              sm:rounded-[2rem]
                              shadow-sm
                              backdrop-blur-xl
                              border
                              ${
                                isMe
                                  ? "bg-green-600 text-white border-green-500 rounded-br-md"
                                  : "bg-white/75 border-white/60 text-gray-800 rounded-bl-md"
                              }
                              ${
                                m.pending
                                  ? "opacity-75"
                                  : ""
                              }
                            `}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {m.text}
                            </p>

                            <div
                              className={`
                                flex items-center justify-end gap-1.5
                                text-[9px]
                                sm:text-[10px]
                                mt-2
                                ${
                                  isMe
                                    ? "text-green-100"
                                    : "text-gray-400"
                                }
                              `}
                            >
                              <span>
                                {formatTime(
                                  m.createdAt
                                )}
                              </span>

                              {isMe && (
                                <CheckCheck
                                  size={11}
                                />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                  )}

                  <div
                    ref={
                      chatEndRef
                    }
                  />
                </div>
              )}
            </div>

            {/* INPUT */}

            {activeChat && (
              <div
                className="
                  flex-shrink-0
                  p-3
                  sm:p-4
                  lg:p-5
                  border-t border-white/30
                  bg-white/50
                  backdrop-blur-2xl
                "
              >
                <div className="flex gap-2 sm:gap-3">
                  <div className="flex-1 relative min-w-0">
                    <input
                      value={input}
                      onChange={(e) =>
                        setInput(
                          e.target.value
                        )
                      }
                      onKeyDown={
                        handleInputKeyDown
                      }
                      placeholder="Write a message..."
                      className="
                        w-full
                        px-4
                        sm:px-5
                        py-3.5
                        sm:py-4
                        pr-12
                        rounded-2xl
                        sm:rounded-3xl
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
                        text-sm
                      "
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hidden lg:block">
                      Enter
                    </span>
                  </div>

                  <motion.button
                    whileTap={{
                      scale: 0.94,
                    }}
                    whileHover={{
                      scale: 1.03,
                    }}
                    onClick={
                      sendMessage
                    }
                    disabled={
                      !input.trim()
                    }
                    className="
                      w-12
                      sm:w-14
                      flex-shrink-0
                      rounded-2xl
                      sm:rounded-3xl
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
                    <Send size={17} />
                  </motion.button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ===================================================
         TOAST
      =================================================== */}

      <AnimatePresence>
        {toastNotif && (
          <motion.button
            onClick={() => {
              const target =
                usersRef.current.find(
                  (u) =>
                    String(u._id) ===
                    String(
                      toastNotif.senderId
                    )
                ) ||
                conversationUsersRef.current.find(
                  (u) =>
                    String(u._id) ===
                    String(
                      toastNotif.senderId
                    )
                ) ||
                createUserFromMessage({
                  sender:
                    toastNotif.senderId,
                  senderName:
                    toastNotif.name,
                  senderProfilePhoto:
                    toastNotif.photo,
                });

              if (target) {
                openChat(target);

                setToastNotif(null);

                setUnreadMap(
                  (prev) => ({
                    ...prev,

                    [toastNotif.senderId]: 0,
                  })
                );
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
              top-3
              sm:top-5
              lg:top-6
              right-3
              sm:right-5
              lg:right-6
              z-[999]
              w-[calc(100vw-1.5rem)]
              sm:w-[360px]
              max-w-[360px]
              text-left
              bg-white/90
              backdrop-blur-2xl
              border border-white/60
              rounded-2xl
              sm:rounded-3xl
              shadow-2xl
              overflow-hidden
            "
          >
            <div className="p-3.5 sm:p-5 flex gap-3 sm:gap-4">
              <Avatar
                name={toastNotif.name}
                photo={toastNotif.photo}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    New Message
                  </p>

                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                </div>

                <p className="text-sm text-gray-700 mt-1 line-clamp-2 break-words">
                  {toastNotif.text}
                </p>

                <div className="flex justify-between gap-2 mt-3">
                  <span className="text-xs text-green-700 font-semibold truncate">
                    {toastNotif.name}
                  </span>

                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(
                      toastNotif.time
                    )}
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