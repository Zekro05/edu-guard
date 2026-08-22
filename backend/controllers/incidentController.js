import mongoose from "mongoose";
import Incident from "../models/incidentModel.js";
import Student from "../models/studentModel.js";
import Intervention from "../models/interventionModel.js";
import Notification from "../models/Notification.js";
import User from "../models/userModel.js";
import Report from "../models/reportModel.js";
import { sendPushNotification } from "../utils/pushNotification.js";
import { io } from "../server.js";

/* ================= STUDENT NOTIFICATION HELPER ================= */

const notifyStudent = async ({
  studentId,
  title,
  message,
  type = "update",
  priority = "low",
  data = {},
}) => {
  try {
    const student = await Student.findById(studentId);

    if (!student) {
      console.log("⚠️ Student not found for notification:", studentId);
      return;
    }

    const user = await User.findOne({
      studentId: student.studentId,
    });

    if (!user) {
      console.log("⚠️ User account not found for student:", student.studentId);
      return;
    }

    /* ================= DATABASE NOTIFICATION ================= */

    await Notification.create({
      userId: user._id,
      title,
      message,
      type,
      priority,
    });

    /* ================= SOCKET.IO ================= */

    io.to(user._id.toString()).emit("newNotification", {
      id: Date.now(),
      title,
      message,
      type,
      priority,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    /* ================= PHONE PUSH NOTIFICATION ================= */

    /* ================= PHONE PUSH NOTIFICATION ================= */

    console.log("========================================");
    console.log("📱 EXPO PUSH NOTIFICATION DEBUG");
    console.log("Notification Title:", title);
    console.log("Notification Message:", message);
    console.log("Notification Type:", type);
    console.log("Status:", data?.status || "N/A");
    console.log("Incident ID:", data?.incidentId || "N/A");
    console.log("User:", user.email);
    console.log("Expo Push Token:", user.expoPushToken || "NONE");
    console.log("========================================");

    if (user.expoPushToken) {
      try {
        console.log("📤 ATTEMPTING TO SEND EXPO PUSH...");
        console.log("➡️ Status being sent:", data?.status || "N/A");

        const pushResult = await sendPushNotification({
          token: user.expoPushToken,
          title: `EduGuard 🔔`,
          body: `${title}: ${message}`,
          data: {
            type,
            ...data,
          },
        });

        console.log("✅ EXPO PUSH SEND SUCCESS");
        console.log("📌 Status:", data?.status || "N/A");
        console.log("📨 Expo Result:", pushResult);
        console.log("========================================");
      } catch (pushError) {
        console.error("❌ EXPO PUSH SEND FAILED");
        console.error("📌 Status:", data?.status || "N/A");
        console.error("❌ Error:", pushError);
        console.error("❌ Error Message:", pushError.message);
        console.log("========================================");
      }
    } else {
      console.log("❌ NO EXPO PUSH TOKEN");
      console.log("📌 Status:", data?.status || "N/A");
      console.log("👤 User:", user.email);
      console.log("========================================");
    }

    console.log("✅ Notification created for:", user.email);
  } catch (error) {
    console.error("❌ Student notification error:", error.message);
  }
};
/* ================= GET INCIDENTS ================= */
/* ================= GET INCIDENTS ================= */
export const getIncidents = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // =====================================================
    // GET LOGGED-IN USER
    // =====================================================

    const user = await User.findById(req.userId).select("role studentId email");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let query = {};

    // =====================================================
    // STUDENT → ONLY THEIR OWN INCIDENTS
    // =====================================================

    if (user.role === "student") {
      const student = await Student.findOne({
        studentId: user.studentId,
      });

      if (!student) {
        return res.status(404).json({
          message: "Student profile not found",
        });
      }

      query.studentId = student._id;
    }

    // =====================================================
    // GET INCIDENTS
    // =====================================================

    const incidents = await Incident.find(query)
      .populate(
        "studentId",
        "firstName middleName lastName studentId grade gender phone profilePhoto",
      )
      .populate({
        path: "reportId",
        populate: {
          path: "reporterId",
          model: "User",
          select: "firstName lastName name email",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // =====================================================
    // GET CONNECTED INTERVENTIONS
    // =====================================================

    const incidentIds = incidents.map((incident) => incident._id);

    const interventions = await Intervention.find({
      incidentId: { $in: incidentIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // =====================================================
    // ATTACH LATEST INTERVENTION TO EACH INCIDENT
    // =====================================================

    const formattedIncidents = incidents.map((incident) => {
      const intervention = interventions.find(
        (item) => String(item.incidentId) === String(incident._id),
      );

      return {
        ...incident,

        // =================================================
        // CONNECTED INTERVENTION
        // =================================================

        intervention: intervention || null,

        // =================================================
        // EFFECTIVE STATUS
        //
        // Intervention status has priority.
        // If no intervention exists, use incident status.
        // =================================================

        effectiveStatus: intervention ? intervention.status : incident.status,
      };
    });

    console.log(
      "✅ Incidents with interventions:",
      formattedIncidents.map((item) => ({
        incidentId: item._id,
        incidentStatus: item.status,
        interventionStatus: item.intervention?.status || null,
        effectiveStatus: item.effectiveStatus,
      })),
    );

    return res.status(200).json(formattedIncidents);
  } catch (err) {
    console.error("Get Incidents Error:", err);

    return res.status(500).json({
      message: err.message || "Server error",
    });
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

    const highCount = await Incident.countDocuments({
      studentId,
      level: "High",
    });
    const medCount = await Incident.countDocuments({
      studentId,
      level: "Medium",
    });

    let riskLevel = "Low";
    if (highCount > 0) riskLevel = "High";
    else if (medCount > 0) riskLevel = "Medium";

    await Student.findByIdAndUpdate(studentId, {
      totalIncidents,
      riskLevel,
    });

    /* ================= NOTIFICATION ================= */

    const student = await Student.findById(studentId);

    let targetUserId = null;

    if (student) {
      const user = await User.findOne({
        studentId: student.studentId,
      });

      if (user) {
        targetUserId = user._id;
      }
    }

    if (targetUserId) {
      await Notification.create({
        userId: targetUserId,
        title: "Incident Notice",
        message: `A new incident has been recorded: "${title}".`,
        type: "warning",
        priority: level?.toLowerCase() === "high" ? "high" : "medium",
      });

      io.to(targetUserId.toString()).emit("newNotification", {
        id: Date.now(),
        title: "Incident Notice",
        message: `A new incident has been recorded: "${title}".`,
        type: "warning",
        priority: level?.toLowerCase() === "high" ? "high" : "medium",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    console.log("✅ Notification sent to:", user._id.toString());

    await notifyStudent({
      studentId,
      title: "Incident Notice",
      message: `A new incident has been recorded: "${title}".`,
      type: "warning",
      priority: level?.toLowerCase() === "high" ? "high" : "medium",
      data: {
        type: "incident",
        incidentId: incident._id.toString(),
      },
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
    // =====================================================
    // GET INCIDENT
    // =====================================================

    const incident = await Incident.findById(req.params.id)
      .populate(
        "studentId",
        "firstName middleName lastName grade gender studentId profilePhoto",
      )
      .populate({
        path: "reportId",
        populate: {
          path: "reporterId",
          model: "User",
          select: "firstName lastName name email",
        },
      })
      .lean();

    if (!incident) {
      return res.status(404).json({
        message: "Incident not found",
      });
    }

    // =====================================================
    // GET CONNECTED INTERVENTION
    // =====================================================

    const intervention = await Intervention.findOne({
      incidentId: incident._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    // =====================================================
    // EFFECTIVE STATUS
    //
    // Intervention takes priority.
    // Incident status is fallback.
    // =====================================================

    const effectiveStatus = intervention
      ? intervention.status
      : incident.status;

    // =====================================================
    // DEBUG
    // =====================================================

    console.log("========== INCIDENT DETAILS STATUS ==========");

    console.log({
      incidentId: incident._id,
      incidentStatus: incident.status,
      interventionStatus: intervention?.status || null,
      effectiveStatus,
    });

    console.log("=============================================");

    // =====================================================
    // RETURN INCIDENT + INTERVENTION
    // =====================================================

    return res.json({
      ...incident,

      intervention: intervention || null,

      effectiveStatus,
    });
  } catch (err) {
    console.error("getIncidentById error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* ================= COMPLETE INCIDENT ================= */
export const completeIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        message: "Incident not found",
      });
    }

    const user = req.user;

    const log = {
      stage: "completed",
      note: "Incident marked as completed",
      time: new Date(),
      changedBy: user?._id || null,
      changedByName: user?.name || "Admin",
    };

    // =====================================================
    // UPDATE INCIDENT
    // =====================================================

    incident.status = "completed";
    incident.completedAt = new Date();

    incident.caseLogs.push(log);

    await incident.save();

    await notifyStudent({
      studentId: incident.studentId,
      title: "Incident Completed",
      message: "Your incident has been marked as completed.",
      type: "incident_completed",
      priority: "low",
      data: {
        type: "incident_completed",
        incidentId: incident._id.toString(),
      },
    });

    // =====================================================
    // UPDATE CONNECTED REPORT
    // =====================================================

    if (incident.reportId) {
      const report = await Report.findByIdAndUpdate(
        incident.reportId,
        {
          status: "completed",
        },
        {
          new: true,
        },
      );

      console.log(
        "✅ Connected report updated:",
        report?._id,
        "→",
        report?.status,
      );
    }

    // =====================================================
    // REAL-TIME INCIDENT UPDATE
    // =====================================================

    io.emit("caseUpdated", incident);

    io.emit("caseLogAdded", {
      caseId: incident._id,
      log,
    });

    // =====================================================
    // REAL-TIME REPORT UPDATE
    // =====================================================

    if (incident.reportId) {
      io.emit("reportUpdated", {
        reportId: incident.reportId,
        status: "completed",
      });
    }

    return res.json({
      message: "Incident and connected report marked as completed",
      incident,
    });
  } catch (err) {
    console.error("completeIncident error:", err);

    return res.status(500).json({
      message: err.message,
    });
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

    const highCount = await Incident.countDocuments({
      studentId,
      level: "High",
    });
    const medCount = await Incident.countDocuments({
      studentId,
      level: "Medium",
    });

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
      .populate(
        "studentId",
        "firstName middleName lastName studentId grade gender profilePhoto",
      )
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
      changedBy: req.user._id,
      changedByName: req.user.name,
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

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    incident.studentStatement = statement;

    // ✅ THIS is the key fix
    incident.status = "saved-student-statement";
    incident.statementStatus = "manual_entry";

    incident.statementSubmittedAt = new Date();

    const log = {
      stage: "saved-student-statement",
      note: statement,
      time: new Date(),
      changedBy: user._id,
      changedByName: user.name,
    };

    incident.caseLogs.push(log);

    await incident.save();

    const student = await Student.findById(incident.studentId);

    if (student) {
      const user = await User.findOne({
        studentId: student.studentId,
      });

      if (user) {
        await Notification.create({
          userId: user._id,
          title: "Incident Update",
          message: `Your incident status is now "saved-student-statement".`,
          type: "update",
          priority: "low",
        });

        io.to(user._id.toString()).emit("newNotification", {
          id: Date.now(),
          title: "Incident Update",
          message: `Your incident status is now "saved-student-statement".`,
          type: "update",
          priority: "low",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await notifyStudent({
      studentId: incident.studentId,
      title: "Incident Update",
      message: 'Your incident status is now "saved-student-statement".',
      type: "update",
      priority: "low",
      data: {
        type: "incident_update",
        incidentId: incident._id.toString(),
        status: "saved-student-statement",
      },
    });

    console.log("✅ Notification sent to:", user._id.toString());

    const populated = await Incident.findById(incident._id).populate(
      "studentId",
      "firstName middleName lastName studentId grade gender profilePhoto",
    );

    req.app.get("io")?.emit("caseUpdated", populated);

    return res.json({
      message: "Manual statement saved",
      incident: populated,
    });
  } catch (err) {
    console.error("manualStudentStatement error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE STATUS ================= */
export const updateIncidentStatus = async (req, res) => {
  console.log("=================================");
  console.log("🚨 UPDATE INCIDENT STATUS CALLED");
  console.log("Incident ID:", req.params.id);
  console.log("Requested status:", req.body.status);
  console.log("=================================");
  try {
    const { status, note, escalationInfo } = req.body;

    const incident = await Incident.findById(req.params.id);

    console.log("📌 CURRENT INCIDENT STATUS:", incident.status);
    console.log("📌 REQUESTED NEW STATUS:", status);

    if (!incident) {
      return res.status(404).json({ message: "Not found" });
    }

    const user = req.user;

    /* ================= FLOW ENFORCEMENT ================= */
    const flow = [
      "received",
      "saved-student-statement",
      "reviewing",
      "refer-for-intervention",
      "intervention-ready",
      "completed",
    ];

    const currentIndex = flow.indexOf(incident.status);
    const nextIndex = flow.indexOf(status);

    if (nextIndex === -1) {
      return res.status(400).json({
        message: "Invalid status value",
        attempted: status,
      });
    }

    // allow same or next step OR admin override
    const allowedTransitions = {
      received: ["reviewing"],
      reviewing: ["saved-student-statement", "refer-for-intervention"],
      "saved-student-statement": ["reviewing", "refer-for-intervention"],
      "refer-for-intervention": ["intervention-ready"],
      "intervention-ready": ["completed"],
      completed: [],
    };

    if (
      !allowedTransitions[incident.status]?.includes(status) &&
      status !== incident.status
    ) {
      return res.status(400).json({
        message: "Invalid status transition",
        current: incident.status,
        attempted: status,
      });
    }

    /* ================= REVIEWER TRACKING ================= */
    if (status === "reviewing" && !incident.reviewedBy) {
      incident.reviewedBy = user._id;
      incident.reviewedByName = user.name;
    }

    /* ================= UPDATE STATUS ================= */
    incident.status = status;

    if (status === "completed") {
      incident.completedAt = new Date();
    }

    /* ================= AUDIT LOG ================= */
    incident.caseLogs.push({
      stage: status,
      note: note || "",
      changedBy: user._id,
      changedByName: user.name,
      time: new Date(),
    });

    if (escalationInfo) {
      incident.escalationInfo = escalationInfo;
    }

    await incident.save();

    // =====================================================
    // SYNC CONNECTED REPORT STATUS
    // =====================================================

    if (status === "completed" && incident.reportId) {
      const report = await Report.findByIdAndUpdate(
        incident.reportId,
        {
          status: "completed",
        },
        {
          new: true,
        },
      );

      console.log(
        "✅ Report synchronized with completed incident:",
        report?._id,
        "→",
        report?.status,
      );

      // Notify connected clients
      io.emit("reportUpdated", {
        reportId: incident.reportId,
        status: "completed",
      });
    }

    const student = await Student.findById(incident.studentId);

    if (student) {
      const user = await User.findOne({
        studentId: student.studentId,
      });

      if (user) {
        await Notification.create({
          userId: user._id,
          title: "Incident Update",
          message: `Your incident status is now "${status}".`,
          type: "update",
          priority: "low",
        });

        io.to(user._id.toString()).emit("newNotification", {
          id: Date.now(),
          title: "Incident Update",
          message: `Your incident status is now "${status}".`,
          type: "update",
          priority: "low",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    console.log("========================================");
    console.log("🚨 STATUS UPDATE → PUSH NOTIFICATION");
    console.log("Incident:", incident._id.toString());
    console.log("Previous Status:", incident.status);
    console.log("New Status:", status);
    console.log("📲 Calling notifyStudent()...");
    console.log("========================================");

    await notifyStudent({
      studentId: incident.studentId,
      title: "Incident Update",
      message: `Your incident status is now "${status}".`,
      type: "update",
      priority: status === "completed" ? "low" : "medium",
      data: {
        type: "incident_update",
        incidentId: incident._id.toString(),
        status,
      },
    });

    console.log("========================================");
    console.log("🏁 notifyStudent() FINISHED");
    console.log("Status processed:", status);
    console.log("========================================");

    console.log("✅ Notification sent to:", user._id.toString());

    /* ================= POPULATE ================= */
    const populated = await Incident.findById(incident._id).populate(
      "studentId",
      "firstName middleName lastName studentId grade gender profilePhoto",
    );

    /* ================= SOCKET ================= */
    req.app.get("io")?.emit("caseUpdated", populated);

    return res.json({ incident: populated });
  } catch (err) {
    console.error("updateIncidentStatus error:", err);
    return res.status(500).json({ message: err.message });
  }
};
