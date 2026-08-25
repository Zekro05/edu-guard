importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCJ4ALX8SgOv_0dJ077A3N2axP_kN7iOqI",
  authDomain: "eduguard-b7d1e.firebaseapp.com",
  projectId: "eduguard-b7d1e",
  storageBucket: "eduguard-b7d1e.appspot.com",
  messagingSenderId: "1051795648424",
  appId: "1:1051795648424:web:8c8f8f8f8f8f8f8f8f8f8f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "EduGuard";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "You have a new notification.",
    icon: "/favicon.ico",
    data: payload.data || {},
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});