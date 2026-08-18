import Intervention from "../models/interventionModel.js";
import Incident from "../models/incidentModel.js";

/* ================= CREATE INTERVENTION ================= */
export const createIntervention = async (req, res) => {
  try {
    const {
      studentId,
      incidentId,
      type,
      description,
      interventionBy,
      approvedBy,
    } = req.body;

    // Find the latest incident for this student
    const incident = await Incident.findOne({
      _id: incidentId,
      studentId,
    });

    if (!incident) {
      return res.status(404).json({
        message: "No incident found for this student",
      });
    }

    const adminName = interventionBy || req.user?.name || "Admin";

    // ============================================
    // CREATE INTERVENTION
    // ============================================

    const intervention = await Intervention.create({
      studentId,
      incidentId: incident._id,

      type,
      description,

      status: "active",

      createdBy: req.userId,

      interventionBy: adminName,

      approvedBy: approvedBy || adminName,

      auditLogs: [
        {
          action: "Intervention Created",
          note: description || `Intervention: ${type}`,
          by: adminName,
          time: new Date(),
        },
      ],
    });

    // ============================================
    // UPDATE INCIDENT ACTION
    // ============================================

    const readableType = {
      warning: "Warning",
      detention: "Detention",
      "call a parent": "Call Parent",
      "community service": "Community Service",
      suspension: "Suspension",
    };

    const actionName = readableType[type] || type;

    const newAction = description
      ? `${actionName} — ${description}`
      : actionName;

    if (incident.action) {
      incident.action = `${incident.action}\n• ${newAction}`;
    } else {
      incident.action = `• ${newAction}`;
    }

    await incident.save();

    console.log("✅ Incident action updated:", incident._id, incident.action);

    // ============================================
    // RESPONSE
    // ============================================

    return res.status(201).json({
      message: "Intervention created and incident updated",
      intervention,
      incident,
    });
  } catch (err) {
    console.error("createIntervention error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* ================= GET ALL INTERVENTIONS ================= */
export const getInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find()
      .populate("studentId", "name grade age gender profilePhoto")
      .populate("incidentId", "title level status")
      .sort({ createdAt: -1 });

    return res.json(interventions);
  } catch (err) {
    console.error("getInterventions error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= GET BY STUDENT ================= */
export const getStudentInterventions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const data = await Intervention.find({ studentId })
      .populate("incidentId")
      .sort({ createdAt: -1 });

    return res.json(data);
  } catch (err) {
    console.error("getStudentInterventions error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= RESOLVE INTERVENTION ================= */
export const resolveIntervention = async (req, res) => {
  try {
    const { id } = req.params;
    const { completedBy } = req.body;

    const intervention = await Intervention.findById(id);

    if (!intervention) {
      return res.status(404).json({
        message: "Intervention not found",
      });
    }

    // ============================================
    // COMPLETE INTERVENTION
    // ============================================

    intervention.status = "completed";

    const completedByName = completedBy || req.user?.name || "Guidance Admin";

    intervention.completedBy = completedByName;

    intervention.auditLogs.push({
      action: "Intervention Completed",
      note: "Marked as completed",
      by: completedByName,
      time: new Date(),
    });

    await intervention.save();

    // ============================================
    // COMPLETE ONLY THE LINKED INCIDENT
    // ============================================

    const incident = await Incident.findById(intervention.incidentId);

    if (incident) {
      incident.status = "completed";
      incident.completedAt = new Date();

      await incident.save();

      console.log("✅ Linked incident completed:", incident._id);
    }

    // ============================================
    // RESPONSE
    // ============================================

    return res.json({
      message: "Intervention and linked incident completed",
      intervention,
      incident,
    });
  } catch (err) {
    console.error("resolveIntervention error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

/* ================= DELETE INTERVENTION ================= */
export const deleteIntervention = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Intervention.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Intervention not found" });
    }

    return res.json({ message: "Intervention deleted" });
  } catch (err) {
    console.error("deleteIntervention error:", err);
    return res.status(500).json({ message: err.message });
  }
};
