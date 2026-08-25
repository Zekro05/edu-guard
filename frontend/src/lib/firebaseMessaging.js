// src/lib/firebaseMessaging.js

import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const getWebFCMToken = async () => {
  try {
    const supported = await isSupported();

    if (!supported) {
      console.log("⚠️ Firebase Messaging is not supported.");
      return null;
    }

    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (!token) {
      console.log("❌ No web FCM token received.");
      return null;
    }

    console.log("🔥 WEB FCM TOKEN:", token);

    return token;
  } catch (error) {
    console.error(
      "❌ WEB FCM TOKEN ERROR:",
      error
    );

    return null;
  }
};