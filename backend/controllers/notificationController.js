import User from "../models/userModel.js";
import Notification from "../models/Notification.js";
/* =========================================================
   SAVE PUSH TOKEN

   Shared by:
   - Admin Web
   - Teacher Mobile
   - Student Mobile

   Supported:

   Mobile:
   provider = expo
   platform = android / ios

   Web:
   provider = fcm
   platform = web
========================================================= */

export const saveFCMToken = async (req, res) => {
  try {
    const { token, platform, provider = "fcm" } = req.body;

    /* =====================================================
       VALIDATE TOKEN
    ===================================================== */

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Push token is required.",
      });
    }

    /* =====================================================
       VALIDATE PLATFORM
    ===================================================== */

    const allowedPlatforms = ["android", "ios", "web"];

    if (!allowedPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform. Use android, ios, or web.",
      });
    }

    /* =====================================================
       VALIDATE PROVIDER
    ===================================================== */

    const allowedProviders = ["expo", "fcm"];

    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid push provider. Use expo or fcm.",
      });
    }

    /* =====================================================
       VALIDATE PROVIDER / PLATFORM COMBINATION
    ===================================================== */

    if (provider === "expo" && !["android", "ios"].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Expo tokens are only supported on Android and iOS.",
      });
    }

    if (provider === "fcm" && !["android", "ios", "web"].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "FCM tokens are supported on Android, iOS, and Web.",
      });
    }

    /* =====================================================
       AUTHENTICATED USER
    ===================================================== */

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    /* =====================================================
       INITIALIZE PUSH TOKENS
    ===================================================== */

    if (!Array.isArray(user.pushTokens)) {
      user.pushTokens = [];
    }

    /* =====================================================
       REMOVE DUPLICATE TOKEN

       A token should only exist once for this account.
    ===================================================== */

    user.pushTokens = user.pushTokens.filter((item) => item?.token !== token);

    /* =====================================================
       ADD NEW TOKEN
    ===================================================== */

    user.pushTokens.push({
      token,
      platform,
      provider,
    });

    await user.save();

    console.log("✅ PUSH TOKEN SAVED:", user.email, provider, platform);

    return res.status(200).json({
      success: true,
      message: "Push token saved successfully.",
    });
  } catch (error) {
    console.error("❌ SAVE PUSH TOKEN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save push token.",
    });
  }
};

/* =========================================================
   REMOVE PUSH TOKEN

   Useful during logout.

   The frontend can send the current device token and
   the backend removes only that token.
========================================================= */

export const removePushToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Push token is required.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (Array.isArray(user.pushTokens)) {
      user.pushTokens = user.pushTokens.filter((item) => item?.token !== token);

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Push token removed successfully.",
    });
  } catch (error) {
    console.error("❌ REMOVE PUSH TOKEN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove push token.",
    });
  }
};

/* =========================================================
   GET NOTIFICATION SETTINGS

   Shared by:
   - Admin Web
   - Teacher Mobile
   - Student Mobile
========================================================= */

export const getNotificationSettings = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const user = await User.findById(req.userId).select(
      "notificationSettings role",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      settings: user.notificationSettings || {},
    });
  } catch (err) {
    console.error("❌ GET NOTIFICATION SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load notification settings.",
    });
  }
};

/* =========================================================
   UPDATE NOTIFICATION SETTINGS

   Shared by:
   - Admin Web
   - Teacher Mobile
   - Student Mobile
========================================================= */

export const updateNotificationSettings = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification settings.",
      });
    }

    /* =====================================================
       ALLOWED SETTINGS
    ===================================================== */

    const allowedSettings = [
      "mute",
      "incidentUpdates",
      "guidanceMessages",
      "systemAnnouncements",
      "highRiskAlerts",
      "quietHours",
      "sound",
      "vibration",

      /* Admin settings */
      "emailAlerts",
      "aiPredictionAlerts",
      "securityWarnings",

      /* Optional email destinations */
      "adminEmail",
      "guidanceEmail",
    ];

    const updates = {};

    for (const key of allowedSettings) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid notification settings provided.",
      });
    }

    /* =====================================================
       BOOLEAN VALIDATION
    ===================================================== */

    const booleanSettings = [
      "mute",
      "incidentUpdates",
      "guidanceMessages",
      "systemAnnouncements",
      "highRiskAlerts",
      "quietHours",
      "sound",
      "vibration",
      "emailAlerts",
      "aiPredictionAlerts",
      "securityWarnings",
    ];

    for (const key of booleanSettings) {
      if (
        Object.prototype.hasOwnProperty.call(updates, key) &&
        typeof updates[key] !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message: `${key} must be a boolean.`,
        });
      }
    }

    /* =====================================================
       UPDATE ONLY PROVIDED SETTINGS
    ===================================================== */

    user.notificationSettings = {
      ...(user.notificationSettings || {}),
      ...updates,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully.",
      settings: user.notificationSettings,
    });
  } catch (err) {
    console.error("❌ UPDATE NOTIFICATION SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update notification settings.",
    });
  }
};

/* =========================================================
   GET USER NOTIFICATIONS
   Returns notifications for the logged-in/user account.
========================================================= */

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const notifications = await Notification.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const unreadCount = notifications.filter(
      (notification) => !notification.isRead,
    ).length;

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET UNREAD NOTIFICATIONS
========================================================= */

export const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const notifications = await Notification.find({
      user: userId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error("GET UNREAD NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread notifications.",
      error: error.message,
    });
  }
};

/* =========================================================
   MARK ONE NOTIFICATION AS READ
========================================================= */

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required.",
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        new: true,
      },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
};

/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    await Notification.updateMany(
      {
        user: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
};
