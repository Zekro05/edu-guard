import express from "express";

import {
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getProfile,
  updateProfilePhone,

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

router.get("/profile", verifyToken, getProfile);

router.put(
  "/profile/phone",
  verifyToken,
  updateProfilePhone
);
/* =========================================================
   SECURITY SETTINGS
========================================================= */

router.get(
  "/security",
  verifyToken,
  getSecuritySettings
);

router.put(
  "/security",
  verifyToken,
  updateSecuritySettings
);

export default router;
