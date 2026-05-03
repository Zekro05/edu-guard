import express from "express";
import Report from "../models/reportModel.js";
import Incident from "../models/incidentModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { io } from "../server.js";
import {
  getMyReports,
} from "../controllers/reportController.js";

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
      return res.status(400).json({ message: "Missing required fields" });
    }

    const report = await Report.create({
      studentId,
      studentName,
      offense,
      location,
      description,
      date,
      time,
      reporter,
      reporterId: req.userId,
      status: "pending",
    });

    io.emit("new-report", report);

    return res.status(201).json(report);
  } catch (err) {
    console.log("CREATE REPORT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

/* ================= GET REPORTS ================= */
router.get("/", verifyToken, async (req, res) => {
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
      .limit(Number(limit));

    const total = await Report.countDocuments(query);

    return res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ================= ACCEPT REPORT ================= */
router.put("/:id/accept", verifyToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = "accepted";
    await report.save();

    // ✅ Create linked incident
    const incident = await Incident.create({
      studentId: report.studentId,
      title: report.offense,
      date: report.date,
      category: report.offense,
      action: "Accepted",
      level: "Low",
      reportId: report._id, // 🔥 IMPORTANT FOR HISTORY LINKING
    });

    io.emit("report-updated", { report, incident });

    return res.json({ report, incident });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
});

/* ================= REJECT REPORT ================= */
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

    io.emit("report-updated", report);

    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ================= MY REPORTS ================= */
router.get("/my", verifyToken, getMyReports);

export default router;