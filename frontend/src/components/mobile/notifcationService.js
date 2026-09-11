import admin from "../config/firebase.js";
import User from "../models/userModel.js";

// =========================================================
// DEFAULT NOTIFICATION SETTINGS
// =========================================================

const DEFAULT_NOTIFICATION_SETTINGS = {
  mute: false,

  incidentUpdates: true,
  guidanceMessages: true,
  systemAnnouncements: true,
  highRiskAlerts: true,

  quietHours: false,

  sound: true,
  vibration: true,
};

// =========================================================
// GET NOTIFICATION CATEGORY SETTING
// =========================================================
//
// notificationType values expected from callers:
//
// incident
// message
// announcement
// system
// high-risk
// general
//
// =========================================================

const getCategorySetting = (
  notificationType,
  settings
) => {
  switch (notificationType) {
    case "incident":
      return settings.incidentUpdates;

    case "message":
      return settings.guidanceMessages;

    case "announcement":
    case "system":
      return settings.systemAnnouncements;

    case "high-risk":
      return settings.highRiskAlerts;

    default:
      return true;
  }
};

// =========================================================
// GET ANDROID CHANNEL
// =========================================================
//
// We use separate Android channels because Android channels
// are persistent and their sound/vibration configuration
// cannot safely be changed after creation.
//
// Channels created in the mobile app:
//
// eduguard_sound_vibration
// eduguard_sound_only
// eduguard_vibration_only
// eduguard_silent
//
// =========================================================

const getAndroidChannel = (
  soundEnabled,
  vibrationEnabled
) => {
  if (
    soundEnabled &&
    vibrationEnabled
  ) {
    return "eduguard_sound_vibration";
  }

  if (
    soundEnabled &&
    !vibrationEnabled
  ) {
    return "eduguard_sound_only";
  }

  if (
    !soundEnabled &&
    vibrationEnabled
  ) {
    return "eduguard_vibration_only";
  }

  return "eduguard_silent";
};

// =========================================================
// SEND PUSH NOTIFICATION
// =========================================================

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
  notificationType = "general",
}) => {
  try {
    // =====================================================
    // VALIDATE TOKEN
    // =====================================================

    if (!token) {
      console.log(
        "⚠️ FCM: No token provided"
      );

      return null;
    }

    // =====================================================
    // FIND USER WHO OWNS THIS TOKEN
    // =====================================================

    const user = await User.findOne({
      "pushTokens.token": token,
    }).select(
      "notificationSettings email name firstName lastName"
    );

    if (!user) {
      console.log(
        "⚠️ FCM: No user found for token."
      );

      return {
        success: false,
        skipped: true,
        reason: "user_not_found",
      };
    }

    // =====================================================
    // MERGE SETTINGS WITH DEFAULTS
    // =====================================================

    const settings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(user.notificationSettings?.toObject?.() ||
        user.notificationSettings ||
        {}),
    };

    console.log("========================================");
    console.log("🔔 CHECKING USER NOTIFICATION SETTINGS");
    console.log("========================================");
    console.log(
      "User:",
      user.email ||
        user.name ||
        user.firstName ||
        "Unknown"
    );
    console.log(
      "Notification Type:",
      notificationType
    );
    console.log(
      "Mute:",
      settings.mute
    );
    console.log(
      "Incident Updates:",
      settings.incidentUpdates
    );
    console.log(
      "Guidance Messages:",
      settings.guidanceMessages
    );
    console.log(
      "System Announcements:",
      settings.systemAnnouncements
    );
    console.log(
      "High Risk Alerts:",
      settings.highRiskAlerts
    );
    console.log(
      "Sound:",
      settings.sound
    );
    console.log(
      "Vibration:",
      settings.vibration
    );
    console.log("========================================");

    // =====================================================
    // MASTER MUTE
    // =====================================================

    if (settings.mute === true) {
      console.log(
        "🔕 PUSH BLOCKED: User has notifications muted."
      );

      return {
        success: true,
        skipped: true,
        reason: "muted",
      };
    }

    // =====================================================
    // CATEGORY SETTING
    // =====================================================

    const categoryEnabled =
      getCategorySetting(
        notificationType,
        settings
      );

    if (categoryEnabled === false) {
      console.log(
        "🔕 PUSH BLOCKED: Notification category disabled."
      );

      return {
        success: true,
        skipped: true,
        reason: "category_disabled",
      };
    }

    // =====================================================
    // QUIET HOURS
    // =====================================================
    //
    // The quietHours toggle by itself does not contain a
    // schedule, so we do not automatically block the
    // notification here.
    //
    // If you later add quietHoursStart / quietHoursEnd,
    // this service can enforce the actual time range.
    //
    // =====================================================

    // =====================================================
    // SOUND + VIBRATION
    // =====================================================

    const soundEnabled =
      settings.sound !== false;

    const vibrationEnabled =
      settings.vibration !== false;

    const channelId =
      getAndroidChannel(
        soundEnabled,
        vibrationEnabled
      );

    // =====================================================
    // CONVERT DATA TO STRINGS
    // =====================================================
    //
    // Firebase requires all FCM data values to be strings.
    //
    // =====================================================

    const stringData = Object.fromEntries(
      Object.entries({
        ...data,

        notificationType,

        soundEnabled: String(
          soundEnabled
        ),

        vibrationEnabled: String(
          vibrationEnabled
        ),

        channelId,
      }).map(
        ([key, value]) => [
          key,
          String(value ?? ""),
        ]
      )
    );

    // =====================================================
    // BUILD FCM MESSAGE
    // =====================================================

    const message = {
      token,

      // ---------------------------------------------------
      // Notification payload
      // ---------------------------------------------------

      notification: {
        title,
        body,
      },

      // ---------------------------------------------------
      // Data payload
      // ---------------------------------------------------

      data: stringData,

      // ---------------------------------------------------
      // Android
      // ---------------------------------------------------

      android: {
        priority: "high",

        notification: {
          channelId,

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
        },
      },

      // ---------------------------------------------------
      // iOS / APNs
      // ---------------------------------------------------

      apns: {
        headers: {
          "apns-priority": "10",
        },

        payload: {
          aps: {
            ...(soundEnabled
              ? {
                  sound: "default",
                }
              : {}),
          },
        },
      },
    };

    // =====================================================
    // LOG
    // =====================================================

    console.log("========================================");
    console.log("📱 SENDING FCM PUSH");
    console.log("========================================");

    console.log(
      "Title:",
      title
    );

    console.log(
      "Body:",
      body
    );

    console.log(
      "Type:",
      notificationType
    );

    console.log(
      "Token:",
      `${token.substring(0, 20)}...`
    );

    console.log(
      "Sound:",
      soundEnabled
    );

    console.log(
      "Vibration:",
      vibrationEnabled
    );

    console.log(
      "Android Channel:",
      channelId
    );

    console.log(
      "Data:",
      stringData
    );

    console.log("========================================");

    // =====================================================
    // SEND TO FIREBASE
    // =====================================================

    const response =
      await admin.messaging().send(
        message
      );

    console.log(
      "✅ FCM notification sent successfully"
    );

    console.log(
      "FCM Message ID:",
      response
    );

    return {
      success: true,
      messageId: response,
      skipped: false,
      settings: {
        sound: soundEnabled,
        vibration: vibrationEnabled,
        channelId,
      },
    };
  } catch (error) {
    console.error("========================================");
    console.error("❌ FCM SEND ERROR");
    console.error("========================================");

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Message:",
      error?.message
    );

    if (token) {
      console.error(
        "Token:",
        `${token.substring(0, 20)}...`
      );
    }

    console.error("========================================");

    // =====================================================
    // AUTOMATICALLY REMOVE DEAD FCM TOKEN
    // =====================================================

    if (
      error?.code ===
      "messaging/registration-token-not-registered"
    ) {
      try {
        const result =
          await User.updateMany(
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
        console.log(
          "🧹 DEAD FCM TOKEN REMOVED"
        );
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

        console.error(
          cleanupError
        );
      }
    }

    return {
      success: false,
      error:
        error?.code ||
        "fcm_send_error",
    };
  }
};

