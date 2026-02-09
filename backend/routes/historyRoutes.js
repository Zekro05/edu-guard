import express from "express";
import HistoryLog from "../models/historyLogModel.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET ALL LOGS WITH FILTERS
router.get("/", verifyToken, async (req, res) => {
  try {
    const { category, role } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (role) filter.role = role;

    const logs = await HistoryLog.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

export default router;