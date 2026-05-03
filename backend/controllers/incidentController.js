import mongoose from "mongoose";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";

/* ================= GET INCIDENTS ================= */
// Admin → all or filtered
// Student → only their own
export const getIncidents = async (req, res) => {
  try {
    // 🔐 must have userId from token middleware
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let query = {};

    // ================= ADMIN =================
    if (req.user?.role === "admin") {
      const { studentId } = req.query;

      if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
        query.studentId = new mongoose.Types.ObjectId(studentId);
      }
    }

    // ================= STUDENT =================
    else if (req.user?.role === "student") {
      const student = await Student.findOne({ createdBy: req.userId });

      if (!student) {
        return res.status(404).json({
          message: "Student profile not found",
        });
      }

      query.studentId = student._id;
    }

    // ================= DEFAULT GUARD =================
    else if (!req.user?.role) {
      return res.status(403).json({ message: "Forbidden - role missing" });
    }

    const incidents = await Incident.find(query).sort({ createdAt: -1 });

    return res.status(200).json(incidents);
  } catch (err) {
    console.error("getIncidents error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};


/* ================= CREATE INCIDENT ================= */
export const createIncident = async (req, res) => {
  try {
    const { title, date, category, action, level, studentId: adminStudentId } = req.body;

    let studentId;

    if (req.user.role === "student") {
      // Student can only create for themselves
      const student = await Student.findOne({ createdBy: req.userId });

      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      studentId = student._id;

    } else if (req.user.role === "admin") {
      // Admin must provide studentId
      if (!adminStudentId) {
        return res.status(400).json({ message: "studentId required" });
      }

      studentId = adminStudentId;

    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const incident = await Incident.create({
      studentId,
      title,
      date,
      category,
      action,
      level,
    });

    /* ===== AUTO UPDATE STUDENT STATS ===== */
    const totalIncidents = await Incident.countDocuments({ studentId });

    let riskLevel = "Low";
    const highCount = await Incident.countDocuments({ studentId, level: "High" });
    const medCount = await Incident.countDocuments({ studentId, level: "Medium" });

    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents,
      riskLevel,
    });

    res.status(201).json(incident);

  } catch (err) {
    console.error("createIncident error:", err);
    res.status(500).json({ message: err.message });
  }
};


/* ================= DELETE INCIDENT ================= */
export const deleteIncident = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const studentId = incident.studentId;

    /* ===== UPDATE STUDENT STATS AFTER DELETE ===== */
    const totalIncidents = await Incident.countDocuments({ studentId });

    let riskLevel = "Low";
    const highCount = await Incident.countDocuments({ studentId, level: "High" });
    const medCount = await Incident.countDocuments({ studentId, level: "Medium" });

    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents,
      riskLevel,
    });

    res.json({ message: "Incident deleted" });

  } catch (err) {
    console.error("deleteIncident error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findOne({
      reportId: req.params.id,   // 🔥 IMPORTANT FIX
    });

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};