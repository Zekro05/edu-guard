import { getApp } from "@react-native-firebase/app";

import {
  getMessaging,
  requestPermission as firebaseRequestPermission,
  getToken as firebaseGetToken,
  onMessage as firebaseOnMessage,
  onTokenRefresh as firebaseOnTokenRefresh,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
  getAPNSToken,
} from "@react-native-firebase/messaging";

/* =========================================================
   FIREBASE APP
========================================================= */

const firebaseApp = getApp();

/* =========================================================
   FIREBASE MESSAGING
========================================================= */

const messaging = getMessaging(firebaseApp);

/* =========================================================
   REQUEST NOTIFICATION PERMISSION
========================================================= */

const requestPermission = async () => {
  try {
    const status = await firebaseRequestPermission(messaging, {
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    });

    console.log("🔔 Notification permission status:", status);

    if (
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL
    ) {
      console.log("✅ Notification permission granted.");
      return status;
    }

    console.log("❌ Notification permission not granted.");

    return status;
  } catch (error) {
    console.error(
      "❌ Notification permission error:",
      error?.message || error
    );

    return null;
  }
};

/* =========================================================
   REGISTER REMOTE MESSAGES
========================================================= */

const registerRemoteMessages = async () => {
  try {
    await registerDeviceForRemoteMessages(messaging);

    console.log("✅ Remote messaging registered.");

    return true;
  } catch (error) {
    console.error(
      "❌ Remote messaging registration failed:",
      error?.message || error
    );

    return false;
  }
};

/* =========================================================
   GET APNs TOKEN
========================================================= */

const getAPNsToken = async () => {
  try {
    const token = await getAPNSToken(messaging);

    if (!token) {
      console.log("❌ No APNs token available.");

      return null;
    }

    console.log("🍎 APNs TOKEN:", token);

    return token;
  } catch (error) {
    console.error(
      "❌ APNs TOKEN ERROR:",
      error?.message || error
    );

    return null;
  }
};

/* =========================================================
   GET FCM TOKEN
========================================================= */

const getToken = async () => {
  try {
    /*
      On iOS, make sure the device has an APNs token
      before requesting the FCM token.
    */

    const apnsToken = await getAPNsToken();

    if (!apnsToken) {
      console.error(
        "❌ Cannot get FCM token because APNs token is missing."
      );

      return null;
    }

    const token = await firebaseGetToken(messaging);

    if (!token) {
      console.log("❌ No FCM token generated.");

      return null;
    }

    console.log("🔥 FCM TOKEN:", token);

    return token;
  } catch (error) {
    console.error(
      "❌ FCM TOKEN ERROR:",
      error?.message || error
    );

    return null;
  }
};

/* =========================================================
   FOREGROUND MESSAGE
========================================================= */

const onMessage = (callback) => {
  return firebaseOnMessage(messaging, callback);
};

/* =========================================================
   TOKEN REFRESH
========================================================= */

const onTokenRefresh = (callback) => {
  return firebaseOnTokenRefresh(messaging, callback);
};

/* =========================================================
   COMPLETE FCM REGISTRATION
========================================================= */

const initializeFCM = async () => {
  try {
    console.log("");
    console.log("========================================");
    console.log("📱 INITIALIZING iOS FCM");
    console.log("========================================");

    /*
      1. Request notification permission
    */

    const permissionStatus = await requestPermission();

    if (
      permissionStatus !== AuthorizationStatus.AUTHORIZED &&
      permissionStatus !== AuthorizationStatus.PROVISIONAL
    ) {
      console.error(
        "❌ FCM initialization stopped: notification permission denied."
      );

      return null;
    }

    /*
      2. Register APNs/remote messaging
    */

    const registered = await registerRemoteMessages();

    if (!registered) {
      console.error(
        "❌ FCM initialization stopped: remote messaging registration failed."
      );

      return null;
    }

    /*
      3. Get APNs token
    */

    const apnsToken = await getAPNsToken();

    if (!apnsToken) {
      console.error(
        "❌ FCM initialization stopped: APNs token missing."
      );

      return null;
    }

    /*
      4. Get FCM token
    */

    const fcmToken = await firebaseGetToken(messaging);

    if (!fcmToken) {
      console.error(
        "❌ FCM initialization stopped: FCM token missing."
      );

      return null;
    }

    console.log("");
    console.log("========================================");
    console.log("✅ iOS FCM INITIALIZATION SUCCESSFUL");
    console.log("========================================");
    console.log("🍎 APNs Token:", apnsToken);
    console.log("🔥 FCM Token:", fcmToken);
    console.log("========================================");

    return {
      apnsToken,
      fcmToken,
      permissionStatus,
    };
  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("❌ iOS FCM INITIALIZATION FAILED");
    console.error("========================================");
    console.error("Error:", error?.message || error);
    console.error("Full error:", error);
    console.error("========================================");

    return null;
  }
};

/* =========================================================
   EXPORT
========================================================= */

export {
  firebaseApp,
  messaging,
  AuthorizationStatus,
  requestPermission,
  registerRemoteMessages,
  getToken,
  getAPNsToken,
  initializeFCM,
  onMessage,
  onTokenRefresh,
};

