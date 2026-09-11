import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  AppState,
  Platform,
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

import messaging from "@react-native-firebase/messaging";

import { useFocusEffect } from "@react-navigation/native";

import { createStyles } from "../../../assets/styles/homestyle/notification.styles";
import { useTheme } from "../../../assets/styles/theme/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useAuthStore,
  API,
} from "../../../store/authStore";

const API_URL =
  "https://edu-guard-backend.onrender.com";

export default function Notification() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  /* =========================================================
     AUTH STORE
  ========================================================= */

  const {
    user,
    isAuthenticated,
    isCheckingAuth,
  } = useAuthStore();

  /*
   * The authStore stores the token inside:
   *
   * user.token
   *
   * The MongoDB User ID is:
   *
   * user._id
   */

  const token =
    user?.token || null;

  const currentUserId =
    user?._id || null;

  /* =========================================================
     STATE
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("all");

  /* =========================================================
     REFS
  ========================================================= */

  const socketRef =
    useRef(null);

  const appStateRef =
    useRef(AppState.currentState);

  const mountedRef =
    useRef(true);

  const hasLoadedRef =
    useRef(false);

  /* =========================================================
     AUTH DEBUG
  ========================================================= */

  useEffect(() => {
    console.log("");
    console.log(
      "==============================================="
    );
    console.log(
      "🔐 NOTIFICATION AUTH STATE"
    );
    console.log(
      "==============================================="
    );

    console.log(
      "User:",
      user
    );

    console.log(
      "MongoDB User._id:",
      currentUserId
    );

    console.log(
      "Token exists:",
      !!token
    );

    console.log(
      "Token length:",
      token?.length || 0
    );

    console.log(
      "Authenticated:",
      isAuthenticated
    );

    console.log(
      "Checking auth:",
      isCheckingAuth
    );

    console.log(
      "Platform:",
      Platform.OS
    );

    console.log(
      "==============================================="
    );
  }, [
    user,
    currentUserId,
    token,
    isAuthenticated,
    isCheckingAuth,
  ]);

  /* =========================================================
     MOUNT / UNMOUNT
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;

    console.log("");
    console.log(
      "==============================================="
    );
    console.log(
      "📱 NOTIFICATION SCREEN MOUNTED"
    );
    console.log(
      "==============================================="
    );

    console.log(
      "Current student User._id:",
      currentUserId
    );

    console.log(
      "Token available:",
      !!token
    );

    console.log(
      "Authenticated:",
      isAuthenticated
    );

    console.log(
      "Auth checking:",
      isCheckingAuth
    );

    console.log(
      "==============================================="
    );

    return () => {
      mountedRef.current = false;

      console.log("");
      console.log(
        "==============================================="
      );
      console.log(
        "📱 NOTIFICATION SCREEN UNMOUNTED"
      );
      console.log(
        "==============================================="
      );
    };
  }, []);

  /* =========================================================
     NORMALIZE NOTIFICATION
  ========================================================= */

  const normalizeNotification =
    useCallback(
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
            notification.isRead ??
            false,

          data:
            notification.data ||
            {},

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
  ========================================================= */

  const fetchNotifications =
    useCallback(
      async (isRefresh = false) => {
        console.log("");
        console.log(
          "==============================================="
        );
        console.log(
          "📲 FETCHING STUDENT NOTIFICATIONS"
        );
        console.log(
          "==============================================="
        );

        console.log(
          "Current User._id:",
          currentUserId
        );

        console.log(
          "Token exists:",
          !!token
        );

        console.log(
          "Authenticated:",
          isAuthenticated
        );

        console.log(
          "Checking auth:",
          isCheckingAuth
        );

        console.log(
          "Refresh:",
          isRefresh
        );

        /* =====================================================
           AUTH IS STILL BEING RESTORED
        ===================================================== */

        if (isCheckingAuth) {
          console.log(
            "⏳ AuthStore is still checking authentication."
          );

          /*
           * IMPORTANT:
           *
           * Do not set loading(false) here.
           *
           * We want the screen to remain in loading state
           * until checkAuth() finishes.
           */

          return;
        }

        /* =====================================================
           AUTH FINISHED BUT USER IS NOT LOGGED IN
        ===================================================== */

        if (
          !isAuthenticated ||
          !token ||
          !currentUserId
        ) {
          console.log(
            "⚠️ Cannot fetch notifications."
          );

          console.log(
            "Authenticated:",
            isAuthenticated
          );

          console.log(
            "Token exists:",
            !!token
          );

          console.log(
            "User ID:",
            currentUserId
          );

          if (
            mountedRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }

          return;
        }

        /* =====================================================
           REFRESH STATE
        ===================================================== */

        if (isRefresh) {
          setRefreshing(true);
        } else if (
          !hasLoadedRef.current
        ) {
          setLoading(true);
        }

        try {
          /* ===================================================
             API URL
          =================================================== */

          const url =
            `/api/notifications/${currentUserId}`;

          console.log("");
          console.log(
            "📡 NOTIFICATION REQUEST"
          );
          console.log(
            "-----------------------------------------------"
          );

          console.log(
            "URL:",
            `${API_URL}${url}`
          );

          console.log(
            "User ID:",
            currentUserId
          );

          console.log(
            "Authorization:",
            token
              ? "Bearer token attached by API interceptor"
              : "NO TOKEN"
          );

          console.log(
            "-----------------------------------------------"
          );

          /*
           * IMPORTANT:
           *
           * Use the API instance from authStore.
           *
           * Your authStore interceptor automatically
           * attaches:
           *
           * Authorization: Bearer <token>
           */

          const response =
            await API.get(
              url,
              {
                timeout: 20000,
              }
            );

          console.log("");
          console.log(
            "📥 NOTIFICATION RESPONSE"
          );
          console.log(
            "-----------------------------------------------"
          );

          console.log(
            "HTTP status:",
            response.status
          );

          console.log(
            "Success:",
            response.data?.success
          );

          console.log(
            "Raw response:",
            response.data
          );

          console.log(
            "-----------------------------------------------"
          );

          /* =================================================
             GET NOTIFICATIONS ARRAY
          ================================================= */

          let data = [];

          if (
            Array.isArray(
              response.data
            )
          ) {
            data =
              response.data;
          } else if (
            Array.isArray(
              response.data
                ?.notifications
            )
          ) {
            data =
              response.data
                .notifications;
          } else if (
            Array.isArray(
              response.data?.data
            )
          ) {
            data =
              response.data.data;
          }

          console.log("");
          console.log(
            "📊 DATABASE NOTIFICATIONS"
          );
          console.log(
            "-----------------------------------------------"
          );

          console.log(
            "Notifications returned:",
            data.length
          );

          console.log(
            "Current User._id:",
            currentUserId
          );

          console.log(
            "-----------------------------------------------"
          );

          console.log(
            "Raw notifications:",
            data
          );

          /* =================================================
             NORMALIZE
          ================================================= */

          const normalized =
            data
              .map(
                normalizeNotification
              )
              .filter(Boolean);

          /* =================================================
             SORT NEWEST FIRST
          ================================================= */

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

              return (
                dateB -
                dateA
              );
            }
          );

          /* =================================================
             DEBUG
          ================================================= */

          console.log("");
          console.log(
            "🔔 FINAL NOTIFICATIONS TO DISPLAY"
          );
          console.log(
            "-----------------------------------------------"
          );

          console.log(
            "Total:",
            normalized.length
          );

          normalized.forEach(
            (
              notification,
              index
            ) => {
              console.log(
                `${index + 1}.`,
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

          console.log(
            "-----------------------------------------------"
          );

          /* =================================================
             UPDATE STATE
          ================================================= */

          if (
            mountedRef.current
          ) {
            setNotifications(
              normalized
            );

            hasLoadedRef.current =
              true;
          }
        } catch (error) {
          console.log("");
          console.log(
            "==============================================="
          );
          console.log(
            "❌ FETCH NOTIFICATIONS ERROR"
          );
          console.log(
            "==============================================="
          );

          console.log(
            "Message:",
            error?.message
          );

          console.log(
            "Status:",
            error?.response?.status
          );

          console.log(
            "Response:",
            error?.response?.data
          );

          console.log(
            "URL:",
            error?.config?.url
          );

          console.log(
            "==============================================="
          );

          /*
           * Do not clear existing notifications.
           *
           * A temporary network error should not make
           * the notification list disappear.
           */
        } finally {
          if (
            mountedRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }

          console.log(
            "🏁 Notification fetch finished"
          );
        }
      },
      [
        token,
        currentUserId,
        isAuthenticated,
        isCheckingAuth,
        normalizeNotification,
      ]
    );

  /* =========================================================
     FETCH AFTER AUTH RESTORATION
  ========================================================= */

  useEffect(() => {
    console.log("");
    console.log(
      "==============================================="
    );
    console.log(
      "🔄 NOTIFICATION AUTH EFFECT"
    );
    console.log(
      "==============================================="
    );

    console.log(
      "Checking auth:",
      isCheckingAuth
    );

    console.log(
      "Authenticated:",
      isAuthenticated
    );

    console.log(
      "Token exists:",
      !!token
    );

    console.log(
      "User ID:",
      currentUserId
    );

    if (isCheckingAuth) {
      console.log(
        "⏳ Still checking authentication..."
      );

      return;
    }

    if (
      isAuthenticated &&
      token &&
      currentUserId
    ) {
      console.log(
        "✅ Authentication ready."
      );

      console.log(
        "📲 Fetching notifications..."
      );

      fetchNotifications(false);
    } else {
      console.log(
        "⚠️ Authentication finished but no valid user."
      );

      if (
        mountedRef.current
      ) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    token,
    currentUserId,
    fetchNotifications,
  ]);

  /* =========================================================
     RESET WHEN USER CHANGES
  ========================================================= */

  useEffect(() => {
    hasLoadedRef.current =
      false;

    /*
     * IMPORTANT:
     *
     * Previously this did:
     *
     * setLoading(true)
     *
     * whenever currentUserId was missing.
     *
     * That could cause the screen to remain stuck
     * while authStore was still restoring the user.
     *
     * Now we only clear the screen after auth has
     * completely finished checking.
     */

    if (
      !currentUserId &&
      !isCheckingAuth
    ) {
      setNotifications([]);
      setLoading(false);
    }
  }, [
    currentUserId,
    isCheckingAuth,
  ]);

  /* =========================================================
     FETCH WHEN SCREEN IS FOCUSED
  ========================================================= */

  useFocusEffect(
    useCallback(() => {
      console.log("");
      console.log(
        "==============================================="
      );
      console.log(
        "📱 NOTIFICATION SCREEN FOCUSED"
      );
      console.log(
        "==============================================="
      );

      console.log(
        "Current User._id:",
        currentUserId
      );

      console.log(
        "Token available:",
        !!token
      );

      console.log(
        "Authenticated:",
        isAuthenticated
      );

      console.log(
        "Checking auth:",
        isCheckingAuth
      );

      /*
       * Don't fetch while auth is restoring.
       */

      if (isCheckingAuth) {
        console.log(
          "⏳ Auth is still checking. Waiting..."
        );

        return () => {
          console.log(
            "📱 Notification screen unfocused"
          );
        };
      }

      if (
        isAuthenticated &&
        token &&
        currentUserId
      ) {
        console.log(
          "✅ Auth ready. Fetching notifications..."
        );

        fetchNotifications(false);
      } else {
        console.log(
          "⚠️ No valid authenticated user yet."
        );

        if (
          mountedRef.current
        ) {
          setLoading(false);
        }
      }

      return () => {
        console.log(
          "📱 Notification screen unfocused"
        );
      };
    }, [
      fetchNotifications,
      token,
      currentUserId,
      isAuthenticated,
      isCheckingAuth,
    ])
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
            nextState ===
              "active"
          ) {
            console.log(
              "📱 App returned to foreground"
            );

            if (
              !isCheckingAuth &&
              isAuthenticated &&
              token &&
              currentUserId
            ) {
              fetchNotifications(
                true
              );
            }
          }

          appStateRef.current =
            nextState;
        }
      );

    return () => {
      subscription.remove();
    };
  }, [
    fetchNotifications,
    token,
    currentUserId,
    isAuthenticated,
    isCheckingAuth,
  ]);

  /* =========================================================
     NATIVE FCM FOREGROUND
  ========================================================= */

  useEffect(() => {
    if (
      Platform.OS ===
      "web"
    ) {
      return;
    }

    if (
      !isAuthenticated ||
      !currentUserId
    ) {
      return;
    }

    let unsubscribe =
      null;

    try {
      unsubscribe =
        messaging().onMessage(
          async (
            remoteMessage
          ) => {
            console.log("");
            console.log(
              "==============================================="
            );
            console.log(
              "📱 NATIVE FCM MESSAGE RECEIVED"
            );
            console.log(
              "==============================================="
            );

            console.log(
              "Message:",
              remoteMessage
            );

            console.log(
              "==============================================="
            );

            if (
              token &&
              currentUserId
            ) {
              await fetchNotifications(
                true
              );
            }
          }
        );
    } catch (error) {
      console.log(
        "❌ FCM foreground listener error:",
        error?.message ||
          error
      );
    }

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, [
    fetchNotifications,
    token,
    currentUserId,
    isAuthenticated,
  ]);

  /* =========================================================
     FCM BACKGROUND OPEN
  ========================================================= */

  useEffect(() => {
    if (
      Platform.OS ===
      "web"
    ) {
      return;
    }

    if (
      !isAuthenticated ||
      !currentUserId
    ) {
      return;
    }

    let unsubscribe =
      null;

    try {
      unsubscribe =
        messaging().onNotificationOpenedApp(
          async (
            remoteMessage
          ) => {
            console.log(
              "📱 FCM notification opened:",
              remoteMessage
            );

            if (
              token &&
              currentUserId
            ) {
              await fetchNotifications(
                true
              );
            }
          }
        );
    } catch (error) {
      console.log(
        "❌ FCM opened-app listener error:",
        error?.message ||
          error
      );
    }

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, [
    fetchNotifications,
    token,
    currentUserId,
    isAuthenticated,
  ]);

  /* =========================================================
     FCM QUIT STATE
  ========================================================= */

  useEffect(() => {
    if (
      Platform.OS ===
      "web"
    ) {
      return;
    }

    if (
      !isAuthenticated ||
      !currentUserId
    ) {
      return;
    }

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

          console.log(
            "📱 App opened from FCM notification:",
            remoteMessage
          );

          if (
            token &&
            currentUserId
          ) {
            await fetchNotifications(
              true
            );
          }
        } catch (error) {
          console.log(
            "❌ Initial FCM notification error:",
            error?.message ||
              error
          );
        }
      };

    checkInitialNotification();

    return () => {
      mounted = false;
    };
  }, [
    fetchNotifications,
    token,
    currentUserId,
    isAuthenticated,
  ]);

  /* =========================================================
     SOCKET.IO
  ========================================================= */

  useEffect(() => {
    if (
      !currentUserId ||
      !isAuthenticated ||
      isCheckingAuth
    ) {
      return;
    }

    console.log("");
    console.log(
      "==============================================="
    );
    console.log(
      "🔌 STARTING STUDENT NOTIFICATION SOCKET"
    );
    console.log(
      "==============================================="
    );

    console.log(
      "Student User._id:",
      currentUserId
    );

    const socket =
      io(
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

          reconnectionDelay:
            1000,

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
        console.log(
          "🔌 Student notification socket connected:",
          socket.id
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
          "✅ Registered socket for student:",
          currentUserId
        );
      }
    );

    /* =======================================================
       REALTIME NOTIFICATION
    ======================================================= */

    socket.on(
      "newNotification",
      (notification) => {
        console.log("");
        console.log(
          "🔔 REALTIME STUDENT NOTIFICATION"
        );

        console.log(
          notification
        );

        if (!notification) {
          return;
        }

        const notificationUser =
          notification?.user?._id ||
          notification?.user ||
          notification?.userId ||
          null;

        if (
          notificationUser &&
          String(
            notificationUser
          ) !==
            String(
              currentUserId
            )
        ) {
          console.log(
            "⚠️ Realtime notification belongs to another user. Ignoring."
          );

          return;
        }

        const normalized =
          normalizeNotification(
            notification
          );

        if (!normalized) {
          return;
        }

        if (
          !mountedRef.current
        ) {
          return;
        }

        setNotifications(
          (previous) => {
            const alreadyExists =
              previous.some(
                (item) =>
                  String(
                    item._id ||
                      item.id
                  ) ===
                  String(
                    normalized._id
                  )
              );

            if (
              alreadyExists
            ) {
              return previous;
            }

            const updated = [
              normalized,
              ...previous,
            ];

            updated.sort(
              (a, b) =>
                new Date(
                  b.createdAt ||
                    0
                ).getTime() -
                new Date(
                  a.createdAt ||
                    0
                ).getTime()
            );

            return updated;
          }
        );
      }
    );

    /* =======================================================
       GENERIC NOTIFICATION
    ======================================================= */

    socket.on(
      "notification",
      () => {
        console.log(
          "🔔 Generic notification event received"
        );

        if (
          token &&
          currentUserId
        ) {
          setTimeout(() => {
            fetchNotifications(
              true
            );
          }, 500);
        }
      }
    );

    /* =======================================================
       STUDENT NOTIFICATION
    ======================================================= */

    socket.on(
      "studentNotification",
      () => {
        console.log(
          "🔔 Student notification event received"
        );

        if (
          token &&
          currentUserId
        ) {
          setTimeout(() => {
            fetchNotifications(
              true
            );
          }, 500);
        }
      }
    );

    /* =======================================================
       REPORT ACCEPTED
    ======================================================= */

    socket.on(
      "reportAccepted",
      () => {
        console.log(
          "📄 Report accepted event received"
        );

        if (
          token &&
          currentUserId
        ) {
          setTimeout(() => {
            fetchNotifications(
              true
            );
          }, 500);
        }
      }
    );

    /* =======================================================
       REPORT STATUS UPDATED
    ======================================================= */

    socket.on(
      "reportStatusUpdated",
      () => {
        console.log(
          "📄 Report status updated event received"
        );

        if (
          token &&
          currentUserId
        ) {
          setTimeout(() => {
            fetchNotifications(
              true
            );
          }, 500);
        }
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
          "❌ Student notification socket error:",
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
      () => {
        console.log(
          "🔄 Student notification socket reconnected"
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
      console.log(
        "🔌 Cleaning student notification socket"
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
    currentUserId,
    fetchNotifications,
    normalizeNotification,
    token,
    isAuthenticated,
    isCheckingAuth,
  ]);

  /* =========================================================
     MARK AS READ
  ========================================================= */

  const markAsRead =
    async (id) => {
      if (!id || !token) {
        return;
      }

      try {
        /*
         * Immediately update UI.
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
         * Use the authenticated API instance.
         */

        await API.put(
          `/api/notifications/read/${id}`,
          {}
        );

        console.log(
          "✅ Notification marked as read:",
          id
        );
      } catch (error) {
        console.log(
          "❌ Mark notification as read error:",
          error?.response
            ?.data ||
            error?.message
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
          activeOpacity={0.85}
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
              numberOfLines={2}
            >
              {item.title ||
                "Notification"}
            </Text>

            <Text
              style={
                styles.notifMessage
              }
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
                  {unreadCount > 99
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
            activeOpacity={0.8}
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
              String(
                item._id ||
                  item.id ||
                  `notification-${index}`
              )
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