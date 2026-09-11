import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from "react-native";

import React, { useEffect, useState, useCallback, useRef } from "react";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import io from "socket.io-client";
import axios from "axios";

import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";

import { useFocusEffect } from "@react-navigation/native";

import { createStyles } from "../../../assets/styles/homestyle/notification.styles";
import { useTheme } from "../../../assets/styles/theme/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../store/authStore";

const API_URL = "https://edu-guard-backend.onrender.com";

export default function Notification() {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const insets = useSafeAreaInsets();

  const router = useRouter();

  const { user } = useAuthStore();

  /* =========================================================
     STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState("all");

  /* =========================================================
     REFS
  ========================================================= */

  const socketRef = useRef(null);

  const appStateRef = useRef(AppState.currentState);

  /* =========================================================
     USER ID
     
     Fetching notifications no longer depends on this ID.
     It is only needed for Socket.IO registration.
  ========================================================= */

  const currentUserId = user?._id || user?.id;

  /* =========================================================
     AUTH HEADERS
     
     The new backend notification route uses the authenticated
     user from req.userId, so the mobile token must be sent.
  ========================================================= */

  const getAuthHeaders = useCallback(() => {
    const authState = useAuthStore.getState();

    const authToken = authState?.token;

    return {
      Authorization: `Bearer ${authToken}`,
    };
  }, []);

  /* =========================================================
     NORMALIZE NOTIFICATION
  ========================================================= */

  const normalizeNotification = useCallback((notification) => {
    if (!notification) {
      return null;
    }

    const id = notification._id || notification.id || null;

    if (!id) {
      return null;
    }

    return {
      ...notification,

      _id: String(id),

      id: String(id),

      isRead: notification.isRead ?? false,

      data: notification.data || {},

      createdAt: notification.createdAt || new Date().toISOString(),
    };
  }, []);

  /* =========================================================
     MERGE NOTIFICATION
     
     Prevent duplicate notifications.
  ========================================================= */

  const addNotification = useCallback(
    (incomingNotification) => {
      const normalized = normalizeNotification(incomingNotification);

      if (!normalized) {
        console.log("⚠️ Invalid teacher notification received");

        return;
      }

      setNotifications((previous) => {
        const incomingId = String(normalized._id || normalized.id);

        const exists = previous.some(
          (item) => String(item._id || item.id) === incomingId,
        );

        if (exists) {
          console.log(
            "🔔 Duplicate teacher notification ignored:",
            incomingId,
          );

          return previous;
        }

        console.log(
          "🔔 Adding teacher notification to UI:",
          normalized.title,
        );

        return [normalized, ...previous];
      });
    },
    [normalizeNotification],
  );

  /* =========================================================
     FETCH NOTIFICATIONS
     
     IMPORTANT:
     
     Old:
       GET /api/notifications/:userId
     
     New:
       GET /api/notifications
     
     The backend gets the current user from req.userId.
  ========================================================= */

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        console.log("");
        console.log("====================================");
        console.log("🔔 FETCHING TEACHER NOTIFICATIONS");
        console.log("====================================");

        console.log("Current User ID:", currentUserId);

        console.log(
          "Endpoint:",
          `${API_URL}/api/notifications`,
        );

        const res = await axios.get(
          `${API_URL}/api/notifications`,
          {
            headers: getAuthHeaders(),
          },
        );

        /* =====================================================
           SUPPORT DIFFERENT BACKEND RESPONSE SHAPES
        ===================================================== */

        let data = [];

        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (Array.isArray(res.data?.notifications)) {
          data = res.data.notifications;
        } else if (Array.isArray(res.data?.data)) {
          data = res.data.data;
        }

        const normalized = data
          .map(normalizeNotification)
          .filter(Boolean);

        console.log(
          "🔔 Teacher notifications fetched:",
          normalized.length,
        );

        /* =====================================================
           SORT NEWEST FIRST
        ===================================================== */

        normalized.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();

          const dateB = new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        });

        setNotifications(normalized);

        console.log("✅ Teacher notification list updated");

        console.log("====================================");
      } catch (err) {
        console.log("");
        console.log("❌ FETCH TEACHER NOTIFICATIONS ERROR");

        console.log(
          "Status:",
          err?.response?.status,
        );

        console.log(
          "Response:",
          err?.response?.data,
        );

        console.log(
          "Message:",
          err?.message,
        );

        console.log("====================================");

        if (!isRefresh) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      currentUserId,
      getAuthHeaders,
      normalizeNotification,
    ],
  );

  /* =========================================================
     FETCH WHEN SCREEN OPENS
  ========================================================= */

  useFocusEffect(
    useCallback(() => {
      console.log("📱 Teacher notification screen focused");

      fetchNotifications();

      return () => {
        console.log(
          "📱 Teacher notification screen unfocused",
        );
      };
    }, [fetchNotifications]),
  );

  /* =========================================================
     REFRESH WHEN APP RETURNS TO FOREGROUND
  ========================================================= */

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
        console.log(
          "📱 Teacher app state:",
          appStateRef.current,
          "→",
          nextState,
        );

        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          console.log(
            "📱 Teacher app returned to foreground",
          );

          fetchNotifications(true);
        }

        appStateRef.current = nextState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);

  /* =========================================================
     FIREBASE FCM FOREGROUND MESSAGE
     
     Native Firebase Messaging.
     
     FCM does not automatically display a system notification
     when the app is in the foreground, so Expo Notifications
     is used only to DISPLAY the foreground notification.
     
     It is NOT being used as the push provider.
  ========================================================= */

  useEffect(() => {
    console.log(
      "📱 Setting up teacher native Firebase FCM foreground listener...",
    );

    const unsubscribe = messaging().onMessage(
      async (remoteMessage) => {
        console.log("");
        console.log("====================================");
        console.log("📱 TEACHER FCM MESSAGE RECEIVED");
        console.log("====================================");

        console.log(
          "Message ID:",
          remoteMessage?.messageId,
        );

        console.log(
          "Notification:",
          remoteMessage?.notification,
        );

        console.log(
          "Data:",
          remoteMessage?.data,
        );

        console.log("====================================");

        const title =
          remoteMessage?.notification?.title ||
          remoteMessage?.data?.title ||
          "GuidED Notification";

        const body =
          remoteMessage?.notification?.body ||
          remoteMessage?.data?.body ||
          "You have a new notification.";

        try {
          /*
            Display foreground notification locally.

            This does NOT use Expo Push Notifications.
            The actual push came from Firebase FCM.
          */

          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: remoteMessage?.data || {},
              sound: "default",
            },

            trigger: null,
          });

          console.log(
            "✅ Teacher foreground notification displayed",
          );
        } catch (notificationError) {
          console.log(
            "❌ Teacher foreground notification display error:",
            notificationError?.message ||
              notificationError,
          );
        }

        /*
          MongoDB remains the source of truth.
        */

        await fetchNotifications(true);
      },
    );

    return () => {
      console.log(
        "📱 Removing teacher native Firebase FCM foreground listener...",
      );

      unsubscribe();
    };
  }, [fetchNotifications]);

  /* =========================================================
     FCM NOTIFICATION OPENED FROM BACKGROUND
  ========================================================= */

  useEffect(() => {
    console.log(
      "📱 Setting up teacher FCM notification-open listener...",
    );

    const unsubscribe =
      messaging().onNotificationOpenedApp(
        async (remoteMessage) => {
          console.log("");
          console.log("====================================");
          console.log(
            "📱 TEACHER FCM NOTIFICATION TAPPED",
          );
          console.log("====================================");

          console.log(
            "Notification:",
            remoteMessage?.notification,
          );

          console.log(
            "Data:",
            remoteMessage?.data,
          );

          console.log("====================================");

          await fetchNotifications(true);
        },
      );

    return () => {
      console.log(
        "📱 Removing teacher FCM notification-open listener...",
      );

      unsubscribe();
    };
  }, [fetchNotifications]);

  /* =========================================================
     FCM NOTIFICATION OPENED FROM QUIT STATE
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const checkInitialNotification = async () => {
      try {
        const remoteMessage =
          await messaging().getInitialNotification();

        if (!mounted || !remoteMessage) {
          return;
        }

        console.log("");
        console.log("====================================");
        console.log(
          "📱 TEACHER APP OPENED FROM FCM NOTIFICATION",
        );
        console.log("====================================");

        console.log(
          "Notification:",
          remoteMessage?.notification,
        );

        console.log(
          "Data:",
          remoteMessage?.data,
        );

        console.log("====================================");

        await fetchNotifications(true);
      } catch (error) {
        console.log(
          "❌ Error checking teacher initial FCM notification:",
          error?.message || error,
        );
      }
    };

    checkInitialNotification();

    return () => {
      mounted = false;
    };
  }, [fetchNotifications]);

  /* =========================================================
     SOCKET.IO REALTIME NOTIFICATIONS
     
     Socket.IO uses the teacher's ID only for registering
     and joining the user's notification room.
     
     The notification API itself uses the Bearer token.
  ========================================================= */

  useEffect(() => {
    if (!currentUserId) {
      console.log(
        "⚠️ No teacher user ID. Socket not started.",
      );

      return;
    }

    console.log("");
    console.log("====================================");
    console.log(
      "🔌 STARTING TEACHER NOTIFICATION SOCKET",
    );
    console.log("====================================");

    console.log(
      "Teacher User ID:",
      currentUserId,
    );

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],

      forceNew: true,

      reconnection: true,

      reconnectionAttempts: Infinity,

      reconnectionDelay: 1000,

      timeout: 20000,
    });

    socketRef.current = socket;

    /* =======================================================
       CONNECT
    ======================================================= */

    socket.on("connect", () => {
      console.log("");
      console.log("====================================");
      console.log(
        "🔌 TEACHER SOCKET CONNECTED",
      );
      console.log("====================================");

      console.log(
        "Socket ID:",
        socket.id,
      );

      console.log(
        "Registering teacher:",
        currentUserId,
      );

      /*
        Register user
      */

      socket.emit(
        "register",
        currentUserId,
      );

      /*
        Join user's notification room
      */

      socket.emit(
        "join",
        currentUserId,
      );

      console.log(
        "✅ Teacher register emitted",
      );

      console.log(
        "✅ Teacher join emitted",
      );

      console.log("====================================");
    });

    /* =======================================================
       NEW REALTIME NOTIFICATION
    ======================================================= */

    socket.on(
      "newNotification",
      async (notif) => {
        console.log("");
        console.log("====================================");
        console.log(
          "🔔 TEACHER REALTIME NOTIFICATION",
        );
        console.log("====================================");

        console.log(
          "Notification:",
          notif,
        );

        console.log(
          "ID:",
          notif?._id || notif?.id,
        );

        console.log(
          "Title:",
          notif?.title,
        );

        console.log(
          "Message:",
          notif?.message,
        );

        console.log(
          "Type:",
          notif?.type,
        );

        console.log(
          "Priority:",
          notif?.priority,
        );

        console.log(
          "Data:",
          notif?.data,
        );

        console.log("====================================");

        if (!notif) {
          return;
        }

        /*
          Add immediately.
        */

        addNotification(notif);

        /*
          Refresh from MongoDB after a small delay.
        */

        setTimeout(() => {
          fetchNotifications(true);
        }, 300);
      },
    );

    /* =======================================================
       GENERIC NOTIFICATION
    ======================================================= */

    socket.on(
      "notification",
      (notif) => {
        console.log(
          "🔔 Generic teacher notification event:",
          notif,
        );

        if (notif) {
          addNotification(notif);
        }

        setTimeout(() => {
          fetchNotifications(true);
        }, 300);
      },
    );

    /* =======================================================
       TEACHER NOTIFICATION
    ======================================================= */

    socket.on(
      "teacherNotification",
      (notif) => {
        console.log(
          "🔔 Teacher notification event:",
          notif,
        );

        if (notif) {
          addNotification(notif);
        }

        setTimeout(() => {
          fetchNotifications(true);
        }, 300);
      },
    );

    /* =======================================================
       REPORT EVENTS
    ======================================================= */

    socket.on(
      "reportAccepted",
      (data) => {
        console.log(
          "📄 Teacher report accepted event:",
          data,
        );

        setTimeout(() => {
          fetchNotifications(true);
        }, 300);
      },
    );

    socket.on(
      "reportStatusUpdated",
      (data) => {
        console.log(
          "📄 Teacher report status updated:",
          data,
        );

        setTimeout(() => {
          fetchNotifications(true);
        }, 300);
      },
    );

    /* =======================================================
       INCIDENT EVENTS
    ======================================================= */

    socket.on(
      "incidentUpdated",
      (data) => {
        console.log(
          "📋 Teacher incident updated:",
          data,
        );

        setTimeout(() => {
          fetchNotifications(true);
        }, 300);
      },
    );

    socket.on(
      "newIncident",
      (data) => {
        console.log(
          "📋 Teacher new incident:",
          data,
        );

        setTimeout(() => {
          fetchNotifications(true);
        }, 300);
      },
    );

    /* =======================================================
       DISCONNECT
    ======================================================= */

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "🔌 Teacher notification socket disconnected:",
          reason,
        );
      },
    );

    /* =======================================================
       CONNECT ERROR
    ======================================================= */

    socket.on(
      "connect_error",
      (error) => {
        console.log(
          "❌ Teacher notification socket connection error:",
          error?.message || error,
        );
      },
    );

    /* =======================================================
       RECONNECT
    ======================================================= */

    socket.io.on(
      "reconnect",
      (attempt) => {
        console.log(
          "🔄 Teacher notification socket reconnected:",
          attempt,
        );

        socket.emit(
          "register",
          currentUserId,
        );

        socket.emit(
          "join",
          currentUserId,
        );
      },
    );

    /* =======================================================
       CLEANUP
    ======================================================= */

    return () => {
      console.log("");
      console.log(
        "🔌 CLEANING TEACHER NOTIFICATION SOCKET",
      );

      socket.removeAllListeners();

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    currentUserId,
    addNotification,
    fetchNotifications,
  ]);

  /* =========================================================
     MARK AS READ
  ========================================================= */

  const markAsRead = async (id) => {
    if (!id) {
      return;
    }

    try {
      console.log(
        "📖 Marking teacher notification as read:",
        id,
      );

      /*
        Update UI immediately.
      */

      setNotifications((previous) =>
        previous.map((notification) =>
          String(
            notification._id ||
              notification.id,
          ) === String(id)
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      /*
        Update backend.
      */

      await axios.put(
        `${API_URL}/api/notifications/read/${id}`,
        {},
        {
          headers: getAuthHeaders(),
        },
      );

      console.log(
        "✅ Teacher notification marked as read",
      );
    } catch (err) {
      console.log(
        "❌ Teacher mark notification read error:",
        err?.response?.data ||
          err?.message,
      );
    }
  };

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredNotifications =
    notifications.filter(
      (notification) => {
        const type =
          notification.type?.toLowerCase();

        const dataType =
          notification.data?.type?.toLowerCase();

        if (activeTab === "all") {
          return true;
        }

        if (activeTab === "high") {
          return (
            notification.priority?.toLowerCase() ===
            "high"
          );
        }

        if (activeTab === "updates") {
          return (
            type === "update" ||
            type === "success" ||
            dataType ===
              "report_accepted"
          );
        }

        return true;
      },
    );

  /* =========================================================
     COUNTS
  ========================================================= */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead,
    ).length;

  const highPriorityCount =
    notifications.filter(
      (notification) =>
        notification.priority?.toLowerCase() ===
        "high",
    ).length;

  /* =========================================================
     NOTIFICATION DESIGN
  ========================================================= */

  const getNotifDesign = (
    notification,
  ) => {
    const priority =
      notification.priority?.toLowerCase();

    const type =
      notification.type?.toLowerCase();

    const dataType =
      notification.data?.type?.toLowerCase();

    /*
      REPORT ACCEPTED
    */

    if (
      dataType ===
      "report_accepted"
    ) {
      return {
        color:
          colors.success ||
          "#16A34A",

        icon:
          "checkmark-circle-outline",

        label:
          "Report Accepted",
      };
    }

    /*
      REPORT REJECTED
    */

    if (
      dataType ===
      "report_rejected"
    ) {
      return {
        color:
          colors.error ||
          "#DC2626",

        icon:
          "close-circle-outline",

        label:
          "Report Rejected",
      };
    }

    /*
      HIGH PRIORITY
    */

    if (
      priority === "high"
    ) {
      return {
        color:
          colors.error ||
          "#DC2626",

        icon:
          "warning-outline",

        label:
          "High Priority",
      };
    }

    /*
      INTERVENTION
    */

    if (
      type === "intervention"
    ) {
      return {
        color:
          colors.warning ||
          "#F59E0B",

        icon:
          "school-outline",

        label:
          "Intervention",
      };
    }

    /*
      REPORT
    */

    if (
      type === "report"
    ) {
      return {
        color:
          colors.error ||
          "#DC2626",

        icon:
          "document-text-outline",

        label:
          "Report",
      };
    }

    /*
      MESSAGE
    */

    if (
      type === "message"
    ) {
      return {
        color:
          colors.primary,

        icon:
          "chatbubble-ellipses-outline",

        label:
          "Message",
      };
    }

    /*
      UPDATE
    */

    if (
      type === "update"
    ) {
      return {
        color:
          colors.warning ||
          "#F59E0B",

        icon:
          "information-circle-outline",

        label:
          "Update",
      };
    }

    /*
      SUCCESS
    */

    if (
      type === "success"
    ) {
      return {
        color:
          colors.success ||
          "#16A34A",

        icon:
          "checkmark-circle-outline",

        label:
          "Success",
      };
    }

    /*
      WARNING
    */

    if (
      type === "warning"
    ) {
      return {
        color:
          colors.warning ||
          "#F59E0B",

        icon:
          "alert-circle-outline",

        label:
          "Warning",
      };
    }

    /*
      REJECTED
    */

    if (
      type === "rejected"
    ) {
      return {
        color:
          colors.error ||
          "#DC2626",

        icon:
          "close-circle-outline",

        label:
          "Rejected",
      };
    }

    /*
      GENERAL
    */

    return {
      color:
        colors.primary,

      icon:
        "notifications-outline",

      label:
        "Notification",
    };
  };

  /* =========================================================
     RENDER NOTIFICATION
  ========================================================= */

  const renderItem = ({
    item,
  }) => {
    const {
      color,
      icon,
      label,
    } = getNotifDesign(item);

    const notificationId =
      item._id || item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          markAsRead(
            notificationId,
          )
        }
        style={[
          styles.notifCard,
          !item.isRead &&
            styles.unreadCard,
        ]}
      >
        {/* =================================================
            LEFT COLOR INDICATOR
        ================================================= */}

        <View
          style={[
            styles.notifLine,
            {
              backgroundColor:
                color,
            },
          ]}
        />

        {/* =================================================
            ICON
        ================================================= */}

        <View
          style={[
            styles.notifIconBox,
            {
              backgroundColor:
                `${color}18`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={color}
          />
        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <View
          style={styles.notifTextBox}
        >
          <View
            style={styles.notifTopRow}
          >
            <Text
              style={[
                styles.notifCategory,
                {
                  color,
                },
              ]}
            >
              {label}
            </Text>

            {!item.isRead && (
              <View
                style={[
                  styles.unreadDot,
                  {
                    backgroundColor:
                      color,
                  },
                ]}
              />
            )}
          </View>

          <Text
            style={styles.notifTitle}
            numberOfLines={2}
          >
            {item.title ||
              "Notification"}
          </Text>

          <Text
            style={styles.notifMessage}
            numberOfLines={3}
          >
            {item.message ||
              "You have a new notification."}
          </Text>

          <View
            style={
              styles.notifBottomRow
            }
          >
            <Ionicons
              name="time-outline"
              size={13}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={
                styles.notifTime
              }
            >
              {item.timeAgo ||
                (item.createdAt
                  ? new Date(
                      item.createdAt,
                    ).toLocaleString()
                  : "Just now")}
            </Text>

            {!item.isRead && (
              <View
                style={
                  styles.newBadge
                }
              >
                <Text
                  style={
                    styles.newBadgeText
                  }
                >
                  NEW
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  const EmptyState = () => {
    let title =
      "No notifications yet";

    let message =
      "You're all caught up. New alerts and updates will appear here.";

    if (
      activeTab === "high"
    ) {
      title =
        "No high-priority alerts";

      message =
        "There are currently no high-priority notifications.";
    }

    if (
      activeTab === "updates"
    ) {
      title =
        "No updates available";

      message =
        "System updates and announcements will appear here.";
    }

    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <View
          style={
            styles.emptyIconCircle
          }
        >
          <Ionicons
            name="notifications-off-outline"
            size={38}
            color={
              colors.primary
            }
          />
        </View>

        <Text
          style={styles.emptyTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.emptyMessage
          }
        >
          {message}
        </Text>

        <TouchableOpacity
          style={
            styles.emptyButton
          }
          onPress={() =>
            fetchNotifications(
              true,
            )
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="refresh-outline"
            size={17}
            color={
              colors.textInverse
            }
          />

          <Text
            style={
              styles.emptyButtonText
            }
          >
            Refresh
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <View
        style={styles.container}
      >
        <LinearGradient
          colors={[
            colors.primary,
            colors.primaryLight,
          ]}
          style={[
            styles.header,
            {
              paddingTop: 10,
            },
          ]}
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                colors.textInverse
              }
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerTextBox
            }
          >
            <View
              style={
                styles.titleRow
              }
            >
              <Text
                style={
                  styles.headerTitle
                }
              >
                Notifications
              </Text>
            </View>

            <Text
              style={
                styles.headerSub
              }
            >
              Stay updated with alerts and announcements
            </Text>
          </View>
        </LinearGradient>

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.primary
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading notifications...
          </Text>
        </View>
      </View>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <View
      style={styles.container}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <LinearGradient
        colors={[
          colors.primary,
          colors.primaryLight,
        ]}
        style={[
          styles.header,
          {
            paddingTop: 15,
          },
        ]}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
          activeOpacity={0.75}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={
              colors.textInverse
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerTextBox
          }
        >
          <View
            style={
              styles.titleRow
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              Notifications
            </Text>

            {unreadCount > 0 && (
              <View
                style={
                  styles.unreadBadge
                }
              >
                <Text
                  style={
                    styles.unreadBadgeText
                  }
                >
                  {unreadCount >
                  99
                    ? "99+"
                    : unreadCount}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={
              styles.headerSub
            }
          >
            Stay updated with alerts and announcements
          </Text>
        </View>
      </LinearGradient>

      {/* =====================================================
          BODY
      ===================================================== */}

      <View
        style={styles.body}
      >
        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Your Notifications
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              {notifications.length ===
              0
                ? "Nothing new right now"
                : `${
                    notifications.length
                  } notification${
                    notifications.length !==
                    1
                      ? "s"
                      : ""
                  }`}
            </Text>
          </View>

          {unreadCount > 0 && (
            <View
              style={
                styles.unreadSummary
              }
            >
              <View
                style={
                  styles.unreadSummaryDot
                }
              />

              <Text
                style={
                  styles.unreadSummaryText
                }
              >
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <View
          style={styles.filterRow}
        >
          {/* ALL */}

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab === "all" &&
                styles.filterActive,
            ]}
            onPress={() =>
              setActiveTab(
                "all",
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="apps-outline"
              size={15}
              color={
                activeTab === "all"
                  ? colors.textInverse
                  : colors.textSecondary
              }
            />

            <Text
              style={[
                styles.filterText,
                activeTab ===
                  "all" &&
                  styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* HIGH PRIORITY */}

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab ===
                "high" &&
                styles.filterActive,
            ]}
            onPress={() =>
              setActiveTab(
                "high",
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="warning-outline"
              size={15}
              color={
                activeTab ===
                "high"
                  ? colors.textInverse
                  : colors.textSecondary
              }
            />

            <Text
              style={[
                styles.filterText,
                activeTab ===
                  "high" &&
                  styles.filterTextActive,
              ]}
            >
              High Priority
            </Text>

            {highPriorityCount >
              0 && (
              <View
                style={[
                  styles.filterCount,
                  activeTab ===
                    "high" &&
                    styles.filterCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    activeTab ===
                      "high" &&
                      styles.filterCountTextActive,
                  ]}
                >
                  {
                    highPriorityCount
                  }
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* UPDATES */}

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab ===
                "updates" &&
                styles.filterActive,
            ]}
            onPress={() =>
              setActiveTab(
                "updates",
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={
                activeTab ===
                "updates"
                  ? colors.textInverse
                  : colors.textSecondary
              }
            />

            <Text
              style={[
                styles.filterText,
                activeTab ===
                  "updates" &&
                  styles.filterTextActive,
              ]}
            >
              Updates
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===================================================
            LIST / EMPTY
        =================================================== */}

        {filteredNotifications.length ===
        0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={
              filteredNotifications
            }
            keyExtractor={(
              item,
              index,
            ) =>
              (
                item._id ||
                item.id ||
                `notification-${index}`
              ).toString()
            }
            renderItem={
              renderItem
            }
            showsVerticalScrollIndicator={
              false
            }
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={() =>
                  fetchNotifications(
                    true,
                  )
                }
                tintColor={
                  colors.primary
                }
                colors={[
                  colors.primary,
                ]}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom:
                  100 +
                  insets.bottom,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

