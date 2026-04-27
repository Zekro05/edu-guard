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

    const newReport = new Report({
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

    const student = await Student.findOne({ createdBy: userId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const reports = await Report.find({
      studentId: student._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    console.error("Get My Reports Error:", err);
    res.status(500).json({ message: "Server error" });
  }

};
