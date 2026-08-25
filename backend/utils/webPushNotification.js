import admin from "../config/firebase.js";

/* =========================================================
   SEND WEB FCM NOTIFICATION
========================================================= */

export const sendWebPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  if (!token) {
    throw new Error(
      "No web FCM token provided"
    );
  }

  /* =======================================================
     FIREBASE DATA VALUES MUST BE STRINGS
  ======================================================= */

  const stringData = Object.fromEntries(
    Object.entries(data).map(
      ([key, value]) => [
        key,
        String(value ?? ""),
      ]
    )
  );

  /* =======================================================
     FCM MESSAGE
  ======================================================= */

  const message = {
    token,

    notification: {
      title,
      body,
    },

    data: stringData,

    webpush: {
      notification: {
        title,
        body,

        // Make sure this file exists in your web frontend
        icon: "/logo.png",
      },
    },
  };

  /* =======================================================
     SEND THROUGH FIREBASE ADMIN
  ======================================================= */

  const response =
    await admin.messaging().send(message);

  console.log(
    "🔥 Firebase Web Push sent successfully:",
    response
  );

  return response;
};