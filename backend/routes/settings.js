import express from "express";

import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/settingsController.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* =========================================================
   NOTIFICATION SETTINGS
========================================================= */

router.get(
  "/notifications",
  verifyToken,
  getNotificationSettings
);

router.put(
  "/notifications",
  verifyToken,
  updateNotificationSettings
);

export default router;