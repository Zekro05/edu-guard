import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", sendMessage);
router.get("/:chatId", getMessages);
router.get("/conversations/:userId", getConversations);

export default router;