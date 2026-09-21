import Message from "../models/message.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../utils/createNotification.js";

import { io } from "../server.js";
import { User } from "../models/userModel.js";

import { sendPushNotification } from "../services/notificationService.js";
import { sendWebPushNotification } from "../utils/webPushNotification.js";

/* =========================================================
   CREATE CHAT ID
========================================================= */

const createChatId = (a, b) => {
  return [String(a), String(b)].sort().join("-");
};

/* =========================================================
   SEND MESSAGE
========================================================= */

export const sendMessage = async (req, res) => {
  try {
    const {
      sender,
      receiver,
      text,
      clientMessageId,
    } = req.body;

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!sender || !receiver || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Missing sender, receiver, or message text.",
      });
    }

    /* =====================================================
       CHAT ID
    ===================================================== */

    const chatId = createChatId(
      sender,
      receiver,
    );

    /* =====================================================
       GET SENDER
    ===================================================== */

    const senderUser = await User.findById(
      sender,
    ).select(
      "name firstName middleName lastName email profilePhoto role",
    );

    if (!senderUser) {
      return res.status(404).json({
        success: false,
        message: "Sender account not found.",
      });
    }

    /* =====================================================
       GET RECEIVER

       IMPORTANT:
       Get pushTokens because both Expo and Web FCM
       tokens are stored inside this array.
    ===================================================== */

    const receiverUser = await User.findById(
      receiver,
    ).select(
      "email name firstName middleName lastName profilePhoto role pushTokens",
    );

    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: "Receiver account not found.",
      });
    }

    /* =====================================================
       SENDER NAME
    ===================================================== */

    const senderName =
      senderUser.name ||
      [
        senderUser.firstName,
        senderUser.middleName,
        senderUser.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "User";

    /* =====================================================
       SAVE MESSAGE
    ===================================================== */

    const message = await Message.create({
      chatId,

      sender,

      receiver,

      text: text.trim(),

      seen: false,
    });

    console.log(
      "💾 Message saved:",
      message._id.toString(),
    );

    /* =====================================================
       CREATE ONE DATABASE NOTIFICATION

       IMPORTANT:
       Only create this ONCE.

       Your previous controller created two
       notifications for every message.
    ===================================================== */

    const notification = await Notification.create({
      user: receiver,

      title: `New message from ${senderName}`,

      message: text.trim(),

      type: "message",

      priority: "low",

      isRead: false,

      relatedId: message._id,

      relatedType: "Message",
    });

    console.log(
      "🔔 Message notification saved:",
      notification._id.toString(),
      "for",
      receiverUser.email,
    );

    /* =====================================================
       NOTIFICATION DATA
    ===================================================== */

    const notificationData = {
      type: "message",

      chatId,

      senderId: String(sender),

      receiverId: String(receiver),

      messageId: message._id.toString(),

      notificationId: notification._id.toString(),

      senderName,

      senderProfilePhoto:
        senderUser.profilePhoto || "",
    };

    /* =====================================================
       REALTIME MESSAGE
    ===================================================== */

    const realtimeMessage = {
      ...message.toObject(),

      _id: message._id.toString(),

      sender: String(sender),

      receiver: String(receiver),

      senderName,

      senderProfilePhoto:
        senderUser.profilePhoto || null,

      clientMessageId:
        clientMessageId || null,
    };

    /* =====================================================
       SEND ACTUAL MESSAGE TO RECEIVER

       This is for the chat screen.
    ===================================================== */

    io.to(String(receiver)).emit(
      "receive_message",
      realtimeMessage,
    );

    console.log(
      "📩 receive_message sent to:",
      receiver,
    );

    /* =====================================================
       SEND MESSAGE BACK TO SENDER

       Keeps sender's chat synchronized.
    ===================================================== */

    io.to(String(sender)).emit(
      "receive_message",
      realtimeMessage,
    );

    /* =====================================================
       REALTIME NOTIFICATION

       This is for GlobalNotifications.jsx.

       IMPORTANT:
       The receiver must be inside their user room.
    ===================================================== */

    io.to(String(receiver)).emit(
      "newNotification",
      {
        ...notification.toObject(),

        id: notification._id.toString(),

        senderName,

        senderProfilePhoto:
          senderUser.profilePhoto || null,

        data: notificationData,
      },
    );

    console.log(
      "🔔 GLOBAL MESSAGE NOTIFICATION SENT TO:",
      receiver,
    );

    /* =====================================================
       GET ALL PUSH TOKENS
    ===================================================== */

    const pushTokens = Array.isArray(
      receiverUser.pushTokens,
    )
      ? receiverUser.pushTokens
      : [];

    /* =====================================================
       GET EXPO MOBILE TOKENS

       Android + iOS
    ===================================================== */

    const expoTokens = pushTokens.filter(
      (pushToken) =>
        pushToken?.provider === "expo" &&
        ["android", "ios"].includes(
          pushToken?.platform,
        ) &&
        pushToken?.token,
    );

    /* =====================================================
       GET WEB FCM TOKENS

       Browser / Desktop
    ===================================================== */

    const webTokens = pushTokens.filter(
      (pushToken) =>
        pushToken?.provider === "fcm" &&
        pushToken?.platform === "web" &&
        pushToken?.token,
    );

    console.log(
      `📱 Expo message tokens for ${receiverUser.email}:`,
      expoTokens.length,
    );

    console.log(
      `🌐 Web FCM message tokens for ${receiverUser.email}:`,
      webTokens.length,
    );

    /* =====================================================
       SEND EXPO PUSH

       Android + iOS
    ===================================================== */

    for (const pushToken of expoTokens) {
      try {
        await sendPushNotification({
          token: pushToken.token,

          title: `💬 ${senderName}`,

          body: text.trim(),

          data: notificationData,
        });

        console.log(
          "📱 Message Expo push sent to:",
          receiverUser.email,
        );
      } catch (pushError) {
        console.error(
          `⚠️ MESSAGE EXPO PUSH ERROR (${receiverUser.email}):`,
          pushError,
        );
      }
    }

    /* =====================================================
       SEND WEB FCM PUSH

       Desktop / Browser

       THIS WAS MISSING FROM YOUR OLD CONTROLLER.
    ===================================================== */

    for (const pushToken of webTokens) {
      try {
        await sendWebPushNotification({
          token: pushToken.token,

          title: `💬 ${senderName}`,

          body: text.trim(),

          data: notificationData,
        });

        console.log(
          "🌐 Message Web FCM push sent to:",
          receiverUser.email,
        );
      } catch (webPushError) {
        console.error(
          `⚠️ MESSAGE WEB FCM PUSH ERROR (${receiverUser.email}):`,
          webPushError,
        );
      }
    }

    /* =====================================================
       NO PUSH TOKENS
    ===================================================== */

    if (
      expoTokens.length === 0 &&
      webTokens.length === 0
    ) {
      console.log(
        `⚠️ Receiver has no registered push tokens: ${receiverUser.email}`,
      );
    }

    /* =====================================================
       ACTIVITY FEED
    ===================================================== */

    io.emit("activity_feed", {
      type: "message",

      message: `💬 ${senderName}: ${text.trim()}`,

      time: new Date(),
    });

    console.log(
      "🔥 Activity feed emitted",
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,

      message: realtimeMessage,

      notification: {
        id: notification._id,

        type: notification.type,
      },
    });
  } catch (err) {
    console.error(
      "❌ SEND MESSAGE ERROR:",
      err,
    );

    return res.status(500).json({
      success: false,

      message:
        process.env.NODE_ENV === "production"
          ? "Failed to send message."
          : err.message,
    });
  }
};

/* =========================================================
   GET MESSAGES
========================================================= */

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({
      chatId,
    }).sort({
      createdAt: 1,
    });

    return res.json({
      success: true,

      messages,
    });
  } catch (err) {
    console.error(
      "❌ GET MESSAGES ERROR:",
      err,
    );

    return res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!chatId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and user ID are required.",
      });
    }

    const result = await Message.updateMany(
      {
        chatId,
        receiver: String(userId),
        seen: false,
      },
      {
        $set: {
          seen: true,
        },
      }
    );

    console.log(
      `👁️ Messages marked as seen in ${chatId}:`,
      result.modifiedCount
    );

    return res.json({
      success: true,
      markedAsSeen: result.modifiedCount,
    });
  } catch (err) {
    console.error(
      "❌ MARK MESSAGES AS SEEN ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================================================
   GET CONVERSATIONS
========================================================= */

export const getConversations = async (
  req,
  res,
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,

        message: "User ID is required.",
      });
    }

    const conversations =
      await Message.aggregate([
        {
          $match: {
            $or: [
              {
                sender: userId,
              },

              {
                receiver: userId,
              },
            ],
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $group: {
            _id: "$chatId",

            lastMessage: {
              $first: "$text",
            },

            lastTime: {
              $first: "$createdAt",
            },

            sender: {
              $first: "$sender",
            },

            receiver: {
              $first: "$receiver",
            },
          },
        },

        {
          $sort: {
            lastTime: -1,
          },
        },
      ]);

    return res.json({
      success: true,

      conversations,
    });
  } catch (err) {
    console.error(
      "❌ GET CONVERSATIONS ERROR:",
      err,
    );

    return res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

