import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "../lib/api.js";

import {
  LayoutDashboard,
  Users,
  ShieldX,
  ChartNoAxesCombined,
  Settings,
  Send,
  Search,
  Bell,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCheck,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  BriefcaseBusiness,
  HandHelping,
  MessageCircle,
  Sun,
  Moon,
  UsersRound,
  Clock3,
  Sparkles,
  SlidersHorizontal,
  CircleDot,
  PanelLeftClose,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";

const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket", "polling"],
});

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
        large ? "w-11 h-11 sm:w-14 sm:h-14" : "w-10 h-10 sm:w-12 sm:h-12"
      }`}
    >
      <div
        className={`
          ${large ? "w-11 h-11 sm:w-14 sm:h-14" : "w-10 h-10 sm:w-12 sm:h-12"}
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

const Nav = ({ icon, label, onClick, active, darkMode }) => (
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
          ? darkMode
            ? "bg-green-900/30 text-green-400 font-semibold"
            : "bg-green-50 text-green-700 font-semibold"
          : darkMode
            ? "text-gray-400 hover:bg-white/5 hover:text-gray-100"
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
            : darkMode
              ? "text-gray-500 group-hover:text-gray-200"
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


const ThemeToggle = ({ darkMode, setDarkMode }) => (
  <button
    onClick={() => setDarkMode((current) => !current)}
    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition ${darkMode ? "bg-[#101F17] border-emerald-950/50 text-slate-300 hover:bg-[#14261C]" : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"}`}
  >
    <div className="flex items-center gap-3">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${darkMode ? "bg-amber-950/40 text-amber-300" : "bg-white text-slate-500"}`}>
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      </span>
      {darkMode ? "Light mode" : "Dark mode"}
    </div>
    <span className={`relative w-9 h-5 rounded-full transition ${darkMode ? "bg-green-600" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition ${darkMode ? "left-[18px] bg-black" : "left-0.5 bg-white"}`} />
    </span>
  </button>
);

const GuidancePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("guided-theme") === "dark",
  );

  useEffect(() => {
    const syncTheme = () => {
      setDarkMode(localStorage.getItem("guided-theme") === "dark");
    };

    window.addEventListener("guided-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("guided-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const next = darkMode ? "light" : "dark";

    localStorage.setItem("guided-theme", next);
    setDarkMode(next === "dark");

    window.dispatchEvent(new Event("guided-theme-change"));
  };

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [conversationUsers, setConversationUsers] = useState([]);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [conversationFilter, setConversationFilter] = useState("all");
  const [showInsights, setShowInsights] = useState(true);

  const [conversationMeta, setConversationMeta] = useState({});

  const [unreadMap, setUnreadMap] = useState({});

  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [toastNotif, setToastNotif] = useState(null);

  const chatEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const usersRef = useRef([]);
  const conversationUsersRef = useRef([]);
  const currentUserRef = useRef(null);

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

  useEffect(() => {
    if (mobileSidebarOpen || openNotif) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen, openNotif]);

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

  const adminName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.name ||
    user?.fullName ||
    "Administrator";

  const adminPhoto =
    user?.profilePhoto || user?.profilePicture || user?.photo || null;

  const handleNavigation = (path) => {
    setMobileSidebarOpen(false);
    navigate(path);
  };

  useEffect(() => {
    if (!activeChat) return;

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, activeChat]);

  const formatTime = (time) => {
    if (!time) return "";

    const date = new Date(time);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const fetchNotifications = useCallback(async () => {
    const userId = useAuthStore.getState().user?._id;

    if (!userId) return;

    setNotificationLoading(true);

    try {
      const response = await API.get(`/api/notifications/${userId}/unread`);

      const incoming = response.data?.notifications || response.data || [];

      const unread = incoming.filter((notification) => !notification.isRead);

      unread.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

      setNotifications(unread);
      setNotifCount(unread.length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, user?._id]);

  useEffect(() => {
    const handleGlobalNotification = (event) => {
      const data = event?.detail;

      if (!data) return;

      const notificationId =
        data._id ||
        data.id ||
        data.notificationId ||
        `${data.type || "general"}-${Date.now()}`;

      const newNotification = {
        _id: notificationId,
        id: notificationId,

        title: data.title || "New Notification",

        message:
          data.message ||
          data.body ||
          data.text ||
          "You have a new notification.",

        type: data.type || data.notificationType || "general",

        priority: data.priority || "low",

        isRead: false,

        relatedId: data.relatedId || data.data?.relatedId || null,

        relatedType: data.relatedType || data.data?.relatedType || null,

        createdAt: data.createdAt || new Date().toISOString(),

        data: data.data || {},
      };

      setNotifications((prev) => {
        const alreadyExists = prev.some(
          (item) => String(item._id || item.id) === String(notificationId),
        );

        if (alreadyExists) {
          return prev;
        }

        setNotifCount((count) => count + 1);

        return [newNotification, ...prev];
      });
    };

    window.addEventListener(
      "eduguard:new-notification",
      handleGlobalNotification,
    );

    return () => {
      window.removeEventListener(
        "eduguard:new-notification",
        handleGlobalNotification,
      );
    };
  }, []);

  useEffect(() => {
    const handleGlobalMessage = (event) => {
      console.log("📩 Guidance received global message event:", event?.detail);
    };

    window.addEventListener("eduguard:new-message", handleGlobalMessage);

    return () => {
      window.removeEventListener("eduguard:new-message", handleGlobalMessage);
    };
  }, []);

  const markAsRead = async (notification) => {
    const notificationId = notification._id || notification.id;

    if (!notificationId) return;

    try {
      await API.put(`/api/notifications/read/${notificationId}`);

      setNotifications((prev) =>
        prev.filter(
          (item) => String(item._id || item.id) !== String(notificationId),
        ),
      );

      setNotifCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const userId = useAuthStore.getState().user?._id;

    if (!userId || notifications.length === 0) {
      return;
    }

    try {
      await API.put(`/api/notifications/${userId}/read-all`);

      setNotifications([]);
      setNotifCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  /* =======================================================
     NOTIFICATION ICON
  ======================================================= */

  const getNotificationIcon = (notification) => {
    if (
      notification.type === "message" ||
      notification.relatedType === "Message"
    ) {
      return <MessageSquare size={15} className="text-blue-600" />;
    }

    if (
      notification.type === "report" ||
      notification.relatedType === "Report"
    ) {
      return <FileText size={15} className="text-green-700" />;
    }

    if (
      notification.type === "incident" ||
      notification.relatedType === "Incident"
    ) {
      return <AlertTriangle size={15} className="text-red-600" />;
    }

    return <Bell size={15} className="text-green-700" />;
  };

  /* =======================================================
     NOTIFICATION BACKGROUND
  ======================================================= */

  const getNotificationBackground = (notification) => {
    if (
      notification.type === "message" ||
      notification.relatedType === "Message"
    ) {
      return darkMode ? "bg-blue-900/30" : "bg-blue-50";
    }

    if (
      notification.type === "report" ||
      notification.relatedType === "Report"
    ) {
      return darkMode ? "bg-green-900/30" : "bg-green-100";
    }

    if (
      notification.type === "incident" ||
      notification.relatedType === "Incident"
    ) {
      return darkMode ? "bg-red-900/30" : "bg-red-50";
    }

    return darkMode ? "bg-green-900/30" : "bg-green-100";
  };

  /* =======================================================
     LOAD USERS + CONVERSATIONS
  ======================================================= */

  useEffect(() => {
    if (!user?._id) return;

    let cancelled = false;

    const loadUsersAndConversations = async () => {
      try {
        /*
          IMPORTANT:
          API is an Axios instance.

          Correct:
          API.get("/api/users")

          Incorrect:
          fetch(`${API}/api/users`)
        */

        const response = await API.get("/api/users");

        const data = response.data;

        if (cancelled) return;

        const allUsers = Array.isArray(data) ? data : data?.users || [];

        const otherUsers = allUsers.filter(
          (u) => String(u._id) !== String(user._id),
        );

        setUsers(otherUsers);
        usersRef.current = otherUsers;

        const conversationChecks = await Promise.all(
          otherUsers.map(async (u) => {
            try {
              const chatId = [String(user._id), String(u._id)].sort().join("-");

              const messageResponse = await API.get(`/api/messages/${chatId}`);

              const chatData = messageResponse.data;

              const chatMessages = Array.isArray(chatData?.messages)
                ? chatData.messages
                : [];

              const lastMessage =
                chatMessages.length > 0
                  ? chatMessages[chatMessages.length - 1]
                  : null;

              const unreadCount = chatMessages.filter(
                (message) =>
                  String(message.receiver) === String(user._id) &&
                  message.seen === false,
              ).length;

              return {
                user: u,
                hasConversation: chatMessages.length > 0,
                lastMessage,
                unreadCount,
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
                unreadCount: 0,
              };
            }
          }),
        );

        if (cancelled) return;

        const existingConversations = conversationChecks
          .filter((item) => item.hasConversation)
          .map((item) => item.user);

        const meta = {};
        const unreadCounts = {};

        conversationChecks.forEach((item) => {
          const userId = String(item.user._id);

          if (item.lastMessage) {
            const message = item.lastMessage;

            meta[userId] = {
              lastMessage: message.text || "",
              lastMessageAt: message.createdAt || message.updatedAt || null,
            };
          }

          if (item.unreadCount > 0) {
            unreadCounts[userId] = item.unreadCount;
          }
        });

        setConversationMeta(meta);

        setConversationUsers(existingConversations);

        conversationUsersRef.current = existingConversations;

        /*
          DATABASE IS THE SOURCE OF TRUTH
          FOR UNREAD MESSAGES.
        */
        setUnreadMap(unreadCounts);
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
     SOCKET
  ======================================================= */

  useEffect(() => {
    if (!user?._id) return;

    const userId = String(user._id);

    console.log("🔌 Registering Guidance socket:", userId);

    socket.emit("register", userId);

    const handleOnlineUsers = (online) => {
      console.log("🟢 Online users:", online);

      setOnlineUsers((online || []).map((id) => String(id)));
    };

    const handleReceiveMessage = (msg) => {
      if (!msg) return;

      console.log("📩 REALTIME MESSAGE RECEIVED:", msg);

      const senderId = String(msg.sender);
      const receiverId = String(msg.receiver);
      const currentUserId = String(currentUserRef.current?._id || "");

      if (senderId !== currentUserId && receiverId !== currentUserId) {
        return;
      }

      /*
        Ignore our own socket receive event.
        The send ACK handles our optimistic message.
      */
      if (senderId === currentUserId) {
        console.log("⏭️ Ignoring own receive_message event. ACK handles it.");

        return;
      }

      const otherUserId = senderId;

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

      setConversationMeta((prev) => ({
        ...prev,

        [otherUserId]: {
          lastMessage: msg.text || "",
          lastMessageAt: msg.createdAt || new Date().toISOString(),
        },
      }));

      const currentChat = activeChatRef.current;

      const isCurrentChat =
        currentChat && String(currentChat._id) === otherUserId;

      /*
        If admin is currently viewing the
        conversation, immediately mark the
        incoming message as seen.
      */
      if (isCurrentChat) {
        setMessages((prev) => {
          if (
            msg._id &&
            prev.some(
              (message) =>
                message._id && String(message._id) === String(msg._id),
            )
          ) {
            return prev;
          }

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

        const chatId = [currentUserId, otherUserId].sort().join("-");

        API.patch(`/api/messages/${chatId}/seen`, {
          userId: currentUserId,
        }).catch((error) => {
          console.warn("⚠️ Failed to mark realtime message as seen:", error);
        });

        return;
      }

      /*
        Chat is NOT open:
        increase unread count.
      */
      setUnreadMap((prev) => ({
        ...prev,

        [senderId]: (prev[senderId] || 0) + 1,
      }));

      const notif = {
        id: msg._id || msg.clientMessageId || `${senderId}-${Date.now()}`,

        text: msg.text || "",

        name: msg.senderName || getDisplayName(chatUser) || "User",

        photo: msg.senderProfilePhoto || chatUser?.profilePhoto || null,

        time: msg.createdAt || new Date().toISOString(),

        senderId,
      };

      console.log("🔔 Creating message toast:", notif);

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
    if (!u?._id || !user?._id) {
      return;
    }

    setMobileChatOpen(true);

    console.log("💬 Opening chat with:", getDisplayName(u), u._id);

    setActiveChat(u);
    activeChatRef.current = u;

    /*
      Clear unread indicator immediately
      in the UI.
    */
    setUnreadMap((prev) => ({
      ...prev,

      [u._id]: 0,
    }));

    const chatId = [String(user._id), String(u._id)].sort().join("-");

    try {
      /*
        Load messages using Axios.
      */
      const response = await API.get(`/api/messages/${chatId}`);

      const data = response.data;

      const chatMessages = Array.isArray(data?.messages) ? data.messages : [];

      if (String(activeChatRef.current?._id) !== String(u._id)) {
        return;
      }

      setMessages(chatMessages);

      try {
        await API.patch(`/api/messages/${chatId}/seen`, {
          userId: user._id,
        });

        setMessages((prev) =>
          prev.map((message) => {
            if (String(message.receiver) === String(user._id)) {
              return {
                ...message,
                seen: true,
              };
            }

            return message;
          }),
        );

        console.log("👁️ Conversation marked as seen:", chatId);
      } catch (seenError) {
        console.warn("⚠️ Failed to mark conversation as seen:", seenError);
      }

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

          if (alreadyExists) {
            return prev;
          }

          const next = [...prev, u];

          conversationUsersRef.current = next;

          return next;
        });
      }
    } catch (error) {
      console.error("Failed to open chat:", error);

      if (String(activeChatRef.current?._id) === String(u._id)) {
        setMessages([]);
      }
    }
  };

  const backToConversations = () => {
    setActiveChat(null);
    activeChatRef.current = null;
    setMessages([]);
    setInput("");
    setMobileChatOpen(false);
  };

  const closeMobileChat = () => {
    backToConversations();
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !user?._id) {
      return;
    }

    const text = input.trim();

    const clientMessageId = `client-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const createdAt = new Date().toISOString();

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
      if (prev.some((message) => message.clientMessageId === clientMessageId)) {
        return prev;
      }

      return [...prev, optimisticMessage];
    });

    setConversationMeta((prev) => ({
      ...prev,

      [activeChat._id]: {
        lastMessage: text,
        lastMessageAt: createdAt,
      },
    }));

    setConversationUsers((prev) => {
      const exists = prev.some((u) => String(u._id) === String(activeChat._id));

      if (exists) return prev;

      const next = [...prev, activeChat];

      conversationUsersRef.current = next;

      return next;
    });

    setInput("");

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

        setMessages((prev) => {
          const optimisticIndex = prev.findIndex(
            (message) => message.clientMessageId === clientMessageId,
          );

          if (optimisticIndex === -1) {
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
      },
    );
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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

  const unreadTotal = useMemo(() => {
    return Object.values(unreadMap).reduce((total, count) => total + count, 0);
  }, [unreadMap]);

  const onlineConversationCount = useMemo(
    () =>
      conversationUsers.filter((u) =>
        onlineUsers.includes(String(u._id)),
      ).length,
    [conversationUsers, onlineUsers],
  );

  const displayedUsers = useMemo(() => {
    if (conversationFilter === "unread") {
      return filteredUsers.filter((u) => (unreadMap[u._id] || 0) > 0);
    }

    if (conversationFilter === "online") {
      return filteredUsers.filter((u) =>
        onlineUsers.includes(String(u._id)),
      );
    }

    return filteredUsers;
  }, [filteredUsers, conversationFilter, unreadMap, onlineUsers]);

  const handleNotificationClick = async (notification) => {
    const type = notification.type;

    const relatedType = notification.relatedType;

    await markAsRead(notification);

    setOpenNotif(false);

    if (type === "message" || relatedType === "Message") {
      const senderId =
        notification.data?.senderId ||
        notification.data?.sender ||
        notification.relatedId;

      const senderName =
        notification.data?.senderName ||
        notification.data?.sender?.name ||
        notification.title ||
        "Student";

      const senderPhoto =
        notification.data?.senderProfilePhoto ||
        notification.data?.sender?.profilePhoto ||
        null;

      if (senderId) {
        const target =
          usersRef.current.find((u) => String(u._id) === String(senderId)) ||
          conversationUsersRef.current.find(
            (u) => String(u._id) === String(senderId),
          ) ||
          createUserFromMessage({
            sender: senderId,
            senderName,
            senderProfilePhoto: senderPhoto,
          });

        if (target) {
          await openChat(target);

          setUnreadMap((prev) => ({
            ...prev,
            [senderId]: 0,
          }));
        } else {
          navigate("/guidance");
        }
      } else {
        navigate("/guidance");
      }

      return;
    }

    if (type === "report" || relatedType === "Report") {
      navigate("/reports");
      return;
    }

    if (type === "incident" || relatedType === "Incident") {
      navigate("/cases");
      return;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const pageBg = darkMode
  ? "bg-[#0B1110] text-gray-100"
  : "bg-[#F7F9F8] text-gray-900";

const textPrimary = darkMode
  ? "text-slate-100"
  : "text-slate-900";

const textSecondary = darkMode
  ? "text-slate-400"
  : "text-slate-500";

const textMuted = darkMode
  ? "text-slate-500"
  : "text-gray-400";

const sidebarBg = darkMode ? "bg-[#09150F]" : "bg-white";

  const headerBg = darkMode
    ? "bg-[#0B1110]/95 border-gray-800"
    : "bg-[#F7F9F8]/95 border-gray-100";

  const mainPanelBg = darkMode ? "bg-[#101817]" : "bg-white";

  return (
    <div
      className={`h-[100dvh] w-full flex overflow-hidden transition-colors duration-200 ${pageBg}`}
    >
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className={`
          hidden lg:flex
          fixed left-0 top-0 bottom-0
          z-40
          w-[250px] xl:w-[270px]
          flex-col justify-between
          px-4 xl:px-5 py-6
          overflow-y-auto
          border-r
          transition-colors duration-300
          ${
            darkMode
              ? "bg-[#09150F] border-emerald-950/60"
              : "bg-white border-gray-100"
          }
        `}
      >
        <div>
          {/* BRAND */}

          <div className="px-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 xl:w-11 h-10 xl:h-11 flex items-center justify-center flex-shrink-0">
                <img
                  src="/school-logo.webp"
                  alt="School Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1
                  className={`text-xl font-extrabold tracking-tight ${textPrimary}`}
                >
                  Guid
                  <span className="text-green-500">Ed</span>
                </h1>

                <p
                  className={`text-[9px] uppercase tracking-widest font-semibold truncate ${textMuted}`}
                >
                  Student Guidance
                </p>
              </div>
            </div>

            <p
              className={`text-[11px] leading-relaxed mt-4 ${textMuted}`}
            >
              Our Lady of the Holy Rosary School
              <br />
              General Trias Campus
            </p>
          </div>

          {/* NAVIGATION */}

          <p
            className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
          >
            Main Menu
          </p>

          <div className="space-y-1">
            <Nav
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() =>
                handleNavigation("/dashboard")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<Users size={18} />}
              label="Students"
              onClick={() => handleNavigation("/students")}
              darkMode={darkMode}
            />

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              active
              darkMode={darkMode}
            />

            <Nav
              icon={<ChartNoAxesCombined size={18} />}
              label="Reports"
              onClick={() =>
                handleNavigation("/reports")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<BriefcaseBusiness size={18} />}
              label="Cases"
              onClick={() =>
                handleNavigation("/cases")
              }
              darkMode={darkMode}
            />

            <Nav
              icon={<HandHelping size={18} />}
              label="Interventions"
              onClick={() =>
                handleNavigation("/interventions")
              }
              darkMode={darkMode}
            />
          </div>

          <p
            className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
          >
            System
          </p>

          <Nav
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() =>
              handleNavigation("/settings")
            }
            darkMode={darkMode}
          />
        </div>

        {/* SIDEBAR FOOTER */}

        <div className="space-y-3 mt-8">
          <div
            className={`p-3 rounded-2xl border ${
              darkMode
                ? "bg-[#101F17] border-emerald-950/50"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  relative w-10 h-10 rounded-xl
                  overflow-hidden
                  flex items-center justify-center
                  flex-shrink-0
                  ${
                    darkMode
                      ? "bg-emerald-950 text-emerald-300"
                      : "bg-green-100 text-green-700"
                  }
                `}
              >
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
                  <span className="font-bold">
                    {adminName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <span
                  className={`
                    absolute bottom-0.5 right-0.5
                    w-2.5 h-2.5 rounded-full
                    bg-green-500 border-2
                    ${
                      darkMode
                        ? "border-[#101F17]"
                        : "border-white"
                    }
                  `}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}
                >
                  Administrator
                </p>

                <p
                  className={`text-sm font-bold truncate ${textPrimary}`}
                >
                  {adminName}
                </p>
              </div>
            </div>
          </div>

          {/* THEME */}

          <ThemeToggle
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

          <button
            onClick={logout}
            className={`
              w-full
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              border
              transition
              ${
                darkMode
                  ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300 hover:border-red-900/40"
                  : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
              }
            `}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setMobileSidebarOpen(false)
              }
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={`
                fixed
                left-0
                top-0
                bottom-0
                z-50
                w-[min(82vw,300px)]
                flex
                flex-col
                justify-between
                px-5
                py-6
                overflow-y-auto
                border-r
                lg:hidden
                ${
                  darkMode
                    ? "bg-[#09150F] border-emerald-950/60"
                    : "bg-white border-gray-100"
                }
              `}
            >
              <div>
                {/* MOBILE BRAND */}

                <div className="px-3 mb-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                        <img
                          src="/school-logo.webp"
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <h1
                          className={`text-xl font-extrabold tracking-tight ${textPrimary}`}
                        >
                          Guid
                          <span className="text-green-500">
                            Ed
                          </span>
                        </h1>

                        <p
                          className={`text-[9px] uppercase tracking-widest font-semibold ${textMuted}`}
                        >
                          Student Guidance
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setMobileSidebarOpen(false)
                      }
                      className={`
                        w-9 h-9 rounded-xl
                        flex items-center justify-center
                        flex-shrink-0
                        ${
                          darkMode
                            ? "bg-[#101F17] text-slate-400"
                            : "bg-gray-50 text-gray-500"
                        }
                      `}
                      aria-label="Close menu"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed mt-4 ${textMuted}`}
                  >
                    Our Lady of the Holy Rosary School
                    <br />
                    General Trias Campus
                  </p>
                </div>

                <p
                  className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                >
                  Main Menu
                </p>

                <div className="space-y-1">
                  <Nav
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    onClick={() =>
                      handleNavigation("/dashboard")
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={<Users size={18} />}
                    label="Students"
                    onClick={() => handleNavigation("/students")}
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={<ShieldX size={18} />}
                    label="Guidance"
                    active
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <ChartNoAxesCombined size={18} />
                    }
                    label="Reports"
                    onClick={() =>
                      handleNavigation("/reports")
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={
                      <BriefcaseBusiness size={18} />
                    }
                    label="Cases"
                    onClick={() =>
                      handleNavigation("/cases")
                    }
                    darkMode={darkMode}
                  />

                  <Nav
                    icon={<HandHelping size={18} />}
                    label="Interventions"
                    onClick={() =>
                      handleNavigation("/interventions")
                    }
                    darkMode={darkMode}
                  />
                </div>

                <p
                  className={`px-3 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                >
                  System
                </p>

                <Nav
                  icon={<Settings size={18} />}
                  label="Settings"
                  onClick={() =>
                    handleNavigation("/settings")
                  }
                  darkMode={darkMode}
                />
              </div>

              <div className="space-y-3 mt-8">
                <div
                  className={`p-3 rounded-2xl border ${
                    darkMode
                      ? "bg-[#101F17] border-emerald-950/50"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        relative w-10 h-10 rounded-xl
                        overflow-hidden
                        flex items-center justify-center
                        flex-shrink-0
                        ${
                          darkMode
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-green-100 text-green-700"
                        }
                      `}
                    >
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
                        <span className="font-bold">
                          {adminName
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}

                      <span
                        className={`
                          absolute bottom-0.5 right-0.5
                          w-2.5 h-2.5 rounded-full
                          bg-green-500 border-2
                          ${
                            darkMode
                              ? "border-[#101F17]"
                              : "border-white"
                          }
                        `}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[9px] uppercase tracking-wider font-bold ${textMuted}`}
                      >
                        Administrator
                      </p>

                      <p
                        className={`text-sm font-bold truncate ${textPrimary}`}
                      >
                        {adminName}
                      </p>
                    </div>
                  </div>
                </div>

                <ThemeToggle
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />

                <button
                  onClick={logout}
                  className={`
                    w-full
                    flex
                    items-center
                    justify-center
                    gap-2
                    py-2.5
                    rounded-xl
                    text-sm
                    font-semibold
                    border
                    transition
                    ${
                      darkMode
                        ? "text-slate-400 border-emerald-950/50 hover:bg-red-950/30 hover:text-red-300"
                        : "text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600"
                    }
                  `}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================

          MAIN
      =================================================== */}

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden lg:ml-[250px] xl:ml-[270px]">
        {/* HEADER */}

        <header
          className={`
            flex-shrink-0
            backdrop-blur-xl
            border-b
            px-4
            sm:px-6
            lg:px-8
            py-3
            sm:py-4
            lg:py-5
            transition-colors
            ${headerBg}
          `}
        >
          {/* MOBILE BRAND */}

          <div className="flex lg:hidden items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className={`
                  w-10
                  h-10
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                  shadow-sm
                  ${
                    darkMode
                      ? "bg-white/5 border-gray-800 text-gray-300"
                      : "bg-white border-gray-200 text-gray-600"
                  }
                `}
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
                <h1
                  className={`text-lg font-extrabold tracking-tight ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Guid
                  <span className="text-green-600">Ed</span>
                </h1>

                <p
                  className={`text-[8px] uppercase tracking-widest font-semibold truncate ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Student Guidance
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpenNotif((prev) => !prev)}
              className={`
                relative
                w-10
                h-10
                rounded-xl
                border
                flex
                items-center
                justify-center
                flex-shrink-0
                shadow-sm
                ${
                  darkMode
                    ? "bg-white/5 border-gray-800 text-gray-300"
                    : "bg-white border-gray-200 text-gray-600"
                }
              `}
            >
              <Bell size={17} />

              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
          </div>

          {/* BREADCRUMB */}

          <div className="flex items-center gap-2 mb-3 lg:mb-4">
            <span
              className={`text-[11px] sm:text-xs font-medium ${
                darkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Overview
            </span>

            <span
              className={`text-[11px] sm:text-xs ${
                darkMode ? "text-gray-700" : "text-gray-300"
              }`}
            >
              /
            </span>

            <span className="text-[11px] sm:text-xs font-semibold text-green-500">
              Guidance
            </span>
          </div>

          {/* PAGE HEADER */}

          <div className="flex items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className={`
                  w-10 h-10
                  sm:w-12 sm:h-12
                  rounded-xl
                  sm:rounded-2xl
                  flex
                  items-center
                  justify-center
                  border
                  flex-shrink-0
                  ${
                    darkMode
                      ? "bg-green-900/20 text-green-400 border-green-900/30"
                      : "bg-green-50 text-green-600 border-green-100"
                  }
                `}
              >
                <MessageCircle size={18} className="sm:hidden" />

                <MessageCircle
                  size={21}
                  strokeWidth={2.2}
                  className="hidden sm:block"
                />
              </div>

              <div className="min-w-0">
                <h2
                  className={`
                    text-lg
                    sm:text-xl
                    lg:text-2xl
                    font-black
                    tracking-tight
                    leading-tight
                    truncate
                    ${darkMode ? "text-white" : "text-gray-900"}
                  `}
                >
                  Guidance Messaging
                </h2>

                <p
                  className={`text-xs sm:text-sm mt-1 truncate ${
                    darkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Real-time communication and student support
                </p>
              </div>
            </div>

            {/* DESKTOP NOTIFICATION */}

            <button
              onClick={() => setOpenNotif((prev) => !prev)}
              className={`
                relative
                w-11
                h-11
                rounded-xl
                border
                flex
                items-center
                justify-center
                transition
                flex-shrink-0
                hidden
                lg:flex
                ${
                  darkMode
                    ? "bg-white/5 border-gray-800 text-gray-300 hover:bg-white/10"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              <Bell size={18} />

              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* =================================================
            GUIDANCE WORKSPACE
            Redesigned visual layer — messaging logic remains intact.
        ================================================= */}
        <div
          className={`
            relative flex-1 min-h-0 overflow-hidden
            ${darkMode ? "bg-[#08110E]" : "bg-[#F4F8F6]"}
          `}
        >
          <div
            className={`
              absolute inset-0 pointer-events-none
              ${
                darkMode
                  ? "bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.10),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(16,185,129,0.07),transparent_30%)]"
                  : "bg-[radial-gradient(circle_at_15%_0%,rgba(34,197,94,0.10),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(16,185,129,0.08),transparent_32%)]"
              }
            `}
          />

          <div className="relative h-full flex flex-col">
            {/* INSIGHTS STRIP */}
            <AnimatePresence initial={false}>
              {!activeChat && showInsights && (
                <motion.section
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  className="flex-shrink-0 px-3 sm:px-5 lg:px-7 pt-3 sm:pt-4"
                >
                  <div
                    className={`
                      rounded-[1.5rem] sm:rounded-[2rem] border overflow-hidden
                      ${
                        darkMode
                          ? "bg-[#101B17]/90 border-emerald-950/70"
                          : "bg-white/85 border-white shadow-sm"
                      }
                    `}
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          label: "Active conversations",
                          value: conversationUsers.length,
                          icon: <MessageSquare size={16} />,
                          tone: "green",
                        },
                        {
                          label: "Unread messages",
                          value: unreadTotal,
                          icon: <Bell size={16} />,
                          tone: "amber",
                        },
                        {
                          label: "Students online",
                          value: onlineConversationCount,
                          icon: <CircleDot size={16} />,
                          tone: "blue",
                        },
                        {
                          label: "Support status",
                          value: "Live",
                          icon: <CheckCircle2 size={16} />,
                          tone: "emerald",
                        },
                      ].map((item, index) => (
                        <div
                          key={item.label}
                          className={`
                            px-4 py-3.5 sm:px-5 sm:py-4
                            ${
                              index > 1
                                ? "border-t lg:border-t-0"
                                : ""
                            }
                            ${
                              index % 2 === 1
                                ? "border-l"
                                : ""
                            }
                            ${
                              index === 2
                                ? "lg:border-l"
                                : ""
                            }
                            ${
                              darkMode
                                ? "border-emerald-950/50"
                                : "border-gray-100"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`
                                w-8 h-8 rounded-xl flex items-center justify-center
                                ${
                                  item.tone === "amber"
                                    ? darkMode
                                      ? "bg-amber-400/10 text-amber-300"
                                      : "bg-amber-50 text-amber-600"
                                    : item.tone === "blue"
                                      ? darkMode
                                        ? "bg-blue-400/10 text-blue-300"
                                        : "bg-blue-50 text-blue-600"
                                      : darkMode
                                        ? "bg-green-400/10 text-green-300"
                                        : "bg-green-50 text-green-600"
                                }
                              `}
                            >
                              {item.icon}
                            </span>
                            <div className="min-w-0">
                              <p
                                className={`text-[9px] uppercase tracking-wider font-bold truncate ${textMuted}`}
                              >
                                {item.label}
                              </p>
                              <p
                                className={`text-base sm:text-lg font-black mt-0.5 ${textPrimary}`}
                              >
                                {item.value}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* WORKSPACE */}
            <div className="flex-1 min-h-0 p-3 sm:p-5 lg:p-7">
              <div
                className={`
                  h-full min-h-0 overflow-hidden
                  rounded-[1.75rem] sm:rounded-[2.25rem]
                  border shadow-xl shadow-black/[0.03]
                  flex flex-col lg:flex-row
                  ${
                    darkMode
                      ? "bg-[#0D1714]/95 border-emerald-950/70"
                      : "bg-white/90 border-white"
                  }
                  backdrop-blur-2xl
                `}
              >
                {/* CONVERSATION RAIL */}
                <section
                  className={`
                    ${activeChat ? "hidden lg:flex" : "flex"}
                    w-full lg:w-[370px] xl:w-[400px]
                    flex-shrink-0 min-h-0 flex-col border-r
                    ${
                      darkMode
                        ? "border-emerald-950/60"
                        : "border-gray-100"
                    }
                  `}
                >
                  {/* RAIL HEADER */}
                  <div
                    className={`
                      flex-shrink-0 p-4 sm:p-5
                      ${
                        darkMode
                          ? "bg-[#101B17]"
                          : "bg-[#FBFDFC]"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span
                            className={`text-[9px] uppercase tracking-[0.18em] font-black ${darkMode ? "text-green-400" : "text-green-600"}`}
                          >
                            Live desk
                          </span>
                        </div>
                        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${textPrimary}`}>
                          Student Inbox
                        </h3>
                        <p className={`text-xs mt-1 ${textSecondary}`}>
                          Keep every student conversation within reach.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowInsights((v) => !v)}
                        className={`
                          w-9 h-9 rounded-xl border flex items-center justify-center
                          transition
                          ${
                            darkMode
                              ? "border-gray-800 bg-white/5 text-gray-400 hover:text-green-300"
                              : "border-gray-200 bg-white text-gray-500 hover:text-green-600"
                          }
                        `}
                        title={showInsights ? "Hide insights" : "Show insights"}
                      >
                        <PanelLeftClose size={16} />
                      </button>
                    </div>

                    {/* SEARCH */}
                    <div
                      className={`
                        flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border
                        ${
                          darkMode
                            ? "bg-[#0A1310] border-gray-800"
                            : "bg-white border-gray-200"
                        }
                      `}
                    >
                      <Search size={16} className={textMuted} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Find a student..."
                        className={`
                          flex-1 min-w-0 bg-transparent outline-none text-sm
                          ${
                            darkMode
                              ? "text-white placeholder:text-gray-600"
                              : "text-gray-800 placeholder:text-gray-400"
                          }
                        `}
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className={`text-[11px] font-bold ${darkMode ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* FILTER PILLS */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5">
                      {[
                        ["all", "All", conversationUsers.length],
                        ["unread", "Unread", unreadTotal],
                        ["online", "Online", onlineConversationCount],
                      ].map(([value, label, count]) => (
                        <button
                          key={value}
                          onClick={() => setConversationFilter(value)}
                          className={`
                            flex items-center gap-1.5 px-3 py-2 rounded-xl
                            text-[11px] font-bold whitespace-nowrap transition-all
                            ${
                              conversationFilter === value
                                ? darkMode
                                  ? "bg-green-500 text-[#07100C]"
                                  : "bg-green-600 text-white"
                                : darkMode
                                  ? "bg-white/5 text-gray-400 hover:bg-white/10"
                                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                            }
                          `}
                        >
                          {label}
                          <span
                            className={`
                              min-w-4 h-4 px-1 rounded-md text-[9px] flex items-center justify-center
                              ${
                                conversationFilter === value
                                  ? "bg-white/20"
                                  : darkMode
                                    ? "bg-white/5"
                                    : "bg-white"
                              }
                            `}
                          >
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CONVERSATION LIST */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-2.5 sm:px-3 pb-3">
                    {displayedUsers.length === 0 ? (
                      <div className="h-full min-h-[260px] flex items-center justify-center text-center px-6">
                        <div>
                          <div
                            className={`
                              w-16 h-16 rounded-[1.5rem] mx-auto mb-4
                              flex items-center justify-center border
                              ${
                                darkMode
                                  ? "bg-green-400/10 border-green-900/40"
                                  : "bg-green-50 border-green-100"
                              }
                            `}
                          >
                            {search.trim() ? (
                              <Search size={23} className="text-green-500" />
                            ) : conversationFilter === "unread" ? (
                              <CheckCheck size={23} className="text-green-500" />
                            ) : (
                              <MessageCircle size={23} className="text-green-500" />
                            )}
                          </div>
                          <p className={`font-bold ${textPrimary}`}>
                            {search.trim()
                              ? "No students found"
                              : conversationFilter === "unread"
                                ? "Inbox is clear"
                                : conversationFilter === "online"
                                  ? "Nobody online"
                                  : "No conversations yet"}
                          </p>
                          <p className={`text-xs mt-2 leading-relaxed max-w-[240px] mx-auto ${textSecondary}`}>
                            {search.trim()
                              ? "Try another student name."
                              : conversationFilter === "unread"
                                ? "Unread student messages will appear here."
                                : conversationFilter === "online"
                                  ? "Online students will appear here when available."
                                  : "Search for a student above to begin a supportive conversation."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {displayedUsers.map((u, index) => {
                          const meta = conversationMeta[u._id];
                          const unread = unreadMap[u._id] > 0;
                          const displayName = getDisplayName(u);
                          const isActive =
                            String(activeChat?._id) === String(u._id);
                          const isOnline = onlineUsers.includes(String(u._id));

                          return (
                            <motion.button
                              key={u._id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(index * 0.025, 0.2) }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => openChat(u)}
                              className={`
                                w-full text-left p-3 rounded-2xl border transition-all
                                ${
                                  isActive
                                    ? darkMode
                                      ? "bg-green-500/[0.10] border-green-800/70"
                                      : "bg-green-50 border-green-200"
                                    : unread
                                      ? darkMode
                                        ? "bg-white/[0.035] border-green-900/60"
                                        : "bg-white border-green-100 shadow-sm"
                                      : darkMode
                                        ? "bg-white/[0.015] border-gray-800/80 hover:bg-white/[0.04]"
                                        : "bg-gray-50/60 border-gray-100 hover:bg-white"
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={displayName}
                                  photo={u.profilePhoto}
                                  online={isOnline}
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p
                                      className={`truncate text-sm ${
                                        unread
                                          ? "font-black"
                                          : "font-bold"
                                      } ${textPrimary}`}
                                    >
                                      {displayName}
                                    </p>
                                    {meta?.lastMessageAt && (
                                      <span
                                        className={`text-[9px] whitespace-nowrap ${
                                          unread
                                            ? "text-green-500 font-black"
                                            : textMuted
                                        }`}
                                      >
                                        {formatConversationTime(meta.lastMessageAt)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1">
                                    <p
                                      className={`text-xs truncate flex-1 ${
                                        unread
                                          ? darkMode
                                            ? "text-gray-200 font-semibold"
                                            : "text-gray-700 font-semibold"
                                          : textSecondary
                                      }`}
                                    >
                                      {meta?.lastMessage ||
                                        (isOnline ? "Available to chat" : "No messages yet")}
                                    </p>
                                    {unread && (
                                      <span className="min-w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.10)]" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {/* CHAT PANEL */}
                <section
                  className={`
                    ${activeChat ? "flex" : "hidden lg:flex"}
                    flex-1 min-w-0 min-h-0 flex-col
                    ${
                      darkMode
                        ? "bg-[#0B1411]"
                        : "bg-gradient-to-br from-[#FCFEFD] via-[#F6FAF8] to-[#F0F7F3]"
                    }
                  `}
                >
                  {/* CHAT TOPBAR */}
                  <div
                    className={`
                      flex-shrink-0 px-4 sm:px-6 lg:px-7 py-3.5 sm:py-4
                      border-b
                      ${
                        darkMode
                          ? "border-emerald-950/60 bg-[#101A17]/90"
                          : "border-gray-100 bg-white/75"
                      }
                      backdrop-blur-xl
                    `}
                  >
                    {activeChat ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={backToConversations}
                            className={`
                              w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 lg:hidden
                              ${
                                darkMode
                                  ? "bg-white/5 border-gray-800 text-gray-300"
                                  : "bg-white border-gray-200 text-gray-600"
                              }
                            `}
                            aria-label="Back to conversations"
                          >
                            <ArrowLeft size={17} />
                          </button>

                          <Avatar
                            large
                            name={getDisplayName(activeChat)}
                            photo={activeChat.profilePhoto}
                            online={onlineUsers.includes(String(activeChat._id))}
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-base sm:text-lg font-black truncate ${textPrimary}`}>
                                {getDisplayName(activeChat)}
                              </h3>
                              <span
                                className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${
                                  darkMode
                                    ? "bg-green-400/10 text-green-300"
                                    : "bg-green-50 text-green-700"
                                }`}
                              >
                                <ShieldX size={11} />
                                Student
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  onlineUsers.includes(String(activeChat._id))
                                    ? "bg-green-500 animate-pulse"
                                    : darkMode
                                      ? "bg-gray-700"
                                      : "bg-gray-300"
                                }`}
                              />
                              <p className={`text-[11px] ${textSecondary}`}>
                                {onlineUsers.includes(String(activeChat._id))
                                  ? "Online now"
                                  : "Offline"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                          <div
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-xl border
                              ${
                                darkMode
                                  ? "bg-white/5 border-gray-800"
                                  : "bg-white border-gray-100"
                              }
                            `}
                          >
                            <Sparkles size={14} className="text-green-500" />
                            <span className={`text-[10px] font-bold ${textSecondary}`}>
                              Guidance Support
                            </span>
                          </div>

                          <button
                            className={`
                              w-9 h-9 rounded-xl border flex items-center justify-center
                              ${
                                darkMode
                                  ? "bg-white/5 border-gray-800 text-gray-400"
                                  : "bg-white border-gray-100 text-gray-500"
                              }
                            `}
                            title="More options"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className={`text-[9px] uppercase tracking-[0.18em] font-black ${darkMode ? "text-green-400" : "text-green-600"}`}>
                              Guidance workspace
                            </span>
                          </div>
                          <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${textPrimary}`}>
                            Choose a student
                          </h3>
                          <p className={`text-xs mt-1 ${textSecondary}`}>
                            Select a conversation from the inbox to continue support.
                          </p>
                        </div>
                        <div
                          className={`
                            hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center border
                            ${
                              darkMode
                                ? "bg-green-400/10 border-green-900/40"
                                : "bg-green-50 border-green-100"
                            }
                          `}
                        >
                          <MessageCircle size={21} className="text-green-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MESSAGE CANVAS */}
                  <div
                    className={`
                      flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-9 py-5 sm:py-7
                      ${
                        darkMode
                          ? "bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.055),transparent_35%)]"
                          : "bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.06),transparent_38%)]"
                      }
                    `}
                  >
                    {!activeChat ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="max-w-md text-center px-5">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className={`
                              w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] mx-auto mb-6
                              flex items-center justify-center border shadow-lg
                              ${
                                darkMode
                                  ? "bg-green-400/10 border-green-900/40 shadow-green-950/20"
                                  : "bg-white border-green-100 shadow-green-100/60"
                              }
                            `}
                          >
                            <MessageCircle size={32} className="text-green-500" />
                          </motion.div>

                          <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${textPrimary}`}>
                            Your guidance inbox
                          </h3>
                          <p className={`text-sm leading-relaxed mt-2 ${textSecondary}`}>
                            A focused space for meaningful student support, timely replies, and real-time conversations.
                          </p>

                          <div className="grid grid-cols-2 gap-2.5 mt-6 max-w-sm mx-auto">
                            <div className={`rounded-2xl border p-3 text-left ${darkMode ? "bg-white/[0.03] border-gray-800" : "bg-white/80 border-gray-100"}`}>
                              <Clock3 size={15} className="text-green-500 mb-2" />
                              <p className={`text-xs font-bold ${textPrimary}`}>Real-time</p>
                              <p className={`text-[10px] mt-0.5 ${textSecondary}`}>Messages sync instantly</p>
                            </div>
                            <div className={`rounded-2xl border p-3 text-left ${darkMode ? "bg-white/[0.03] border-gray-800" : "bg-white/80 border-gray-100"}`}>
                              <ShieldX size={15} className="text-green-500 mb-2" />
                              <p className={`text-xs font-bold ${textPrimary}`}>Student-first</p>
                              <p className={`text-[10px] mt-0.5 ${textSecondary}`}>Built for guidance support</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="max-w-sm text-center px-5">
                          <div
                            className={`
                              w-16 h-16 rounded-[1.5rem] mx-auto mb-5
                              flex items-center justify-center border
                              ${
                                darkMode
                                  ? "bg-green-400/10 border-green-900/40"
                                  : "bg-white border-green-100"
                              }
                            `}
                          >
                            <Send size={22} className="text-green-500" />
                          </div>
                          <h4 className={`text-lg font-black ${textPrimary}`}>
                            Start a supportive conversation
                          </h4>
                          <p className={`text-sm mt-2 leading-relaxed ${textSecondary}`}>
                            Send the first message to {getDisplayName(activeChat)} and keep the conversation moving.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                        {messages.map((m, i) => {
                          const isMe = String(m.sender) === String(user?._id);

                          return (
                            <motion.div
                              key={m.clientMessageId || m._id || `message-${i}`}
                              initial={{ opacity: 0, y: 8, scale: 0.99 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`
                                  max-w-[88%] sm:max-w-[78%] lg:max-w-[68%]
                                  px-4 sm:px-5 py-3.5 sm:py-4 rounded-[1.5rem]
                                  border shadow-sm
                                  ${
                                    isMe
                                      ? "bg-green-600 text-white border-green-500 rounded-br-md shadow-green-900/10"
                                      : darkMode
                                        ? "bg-[#14201C] text-gray-200 border-gray-800 rounded-bl-md"
                                        : "bg-white text-gray-800 border-gray-100 rounded-bl-md"
                                  }
                                  ${m.pending ? "opacity-70" : ""}
                                `}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {m.text}
                                </p>

                                <div
                                  className={`
                                    flex items-center justify-end gap-1.5 mt-2
                                    text-[9px]
                                    ${
                                      isMe
                                        ? "text-green-100"
                                        : textMuted
                                    }
                                  `}
                                >
                                  <span>{formatTime(m.createdAt)}</span>
                                  {isMe && (
                                    <CheckCheck
                                      size={12}
                                      className={m.seen ? "text-green-100" : "opacity-60"}
                                    />
                                  )}
                                  {m.pending && <span>Sending...</span>}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>

                  {/* COMPOSER */}
                  {activeChat && (
                    <div
                      className={`
                        flex-shrink-0 p-3 sm:p-4 lg:px-6
                        border-t
                        ${
                          darkMode
                            ? "border-emerald-950/60 bg-[#0E1815]"
                            : "border-gray-100 bg-white/85"
                        }
                      `}
                    >
                      <div
                        className={`
                          max-w-4xl mx-auto flex items-end gap-2 p-2 rounded-2xl border
                          ${
                            darkMode
                              ? "bg-[#09110E] border-gray-800"
                              : "bg-gray-50 border-gray-200"
                          }
                        `}
                      >
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleInputKeyDown}
                          rows={1}
                          placeholder={`Message ${getDisplayName(activeChat)}...`}
                          className={`
                            flex-1 min-w-0 resize-none bg-transparent outline-none
                            px-2 py-2 text-sm max-h-28
                            ${
                              darkMode
                                ? "text-white placeholder:text-gray-600"
                                : "text-gray-800 placeholder:text-gray-400"
                            }
                          `}
                        />

                        <button
                          onClick={sendMessage}
                          disabled={!input.trim()}
                          className={`
                            w-10 h-10 rounded-xl flex items-center justify-center
                            flex-shrink-0 transition-all
                            ${
                              input.trim()
                                ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                                : darkMode
                                  ? "bg-white/5 text-gray-700"
                                  : "bg-gray-200 text-gray-400"
                            }
                          `}
                          title="Send message"
                        >
                          <Send size={16} />
                        </button>
                      </div>

                      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-1 mt-2">
                        <p className={`text-[9px] sm:text-[10px] ${textMuted}`}>
                          Enter to send · Shift + Enter for a new line
                        </p>
                        <span className={`hidden sm:inline-flex items-center gap-1.5 text-[9px] font-bold ${textMuted}`}>
                          <CircleDot size={10} className="text-green-500" />
                          Secure guidance channel
                        </span>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
        </main>

      <AnimatePresence>
        {toastNotif && (
          <motion.button
            onClick={() => {
              const target =
                usersRef.current.find(
                  (u) => String(u._id) === String(toastNotif.senderId),
                ) ||
                conversationUsersRef.current.find(
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
            className={`
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
              backdrop-blur-2xl
              border
              rounded-2xl
              sm:rounded-3xl
              shadow-2xl
              overflow-hidden
              ${
                darkMode
                  ? "bg-[#151F1D]/95 border-gray-800"
                  : "bg-white/90 border-white/60"
              }
            `}
          >
            <div className="p-3.5 sm:p-5 flex gap-3 sm:gap-4">
              <Avatar name={toastNotif.name} photo={toastNotif.photo} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`font-semibold text-sm sm:text-base ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    New Message
                  </p>

                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                </div>

                <p
                  className={`text-sm mt-1 line-clamp-2 break-words ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {toastNotif.text}
                </p>

                <div className="flex justify-between gap-2 mt-3">
                  <span className="text-xs text-green-500 font-semibold truncate">
                    {toastNotif.name}
                  </span>

                  <span
                    className={`text-xs whitespace-nowrap ${
                      darkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
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
