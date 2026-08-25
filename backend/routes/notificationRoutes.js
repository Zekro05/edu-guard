import express from "express";
import Notification from "../models/Notification.js";
import { saveFCMToken } from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/verifyToken.js";



const router = express.Router();

router.post("/fcm-token", verifyToken, saveFCMToken);


/**
 * GET USER NOTIFICATIONS
 */
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    const formatted = notifications.map((n) => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      isRead: n.isRead,
      timeAgo: getTimeAgo(n.createdAt),
    }));

    res.json({ notifications: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * MARK AS READ
 */
router.put("/read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * CREATE NOTIFICATION (for testing/admin)
 */
router.post("/", async (req, res) => {
  try {
    const notif = await Notification.create(req.body);

    // emit real-time
    req.io.to(notif.userId).emit("newNotification", {
      id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      priority: notif.priority,
      isRead: false,
      timeAgo: "Just now",
    });

    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * TIME AGO HELPER
 */
function getTimeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return `${Math.floor(diff / 86400)} day(s) ago`;
}

export default router;