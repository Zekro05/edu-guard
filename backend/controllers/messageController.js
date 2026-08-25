import Message from "../models/message.js";
import { io } from "../server.js";
import { User } from "../models/userModel.js";

/* =========================================================
   CREATE CHAT ID
========================================================= */

const createChatId = (a, b) => {
  return [String(a), String(b)]
    .sort()
    .join("-");
};

/* =========================================================
   SEND MESSAGE
========================================================= */

export const sendMessage = async (
  req,
  res,
) => {
  try {
    const {
      sender,
      receiver,
      text,
    } = req.body;

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !sender ||
      !receiver ||
      !text?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing sender, receiver, or message text.",
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

    const senderUser =
      await User.findById(sender).select(
        "name firstName middleName lastName email profilePhoto",
      );

    if (!senderUser) {
      return res.status(404).json({
        success: false,
        message:
          "Sender account not found.",
      });
    }

    /* =====================================================
       GET RECEIVER
    ===================================================== */

    const receiverUser =
      await User.findById(receiver).select(
        "email name firstName middleName lastName profilePhoto expoPushToken",
      );

    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message:
          "Receiver account not found.",
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

    const message =
      await Message.create({
        chatId,

        sender,

        receiver,

        text: text.trim(),

        seen: false,
      });

    console.log(
      "💾 Message saved:",
      message._id,
    );

    /* =====================================================
       REALTIME MESSAGE
    ===================================================== */

    const realtimeMessage = {
      ...message.toObject(),

      sender: String(sender),

      receiver: String(receiver),

      senderName,

      senderProfilePhoto:
        senderUser.profilePhoto ||
        null,
    };

    /* =====================================================
       SEND TO RECEIVER
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
       SEND BACK TO SENDER
    ===================================================== */

    io.to(String(sender)).emit(
      "receive_message",
      realtimeMessage,
    );

    /* =====================================================
       SOCKET NOTIFICATION
    ===================================================== */

    io.to(String(receiver)).emit(
      "newNotification",
      {
        id: Date.now(),

        title:
          `New message from ${senderName}`,

        message: text.trim(),

        type: "message",

        priority: "low",

        isRead: false,

        createdAt:
          new Date().toISOString(),

        data: {
          type: "message",

          chatId,

          senderId:
            String(sender),

          receiverId:
            String(receiver),

          messageId:
            message._id.toString(),
        },
      },
    );

    /* =====================================================
       ACTIVITY FEED
    ===================================================== */

    io.emit(
      "activity_feed",
      {
        type: "message",

        message:
          `💬 ${senderName}: ${text.trim()}`,

        time: new Date(),
      },
    );

    console.log(
      "🔥 Activity feed emitted",
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,

      message: realtimeMessage,
    });
  } catch (err) {
    console.error(
      "❌ SEND MESSAGE ERROR:",
      err,
    );

    return res.status(500).json({
      success: false,

      message:
        process.env.NODE_ENV ===
        "production"
          ? "Failed to send message."
          : err.message,
    });
  }
};

/* =========================================================
   GET MESSAGES
========================================================= */

export const getMessages = async (
  req,
  res,
) => {
  try {
    const {
      chatId,
    } = req.params;

    const messages =
      await Message.find({
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

      message:
        err.message,
    });
  }
};

/* =========================================================
   GET CONVERSATIONS
========================================================= */

export const getConversations =
  async (
    req,
    res,
  ) => {
    try {
      const {
        userId,
      } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
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
                $first:
                  "$createdAt",
              },

              sender: {
                $first:
                  "$sender",
              },

              receiver: {
                $first:
                  "$receiver",
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

        message:
          err.message,
      });
    }
  };