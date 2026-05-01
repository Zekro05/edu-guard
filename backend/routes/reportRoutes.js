import express from "express";
import Report from "../models/reportModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { io } from "../server.js";
import { getMyReports } from "../controllers/reportController.js";

const router = express.Router();

/* ================= CREATE REPORT ================= */
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,
      reporter,
    } = req.body;

    if (!studentId || !studentName || !description || !location) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const report = await Report.create({
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,

      // ✅ FIX: logged-in user is reporter
      reporter,
      reporterId: req.userId,
    });

    io.emit("new-report", report);

    return res.status(201).json(report);
  } catch (err) {
    console.log("REPORT ERROR:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

/* ================= GET REPORTS ================= */
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

router.put("/:id/accept", verifyToken, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.put("/:id/reject", verifyToken, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/my", verifyToken, getMyReports);


export default router;