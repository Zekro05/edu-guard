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
  return await firebaseRequestPermission(
    messaging,
    {
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    }
  );
};

/* =========================================================
   REGISTER REMOTE MESSAGES
========================================================= */

const registerRemoteMessages = async () => {
  try {
    /*
      Needed for iOS/APNs.

      React Native Firebase also safely handles
      this for Android.
    */

    await registerDeviceForRemoteMessages(
      messaging
    );

    console.log(
      "✅ Remote messaging registered."
    );

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
   GET FCM TOKEN
========================================================= */

const getToken = async () => {
  try {
    const token =
      await firebaseGetToken(
        messaging
      );

    if (!token) {
      console.log(
        "❌ No FCM token generated."
      );

      return null;
    }

    console.log(
      "🔥 FCM TOKEN:",
      token
    );

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
   GET APNs TOKEN
========================================================= */

const getAPNsToken = async () => {
  try {
    const token =
      await getAPNSToken(
        messaging
      );

    if (token) {
      console.log(
        "🍎 APNs TOKEN:",
        token
      );
    }

    return token || null;
  } catch (error) {
    console.error(
      "❌ APNs TOKEN ERROR:",
      error?.message || error
    );

    return null;
  }
};

/* =========================================================
   FOREGROUND MESSAGE
========================================================= */

const onMessage = (callback) => {
  return firebaseOnMessage(
    messaging,
    callback
  );
};

/* =========================================================
   TOKEN REFRESH
========================================================= */

const onTokenRefresh = (callback) => {
  return firebaseOnTokenRefresh(
    messaging,
    callback
  );
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
  onMessage,
  onTokenRefresh,
};