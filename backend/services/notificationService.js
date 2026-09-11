import admin from "../config/firebase.js";
import User from "../models/User.js";

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  try {
    if (!token) {
      console.log("⚠️ FCM: No token provided");
      return null;
    }

    const stringData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        String(value ?? ""),
      ])
    );

    const message = {
      token,

      notification: {
        title,
        body,
      },

      data: stringData,

      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },

      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    console.log("========================================");
    console.log("📱 SENDING FCM PUSH");
    console.log("========================================");
    console.log("Title:", title);
    console.log("Body:", body);
    console.log("Token:", `${token.substring(0, 20)}...`);
    console.log("Data:", stringData);
    console.log("========================================");

    const response = await admin.messaging().send(message);

    console.log("✅ FCM notification sent successfully");
    console.log("FCM Message ID:", response);

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
    console.error("Token:", `${token.substring(0, 20)}...`);
    console.error("========================================");

    // =====================================================
    // AUTOMATICALLY DELETE DEAD FCM TOKEN
    // =====================================================

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