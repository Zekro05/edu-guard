import express from "express";
import {
  testPushNotification,
} from "../controllers/pushNotificationController.js";

const router = express.Router();

router.post("/test", testPushNotification);

export default router;