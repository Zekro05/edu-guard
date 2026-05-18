import mongoose from "mongoose";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";
import { io } from "../server.js";

/* ================= GET INCIDENTS ================= */
export const getIncidents = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const incidents = await Incident.find({})
      .populate("studentId", "firstName middleName lastName studentId grade gender profilePhoto")
      .sort({ createdAt: -1 });

    return res.json(incidents);
  } catch (err) {
    console.error("getIncidents error:", err);
    return res.status(500).json({ message: err.message });
  }
};


/* ================= CREATE INCIDENT ================= */
export const createIncident = async (req, res) => {
  try {
    const {
      title,
      date,
      category,
      action,
      level,
      studentId: adminStudentId,
    } = req.body;

    let studentId;

    if (req.user.role === "student") {
      const student = await Student.findOne({ createdBy: req.userId });

      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      studentId = student._id;
    } else if (req.user.role === "admin") {
      if (!adminStudentId) {
        return res.status(400).json({ message: "studentId required" });
      }

      studentId = adminStudentId;
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const incident = await Incident.create({
      studentId,
      title,
      date,
      category,
      action,
      level,
      status: "received",
      evidence: report.evidence || [],
      caseLogs: [],
    });

    /* UPDATE STUDENT STATS */
    const totalIncidents = await Incident.countDocuments({ studentId });

    const highCount = await Incident.countDocuments({ studentId, level: "High" });
    const medCount = await Incident.countDocuments({ studentId, level: "Medium" });

    let riskLevel = "Low";
    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents,
      riskLevel,
    });

    /* 🔥 REAL-TIME */
    io.emit("caseCreated", incident);

    return res.status(201).json(incident);
  } catch (err) {
    console.error("createIncident error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= GET BY ID ================= */
export const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate(
      "studentId",
      "firstName middleName lastName grade gender studentId profilePhoto"
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    return res.json(incident);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= COMPLETE INCIDENT ================= */
export const completeIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const log = {
      stage: "completed",
      note: "Incident marked as completed",
      time: new Date(),
    };

    incident.status = "completed";
    incident.completedAt = new Date();

    incident.caseLogs.push(log);

    await incident.save();

    /* 🔥 REAL-TIME */
    io.emit("caseUpdated", incident);

    io.emit("caseLogAdded", {
      caseId: incident._id,
      log,
    });

    return res.json({
      message: "Incident marked as completed",
      incident,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE INCIDENT ================= */
export const deleteIncident = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const studentId = incident.studentId;

    await Incident.findByIdAndDelete(req.params.id);

    const totalIncidents = await Incident.countDocuments({ studentId });

    const highCount = await Incident.countDocuments({ studentId, level: "High" });
    const medCount = await Incident.countDocuments({ studentId, level: "Medium" });

    let riskLevel = "Low";
    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents,
      riskLevel,
    });

    /* 🔥 REAL-TIME */
    io.emit("caseDeleted", { caseId: req.params.id });

    return res.json({ message: "Incident deleted" });
  } catch (err) {
    console.error("deleteIncident error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= GET BY STUDENT ================= */
export const getIncidentsByStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
  return res.status(400).json({
    message: "Invalid or missing studentId",
    received: studentId,
  });
}

    const incidents = await Incident.find({
      studentId: new mongoose.Types.ObjectId(studentId),
    })
      .populate("studentId", "firstName middleName lastName studentId grade gender profilePhoto")
      .sort({ createdAt: -1 });

    return res.json(incidents);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= REQUEST STATEMENT ================= */
export const requestStudentStatement = async (req, res) => {
  try {
    const { note } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const log = {
      stage: "STATEMENT REQUESTED",
      note: note || "Student statement requested",
      time: new Date(),
    };

    incident.statementStatus = "waiting_for_response";
    incident.statementRequestedAt = new Date();
    incident.caseLogs.push(log);

    await incident.save();

    /* 🔥 REAL-TIME */
    io.emit("caseUpdated", incident);
    io.emit("caseLogAdded", { caseId: incident._id, log });

    return res.json({
      message: "Statement request sent",
      incident,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= SUBMIT STATEMENT ================= */
export const submitStudentStatement = async (req, res) => {
  try {
    const { statement } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const log = {
      stage: "STUDENT STATEMENT SUBMITTED",
      note: statement,
      time: new Date(),
    };

    incident.studentStatement = statement;
    incident.statementStatus = "submitted";
    incident.statementSubmittedAt = new Date();
    incident.caseLogs.push(log);

    await incident.save();

    /* 🔥 REAL-TIME */
    io.emit("caseUpdated", incident);
    io.emit("caseLogAdded", { caseId: incident._id, log });

    return res.json({
      message: "Statement submitted",
      incident,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= MANUAL STATEMENT ================= */
export const manualStudentStatement = async (req, res) => {
  try {
    const { statement } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const log = {
      stage: "MANUAL STATEMENT ENTRY",
      note: statement,
      time: new Date(),
    };

    incident.studentStatement = statement;
    incident.statementStatus = "manual_entry";
    incident.statementSubmittedAt = new Date();
    incident.caseLogs.push(log);

    await incident.save();

    /* 🔥 REAL-TIME */
    io.emit("caseUpdated", incident);
    io.emit("caseLogAdded", { caseId: incident._id, log });

    return res.json({
      message: "Manual statement saved",
      incident,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE STATUS ================= */
export const updateIncidentStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Not found" });
    }

    // VALIDATION (VERY IMPORTANT)
    const allowed = [
      "received",
      "reviewing",
      "waiting_for_student",
      "escalated",
      "intervention-ready",
      "completed",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    incident.status = status;

    incident.caseLogs.push({
      stage: status,
      note: note || "Status updated",
      time: new Date(),
    });

    await incident.save();

    const populated = await Incident.findById(incident._id).populate(
      "studentId",
      "firstName middleName lastName studentId grade gender profilePhoto"
    );

    // SOCKET FIX
    req.app.get("io")?.emit("caseUpdated", populated);

    return res.json({ incident: populated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};