import express from "express";
import Message from "../models/message.js";

const router = express.Router();

/* SEND MESSAGE (REST fallback) */
router.post("/", async (req, res) => {
  try {
    const { sender, receiver, text, file } = req.body;

    const chatId = [sender, receiver].sort().join("-");

    const message = await Message.create({
      chatId,
      sender,
      receiver,
      text,
      file,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET CHAT HISTORY */
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

/* GET CONVERSATIONS */
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
        },
      },
      {
        $project: {
          conversationId: "$_id",
          lastMessage: 1,
          lastTime: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;