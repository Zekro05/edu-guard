import express from "express";
import Message from "../models/message.js";

const router = express.Router();

// GET CHAT HISTORY
router.get("/:chatId", async (req, res) => {
  const messages = await Message.find({
    chatId: req.params.chatId
  }).sort({ createdAt: 1 });

  res.json(messages);
});

export default router;