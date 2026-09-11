import express from "express";
import  Notification  from "../models/Notification.js";
import  { User }  from "../models/userModel.js";
import { sendPushNotification } from "../services/notificationService.js";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  saveFCMToken,
  removePushToken,
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notificationController.js";

const router = express.Router();

/* =========================================================
   HELPER
========================================================= */

const getTimeAgo = (date) => {
  if (!date) return "";

  const now = new Date();
  const created = new Date(date);

  const diff = Math.floor((now - created) / 1000);

  if (diff < 10) return "Just now";
  if (diff < 60) return `${diff} seconds ago`;

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  }

  const years = Math.floor(days / 365);

  return `${years} year${years !== 1 ? "s" : ""} ago`;
};


/* =========================================================
   FORMAT NOTIFICATION
========================================================= */

const formatNotification = (notification) => {
  return {
    id: notification._id?.toString(),
    _id: notification._id?.toString(),

    user: notification.user
      ? notification.user.toString()
      : null,

    title: notification.title || "Notification",

    message: notification.message || "",

    type: notification.type || "general",

    priority: notification.priority || "low",

    isRead: notification.isRead ?? false,

    data: notification.data || {},

    relatedId: notification.relatedId
      ? notification.relatedId.toString()
      : null,

    relatedType: notification.relatedType || null,

    createdAt: notification.createdAt,

    updatedAt: notification.updatedAt,

    timeAgo: getTimeAgo(notification.createdAt),
  };
};


/* =========================================================
   PUSH TOKEN ROUTES
========================================================= */

/*
   Save native FCM token
*/
router.post(
  "/fcm-token",
  verifyToken,
  saveFCMToken
);


/*
   Remove native FCM token
*/
router.post(
  "/remove-token",
  verifyToken,
  removePushToken
);


/* =========================================================
   NOTIFICATION SETTINGS
========================================================= */

/*
   Get notification settings
*/
router.get(
  "/settings",
  verifyToken,
  getNotificationSettings
);


/*
   Update notification settings
*/
router.put(
  "/settings",
  verifyToken,
  updateNotificationSettings
);


/* =========================================================
   GET CURRENT USER NOTIFICATIONS
   IMPORTANT:
   This should be the main endpoint used by mobile.
   
   GET /api/notifications
========================================================= */

router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    console.log("\n========================================");
    console.log("🔔 GET CURRENT USER NOTIFICATIONS");
    console.log("========================================");
    console.log("JWT decoded user ID:", userId);
    console.log("JWT req.user:", req.user);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // ---------------------------------------------------------
    // DEBUG: show latest notifications regardless of owner
    // ---------------------------------------------------------

    const latestNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log("\n📋 LATEST NOTIFICATIONS IN DATABASE:");

    latestNotifications.forEach((notification, index) => {
      console.log(`\nNotification ${index + 1}`);
      console.log("  ID:", notification._id?.toString());
      console.log("  Owner:", notification.user?.toString());
      console.log("  Title:", notification.title);
      console.log(
        "  MATCH:",
        String(notification.user) === String(userId)
      );
    });

    // ---------------------------------------------------------
    // ACTUAL USER QUERY
    // ---------------------------------------------------------

    const notifications = await Notification.find({
      user: userId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .lean();

    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    const formattedNotifications =
      notifications.map(formatNotification);

    console.log("\n📦 USER QUERY RESULT:");
    console.log("User ID queried:", userId);
    console.log(
      "Notifications found:",
      formattedNotifications.length
    );
    console.log(
      "Unread notifications:",
      unreadCount
    );

    if (formattedNotifications.length > 0) {
      console.log(
        "Latest notification:",
        formattedNotifications[0].title
      );
    }

    console.log("========================================\n");

    return res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
    });

  } catch (error) {
    console.error(
      "❌ GET CURRENT USER NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});


/* =========================================================
   GET UNREAD NOTIFICATIONS
   IMPORTANT:
   This route MUST come before /:userId
========================================================= */

router.get(
  "/:userId/unread",
  verifyToken,
  async (req, res) => {
    try {
      const authenticatedUserId = req.userId;

      const requestedUserId = req.params.userId;

      console.log("\n========================================");
      console.log("🔵 GET UNREAD NOTIFICATIONS");
      console.log("========================================");
      console.log(
        "Authenticated User:",
        authenticatedUserId
      );
      console.log(
        "Requested User:",
        requestedUserId
      );

      if (
        authenticatedUserId.toString() !==
        requestedUserId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to access these notifications",
        });
      }

      const notifications = await Notification.find({
        user: authenticatedUserId,
        isRead: false,
      })
        .sort({
          createdAt: -1,
        })
        .limit(100)
        .lean();

      const formattedNotifications =
        notifications.map(formatNotification);

      console.log(
        "📦 Unread notifications found:",
        formattedNotifications.length
      );

      console.log("========================================\n");

      return res.status(200).json({
        success: true,

        notifications: formattedNotifications,

        unreadCount: formattedNotifications.length,
      });

    } catch (error) {
      console.error(
        "❌ GET UNREAD NOTIFICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch unread notifications",
      });
    }
  }
);


/* =========================================================
   GET NOTIFICATIONS BY USER ID
   Compatibility endpoint:
   
   GET /api/notifications/:userId
========================================================= */

router.get(
  "/:userId",
  verifyToken,
  async (req, res) => {
    try {
      const authenticatedUserId = req.userId;

      const requestedUserId = req.params.userId;

      console.log("\n========================================");
      console.log("🔔 GET NOTIFICATIONS BY USER ID");
      console.log("========================================");
      console.log(
        "Authenticated User ID:",
        authenticatedUserId
      );
      console.log(
        "Requested User ID:",
        requestedUserId
      );

      /*
         Prevent one user from reading another
         user's notifications.
      */

      if (
        authenticatedUserId.toString() !==
        requestedUserId.toString()
      ) {
        console.log(
          "❌ User ID mismatch"
        );

        return res.status(403).json({
          success: false,

          message:
            "You are not allowed to access these notifications",
        });
      }

      const notifications = await Notification.find({
        user: authenticatedUserId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(100)
        .lean();

      const unreadCount = notifications.filter(
        (notification) => !notification.isRead
      ).length;

      const formattedNotifications =
        notifications.map(formatNotification);

      console.log(
        "📦 Notifications found:",
        formattedNotifications.length
      );

      console.log(
        "🔵 Unread:",
        unreadCount
      );

      console.log("========================================\n");

      return res.status(200).json({
        success: true,

        notifications: formattedNotifications,

        unreadCount,
      });

    } catch (error) {
      console.error(
        "❌ GET NOTIFICATIONS BY USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch notifications",

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);


/* =========================================================
   MARK SINGLE NOTIFICATION AS READ
========================================================= */

router.put(
  "/read/:id",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.userId;

      const notificationId = req.params.id;

      console.log("\n========================================");
      console.log("📖 MARK NOTIFICATION AS READ");
      console.log("========================================");
      console.log("User:", userId);
      console.log(
        "Notification:",
        notificationId
      );

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: notificationId,

            user: userId,
          },

          {
            $set: {
              isRead: true,
            },
          },

          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,

          message:
            "Notification not found",
        });
      }

      console.log(
        "✅ Notification marked as read"
      );

      console.log("========================================\n");

      return res.status(200).json({
        success: true,

        message:
          "Notification marked as read",

        notification:
          formatNotification(notification),
      });

    } catch (error) {
      console.error(
        "❌ MARK AS READ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to mark notification as read",
      });
    }
  }
);


/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

router.put(
  "/read-all",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.userId;

      console.log("\n========================================");
      console.log("📖 MARK ALL NOTIFICATIONS AS READ");
      console.log("========================================");
      console.log("User:", userId);

      const result =
        await Notification.updateMany(
          {
            user: userId,

            isRead: false,
          },

          {
            $set: {
              isRead: true,
            },
          }
        );

      console.log(
        "✅ Notifications updated:",
        result.modifiedCount
      );

      console.log("========================================\n");

      return res.status(200).json({
        success: true,

        message:
          "All notifications marked as read",

        modifiedCount:
          result.modifiedCount,
      });

    } catch (error) {
      console.error(
        "❌ MARK ALL AS READ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to mark all notifications as read",
      });
    }
  }
);


/* =========================================================
   CREATE NOTIFICATION
========================================================= */

router.post(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      const {
        userId,
        title,
        message,
        type = "general",
        priority = "low",
        data = {},
        relatedId,
        relatedType,
      } = req.body;

      console.log("\n========================================");
      console.log("🔔 CREATE NOTIFICATION");
      console.log("========================================");
      console.log("Target User:", userId);
      console.log("Title:", title);
      console.log("Type:", type);

      if (!userId) {
        return res.status(400).json({
          success: false,

          message:
            "userId is required",
        });
      }

      if (!title) {
        return res.status(400).json({
          success: false,

          message:
            "Notification title is required",
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,

          message:
            "Notification message is required",
        });
      }

      /*
         IMPORTANT:
         Notification model uses "user",
         NOT "userId".
      */

      const notification =
        await Notification.create({
          user: userId,

          title,

          message,

          type,

          priority,

          data,

          relatedId:
            relatedId || null,

          relatedType:
            relatedType || null,

          isRead: false,
        });

      console.log(
        "✅ Notification saved:",
        notification._id.toString()
      );

      /*
         Socket notification
      */

      const io = req.app.get("io");

      if (io) {
        io.to(userId.toString()).emit(
          "newNotification",
          formatNotification(notification)
        );

        console.log(
          "📡 Socket notification emitted to:",
          userId.toString()
        );
      }

      console.log("========================================\n");

      return res.status(201).json({
        success: true,

        message:
          "Notification created successfully",

        notification:
          formatNotification(notification),
      });

    } catch (error) {
      console.error(
        "❌ CREATE NOTIFICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to create notification",

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);


/* =========================================================
   DELETE NOTIFICATION
========================================================= */

router.delete(
  "/:id",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.userId;

      const notificationId =
        req.params.id;

      console.log("\n========================================");
      console.log("🗑️ DELETE NOTIFICATION");
      console.log("========================================");
      console.log("User:", userId);
      console.log(
        "Notification:",
        notificationId
      );

      const deletedNotification =
        await Notification.findOneAndDelete({
          _id: notificationId,

          user: userId,
        });

      if (!deletedNotification) {
        return res.status(404).json({
          success: false,

          message:
            "Notification not found",
        });
      }

      console.log(
        "✅ Notification deleted"
      );

      console.log("========================================\n");

      return res.status(200).json({
        success: true,

        message:
          "Notification deleted successfully",
      });

    } catch (error) {
      console.error(
        "❌ DELETE NOTIFICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to delete notification",
      });
    }
  }
);


/* =========================================================
   TEST FCM PUSH
========================================================= */

router.post(
  "/test-push",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.userId;

      console.log("\n========================================");
      console.log("📱 TEST FCM PUSH");
      console.log("========================================");
      console.log("User:", userId);

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "User not found",
        });
      }

      const fcmTokens =
        (user.pushTokens || []).filter(
          (pushToken) =>
            pushToken.provider === "fcm" &&
            pushToken.token
        );

      console.log(
        "📱 FCM tokens found:",
        fcmTokens.length
      );

      if (fcmTokens.length === 0) {
        return res.status(400).json({
          success: false,

          message:
            "No FCM tokens registered for this user",
        });
      }

      const results = [];

      for (const pushToken of fcmTokens) {
        try {
          console.log(
            "📡 Sending FCM to:",
            pushToken.platform
          );

          const result =
            await sendPushNotification({
              token: pushToken.token,

              title: "📱 GuidED Test",

              body:
                "Hello! This is a real FCM push test from GuidED.",

              data: {
                type: "test",

                timestamp:
                  Date.now().toString(),
              },
            });

          results.push({
            platform:
              pushToken.platform,

            success: true,

            result,
          });

        } catch (error) {
          console.error(
            "❌ FCM send failed:",
            error.message
          );

          results.push({
            platform:
              pushToken.platform,

            success: false,

            error: error.message,
          });
        }
      }

      console.log("========================================\n");

      return res.status(200).json({
        success: true,

        message:
          "FCM test completed",

        results,
      });

    } catch (error) {
      console.error(
        "❌ TEST FCM ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to send FCM test notification",

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);


export default router;

