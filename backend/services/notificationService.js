import admin from "../config/firebase.js";
import User from "../models/userModel.js";

/* =========================================================
   CHECK IF NOTIFICATION IS ALLOWED
========================================================= */

const canSendNotification = ({
  settings,
  notificationType,
}) => {
  /*
    ---------------------------------------------------------
    MASTER MUTE
    ---------------------------------------------------------
  */

  if (settings?.mute === true) {
    console.log("🔕 NOTIFICATION BLOCKED: User has muted notifications");

    return false;
  }

  /*
    ---------------------------------------------------------
    INCIDENT UPDATES
    ---------------------------------------------------------
  */

  if (
    notificationType === "incident" &&
    settings?.incidentUpdates === false
  ) {
    console.log(
      "🔕 NOTIFICATION BLOCKED: Incident updates disabled"
    );

    return false;
  }

  /*
    ---------------------------------------------------------
    GUIDANCE / MESSAGES
    ---------------------------------------------------------
  */

  if (
    notificationType === "message" &&
    settings?.guidanceMessages === false
  ) {
    console.log(
      "🔕 NOTIFICATION BLOCKED: Guidance messages disabled"
    );

    return false;
  }

  /*
    ---------------------------------------------------------
    SYSTEM ANNOUNCEMENTS
    ---------------------------------------------------------
  */

  if (
    notificationType === "announcement" &&
    settings?.systemAnnouncements === false
  ) {
    console.log(
      "🔕 NOTIFICATION BLOCKED: System announcements disabled"
    );

    return false;
  }

  /*
    ---------------------------------------------------------
    HIGH-RISK ALERTS
    ---------------------------------------------------------
  */

  if (
    notificationType === "high-risk" &&
    settings?.highRiskAlerts === false
  ) {
    console.log(
      "🔕 NOTIFICATION BLOCKED: High-risk alerts disabled"
    );

    return false;
  }

  /*
    ---------------------------------------------------------
    DEFAULT
    ---------------------------------------------------------
  */

  return true;
};

/* =========================================================
   SEND PUSH NOTIFICATION
========================================================= */

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
  notificationType = "general",
}) => {
  try {
    /*
      -------------------------------------------------------
      VALIDATE TOKEN
      -------------------------------------------------------
    */

    if (!token) {
      console.log("⚠️ FCM: No token provided");

      return null;
    }

    /*
      -------------------------------------------------------
      FIND USER FROM FCM TOKEN
      -------------------------------------------------------

      We use the token to find the student/user whose
      notification settings should be applied.
    */

    const user = await User.findOne({
      "pushTokens.token": token,
    }).select("notificationSettings email name firstName lastName");

    if (!user) {
      console.log("⚠️ FCM: No user found for token");

      /*
        We can still attempt to send the notification
        because this may be a token that hasn't been
        associated correctly yet.
      */

      console.log(
        "⚠️ Continuing with default notification settings"
      );
    }

    /*
      -------------------------------------------------------
      DEFAULT SETTINGS
      -------------------------------------------------------
    */

    const settings = {
      mute: false,

      incidentUpdates: true,

      guidanceMessages: true,

      systemAnnouncements: true,

      highRiskAlerts: true,

      quietHours: false,

      sound: true,

      vibration: true,

      ...(user?.notificationSettings?.toObject
        ? user.notificationSettings.toObject()
        : user?.notificationSettings || {}),
    };

    console.log("========================================");
    console.log("🔔 FCM NOTIFICATION SETTINGS");
    console.log("========================================");
    console.log("User:", user?._id || "Unknown");
    console.log("Email:", user?.email || "Unknown");
    console.log("Notification Type:", notificationType);
    console.log("Mute:", settings.mute);
    console.log("Incident Updates:", settings.incidentUpdates);
    console.log("Guidance Messages:", settings.guidanceMessages);
    console.log(
      "System Announcements:",
      settings.systemAnnouncements
    );
    console.log("High Risk Alerts:", settings.highRiskAlerts);
    console.log("Sound:", settings.sound);
    console.log("Vibration:", settings.vibration);
    console.log("========================================");

    /*
      -------------------------------------------------------
      CHECK USER PREFERENCES
      -------------------------------------------------------
    */

    const allowed = canSendNotification({
      settings,
      notificationType,
    });

    if (!allowed) {
      console.log("========================================");
      console.log("🔕 FCM NOTIFICATION NOT SENT");
      console.log("========================================");
      console.log("Reason: Blocked by user notification settings");
      console.log("User:", user?._id || "Unknown");
      console.log("Type:", notificationType);
      console.log("========================================");

      return {
        success: false,
        skipped: true,
        reason: "notification_disabled",
      };
    }

    /*
      -------------------------------------------------------
      CONVERT DATA TO STRINGS
      -------------------------------------------------------
    */

    const stringData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        String(value ?? ""),
      ])
    );

    /*
      Add notification type to the data payload.

      This is useful on the React Native side if you need
      to handle the notification differently.
    */

    stringData.notificationType = String(
      notificationType
    );

    /*
      -------------------------------------------------------
      SOUND SETTINGS
      -------------------------------------------------------
    */

    const soundEnabled = settings.sound !== false;

    const vibrationEnabled =
      settings.vibration !== false;

    /*
      -------------------------------------------------------
      BUILD ANDROID NOTIFICATION
      -------------------------------------------------------

      IMPORTANT:
      Android notification channels can override sound
      and vibration behavior. The mobile app must also
      configure its notification channel correctly.
    */

    const androidNotification = {
      channelId: soundEnabled
        ? "default"
        : "silent",

      ...(soundEnabled
        ? {
            sound: "default",
          }
        : {}),

      ...(vibrationEnabled
        ? {
            defaultVibrateTimings: true,
          }
        : {
            defaultVibrateTimings: false,
            vibrateTimingsMillis: [0],
          }),
    };

    /*
      -------------------------------------------------------
      BUILD APNS / IOS NOTIFICATION
      -------------------------------------------------------
    */

    const aps = {};

    /*
      Only add sound when the user enabled sound.

      If sound is disabled, we intentionally do NOT send
      aps.sound.
    */

    if (soundEnabled) {
      aps.sound = "default";
    }

    /*
      Critical alert is NOT used here.

      Normal iOS notifications respect the user's
      notification settings.
    */

    /*
      -------------------------------------------------------
      COMPLETE FCM MESSAGE
      -------------------------------------------------------
    */

    const message = {
      token,

      notification: {
        title,
        body,
      },

      data: stringData,

      android: {
        priority: "high",

        notification: androidNotification,
      },

      apns: {
        headers: {
          "apns-priority": "10",
        },

        payload: {
          aps,
        },
      },
    };

    /*
      -------------------------------------------------------
      LOG
      -------------------------------------------------------
    */

    console.log("========================================");
    console.log("📱 SENDING FCM PUSH");
    console.log("========================================");
    console.log("User:", user?._id || "Unknown");
    console.log("Title:", title);
    console.log("Body:", body);
    console.log("Type:", notificationType);
    console.log(
      "Token:",
      `${token.substring(0, 20)}...`
    );
    console.log("Sound Enabled:", soundEnabled);
    console.log("Vibration Enabled:", vibrationEnabled);
    console.log("Data:", stringData);
    console.log("========================================");

    /*
      -------------------------------------------------------
      SEND FCM
      -------------------------------------------------------
    */

    const response = await admin.messaging().send(message);

    console.log("========================================");
    console.log("✅ FCM NOTIFICATION SENT");
    console.log("========================================");
    console.log("FCM Message ID:", response);
    console.log("========================================");

    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error("========================================");
    console.error("❌ FCM SEND ERROR");
    console.error("========================================");
    console.error("Code:", error?.code);
    console.error("Message:", error?.message);
    console.error(
      "Token:",
      token
        ? `${token.substring(0, 20)}...`
        : "No token"
    );
    console.error("========================================");

    /*
      =======================================================
      AUTOMATICALLY DELETE DEAD FCM TOKEN
      =======================================================
    */

    if (
      error?.code ===
      "messaging/registration-token-not-registered"
    ) {
      try {
        const result = await User.updateMany(
          {
            "pushTokens.token": token,
          },
          {
            $pull: {
              pushTokens: {
                token,
              },
            },
          }
        );

        console.log("========================================");
        console.log("🧹 DEAD FCM TOKEN REMOVED");
        console.log("========================================");
        console.log(
          "Token:",
          `${token.substring(0, 20)}...`
        );
        console.log(
          "Users updated:",
          result.modifiedCount
        );
        console.log("========================================");
      } catch (cleanupError) {
        console.error(
          "❌ Failed to remove dead FCM token:"
        );

        console.error(cleanupError);
      }
    }

    return {
      success: false,
      error: error?.code || "fcm_send_error",
    };
  }
};

