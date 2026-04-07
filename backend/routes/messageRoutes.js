import express from "express";
import Message from "../models/message.js";

const router = express.Router();


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
// ✅ GET CONVERSATIONS (FIX FOR YOUR ERROR)
// =========================
router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$chatId",
          lastMessage: { $first: "$message" },
          lastTime: { $first: "$createdAt" },
          senderId: { $first: "$senderId" },
          receiverId: { $first: "$receiverId" },
        },
      },
      {
        $project: {
          conversationId: "$_id",
          lastMessage: 1,
          lastTime: 1,
          senderId: 1,
          receiverId: 1,
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

export default router;