import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import io from "socket.io-client";
import axios from "axios";
import * as Notifications from "expo-notifications";

import { useFocusEffect } from "@react-navigation/native";
import { createStyles } from "../../../assets/styles/homestyle/notification.styles";
import { useTheme } from "../../../assets/styles/theme/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../store/authStore";

const API_URL = "https://edu-guard-backend.onrender.com";

/*
=========================================================
EXPO NOTIFICATION HANDLER
=========================================================
*/

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Notification() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  /*
  =========================================================
  FETCH NOTIFICATIONS
  =========================================================
  */

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (!user?._id) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        console.log(
          "🔔 Fetching notifications for user:",
          user._id,
        );

        const res = await axios.get(
          `${API_URL}/api/notifications/${user._id}`,
        );

        const data = Array.isArray(res.data?.notifications)
          ? res.data.notifications
          : [];

        console.log(
          "🔔 Notifications fetched:",
          data.length,
        );

        setNotifications(data);
      } catch (err) {
        console.log(
          "❌ Fetch notifications error:",
          err?.response?.data || err?.message,
        );

        if (!isRefresh) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?._id],
  );

  /*
  =========================================================
  REFRESH WHEN SCREEN OPENS
  =========================================================
  */

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  /*
  =========================================================
  EXPO PUSH NOTIFICATION RECEIVED
  =========================================================

  This fires when the app is currently open and
  receives an Expo push notification.
  */

  useEffect(() => {
    console.log(
      "📱 Setting up Expo push notification listener...",
    );

    const subscription =
      Notifications.addNotificationReceivedListener(
        (notification) => {
          const content = notification.request.content;

          console.log("====================================");
          console.log("📱 EXPO PUSH NOTIFICATION RECEIVED");
          console.log("TITLE:", content.title);
          console.log("BODY:", content.body);
          console.log("DATA:", content.data);
          console.log("====================================");

          /*
          The backend already created the Notification
          document.

          Therefore, fetch it from MongoDB instead of
          manually creating another notification here.
          */

          fetchNotifications(true);
        },
      );

    return () => {
      console.log(
        "📱 Removing Expo push notification listener...",
      );

      subscription.remove();
    };
  }, [fetchNotifications]);

  /*
  =========================================================
  EXPO PUSH NOTIFICATION TAPPED
  =========================================================

  This fires when the user taps the phone notification.
  */

  useEffect(() => {
    console.log(
      "📱 Setting up Expo notification response listener...",
    );

    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const notification =
            response.notification;

          const content =
            notification.request.content;

          console.log("====================================");
          console.log("📱 EXPO PUSH NOTIFICATION TAPPED");
          console.log("TITLE:", content.title);
          console.log("BODY:", content.body);
          console.log("DATA:", content.data);
          console.log("====================================");

          /*
          Refresh notifications so the notification
          created by the backend is visible.
          */

          fetchNotifications(true);

          /*
          Optional navigation based on notification type.

          We intentionally do not force navigation here
          because your current Notification screen can
          safely display both reports and interventions.
          */

          const data = content.data || {};

          if (data.type === "intervention") {
            console.log(
              "📌 Intervention notification opened:",
              data.interventionId,
            );
          }

          if (data.type === "report") {
            console.log(
              "📌 Report notification opened:",
              data.reportId,
            );
          }
        },
      );

    return () => {
      console.log(
        "📱 Removing Expo notification response listener...",
      );

      subscription.remove();
    };
  }, [fetchNotifications]);

  /*
  =========================================================
  SOCKET.IO REALTIME NOTIFICATIONS
  =========================================================
  */

  useEffect(() => {
    if (!user?._id) return;

    console.log(
      "🔌 Starting student notification socket...",
    );

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(
        "🔌 Student notification socket connected:",
        socket.id,
      );

      // Register user
      socket.emit("register", user._id);

      // Join user's notification room
      socket.emit("join", user._id);
    });

    /*
    =======================================================
    NEW REALTIME NOTIFICATION
    =======================================================
    */

    socket.on("newNotification", (notif) => {
      console.log("====================================");
      console.log(
        "🔔 STUDENT REALTIME NOTIFICATION:",
        notif,
      );
      console.log("====================================");

      if (!notif) return;

      setNotifications((prev) => {
        /*
        Use MongoDB notification ID as the main
        duplicate-prevention key.
        */

        const incomingId =
          notif._id ||
          notif.id ||
          null;

        if (incomingId) {
          const alreadyExists = prev.some(
            (item) =>
              String(item._id || item.id) ===
              String(incomingId),
          );

          if (alreadyExists) {
            console.log(
              "🔔 Duplicate realtime notification ignored:",
              incomingId,
            );

            return prev;
          }
        }

        const newNotification = {
          ...notif,

          _id:
            notif._id ||
            notif.id,

          id:
            notif._id ||
            notif.id,

          isRead:
            notif.isRead ?? false,
        };

        return [
          newNotification,
          ...prev,
        ];
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "🔌 Student notification socket disconnected:",
        reason,
      );
    });

    socket.on("connect_error", (error) => {
      console.log(
        "❌ Student notification socket connection error:",
        error?.message || error,
      );
    });

    return () => {
      console.log(
        "🔌 Cleaning student notification socket...",
      );

      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [user?._id]);

  /*
  =========================================================
  MARK AS READ
  =========================================================
  */

  const markAsRead = async (id) => {
    if (!id) return;

    try {
      // Update UI immediately
      setNotifications((prev) =>
        prev.map((notification) =>
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

      await axios.put(
        `${API_URL}/api/notifications/read/${id}`,
      );
    } catch (err) {
      console.log(
        "❌ Mark notification read error:",
        err?.response?.data ||
          err?.message,
      );
    }
  };

  /*
  =========================================================
  FILTERS
  =========================================================
  */

  const filteredNotifications =
    notifications.filter((notification) => {
      const type =
        notification.type?.toLowerCase();

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
          type === "success"
        );
      }

      return true;
    });

  /*
  =========================================================
  COUNTS
  =========================================================
  */

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

  /*
  =========================================================
  NOTIFICATION DESIGN
  =========================================================
  */

  const getNotifDesign = (
    notification,
  ) => {
    const priority =
      notification.priority?.toLowerCase();

    const type =
      notification.type?.toLowerCase();

    // HIGH PRIORITY
    if (priority === "high") {
      return {
        color:
          colors.error || "#DC2626",
        icon: "warning-outline",
        label: "High Priority",
      };
    }

    // INTERVENTION
    if (type === "intervention") {
      return {
        color:
          colors.warning || "#F59E0B",
        icon: "school-outline",
        label: "Intervention",
      };
    }

    // REPORT
    if (type === "report") {
      return {
        color:
          colors.error || "#DC2626",
        icon: "document-text-outline",
        label: "Report",
      };
    }

    // MESSAGE
    if (type === "message") {
      return {
        color: colors.primary,
        icon:
          "chatbubble-ellipses-outline",
        label: "Message",
      };
    }

    // UPDATE
    if (type === "update") {
      return {
        color:
          colors.warning || "#F59E0B",
        icon:
          "information-circle-outline",
        label: "Update",
      };
    }

    // SUCCESS
    if (type === "success") {
      return {
        color:
          colors.success || "#16A34A",
        icon:
          "checkmark-circle-outline",
        label: "Success",
      };
    }

    // WARNING
    if (type === "warning") {
      return {
        color:
          colors.warning || "#F59E0B",
        icon:
          "alert-circle-outline",
        label: "Warning",
      };
    }

    // REJECTED
    if (type === "rejected") {
      return {
        color:
          colors.error || "#DC2626",
        icon:
          "close-circle-outline",
        label: "Rejected",
      };
    }

    // GENERAL
    return {
      color: colors.primary,
      icon: "notifications-outline",
      label: "Notification",
    };
  };

  /*
  =========================================================
  RENDER NOTIFICATION
  =========================================================
  */

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
          markAsRead(notificationId)
        }
        style={[
          styles.notifCard,
          !item.isRead &&
            styles.unreadCard,
        ]}
      >
        {/* LEFT COLOR INDICATOR */}

        <View
          style={[
            styles.notifLine,
            {
              backgroundColor:
                color,
            },
          ]}
        />

        {/* ICON */}

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

        {/* CONTENT */}

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

  /*
  =========================================================
  EMPTY STATE
  =========================================================
  */

  const EmptyState = () => {
    let title =
      "No notifications yet";

    let message =
      "You're all caught up. New alerts and updates will appear here.";

    if (activeTab === "high") {
      title =
        "No high-priority alerts";

      message =
        "There are currently no high-priority notifications.";
    }

    if (activeTab === "updates") {
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

  /*
  =========================================================
  LOADING
  =========================================================
  */

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
              Stay updated with alerts
              and announcements
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

  /*
  =========================================================
  MAIN UI
  =========================================================
  */

  return (
    <View
      style={
        styles.container
      }
    >
      {/* HEADER */}

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
            Stay updated with alerts
            and announcements
          </Text>
        </View>
      </LinearGradient>

      {/* BODY */}

      <View
        style={
          styles.body
        }
      >
        {/* SECTION HEADER */}

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
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>

        {/* FILTERS */}

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
              setActiveTab("all")
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

          {/* HIGH PRIORITY */}

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab ===
                "high" &&
                styles.filterActive,
            ]}
            onPress={() =>
              setActiveTab("high")
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
              setActiveTab("updates")
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

        {/* LIST / EMPTY */}

        {filteredNotifications.length ===
        0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={
              filteredNotificationss
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