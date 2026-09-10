import express from "express";

import Notification from "../models/Notification.js";

import {
  saveFCMToken,
  removePushToken,
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* =========================================================
   SAVE PUSH TOKEN

   POST /api/notifications/fcm-token
========================================================= */

router.post(
  "/fcm-token",
  verifyToken,
  saveFCMToken
);

/* =========================================================
   REMOVE PUSH TOKEN

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
   We no longer accept :userId from the frontend.

   The authenticated user's ID comes from req.userId.
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

      const notifications =
        await Notification.find({
          userId: req.userId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      const formatted =
        notifications.map((n) => ({
          id: n._id,

          title: n.title,

          message: n.message,

          type: n.type,

          priority: n.priority,

          isRead: n.isRead,

          data: n.data || {},

          createdAt:
            n.createdAt,

          updatedAt:
            n.updatedAt,

          timeAgo:
            getTimeAgo(n.createdAt),
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
   It still verifies that the requested ID belongs to
   the authenticated user.
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

      const notifications =
        await Notification.find({
          userId: req.userId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      const formatted =
        notifications.map((n) => ({
          id: n._id,

          title: n.title,

          message: n.message,

          type: n.type,

          priority: n.priority,

          isRead: n.isRead,

          data: n.data || {},

          createdAt:
            n.createdAt,

          updatedAt:
            n.updatedAt,

          timeAgo:
            getTimeAgo(n.createdAt),
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
            userId: req.userId,
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
            "Notification not found.",
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
            userId: req.userId,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
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

   Kept for testing/admin usage.

   This endpoint is now authenticated.
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
          userId,

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
        });

      /* ===================================================
         SOCKET.IO
      =================================================== */

      const io = req.app.get("io");

      if (io) {
        io.to(String(userId)).emit(
          "newNotification",
          {
            ...notif.toObject(),

            id: notif._id.toString(),

            timeAgo:
              "Just now",
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

router.get("/:userId", getNotifications);

/* =========================================================
   GET ONLY UNREAD
   GET /api/notifications/:userId/unread
========================================================= */

router.get("/:userId/unread", getUnreadNotifications);

/* =========================================================
   MARK ONE AS READ
   PUT /api/notifications/read/:id
========================================================= */

router.put("/read/:id", markNotificationAsRead);

/* =========================================================
   MARK ALL AS READ
   PUT /api/notifications/:userId/read-all
========================================================= */

router.put("/:userId/read-all", markAllNotificationsAsRead);

/* =========================================================
   DELETE
   DELETE /api/notifications/:id
========================================================= */

router.delete("/:id", deleteNotification);


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

export default router;