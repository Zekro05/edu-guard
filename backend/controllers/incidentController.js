import mongoose from "mongoose";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";

// Get incidents for a specific student (admin or student)
export const getIncidents = async (req, res) => {
  try {
    // Make sure the request has a user (from auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    // Build query safely
    let query;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      query = { studentId: new mongoose.Types.ObjectId(studentId) };
    } else {
      query = { studentId: studentId }; // fallback if stored as string
    }

    const incidents = await Incident.find(query).sort({ date: -1 });

    res.json(incidents);
  } catch (err) {
    console.error("getIncidents error:", err);
    res.status(500).json({ message: err.message });
  }
};


// Create a new incident (student reports themselves OR admin)
export const createIncident = async (req, res) => {
  try {
    const { title, date, category, action, level, studentId: adminStudentId } = req.body;

    let studentId;

    if (req.user.role === "student") {
      // Students can only create incidents for themselves
      const student = await Student.findOne({ userId: req.userId });
      if (!student) return res.status(404).json({ message: "Student profile not found" });
      studentId = student._id;
    } else if (req.user.role === "admin") {
      // Admins must provide a studentId
      if (!adminStudentId) return res.status(400).json({ message: "studentId required" });
      studentId = adminStudentId;
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!title) return res.status(400).json({ message: "Title is required" });

    const incident = await Incident.create({
      studentId,
      title,
      date,
      category,
      action,
      level,
    });

    io.emit("activity_feed", {
  type: "incident",
  message: `⚠️ Incident created for ${incident.studentName}`,
  time: new Date(),
});

    // Update student's totalIncidents and riskLevel
    const totalIncidents = await Incident.countDocuments({ studentId });
    let riskLevel = "Low";
    const highCount = await Incident.countDocuments({ studentId, level: "High" });
    const medCount = await Incident.countDocuments({ studentId, level: "Medium" });
    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(studentId, { totalIncidents, riskLevel });

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete incident (only admins)
export const deleteIncident = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    // Update student summary
    const studentId = incident.studentId;
    const totalIncidents = await Incident.countDocuments({ studentId });
    let riskLevel = "Low";
    const highCount = await Incident.countDocuments({ studentId, level: "High" });
    const medCount = await Incident.countDocuments({ studentId, level: "Medium" });
    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(studentId, { totalIncidents, riskLevel });

    res.json({ message: "Incident deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
