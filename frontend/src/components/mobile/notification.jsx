import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from "react-native";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import io from "socket.io-client";
import axios from "axios";

import messaging from "@react-native-firebase/messaging";

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

  /* =========================================================
     AUTH STORE
  ========================================================= */

  const { user, token } = useAuthStore();

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

  const appStateRef = useRef(
    AppState.currentState
  );

  /* =========================================================
     AUTH HEADERS
  ========================================================= */

  const getAuthHeaders = useCallback(() => {
    if (!token) {
      console.log(
        "⚠️ No authentication token available."
      );

      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  /* =========================================================
     NORMALIZE NOTIFICATION
  ========================================================= */

  const normalizeNotification = useCallback(
    (notification) => {
      if (!notification) {
        return null;
      }

      const id =
        notification._id ||
        notification.id ||
        null;

      if (!id) {
        console.log(
          "⚠️ Notification has no ID:",
          notification
        );

        return null;
      }

      return {
        ...notification,

        _id: String(id),

        id: String(id),

        isRead:
          notification.isRead ?? false,

        data:
          notification.data || {},

        createdAt:
          notification.createdAt ||
          new Date().toISOString(),

        updatedAt:
          notification.updatedAt ||
          notification.createdAt ||
          new Date().toISOString(),

        timeAgo:
          notification.timeAgo ||
          null,
      };
    },
    []
  );

  /* =========================================================
     FETCH NOTIFICATIONS
     
     IMPORTANT:
     The authenticated backend endpoint is:

     GET /api/notifications

     We do NOT need to send user._id anymore.

     The backend gets the current user from req.userId.
  ========================================================= */

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      /*
      =======================================================
      TOKEN CHECK
      =======================================================
      */

      if (!token) {
        console.log(
          "⚠️ No authentication token."
        );

        setLoading(false);

        setRefreshing(false);

        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        console.log("");

        console.log(
          "===================================="
        );

        console.log(
          "🔔 FETCHING STUDENT NOTIFICATIONS"
        );

        console.log(
          "===================================="
        );

        console.log(
          "User from authStore:",
          user?._id ||
            user?.id ||
            "not available"
        );

        console.log(
          "Token available:",
          !!token
        );

        /*
        =====================================================
        IMPORTANT CHANGE

        OLD:

        /api/notifications/${user._id}

        NEW:

        /api/notifications

        The backend gets req.userId from JWT.
        =====================================================
        */

        const url =
          `${API_URL}/api/notifications`;

        console.log(
          "Request URL:",
          url
        );

        const res = await axios.get(
          url,
          {
            headers:
              getAuthHeaders(),

            timeout: 20000,
          }
        );

        console.log(
          "✅ Notification API status:",
          res.status
        );

        console.log(
          "📦 Raw notification response:",
          res.data
        );

        /* =====================================================
           RESPONSE DATA
        ===================================================== */

        let data = [];

        if (
          Array.isArray(
            res.data
          )
        ) {
          data = res.data;
        } else if (
          Array.isArray(
            res.data?.notifications
          )
        ) {
          data =
            res.data.notifications;
        } else if (
          Array.isArray(
            res.data?.data
          )
        ) {
          data =
            res.data.data;
        }

        console.log(
          "📦 Notification records received:",
          data.length
        );

        console.log(
          "🔵 Backend unread count:",
          res.data?.unreadCount ??
            "not provided"
        );

        /* =====================================================
           NORMALIZE
        ===================================================== */

        const normalized = data
          .map(
            normalizeNotification
          )
          .filter(Boolean);

        /* =====================================================
           SORT
        ===================================================== */

        normalized.sort(
          (a, b) => {
            const dateA =
              new Date(
                a.createdAt || 0
              ).getTime();

            const dateB =
              new Date(
                b.createdAt || 0
              ).getTime();

            return dateB - dateA;
          }
        );

        /* =====================================================
           LOG NOTIFICATIONS
        ===================================================== */

        normalized.forEach(
          (
            notification,
            index
          ) => {
            console.log(
              `🔔 Notification ${
                index + 1
              }:`,
              {
                id:
                  notification._id,

                user:
                  notification.user,

                title:
                  notification.title,

                message:
                  notification.message,

                type:
                  notification.type,

                priority:
                  notification.priority,

                isRead:
                  notification.isRead,

                createdAt:
                  notification.createdAt,
              }
            );
          }
        );

        /* =====================================================
           MERGE DATABASE RESULTS WITH CURRENT UI

           MongoDB is still the source of truth.

           Existing realtime notifications are retained
           temporarily if they are not yet present in the
           database response.
        ===================================================== */

        setNotifications(
          (previous) => {
            const mergedMap =
              new Map();

            /*
            ---------------------------------------------------
            KEEP CURRENT UI ITEMS
            ---------------------------------------------------
            */

            previous.forEach(
              (notification) => {
                const id =
                  String(
                    notification._id ||
                      notification.id ||
                      ""
                  );

                if (id) {
                  mergedMap.set(
                    id,
                    notification
                  );
                }
              }
            );

            /*
            ---------------------------------------------------
            DATABASE ITEMS OVERRIDE OLD UI ITEMS
            ---------------------------------------------------
            */

            normalized.forEach(
              (notification) => {
                const id =
                  String(
                    notification._id ||
                      notification.id ||
                      ""
                  );

                if (id) {
                  mergedMap.set(
                    id,
                    notification
                  );
                }
              }
            );

            /*
            ---------------------------------------------------
            ARRAY
            ---------------------------------------------------
            */

            const merged =
              Array.from(
                mergedMap.values()
              );

            /*
            ---------------------------------------------------
            SORT NEWEST FIRST
            ---------------------------------------------------
            */

            merged.sort(
              (a, b) => {
                const dateA =
                  new Date(
                    a.createdAt || 0
                  ).getTime();

                const dateB =
                  new Date(
                    b.createdAt || 0
                  ).getTime();

                return dateB - dateA;
              }
            );

            console.log(
              "===================================="
            );

            console.log(
              "✅ NOTIFICATION LIST MERGED"
            );

            console.log(
              "Database notifications:",
              normalized.length
            );

            console.log(
              "Previous UI notifications:",
              previous.length
            );

            console.log(
              "Final UI notifications:",
              merged.length
            );

            console.log(
              "===================================="
            );

            return merged;
          }
        );

        console.log(
          "✅ Notification list update completed."
        );

        console.log(
          "===================================="
        );
      } catch (err) {
        console.log("");

        console.log(
          "❌ FETCH NOTIFICATIONS ERROR"
        );

        console.log(
          "Status:",
          err?.response?.status
        );

        console.log(
          "Response:",
          err?.response?.data
        );

        console.log(
          "Message:",
          err?.message
        );

        if (
          err?.response?.status ===
          401
        ) {
          console.log(
            "❌ Authentication failed."
          );

          console.log(
            "The JWT may be expired or invalid."
          );
        }

        console.log(
          "===================================="
        );

        /*
        =====================================================
        DO NOT CLEAR EXISTING DATA DURING REFRESH ERROR
        =====================================================
        */

        if (!isRefresh) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [
      token,
      user,
      getAuthHeaders,
      normalizeNotification,
    ]
  );

  /* =========================================================
     FETCH WHEN SCREEN OPENS
  ========================================================= */

  useFocusEffect(
    useCallback(() => {
      console.log(
        "📱 Student notification screen focused"
      );

      fetchNotifications();

      return () => {
        console.log(
          "📱 Student notification screen unfocused"
        );
      };
    }, [fetchNotifications])
  );

  /* =========================================================
     APP FOREGROUND
  ========================================================= */

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        "change",
        (nextState) => {
          console.log(
            "📱 App state:",
            appStateRef.current,
            "→",
            nextState
          );

          if (
            appStateRef.current.match(
              /inactive|background/
            ) &&
            nextState === "active"
          ) {
            console.log(
              "📱 App returned to foreground"
            );

            fetchNotifications(true);
          }

          appStateRef.current =
            nextState;
        }
      );

    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);

  /* =========================================================
     FCM FOREGROUND MESSAGE
     
     FCM is ONLY used as a trigger to refresh MongoDB.
  ========================================================= */

  useEffect(() => {
    console.log(
      "📱 Setting up native Firebase FCM foreground listener..."
    );

    const unsubscribe =
      messaging().onMessage(
        async (
          remoteMessage
        ) => {
          console.log("");

          console.log(
            "===================================="
          );

          console.log(
            "📱 NATIVE FCM MESSAGE RECEIVED"
          );

          console.log(
            "===================================="
          );

          console.log(
            "Message ID:",
            remoteMessage?.messageId
          );

          console.log(
            "Notification:",
            remoteMessage?.notification
          );

          console.log(
            "Data:",
            remoteMessage?.data
          );

          console.log(
            "===================================="
          );

          /*
          -----------------------------------------------------
          Refresh MongoDB.
          -----------------------------------------------------
          */

          await fetchNotifications(
            true
          );
        }
      );

    return () => {
      console.log(
        "📱 Removing native Firebase FCM foreground listener..."
      );

      unsubscribe();
    };
  }, [fetchNotifications]);

  /* =========================================================
     FCM BACKGROUND NOTIFICATION OPENED
  ========================================================= */

  useEffect(() => {
    console.log(
      "📱 Setting up FCM background notification-open listener..."
    );

    const unsubscribe =
      messaging().onNotificationOpenedApp(
        async (
          remoteMessage
        ) => {
          console.log("");

          console.log(
            "===================================="
          );

          console.log(
            "📱 FCM NOTIFICATION TAPPED"
          );

          console.log(
            "===================================="
          );

          console.log(
            "Notification:",
            remoteMessage?.notification
          );

          console.log(
            "Data:",
            remoteMessage?.data
          );

          console.log(
            "===================================="
          );

          await fetchNotifications(
            true
          );
        }
      );

    return () => {
      console.log(
        "📱 Removing FCM notification-open listener..."
      );

      unsubscribe();
    };
  }, [fetchNotifications]);

  /* =========================================================
     FCM QUIT STATE
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const checkInitialNotification =
      async () => {
        try {
          const remoteMessage =
            await messaging().getInitialNotification();

          if (
            !mounted ||
            !remoteMessage
          ) {
            return;
          }

          console.log("");

          console.log(
            "===================================="
          );

          console.log(
            "📱 APP OPENED FROM FCM NOTIFICATION"
          );

          console.log(
            "===================================="
          );

          console.log(
            "Notification:",
            remoteMessage?.notification
          );

          console.log(
            "Data:",
            remoteMessage?.data
          );

          console.log(
            "===================================="
          );

          await fetchNotifications(
            true
          );
        } catch (error) {
          console.log(
            "❌ Error checking initial FCM notification:",
            error?.message ||
              error
          );
        }
      };

    checkInitialNotification();

    return () => {
      mounted = false;
    };
  }, [fetchNotifications]);

  /* =========================================================
     SOCKET.IO
  ========================================================= */

  useEffect(() => {
    /*
    =====================================================
    We still need the user ID for Socket.IO because the
    socket server needs to know which room to join.

    Accept both _id and id in case authStore shape differs.
    =====================================================
    */

    const currentUserId =
      user?._id ||
      user?.id;

    if (!currentUserId) {
      console.log(
        "⚠️ No user ID. Student notification socket not started."
      );

      return;
    }

    console.log("");

    console.log(
      "===================================="
    );

    console.log(
      "🔌 STARTING STUDENT NOTIFICATION SOCKET"
    );

    console.log(
      "===================================="
    );

    console.log(
      "User ID:",
      currentUserId
    );

    const socket = io(
      API_URL,
      {
        transports: [
          "websocket",
          "polling",
        ],

        forceNew: true,

        reconnection: true,

        reconnectionAttempts:
          Infinity,

        reconnectionDelay: 1000,

        timeout: 20000,
      }
    );

    socketRef.current =
      socket;

    /* =======================================================
       CONNECT
    ======================================================= */

    socket.on(
      "connect",
      () => {
        console.log("");

        console.log(
          "===================================="
        );

        console.log(
          "🔌 STUDENT SOCKET CONNECTED"
        );

        console.log(
          "===================================="
        );

        console.log(
          "Socket ID:",
          socket.id
        );

        console.log(
          "Registering user:",
          currentUserId
        );

        socket.emit(
          "register",
          currentUserId
        );

        socket.emit(
          "join",
          currentUserId
        );

        console.log(
          "✅ register emitted"
        );

        console.log(
          "✅ join emitted"
        );

        console.log(
          "===================================="
        );
      }
    );

    /* =======================================================
       NEW NOTIFICATION
    ======================================================= */

    socket.on(
      "newNotification",
      async (notif) => {
        console.log("");

        console.log(
          "===================================="
        );

        console.log(
          "🔔 STUDENT REALTIME NOTIFICATION"
        );

        console.log(
          "===================================="
        );

        console.log(
          "Notification:",
          notif
        );

        console.log(
          "ID:",
          notif?._id ||
            notif?.id
        );

        console.log(
          "Title:",
          notif?.title
        );

        console.log(
          "Message:",
          notif?.message
        );

        console.log(
          "Type:",
          notif?.type
        );

        console.log(
          "Priority:",
          notif?.priority
        );

        console.log(
          "Data:",
          notif?.data
        );

        console.log(
          "===================================="
        );

        if (!notif) {
          return;
        }

        /*
        =====================================================
        WAIT A LITTLE BEFORE FETCHING

        This gives the backend enough time to finish the
        MongoDB save before the GET request runs.
        =====================================================
        */

        console.log(
          "⏳ Waiting for database save..."
        );

        setTimeout(() => {
          console.log(
            "🔄 Refreshing notifications from MongoDB..."
          );

          fetchNotifications(
            true
          );
        }, 1000);
      }
    );

    /* =======================================================
       GENERIC NOTIFICATION
    ======================================================= */

    socket.on(
      "notification",
      (notif) => {
        console.log(
          "🔔 Generic notification event received:",
          notif
        );

        setTimeout(() => {
          fetchNotifications(
            true
          );
        }, 1000);
      }
    );

    /* =======================================================
       STUDENT NOTIFICATION
    ======================================================= */

    socket.on(
      "studentNotification",
      (notif) => {
        console.log(
          "🔔 Student notification event received:",
          notif
        );

        setTimeout(() => {
          fetchNotifications(
            true
          );
        }, 1000);
      }
    );

    /* =======================================================
       REPORT ACCEPTED
    ======================================================= */

    socket.on(
      "reportAccepted",
      (data) => {
        console.log(
          "📄 Report accepted event:",
          data
        );

        setTimeout(() => {
          fetchNotifications(
            true
          );
        }, 1000);
      }
    );

    /* =======================================================
       REPORT STATUS UPDATED
    ======================================================= */

    socket.on(
      "reportStatusUpdated",
      (data) => {
        console.log(
          "📄 Report status updated:",
          data
        );

        setTimeout(() => {
          fetchNotifications(
            true
          );
        }, 1000);
      }
    );

    /* =======================================================
       DISCONNECT
    ======================================================= */

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "🔌 Student notification socket disconnected:",
          reason
        );
      }
    );

    /* =======================================================
       CONNECT ERROR
    ======================================================= */

    socket.on(
      "connect_error",
      (error) => {
        console.log(
          "❌ Student notification socket connection error:",
          error?.message ||
            error
        );
      }
    );

    /* =======================================================
       RECONNECT
    ======================================================= */

    socket.io.on(
      "reconnect",
      (attempt) => {
        console.log(
          "🔄 Student notification socket reconnected:",
          attempt
        );

        socket.emit(
          "register",
          currentUserId
        );

        socket.emit(
          "join",
          currentUserId
        );
      }
    );

    /* =======================================================
       CLEANUP
    ======================================================= */

    return () => {
      console.log("");

      console.log(
        "🔌 CLEANING STUDENT NOTIFICATION SOCKET"
      );

      socket.removeAllListeners();

      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }
    };
  }, [
    user,
    fetchNotifications,
  ]);

  /* =========================================================
     MARK NOTIFICATION AS READ
  ========================================================= */

  const markAsRead =
    async (id) => {
      if (!id) {
        return;
      }

      try {
        console.log(
          "📖 Marking notification as read:",
          id
        );

        /*
        =====================================================
        UPDATE UI IMMEDIATELY
        =====================================================
        */

        setNotifications(
          (previous) =>
            previous.map(
              (
                notification
              ) =>
                String(
                  notification._id ||
                    notification.id
                ) ===
                String(id)
                  ? {
                      ...notification,
                      isRead: true,
                    }
                  : notification
            )
        );

        /*
        =====================================================
        UPDATE BACKEND
        =====================================================
        */

        await axios.put(
          `${API_URL}/api/notifications/read/${id}`,
          {},
          {
            headers:
              getAuthHeaders(),
          }
        );

        console.log(
          "✅ Notification marked as read"
        );
      } catch (err) {
        console.log(
          "❌ Mark notification read error:",
          err?.response?.data ||
            err?.message
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

        if (
          activeTab ===
          "all"
        ) {
          return true;
        }

        if (
          activeTab ===
          "high"
        ) {
          return (
            notification.priority?.toLowerCase() ===
            "high"
          );
        }

        if (
          activeTab ===
          "updates"
        ) {
          return (
            type ===
              "update" ||
            type ===
              "success" ||
            dataType ===
              "report_accepted"
          );
        }

        return true;
      }
    );

  /* =========================================================
     COUNTS
  ========================================================= */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  const highPriorityCount =
    notifications.filter(
      (notification) =>
        notification.priority?.toLowerCase() ===
        "high"
    ).length;

  /* =========================================================
     NOTIFICATION DESIGN
  ========================================================= */

  const getNotifDesign =
    (notification) => {
      const priority =
        notification.priority?.toLowerCase();

      const type =
        notification.type?.toLowerCase();

      const dataType =
        notification.data?.type?.toLowerCase();

      /* =====================================================
         REPORT ACCEPTED
      ===================================================== */

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

      /* =====================================================
         REPORT REJECTED
      ===================================================== */

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

      /* =====================================================
         HIGH PRIORITY
      ===================================================== */

      if (
        priority ===
        "high"
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

      /* =====================================================
         INTERVENTION
      ===================================================== */

      if (
        type ===
        "intervention"
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

      /* =====================================================
         REPORT
      ===================================================== */

      if (
        type ===
        "report"
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

      /* =====================================================
         MESSAGE
      ===================================================== */

      if (
        type ===
        "message"
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

      /* =====================================================
         UPDATE
      ===================================================== */

      if (
        type ===
        "update"
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

      /* =====================================================
         SUCCESS
      ===================================================== */

      if (
        type ===
        "success"
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

      /* =====================================================
         WARNING
      ===================================================== */

      if (
        type ===
        "warning"
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

      /* =====================================================
         REJECTED
      ===================================================== */

      if (
        type ===
        "rejected"
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

      /* =====================================================
         GENERAL
      ===================================================== */

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

  const renderItem =
    ({ item }) => {
      const {
        color,
        icon,
        label,
      } =
        getNotifDesign(
          item
        );

      const notificationId =
        item._id ||
        item.id;

      return (
        <TouchableOpacity
          activeOpacity={
            0.85
          }
          onPress={() =>
            markAsRead(
              notificationId
            )
          }
          style={[
            styles.notifCard,
            !item.isRead &&
              styles.unreadCard,
          ]}
        >
          <View
            style={[
              styles.notifLine,
              {
                backgroundColor:
                  color,
              },
            ]}
          />

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

          <View
            style={
              styles.notifTextBox
            }
          >
            <View
              style={
                styles.notifTopRow
              }
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
              style={
                styles.notifTitle
              }
              numberOfLines={
                2
              }
            >
              {item.title ||
                "Notification"}
            </Text>

            <Text
              style={
                styles.notifMessage
              }
              numberOfLines={
                3
              }
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
                        item.createdAt
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

  const EmptyState =
    () => {
      let title =
        "No notifications yet";

      let message =
        "You're all caught up. New alerts and updates will appear here.";

      if (
        activeTab ===
        "high"
      ) {
        title =
          "No high-priority alerts";

        message =
          "There are currently no high-priority notifications.";
      }

      if (
        activeTab ===
        "updates"
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
            style={
              styles.emptyTitle
            }
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
                true
              )
            }
            activeOpacity={
              0.8
            }
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
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <View
        style={
          styles.container
        }
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
      style={
        styles.container
      }
    >
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
          activeOpacity={
            0.75
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

            {unreadCount >
              0 && (
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

      <View
        style={
          styles.body
        }
      >
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
                : `${notifications.length} notification${
                    notifications.length !==
                    1
                      ? "s"
                      : ""
                  }`}
            </Text>
          </View>

          {unreadCount >
            0 && (
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
                {unreadCount}{" "}
                unread
              </Text>
            </View>
          )}
        </View>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <View
          style={
            styles.filterRow
          }
        >
          {/* ALL */}

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab ===
                "all" &&
                styles.filterActive,
            ]}
            onPress={() =>
              setActiveTab(
                "all"
              )
            }
            activeOpacity={
              0.8
            }
          >
            <Ionicons
              name="apps-outline"
              size={15}
              color={
                activeTab ===
                "all"
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
                "high"
              )
            }
            activeOpacity={
              0.8
            }
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
                "updates"
              )
            }
            activeOpacity={
              0.8
            }
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

        {/* =====================================================
            NOTIFICATION LIST
        ===================================================== */}

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
              index
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
                    true
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

