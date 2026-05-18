// backend/controllers/reportController.js
import Report from "../models/reportModel.js"; // make sure your model file is Report.js
import Student from "../models/studentModel.js";

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

    const reporterId = req.userId || null;
    const reporterType = req.userId ? "user" : "guest";

    // 🚨 FORCE: ONLY MULTER FILES
    const files = req.files;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No evidence uploaded via multer" });
    }

    const evidence = files.map((file) => ({
      url: `/uploads/${file.filename}`,
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
      reporterType: req.userId ? "user" : "guest",
      evidence, // ✅ ONLY THIS IS USED
    });

    return res.status(201).json(report);
  } catch (err) {
    console.error("CREATE REPORT ERROR:", err);
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
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};