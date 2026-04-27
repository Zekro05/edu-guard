import express from "express";
import Activity from "../models/activityModel.js";

const router = express.Router();

/* GET ALL ACTIVITY (LATEST FIRST) */
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;