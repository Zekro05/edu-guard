// backend/controllers/reportController.js
import Report from "../models/reportModel.js"; // make sure your model file is Report.js

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
  const { type, studentName, offenseType, location, description, date, time } = req.body;
  try {
    const newReport = new Report({
      type,
      studentName,
      offenseType,
      location,
      description,
      date,
      time,
      createdBy: req.user?._id || null, // use null if no auth middleware yet
    });
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    const role = req.role;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reports = await Report.find({ studentId: userId })
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    console.error("Get My Reports Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
