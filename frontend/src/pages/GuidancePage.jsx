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
  Clock3,
} from "lucide-react";

const socket = io("https://edu-guard-backend.onrender.com");

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
        large ? "w-14 h-14" : "w-12 h-12"
      }`}
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
      flex items-center gap-3
      px-4 py-3 rounded-2xl
      w-full text-sm
      transition-all duration-200
      ${
        active
          ? "bg-green-50 text-green-700 font-semibold shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }
    `}
  >
    {icon}
    {label}
  </button>
);

/* =========================================================
   GUIDANCE PAGE
========================================================= */

const GuidancePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [conversationUsers, setConversationUsers] = useState([]);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [search, setSearch] = useState("");

  /* =========================================================
     CHAT META
     Stores the latest message/time for every conversation.
  ========================================================= */

  const [conversationMeta, setConversationMeta] = useState({});

  /* =========================================================
     UNREAD
  ========================================================= */

  const [unreadMap, setUnreadMap] = useState({});

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

  /* =========================================================
     TOAST
  ========================================================= */

  const [toastNotif, setToastNotif] = useState(null);

  const chatEndRef = useRef(null);

  /* =========================================================
     ADMIN INFO
  ========================================================= */

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

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* =========================================================
     FORMAT TIME
  ========================================================= */

  const formatTime = (time) => {
    if (!time) return "";

    const date = new Date(time);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================================================
     FORMAT CONVERSATION PREVIEW TIME
  ========================================================= */

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

  /* =========================================================
   FETCH USERS + EXISTING CONVERSATIONS
   Also refresh user profile information periodically
========================================================= */

useEffect(() => {
  if (!user?._id) return;

  let cancelled = false;

  const loadUsersAndConversations = async () => {
    try {
      const res = await fetch(
        "https://edu-guard-backend.onrender.com/api/users",
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();

      if (!Array.isArray(data) || cancelled) return;

      /*
       * Normalize user data.
       *
       * Some accounts may have the photo under a different
       * property depending on which model/controller returned them.
       */
      const normalizedUsers = data.map((u) => ({
        ...u,

        profilePhoto:
          u.profilePhoto ||
          u.profilePicture ||
          u.photo ||
          null,

        name:
          u.name ||
          [u.firstName, u.middleName, u.lastName]
            .filter(Boolean)
            .join(" "),
      }));

      const otherUsers = normalizedUsers.filter(
        (u) => u._id !== user._id
      );

      /*
       * IMPORTANT:
       * Update the users state even if conversations
       * already exist.
       *
       * This makes profile-photo changes appear.
       */
      setUsers(otherUsers);

      /*
       * Update the users stored inside conversationUsers too.
       *
       * This is the part that fixes the issue where the
       * conversation list keeps the OLD profilePhoto.
       */
      setConversationUsers((prev) =>
        prev.map((existingUser) => {
          const updatedUser = otherUsers.find(
            (u) => u._id === existingUser._id
          );

          return updatedUser || existingUser;
        })
      );

      /*
       * If the currently opened chat changed its profile photo,
       * update activeChat as well.
       */
      setActiveChat((prev) => {
        if (!prev) return prev;

        const updatedUser = otherUsers.find(
          (u) => u._id === prev._id
        );

        return updatedUser || prev;
      });

      /*
       * Check existing conversations.
       *
       * NOTE:
       * We still do this on the initial load.
       * During periodic refreshes, we don't need to
       * repeatedly fetch every conversation.
       */
      if (!cancelled) {
        const conversationChecks = await Promise.all(
          otherUsers.map(async (u) => {
            try {
              const chatId = [user._id, u._id]
                .sort()
                .join("-");

              const response = await fetch(
                `https://edu-guard-backend.onrender.com/api/messages/${chatId}`,
                {
                  cache: "no-store",
                }
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
                hasConversation:
                  chatMessages.length > 0,
                lastMessage,
              };
            } catch (error) {
              console.error(
                `Failed to check conversation with ${u.name}:`,
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

        const existingConversations =
          conversationChecks
            .filter((item) => item.hasConversation)
            .map((item) => item.user);

        /*
         * IMPORTANT:
         * Merge refreshed user information into the
         * conversation list instead of replacing it
         * with potentially stale objects.
         */
        setConversationUsers((prev) => {
          const conversationIds = new Set(
            existingConversations.map((u) => u._id)
          );

          const updated = prev
            .map((oldUser) => {
              const freshUser = otherUsers.find(
                (u) => u._id === oldUser._id
              );

              return freshUser || oldUser;
            })
            .filter((u) => conversationIds.has(u._id));

          existingConversations.forEach((freshUser) => {
            const exists = updated.some(
              (u) => u._id === freshUser._id
            );

            if (!exists) {
              updated.push(freshUser);
            }
          });

          return updated;
        });

        /*
         * Build conversation metadata.
         */
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

        setConversationMeta((prev) => ({
          ...prev,
          ...meta,
        }));
      }
    } catch (error) {
      if (!cancelled) {
        console.error(
          "Failed to load users and conversations:",
          error
        );
      }
    }
  };

  /*
   * Initial load
   */
  loadUsersAndConversations();

  /*
   * Refresh profiles every 10 seconds.
   *
   * This catches profile-photo changes made by
   * another account while this page is open.
   */
  const interval = setInterval(() => {
    loadUsersAndConversations();
  }, 10000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [user?._id]);

  /* =========================================================
     SOCKET
  ========================================================= */

  useEffect(() => {
    if (!user?._id) return;

    socket.emit("register", user._id);

    const handleOnlineUsers = (online) => {
      setOnlineUsers(online || []);
    };

    const handleReceiveMessage = (msg) => {
      if (!msg) return;

      const senderId = msg.sender;

      /* ===============================================
         UPDATE CONVERSATION META
      =============================================== */

      setConversationMeta((prev) => ({
        ...prev,
        [senderId]: {
          lastMessage: msg.text || "",
          lastMessageAt:
            msg.createdAt || new Date().toISOString(),
        },
      }));

      /* ===============================================
         ADD SENDER TO CONVERSATION LIST
      =============================================== */

      setConversationUsers((prev) => {
        const exists = prev.some(
          (u) => u._id === senderId
        );

        if (exists) return prev;

        const foundUser = users.find(
          (u) => u._id === senderId
        );

        if (!foundUser) return prev;

        return [...prev, foundUser];
      });

      /* ===============================================
         IF CURRENT CHAT IS OPEN
      =============================================== */

      if (activeChat?._id === senderId) {
        setMessages((prev) => {
          const exists = prev.some(
            (message) =>
              message._id &&
              msg._id &&
              message._id === msg._id
          );

          if (exists) return prev;

          return [...prev, msg];
        });

        return;
      }

      /* ===============================================
         UNREAD
      =============================================== */

      setUnreadMap((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));

      /* ===============================================
         NOTIFICATION
      =============================================== */

      const notif = {
        id: msg._id || `${senderId}-${Date.now()}`,
        text: msg.text,
        name: msg.senderName || "User",
        time:
          msg.createdAt || new Date().toISOString(),
        senderId,
      };

      setNotifications((prev) => {
        const exists = prev.find(
          (n) => n.id === notif.id
        );

        if (exists) return prev;

        return [notif, ...prev.slice(0, 15)];
      });

      /* ===============================================
         TOAST
      =============================================== */

      setToastNotif(notif);

      setTimeout(() => {
        setToastNotif((current) =>
          current?.id === notif.id ? null : current
        );
      }, 4000);
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [user?._id, activeChat?._id, users]);

  /* =========================================================
     SORT CONVERSATIONS
  ========================================================= */

  const sortedConversationUsers = useMemo(() => {
    return [...conversationUsers].sort((a, b) => {
      const dateA = conversationMeta[a._id]?.lastMessageAt
        ? new Date(
            conversationMeta[a._id].lastMessageAt
          ).getTime()
        : 0;

      const dateB = conversationMeta[b._id]?.lastMessageAt
        ? new Date(
            conversationMeta[b._id].lastMessageAt
          ).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [conversationUsers, conversationMeta]);

  /* =========================================================
     OPEN CHAT
  ========================================================= */

  const openChat = async (u) => {
    setActiveChat(u);

    /* Clear unread immediately */
    setUnreadMap((prev) => ({
      ...prev,
      [u._id]: 0,
    }));

    const chatId = [user._id, u._id]
      .sort()
      .join("-");

    try {
      const res = await fetch(
        `https://edu-guard-backend.onrender.com/api/messages/${chatId}`
      );

      if (!res.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await res.json();

      const chatMessages = data.messages || [];

      setMessages(chatMessages);

      /* ===============================================
         UPDATE LAST MESSAGE
      =============================================== */

      if (chatMessages.length > 0) {
        const lastMessage =
          chatMessages[chatMessages.length - 1];

        setConversationMeta((prev) => ({
          ...prev,
          [u._id]: {
            lastMessage: lastMessage.text || "",
            lastMessageAt:
              lastMessage.createdAt ||
              lastMessage.updatedAt ||
              null,
          },
        }));

        /* =============================================
           ADD TO CONVERSATION LIST IF NEW
        ============================================= */

        setConversationUsers((prev) => {
          const alreadyExists = prev.some(
            (existingUser) =>
              existingUser._id === u._id
          );

          if (alreadyExists) return prev;

          return [...prev, u];
        });
      }
    } catch (error) {
      console.error(
        "Failed to open chat:",
        error
      );

      setMessages([]);
    }
  };

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;

    const text = input.trim();

    const msg = {
      sender: user._id,
      receiver: activeChat._id,
      text,
      createdAt: new Date().toISOString(),
    };

    socket.emit(
      "send_message",
      msg,
      (saved) => {
        if (saved?.error) {
          console.error(
            "❌ Message failed:",
            saved.message
          );
          return;
        }

        if (!saved) return;

        /* =============================================
           ADD MESSAGE
        ============================================= */

        setMessages((prev) => {
          const exists = prev.some(
            (message) =>
              message._id &&
              saved._id &&
              message._id === saved._id
          );

          if (exists) return prev;

          return [...prev, saved];
        });

        /* =============================================
           UPDATE META
        ============================================= */

        setConversationMeta((prev) => ({
          ...prev,
          [activeChat._id]: {
            lastMessage: saved.text || text,
            lastMessageAt:
              saved.createdAt ||
              new Date().toISOString(),
          },
        }));

        /* =============================================
           ADD TO CONVERSATION LIST
        ============================================= */

        setConversationUsers((prev) => {
          const alreadyExists = prev.some(
            (u) => u._id === activeChat._id
          );

          if (alreadyExists) return prev;

          return [...prev, activeChat];
        });
      }
    );

    setInput("");
  };

  /* =========================================================
     ENTER TO SEND
  ========================================================= */

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* =========================================================
     FILTER USERS
  ========================================================= */

  const filteredUsers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    /* ===============================================
       NO SEARCH
       Show only existing conversations
       =============================================== */

    if (!searchTerm) {
      return sortedConversationUsers;
    }

    /* ===============================================
       SEARCH
       Allow student discovery
       =============================================== */

    return users
      .filter((u) => {
        const isStudent =
          u.role?.toLowerCase() === "student";

        const name =
          u.name ||
          [u.firstName, u.lastName]
            .filter(Boolean)
            .join(" ");

        const matchesName = name
          ?.toLowerCase()
          .includes(searchTerm);

        return isStudent && matchesName;
      })
      .sort((a, b) => {
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
    users,
    sortedConversationUsers,
    conversationMeta,
    search,
  ]);

  /* =========================================================
     UNREAD TOTAL
  ========================================================= */

  const unreadTotal = useMemo(() => {
    return Object.values(unreadMap).reduce(
      (total, count) => total + count,
      0
    );
  }, [unreadMap]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-screen w-screen flex bg-[#F4F7FB] text-gray-900 overflow-hidden">
      {/* =====================================================
         SIDEBAR
      ===================================================== */}

      <aside className="w-72 bg-white/75 backdrop-blur-2xl border-r border-white/50 p-6 flex flex-col justify-between shadow-sm">
        <div>
          {/* LOGO */}

          <div className="mb-7">
            <h1 className="text-2xl font-black tracking-tight text-green-600">
              GuidEd
            </h1>

            <p className="text-[11px] leading-relaxed text-gray-500 mt-1">
              Our Lady of the Holy Rosary School -
              General Trias Campus
            </p>
          </div>

          {/* NAVIGATION */}

          <div className="space-y-1.5">
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

            <Nav
              icon={<ShieldX size={18} />}
              label="Guidance"
              active
            />

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
              onClick={() =>
                navigate("/interventions")
              }
            />

            <Nav
              icon={<Settings size={18} />}
              label="Settings"
              onClick={() => navigate("/settings")}
            />
          </div>
        </div>

        {/* SIDEBAR BOTTOM */}

        <div className="space-y-3">
          <div
            className="
              flex items-center gap-3
              p-3 rounded-2xl
              bg-gray-50/80
              border border-gray-200/70
              hover:bg-white
              hover:shadow-sm
              transition
            "
          >
            <div
              className="
                relative
                w-11 h-11
                rounded-xl
                overflow-hidden
                bg-green-100
                border border-green-200
                flex items-center justify-center
                flex-shrink-0
              "
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
                <span className="text-green-700 font-bold text-lg">
                  {adminName.charAt(0).toUpperCase()}
                </span>
              )}

              <span
                className="
                  absolute bottom-0.5 right-0.5
                  w-2.5 h-2.5 rounded-full
                  bg-green-500
                  border-2 border-white
                "
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                Administrator
              </p>

              <p className="text-sm font-bold text-gray-900 truncate">
                {adminName}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="
              w-full
              bg-green-600
              hover:bg-green-700
              text-white
              py-3
              rounded-2xl
              font-medium
              shadow-sm
              hover:shadow-md
              transition
            "
          >
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
         MAIN
      ===================================================== */}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ===================================================
           HEADER
        =================================================== */}

        <header
          className="
            px-8 py-6
            border-b border-white/30
            bg-white/55
            backdrop-blur-2xl
            flex items-center justify-between
          "
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
                <MessageCircle size={20} />
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  Guidance Messaging
                </h2>

                <p className="text-gray-500 text-sm mt-0.5">
                  Real-time communication and student
                  support
                </p>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS */}

          <div className="relative">
            <button
              onClick={() =>
                setOpenNotif(!openNotif)
              }
              className="
                relative
                w-12 h-12 rounded-2xl
                bg-white/70
                backdrop-blur-xl
                border border-white/50
                shadow-sm
                flex items-center justify-center
                hover:bg-white
                hover:scale-105
                transition
              "
            >
              <Bell size={18} />

              {unreadTotal > 0 && (
                <span
                  className="
                    absolute -top-1 -right-1
                    w-5 h-5
                    rounded-full
                    bg-red-500
                    border-2 border-white
                    text-white
                    text-[10px]
                    font-bold
                    flex items-center justify-center
                  "
                >
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
                    y: 10,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.96,
                  }}
                  className="
                    absolute right-0 mt-4
                    w-96
                    bg-white/85
                    backdrop-blur-2xl
                    border border-white/50
                    rounded-3xl
                    overflow-hidden
                    shadow-2xl
                    z-50
                  "
                >
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Notifications
                      </h3>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Recent messages
                      </p>
                    </div>

                    <Sparkles
                      size={16}
                      className="text-green-600"
                    />
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-3">
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
                          whileHover={{ x: 3 }}
                          onClick={() => {
                            const target =
                              users.find(
                                (u) =>
                                  u._id ===
                                  n.senderId
                              );

                            if (target) {
                              openChat(target);
                              setOpenNotif(false);
                            }
                          }}
                          className="
                            w-full
                            text-left
                            p-5
                            border-b border-gray-100
                            hover:bg-green-50/50
                            transition
                          "
                        >
                          <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                              <MessageCircle
                                size={15}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between gap-3">
                                <span className="text-xs font-bold text-green-700">
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
        </header>

        {/* ===================================================
           CHAT LAYOUT
        =================================================== */}

        <div className="flex flex-1 overflow-hidden">
          {/* =================================================
             CONVERSATIONS
          ================================================= */}

          <section
            className="
              w-96
              border-r border-white/30
              bg-white/45
              backdrop-blur-2xl
              flex flex-col
            "
          >
            {/* SEARCH */}

            <div className="p-5 border-b border-white/30">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/65 backdrop-blur-xl border border-white/50 shadow-sm">
                <Search
                  size={16}
                  className="text-gray-400"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
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
                  {search.trim()
                    ? "Search Results"
                    : "Conversations"}
                </p>

                {!search.trim() &&
                  conversationUsers.length > 0 && (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      {conversationUsers.length}{" "}
                      active
                    </span>
                  )}
              </div>
            </div>

            {/* USERS */}

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center mb-4">
                    {search.trim() ? (
                      <Search
                        size={24}
                        className="text-green-600"
                      />
                    ) : (
                      <MessageCircle
                        size={24}
                        className="text-green-600"
                      />
                    )}
                  </div>

                  {search.trim() ? (
                    <>
                      <p className="font-semibold text-gray-800">
                        No students found
                      </p>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Try searching using the
                        student's name.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800">
                        No conversations yet
                      </p>

                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Search for a student above
                        to start a conversation.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const meta =
                    conversationMeta[u._id];

                  const unread =
                    unreadMap[u._id] > 0;

                  const displayName =
                    u.name ||
                    [u.firstName, u.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    "Student";

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
                          activeChat?._id ===
                          u._id
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
                          online={onlineUsers.includes(
                            u._id
                          )}
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

                            {/* MESSENGER STYLE UNREAD DOT */}

                            {unread && (
                              <span
                                className="
                                  w-2.5 h-2.5
                                  rounded-full
                                  bg-green-600
                                  flex-shrink-0
                                  shadow-sm
                                "
                              />
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

          {/* =================================================
             CHAT AREA
          ================================================= */}

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
                      name={
                        activeChat.name ||
                        [
                          activeChat.firstName,
                          activeChat.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                      photo={
                        activeChat.profilePhoto
                      }
                      online={onlineUsers.includes(
                        activeChat._id
                      )}
                    />

                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {activeChat.name ||
                          [
                            activeChat.firstName,
                            activeChat.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
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

                        <p className="text-xs text-gray-500">
                          {onlineUsers.includes(
                            activeChat._id
                          )
                            ? "Online"
                            : "Offline"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-white/40">
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
                      Choose a student to start
                      messaging.
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
                      <MessageCircle
                        size={30}
                        className="text-green-600"
                      />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800">
                      Your guidance inbox
                    </h3>

                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Select a student from the
                      conversation list to view
                      messages and provide support.
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/70 border border-white/50 mx-auto flex items-center justify-center mb-4">
                      <MessageCircle
                        size={24}
                        className="text-green-600"
                      />
                    </div>

                    <p className="font-semibold text-gray-800">
                      Start the conversation
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Send a message to{" "}
                      {activeChat.name ||
                        "this student"}
                      .
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => {
                    const isMe =
                      m.sender === user._id;

                    return (
                      <motion.div
                        key={m._id || i}
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
                              <CheckCheck size={11} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* =================================================
               INPUT
            ================================================= */}

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
                      onChange={(e) =>
                        setInput(e.target.value)
                      }
                      onKeyDown={
                        handleInputKeyDown
                      }
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
              const target = users.find(
                (u) =>
                  u._id === toastNotif.senderId
              );

              if (target) {
                openChat(target);
                setToastNotif(null);
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
              <div
                className="
                  w-12 h-12
                  rounded-2xl
                  bg-green-100
                  text-green-700
                  flex items-center justify-center
                  flex-shrink-0
                "
              >
                <Bell size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    New Message
                  </p>

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