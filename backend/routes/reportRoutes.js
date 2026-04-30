import express from "express";
import Report from "../models/reportModel.js";
import Student from "../models/studentModel.js"; // ✅ FIX MISSING IMPORT
import { verifyToken } from "../middleware/verifyToken.js";
import { io } from "../server.js";

const router = express.Router();

// CREATE REPORT (FIXED)
router.post("/", async (req, res) => {
  try {
    const { studentId, reporterId } = req.body;

    if (!studentId || !reporterId) {
      return res.status(400).json({
        message: "studentId and reporterId are required",
      });
    }

    const report = await Report.create(req.body);

    io.emit("new-report", report);

    res.status(201).json(report);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ message: err.message });
  }
});

// GET reports
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 5, status, search } = req.query;

    let query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { offense: { $regex: search, $options: "i" } },
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
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ACCEPT
router.put("/:id/accept", async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    io.emit("update-report", report);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REJECT
router.put("/:id/reject", async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    io.emit("update-report", report);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MY REPORTS (FIXED)
router.get("/my", verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const reports = await Report.find({
      studentId: student._id,
    }).sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.log("MY REPORT ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;