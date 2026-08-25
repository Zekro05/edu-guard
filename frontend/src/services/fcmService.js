import {
  getToken,
  onMessage,
} from "firebase/messaging";

import {
  getFirebaseMessaging,
} from "../../config/firebase.js";

import { API } from "../lib/api.js";

/* =========================================================
   REGISTER WEB FCM
========================================================= */

export const registerWebFCM = async () => {
  console.log("====================================");
  console.log("🔥 registerWebFCM() STARTED");
  console.log("====================================");

  try {
    /* =====================================================
       CHECK BROWSER NOTIFICATION SUPPORT
    ===================================================== */

    console.log(
      "🌐 Checking browser notification support..."
    );

    if (!("Notification" in window)) {
      console.log(
        "❌ Browser does NOT support notifications."
      );

      return null;
    }

    console.log(
      "✅ Browser supports notifications."
    );

    console.log(
      "Current permission:",
      Notification.permission
    );

    /* =====================================================
       REQUEST NOTIFICATION PERMISSION
    ===================================================== */

    let permission =
      Notification.permission;

    if (permission !== "granted") {
      console.log(
        "🔔 Requesting notification permission..."
      );

      permission =
        await Notification.requestPermission();

      console.log(
        "🔔 Notification permission result:",
        permission
      );
    }

    if (permission !== "granted") {
      console.log(
        "❌ Notification permission denied."
      );

      return null;
    }

    console.log(
      "✅ Notification permission granted."
    );

    /* =====================================================
       FIREBASE MESSAGING
    ===================================================== */

    console.log(
      "🔥 Getting Firebase Messaging..."
    );

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      console.log(
        "❌ Firebase Messaging is unavailable."
      );

      return null;
    }

    console.log(
      "✅ Firebase Messaging initialized."
    );

    /* =====================================================
       VAPID KEY
    ===================================================== */

    const vapidKey =
      import.meta.env
        .VITE_FIREBASE_VAPID_KEY;

    console.log(
      "🔑 VAPID key exists:",
      Boolean(vapidKey)
    );

    if (!vapidKey) {
      console.log(
        "❌ VITE_FIREBASE_VAPID_KEY is missing."
      );

      return null;
    }

    /* =====================================================
       GET FCM TOKEN
    ===================================================== */

    console.log(
      "📱 Requesting FCM token..."
    );

    const token =
      await getToken(
        messaging,
        {
          vapidKey,
        }
      );

    if (!token) {
      console.log(
        "❌ Firebase returned no FCM token."
      );

      return null;
    }

    console.log(
      "===================================="
    );

    console.log(
      "🌐 WEB FCM TOKEN:"
    );

    console.log(token);

    console.log(
      "===================================="
    );

    /* =====================================================
       SAVE TOKEN TO BACKEND
    ===================================================== */

    console.log(
      "📡 Saving FCM token to backend..."
    );

    const response =
      await API.post(
        "/api/notifications/fcm-token",
        {
          token,
          platform: "web",
          provider: "fcm",
        }
      );

    console.log(
      "===================================="
    );

    console.log(
      "✅ FCM TOKEN SAVED:",
      response.data
    );

    console.log(
      "===================================="
    );

    /* =====================================================
       SAVE TOKEN LOCALLY
    ===================================================== */

    localStorage.setItem(
      "webFCMToken",
      token
    );

    console.log(
      "💾 Web FCM token saved locally."
    );

    /* =====================================================
       COMPLETE
    ===================================================== */

    return token;

  } catch (error) {
    console.error(
      "===================================="
    );

    console.error(
      "❌ WEB FCM REGISTRATION ERROR"
    );

    console.error(
      "===================================="
    );

    console.error(error);

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Response:",
      error?.response?.data
    );

    console.error(
      "===================================="
    );

    return null;
  }
};


/* =========================================================
   FOREGROUND WEB FCM LISTENER
========================================================= */

export const listenForWebFCM = async (
  callback
) => {
  try {
    console.log(
      "===================================="
    );

    console.log(
      "👂 STARTING FOREGROUND FCM LISTENER"
    );

    console.log(
      "===================================="
    );

    const messaging =
      await getFirebaseMessaging();

    if (!messaging) {
      console.log(
        "❌ Firebase Messaging unavailable."
      );

      return () => {};
    }

    console.log(
      "✅ Foreground FCM listener connected."
    );

    /* =====================================================
       LISTEN FOR FOREGROUND MESSAGE
    ===================================================== */

    const unsubscribe =
      onMessage(
        messaging,
        (payload) => {
          console.log(
            "===================================="
          );

          console.log(
            "🔥 FOREGROUND FCM MESSAGE RECEIVED"
          );

          console.log(
            "===================================="
          );

          console.log(
            "FCM PAYLOAD:",
            payload
          );

          const notification =
            payload.notification || {};

          const data =
            payload.data || {};

          const title =
            notification.title ||
            data.title ||
            "EduGuard";

          const body =
            notification.body ||
            data.body ||
            "You have a new notification.";

          console.log(
            "🔔 Notification title:",
            title
          );

          console.log(
            "🔔 Notification body:",
            body
          );

          console.log(
            "📦 Notification data:",
            data
          );

          /* =================================================
             SHOW BROWSER NOTIFICATION
          ================================================= */

          if (
            Notification.permission ===
            "granted"
          ) {
            try {
              const browserNotification =
                new Notification(
                  title,
                  {
                    body,

                    icon: "/favicon.ico",

                    data,
                  }
                );

              console.log(
                "🔔 Browser notification displayed."
              );

              /* =============================================
                 OPTIONAL CLICK HANDLER
              ============================================= */

              browserNotification.onclick =
                () => {
                  window.focus();

                  console.log(
                    "🔔 FCM notification clicked:",
                    data
                  );

                  browserNotification.close();
                };
            } catch (notificationError) {
              console.error(
                "❌ BROWSER NOTIFICATION ERROR:",
                notificationError
              );
            }
          } else {
            console.log(
              "⚠️ Browser notification permission is not granted:",
              Notification.permission
            );
          }

          /* =================================================
             SEND MESSAGE TO REACT
          ================================================= */

          if (callback) {
            callback({
              title,

              body,

              data,

              payload,
            });
          }
        }
      );

    return unsubscribe;

  } catch (error) {
    console.error(
      "❌ FOREGROUND FCM LISTENER ERROR:",
      error
    );

    return () => {};
  }
};