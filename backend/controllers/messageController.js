import Message from "../models/message.js";
import { io } from "../server.js"; // ✅ IMPORT SOCKET
import { User } from "../models/userModel.js";
import { sendPushNotification } from "../utils/pushNotification.js";
/* CREATE CHAT ID */
const createChatId = (a, b) => [a, b].sort().join("-");

/* SEND MESSAGE */
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver || !text?.trim()) {
      return res.status(400).json({
        message: "Missing fields",
      });
    }

    const chatId = createChatId(sender, receiver);

    /* ================= SAVE MESSAGE ================= */

    const message = await Message.create({
      chatId,
      sender,
      receiver,
      text: text.trim(),
      seen: false,
    });

    console.log("💾 Message saved:", message._id);

    /* ================= GET SENDER ================= */

    const senderUser = await User.findById(sender).select(
      "name firstName lastName email"
    );

    const senderName =
      senderUser?.name ||
      `${senderUser?.firstName || ""} ${senderUser?.lastName || ""}`.trim() ||
      "User";

    /* ================= GET RECEIVER ================= */

    const receiverUser = await User.findById(receiver).select(
      "expoPushToken email name firstName lastName"
    );

    if (!receiverUser) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    /* ================= LIVE MESSAGE ================= */

    io.to(String(receiver)).emit(
      "receive_message",
      message
    );

    console.log(
      "📩 receive_message sent to:",
      receiver
    );

    /* ================= MESSAGE NOTIFICATION ================= */

    io.to(String(receiver)).emit("newNotification", {
      id: Date.now(),
      title: `New message from ${senderName}`,
      message: text.trim(),
      type: "message",
      priority: "medium",
      isRead: false,
      createdAt: new Date().toISOString(),
      data: {
        type: "message",
        chatId,
        senderId: sender,
        receiverId: receiver,
        messageId: message._id.toString(),
      },
    });

    /* ================= PHONE PUSH NOTIFICATION ================= */

    if (receiverUser.expoPushToken) {
      try {
        await sendPushNotification({
          token: receiverUser.expoPushToken,
          title: `💬 ${senderName}`,
          body: text.trim(),
          data: {
            type: "message",
            chatId,
            senderId: sender,
            receiverId: receiver,
            messageId: message._id.toString(),
          },
        });

        console.log(
          "📱 Message push notification sent to:",
          receiverUser.email
        );
      } catch (pushError) {
        console.error(
          "⚠️ MESSAGE PUSH ERROR:",
          pushError.message
        );
      }
    } else {
      console.log(
        "⚠️ Receiver has no Expo push token:",
        receiverUser.email
      );
    }

    /* ================= ACTIVITY FEED ================= */

    io.emit("activity_feed", {
      type: "message",
      message: `💬 ${senderName}: ${text.trim()}`,
      time: new Date(),
    });

    console.log("🔥 Activity feed emitted");

    return res.status(201).json(message);

  } catch (err) {
    console.error("❌ SEND MESSAGE ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* GET MESSAGES */
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET CONVERSATIONS (RN + WEB COMPATIBLE) */
export const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$chatId",
          lastMessage: { $first: "$text" },
          lastTime: { $first: "$createdAt" },
          sender: { $first: "$sender" },
          receiver: { $first: "$receiver" },
        },
      },
    ]);

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
