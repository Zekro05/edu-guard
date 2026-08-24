import admin from "../config/firebase.js";

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  if (!token) {
    console.log("No FCM token provided.");
    return null;
  }

  try {
    const message = {
      token,

      notification: {
        title,
        body,
      },

      data: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          String(value),
        ])
      ),

      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },

      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(message);

    console.log("FCM notification sent:", response);

    return response;
  } catch (error) {
    console.error("FCM notification error:", error);

    return null;
  }
};