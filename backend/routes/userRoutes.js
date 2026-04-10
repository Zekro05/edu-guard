import express from "express";
import { User } from "../models/userModel.js";

const router = express.Router();

/**
 * GET ALL USERS EXCEPT CURRENT USER
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    console.log("GET /api/users hit, userId:", userId);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const users = await User.find({
      _id: { $ne: userId },
    }).select("-password -loginOTP -forgotPasswordOTP");

    return res.json({
      users,
    });
  } catch (err) {
    console.log("USER FETCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;