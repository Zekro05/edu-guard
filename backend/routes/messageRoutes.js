import express from "express";
import Message from "../models/message.js";

const router = express.Router();

// =========================
// ✅ SEND MESSAGE
// =========================
router.post("/", async (req, res) => {
  try {
    const { chatId, sender, receiver, text, file } = req.body;

    const newMessage = new Message({
      chatId,
      sender,
      receiver,
      text,
      file,
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/conversations/:userId", async (req, res) => {
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
      {
        $project: {
          conversationId: "$_id",
          lastMessage: 1,
          lastTime: 1,
          sender: 1,
          receiver: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ conversations });
  } catch (err) {
    console.log("Conversation Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// =========================
// ✅ GET CHAT HISTORY
// =========================
router.get("/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({
      chatId: req.params.chatId,
    }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================
// ✅ GET CONVERSATIONS
// =========================


export default router;