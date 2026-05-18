import express from "express";
import mongoose from "mongoose";
import Report from "../models/reportModel.js";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { io } from "../server.js";
import { getMyReports, getReports, createReport } from "../controllers/reportController.js";
import { getDisciplineAction } from "../utils/disciplineEngine.js";
import { upload } from "../middleware/upload.js";
import Notification from "../models/Notification.js";

const router = express.Router();

/* ================= CREATE REPORT (CLEAN JSON ONLY) ================= */
router.post(
  "/",
  upload.array("evidence", 10),
  createReport
);
/* ================= GET MY REPORTS ================= */
router.get("/my", verifyToken, getMyReports);

/* ================= GET ALL REPORTS ================= */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 100, status, search } = req.query;

    let query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { offense: { $regex: search, $options: "i" } },
      ];
    }

    const reports = await Report.find(query)
      .populate("studentId", "name section age gender")
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

/* ================= GET REPORT BY ID ================= */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await Report.findById(id).populate(
      "studentId",
      "name grade"
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    console.error("GET report by ID error:", err);
    res.status(500).json({ message: err.message });
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

    const studentId = report.studentId;

    const totalOffenses = await Report.countDocuments({ studentId });

    const highCount = await Report.countDocuments({
      studentId,
      offense: /fighting|assault|violence/i,
    });

    const mediumCount = await Report.countDocuments({
      studentId,
      offense: /bullying|cheating|disrespect/i,
    });

    const decision = getDisciplineAction({
      offenseCount: totalOffenses,
      hasHigh: highCount,
      hasMedium: mediumCount,
      offense: report.offense,
    });

    await Incident.create({
      studentId,
      reportId: report._id,
      title: report.offense,
      category: report.offense,
      action: decision.action,
      level: decision.level,
      status: "received",
      evidence: report.evidence || [],
    });

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents: totalOffenses,
      riskLevel: decision.level,
    });

    await Notification.create({
  userId: report.studentId,
  title: "Report Accepted",
  message: `Your report "${report.offense}" was approved`,
  type: "success",
  priority: "low",
});

    io.to(studentId.toString()).emit("newNotification", {
  id: report._id,
  title: "Report Accepted",
  message: `Your report "${report.offense}" was approved`,
  type: "success",
  priority: "low",
  isRead: false,
  timeAgo: "Just now",
});


    return res.json({
      message: "Report accepted & processed by Discipline Engine",
      decision,
    });

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

    io.to(report.studentId.toString()).emit("newNotification", {
      id: report._id,
      title: "Report Rejected",
      message: `Your report "${report.offense}" was rejected`,
      type: "error",
      priority: "high",
      isRead: false,
      timeAgo: "Just now",
    });


    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET REPORTS (controller) ================= */
router.get("/reports", getReports);

export default router;