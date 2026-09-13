import Notification from "../models/Notification.js";
import { io } from "../server.js";
import { sendPushNotification } from "../services/notificationService.js";

/* =========================================================
   CONVERT FCM DATA VALUES TO STRINGS
========================================================= */

export const fcmString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

/* =========================================================
   SEND FCM TO USER
========================================================= */

export const sendFCMToUser = async ({
  user,
  title,
  body,
  data = {},
  logPrefix = "FCM",
}) => {
  try {
    if (!user) {
      console.log(`⚠️ ${logPrefix}: No user provided`);
      return;
    }

    const fcmTokens = Array.isArray(user.pushTokens)
      ? user.pushTokens.filter(
          (pushToken) =>
            pushToken?.token &&
            pushToken?.provider === "fcm" &&
            ["android", "ios", "web"].includes(
              pushToken?.platform,
            ),
        )
      : [];

    console.log("");
    console.log("========================================");
    console.log(`📱 ${logPrefix}`);
    console.log("========================================");

    console.log(
      "User:",
      user.email || user._id,
    );

    console.log(
      "Total push tokens:",
      user.pushTokens?.length || 0,
    );

    console.log(
      "Valid FCM tokens:",
      fcmTokens.length,
    );

    if (!fcmTokens.length) {
      console.log(
        `⚠️ ${logPrefix}: No valid FCM tokens found`,
      );

      console.log(
        "Push Tokens:",
        user.pushTokens,
      );

      console.log("========================================");

      return;
    }

    /* =====================================================
       FCM DATA MUST BE STRINGS
    ===================================================== */

    const fcmData = {};

    Object.entries(data || {}).forEach(
      ([key, value]) => {
        fcmData[key] = fcmString(value);
      },
    );

    /* =====================================================
       SEND TO EACH DEVICE
    ===================================================== */

    for (const pushToken of fcmTokens) {
      try {
        console.log("");
        console.log("📱 Sending FCM...");
        console.log(
          "Platform:",
          pushToken.platform,
        );
        console.log(
          "Provider:",
          pushToken.provider,
        );

        console.log(
          "Token:",
          `${pushToken.token.substring(0, 15)}...`,
        );

        const result =
          await sendPushNotification({
            token: pushToken.token,

            title,

            body,

            data: fcmData,
          });

        console.log(
          `✅ ${logPrefix}: FCM sent successfully`,
        );

        console.log(
          "Push Result:",
          result,
        );
      } catch (error) {
        console.error("");
        console.error(
          `❌ ${logPrefix}: FCM failed`,
        );

        console.error(
          "Platform:",
          pushToken.platform,
        );

        console.error(
          "Error:",
          error?.message || error,
        );
      }
    }

    console.log(
      "========================================",
    );
  } catch (error) {
    console.error(
      `❌ ${logPrefix}: Unexpected FCM error:`,
      error?.message || error,
    );
  }
};

/* =========================================================
   CREATE DATABASE + SOCKET NOTIFICATION
========================================================= */

export const createRealtimeNotification = async ({
  userId,
  title,
  message,
  type = "general",
  priority = "low",
  relatedId = null,
  relatedType = null,
  data = {},
  logPrefix = "NOTIFICATION",
}) => {
  try {
    if (!userId) {
      console.log(
        `⚠️ ${logPrefix}: No user ID supplied`,
      );

      return null;
    }

    /* =====================================================
       CREATE DATABASE NOTIFICATION
    ===================================================== */

    const notification =
      await Notification.create({
        user: userId,

        title,

        message,

        type,

        priority,

        isRead: false,

        relatedId,

        relatedType,

        data,
      });

    /* =====================================================
       SOCKET.IO PAYLOAD
    ===================================================== */

    const notificationObject =
      notification.toObject();

    const notificationPayload = {
      ...notificationObject,

      id: notification._id.toString(),

      _id: notification._id.toString(),

      user: userId.toString(),

      data: {
        ...data,
      },
    };

    /* =====================================================
       REALTIME SOCKET
    ===================================================== */

    io.to(userId.toString()).emit(
      "newNotification",
      notificationPayload,
    );

    console.log("");
    console.log(
      `✅ ${logPrefix}: Database notification created`,
    );

    console.log(
      "Notification ID:",
      notification._id.toString(),
    );

    console.log(
      "User:",
      userId.toString(),
    );

    console.log(
      "Type:",
      type,
    );

    console.log(
      "Priority:",
      priority,
    );

    console.log(
      `🔌 ${logPrefix}: Socket notification emitted`,
    );

    return notification;
  } catch (error) {
    console.error("");
    console.error(
      `❌ ${logPrefix}: Notification creation failed`,
    );

    console.error(
      "Message:",
      error?.message || error,
    );

    console.error(
      "Error:",
      error,
    );

    return null;
  }
};