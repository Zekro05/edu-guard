import express from "express";
import Report from "../models/reportModel.js";
import { io } from "../server.js";

const router = express.Router();

// CREATE REPORT (MOBILE)
router.post("/", async (req, res) => {
  try {
    const report = await Report.create(req.body);

    io.emit("new-report", report); // 🔥 REAL-TIME

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET REPORTS (SEARCH + PAGINATION)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 5, status, search } = req.query;

    let query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { offense: { $regex: search, $options: "i" } }
      ];
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT
router.put("/:id/accept", async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    io.emit("update-report", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REJECT
router.put("/:id/reject", async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    io.emit("update-report", updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;