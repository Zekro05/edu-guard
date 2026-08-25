// src/components/GlobalNotifications.jsx

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getMessaging, onMessage } from "firebase/messaging";

import { useAuthStore } from "../store/authStore";
import { registerWebFCM } from "../services/fcmService";
import { getFirebaseMessaging } from "../../config/firebase.js";

/* =========================================================
   GLOBAL SOCKET
========================================================= */

const socket = io("https://edu-guard-backend.onrender.com", {
  transports: ["websocket", "polling"],
  autoConnect: false,
});

/* =========================================================
   GLOBAL NOTIFICATIONS
========================================================= */

const GlobalNotifications = () => {
  const notifSound = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let unsubscribeFCM = null;

    const initialize = async () => {
      try {
        /* =====================================================
           PREVENT DOUBLE INITIALIZATION
        ===================================================== */

        if (initializedRef.current) {
          console.log("⚠️ Global notifications already initialized.");
          return;
        }

        initializedRef.current = true;

        /* =====================================================
           GET CURRENT USER
        ===================================================== */

        const user = useAuthStore.getState().user;

        console.log("====================================");
        console.log("🌐 GLOBAL NOTIFICATION SYSTEM");
        console.log("====================================");
        console.log("User:", user?.email);
        console.log("Role:", user?.role);
        console.log("User ID:", user?._id);

        if (!user?._id) {
          console.log("⚠️ No logged-in user.");
          initializedRef.current = false;
          return;
        }

        const currentUserId = String(user._id);

        /* =====================================================
           NOTIFICATION SOUND
        ===================================================== */

        notifSound.current = new Audio("/notification.mp3");
        notifSound.current.volume = 1;

        /* =====================================================
           BROWSER NOTIFICATION PERMISSION
        ===================================================== */

        if ("Notification" in window) {
          console.log(
            "🔔 Browser notification permission:",
            Notification.permission
          );

          /*
           * We intentionally DON'T automatically request
           * permission here.
           *
           * The browser may block permission prompts unless
           * triggered by a user interaction.
           */
        }

        /* =====================================================
           SOCKET CONNECT
        ===================================================== */

        socket.connect();

        /* =====================================================
           SOCKET CONNECTED
        ===================================================== */

        const handleConnect = () => {
          console.log(
            "🟢 GLOBAL SOCKET CONNECTED:",
            socket.id
          );

          /*
           * Register the user.
           *
           * Your GuidancePage already uses:
           * socket.emit("register", userId)
           *
           * So we do the same globally.
           */

          socket.emit("register", currentUserId);

          console.log(
            "📡 GLOBAL USER REGISTERED:",
            currentUserId
          );

          /*
           * Also join the user's room.
           *
           * This is useful if your backend uses:
           * socket.join(userId)
           */

          socket.emit("join", currentUserId);

          console.log(
            "📡 GLOBAL JOINED USER ROOM:",
            currentUserId
          );
        };

        /* =====================================================
           BROWSER NOTIFICATION
        ===================================================== */

        const showBrowserNotification = ({
          title,
          body,
          data = {},
        }) => {
          if (!("Notification" in window)) {
            console.log(
              "⚠️ Browser does not support notifications."
            );

            return;
          }

          if (Notification.permission !== "granted") {
            console.log(
              "⚠️ Browser notification permission is not granted."
            );

            return;
          }

          try {
            const browserNotification = new Notification(
              title || "EduGuard",
              {
                body:
                  body ||
                  "You have a new notification.",
                icon: "/favicon.ico",
                data,
              }
            );

            browserNotification.onclick = () => {
              window.focus();

              /*
               * Let the application decide where to navigate.
               */

              window.dispatchEvent(
                new CustomEvent(
                  "eduguard:notification-click",
                  {
                    detail: data,
                  }
                )
              );

              browserNotification.close();
            };

            console.log(
              "🔔 GLOBAL BROWSER NOTIFICATION SHOWN"
            );
          } catch (error) {
            console.error(
              "❌ Browser notification error:",
              error
            );
          }
        };

        /* =====================================================
           PLAY NOTIFICATION SOUND
        ===================================================== */

        const playNotificationSound = () => {
          if (!notifSound.current) return;

          /*
           * Reset the sound so multiple notifications can
           * play correctly.
           */

          notifSound.current.currentTime = 0;

          notifSound.current
            .play()
            .then(() => {
              console.log(
                "🔊 GLOBAL NOTIFICATION SOUND PLAYED"
              );
            })
            .catch((error) => {
              console.log(
                "🔇 Notification sound blocked:",
                error
              );
            });
        };

        /* =====================================================
           SOCKET MESSAGE HANDLER
        ===================================================== */

        const handleReceiveMessage = (msg) => {
          if (!msg) return;

          console.log("====================================");
          console.log("🌐📩 GLOBAL MESSAGE RECEIVED");
          console.log("====================================");
          console.log("Message:", msg);

          const senderId = String(msg.sender || "");
          const receiverId = String(msg.receiver || "");

          /*
           * Only process messages sent TO the currently
           * logged-in user.
           */

          if (receiverId !== currentUserId) {
            console.log(
              "⏭️ Message is not for current user."
            );

            return;
          }

          /*
           * Don't notify yourself.
           */

          if (senderId === currentUserId) {
            console.log(
              "⏭️ Ignoring own message."
            );

            return;
          }

          /* ===================================================
             GET SENDER INFORMATION
          =================================================== */

          const senderName =
            msg.senderName ||
            msg.name ||
            "New Message";

          const senderPhoto =
            msg.senderProfilePhoto ||
            msg.profilePhoto ||
            null;

          const messageText =
            msg.text ||
            "You have received a new message.";

          /* ===================================================
             CREATE GLOBAL NOTIFICATION OBJECT
          =================================================== */

          const notification = {
            id:
              msg._id ||
              msg.clientMessageId ||
              `message-${senderId}-${Date.now()}`,

            type: "message",

            title: "New Message",

            message: messageText,

            text: messageText,

            senderId,

            senderName,

            senderProfilePhoto: senderPhoto,

            createdAt:
              msg.createdAt ||
              new Date().toISOString(),

            data: {
              type: "message",

              senderId,

              senderName,

              senderProfilePhoto: senderPhoto,

              messageId:
                msg._id ||
                msg.clientMessageId ||
                null,

              chatId:
                msg.chatId ||
                [currentUserId, senderId]
                  .sort()
                  .join("-"),
            },
          };

          console.log(
            "🔔 GLOBAL MESSAGE NOTIFICATION:",
            notification
          );

          /* ===================================================
             SOUND
          =================================================== */

          playNotificationSound();

          /* ===================================================
             BROWSER NOTIFICATION
          =================================================== */

          showBrowserNotification({
            title: `New message from ${senderName}`,
            body: messageText,
            data: notification.data,
          });

          /* ===================================================
             GLOBAL REACT EVENT
          =================================================== */

          window.dispatchEvent(
            new CustomEvent(
              "eduguard:new-notification",
              {
                detail: notification,
              }
            )
          );

          /* ===================================================
             SPECIFIC MESSAGE EVENT
             
             Components that only care about messages can
             listen to this instead.
          =================================================== */

          window.dispatchEvent(
            new CustomEvent(
              "eduguard:new-message",
              {
                detail: notification,
              }
            )
          );

          console.log(
            "📡 GLOBAL MESSAGE EVENTS DISPATCHED"
          );
        };

        /* =====================================================
           SOCKET GENERIC NOTIFICATION
        ===================================================== */

        const handleNewNotification = (data) => {
          if (!data) return;

          console.log(
            "📩 GLOBAL SOCKET NOTIFICATION:",
            data
          );

          /*
           * Don't treat a message as a second generic
           * notification if the backend already sends both.
           */

          if (
            data.type === "message" ||
            data.notificationType === "message"
          ) {
            console.log(
              "⏭️ Message notification handled by receive_message."
            );

            return;
          }

          const title =
            data.title ||
            "EduGuard";

          const body =
            data.message ||
            data.body ||
            "You have a new notification.";

          /* SOUND */

          playNotificationSound();

          /* BROWSER */

          showBrowserNotification({
            title,
            body,
            data: data.data || {},
          });

          /* GLOBAL EVENT */

          window.dispatchEvent(
            new CustomEvent(
              "eduguard:new-notification",
              {
                detail: data,
              }
            )
          );
        };

        /* =====================================================
           REGISTER SOCKET EVENTS
        ===================================================== */

        socket.on(
          "connect",
          handleConnect
        );

        socket.on(
          "receive_message",
          handleReceiveMessage
        );

        socket.on(
          "newNotification",
          handleNewNotification
        );

        /* =====================================================
           WEB FCM
           
           ADMIN ONLY
        ===================================================== */

        if (user.role === "admin") {
          console.log(
            "👑 Admin detected - registering Web FCM..."
          );

          try {
            const token =
              await registerWebFCM();

            if (token) {
              console.log(
                "✅ GLOBAL ADMIN FCM REGISTERED"
              );
            } else {
              console.log(
                "⚠️ FCM registration returned no token"
              );
            }
          } catch (error) {
            console.error(
              "❌ Web FCM registration failed:",
              error
            );
          }

          /* =================================================
             FOREGROUND FCM
          ================================================= */

          try {
            const messaging =
              await getFirebaseMessaging();

            if (messaging) {
              console.log(
                "👂 GLOBAL FCM FOREGROUND LISTENER ACTIVE"
              );

              unsubscribeFCM = onMessage(
                messaging,
                (payload) => {
                  console.log(
                    "===================================="
                  );

                  console.log(
                    "🌐📩 GLOBAL FCM RECEIVED"
                  );

                  console.log(
                    "Payload:",
                    payload
                  );

                  console.log(
                    "===================================="
                  );

                  const title =
                    payload.notification?.title ||
                    payload.data?.title ||
                    "EduGuard";

                  const body =
                    payload.notification?.body ||
                    payload.data?.body ||
                    "You have a new notification.";

                  const notification = {
                    id:
                      payload.data
                        ?.notificationId ||
                      Date.now(),

                    type:
                      payload.data?.type ||
                      "general",

                    title,

                    message: body,

                    createdAt:
                      new Date().toISOString(),

                    data:
                      payload.data || {},
                  };

                  /* SOUND */

                  playNotificationSound();

                  /* BROWSER */

                  showBrowserNotification({
                    title,
                    body,
                    data:
                      payload.data || {},
                  });

                  /* GLOBAL EVENT */

                  window.dispatchEvent(
                    new CustomEvent(
                      "eduguard:new-notification",
                      {
                        detail:
                          notification,
                      }
                    )
                  );

                  console.log(
                    "📡 GLOBAL FCM EVENT DISPATCHED"
                  );
                }
              );
            } else {
              console.log(
                "❌ Firebase Messaging unavailable"
              );
            }
          } catch (error) {
            console.error(
              "❌ FCM foreground listener failed:",
              error
            );
          }
        } else {
          console.log(
            "ℹ️ Web FCM skipped - user is not admin."
          );
        }

        /* =====================================================
           CONNECT IF SOCKET WAS NOT CONNECTED YET
        ===================================================== */

        if (!socket.connected) {
          socket.connect();
        }
      } catch (error) {
        console.error(
          "❌ GLOBAL NOTIFICATION ERROR:",
          error
        );

        initializedRef.current = false;
      }
    };

    initialize();

    /* =======================================================
       CLEANUP
    ======================================================= */

    return () => {
      console.log(
        "🧹 Cleaning global notification system..."
      );

      if (unsubscribeFCM) {
        unsubscribeFCM();
        unsubscribeFCM = null;
      }

      socket.off(
        "connect"
      );

      socket.off(
        "receive_message"
      );

      socket.off(
        "newNotification"
      );

      socket.disconnect();

      notifSound.current = null;

      initializedRef.current = false;
    };
  }, []);

  return null;
};

export default GlobalNotifications;