import express from "express";
import Notification from "../models/Notification.js";

import {
  saveFCMToken,
  removePushToken,
} from "../controllers/notificationController.js";
import User from "../models/userModel.js";
import { sendPushNotification } from "../services/notificationService.js";

import { verifyToken } from "../middleware/verifyToken.js";


const router = express.Router();

/* =========================================================
   SAVE FCM TOKEN

   POST /api/notifications/fcm-token
========================================================= */

router.post(
  "/fcm-token",
  verifyToken,
  saveFCMToken
);

/* =========================================================
   REMOVE FCM TOKEN

   POST /api/notifications/remove-token
========================================================= */

router.post(
  "/remove-token",
  verifyToken,
  removePushToken
);

/* =========================================================
   GET CURRENT USER NOTIFICATIONS

   GET /api/notifications

   IMPORTANT:
   The authenticated user's ID comes from req.userId.

   Notification model uses:
   user: ObjectId
========================================================= */

router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const notifications = await Notification.find({
        user: req.userId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

      const formatted = notifications.map((n) => ({
        id: n._id.toString(),

        title: n.title,

        message: n.message,

        type: n.type,

        priority: n.priority,

        isRead: n.isRead,

        data: n.data || {},

        relatedId: n.relatedId
          ? n.relatedId.toString()
          : null,

        relatedType: n.relatedType || null,

        createdAt: n.createdAt,

        updatedAt: n.updatedAt,

        timeAgo: getTimeAgo(n.createdAt),
      }));

      return res.status(200).json({
        success: true,
        notifications: formatted,
      });
    } catch (err) {
      console.error(
        "❌ GET NOTIFICATIONS ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =========================================================
   LEGACY GET USER NOTIFICATIONS

   GET /api/notifications/:userId

   Kept for compatibility with your existing mobile UI.

   IMPORTANT:
   The requested userId must match the authenticated user.
========================================================= */

router.get(
  "/:userId",
  verifyToken,
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      if (
        String(req.userId) !==
        String(req.params.userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only access your own notifications.",
        });
      }

      const notifications = await Notification.find({
        user: req.userId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

      const formatted = notifications.map((n) => ({
        id: n._id.toString(),

        title: n.title,

        message: n.message,

        type: n.type,

        priority: n.priority,

        isRead: n.isRead,

        data: n.data || {},

        relatedId: n.relatedId
          ? n.relatedId.toString()
          : null,

        relatedType: n.relatedType || null,

        createdAt: n.createdAt,

        updatedAt: n.updatedAt,

        timeAgo: getTimeAgo(n.createdAt),
      }));

      return res.status(200).json({
        success: true,
        notifications: formatted,
      });
    } catch (err) {
      console.error(
        "❌ GET USER NOTIFICATIONS ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =========================================================
   GET ONLY UNREAD

   GET /api/notifications/:userId/unread
========================================================= */

router.get(
  "/:userId/unread",
  verifyToken,
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      if (
        String(req.userId) !==
        String(req.params.userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only access your own notifications.",
        });
      }

      const notifications = await Notification.find({
        user: req.userId,
        isRead: false,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

      const formatted = notifications.map((n) => ({
        id: n._id.toString(),

        title: n.title,

        message: n.message,

        type: n.type,

        priority: n.priority,

        isRead: n.isRead,

        data: n.data || {},

        relatedId: n.relatedId
          ? n.relatedId.toString()
          : null,

        relatedType: n.relatedType || null,

        createdAt: n.createdAt,

        updatedAt: n.updatedAt,

        timeAgo: getTimeAgo(n.createdAt),
      }));

      return res.status(200).json({
        success: true,
        notifications: formatted,
      });
    } catch (err) {
      console.error(
        "❌ GET UNREAD NOTIFICATIONS ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =========================================================
   MARK ONE NOTIFICATION AS READ

   PUT /api/notifications/read/:id
========================================================= */

router.put(
  "/read/:id",
  verifyToken,
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: req.params.id,

            // IMPORTANT:
            // model field is "user", NOT "userId"
            user: req.userId,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        notification,
      });
    } catch (err) {
      console.error(
        "❌ MARK NOTIFICATION READ ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =========================================================
   MARK ALL AS READ

   PUT /api/notifications/read-all
========================================================= */

router.put(
  "/read-all",
  verifyToken,
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const result =
        await Notification.updateMany(
          {
            user: req.userId,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read.",
        modifiedCount:
          result.modifiedCount,
      });
    } catch (err) {
      console.error(
        "❌ MARK ALL NOTIFICATIONS READ ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =========================================================
   CREATE NOTIFICATION

   POST /api/notifications

   Useful for testing/admin usage.

   Body:
   {
     "userId": "...",
     "title": "...",
     "message": "...",
     "type": "general",
     "priority": "low",
     "data": {}
   }

   The request still accepts "userId" from the frontend,
   but saves it to the model's "user" field.
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
        type,
        priority,
        data,
        relatedId,
        relatedType,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "Notification userId is required.",
        });
      }

      const notif =
        await Notification.create({
          // IMPORTANT:
          // Notification model uses "user"
          user: userId,

          title:
            title || "EduGuard",

          message:
            message || "",

          type:
            type || "general",

          priority:
            priority || "low",

          isRead: false,

          data: data || {},

          relatedId:
            relatedId || null,

          relatedType:
            relatedType || null,
        });

      /* ===================================================
         SOCKET.IO
      =================================================== */

      const io = req.app.get("io");

      if (io) {
        io.to(String(userId)).emit(
          "newNotification",
          {
            id: notif._id.toString(),

            title: notif.title,

            message: notif.message,

            type: notif.type,

            priority: notif.priority,

            isRead: notif.isRead,

            data: notif.data || {},

            relatedId:
              notif.relatedId
                ? notif.relatedId.toString()
                : null,

            relatedType:
              notif.relatedType || null,

            createdAt:
              notif.createdAt,

            updatedAt:
              notif.updatedAt,

            timeAgo: "Just now",
          }
        );
      }

      return res.status(201).json({
        success: true,
        notification: notif,
      });
    } catch (err) {
      console.error(
        "❌ CREATE NOTIFICATION ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =========================================================
   DELETE NOTIFICATION

   DELETE /api/notifications/:id
========================================================= */

router.delete(
  "/:id",
  verifyToken,
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      const notification =
        await Notification.findOneAndDelete({
          _id: req.params.id,

          // IMPORTANT:
          // model field is "user"
          user: req.userId,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Notification deleted successfully.",
      });
    } catch (err) {
      console.error(
        "❌ DELETE NOTIFICATION ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

/* =========================================================
   TIME AGO HELPER
========================================================= */

function getTimeAgo(date) {
  if (!date) {
    return "Just now";
  }

  const diff = Math.floor(
    (Date.now() -
      new Date(date).getTime()) /
      1000
  );

  if (diff < 60) {
    return "Just now";
  }

  if (diff < 3600) {
    return `${Math.floor(
      diff / 60
    )} min ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(
      diff / 3600
    )} hr ago`;
  }

  return `${Math.floor(
    diff / 86400
  )} day(s) ago`;
}

router.post("/test-push", verifyToken, async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findById(userId).select(
      "email pushTokens"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const fcmTokens = Array.isArray(user.pushTokens)
      ? user.pushTokens.filter(
          (item) =>
            item?.token &&
            item?.provider === "fcm" &&
            item?.platform === "ios"
        )
      : [];

    if (!fcmTokens.length) {
      return res.status(400).json({
        success: false,
        message: "No iOS FCM token found for this user",
        pushTokens: user.pushTokens || [],
      });
    }

    const results = [];

    for (const pushToken of fcmTokens) {
      try {
        const result = await sendPushNotification({
          token: pushToken.token,
          title: title || "EduGuard Test",
          body: body || "This is a test notification from Postman.",
          data: {
            type: "test",
            timestamp: Date.now().toString(),
          },
        });

        results.push({
          platform: pushToken.platform,
          provider: pushToken.provider,
          success: !!result,
          result,
        });
      } catch (error) {
        results.push({
          platform: pushToken.platform,
          provider: pushToken.provider,
          success: false,
          error: error.message,
        });
      }
    }

    return res.json({
      success: true,
      message: "FCM test completed",
      results,
    });
  } catch (error) {
    console.error("TEST PUSH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;