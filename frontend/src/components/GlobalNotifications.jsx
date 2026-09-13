import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { onMessage } from "firebase/messaging";

import { useAuthStore } from "../store/authStore";
import { registerWebFCM } from "../services/fcmService";
import { getFirebaseMessaging } from "../../config/firebase.js";

/* =========================================================
GLOBAL SOCKET

IMPORTANT:
This is the ONLY web Socket.IO connection responsible
for global realtime notifications.

DashboardPage and other pages should NOT create their
own notification socket.
========================================================= */

const socket = io(
"https://edu-guard-backend.onrender.com",
{
transports: ["websocket", "polling"],
autoConnect: false,
},
);

/* =========================================================
GLOBAL NOTIFICATIONS
========================================================= */

const GlobalNotifications = () => {
const notifSound = useRef(null);
const initializedRef = useRef(false);
const currentUserIdRef = useRef(null);
const audioUnlockedRef = useRef(false);

useEffect(() => {
let unsubscribeFCM = null;

/* =====================================================
   AUDIO UNLOCK

   Browsers can block programmatic audio until the user
   interacts with the page.

   We listen for the first user interaction and unlock
   the notification audio.
===================================================== */

const unlockAudio = () => {
  if (
    audioUnlockedRef.current ||
    !notifSound.current
  ) {
    return;
  }

  try {
    const audio = notifSound.current;

    audio.muted = true;
    audio.currentTime = 0;

    const promise = audio.play();

    if (promise && typeof promise.then === "function") {
      promise
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;

          audioUnlockedRef.current = true;

          console.log(
            "🔊 GLOBAL NOTIFICATION AUDIO UNLOCKED",
          );
        })
        .catch(() => {
          audio.muted = false;

          console.log(
            "⚠️ Notification audio is still locked.",
          );
        });
    } else {
      audio.muted = false;
      audioUnlockedRef.current = true;
    }
  } catch (error) {
    console.log(
      "⚠️ Unable to unlock notification audio:",
      error,
    );
  }
};

window.addEventListener(
  "click",
  unlockAudio,
  { passive: true },
);

window.addEventListener(
  "keydown",
  unlockAudio,
  { passive: true },
);

window.addEventListener(
  "touchstart",
  unlockAudio,
  { passive: true },
);

/* =====================================================
   INITIALIZE
===================================================== */

const initialize = async () => {
  try {
    if (initializedRef.current) {
      console.log(
        "⚠️ Global notifications already initialized.",
      );

      return;
    }

    const user =
      useAuthStore.getState().user;

    console.log(
      "====================================",
    );

    console.log(
      "🌐 GLOBAL NOTIFICATION SYSTEM",
    );

    console.log(
      "====================================",
    );

    console.log(
      "User:",
      user?.email,
    );

    console.log(
      "Role:",
      user?.role,
    );


    if (!user?._id) {
      console.log(
        "⚠️ No logged-in user. Global notifications waiting.",
      );

      return;
    }

    initializedRef.current = true;

    const currentUserId =
      String(user._id);

    currentUserIdRef.current =
      currentUserId;

    /* =================================================
       NOTIFICATION SOUND
    ================================================= */

    notifSound.current =
      new Audio("/notification.mp3");

    notifSound.current.preload =
      "auto";

    notifSound.current.volume = 1;

    /*
     * Attempt to preload the audio without playing it.
     */
    try {
      notifSound.current.load();
    } catch (error) {
      console.log(
        "⚠️ Notification sound preload failed:",
        error,
      );
    }

    /* =================================================
       BROWSER NOTIFICATION PERMISSION
    ================================================= */

    if ("Notification" in window) {
      console.log(
        "🔔 Browser notification permission:",
        Notification.permission,
      );

      /*
       * We intentionally do NOT automatically request
       * permission on page load.

       * The browser may block or dislike automatic
       * permission prompts.

       * The permission can be granted manually by the
       * browser/site settings.
       */
    }

    /* =================================================
       SHOW BROWSER NOTIFICATION
    ================================================= */

    const showBrowserNotification = ({
      title,
      body,
      data = {},
    }) => {
      if (!("Notification" in window)) {
        console.log(
          "⚠️ Browser does not support notifications.",
        );

        return;
      }

      if (
        Notification.permission !==
        "granted"
      ) {
        console.log(
          "⚠️ Browser notification permission is not granted.",
        );

        return;
      }

      try {
        const browserNotification =
          new Notification(
            title || "EduGuard",
            {
              body:
                body ||
                "You have a new notification.",

              icon: "/school-logo.webp",

              data,
            },
          );

        browserNotification.onclick =
          () => {
            window.focus();

            window.dispatchEvent(
              new CustomEvent(
                "eduguard:notification-click",
                {
                  detail: data,
                },
              ),
            );

            browserNotification.close();
          };

        console.log(
          "🔔 GLOBAL BROWSER NOTIFICATION SHOWN",
        );
      } catch (error) {
        console.error(
          "❌ Browser notification error:",
          error,
        );
      }
    };

    /* =================================================
       PLAY NOTIFICATION SOUND
    ================================================= */

    const playNotificationSound = () => {
      if (!notifSound.current) {
        console.log(
          "⚠️ Notification audio element unavailable.",
        );

        return;
      }

      try {
        const audio =
          notifSound.current;

        audio.currentTime = 0;
        audio.volume = 1;

        const playPromise =
          audio.play();

        if (
          playPromise &&
          typeof playPromise.then ===
            "function"
        ) {
          playPromise
            .then(() => {
              audioUnlockedRef.current =
                true;

              console.log(
                "🔊 GLOBAL NOTIFICATION SOUND PLAYED",
              );
            })
            .catch((error) => {
              console.log(
                "🔇 Notification sound blocked by browser:",
                error,
              );

              /*
               * If audio was blocked, we don't throw.
               * The audio will be unlocked after the
               * user's next interaction.
               */
            });
        }
      } catch (error) {
        console.log(
          "🔇 Notification sound error:",
          error,
        );
      }
    };

    /* =================================================
       DISPATCH GLOBAL NOTIFICATION

       Every page can listen to this event.

       Example:

       window.addEventListener(
         "eduguard:new-notification",
         handler
       );
    ================================================= */

    const dispatchGlobalNotification =
      (notification) => {
        if (!notification) {
          return;
        }

        window.dispatchEvent(
          new CustomEvent(
            "eduguard:new-notification",
            {
              detail: notification,
            },
          ),
        );

        console.log(
          "📡 GLOBAL NOTIFICATION EVENT DISPATCHED:",
          notification,
        );
      };

    /* =================================================
       SOCKET CONNECT
    ================================================= */

    const handleConnect = () => {

      /*
       * Register user.
       *
       * Your backend may use this for online-user
       * tracking.
       */
      socket.emit(
        "register",
        currentUserId,
      );

      /*
       * Join the user's private notification room.
       *
       * Backend:
       *
       * io.to(String(userId)).emit(...)
       */
      socket.emit(
        "join",
        currentUserId,
      );

    };

    /* =================================================
       SOCKET DISCONNECT
    ================================================= */

    const handleDisconnect = (
      reason,
    ) => {
      console.log(
        "🔴 GLOBAL SOCKET DISCONNECTED:",
        reason,
      );
    };

    /* =================================================
       SOCKET CONNECT ERROR
    ================================================= */

    const handleConnectError = (
      error,
    ) => {
      console.error(
        "❌ GLOBAL SOCKET CONNECTION ERROR:",
        error,
      );
    };

    /* =================================================
       RECEIVE CHAT MESSAGE
    ================================================= */

    const handleReceiveMessage = (
      msg,
    ) => {
      if (!msg) {
        return;
      }

      console.log(
        "====================================",
      );

      console.log(
        "🌐📩 GLOBAL MESSAGE RECEIVED",
      );

      console.log(
        "====================================",
      );

      console.log(
        "Message:",
        msg,
      );

      const senderId =
        String(
          msg.sender?._id ||
            msg.sender ||
            "",
        );

      const receiverId =
        String(
          msg.receiver?._id ||
            msg.receiver ||
            "",
        );

      /* =================================================
         ONLY PROCESS MESSAGES FOR CURRENT USER
      ================================================= */

      if (
        receiverId !==
        currentUserId
      ) {
        console.log(
          "⏭️ Message is not for current user.",
        );

        return;
      }

      /* =================================================
         DON'T NOTIFY OWN MESSAGE
      ================================================= */

      if (
        senderId ===
        currentUserId
      ) {
        console.log(
          "⏭️ Ignoring own message.",
        );

        return;
      }

      const senderName =
        msg.senderName ||
        msg.sender?.name ||
        msg.sender?.firstName ||
        msg.name ||
        "New Message";

      const senderPhoto =
        msg.senderProfilePhoto ||
        msg.sender?.profilePhoto ||
        msg.profilePhoto ||
        null;

      const messageText =
        msg.text ||
        msg.message ||
        "You have received a new message.";

      const notificationId =
        msg._id ||
        msg.id ||
        msg.clientMessageId ||
        `message-${senderId}-${Date.now()}`;

      const notification = {
        id: notificationId,
        _id: notificationId,

        type: "message",

        title:
          `New message from ${senderName}`,

        message: messageText,

        text: messageText,

        senderId,

        senderName,

        senderProfilePhoto:
          senderPhoto,

        priority: "low",

        isRead: false,

        createdAt:
          msg.createdAt ||
          new Date().toISOString(),

        relatedId:
          msg._id ||
          null,

        relatedType: "Message",

        data: {
          type: "message",

          senderId,

          senderName,

          senderProfilePhoto:
            senderPhoto,

          messageId:
            msg._id ||
            msg.clientMessageId ||
            null,

          chatId:
            msg.chatId ||
            [
              currentUserId,
              senderId,
            ]
              .sort()
              .join("-"),
        },
      };

      console.log(
        "🔔 GLOBAL MESSAGE NOTIFICATION:",
        notification,
      );

      /* =================================================
         SOUND
      ================================================= */

      playNotificationSound();

      /* =================================================
         BROWSER NOTIFICATION
      ================================================= */

      showBrowserNotification({
        title:
          notification.title,

        body:
          messageText,

        data:
          notification.data,
      });

      /* =================================================
         GLOBAL EVENT
      ================================================= */

      dispatchGlobalNotification(
        notification,
      );

      /* =================================================
         SPECIFIC MESSAGE EVENT
      ================================================= */

      window.dispatchEvent(
        new CustomEvent(
          "eduguard:new-message",
          {
            detail:
              notification,
          },
        ),
      );

      console.log(
        "📡 GLOBAL MESSAGE EVENTS DISPATCHED",
      );
    };

    /* =================================================
       GENERIC SOCKET NOTIFICATION

       This receives notifications created by:

       createNotification({
         userId,
         ...
         io
       })

       Backend emits:

       io.to(String(userId)).emit(
         "newNotification",
         ...
       )
    ================================================= */

    const handleNewNotification =
      (data) => {
        if (!data) {
          return;
        }

        console.log(
          "====================================",
        );

        console.log(
          "📩 GLOBAL SOCKET NOTIFICATION RECEIVED",
        );

        console.log(
          "====================================",
        );

        console.log(
          "Notification:",
          data,
        );

        /* =================================================
           SECURITY CHECK

           Only accept notifications explicitly intended
           for this user's room if user information is
           included in the payload.

           Normally the backend room already guarantees
           this.
        ================================================= */

        if (
          data.user &&
          String(
            data.user?._id ||
              data.user,
          ) !== currentUserId
        ) {
          console.log(
            "⏭️ Socket notification is not for current user.",
          );

          return;
        }

        /* =================================================
           MESSAGE DUPLICATION

           Messages are handled by receive_message.
        ================================================= */

        if (
          data.type === "message" ||
          data.notificationType ===
            "message"
        ) {
          console.log(
            "⏭️ Message notification ignored here because receive_message handles it.",
          );

          return;
        }

        const notification = {
          _id:
            data._id ||
            data.id ||
            `notification-${Date.now()}`,

          id:
            data._id ||
            data.id ||
            `notification-${Date.now()}`,

          title:
            data.title ||
            "EduGuard",

          message:
            data.message ||
            data.body ||
            "You have a new notification.",

          type:
            data.type ||
            "general",

          notificationType:
            data.notificationType ||
            data.type ||
            "general",

          priority:
            data.priority ||
            "low",

          isRead:
            data.isRead ||
            false,

          relatedId:
            data.relatedId ||
            null,

          relatedType:
            data.relatedType ||
            null,

          createdAt:
            data.createdAt ||
            new Date().toISOString(),

          data:
            data.data ||
            {},
        };

        /* =================================================
           SOUND
        ================================================= */

        playNotificationSound();

        /* =================================================
           BROWSER NOTIFICATION
        ================================================= */

        showBrowserNotification({
          title:
            notification.title,

          body:
            notification.message,

          data:
            notification.data,
        });

        /* =================================================
           GLOBAL EVENT
        ================================================= */

        dispatchGlobalNotification(
          notification,
        );
      };

    /* =================================================
       SOCKET EVENTS
    ================================================= */

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "disconnect",
      handleDisconnect,
    );

    socket.on(
      "connect_error",
      handleConnectError,
    );

    socket.on(
      "receive_message",
      handleReceiveMessage,
    );

    socket.on(
      "newNotification",
      handleNewNotification,
    );

    /* =================================================
       WEB FCM

       Keep this for the web admin.

       Socket.IO handles realtime system notifications.
       FCM handles browser push/background notifications.
    ================================================= */

    if (
      String(user.role || "").toLowerCase() ===
      "admin"
    ) {
      console.log(
        "👑 Admin detected - registering Web FCM...",
      );

      try {
        const token =
          await registerWebFCM();

        if (token) {
          console.log(
            "✅ GLOBAL ADMIN FCM REGISTERED",
          );
        } else {
          console.log(
            "⚠️ FCM registration returned no token.",
          );
        }
      } catch (error) {
        console.error(
          "❌ Web FCM registration failed:",
          error,
        );
      }

      /* =================================================
         FCM FOREGROUND LISTENER
      ================================================= */

      try {
        const messaging =
          await getFirebaseMessaging();

        if (messaging) {
          console.log(
            "👂 GLOBAL FCM FOREGROUND LISTENER ACTIVE",
          );

          unsubscribeFCM =
            onMessage(
              messaging,
              (payload) => {
                console.log(
                  "====================================",
                );

                console.log(
                  "🌐📩 GLOBAL FCM RECEIVED",
                );

                console.log(
                  "Payload:",
                  payload,
                );

                console.log(
                  "====================================",
                );

                const title =
                  payload
                    ?.notification
                    ?.title ||
                  payload
                    ?.data
                    ?.title ||
                  "EduGuard";

                const body =
                  payload
                    ?.notification
                    ?.body ||
                  payload
                    ?.data
                    ?.body ||
                  "You have a new notification.";

                const notification = {
                  _id:
                    payload
                      ?.data
                      ?.notificationId ||
                    `fcm-${Date.now()}`,

                  id:
                    payload
                      ?.data
                      ?.notificationId ||
                    `fcm-${Date.now()}`,

                  type:
                    payload
                      ?.data
                      ?.type ||
                    "general",

                  title,

                  message: body,

                  priority:
                    payload
                      ?.data
                      ?.priority ||
                    "low",

                  isRead: false,

                  relatedId:
                    payload
                      ?.data
                      ?.relatedId ||
                    null,

                  relatedType:
                    payload
                      ?.data
                      ?.relatedType ||
                    null,

                  createdAt:
                    new Date().toISOString(),

                  data:
                    payload
                      ?.data ||
                    {},
                };

                /* =======================================
                   SOUND
                ======================================= */

                playNotificationSound();

                /* =======================================
                   BROWSER
                ======================================= */

                showBrowserNotification({
                  title,

                  body,

                  data:
                    payload
                      ?.data ||
                    {},
                });

                /* =======================================
                   GLOBAL EVENT
                ======================================= */

                dispatchGlobalNotification(
                  notification,
                );

                console.log(
                  "📡 GLOBAL FCM EVENT DISPATCHED",
                );
              },
            );
        } else {
          console.log(
            "❌ Firebase Messaging unavailable.",
          );
        }
      } catch (error) {
        console.error(
          "❌ FCM foreground listener failed:",
          error,
        );
      }
    } else {
      console.log(
        "ℹ️ Web FCM skipped - user is not admin.",
      );
    }

    /* =================================================
       CONNECT SOCKET
    ================================================= */

    if (!socket.connected) {
      console.log(
        "🔌 Connecting GLOBAL notification socket...",
      );

      socket.connect();
    } else {
      /*
       * If the socket was already connected, manually
       * register/join the current user.
       */
      handleConnect();
    }
  } catch (error) {
    console.error(
      "❌ GLOBAL NOTIFICATION ERROR:",
      error,
    );

    initializedRef.current =
      false;
  }
};

initialize();

/* =====================================================
   CLEANUP
===================================================== */

return () => {
  console.log(
    "🧹 Cleaning global notification system...",
  );

  if (unsubscribeFCM) {
    unsubscribeFCM();
    unsubscribeFCM = null;
  }

  socket.off("connect");
  socket.off("disconnect");
  socket.off("connect_error");
  socket.off("receive_message");
  socket.off("newNotification");

  if (socket.connected) {
    socket.disconnect();
  }

  currentUserIdRef.current =
    null;

  if (notifSound.current) {
    try {
      notifSound.current.pause();
      notifSound.current.currentTime =
        0;
      notifSound.current.src = "";
    } catch (error) {
      console.log(
        "⚠️ Notification audio cleanup error:",
        error,
      );
    }
  }

  notifSound.current = null;

  audioUnlockedRef.current =
    false;

  initializedRef.current =
    false;
};

}, []);

return null;
};

export default GlobalNotifications;
