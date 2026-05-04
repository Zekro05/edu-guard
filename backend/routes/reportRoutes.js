import express from "express";
import mongoose from "mongoose";
import Report from "../models/reportModel.js";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { io } from "../server.js";
import { getMyReports, getReports } from "../controllers/reportController.js";


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

/* ================= GET MY REPORTS ================= */
router.get("/my", verifyToken, getMyReports);

/* ================= GET ALL REPORTS ================= */
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
      .populate("studentId", "name section age gender") // ✅ THIS FIXES N/A
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

/* ================= GET REPORT BY ID (FIXED SAFE ORDER) ================= */
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

    await Incident.create({
      studentId: report.studentId,
      reportId: report._id,
      title: report.offense,
      category: report.offense,
      action: "Accepted",
      level: "Low",
    });

    const totalIncidents = await Incident.countDocuments({
      studentId: report.studentId,
    });

    const highCount = await Incident.countDocuments({
      studentId: report.studentId,
      level: "High",
    });

    const medCount = await Incident.countDocuments({
      studentId: report.studentId,
      level: "Medium",
    });

    let riskLevel = "Low";
    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(report.studentId, {
      totalIncidents,
      riskLevel,
    });

    return res.json(report);
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

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/reports", getReports);

export default router;