import admin from "../config/firebase.js";

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
    console.log(
      "Token:",
      `${token.substring(0, 20)}...`
    );
    console.log("Data:", stringData);
    console.log("========================================");

    const response =
      await admin.messaging().send(message);

    console.log(
      "✅ FCM notification sent successfully"
    );

    console.log(
      "FCM Message ID:",
      response
    );

    return response;
  } catch (error) {
    console.error("========================================");
    console.error("❌ FCM SEND ERROR");
    console.error("========================================");
    console.error("Code:", error?.code);
    console.error("Message:", error?.message);
    console.error("Full error:", error);
    console.error("========================================");

    return null;
  }
};