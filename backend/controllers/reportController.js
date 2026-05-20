// backend/controllers/reportController.js
import Report from "../models/reportModel.js"; // make sure your model file is Report.js
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Notification from "../models/Notification.js";
import { io } from "../server.js";


const BASE_URL = "https://edu-guard-backend.onrender.com";

// GET all reports by type
export const getReportsByType = async (req, res) => {
  const { type } = req.params;
  try {
    const reports = await Report.find({ type });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a new report
export const createReport = async (req, res) => {
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

    const files = req.files || [];

    console.log("BODY:", req.body);
    console.log("FILES:", files);

    if (files.length === 0) {
      return res.status(400).json({ message: "No evidence uploaded via multer" });
    }

    const evidence = files.map((file) => ({
  url: file.path, // ✅ Cloudinary URL
  type: file.mimetype.startsWith("image") ? "image" : "document",
  uploadedAt: new Date(),
}));

    const report = await Report.create({
      studentId,
      studentName,
      offense,
      location,
      description,
      date: new Date(date),
      time,
      reporter: reporter || "Guest",
      reporterId: req.userId || null,
      reporterType: req.userId ? "student" : "guest",
      evidence,
    });

    let targetUserId = null;

if (report.studentId) {
  const student = await Student.findById(report.studentId);

  if (student) {
    const user = await User.findOne({ studentId: student.studentId });

    if (user) targetUserId = user._id;
  }
}

if (report.teacherId && !targetUserId) {
  const teacherUser = await User.findOne({ teacherId: report.teacherId });
  if (teacherUser) targetUserId = teacherUser._id;
}

if (targetUserId) {
  await Notification.create({
    userId: targetUserId,
    title: "Report Notification",
    message: `You have a report involving "${report.offense}".`,
    type: "warning",
    priority: "high",
  });

  io.to(targetUserId.toString()).emit("newNotification", {
    id: Date.now(),
    title: "Report Notification",
    message: `You have a report involving "${report.offense}".`,
    type: "warning",
    priority: "high",
    isRead: false,
    timeAgo: "Just now",
  });
}

io.to("dashboard").emit("newNotification", {
  id: report._id,
  title: "New Report Submitted",
  message: `${report.studentName} submitted a report about "${report.offense}"`,
  type: "info",
  priority: "high",
  isRead: false,
  createdAt: new Date().toISOString(),
});

    return res.status(201).json(report);
  } catch (err) {
    console.error("CREATE REPORT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const createGuestReport = async (req, res) => {
  try {
    console.log("🔥 GUEST REPORT HIT");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

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

    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        message: "No evidence uploaded via multer",
      });
    }

    const evidence = files.map((file) => ({
      url: file.path,
      type: file.mimetype.startsWith("image") ? "image" : "document",
      uploadedAt: new Date(),
    }));

    const newReport = await Report.create({
      studentId: studentId || null,
      studentName,
      offense,
      location,
      description,
      date: new Date(date),
      time,
      reporter: reporter || "Guest",
      reporterId: null,            // ✅ always null for guest
      reporterType: "guest",
      evidence,
    });

    return res.status(201).json({
      message: "Guest report submitted successfully",
      report: newReport,
    });

  } catch (err) {
    console.error("GUEST REPORT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// DELETE a report (optional)
export const deleteReport = async (req, res) => {
  const { id } = req.params;
  try {
    await Report.findByIdAndDelete(id);
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const userId = req.userId;

    const reports = await Report.find({
      reporterId: userId, // ✅ THIS IS THE FIX
    }).sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    console.error("Get My Reports Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("studentId", "name");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("studentId", "name section age gender")
      .populate("reporterId", "firstName lastName name email")
      .populate({
    path: "incidentId",   // or whatever your field is
    select: "status"
  })
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};