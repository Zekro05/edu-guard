import Notification from "../models/Notification.js";

/* =========================================================
   CREATE ONE NOTIFICATION
========================================================= */

export const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  priority = "low",
  relatedId = null,
  relatedType = null,
  io = null,
}) => {
  try {
    if (!userId) {
      console.warn("⚠️ Notification skipped: missing userId");
      return null;
    }

    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      relatedId,
      relatedType,
      isRead: false,
    });

    /* =====================================================
       REAL-TIME SOCKET NOTIFICATION
    ===================================================== */

    if (io) {
      io.to(String(userId)).emit("newNotification", {
        id: notification._id,
        _id: notification._id,

        title: notification.title,
        message: notification.message,

        type: notification.type,
        priority: notification.priority,

        isRead: false,

        relatedId: notification.relatedId,
        relatedType: notification.relatedType,

        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (error) {
    console.error("CREATE NOTIFICATION ERROR:", error);

    return null;
  }
};

/* =========================================================
   CREATE NOTIFICATION FOR ALL ADMINS
========================================================= */

export const notifyAdmins = async ({
  title,
  message,
  type = "general",
  priority = "low",
  relatedId = null,
  relatedType = null,
  io = null,
}) => {
  try {
    const User = (await import("../models/userModel.js")).default;

    const admins = await User.find({
      role: {
        $regex: /^admin$/i,
      },
    }).select("_id");

    if (!admins.length) {
      console.warn("⚠️ No admin accounts found for notification.");
      return [];
    }

    const notifications = [];

    for (const admin of admins) {
      const notification = await createNotification({
        userId: admin._id,
        title,
        message,
        type,
        priority,
        relatedId,
        relatedType,
        io,
      });

      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error("NOTIFY ADMINS ERROR:", error);

    return [];
  }
};