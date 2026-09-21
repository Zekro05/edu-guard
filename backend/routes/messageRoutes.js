import express from "express";

import {
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsSeen,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", sendMessage);

router.get("/:chatId", getMessages);

router.get(
  "/conversations/:userId",
  getConversations
);

router.patch(
  "/:chatId/seen",
  markMessagesAsSeen
);

export default router;