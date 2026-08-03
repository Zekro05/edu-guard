import express from "express";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getNotificationSettings);

router.put("/", verifyToken, updateNotificationSettings);

export default router;