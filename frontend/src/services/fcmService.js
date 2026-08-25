import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "../../config/firebase.js";
import { API } from "../lib//api.js";

export const registerWebFCM = async () => {
  console.log("====================================");
  console.log("🔥 registerWebFCM() STARTED");
  console.log("====================================");

  try {
    console.log("🌐 Checking browser notification support...");

    if (!("Notification" in window)) {
      console.log("❌ Browser does NOT support notifications.");
      return null;
    }

    console.log("✅ Browser supports notifications.");
    console.log("Current permission:", Notification.permission);

    /*
    =====================================================
    REQUEST PERMISSION
    =====================================================
    */

    let permission = Notification.permission;

    if (permission !== "granted") {
      console.log("🔔 Requesting notification permission...");

      permission = await Notification.requestPermission();

      console.log(
        "🔔 Notification permission result:",
        permission
      );
    }

    if (permission !== "granted") {
      console.log("❌ Notification permission denied.");
      return null;
    }

    console.log("✅ Notification permission granted.");

    /*
    =====================================================
    FIREBASE MESSAGING
    =====================================================
    */

    console.log("🔥 Getting Firebase Messaging...");

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      console.log("❌ Firebase Messaging is unavailable.");
      return null;
    }

    console.log("✅ Firebase Messaging initialized.");

    /*
    =====================================================
    VAPID KEY
    =====================================================
    */

    const vapidKey =
      import.meta.env.VITE_FIREBASE_VAPID_KEY;

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

    /*
    =====================================================
    GET FCM TOKEN
    =====================================================
    */

    console.log("📱 Requesting FCM token...");

    const token = await getToken(messaging, {
      vapidKey,
    });

    if (!token) {
      console.log("❌ Firebase returned no FCM token.");
      return null;
    }

    console.log("====================================");
    console.log("🌐 WEB FCM TOKEN:");
    console.log(token);
    console.log("====================================");

    /*
    =====================================================
    SAVE TOKEN TO BACKEND
    =====================================================
    */

    console.log("📡 Saving FCM token to backend...");

    const response = await API.post(
      "/api/notifications/fcm-token",
      {
        token,
        platform: "web",
        provider: "fcm",
      }
    );

    console.log(
      "✅ FCM TOKEN SAVED:",
      response.data
    );

    return token;
  } catch (error) {
    console.error("====================================");
    console.error("❌ WEB FCM REGISTRATION ERROR");
    console.error("====================================");
    console.error(error);
    console.error(
      "Message:",
      error?.message
    );
    console.error(
      "Response:",
      error?.response?.data
    );
    console.error("====================================");

    return null;
  }
};